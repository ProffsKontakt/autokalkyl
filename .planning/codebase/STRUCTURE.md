# Codebase Structure

**Analysis Date:** 2026-01-26

## Directory Layout

```
autokalkyl/
├── src/                          # Source code
│   ├── app/                      # Next.js App Router (pages, layouts, API routes)
│   │   ├── (admin)/              # Admin panel (SUPER_ADMIN only)
│   │   ├── (auth)/               # Public auth pages (login, password reset)
│   │   ├── (dashboard)/          # Protected dashboard (authenticated users)
│   │   ├── (public)/             # Public share view (anonymous access)
│   │   ├── api/auth/[...nextauth]/  # NextAuth API endpoint
│   │   ├── layout.tsx            # Root layout with providers
│   │   ├── providers.tsx         # Global providers (SessionProvider, ThemeProvider, PostHog)
│   │   ├── page.tsx              # Home page (redirect based on auth state)
│   │   └── globals.css           # Global Tailwind styles
│   ├── components/               # Reusable React components
│   │   ├── analytics/            # PostHog integration components
│   │   ├── batteries/            # Battery CRUD forms and lists
│   │   ├── calculations/         # Wizard, results, PDF export
│   │   ├── dashboard/            # Dashboard stats, tables, charts
│   │   ├── electricity/          # Electricity price display
│   │   ├── layout/               # Navigation, sidebars, headers
│   │   ├── natagare/             # Grid operator form and list
│   │   ├── organizations/        # Organization forms
│   │   ├── public/               # Public share view components
│   │   ├── share/                # Share link creation and management
│   │   ├── theme/                # Dark mode provider
│   │   ├── ui/                   # Primitive UI components (button, input, dialog, etc.)
│   │   └── users/                # User CRUD forms and list
│   ├── actions/                  # Server Actions (RPC endpoints)
│   │   ├── auth.ts               # Login, logout, sign up
│   │   ├── batteries.ts          # Create/update/delete battery configs
│   │   ├── calculations.ts       # Save draft, finalize, list, delete
│   │   ├── dashboard.ts          # Dashboard stats queries
│   │   ├── electricity.ts        # Fetch and list electricity prices
│   │   ├── natagare.ts           # Create/update/delete grid operators
│   │   ├── organizations.ts      # Create/update/delete organizations
│   │   ├── password-reset.ts     # Request and verify password reset
│   │   ├── share.ts              # Create shares, get public calc, record views
│   │   └── users.ts              # Create/update/delete users
│   ├── lib/                      # Shared business logic
│   │   ├── auth/                 # Authentication
│   │   │   ├── auth.ts           # NextAuth config with JWT
│   │   │   ├── auth.config.ts    # Callbacks, redirect logic
│   │   │   ├── permissions.ts    # RBAC matrix and helpers
│   │   │   └── credentials.ts    # Email/password validation, bcryptjs
│   │   ├── calculations/         # ROI calculation engine
│   │   │   ├── engine.ts         # Main calculation orchestrator (LOGIC-10)
│   │   │   ├── formulas.ts       # Individual calculation formulas
│   │   │   ├── types.ts          # TypeScript interfaces for inputs/outputs
│   │   │   ├── constants.ts      # Magic numbers (VAT rate, gr—n teknik, etc.)
│   │   │   ├── presets.ts        # Consumption profile presets
│   │   │   └── elomrade-lookup.ts # Postal code to elomr—de mapping
│   │   ├── db/                   # Database and Prisma
│   │   │   ├── client.ts         # Global Prisma client instance
│   │   │   └── tenant-client.ts  # Tenant-scoped Prisma extensions
│   │   ├── electricity/          # Electricity price data
│   │   │   ├── fetch-prices.ts   # Fetch prices from external API
│   │   │   ├── quarterly-averages.ts # Aggregate quarterly data
│   │   │   └── types.ts          # Price types
│   │   ├── email/                # Email sending
│   │   │   └── send-reset-email.ts # Password reset emails (Resend)
│   │   ├── analytics/            # PostHog analytics
│   │   │   ├── posthog.ts        # PostHog client instance
│   │   │   └── events.ts         # Event definitions
│   │   ├── share/                # Public share links
│   │   │   └── (share logic)
│   │   ├── webhooks/             # Outgoing webhooks
│   │   │   └── n8n.ts            # N8N margin alert triggers
│   │   └── utils.ts              # Generic utility functions
│   ├── hooks/                    # React hooks
│   │   └── use-auto-save.ts      # Debounced draft auto-save
│   ├── stores/                   # Client state (Zustand)
│   │   └── calculation-wizard-store.ts # Wizard state with localStorage
│   └── types/                    # TypeScript augmentation
│       └── next-auth.d.ts        # NextAuth type augmentation (role, orgId)
├── prisma/                       # Database schema and migrations
│   ├── schema.prisma             # Data models (13 models, 3 enums)
│   └── migrations/               # Database migration files
├── public/                       # Static assets
│   ├── favicon.ico
│   └── (images, etc.)
├── .planning/                    # GSD planning documents
│   ├── codebase/                 # This directory (ARCHITECTURE.md, STRUCTURE.md, etc.)
│   ├── phases/                   # Implementation phase plans
│   └── milestones/               # Milestone definitions
├── .env.example                  # Environment variable template
├── .env.local                    # Local environment variables (not committed)
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript config
├── next.config.js                # Next.js config
├── tailwind.config.js            # Tailwind CSS config
├── postcss.config.js             # PostCSS config
└── eslint.config.js              # ESLint config
```

