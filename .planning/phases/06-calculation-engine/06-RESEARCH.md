# Phase 6: Calculation Engine - Research

**Researched:** 2026-01-29
**Domain:** Real-time calculation controls, slider components, toast notifications, formula corrections
**Confidence:** HIGH

## Summary

This research covers Phase 6: Calculation Engine - fixing calculation formulas and adding interactive controls for spotpris cycles/day, stödtjänster rates, and effektavgifter peak shaving levels. The phase focuses on immediate real-time updates without debouncing, visual feedback for changed values, and warnings when high cycles affect battery warranty.

**Key findings:**
- Native HTML5 range input with React controlled state provides best accessibility and immediate updates
- Sonner (via shadcn/ui) is the modern toast library for Next.js 15 + React 19 with auto-dismiss support
- Framer Motion (already in project) handles highlight animations via animate prop and motion values
- Zustand store (already used) manages slider state with immediate calculation updates
- Spotpris formula correction: spread × efficiency × cycles × capacity × days (not quarterly averages)
- Stödtjänster uses zone-based hardcoded rates for Emaldo, manual entry for others
- Peak shaving constraint: min(peak × %, battery capacity) prevents over-promising

**Primary recommendation:** Build slider controls as native HTML5 range inputs styled with Tailwind, trigger immediate calculations via Zustand state updates (no debounce), use Sonner for warranty warnings (auto-dismiss after 3s), and animate changed values with Framer Motion's motion.div + animate prop.

## Standard Stack

The established libraries/tools for this phase:

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Native HTML5 `<input type="range">` | Built-in | Slider controls | Superior accessibility, mobile support, keyboard navigation, no library needed |
| Framer Motion | 12.x (in project) | Value change animations | Already in project, performant motion values, React 19 compatible |
| Sonner | Latest | Toast notifications | Modern, lightweight (5KB), shadcn/ui recommended replacement for toast |
| Zustand | 5.x (in project) | Calculation state | Already managing wizard state, supports transient updates |
| decimal.js | 10.x (in project) | Precise calculations | Already used for financial math, Prisma compatible |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Radix UI Slider | 1.3+ | Advanced slider needs | If native range input limitations found (multi-thumb, marks) |
| use-debounce | 10.x (in project) | Input debouncing | Only for text inputs, NOT for sliders (per requirements) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native range input | Radix UI Slider | More customization but adds dependency, accessibility already solved |
| Native range input | rc-slider | Popular but native input simpler for single-thumb sliders |
| Sonner | react-hot-toast | Similar bundle size but Sonner has better DX, no hooks needed |
| Sonner | react-toastify | More established (2.9k dependents) but heavier, older API |
| Framer Motion | CSS transitions | Simpler but less control, harder to trigger on value change |

**Installation:**
```bash
# Toast notifications (if not already installed)
pnpm dlx shadcn@latest add sonner

# Note: framer-motion, zustand, decimal.js already in project
# Note: Native HTML5 range input requires no installation
```

## Architecture Patterns

### Recommended Component Structure
```
src/
├── components/
│   └── calculations/
│       ├── controls/
│       │   ├── cycles-slider.tsx          # Spotpris cycles/day control
│       │   ├── peak-shaving-slider.tsx    # Effektavgifter % control
│       │   ├── stodtjanster-input.tsx     # Post-campaign income input
│       │   └── value-display.tsx          # Animated value display component
│       ├── results/
│       │   └── savings-breakdown.tsx      # Already exists, update with new calcs
│       └── warnings/
│           └── warranty-toast.tsx         # High cycles warning toast
├── lib/
│   └── calculations/
│       ├── formulas.ts                    # Update spotpris formula (SPOT-01)
│       ├── constants.ts                   # Add Emaldo zone rates (GRID-01)
│       ├── constraints.ts                 # NEW: Peak shaving limits (PEAK-02)
│       └── warnings.ts                    # NEW: Warranty threshold logic
└── stores/
    └── calculation-wizard-store.ts        # Add slider state fields
```

### Pattern 1: Native Range Slider with Immediate Updates

**What:** HTML5 range input with onChange triggering instant recalculation
**When to use:** Cycles/day slider (SPOT-02), peak shaving slider (PEAK-01)

