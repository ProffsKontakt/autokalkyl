---
phase: 06-calculation-engine
plan: 02
subsystem: calculation-engine
one-liner: "Interactive sliders for cycles/day, peak shaving, and zone-based stodtjanster income with toast warnings"
tags: [react, zustand, framer-motion, sonner, ui-components, calculations]
requires:
  - 06-01
provides:
  - "CyclesSlider: 0.5-3 range with warranty warnings"
  - "PeakShavingSlider: 0-100% with capacity constraints"
  - "StodtjansterInput: Emaldo zone-based income + post-campaign config"
  - "Wizard store: cyclesPerDay, peakShavingPercent, postCampaignRate state"
affects:
  - 06-03 # Results display will consume these state values
  - 06-04 # Summary cards will show configured parameters
tech-stack:
  added:
    - none # All dependencies existed from 06-01
  patterns:
    - "Direct Zustand state binding in components (no local state)"
    - "Framer Motion for value change animations"
    - "Toast notifications via Sonner for user warnings"
    - "useRef for one-time warning flag management"
key-files:
  created:
    - src/components/calculations/controls/cycles-slider.tsx
    - src/components/calculations/controls/peak-shaving-slider.tsx
    - src/components/calculations/controls/stodtjanster-input.tsx
    - src/components/calculations/controls/animated-value.tsx
  modified:
    - src/stores/calculation-wizard-store.ts
decisions:
  - id: DEC-06-02-01
    title: "No debounce on slider changes"
    choice: "Update Zustand state immediately on onChange"
    rationale: "Requirements explicitly state immediate updates, and Zustand is performant enough for direct state updates without debouncing"
  - id: DEC-06-02-02
    title: "useRef for warning toast flag"
    choice: "Use useRef instead of useState for hasShownWarning flag"
    rationale: "Prevents re-render when flag changes, only need to track state internally"
  - id: DEC-06-02-03
    title: "AnimatedValue as utility component"
    choice: "Created separate AnimatedValue component for reusability"
    rationale: "Pattern can be reused across multiple value displays in the calculation UI"
  - id: DEC-06-02-04
    title: "Expandable details in StodtjansterInput"
    choice: "Hide detailed breakdown behind expandable section"
    rationale: "Keep UI clean by default, power users can expand to see full calculation breakdown"
metrics:
  duration: "3min"
  completed: "2026-01-29"
---

# Phase 6 Plan 02: Slider Controls & Store Extension Summary

**One-liner:** Interactive sliders for cycles/day, peak shaving, and zone-based stodtjanster income with toast warnings

**Status:** Complete ✓
**Completed:** 2026-01-29
**Duration:** 3 minutes

## What Was Built

Extended the calculation wizard store and created three interactive slider control components with real-time feedback:

1. **Wizard Store Extension**
   - Added `cyclesPerDay` (default: 1), `peakShavingPercent` (default: 50), `postCampaignRate` (default: 500)
   - Added three update actions for direct state manipulation
   - All fields persist to localStorage via existing persist middleware

2. **CyclesSlider Component**
   - Range: 0.5-3.0 cycles/day, step 0.5
   - Animated value display using Framer Motion
   - Toast warning appears when value exceeds 2 (HIGH_CYCLES_WARNING_THRESHOLD)
   - Inline warning banner shows impact on battery warranty
   - Direct Zustand state binding with no local state

3. **PeakShavingSlider Component**
   - Range: 0-100%, step 10
   - Displays four calculated values: current peak, target reduction, actual reduction, new peak
   - Shows constraint message when battery cannot deliver target reduction
   - Uses `calculateActualPeakShaving()` from constraints module
   - Color-coded values (amber for constrained, green for achievable)

4. **StodtjansterInput Component**
   - **Emaldo mode:** Shows zone-based guaranteed income (SE1: 1110 kr/mån, SE4: 1370 kr/mån)
   - Displays campaign details: monthly, annual, 36-month total
   - Configurable post-campaign rate input (SEK/kW/year)
   - Expandable details section with full projection breakdown over N years
   - **Non-Emaldo mode:** Simple manual entry field

5. **AnimatedValue Utility**
   - Reusable component for animating value changes
   - Configurable formatter, label, and highlight color
   - Provides consistent animation pattern across UI

## Requirements Mapping

| Requirement | Delivery | Evidence |
|------------|----------|----------|
| SPOT-02: Cycles/day slider (0.5-3, step 0.5) | ✓ Complete | CyclesSlider with exact range/step |
| SPOT-03: High cycles warning | ✓ Complete | Toast at > 2 + inline warning banner |
| PEAK-01: Peak shaving slider | ✓ Complete | PeakShavingSlider 0-100%, step 10 |
| PEAK-02: Respect battery capacity | ✓ Complete | Uses calculateActualPeakShaving() |
| GRID-01: Emaldo guaranteed income (SE1-SE4) | ✓ Complete | StodtjansterInput shows zone rates |
| GRID-02: 36-month campaign | ✓ Complete | Displays monthly/annual/total breakdown |
| GRID-03: Post-campaign config | ✓ Complete | Input field with SEK/kW/year |

## Technical Implementation

### State Architecture
```typescript
// Wizard store additions
interface WizardState {
  cyclesPerDay: number           // default: 1 (from DEFAULT_CYCLES_PER_DAY)
  peakShavingPercent: number     // default: 50
  postCampaignRate: number       // default: 500 (from DEFAULT_POST_CAMPAIGN_RATE)

  updateCyclesPerDay: (cycles: number) => void
  updatePeakShavingPercent: (percent: number) => void
  updatePostCampaignRate: (rate: number) => void
}
```

