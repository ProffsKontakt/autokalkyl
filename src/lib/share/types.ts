/**
 * TypeScript types for share link functionality.
 *
 * These types define the public-safe data structures for shared calculations.
 * Sensitive pricing information (margin, cost price, installer cut) is explicitly excluded.
 */

import type { Elomrade } from '@prisma/client'

// =============================================================================
// SHARE LINK SETTINGS
// =============================================================================

/**
 * Settings for creating/updating a share link.
 */
export interface ShareLinkSettings {
  expiresAt?: Date | null
  password?: string | null // Raw password, will be hashed
  customGreeting?: string | null
}

// =============================================================================
// PUBLIC-SAFE DATA STRUCTURES
// =============================================================================

/**
 * Public-safe battery info (excludes costPrice, margin).
 * This is what prospects see when viewing a shared calculation.
 */
export interface PublicBatteryInfo {
  name: string
  brandName: string
  brandLogoUrl: string | null
  capacityKwh: number
  maxDischargeKw: number
  maxChargeKw: number
  chargeEfficiency: number
  dischargeEfficiency: number
  warrantyYears: number
  guaranteedCycles: number
  degradationPerYear: number
  // Pricing shown to prospect (product cost only, NO margin details)
  totalPriceExVat: number
  totalPriceIncVat: number
  costAfterGronTeknik: number
}

/**
 * Results subset safe for public view.
 * Excludes: marginSek, costPriceTotal, installerCut - these are sensitive business data.
 */
export interface CalculationResultsPublic {
  totalPriceExVat: number
  totalPriceIncVat: number
  costAfterGronTeknik: number
  effectiveCapacityKwh: number
  annualEnergyKwh: number
  spotprisSavings: number
  effectTariffSavings: number
  gridServicesIncome: number
  totalAnnualSavings: number
  paybackYears: number
  roi10Year: number
  roi15Year: number
}

/**
 * Public calculation data structure.
 * This is the full payload returned to the public view page.
 * No sensitive pricing (margin, cost price, installer cut) is included.
 */
export interface PublicCalculationData {
  calculation: {
    id: string
    customerName: string
    elomrade: Elomrade
    annualConsumptionKwh: number
    consumptionProfile: { data: number[][] }
    customGreeting: string | null
    results: CalculationResultsPublic | null
    batteries: PublicBatteryInfo[]
    natagare: {
      name: string
      dayRateSekKw: number
      nightRateSekKw: number
      dayStartHour: number
      dayEndHour: number
    }
  }
  organization: {
    name: string
    slug: string
    logoUrl: string | null
    primaryColor: string
    secondaryColor: string
  }
  closer: {
    name: string
    // Phone exposed only if closer opts in (future enhancement)
  }
}

// =============================================================================
// VIEW STATISTICS
// =============================================================================

/**
 * View statistics for Closer dashboard.
 * Shows how many times a shared calculation has been viewed.
 */
export interface ViewStats {
  totalViews: number
  lastViewedAt: Date | null
  uniqueViews?: number // Future: count unique IP hashes
}
