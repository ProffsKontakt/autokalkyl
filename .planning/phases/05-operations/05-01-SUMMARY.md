---
phase: 05-operations
plan: 01
subsystem: analytics
tags: [posthog, sentry, analytics, monitoring, error-tracking]
dependency-graph:
  requires: [04-customer-experience]
  provides: [analytics-tracking, error-monitoring, session-replay]
  affects: []
tech-stack:
  added: [posthog-js, @sentry/nextjs]
  patterns: [provider-pattern, manual-pageview, conditional-sentry]
key-files:
  created:
    - src/components/analytics/posthog-provider.tsx
    - src/components/analytics/posthog-pageview.tsx
    - src/components/analytics/identify-user.tsx
    - src/lib/analytics/posthog.ts
    - src/lib/analytics/events.ts
    - src/app/providers.tsx
    - src/components/public/public-analytics.tsx
    - sentry.client.config.ts
    - sentry.server.config.ts
    - sentry.edge.config.ts
    - instrumentation.ts
  modified:
    - package.json
    - next.config.ts
    - src/app/layout.tsx
    - src/app/(public)/[org]/[shareCode]/page.tsx
decisions:
  - key: posthog-manual-pageview
    choice: "capture_pageview: false with manual tracking via usePathname"
    reason: "App Router's client-side navigation requires manual page view tracking"
  - key: sentry-conditional-wrap
    choice: "Only wrap config with withSentryConfig when SENTRY_AUTH_TOKEN present"
    reason: "Avoid build errors when Sentry not configured"
  - key: eu-posthog-default
    choice: "Default api_host to https://eu.i.posthog.com"
    reason: "Swedish business data should stay in EU region"
metrics:
  duration: 4min
  completed: 2026-01-20
---

# Phase 05 Plan 01: Analytics and Monitoring Summary

PostHog analytics and Sentry error monitoring with EU hosting, manual page views for App Router, and custom events for calculation tracking.

## What Was Built

### PostHog Analytics

1. **PHProvider** (`src/components/analytics/posthog-provider.tsx`)
   - Initializes PostHog with `capture_pageview: false` for App Router compatibility
   - EU hosting configured as default (`https://eu.i.posthog.com`)
   - `person_profiles: 'identified_only'` for privacy
   - Debug mode in development

2. **PostHogPageview** (`src/components/analytics/posthog-pageview.tsx`)
   - Manual page view tracking using `usePathname()` and `useSearchParams()`
   - Fires `$pageview` event on route changes
   - Wrapped in Suspense for `useSearchParams()`

3. **IdentifyUser** (`src/components/analytics/identify-user.tsx`)
   - Identifies users in PostHog with email, name, role, orgId
   - Sets Sentry user context for error correlation
   - Resets on logout

4. **Custom Events** (`src/lib/analytics/events.ts`)
   - `trackCalculationViewed(calculationId, orgSlug)` - fired on public page load
   - `trackSimulatorAdjusted(calculationId, month, hour, oldValue, newValue)` - for interactive changes
   - `trackScrollDepth(calculationId, depth)` - scroll tracking
   - `trackTimeOnPage(calculationId, seconds)` - engagement tracking

### Sentry Error Monitoring

1. **Client Config** (`sentry.client.config.ts`)
   - Replay integration for session recordings
   - `replaysOnErrorSampleRate: 1.0` for all errors
   - Common noise errors filtered (ResizeObserver, chunk loading)

2. **Server Config** (`sentry.server.config.ts`)
   - API performance monitoring with `tracesSampleRate: 0.1` in production

3. **Edge Config** (`sentry.edge.config.ts`)
   - Middleware and edge function monitoring

4. **Instrumentation** (`instrumentation.ts`)
   - Registers Sentry for server/edge runtimes
   - Exports `onRequestError` for request error capture

### Integration

1. **Providers Wrapper** (`src/app/providers.tsx`)
   - Combines SessionProvider, PHProvider, PostHogPageview, IdentifyUser
   - Single wrapper for root layout

2. **Public Analytics** (`src/components/public/public-analytics.tsx`)
   - Client component for tracking `calculation_viewed` on public pages
   - Fire-and-forget pattern

## Commits

| Hash | Message |
|------|---------|
| 9639664 | chore(05-01): install analytics dependencies |
| 75295b2 | feat(05-01): create PostHog provider and event tracking |
| e7c10fe | feat(05-01): create Sentry configuration files |
| edfa5a2 | feat(05-01): integrate analytics into app layout and public pages |

## Success Criteria Verification

- [x] ANLY-01: PostHog provider initialized with capture_pageview: false, manual tracking in place
- [x] ANLY-02: Session replay configured in sentry.client.config.ts
- [x] ANLY-03: Heatmaps enabled via autocapture: true
- [x] ANLY-04: Custom events trackCalculationViewed, trackSimulatorAdjusted exported
- [x] ANLY-05: Sentry client/server/edge configs created
- [x] ANLY-06: Sentry tracesSampleRate configured (0.1 production, 1.0 dev)

## Deviations from Plan

None - plan executed exactly as written.

## Environment Variables Required

### PostHog
- `NEXT_PUBLIC_POSTHOG_KEY` - Project API key from PostHog settings
- `NEXT_PUBLIC_POSTHOG_HOST` - Use `https://eu.i.posthog.com` for EU hosting

### Sentry
- `NEXT_PUBLIC_SENTRY_DSN` - DSN from Sentry project settings
- `SENTRY_AUTH_TOKEN` - Auth token for source map uploads (optional)
- `SENTRY_ORG` - Organization slug
- `SENTRY_PROJECT` - Project slug

## Dashboard Configuration Needed

### PostHog
1. Enable Session Replay: Project Settings -> Session Replay -> Enable
2. Enable Heatmaps: Toolbar -> Heatmaps toggle

### Sentry
1. Configure alerting rules for error thresholds
2. Set up Slack/email notifications

## Next Phase Readiness

Ready to proceed with:
- 05-02: Margin alerts via N8N webhook for ProffsKontakt orgs
- 05-03: Admin dashboard with calculation visibility
