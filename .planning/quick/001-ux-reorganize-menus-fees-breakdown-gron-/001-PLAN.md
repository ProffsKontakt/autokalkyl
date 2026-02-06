---
phase: quick
plan: 001
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/calculations/wizard/steps/electricity-step.tsx
  - src/components/calculations/wizard/steps/consumption-profile-step.tsx
  - src/components/calculations/wizard/steps/battery-step.tsx
  - src/components/calculations/results/summary-cards.tsx
  - src/components/public/public-battery-summary.tsx
autonomous: true

must_haves:
  truths:
    - "Fees breakdown (Energiskatt, Overforingsavgift) shows under Elpris section in ElectricityStep when koptElKwh > 0"
    - "ConsumptionDistributionSection (Forbrukningsprofil chart) shows in ConsumptionProfileStep"
    - "Gron Teknik subsidy info is hidden when customerType is FORETAG"
    - "Gron Teknik subsidy info remains visible when customerType is PRIVATPERSON"
  artifacts:
    - path: "src/components/calculations/wizard/steps/electricity-step.tsx"
      provides: "Fees breakdown preview under Elpris section"
    - path: "src/components/calculations/wizard/steps/consumption-profile-step.tsx"
      provides: "Monthly consumption distribution chart display"
    - path: "src/components/calculations/wizard/steps/battery-step.tsx"
      provides: "Conditional Gron Teknik display"
    - path: "src/components/calculations/results/summary-cards.tsx"
      provides: "Conditional Gron Teknik label"
  key_links:
    - from: "electricity-step.tsx"
      to: "calcTotalElectricityFees"
      via: "import from @/lib/calculations/fees"
      pattern: "calcTotalElectricityFees"
    - from: "battery-step.tsx"
      to: "useCalculationWizardStore"
      via: "customerType from store"
      pattern: "customerType"
---

<objective>
UX reorganization: Add fees breakdown under Elpris, show consumption chart in Forbrukningsprofil step, and hide Gron Teknik subsidy for FORETAG customers.

Purpose: Improve wizard UX by showing relevant information in logical sections and hide inapplicable subsidies for business customers.
Output: Updated wizard steps with reorganized content and conditional Gron Teknik display.
</objective>

<execution_context>
@/Users/julian.nordgren/.claude/get-shit-done/workflows/execute-plan.md
@/Users/julian.nordgren/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md

# Key files to understand current structure
@src/components/calculations/wizard/steps/electricity-step.tsx
@src/components/calculations/wizard/steps/consumption-profile-step.tsx
@src/components/calculations/wizard/steps/battery-step.tsx
@src/components/calculations/results/summary-cards.tsx
@src/components/calculations/results/consumption-distribution-section.tsx
@src/components/calculations/breakdowns/fees-breakdown.tsx
@src/stores/calculation-wizard-store.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add fees breakdown preview to ElectricityStep</name>
  <files>src/components/calculations/wizard/steps/electricity-step.tsx</files>
  <action>
    Add a fees breakdown preview under the "Elpris" section in ElectricityStep. This shows the user what fixed fees (Energiskatt, Overforingsavgift) they pay based on their koptElKwh input.

    Implementation:
    1. Import calcTotalElectricityFees from '@/lib/calculations/fees'
    2. Add a useMemo hook to calculate fees when koptElKwh > 0:
       - Call calcTotalElectricityFees(koptElKwh, customerType, null) for the result
       - Store consumptionKwh, energiskattSek, energiskattRateOre, overforingsavgiftSek, overforingsavgiftRateOre
    3. Add a new section AFTER the "Electricity Price" section (before Solar Toggle):
       - Header: "Fasta avgifter" with subtitle showing total per year
       - Show breakdown: Energiskatt (rate and total), Overforingsavgift (rate and total)
       - Use same styling as other info sections (bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4)
       - Only render when koptElKwh > 0
    4. Include note about moms being included/excluded based on customerType

    Style: Match the Summary Card style at bottom of ElectricityStep.
  </action>
  <verify>
    Open calculation wizard, go to step 2 (Elforbrukning & Elpris), enter kopt el value.
    Verify fees breakdown appears showing Energiskatt and Overforingsavgift with rates.
    Toggle between Privatperson/Foretag and verify moms note changes.
  </verify>
  <done>Fees breakdown preview shows under Elpris section when koptElKwh > 0 with correct calculations for customer type.</done>
