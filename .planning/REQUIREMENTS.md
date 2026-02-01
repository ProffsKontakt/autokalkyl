# Requirements: Kalkyla.se v1.2

**Defined:** 2026-02-01
**Core Value:** Closers can build accurate, interactive battery ROI calculations that prospects can customize to see real savings.

## v1.2 Requirements

Requirements for v1.2 Realistic Consumption & Peak Tariffs. Each maps to roadmap phases.

### Consumption Profiles

- [ ] **CONS-01**: User can input annual electricity consumption in kWh
- [ ] **CONS-02**: User can select heating type from: Bergvärme, Fjärrvärme, Direktverkande el, Luft-luft VP, Luft-vatten VP
- [ ] **CONS-03**: System generates monthly consumption distribution based on heating type and seasonal factors
- [ ] **CONS-04**: User can view visual curve showing monthly consumption distribution
- [ ] **CONS-05**: Seasonal factors reflect Swedish consumption patterns (higher winter, lower summer, varies by heating type)

### Peak Tariffs

- [ ] **PEAK-05**: User can input target average peak (kW) to maintain
- [ ] **PEAK-06**: User can input target monthly peak ceiling (kW)
- [ ] **PEAK-07**: Super Admin can configure peak calculation method per nätägare (e.g., Ellevio: 3 highest hourly peaks)
- [ ] **PEAK-08**: System automatically applies night discount based on nätägare configuration (e.g., Ellevio: 50% for 22:00-06:00)
- [ ] **PEAK-09**: Results page shows peak shaving impact with before/after comparison
- [ ] **PEAK-10**: Peak calculations respect battery capacity constraints (cycles/day, max kW shaveable)

### Nätägare Management

- [ ] **NATA-06**: All existing nätägare are migrated to global scope (Super Admin managed)
- [ ] **NATA-07**: Super Admin can configure peak calculation method per nätägare
- [ ] **NATA-08**: Super Admin can configure night discount percentage and hours per nätägare
- [ ] **NATA-09**: Org Admin can create new nätägare if missing from global list
- [ ] **NATA-10**: Closer and Org Admin can only select nätägare, not edit configurations
- [ ] **NATA-11**: Nätägare selection in calculation uses global list

### Analytics & Tracking

- [ ] **ANLY-07**: PostHog configuration is fixed (bot detection disabled, events flowing)
- [ ] **ANLY-08**: Server-side events capture calculation creation, updates, and views
- [ ] **ANLY-09**: Super Admin dashboard shows embedded PostHog analytics for all calculations
- [ ] **ANLY-10**: Org Admin dashboard shows embedded analytics for organization's calculations
- [ ] **ANLY-11**: Closer dashboard shows embedded analytics for their own calculations only
- [ ] **ANLY-12**: Dashboards auto-populate with calculation metrics (views, time on page, sections viewed)

### Bug Fixes

- [ ] **FIX-01**: Spotpris efficiency displays correctly (90.2% not 90000.2%)
- [ ] **FIX-02**: Super Admin sidebar menu is permanent (not hover-triggered)
- [ ] **FIX-03**: Hardcoded currentPeakKw values are centralized and use customer input
- [ ] **FIX-04**: Spotpris breakdown displays correctly (verkningsgrad as %, daglig energi/besparing with correct values)

## Future Requirements

Deferred to later milestones.

### Extended Nätägare Support

- **NATA-F01**: Vattenfall peak calculation method (5 highest winter peaks)
- **NATA-F02**: E.ON peak calculation method (TBD by operator)
- **NATA-F03**: Additional grid operators as needed

### Advanced Consumption

- **CONS-F01**: Smart defaults based on house type/size
- **CONS-F02**: EV charging impact on consumption profile
- **CONS-F03**: Solar production integration with consumption

## Out of Scope

Explicitly excluded from v1.2.

| Feature | Reason |
|---------|--------|
| Automatic peak detection from utility API | Requires OAuth integration, high complexity |
| Real-time spot price in dashboards | Prices change constantly, liability risk |
| Per-day consumption input | Overkill for ROI estimation, monthly sufficient |
| Custom seasonal curves | Heating type presets cover 95% of cases |
| Multiple nätägare per calculation | Swedish customers have one grid operator |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CONS-01 | TBD | Pending |
| CONS-02 | TBD | Pending |
| CONS-03 | TBD | Pending |
| CONS-04 | TBD | Pending |
| CONS-05 | TBD | Pending |
| PEAK-05 | TBD | Pending |
| PEAK-06 | TBD | Pending |
| PEAK-07 | TBD | Pending |
| PEAK-08 | TBD | Pending |
| PEAK-09 | TBD | Pending |
| PEAK-10 | TBD | Pending |
| NATA-06 | TBD | Pending |
| NATA-07 | TBD | Pending |
| NATA-08 | TBD | Pending |
| NATA-09 | TBD | Pending |
| NATA-10 | TBD | Pending |
| NATA-11 | TBD | Pending |
| ANLY-07 | TBD | Pending |
| ANLY-08 | TBD | Pending |
| ANLY-09 | TBD | Pending |
| ANLY-10 | TBD | Pending |
| ANLY-11 | TBD | Pending |
| ANLY-12 | TBD | Pending |
| FIX-01 | TBD | Pending |
| FIX-02 | TBD | Pending |
| FIX-03 | TBD | Pending |
| FIX-04 | TBD | Pending |

**Coverage:**
- v1.2 requirements: 26 total
- Mapped to phases: 0
- Unmapped: 25 ⚠️

---
*Requirements defined: 2026-02-01*
*Last updated: 2026-02-01 after initial definition*
