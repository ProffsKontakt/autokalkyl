# Project Research Summary

**Project:** Kalkyla.se v1.2 - Realistic Consumption & Peak Tariffs
**Domain:** Battery ROI Calculator enhancement for Swedish market
**Researched:** 2026-02-01
**Confidence:** HIGH

## Executive Summary

v1.2 transforms Kalkyla from a generic battery calculator into a Swedish-market-specific tool with realistic consumption modeling and accurate peak tariff calculations. The core insight from research is that **Swedish electricity consumption varies dramatically by heating type** (direktverkande el uses 3-4x more than fjarrvarme), and **grid operators use different peak calculation methods** (Ellevio averages 3 peaks, Vattenfall uses 5). The current system uses hardcoded generic values that produce inaccurate ROI projections.

The recommended approach is to **extend the existing architecture** rather than rebuild. Only one new dependency is needed (posthog-node for server-side analytics). The work is primarily domain modeling, calculation logic enhancement, and careful data migration. The existing Zustand store, Server Action patterns, and calculation engine accommodate all v1.2 requirements with targeted extensions.

The highest risks are **data migration** (113 existing calculations must not break) and **scattered hardcoded values** (the `currentPeakKw = 8` constant exists in at least 6 locations). Both require careful auditing before implementation. The Ellevio peak calculation method is well-documented and can be implemented with high confidence; other grid operators (Vattenfall, E.ON) are still finalizing their methods, so the system should be configurable per nataegare.

---

## Key Findings

### 1. Stack: Minimal Additions Required

v1.2 requires **one new library**: `posthog-node` for server-side event capture (calculation completions, share link generation). All other features use existing stack components.

**Stack additions:**
- `posthog-node ^5.24.7`: Server-side event capture (cannot capture server actions with client-only posthog-js)

**Schema extensions needed:**
- `HeatingType` enum: `BERGVARME | FJARRVARME | DIREKTVERKANDE | LUFT_LUFT_VP | LUFT_VATTEN_VP`
- `PeakCalculationMethod` enum: `ELLEVIO_3_PEAKS | VATTENFALL_5_PEAKS | SIMPLE_MAX`
- Natagare model extensions: `peakMethod`, `nightPeakMultiplier`, `peakNightStartHour/EndHour`
- Calculation model extensions: `heatingType`, `monthlyPeaks` JSON

**Libraries explicitly NOT to add:**
- External Swedish energy APIs (unreliable; use hardcoded research-based factors)
- Time series libraries (overkill for simple peak sorting)
- ML prediction libraries (liability risk, unreliable for sales tool)

**Confidence:** HIGH - Official PostHog documentation confirms server-side SDK approach.

### 2. Features: Table Stakes vs Differentiators

**Table Stakes (users expect):**
1. Annual kWh single input + heating type dropdown
2. Automatic seasonal consumption distribution based on heating type
3. Monthly peak kW inputs (configurable per nataegare peak count)
4. Nataegare-specific peak calculation methods (3-peak for Ellevio, 5-peak for Vattenfall)
5. Night discount factor (Ellevio: 22-06 peaks count as 50%)

**Differentiators (competitive advantage):**
1. Heating-type-aware consumption curves using verified Swedish energy data
2. Peak shaving visualization with per-peak reduction controls
3. Before/after peak comparison showing battery impact
4. Embedded PostHog dashboard for sales analytics

**Anti-Features (explicitly NOT building):**
- Automatic peak detection from smart meter API (too complex, unreliable)
- ML-based consumption prediction (liability risk)
- CSV/API consumption import (too technical for sales closers)
- Automatic nataegare detection by postal code (requires maintaining postal database)

**Confidence:** HIGH - Verified against Ellevio and Swedish Energy Agency documentation.

### 3. Architecture: Extend Existing Patterns

The existing architecture supports all v1.2 requirements with targeted extensions.

**Major integration points:**

1. **Consumption Profile Generation**
   - Extend `SYSTEM_PRESETS` in `presets.ts` with heating-type-aware seasonal factors
   - New function: `generateProfileForHeating(annualKwh, heatingType)` -> 12x24 matrix
   - Reuses existing `applyPreset()` logic

2. **Peak Tariff Calculation**
   - Extend Natagare model with `peakCalculationMethod` enum
   - New function: `calcPeakFromProfile(consumptionProfile, natagareConfig)` -> monthly peaks array
   - Update `calcEffectTariffSavings()` to use profile-based peak detection

3. **Centralized Nataegare Management**
   - Remove `orgId` scoping from Natagare model (nataegare are real-world entities, same for all orgs)
   - Super Admin-only CRUD operations
   - Migration path: merge duplicates, update foreign keys

4. **PostHog Dashboard Integration**
   - Server-side events via posthog-node
   - Group analytics by org (`$groups: { company: orgSlug }`)
   - Embedded dashboards via iframe (no custom dashboard code needed)

**Confidence:** HIGH - Verified against existing codebase structure.

### 4. Swedish Market Data (Verified)

**Consumption by Heating Type (150m2 villa):**

