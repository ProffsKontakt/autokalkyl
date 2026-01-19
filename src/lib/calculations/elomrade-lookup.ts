/**
 * Swedish electricity price zone (elomrade) lookup from postal codes.
 *
 * Sweden is divided into four electricity price zones (SE1-SE4)
 * based on geographic regions. This module provides utilities
 * to auto-detect the zone from a customer's postal code.
 *
 * Note: No public API exists for this mapping, so we use a static
 * lookup table based on geographical postal code ranges.
 */

import type { Elomrade } from './types'

interface PostalCodeRange {
  start: number
  end: number
  elomrade: Elomrade
}

/**
 * Postal code ranges mapped to electricity price zones.
 *
 * Ranges are checked in order, with SE4 ranges listed before SE3
 * since SE3 is the catch-all for central Sweden.
 */
const POSTAL_CODE_RANGES: PostalCodeRange[] = [
  // SE1: Norrbotten (95xxx-98xxx)
  { start: 95000, end: 98999, elomrade: 'SE1' },
  // SE2: Jamtland, Vasternorrland, Dalarna (80xxx-89xxx)
  { start: 80000, end: 89999, elomrade: 'SE2' },
  // SE4: Skane, Blekinge (20xxx-29xxx)
  { start: 20000, end: 29999, elomrade: 'SE4' },
  // SE4: Kalmar (30xxx-39xxx)
  { start: 30000, end: 39999, elomrade: 'SE4' },
  // SE3: Everything else (10xxx-79xxx) - default/largest region
  { start: 10000, end: 79999, elomrade: 'SE3' },
]

/**
 * Look up the electricity price zone for a Swedish postal code.
 *
 * @param postalCode - Swedish postal code (with or without space)
 * @returns The elomrade (SE1-SE4) or null if postal code is invalid
 *
 * @example
 * lookupElomrade('12345') // => 'SE3'
 * lookupElomrade('211 47') // => 'SE4' (Malmo)
 * lookupElomrade('97346') // => 'SE1' (Lulea)
 */
export function lookupElomrade(postalCode: string): Elomrade | null {
  const cleaned = postalCode.replace(/\s/g, '')
  if (!/^\d{5}$/.test(cleaned)) return null

  const code = parseInt(cleaned, 10)
  for (const range of POSTAL_CODE_RANGES) {
    if (code >= range.start && code <= range.end) {
      return range.elomrade
    }
  }

  // Default to SE3 (largest region covering Stockholm, Gothenburg, etc.)
  return 'SE3'
}

/**
 * Validate that a string is a valid Swedish postal code format.
 *
 * @param postalCode - String to validate
 * @returns true if valid Swedish postal code format (5 digits)
 */
export function isValidSwedishPostalCode(postalCode: string): boolean {
  const cleaned = postalCode.replace(/\s/g, '')
  return /^\d{5}$/.test(cleaned)
}

/**
 * Format a postal code with the standard Swedish format (NNN NN).
 *
 * @param postalCode - Postal code to format
 * @returns Formatted postal code or original string if invalid
 */
export function formatPostalCode(postalCode: string): string {
  const cleaned = postalCode.replace(/\s/g, '')
  if (!/^\d{5}$/.test(cleaned)) return postalCode
  return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`
}
