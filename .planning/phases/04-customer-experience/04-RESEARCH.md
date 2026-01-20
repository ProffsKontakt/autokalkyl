# Phase 4: Customer Experience - Research

**Researched:** 2026-01-20
**Domain:** Public shareable views, interactive simulators, subdomain routing
**Confidence:** HIGH

## Summary

Phase 4 implements shareable public views where prospects access branded, interactive ROI calculations via links in the format `[org-slug].kalkyla.se/[shareCode]`. The existing codebase provides excellent reuse opportunities: the Calculation model already has a `shareCode` field, consumption simulator components are decoupled and reusable, and organization branding (logo, colors) is fully implemented. The calculator engine runs client-side using decimal.js, enabling live recalculation without server roundtrips.

Key implementation areas are:
1. **Schema extension** - Add share link metadata (expiration, password, view tracking)
2. **Public route architecture** - New `(public)` route group with subdomain middleware
3. **Component adaptation** - Create read-only variants of existing simulator/results components
4. **Interactive recalculation** - On-demand calculation with "Uppdatera" button pattern

**Primary recommendation:** Create a `(public)` route group with `[org]/[shareCode]` dynamic segments, bypassing auth middleware via the authorized callback. Reuse existing components with minimal props changes for read-only mode.

## Standard Stack

The established libraries/tools for this domain:

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| recharts | 3.6.0 | Consumption charts | Already used in Phase 3, touch-friendly |
| zustand | 5.0.10 | Client state | Existing wizard store pattern, no persist needed for public view |
| decimal.js | 10.6.0 | Financial calculations | Already used in engine, runs client-side |
| zod | 4.3.5 | Input validation | Schema validation for consumption adjustments |

### New Dependencies Required
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| nanoid | 5.1.6 | Share code generation | Generate secure, URL-friendly 21-char codes |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| nanoid | crypto.randomUUID | UUID is longer (36 chars) and less URL-friendly |
| nanoid | crypto-random-string | Slower, no clear advantage for share links |

**Installation:**
```bash
npm install nanoid
```

## Existing Infrastructure (HIGH Confidence)

### Calculation Model Already Supports Sharing

From `prisma/schema.prisma`:
```prisma
model Calculation {
  // ... existing fields ...
  shareCode   String?   @unique // For public sharing (Phase 4) - ALREADY EXISTS
  // ... relations ...
  @@index([shareCode])
}
```

**What exists:**
- `shareCode` field with unique constraint and index
- `consumptionProfile` stored as JSON (`{ data: number[][] }`)
- `results` stored as JSON with all ROI metrics
- Organization relation with branding fields

**What needs to be added:**
```prisma
// Share link metadata - ADD TO Calculation model
shareExpiresAt    DateTime?           // Optional expiration
sharePassword     String?             // Optional bcrypt hash
shareCreatedAt    DateTime?           // When link was generated
customGreeting    String?             // Customizable greeting message

// View tracking - NEW model
model CalculationView {
  id            String   @id @default(cuid())
  calculationId String
  viewedAt      DateTime @default(now())
  userAgent     String?
  ipHash        String?  // Hashed for privacy

  calculation   Calculation @relation(fields: [calculationId], references: [id], onDelete: Cascade)

  @@index([calculationId])
}

// Customer variants - NEW model for tracking prospect adjustments
model CalculationVariant {
  id                   String   @id @default(cuid())
  calculationId        String
  consumptionProfile   Json     // Modified profile
  results              Json     // Recalculated results
  createdAt            DateTime @default(now())

  calculation          Calculation @relation(fields: [calculationId], references: [id], onDelete: Cascade)

  @@index([calculationId])
}
```

### Organization Branding Fully Implemented

From schema and existing components:
```typescript
// Organization model includes:
logoUrl        String?
primaryColor   String   @default("#3B82F6")
secondaryColor String   @default("#1E40AF")
slug           String   @unique  // URL-friendly identifier
```

**Branding is already:**
- Stored in database with validation
- Editable via Org Admin settings page
- Used in admin views

### Reusable Components

| Component | Location | Reusability |
|-----------|----------|-------------|
| DayChart | `wizard/consumption-simulator/day-chart.tsx` | HIGH - accepts props, no store dependency |
| MonthTabs | `wizard/consumption-simulator/month-tabs.tsx` | HIGH - pure presentational |
| SummaryCards | `results/summary-cards.tsx` | HIGH - takes results object |
| SavingsBreakdown | `results/savings-breakdown.tsx` | HIGH - takes results object |
| ROITimelineChart | `results/roi-timeline-chart.tsx` | HIGH - takes results object |

**ConsumptionSimulator needs adaptation** - currently tightly coupled to Zustand store. Will need read-only variant.

### Calculator Engine Runs Client-Side

