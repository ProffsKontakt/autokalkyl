/**
 * Peak billing calculation module.
 *
 * Main entry point for calculating Swedish natagare peak billing
 * with battery constraint enforcement.
 *
 * @see 11-01-PLAN.md for specifications
 */

import { calculateSimpleMax, calculateNPeakAverage, calculateSeasonalPeak } from './methods'
import type { PeakBillingInput, PeakBillingResult, PeakMethod } from './types'

// Re-export types and functions for external use
export { isNightHour, applyNightDiscount } from './night-discount'
export { isWinterMonth, isHighLoadHour, type HighLoadConfig } from './season'
export { calculateSimpleMax, calculateNPeakAverage, calculateSeasonalPeak } from './methods'
export {
  parsePeakMethod,
  PeakMethodConfigSchema,
  type PeakMethodConfig,
  type PeakBillingInput,
  type PeakBillingResult,
  type DailyPeak,
  type PeakMethod,
  type AvgPeriod,
} from './types'
export {
  estimateMonthlyPeakKw,
  estimatePeakFromAnnualConsumption,
  getDetailedPeakEstimation,
} from './estimation'

/**
 * Calculate peak billing using natagare-specific method.
 *
 * Orchestrates the complete peak billing calculation:
 * 1. Applies night discount if configured
 * 2. Calculates billing peak using configured method
 * 3. Applies battery constraints to reduction
 * 4. Returns before/after peaks and savings
 *
 * @param input - Peak billing input with peaks, config, and constraints
 * @returns Complete billing result with constraint info
 *
 * @example
 * const result = calculatePeakBilling({
 *   monthlyPeaks: [...],
 *   config: { method: 'N_PEAK_AVERAGE', numPeaks: 3, nightDiscountPercent: 50 },
 *   batteryMaxDischargeKw: 10,
 *   targetPeakReductionKw: 5,
 *   effectTariffSekKw: 50,
 * })
 */
export function calculatePeakBilling(input: PeakBillingInput): PeakBillingResult {
  const { monthlyPeaks, config, batteryMaxDischargeKw, targetPeakReductionKw, effectTariffSekKw } = input

  // Extract config with defaults
  const method: PeakMethod = config.method || 'SIMPLE_MAX'
  const numPeaks = config.numPeaks ?? 3
  const avgPeriod = config.avgPeriod ?? 'month'
  const nightDiscountPercent = config.nightDiscountPercent ?? 0

  // Calculate billing peak based on method
  let billingPeakKw: number

  switch (method) {
    case 'N_PEAK_AVERAGE':
      billingPeakKw = calculateNPeakAverage(
        monthlyPeaks,
        numPeaks,
        nightDiscountPercent
      )
      break

    case 'SEASONAL_PEAK':
      billingPeakKw = calculateSeasonalPeak(
        monthlyPeaks,
        avgPeriod,
        nightDiscountPercent
      )
      break

    case 'SIMPLE_MAX':
    default:
      billingPeakKw = calculateSimpleMax(monthlyPeaks)
      break
  }

  // Before reduction = calculated billing peak
  const beforePeakKw = billingPeakKw

  // Calculate actual reduction with battery constraint
  const targetReduction = targetPeakReductionKw ?? 0
  const isConstrained = targetReduction > batteryMaxDischargeKw
  const actualReductionKw = Math.min(targetReduction, batteryMaxDischargeKw)

  // After reduction
  const afterPeakKw = Math.max(0, beforePeakKw - actualReductionKw)

  // Constraint message
  const constraintReason = isConstrained
    ? `Batteriet kan max leverera ${batteryMaxDischargeKw.toFixed(1)} kW, men mal var ${targetReduction.toFixed(1)} kW.`
    : null

  // Calculate annual savings if tariff provided
  let annualSavingsSek: number | undefined
  if (effectTariffSekKw !== undefined && actualReductionKw > 0) {
    // Savings = reduction (kW) * tariff (SEK/kW/month) * 12 months
    annualSavingsSek = actualReductionKw * effectTariffSekKw * 12
  }

  return {
    billingPeakKw,
    method,
    beforePeakKw,
    afterPeakKw,
    actualReductionKw,
    isConstrained,
    constraintReason,
    annualSavingsSek,
  }
}
