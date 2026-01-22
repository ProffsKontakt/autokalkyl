# Phase 1: Foundation - Research

**Researched:** 2026-01-19
**Domain:** Authentication, multi-tenant organization management, role-based access control
**Confidence:** HIGH

## Summary

This research covers the foundation phase: authentication with Auth.js v5 (credentials provider), multi-tenant data isolation with Prisma, and role-based access control for a Next.js 15 App Router application. The stack leverages established patterns for SaaS applications with organization-based tenancy.

**Key findings:**
- Auth.js v5 is stable for production with credentials provider, though password reset requires custom implementation
- Multi-tenancy should use shared database with Prisma Client Extensions for automatic tenant filtering, backed by PostgreSQL Row-Level Security as defense-in-depth
- RBAC requires defense-in-depth: middleware + API route checks + database RLS (never rely on middleware alone due to CVE-2025-29927)
- Password reset via N8N webhook is straightforward: Next.js generates token, calls N8N webhook, N8N sends email via Gmail

**Primary recommendation:** Implement tenant-scoped Prisma client with automatic orgId filtering from the start. Add RLS policies as defense-in-depth. Use Argon2id for password hashing. Build custom password reset flow with N8N webhook.

## Standard Stack

The established libraries/tools for this phase:

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next-auth | 5.x (beta) | Authentication | Official Auth.js for Next.js, App Router native, stable for production |
| @auth/prisma-adapter | latest | Auth.js + Prisma | Official adapter for persisting users/sessions to database |
| prisma | 6.x | Database ORM | Type-safe queries, migrations, client extensions for multi-tenancy |
| @prisma/client | 6.x | Database client | Generated client with extension support |
| argon2 | 0.40+ | Password hashing | Winner of Password Hashing Competition, superior to bcrypt for modern hardware |
| zod | 3.x | Validation | Schema validation for credentials, forms, API inputs |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| bcrypt | 5.x | Password hashing (alternative) | If Argon2 causes deployment issues on platform |
| uuid | 10.x | Token generation | Password reset tokens, share codes |
| date-fns | 3.x | Date handling | Token expiration, timestamps |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Argon2 | bcrypt | bcrypt is simpler, more widely deployed, but less secure against GPU attacks |
| Auth.js credentials | Better Auth | Better Auth has built-in password reset, but less ecosystem support |
| Prisma extensions | ZenStack | ZenStack adds access policies but is a larger dependency |
| Custom RLS | Yates | Yates is a dedicated RLS library but adds complexity |

**Installation:**
```bash
# Auth
npm install next-auth@beta @auth/prisma-adapter

# Database
npm install prisma @prisma/client
npm install -D prisma

# Password hashing
npm install argon2

# Utilities
npm install zod uuid date-fns
npm install -D @types/uuid
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── forgot-password/
│   │   │   └── page.tsx
│   │   └── reset-password/
│   │       └── page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Auth guard, tenant context
│   │   ├── dashboard/
│   │   ├── organizations/          # Super Admin only
│   │   ├── users/
│   │   └── settings/
│   ├── (admin)/
│   │   ├── layout.tsx              # Super Admin guard
│   │   └── admin/
│   │       └── organizations/
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts
│   │   └── webhooks/
│   │       └── n8n/
│   │           └── route.ts
│   └── layout.tsx
├── lib/
│   ├── auth/
│   │   ├── config.ts               # Auth.js configuration
│   │   ├── permissions.ts          # RBAC definitions
│   │   └── password.ts             # Argon2 hash/verify
│   └── db/
│       ├── client.ts               # Base Prisma client
│       ├── tenant-client.ts        # Tenant-scoped extension
│       └── queries/
├── actions/
│   ├── auth.ts                     # signIn, signOut, resetPassword
│   ├── users.ts
│   └── organizations.ts
├── middleware.ts
└── auth.ts                         # NextAuth export
```

### Pattern 1: Tenant-Scoped Prisma Client

**What:** Prisma Client Extension that automatically injects orgId filter on all queries
**When to use:** Every database operation in tenant-scoped routes

