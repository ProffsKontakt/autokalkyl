# Phase 13: Bug Fixes & Polish - Context

**Gathered:** 2026-02-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix display bugs and UI issues to make v1.2 release-ready. Specifically addresses FIX-01 (Spotpris efficiency display), FIX-02 (Super Admin sidebar), and FIX-04 (Spotpris breakdown values). No new features — purely correcting existing behavior.

</domain>

<decisions>
## Implementation Decisions

### Percentage Display Format
- 2 decimal places maximum, trim trailing zeros (90.2% not 90.20%)
- Same format applies to ALL percentages throughout the app (consistency)

### Admin Sidebar Behavior
- Expanded by default with collapse option (toggle to icons-only)
- Collapse state persists in localStorage across sessions
- Applies to all role-based sidebars (Super Admin, Org Admin, Closer)
- Collapsed view shows icons with badge counts where relevant
- Hover over collapsed icons shows tooltip with label
- Smooth animation for collapse/expand transitions
- No keyboard shortcut needed

### Spotpris Breakdown Values
- Three values shown: Verkningsgrad (%), Daglig energi (kWh), Daglig besparing (SEK)
- Swedish labels: "Verkningsgrad", "Daglig energi", "Daglig besparing"
- Energy format: 2 decimals (12.50 kWh)
- Currency format: 2 decimals (125.50 SEK)

### Claude's Discretion
- Implementation approach for shared percentage formatter (utility vs inline)
- Toggle UI design (chevron location, hamburger placement)
- Mobile responsive sidebar behavior
- Trailing zero handling for kWh values

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches within the decisions above.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 13-bug-fixes-polish*
*Context gathered: 2026-02-05*
