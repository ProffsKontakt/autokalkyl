# Phase 11: Peak Calculation Engine - Research

**Researched:** 2026-02-05
**Domain:** Swedish peak tariff calculations (effekttariff), battery peak shaving algorithms, natagare-specific billing methods
**Confidence:** HIGH

## Summary

Phase 11 implements accurate peak tariff calculations using natagare-specific methods (e.g., Ellevio's 3-peak averaging, Vattenfall's 5-peak averaging). The system already has: the Natagare model with peakCalculationMethod (JSON), nightDiscountPercent, peakNightStartHour/EndHour fields from Phase 9; the existing peak shaving calculation in constraints.ts; and UI components (peak-shaving-slider, effekt-breakdown).

The main work involves: (1) parsing natagare peakCalculationMethod JSON configs, (2) implementing calculation engines for each method type (SIMPLE_MAX, N_PEAK_AVERAGE, SEASONAL_PEAK), (3) adding user inputs for target peak and monthly ceiling, (4) applying night discount from natagare config, (5) constraining peak shaving by battery capacity (cycles/day, max kW), and (6) displaying before/after peak comparison in results.

Swedish grid operators are transitioning to effekttariffer (peak demand tariffs) mandated by January 2027. Different natagare use different calculation methods: Ellevio uses 3-peak averaging with 50% night discount, Vattenfall uses 5-peak averaging during "hoglasttid" (peak load hours).

**Primary recommendation:** Extend the existing calculation engine with a `calculatePeakBilling` function that accepts the natagare's peakCalculationMethod JSON config and hourly consumption data (from Phase 10), returning the calculated billing peak and savings from battery intervention.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| decimal.js | 10.6.0 | Financial precision | Already used in calculation engine |
| zod | 4.3.5 | Validation for peak method config | Already used for form validation |
| Prisma Natagare model | - | Peak config storage | Fields already exist from Phase 9 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| recharts | 3.6.0 | Before/after peak visualization | Already used for ROI charts |
| zustand | 5.0.10 | Wizard state for peak inputs | Already powers wizard store |
| react-hook-form | 7.71.1 | Peak input forms | Already used for natagare edit |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom peak algorithm | External energy modeling library | Custom is simpler; no external dependency |
| JSON peak method config | Prisma enum | JSON more flexible for natagare-specific parameters |
| Real hourly data simulation | Simplified monthly peaks | Real simulation more accurate but complex; start with monthly |

**Installation:**
```bash
# No new dependencies needed - all libraries already installed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/calculations/
│   ├── peak-billing/
│   │   ├── types.ts              # PeakMethodConfig, PeakBillingResult types
│   │   ├── methods.ts            # Calculation functions per method type
│   │   ├── night-discount.ts     # Night period detection and discount application
│   │   └── index.ts              # Main calculatePeakBilling export
│   ├── constraints.ts            # Extend with peak/battery constraints
│   └── engine.ts                 # Integrate peak billing into main engine
├── components/calculations/
│   ├── wizard/steps/
│   │   └── results-step.tsx      # Add peak comparison section
│   ├── controls/
│   │   ├── peak-target-input.tsx # Target average peak (kW) input
│   │   └── peak-ceiling-input.tsx # Monthly ceiling (kW) input
│   └── results/
│       └── peak-comparison.tsx   # Before/after visualization
└── components/natagare/
    └── natagare-edit-form.tsx    # Already has peak method config UI
```

### Pattern 1: Peak Method Configuration Type
**What:** Strongly typed peak calculation method parsed from natagare JSON config
**When to use:** Anywhere peak billing is calculated
**Example:**
```typescript
// Source: Existing natagare-edit-form.tsx PeakMethodConfig
import { z } from 'zod'

/**
 * Peak calculation method configuration stored as JSON in Natagare.peakCalculationMethod
 */
export const PeakMethodConfigSchema = z.discriminatedUnion('method', [
  z.object({
    method: z.literal('SIMPLE_MAX'),
    description: z.string().optional(),
  }),
  z.object({
    method: z.literal('N_PEAK_AVERAGE'),
    numPeaks: z.number().int().min(1).max(10).default(3),
    excludeWeekends: z.boolean().default(false),
    description: z.string().optional(),
  }),
  z.object({
    method: z.literal('SEASONAL_PEAK'),
    avgPeriod: z.enum(['month', 'quarter', 'winter']),
    description: z.string().optional(),
  }),
])

export type PeakMethodConfig = z.infer<typeof PeakMethodConfigSchema>

/**
 * Parse natagare peak method from JSON string.
 * Returns SIMPLE_MAX if parsing fails.
 */
export function parsePeakMethod(jsonStr: string | null): PeakMethodConfig {
  if (!jsonStr) return { method: 'SIMPLE_MAX' }
  try {
    const parsed = JSON.parse(jsonStr)
    const result = PeakMethodConfigSchema.safeParse(parsed)
    return result.success ? result.data : { method: 'SIMPLE_MAX' }
  } catch {
    return { method: 'SIMPLE_MAX' }
  }
}
```