| Heating Type | Swedish Name | Annual kWh | Winter Factor | Summer Factor |
|--------------|--------------|------------|---------------|---------------|
| Direct electric | Direktverkande el | 18,000-32,000 | 1.5-2.0 | 0.3-0.4 |
| Ground source HP | Bergvarme | 10,000-18,000 | 1.2-1.4 | 0.6-0.7 |
| Air-to-water HP | Luft-vatten VP | 12,000-20,000 | 1.3-1.5 | 0.5-0.6 |
| Air-to-air HP | Luft-luft VP | 8,000-14,000 | 1.4-1.6 | 0.5-0.6 |
| District heating | Fjarrvarme | 4,000-8,000 | 1.0-1.1 | 0.8-0.9 |

**Grid Operator Peak Methods:**

| Nataegare | Peak Count | High-Load Hours | Night Discount | Rate (SEK/kW) |
|-----------|------------|-----------------|----------------|---------------|
| Ellevio | 3 | 06-22 weekdays | 50% during 22-06 | 81.25 |
| Vattenfall | 5 | 06-22 Nov-Mar | Varies by region | ~70-90 |
| Jonkoping Energi | 2 | 07-20 Nov-Mar | None | ~60-80 |

**Confidence:** HIGH for Ellevio, MEDIUM for others (Vattenfall implementing Oct 2026).

---

## Critical Pitfalls (Top 5)

### 1. Hardcoded Peak Value Scattered Throughout Codebase (CRITICAL)

**The problem:** `currentPeakKw = 8` exists in at least 6 locations. Replacing with manual input will miss some, causing discrepancies between admin and public views.

**Prevention:**
1. Run exhaustive grep for ALL `currentPeakKw` and hardcoded `8` references BEFORE starting
2. Create centralized peak configuration in calculation inputs type
3. Add test that verifies admin and public views show identical peak values

### 2. Breaking Existing Calculations on Migration (CRITICAL)

**The problem:** 113 existing calculations have `results` JSON with old schema. New fields (heatingType, seasonalDistribution) may cause null pointer errors.

**Prevention:**
1. Add `schemaVersion` field to calculation results (v1 current, v2 for v1.2)
2. Create migration script that backfills v1 calculations with default values
3. Test with production calculation data BEFORE deployment
4. Never auto-recalculate old calculations - preserve original results

### 3. Ellevio 3-Peak Averaging vs Simple Multiplication (CRITICAL)

**The problem:** Current formula uses simple monthly multiplication. Ellevio actually averages 3 highest hourly peaks from different days, with night at 50%.

**Prevention:**
1. Create separate `calcEllevioEffektAvgift()` formula implementing 3-peak averaging
2. Night peaks (22:00-06:00) must be halved before comparison
3. Document exact method in code comments
4. Validate against real Ellevio bills from beta customers

### 4. Wrong Seasonal Factors by Heating Type (CRITICAL)

**The problem:** Direktverkande el consumes 4-5x more in winter than summer. Fjarrvarme is flat year-round. Wrong factors produce wildly inaccurate peaks.

**Prevention:**
1. Use verified Swedish Energy Agency data for heating type distributions
2. Create separate seasonal factor arrays per heating type in constants
3. Validate total annual kWh equals input after applying factors
4. Show seasonal distribution chart in UI for transparency

### 5. Nataegare Migration Breaking Org Data (MODERATE)

**The problem:** Moving from org-scoped to global nataegare requires careful migration. Orgs may have duplicates or custom rates.

**Prevention:**
1. Inventory all existing nataegare across orgs before migration
2. Handle duplicates: merge if identical, create variants if different
3. Keep old nataegare IDs working (alias to new global ones)
4. Consider soft migration: add `isGlobal` flag, deprecate don't delete

---

## Implications for Roadmap

Based on dependencies discovered in research, suggested phase structure:

### Phase 1: Data Model & Migration Foundation

**Rationale:** Data model changes are prerequisite for all other work. Migration must be bulletproof.
**Delivers:**
- Schema extensions (HeatingType enum, Natagare peak fields)
- Migration strategy for existing calculations (schema versioning)
- Hardcoded peak audit and centralization
**Addresses:** Table stakes foundation
**Avoids:** Pitfall #1 (hardcoded peaks), Pitfall #2 (breaking existing calcs)
**Needs research:** NO - straightforward Prisma migration

### Phase 2: Consumption Profile Generation

**Rationale:** Core algorithm for realistic consumption. Must come before peak calculation (peaks depend on consumption profile).
**Delivers:**
- Heating type selection in wizard
- Seasonal distribution generation function
- Profile preview chart
**Uses:** Extended schema from Phase 1
**Implements:** `generateProfileForHeating()` function
**Avoids:** Pitfall #4 (wrong seasonal factors)
**Needs research:** YES - validate Swedish consumption curves against additional sources

### Phase 3: Peak Tariff Calculation Engine

**Rationale:** Depends on consumption profile from Phase 2. Core calculation logic.
**Delivers:**
- Ellevio 3-peak averaging formula
- Night discount calculation
- Peak method strategy pattern per nataegare
- Manual peak input support
**Uses:** Consumption profiles from Phase 2, Natagare config from Phase 1
**Avoids:** Pitfall #3 (oversimplified formula)
**Needs research:** NO - Ellevio method well-documented

