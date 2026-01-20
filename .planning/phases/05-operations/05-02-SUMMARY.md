---
phase: 05-operations
plan: 02
subsystem: webhooks
tags: [n8n, webhooks, margin-alerts, notifications]
dependency-graph:
  requires: [01-08]
  provides: [margin-alert-webhook]
  affects: []
tech-stack:
  added: []
  patterns: [fire-and-forget-webhook]
key-files:
  created:
    - src/lib/webhooks/n8n.ts
  modified:
    - src/actions/calculations.ts
decisions:
  - id: WEBHOOK-01
    choice: "Fire-and-forget pattern with try-catch"
    reason: "Webhook failures must never block user save operations"
metrics:
  duration: "2 min"
  completed: "2026-01-20"
---

# Phase 05 Plan 02: N8N Margin Alerts Summary

N8N webhook integration for margin alerts on ProffsKontakt-affiliated calculations with margin below threshold.

## One-liner

Fire-and-forget N8N webhook triggers when ProffsKontakt orgs save calculations with margin below 24,000 SEK.

## What Was Built

### Task 1: N8N Webhook Utility

Created `src/lib/webhooks/n8n.ts` with:

- `MarginAlertPayload` interface with all calculation details
- `triggerMarginAlert()` function with fire-and-forget pattern
- Dev mode console logging when `N8N_MARGIN_ALERT_WEBHOOK_URL` not set
- Optional `X-Webhook-Secret` header for authentication
- Enriched payload with timestamp, source, and environment

### Task 2: Margin Alert Integration

Updated `src/actions/calculations.ts`:

- Added `checkAndTriggerMarginAlert()` helper function
- Integrated into both update and create paths of `saveDraft()`
- Margin calculation: `totalPriceExVat - batteryCost - installerCut`
- Only triggers for `isProffsKontaktAffiliated: true` orgs
- Only triggers when `marginSek < threshold` (default 24,000 SEK)
- Includes share URL if calculation has been shared

### Task 3: Default Margin Threshold

Verified seed.ts already includes `marginAlertThreshold: 24000` for ProffsKontakt org.
Webhook logic has fallback default of 24,000 SEK in code.

## Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| WEBHOOK-01 | Fire-and-forget pattern | Webhook failures must never block saves |
| Dev mode | Console logging | No external dependency required for local dev |
| Payload enrichment | Include timestamp, source, env | Standalone email without extra lookups |

## Commits

| Hash | Description |
|------|-------------|
| 24c10b6 | feat(05-02): create N8N webhook utility for margin alerts |
| abe18d1 | feat(05-02): integrate margin alerts into calculation save |

## Verification Results

- [x] TypeScript compiles without errors
- [x] N8N webhook utility exists at src/lib/webhooks/n8n.ts
- [x] saveDraft action imports and calls triggerMarginAlert
- [x] Margin check only runs for isProffsKontaktAffiliated = true
- [x] Webhook is fire-and-forget (wrapped in try-catch)
- [x] Dev mode logs margin alert to console when webhook URL not set

## Success Criteria Met

- [x] ALERT-01: triggerMarginAlert called when margin < threshold for affiliated orgs
- [x] ALERT-02: Default threshold 24,000 SEK used when org.marginAlertThreshold is null
- [x] ALERT-03: Payload includes all required fields (calculation details, closer name, org name, margin breakdown, link)
- [x] ALERT-04: N8N workflow will send email (configured externally, not in code)
- [x] ALERT-05: Non-affiliated orgs bypass the margin alert check entirely

## Deviations from Plan

None - plan executed exactly as written.

## Environment Variables Required

| Variable | Purpose | Source |
|----------|---------|--------|
| N8N_MARGIN_ALERT_WEBHOOK_URL | Webhook endpoint | N8N workflow -> Webhook node -> Production URL |
| N8N_WEBHOOK_SECRET | Optional auth header | Custom secret for webhook authentication |

## N8N Workflow Setup

To complete the integration, create an N8N workflow:

1. Add a **Webhook** trigger node
2. Copy the Production URL to `N8N_MARGIN_ALERT_WEBHOOK_URL`
3. Add an **Email** node connected to the webhook
4. Configure email template using payload fields:
   - `customerName`, `closerName`, `orgName`
   - `marginSek`, `threshold`, `totalPriceExVat`
   - `batteryCostPrice`, `installerFixedCut`
   - `shareUrl` (if available)

## Next Phase Readiness

Ready for 05-03 (PostHog Analytics) and 05-04 (Sentry Error Tracking).
No blockers from this plan.
