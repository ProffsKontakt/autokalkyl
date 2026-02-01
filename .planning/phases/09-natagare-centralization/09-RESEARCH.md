# Phase 9: Natagare Centralization - Research

**Researched:** 2026-02-01
**Domain:** Multi-tenant to global data migration with role-based configuration management
**Confidence:** HIGH

## Summary

This phase migrates org-scoped natagare (grid operators) to global scope with Super Admin configuration management for peak calculation methods and night discounts. The research investigated three critical domains: (1) database migration patterns for moving tenant-scoped data to global scope while maintaining foreign key constraints and backward compatibility, (2) duplicate detection and resolution strategies for multi-tenant consolidation, and (3) role-based UI patterns for configuration management with approval workflows.

The standard approach combines Prisma's schema migration capabilities with the expand-migrate-contract pattern: add new nullable orgId to global natagare, migrate data with duplicate flagging, update foreign keys, and retain backward compatibility through careful constraint management. For UI, the existing pattern in this project (table list view with separate edit pages) should evolve to a list-with-side-panel pattern for efficient configuration management, using Sonner for transient notifications and custom banner components for persistent duplicate alerts.

Swedish grid operators like Ellevio use specific peak calculation methods (e.g., 3 highest peaks averaged, 50% night discount 22:00-06:00) that must be configurable per natagare without code changes. The peak calculation fields added in Phase 8 provide the foundation; Phase 9 extends them with full Super Admin configuration UI and approval workflows for org-requested additions.

**Primary recommendation:** Use Prisma migration with expand-migrate-contract pattern, implement list-with-side-panel UI for configuration, add approval status tracking to schema, and preserve all existing calculation references through nullable orgId transition period.

## Standard Stack

The project uses established libraries for this migration domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma ORM | 7.2.0 | Database schema migration and client | Industry standard for type-safe database migrations in Next.js projects |
| PostgreSQL | (via Neon) | Relational database | Required for foreign key constraints and referential integrity during migration |
| Zod | 4.3.5 | Runtime validation | Ensures data integrity during migration and form validation |
| React Hook Form | 7.71.1 | Form state management | Already used throughout project for configuration forms |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Sonner | 2.0.7 | Toast notifications | Transient success/error messages (already in project) |
| Lucide React | 0.562.0 | Icon library | UI indicators for approval status, warnings (already in project) |
| Tailwind CSS | 4.x | Styling framework | All UI components (already in project) |
| date-fns | 4.1.0 | Date formatting | Timestamp display for approval requests (already in project) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Prisma migrations | Raw SQL migrations | Prisma provides type safety and rollback support; raw SQL offers more control but higher risk |
| List-with-side-panel | Modal dialogs | Side panel keeps context visible while editing; modals are simpler but hide the list |
| Nullable orgId transition | Immediate hard cutover | Nullable allows gradual migration and rollback; hard cutover is faster but riskier |

**Installation:**
All required libraries already installed in project. No new dependencies needed.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── actions/
│   └── natagare.ts              # Extend with global CRUD, approval actions
├── app/(dashboard)/dashboard/
│   ├── natagare/                # Evolve to Super Admin configuration UI
│   └── admin/                   # Super Admin-only dashboard widgets
├── components/
│   ├── natagare/
│   │   ├── natagare-config-panel.tsx  # List-with-side-panel layout
│   │   ├── natagare-duplicate-banner.tsx  # Persistent alert for duplicates
│   │   └── natagare-approval-widget.tsx   # Dashboard pending approvals
│   └── ui/
│       └── alert-banner.tsx     # Reusable banner component
└── lib/
    └── migrations/
        └── natagare-global-migration.ts  # One-time data migration script
```

### Pattern 1: Expand-Migrate-Contract for Schema Changes
**What:** Three-phase migration pattern that maintains backward compatibility
**When to use:** Changing data scoping (org-scoped to global) with existing foreign key relationships
**Example:**
```typescript
// Phase 1: EXPAND - Add nullable orgId, keep existing constraints
// Migration: 20260201_add_global_natagare_support.sql
ALTER TABLE "Natagare" ADD COLUMN "globalScope" BOOLEAN DEFAULT false;
ALTER TABLE "Natagare" ADD COLUMN "approvalStatus" TEXT DEFAULT 'APPROVED';
ALTER TABLE "Natagare" ADD COLUMN "requestedByOrgId" TEXT;
-- orgId remains NOT NULL during expansion

