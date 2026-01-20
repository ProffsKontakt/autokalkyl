# Phase 5: Operations - Research

**Researched:** 2026-01-20
**Domain:** Admin dashboards, margin alerts (N8N webhooks), analytics (PostHog), error monitoring (Sentry)
**Confidence:** HIGH

## Summary

Phase 5 implements operations infrastructure: admin dashboards with role-based views, margin alert webhooks for ProffsKontakt-affiliated organizations, PostHog analytics for customer engagement tracking, and Sentry for error/performance monitoring.

The standard approach uses:
- **N8N webhooks:** Simple HTTP POST from server actions with proper error handling and idempotency
- **PostHog:** Official `posthog-js` library with Next.js App Router provider pattern, session replay, and heatmaps enabled in project settings
- **Sentry:** Official `@sentry/nextjs` package with wizard setup, covering client, server, and edge runtimes
- **Dashboards:** TanStack Query for data fetching with `refetchInterval` for auto-refresh, Prisma queries with role-based filtering

**Primary recommendation:** Use the official integrations for all three services. They're well-documented, actively maintained, and designed for Next.js App Router. Focus on proper user identification to link analytics across sessions.

## Standard Stack

The established libraries/tools for this domain:

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| posthog-js | ^1.187+ | Client-side analytics, session replay, heatmaps | Official PostHog SDK, supports Next.js App Router |
| @sentry/nextjs | ^8.x | Error tracking, performance monitoring | Official Sentry SDK, wizard-based setup |
| @tanstack/react-query | ^5.x | Server state management, polling | Already in project, industry standard for dashboards |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| posthog-node | ^4.x | Server-side PostHog (optional) | If server-side event capture needed beyond webhooks |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| posthog-js | Plausible, Umami | Less feature-rich (no session replay, limited heatmaps) |
| @sentry/nextjs | Bugsnag, Rollbar | Sentry has best Next.js integration |
| TanStack Query polling | Server-Sent Events | SSE adds complexity, polling sufficient for dashboard refresh |

**Installation:**
```bash
npm install posthog-js @sentry/nextjs
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── (dashboard)/
│   │   └── dashboard/
│   │       ├── page.tsx          # Closer dashboard (role-aware)
│   │       ├── admin/
│   │       │   └── page.tsx      # Org Admin dashboard
│   │       └── super/
│   │           └── page.tsx      # Super Admin dashboard
│   ├── api/
│   │   └── health/
│   │       └── route.ts          # Health check endpoint
│   └── providers.tsx             # PostHog + other providers
├── components/
│   └── analytics/
│       ├── posthog-provider.tsx  # PostHog initialization
│       ├── posthog-pageview.tsx  # Page view tracking component
│       └── identify-user.tsx     # User identification component
├── lib/
│   ├── analytics/
│   │   ├── posthog.ts           # PostHog client helper
│   │   └── events.ts            # Custom event definitions
│   ├── webhooks/
│   │   └── n8n.ts               # N8N webhook trigger utilities
│   └── monitoring/
│       └── health.ts            # Health check utilities
└── instrumentation.ts           # Sentry server/edge config registration
```

### Pattern 1: PostHog Provider for App Router
**What:** Client-side PostHog initialization with 'use client' directive
**When to use:** Required for all PostHog functionality in App Router
**Example:**
```typescript
// Source: https://posthog.com/docs/libraries/next-js
// src/components/analytics/posthog-provider.tsx
'use client'

import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { useEffect } from 'react'

export function PHProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com',
      person_profiles: 'identified_only',
      capture_pageview: false, // We capture manually for App Router
      capture_pageleave: true,
      autocapture: true,
    })
  }, [])

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}
```

### Pattern 2: PostHog User Identification
**What:** Link anonymous sessions to authenticated users
**When to use:** After user authentication is confirmed
**Example:**
```typescript
// Source: https://posthog.com/docs/getting-started/identify-users
// src/components/analytics/identify-user.tsx
'use client'

import { useSession } from 'next-auth/react'
import { usePostHog } from 'posthog-js/react'
import { useEffect } from 'react'

export function IdentifyUser() {
  const { data: session } = useSession()
  const posthog = usePostHog()

  useEffect(() => {
    if (session?.user && !posthog._isIdentified()) {
      posthog.identify(session.user.id, {
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
        orgId: session.user.orgId,
      })
    }
  }, [session, posthog])

  return null
}
```

