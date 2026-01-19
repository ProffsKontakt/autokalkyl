# Domain Pitfalls: Kalkyla.se Battery ROI Calculator

**Domain:** Multi-tenant SaaS calculation tool for Swedish battery ROI
**Researched:** 2026-01-19
**Overall Confidence:** HIGH (verified with multiple authoritative sources)

---

## Critical Pitfalls

Mistakes that cause data breaches, rewrites, or major production incidents.

---

### Pitfall 1: Multi-Tenant Data Leakage via Missing Tenant Filters

**What goes wrong:** Tenant A sees Tenant B's calculations, organizations, or customer data. This isn't a bug—it's a data breach requiring disclosure.

**Why it happens:**
- Manual `tenantId` filtering on every query is fragile
- One forgotten `WHERE orgId = ?` leaks data
- Relation queries in Prisma middleware don't automatically inherit tenant filters
- Cache keys without tenant namespacing serve wrong data

**Consequences:**
- GDPR breach notification required within 72 hours
- Customer trust destroyed
- Potential legal liability

**Prevention:**
1. Implement Row-Level Security (RLS) at PostgreSQL level as defense-in-depth
2. Use Prisma Client Extensions to automatically inject `orgId` filter on every query
3. Create a `TenantPrismaClient` wrapper that enforces scoping
4. Never use raw SQL without tenant filtering
5. Namespace all cache keys: `org:${orgId}:calculation:${calcId}`

**Detection (warning signs):**
- Code review shows queries without explicit org filtering
- Unit tests don't verify tenant isolation
- No integration tests for cross-tenant access attempts

