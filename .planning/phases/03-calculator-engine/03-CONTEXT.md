# Phase 3: Calculator Engine - Context

**Gathered:** 2026-01-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Closers can build complete battery ROI calculations with accurate Swedish market logic. This includes customer info input, 12x24 consumption profile editing, battery selection with pricing, and calculation of all savings/ROI metrics. Closers can compare multiple batteries side-by-side. The shareable public view is Phase 4.

</domain>

<decisions>
## Implementation Decisions

### Consumption Simulator
- **Visualization:** Stacked chart showing daily consumption pattern
- **Editing:** Draggable chart elements (bars/points) AND input fields for precision
- **Granularity:** Full 24 hours individually editable (not time blocks)
- **Months:** Monthly tabs with ability to copy patterns between months
- **Presets:** Usage pattern templates (Electric heating, Heat pump, EV charging, Solar prosumer)
- **Annual scaling:** Closer enters annual kWh, profile shape auto-scales to match total
- **Mobile:** Full mobile support required - touch-friendly controls, responsive layout

### Calculation Workflow
- **Structure:** Multi-step wizard (Customer info → Consumption → Battery → Results)
- **Navigation:** Sequential only - must complete each step before proceeding, can go back
- **Saving:** Auto-save drafts every ~2 seconds as Closer progresses
- **Drafts:** Can leave and resume later, marked as draft until finalized

### Results Display
- **Layout:** Summary cards + detailed table + visual dashboard (all three)
- **Essential charts:** ROI timeline (cumulative savings over 15 years) AND savings breakdown (spotpris, effect tariff, grid services, Gron Teknik)
- **Margin visibility:** Closer can see their commission, NOT total org/ProffsKontakt profit
- **Export:** PDF export AND print-friendly view both available
- **Battery comparison:** Side-by-side comparison of 2-4 batteries, Closer selects which to include
- **Comparison flexibility:** Each battery can have different consumption assumptions

### Input Defaults
- **Starting state:** Smart defaults (pre-fill typical values)
- **Customization:** Org Admin sets default battery, natagare, consumption for their Closers
- **Consumption presets:** Super Admin creates system presets, Org Admin can add custom org presets
- **Elomrade:** Auto-detected from customer postal code

### Claude's Discretion
- Copy pattern functionality between months (quick copy vs select targets)
- Validation timing and UX (prioritize speed)
- Results layout organization (vertical sections vs tabs)
- Loading states and error handling
- Exact chart library and implementation

</decisions>

<specifics>
## Specific Ideas

- Consumption profile shape scales to match annual kWh total - user edits shape, total stays fixed
- Closer can see commission info but not total billable amounts (e.g., 30,000kr profit hidden)
- Battery comparison should let Closer toggle which batteries to show in customer view
- Speed is priority - auto-save frequently, validation should not slow down the user

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-calculator-engine*
*Context gathered: 2026-01-19*
