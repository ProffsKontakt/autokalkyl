/**
 * TypeScript types for battery ROI calculations.
 *
 * These types define the structure of calculation inputs and outputs,
 * used throughout the calculation engine and wizard components.
 */

import type Decimal from 'decimal.js'

/**
 * Consumption profile storing hourly consumption data for each month.
 * Data structure: 12 months x 24 hours matrix.
 */
export interface ConsumptionProfile {
  data: number[][] // [month][hour] - 12 months x 24 hours, values in kWh
}

/**
 * Battery specifications needed for ROI calculations.
 */
export interface BatterySpec {
  capacityKwh: number
  chargeEfficiency: number // percentage, e.g., 95
  dischargeEfficiency: number // percentage, e.g., 97
  maxDischargeKw: number
  maxChargeKw: number
  costPrice: number // SEK
}

/**
 * All inputs needed to calculate battery ROI.
 */
export interface CalculationInputs {
  battery: BatterySpec
  cyclesPerDay: number // typically 1-2
  avgDischargePercent: number // percentage, e.g., 85
  dayPriceOre: number // average day price ore/kWh
  nightPriceOre: number // average night price ore/kWh
  effectTariffDayRate: number // SEK/kW (from natagare)
  effectTariffNightRate: number // SEK/kW (from natagare)
  gridServicesRatePerKwYear: number // default 500 SEK/kW/year
  totalPriceExVat: number // SEK
  installationCost: number // SEK
  vatRate: number // 0.25 for 25%
  gronTeknikRate: number // 0.485 for 48.5%
  // For margin calculation (ProffsKontakt affiliates only)
  installerCut?: number // SEK
  batteryCostPrice?: number // SEK
  // Phase 6: Control parameters
  peakShavingPercent?: number // 0-100, from slider
  currentPeakKw?: number // Customer's current peak for shaving calc
  postCampaignRatePerKwYear?: number // SEK/kW/year after Emaldo campaign
  elomrade?: 'SE1' | 'SE2' | 'SE3' | 'SE4' // For zone-based stodtjanster
  isEmaldoBattery?: boolean // Determines stodtjanster calculation method
  totalProjectionYears?: number // For stodtjanster projection, default 10
}

/**
 * Calculated results from the ROI engine.
 * All monetary values in SEK.
 */
export interface CalculationResults {
  effectiveCapacityPerCycleKwh: number
  energyFromBatteryPerYearKwh: number
  spotprisSavingsSek: number
  effectTariffSavingsSek: number
  gridServicesIncomeSek: number
  totalAnnualSavingsSek: number
  totalIncVatSek: number
  costAfterGronTeknikSek: number
  marginSek?: number
  paybackPeriodYears: number
  roi10YearPercent: number
  roi15YearPercent: number
  // Phase 6: Enhanced results
  peakShavingKw?: number // Actual kW shaved (after constraint)
  newPeakKw?: number // Peak after shaving
  stodtjansterGuaranteedSek?: number // Emaldo guaranteed portion
  stodtjansterPostCampaignSek?: number // Post-campaign portion
  stodtjansterTotalSek?: number // Combined over projection period
  stodtjansterAnnualAverageSek?: number // Average per year
}

/**
 * Results with Decimal precision (used internally by engine).
 */
export interface CalculationResultsDecimal {
  effectiveCapacityPerCycleKwh: Decimal
  energyFromBatteryPerYearKwh: Decimal
  spotprisSavingsSek: Decimal
  effectTariffSavingsSek: Decimal
  gridServicesIncomeSek: Decimal
  totalAnnualSavingsSek: Decimal
  totalIncVatSek: Decimal
  costAfterGronTeknikSek: Decimal
  marginSek?: Decimal
  paybackPeriodYears: Decimal
  roi10YearPercent: Decimal
  roi15YearPercent: Decimal
  // Phase 6: Enhanced results
  peakShavingKw?: number // Actual kW shaved (after constraint)
  newPeakKw?: number // Peak after shaving
  stodtjansterGuaranteedSek?: Decimal // Emaldo guaranteed portion
  stodtjansterPostCampaignSek?: Decimal // Post-campaign portion
  stodtjansterTotalSek?: Decimal // Combined over projection period
  stodtjansterAnnualAverageSek?: Decimal // Average per year
}

/**
 * Swedish electricity price zones.
 */
export type Elomrade = 'SE1' | 'SE2' | 'SE3' | 'SE4'
