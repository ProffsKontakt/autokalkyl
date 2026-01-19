# Phase 2: Reference Data - Research

**Researched:** 2026-01-19
**Domain:** Battery configuration, grid operators (natagare), electricity pricing, tenant-scoped CRUD
**Confidence:** HIGH

## Summary

This research covers Phase 2: Reference Data, where Org Admins configure batteries, grid operators (natagare), and the system stores electricity pricing for ROI calculations. The domain knowledge comes from the validated Excel spreadsheet and Swedish energy market research.

**Key findings:**
- Battery specifications from the Excel: capacity, charge/discharge rates, efficiencies (95% charge, 97% discharge), warranty years, guaranteed cycles, degradation rate per year, and cost price
- Swedish effekttariff (power tariff) structure: day/night rates based on average of top 3 peaks per month, with Ellevio as reference (81.25 SEK/kW day, half rate at night 22:00-06:00)
- Electricity pricing: Multiple API options exist - mgrey.se (free, simple), nordpool npm package (free, unofficial), ENTSO-E (free with registration). Quarterly averages needed for closers.
- Tenant scoping pattern from Phase 1: extend `createTenantClient()` with new models, use same RBAC pattern

**Primary recommendation:** Use the established Phase 1 patterns for CRUD operations. Battery and natagare are org-scoped. Electricity prices are global (shared across all orgs). Start with mgrey.se API for simplicity with fallback to manual entry.

## Domain Knowledge

### Battery Specifications (from validated Excel)

The Excel spreadsheet "Batterikalkyl _ Emaldo Power Store - Myren 150" defines these battery fields:

| Field | Swedish Name | Example Value | Unit | Notes |
|-------|--------------|---------------|------|-------|
| Capacity | Batteristorlek | 15.36 | kWh | Total usable capacity |
| Max Discharge Power | Maxeffekt urladdning | 10.24 | kW | Peak discharge rate |
| Max Charge Power | Maxeffekt laddning | 10.24 | kW | Peak charge rate |
| Charge Efficiency | Laddningseffektivitet | 95 | % | Energy retained during charge |
| Discharge Efficiency | Urladdningseffektivitet | 97 | % | Energy retained during discharge |
| Warranty Years | Garanterad livslangd | 10 | years | Warranty period |
| Guaranteed Cycles | Garanterade cykler | 6000 | cycles | Cycles under warranty |
| Degradation Rate | Degradering per ar | 2 | %/year | Annual capacity loss |

**Additional fields needed for calculation:**
- Cost price (inkopspris) - for margin calculations
- Extension cabinet flag - indicates if unit is expansion module
- New stack flag - indicates brand new vs refurbished

**LiFePO4 efficiency reference:**
- Typical round-trip efficiency: 90-98%
- Excel uses 95% charge, 97% discharge (~92% round-trip)
- This is conservative and realistic for real-world conditions

### Battery Brand/Configuration Hierarchy

Based on requirements, the structure should be:
```
BatteryBrand (e.g., "Emaldo")
  └── BatteryConfig (e.g., "Power Store 15.36 kWh")
        - All specs above
        - isExtensionCabinet: boolean
        - isNewStack: boolean
        - costPrice: Decimal
```

This allows organizations to:
1. Group configurations by brand for UI organization
2. Have multiple configurations per brand (different sizes)
3. Mark extension cabinets separately from base units

### Natagare (Grid Operators) - Swedish Effekttariff

**What is effekttariff?**
Effekttariff (power tariff) charges based on peak power usage, not just energy consumption. It encourages customers to spread usage and avoid peaks.

**How it works (Ellevio model):**
1. Grid operator measures hourly power consumption
2. Takes average of customer's 3 highest peaks per month
3. Multiplies by rate (SEK/kW) for quarterly billing
4. Day rate applies 06:00-22:00, night rate (half price) applies 22:00-06:00

**Ellevio rates (2025 reference):**
- Day rate: 81.25 SEK/kW (06:00-22:00)
- Night rate: 40.625 SEK/kW (22:00-06:00) - half of day rate
- Fixed monthly fee: 365 SEK (not used in our calculations)

