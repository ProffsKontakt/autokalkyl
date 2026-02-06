/**
 * Combo calculation aggregation for multi-battery configurations.
 *
 * Combines multiple battery results into unified totals with per-unit breakdowns.
 *
 * @see 17-02-PLAN.md for specifications
 */

import Decimal from 'decimal.js'
import { calculateBatteryROI } from './engine'
import type {
  BatterySelection,
  CalculationInputs,
  CombinedResults,
  UnitBreakdown,
} from './types'

// Helper to create Decimal from number
const d = (n: number) => new Decimal(n)

/**
 * Calculate combined results for multiple battery selections.
 *
 * Takes an array of battery selections with quantities and returns aggregated
 * metrics including combined costs, savings, and ROI calculations.
 *
 * Implementation notes:
 * - Each battery is calculated individually using calculateBatteryROI
 * - Results are multiplied by quantity for subtotals
 * - Subtotals are summed for combined metrics
 * - Gron Teknik applied to combined total (not per-unit)
 * - Grid services stack per physical unit for Emaldo (handled in engine)
 * - ROI/payback derived from combined totals
 *
 * @param selections - Array of battery selections with quantities and prices
 * @param baseInputs - Base calculation parameters (common across all batteries, including isEmaldoBattery flag)
 * @returns Combined results with aggregated metrics and per-unit breakdowns
 */
export function calculateCombinedResults(
  selections: BatterySelection[],
  baseInputs: Omit<CalculationInputs, 'battery' | 'totalPriceExVat' | 'installationCost'>
): CombinedResults {
  // Handle empty array edge case
  if (selections.length === 0) {
    return {
      totalCapacityKwh: 0,
      totalMaxDischargeKw: 0,
      totalCostExVat: 0,
      totalCostIncVat: 0,
      totalCostAfterGronTeknik: 0,
      totalAnnualSavingsSek: 0,
      combinedPaybackYears: 0,
      combinedRoi10Year: 0,
      combinedRoi15Year: 0,
      unitBreakdowns: [],
    }
  }

  // Initialize accumulators using Decimal for precision
  let totalCapacityKwh = d(0)
  let totalMaxDischargeKw = d(0)
  let totalCostExVat = d(0)
  let totalAnnualSavingsSek = d(0)

  const unitBreakdowns: UnitBreakdown[] = []

  // Calculate results for each battery selection
  for (const selection of selections) {
    const { battery, quantity, totalPriceExVat, installationCost } = selection

    // Calculate per-unit results using main engine
    // Note: isEmaldoBattery from baseInputs applies to all batteries in this combo
    const inputs: CalculationInputs = {
      ...baseInputs,
      battery,
      totalPriceExVat,
      installationCost,
    }

    const { results: perUnitResults } = calculateBatteryROI(inputs)

    // Calculate subtotals (per-unit * quantity)
    const subtotalCapacityKwh = d(battery.capacityKwh).times(quantity)
    const subtotalMaxDischargeKw = d(battery.maxDischargeKw).times(quantity)
    const subtotalAnnualSavingsSek = d(perUnitResults.totalAnnualSavingsSek).times(quantity)

    // For cost, multiply per-unit investment by quantity
    const perUnitCostExVat = d(totalPriceExVat).plus(installationCost)
    const subtotalCostExVat = perUnitCostExVat.times(quantity)

    // Accumulate totals
    totalCapacityKwh = totalCapacityKwh.plus(subtotalCapacityKwh)
    totalMaxDischargeKw = totalMaxDischargeKw.plus(subtotalMaxDischargeKw)
    totalCostExVat = totalCostExVat.plus(subtotalCostExVat)
    totalAnnualSavingsSek = totalAnnualSavingsSek.plus(subtotalAnnualSavingsSek)

    // Store per-unit breakdown (for detailed view)
    // Note: We calculate cost after Gron Teknik per-unit for breakdown display
    const perUnitCostAfterGronTeknik = d(perUnitResults.costAfterGronTeknikSek)
    const subtotalCostAfterGronTeknik = perUnitCostAfterGronTeknik.times(quantity)

    unitBreakdowns.push({
      battery,
      quantity,
      perUnitResults,
      subtotalCapacityKwh: subtotalCapacityKwh.toNumber(),
      subtotalMaxDischargeKw: subtotalMaxDischargeKw.toNumber(),
      subtotalAnnualSavingsSek: subtotalAnnualSavingsSek.toNumber(),
      subtotalCostAfterGronTeknikSek: subtotalCostAfterGronTeknik.toNumber(),
    })
  }

  // Apply VAT and Gron Teknik to COMBINED total (not per-unit)
  const vatRate = d(baseInputs.vatRate)
  const gronTeknikRate = d(baseInputs.gronTeknikRate)

  const totalCostIncVat = totalCostExVat.times(d(1).plus(vatRate))
  const totalCostAfterGronTeknik = totalCostIncVat.times(d(1).minus(gronTeknikRate))

  // Calculate combined ROI metrics from combined totals
  // Payback: totalCost / totalAnnualSavings
  const combinedPaybackYears = totalAnnualSavingsSek.gt(0)
    ? totalCostAfterGronTeknik.div(totalAnnualSavingsSek)
    : d(0)

  // ROI 10-year: ((totalSavings * 10) - totalCost) / totalCost * 100
  const roi10Year = totalCostAfterGronTeknik.gt(0)
    ? totalAnnualSavingsSek
        .times(10)
        .minus(totalCostAfterGronTeknik)
        .div(totalCostAfterGronTeknik)
        .times(100)
    : d(0)

  // ROI 15-year: ((totalSavings * 15) - totalCost) / totalCost * 100
  const roi15Year = totalCostAfterGronTeknik.gt(0)
    ? totalAnnualSavingsSek
        .times(15)
        .minus(totalCostAfterGronTeknik)
        .div(totalCostAfterGronTeknik)
        .times(100)
    : d(0)

  return {
    totalCapacityKwh: totalCapacityKwh.toNumber(),
    totalMaxDischargeKw: totalMaxDischargeKw.toNumber(),
    totalCostExVat: totalCostExVat.toNumber(),
    totalCostIncVat: totalCostIncVat.toNumber(),
    totalCostAfterGronTeknik: totalCostAfterGronTeknik.toNumber(),
    totalAnnualSavingsSek: totalAnnualSavingsSek.toNumber(),
    combinedPaybackYears: combinedPaybackYears.toNumber(),
    combinedRoi10Year: roi10Year.toNumber(),
    combinedRoi15Year: roi15Year.toNumber(),
    unitBreakdowns,
  }
}