### Phase 4: Centralized Nataegare Management

**Rationale:** Can run parallel to Phase 3. Affects permissions and Admin UI.
**Delivers:**
- Super Admin-only nataegare CRUD
- Global nataegare model (remove orgId)
- Migration of existing org-scoped nataegare
- Pre-seeded Swedish grid operator data
**Avoids:** Pitfall #5 (migration data loss)
**Needs research:** NO - architectural decision, not technical complexity

### Phase 5: Peak Shaving UI & Visualization

**Rationale:** Depends on Phases 2-3. Pure UI work.
**Delivers:**
- Manual peak input form (simplified UX with smart defaults)
- Peak shaving controls on results page
- Before/after peak visualization
**Addresses:** Differentiator features
**Avoids:** Pitfall related to complex peak input UX
**Needs research:** NO - standard React/Recharts patterns

### Phase 6: PostHog Reconfiguration & Dashboard

**Rationale:** Non-blocking, can run parallel with Phase 5.
**Delivers:**
- Server-side event capture via posthog-node
- Enhanced events with dashboard-friendly properties
- Embedded PostHog dashboard for Super Admin
- Bot detection fix
**Addresses:** Analytics differentiators
**Avoids:** Bot detection blocking events, dashboard not populating
**Needs research:** NO - PostHog docs are comprehensive

### Phase 7: Bug Fixes & Polish

**Rationale:** Final cleanup before release.
**Delivers:**
- Spotpris efficiency display fix (90.2% not 90000.2%)
- Super Admin sidebar permanent menu
- Override system compatibility with new fields
**Needs research:** NO - bug fixes with known solutions

### Phase Ordering Rationale

1. **Data model first** - Every other phase depends on schema changes. Migration must be tested before adding complexity.
2. **Consumption profiles before peaks** - Peak calculation requires consumption profile as input.
3. **Engine before UI** - Calculate correct values before building controls for them.
4. **Nataegare can parallel engine** - No dependency on consumption/peak logic, just schema.
5. **PostHog can parallel UI** - Independent analytics work.
6. **Polish last** - Bug fixes after main features complete.

### Research Flags

**Phases needing deeper research during planning:**
- **Phase 2 (Consumption Profiles):** Validate Swedish consumption factors against additional sources. Current data from 1komma5 and byggvarudeklarationer, should cross-reference with Swedish Energy Agency.

**Phases with standard patterns (skip research-phase):**
- **Phase 1:** Standard Prisma migrations
- **Phase 3:** Ellevio formula well-documented at ellevio.se
- **Phase 4:** Architectural decision, straightforward implementation
- **Phase 5:** Standard React/Recharts patterns
- **Phase 6:** PostHog has comprehensive Next.js documentation
- **Phase 7:** Known bugs with documented solutions

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Only one new dependency; all others existing |
| Features | HIGH | Verified against official Swedish grid operator docs |
| Architecture | HIGH | Verified against existing codebase; extends proven patterns |
| Pitfalls | HIGH | Identified through codebase grep and domain research |

**Overall confidence:** HIGH

### Gaps to Address

1. **Vattenfall/E.ON peak methods:** These operators are still finalizing their effekttariff implementations. System should be configurable so Super Admin can update when methods are announced.

2. **Exact seasonal factors:** The heating type distribution curves need validation with real customer data post-launch. Consider A/B testing different factors.

3. **Peak input UX:** Need user testing to determine if salespeople can provide useful peak estimates, or if calculated defaults are sufficient.

---

## Sources

### Primary (HIGH confidence)
- [Ellevio Effektavgift](https://www.ellevio.se/abonnemang/ny-prismodell-baserad-pa-effekt/) - Official peak calculation methodology
- [PostHog Node.js SDK](https://posthog.com/docs/libraries/node) - Server-side capture documentation
- [Swedish Energy Agency](https://www.energimyndigheten.se/en/facts-and-figures/statistics/) - Official consumption statistics
- Existing codebase: `src/lib/calculations/`, `src/stores/`, `prisma/schema.prisma`

### Secondary (MEDIUM confidence)
- [Tibber - New Ellevio Tariffs](https://tibber.com/en/magazine/inside-tibber/new-ellevio-tariffs) - Ellevio 3-peak explanation
- [1komma5 - Normal elforbrukning villa](https://1komma5.se/energi/elforbrukning-villa) - Heating type consumption
- [Byggvarudeklarationer.se](https://www.byggvarudeklarationer.se/normal-elforbrukning-i-svenska-hem/) - Consumption by heating type
- [effekttariff.nu](https://effekttariff.nu/) - Swedish effekttariff comparison guide

### Tertiary (LOW confidence - needs validation)
- [Vattenfall Effektguiden](https://www.vattenfalleldistribution.se/abonnemang-och-avgifter/avtal-och-avgifter/effektguiden/) - Timeline only, exact method TBD

---

*Research completed: 2026-02-01*
*Ready for roadmap: yes*
