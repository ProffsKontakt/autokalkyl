---
phase: 04-customer-experience
plan: 03
subsystem: public-view

dependency-graph:
  requires:
    - 04-01 (share actions and types)
  provides:
    - public-route-structure
    - public-view-components
    - branded-calculation-display
  affects:
    - future interactive simulator phase

tech-stack:
  added: []
  patterns:
    - public-route-group (bypass auth)
    - branded-component-theming (CSS custom properties)
    - responsive-data-visualization (Recharts)

key-files:
  created:
    - src/app/(public)/layout.tsx
    - src/app/(public)/[org]/[shareCode]/page.tsx
    - src/app/(public)/[org]/[shareCode]/loading.tsx
    - src/app/(public)/[org]/[shareCode]/not-found.tsx
    - src/components/public/public-header.tsx
    - src/components/public/public-greeting.tsx
    - src/components/public/public-footer.tsx
    - src/components/public/password-gate.tsx
    - src/components/public/public-battery-summary.tsx
    - src/components/public/public-results-view.tsx

decisions:
  - Public route group at (public) bypasses auth via existing middleware
  - CSS custom properties for org branding colors (--primary-color, --secondary-color)
  - Password-protected links use query param redirect pattern
  - Key metrics shown in priority order: payback, annual savings, 10yr ROI, 15yr ROI
  - Battery details in expandable section to reduce visual clutter

metrics:
  duration: 5 min
  completed: 2026-01-20

tags:
  - public-view
  - branded-display
  - recharts
  - responsive
---

# Phase 04 Plan 03: Public View Routes Summary

**One-liner:** Public route structure with branded view components for prospects to access shared calculations without authentication, featuring battery comparison, savings breakdown, and 15-year ROI timeline.

## What Was Built

### Public Route Structure
Created `(public)` route group that bypasses authentication:

1. **Layout** (`src/app/(public)/layout.tsx`) - Minimal layout without nav or auth context
2. **Page** (`src/app/(public)/[org]/[shareCode]/page.tsx`) - Dynamic route for shared calculations
3. **Loading** - Spinner with Swedish text while fetching
4. **Not-Found** - Friendly error page with contact guidance

### Public View Components

| Component | Purpose |
|-----------|---------|
| `PublicHeader` | Org logo/name, branding colors, "Batterikalkyl" label |
| `PublicGreeting` | Personalized message with {namn} and {closer} placeholders |
| `PublicBatterySummary` | Battery selector, specs, key metrics, pricing (no margin) |
| `PublicResultsView` | Savings pie chart, 15-year ROI timeline with break-even |
| `PublicFooter` | Closer contact, "Powered by Kalkyla.se" |
| `PasswordGate` | Password entry form for protected links |

### Key Features

**Branding:**
- CSS custom properties for org colors (--primary-color, --secondary-color)
- Org logo in header with fallback to text name
- Primary color accent on interactive elements

**Battery Display:**
- Battery selector tabs when multiple batteries
- Key metrics grid: payback, annual savings, 10yr/15yr ROI
- Expandable specs section (capacity, power, efficiency, warranty, cycles)
- Pricing with Gron Teknik deduction (no margin/cost price shown)

**Results Visualization:**
- Savings breakdown pie chart (spotpris, effekttariff, stodtjanster)
- Toggle between grouped and detailed breakdown
- 15-year ROI timeline with cumulative savings, investment line, net position
- Break-even reference line at payback year

**Password Protection:**
- Password gate form with clean UI
- Query param redirect pattern (/?pwd=...)
- Error display for wrong password

## Commits

| Hash | Type | Description |
|------|------|-------------|
| f5710b2 | feat | Public route structure with page, loading, not-found |
| 02b86f6 | feat | Public branding and interaction components |

## Files Created

- `src/app/(public)/layout.tsx` - Minimal public layout
- `src/app/(public)/[org]/[shareCode]/page.tsx` - Main public view page
- `src/app/(public)/[org]/[shareCode]/loading.tsx` - Loading spinner
- `src/app/(public)/[org]/[shareCode]/not-found.tsx` - Error page
- `src/components/public/public-header.tsx` - Branded header
- `src/components/public/public-greeting.tsx` - Personalized greeting
- `src/components/public/public-footer.tsx` - Footer with contact
- `src/components/public/password-gate.tsx` - Password form
- `src/components/public/public-battery-summary.tsx` - Battery display
- `src/components/public/public-results-view.tsx` - Charts and results

## Deviations from Plan

None - plan executed exactly as written.

## Testing Notes

Verification completed:
- `npx tsc --noEmit` - TypeScript valid (note: pre-existing issue in calculations.ts)
- `npm run build` - Build succeeds, route registered at /[org]/[shareCode]
- Grep for margin/costPrice/installerCut shows only comment about exclusion

## Next Phase Readiness

**Prerequisites for Interactive Simulator:**
- Public view displays calculation results correctly
- Battery comparison UI ready for interactive features
- Recharts integration complete for consumption chart
