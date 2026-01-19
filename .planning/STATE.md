# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-19)

**Core value:** Closers can build accurate, interactive battery ROI calculations that prospects can customize to see real savings.
**Current focus:** Phase 2 - Reference Data (in progress)

## Current Position

Phase: 2 of 5 (Reference Data)
Plan: 3 of 4 in current phase
Status: In progress
Last activity: 2026-01-19 - Completed 02-03-PLAN.md (Natagare Management CRUD)

Progress: [███████████░] 92% (11/12 plans through Phase 2)

## Performance Metrics

**Velocity:**
- Total plans completed: 11
- Average duration: 3.0 min
- Total execution time: ~33 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 8/8 | 26 min | 3.2 min |
| 02-reference-data | 3/4 | 7 min | 2.3 min |

**Recent Trend:**
- Last 5 plans: 01-07 (2m), 01-08 (manual), 02-01 (2m), 02-02 (skipped), 02-03 (4m)
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

### Pending Todos

None yet.

### Blockers/Concerns

- Research suggests effekttariff rules vary by natagare - need to verify rules for initial launch markets during Phase 2 planning
- Nord Pool API access terms unknown - may need fallback to manual entry or third-party provider
- Database schema needs `npx prisma db push` when network access to Neon is available

## Session Continuity

Last session: 2026-01-19 16:07
Stopped at: Completed 02-03-PLAN.md
Resume file: None

## Next Steps

Continue Phase 2: Reference Data
- Execute 02-04-PLAN.md (Electricity Pricing)

Then Phase 3: ROI Engine
