---
phase: 03-calculator-engine
plan: 01
subsystem: calculation-core
tags: [prisma, decimal.js, types, formulas, permissions]
dependency-graph:
  requires: [02-01, 02-02]
  provides: [calculation-schema, calculation-engine, calculation-permissions]
  affects: [03-02, 03-03, 03-04, 03-05]
tech-stack:
  added: [decimal.js]
  patterns: [decimal-precision, formula-separation]
key-files:
  created:
    - prisma/schema.prisma (Calculation, CalculationBattery models)
    - src/lib/calculations/types.ts
    - src/lib/calculations/constants.ts
    - src/lib/calculations/presets.ts
    - src/lib/calculations/elomrade-lookup.ts
    - src/lib/calculations/formulas.ts
    - src/lib/calculations/engine.ts
  modified:
    - src/lib/auth/permissions.ts
decisions:
  - id: calc-schema-json
    choice: "Store consumption profile and results as Json fields"
    reason: "Flexible structure for 12x24 matrix and detailed results"
  - id: decimal-precision
    choice: "Use decimal.js for all financial calculations"
    reason: "Required by LOGIC-10, avoids floating point errors"
  - id: formula-separation
    choice: "Separate formulas.ts from engine.ts"
    reason: "Testability - individual formulas can be unit tested"
metrics:
  duration: 4 min
  completed: 2026-01-19
---

# Phase 3 Plan 1: Database Schema and Calculation Engine Summary

**One-liner:** Prisma Calculation/CalculationBattery models with decimal.js ROI engine implementing LOGIC-01 through LOGIC-10.

## What Was Built

### Database Schema

Added to Prisma schema:

1. **CalculationStatus enum**: DRAFT, COMPLETE, ARCHIVED
2. **Calculation model**: Customer info, consumption profile, results storage
   - Tenant-scoped via orgId
   - Links to Natagare for effect tariff rates
   - consumptionProfile: Json (12x24 matrix)
   - results: Json (calculation outputs)
   - shareCode for Phase 4 public sharing
3. **CalculationBattery model**: Junction table for multi-battery comparison
   - Links calculation to battery configs
   - Stores pricing per battery
   - Unique constraint prevents duplicates

### Calculation Engine

Created `/src/lib/calculations/` module with:

| File | Purpose |
|------|---------|
| types.ts | CalculationInputs, CalculationResults, BatterySpec types |
| constants.ts | VAT_RATE (25%), GRON_TEKNIK_RATE (48.5%), defaults |
| presets.ts | 4 consumption presets + applyPreset() function |
| elomrade-lookup.ts | Postal code to SE1-SE4 mapping |
| formulas.ts | Individual LOGIC formulas with decimal.js |
| engine.ts | calculateBatteryROI() orchestrating all formulas |

### Permissions

Added CALCULATION_* permissions:
- CALCULATION_CREATE, VIEW, VIEW_ALL, VIEW_ORG
- CALCULATION_EDIT, DELETE, FINALIZE

Closer: Can create/view/edit/delete/finalize own calculations
Org Admin: Can view/edit all org calculations
Super Admin: All permissions

## Technical Details

### Formula Implementation

All 10 LOGIC formulas implemented with decimal.js:

| Formula | Function | Purpose |
|---------|----------|---------|
| LOGIC-01 | calcEffectiveCapacity | Capacity after efficiency losses |
| LOGIC-02 | calcAnnualEnergy | Yearly energy from battery |
| LOGIC-03 | calcSpotprisSavings | Day/night price arbitrage |
| LOGIC-04 | calcEffectTariffSavings | Peak shaving savings |
| LOGIC-05 | calcGridServicesIncome | Ancillary services revenue |
| LOGIC-06 | calcTotalAnnualSavings | Sum of savings |
| LOGIC-07 | calcPaybackPeriod | Years to break even |
| LOGIC-08 | calcRoi10Year | 10-year ROI percentage |
| LOGIC-09 | calcRoi15Year | 15-year ROI percentage |
| LOGIC-10 | calculateBatteryROI | Main orchestrator function |

Plus CALC-11 (total inc VAT), CALC-12 (cost after Gron Teknik), CALC-13 (margin).

### Consumption Presets

4 system presets based on typical Swedish residential patterns:
- Elvarmning (electric heating)
- Varmepump (heat pump)
- Elbilsladdning (EV charging)
- Solcellsproducent (solar prosumer)

Each preset defines hourly pattern (24h) and monthly factors (12 months).

## Decisions Made

1. **Json fields for flexibility**: consumptionProfile and results stored as Json to allow schema evolution without migrations

2. **Separate formulas.ts**: Individual formula functions enable unit testing without mocking the full engine

3. **Decimal.js configuration**: precision: 20, rounding: ROUND_HALF_UP for financial accuracy

4. **Elomrade lookup static table**: No reliable API exists, using postal code ranges

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

**Phase 3 Plan 2 can proceed:**
- Calculation schema exists for wizard state persistence
- Types available for Zustand store
- Engine ready for results calculation

**Blockers:** None

**Dependencies satisfied:**
- [x] Calculation model for DRAFT saving
- [x] CalculationBattery for multi-battery support
- [x] Types for wizard state management
- [x] Engine for results calculation
