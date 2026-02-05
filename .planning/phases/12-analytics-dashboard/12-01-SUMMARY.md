---
phase: 12-analytics-dashboard
plan: 01
subsystem: analytics
tags: [posthog, posthog-node, server-side-tracking, analytics]

# Dependency graph
requires:
  - phase: none
    provides: standalone foundation
provides:
  - Server-side PostHog singleton with serverless-optimized flush settings
  - Type-safe event capture functions for calculation lifecycle
  - Bot detection fix for client-side PostHog
affects: [12-02, 12-03, 12-04, 12-05]

# Tech tracking
tech-stack:
  added: [posthog-node]
  patterns: [server-side event capture, singleton pattern for PostHog client]

key-files:
  created:
    - src/lib/analytics/posthog-server.ts
    - src/lib/analytics/server-events.ts
  modified:
    - src/components/analytics/posthog-provider.tsx
    - package.json

key-decisions:
  - "ANLY-01: flushAt:1, flushInterval:0 for serverless (events flush immediately)"
  - "ANLY-02: captureServerEvent calls shutdown() after every capture for Vercel"
  - "ANLY-03: Anonymous prospects use calc_{calculationId} as distinctId"
  - "ANLY-04: opt_out_useragent_filter: true disables aggressive bot detection"

patterns-established:
  - "Server event capture: Import captureServerEvent, pass userId/event/properties"
  - "Lifecycle tracking: trackCalculation{Created,Updated,Deleted,Viewed}"

# Metrics
duration: 2min
completed: 2026-02-05
---

# Phase 12 Plan 01: Server-Side PostHog Setup Summary

**PostHog server-side event capture with posthog-node singleton, 6 type-safe tracking functions, and client-side bot detection fix**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-05T10:54:11Z
- **Completed:** 2026-02-05T10:56:29Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- Installed posthog-node for reliable server-side event capture (bypasses ad blockers)
- Created singleton PostHog client with serverless-optimized settings (flushAt:1)
- Built 6 type-safe event capture functions covering full calculation lifecycle
- Fixed ANLY-07: Disabled aggressive bot detection that was blocking real traffic

## Task Commits

Each task was committed atomically:

1. **Task 1: Install posthog-node and create server-side singleton** - `561317e` (feat)
2. **Task 2: Create server-side event capture functions** - `efdae37` (feat)
3. **Task 3: Fix client-side bot detection** - `1e197ac` (fix)

## Files Created/Modified
- `src/lib/analytics/posthog-server.ts` - Server-side PostHog singleton with getServerPostHog() and captureServerEvent()
- `src/lib/analytics/server-events.ts` - Type-safe event functions: trackCalculation{Created,Updated,Deleted,Viewed}, trackShareLinkGenerated, trackWizardCompleted
- `src/components/analytics/posthog-provider.tsx` - Added opt_out_useragent_filter: true to fix bot detection
- `package.json` - Added posthog-node dependency

## Decisions Made
- **ANLY-01:** Set flushAt:1 and flushInterval:0 for serverless environments. Events flush immediately without batching to prevent loss when functions terminate.
- **ANLY-02:** captureServerEvent() calls shutdown() after every capture. Required for Vercel serverless where function may terminate immediately after response.
- **ANLY-03:** Anonymous prospects (calculation viewers) use `calc_{calculationId}` as distinctId. Enables per-calculation engagement correlation without PII.
- **ANLY-04:** Set opt_out_useragent_filter: true in client PostHog. PostHog's default bot detection is too aggressive and blocks legitimate users.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

**External services require manual configuration.** The following environment variables must be set:

| Variable | Source | Required For |
|----------|--------|--------------|
| POSTHOG_API_KEY | PostHog Dashboard -> Project Settings -> API keys -> Project API Key | Server-side event capture |
| POSTHOG_HOST | Default: https://eu.i.posthog.com | Server-side PostHog client |

Note: POSTHOG_PROJECT_ID and POSTHOG_PERSONAL_API_KEY will be needed in Plan 02 for the Query API.

## Next Phase Readiness
- Server-side event infrastructure ready for integration in Plan 02
- Event functions ready to be called from server actions
- No blockers for next plan

---
*Phase: 12-analytics-dashboard*
*Completed: 2026-02-05*
