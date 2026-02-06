'use client'

import type { PublicCombinedResults } from '@/lib/share/types'

interface PublicComboViewProps {
  combinedResults: PublicCombinedResults
  primaryColor: string
  customerType?: string
}

function formatSek(value: number): string {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'SEK',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatYears(n: number): string {
  const years = Math.floor(n)
  const months = Math.round((n - years) * 12)
  if (months === 0) return `${years} år`
  return `${years} år ${months} mån`
}

function formatPercent(n: number): string {
  return n.toLocaleString('sv-SE', { maximumFractionDigits: 1 }) + '%'
}

export function PublicComboView({ combinedResults, primaryColor, customerType }: PublicComboViewProps) {
  const totalUnits = combinedResults.unitBreakdowns.reduce(
    (sum, unit) => sum + unit.quantity,
    0
  )

  // Use appropriate payback value based on customer type
  const combinedPaybackYears = customerType === 'FORETAG'
    ? (combinedResults.combinedPaybackYearsExVat ?? combinedResults.combinedPaybackYears)
    : combinedResults.combinedPaybackYears

  // Calculate total savings breakdown from unit breakdowns
  const totalSpotprisSavings = combinedResults.unitBreakdowns.reduce(
    (sum, unit) => sum + unit.perUnitResults.spotprisSavings * unit.quantity,
    0
  )
  const totalEffectTariffSavings = combinedResults.unitBreakdowns.reduce(
    (sum, unit) => sum + unit.perUnitResults.effectTariffSavings * unit.quantity,
    0
  )
  const totalGridServicesIncome = combinedResults.unitBreakdowns.reduce(
    (sum, unit) => sum + unit.perUnitResults.gridServicesIncome * unit.quantity,
    0
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div
        className="rounded-lg p-4 border"
        style={{
          backgroundColor: `${primaryColor}10`,
          borderColor: `${primaryColor}40`,
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`,
            }}
          >
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
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-4 shadow-sm">
          <h3 className="text-sm text-gray-500 dark:text-gray-400 mb-1">Återbetalningstid</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {formatYears(combinedPaybackYears)}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {customerType === 'FORETAG' ? 'efter avdragen moms' : 'efter Grön Teknik'}
          </p>
        </div>

        {/* Annual savings */}
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-4 shadow-sm">
          <h3 className="text-sm text-gray-500 dark:text-gray-400 mb-1">Årlig besparing</h3>
          <p className="text-2xl font-bold text-green-600 dark:text-green-500">
            {formatSek(combinedResults.totalAnnualSavingsSek)}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">/år</p>
        </div>

        {/* 10-year ROI */}
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-4 shadow-sm">
          <h3 className="text-sm text-gray-500 dark:text-gray-400 mb-1">ROI 10 år</h3>
          <p className={`text-2xl font-bold ${combinedResults.combinedRoi10Year >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
            {formatPercent(combinedResults.combinedRoi10Year)}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {formatSek(combinedResults.totalAnnualSavingsSek * 10 - combinedResults.totalCostAfterGronTeknik)} netto
          </p>
        </div>

        {/* 15-year ROI */}
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-4 shadow-sm">
          <h3 className="text-sm text-gray-500 dark:text-gray-400 mb-1">ROI 15 år</h3>
          <p className={`text-2xl font-bold ${combinedResults.combinedRoi15Year >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
            {formatPercent(combinedResults.combinedRoi15Year)}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {formatSek(combinedResults.totalAnnualSavingsSek * 15 - combinedResults.totalCostAfterGronTeknik)} netto
          </p>
        </div>
      </div>

      {/* Cost summary */}
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-3">Kostnad</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Ex moms:</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">{formatSek(combinedResults.totalCostExVat)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Inkl moms:</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">{formatSek(combinedResults.totalCostIncVat)}</span>
          </div>
          <div className="flex justify-between text-sm pt-2 border-t border-gray-200 dark:border-slate-700">
            <span className="text-gray-600 dark:text-gray-400">Efter Grön Teknik:</span>
            <span className="font-bold text-green-600 dark:text-green-500">{formatSek(combinedResults.totalCostAfterGronTeknik)}</span>
          </div>
        </div>
      </div>

      {/* Savings breakdown */}
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-3">Besparingsfördelning</h3>
        <div className="space-y-2">
          {totalSpotprisSavings > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-blue-500"></div>
                Spotprisoptimering:
              </span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{formatSek(totalSpotprisSavings)}/år</span>
            </div>
          )}
          {totalEffectTariffSavings > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-green-500"></div>
                Effekttariff:
              </span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{formatSek(totalEffectTariffSavings)}/år</span>
            </div>
          )}
          {totalGridServicesIncome > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-purple-500"></div>
                Stödtjänster:
              </span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{formatSek(totalGridServicesIncome)}/år</span>
            </div>
          )}
          <div className="flex justify-between text-sm pt-2 border-t border-gray-200 dark:border-slate-700 font-semibold">
            <span className="text-gray-900 dark:text-gray-100">Total:</span>
            <span className="text-green-600 dark:text-green-500">{formatSek(combinedResults.totalAnnualSavingsSek)}/år</span>
          </div>
        </div>
      </div>

      {/* Per-unit breakdown (expandable) */}
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-3">Per-enhet breakdown</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Expandera för detaljer om varje batterimodell
        </p>

        <div className="space-y-3">
          {combinedResults.unitBreakdowns.map((unit, index) => (
            <details
              key={index}
              className="group border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
            >
              <summary className="cursor-pointer p-4 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                    style={{
                      background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`,
                    }}
                  >
                    {unit.quantity}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-slate-900 dark:text-slate-100">
                      {unit.quantity}× {unit.battery.capacityKwh} kWh
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      {unit.subtotalCapacityKwh.toFixed(1)} kWh total • {formatSek(unit.subtotalAnnualSavingsSek)}/år
                    </div>
                  </div>
                </div>
                <svg
                  className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>

              <div className="p-4 bg-white dark:bg-slate-800 space-y-4">
                {/* Technical specs */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Specifikationer</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Kapacitet/enhet:</span>
                      <span className="font-medium text-slate-900 dark:text-slate-100">{unit.battery.capacityKwh.toFixed(1)} kWh</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Total kapacitet:</span>
                      <span className="font-medium text-slate-900 dark:text-slate-100">{unit.subtotalCapacityKwh.toFixed(1)} kWh</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Max urladdning/enhet:</span>
                      <span className="font-medium text-slate-900 dark:text-slate-100">{unit.battery.maxDischargeKw.toFixed(1)} kW</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Total urladdning:</span>
                      <span className="font-medium text-slate-900 dark:text-slate-100">{unit.subtotalMaxDischargeKw.toFixed(1)} kW</span>
                    </div>
                  </div>
                </div>

                {/* Cost breakdown */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Kostnad</h4>
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-3 gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                      <div></div>
                      <div className="text-right">Per enhet</div>
                      <div className="text-right">Totalt ({unit.quantity}×)</div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-slate-600 dark:text-slate-400">Ex moms:</span>
                      <span className="font-medium text-slate-900 dark:text-slate-100 text-right">{formatSek(unit.perUnitResults.totalPriceExVat)}</span>
                      <span className="font-medium text-slate-900 dark:text-slate-100 text-right">{formatSek(unit.perUnitResults.totalPriceExVat * unit.quantity)}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-slate-600 dark:text-slate-400">Inkl moms:</span>
                      <span className="font-medium text-slate-900 dark:text-slate-100 text-right">{formatSek(unit.perUnitResults.totalPriceIncVat)}</span>
                      <span className="font-medium text-slate-900 dark:text-slate-100 text-right">{formatSek(unit.perUnitResults.totalPriceIncVat * unit.quantity)}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-200 dark:border-slate-700">
                      <span className="text-slate-600 dark:text-slate-400">Efter Grön Teknik:</span>
                      <span className="font-semibold text-green-600 dark:text-green-500 text-right">{formatSek(unit.perUnitResults.costAfterGronTeknik)}</span>
                      <span className="font-semibold text-green-600 dark:text-green-500 text-right">{formatSek(unit.subtotalCostAfterGronTeknikSek)}</span>
                    </div>
                  </div>
                </div>

                {/* Savings breakdown */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Årlig besparing</h4>
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-3 gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                      <div></div>
                      <div className="text-right">Per enhet</div>
                      <div className="text-right">Totalt ({unit.quantity}×)</div>
                    </div>

                    {unit.perUnitResults.spotprisSavings > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                          <div className="w-2 h-2 rounded bg-blue-500"></div>
                          Spotpris:
                        </span>
                        <span className="font-medium text-slate-900 dark:text-slate-100 text-right">{formatSek(unit.perUnitResults.spotprisSavings)}</span>
                        <span className="font-medium text-slate-900 dark:text-slate-100 text-right">{formatSek(unit.perUnitResults.spotprisSavings * unit.quantity)}</span>
                      </div>
                    )}

                    {unit.perUnitResults.effectTariffSavings > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                          <div className="w-2 h-2 rounded bg-green-500"></div>
                          Effekttariff:
                        </span>
                        <span className="font-medium text-slate-900 dark:text-slate-100 text-right">{formatSek(unit.perUnitResults.effectTariffSavings)}</span>
                        <span className="font-medium text-slate-900 dark:text-slate-100 text-right">{formatSek(unit.perUnitResults.effectTariffSavings * unit.quantity)}</span>
                      </div>
                    )}

                    {unit.perUnitResults.gridServicesIncome > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                          <div className="w-2 h-2 rounded bg-purple-500"></div>
                          Stödtjänster:
                        </span>
                        <span className="font-medium text-slate-900 dark:text-slate-100 text-right">{formatSek(unit.perUnitResults.gridServicesIncome)}</span>
                        <span className="font-medium text-slate-900 dark:text-slate-100 text-right">{formatSek(unit.perUnitResults.gridServicesIncome * unit.quantity)}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-200 dark:border-slate-700 font-semibold">
                      <span className="text-slate-900 dark:text-slate-100">Total:</span>
                      <span className="text-green-600 dark:text-green-500 text-right">{formatSek(unit.perUnitResults.totalAnnualSavings)}</span>
                      <span className="text-green-600 dark:text-green-500 text-right">{formatSek(unit.subtotalAnnualSavingsSek)}</span>
                    </div>
                  </div>
                </div>

                {/* Grid services stacking detail for Emaldo batteries */}
                {unit.perUnitResults.gridServicesIncome > 0 && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded bg-purple-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div className="text-xs">
                        <div className="font-medium text-purple-900 dark:text-purple-200 mb-1">
                          Stödtjänster staplas per fysisk enhet
                        </div>
                        <div className="text-purple-700 dark:text-purple-300">
                          Varje batteri kan registreras separat för frekvensreglering ({formatSek(unit.perUnitResults.gridServicesIncome)}/enhet/år × {unit.quantity} = {formatSek(unit.perUnitResults.gridServicesIncome * unit.quantity)}/år)
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ROI metrics */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">ROI per enhet</h4>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="text-center p-2 bg-slate-50 dark:bg-slate-700/50 rounded">
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Återbetalningstid</div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {formatYears(
                          customerType === 'FORETAG'
                            ? (unit.perUnitResults.paybackYearsExVat ?? unit.perUnitResults.paybackYears)
                            : unit.perUnitResults.paybackYears
                        )}
                      </div>
                      <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        {customerType === 'FORETAG' ? 'ex moms' : 'efter Grön Teknik'}
                      </div>
                    </div>
                    <div className="text-center p-2 bg-slate-50 dark:bg-slate-700/50 rounded">
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">ROI 10 år</div>
                      <div className={`font-semibold ${unit.perUnitResults.roi10Year >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                        {formatPercent(unit.perUnitResults.roi10Year)}
                      </div>
                    </div>
                    <div className="text-center p-2 bg-slate-50 dark:bg-slate-700/50 rounded">
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">ROI 15 år</div>
                      <div className={`font-semibold ${unit.perUnitResults.roi15Year >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                        {formatPercent(unit.perUnitResults.roi15Year)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </details>
          ))}
        </div>
      </div>
    </div>
  )
}