**Key natagare in Sweden:**
| Grid Operator | Coverage | Notes |
|---------------|----------|-------|
| Ellevio | Stockholm, 1M+ customers | First with effekttariff (Jan 2025) |
| Vattenfall Eldistribution | 60 municipalities | Effekttariff by Jan 2027 |
| E.ON Energidistribution | Southern Sweden | Rates vary by region |

**Data model for natagare:**
```
Natagare
  - name: string (e.g., "Ellevio")
  - dayRate: Decimal (SEK/kW)
  - nightRate: Decimal (SEK/kW)
  - dayStartHour: int (e.g., 6 for 06:00)
  - dayEndHour: int (e.g., 22 for 22:00)
  - orgId: string (tenant scoped)
```

**From Excel calculation:**
The Excel shows quarterly billing where:
- Current peaks (without battery): ~10 kW average
- With battery peaks: ~6 kW average (40% reduction)
- Savings: 4,054 SEK/year on effekttariff alone

### Electricity Pricing - Swedish Spot Market

**Swedish elomraden (price areas):**
| Area | Region | Typical Price Pattern |
|------|--------|----------------------|
| SE1 | Norra Sverige (Lulea) | Lowest prices, hydro power |
| SE2 | Mellersta norra (Sundsvall) | Low prices |
| SE3 | Mellersta sodra (Stockholm) | Medium prices |
| SE4 | Sodra (Malmo) | Highest prices, import dependent |

**Price variation from Excel:**
- Day spot price (average): 1.4 SEK/kWh
- Night spot price (average): 0.3 SEK/kWh
- Price difference enables arbitrage savings

**What closers need to see:**
- Quarterly average prices per elomrade (last 3 months)
- Used to estimate annual savings from spot price optimization
- Historical prices needed for accurate ROI projections

## Electricity Pricing API Options

### Option 1: mgrey.se API (RECOMMENDED)

**Confidence:** HIGH - Simple, free, Swedish-focused

```typescript
// Endpoint for current hour
const response = await fetch('https://mgrey.se/espot?format=json');

// Endpoint for specific date
const response = await fetch('https://mgrey.se/espot?format=json&date=2025-01-15');
```

**Response format:**
```json
{
  "date": "2025-01-15",
  "SE1": [
    { "hour": 0, "price_sek": 45.2, "price_eur": 4.1, "kmeans": 0 },
    { "hour": 1, "price_sek": 42.1, "price_eur": 3.8, "kmeans": 0 },
    // ... 24 hours
  ],
  "SE2": [...],
  "SE3": [...],
  "SE4": [...]
}
```

**Key details:**
- price_sek is in ore/kWh (divide by 100 for SEK/kWh)
- Historical data from 2022-09-01
- No authentication required
- No documented rate limits (use responsibly)

**Pros:**
- Free, no registration
- Simple JSON API
- Swedish-focused, includes all SE1-SE4
- Pre-calculated price categories (kmeans)

**Cons:**
- Third-party, not official Nord Pool
- No SLA or uptime guarantee
- Limited to day-ahead prices

### Option 2: nordpool npm package

**Confidence:** MEDIUM - Unofficial but widely used

```typescript
import { Prices } from 'nordpool';

const prices = new Prices();
const results = await prices.hourly({
  area: 'SE3',
  currency: 'SEK',
  date: '2025-01-15'
});

// Returns array of { area, date, value } objects
// value is in SEK/MWh (divide by 1000 for SEK/kWh)
```

**Pros:**
- npm package, easy to integrate
- Supports all Nordic areas
- Historical data (2 calendar years)

**Cons:**
- Unofficial scraper of Nord Pool website
- May break if Nord Pool changes their site
- Terms of service concerns noted in README

### Option 3: ENTSO-E Transparency Platform

**Confidence:** MEDIUM - Official but requires registration

```
Base URL: https://transparency.entsoe.eu/api
Requires: API key (free, request via email)
```

**Pros:**
- Official European grid data
- Free API access
- Comprehensive historical data

**Cons:**
- Registration required
- More complex API
- Need to map Swedish area codes

### Option 4: Manual Entry Fallback

**Always implement** as fallback for:
- API downtime
- Missing historical data
- Bulk import from other sources

**Recommendation:** Start with mgrey.se for simplicity. Implement manual entry fallback. Consider ENTSO-E later for reliability.

## Technical Patterns (from Phase 1)

### Server Action Pattern