From `src/lib/calculations/engine.ts`:
```typescript
import Decimal from 'decimal.js'
// ... formula imports ...

export function calculateBatteryROI(inputs: CalculationInputs): {
  results: CalculationResults
  decimals: CalculationResultsDecimal
}
```

**Key insight:** The engine is pure functions with no server dependencies. It can run entirely client-side for live recalculation, though the CONTEXT.md decision specifies on-demand recalculation via "Uppdatera" button.

## Architecture Patterns

### Recommended Project Structure
```
src/app/
├── (admin)/           # Existing admin routes
├── (auth)/            # Existing auth routes
├── (dashboard)/       # Existing dashboard routes
└── (public)/          # NEW: Public share routes
    └── [org]/         # Org slug segment
        └── [shareCode]/
            ├── page.tsx           # Main public view
            ├── loading.tsx        # Loading skeleton
            ├── error.tsx          # Error boundary
            └── not-found.tsx      # Expired/invalid link

src/components/
├── calculations/
│   ├── wizard/        # Existing wizard components
│   ├── results/       # Existing results components
│   └── public/        # NEW: Public view components
│       ├── public-header.tsx
│       ├── public-greeting.tsx
│       ├── public-battery-summary.tsx
│       ├── public-consumption-simulator.tsx
│       ├── public-results-view.tsx
│       ├── public-footer.tsx
│       └── variant-indicator.tsx

src/actions/
└── share.ts           # NEW: Share link actions
```

### Pattern 1: Auth Bypass for Public Routes

**What:** Modify auth callback to allow unauthenticated access to public routes
**When to use:** Public share pages that don't require login

**Current auth config** (`src/lib/auth/auth.config.ts`):
```typescript
authorized({ auth, request: { nextUrl } }) {
  const isLoggedIn = !!auth?.user;
  const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
  const isOnAdmin = nextUrl.pathname.startsWith('/admin');
  // ...
  if (isOnDashboard || isOnAdmin) {
    return isLoggedIn;
  }
  // ...
  return true; // All other routes pass through
}
```

**The current config already allows public routes** - any route not starting with `/dashboard` or `/admin` is allowed without auth. The `(public)` route group will automatically be allowed.

### Pattern 2: Subdomain Middleware for Branding

**What:** Extract org slug from subdomain, inject into request
**When to use:** Multi-tenant SaaS with branded subdomains

```typescript
// middleware.ts modification
export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const subdomain = hostname.split('.')[0]

  // Check if this is an org subdomain (not www, localhost, etc.)
  if (subdomain !== 'www' && subdomain !== 'localhost') {
    // Rewrite /[shareCode] to /[org]/[shareCode]
    const url = request.nextUrl.clone()
    if (url.pathname.match(/^\/[a-zA-Z0-9_-]+$/)) {
      url.pathname = `/${subdomain}${url.pathname}`
      return NextResponse.rewrite(url)
    }
  }

  // Continue with auth middleware
  return NextAuth(authConfig).auth(request)
}
```

**Alternative (simpler):** Skip subdomain rewriting, use path-based routes `kalkyla.se/[org]/[shareCode]` with subdomain as optional enhancement later.

### Pattern 3: Read-Only Component Mode

**What:** Wrap existing components with read-only props
**When to use:** Reusing wizard components in public view

```typescript
// Example: Public consumption simulator
interface PublicConsumptionSimulatorProps {
  profile: ConsumptionProfile
  onProfileChange: (profile: ConsumptionProfile) => void
  natagareHours: { dayStart: number; dayEnd: number }
}

// Reuses DayChart, MonthTabs with controlled state
```

### Pattern 4: On-Demand Recalculation

Per CONTEXT.md decision: "On-demand recalculation via 'Uppdatera' button (not instant/live)"

```typescript
function PublicView() {
  const [profile, setProfile] = useState(originalProfile)
  const [results, setResults] = useState(originalResults)
  const [isDirty, setIsDirty] = useState(false)

  const handleRecalculate = async () => {
    const newResults = calculateBatteryROI(/* ... */)
    setResults(newResults.results)
    setIsDirty(false)
    // Optionally save as variant
  }

  return (
    <>
      <ConsumptionSimulator value={profile} onChange={(p) => {
        setProfile(p)
        setIsDirty(true)
      }} />
      {isDirty && (
        <button onClick={handleRecalculate}>Uppdatera</button>
      )}
      <ResultsView results={results} />
    </>
  )
}
```

### Anti-Patterns to Avoid
- **Exposing internal pricing:** Public view must NOT show margin, installation cost, or internal pricing (CONTEXT.md: "NO margin, installation cost, or internal pricing")
- **Server roundtrips for each adjustment:** Calculator engine can run client-side
- **Zustand persistence in public view:** Don't persist public adjustments to localStorage

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Share code generation | Sequential IDs, timestamps | nanoid | URL-safe, unguessable, collision-resistant |
| Password hashing | MD5, SHA256 | bcryptjs (already installed) | Industry standard, time-constant comparison |
| Decimal arithmetic | JavaScript floats | decimal.js (already installed) | Financial precision, already configured |
| Chart interactivity | Custom canvas/SVG | Recharts (already installed) | Touch-friendly, tested, responsive |

