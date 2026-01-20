---
phase: "05-operations"
plan: "03"
subsystem: "admin-dashboard"
tags: ["dashboard", "analytics", "role-based", "link-tracking"]

dependency-graph:
  requires: ["05-01", "05-02"]
  provides: ["role-based-dashboards", "org-stats-view", "calculations-table"]
  affects: []

tech-stack:
  added: ["date-fns"]
  patterns: ["role-based-data-scoping", "link-analytics-display"]

key-files:
  created:
    - "src/actions/dashboard.ts"
    - "src/components/dashboard/dashboard-stats.tsx"
    - "src/components/dashboard/org-list.tsx"
    - "src/components/dashboard/calculations-table.tsx"
    - "src/app/(admin)/admin/page.tsx"
  modified:
    - "src/app/(dashboard)/dashboard/page.tsx"

decisions:
  - id: "05-03-01"
    choice: "Role-based dashboard routing: Super Admin redirected to /admin, others stay on /dashboard"
    rationale: "Clean separation of admin and user dashboards"

metrics:
  duration: "3 min"
  completed: "2026-01-20"
---

# Phase 05 Plan 03: Admin Dashboards Summary

**One-liner:** Role-based admin dashboards with org/calculation stats and link analytics using date-fns for relative timestamps

## What Was Built

### Dashboard Server Actions (src/actions/dashboard.ts)
- `getDashboardStats()` - Role-scoped statistics:
  - Super Admin: all calculations across all orgs
  - Org Admin: their org's calculations with closer names
  - Closer: their own calculations only
- `getOrganizationsWithStats()` - Super Admin only, lists all orgs with calculation counts, user counts, and total views
- `getCalculationsForDashboard()` - Super Admin filterable view with org, closer, date filters

### Dashboard UI Components
- `DashboardStatsView` - Summary cards (total calcs, total views) + recent calculations list with link analytics
- `OrgList` - Organization table showing calculation counts, user counts, views, and ProffsKontakt status
- `CalculationsTable` - Detailed table with customer, org, closer, battery, status, views, and timestamps

### Dashboard Pages
- `/dashboard` - Closer/Org Admin view with stats and recent calculations
- `/admin` - Super Admin view with all orgs and all calculations overview

### Link Analytics Display
- View count shown for shared calculations
- Last viewed timestamp with relative time (e.g., "for 2 dagar sedan")
- Non-shared calculations show "Ej delad" indicator

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Dashboard routing | Super Admin -> /admin, others -> /dashboard | Clean role separation |
| Link analytics display | viewCount + lastViewedAt in both list and table | Consistent analytics visibility |
| Date formatting | date-fns with Swedish locale | Native relative time support |

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

- [x] TypeScript compiles without errors
- [x] Build succeeds
- [x] viewCount and lastViewedAt displayed in DashboardStatsView
- [x] viewCount and lastViewedAt displayed in CalculationsTable
- [x] OrgList shows calculation counts per org

## Commits

| Hash | Message |
|------|---------|
| bbc9a86 | feat(05-03): create dashboard server actions |
| 99c09dc | feat(05-03): create dashboard UI components |
| 50ee16c | feat(05-03): update dashboard pages with role-based stats views |

## Next Phase Readiness

**Ready for 05-04:** Sentry error tracking and API monitoring

No blockers. All dashboard functionality is in place with proper role-based access control.