### Pattern 3: N8N Webhook Trigger
**What:** Fire-and-forget webhook with proper error handling
**When to use:** Margin alerts on save/share events
**Example:**
```typescript
// src/lib/webhooks/n8n.ts
interface MarginAlertPayload {
  eventType: 'save' | 'share'
  calculationId: string
  orgName: string
  closerName: string
  customerName: string
  margin: number
  threshold: number
  batteryName: string
  totalPrice: number
  shareUrl?: string
  createdAt: string
  viewCount: number
}

export async function triggerMarginAlert(payload: MarginAlertPayload): Promise<void> {
  const webhookUrl = process.env.N8N_MARGIN_ALERT_WEBHOOK_URL
  if (!webhookUrl) {
    console.warn('N8N webhook URL not configured')
    return
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': process.env.N8N_WEBHOOK_SECRET || '',
      },
      body: JSON.stringify({
        ...payload,
        timestamp: new Date().toISOString(),
        source: 'kalkyla',
      }),
    })

    if (!response.ok) {
      console.error(`N8N webhook failed: ${response.status}`)
    }
  } catch (error) {
    // Fire-and-forget: log but don't throw
    console.error('N8N webhook error:', error)
  }
}
```

### Pattern 4: Sentry Error Capture in Server Actions
**What:** Wrap server actions with Sentry instrumentation
**When to use:** All server actions that might fail
**Example:**
```typescript
// Source: https://docs.sentry.io/platforms/javascript/guides/nextjs/usage/
import * as Sentry from '@sentry/nextjs'

export async function someServerAction(input: Input) {
  return Sentry.withServerActionInstrumentation(
    'someServerAction',
    { recordResponse: true },
    async () => {
      try {
        // Action logic
        return { success: true }
      } catch (error) {
        Sentry.captureException(error, {
          extra: { input },
          tags: { action: 'someServerAction' },
        })
        return { error: 'Something went wrong' }
      }
    }
  )
}
```

### Pattern 5: Dashboard with Auto-Refresh
**What:** TanStack Query with refetchInterval for live dashboards
**When to use:** All admin dashboard data fetching
**Example:**
```typescript
// Source: https://tanstack.com/query/v4/docs/framework/react/reference/useQuery
'use client'

import { useQuery } from '@tanstack/react-query'

export function useDashboardStats(orgId?: string) {
  return useQuery({
    queryKey: ['dashboard-stats', orgId],
    queryFn: () => fetchDashboardStats(orgId),
    refetchInterval: 30_000, // Refresh every 30 seconds
    refetchIntervalInBackground: false, // Pause when tab not visible
  })
}
```

### Pattern 6: Role-Based Dashboard Query
**What:** Prisma queries scoped by user role
**When to use:** All dashboard data fetching
**Example:**
```typescript
// src/actions/dashboard.ts
export async function getDashboardData() {
  const session = await auth()
  if (!session?.user) return { error: 'Unauthorized' }

  const role = session.user.role as Role

  if (role === 'SUPER_ADMIN') {
    // See all organizations and calculations
    return prisma.organization.findMany({
      include: {
        _count: { select: { calculations: true, users: true } },
        calculations: {
          take: 5,
          orderBy: { updatedAt: 'desc' },
          include: { _count: { select: { views: true } } },
        },
      },
    })
  } else if (role === 'ORG_ADMIN') {
    // See own org's data
    const tenantClient = createTenantClient(session.user.orgId!)
    return tenantClient.calculation.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: { select: { views: true } },
      },
    })
  } else {
    // CLOSER: See own calculations only
    const tenantClient = createTenantClient(session.user.orgId!)
    return tenantClient.calculation.findMany({
      where: { createdBy: session.user.id },
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { views: true } } },
    })
  }
}
```

### Anti-Patterns to Avoid
- **Initializing PostHog in server components:** PostHog client must use 'use client' directive
- **Blocking webhook failures:** Webhook calls should be fire-and-forget, never block user actions
- **Multiple identify calls:** Check `posthog._isIdentified()` before calling identify
- **Hardcoded webhook URLs:** Always use environment variables for webhook endpoints
- **Missing Sentry user context:** Set user info with `Sentry.setUser()` after authentication

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session replay | Custom screen recording | PostHog session replay | Privacy-compliant, efficient compression, toolbar integration |
| Heatmaps | Custom click tracking | PostHog heatmaps (enable in project settings) | Handles viewport variations, scrollmaps, dead click detection |
| Error grouping | Custom error aggregation | Sentry error grouping | Smart deduplication, release tracking, assignee management |
| Source maps | Manual upload | Sentry webpack plugin (auto via wizard) | Integrated with build, handles minification |
| Scroll depth | Custom scroll listeners | PostHog $pageleave event | Automatic, includes max depth and time on page |
| API performance | Custom timing middleware | Sentry tracing | Distributed tracing, database spans, automatic instrumentation |