</task>

<task type="auto">
  <name>Task 2: Add consumption distribution chart to ConsumptionProfileStep</name>
  <files>src/components/calculations/wizard/steps/consumption-profile-step.tsx</files>
  <action>
    The ConsumptionProfileStep already has a DistributionChart in the right column. The user wants the chart from "Resultat" (ConsumptionDistributionSection) which is an expandable version with heating type info.

    Implementation:
    1. ConsumptionProfileStep already shows DistributionChart - verify it works correctly
    2. The current implementation shows the chart in the right column when heatingType is selected
    3. No changes needed here - the chart is already properly integrated

    Note: The DistributionChart is the same chart used in ConsumptionDistributionSection. The user's request about "older chart from Resultat" refers to the monthly distribution chart which is already shown in ConsumptionProfileStep.

    If user wants the full ConsumptionDistributionSection (with expandable header and heating type description):
    - Import ConsumptionDistributionSection from '@/components/calculations/results/consumption-distribution-section'
    - Replace the current right column content with ConsumptionDistributionSection
    - Pass annualKwh={annualConsumptionKwh} heatingType={heatingType} defaultExpanded={true}

    Current approach is cleaner (inline chart). Mark as complete after verification.
  </action>
  <verify>
    Open calculation wizard, go to step 3 (Forbrukningsprofil).
    Verify monthly consumption distribution chart shows in right column when heating type is selected.
    Verify chart updates when annual kWh or heating type changes.
  </verify>
  <done>Consumption distribution chart displays correctly in ConsumptionProfileStep showing monthly distribution.</done>
</task>

<task type="auto">
  <name>Task 3: Hide Gron Teknik subsidy for FORETAG customers in BatteryStep</name>
  <files>src/components/calculations/wizard/steps/battery-step.tsx</files>
  <action>
    Add conditional rendering to hide the "Efter Gron Teknik (48.5%)" price line when customerType is 'FORETAG'.

    Implementation:
    1. Import customerType from useCalculationWizardStore (add to existing destructure)
    2. Find the price summary section (lines ~263-319) that shows "Efter Gron Teknik (48.5%)"
    3. Wrap the Gron Teknik div (lines ~298-305) in a conditional:
       ```tsx
       {customerType !== 'FORETAG' && (
         <div className="flex justify-between col-span-2 pt-2 border-t">
           <span className="text-gray-600">Efter Gron Teknik (48.5%):</span>
           ...
         </div>
       )}
       ```
    4. Ensure the border-t from Gron Teknik section is preserved on the "Totalt inkl. moms" line above when Gron Teknik is hidden

    Note: Gron Teknik (Green Technology) subsidy only applies to privatperson (individuals), not foretag (companies).
  </action>
  <verify>
    1. Open wizard, set customerType to "Privatperson", add battery with price
    2. Verify "Efter Gron Teknik (48.5%)" line shows in battery price summary
    3. Go back to step 2, change customerType to "Foretag"
    4. Return to battery step, verify "Efter Gron Teknik (48.5%)" line is hidden
    5. Verify layout still looks correct without the Gron Teknik line
  </verify>
  <done>Gron Teknik subsidy line hidden when customerType is FORETAG, visible when PRIVATPERSON.</done>
</task>