```typescript
// components/calculations/controls/cycles-slider.tsx
'use client'

import { useCalculationWizardStore } from '@/stores/calculation-wizard-store'
import { motion } from 'framer-motion'

interface CyclesSliderProps {
  min?: number
  max?: number
  step?: number
  defaultValue?: number
}

export function CyclesSlider({
  min = 0.5,
  max = 3,
  step = 0.5,
  defaultValue = 1.2,
}: CyclesSliderProps) {
  const cyclesPerDay = useCalculationWizardStore((state) => state.cyclesPerDay)
  const updateCyclesPerDay = useCalculationWizardStore((state) => state.updateCyclesPerDay)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    updateCyclesPerDay(value) // Immediate update, no debounce
  }

  // Warning threshold from SPOT-03
  const showWarning = cyclesPerDay > 2

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Cykler per dag
      </label>

      {/* Native HTML5 range input for accessibility */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={cyclesPerDay}
        onChange={handleChange}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-blue-600"
        aria-label="Antal laddningscykler per dag"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={cyclesPerDay}
        aria-valuetext={`${cyclesPerDay} cykler per dag`}
      />

      {/* Value display with animation */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">0.5</span>
        <motion.span
          key={cyclesPerDay}
          initial={{ scale: 1.2, color: '#3B82F6' }}
          animate={{ scale: 1, color: '#1F2937' }}
          transition={{ duration: 0.3 }}
          className="font-semibold"
        >
          {cyclesPerDay} cykler/dag
        </motion.span>
        <span className="text-gray-500">3.0</span>
      </div>

      {showWarning && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          ⚠️ Höga cykler kan påverka batteriets garantitid
        </p>
      )}
    </div>
  )
}
```

### Pattern 2: Peak Shaving with Capacity Constraint

**What:** Dual control (% and kW) with min() constraint validation
**When to use:** PEAK-01, PEAK-02, PEAK-03

```typescript
// components/calculations/controls/peak-shaving-slider.tsx
'use client'

import { useCalculationWizardStore } from '@/stores/calculation-wizard-store'
import { motion } from 'framer-motion'
import { calculateActualPeakShaving } from '@/lib/calculations/constraints'

interface PeakShavingSliderProps {
  currentPeakKw: number  // From natagare data
  batteryCapacityKw: number  // From selected battery
}

export function PeakShavingSlider({
  currentPeakKw,
  batteryCapacityKw,
}: PeakShavingSliderProps) {
  const peakShavingPercent = useCalculationWizardStore((state) => state.peakShavingPercent)
  const updatePeakShaving = useCalculationWizardStore((state) => state.updatePeakShaving)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10)
    updatePeakShaving(value) // Store as percentage
  }

  // PEAK-02: Actual shaving respects battery capacity
  const targetKw = currentPeakKw * (peakShavingPercent / 100)
  const actualKw = Math.min(targetKw, batteryCapacityKw)
  const isConstrained = actualKw < targetKw

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Effektavgift reduktion
      </label>

      <input
        type="range"
        min={0}
        max={100}
        step={10}
        value={peakShavingPercent}
        onChange={handleChange}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-green-600"
        aria-label="Procentuell reduktion av toppeffekt"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={peakShavingPercent}
        aria-valuetext={`${peakShavingPercent} procent reduktion`}
      />

      <div className="space-y-1 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Nuvarande topp:</span>
          <span className="font-medium">{currentPeakKw.toFixed(1)} kW</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Målreduktion:</span>
          <motion.span
            key={peakShavingPercent}
            initial={{ scale: 1.2, color: '#10B981' }}
            animate={{ scale: 1, color: '#1F2937' }}
            transition={{ duration: 0.3 }}
            className="font-semibold"
          >
            {peakShavingPercent}% ({targetKw.toFixed(1)} kW)
          </motion.span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Faktisk reduktion:</span>
          <span className={`font-semibold ${isConstrained ? 'text-amber-600' : 'text-green-600'}`}>
            {actualKw.toFixed(1)} kW
          </span>
        </div>
      </div>

      {isConstrained && (
        <div className="p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded text-xs text-amber-700 dark:text-amber-400">
          ℹ️ Batteriet kan max leverera {batteryCapacityKw} kW. Öka batterikapaciteten för högre reduktion.
        </div>
      )}
    </div>
  )
}
```

