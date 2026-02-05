/**
 * Tests for peak billing calculation module.
 *
 * Tests Swedish natagare-specific peak methods (Ellevio N-peak averaging, night discount)
 * with battery constraint enforcement.
 *
 * @see 11-01-PLAN.md for specifications
 */

import {
  isNightHour,
  applyNightDiscount,
} from './night-discount'

import {
  calculateNPeakAverage,
  calculateSimpleMax,
  calculateSeasonalPeak,
} from './methods'

import { calculatePeakBilling } from './index'

import type { PeakMethodConfig, DailyPeak, PeakBillingInput } from './types'

describe('isNightHour', () => {
  // Default night period: 22:00 - 06:00

  it('should return true for hour 22 (start of night)', () => {
    expect(isNightHour(22, 22, 6)).toBe(true)
  })

  it('should return true for hour 23 (late night)', () => {
    expect(isNightHour(23, 22, 6)).toBe(true)
  })

  it('should return true for hour 0 (midnight)', () => {
    expect(isNightHour(0, 22, 6)).toBe(true)
  })

  it('should return true for hour 5 (early morning)', () => {
    expect(isNightHour(5, 22, 6)).toBe(true)
  })

  it('should return false for hour 6 (day starts)', () => {
    expect(isNightHour(6, 22, 6)).toBe(false)
  })

  it('should return false for hour 12 (midday)', () => {
    expect(isNightHour(12, 22, 6)).toBe(false)
  })

  it('should return false for hour 21 (evening before night)', () => {
    expect(isNightHour(21, 22, 6)).toBe(false)
  })

  // Edge cases with different night windows
  it('should handle custom night window (20:00 - 08:00)', () => {
    expect(isNightHour(20, 20, 8)).toBe(true)
    expect(isNightHour(7, 20, 8)).toBe(true)
    expect(isNightHour(8, 20, 8)).toBe(false)
    expect(isNightHour(19, 20, 8)).toBe(false)
  })

  it('should handle same start and end (no night period)', () => {
    expect(isNightHour(12, 6, 6)).toBe(false)
    expect(isNightHour(6, 6, 6)).toBe(false)
  })
})

describe('applyNightDiscount', () => {
  it('should halve peak when night with 50% discount', () => {
    expect(applyNightDiscount(10, true, 50)).toBe(5)
  })

  it('should not change peak when day (not night)', () => {
    expect(applyNightDiscount(10, false, 50)).toBe(10)
  })

  it('should not change peak when night but 0% discount', () => {
    expect(applyNightDiscount(10, true, 0)).toBe(10)
  })

  it('should apply 100% discount (peak becomes 0)', () => {
    expect(applyNightDiscount(10, true, 100)).toBe(0)
  })

  it('should handle decimal discount percentages', () => {
    expect(applyNightDiscount(10, true, 25)).toBe(7.5)
  })

  it('should handle decimal peak values', () => {
    expect(applyNightDiscount(8.5, true, 50)).toBe(4.25)
  })
})

describe('calculateSimpleMax', () => {
  it('should return highest peak from array', () => {
    const peaks: DailyPeak[] = [
      { peakKw: 10, isNight: false },
      { peakKw: 8, isNight: false },
      { peakKw: 6, isNight: false },
      { peakKw: 4, isNight: false },
      { peakKw: 2, isNight: false },
    ]
    expect(calculateSimpleMax(peaks)).toBe(10)
  })

  it('should return 0 for empty array', () => {
    expect(calculateSimpleMax([])).toBe(0)
  })

  it('should handle single peak', () => {
    const peaks: DailyPeak[] = [{ peakKw: 5, isNight: false }]
    expect(calculateSimpleMax(peaks)).toBe(5)
  })

  it('should ignore night flag (simple max does not apply discount)', () => {
    const peaks: DailyPeak[] = [
      { peakKw: 10, isNight: true },
      { peakKw: 8, isNight: false },
    ]
    expect(calculateSimpleMax(peaks)).toBe(10)
  })

  it('should handle all equal peaks', () => {
    const peaks: DailyPeak[] = [
      { peakKw: 5, isNight: false },
      { peakKw: 5, isNight: false },
      { peakKw: 5, isNight: false },
    ]
    expect(calculateSimpleMax(peaks)).toBe(5)
  })
})