```typescript
// lib/db/tenant-client.ts
// Source: https://github.com/prisma/prisma-client-extensions/tree/main/row-level-security
import { PrismaClient } from '@prisma/client'

const basePrisma = new PrismaClient()

export function createTenantClient(orgId: string) {
  return basePrisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          // Skip models that aren't tenant-scoped
          const globalModels = ['Organization', 'VerificationToken']
          if (globalModels.includes(model)) {
            return query(args)
          }

          // Inject orgId filter for reads
          if (['findMany', 'findFirst', 'findUnique', 'count', 'aggregate'].includes(operation)) {
            args.where = { ...args.where, orgId }
          }

          // Inject orgId for creates
          if (['create', 'createMany'].includes(operation)) {
            if (operation === 'create') {
              args.data = { ...args.data, orgId }
            }
          }

          // Inject orgId filter for updates/deletes
          if (['update', 'updateMany', 'delete', 'deleteMany'].includes(operation)) {
            args.where = { ...args.where, orgId }
          }

          return query(args)
        }
      }
    }
  })
}
```

### Pattern 2: Auth.js v5 with Credentials Provider

**What:** Complete Auth.js configuration for email/password authentication
**When to use:** All authentication flows

```typescript
// auth.ts
// Source: https://authjs.dev/getting-started/authentication/credentials
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/db/client"
import { verifyPassword } from "@/lib/auth/password"
import { z } from "zod"

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = signInSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { email, password } = parsed.data

        const user = await prisma.user.findUnique({
          where: { email },
          include: { organization: true }
        })

        if (!user || !user.passwordHash || !user.isActive) return null

        const isValid = await verifyPassword(password, user.passwordHash)
        if (!isValid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          orgId: user.orgId,
          orgSlug: user.organization?.slug,
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.orgId = user.orgId
        token.orgSlug = user.orgSlug
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.orgId = token.orgId as string
        session.user.orgSlug = token.orgSlug as string
      }
      return session
    }
  }
})
```

### Pattern 3: Defense-in-Depth RBAC

**What:** Role checking at multiple layers - never rely on middleware alone
**When to use:** All protected resources

```typescript
// lib/auth/permissions.ts
// Source: https://authjs.dev/guides/role-based-access-control
export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ORG_ADMIN: 'ORG_ADMIN',
  CLOSER: 'CLOSER',
} as const

export type Role = keyof typeof ROLES

export const PERMISSIONS = {
  // Organization management
  ORG_CREATE: 'org:create',
  ORG_READ_ALL: 'org:read:all',
  ORG_UPDATE: 'org:update',
  ORG_DELETE: 'org:delete',

  // User management
  USER_CREATE_ANY_ORG: 'user:create:any_org',
  USER_CREATE_OWN_ORG: 'user:create:own_org',
  USER_READ_ALL: 'user:read:all',
  USER_READ_OWN_ORG: 'user:read:own_org',
  USER_UPDATE: 'user:update',
  USER_DEACTIVATE: 'user:deactivate',
} as const

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS]

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SUPER_ADMIN: Object.values(PERMISSIONS),
  ORG_ADMIN: [
    PERMISSIONS.ORG_UPDATE, // Own org only
    PERMISSIONS.USER_CREATE_OWN_ORG,
    PERMISSIONS.USER_READ_OWN_ORG,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_DEACTIVATE,
  ],
  CLOSER: [],
}

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

export function canAccessOrg(userRole: Role, userOrgId: string | null, targetOrgId: string): boolean {
  if (userRole === 'SUPER_ADMIN') return true
  return userOrgId === targetOrgId
}
```

```typescript
// middleware.ts
// Source: https://www.jigz.dev/blogs/how-to-use-middleware-for-role-based-access-control-in-next-js-15-app-router
import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  // Public routes
  const publicRoutes = ['/login', '/forgot-password', '/reset-password']
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Require authentication for all other routes
  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Super Admin only routes
  const adminRoutes = ['/admin']
  if (adminRoutes.some(route => pathname.startsWith(route))) {
    if (session.user?.role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}
```

