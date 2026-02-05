# Phase 12: Analytics & Dashboard - Context

**Gathered:** 2026-02-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Working PostHog analytics with role-based embedded dashboards. Fix bot detection issue, capture calculation lifecycle events server-side, and provide embedded analytics dashboards scoped by role (Super Admin, Org Admin, Closer).

</domain>

<decisions>
## Implementation Decisions

### Event Tracking Scope
- Full funnel tracking: create, update, delete, view (prospect), view (closer), share link generated, wizard step completion, time per step, section expansions
- Prospect engagement: scroll depth + section interactions (which sections they expanded/viewed)
- Attribution: every event includes closer ID and org ID for filtering and scoping
- Calculation ownership: tied to closer who created it, then to organization that closer belongs to

### Dashboard Content by Role

**Super Admin:**
- Platform health overview: total calculations, active orgs, system-wide trends, conversion metrics
- Org comparison capability: compare orgs by activity, calculation volume, engagement

**Org Admin:**
- Team performance: calculations per closer, prospect engagement by closer, team totals
- Pipeline metrics: active calculations, prospect views, share rates, "hot" prospects
- Week-over-week trends
- Individual closer performance visible (full transparency, not just aggregates)

**Closer:**
- My calculations list with view counts, last viewed, engagement score
- Prospect signals: who viewed, how long, what sections they engaged with

### Dashboard Freshness
- Real-time updates with auto-refresh (30-60 second intervals)

### Embedding Approach
- Widget for quick glance in existing dashboard + dedicated /analytics page for deep dive
- Native Kalkyla feel — no PostHog branding visible to users
- Claude decides: iframe vs API-based rendering based on feasibility

### Bot Detection Fix
- Hybrid approach: client-side for UI interactions, server-side for business events
- Server-side events (critical): create, update, delete, views, share link generated, wizard completion
- Client-side events: scroll depth, section clicks, time-on-page — keep if reliable

### Privacy & Terms
- Add subtle terms acceptance to "Det här dokumentet är låst" screen (public calculation view)
- No consent popup — B2B context, tracking expected for business proposals
- No visible GDPR concerns for this use case

### Claude's Discretion
- Wizard step timing visibility by role (admins vs closers)
- Exact embedding method (PostHog iframe vs custom API)
- Client-side tracking reliability assessment
- Auto-refresh interval tuning
- Exact dashboard widget layout

</decisions>

<specifics>
## Specific Ideas

- "Maximal tracking without the customer knowing" — track everything, keep it invisible to prospects
- Terms acceptance should be "sneaky" — integrated into locked document screen, not a separate popup
- Dashboards should feel native to Kalkyla, not like embedded third-party tools

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 12-analytics-dashboard*
*Context gathered: 2026-02-05*