```typescript
// lib/calculations/constraints.ts
// Source: CONTEXT.md - Peak shaving uses min(peak × %, battery capacity)

export function calculateActualPeakShaving(
  currentPeakKw: number,
  targetPercent: number,
  batteryCapacityKw: number
): {
  targetKw: number
  actualKw: number
  isConstrained: boolean
} {
  const targetKw = currentPeakKw * (targetPercent / 100)
  const actualKw = Math.min(targetKw, batteryCapacityKw)

  return {
    targetKw,
    actualKw,
    isConstrained: actualKw < targetKw,
  }
}
```

### Pattern 3: Sonner Toast for High Cycles Warning

**What:** Auto-dismissing toast when cycles > 2
**When to use:** SPOT-03 warranty warning

```typescript
// app/layout.tsx (add Toaster component)
import { Toaster } from '@/components/ui/sonner'

export default function RootLayout({ children }) {
  return (
    <html lang="sv">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
```

```typescript
// components/calculations/controls/cycles-slider.tsx (updated)
'use client'

import { useCalculationWizardStore } from '@/stores/calculation-wizard-store'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

export function CyclesSlider({ /* ... */ }: CyclesSliderProps) {
  const cyclesPerDay = useCalculationWizardStore((state) => state.cyclesPerDay)
  const updateCyclesPerDay = useCalculationWizardStore((state) => state.updateCyclesPerDay)
  const hasShownWarning = useRef(false)

  // SPOT-03: Show warning when cycles > 2
  useEffect(() => {
    if (cyclesPerDay > 2 && !hasShownWarning.current) {
      toast.warning('Höga cykler påverkar garantin', {
        description: 'Fler än 2 cykler per dag kan förkorta batteriets garantitid. Optimal livslängd uppnås vid 1-2 cykler/dag.',
        duration: 3000, // Auto-dismiss after 3 seconds
      })
      hasShownWarning.current = true
    } else if (cyclesPerDay <= 2) {
      hasShownWarning.current = false
    }
  }, [cyclesPerDay])

  // ... rest of component
}
```

### Pattern 4: Animated Value Changes with Framer Motion

**What:** Flash/highlight effect when calculated values update
**When to use:** Savings breakdown, ROI display

```typescript
// components/calculations/results/value-display.tsx
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

interface AnimatedValueProps {
  value: number
  formatter: (n: number) => string
  label: string
  className?: string
}

export function AnimatedValue({
  value,
  formatter,
  label,
  className = '',
}: AnimatedValueProps) {
  const [isChanging, setIsChanging] = useState(false)

  useEffect(() => {
    setIsChanging(true)
    const timer = setTimeout(() => setIsChanging(false), 500)
    return () => clearTimeout(timer)
  }, [value])

  return (
    <div className={`relative ${className}`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={value}
          initial={{ opacity: 0, y: -10 }}
          animate={{
            opacity: 1,
            y: 0,
            backgroundColor: isChanging ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
          }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.3 }}
          className="rounded px-2 py-1"
        >
          <div className="text-sm text-gray-600 dark:text-gray-400">{label}</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatter(value)}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// Usage in savings breakdown:
// <AnimatedValue
//   value={results.spotprisSavingsSek}
//   formatter={(n) => `${Math.round(n).toLocaleString('sv-SE')} kr/år`}
//   label="Spotprisoptimering"
// />
```

### Pattern 5: Stödtjänster Zone-Based Rates

**What:** Hardcoded Emaldo rates by zone, manual input for others
**When to use:** GRID-01, GRID-02, GRID-03, GRID-04

