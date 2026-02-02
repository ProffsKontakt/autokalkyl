/**
 * Consumption profile distribution logic for Swedish households.
 *
 * Converts annual kWh + heating type into realistic monthly consumption
 * distribution based on Swedish residential patterns.
 *
 * @see 10-01-PLAN.md for specifications
 * @see 10-RESEARCH.md for source data
 */

import type { HeatingType } from '@prisma/client'

/**
 * Profile configuration for a heating type.
 */
export interface HeatingTypeProfile {
  /** Swedish display name */
  name: string
  /** Swedish tooltip description */
  description: string
  /** 12 monthly factors that sum to 12, representing relative consumption */
  monthlyFactors: number[]
}

/**
 * Mapping from HeatingType enum to consumption profile configuration.
 *
 * Monthly factors are indexed 0-11 (Jan-Dec) and sum to exactly 12.
 * A factor of 1.0 = average month, >1.0 = above average, <1.0 = below average.
 *
 * Sources:
 * - Swedish Energy Agency statistics
 * - hemsol.se, 1komma5.se consumption patterns
 * - bergvarme-kostnad.se seasonal data
 */
/**
 * Helper to normalize an array of factors to sum to exactly 12.
 */
function normalizeFactors(factors: number[]): number[] {
  const sum = factors.reduce((a, b) => a + b, 0)
  return factors.map((f) => (f * 12) / sum)
}

// Raw seasonal patterns from Swedish energy statistics (not normalized)
const RAW_FACTORS = {
  BERGVARME: [1.25, 1.2, 1.1, 0.9, 0.75, 0.65, 0.6, 0.65, 0.8, 1.0, 1.15, 1.25],
  FJARRVARME: [1.05, 1.03, 1.0, 0.98, 0.95, 0.92, 0.9, 0.92, 0.98, 1.02, 1.05, 1.08],
  DIREKTVERKANDE: [1.5, 1.4, 1.2, 0.9, 0.55, 0.4, 0.35, 0.4, 0.6, 0.95, 1.25, 1.5],
  LUFT_LUFT_VP: [1.35, 1.28, 1.12, 0.88, 0.68, 0.55, 0.5, 0.55, 0.72, 0.95, 1.18, 1.35],
  LUFT_VATTEN_VP: [1.3, 1.22, 1.08, 0.88, 0.7, 0.58, 0.55, 0.6, 0.75, 0.98, 1.18, 1.3],
} as const

export const HEATING_TYPE_PROFILES: Record<HeatingType, HeatingTypeProfile> = {
  BERGVARME: {
    name: 'Bergvarme',
    description: 'Grundvarmepump med COP 3-4. Stabil forbrukning aret runt.',
    // Lower seasonal variation due to heat pump efficiency
    monthlyFactors: normalizeFactors([...RAW_FACTORS.BERGVARME]),
  },
  FJARRVARME: {
    name: 'Fjarrvarme',
    description: 'Centralvarme fran energibolag. Endast hushallsel behover batteriet.',
    // Flat profile - only household electricity, heating is separate billing
    monthlyFactors: normalizeFactors([...RAW_FACTORS.FJARRVARME]),
  },
  DIREKTVERKANDE: {
    name: 'Direktverkande el',
    description: 'Elvarmeelement. Hogst elforbrukning pa vintern.',
    // Highest seasonal variation - direct correlation with heating need
    monthlyFactors: normalizeFactors([...RAW_FACTORS.DIREKTVERKANDE]),
  },
  LUFT_LUFT_VP: {
    name: 'Luft-luft VP',
    description: 'Luftvarmepump. Effektiv ned till ca -10C, sen tillskottsvame.',
    // Moderate seasonal variation, less efficient in deep winter
    monthlyFactors: normalizeFactors([...RAW_FACTORS.LUFT_LUFT_VP]),
  },
  LUFT_VATTEN_VP: {
    name: 'Luft-vatten VP',
    description: 'Varmepump for vattenburen varme. Bra COP men med vinterpeak.',
    // Similar to bergvarme but with more winter variation
    monthlyFactors: normalizeFactors([...RAW_FACTORS.LUFT_VATTEN_VP]),
  },
}

/**
 * Distribute annual kWh across 12 months based on heating type profile.
 *
 * @param annualKwh - Total annual consumption in kWh
 * @param heatingType - HeatingType enum value
 * @returns Array of 12 monthly kWh values (Jan-Dec) that sum to annualKwh
 *
 * @example
 * distributeAnnualConsumption(20000, 'DIREKTVERKANDE')
 * // Returns [~2500, ~2333, ~2000, ~1500, ~917, ~667, ~583, ~667, ~1000, ~1583, ~2083, ~2500]
 */
export function distributeAnnualConsumption(
  annualKwh: number,
  heatingType: HeatingType
): number[] {
  const profile = HEATING_TYPE_PROFILES[heatingType]
  const monthlyAvg = annualKwh / 12

  // Monthly factors are designed to sum to 12, so factor * avg = monthly value
  return profile.monthlyFactors.map((factor) => monthlyAvg * factor)
}

/**
 * kWh per square meter by heating type.
 *
 * Based on Swedish energy statistics for typical residential buildings.
 * FJARRVARME is 0 because district heating is billed separately.
 */
const HEATING_KWH_PER_M2: Record<HeatingType, number> = {
  DIREKTVERKANDE: 120, // Direct electric: highest consumption
  LUFT_LUFT_VP: 60, // Air-air HP: ~50% reduction
  LUFT_VATTEN_VP: 55, // Air-water HP: slightly more efficient
  BERGVARME: 50, // Ground source: most efficient
  FJARRVARME: 0, // District heating: no electric heating component
}

/**
 * Base household electricity per person in kWh/year.
 *
 * Covers lighting, appliances, cooking, etc. - independent of heating.
 */
const HOUSEHOLD_KWH_PER_PERSON = 2000

/**
 * Input parameters for consumption estimation.
 */
export interface EstimationInput {
  /** House size in square meters */
  houseSizeM2: number
  /** Number of residents */
  residents: number
  /** Heating type */
  heatingType: HeatingType
}

/**
 * Estimate annual electricity consumption for a Swedish household.
 *
 * Formula: (houseSizeM2 * kwhPerM2) + (residents * 2000)
 * Result is rounded to nearest 500 kWh for user-friendly display.
 *
 * @param input - House size, residents, and heating type
 * @returns Estimated annual kWh, rounded to nearest 500
 *
 * @example
 * estimateAnnualConsumption({ houseSizeM2: 150, residents: 4, heatingType: 'DIREKTVERKANDE' })
 * // Returns 26000 (150*120 + 4*2000 = 18000 + 8000 = 26000)
 *
 * estimateAnnualConsumption({ houseSizeM2: 100, residents: 2, heatingType: 'FJARRVARME' })
 * // Returns 4000 (100*0 + 2*2000 = 0 + 4000 = 4000, household electricity only)
 */
export function estimateAnnualConsumption(input: EstimationInput): number {
  const heatingKwh = input.houseSizeM2 * HEATING_KWH_PER_M2[input.heatingType]
  const householdKwh = input.residents * HOUSEHOLD_KWH_PER_PERSON
  const total = heatingKwh + householdKwh

  // Round to nearest 500 kWh
  return Math.round(total / 500) * 500
}
