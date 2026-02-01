---
phase: 09-natagare-centralization
verified: 2026-02-01T18:00:00Z
status: passed
score: 5/5 must-haves verified
---

# Phase 9: Natagare Centralization Verification Report

**Phase Goal:** Super Admin manages global natagare with peak calculation settings
**Verified:** 2026-02-01T18:00:00Z
**Status:** PASSED
**Re-verification:** No - initial verification

## Goal Achievement

### Observable Truths

| #   | Truth | Status | Evidence |
| --- | ----- | ------ | -------- |
| 1   | All existing natagare migrated to global scope (no org-specific duplicates) | VERIFIED | Schema has globalScope Boolean, orgId nullable, ApprovalStatus enum. Migration SQL (57 lines) includes duplicate detection and global scope migration logic |
| 2   | Super Admin can configure peak method per natagare (e.g., Ellevio 3-peak) | VERIFIED | natagare-edit-form.tsx (462 lines) has peak method UI with SIMPLE_MAX, N_PEAK_AVERAGE, SEASONAL_PEAK and conditional fields |
| 3   | Super Admin can configure night discount percentage and hours | VERIFIED | natagare-edit-form.tsx has nightDiscountPercent, peakNightStartHour, peakNightEndHour fields with live preview |
| 4   | Org Admin can add new natagare to global list if missing | VERIFIED | natagare-request-form.tsx (180 lines) creates pending requests; createNatagare action sets approvalStatus: PENDING |
| 5   | Closer sees only natagare dropdown (no edit access) | VERIFIED | showActions prop hides buttons; customer-info-step.tsx hides add link for CLOSER; permissions restrict to NATAGARE_VIEW only |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| prisma/schema.prisma | Natagare model with globalScope, approvalStatus, nullable orgId | VERIFIED (564 lines) | ApprovalStatus enum, globalScope Boolean, orgId String?, peakCalculationMethod, nightDiscountPercent fields present |
| prisma/migrations/20260201171700_natagare_global_scope/migration.sql | Migration with duplicate detection | VERIFIED (57 lines) | Creates ApprovalStatus enum, adds fields, flags duplicates, migrates unique natagare to global |
| src/lib/auth/permissions.ts | NATAGARE_APPROVE, NATAGARE_REQUEST, NATAGARE_CONFIG | VERIFIED (171 lines) | All three permissions present; ORG_ADMIN has REQUEST but not EDIT/DELETE |
| src/actions/natagare.ts | getGlobalNatagare, getPendingNatagare, approveNatagare, rejectNatagare, updateNatagareConfig | VERIFIED (712 lines) | All actions present with proper permission checks |
| src/app/(dashboard)/dashboard/admin/natagare/page.tsx | Super Admin config page | VERIFIED (84 lines) | Fetches global + pending natagare, renders config panel |
| src/components/natagare/natagare-config-panel.tsx | List-with-side-panel layout | VERIFIED (107 lines) | 40/60 split, selection state, status badges |
| src/components/natagare/natagare-edit-form.tsx | Peak method and night discount form | VERIFIED (462 lines) | Full form with SIMPLE_MAX, N_PEAK_AVERAGE, SEASONAL_PEAK; night discount with preview |
| src/components/natagare/natagare-duplicate-banner.tsx | Duplicate warning banner | VERIFIED (34 lines) | Shows count and guidance for duplicates |
| src/components/natagare/natagare-request-form.tsx | Org Admin request form | VERIFIED (180 lines) | Full form with info banner explaining approval workflow |
| src/components/dashboard/pending-approvals-widget.tsx | Super Admin dashboard widget | VERIFIED (92 lines) | Shows pending natagare with count badge and link to config page |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | -- | --- | ------ | ------- |
| admin/natagare/page.tsx | actions/natagare.ts | Server component fetch | WIRED | await getGlobalNatagare(), await getPendingNatagare() |
| natagare-config-panel.tsx | natagare-edit-form.tsx | Props passing | WIRED | selected natagare passed as prop to NatagareEditForm |
| natagare-edit-form.tsx | actions/natagare.ts | Form submission | WIRED | Calls updateNatagareConfig, approveNatagare, rejectNatagare |
| dashboard/natagare/page.tsx | auth/permissions.ts | Role-based rendering | WIRED | Checks hasPermission, redirects SUPER_ADMIN |
| calculations/new/page.tsx | actions/natagare.ts | Dropdown data | WIRED | Calls getNatagare() which returns global + org pending |
| customer-info-step.tsx | userRole prop | Conditional rendering | WIRED | Hides add link when userRole === 'CLOSER' |
| admin/page.tsx | pending-approvals-widget.tsx | Widget integration | WIRED | Fetches getPendingNatagare(), renders widget |

