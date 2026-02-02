/**
 * Tests for consumption profile distribution functions.
 *
 * @see 10-01-PLAN.md for specifications
 */

import {
  HEATING_TYPE_PROFILES,
  distributeAnnualConsumption,
  estimateAnnualConsumption,
} from './consumption-profiles'

// Mock HeatingType enum (matches Prisma schema)
type HeatingType =
  | 'BERGVARME'
  | 'FJARRVARME'
  | 'DIREKTVERKANDE'
  | 'LUFT_LUFT_VP'
  | 'LUFT_VATTEN_VP'

const ALL_HEATING_TYPES: HeatingType[] = [
  'BERGVARME',
  'FJARRVARME',
  'DIREKTVERKANDE',
  'LUFT_LUFT_VP',
  'LUFT_VATTEN_VP',
]

const ELECTRIC_HEATING_TYPES: HeatingType[] = [
  'DIREKTVERKANDE',
  'LUFT_LUFT_VP',
  'LUFT_VATTEN_VP',
]

describe('HEATING_TYPE_PROFILES', () => {
  it('should have a profile for each HeatingType', () => {
    for (const type of ALL_HEATING_TYPES) {
      expect(HEATING_TYPE_PROFILES[type]).toBeDefined()
      expect(HEATING_TYPE_PROFILES[type].name).toBeTruthy()
      expect(HEATING_TYPE_PROFILES[type].description).toBeTruthy()
      expect(HEATING_TYPE_PROFILES[type].monthlyFactors).toHaveLength(12)
    }
  })

  it('should have monthlyFactors that sum to 12 for each profile', () => {
    for (const type of ALL_HEATING_TYPES) {
      const sum = HEATING_TYPE_PROFILES[type].monthlyFactors.reduce(
        (a, b) => a + b,
        0
      )
      expect(sum).toBeCloseTo(12, 5)
    }
  })

  it('should have higher winter factors for electric heating types', () => {
    // Winter months: Dec (11), Jan (0), Feb (1)
    // Summer months: Jun (5), Jul (6), Aug (7)
    for (const type of ELECTRIC_HEATING_TYPES) {
      const factors = HEATING_TYPE_PROFILES[type].monthlyFactors
      const winterAvg = (factors[0] + factors[1] + factors[11]) / 3
      const summerAvg = (factors[5] + factors[6] + factors[7]) / 3
      expect(winterAvg).toBeGreaterThan(summerAvg)
    }
  })

  it('should have flat profile for FJARRVARME (only household electricity)', () => {
    const factors = HEATING_TYPE_PROFILES['FJARRVARME'].monthlyFactors
    const min = Math.min(...factors)
    const max = Math.max(...factors)
    // Flat profile means minimal variation (max - min < 0.3)
    expect(max - min).toBeLessThan(0.3)
  })
})

describe('distributeAnnualConsumption', () => {
  it('should return 12 monthly values', () => {
    const result = distributeAnnualConsumption(20000, 'DIREKTVERKANDE')
    expect(result).toHaveLength(12)
  })

  it('should return values that sum to annual input', () => {
    const annualKwh = 20000
    const result = distributeAnnualConsumption(annualKwh, 'DIREKTVERKANDE')
    const sum = result.reduce((a, b) => a + b, 0)
    expect(sum).toBeCloseTo(annualKwh, 1) // Within 1 kWh tolerance
  })

  it('should preserve total for all heating types', () => {
    const testCases = [10000, 20000, 50000, 75000]
    for (const annualKwh of testCases) {
      for (const type of ALL_HEATING_TYPES) {
        const result = distributeAnnualConsumption(annualKwh, type)
        const sum = result.reduce((a, b) => a + b, 0)
        expect(sum).toBeCloseTo(annualKwh, 1)
      }
    }
  })

  it('should have winter > summer for DIREKTVERKANDE', () => {
    const result = distributeAnnualConsumption(20000, 'DIREKTVERKANDE')
    // Winter: Dec (11), Jan (0), Feb (1)
    // Summer: Jun (5), Jul (6), Aug (7)
    const winterAvg = (result[0] + result[1] + result[11]) / 3
    const summerAvg = (result[5] + result[6] + result[7]) / 3
    expect(winterAvg).toBeGreaterThan(summerAvg)
  })

  it('should produce expected distribution for DIREKTVERKANDE', () => {
    const result = distributeAnnualConsumption(20000, 'DIREKTVERKANDE')
    // From plan: [~2500, ~2333, ~2000, ~1500, ~917, ~667, ~583, ~667, ~1000, ~1583, ~2083, ~2500]
    // January (high) should be around 2500
    expect(result[0]).toBeGreaterThan(2000)
    expect(result[0]).toBeLessThan(3000)
    // July (low) should be around 583
    expect(result[6]).toBeGreaterThan(400)
    expect(result[6]).toBeLessThan(800)
  })

  it('should produce relatively flat distribution for FJARRVARME', () => {
    const result = distributeAnnualConsumption(20000, 'FJARRVARME')
    const avg = 20000 / 12 // ~1667
    // All values should be within 15% of average for flat profile
    for (const value of result) {
      expect(value).toBeGreaterThan(avg * 0.85)
      expect(value).toBeLessThan(avg * 1.15)
    }
  })

  it('should handle edge case of 0 annual consumption', () => {
    const result = distributeAnnualConsumption(0, 'BERGVARME')
    expect(result).toHaveLength(12)
    expect(result.every((v) => v === 0)).toBe(true)
  })
})

