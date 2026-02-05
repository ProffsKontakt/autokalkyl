---
phase: 11-peak-calculation-engine
plan: 01
subsystem: calculations
tags: [peak-billing, tdd, zod, natagare, ellevio, night-discount]

# Dependency graph
requires:
  - phase: 09-natagare-management
    provides: Natagare peak config structure (peakCalculationMethod JSON)
provides:
  - calculatePeakBilling function for Swedish natagare peak methods
  - Night hour detection and discount application
  - N-peak average (Ellevio), simple max, seasonal peak methods
  - Battery constraint enforcement with clear messages
  - PeakMethodConfig types and Zod schema
affects: [11-02-peak-shaving-optimizer, 11-03-engine-integration]

# Tech tracking
tech-stack:
  added: []
  patterns: [TDD with RED-GREEN-REFACTOR, Zod schema validation, modular calculation functions]

key-files:
  created:
    - src/lib/calculations/peak-billing/types.ts
    - src/lib/calculations/peak-billing/night-discount.ts
    - src/lib/calculations/peak-billing/methods.ts
    - src/lib/calculations/peak-billing/index.ts
    - src/lib/calculations/peak-billing/peak-billing.test.ts
  modified: []

key-decisions:
  - "[PEAK-01] Night hour detection handles overnight wrap (22:00-06:00)"
  - "[PEAK-02] N-peak average applies discount BEFORE sorting (Ellevio behavior)"
  - "[PEAK-03] Battery constraint message shows both target and actual kW"

patterns-established:
  - "TDD in calculations: Write tests first, implement minimal code"
  - "Modular peak-billing structure: types, night-discount, methods, index"
  - "Zod schema alongside TypeScript interface for runtime validation"

# Metrics
duration: 3min
completed: 2026-02-05
---

# Phase 11 Plan 01: Peak Billing Calculation Module Summary

**TDD-built peak billing module with N-peak averaging (Ellevio style), night discount, and battery constraints**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-05T09:37:29Z
- **Completed:** 2026-02-05T09:40:44Z
- **Tasks:** 1 TDD task (RED-GREEN cycle, no refactor needed)
- **Files created:** 5

## Accomplishments

- Night hour detection with overnight wrap support (22:00-06:00)
- N-peak average calculation matching Ellevio billing method
- Simple max and seasonal peak methods for other natagare
- Battery constraint enforcement with Swedish constraint messages
- 38 comprehensive tests covering all behaviors

## Task Commits

TDD task with RED-GREEN cycle:

1. **RED: Failing tests** - `9eead8a` (test: 38 test cases for all behaviors)
2. **GREEN: Implementation** - `ada9da7` (feat: all modules passing)

## Files Created

- `src/lib/calculations/peak-billing/types.ts` - Zod schemas and TypeScript interfaces
- `src/lib/calculations/peak-billing/night-discount.ts` - isNightHour, applyNightDiscount
- `src/lib/calculations/peak-billing/methods.ts` - calculateNPeakAverage, calculateSimpleMax, calculateSeasonalPeak
- `src/lib/calculations/peak-billing/index.ts` - calculatePeakBilling orchestrator
- `src/lib/calculations/peak-billing/peak-billing.test.ts` - 38 tests (388 lines)

## Decisions Made

1. **Night hour detection logic** - Uses >= nightStart OR < nightEnd for overnight wrap
2. **Discount application order** - Apply night discount BEFORE sorting for N-peak average (matches Ellevio behavior)
3. **Winter months definition** - Nov (10), Dec (11), Jan (0), Feb (1), Mar (2) for seasonal peak

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- calculatePeakBilling ready for use in Plan 11-02 (peak shaving optimizer)
- Types exported for integration in Plan 11-03 (engine.ts wiring)
- All methods tested and documented

---
*Phase: 11-peak-calculation-engine*
*Completed: 2026-02-05*
