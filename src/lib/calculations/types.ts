/**
 * TypeScript types for battery ROI calculations.
 *
 * These types define the structure of calculation inputs and outputs,
 * used throughout the calculation engine and wizard components.
 */

import type Decimal from 'decimal.js'

// =============================================================================
// PHASE 15: Customer Type & Electricity Inputs
// =============================================================================

/**
 * Customer type for calculations.
 * Affects VAT handling: PRIVATPERSON includes VAT, FORETAG excludes VAT.
 */
export type CustomerType = 'PRIVATPERSON' | 'FORETAG'

/**
 * Input mode for values that support annual or monthly breakdown.
 */
export type InputMode = 'annual' | 'monthly'

/**
 * Self-consumption input mode: absolute kWh or percentage of production.
 */
export type SelfConsumptionMode = 'kwh' | 'percent'

/**
 * Electricity input data from the wizard.
 * Used by Zustand store and server actions.
 */
export interface ElectricityInputs {
  customerType: CustomerType
  koptElKwh: number
  koptElInputMode: InputMode
  koptElMonthly: number[] | null // 12 elements for Jan-Dec
  electricityPriceOreKwh: number
  electricityPriceInputMode: InputMode
  electricityPriceMonthly: number[] | null // 12 elements
  hasSolar: boolean
  solarProductionKwh: number | null
  solarProductionInputMode: InputMode
  solarProductionMonthly: number[] | null // 12 elements
  currentSelfConsumptionKwh: number | null
  projectedSelfConsumptionKwh: number | null
  selfConsumptionInputMode: SelfConsumptionMode
}

/**
 * Solar self-consumption inputs for calculation utilities.
 */
export interface SolarInputs {
  totalProductionKwh: number
  currentSelfConsumptionKwh: number
  projectedSelfConsumptionKwh: number
}

// =============================================================================
// PHASE 16: Fees & Taxes
// =============================================================================

/**
 * Result from fee calculation utilities.
 * All monetary values in SEK (converted from ore internally).
 */
export interface FeeCalculationResult {
  energiskattSek: number
  energiskattRateOre: number
  overforingsavgiftSek: number
  overforingsavgiftRateOre: number
  totalFeesSek: number
  customerType: CustomerType
}

/**
 * Decimal version of fee calculation result for internal use.
 */
export interface FeeCalculationResultDecimal {
  energiskattSek: Decimal
  overforingsavgiftSek: Decimal
  totalFeesSek: Decimal
}

// =============================================================================
// CONSUMPTION & BATTERY TYPES
// =============================================================================

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
  // Phase 11: Peak billing inputs
  natagareConfig?: {
    peakCalculationMethod: string | null
    nightDiscountPercent: number | null
    peakNightStartHour: number | null
    peakNightEndHour: number | null
    dayRateSekKw: number
  }
  targetAveragePeakKw?: number | null
  targetMonthlyCeilingKw?: number | null
  monthlyConsumptionKwh?: number[] // From Phase 10 distribution
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
  // Phase 11: Peak billing results
  peakBillingBeforeKw?: number // Billing peak without battery
  peakBillingAfterKw?: number // Billing peak with battery
  peakBillingMonthlySavingsSek?: number
  peakBillingAnnualSavingsSek?: number
  peakMethodUsed?: string // e.g., "Ellevio 3-topp medel"
  peakNightDiscountApplied?: boolean
  peakWasConstrained?: boolean
  peakConstraintReason?: string | null
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
  // Phase 11: Peak billing results
  peakBillingBeforeKw?: number
  peakBillingAfterKw?: number
  peakBillingMonthlySavingsSek?: Decimal
  peakBillingAnnualSavingsSek?: Decimal
  peakMethodUsed?: string
  peakNightDiscountApplied?: boolean
  peakWasConstrained?: boolean
  peakConstraintReason?: string | null
}

/**
 * Swedish electricity price zones.
 */
export type Elomrade = 'SE1' | 'SE2' | 'SE3' | 'SE4'

// =============================================================================
// PHASE 17: Multi-Battery Combo
// =============================================================================

/**
 * Battery selection with quantity for combo calculations.
 */
export interface BatterySelection {
  battery: BatterySpec
  quantity: number
  totalPriceExVat: number // Per unit price
  installationCost: number // Per unit installation cost
}

/**
 * Per-unit breakdown showing individual and subtotal results.
 */
export interface UnitBreakdown {
  battery: BatterySpec
  quantity: number
  perUnitResults: CalculationResults
  subtotalCapacityKwh: number
  subtotalMaxDischargeKw: number
  subtotalAnnualSavingsSek: number
  subtotalCostAfterGronTeknikSek: number
}

/**
 * Combined results for multi-battery configurations.
 * Aggregates individual battery results into unified totals.
 */
export interface CombinedResults {
  // Aggregated capacity metrics
  totalCapacityKwh: number
  totalMaxDischargeKw: number

  // Aggregated cost metrics
  totalCostExVat: number
  totalCostIncVat: number
  totalCostAfterGronTeknik: number

  // Aggregated savings
  totalAnnualSavingsSek: number

  // Derived ROI metrics (calculated from combined totals)
  combinedPaybackYears: number
  combinedRoi10Year: number
  combinedRoi15Year: number

  // Per-unit breakdown for detailed view
  unitBreakdowns: UnitBreakdown[]
}
