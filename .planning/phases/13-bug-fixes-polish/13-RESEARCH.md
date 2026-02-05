# Phase 13: Bug Fixes & Polish - Research

**Researched:** 2026-02-05
**Domain:** React UI bug fixes, number formatting, sidebar state management
**Confidence:** HIGH

## Summary

This phase fixes three display bugs (FIX-01, FIX-02, FIX-04) to make v1.2 release-ready. The fixes involve percentage formatting consistency, persistent sidebar state with collapse/expand functionality, and correcting Spotpris breakdown display values.

Research focused on React patterns for number formatting without trailing zeros, localStorage state persistence patterns for Next.js SSR, and smooth CSS/Framer Motion animations for collapsible sidebars. The existing codebase uses React 19.2.3, Next.js 16.1.3, Framer Motion 12.27.2, and Tailwind CSS 4 with Lucide React icons.

User decisions from CONTEXT.md lock in: 2 decimal places max with trailing zeros trimmed (90.2% not 90.20%), sidebar expanded by default with collapse to icons-only, state persisted in localStorage, and Swedish labels for Spotpris breakdown values.

**Primary recommendation:** Use native JavaScript `parseFloat(num.toFixed(2))` pattern for percentage formatting, React hooks (useState + useEffect) for localStorage sidebar state with SSR-safe mounting check, and Framer Motion's layout animations for smooth sidebar width transitions.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.3 | UI framework | Already in use, standard for interactive UIs |
| Next.js | 16.1.3 | SSR framework | Already in use, handles SSR/hydration |
| Framer Motion | 12.27.2 | Animation library | Already in use, hardware-accelerated animations |
| Tailwind CSS | 4 | Styling framework | Already in use, utility-first CSS |
| Lucide React | 0.562.0 | Icon library | Already in use, consistent icon system |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| localStorage API | Native | State persistence | Sidebar collapse state, theme preferences |
| Intl.NumberFormat | Native | Number formatting | Currency/percentage display (if needed) |
| toFixed() + parseFloat() | Native | Remove trailing zeros | Percentage formatting with clean display |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native formatting | react-number-format | Overkill for simple percentage display, adds dependency |
| useEffect + localStorage | useSyncExternalStore | More complex, not needed for simple sidebar state |
| Framer Motion | CSS transitions only | Loses orchestration capabilities, less smooth |

**Installation:**
No new packages needed - all fixes use existing dependencies.

## Architecture Patterns

### Recommended Project Structure
Fixes touch existing files only:
```
src/
├── components/
│   ├── layout/
│   │   └── admin-sidebar.tsx       # FIX-02: Add collapse state
│   └── calculations/
│       └── breakdowns/
│           └── spotpris-breakdown.tsx  # FIX-01, FIX-04: Fix formatting
└── lib/
    └── utils.ts                     # Add shared percentage formatter
```

### Pattern 1: Number Formatting Without Trailing Zeros
**What:** Format percentages/decimals with max precision, auto-trim trailing zeros
**When to use:** Displaying percentages (90.2% not 90.20%), currency with optional decimals
**Example:**
```typescript
// Source: 30secondsofcode.org (verified pattern)
function formatPercentage(decimal: number, maxDecimals = 2): string {
  const percentage = decimal * 100
  return `${parseFloat(percentage.toFixed(maxDecimals))}%`
}

// Examples:
formatPercentage(0.9) // "90%"
formatPercentage(0.902) // "90.2%"
formatPercentage(0.9025) // "90.25%" (respects 2 decimal max)
formatPercentage(0.90200) // "90.2%" (trailing zeros removed)
```

**Why this works:**
- `toFixed(n)` converts to string with n decimals (pads with zeros)
- `parseFloat()` converts back to number, removing trailing zeros
- Template literal converts to string again for display

