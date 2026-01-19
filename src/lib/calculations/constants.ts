/**
 * Business constants for battery ROI calculations.
 *
 * These values are used across the calculation engine and represent
 * Swedish market defaults and regulatory rates.
 */

// Tax and incentive rates
export const VAT_RATE = 0.25 // 25%
export const GRON_TEKNIK_RATE = 0.485 // 48.5% deduction

// Default calculation parameters
export const DEFAULT_GRID_SERVICES_RATE = 500 // SEK/kW/year
export const DEFAULT_CYCLES_PER_DAY = 1
export const DEFAULT_AVG_DISCHARGE_PERCENT = 85
export const DEFAULT_ANNUAL_CONSUMPTION_KWH = 20000

// Time windows (same as natagare defaults)
export const DEFAULT_DAY_START_HOUR = 6
export const DEFAULT_DAY_END_HOUR = 22

// Time constants
export const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Maj',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Okt',
  'Nov',
  'Dec',
] as const

export const HOURS = Array.from({ length: 24 }, (_, i) => i) as number[]

// Swedish month names (full)
export const MONTH_NAMES_SV = [
  'Januari',
  'Februari',
  'Mars',
  'April',
  'Maj',
  'Juni',
  'Juli',
  'Augusti',
  'September',
  'Oktober',
  'November',
  'December',
] as const
