---
phase: 10-consumption-profiles
plan: 01
subsystem: calculations
tags: [tdd, consumption, heating-types, swedish-patterns]

dependency-graph:
  requires:
    - "08-01: HeatingType enum in Prisma schema"
  provides:
    - "HEATING_TYPE_PROFILES constant with 5 Swedish heating types"
    - "distributeAnnualConsumption function for monthly distribution"
    - "estimateAnnualConsumption function for Swedish household estimation"
  affects:
    - "10-02: Consumption wizard step will use these functions"
    - "10-03: Results page will visualize the distribution"

tech-stack:
  added:
    - "jest@30.2.0: Test framework"
    - "ts-jest@29.4.6: TypeScript test support"
    - "@types/jest@30.0.0: Jest type definitions"
  patterns:
    - "TDD workflow with RED-GREEN-REFACTOR"
    - "Factor normalization for exact sum preservation"

key-files:
  created:
    - "src/lib/calculations/consumption-profiles.ts"
    - "src/lib/calculations/consumption-profiles.test.ts"
    - "jest.config.js"
  modified:
    - "package.json: Added test scripts and Jest dependencies"
    - "pnpm-lock.yaml"

decisions:
  - id: CP-01
    decision: "Normalize monthly factors at runtime to ensure exact sum of 12"
    rationale: "Raw factors from research don't sum to exactly 12; normalizing ensures annual total is preserved"
  - id: CP-02
    decision: "Store raw factors separately and normalize in HEATING_TYPE_PROFILES"
    rationale: "Preserves original research data while ensuring mathematical correctness"

metrics:
  duration: 3m 7s
  completed: 2026-02-02
  tests: 18 passed
  coverage: consumption-profiles.ts fully tested
---

# Phase 10 Plan 01: Consumption Profile Distribution Summary

Pure calculation logic for distributing annual kWh across 12 months based on Swedish heating type profiles, with TDD workflow.

## What Was Built

### HEATING_TYPE_PROFILES Constant
Mapping from Prisma HeatingType enum to monthly consumption distribution:

| Type | Name | Seasonal Variation | Winter Factor | Summer Factor |
|------|------|-------------------|---------------|---------------|
| BERGVARME | Bergvarme | Low | ~1.33 | ~0.64 |
| FJARRVARME | Fjarrvarme | Very Low | ~1.06 | ~0.91 |
| DIREKTVERKANDE | Direktverkande el | High | ~1.64 | ~0.38 |
| LUFT_LUFT_VP | Luft-luft VP | Medium-High | ~1.46 | ~0.54 |
| LUFT_VATTEN_VP | Luft-vatten VP | Medium | ~1.40 | ~0.59 |

Each profile includes Swedish name, description (for tooltips), and 12 normalized monthly factors that sum to exactly 12.

### distributeAnnualConsumption Function
```typescript
distributeAnnualConsumption(annualKwh: number, heatingType: HeatingType): number[]
```
- Returns 12 monthly kWh values (Jan-Dec)
- Output always sums exactly to input annual value
- Winter months (Dec, Jan, Feb) > Summer months (Jun, Jul, Aug) for electric heating

### estimateAnnualConsumption Function
```typescript
estimateAnnualConsumption({ houseSizeM2, residents, heatingType }): number
```
- Formula: `houseSizeM2 * kwhPerM2 + residents * 2000`
- kWh/m2 values: DIREKTVERKANDE=120, LUFT_LUFT_VP=60, LUFT_VATTEN_VP=55, BERGVARME=50, FJARRVARME=0
- Result rounded to nearest 500 kWh

## Test Coverage

18 tests covering:
- All 5 heating types have valid profiles
- Monthly factors sum to exactly 12
- Winter > summer for electric heating types
- Flat profile for FJARRVARME (household electricity only)
- Annual total preservation in distribution
- Realistic estimation ranges (2000-75000 kWh)
- Edge cases (0 consumption)

## TDD Commits

1. `cfcba35` - test(10-01): add failing tests for consumption profiles
2. `3fac22f` - feat(10-01): implement consumption profile distribution

## Deviations from Plan

### Infrastructure Addition

**[Rule 3 - Blocking] Installed Jest test framework**
- **Found during:** RED phase (test creation)
- **Issue:** Project had no test framework installed
- **Fix:** Added jest, ts-jest, @types/jest; created jest.config.js
- **Files modified:** package.json, pnpm-lock.yaml, jest.config.js
- **Commit:** cfcba35

## Technical Notes

### Factor Normalization
The raw monthly factors from research sources don't sum to exactly 12:
- BERGVARME: 11.3 -> normalized
- FJARRVARME: 11.88 -> normalized
- DIREKTVERKANDE: 11.0 -> normalized
- LUFT_LUFT_VP: 11.11 -> normalized
- LUFT_VATTEN_VP: 11.12 -> normalized

Solution: `normalizeFactors()` helper ensures all profiles sum to exactly 12, preserving annual total when distributed.

### FJARRVARME Special Case
District heating (FJARRVARME) has near-flat monthly profile because:
- Heating is billed separately from electricity
- Only household electricity (lighting, appliances) goes through the battery
- Minimal seasonal variation

## Next Phase Readiness

Ready for 10-02 (Wizard Step UI):
- HEATING_TYPE_PROFILES provides name/description for radio buttons
- distributeAnnualConsumption provides chart data
- estimateAnnualConsumption powers estimation helper modal

No blockers.
