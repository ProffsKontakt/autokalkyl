# Phase 15: Customer Type & Electricity Inputs - Research

**Researched:** 2026-02-05
**Domain:** Form input design, data modeling, Swedish electricity market
**Confidence:** HIGH

## Summary

Phase 15 introduces customer-specific electricity inputs in the calculation wizard, including customer type (privatperson/företag), purchased electricity (köpt el), electricity price, and solar production with self-consumption modeling. This phase builds on the existing wizard pattern established in phases 1-14.

The standard approach uses **React Hook Form with Zod validation** for form state and validation, **Zustand store** for wizard-level state persistence, and **Prisma Decimal fields** for financial precision. The wizard follows a multi-step pattern where inputs are collected progressively and auto-saved as drafts.

Key technical requirements:
- Support both annual and monthly input modes with toggle switches
- Handle unit conversion (öre/kWh ↔ SEK/kWh) client-side with precision
- Conditional field visibility based on toggle states (e.g., solar inputs only when "Har solceller?" is yes)
- Three-field solar self-consumption model for battery value proposition
- VAT (moms 25%) adjustment for företag customers

**Primary recommendation:** Extend existing Calculation model with new fields, add new wizard step after customer basics, use Zod refine/superRefine for conditional validation, and follow established Decimal(10,2) precision pattern for all monetary and energy values.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React Hook Form | ^7.71.1 | Form state management | Project standard, already used in all wizard steps |
| Zod | ^4.3.5 | Runtime validation | Type-safe validation, integrates with RHF via @hookform/resolvers |
| Zustand | ^5.0.10 | Client state persistence | Wizard store pattern with localStorage, established in project |
| Prisma | ^7.2.0 | Database schema and ORM | Project ORM, type-safe queries |
| Decimal.js | ^10.6.0 | Arbitrary-precision arithmetic | Financial calculations require precision beyond floating point |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @hookform/resolvers | ^5.2.2 | Zod-RHF bridge | Required for zodResolver integration |
| clsx | ^2.1.1 | Conditional class composition | Styling toggle states, conditional UI |
| Sonner | ^2.0.7 | Toast notifications | Input validation feedback, save confirmations |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Decimal.js | BigNumber.js | Decimal.js has cleaner API, better TypeScript support |
| Zustand | Redux | Zustand is lighter, no boilerplate, already project standard |
| React Hook Form | Formik | RHF has better performance (uncontrolled inputs), already in use |

**Installation:**
```bash
# All dependencies already installed in project
# No new packages required
```

## Architecture Patterns

### Recommended Project Structure
```
prisma/
├── schema.prisma                    # Add customer electricity fields to Calculation model

src/
├── stores/
│   └── calculation-wizard-store.ts  # Extend with new electricity input state
├── components/
│   └── calculations/
│       └── wizard/
│           └── steps/
│               ├── customer-info-step.tsx       # Existing
│               ├── electricity-step.tsx         # NEW: Customer type + electricity inputs
│               ├── consumption-profile-step.tsx # Existing (no changes)
│               └── battery-step.tsx             # Existing (no changes)
├── actions/
│   └── calculations.ts              # Extend saveDraft schema with new fields
└── lib/
    └── calculations/
        ├── types.ts                 # Add electricity input types
        └── solar-consumption.ts     # NEW: Self-consumption calculation utilities
```

### Pattern 1: Wizard Step with Conditional Fields
**What:** Multi-section form step with toggle-controlled field visibility
**When to use:** When inputs have optional sections (e.g., solar inputs only if customer has solar)
**Example:**
```typescript
// Established pattern from customer-info-step.tsx
export function ElectricityStep() {
  const {
    customerType,
    koptElKwh,
    electricityPriceOreKwh,
    hasSolar,
    updateElectricityInputs,
  } = useCalculationWizardStore()

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold">Elförbrukning & Elpris</h2>

      {/* Customer Type - dropdown for future extensibility */}
      <select value={customerType} onChange={...}>
        <option value="PRIVATPERSON">Privatperson</option>
        <option value="FORETAG">Företag</option>
      </select>

      {/* Required: Köpt el - always visible */}
      <div>
        <label>Köpt el (kWh/år) *</label>
        <input type="number" value={koptElKwh} onChange={...} />
        <p className="text-sm text-gray-500">
          Årsförbrukning från elnätet
        </p>
      </div>

      {/* Conditional: Solar inputs - only if hasSolar is true */}
      <div>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={hasSolar} onChange={...} />
          Har solceller?
        </label>
      </div>

      {hasSolar && (
        <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
          {/* Solar production inputs */}
          {/* Three-field self-consumption model */}
        </div>
      )}
    </div>
  )
}
```

