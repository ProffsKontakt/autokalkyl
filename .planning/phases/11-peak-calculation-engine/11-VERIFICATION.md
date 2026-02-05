---
phase: 11-peak-calculation-engine
verified: 2026-02-05T10:12:13Z
status: passed
score: 5/5 must-haves verified
re_verification:
  previous_status: gaps_found
  previous_score: 3/5
  gaps_closed:
    - "User can input target average peak (kW) in wizard"
    - "Results page uses user's target peak values in calculations"
  gaps_remaining: []
  regressions: []
---

# Phase 11: Peak Calculation Engine Verification Report

**Phase Goal:** Accurate peak tariff calculations using natagare-specific methods
**Verified:** 2026-02-05T10:12:13Z
**Status:** passed
**Re-verification:** Yes — after gap closure plan 11-04 was executed

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User can input target average peak (kW) and monthly ceiling | VERIFIED | PeakTargetInput imported and rendered in consumption-profile-step.tsx (lines 19, 72) |
| 2 | System applies natagare-specific peak method (e.g., Ellevio 3-peak averaging) | VERIFIED | calculatePeakBilling uses parsePeakMethod, supports N_PEAK_AVERAGE, 56 tests pass |
| 3 | Night peaks (22:00-06:00) apply configured discount automatically | VERIFIED | isNightHour + applyNightDiscount implemented and wired, tests pass |
| 4 | Results page shows before/after peak comparison with battery impact | VERIFIED | PeakComparison renders with user's targetAveragePeakKw (line 126, 215 use store value) |
| 5 | Peak shaving respects battery capacity constraints (cycles/day, max kW) | VERIFIED | calculatePeakBilling enforces batteryMaxDischargeKw constraint with Swedish messages |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/calculations/peak-billing/types.ts` | PeakMethodConfig, schemas, parsePeakMethod | VERIFIED | 130 lines, exports all required types, Zod schemas present |
| `src/lib/calculations/peak-billing/methods.ts` | calculateNPeakAverage, calculateSimpleMax, calculateSeasonalPeak | VERIFIED | 174 lines, all methods implemented with night discount integration |
| `src/lib/calculations/peak-billing/night-discount.ts` | isNightHour, applyNightDiscount | VERIFIED | 67 lines, handles overnight wrap correctly |
| `src/lib/calculations/peak-billing/index.ts` | calculatePeakBilling main function | VERIFIED | 121 lines, orchestrates calculation, constraint enforcement |
| `src/lib/calculations/peak-billing/peak-billing.test.ts` | Comprehensive test coverage | VERIFIED | 388 lines, 38 tests passing, covers all behaviors |
| `src/lib/calculations/peak-billing/estimation.ts` | estimateMonthlyPeakKw, estimatePeakFromAnnualConsumption | VERIFIED | 122 lines, heating-type-specific peak factors |
| `src/stores/calculation-wizard-store.ts` | targetAveragePeakKw, targetMonthlyCeilingKw fields | VERIFIED | Fields present with actions and persist enabled |
| `src/components/calculations/controls/peak-target-input.tsx` | Peak target input with auto-estimate | VERIFIED | 280 lines, fully implemented AND now wired into wizard |
| `src/lib/calculations/engine.ts` | Peak billing integrated into calculateBatteryROI | VERIFIED | calculatePeakBilling called with user's target peak value |
| `src/lib/calculations/types.ts` | Extended CalculationResults with peak billing fields | VERIFIED | All peak billing fields present in both interfaces |
| `src/components/calculations/results/peak-comparison.tsx` | Before/after peak comparison component | VERIFIED | 132 lines, renders all required fields with Swedish labels |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `methods.ts` | `night-discount.ts` | import isNightHour | WIRED | Import applyNightDiscount |
| `index.ts` | `methods.ts` | import calculate* | WIRED | Imports all calculation methods |
| `consumption-profile-step.tsx` | `peak-target-input.tsx` | import PeakTargetInput | WIRED | Line 19: import, Line 72: rendered (GAP CLOSED) |
| `peak-target-input.tsx` | `calculation-wizard-store.ts` | useCalculationWizardStore | WIRED | Lines 4, 31-52: reads and updates store |
| `peak-target-input.tsx` | `estimation.ts` | import estimatePeakFromAnnualConsumption | WIRED | Line 5: import, Line 61: used in useMemo |
| `engine.ts` | `peak-billing/index.ts` | import calculatePeakBilling | WIRED | Line 30: import, Line 142: called with config |
| `results-step.tsx` | `peak-comparison.tsx` | import PeakComparison | WIRED | Line 11: import, Line 237: rendered conditionally |
| `results-step.tsx` | `calculation-wizard-store.ts` | targetAveragePeakKw | WIRED | Line 74: destructured, Line 126/215: used (GAP CLOSED) |

### Requirements Coverage

| Requirement | Status | Blocking Issue |
|-------------|--------|----------------|
| PEAK-05: User can input target average peak (kW) | SATISFIED | PeakTargetInput renders in wizard, stores value |
| PEAK-06: User can input target monthly peak ceiling (kW) | SATISFIED | PeakTargetInput includes ceiling input field |
| PEAK-07: Super Admin can configure peak calculation method per natagare | SATISFIED | Already done in Phase 9, parsePeakMethod works |
| PEAK-08: System automatically applies night discount based on natagare configuration | SATISFIED | isNightHour + applyNightDiscount wired into methods |
| PEAK-09: Results page shows peak shaving impact with before/after comparison | SATISFIED | PeakComparison renders with user's target values |
| PEAK-10: Peak calculations respect battery capacity constraints | SATISFIED | calculatePeakBilling enforces batteryMaxDischargeKw with Swedish messages |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None | - | - | - | All previous anti-patterns resolved |

### Gap Closure Summary

**Gap 1: PeakTargetInput Orphaned** — CLOSED

Previous state: Component existed (280 lines, fully functional) but never imported or rendered.

Current state:
- `consumption-profile-step.tsx` line 19: `import { PeakTargetInput } from '@/components/calculations/controls/peak-target-input'`
- `consumption-profile-step.tsx` line 72: `<PeakTargetInput />` rendered in wizard

**Gap 2: Hardcoded DEFAULT_CURRENT_PEAK_KW** — CLOSED

Previous state: `results-step.tsx` used hardcoded `DEFAULT_CURRENT_PEAK_KW` (15 kW) instead of user input.

Current state:
- `results-step.tsx` line 74: `targetAveragePeakKw` destructured from wizard store
- `results-step.tsx` line 126: `currentPeakKw: targetAveragePeakKw ?? DEFAULT_CURRENT_PEAK_KW` (user value with fallback)
- `results-step.tsx` line 215: `currentPeakKw={targetAveragePeakKw ?? DEFAULT_CURRENT_PEAK_KW}` (user value with fallback)
- `results-step.tsx` line 147: `targetAveragePeakKw` added to useMemo dependencies

### Regression Check

All previously verified items re-checked:
- Peak billing module: 56 tests passing (38 peak-billing + 18 consumption-profiles)
- Build completes without errors
- All key wiring intact
- No new anti-patterns introduced

### Human Verification Suggested

While all automated checks pass, manual testing recommended:

1. **Full wizard flow test**
   - Create new calculation
   - Select heating type in consumption profile step
   - Observe PeakTargetInput appears with auto-estimated values
   - Modify values manually, verify badge changes to "Manuellt"
   - Proceed to results step
   - Verify PeakComparison shows the entered target peak value

2. **Fallback behavior test**
   - Clear targetAveragePeakKw from store (or create calculation without peak input)
   - Verify results-step falls back to DEFAULT_CURRENT_PEAK_KW (15 kW)

---

_Verified: 2026-02-05T10:12:13Z_
_Verifier: Claude (gsd-verifier)_
_Re-verification after: 11-04-PLAN gap closure_
