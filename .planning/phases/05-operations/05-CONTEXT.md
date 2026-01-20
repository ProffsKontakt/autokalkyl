# Phase 5: Operations - Context

**Gathered:** 2026-01-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Admin visibility into calculations with role-based dashboards, margin alerts for ProffsKontakt orgs via N8N webhooks, and analytics/error monitoring for customer engagement and system health. Super Admin sees all; Org Admin sees their org; Closer sees their own data.

</domain>

<decisions>
## Implementation Decisions

### Dashboard design

**Super Admin dashboard:**
- Split view: org overview + system health equally weighted
- Org list with key metrics (calculations, users, views)
- System health showing status of Neon DB, N8N webhooks, PostHog, Sentry
- Can impersonate any org to view their dashboard as if Org Admin (full access)

**Org Admin dashboard:**
- Summary cards at top (total calcs, total views, avg margin for current month)
- Closer activity list showing calculation counts, recent activity per closer
- Full calculation list with expandable rows showing complete breakdown
- Full preview on expand: savings breakdown, battery info, margin, all metrics

**Closer dashboard:**
- Personal dashboard (not just calculation list)
- Activity focused: calculations created, calculations shared, view counts
- Performance focused: share-to-view ratio, avg margin, comparison to org average
- Prospect engagement stats: scroll depth, time on page, where they stopped (from PostHog)

**Data freshness:**
- Auto-refresh frequently (polling, not manual refresh)
- Default time range: current calendar month (resets on 1st)

**Filtering:**
- Advanced filters on calculation lists
- Date range, share status, search by customer
- Margin range, battery type, elomrade, closer (for admins)

### Alert behavior

**Trigger events:**
- Alert on SAVE when calculation has margin below threshold
- Alert on SHARE when low-margin calculation is shared with customer
- Separate alerts for save vs share events

**Threshold configuration:**
- Configurable per org by Super Admin in admin panel
- Threshold in SEK amount (not percentage)

**Webhook payload (full details):**
- Org name, calculation ID, margin, threshold, event type (save/share)
- Customer name, closer name, battery, total price
- Share URL, calculation created date, view count

### Analytics scope

**PostHog on public pages (prospect tracking):**
- Full tracking: page views, scroll depth, time on page, heatmaps
- Session replays enabled for prospect visits

**Custom events (comprehensive):**
- All interactions: simulator adjusted, section viewed, cursor movement
- All milestones: page loaded, scrolled past fold, reached results, time thresholds
- Scrolling behavior: scroll up, scroll down, marking with cursor
- Track EVERYTHING

**Internal app tracking:**
- Full tracking on admin/closer dashboards
- Track internal user journeys, feature usage, errors
- Identify all users (link sessions to user accounts)

**Closer view of prospect data:**
- Stats only in dashboard (scroll depth, time on page, where stopped)
- No embedded session replay viewer - aggregated stats sufficient

### Error monitoring

**Sentry coverage:**
- Both client (browser JS) AND server (API) errors
- Full context: stack traces, breadcrumbs, user context, request data

**Performance monitoring:**
- Full APM: all API endpoints, database queries, external calls

**Alert routing:**
- Route through N8N webhook for custom handling (Slack, etc.)

### Claude's Discretion
- CSV export capability for calculation lists (if it adds value)
- Exact auto-refresh interval (reasonable frequency)
- Specific heatmap configuration in PostHog
- Performance threshold values for slow transaction alerts
- Dashboard card layouts and visual design

</decisions>

<specifics>
## Specific Ideas

- "Closer should track where the customer stopped, how long they stopped, and where the prospect looked with their cursor" - detailed engagement stats from PostHog
- Super Admin impersonation should work as if actually logged in as Org Admin (full access, not just view-only)
- System health should show external service status (Neon, N8N, PostHog, Sentry) not just app metrics

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope

</deferred>

---

*Phase: 05-operations*
*Context gathered: 2026-01-20*
