# Codebase Concerns

**Analysis Date:** 2026-01-26

## Tech Debt

### Large Action Files Approaching Complexity Limits

**Issue:** Three server action files exceed 500 lines, approaching unmaintainable complexity.

- `src/actions/calculations.ts` - 574 lines (includes saveDraft, finalize, fetch, margin alert logic)
- `src/actions/batteries.ts` - 531 lines (battery brands and configs CRUD)
- `src/actions/share.ts` - 489 lines (share link generation, public access, view tracking)

**Impact:** Difficulty maintaining, testing, and modifying these files. Higher risk of introducing bugs during refactoring.

**Fix approach:**
- Extract margin alert logic from `src/actions/calculations.ts` to `src/lib/webhooks/margin-alert.ts`
- Create `src/actions/calculations-fetch.ts` for all GET operations (separate from mutations)
- Extract share code validation and public calculation fetch to `src/lib/share/public-access.ts`

---

### Type Assertions Without Proper Typing

**Issue:** Type coercions bypass TypeScript safety in critical areas.

- `src/actions/calculations.ts:111` - `consumptionProfile: data.consumptionProfile as unknown as object` (consume profile type mismatch)
- `src/actions/calculations.ts:143-145` - Function cast to bypass Prisma typing limitations when creating calculations
- `src/actions/calculations.ts:459` - Organization casting `(c.organization as unknown as { name: string }).name`
- `src/lib/db/client.ts:29` - Global Prisma client typed as `unknown` before casting

**Impact:** Silent type errors possible. Makes refactoring riskier. Masks underlying schema/code mismatches.

**Fix approach:**
- Define proper TypeScript types for `ConsumptionProfile` serialization (currently `object`)
- Create helper function `createCalculationData()` to properly type calculation creation
- Add strict `tsconfig.json` settings: `"noImplicitAny": true`, `"noImplicitThis": true`
- Use branded types for critical data structures

---

### Fire-and-Forget Webhook Architecture Lacks Error Observability

**Issue:** Margin alerts and analytics webhooks use fire-and-forget pattern with minimal error tracking.

- `src/actions/calculations.ts:196-279` - `checkAndTriggerMarginAlert()` silently logs errors, never retries
- `src/lib/webhooks/n8n.ts:26-68` - Errors only logged to console, no error tracking service
- `src/actions/share.ts` - View tracking webhooks same pattern
- No retry logic, dead letter queue, or failure notifications

**Impact:** Failed webhook deliveries go unnoticed. Margin alerts may never reach Julian. Revenue-impacting orgs may be unaware of low-margin sales. No visibility into system reliability.

**Workaround:** Currently only n8n webhook; PostHog analytics are client-side and more reliable.

**Fix approach:**
- Integrate Sentry error tracking for all webhook failures (already installed: `@sentry/nextjs`)
- Add database retry table: `WebhookEvent { id, type, payload, status, retries, nextRetryAt, failureReason }`
- Implement cron job (e.g., `/api/webhooks/retry` scheduled) for exponential backoff retries
- Send alert email if margin webhook fails 3+ times in 24h

---

### No Test Coverage

**Issue:** Zero automated tests in codebase. All critical flows untested.

- No unit tests for calculation formulas (`src/lib/calculations/formulas.ts`)
- No integration tests for multi-step wizard flow
- No tests for tenant scoping (critical security feature)
- No tests for permission checks (RBAC)
- No tests for financial calculations (high-impact area)

**Impact:** High risk of regressions. Silent failures in calculation logic could cost business revenue. Tenant isolation bugs undetected. Authorization bypasses possible.

**Fix approach:**
- Add Jest/Vitest config with test command in `package.json`
- Create test files co-located: `*.test.ts` next to source
- Priority order:
  1. `src/lib/calculations/formulas.ts` - Financial precision critical
  2. `src/lib/db/tenant-client.ts` - Isolation is security-critical
  3. `src/lib/auth/permissions.ts` - Authorization must be bulletproof
  4. `src/actions/calculations.ts` - Business logic complexity

---

### Calculation Wizard Finalization Incomplete

**Issue:** TODO comment in wizard finalization logic, indicating feature not fully implemented.

- `src/components/calculations/wizard/calculation-wizard.tsx:118` - TODO: Calculate final results and finalize
- `handleFinalize()` calls `finalizeCalculation(store.calculationId, {})` with empty object instead of computed results

