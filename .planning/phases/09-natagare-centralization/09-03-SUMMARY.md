---
phase: 09-natagare-centralization
plan: 03
subsystem: ui
tags: [react, rbac, natagare, approval-workflow, dashboard-widget]

# Dependency graph
requires:
  - phase: 09-01
    provides: Global scope schema, approval status enum, role permissions
  - phase: 09-02
    provides: Super Admin config page at /dashboard/admin/natagare
provides:
  - Role-based natagare list page (SUPER_ADMIN redirect, ORG_ADMIN request, CLOSER view-only)
  - Org Admin natagare request form with pending status
  - Calculation wizard natagare dropdown with role-based add link
  - Super Admin pending approvals dashboard widget
affects: [10-consumption-patterns, migration-phase]

# Tech tracking
tech-stack:
  added: []
  patterns: [role-based-ui-rendering, conditional-component-props]

key-files:
  created:
    - src/components/natagare/natagare-request-form.tsx
    - src/components/dashboard/pending-approvals-widget.tsx
  modified:
    - src/app/(dashboard)/dashboard/natagare/page.tsx
    - src/components/natagare/natagare-list.tsx
    - src/app/(dashboard)/dashboard/natagare/new/page.tsx
    - src/components/calculations/wizard/calculation-wizard.tsx
    - src/components/calculations/wizard/steps/customer-info-step.tsx
    - src/app/(dashboard)/dashboard/calculations/new/page.tsx
    - src/app/(admin)/admin/page.tsx

key-decisions:
  - "Super Admin redirects from /dashboard/natagare to /dashboard/admin/natagare"
  - "Closer cannot add natagare - link hidden in wizard"
  - "Pending natagare show amber badge and org-only visibility text"

patterns-established:
  - "Role-based UI rendering: showActions prop pattern for conditional actions"
  - "userRole prop propagation through wizard for conditional features"

# Metrics
duration: 5min
completed: 2026-02-01
---

# Phase 9 Plan 3: Role-Based Access and Approvals Summary

**Role-based natagare UI with request form for Org Admin, view-only for Closer, and pending approvals widget for Super Admin dashboard**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-01T16:25:04Z
- **Completed:** 2026-02-01T16:30:12Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments

- Super Admin automatically redirects to dedicated config page from regular natagare list
- Org Admin can request new natagare with immediate org visibility and pending status
- Closer sees read-only natagare list and cannot add new natagare in wizard
- Super Admin dashboard shows pending approvals widget with count badge

## Task Commits

Each task was committed atomically:

1. **Task 1: Update natagare list page for role-based access** - `dbe0e1b` (feat)
2. **Task 2: Create Org Admin natagare request form** - Already committed in 09-02 (files existed with same content)
3. **Task 3: Update calculation wizard and add approval widget** - `1ce02bc` (feat)

## Files Created/Modified

- `src/app/(dashboard)/dashboard/natagare/page.tsx` - Role-based routing and data fetching
- `src/components/natagare/natagare-list.tsx` - showActions prop, approval status badges
- `src/components/natagare/natagare-request-form.tsx` - Org Admin request form with info banner
- `src/app/(dashboard)/dashboard/natagare/new/page.tsx` - Role-based form selection
- `src/components/calculations/wizard/calculation-wizard.tsx` - userRole prop for conditional features
- `src/components/calculations/wizard/steps/customer-info-step.tsx` - Conditional "add natagare" link
- `src/app/(dashboard)/dashboard/calculations/new/page.tsx` - Use getNatagare() for proper scope
- `src/components/dashboard/pending-approvals-widget.tsx` - Pending approvals widget with count
- `src/app/(admin)/admin/page.tsx` - Widget integrated into Super Admin dashboard

## Decisions Made

- **Super Admin redirect:** Instead of showing a different view, redirect to dedicated config page for clear UX separation
- **showActions prop pattern:** More explicit than checking permissions in component - parent decides based on role
- **userRole propagation:** Pass role through wizard props rather than re-fetching session in client component

## Deviations from Plan

None - plan executed exactly as written.

Note: Task 2 files (natagare-request-form.tsx) were found already committed from 09-02 plan execution with identical content. No re-commit needed.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Natagare role-based access complete (NATA-09, NATA-10, NATA-11)
- Super Admin has full visibility into pending requests via dashboard widget
- Calculation wizard properly scoped to show global + org's pending natagare
- Ready for Phase 10 consumption patterns work

---
*Phase: 09-natagare-centralization*
*Completed: 2026-02-01*