## Directory Purposes

**`src/app/`:**
- Purpose: Next.js App Router page structure and routing
- Contains: Route groups (admin, auth, dashboard, public), layouts, page components, API routes
- Key files: `layout.tsx` (root), `providers.tsx` (global setup)

**`src/app/(admin)/`:**
- Purpose: Platform admin interface for organization management
- Contains: Organization CRUD pages, only accessible to SUPER_ADMIN
- Key pages: `admin/`, `admin/organizations`, `admin/organizations/[id]`, `admin/organizations/new`

**`src/app/(auth)/`:**
- Purpose: Authentication pages accessible to unauthenticated users
- Contains: Login form, password reset flow, email verification
- Key pages: `login/`, `forgot-password/`, `reset-password/`

**`src/app/(dashboard)/`:**
- Purpose: Protected dashboard for authenticated organization users
- Contains: Calculation wizard, CRUD pages for batteries/users/natagare, settings
- Key pages: `dashboard/`, `dashboard/calculations/[id]`, `dashboard/batteries/`, `dashboard/users/`, `dashboard/natagare/`, `dashboard/settings/`

**`src/app/(public)/`:**
- Purpose: Anonymous public share view
- Contains: Public calculation display with optional password gate
- Key pages: `[org]/[shareCode]/`, password protection via query param `?pwd=`

**`src/components/`:**
- Purpose: Reusable UI components organized by feature domain
- Contains: Forms, lists, tables, charts, modals, utilities
- Pattern: Each domain (batteries, calculations, users) has own subfolder with related components

**`src/components/calculations/wizard/`:**
- Purpose: Multi-step calculation wizard
- Contains: Main orchestrator, 4 steps, consumption simulator with presets
- Structure:
  - `calculation-wizard.tsx` - Orchestrator and step management
  - `wizard-navigation.tsx` - Step progress, prev/next buttons
  - `steps/` - CustomerInfoStep, ConsumptionStep, BatteryStep, ResultsStep
  - `consumption-simulator/` - Profile editor with month tabs, day chart, presets

**`src/components/calculations/results/`:**
- Purpose: Display ROI calculation results
- Contains: Summary cards, savings breakdown, ROI timeline, comparison view
- Key components: `summary-cards.tsx`, `savings-breakdown.tsx`, `roi-timeline-chart.tsx`

**`src/components/calculations/pdf/`:**
- Purpose: PDF export of calculations
- Contains: React-PDF renderer, download button
- Key components: `calculation-pdf.tsx`, `pdf-download-button.tsx`

**`src/components/ui/`:**
- Purpose: Primitive, reusable UI components
- Contains: Button, Input, Dialog, Select, Dropdown, Tab, Card, etc.
- Pattern: Unstyled base components; styling applied in feature components or pages

