# Architecture

**Analysis Date:** 2026-01-26

## Pattern Overview

**Overall:** Multi-tenant SaaS with server-driven state, real-time auto-save, and role-based access control.

**Key Characteristics:**
- Next.js 16 App Router with server components as default
- Server Actions (async RPC) for all mutations and protected operations
- Multi-tenant data isolation via Prisma extensions and JWT claims
- Zustand client store for wizard state with localStorage persistence
- Decimal.js for financial precision in ROI calculations
- JWT-based authentication (NextAuth v5) with custom claims (role, orgId, orgSlug)

## Layers

**Presentation Layer:**
- Purpose: User interface and user interactions
- Location: `src/app/`, `src/components/`
- Contains: Page routes, layout wrappers, interactive components, forms
- Depends on: Server Actions, Zustand stores, hooks, utility functions
- Used by: Browser clients, Next.js renderer

**Application Layer (Server Actions):**
- Purpose: Business logic entry points with authorization and data validation
- Location: `src/actions/`
- Contains: 'use server' functions for CRUD, state mutations, side effects
- Depends on: Prisma clients, auth system, calculations engine, external APIs
- Used by: Client components via async RPC calls

**Business Logic Layer:**
- Purpose: Domain logic for calculations, conversions, formatting
- Location: `src/lib/`
- Subdirectories:
  - `calculations/`: ROI engine, formulas, consumption presets
  - `auth/`: Credentials validation, permission checks, JWT config
  - `electricity/`: Price fetching and quarterly averages
  - `db/`: Tenant-scoped Prisma client extensions
  - `analytics/`: PostHog integration
  - `email/`: Password reset emails
  - `share/`: Public share link logic
  - `webhooks/`: N8N margin alerts
- Depends on: External APIs, database
- Used by: Server Actions, other lib modules

**Data Access Layer:**
- Purpose: Database operations with tenant isolation
- Location: `src/lib/db/`
- Contains: Prisma client factory, tenant-scoped query extensions
- Depends on: Prisma ORM, PostgreSQL via Neon
- Used by: Server Actions, business logic

**State Management (Client):**
- Purpose: Ephemeral wizard state with browser persistence
- Location: `src/stores/calculation-wizard-store.ts`
- Contains: Zustand store with localStorage middleware
- Depends on: Zustand, browser APIs
- Used by: Calculation wizard components, useAutoSave hook

## Data Flow

**Calculation Wizard Flow:**

1. **User enters Customer Info** → Zustand store updates → useAutoSave detects change
2. **useAutoSave (2s debounce)** → calls `saveDraft` (Server Action)
3. **saveDraft** → validates with Zod → checks permissions → creates/updates Calculation in DB
4. **Server Action returns** → Zustand markSaved() updates lastSavedAt → UI shows "Saved"
5. **User navigates to Results** → Zustand state persists via localStorage
6. **Results Step** → calls calculation engine with current battery selections → displays ROI

**Public Share Flow:**

1. **User shares calculation** → Server Action `createShareLink` generates unique shareCode
2. **Public URL** → `/{org}/{shareCode}` route
3. **Anonymous visitor** → `getPublicCalculation` checks share expiry and password
4. **View recorded** → fire-and-forget `recordView` to analytics
5. **Results rendered** → branded header, ROI summary, PDF download

**Authentication Flow:**

1. **User submits login form** → Server Action `loginUser` calls `signIn('credentials')`
2. **NextAuth Credentials Provider** → calls `validateCredentials(email, password)`
3. **Validation** → bcryptjs hash comparison → returns User with role, orgId, orgSlug
4. **JWT callback** → stores role/orgId/orgSlug in JWT token
5. **Session callback** → copies JWT claims to session.user object
6. **Protected page** → `auth()` retrieves session, checks orgId for tenant scoping

**State Management:**

**Client State (Zustand):**
- Calculation wizard data (customer info, consumption profile, battery selections)
- UI state (current step, saving status, last saved timestamp)
- Persisted to localStorage for recovery on page refresh

**Server State (Database):**
- Calculations (with DRAFT/COMPLETE/ARCHIVED status)
- Users with encrypted passwords (bcryptjs)
- Organization configuration (colors, ProffsKontakt settings)
- Battery reference data (tenant-scoped)
- Electricity prices (global reference data)

**Session State (JWT):**
- User ID, email, name
- Role (SUPER_ADMIN, ORG_ADMIN, CLOSER)
- orgId (null for platform admins, org UUID for org users)
- orgSlug (for URL routing)
- No refresh tokens (stateless architecture)

## Key Abstractions

**TenantPrismaClient:**
- Purpose: Automatic orgId scoping on all tenant models
- Location: `src/lib/db/tenant-client.ts`
- Pattern: Prisma $extends() with operation interception
- Enforces: Data isolation by orgId on reads, writes, updates, deletes
- Models scoped: User, BatteryBrand, BatteryConfig, Natagare, Calculation
- Example usage: `const db = createTenantClient(session.user.orgId)`

