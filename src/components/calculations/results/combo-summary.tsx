'use client'

import type { CombinedResults } from '@/lib/calculations/types'

interface ComboSummaryProps {
  combinedResults: CombinedResults
}

export function ComboSummary({ combinedResults }: ComboSummaryProps) {
  const formatSek = (n: number) =>
    Math.round(n).toLocaleString('sv-SE') + ' kr'

  const formatYears = (n: number) => {
    const years = Math.floor(n)
    const months = Math.round((n - years) * 12)
    if (months === 0) return `${years} år`
    return `${years} år ${months} mån`
  }

  const formatPercent = (n: number) =>
    n.toLocaleString('sv-SE', { maximumFractionDigits: 1 }) + '%'

  const totalUnits = combinedResults.unitBreakdowns.reduce(
    (sum, unit) => sum + unit.quantity,
    0
  )

  // Calculate total savings breakdown from unit breakdowns
  const totalSpotprisSavings = combinedResults.unitBreakdowns.reduce(
    (sum, unit) => sum + unit.perUnitResults.spotprisSavingsSek * unit.quantity,
    0
  )
  const totalEffectTariffSavings = combinedResults.unitBreakdowns.reduce(
    (sum, unit) => sum + unit.perUnitResults.effectTariffSavingsSek * unit.quantity,
    0
  )
  const totalGridServicesIncome = combinedResults.unitBreakdowns.reduce(
    (sum, unit) => sum + unit.perUnitResults.gridServicesIncomeSek * unit.quantity,
    0
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              Kombinerad investering
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {totalUnits} batterier • {combinedResults.totalCapacityKwh.toFixed(1)} kWh total kapacitet
            </p>
          </div>
        </div>
      </div>

      {/* Key metrics grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Payback period */}
        <div className="bg-white border rounded-lg p-4">
          <h3 className="text-sm text-gray-500 mb-1">Återbetalningstid</h3>
          <p className="text-2xl font-bold text-gray-900">
            {formatYears(combinedResults.combinedPaybackYears)}
          </p>
          <p className="text-xs text-gray-400 mt-1">efter Grön Teknik</p>
        </div>

        {/* Annual savings */}
        <div className="bg-white border rounded-lg p-4">
          <h3 className="text-sm text-gray-500 mb-1">Årlig besparing</h3>
          <p className="text-2xl font-bold text-green-600">
            {formatSek(combinedResults.totalAnnualSavingsSek)}
          </p>
          <p className="text-xs text-gray-400 mt-1">/år</p>
        </div>

        {/* 10-year ROI */}
        <div className="bg-white border rounded-lg p-4">
          <h3 className="text-sm text-gray-500 mb-1">ROI 10 år</h3>
          <p className={`text-2xl font-bold ${combinedResults.combinedRoi10Year >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatPercent(combinedResults.combinedRoi10Year)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {formatSek(combinedResults.totalAnnualSavingsSek * 10 - combinedResults.totalCostAfterGronTeknik)} netto
          </p>
        </div>

        {/* 15-year ROI */}
        <div className="bg-white border rounded-lg p-4">
          <h3 className="text-sm text-gray-500 mb-1">ROI 15 år</h3>
          <p className={`text-2xl font-bold ${combinedResults.combinedRoi15Year >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatPercent(combinedResults.combinedRoi15Year)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {formatSek(combinedResults.totalAnnualSavingsSek * 15 - combinedResults.totalCostAfterGronTeknik)} netto
          </p>
        </div>
      </div>

      {/* Cost summary */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="text-sm font-semibold text-slate-800 mb-3">Kostnad</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Ex moms:</span>
            <span className="font-medium text-gray-900">{formatSek(combinedResults.totalCostExVat)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Inkl moms:</span>
            <span className="font-medium text-gray-900">{formatSek(combinedResults.totalCostIncVat)}</span>
          </div>
          <div className="flex justify-between text-sm pt-2 border-t">
            <span className="text-gray-600">Efter Grön Teknik:</span>
            <span className="font-bold text-green-600">{formatSek(combinedResults.totalCostAfterGronTeknik)}</span>
          </div>
        </div>
      </div>

      {/* Savings breakdown */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="text-sm font-semibold text-slate-800 mb-3">Besparingsfördelning</h3>
        <div className="space-y-2">
          {totalSpotprisSavings > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-blue-500"></div>
                Spotprisoptimering:
              </span>
              <span className="font-medium text-gray-900">{formatSek(totalSpotprisSavings)}/år</span>
            </div>
          )}
          {totalEffectTariffSavings > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-green-500"></div>
                Effekttariff:
              </span>
              <span className="font-medium text-gray-900">{formatSek(totalEffectTariffSavings)}/år</span>
            </div>
          )}
          {totalGridServicesIncome > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-purple-500"></div>
                Stödtjänster:
              </span>
              <span className="font-medium text-gray-900">{formatSek(totalGridServicesIncome)}/år</span>
            </div>
          )}
          <div className="flex justify-between text-sm pt-2 border-t font-semibold">
            <span className="text-gray-900">Total:</span>
            <span className="text-green-600">{formatSek(combinedResults.totalAnnualSavingsSek)}/år</span>
          </div>
        </div>
      </div>
    </div>
  )
}
