/**
 * Public battery summary component placeholder.
 * TODO: Implement in Phase 04-03 (Interactive Simulator)
 */

import type { PublicBatteryInfo, CalculationResultsPublic } from '@/lib/share/types'

interface PublicBatterySummaryProps {
  battery: PublicBatteryInfo
  allBatteries: PublicBatteryInfo[]
  results: CalculationResultsPublic
}

export function PublicBatterySummary({ battery, results }: PublicBatterySummaryProps) {
  return (
    <section className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Din batterilosning</h2>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-medium">{battery.brandName} {battery.name}</h3>
          <p className="text-sm text-gray-600">{battery.capacityKwh} kWh kapacitet</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-green-600">
            {Math.round(results.costAfterGronTeknik).toLocaleString('sv-SE')} kr
          </p>
          <p className="text-sm text-gray-600">efter gron teknik-avdrag</p>
        </div>
      </div>
    </section>
  )
}