### Pattern 2: Peak Billing Calculation Interface
**What:** Interface for peak billing calculation inputs and outputs
**When to use:** Main calculation function signature
**Example:**
```typescript
// Source: Based on existing CalculationInputs/Results pattern
import Decimal from 'decimal.js'

export interface PeakBillingInput {
  // Consumption data (from Phase 10)
  monthlyConsumptionKwh: number[]  // 12 values
  hourlyPeaksPerMonth: number[][]  // 12 x 24 matrix (optional for advanced)

  // Natagare config
  peakMethod: PeakMethodConfig
  dayRateSekKw: number
  nightRateSekKw: number
  nightDiscountPercent: number
  peakNightStartHour: number  // e.g., 22
  peakNightEndHour: number    // e.g., 6

  // User targets (PEAK-05, PEAK-06)
  targetAveragePeakKw: number | null  // User's goal for avg peak
  targetMonthlyCeilingKw: number | null  // Max peak not to exceed

  // Battery constraints (PEAK-10)
  batteryMaxDischargeKw: number
  batteryCapacityKwh: number
  maxCyclesPerDay: number
}

export interface PeakBillingResult {
  // Before battery
  beforePeakKw: number           // Original calculated billing peak
  beforeMonthlyCostSek: number   // Monthly cost without battery
  beforeAnnualCostSek: number    // Annual cost without battery

  // After battery (with constraints applied)
  afterPeakKw: number            // Peak after battery intervention
  afterMonthlyCostSek: number    // Monthly cost with battery
  afterAnnualCostSek: number     // Annual cost with battery

  // Savings
  peakReductionKw: number        // How much peak was reduced
  monthlySavingsSek: number      // Monthly savings
  annualSavingsSek: number       // Annual savings (PEAK-09)

  // Constraints
  wasConstrained: boolean        // Was battery capacity the limiter?
  constraintReason: string | null  // Why constrained (PEAK-10)

  // Details for display
  methodUsed: string             // e.g., "Ellevio 3-topp medel"
  nightDiscountApplied: boolean  // Was night discount relevant?
}
```

### Pattern 3: N-Peak Average Calculation (Ellevio Method)
**What:** Calculate billing peak as average of N highest peaks from different days
**When to use:** When natagare uses N_PEAK_AVERAGE method (e.g., Ellevio)
**Example:**
```typescript
// Source: https://www.ellevio.se/abonnemang/elnatspriser/ny-prismodell-baserad-pa-effekt/
import Decimal from 'decimal.js'

/**
 * Ellevio-style N-peak averaging:
 * 1. Find hourly peaks for each day in month
 * 2. Apply night discount (50% between 22:00-06:00)
 * 3. Take top N peaks from different days
 * 4. Calculate average
 *
 * @param dailyPeaks - Array of daily peak values (kW), one per day
 * @param numPeaks - Number of peaks to average (default 3 for Ellevio)
 * @param nightDiscountPercent - Discount for night peaks (default 50%)
 */
export function calculateNPeakAverage(
  dailyPeaks: { peakKw: number; isNightPeak: boolean }[],
  numPeaks: number = 3,
  nightDiscountPercent: number = 50
): number {
  // Apply night discount to each peak
  const adjustedPeaks = dailyPeaks.map(({ peakKw, isNightPeak }) => {
    if (isNightPeak) {
      // Night peak counted at reduced rate
      // e.g., 10 kW at night with 50% discount = 5 kW for billing
      return peakKw * (1 - nightDiscountPercent / 100)
    }
    return peakKw
  })

  // Sort descending and take top N
  const topPeaks = adjustedPeaks
    .sort((a, b) => b - a)
    .slice(0, numPeaks)

  // Calculate average
  const sum = topPeaks.reduce((acc, p) => acc + p, 0)
  return sum / numPeaks
}

/**
 * Determine if an hour is within night period (handles overnight wrap).
 *
 * @param hour - Hour (0-23)
 * @param nightStart - Night period start (e.g., 22)
 * @param nightEnd - Night period end (e.g., 6)
 */
export function isNightHour(
  hour: number,
  nightStart: number = 22,
  nightEnd: number = 6
): boolean {
  if (nightStart > nightEnd) {
    // Overnight wrap: e.g., 22:00 to 06:00
    return hour >= nightStart || hour < nightEnd
  }
  // Same-day range (unusual)
  return hour >= nightStart && hour < nightEnd
}
```

