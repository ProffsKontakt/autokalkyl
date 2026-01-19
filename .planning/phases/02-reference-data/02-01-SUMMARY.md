---
phase: 02-reference-data
plan: 01
subsystem: database
tags: [prisma, postgresql, battery, natagare, elomrade, electricity-pricing, tenant-scoping, permissions]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Prisma schema with Organization/User models, permissions system, tenant client
provides:
  - BatteryBrand and BatteryConfig models for battery reference data
  - Natagare model for grid operator tariff data
  - ElectricityPrice and ElectricityPriceQuarterly models for spot pricing
  - Elomrade enum (SE1-SE4) for Swedish electricity zones
  - Battery, Natagare, and Electricity permissions
  - Tenant scoping for battery and natagare models
affects: [02-02, 02-03, 02-04, 03-calculation-engine, 04-calculator-interface]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Decimal type for financial/percentage values (10,2 and 5,2 precision)"
    - "Global vs tenant-scoped models (electricity prices are global)"
    - "Unique constraints per org (@@unique([orgId, name]))"

key-files:
  created: []
  modified:
    - prisma/schema.prisma
    - src/lib/auth/permissions.ts
    - src/lib/db/tenant-client.ts

key-decisions:
  - "Elomrade enum with SE1-SE4 values stored directly in database"
  - "Electricity pricing models are global (not tenant-scoped) - shared reference data"
  - "Natagare day/night rate precision at 4 decimal places for accuracy (10,4)"
  - "Battery specs use Decimal types consistently to avoid floating point issues"

patterns-established:
  - "Global reference data pattern: ElectricityPrice/Quarterly use prisma client directly, not tenant client"
  - "Org-scoped reference data pattern: BatteryBrand/Config/Natagare auto-scoped via tenant client"

# Metrics
duration: 2min
completed: 2026-01-19
---

# Phase 02 Plan 01: Database Schema and Permissions Summary

**Prisma schema extended with BatteryBrand, BatteryConfig, Natagare, and ElectricityPrice models; permissions and tenant scoping configured for all new entities**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-19T15:59:18Z
- **Completed:** 2026-01-19T16:01:32Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Database schema supports all Phase 2 reference data entities with proper relations and indexes
- Elomrade enum (SE1-SE4) for Swedish electricity pricing zones
- Role-based permissions for battery, natagare, and electricity data management
- Tenant client auto-scopes queries for org-specific battery and natagare data

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend Prisma schema with battery, natagare, and electricity models** - `e18acaf` (feat)
2. **Task 2: Add permissions for battery, natagare, and electricity management** - `107e685` (feat)
3. **Task 3: Extend tenant client with battery and natagare scoping** - `79c143b` (feat)

## Files Created/Modified

- `prisma/schema.prisma` - Added 5 new models (BatteryBrand, BatteryConfig, Natagare, ElectricityPrice, ElectricityPriceQuarterly), Elomrade enum, and Organization relations
- `src/lib/auth/permissions.ts` - Added 10 new permissions for battery, natagare, and electricity; updated role mappings for ORG_ADMIN and CLOSER
- `src/lib/db/tenant-client.ts` - Added tenant scoping extensions for batteryBrand, batteryConfig, and natagare models

## Decisions Made

- **Elomrade as enum:** Stored as database enum (SE1-SE4) rather than string for type safety and validation
- **Electricity data is global:** ElectricityPrice and ElectricityPriceQuarterly are not tenant-scoped since spot prices are the same for all organizations in the same zone
- **Decimal precision:** Used Decimal(10,4) for natagare rates (e.g., 81.2500 SEK/kW) and Decimal(10,2) for other financial values
- **Closer permissions:** Closers get view-only access to reference data (needed for calculation creation) but cannot edit

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- **Database push blocked:** `npx prisma db push` failed with connection error (port 5432 blocked on local network). This is expected per STATE.md notes. Schema validation passed; push will succeed when deployed or with proper network access.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Database schema ready for CRUD operations (02-02, 02-03, 02-04)
- Permissions system ready for authorization checks
- Tenant scoping ready for org-specific data isolation
- Prisma client generated with types for new models

**Blocker:** Database schema needs to be pushed (`npx prisma db push`) when network access to Neon is available. Until then, runtime will fail for new model operations.

---
*Phase: 02-reference-data*
*Completed: 2026-01-19*
