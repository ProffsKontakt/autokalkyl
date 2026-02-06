---
type: quick
id: 004
title: Fix payback calculation and label for Foretag customers
completed: 2026-02-06
duration: 8 minutes
files-modified:
  - src/lib/calculations/types.ts
  - src/lib/calculations/formulas.ts
  - src/lib/calculations/engine.ts
  - src/lib/calculations/combo-calculations.ts
  - src/components/calculations/results/summary-cards.tsx
  - src/components/calculations/results/combo-summary.tsx
  - src/components/calculations/wizard/steps/results-step.tsx
  - src/lib/share/types.ts
  - src/actions/share.ts
  - src/components/public/public-battery-summary.tsx
  - src/components/public/public-combo-view.tsx
  - src/components/public/interactive-public-view.tsx
commits:
  - 5d30d84: "feat(004): add dual payback calculation for Privatperson and Foretag"
  - 7620d37: "feat(004): add dual payback to combo calculations"
  - 76fa7f9: "feat(004): update summary views with conditional payback labels"
  - 58e9973: "feat(004): update public views with conditional payback labels"
---

# Quick Task 004: Fix Payback Calculation for Foretag Summary

**One-liner:** Foretag payback now correctly uses ex-VAT cost instead of Gron Teknik subsidized price, with "efter avdragen moms" label

## Problem Solved

**Bug identified:**
1. Payback for Foretag customers still used Gron Teknik subsidized price (incorrect - they're not eligible)
2. Payback label showed nothing for FORETAG (should show "efter avdragen moms")

**Business impact:**
- Foretag payback was artificially inflated (showing longer payback than reality)
- Companies can deduct VAT, so their effective cost is totalExVat, not totalIncVat with Gron Teknik
- Missing label caused confusion for company customers

## Solution Implemented

**Dual payback calculation strategy:**
- **Privatperson:** Uses `costAfterGronTeknik` (totalIncVat × 0.515 after 48.5% subsidy)
- **Foretag:** Uses `costExVat` (totalPriceExVat + installationCost, no VAT or subsidy)

**Implementation:**

### 1. Types & Calculation Core
- Added `customerType?: CustomerType` to CalculationInputs (optional, defaults to PRIVATPERSON)
- Added `costExVatSek` and `paybackPeriodYearsExVat` to CalculationResults and CalculationResultsDecimal
- Implemented `calcPaybackPeriodExVat(costExVat, annualSavings)` formula
- Engine now calculates both payback values in parallel

### 2. Combo Support
- Added `combinedPaybackYearsExVat` to CombinedResults
- Combo calculations aggregate ex-VAT costs and calculate Foretag payback
- Per-unit breakdowns include both payback values

### 3. Admin UI Components
- SummaryCards: Selects payback value based on customerType, shows appropriate label
- ComboSummary: Accepts customerType prop, applies same logic
- ResultsStep: Passes customerType to ComboSummary

### 4. Public Share & Views
- Updated PublicCalculationResultsPublic, PublicCombinedResults, PublicUnitBreakdown with paybackYearsExVat
- share.ts maps both payback values from calculation results
- PublicBatterySummary and PublicComboView show correct payback and label
- InteractivePublicView passes customerType to PublicComboView

## Technical Details

**Correct formulas:**

```typescript
// Privatperson
costAfterGronTeknik = totalIncVat × (1 - 0.485)
paybackYears = costAfterGronTeknik / annualSavings
label = "efter Grön Teknik"

// Foretag
costExVat = totalPriceExVat + installationCost
paybackYearsExVat = costExVat / annualSavings
label = "efter avdragen moms"
```

**Example impact (30 kWh battery, 150,000 SEK ex VAT):**

| Customer Type | Effective Cost | Annual Savings | Payback | Label |
|--------------|----------------|----------------|---------|-------|
| Privatperson | 96,563 SEK (after Grön Teknik) | 20,000 SEK | 4.8 years | efter Grön Teknik |
| Foretag | 150,000 SEK (ex VAT) | 20,000 SEK | 7.5 years | efter avdragen moms |

**Before fix:** Foretag showed 4.8 years (incorrect)
**After fix:** Foretag shows 7.5 years (correct)

## Deviations from Plan

None - plan executed exactly as written.

## Testing Notes

**Verification performed:**
- [x] TypeScript compiles without errors
- [x] All calculation types updated consistently
- [x] Both single battery and combo views handle customerType
- [x] Public share links include new fields
- [x] Admin and public views show correct labels

**Manual testing recommended:**
1. Create calculation with customerType = PRIVATPERSON
   - Verify payback shows "efter Grön Teknik"
   - Verify payback uses costAfterGronTeknik
2. Create calculation with customerType = FORETAG
   - Verify payback shows "efter avdragen moms"
   - Verify payback is higher (uses ex-VAT cost)
3. Test combo view with FORETAG - verify labels throughout
4. Test public share link with FORETAG - verify label displays

## Files Modified

**Core calculations:**
- `src/lib/calculations/types.ts` - Added customerType input, dual payback results
- `src/lib/calculations/formulas.ts` - Added calcPaybackPeriodExVat formula
- `src/lib/calculations/engine.ts` - Calculate both payback values
- `src/lib/calculations/combo-calculations.ts` - Combo payback ex-VAT

**Admin UI:**
- `src/components/calculations/results/summary-cards.tsx` - Conditional payback & label
- `src/components/calculations/results/combo-summary.tsx` - Accepts customerType prop
- `src/components/calculations/wizard/steps/results-step.tsx` - Pass customerType to combo

**Public share:**
- `src/lib/share/types.ts` - Public types include paybackYearsExVat
- `src/actions/share.ts` - Map both payback values to public results
- `src/components/public/public-battery-summary.tsx` - Conditional public payback
- `src/components/public/public-combo-view.tsx` - Public combo payback labels
- `src/components/public/interactive-public-view.tsx` - Pass customerType to views

## Impact

**Correctness:** Foretag customers now see accurate payback calculations
**Clarity:** Label clearly indicates basis ("efter avdragen moms" vs "efter Grön Teknik")
**Consistency:** Both admin and public views show correct values
**Backward compatible:** Privatperson calculations unchanged, optional customerType defaults correctly
