/**
 * Public results view component placeholder.
 * TODO: Implement fully in Phase 04-03 (Interactive Simulator)
 */

import type { CalculationResultsPublic } from '@/lib/share/types'

interface PublicResultsViewProps {
  results: CalculationResultsPublic
  primaryColor: string
}

export function PublicResultsView({ results, primaryColor }: PublicResultsViewProps) {
  return (
    <section className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Din besparing</h2>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-3xl font-bold" style={{ color: primaryColor }}>
            {Math.round(results.totalAnnualSavings).toLocaleString('sv-SE')} kr
          </p>
          <p className="text-sm text-gray-600">per ar</p>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-3xl font-bold" style={{ color: primaryColor }}>
            {results.paybackYears.toFixed(1)} ar
          </p>
          <p className="text-sm text-gray-600">aterbetalning</p>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-3xl font-bold" style={{ color: primaryColor }}>
            {Math.round(results.roi10Year)} %
          </p>
          <p className="text-sm text-gray-600">avkastning 10 ar</p>
        </div>
      </div>
    </section>
  )
}
