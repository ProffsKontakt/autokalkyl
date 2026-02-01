# Domain Pitfalls: v1.2 Realistic Consumption & Peak Tariffs

**Domain:** Battery ROI calculator enhancement for Swedish market
**Project:** Kalkyla.se v1.2
**Researched:** 2026-02-01
**Focus:** Adding realistic consumption profiles and peak tariff calculations to existing system

---

## Critical Pitfalls

Mistakes that cause rewrites, broken calculations, or loss of existing data.

---

### Pitfall 1: Hardcoded Peak Value Scattered Throughout Codebase

**What goes wrong:** The current `currentPeakKw = 8` is hardcoded in at least 6 different locations across the codebase. Replacing this with manual input will miss some locations, causing inconsistent calculations between admin and public views.

**Why it happens:** Quick MVP decisions led to duplicated hardcoded values instead of centralized configuration. Current locations found via grep:
- `src/components/calculations/wizard/calculation-wizard.tsx:176` - "TODO: Get from customer data"
- `src/components/public/public-consumption-simulator.tsx:153` - "Default peak for residential"
- `src/components/calculations/wizard/steps/results-step.tsx:109,190`
- `src/actions/share.ts:458` - fallback estimate from annual consumption

**Consequences:**
- Salespeople enter manual peaks, but public view shows different numbers
- ROI discrepancies between admin and customer-facing pages
- Loss of trust when customers see different numbers than salespeople quoted
- Existing calculations may suddenly show different values

**Prevention:**
1. Create exhaustive grep search for ALL hardcoded peak values BEFORE starting
2. Create centralized peak configuration in calculation inputs type
3. Store peak input in Calculation model (new column or in JSON)
4. Ensure share endpoint uses stored peak values, not recalculated defaults
5. Add test case that verifies admin and public views show identical peak values

**Detection (warning signs):**
- Public view shows different effekt savings than admin view
- Peak shaving slider calculations don't match expected values
- Customer complaints about "numbers changed when I opened the link"

**Which phase should address:** Phase 1 (Data Model) - before any UI work

---

### Pitfall 2: Breaking Existing Calculation Results on Migration

**What goes wrong:** Existing 113+ validated calculations have `results` JSON stored with old schema. Adding new fields (heating type, seasonal distribution, peak input) may cause null pointer errors when rendering old calculations, or worse, silently recalculate them with default values.

**Why it happens:** JSON columns don't enforce schema, so old calculations lack new fields. Code assumes new fields exist without null checks.

**Consequences:**
- Existing customer links break with runtime errors
- Old calculations show wrong values after schema change
- Loss of audit trail - impossible to verify what customer originally saw

**Prevention:**
1. Add explicit version field to calculation results: `schemaVersion: 1` (current), `schemaVersion: 2` (v1.2)
2. Create migration script that backfills v1 calculations with default values
3. Keep rendering logic that handles missing fields with sensible defaults
4. Never auto-recalculate old calculations - preserve original results
5. Test with production calculation data BEFORE deployment

**Detection (warning signs):**
- `Cannot read property 'seasonalDistribution' of undefined` errors
- Old calculation links return 500 errors
- QA finds calculations with wildly different results after deployment

**Which phase should address:** Phase 1 (Data Model) - migration strategy FIRST

---

### Pitfall 3: Ellevio "3 Peaks Average" vs Simple Peak Multiplication

**What goes wrong:** The current formula `calcEffectTariffSavings(maxDischargeKw, effectTariffDayRate)` in `formulas.ts` assumes simple monthly multiplication. Ellevio's actual calculation averages the 3 highest hourly peaks across different days, with night hours counting at 50%. Implementing this correctly requires per-month peak data.

**Why it happens:** MVP simplification. Real Ellevio billing requires:
- Tracking 3 highest peaks per month (must be on different days)
- Night discount (22:00-06:00 peaks count as 50%)
- Monthly billing based on average of these 3 peaks
- 81.25 SEK/kW day rate for SE3 customers