### Pattern 2: localStorage Sidebar State (SSR-Safe)
**What:** Persist sidebar collapse state across sessions, avoid hydration mismatch
**When to use:** Any collapsible UI element state that should persist
**Example:**
```typescript
// Source: Josh W. Comeau's localStorage persistence guide
function CollapsibleSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Initialize from localStorage after mount (SSR-safe)
  useEffect(() => {
    const stored = localStorage.getItem('sidebar-collapsed')
    if (stored !== null) {
      setIsCollapsed(stored === 'true')
    }
    setMounted(true)
  }, [])

  // Sync changes to localStorage
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('sidebar-collapsed', String(isCollapsed))
    }
  }, [isCollapsed, mounted])

  const toggleCollapse = () => setIsCollapsed(!isCollapsed)

  // Don't apply collapse state until mounted to avoid hydration mismatch
  const collapsedClass = mounted && isCollapsed ? 'w-20' : 'w-64'

  return <aside className={collapsedClass}>...</aside>
}
```

**Why this pattern:**
- Two `useEffect` hooks: one reads on mount, one writes on changes
- `mounted` state prevents hydration mismatch (server renders expanded, client hydrates before applying stored state)
- Separate read/write effects avoid race conditions
- String conversion for boolean storage (localStorage stores strings only)

### Pattern 3: Framer Motion Sidebar Collapse Animation
**What:** Smooth width transition with content visibility orchestration
**When to use:** Animating sidebar collapse to icons-only view
**Example:**
```typescript
// Source: Framer Motion layout animation docs
import { motion } from 'framer-motion'

function AnimatedSidebar({ isCollapsed }: { isCollapsed: boolean }) {
  return (
    <motion.aside
      animate={{ width: isCollapsed ? 80 : 256 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="bg-white border-r"
    >
      <motion.div
        animate={{ opacity: isCollapsed ? 0 : 1 }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden whitespace-nowrap"
      >
        {/* Text content that fades out when collapsed */}
        <span>Menu Label</span>
      </motion.div>

      {/* Icon always visible */}
      <Icon />
    </motion.aside>
  )
}
```

**Why Framer Motion:**
- Hardware-accelerated transforms
- Orchestrate multiple properties (width + opacity) with different timings
- `layout` prop for automatic layout shift animations
- Bezier easing `[0.22, 1, 0.36, 1]` creates smooth deceleration

### Pattern 4: Tooltip for Collapsed Icons
**What:** Show label on hover when sidebar is collapsed to icons-only
**When to use:** Collapsed sidebar state, any icon-only UI
**Example:**
```typescript
// Using Tailwind CSS group hover pattern
<div className="group relative">
  <button className="w-12 h-12 flex items-center justify-center">
    <Icon className="w-5 h-5" />
  </button>

  {/* Tooltip - only show when parent is hovered */}
  <div className="
    absolute left-full ml-2 px-3 py-1.5 rounded-lg
    bg-slate-900 text-white text-sm whitespace-nowrap
    opacity-0 group-hover:opacity-100
    pointer-events-none
    transition-opacity duration-200
  ">
    Menu Label
  </div>
</div>
```

**Why this approach:**
- Pure CSS (no JS), lightweight
- `group` class enables child styling based on parent hover
- `pointer-events-none` prevents tooltip from interfering with interactions
- `whitespace-nowrap` keeps label on single line

### Anti-Patterns to Avoid
- **Calling toFixed() without parseFloat():** Results in strings with trailing zeros (90.20% vs 90.2%)
- **Reading localStorage in component body:** Causes hydration mismatch (server has no localStorage)
- **Animating width without overflow-hidden:** Text wraps during animation, looks janky
- **Storing objects directly in localStorage:** Must use JSON.stringify/parse, error-prone
- **Using inline styles for dynamic widths:** Prevents Tailwind tree-shaking, harder to maintain

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Number formatting with locale | Custom string manipulation | `toLocaleString('sv-SE')` with options | Handles thousands separators, currency symbols, locale rules |
| Debouncing localStorage writes | setTimeout wrapper | use-debounce (already installed) | Edge cases (unmounting, rapid changes) already handled |
| Animation orchestration | Custom setTimeout chains | Framer Motion variants | Declarative, cancellation-safe, hardware-accelerated |
| Tooltip positioning | Manual offset calculations | Tailwind absolute positioning patterns | Responsive, predictable, no JS needed |
| SSR-safe localStorage | Try-catch around localStorage | useEffect with mounted flag | Avoids hydration errors, cleaner pattern |