```typescript
// Server Action with RBAC (defense in depth - don't rely on middleware alone)
// actions/organizations.ts
"use server"

import { auth } from "@/auth"
import { hasPermission, canAccessOrg } from "@/lib/auth/permissions"
import { prisma } from "@/lib/db/client"

export async function updateOrganization(orgId: string, data: OrgUpdateInput) {
  const session = await auth()

  // Layer 1: Authentication check
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  // Layer 2: Permission check
  if (!hasPermission(session.user.role, 'org:update')) {
    throw new Error("Forbidden")
  }

  // Layer 3: Org scope check
  if (!canAccessOrg(session.user.role, session.user.orgId, orgId)) {
    throw new Error("Forbidden - cannot access this organization")
  }

  // Proceed with update
  return prisma.organization.update({
    where: { id: orgId },
    data,
  })
}
```

### Pattern 4: Password Reset via N8N Webhook

**What:** Custom password reset flow using N8N for email delivery
**When to use:** AUTH-05 password reset requirement

```typescript
// actions/auth.ts
"use server"

import { prisma } from "@/lib/db/client"
import { randomUUID } from "crypto"
import { addHours } from "date-fns"

const N8N_WEBHOOK_URL = process.env.N8N_PASSWORD_RESET_WEBHOOK_URL!

export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({ where: { email } })

  // Always return success to prevent email enumeration
  if (!user) {
    return { success: true }
  }

  // Generate secure token
  const token = randomUUID()
  const expiresAt = addHours(new Date(), 1) // 1 hour expiry

  // Store token
  await prisma.passwordResetToken.create({
    data: {
      token,
      userId: user.id,
      expiresAt,
    }
  })

  // Trigger N8N webhook to send email
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`

  await fetch(N8N_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': process.env.N8N_API_KEY!,
    },
    body: JSON.stringify({
      to: user.email,
      name: user.name,
      resetUrl,
      expiresAt: expiresAt.toISOString(),
    })
  })

  return { success: true }
}

export async function resetPassword(token: string, newPassword: string) {
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: true }
  })

  if (!resetToken || resetToken.expiresAt < new Date()) {
    throw new Error("Invalid or expired token")
  }

  const passwordHash = await hashPassword(newPassword)

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash }
    }),
    prisma.passwordResetToken.delete({
      where: { token }
    })
  ])

  return { success: true }
}
```

### Anti-Patterns to Avoid

- **Middleware-only authorization:** CVE-2025-29927 showed middleware can be bypassed. Always verify permissions in Server Actions and API routes.
- **Client-side tenant ID:** Never accept orgId from client requests. Always derive from server session.
- **Raw SQL without tenant filter:** Bypasses Prisma extensions. Use typed queries or wrap raw SQL.
- **Synchronous external calls in auth:** Don't call N8N synchronously during login. Use background jobs or fire-and-forget.
- **Storing passwords in plaintext or using weak hashing:** Always use Argon2id or bcrypt with proper work factors.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Password hashing | Custom hash function | argon2 or bcrypt | Cryptographic expertise required, timing attacks, salt handling |
| Session management | Custom JWT handling | Auth.js sessions | Token refresh, CSRF protection, secure cookies |
| Email validation | Regex patterns | zod email schema | Edge cases, internationalized domains |
| UUID generation | Math.random() | crypto.randomUUID() | Cryptographically secure randomness required |
| Rate limiting | Counter in memory | @upstash/ratelimit | Distributed, serverless-compatible |
| CSRF protection | Manual tokens | Auth.js built-in | Timing, cookie flags, token rotation |

**Key insight:** Authentication and authorization have many subtle security requirements. Use established libraries that have been security-audited.

## Common Pitfalls

### Pitfall 1: Multi-Tenant Data Leakage

**What goes wrong:** Tenant A sees Tenant B's data due to missing orgId filters
**Why it happens:** Manual filtering on every query is error-prone
**How to avoid:**
1. Use Prisma Client Extensions for automatic filtering
2. Add PostgreSQL RLS as defense-in-depth
3. Never use raw SQL without tenant context
**Warning signs:** Queries without orgId in WHERE clause, tests don't verify isolation

### Pitfall 2: Connection Pool Exhaustion

**What goes wrong:** "Timed out fetching a new connection" under load
**Why it happens:** Serverless functions create new connections on cold start
**How to avoid:**
1. Use Prisma Accelerate or Neon's connection pooler
2. Instantiate PrismaClient in global scope
3. Never call `$disconnect()` in serverless
4. Configure appropriate `connection_limit` in connection string
**Warning signs:** P1001 errors correlating with traffic spikes

### Pitfall 3: RBAC Bypass via Inconsistent Enforcement

**What goes wrong:** Users access resources beyond their role
**Why it happens:** Permission checks in middleware but not API routes
**How to avoid:**
1. Check permissions at EVERY layer (middleware + API + database)
2. Update Next.js to patched version (>= 15.2.3) for CVE-2025-29927
3. Create centralized permission checking function used everywhere
4. Write integration tests that bypass UI
**Warning signs:** Permission checks scattered, no API-level tests

### Pitfall 4: Password Reset Token Enumeration

**What goes wrong:** Attackers discover valid emails via different responses
**Why it happens:** Different responses for "email found" vs "email not found"
**How to avoid:**
1. Always return success regardless of email existence
2. Use timing-safe comparison for tokens
3. Rate limit password reset requests
4. Log attempts for monitoring
**Warning signs:** Different response times/messages for valid vs invalid emails

### Pitfall 5: JWT Token Not Updated on Role Change

**What goes wrong:** User retains old permissions after role change
**Why it happens:** JWT contains role, only refreshed on sign-in
**How to avoid:**
1. Document that role changes require re-login
2. Consider database sessions for real-time role enforcement
3. Add role version/timestamp to JWT, verify against DB on sensitive operations
**Warning signs:** Role field in JWT callback but no refresh mechanism

## Code Examples

Verified patterns from official sources:

### Prisma Schema for Multi-Tenant Auth
```prisma
// prisma/schema.prisma
// Source: https://authjs.dev/getting-started/adapters/prisma + multi-tenant extensions

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  SUPER_ADMIN
  ORG_ADMIN
  CLOSER
}

