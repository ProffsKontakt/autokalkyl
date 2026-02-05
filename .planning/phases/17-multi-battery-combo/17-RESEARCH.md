# Phase 17: Multi-Battery Combo - Research

**Researched:** 2026-02-05
**Domain:** React state management, UI patterns, calculation aggregation
**Confidence:** HIGH

## Summary

This phase extends the existing battery selection and results display to support multi-battery "combo" configurations. The core challenge is UI/UX for two distinct modes (Komboinvestering vs Jamfora) while maintaining calculation accuracy. No new libraries are needed - the phase uses existing patterns from the codebase (Zustand store, Tailwind CSS, native HTML details/summary for expandables).

The codebase already supports selecting multiple batteries for side-by-side comparison. This phase adds:
1. Quantity selector per battery model (e.g., "2x Emaldo 15kWh")
2. Mode toggle between combined investment (Kombo) and comparison (Jamfora)
3. Combined calculation aggregation for Kombo mode
4. Per-unit breakdown display with expandable details

**Primary recommendation:** Extend `BatterySelection` in the Zustand store to include `quantity` field; add `comboMode` state; create new combined calculation function that sums/averages results appropriately.

## Standard Stack

The established libraries/tools already in this codebase:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Zustand | 5.0.10 | State management | Already used for wizard store, persist middleware |
| React | 19.2.3 | UI components | Existing framework |
| Tailwind CSS | 4 | Styling | Existing design system |
| decimal.js | 10.6.0 | Financial precision | Already used in calculation engine |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Framer Motion | 12.27.2 | Animations | Already available for expand/collapse transitions |
| Lucide React | 0.562.0 | Icons | Already used for UI icons |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native details/summary | Framer AnimatePresence | details/summary is simpler, already used in public-battery-summary.tsx |
| Zustand state | React useState | Zustand already manages wizard state, keep consistent |

**Installation:**
```bash
# No new dependencies needed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  stores/
    calculation-wizard-store.ts    # Extend with quantity + comboMode
  lib/
    calculations/
      combo-calculations.ts         # NEW: Combined results aggregation
  components/
    calculations/
      wizard/steps/
        battery-step.tsx           # Extend with quantity + mode toggle
      results/
        combo-summary.tsx          # NEW: Combined investment view
        combo-breakdown.tsx        # NEW: Per-unit expandable breakdown
        comparison-view.tsx        # Existing, reuse for Jamfora mode
    public/
      public-combo-view.tsx        # NEW: Public version of combo display
```

### Pattern 1: Extended Battery Selection State
**What:** Add quantity and combo mode to existing Zustand store
**When to use:** All multi-battery scenarios
**Example:**
```typescript
// Source: Existing pattern from calculation-wizard-store.ts

// Current structure
interface BatterySelection {
  configId: string
  totalPriceExVat: number
  installationCost: number
}

// Extended structure for Phase 17
interface BatterySelection {
  configId: string
  totalPriceExVat: number      // Per-unit price
  installationCost: number     // Per-unit (or total for first unit)
  quantity: number             // NEW: Number of this model (default: 1)
}

// New wizard state fields
interface WizardState {
  // ... existing fields ...
  batteries: BatterySelection[]
  comboMode: 'komboinvestering' | 'jamfora'  // NEW: Display mode
}
```

### Pattern 2: Combined Calculation Aggregation
**What:** Aggregate individual battery results into combined totals
**When to use:** Komboinvestering mode display
**Example:**
```typescript
// Source: Pattern derived from engine.ts

interface CombinedResults {
  // Aggregated metrics
  totalCapacityKwh: number              // Sum of all capacities
  totalMaxDischargeKw: number           // Sum of all discharge rates
  totalAnnualSavingsSek: number         // Sum of all savings
  totalCostAfterGronTeknikSek: number   // Sum of all costs

  // Derived metrics (calculated from totals)
  combinedPaybackYears: number          // totalCost / totalAnnualSavings
  combinedRoi10Year: number             // (savings*10 - cost) / cost * 100
  combinedRoi15Year: number             // (savings*15 - cost) / cost * 100

  // Per-unit breakdown
  unitBreakdowns: Array<{
    configId: string
    quantity: number
    perUnitResults: CalculationResults
    subtotalResults: CalculationResults  // perUnit * quantity
  }>
}

function calculateCombinedResults(
  selections: BatterySelection[],
  batteryInfoList: BatteryInfo[],
  calculationParams: CalculationInputs
): CombinedResults {
  // 1. Calculate results for each unique config
  // 2. Multiply by quantity for subtotals
  // 3. Sum all subtotals for combined metrics
  // 4. Derive payback/ROI from combined totals
}
```

