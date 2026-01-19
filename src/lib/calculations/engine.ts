/**
 * Battery ROI calculation engine.
 *
 * Orchestrates all individual formulas to produce complete calculation results.
 * Uses decimal.js for financial precision throughout the calculation chain.
 *
 * Implements LOGIC-10: Main calculation function.
 */

import Decimal from 'decimal.js'
import type { CalculationInputs, CalculationResults, CalculationResultsDecimal } from './types'
import {
  calcEffectiveCapacity,
  calcAnnualEnergy,
  calcSpotprisSavings,
  calcEffectTariffSavings,
  calcGridServicesIncome,
  calcTotalAnnualSavings,
  calcTotalIncVat,
  calcCostAfterGronTeknik,
  calcMargin,
  calcPaybackPeriod,
  calcRoi10Year,
  calcRoi15Year,
} from './formulas'

/**
 * LOGIC-10: Main calculation function using decimal.js for precision.
 *
 * Takes all inputs and returns both number results (for display/storage)
 * and Decimal results (for further calculations if needed).
 */
export function calculateBatteryROI(inputs: CalculationInputs): {
  results: CalculationResults
  decimals: CalculationResultsDecimal
} {
  // LOGIC-01
  const effectiveCapacity = calcEffectiveCapacity(
    inputs.battery.capacityKwh,
    inputs.battery.chargeEfficiency,
    inputs.battery.dischargeEfficiency,
    inputs.avgDischargePercent
  )

  // LOGIC-02
  const annualEnergy = calcAnnualEnergy(effectiveCapacity, inputs.cyclesPerDay)

  // LOGIC-03
  const spotprisSavings = calcSpotprisSavings(
    annualEnergy,
    inputs.dayPriceOre,
    inputs.nightPriceOre
  )

  // LOGIC-04
  const effectTariffSavings = calcEffectTariffSavings(
    inputs.battery.maxDischargeKw,
    inputs.effectTariffDayRate
  )

  // LOGIC-05
  const gridServicesIncome = calcGridServicesIncome(
    inputs.battery.maxDischargeKw,
    inputs.gridServicesRatePerKwYear
  )

  // LOGIC-06
  const totalAnnualSavings = calcTotalAnnualSavings(
    spotprisSavings,
    effectTariffSavings,
    gridServicesIncome
  )

  // CALC-11
  const totalIncVat = calcTotalIncVat(
    inputs.totalPriceExVat,
    inputs.installationCost,
    inputs.vatRate
  )

  // CALC-12
  const costAfterGronTeknik = calcCostAfterGronTeknik(totalIncVat, inputs.gronTeknikRate)

  // CALC-13 (optional)
  let marginSek: Decimal | undefined
  if (inputs.installerCut !== undefined && inputs.batteryCostPrice !== undefined) {
    marginSek = calcMargin(
      inputs.totalPriceExVat,
      inputs.batteryCostPrice,
      inputs.installerCut
    )
  }

  // LOGIC-07
  const paybackPeriod = calcPaybackPeriod(costAfterGronTeknik, totalAnnualSavings)

  // LOGIC-08
  const roi10Year = calcRoi10Year(costAfterGronTeknik, totalAnnualSavings)

  // LOGIC-09
  const roi15Year = calcRoi15Year(costAfterGronTeknik, totalAnnualSavings)

  const decimals: CalculationResultsDecimal = {
    effectiveCapacityPerCycleKwh: effectiveCapacity,
    energyFromBatteryPerYearKwh: annualEnergy,
    spotprisSavingsSek: spotprisSavings,
    effectTariffSavingsSek: effectTariffSavings,
    gridServicesIncomeSek: gridServicesIncome,
    totalAnnualSavingsSek: totalAnnualSavings,
    totalIncVatSek: totalIncVat,
    costAfterGronTeknikSek: costAfterGronTeknik,
    marginSek,
    paybackPeriodYears: paybackPeriod,
    roi10YearPercent: roi10Year,
    roi15YearPercent: roi15Year,
  }

  return {
    results: serializeResults(decimals),
    decimals,
  }
}

/**
 * Serialize Decimal results to numbers for JSON transport.
 *
 * Used when storing results in database or sending to client.
 */
export function serializeResults(decimals: CalculationResultsDecimal): CalculationResults {
  return {
    effectiveCapacityPerCycleKwh: decimals.effectiveCapacityPerCycleKwh.toNumber(),
    energyFromBatteryPerYearKwh: decimals.energyFromBatteryPerYearKwh.toNumber(),
    spotprisSavingsSek: decimals.spotprisSavingsSek.toNumber(),
    effectTariffSavingsSek: decimals.effectTariffSavingsSek.toNumber(),
    gridServicesIncomeSek: decimals.gridServicesIncomeSek.toNumber(),
    totalAnnualSavingsSek: decimals.totalAnnualSavingsSek.toNumber(),
    totalIncVatSek: decimals.totalIncVatSek.toNumber(),
    costAfterGronTeknikSek: decimals.costAfterGronTeknikSek.toNumber(),
    marginSek: decimals.marginSek?.toNumber(),
    paybackPeriodYears: decimals.paybackPeriodYears.toNumber(),
    roi10YearPercent: decimals.roi10YearPercent.toNumber(),
    roi15YearPercent: decimals.roi15YearPercent.toNumber(),
  }
}
