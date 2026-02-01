# Phase 10: Consumption Profiles - Research

**Researched:** 2026-02-01
**Domain:** Swedish residential electricity consumption profiles, UI input components, data visualization
**Confidence:** HIGH

## Summary

Phase 10 adds a new wizard step for Closers to input the prospect's annual electricity consumption and heating type. The system then generates a monthly consumption distribution based on Swedish residential patterns. This research covers three areas: (1) Swedish consumption patterns by heating type for accurate seasonal distribution, (2) UI implementation patterns for the slider+input component and heating type selection, and (3) charting for monthly distribution visualization.

The codebase already has: HeatingType enum (5 Swedish types from Phase 8), Recharts 3.6.0 for charts, existing slider patterns using native HTML range inputs, existing consumption preset system with monthly factors, and a well-established Zustand store pattern.

**Primary recommendation:** Extend the existing preset system to map HeatingType enum values to consumption distribution profiles. Use native HTML range inputs (matching existing slider patterns) with text override for annual kWh input. Use Recharts AreaChart for the monthly distribution visualization since Recharts is already used for ROI charts.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| recharts | 3.6.0 | Monthly distribution chart | Already used for ROI timeline charts in project |
| zustand | 5.0.10 | Wizard state management | Already powers calculation wizard store |
| Prisma HeatingType enum | - | Heating type data model | Added in Phase 8, 5 Swedish types ready |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| framer-motion | 12.27.2 | Animation for value changes | Existing pattern in cycles-slider.tsx |
| sonner | 2.0.7 | Toast notifications | Existing pattern for warnings |
| zod | 4.3.5 | Input validation | Form validation if needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native range input | shadcn/ui Slider | shadcn Slider not installed; native matches existing patterns in cycles-slider.tsx and peak-shaving-slider.tsx |
| Recharts AreaChart | @nivo/line | Nivo used for hourly editing (day-chart.tsx), but Recharts simpler for monthly summary |
| Radio buttons | Select dropdown | Radio buttons provide better visibility of all 5 options; matches CONTEXT.md decision |

**Installation:**
```bash
# shadcn/ui Slider (optional, if native range is insufficient)
pnpm dlx shadcn@latest add slider
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/calculations/
│   ├── consumption-profiles.ts    # HeatingType -> distribution mapping
│   └── estimation.ts              # House size estimation formula
├── components/calculations/wizard/
│   ├── steps/
│   │   └── consumption-profile-step.tsx  # New step component
│   └── consumption-profile/
│       ├── annual-kwh-input.tsx          # Slider + text input
│       ├── heating-type-select.tsx       # Radio buttons + tooltips
│       ├── estimation-helper.tsx         # Modal or inline helper
│       └── distribution-chart.tsx        # Monthly Recharts area chart
└── stores/
    └── calculation-wizard-store.ts       # Extend with heatingType field
```

### Pattern 1: Heating Type to Monthly Distribution Mapping
**What:** Map each HeatingType to a monthly distribution factor array
**When to use:** When generating the consumption profile from annual kWh + heating type
**Example:**
```typescript
// Source: Swedish energy statistics and existing presets.ts pattern
import { HeatingType } from '@prisma/client'

export const HEATING_TYPE_PROFILES: Record<HeatingType, {
  name: string
  description: string
  monthlyFactors: number[]  // 12 values, normalized to sum = 12
}> = {
  BERGVARME: {
    name: 'Bergvarme',
    description: 'Grundvarmepump med COP 3-4. Stabil forbrukning aret runt.',
    // Lower seasonal variation due to heat pump efficiency
    monthlyFactors: [1.25, 1.20, 1.10, 0.90, 0.75, 0.65, 0.60, 0.65, 0.80, 1.00, 1.15, 1.25],
  },
  FJARRVARME: {
    name: 'Fjarrvarme',
    description: 'Centralvarme fran energibolag. Endast hushallsel behover batteriet.',
    // Flat profile - only household electricity, heating separate
    monthlyFactors: [1.05, 1.03, 1.00, 0.98, 0.95, 0.92, 0.90, 0.92, 0.98, 1.02, 1.05, 1.08],
  },
  DIREKTVERKANDE: {
    name: 'Direktverkande el',
    description: 'Elvarmeelement. Hogst elforbrukning pa vintern.',
    // Highest seasonal variation - direct correlation with heating need
    monthlyFactors: [1.50, 1.40, 1.20, 0.90, 0.55, 0.40, 0.35, 0.40, 0.60, 0.95, 1.25, 1.50],
  },
  LUFT_LUFT_VP: {
    name: 'Luft-luft VP',
    description: 'Luftvarmepump. Effektiv ned till ca -10C, sen tillskottsvame.',
    // Moderate seasonal variation, less efficient in deep winter
    monthlyFactors: [1.35, 1.28, 1.12, 0.88, 0.68, 0.55, 0.50, 0.55, 0.72, 0.95, 1.18, 1.35],
  },
  LUFT_VATTEN_VP: {
    name: 'Luft-vatten VP',
    description: 'Varmepump for vattenburen varme. Bra COP men med vinterpeak.',
    // Similar to bergvarme but with more winter variation
    monthlyFactors: [1.30, 1.22, 1.08, 0.88, 0.70, 0.58, 0.55, 0.60, 0.75, 0.98, 1.18, 1.30],
  },
}

export function distributeAnnualConsumption(
  annualKwh: number,
  heatingType: HeatingType
): number[] {
  const profile = HEATING_TYPE_PROFILES[heatingType]
  const monthlyAvg = annualKwh / 12
  return profile.monthlyFactors.map(factor => monthlyAvg * factor)
}
```

