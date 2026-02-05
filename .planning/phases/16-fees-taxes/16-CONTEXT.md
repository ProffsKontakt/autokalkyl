# Phase 16: Fees & Taxes - Context

**Gathered:** 2026-02-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Calculations include all Swedish electricity cost components (energiskatt, överföringsavgift, moms) with accurate customer-type-specific totals. Fees appear in the expandable calculation breakdown. This phase does not add new UI inputs — it uses existing customer type and natagare data to calculate accurate costs.

</domain>

<decisions>
## Implementation Decisions

### Fee display
- Fees grouped under "Avgifter & skatter" label in breakdown
- Expandable to show separate lines: Energiskatt, Överföringsavgift
- Breakdown only — not in summary cards
- Identical breakdown for internal and public prospect view

### Savings attribution
- Self-consumed solar (egenproducerad el used locally) avoids ALL fees: spotpris, energiskatt, överföringsavgift, moms
- Battery spotpris arbitrage (charge cheap, discharge expensive) — NEEDS RESEARCH: researcher to investigate whether discharge from grid-charged battery avoids fees
- Solar self-consumption savings should be visible but presentation is Claude's discretion (likely grouped "Egenförbrukning" with expandable itemized fee savings)

### Calculation precision
- Fee rates displayed in öre/kWh
- Annual totals displayed as whole numbers (no decimals)
- Energiskatt rate: 36 öre/kWh excl. moms, 45 öre/kWh incl. moms
  - Privatperson: use 45 öre (incl. moms)
  - Företag: use 36 öre (excl. moms)

### Moms handling
- Privatperson: all components shown incl. moms (no separate moms line)
- Företag: all components shown excl. moms
- Electricity price interpretation depends on customer type:
  - Privatperson entered incl. moms → display incl. moms
  - Företag entered excl. moms → display excl. moms
- Show values as entered — consistent with customer type

### Claude's Discretion
- Rounding approach (per-component vs final total)
- Whether to add "(exkl. moms)" label for Företag view
- Egenförbrukning savings display structure (grouped vs itemized)
- Error handling for missing natagare överföringsavgift

</decisions>

<specifics>
## Specific Ideas

- Energiskatt is a fixed rate (36/45 öre) — can be hardcoded or config constant
- Överföringsavgift comes from natagare configuration (Phase 14)
- Customer type comes from calculation data (Phase 15)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 16-fees-taxes*
*Context gathered: 2026-02-05*