### Pattern 4: Battery Peak Shaving with Constraints
**What:** Calculate how much peak can be shaved given battery constraints
**When to use:** When applying battery intervention to reduce peaks
**Example:**
```typescript
// Source: Existing constraints.ts pattern + PEAK-10 requirements

export interface PeakShavingConstraints {
  batteryMaxDischargeKw: number    // Max instantaneous discharge
  batteryCapacityKwh: number       // Total usable capacity
  maxCyclesPerDay: number          // Max charge/discharge cycles
  peakDurationHours: number        // How long peak typically lasts
}

/**
 * Calculate actual peak reduction respecting battery constraints.
 *
 * Constraints (PEAK-10):
 * 1. Cannot discharge more than maxDischargeKw at any moment
 * 2. Cannot provide more energy than capacity allows for peak duration
 * 3. Must have charge available (based on cycles/day)
 */
export function calculateConstrainedPeakShaving(
  targetReductionKw: number,
  peakKw: number,
  constraints: PeakShavingConstraints
): {
  actualReductionKw: number
  newPeakKw: number
  isConstrained: boolean
  constraintReason: string | null
} {
  let actualReduction = targetReductionKw
  let constraintReason: string | null = null

  // Constraint 1: Cannot exceed battery max discharge
  if (actualReduction > constraints.batteryMaxDischargeKw) {
    actualReduction = constraints.batteryMaxDischargeKw
    constraintReason = `Batteriet kan max leverera ${constraints.batteryMaxDischargeKw} kW`
  }

  // Constraint 2: Cannot reduce below zero
  if (actualReduction > peakKw) {
    actualReduction = peakKw
    constraintReason = `Kan inte reducera mer an nuvarande topp (${peakKw} kW)`
  }

  // Constraint 3: Energy availability for peak duration
  // If peak lasts 1 hour, need actualReduction kWh available
  const energyNeeded = actualReduction * constraints.peakDurationHours
  const dailyEnergyBudget = constraints.batteryCapacityKwh * constraints.maxCyclesPerDay

  if (energyNeeded > dailyEnergyBudget) {
    // Scale back to what's available
    actualReduction = dailyEnergyBudget / constraints.peakDurationHours
    constraintReason = `Begransad av batterikapacitet (${constraints.batteryCapacityKwh} kWh x ${constraints.maxCyclesPerDay} cykler)`
  }

  return {
    actualReductionKw: actualReduction,
    newPeakKw: peakKw - actualReduction,
    isConstrained: actualReduction < targetReductionKw,
    constraintReason,
  }
}
```

