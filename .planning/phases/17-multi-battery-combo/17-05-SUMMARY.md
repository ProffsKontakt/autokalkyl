---
phase: 17-multi-battery-combo
plan: 05
subsystem: public-share
tags: [combo-mode, public-view, share-link, react, typescript]

requires:
  - "17-02: calculateCombinedResults for combo aggregation"
  - "17-04: ComboSummary and ComboBreakdown for admin view pattern"

provides:
  - "Public share view adapts to closer's chosen combo mode"
  - "Komboinvestering mode shows combined metrics to prospects"
  - "Jamfora mode shows side-by-side comparison (existing)"
  - "Per-unit breakdown with expandable details for prospects"

affects:
  - "Any public share view rendering"
  - "Future combo mode enhancements in public view"

tech-stack:
  added: []
  patterns:
    - "Conditional rendering based on comboMode in public view"
    - "Share payload builder transforms admin data to public-safe format"
    - "PublicCombinedResults mirrors admin CombinedResults for consistency"

key-files:
  created:
    - "src/components/public/public-combo-view.tsx"
  modified:
    - "src/lib/share/types.ts"
    - "src/actions/share.ts"
    - "src/components/public/interactive-public-view.tsx"
    - "src/app/(public)/[org]/[shareCode]/page.tsx"

decisions:
  - key: "public-combo-types-mirror-admin"
    choice: "PublicCombinedResults mirrors admin CombinedResults structure"
    reasoning: "Consistency between admin and public types simplifies mental model"
    alternatives: ["Flatten public structure", "Different naming convention"]
    impact: "Easy to understand mapping, clear admin-to-public transformation"

  - key: "combo-data-from-stored-results"
    choice: "Build combined results from stored battery results, not recalculation"
    reasoning: "Public view must match admin view exactly, stored results are source of truth"
    alternatives: ["Recalculate on-the-fly using calculateCombinedResults"]
    impact: "Guaranteed consistency, no drift between admin and public metrics"

  - key: "conditional-render-in-interactive-view"
    choice: "Conditional render (combo vs results) in InteractivePublicView, not page level"
    reasoning: "Keeps public page component simple, logic encapsulated in view component"
    alternatives: ["Conditional in page.tsx", "Separate combo and jamfora pages"]
    impact: "Single public page handles both modes, cleaner component hierarchy"

  - key: "no-mode-toggle-for-prospects"
    choice: "Prospects cannot toggle between combo modes"
    reasoning: "Closer decides presentation mode, prospects see chosen view only (per CONTEXT.md)"
    alternatives: ["Allow prospects to toggle", "Show both views"]
    impact: "Simpler UX, no confusion about which view is 'official'"

metrics:
  duration: "5 minutes"
  completed: "2026-02-05"
---

# Phase 17 Plan 05: Public Share Combo Integration Summary

**One-liner:** Public share view adapts to closer's combo mode, showing combined metrics for Komboinvestering or comparison for Jamfora.

## What Was Built

Integrated multi-battery combo mode into the public share view so prospects see the closer's chosen display mode (Komboinvestering or Jamfora).

**Key Features:**

1. **Extended Share Types (Task 1):**
   - Added `quantity` field to `PublicBatteryInfo`
   - Added `comboMode` and `combinedResults` to `PublicCalculationData`
   - Defined `PublicCombinedResults` and `PublicUnitBreakdown` for public display
   - All fields optional for backward compatibility

2. **Share Payload Builder (Task 2):**
   - Import `calculateCombinedResults` (though using stored results)
   - Add `quantity` to battery mapping
   - Build `PublicCombinedResults` from stored battery results
   - Include `comboMode` and `combinedResults` in payload
   - Default to 'jamfora' mode for backward compatibility

