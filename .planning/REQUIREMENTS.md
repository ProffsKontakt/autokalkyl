# Requirements: Kalkyla.se

**Defined:** 2025-01-18
**Core Value:** Closers can build accurate, interactive battery ROI calculations that prospects can customize to see real savings.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication ✓

- [x] **AUTH-01**: User can log in with email and password
- [x] **AUTH-02**: User session persists across browser refresh
- [x] **AUTH-03**: User can log out from any page
- [x] **AUTH-04**: Admin can create new users with role assignment
- [x] **AUTH-05**: User can reset password via email link (N8N + Gmail)
- [x] **AUTH-06**: Role-based access control enforced (Super Admin > Org Admin > Closer)

### Organization Management ✓

- [x] **ORG-01**: Super Admin can create organizations with name and slug
- [x] **ORG-02**: Super Admin can set org branding (logo, primary/secondary colors)
- [x] **ORG-03**: Super Admin can mark org as ProffsKontakt-affiliated (enables partner cut + margin alerts)
- [x] **ORG-04**: Super Admin can set installation partner cut for affiliated orgs
- [x] **ORG-05**: Super Admin can view all organizations and calculations
- [x] **ORG-06**: Org Admin can edit their organization's branding
- [x] **ORG-07**: Org Admin can view their organization's calculations

### User Management ✓

- [x] **USER-01**: Super Admin can create Org Admins for any organization
- [x] **USER-02**: Org Admin can create Closers for their organization
- [x] **USER-03**: Admin can edit user details (name, email, role)
- [x] **USER-04**: Admin can deactivate users
- [x] **USER-05**: Users are scoped to their organization (except Super Admin)

### Battery Configuration ✓

- [x] **BATT-01**: Org Admin can create battery brands
- [x] **BATT-02**: Org Admin can create battery configurations per brand
- [x] **BATT-03**: Battery config includes: capacity (kWh), max charge/discharge (kW), efficiencies, warranty years, guaranteed cycles, degradation rate, cost price
- [x] **BATT-04**: Battery config supports extension cabinet and new stack flags
- [x] **BATT-05**: Org Admin can edit and delete battery configs
- [x] **BATT-06**: Battery configs are scoped to organization

### Natagare (Grid Operators) ✓

- [x] **NATA-01**: Org Admin can create natagare records
- [x] **NATA-02**: Natagare includes: name, day rate (SEK/kW), night rate (SEK/kW), day start/end hours
- [x] **NATA-03**: Org Admin can edit and delete natagare records
- [x] **NATA-04**: Natagare are scoped to organization
- [x] **NATA-05**: System supports common natagare (Ellevio, Vattenfall, etc.) with default rates

### Electricity Pricing ✓

- [x] **ELEC-01**: System stores electricity prices per elomrade (SE1-SE4)
- [x] **ELEC-02**: Prices stored with date and hour granularity
- [x] **ELEC-03**: System can fetch prices from Nord Pool API (or manual entry fallback)
- [x] **ELEC-04**: Closer sees quarterly average prices when creating calculation
- [x] **ELEC-05**: Calculation uses historical prices for accurate ROI

### Calculation Builder ✓

- [x] **CALC-01**: Closer can create new calculation with customer name
- [x] **CALC-02**: Closer can select elomrade (SE1-SE4)
- [x] **CALC-03**: Closer can select natagare from org's list
- [x] **CALC-04**: Closer can input annual consumption (kWh)
- [x] **CALC-05**: Closer can input consumption profile: 12 months x 24 hours (one average day per month)
- [x] **CALC-06**: Consumption simulator shows visual bar chart
- [x] **CALC-07**: Consumption simulator has preset templates (typical family, home office, EV charging)
- [x] **CALC-08**: Closer can select battery brand and configuration
- [x] **CALC-09**: Closer can input total price ex. VAT
- [x] **CALC-10**: Closer can input installation cost
- [x] **CALC-11**: System calculates total inc. VAT (25%)
- [x] **CALC-12**: System calculates cost after Gron Teknik (48.5% deduction)
- [x] **CALC-13**: System calculates and displays margin (for ProffsKontakt orgs with partner cut)
- [x] **CALC-14**: Closer can save calculation and return to edit later
- [x] **CALC-15**: Closer can view list of their calculations

### Calculation Logic ✓