### Pattern 2: Unit Toggle with Conversion
**What:** Toggle between two unit systems (öre/kWh ↔ SEK/kWh) with automatic conversion
**When to use:** When users think in different units but system needs consistent storage
**Example:**
```typescript
// Unit conversion pattern
const [priceUnit, setPriceUnit] = useState<'ore' | 'sek'>('ore')
const [displayValue, setDisplayValue] = useState('')

const handleUnitToggle = (newUnit: 'ore' | 'sek') => {
  const currentValue = parseFloat(displayValue)
  if (!isNaN(currentValue)) {
    // Convert between units
    const converted = newUnit === 'sek'
      ? currentValue / 100  // ore → SEK
      : currentValue * 100  // SEK → ore
    setDisplayValue(converted.toString())
  }
  setPriceUnit(newUnit)
}

// Store in consistent unit (öre/kWh) internally
const normalizedValue = priceUnit === 'sek'
  ? parseFloat(displayValue) * 100
  : parseFloat(displayValue)
```

### Pattern 3: Annual/Monthly Input Toggle
**What:** Switch between annual aggregate and monthly breakdown input modes
**When to use:** When users may have annual average or detailed monthly data
**Example:**
```typescript
// From project pattern (similar to consumption profile step)
const [inputMode, setInputMode] = useState<'annual' | 'monthly'>('annual')

{inputMode === 'annual' ? (
  <input
    type="number"
    value={annualPrice}
    onChange={(e) => setAnnualPrice(parseFloat(e.target.value))}
  />
) : (
  <div className="grid grid-cols-3 gap-2">
    {MONTHS.map((month, i) => (
      <div key={month}>
        <label>{month}</label>
        <input
          type="number"
          value={monthlyPrices[i]}
          onChange={(e) => updateMonthlyPrice(i, parseFloat(e.target.value))}
        />
      </div>
    ))}
  </div>
)}
```

### Pattern 4: Zod Conditional Validation
**What:** Runtime validation that depends on other field values
**When to use:** When field requirements change based on toggles (e.g., solar fields required only if hasSolar is true)
**Example:**
```typescript
// From React Hook Form + Zod best practices
const electricitySchema = z.object({
  customerType: z.enum(['PRIVATPERSON', 'FORETAG']),
  koptElKwh: z.number().min(1, 'Köpt el krävs').max(100000, 'Orealistisk förbrukning'),
  electricityPriceOreKwh: z.number().min(0).max(500, 'Orealistiskt pris'),
  hasSolar: z.boolean(),
  solarProductionKwh: z.number().nullable(),
  currentSelfConsumptionKwh: z.number().nullable(),
  projectedSelfConsumptionKwh: z.number().nullable(),
}).superRefine((data, ctx) => {
  // Conditional validation: solar fields required if hasSolar is true
  if (data.hasSolar) {
    if (!data.solarProductionKwh || data.solarProductionKwh <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['solarProductionKwh'],
        message: 'Solproduktion krävs när solceller finns',
      })
    }
    if (!data.currentSelfConsumptionKwh || data.currentSelfConsumptionKwh < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['currentSelfConsumptionKwh'],
        message: 'Nuvarande egenanvändning krävs när solceller finns',
      })
    }
  }
})
```

### Pattern 5: Zustand Store Extension
**What:** Add new fields to existing wizard store while maintaining backward compatibility
**When to use:** When extending wizard with new input step
**Example:**
```typescript
// Extend existing store interface
interface WizardState {
  // ... existing fields (customerName, postalCode, etc.)

  // Phase 15: Electricity inputs
  customerType: 'PRIVATPERSON' | 'FORETAG'
  koptElKwh: number
  koptElInputMode: 'annual' | 'monthly'
  koptElMonthly: number[] // 12 months if monthly mode
  electricityPriceOreKwh: number
  electricityPriceInputMode: 'annual' | 'monthly'
  electricityPriceMonthly: number[] // 12 months if monthly mode
  hasSolar: boolean
  solarProductionKwh: number | null
  solarProductionInputMode: 'annual' | 'monthly'
  solarProductionMonthly: number[] | null
  currentSelfConsumptionKwh: number | null
  projectedSelfConsumptionKwh: number | null
  selfConsumptionInputMode: 'kwh' | 'percent'

  // Actions
  updateElectricityInputs: (data: Partial<ElectricityInputs>) => void
  toggleKoptElInputMode: () => void
  toggleSolarInputMode: () => void
}

// Initialize with sensible defaults
const initialState = {
  customerType: 'PRIVATPERSON' as const,
  koptElKwh: 0,
  koptElInputMode: 'annual' as const,
  koptElMonthly: Array(12).fill(0),
  electricityPriceOreKwh: 150, // Typical 2026 price
  hasSolar: false,
  solarProductionKwh: null,
  // ... etc
}
```