// Phase 2: MIGRATE - Copy data, flag duplicates, update references
// src/lib/migrations/natagare-global-migration.ts
async function migrateNatagareToGlobal() {
  // Get all unique natagare names
  const uniqueNames = await prisma.natagare.groupBy({
    by: ['name'],
    having: { id: { _count: { gt: 1 } } }
  });

  // Flag duplicates for manual review
  for (const { name } of uniqueNames) {
    await prisma.natagare.updateMany({
      where: { name, globalScope: false },
      data: { approvalStatus: 'DUPLICATE_REVIEW_NEEDED' }
    });
  }

  // Migrate non-duplicates to global
  await prisma.natagare.updateMany({
    where: { approvalStatus: 'APPROVED' },
    data: { globalScope: true }
  });
}

// Phase 3: CONTRACT - After migration verified, make orgId nullable
// Migration: 20260215_finalize_global_natagare.sql
ALTER TABLE "Natagare" ALTER COLUMN "orgId" DROP NOT NULL;
-- Update constraint to allow null orgId for global records
```

### Pattern 2: List-with-Side-Panel Configuration UI
**What:** Master-detail layout with list on left, configuration panel on right
**When to use:** Managing multiple configuration records where context switching is frequent
**Example:**
```typescript
// components/natagare/natagare-config-panel.tsx
'use client';

export function NatagareConfigPanel({ natagare, userRole }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = natagare.find(n => n.id === selectedId);

  return (
    <div className="flex h-[calc(100vh-200px)]">
      {/* List (40% width) */}
      <div className="w-2/5 border-r overflow-y-auto">
        {natagare.map(n => (
          <button
            key={n.id}
            onClick={() => setSelectedId(n.id)}
            className={cn(
              "w-full px-4 py-3 text-left hover:bg-gray-50",
              selectedId === n.id && "bg-blue-50 border-l-4 border-blue-600"
            )}
          >
            <div className="font-medium">{n.name}</div>
            {n.approvalStatus === 'PENDING' && (
              <Badge variant="warning">Pending Approval</Badge>
            )}
          </button>
        ))}
      </div>

      {/* Detail panel (60% width) */}
      <div className="w-3/5 p-6 overflow-y-auto">
        {selected ? (
          <NatagareEditForm natagare={selected} userRole={userRole} />
        ) : (
          <EmptyState message="Select a natagare to view details" />
        )}
      </div>
    </div>
  );
}
```

### Pattern 3: Approval Workflow State Machine
**What:** Status-based workflow for org-requested additions
**When to use:** Multi-role systems where lower-privilege users request, higher-privilege approve
**Example:**
```typescript
// Approval states
enum ApprovalStatus {
  APPROVED = 'APPROVED',           // Global, visible to all
  PENDING = 'PENDING',             // Org-only, awaiting Super Admin approval
  REJECTED = 'REJECTED',           // Org-only, rejected by Super Admin
  DUPLICATE_REVIEW = 'DUPLICATE_REVIEW'  // Migration flagged duplicate
}

// State transitions
const APPROVAL_TRANSITIONS = {
  PENDING: ['APPROVED', 'REJECTED'],
  REJECTED: ['PENDING'],  // Org Admin can resubmit
  DUPLICATE_REVIEW: ['APPROVED', 'REJECTED'],
  APPROVED: []  // Terminal state
};

// Action example
export async function approveNatagare(id: string) {
  const natagare = await prisma.natagare.findUnique({ where: { id } });

  if (!APPROVAL_TRANSITIONS[natagare.approvalStatus].includes('APPROVED')) {
    return { error: 'Invalid state transition' };
  }

  await prisma.natagare.update({
    where: { id },
    data: {
      approvalStatus: 'APPROVED',
      globalScope: true,
      orgId: null,  // Now global
      approvedAt: new Date(),
      approvedByUserId: session.user.id
    }
  });
}
```

### Pattern 4: Peak Configuration Flexibility
**What:** Store peak calculation method as JSON config for operator-specific rules
**When to use:** Business logic that varies by grid operator and changes over time
**Example:**
```typescript
// Schema field (already added in Phase 8)
model Natagare {
  peakCalculationMethod String? @default("SIMPLE_MAX")
  // Store as JSON for flexibility
}