- [x] **LOGIC-01**: Calculate effective capacity per cycle (capacity x charge eff x discharge eff x avg discharge %)
- [x] **LOGIC-02**: Calculate energy from battery per year (effective capacity x cycles/day x 365)
- [x] **LOGIC-03**: Calculate spotpris optimization savings (energy x price difference day vs night)
- [x] **LOGIC-04**: Calculate effect tariff savings (quarterly peak reduction x tariff rate x 3 months x 4 quarters)
- [x] **LOGIC-05**: Calculate grid services income (org-configurable, default 500 SEK/kW/year)
- [x] **LOGIC-06**: Calculate total annual savings (spotpris + effect tariff + grid services)
- [x] **LOGIC-07**: Calculate payback period (cost after Gron Teknik / annual savings)
- [x] **LOGIC-08**: Calculate 10-year ROI ((annual savings x 10 - cost) / cost x 100)
- [x] **LOGIC-09**: Calculate 15-year ROI ((annual savings x 15 - cost) / cost x 100)
- [x] **LOGIC-10**: Use decimal.js for financial precision (no floating point errors)

### Customer-Facing View ✓

- [x] **CUST-01**: Calculation accessible via shareable link: kalkyla.se/{org-slug}/{shareCode}
- [x] **CUST-02**: Public view requires no authentication
- [x] **CUST-03**: Public view displays organization branding (logo, colors)
- [x] **CUST-04**: Public view shows customer name: "Hej {name}, har ar din batterikalkyl"
- [x] **CUST-05**: Public view shows battery specs summary
- [x] **CUST-06**: Public view shows interactive consumption simulator
- [x] **CUST-07**: Customer can adjust hourly consumption in simulator
- [x] **CUST-08**: Results update live as customer adjusts consumption
- [x] **CUST-09**: Public view shows savings breakdown (spotpris, effect tariff, grid services)
- [x] **CUST-10**: Public view shows payback period and ROI (10-year, 15-year)
- [x] **CUST-11**: Public view is mobile-responsive
- [x] **CUST-12**: Customer CANNOT change: battery selection, pricing, natagare

### Sharing & Links ✓

- [x] **SHARE-01**: Closer can generate shareable link for calculation
- [x] **SHARE-02**: Share code is random, unguessable string
- [x] **SHARE-03**: Closer can set expiration date on link (optional)
- [x] **SHARE-04**: System tracks view count per calculation
- [x] **SHARE-05**: System tracks last viewed timestamp

### Margin Alerts

- [x] **ALERT-01**: For ProffsKontakt-affiliated orgs, system triggers N8N webhook when margin < threshold
- [x] **ALERT-02**: Default margin threshold is 24,000 SEK
- [x] **ALERT-03**: Webhook payload includes: calculation details, closer name, org name, margin breakdown, link
- [x] **ALERT-04**: N8N sends email to julian@proffskontakt.se
- [x] **ALERT-05**: Non-affiliated orgs see margin display but no automated alerts

### Analytics & Monitoring

- [x] **ANLY-01**: PostHog tracks page views on customer-facing pages
- [x] **ANLY-02**: PostHog captures session replays
- [x] **ANLY-03**: PostHog records heatmaps
- [x] **ANLY-04**: Custom events: calculation_viewed, simulator_adjusted, scroll_depth, time_on_page
- [x] **ANLY-05**: Sentry captures errors with stack traces
- [x] **ANLY-06**: Sentry monitors API performance

### Admin Dashboard

- [x] **DASH-01**: Super Admin sees all organizations with calculation counts
- [x] **DASH-02**: Super Admin sees all calculations filterable by org, closer, date
- [x] **DASH-03**: Org Admin sees their org's calculations
- [x] **DASH-04**: Closer sees their own calculations with view counts
- [x] **DASH-05**: Dashboard shows link analytics (views, last viewed)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Advanced Features

- **PDF-01**: Export calculation to branded PDF
- **SCENARIO-01**: Compare multiple battery configurations side-by-side
- **TEMPLATE-01**: Create calculation templates for faster quoting
- **BULK-01**: Bulk user import via CSV

### Enterprise Features

