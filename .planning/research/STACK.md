# Technology Stack

**Project:** Kalkyla.se - Multi-tenant Battery ROI Calculator SaaS
**Researched:** 2026-01-19
**Overall Confidence:** HIGH

---

## Executive Summary

This stack leverages the user's predefined technologies (Next.js, Prisma, PostgreSQL, NextAuth, Tailwind, Vercel) while adding specific library recommendations for interactive charting, form handling, state management, and real-time calculations. The stack is production-ready and aligns with 2025/2026 best practices for multi-tenant SaaS.

---

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Next.js | 15.x (15.5+) | Full-stack React framework | App Router with React Server Components, Turbopack for fast dev, excellent Vercel integration. v16 is latest but 15.x is more battle-tested. | HIGH |
| React | 19.x | UI library | Required for Next.js 15+, concurrent features, improved hooks | HIGH |
| TypeScript | 5.x | Type safety | Non-negotiable for SaaS - catches bugs early, better DX | HIGH |

**Rationale:** Next.js 15.5+ is stable and battle-tested with Turbopack, offering up to 76.7% faster local server startup. React 19 brings concurrent rendering improvements essential for real-time calculation updates.

**Note:** Next.js 16.1.3 is the absolute latest (January 2026), but 15.x is recommended for stability unless you need specific v16 features.

