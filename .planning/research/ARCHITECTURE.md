# Architecture Patterns: Kalkyla.se Battery ROI Calculator

**Domain:** Multi-tenant SaaS calculation platform (Swedish battery ROI)
**Researched:** 2026-01-19
**Confidence:** HIGH (verified against Next.js official docs, Supabase patterns, and established multi-tenant SaaS architectures)

---

## Recommended Architecture

```
+-----------------------------------------------------------------------------------+
|                                    CLIENTS                                        |
+-----------------------------------------------------------------------------------+
|  Closer (Auth)              Prospect (No Auth)           Admin (Auth)            |
|  kalkyla.se/dashboard       kalkyla.se/{org}/{code}      kalkyla.se/admin        |
+-----------------------------------------------------------------------------------+
                                       |
                                       v
+-----------------------------------------------------------------------------------+
|                              NEXT.JS APP ROUTER                                   |
+-----------------------------------------------------------------------------------+
|  Middleware Layer                                                                 |
|  - Session refresh (Supabase SSR)                                                 |
|  - Tenant resolution (org-slug from URL)                                          |
|  - Public route bypass (/{org}/{shareCode} patterns)                              |
|  - RBAC enforcement (role checks for protected routes)                            |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  Route Groups                                                                     |
|  +----------------+  +------------------+  +------------------+                   |
|  | (auth)         |  | (public)         |  | (admin)          |                   |
|  | /login         |  | /[org]/[code]    |  | /admin/*         |                   |
|  | /register      |  | (no auth req)    |  | Super Admin only |                   |
|  | /forgot-pass   |  |                  |  |                  |                   |
|  +----------------+  +------------------+  +------------------+                   |
|                                                                                   |
|  +---------------------------------------------------------------------+          |
|  | (dashboard) - Protected, org-scoped                                 |          |
|  | /dashboard                 /calculations            /settings       |          |
|  | /calculations/new          /calculations/[id]       /users          |          |
|  | /batteries                 /natägare                                |          |
|  +---------------------------------------------------------------------+          |
|                                                                                   |
+-----------------------------------------------------------------------------------+
|                              SERVER COMPONENTS                                    |
|  - Data fetching with tenant-scoped Prisma client                                 |
|  - Server Actions for mutations                                                   |
|  - Streaming with Suspense for loading states                                     |
+-----------------------------------------------------------------------------------+
                                       |
                                       v
+-----------------------------------------------------------------------------------+
|                              DATA ACCESS LAYER                                    |
+-----------------------------------------------------------------------------------+
|  Tenant-Scoped Prisma Client                                                      |
|  - Extension injects orgId filter on ALL queries                                  |
|  - Prevents cross-tenant data access at ORM level                                 |
|  - createTenantClient(orgId) factory function                                     |
+-----------------------------------------------------------------------------------+
                                       |
                                       v
+-----------------------------------------------------------------------------------+
|                              DATABASE LAYER                                       |
+-----------------------------------------------------------------------------------+
|  PostgreSQL (Supabase)                                                            |
|  - Row Level Security (RLS) as defense-in-depth                                   |
|  - Connection pooling via Supabase/PgBouncer                                      |
|  - Indexes on all orgId columns                                                   |
+-----------------------------------------------------------------------------------+
                                       |
                                       v
+-----------------------------------------------------------------------------------+
|                              EXTERNAL SERVICES                                    |
+-----------------------------------------------------------------------------------+
|  +-------------+  +-------------+  +-------------+  +-------------+               |
|  | Supabase    |  | PostHog     |  | N8N         |  | Nord Pool   |               |
|  | Auth        |  | Analytics   |  | Webhooks    |  | Spot Prices |               |
|  | (SSR flow)  |  | (client)    |  | (server)    |  | (cached)    |               |
|  +-------------+  +-------------+  +-------------+  +-------------+               |
+-----------------------------------------------------------------------------------+
```

---

## Component Boundaries

### 1. Presentation Layer (Next.js App Router)

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| Middleware | Session refresh, tenant resolution, route guards | Supabase Auth, Route handlers |
| Route Groups | URL organization, layout composition | Layout components, Server Components |
| Server Components | Data fetching, initial render | Data Access Layer, Suspense boundaries |
| Client Components | Interactivity, live calculations | Local state, Server Actions |
| Server Actions | Mutations, form handling | Data Access Layer, External Services |

