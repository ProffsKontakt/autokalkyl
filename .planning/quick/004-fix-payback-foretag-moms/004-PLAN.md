---
type: quick
id: 004
title: Fix payback calculation and label for Foretag customers
files_modified:
  - src/lib/calculations/types.ts
  - src/lib/calculations/formulas.ts
  - src/lib/calculations/engine.ts
  - src/lib/calculations/combo-calculations.ts
  - src/components/calculations/results/summary-cards.tsx
  - src/components/calculations/results/combo-summary.tsx
  - src/components/public/public-combo-view.tsx
  - src/components/public/public-battery-summary.tsx
autonomous: true
---

<objective>
Fix payback time calculation and label display for Foretag (company) customers.

**Current bug:**
1. Payback for Foretag still uses Gron Teknik subsidized price (wrong)
2. When customerType = FORETAG, payback label shows nothing (should show "efter avdragen moms")

**Correct logic:**
- **Privatperson**: Payback uses `costAfterGronTeknik = totalIncVat * (1 - 0.485)`, label: "efter Gron Teknik"
- **Foretag**: Payback uses `totalExVat = totalIncVat / 1.25` (they deduct VAT), label: "efter avdragen moms"

Foretag customers are NOT eligible for Gron Teknik (private persons only). They pay ex-VAT price since they can deduct moms.
</objective>

<context>
@.planning/STATE.md
@src/lib/calculations/types.ts
@src/lib/calculations/engine.ts
@src/lib/calculations/formulas.ts
@src/lib/calculations/combo-calculations.ts
@src/components/calculations/results/summary-cards.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add customerType to CalculationInputs and payback fields to results</name>
  <files>src/lib/calculations/types.ts</files>
  <action>
Add to CalculationInputs interface:
- `customerType?: CustomerType` (optional, defaults to PRIVATPERSON for backward compatibility)

Add to CalculationResults interface:
- `costExVatSek: number` - Total cost ex VAT (for Foretag payback base)
- `paybackPeriodYearsExVat?: number` - Alternative payback calculated using ex-VAT cost (for Foretag)

Add same fields to CalculationResultsDecimal interface:
- `costExVatSek: Decimal`
- `paybackPeriodYearsExVat?: Decimal`

The existing paybackPeriodYears continues to use costAfterGronTeknik (for Privatperson).
  </action>
  <verify>TypeScript compiles: `pnpm tsc --noEmit`</verify>
  <done>Types updated with customerType input and dual payback calculation fields</done>
</task>

<task type="auto">
  <name>Task 2: Add calcPaybackPeriodExVat formula and update engine</name>
  <files>src/lib/calculations/formulas.ts, src/lib/calculations/engine.ts</files>
  <action>
In formulas.ts - add new formula:
```typescript
/**
 * Calculate payback period for Foretag using ex-VAT cost.
 * Foretag can deduct VAT so their effective cost is totalExVat.
 */
export function calcPaybackPeriodExVat(costExVat: Decimal, annualSavings: Decimal): Decimal {
  if (annualSavings.isZero()) return d(999)
  return costExVat.div(annualSavings)
}
```

In engine.ts - calculateBatteryROI function:
1. Calculate costExVat (already available as intermediate): `totalExVat = totalPriceExVat + installationCost`
2. Calculate paybackPeriodExVat using the new formula
3. Add costExVatSek and paybackPeriodYearsExVat to both decimals and results objects

The costExVat is simply `totalPriceExVat + installationCost` (no VAT added). This is already calculated but not stored.
  </action>
  <verify>TypeScript compiles: `pnpm tsc --noEmit`</verify>
  <done>Engine calculates and returns both payback values (Gron Teknik and ex-VAT)</done>
</task>

<task type="auto">
  <name>Task 3: Update combo-calculations to include dual payback</name>
  <files>src/lib/calculations/combo-calculations.ts</files>
  <action>
Update calculateCombinedResults to support customerType and dual payback:

1. Accept customerType in baseInputs (already part of CalculationInputs now)
2. Track totalCostExVat (already done) and calculate combinedPaybackYearsExVat
3. Add to CombinedResults return:
   - `combinedPaybackYearsExVat?: number` - Payback using ex-VAT cost for Foretag