### Pattern 5: Before/After Peak Comparison Component
**What:** Visual comparison of peak billing with and without battery
**When to use:** Results page peak section (PEAK-09)
**Example:**
```typescript
// Source: Existing effekt-breakdown.tsx pattern + PEAK-09
import { ArrowDownIcon, BoltIcon } from '@heroicons/react/24/outline'

interface PeakComparisonProps {
  beforePeakKw: number
  afterPeakKw: number
  beforeMonthlyCost: number
  afterMonthlyCost: number
  annualSavings: number
  methodName: string
  isConstrained: boolean
  constraintMessage: string | null
}

export function PeakComparison({
  beforePeakKw,
  afterPeakKw,
  beforeMonthlyCost,
  afterMonthlyCost,
  annualSavings,
  methodName,
  isConstrained,
  constraintMessage,
}: PeakComparisonProps) {
  const reductionKw = beforePeakKw - afterPeakKw
  const reductionPercent = (reductionKw / beforePeakKw) * 100

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <BoltIcon className="w-5 h-5 text-yellow-500" />
        Effektavgift - Fore/Efter
      </h3>

      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Beraknad med {methodName}
      </p>

      <div className="grid grid-cols-2 gap-6">
        {/* Before */}
        <div className="space-y-2">
          <span className="text-sm text-gray-500">Utan batteri</span>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {beforePeakKw.toFixed(1)} kW
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {beforeMonthlyCost.toLocaleString('sv-SE')} kr/man
          </div>
        </div>

        {/* After */}
        <div className="space-y-2">
          <span className="text-sm text-gray-500">Med batteri</span>
          <div className="text-2xl font-bold text-green-600">
            {afterPeakKw.toFixed(1)} kW
          </div>
          <div className="text-sm text-green-600">
            {afterMonthlyCost.toLocaleString('sv-SE')} kr/man
          </div>
        </div>
      </div>

      {/* Savings summary */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <span className="text-gray-600 dark:text-gray-400">Reduktion</span>
          <span className="flex items-center gap-1 text-green-600 font-medium">
            <ArrowDownIcon className="w-4 h-4" />
            {reductionKw.toFixed(1)} kW ({reductionPercent.toFixed(0)}%)
          </span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-gray-600 dark:text-gray-400">Arlig besparing</span>
          <span className="text-lg font-bold text-green-600">
            {annualSavings.toLocaleString('sv-SE')} kr
          </span>
        </div>
      </div>

      {/* Constraint warning */}
      {isConstrained && constraintMessage && (
        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-sm text-amber-700 dark:text-amber-400">
          {constraintMessage}
        </div>
      )}
    </div>
  )
}
```

### Anti-Patterns to Avoid
- **Don't use real-time hourly simulation initially:** Start with simplified monthly peak estimation based on consumption profile and heating type. Real hourly simulation can be Phase 12 enhancement.
- **Don't hard-code natagare-specific logic:** Use the JSON config pattern so new methods can be added without code changes.
- **Don't ignore night discount:** Swedish natagare like Ellevio give 50% discount for night peaks (22:00-06:00). This significantly affects calculations.
- **Don't forget battery constraints:** A 10 kW battery cannot shave 15 kW peaks. Always apply constraints (PEAK-10).

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Decimal precision | JavaScript numbers | decimal.js (already in project) | Financial precision critical |
| Night hour detection | Simple hour comparison | Handle overnight wrap (22-06) | Edge case for midnight |
| Peak method parsing | Loose JSON parse | Zod schema validation | Type safety, fallback handling |
| Peak constraint logic | Inline calculations | Extend existing constraints.ts | Consistent with codebase pattern |

**Key insight:** The existing calculation engine already has the pattern (calculateBatteryROI) and constraint handling (calculateActualPeakShaving). Extend these rather than building parallel systems.

## Common Pitfalls

### Pitfall 1: Overnight Night Period Wrap
**What goes wrong:** Night period 22:00-06:00 incorrectly excludes hour 0-5
**Why it happens:** Simple `hour >= start && hour < end` fails when start > end
**How to avoid:** Use `hour >= start || hour < end` for overnight periods
**Warning signs:** Night discount not applied to 00:00-06:00 peaks

### Pitfall 2: N-Peak From Same Day
**What goes wrong:** Using 3 peaks from the same day instead of 3 different days
**Why it happens:** Not tracking which day each peak came from
**How to avoid:** Ellevio specifies "fran tre olika dygn" (from three different days)
**Warning signs:** Calculated billing peak much higher than expected

### Pitfall 3: Forgetting to Apply Night Discount to Billing
**What goes wrong:** Showing reduced night peak but billing at full rate
**Why it happens:** Night discount affects the billing peak value, not the tariff rate
**How to avoid:** Apply discount to peak kW value before averaging, not to SEK/kW rate
**Warning signs:** Night usage not reducing monthly bill as expected

### Pitfall 4: Unconstrained Peak Shaving
**What goes wrong:** Promising 20 kW reduction with 10 kW battery
**Why it happens:** Not checking battery max discharge power
**How to avoid:** Always run through constraint checks (PEAK-10)
**Warning signs:** Calculated savings much higher than physically possible