model Organization {
  id                String   @id @default(cuid())
  name              String
  slug              String   @unique
  logoUrl           String?
  primaryColor      String   @default("#3B82F6")
  secondaryColor    String   @default("#1E40AF")
  isProffsKontakt   Boolean  @default(false)
  partnerCutPercent Decimal? @db.Decimal(5, 2)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  users        User[]
  calculations Calculation[] // For future phases

  @@index([slug])
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  emailVerified DateTime?
  name          String?
  passwordHash  String?
  image         String?
  role          Role      @default(CLOSER)
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  orgId String?
  org   Organization? @relation(fields: [orgId], references: [id], onDelete: Cascade)

  accounts           Account[]
  sessions           Session[]
  passwordResetTokens PasswordResetToken[]

  @@index([orgId])
  @@index([email])
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model VerificationToken {
  identifier String
  token      String
  expires    DateTime

  @@unique([identifier, token])
}

model PasswordResetToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  expiresAt DateTime
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([token])
  @@index([userId])
}
```

### Password Hashing with Argon2
```typescript
// lib/auth/password.ts
// Source: https://guptadeepak.com/the-complete-guide-to-password-hashing-argon2-vs-bcrypt-vs-scrypt-vs-pbkdf2-2026/
import argon2 from 'argon2'

// OWASP recommended configuration for Argon2id
const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19456, // 19 MiB
  timeCost: 2,
  parallelism: 1,
}

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, ARGON2_OPTIONS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password)
  } catch {
    return false
  }
}
```

### PostgreSQL RLS Policies (Defense-in-Depth)
```sql
-- migrations/add_rls_policies.sql
-- Source: https://github.com/prisma/prisma-client-extensions/tree/main/row-level-security

-- Enable RLS on tenant-scoped tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" FORCE ROW LEVEL SECURITY;

-- Policy: Users can only see users in their org
CREATE POLICY user_tenant_isolation ON "User"
  USING (
    "orgId" = current_setting('app.current_org_id', TRUE)::text
    OR current_setting('app.bypass_rls', TRUE)::text = 'on'
  );

