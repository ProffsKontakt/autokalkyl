# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-01)

**Core value:** Closers can build accurate, interactive battery ROI calculations that prospects can customize to see real savings.
**Current focus:** v1.2 Realistic Consumption & Peak Tariffs — Phase 11

## Current Position

Phase: 11 of 13 (Peak Calculation Engine)
Plan: 1 of 3 in phase
Status: In progress
Last activity: 2026-02-05 — Completed 11-01-PLAN.md (Peak Billing Module)

Progress: v1.0 [##########] | v1.1 [##########] | v1.2 [########__] 80%

## Performance Metrics

**Velocity:**
- Total plans completed: 15 (v1.1 + Phase 8 + Phase 9 + Phase 10 + Phase 11)
- Average duration: ~4min
- Total execution time: ~62min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 6 | 3/3 | 12min | 4min |
| 7 | 4/4 | 17min | 4.25min |
| 8 | 2/2 | ~6min | ~3min |
| 9 | 3/3 | ~17min | ~5.6min |
| 10 | 2/3 | ~7min | ~3.5min |
| 11 | 1/3 | 3min | 3min |

*v1.2 metrics will be tracked as phases complete*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.

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

Recent from v1.1:
- Apply overrides server-side for invisible sync

### Pending Todos

None.

### Blockers/Concerns

**From research (info-level, not blocking):**
- PostHog may be blocked by bot detection (ANLY-07 addresses)
- ~~Vattenfall/E.ON peak methods not finalized~~ (RESOLVED: system now configurable via JSON)
- 113 existing calculations need backward compatibility during migration

**Tech debt carried from v1.1:**
- ~~currentPeakKw hardcoded in 6+ locations~~ (RESOLVED in 08-02)
- No input validation for unrealistic slider combinations
- totalProjectionYears fixed at 10 years

## Session Continuity

Last session: 2026-02-05
Stopped at: Completed 11-01-PLAN.md (Peak Billing Module)
Resume file: None

Next action: `/gsd:execute-plan 11-02` (Peak Shaving Optimizer)