**Key insight:** PostHog and Sentry have spent years building these features with edge case handling. Custom implementations will miss viewport normalization, privacy masking, and efficient data compression.

## Common Pitfalls

### Pitfall 1: PostHog Page View Double-Counting in App Router
**What goes wrong:** Default `capture_pageview: true` fires on initial render, but App Router soft navigations need manual capture
**Why it happens:** App Router uses client-side navigation that doesn't trigger full page loads
**How to avoid:** Set `capture_pageview: false` in init, use `usePathname()` hook to capture manually
**Warning signs:** Page view counts much higher than expected, especially on navigation-heavy pages

### Pitfall 2: Webhook Blocking User Actions
**What goes wrong:** If N8N is slow/down, save/share actions hang or fail
**Why it happens:** Awaiting webhook response in the critical path
**How to avoid:** Fire-and-forget pattern with try-catch, log failures but don't throw
**Warning signs:** Intermittent save failures, timeout errors correlated with N8N issues

### Pitfall 3: PostHog Not Identifying Users After Login
**What goes wrong:** Analytics show all users as anonymous
**Why it happens:** Missing identify call, or calling before session is available
**How to avoid:** Use `useEffect` watching session state, check `_isIdentified()` to prevent duplicates
**Warning signs:** Distinct_id values are all UUIDs, no email/name properties in PostHog

### Pitfall 4: Sentry Capturing Noise
**What goes wrong:** Alert fatigue from irrelevant errors (cancelled requests, third-party scripts)
**Why it happens:** Default captures everything
**How to avoid:** Configure `ignoreErrors` and `denyUrls` in client config
**Warning signs:** High error volume, most issues are not actionable

### Pitfall 5: Missing User Context in Sentry
**What goes wrong:** Errors show up but can't be linked to specific users or orgs
**Why it happens:** Not calling `Sentry.setUser()` after authentication
**How to avoid:** Set user context in the same component that handles PostHog identify
**Warning signs:** "Unknown user" on all Sentry issues

### Pitfall 6: Stale Dashboard Data
**What goes wrong:** Dashboard shows old data, users confused about state
**Why it happens:** No auto-refresh, or refetchInterval too long
**How to avoid:** Use TanStack Query with 30s refetchInterval, show "last updated" timestamp
**Warning signs:** Users manually refreshing page, complaints about outdated stats

## Code Examples

Verified patterns from official sources:

### PostHog Initialization with Session Replay
```typescript
// Source: https://posthog.com/docs/session-replay/installation
posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: 'https://eu.i.posthog.com',
  capture_pageview: false,
  capture_pageleave: true,
  // Session replay - enabled in project settings
  disable_session_recording: false,
  // Heatmaps - enabled in project settings, no code needed
  autocapture: true,
  // Only identify users, don't create person profiles for anonymous
  person_profiles: 'identified_only',
})
```

### Custom Event Capture (Prospect Engagement)
```typescript
// Source: https://posthog.com/docs/product-analytics/capture-events
// Event naming: [object] [verb] format
posthog.capture('calculation_viewed', {
  calculation_id: calculationId,
  org_slug: orgSlug,
})

posthog.capture('simulator_adjusted', {
  calculation_id: calculationId,
  month: selectedMonth,
  hour: selectedHour,
  old_value: oldValue,
  new_value: newValue,
})

posthog.capture('section_viewed', {
  section: 'savings_breakdown',
  calculation_id: calculationId,
})
```

### Sentry Client Configuration
```typescript
// Source: https://docs.sentry.io/platforms/javascript/guides/nextjs/
// instrumentation-client.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [Sentry.replayIntegration()],
  ignoreErrors: [
    'ResizeObserver loop',
    'Non-Error promise rejection',
    /Loading chunk \d+ failed/,
  ],
})
```

### Sentry Server Configuration
```typescript
// Source: https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
// instrumentation.ts
import * as Sentry from '@sentry/nextjs'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

export const onRequestError = Sentry.captureRequestError
```