Source: [Tibber - New Ellevio Tariffs](https://tibber.com/en/magazine/inside-tibber/new-ellevio-tariffs)

**Consequences:**
- Overestimated savings - current formula may promise 2-3x actual peak tariff reduction
- Customer disappointment when real bills don't match projections
- Loss of credibility with repeat customers

**Prevention:**
1. Document Ellevio's exact calculation method in code comments
2. Store per-month peak data (array of kW values per month) in calculation
3. Create separate formula `calcEllevioEffektAvgift()` that implements 3-peak averaging
4. Night peaks should be halved before comparison/averaging
5. Consider validation against real Ellevio bills from beta customers

**Detection (warning signs):**
- Peak tariff savings seem unrealistically high (>2x what customer actually saves)
- Sales team gets pushback: "my Ellevio bill doesn't match"
- Different grid operators produce identical savings

**Which phase should address:** Phase 3 (Calculator Engine) - before UI sliders

---

### Pitfall 4: Consumption Profile Seasonal Distribution Mismatch by Heating Type

**What goes wrong:** Swedish consumption patterns vary dramatically by heating type. A 20,000 kWh house with direktverkande el (direct electric heating) consumes 4-5x more in winter than summer. A house with fjärrvärme (district heating) has nearly flat electricity consumption year-round. Using wrong seasonal factors produces wildly inaccurate monthly peaks.

**Why it happens:** Current presets in `presets.ts` use generic factors. Real Swedish data shows:
- **Direktverkande el:** Winter 4-5x summer (heating = 90% of consumption)
- **Bergvärme (ground source heat pump):** Winter 2.5-3x summer
- **Fjärrvärme (district heating):** Nearly flat (electricity = household only, ~5,500 kWh/year constant)
- **Luft-vatten VP:** Winter 2-2.5x summer

Source: [1komma5 - Normal elforbrukning villa](https://1komma5.se/energi/elforbrukning-villa)

**Consequences:**
- Peak calculations wrong by 50-200% for some months
- Effect tariff savings grossly over/under-estimated
- Battery sizing recommendations wrong (battery can't shave peaks that don't exist)

**Prevention:**
1. Use Swedish Energy Agency data for heating type distributions
2. Create separate seasonal factor arrays per heating type in constants.ts:
   - Direktverkande el: `[1.5, 1.4, 1.2, 0.9, 0.6, 0.4, 0.3, 0.4, 0.6, 0.9, 1.2, 1.5]`
   - Bergvärme: `[1.3, 1.2, 1.0, 0.8, 0.7, 0.6, 0.6, 0.7, 0.8, 1.0, 1.2, 1.4]`
   - Fjärrvärme: `[1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]` (flat)
3. Validate total annual kWh after applying factors (should equal input)
4. Show seasonal distribution chart in UI for transparency

**Detection (warning signs):**
- Fjärrvärme customers show same winter peaks as direktverkande el
- Summer peak savings claimed for houses with no summer peaks
- Total annual kWh doesn't match when months are summed

**Which phase should address:** Phase 2 (Consumption Profiles) - core algorithm

---

## Moderate Pitfalls

Mistakes that cause delays, rework, or technical debt.

---

### Pitfall 5: PostHog Bot Detection Blocking Real Events

**What goes wrong:** PostHog's bot detection (enabled by default) silently blocks ALL events when it suspects automated traffic. This commonly happens during development (VS Code debugger launches Chrome with bot-like flags) but can also affect real users with browser extensions or corporate proxies.

**Why it happens:** PostHog checks user agent strings and browser characteristics. False positives are common. The PROJECT.md notes PostHog "isn't working well" - this is likely the root cause.

Source: [PostHog Bot Detection Issue](https://medium.com/@webmaster_84652/posthog-silently-blocked-all-my-analytics-events-and-the-console-log-i-completely-missed-36c67f9dbbed)

**Consequences:**
- Zero analytics data for days/weeks without anyone noticing
- Dashboard integration shows empty charts
- No visibility into customer behavior
- Feature flags (if used) may not work

**Prevention:**
1. Add `opt_out_useragent_filter: true` to PostHog init in posthog-provider.tsx
2. Add server-side event backup for critical events (calculation_viewed, calculation_finalized)
3. Create monitoring alert for "0 events in 24 hours"
4. Test PostHog with actual production traffic, not just dev
5. Look for console message: `[PostHog.js] [WebExperiments] Refusing to render... viewer is a likely bot`

**Detection (warning signs):**
- PostHog dashboard shows 0 events for extended periods
- Events work in production but not development
- Console shows bot detection messages

**Which phase should address:** Phase 5 (PostHog) - FIRST task in that phase

---

### Pitfall 6: Natagare Data Model Missing Peak Calculation Method

**What goes wrong:** Current Natagare model (`prisma/schema.prisma` lines 259-284) stores only day/night rates and hours. v1.2 requires storing the peak calculation METHOD (e.g., "3 peaks average" for Ellevio, "5 peaks winter" for Vattenfall). Without this, all natagare get same calculation, which is wrong.

**Why it happens:** MVP simplified to day/night rates. Different Swedish grid operators use different methods:
- **Ellevio:** Average of 3 highest hourly peaks per month, night at 50%
- **Vattenfall:** Average of 5 highest peaks, winter months only (implementing Oct 2026)
- **E.ON:** Varies by region

Source: [Vattenfall Effektguiden](https://www.vattenfalleldistribution.se/abonnemang-och-avgifter/avtal-och-avgifter/effektguiden/)

**Consequences:**
- Wrong calculations for non-Ellevio customers
- Can't expand to new grid operators without code changes
- Peak tariff logic scattered across codebase

**Prevention:**
1. Add `peakCalculationMethod` enum to Natagare model: `ELLEVIO_3_PEAK | VATTENFALL_5_PEAK_WINTER | SIMPLE`
2. Add `peakCount` field (3 for Ellevio, 5 for Vattenfall)
3. Add `seasonalRestriction` field (null or 'WINTER' for Nov-Mar)
4. Add `nightDiscountPercent` field (50 for Ellevio, 0 for others)
5. Create calculation method lookup/strategy pattern in engine.ts
6. Super Admin configures these fields per natagare

**Detection (warning signs):**
- All natagare produce identical peak savings
- Vattenfall customers complain about wrong calculations
- New grid operators require code changes, not config changes

**Which phase should address:** Phase 1 (Data Model) - schema update

---

### Pitfall 7: Manual Peak Input UI/UX Complexity

**What goes wrong:** Asking closers to input "kW per peak per month" (12 months x 3 peaks = 36 fields for Ellevio) creates unusable UI. They don't have this data readily available and will enter garbage or skip the feature entirely.

**Why it happens:** Technical correctness (we need peak data) conflicts with UX reality (salespeople don't have it). Most closers only know "annual kWh" and maybe "highest bill month."

**Consequences:**
- Feature goes unused
- Bad data produces bad calculations
- Sales team reverts to simple estimates, undermining accuracy goal

**Prevention:**
1. Provide smart defaults: estimate peaks from annual kWh + heating type + seasonal factors
2. Allow simplified input: "typical winter peak kW" + "typical summer peak kW"
3. Show preview: "Based on your input, we estimate monthly peaks of X, Y, Z"
4. Make detailed 12-month input OPTIONAL, not required
5. Consider "I don't know" option that uses model-based estimates
6. Add helper text explaining what peak kW means (max hourly usage)

**Detection (warning signs):**
- Low adoption of manual peak feature (tracked in PostHog)
- Unrealistic peak values (0.5 kW or 50 kW for residential)
- Support tickets asking "what should I enter?"

**Which phase should address:** Phase 4 (UI) - before launch

---

### Pitfall 8: Centralized Natagare Migration Breaking Org Data

**What goes wrong:** Moving natagare management from Org Admin to Super Admin only requires migrating existing org-scoped natagare records. Organizations may have custom natagare with custom rates. Migration could lose or duplicate this data.

**Why it happens:** Current model: natagare scoped to `orgId`. New model: natagare are global (Super Admin managed). Migration must handle:
- Duplicate names across orgs (Ellevio in Org A vs Ellevio in Org B)
- Custom rates that differ from "standard" Ellevio rates
- Existing calculations referencing org-specific natagare IDs

**Consequences:**
- Foreign key errors when org-natagare deleted
- Wrong rates applied to old calculations
- Loss of custom natagare configurations
- Calculations show "unknown natagare" error

**Prevention:**
1. Create migration plan BEFORE changing model
2. Inventory all existing natagare across all orgs (query + document)
3. Handle duplicates: merge if identical, create variants if different rates
4. Update `natagareId` references in existing calculations
5. Consider soft migration: add `isGlobal` flag, deprecate org-natagare, don't delete
6. Keep old natagare IDs working (alias to new global ones)

**Detection (warning signs):**
- Foreign key constraint violations on deploy
- Calculations showing "unknown natagare"
- Different orgs suddenly share rates they didn't before

**Which phase should address:** Phase 1 (Data Model) - migration first

---

## Minor Pitfalls

Mistakes that cause annoyance but are easily fixable.

---

### Pitfall 9: Spotpris Efficiency Display Bug Recurrence

**What goes wrong:** PROJECT.md mentions "90.2% displays correctly (not 90000.2%)" as a v1.2 bug fix. This formatting issue (percentage vs raw decimal) can reappear in new breakdowns or displays if multiplied incorrectly.

**Why it happens:** Inconsistent handling of percentage values - sometimes stored as 0.902, sometimes as 90.2. Display code must know which format.

**Prevention:**
1. Establish convention: store percentages as decimals (0.902) in types.ts, display with x100
2. Create utility function `formatPercent(decimal: number): string` used everywhere
3. Add unit tests for percentage display in all breakdown components
4. Document convention in CONTRIBUTING.md

**Detection (warning signs):**
- Any percentage > 100 or < 0.001 in display
- "90000.2%" anywhere in UI
- Inconsistent percentage formatting across pages

**Which phase should address:** Phase 3 (Calculator Engine) - format consistency

---

### Pitfall 10: Override System Interaction with New Fields

**What goes wrong:** v1.1 added `overrides` JSON for manual value adjustments. v1.2 adds new calculated fields (seasonal savings, peak method, etc.). If override system doesn't account for new fields, closers can't override them, or worse, old overrides corrupt new calculations.

**Why it happens:** Override schema must evolve with calculation results. New fields need:
- Nullable override slots in CalculationOverrides type
- Merge logic with calculated values
- UI controls for new overrides

**Prevention:**
1. Document override schema version alongside results schema
2. New fields start with `override: null` (use calculated)
3. Test that old overrides don't break new calculations
4. Add new override controls for new ROI components if needed
5. Consider deprecating old override fields if semantics change

**Detection (warning signs):**
- "Cannot override seasonal distribution" complaints
- Old calculations show unexpected values after override
- Override UI missing new fields

**Which phase should address:** Phase 3 (Calculator Engine) - parallel with new fields

---

### Pitfall 11: PostHog Dashboard Data Not Auto-Populating

**What goes wrong:** PostHog dashboards require explicit configuration to show new events and properties. Adding new tracking events without dashboard updates leaves analytics invisible.

**Why it happens:** PostHog auto-discovers events but doesn't auto-add them to dashboards. New properties need manual insight creation.

Source: [PostHog Migration Planning](https://posthog.com/docs/new-to-posthog/switch-guide/migration-planning)

**Prevention:**
1. Create PostHog dashboard template for v1.2 metrics
2. Document all new events and their properties
3. Set up insights for: heating type distribution, peak input usage, seasonal view interactions
4. Test dashboard population in staging before prod deploy

**Detection (warning signs):**
- New events tracked but not visible in dashboards
- "0 results" for new event insights
- Missing conversion funnels

**Which phase should address:** Phase 5 (PostHog) - after event implementation

---

## Phase-Specific Warnings

| Phase | Likely Pitfall | Mitigation | Severity |
|-------|---------------|------------|----------|
| Data Model | Breaking existing calculations (#2) | Schema versioning, backfill migration | CRITICAL |
| Data Model | Natagare migration data loss (#8) | Inventory + soft migration | MODERATE |
| Data Model | Missing peak calculation method (#6) | Add enum and fields to Natagare | MODERATE |
| Consumption Profiles | Wrong seasonal factors by heating type (#4) | Use Swedish Energy Agency data | CRITICAL |
| Calculator Engine | Ellevio method oversimplification (#3) | 3-peak averaging formula | CRITICAL |
| Calculator Engine | Hardcoded peak scattered (#1) | Grep audit, centralize | CRITICAL |
| Calculator Engine | Override compatibility (#10) | Schema versioning | MINOR |
| UI/Wizard | Manual peak input UX (#7) | Smart defaults, optional detail | MODERATE |
| PostHog | Bot detection blocking events (#5) | Config flag + monitoring | MODERATE |
| PostHog | Dashboard not auto-populating (#11) | Manual dashboard setup | MINOR |

---

## Integration Risk Summary

The highest risk in v1.2 comes from **integration with existing data**, not new features:

1. **113 existing calculations** must continue to work and display correctly
2. **Org-scoped natagare** must migrate without breaking foreign keys
3. **Hardcoded peaks** must be found and centralized everywhere
4. **Override system** must handle schema evolution

**Recommendation:** Phase 1 should be purely data model + migration, with no UI changes. Validate existing calculations still render before proceeding.

---

## Pre-Implementation Checklist

Before starting v1.2 development:

- [ ] Grep for ALL `currentPeakKw` and `8` (peak) references
- [ ] Query production for all unique natagare across orgs
- [ ] Query production for calculation count and sample results schema
- [ ] Verify PostHog is actually receiving events (check dashboard)
- [ ] Document current presets.ts seasonal factors
- [ ] Review constraints.ts for peak shaving formula assumptions

---

## Sources

**Swedish Consumption by Heating Type:**
- [1komma5 - Normal elforbrukning villa](https://1komma5.se/energi/elforbrukning-villa) - heating type consumption figures
- [hemsol.se - Elforbrukning villa](https://hemsol.se/solceller/elforbrukning-villa/) - seasonal variation data
- [Swedish Energy Agency Statistics](https://www.energimyndigheten.se/en/facts-and-figures/statistics/) - official data source

**Swedish Grid Operator Peak Tariffs:**
- [Tibber - New Ellevio Tariffs](https://tibber.com/en/magazine/inside-tibber/new-ellevio-tariffs) - Ellevio 3-peak method
- [Sourceful Energy - Stockholm Peak Fees](https://sourceful.energy/blog/how-stockholm-homeowners-are-saving-2-925-kr-per-year-on-peak-demand-fees) - 81.25 kr/kW rates
- [Ellevio - Effektavgiften](https://www.ellevio.se/abonnemang/ny-prismodell-baserad-pa-effekt/) - official Ellevio documentation
- [Vattenfall Effektguiden](https://www.vattenfalleldistribution.se/abonnemang-och-avgifter/avtal-och-avgifter/effektguiden/) - Vattenfall pending implementation

**PostHog Integration:**
- [PostHog Troubleshooting Docs](https://posthog.com/docs/product-analytics/troubleshooting) - debugging guide
- [PostHog Bot Detection Issue](https://medium.com/@webmaster_84652/posthog-silently-blocked-all-my-analytics-events-and-the-console-log-i-completely-missed-36c67f9dbbed) - common bot filter problem
- [PostHog Migration Planning](https://posthog.com/docs/new-to-posthog/switch-guide/migration-planning) - dashboard rebuild guidance

**Peak Shaving ROI:**
- [gridX Peak Shaving Guide](https://www.gridx.ai/knowledge/peak-shaving) - calculation methodology
- [EticaAG BESS ROI Guide](https://eticaag.com/roi-for-battery-energy-storage-systems/) - common pitfalls
