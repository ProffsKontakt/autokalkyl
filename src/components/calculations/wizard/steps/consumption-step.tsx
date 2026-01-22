'use client'

/**
 * Consumption profile step (Step 2) of the calculation wizard.
 *
 * Wraps the ConsumptionSimulator component with step-appropriate
 * heading and instructions.
 */

import { ConsumptionSimulator } from '../consumption-simulator/simulator'

export function ConsumptionStep() {
  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Förbrukningsprofil</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Redigera kundens förbrukningsmönster. Välj ett snabbval eller justera manuellt per timme och månad.
      </p>

      <ConsumptionSimulator />
    </div>
  )
}