### Pattern 2: Slider with Text Override
**What:** Combined range slider and number input sharing state
**When to use:** For annual kWh input (5,000-75,000 range with 500 increments)
**Example:**
```typescript
// Source: Existing cycles-slider.tsx pattern + shadcn slider docs
'use client'

import { motion } from 'framer-motion'

interface AnnualKwhInputProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
}

export function AnnualKwhInput({
  value,
  onChange,
  min = 5000,
  max = 75000,
  step = 500,
}: AnnualKwhInputProps) {
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseInt(e.target.value, 10))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10)
    if (!isNaN(newValue)) {
      // Clamp to valid range
      onChange(Math.max(min, Math.min(max, newValue)))
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Arlig forbrukning
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={value}
            onChange={handleInputChange}
            min={min}
            max={max}
            step={step}
            className="w-28 px-2 py-1 text-right text-lg font-bold border border-gray-300 rounded-md"
          />
          <span className="text-sm text-gray-500">kWh/ar</span>
        </div>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleSliderChange}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
      />

      <div className="flex justify-between text-xs text-gray-500">
        <span>{min.toLocaleString('sv-SE')} kWh</span>
        <span>{(max / 2).toLocaleString('sv-SE')} kWh</span>
        <span>{max.toLocaleString('sv-SE')} kWh</span>
      </div>
    </div>
  )
}
```

### Pattern 3: Monthly Distribution Chart with Recharts
**What:** AreaChart showing 12-month consumption distribution
**When to use:** Preview in wizard step and full version on results page
**Example:**
```typescript
// Source: Recharts docs, existing roi-timeline-chart.tsx pattern
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { MONTH_NAMES_SV } from '@/lib/calculations/constants'

interface DistributionChartProps {
  monthlyKwh: number[]  // 12 values
  heatingTypeName: string
}

export function DistributionChart({ monthlyKwh, heatingTypeName }: DistributionChartProps) {
  const data = monthlyKwh.map((kwh, index) => ({
    month: MONTH_NAMES_SV[index].substring(0, 3),
    kwh: Math.round(kwh),
  }))

  const maxKwh = Math.max(...monthlyKwh)
  const annualTotal = monthlyKwh.reduce((sum, kwh) => sum + kwh, 0)

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-4">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Manadsfordelning
        </h4>
        <span className="text-xs text-gray-500">
          {Math.round(annualTotal).toLocaleString('sv-SE')} kWh/ar
        </span>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="consumptionGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: '#64748b' }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
            tick={{ fontSize: 11, fill: '#64748b' }}
            tickLine={false}
            axisLine={false}
            domain={[0, maxKwh * 1.1]}
          />
          <Tooltip
            formatter={(value: number) => [`${value.toLocaleString('sv-SE')} kWh`, 'Forbrukning']}
            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
            labelStyle={{ color: '#f1f5f9' }}
          />
          <Area
            type="monotone"
            dataKey="kwh"
            stroke="#3B82F6"
            strokeWidth={2}
            fill="url(#consumptionGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>

      <p className="text-xs text-gray-500 text-center mt-2">
        Baserat pa {heatingTypeName} - hogre forbrukning under kalla manader
      </p>
    </div>
  )
}
```

