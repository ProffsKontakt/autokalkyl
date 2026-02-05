# Phase 12: Analytics & Dashboard - Research

**Researched:** 2026-02-05
**Domain:** PostHog analytics integration with server-side events and embedded dashboards
**Confidence:** MEDIUM (PostHog docs verified, but embedded filtering capabilities have limitations)

## Summary

This phase implements working PostHog analytics with role-based embedded dashboards. The research reveals that the optimal approach is a **hybrid strategy**: use the existing `posthog-js` client-side library (already installed at v1.331.0) for UI interactions, add `posthog-node` for reliable server-side business events, and build custom API-based dashboards using PostHog's Query API with Recharts (already in the project) rather than relying on PostHog's embedded iframes.

The bot detection issue is solved by setting `opt_out_useragent_filter: true` in the PostHog config. However, the real reliability fix comes from moving critical business events (calculation create/update/delete/view) to server-side tracking where ad blockers cannot interfere.

PostHog's embedded dashboard iframes lack the ability to dynamically filter by custom properties via URL parameters (this is an open feature request). For role-scoped dashboards (Super Admin sees all, Org Admin sees org, Closer sees own), the recommended approach is to query PostHog's API server-side, filter the data, and render custom charts. This also achieves the "native Kalkyla feel" requirement.

**Primary recommendation:** Use posthog-node for server-side event capture on all business-critical events, build custom React dashboards with Recharts that fetch data from PostHog Query API through Next.js API routes, and add `opt_out_useragent_filter: true` to fix bot detection.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| posthog-js | 1.331.0 | Client-side analytics (already installed) | Official PostHog React SDK, handles pageviews, autocapture |
| posthog-node | latest | Server-side event capture | Reliable delivery, no ad-blocker interference, required for business events |
| recharts | 3.6.0 | Chart visualization (already installed) | Already in project, PostHog recommends for custom dashboards |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tanstack/react-query | 5.90.19 | Data fetching (already installed) | Caching PostHog API responses, auto-refresh |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom API dashboards | PostHog iframe embeds | Iframes cannot filter by org/user dynamically; no native feel |
| posthog-node | Direct HTTP API calls | SDK handles batching, retries, shutdown properly |
| Recharts | shadcn/ui charts | Recharts already in project, well-documented PostHog tutorials |

**Installation:**
```bash
npm install posthog-node
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   └── analytics/
│       ├── posthog.ts          # Existing client-side helper
│       ├── posthog-server.ts   # NEW: Server-side singleton
│       ├── events.ts           # Existing client events
│       └── server-events.ts    # NEW: Server-side event capture
├── actions/
│   ├── calculations.ts         # ADD: Track create/update/delete
│   ├── share.ts                # ADD: Track view, share link generated
│   └── analytics.ts            # NEW: Query PostHog API for dashboards
├── app/
│   ├── (dashboard)/
│   │   └── dashboard/
│   │       ├── page.tsx        # ADD: Analytics widget
│   │       └── analytics/
│   │           └── page.tsx    # NEW: Full analytics page
│   └── api/
│       └── analytics/
│           └── route.ts        # NEW: PostHog Query API proxy
└── components/
    └── analytics/
        ├── posthog-provider.tsx    # MODIFY: Add opt_out_useragent_filter
        ├── dashboard-widget.tsx    # NEW: Quick glance widget
        ├── analytics-dashboard.tsx # NEW: Full dashboard with charts
        ├── calculation-metrics.tsx # NEW: Calculation stats chart
        └── engagement-chart.tsx    # NEW: Prospect engagement chart
```

### Pattern 1: Server-Side PostHog Client Singleton
**What:** Initialize posthog-node once with proper serverless settings
**When to use:** Any server action or API route that needs to capture events
**Example:**
```typescript
// Source: https://posthog.com/docs/libraries/node
// src/lib/analytics/posthog-server.ts
import { PostHog } from 'posthog-node'

let posthogClient: PostHog | null = null

export function getServerPostHog(): PostHog {
  if (!posthogClient) {
    posthogClient = new PostHog(
      process.env.POSTHOG_API_KEY!, // Server-side key (not NEXT_PUBLIC_)
      {
        host: process.env.POSTHOG_HOST || 'https://eu.i.posthog.com',
        // Critical for Next.js serverless: flush immediately
        flushAt: 1,
        flushInterval: 0,
      }
    )
  }
  return posthogClient
}

export async function captureServerEvent(
  distinctId: string,
  event: string,
  properties: Record<string, unknown>
): Promise<void> {
  const client = getServerPostHog()
  client.capture({
    distinctId,
    event,
    properties,
  })
  // Critical: shutdown to flush in serverless
  await client.shutdown()
}
```