### Pattern 3: Native Expandable Details
**What:** Use HTML details/summary for expand/collapse
**When to use:** Per-unit breakdown display
**Example:**
```typescript
// Source: Already used in src/components/public/public-battery-summary.tsx

<details className="border-t border-gray-200">
  <summary className="px-6 py-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between">
    <span className="font-medium">Per-enhet breakdown</span>
    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  </summary>
  <div className="px-6 pb-6">
    {/* Per-unit details here */}
  </div>
</details>
```

### Pattern 4: Mode Toggle UI
**What:** Segmented control for Kombo/Jamfora mode
**When to use:** Battery step header
**Example:**
```typescript
// Pattern from existing wizard components

<div className="flex bg-gray-100 rounded-lg p-1 mb-4">
  <button
    onClick={() => setComboMode('komboinvestering')}
    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
      comboMode === 'komboinvestering'
        ? 'bg-white shadow text-gray-900'
        : 'text-gray-600 hover:text-gray-900'
    }`}
  >
    Komboinvestering
  </button>
  <button
    onClick={() => setComboMode('jamfora')}
    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
      comboMode === 'jamfora'
        ? 'bg-white shadow text-gray-900'
        : 'text-gray-600 hover:text-gray-900'
    }`}
  >
    Jamfora
  </button>
</div>
```

### Anti-Patterns to Avoid
- **Recalculating on every render:** Cache combined results with useMemo, recalculate only when inputs change
- **Storing combined results in database:** Only store individual battery selections; derive combined results at display time
- **Different code paths for public vs admin:** Share calculation logic, only differ in UI presentation

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Financial math | Custom arithmetic | decimal.js (already imported) | Rounding errors in monetary calculations |
| Expand/collapse | Custom state management | Native HTML details/summary | Accessibility, keyboard support, no JS needed |
| Form state | Local useState | Zustand wizard store | Consistency, persistence, already wired up |
| Number formatting | Manual string building | Intl.NumberFormat (already used) | Locale-aware, currency support |

**Key insight:** The codebase already has all needed patterns. The task is extension and composition, not new infrastructure.

## Common Pitfalls

### Pitfall 1: Inconsistent Quantity Handling in Prices
**What goes wrong:** User sets totalPriceExVat per unit but system expects total for all units
**Why it happens:** Ambiguity in what "price" means for multi-quantity selection
**How to avoid:** Explicitly define: totalPriceExVat is always PER UNIT. Calculate total as (totalPriceExVat + installationCost) * quantity
**Warning signs:** Prices look wrong when quantity > 1

### Pitfall 2: Grid Services Double-Counting
**What goes wrong:** Grid services income calculated per battery instance, but actually scales with total capacity
**Why it happens:** Grid services rates (SEK/kW/year) apply to power capacity, not energy capacity
**How to avoid:** Grid services = rate * total_max_discharge_kw (not per unit)
**Warning signs:** Grid income unrealistically high for combo configs

### Pitfall 3: Mode Not Persisted
**What goes wrong:** User selects Kombo mode, navigates away, comes back to Jamfora
**Why it happens:** comboMode not added to Zustand persist partialize
**How to avoid:** Add comboMode to the partialize function in store
**Warning signs:** Mode resets on page refresh or navigation

### Pitfall 4: Public View Mode Mismatch
**What goes wrong:** Closer saves in Kombo mode, prospect sees Jamfora view
**Why it happens:** comboMode not saved to database Calculation record
**How to avoid:** Store comboMode in Calculation (or include in results JSON)
**Warning signs:** Public link shows different layout than admin preview

### Pitfall 5: Gron Teknik Cap Not Considered
**What goes wrong:** Combined investment exceeds Gron Teknik cap but full deduction applied
**Why it happens:** Gron Teknik has annual and total caps (50,000 SEK labor deduction)
**How to avoid:** Apply Gron Teknik to combined total, not per-unit
**Warning signs:** Very large combos show unrealistic after-subsidy prices

