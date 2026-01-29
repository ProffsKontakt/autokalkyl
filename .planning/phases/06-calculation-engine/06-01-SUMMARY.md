---
phase: 06-calculation-engine
plan: 01
subsystem: calculations
tags: [decimal.js, formulas, constraints, sonner, toasts, spotpris, emaldo, peak-shaving]

# Dependency graph
requires:
  - phase: v1.0
    provides: "Base calculation engine with formulas.ts and constants.ts"
provides:
  - "calcSpotprisSavingsV2 with correct spotpris formula (spread × efficiency × cycles × capacity × days)"
  - "EMALDO_STODTJANSTER_RATES constants for SE1-SE4 zones"
  - "calculateActualPeakShaving constraint function respecting battery capacity"
  - "Sonner toast provider app-wide for user warnings"
affects: [06-calculation-engine, calculation-controls, roi-display]

# Tech tracking
tech-stack:
  added: [sonner@2.0.7]
  patterns: ["Constraint functions return structured results with isConstrained flag", "Toast notifications for calculation warnings"]

key-files:
  created:
    - src/lib/calculations/constraints.ts
    - src/components/ui/sonner.tsx
  modified:
    - src/lib/calculations/formulas.ts
    - src/lib/calculations/constants.ts
    - src/app/layout.tsx

key-decisions:
  - "Keep calcSpotprisSavings (original) and add calcSpotprisSavingsV2 for backwards compatibility"
  - "Use custom Sonner component without next-themes (project has custom dark mode)"
  - "Constraint functions return structured objects with warning messages in Swedish"

patterns-established:
  - "Constraint functions return { targetValue, actualValue, isConstrained, constraintMessage } for UI feedback"
  - "Swedish constraint messages ready for direct user display"
  - "Calculation constants organized by feature (EMALDO prefix, GRID features)"

# Metrics
duration: 4min
completed: 2026-01-29
---

# Phase 6 Plan 1: Calculation Formulas & Foundation Summary

**Corrected spotpris formula with efficiency/cycles, Emaldo stodtjanster zone rates, peak shaving constraints, and Sonner toast notifications**

## Performance

- **Duration:** 4 minutes
- **Started:** 2026-01-29T22:31:31Z
- **Completed:** 2026-01-29T22:36:07Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments
- Fixed spotpris calculation to use correct formula: spread × efficiency × cycles × capacity × days
- Added Emaldo stodtjanster rates by zone (SE1-SE3: 1,110 SEK/mo, SE4: 1,370 SEK/mo) with 36-month campaign duration
- Created constraint module with peak shaving capacity limits (min of target and battery capacity)
- Installed Sonner toast library and added app-wide provider for calculation warnings

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix spotpris formula and add stodtjanster constants** - `aaba83b` (feat)
2. **Task 2: Create peak shaving constraints module** - `7e93854` (feat)
3. **Task 3: Install Sonner and add toast provider** - `1521f32` (feat)

## Files Created/Modified
- `src/lib/calculations/formulas.ts` - Added calcSpotprisSavingsV2 with correct formula
- `src/lib/calculations/constants.ts` - Added EMALDO_STODTJANSTER_RATES, EMALDO_CAMPAIGN_MONTHS (36), DEFAULT_ROUND_TRIP_EFFICIENCY (0.8), HIGH_CYCLES_WARNING_THRESHOLD (2)
- `src/lib/calculations/constraints.ts` - NEW: calculateActualPeakShaving (PEAK-02), calculateWarrantyLifeAtCycles for future warranty tracking
- `src/components/ui/sonner.tsx` - NEW: Sonner toast component with dark mode support (no next-themes dependency)
- `src/app/layout.tsx` - Added Toaster with richColors, closeButton, top-right position
- `package.json` - Added sonner@2.0.7 dependency

## Decisions Made

1. **Backwards compatibility:** Kept original calcSpotprisSavings and added calcSpotprisSavingsV2 to avoid breaking existing code
2. **No next-themes dependency:** Created custom Sonner component without next-themes since project uses custom dark mode implementation
3. **Swedish constraint messages:** Constraint functions return Swedish messages ready for direct user display (e.g., "Batteriet kan max leverera X kW")
4. **Structured constraint results:** Pattern established - constraint functions return { targetValue, actualValue, isConstrained, constraintMessage } for rich UI feedback

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**Issue:** shadcn CLI prompted for components.json creation which would hang the process.

**Resolution:** Installed sonner package directly via `pnpm add sonner` and manually created src/components/ui/sonner.tsx following shadcn patterns but adapted for project's custom dark mode (no next-themes).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for:**
- Phase 6 Plan 2: Calculation control components can now use:
  - calcSpotprisSavingsV2 for accurate spotpris calculations
  - EMALDO_STODTJANSTER_RATES for grid services pricing
  - calculateActualPeakShaving for capacity constraint checks
  - toast() from sonner for high cycles warnings (SPOT-03)

**Foundation established:**
- Correct formulas in place
- Constants organized by feature
- Constraint pattern ready for expansion (warranty, efficiency, etc.)
- Toast infrastructure ready for user feedback

**No blockers.**

---
*Phase: 06-calculation-engine*
*Completed: 2026-01-29*
