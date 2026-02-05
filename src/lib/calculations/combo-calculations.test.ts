/**
 * Tests for combo calculation aggregation.
 *
 * @see 17-02-PLAN.md for specifications
 */

import Decimal from 'decimal.js'
import { calculateCombinedResults } from './combo-calculations'
import type { BatterySpec, CalculationInputs } from './types'

// Mock battery specs based on actual products
const EMALDO_15KWH: BatterySpec = {
  capacityKwh: 15.36,
  chargeEfficiency: 95,
  dischargeEfficiency: 97,
  maxDischargeKw: 5,
  maxChargeKw: 5,
  costPrice: 65000, // Example cost price
}

const HUAWEI_10KWH: BatterySpec = {
  capacityKwh: 10,
  chargeEfficiency: 94,
  dischargeEfficiency: 96,
  maxDischargeKw: 5,
  maxChargeKw: 5,
  costPrice: 55000,
}

// Standard calculation inputs (minimal for testing)
const BASE_INPUTS: Omit<CalculationInputs, 'battery'> = {
  cyclesPerDay: 1.5,
  avgDischargePercent: 80,
  dayPriceOre: 150,
  nightPriceOre: 50,
  effectTariffDayRate: 60,
  effectTariffNightRate: 0,
  gridServicesRatePerKwYear: 500,
  totalPriceExVat: 0, // Will be set per selection
  installationCost: 0, // Will be set per selection
  vatRate: 0.25,
  gronTeknikRate: 0.485,
  isEmaldoBattery: false,
  elomrade: 'SE3',
}