## Code Examples

Verified patterns from existing codebase:

### Quantity Selector Pattern
```typescript
// Pattern from existing form inputs

<div className="flex items-center gap-2">
  <label className="text-sm font-medium text-gray-700">Antal:</label>
  <button
    onClick={() => updateQuantity(Math.max(1, quantity - 1))}
    className="px-2 py-1 border rounded-md hover:bg-gray-50"
    disabled={quantity <= 1}
  >
    -
  </button>
  <span className="w-8 text-center font-medium">{quantity}</span>
  <button
    onClick={() => updateQuantity(quantity + 1)}
    className="px-2 py-1 border rounded-md hover:bg-gray-50"
  >
    +
  </button>
</div>
```

### Store Action for Quantity Update
```typescript
// Pattern from calculation-wizard-store.ts

updateBatteryQuantity: (index: number, quantity: number) => set((state) => ({
  batteries: state.batteries.map((b, i) =>
    i === index ? { ...b, quantity: Math.max(1, quantity) } : b
  )
})),
```

### Combined Summary Card
```typescript
// Pattern from SummaryCards component

<div className="bg-white border rounded-lg p-6">
  <div className="text-sm text-gray-500 mb-1">Kombinerad investering</div>
  <div className="flex items-baseline gap-2">
    <span className="text-3xl font-bold text-gray-900">
      {formatSek(combinedResults.totalCostAfterGronTeknikSek)}
    </span>
    <span className="text-sm text-gray-500">totalt</span>
  </div>
  <div className="mt-2 text-sm text-gray-600">
    {combinedResults.totalCapacityKwh} kWh total kapacitet
  </div>
</div>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single battery only | Compare up to 4 batteries | Already implemented | Basis for this phase |
| No quantity support | Per-battery pricing | Already implemented | Extend with quantity field |

**Deprecated/outdated:**
- N/A - this is new functionality building on existing patterns

## Open Questions

Things that couldn't be fully resolved:

1. **Mixed Models in Kombo Mode**
   - What we know: User can add different battery models
   - What's unclear: Should Kombo mode require same model for simplicity, or allow mixing?
   - Recommendation: Allow mixing (more flexible), but show warning if efficiencies differ significantly

2. **Installation Cost Scaling**
   - What we know: First battery has full installation, additional units may have reduced cost
   - What's unclear: Should we support per-unit installation cost or single "additional unit" rate?
   - Recommendation: Keep simple - installationCost per BatterySelection entry, user enters actual cost for that line

3. **Package Deal Pricing**
   - What we know: Closers might offer combo discounts
   - What's unclear: Whether to add explicit "package discount" field vs just editing total prices
   - Recommendation: No new field - closer adjusts individual prices to reflect deal (simpler)

4. **Gron Teknik Combined Calculation**
   - What we know: 48.5% deduction applies to combined investment
   - What's unclear: Whether there are caps that affect very large combos
   - Recommendation: Apply percentage to combined total (current logic), add cap check if needed later

## Sources

### Primary (HIGH confidence)
- `/Users/julian.nordgren/autokalkyl/src/stores/calculation-wizard-store.ts` - Existing store patterns
- `/Users/julian.nordgren/autokalkyl/src/components/calculations/wizard/steps/battery-step.tsx` - Current battery UI
- `/Users/julian.nordgren/autokalkyl/src/lib/calculations/engine.ts` - Calculation patterns
- `/Users/julian.nordgren/autokalkyl/src/components/public/public-battery-summary.tsx` - Expandable details pattern
- `/Users/julian.nordgren/autokalkyl/src/components/calculations/results/comparison-view.tsx` - Comparison pattern

### Secondary (MEDIUM confidence)
- `/Users/julian.nordgren/autokalkyl/prisma/schema.prisma` - Database structure for storage considerations

### Tertiary (LOW confidence)
- None - all findings from verified codebase patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Existing codebase, no new dependencies
- Architecture: HIGH - Extending proven patterns
- Pitfalls: MEDIUM - Some edge cases need validation during implementation

**Research date:** 2026-02-05
**Valid until:** 2026-03-05 (30 days - stable patterns)
