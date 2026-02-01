# Phase 10: Consumption Profiles - Context

**Gathered:** 2026-02-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Closers input prospect's annual consumption with heating type in the calculation wizard. System generates monthly consumption distribution based on heating type. Visualization shows seasonal pattern in wizard preview and on results page.

**User flow:** Closer creates calculation → enters prospect's kWh + heating type → system distributes across months → prospect sees realistic consumption pattern in their results.

</domain>

<decisions>
## Implementation Decisions

### Annual kWh Input
- Slider with text override (user can type exact value)
- Range: 5,000 - 75,000 kWh
- Increments: 500 kWh
- Required field — Closer must enter to proceed

### Estimation Helper
- For Closers who don't know prospect's consumption
- Inputs: house size (m²) + number of residents + heating type
- Calculates estimated annual kWh using Swedish consumption formula
- UI placement: Claude's discretion (modal or inline expandable)

### Heating Type Selection
- 5 Swedish heating types as simple radio buttons
- Swedish names only: Bergvärme, Fjärrvärme, Direktverkande el, Luft-luft VP, Luft-vatten VP
- Info tooltip per option explaining what each means
- No default — Closer must select
- Required field

### Distribution Visualization
- Chart shows monthly consumption distribution
- Appears in both places: preview in wizard (updates live), full version on results page
- Chart type: Claude's discretion (area, bar, or line based on what works best)
- Interactivity: Claude's discretion

### Wizard Integration
- Consumption input is a required wizard step
- Step placement: Claude's discretion based on calculation flow
- Both annual kWh and heating type required to proceed

### Claude's Discretion
- Chart type selection (area/bar/line)
- Chart interactivity level
- Wizard step ordering
- Estimation helper UI (modal vs inline)
- Exact slider styling and interaction

</decisions>

<specifics>
## Specific Ideas

- This is a B2B tool: Closer (salesperson) creates calculations for prospects
- Like Hyllinge Solkraft — Closer inputs data, prospect receives polished results
- Winter months must show higher consumption for electric heating types (direktverkande, VP)
- Chart should be simple and clear — prospects need to understand their consumption pattern

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 10-consumption-profiles*
*Context gathered: 2026-02-01*
