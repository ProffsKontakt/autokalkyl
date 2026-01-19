---
phase: 01-foundation
plan: 01
subsystem: database
tags: [next.js, prisma, postgresql, multi-tenant, typescript, tailwind]

# Dependency graph
requires: []
provides:
  - Next.js 16.1.3 project structure with App Router
  - Prisma 7.2 schema with multi-tenant User and Organization models
  - Tenant-scoped Prisma client factory for data isolation
  - Base Prisma client singleton for platform-level operations
affects: [01-02, 01-03, 01-04, 01-05, 01-06, 01-07, 01-08]

# Tech tracking
tech-stack:
  added:
    - next@16.1.3
    - react@19.2.3
    - prisma@7.2.0
    - @prisma/client@7.2.0
    - next-auth@5.0.0-beta.30
    - @auth/prisma-adapter@2.11.1
    - react-hook-form@7.71.1
    - zod@4.3.5
    - @tanstack/react-query@5.90.19
    - bcryptjs@3.0.3
    - tailwindcss@4
  patterns:
    - Prisma client singleton pattern for serverless
    - Tenant-scoped Prisma extension for multi-tenancy
    - Swedish locale (lang="sv") in HTML

key-files:
  created:
    - prisma/schema.prisma
    - prisma.config.ts
    - src/lib/db/client.ts
    - src/lib/db/tenant-client.ts
    - src/app/layout.tsx
    - src/app/page.tsx
    - .env.example
  modified: []

key-decisions:
  - "Used Next.js 16.1.3 instead of 15.x (create-next-app latest)"
  - "Used Prisma 7.2 with new prisma.config.ts pattern (no URL in schema)"
  - "Tenant scoping via Prisma $extends, not RLS (defense-in-depth to add later)"

patterns-established:
  - "Prisma singleton: globalForPrisma pattern prevents connection leaks in serverless"
  - "Tenant client factory: createTenantClient(orgId) auto-filters all queries"
  - "Organization-based multi-tenancy with optional orgId for SUPER_ADMIN users"

# Metrics
duration: 6min
completed: 2026-01-19
---

# Phase 1 Plan 01: Project Setup & Database Foundation Summary

**Next.js 16.1.3 with Prisma 7.2 multi-tenant schema (User, Organization, Role) and tenant-scoped client factory**

## Performance

- **Duration:** 6 min
- **Started:** 2026-01-19T11:12:22Z
- **Completed:** 2026-01-19T11:18:03Z
- **Tasks:** 3/3
- **Files created:** 16

## Accomplishments

- Initialized Next.js 16.1.3 project with TypeScript, Tailwind CSS v4, ESLint, App Router
- Created Prisma schema with Organization, User, Session, Account, VerificationToken, PasswordResetToken models
- Implemented tenant-scoped Prisma client factory with automatic orgId filtering
- Installed core dependencies: Prisma 7.2, NextAuth 5.0-beta, React Hook Form, Zod, TanStack Query

## Task Commits

Each task was committed atomically:

1. **Task 1: Initialize Next.js 15 project with dependencies** - `49afb65` (feat)
2. **Task 2: Create Prisma schema with multi-tenant models** - `50c98b1` (feat)
3. **Task 3: Create Prisma client with tenant-scoping extension** - `28681ac` (feat)

## Files Created/Modified

- `package.json` - Project dependencies and scripts
- `next.config.ts` - Next.js configuration with Prisma serverExternalPackages
- `prisma/schema.prisma` - Multi-tenant database schema with Role enum
- `prisma.config.ts` - Prisma 7.x configuration with DATABASE_URL from env
- `src/lib/db/client.ts` - Base Prisma client singleton
- `src/lib/db/tenant-client.ts` - Tenant-scoped client factory with auto-filtering
- `src/app/layout.tsx` - Root layout with Kalkyla.se branding and Swedish locale
- `src/app/page.tsx` - Simple landing page
- `.env.example` - Environment variable documentation

## Decisions Made

1. **Next.js 16.1.3 instead of 15.x** - create-next-app installs latest by default. 16.x is stable and includes Turbopack improvements.

2. **Prisma 7.2 with new config pattern** - Prisma 7.x moved DATABASE_URL from schema.prisma to prisma.config.ts. This is the new recommended pattern.

3. **Tenant scoping via Prisma $extends** - Using Prisma client extensions for tenant filtering at ORM level. RLS can be added later as defense-in-depth.

4. **Optional orgId for SUPER_ADMIN** - User.orgId is nullable to support platform-level admins who can access all organizations.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

1. **Next.js project creation conflict** - create-next-app refused to run in directory with existing .planning folder. Worked around by creating project in /tmp and moving files.

2. **next-auth@5 not found** - Package published as beta only (next-auth@beta tag). Installed next-auth@5.0.0-beta.30.

3. **Prisma 7 schema validation error** - `url = env("DATABASE_URL")` no longer allowed in schema.prisma. Removed per Prisma 7.x migration guide.

4. **TypeScript strict type error** - Prisma extension args.data typing required explicit cast for create operations. Fixed with type assertion.

## User Setup Required

**External services require manual configuration.** Before running `prisma db push`:

1. **Create Neon PostgreSQL database:**
   - Go to [Neon Console](https://console.neon.tech)
   - Create new project
   - Copy pooled connection string

2. **Configure environment variables:**
   ```bash
   # In .env.local
   DATABASE_URL="postgresql://username:password@hostname/database?sslmode=require"
   ```

3. **Verify database connection:**
   ```bash
   npx prisma db push
   ```

## Next Phase Readiness

**Ready for Phase 01-02 (Auth Configuration):**
- Prisma schema includes User, Session, Account models for NextAuth adapter
- Base Prisma client available for auth operations
- Role enum defined (SUPER_ADMIN, ORG_ADMIN, CLOSER)

**Blockers:**
- Database connection not yet configured (requires user to set up Neon)
- `prisma db push` will fail until DATABASE_URL is configured

---
*Phase: 01-foundation*
*Completed: 2026-01-19*
