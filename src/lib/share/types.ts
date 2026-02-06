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
  // Phase 17: Quantity for combo investments
  quantity?: number
}

/**
 * Data for fees breakdown display (Phase 16)
 */
export interface FeesBreakdownData {
  consumptionKwh: number
  energiskattSek: number
  energiskattRateOre: number
  overforingsavgiftSek: number
  overforingsavgiftRateOre: number
  totalFeesSek: number
  customerType: 'PRIVATPERSON' | 'FORETAG'
}

/**
 * Breakdown data for public transparency view.
 * Includes calculation inputs for each savings category.
 * EXCLUDES: margins, org cuts, cost prices (TRANS-04)
 */
export interface CalculationBreakdownPublic {
  // Spotpris breakdown (SPOT-04)
  spotpris: {
    capacityKwh: number
    cyclesPerDay: number
    efficiency: number         // 0.8 for 80%
    spreadOre: number          // ~100 ore default
    annualSavingsSek: number
  }
  // Effektavgift breakdown (PEAK-04)
  effekt: {
    currentPeakKw: number
    peakShavingPercent: number
    actualPeakShavingKw: number
    newPeakKw: number
    tariffRateSekKw: number
    annualSavingsSek: number
    isConstrained: boolean
  }
  // Stodtjanster breakdown (GRID-05)
  stodtjanster: {
    elomrade: string
    isEmaldoBattery: boolean
    batteryCapacityKw: number
    guaranteedMonthlySek?: number
    guaranteedAnnualSek?: number
    postCampaignRatePerKwYear?: number
    postCampaignAnnualSek?: number
    displayedAnnualSek: number
  }
  // Fees breakdown (Phase 16)
  fees?: FeesBreakdownData
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
  paybackYears: number // Uses costAfterGronTeknik for Privatperson
  paybackYearsExVat?: number // Uses costExVat for Foretag
  roi10Year: number
  roi15Year: number
}

/**
 * Extended CalculationResultsPublic with breakdown support.
 */
export interface CalculationResultsPublicWithBreakdown extends CalculationResultsPublic {
  breakdown?: CalculationBreakdownPublic
}

/**
 * Phase 15: Customer electricity data for public view.
 * Contains customer type and electricity consumption details.
 */
export interface PublicElectricityData {
  customerType: string
  koptElKwh: number | null
  electricityPriceOreKwh: number | null
  hasSolar: boolean
  solarProductionKwh: number | null
  currentSelfConsumptionKwh: number | null
  projectedSelfConsumptionKwh: number | null
}

/**
 * Phase 17: Combined results for Komboinvestering mode.
 * Aggregated metrics and per-unit breakdowns for public display.
 */
export interface PublicCombinedResults {
  totalCapacityKwh: number
  totalMaxDischargeKw: number
  totalCostExVat: number
  totalCostIncVat: number
  totalCostAfterGronTeknik: number
  totalAnnualSavingsSek: number
  combinedPaybackYears: number // Uses costAfterGronTeknik for Privatperson
  combinedPaybackYearsExVat?: number // Uses costExVat for Foretag
  combinedRoi10Year: number
  combinedRoi15Year: number
  unitBreakdowns: PublicUnitBreakdown[]
}

/**
 * Phase 17: Per-unit breakdown for public display.
 */
export interface PublicUnitBreakdown {
  battery: {
    name: string
    capacityKwh: number
    maxDischargeKw: number
  }
  quantity: number
  perUnitResults: {
    totalPriceExVat: number
    totalPriceIncVat: number
    costAfterGronTeknik: number
    spotprisSavings: number
    effectTariffSavings: number
    gridServicesIncome: number
    totalAnnualSavings: number
    paybackYears: number
    paybackYearsExVat?: number
    roi10Year: number
    roi15Year: number
  }
  subtotalCapacityKwh: number
  subtotalMaxDischargeKw: number
  subtotalAnnualSavingsSek: number
  subtotalCostAfterGronTeknikSek: number
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
    results: CalculationResultsPublicWithBreakdown | null
    batteries: PublicBatteryInfo[]
    natagare: {
      name: string
      dayRateSekKw: number
      nightRateSekKw: number
      dayStartHour: number
      dayEndHour: number
    }
    // Phase 15: Customer electricity data
    electricity?: PublicElectricityData
    // Phase 17: Combo mode and combined results
    comboMode?: 'komboinvestering' | 'jamfora'
    combinedResults?: PublicCombinedResults
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
// MANUAL OVERRIDES (Admin only - never exposed to public)
// =============================================================================

/**
 * Manual overrides that salespeople can apply to calculations.
 * These values replace calculated values when present.
 *
 * IMPORTANT: Overrides are NEVER included in public types.
 * They are applied server-side before filtering to public data (OVRD-04).
 */
export interface CalculationOverrides {
  // Savings total overrides (OVRD-01)
  spotprisSavingsSek?: number | null      // null = use calculated
  stodtjansterIncomeSek?: number | null
  effectTariffSavingsSek?: number | null

  // Input overrides (OVRD-02)
  cyclesPerDay?: number | null
  peakShavingPercent?: number | null
  postCampaignRate?: number | null
  spreadOre?: number | null
  tariffRateSekKw?: number | null
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
