---
phase: 12
plan: 03
subsystem: analytics
tags: [posthog, server-actions, tracking, privacy]
requires: ["12-01"]
provides: ["server-side-event-tracking", "terms-acceptance"]
affects: ["12-04", "12-05"]
tech-stack:
  added: []
  patterns: [try-catch-graceful-degradation, analytics-non-blocking]
key-files:
  created: []
  modified:
    - src/actions/calculations.ts
    - src/actions/share.ts
    - src/components/public/password-gate.tsx
decisions:
  - id: ANLY-06
    summary: "Analytics wrapped in try/catch for graceful degradation"
  - id: ANLY-07
    summary: "Prospect views use 'prospect' viewer_type for tracking"
metrics:
  duration: 2min
  completed: 2026-02-05
---

# Phase 12 Plan 03: Server Action Integration Summary

Server-side analytics tracking integrated into all calculation lifecycle actions with graceful degradation.

## One-liner

Calculation CRUD and share actions now emit PostHog events server-side with try/catch non-blocking pattern.

## What Was Done

### Task 1: Tracking in calculations.ts
- Added import for `trackCalculationCreated`, `trackCalculationUpdated`, `trackCalculationDeleted`, `trackWizardCompleted`
- Track calculation creation in `saveDraft` (new calculations)
- Track calculation updates in `saveDraft` (existing calculations)
- Track finalization and wizard completion in `finalizeCalculation`
- Track deletion in `deleteCalculation`
- All tracking wrapped in try/catch for graceful degradation

### Task 2: Tracking in share.ts
- Added import for `trackCalculationViewed`, `trackShareLinkGenerated`
- Track share link generation in `generateShareLink`
- Track prospect views in `getPublicCalculation`
- All tracking wrapped in try/catch for graceful degradation

### Task 3: Terms acceptance in password gate
- Added subtle terms text below the submit button
- Link to `/villkor` opens in new tab
- Muted styling (text-xs text-gray-400) for unobtrusiveness

## Decisions Made

| ID | Decision | Rationale |
|----|----------|-----------|
| ANLY-06 | Analytics wrapped in try/catch for graceful degradation | Analytics failures should never break user-facing functionality |
| ANLY-07 | Prospect views use 'prospect' viewer_type for tracking | Enables filtering prospect vs closer/admin views in PostHog |

## Deviations from Plan

None - plan executed exactly as written.

## Key Patterns Established

### Graceful Degradation Pattern
```typescript
try {
  await trackCalculationCreated(userId, calcId, orgId, customerName)
} catch (error) {
  console.error('Analytics tracking failed:', error)
  // Don't fail the action - analytics is non-critical
}
```

This pattern ensures:
- Analytics failures are logged but don't break the action
- User experience is never impacted by tracking issues
- Errors are visible in server logs for debugging

## Files Modified

| File | Changes |
|------|---------|
| `src/actions/calculations.ts` | +83 lines - tracking imports and calls in saveDraft, finalizeCalculation, deleteCalculation |
| `src/actions/share.ts` | +31 lines - tracking imports and calls in generateShareLink, getPublicCalculation |
| `src/components/public/password-gate.tsx` | +13 lines - subtle terms acceptance text |

## Verification Results

- `npm run build` - SUCCESS
- Tracking in both action files - VERIFIED
- Terms text in password gate - VERIFIED

## ANLY-08 Status

COMPLETE: Server-side events now capture:
- Calculation creation
- Calculation updates
- Calculation finalization (wizard completion)
- Calculation deletion
- Share link generation
- Calculation views (prospect)

## Next Phase Readiness

Ready for 12-04 (Analytics Dashboard UI):
- All server-side tracking is in place
- PostHog query API proxy is available (12-02)
- Client-side wrapper is available (12-01)
