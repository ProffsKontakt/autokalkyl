/**
 * Swedish electricity fee calculations.
 *
 * Fees include:
 * - Energiskatt: Fixed rate per kWh (45 ore privatperson incl. moms, 36 ore foretag excl. moms)
 * - Overforingsavgift: Variable rate from natagare config (ore/kWh)
 *
 * For privatperson: rates already include moms (no separate calculation)
 * For foretag: rates exclude moms (display as-is)
 */

import Decimal from 'decimal.js'
import { ENERGISKATT_RATES, DEFAULT_OVERFORINGSAVGIFT_ORE_KWH } from './constants'
import type { CustomerType, FeeCalculationResult, FeeCalculationResultDecimal } from './types'

// Helper to create Decimal from number
const d = (n: number) => new Decimal(n)

/**
 * Calculate energiskatt (Swedish electricity tax).
 * Rate already includes moms for PRIVATPERSON, excludes for FORETAG.
 *
 * @param consumptionKwh - Annual electricity consumption in kWh
 * @param customerType - PRIVATPERSON or FORETAG
 * @returns Energiskatt amount in SEK
 */
export function calcEnergiskatt(consumptionKwh: number, customerType: CustomerType): Decimal {
  const rateOre =
    customerType === 'PRIVATPERSON'
      ? ENERGISKATT_RATES.PRIVATPERSON // 45 ore (incl. moms)
      : ENERGISKATT_RATES.FORETAG // 36 ore (excl. moms)

  return d(consumptionKwh).times(rateOre).div(100) // ore to SEK
}

/**
 * Get energiskatt rate for a customer type.
 *
 * @param customerType - PRIVATPERSON or FORETAG
 * @returns Rate in ore/kWh
 */
export function getEnergiskattRate(customerType: CustomerType): number {
  return customerType === 'PRIVATPERSON' ? ENERGISKATT_RATES.PRIVATPERSON : ENERGISKATT_RATES.FORETAG
}

/**
 * Calculate overforingsavgift (grid transfer fee).
 * Uses rate from natagare configuration, falls back to default if null.
 *
 * @param consumptionKwh - Annual electricity consumption in kWh
 * @param overforingsavgiftOreKwh - Rate in ore/kWh from natagare config (nullable)
 * @returns Overforingsavgift amount in SEK
 */
export function calcOverforingsavgift(
  consumptionKwh: number,
  overforingsavgiftOreKwh: number | null | undefined
): Decimal {
  const rateOre = overforingsavgiftOreKwh ?? DEFAULT_OVERFORINGSAVGIFT_ORE_KWH
  return d(consumptionKwh).times(rateOre).div(100) // ore to SEK
}

/**
 * Get effective overforingsavgift rate, using fallback if null.
 *
 * @param overforingsavgiftOreKwh - Rate from natagare config (nullable)
 * @returns Effective rate in ore/kWh
 */
export function getOverforingsavgiftRate(overforingsavgiftOreKwh: number | null | undefined): number {
  return overforingsavgiftOreKwh ?? DEFAULT_OVERFORINGSAVGIFT_ORE_KWH
}

/**
 * Calculate total electricity fees for purchased electricity.
 * Includes energiskatt + overforingsavgift.
 *
 * @param consumptionKwh - Annual electricity consumption in kWh
 * @param customerType - PRIVATPERSON or FORETAG
 * @param overforingsavgiftOreKwh - Rate from natagare config (nullable)
 * @returns Fee calculation result with all components
 */
export function calcTotalElectricityFees(
  consumptionKwh: number,
  customerType: CustomerType,
  overforingsavgiftOreKwh: number | null | undefined
): {
  result: FeeCalculationResult
  decimals: FeeCalculationResultDecimal
} {
  const energiskattSek = calcEnergiskatt(consumptionKwh, customerType)
  const overforingsavgiftSek = calcOverforingsavgift(consumptionKwh, overforingsavgiftOreKwh)
  const totalFeesSek = energiskattSek.plus(overforingsavgiftSek)

  const energiskattRateOre = getEnergiskattRate(customerType)
  const overforingsavgiftRateOre = getOverforingsavgiftRate(overforingsavgiftOreKwh)

  return {
    result: {
      energiskattSek: energiskattSek.toNumber(),
      energiskattRateOre,
      overforingsavgiftSek: overforingsavgiftSek.toNumber(),
      overforingsavgiftRateOre,
      totalFeesSek: totalFeesSek.toNumber(),
      customerType,
    },
    decimals: {
      energiskattSek,
      overforingsavgiftSek,
      totalFeesSek,
    },
  }
}

/**
 * Calculate savings from solar self-consumption (avoids all fees).
 * When solar is consumed directly, customer avoids paying:
 * - Electricity spot price
 * - Energiskatt
 * - Overforingsavgift
 *
 * @param selfConsumptionKwh - kWh of solar consumed directly
 * @param electricityPriceOreKwh - Spot price in ore/kWh
 * @param customerType - PRIVATPERSON or FORETAG
 * @param overforingsavgiftOreKwh - Rate from natagare config (nullable)
 * @returns Total savings in SEK from avoiding fees
 */
export function calcSolarSelfConsumptionSavings(
  selfConsumptionKwh: number,
  electricityPriceOreKwh: number,
  customerType: CustomerType,
  overforingsavgiftOreKwh: number | null | undefined
): Decimal {
  const energiskattRateOre = getEnergiskattRate(customerType)
  const overforingsavgiftRateOre = getOverforingsavgiftRate(overforingsavgiftOreKwh)

  // Total rate avoided per kWh (in ore)
  const totalAvoidedRateOre = d(electricityPriceOreKwh).plus(energiskattRateOre).plus(overforingsavgiftRateOre)

  return d(selfConsumptionKwh).times(totalAvoidedRateOre).div(100) // ore to SEK
}