**Impact:** Calculations may be marked COMPLETE without proper finalization state. Results not properly persisted before sharing.

**Fix approach:**
- Compute final results before finalization (battery ROI, savings, payback period)
- Store results in `calculationResults` JSON field on Calculation model
- Pass results to finalize action: `finalizeCalculation(id, computedResults)`
- Add test verifying results persist correctly

---

## Performance Bottlenecks

### N+1 Query Pattern in Dashboard

**Issue:** Dashboard statistics queries load calculations inefficiently.

- `src/actions/dashboard.ts:82-96` - Fetches recent 10 calculations with battery details (single query)
- `src/actions/dashboard.ts:98-121` - Iterates through each result and makes separate `findFirst` for last view date (10 N+1 queries for Super Admin)
- `src/actions/dashboard.ts:156-184` - ORG_ADMIN path repeats: 10 calculations + 10 `findFirst(views)` + 10 `findUnique(user)` = 20 N+1 queries
- Same pattern for CLOSER role

**Current behavior:** Super Admin dashboard = 1 query + 10 view queries + total views = 12 queries. ORG_ADMIN = 3 + 20 = 23 queries. CLOSER = 3 + 20 = 23 queries.

**Impact:** Dashboard loads slowly with many calculations/views. Database connection pool exhaustion under concurrent admin access. Serverless cold starts exacerbated.

**Fix approach:**
- Use `_count` aggregations for view counts instead of separate queries
- Load user details via `include` in initial query instead of separate lookups
- Batch last-viewed dates: `calculationView.groupBy({ by: ['calculationId'], _max: { viewedAt: true } })`
- Cache dashboard data (5-minute TTL) for non-real-time views

---

### Recurring Margin Alert Checks on Every Save

**Issue:** Margin check always fetches org, battery config, calculation for every save, even if margin hasn't changed.

- `src/actions/calculations.ts:196-279` runs on every `saveDraft()` call (auto-save every 2 seconds during editing)
- Fetches org, battery config, user, calculation just to check threshold

**Impact:** Unnecessary database load during calculation wizard editing. Could cause slowdown with many concurrent editors.

**Fix approach:**
- Cache org affiliation status in session (already have orgId, add cached flags)
- Only check margin on explicit save or battery change (not every keystroke auto-save)
- Memoize margin calculation result to avoid recalc if data unchanged
- Use database indexes: `organization(isProffsKontaktAffiliated)` and `batteryConfig(id, costPrice)`

---

## Security Considerations

### Weak Password Requirements

**Issue:** Minimum password length is only 8 characters with no complexity requirements.

- `src/lib/auth/credentials.ts:12` - `password: z.string().min(8)`
- No checks for uppercase, lowercase, numbers, special characters
- No password history check

**Risk:** Users can set passwords like "password1" or "12345678". Vulnerability to dictionary attacks. Compliance issues (NIST minimum is 12-16 chars or stronger complexity).

**Current mitigation:** bcryptjs with salt factor 12 provides strong hashing, but weak input passwords reduce entropy.

**Recommendations:**
- Increase minimum to 12 characters OR require complexity: at least 8 with uppercase + number + special char
- Add password strength validator using `zxcvbn` library
- Store password change history (last 5) and prevent reuse
- Add password reset requirement every 90 days for admins

---

### No Rate Limiting on Authentication

**Issue:** Login endpoint has no rate limiting.

- `src/lib/auth/auth.ts` - Credentials provider accepts unlimited login attempts
- No per-IP or per-email attempt tracking
- No CAPTCHA after N failed attempts

**Risk:** Brute force attacks against user passwords feasible (8 char passwords have ~56 bits entropy).

**Current mitigation:** Hashing with bcrypt is slow (salt factor 12), providing some protection.

**Recommendations:**
- Implement rate limiting: 5 failed attempts per IP per 15 minutes → temporary lockout
- Use `Ratelimit` library (e.g., Upstash Redis-backed) at middleware level
- Add CAPTCHA after 3 failed attempts for same email
- Log failed attempts for security monitoring

---

### No CSRF Protection on Forms

**Issue:** Custom form submissions don't explicitly show CSRF token handling.

- `src/app/(auth)/login/login-form.tsx` - Uses NextAuth credentials provider
- `src/app/(auth)/forgot-password/forgot-password-form.tsx` - Server action call
- No visible CSRF token in form code

**Risk:** Cross-site request forgery attacks possible if NextAuth CSRF handling fails.

