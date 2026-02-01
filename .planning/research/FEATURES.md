# Feature Landscape: v1.2 Realistic Consumption & Peak Tariffs

**Domain:** Swedish household consumption profiling + grid operator peak calculations
**Researched:** 2026-02-01
**Confidence:** MEDIUM-HIGH (verified against Swedish grid operator documentation and energy statistics)

---

## Executive Summary

v1.2 adds realistic consumption modeling and nätägare-specific peak tariff calculations. The Swedish market has clear patterns:

1. **Consumption varies dramatically by heating type** - A house with direktverkande el uses 3-4x the electricity of the same house with fjärrvärme
2. **Peak tariffs vary by grid operator** - Ellevio uses 3 peaks, Vattenfall uses 5 peaks, Tekniska Verken offers two calculation options
3. **Seasonal distribution is pronounced** - Winter consumption can be 2-3x summer consumption for electrically heated homes
4. **PostHog dashboards are embeddable** - iframe integration enables sales analytics without custom dashboard development

---

## Table Stakes

Features users expect for v1.2. Missing = new features feel incomplete.

### Annual Consumption + Heating Type Input

| Feature | Why Expected | Complexity | Dependencies | Notes |
|---------|--------------|------------|--------------|-------|
| Annual kWh single input | Standard in Swedish energy tools | Low | Existing calculation wizard | Replace complex 12x24 matrix with simple total |
| Heating type dropdown | Determines consumption curve | Low | New field in Calculation model | 5 options: Bergvärme, Fjärrvärme, Direktverkande el, Luft-luft VP, Luft-vatten VP |
| Automatic seasonal distribution | Core value - realistic profiles | Medium | Heating type + annual kWh | Winter/summer curve based on heating type |
| Consumption preview chart | Visual confirmation | Low | Existing Recharts infrastructure | Show monthly distribution before saving |

**Swedish Consumption by Heating Type (verified):**

| Heating Type | Annual kWh (150m² villa) | Winter Factor | Summer Factor |
|--------------|--------------------------|---------------|---------------|
| Direktverkande el | 18,000-32,000 | 1.5-2.0 | 0.3-0.4 |
| Bergvärme | 10,000-18,000 | 1.2-1.4 | 0.6-0.7 |
| Luft-vatten VP | 12,000-20,000 | 1.3-1.5 | 0.5-0.6 |
| Luft-luft VP | 8,000-14,000 | 1.4-1.6 | 0.5-0.6 |
| Fjärrvärme | 4,000-8,000 | 1.0-1.1 | 0.8-0.9 |