**Boundaries:**
- Server Components NEVER import client-side libraries
- Client Components marked with `"use client"` directive
- Data fetching happens in Server Components, passed as props to Client Components
- Server Actions handle all mutations (no direct API routes for CRUD)

### 2. Data Access Layer

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| TenantPrismaClient | Org-scoped database operations | PostgreSQL |
| CalculationEngine | ROI computation logic | TenantPrismaClient, PriceCache |
| PriceCache | Nord Pool price storage/retrieval | Redis/KV, Nord Pool API |
| ShareTokenService | Generate/validate share tokens | TenantPrismaClient |

**Boundaries:**
- ALL database access goes through TenantPrismaClient
- Business logic (calculation engine) is pure functions, testable in isolation
- External API calls are wrapped in service classes with retry logic
- Cache layer sits between application and external APIs

### 3. Authentication Layer

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| Supabase Auth | Session management, JWT tokens | Supabase, Middleware |
| RBAC Service | Permission checks | Session, Route handlers |
| Tenant Context | Current org resolution | URL params, Session |

**Boundaries:**
- Auth state flows: Cookie -> Middleware -> Server Components
- Role checks happen at multiple layers (defense in depth)
- Tenant ID stored in JWT claims for efficient access

### 4. External Integrations

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| N8N Webhook Handler | Receive/send automation triggers | API Routes, N8N |
| PostHog Provider | Analytics tracking | Client Components |
| Nord Pool Fetcher | Price data synchronization | Cron job, PriceCache |

**Boundaries:**
- Webhooks authenticated via HMAC signatures
- External API calls wrapped with circuit breakers
- Analytics runs client-side only (no SSR)

---

## Data Flow

### Flow 1: Closer Creates Calculation

```
1. Closer navigates to /calculations/new
   |
2. Middleware: Verify session, extract orgId from JWT
   |
3. Server Component: Fetch org's battery catalog, natägare list
   |-- TenantPrismaClient.battery.findMany() [auto-filtered by orgId]
   |-- TenantPrismaClient.natägare.findMany()
   |
4. Client Component: Render calculation form
   |
5. User fills form, clicks "Calculate"
   |
6. Client: Compute ROI locally (immediate feedback)
   |-- CalculationEngine.computeROI(inputs)
   |
7. User clicks "Save"
   |
8. Server Action: createCalculation(formData)
   |-- Validate inputs
   |-- TenantPrismaClient.calculation.create({ orgId, ...data })
   |-- Generate shareCode: crypto.randomUUID()
   |
9. Server Action returns: { id, shareCode, shareUrl }
   |
10. Redirect to /calculations/[id]
```

### Flow 2: Prospect Views Shared Calculation

```
1. Prospect opens kalkyla.se/acme-solar/abc123def
   |
2. Middleware: Detect public route pattern, SKIP auth check
   |
3. Server Component: Fetch calculation by orgSlug + shareCode
   |-- prisma.calculation.findFirst({
   |     where: { org: { slug: 'acme-solar' }, shareCode: 'abc123def' }
   |   })
   |
4. Validate: Check expiresAt, check isPublic flag
   |
5. Server Component: Fetch related data
   |-- Org branding (logo, colors)
   |-- Battery config
   |-- Cached electricity prices for calculation date range
   |
6. Log access: Insert into calculation_views table
   |
7. Render public view with org branding
   |
8. Client Component: Interactive consumption adjustment (optional)
   |-- Local recalculation, no server round-trip
   |-- "Request updated quote" button -> mailto: link
```

### Flow 3: Real-Time Calculation Updates

```
1. User adjusts consumption slider
   |
2. Client Component: Debounce input (200ms)
   |
3. Local state update triggers recalculation
   |
4. useDeferredValue for non-urgent UI updates
   |
5. CalculationEngine.computeROI(newInputs)
   |-- Pure function, runs in main thread
   |-- Uses Decimal.js for precision
   |
6. Update results display
   |
7. No server round-trip (all client-side)
```

### Flow 4: Margin Alert Webhook (N8N)

```
1. Closer saves calculation with low margin
   |
2. Server Action: createCalculation()
   |
3. After save: Check margin threshold
   |-- if (calculation.marginPercent < org.marginAlertThreshold)
   |
4. Call N8N webhook (background)
   |-- POST https://n8n.example.com/webhook/margin-alert
   |-- Headers: { 'X-Signature': hmacSignature }
   |-- Body: { orgId, calculationId, margin, closerEmail }
   |
5. N8N workflow:
   |-- Verify HMAC signature
   |-- Send Slack notification to org admin
   |-- Email alert to closer's manager
```

