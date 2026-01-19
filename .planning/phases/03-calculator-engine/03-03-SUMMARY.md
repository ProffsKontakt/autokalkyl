---
phase: 03-calculator-engine
plan: 03
subsystem: wizard-ui
tags: [recharts, zustand, wizard, consumption-simulator, form]

dependency_graph:
  requires: ["03-01", "03-02"]
  provides:
    - calculation-wizard-container
    - customer-info-step
    - consumption-simulator
    - wizard-navigation
  affects: ["03-04", "03-05"]

tech_stack:
  added:
    - recharts@3.6.0
  patterns:
    - multi-step-wizard
    - zustand-persist
    - recharts-bar-chart
    - auto-detect-elomrade

key_files:
  created:
    - src/components/calculations/wizard/calculation-wizard.tsx
    - src/components/calculations/wizard/wizard-navigation.tsx
    - src/components/calculations/wizard/steps/customer-info-step.tsx
    - src/components/calculations/wizard/steps/consumption-step.tsx
    - src/components/calculations/wizard/consumption-simulator/simulator.tsx
    - src/components/calculations/wizard/consumption-simulator/day-chart.tsx
    - src/components/calculations/wizard/consumption-simulator/month-tabs.tsx
    - src/components/calculations/wizard/consumption-simulator/presets.tsx
  modified:
    - src/app/(dashboard)/dashboard/calculations/new/page.tsx
    - package.json
    - package-lock.json

decisions:
  - id: recharts-for-charts
    choice: "Recharts for bar chart visualization"
    reason: "React-native chart library, good TypeScript support, responsive containers"
  - id: click-to-edit-bars
    choice: "Click on bar to edit value inline"
    reason: "Better UX than dragging for precise input, touch-friendly"
  - id: monthly-intensity-indicator
    choice: "Show consumption intensity as bottom bar opacity"
    reason: "Quick visual feedback on seasonal variation"

metrics:
  duration: 4 min
  completed: 2026-01-19
---

# Phase 03 Plan 03: Wizard UI Steps 1-2 Summary

Multi-step wizard with customer info collection and interactive consumption profile simulator using Recharts bar charts.

## What Was Built

### Wizard Container and Navigation
- `CalculationWizard`: Main container with 4-step routing (Customer Info, Consumption, Battery, Results)
- `WizardNavigation`: Progress indicator with completed/current/future step styling, back/next buttons
- Zustand hydration handling to prevent SSR mismatch
- Step validation gating (cannot proceed without required fields)

### Customer Info Step (Step 1)
- Customer name input with helper text
- Postal code with automatic elomrade detection
- Elomrade dropdown (SE1-SE4) with labels
- Natagare selector populated from organization data
- Annual consumption input with typical range guidance
- Summary card showing entered values

### Consumption Simulator (Step 2)
- **Presets**: 4 system presets (Electric heating, Heat pump, EV charging, Solar prosumer)
- **MonthTabs**: 12 month tabs with intensity indicator based on monthly consumption
- **DayChart**: 24-hour Recharts bar chart with:
  - Day/night coloring (blue-500 day, blue-900 night)
  - Click-to-edit inline input
  - Tooltip showing time, kWh, and period
  - Expandable grid for all 24 values
- **Copy pattern**: Copy current month to multiple target months
- **Scale button**: Adjust profile to match annual consumption target

### Data Flow
- Page fetches natagare with day/night effect tariff rates
- Page fetches battery configs with all calculation fields
- Page fetches quarterly electricity prices for selected elomrade
- Page fetches org settings for ProffsKontakt margin display

## Tasks Completed

| # | Task | Commit | Key Files |
|---|------|--------|-----------|
| 1 | Wizard container and navigation | f28fdb7 | calculation-wizard.tsx, wizard-navigation.tsx, page.tsx |
| 2 | Customer info step | a4c19a2 | customer-info-step.tsx |
| 3 | Consumption simulator | 833ee64 | simulator.tsx, day-chart.tsx, month-tabs.tsx, presets.tsx |

## Deviations from Plan

None - plan executed exactly as written.

## Key Patterns Established

### Click-to-Edit Chart Pattern
```typescript
const handleBarClick = (_: unknown, index: number) => {
  const entry = chartData[index]
  setEditingHour(entry.hour)
  setEditValue(entry.value.toFixed(2))
}
```

### Elomrade Auto-Detection Pattern
```typescript
const handlePostalCodeChange = (value: string) => {
  updateCustomerInfo({ postalCode: value })
  if (isValidSwedishPostalCode(value)) {
    const detected = lookupElomrade(value)
    if (detected && !elomrade) {
      updateCustomerInfo({ elomrade: detected })
    }
  }
}
```

### Copy Month Pattern
```typescript
const handleCopyExecute = () => {
  if (copyTargets.length > 0) {
    copyMonthPattern(selectedMonth, copyTargets)
  }
  setCopyMode(false)
  setCopyTargets([])
}
```

## Next Phase Readiness

**Prerequisites met:**
- Wizard container operational
- Customer info collection working
- Consumption profile editing complete
- Auto-save triggers on changes (from 03-02)

**Ready for 03-04:**
- Battery step already has functional placeholder
- Results step already has functional placeholder
- Calculation engine ready to compute ROI

## Verification Results

- [x] `npm ls recharts` - recharts@3.6.0 installed
- [x] `npx tsc --noEmit` - no TypeScript errors
- [x] Wizard container loads with 4-step progress
- [x] Customer info step validates required fields
- [x] Consumption simulator shows clickable bar chart
- [x] Presets apply and scale to annual total
- [x] Monthly tabs switch with intensity indicators