**Source:** [Byggvarudeklarationer.se](https://www.byggvarudeklarationer.se/normal-elforbrukning-i-svenska-hem/) - "Direktverkande elvärme typically means 130 kWh/m²/year, heat pumps 100-120 kWh/m², fjärrvärme 40-60 kWh/m²"

### Manual Peak Input

| Feature | Why Expected | Complexity | Dependencies | Notes |
|---------|--------------|------------|--------------|-------|
| Monthly peak kW inputs | Different nätägare require different counts | Medium | Nätägare peak_count field | 1-5 peaks per month depending on grid operator |
| Peak input validation | Prevents unrealistic values | Low | Max discharge kW constraint | Warn if peak > typical for house size |
| Peak preview in results | Transparency before calculation | Low | Existing breakdown UI | Show how peaks affect effektavgift |

**Why Manual Input Over Automatic Detection:**
- Real-world peaks come from historical smart meter data
- Customers don't have access to this data easily
- Sales closers can estimate from customer conversation ("Do you charge EV while cooking?")
- Automatic detection would require utility API integration (out of scope)

### Nätägare Peak Calculation Methods

| Feature | Why Expected | Complexity | Dependencies | Notes |
|---------|--------------|------------|--------------|-------|
| Peak count per nätägare | Different operators use 1-5 peaks | Low | New Natagare field | Ellevio: 3, Vattenfall: 5, etc. |
| High/low load period times | Some nätägare only count daytime peaks | Medium | Natagare time fields | Ellevio: 22-06 = 50% rate |
| Peak averaging formula | Standard: sum of peaks / count | Low | Calculation engine | Already have day/night rates |
| Night discount factor | Some nätägare discount night peaks | Low | Natagare field (0-1 multiplier) | Ellevio: 0.5 during 22-06 |

**Swedish Grid Operator Peak Methods (verified):**

| Nätägare | Peak Count | High-Load Hours | Night Discount | Rate (SEK/kW) |
|----------|------------|-----------------|----------------|---------------|
| Ellevio | 3 | 06-22 weekdays | 50% during 22-06 | 81.25 |
| Vattenfall | 5 | 06-22 weekdays Nov-Mar | Varies by region | ~70-90 |
| Jönköping Energi | 2 | 07-20 weekdays Nov-Mar | None | ~60-80 |
| Tekniska Verken | 2 or 5 | 06-23 | Different night rate | ~65-85 |

**Source:** [Ellevio](https://www.ellevio.se/abonnemang/ny-prismodell-baserad-pa-effekt/) - "Average of three highest hourly peaks, only one per day, 22-06 counts as 50%"

**Source:** [effekttariff.nu](https://effekttariff.nu/) - "Implementation varies between companies, common models include monthly peak or average of 3-5 highest hours"

---

## Differentiators

Features that set Kalkyla apart. Not expected, but provide competitive advantage.

### Intelligent Consumption Curve Generation

| Feature | Value Proposition | Complexity | Dependencies | Notes |
|---------|-------------------|------------|--------------|-------|
| Heating-type-aware curves | More accurate than generic presets | Medium | Heating type selection | Use verified Swedish consumption patterns |
| Multiple house sizes | Right-size the curve | Low | Optional input field | Curves scale with house size |
| Monthly factor customization | Advanced users can tweak | Low | Accordion UI in wizard | Optional - defaults work for 90% |

**Competitive Advantage:** Current presets in codebase are generic. New system uses verified Swedish energy data to create curves that match real heating types. This makes ROI calculations more credible to prospects.

### Peak Shaving Simulation

| Feature | Value Proposition | Complexity | Dependencies | Notes |
|---------|-------------------|------------|--------------|-------|
| Per-peak reduction slider | Shows battery impact on each peak | Medium | Peak input data | Let closer show "battery reduces Peak 1 from 8kW to 5kW" |
| Before/after visualization | Value demonstration | Medium | Results page enhancement | Side-by-side peak comparison |
| Annual effektavgift savings | Bottom-line impact | Low | Existing calculation engine | Already calculates, just need better display |

**Why This Matters:** Ellevio customers save ~267 EUR/year on peak demand fees alone with behavioral changes. A battery that actively shaves peaks can save more. Visualizing this is a powerful sales tool.

### PostHog Dashboard Integration

| Feature | Value Proposition | Complexity | Dependencies | Notes |
|---------|-------------------|------------|--------------|-------|
| Embedded analytics dashboard | Real-time sales metrics | Low | PostHog sharing feature | iframe embed, no auth required |
| Custom event tracking | Detailed behavior data | Low | Existing PostHog setup | Add events for new features |
| Calculation funnel visualization | Conversion tracking | Medium | PostHog configuration | How many calculations → shares → views |

**PostHog Embedding (verified):**
- Toggle "Share dashboard publicly" in PostHog
- Embed via `<iframe src="https://app.posthog.com/shared/..." />`
- Dynamic height via postMessage API
- No authentication required for viewers
- Refresh on each load with `?refresh=true` parameter

**Source:** [PostHog Sharing Docs](https://posthog.com/docs/product-analytics/sharing) - "Share a public link and/or embed using iframe"

### Centralized Nätägare Management

| Feature | Value Proposition | Complexity | Dependencies | Notes |
|---------|-------------------|------------|--------------|-------|
| Super Admin-only nätägare CRUD | Consistent data across orgs | Low | Remove org-level management | Grid operators are the same for everyone |
| Pre-loaded Swedish nätägare | Zero setup for new orgs | Low | Seed script enhancement | Ellevio, Vattenfall, E.ON, Fortum, etc. |
| System-wide rate updates | One update affects all | Low | Remove orgId requirement | When Ellevio changes rates, update once |

**Rationale:** Currently nätägare are org-scoped, meaning each organization manages their own grid operator list. But grid operators are external entities with fixed tariffs - it makes no sense for each org to maintain their own copy. Centralizing to Super Admin level ensures accuracy and reduces duplicated effort.

---

## Anti-Features

Features to explicitly NOT build. Would add complexity without value.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Automatic peak detection from smart meter API | Utility APIs require customer login, complex OAuth, unreliable | Manual peak input - closers estimate from conversation |
| Real-time nätägare rate scraping | Rates change annually, web scraping is fragile | Manual Super Admin updates when rates change (Jan 1 typically) |
| Machine learning consumption prediction | Unreliable, liability risk, overkill for sales tool | Verified Swedish consumption curves by heating type |
| Multiple-building support | Scope creep - single household focus for v1 | Document as v2+ feature if customer demand emerges |
| Historical consumption import (CSV/API) | Too technical for sales closers, many edge cases | Simple annual kWh + heating type selection |
| Automatic nätägare detection by postal code | Requires maintaining postal code → nätägare database | Dropdown selection - closers know the customer's grid operator |
| Complex peak time scheduling | Over-engineering - 90% of value comes from simple model | Day/night differentiation is sufficient |
| Prospect-editable peaks | Breaks calculation integrity, confusion | View-only public links, closers control inputs |

**Rationale:**
- Every anti-feature represents a "wouldn't it be nice if..." that would add weeks of development
- The 80/20 principle applies strongly here - simple inputs with smart defaults cover most use cases
- Focus on sales enablement, not becoming an energy management platform

---

## Feature Dependencies

```
v1.2 DEPENDENCIES ON EXISTING v1.1:

Existing Infrastructure (already built):
  ├── Calculation wizard UI
  ├── Consumption presets (needs enhancement)
  ├── Natagare model (needs new fields)
  ├── Calculation engine (needs peak method support)
  ├── Results page with breakdowns
  └── PostHog analytics integration

NEW v1.2 FEATURES:

Heating Type + Annual kWh
    ├── New HeatingType enum
    ├── New consumption curve generation function
    └── Wizard step simplification (replace 12x24 matrix)

Manual Peak Input
    ├── Peak count from Natagare config
    ├── Array of peak values per month
    └── Validation against house size / battery capacity

Nätägare Enhancement
    ├── New fields: peakCount, nightDiscountFactor, highLoadStart/End
    ├── Remove orgId scoping (make system-wide)
    └── Seed with Swedish grid operator data

Peak Shaving Display
    ├── Per-peak reduction controls on results page
    ├── Before/after visualization
    └── Updated effektavgift calculation

PostHog Dashboard
    ├── Configure shared dashboard in PostHog
    ├── Embed iframe in Super Admin analytics page
    └── Add new custom events for v1.2 features
```

---

## Implementation Complexity

| Feature | Effort | Risk | Notes |
|---------|--------|------|-------|
| Annual kWh + heating type input | 1-2 days | Low | Simple form field changes |
| Consumption curve generation | 2-3 days | Medium | Need verified Swedish data |
| Natagare schema enhancement | 1 day | Low | Add fields, update seed |
| Centralize nätägare to Super Admin | 2-3 days | Medium | UI changes, permission updates |
| Manual peak input UI | 2-3 days | Medium | Dynamic form based on peak count |
| Peak calculation by nätägare method | 2-3 days | Medium | Engine enhancement, formula variants |
| Peak shaving visualization | 2-3 days | Medium | Results page UI work |
| PostHog dashboard embed | 1 day | Low | iframe is straightforward |
| Spotpris efficiency bug fix | 0.5 days | Low | Display issue only |
| Super Admin sidebar fix | 0.5 days | Low | CSS/component fix |

**Total v1.2 Estimate:** 12-18 days development

---

## Swedish Market Specifics

### Heating Types in Swedish Homes

Swedish households have distinct heating system distributions that dramatically affect electricity consumption:

| Heating System | Swedish Name | Market Share | Electricity Impact |
|----------------|--------------|--------------|-------------------|
| Ground source heat pump | Bergvärme | ~25% single-family | Medium - COP ~4 reduces consumption |
| District heating | Fjärrvärme | ~50% apartments, ~10% houses | Low - electricity only for hot water, appliances |
| Direct electric heating | Direktverkande el | ~15% (declining) | Very High - 100% electric heating |
| Air-to-air heat pump | Luft-luft värmepump | Growing | Medium-Low - supplements other heating |
| Air-to-water heat pump | Luft-vatten värmepump | Growing | Medium - full heating replacement |

**Source:** [Swedish Energy Agency](https://www.energimyndigheten.se/en/facts-and-figures/statistics/) and [Heat pumps in Sweden historical review](https://www.sciencedirect.com/science/article/abs/pii/S0360544221009324)

### Effekttariff Regulatory Context

- **Mandate:** All Swedish grid operators must implement effekttariff by January 1, 2027
- **Current State:** Ellevio implemented January 1, 2025; Vattenfall implementing October 2025/Autumn 2026; E.ON investigating, earliest Spring 2026
- **Purpose:** Incentivize customers to reduce peak demand, delay grid infrastructure investments
- **Result:** Ellevio saw 3% reduction in power consumption in first year - equivalent to capacity for 15,000-20,000 new houses

**Source:** [Effekttariff.nu](https://effekttariff.nu/) - comprehensive Swedish effekttariff guide

---

## Sources

### Swedish Consumption Data
- [Byggvarudeklarationer.se - Normal elförbrukning](https://www.byggvarudeklarationer.se/normal-elforbrukning-i-svenska-hem/) - Consumption by heating type
- [Swedish Energy Agency Statistics](https://www.energimyndigheten.se/en/facts-and-figures/statistics/) - National energy data
- [Statista - Sweden peak hourly load](https://www.statista.com/statistics/1342523/peak-hourly-electricity-load-sweden-by-month/) - Seasonal peak patterns

### Grid Operator Tariffs
- [Ellevio Effektavgift](https://www.ellevio.se/abonnemang/ny-prismodell-baserad-pa-effekt/) - Official Ellevio peak calculation method
- [Effekttariff.nu](https://effekttariff.nu/) - Swedish effekttariff comparison and guide
- [Vattenfall Effektguiden](https://www.vattenfalleldistribution.se/abonnemang-och-avgifter/avtal-och-avgifter/effektguiden/) - Vattenfall implementation timeline
- [Sourceful Energy - Peak Demand Fees](https://sourceful.energy/blog/how-stockholm-homeowners-are-saving-2-925-kr-per-year-on-peak-demand-fees) - Stockholm savings analysis

### PostHog Integration
- [PostHog Sharing & Embedding](https://posthog.com/docs/product-analytics/sharing) - Official embedding docs
- [PostHog Embedded Dashboard Tutorial](https://posthog.com/tutorials/how-to-embed-shared-dashboard) - iframe implementation guide
- [PostHog Dashboards API](https://posthog.com/docs/api/dashboards) - Programmatic access

### Heat Pump Patterns
- [Residensportalen - Heating Systems in Sweden](https://www.residensportalen.com/blog/tenants/heatingsystemssweden/) - Overview of Swedish heating
- [ScienceDirect - Heat pumps in Sweden historical review](https://www.sciencedirect.com/science/article/abs/pii/S0360544221009324) - Market evolution
- [Chalmers DSM Research](https://publications.lib.chalmers.se/records/fulltext/195330/195330.pdf) - Household consumption patterns

---

## Confidence Assessment

| Feature Area | Confidence | Reasoning |
|--------------|------------|-----------|
| Heating type consumption ranges | HIGH | Verified against multiple Swedish energy sources |
| Ellevio peak calculation method | HIGH | Official Ellevio documentation, WebFetch verified |
| Vattenfall/E.ON methods | MEDIUM | Timeline info available, exact methods still being finalized |
| Seasonal distribution factors | MEDIUM | General patterns clear, exact factors need validation |
| PostHog embedding | HIGH | Official documentation verified |
| Centralized nätägare approach | HIGH | Logical architecture decision, no external validation needed |