### Pattern 2: Server-Side Event Capture in Actions
**What:** Capture business events in server actions for reliability
**When to use:** Any calculation lifecycle event (create, update, delete, view)
**Example:**
```typescript
// Source: https://posthog.com/docs/libraries/next-js
// In src/actions/calculations.ts - saveDraft function

import { captureServerEvent } from '@/lib/analytics/posthog-server'

// After successful calculation create/update:
await captureServerEvent(
  session.user.id,       // distinct_id
  'calculation_saved',   // event name
  {
    calculation_id: created.id,
    org_id: effectiveOrgId,
    closer_id: session.user.id,
    status: 'DRAFT',
    is_new: !data.calculationId,
    customer_name: data.customerName,
    elomrade: data.elomrade,
  }
)
```

### Pattern 3: PostHog Query API for Custom Dashboards
**What:** Fetch analytics data server-side and render with Recharts
**When to use:** Building role-scoped dashboard views
**Example:**
```typescript
// Source: https://posthog.com/docs/api/queries
// src/app/api/analytics/route.ts

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { query, orgId, closerId } = await request.json()

  // Build HogQL query with role-based filters
  let hogqlQuery = query
  if (session.user.role === 'CLOSER') {
    hogqlQuery += ` AND properties.closer_id = '${session.user.id}'`
  } else if (session.user.role === 'ORG_ADMIN') {
    hogqlQuery += ` AND properties.org_id = '${session.user.orgId}'`
  }
  // SUPER_ADMIN sees all

  const response = await fetch(
    `${process.env.POSTHOG_HOST}/api/projects/${process.env.POSTHOG_PROJECT_ID}/query`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.POSTHOG_PERSONAL_API_KEY}`,
      },
      body: JSON.stringify({
        query: {
          kind: 'HogQLQuery',
          query: hogqlQuery,
        },
      }),
    }
  )

  const data = await response.json()
  return NextResponse.json(data)
}
```

### Pattern 4: Auto-Refreshing Dashboard with React Query
**What:** Fetch and cache PostHog data with automatic refresh
**When to use:** Dashboard components that need real-time updates
**Example:**
```typescript
// src/components/analytics/analytics-dashboard.tsx
'use client'

import { useQuery } from '@tanstack/react-query'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export function AnalyticsDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics', 'calculations'],
    queryFn: async () => {
      const res = await fetch('/api/analytics', {
        method: 'POST',
        body: JSON.stringify({
          query: `SELECT
            formatDateTime(timestamp, '%Y-%m-%d') as date,
            count() as count
            FROM events
            WHERE event = 'calculation_saved'
            GROUP BY date
            ORDER BY date DESC
            LIMIT 30`
        }),
      })
      return res.json()
    },
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    staleTime: 15000,
  })

  // Transform PostHog response to Recharts format
  const chartData = data?.results?.map((row: unknown[]) => ({
    date: row[0],
    count: row[1],
  })) ?? []

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="count" stroke="#3B82F6" />
      </LineChart>
    </ResponsiveContainer>
  )
}
```

### Anti-Patterns to Avoid
- **Client-side tracking for business events:** Ad blockers will block ~30% of events. Always use server-side for calculation lifecycle.
- **PostHog iframe embeds for role-scoped dashboards:** Cannot filter by org/user dynamically via URL. Requires separate dashboard per org.
- **Calling `posthog.capture()` in server actions:** Use `posthog-node`, not `posthog-js` on the server.
- **Forgetting `await posthog.shutdown()`:** In serverless, events will be lost without explicit flush.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Event batching/retries | Custom HTTP queue | posthog-node SDK | Handles batching, retries, flush on shutdown |
| Chart visualization | Custom SVG/Canvas | Recharts (already installed) | PostHog provides tutorials, well-tested |
| Data caching | Custom state management | @tanstack/react-query (already installed) | Handles stale-while-revalidate, refetch intervals |
| Bot detection bypass | Custom user-agent parsing | `opt_out_useragent_filter: true` | PostHog's built-in solution |
| Scroll depth tracking | Custom scroll listeners | Existing PublicAnalytics component | Already implemented, just needs server backup |

**Key insight:** The codebase already has most infrastructure (Recharts, React Query, PostHog provider). The main additions are posthog-node for server-side and API routes for data fetching.

## Common Pitfalls

### Pitfall 1: Events Lost in Serverless Functions
**What goes wrong:** Events captured in API routes/server actions never reach PostHog
**Why it happens:** Serverless functions terminate before async HTTP requests complete
**How to avoid:**
- Set `flushAt: 1` and `flushInterval: 0` in posthog-node config
- Always call `await posthog.shutdown()` after capturing events
- Consider using Next.js 15.1+ `after()` or Vercel `waitUntil()` for non-blocking sends
**Warning signs:** Events appear in local dev but not in production PostHog

### Pitfall 2: Bot Detection Blocking Real Traffic
**What goes wrong:** PostHog silently drops all events, no data appears
**Why it happens:** Default bot detection is aggressive, blocks automated/headless browsers
**How to avoid:** Add `opt_out_useragent_filter: true` to posthog.init() config
**Warning signs:** No events in PostHog, console shows "PostHog: opt out" messages

### Pitfall 3: Embedded Iframes Cannot Filter Dynamically
**What goes wrong:** Trying to pass org_id via URL params to PostHog embed
**Why it happens:** PostHog embeds don't support URL-based filter parameters (open feature request)
**How to avoid:** Build custom dashboards with Query API instead of iframes
**Warning signs:** All users see same data regardless of role

### Pitfall 4: Query API Rate Limits
**What goes wrong:** Dashboard stops loading after heavy usage
**Why it happens:** PostHog Query API has 2400/hour rate limit
**How to avoid:**
- Cache responses with React Query (already implemented)
- Use longer `staleTime` (15-30 seconds)
- Batch multiple metrics into single queries where possible
**Warning signs:** 429 HTTP errors in network tab

### Pitfall 5: Missing distinct_id on Server Events
**What goes wrong:** Events captured but not linked to users
**Why it happens:** Server-side events require explicit distinct_id (no automatic session)
**How to avoid:** Always pass `session.user.id` as distinct_id in server actions
**Warning signs:** Events appear as "Anonymous" in PostHog

### Pitfall 6: Group Analytics Confusion
**What goes wrong:** Expecting org-level filtering to work without setup
**Why it happens:** Group Analytics is a paid add-on, requires explicit group tracking
**How to avoid:**
- For MVP: Filter by `properties.org_id` without Group Analytics
- Later: Consider Group Analytics add-on if needed for org-level insights
**Warning signs:** `$group_0` properties not appearing in events

## Code Examples

Verified patterns from official sources:

### Bot Detection Fix
```typescript
// Source: https://posthog.com/docs/web-analytics/faq
// src/components/analytics/posthog-provider.tsx - MODIFY