From `src/actions/organizations.ts`:

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/db/client';
import { auth } from '@/lib/auth/auth';
import { hasPermission, PERMISSIONS, Role } from '@/lib/auth/permissions';

const batteryConfigSchema = z.object({
  brandId: z.string().cuid(),
  name: z.string().min(2).max(100),
  capacityKwh: z.number().positive(),
  maxDischargekW: z.number().positive(),
  maxChargeKw: z.number().positive(),
  chargeEfficiency: z.number().min(0).max(100),
  dischargeEfficiency: z.number().min(0).max(100),
  warrantyYears: z.number().int().positive(),
  guaranteedCycles: z.number().int().positive(),
  degradationPerYear: z.number().min(0).max(100),
  costPrice: z.number().min(0),
  isExtensionCabinet: z.boolean().default(false),
  isNewStack: z.boolean().default(true),
});

export async function createBatteryConfig(data: BatteryConfigFormData) {
  // 1. Auth check
  const session = await auth();
  if (!session?.user) {
    return { error: 'Ej inloggad' };
  }

  // 2. Permission check (new permission needed)
  if (!hasPermission(session.user.role as Role, PERMISSIONS.BATTERY_CREATE)) {
    return { error: 'Du har inte behorighet' };
  }

  // 3. Validation
  const parsed = batteryConfigSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  // 4. Create with tenant scoping
  const tenantDb = createTenantClient(session.user.orgId!);
  try {
    const config = await tenantDb.batteryConfig.create({
      data: parsed.data,
    });

    revalidatePath('/dashboard/batteries');
    return { success: true, configId: config.id };
  } catch (error) {
    return { error: 'Kunde inte skapa batterikonfiguration' };
  }
}
```

### Form Pattern

From `src/components/organizations/org-form.tsx`:

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

// Same schema as server action (or import shared)
const configSchema = z.object({
  // ... fields
});

interface ConfigFormProps {
  config?: ExistingConfig; // For edit mode
  brands: BatteryBrand[]; // For dropdown
}

export function BatteryConfigForm({ config, brands }: ConfigFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const isEditing = !!config;

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(configSchema),
    defaultValues: config ? { /* map existing */ } : { /* defaults */ },
  });

  const onSubmit = (data) => {
    setError(null);
    startTransition(async () => {
      const result = isEditing
        ? await updateBatteryConfig(config.id, data)
        : await createBatteryConfig(data);

      if (result.error) {
        setError(result.error);
      } else {
        router.push('/dashboard/batteries');
        router.refresh();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Form fields */}
    </form>
  );
}
```

### Tenant Scoping Extension

From `src/lib/db/tenant-client.ts`, add new models:

```typescript
export function createTenantClient(orgId: string) {
  return prisma.$extends({
    query: {
      user: { /* existing */ },

      // Add battery brand scoping
      batteryBrand: {
        async $allOperations({ args, query, operation }) {
          if (['findMany', 'findFirst', 'count'].includes(operation)) {
            args.where = { ...args.where, orgId };
          }
          if (operation === 'create') {
            args.data = { ...args.data, orgId };
          }
          if (['update', 'updateMany', 'delete', 'deleteMany'].includes(operation)) {
            args.where = { ...args.where, orgId };
          }
          return query(args);
        },
      },

      // Add battery config scoping
      batteryConfig: {
        async $allOperations({ args, query, operation }) {
          // Same pattern as above
        },
      },

      // Add natagare scoping
      natagare: {
        async $allOperations({ args, query, operation }) {
          // Same pattern as above
        },
      },

      // NOTE: ElectricityPrice is NOT tenant-scoped (global data)
    },
  });
}
```

### Permissions to Add

From `src/lib/auth/permissions.ts`:

```typescript
export const PERMISSIONS = {
  // ... existing permissions

  // Battery permissions
  BATTERY_CREATE: 'battery:create',
  BATTERY_EDIT: 'battery:edit',
  BATTERY_DELETE: 'battery:delete',
  BATTERY_VIEW: 'battery:view',

  // Natagare permissions
  NATAGARE_CREATE: 'natagare:create',
  NATAGARE_EDIT: 'natagare:edit',
  NATAGARE_DELETE: 'natagare:delete',
  NATAGARE_VIEW: 'natagare:view',

  // Electricity pricing (read-only for non-admins)
  ELPRICES_VIEW: 'elprices:view',
  ELPRICES_MANAGE: 'elprices:manage', // Super Admin only - manual entry
} as const;

// Update role permissions
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SUPER_ADMIN: Object.values(PERMISSIONS),
  ORG_ADMIN: [
    // ... existing
    PERMISSIONS.BATTERY_CREATE,
    PERMISSIONS.BATTERY_EDIT,
    PERMISSIONS.BATTERY_DELETE,
    PERMISSIONS.BATTERY_VIEW,
    PERMISSIONS.NATAGARE_CREATE,
    PERMISSIONS.NATAGARE_EDIT,
    PERMISSIONS.NATAGARE_DELETE,
    PERMISSIONS.NATAGARE_VIEW,
    PERMISSIONS.ELPRICES_VIEW,
  ],
  CLOSER: [
    // ... existing
    PERMISSIONS.BATTERY_VIEW,
    PERMISSIONS.NATAGARE_VIEW,
    PERMISSIONS.ELPRICES_VIEW,
  ],
};
```

## Schema Design Recommendations

### Prisma Schema Additions

```prisma
// =============================================================================
// BATTERY CONFIGURATION
// =============================================================================

model BatteryBrand {
  id        String   @id @default(cuid())
  name      String   // e.g., "Emaldo", "Tesla", "BYD"
  logoUrl   String?
  orgId     String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  organization Organization   @relation(fields: [orgId], references: [id], onDelete: Cascade)
  configs      BatteryConfig[]

  @@unique([orgId, name]) // No duplicate brand names per org
  @@index([orgId])
}

model BatteryConfig {
  id                   String   @id @default(cuid())
  name                 String   // e.g., "Power Store 15.36 kWh"
  brandId              String
  orgId                String

  // Core specs
  capacityKwh          Decimal  @db.Decimal(10, 2) // e.g., 15.36
  maxDischargeKw       Decimal  @db.Decimal(10, 2) // e.g., 10.24
  maxChargeKw          Decimal  @db.Decimal(10, 2) // e.g., 10.24
  chargeEfficiency     Decimal  @db.Decimal(5, 2)  // e.g., 95.00 (%)
  dischargeEfficiency  Decimal  @db.Decimal(5, 2)  // e.g., 97.00 (%)

  // Warranty & lifecycle
  warrantyYears        Int      // e.g., 10
  guaranteedCycles     Int      // e.g., 6000
  degradationPerYear   Decimal  @db.Decimal(5, 2)  // e.g., 2.00 (%)

  // Pricing
  costPrice            Decimal  @db.Decimal(10, 2) // e.g., 75000.00 (SEK)

  // Flags
  isExtensionCabinet   Boolean  @default(false)
  isNewStack           Boolean  @default(true)
  isActive             Boolean  @default(true)

  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  brand        BatteryBrand  @relation(fields: [brandId], references: [id], onDelete: Cascade)
  organization Organization  @relation(fields: [orgId], references: [id], onDelete: Cascade)
  // Future: calculations Calculation[]

  @@unique([orgId, brandId, name]) // No duplicate config names per brand per org
  @@index([orgId])
  @@index([brandId])
}

// =============================================================================
// NATAGARE (Grid Operators)
// =============================================================================

model Natagare {
  id           String   @id @default(cuid())
  name         String   // e.g., "Ellevio", "Vattenfall Eldistribution"

  // Effect tariff rates (SEK/kW)
  dayRateSekKw   Decimal  @db.Decimal(10, 4) // e.g., 81.2500
  nightRateSekKw Decimal  @db.Decimal(10, 4) // e.g., 40.6250

  // Time windows (24-hour format)
  dayStartHour   Int      @default(6)  // 06:00
  dayEndHour     Int      @default(22) // 22:00 (night = 22:00-06:00)

  orgId          String
  isDefault      Boolean  @default(false) // Pre-populated defaults
  isActive       Boolean  @default(true)

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  organization Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)
  // Future: calculations Calculation[]

  @@unique([orgId, name]) // No duplicate names per org
  @@index([orgId])
}

// =============================================================================
// ELECTRICITY PRICING (Global - not tenant scoped)
// =============================================================================

enum Elomrade {
  SE1
  SE2
  SE3
  SE4
}

model ElectricityPrice {
  id        String   @id @default(cuid())
  elomrade  Elomrade
  date      DateTime @db.Date
  hour      Int      // 0-23
  priceOre  Decimal  @db.Decimal(10, 2) // Price in ore/kWh (e.g., 142.50)

  createdAt DateTime @default(now())

  @@unique([elomrade, date, hour]) // One price per area/date/hour
  @@index([elomrade, date])
  @@index([date])
}

// Quarterly aggregates (for quick lookup by closers)
model ElectricityPriceQuarterly {
  id               String   @id @default(cuid())
  elomrade         Elomrade
  year             Int
  quarter          Int      // 1-4
  avgDayPriceOre   Decimal  @db.Decimal(10, 2) // Average 06:00-22:00
  avgNightPriceOre Decimal  @db.Decimal(10, 2) // Average 22:00-06:00
  avgPriceOre      Decimal  @db.Decimal(10, 2) // Overall average

  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@unique([elomrade, year, quarter])
  @@index([elomrade])
}
```

