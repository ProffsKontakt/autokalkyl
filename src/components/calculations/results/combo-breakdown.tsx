'use client'

import type { UnitBreakdown } from '@/lib/calculations/types'

interface ComboBreakdownProps {
  unitBreakdowns: UnitBreakdown[]
}

export function ComboBreakdown({ unitBreakdowns }: ComboBreakdownProps) {
  const formatSek = (n: number) =>
    Math.round(n).toLocaleString('sv-SE') + ' kr'

  const formatKwh = (n: number) => n.toFixed(1) + ' kWh'

  const formatKw = (n: number) => n.toFixed(1) + ' kW'

  return (
    <div className="bg-white border rounded-lg p-4">
      <h3 className="text-sm font-semibold text-slate-800 mb-3">Per-enhet breakdown</h3>
      <p className="text-xs text-slate-500 mb-4">
        Expandera för detaljer om varje batterimodell
      </p>

      <div className="space-y-3">
        {unitBreakdowns.map((unit, index) => {
          const { battery, quantity, perUnitResults } = unit

          // Calculate per-unit values
          const perUnitCostExVat = perUnitResults.totalIncVatSek / 1.25 // Remove VAT
          const perUnitCostIncVat = perUnitResults.totalIncVatSek
          const perUnitCostAfterGronTeknik = perUnitResults.costAfterGronTeknikSek

          return (
            <details
              key={index}
              className="group border border-slate-200 rounded-lg overflow-hidden hover:border-slate-300 transition-colors"
            >
              <summary className="cursor-pointer p-4 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                    {quantity}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-slate-900">
                      {quantity}× {battery.capacityKwh} kWh
                    </div>
                    <div className="text-sm text-slate-500">
                      {formatKwh(unit.subtotalCapacityKwh)} total • {formatSek(unit.subtotalAnnualSavingsSek)}/år
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

              <div className="p-4 bg-white space-y-4">
                {/* Technical specs */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-700 mb-2">Specifikationer</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Kapacitet/enhet:</span>
                      <span className="font-medium">{formatKwh(battery.capacityKwh)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Total kapacitet:</span>
                      <span className="font-medium">{formatKwh(unit.subtotalCapacityKwh)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Max urladdning/enhet:</span>
                      <span className="font-medium">{formatKw(battery.maxDischargeKw)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Total urladdning:</span>
                      <span className="font-medium">{formatKw(unit.subtotalMaxDischargeKw)}</span>
                    </div>
                  </div>
                </div>

                {/* Cost breakdown */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-700 mb-2">Kostnad</h4>
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-3 gap-2 text-xs text-slate-500 font-medium">
                      <div></div>
                      <div className="text-right">Per enhet</div>
                      <div className="text-right">Totalt ({quantity}×)</div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-slate-600">Ex moms:</span>
                      <span className="font-medium text-right">{formatSek(perUnitCostExVat)}</span>
                      <span className="font-medium text-right">{formatSek(perUnitCostExVat * quantity)}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-slate-600">Inkl moms:</span>
                      <span className="font-medium text-right">{formatSek(perUnitCostIncVat)}</span>
                      <span className="font-medium text-right">{formatSek(perUnitCostIncVat * quantity)}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                      <span className="text-slate-600">Efter Grön Teknik:</span>
                      <span className="font-semibold text-green-600 text-right">{formatSek(perUnitCostAfterGronTeknik)}</span>
                      <span className="font-semibold text-green-600 text-right">{formatSek(unit.subtotalCostAfterGronTeknikSek)}</span>
                    </div>
                  </div>
                </div>

                {/* Savings breakdown */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-700 mb-2">Årlig besparing</h4>
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-3 gap-2 text-xs text-slate-500 font-medium">
                      <div></div>
                      <div className="text-right">Per enhet</div>
                      <div className="text-right">Totalt ({quantity}×)</div>
                    </div>

                    {perUnitResults.spotprisSavingsSek > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-slate-600 flex items-center gap-2">
                          <div className="w-2 h-2 rounded bg-blue-500"></div>
                          Spotpris:
                        </span>
                        <span className="font-medium text-right">{formatSek(perUnitResults.spotprisSavingsSek)}</span>
                        <span className="font-medium text-right">{formatSek(perUnitResults.spotprisSavingsSek * quantity)}</span>
                      </div>
                    )}

                    {perUnitResults.effectTariffSavingsSek > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-slate-600 flex items-center gap-2">
                          <div className="w-2 h-2 rounded bg-green-500"></div>
                          Effekttariff:
                        </span>
                        <span className="font-medium text-right">{formatSek(perUnitResults.effectTariffSavingsSek)}</span>
                        <span className="font-medium text-right">{formatSek(perUnitResults.effectTariffSavingsSek * quantity)}</span>
                      </div>
                    )}

                    {perUnitResults.gridServicesIncomeSek > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-slate-600 flex items-center gap-2">
                          <div className="w-2 h-2 rounded bg-purple-500"></div>
                          Stödtjänster:
                        </span>
                        <span className="font-medium text-right">{formatSek(perUnitResults.gridServicesIncomeSek)}</span>
                        <span className="font-medium text-right">{formatSek(perUnitResults.gridServicesIncomeSek * quantity)}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t font-semibold">
                      <span className="text-slate-900">Total:</span>
                      <span className="text-green-600 text-right">{formatSek(perUnitResults.totalAnnualSavingsSek)}</span>
                      <span className="text-green-600 text-right">{formatSek(unit.subtotalAnnualSavingsSek)}</span>
                    </div>
                  </div>
                </div>

                {/* Grid services stacking detail for Emaldo batteries */}
                {perUnitResults.gridServicesIncomeSek > 0 && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded bg-purple-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div className="text-xs">
                        <div className="font-medium text-purple-900 mb-1">
                          Stödtjänster staplas per fysisk enhet
                        </div>
                        <div className="text-purple-700">
                          Varje batteri kan registreras separat för frekvensreglering ({formatSek(perUnitResults.gridServicesIncomeSek)}/enhet/år × {quantity} = {formatSek(perUnitResults.gridServicesIncomeSek * quantity)}/år)
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ROI metrics */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-700 mb-2">ROI per enhet</h4>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="text-center p-2 bg-slate-50 rounded">
                      <div className="text-xs text-slate-500 mb-1">Återbetalningstid</div>
                      <div className="font-semibold text-slate-900">
                        {Math.floor(perUnitResults.paybackPeriodYears)} år {Math.round((perUnitResults.paybackPeriodYears % 1) * 12)} mån
                      </div>
                    </div>
                    <div className="text-center p-2 bg-slate-50 rounded">
                      <div className="text-xs text-slate-500 mb-1">ROI 10 år</div>
                      <div className={`font-semibold ${perUnitResults.roi10YearPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {perUnitResults.roi10YearPercent.toFixed(1)}%
                      </div>
                    </div>
                    <div className="text-center p-2 bg-slate-50 rounded">
                      <div className="text-xs text-slate-500 mb-1">ROI 15 år</div>
                      <div className={`font-semibold ${perUnitResults.roi15YearPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {perUnitResults.roi15YearPercent.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </details>
          )
        })}
      </div>
    </div>
  )
}