```typescript
// lib/calculations/constants.ts (additions)

// GRID-01: Emaldo guaranteed income by zone
export const EMALDO_STODTJANSTER_RATES = {
  SE1: 1110, // SEK/month
  SE2: 1110,
  SE3: 1110,
  SE4: 1370,
} as const

// GRID-02: Campaign duration
export const EMALDO_CAMPAIGN_MONTHS = 36

// Calculate total guaranteed income
export function calculateEmaldoGuaranteedIncome(
  elomrade: 'SE1' | 'SE2' | 'SE3' | 'SE4'
): number {
  const monthlyRate = EMALDO_STODTJANSTER_RATES[elomrade]
  return monthlyRate * EMALDO_CAMPAIGN_MONTHS
}

// GRID-03: Post-campaign calculation
export function calculateTotalStodtjanster(
  elomrade: 'SE1' | 'SE2' | 'SE3' | 'SE4',
  postCampaignRatePerKwYear: number,
  batteryCapacityKw: number,
  totalYears: number
): {
  guaranteed: number  // First 36 months
  postCampaign: number  // After 36 months
  total: number
} {
  const guaranteed = calculateEmaldoGuaranteedIncome(elomrade)

  // Years after campaign ends
  const postCampaignYears = Math.max(0, totalYears - 3)
  const postCampaign = postCampaignRatePerKwYear * batteryCapacityKw * postCampaignYears

  return {
    guaranteed,
    postCampaign,
    total: guaranteed + postCampaign,
  }
}
```

```typescript
// components/calculations/controls/stodtjanster-input.tsx
'use client'

import { useCalculationWizardStore } from '@/stores/calculation-wizard-store'
import { EMALDO_STODTJANSTER_RATES } from '@/lib/calculations/constants'

export function StodtjansterInput({
  elomrade,
  isEmaldoBattery
}: {
  elomrade: 'SE1' | 'SE2' | 'SE3' | 'SE4'
  isEmaldoBattery: boolean
}) {
  const postCampaignRate = useCalculationWizardStore((state) => state.postCampaignRate)
  const updatePostCampaignRate = useCalculationWizardStore((state) => state.updatePostCampaignRate)

  if (!isEmaldoBattery) {
    // Non-Emaldo: Manual entry
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium">
          Stödtjänster (SEK/år)
        </label>
        <input
          type="number"
          value={postCampaignRate}
          onChange={(e) => updatePostCampaignRate(parseFloat(e.target.value))}
          className="w-full px-3 py-2 border rounded"
          placeholder="Ange årlig intäkt"
        />
      </div>
    )
  }

  // Emaldo: Show guaranteed + configurable post-campaign
  const guaranteedMonthly = EMALDO_STODTJANSTER_RATES[elomrade]

  return (
    <div className="space-y-4">
      {/* Guaranteed income (read-only) */}
      <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
        <div className="text-sm text-green-700 dark:text-green-400 font-medium mb-1">
          Garanterad intäkt (36 månader)
        </div>
        <div className="text-2xl font-bold text-green-900 dark:text-green-300">
          {guaranteedMonthly.toLocaleString('sv-SE')} kr/mån
        </div>
        <div className="text-xs text-green-600 dark:text-green-500 mt-1">
          = {(guaranteedMonthly * 12).toLocaleString('sv-SE')} kr/år
        </div>
      </div>

      {/* Post-campaign rate (configurable) */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">
          Efter kampanjperiod (SEK/kW/år)
        </label>
        <input
          type="number"
          value={postCampaignRate}
          onChange={(e) => updatePostCampaignRate(parseFloat(e.target.value))}
          className="w-full px-3 py-2 border rounded"
          step="100"
          min="0"
        />
        <p className="text-xs text-gray-500">
          Intäkt per kW batterikapacitet efter 36 månader
        </p>
      </div>

      {/* Expandable details */}
      <details className="text-sm">
        <summary className="cursor-pointer text-blue-600 hover:text-blue-700">
          Mer detaljer
        </summary>
        <div className="mt-2 space-y-1 text-gray-600">
          <p>• Garanterad: {guaranteedMonthly} kr/mån i 36 månader</p>
          <p>• Efter kampanj: {postCampaignRate} kr/kW/år (konfigurerbar)</p>
          <p>• Elområde: {elomrade}</p>
        </div>
      </details>
    </div>
  )
}
```

### Pattern 6: Corrected Spotpris Formula

**What:** Fix formula to use correct efficiency and days calculation
**When to use:** SPOT-01 calculation update

