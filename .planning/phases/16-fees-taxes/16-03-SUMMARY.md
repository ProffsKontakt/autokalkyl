---
phase: 16-fees-taxes
plan: 03
subsystem: calculations-ui
tags: [fees, breakdown, integration, public-view, internal-view]
dependency-graph:
  requires: [16-01, 16-02]
  provides: [fees-breakdown-integration, public-fees-display, internal-fees-display]
  affects: []
tech-stack:
  added: []
  patterns: [component-reuse, breakdown-pattern, useMemo-calculation]
key-files:
  created: []
  modified:
    - src/components/calculations/wizard/steps/results-step.tsx
    - src/actions/share.ts
    - src/components/public/public-results-view.tsx
decisions:
  - id: fees-after-elinformation
    choice: Place FeesBreakdown after Elinformation section in internal view
    rationale: Logical grouping - fees relate to electricity information
  - id: fees-after-stodtjanster
    choice: Place FeesBreakdown after StodtjansterBreakdown in public view
    rationale: Consistent breakdown ordering - last breakdown item
metrics:
  duration: 8min
  completed: 2026-02-05
---

# Phase 16 Plan 03: Integrate Fees Breakdown Summary

**One-liner:** FeesBreakdown component integrated in both internal results view and public prospect view with fees data in share payload.

## What Was Built

### Internal Results View (results-step.tsx)

Added fee calculation and display:

```typescript
// Import additions
import { FeesBreakdown } from '@/components/calculations/breakdowns/fees-breakdown'
import { calcTotalElectricityFees } from '@/lib/calculations/fees'
import type { CustomerType } from '@/lib/calculations/types'

// NatagareInfo interface extended
interface NatagareInfo {
  // ... existing fields ...
  overforingsavgiftOreKwh?: number | null  // Phase 16 addition
}

// Fees calculation useMemo
const feesData = useMemo(() => {
  const consumptionKwh = koptElKwh > 0 ? koptElKwh : annualConsumptionKwh
  const overforingsavgiftOreKwh = selectedNatagare?.overforingsavgiftOreKwh ?? null
  const { result } = calcTotalElectricityFees(consumptionKwh, customerType, overforingsavgiftOreKwh)
  return { ...result, consumptionKwh }
}, [koptElKwh, annualConsumptionKwh, customerType, selectedNatagare])
```

FeesBreakdown placed after Elinformation section, renders when consumptionKwh > 0.

### Share Action (share.ts)

Added fees to public calculation payload:

```typescript
// Imports
import { calcTotalElectricityFees } from '@/lib/calculations/fees'
import type { CustomerType } from '@/lib/calculations/types'

// Natagare query extended
natagare: {
  select: {
    // ... existing fields ...
    overforingsavgiftOreKwh: true,  // Phase 16 addition
  },
}

// buildPublicBreakdown function extended with fees parameter
// Fees calculated and added to breakdown when consumptionKwh > 0
```

### Public Results View (public-results-view.tsx)

Added FeesBreakdown display:

```typescript
import { FeesBreakdown } from '@/components/calculations/breakdowns/fees-breakdown'

// In breakdown section, after StodtjansterBreakdown
{results.breakdown.fees && (
  <FeesBreakdown
    consumptionKwh={results.breakdown.fees.consumptionKwh}
    energiskattSek={results.breakdown.fees.energiskattSek}
    energiskattRateOre={results.breakdown.fees.energiskattRateOre}
    overforingsavgiftSek={results.breakdown.fees.overforingsavgiftSek}
    overforingsavgiftRateOre={results.breakdown.fees.overforingsavgiftRateOre}
    customerType={results.breakdown.fees.customerType}
  />
)}
```

## Commits

| Hash | Type | Description |
|------|------|-------------|
| a0d03c1 | feat | Add FeesBreakdown to internal results view |
| 2a9e4a4 | feat | Add fees data to share payload |
| 2ca82cb | feat | Add FeesBreakdown to public prospect view |

## Key Links Verified

- `results-step.tsx` imports `calcTotalElectricityFees` from `src/lib/calculations/fees.ts`
- `results-step.tsx` imports `FeesBreakdown` from `src/components/calculations/breakdowns/fees-breakdown.tsx`
- `share.ts` imports `calcTotalElectricityFees` from `src/lib/calculations/fees.ts`
- `share.ts` contains `fees:` field in breakdown
- `public-results-view.tsx` imports `FeesBreakdown` component

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

**Phase 16 Complete:** All fee calculation and display components are in place:
- 16-01: Fee calculation utilities (energiskatt, overforingsavgift rates)
- 16-02: FeesBreakdown component with expandable breakdown pattern
- 16-03: Integration in internal view, share payload, and public view

**Ready for Phase 17:** Multi-battery combo investments can now proceed. Fee calculations are available for total cost computations across multiple batteries.
