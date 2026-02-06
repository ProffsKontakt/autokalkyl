---
type: quick
plan: 002
title: Emaldo grid services - rename and customization
autonomous: true
files_modified:
  - src/components/calculations/controls/stodtjanster-input.tsx
  - src/components/calculations/breakdowns/stodtjanster-breakdown.tsx
  - src/stores/calculation-wizard-store.ts
  - src/lib/calculations/constants.ts
  - src/lib/calculations/engine.ts
---

<objective>
Improve Emaldo grid services display and customization:
1. Rename "Garanterad intäkt" to "Garanterad stödtjänstersättning" (more accurate terminology)
2. Allow user to customize the guaranteed monthly payout in the calculator

Context: The current "Garanterad intäkt" label is vague - the income comes specifically from guaranteed grid/frequency balancing services, not generic income. Users should also be able to override the default rates per calculation.

Note: Grid services stacking (quantity x rate) already works correctly - implemented in Phase 17-02.
</objective>

<context>
@.planning/STATE.md
@src/components/calculations/controls/stodtjanster-input.tsx
@src/components/calculations/breakdowns/stodtjanster-breakdown.tsx
@src/lib/calculations/constants.ts
@src/lib/calculations/engine.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Rename "Garanterad intäkt" to "Garanterad stödtjänstersättning"</name>
  <files>
    src/components/calculations/controls/stodtjanster-input.tsx
    src/components/calculations/breakdowns/stodtjanster-breakdown.tsx
  </files>
  <action>
Update UI labels in two files:

1. In `stodtjanster-input.tsx` line 71:
   - Change "Emaldo garanterad intäkt ({EMALDO_CAMPAIGN_MONTHS} månader)"
   - To "Emaldo garanterad stödtjänstersättning ({EMALDO_CAMPAIGN_MONTHS} månader)"

2. In `stodtjanster-breakdown.tsx` line 58:
   - Change "Emaldo garanterad intakt ({EMALDO_CAMPAIGN_MONTHS} man)"
   - To "Emaldo garanterad stodtjanstersattning ({EMALDO_CAMPAIGN_MONTHS} man)"

Note: The breakdown file uses ASCII-only characters (intakt, man) due to encoding constraints in that component.
  </action>
  <verify>
grep -n "stödtjänstersättning\|stodtjanstersattning" src/components/calculations/controls/stodtjanster-input.tsx src/components/calculations/breakdowns/stodtjanster-breakdown.tsx
# Should show the updated text in both files
  </verify>
  <done>
Both UI labels updated from "intäkt" to "stödtjänstersättning" with correct encoding per file.
  </done>
</task>

<task type="auto">
  <name>Task 2: Add customizable guaranteed payout rate to calculator</name>
  <files>
    src/stores/calculation-wizard-store.ts
    src/components/calculations/controls/stodtjanster-input.tsx
    src/lib/calculations/engine.ts
  </files>
  <action>
Add ability for users to customize the Emaldo guaranteed monthly rate (currently hardcoded by zone).

1. In `calculation-wizard-store.ts`:
   - Add `emaldoGuaranteedMonthlyOverride: number | null` to store state (null = use default)
   - Add `updateEmaldoGuaranteedMonthlyOverride: (rate: number | null) => void` action
   - Initialize to `null` in initial state
   - Add to `resetCalculation()` to clear on reset

2. In `stodtjanster-input.tsx`:
   - Import the new store actions
   - Add an "Justera" (Adjust) button next to the guaranteed rate display
   - When clicked, show an input field allowing override of the monthly rate
   - Add a "Återställ" (Reset) button to clear the override and use default zone rate
   - Display the override value when set, with indicator showing it's customized
   - Calculate totals using override value when set, otherwise use zone default

3. In `engine.ts`:
   - Add `emaldoGuaranteedMonthlyOverride?: number | null` to CalculationInputs type (if not already)
   - In the Emaldo stodtjanster calculation (around line 180):
     - Check if override is provided and not null
     - If override exists: use it as monthlyRate instead of EMALDO_STODTJANSTER_RATES[elomrade]
     - If no override: use existing zone-based lookup (unchanged behavior)

UI pattern for the override:
- Default: Show green box with zone rate, small "Justera" link
- Override mode: Show input field with current value, "Spara" and "Återställ" buttons
- When overridden: Show customized rate with subtle indicator (e.g., pencil icon or "Anpassad" badge)
  </action>
  <verify>
# Verify store has new state
grep -n "emaldoGuaranteedMonthlyOverride" src/stores/calculation-wizard-store.ts

# Verify input component has override UI
grep -n "Justera\|emaldoGuaranteedMonthlyOverride" src/components/calculations/controls/stodtjanster-input.tsx

# Verify engine uses override
grep -n "emaldoGuaranteedMonthlyOverride" src/lib/calculations/engine.ts

# Run dev server and manually test:
# 1. Select an Emaldo battery
# 2. See default zone rate displayed
# 3. Click "Justera" and enter custom rate
# 4. Verify calculations update with custom rate
# 5. Click "Återställ" and verify zone rate restored
  </verify>
  <done>
User can override the Emaldo guaranteed monthly rate per calculation. Default uses zone-based rates, override persists in wizard state, calculations reflect override when set.
  </done>
</task>

</tasks>

<verification>
1. Visual: Select an Emaldo battery, verify "Garanterad stödtjänstersättning" label appears (not "intäkt")
2. Visual: Verify customize/adjust option is available for the guaranteed rate
3. Functional: Override rate to a custom value (e.g., 1500 kr/month), verify annual calculations update
4. Functional: Reset to default, verify zone rate is restored
5. Functional: With quantity > 1, verify stacking shows correct math (custom rate x quantity)
</verification>

<success_criteria>
- [ ] "Garanterad intäkt" renamed to "Garanterad stödtjänstersättning" in all UI locations
- [ ] Users can customize the guaranteed monthly rate per calculation
- [ ] Default behavior unchanged (zone-based rates when no override)
- [ ] Override persists in wizard state during calculation session
- [ ] Grid services stacking (quantity multiplication) works with custom rates
</success_criteria>