```typescript
// lib/calculations/formulas.ts (corrected)

/**
 * SPOT-01: Calculate spotpris optimization savings (CORRECTED).
 *
 * Formula: spread × efficiency × cycles/day × capacity × days
 *
 * @param capacityKwh - Battery capacity in kWh
 * @param cyclesPerDay - Charge/discharge cycles per day (0.5-3)
 * @param efficiency - Round-trip efficiency (default 80% = 0.8)
 * @param dayPriceOre - Average day price in öre/kWh
 * @param nightPriceOre - Average night price in öre/kWh
 * @param daysPerYear - Days in calculation period (default 365)
 */
export function calcSpotprisSavingsFixed(
  capacityKwh: number,
  cyclesPerDay: number,
  efficiency: number,
  dayPriceOre: number,
  nightPriceOre: number,
  daysPerYear: number = 365
): Decimal {
  const spread = d(dayPriceOre).minus(nightPriceOre) // Öre/kWh

  // SPOT-01: spread × efficiency × cycles × capacity × days
  return spread
    .times(efficiency) // Default 0.8 for 80%
    .times(cyclesPerDay)
    .times(capacityKwh)
    .times(daysPerYear)
    .div(100) // Convert öre to SEK
}
```

### Anti-Patterns to Avoid

- **Debouncing slider onChange:** Requirements specify immediate updates. Debounce only text inputs.
- **Client-side constraint validation only:** Peak shaving limit must also validate server-side.
- **Hardcoded zone rates in component:** Keep in constants.ts for org-level override support.
- **Toast spam on rapid slider changes:** Use ref to track if warning already shown for current threshold crossing.
- **Animating on every render:** Only animate when value actually changes, not on component re-render.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Range slider component | Custom div + drag handlers | Native `<input type="range">` | Accessibility, keyboard nav, mobile support all built-in |
| Toast notifications | Custom positioned divs + timeouts | Sonner | Queue management, stacking, auto-dismiss, promise support |
| Value change animations | CSS transitions on value | Framer Motion animate prop | Easier to trigger on state change, better React integration |
| Min/max constraint logic | Manual if/else validation | Math.min(), Math.max() | Clearer intent, less error-prone |
| Swedish number formatting | String manipulation | toLocaleString('sv-SE') | Handles space separator, decimal comma correctly |

**Key insight:** Native HTML5 range input is accessibility-ready and mobile-friendly. Don't overcomplicate with custom slider libraries unless you need multi-thumb or other advanced features.

## Common Pitfalls

### Pitfall 1: Slider onChange Debouncing Breaking Perceived Performance

**What goes wrong:** User drags slider but value display lags, feels unresponsive
**Why it happens:** Applying debounce pattern from text inputs to slider onChange
**How to avoid:**
1. Update Zustand state immediately on slider onChange
2. Trigger calculation synchronously (decimal.js is fast enough)
3. Use transient updates if needed (Zustand supports this)
4. Only debounce network requests, not local calculations
**Warning signs:** Slider feels sluggish, value doesn't track thumb position

### Pitfall 2: Toast Notification Spam

**What goes wrong:** Every slider movement triggers new warning toast, screen fills with toasts
**Why it happens:** useEffect triggers on every cyclesPerDay change, including within threshold
**How to avoid:**
1. Use ref to track whether warning already shown for this threshold crossing
2. Only show toast on transition from ≤2 to >2, not on every change >2
3. Dismiss previous toast before showing new one
4. Consider toast.warning() with same ID to replace instead of stack
**Warning signs:** Multiple identical toasts on screen, poor UX

### Pitfall 3: Peak Shaving Over-Promise

**What goes wrong:** Calculation shows 50% reduction but battery can't deliver that kW
**Why it happens:** Not applying min(target, capacity) constraint
**How to avoid:**
1. Always calculate actual = min(peak × %, battery capacity)
2. Use actualKw for savings calculation, not targetKw
3. Show warning when constraint applies
4. Validate both client and server side
**Warning signs:** ROI looks too good to be true, customer complaints

### Pitfall 4: Stödtjänster Calculation Inconsistency

**What goes wrong:** Emaldo batteries show different stödtjänster values than expected
**Why it happens:** Mixing monthly/yearly rates, forgetting campaign period
**How to avoid:**
1. Store all rates in consistent units (SEK/month or SEK/year, choose one)
2. Separate guaranteed (36 months) from post-campaign calculations
3. Document rate source (GRID-01 hardcoded vs manual entry)
4. Show breakdown: guaranteed + post-campaign = total
**Warning signs:** Values don't match Excel, zone rates wrong

