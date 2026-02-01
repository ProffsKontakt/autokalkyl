# Phase 8: Schema & Migration Foundation - Research

**Researched:** 2026-02-01
**Domain:** Prisma schema extensions, data migration, hardcoded value centralization
**Confidence:** HIGH

## Summary

Phase 8 prepares the data model for v1.2 features while ensuring zero disruption to the 113 existing calculations. The work falls into three distinct areas: (1) adding a HeatingType enum and peak-related fields to the Natagare model, (2) centralizing the hardcoded `currentPeakKw = 8` value scattered across 6+ code locations, and (3) implementing a migration strategy that preserves existing calculation results.

Prisma 7.x (current version) handles schema extensions well, but requires care with enum additions in PostgreSQL. The recommended approach is to use Prisma's `--create-only` flag to generate migration SQL, then manually add data backfill statements before applying. For the hardcoded peak values, the solution is a new constant `DEFAULT_CURRENT_PEAK_KW = 8` in the constants file, with all existing references updated to use it.

**Primary recommendation:** Add schema extensions as nullable fields first, backfill existing calculations with default values via custom SQL in the migration, then make fields required where appropriate. All hardcoded `currentPeakKw = 8` references must be replaced with a centralized constant.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma | ^7.2.0 | ORM and migrations | Already in project, PostgreSQL support |
| @prisma/client | ^7.2.0 | Type-safe database client | Auto-generated types for new fields |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| decimal.js | ^10.x | Financial precision | Already used; peak values need same precision |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Prisma migrate | Raw SQL scripts | More control but lose Prisma's schema sync; not recommended |
| JSON schema versioning | New columns per field | Column approach cleaner for typed fields |

**Installation:**
```bash
# No new packages needed - Prisma already installed
pnpm prisma migrate dev --create-only --name add-v12-schema-extensions
```

## Architecture Patterns

### Recommended Project Structure
```
prisma/
├── schema.prisma        # Add HeatingType enum, Natagare fields
├── migrations/
│   └── YYYYMMDD_add_v12_schema_extensions/
│       └── migration.sql  # Auto-generated + manual backfill
src/lib/calculations/
├── constants.ts         # Add DEFAULT_CURRENT_PEAK_KW
├── types.ts             # currentPeakKw already defined as optional
└── engine.ts            # Uses constant as fallback
```

