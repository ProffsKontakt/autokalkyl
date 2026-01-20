---
phase: 04-customer-experience
plan: 01
subsystem: share-infrastructure

dependency-graph:
  requires:
    - 03-calculator-engine (for calculation results structure)
    - 01-foundation (for auth, tenant scoping, prisma patterns)
  provides:
    - share-link-generation
    - public-calculation-fetch
    - view-tracking-analytics
    - share-types
  affects:
    - 04-02 (public routes will use these actions)
    - 04-03 (interactive simulator will use getPublicCalculation)

tech-stack:
  added:
    - nanoid: 5.1.6 (share code generation)
  patterns:
    - public-safe-types (explicit exclusion of sensitive pricing)
    - privacy-preserving-analytics (IP hashing)
    - fire-and-forget-tracking (non-blocking view recording)

key-files:
  created:
    - prisma/schema.prisma (share metadata fields, CalculationView, CalculationVariant)
    - src/lib/share/generate-code.ts (nanoid-based code generation)
    - src/lib/share/types.ts (public-safe type definitions)
    - src/actions/share.ts (server actions for sharing)

decisions:
  - Share codes use nanoid with 21 characters (126 bits entropy)
  - IP addresses hashed with SHA256, truncated to 16 chars for privacy
  - Password protection uses bcrypt with cost 12
  - Public data explicitly excludes marginSek, costPrice, installerCut

metrics:
  duration: 4 min
  completed: 2026-01-20

tags:
  - nanoid
  - share-links
  - view-tracking
  - public-api
  - privacy
---

# Phase 04 Plan 01: Share Infrastructure Summary

**One-liner:** Database schema and server actions for shareable calculation links with nanoid codes, password protection, expiration, and privacy-preserving view tracking.

## What Was Built

### Schema Extensions (Calculation Model)
Added share link metadata fields to existing Calculation model:
- `shareExpiresAt` - Optional expiration timestamp
- `sharePassword` - bcrypt hash for optional password protection
- `shareCreatedAt` - When link was first generated
- `shareIsActive` - Boolean to deactivate without deleting
- `customGreeting` - Customizable message for prospects

### New Models
1. **CalculationView** - View tracking for analytics
   - Tracks viewedAt timestamp, userAgent, and hashed IP
   - Privacy-preserving: IP is SHA256 hashed and truncated

2. **CalculationVariant** - Prospect consumption adjustments
   - Stores modified consumption profiles
   - Stores recalculated results
   - Enables tracking of what-if scenarios

### Share Code Generation
Created `src/lib/share/generate-code.ts`:
- `generateShareCode()` - 21-char nanoid (126 bits entropy)
- `generateShortShareCode()` - 12-char variant for display

### Public-Safe Types
Created `src/lib/share/types.ts` with explicit exclusion of sensitive data:
- `PublicBatteryInfo` - Battery specs without costPrice
- `CalculationResultsPublic` - Results without margin data
- `PublicCalculationData` - Full public payload structure
- `ShareLinkSettings` - Settings for link creation
- `ViewStats` - Analytics data for dashboard

### Server Actions
Created `src/actions/share.ts`:

| Action | Auth | Purpose |
|--------|------|---------|
| `generateShareLink` | Required | Create/update share link with settings |
| `deactivateShareLink` | Required | Disable link without deleting |
| `regenerateShareLink` | Required | Create new code, invalidate old |
| `getPublicCalculation` | None | Fetch public-safe calculation data |
| `recordView` | None | Fire-and-forget view tracking |
| `getViewStats` | Required | View statistics for dashboard |

## Key Implementation Details

### Security Measures
1. **Unguessable share codes** - nanoid with 126 bits of entropy
2. **Password protection** - bcrypt with cost 12
3. **Link expiration** - Optional DateTime, checked on fetch
4. **Deactivation** - shareIsActive flag for instant revocation

### Privacy Measures
1. **IP hashing** - SHA256 with truncation to 16 chars
2. **User agent truncation** - Limited to 500 chars
3. **Fire-and-forget** - View tracking failures don't break page load

### Data Filtering
Public API explicitly excludes:
- `marginSek` - Business-sensitive margin data
- `costPrice` - Battery cost to organization
- `installerCut` - ProffsKontakt installer allocation
- `installerFixedCut` - Organization installer cut settings

## Commits

| Hash | Type | Description |
|------|------|-------------|
| 1011603 | feat | Schema extension for sharing (metadata fields, view/variant models) |
| 57d7388 | feat | Share code generation with nanoid, type definitions |
| ffa0e61 | feat | Server actions for share link management |

## Files Changed

### Created
- `src/lib/share/generate-code.ts`
- `src/lib/share/types.ts`
- `src/actions/share.ts`

### Modified
- `prisma/schema.prisma` (added share fields, CalculationView, CalculationVariant)
- `package.json` (added nanoid dependency)

## Deviations from Plan

None - plan executed exactly as written.

## Testing Notes

Verification completed:
- `npx prisma validate` - Schema is valid
- `npx tsc --noEmit` - No TypeScript errors
- `npm ls nanoid` - nanoid 5.1.6 installed
- Manual review confirms sensitive fields excluded from types

## Next Phase Readiness

**Prerequisites for 04-02 (Public View Routes):**
- Share actions ready to use from page components
- Public-safe types defined for component props
- View tracking ready for page load integration

**Note:** Schema changes require `npx prisma db push` when database access is available.
