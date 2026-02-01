# Roadmap: Kalkyla.se

## Milestones

- v1.0 MVP — Phases 1-5 (shipped 2026-01-20)
- v1.1 Fixed ROI Calculations — Phases 6-7 (shipped 2026-02-01)
- v1.2 Realistic Consumption & Peak Tariffs — Phases 8-13 (in progress)

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

### v1.2 Realistic Consumption & Peak Tariffs (In Progress)

**Milestone Goal:** Replace simplified consumption model with realistic Swedish consumption profiles and accurate peak tariff calculations based on grid operator-specific rules.

- [x] **Phase 8: Schema & Migration Foundation** — Data model extensions, hardcoded peak centralization
- [ ] **Phase 9: Natagare Centralization** — Global scope migration, Super Admin peak method configuration
- [ ] **Phase 10: Consumption Profiles** — Annual kWh input with heating type seasonal distribution
- [ ] **Phase 11: Peak Calculation Engine** — Peak methods, night discount, capacity-constrained shaving
- [ ] **Phase 12: Analytics & Dashboard** — PostHog fix, server-side events, embedded role-based dashboards
- [ ] **Phase 13: Bug Fixes & Polish** — Display corrections, UI improvements

## Phase Details

### Phase 8: Schema & Migration Foundation
**Goal:** Data model ready for v1.2 features with all hardcoded peak values centralized
**Depends on:** Phase 7 (v1.1 complete)
**Requirements:** FIX-03
**Success Criteria** (what must be TRUE):
  1. HeatingType enum exists in schema with 5 Swedish heating types
  2. Natagare model has peak calculation method, night discount fields
  3. All hardcoded currentPeakKw references (6+ locations) use centralized config
  4. Existing 113 calculations continue to work with unchanged results
**Plans:** 2 plans

Plans:
- [x] 08-01-PLAN.md — Schema extensions (HeatingType enum, Natagare peak fields, migration)
- [x] 08-02-PLAN.md — Peak value centralization (DEFAULT_CURRENT_PEAK_KW constant)

### Phase 9: Natagare Centralization
**Goal:** Super Admin manages global natagare with peak calculation settings
**Depends on:** Phase 8
**Requirements:** NATA-06, NATA-07, NATA-08, NATA-09, NATA-10, NATA-11
**Success Criteria** (what must be TRUE):
  1. All existing natagare migrated to global scope (no org-specific duplicates)
  2. Super Admin can configure peak method per natagare (e.g., Ellevio 3-peak)
  3. Super Admin can configure night discount percentage and hours
  4. Org Admin can add new natagare to global list if missing
  5. Closer sees only natagare dropdown (no edit access)
**Plans:** 3 plans

Plans:
- [ ] 09-01-PLAN.md — Schema & migration (globalScope, approvalStatus, permissions, data migration with duplicate detection)
- [ ] 09-02-PLAN.md — Super Admin configuration UI (list-with-side-panel, peak method config, duplicate banner)
- [ ] 09-03-PLAN.md — Org/Closer access & approval flow (request form, view-only list, dashboard widget)

### Phase 10: Consumption Profiles
**Goal:** Users input annual consumption with heating type and see realistic seasonal distribution
**Depends on:** Phase 8 (schema ready)
**Requirements:** CONS-01, CONS-02, CONS-03, CONS-04, CONS-05
**Success Criteria** (what must be TRUE):
  1. User can input annual kWh consumption in calculation wizard
  2. User can select heating type from 5 Swedish options (Bergvarme, Fjarrvarme, Direktverkande, Luft-luft VP, Luft-vatten VP)
  3. System generates monthly consumption distribution based on heating type
  4. User can view visual curve showing seasonal consumption pattern
  5. Winter months show higher consumption for electric heating types
**Plans:** TBD

Plans:
- [ ] 10-01: Annual kWh input and heating type selection
- [ ] 10-02: Seasonal distribution algorithm and visualization

### Phase 11: Peak Calculation Engine
**Goal:** Accurate peak tariff calculations using natagare-specific methods
**Depends on:** Phase 9 (natagare config), Phase 10 (consumption profiles)
**Requirements:** PEAK-05, PEAK-06, PEAK-07, PEAK-08, PEAK-09, PEAK-10
**Success Criteria** (what must be TRUE):
  1. User can input target average peak (kW) and monthly ceiling
  2. System applies natagare-specific peak method (e.g., Ellevio 3-peak averaging)
  3. Night peaks (22:00-06:00) apply configured discount automatically
  4. Results page shows before/after peak comparison with battery impact
  5. Peak shaving respects battery capacity constraints (cycles/day, max kW)
**Plans:** TBD

Plans:
- [ ] 11-01: Manual peak inputs and peak method strategy
- [ ] 11-02: Night discount calculation and capacity constraints
- [ ] 11-03: Peak shaving visualization and before/after comparison

### Phase 12: Analytics & Dashboard
**Goal:** Working PostHog analytics with role-based embedded dashboards
**Depends on:** Phase 8 (independent stream, can run parallel to 9-11)
**Requirements:** ANLY-07, ANLY-08, ANLY-09, ANLY-10, ANLY-11, ANLY-12
**Success Criteria** (what must be TRUE):
  1. PostHog events flow correctly (bot detection disabled/bypassed)
  2. Server-side events capture calculation lifecycle (create, update, view)
  3. Super Admin sees embedded analytics for all calculations
  4. Org Admin sees embedded analytics scoped to their organization
  5. Closer sees embedded analytics for their own calculations only
**Plans:** TBD

Plans:
- [ ] 12-01: PostHog reconfiguration and server-side events
- [ ] 12-02: Embedded dashboards with role-based scoping

### Phase 13: Bug Fixes & Polish
**Goal:** v1.2 release-ready with display bugs fixed and UI polished
**Depends on:** Phases 9-12 (all features complete)
**Requirements:** FIX-01, FIX-02, FIX-04
**Success Criteria** (what must be TRUE):
  1. Spotpris efficiency displays as percentage (90.2% not 90000.2%)
  2. Super Admin sidebar is permanent menu (not hover-triggered)
  3. Spotpris breakdown shows verkningsgrad as %, daglig energi/besparing with correct values
**Plans:** TBD

Plans:
- [ ] 13-01: Display and UI bug fixes

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-5 | v1.0 | 26/26 | Complete | 2026-01-20 |
| 6. Calculation Engine | v1.1 | 3/3 | Complete | 2026-01-31 |
| 7. Calculation Transparency | v1.1 | 4/4 | Complete | 2026-01-31 |
| 8. Schema & Migration | v1.2 | 2/2 | Complete | 2026-02-01 |
| 9. Natagare Centralization | v1.2 | 0/3 | Not started | - |
| 10. Consumption Profiles | v1.2 | 0/2 | Not started | - |
| 11. Peak Calculation Engine | v1.2 | 0/3 | Not started | - |
| 12. Analytics & Dashboard | v1.2 | 0/2 | Not started | - |
| 13. Bug Fixes & Polish | v1.2 | 0/1 | Not started | - |

---
*Roadmap created: 2026-01-29*
*Last updated: 2026-02-01 (Phase 9 planned)*