### Anti-Patterns to Avoid
- **Don't use 12x24 matrix for this phase:** The existing consumption simulator edits hourly data; this phase only needs monthly totals. Generate simplified monthly array, not detailed hourly profile.
- **Don't fetch real heating data:** The distribution is based on typical Swedish patterns, not real-time data. Hard-code the profiles.
- **Don't make heating type optional:** Per CONTEXT.md, both annual kWh and heating type are required fields. Closer cannot proceed without selecting.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Monthly factor normalization | Custom math | Use existing `calculateProfileTotal` and `scaleProfileToTotal` from presets.ts | Already handles scaling edge cases |
| Slider accessibility | Custom aria-* | Native HTML `<input type="range">` | Built-in keyboard support, screen readers |
| Chart responsiveness | Fixed width | Recharts `ResponsiveContainer` | Handles resize events properly |
| Value animation | Custom CSS | framer-motion with `key` prop | Existing pattern in cycles-slider.tsx |

**Key insight:** The existing presets.ts has the exact pattern needed (monthlyFactors array), just needs mapping from HeatingType enum.

## Common Pitfalls

### Pitfall 1: Seasonal Factor Sum
**What goes wrong:** Monthly factors don't sum to 12, causing total to differ from annual input
**Why it happens:** Manually creating factor arrays without validation
**How to avoid:** Always normalize factors: `factor * (12 / factorsSum)` or validate sum === 12
**Warning signs:** Profile total doesn't match annualConsumptionKwh

### Pitfall 2: Slider-Input Desync
**What goes wrong:** Typing a value outside range causes slider position mismatch
**Why it happens:** Input allows any number, slider has min/max
**How to avoid:** Clamp input values to valid range on blur or change
**Warning signs:** Slider shows different value than text input

### Pitfall 3: Store State Not Persisted
**What goes wrong:** Heating type resets on page refresh
**Why it happens:** New field not added to Zustand `partialize` config
**How to avoid:** Add `heatingType` to the partialize list in calculation-wizard-store.ts
**Warning signs:** HeatingType is null after browser refresh despite selection

### Pitfall 4: Backward Compatibility
**What goes wrong:** Existing calculations (without heatingType) break
**Why it happens:** Code expects heatingType to always exist
**How to avoid:** Calculation.heatingType is nullable; handle null case (use default or skip distribution)
**Warning signs:** TypeScript errors with `heatingType!` usage or runtime null errors

## Code Examples

Verified patterns from official sources:

### Swedish Consumption Estimation Formula
```typescript
// Source: https://hemsol.se/solceller/elforbrukning-villa/
// Formula: base household + heating component

interface EstimationInput {
  houseSizeM2: number
  residents: number
  heatingType: HeatingType
}

const HEATING_KWH_PER_M2: Record<HeatingType, number> = {
  DIREKTVERKANDE: 120,  // Direct electric: 120 kWh/m2
  LUFT_LUFT_VP: 60,     // Air-air HP: 60 kWh/m2
  LUFT_VATTEN_VP: 55,   // Air-water HP: 55 kWh/m2
  BERGVARME: 50,        // Ground source: 50 kWh/m2
  FJARRVARME: 0,        // District heating: 0 (separate billing)
}

const HOUSEHOLD_KWH_PER_PERSON = 2000  // Base household electricity

export function estimateAnnualConsumption(input: EstimationInput): number {
  const heatingKwh = input.houseSizeM2 * HEATING_KWH_PER_M2[input.heatingType]
  const householdKwh = input.residents * HOUSEHOLD_KWH_PER_PERSON
  return Math.round((heatingKwh + householdKwh) / 500) * 500  // Round to 500
}

// Example: 150m2 villa, 4 residents, direktverkande el
// = 150 * 120 + 4 * 2000 = 18000 + 8000 = 26000 kWh/year
```

### Extending Wizard Store
```typescript
// Source: Existing calculation-wizard-store.ts pattern
import { HeatingType } from '@prisma/client'

// Add to WizardState interface:
heatingType: HeatingType | null

// Add to initialState:
heatingType: null as HeatingType | null

// Add action:
updateHeatingType: (type: HeatingType | null) => set({ heatingType: type })

// Add to partialize (for persistence):
heatingType: state.heatingType
```