### Organization Relation Updates

Add to Organization model:

```prisma
model Organization {
  // ... existing fields

  // Add relations
  batteryBrands  BatteryBrand[]
  batteryConfigs BatteryConfig[]
  natagare       Natagare[]
}
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Electricity price fetching | Custom scraper | mgrey.se API or nordpool npm | API stability, maintained by others |
| Price caching | In-memory cache | Database table + daily cron | Persistence, shared across instances |
| Form validation | Manual checks | Zod schemas (shared client/server) | Type safety, consistent error messages |
| Tenant isolation | WHERE clauses everywhere | Prisma $extends | Automatic, can't forget |
| Decimal arithmetic | JavaScript floats | Prisma Decimal type | Financial precision required |

## Common Pitfalls

### Pitfall 1: Currency/Unit Confusion

**What goes wrong:** Prices stored in wrong unit, calculations off by 100x or 1000x
**Why it happens:** Different APIs use different units:
- mgrey.se: ore/kWh
- nordpool npm: SEK/MWh
- Some sources: EUR/MWh

**How to avoid:**
1. Standardize on ore/kWh in database (integer-friendly)
2. Document unit in column name: `priceOre` not `price`
3. Create conversion helpers:
```typescript
export const priceConversion = {
  oreToSekKwh: (ore: number) => ore / 100,
  sekMwhToOre: (sekMwh: number) => sekMwh / 10,
  eurMwhToOre: (eurMwh: number, rate: number) => eurMwh * rate / 10,
};
```

**Warning signs:** ROI calculations showing unrealistic values (payback in days or centuries)

### Pitfall 2: Efficiency Percentages as Decimals vs Integers

**What goes wrong:** 95% stored as 0.95 but used as 95, or vice versa
**Why it happens:** Inconsistent representation

**How to avoid:**
1. Store as percentage integer in database: 95, not 0.95
2. Use descriptive column names: `chargeEfficiencyPercent`
3. Convert on read:
```typescript
const chargeEfficiency = config.chargeEfficiency / 100; // 0.95
const energyStored = inputKwh * chargeEfficiency;
```

### Pitfall 3: Natagare Time Window Edge Cases

**What goes wrong:** Wrong rate applied at boundary hours (22:00, 06:00)
**Why it happens:** Inclusive vs exclusive boundaries

**How to avoid:**
1. Document boundary behavior: "Day rate applies 06:00-21:59, night 22:00-05:59"
2. Use hour comparison consistently:
```typescript
const isNightHour = (hour: number, natagare: Natagare) => {
  const { dayStartHour, dayEndHour } = natagare;
  // Night is from dayEndHour to dayStartHour (wrapping midnight)
  if (dayEndHour > dayStartHour) {
    return hour >= dayEndHour || hour < dayStartHour;
  }
  return hour >= dayEndHour && hour < dayStartHour;
};
```

### Pitfall 4: Quarterly Average Calculation Errors

**What goes wrong:** Quarterly averages don't match what closers expect
**Why it happens:**
- Including/excluding weekend vs weekday prices
- Different definitions of "day" hours
- Missing data handling

**How to avoid:**
1. Document calculation method clearly
2. Use Ellevio's definition: day = 06:00-22:00
3. Include all days (weekends too) unless specified otherwise
4. Handle missing prices gracefully (exclude from average, not zero)

### Pitfall 5: Decimal Precision in Prisma

**What goes wrong:** Values truncated or rounded unexpectedly
**Why it happens:** Prisma Decimal returns strings, JavaScript math is imprecise

**How to avoid:**
1. Use appropriate Decimal precision: `@db.Decimal(10, 2)` for money
2. Convert to number only for display/calculation:
```typescript
const costPrice = Number(config.costPrice);
```
3. Use Decimal.js for financial calculations if needed

## Code Examples

### Fetching Electricity Prices

```typescript
// lib/electricity/fetch-prices.ts
import { prisma } from '@/lib/db/client';
import { Elomrade } from '@prisma/client';