describe('calculateNPeakAverage', () => {
  it('should average top N peaks without discount', () => {
    const peaks: DailyPeak[] = [
      { peakKw: 10, isNight: false },
      { peakKw: 8, isNight: false },
      { peakKw: 6, isNight: false },
      { peakKw: 4, isNight: false },
      { peakKw: 2, isNight: false },
    ]
    // Top 3: 10, 8, 6 -> avg = 8
    expect(calculateNPeakAverage(peaks, 3, 0)).toBe(8)
  })

  it('should average top 1 peak (same as max)', () => {
    const peaks: DailyPeak[] = [
      { peakKw: 10, isNight: false },
      { peakKw: 8, isNight: false },
      { peakKw: 6, isNight: false },
    ]
    expect(calculateNPeakAverage(peaks, 1, 0)).toBe(10)
  })

  it('should apply night discount before averaging', () => {
    const peaks: DailyPeak[] = [
      { peakKw: 10, isNight: true },  // -> 5 with 50% discount
      { peakKw: 8, isNight: false },
      { peakKw: 6, isNight: false },
    ]
    // After discount: 5, 8, 6 -> sorted: 8, 6, 5 -> top 2: 8, 6 -> avg = 7
    expect(calculateNPeakAverage(peaks, 2, 50)).toBe(7)
  })

  it('should handle all night peaks with full discount', () => {
    const peaks: DailyPeak[] = [
      { peakKw: 10, isNight: true },
      { peakKw: 8, isNight: true },
      { peakKw: 6, isNight: true },
    ]
    // After 50% discount: 5, 4, 3 -> avg of top 3 = 4
    expect(calculateNPeakAverage(peaks, 3, 50)).toBe(4)
  })

  it('should handle N larger than array length', () => {
    const peaks: DailyPeak[] = [
      { peakKw: 10, isNight: false },
      { peakKw: 8, isNight: false },
    ]
    // N=5 but only 2 peaks -> average all 2: (10 + 8) / 2 = 9
    expect(calculateNPeakAverage(peaks, 5, 0)).toBe(9)
  })

  it('should return 0 for empty array', () => {
    expect(calculateNPeakAverage([], 3, 0)).toBe(0)
  })

  it('should handle Ellevio typical case (3 peaks)', () => {
    const peaks: DailyPeak[] = [
      { peakKw: 12, isNight: false },
      { peakKw: 11, isNight: false },
      { peakKw: 10, isNight: false },
      { peakKw: 9, isNight: true },  // night -> 4.5 with 50% discount
      { peakKw: 8, isNight: false },
    ]
    // After discount: 12, 11, 10, 4.5, 8 -> sorted: 12, 11, 10, 8, 4.5
    // Top 3: 12, 11, 10 -> avg = 11
    expect(calculateNPeakAverage(peaks, 3, 50)).toBe(11)
  })
})

describe('calculateSeasonalPeak', () => {
  it('should average winter months only', () => {
    // Months: Nov (10), Dec (11), Jan (0), Feb (1), Mar (2)
    const peaks: DailyPeak[] = [
      { peakKw: 10, isNight: false, month: 0 },  // Jan
      { peakKw: 8, isNight: false, month: 1 },   // Feb
      { peakKw: 12, isNight: false, month: 6 },  // Jul - summer, excluded
      { peakKw: 6, isNight: false, month: 11 },  // Dec
    ]
    // Winter peaks: 10, 8, 6 -> avg = 8
    expect(calculateSeasonalPeak(peaks, 'winter', 0)).toBe(8)
  })

  it('should apply monthly average when period is month', () => {
    const peaks: DailyPeak[] = [
      { peakKw: 10, isNight: false, month: 0 },
      { peakKw: 8, isNight: false, month: 0 },
      { peakKw: 6, isNight: false, month: 1 },
    ]
    // Month 0: avg = 9, Month 1: avg = 6 -> max of monthly avgs = 9
    expect(calculateSeasonalPeak(peaks, 'month', 0)).toBe(9)
  })

  it('should return 0 for empty array', () => {
    expect(calculateSeasonalPeak([], 'winter', 0)).toBe(0)
  })
})

