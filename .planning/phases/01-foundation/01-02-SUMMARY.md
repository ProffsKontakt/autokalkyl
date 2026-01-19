---
phase: 01-foundation
plan: 02
subsystem: auth
tags: [auth.js, next-auth, jwt, rbac, credentials, middleware]

# Dependency graph
requires:
  - phase: 01-01
    provides: Prisma schema with User model, Role enum, and db client
provides:
  - Auth.js v5 configuration with credentials provider
  - JWT sessions with role/orgId/orgSlug claims
  - Route protection middleware for /dashboard and /admin
  - RBAC permission system with hasPermission() and canAccessOrg()
affects: [01-03, 01-04, 02-01, 02-02]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Edge-compatible auth config (auth.config.ts) for middleware
    - JWT strategy with custom claims for stateless auth
    - Credentials-only auth (no PrismaAdapter needed)
    - RBAC with role-permission mapping

key-files:
  created:
    - src/lib/auth/auth.ts
    - src/lib/auth/auth.config.ts
    - src/lib/auth/credentials.ts
    - src/lib/auth/permissions.ts
    - src/middleware.ts
    - src/app/api/auth/[...nextauth]/route.ts
    - src/types/next-auth.d.ts
  modified:
    - scripts/run-migration.ts

key-decisions:
  - "No PrismaAdapter - credentials-only auth doesn't need OAuth account linking"
  - "JWT strategy - stateless auth works well with serverless"
  - "Edge-compatible split - auth.config.ts for middleware, auth.ts for credentials"

patterns-established:
  - "Route protection: middleware as first defense, API routes must also verify"
  - "Permission checking: hasPermission(role, permission) pattern"
  - "Org access: canAccessOrg(userRole, userOrgId, targetOrgId) pattern"

# Metrics
duration: 3min
completed: 2026-01-19
---

# Phase 1 Plan 02: Auth Configuration Summary

**Auth.js v5 with credentials provider, JWT sessions containing role/orgId/orgSlug, route middleware, and RBAC permission system**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-19T12:50:42Z
- **Completed:** 2026-01-19T12:53:33Z
- **Tasks:** 3/3
- **Files created:** 7
- **Files modified:** 1

## Accomplishments

- Configured Auth.js v5 with credentials provider for email/password login
- JWT sessions contain custom claims: role, orgId, orgSlug for authorization
- Middleware protects /dashboard and /admin routes, redirects unauthenticated users to /login
- RBAC permission system enforces role hierarchy (SUPER_ADMIN > ORG_ADMIN > CLOSER)

## Task Commits

Each task was committed atomically:

1. **Task 1: Configure Auth.js v5 with credentials provider** - `0fa4c87` (feat)
2. **Task 2: Create middleware for route protection** - `659cfbd` (feat)
3. **Task 3: Implement RBAC permission system** - `38290e7` (feat)

## Files Created/Modified

- `src/lib/auth/auth.ts` - Main Auth.js config with credentials provider and JWT callbacks
- `src/lib/auth/auth.config.ts` - Edge-compatible config for middleware
- `src/lib/auth/credentials.ts` - Login schema validation and password verification
- `src/lib/auth/permissions.ts` - RBAC with roles, permissions, and access control
- `src/middleware.ts` - Route protection using Auth.js edge config
- `src/app/api/auth/[...nextauth]/route.ts` - Auth.js API route handler
- `src/types/next-auth.d.ts` - TypeScript augmentation for custom session claims
- `scripts/run-migration.ts` - Fixed type error (Neon returns rows directly)

## Decisions Made

1. **No PrismaAdapter used** - Credentials-only auth doesn't need OAuth account linking. We handle user lookup in validateCredentials() and store claims in JWT directly.

2. **JWT strategy for sessions** - Stateless authentication works well with serverless/Edge runtime. Custom claims (role, orgId, orgSlug) enable authorization without database lookups.

3. **Edge-compatible config split** - auth.config.ts contains only edge-compatible code (no database calls) for middleware. auth.ts contains the full config with credentials provider for API routes.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed type error in scripts/run-migration.ts**
- **Found during:** Task 2 (build verification)
- **Issue:** Pre-existing type error: `tables.rows` doesn't exist (Neon returns rows directly)
- **Fix:** Changed `tables.rows.map()` to `(tables as Array).map()`
- **Files modified:** scripts/run-migration.ts
- **Verification:** Build passes
- **Committed in:** 659cfbd (part of Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Pre-existing bug fix required for build verification. No scope creep.

## Issues Encountered

1. **PrismaAdapter type conflict** - The @auth/prisma-adapter's User type didn't match our augmented User type (missing role, orgId, orgSlug). Resolution: Removed PrismaAdapter since credentials-only auth doesn't need it.

2. **Next.js 16 middleware deprecation warning** - Next.js 16 shows "middleware" convention is deprecated, recommends "proxy". The middleware works correctly; this is informational only for future versions.

## User Setup Required

None - no external service configuration required.

Environment variables already configured in 01-01:
- `NEXTAUTH_SECRET` - Already set in .env.local
- `DATABASE_URL` - Required for user lookup during login

## Next Phase Readiness

**Ready for Phase 01-03 (User Registration):**
- Auth system ready to authenticate users
- validateCredentials() expects passwordHash in User model
- Login schema validates email format and password length

**Blockers:**
- None

---
*Phase: 01-foundation*
*Completed: 2026-01-19*
