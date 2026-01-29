# Requirements: Kalkyla.se

**Defined:** 2026-01-29
**Core Value:** Closers can build accurate, interactive battery ROI calculations that prospects can customize to see real savings.

## v1.1 Requirements

Requirements for milestone v1.1: Fixed ROI Calculations.

### Spotprisoptimering

- [ ] **SPOT-01**: Calculation uses correct formula: price spread × efficiency (80%) × cycles/day × capacity × days
- [ ] **SPOT-02**: Salesperson can adjust daily charge cycles via slider (1-3 range)
- [ ] **SPOT-03**: UI shows tradeoff warning when high cycles reduce warranty life faster
- [ ] **SPOT-04**: Breakdown shows how spotpris savings number is derived (inputs → result)

### Stödtjänster (Grid Services)

- [ ] **GRID-01**: Emaldo batteries have zone-based guaranteed income: SE1-SE3 = 1,110 SEK/mo, SE4 = 1,370 SEK/mo
- [ ] **GRID-02**: Guaranteed income period is 36 months (hardcoded for Emaldo campaign)
- [ ] **GRID-03**: Post-campaign income rate is salesperson-configurable
- [ ] **GRID-04**: Total stödtjänster income shows in calculation (guaranteed + post-campaign projection)
- [ ] **GRID-05**: Breakdown shows how stödtjänster income is calculated (zone, months, rate)

### Effektavgifter (Peak Shaving)

- [ ] **PEAK-01**: Salesperson can control peak shaving via slider (% of peak OR max kW cut)
- [ ] **PEAK-02**: Slider respects battery capacity limit (can't shave more than battery can deliver)
- [ ] **PEAK-03**: Calculation reflects selected peak shaving level
- [ ] **PEAK-04**: Breakdown shows how effektavgift savings is derived (peak, cut amount, tariff rate)

### Calculation Transparency

- [ ] **TRANS-01**: Each savings category displays expandable breakdown of calculation inputs
- [ ] **TRANS-02**: Prospect view shows savings breakdowns (spotpris, effekt, stödtjänster)
- [ ] **TRANS-03**: Prospect view shows battery price
- [ ] **TRANS-04**: Prospect view hides margins, org cuts, and internal business data

## Future Requirements

Deferred to later milestones.

(None defined yet)

## Out of Scope

Explicitly excluded from v1.1. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Auth/org changes | No changes needed, v1.0 auth works |
| Share link mechanics changes | Links work, only fixing calculation display |
| New battery manufacturers grid deals | Emaldo only for now, others use existing logic |
| Real-time spot prices | Still out of scope — liability risk |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SPOT-01 | TBD | Pending |
| SPOT-02 | TBD | Pending |
| SPOT-03 | TBD | Pending |
| SPOT-04 | TBD | Pending |
| GRID-01 | TBD | Pending |
| GRID-02 | TBD | Pending |
| GRID-03 | TBD | Pending |
| GRID-04 | TBD | Pending |
| GRID-05 | TBD | Pending |
| PEAK-01 | TBD | Pending |
| PEAK-02 | TBD | Pending |
| PEAK-03 | TBD | Pending |
| PEAK-04 | TBD | Pending |
| TRANS-01 | TBD | Pending |
| TRANS-02 | TBD | Pending |
| TRANS-03 | TBD | Pending |
| TRANS-04 | TBD | Pending |

**Coverage:**
- v1.1 requirements: 16 total
- Mapped to phases: 0
- Unmapped: 16 ⚠️

---
*Requirements defined: 2026-01-29*
*Last updated: 2026-01-29 after initial definition*
