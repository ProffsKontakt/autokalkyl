/**
 * Consumption profile presets for different household types.
 *
 * Each preset defines a typical consumption pattern that can be
 * applied to create a 12x24 consumption profile matrix.
 */

export interface ConsumptionPreset {
  id: string
  name: string
  description: string
  hourlyPattern: number[] // 24 values representing relative hourly consumption
  monthlyFactors: number[] // 12 values representing seasonal variation
}

/**
 * System presets available to all organizations.
 * Based on typical Swedish residential consumption patterns.
 */
export const SYSTEM_PRESETS: ConsumptionPreset[] = [
  {
    id: 'electric-heating',
    name: 'Elvärmning',
    description: 'Hög förbrukning vinter, låg sommar, jämn över dygnet',
    hourlyPattern: [
      3, 3, 2, 2, 2, 3, 5, 6, 5, 4, 4, 4, 4, 4, 4, 5, 6, 7, 6, 5, 5, 4, 4, 3,
    ],
    monthlyFactors: [1.5, 1.4, 1.2, 0.9, 0.6, 0.4, 0.3, 0.4, 0.6, 0.9, 1.2, 1.5],
  },
  {
    id: 'heat-pump',
    name: 'Värmepump',
    description: 'Hög förbrukning morgon/kväll, låg mitt på dagen',
    hourlyPattern: [
      3, 2, 2, 2, 2, 4, 7, 8, 5, 3, 3, 3, 3, 3, 3, 4, 6, 8, 7, 5, 4, 4, 3, 3,
    ],
    monthlyFactors: [1.3, 1.2, 1.0, 0.8, 0.7, 0.6, 0.6, 0.7, 0.8, 1.0, 1.2, 1.4],
  },
  {
    id: 'ev-charging',
    name: 'Elbilsladdning',
    description: 'Huvudsakligen nattetid, något kväll',
    hourlyPattern: [
      8, 8, 8, 8, 6, 4, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 3, 5, 6, 7, 8, 8, 8,
    ],
    monthlyFactors: [1.0, 1.0, 1.0, 1.0, 1.0, 0.9, 0.8, 0.9, 1.0, 1.0, 1.1, 1.1],
  },
  {
    id: 'solar-prosumer',
    name: 'Solcellsproducent',
    description: 'Låg egenanvändning dagtid tack vare solceller',
    hourlyPattern: [
      5, 4, 4, 3, 3, 4, 5, 3, 1, 1, 1, 1, 1, 1, 1, 2, 4, 6, 7, 7, 6, 5, 5, 5,
    ],
    monthlyFactors: [1.2, 1.1, 0.9, 0.7, 0.5, 0.4, 0.5, 0.6, 0.8, 1.0, 1.1, 1.2],
  },
]

/**
 * Apply a consumption preset to generate a 12x24 consumption matrix.
 *
 * The preset's hourly pattern and monthly factors are combined with
 * the annual kWh to produce realistic hourly values for each month.
 *
 * @param preset - The consumption preset to apply
 * @param annualKwh - Total annual consumption in kWh
 * @returns 12x24 matrix of hourly consumption values (kWh per hour)
 */
export function applyPreset(
  preset: ConsumptionPreset,
  annualKwh: number
): number[][] {
  const totalPatternSum = preset.hourlyPattern.reduce((a, b) => a + b, 0)
  const totalMonthlySum = preset.monthlyFactors.reduce((a, b) => a + b, 0)

  // Calculate monthly totals based on annual consumption
  const avgMonthlyKwh = annualKwh / 12
  const monthlyTotals = preset.monthlyFactors.map(
    (factor) => avgMonthlyKwh * factor * (12 / totalMonthlySum)
  )

  // Generate 12x24 matrix
  return monthlyTotals.map((monthTotal) => {
    // Distribute monthly total across hours based on pattern
    // Each value represents average kWh for that hour on a typical day
    return preset.hourlyPattern.map(
      (pct) => (monthTotal / 30) * (pct / totalPatternSum)
    )
  })
}

/**
 * Create an empty 12x24 consumption profile matrix.
 *
 * @returns Empty 12x24 matrix with all zeros
 */
export function createEmptyProfile(): number[][] {
  return Array(12)
    .fill(null)
    .map(() => Array(24).fill(0))
}

/**
 * Calculate total annual consumption from a profile matrix.
 *
 * @param profile - 12x24 consumption matrix
 * @returns Total annual kWh
 */
export function calculateProfileTotal(profile: number[][]): number {
  // Each value is hourly kWh for a typical day in that month
  // Multiply by 30 days to get monthly, then sum for annual
  return profile.reduce((annual, month) => {
    const monthlyTotal = month.reduce((daily, hour) => daily + hour, 0) * 30
    return annual + monthlyTotal
  }, 0)
}

/**
 * Scale a consumption profile to match a target annual total.
 *
 * @param profile - 12x24 consumption matrix
 * @param targetAnnualKwh - Desired annual consumption in kWh
 * @returns Scaled 12x24 matrix
 */
export function scaleProfileToTotal(
  profile: number[][],
  targetAnnualKwh: number
): number[][] {
  const currentTotal = calculateProfileTotal(profile)
  if (currentTotal === 0) return profile

  const scaleFactor = targetAnnualKwh / currentTotal
  return profile.map((month) => month.map((hour) => hour * scaleFactor))
}

/**
 * Get a preset by its ID.
 *
 * @param presetId - The preset ID to find
 * @returns The preset or undefined if not found
 */
export function getPresetById(presetId: string): ConsumptionPreset | undefined {
  return SYSTEM_PRESETS.find((p) => p.id === presetId)
}
