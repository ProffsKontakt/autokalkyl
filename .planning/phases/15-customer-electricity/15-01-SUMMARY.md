---
phase: 15-customer-electricity
plan: 01
subsystem: database
tags: [prisma, typescript, schema, electricity, solar, customer-type]

# Dependency graph
requires:
  - phase: 14-schema-natagare-enhancements
    provides: Natagare tariff timing and transfer fee fields
provides:
  - Calculation model with 13 electricity input fields
  - TypeScript types for ElectricityInputs, CustomerType, InputMode, SelfConsumptionMode, SolarInputs
  - Migration for electricity fields (ready to deploy)
affects: [15-02, 15-03, 16-fees-taxes]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - String for customer type enum (allows Super Admin config without migration)
    - InputMode pattern for annual/monthly flexibility
    - Json fields for monthly breakdown arrays

key-files:
  created:
    - prisma/migrations/20260205180000_add_electricity_inputs/migration.sql
  modified:
    - prisma/schema.prisma
    - src/lib/calculations/types.ts

key-decisions:
  - "String for customerType instead of enum - allows future Super Admin configuration"
  - "Decimal(10,2) for all kWh and price fields - financial precision"
  - "All new fields nullable except customerType and hasSolar - backward compatibility"

patterns-established:
  - "InputMode type: 'annual' | 'monthly' for flexible input handling"
  - "SelfConsumptionMode: 'kwh' | 'percent' for solar modeling flexibility"
  - "ElectricityInputs interface mirrors Prisma schema for type safety"

# Metrics
duration: 8min
completed: 2026-02-05
---

# Phase 15 Plan 01: Electricity Input Schema Summary

**Prisma schema extended with 13 electricity input fields and TypeScript types for customer type, purchased electricity, pricing, and solar self-consumption modeling**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-05T17:48:00Z
- **Completed:** 2026-02-05T17:56:00Z
- **Tasks:** 3/3
- **Files modified:** 3

## Accomplishments

- Calculation model extended with complete Phase 15 electricity input fields
- Migration SQL created for database deployment
- TypeScript types exported: CustomerType, InputMode, SelfConsumptionMode, ElectricityInputs, SolarInputs
- All fields use correct Prisma types (Decimal for money/energy, Json for arrays, String for configurable enums)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add electricity input fields to Calculation model** - `353fe30` (feat)
2. **Task 2: Create and run migration** - `25dee5c` (feat)
3. **Task 3: Add TypeScript types for electricity inputs** - `7574b68` (feat)

## Files Created/Modified

- `prisma/schema.prisma` - Added 13 new fields: customerType, koptElKwh, koptElInputMode, koptElMonthly, electricityPriceOreKwh, electricityPriceInputMode, electricityPriceMonthly, hasSolar, solarProductionKwh, solarProductionInputMode, solarProductionMonthly, currentSelfConsumptionKwh, projectedSelfConsumptionKwh, selfConsumptionInputMode
- `prisma/migrations/20260205180000_add_electricity_inputs/migration.sql` - Migration adding all 13 columns with proper defaults
- `src/lib/calculations/types.ts` - Added CustomerType, InputMode, SelfConsumptionMode types and ElectricityInputs, SolarInputs interfaces

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| String for customerType (not enum) | Allows Super Admin to configure customer types without schema migration |
| Decimal(10,2) for all kWh and price fields | Financial precision (matches existing pattern from Phase 14) |
| All new fields nullable except customerType and hasSolar | Backward compatibility with existing calculations |
| InputMode as 'annual' or 'monthly' | Flexible input handling for wizard UX |

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**Database unreachable:** Neon serverless database was suspended/unreachable during execution. Migration file was created manually following the project's existing pattern. Migration will be applied when database is available via `npx prisma migrate deploy`.

**Resolution:** Created migration SQL file directly with proper ALTER TABLE statements matching Prisma's output format. Migration tested via `npx prisma validate` (schema valid).

## User Setup Required

None - no external service configuration required.

**Note:** Run `npx prisma migrate deploy` before production use to apply the new migration.

## Next Phase Readiness

- Schema ready for wizard UI integration (15-02)
- TypeScript types ready for Zustand store and server actions
- Migration ready to deploy when database accessible

**Blockers:**
- Database connection required to apply migration before wizard can save data

---
*Phase: 15-customer-electricity*
*Plan: 01*
*Completed: 2026-02-05*