### Pattern 6: Prisma Schema with Decimal Precision
**What:** Use Decimal type for all financial and energy values to avoid floating-point errors
**When to use:** Always, for any monetary value or energy measurement
**Example:**
```prisma
// Established pattern from existing Calculation model
model Calculation {
  // ... existing fields

  // Phase 15: Customer & Electricity inputs
  customerType              String   @default("PRIVATPERSON") // PRIVATPERSON | FORETAG
  koptElKwh                 Decimal  @db.Decimal(10, 2) // Purchased electricity (kWh/year)
  electricityPriceOreKwh    Decimal  @db.Decimal(10, 2) // All-in price (öre/kWh)
  electricityPriceMonthly   Json?    // Array of 12 monthly prices if breakdown provided

  hasSolar                  Boolean  @default(false)
  solarProductionKwh        Decimal? @db.Decimal(10, 2) // Total solar production (kWh/year)
  solarProductionMonthly    Json?    // Array of 12 monthly production values
  currentSelfConsumptionKwh Decimal? @db.Decimal(10, 2) // Current self-consumption
  projectedSelfConsumptionKwh Decimal? @db.Decimal(10, 2) // Projected with battery

  // Net consumption = köpt el - solar used directly
  // Calculated field, not stored (compute in application layer)
}
```

### Anti-Patterns to Avoid
- **Using Number for financial values:** Floating-point arithmetic causes precision errors (e.g., 0.1 + 0.2 !== 0.3). Always use Decimal type in database and Decimal.js in calculations.
- **Hard-coding customer types:** Use database enum or config table. Requirements state "Types configurable by Super Admin — start with Privatperson and Företag" for future expansion.
- **Uncontrolled input state without validation:** Always validate on blur or submit, provide clear error messages. UX degrades if users submit and see validation errors they could have caught earlier.
- **Storing both annual and monthly data redundantly:** Pick one source of truth. If monthly breakdown is provided, derive annual sum from it. Don't store both independently (data can become inconsistent).
- **Making solar fields nullable without conditional validation:** If hasSolar is true, solar fields MUST be validated. Use Zod's superRefine for this.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Decimal arithmetic | Custom big number class | Decimal.js (already in project) | Handles rounding modes, edge cases (division by zero, overflow), well-tested |
| Form validation | Manual validation functions | Zod schemas with superRefine | Type-safe, composable, runtime+compile-time checking, error message formatting |
| Unit conversion | Manual conversion functions | Centralized conversion utilities with constants | Single source of truth for conversion factors, easier to test |
| Monthly data aggregation | Manual sum/average loops | Utility functions in lib/calculations | Handles edge cases (missing months, partial data), consistent across codebase |
| VAT calculation | Inline price * 1.25 | Centralized tax utilities | VAT rate may change, may differ by customer type, easier to maintain in one place |

**Key insight:** Form state management and validation is complex. React Hook Form handles re-render optimization, field registration, error tracking, and touched/dirty state. Zod provides runtime validation that TypeScript can't (user input is untyped at runtime). Combining them is the ecosystem standard for 2026.

## Common Pitfalls

### Pitfall 1: Floating-Point Precision Errors in Financial Calculations
**What goes wrong:** Using JavaScript Number for prices/consumption leads to precision loss (e.g., 120.50 * 1000 may not equal exactly 120500.00)
**Why it happens:** IEEE 754 floating-point can't precisely represent many decimal fractions
**How to avoid:**
- Use Decimal.js for all arithmetic involving money or energy values
- Store as Prisma Decimal type (maps to PostgreSQL NUMERIC)
- Convert to Number only for display (formatting)
**Warning signs:** Tests fail with "expected 120500, got 120499.99999999999"

