/**
 * Individual formula functions for battery ROI calculations.
 *
 * Each function implements a specific LOGIC requirement from the specification.
 * Uses decimal.js for financial precision to avoid floating point errors.
 */

import Decimal from 'decimal.js'

// Configure decimal.js for financial calculations
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP })

// Helper to create Decimal from number
const d = (n: number) => new Decimal(n)

/**
 * LOGIC-01: Calculate effective capacity per cycle.
 *
 * Accounts for charge/discharge efficiencies and average discharge depth.
 *
 * @param capacityKwh - Battery capacity in kWh
 * @param chargeEfficiency - Charge efficiency percentage (e.g., 95)
 * @param dischargeEfficiency - Discharge efficiency percentage (e.g., 97)
 * @param avgDischargePercent - Average discharge depth percentage (e.g., 85)
 */
export function calcEffectiveCapacity(
  capacityKwh: number,
  chargeEfficiency: number,
  dischargeEfficiency: number,
  avgDischargePercent: number
): Decimal {
  return d(capacityKwh)
    .times(d(chargeEfficiency).div(100))
    .times(d(dischargeEfficiency).div(100))
    .times(d(avgDischargePercent).div(100))
}

/**
 * LOGIC-02: Calculate annual energy from battery.
 *
 * @param effectiveCapacityKwh - Effective capacity per cycle
 * @param cyclesPerDay - Number of cycles per day (typically 1-2)
 */
export function calcAnnualEnergy(effectiveCapacityKwh: Decimal, cyclesPerDay: number): Decimal {
  return effectiveCapacityKwh.times(cyclesPerDay).times(365)
}

/**
 * LOGIC-03: Calculate spotpris optimization savings.
 *
 * Savings from charging at night (low price) and discharging at day (high price).
 *
 * @param annualEnergyKwh - Annual energy from battery
 * @param dayPriceOre - Average day price in ore/kWh
 * @param nightPriceOre - Average night price in ore/kWh
 */
export function calcSpotprisSavings(
  annualEnergyKwh: Decimal,
  dayPriceOre: number,
  nightPriceOre: number
): Decimal {
  const priceDiff = d(dayPriceOre).minus(nightPriceOre)
  return annualEnergyKwh.times(priceDiff).div(100) // ore to SEK
}

/**
 * SPOT-01: Calculate spotpris optimization savings (V2 - Direct formula).
 *
 * Uses the correct formula: spread × efficiency × cycles × capacity × days
 *
 * @param capacityKwh - Battery capacity in kWh
 * @param cyclesPerDay - Daily charge/discharge cycles (typically 0.5-3)
 * @param efficiency - Round-trip efficiency (default 0.8 for 80%)
 * @param dayPriceOre - Average day price in ore/kWh
 * @param nightPriceOre - Average night price in ore/kWh
 * @param daysPerYear - Days per year (default 365)
 */
export function calcSpotprisSavingsV2(
  capacityKwh: number,
  cyclesPerDay: number,
  efficiency: number,
  dayPriceOre: number,
  nightPriceOre: number,
  daysPerYear: number = 365
): Decimal {
  const spread = d(dayPriceOre).minus(nightPriceOre)
  return spread
    .times(efficiency)
    .times(cyclesPerDay)
    .times(capacityKwh)
    .times(daysPerYear)
    .div(100) // ore to SEK
}

/**
 * LOGIC-04: Calculate effect tariff savings.
 *
 * Savings from reducing peak power demand using battery discharge.
 *
 * @param maxDischargeKw - Battery max discharge power in kW
 * @param effectTariffDayRate - Day rate in SEK/kW
 */
export function calcEffectTariffSavings(
  maxDischargeKw: number,
  effectTariffDayRate: number
): Decimal {
  // Estimate: battery can reduce peak by its max discharge capacity
  // Applied over 12 months with day rate
  return d(maxDischargeKw).times(effectTariffDayRate).times(12)
}

/**
 * LOGIC-05: Calculate grid services income.
 *
 * Potential income from providing grid balancing services.
 *
 * @param maxDischargeKw - Battery max discharge power in kW
 * @param ratePerKwYear - Rate in SEK/kW/year
 */
export function calcGridServicesIncome(
  maxDischargeKw: number,
  ratePerKwYear: number
): Decimal {
  return d(maxDischargeKw).times(ratePerKwYear)
}

/**
 * LOGIC-06: Calculate total annual savings.
 *
 * Sum of all savings and income sources.
 */
export function calcTotalAnnualSavings(
  spotprisSavings: Decimal,
  effectTariffSavings: Decimal,
  gridServicesIncome: Decimal
): Decimal {
  return spotprisSavings.plus(effectTariffSavings).plus(gridServicesIncome)
}

/**
 * CALC-11: Calculate total including VAT.
 *
 * @param totalPriceExVat - Battery price excluding VAT
 * @param installationCost - Installation cost
 * @param vatRate - VAT rate (0.25 for 25%)
 */
export function calcTotalIncVat(
  totalPriceExVat: number,
  installationCost: number,
  vatRate: number
): Decimal {
  const totalExVat = d(totalPriceExVat).plus(installationCost)
  return totalExVat.times(d(1).plus(vatRate))
}

/**
 * CALC-12: Calculate cost after Gron Teknik deduction.
 *
 * Swedish green technology subsidy reduces the effective cost.
 *
 * @param totalIncVat - Total cost including VAT
 * @param gronTeknikRate - Deduction rate (0.485 for 48.5%)
 */
export function calcCostAfterGronTeknik(totalIncVat: Decimal, gronTeknikRate: number): Decimal {
  const deduction = totalIncVat.times(gronTeknikRate)
  return totalIncVat.minus(deduction)
}

/**
 * CALC-13: Calculate margin for ProffsKontakt affiliates.
 *
 * @param totalPriceExVat - Sale price excluding VAT
 * @param batteryCostPrice - Battery cost price
 * @param installerCut - Fixed amount to installer
 */
export function calcMargin(
  totalPriceExVat: number,
  batteryCostPrice: number,
  installerCut: number
): Decimal {
  return d(totalPriceExVat).minus(batteryCostPrice).minus(installerCut)
}

/**
 * LOGIC-07: Calculate payback period in years.
 *
 * @param costAfterGronTeknik - Net cost after subsidies
 * @param annualSavings - Annual savings
 */
export function calcPaybackPeriod(costAfterGronTeknik: Decimal, annualSavings: Decimal): Decimal {
  if (annualSavings.isZero()) return d(999) // Avoid division by zero
  return costAfterGronTeknik.div(annualSavings)
}

/**
 * LOGIC-08: Calculate 10-year ROI percentage.
 *
 * @param costAfterGronTeknik - Net cost after subsidies
 * @param annualSavings - Annual savings
 */
export function calcRoi10Year(costAfterGronTeknik: Decimal, annualSavings: Decimal): Decimal {
  if (costAfterGronTeknik.isZero()) return d(0)
  const totalSavings = annualSavings.times(10)
  return totalSavings.minus(costAfterGronTeknik).div(costAfterGronTeknik).times(100)
}

/**
 * LOGIC-09: Calculate 15-year ROI percentage.
 *
 * @param costAfterGronTeknik - Net cost after subsidies
 * @param annualSavings - Annual savings
 */
export function calcRoi15Year(costAfterGronTeknik: Decimal, annualSavings: Decimal): Decimal {
  if (costAfterGronTeknik.isZero()) return d(0)
  const totalSavings = annualSavings.times(15)
  return totalSavings.minus(costAfterGronTeknik).div(costAfterGronTeknik).times(100)
}
