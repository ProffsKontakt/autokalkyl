/**
 * Solar self-consumption calculation utilities.
 *
 * Models the relationship between solar production, self-consumption,
 * and battery storage for battery ROI calculations.
 *
 * Key concepts:
 * - Total solar production: How much electricity the solar panels generate
 * - Self-consumption: How much solar electricity is used on-site vs exported
 * - Without battery: Typical self-consumption is 25-40%
 * - With battery: Self-consumption can increase to 60-90%
 */

import Decimal from 'decimal.js'
import type { SolarInputs } from './types'

/**
 * Calculate net consumption with solar self-consumption.
 *
 * Net consumption = Purchased electricity - Solar self-consumed
 *
 * This represents how much electricity the customer still needs to
 * buy from the grid after accounting for solar self-consumption.
 *
 * @param purchasedElectricityKwh Annual grid purchases (kopt el)
 * @param solar Solar inputs or null if no solar
 * @returns Net consumption in kWh
 */
export function calculateNetConsumption(
  purchasedElectricityKwh: number,
  solar: SolarInputs | null
): Decimal {
  const purchased = new Decimal(purchasedElectricityKwh)

  if (!solar) {
    return purchased
  }

  const selfConsumed = new Decimal(solar.currentSelfConsumptionKwh)
  const result = purchased.minus(selfConsumed)

  // Net consumption cannot be negative (solar can't offset more than purchased)
  return result.lt(0) ? new Decimal(0) : result
}

/**
 * Calculate additional solar savings from battery storage.
 *
 * Battery increases self-consumption by storing excess solar during day
 * and discharging at night/peak times. The value is the avoided grid
 * purchases for the additional self-consumed electricity.
 *
 * @param solar Solar self-consumption inputs
 * @param electricityPriceOreKwh All-in electricity price in ore/kWh
 * @returns Annual savings in SEK from increased self-consumption
 */
export function calculateBatterySolarBenefit(
  solar: SolarInputs,
  electricityPriceOreKwh: number
): Decimal {
  const currentSelfConsumption = new Decimal(solar.currentSelfConsumptionKwh)
  const projectedSelfConsumption = new Decimal(solar.projectedSelfConsumptionKwh)

  // Additional self-consumption enabled by battery
  const additionalSelfConsumption = projectedSelfConsumption.minus(currentSelfConsumption)

  // Value of additional self-consumption (avoided grid purchases)
  // Convert ore to SEK: ore / 100 = SEK
  const pricePerKwhSek = new Decimal(electricityPriceOreKwh).div(100)
  return additionalSelfConsumption.mul(pricePerKwhSek)
}

/**
 * Convert self-consumption percentage to kWh.
 *
 * @param totalProductionKwh Total solar production
 * @param selfConsumptionPercent Self-consumption as percentage (0-100)
 * @returns Self-consumption in kWh
 */
export function percentToKwh(
  totalProductionKwh: number,
  selfConsumptionPercent: number
): Decimal {
  return new Decimal(totalProductionKwh)
    .mul(selfConsumptionPercent)
    .div(100)
}

/**
 * Convert self-consumption kWh to percentage.
 *
 * @param totalProductionKwh Total solar production
 * @param selfConsumptionKwh Self-consumption in kWh
 * @returns Self-consumption as percentage (0-100)
 */
export function kwhToPercent(
  totalProductionKwh: number,
  selfConsumptionKwh: number
): Decimal {
  if (totalProductionKwh === 0) {
    return new Decimal(0)
  }
  return new Decimal(selfConsumptionKwh)
    .div(totalProductionKwh)
    .mul(100)
}

/**
 * Validation result for solar inputs.
 */
export interface SolarValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Validate solar self-consumption inputs.
 *
 * Rules:
 * - Self-consumption cannot exceed total production
 * - Projected self-consumption should be >= current (battery improves it)
 * - Typical self-consumption without battery: 25-40%
 * - Typical self-consumption with battery: 60-90%
 *
 * @param solar Solar inputs to validate
 * @returns Validation result with errors and warnings
 */
export function validateSolarInputs(solar: SolarInputs): SolarValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Hard errors: invalid data
  if (solar.currentSelfConsumptionKwh > solar.totalProductionKwh) {
    errors.push('Nuvarande egenanvandning kan inte overskrida total solproduktion')
  }

  if (solar.projectedSelfConsumptionKwh > solar.totalProductionKwh) {
    errors.push('Beraknad egenanvandning kan inte overskrida total solproduktion')
  }

  if (solar.projectedSelfConsumptionKwh < solar.currentSelfConsumptionKwh) {
    errors.push('Beraknad egenanvandning bor vara hogre an nuvarande (batteri okar egenanvandning)')
  }

  // Soft warnings: unusual but valid values
  if (solar.totalProductionKwh > 0) {
    const currentRate = (solar.currentSelfConsumptionKwh / solar.totalProductionKwh) * 100
    const projectedRate = (solar.projectedSelfConsumptionKwh / solar.totalProductionKwh) * 100

    if (currentRate < 10) {
      warnings.push(`Nuvarande egenanvandning (${currentRate.toFixed(0)}%) ar ovanligt lag (typiskt 25-40% utan batteri)`)
    } else if (currentRate > 60) {
      warnings.push(`Nuvarande egenanvandning (${currentRate.toFixed(0)}%) ar ovanligt hog utan batteri (typiskt 25-40%)`)
    }

    if (projectedRate < 50) {
      warnings.push(`Beraknad egenanvandning (${projectedRate.toFixed(0)}%) ar lag for batteri (typiskt 60-90%)`)
    } else if (projectedRate > 95) {
      warnings.push(`Beraknad egenanvandning (${projectedRate.toFixed(0)}%) ar mycket hog (typiskt max 90% med batteri)`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Suggest typical self-consumption values based on solar production.
 *
 * Useful for pre-filling form fields with reasonable defaults.
 *
 * @param totalProductionKwh Total annual solar production
 * @returns Suggested current (without battery) and projected (with battery) self-consumption
 */
export function suggestSelfConsumption(totalProductionKwh: number): {
  currentKwh: number
  projectedKwh: number
  currentPercent: number
  projectedPercent: number
} {
  // Typical self-consumption rates
  const TYPICAL_CURRENT_RATE = 0.30 // 30% without battery
  const TYPICAL_PROJECTED_RATE = 0.75 // 75% with battery

  const currentKwh = new Decimal(totalProductionKwh).mul(TYPICAL_CURRENT_RATE).toNumber()
  const projectedKwh = new Decimal(totalProductionKwh).mul(TYPICAL_PROJECTED_RATE).toNumber()

  return {
    currentKwh,
    projectedKwh,
    currentPercent: TYPICAL_CURRENT_RATE * 100,
    projectedPercent: TYPICAL_PROJECTED_RATE * 100,
  }
}