### Pitfall 2: Conditional Field Validation Not Enforced
**What goes wrong:** User toggles "Har solceller?" to yes, skips solar fields, submits → validation passes even though solar data is missing
**Why it happens:** Zod schema marks fields as optional/nullable but doesn't check the conditional requirement
**How to avoid:**
- Use Zod's superRefine or refine for cross-field validation
- Check dependent field values before validating conditionally required fields
- Example: `if (data.hasSolar && !data.solarProductionKwh) { ctx.addIssue(...) }`
**Warning signs:** Form submits with incomplete data, backend calculations fail with null values

### Pitfall 3: Unit Conversion Confusion (öre ↔ SEK)
**What goes wrong:** User enters 150 öre/kWh, toggle switches to SEK/kWh → display shows 1.50 SEK/kWh (correct), but on toggle back, shows 1.50 öre/kWh (wrong)
**Why it happens:** Double-conversion: 150 öre → 1.50 SEK → 150 öre (lost precision) or state not tracking which unit user entered
**How to avoid:**
- Store value in consistent internal unit (öre/kWh recommended, aligns with existing ElectricityPrice model)
- Track display unit separately from stored value
- Convert only for display, not bidirectionally
- Use Decimal.js for conversion to avoid precision loss
**Warning signs:** Unit toggle causes values to drift, user enters value that doesn't "stick"

### Pitfall 4: Annual/Monthly Input Mode State Management
**What goes wrong:** User enters monthly breakdown, switches to annual mode → monthly data lost. Switches back → blank fields.
**Why it happens:** State update overwrites monthly array instead of preserving it
**How to avoid:**
- Store both annual and monthly data in state
- When switching to annual mode, compute sum of monthly values as initial value
- When switching to monthly mode, preserve existing monthly data or distribute annual value evenly
- Mark which mode was last used so you know which is source of truth
**Warning signs:** Users report "my data disappeared when I toggled modes"

### Pitfall 5: VAT Calculation Order of Operations
**What goes wrong:** For företag customers, VAT should be deducted from all prices. If applied inconsistently (some prices ex-VAT, some inc-VAT), calculations are wrong.
**Why it happens:** VAT applied at different stages (input, calculation, display) without clear convention
**How to avoid:**
- Establish convention: store all prices **excluding VAT** in database
- Apply VAT only for privatperson display
- For företag, display prices as-is (ex-VAT)
- Document this clearly in code comments
**Warning signs:** Företag customers see 25% higher savings than expected, or prices don't match invoices

### Pitfall 6: Self-Consumption Modeling Math Errors
**What goes wrong:** Net consumption calculated as `köpt el - total solar production` instead of `köpt el - self-consumed solar`
**Why it happens:** Misunderstanding the solar model: not all solar production is self-consumed (excess is exported to grid)
**How to avoid:**
- Three-field model is essential:
  - Total solar production (kWh/year)
  - Current self-consumption (kWh or % of production)
  - Projected self-consumption with battery (kWh or % of production)
- Net consumption = köpt el - (solar production × self-consumption %)
- Self-consumption % increases with battery (battery stores excess solar for later use)
**Warning signs:** Net consumption goes negative, battery savings are unrealistically high

## Code Examples

Verified patterns from official sources:

### Conditional Validation with Zod
```typescript
// Source: React Hook Form + Zod patterns (project established)
// File: src/actions/calculations.ts (extend saveDraftSchema)

import { z } from 'zod'

const electricityInputSchema = z.object({
  customerType: z.enum(['PRIVATPERSON', 'FORETAG']),
  koptElKwh: z.number()
    .min(1, 'Köpt el måste vara större än 0')
    .max(100000, 'Orealistisk förbrukning (max 100,000 kWh/år)'),
  koptElInputMode: z.enum(['annual', 'monthly']),
  koptElMonthly: z.array(z.number()).length(12).nullable(),

  electricityPriceOreKwh: z.number()
    .min(50, 'Elpris verkar för lågt (min 50 öre/kWh)')
    .max(500, 'Elpris verkar för högt (max 500 öre/kWh)'),
  electricityPriceInputMode: z.enum(['annual', 'monthly']),
  electricityPriceMonthly: z.array(z.number()).length(12).nullable(),

  hasSolar: z.boolean(),
  solarProductionKwh: z.number().nullable(),
  currentSelfConsumptionKwh: z.number().nullable(),
  projectedSelfConsumptionKwh: z.number().nullable(),
  selfConsumptionInputMode: z.enum(['kwh', 'percent']),
}).superRefine((data, ctx) => {
  // Validate monthly breakdown if monthly mode selected
  if (data.koptElInputMode === 'monthly') {
    if (!data.koptElMonthly || data.koptElMonthly.some(v => v < 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['koptElMonthly'],
        message: 'Alla månadsvärden måste vara ≥ 0 i månadsläge',
      })
    }
  }

  // Validate solar fields if solar exists
  if (data.hasSolar) {
    if (!data.solarProductionKwh || data.solarProductionKwh <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['solarProductionKwh'],
        message: 'Solproduktion krävs när solceller finns',
      })
    }

    if (data.currentSelfConsumptionKwh === null || data.currentSelfConsumptionKwh < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['currentSelfConsumptionKwh'],
        message: 'Nuvarande egenanvändning krävs och måste vara ≥ 0',
      })
    }

    if (data.projectedSelfConsumptionKwh === null || data.projectedSelfConsumptionKwh < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['projectedSelfConsumptionKwh'],
        message: 'Beräknad egenanvändning med batteri krävs',
      })
    }

    // Projected self-consumption should be ≥ current (battery improves it)
    if (data.projectedSelfConsumptionKwh !== null &&
        data.currentSelfConsumptionKwh !== null &&
        data.projectedSelfConsumptionKwh < data.currentSelfConsumptionKwh) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['projectedSelfConsumptionKwh'],
        message: 'Beräknad egenanvändning bör vara högre än nuvarande (batteri ökar egenanvändning)',
      })
    }
  }
})
```

### Unit Conversion Utilities
```typescript
// Source: Project pattern for precision conversions
// File: src/lib/calculations/unit-conversions.ts (NEW)

import Decimal from 'decimal.js'

/**
 * Convert öre to SEK with precision.
 * 100 öre = 1 SEK
 */
export function oreToSek(ore: number | Decimal): Decimal {
  return new Decimal(ore).div(100)
}

/**
 * Convert SEK to öre with precision.
 * 1 SEK = 100 öre
 */
export function sekToOre(sek: number | Decimal): Decimal {
  return new Decimal(sek).mul(100)
}

/**
 * Format price in öre/kWh for display.
 * Examples: 150.00 → "150 öre/kWh", 142.50 → "142,50 öre/kWh"
 */
export function formatOrePerKwh(oreKwh: number | Decimal): string {
  const decimal = new Decimal(oreKwh)
  return `${decimal.toFixed(2).replace('.', ',')} öre/kWh`
}

/**
 * Format price in SEK/kWh for display.
 * Examples: 1.50 → "1,50 kr/kWh", 1.4250 → "1,43 kr/kWh"
 */
export function formatSekPerKwh(sekKwh: number | Decimal): string {
  const decimal = new Decimal(sekKwh)
  return `${decimal.toFixed(2).replace('.', ',')} kr/kWh`
}

/**
 * Apply VAT (moms 25%) to a price.
 */
export function applyVat(priceExVat: number | Decimal): Decimal {
  return new Decimal(priceExVat).mul(1.25)
}

/**
 * Remove VAT (moms 25%) from a price.
 */
export function removeVat(priceIncVat: number | Decimal): Decimal {
  return new Decimal(priceIncVat).div(1.25)
}
```

