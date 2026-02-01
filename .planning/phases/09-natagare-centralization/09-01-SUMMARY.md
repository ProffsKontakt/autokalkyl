---
phase: 09-natagare-centralization
plan: 01
subsystem: database
tags: [prisma, natagare, permissions, rbac, approval-workflow, global-scope]

# Dependency graph
requires:
  - phase: 08-schema-migration-foundation
    provides: Natagare peak calculation fields, HeatingType enum
provides:
  - Natagare model with global scope support (nullable orgId, globalScope field)
  - ApprovalStatus enum for approval workflow tracking
  - New natagare permissions (NATAGARE_APPROVE, NATAGARE_REQUEST, NATAGARE_CONFIG)
  - Global natagare query actions (getGlobalNatagare, getPendingNatagare)
  - Approval workflow actions (approveNatagare, rejectNatagare)
  - Migration with duplicate detection and data transformation
affects: [09-02, 09-03, 10-consumption-profiles]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Global vs org-scoped entities via nullable orgId + globalScope flag"
    - "Approval workflow with ApprovalStatus enum"
    - "Role-differentiated create behavior (Super Admin vs ORG_ADMIN)"

key-files:
  created:
    - "prisma/migrations/20260201171700_natagare_global_scope/migration.sql"
  modified:
    - "prisma/schema.prisma"
    - "src/lib/auth/permissions.ts"
    - "src/actions/natagare.ts"

key-decisions:
  - "Nullable orgId for global natagare (null = Super Admin managed)"
  - "ORG_ADMIN loses NATAGARE_EDIT/DELETE, gains NATAGARE_REQUEST"
  - "Migration flags duplicates as DUPLICATE_REVIEW for manual resolution"
  - "Oldest natagare (by createdAt) becomes global version for unique names"

patterns-established:
  - "Global scope pattern: globalScope boolean + nullable orgId"
  - "Approval workflow: ApprovalStatus enum with APPROVED/PENDING/REJECTED/DUPLICATE_REVIEW"
  - "Role-differentiated actions: same action behaves differently based on role"

# Metrics
duration: 4min
completed: 2026-02-01
---

# Phase 9 Plan 01: Natagare Global Scope Foundation Summary

**Natagare schema extended with global scope, approval workflow, and role-based permissions for centralized management**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-01T17:17:00Z
- **Completed:** 2026-02-01T17:21:00Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Natagare model supports global scope via nullable orgId and globalScope field
- ApprovalStatus enum enables approval workflow (APPROVED, PENDING, REJECTED, DUPLICATE_REVIEW)
- Migration script flags duplicate natagare names and migrates unique ones to global scope
- Permissions updated: NATAGARE_APPROVE, NATAGARE_REQUEST, NATAGARE_CONFIG added
- ORG_ADMIN can only request new natagare (no edit/delete)
- New actions: getGlobalNatagare, getOrgNatagare, getPendingNatagare, approveNatagare, rejectNatagare

## Task Commits

Each task was committed atomically:

1. **Task 1: Update Natagare schema for global scope and approval workflow** - `cb976fa` (feat)
2. **Task 2: Create migration with duplicate detection and data transformation** - `db8c5da` (feat)
3. **Task 3: Update permissions and natagare actions for global scope** - `6d04b60` (feat)

## Files Created/Modified

- `prisma/schema.prisma` - Added ApprovalStatus enum, updated Natagare model with globalScope, approvalStatus, requestedByOrgId, approvedAt, approvedByUserId; made orgId nullable
- `prisma/migrations/20260201171700_natagare_global_scope/migration.sql` - Migration with enum creation, column additions, duplicate detection, and data transformation
- `src/lib/auth/permissions.ts` - Added NATAGARE_APPROVE, NATAGARE_REQUEST, NATAGARE_CONFIG; removed NATAGARE_EDIT/DELETE from ORG_ADMIN
- `src/actions/natagare.ts` - Updated createNatagare for role-based behavior; added getGlobalNatagare, getOrgNatagare, getPendingNatagare, approveNatagare, rejectNatagare

## Decisions Made

1. **Nullable orgId for global scope:** Global natagare have `orgId = null` and `globalScope = true`. This allows the unique constraint `@@unique([orgId, name])` to work correctly (one global per name, multiple org-specific allowed).

2. **ORG_ADMIN permissions reduced:** ORG_ADMIN can no longer edit or delete natagare directly. They can only create pending requests via NATAGARE_CREATE, which sets `approvalStatus = PENDING`.

3. **Migration duplicate handling:** Names appearing in multiple orgs are flagged as DUPLICATE_REVIEW. For unique names, the oldest natagare (by createdAt) becomes the global version.

4. **Approval workflow:** Approving a pending natagare sets `globalScope = true, orgId = null, approvalStatus = APPROVED`. Rejecting keeps it org-specific with `approvalStatus = REJECTED`.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- **Database unreachable:** Could not connect to Neon database to run `prisma migrate dev`. Created migration file manually as documented in plan (same approach as 08-01). Migration SQL is complete and ready for deployment.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for Plan 02:**
- Schema foundation complete for natagare configuration UI
- Migration ready to deploy (will flag duplicates for Super Admin review)
- Permissions in place for role-based access control
- Actions ready for UI integration

**Next steps:**
- Plan 02: Build Super Admin natagare configuration UI
- Plan 03: Update dropdown components and access control in existing views

---
*Phase: 09-natagare-centralization*
*Completed: 2026-02-01*
