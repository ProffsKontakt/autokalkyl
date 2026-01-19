---
phase: 03-calculator-engine
plan: 04
subsystem: results-display
tags: [recharts, comparison, roi-calculation, results-dashboard]

dependency-graph:
  requires: [03-01, 03-02]
  provides: [battery-selection-ui, results-display, comparison-view]
  affects: [03-05]

tech-stack:
  added: []
  patterns: [recharts-visualization, zustand-integration, natagare-lookup]

key-files:
  created:
    - src/components/calculations/wizard/steps/battery-step.tsx
    - src/components/calculations/wizard/steps/results-step.tsx
    - src/components/calculations/results/summary-cards.tsx
    - src/components/calculations/results/savings-breakdown.tsx
    - src/components/calculations/results/roi-timeline-chart.tsx
    - src/components/calculations/results/comparison-view.tsx
  modified: []

decisions:
  - id: primary-battery-focus
    choice: "First battery shows full details, others in comparison table"
    reason: "Avoids overwhelming UI while enabling meaningful comparison"
  - id: natagare-lookup-pattern
    choice: "Pass natagareList prop and lookup by natagareId from store"
    reason: "Keeps effect tariff rates synchronized with user selection"
  - id: recharts-tooltip-typing
    choice: "Use untyped formatter callbacks with Number() conversion"
    reason: "Recharts Formatter types don't match actual usage, this is cleaner"

metrics:
  duration: 5 min
  completed: 2026-01-19
---

# Phase 3 Plan 4: Battery Selection and Results Display Summary

Battery selection UI with pricing inputs and complete results dashboard with summary cards, savings breakdown pie chart, ROI timeline line chart, and side-by-side comparison view.

## What Was Built

### Battery Selection Step (`src/components/calculations/wizard/steps/battery-step.tsx`)
- Select up to 4 batteries from organization's available list
- Pricing inputs: total price ex VAT and installation cost per battery
- Price summary showing:
  - Total ex VAT
  - Total inc VAT (25%)
  - After Gron Teknik deduction (48.5%)
- Margin display for ProffsKontakt affiliates (installer fixed cut)
- Duplicate and max limit prevention

### Results Step (`src/components/calculations/wizard/steps/results-step.tsx`)
- Reads wizard state (customerName, elomrade, natagareId, batteries)
- Looks up natagare from natagareList prop to get effect tariff rates
- Calculates ROI for each selected battery using `calculateBatteryROI` engine
- Error states for missing price data or natagare
- Integrates all visualization components

### Summary Cards (`src/components/calculations/results/summary-cards.tsx`)
- Four key metrics in responsive grid (2x2 on mobile, 4x1 on desktop)
- Payback period (years + months format)
- Annual savings (SEK)
- 10-year ROI (percentage with net profit)
- 15-year ROI (percentage with net profit)
- Green/red coloring based on positive/negative values

### Savings Breakdown (`src/components/calculations/results/savings-breakdown.tsx`)
- Donut pie chart using Recharts
- Three savings categories:
  - Spotprisoptimering (spot price arbitrage)
  - Effekttariffbesparing (effect tariff reduction)
  - Stodtjanster (grid services income)
- Legend with amounts and percentages
- Total annual savings display

### ROI Timeline Chart (`src/components/calculations/results/roi-timeline-chart.tsx`)
- 15-year line chart using Recharts
- Three lines:
  - Cumulative savings (green)
  - Investment cost (red dashed, flat)
  - Net position (blue, main focus)
- Break-even year vertical marker
- Swedish number formatting (tkr/mkr)
- Legend explaining each line

### Comparison View (`src/components/calculations/results/comparison-view.tsx`)
- Side-by-side table for 2-4 batteries
- Eight metrics compared:
  - Payback period, annual savings, ROI 10yr/15yr
  - Cost after Gron Teknik, spotpris, effect tariff, grid services
- Best values highlighted in green with asterisk
- Lower-is-better logic for payback/cost, higher-is-better for others

## Verification Results

| Check | Result |
|-------|--------|
| npx tsc --noEmit | No errors |
| Battery step compiles | Yes |
| Results components compile | Yes |
| Comparison view compiles | Yes |
| Results step integrates engine | Yes |

## Deviations from Plan

None - plan executed exactly as written.

## Key Patterns Established

### Natagare Lookup Pattern
```typescript
const selectedNatagare = natagareList.find(n => n.id === natagareId)
const natagareInfo = selectedNatagare ? {
  dayRateSekKw: selectedNatagare.dayRateSekKw,
  nightRateSekKw: selectedNatagare.nightRateSekKw,
} : null
```

### Recharts Tooltip Pattern
```typescript
<Tooltip
  formatter={(value) => formatSek(Number(value))}
/>
```

### Multi-Battery Calculation Pattern
```typescript
const calculatedResults = useMemo(() => {
  return selectedBatteries.map(selection => {
    const batteryInfo = batteryList.find(b => b.id === selection.configId)
    const { results } = calculateBatteryROI({ /* inputs */ })
    return { batteryName: `${brand} ${name}`, results }
  }).filter(Boolean)
}, [dependencies])
```

## Next Phase Readiness

**Ready for 03-05 (PDF Export):**
- All results components render complete calculation data
- Results step produces structured data suitable for PDF
- Summary cards, savings breakdown, ROI chart all componentized
- Comparison view ready for tabular PDF rendering

**Integration points:**
- `ResultsStep` receives props for quarterlyPrices, orgSettings, batteryList, natagareList
- Components accept `CalculationResults` type from engine
- Charts use responsive containers that can be sized for PDF
