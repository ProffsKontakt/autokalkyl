---
phase: 15-customer-electricity
plan: 02
subsystem: calculations
tags: [decimal.js, unit-conversion, solar, vat, swedish-locale]

# Dependency graph
requires:
  - phase: 15-01
    provides: SolarInputs type in calculations/types.ts
provides:
  - Unit conversion utilities (ore/SEK, VAT, formatting)
  - Solar self-consumption calculation utilities
  - Input validation for solar values
affects: [16-fees, wizard-ui, calculation-engine]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Decimal.js for all financial calculations
    - Swedish locale formatting (comma decimal separator, space thousand separator)
    - Validation returns {valid, errors[], warnings[]}

key-files:
  created:
    - src/lib/calculations/unit-conversions.ts
    - src/lib/calculations/solar-consumption.ts
  modified: []

key-decisions:
  - "Default self-consumption rates: 30% without battery, 75% with battery"
  - "Swedish error messages in validation functions"
  - "Validation distinguishes hard errors from soft warnings"

patterns-established:
  - "Unit conversions: ore/SEK via Decimal.js div/mul by 100"
  - "VAT: multiply by 1.25 to apply, divide by 1.25 to remove"
  - "Formatting: Swedish locale with comma decimals and space thousands"

# Metrics
duration: 2min
completed: 2026-02-05
---

# Phase 15 Plan 02: Calculation Utilities Summary

**Unit conversion and solar self-consumption utilities with Decimal.js precision for battery ROI calculations**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-05T17:50:00Z
- **Completed:** 2026-02-05T17:51:44Z
- **Tasks:** 2
- **Files created:** 2

## Accomplishments

- Unit conversion functions for ore/SEK with Decimal.js precision
- VAT application/removal utilities (25% Swedish moms)
- Swedish locale formatting for prices and energy values
- Solar self-consumption calculations for battery benefit estimation
- Input validation with Swedish error messages

## Task Commits

Each task was committed atomically:

1. **Task 1: Create unit conversion utilities** - `be12cff` (feat)
2. **Task 2: Create solar self-consumption utilities** - `9b123b9` (feat)

## Files Created

- `src/lib/calculations/unit-conversions.ts` - ore/SEK conversions, VAT utilities, Swedish formatting, monthly/annual aggregation
- `src/lib/calculations/solar-consumption.ts` - Net consumption, battery solar benefit, validation, default suggestions

## Decisions Made

1. **Default self-consumption rates** - 30% without battery, 75% with battery (based on typical Swedish residential patterns from research)
2. **Swedish error messages** - Validation messages in Swedish for user-facing errors
3. **Validation structure** - Returns `{valid, errors[], warnings[]}` to distinguish hard errors from soft warnings

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - SolarInputs type already existed from 15-01, so no blocking issues.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Calculation utilities ready for use by wizard step UI (15-03)
- Ready for integration with calculation engine in Phase 16
- No blockers

---
*Phase: 15-customer-electricity*
*Completed: 2026-02-05*