---

## Multi-Tenancy Strategy

### Approach: Shared Database with Row-Level Filtering

**Why this approach:**
- Cost-effective for initial scale (< 1000 orgs)
- Simpler operations than schema-per-tenant
- Supabase RLS provides database-level enforcement
- Prisma Client Extensions provide ORM-level enforcement

### Implementation Layers

```
Layer 1: Prisma Client Extension (Primary)
+-----------------------------------------------+
| const tenantClient = prisma.$extends({        |
|   query: {                                    |
|     $allModels: {                             |
|       async $allOperations({ args, query }) { |
|         args.where = { ...args.where, orgId };|
|         return query(args);                   |
|       }                                       |
|     }                                         |
|   }                                           |
| });                                           |
+-----------------------------------------------+

Layer 2: Row-Level Security (Defense-in-Depth)
+-----------------------------------------------+
| CREATE POLICY tenant_isolation ON calculations|
|   USING (org_id = current_setting('app.org')::uuid);
+-----------------------------------------------+

Layer 3: API Route Validation (Belt-and-Suspenders)
+-----------------------------------------------+
| // In every API route/Server Action           |
| const session = await auth();                 |
| if (resource.orgId !== session.user.orgId) { |
|   throw new ForbiddenError();                 |
| }                                             |
+-----------------------------------------------+
```

### Tenant Resolution Flow

```
Request arrives
    |
    v
Middleware extracts tenant context:
    |
    +-- Authenticated routes: orgId from JWT claims
    |
    +-- Public routes: orgSlug from URL, lookup orgId
    |
    v
Create tenant-scoped Prisma client
    |
    v
All queries automatically filtered
```

### Data Model Tenant Scoping

```prisma
// ALWAYS scoped to org
model Calculation {
  id        String   @id @default(cuid())
  orgId     String   // Foreign key to Organization
  org       Organization @relation(fields: [orgId], references: [id])
  // ... other fields

  @@index([orgId])  // Critical for performance
  @@index([orgId, createdAt])
}

// Org-scoped reference data
model BatteryConfig {
  id        String   @id @default(cuid())
  orgId     String
  org       Organization @relation(fields: [orgId], references: [id])
  // ...

  @@index([orgId])
}

// Global reference data (not scoped)
model Natägare {
  id        String   @id @default(cuid())
  name      String
  // Shared across all orgs
}

model ElectricityPrice {
  id        String   @id @default(cuid())
  elområde  String   // SE1, SE2, SE3, SE4
  timestamp DateTime
  priceOre  Int      // Store as integer öre
  // Shared across all orgs
}
```

---

## Role-Based Access Control

### Role Hierarchy

```
Super Admin (Platform Level)
    |-- Can access ALL organizations
    |-- Can create/delete organizations
    |-- Can manage platform settings
    |
    v
Org Admin (Organization Level)
    |-- Scoped to ONE organization
    |-- Can manage users within org
    |-- Can configure org settings, branding
    |-- Can view all calculations in org
    |
    v
Closer (Team Member Level)
    |-- Scoped to ONE organization
    |-- Can create/view/edit own calculations
    |-- Cannot see other closers' calculations (optional)
    |-- Cannot manage users or settings
    |
    v
Prospect (Unauthenticated)
    |-- View-only access via share links
    |-- No login required
    |-- Access scoped to single calculation
```

### Permission Matrix

| Action | Super Admin | Org Admin | Closer | Prospect |
|--------|-------------|-----------|--------|----------|
| View any org | Yes | No | No | No |
| Create org | Yes | No | No | No |
| Delete org | Yes | No | No | No |
| Manage org users | Yes | Yes | No | No |
| View org settings | Yes | Yes | No | No |
| Edit org branding | Yes | Yes | No | No |
| Create calculation | Yes | Yes | Yes | No |
| View own calculations | Yes | Yes | Yes | N/A |
| View all org calculations | Yes | Yes | Config | No |
| Share calculation link | Yes | Yes | Yes | No |
| View shared calculation | Yes | Yes | Yes | Yes |
| Edit calculation | Yes | Yes | Owner | No |
| Delete calculation | Yes | Yes | Owner | No |
| Manage battery catalog | Yes | Yes | No | No |

### Implementation Pattern