interface MgreyPrice {
  hour: number;
  price_sek: number; // ore/kWh
  price_eur: number;
  kmeans: number;
}

interface MgreyResponse {
  date: string;
  SE1: MgreyPrice[];
  SE2: MgreyPrice[];
  SE3: MgreyPrice[];
  SE4: MgreyPrice[];
}

export async function fetchAndStorePrices(date: Date) {
  const dateStr = date.toISOString().split('T')[0];

  const response = await fetch(
    `https://mgrey.se/espot?format=json&date=${dateStr}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch prices: ${response.status}`);
  }

  const data: MgreyResponse = await response.json();

  const areas: Elomrade[] = ['SE1', 'SE2', 'SE3', 'SE4'];
  const records = areas.flatMap(area =>
    data[area].map(price => ({
      elomrade: area,
      date: new Date(data.date),
      hour: price.hour,
      priceOre: price.price_sek, // Already in ore/kWh
    }))
  );

  // Upsert to handle re-runs
  await prisma.$transaction(
    records.map(record =>
      prisma.electricityPrice.upsert({
        where: {
          elomrade_date_hour: {
            elomrade: record.elomrade,
            date: record.date,
            hour: record.hour,
          },
        },
        update: { priceOre: record.priceOre },
        create: record,
      })
    )
  );

  return records.length;
}
```

### Calculating Quarterly Averages

```typescript
// lib/electricity/quarterly-averages.ts
export async function calculateQuarterlyAverages(
  elomrade: Elomrade,
  year: number,
  quarter: number
) {
  const startMonth = (quarter - 1) * 3;
  const startDate = new Date(year, startMonth, 1);
  const endDate = new Date(year, startMonth + 3, 0); // Last day of quarter

  const prices = await prisma.electricityPrice.findMany({
    where: {
      elomrade,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  if (prices.length === 0) {
    return null;
  }

  // Day hours: 6-21 (Ellevio definition)
  const dayPrices = prices.filter(p => p.hour >= 6 && p.hour < 22);
  const nightPrices = prices.filter(p => p.hour < 6 || p.hour >= 22);

  const avg = (arr: typeof prices) =>
    arr.reduce((sum, p) => sum + Number(p.priceOre), 0) / arr.length;

  return prisma.electricityPriceQuarterly.upsert({
    where: {
      elomrade_year_quarter: { elomrade, year, quarter },
    },
    update: {
      avgDayPriceOre: avg(dayPrices),
      avgNightPriceOre: avg(nightPrices),
      avgPriceOre: avg(prices),
    },
    create: {
      elomrade,
      year,
      quarter,
      avgDayPriceOre: avg(dayPrices),
      avgNightPriceOre: avg(nightPrices),
      avgPriceOre: avg(prices),
    },
  });
}
```

### Default Natagare Seeding

```typescript
// prisma/seed-natagare.ts
const DEFAULT_NATAGARE = [
  {
    name: 'Ellevio',
    dayRateSekKw: 81.25,
    nightRateSekKw: 40.625, // Half of day rate
    dayStartHour: 6,
    dayEndHour: 22,
  },
  {
    name: 'Vattenfall Eldistribution',
    dayRateSekKw: 75.00, // Placeholder - update with actual
    nightRateSekKw: 37.50,
    dayStartHour: 6,
    dayEndHour: 22,
  },
  {
    name: 'E.ON Energidistribution',
    dayRateSekKw: 70.00, // Placeholder - update with actual
    nightRateSekKw: 35.00,
    dayStartHour: 6,
    dayEndHour: 22,
  },
];

export async function seedDefaultNatagare(orgId: string) {
  for (const natagare of DEFAULT_NATAGARE) {
    await prisma.natagare.upsert({
      where: {
        orgId_name: { orgId, name: natagare.name },
      },
      update: {},
      create: {
        ...natagare,
        orgId,
        isDefault: true,
      },
    });
  }
}
```

## Key Decisions Needed

### Decision 1: Electricity Price API

**Options:**
1. **mgrey.se** (recommended) - Free, simple, Swedish-focused
2. **nordpool npm** - Free, but unofficial scraper
3. **ENTSO-E** - Official, requires registration
4. **Manual entry only** - Most reliable but labor-intensive

**Recommendation:** Start with mgrey.se + manual entry fallback. Re-evaluate after launch if reliability issues arise.

### Decision 2: Default Natagare Data Source

**Problem:** Only Ellevio rates are well-documented (81.25 SEK/kW). Other natagare rates vary and may not be public.

**Options:**
1. Only seed Ellevio as default, let orgs add others
2. Seed all major natagare with placeholder rates, mark as "verify rates"
3. No defaults, require orgs to enter all natagare

**Recommendation:** Seed Ellevio with accurate rates. Seed Vattenfall/E.ON with placeholder rates and add `isVerified` flag or note in name like "Vattenfall (verifiera priser)".

### Decision 3: Price Fetch Frequency

**Options:**
1. Real-time fetch on each calculation (slow, rate limit risk)
2. Daily cron job to fetch day-ahead prices
3. Weekly batch job for historical backfill

**Recommendation:** Daily cron for day-ahead prices. Manual backfill for historical data needed before launch.

### Decision 4: Quarterly Average Calculation Timing

**Options:**
1. On-demand calculation when closer views (may be slow)
2. Pre-calculated daily/weekly
3. Pre-calculated when quarter completes

**Recommendation:** Pre-calculate weekly. Update at end of each quarter. Acceptable staleness for average data.

## Open Questions

1. **Vattenfall/E.ON exact effekttariff rates for 2025?**
   - What we know: Vattenfall hasn't announced effekttariff yet (deadline Jan 2027)
   - Recommendation: Use placeholder rates, mark as unverified

2. **Historical price data availability?**
   - What we know: mgrey.se has data from 2022-09-01
   - Recommendation: Sufficient for ROI projections, backfill from this date

3. **Battery degradation calculation method?**
   - What we know: Excel uses 2%/year linear degradation
   - What's unclear: Should calculations use linear or compound degradation?
   - Recommendation: Use linear (simpler, matches Excel)

## Sources

### Primary (HIGH confidence)
- Validated Excel: "Batterikalkyl _ Emaldo Power Store - Myren 150.csv" - Battery specs, calculation formulas
- [Ellevio effekttariff announcement](https://tibber.com/en/magazine/inside-tibber/new-ellevio-tariffs) - 81.25 SEK/kW, 22:00-06:00 night window
- [mgrey.se API](https://mgrey.se/espot/api) - Free Swedish spot price API
- Phase 1 codebase patterns - Server actions, forms, tenant scoping

### Secondary (MEDIUM confidence)
- [nordpool npm package](https://github.com/samuelmr/nordpool-node) - API wrapper for Nord Pool
- [ENTSO-E Transparency Platform](https://transparency.entsoe.eu/) - Official European grid data
- [LiFePO4 efficiency](https://www.anernstore.com/blogs/diy-solar-guides/round-trip-efficiency-lifepo4-battery) - 90-98% typical

### Tertiary (LOW confidence - verify before use)
- Vattenfall/E.ON rates - Not officially published for effekttariff yet
- mgrey.se uptime/reliability - No SLA documented

## Metadata

**Confidence breakdown:**
- Battery specs: HIGH - Validated Excel is authoritative
- Natagare structure: HIGH - Ellevio rates verified, pattern clear
- Electricity pricing API: MEDIUM - mgrey.se works but no SLA
- Tenant scoping: HIGH - Follows established Phase 1 patterns

**Research date:** 2026-01-19
**Valid until:** 60 days (stable domain, API endpoints may change)
