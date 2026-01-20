---
phase: 04-customer-experience
plan: 04
subsystem: interactive-simulator

dependency-graph:
  requires:
    - 04-02 (share UI components)
    - 04-03 (public view routes)
  provides:
    - public-consumption-simulator
    - sticky-results-bar
    - mobile-battery-carousel
    - variant-tracking
  affects:
    - future analytics/reporting on prospect behavior

tech-stack:
  added: []
  patterns:
    - click-to-edit-chart (modal input for precise values)
    - on-demand-recalculation (button-triggered, not live)
    - sticky-bar-pattern (scroll-triggered visibility)
    - swipe-carousel (touch gestures for mobile)

key-files:
  created:
    - src/components/public/public-consumption-simulator.tsx
    - src/components/public/variant-indicator.tsx
    - src/components/public/sticky-results-bar.tsx
    - src/components/public/mobile-battery-carousel.tsx
    - src/components/public/interactive-public-view.tsx
  modified:
    - src/app/(public)/[org]/[shareCode]/page.tsx
    - src/actions/share.ts
    - src/app/globals.css

decisions:
  - Click-to-edit bars with modal input (better precision than dragging)
  - On-demand recalculation via 'Uppdatera' button (not instant/live)
  - Changed hours highlighted in orange for clear visual feedback
  - Sticky bar appears after 400px scroll threshold
  - Mobile carousel uses snap-x for native scroll behavior
  - Variant saved to database for tracking prospect experiments

metrics:
  duration: 4 min
  completed: 2026-01-20

tags:
  - interactive-ui
  - recharts
  - mobile-ux
  - variant-tracking
---

# Phase 04 Plan 04: Interactive Simulator Summary

**One-liner:** Interactive consumption simulator for prospects with click-to-edit bar chart, on-demand recalculation, variant tracking, sticky results bar, and mobile-optimized carousel for battery selection.

## What Was Built

### PublicConsumptionSimulator Component

Full interactive consumption editor for prospects:
- **12x24 hourly bar chart** using Recharts
- **Click-to-edit** - clicking a bar opens modal for precise value input
- **Month tabs** - horizontally scrollable with brand color highlight
- **Change tracking** - modified hours highlighted in orange
- **"Uppdatera" button** - triggers recalculation only when changes exist
- **Annual kWh display** - shows delta from original

### VariantIndicator Component

Visual indicator when prospect makes changes:
- Shows count of changed hours
- "Visa ursprunglig" button to reset to original
- Amber color scheme for attention

### StickyResultsBar Component

Floating metrics bar for quick reference while scrolling:
- Appears after scrolling 400px
- Shows payback time and annual savings
- "Kontakta mig" CTA button
- Smooth slide-up/down transition

### MobileBatteryCarousel Component

Swipeable battery selector for mobile:
- Snap scrolling with CSS snap-x
- Touch gesture handling for swipe left/right
- Dot indicators for position
- Selected battery highlighted with brand color border
- Hidden on desktop (lg:hidden)

### InteractivePublicView Wrapper

Client component orchestrating all interactive pieces:
- Manages results state across components
- Handles battery selection state
- Saves variants via server action (fire-and-forget)
- Passes quarterly prices for recalculation

### Integration Updates

**Public page** now fetches quarterly prices and uses InteractivePublicView
**share.ts** adds saveVariant action for persisting prospect modifications

## Key Implementation Details

### Recalculation Flow

1. Prospect clicks bar -> modal opens with current value
2. Prospect enters new value -> profile state updates, isDirty = true
3. Changed bar turns orange (visual feedback)
4. Prospect clicks "Uppdatera" -> calculateBatteryROI runs
5. Results update locally -> onResultsChange callback fires
6. Variant saved to CalculationVariant table

### Mobile Optimizations

- `.scrollbar-hide` CSS class hides scrollbar while allowing scroll
- Month tabs use `overflow-x-auto` with `min-w-max` for proper sizing
- Battery carousel uses `snap-x snap-mandatory` for native snap scroll
- Touch event handlers for swipe detection (50px threshold)

### CSS Additions

```css
.scrollbar-hide { ... }  /* Hide scrollbar, allow scroll */
.animate-fade-in { ... } /* 0.15s fade animation */
.animate-slide-up { ... } /* 0.2s slide animation */
```

## Commits

| Hash | Type | Description |
|------|------|-------------|
| 0f306bb | feat | Public consumption simulator with click-to-edit bars |
| 06b8999 | feat | Sticky results bar and mobile optimizations |
| 7b63fef | feat | Integration into public view with variant saving |

## Files Changed

### Created
- `src/components/public/public-consumption-simulator.tsx`
- `src/components/public/variant-indicator.tsx`
- `src/components/public/sticky-results-bar.tsx`
- `src/components/public/mobile-battery-carousel.tsx`
- `src/components/public/interactive-public-view.tsx`

### Modified
- `src/app/(public)/[org]/[shareCode]/page.tsx` (InteractivePublicView integration)
- `src/actions/share.ts` (saveVariant action)
- `src/app/globals.css` (scrollbar-hide, animation utilities)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Recharts Tooltip formatter type error**
- **Found during:** Task 1 verification
- **Issue:** Tooltip formatter expected `number | undefined`, not `number`
- **Fix:** Used `Number(value)` conversion pattern
- **Files modified:** public-consumption-simulator.tsx
- **Commit:** 0f306bb

**2. [Rule 1 - Bug] Prisma JSON type incompatibility**
- **Found during:** Task 3 verification
- **Issue:** `Record<string, unknown>` not assignable to Prisma InputJsonValue
- **Fix:** Used `JSON.parse(JSON.stringify(results))` for clean JSON conversion
- **Files modified:** share.ts
- **Commit:** 7b63fef

## Testing Notes

Verification completed:
- `npx tsc --noEmit` - No TypeScript errors
- `npm run build` - Build succeeds
- All components properly integrated

## Success Criteria Verification

- [x] Click-to-edit bars work with modal input
- [x] "Uppdatera" button triggers recalculation
- [x] Changed hours highlighted in orange
- [x] VariantIndicator shows change count
- [x] "Visa ursprunglig" button resets everything
- [x] Annual kWh updates with changes
- [x] Results update after recalculation
- [x] Variant saved to database
- [x] Sticky bar appears after scrolling past threshold
- [x] Mobile battery carousel swipeable
- [x] Month tabs horizontally scrollable on mobile
- [x] All animations smooth (fade-in, slide-up)

## Phase 4 Complete

This was the final plan in Phase 4 (Customer Experience). All plans completed:
- 04-01: Share Infrastructure
- 04-02: Share UI Components
- 04-03: Public View Routes
- 04-04: Interactive Simulator

Phase 4 delivers:
- Complete public view for shared calculations
- Interactive consumption simulation
- Mobile-optimized experience
- Variant tracking for prospect experiments
