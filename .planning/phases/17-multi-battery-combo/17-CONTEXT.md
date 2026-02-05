# Phase 17: Multi-Battery Combo - Context

**Gathered:** 2026-02-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Closer can configure multi-battery investments with accurate combined calculations (Komboinvestering) or side-by-side comparisons (Jämföra). This includes adding multiple batteries, toggling between modes, and displaying combined or comparative results. Single-battery calculations remain unchanged.

</domain>

<decisions>
## Implementation Decisions

### Mode Switching UX
- Toggle appears in battery step header (visible immediately when adding batteries)
- Default mode: Komboinvestering (combined investment is primary use case)
- Mode is a view toggle — closers can switch anytime, even after saving
- Public prospect view shows closer's chosen mode only (no toggle for prospects)

### Battery Addition Flow
- Both options: quantity selector for same model, plus "Add different battery" for mixed configs
- No limit on number of batteries (closers add as many as needed)
- Removing batteries: Claude's discretion on UX pattern

### Comparison Layout (Jämföra Mode)
- Stacked cards layout (each battery as a card, vertically stacked)
- Highlight differences: show metrics where batteries differ, collapse identical values
- No "winner" indicators — neutral presentation, let prospect/closer interpret
- Expandable/collapsible cards: Claude's discretion

### Combo Calculations Display (Komboinvestering Mode)
- Both views: combined summary at top, expandable breakdown per unit below
- Single combined ROI/payback only (no per-battery metrics in primary view)
- Grid services stacking display: Claude's discretion on per-unit breakdown vs multiplied total
- Total price handling: Claude's discretion (straightforward sum vs editable for package deals)

### Claude's Discretion
- Mixed models in Komboinvestering (same model only vs allow mixing)
- Battery removal UX pattern (X button vs quantity reduction)
- Card expand/collapse behavior in comparison mode
- Grid services display format (per-unit breakdown vs multiplied total)
- Total investment price editing for combo deals

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches matching existing wizard/results patterns.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 17-multi-battery-combo*
*Context gathered: 2026-02-05*