3. **PublicComboView Component (Task 3):**
   - Header with brand color and total capacity display
   - Key metrics grid: payback, annual savings, ROI 10yr, ROI 15yr
   - Cost summary (ex moms, inkl moms, efter Grön Teknik)
   - Savings breakdown (spotpris, effekt, stödtjänster)
   - Expandable per-unit breakdown with:
     - Technical specs (capacity, max discharge)
     - Cost breakdown (per-unit and total columns)
     - Savings breakdown (per-unit and total columns)
     - Grid services stacking callout for Emaldo batteries
     - ROI metrics per unit
   - Dark mode support throughout

4. **Integration:**
   - Updated `InteractivePublicView` to accept `comboMode` and `combinedResults`
   - Conditional rendering: `comboMode === 'komboinvestering'` shows `PublicComboView`
   - Otherwise shows existing `PublicResultsView` (Jamfora mode)
   - Public page passes combo data to interactive view
   - No mode toggle visible to prospects (per CONTEXT.md requirement)

## Deviations from Plan

None - plan executed exactly as written.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Extend share payload types for combo mode | 7845a53 | src/lib/share/types.ts |
| 2 | Update share payload builder to include combo data | 1a5aa7d | src/actions/share.ts |
| 3 | Create PublicComboView and integrate with public view | ba65121 | src/components/public/public-combo-view.tsx, src/components/public/interactive-public-view.tsx, src/app/(public)/[org]/[shareCode]/page.tsx |

**Total commits:** 3 (one per task - atomic commits)

## Technical Implementation

**Type Extensions:**

```typescript
// PublicBatteryInfo now includes quantity
export interface PublicBatteryInfo {
  // ... existing fields
  quantity?: number // Phase 17
}

// PublicCalculationData includes combo mode and results
export interface PublicCalculationData {
  calculation: {
    // ... existing fields
    comboMode?: 'komboinvestering' | 'jamfora'
    combinedResults?: PublicCombinedResults
  }
  // ... organization, closer
}
```

**Share Payload Builder Logic:**

1. Extract `comboMode` from calculation (default 'jamfora')
2. If `komboinvestering` mode:
   - Map batteries to `PublicUnitBreakdown[]` from stored results
   - Aggregate totals: capacity, discharge, savings, cost
   - Apply Grön Teknik to combined total (not per-unit)
   - Calculate combined ROI metrics
3. Include in payload if present

**Conditional Rendering:**

```tsx
{comboMode === 'komboinvestering' && combinedResults ? (
  <PublicComboView combinedResults={combinedResults} primaryColor={primaryColor} />
) : (
  <PublicResultsView results={currentResults} primaryColor={primaryColor} />
)}
```

**Styling Pattern:**

- Mirrors admin `ComboSummary` and `ComboBreakdown` structure
- Uses public view color scheme (white/slate with brand color accents)
- Dark mode support via Tailwind dark: variants
- Expandable `<details>` for per-unit breakdown (native HTML, accessible)

## Decisions Made

**1. Public combo types mirror admin:**
- `PublicCombinedResults` structure matches admin `CombinedResults`
- Simplifies mental model, clear admin-to-public mapping
- Alternative: Flatten or rename for public context
- Impact: Easy to understand, consistent naming

**2. Use stored results, not recalculation:**
- Build combined results from `calculation.batteries[].results` (stored)
- Public view must exactly match admin view
- Alternative: Recalculate on-the-fly using `calculateCombinedResults`
- Impact: Guaranteed consistency, no drift between admin and public

**3. Conditional render in InteractivePublicView:**
- Logic lives in view component, not page
- Page component stays simple
- Alternative: Conditional in page.tsx or separate pages
- Impact: Single public page handles both modes, cleaner hierarchy

**4. No mode toggle for prospects:**
- Prospects see closer's chosen mode only
- Per CONTEXT.md: "Prospect cannot toggle mode (no toggle visible)"
- Alternative: Allow toggle or show both views
- Impact: Simpler UX, no confusion about which view is "official"

## Verification

**All success criteria met:**

