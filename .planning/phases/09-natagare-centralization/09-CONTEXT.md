# Phase 9: Natagare Centralization - Context

**Gathered:** 2026-02-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Migrate org-specific natagare to global scope with Super Admin configuration for peak calculation methods and night discounts. Establish role-based access: Super Admin configures and approves, Org Admin can add new natagare (org-only until approved), Closer selects from dropdown and can view settings.

</domain>

<decisions>
## Implementation Decisions

### Migration behavior
- Duplicate natagare across orgs flagged for manual review
- Super Admin resolves duplicates in natagare settings (banner/section showing "pending duplicates")
- No dedicated migration page — use existing admin UI

### Configuration UI
- List with side panel layout: natagare list on left, select to see/edit details in right panel
- Peak method is configurable formula with full flexibility:
  - Number of peaks to average
  - Averaging period
  - Min/max thresholds
  - Weekend exclusion option
  - Time windows
- Claude determines minimum viable configuration based on Swedish operator methods

### Role permissions
- **Super Admin:** Full edit access, approves new natagare and change requests
- **Org Admin:** View global natagare, request changes (not direct edit), can add new natagare (org-only until Super Admin approves)
- **Closer:** View settings (read-only), select from dropdown when creating calculation
- Pending approvals shown in Super Admin dashboard widget

### Missing natagare flow
- Closer requests new natagare → request goes to Org Admin
- Org Admin handles request (adds natagare, available to their org immediately)
- Super Admin approval makes it global

### Claude's Discretion
- Backward compatibility approach for existing calculation references after migration
- Migration rollback/safety measures
- Night discount configuration structure (percentage + hours, multiple bands, etc.)
- Request form fields for Closer when requesting new natagare
- Whether Closer can proceed with calculation while natagare request is pending
- Notification approach when requested natagare becomes available

</decisions>

<specifics>
## Specific Ideas

- Peak method should support Swedish grid operators like Ellevio (3-peak averaging)
- Configuration should be flexible enough to handle different operator methods without code changes

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 09-natagare-centralization*
*Context gathered: 2026-02-01*