**Key insight:** The hardest parts (charts, calculations, auth) are already solved. Phase 4 is mostly composition and data flow.

## Common Pitfalls

### Pitfall 1: Exposing Sensitive Pricing Data
**What goes wrong:** Accidentally including margin, cost price, or installation details in public API responses
**Why it happens:** Reusing authenticated fetch functions without filtering
**How to avoid:** Create dedicated public data fetcher that explicitly selects only public-safe fields
**Warning signs:** `costPrice`, `installerCut`, `marginSek` appearing in network responses

### Pitfall 2: Share Code Enumeration
**What goes wrong:** Sequential or predictable share codes allow brute-force access
**Why it happens:** Using auto-increment IDs or timestamp-based codes
**How to avoid:** Use nanoid with default 21 characters (126 bits of entropy)
**Warning signs:** Share codes that look sequential or contain timestamps

### Pitfall 3: Stale Results After Profile Change
**What goes wrong:** UI shows old results while profile has changed
**Why it happens:** Not tracking dirty state between profile and results
**How to avoid:** Clear dirty flag only after successful recalculation
**Warning signs:** Results don't match visible consumption profile

### Pitfall 4: Missing Mobile Touch Targets
**What goes wrong:** Chart interactions fail on mobile devices
**Why it happens:** Click handlers too small, hover states don't translate
**How to avoid:** Use Recharts with adequate cell padding, test on real devices
**Warning signs:** Users report chart doesn't respond to taps

### Pitfall 5: Subdomain SSL Certificate Issues
**What goes wrong:** Wildcard subdomains fail SSL validation in development
**Why it happens:** Local development doesn't support wildcard certs
**How to avoid:** Use path-based routing in development, subdomain in production
**Warning signs:** HTTPS errors on org-slug.localhost

## Code Examples

### Share Code Generation
```typescript
// src/lib/share/generate-code.ts
import { nanoid } from 'nanoid'

/**
 * Generate a secure, URL-friendly share code.
 * Uses 21 characters by default (126 bits of entropy).
 */
export function generateShareCode(): string {
  return nanoid() // e.g., "V1StGXR8_Z5jdHi6B-myT"
}

// For shorter codes (less entropy, more readable):
export function generateShortShareCode(): string {
  return nanoid(12) // e.g., "V1StGXR8_Z5j"
}
```

### Public Calculation Fetch
```typescript
// src/actions/share.ts
'use server'

import { prisma } from '@/lib/db/client'
import bcrypt from 'bcryptjs'

interface PublicCalculationResult {
  calculation: {
    customerName: string
    elomrade: string
    consumptionProfile: { data: number[][] }
    annualConsumptionKwh: number
    results: CalculationResults | null
    batteries: PublicBatteryInfo[]
    customGreeting: string | null
  }
  organization: {
    name: string
    slug: string
    logoUrl: string | null
    primaryColor: string
    secondaryColor: string
  }
  closer: {
    name: string
    phone?: string
  }
}

export async function getPublicCalculation(
  orgSlug: string,
  shareCode: string,
  password?: string
): Promise<{ data?: PublicCalculationResult; error?: string }> {
  const calculation = await prisma.calculation.findFirst({
    where: {
      shareCode,
      organization: { slug: orgSlug },
      status: { not: 'ARCHIVED' },
    },
    include: {
      organization: {
        select: {
          name: true,
          slug: true,
          logoUrl: true,
          primaryColor: true,
          secondaryColor: true,
        },
      },
      batteries: {
        include: {
          batteryConfig: {
            include: { brand: true },
            // Explicitly exclude costPrice
            select: {
              name: true,
              capacityKwh: true,
              maxDischargeKw: true,
              maxChargeKw: true,
              chargeEfficiency: true,
              dischargeEfficiency: true,
              warrantyYears: true,
              guaranteedCycles: true,
              degradationPerYear: true,
              brand: { select: { name: true, logoUrl: true } },
            },
          },
        },
        orderBy: { sortOrder: 'asc' },
      },
      natagare: true,
    },
  })

  if (!calculation) {
    return { error: 'Kalkylen hittades inte' }
  }

  // Check expiration
  if (calculation.shareExpiresAt && calculation.shareExpiresAt < new Date()) {
    return { error: 'Lanken har gatt ut' }
  }

  // Check password
  if (calculation.sharePassword) {
    if (!password) {
      return { error: 'PASSWORD_REQUIRED' }
    }
    const valid = await bcrypt.compare(password, calculation.sharePassword)
    if (!valid) {
      return { error: 'Fel losenord' }
    }
  }

  // Record view (fire-and-forget)
  prisma.calculationView.create({
    data: {
      calculationId: calculation.id,
      userAgent: '', // Set from request headers
    },
  }).catch(() => {}) // Don't fail the request

  return {
    data: {
      calculation: {
        customerName: calculation.customerName,
        // ... other public-safe fields
      },
      organization: calculation.organization,
      closer: { name: 'TODO: Add closer info' },
    },
  }
}
```

