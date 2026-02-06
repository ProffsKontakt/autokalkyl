# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-05)

**Core value:** Closers can build accurate, interactive battery ROI calculations that prospects can customize to see real savings.
**Current focus:** v1.3 Combo & Avgifter — Phase 17 (Multi-battery combo)

## Current Position

Phase: 17 — Multi-battery combo
Plan: 6/6
Status: Phase complete ✅
Last activity: 2026-02-06 — Completed 17-06-PLAN.md (Human verification)

Progress: v1.0 [##########] | v1.1 [##########] | v1.2 [##########] | v1.3 [##############] 100%

## Milestone Summary

| Milestone | Phases | Plans | Requirements | Shipped |
|-----------|--------|-------|--------------|---------|
| v1.0 MVP | 1-5 | 26 | 92 | 2026-01-20 |
| v1.1 Fixed ROI | 6-7 | 7 | 21 | 2026-02-01 |
| v1.2 Consumption & Peak | 8-13 | 19 | 27 | 2026-02-05 |
| v1.3 Combo & Avgifter | 14-17 | 62 | 28 | 2026-02-06 |
| **Total** | **17** | **61+** | **168** | — |

## v1.3 Phase Overview

| Phase | Goal | Requirements | Status |
|-------|------|--------------|--------|
| 14 | Natagare fee & timing config | NATA-12, NATA-13, NATA-14 | Complete |
| 15 | Customer type & electricity inputs | CUST-01-04, ELEC-01-06 | Complete |
| 16 | Fees & taxes in calculations | FEES-01-05 | Complete |
| 17 | Multi-battery combo | COMBO-01-10 | Complete ✅ |

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
| 2026-02-05 | 17-01 | localStorage version v4 | Force cache reset for quantity support in battery state |
| 2026-02-05 | 17-01 | comboMode defaults to 'jamfora' in database | Backward compatible - existing calculations show comparison view |
| 2026-02-05 | 17-01 | quantity defaults to 1 for all batteries | Backward compatible with existing single-battery calculations |
| 2026-02-05 | 17-01 | Used prisma db push instead of migrate dev | Shadow database migration issues, manual migration file created |
| 2026-02-05 | 17-02 | Apply Gron Teknik to combined total, not per-unit | Gron Teknik subsidy applies to total investment amount |
| 2026-02-05 | 17-02 | Grid services stacking per physical unit for Emaldo | Each Emaldo battery gets separate grid services enrollment |
| 2026-02-05 | 17-02 | Use decimal.js for all financial aggregation | Prevent floating-point rounding errors in combo calculations |
| 2026-02-05 | 17-02 | Per-unit breakdown stores subtotals for UI | Expandable UI shows per-unit AND subtotal (per-unit × quantity) |
| 2026-02-05 | 17-03 | Mode toggle visible only when batteries.length > 0 | Prevents confusion with empty state |
| 2026-02-05 | 17-03 | Max 3 batteries in Jamfora mode, 10 in Komboinvestering | Jamfora limited by comparison UI, Komboinvestering more flexible |
| 2026-02-05 | 17-03 | Price summary adapts to quantity | Shows per-unit and total when quantity > 1 |
| 2026-02-05 | 17-03 | Dropdown shows all batteries with disabled state | Guides users to quantity selector for same-model quantities |
| 2026-02-05 | 17-04 | Native HTML details/summary for expandable breakdown | No external accordion library needed, accessible by default |
| 2026-02-05 | 17-04 | Show per-unit AND subtotal in breakdown | Closers need both individual battery economics AND total contribution |
| 2026-02-05 | 17-04 | Grid services stacking gets visual callout | Key differentiation for Emaldo - each unit can be registered separately |
| 2026-02-05 | 17-04 | Conditional rendering based on comboMode | Komboinvestering shows combined view, jamfora shows comparison table |
| 2026-02-05 | 17-05 | PublicCombinedResults mirrors admin CombinedResults structure | Consistency between admin and public types simplifies mental model |
| 2026-02-05 | 17-05 | Build combined results from stored battery results | Public view must match admin view exactly, stored results are source of truth |
| 2026-02-05 | 17-05 | Conditional render in InteractivePublicView | Keeps public page simple, logic encapsulated in view component |
| 2026-02-05 | 17-05 | No mode toggle for prospects | Closer decides presentation mode, prospects see chosen view only (per CONTEXT.md) |
| 2026-02-06 | 17-06 | Manual human verification for combo feature | Complex UI interactions require human judgment for comprehensive validation |
| 2026-02-06 | quick-003 | isEmaldoBattery flag in baseInputs applies to all batteries in combo | For homogeneous combos (2x same Emaldo), single flag works. Future: per-battery detection if mixed combos needed |

### Pending Todos

None.

### Blockers/Concerns

**Tech debt carried forward:**
- No input validation for unrealistic slider combinations
- totalProjectionYears fixed at 10 years
- Phase 10 missing formal verification document (code complete)

**Production deployment:**
- Run `npx prisma migrate deploy` before production use (includes 14-01, 15-01, and 17-01 migrations)
- Verify PostHog events flowing in production

**Phase 17 migration note:**
- Migration 20260205220900_add_combo_mode created manually (shadow DB issue)
- Schema already synced via `prisma db push`, migration for production tracking only

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 001 | UX reorganization - fees breakdown, Grön Teknik conditional | 2026-02-06 | 20f1a6b | [001-ux-reorganize-menus-fees-breakdown-gron-](./quick/001-ux-reorganize-menus-fees-breakdown-gron-/) |
| 002 | Emaldo grid services terminology and customization | 2026-02-06 | 6fba304 | [002-emaldo-grid-services-stacking-rename](./quick/002-emaldo-grid-services-stacking-rename/) |
| 003 | Fix Emaldo grid services stacking and Resultat screen bugs | 2026-02-06 | 033b3b9 | [003-fix-emaldo-grid-services-stacking](./quick/003-fix-emaldo-grid-services-stacking/) |
| 004 | Fix payback calculation and label for Foretag customers | 2026-02-06 | 58e9973 | [004-fix-payback-foretag-moms](./quick/004-fix-payback-foretag-moms/) |

## Session Continuity

Last session: 2026-02-06 09:12
Stopped at: Completed quick task 004 (Fix payback calculation and label for Foretag customers)
Resume file: None

Next action: v1.3 milestone complete — all 4 phases finished. Consider planning next milestone or production deployment.