**Key insight:** Bug fixes touch established patterns (formatting, state, animations). Don't introduce new patterns or libraries for simple corrections. Use existing solutions (native APIs, Framer Motion, Tailwind patterns) that are already proven in the codebase.

## Common Pitfalls

### Pitfall 1: Hydration Mismatch from localStorage
**What goes wrong:** Reading localStorage in component body causes server/client HTML mismatch
**Why it happens:** Server renders without access to localStorage, client renders with stored value
**How to avoid:** Only read localStorage inside useEffect (runs client-side only), use mounted flag
**Warning signs:** Next.js hydration error in console, flashing content on first load

### Pitfall 2: Trailing Zeros in toFixed()
**What goes wrong:** `(0.9 * 100).toFixed(2)` returns "90.00", displays as "90.00%"
**Why it happens:** toFixed() always pads to specified decimal places, even with zeros
**How to avoid:** Wrap in parseFloat() to convert back to number: `parseFloat((0.9 * 100).toFixed(2))`
**Warning signs:** User reports see ".00" or ".0" unnecessarily, inconsistent with design spec

### Pitfall 3: Animation Jank from Width Changes
**What goes wrong:** Text wraps/jumps during sidebar width animation, looks broken
**Why it happens:** Content reflows as width changes without overflow handling
**How to avoid:** Use `overflow-hidden` and `whitespace-nowrap` on text content, fade out before width change
**Warning signs:** Text wraps to multiple lines mid-animation, horizontal scrollbar appears briefly

### Pitfall 4: Lost State After Page Refresh
**What goes wrong:** Sidebar resets to default state every refresh despite localStorage
**Why it happens:** Reading localStorage too early (before mounted) or not reading at all
**How to avoid:** Use useEffect to read stored value after mount, ensure key is consistent
**Warning signs:** State works during session but not after refresh, console shows "localStorage is not defined"

### Pitfall 5: Percentage Display Inconsistency
**What goes wrong:** Some percentages show "90%" others "90.0%" or "90.00%"
**Why it happens:** Different components use different formatting logic (toFixed(0) vs toFixed(2))
**How to avoid:** Create shared formatter utility, use consistently across all percentage displays
**Warning signs:** QA reports inconsistent decimal places, some values have trailing zeros

## Code Examples

Verified patterns from official sources:

### Shared Percentage Formatter Utility
```typescript
// Add to src/lib/utils.ts
// Source: Verified pattern from 30secondsofcode.org

/**
 * Format decimal as percentage with max precision, auto-trim trailing zeros
 * @param decimal - Value between 0 and 1 (e.g., 0.902 for 90.2%)
 * @param maxDecimals - Maximum decimal places (default: 2)
 * @returns Formatted string with % symbol (e.g., "90.2%")
 */
export function formatPercentage(decimal: number, maxDecimals = 2): string {
  const percentage = decimal * 100
  return `${parseFloat(percentage.toFixed(maxDecimals))}%`
}

// Usage examples:
// formatPercentage(0.9)      → "90%"
// formatPercentage(0.902)    → "90.2%"
// formatPercentage(0.9025)   → "90.25%"
// formatPercentage(0.90200)  → "90.2%"
```

### SSR-Safe Sidebar State Hook
```typescript
// Pattern for components/layout/admin-sidebar.tsx
// Source: Josh W. Comeau's localStorage guide + Next.js SSR patterns

import { useState, useEffect } from 'react'

function usePersistedSidebarState() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Read stored state after mount (SSR-safe)
  useEffect(() => {
    const stored = localStorage.getItem('kalkyla-sidebar-collapsed')
    if (stored !== null) {
      setIsCollapsed(stored === 'true')
    }
    setMounted(true)
  }, [])

  // Write to localStorage when state changes
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('kalkyla-sidebar-collapsed', String(isCollapsed))
    }
  }, [isCollapsed, mounted])

  const toggle = () => setIsCollapsed(prev => !prev)

  return { isCollapsed, toggle, mounted }
}

// Usage in component:
function AdminSidebar() {
  const { isCollapsed, toggle, mounted } = usePersistedSidebarState()

  // Apply collapse state only after mount to avoid hydration mismatch
  const sidebarWidth = mounted && isCollapsed ? 'w-20' : 'w-64'

  return (
    <aside className={sidebarWidth}>
      <button onClick={toggle}>Toggle</button>
      {/* ... */}
    </aside>
  )
}
```