```typescript
// lib/permissions.ts
export const PERMISSIONS = {
  ORG_CREATE: 'org:create',
  ORG_DELETE: 'org:delete',
  ORG_MANAGE_USERS: 'org:manage_users',
  ORG_VIEW_SETTINGS: 'org:view_settings',
  ORG_EDIT_BRANDING: 'org:edit_branding',
  CALC_CREATE: 'calc:create',
  CALC_VIEW_ALL: 'calc:view_all',
  CALC_EDIT_ANY: 'calc:edit_any',
  BATTERY_MANAGE: 'battery:manage',
} as const;

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SUPER_ADMIN: Object.values(PERMISSIONS),
  ORG_ADMIN: [
    PERMISSIONS.ORG_MANAGE_USERS,
    PERMISSIONS.ORG_VIEW_SETTINGS,
    PERMISSIONS.ORG_EDIT_BRANDING,
    PERMISSIONS.CALC_CREATE,
    PERMISSIONS.CALC_VIEW_ALL,
    PERMISSIONS.CALC_EDIT_ANY,
    PERMISSIONS.BATTERY_MANAGE,
  ],
  CLOSER: [
    PERMISSIONS.CALC_CREATE,
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
```

---

## Suggested Build Order

Based on dependencies between components, build in this order:

### Phase 1: Foundation (Weeks 1-2)

**Must build first - everything depends on this:**

```
1. Database Schema + Prisma Setup
   |-- Organization, User, Role tables
   |-- RLS policies enabled
   |-- Connection pooling configured
   |
2. Supabase Auth Integration
   |-- Cookie-based SSR auth
   |-- Middleware for session refresh
   |-- JWT claims with orgId, role
   |
3. Tenant-Scoped Prisma Client
   |-- Extension for automatic filtering
   |-- createTenantClient factory
   |
4. RBAC Foundation
   |-- Permission definitions
   |-- Role checking utilities
   |-- Middleware integration
   |
5. Basic App Shell
   |-- Route groups structure
   |-- Layout components
   |-- Protected route wrapper
```

**Why this order:**
- Auth required before any protected routes
- Tenant scoping required before any data operations
- RBAC required before any authorization logic
- Shell provides structure for all subsequent features

### Phase 2: Core Calculator (Weeks 3-4)

**Depends on: Phase 1 complete**

```
1. Reference Data Setup
   |-- Natägare seeding
   |-- Electricity price caching infrastructure
   |
2. Battery Catalog CRUD
   |-- Server Actions for management
   |-- Admin UI
   |
3. Calculation Engine
   |-- ROI computation (Decimal.js)
   |-- Spotpris savings
   |-- Effekttariff savings
   |-- Grön Teknik deductions
   |
4. Calculation Builder UI
   |-- Form components
   |-- Real-time updates (debounced)
   |-- Results display
   |
5. Calculation CRUD
   |-- Create, Read, Update, Delete
   |-- List view with filtering
```

**Why this order:**
- Reference data needed before calculations
- Engine logic needed before UI
- CRUD needed for persistence

### Phase 3: Sharing (Week 5)

**Depends on: Phase 2 complete (calculations exist)**

```
1. Share Token Generation
   |-- Cryptographically secure tokens
   |-- Expiration handling
   |
2. Public View Route
   |-- No-auth access pattern
   |-- Org branding application
   |
3. Interactive Consumption Adjustment
   |-- Client-side recalculation
   |-- No server round-trips
   |
4. Access Logging
   |-- View tracking
   |-- Analytics hooks
```

### Phase 4: Integrations (Week 6)

**Depends on: Phase 3 complete**

```
1. PostHog Analytics
   |-- Provider setup
   |-- Event tracking
   |-- Feature flags (optional)
   |
2. N8N Webhook Integration
   |-- Margin alerts
   |-- HMAC authentication
   |
3. Nord Pool Price Sync
   |-- Cron job setup
   |-- Price caching
   |
4. PDF Export (Optional)
   |-- Template design
   |-- Generation service
```

---

## Technology Decisions

### Why Supabase over NextAuth

| Criterion | Supabase Auth | NextAuth |
|-----------|--------------|----------|
| SSR support | Native, cookie-based | Requires configuration |
| RLS integration | Built-in with `auth.uid()` | Separate setup |
| Serverless pooling | Included | N/A |
| Credentials provider | Built-in | Supported but discouraged |
| Realtime (future) | Built-in | N/A |
| Swedish market | No restrictions | No restrictions |

**Decision:** Use Supabase Auth for tight RLS integration and simpler serverless setup.

### Why Server Actions over API Routes

