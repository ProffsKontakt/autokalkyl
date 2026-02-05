/**
 * Peak calculation methods for Swedish natagare billing.
 *
 * Implements different methods used by Swedish grid operators:
 * - SIMPLE_MAX: Highest single peak (most common)
 * - N_PEAK_AVERAGE: Average of N highest peaks (Ellevio)
 * - SEASONAL_PEAK: Winter/seasonal averaging (Vattenfall)
 *
 * @see 11-01-PLAN.md for specifications
 */

import { applyNightDiscount } from './night-discount'
import type { DailyPeak, AvgPeriod } from './types'

/**
 * Calculate billing peak using simple maximum method.
 *
 * Returns the single highest peak from the measurement period.
 * Does NOT apply night discount - raw maximum.
 *
 * @param peaks - Array of daily peak measurements
 * @returns Highest peak value in kW
 */
export function calculateSimpleMax(peaks: DailyPeak[]): number {
  if (peaks.length === 0) {
    return 0
  }

  return Math.max(...peaks.map((p) => p.peakKw))
}

/**
 * Calculate billing peak using N-peak average method (Ellevio style).
 *
 * Takes the N highest peaks, applies night discount if applicable,
 * then returns the average.
 *
 * @param peaks - Array of daily peak measurements
 * @param numPeaks - Number of top peaks to average (e.g., 3 for Ellevio)
 * @param nightDiscountPercent - Night discount percentage (0-100)
 * @returns Average of top N peaks in kW
 *
 * @example
 * // Ellevio: average of 3 highest peaks with 50% night discount
 * calculateNPeakAverage(peaks, 3, 50)
 */
export function calculateNPeakAverage(
  peaks: DailyPeak[],
  numPeaks: number,
  nightDiscountPercent: number
): number {
  if (peaks.length === 0) {
    return 0
  }

  // Apply night discount to each peak
  const adjustedPeaks = peaks.map((p) =>
    applyNightDiscount(p.peakKw, p.isNight, nightDiscountPercent)
  )

  // Sort descending
  const sorted = [...adjustedPeaks].sort((a, b) => b - a)

  // Take top N (or all if fewer than N)
  const topN = sorted.slice(0, Math.min(numPeaks, sorted.length))

  // Calculate average
  const sum = topN.reduce((acc, val) => acc + val, 0)
  return sum / topN.length
}

/**
 * Calculate billing peak using seasonal method (Vattenfall style).
 *
 * Groups peaks by time period (month, quarter, or winter season)
 * and returns the maximum of period averages.
 *
 * Winter months: November (10), December (11), January (0), February (1), March (2)
 *
 * @param peaks - Array of daily peak measurements with month field
 * @param avgPeriod - Averaging period type
 * @param nightDiscountPercent - Night discount percentage (0-100)
 * @returns Maximum period average in kW
 */
export function calculateSeasonalPeak(
  peaks: DailyPeak[],
  avgPeriod: AvgPeriod,
  nightDiscountPercent: number
): number {
  if (peaks.length === 0) {
    return 0
  }

  // Apply night discount to each peak
  const adjustedPeaks = peaks.map((p) => ({
    ...p,
    adjustedKw: applyNightDiscount(p.peakKw, p.isNight, nightDiscountPercent),
  }))

  switch (avgPeriod) {
    case 'winter': {
      // Winter months: Nov (10), Dec (11), Jan (0), Feb (1), Mar (2)
      const winterMonths = [0, 1, 2, 10, 11]
      const winterPeaks = adjustedPeaks.filter(
        (p) => p.month !== undefined && winterMonths.includes(p.month)
      )
      if (winterPeaks.length === 0) {
        return 0
      }
      const sum = winterPeaks.reduce((acc, p) => acc + p.adjustedKw, 0)
      return sum / winterPeaks.length
    }

    case 'month': {
      // Group by month, calculate average per month, return max
      const byMonth = new Map<number, number[]>()
      for (const p of adjustedPeaks) {
        if (p.month !== undefined) {
          if (!byMonth.has(p.month)) {
            byMonth.set(p.month, [])
          }
          byMonth.get(p.month)!.push(p.adjustedKw)
        }
      }

      if (byMonth.size === 0) {
        return 0
      }

      // Calculate average for each month
      const monthlyAverages: number[] = []
      for (const peaks of byMonth.values()) {
        const avg = peaks.reduce((a, b) => a + b, 0) / peaks.length
        monthlyAverages.push(avg)
      }

      // Return max of monthly averages
      return Math.max(...monthlyAverages)
    }

    case 'quarter': {
      // Group by quarter, calculate average per quarter, return max
      const getQuarter = (month: number): number => Math.floor(month / 3)
      const byQuarter = new Map<number, number[]>()

      for (const p of adjustedPeaks) {
        if (p.month !== undefined) {
          const q = getQuarter(p.month)
          if (!byQuarter.has(q)) {
            byQuarter.set(q, [])
          }
          byQuarter.get(q)!.push(p.adjustedKw)
        }
      }

      if (byQuarter.size === 0) {
        return 0
      }

      // Calculate average for each quarter
      const quarterlyAverages: number[] = []
      for (const peaks of byQuarter.values()) {
        const avg = peaks.reduce((a, b) => a + b, 0) / peaks.length
        quarterlyAverages.push(avg)
      }

      // Return max of quarterly averages
      return Math.max(...quarterlyAverages)
    }

    default:
      return 0
  }
}
