'use client'

/**
 * Main consumption simulator component.
 *
 * Combines all consumption editing functionality:
 * - Preset selection for quick setup
 * - Monthly tabs for month-by-month editing
 * - Copy pattern functionality to duplicate months
 * - Day chart for 24-hour profile editing
 * - Summary and scaling to match annual total
 */

import { useState } from 'react'
import { useCalculationWizardStore } from '@/stores/calculation-wizard-store'
import { DayChart } from './day-chart'
import { MonthTabs } from './month-tabs'
import { Presets } from './presets'
import { MONTHS } from '@/lib/calculations/constants'

export function ConsumptionSimulator() {
  const [selectedMonth, setSelectedMonth] = useState(0)
  const [copyMode, setCopyMode] = useState(false)
  const [copyTargets, setCopyTargets] = useState<number[]>([])

  const {
    consumptionProfile,
    annualConsumptionKwh,
    updateConsumptionHour,
    applyPresetToProfile,
    copyMonthPattern,
    scaleProfileToAnnual,
  } = useCalculationWizardStore()

  // Calculate totals
  const monthTotals = consumptionProfile.data.map(month =>
    month.reduce((sum, hour) => sum + hour, 0) * 30
  )
  const profileTotal = monthTotals.reduce((sum, m) => sum + m, 0)
  const variance = annualConsumptionKwh > 0
    ? ((profileTotal - annualConsumptionKwh) / annualConsumptionKwh * 100).toFixed(1)
    : '0'

  const handleCopyStart = () => {
    setCopyMode(true)
    setCopyTargets([])
  }

  const handleCopyToggle = (month: number) => {
    if (month === selectedMonth) return
    setCopyTargets(prev =>
      prev.includes(month)
        ? prev.filter(m => m !== month)
        : [...prev, month]
    )
  }

  const handleCopyExecute = () => {
    if (copyTargets.length > 0) {
      copyMonthPattern(selectedMonth, copyTargets)
    }
    setCopyMode(false)
    setCopyTargets([])
  }

  return (
    <div className="space-y-6">
      {/* Presets */}
      <Presets onApply={applyPresetToProfile} />

      {/* Month tabs */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Manad
          </label>
          {!copyMode ? (
            <button
              type="button"
              onClick={handleCopyStart}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Kopiera monster...
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCopyExecute}
                disabled={copyTargets.length === 0}
                className="text-sm text-green-600 hover:text-green-800 disabled:text-gray-400"
              >
                Kopiera till {copyTargets.length} manad(er)
              </button>
              <button
                type="button"
                onClick={() => { setCopyMode(false); setCopyTargets([]) }}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Avbryt
              </button>
            </div>
          )}
        </div>

        {copyMode ? (
          <div className="flex flex-wrap gap-1">
            {MONTHS.map((month, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleCopyToggle(index)}
                disabled={index === selectedMonth}
                className={`
                  px-3 py-2 text-sm rounded-md transition-colors
                  ${index === selectedMonth
                    ? 'bg-blue-600 text-white cursor-not-allowed'
                    : copyTargets.includes(index)
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                {month}
              </button>
            ))}
          </div>
        ) : (
          <MonthTabs
            selectedMonth={selectedMonth}
            onSelectMonth={setSelectedMonth}
            monthTotals={monthTotals}
          />
        )}
      </div>

      {/* Chart */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Dygnsprofil - {MONTHS[selectedMonth]}
          </label>
          <span className="text-sm text-gray-500">
            Klicka pa en stapel for att redigera
          </span>
        </div>
        <DayChart
          data={consumptionProfile.data[selectedMonth]}
          onUpdate={(hour, value) => updateConsumptionHour(selectedMonth, hour, value)}
        />
      </div>

      {/* Summary and scaling */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-sm text-gray-600">Profil totalt: </span>
            <span className="text-sm font-medium">
              {Math.round(profileTotal).toLocaleString('sv-SE')} kWh/ar
            </span>
          </div>
          <div>
            <span className="text-sm text-gray-600">Mal: </span>
            <span className="text-sm font-medium">
              {annualConsumptionKwh.toLocaleString('sv-SE')} kWh/ar
            </span>
          </div>
          <div className={`text-sm ${Math.abs(Number(variance)) > 5 ? 'text-amber-600' : 'text-green-600'}`}>
            {Number(variance) > 0 ? '+' : ''}{variance}%
          </div>
        </div>

        {Math.abs(Number(variance)) > 1 && (
          <button
            type="button"
            onClick={scaleProfileToAnnual}
            className="w-full px-4 py-2 text-sm text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
          >
            Skala profilen till {annualConsumptionKwh.toLocaleString('sv-SE')} kWh/ar
          </button>
        )}
      </div>
    </div>
  )
}