| Criterion | Server Actions | API Routes |
|-----------|---------------|------------|
| Type safety | End-to-end with TypeScript | Manual typing |
| Progressive enhancement | Works without JS | Requires JS |
| Caching integration | Built-in revalidation | Manual |
| Colocation | With components | Separate files |
| Form handling | Native | Manual |

**Decision:** Use Server Actions for all mutations; API Routes only for webhooks and external integrations.

### Why Client-Side Calculation

| Criterion | Client-Side | Server-Side |
|-----------|-------------|-------------|
| Latency | Instant | 100-500ms per request |
| Server cost | None | Scales with usage |
| Offline capable | Yes | No |
| Complexity | Pure functions | API plumbing |

**Decision:** Perform ROI calculations client-side for instant feedback. Server only validates and persists.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Middleware-Only Authorization

**What:** Relying solely on Next.js middleware for auth/authz.
**Why bad:** CVE-2025-29927 showed middleware can be bypassed with headers.
**Instead:** Defense in depth - middleware + API route + database RLS.

### Anti-Pattern 2: Client-Side Tenant Switching

**What:** Allowing client to specify orgId in requests.
**Why bad:** Trivial to manipulate, leads to data leakage.
**Instead:** Always derive orgId from server-side session.

### Anti-Pattern 3: Raw SQL Without Tenant Filter

**What:** Using `prisma.$queryRaw` without orgId in WHERE clause.
**Why bad:** Bypasses Prisma extension, exposes all tenants' data.
**Instead:** Use typed Prisma queries, or wrap raw SQL in tenant-aware helper.

### Anti-Pattern 4: Synchronous External API Calls

**What:** Calling Nord Pool API during calculation request.
**Why bad:** Adds latency, fails when API is down, rate limiting.
**Instead:** Pre-fetch and cache prices; use cached data in calculations.

### Anti-Pattern 5: Storing Calculations in Client State

**What:** Keeping all calculation data in React state, persisting on explicit save.
**Why bad:** Data loss on navigation, browser close, or crash.
**Instead:** Auto-save drafts to database with debouncing.

### Anti-Pattern 6: Monolithic Calculation Function

**What:** Single 500-line function that does all ROI calculations.
**Why bad:** Untestable, hard to modify, can't be parallelized.
**Instead:** Pure functions per calculation type, composed together.

---

## Scalability Considerations

| Concern | At 100 users | At 10K users | At 1M users |
|---------|--------------|--------------|-------------|
| Database connections | Supabase default pool | Monitor, tune pool size | Consider read replicas |
| Cold starts | Acceptable (< 2s) | Optimize bundle, Prisma engine | Edge functions where possible |
| Price data storage | Single table | Partition by date | Time-series DB (TimescaleDB) |
| Calculation throughput | N/A (client-side) | N/A | N/A |
| Shareable link access | Rate limit | CDN caching | Edge caching, regional |
| Analytics volume | PostHog free tier | PostHog paid | Sample or aggregate |

---

## Folder Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   └── forgot-password/
│   │
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Auth guard, org context
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── calculations/
│   │   │   ├── page.tsx            # List
│   │   │   ├── new/
│   │   │   │   └── page.tsx        # Create
│   │   │   └── [id]/
│   │   │       ├── page.tsx        # View/Edit
│   │   │       └── share/
│   │   │           └── page.tsx    # Share settings
│   │   ├── batteries/
│   │   ├── natägare/
│   │   ├── users/
│   │   └── settings/
│   │
│   ├── (public)/
│   │   └── [org]/
│   │       └── [shareCode]/
│   │           └── page.tsx        # Public calculation view
│   │
│   ├── (admin)/
│   │   ├── layout.tsx              # Super Admin guard
│   │   ├── admin/
│   │   │   ├── organizations/
│   │   │   └── platform/
│   │
│   ├── api/
│   │   └── webhooks/
│   │       └── n8n/
│   │           └── route.ts        # N8N webhook handler
│   │
│   ├── layout.tsx                  # Root layout, providers
│   └── globals.css
│
├── components/
│   ├── ui/                         # shadcn/ui components
│   ├── forms/
│   │   ├── calculation-form.tsx
│   │   └── battery-form.tsx
│   ├── calculation/
│   │   ├── consumption-grid.tsx
│   │   ├── results-display.tsx
│   │   └── roi-chart.tsx
│   └── layout/
│       ├── nav.tsx
│       └── org-switcher.tsx
│
├── lib/
│   ├── db/
│   │   ├── client.ts               # Prisma client
│   │   ├── tenant-client.ts        # Tenant-scoped extension
│   │   └── queries/
│   │       ├── calculations.ts
│   │       └── organizations.ts
│   ├── auth/
│   │   ├── supabase-client.ts
│   │   ├── supabase-server.ts
│   │   └── permissions.ts
│   ├── calculation/
│   │   ├── engine.ts               # Core ROI computation
│   │   ├── spotpris.ts
│   │   ├── effekttariff.ts
│   │   └── gron-teknik.ts
│   ├── integrations/
│   │   ├── nordpool.ts
│   │   ├── n8n.ts
│   │   └── posthog.ts
│   └── utils/
│       ├── decimal.ts              # Decimal.js helpers
│       └── dates.ts                # Timezone utilities
│
├── actions/
│   ├── calculations.ts
│   ├── organizations.ts
│   ├── users.ts
│   └── batteries.ts
│
├── providers/
│   ├── posthog-provider.tsx
│   └── tenant-provider.tsx
│
├── hooks/
│   ├── use-calculation.ts
│   └── use-debounce.ts
│
└── types/
    ├── calculation.ts
    ├── organization.ts
    └── database.ts
