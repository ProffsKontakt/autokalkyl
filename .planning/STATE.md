# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-05)

**Core value:** Closers can build accurate, interactive battery ROI calculations that prospects can customize to see real savings.
**Current focus:** v1.3 Combo & Avgifter — Phase 15 (Customer Electricity Inputs)

## Current Position

Phase: 15 — Customer Electricity Inputs (In Progress)
Plan: 4/7 (15-01, 15-02, 15-03, 15-04 complete)
Status: Plan 15-04 complete, continuing to 15-05
Last activity: 2026-02-05 — Completed 15-04-PLAN.md

Progress: v1.0 [##########] | v1.1 [##########] | v1.2 [##########] | v1.3 [######░░░░] 50%

## Milestone Summary

| Milestone | Phases | Plans | Requirements | Shipped |
|-----------|--------|-------|--------------|---------|
| v1.0 MVP | 1-5 | 26 | 92 | 2026-01-20 |
| v1.1 Fixed ROI | 6-7 | 7 | 21 | 2026-02-01 |
| v1.2 Consumption & Peak | 8-13 | 19 | 27 | 2026-02-05 |
| v1.3 Combo & Avgifter | 14-17 | TBD | 28 | — |
| **Total** | **17** | **52+** | **168** | — |

## v1.3 Phase Overview

| Phase | Goal | Requirements | Status |
|-------|------|--------------|--------|
| 14 | Natagare fee & timing config | NATA-12, NATA-13, NATA-14 | Complete |
| 15 | Customer type & electricity inputs | CUST-01-04, ELEC-01-06 | In Progress (4/7 plans) |
| 16 | Fees & taxes in calculations | FEES-01-05 | Blocked by 14, 15 |
| 17 | Multi-battery combo | COMBO-01-10 | Blocked by 16 |

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
| 2026-02-05 | 15-01 | String for customerType (not enum) | Allows Super Admin to configure customer types without schema migration |
| 2026-02-05 | 15-01 | Decimal(10,2) for all kWh and price fields | Financial precision consistent with Phase 14 pattern |
| 2026-02-05 | 15-01 | All new fields nullable except customerType and hasSolar | Backward compatibility with existing calculations |
| 2026-02-05 | 15-02 | Default self-consumption: 30% without battery, 75% with | Typical Swedish residential patterns from research |
| 2026-02-05 | 15-02 | Validation returns {valid, errors[], warnings[]} | Distinguish hard errors from soft warnings for UX |
| 2026-02-05 | 15-03 | localStorage version v3 | Force reset of user cached drafts to avoid stale state |
| 2026-02-05 | 15-03 | Mode toggles distribute/aggregate values | UX: switching modes shouldn't lose data |
| 2026-02-05 | 15-03 | Solar toggle clears dependent fields | Cleaner state when solar disabled |
| 2026-02-05 | 15-04 | All Phase 15 fields optional in Zod schema | Backward compatibility with existing auto-save hook |
| 2026-02-05 | 15-04 | Defaults applied in persistence layer, not schema | Avoids TypeScript inference issues with superRefine |
| 2026-02-05 | 15-04 | Use Prisma.DbNull for monthly Json arrays | Correct way to set database NULL for Json? columns |

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

**Database connectivity:**
- Neon serverless database was unreachable during 15-01 execution
- Migration file created but not applied - apply when database accessible

## Session Continuity

Last session: 2026-02-05 17:58 UTC
Stopped at: Completed 15-04-PLAN.md
Resume file: None

Next action: `/gsd:execute-phase 15` (plan 05) to continue Phase 15
