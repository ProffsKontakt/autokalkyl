# Phase 4: Customer Experience - Context

**Gathered:** 2026-01-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Shareable public view where prospects can view branded, interactive ROI calculations via links. Prospects can adjust consumption and see results update live, but cannot change battery, pricing, or natagare. Share links use branded subdomains with random unguessable codes.

</domain>

<decisions>
## Implementation Decisions

### Public view layout
- Header with org logo, org colors as accents throughout
- Information hierarchy: payback time first, then savings, then battery comparison
- Battery comparison: Prospect can switch which battery is "primary" to see different payback calculations
- Pricing shown: Product cost + itemized "extra artiklar" (cables, etc.) — NO margin, installation cost, or internal pricing
- Savings display: Grouped view by default, expandable to full breakdown (spotpris, effekttariff, grid services, Grön Teknik)
- Full detailed battery specs shown (capacity, power, warranty, efficiency, DoD, cycle life)
- Prominent cumulative savings chart showing year 0-15 with payback intersection lines
- Footer: Closer's phone number + "Powered by Kalkyla.se"
- PDF download and browser print available for customer view

### Personalized greeting
- Customizable message per calculation
- Default Swedish: "Hej [namn], Mitt namn är Kalle, jag är en AI som är specialtränad på el och batterimarknaden. Här är din batterikalkyl som du och [closer namn] har pratat om. Om du behöver någon hjälp eller dylikt, finns jag nere i chattrutan till höger."
- Note: The AI chatbot integration is deferred to a future phase

### Interactive simulator
- Same 12x24 click-to-edit bar chart as Closer uses
- On-demand recalculation via "Uppdatera" button (not instant/live)
- Prospect adjustments create a variant linked to original calculation
- Variant shows what the prospect changed vs original
- "Visa ursprunglig kalkyl" button to reset to Closer's original

### Share link behavior
- Branded subdomain format: [org-slug].kalkyla.se/[random-string]
- Random string is fully random/unguessable (not sequential)
- Configurable expiry set by Closer
- Both deactivate and regenerate options available
- Full view history logged (each view with timestamp and browser info)
- Expired/deactivated links show error with Closer's contact info
- View notifications: Configurable per Closer (none, first view, every view)
- One share link per calculation (regenerating replaces it)
- Optional password protection
- Share button available in both calculation page and list view
- Share modal as animated overlay that dismisses on outside click

### Mobile experience
- Consumption chart: Swipeable hours within each month
- Scrollable vertical flow: Återbetalningstid → Avkastning 5 år → Avkastning 10 år → details
- Interactive charts with touch/tap for values
- Sticky floating bar showing payback time and savings while scrolling
- Battery comparison: Swipeable carousel (one battery at a time)
- Collapsing header: Shrinks to compact bar on scroll
- Footer at bottom of page with floating action button for contact
- Same PDF as desktop (no mobile-specific version)

### Claude's Discretion
- Exact animation and transition timing for share modal
- Specific chart library configuration for touch interactions
- View history storage schema
- Password hashing approach for protected links
- Exact sticky bar height and transition behavior

</decisions>

<specifics>
## Specific Ideas

- "I like how Twitter shows the new posts indicator" — apply similar pattern for showing what changed in variant vs original
- Charts should show vertical intersection lines at key points (payback, etc.)
- Mobile should be "mentally digestible" — clean, not packed with information
- Standard language is Swedish throughout the entire application

</specifics>

<deferred>
## Deferred Ideas

- AI chatbot per company/customer — trained on company info, electricity market knowledge, projections. This is a significant new capability requiring its own phase.
- Inflation-adjusted ROI calculation ("Inflationsjusterad avkastning") — requires calculation engine enhancement, capture in backlog for Phase 3 extension or future milestone.

</deferred>

---

*Phase: 04-customer-experience*
*Context gathered: 2026-01-20*
