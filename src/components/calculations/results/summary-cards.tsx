'use client'

import type { CalculationResults } from '@/lib/calculations/types'

interface SummaryCardsProps {
  results: CalculationResults
  batteryName: string
}

export function SummaryCards({ results, batteryName }: SummaryCardsProps) {
  const formatSek = (n: number) =>
    Math.round(n).toLocaleString('sv-SE') + ' kr'

  const formatYears = (n: number) => {
    const years = Math.floor(n)
    const months = Math.round((n - years) * 12)
    if (months === 0) return `${years} ar`
    return `${years} ar ${months} man`
  }

  const formatPercent = (n: number) =>
    n.toLocaleString('sv-SE', { maximumFractionDigits: 1 }) + '%'

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Payback period */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="text-sm text-gray-500 mb-1">Aterbetaltningstid</h3>
        <p className="text-2xl font-bold text-gray-900">
          {formatYears(results.paybackPeriodYears)}
        </p>
        <p className="text-xs text-gray-400 mt-1">efter Gron Teknik</p>
      </div>

      {/* Annual savings */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="text-sm text-gray-500 mb-1">Arlig besparing</h3>
        <p className="text-2xl font-bold text-green-600">
          {formatSek(results.totalAnnualSavingsSek)}
        </p>
        <p className="text-xs text-gray-400 mt-1">/ar</p>
      </div>

      {/* 10-year ROI */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="text-sm text-gray-500 mb-1">ROI 10 ar</h3>
        <p className={`text-2xl font-bold ${results.roi10YearPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {formatPercent(results.roi10YearPercent)}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {formatSek(results.totalAnnualSavingsSek * 10 - results.costAfterGronTeknikSek)} netto
        </p>
      </div>

      {/* 15-year ROI */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="text-sm text-gray-500 mb-1">ROI 15 ar</h3>
        <p className={`text-2xl font-bold ${results.roi15YearPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {formatPercent(results.roi15YearPercent)}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {formatSek(results.totalAnnualSavingsSek * 15 - results.costAfterGronTeknikSek)} netto
        </p>
      </div>
    </div>
  )
}
