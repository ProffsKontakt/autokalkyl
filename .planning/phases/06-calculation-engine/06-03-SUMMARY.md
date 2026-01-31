---
phase: 06-calculation-engine
plan: 03
subsystem: calculation-engine
one-liner: "Calculation engine wired to sliders with real-time ROI updates and three-category savings breakdown"
tags: [react, zustand, calculations, roi, battery, savings]
requires:
  - 06-01
  - 06-02
provides:
  - "calculateBatteryROI accepts cyclesPerDay, peakShavingPercent, currentPeakKw, postCampaignRatePerKwYear, elomrade, isEmaldoBattery"
  - "Results include peakShavingKw, newPeakKw, stodtjansterGuaranteedSek, stodtjansterPostCampaignSek, stodtjansterTotalSek"
  - "Spotpris uses corrected formula with efficiency and cycles"
  - "Effect tariff uses actual shaved kW after constraint"
  - "Integrated CyclesSlider, PeakShavingSlider, StodtjansterInput into results step"
  - "Real-time calculation updates when sliders change"
affects:
  - 07 # Calculation transparency will build on these results
tech-stack:
  added:
    - none # All dependencies existed from 06-01, 06-02
  patterns:
    - "useMemo recalculation on slider state changes"
    - "Server-client calculation consistency via shared engine"
key-files:
  created: []
  modified:
    - src/lib/calculations/engine.ts
    - src/lib/calculations/types.ts
    - src/components/calculations/wizard/steps/results-step.tsx
decisions:
  - id: DEC-06-03-01
    title: "Use totalProjectionYears default of 10"
    choice: "Default to 10 years for stodtjanster projection"
    rationale: "Standard ROI projection period, matches existing calculations"
  - id: DEC-06-03-02
    title: "Emaldo detection via brand name"
    choice: "Check if batteryInfo.brandName.toLowerCase().includes('emaldo')"
    rationale: "Simple heuristic that works for current battery catalog"
  - id: DEC-06-03-03
    title: "currentPeakKw placeholder value"
    choice: "Hardcoded 8 kW as currentPeakKw"
    rationale: "Placeholder until customer peak data is available from consumption step"
metrics:
  duration: "5min"
  completed: "2026-01-31"
---

# Phase 6 Plan 03: Control Integration & Engine Wiring Summary

**One-liner:** Calculation engine wired to sliders with real-time ROI updates and three-category savings breakdown

**Status:** Complete (checkpoint approved)
**Completed:** 2026-01-31
**Duration:** ~5 minutes

## What Was Built

Connected slider controls to the calculation engine and integrated them into the results step for real-time ROI calculations:

1. **Calculation Engine Updates (engine.ts, types.ts)**
   - Extended `CalculationInputs` with: cyclesPerDay, peakShavingPercent, currentPeakKw, postCampaignRatePerKwYear, elomrade, isEmaldoBattery, totalProjectionYears
   - Extended `CalculationResults` with: peakShavingKw, newPeakKw, stodtjansterGuaranteedSek, stodtjansterPostCampaignSek, stodtjansterTotalSek, stodtjansterAnnualAverageSek
   - Spotpris now uses `calcSpotprisSavingsV2` with efficiency and cycles per day
   - Effect tariff uses `calculateActualPeakShaving` to respect battery capacity constraint
   - Stodtjanster calculation handles Emaldo zone-based rates vs. non-Emaldo manual entry

2. **Results Step Integration (results-step.tsx)**
   - Added CyclesSlider, PeakShavingSlider, StodtjansterInput components
   - Reads slider values from wizard store: cyclesPerDay, peakShavingPercent, postCampaignRate
   - useMemo recalculates on any slider change (no debounce per requirements)
   - Passes all new parameters to calculateBatteryROI

3. **Additional Fixes**
   - Synchronized public view calculations with admin panel formulas
   - Corrected pie chart sizing in savings breakdown
   - Fixed formula consistency across components

## Requirements Mapping

| Requirement | Delivery | Evidence |
|-------------|----------|----------|
| SPOT-01: Corrected spotpris formula | Complete | Uses calcSpotprisSavingsV2 with efficiency |
| SPOT-02: Cycles/day affects calculation | Complete | cyclesPerDay passed to engine |
| PEAK-01: Peak shaving affects results | Complete | peakShavingPercent passed to engine |
| PEAK-02: Respect battery capacity | Complete | Uses calculateActualPeakShaving constraint |
| PEAK-03: Show actual kW shaved | Complete | peakShavingKw in results |
| GRID-01: Emaldo zone rates | Complete | elomrade + isEmaldoBattery logic |
| GRID-02: 36-month campaign | Complete | stodtjansterGuaranteedSek |
| GRID-03: Post-campaign projection | Complete | stodtjansterPostCampaignSek |
| GRID-04: Total over projection | Complete | stodtjansterTotalSek |
| Real-time updates | Complete | useMemo with slider dependencies |

