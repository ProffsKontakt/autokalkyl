---
phase: 17-multi-battery-combo
plan: 04
subsystem: ui
tags: [react, typescript, combo-mode, results-display]

# Dependency graph
requires:
  - phase: 17-02
    provides: calculateCombinedResults function and CombinedResults/UnitBreakdown types
  - phase: 17-03
    provides: comboMode toggle in battery step UI
provides:
  - ComboSummary component showing combined ROI/payback/savings
  - ComboBreakdown expandable component with per-unit and subtotal values
  - Conditional results rendering based on comboMode
affects: [17-05, 17-06, public-share]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Native HTML details/summary for expandable breakdown cards
    - Conditional results view based on comboMode state
    - Per-unit and subtotal display pattern (quantity × per-unit)

key-files:
  created:
    - src/components/calculations/results/combo-summary.tsx
    - src/components/calculations/results/combo-breakdown.tsx
    - src/components/calculations/results/index.ts
  modified:
    - src/components/calculations/wizard/steps/results-step.tsx

key-decisions:
  - "Used native HTML details/summary for expandable breakdown (no external accordion library)"
  - "Show per-unit AND subtotal (quantity × per-unit) in breakdown for clarity"
  - "Grid services stacking detail shown per battery with visual callout"
  - "Conditional rendering: komboinvestering mode shows combo components, jamfora shows comparison view"

patterns-established:
  - "Barrel export pattern for results components (index.ts)"
  - "Combo results calculated via useMemo when comboMode changes"
  - "Three-column grid in breakdown: label, per-unit, total"

# Metrics
duration: 4.5min
completed: 2026-02-05
---

# Phase 17 Plan 04: Combo Results Display Summary

**Combined investment summary and expandable per-unit breakdown components with ROI metrics, cost breakdown, and grid services stacking visibility**

## Performance

- **Duration:** 4.5 min
- **Started:** 2026-02-05T23:34:53Z
- **Completed:** 2026-02-05T23:39:23Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- ComboSummary displays combined metrics (payback, ROI, annual savings, costs)
- ComboBreakdown shows expandable per-unit details with subtotals
- Grid services stacking visible (quantity × per-unit rate) with visual callout
- Gron Teknik applied to combined total
- Mode-based conditional rendering (komboinvestering vs jamfora)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create ComboSummary component** - `0c40124` (feat)
2. **Task 2: Create ComboBreakdown component** - `fa3499b` (feat)
3. **Task 3: Export and integrate with results view** - `2f5c7f6` (feat)

## Files Created/Modified

- `src/components/calculations/results/combo-summary.tsx` - Combined investment summary with key metrics grid (payback, annual savings, ROI 10yr/15yr), cost summary (ex/inkl moms, after Gron Teknik), and savings breakdown (spotpris, effekttariff, stodtjanster)
- `src/components/calculations/results/combo-breakdown.tsx` - Expandable per-unit breakdown using native details/summary, showing technical specs, cost breakdown, savings breakdown, grid services stacking detail, and ROI metrics per unit with both per-unit and subtotal values
- `src/components/calculations/results/index.ts` - Barrel export for all results components
- `src/components/calculations/wizard/steps/results-step.tsx` - Integrated combo mode rendering with calculateCombinedResults call and conditional display logic

## Decisions Made

**Native HTML details/summary for expandable cards**
- Rationale: No external accordion library needed, accessible by default, smooth animations with CSS

**Show per-unit AND subtotal in breakdown**
- Rationale: Closers need to see individual battery economics AND total contribution for transparency

**Grid services stacking gets visual callout**
- Rationale: Key differentiation point for Emaldo batteries - each unit can be registered separately for frekvensreglering

**Conditional rendering based on comboMode**
- Rationale: Komboinvestering mode focuses on combined investment view, jamfora mode maintains comparison table for side-by-side evaluation

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Next Phase Readiness

- Combo results display complete
- Ready for plan 05: Save combo mode and quantities to database
- Ready for plan 06: Public share integration with combo mode display
- ComboSummary and ComboBreakdown components exported from index.ts for easy import in public share views

**Blockers:** None

**Considerations for next plans:**
- Public share view will need to detect comboMode and render ComboSummary/ComboBreakdown accordingly
- Save action needs to persist comboMode and battery quantities
- Combo mode should be visible in admin calculation list (show "2× Battery A + 1× Battery B" instead of just count)

---
*Phase: 17-multi-battery-combo*
*Completed: 2026-02-05*
