'use client'

/**
 * Consumption Profile step (Step 2) of the calculation wizard.
 *
 * Collects:
 * - Heating type (5 Swedish options)
 * - Annual consumption in kWh (slider + text)
 * - Optional estimation helper
 *
 * Shows live distribution chart preview based on selections.
 */

import { useCalculationWizardStore } from '@/stores/calculation-wizard-store'
import { AnnualKwhInput } from '../consumption-profile/annual-kwh-input'
import { HeatingTypeSelect } from '../consumption-profile/heating-type-select'
import { EstimationHelper } from '../consumption-profile/estimation-helper'
import { DistributionChart } from '../consumption-profile/distribution-chart'
import { HEATING_TYPE_PROFILES } from '@/lib/calculations/consumption-profiles'

export function ConsumptionProfileStep() {
  const {
    annualConsumptionKwh,
    heatingType,
    updateCustomerInfo,
    updateHeatingType,
  } = useCalculationWizardStore()

  const handleAnnualKwhChange = (value: number) => {
    updateCustomerInfo({ annualConsumptionKwh: value })
  }

  const handleEstimate = (estimatedKwh: number) => {
    // Clamp to valid range (5000-75000)
    const clamped = Math.max(5000, Math.min(75000, estimatedKwh))
    updateCustomerInfo({ annualConsumptionKwh: clamped })
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        Forbrukningsprofil
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Valj uppvarmningstyp och ange arlig elforbrukning for att se hur forbrukningen fordelas over aret.
      </p>

      {/* Two-column layout on large screens */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left column: Inputs */}
        <div className="space-y-6">
          {/* Heating type selection */}
          <HeatingTypeSelect
            value={heatingType}
            onChange={updateHeatingType}
          />

          {/* Annual kWh input */}
          <AnnualKwhInput
            value={annualConsumptionKwh}
            onChange={handleAnnualKwhChange}
          />

          {/* Estimation helper (collapsible) */}
          <EstimationHelper
            heatingType={heatingType}
            onEstimate={handleEstimate}
          />
        </div>

        {/* Right column: Live preview chart */}
        <div className="lg:sticky lg:top-6 h-fit">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
            <DistributionChart
              annualKwh={annualConsumptionKwh}
              heatingType={heatingType}
              height={250}
            />
          </div>
        </div>
      </div>

      {/* Summary card at bottom - only show when both fields are filled */}
      {heatingType && annualConsumptionKwh >= 5000 && (
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
            Sammanfattning
          </h3>
          <dl className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <div className="flex justify-between">
              <dt>Uppvarmningstyp:</dt>
              <dd className="font-medium">{HEATING_TYPE_PROFILES[heatingType].name}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Arlig forbrukning:</dt>
              <dd className="font-medium">{annualConsumptionKwh.toLocaleString('sv-SE')} kWh</dd>
            </div>
            <div className="flex justify-between">
              <dt>Sakongsprofil:</dt>
              <dd className="font-medium">
                {heatingType === 'FJARRVARME'
                  ? 'Jamn over aret'
                  : heatingType === 'DIREKTVERKANDE'
                  ? 'Hog variation (vinter/sommar)'
                  : 'Mattlig variation'}
              </dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  )
}