## Technical Implementation

### Engine Changes
```typescript
// New input parameters
interface CalculationInputs {
  // ... existing
  cyclesPerDay: number
  peakShavingPercent: number
  currentPeakKw?: number
  postCampaignRatePerKwYear?: number
  elomrade?: 'SE1' | 'SE2' | 'SE3' | 'SE4'
  isEmaldoBattery?: boolean
  totalProjectionYears?: number
}

// New result fields
interface CalculationResults {
  // ... existing
  peakShavingKw: number
  newPeakKw: number
  stodtjansterGuaranteedSek: number
  stodtjansterPostCampaignSek: number
  stodtjansterTotalSek: number
  stodtjansterAnnualAverageSek: number
}
```

### Results Step Integration
```tsx
// Control values from store
const { cyclesPerDay, peakShavingPercent, postCampaignRate } = useCalculationWizardStore()

// Calculate with new parameters
const { results } = calculateBatteryROI({
  // ... existing params
  cyclesPerDay,
  peakShavingPercent,
  currentPeakKw: 8, // TODO: Get from customer data
  postCampaignRatePerKwYear: postCampaignRate,
  elomrade: elomrade || undefined,
  isEmaldoBattery: batteryInfo.brandName.toLowerCase().includes('emaldo'),
  totalProjectionYears: 10,
})
```

## Commits

| Commit | Message | Files |
|--------|---------|-------|
| 2220d92 | feat(06-03): update calculation engine with new parameters | engine.ts, types.ts |
| c520d97 | feat(06-03): integrate controls into results step | results-step.tsx |
| 28e6718 | fix(06-03): correct calculation formulas and pie chart sizing | results-step.tsx, savings-breakdown.tsx |
| 7948699 | fix(06-03): sync public view calculations with admin panel | share action, public results |

## Decisions Made

**DEC-06-03-01: Use totalProjectionYears default of 10**
- **Choice:** Default to 10 years for stodtjanster projection
- **Rationale:** Standard ROI projection period, matches existing calculations

**DEC-06-03-02: Emaldo detection via brand name**
- **Choice:** Check if batteryInfo.brandName.toLowerCase().includes('emaldo')
- **Rationale:** Simple heuristic that works for current battery catalog

**DEC-06-03-03: currentPeakKw placeholder value**
- **Choice:** Hardcoded 8 kW as currentPeakKw
- **Rationale:** Placeholder until customer peak data is available from consumption step

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected calculation formulas**
- **Found during:** Task 2 verification
- **Issue:** Pie chart sizing and formula display inconsistencies
- **Fix:** Corrected formulas and chart sizing in savings breakdown
- **Files modified:** results-step.tsx, savings-breakdown.tsx
- **Committed in:** 28e6718

**2. [Rule 1 - Bug] Synced public view with admin panel**
- **Found during:** Task 2 verification
- **Issue:** Public share view used different calculation logic than admin panel
- **Fix:** Unified calculation path to use same engine
- **Files modified:** Share action, public results components
- **Committed in:** 7948699

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both fixes essential for correctness. No scope creep.

## Checkpoint Verification

The checkpoint (Task 3) was verified and approved:
- Cycles/day slider: Range 0.5-3, toast warning at >2 works
- Peak shaving slider: Shows constraint when battery capacity exceeded
- Stodtjanster: Emaldo zone rates display correctly
- Real-time updates: Sliders trigger immediate recalculation
- Savings breakdown: All three categories show with correct values

## Phase 6 Completion Status

With plan 06-03 complete, Phase 6 (Calculation Engine) is now **COMPLETE**:

| Plan | Name | Status |
|------|------|--------|
| 06-01 | Calculation Formulas & Foundation | Complete |
| 06-02 | Slider Controls & Store Extension | Complete |
| 06-03 | Control Integration & Engine Wiring | Complete |

All v1.1 Fixed ROI Calculations requirements for Phase 6 have been delivered.

## Next Phase Readiness

**Ready for Phase 7 (Calculation Transparency)**
- Calculation engine now produces all required output fields
- Controls are integrated and functional
- Results update in real-time

**Known limitations for future work:**
- currentPeakKw is hardcoded (should come from customer data)
- No validation on unrealistic input combinations
- Could add "reset to defaults" button on controls

## References

**Related Plans:**
- 06-01-SUMMARY.md: Calculation formulas and constants foundation
- 06-02-SUMMARY.md: Slider controls and store extension

**Key Files:**
- src/lib/calculations/engine.ts: Main calculation engine
- src/lib/calculations/types.ts: Type definitions
- src/components/calculations/wizard/steps/results-step.tsx: Results display with controls
- src/stores/calculation-wizard-store.ts: State management
