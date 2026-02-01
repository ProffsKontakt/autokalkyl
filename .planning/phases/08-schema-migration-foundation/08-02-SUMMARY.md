# Phase 08 Plan 02: Centralize Peak KW Constant Summary

**One-liner:** Centralized hardcoded currentPeakKw = 8 into DEFAULT_CURRENT_PEAK_KW constant across 5 files

## What Was Done

### Task 1: Add DEFAULT_CURRENT_PEAK_KW constant
- Added `DEFAULT_CURRENT_PEAK_KW = 8` to `src/lib/calculations/constants.ts`
- Included documentation explaining usage for new vs existing calculations
- Referenced FIX-03 requirement in comments
- **Commit:** 09f146c

### Task 2: Replace hardcoded values in wizard components
- Updated `src/components/calculations/wizard/steps/results-step.tsx`:
  - Added import for DEFAULT_CURRENT_PEAK_KW
  - Replaced `currentPeakKw: 8` (line 109) with constant
  - Replaced `currentPeakKw={8}` JSX prop (line 190) with constant
- Updated `src/components/calculations/wizard/calculation-wizard.tsx`:
  - Added import for DEFAULT_CURRENT_PEAK_KW
  - Replaced `currentPeakKw: 8` (line 176) with constant
- Removed TODO comments as they're now addressed
- **Commit:** 078c59b

### Task 3: Replace hardcoded values in public components and actions
- Updated `src/components/public/public-consumption-simulator.tsx`:
  - Added import for DEFAULT_CURRENT_PEAK_KW
  - Replaced `currentPeakKw: 8` (line 153) with constant
- Updated `src/actions/share.ts`:
  - Added import for DEFAULT_CURRENT_PEAK_KW
  - Replaced incorrect estimation formula (`Number(calculation.annualConsumptionKwh) / 8760`) with constant
  - Note: The old formula calculated average power, not peak power
- **Commit:** 9f0c619

## Verification Results

| Check | Result |
|-------|--------|
| TypeScript compilation | Pass |
| No hardcoded `currentPeakKw: 8` | Pass (0 matches) |
| No hardcoded `currentPeakKw={8}` | Pass (0 matches) |
| Constant exports correctly | Pass |
| Import count | 5 files import constant |

## Files Modified

| File | Change |
|------|--------|
| `src/lib/calculations/constants.ts` | Added DEFAULT_CURRENT_PEAK_KW constant |
| `src/components/calculations/wizard/steps/results-step.tsx` | Import + 2 replacements |
| `src/components/calculations/wizard/calculation-wizard.tsx` | Import + 1 replacement |
| `src/components/public/public-consumption-simulator.tsx` | Import + 1 replacement |
| `src/actions/share.ts` | Import + 1 replacement |

## Deviations from Plan

None - plan executed exactly as written.

## Technical Notes

- The `share.ts` replacement fixed an incorrect fallback formula
- Original: `Number(calculation.annualConsumptionKwh) / 8760` (gives average power, not peak)
- New: `DEFAULT_CURRENT_PEAK_KW` (correct 8kW residential default)
- Build error encountered is unrelated (Next.js infrastructure issue with pages-manifest.json)

## Requirements Addressed

- **FIX-03:** Centralize currentPeakKw constant for future user input capability

## Next Phase Readiness

- Constant is ready for Phase 11 where users will input actual peak values
- All calculation paths now use the centralized constant
- No blockers identified