### Pitfall 5: Ignoring Energy Availability
**What goes wrong:** Battery depleted before peak period ends
**Why it happens:** Only checking power (kW), not energy (kWh) over time
**How to avoid:** Calculate energy needed for peak duration vs available capacity
**Warning signs:** Battery "should" handle peak but simulation shows depletion

## Code Examples

Verified patterns from official sources:

### Swedish Peak Tariff Methods Summary
```typescript
// Source: Web research on Ellevio, Vattenfall, E.ON effektavgift 2026

/**
 * Swedish grid operator peak billing methods as of 2026:
 *
 * 1. ELLEVIO (N_PEAK_AVERAGE):
 *    - Average of 3 highest peaks from 3 different days
 *    - Night (22:00-06:00): only 50% of peak counts
 *    - Rate: 81.25 kr/kW/month (2026)
 *
 * 2. VATTENFALL (N_PEAK_AVERAGE):
 *    - Average of 5 highest peaks during "hoglasttid"
 *    - Seasonal variation (winter months charged higher)
 *    - Implemented autumn 2026
 *
 * 3. E.ON (to be announced):
 *    - Launching September 2026
 *    - Winter focus (not charged during summer)
 *    - Details TBD February 2026
 *
 * 4. SIMPLE_MAX (default/fallback):
 *    - Highest single peak in month
 *    - Traditional model pre-effekttariff
 */
```

### Integrate Peak Billing into Calculation Engine
```typescript
// Source: Pattern matching existing engine.ts calculateBatteryROI

import { calculatePeakBilling } from './peak-billing'
import { parsePeakMethod } from './peak-billing/types'

// Add to CalculationInputs interface:
interface ExtendedCalculationInputs extends CalculationInputs {
  // Peak billing (Phase 11)
  natagare: {
    peakCalculationMethod: string | null
    nightDiscountPercent: number
    peakNightStartHour: number
    peakNightEndHour: number
    dayRateSekKw: number
  }
  targetAveragePeakKw: number | null
  targetMonthlyCeilingKw: number | null
  monthlyConsumptionKwh: number[]  // From Phase 10
}

// In calculateBatteryROI, add:
const peakBillingResults = calculatePeakBilling({
  monthlyConsumptionKwh: inputs.monthlyConsumptionKwh,
  peakMethod: parsePeakMethod(inputs.natagare.peakCalculationMethod),
  dayRateSekKw: inputs.natagare.dayRateSekKw,
  nightDiscountPercent: inputs.natagare.nightDiscountPercent,
  peakNightStartHour: inputs.natagare.peakNightStartHour,
  peakNightEndHour: inputs.natagare.peakNightEndHour,
  targetAveragePeakKw: inputs.targetAveragePeakKw,
  targetMonthlyCeilingKw: inputs.targetMonthlyCeilingKw,
  batteryMaxDischargeKw: inputs.battery.maxDischargeKw,
  batteryCapacityKwh: inputs.battery.capacityKwh,
  maxCyclesPerDay: inputs.cyclesPerDay,
})

// Add to results:
const results = {
  ...existingResults,
  // Peak billing (Phase 11)
  peakBillingBefore: peakBillingResults.beforePeakKw,
  peakBillingAfter: peakBillingResults.afterPeakKw,
  peakAnnualSavings: peakBillingResults.annualSavingsSek,
  peakWasConstrained: peakBillingResults.wasConstrained,
  peakConstraintReason: peakBillingResults.constraintReason,
  peakMethodUsed: peakBillingResults.methodUsed,
}
```