```

---

## Sources

### Multi-Tenant Architecture
- [Next.js Official Multi-Tenant Guide](https://nextjs.org/docs/app/guides/multi-tenant) - Official routing patterns
- [Update.dev Multi-Tenancy Guide](https://update.dev/blog/how-to-implement-multi-tenancy-in-next-js-a-complete-guide) - Comprehensive implementation patterns
- [Medium: Multi-Tenant Architecture in Next.js](https://medium.com/@itsamanyadav/multi-tenant-architecture-in-next-js-a-complete-guide-25590c052de0) - Practical examples
- [ZenStack Multi-Tenant Approaches](https://zenstack.dev/blog/multi-tenant) - Prisma-specific patterns

### Row Level Security
- [Supabase RLS Documentation](https://supabase.com/docs/guides/database/postgres/row-level-security) - Official RLS guide
- [AntStack Multi-Tenant RLS](https://www.antstack.com/blog/multi-tenant-applications-with-rls-on-supabase-postgress/) - Practical implementation
- [Medium: RLS with Prisma ORM](https://medium.com/@francolabuschagne90/securing-multi-tenant-applications-using-row-level-security-in-postgresql-with-prisma-orm-4237f4d4bd35) - Prisma + PostgreSQL RLS

### Next.js Patterns
- [Next.js Project Structure](https://nextjs.org/docs/app/getting-started/project-structure) - Official folder conventions
- [Next.js Data Fetching Patterns](https://nextjs.org/docs/14/app/building-your-application/data-fetching/patterns) - Server/client patterns
- [Next.js Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components) - Component boundaries
- [Medium: App Router Best Practices 2025](https://medium.com/better-dev-nextjs-react/inside-the-app-router-best-practices-for-next-js-file-and-directory-structure-2025-edition-ed6bc14a8da3) - Structure recommendations

### Authentication and RBAC
- [Supabase Auth for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs) - SSR auth setup
- [Auth.js RBAC Guide](https://authjs.dev/guides/role-based-access-control) - Role-based access patterns
- [Medium: RBAC in Next.js](https://medium.com/@mkilincaslan/rbac-in-next-js-with-nextauth-b438fe59eeeb) - Implementation patterns
- [Medium: Next.js Authentication Guards](https://imhardikdesai.medium.com/next-js-authentication-guards-securing-routes-for-authorized-guest-and-public-users-718af8a051d5) - Guest/public route patterns

### Real-Time Updates
- [SSE in Next.js](https://www.pedroalonso.net/blog/sse-nextjs-real-time-notifications/) - Server-Sent Events pattern
- [Supabase Realtime with Next.js](https://supabase.com/docs/guides/realtime/realtime-with-nextjs) - Real-time subscriptions

### Integrations
- [PostHog Next.js Docs](https://posthog.com/docs/libraries/next-js) - Analytics integration
- [N8N Webhook Documentation](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/) - Webhook patterns

### API Design
- [MakerKit: Next.js API Best Practices](https://makerkit.dev/blog/tutorials/nextjs-api-best-practices) - Route organization
- [Medium: Managing API Routes at Scale](https://medium.com/@farihatulmaria/how-to-efficiently-manage-api-routes-in-large-scale-next-js-applications-7271801d20f3) - Large-scale patterns