Sources:
- [Next.js 15 Blog](https://nextjs.org/blog/next-15)
- [Next.js 15.5 Release](https://nextjs.org/blog/next-15-5)
- [Next.js GitHub Releases](https://github.com/vercel/next.js/releases)

---

### Styling

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Tailwind CSS | 4.x | Utility-first CSS | 5x faster builds, CSS-first configuration, built-in Lightning CSS. Modern features like cascade layers and color-mix(). | HIGH |
| React Bits | latest | Animated UI components | User-specified. 110+ animated components, supports Tailwind, copy-paste ready. | MEDIUM |

**Rationale:** Tailwind CSS v4.0 (released January 2025) is a ground-up rewrite with massive performance gains. Single import: `@import "tailwindcss"`. No PostCSS plugins needed for prefixing or imports.

**React Bits note:** This library focuses on animations and interactive effects. For form components and layouts, you may need to supplement with custom components or shadcn/ui patterns.

Sources:
- [Tailwind CSS v4.0](https://tailwindcss.com/blog/tailwindcss-v4)
- [React Bits GitHub](https://github.com/DavidHDev/react-bits)

---

### Database

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| PostgreSQL | 15+ | Primary database | Industry standard, RLS for multi-tenancy, excellent Prisma support | HIGH |
| Neon | - | Serverless PostgreSQL | **Recommended over Supabase** for this use case: serverless scale-to-zero, instant branching, better Vercel integration, simpler (just database, no BaaS overhead) | HIGH |
| Prisma ORM | 6.x | Database ORM | Type-safe queries, excellent migrations, works well with RLS via extensions | HIGH |

**Neon vs Supabase Decision:**

Choose **Neon** because:
- Pure serverless PostgreSQL (scale-to-zero = cost savings)
- Instant database branching for preview deployments
- Native Vercel integration
- Simpler architecture (you don't need Supabase's auth, storage, or realtime - you have NextAuth and your own calculation logic)

Choose Supabase only if:
- You need built-in auth (but you're using NextAuth)
- You need realtime subscriptions via WebSockets
- You need HIPAA compliance

**Multi-tenancy Strategy:** Use Row-Level Security (RLS) with Prisma extensions. Every tenant-scoped table includes `tenantId`, and RLS policies enforce isolation at the database level.

```sql
-- Example RLS policy
ALTER TABLE "Calculation" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "Calculation"
FOR ALL USING (tenant_id = current_setting('app.current_tenant')::UUID);
```

Sources:
- [Neon vs Supabase Comparison](https://www.devtoolsacademy.com/blog/neon-vs-supabase/)
- [Multi-tenant RLS with Prisma](https://medium.com/@francolabuschagne90/securing-multi-tenant-applications-using-row-level-security-in-postgresql-with-prisma-orm-4237f4d4bd35)
- [Prisma Docs](https://www.prisma.io/docs/getting-started)

---

### Authentication

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Auth.js (NextAuth v5) | 5.x | Authentication | User-specified credentials auth, mature ecosystem, App Router native | HIGH |
| @auth/prisma-adapter | latest | Prisma integration | Seamless user/session storage in PostgreSQL | HIGH |

**Important:** Auth.js v5 (formerly NextAuth v5) is the current version for Next.js App Router. The package is `next-auth@5.x` but the docs are at authjs.dev.

**Credentials Auth Setup:**
- Use `CredentialsProvider` for email/password
- Hash passwords with `bcrypt` or `argon2`
- Store sessions in database via Prisma adapter
- Implement proper CSRF protection (built-in)

Sources:
- [Auth.js Getting Started](https://authjs.dev/getting-started)

---

### Data Visualization (Critical for ROI Calculator)

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Recharts | 2.x | Charts and graphs | Best balance of ease-of-use and customization. SVG-based, responsive with ResponsiveContainer. JSX API, minimal learning curve. | HIGH |

**Why Recharts over alternatives:**

| Library | Verdict | Reason |
|---------|---------|--------|
| **Recharts** | **RECOMMENDED** | 80% of D3's power in 1/10th the code. Perfect for dashboards. |
| Chart.js | Not recommended | Canvas-based, harder to customize individual elements |
| Visx | Overkill | Low-level D3 primitives, 3x more code for same result |
| ECharts | Alternative | Consider if you need complex visualizations later |

**Charts you'll need for ROI calculator:**
- Line chart: Energy savings over time
- Bar chart: Monthly/yearly cost comparison
- Area chart: Cumulative savings
- Composed chart: Electricity price vs consumption

```tsx
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

<ResponsiveContainer width="100%" height={300}>
  <LineChart data={savingsData}>
    <XAxis dataKey="year" />
    <YAxis />
    <Tooltip />
    <Line type="monotone" dataKey="savings" stroke="#10b981" />
  </LineChart>
</ResponsiveContainer>
```

Sources:
- [Best React Chart Libraries 2025](https://blog.logrocket.com/best-react-chart-libraries-2025/)
- [8 Best React Chart Libraries](https://embeddable.com/blog/react-chart-libraries)

---

### Forms & Validation

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| React Hook Form | 7.x | Form state management | Minimal re-renders, uncontrolled inputs, excellent performance | HIGH |
| Zod | 3.x | Schema validation | Type inference, reusable schemas across client/server, works with RHF | HIGH |
| @hookform/resolvers | latest | RHF + Zod integration | zodResolver connects the two seamlessly | HIGH |

**Pattern for ROI Calculator Forms:**

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const calculationSchema = z.object({
  annualConsumption: z.number().min(1000).max(100000),
  batteryCapacity: z.number().min(5).max(50),
  electricityPrice: z.number().min(0.5).max(5),
  installationCost: z.number().min(10000).max(500000),
});

type CalculationInput = z.infer<typeof calculationSchema>;

// Reuse schema on server for API validation
```

Sources:
- [React Hook Form with Zod](https://www.freecodecamp.org/news/react-form-validation-zod-react-hook-form/)
- [Advanced React Hook Form](https://wasp.sh/blog/2025/01/22/advanced-react-hook-form-zod-shadcn)

---

### State Management

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Zustand | 5.x | Client state | Minimal boilerplate, no providers needed, 3KB bundle | HIGH |
| TanStack Query | 5.x | Server state | Caching, mutations, background refetch. Don't use Zustand for server data. | HIGH |
| nuqs | 2.5+ | URL state | Type-safe search params, shareable URLs for calculations | HIGH |

**State Architecture:**

```
URL State (nuqs)          → Shareable calculation parameters
  ↓
Server State (TanStack)   → Fetched data (electricity prices, user calcs)
  ↓
Client State (Zustand)    → UI state (modal open, theme, sidebar)
  ↓
Component State (useState) → Local ephemeral state
```

**Why this combination:**
- **nuqs** for URL state is critical for ROI calculator - prospects can share links with their specific inputs
- **TanStack Query** for server data (Nord Pool prices, saved calculations) with automatic caching
- **Zustand** only for UI state that doesn't belong in URL or server

**Recommended stack:** `TanStack Query + nuqs + Zustand` (common 2025 pattern)

Sources:
- [State Management 2025](https://makersden.io/blog/react-state-management-in-2025)
- [nuqs Official](https://nuqs.dev/)
- [React Advanced 2025 nuqs Talk](https://www.infoq.com/news/2025/12/nuqs-react-advanced/)

---

### Real-Time Calculation Updates

For live-updating ROI calculations as users adjust sliders:

| Pattern | Implementation | When to Use |
|---------|----------------|-------------|
| Debounced updates | `useMemo` + `lodash.debounce` | Slider adjustments (300ms delay) |
| useDeferredValue | React 19 built-in | Non-urgent derived calculations |
| Optimistic updates | TanStack Query mutations | Saving calculations |

**Implementation Pattern:**

```tsx
import { useMemo, useDeferredValue } from 'react';
import debounce from 'lodash.debounce';

// For input-driven calculations
const debouncedCalculate = useMemo(
  () => debounce((inputs) => calculateROI(inputs), 300),
  []
);

// For expensive derived state
const deferredResults = useDeferredValue(calculationResults);
```

**Important:** Clean up debounced functions on unmount to prevent memory leaks.

Sources:
- [Debouncing in React](https://www.developerway.com/posts/debouncing-in-react)
- [React useDeferredValue](https://react.dev/reference/react/useDeferredValue)

---

### Monitoring & Analytics

| Technology | Purpose | Why | Confidence |
|------------|---------|-----|------------|
| Sentry | Error tracking | User-specified. Excellent Next.js App Router support, source maps, performance monitoring | HIGH |
| PostHog | Product analytics | User-specified. Self-hostable, feature flags, session replay, open-source | HIGH |

**Sentry Setup for Next.js 15+:**

```bash
npx @sentry/wizard@latest -i nextjs
```

This creates:
- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`
- `app/global-error.tsx`

**PostHog Setup for Next.js 15.3+:**

```tsx
// instrumentation-client.ts (new approach for Next.js 15.3+)
import posthog from 'posthog-js';

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  defaults: '2025-11-30', // Auto pageview/pageleave
});
```

Sources:
- [Sentry Next.js Manual Setup](https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/)
- [PostHog Next.js Docs](https://posthog.com/docs/libraries/next-js)

---

### External Integrations

| Integration | Purpose | Implementation | Confidence |
|-------------|---------|----------------|------------|
| N8N | Workflow automation, alerts | Webhook triggers from Next.js API routes | MEDIUM |
| Nord Pool API | Electricity spot prices | Server-side fetch with caching (TanStack Query) | MEDIUM |

**N8N Integration Pattern:**

```tsx
// app/api/alerts/route.ts
export async function POST(req: Request) {
  const data = await req.json();

  // Trigger N8N webhook
  await fetch(process.env.N8N_WEBHOOK_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event: 'calculation_shared',
      calculationId: data.id,
      recipientEmail: data.email,
    }),
  });

  return Response.json({ success: true });
}
```

Sources:
- [N8N Webhook Documentation](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)

---

### Hosting & Infrastructure

| Technology | Purpose | Why | Confidence |
|------------|---------|-----|------------|
| Vercel | Hosting | User-specified. Native Next.js support, edge functions, preview deployments | HIGH |
| Vercel Analytics | Web vitals | Built-in, zero config | HIGH |

**Vercel Configuration:**

```json
// vercel.json (minimal - most config via next.config.ts)
{
  "regions": ["arn1"], // Stockholm for Swedish users
  "env": {
    "DATABASE_URL": "@database-url",
    "NEXTAUTH_SECRET": "@nextauth-secret"
  }
}
```

---

## What NOT to Use

| Technology | Reason |
|------------|--------|
| Redux | Overkill for this app. Zustand + TanStack Query covers all needs with less boilerplate. |
| Redux Toolkit | Same as above. Modern alternatives are simpler. |
| Axios | Unnecessary. Native `fetch` + TanStack Query is sufficient. |
| styled-components | Tailwind CSS v4 handles all styling needs. SSR complexity not worth it. |
| Emotion | Same as styled-components. |
| MUI / Chakra UI | Opinionated design systems conflict with React Bits and custom branding. |
| Supabase (as primary) | Adds BaaS complexity you don't need. Use Neon for pure PostgreSQL. |
| Firebase | Not PostgreSQL, vendor lock-in, less control over data. |
| Chart.js | Canvas-based, harder to customize than Recharts SVG approach. |
| D3.js directly | Too low-level. Recharts wraps D3 with React-friendly API. |
| Next.js 16.x | Too new (January 2026). 15.x is battle-tested. |
| Pages Router | Legacy. App Router is the future and better for this use case. |

---

## Installation Commands

### Core Dependencies

```bash
# Create project
npx create-next-app@latest kalkyla --typescript --tailwind --eslint --app --src-dir

# Database
npm install prisma @prisma/client
npm install -D prisma

# Auth
npm install next-auth@5 @auth/prisma-adapter

# Forms & Validation
npm install react-hook-form @hookform/resolvers zod

# State Management
npm install zustand @tanstack/react-query nuqs

# Charts
npm install recharts

# Utilities
npm install lodash.debounce date-fns
npm install -D @types/lodash.debounce
```

### Monitoring

```bash
# Sentry (use wizard)
npx @sentry/wizard@latest -i nextjs

# PostHog
npm install posthog-js
```

### Development Tools

```bash
npm install -D prettier prettier-plugin-tailwindcss
npm install -D @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

---

## Version Matrix

| Package | Minimum Version | Recommended | Notes |
|---------|-----------------|-------------|-------|
| next | 15.0.0 | 15.5.x | Turbopack stable |
| react | 19.0.0 | 19.x | Required for Next.js 15 |
| typescript | 5.0.0 | 5.x | Latest stable |
| tailwindcss | 4.0.0 | 4.x | Major rewrite |
| prisma | 6.0.0 | 6.x | Latest |
| next-auth | 5.0.0 | 5.x | App Router native |
| recharts | 2.10.0 | 2.x | Stable |
| react-hook-form | 7.50.0 | 7.x | Stable |
| zod | 3.22.0 | 3.x | Stable |
| zustand | 5.0.0 | 5.x | Latest |
| @tanstack/react-query | 5.0.0 | 5.x | Latest |
| nuqs | 2.5.0 | 2.5+ | Key isolation feature |

---

## Confidence Assessment

| Area | Confidence | Reasoning |
|------|------------|-----------|
| Core Framework (Next.js 15) | HIGH | Official docs, stable releases, widely adopted |
| Database (Neon + Prisma) | HIGH | Official docs, production-proven |
| Auth (NextAuth v5) | HIGH | Official docs, App Router support documented |
| Charts (Recharts) | HIGH | Multiple 2025 comparisons agree |
| Forms (RHF + Zod) | HIGH | Industry standard, official integration |
| State (Zustand + TanStack) | HIGH | 2025 best practices consensus |
| URL State (nuqs) | HIGH | React Advanced 2025 showcase, used by Vercel/Sentry |
| Tailwind v4 | MEDIUM | New release (Jan 2025), may have edge cases |
| React Bits | MEDIUM | User-specified, less documentation than shadcn |
| N8N Integration | MEDIUM | Generic webhook pattern, not Next.js-specific docs |

---

## Sources

### Official Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Auth.js Documentation](https://authjs.dev)
- [Tailwind CSS v4](https://tailwindcss.com/blog/tailwindcss-v4)
- [Recharts Guide](https://recharts.org/en-US/guide)
- [React Hook Form](https://react-hook-form.com)
- [Zod Documentation](https://zod.dev)
- [Zustand GitHub](https://github.com/pmndrs/zustand)
- [TanStack Query](https://tanstack.com/query)
- [nuqs Documentation](https://nuqs.dev)
- [Sentry Next.js](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [PostHog Next.js](https://posthog.com/docs/libraries/next-js)
- [N8N Webhook](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)

### Comparison Articles
- [Best React Chart Libraries 2025 - LogRocket](https://blog.logrocket.com/best-react-chart-libraries-2025/)
- [State Management 2025 - Makers' Den](https://makersden.io/blog/react-state-management-in-2025)
- [Neon vs Supabase - DevTools Academy](https://www.devtoolsacademy.com/blog/neon-vs-supabase/)
- [nuqs at React Advanced 2025 - InfoQ](https://www.infoq.com/news/2025/12/nuqs-react-advanced/)