posthog.init(key, {
  api_host: host,
  capture_pageview: false,
  capture_pageleave: true,
  person_profiles: 'identified_only',
  autocapture: true,
  // FIX: Disable bot detection that blocks real traffic
  opt_out_useragent_filter: true,
  // Existing config...
  advanced_disable_feature_flags: true,
  advanced_disable_feature_flags_on_first_load: true,
})
```

### Server-Side Event Capture
```typescript
// Source: https://posthog.com/docs/libraries/node
// src/lib/analytics/server-events.ts

import { getServerPostHog } from './posthog-server'

export async function trackCalculationCreated(
  userId: string,
  calculationId: string,
  orgId: string,
  customerName: string
): Promise<void> {
  const client = getServerPostHog()

  client.capture({
    distinctId: userId,
    event: 'calculation_created',
    properties: {
      calculation_id: calculationId,
      org_id: orgId,
      closer_id: userId,
      customer_name: customerName,
      $set: { last_calculation_at: new Date().toISOString() },
    },
  })

  await client.shutdown()
}

export async function trackCalculationViewed(
  calculationId: string,
  orgId: string,
  closerId: string,
  viewerType: 'prospect' | 'closer' | 'admin'
): Promise<void> {
  const client = getServerPostHog()

  client.capture({
    // Use calculation ID as distinct_id for prospect views (anonymous)
    distinctId: viewerType === 'prospect' ? `calc_${calculationId}` : closerId,
    event: 'calculation_viewed',
    properties: {
      calculation_id: calculationId,
      org_id: orgId,
      closer_id: closerId,
      viewer_type: viewerType,
    },
  })

  await client.shutdown()
}
```

### HogQL Queries for Dashboard Metrics
```typescript
// Source: https://posthog.com/docs/api/queries
// Common queries for the analytics dashboard

// Total calculations by org (Super Admin view)
const orgComparisonQuery = `
SELECT
  properties.org_id as org_id,
  count() as total_calculations
FROM events
WHERE event = 'calculation_created'
  AND timestamp > now() - interval 30 day
GROUP BY org_id
ORDER BY total_calculations DESC
LIMIT 100
`

// Calculations per closer (Org Admin view)
const closerPerformanceQuery = `
SELECT
  properties.closer_id as closer_id,
  count() as calculations,
  countIf(event = 'calculation_viewed' AND properties.viewer_type = 'prospect') as prospect_views
FROM events
WHERE (event = 'calculation_created' OR event = 'calculation_viewed')
  AND properties.org_id = '{orgId}'
  AND timestamp > now() - interval 7 day
GROUP BY closer_id
ORDER BY calculations DESC
`