**Phase to address:** Phase 1 (Foundation) - Must be architected from day one. "The most expensive mistake in SaaS development is treating multi-tenancy as a feature you can add later." ([Update.dev](https://update.dev/blog/how-to-implement-multi-tenancy-in-next-js-a-complete-guide))

---

### Pitfall 2: Connection Pool Exhaustion in Vercel Serverless

**What goes wrong:** Under load, database connections exhaust and requests fail with "Timed out fetching a new connection from the connection pool."

**Why it happens:**
- Each serverless function invocation can create a new database connection
- No connection reuse between cold starts
- High concurrency during peak usage (e.g., sales demos) exhausts pool
- Prisma default pool size + Vercel concurrency = connection explosion

**Consequences:**
- Application becomes unavailable during critical moments
- Demo failures when showing to potential customers
- Cascading timeouts affecting all tenants

**Prevention:**
1. Use Prisma Accelerate or Vercel Postgres with built-in pooling
2. Configure `connection_limit` in Prisma connection string appropriately
3. Instantiate PrismaClient in global scope (outside handler)
4. Never call `$disconnect()` in serverless functions
5. Consider Vercel Fluid Compute with `attachDatabasePool` for connection lifecycle management
6. Set Vercel function concurrency limits below database connection limits

**Detection (warning signs):**
- Intermittent P1001 "Can't reach database server" errors
- Errors correlate with traffic spikes
- Supabase/Neon connection dashboard shows connection count near limit

**Phase to address:** Phase 1 (Foundation) - Database connection strategy must be established before any features. ([Prisma Vercel Guide](https://www.prisma.io/docs/orm/prisma-client/deployment/serverless/deploy-to-vercel))

---

### Pitfall 3: Floating-Point Precision Errors in Financial Calculations

**What goes wrong:** ROI calculations show wrong values due to JavaScript's floating-point representation. Customer sees "1989.99999998 SEK" instead of "1990 SEK", or worse, calculations compound errors over 25-year projections.

**Why it happens:**
- JavaScript uses IEEE 754 floating-point: `0.1 + 0.2 !== 0.3`
- Energy pricing involves many decimal places (oresund öre/kWh)
- Compound calculations over months/years amplify small errors
- Grön Teknik percentages (48.5%) combined with currency cause drift

**Consequences:**
- Incorrect ROI projections mislead customers
- Invoices requiring retroactive correction
- Loss of credibility with professional customers
- Potential legal issues if calculations inform purchase decisions

**Prevention:**
1. Use decimal.js or big.js for ALL financial calculations
2. Store monetary values as integers (öre, not SEK) in database
3. Only format for display at the final step
4. Add validation tests comparing calculations against known spreadsheet results
5. Round intermediate results strategically, not just final output

```typescript
// BAD
const total = price * 0.485; // Grön Teknik deduction

// GOOD
import Decimal from 'decimal.js';
const total = new Decimal(price).mul('0.485').toDecimalPlaces(2);
```

**Detection (warning signs):**
- Test outputs show many decimal places
- Calculations don't match Excel/spreadsheet verification
- Customer complaints about "a few öre off"

**Phase to address:** Phase 2 (Calculator Core) - Must be established before any calculation logic. ([Dev.to: Financial Precision](https://dev.to/benjamin_renoux/financial-precision-in-javascript-handle-money-without-losing-a-cent-1chc))

---

### Pitfall 4: Shareable Links with Guessable/Enumerable Tokens

**What goes wrong:** Attackers enumerate calculation links and access other organizations' ROI analyses. "Public" links become truly public to anyone who can guess IDs.

**Why it happens:**
- Using sequential IDs or UUIDv1 (time-based, predictable)
- No rate limiting on public link endpoints
- No authorization check even for "public" resources
- The "sandwich attack" on UUIDv1: knowing IDs before and after allows guessing target ID

**Consequences:**
- Competitor accesses customer's pricing analysis
- Sensitive consumption data exposed
- Org branding/pricing strategies leaked

**Prevention:**
1. Use UUIDv4 (122 random bits) or UUIDv7 for share tokens
2. Add cryptographically random suffix: `${uuidv4()}-${crypto.randomBytes(8).toString('hex')}`
3. Implement rate limiting on public endpoints (IP-based)
4. Add optional password protection for sensitive calculations
5. Track access and alert orgs on unusual access patterns
6. Set link expiration by default (30 days configurable)

**Detection (warning signs):**
- Share URLs contain sequential-looking numbers
- No rate limiting on `/share/:token` endpoint
- Logs show sequential token access attempts

**Phase to address:** Phase 3 (Sharing) - Design token generation before implementing sharing feature. ([Medium: Exploiting UUIDs](https://medium.com/@dimpchubb/exploiting-uuids-in-account-takeover-a-penetration-testers-guide-to-bypassing-insecure-token-96de9cc520a3))

---

### Pitfall 5: N8N Webhook Security Vulnerabilities

**What goes wrong:** Attackers exploit N8N webhook endpoints to execute arbitrary code or access sensitive data. CVE-2026-21858 (CVSS 10.0) allows unauthenticated RCE.

**Why it happens:**
- N8N webhook endpoints exposed without authentication
- Insufficient validation of incoming webhook data
- Running N8N with elevated privileges
- Not keeping N8N updated (critical vulnerabilities in versions <= 1.65.0)

**Consequences:**
- Full server compromise
- Access to all customer data
- Lateral movement to other systems

**Prevention:**
1. Keep N8N updated to >= 1.121.0 (critical security fix)
2. Never expose N8N directly to internet—use reverse proxy with auth
3. Implement HMAC signature verification on all webhooks
4. Use API key authentication for Kalkyla -> N8N communication
5. Deploy N8N in isolated environment with minimal privileges
6. Rate limit and validate all webhook payloads before processing

**Detection (warning signs):**
- N8N accessible without authentication
- Webhook URLs in client-side code
- No request signature validation
- Running outdated N8N version

**Phase to address:** Phase 4 (Integrations) - Security architecture must precede webhook implementation. ([The Hacker News: N8N CVE](https://thehackernews.com/2026/01/critical-n8n-vulnerability-cvss-100.html))

---

### Pitfall 6: RBAC Bypass via Middleware/API Inconsistency

**What goes wrong:** User can access resources in UI (appears protected) but API allows direct access, or vice versa. Role checks enforced in one layer but not others.

**Why it happens:**
- Checking role in React component but not API route
- Middleware runs differently in Next.js 15 (optimized, not every request)
- Session callback order issues in Auth.js v5 (middleware runs before session populated)
- CVE-2025-29927: `x-middleware-subrequest` header bypasses all middleware

**Consequences:**
- Users access features beyond their role (Super Admin functions)
- Data modification by unauthorized users
- Audit trail shows actions by "wrong" user

**Prevention:**
1. Enforce authorization at EVERY layer: middleware + API route + database (defense in depth)
2. Update Next.js to patched version (>= 12.3.5, 13.5.9, 14.2.25, or 15.2.3)
3. Place Auth.js callbacks in `auth.config.ts` to ensure session available in middleware
4. Create centralized `checkPermission(user, action, resource)` function used everywhere
5. Write integration tests that bypass UI and hit API directly
6. Add database-level RLS as final defense

**Detection (warning signs):**
- Permission checks scattered across codebase
- No API tests that verify role enforcement
- Middleware only, no API route checks

**Phase to address:** Phase 1 (Foundation) - Auth and RBAC architecture from the start. ([Next.js Auth Discussion](https://github.com/nextauthjs/next-auth/discussions/9609))

---

## Moderate Pitfalls

Mistakes that cause delays, technical debt, or degraded user experience.

---

### Pitfall 7: Nord Pool API Integration Brittleness

**What goes wrong:** Electricity price fetching fails silently, calculations use stale data, or the 15-minute MTU change (October 2025) breaks hourly assumptions.

**Why it happens:**
- Hard-coded assumption of hourly price data (now 15-minute MTU)
- No caching layer—every calculation hits API
- Day-ahead prices only available ~13:00 CET
- API rate limits not handled
- Currency conversion not handled (EUR only from some sources)

**Consequences:**
- Calculations fail during API outages
- Stale prices give incorrect ROI projections
- Performance degradation from repeated API calls

**Prevention:**
1. Cache Nord Pool data aggressively (prices are published once, don't change)
2. Design data model for 15-minute granularity from start
3. Implement fallback: cached data + "prices as of X" indicator
4. Pre-fetch day-ahead prices at 13:15 CET daily (cron job)
5. Handle both hourly and 15-minute data gracefully
6. Store prices in SEK after conversion (Swedish market focus)

**Detection (warning signs):**
- Direct API calls in calculation functions
- No error handling for API failures
- Data model assumes hourly resolution only

**Phase to address:** Phase 2 (Calculator Core) - Data fetching architecture before calculation logic. ([Home Assistant Nord Pool](https://www.home-assistant.io/integrations/nordpool/))

---

### Pitfall 8: Effect Tariff (Effekttariff) Calculation Complexity Underestimated

**What goes wrong:** Effect tariff calculations are wrong because each nätägare has different rules, peak measurement windows vary, and the quarterly peak logic is misunderstood.

**Why it happens:**
- Assuming uniform tariff structure across Sweden
- Peak measured differently: some use top 3 hours in month, others quarterly
- Time windows for peak measurement vary by nätägare
- Feed-in vs withdrawal have different geographic pricing
- Regulation EIFS 2022:1 requires specific tariff components by 2027

**Consequences:**
- ROI calculations significantly wrong (effect fees can be 30-40% of bill)
- Customers make bad battery purchase decisions
- Credibility loss with technically sophisticated customers

**Prevention:**
1. Research and document tariff structures for target nätägare
2. Make tariff rules configurable per nätägare, not hard-coded
3. Default to conservative estimates when nätägare unknown
4. Show "effect tariff calculation" as explicit line item users can adjust
5. Add disclaimer about tariff variability
6. Plan for future EU power subscription model

**Detection (warning signs):**
- Single hard-coded effect tariff formula
- No nätägare selection in UI
- Calculations don't match customer's actual bills

**Phase to address:** Phase 2 (Calculator Core) - Research tariff structures before building calculator. ([Energiföretagen](https://www.energiforetagen.se/energifakta/elsystemet/elnatet--distribution-av-el/effekttarifftariffer/))

---

### Pitfall 9: Grön Teknik Deduction Rules Miscalculated

**What goes wrong:** Tax deduction calculations are wrong, leading to incorrect ROI projections and unhappy customers when they file taxes.

**Why it happens:**
- Solar reduced from 20% to 15% after June 30, 2025 (date-dependent logic)
- Battery storage (50%) requires solar to be installed
- Maximum 50,000 SEK per person per year
- Property ownership requirements
- Can't combine with ROT for same service
- VAT included in calculation basis

**Consequences:**
- Customers expect more deduction than they receive
- ROI appears better than reality
- Angry customers when tax filing reveals error

**Prevention:**
1. Make deduction rates configurable (anticipate future changes)
2. Add installation date field to determine applicable rate
3. Clearly show deduction breakdown in UI
4. Add validation: battery deduction requires solar
5. Warn about per-person cap (suggest splitting if married)
6. Link to Skatteverket for authoritative information
7. Add disclaimer: "Verify with your tax advisor"

**Detection (warning signs):**
- Hard-coded percentage values
- No date-based logic for rate changes
- No cap calculation visible

**Phase to address:** Phase 2 (Calculator Core) - Government incentive rules must be configurable. ([Skatteverket: Grön Teknik](https://www.skatteverket.se/privat/fastigheterochbostad/gronteknik.4.676f4884175c97df4192860.html))

---

### Pitfall 10: Real-Time UI Performance Degradation

**What goes wrong:** Calculator becomes sluggish as user adjusts sliders. Every input change triggers full recalculation, causing UI jank and frustrated users.

**Why it happens:**
- No debouncing on input changes
- Recalculating 12 months × 24 hours × multiple factors on every keystroke
- Context updates re-render entire component tree
- No memoization of expensive calculations

**Consequences:**
- Unusable UX on mobile or slower devices
- Users think app is broken
- Abandonment during data entry

**Prevention:**
1. Debounce calculation inputs (200-300ms)
2. Use `useDeferredValue` for non-urgent UI updates (React 18+)
3. Memoize expensive calculations with `useMemo`
4. Consider Web Workers for heavy calculation offloading
5. Use React Compiler (stable Oct 2025) for automatic optimization
6. Implement virtualization for 288-cell consumption grid (12×24)
7. Show loading indicator during calculation

**Detection (warning signs):**
- React DevTools shows excessive re-renders
- Input lag visible in profiler
- No debounce/throttle in input handlers

**Phase to address:** Phase 2 (Calculator Core) - Performance architecture alongside calculation logic. ([React Performance 2025](https://dev.to/alex_bobes/react-performance-optimization-15-best-practices-for-2025-17l9))

---

### Pitfall 11: Time Zone and DST Handling Errors

**What goes wrong:** Peak hour calculations are wrong during DST transitions. March shows 23 hours, October shows 25 hours, and effect tariff peaks calculated incorrectly.

**Why it happens:**
- Using `new Date()` without timezone awareness
- Assuming all months have 24-hour days
- Europe/Stockholm has DST transitions that affect hourly calculations
- Nord Pool data in CET/CEST but calculations in local time

**Consequences:**
- Effect tariff peak detection wrong near DST boundaries
- Monthly consumption totals don't add up
- Energy arbitrage calculations incorrect

**Prevention:**
1. Use `date-fns-tz` or `luxon` for all date operations
2. Store all timestamps in UTC
3. Convert to Europe/Stockholm only for display and hourly bucketing
4. Handle 23-hour and 25-hour days explicitly
5. Test calculations around DST boundaries (March/October)
6. Document timezone assumptions in code

**Detection (warning signs):**
- Using `new Date()` throughout codebase
- No timezone library imported
- Tests don't cover DST edge cases

**Phase to address:** Phase 2 (Calculator Core) - Date handling patterns before time-series calculations. ([Medium: DST Battles](https://yixiongjiang.medium.com/a-battle-of-wits-with-datetime-whats-dst-and-how-we-handle-it-within-typescript-eco-environment-146e9cda9c9b))

---

### Pitfall 12: Orphaned Shareable Links Never Expire

**What goes wrong:** Links created months ago still expose calculation data. Former employees' shared links remain active. No audit trail of who accessed what.

**Why it happens:**
- No expiration date on share tokens
- No link revocation mechanism
- No access logging
- Org deletion doesn't cascade to shared links

**Consequences:**
- Data exposure long after relevance
- GDPR "right to erasure" violations
- No visibility into data access patterns

**Prevention:**
1. Add `expiresAt` timestamp to share links (default 30 days)
2. Implement link revocation UI for org admins
3. Log all share link accesses with IP, timestamp
4. Cascade org/calculation deletion to share links
5. Send periodic "active share links" report to admins
6. Allow configurable expiration per org

**Detection (warning signs):**
- Share links table has no `expiresAt` column
- No admin UI to manage shared links
- No access logging

**Phase to address:** Phase 3 (Sharing) - Expiration and audit from initial design. ([SaaS Alerts Report](https://saasalerts.com/wp-content/uploads/2025/04/SASI-Report-2025-updated.pdf))

---

## Minor Pitfalls

Mistakes that cause annoyance but are quickly fixable.

---

### Pitfall 13: Bundle Size Bloat from Prisma Engine

**What goes wrong:** Vercel deployments are slow due to large Prisma Rust engine binaries. Cold starts take 2-3 seconds.

**Prevention:**
1. Use Prisma v6.16.0+ with `engineType = "client"` (no Rust binaries)
2. Or use Prisma Accelerate to eliminate cold start penalty
3. Monitor bundle size in CI

**Phase to address:** Phase 1 (Foundation) - Configuration choice at project setup.

---

### Pitfall 14: Missing Index on tenantId Columns

**What goes wrong:** Queries slow down as data grows because tenant filtering requires full table scans.

**Prevention:**
1. Add index to every `orgId` foreign key column
2. Add composite indexes for common query patterns: `(orgId, createdAt)`
3. Use Prisma's `@@index` directive

**Phase to address:** Phase 1 (Foundation) - Database schema design.

---

### Pitfall 15: No Rate Limiting on Public Endpoints

**What goes wrong:** Bots or attackers hammer public share link endpoints, causing performance degradation or cost overruns.

**Prevention:**
1. Implement rate limiting at Vercel Edge or middleware level
2. Use `@upstash/ratelimit` for serverless-friendly rate limiting
3. Different limits for authenticated vs public endpoints

**Phase to address:** Phase 3 (Sharing) - Before exposing public endpoints.

---

### Pitfall 16: Hardcoded Swedish Text Without i18n Structure

**What goes wrong:** Swedish-only text scattered throughout code makes future internationalization expensive.

**Prevention:**
1. Use `next-intl` or similar from the start
2. Extract all user-facing strings to locale files
3. Swedish as default, structure ready for English/Norwegian

**Phase to address:** Phase 2 (Calculator Core) - Text extraction pattern from start.

---

## Phase-Specific Warnings Summary

| Phase | Topic | Likely Pitfall | Mitigation |
|-------|-------|---------------|------------|
| Phase 1: Foundation | Multi-tenancy | Data leakage (#1) | RLS + Prisma Extensions + tenant-scoped client |
| Phase 1: Foundation | Database | Connection exhaustion (#2) | Prisma Accelerate + proper pooling config |
| Phase 1: Foundation | Auth | RBAC bypass (#6) | Defense in depth, patched Next.js |
| Phase 2: Calculator | Calculations | Float precision (#3) | decimal.js for all math |
| Phase 2: Calculator | Calculations | Effect tariff errors (#8) | Configurable per nätägare |
| Phase 2: Calculator | Calculations | Grön Teknik errors (#9) | Date-based rates, configurable |
| Phase 2: Calculator | UI | Performance (#10) | Debounce + memoization + virtualization |
| Phase 2: Calculator | Data | Time zones (#11) | Luxon/date-fns-tz + UTC storage |
| Phase 2: Calculator | API | Nord Pool brittleness (#7) | Caching + 15-min MTU support |
| Phase 3: Sharing | Security | Guessable tokens (#4) | UUIDv4 + rate limiting |
| Phase 3: Sharing | Data | Orphaned links (#12) | Expiration + audit logging |
| Phase 4: Integrations | Security | N8N vulnerabilities (#5) | Updated N8N + HMAC + isolation |

---

## Sources

### Multi-Tenant Architecture
- [Update.dev: Multi-Tenancy in Next.js](https://update.dev/blog/how-to-implement-multi-tenancy-in-next-js-a-complete-guide)
- [Medium: Multi-Tenant Leakage](https://instatunnel.my/blog/multi-tenant-leakage-when-row-level-security-fails-in-saas)
- [Prisma: Multi-Tenant Approaches](https://zenstack.dev/blog/multi-tenant)

### Database and Prisma
- [Prisma: Deploy to Vercel](https://www.prisma.io/docs/orm/prisma-client/deployment/serverless/deploy-to-vercel)
- [Vercel: Connection Pooling](https://vercel.com/kb/guide/connection-pooling-with-functions)
- [Medium: RLS with Prisma](https://medium.com/@francolabuschagne90/securing-multi-tenant-applications-using-row-level-security-in-postgresql-with-prisma-orm-4237f4d4bd35)

### Security
- [The Hacker News: N8N CVE-2026-21858](https://thehackernews.com/2026/01/critical-n8n-vulnerability-cvss-100.html)
- [Medium: UUID Exploitation](https://medium.com/@dimpchubb/exploiting-uuids-in-account-takeover-a-penetration-testers-guide-to-bypassing-insecure-token-96de9cc520a3)
- [Auth.js: RBAC](https://authjs.dev/guides/role-based-access-control)

### Financial Calculations
- [Dev.to: Financial Precision in JavaScript](https://dev.to/benjamin_renoux/financial-precision-in-javascript-handle-money-without-losing-a-cent-1chc)
- [Robin Wieruch: JavaScript Rounding Errors](https://www.robinwieruch.de/javascript-rounding-errors/)

### Swedish Market Specifics
- [Skatteverket: Grön Teknik](https://www.skatteverket.se/privat/fastigheterochbostad/gronteknik.4.676f4884175c97df4192860.html)
- [Energiföretagen: Effekttariffer](https://www.energiforetagen.se/energifakta/elsystemet/elnatet--distribution-av-el/effekttarifftariffer/)
- [EI: Effekttariffer](https://ei.se/bransch/reglering-av-natverksamhet/reglering---elnatsverksamhet/effekttariffer)

### Performance and React
- [Dev.to: React Performance 2025](https://dev.to/alex_bobes/react-performance-optimization-15-best-practices-for-2025-17l9)
- [Dev.to: Real-Time Charts](https://dev.to/ibtekar/building-a-high-performance-real-time-chart-in-react-lessons-learned-ij7)

### APIs and Integration
- [Home Assistant: Nord Pool Integration](https://www.home-assistant.io/integrations/nordpool/)
- [Nord Pool API](https://data-api.nordpoolgroup.com/index.html)

### Time Handling
- [Medium: DST Handling in TypeScript](https://yixiongjiang.medium.com/a-battle-of-wits-with-datetime-whats-dst-and-how-we-handle-it-within-typescript-eco-environment-146e9cda9c9b)
