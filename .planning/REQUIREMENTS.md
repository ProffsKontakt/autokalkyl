# Requirements: Kalkyla.se

**Defined:** 2026-02-05
**Core Value:** Closers can build accurate, interactive battery ROI calculations and share them with prospects who can tweak their own consumption to see real savings.

## v1.3 Requirements

Requirements for v1.3 Combo & Avgifter milestone. Each maps to roadmap phases.

### Electricity Inputs

- [x] **ELEC-01**: Closer can input customer's annual purchased electricity (kopt el) in kWh
- [x] **ELEC-02**: Closer can input customer's electricity price (annual total or monthly average)
- [x] **ELEC-03**: Closer can toggle between annual and monthly price input modes
- [x] **ELEC-04**: Closer can input customer's existing solar production (egenproducerad el) in kWh/year
- [x] **ELEC-05**: Egenproducerad el reduces kopt el in calculations (solar offsets grid consumption)
- [x] **ELEC-06**: Net consumption (kopt el - egenproducerad el) used as basis for savings calculations

### Grid Fees & Taxes

- [x] **FEES-01**: Calculation includes energiskatt at 45 ore/kWh
- [x] **FEES-02**: Calculation includes overforingsavgift per natagare (ore/kWh)
- [x] **FEES-03**: Calculation includes moms at 25% for privatperson
- [x] **FEES-04**: All fee components visible in calculation breakdown
- [x] **FEES-05**: Total electricity cost displayed with all components

### Customer Type

- [x] **CUST-01**: Closer can toggle customer type: Privatperson vs Foretag
- [x] **CUST-02**: Foretag calculations exclude moms (VAT) from cost basis
- [x] **CUST-03**: Customer type affects all price displays and savings calculations
- [x] **CUST-04**: Customer type visible in calculation summary and public view

### Natagare Configuration

- [ ] **NATA-12**: Super Admin can configure overforingsavgift (ore/kWh) per natagare
- [ ] **NATA-13**: Super Admin can configure effect tariff timing (high-load hours, night hours)
- [ ] **NATA-14**: Effect tariff timing used in peak calculations (day/night, summer/winter)

### Multi-Battery Combo

- [ ] **COMBO-01**: Closer can add multiple batteries to a calculation
- [ ] **COMBO-02**: Closer can toggle between "Jamfora" (compare) and "Komboinvestering" (combine) modes
- [ ] **COMBO-03**: Komboinvestering requires same battery model for all units
- [ ] **COMBO-04**: Komboinvestering combines battery capacity (e.g., 2x 15.36 kWh = 30.72 kWh)
- [ ] **COMBO-05**: Komboinvestering combines battery price (e.g., 2x 89,900 = 179,800 SEK)
- [ ] **COMBO-06**: Grid services income stacks per qualifying unit (each 15.36 kWh Emaldo = separate enrollment)
- [ ] **COMBO-07**: Peak shaving capacity uses combined system capacity
- [ ] **COMBO-08**: Spotpris optimization uses combined system capacity
- [ ] **COMBO-09**: Jamfora mode shows side-by-side comparison (different quantities or different models)
- [ ] **COMBO-10**: Jamfora mode supports comparing up to 3 configurations

## Previous Milestones (Validated)

All v1.0, v1.1, and v1.2 requirements shipped. See PROJECT.md for full list.

**Summary:**
- v1.0 MVP: 92 requirements (AUTH, ORG, USER, BATT, NATA, ELEC, CALC, LOGIC, CUST, SHARE, ALERT, ANLY, DASH)
- v1.1 Fixed ROI: 21 requirements (SPOT, GRID, PEAK, TRANS, OVRD)
- v1.2 Consumption & Peak: 27 requirements (CONS, PEAK, NATA, ANLY, FIX)

**Total validated: 140 requirements**

## Out of Scope

| Feature | Reason |
|---------|--------|
| Solar panel sales/sizing | v1.3 adds existing solar input only, not panel sales |
| Automatic peak detection from utility API | Requires OAuth integration, high complexity |
| Different battery models in combo | Komboinvestering requires same model for accurate calculations |
| More than 3 comparison configurations | UX complexity, 3 is sufficient for sales context |
| Real-time spot price display | Prices change constantly, creates confusion and liability |
| Customer self-registration | Spam risk, admin-controlled access preferred |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| ELEC-01 | Phase 15 | Complete |
| ELEC-02 | Phase 15 | Complete |
| ELEC-03 | Phase 15 | Complete |
| ELEC-04 | Phase 15 | Complete |
| ELEC-05 | Phase 15 | Complete |
| ELEC-06 | Phase 15 | Complete |
| FEES-01 | Phase 16 | Complete |
| FEES-02 | Phase 16 | Complete |
| FEES-03 | Phase 16 | Complete |
| FEES-04 | Phase 16 | Complete |
| FEES-05 | Phase 16 | Complete |
| CUST-01 | Phase 15 | Complete |
| CUST-02 | Phase 15 | Complete |
| CUST-03 | Phase 15 | Complete |
| CUST-04 | Phase 15 | Complete |
| NATA-12 | Phase 14 | Complete |
| NATA-13 | Phase 14 | Complete |
| NATA-14 | Phase 14 | Complete |
| COMBO-01 | Phase 17 | Pending |
| COMBO-02 | Phase 17 | Pending |
| COMBO-03 | Phase 17 | Pending |
| COMBO-04 | Phase 17 | Pending |
| COMBO-05 | Phase 17 | Pending |
| COMBO-06 | Phase 17 | Pending |
| COMBO-07 | Phase 17 | Pending |
| COMBO-08 | Phase 17 | Pending |
| COMBO-09 | Phase 17 | Pending |
| COMBO-10 | Phase 17 | Pending |

**Coverage:**
- v1.3 requirements: 28 total
- Mapped to phases: 28
- Unmapped: 0

---
*Requirements defined: 2026-02-05*
*Last updated: 2026-02-05 (traceability completed)*
