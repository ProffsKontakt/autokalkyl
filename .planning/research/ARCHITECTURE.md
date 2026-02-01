# Architecture Integration: v1.2 Realistic Consumption Profiles & Peak Tariffs

**Project:** Kalkyla.se v1.2
**Focus:** Integrating consumption profiles, peak tariff calculations, and PostHog dashboards with existing architecture
**Researched:** 2026-02-01
**Confidence:** HIGH (verified against existing codebase)

---

## Executive Summary

v1.2 adds four capabilities to the existing battery ROI calculator:

1. **Consumption Profile Generation** - Annual kWh + heating type produces realistic monthly distribution
2. **Peak Tariff Configuration** - Natagare-specific peak calculation methods (Super Admin configurable)
3. **PostHog Dashboard Integration** - Reconfigure analytics to populate dashboards with actionable data
4. **Centralized Natagare Management** - Super Admin manages natagare across all orgs

These features integrate with **existing architecture** without major structural changes. The existing calculation engine, Zustand store, and Server Action patterns accommodate all v1.2 requirements.

---

## Integration Points with Existing Architecture

### 1. Consumption Profile Generation

**Current State:**
- `ConsumptionProfile` type: `{ data: number[][] }` - 12 months x 24 hours matrix
- `SYSTEM_PRESETS` in `src/lib/calculations/presets.ts`: 4 hardcoded presets (electric-heating, heat-pump, ev-charging, solar-prosumer)
- `applyPreset()` function: Takes preset + annualKwh, generates 12x24 matrix
- Wizard store has `consumptionProfile` and `annualConsumptionKwh` fields

**Integration Approach:**

```
User Flow:
Step 1 (Customer Info) → annualKwh + heatingType selection
                              ↓
                    generateConsumptionProfile(annualKwh, heatingType)
                              ↓
Step 2 (Consumption) → Pre-populated 12x24 matrix
                              ↓
                    User can fine-tune or accept
```

**Location:** Extend existing `src/lib/calculations/presets.ts`

**New Components:**
- `HeatingType` enum: `DIRECT_ELECTRIC | HEAT_PUMP | DISTRICT | GAS | OIL | PELLETS | NONE`
- `getProfileForHeatingType(heatingType)` - Maps heating type to appropriate preset
- `generateRealisticProfile(annualKwh, heatingType)` - Wrapper that applies seasonal weighting

**Modification to Existing:**
- Add `heatingType` field to `CalculationWizardStore` (optional, nullable)
- Add `heatingType` field to `Calculation` model in schema (optional)
- Update `CustomerInfoStep` to include heating type dropdown
- On annualKwh or heatingType change, auto-generate profile suggestion

**Data Flow:**
```
CustomerInfoStep component
    ↓ onChange
Zustand store: updateCustomerInfo({ heatingType, annualConsumptionKwh })
    ↓ useEffect
Auto-generate: applyPreset(getProfileForHeatingType(heatingType), annualKwh)
    ↓
Zustand store: setConsumptionProfile(generatedProfile)
    ↓
ConsumptionStep: Shows pre-populated grid, user can edit
```

**Why This Approach:**
- Reuses existing `applyPreset()` logic (tested, works)
- Preserves manual editing capability
- No breaking changes to calculation engine
- Profile generation is pure function, testable

---

### 2. Peak Tariff Configuration

**Current State:**
- `Natagare` model: `dayRateSekKw`, `nightRateSekKw`, `dayStartHour`, `dayEndHour`
- Natagare are tenant-scoped (each org manages their own)
- Peak shaving uses slider: `peakShavingPercent` in store
- `calcEffectTariffSavings()` in engine: `maxDischargeKw × tariffRate × 12`

**v1.2 Requirement:**
- Different natagare have different peak calculation methods
- Some use "highest 3 hours" averaging
- Some use "single peak hour"
- Super Admin configures per-natagare

**Integration Approach:**