### View Tracking
```typescript
// src/actions/share.ts
export async function recordView(
  calculationId: string,
  userAgent: string | null,
  ip: string | null
) {
  // Hash IP for privacy
  const ipHash = ip
    ? createHash('sha256').update(ip).digest('hex').slice(0, 16)
    : null

  await prisma.calculationView.create({
    data: {
      calculationId,
      userAgent,
      ipHash,
    },
  })
}

// Get view stats for closer
export async function getViewStats(calculationId: string) {
  const session = await auth()
  if (!session?.user) return { error: 'Unauthorized' }

  const views = await prisma.calculationView.aggregate({
    where: { calculationId },
    _count: true,
    _max: { viewedAt: true },
  })

  return {
    viewCount: views._count,
    lastViewedAt: views._max.viewedAt,
  }
}
```

### Mobile-Responsive Chart Container
```typescript
// Swipeable month tabs for mobile
export function MobileMonthTabs({ selectedMonth, onSelectMonth, monthTotals }: MonthTabsProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to selected month
  useEffect(() => {
    const button = containerRef.current?.children[selectedMonth]
    button?.scrollIntoView({ behavior: 'smooth', inline: 'center' })
  }, [selectedMonth])

  return (
    <div
      ref={containerRef}
      className="flex overflow-x-auto snap-x snap-mandatory gap-2 pb-2 -mx-4 px-4"
      style={{ scrollbarWidth: 'none' }}
    >
      {MONTHS.map((month, index) => (
        <button
          key={index}
          onClick={() => onSelectMonth(index)}
          className={`snap-center flex-shrink-0 px-4 py-2 rounded-full ${
            selectedMonth === index
              ? 'bg-primary text-white'
              : 'bg-gray-100'
          }`}
        >
          {month}
        </button>
      ))}
    </div>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Sequential share IDs | Cryptographic random IDs (nanoid) | Industry standard since ~2018 | Prevents enumeration attacks |
| Full page reload for recalculation | Client-side calculation | Already implemented | Instant feedback |
| Server-stored sessions for public views | Stateless (no session needed) | Current | Simpler, more scalable |

**Deprecated/outdated:**
- MD5/SHA1 for password hashing: Use bcrypt with cost 12+
- Math.random() for IDs: Use crypto-based generators

## Open Questions

Things resolved by CONTEXT.md decisions:

1. **Live vs on-demand recalculation** - Resolved: On-demand via "Uppdatera" button
2. **Share link format** - Resolved: `[org-slug].kalkyla.se/[random-string]`
3. **What pricing to show** - Resolved: Product cost + extra artiklar only, NO margin/installation
4. **Password protection** - Resolved: Optional, closer can set
5. **View notifications** - Resolved: Configurable per closer (none, first view, every view)

Remaining implementation details (Claude's discretion per CONTEXT.md):
- Exact animation timing for share modal
- Specific chart library configuration for touch interactions
- View history storage schema (proposed above)
- Password hashing approach (use existing bcryptjs with cost 12)
- Exact sticky bar height and transition behavior

## Sources

### Primary (HIGH confidence)
- Local codebase analysis: `prisma/schema.prisma`, `src/lib/calculations/engine.ts`, `src/components/calculations/`
- Phase 3 implementation patterns: Zustand store, Recharts usage, component structure
- CONTEXT.md: User decisions locked for Phase 4

### Secondary (MEDIUM confidence)
- [Next.js Middleware Documentation](https://nextjs.org/docs/14/app/building-your-application/routing/middleware) - Matcher patterns
- [nanoid GitHub](https://github.com/ai/nanoid) - Security features, 126-bit entropy
- [Subdomain Routing Guide](https://medium.com/@sheharyarishfaq/subdomain-based-routing-in-next-js-a-complete-guide-for-multi-tenant-applications-1576244e799a) - Multi-tenant patterns

### Tertiary (LOW confidence)
- WebSearch results for password hashing patterns - verified against existing bcryptjs usage

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already installed and tested
- Existing infrastructure: HIGH - Direct codebase analysis
- Architecture patterns: HIGH - Follows established Next.js patterns
- Pitfalls: MEDIUM - Based on common patterns and CONTEXT.md requirements

**Research date:** 2026-01-20
**Valid until:** 2026-02-20 (30 days - stable stack)
