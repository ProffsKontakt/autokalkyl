# Roadmap: Kalkyla.se

## Milestones

- **v1.0 MVP** — Phases 1-5 (shipped 2026-01-20)
- **v1.1 Fixed ROI Calculations** — Phases 6-7 (shipped 2026-02-01)
- **v1.2 Realistic Consumption & Peak Tariffs** — Phases 8-13 (shipped 2026-02-05)
- **v1.3 Combo & Avgifter** — Phases 14-17 (in progress)

## Phases

<details>
<summary>v1.0 MVP (Phases 1-5) — SHIPPED 2026-01-20</summary>

v1.0 delivered complete multi-tenant SaaS with 92 requirements across 5 phases:
- Phase 1: Foundation (auth, orgs, users)
- Phase 2: Configuration (batteries, natagare, electricity)
- Phase 3: Calculation Builder (wizard, logic, ROI engine)
- Phase 4: Customer Experience (public view, sharing, tracking)
- Phase 5: Operations (dashboards, analytics, alerts)

All 92 requirements shipped.

</details>

<details>
<summary>v1.1 Fixed ROI Calculations (Phases 6-7) — SHIPPED 2026-02-01</summary>

v1.1 fixed calculation accuracy with 21 requirements across 2 phases:
- Phase 6: Calculation Engine (formulas, sliders, controls)
- Phase 7: Calculation Transparency (breakdowns, overrides)

Key deliverables:
- Spotpris formula fix with cycles/day slider
- Emaldo grid services with zone-based guaranteed income
- Peak shaving controls with battery capacity constraints
- Expandable calculation breakdowns
- Manual override system with invisible sync to prospects

All 21 requirements shipped.

</details>

<details>
<summary>v1.2 Realistic Consumption & Peak Tariffs (Phases 8-13) — SHIPPED 2026-02-05</summary>

v1.2 added realistic consumption profiles and accurate peak tariffs with 27 requirements across 6 phases:
- Phase 8: Schema & Migration Foundation
- Phase 9: Natagare Centralization
- Phase 10: Consumption Profiles
- Phase 11: Peak Calculation Engine
- Phase 12: Analytics & Dashboard
- Phase 13: Bug Fixes & Polish

Key deliverables:
- Realistic consumption profiles with heating type selection
- Peak billing calculations with natagare-specific methods (Ellevio 3-peak)
- Centralized natagare management with Super Admin configuration
- Role-based PostHog analytics dashboards
- UI polish (spotpris efficiency fix, permanent sidebar)

All 27 requirements shipped.

Full archive: `.planning/milestones/v1.2-ROADMAP.md`

</details>

---

## v1.3 Combo & Avgifter (Phases 14-17)

**Goal:** Complete calculation accuracy with all Swedish electricity fees/taxes and multi-battery combo investments.

### Phase 14: Schema & Natagare Enhancements

**Goal:** Super Admin can configure natagare with complete fee and tariff timing data.

**Dependencies:** None (foundation for later phases)

**Requirements:** NATA-12, NATA-13, NATA-14

**Success Criteria:**
1. Super Admin can set overforingsavgift (ore/kWh) per natagare in configuration
2. Super Admin can configure effect tariff timing (high-load hours, night hours) per natagare
3. Peak calculations use natagare-specific tariff timing for day/night and summer/winter distinctions
4. Schema migration runs without data loss on existing natagare records

---

### Phase 15: Customer Type & Electricity Inputs

**Goal:** Closer can configure customer-specific electricity data including type (privatperson/foretag) and consumption sources.

**Dependencies:** None (parallel with Phase 14)

**Requirements:** CUST-01, CUST-02, CUST-03, CUST-04, ELEC-01, ELEC-02, ELEC-03, ELEC-04, ELEC-05, ELEC-06

**Success Criteria:**
1. Closer can toggle customer type between Privatperson and Foretag in calculation wizard
2. Closer can input kopt el (purchased electricity) in kWh and electricity price (annual or monthly)
3. Closer can input existing solar production (egenproducerad el) in kWh/year
4. Net consumption (kopt el minus solar) is calculated and used as basis for savings
5. Customer type is visible in calculation summary and public prospect view

---

### Phase 16: Fees & Taxes

**Goal:** Calculations include all Swedish electricity cost components with accurate customer-type-specific totals.

**Dependencies:** Phase 14 (natagare overforingsavgift), Phase 15 (customer type for VAT logic)

**Requirements:** FEES-01, FEES-02, FEES-03, FEES-04, FEES-05

**Success Criteria:**
1. Calculation breakdown shows energiskatt at 45 ore/kWh
2. Calculation breakdown shows overforingsavgift from natagare configuration (ore/kWh)
3. Moms (25%) applied for Privatperson only, excluded for Foretag
4. All fee components visible in expandable breakdown (energiskatt, overforingsavgift, moms)
5. Total electricity cost displays sum of all components correctly

---

### Phase 17: Multi-Battery Combo

**Goal:** Closer can configure multi-battery investments with accurate combined calculations or side-by-side comparisons.

**Dependencies:** Phase 16 (calculations must be accurate before combining)

**Requirements:** COMBO-01, COMBO-02, COMBO-03, COMBO-04, COMBO-05, COMBO-06, COMBO-07, COMBO-08, COMBO-09, COMBO-10

**Success Criteria:**
1. Closer can add multiple batteries to a single calculation
2. Closer can toggle between Jamfora (compare) and Komboinvestering (combine) modes
3. Komboinvestering combines capacity, price, and all savings categories for same-model batteries
4. Jamfora mode displays side-by-side comparison of up to 3 configurations
5. Grid services income correctly stacks per qualifying unit (e.g., 2x Emaldo = 2x enrollment income)

---

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-5 | v1.0 | 26/26 | Complete | 2026-01-20 |
| 6. Calculation Engine | v1.1 | 3/3 | Complete | 2026-01-31 |
| 7. Calculation Transparency | v1.1 | 4/4 | Complete | 2026-01-31 |
| 8. Schema & Migration | v1.2 | 2/2 | Complete | 2026-02-01 |
| 9. Natagare Centralization | v1.2 | 3/3 | Complete | 2026-02-01 |
| 10. Consumption Profiles | v1.2 | 3/3 | Complete | 2026-02-04 |
| 11. Peak Calculation Engine | v1.2 | 4/4 | Complete | 2026-02-05 |
| 12. Analytics & Dashboard | v1.2 | 5/5 | Complete | 2026-02-05 |
| 13. Bug Fixes & Polish | v1.2 | 2/2 | Complete | 2026-02-05 |
| 14. Schema & Natagare | v1.3 | 0/? | Pending | — |
| 15. Customer & Electricity | v1.3 | 0/? | Pending | — |
| 16. Fees & Taxes | v1.3 | 0/? | Pending | — |
| 17. Multi-Battery Combo | v1.3 | 0/? | Pending | — |

**Total: 17 phases, 52+ plans, 168 requirements (140 shipped, 28 pending)**

---
*Roadmap created: 2026-01-29*
*Last updated: 2026-02-05 (v1.3 roadmap added)*
