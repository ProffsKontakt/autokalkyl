---
phase: 07-calculation-transparency
plan: 02
subsystem: transparency
tags: [typescript, react, framer-motion, share-links, public-view]

# Dependency graph
requires:
  - phase: 07-01
    provides: SpotprisBreakdown, EffektBreakdown, StodtjansterBreakdown components
provides:
  - CalculationBreakdownPublic type with spotpris, effekt, stodtjanster sections
  - CalculationResultsPublicWithBreakdown type extending base results
  - buildPublicBreakdown function constructing breakdown from results and inputs
  - Public results view displaying expandable formula breakdowns
affects: [future calculation transparency features, public share view improvements]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Public data pipeline filters sensitive business data (margins, costs)"
    - "Breakdown data built from stored results with sensible defaults for backwards compatibility"

key-files:
  created: []
  modified:
    - src/lib/share/types.ts
    - src/actions/share.ts
    - src/components/public/public-results-view.tsx

key-decisions:
  - "Build breakdown data server-side in getPublicCalculation for security"
  - "Use sensible defaults for older calculations missing breakdown inputs"
  - "Remove redundant 'Visa detaljer' toggle - breakdown components more informative"

patterns-established:
  - "Breakdown data construction: extract inputs from stored results, build structured breakdown, exclude sensitive data"
  - "Conditional breakdown rendering: only show breakdown sections when data exists and savings > 0"

# Metrics
duration: 3min
completed: 2026-01-31
---

# Phase 07 Plan 02: Public Breakdown Integration Summary

**Extended public data pipeline with calculation breakdown data and integrated three formula breakdown components into prospect view**

## Performance

- **Duration:** 3 min 32 sec
- **Started:** 2026-01-31T10:44:46Z
- **Completed:** 2026-01-31T10:48:18Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Created CalculationBreakdownPublic type with spotpris, effekt, and stodtjanster breakdown data structures
- Implemented buildPublicBreakdown function to construct breakdown from calculation results and inputs
- Integrated three breakdown components (SpotprisBreakdown, EffektBreakdown, StodtjansterBreakdown) into public results view
- Ensured backwards compatibility - older calculations without breakdown data still render correctly
- Explicitly excluded sensitive business data (marginSek, costPriceTotal, installerCut) from all public types

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend types with breakdown data structures** - `c8bd496` (feat)
   - Added CalculationBreakdownPublic interface
   - Added CalculationResultsPublicWithBreakdown interface
   - Updated PublicCalculationData.calculation.results type

2. **Task 2: Build breakdown data in share action** - `8151ba8` (feat)
   - Added buildPublicBreakdown function
   - Extended getPublicCalculation to extract inputs and build breakdown
   - Implemented Emaldo battery detection for guaranteed income calculation

3. **Task 3: Integrate breakdowns into public results view** - `52ba1dc` (feat)
   - Imported breakdown components
   - Updated props type to CalculationResultsPublicWithBreakdown
   - Added "Så har vi räknat" section with conditional breakdown rendering
   - Removed redundant "Visa detaljer" toggle

## Files Created/Modified

- `src/lib/share/types.ts` - Added CalculationBreakdownPublic and CalculationResultsPublicWithBreakdown interfaces, updated PublicCalculationData to use extended type
- `src/actions/share.ts` - Added buildPublicBreakdown function, extended getPublicCalculation to extract inputs and build breakdown data
- `src/components/public/public-results-view.tsx` - Imported breakdown components, removed redundant toggle, added "Så har vi räknat" section with conditional rendering

## Decisions Made

**Build breakdown server-side for security**
- Breakdown data constructed in getPublicCalculation (server action) prevents client manipulation
- Sensitive data explicitly excluded before sending to client

**Sensible defaults for backwards compatibility**
- Older calculations missing breakdown inputs (cyclesPerDay, spreadOre, etc.) use defaults
- Public view gracefully handles missing breakdown data with conditional rendering

**Remove redundant "Visa detaljer" toggle**
- Original toggle showed simple text explanations
- New breakdown components show actual formulas and are more informative
- Cleaner UX with breakdown components replacing toggle content

**Emaldo battery detection by brand name**
- Check if brand.name includes "emaldo" (case-insensitive) to determine guaranteed income eligibility
- Simple pattern works with current data, can be refined if more brands added

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all tasks completed without blockers.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for:**
- Plan 03: Public view refinement
- Plan 04: Additional transparency features

**Notes:**
- Battery price already visible in public-battery-summary.tsx (TRANS-03 verified)
- Breakdown components tested in Plan 01, integration tested in build
- All TypeScript types validated, build passes without errors

---
*Phase: 07-calculation-transparency*
*Completed: 2026-01-31*
