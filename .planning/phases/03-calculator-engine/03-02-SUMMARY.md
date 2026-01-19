---
phase: 03-calculator-engine
plan: 02
subsystem: wizard-state
tags: [zustand, auto-save, server-actions, state-management]

dependency-graph:
  requires: [03-01]
  provides: [wizard-store, calculation-crud, auto-save]
  affects: [03-03, 03-04, 03-05]

tech-stack:
  added: [zustand, use-debounce]
  patterns: [zustand-persist, debounced-auto-save, tenant-scoping]

key-files:
  created:
    - src/stores/calculation-wizard-store.ts
    - src/actions/calculations.ts
    - src/hooks/use-auto-save.ts
  modified:
    - src/lib/db/tenant-client.ts
    - package.json

decisions:
  - id: zustand-persist
    choice: "localStorage persistence via Zustand persist middleware"
    reason: "Preserves wizard state across browser refresh without server round-trips"
  - id: state-hash-dedup
    choice: "JSON hash comparison to prevent duplicate saves"
    reason: "Avoids unnecessary server calls when state unchanged"
  - id: battery-sync-strategy
    choice: "Delete-and-recreate for battery list sync"
    reason: "Simpler than diff-based update, acceptable for small lists"

metrics:
  duration: 6 min
  completed: 2026-01-19
---

# Phase 3 Plan 2: Wizard State Management Summary

Zustand store with localStorage persistence and 2-second debounced auto-save to server via CRUD actions.

## What Was Built

### Zustand Wizard Store (`src/stores/calculation-wizard-store.ts`)
- Complete wizard state: customer info, consumption profile, battery selections
- localStorage persistence via persist middleware (key: `kalkyla-wizard-draft`)
- Actions for all state mutations (updateCustomerInfo, updateConsumptionHour, etc.)
- Preset application and profile scaling support
- Server data loading and reset functionality

### Server Actions (`src/actions/calculations.ts`)
- `saveDraft` - Create/update calculation drafts with battery sync
- `getCalculation` - Retrieve with natagare and battery details
- `listCalculations` - Role-based listing (Closer: own, Org Admin: org, Super Admin: all)
- `finalizeCalculation` - Mark complete with results JSON
- `deleteCalculation` - Soft delete via ARCHIVED status

### Auto-Save Hook (`src/hooks/use-auto-save.ts`)
- 2-second debounce via use-debounce
- State hash comparison prevents duplicate saves
- Skips save when required fields missing
- Flushes pending save on unmount
- Returns lastSavedAt, isSaving, saveNow for UI feedback

### Tenant Client Extension (`src/lib/db/tenant-client.ts`)
- Added calculation model scoping
- findUnique with post-query ownership verification
- update/delete with pre-query ownership check

## Verification Results

| Check | Result |
|-------|--------|
| npm ls zustand use-debounce | Both installed |
| npx tsc --noEmit | No errors |
| Store exports useCalculationWizardStore | Yes |
| Actions export all CRUD functions | Yes (5 functions) |
| Auto-save debounces at 2 seconds | Yes |

## Deviations from Plan

### Prerequisite Dependency (Rule 3 - Blocking)

**Found during:** Plan initialization
**Issue:** Plan 03-02 imports from `@/lib/calculations/types`, `presets`, and `constants` which didn't exist (03-01 prerequisite not executed)
**Fix:** Executed 03-01 tasks as prerequisite (schema, permissions already existed; created types, constants, presets, elomrade-lookup, formulas, engine)
**Files created:** 6 files in src/lib/calculations/
**Commits:** 8ad62f8, 9de39c7

## Key Patterns Established

### Zustand Persist Pattern
```typescript
export const useStore = create<State>()(
  persist(
    (set, get) => ({ /* state and actions */ }),
    {
      name: 'storage-key',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ /* persisted fields */ }),
    }
  )
)
```

### Debounced Auto-Save Pattern
```typescript
const debouncedSave = useDebouncedCallback(performSave, 2000)
useEffect(() => {
  if (isFirstRender.current) { isFirstRender.current = false; return }
  debouncedSave()
}, [dependencies])
useEffect(() => () => debouncedSave.flush(), [debouncedSave])
```

## Next Phase Readiness

**Ready for 03-03 (Wizard UI):**
- Zustand store provides all state management
- Server actions handle persistence
- Auto-save hook ready for integration
- UI components can subscribe to store and get automatic persistence

**Dependencies satisfied:**
- Types and constants from 03-01
- Calculation schema with tenant scoping
- RBAC permissions for calculations
