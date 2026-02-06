---
phase: quick-002
plan: 002
subsystem: ui
tags: [emaldo, grid-services, stodtjanster, calculation-inputs, zustand]

# Dependency graph
requires:
  - phase: 17-02
    provides: Grid services stacking calculation per physical unit
provides:
  - User-customizable Emaldo guaranteed monthly rate (overrides zone defaults)
  - More accurate "Garanterad stödtjänstersättning" terminology
affects: [calculation-results, public-view, combo-calculations]

# Tech tracking
tech-stack:
  added: []
  patterns: [Optional state override pattern with null = use default]

key-files:
  created: []
  modified:
    - src/components/calculations/controls/stodtjanster-input.tsx
    - src/components/calculations/breakdowns/stodtjanster-breakdown.tsx
    - src/stores/calculation-wizard-store.ts
    - src/lib/calculations/engine.ts
    - src/lib/calculations/types.ts
    - src/components/calculations/wizard/steps/results-step.tsx

key-decisions:
  - "Override value null means use default zone rate (no need for separate isOverridden flag)"
  - "Inline editing mode in same component (no modal required)"
  - "Override persists in wizard state during calculation session only"
  - "Reset button clears override back to null, not to default value"

patterns-established:
  - "Override pattern: state holds `value | null`, null = use system default, UI shows 'Anpassad' badge when overridden"

# Metrics
duration: 2min
completed: 2026-02-06
---

# Quick Task 002: Emaldo Grid Services Terminology and Customization

**Renamed Emaldo 'garanterad intäkt' to 'garanterad stödtjänstersättning' for accuracy, and added user override for guaranteed monthly rate per calculation**

## Performance

- **Duration:** 2 min 27 sec
- **Started:** 2026-02-06T08:28:36Z
- **Completed:** 2026-02-06T08:31:03Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- More accurate terminology: "stödtjänstersättning" clarifies income comes from grid/frequency balancing services
- Users can customize Emaldo guaranteed monthly rate per calculation (defaults to zone-based rates)
- Override value stored in wizard state with persistence during calculation session
- Combined calculations automatically use override when provided

## Task Commits

Each task was committed atomically:

1. **Task 1: Rename "Garanterad intäkt" to "Garanterad stödtjänstersättning"** - `f16a041` (feat)
2. **Task 2: Add customizable guaranteed payout rate to calculator** - `6fba304` (feat)

## Files Created/Modified
- `src/components/calculations/controls/stodtjanster-input.tsx` - Renamed label, added inline edit UI with Justera/Spara/Återställ buttons
- `src/components/calculations/breakdowns/stodtjanster-breakdown.tsx` - Renamed label (ASCII-safe encoding)
- `src/stores/calculation-wizard-store.ts` - Added emaldoGuaranteedMonthlyOverride state and action
- `src/lib/calculations/types.ts` - Added emaldoGuaranteedMonthlyOverride to CalculationInputs
- `src/lib/calculations/engine.ts` - Check override before using zone-based rate
- `src/components/calculations/wizard/steps/results-step.tsx` - Pass override through to calculation engine

## Decisions Made

**Override pattern with null = default:**
- State holds `number | null`, where null means "use zone default rate"
- Cleaner than separate boolean flag + value
- Reset button sets to null, not to current default (allows zone changes to propagate)

**Inline editing UI:**
- No modal required - edit mode shown inline in same green box
- "Justera" link triggers edit mode, "Spara" applies, "Återställ" clears to null
- Yellow "Anpassad" badge indicates when custom rate is active

**Session-only persistence:**
- Override persists in wizard store during calculation session
- Cleared on reset (not saved to database calculation record)
- Per-calculation override, not per-user or per-organization setting

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Feature complete and ready for user testing
- Grid services stacking (quantity × rate) already working from Phase 17-02
- Combined calculations correctly aggregate custom rates across multiple batteries

---
*Phase: quick-002*
*Completed: 2026-02-06*
