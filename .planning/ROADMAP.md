# Roadmap: Kalkyla.se

## Overview

This roadmap delivers a multi-tenant battery ROI calculator SaaS in 5 phases. We start with authentication and organization management (the foundation everything depends on), then build reference data management (batteries, grid operators, pricing), followed by the core calculator engine, the customer-facing shareable view (the core value proposition), and finally operations tooling (alerts, analytics, dashboards). Each phase delivers a complete, verifiable capability.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Authentication, organizations, and user management
- [x] **Phase 2: Reference Data** - Batteries, grid operators, and electricity pricing
- [x] **Phase 3: Calculator Engine** - Calculation builder and ROI logic
- [ ] **Phase 4: Customer Experience** - Shareable public view with interactive simulator
- [ ] **Phase 5: Operations** - Margin alerts, analytics, and admin dashboards

## Phase Details

### Phase 1: Foundation
**Goal**: Users can securely access the system and organizations are isolated with proper role hierarchy
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, ORG-01, ORG-02, ORG-03, ORG-04, ORG-05, ORG-06, ORG-07, USER-01, USER-02, USER-03, USER-04, USER-05
**Success Criteria** (what must be TRUE):
  1. User can log in with email/password and stay logged in across browser sessions
  2. User can log out from any page
  3. User can reset forgotten password via email link
  4. Super Admin can create organizations with branding and manage all orgs
  5. Org Admin can only see and manage their own organization's data
**Plans**: 8 plans executed

Plans:
- [x] 01-01: Project Setup & Database Foundation
- [x] 01-02: Auth.js v5 Integration
- [x] 01-03: Login & Logout UI
- [x] 01-04: Organization Management (Super Admin)
- [x] 01-05: User Management
- [x] 01-06: Password Reset Flow
- [x] 01-07: Org Admin Settings
- [x] 01-08: Phase Verification

### Phase 2: Reference Data
**Goal**: Org Admins can configure batteries, grid operators, and electricity pricing for their organization
**Depends on**: Phase 1
**Requirements**: BATT-01, BATT-02, BATT-03, BATT-04, BATT-05, BATT-06, NATA-01, NATA-02, NATA-03, NATA-04, NATA-05, ELEC-01, ELEC-02, ELEC-03, ELEC-04, ELEC-05
**Success Criteria** (what must be TRUE):
  1. Org Admin can create, edit, and delete battery brands and configurations with full specs
  2. Org Admin can create, edit, and delete grid operators (natagare) with day/night effect tariff rates
  3. System stores historical electricity prices per elomrade (SE1-SE4)
  4. Closer sees quarterly average electricity prices when creating calculations
  5. Battery configs and natagare are scoped to organization (cannot see other orgs' data)
**Plans**: 4 plans executed

Plans:
- [x] 02-01: Schema, permissions, and tenant scoping foundation
- [x] 02-02: Battery brand and configuration CRUD
- [x] 02-03: Natagare CRUD with default seeding
- [x] 02-04: Electricity pricing storage and display

### Phase 3: Calculator Engine
**Goal**: Closers can build complete battery ROI calculations with accurate Swedish market logic
**Depends on**: Phase 2
**Requirements**: CALC-01, CALC-02, CALC-03, CALC-04, CALC-05, CALC-06, CALC-07, CALC-08, CALC-09, CALC-10, CALC-11, CALC-12, CALC-13, CALC-14, CALC-15, LOGIC-01, LOGIC-02, LOGIC-03, LOGIC-04, LOGIC-05, LOGIC-06, LOGIC-07, LOGIC-08, LOGIC-09, LOGIC-10
**Success Criteria** (what must be TRUE):
  1. Closer can create calculation with customer info, elomrade, natagare, and annual consumption
  2. Closer can input 12x24 consumption profile via visual simulator with preset templates
  3. Closer can select battery and input pricing (total price, installation cost)
  4. System accurately calculates: spotpris savings, effect tariff savings, grid services income, Gron Teknik deduction, margin, payback period, 10-year ROI, 15-year ROI
  5. Closer can save, edit, and view their calculations
**Plans**: 5 plans executed

Plans:
- [x] 03-01: Database schema and core calculation engine with decimal.js
- [x] 03-02: Wizard state management with Zustand and auto-save
- [x] 03-03: Customer info step and consumption simulator with Recharts
- [x] 03-04: Battery selection and results display with charts
- [x] 03-05: Calculation list, PDF export, and end-to-end verification

### Phase 4: Customer Experience
**Goal**: Prospects can view branded, interactive ROI calculations via shareable links
**Depends on**: Phase 3
**Requirements**: CUST-01, CUST-02, CUST-03, CUST-04, CUST-05, CUST-06, CUST-07, CUST-08, CUST-09, CUST-10, CUST-11, CUST-12, SHARE-01, SHARE-02, SHARE-03, SHARE-04, SHARE-05
**Success Criteria** (what must be TRUE):
  1. Closer can generate shareable link for any calculation (random, unguessable code)
  2. Prospect can access calculation via public URL without login
  3. Public view displays org branding (logo, colors) and personalized greeting
  4. Prospect can adjust consumption in interactive simulator and see results update live
  5. Public view shows complete savings breakdown but prospect CANNOT change battery, pricing, or natagare
**Plans**: 4 plans

Plans:
- [ ] 04-01: Schema & Share Link Infrastructure
- [ ] 04-02: Share UI & Link Management
- [ ] 04-03: Public Route & View Components
- [ ] 04-04: Interactive Simulator & Mobile Experience

### Phase 5: Operations
**Goal**: Admins have visibility into calculations, alerts for low margins, and analytics on customer engagement
**Depends on**: Phase 4
**Requirements**: ALERT-01, ALERT-02, ALERT-03, ALERT-04, ALERT-05, ANLY-01, ANLY-02, ANLY-03, ANLY-04, ANLY-05, ANLY-06, DASH-01, DASH-02, DASH-03, DASH-04, DASH-05
**Success Criteria** (what must be TRUE):
  1. Super Admin sees all orgs and calculations; Org Admin sees their org; Closer sees their own
  2. Dashboard shows view counts and last viewed timestamps for shared calculations
  3. N8N webhook fires when ProffsKontakt-affiliated org saves calculation with margin below threshold
  4. PostHog captures page views, session replays, heatmaps, and custom events on customer-facing pages
  5. Sentry captures errors with stack traces and monitors API performance
**Plans**: TBD (3-4 expected)

Plans:
- [ ] 05-01: TBD
- [ ] 05-02: TBD
- [ ] 05-03: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 8/8 | Complete | 2026-01-19 |
| 2. Reference Data | 4/4 | Complete | 2026-01-19 |
| 3. Calculator Engine | 5/5 | Complete | 2026-01-20 |
| 4. Customer Experience | 0/4 | Planned | - |
| 5. Operations | 0/3 | Not started | - |

---
*Created: 2026-01-19*
*Total requirements: 92 (100% mapped)*