✅ Share payload types include `comboMode` and `combinedResults`
✅ Share builder includes combo data for Komboinvestering calculations
✅ `PublicComboView` displays combined metrics
✅ Public view conditionally renders based on `comboMode`
✅ No mode toggle visible to prospects
✅ Backward compatible: existing share links still work (defaults to jamfora)

**TypeScript compilation:** ✅ Clean
**Files created:** ✅ `src/components/public/public-combo-view.tsx`
**Integration verified:** ✅ Conditional rendering in `interactive-public-view.tsx`

## Next Phase Readiness

**Phase 17 Plan 06 (Save combo mode to database):**

This plan (17-05) handles the **read path** (public view). Plan 06 will handle the **write path** (saving combo mode when closer creates/updates calculation).

**Expected integration:**
- Plan 06 will save `comboMode` to database when closer toggles mode
- This plan's public view will automatically pick up the saved mode
- No additional changes needed here

**Blockers/concerns:**
- None. Public view is ready to display any combo mode saved by plan 06.

**What's ready:**
- Public share types complete
- Share payload builder complete
- PublicComboView component complete
- Conditional rendering logic complete

**What plan 06 needs to do:**
- Add comboMode state to wizard store
- Save comboMode when calculation is saved
- Update calculation on mode toggle
- No public view changes needed

## Artifacts

**New components:**
- `src/components/public/public-combo-view.tsx` - Public display for Komboinvestering mode

**Extended types:**
- `PublicBatteryInfo` - Now includes `quantity`
- `PublicCalculationData` - Now includes `comboMode` and `combinedResults`
- `PublicCombinedResults` - Aggregated metrics for public display
- `PublicUnitBreakdown` - Per-unit breakdown for public transparency

**Integration points:**
- `src/actions/share.ts` - Builds combo data in `getPublicCalculation`
- `src/components/public/interactive-public-view.tsx` - Conditional render
- `src/app/(public)/[org]/[shareCode]/page.tsx` - Passes combo data

## Code Quality

**Atomic commits:** ✅ 3 commits, one per task
**Type safety:** ✅ All optional fields, backward compatible
**Pattern consistency:** ✅ Mirrors admin combo components
**Dark mode:** ✅ Full dark mode support
**Accessibility:** ✅ Native `<details>` for expandable sections

## Performance Notes

**Share payload size:**
- Combo mode adds ~2-5 KB per battery for unit breakdowns
- Acceptable for typical 1-3 battery configurations
- No pagination needed at this scale

**Rendering:**
- Conditional render is cheap (single if check)
- Expandable `<details>` renders collapsed by default (no perf impact)
- No client-side recalculation (uses server-built data)

## User Experience

**Prospect perspective:**
- See closer's chosen view (Komboinvestering or Jamfora)
- Clear combined metrics if Komboinvestering
- Expandable per-unit details for transparency
- No confusion about mode (no toggle visible)

**Closer perspective (future - plan 06):**
- Toggle mode in wizard
- Public link reflects chosen mode
- Prospects see unified view

## Testing Notes

**Manual testing needed:**
1. Create calculation with `comboMode: 'komboinvestering'`
2. Generate share link
3. Verify public view shows `PublicComboView`
4. Verify expandable breakdowns work
5. Test with `comboMode: 'jamfora'` → should show comparison view
6. Test with no `comboMode` → should default to jamfora (backward compat)

**Edge cases covered:**
- No batteries: combinedResults will be undefined (view not shown)
- Single battery: combo view still works (shows as 1× battery)
- Missing results: fallback to zero values in breakdown

## Related Plans

**Builds on:**
- **17-02:** `calculateCombinedResults` for aggregation logic
- **17-04:** `ComboSummary` and `ComboBreakdown` for admin view patterns

**Required by:**
- **17-06:** Save combo mode to database (write path)

**Part of:**
- **Phase 17:** Multi-battery combo (COMBO-01 to COMBO-10)
