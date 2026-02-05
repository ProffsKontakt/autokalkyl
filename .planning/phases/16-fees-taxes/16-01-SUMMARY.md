---
phase: 16-fees-taxes
plan: 01
subsystem: calculations
tags: [fees, energiskatt, overforingsavgift, decimal.js]
dependency-graph:
  requires: [14-01]
  provides: [fee-calculation-utilities, energiskatt-rates, overforingsavgift-utilities]
  affects: [16-02, 16-03]
tech-stack:
  added: []
  patterns: [decimal-precision, customer-type-based-rates, fallback-defaults]
key-files:
  created:
    - src/lib/calculations/fees.ts
  modified:
    - src/lib/calculations/constants.ts
    - src/lib/calculations/types.ts
decisions:
  - id: energiskatt-includes-moms
    choice: Store PRIVATPERSON rate as 45 ore (already includes moms)
    rationale: Simplifies calculations - no separate moms addition needed for energiskatt
metrics:
  duration: 5min
  completed: 2026-02-05
---

# Phase 16 Plan 01: Fee Calculation Utilities Summary

**One-liner:** Swedish electricity fee utilities with customer-type-specific energiskatt rates (45/36 ore) and overforingsavgift with natagare fallback.

## What Was Built

### Constants (src/lib/calculations/constants.ts)

Added Swedish electricity fee rate constants:

```typescript
export const ENERGISKATT_RATES = {
  PRIVATPERSON: 45, // ore/kWh incl. moms
  FORETAG: 36,      // ore/kWh excl. moms
} as const

export const DEFAULT_OVERFORINGSAVGIFT_ORE_KWH = 7.0
```

### Types (src/lib/calculations/types.ts)

Added Phase 16 types section with fee calculation result interfaces:

```typescript
export interface FeeCalculationResult {
  energiskattSek: number
  energiskattRateOre: number
  overforingsavgiftSek: number
  overforingsavgiftRateOre: number
  totalFeesSek: number
  customerType: CustomerType
}

export interface FeeCalculationResultDecimal {
  energiskattSek: Decimal
  overforingsavgiftSek: Decimal
  totalFeesSek: Decimal
}
```

### Fee Utilities (src/lib/calculations/fees.ts)

Created new file with fee calculation functions:

| Function | Purpose | Returns |
|----------|---------|---------|
| `calcEnergiskatt` | Calculate Swedish electricity tax | Decimal (SEK) |
| `getEnergiskattRate` | Get rate for customer type | number (ore/kWh) |
| `calcOverforingsavgift` | Calculate grid transfer fee | Decimal (SEK) |
| `getOverforingsavgiftRate` | Get rate with fallback | number (ore/kWh) |
| `calcTotalElectricityFees` | Combined fee calculation | result + decimals |
| `calcSolarSelfConsumptionSavings` | Calculate avoided fees from solar | Decimal (SEK) |

### Verification Results

```
Privatperson 10k kWh energiskatt: 4500 SEK (10000 * 45 / 100)
Foretag 10k kWh energiskatt: 3600 SEK (10000 * 36 / 100)
Overforingsavgift default rate: 700 SEK (10000 * 7 / 100)
Total fees (privatperson, default): 5200 SEK (4500 + 700)
```

## Commits

| Hash | Type | Description |
|------|------|-------------|
| 86655f0 | feat | Add Swedish electricity fee rate constants |
| e08d916 | feat | Add FeeCalculationResult types |
| 6ffe149 | feat | Add Swedish electricity fee calculation utilities |

## Key Links Verified

- `fees.ts` imports `ENERGISKATT_RATES` from `constants.ts`
- `fees.ts` imports `CustomerType`, `FeeCalculationResult` from `types.ts`
- `fees.ts` uses `new Decimal()` pattern from decimal.js

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

**Ready for 16-02:** Fee utilities are exported and tested. Engine integration can import:
- `calcEnergiskatt`, `calcOverforingsavgift` for individual fee calculations
- `calcTotalElectricityFees` for combined results with both number and Decimal precision
- `calcSolarSelfConsumptionSavings` for solar ROI impact

**Integration pattern for 16-02:**
```typescript
import { calcTotalElectricityFees } from './fees'
const { result, decimals } = calcTotalElectricityFees(koptElKwh, customerType, overforingsavgiftOreKwh)
```