**`src/actions/`:**
- Purpose: Server Actions for mutations, queries, and protected operations
- Contains: RPC functions with authentication, authorization, validation
- Naming: `{domain}.ts` (e.g., `calculations.ts`, `users.ts`)
- Pattern: Each file exports multiple functions; errors return `{ error: string }` or `{ data: T }`

**`src/lib/calculations/`:**
- Purpose: Battery ROI calculation engine
- Key files:
  - `engine.ts` - LOGIC-10: main orchestrator calling individual formulas
  - `formulas.ts` - LOGIC-01 through LOGIC-09: individual calculations
  - `types.ts` - CalculationInputs, CalculationResults, BatterySpec
  - `constants.ts` - Magic numbers (VAT, gr—n teknik, default consumption)
  - `presets.ts` - Consumption profile presets (household, summer cottage, etc.)

**`src/lib/auth/`:**
- Purpose: Authentication and authorization
- Key files:
  - `auth.ts` - NextAuth config with Credentials provider
  - `permissions.ts` - RBAC matrix (SUPER_ADMIN, ORG_ADMIN, CLOSER)
  - `credentials.ts` - Email/password validation with bcryptjs

**`src/lib/db/`:**
- Purpose: Database access patterns
- Key files:
  - `client.ts` - Global Prisma client instance
  - `tenant-client.ts` - Tenant-scoped Prisma extensions (auto-filters by orgId)

**`src/hooks/`:**
- Purpose: Custom React hooks
- Key files:
  - `use-auto-save.ts` - 2-second debounced draft save for wizard

**`src/stores/`:**
- Purpose: Client-side state management with Zustand
- Key files:
  - `calculation-wizard-store.ts` - Wizard form state, localStorage persistence

**`prisma/`:**
- Purpose: Database schema and migrations
- Key files:
  - `schema.prisma` - 13 models (Organization, User, Calculation, BatteryConfig, etc.), 3 enums (Role, Elomrade, CalculationStatus)
  - `migrations/` - Timestamped migration files

## Key File Locations

**Entry Points:**
- `src/app/layout.tsx`: Root HTML, providers, fonts
- `src/app/providers.tsx`: SessionProvider, ThemeProvider, PostHogProvider
- `src/app/(dashboard)/layout.tsx`: Dashboard wrapper with auth check and role routing
- `src/app/(public)/[org]/[shareCode]/page.tsx`: Public share view entry

**Configuration:**
- `tsconfig.json`: TypeScript compiler with `paths` aliases (`@/` = src/)
- `next.config.js`: Next.js settings
- `tailwind.config.js`: Tailwind CSS customization (colors, spacing)
- `.env.example`: Template for environment variables

**Core Logic:**
- `src/lib/calculations/engine.ts`: ROI calculation orchestrator
- `src/lib/db/tenant-client.ts`: Multi-tenant data isolation
- `src/lib/auth/permissions.ts`: RBAC permission matrix
- `src/lib/auth/auth.ts`: NextAuth JWT configuration

**Server Actions:**
- `src/actions/calculations.ts`: 600+ lines of calculation CRUD and finalization
- `src/actions/share.ts`: Public share link creation and validation
- `src/actions/batteries.ts`: Battery reference data CRUD
- `src/actions/users.ts`: User CRUD with permission checks

**Components (Wizard):**
- `src/components/calculations/wizard/calculation-wizard.tsx`: Main orchestrator
- `src/components/calculations/wizard/steps/`: 4-step UI (customer, consumption, battery, results)

**Types and Data:**
- `src/lib/calculations/types.ts`: CalculationInputs, CalculationResults, BatterySpec
- `src/lib/calculations/constants.ts`: VAT rate, gr—n teknik rebate, default consumption
- `src/stores/calculation-wizard-store.ts`: Zustand state shape

**Testing:**
- No test files present; testing patterns not yet established

## Naming Conventions

**Files:**
- **Pages:** `page.tsx` (Next.js convention)
- **Layouts:** `layout.tsx` (Next.js convention)
- **Components:** PascalCase, descriptive (e.g., `CalculationWizard.tsx`, `CustomerInfoStep.tsx`)
- **Server Actions:** camelCase in `src/actions/` (e.g., `saveDraft`, `finializeCalculation`)
- **Utilities/Helpers:** camelCase in `src/lib/` (e.g., `createTenantClient`, `calculateBatteryROI`)
- **Hooks:** `use{Feature}` prefix (e.g., `useAutoSave`, `useCalculationWizardStore`)
- **Types/Enums:** PascalCase (e.g., `CalculationInputs`, `Elomrade`, `Role`)

