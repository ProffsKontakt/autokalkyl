/**
 * Unit conversion utilities for Swedish electricity pricing.
 *
 * Uses Decimal.js for precision in financial calculations.
 * Convention: Store values in ore/kWh internally, convert for display only.
 */

import Decimal from 'decimal.js'

// Swedish VAT rate (moms)
export const VAT_RATE_DECIMAL = new Decimal(0.25)

/**
 * Convert ore to SEK with precision.
 * 100 ore = 1 SEK
 */
export function oreToSek(ore: number | Decimal): Decimal {
  return new Decimal(ore).div(100)
}

/**
 * Convert SEK to ore with precision.
 * 1 SEK = 100 ore
 */
export function sekToOre(sek: number | Decimal): Decimal {
  return new Decimal(sek).mul(100)
}

/**
 * Apply VAT (moms 25%) to a price.
 * @param priceExVat Price excluding VAT
 * @returns Price including VAT
 */
export function applyVat(priceExVat: number | Decimal): Decimal {
  return new Decimal(priceExVat).mul(1.25)
}

/**
 * Remove VAT (moms 25%) from a price.
 * @param priceIncVat Price including VAT
 * @returns Price excluding VAT
 */
export function removeVat(priceIncVat: number | Decimal): Decimal {
  return new Decimal(priceIncVat).div(1.25)
}

/**
 * Format price in ore/kWh for display.
 * Examples: 150.00 -> "150,00 ore/kWh", 142.50 -> "142,50 ore/kWh"
 */
export function formatOrePerKwh(oreKwh: number | Decimal): string {
  const decimal = new Decimal(oreKwh)
  return `${decimal.toFixed(2).replace('.', ',')} ore/kWh`
}

/**
 * Format price in SEK/kWh for display.
 * Examples: 1.50 -> "1,50 kr/kWh", 1.4250 -> "1,43 kr/kWh"
 */
export function formatSekPerKwh(sekKwh: number | Decimal): string {
  const decimal = new Decimal(sekKwh)
  return `${decimal.toFixed(2).replace('.', ',')} kr/kWh`
}

/**
 * Format energy in kWh for display.
 * Examples: 15000 -> "15 000 kWh", 1500.5 -> "1 500,5 kWh"
 */
export function formatKwh(kwh: number | Decimal): string {
  const decimal = new Decimal(kwh)
  const formatted = decimal.toFixed(decimal.mod(1).isZero() ? 0 : 1)
  // Add thousand separators
  const parts = formatted.split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return `${parts.join(',')} kWh`
}

/**
 * Sum monthly values to get annual total.
 * @param monthly Array of 12 monthly values
 * @returns Annual sum
 */
export function sumMonthlyToAnnual(monthly: number[]): Decimal {
  if (monthly.length !== 12) {
    throw new Error('Monthly array must have exactly 12 elements')
  }
  return monthly.reduce((sum, val) => new Decimal(sum).plus(val), new Decimal(0))
}

/**
 * Distribute annual value evenly across 12 months.
 * @param annual Annual total
 * @returns Array of 12 equal monthly values
 */
export function distributeAnnualToMonthly(annual: number): number[] {
  const monthlyValue = new Decimal(annual).div(12)
  return Array(12).fill(monthlyValue.toNumber())
}

/**
 * Calculate average from monthly values.
 * @param monthly Array of 12 monthly values
 * @returns Average value
 */
export function averageMonthly(monthly: number[]): Decimal {
  if (monthly.length !== 12) {
    throw new Error('Monthly array must have exactly 12 elements')
  }
  return sumMonthlyToAnnual(monthly).div(12)
}