### Component Patterns
- **Direct state binding:** All sliders use `useCalculationWizardStore` directly, no local state
- **Immediate updates:** No debouncing, state updates on onChange event
- **Animation on change:** Framer Motion scales/colors values when they change
- **Constraint feedback:** Peak shaving shows detailed breakdown when constrained
- **Toast notifications:** One-time warnings via Sonner (useRef flag prevents spam)

### File Structure
```
src/components/calculations/controls/
├── cycles-slider.tsx          # SPOT-02, SPOT-03
├── peak-shaving-slider.tsx    # PEAK-01, PEAK-02
├── stodtjanster-input.tsx     # GRID-01, GRID-02, GRID-03
└── animated-value.tsx         # Utility for value animations
```

## Commits

| Commit | Message | Files |
|--------|---------|-------|
| 33851e4 | feat(06-02): extend wizard store with calculation controls | calculation-wizard-store.ts |
| 27d2111 | feat(06-02): create slider control components | cycles-slider.tsx, peak-shaving-slider.tsx, animated-value.tsx |
| be86bf9 | feat(06-02): create stodtjanster input component | stodtjanster-input.tsx |

## Decisions Made

**DEC-06-02-01: No debounce on slider changes**
- **Choice:** Update Zustand state immediately on onChange
- **Rationale:** Requirements explicitly state immediate updates, and Zustand is performant enough for direct state updates without debouncing
- **Impact:** Smooth real-time feedback as user drags sliders

**DEC-06-02-02: useRef for warning toast flag**
- **Choice:** Use useRef instead of useState for hasShownWarning flag
- **Rationale:** Prevents re-render when flag changes, only need to track state internally
- **Impact:** More efficient - avoids unnecessary component re-renders

**DEC-06-02-03: AnimatedValue as utility component**
- **Choice:** Created separate AnimatedValue component for reusability
- **Rationale:** Pattern can be reused across multiple value displays in the calculation UI
- **Impact:** Consistent animations, easier maintenance

**DEC-06-02-04: Expandable details in StodtjansterInput**
- **Choice:** Hide detailed breakdown behind expandable section
- **Rationale:** Keep UI clean by default, power users can expand to see full calculation breakdown
- **Impact:** Better UX - doesn't overwhelm users with numbers upfront

## Deviations from Plan

None - plan executed exactly as written.

## Integration Points

### Consumed By
- **06-03 (Results Display):** Will read cyclesPerDay, peakShavingPercent, postCampaignRate from store
- **06-04 (Summary Cards):** Will display configured parameters in summary view

### Depends On
- **06-01:** Uses constants (HIGH_CYCLES_WARNING_THRESHOLD, EMALDO_STODTJANSTER_RATES, etc.)
- **06-01:** Uses constraint functions (calculateActualPeakShaving)
- **06-01:** Uses Sonner toast notifications

### External Dependencies
- **Framer Motion:** For value change animations
- **Zustand:** For state management
- **Sonner:** For toast notifications (installed in 06-01)

## Testing Notes

### Manual Testing Checklist
- [ ] CyclesSlider: Move slider, value animates and updates immediately
- [ ] CyclesSlider: Set value > 2, toast appears once (not on every change)
- [ ] CyclesSlider: Inline warning banner appears when > 2
- [ ] PeakShavingSlider: Move slider, calculation breakdowns update
- [ ] PeakShavingSlider: Set high %, constraint message appears if battery can't deliver
- [ ] StodtjansterInput (Emaldo): Shows correct zone rate for selected elomrade
- [ ] StodtjansterInput (Emaldo): Expandable details show full 10-year projection
- [ ] StodtjansterInput (Non-Emaldo): Shows simple input field
- [ ] State persistence: Refresh page, slider values remain

### TypeScript Verification
```bash
pnpm tsc --noEmit  # Passed ✓
```

## Next Phase Readiness

**Ready for 06-03 (Results Display)**
- Store has all calculation parameters needed for results
- Components are fully typed and compile without errors
- No blockers identified

**Future Considerations:**
- Consider adding undo/reset button to restore defaults
- May want to add tooltips explaining what each slider affects
- Could add visual preview of cycles over time (calendar heatmap)

## Production Readiness

**Status:** Not production-ready (UI components only)

**Still needed:**
- Integration with wizard flow (render these components in wizard steps)
- Validation (ensure values are reasonable before allowing calculation)
- Error boundaries around components
- Unit tests for store actions
- Integration tests for slider interactions

**Known limitations:**
- No validation on postCampaignRate input (can enter negative or unrealistic values)
- Toast warning can be dismissed permanently in session (might want persistence)
- StodtjansterInput assumes totalYears=10, should be configurable system-wide

## References

**Related Plans:**
- 06-01-SUMMARY.md: Calculation formulas and constants foundation

**Key Files:**
- src/stores/calculation-wizard-store.ts: State management
- src/lib/calculations/constants.ts: Business constants
- src/lib/calculations/constraints.ts: Capacity constraint logic

**Documentation:**
- .planning/phases/06-calculation-engine/06-CONTEXT.md: Phase requirements
- .planning/phases/06-calculation-engine/06-RESEARCH.md: Technical research
