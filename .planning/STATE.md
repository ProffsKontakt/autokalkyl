# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-05)

**Core value:** Closers can build accurate, interactive battery ROI calculations that prospects can customize to see real savings.
**Current focus:** v1.3 Combo & Avgifter — Phase 17 (Multi-battery combo)

## Current Position

Phase: 16 — Fees & Taxes
Plan: 3/3
Status: Phase complete
Last activity: 2026-02-05 — Completed 16-03-PLAN.md

Progress: v1.0 [##########] | v1.1 [##########] | v1.2 [##########] | v1.3 [#########░] 75%

## Milestone Summary

| Milestone | Phases | Plans | Requirements | Shipped |
|-----------|--------|-------|--------------|---------|
| v1.0 MVP | 1-5 | 26 | 92 | 2026-01-20 |
| v1.1 Fixed ROI | 6-7 | 7 | 21 | 2026-02-01 |
| v1.2 Consumption & Peak | 8-13 | 19 | 27 | 2026-02-05 |
| v1.3 Combo & Avgifter | 14-17 | 9+ | 28 | — |
| **Total** | **17** | **61+** | **168** | — |

## v1.3 Phase Overview

| Phase | Goal | Requirements | Status |
|-------|------|--------------|--------|
| 14 | Natagare fee & timing config | NATA-12, NATA-13, NATA-14 | Complete |
| 15 | Customer type & electricity inputs | CUST-01-04, ELEC-01-06 | Complete |
| 16 | Fees & taxes in calculations | FEES-01-05 | Complete (3/3) |
| 17 | Multi-battery combo | COMBO-01-10 | Ready |

## Accumulated Context

### Decisions

| Date | Phase | Decision | Rationale |
|------|-------|----------|-----------|
| 2026-02-05 | 14-01 | Decimal(10,2) for overforingsavgiftOreKwh | Preserve financial precision (100 ore = 1 SEK) |
| 2026-02-05 | 14-01 | Default overforingsavgift 7.00 ore/kWh | Based on Ellevio 2026 pricing research |
| 2026-02-05 | 14-01 | High-load hours default 07:00-20:00 | Common Swedish grid operator pattern |
| 2026-02-05 | 14-01 | isWinterOnlyHighLoad default false | Some operators (Jonkoping) only charge Nov-Mar |
| 2026-02-05 | 14-02 | Winter months = Nov-Mar (10, 11, 0, 1, 2) | Matches Swedish grid operator winter period definitions |
| 2026-02-05 | 14-02 | High-load defaults 07:00-20:00 in utilities | Consistent with 14-01 schema defaults |
| 2026-02-05 | 15-01 | String for customerType (not enum) | Allows Super Admin config without migration |
| 2026-02-05 | 15-01 | Decimal(10,2) for kWh and price fields | Financial precision, matches Phase 14 pattern |
| 2026-02-05 | 15-03 | localStorage version v3 | Force reset of user cached drafts |
| 2026-02-05 | 15-05 | Store price in ore/kWh internally | Canonical unit, display based on preference |
| 2026-02-05 | 15-06 | Validation requires kopt el > 0 AND price > 0 | Both required for meaningful calculation |
| 2026-02-05 | 16-01 | PRIVATPERSON energiskatt rate includes moms (45 ore) | Simplifies calculations - no separate moms calculation needed |
| 2026-02-05 | 16-02 | Purple color for fees breakdown | Consistent with financial/taxes theme |
| 2026-02-05 | 16-02 | Moms label in subtitle based on customer type | Clear display of inkl/exkl moms for privatperson/foretag |
| 2026-02-05 | 16-03 | Fees breakdown after Elinformation section | Logical grouping - fees relate to electricity information |
| 2026-02-05 | 16-03 | Fees breakdown after StodtjansterBreakdown in public | Consistent breakdown ordering - last breakdown item |

### Pending Todos

None.

### Blockers/Concerns

**Tech debt carried forward:**
- No input validation for unrealistic slider combinations
- totalProjectionYears fixed at 10 years
- Phase 10 missing formal verification document (code complete)

**Production deployment:**
- Run `npx prisma migrate deploy` before production use (includes 14-01 and 15-01 migrations)
- Verify PostHog events flowing in production

## Session Continuity

Last session: 2026-02-05
Stopped at: Completed 16-03-PLAN.md
Resume file: None

Next action: Phase 17 (Multi-battery combo) now unblocked