**Current mitigation:** NextAuth.js automatically includes CSRF tokens in session handling; server actions are inherently safer than traditional forms.

**Recommendations:**
- Verify CSRF tokens are present: run `curl -X POST to /api/auth/callback/credentials -H "referer: evil.com"`
- Add explicit CSRF validation for non-NextAuth forms (forgot password)
- Document that server actions inherit CSRF from NextAuth

---

### Share Link Password Hashing Cost

**Issue:** Share link passwords hashed with bcrypt factor 12 on every share generation.

- `src/actions/share.ts:75-80` - `bcrypt.hash(settings.password, 12)` on every update
- Salt factor 12 adds ~250ms per hash operation
- Done synchronously in server action (blocks response)

**Risk:** Users perceive slow UI. Potential DoS if many share link password updates requested concurrently.

**Current mitigation:** Passwords are optional and only for share links (low-security context).

**Recommendations:**
- Reduce salt factor to 10 for share links (still secure, 4x faster)
- Cache hashes if password unchanged: check if `newPassword === oldPassword` before rehashing
- Use async bcrypt operations to prevent blocking (already async, good)

---

### Tenant Isolation: Calculation Owner Bypass Risk

**Issue:** Tenant client verification for `calculation.findUnique()` is correct but custom `findUnique` handling is complex.

- `src/lib/db/tenant-client.ts:150-166` - Special handling for `findUnique` with ownership check
- Ownership check happens AFTER user provides select clause
- If user selects `{ id: true }`, function fetches full record for check, then runs query again

**Risk:** Potential for subtle authorization bugs if this logic is modified. Complex code = error-prone.

**Current implementation:** Safe (two queries for ownership + actual query), but inefficient.

**Recommendations:**
- Simplify: query with `select: { orgId: true }` first, throw if mismatch
- Add comment explaining why double-query is necessary (select clause applied after check)
- Write integration tests verifying:
  - User from org A cannot read org B's calculations
  - User from org A cannot update org B's calculations
  - Closure role cannot access other closers' calculations

---

### Share Link Public Access Has No Bot Detection

**Issue:** Public share links are guessable if share code is short, and have no anti-bot protection.

- `src/lib/share/generate-code.ts:20` - Uses `nanoid()` (21 chars, cryptographically secure)
- `src/app/(public)/[org]/[shareCode]/page.tsx` - No rate limiting on view recording
- No CAPTCHA or bot detection

**Risk:** Share code brute force theoretically possible (though 21 chars = 126 bits entropy makes it impractical). Public endpoints can be scraped for view counts and analytics data.

**Current security:** nanoid guarantees unguessability.

**Recommendations:**
- Add rate limiting to public share page: max 30 views per IP per hour
- Block IPs with >100 requests/hour
- Implement bot detection via fingerprinting (IP + user-agent patterns)
- Log suspicious activity (bulk view attempts) for manual review

---

## Fragile Areas

### Calculation Wizard State Management Complexity

**Files:** `src/stores/calculation-wizard-store.ts`, `src/components/calculations/wizard/calculation-wizard.tsx`, `src/hooks/use-auto-save.ts`

**Why fragile:**
- Zustand store with localStorage persistence can desync with server state
- Multiple overlapping state updates: user input → store → auto-save → server → refresh browser
- If server save fails, wizard state may be stale
- Consumption profile is complex nested structure (12 months × 24 hours = 288 values)

**Safe modification:**
- Never modify auto-save debounce timing without testing full edit → save → refresh → resume flow
- Always validate consumption profile shape before saving (validate against schema in store)
- Test recovery: start edit, close browser, reopen, verify data persists correctly
- When adding fields: update both Zustand store AND Zod schema in `saveDraftSchema`

**Test coverage gaps:**
- No tests for localStorage persistence across sessions
- No tests for auto-save recovery after network failure
- No tests for consuming profile validation
- No tests for concurrent edits (edge case: multiple tabs)

---

### Permission System: Role-Based Access Without Explicit Model

**Files:** `src/lib/auth/permissions.ts`, `src/actions/*.ts`

**Why fragile:**
- Permissions defined as object literal with no database enforceability
- Role enum in Prisma schema can drift from permission checks
- Adding new role requires manual updates in multiple places:
  1. `prisma/schema.prisma` enum Role
  2. `src/lib/auth/permissions.ts` permission definitions
  3. All action files using `hasPermission()`
