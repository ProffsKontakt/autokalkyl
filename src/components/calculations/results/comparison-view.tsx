'use client'

import type { CalculationResults } from '@/lib/calculations/types'

interface BatteryResult {
  batteryName: string
  results: CalculationResults
}

interface ComparisonViewProps {
  batteries: BatteryResult[]
}

export function ComparisonView({ batteries }: ComparisonViewProps) {
  const formatSek = (n: number) =>
    Math.round(n).toLocaleString('sv-SE') + ' kr'

  const formatYears = (n: number) =>
    n.toFixed(1).replace('.', ',') + ' ar'

  const formatPercent = (n: number) =>
    n.toFixed(1).replace('.', ',') + '%'

  // Find best values for highlighting
  const bestPayback = Math.min(...batteries.map(b => b.results.paybackPeriodYears))
  const bestAnnualSavings = Math.max(...batteries.map(b => b.results.totalAnnualSavingsSek))
  const bestRoi10 = Math.max(...batteries.map(b => b.results.roi10YearPercent))
  const bestRoi15 = Math.max(...batteries.map(b => b.results.roi15YearPercent))

  const metrics = [
    {
      label: 'Aterbetaltningstid',
      key: 'paybackPeriodYears',
      format: formatYears,
      best: bestPayback,
      lowerIsBetter: true,
    },
    {
      label: 'Arlig besparing',
      key: 'totalAnnualSavingsSek',
      format: formatSek,
      best: bestAnnualSavings,
      lowerIsBetter: false,
    },
    {
      label: 'ROI 10 ar',
      key: 'roi10YearPercent',
      format: formatPercent,
      best: bestRoi10,
      lowerIsBetter: false,
    },
    {
      label: 'ROI 15 ar',
      key: 'roi15YearPercent',
      format: formatPercent,
      best: bestRoi15,
      lowerIsBetter: false,
    },
    {
      label: 'Kostnad efter Gron Teknik',
      key: 'costAfterGronTeknikSek',
      format: formatSek,
      best: Math.min(...batteries.map(b => b.results.costAfterGronTeknikSek)),
      lowerIsBetter: true,
    },
    {
      label: 'Spotprisoptimering',
      key: 'spotprisSavingsSek',
      format: formatSek,
      best: Math.max(...batteries.map(b => b.results.spotprisSavingsSek)),
      lowerIsBetter: false,
    },
    {
      label: 'Effekttariffbesparing',
      key: 'effectTariffSavingsSek',
      format: formatSek,
      best: Math.max(...batteries.map(b => b.results.effectTariffSavingsSek)),
      lowerIsBetter: false,
    },
    {
      label: 'Stodtjanster',
      key: 'gridServicesIncomeSek',
      format: formatSek,
      best: Math.max(...batteries.map(b => b.results.gridServicesIncomeSek)),
      lowerIsBetter: false,
    },
  ]

  return (
    <div className="bg-white border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
              Metric
            </th>
            {batteries.map((b, i) => (
              <th key={i} className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                {b.batteryName}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {metrics.map((metric) => (
            <tr key={metric.key} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm text-gray-600">
                {metric.label}
              </td>
              {batteries.map((b, i) => {
                const value = b.results[metric.key as keyof CalculationResults] as number
                const isBest = metric.lowerIsBetter
                  ? value <= metric.best
                  : value >= metric.best

                return (
                  <td
                    key={i}
                    className={`px-4 py-3 text-sm text-right ${
                      isBest && batteries.length > 1
                        ? 'font-bold text-green-600'
                        : 'text-gray-900'
                    }`}
                  >
                    {metric.format(value)}
                    {isBest && batteries.length > 1 && (
                      <span className="ml-1 text-green-500">*</span>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {batteries.length > 1 && (
        <div className="px-4 py-2 bg-gray-50 text-xs text-gray-500">
          * Basta varde markerat med gront
        </div>
      )}
    </div>
  )
}