### Framer Motion Sidebar Animation
```typescript
// Pattern for components/layout/admin-sidebar.tsx
// Source: Framer Motion docs, egghead.io sidebar tutorial

import { motion, AnimatePresence } from 'framer-motion'

function CollapsibleSidebar({ isCollapsed }: { isCollapsed: boolean }) {
  return (
    <motion.aside
      initial={false} // Don't animate on first render
      animate={{
        width: isCollapsed ? 80 : 256,
      }}
      transition={{
        duration: 0.3,
        ease: [0.22, 1, 0.36, 1], // Smooth deceleration curve
      }}
      className="fixed top-0 left-0 h-screen bg-white dark:bg-slate-900 border-r overflow-hidden"
    >
      {/* Menu items */}
      <nav className="p-4 space-y-2">
        {menuItems.map(item => (
          <div key={item.href} className="group relative">
            {/* Icon always visible */}
            <div className="w-12 h-12 flex items-center justify-center">
              <item.icon className="w-5 h-5" />
            </div>

            {/* Label with fade animation */}
            <motion.span
              animate={{
                opacity: isCollapsed ? 0 : 1,
                x: isCollapsed ? -10 : 0,
              }}
              transition={{ duration: 0.2 }}
              className="whitespace-nowrap overflow-hidden"
            >
              {item.label}
            </motion.span>

            {/* Tooltip for collapsed state */}
            {isCollapsed && (
              <div className="
                absolute left-full ml-2 px-3 py-1.5 rounded-lg
                bg-slate-900 text-white text-sm
                opacity-0 group-hover:opacity-100
                pointer-events-none transition-opacity
              ">
                {item.label}
              </div>
            )}
          </div>
        ))}
      </nav>
    </motion.aside>
  )
}
```