- No audit trail of permission changes
- No role assignment validation (e.g., preventing user from assigning role higher than their own)

**Safe modification:**
- Any role addition MUST update both schema.prisma and permissions.ts
- Add integration test for each new permission: verify allowed and denied paths
- Document permission matrix in ARCHITECTURE.md when changes made
- Never rely on role name string; always use ROLES enum

**Test coverage gaps:**
- No tests verifying Super Admin can access any org's data
- No tests verifying Org Admin cannot access other orgs
- No tests verifying Closer cannot edit other closers' data
- No negative tests (verify denied access returns error, not success)

---

### Tenant Scoping: Implicit Org Injection Risk

**Files:** `src/lib/db/tenant-client.ts`, all server actions using `createTenantClient()`

**Why fragile:**
- Tenant client automatically injects `orgId` on all create operations
- If developer forgets to use tenant client (uses `prisma` instead), data isolation breaks silently
- No compile-time enforcement; runtime-only safety
- Easy to accidentally create records outside tenant context:
  ```typescript
  // WRONG - creates with user-provided orgId, can escape tenant
  const calc = await prisma.calculation.create({ data: { orgId: userProvidedOrgId } })

  // RIGHT - orgId always set to session org
  const calc = await tenantDb.calculation.create({ data: { /* no orgId */ } })
  ```

**Safe modification:**
- Always use `const tenantDb = createTenantClient(session.user.orgId!)` at start of action
- Before reading from prisma directly (for non-tenant-scoped models), add comment explaining why
- Do NOT accept `orgId` as function parameter unless user is SUPER_ADMIN
- Code review focus: verify every create/update/delete uses tenantDb not prisma

**Test coverage gaps:**
- No test verifying Multi-Admin attempt to create calculation in other org fails
- No test verifying that `prisma.calculation.create()` direct call is caught/fails
- Integration tests needed: simulate malicious orgId override attempt

---

### Public Page Performance With Large Consumption Profiles

**Files:** `src/components/public/public-consumption-simulator.tsx`, `src/components/public/public-results-view.tsx`

**Why fragile:**
- Consumption profile is 288 data points (12 months × 24 hours) sent to client as JSON
- Simulator re-renders on every slider change with full recalculation
- Results view plots battery charge/discharge curves with high-frequency data points
- No memoization of heavy calculations (ROI math per consumption change)
- Recharts graph with 288+ points may be slow on mobile

**Safe modification:**
- Profile shape should never grow beyond 12×24 structure
- Test simulator performance: 100 rapid slider changes should not lag
- Add React.memo() to consumption step components if adding new child components
- Never add real-time calculations on every keystroke; use debounce like auto-save

**Test coverage gaps:**
- No performance test for simulator with large profiles
- No test for mobile rendering (especially important for public page)
- No test for accessibility: screen readers + keyboard nav on 288-value simulator

---

## Scaling Limits

### Database Connection Pool Exhaustion

**Current setup:**
- Uses Neon serverless adapter with Prisma
- Default connection pool: 10 connections (serverless limitation)
- Dashboard queries can use 1-2 connections per request when fetching multiple calculations

**Limit:** ~5 concurrent dashboard viewers before connection saturation

**Scaling path:**
1. Implement connection pooling middleware (PgBouncer)
2. Add query result caching (5-min TTL) for dashboard statistics
3. Use database read replicas for analytics queries
4. Monitor connection pool usage: add Sentry metric `db.pool.active_connections`

---

### Electricity Price Updates via External API

**Files:** `src/lib/electricity/fetch-prices.ts`

**Current approach:**
- Runs on-demand when calculation created/loaded
- Fetches from SMARD API (German market) as proxy for Nordic prices
- No caching; every calculation triggers new API call

**Limit:** SMARD API rate limit not documented. ~100 calculations/day → ~100 daily API calls (acceptable)

**Scaling path:**
1. Cache prices: fetch once daily at 2 AM, store in database table
2. Use cached prices in calculations unless stale (>24h)
3. Add retry logic for SMARD API failure
4. Monitor: `electricity.price_fetch_errors` in Sentry

---

### File Storage for Battery Images/PDFs

**Current:** Not implemented; files are URLs only (external hosting assumed)

**Limit:** If image hosting moves in-house, serverless function 10MB payload limit applies

**Scaling path:**
1. Use S3 or Cloudinary for image/PDF storage (external, no serverless limit)
2. If in-house needed: implement chunked upload + background processing
3. Add CDN caching for battery brand logos