-- Note: Super Admin queries should set app.bypass_rls = 'on'
-- Regular queries should set app.current_org_id to user's orgId
```

### Type Extensions for Auth.js Session
```typescript
// types/next-auth.d.ts
import { DefaultSession, DefaultUser } from "next-auth"
import { Role } from "@prisma/client"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: Role
      orgId: string | null
      orgSlug: string | null
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    role: Role
    orgId: string | null
    orgSlug: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: Role
    orgId: string | null
    orgSlug: string | null
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| NextAuth v4 Pages Router | Auth.js v5 App Router | 2024 | New API, simpler config, native RSC support |
| bcrypt password hashing | Argon2id | 2015 (PHC winner), 2023 OWASP recommendation | Better GPU resistance, configurable memory hardness |
| Manual tenant filtering | Prisma Client Extensions | 2023 (GA v4.16) | Automatic, consistent, less error-prone |
| Middleware-only auth | Defense-in-depth | 2024 (CVE-2025-29927) | Security requirement, not optional |
| NEXTAUTH_SECRET | AUTH_SECRET | Auth.js v5 | Environment variable naming change |

**Deprecated/outdated:**
- `next-auth@4.x`: Use `next-auth@5.x` (beta) for App Router
- `NEXTAUTH_URL`, `NEXTAUTH_SECRET`: Use `AUTH_URL`, `AUTH_SECRET`
- Pages Router auth patterns: App Router uses Server Components and Server Actions
- SHA-256 for passwords: Use Argon2id or bcrypt

## Open Questions

Things that couldn't be fully resolved:

1. **Prisma RLS transaction limitation**
   - What we know: Prisma's RLS extension wraps queries in transactions, explicit `$transaction()` may not work as intended
   - What's unclear: Whether Prisma 6.x has addressed this limitation
   - Recommendation: Test transaction behavior, consider using Prisma Accelerate which handles this better

2. **N8N webhook security for password reset**
   - What we know: N8N webhooks should be protected with API keys or HMAC
   - What's unclear: Exact N8N configuration for Gmail SMTP (depends on user's N8N setup)
   - Recommendation: Use header-based API key authentication, document N8N workflow setup separately

3. **Auth.js v5 production readiness**
   - What we know: v5 is in beta but widely used in production
   - What's unclear: Timeline for stable release
   - Recommendation: Pin to specific beta version (e.g., 5.0.0-beta.25), test thoroughly before upgrades

## Sources

### Primary (HIGH confidence)
- [Auth.js Official Documentation](https://authjs.dev) - Installation, credentials provider, RBAC guide
- [Auth.js Prisma Adapter](https://authjs.dev/getting-started/adapters/prisma) - Schema and configuration
- [Prisma Client Extensions](https://www.prisma.io/docs/orm/prisma-client/client-extensions) - Official extension docs
- [Prisma RLS Example](https://github.com/prisma/prisma-client-extensions/tree/main/row-level-security) - Official multi-tenant example

### Secondary (MEDIUM confidence)
- [Password Hashing Guide 2025](https://guptadeepak.com/the-complete-guide-to-password-hashing-argon2-vs-bcrypt-vs-scrypt-vs-pbkdf2-2026/) - OWASP recommendations
- [Multi-Tenant RLS with Prisma](https://medium.com/@francolabuschagne90/securing-multi-tenant-applications-using-row-level-security-in-postgresql-with-prisma-orm-4237f4d4bd35) - Implementation patterns
- [Next.js 15 RBAC Middleware](https://www.jigz.dev/blogs/how-to-use-middleware-for-role-based-access-control-in-next-js-15-app-router) - Middleware patterns
- [N8N Webhook Documentation](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/) - Webhook setup

### Tertiary (LOW confidence - verify before use)
- [Complete Password Reset Guide Medium](https://medium.com/@sanyamm/complete-guide-password-reset-and-authentication-in-next-js-with-auth-js-nextauth-v5-fcf540b2a8fb) - Custom implementation patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Auth.js and Prisma are well-documented with official sources
- Architecture: HIGH - Patterns verified against official docs and project-level research
- Pitfalls: HIGH - Based on project research PITFALLS.md and CVE documentation

**Research date:** 2026-01-19
**Valid until:** 30 days (stable domain, Auth.js v5 may reach stable release)