### Zustand Store Extension
```typescript
// Source: Existing calculation-wizard-store.ts pattern
// File: src/stores/calculation-wizard-store.ts (extend existing)

interface WizardState {
  // ... existing fields ...

  // Phase 15: Customer Type & Electricity Inputs
  customerType: 'PRIVATPERSON' | 'FORETAG'
  koptElKwh: number
  koptElInputMode: 'annual' | 'monthly'
  koptElMonthly: number[] // 12 months
  electricityPriceOreKwh: number
  electricityPriceInputMode: 'annual' | 'monthly'
  electricityPriceMonthly: number[] // 12 months
  hasSolar: boolean
  solarProductionKwh: number | null
  solarProductionInputMode: 'annual' | 'monthly'
  solarProductionMonthly: number[] | null
  currentSelfConsumptionKwh: number | null
  projectedSelfConsumptionKwh: number | null
  selfConsumptionInputMode: 'kwh' | 'percent'

  // Actions
  updateCustomerType: (type: 'PRIVATPERSON' | 'FORETAG') => void
  updateKoptEl: (kwh: number) => void
  toggleKoptElInputMode: () => void
  updateKoptElMonthly: (month: number, kwh: number) => void
  updateElectricityPrice: (oreKwh: number) => void
  toggleElectricityPriceInputMode: () => void
  updateElectricityPriceMonthly: (month: number, oreKwh: number) => void
  toggleHasSolar: () => void
  updateSolarProduction: (kwh: number | null) => void
  toggleSolarProductionInputMode: () => void
  updateSolarProductionMonthly: (month: number, kwh: number) => void
  updateCurrentSelfConsumption: (kwh: number | null) => void
  updateProjectedSelfConsumption: (kwh: number | null) => void
  toggleSelfConsumptionInputMode: () => void
}

const initialState = {
  // ... existing initial values ...

  // Phase 15 defaults
  customerType: 'PRIVATPERSON' as const,
  koptElKwh: 0,
  koptElInputMode: 'annual' as const,
  koptElMonthly: Array(12).fill(0),
  electricityPriceOreKwh: 150, // Typical 2026 price for SE3/SE4
  electricityPriceInputMode: 'annual' as const,
  electricityPriceMonthly: Array(12).fill(150),
  hasSolar: false,
  solarProductionKwh: null,
  solarProductionInputMode: 'annual' as const,
  solarProductionMonthly: null,
  currentSelfConsumptionKwh: null,
  projectedSelfConsumptionKwh: null,
  selfConsumptionInputMode: 'kwh' as const,
}

export const useCalculationWizardStore = create<WizardState>()(
  persist(
    (set, get) => ({
      ...initialState,

      updateCustomerType: (type) => set({ customerType: type }),

      updateKoptEl: (kwh) => set({ koptElKwh: kwh }),

      toggleKoptElInputMode: () => set((state) => {
        const newMode = state.koptElInputMode === 'annual' ? 'monthly' : 'annual'
        if (newMode === 'monthly' && state.koptElMonthly.every(v => v === 0)) {
          // Distribute annual value evenly across months
          const monthlyValue = state.koptElKwh / 12
          return {
            koptElInputMode: newMode,
            koptElMonthly: Array(12).fill(monthlyValue),
          }
        }
        if (newMode === 'annual') {
          // Sum monthly values
          const annualSum = state.koptElMonthly.reduce((sum, v) => sum + v, 0)
          return {
            koptElInputMode: newMode,
            koptElKwh: annualSum,
          }
        }
        return { koptElInputMode: newMode }
      }),

      updateKoptElMonthly: (month, kwh) => set((state) => ({
        koptElMonthly: state.koptElMonthly.map((v, i) => i === month ? kwh : v),
      })),

      toggleHasSolar: () => set((state) => ({
        hasSolar: !state.hasSolar,
        // Clear solar fields when toggling off
        ...(state.hasSolar ? {
          solarProductionKwh: null,
          currentSelfConsumptionKwh: null,
          projectedSelfConsumptionKwh: null,
        } : {}),
      })),

      // ... other actions ...
    }),
    {
      name: 'kalkyla-wizard-draft-v3', // Bump version for Phase 15
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // ... existing partialize fields ...
        // Phase 15 fields
        customerType: state.customerType,
        koptElKwh: state.koptElKwh,
        koptElInputMode: state.koptElInputMode,
        koptElMonthly: state.koptElMonthly,
        electricityPriceOreKwh: state.electricityPriceOreKwh,
        hasSolar: state.hasSolar,
        solarProductionKwh: state.solarProductionKwh,
        currentSelfConsumptionKwh: state.currentSelfConsumptionKwh,
        projectedSelfConsumptionKwh: state.projectedSelfConsumptionKwh,
      }),
    }
  )
)
```

