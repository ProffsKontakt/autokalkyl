---
phase: 09-natagare-centralization
plan: 02
subsystem: ui
tags: [natagare, super-admin, peak-calculation, night-discount, list-with-side-panel]

# Dependency graph
requires:
  - phase: 09-01
    provides: Global natagare schema with approvalStatus, peak calculation fields
provides:
  - Super Admin /dashboard/admin/natagare route
  - List-with-side-panel NatagareConfigPanel component
  - NatagareEditForm with peak method and night discount configuration
  - updateNatagareConfig server action
  - NatagareDuplicateBanner for migration conflict visibility
  - Badge UI component
affects: [09-03, calculator-engine, calculations]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - List-with-side-panel layout for configuration management
    - JSON-based peak calculation method configuration

key-files:
  created:
    - src/app/(dashboard)/dashboard/admin/natagare/page.tsx
    - src/components/natagare/natagare-config-panel.tsx
    - src/components/natagare/natagare-edit-form.tsx
    - src/components/natagare/natagare-duplicate-banner.tsx
    - src/components/ui/badge.tsx
  modified:
    - src/actions/natagare.ts
    - src/components/layout/admin-sidebar.tsx

key-decisions:
  - "Peak method stored as JSON string for flexibility (SIMPLE_MAX, N_PEAK_AVERAGE, SEASONAL_PEAK)"
  - "Super Admin items in sidebar separated visually with divider"
  - "Night discount preview shows calculated rate in form"

patterns-established:
  - "List-with-side-panel: 40/60 split, selected item highlighted with left border"
  - "Badge component for status indicators (default, info, warning, success, error variants)"
  - "Peak config as JSON: {method, numPeaks?, avgPeriod?, excludeWeekends?, timeWindows?}"

# Metrics
duration: 12min
completed: 2026-02-01
---

# Phase 9 Plan 02: Super Admin Configuration UI Summary

**List-with-side-panel natagare configuration UI with flexible peak method JSON config supporting Ellevio (N-peak) and Vattenfall (seasonal) patterns**

## Performance

- **Duration:** 12 min
- **Started:** 2026-02-01T17:15:00Z
- **Completed:** 2026-02-01T17:27:00Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments
- Super Admin can view all natagare in list-with-side-panel layout at /dashboard/admin/natagare
- Peak calculation method configurable per natagare (SIMPLE_MAX, N_PEAK_AVERAGE, SEASONAL_PEAK)
- Night discount percentage and hours configurable with live preview
- Duplicate natagare banner shows when migration flagged conflicts
- Admin sidebar has "Natagare (Admin)" link for Super Admin only

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Super Admin natagare route and list-with-side-panel** - `3b49588` (feat)
2. **Task 2: Create peak method and night discount configuration form** - `f8bf761` (feat)
3. **Task 3: Add duplicate resolution banner and update admin sidebar** - `4975ec5` (feat)

## Files Created/Modified

### Created
- `src/app/(dashboard)/dashboard/admin/natagare/layout.tsx` - Layout wrapper
- `src/app/(dashboard)/dashboard/admin/natagare/page.tsx` - Super Admin natagare config page
- `src/components/natagare/natagare-config-panel.tsx` - List-with-side-panel layout
- `src/components/natagare/natagare-edit-form.tsx` - Peak method and night discount form
- `src/components/natagare/natagare-duplicate-banner.tsx` - Duplicate warning banner
- `src/components/ui/badge.tsx` - Reusable Badge component

### Modified
- `src/actions/natagare.ts` - Added updateNatagareConfig action
- `src/components/layout/admin-sidebar.tsx` - Added Super Admin menu section

## Decisions Made

1. **Peak method as JSON string** - Stored as JSON in peakCalculationMethod field for maximum flexibility. Supports:
   - SIMPLE_MAX: Highest single peak (default)
   - N_PEAK_AVERAGE: Average of N highest peaks (Ellevio uses 3)
   - SEASONAL_PEAK: Peak averaged over period (Vattenfall uses winter)

2. **Night discount preview** - Form shows live calculation of discounted rate based on dayRate and discount percentage

3. **Super Admin menu separation** - Admin-only items shown below a divider with purple highlight (vs blue for regular items)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all components created and integrated successfully.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Super Admin configuration UI complete
- Ready for Plan 03: Org Admin/Closer read-only view and natagare request workflow
- All NATA-07 and NATA-08 requirements implemented:
  - NATA-07: Super Admin can configure peak calculation method per natagare
  - NATA-08: Super Admin can configure night discount percentage and hours

---
*Phase: 09-natagare-centralization*
*Completed: 2026-02-01*
