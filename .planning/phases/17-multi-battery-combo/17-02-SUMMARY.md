---
phase: 17-multi-battery-combo
plan: 02
subsystem: calculations
tags: [decimal.js, tdd, roi-calculation, combo-aggregation]

# Dependency graph
requires:
  - phase: 17-01
    provides: Zustand store with quantity and comboMode fields
provides:
  - Combo calculation aggregation function (calculateCombinedResults)
  - CombinedResults, BatterySelection, UnitBreakdown types
  - Per-unit breakdown with quantity multipliers
  - Combined ROI/payback calculations
affects: [17-03, combo-ui, results-display]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "TDD with failing tests first"
    - "Decimal.js for all financial aggregation"
    - "Gron Teknik applied to combined total, not per-unit"
    - "Grid services stacking handled by existing engine"

key-files:
  created:
    - src/lib/calculations/combo-calculations.ts
    - src/lib/calculations/combo-calculations.test.ts
  modified:
    - src/lib/calculations/types.ts

key-decisions:
  - "Apply Gron Teknik to combined total investment, not per battery"
  - "Grid services stacking per physical unit for Emaldo (already in engine)"
  - "Use decimal.js for all financial aggregation to avoid rounding errors"
  - "Per-unit breakdown stores subtotals for expandable UI display"

patterns-established:
  - "Combo calculations aggregate per-unit results × quantity"
  - "Empty array returns all zeros without division errors"
  - "ROI/payback derived from combined totals, not averaged"

# Metrics
duration: 4min
completed: 2026-02-05
---

# Phase 17 Plan 02: Combo Calculation Aggregation Summary

**Decimal-precision combo aggregation with per-unit breakdowns, combined ROI, and grid services stacking**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-05T23:14:43Z
- **Completed:** 2026-02-05T23:18:35Z
- **Tasks:** 1 (TDD cycle)
- **Files modified:** 3

## Accomplishments
- TDD-driven combo calculation aggregation with 9 passing tests
- Sum capacity, discharge rates, and costs across multiple batteries with quantities
- Apply Gron Teknik subsidy to combined total (not per-unit)
- Calculate combined ROI/payback from aggregated totals
- Per-unit breakdown with subtotals for detailed display
- Grid services income stacking per physical unit (Emaldo) handled by engine
- Financial precision with decimal.js throughout

## Task Commits

Each TDD phase was committed atomically:

1. **Task 1 (GREEN): Implement combo calculation aggregation** - `2ba86ce` (feat)
   - Test file already existed from 17-03 (created prematurely)
   - Added CombinedResults, BatterySelection, UnitBreakdown types to types.ts
   - Implemented calculateCombinedResults in combo-calculations.ts
   - All 9 tests pass

_Note: RED phase commit not created because test file pre-existed from 17-03_

## Files Created/Modified
- `src/lib/calculations/combo-calculations.ts` - Aggregates individual battery results into combined totals with per-unit breakdowns
- `src/lib/calculations/combo-calculations.test.ts` - 9 test cases covering single/multi battery, quantity handling, grid services, ROI, edge cases
- `src/lib/calculations/types.ts` - Added Phase 17 types: BatterySelection, UnitBreakdown, CombinedResults

## Decisions Made

**1. Apply Gron Teknik to combined total, not per-unit**
- Rationale: Gron Teknik subsidy (48.5% deduction) applies to the total investment amount
- Implementation: Calculate totalCostIncVat first, then apply gronTeknikRate once
- Impact: Correct subsidy calculation for multi-battery combos

**2. Grid services stacking per physical unit for Emaldo**
- Rationale: Each Emaldo battery gets separate grid services enrollment
- Implementation: Handled by existing calculateBatteryROI engine (per-unit × quantity)
- Impact: Accurate grid income for combo configurations (COMBO-06 requirement)

**3. Use decimal.js for all financial aggregation**
- Rationale: Prevent floating-point rounding errors in financial calculations
- Implementation: All accumulators use Decimal type, converted to number only for return
- Impact: Accurate totals for large combos and precise prices

**4. Per-unit breakdown stores subtotals for UI**
- Rationale: Expandable UI needs per-unit AND subtotal (per-unit × quantity) for clarity
- Implementation: UnitBreakdown includes both perUnitResults and subtotal* fields
- Impact: UI can show "1x battery = X, 2x batteries = 2X" without recalculation

## Deviations from Plan

None - plan executed exactly as written.

_Note: Test file was created prematurely in 17-03 commit, but tests align perfectly with plan specifications._

## Issues Encountered

None - TDD cycle executed cleanly with all tests passing on first GREEN implementation.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for:**
- Phase 17-03 continuation: Combo UI integration (already partially complete)
- Results display components can import and use calculateCombinedResults
- Public calculation pages can show combined metrics

**Provides:**
- `calculateCombinedResults(selections, baseInputs)` - Core combo aggregation function
- `CombinedResults` type - Combined metrics for display
- `BatterySelection` type - Input format with battery + quantity + prices
- `UnitBreakdown` type - Per-unit detail with subtotals

**Future integration points:**
- Import in wizard results components
- Import in public calculation views
- Use for comboMode === 'komboinvestering' display

---
*Phase: 17-multi-battery-combo*
*Completed: 2026-02-05*
