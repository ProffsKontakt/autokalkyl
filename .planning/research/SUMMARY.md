# Project Research Summary

**Project:** Kalkyla.se - Multi-tenant Battery ROI Calculator SaaS
**Domain:** Swedish energy market sales enablement tool
**Researched:** 2026-01-19
**Confidence:** HIGH

## Executive Summary

Kalkyla.se is a multi-tenant SaaS platform that enables solar/battery installers to create and share ROI calculations with prospects. The product sits at the intersection of CPQ (Configure, Price, Quote) software and Swedish energy market specifics, requiring expertise in both multi-tenant architecture and domain-specific calculations (effekttariff, Gron Teknik deductions, Nord Pool spot prices). The recommended approach leverages Next.js 15 with App Router, Prisma with PostgreSQL (Neon), and Auth.js v5, with critical emphasis on tenant isolation from day one and decimal precision for financial calculations.

The Swedish market presents both opportunity and complexity. Effekttariff (power tariff) rules vary by natagare (grid operator), Gron Teknik tax deductions changed rates in June 2025, and Nord Pool shifted to 15-minute Market Time Units in October 2025. These domain specifics must be configurable, not hardcoded. The stack is well-documented and production-ready, but the calculation engine requires careful research into Swedish regulations.

Key risks center on multi-tenant data leakage (a breach, not a bug), financial calculation precision errors that compound over 25-year projections, and N8N webhook security vulnerabilities (CVE-2026-21858). Mitigation requires Row-Level Security at the database layer, decimal.js for all financial math, and keeping N8N isolated and updated. The architecture should be defense-in-depth: Prisma Client Extensions for tenant filtering, RLS as backup, and API-level validation as final check.

## Key Findings

### Recommended Stack

The user's predefined stack (Next.js, Prisma, PostgreSQL, NextAuth, Tailwind, Vercel) is production-ready and aligns with 2025/2026 best practices. Key additions include Recharts for ROI visualizations, React Hook Form + Zod for validated inputs, and nuqs for shareable URL state (critical for calculation sharing). Neon is recommended over Supabase for pure serverless PostgreSQL without BaaS overhead.

**Core technologies:**
- **Next.js 15.5+**: App Router with React Server Components, Turbopack for fast dev
- **Prisma 6.x + Neon**: Type-safe ORM with serverless PostgreSQL, scale-to-zero pricing
- **Auth.js v5**: Credentials auth with Prisma adapter, App Router native
- **Recharts**: SVG-based charts for ROI visualizations, React-friendly API
- **React Hook Form + Zod**: Form state with schema validation, reusable client/server
- **TanStack Query + nuqs + Zustand**: Server state, URL state, UI state separation
- **decimal.js**: Arbitrary precision arithmetic for financial calculations

### Expected Features

**Must have (table stakes):**
- Multi-tenant organization management with RBAC (Super Admin, Org Admin, Closer, Prospect)
- Calculation builder: customer info, consumption input, battery selection, pricing/margin
- Shareable public links with org branding, view-only mode
- Basic admin dashboard with calculation metrics

**Should have (competitive advantage):**
- Swedish energy market intelligence: natagare database, effekttariff optimization
- Interactive consumption adjustment on public view (client-side recalculation)
- Gron Teknik deduction with date-based rates and per-person caps
- PDF export for offline sharing
- Margin alerts via N8N webhooks

**Defer (v2+):**
- Grid services income projection (FCR-D, aFRR, mFRR)
- Custom domain support
- SSO/SAML integration
- 15-year projections (10-year sufficient initially)
- Bulk user import

### Architecture Approach

Shared database with row-level filtering is recommended for initial scale (<1000 orgs). The architecture follows a layered defense model: Prisma Client Extensions inject orgId filters automatically, PostgreSQL RLS provides database-level enforcement, and API route validation adds a final check. Server Components handle data fetching with tenant-scoped Prisma clients, while calculations run client-side for instant feedback. Server Actions handle all mutations.

**Major components:**
1. **Presentation Layer** (Next.js App Router) - Route groups for auth, dashboard, public, admin
2. **Data Access Layer** - TenantPrismaClient factory, CalculationEngine, PriceCache
3. **Authentication Layer** - Auth.js with RBAC, tenant context from JWT claims
4. **External Integrations** - N8N webhooks (authenticated), PostHog analytics (client), Nord Pool (cached)

### Critical Pitfalls

1. **Multi-tenant data leakage** - Implement RLS + Prisma Extensions + tenant-scoped client from day one. One forgotten WHERE clause is a GDPR breach.

2. **Connection pool exhaustion** - Use Prisma Accelerate or Neon's built-in pooling. Never call $disconnect() in serverless. Configure connection limits below Vercel concurrency.

3. **Floating-point precision errors** - Use decimal.js for ALL financial calculations. Store monetary values as integers (ore, not SEK). Test against spreadsheet verification.

4. **Guessable share tokens** - Use UUIDv4 with cryptographic suffix. Implement rate limiting and link expiration (30 days default).

5. **N8N webhook vulnerabilities** - Keep N8N >= 1.121.0. Use HMAC signature verification. Never expose N8N directly to internet.