- **SSO-01**: SAML/OIDC single sign-on integration
- **API-01**: REST API for CRM integration
- **DOMAIN-01**: Custom subdomain per organization

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Real-time spot price display | Prices change constantly, creates confusion and liability |
| Customer self-registration | Spam risk, admin-controlled access preferred |
| AI consumption estimates | Unreliable, liability risk |
| Multi-currency support | Swedish market only, SEK hardcoded |
| In-app chat/messaging | Scope creep, use email instead |
| Automatic contract generation | Legal complexity outside scope |
| Battery comparison shopping | Not a price comparison site |
| Complex approval workflows | Over-engineering for initial market |
| Solar panel calculations | Batteries only for v1 |
| Mobile app | Web-first approach |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 1 | Complete |
| AUTH-03 | Phase 1 | Complete |
| AUTH-04 | Phase 1 | Complete |
| AUTH-05 | Phase 1 | Complete |
| AUTH-06 | Phase 1 | Complete |
| ORG-01 | Phase 1 | Complete |
| ORG-02 | Phase 1 | Complete |
| ORG-03 | Phase 1 | Complete |
| ORG-04 | Phase 1 | Complete |
| ORG-05 | Phase 1 | Complete |
| ORG-06 | Phase 1 | Complete |
| ORG-07 | Phase 1 | Complete |
| USER-01 | Phase 1 | Complete |
| USER-02 | Phase 1 | Complete |
| USER-03 | Phase 1 | Complete |
| USER-04 | Phase 1 | Complete |
| USER-05 | Phase 1 | Complete |
| BATT-01 | Phase 2 | Complete |
| BATT-02 | Phase 2 | Complete |
| BATT-03 | Phase 2 | Complete |
| BATT-04 | Phase 2 | Complete |
| BATT-05 | Phase 2 | Complete |
| BATT-06 | Phase 2 | Complete |
| NATA-01 | Phase 2 | Complete |
| NATA-02 | Phase 2 | Complete |
| NATA-03 | Phase 2 | Complete |
| NATA-04 | Phase 2 | Complete |
| NATA-05 | Phase 2 | Complete |
| ELEC-01 | Phase 2 | Complete |
| ELEC-02 | Phase 2 | Complete |
| ELEC-03 | Phase 2 | Complete |
| ELEC-04 | Phase 2 | Complete |
| ELEC-05 | Phase 2 | Complete |
| CALC-01 | Phase 3 | Complete |
| CALC-02 | Phase 3 | Complete |
| CALC-03 | Phase 3 | Complete |
| CALC-04 | Phase 3 | Complete |
| CALC-05 | Phase 3 | Complete |
| CALC-06 | Phase 3 | Complete |
| CALC-07 | Phase 3 | Complete |
| CALC-08 | Phase 3 | Complete |
| CALC-09 | Phase 3 | Complete |
| CALC-10 | Phase 3 | Complete |
| CALC-11 | Phase 3 | Complete |
| CALC-12 | Phase 3 | Complete |
| CALC-13 | Phase 3 | Complete |
| CALC-14 | Phase 3 | Complete |
| CALC-15 | Phase 3 | Complete |
| LOGIC-01 | Phase 3 | Complete |
| LOGIC-02 | Phase 3 | Complete |
| LOGIC-03 | Phase 3 | Complete |
| LOGIC-04 | Phase 3 | Complete |
| LOGIC-05 | Phase 3 | Complete |
| LOGIC-06 | Phase 3 | Complete |
| LOGIC-07 | Phase 3 | Complete |
| LOGIC-08 | Phase 3 | Complete |
| LOGIC-09 | Phase 3 | Complete |
| LOGIC-10 | Phase 3 | Complete |
| CUST-01 | Phase 4 | Complete |
| CUST-02 | Phase 4 | Complete |
| CUST-03 | Phase 4 | Complete |
| CUST-04 | Phase 4 | Complete |
| CUST-05 | Phase 4 | Complete |
| CUST-06 | Phase 4 | Complete |
| CUST-07 | Phase 4 | Complete |
| CUST-08 | Phase 4 | Complete |
| CUST-09 | Phase 4 | Complete |
| CUST-10 | Phase 4 | Complete |
| CUST-11 | Phase 4 | Complete |
| CUST-12 | Phase 4 | Complete |
| SHARE-01 | Phase 4 | Complete |
| SHARE-02 | Phase 4 | Complete |
| SHARE-03 | Phase 4 | Complete |
| SHARE-04 | Phase 4 | Complete |
| SHARE-05 | Phase 4 | Complete |
| ALERT-01 | Phase 5 | Complete |
| ALERT-02 | Phase 5 | Complete |
| ALERT-03 | Phase 5 | Complete |
| ALERT-04 | Phase 5 | Complete |
| ALERT-05 | Phase 5 | Complete |
| ANLY-01 | Phase 5 | Complete |
| ANLY-02 | Phase 5 | Complete |
| ANLY-03 | Phase 5 | Complete |
| ANLY-04 | Phase 5 | Complete |
| ANLY-05 | Phase 5 | Complete |
| ANLY-06 | Phase 5 | Complete |
| DASH-01 | Phase 5 | Complete |
| DASH-02 | Phase 5 | Complete |
| DASH-03 | Phase 5 | Complete |
| DASH-04 | Phase 5 | Complete |
| DASH-05 | Phase 5 | Complete |

**Coverage:**
- v1 requirements: 92 total
- Mapped to phases: 92
- Unmapped: 0

---
*Requirements defined: 2025-01-18*
*Last updated: 2026-01-20 - All v1 requirements complete*