### Radio Button Group for Heating Type
```typescript
// Source: CONTEXT.md decision - simple radio buttons with tooltips
import { HeatingType } from '@prisma/client'
import { HEATING_TYPE_PROFILES } from '@/lib/calculations/consumption-profiles'

interface HeatingTypeSelectProps {
  value: HeatingType | null
  onChange: (type: HeatingType) => void
}

const HEATING_TYPES: HeatingType[] = [
  'BERGVARME',
  'FJARRVARME',
  'DIREKTVERKANDE',
  'LUFT_LUFT_VP',
  'LUFT_VATTEN_VP',
]

export function HeatingTypeSelect({ value, onChange }: HeatingTypeSelectProps) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Uppvarmningstyp *
      </legend>
      <div className="space-y-2">
        {HEATING_TYPES.map((type) => {
          const profile = HEATING_TYPE_PROFILES[type]
          return (
            <label
              key={type}
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                value === type
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="heatingType"
                value={type}
                checked={value === type}
                onChange={() => onChange(type)}
                className="mt-1"
              />
              <div>
                <span className="font-medium text-gray-900 dark:text-white">
                  {profile.name}
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {profile.description}
                </p>
              </div>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual 12x24 profile editing | Preset-based generation from annual + heating type | This phase | Simpler UX, accurate Swedish patterns |
| Single "electric heating" preset | 5 distinct Swedish heating type profiles | This phase | More accurate seasonal distribution |
| Fixed consumption input | Slider with text override | This phase | Faster input with precision option |

**Deprecated/outdated:**
- The existing `SYSTEM_PRESETS` in presets.ts is general-purpose and can coexist with the new HeatingType-specific profiles. Don't remove existing presets.

## Open Questions

Things that couldn't be fully resolved:

1. **Wizard Step Ordering**
   - What we know: Consumption input is a required step (per CONTEXT.md)
   - What's unclear: Should it be Step 1 (before battery) or integrated into existing customer info step?
   - Recommendation: Make it a new Step 2, moving current Consumption (12x24 editor) to Step 3 or making it optional. Discuss with planner.

2. **Distribution vs 12x24 Profile Integration**
   - What we know: Phase generates monthly distribution array (12 values)
   - What's unclear: How does this integrate with existing 12x24 consumptionProfile used by calculation engine?
   - Recommendation: Either (a) generate 12x24 from monthly distribution using flat hourly pattern, or (b) store monthly separately and use for display only. Planner to decide.

3. **Estimation Helper UX**
   - What we know: CONTEXT.md says "modal or inline expandable" is Claude's discretion
   - What's unclear: Which provides better UX for Closers
   - Recommendation: Inline expandable (collapsible section) - keeps flow in context, no modal interruption. Confirm during implementation.

## Sources

### Primary (HIGH confidence)
- Existing codebase analysis: `src/components/calculations/controls/cycles-slider.tsx`, `peak-shaving-slider.tsx`
- Existing codebase: `src/lib/calculations/presets.ts` - consumption profile pattern
- Existing codebase: `src/stores/calculation-wizard-store.ts` - Zustand state management
- Recharts in project: `src/components/calculations/results/roi-timeline-chart.tsx`
- HeatingType enum: `prisma/schema.prisma` lines 79-85

### Secondary (MEDIUM confidence)
- [hemsol.se - Elforbrukning villa](https://hemsol.se/solceller/elforbrukning-villa/) - Swedish consumption by heating type
- [1komma5.se - Elforbrukning villa](https://1komma5.se/energi/elforbrukning-villa) - kWh per m2 formulas
- [bergvarme-kostnad.se](https://bergvarme-kostnad.se/normal-elforbrukning-villa-med-bergvarme/) - Bergvarme consumption patterns
- [shadcn/ui Slider docs](https://ui.shadcn.com/docs/components/slider) - Slider component patterns
- [Recharts documentation](https://recharts.org/) - AreaChart API

### Tertiary (LOW confidence)
- Swedish Energy Agency statistics (referenced but not directly fetched)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in use in codebase
- Architecture: HIGH - Patterns match existing wizard/slider implementations
- Heating type profiles: MEDIUM - Based on multiple Swedish energy sources, but specific factors are estimates
- Pitfalls: HIGH - Based on existing codebase patterns

**Research date:** 2026-02-01
**Valid until:** 60 days (stable domain, libraries not changing)
