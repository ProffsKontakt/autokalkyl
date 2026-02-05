---
phase: 17-multi-battery-combo
plan: 03
subsystem: ui
tags: [react, zustand, battery-wizard, combo-mode, quantity-selector]

# Dependency graph
requires:
  - phase: 17-01
    provides: Store actions for quantity and combo mode
provides:
  - Battery step UI with mode toggle (Komboinvestering/Jamfora)
  - Quantity selector with +/- controls for each battery
  - Dynamic max battery limits based on mode
  - Price summary showing per-unit and total calculations
affects: [17-04, 17-05, calculations-ui]

# Tech tracking
tech-stack:
  added: []
  patterns: [mode-based-ui-limits, quantity-aware-price-display]

key-files:
  created: []
  modified:
    - src/components/calculations/wizard/steps/battery-step.tsx

key-decisions:
  - "Mode toggle visible only when batteries.length > 0"
  - "Max 3 batteries in Jamfora mode, 10 in Komboinvestering mode"
  - "Price summary adapts to show per-unit and total when quantity > 1"
  - "Dropdown shows all batteries with disabled state for already-selected"

patterns-established:
  - "Conditional UI limits based on mode (comboMode determines max batteries)"
  - "Quantity-aware price calculations (Gron Teknik applied to total investment)"
  - "Smart hint text showing total units and unique models count"

# Metrics
duration: 3min
completed: 2026-02-05
---

# Phase 17 Plan 03: Battery Step UI Summary

**Battery wizard UI extended with mode toggle (Komboinvestering/Jamfora) and quantity selectors, enabling closers to configure multi-battery investments**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-05T22:15:26Z
- **Completed:** 2026-02-05T22:18:13Z
- **Tasks:** 3
- **Files modified:** 1

## Accomplishments
- Mode toggle UI switches between Komboinvestering (combo) and Jamfora (comparison) views
- Quantity selector (+/-) on each battery card with minimum of 1 unit
- Price summary adapts to show per-unit and total when quantity > 1
- Gron Teknik (48.5%) calculated on total investment (price × quantity)
- Max battery limits enforced by mode: 3 in Jamfora, 10 in Komboinvestering

## Task Commits

Each task was committed atomically:

1. **Task 1: Add mode toggle to battery step header** - `8ecadaa` (feat)
2. **Task 2: Add quantity selector to each battery card** - `400760f` (feat)
3. **Task 3: Allow adding same battery multiple times OR different models** - `2468c81` (feat)

## Files Created/Modified
- `src/components/calculations/wizard/steps/battery-step.tsx` - Battery wizard step with mode toggle and quantity controls

## Decisions Made

**Mode toggle visibility:**
- Toggle shows only when batteries.length > 0 (hidden until first battery added)
- Prevents confusion with empty state

**Max battery limits:**
- Jamfora mode: max 3 batteries (comparison UI constraint per COMBO-10)
- Komboinvestering mode: max 10 batteries (reasonable upper limit)
- Limit enforced in dropdown disabled state and add button

**Price display logic:**
- When quantity = 1: Show "Totalt ex. moms" (simple case)
- When quantity > 1: Show "Per enhet ex. moms" AND "Totalt för N enheter ex. moms"
- Gron Teknik always calculated on total investment (not per-unit)

**Dropdown UX:**
- Shows ALL batteries (not filtered)
- Already-selected batteries disabled with "(redan vald)" suffix
- Guides users to use quantity selector for same-model quantities
- Different models can be added side by side

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## Next Phase Readiness

Battery step UI complete and ready for:
- Phase 17-04: Results view for combo mode rendering
- Phase 17-05: Calculation logic integration
- Multi-battery combinations configured through wizard interface

**Verification needed:**
- Manual UI testing of mode toggle behavior
- Quantity selector +/- button interactions
- Price summary calculations with various quantities
- Max battery limits enforcement

---
*Phase: 17-multi-battery-combo*
*Completed: 2026-02-05*