6. **RBAC bypass via middleware-only auth** - Enforce authorization at every layer. Update Next.js to patched version (CVE-2025-29927).

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation
**Rationale:** Everything depends on auth, tenant isolation, and database patterns. "The most expensive mistake in SaaS development is treating multi-tenancy as a feature you can add later."
**Delivers:** Working authentication, tenant-scoped data access, basic app shell
**Addresses:** Organization CRUD, User management, RBAC
**Avoids:** Data leakage (#1), Connection exhaustion (#2), RBAC bypass (#6)
**Estimated:** 2 weeks

### Phase 2: Core Calculator
**Rationale:** Requires foundation complete. Reference data (natagare, prices) needed before calculations. Engine logic before UI.
**Delivers:** Working ROI calculator with Swedish market specifics
**Uses:** decimal.js, Recharts, React Hook Form + Zod, nuqs
**Implements:** Calculation engine (spotpris, effekttariff, Gron Teknik), battery catalog, consumption input
**Avoids:** Float precision (#3), Effect tariff errors (#8), Gron Teknik errors (#9), Time zone bugs (#11)
**Estimated:** 2-3 weeks

### Phase 3: Sharing
**Rationale:** Requires calculations to exist. Core value proposition for sales enablement.
**Delivers:** Public shareable links with org branding, view tracking
**Implements:** Share token generation, public view route, interactive adjustment, access logging
**Avoids:** Guessable tokens (#4), Orphaned links (#12)
**Estimated:** 1 week

### Phase 4: Integrations
**Rationale:** Enhancement layer after core product works. Can ship MVP without these.
**Delivers:** Analytics, automation, real-time pricing
**Implements:** PostHog analytics, N8N webhook alerts, Nord Pool price sync, PDF export
**Avoids:** N8N vulnerabilities (#5), Nord Pool brittleness (#7)
**Estimated:** 1 week

### Phase Ordering Rationale

- **Foundation first:** Auth and tenant isolation are architectural decisions that pervade everything. Retrofitting is 5x more expensive.
- **Calculator second:** The core value proposition. Public links are useless without calculations to share.
- **Sharing third:** Depends on calculations existing. Relatively simple with proper token design.
- **Integrations last:** Enhancement layer. MVP can launch without analytics or webhooks.
- **Total MVP:** 6-7 weeks development

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2:** Effekttariff rules vary significantly by natagare. Need to research specific grid operators for initial launch markets.
- **Phase 2:** Gron Teknik rules may change. Need authoritative Skatteverket documentation.
- **Phase 4:** Nord Pool API specifics. 15-minute MTU handling, rate limits, data format.

Phases with standard patterns (skip research-phase):
- **Phase 1:** Auth.js + Prisma + Next.js patterns well-documented
- **Phase 3:** Standard shareable link patterns, no domain-specific complexity

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Official docs, stable releases, widely adopted. Next.js 15.5, Prisma 6, Auth.js v5 all battle-tested. |
| Features | MEDIUM-HIGH | CPQ and multi-tenant patterns verified. Swedish market specifics based on multiple sources but regulations change. |
| Architecture | HIGH | Multi-tenant, RLS, App Router patterns well-documented. Defense-in-depth approach is industry standard. |
| Pitfalls | HIGH | CVEs verified (N8N, Next.js middleware). Financial precision issues widely documented. Swedish tax rules from Skatteverket. |

**Overall confidence:** HIGH

### Gaps to Address

- **Natagare tariff database:** Need to determine which grid operators to support initially and research their specific effekttariff rules. Consider starting with Stockholm/major cities.
- **Nord Pool API access:** Need to verify API access terms and rate limits. Consider using third-party data providers if official API is restrictive.
- **React Bits library:** User-specified but less documented than alternatives. May need to supplement with shadcn/ui patterns for form components.
- **Gron Teknik future changes:** Tax incentives may change. Build with configurability in mind.

## Sources

### Primary (HIGH confidence)
- [Next.js Official Documentation](https://nextjs.org/docs) - App Router, middleware, server components
- [Prisma Documentation](https://www.prisma.io/docs) - Client extensions, connection pooling, serverless deployment
- [Auth.js Documentation](https://authjs.dev) - v5 setup, RBAC patterns
- [Skatteverket Gron Teknik](https://www.skatteverket.se/privat/fastigheterochbostad/gronteknik.4.676f4884175c97df4192860.html) - Tax deduction rules

### Secondary (MEDIUM confidence)
- [Energiforetagen](https://www.energiforetagen.se/energifakta/elsystemet/elnatet--distribution-av-el/effekttarifftariffer/) - Effekttariff background
- [Sourceful Energy](https://sourceful.energy/blog/how-stockholm-homeowners-are-saving-2-925-kr-per-year-on-peak-demand-fees) - Swedish battery savings specifics
- [WorkOS Multi-Tenant Guide](https://workos.com/blog/developers-guide-saas-multi-tenant-architecture) - RBAC and tenant isolation patterns
- [Neon vs Supabase Comparison](https://www.devtoolsacademy.com/blog/neon-vs-supabase/) - Database provider decision

### Tertiary (LOW confidence)
- Nord Pool 15-minute MTU details - Limited public documentation, may need API exploration
- Individual natagare tariff rules - Varies by provider, needs case-by-case research

---
*Research completed: 2026-01-19*
*Ready for roadmap: yes*