// My calculations with engagement (Closer view)
const myCalculationsQuery = `
SELECT
  properties.calculation_id as calc_id,
  properties.customer_name as customer,
  max(timestamp) as last_activity,
  countIf(event = 'calculation_viewed' AND properties.viewer_type = 'prospect') as views,
  maxIf(properties.scroll_depth, event = 'scroll_depth') as max_scroll
FROM events
WHERE (event IN ['calculation_created', 'calculation_viewed', 'scroll_depth'])
  AND properties.closer_id = '{userId}'
  AND timestamp > now() - interval 30 day
GROUP BY calc_id, customer
ORDER BY last_activity DESC
`
```

### Terms Acceptance Integration
```typescript
// Source: User requirement - subtle terms on locked document screen
// src/components/public/password-gate.tsx - ADD to locked document screen

<div className="text-center">
  <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
  <h2 className="text-xl font-semibold mb-2">Det har dokumentet ar last</h2>
  <p className="text-sm text-gray-500 mb-4">
    Ange losenord for att visa kalkylen
  </p>
  <form onSubmit={handleSubmit}>
    <Input type="password" ... />
    <Button type="submit">Oppna</Button>
  </form>
  {/* Subtle terms acceptance */}
  <p className="text-xs text-gray-400 mt-6">
    Genom att fortsatta godkanner du{' '}
    <a href="/villkor" className="underline">anvandningsvillkoren</a>
  </p>
</div>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Client-side only tracking | Hybrid client + server | 2024+ | 30% more reliable event capture |
| PostHog iframe embeds | Query API + custom charts | 2024+ | Dynamic filtering, native UI |
| Events API | Query API with HogQL | 2024 (deprecated) | More powerful queries, lower rate limits |
| Batch flush on timeout | flushAt: 1 + shutdown() | 2023+ serverless | Required for Next.js App Router |

**Deprecated/outdated:**
- `Events API`: Deprecated, use Query API instead
- `posthog.capture()` on server: Use posthog-node SDK
- `Group Analytics` for simple org filtering: Can use `properties.org_id` without add-on

## Open Questions

Things that couldn't be fully resolved:

1. **PostHog Group Analytics Add-on Pricing**
   - What we know: Group Analytics is a paid add-on for org-level aggregation
   - What's unclear: Exact pricing, whether it's needed for this use case
   - Recommendation: Start with `properties.org_id` filtering; evaluate Group Analytics later if org-level insights are insufficient

2. **Prospect Distinct ID Strategy**
   - What we know: Prospects are anonymous, need some identifier for event correlation
   - What's unclear: Best practice for correlating prospect events across sessions
   - Recommendation: Use `calc_{calculationId}` as distinct_id for prospect events; enables per-calculation engagement tracking

3. **Auto-Refresh Interval Performance**
   - What we know: React Query supports refetchInterval, PostHog has rate limits
   - What's unclear: Optimal interval for real-time feel without hitting limits
   - Recommendation: Start with 30 seconds, tune based on usage patterns

4. **PostHog Iframe Branding Removal**
   - What we know: Iframes show PostHog branding by default
   - What's unclear: Whether branding can be fully removed (docs unclear)
   - Recommendation: Use custom API-based dashboards to guarantee no branding

## Sources

### Primary (HIGH confidence)
- [PostHog Node.js SDK](https://posthog.com/docs/libraries/node) - Server-side event capture, flushAt/flushInterval settings
- [PostHog Next.js Integration](https://posthog.com/docs/libraries/next-js) - App Router patterns, server-side setup
- [PostHog Query API](https://posthog.com/docs/api/queries) - HogQL queries for dashboards
- [PostHog Bot Detection](https://posthog.com/docs/web-analytics/faq) - opt_out_useragent_filter setting

### Secondary (MEDIUM confidence)
- [PostHog Recharts Tutorial](https://posthog.com/tutorials/recharts) - Chart integration patterns
- [PostHog Dashboard Embedding](https://posthog.com/docs/product-analytics/sharing) - Iframe limitations
- [PostHog Group Analytics](https://posthog.com/docs/product-analytics/group-analytics) - Org-level tracking

### Tertiary (LOW confidence)
- [GitHub Issue #19069](https://github.com/PostHog/posthog/issues/19069) - Dashboard URL filter parameters (open feature request)
- Medium article on bot detection - Real-world debugging experience

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using official PostHog SDKs, existing project libraries
- Architecture: MEDIUM - Custom API approach verified but less common than iframes
- Pitfalls: HIGH - Multiple official sources document these issues
- Dashboard filtering: MEDIUM - Workaround for missing feature, not ideal

**Research date:** 2026-02-05
**Valid until:** 30 days (PostHog iterates quickly, verify before major changes)
