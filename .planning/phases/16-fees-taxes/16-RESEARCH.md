# Phase 16: Fees & Taxes - Research

**Researched:** 2026-02-05
**Domain:** Swedish electricity cost calculation with taxes and grid fees
**Confidence:** MEDIUM

## Summary

This phase adds comprehensive Swedish electricity cost components (energiskatt, överföringsavgift, moms) to calculations with customer-type-specific handling. The implementation builds on existing calculation patterns (Phase 15 customer type data, Phase 14 natagare överföringsavgift) and follows established breakdown component patterns.

Swedish electricity costs include three mandatory components:
1. **Energiskatt** (energy tax): Fixed rate per kWh, different for privatperson (incl. moms) vs företag (excl. moms)
2. **Överföringsavgift** (grid transfer fee): Variable rate from natagare, stored in öre/kWh
3. **Moms** (VAT): 25% applied to all components for privatperson, excluded for företag

The key technical challenge is calculating accurate savings from solar self-consumption (which avoids ALL fees) versus battery arbitrage from grid-charged storage (research indicates this also avoids fees on discharge, though regulatory clarity is limited).

**Primary recommendation:** Extend existing calculation engine with fee calculation utilities, create expandable breakdown component following established pattern, integrate with customer type from Phase 15 and överföringsavgift from Phase 14.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| decimal.js | (existing) | Financial precision for fee calculations | Already in use for all monetary calculations, configured with ROUND_HALF_UP |
| Prisma | (existing) | Database access for natagare överföringsavgift | Phase 14 established Decimal(10,2) for överföringsavgiftOreKwh |
| TypeScript | (existing) | Type-safe fee rate configuration | Existing pattern for constants.ts with tax rates |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| framer-motion | (existing) | Expandable breakdown animations | Already used in ExpandableBreakdown component |
| Tailwind CSS | (existing) | Fee breakdown styling | Consistent with spotpris-breakdown.tsx pattern |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Constants for rates | Database config | Constants appropriate for legislated national rates like energiskatt; överföringsavgift already in DB per natagare |
| Separate moms line | Included in components | User decision: privatperson shows incl. moms (no separate line), företag shows excl. moms |

**Installation:**
No new packages required - all dependencies already in project.

## Architecture Patterns

### Recommended Project Structure
```
src/lib/calculations/
├── constants.ts           # Add ENERGISKATT_RATES
├── formulas.ts            # Add fee calculation functions
├── types.ts               # Add fee breakdown types
└── fees.ts                # NEW: Fee calculation utilities

src/components/calculations/breakdowns/
└── fees-breakdown.tsx     # NEW: Expandable "Avgifter & skatter"
```

### Pattern 1: Fee Rate Constants
**What:** Centralized fee rates as typed constants
**When to use:** For legislated national rates (energiskatt) that change infrequently
**Example:**
```typescript
// src/lib/calculations/constants.ts
// Swedish electricity tax (energiskatt) - 2026 rates
export const ENERGISKATT_RATES = {
  PRIVATPERSON: 45, // öre/kWh incl. moms (36 base + 25% moms)
  FORETAG: 36,      // öre/kWh excl. moms
} as const

// Moms rate (already exists as VAT_RATE = 0.25)
export const VAT_RATE = 0.25 // 25%
```

### Pattern 2: Customer-Type-Aware Fee Calculation
**What:** Calculate fees with customer type determining moms inclusion
**When to use:** All fee calculations that differ between privatperson and företag
**Example:**
```typescript
// src/lib/calculations/fees.ts
import Decimal from 'decimal.js'
import { ENERGISKATT_RATES } from './constants'
import type { CustomerType } from './types'

const d = (n: number) => new Decimal(n)

export function calcEnergiskatt(
  consumptionKwh: number,
  customerType: CustomerType
): Decimal {
  const rateOre = customerType === 'PRIVATPERSON'
    ? ENERGISKATT_RATES.PRIVATPERSON
    : ENERGISKATT_RATES.FORETAG

  return d(consumptionKwh).times(rateOre).div(100) // öre to SEK
}

export function calcOverforingsavgift(
  consumptionKwh: number,
  rateOreKwh: number
): Decimal {
  return d(consumptionKwh).times(rateOreKwh).div(100)
}

// For privatperson: fees already include moms (no separate calc)
// For företag: display fees as-is (excl. moms)
```

