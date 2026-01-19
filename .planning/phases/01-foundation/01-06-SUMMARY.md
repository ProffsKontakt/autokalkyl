---
phase: 01-foundation
plan: 06
subsystem: auth
tags: [password-reset, email, n8n, server-actions, security]

# Dependency graph
requires:
  - phase: 01-01
    provides: Prisma schema with PasswordResetToken model
  - phase: 01-03
    provides: UI components (Card, Input, Button, Label)
provides:
  - Password reset server actions (requestPasswordReset, resetPassword, validateResetToken)
  - Email sending module with N8N webhook integration (dev mode console logging)
  - Forgot password page with email input
  - Reset password page with token validation
affects: [n8n-integration, email-templates]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - N8N webhook integration for email sending
    - Secure token generation with crypto.randomBytes
    - Token expiration and single-use enforcement
    - Email enumeration prevention (always success response)

key-files:
  created:
    - src/actions/password-reset.ts
    - src/lib/email/send-reset-email.ts
    - src/app/(auth)/forgot-password/page.tsx
    - src/app/(auth)/forgot-password/forgot-password-form.tsx
    - src/app/(auth)/reset-password/page.tsx
    - src/app/(auth)/reset-password/reset-password-form.tsx
  modified:
    - .env.example

key-decisions:
  - "Dev mode logs reset links to console when N8N_WEBHOOK_URL not configured"
  - "Always return success on password reset request to prevent email enumeration"
  - "Token expiration set to 1 hour"

patterns-established:
  - "Email sending via N8N webhook (to be configured in Phase 5)"
  - "Server-side token validation before showing reset form"
  - "Success message redirect with setTimeout"

# Metrics
duration: 4min
completed: 2026-01-19
---

# Phase 01-06: Password Reset Flow Summary

**Secure password reset with N8N webhook integration, token expiration, single-use enforcement, and email enumeration prevention**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-19T13:10:00Z
- **Completed:** 2026-01-19T13:14:00Z
- **Tasks:** 3/3
- **Files created:** 6

## Accomplishments

- Password reset server actions with secure 32-byte token generation
- Email sending module that logs to console in dev, calls N8N webhook in production
- Forgot password page with success message (prevents email enumeration)
- Reset password page with server-side token validation
- Token expiration (1 hour) and single-use enforcement
- Password confirmation with client-side validation

## Task Commits

Each task was committed atomically:

1. **Task 1: Create password reset server actions** - `9fd553d` (feat)
2. **Task 2: Create forgot password page** - `41b8252` (feat)
3. **Task 3: Create reset password page** - `5a42a32` (feat)

## Files Created/Modified

- `src/actions/password-reset.ts` - Server actions for request, reset, and validate
- `src/lib/email/send-reset-email.ts` - N8N webhook email sender (dev mode console)
- `src/app/(auth)/forgot-password/page.tsx` - Forgot password page
- `src/app/(auth)/forgot-password/forgot-password-form.tsx` - Email input form
- `src/app/(auth)/reset-password/page.tsx` - Reset password page with token validation
- `src/app/(auth)/reset-password/reset-password-form.tsx` - Password reset form
- `.env.example` - Added N8N_WEBHOOK_URL variable

## Decisions Made

1. **Dev mode console logging** - When N8N_WEBHOOK_URL is not configured, reset links are logged to console for easy testing during development.

2. **Email enumeration prevention** - Always return success response on password reset request, even if email doesn't exist or user is inactive.

3. **Server-side token validation** - Reset password page validates token server-side before rendering the form, preventing invalid token submissions.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

**External services require manual configuration.** For N8N email integration:

1. Set `N8N_WEBHOOK_URL` in `.env.local` to your N8N webhook endpoint
2. Configure N8N workflow to receive:
   - `type: "password_reset"`
   - `to: email`
   - `userName: name`
   - `resetUrl: url`
   - `subject: "Aterstall ditt losenord - Kalkyla.se"`

Note: N8N integration will be fully configured in Phase 5. Until then, reset links are logged to console in development.

## Next Phase Readiness

**Ready for:**
- Phase 01-07: Organization Settings (auth foundation complete)
- Phase 01-08: Calculator foundation (all auth flows complete)
- Phase 5: N8N integration for production email sending

**Password reset flow test accounts:**
- Use any seeded user email (admin@kalkyla.se, admin@test-solar.se, closer@test-solar.se)
- Reset link appears in server console (dev mode)

**Blockers:**
- None

---
*Phase: 01-foundation*
*Completed: 2026-01-19*
