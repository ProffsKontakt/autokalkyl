/**
 * Constraint calculations for battery ROI.
 *
 * Ensures calculations respect physical limitations of the battery system.
 */

/**
 * PEAK-02: Calculate actual peak shaving respecting battery capacity.
 *
 * The battery cannot shave more power than it can deliver.
 * Actual shave = min(peak × targetPercent, batteryMaxDischargeKw)
 *
 * @param currentPeakKw - Current peak power demand in kW
 * @param targetPercent - Target reduction percentage (0-100)
 * @param batteryMaxDischargeKw - Battery max discharge power in kW
 */
export function calculateActualPeakShaving(
  currentPeakKw: number,
  targetPercent: number,
  batteryMaxDischargeKw: number
): {
  targetKw: number
  actualKw: number
  newPeakKw: number
  isConstrained: boolean
  constraintMessage: string | null
} {
  const targetKw = currentPeakKw * (targetPercent / 100)
  const actualKw = Math.min(targetKw, batteryMaxDischargeKw)
  const newPeakKw = currentPeakKw - actualKw
  const isConstrained = actualKw < targetKw

  return {
    targetKw,
    actualKw,
    newPeakKw,
    isConstrained,
    constraintMessage: isConstrained
      ? `Batteriet kan max leverera ${batteryMaxDischargeKw.toFixed(1)} kW. Mål: ${targetKw.toFixed(1)} kW.`
      : null,
  }
}

/**
 * Calculate effective cycles considering warranty impact.
 *
 * Higher cycles = more savings but faster warranty consumption.
 *
 * @param cyclesPerDay - Daily charge/discharge cycles
 * @param warrantyYears - Battery warranty in years
 * @param guaranteedCycles - Total cycles guaranteed by warranty
 */
export function calculateWarrantyLifeAtCycles(
  cyclesPerDay: number,
  warrantyYears: number,
  guaranteedCycles: number
): {
  yearsAtCurrentCycles: number
  excedesWarranty: boolean
  warningMessage: string | null
} {
  const annualCycles = cyclesPerDay * 365
  const yearsAtCurrentCycles = guaranteedCycles / annualCycles
  const excedesWarranty = yearsAtCurrentCycles < warrantyYears

  return {
    yearsAtCurrentCycles,
    excedesWarranty,
    warningMessage: excedesWarranty
      ? `Vid ${cyclesPerDay} cykler/dag räcker garanterade cykler i ${yearsAtCurrentCycles.toFixed(1)} år (garanti: ${warrantyYears} år)`
      : null,
  }
}
