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
  calcSpotprisSavingsV2,
  calcSpotprisSavingsV3,
  calcEffectTariffSavings,
  calcGridServicesIncome,
  calcTotalAnnualSavings,
  calcTotalIncVat,
  calcCostAfterGronTeknik,
  calcMargin,
  calcPaybackPeriod,
  calcPaybackPeriodExVat,
  calcRoi10Year,
  calcRoi15Year,
} from './formulas'
import { calculateActualPeakShaving } from './constraints'
import { EMALDO_STODTJANSTER_RATES, EMALDO_CAMPAIGN_MONTHS, DEFAULT_ROUND_TRIP_EFFICIENCY, DEFAULT_SPOT_SPREAD_ORE } from './constants'
import { calculatePeakBilling, parsePeakMethod, type DailyPeak, type PeakMethod } from './peak-billing'

// Helper to create Decimal from number
const d = (n: number) => new Decimal(n)

/**
 * Convert peak method type to human-readable Swedish display name.
 */
function getPeakMethodDisplayName(method: PeakMethod, numPeaks?: number): string {
  switch (method) {
    case 'N_PEAK_AVERAGE':
      return numPeaks ? `${numPeaks}-topp medel` : '3-topp medel'
    case 'SEASONAL_PEAK':
      return 'Sasongsmedel'
    case 'SIMPLE_MAX':
    default:
      return 'Enkel max'
  }
}

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

  // SPOT-01: Use simplified V3 formula with ~1 SEK/kWh spread
  // Example: 15 kWh × 0.8 × 1.5 cycles = 18 kWh/day × 1 SEK = 18 SEK/day × 365 = 6,570 SEK/year
  const spotprisSavings = calcSpotprisSavingsV3(
    inputs.battery.capacityKwh,
    inputs.cyclesPerDay,
    DEFAULT_ROUND_TRIP_EFFICIENCY,
    DEFAULT_SPOT_SPREAD_ORE,
    365
  )

  // PEAK-01, PEAK-02, PEAK-03: Peak shaving with capacity constraint
  let peakShavingResults: {
    targetKw: number
    actualKw: number
    newPeakKw: number
    isConstrained: boolean
    constraintMessage: string | null
  }
  if (inputs.currentPeakKw && inputs.peakShavingPercent && inputs.peakShavingPercent > 0) {
    peakShavingResults = calculateActualPeakShaving(
      inputs.currentPeakKw,
      inputs.peakShavingPercent,
      inputs.battery.maxDischargeKw
    )
  } else {
    peakShavingResults = {
      actualKw: 0,
      newPeakKw: inputs.currentPeakKw || 0,
      targetKw: 0,
      isConstrained: false,
      constraintMessage: null
    }
  }

  // PEAK-03: Effect tariff savings based on actual kW shaved
  const effectTariffSavings = calcEffectTariffSavings(
    peakShavingResults.actualKw,
    inputs.effectTariffDayRate
  )

  // Phase 11: Peak billing calculation (PEAK-08, PEAK-09, PEAK-10)
  let peakBillingResults = {
    beforePeakKw: 0,
    afterPeakKw: 0,
    monthlySavingsSek: 0,
    annualSavingsSek: 0,
    methodUsed: 'Enkel max',
    nightDiscountApplied: false,
    wasConstrained: false,
    constraintReason: null as string | null,
  }

  if (inputs.natagareConfig && inputs.currentPeakKw) {
    const peakMethod = parsePeakMethod(inputs.natagareConfig.peakCalculationMethod)

    // Determine target peak reduction from wizard inputs or estimate from percentage
    const targetReductionKw = inputs.targetAveragePeakKw
      ? inputs.currentPeakKw - inputs.targetAveragePeakKw
      : (inputs.peakShavingPercent ?? 0) / 100 * inputs.currentPeakKw

    // Create synthetic monthly peaks for the calculation
    // Use currentPeakKw as the representative peak for each month
    // Night hours: assume daytime peak for billing purposes (worst case)
    const monthlyPeaks: DailyPeak[] = Array.from({ length: 12 }, (_, month) => ({
      peakKw: inputs.currentPeakKw!,
      month,
      isNight: false, // Default to day peak (no discount assumed)
      hour: 18, // Typical peak hour
    }))

    // Calculate peak billing with constraints
    const billingResult = calculatePeakBilling({
      monthlyPeaks,
      config: {
        method: peakMethod.method,
        numPeaks: peakMethod.numPeaks,
        avgPeriod: peakMethod.avgPeriod,
        nightDiscountPercent: inputs.natagareConfig.nightDiscountPercent ?? 0,
        nightStartHour: inputs.natagareConfig.peakNightStartHour ?? 22,
        nightEndHour: inputs.natagareConfig.peakNightEndHour ?? 6,
      },
      batteryMaxDischargeKw: inputs.battery.maxDischargeKw,
      targetPeakReductionKw: targetReductionKw > 0 ? targetReductionKw : undefined,
      effectTariffSekKw: inputs.natagareConfig.dayRateSekKw,
    })

    const monthlySavings = billingResult.actualReductionKw * inputs.natagareConfig.dayRateSekKw

    peakBillingResults = {
      beforePeakKw: billingResult.beforePeakKw,
      afterPeakKw: billingResult.afterPeakKw,
      monthlySavingsSek: monthlySavings,
      annualSavingsSek: billingResult.annualSavingsSek ?? monthlySavings * 12,
      methodUsed: getPeakMethodDisplayName(peakMethod.method, peakMethod.numPeaks),
      nightDiscountApplied: (inputs.natagareConfig.nightDiscountPercent ?? 0) > 0,
      wasConstrained: billingResult.isConstrained,
      constraintReason: billingResult.constraintReason,
    }
  }

  // GRID-01, GRID-02, GRID-03, GRID-04: Stodtjanster calculation
  const totalYears = inputs.totalProjectionYears || 10
  let stodtjansterGuaranteed = d(0)
  let stodtjansterPostCampaign = d(0)
  let stodtjansterAnnualYear1to3 = d(0) // Actual annual value for year 1-3
  let stodtjansterAnnualYear4Plus = d(0) // Actual annual value for year 4+

  if (inputs.isEmaldoBattery && inputs.elomrade) {
    // Emaldo: Zone-based guaranteed income (with optional override)
    const defaultMonthlyRate = EMALDO_STODTJANSTER_RATES[inputs.elomrade]
    const monthlyRate = inputs.emaldoGuaranteedMonthlyOverride ?? defaultMonthlyRate
    // Year 1-3: Guaranteed monthly rate × 12 = annual
    stodtjansterAnnualYear1to3 = d(monthlyRate).times(12) // e.g., 1110 × 12 = 13,320 SEK/year
    stodtjansterGuaranteed = d(monthlyRate).times(EMALDO_CAMPAIGN_MONTHS) // Total for 36 months

    // Post-campaign projection
    const campaignYears = EMALDO_CAMPAIGN_MONTHS / 12
    const postCampaignYears = Math.max(0, totalYears - campaignYears)
    const postCampaignAnnual = d(inputs.postCampaignRatePerKwYear || 500).times(inputs.battery.maxDischargeKw)
    stodtjansterAnnualYear4Plus = postCampaignAnnual
    stodtjansterPostCampaign = postCampaignAnnual.times(postCampaignYears)
  } else {
    // Non-Emaldo: Use gridServicesRatePerKwYear directly
    const annualRate = d(inputs.gridServicesRatePerKwYear).times(inputs.battery.maxDischargeKw)
    stodtjansterAnnualYear1to3 = annualRate
    stodtjansterAnnualYear4Plus = annualRate
    stodtjansterPostCampaign = annualRate.times(totalYears)
  }

  const stodtjansterTotal = stodtjansterGuaranteed.plus(stodtjansterPostCampaign)
  const stodtjansterAnnualAverage = stodtjansterTotal.div(totalYears)

  // For annual display, use actual year 1-3 value (not averaged) - more accurate for sales
  const gridServicesIncome = stodtjansterAnnualYear1to3

  // LOGIC-06: Use annual average for stodtjanster
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

  // Calculate cost ex VAT (for Foretag payback)
  const costExVat = d(inputs.totalPriceExVat).plus(inputs.installationCost)

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

  // LOGIC-07: Payback for Privatperson (using Gron Teknik subsidized cost)
  const paybackPeriod = calcPaybackPeriod(costAfterGronTeknik, totalAnnualSavings)

  // Payback for Foretag (using ex-VAT cost)
  const paybackPeriodExVat = calcPaybackPeriodExVat(costExVat, totalAnnualSavings)

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
    costExVatSek: costExVat,
    marginSek,
    paybackPeriodYears: paybackPeriod,
    paybackPeriodYearsExVat: paybackPeriodExVat,
    roi10YearPercent: roi10Year,
    roi15YearPercent: roi15Year,
    // Phase 6: Enhanced results
    peakShavingKw: peakShavingResults.actualKw,
    newPeakKw: peakShavingResults.newPeakKw,
    stodtjansterGuaranteedSek: stodtjansterGuaranteed,
    stodtjansterPostCampaignSek: stodtjansterPostCampaign,
    stodtjansterTotalSek: stodtjansterTotal,
    stodtjansterAnnualAverageSek: stodtjansterAnnualAverage,
    // Phase 11: Peak billing results
    peakBillingBeforeKw: peakBillingResults.beforePeakKw,
    peakBillingAfterKw: peakBillingResults.afterPeakKw,
    peakBillingMonthlySavingsSek: d(peakBillingResults.monthlySavingsSek),
    peakBillingAnnualSavingsSek: d(peakBillingResults.annualSavingsSek),
    peakMethodUsed: peakBillingResults.methodUsed,
    peakNightDiscountApplied: peakBillingResults.nightDiscountApplied,
    peakWasConstrained: peakBillingResults.wasConstrained,
    peakConstraintReason: peakBillingResults.constraintReason,
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
    costExVatSek: decimals.costExVatSek.toNumber(),
    marginSek: decimals.marginSek?.toNumber(),
    paybackPeriodYears: decimals.paybackPeriodYears.toNumber(),
    paybackPeriodYearsExVat: decimals.paybackPeriodYearsExVat?.toNumber(),
    roi10YearPercent: decimals.roi10YearPercent.toNumber(),
    roi15YearPercent: decimals.roi15YearPercent.toNumber(),
    // Phase 6: Enhanced results
    peakShavingKw: decimals.peakShavingKw,
    newPeakKw: decimals.newPeakKw,
    stodtjansterGuaranteedSek: decimals.stodtjansterGuaranteedSek?.toNumber(),
    stodtjansterPostCampaignSek: decimals.stodtjansterPostCampaignSek?.toNumber(),
    stodtjansterTotalSek: decimals.stodtjansterTotalSek?.toNumber(),
    stodtjansterAnnualAverageSek: decimals.stodtjansterAnnualAverageSek?.toNumber(),
    // Phase 11: Peak billing results
    peakBillingBeforeKw: decimals.peakBillingBeforeKw,
    peakBillingAfterKw: decimals.peakBillingAfterKw,
    peakBillingMonthlySavingsSek: decimals.peakBillingMonthlySavingsSek?.toNumber(),
    peakBillingAnnualSavingsSek: decimals.peakBillingAnnualSavingsSek?.toNumber(),
    peakMethodUsed: decimals.peakMethodUsed,
    peakNightDiscountApplied: decimals.peakNightDiscountApplied,
    peakWasConstrained: decimals.peakWasConstrained,
    peakConstraintReason: decimals.peakConstraintReason,
  }
}