// Type-safe config structure
type PeakMethodConfig = {
  method: 'SIMPLE_MAX' | 'N_PEAK_AVERAGE' | 'SEASONAL_PEAK';
  params?: {
    numPeaks?: number;        // Ellevio: 3
    avgPeriod?: 'month' | 'quarter' | 'winter';  // Vattenfall: winter
    minThreshold?: number;    // Floor value
    maxThreshold?: number;    // Ceiling value
    excludeWeekends?: boolean;
    timeWindows?: { start: number; end: number }[];
  };
};

// UI config form
function PeakMethodConfigForm({ config, onChange }) {
  const method = config.method;

  return (
    <div>
      <Select value={method} onChange={e => onChange({ method: e.target.value })}>
        <option value="SIMPLE_MAX">Simple Max Peak</option>
        <option value="N_PEAK_AVERAGE">N-Peak Average (Ellevio)</option>
        <option value="SEASONAL_PEAK">Seasonal Peak (Vattenfall)</option>
      </Select>

      {method === 'N_PEAK_AVERAGE' && (
        <Input
          label="Number of peaks to average"
          type="number"
          value={config.params?.numPeaks || 3}
          onChange={e => onChange({
            ...config,
            params: { ...config.params, numPeaks: parseInt(e.target.value) }
          })}
        />
      )}

      {/* Additional conditional fields based on method */}
    </div>
  );
}
```

### Anti-Patterns to Avoid

- **Immediate hard cutover without transition period:** Causes calculation references to break if natagare IDs change. Use nullable orgId transition period instead.
- **Automatic duplicate merging:** Different orgs may have same-named natagare with different configurations. Flag for manual Super Admin review.
- **Modal dialogs for configuration:** Hides the natagare list context while editing. Use side panel to keep both visible.
- **Enum for peak calculation methods:** Requires schema migration for each new operator method. Use string field with JSON config for flexibility.
- **Deleting org-scoped natagare on migration:** Breaks foreign key references from existing calculations. Migrate data, preserve references.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form validation | Manual field checking | Zod schemas (already in project) | Handles edge cases (nulls, type coercion, nested validation) |
| Toast notifications | Custom div positioning | Sonner (already in project) | Manages queue, animations, accessibility, mobile support |
| Duplicate detection | String comparison loops | Prisma groupBy with HAVING | Database-level aggregation is faster, handles collation correctly |
| Migration rollback | Manual SQL scripts | Prisma migrate down pattern | Type-safe, version controlled, tested |
| Role permission checks | Inline if statements | hasPermission() utility (already exists) | Centralized, auditable, testable |
| Date formatting | new Date().toLocalString() | date-fns (already in project) | Handles Swedish locale, timezone edge cases |

**Key insight:** Database migrations are high-risk operations. Use established ORM patterns (Prisma) with built-in rollback rather than custom SQL scripts that lack type safety and testing.

## Common Pitfalls

### Pitfall 1: Foreign Key Constraint Violations During Migration
**What goes wrong:** Migrating natagare to new IDs breaks existing Calculation.natagareId references, causing FK constraint violations.
**Why it happens:** Attempting to delete or change primary keys without updating all dependent records first.
**How to avoid:** Use expand-migrate-contract pattern. Keep existing records and IDs, add globalScope flag instead of creating new records. Update foreign key constraints to allow NULL orgId before making orgId nullable.
**Warning signs:** Migration script fails with "violates foreign key constraint" errors.

### Pitfall 2: Duplicate Natagare Name Conflicts
**What goes wrong:** Multiple orgs have "Ellevio" with different rates. Automatic merge uses wrong configuration for some calculations.
**Why it happens:** Natagare name alone doesn't guarantee identical configuration across orgs.
**How to avoid:** Flag duplicates with approvalStatus = 'DUPLICATE_REVIEW_NEEDED', show banner in Super Admin UI, require manual review and merge decision. Compare all fields (rates, hours, peak config) to determine if truly duplicates.
**Warning signs:** Org Admins report incorrect tariff rates after migration.

### Pitfall 3: Backward Compatibility Break for Existing Calculations
**What goes wrong:** Old calculations reference org-scoped natagare that no longer exist, causing calculation display to fail.
**Why it happens:** Migration deletes org-scoped records or changes IDs without preserving references.
**How to avoid:** Retain org-scoped records during transition, make orgId nullable only AFTER verifying all calculations point to valid natagare. Use database triggers or application-level checks to prevent orphaned references.
**Warning signs:** Public calculation pages show "Natagare not found" errors.

### Pitfall 4: Race Condition in Approval Status Updates
**What goes wrong:** Org Admin adds natagare while Super Admin approves duplicate, leading to duplicate approvals or lost requests.
**Why it happens:** No optimistic locking on approval status changes.
**How to avoid:** Use Prisma's @updatedAt timestamp with version checking, or database-level SELECT FOR UPDATE in approval transactions. Show error if approval record was modified since user loaded the page.
**Warning signs:** Super Admin sees approved natagare reappear in pending queue.

### Pitfall 5: Missing Index on approvalStatus
**What goes wrong:** Super Admin dashboard loads slowly when fetching pending approvals as natagare table grows.
**Why it happens:** Querying WHERE approvalStatus = 'PENDING' without index requires full table scan.
**How to avoid:** Add database index on approvalStatus field in migration. Use Prisma @@index([approvalStatus]) in schema.
**Warning signs:** Dashboard pending count query takes >100ms with 50+ natagare records.

## Code Examples

Verified patterns from codebase and best practices:

### Migration Script: Flag Duplicates
```typescript
// prisma/migrations/20260201_migrate_natagare_to_global.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting natagare global migration...');

  // Step 1: Find all natagare names that exist in multiple orgs
  const duplicateNames = await prisma.$queryRaw<{ name: string; orgCount: bigint }[]>`
    SELECT name, COUNT(DISTINCT "orgId") as "orgCount"
    FROM "Natagare"
    GROUP BY name
    HAVING COUNT(DISTINCT "orgId") > 1
  `;

  console.log(`Found ${duplicateNames.length} natagare names with duplicates`);

  // Step 2: Flag duplicates for manual review
  for (const { name } of duplicateNames) {
    await prisma.natagare.updateMany({
      where: { name },
      data: { approvalStatus: 'DUPLICATE_REVIEW_NEEDED' }
    });
  }

  // Step 3: Migrate non-duplicates to global scope
  const uniqueNatagare = await prisma.natagare.findMany({
    where: {
      approvalStatus: { not: 'DUPLICATE_REVIEW_NEEDED' }
    },
    distinct: ['name']
  });

  for (const natagare of uniqueNatagare) {
    await prisma.natagare.update({
      where: { id: natagare.id },
      data: {
        globalScope: true,
        approvalStatus: 'APPROVED'
      }
    });
  }

  console.log(`Migrated ${uniqueNatagare.length} natagare to global scope`);
  console.log('Migration complete. Review duplicates in Super Admin dashboard.');
}

