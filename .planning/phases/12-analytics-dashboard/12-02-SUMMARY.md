---
phase: 12
plan: 02
subsystem: analytics
tags: [posthog, api, analytics, role-based-filtering, hogql]
dependency-graph:
  requires:
    - 12-01 # Server-side PostHog client
  provides:
    - PostHog Query API proxy endpoint
    - Role-based data filtering for dashboards
    - Predefined query templates
  affects:
    - 12-03 # Dashboard components will use this API
tech-stack:
  added: []
  patterns:
    - HogQL WHERE clause injection for role-based filtering
    - Shared executeQuery helper for GET/POST handlers
key-files:
  created: []
  modified: []
decisions:
  - id: ANLY-02-01
    choice: Work already completed in 12-01
    reason: Analytics route was created as part of 12-01 commit 1e197ac
metrics:
  duration: 3min
  completed: 2026-02-05
---

# Phase 12 Plan 02: PostHog Query API Proxy Summary

PostHog Query API proxy with automatic role-based HogQL filtering - code already existed from 12-01 execution.

## What Was Delivered

### API Endpoint: `/api/analytics`

The analytics API route was already created during plan 12-01 execution (commit `1e197ac`). It provides:

**POST /api/analytics** - Custom HogQL queries
- Accepts `{ "query": "SELECT ... FROM events ..." }`
- Injects role-based WHERE clauses automatically
- Returns PostHog Query API response

**GET /api/analytics?type=<type>&days=<days>** - Predefined queries
- `calculations-trend`: Calculations over time
- `closer-performance`: Top closers by calculations
- `org-comparison`: Organization comparison (Super Admin)
- `my-calculations`: Individual calculation engagement (Closer)

### Role-Based Filtering

| Role | Filter Applied |
|------|---------------|
| SUPER_ADMIN | None (sees all data) |
| ORG_ADMIN | `properties.org_id = '{session.user.orgId}'` |
| CLOSER | `properties.closer_id = '{session.user.id}'` |

### Key Implementation Details

1. **injectWhereClause helper** - Safely injects conditions before GROUP BY/ORDER BY/LIMIT
2. **executeQuery shared function** - Handles role filtering and PostHog API calls
3. **Environment variables used:**
   - `POSTHOG_HOST` (default: https://eu.i.posthog.com)
   - `POSTHOG_PROJECT_ID` (required)
   - `POSTHOG_PERSONAL_API_KEY` (required)

## Files

| File | Status | Purpose |
|------|--------|---------|
| `src/app/api/analytics/route.ts` | Already exists | PostHog Query API proxy |

## Deviations from Plan

### Work Already Completed

The entire scope of this plan was already implemented during plan 12-01 execution. The commit `1e197ac` ("fix(12-01): disable PostHog bot detection blocking real traffic") included the analytics route creation, which covered both Task 1 and Task 2 of this plan.

**Commit details:**
- Hash: `1e197ac`
- Date: 2026-02-05
- Files: `src/app/api/analytics/route.ts` (298 lines)

No additional implementation was required.

## Verification Results

| Check | Result |
|-------|--------|
| `npm run build` | Passed - route compiles |
| Route exists at `/api/analytics` | Yes - visible in build output |
| POST requires auth | Yes - returns 401 without session |
| GET requires auth | Yes - returns 401 without session |
| SUPER_ADMIN no filter | Yes - unfiltered query passed |
| ORG_ADMIN org_id filter | Yes - injects org_id condition |
| CLOSER closer_id filter | Yes - injects closer_id condition |
| Predefined queries | Yes - 4 templates available |

## Technical Decisions

### ANLY-02-01: Plan Already Executed

**Context:** Upon execution, discovered the analytics route already existed from plan 12-01.

**Decision:** Document completion rather than duplicate work.

**Rationale:** The implementation matches all requirements from this plan. Creating the route during 12-01 was a natural grouping of related work (server-side PostHog setup + API proxy).

## Next Phase Readiness

This plan is complete. The analytics API is ready for:
- Plan 12-03: Dashboard components that will call this API
- React Query integration for caching and auto-refresh
- Custom Recharts visualizations

### Environment Variables Required for Production

```env
POSTHOG_PROJECT_ID=your_project_id
POSTHOG_PERSONAL_API_KEY=phx_your_personal_api_key
POSTHOG_HOST=https://eu.i.posthog.com  # or us equivalent
```
