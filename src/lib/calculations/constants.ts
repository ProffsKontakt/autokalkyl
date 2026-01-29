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
export const DEFAULT_GRID_SERVICES_RATE = 600 // SEK/kW/year (market rate)
export const DEFAULT_CYCLES_PER_DAY = 1.5 // Standard daily cycling for home battery
export const DEFAULT_AVG_DISCHARGE_PERCENT = 85
export const DEFAULT_ANNUAL_CONSUMPTION_KWH = 20000
export const DEFAULT_ROUND_TRIP_EFFICIENCY = 0.8 // 80% round-trip efficiency
export const DEFAULT_POST_CAMPAIGN_RATE = 500 // SEK/kW/year after campaign

// Emaldo stodtjanster rates by zone (GRID-01, GRID-02)
export const EMALDO_STODTJANSTER_RATES = {
  SE1: 1110, // SEK/month
  SE2: 1110,
  SE3: 1110,
  SE4: 1370,
} as const

export const EMALDO_CAMPAIGN_MONTHS = 36 // Campaign duration in months

// Warning threshold for high cycles
export const HIGH_CYCLES_WARNING_THRESHOLD = 2

// Default spot price spread for simplified calculations (~1 SEK/kWh = 100 öre)
export const DEFAULT_SPOT_SPREAD_ORE = 100

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