---

## Dependencies at Risk

### Next.js Beta Dependency

**Issue:** `next-auth@5.0.0-beta.30` is pre-release software.

- Not production-stable
- Breaking changes may occur with minor version bumps
- Limited community support for beta versions

**Risk:** Auth functionality could break with future updates before v5 is released.

**Migration plan:**
- Monitor next-auth releases (https://github.com/nextauthjs/next-auth/releases)
- Switch to stable v5 on release (expected Q1 2025)
- If blocker issues arise, revert to v4: add compatibility layer, migrate incrementally

---

### Neon Serverless Adapter Compatibility

**Issue:** `@prisma/adapter-neon@7.2.0` is relatively new (Prisma 7 just released)

- Serverless over HTTP is less battle-tested than traditional postgres driver
- Connection timeout issues possible in cold starts
- Limited production history

**Risk:** Edge case bugs with long-running queries, connection persistence, or connection pooling.

**Current mitigation:** Works in development and production. No issues reported.

**Recommendations:**
- Monitor for connection errors in Sentry
- Have fallback: traditional pg adapter with PgBouncer as Plan B
- Keep database URL as environment variable for quick switch if needed

---

## Missing Critical Features

### No Search/Filter for Calculations

**Feature gap:** Admin dashboard shows only 10 most recent calculations. No search by customer name, date range, or margin status.

**Blocks:** Managing large volumes of calculations (>100). Finding specific customer records difficult.

**Priority:** Medium (nice-to-have for v1, essential for v2)

---

### No Calculation History/Versioning

**Feature gap:** When calculation is updated, previous versions are lost (except auto-save drafts).

**Blocks:** Cannot show customer how calculation changed over time, or revert to previous version.

**Priority:** Medium (useful for compliance, nice-to-have for v1)

---

### No Bulk Operations

**Feature gap:** Admin cannot bulk-delete, bulk-archive, or bulk-export calculations.

**Blocks:** Data cleanup inefficient, manual exports tedious.

**Priority:** Low (v2 feature)

---

## Test Coverage Gaps

### Financial Calculation Logic Untested

**Files:** `src/lib/calculations/formulas.ts`, `src/lib/calculations/battery-roi.ts`

**What's not tested:**
- Decimal.js precision with extreme values (very high savings or very low)
- Interaction between multiple savings components (spotpris + tariff + grid)
- Payback period calculation edge cases (negative savings, zero capacity)
- Degradation factor application over 25-year horizon

**Risk:** Silent rounding errors or logic bugs could misrepresent battery value to prospects. ROI calculations are core business logic.

**Priority:** Critical - test before any margin-related features

---

### Tenant Isolation Not Verified

**Files:** `src/lib/db/tenant-client.ts`, all data access patterns

**What's not tested:**
- Cannot read other org's battery configs
- Cannot update other org's natagare settings
- Cannot delete other org's calculations
- Cannot create shares for other org's calculations
- Org_Admin cannot escalate to see Super Admin data

**Risk:** Data leakage between customers. Critical security issue.

**Priority:** Critical - test before any multi-org deployment

---

### Permission System Not Verified

**Files:** `src/lib/auth/permissions.ts`, all protected actions

**What's not tested:**
- Closer cannot create users
- Closer cannot delete calculations (should only be Org_Admin)
- Org_Admin cannot create other orgs
- Super_Admin can do all operations

**Risk:** Unauthorized access via permission bypass.

**Priority:** Critical - test before production

---

### Public Share Link Functionality Untested

**Files:** `src/app/(public)/`, `src/actions/share.ts`

**What's not tested:**
- Password-protected shares reject invalid passwords
- Expired shares return 404
- View tracking increments correctly
- Variants saved by simulator actually persist

**Risk:** Share feature may be broken silently (broken for some, not others). Views not tracked. Variants lost.

**Priority:** High - core customer-facing feature

---

### Auto-Save Recovery Untested

**Files:** `src/hooks/use-auto-save.ts`, Zustand store, server actions

**What's not tested:**
- Browser refresh during edit restores state from localStorage
- Closing browser and reopening restores last saved calculation
- Network failure during auto-save gracefully handles error
- Concurrent edits (two tabs) don't corrupt state
- Auto-save continues after network recovers

**Risk:** Users lose work. Corrupted state possible. Poor edit experience.

**Priority:** High - core user experience

---

*Concerns audit: 2026-01-26*
