# Phase 7: Calculation Transparency - Research

**Researched:** 2026-01-31
**Domain:** UI expandable breakdowns, calculation transparency, data privacy (hiding sensitive fields)
**Confidence:** HIGH

## Summary

This research covers Phase 7: Calculation Transparency - adding expandable breakdowns to each savings category (spotpris, effektavgifter, stodtjanster) that show how each number is derived, while hiding sensitive business data from the prospect view. The phase builds on Phase 6's calculation engine work and extends the existing public view components.

**Key findings:**
- The project already has native HTML5 `<details>/<summary>` patterns (used in `public-battery-summary.tsx`, `stodtjanster-input.tsx`)
- Framer Motion is already in the project (v12.x) for smooth expand/collapse animations
- The `CalculationResults` type already includes `stodtjansterGuaranteedSek`, `peakShavingKw`, etc. from Phase 6
- The `CalculationResultsPublic` type explicitly excludes margins by design - this pattern continues
- The existing `public-results-view.tsx` has a `showDetailedBreakdown` toggle but lacks the formula/input breakdowns

**Primary recommendation:** Create reusable `ExpandableBreakdown` component using native `<details>/<summary>` with Framer Motion animations, extend `CalculationResultsPublic` type to include breakdown inputs (without sensitive data), and add breakdown sections to each savings category in `PublicResultsView`.

## Standard Stack

The established libraries/tools for this phase:

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Native HTML5 `<details>/<summary>` | Built-in | Expandable sections | Already used in project, accessible, no-JS fallback |
| Framer Motion | 12.x (in project) | Smooth expand/collapse animations | Already used throughout, AnimatePresence for enter/exit |
| React 19 | 19.2.x (in project) | Component architecture | Current project version |
| Tailwind CSS | 4.x (in project) | Styling | Current project version |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Recharts | 3.6.x (in project) | Charts in breakdowns | If visual representations of inputs needed |
| @nivo/pie | 0.99.x (in project) | Pie charts | Already used in savings-breakdown.tsx |
| decimal.js | 10.x (in project) | Display precision | Formatting breakdown values |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native details/summary | Radix Accordion | More features but adds dependency, native is accessible |
| Native details/summary | Headless UI Disclosure | Similar, but already using native pattern |
| Inline breakdown | Modal/drawer | Worse UX for comparison, harder to scan |

**Installation:**
```bash
# No new dependencies needed - all libraries already in project
```

## Architecture Patterns

### Recommended Component Structure
```
src/
├── components/
│   └── calculations/
│       └── breakdowns/                    # NEW: Breakdown components
│           ├── expandable-breakdown.tsx   # Reusable expand/collapse wrapper
│           ├── spotpris-breakdown.tsx     # SPOT-04: Spotpris formula breakdown
│           ├── effekt-breakdown.tsx       # PEAK-04: Effektavgift breakdown
│           └── stodtjanster-breakdown.tsx # GRID-05: Stodtjanster breakdown
│   └── public/
│       └── public-results-view.tsx        # UPDATE: Add breakdown components
└── lib/
    └── share/
        └── types.ts                       # UPDATE: Extend CalculationResultsPublic
```

### Pattern 1: Reusable Expandable Breakdown

**What:** Wrapper component for consistent expand/collapse behavior across all breakdowns
**When to use:** TRANS-01 - Each savings category displays expandable breakdown

```typescript
// components/calculations/breakdowns/expandable-breakdown.tsx
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

interface ExpandableBreakdownProps {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  color: string // Tailwind color class like 'green', 'blue', 'purple'
  defaultOpen?: boolean
  children: React.ReactNode
}

export function ExpandableBreakdown({
  title,
  subtitle,
  icon,
  color,
  defaultOpen = false,
  children,
}: ExpandableBreakdownProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  const colorClasses = {
    green: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      text: 'text-green-700 dark:text-green-400',
      icon: 'text-green-600 dark:text-green-400',
    },
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-700 dark:text-blue-400',
      icon: 'text-blue-600 dark:text-blue-400',
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      border: 'border-purple-200 dark:border-purple-800',
      text: 'text-purple-700 dark:text-purple-400',
      icon: 'text-purple-600 dark:text-purple-400',
    },
  }

  const colors = colorClasses[color as keyof typeof colorClasses] || colorClasses.green

  return (
    <div className={`border ${colors.border} rounded-lg overflow-hidden`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 flex items-center justify-between ${colors.bg} hover:opacity-90 transition-opacity`}
      >
        <div className="flex items-center gap-3">
          {icon && <span className={colors.icon}>{icon}</span>}
          <div className="text-left">
            <span className={`font-medium ${colors.text}`}>{title}</span>
            {subtitle && (
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                {subtitle}
              </span>
            )}
          </div>
        </div>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className={colors.text}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
          >
            <div className="px-4 py-3 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
