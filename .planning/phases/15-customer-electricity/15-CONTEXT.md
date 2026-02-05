# Phase 15: Customer Type & Electricity Inputs - Context

**Gathered:** 2026-02-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Closer can configure customer-specific electricity data in the calculation wizard. This includes customer type (privatperson/företag), purchased electricity (köpt el), electricity price, and existing solar production with self-consumption modeling. Net consumption drives battery savings calculations.

</domain>

<decisions>
## Implementation Decisions

### Input Location & Flow
- New inputs appear as first step after customer basics (name/contact)
- Köpt el is always required — closer must enter a value to proceed
- Köpt el supports annual or monthly input with toggle — system converts internally
- Claude decides grouping/layout based on existing wizard patterns

### Price Input Format
- Price represents all-in electricity cost (total cost per kWh including all fees/taxes)
- Unit supports either öre/kWh or SEK/kWh with toggle
- Show helper text with typical range (e.g., 120-180 öre/kWh) instead of default value
- Optional monthly breakdown available — closer can enter 12 monthly prices for accuracy, or just single annual average

### Solar Integration
- Conditional toggle: "Har solceller?" — shows solar inputs only if yes
- Solar production (egenproducerad el) supports annual or monthly input with toggle
- Three-field model for self-consumption scenarios:
  - **Totalt producerad el** — Total solar production (kWh/year)
  - **Egenanvänd el** — Current self-consumption (% or kWh, with toggle)
  - **Ny egenanvänd el** — Projected self-consumption with battery (adjustable by closer)
- This allows closer to model "what if customer stores more of their solar" scenarios
- Solar affects net consumption: net = köpt el - (solar used directly)

### Customer Type
- Dropdown selector (allows future expansion)
- Types configurable by Super Admin — start with Privatperson and Företag
- Default selection: Privatperson
- Visible in expanded details only, not prominently displayed in main summary
- Företag customers: VAT (moms 25%) deducted from total prices

### Claude's Discretion
- Exact field grouping and section layout within the wizard step
- Input validation ranges and error messaging
- Helper text wording for price range
- How monthly breakdown UI is presented (accordion, modal, inline)

</decisions>

<specifics>
## Specific Ideas

- Self-consumption modeling is key value prop for solar+battery customers — closer can show "before and after" battery scenarios
- Customer types should follow centralized config pattern like natagare (Super Admin manages the list)
- Monthly price breakdown is optional power-user feature — most closers will use annual average

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 15-customer-electricity*
*Context gathered: 2026-02-05*