### Self-Consumption Calculation
```typescript
// Source: Solar self-consumption research + battery storage best practices
// File: src/lib/calculations/solar-consumption.ts (NEW)

import Decimal from 'decimal.js'

interface SolarInputs {
  totalProductionKwh: number
  currentSelfConsumptionKwh: number
  projectedSelfConsumptionKwh: number
}

/**
 * Calculate net consumption with solar self-consumption.
 *
 * Net consumption = Purchased electricity - Solar self-consumed
 *
 * Without battery: self-consumption is typically 25-40%
 * With battery: self-consumption can increase to 60-90%
 */
export function calculateNetConsumption(
  purchasedElectricityKwh: number,
  solar: SolarInputs | null
): Decimal {
  const purchased = new Decimal(purchasedElectricityKwh)

  if (!solar) {
    return purchased
  }

  const selfConsumed = new Decimal(solar.currentSelfConsumptionKwh)
  return purchased.minus(selfConsumed)
}

/**
 * Calculate additional solar savings from battery storage.
 *
 * Battery increases self-consumption by storing excess solar during day
 * and discharging at night/peak times.
 */
export function calculateBatterySolarBenefit(
  solar: SolarInputs,
  electricityPriceOreKwh: number
): Decimal {
  const currentSelfConsumption = new Decimal(solar.currentSelfConsumptionKwh)
  const projectedSelfConsumption = new Decimal(solar.projectedSelfConsumptionKwh)

  // Additional self-consumption enabled by battery
  const additionalSelfConsumption = projectedSelfConsumption.minus(currentSelfConsumption)

  // Value of additional self-consumption (avoided grid purchases)
  const pricePerKwh = new Decimal(electricityPriceOreKwh).div(100) // öre → SEK
  return additionalSelfConsumption.mul(pricePerKwh)
}

/**
 * Validate self-consumption inputs.
 *
 * Rules:
 * - Self-consumption cannot exceed total production
 * - Projected self-consumption should be >= current (battery improves it)
 * - Typical self-consumption without battery: 25-40%
 * - Typical self-consumption with battery: 60-90%
 */
export function validateSolarInputs(solar: SolarInputs): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (solar.currentSelfConsumptionKwh > solar.totalProductionKwh) {
    errors.push('Nuvarande egenanvändning kan inte överskrida total solproduktion')
  }

  if (solar.projectedSelfConsumptionKwh > solar.totalProductionKwh) {
    errors.push('Beräknad egenanvändning kan inte överskrida total solproduktion')
  }

  if (solar.projectedSelfConsumptionKwh < solar.currentSelfConsumptionKwh) {
    errors.push('Beräknad egenanvändning bör vara högre än nuvarande (batteri ökar egenanvändning)')
  }

  // Warning: unusually low/high self-consumption rates
  const currentRate = (solar.currentSelfConsumptionKwh / solar.totalProductionKwh) * 100
  const projectedRate = (solar.projectedSelfConsumptionKwh / solar.totalProductionKwh) * 100

  if (currentRate < 10 || currentRate > 60) {
    errors.push(`Nuvarande egenanvändning (${currentRate.toFixed(0)}%) verkar ovanlig (typiskt 25-40% utan batteri)`)
  }

  if (projectedRate < 50 || projectedRate > 95) {
    errors.push(`Beräknad egenanvändning (${projectedRate.toFixed(0)}%) verkar ovanlig (typiskt 60-90% med batteri)`)
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate customer type model | Enum field in Calculation | 2026 design decision | Simpler schema, fewer joins |
| Monthly input as 12 separate fields | JSON array of 12 numbers | Established pattern | Easier to iterate, validate, aggregate |
| Store prices in SEK | Store in öre (Decimal 10,2) | Established in Phase 1 | Aligns with ElectricityPrice model, better precision |
| Hard-coded VAT rate | Centralized constant | Best practice 2026 | Easier to update if VAT rate changes |
| Percentage-based self-consumption | kWh-based with % toggle | Solar research 2025-2026 | More accurate modeling, flexible for users |

**Deprecated/outdated:**
- **Storing customer type as separate lookup table:** Phase 15 requirements specify "Types configurable by Super Admin" but also "start with Privatperson and Företag" — suggests future extensibility but not immediate complexity. Enum in Calculation model with potential future migration to config table is appropriate.
- **Calculating VAT at display time only:** Modern practice stores ex-VAT prices and applies VAT in application layer, not in database. Allows easy recalculation if rates change.

## Open Questions

Things that couldn't be fully resolved:

1. **Customer Type Configuration vs. Enum**
   - What we know: CONTEXT.md says "Types configurable by Super Admin — start with Privatperson and Företag"
   - What's unclear: Should this be a database config table like Natagare, or start as enum and migrate later?
   - Recommendation: Start with enum in Calculation model for simplicity. Create separate CustomerType config table in future phase if more types are added. Migration path: add foreign key, backfill data, drop enum.

2. **Monthly Price Breakdown Storage Format**
   - What we know: Requirements allow monthly breakdown for köpt el and electricity price
   - What's unclear: Store as JSON array `[150, 145, ...]` or JSON object `{"0": 150, "1": 145, ...}` or separate MonthlyPrices table?
   - Recommendation: JSON array (consistent with consumptionProfile pattern). Array index = month (0-11 for Jan-Dec). Simpler queries, no extra joins.

3. **Solar Self-Consumption Input: Percentage vs. kWh**
   - What we know: Three-field model needs current and projected self-consumption
   - What's unclear: Should users enter as % of production or absolute kWh?
   - Recommendation: Support both with toggle (like unit toggle). Store as kWh in database. Users who know their solar monitoring data have kWh; users estimating may prefer %. Convert % to kWh client-side using total production.

4. **Electricity Price Helper Text Range**
   - What we know: CONTEXT.md says "Show helper text with typical range (e.g., 120-180 öre/kWh)"
   - What's unclear: Should this range vary by elomrade (SE1 = 35 öre, SE4 = 80 öre)?
   - Recommendation: Use elomrade-specific ranges if elomrade is already selected. Otherwise show general range "50-200 öre/kWh" to accommodate all zones. Prevents confusion.

## Sources

### Primary (HIGH confidence)
- Project codebase analysis:
  - `/Users/julian.nordgren/autokalkyl/prisma/schema.prisma` - Decimal precision patterns, established field types
  - `/Users/julian.nordgren/autokalkyl/src/stores/calculation-wizard-store.ts` - Zustand state management pattern
  - `/Users/julian.nordgren/autokalkyl/src/components/calculations/wizard/steps/customer-info-step.tsx` - Wizard step UI pattern
  - `/Users/julian.nordgren/autokalkyl/src/actions/calculations.ts` - Zod validation pattern
- Phase 15 CONTEXT.md - User decisions and locked requirements

### Secondary (MEDIUM confidence)
- [React Hook Form with Zod: Complete Guide for 2026](https://dev.to/marufrahmanlive/react-hook-form-with-zod-complete-guide-for-2026-1em1) - Modern RHF+Zod patterns
- [Building Advanced React Forms Using React Hook Form, Zod and Shadcn](https://wasp.sh/blog/2025/01/22/advanced-react-hook-form-zod-shadcn) - Conditional field validation
- [Conditional Logic with Zod + React Hook Form](https://micahjon.com/2023/form-validation-with-zod/) - superRefine pattern for dependent fields
- [Sweden VAT guide 2026](https://www.vatcalc.com/sweden/sweden-vat-country-guide/) - VAT rate confirmation (25%)
- [Cheaper electricity expected in 2026 for southern Sweden](https://swedenherald.com/article/cheaper-electricity-expected-in-2026-for-southern-sweden) - Electricity price ranges by zone
- [Reduced energy tax on electricity from the turn of the year](https://partilleenergi.se/en/2025/11/27/sankt-energiskatt-pa-el-fran-arsskiftet/) - Energy tax 36 öre/kWh ex-VAT (45 öre inc-VAT)

### Tertiary (LOW confidence)
- [Model-based optimization of residential PV-battery systems for maximum self-consumption](https://www.sciencedirect.com/science/article/pii/S2590123025032530) - Self-consumption rates: 25-40% without battery, 60-90% with battery
- [Solar Self-Consumption Guide 2025: Maximize Your Solar ROI](https://solartechonline.com/blog/solar-self-consumption-guide/) - Self-consumption modeling approaches
- [Private vs. public value of U.S. residential battery storage operated for solar self-consumption](https://www.sciencedirect.com/science/article/pii/S2589004222009865) - Battery impact on self-consumption (U.S. data, may differ from Swedish market)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in project, established patterns verified in codebase
- Architecture: HIGH - Wizard pattern, Zustand store, Prisma schema patterns directly from project
- Pitfalls: MEDIUM - Based on common React Hook Form + Zod issues and decimal precision gotchas (well-documented), solar modeling pitfalls are domain-specific but informed by research

**Research date:** 2026-02-05
**Valid until:** 30 days (2026-03-07) - Stack is stable, Swedish VAT/tax rates unlikely to change mid-year
