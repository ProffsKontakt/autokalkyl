---
phase: 17-multi-battery-combo
plan: 01
subsystem: state-management
tags: [zustand, prisma, database, schema, state-persistence]

# Dependency graph
requires:
  - phase: 15-customer-electricity
    provides: Customer type and electricity inputs stored in wizard state and database
provides:
  - BatterySelection interface extended with quantity field
  - WizardState extended with comboMode ('komboinvestering' | 'jamfora')
  - Database schema supports comboMode on Calculation and quantity on CalculationBattery
  - Server actions read/write quantity and comboMode with backward compatibility
affects: [17-02, 17-03, combo-calculations, battery-comparison]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Zustand state version bumps for localStorage cache reset (v3 → v4)"
    - "Database schema defaults for backward compatibility ('jamfora' default)"

key-files:
  created:
    - prisma/migrations/20260205220900_add_combo_mode/migration.sql
  modified:
    - src/stores/calculation-wizard-store.ts
    - prisma/schema.prisma
    - src/actions/calculations.ts
    - src/components/calculations/wizard/calculation-wizard.tsx
    - src/components/calculations/wizard/steps/battery-step.tsx

key-decisions:
  - "localStorage version bumped to v4 to force cache reset for quantity support"
  - "comboMode defaults to 'jamfora' in database for backward compatibility"
  - "quantity defaults to 1 for all existing calculations"
  - "Used prisma db push instead of migrate dev due to shadow database issues"

patterns-established:
  - "Optional fields in Zod schemas with ?? defaults for backward compatibility"
  - "Database migration with nullable fields and defaults for safe rollout"

# Metrics
duration: 6min
completed: 2026-02-05
---

# Phase 17 Plan 01: Foundation Summary

**Extended wizard store and database schema with battery quantity and combo mode state for multi-battery investment calculations**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-05T22:05:29Z
- **Completed:** 2026-02-05T22:11:45Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments
- BatterySelection interface includes quantity field with default value 1
- WizardState includes comboMode with 'komboinvestering' and 'jamfora' options
- Database schema supports comboMode (nullable, default 'jamfora') and quantity (default 1)
- Server actions persist and retrieve quantity and comboMode with full backward compatibility
- localStorage persistence upgraded to v4 with comboMode included in partialize

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend BatterySelection interface and store state** - `738fae8` (feat)
   - Extended BatterySelection with quantity field
   - Added comboMode state to WizardState
   - Implemented updateBatteryQuantity and setComboMode actions
   - Updated partialize for comboMode persistence
   - Bumped localStorage version to v4

2. **Task 2: Add comboMode to Calculation schema and generate migration** - `9f63e64` (feat)
   - Added comboMode to Calculation model
   - Added quantity to CalculationBattery model
   - Created migration 20260205220900_add_combo_mode
   - Regenerated Prisma client

3. **Task 3: Update server actions to handle quantity and comboMode** - `384f3a9` (feat)
   - Extended saveDraftSchema with quantity and comboMode validation
   - Updated save/create operations to persist new fields
   - Updated getCalculation to return quantity and comboMode
   - Full backward compatibility with defaults

## Files Created/Modified

- `src/stores/calculation-wizard-store.ts` - Extended BatterySelection and WizardState interfaces, added actions, updated persistence
- `prisma/schema.prisma` - Added comboMode to Calculation, quantity to CalculationBattery
- `prisma/migrations/20260205220900_add_combo_mode/migration.sql` - Database migration for new fields
- `src/actions/calculations.ts` - Updated Zod schemas and database operations for quantity/comboMode
- `src/components/calculations/wizard/calculation-wizard.tsx` - Updated InitialData interface for quantity
- `src/components/calculations/wizard/steps/battery-step.tsx` - Added quantity to addBattery call

## Decisions Made

1. **localStorage version v4**: Bumped from v3 to force cache reset, ensuring all users get clean state with quantity field support
2. **Default comboMode 'jamfora'**: Database default for backward compatibility - existing calculations show comparison view (current behavior)
3. **Default quantity 1**: All batteries default to quantity 1 for backward compatibility
4. **Optional fields in schemas**: quantity and comboMode optional in Zod with ?? defaults prevents validation errors for existing calculations

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript errors in InitialData interface**
- **Found during:** Task 1 (TypeScript compilation)
- **Issue:** InitialData interface didn't include quantity field, causing type mismatch with BatterySelection
- **Fix:** Made quantity optional in InitialData and loadFromServer parameter types
- **Files modified:** src/components/calculations/wizard/calculation-wizard.tsx, src/stores/calculation-wizard-store.ts
- **Verification:** TypeScript compiles without errors
- **Committed in:** 738fae8 (Task 1 commit)

**2. [Rule 3 - Blocking] Used prisma db push instead of migrate dev**
- **Found during:** Task 2 (Migration creation)
- **Issue:** Shadow database couldn't apply existing migrations (v1.2 migration table not found)
- **Fix:** Used `prisma db push` to sync schema, manually created migration file
- **Files modified:** Created prisma/migrations/20260205220900_add_combo_mode/migration.sql
- **Verification:** Database schema matches Prisma schema, migration file exists
- **Committed in:** 9f63e64 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking)
**Impact on plan:** Both fixes necessary for correctness and execution. No scope creep.

## Issues Encountered

**Shadow database migration failure**: Prisma migrate dev failed due to v1.2 migration not applying cleanly to shadow database. Resolved by using `prisma db push` to sync schema directly, then manually creating migration file for production deployment tracking.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Foundation complete for all Phase 17 combo features:
- ✅ State management ready (quantity, comboMode)
- ✅ Database schema ready (persistent storage)
- ✅ Server actions ready (save/load with backward compatibility)
- ✅ TypeScript types aligned across frontend/backend

Ready for:
- 17-02: UI toggle between combo modes
- 17-03: Quantity controls per battery
- Combo calculation logic

**No blockers**. All existing functionality unchanged (backward compatible).

---
*Phase: 17-multi-battery-combo*
*Completed: 2026-02-05*