**CalculationWizard Component:**
- Purpose: Multi-step form orchestrator with state, validation, auto-save
- Location: `src/components/calculations/wizard/calculation-wizard.tsx`
- Manages: Step progression, initial data loading, form validation
- Delegates to: CustomerInfoStep, ConsumptionStep, BatteryStep, ResultsStep

**Calculation Engine:**
- Purpose: ROI math with decimal precision
- Location: `src/lib/calculations/engine.ts`
- Implements: 15+ financial formulas (spotpris savings, effect tariff, payback period, ROI)
- Uses: Decimal.js for all monetary calculations
- Input: Battery specs, consumption, electricity prices, tariffs
- Output: Annual savings breakdown, payback period, 10-year ROI

**ConsumptionProfile:**
- Purpose: 12x24 hourly consumption matrix [month][hour]
- Location: `src/lib/calculations/types.ts` and `presets.ts`
- Patterns: System presets (household, summer cottage), manual editing, scaling to annual total
- Used in: Wizard Step 2, calculation engine, PDF export

**Share Link System:**
- Purpose: Generate expiring public calculation views with optional password protection
- Location: `src/lib/share/`, `src/actions/share.ts`
- Models: Calculation has many CalculationShare records
- Features: Expiry dates, password hashing, view count tracking, analytics
- Pattern: Slug-based URLs, session-less access with share auth

**Role-Based Access Control (RBAC):**
- Purpose: Permission matrix for operations by role
- Location: `src/lib/auth/permissions.ts`
- Roles: SUPER_ADMIN (all), ORG_ADMIN (own org + users), CLOSER (own calculations)
- Functions: `hasPermission()`, `requirePermission()`, `canAccessOrg()`
- Used in: Server Actions to guard operations, component visibility

## Entry Points

**Web App Root:**
- Location: `src/app/layout.tsx`
- Triggers: Browser navigation to /
- Responsibilities: Global Providers (SessionProvider, ThemeProvider, PostHogProvider), font loading, metadata

**Dashboard:**
- Location: `src/app/(dashboard)/layout.tsx`
- Triggers: Authenticated user accessing /dashboard/*
- Responsibilities: Session check, role routing (admin sidebar vs dashboard nav), layout wrapper

**Auth Pages:**
- Location: `src/app/(auth)/login/page.tsx`, forgot-password, reset-password
- Triggers: Unauthenticated user or password reset flow
- Responsibilities: Login form, email validation, token verification

**Admin Panel:**
- Location: `src/app/(admin)/layout.tsx`, `src/app/(admin)/admin/*`
- Triggers: SUPER_ADMIN user accessing /admin/*
- Responsibilities: Organization management, user administration

**Public Share View:**
- Location: `src/app/(public)/[org]/[shareCode]/page.tsx`
- Triggers: Anonymous visitor accessing shared calculation link
- Responsibilities: Fetch public calculation, check share expiry/password, render results, track views

**API Route (Auth):**
- Location: `src/app/api/auth/[...nextauth]/route.ts`
- Triggers: NextAuth credential/session requests
- Responsibilities: Delegate to NextAuth handlers (POST /login, GET /session)

## Error Handling

**Strategy:** Server Actions return `{ error: string }` or `{ data: T }`; components display inline errors.

**Patterns:**

**Server Action Errors:**
```typescript
// src/actions/calculations.ts
async function saveDraft(input: SaveDraftInput) {
  try {
    const session = await auth()
    if (!session?.user?.orgId) return { error: 'Not authenticated' }

    const db = createTenantClient(session.user.orgId)
    const result = await db.calculation.create({ ... })
    return { calculationId: result.id }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
```

**Validation Errors:**
- Zod schemas validate input before DB operations
- Invalid input returns validation message immediately
- Example: `saveDraftSchema.safeParse(input)` returns `{ success, error }`

**Authorization Errors:**
- `requirePermission(role, permission)` throws Error if denied
- Caught in try/catch, returned as `{ error: 'Permission denied' }`
- Example: Only CLOSER can view own calculations

**DB Errors:**
- Transaction failures, constraint violations logged
- Generic error message returned to client for security
- Sensitive details (SQL) never exposed to frontend

## Cross-Cutting Concerns

**Logging:** Console.error() in Server Actions and lib functions; no centralized logger configured.

**Validation:** Zod schemas on all Server Action inputs; runtime type checking before DB operations.

**Authentication:** NextAuth v5 with JWT strategy; every protected Server Action calls `auth()` first.

**Authorization:** Role + org scoping; `requirePermission(role, perm)` on sensitive operations; tenant client auto-filters queries.

**Analytics:** PostHog client on frontend; track page views, user identification, calculation finalization; fire-and-forget on public share views.

**Tenant Scoping:**
- JWT carries orgId (null for SUPER_ADMIN)
- TenantPrismaClient auto-filters by orgId on all reads/writes
- SUPER_ADMIN uses global prisma client for cross-org operations
- Calculations, users, batteries, natagare are org-scoped
- ElectricityPrice is global (shared reference data)

---

*Architecture analysis: 2026-01-26*