### Requirements Coverage

| Requirement | Status | Evidence |
| ----------- | ------ | -------- |
| NATA-06: Global natagare scope | SATISFIED | Schema has globalScope field, nullable orgId, migration logic |
| NATA-07: Super Admin configures peak method | SATISFIED | Edit form with SIMPLE_MAX, N_PEAK_AVERAGE, SEASONAL_PEAK |
| NATA-08: Super Admin configures night discount | SATISFIED | Edit form with nightDiscountPercent, peakNightStartHour/EndHour |
| NATA-09: Org Admin can request new natagare | SATISFIED | Request form, createNatagare creates PENDING status |
| NATA-10: Closer/Org Admin view-only for configs | SATISFIED | showActions prop, permission checks, hidden add link |
| NATA-11: Calculation uses global natagare list | SATISFIED | getNatagare() returns global + org pending, passed to wizard |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| (none) | - | - | - | No blockers or warnings found |

All "placeholder" matches are placeholder attributes for form inputs (valid usage).
The `return null` in duplicate-banner.tsx is conditional rendering (valid pattern).

### Human Verification Required

1. **Visual: Super Admin config page layout**
   - **Test:** Navigate to /dashboard/admin/natagare as Super Admin
   - **Expected:** List-with-side-panel layout renders correctly, selection works
   - **Why human:** Visual appearance cannot be verified programmatically

2. **Flow: Org Admin natagare request workflow**
   - **Test:** As Org Admin, request new natagare, verify it appears with PENDING badge
   - **Expected:** Natagare created, shown with "Vantande godkannande" badge, usable in calculations
   - **Why human:** Full user flow requires browser interaction

3. **Flow: Super Admin approval workflow**
   - **Test:** As Super Admin, approve a pending natagare
   - **Expected:** Status changes to APPROVED, becomes global, visible to all orgs
   - **Why human:** Cross-org visibility requires multi-user testing

4. **Access: Closer cannot modify natagare**
   - **Test:** As Closer, verify no edit/delete buttons on natagare list, no "add" link in wizard
   - **Expected:** View-only access enforced
   - **Why human:** Role-based UI requires authenticated session

## Summary

All 5 success criteria from the phase goal have been verified against the actual codebase:

1. **Migration infrastructure exists** - Schema supports global scope (nullable orgId, globalScope field, ApprovalStatus enum). Migration SQL includes duplicate detection and global scope transformation logic.

2. **Peak method configuration complete** - Full UI with three methods (SIMPLE_MAX, N_PEAK_AVERAGE for Ellevio, SEASONAL_PEAK for Vattenfall) with conditional fields. Stored as JSON in peakCalculationMethod field.

3. **Night discount configuration complete** - Form fields for percentage and hours with live preview showing calculated rate.

4. **Org Admin request flow complete** - Request form creates natagare with PENDING status, visible to org immediately, awaiting Super Admin approval.

5. **Role-based access enforced** - CLOSER has view-only access (showActions=false, hidden add link). ORG_ADMIN can request but not edit/delete. SUPER_ADMIN has full access via dedicated config page.

All artifacts are substantive (adequate line counts, no stub patterns) and properly wired (imports verified, data flows through components to actions).

---

*Verified: 2026-02-01T18:00:00Z*
*Verifier: Claude (gsd-verifier)*