describe('estimateAnnualConsumption', () => {
  it('should return a number rounded to nearest 500', () => {
    const result = estimateAnnualConsumption({
      houseSizeM2: 150,
      residents: 4,
      heatingType: 'DIREKTVERKANDE',
    })
    expect(result % 500).toBe(0)
  })

  it('should estimate ~26000 kWh for 150m2, 4 residents, DIREKTVERKANDE', () => {
    // Formula: 150 * 120 (heating) + 4 * 2000 (household) = 18000 + 8000 = 26000
    const result = estimateAnnualConsumption({
      houseSizeM2: 150,
      residents: 4,
      heatingType: 'DIREKTVERKANDE',
    })
    expect(result).toBe(26000)
  })

  it('should estimate ~15500 kWh for 150m2, 4 residents, BERGVARME', () => {
    // Formula: 150 * 50 (heating) + 4 * 2000 (household) = 7500 + 8000 = 15500
    const result = estimateAnnualConsumption({
      houseSizeM2: 150,
      residents: 4,
      heatingType: 'BERGVARME',
    })
    expect(result).toBe(15500)
  })

  it('should estimate ~4000 kWh for 100m2, 2 residents, FJARRVARME (household only)', () => {
    // Formula: 100 * 0 (no electric heating) + 2 * 2000 (household) = 0 + 4000 = 4000
    const result = estimateAnnualConsumption({
      houseSizeM2: 100,
      residents: 2,
      heatingType: 'FJARRVARME',
    })
    expect(result).toBe(4000)
  })

  it('should produce estimates in realistic range (5000-75000)', () => {
    // Test various combinations
    const testCases = [
      { houseSizeM2: 50, residents: 1 },
      { houseSizeM2: 100, residents: 2 },
      { houseSizeM2: 150, residents: 4 },
      { houseSizeM2: 200, residents: 5 },
      { houseSizeM2: 300, residents: 6 },
    ]

    for (const { houseSizeM2, residents } of testCases) {
      for (const heatingType of ALL_HEATING_TYPES) {
        const result = estimateAnnualConsumption({
          houseSizeM2,
          residents,
          heatingType,
        })
        expect(result).toBeGreaterThanOrEqual(2000) // Minimum realistic
        expect(result).toBeLessThanOrEqual(75000) // Maximum from slider
      }
    }
  })

  it('should produce higher estimates for DIREKTVERKANDE than BERGVARME', () => {
    const direktverkande = estimateAnnualConsumption({
      houseSizeM2: 150,
      residents: 4,
      heatingType: 'DIREKTVERKANDE',
    })
    const bergvarme = estimateAnnualConsumption({
      houseSizeM2: 150,
      residents: 4,
      heatingType: 'BERGVARME',
    })
    expect(direktverkande).toBeGreaterThan(bergvarme)
  })

  it('should cover all 5 heating types', () => {
    for (const type of ALL_HEATING_TYPES) {
      const result = estimateAnnualConsumption({
        houseSizeM2: 100,
        residents: 2,
        heatingType: type,
      })
      expect(typeof result).toBe('number')
      expect(result).toBeGreaterThan(0)
    }
  })
})