Note: The per-unit breakdown already has paybackYears from perUnitResults which now includes paybackPeriodYearsExVat.

Update CombinedResults interface in types.ts if not done in Task 1:
- Add `combinedPaybackYearsExVat?: number`
  </action>
  <verify>TypeScript compiles: `pnpm tsc --noEmit`</verify>
  <done>Combo calculations support dual payback for Foretag</done>
</task>

<task type="auto">
  <name>Task 4: Update summary-cards and combo-summary with conditional labels</name>
  <files>src/components/calculations/results/summary-cards.tsx, src/components/calculations/results/combo-summary.tsx</files>
  <action>
In summary-cards.tsx:
1. Use the correct payback value based on customerType:
   - PRIVATPERSON: `results.paybackPeriodYears` (uses costAfterGronTeknik)
   - FORETAG: `results.paybackPeriodYearsExVat` (uses costExVat)
2. Show the correct label:
   - PRIVATPERSON: "efter Gron Teknik"
   - FORETAG: "efter avdragen moms"

Current code has `customerType !== 'FORETAG'` condition but shows nothing for FORETAG. Fix:
```tsx
<p className="text-xs text-gray-400 mt-1">
  {customerType === 'FORETAG' ? 'efter avdragen moms' : 'efter Gron Teknik'}
</p>
```

And for the payback value:
```tsx
const paybackYears = customerType === 'FORETAG'
  ? (results.paybackPeriodYearsExVat ?? results.paybackPeriodYears)
  : results.paybackPeriodYears
```

In combo-summary.tsx:
1. Add customerType prop (optional, defaults to PRIVATPERSON)
2. Same logic: use combinedPaybackYearsExVat for FORETAG, combinedPaybackYears for PRIVATPERSON
3. Show appropriate label: "efter avdragen moms" vs "efter Gron Teknik"
  </action>
  <verify>TypeScript compiles: `pnpm tsc --noEmit`</verify>
  <done>Admin results screens show correct payback and labels for both customer types</done>
</task>

<task type="auto">
  <name>Task 5: Update public view components with conditional labels</name>
  <files>src/components/public/public-battery-summary.tsx, src/components/public/public-combo-view.tsx</files>
  <action>
In public-battery-summary.tsx:
- The component already receives `electricity?: PublicElectricityData` which contains customerType
- Add label below payback value:
  - If electricity?.customerType === 'FORETAG': show "efter avdragen moms"
  - Else: show "efter Gron Teknik"
- Note: Public results use `results.paybackYears` which maps to appropriate calculation

In public-combo-view.tsx:
- Add optional `customerType?: string` prop to PublicComboViewProps
- Show conditional label for payback:
  - FORETAG: "efter avdragen moms"
  - Default: "efter Gron Teknik"

Also update PublicCombinedResults in src/lib/share/types.ts:
- Add `combinedPaybackYearsExVat?: number` to match CombinedResults
- Add `customerType?: string` to PublicCalculationData.calculation

Update the share link builder to include customerType from electricity data.
  </action>
  <verify>TypeScript compiles: `pnpm tsc --noEmit`</verify>
  <done>Public views show correct payback labels for Foretag customers</done>
</task>

</tasks>

<verification>
1. TypeScript compiles: `pnpm tsc --noEmit`
2. Dev server runs: `pnpm dev`
3. Manual test:
   - Create calculation with customerType = PRIVATPERSON
   - Verify payback shows "efter Gron Teknik"
   - Create calculation with customerType = FORETAG
   - Verify payback shows "efter avdragen moms"
   - Verify payback time is shorter for FORETAG (ex-VAT < after Gron Teknik typically)
   - Test combo view with FORETAG - verify same labels
   - Test public share link with FORETAG - verify label shows correctly
</verification>

<success_criteria>
- Foretag customers see payback calculated from ex-VAT cost (not Gron Teknik)
- Foretag payback shows "efter avdragen moms" label
- Privatperson payback continues to show "efter Gron Teknik" label
- Both single battery and combo views show correct labels
- Public share links show correct labels based on customerType
- No regressions for existing Privatperson calculations
</success_criteria>

<output>
After completion, update `.planning/STATE.md` quick tasks table and commit.
</output>