### Pattern 1: Expand-and-Contract Migration
**What:** Add new fields as nullable first, backfill data, then optionally make required
**When to use:** Adding fields to tables with existing data
**Example:**
```sql
-- Step 1: Add nullable fields (Prisma generates this)
ALTER TABLE "Natagare" ADD COLUMN "peakCalculationMethod" TEXT;
ALTER TABLE "Natagare" ADD COLUMN "nightDiscountPercent" DECIMAL(5,2);

-- Step 2: Backfill with defaults (manual addition)
UPDATE "Natagare" SET "peakCalculationMethod" = 'SIMPLE_MAX' WHERE "peakCalculationMethod" IS NULL;
UPDATE "Natagare" SET "nightDiscountPercent" = 50.00 WHERE "nightDiscountPercent" IS NULL;

-- Step 3: (Optional) Make required in subsequent migration
ALTER TABLE "Natagare" ALTER COLUMN "peakCalculationMethod" SET NOT NULL;
```
**Source:** [Prisma Expand and Contract Pattern](https://www.prisma.io/docs/guides/data-migration)

### Pattern 2: Enum Addition in PostgreSQL
**What:** PostgreSQL enums can have new values appended safely
**When to use:** Adding HeatingType enum with 5 values
**Example:**
```sql
-- Prisma generates this for new enum
CREATE TYPE "HeatingType" AS ENUM ('BERGVARME', 'FJARRVARME', 'DIREKTVERKANDE', 'LUFT_LUFT_VP', 'LUFT_VATTEN_VP');

-- Adding to existing model as nullable field
ALTER TABLE "Calculation" ADD COLUMN "heatingType" "HeatingType";
```
**Source:** [Prisma PostgreSQL Enum Migration](https://github.com/prisma/prisma/discussions/23236)

### Pattern 3: Centralized Configuration Constants
**What:** Replace hardcoded magic numbers with named constants
**When to use:** Value appears in multiple locations (currentPeakKw = 8)
**Example:**
```typescript
// src/lib/calculations/constants.ts
export const DEFAULT_CURRENT_PEAK_KW = 8 // Swedish residential average

// src/lib/calculations/engine.ts
import { DEFAULT_CURRENT_PEAK_KW } from './constants'

// Usage with fallback
const peakKw = inputs.currentPeakKw ?? DEFAULT_CURRENT_PEAK_KW
```

### Anti-Patterns to Avoid
- **Direct ALTER NOT NULL on populated tables:** Use expand-then-contract pattern instead
- **Rollback migrations:** Prisma recommends "roll forward" - add corrective migrations rather than reverting
- **Breaking existing JSON results:** Never modify the structure of stored `results` JSON - add new fields alongside

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Schema version tracking | Custom version field | Prisma migration history | Prisma tracks applied migrations automatically |
| Data backfill | Node script with Prisma Client | SQL in migration file | Runs as single transaction with schema changes |
| Rollback strategy | Custom rollback scripts | Database snapshot before deploy | Down migrations often fail; snapshots are safer |
| Enum value validation | Runtime checks | Prisma schema + TypeScript | Schema defines valid values; TS enforces at compile time |

**Key insight:** Prisma handles schema versioning and migration ordering automatically. The `prisma_migrations` table tracks what's been applied. Don't build parallel tracking.

## Common Pitfalls

### Pitfall 1: Enum Transaction Boundary in PostgreSQL
**What goes wrong:** When adding an enum value AND using it as a default in the same migration, PostgreSQL throws "New enum values must be committed before they can be used"
**Why it happens:** PostgreSQL requires enum additions to be committed before referencing
**How to avoid:** Split into two migrations if setting default to new enum value, OR add enum first, then use in subsequent migration
**Warning signs:** Error message mentioning "unsafe use of new value"
**Source:** [Prisma Issue #8424](https://github.com/prisma/prisma/issues/8424)

### Pitfall 2: JSON Results Schema Drift
**What goes wrong:** Existing calculations have `results` JSON without new fields (heatingType, peakShavingKw). Code that expects these fields crashes.
**Why it happens:** JSON columns don't have schema enforcement
**How to avoid:** Always use optional chaining when reading new fields from existing results: `results?.heatingType ?? null`
**Warning signs:** TypeError when loading old calculations after deploy

### Pitfall 3: Hardcoded Values Left Behind
**What goes wrong:** `currentPeakKw = 8` changed in 5 places but missed in 1, causing admin and public views to show different values
**Why it happens:** Grep can miss complex patterns or comments
**How to avoid:** Create exhaustive audit list BEFORE implementation, verify each location in PR review checklist
**Warning signs:** Peak shaving values differ between wizard and public share view

### Pitfall 4: Natagare Foreign Key During Migration
**What goes wrong:** If natagare table structure changes significantly, existing calculations referencing old IDs may break
**Why it happens:** Foreign key constraints block some migration operations
**How to avoid:** Only ADD columns to Natagare in this phase; restructuring (removing orgId) deferred to Phase 9
**Warning signs:** Migration fails with foreign key constraint error

### Pitfall 5: Missing Dry-Run Verification
**What goes wrong:** Migration runs in production, breaks something, user requested dry-run but it wasn't implemented
**Why it happens:** Rushing to deploy without proper verification step
**How to avoid:** Implement `--dry-run` flag that shows SQL without executing, requires explicit confirmation before production apply
**Warning signs:** User explicitly requested dry-run mode in CONTEXT.md decisions

## Code Examples

Verified patterns from official sources:

### Schema Extension for Natagare
```prisma
// prisma/schema.prisma
// Source: Based on existing schema + Phase 8 requirements

model Natagare {
  id   String @id @default(cuid())
  name String

  // Existing fields...
  dayRateSekKw   Decimal @db.Decimal(10, 4)
  nightRateSekKw Decimal @db.Decimal(10, 4)
  dayStartHour Int @default(6)
  dayEndHour   Int @default(22)
  orgId     String
  isDefault Boolean @default(false)
  isActive  Boolean @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // NEW: Phase 8 - Peak calculation fields
  // How to calculate billing peak from consumption data
  peakCalculationMethod String? @default("SIMPLE_MAX") // Future: enum
  // Discount for night peaks (e.g., 50 = 50% discount for 22-06 peaks)
  nightDiscountPercent  Decimal? @db.Decimal(5, 2) @default(50.00)
  // Night hours for peak discount (may differ from day/night tariff hours)
  peakNightStartHour    Int? @default(22)
  peakNightEndHour      Int? @default(6)

  // Relations...
}
```

### HeatingType Enum Definition
```prisma
// prisma/schema.prisma
// Source: Phase 8 requirements + v1.2 research SUMMARY.md

enum HeatingType {
  BERGVARME       // Ground source heat pump (bergvarme)
  FJARRVARME      // District heating (fjarrvarme)
  DIREKTVERKANDE  // Direct electric heating
  LUFT_LUFT_VP    // Air-to-air heat pump
  LUFT_VATTEN_VP  // Air-to-water heat pump
}
```

### Centralized Peak Constant
```typescript
// src/lib/calculations/constants.ts
// Source: Audit of existing codebase + CONTEXT.md decisions

/**
 * Default current peak power for Swedish residential customers.
 * Used when customer hasn't provided their actual peak value.
 *
 * This value centralizes the previously hardcoded 8 kW references
 * found in multiple components. For NEW calculations, the user
 * must input their peak explicitly (no default pre-filled).
 * For EXISTING calculations, this preserves backward compatibility.
 *
 * @see FIX-03 in REQUIREMENTS.md
 */
export const DEFAULT_CURRENT_PEAK_KW = 8
```

### Migration SQL with Backfill
```sql
-- prisma/migrations/YYYYMMDD_add_v12_schema_extensions/migration.sql
-- Source: Prisma documentation + custom backfill

-- CreateEnum
CREATE TYPE "HeatingType" AS ENUM ('BERGVARME', 'FJARRVARME', 'DIREKTVERKANDE', 'LUFT_LUFT_VP', 'LUFT_VATTEN_VP');

-- AlterTable: Add peak fields to Natagare (nullable first)
ALTER TABLE "Natagare" ADD COLUMN "peakCalculationMethod" TEXT DEFAULT 'SIMPLE_MAX';
ALTER TABLE "Natagare" ADD COLUMN "nightDiscountPercent" DECIMAL(5,2) DEFAULT 50.00;
ALTER TABLE "Natagare" ADD COLUMN "peakNightStartHour" INTEGER DEFAULT 22;
ALTER TABLE "Natagare" ADD COLUMN "peakNightEndHour" INTEGER DEFAULT 6;

-- AlterTable: Add heatingType to Calculation (nullable, existing calcs remain null)
ALTER TABLE "Calculation" ADD COLUMN "heatingType" "HeatingType";

-- Backfill: Ensure all natagare have peak fields
UPDATE "Natagare"
SET "peakCalculationMethod" = 'SIMPLE_MAX',
    "nightDiscountPercent" = 50.00,
    "peakNightStartHour" = 22,
    "peakNightEndHour" = 6
WHERE "peakCalculationMethod" IS NULL;
```

### Dry-Run Migration Script
```typescript
// scripts/migrate-v12.ts
// Source: User requirement from CONTEXT.md

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const dryRun = process.argv.includes('--dry-run')

  // Count affected records
  const natagareCount = await prisma.natagare.count()
  const calculationCount = await prisma.calculation.count()

  console.log('Migration Preview:')
  console.log(`- Natagare records to update: ${natagareCount}`)
  console.log(`- Calculation records (heatingType will be null): ${calculationCount}`)
  console.log('')
  console.log('Changes:')
  console.log('1. Add HeatingType enum with 5 values')
  console.log('2. Add peakCalculationMethod, nightDiscountPercent, peakNightStartHour, peakNightEndHour to Natagare')
  console.log('3. Add heatingType column to Calculation (nullable)')
  console.log('4. Backfill Natagare with default peak settings')

  if (dryRun) {
    console.log('')
    console.log('DRY RUN - No changes applied.')
    console.log('Run without --dry-run to apply migration.')
  } else {
    console.log('')
    console.log('Applying migration...')
    // Prisma migrate runs via CLI, this script is for preview
    console.log('Run: npx prisma migrate deploy')
  }
}

main()
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Rollback migrations | Roll forward (add corrective migration) | Prisma 3.x+ | Safer in production; rollbacks often fail |
| Manual schema versioning | Prisma migration history | Always | `_prisma_migrations` table tracks automatically |
| Enum string columns | Native PostgreSQL enums | PostgreSQL 8.3+ | Type safety at DB level |

**Deprecated/outdated:**
- Down migrations: Prisma recommends against them; database snapshots + roll forward is safer
- `prisma db push` in production: Use `prisma migrate deploy` for production; push is for development only

## Open Questions

Things that couldn't be fully resolved:

1. **Exact default for nightDiscountPercent**
   - What we know: Ellevio uses 50% discount for night peaks (22-06)
   - What's unclear: Other grid operators may use different percentages or no discount
   - Recommendation: Default to 50.00 (Ellevio standard), Super Admin can configure per natagare in Phase 9

2. **Whether to make new Natagare fields required**
   - What we know: Nullable is safer for migration
   - What's unclear: Should peakCalculationMethod be required after backfill?
   - Recommendation: Keep nullable in Phase 8; evaluate in Phase 9 if all natagare have values

## Hardcoded Peak Audit

Complete list of `currentPeakKw = 8` references to replace:

| File | Line | Context | Action |
|------|------|---------|--------|
| `src/components/calculations/wizard/steps/results-step.tsx` | 109 | `currentPeakKw: 8, // TODO` | Replace with `DEFAULT_CURRENT_PEAK_KW` |
| `src/components/calculations/wizard/steps/results-step.tsx` | 190 | `currentPeakKw={8}` | Replace with constant |
| `src/components/calculations/wizard/calculation-wizard.tsx` | 176 | `currentPeakKw: 8, // TODO` | Replace with constant |
| `src/components/public/public-consumption-simulator.tsx` | 153 | `currentPeakKw: 8, // Default` | Replace with constant |
| `src/actions/share.ts` | 458 | Fallback estimation | Keep estimation logic but use constant as secondary fallback |

**Total:** 5 direct hardcoded references + 1 estimation fallback

## Sources

### Primary (HIGH confidence)
- [Prisma Expand and Contract Pattern](https://www.prisma.io/docs/guides/data-migration) - Official data migration guide
- [Prisma Customizing Migrations](https://www.prisma.io/docs/orm/prisma-migrate/workflows/customizing-migrations) - --create-only workflow
- Existing codebase: `prisma/schema.prisma`, `src/lib/calculations/constants.ts`
- `.planning/research/SUMMARY.md` - v1.2 research with heating types and peak methods

### Secondary (MEDIUM confidence)
- [Prisma Generating Down Migrations](https://www.prisma.io/docs/orm/prisma-migrate/workflows/generating-down-migrations) - Roll forward approach rationale
- [Prisma PostgreSQL Enum Issues](https://github.com/prisma/prisma/discussions/23236) - Known enum migration patterns

### Tertiary (LOW confidence)
- None - this phase uses well-documented Prisma patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing Prisma, no new dependencies
- Architecture: HIGH - Follows official Prisma migration patterns
- Pitfalls: HIGH - Based on known Prisma/PostgreSQL issues and codebase audit

**Research date:** 2026-02-01
**Valid until:** 60 days (Prisma patterns are stable)