### Pattern 3: Expandable Fee Breakdown Component
**What:** Collapsible breakdown showing itemized fees (energiskatt, överföringsavgift)
**When to use:** Results display (both internal and public prospect view)
**Example:**
```typescript
// src/components/calculations/breakdowns/fees-breakdown.tsx
import { ExpandableBreakdown } from './expandable-breakdown'

interface FeesBreakdownProps {
  consumptionKwh: number
  energiskattSek: number
  overforingsavgiftSek: number
  energiskattRateOre: number
  overforingsavgiftRateOre: number
  customerType: 'PRIVATPERSON' | 'FORETAG'
}

export function FeesBreakdown({
  consumptionKwh,
  energiskattSek,
  overforingsavgiftSek,
  energiskattRateOre,
  overforingsavgiftRateOre,
  customerType,
}: FeesBreakdownProps) {
  const totalFees = energiskattSek + overforingsavgiftSek
  const momsLabel = customerType === 'PRIVATPERSON' ? ' (inkl. moms)' : ' (exkl. moms)'

  return (
    <ExpandableBreakdown
      title="Avgifter & skatter"
      subtitle={`${formatSek(totalFees)}${momsLabel}`}
      color="purple"
      icon={<span>💰</span>}
    >
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Energiskatt ({energiskattRateOre} öre/kWh)</span>
          <span>{formatSek(energiskattSek)}</span>
        </div>
        <div className="flex justify-between">
          <span>Överföringsavgift ({overforingsavgiftRateOre} öre/kWh)</span>
          <span>{formatSek(overforingsavgiftSek)}</span>
        </div>
      </div>
    </ExpandableBreakdown>
  )
}
```

### Pattern 4: Solar Self-Consumption Savings Attribution
**What:** Calculate and display savings from avoiding fees via solar self-consumption
**When to use:** When hasSolar is true and self-consumption data exists
**Example:**
```typescript
// Savings calculation
export function calcSolarSelfConsumptionSavings(
  selfConsumptionKwh: number,
  electricityPriceOreKwh: number,
  energiskattRateOre: number,
  overforingsavgiftRateOre: number,
  customerType: CustomerType
): Decimal {
  // Self-consumed solar avoids: spotpris + energiskatt + överföringsavgift
  // For privatperson: all rates include moms
  // For företag: all rates exclude moms
  const totalAvoidedRateOre = d(electricityPriceOreKwh)
    .plus(energiskattRateOre)
    .plus(overforingsavgiftRateOre)

  return d(selfConsumptionKwh).times(totalAvoidedRateOre).div(100)
}
```

### Anti-Patterns to Avoid
- **Hardcoding rates in components:** Centralize in constants.ts for easy updates when legislation changes
- **Mixing moms-inclusive and moms-exclusive values:** Always track customer type and apply consistently
- **Premature precision loss:** Use Decimal.js throughout calculation chain, only convert to number for display
- **Assuming battery arbitrage doesn't avoid fees:** Research suggests grid-charged battery discharge avoids fees (similar to solar), though regulatory clarity is limited - implement conservatively

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Financial rounding | Custom round() function | decimal.js with ROUND_HALF_UP | Already configured project-wide, handles edge cases (17.955 → 17.96 not 17.95) |
| öre ↔ SEK conversion | Manual division by 100 | Decimal.div(100) in utility | Consistent precision, centralized logic |
| Customer type checks | Inline conditionals everywhere | Type-safe utility functions | Single source of truth, easier to update if rules change |
| Expandable UI | Custom accordion | ExpandableBreakdown component | Already exists with framer-motion animations, consistent styling |
| Number formatting | toFixed() + string concat | formatSek() utility (existing) | Swedish locale, consistent thousand separators |

