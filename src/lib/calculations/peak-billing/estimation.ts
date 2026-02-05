/**
 * Peak estimation functions for Swedish households.
 *
 * Estimates monthly peak kW from consumption data based on heating type.
 * Used for auto-estimating peak targets in the calculation wizard.
 *
 * @see 11-02-PLAN.md for specifications
 * @see 11-RESEARCH.md for peak factor sources
 */

import type { HeatingType } from '@prisma/client'
import { HEATING_TYPE_PROFILES } from '../consumption-profiles'

/**
 * Peak factors by heating type.
 *
 * Represents the ratio of typical monthly peak kW to average hourly kW.
 * Higher values indicate more "peaky" consumption patterns.
 *
 * Sources:
 * - Swedish residential consumption patterns
 * - Ellevio effektavgift documentation
 * - hemsol.se, 1komma5.se consumption analysis
 */
const PEAK_FACTORS: Record<HeatingType, number> = {
  DIREKTVERKANDE: 3.5, // Electric heating: sharp peaks when heating kicks in
  LUFT_LUFT_VP: 2.8, // Air-air HP: moderate peaks
  LUFT_VATTEN_VP: 2.5, // Air-water HP: smoother with buffer tank
  BERGVARME: 2.2, // Ground source: most stable
  FJARRVARME: 2.0, // District heating: household peaks only
}

/**
 * Estimate monthly peak kW from monthly consumption data.
 *
 * Heuristic: Swedish residential peak is typically 2-3.5x average hourly load.
 * Peak factor varies by heating type (direktverkande has highest peaks).
 *
 * Formula: avgHourlyKw = monthlyKwh / (30 * 24), then multiply by peak factor.
 *
 * @param monthlyKwh - Monthly consumption in kWh
 * @param heatingType - HeatingType enum value
 * @returns Estimated peak kW for the month
 *
 * @example
 * estimateMonthlyPeakKw(2500, 'DIREKTVERKANDE')
 * // Returns ~12.2 kW (2500 / 720 * 3.5)
 */
export function estimateMonthlyPeakKw(
  monthlyKwh: number,
  heatingType: HeatingType
): number {
  const hoursInMonth = 30 * 24 // Approximate hours in a month
  const avgHourlyKw = monthlyKwh / hoursInMonth
  const peakFactor = PEAK_FACTORS[heatingType] ?? 2.5

  return avgHourlyKw * peakFactor
}

/**
 * Estimate peak kW from annual consumption.
 *
 * Uses the highest consumption month (December for electric heating types)
 * to estimate the peak. This represents the worst-case billing scenario.
 *
 * @param annualKwh - Annual consumption in kWh
 * @param heatingType - HeatingType enum value
 * @returns Estimated peak kW based on highest consumption month
 *
 * @example
 * estimatePeakFromAnnualConsumption(20000, 'DIREKTVERKANDE')
 * // December = ~2500 kWh for direktverkande (highest month)
 * // Returns ~12.2 kW
 */
export function estimatePeakFromAnnualConsumption(
  annualKwh: number,
  heatingType: HeatingType
): number {
  const profile = HEATING_TYPE_PROFILES[heatingType]

  // Find the highest monthly factor (typically December/January for heating types)
  const maxFactor = Math.max(...profile.monthlyFactors)

  // Calculate the highest month's consumption
  // monthlyFactors are normalized so factor * (annualKwh/12) = monthly kWh
  const highestMonthKwh = (annualKwh / 12) * maxFactor

  // Estimate peak from highest month
  return estimateMonthlyPeakKw(highestMonthKwh, heatingType)
}

/**
 * Get peak estimation with metadata.
 *
 * Returns both the estimated peak and context about how it was calculated.
 * Useful for displaying estimation source in UI.
 *
 * @param annualKwh - Annual consumption in kWh
 * @param heatingType - HeatingType enum value
 * @returns Object with estimated peak and metadata
 */
export function getDetailedPeakEstimation(
  annualKwh: number,
  heatingType: HeatingType
): {
  estimatedPeakKw: number
  highestMonthKwh: number
  peakFactor: number
  heatingTypeName: string
} {
  const profile = HEATING_TYPE_PROFILES[heatingType]
  const maxFactor = Math.max(...profile.monthlyFactors)
  const highestMonthKwh = (annualKwh / 12) * maxFactor
  const peakFactor = PEAK_FACTORS[heatingType] ?? 2.5

  return {
    estimatedPeakKw: estimateMonthlyPeakKw(highestMonthKwh, heatingType),
    highestMonthKwh,
    peakFactor,
    heatingTypeName: profile.name,
  }
}