describe('calculatePeakBilling - integration', () => {
  const baseConfig: PeakMethodConfig = {
    method: 'N_PEAK_AVERAGE',
    numPeaks: 3,
    nightDiscountPercent: 50,
    nightStartHour: 22,
    nightEndHour: 6,
  }

  const simpleMaxConfig: PeakMethodConfig = {
    method: 'SIMPLE_MAX',
    nightDiscountPercent: 0,
    nightStartHour: 22,
    nightEndHour: 6,
  }

  it('should calculate billing peak with N_PEAK_AVERAGE method', () => {
    const input: PeakBillingInput = {
      monthlyPeaks: [
        { peakKw: 10, hour: 14, isNight: false },
        { peakKw: 9, hour: 15, isNight: false },
        { peakKw: 8, hour: 16, isNight: false },
        { peakKw: 7, hour: 17, isNight: false },
      ],
      config: baseConfig,
      batteryMaxDischargeKw: 10,
    }

    const result = calculatePeakBilling(input)

    // Top 3: 10, 9, 8 -> avg = 9
    expect(result.billingPeakKw).toBe(9)
    expect(result.method).toBe('N_PEAK_AVERAGE')
  })

  it('should calculate billing peak with SIMPLE_MAX method', () => {
    const input: PeakBillingInput = {
      monthlyPeaks: [
        { peakKw: 10, hour: 14, isNight: false },
        { peakKw: 8, hour: 15, isNight: false },
        { peakKw: 6, hour: 16, isNight: false },
      ],
      config: simpleMaxConfig,
      batteryMaxDischargeKw: 10,
    }

    const result = calculatePeakBilling(input)

    expect(result.billingPeakKw).toBe(10)
    expect(result.method).toBe('SIMPLE_MAX')
  })

  it('should apply night discount to billing peak', () => {
    const input: PeakBillingInput = {
      monthlyPeaks: [
        { peakKw: 10, hour: 23, isNight: true },   // night -> 5
        { peakKw: 8, hour: 14, isNight: false },
        { peakKw: 6, hour: 15, isNight: false },
      ],
      config: baseConfig,
      batteryMaxDischargeKw: 10,
    }

    const result = calculatePeakBilling(input)

    // After discount: 5, 8, 6 -> sorted: 8, 6, 5 -> avg of top 3 = 6.33...
    expect(result.billingPeakKw).toBeCloseTo(6.33, 1)
  })

  it('should return constraint info when battery limits shaving', () => {
    const input: PeakBillingInput = {
      monthlyPeaks: [
        { peakKw: 20, hour: 14, isNight: false },
        { peakKw: 18, hour: 15, isNight: false },
        { peakKw: 16, hour: 16, isNight: false },
      ],
      config: baseConfig,
      batteryMaxDischargeKw: 5,  // Can only deliver 5 kW
      targetPeakReductionKw: 10, // Want to reduce by 10 kW
    }

    const result = calculatePeakBilling(input)

    expect(result.isConstrained).toBe(true)
    expect(result.constraintReason).toContain('5')
    expect(result.actualReductionKw).toBe(5)
  })

  it('should not be constrained when battery can deliver target reduction', () => {
    const input: PeakBillingInput = {
      monthlyPeaks: [
        { peakKw: 10, hour: 14, isNight: false },
      ],
      config: simpleMaxConfig,
      batteryMaxDischargeKw: 10,
      targetPeakReductionKw: 5,
    }

    const result = calculatePeakBilling(input)

    expect(result.isConstrained).toBe(false)
    expect(result.constraintReason).toBeNull()
    expect(result.actualReductionKw).toBe(5)
  })

  it('should calculate before and after peak with reduction', () => {
    const input: PeakBillingInput = {
      monthlyPeaks: [
        { peakKw: 10, hour: 14, isNight: false },
        { peakKw: 9, hour: 15, isNight: false },
        { peakKw: 8, hour: 16, isNight: false },
      ],
      config: baseConfig,
      batteryMaxDischargeKw: 10,
      targetPeakReductionKw: 3,
    }

    const result = calculatePeakBilling(input)

    // Before: top 3 avg = 9
    expect(result.beforePeakKw).toBe(9)
    // After: 9 - 3 = 6
    expect(result.afterPeakKw).toBe(6)
  })

  it('should handle empty peaks array', () => {
    const input: PeakBillingInput = {
      monthlyPeaks: [],
      config: baseConfig,
      batteryMaxDischargeKw: 10,
    }

    const result = calculatePeakBilling(input)

    expect(result.billingPeakKw).toBe(0)
    expect(result.beforePeakKw).toBe(0)
    expect(result.afterPeakKw).toBe(0)
  })

  it('should calculate savings correctly', () => {
    const input: PeakBillingInput = {
      monthlyPeaks: [
        { peakKw: 10, hour: 14, isNight: false },
      ],
      config: simpleMaxConfig,
      batteryMaxDischargeKw: 10,
      targetPeakReductionKw: 5,
      effectTariffSekKw: 50,  // 50 SEK/kW/month
    }

    const result = calculatePeakBilling(input)

    // Before: 10 kW, After: 5 kW, Reduction: 5 kW
    // Savings: 5 kW * 50 SEK/kW * 12 months = 3000 SEK/year
    expect(result.annualSavingsSek).toBe(3000)
  })
})