**Key insight:** The project has established patterns for all needed primitives (Decimal calculations, expandable breakdowns, formatting). Phase 16 is composition, not invention.

## Common Pitfalls

### Pitfall 1: Moms Calculation Asymmetry
**What goes wrong:** Applying moms to företag calculations or forgetting it's already included for privatperson
**Why it happens:** Swedish system has moms "baked in" to privatperson rates but separate for företag
**How to avoid:**
- Store energiskatt as two constants (PRIVATPERSON: 45 öre incl. moms, FORETAG: 36 öre excl. moms)
- Display label "(inkl. moms)" for privatperson, "(exkl. moms)" for företag
- Never multiply by (1 + VAT_RATE) for energiskatt - it's already in the rate
**Warning signs:** Annual totals don't match user's electricity bill, företag seeing higher costs than expected

### Pitfall 2: Overföringsavgift Nullability
**What goes wrong:** Assuming all natagare have överföringsavgift configured
**Why it happens:** Phase 14 made överföringsavgiftOreKwh nullable (Decimal? with default 7.00)
**How to avoid:**
- Check for null/undefined before calculation
- Use default fallback (7.00 öre/kWh based on Ellevio 2026) or show warning
- Handle in UI: "Överföringsavgift saknas för vald nätägare"
**Warning signs:** NaN in fee calculations, missing fees in breakdown

### Pitfall 3: Battery Arbitrage Savings Misattribution
**What goes wrong:** Unclear whether grid-charged battery discharge avoids fees or only solar does
**Why it happens:** Limited regulatory clarity in Swedish law for residential battery arbitrage
**How to avoid:**
- Conservative approach: Only attribute full fee avoidance to solar self-consumption (confirmed)
- Battery spotpris arbitrage: Calculate based on price spread only (existing SPOT-01 formula)
- Document assumption in code comments and breakdown UI
- Flag as "needs validation" for future regulatory updates
**Warning signs:** User disputes savings calculations, auditor questions fee treatment

### Pitfall 4: Rounding Precision Loss
**What goes wrong:** Rounding per-component then summing gives different total than sum-then-round
**Why it happens:** JavaScript floating point arithmetic, premature conversion to number
**How to avoid:**
- Keep all intermediate calculations as Decimal
- Only round at final display (formatSek() or toLocaleString())
- For annual totals: round to whole numbers (no decimals per user decision)
- For rates: display in öre/kWh with decimals for precision
**Warning signs:** Totals off by 1-2 SEK, inconsistent sums in breakdown vs summary

### Pitfall 5: Customer Type Data Unavailability
**What goes wrong:** Assuming customerType field always exists in older calculations
**Why it happens:** Phase 15 made customerType optional for backward compatibility
**How to avoid:**
- Default to 'PRIVATPERSON' if customerType is null/undefined (matching Phase 15 pattern)
- Display warning in admin view if old calculation lacks customer type
- Migration not required - defaults handle legacy data
**Warning signs:** Fee calculations showing privatperson rates for old företag calculations

## Code Examples

Verified patterns from existing codebase:

### Fee Calculation Utility
```typescript
// src/lib/calculations/fees.ts
import Decimal from 'decimal.js'
import { ENERGISKATT_RATES, VAT_RATE } from './constants'
import type { CustomerType } from './types'

const d = (n: number) => new Decimal(n)

/**
 * Calculate energiskatt (Swedish electricity tax).
 * Rate already includes moms for PRIVATPERSON, excludes for FORETAG.
 */
export function calcEnergiskatt(
  consumptionKwh: number,
  customerType: CustomerType
): Decimal {
  const rateOre = customerType === 'PRIVATPERSON'
    ? ENERGISKATT_RATES.PRIVATPERSON // 45 öre (incl. moms)
    : ENERGISKATT_RATES.FORETAG      // 36 öre (excl. moms)

  return d(consumptionKwh).times(rateOre).div(100) // öre to SEK
}

/**
 * Calculate överföringsavgift (grid transfer fee).
 * Uses rate from natagare configuration (Phase 14).
 */
export function calcOverforingsavgift(
  consumptionKwh: number,
  overforingsavgiftOreKwh: number | null
): Decimal {
  const rateOre = overforingsavgiftOreKwh ?? 7.00 // Default if null
  return d(consumptionKwh).times(rateOre).div(100)
}

/**
 * Calculate total fees for purchased electricity.
 * Includes energiskatt + överföringsavgift.
 */
export function calcTotalElectricityFees(
  consumptionKwh: number,
  customerType: CustomerType,
  overforingsavgiftOreKwh: number | null
): {
  energiskattSek: Decimal
  overforingsavgiftSek: Decimal
  totalFeesSek: Decimal
} {
  const energiskattSek = calcEnergiskatt(consumptionKwh, customerType)
  const overforingsavgiftSek = calcOverforingsavgift(consumptionKwh, overforingsavgiftOreKwh)
  const totalFeesSek = energiskattSek.plus(overforingsavgiftSek)

  return {
    energiskattSek,
    overforingsavgiftSek,
    totalFeesSek,
  }
}
```

