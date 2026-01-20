# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-19)

**Core value:** Closers can build accurate, interactive battery ROI calculations that prospects can customize to see real savings.
**Current focus:** Phase 4 - Customer Experience (in progress)

## Current Position

Phase: 4 of 5 (Customer Experience)
Plan: 3 of 4 complete
Status: In progress
Last activity: 2026-01-20 - Completed 04-02-PLAN.md (Share UI Components)

Progress: [███████████████████░] 95% (21/22 plans through Phase 4 Plan 2)

## Performance Metrics

**Velocity:**
- Total plans completed: 21
- Average duration: 3.7 min
- Total execution time: ~100 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 8/8 | 26 min | 3.2 min |
| 02-reference-data | 4/4 | 11 min | 2.8 min |
| 03-calculator-engine | 5/5 | 44 min | 8.8 min |
| 04-customer-experience | 3/4 | 19 min | 6.3 min |

**Recent Trend:**
- Last 5 plans: 03-05 (25m), 04-01 (4m), 04-02 (6m), 04-03 (5m)
- Trend: Phase 4 progressing well, 04-04 remaining

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: 5-phase structure derived from requirement dependencies
- [Roadmap]: 92 v1 requirements mapped (corrected from 68 stated in REQUIREMENTS.md)
- [01-01]: Prisma 7.2 with new config pattern (no URL in schema, uses prisma.config.ts)
- [01-01]: Tenant scoping via Prisma $extends, not RLS (can add later for defense-in-depth)
- [01-01]: Neon serverless driver for WebSocket/HTTPS database access (port 5432 blocked)
- [01-02]: No PrismaAdapter - credentials-only auth doesn't need OAuth account linking
- [01-02]: JWT strategy for sessions - stateless auth works well with serverless
- [01-02]: Edge-compatible config split - auth.config.ts for middleware, auth.ts for credentials
- [01-03]: Minimal UI components without shadcn - simple Tailwind-styled for simplicity
- [01-03]: Server actions pattern for auth - loginAction/logoutAction
- [01-04]: Zod v4 uses issues array not errors array for validation errors
- [01-04]: Server action RBAC pattern: auth() -> hasPermission() -> action
- [01-04]: Admin layout pattern: redirect non-Super Admin to /dashboard
- [01-05]: Tenant scoping: Org Admin uses createTenantClient(), Super Admin uses global prisma
- [01-05]: Dashboard route group: (dashboard) with shared layout and auth check
- [01-05]: Optional password field pattern for admin password reset (AUTH-04)
- [01-07]: Org Admin only access to settings - Super Admin uses admin panel, Closers redirected
- [01-07]: Branding form separate from org creation - Org Admin cannot change affiliation status
- [01-07]: Color preview in form for instant feedback using watch() from react-hook-form
- [01-06]: Dev mode logs reset links to console when N8N_WEBHOOK_URL not configured
- [01-06]: Email enumeration prevention - always return success on password reset request
- [01-06]: Token expiration set to 1 hour, single-use enforcement
- [01-08]: ProffsKontakt margin model changed: partnerCutPercent -> installerFixedCut (fixed SEK amount)
- [01-08]: Margin calculation: Sale Price (ex VAT) - Battery Cost - Installer Fixed Cut = ProffsKontakt Margin
- [02-01]: Elomrade enum with SE1-SE4 values stored directly in database
- [02-01]: ElectricityPrice/Quarterly models are global (not tenant-scoped) - shared reference data
- [02-01]: Natagare day/night rate precision at 4 decimal places (Decimal 10,4)
- [02-01]: Battery specs use Decimal types consistently to avoid floating point issues
- [02-03]: Ellevio rates verified: 81.25/40.625 SEK/kW day/night (from research)
- [02-03]: Vattenfall/E.ON rates are placeholders marked with "(verifiera priser)"
- [02-03]: Default natagare cannot be deleted, only rates can be updated
- [02-03]: z.preprocess pattern for number coercion with react-hook-form in Zod v4
- [02-04]: Price storage in ore/kWh as returned by mgrey.se API (despite field name price_sek)
- [02-04]: Day hours 6-21, Night hours 22-23 and 0-5 for quarterly average calculation
- [02-04]: Quarterly averages stored separately for performance in calculations
- [02-04]: ELPRICES_MANAGE for write operations (Super Admin only), ELPRICES_VIEW for all roles
- [02-02]: Type cast tenant client create data for $extends TypeScript compatibility
- [02-02]: Decimal fields serialized to numbers in server actions for JSON-safe client transport
- [02-02]: Battery form sections grouped by category (basic, power, efficiency, warranty, pricing)
- [03-01]: Calculation/CalculationBattery models store consumptionProfile and results as Json
- [03-01]: decimal.js configured with precision: 20, rounding: ROUND_HALF_UP
- [03-01]: Formulas separated from engine for testability
- [03-01]: Elomrade lookup uses static postal code ranges (no reliable API)
- [03-02]: Zustand persist middleware with localStorage for wizard state across refresh
- [03-02]: State hash comparison prevents duplicate auto-saves
- [03-02]: Delete-and-recreate strategy for battery list sync (simpler than diff)
- [03-02]: 2-second debounce for auto-save with flush on unmount
- [03-03]: Recharts for consumption bar chart visualization
- [03-03]: Click-to-edit bars pattern (better UX than dragging for precise input)
- [03-03]: Monthly intensity indicator via bottom bar opacity
- [03-04]: Primary battery shows full details, others in comparison table
- [03-04]: Natagare lookup pattern: pass natagareList prop, lookup by natagareId from store
- [03-04]: Recharts Tooltip uses untyped formatter with Number() conversion
- [03-05]: Tenant client findUnique must verify orgId separately when using custom select
- [03-05]: NewCalculationButton resets Zustand store to prevent stale state
- [03-05]: Delete calculation clears wizard store if it matches current calculationId
- [03-05]: Seed data includes quarterly electricity prices and Emaldo battery configs
- [04-01]: Share codes use nanoid with 21 characters (126 bits entropy)
- [04-01]: IP addresses hashed with SHA256, truncated to 16 chars for privacy
- [04-01]: Password protection uses bcrypt with cost 12
- [04-01]: Public data explicitly excludes marginSek, costPrice, installerCut
- [04-02]: Modal uses CSS keyframe animations (fadeIn, slideUp) in globals.css
- [04-02]: ShareButton has icon and button variants for different contexts
- [04-02]: LinkStatusBadge returns null when not shared (no empty state)
- [04-03]: Public route group at (public) bypasses auth via existing middleware
- [04-03]: CSS custom properties for org branding colors
- [04-03]: Key metrics shown in priority order: payback, annual savings, 10yr ROI, 15yr ROI

### Pending Todos

None yet.

### Blockers/Concerns

- Vattenfall/E.ON effekttariff rates not officially published yet (deadline Jan 2027) - using placeholder rates
- mgrey.se API has no SLA - implemented manual entry fallback
- Database schema needs `npx prisma db push` when network access to Neon is available
- Phase 4 schema additions (CalculationView, CalculationVariant) need db push

## Session Continuity

Last session: 2026-01-20
Stopped at: Completed 04-02-PLAN.md (Share UI Components)
Resume file: None

## Next Steps

Phase 4: Customer Experience (continuing)
- Execute 04-04-PLAN.md: Interactive Simulator

`/gsd:execute-phase 4` to continue
