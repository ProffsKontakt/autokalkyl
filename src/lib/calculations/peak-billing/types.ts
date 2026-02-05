/**
 * Types for peak billing calculations.
 *
 * Defines Swedish natagare-specific peak methods and billing structures.
 *
 * @see 11-01-PLAN.md for specifications
 */

import { z } from 'zod'

/**
 * Peak calculation methods supported by Swedish natagare.
 */
export type PeakMethod = 'SIMPLE_MAX' | 'N_PEAK_AVERAGE' | 'SEASONAL_PEAK'

/**
 * Averaging period for seasonal peak calculations.
 */
export type AvgPeriod = 'month' | 'quarter' | 'winter'

/**
 * Zod schema for peak method configuration validation.
 */
export const PeakMethodConfigSchema = z.object({
  method: z.enum(['SIMPLE_MAX', 'N_PEAK_AVERAGE', 'SEASONAL_PEAK']),
  numPeaks: z.number().int().min(1).max(10).optional(),
  avgPeriod: z.enum(['month', 'quarter', 'winter']).optional(),
  excludeWeekends: z.boolean().optional(),
  nightDiscountPercent: z.number().min(0).max(100).optional(),
  nightStartHour: z.number().int().min(0).max(23).optional(),
  nightEndHour: z.number().int().min(0).max(23).optional(),
  timeWindows: z.array(
    z.object({
      start: z.number().int().min(0).max(23),
      end: z.number().int().min(0).max(23),
    })
  ).optional(),
  highLoadStartHour: z.number().int().min(0).max(23).optional(),
  highLoadEndHour: z.number().int().min(0).max(23).optional(),
  isWinterOnlyHighLoad: z.boolean().optional(),
})

/**
 * Peak method configuration stored in natagare.
 */
export interface PeakMethodConfig {
  method: PeakMethod
  numPeaks?: number
  avgPeriod?: AvgPeriod
  excludeWeekends?: boolean
  nightDiscountPercent?: number
  nightStartHour?: number
  nightEndHour?: number
  timeWindows?: { start: number; end: number }[]
  highLoadStartHour?: number
  highLoadEndHour?: number
  isWinterOnlyHighLoad?: boolean
}

/**
 * Single daily/hourly peak measurement.
 */
export interface DailyPeak {
  peakKw: number
  hour?: number
  isNight: boolean
  month?: number  // 0-11 for seasonal calculations
  date?: Date
}

/**
 * Input for peak billing calculation.
 */
export interface PeakBillingInput {
  /** Monthly peak measurements with night flags */
  monthlyPeaks: DailyPeak[]
  /** Natagare-specific peak calculation config */
  config: PeakMethodConfig
  /** Battery max discharge power constraint */
  batteryMaxDischargeKw: number
  /** Target peak reduction in kW (optional) */
  targetPeakReductionKw?: number
  /** Effect tariff rate in SEK/kW/month (optional, for savings calc) */
  effectTariffSekKw?: number
}

/**
 * Result of peak billing calculation.
 */
export interface PeakBillingResult {
  /** Calculated billing peak (after method and discount applied) */
  billingPeakKw: number
  /** Peak calculation method used */
  method: PeakMethod
  /** Peak before battery reduction */
  beforePeakKw: number
  /** Peak after battery reduction */
  afterPeakKw: number
  /** Actual reduction achieved (may be less than target due to constraints) */
  actualReductionKw: number
  /** Whether battery constraint limited the reduction */
  isConstrained: boolean
  /** Human-readable constraint message if constrained */
  constraintReason: string | null
  /** Annual savings from peak reduction in SEK */
  annualSavingsSek?: number
}

/**
 * Parse peak method JSON string from natagare database.
 *
 * @param methodJson - JSON string or plain method name
 * @returns Parsed PeakMethodConfig with defaults
 */
export function parsePeakMethod(methodJson: string | null): PeakMethodConfig {
  if (!methodJson) {
    return { method: 'SIMPLE_MAX' }
  }

  try {
    const parsed = JSON.parse(methodJson)
    const result = PeakMethodConfigSchema.safeParse(parsed)
    if (result.success) {
      return result.data
    }
    // If parse fails, try treating as plain method name
    return { method: (methodJson as PeakMethod) || 'SIMPLE_MAX' }
  } catch {
    // Not JSON, treat as plain method name
    const validMethods: PeakMethod[] = ['SIMPLE_MAX', 'N_PEAK_AVERAGE', 'SEASONAL_PEAK']
    if (validMethods.includes(methodJson as PeakMethod)) {
      return { method: methodJson as PeakMethod }
    }
    return { method: 'SIMPLE_MAX' }
  }
}
