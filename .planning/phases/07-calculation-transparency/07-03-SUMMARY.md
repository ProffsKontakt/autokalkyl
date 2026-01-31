---
phase: 07-calculation-transparency
plan: 03
subsystem: admin-tools
tags: [overrides, zustand, state-management, inline-editing, ui-components]
requires:
  - 07-02 (Share types foundation)
provides:
  - Override database schema field
  - CalculationOverrides type definition
  - Wizard store override state and actions
  - OverridableValue inline-edit component
affects:
  - 07-04 (Will consume override infrastructure)
tech-stack:
  added: []
  patterns:
    - "Zustand store extension for override state"
    - "Inline editing pattern with hover icons"
    - "null-based override semantics (null = use calculated)"
key-files:
  created:
    - src/components/calculations/overridable-value.tsx
  modified:
    - prisma/schema.prisma
    - src/lib/share/types.ts
    - src/stores/calculation-wizard-store.ts
decisions:
  - id: ovrd-null-semantics
    what: "Use null to represent 'no override' rather than undefined"
    why: "Clearer intent, easier to serialize/persist, standard pattern"
    date: 2026-01-31
  - id: ovrd-inline-edit
    what: "Inline edit with hover icons instead of separate edit mode"
    why: "Lower friction, more intuitive UX, maintains context"
    date: 2026-01-31
metrics:
  duration: 130s
  tasks: 3
  commits: 3
  files_modified: 4
completed: 2026-01-31
---

# Phase 07 Plan 03: Override Infrastructure Summary

**One-liner:** Override schema, types, store state, and reusable inline-edit component for manual value adjustments

## What Was Built

Created the complete infrastructure for manual overrides of calculation values:

1. **Database Schema Extension**
   - Added `overrides Json?` field to Calculation model
   - Supports both savings overrides (spotpris, stodtjanster, effekt) and input overrides (cycles, peakShaving, etc.)
   - Null means no overrides applied

2. **Type Definitions**
   - Added `CalculationOverrides` interface to share types
   - Explicitly documented as admin-only (never exposed to public)
   - Supports 8 override fields (3 savings + 5 inputs)

3. **Wizard Store Extension**
   - Added `overrides` state object to wizard store
   - Implemented `setOverride(key, value)` for individual updates
   - Implemented `clearAllOverrides()` to reset all overrides
   - Implemented `hasAnyOverride()` helper to check if any are active
   - Included in localStorage persistence

4. **OverridableValue Component**
   - Inline-edit component with hover icons for edit/reset
   - Shows calculated value by default
   - Blue text with "raknat: X" when overridden
   - Enter to save, Escape to cancel
   - Number validation (>= 0)
   - Supports custom formatFn and suffix props
   - Full dark mode support

## Technical Implementation

**Override Semantics:**
- `null` = use calculated value
- `number` = use override value
- Missing field = same as null

**Store Pattern:**
```typescript
setOverride('spotprisSavingsSek', 125000) // Override to 125k SEK
setOverride('spotprisSavingsSek', null)   // Clear override
hasAnyOverride()                           // Check if any overrides active
```

**Component Usage:**
```tsx
<OverridableValue
  calculatedValue={12500}
  overrideValue={overrides.spotprisSavingsSek}
  onOverride={(v) => setOverride('spotprisSavingsSek', v)}
  suffix=" kr/år"
/>
```

## Deviations from Plan

None - plan executed exactly as written.

## Decisions Made

1. **Null-based override semantics**
   - Using `null` instead of `undefined` for "no override"
   - Rationale: Clearer intent, easier to serialize, matches JSON semantics
   - Impact: Consistent pattern across store and database

2. **Inline edit pattern**
   - Hover to reveal edit/reset icons
   - Click icon to enter edit mode
   - Rationale: Lower friction than separate edit mode, maintains context
   - Impact: Better UX for frequent adjustments

## Testing Notes

**Manual verification needed:**
- OverridableValue edit mode (click edit icon)
- Save on Enter, cancel on Escape
- Reset button clears override
- Blue text indicates override status
- Dark mode styling

**TypeScript verification:**
- All files compile without errors
- OverridableValue exports correctly
- Store actions type-safe

## Next Phase Readiness

**Blockers:** None

**Dependencies satisfied:**
- 07-02 established share types foundation ✓

**Ready for:**
- 07-04 can now integrate overrides into results display
- Schema change ready for `pnpm prisma db push` (required before 07-04)

**Important:** Run `pnpm prisma db push` before starting 07-04 to apply schema changes to database.

## Metrics

**Execution:**
- Duration: 130 seconds (2.2 minutes)
- Tasks: 3/3 completed
- Commits: 3 atomic commits
- Files: 1 created, 3 modified

**Code:**
- TypeScript: 116 lines (OverridableValue component)
- Store: +58 lines (override state and actions)
- Types: +24 lines (CalculationOverrides interface)
- Schema: +4 lines (overrides field)

## Session Context

**Execution pattern:** Fully autonomous (no checkpoints)

**Commits:**
- c65c3ba: feat(07-03): add override types and schema field
- 8212936: feat(07-03): extend wizard store with override state
- 7bad950: feat(07-03): create OverridableValue component

**Key learnings:**
- Inline edit pattern reduces friction for frequent adjustments
- Null semantics clearer than undefined for "no override"
- Hover icons maintain clean UI while providing discoverability