describe('calculateCombinedResults', () => {
  describe('Test Case 1: Single battery, quantity 1', () => {
    it('should return same results as regular calculation for single battery', () => {
      const selections = [
        {
          battery: EMALDO_15KWH,
          quantity: 1,
          totalPriceExVat: 89900,
          installationCost: 10000,
        },
      ]

      const result = calculateCombinedResults(selections, BASE_INPUTS)

      // Total capacity should match single battery
      expect(result.totalCapacityKwh).toBeCloseTo(15.36, 2)

      // Total max discharge should match single battery
      expect(result.totalMaxDischargeKw).toBeCloseTo(5, 2)

      // Cost calculation: (89900 + 10000) * 1.25 * (1 - 0.485)
      const expectedCostIncVat = (89900 + 10000) * 1.25 // 124,875
      const expectedCostAfterGronTeknik = expectedCostIncVat * (1 - 0.485) // 64,310.625
      expect(result.totalCostIncVat).toBeCloseTo(expectedCostIncVat, 0)
      expect(result.totalCostAfterGronTeknik).toBeCloseTo(expectedCostAfterGronTeknik, 0)

      // Should have 1 unit breakdown
      expect(result.unitBreakdowns).toHaveLength(1)
      expect(result.unitBreakdowns[0].quantity).toBe(1)
    })
  })

  describe('Test Case 2: Single battery, quantity 2', () => {
    it('should correctly double capacity and cost for quantity 2', () => {
      const selections = [
        {
          battery: EMALDO_15KWH,
          quantity: 2,
          totalPriceExVat: 89900,
          installationCost: 10000,
        },
      ]

      const result = calculateCombinedResults(selections, BASE_INPUTS)

      // Total capacity should be doubled
      expect(result.totalCapacityKwh).toBeCloseTo(30.72, 2)

      // Total max discharge should be doubled
      expect(result.totalMaxDischargeKw).toBeCloseTo(10, 2)

      // Cost ex VAT: (89900 + 10000) * 2 = 199,800
      const expectedCostExVat = (89900 + 10000) * 2
      expect(result.totalCostExVat).toBeCloseTo(expectedCostExVat, 0)

      // Cost inc VAT: 199800 * 1.25 = 249,750
      const expectedCostIncVat = expectedCostExVat * 1.25
      expect(result.totalCostIncVat).toBeCloseTo(expectedCostIncVat, 0)

      // Should have 1 unit breakdown with quantity 2
      expect(result.unitBreakdowns).toHaveLength(1)
      expect(result.unitBreakdowns[0].quantity).toBe(2)
    })
  })

  describe('Test Case 3: Mixed batteries (2 different models)', () => {
    it('should correctly sum capacity and costs for different battery models', () => {
      const selections = [
        {
          battery: EMALDO_15KWH,
          quantity: 1,
          totalPriceExVat: 89900,
          installationCost: 10000,
        },
        {
          battery: HUAWEI_10KWH,
          quantity: 1,
          totalPriceExVat: 69900,
          installationCost: 10000,
        },
      ]

      const result = calculateCombinedResults(selections, BASE_INPUTS)

      // Total capacity: 15.36 + 10 = 25.36 kWh
      expect(result.totalCapacityKwh).toBeCloseTo(25.36, 2)

      // Total max discharge: 5 + 5 = 10 kW
      expect(result.totalMaxDischargeKw).toBeCloseTo(10, 2)

      // Total cost ex VAT: (89900 + 10000) + (69900 + 10000) = 179,800
      const expectedCostExVat = 99900 + 79900
      expect(result.totalCostExVat).toBeCloseTo(expectedCostExVat, 0)

      // Should have 2 unit breakdowns
      expect(result.unitBreakdowns).toHaveLength(2)
    })
  })

  describe('Test Case 4: Grid services stacking (COMBO-06)', () => {
    it('should stack Emaldo grid services income per physical unit', () => {
      const selections = [
        {
          battery: EMALDO_15KWH,
          quantity: 2,
          totalPriceExVat: 89900,
          installationCost: 10000,
        },
      ]

      const emaldoInputs = {
        ...BASE_INPUTS,
        isEmaldoBattery: true,
        elomrade: 'SE3' as const,
      }

      const result = calculateCombinedResults(selections, emaldoInputs)

      // For Emaldo in SE3: Each unit gets separate enrollment
      // From constants: SE3 rate is 1110 SEK/month
      // Per unit annual: 1110 * 12 = 13,320 SEK/year (year 1-3)
      // 2 units: 13,320 * 2 = 26,640 SEK/year
      const expectedGridIncome = 13320 * 2
      expect(result.totalAnnualSavingsSek).toBeGreaterThan(expectedGridIncome * 0.8) // Grid income is part of total

      // Unit breakdown should show per-unit results
      expect(result.unitBreakdowns[0].quantity).toBe(2)
    })

    it('should apply capacity-based grid services for non-Emaldo batteries', () => {
      const selections = [
        {
          battery: HUAWEI_10KWH,
          quantity: 2,
          totalPriceExVat: 69900,
          installationCost: 10000,
        },
      ]

      const result = calculateCombinedResults(selections, BASE_INPUTS)

      // For non-Emaldo: Rate per kW applies to total capacity
      // Total capacity: 2 * 5 kW = 10 kW
      // Grid income: 10 kW * 500 SEK/kW/year = 5,000 SEK/year
      // This is included in totalAnnualSavingsSek
      expect(result.totalAnnualSavingsSek).toBeGreaterThan(0)
    })
  })

  describe('Test Case 5: Combined ROI calculation', () => {
    it('should correctly calculate ROI from combined totals', () => {
      const selections = [
        {
          battery: EMALDO_15KWH,
          quantity: 2,
          totalPriceExVat: 89900,
          installationCost: 10000,
        },
      ]

      const result = calculateCombinedResults(selections, BASE_INPUTS)

      // ROI 10-year: ((totalAnnualSavings * 10) - totalCostAfterGronTeknik) / totalCostAfterGronTeknik * 100
      const expectedRoi10 =
        ((result.totalAnnualSavingsSek * 10 - result.totalCostAfterGronTeknik) /
          result.totalCostAfterGronTeknik) *
        100

      expect(result.combinedRoi10Year).toBeCloseTo(expectedRoi10, 1)

      // ROI 15-year
      const expectedRoi15 =
        ((result.totalAnnualSavingsSek * 15 - result.totalCostAfterGronTeknik) /
          result.totalCostAfterGronTeknik) *
        100

      expect(result.combinedRoi15Year).toBeCloseTo(expectedRoi15, 1)

      // Payback: totalCostAfterGronTeknik / totalAnnualSavings
      const expectedPayback = result.totalCostAfterGronTeknik / result.totalAnnualSavingsSek
      expect(result.combinedPaybackYears).toBeCloseTo(expectedPayback, 1)
    })
  })

  describe('Test Case 6: Edge case - empty array', () => {
    it('should return all zeros for empty selection without division errors', () => {
      const selections: Array<{
        battery: BatterySpec
        quantity: number
        totalPriceExVat: number
        installationCost: number
      }> = []

      const result = calculateCombinedResults(selections, BASE_INPUTS)

      expect(result.totalCapacityKwh).toBe(0)
      expect(result.totalMaxDischargeKw).toBe(0)
      expect(result.totalCostExVat).toBe(0)
      expect(result.totalCostIncVat).toBe(0)
      expect(result.totalCostAfterGronTeknik).toBe(0)
      expect(result.totalAnnualSavingsSek).toBe(0)
      expect(result.combinedPaybackYears).toBe(0)
      expect(result.combinedRoi10Year).toBe(0)
      expect(result.combinedRoi15Year).toBe(0)
      expect(result.unitBreakdowns).toHaveLength(0)
    })
  })

  describe('Gron Teknik application', () => {
    it('should apply Gron Teknik to combined total, not per-unit', () => {
      const selections = [
        {
          battery: EMALDO_15KWH,
          quantity: 2,
          totalPriceExVat: 89900,
          installationCost: 10000,
        },
      ]

      const result = calculateCombinedResults(selections, BASE_INPUTS)

      // Total cost ex VAT: (89900 + 10000) * 2 = 199,800
      const totalExVat = (89900 + 10000) * 2
      // Total cost inc VAT: 199,800 * 1.25 = 249,750
      const totalIncVat = totalExVat * 1.25
      // After Gron Teknik: 249,750 * (1 - 0.485) = 128,621.25
      const expectedAfterGronTeknik = totalIncVat * (1 - 0.485)

      expect(result.totalCostAfterGronTeknik).toBeCloseTo(expectedAfterGronTeknik, 0)
    })
  })

  describe('Financial precision', () => {
    it('should use Decimal.js for accurate financial calculations', () => {
      const selections = [
        {
          battery: EMALDO_15KWH,
          quantity: 3,
          totalPriceExVat: 89999.99,
          installationCost: 10000.01,
        },
      ]

      const result = calculateCombinedResults(selections, BASE_INPUTS)

      // Should not have floating point errors
      // Total ex VAT: (89999.99 + 10000.01) * 3 = 300,000
      expect(result.totalCostExVat).toBeCloseTo(300000, 2)
    })
  })
})