main()
  .catch(e => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

### Server Action: Approve Natagare Request
```typescript
// src/actions/natagare.ts (extend existing file)
export async function approveNatagareRequest(id: string, decision: 'APPROVED' | 'REJECTED') {
  const session = await auth();
  if (!session?.user) {
    return { error: 'Not authenticated' };
  }

  const role = session.user.role as Role;
  if (role !== 'SUPER_ADMIN') {
    return { error: 'Only Super Admin can approve natagare requests' };
  }

  const natagare = await prisma.natagare.findUnique({
    where: { id },
    include: { organization: true }
  });

  if (!natagare) {
    return { error: 'Natagare not found' };
  }

  if (natagare.approvalStatus !== 'PENDING' && natagare.approvalStatus !== 'DUPLICATE_REVIEW_NEEDED') {
    return { error: 'Natagare is not pending approval' };
  }

  await prisma.natagare.update({
    where: { id },
    data: {
      approvalStatus: decision,
      globalScope: decision === 'APPROVED',
      orgId: decision === 'APPROVED' ? null : natagare.orgId,  // Global if approved
      approvedAt: decision === 'APPROVED' ? new Date() : null,
      approvedByUserId: decision === 'APPROVED' ? session.user.id : null
    }
  });

  revalidatePath('/dashboard/admin');
  revalidatePath('/dashboard/natagare');

  return { success: true };
}
```

### Component: Duplicate Banner Alert
```typescript
// src/components/natagare/natagare-duplicate-banner.tsx
'use client';

import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface DuplicateBannerProps {
  duplicateCount: number;
}

export function NatagareDuplicateBanner({ duplicateCount }: DuplicateBannerProps) {
  if (duplicateCount === 0) return null;

  return (
    <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-md">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-yellow-900">
            {duplicateCount} Duplicate Natagare Detected
          </h3>
          <p className="mt-1 text-sm text-yellow-800">
            Multiple organizations have natagare with the same name but different configurations.
            Review and resolve these duplicates to ensure accurate calculations.
          </p>
          <Link
            href="/dashboard/admin/natagare/duplicates"
            className="mt-3 inline-flex items-center text-sm font-medium text-yellow-900 hover:text-yellow-700"
          >
            Review Duplicates →
          </Link>
        </div>
      </div>
    </div>
  );
}
```

### Component: Approval Widget for Dashboard
```typescript
// src/components/natagare/natagare-approval-widget.tsx
'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';

interface ApprovalWidgetProps {
  pendingNatagare: Array<{
    id: string;
    name: string;
    requestedByOrg: { name: string };
    createdAt: Date;
  }>;
}

export function NatagareApprovalWidget({ pendingNatagare }: ApprovalWidgetProps) {
  if (pendingNatagare.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Pending Natagare Approvals</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">No pending approvals</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          Pending Natagare Approvals
          <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-blue-600 rounded-full">
            {pendingNatagare.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {pendingNatagare.map(natagare => (
            <li key={natagare.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
              <Clock className="w-4 h-4 text-gray-400 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{natagare.name}</p>
                <p className="text-xs text-gray-500">
                  {natagare.requestedByOrg.name} •{' '}
                  {formatDistanceToNow(natagare.createdAt, { locale: sv, addSuffix: true })}
                </p>
              </div>
              <Button size="sm" variant="outline" asChild>
                <a href={`/dashboard/admin/natagare/approve/${natagare.id}`}>
                  Review
                </a>
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Org-scoped natagare with manual seeding per org | Global natagare with Super Admin configuration | Phase 9 (v1.2) | Reduces duplication, centralizes Swedish operator data, enables operator-specific peak calculation methods |
| Hardcoded peak calculation logic | Configurable peak method per natagare | Phase 8-9 (v1.2) | Supports Ellevio (3-peak avg), Vattenfall (5-peak winter), future operators without code changes |
| Table list with separate edit pages | List-with-side-panel configuration UI | Phase 9 (new pattern) | Faster configuration switching, better UX for managing multiple natagare |
| Direct Org Admin edit access | Approval workflow for global additions | Phase 9 (new pattern) | Maintains data quality, prevents conflicting configurations, Super Admin gatekeeping |

**Deprecated/outdated:**
- **Direct org-scoped CRUD for natagare:** Phase 9 replaces with global scope and approval workflow. Org Admins can still add (org-only until approved), not directly edit global.
- **isDefault flag for seeded natagare:** Becomes obsolete; globalScope + approvalStatus = 'APPROVED' indicates canonical natagare. Migration should set isDefault=false for all after migration complete.

## Open Questions

Things that couldn't be fully resolved:

1. **Closer request flow when natagare missing**
   - What we know: CONTEXT.md specifies Closer requests → Org Admin handles → Super Admin approves for global
   - What's unclear: Should Closer see a "request natagare" button in calculation form, or should they message Org Admin externally?
   - Recommendation: Add "Request Missing Natagare" link in calculation form that creates a request record (not full natagare) visible to Org Admin. Keeps workflow in-app rather than external communication.

2. **Whether Closer can proceed with calculation while natagare request pending**
   - What we know: Missing natagare blocks calculation completion
   - What's unclear: Should Closer be able to save draft with placeholder, or must wait for natagare approval?
   - Recommendation: Allow draft save with NULL natagareId, show warning "Calculation incomplete - natagare pending approval". Prevents blocking Closer's workflow.

3. **Notification approach when requested natagare becomes available**
   - What we know: Closers need to know when natagare is approved so they can complete calculation
   - What's unclear: Email notification, in-app notification badge, or passive discovery?
   - Recommendation: In-app notification badge on calculations list ("1 calculation can now be completed"). Email notification adds complexity (N8N webhook, email templates). Start with in-app, add email in Phase 13 if needed.

4. **Duplicate resolution criteria**
   - What we know: Super Admin resolves duplicates manually
   - What's unclear: Should system suggest "likely duplicates" vs "configure separately" based on config similarity?
   - Recommendation: Show side-by-side comparison of all fields (rates, hours, peak config) for duplicate natagare. Let Super Admin decide. Auto-merge if ALL fields identical (exact match), otherwise require explicit merge decision.

5. **Backward compatibility for org-scoped natagare references**
   - What we know: Existing calculations reference natagare by ID
   - What's unclear: After migration, do old org-scoped natagare IDs remain valid, or do they get remapped to global IDs?
   - Recommendation: Preserve original IDs. Don't create new records. Set globalScope=true and orgId=null on existing records. Foreign keys remain valid, no calculation updates needed.

## Sources

### Primary (HIGH confidence)
- Prisma schema.prisma (local codebase) - Current natagare model with peak calculation fields from Phase 8
- package.json (local codebase) - Confirmed Prisma 7.2.0, Next.js 16.1.3, React 19.2.3, Sonner 2.0.7
- src/actions/natagare.ts (local codebase) - Existing CRUD patterns and permission checks
- src/lib/auth/permissions.ts (local codebase) - Role-based access control (SUPER_ADMIN, ORG_ADMIN, CLOSER)
- [Ellevio peak calculation method](https://sourceful.energy/blog/how-stockholm-homeowners-are-saving-2-925-kr-per-year-on-peak-demand-fees) - Confirmed 3-peak average, 50% night discount 22:00-06:00, SEK 81.25/kW
- [Swedish grid operators peak tariff regulation](https://ei.se/download/18.226ac6e0198bb6d7eda22e5/1755676337482/CIRED-2025-Paper-257-The-Swedish-regulation-on-designing-network-tariffs-for-an-efficient-utilization-of-the-power-grid.pdf) - All operators must implement power tariffs by Dec 31, 2026

### Secondary (MEDIUM confidence)
- [Backward compatible database migrations](https://planetscale.com/blog/backward-compatible-databases-changes) - Expand-migrate-contract pattern verified by multiple sources
- [Database migration patterns](https://medium.com/@jaredhatfield/database-migration-patterns-6b5ede23d06e) - Foreign key constraint handling during migrations
- [Data migration best practices 2026](https://medium.com/@kanerika/data-migration-best-practices-your-ultimate-guide-for-2026-7cbd5594d92e) - Duplicate detection via profiling, deduplication during migration
- [Next.js request access approval system](https://dev.to/arindam_1729/how-to-build-a-request-access-approval-system-using-nextjs-p3p) - Approval workflow patterns with pending status
- [React sidebar patterns 2026](https://medium.com/@rivainasution/shadcn-ui-react-series-part-11-sidebar-architecting-a-scalable-sidebar-system-in-react-f45274043863) - List-with-side-panel layout patterns

### Tertiary (LOW confidence)
- [Prisma multi-tenant migration discussions](https://github.com/prisma/prisma/discussions/24784) - Community patterns, not official docs
- WebSearch results on admin dashboard templates - General UI patterns, not specific to approval workflows

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified in package.json, no new dependencies needed
- Architecture: HIGH - Patterns based on existing codebase (natagare-list.tsx, permissions.ts) and verified expand-migrate-contract sources
- Pitfalls: HIGH - Based on official Prisma migration docs and backward compatibility best practices
- Swedish operator methods: HIGH - Verified from Ellevio official sources and Swedish regulatory documents
- Approval workflow UI: MEDIUM - Pattern extrapolated from existing project conventions, not implemented yet

**Research date:** 2026-02-01
**Valid until:** 2026-03-01 (30 days - stable domain, Swedish regulatory deadline Dec 2026 confirmed)
