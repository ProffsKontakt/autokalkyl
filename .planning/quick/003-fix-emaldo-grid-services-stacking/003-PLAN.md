---
type: quick
id: "003"
title: "Fix Emaldo grid services stacking and Resultat screen bugs"
files_modified:
  - src/components/calculations/wizard/steps/results-step.tsx
  - src/components/calculations/results/combo-breakdown.tsx
autonomous: true
---

<objective>
Fix critical bugs in komboinvestering mode where Emaldo grid services are not calculating correctly with quantity > 1. When 2 Emaldo batteries are selected in SE4, grid services should show 32,880 SEK/year (1370 x 2 x 12), not the generic 6480 SEK/year rate.

Secondary: Fix decimal precision showing 15.4 instead of 15.36 kWh and remove duplicate ROI sections from Resultat screen.
</objective>

<context>
## Root Cause Analysis

**BUG #1: isEmaldoBattery missing from combo baseInputs**
- `results-step.tsx` line 203-220 builds `baseInputs` for `calculateCombinedResults`
- Missing: `isEmaldoBattery` flag that engine.ts needs (line 178)
- Without this flag, engine.ts uses generic path (line 193-197): `gridServicesRatePerKwYear * maxDischargeKw`
- Result: 600 SEK/kW/year x 10.8 kW = 6,480 SEK/year (wrong)
- Should be: 1370 SEK/month x 12 = 16,440 SEK/year per Emaldo in SE4

**BUG #2: Combo calculations need per-battery Emaldo detection**
- Even if we add `isEmaldoBattery` to baseInputs, combo-calculations.ts needs to check each battery
- Solution: Pass battery brand info through BatterySelection or detect in baseInputs

**BUG #3: Decimal precision in combo-breakdown.tsx**
- Line 45: `{battery.capacityKwh} kWh` uses raw number
- Should use `toFixed(2)` for consistent 2-decimal display (7.68 not 7.7)

**BUG #4: Duplicate sections in Resultat screen**
- When in komboinvestering mode, still shows SavingsBreakdown and ROITimelineChart below combo components
- These show single-battery data which is confusing with combo view
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add isEmaldoBattery to combo baseInputs</name>
  <files>src/components/calculations/wizard/steps/results-step.tsx</files>
  <action>
In the `combinedResults` useMemo block (around line 181-222):

1. Before building BatterySelection array, check if ANY selected battery is Emaldo:
```typescript
// Check if any battery in selection is Emaldo (for grid services calculation)
const hasEmaldoBattery = selectedBatteries.some(selection => {
  const batteryInfo = batteryList.find(b => b.id === selection.configId)
  return batteryInfo?.brandName.toLowerCase().includes('emaldo')
})
```

2. Add `isEmaldoBattery: hasEmaldoBattery` to baseInputs object (around line 217):
```typescript
const baseInputs = {
  cyclesPerDay,
  avgDischargePercent: DEFAULT_AVG_DISCHARGE_PERCENT,
  // ... existing fields ...
  isEmaldoBattery: hasEmaldoBattery, // ADD THIS
  emaldoGuaranteedMonthlyOverride,
}
```

3. Also update the useMemo dependency array to include relevant dependencies for Emaldo detection.
  </action>
  <verify>TypeScript compiles without errors: `npm run build 2>&1 | head -50`</verify>
  <done>baseInputs passed to calculateCombinedResults includes isEmaldoBattery flag derived from battery list</done>
</task>

<task type="auto">
  <name>Task 2: Fix decimal precision and remove duplicate sections</name>
  <files>src/components/calculations/wizard/steps/results-step.tsx, src/components/calculations/results/combo-breakdown.tsx</files>
  <action>
**In combo-breakdown.tsx:**

1. Update formatKwh helper (line 13) to use 2 decimal places:
```typescript
const formatKwh = (n: number) => n.toFixed(2) + ' kWh'
```

2. Update line 45 in summary to use consistent formatting:
```typescript
{quantity}x {battery.capacityKwh.toFixed(2)} kWh
```

**In results-step.tsx:**

1. Move the SavingsBreakdown and ROITimelineChart grid (lines 363-372) INSIDE the else branch so they only show in jamfora mode, not komboinvestering mode.

Current structure (wrong):
```tsx
{comboMode === 'komboinvestering' && combinedResults ? (
  <> ComboSummary + ComboBreakdown </>
) : (
  <> SummaryCards + PeakComparison + ComparisonView </>
)}

{/* These show in BOTH modes - wrong */}
<div className="grid lg:grid-cols-2 gap-6">
  <SavingsBreakdown ... />
  <ROITimelineChart ... />
</div>
```

Correct structure:
```tsx
{comboMode === 'komboinvestering' && combinedResults ? (
  <> ComboSummary + ComboBreakdown </>
) : (
  <>
    <SummaryCards ... />
    <PeakComparison ... />
    <ComparisonView ... />

    {/* Move these INSIDE the else branch */}
    <div className="grid lg:grid-cols-2 gap-6">
      <SavingsBreakdown ... />
      <ROITimelineChart ... />
    </div>
  </>
)}
```
  </action>
  <verify>
1. Run `npm run build` - should compile without errors
2. Visual check: In komboinvestering mode with 2 batteries, should NOT see duplicate SavingsBreakdown pie chart
3. Visual check: Capacity should show as "7.68 kWh" not "7.7 kWh" or "7.68000001 kWh"
  </verify>
  <done>
- combo-breakdown.tsx shows capacity with 2 decimal precision
- Komboinvestering mode shows only ComboSummary + ComboBreakdown (no duplicate pie chart)
- Jamfora mode still shows SavingsBreakdown + ROITimelineChart
  </done>
</task>

<task type="auto">
  <name>Task 3: Verify grid services calculation with 2 Emaldo SE4</name>
  <files>none - verification only</files>
  <action>
Run the dev server and manually test:
1. Start calculation wizard
2. Select elomrade SE4
3. Add 2x Emaldo battery
4. Switch to Komboinvestering mode
5. Go to Resultat step

Expected values for 2x Emaldo 7.68 kWh in SE4:
- Grid services per unit: 1370 SEK/month x 12 = 16,440 SEK/year
- Grid services total: 16,440 x 2 = 32,880 SEK/year
- Should appear in ComboSummary "Stodtjanster" line

If values still show 6480 SEK/year, the fix didn't work.

Check console for any calculation errors.
  </action>
  <verify>
With 2 Emaldo in SE4 (elomrade SE4, quantity 2):
- ComboSummary shows Stodtjanster: 32,880 kr/year
- ComboBreakdown per-unit shows 16,440 kr/year for stodtjanster
- No console errors
  </verify>
  <done>Grid services correctly stacking: 2 Emaldo batteries in SE4 = 32,880 SEK/year total</done>
</task>

</tasks>

<verification>
1. `npm run build` passes without errors
2. In komboinvestering mode with 2 Emaldo SE4:
   - Grid services = 32,880 kr/ar (not 6,480)
   - Capacity shows 15.36 kWh (not 15.4)
   - No duplicate SavingsBreakdown pie chart
3. In jamfora mode: SavingsBreakdown and ROITimelineChart still display correctly
</verification>

<success_criteria>
- Grid services correctly calculate zone-based rates for Emaldo in combo mode
- 2 Emaldo in SE4 = 1370 x 2 x 12 = 32,880 SEK/year stodtjanster
- Decimal precision shows 2 places for capacity (7.68, 15.36)
- Komboinvestering mode shows clean UI without duplicate breakdown sections
</success_criteria>
