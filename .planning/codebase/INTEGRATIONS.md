# External Integrations

**Analysis Date:** 2026-01-26

## APIs & External Services

**Electricity Pricing:**
- mgrey.se - Fetches Swedish electricity spot prices for ROI calculations
  - SDK/Client: Native fetch (HTTPS)
  - Endpoint: `https://mgrey.se/espot?format=json&date={date}`
  - Data: Hourly prices for electricity zones (SE1, SE2, SE3, SE4)
  - Caching: 1 hour via Next.js response.next
  - Location: `src/lib/electricity/fetch-prices.ts`

**Email & Webhooks:**
- N8N - Email sending and margin alerts via webhooks
  - Type: Webhooks (outbound only)
  - Endpoints:
    - Password reset emails: `N8N_WEBHOOK_URL` env var
    - Margin alert notifications: `N8N_MARGIN_ALERT_WEBHOOK_URL` env var
  - Pattern: Fire-and-forget (logs errors, never throws)
  - Implementation: `src/lib/email/send-reset-email.ts`, `src/lib/webhooks/n8n.ts`
  - Auth: Optional header `X-Webhook-Secret` (env var: `N8N_WEBHOOK_SECRET`)
  - Dev mode: Logs reset links to console if webhooks not configured

## Data Storage

**Databases:**
- Neon PostgreSQL - Multi-tenant relational database
  - Connection: `DATABASE_URL` (pooled connection string for serverless)
  - Unpooled connection: `DATABASE_URL_UNPOOLED` (for CLI migrations)
  - Client: Prisma 7.2.0 with @prisma/adapter-neon
  - Driver: @neondatabase/serverless (HTTPS/WebSocket, no port 5432)
  - Schema: `prisma/schema.prisma` (95+ models)

**File Storage:**
- Local filesystem only - No cloud storage integration
- PDF generation: In-memory via @react-pdf/renderer (no file persistence)

**Caching:**
- Next.js Response Cache - For electricity price API responses (1 hour TTL)
- In-memory: Prisma client singleton pattern

## Authentication & Identity

**Auth Provider:**
- NextAuth.js (Auth.js) v5.0.0-beta.30 - Custom implementation
  - Strategy: Credentials provider (email/password)
  - Session: JWT-based (stateless, serverless-friendly)
  - Storage: Prisma database (User, Session, Account, PasswordResetToken models)
  - Location: `src/lib/auth/auth.ts`, `src/lib/auth/auth.config.ts`
  - Middleware: Edge-compatible route protection via `src/middleware.ts`
  - Password hashing: bcryptjs (Argon2-like security)
  - Password reset: Token-based via N8N email webhooks
  - JWT claims: sub (user ID), role (SUPER_ADMIN/ORG_ADMIN/CLOSER), orgId, orgSlug

**Multi-tenancy:**
- Organization-based tenant isolation
- All data models scoped by `orgId`
- User roles control cross-org access (SUPER_ADMIN only)

## Monitoring & Observability

**Error Tracking:**
- Sentry 10.35.0 (@sentry/nextjs)
  - DSN: `NEXT_PUBLIC_SENTRY_DSN` env var
  - Enabled: Only if DSN configured
  - Sampling: 10% (production) / 100% (development)
  - Configs: `sentry.server.config.ts`, `sentry.client.config.ts`, `sentry.edge.config.ts`
  - Features:
    - Error capture (server, client, edge)
    - Performance monitoring (traces)
    - Session replay (client-side only, 10% of sessions, 100% on errors)
    - Source map hiding for security
    - Tree-shaken SDK in production

**Analytics:**
- PostHog 1.331.0 (posthog-js)
  - API Key: `NEXT_PUBLIC_POSTHOG_KEY` env var
  - Host: `NEXT_PUBLIC_POSTHOG_HOST` (defaults to `https://eu.i.posthog.com`)
  - Initialization: `src/components/analytics/posthog-provider.tsx`
  - Features:
    - Autocapture: Clicks, form submissions
    - Manual pageview tracking: Next.js App Router compatible
    - Session recordings: Enabled with input masking
    - Person identification: Only for logged-in users
    - Do Not Track respect: Enabled
    - Feature flags: Disabled (not used yet)
  - User identification: `src/components/analytics/identify-user.tsx` (on auth change)
  - Privacy: Masks all text inputs, masks custom selectors via `[data-posthog-mask]`

**Logs:**
- Console logging (development mode only)
- Sentry integration for production errors

## CI/CD & Deployment

**Hosting:**
- Vercel (inferred from Sentry config with auth token pattern)

**Build Process:**
- Next.js build: `prisma generate && next build`
- Sentry source map upload: On `SENTRY_AUTH_TOKEN` presence
  - Org/Project: `SENTRY_ORG`, `SENTRY_PROJECT` env vars
  - Source maps: Uploaded and hidden from client bundles

**Environment:**
- Development: `next dev -p 3001`
- Production: `next start`
- Build: `npm run build`

## Environment Configuration

**Required env vars (critical):**
- `DATABASE_URL` - Neon PostgreSQL pooled connection string
- `DATABASE_URL_UNPOOLED` - Neon PostgreSQL direct connection (migrations)
- `NEXTAUTH_SECRET` - Random 32-byte base64 string (session signing)
- `NEXTAUTH_URL` - Deployment URL (e.g., https://kalkyla.se)
- `NODE_ENV` - development/production

**Optional env vars (features):**
- `N8N_WEBHOOK_URL` - Password reset email webhook
- `N8N_MARGIN_ALERT_WEBHOOK_URL` - Margin alert webhook
- `N8N_WEBHOOK_SECRET` - Optional secret header for webhook auth
- `NEXT_PUBLIC_POSTHOG_KEY` - PostHog analytics API key
- `NEXT_PUBLIC_POSTHOG_HOST` - PostHog host (EU/US data residency)
- `NEXT_PUBLIC_SENTRY_DSN` - Sentry error tracking DSN
- `SENTRY_AUTH_TOKEN` - Sentry source map upload auth
- `SENTRY_ORG` - Sentry organization slug
- `SENTRY_PROJECT` - Sentry project slug

**Secrets location:**
- Development: `.env.local` (gitignored)
- Production: Environment variables (Vercel secrets)
- Database: Neon console or Vercel integration

## Webhooks & Callbacks

**Incoming:**
- None currently. Public share links are view-tracked via database polling in UI.

**Outgoing:**
- N8N Password Reset: `N8N_WEBHOOK_URL`
  - Payload: `{ type: 'password_reset', to: email, userName, resetUrl, subject }`
  - Trigger: User initiates password reset

- N8N Margin Alert: `N8N_MARGIN_ALERT_WEBHOOK_URL`
  - Payload: Margin calculation data with org/closer/customer details
  - Trigger: Calculation saved with margin below org threshold
  - Location: `src/lib/webhooks/n8n.ts` (triggerMarginAlert function)

**Third-party Callbacks:**
- NextAuth callback patterns in `src/lib/auth/auth.ts`:
  - `jwt()` - JWT token customization with role/orgId claims
  - `session()` - Add custom claims to session object
  - `authorized()` - Middleware route protection

---

*Integration audit: 2026-01-26*