### Health Check Endpoint
```typescript
// Source: https://hyperping.com/blog/nextjs-health-check-endpoint
// src/app/api/health/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'

export async function GET() {
  const checks = {
    database: 'unknown',
    timestamp: new Date().toISOString(),
  }

  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`
    checks.database = 'healthy'
  } catch {
    checks.database = 'unhealthy'
  }

  const allHealthy = checks.database === 'healthy'

  return NextResponse.json(
    { status: allHealthy ? 'healthy' : 'degraded', checks },
    { status: allHealthy ? 200 : 503 }
  )
}
```

### External Service Health Check
```typescript
// src/lib/monitoring/health.ts
interface ServiceHealth {
  name: string
  status: 'healthy' | 'unhealthy' | 'unknown'
  responseTime?: number
  lastChecked: string
}

export async function checkExternalServices(): Promise<ServiceHealth[]> {
  const services: ServiceHealth[] = []

  // Check N8N webhook (HEAD request to avoid triggering workflow)
  if (process.env.N8N_HEALTH_CHECK_URL) {
    const start = Date.now()
    try {
      const response = await fetch(process.env.N8N_HEALTH_CHECK_URL, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
      })
      services.push({
        name: 'n8n',
        status: response.ok ? 'healthy' : 'unhealthy',
        responseTime: Date.now() - start,
        lastChecked: new Date().toISOString(),
      })
    } catch {
      services.push({
        name: 'n8n',
        status: 'unhealthy',
        lastChecked: new Date().toISOString(),
      })
    }
  }

  // PostHog and Sentry health checked via their dashboards, not ping
  // They're SaaS services with their own status pages

  return services
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual source map upload | Sentry webpack plugin auto-upload | Sentry 7.x | No build step changes needed |
| posthog-js separate from provider | PostHogProvider component | posthog-js 1.100+ | Better React integration, hooks support |
| Custom scroll tracking | PostHog $pageleave with scroll_depth | 2024 | Automatic, no custom code |
| Polling for real-time | Still polling (TanStack Query) | N/A | SSE/WebSocket overkill for 30s refresh |
| pages/ router PostHog setup | App Router with instrumentation-client.ts | Next.js 15.3+ | Cleaner initialization |

**Deprecated/outdated:**
- `react-ga` for Google Analytics: Use PostHog instead for unified analytics
- Manual Sentry config files without wizard: Wizard handles App Router complexity
- `capture_pageview: true` with App Router: Must be false with manual capture

## Open Questions

Things that couldn't be fully resolved:

1. **PostHog EU vs US hosting**
   - What we know: EU hosting at `eu.i.posthog.com`, US at `us.i.posthog.com`
   - What's unclear: Which region the project should use (GDPR considerations)
   - Recommendation: Use EU (`eu.i.posthog.com`) since Swedish business and customers

2. **N8N production webhook URL availability**
   - What we know: N8N webhooks have test and production URLs
   - What's unclear: Whether self-hosted N8N or cloud, exact URL format
   - Recommendation: Use environment variable, document required N8N workflow setup

3. **Sentry organization/project setup**
   - What we know: Need DSN from Sentry project
   - What's unclear: Whether Sentry account already exists
   - Recommendation: Run wizard which guides through setup, document required env vars

## Sources

### Primary (HIGH confidence)
- [Sentry Next.js Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/) - setup, configuration, error capture
- [PostHog Next.js Documentation](https://posthog.com/docs/libraries/next-js) - provider pattern, App Router setup
- [TanStack Query useQuery Reference](https://tanstack.com/query/v4/docs/framework/react/reference/useQuery) - refetchInterval, polling

### Secondary (MEDIUM confidence)
- [N8N Webhook Documentation](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/) - webhook configuration, authentication
- [PostHog Scroll Depth Tutorial](https://posthog.com/tutorials/scroll-depth) - custom scroll tracking patterns
- [PostHog Heatmaps Documentation](https://posthog.com/docs/toolbar/heatmaps) - heatmap types and configuration
- [PostHog Identify Users Documentation](https://posthog.com/docs/getting-started/identify-users) - user identification patterns
- [Hyperping Health Check Guide](https://hyperping.com/blog/nextjs-health-check-endpoint) - health endpoint patterns

### Tertiary (LOW confidence)
- [Sentry + n8n Integration](https://n8n.io/integrations/sentryio/and/slack/) - webhook routing patterns
- Various Medium articles on multi-tenant dashboards - general architecture patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official SDKs from PostHog and Sentry, well-documented
- Architecture: HIGH - Patterns from official documentation, existing project patterns
- Pitfalls: MEDIUM - Combination of documentation and community reports
- Webhooks: MEDIUM - Standard HTTP patterns, N8N-specific details need env setup

**Research date:** 2026-01-20
**Valid until:** 2026-02-20 (30 days - stable, mature tools)