### Estimate Monthly Peak from Consumption
```typescript
// Source: Based on Swedish residential consumption patterns

/**
 * Estimate peak kW from monthly kWh consumption.
 *
 * Heuristic: Swedish residential peak is typically 2-3x average hourly load.
 * Average hourly = monthlyKwh / (30 * 24)
 * Peak factor depends on heating type (direktverkande has highest peaks)
 */
export function estimateMonthlyPeakKw(
  monthlyKwh: number,
  heatingType: HeatingType
): number {
  const avgHourlyKw = monthlyKwh / (30 * 24)

  // Peak factor by heating type (winter months)
  const peakFactors: Record<HeatingType, number> = {
    DIREKTVERKANDE: 3.5,   // Electric heating: sharp peaks when heating kicks in
    LUFT_LUFT_VP: 2.8,     // Air-air HP: moderate peaks
    LUFT_VATTEN_VP: 2.5,   // Air-water HP: smoother with buffer tank
    BERGVARME: 2.2,        // Ground source: most stable
    FJARRVARME: 2.0,       // District heating: household peaks only
  }

  return avgHourlyKw * (peakFactors[heatingType] || 2.5)
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Fixed main fuse pricing | Peak demand tariffs (effekttariff) | 2025-2027 rollout | Users charged for actual peak usage |
| Single max peak billing | N-peak averaging (Ellevio: 3, Vattenfall: 5) | 2025-2026 | More forgiving, rewards consistency |
| No night discount | 50% night discount (22:00-06:00) | 2025 | Incentivizes off-peak usage |
| Manual peak estimation | Heating-type based estimation | This phase | More accurate peak predictions |

**Deprecated/outdated:**
- **Huvudsakring-based pricing:** Being phased out by all Swedish grid operators by 2027
- **Simple annual consumption focus:** Peak demand now as important as total consumption

## Open Questions

Things that couldn't be fully resolved:

1. **Hourly Peak Data Source**
   - What we know: Phase 10 provides monthly consumption distribution
   - What's unclear: Should we generate synthetic hourly data or use simplified monthly peak estimation?
   - Recommendation: Start with monthly peak estimation using heating type heuristics. Hourly simulation can be Phase 12 enhancement.

2. **E.ON Method Details**
   - What we know: E.ON introduces effekttariff September 2026
   - What's unclear: Exact calculation method not yet published
   - Recommendation: Support SIMPLE_MAX as default, update when E.ON publishes details in February 2026

3. **User-Provided Peak vs Estimated**
   - What we know: PEAK-05/06 allow user to input target peak
   - What's unclear: Should we also auto-estimate from consumption profile?
   - Recommendation: Auto-estimate as default, allow user override. Show "Uppskattat fran forbrukningsprofil" with edit option.

4. **Seasonal Rate Variations**
   - What we know: Some natagare charge differently winter vs summer
   - What's unclear: Should peakCalculationMethod JSON support seasonal rate configs?
   - Recommendation: Add optional `winterMonths` and `winterMultiplier` to JSON schema. Default to year-round.

## Sources

### Primary (HIGH confidence)
- Existing codebase: `src/lib/calculations/engine.ts`, `constraints.ts`, `formulas.ts`
- Existing codebase: `src/components/natagare/natagare-edit-form.tsx` - PeakMethodConfig interface
- Existing codebase: `prisma/schema.prisma` - Natagare model with peak fields
- [Ellevio effektavgift](https://www.ellevio.se/abonnemang/elnatspriser/ny-prismodell-baserad-pa-effekt/) - 3-peak averaging, 50% night discount, 81.25 kr/kW

### Secondary (MEDIUM confidence)
- [Vattenfall effektguiden](https://www.vattenfalleldistribution.se/abonnemang-och-avgifter/avtal-och-avgifter/effektguiden/) - 5-peak averaging during hoglasttid
- [E.ON effektavgift announcement](https://www.eon.se/nyheter/ett-effektivare-elnaet) - September 2026 launch, winter focus
- [Energimarknadsinspektionen](https://ei.se/om-oss/statistik-och-oppna-data/natavgifter---elnat) - Regulatory requirements by 2027

### Tertiary (LOW confidence)
- [1komma5.se elnatsavgift](https://1komma5.se/energi/ny-elnatsavgift-kommande-prischock) - General effekttariff overview
- [Byggahus.se forum](https://www.byggahus.se/forum/threads/den-1-september-2026-infoers-e-on-effektavgift.562184/) - Community discussion on E.ON timing

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in use
- Architecture: HIGH - Extends existing patterns (engine.ts, constraints.ts)
- Peak methods (Ellevio): HIGH - Official documentation fetched
- Peak methods (Vattenfall): MEDIUM - Limited public documentation
- Peak methods (E.ON): LOW - Not yet published
- Battery constraints: HIGH - Based on existing constraints.ts pattern

**Research date:** 2026-02-05
**Valid until:** 30 days (effekttariff landscape changing rapidly, E.ON details expected Feb 2026)
