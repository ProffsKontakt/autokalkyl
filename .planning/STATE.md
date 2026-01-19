# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-19)

**Core value:** Closers can build accurate, interactive battery ROI calculations that prospects can customize to see real savings.
**Current focus:** Phase 2 Complete - Ready for Phase 3

## Current Position

Phase: 2 of 5 (Reference Data) - COMPLETE
Plan: 4 of 4 in current phase
Status: Phase complete, verified
Last activity: 2026-01-19 - Phase 2 verification passed (5/5 success criteria)

Progress: [████████████████████] 100% (12/12 plans through Phase 2)

## Performance Metrics

**Velocity:**
- Total plans completed: 12
- Average duration: 3.1 min
- Total execution time: ~37 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 8/8 | 26 min | 3.2 min |
| 02-reference-data | 4/4 | 11 min | 2.8 min |

**Recent Trend:**
- Last 5 plans: 02-01 (2m), 02-02 (5m), 02-03 (4m), 02-04 (4m)
- Trend: Stable

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

### Pending Todos

None yet.

### Blockers/Concerns

- Vattenfall/E.ON effekttariff rates not officially published yet (deadline Jan 2027) - using placeholder rates
- mgrey.se API has no SLA - implemented manual entry fallback
- Database schema needs `npx prisma db push` when network access to Neon is available

## Session Continuity

Last session: 2026-01-19 18:00
Stopped at: Phase 2 complete - all requirements verified
Resume file: None

## Next Steps

Ready for Phase 3: Calculator Engine
- `/gsd:discuss-phase 3` — gather context and clarify approach
- `/gsd:plan-phase 3` — skip discussion, plan directly