### Pitfall 5: Animation Performance Degradation

**What goes wrong:** Page becomes laggy when multiple sliders active
**Why it happens:** Too many motion components animating simultaneously
**How to avoid:**
1. Use AnimatePresence with mode="wait" to prevent overlap
2. Limit animation scope to changed values only
3. Use transform and opacity (GPU-accelerated) not width/height
4. Disable animations on low-power devices (prefers-reduced-motion)
**Warning signs:** Dropped frames, janky slider movement, high CPU

### Pitfall 6: Controlled Input State Race

**What goes wrong:** Slider jumps to wrong value or ignores user input
**Why it happens:** Zustand update and local state out of sync
**How to avoid:**
1. Single source of truth: Either Zustand OR useState, not both
2. Use Zustand directly for slider value, no local intermediate state
3. If using selector, ensure it returns stable reference
4. Don't mix controlled and uncontrolled inputs
**Warning signs:** Slider doesn't move, jumps back to old value

## Code Examples

### Complete Cycles Slider with All Features

```typescript
// components/calculations/controls/cycles-slider.tsx
'use client'

import { useCalculationWizardStore } from '@/stores/calculation-wizard-store'
import { motion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

export function CyclesSlider() {
  const cyclesPerDay = useCalculationWizardStore((state) => state.cyclesPerDay)
  const updateCyclesPerDay = useCalculationWizardStore((state) => state.updateCyclesPerDay)
  const hasShownWarning = useRef(false)

  // SPOT-03: Warning when cycles > 2
  useEffect(() => {
    if (cyclesPerDay > 2 && !hasShownWarning.current) {
      toast.warning('Höga cykler påverkar garantin', {
        description: 'Fler än 2 cykler per dag kan förkorta batteriets garantitid. Optimal livslängd uppnås vid 1-2 cykler/dag.',
        duration: 3000,
      })
      hasShownWarning.current = true
    } else if (cyclesPerDay <= 2) {
      hasShownWarning.current = false
    }
  }, [cyclesPerDay])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    updateCyclesPerDay(value) // Immediate, no debounce per requirements
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Laddningscykler per dag
        </label>
        <motion.span
          key={cyclesPerDay}
          initial={{ scale: 1.3, color: '#3B82F6' }}
          animate={{ scale: 1, color: '#1F2937' }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="text-lg font-bold tabular-nums"
        >
          {cyclesPerDay.toFixed(1)}
        </motion.span>
      </div>

      <input
        type="range"
        min={0.5}
        max={3}
        step={0.5}
        value={cyclesPerDay}
        onChange={handleChange}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-blue-600 slider"
        aria-label="Antal laddningscykler per dag"
        aria-valuemin={0.5}
        aria-valuemax={3}
        aria-valuenow={cyclesPerDay}
        aria-valuetext={`${cyclesPerDay} cykler per dag`}
      />

      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>0.5 (konservativ)</span>
        <span>1.5 (typisk)</span>
        <span>3.0 (max)</span>
      </div>

      {cyclesPerDay > 2 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-700 dark:text-amber-400"
        >
          <div className="flex items-start gap-2">
            <span className="text-base">⚠️</span>
            <div>
              <strong>Påverkar garantitid:</strong> Höga cykler ger högre besparing men kan förkorta batteriets livslängd.
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
```

### Zustand Store Extensions

