# Project Milestones: Kalkyla.se

## v1.2 Realistic Consumption & Peak Tariffs (Shipped: 2026-02-05)

**Delivered:** Realistic Swedish consumption profiles with heating type selection and accurate peak tariff calculations using grid operator-specific methods, plus role-based PostHog analytics dashboards.

**Phases completed:** 8-13 (19 plans total)

**Key accomplishments:**

- Realistic consumption profiles: Annual kWh input with heating type generates Swedish-specific seasonal distribution curves
- Peak billing calculation engine: Natagare-specific methods (Ellevio 3-peak averaging) with night discount and battery constraints
- Centralized nätägare management: Global scope migration with Super Admin configuration and Org Admin request workflow
- Role-based PostHog analytics: Server-side events with embedded dashboards scoped by role (Super Admin all, Org Admin org, Closer own)
- UI polish: Fixed spotpris efficiency display (90.2% not 90000.2%), permanent sidebar with collapse toggle
- Schema extensions: HeatingType enum, natagare peak calculation fields with safe migration

**Stats:**

- 91 commits
- ~22,200 lines of TypeScript added
- 6 phases, 19 plans, 27 requirements
- 5 days from start to ship (2026-02-01 → 2026-02-05)

**Git range:** `feat(08-01)` → `docs(13)`

**What's next:** v1.3 planning — potential features: Vattenfall/E.ON peak methods, EV charging profiles, solar integration

---

## v1.1 Fixed ROI Calculations (Shipped: 2026-02-01)

**Delivered:** Fixed calculation accuracy for spotprisoptimering, stödtjänster, and effektavgifter with transparent breakdowns and manual override capability.

**Phases completed:** 6-7 (7 plans total)

**Key accomplishments:**

- Fixed spotpris calculation using correct formula (spread × efficiency × cycles × capacity × days) with adjustable cycles/day slider
- Emaldo grid services with zone-based guaranteed income (SE1-SE3: 1,110 SEK/mo, SE4: 1,370 SEK/mo for 36-month campaign)
- Peak shaving controls with battery capacity constraints and tariff calculations
- Expandable calculation breakdowns showing how each savings number is derived
- Manual override system allowing salespeople to adjust any value with instant sync to shared links
- Critical bug fix: handleFinalize now uses actual slider values instead of hardcoded defaults

**Stats:**

- 34 files created/modified
- +4,557 lines of TypeScript
- 2 phases, 7 plans, 21 requirements
- 3 days from start to ship (2026-01-29 → 2026-02-01)

**Git range:** `docs(7): research phase domain` → `docs: update v1.1 audit with post-audit bug fix`

**What's next:** v1.2 planning — potential features: customer peak data input, expanded battery manufacturer support

---

## v1.0 MVP (Shipped: 2026-01-20)

**Delivered:** Multi-tenant battery ROI calculator SaaS with interactive shareable links for prospects to customize consumption and see real savings.

**Phases completed:** 1-5 (26 plans total)

**Key accomplishments:**

- Multi-tenant authentication with role hierarchy (Super Admin → Org Admin → Closer) and password reset via email
- Reference data management for batteries, natagare (grid operators), and Swedish electricity pricing with Nord Pool integration
- Complete battery ROI calculator with spotpris optimization, effect tariff savings, grid services income, and 10/15-year projections
- Public shareable links with interactive consumption simulator — prospects customize their profile and see live savings updates
- Operations tooling: N8N margin alerts, PostHog analytics (session replays, heatmaps, custom events), Sentry error monitoring
- Role-based admin dashboards with view counts, calculation metrics, and organization stats

**Stats:**

- 9,104 lines of TypeScript
- 5 phases, 26 plans, 92 requirements
- 2 days from start to ship (2026-01-19 → 2026-01-20)

**Git range:** `feat(01-01)` → `feat(05)`

**What's next:** Production deployment, user acceptance testing, then v1.1 planning

---