<task type="auto">
  <name>Task 4: Conditionally show Gron Teknik in SummaryCards</name>
  <files>src/components/calculations/results/summary-cards.tsx</files>
  <action>
    Update SummaryCards component to accept customerType and conditionally show "efter Gron Teknik" text.

    Implementation:
    1. Add customerType prop to SummaryCardsProps interface:
       ```tsx
       interface SummaryCardsProps {
         results: CalculationResults
         batteryName: string
         customerType?: 'PRIVATPERSON' | 'FORETAG'
       }
       ```
    2. Add customerType to function parameters with default value 'PRIVATPERSON'
    3. Update the "Aterbetalningstid" card (line ~32):
       - Change: `<p className="text-xs text-gray-400 mt-1">efter Gron Teknik</p>`
       - To: `{customerType !== 'FORETAG' && <p className="text-xs text-gray-400 mt-1">efter Gron Teknik</p>}`
    4. Update results-step.tsx to pass customerType to SummaryCards:
       - Find existing SummaryCards usage
       - Add customerType={customerType} prop
  </action>
  <verify>
    1. Open wizard as Privatperson, proceed to results
    2. Verify "efter Gron Teknik" shows under Aterbetalningstid card
    3. Go back, change to Foretag, return to results
    4. Verify "efter Gron Teknik" text is hidden
  </verify>
  <done>SummaryCards conditionally shows "efter Gron Teknik" based on customerType.</done>
</task>

<task type="auto">
  <name>Task 5: Update results-step.tsx to pass customerType to SummaryCards</name>
  <files>src/components/calculations/wizard/steps/results-step.tsx</files>
  <action>
    Pass customerType prop to SummaryCards component.

    Implementation:
    1. customerType is already destructured from useCalculationWizardStore (line ~84)
    2. Find the SummaryCards component usage (line ~329):
       ```tsx
       <SummaryCards
         results={primaryResult.results}
         batteryName={primaryResult.batteryName}
       />
       ```
    3. Add customerType prop:
       ```tsx
       <SummaryCards
         results={primaryResult.results}
         batteryName={primaryResult.batteryName}
         customerType={customerType}
       />
       ```
  </action>
  <verify>
    Changes verified in Task 4 verification steps.
  </verify>
  <done>results-step.tsx passes customerType to SummaryCards component.</done>
</task>

<task type="auto">
  <name>Task 6: Hide Gron Teknik in public battery summary for FORETAG</name>
  <files>src/components/public/public-battery-summary.tsx</files>
  <action>
    Check if public-battery-summary.tsx shows Gron Teknik information and conditionally hide it for FORETAG.

    Implementation:
    1. Read public-battery-summary.tsx to check for Gron Teknik references
    2. If Gron Teknik is displayed:
       - Add customerType to the component props (from electricity data if available)
       - Wrap Gron Teknik display in conditional {customerType !== 'FORETAG' && ...}
    3. If no Gron Teknik display, mark task as no changes needed

    Note: The public view may receive customerType through the electricity prop or need it added to the data flow from the server.
  </action>
  <verify>
    1. Create a calculation as Privatperson, share it, open public view - verify Gron Teknik info shows if present
    2. Create a calculation as Foretag, share it, open public view - verify Gron Teknik info is hidden if present
    3. If component doesn't show Gron Teknik, verify no changes were needed
  </verify>
  <done>Public battery summary conditionally shows Gron Teknik based on customerType (or no changes if not displayed).</done>
</task>

</tasks>

<verification>
Manual verification:
1. Create new calculation wizard session
2. Set customerType to Privatperson
3. Enter koptElKwh value - verify fees breakdown shows
4. Select heating type - verify consumption chart shows
5. Add battery with price - verify Gron Teknik subsidy shows
6. Go to results - verify Gron Teknik shows in summary cards
7. Go back and change customerType to Foretag
8. Verify fees breakdown adjusts for exkl moms
9. Verify Gron Teknik is hidden in battery step
10. Verify Gron Teknik is hidden in results summary cards

All TypeScript/build verification:
```bash
npm run build
```
</verification>

<success_criteria>
- [ ] Fees breakdown (Energiskatt, Overforingsavgift) shows under Elpris section in ElectricityStep
- [ ] Consumption distribution chart displays in ConsumptionProfileStep
- [ ] Gron Teknik subsidy hidden in BatteryStep when customerType is FORETAG
- [ ] Gron Teknik label hidden in SummaryCards when customerType is FORETAG
- [ ] Public view handles Gron Teknik display appropriately
- [ ] Build passes without TypeScript errors
</success_criteria>

<output>
After completion, create `.planning/quick/001-ux-reorganize-menus-fees-breakdown-gron-/001-SUMMARY.md`
</output>
