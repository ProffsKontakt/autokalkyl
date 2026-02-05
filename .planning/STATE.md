# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-01)

**Core value:** Closers can build accurate, interactive battery ROI calculations that prospects can customize to see real savings.
**Current focus:** v1.2 Realistic Consumption & Peak Tariffs — Phase 12 COMPLETE

## Current Position

Phase: 12 of 13 (Analytics & Dashboard) - COMPLETE
Plan: 5 of 5 in phase
Status: Phase complete
Last activity: 2026-02-05 — Completed 12-05-PLAN.md (Dashboard Integration)

Progress: v1.0 [##########] | v1.1 [##########] | v1.2 [############] 100%

## Performance Metrics

**Velocity:**
- Total plans completed: 21 (v1.1 + Phase 8 + Phase 9 + Phase 10 + Phase 11 + Phase 12)
- Average duration: ~4min
- Total execution time: ~87min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 6 | 3/3 | 12min | 4min |
| 7 | 4/4 | 17min | 4.25min |
| 8 | 2/2 | ~6min | ~3min |
| 9 | 3/3 | ~17min | ~5.6min |
| 10 | 2/3 | ~7min | ~3.5min |
| 11 | 4/4 | ~12min | ~3min |
| 12 | 5/5 | ~15min | ~3min |

*Phase 12 complete - ready for Phase 13*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.

Recent from Phase 12:
- [ANLY-01] flushAt:1, flushInterval:0 for serverless (events flush immediately) (12-01)
- [ANLY-02] captureServerEvent calls shutdown() after every capture for Vercel (12-01)
- [ANLY-03] Anonymous prospects use calc_{calculationId} as distinctId (12-01)
- [ANLY-04] opt_out_useragent_filter: true disables aggressive bot detection (12-01)
- [ANLY-05] HogQL WHERE clause injection for role-based filtering (12-02, implemented in 12-01)
- [ANLY-06] Analytics wrapped in try/catch for graceful degradation (12-03)
- [ANLY-07] Prospect views use 'prospect' viewer_type for tracking (12-03)
- [ANLY-08] QueryClientProvider added to DashboardProviders for React Query (12-04)
- [ANLY-09] 30s refetch for charts, 60s for widget (12-04)
- [ANLY-10] Role-based conditional rendering in server component with Suspense (12-05)
- [ANLY-11] 'Het' badge threshold at >3 views for hot lead signal (12-05)
- [ANLY-12] Native HTML tables match existing project patterns (12-05)

Recent from v1.2:
- DEFAULT_CURRENT_PEAK_KW = 8 centralized in constants.ts (FIX-03 addressed)
- Old estimation formula (annual/8760) replaced with constant fallback
- HeatingType enum added with 5 Swedish heating types (08-01)
- Natagare peak calculation fields added with sensible defaults (08-01)
- Natagare globalScope pattern: nullable orgId + globalScope boolean (09-01)
- ORG_ADMIN loses NATAGARE_EDIT/DELETE, can only request new natagare (09-01)
- ApprovalStatus enum for workflow tracking (09-01)
- Peak method stored as JSON string for flexibility (09-02)
- List-with-side-panel pattern for configuration management (09-02)
- Super Admin redirects from /natagare to /admin/natagare for config (09-03)
- showActions prop pattern for role-based UI rendering (09-03)
- userRole prop propagation through wizard for conditional features (09-03)
- [CP-01] Normalize monthly factors at runtime to ensure exact sum of 12 (10-01)
- [CP-02] Store raw factors separately and normalize in HEATING_TYPE_PROFILES (10-01)
- [CP-03] Keep height prop in DistributionChart for backward compatibility (10-02)
- [PEAK-01] Night hour detection handles overnight wrap (22:00-06:00) (11-01)
- [PEAK-02] N-peak average applies discount BEFORE sorting (Ellevio behavior) (11-01)
- [PEAK-03] Battery constraint message shows both target and actual kW (11-01)
- [PEAK-04] Peak factors by heating type (DIREKTVERKANDE: 3.5 to FJARRVARME: 2.0) (11-02)
- [PEAK-05] December (highest month) used for annual peak estimation (11-02)
- [PEAK-06] Monthly ceiling defaults to 1.2x estimated average peak (11-02)
- [PEAK-07] Engine integration adds peak billing after existing peak shaving (11-03)
- [PEAK-08] PeakComparison shows reduction % and SEK savings prominently (11-03)
- [PEAK-09] PeakTargetInput placed after EstimationHelper in consumption profile step (11-04)
- [PEAK-10] Null coalescing fallback to DEFAULT_CURRENT_PEAK_KW for backward compatibility (11-04)

Recent from v1.1:
- Apply overrides server-side for invisible sync

### Pending Todos

None.

### Blockers/Concerns

**From research (info-level, not blocking):**
- ~~PostHog may be blocked by bot detection~~ (RESOLVED: ANLY-04 in 12-01)
- ~~Vattenfall/E.ON peak methods not finalized~~ (RESOLVED: system now configurable via JSON)
- 113 existing calculations need backward compatibility during migration

**Tech debt carried from v1.1:**
- ~~currentPeakKw hardcoded in 6+ locations~~ (RESOLVED in 08-02)
- No input validation for unrealistic slider combinations
- totalProjectionYears fixed at 10 years

## Session Continuity

Last session: 2026-02-05
Stopped at: Completed 12-05-PLAN.md (Dashboard Integration) - Phase 12 COMPLETE
Resume file: None

Next action: Phase 13 (Polish & Performance) or v1.2 release preparation