### Spotpris Breakdown Fix
```typescript
// Fix for components/calculations/breakdowns/spotpris-breakdown.tsx
// Source: Existing codebase pattern + formatPercentage utility

import { formatPercentage } from '@/lib/utils'

interface SpotprisBreakdownProps {
  capacityKwh: number
  cyclesPerDay: number
  efficiency: number       // 0.8 for 80%
  spreadOre: number        // ~100 ore = 1 SEK
  annualSavingsSek: number
}

export function SpotprisBreakdown({
  capacityKwh,
  cyclesPerDay,
  efficiency,
  spreadOre,
  annualSavingsSek,
}: SpotprisBreakdownProps) {
  // Calculate values
  const dailyKwh = capacityKwh * efficiency * cyclesPerDay
  const spreadSek = spreadOre / 100
  const dailySavings = dailyKwh * spreadSek

  // Format functions
  const formatSek = (n: number) => `${n.toFixed(2)} SEK` // Keep 2 decimals for currency
  const formatKwh = (n: number) => `${n.toFixed(2)} kWh` // Keep 2 decimals for energy

  return (
    <div className="space-y-2 font-mono text-xs">
      {/* Verkningsgrad as percentage */}
      <div className="flex justify-between">
        <span>Verkningsgrad</span>
        <span>{formatPercentage(efficiency)}</span> {/* FIX-01: Use utility */}
      </div>

      {/* Daglig energi with correct calculation */}
      <div className="flex justify-between">
        <span>Daglig energi</span>
        <span>{formatKwh(dailyKwh)}</span> {/* FIX-04: Show kWh */}
      </div>

      {/* Daglig besparing with correct calculation */}
      <div className="flex justify-between">
        <span>Daglig besparing</span>
        <span>{formatSek(dailySavings)}</span> {/* FIX-04: Show SEK */}
      </div>
    </div>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| toFixed() for percentages | parseFloat(toFixed()) | Standard since ES5 | Removes trailing zeros cleanly |
| useState only | useState + useEffect + localStorage | React 16.8+ (hooks) | Persistent state across sessions |
| CSS transitions | Framer Motion layout animations | 2020+ | Smoother, orchestrated animations |
| Inline localStorage reads | SSR-safe useEffect pattern | Next.js 9+ (SSR adoption) | Avoids hydration mismatches |
| Manual tooltip positioning | CSS group hover + Tailwind | Tailwind 2.0+ | No JS needed, responsive |

**Deprecated/outdated:**
- **class components with componentDidMount:** Use functional components with useEffect
- **Redux for sidebar state:** Overkill, localStorage + useState sufficient for UI state
- **jQuery animations:** Use Framer Motion or CSS transitions
- **window.localStorage without checks:** Always check typeof window !== 'undefined' or use useEffect

## Open Questions

Things that couldn't be fully resolved:

1. **Mobile sidebar behavior in collapsed state**
   - What we know: Current sidebar has mobile drawer pattern with overlay
   - What's unclear: Should collapse state apply on mobile, or always show full width in drawer?
   - Recommendation: Keep full width on mobile (drawer already handles space constraints), apply collapse only on desktop (lg: breakpoint and up)

2. **Badge counts in collapsed view**
   - What we know: User wants badge counts visible when collapsed (from CONTEXT.md)
   - What's unclear: Which menu items should have badges (no current badges in codebase)
   - Recommendation: Implement badge styling pattern but leave data props undefined until backend provides counts

3. **Trailing zero handling for kWh values**
   - What we know: User marked as "Claude's discretion"
   - What's unclear: Should energy values always show 2 decimals (12.50 kWh) or trim zeros (12.5 kWh)?
   - Recommendation: Keep 2 decimals for energy (12.50 kWh) - more professional for technical specs, different from percentage display

## Sources

### Primary (HIGH confidence)
- [Framer Motion layout animations](https://motion.dev/docs/react-layout-animations) - Official docs for width/height animations
- [MDN: Number.prototype.toFixed()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toFixed) - Native formatting method
- [30 seconds of code: Remove trailing zeros](https://www.30secondsofcode.org/js/s/remove-trailing-zeros/) - parseFloat pattern verification
- Existing codebase (package.json, admin-sidebar.tsx, theme-provider.tsx) - Current patterns and versions

### Secondary (MEDIUM confidence)
- [Josh W. Comeau: Persisting React State in localStorage](https://www.joshwcomeau.com/react/persisting-react-state-in-localstorage/) - SSR-safe pattern
- [CoreUI: How to persist state with localStorage in React](https://coreui.io/answers/how-to-persist-state-with-localstorage-in-react/) - Two-effect pattern explanation
- [DEV: Building a Collapsible Admin Sidebar with React Router](https://dev.to/cristiansifuentes/building-a-collapsible-admin-sidebar-with-react-router-uselocation-pro-patterns-7im) - Sidebar collapse patterns
- [egghead.io: Sliding Sidebar Menu with Framer Motion](https://egghead.io/blog/how-to-create-a-sliding-sidebar-menu-with-framer-motion) - Animation orchestration

### Tertiary (LOW confidence)
- [Medium: Mastering State Persistence with Local Storage in React](https://medium.com/@roman_j/mastering-state-persistence-with-local-storage-in-react-a-complete-guide-1cf3f56ab15c) - General patterns
- [Flowbite: Tailwind CSS Sidebar](https://flowbite.com/docs/components/sidebar/) - Component examples
- [CSS Script: Smooth Collapsible Sidebar Navigation](https://www.cssscript.com/smooth-collapsible-sidebar-navigation/) - CSS patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in use (package.json verified)
- Architecture: HIGH - Patterns verified in official docs and existing codebase
- Pitfalls: HIGH - Common Next.js/React SSR issues, well-documented

**Research date:** 2026-02-05
**Valid until:** 2026-03-05 (30 days) - Stable patterns, no fast-moving dependencies
