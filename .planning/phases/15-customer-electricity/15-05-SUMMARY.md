---
phase: 15-customer-electricity
plan: 05
subsystem: ui
tags: [react, zustand, wizard, solar, electricity]

# Dependency graph
requires:
  - phase: 15-02
    provides: Unit conversions (oreToSek, sekToOre) and solar utilities (suggestSelfConsumption, validateSolarInputs)
  - phase: 15-03
    provides: Zustand store with electricity state fields and actions
provides:
  - ElectricityStep wizard component with customer type, kopt el, electricity price, and solar inputs
  - Three-field solar self-consumption model UI
  - Annual/monthly input toggles with value distribution
  - Ore/SEK unit toggle for electricity price
affects: [15-06, 15-07]

# Tech tracking
tech-stack:
  added: []
  patterns: [wizard-step-pattern, annual-monthly-toggle-ui, unit-toggle-ui]

key-files:
  created:
    - src/components/calculations/wizard/steps/electricity-step.tsx
  modified: []

key-decisions:
  - "Electricity price stored in ore/kWh internally, displayed based on user unit preference"
  - "Self-consumption auto-suggests values when solar production first entered"
  - "Solar section hidden by default, shown via 'Har solceller?' toggle"

patterns-established:
  - "Annual/monthly toggle: switches input mode and distributes/aggregates values"
  - "Unit toggle: local UI state for display, store holds canonical unit"
  - "Conditional section: toggle controls visibility of dependent fields"

# Metrics
duration: 2min
completed: 2026-02-05
---

# Phase 15 Plan 05: Electricity Step UI Summary

**ElectricityStep wizard component with customer type dropdown, kopt el with annual/monthly toggle, electricity price with ore/SEK unit toggle, and conditional solar section with three-field self-consumption model**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-05T18:01:54Z
- **Completed:** 2026-02-05T18:03:46Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Customer type dropdown (Privatperson/Foretag) with VAT context help text
- Kopt el input with annual/monthly toggle that distributes/aggregates values
- Electricity price input with ore/SEK unit toggle (store always holds ore/kWh)
- Solar section conditionally shown via "Har solceller?" checkbox
- Three-field solar model: production, current self-consumption, projected self-consumption
- Self-consumption supports kWh or percent input mode
- Auto-suggest fills self-consumption when solar production first entered
- Validation warnings/errors display for unusual solar values
- Summary card shows entered data when kopt el > 0

## Task Commits

Each task was committed atomically:

1. **Task 1: Create ElectricityStep component** - `6157cee` (feat)

## Files Created/Modified
- `src/components/calculations/wizard/steps/electricity-step.tsx` - Wizard step UI for customer electricity inputs (419 lines)

## Decisions Made
- Store always holds electricity price in ore/kWh; ore/SEK toggle is local UI state for display only
- Self-consumption auto-suggestion only triggers when solar production is first entered and currentSelfConsumptionKwh is null
- Validation runs only when all three solar fields have values (production + current + projected)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- ElectricityStep component ready for wizard integration (15-06)
- All electricity store actions are connected and functional
- Solar validation provides user feedback for unusual values

---
*Phase: 15-customer-electricity*
*Completed: 2026-02-05*
