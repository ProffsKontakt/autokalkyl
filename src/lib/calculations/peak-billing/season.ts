/**
 * Season utilities for peak billing calculations.
 *
 * Provides functions to determine winter months and high-load hours
 * based on natagare-specific tariff timing configuration.
 *
 * @see NATA-14 for requirements
 */

/**
 * Configuration for high-load hour determination.
 */
export interface HighLoadConfig {
  highLoadStartHour?: number
  highLoadEndHour?: number
  isWinterOnlyHighLoad?: boolean
}

/**
 * Check if a month is in winter season (Nov-Mar).
 * Used for isWinterOnlyHighLoad natagare configuration.
 *
 * Winter months: November (10), December (11), January (0), February (1), March (2)
 *
 * @param month 0-indexed month (0 = January, 11 = December)
 * @returns true if month is in winter season
 */
export function isWinterMonth(month: number): boolean {
  return month >= 10 || month <= 2
}

/**
 * Check if an hour is within high-load period.
 * Respects winter-only flag if configured.
 *
 * Default high-load period: 07:00-20:00 (exclusive end)
 *
 * @param hour Hour of day (0-23)
 * @param month Month (0-11, used for winter-only check)
 * @param config High-load configuration from natagare
 * @returns true if hour is within high-load period (considering season)
 */
export function isHighLoadHour(
  hour: number,
  month: number,
  config: HighLoadConfig
): boolean {
  const {
    highLoadStartHour = 7,
    highLoadEndHour = 20,
    isWinterOnlyHighLoad = false,
  } = config

  // If winter-only and not winter, no high-load applies
  if (isWinterOnlyHighLoad && !isWinterMonth(month)) {
    return false
  }

  // Simple range check (no overnight wrap for high-load periods)
  return hour >= highLoadStartHour && hour < highLoadEndHour
}
