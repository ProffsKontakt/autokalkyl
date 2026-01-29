# Phase 6: Calculation Engine - Context

**Gathered:** 2026-01-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix calculation formulas and add control sliders for spotpris, stödtjänster, and effektavgifter savings. Salesperson can configure cycles/day, peak shaving level, and post-campaign income — calculations update instantly.

</domain>

<decisions>
## Implementation Decisions

### Slider Behavior
- **Cycles/day slider:** Range 0.5-3, step 0.5, default 1.2 (configurable per org)
- **Peak shaving:** Two controls work in unison — % of peak AND kW cap. Actual shave = `min(peak × %, battery capacity)`
- **Step increments:** Coarse — 0.5 for cycles, 10% for peak shaving

### Stödtjänster Data Model
- **Emaldo rates:** Hardcoded — SE1-SE3 = 1,110 SEK/mo, SE4 = 1,370 SEK/mo for 36 months
- **Zone detection:** Use customer's existing elområde field (SE1-SE4)
- **Non-Emaldo batteries:** Salesperson enters stödtjänster income manually
- **Post-campaign display:** Show as SEK/year AND SEK/month, with "Mer detaljer" expandable showing SEK/kW/year

### Calculation Trigger
- **Sliders:** Immediate recalculation on drag (no debounce)
- **Text inputs:** Recalculate on each keystroke
- **Visual feedback:** Subtle flash/highlight on changed numbers

### Warning Displays
- **Style:** Toast notification
- **Threshold:** Appears when cycles/day > 2
- **Behavior:** Auto-dismiss after 3 seconds
- **Content:** Claude's discretion — communicate warranty/lifespan tradeoff

### Branding
- Replace Vercel logo with Kalkyla logo (`public/kalkyla.png`) throughout the application

### Claude's Discretion
- Warning message wording
- Exact highlight animation for changed values
- Visual design of sliders (as long as they meet range/step requirements)

</decisions>

<specifics>
## Specific Ideas

- Peak shaving example from user: "8 kW peak, 50% target, 5 kW battery capacity = shave 4 kW (not 4 kW because min of 4 and 5)"
- Post-campaign income should show multiple views: yearly total, monthly, and per-kW-per-year in details

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-calculation-engine*
*Context gathered: 2026-01-29*
