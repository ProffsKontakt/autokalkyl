# Roadmap: Kalkyla.se

## Milestones

- [x] **v1.0 MVP** - Phases 1-5 (shipped 2026-01-20)
- [ ] **v1.1 Fixed ROI Calculations** - Phases 6-7 (in progress)

## Phases

<details>
<summary>v1.0 MVP (Phases 1-5) - SHIPPED 2026-01-20</summary>

v1.0 delivered complete multi-tenant SaaS with 92 requirements across 5 phases:
- Phase 1: Foundation (auth, orgs, users)
- Phase 2: Configuration (batteries, natagare, electricity)
- Phase 3: Calculation Builder (wizard, logic, ROI engine)
- Phase 4: Customer Experience (public view, sharing, tracking)
- Phase 5: Operations (dashboards, analytics, alerts)

All 92 requirements shipped.

</details>

### v1.1 Fixed ROI Calculations (In Progress)

**Milestone Goal:** Fix calculation accuracy for spotprisoptimering, stodtjanster, and effektavgifter with transparent breakdowns showing how each savings number is derived.

- [x] **Phase 6: Calculation Engine** - Fix formulas and add control sliders for all three savings categories (verified 2026-01-31)
- [x] **Phase 7: Calculation Transparency** - Add breakdowns and prospect-safe visibility (verified 2026-01-31)

## Phase Details

### Phase 6: Calculation Engine

**Goal**: Salesperson can configure and calculate accurate savings for spotpris, stodtjanster, and effektavgifter

**Depends on**: Phase 5 (v1.0 complete)

**Requirements**: SPOT-01, SPOT-02, SPOT-03, GRID-01, GRID-02, GRID-03, GRID-04, PEAK-01, PEAK-02, PEAK-03

**Success Criteria** (what must be TRUE):
1. Spotpris calculation uses correct formula (spread x efficiency x cycles x capacity x days) and salesperson can adjust cycles/day
2. Stodtjanster shows Emaldo zone-based guaranteed income (SE1-SE3: 1,110 SEK/mo, SE4: 1,370 SEK/mo for 36 months) plus configurable post-campaign projection
3. Effektavgifter slider lets salesperson control peak shaving level (% or kW) respecting battery capacity limits
4. High cycles warning appears when warranty life tradeoff applies
5. All three savings categories show in calculation results with correct values

**Plans**: 3 plans in 3 waves

Plans:
- [x] 06-01-PLAN.md - Fix formulas, add constants, install Sonner
- [x] 06-02-PLAN.md - Extend store, create slider control components
- [x] 06-03-PLAN.md - Integrate controls into results view

### Phase 7: Calculation Transparency & Manual Overrides

**Goal**: Prospects can see how each savings number is derived while sensitive business data stays hidden. Salesperson can manually override any calculation value with instant sync to shared links.

**Depends on**: Phase 6

**Requirements**: SPOT-04, GRID-05, PEAK-04, TRANS-01, TRANS-02, TRANS-03, TRANS-04, OVRD-01, OVRD-02, OVRD-03, OVRD-04

**Success Criteria** (what must be TRUE):
1. Each savings category (spotpris, stodtjanster, effektavgifter) has expandable breakdown showing calculation inputs
2. Prospect view displays all savings breakdowns with battery price
3. Prospect view hides margins, org cuts, and internal business data
4. Breakdown shows the formula/logic used to derive each savings number
5. Salesperson can manually override any savings total or input value
6. Overrides sync instantly to already-shared calculation links
7. Overrides are invisible to prospects (they see adjusted values as calculated)

**Plans**: 4 plans in 3 waves

Plans:
- [x] 07-01-PLAN.md - Create breakdown components (ExpandableBreakdown, Spotpris, Effekt, Stodtjanster)
- [x] 07-02-PLAN.md - Extend types and integrate breakdowns into public view
- [x] 07-03-PLAN.md - Override infrastructure (schema, types, store, OverridableValue component)
- [x] 07-04-PLAN.md - Override integration (save action, public apply, admin UI)

## Progress

**Execution Order:** Phase 6 then Phase 7

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-5 | v1.0 | - | Complete | 2026-01-20 |
| 6. Calculation Engine | v1.1 | 3/3 | Complete | 2026-01-31 |
| 7. Calculation Transparency | v1.1 | 4/4 | Complete | 2026-01-31 |

---
*Roadmap created: 2026-01-29*
*Last updated: 2026-01-31*
