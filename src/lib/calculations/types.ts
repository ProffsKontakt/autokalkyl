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
}

/**
 * Swedish electricity price zones.
 */
export type Elomrade = 'SE1' | 'SE2' | 'SE3' | 'SE4'
