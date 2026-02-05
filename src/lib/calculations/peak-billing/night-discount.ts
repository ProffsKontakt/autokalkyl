/**
 * Night period detection and discount application for peak billing.
 *
 * Swedish natagare like Ellevio offer reduced peak tariffs during night hours.
 * Typical night period: 22:00 - 06:00.
 *
 * @see 11-01-PLAN.md for specifications
 */

/**
 * Check if an hour falls within the night period.
 *
 * Handles overnight wrap (e.g., 22:00 - 06:00 spans midnight).
 *
 * @param hour - Hour to check (0-23)
 * @param nightStart - Start of night period (0-23)
 * @param nightEnd - End of night period (0-23)
 * @returns true if hour is during night period
 *
 * @example
 * isNightHour(23, 22, 6) // true - late evening
 * isNightHour(3, 22, 6)  // true - early morning
 * isNightHour(12, 22, 6) // false - midday
 */
export function isNightHour(
  hour: number,
  nightStart: number,
  nightEnd: number
): boolean {
  // Same start and end means no night period
  if (nightStart === nightEnd) {
    return false
  }

  // Night wraps around midnight (e.g., 22:00 - 06:00)
  if (nightStart > nightEnd) {
    // Night period: nightStart <= hour < 24 OR 0 <= hour < nightEnd
    return hour >= nightStart || hour < nightEnd
  }

  // Night doesn't wrap (e.g., 00:00 - 06:00)
  return hour >= nightStart && hour < nightEnd
}

/**
 * Apply night discount to a peak value.
 *
 * @param peakKw - Original peak power in kW
 * @param isNight - Whether the peak occurred during night hours
 * @param discountPercent - Discount percentage (0-100)
 * @returns Adjusted peak value (reduced if night)
 *
 * @example
 * applyNightDiscount(10, true, 50)  // 5 - night peak halved
 * applyNightDiscount(10, false, 50) // 10 - day peak unchanged
 */
export function applyNightDiscount(
  peakKw: number,
  isNight: boolean,
  discountPercent: number
): number {
  if (!isNight || discountPercent === 0) {
    return peakKw
  }

  return peakKw * (1 - discountPercent / 100)
}
