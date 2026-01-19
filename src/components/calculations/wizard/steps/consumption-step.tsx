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
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Forbrukningsprofil</h2>
      <p className="text-sm text-gray-600 mb-6">
        Redigera kundens forbrukningsmonster. Valj ett snabbval eller justera manuellt per timme och manad.
      </p>

      <ConsumptionSimulator />
    </div>
  )
}