```typescript
// stores/calculation-wizard-store.ts (additions)
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface WizardState {
  // ... existing fields

  // Phase 6: Slider controls
  cyclesPerDay: number
  peakShavingPercent: number
  postCampaignRate: number

  // Actions
  updateCyclesPerDay: (cycles: number) => void
  updatePeakShaving: (percent: number) => void
  updatePostCampaignRate: (rate: number) => void
}

export const useCalculationWizardStore = create<WizardState>()(
  persist(
    (set, get) => ({
      // ... existing state

      // SPOT-02: Default from org config or 1.2
      cyclesPerDay: 1.2,

      // PEAK-01: Default 50% reduction
      peakShavingPercent: 50,

      // GRID-03: Default 500 SEK/kW/year post-campaign
      postCampaignRate: 500,

      updateCyclesPerDay: (cycles) => {
        set({ cyclesPerDay: cycles })
        // Trigger recalculation immediately
        get().recalculate()
      },

      updatePeakShaving: (percent) => {
        set({ peakShavingPercent: percent })
        get().recalculate()
      },

      updatePostCampaignRate: (rate) => {
        set({ postCampaignRate: rate })
        get().recalculate()
      },

      recalculate: () => {
        // Call calculation engine with current state
        const state = get()
        const results = calculateBatteryROI({
          battery: state.selectedBattery,
          cyclesPerDay: state.cyclesPerDay,
          // ... other inputs
        })
        set({ results })
      },
    }),
    {
      name: 'calculation-wizard-draft',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-toastify | Sonner | 2024-2025 | Lighter bundle, better DX, no hooks needed |
| Custom slider libraries | Native HTML5 range | Always current | Better a11y, smaller bundle, mobile-ready |
| CSS transitions for value changes | Framer Motion animate | 2024+ | Easier React integration, motion values |
| Separate toast libraries | shadcn/ui Sonner | 2025 | Consistent with design system |
| Manual debounce hooks | use-debounce | 2022+ | But NOT for sliders per requirements |

**Deprecated/outdated:**
- react-toastify: Still popular but heavier, Sonner is shadcn/ui recommended
- Custom slider libs for single-thumb: Native range input now well-supported
- jQuery UI slider: Legacy, not React-friendly

## Open Questions

Things that couldn't be fully resolved:

1. **Organization-level default cycles/day**
   - What we know: CONTEXT.md says "default 1.2 (configurable per org)"
   - What's unclear: Where this org config is stored in database
   - Recommendation: Add `defaultCyclesPerDay` to Organization table, fallback to 1.2

2. **Non-Emaldo battery stödtjänster input UX**
   - What we know: GRID-04 says "salesperson enters manually"
   - What's unclear: Whether it's annual total or per-kW-per-year
   - Recommendation: Use per-kW-per-year for consistency, calculate annual total

3. **Peak shaving calculation with variable peaks**
   - What we know: Natagare provides quarterly peaks
   - What's unclear: Whether to use average or max for slider constraint
   - Recommendation: Use average of quarterly peaks as baseline for percentage slider

4. **Logo replacement scope**
   - What we know: CONTEXT.md says "Replace Vercel logo with Kalkyla logo"
   - What's unclear: Whether this is just PDF or entire app
   - Recommendation: Replace throughout app, not just this phase

## Sources

### Primary (HIGH confidence)
- [Radix UI Slider](https://www.radix-ui.com/primitives/docs/components/slider) - Accessible slider patterns
- [Sonner - shadcn/ui](https://ui.shadcn.com/docs/components/sonner) - Toast component documentation
- [Framer Motion Animation](https://motion.dev/docs/react-animation) - React animation patterns
- [MDN: ARIA Slider Role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/slider_role) - Accessibility requirements
- [MDN: Range Input](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/range) - Native HTML5 range specification

### Secondary (MEDIUM confidence)
- [React Slider Libraries 2026](https://reactscript.com/best-range-slider/) - Library comparison
- [React Toast Libraries 2025](https://blog.logrocket.com/react-toast-libraries-compared-2025/) - Toast library comparison
- [Zustand State Management 2026](https://www.nucamp.co/blog/state-management-in-2026-redux-context-api-and-modern-patterns) - State management patterns
- [Decimal.js Precision](https://medium.com/@riteshsinha_62295/front-end-dilemmas-tackling-precision-problems-in-javascript-with-decimal-js-c38a9ae24ddd) - Financial calculation pitfalls

### Tertiary (LOW confidence - verify before use)
- WebSearch results from 2024-2025 general articles - Patterns may have evolved

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Native HTML5 and existing project libraries well-documented
- Architecture: HIGH - Patterns verified against existing codebase (Phase 3 research)
- Formulas: HIGH - SPOT-01 formula correction specified in requirements
- Stödtjänster rates: HIGH - GRID-01 rates explicitly provided in requirements
- Peak shaving: HIGH - min() constraint logic clear from requirements
- Pitfalls: MEDIUM - Inferred from common React patterns, not phase-specific

**Research date:** 2026-01-29
**Valid until:** 30 days (stable domain, established patterns)