### Integration with Calculation Engine
```typescript
// src/lib/calculations/engine.ts (extension)
import { calcTotalElectricityFees } from './fees'

export function calculateBatteryROI(inputs: CalculationInputs) {
  // ... existing calculations ...

  // Phase 16: Calculate electricity fees
  const feeResults = calcTotalElectricityFees(
    inputs.annualConsumptionKwh,
    inputs.customerType,
    inputs.natagareConfig?.overforingsavgiftOreKwh ?? null
  )

  return {
    results: {
      // ... existing results ...
      energiskattSek: feeResults.energiskattSek.toNumber(),
      overforingsavgiftSek: feeResults.overforingsavgiftSek.toNumber(),
      totalElectricityFeesSek: feeResults.totalFeesSek.toNumber(),
    },
    decimals: {
      // ... existing decimals ...
      energiskattSek: feeResults.energiskattSek,
      overforingsavgiftSek: feeResults.overforingsavgiftSek,
      totalElectricityFeesSek: feeResults.totalFeesSek,
    },
  }
}
```

### Expandable Breakdown Component
```typescript
// src/components/calculations/breakdowns/fees-breakdown.tsx
'use client'

import { ExpandableBreakdown } from './expandable-breakdown'

interface FeesBreakdownProps {
  consumptionKwh: number
  energiskattSek: number
  overforingsavgiftSek: number
  customerType: 'PRIVATPERSON' | 'FORETAG'
  // Rates for display in breakdown
  energiskattRateOre: number
  overforingsavgiftRateOre: number
}

export function FeesBreakdown({
  consumptionKwh,
  energiskattSek,
  overforingsavgiftSek,
  customerType,
  energiskattRateOre,
  overforingsavgiftRateOre,
}: FeesBreakdownProps) {
  const totalFees = energiskattSek + overforingsavgiftSek
  const momsLabel = customerType === 'PRIVATPERSON'
    ? ' (inkl. moms)'
    : ' (exkl. moms)'

  const formatSek = (n: number) =>
    Math.round(n).toLocaleString('sv-SE') + ' kr'

  return (
    <ExpandableBreakdown
      title="Avgifter & skatter"
      subtitle={formatSek(totalFees) + momsLabel}
      color="purple"
      icon={<span>💰</span>}
    >
      <div className="space-y-4 text-sm">
        <p className="text-gray-600 dark:text-gray-400">
          Vid köp från elnätet betalar du både energiskatt och överföringsavgift
          utöver elpriset. {customerType === 'PRIVATPERSON'
            ? 'Dessa avgifter inkluderar moms (25%).'
            : 'Dessa avgifter är exklusive moms.'}
        </p>

        <div className="bg-gray-50 dark:bg-slate-900/50 p-3 rounded-lg space-y-2 font-mono text-xs">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">
              Energiskatt ({energiskattRateOre} öre/kWh)
            </span>
            <span className="font-medium">{formatSek(energiskattSek)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">
              Överföringsavgift ({overforingsavgiftRateOre.toFixed(2)} öre/kWh)
            </span>
            <span className="font-medium">{formatSek(overforingsavgiftSek)}</span>
          </div>
          <div className="flex justify-between border-t border-gray-200 dark:border-slate-700 pt-2 text-purple-600 dark:text-purple-400">
            <span className="font-medium">Totalt{momsLabel}</span>
            <span className="font-bold">{formatSek(totalFees)}</span>
          </div>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400">
          Egenproducerad solel som används direkt undviker alla dessa avgifter.
        </p>
      </div>
    </ExpandableBreakdown>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Simple electricity price only | Price + energiskatt + överföringsavgift + moms | Phase 16 (v1.3) | Accurate total cost calculation matching real bills |
| Single moms rate for all | Customer-type-specific moms handling | Phase 15 (v1.3) | Correct företag calculations (excl. moms) |
| Hardcoded 7 öre överföringsavgift | Natagare-specific överföringsavgift | Phase 14 (v1.2) | Regional accuracy (varies by grid operator) |
| Energiskatt 54.875 öre | Energiskatt 45 öre (privatperson incl. moms) | Jan 1, 2026 | Government reduction effective 2026 |

**Deprecated/outdated:**
- 2025 energiskatt rate (54.875 öre incl. moms for privatperson): Reduced to 45 öre as of Jan 1, 2026
- Micro-production tax credit (60 öre/kWh): Completely removed from Jan 2026

## Open Questions

Things that couldn't be fully resolved:

1. **Battery arbitrage fee treatment**
   - What we know: Solar self-consumption definitively avoids all fees (spotpris, energiskatt, överföringsavgift, moms)
   - What's unclear: Whether grid-charged battery discharge avoids energiskatt and överföringsavgift, or only saves on spot price spread
   - Sources found: Search results suggest batteries charged from grid can avoid fees when discharging ("you avoid paying both the energy tax and VAT on the portion of power you don't take from the grid"), but this may refer to solar-charged batteries
   - Regulatory ambiguity: EU is addressing "double taxation" problem for battery storage (paying grid fees on charge AND discharge), but Swedish implementation timeline unclear
   - Recommendation:
     - Conservative implementation: Battery spotpris arbitrage savings calculated using ONLY price spread (existing SPOT-01 formula)
     - Solar self-consumption savings calculated with FULL fee avoidance (spotpris + energiskatt + överföringsavgift)
     - Document assumption in code and flag for regulatory review
     - Consider adding configuration flag for future toggle if regulation clarifies

2. **Rounding approach for fee components**
   - What we know: User decision allows Claude's discretion on rounding (per-component vs final total)
   - What's unclear: Which approach better matches Swedish electricity bill conventions
   - Recommendation:
     - Use "sum decimals then round once" approach for annual totals (more accurate)
     - Display rates with precision (öre/kWh with 2 decimals for överföringsavgift)
     - Annual totals as whole numbers (no decimals per user decision)
     - Matches existing pattern in formulas.ts (Decimal.ROUND_HALF_UP at final conversion)

3. **Missing överföringsavgift handling**
   - What we know: Phase 14 made överföringsavgiftOreKwh nullable with 7.00 default
   - What's unclear: Best UX for edge case where natagare lacks överföringsavgift
   - Recommendation:
     - Use 7.00 öre/kWh fallback (Ellevio 2026 baseline from Phase 14)
     - Show subtle warning in admin view: "Använder standardavgift 7 öre/kWh - natagare saknar konfigurerad överföringsavgift"
     - No error blocking calculation (fail gracefully with reasonable default)

## Sources

### Primary (HIGH confidence)
- Swedish Government Budget Proposal 2026: Energiskatt rate confirmed at 36.0 öre/kWh excl. moms, 45.0 öre/kWh incl. moms effective Jan 1, 2026
  - [Reduced energy tax on electricity from the turn of the year – Partille Energi](https://partilleenergi.se/en/2025/11/27/sankt-energiskatt-pa-el-fran-arsskiftet/)
  - [Energiskatten 2026: Här är de viktigaste ändringarna](https://energyplaza.vattenfall.se/blogg/energiskatten-2026-h%C3%A4r-%C3%A4r-de-viktigaste-%C3%A4ndringarna)
  - [Sweden Gazettes Regulation Setting Rate of Energy Tax on Electricity for 2026](https://news.bloombergtax.com/daily-tax-report-international/sweden-gazettes-regulation-setting-rate-of-energy-tax-on-electricity-for-2026)

- Swedish VAT: Standard rate 25% confirmed for electricity
  - [Sweden: Comprehensive VAT Country Guide (2026)](https://www.vatupdate.com/2026/02/02/sweden-comprehensive-vat-country-guide-2026/)
  - [Sweden VAT guide 2026 - vatcalc.com](https://www.vatcalc.com/sweden/sweden-vat-country-guide/)

- Prisma Decimal documentation: Field types and decimal.js integration
  - [Fields & types | Prisma Documentation](https://www.prisma.io/docs/orm/prisma-client/special-fields-and-types)
  - [Exact Calculations in TypeScript + Node.js](https://medium.com/@tbreijm/exact-calculations-in-typescript-node-js-b7333803609e)

### Secondary (MEDIUM confidence)
- Battery storage fee treatment: Indicates discharge avoids fees, but lacks regulatory citation
  - [Understanding Your Electricity Bill - Watt matters](https://www.wattmatters.se/en/understanding-your-electricity-bill/)
  - [New rules for solar energy in Sweden - Watt matters](https://www.wattmatters.se/en/new-rules-for-solar-energy-in-sweden/)

- Överföringsavgift variability: Confirms natagare-specific rates, average 2.9% increase 2026
  - [New electricity network prices from January 1, 2026 – Partille Energi](https://partilleenergi.se/en/2025/12/04/nya-elnatspriser-fran-1-januari-2026/)
  - [2026 Regional network tariffs - Vattenfall](https://www.vattenfalleldistribution.se/globalassets/2.-foretag/abonnemang-och-avgifter/avtal-och-elnatsavgift/regionnatskund/regional-network-customer/prices-rn-2026.pdf)

- Financial calculation best practices: Rounding modes, precision handling
  - [Handle Money in JavaScript: Financial Precision](https://dev.to/benjamin_renoux/financial-precision-in-javascript-handle-money-without-losing-a-cent-1chc)
  - [Calculation Handling in a Financial Application Using JavaScript](https://medium.com/@muhebollah.diu/calculation-handling-in-a-financial-application-using-javascript-frontend-and-backend-examples-966628a87d1d)

### Tertiary (LOW confidence)
- EU battery storage double taxation: Indicates evolving regulatory landscape, no Swedish-specific details
  - [Electricity Tax Amendment 2025/2026: New rules for BESS](https://www.taylorwessing.com/en/insights-and-events/insights/2026/01/stromsteuer-novelle-2025-2026)
  - [Europe's Battery Storage Edge - Capstone DC](https://capstonedc.com/insights/europes-battery-storage-edge/)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All dependencies already in project, verified via schema.prisma and package.json
- Architecture: HIGH - Existing patterns (constants.ts, formulas.ts, ExpandableBreakdown) provide clear template
- Fee rates: HIGH - Official Swedish government sources confirm 2026 energiskatt and moms rates
- Battery arbitrage fee treatment: LOW - Limited regulatory clarity, needs conservative implementation
- Pitfalls: MEDIUM - Identified from codebase patterns and financial calculation best practices

**Research date:** 2026-02-05
**Valid until:** ~30 days for fee rates (stable legislative values), ~7 days for battery arbitrage regulation (fast-moving EU/Swedish policy area)

**Key findings for planner:**
1. No new libraries needed - compose existing Decimal.js, Prisma, ExpandableBreakdown patterns
2. User decisions constrain scope effectively: fees in breakdown only, no UI input changes, customer-type-specific display
3. Critical uncertainty: battery arbitrage fee treatment requires conservative implementation with documentation
4. Implementation follows established Phase 14 (överföringsavgift) and Phase 15 (customer type) integration patterns