```

### Pattern 2: Spotpris Breakdown (SPOT-04)

**What:** Shows how spotpris savings is calculated: capacity x efficiency x cycles x spread x days
**When to use:** SPOT-04 requirement

```typescript
// components/calculations/breakdowns/spotpris-breakdown.tsx
'use client'

import { ExpandableBreakdown } from './expandable-breakdown'

interface SpotprisBreakdownProps {
  // Inputs
  capacityKwh: number
  cyclesPerDay: number
  efficiency: number       // 0.8 for 80%
  spreadOre: number        // ~100 ore = 1 SEK
  // Result
  annualSavingsSek: number
}

export function SpotprisBreakdown({
  capacityKwh,
  cyclesPerDay,
  efficiency,
  spreadOre,
  annualSavingsSek,
}: SpotprisBreakdownProps) {
  const dailyKwh = capacityKwh * efficiency * cyclesPerDay
  const dailySavings = dailyKwh * (spreadOre / 100)
  const spreadSek = spreadOre / 100

  const formatSek = (n: number) =>
    Math.round(n).toLocaleString('sv-SE') + ' kr'

  return (
    <ExpandableBreakdown
      title="Hur beraknas spotprisoptimering?"
      color="green"
      icon={<span>&#x26A1;</span>}
    >
      <div className="space-y-4 text-sm">
        {/* Explanation */}
        <p className="text-gray-600 dark:text-gray-400">
          Batteriet laddar nar elpriset ar lagt (natt) och anvander energin nar priset ar hogt (dag).
          Skillnaden i pris ger besparingen.
        </p>

        {/* Formula breakdown */}
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900 dark:text-gray-100">Berakning</h4>

          <div className="bg-gray-50 dark:bg-slate-900/50 p-3 rounded-lg space-y-2 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Batterikapacitet</span>
              <span className="font-medium">{capacityKwh} kWh</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">x Verkningsgrad</span>
              <span className="font-medium">{(efficiency * 100).toFixed(0)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">x Cykler/dag</span>
              <span className="font-medium">{cyclesPerDay}</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 dark:border-slate-700 pt-2">
              <span className="text-gray-600 dark:text-gray-400">= Daglig energi</span>
              <span className="font-medium">{dailyKwh.toFixed(1)} kWh/dag</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">x Prisskillnad (dag-natt)</span>
              <span className="font-medium">~{spreadSek.toFixed(2)} kr/kWh</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">= Daglig besparing</span>
              <span className="font-medium">{dailySavings.toFixed(0)} kr/dag</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">x 365 dagar</span>
              <span className="font-medium">365</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 dark:border-slate-700 pt-2 text-green-600 dark:text-green-400">
              <span className="font-medium">= Arlig besparing</span>
              <span className="font-bold">{formatSek(annualSavingsSek)}</span>
            </div>
          </div>
        </div>
      </div>
    </ExpandableBreakdown>
  )
}
```

### Pattern 3: Effektavgift Breakdown (PEAK-04)

**What:** Shows peak shaving calculation: peak x reduction% = actual kW cut, times tariff rate
**When to use:** PEAK-04 requirement

```typescript
// components/calculations/breakdowns/effekt-breakdown.tsx
'use client'

import { ExpandableBreakdown } from './expandable-breakdown'

interface EffektBreakdownProps {
  // Inputs
  currentPeakKw: number
  peakShavingPercent: number
  actualPeakShavingKw: number  // After battery constraint
  newPeakKw: number
  tariffRateSekKw: number      // Day rate from natagare
  // Result
  annualSavingsSek: number
  isConstrained: boolean       // True if battery limited the shaving
}

export function EffektBreakdown({
  currentPeakKw,
  peakShavingPercent,
  actualPeakShavingKw,
  newPeakKw,
  tariffRateSekKw,
  annualSavingsSek,
  isConstrained,
}: EffektBreakdownProps) {
  const targetKw = currentPeakKw * (peakShavingPercent / 100)
  const monthlySavings = actualPeakShavingKw * tariffRateSekKw

  const formatSek = (n: number) =>
    Math.round(n).toLocaleString('sv-SE') + ' kr'

  return (
    <ExpandableBreakdown
      title="Hur beraknas effektavgiftbesparing?"
      color="blue"
      icon={<span>&#x1F4CA;</span>}
    >
      <div className="space-y-4 text-sm">
        {/* Explanation */}
        <p className="text-gray-600 dark:text-gray-400">
          Genom att minska dina effekttoppar med batteriet sanker du din manatliga effektavgift
          fran elnatagaren.
        </p>

        {/* Formula breakdown */}
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900 dark:text-gray-100">Berakning</h4>

          <div className="bg-gray-50 dark:bg-slate-900/50 p-3 rounded-lg space-y-2 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Nuvarande toppeffekt</span>
              <span className="font-medium">{currentPeakKw.toFixed(1)} kW</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">x Reduktion</span>
              <span className="font-medium">{peakShavingPercent}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">= Malreduktion</span>
              <span className="font-medium">{targetKw.toFixed(1)} kW</span>
            </div>

            {isConstrained && (
              <div className="flex justify-between text-amber-600 dark:text-amber-400">
                <span>Begransad av batterikapacitet</span>
                <span className="font-medium">{actualPeakShavingKw.toFixed(1)} kW</span>
              </div>
            )}

            <div className="flex justify-between border-t border-gray-200 dark:border-slate-700 pt-2">
              <span className="text-gray-600 dark:text-gray-400">Faktisk reduktion</span>
              <span className="font-medium">{actualPeakShavingKw.toFixed(1)} kW</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Ny toppeffekt</span>
              <span className="font-medium">{newPeakKw.toFixed(1)} kW</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 dark:border-slate-700 pt-2">
              <span className="text-gray-600 dark:text-gray-400">x Effekttariff</span>
              <span className="font-medium">{tariffRateSekKw.toFixed(0)} kr/kW/man</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">= Manatlig besparing</span>
              <span className="font-medium">{formatSek(monthlySavings)}/man</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">x 12 manader</span>
              <span className="font-medium">12</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 dark:border-slate-700 pt-2 text-blue-600 dark:text-blue-400">
              <span className="font-medium">= Arlig besparing</span>
              <span className="font-bold">{formatSek(annualSavingsSek)}</span>
            </div>
          </div>
        </div>
      </div>
    </ExpandableBreakdown>
  )
}
```

### Pattern 4: Stodtjanster Breakdown (GRID-05)

**What:** Shows grid services income calculation: zone-based rate or manual, campaign vs post-campaign
**When to use:** GRID-05 requirement

```typescript
// components/calculations/breakdowns/stodtjanster-breakdown.tsx
'use client'

import { ExpandableBreakdown } from './expandable-breakdown'
import { EMALDO_CAMPAIGN_MONTHS } from '@/lib/calculations/constants'

interface StodtjansterBreakdownProps {
  // Inputs
  elomrade: string
  isEmaldoBattery: boolean
  batteryCapacityKw: number
  // Emaldo-specific
  guaranteedMonthlySek?: number
  guaranteedAnnualSek?: number
  guaranteedTotalSek?: number
  // Post-campaign
  postCampaignRatePerKwYear?: number
  postCampaignAnnualSek?: number
  // Result
  displayedAnnualSek: number
}

export function StodtjansterBreakdown({
  elomrade,
  isEmaldoBattery,
  batteryCapacityKw,
  guaranteedMonthlySek,
  guaranteedAnnualSek,
  guaranteedTotalSek,
  postCampaignRatePerKwYear,
  postCampaignAnnualSek,
  displayedAnnualSek,
}: StodtjansterBreakdownProps) {
  const formatSek = (n: number) =>
    Math.round(n).toLocaleString('sv-SE') + ' kr'

  return (
    <ExpandableBreakdown
      title="Hur beraknas stodtjanster?"
      color="purple"
      icon={<span>&#x1F50C;</span>}
    >
      <div className="space-y-4 text-sm">
        {/* Explanation */}
        <p className="text-gray-600 dark:text-gray-400">
          Du kan tjana pengar pa att lata elnatet anvanda ditt batteri for frekvensreglering
          och andra balansieringstjanster.
        </p>

        {/* Formula breakdown */}
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900 dark:text-gray-100">Berakning</h4>

          <div className="bg-gray-50 dark:bg-slate-900/50 p-3 rounded-lg space-y-2 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Elomrade</span>
              <span className="font-medium">{elomrade}</span>
            </div>

            {isEmaldoBattery && guaranteedMonthlySek !== undefined ? (
              <>
                {/* Emaldo guaranteed income */}
                <div className="pt-2 border-t border-gray-200 dark:border-slate-700">
                  <div className="text-green-600 dark:text-green-400 font-medium mb-1">
                    Emaldo garanterad intakt ({EMALDO_CAMPAIGN_MONTHS} man)
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Manatlig intakt</span>
                  <span className="font-medium">{formatSek(guaranteedMonthlySek)}/man</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">x 12 manader</span>
                  <span className="font-medium">12</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 dark:border-slate-700 pt-2 text-purple-600 dark:text-purple-400">
                  <span className="font-medium">= Arlig intakt (ar 1-3)</span>
                  <span className="font-bold">{formatSek(guaranteedAnnualSek || 0)}</span>
                </div>

                {/* Post-campaign estimate */}
                {postCampaignRatePerKwYear !== undefined && postCampaignAnnualSek !== undefined && (
                  <div className="pt-2 border-t border-gray-200 dark:border-slate-700 space-y-2">
                    <div className="text-gray-500 dark:text-gray-500 font-medium">
                      Efter kampanjperiod (ar 4+)
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Batterikapacitet</span>
                      <span className="font-medium">{batteryCapacityKw.toFixed(1)} kW</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">x Uppskattad rate</span>
                      <span className="font-medium">{postCampaignRatePerKwYear} kr/kW/ar</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">= Arlig intakt (ar 4+)</span>
                      <span className="font-medium">{formatSek(postCampaignAnnualSek)}/ar</span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Non-Emaldo: Standard calculation */}
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Batterikapacitet</span>
                  <span className="font-medium">{batteryCapacityKw.toFixed(1)} kW</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">x Uppskattad rate</span>
                  <span className="font-medium">{postCampaignRatePerKwYear || 500} kr/kW/ar</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 dark:border-slate-700 pt-2 text-purple-600 dark:text-purple-400">
                  <span className="font-medium">= Arlig intakt</span>
                  <span className="font-bold">{formatSek(displayedAnnualSek)}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </ExpandableBreakdown>
  )
}
```

### Pattern 5: Extended Public Types (TRANS-04)

**What:** Extend CalculationResultsPublic to include breakdown inputs while excluding sensitive data
**When to use:** TRANS-02, TRANS-03, TRANS-04 requirements

```typescript
// lib/share/types.ts (additions)

/**
 * Breakdown data for public transparency view.
 * Includes calculation inputs for each savings category.
 * EXCLUDES: margins, org cuts, cost prices (TRANS-04)
 */
export interface CalculationBreakdownPublic {
  // Spotpris breakdown (SPOT-04)
  spotpris: {
    capacityKwh: number
    cyclesPerDay: number
    efficiency: number         // 0.8 for 80%
    spreadOre: number          // ~100 ore default
    annualSavingsSek: number
  }
  // Effektavgift breakdown (PEAK-04)
  effekt: {
    currentPeakKw: number
    peakShavingPercent: number
    actualPeakShavingKw: number
    newPeakKw: number
    tariffRateSekKw: number
    annualSavingsSek: number
    isConstrained: boolean
  }
  // Stodtjanster breakdown (GRID-05)
  stodtjanster: {
    elomrade: string
    isEmaldoBattery: boolean
    batteryCapacityKw: number
    guaranteedMonthlySek?: number
    guaranteedAnnualSek?: number
    postCampaignRatePerKwYear?: number
    postCampaignAnnualSek?: number
    displayedAnnualSek: number
  }
}

/**
 * Extended CalculationResultsPublic with breakdown support.
 */
export interface CalculationResultsPublicWithBreakdown extends CalculationResultsPublic {
  breakdown?: CalculationBreakdownPublic
}
```

### Anti-Patterns to Avoid

- **Exposing margins in breakdowns:** TRANS-04 explicitly requires hiding margins, org cuts, internal data
- **Hardcoding Swedish text:** Use consistent patterns from existing components
- **Complex state for expand/collapse:** Native `<details>` with CSS/Framer Motion is simpler than useState + render logic
- **Breaking existing public view:** Breakdowns should be additive, not replace existing functionality
- **Recalculating in public view:** Use stored results from database, don't recalculate client-side

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Expand/collapse UI | Custom accordion with useState | Native `<details>/<summary>` + Framer Motion | Accessible, keyboard nav, no-JS fallback |
| Number formatting | String concatenation | `toLocaleString('sv-SE')` + helper | Consistent with existing formatSek() |
| Animation timing | Manual CSS transitions | Framer Motion `AnimatePresence` | Already in project, handles enter/exit |
| Color theming | Inline styles | Tailwind classes from colorClasses map | Consistent with dark mode support |
| Breakdown data structure | Inline object literals | TypeScript interfaces | Type safety, IDE support |

**Key insight:** The project already has established patterns for expandable sections (`<details>` in battery-summary, stodtjanster-input). Follow these patterns for consistency.

## Common Pitfalls

### Pitfall 1: Exposing Sensitive Data in Breakdowns

**What goes wrong:** Margins, cost prices, or org cuts leak into public view
**Why it happens:** Using full CalculationResults type instead of public subset
**How to avoid:**
1. Use `CalculationBreakdownPublic` type that explicitly excludes sensitive fields
2. Server-side filtering before sending to client
3. Code review checklist for public view changes
**Warning signs:** `marginSek`, `costPriceTotal`, `installerCut` in public component props

### Pitfall 2: Breakdown Animation Jank

**What goes wrong:** Content jumps or flickers when expanding/collapsing
**Why it happens:** Height animation without `overflow: hidden` or wrong initial state
**How to avoid:**
1. Use `AnimatePresence` with `initial={false}` to prevent mount animation
2. Wrap content in motion.div with `overflow: hidden`
3. Use `height: 'auto'` for final state, not calculated pixels
**Warning signs:** Flash of content, layout shift, stuttering

### Pitfall 3: Breakdown Data Mismatch

**What goes wrong:** Breakdown shows different values than summary totals
**Why it happens:** Calculating breakdown inputs separately from engine results
**How to avoid:**
1. Single source of truth: Use stored calculation results
2. Pass breakdown data alongside results, not computed separately
3. Test with edge cases (0 values, constrained values)
**Warning signs:** Breakdown subtotals don't match displayed annual savings

### Pitfall 4: Mobile Accordion UX

**What goes wrong:** Multiple breakdowns open, overwhelming small screen
**Why it happens:** No coordination between breakdown components
**How to avoid:**
1. Consider "accordion" behavior (open one closes others) for mobile
2. Use smaller text/padding on mobile
3. Test on actual mobile devices
**Warning signs:** Scroll position lost, too much content visible

### Pitfall 5: Missing Breakdown Data

**What goes wrong:** Component crashes or shows undefined when breakdown data missing
**Why it happens:** Optional breakdown field not handled
**How to avoid:**
1. Check `breakdown` exists before rendering breakdown components
2. Provide sensible defaults or "data not available" message
3. Backwards compatibility with calculations without breakdown data
**Warning signs:** TypeError on production, blank sections

## Code Examples

### Integrating Breakdowns into PublicResultsView

```typescript
// components/public/public-results-view.tsx (updated)
'use client'

import { SpotprisBreakdown } from '@/components/calculations/breakdowns/spotpris-breakdown'
import { EffektBreakdown } from '@/components/calculations/breakdowns/effekt-breakdown'
import { StodtjansterBreakdown } from '@/components/calculations/breakdowns/stodtjanster-breakdown'
import type { CalculationResultsPublicWithBreakdown } from '@/lib/share/types'

interface PublicResultsViewProps {
  results: CalculationResultsPublicWithBreakdown
  primaryColor: string
}

export function PublicResultsView({ results, primaryColor }: PublicResultsViewProps) {
  const { breakdown } = results

  return (
    <div className="space-y-6">
      {/* Existing savings summary section */}
      <section className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
        {/* ... existing pie chart and totals ... */}
      </section>

      {/* TRANS-01: Expandable breakdowns for each category */}
      {breakdown && (
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Detaljerad berakning
          </h3>

          {/* SPOT-04: Spotpris breakdown */}
          {results.spotprisSavings > 0 && (
            <SpotprisBreakdown
              capacityKwh={breakdown.spotpris.capacityKwh}
              cyclesPerDay={breakdown.spotpris.cyclesPerDay}
              efficiency={breakdown.spotpris.efficiency}
              spreadOre={breakdown.spotpris.spreadOre}
              annualSavingsSek={breakdown.spotpris.annualSavingsSek}
            />
          )}

          {/* PEAK-04: Effektavgift breakdown */}
          {results.effectTariffSavings > 0 && (
            <EffektBreakdown
              currentPeakKw={breakdown.effekt.currentPeakKw}
              peakShavingPercent={breakdown.effekt.peakShavingPercent}
              actualPeakShavingKw={breakdown.effekt.actualPeakShavingKw}
              newPeakKw={breakdown.effekt.newPeakKw}
              tariffRateSekKw={breakdown.effekt.tariffRateSekKw}
              annualSavingsSek={breakdown.effekt.annualSavingsSek}
              isConstrained={breakdown.effekt.isConstrained}
            />
          )}

          {/* GRID-05: Stodtjanster breakdown */}
          {results.gridServicesIncome > 0 && (
            <StodtjansterBreakdown
              elomrade={breakdown.stodtjanster.elomrade}
              isEmaldoBattery={breakdown.stodtjanster.isEmaldoBattery}
              batteryCapacityKw={breakdown.stodtjanster.batteryCapacityKw}
              guaranteedMonthlySek={breakdown.stodtjanster.guaranteedMonthlySek}
              guaranteedAnnualSek={breakdown.stodtjanster.guaranteedAnnualSek}
              postCampaignRatePerKwYear={breakdown.stodtjanster.postCampaignRatePerKwYear}
              postCampaignAnnualSek={breakdown.stodtjanster.postCampaignAnnualSek}
              displayedAnnualSek={breakdown.stodtjanster.displayedAnnualSek}
            />
          )}
        </section>
      )}

      {/* Existing ROI timeline chart */}
      <section className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
        {/* ... existing chart ... */}
      </section>
    </div>
  )
}
```

### Server-Side Breakdown Data Preparation

```typescript
// actions/share.ts (addition)

/**
 * Build public breakdown data from full calculation results.
 * Filters out sensitive business data (TRANS-04).
 */
export function buildPublicBreakdown(
  fullResults: CalculationResults,
  inputs: {
    capacityKwh: number
    cyclesPerDay: number
    efficiency: number
    spreadOre: number
    currentPeakKw: number
    peakShavingPercent: number
    tariffRateSekKw: number
    elomrade: string
    isEmaldoBattery: boolean
    postCampaignRatePerKwYear: number
  }
): CalculationBreakdownPublic {
  return {
    spotpris: {
      capacityKwh: inputs.capacityKwh,
      cyclesPerDay: inputs.cyclesPerDay,
      efficiency: inputs.efficiency,
      spreadOre: inputs.spreadOre,
      annualSavingsSek: fullResults.spotprisSavingsSek,
    },
    effekt: {
      currentPeakKw: inputs.currentPeakKw,
      peakShavingPercent: inputs.peakShavingPercent,
      actualPeakShavingKw: fullResults.peakShavingKw || 0,
      newPeakKw: fullResults.newPeakKw || inputs.currentPeakKw,
      tariffRateSekKw: inputs.tariffRateSekKw,
      annualSavingsSek: fullResults.effectTariffSavingsSek,
      isConstrained: (fullResults.peakShavingKw || 0) < (inputs.currentPeakKw * inputs.peakShavingPercent / 100),
    },
    stodtjanster: {
      elomrade: inputs.elomrade,
      isEmaldoBattery: inputs.isEmaldoBattery,
      batteryCapacityKw: inputs.capacityKwh, // Use max discharge for stodtjanster
      guaranteedMonthlySek: inputs.isEmaldoBattery
        ? (fullResults.stodtjansterGuaranteedSek ? fullResults.stodtjansterGuaranteedSek / 36 : undefined)
        : undefined,
      guaranteedAnnualSek: inputs.isEmaldoBattery
        ? (fullResults.stodtjansterGuaranteedSek ? fullResults.stodtjansterGuaranteedSek / 3 : undefined)
        : undefined,
      postCampaignRatePerKwYear: inputs.postCampaignRatePerKwYear,
      postCampaignAnnualSek: fullResults.stodtjansterPostCampaignSek
        ? fullResults.stodtjansterPostCampaignSek / 7 // 10 years - 3 campaign years
        : undefined,
      displayedAnnualSek: fullResults.gridServicesIncomeSek,
    },
  }
  // NOTE: marginSek, costPriceTotal, installerCut are NOT included (TRANS-04)
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| jQuery accordion | Native `<details>/<summary>` | HTML5.1 (2016) | No JS required, accessible by default |
| Manual height animations | Framer Motion AnimatePresence | 2020+ | Cleaner API, automatic cleanup |
| Inline expand/collapse icons | CSS transform on chevron | 2020+ | GPU-accelerated, smoother |
| Separate mobile accordion | Responsive Tailwind classes | Current | Single component, less code |

**Deprecated/outdated:**
- jQuery UI Accordion: Legacy, not React-friendly
- react-collapse: Unmaintained, Framer Motion preferred
- Manual CSS height transitions: Harder to manage, Framer Motion handles edge cases

## Open Questions

Things that couldn't be fully resolved:

1. **Storing breakdown data in database**
   - What we know: Results are stored as JSON in calculation table
   - What's unclear: Whether to extend existing results field or add separate breakdown field
   - Recommendation: Extend results JSON to include breakdown, compute on save

2. **Backwards compatibility for existing calculations**
   - What we know: Existing calculations won't have breakdown data
   - What's unclear: Whether to backfill or show "data not available"
   - Recommendation: Show breakdown section only when data exists, don't backfill

3. **Accordion vs independent toggles**
   - What we know: Mobile has limited space
   - What's unclear: User preference for coordinated vs independent expand
   - Recommendation: Start with independent toggles, monitor analytics for UX feedback

## Sources

### Primary (HIGH confidence)
- Existing codebase: `public-battery-summary.tsx`, `stodtjanster-input.tsx` - Expandable patterns
- Existing codebase: `lib/share/types.ts` - Public data type patterns
- Existing codebase: `lib/calculations/engine.ts` - Calculation result structure
- MDN Web Docs: `<details>` and `<summary>` elements - Native HTML5 expandable
- Framer Motion docs: AnimatePresence - Animation patterns

### Secondary (MEDIUM confidence)
- Phase 6 RESEARCH.md - Calculation patterns and decisions
- Phase 6 implementation - Store structure, constraint handling

### Tertiary (LOW confidence)
- None - all findings verified against existing codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing project libraries only
- Architecture: HIGH - Following established patterns from codebase
- Data privacy: HIGH - CalculationResultsPublic pattern already excludes sensitive data
- Pitfalls: MEDIUM - Based on common React/animation patterns

**Research date:** 2026-01-31
**Valid until:** 30 days (stable domain, established patterns)

---

## Addendum: Manual Overrides (OVRD-01 through OVRD-04)

**Added:** 2026-01-31 after user feedback during planning

### Requirements Summary

- **OVRD-01**: Salesperson can manually override any calculated savings total (spotpris, stodtjanster, effektavgifter)
- **OVRD-02**: Salesperson can manually override individual calculation inputs (cycles, peak %, rates, etc.)
- **OVRD-03**: Overrides are saved and sync instantly to already-shared calculation links
- **OVRD-04**: Overrides are hidden from prospects (they see adjusted numbers as calculated values)

### Architecture Approach

**Key insight:** Shared calculations are fetched on page load from the database. The public view reads stored results, not recalculates. This means:

1. When a salesperson overrides a value, we update the stored calculation in the database
2. Any subsequent load of the shared link gets the updated values
3. No WebSocket or real-time push needed - the "instant sync" happens naturally on next page load

### Data Structure

Extend the calculation store and database schema to track overrides:

```typescript
// Store extension
interface CalculationOverrides {
  // Savings total overrides (OVRD-01)
  spotprisSavingsSek?: number | null  // null = use calculated
  stodtjansterIncomeSek?: number | null
  effectTariffSavingsSek?: number | null

  // Input overrides (OVRD-02) - already in store from Phase 6
  cyclesPerDay?: number
  peakShavingPercent?: number
  postCampaignRate?: number

  // Additional input overrides
  spreadOre?: number
  tariffRateSekKw?: number
}

// When saving calculation
interface SavedCalculation {
  results: CalculationResults      // Computed values
  overrides?: CalculationOverrides  // Manual adjustments
  // Display logic: override ?? computed
}
```

### UI Pattern: Inline Override

For totals (OVRD-01), add an "edit" icon next to each savings value:

```typescript
// components/calculations/overridable-value.tsx
interface OverridableValueProps {
  label: string
  calculatedValue: number
  overrideValue: number | null
  onOverride: (value: number | null) => void
  formatFn?: (n: number) => string
}

export function OverridableValue({
  label,
  calculatedValue,
  overrideValue,
  onOverride,
  formatFn = (n) => Math.round(n).toLocaleString('sv-SE') + ' kr',
}: OverridableValueProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const displayValue = overrideValue ?? calculatedValue
  const isOverridden = overrideValue !== null

  const handleSave = () => {
    const parsed = parseFloat(inputValue.replace(/[^0-9.-]/g, ''))
    if (!isNaN(parsed)) {
      onOverride(parsed)
    }
    setIsEditing(false)
  }

  const handleReset = () => {
    onOverride(null)
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="w-32 px-2 py-1 border rounded text-right"
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        />
        <button onClick={handleSave}>✓</button>
        <button onClick={() => setIsEditing(false)}>✗</button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className={isOverridden ? 'text-blue-600' : ''}>
        {formatFn(displayValue)}
      </span>
      <button
        onClick={() => {
          setInputValue(displayValue.toString())
          setIsEditing(true)
        }}
        className="text-gray-400 hover:text-gray-600"
        title="Redigera värde"
      >
        ✏️
      </button>
      {isOverridden && (
        <button
          onClick={handleReset}
          className="text-gray-400 hover:text-red-500 text-xs"
          title="Återställ till beräknat värde"
        >
          ↩
        </button>
      )}
    </div>
  )
}
```

### Hiding Overrides from Prospects (OVRD-04)

The public view already uses `CalculationResultsPublic` which is a filtered subset. Overrides are applied server-side before this filtering:

```typescript
// actions/share.ts - getPublicCalculation
export async function getPublicCalculation(shareId: string): Promise<CalculationResultsPublic> {
  const calc = await db.calculation.findUnique({ where: { shareId } })

  // Apply overrides to results (salesperson's manual adjustments)
  const effectiveResults = {
    ...calc.results,
    spotprisSavingsSek: calc.overrides?.spotprisSavingsSek ?? calc.results.spotprisSavingsSek,
    stodtjansterIncomeSek: calc.overrides?.stodtjansterIncomeSek ?? calc.results.stodtjansterIncomeSek,
    effectTariffSavingsSek: calc.overrides?.effectTariffSavingsSek ?? calc.results.effectTariffSavingsSek,
  }

  // Filter to public subset - overrides are invisible
  return filterToPublic(effectiveResults)
  // NOTE: calc.overrides is NOT included in return - OVRD-04 satisfied
}
```

### Database Changes

Minimal schema change needed:

```prisma
model Calculation {
  // existing fields...

  overrides  Json?  // CalculationOverrides - null means no overrides
}
```

### Instant Sync Behavior (OVRD-03)

1. Salesperson edits value → Store updates → Server action saves to DB
2. Prospect (already has link open) refreshes or navigates → Gets updated values
3. No WebSocket needed since:
   - Prospects don't keep connections open
   - Fresh load = fresh data
   - "Instant" means "next load", not "push notification"

If true real-time push is needed later, could add:
- SWR with polling every 30s
- WebSocket for premium orgs
But this is out of scope for v1.1.

### Confidence

- **Architecture:** HIGH - Using existing database/store patterns
- **UI Pattern:** MEDIUM - Standard inline-edit, but needs polish
- **Privacy (OVRD-04):** HIGH - Existing public type filtering works