**Directories:**
- **Feature domains:** Plural noun for reusable content (e.g., `components/batteries/`, `components/calculations/`, `actions/`)
- **Utilities:** Descriptive name (e.g., `lib/auth/`, `lib/db/`, `lib/calculations/`)
- **Layout groups:** Parentheses for grouped routes (e.g., `(admin)`, `(auth)`, `(dashboard)`, `(public)`)

**URL Patterns:**
- **Authenticated:** `/dashboard/{feature}/{action}` (e.g., `/dashboard/calculations/new`, `/dashboard/users/[id]`)
- **Admin:** `/admin/{resource}/{action}` (e.g., `/admin/organizations`, `/admin/organizations/new`)
- **Public:** `/{orgSlug}/{shareCode}` (e.g., `/acme-solar/abc123xyz`)
- **Auth:** `/{action}` (e.g., `/login`, `/forgot-password`, `/reset-password`)

## Where to Add New Code

**New Feature:**
- **Page route:** Add to `src/app/(dashboard)/dashboard/{feature}/page.tsx`
- **Server Action:** Create `src/actions/{feature}.ts` with `'use server'` and auth checks
- **Components:** Create `src/components/{feature}/` with form, list, detail components
- **Business logic:** Add to `src/lib/{feature}/` if complex
- **Tests (when implemented):** Create `src/{feature}.test.ts` or `__tests__/` directory

**New Component/Module:**
- **General component:** Place in `src/components/{feature}/ComponentName.tsx`
- **Layout component:** Place in `src/components/layout/ComponentName.tsx`
- **Primitive UI component:** Place in `src/components/ui/component-name.tsx` (lowercase with hyphens)
- **Shared hook:** Create `src/hooks/useFeatureName.ts`
- **Business logic:** Create `src/lib/feature-name/index.ts` and related files

**Utilities:**
- **Calculation formulas:** Add to `src/lib/calculations/formulas.ts`
- **Calculation constants:** Add to `src/lib/calculations/constants.ts`
- **General utilities:** Create function in `src/lib/utils.ts` or new file `src/lib/feature.ts`
- **Type definitions:** Add to `src/lib/{domain}/types.ts` or `src/types/`
- **Auth helpers:** Add to `src/lib/auth/permissions.ts` or `src/lib/auth/auth.ts`

**Database Changes:**
- **New model or field:** Edit `prisma/schema.prisma`
- **Migration:** Run `npx prisma migrate dev --name {feature_name}`
- **Tenant scoping:** Add model to `src/lib/db/tenant-client.ts` `$extends()` block

**Styling:**
- **Global styles:** Add to `src/app/globals.css`
- **Component styles:** Use Tailwind classes inline; no separate CSS files
- **Theme colors:** Configure in `tailwind.config.js`
- **Dark mode:** Handled by `ThemeProvider` in `src/components/theme/theme-provider.tsx`

## Special Directories

**`src/app/api/auth/[...nextauth]/`:**
- Purpose: NextAuth API endpoint
- Generated: No (manually created catch-all route)
- Committed: Yes
- Contents: Only `route.ts` that exports NextAuth handlers

**`prisma/migrations/`:**
- Purpose: Database migration history
- Generated: Yes (by `prisma migrate` commands)
- Committed: Yes (tracked in git)
- Pattern: `{timestamp}_{description}/migration.sql`

**`.next/`:**
- Purpose: Next.js build output and cache
- Generated: Yes (during `next build`)
- Committed: No (in .gitignore)
- Contents: Compiled pages, static assets, server functions

**`node_modules/`:**
- Purpose: Installed dependencies
- Generated: Yes (by npm install)
- Committed: No (in .gitignore)
- Pattern: Lock file `package-lock.json` is committed

**`.env.local`:**
- Purpose: Local environment overrides and secrets
- Generated: No (manually created)
- Committed: No (in .gitignore)
- Contents: Database URL, API keys, auth secrets

---

*Structure analysis: 2026-01-26*