**Schema Extension:**
```prisma
model Natagare {
  // Existing fields...

  // New: Peak calculation method (Super Admin configurable)
  peakCalculationMethod  PeakMethod @default(SINGLE_PEAK)
  peakAveragingHours     Int?       // For AVERAGED_PEAK: how many hours to average
  peakTimePeriod         String?    // e.g., "monthly", "quarterly" for when peak is measured
}

enum PeakMethod {
  SINGLE_PEAK      // Highest single hour
  AVERAGED_PEAK    // Average of N highest hours
  ROLLING_PEAK     // Rolling average over time period
}
```

**Location:** Extend `src/lib/calculations/formulas.ts`

**New Functions:**
```typescript
// Calculate peak based on natagare method
function calcPeakForTariff(
  consumptionProfile: number[][],
  natagareConfig: {
    method: PeakMethod,
    averagingHours?: number,
    timePeriod?: string
  }
): number {
  // Returns the peak value to use for tariff calculation
}
```

**Modification to Existing:**
- Extend `Natagare` model with peak calculation fields
- Update `calcEffectTariffSavings()` to accept peak method
- Add Super Admin UI for natagare peak config (new page in admin)
- Update calculation engine to use consumption profile for peak detection

**Data Flow:**
```
Calculation Engine
    ↓
Get natagare config (includes peakMethod)
    ↓
calcPeakForTariff(consumptionProfile, natagareConfig)
    ↓
Returns: estimated monthly peaks (array of 12 values)
    ↓
calcEffectTariffSavings(peaks, tariffRate)
    ↓
Annual effekttariff savings
```

**Why This Approach:**
- Schema change is additive (existing natagare keep working with default)
- Calculation logic isolated in pure function
- Super Admin config separate from org-level natagare management

---

### 3. PostHog Dashboard Integration

**Current State:**
- PostHog client in `src/lib/analytics/posthog.ts`
- Events tracked in `src/lib/analytics/events.ts`:
  - `calculation_viewed`
  - `simulator_adjusted`
  - `scroll_depth`
  - `time_on_page`
- No dashboard-specific data population

**v1.2 Requirement:**
- Populate PostHog dashboards with structured data
- Track conversion funnel (view → adjust → request quote)
- Group analytics by org for reporting

**Integration Approach:**

**Event Enhancement:**
```typescript
// Extend existing events with dashboard-friendly properties
export function trackCalculationViewed(
  calculationId: string,
  orgSlug: string,
  // NEW: Dashboard properties
  properties: {
    batteryBrand: string,
    batteryCapacityKwh: number,
    annualConsumptionKwh: number,
    elomrade: string,
    estimatedRoi: number,
    paybackYears: number,
    // Group by org for dashboard filtering
    $groups: { company: orgSlug }
  }
) {
  posthog.capture('calculation_viewed', { calculationId, orgSlug, ...properties })
  posthog.group('company', orgSlug, { name: orgSlug }) // Group identification
}
```

**New Events for Funnel:**
```typescript
// Conversion funnel events
trackShareLinkGenerated(calcId, orgSlug, { method: 'copy' | 'email' })
trackQuoteRequested(calcId, orgSlug, { via: 'email_button' | 'phone_button' })
trackCalculationFinalized(calcId, orgSlug, { totalSavings, paybackYears })
```

**Location:** Extend `src/lib/analytics/events.ts`

**Dashboard Configuration (PostHog UI):**
1. Create "Conversion Funnel" insight
2. Create "Org Comparison" dashboard (grouped by company)
3. Create "Battery Performance" dashboard (by brand)

**No New Components Needed** - This is event instrumentation and PostHog UI configuration.

**Data Flow:**
```
User action (view, adjust, finalize)
    ↓
trackEvent() with structured properties
    ↓
PostHog ingestion
    ↓
Dashboard queries (configured in PostHog UI)
```

---

### 4. Centralized Natagare Management

