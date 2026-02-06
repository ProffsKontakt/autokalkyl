---
status: testing
phase: 01-foundation
source: 01-01-SUMMARY.md, 01-02-SUMMARY.md, 01-03-SUMMARY.md, 01-04-SUMMARY.md, 01-05-SUMMARY.md, 01-06-SUMMARY.md, 01-07-SUMMARY.md, 01-08-SUMMARY.md
started: 2026-01-27T09:00:00Z
updated: 2026-01-28T09:05:00Z
---

## Current Test

number: 6
name: Super Admin - View All Organizations
expected: |
  Navigate to /admin/organizations. See list of all organizations with user counts and ProffsKontakt status.
awaiting: user response

## Tests

### 1. Login with Email/Password
expected: Navigate to /login. Enter valid credentials (e.g., admin@kalkyla.se / superadmin123). Submit. You are redirected to /dashboard.
result: pass

### 2. Session Persists Across Refresh
expected: After logging in, refresh the page. You remain logged in on the dashboard (not redirected to login).
result: pass
note: PostHog CSP error in console (eu-assets.i.posthog.com not in script-src) - cosmetic, doesn't break functionality

### 3. Logout from Dashboard
expected: Click logout in the navigation. You are redirected to /login and can no longer access /dashboard.
result: pass

### 4. Super Admin - Create Organization
expected: As Super Admin, navigate to /admin/organizations. Click "Ny Organisation". Fill in name, slug, branding colors, ProffsKontakt settings. Submit. Organization appears in the list.
result: pass

### 5. Super Admin - Edit Organization
expected: Click an organization in the list. Edit branding fields (logo URL, colors). Save. Changes persist.
result: issue
reported: "the changed colors does not persist"
severity: major
fix: "Fixed in org-form.tsx - color picker inputs now use watch()/setValue() instead of double-registering the same field with register(). The dual-register pattern caused react-hook-form ref conflicts."
status: fixed-pending-retest

### 6. Super Admin - View All Organizations
expected: Navigate to /admin/organizations. See list of all organizations with user counts and ProffsKontakt status.
result: [pending]

### 7. Super Admin - Create User with Role
expected: Navigate to /dashboard/users. Click "Ny Anvandare". Select organization, enter email/name/password, choose role (Org Admin or Closer). Submit. User appears in list.
result: [pending]

### 8. Super Admin - Edit User
expected: Click a user in the list. Change name or email. Save. Changes persist.
result: [pending]

### 9. Super Admin - Deactivate User
expected: Click deactivate on a user. Confirm. User shows as inactive in the list.
result: [pending]

### 10. Org Admin - Access Dashboard
expected: Log in as Org Admin (e.g., admin@test-solar.se / orgadmin123). You see the dashboard with navigation links for Kalkyler, Users, Settings.
result: [pending]

### 11. Org Admin - Edit Organization Branding
expected: As Org Admin, navigate to /dashboard/settings. See your organization info. Edit branding (logo URL, colors). Save. Changes persist.
result: [pending]

### 12. Org Admin - Create Closer User
expected: As Org Admin, navigate to /dashboard/users. Click "Ny Anvandare". Create a Closer for your organization. User appears in list.
result: [pending]

### 13. Org Admin - Cannot See Other Orgs' Users
expected: As Org Admin, you only see users from your own organization in /dashboard/users. No users from other orgs visible.
result: [pending]

### 14. Closer - Limited Access
expected: Log in as Closer (e.g., closer@test-solar.se / closer123). You see dashboard but cannot access /dashboard/settings or /admin routes.
result: [pending]

### 15. Password Reset - Request
expected: Navigate to /forgot-password. Enter a valid email. Submit. See success message (regardless of whether email exists).
result: [pending]

### 16. Password Reset - Complete Reset (Dev Mode)
expected: After requesting reset, check server console for reset link. Open link. Enter new password. Submit. Can now log in with new password.
result: [pending]

### 17. RBAC - Org Admin Cannot Access Admin Panel
expected: As Org Admin, try to navigate to /admin/organizations. You are redirected away (to dashboard).
result: [pending]

### 18. RBAC - Closer Cannot Access Settings
expected: As Closer, try to navigate to /dashboard/settings. You are redirected to /dashboard.
result: [pending]

## Summary

total: 18
passed: 4
issues: 1
pending: 13
skipped: 0

## Gaps

- truth: "Edit organization branding fields (logo URL, colors). Save. Changes persist."
  status: failed
  reason: "User reported: the changed colors does not persist"
  severity: major
  test: 5
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""