**Current State:**
- Natagare are tenant-scoped: each org has their own
- `createNatagare()`, `updateNatagare()` in `src/actions/natagare.ts`
- `seedDefaultNatagare()` creates defaults on org creation
- Permissions: ORG_ADMIN can manage natagare for their org

**v1.2 Requirement:**
- Super Admin manages a "master list" of natagare
- Orgs inherit from master list
- Super Admin can update natagare details (rates, peak methods)
- Changes propagate to all orgs using that natagare

**Integration Approach - Option A: Global Natagare (Recommended)**

**Schema Change:**
```prisma
model Natagare {
  id        String   @id @default(cuid())
  name      String   @unique  // Globally unique (Ellevio, Vattenfall, etc.)

  // Rates (Super Admin managed)
  dayRateSekKw        Decimal @db.Decimal(10, 4)
  nightRateSekKw      Decimal @db.Decimal(10, 4)
  dayStartHour        Int @default(6)
  dayEndHour          Int @default(22)

  // Peak calculation (v1.2)
  peakCalculationMethod PeakMethod @default(SINGLE_PEAK)
  peakAveragingHours    Int?

  // Soft delete
  isActive  Boolean @default(true)

  // NO orgId - natagare are global

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  calculations Calculation[]
}
```

**Migration Path:**
1. Create new `GlobalNatagare` table (or modify existing)
2. Migrate existing org-scoped natagare to global
3. Update calculations to reference global natagare
4. Remove orgId from natagare model
5. Update permissions: Only SUPER_ADMIN can manage natagare

**New Components:**
- Admin page: `/admin/natagare` - Super Admin CRUD
- Remove natagare management from org dashboard (or make read-only)

**Why This Approach:**
- Natagare are real-world entities (Ellevio is Ellevio everywhere)
- Rates should be consistent across orgs
- Super Admin is authoritative source
- Simpler than org-level overrides

**Alternative - Option B: Master + Override**

If orgs need rate customization:
```prisma
model GlobalNatagare {
  id    String @id
  name  String @unique
  // ... base rates
}

model OrgNatagareOverride {
  id              String @id
  orgId           String
  globalNatagareId String
  dayRateOverride Decimal?  // Null = use global
  // ... other overrideable fields
}
```

**Recommendation:** Start with Option A (global natagare). Add override capability later if orgs actually need different rates.

---

## New Components Needed

| Component | Location | Purpose |
|-----------|----------|---------|
| `HeatingTypeSelect` | `src/components/calculations/wizard/heating-type-select.tsx` | Dropdown for heating type in Step 1 |
| `generateProfileForHeating()` | `src/lib/calculations/consumption-profiles.ts` | Maps heating type + kWh to profile |
| `PeakMethodConfig` | `src/components/admin/natagare/peak-method-config.tsx` | Super Admin UI for peak config |
| `calcPeakFromProfile()` | `src/lib/calculations/peak-detection.ts` | Calculate peak from consumption profile |
| `AdminNatagarePage` | `src/app/(admin)/admin/natagare/page.tsx` | Super Admin natagare management |

---

## Modified Components

| Component | Modification |
|-----------|-------------|
| `prisma/schema.prisma` | Add `heatingType` to Calculation, extend Natagare with peak fields, optionally remove orgId |
| `src/stores/calculation-wizard-store.ts` | Add `heatingType` field and setter |
| `src/components/calculations/wizard/steps/customer-info-step.tsx` | Add heating type dropdown |
| `src/lib/calculations/engine.ts` | Use consumption profile for peak detection |
| `src/lib/calculations/formulas.ts` | Add `calcPeakFromProfile()` function |
| `src/actions/natagare.ts` | Update permissions (Super Admin only for create/update) |
| `src/lib/analytics/events.ts` | Enhance events with dashboard properties |
| `src/lib/auth/permissions.ts` | Add `NATAGARE_MANAGE_GLOBAL` permission |

---

## Data Flow Changes

### Current: Peak Shaving

```
User selects peakShavingPercent slider
    ↓
Engine uses hardcoded currentPeakKw (8 kW default)
    ↓
calcEffectTariffSavings(maxDischargeKw × slider%, tariffRate)
```

### v1.2: Peak Shaving with Profile

```
User enters annualKwh + heatingType
    ↓
generateProfileForHeating() → 12x24 matrix
    ↓
calcPeakFromProfile(profile, natagare.peakMethod)
    ↓
Returns monthly peak estimates (array[12])
    ↓
User can adjust peakShavingPercent slider
    ↓
calcEffectTariffSavings(peaks, slider%, natagare)
    ↓
More accurate effekttariff savings
```

---

## Suggested Build Order

Based on dependencies:

### Phase 1: Consumption Profile Generation (3-4 plans)

**Why first:** Foundation for peak detection. Standalone feature, no blocking dependencies.

1. **01-01: Schema + Types**
   - Add `heatingType` to Calculation model
   - Add `HeatingType` enum
   - Add `heatingType` to wizard store

2. **01-02: Profile Generation Logic**
   - Create `src/lib/calculations/consumption-profiles.ts`
   - `generateProfileForHeating(annualKwh, heatingType)`
   - Seasonal weighting by heating type

3. **01-03: UI Integration**
   - `HeatingTypeSelect` component
   - Update CustomerInfoStep
   - Auto-generate profile on heating type change

4. **01-04: Testing + Polish**
   - Verify profile generation accuracy
   - Test manual editing still works
   - Test persistence to database

### Phase 2: Peak Tariff Configuration (3 plans)

**Why second:** Depends on consumption profile for peak detection. Requires schema migration.

1. **02-01: Schema Extension**
   - Add peak calculation fields to Natagare
   - Create `PeakMethod` enum
   - Migration script

2. **02-02: Peak Detection Logic**
   - `calcPeakFromProfile()` function
   - Support for SINGLE_PEAK, AVERAGED_PEAK, ROLLING_PEAK
   - Update engine to use new peak detection

3. **02-03: Super Admin UI**
   - Peak method configuration form
   - Integration with existing natagare management

### Phase 3: Centralized Natagare Management (2 plans)

**Why third:** Affects existing natagare. Should be done carefully.

1. **03-01: Schema Migration**
   - Remove orgId from Natagare (or create GlobalNatagare)
   - Update permissions
   - Data migration script

2. **03-02: Admin UI**
   - `/admin/natagare` page
   - CRUD for global natagare
   - Remove/disable org-level natagare editing

### Phase 4: PostHog Dashboard Integration (2 plans)

**Why last:** Non-blocking, can be done in parallel with testing.

1. **04-01: Event Enhancement**
   - Extend events with dashboard properties
   - Add group identification
   - Add conversion funnel events

2. **04-02: Dashboard Configuration**
   - Configure PostHog dashboards (UI work)
   - Document dashboard access for stakeholders

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Peak calculation accuracy | Medium | High | Validate against real natagare contracts |
| Migration breaks existing natagare | Medium | High | Thorough migration testing, rollback plan |
| Profile generation not useful | Low | Medium | Test with real user feedback |
| PostHog rate limits | Low | Low | Use sampling if needed |

---

## Decisions Deferred

| Decision | Reason | When to Decide |
|----------|--------|----------------|
| Org-level natagare overrides | May not be needed | After initial release, based on feedback |
| Manual peak input option | Complexity vs accuracy tradeoff | Phase 2 implementation |
| Real-time price spread in profile | Requires price API integration | Future milestone |

---

## Sources

- Existing codebase: `src/lib/calculations/`, `src/stores/`, `src/actions/`
- Existing architecture docs: `.planning/codebase/ARCHITECTURE.md`
- v1.1 milestone: `.planning/milestones/v1.1-ROADMAP.md`
- PostHog groups documentation: https://posthog.com/docs/product-analytics/group-analytics
