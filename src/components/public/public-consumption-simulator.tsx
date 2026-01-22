'use client'

import { useState, useMemo, useCallback } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { calculateBatteryROI } from '@/lib/calculations/engine'
import type { CalculationResultsPublic, PublicBatteryInfo } from '@/lib/share/types'
import type { Elomrade } from '@prisma/client'
import { VariantIndicator } from './variant-indicator'
import { trackSimulatorAdjusted } from '@/lib/analytics/events'
import {
  VAT_RATE,
  GRON_TEKNIK_RATE,
  DEFAULT_GRID_SERVICES_RATE,
  DEFAULT_CYCLES_PER_DAY,
  DEFAULT_AVG_DISCHARGE_PERCENT,
} from '@/lib/calculations/constants'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec']
const HOURS = Array.from({ length: 24 }, (_, i) => i)

interface PublicConsumptionSimulatorProps {
  calculationId: string
  originalProfile: { data: number[][] }
  originalAnnualKwh: number
  originalResults: CalculationResultsPublic
  battery: PublicBatteryInfo
  natagare: {
    dayRateSekKw: number
    nightRateSekKw: number
    dayStartHour: number
    dayEndHour: number
  }
  elomrade: Elomrade
  quarterlyPrices: {
    avgDayPriceOre: number
    avgNightPriceOre: number
  }
  onResultsChange?: (results: CalculationResultsPublic, profile: number[][], annualKwh: number) => void
  primaryColor: string
}

export function PublicConsumptionSimulator({
  calculationId,
  originalProfile,
  originalAnnualKwh,
  originalResults,
  battery,
  natagare,
  quarterlyPrices,
  onResultsChange,
  primaryColor,
}: PublicConsumptionSimulatorProps) {
  // State
  const [profile, setProfile] = useState<number[][]>(() =>
    originalProfile.data.map(month => [...month])
  )
  const [selectedMonth, setSelectedMonth] = useState(0)
  const [results, setResults] = useState(originalResults)
  const [isDirty, setIsDirty] = useState(false)
  const [isRecalculating, setIsRecalculating] = useState(false)
  const [editingHour, setEditingHour] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')

  // Calculate annual consumption from profile
  const annualKwh = useMemo(() => {
    return profile.reduce((total, month) => {
      return total + month.reduce((sum, hour) => sum + hour, 0) * 30.44 // avg days per month
    }, 0)
  }, [profile])

  // Track which hours have changed
  const changedHours = useMemo(() => {
    const changes: Set<string> = new Set()
    profile.forEach((month, m) => {
      month.forEach((value, h) => {
        if (Math.abs(value - originalProfile.data[m][h]) > 0.01) {
          changes.add(`${m}-${h}`)
        }
      })
    })
    return changes
  }, [profile, originalProfile])

  const hasChanges = changedHours.size > 0

  // Handle hour click to edit
  const handleHourClick = (hour: number) => {
    setEditingHour(hour)
    setEditValue(profile[selectedMonth][hour].toFixed(2))
  }

  // Handle edit submit
  const handleEditSubmit = () => {
    if (editingHour === null) return
    const value = parseFloat(editValue)
    if (isNaN(value) || value < 0) return

    const oldValue = profile[selectedMonth][editingHour]
    const newProfile = profile.map((month, m) =>
      m === selectedMonth
        ? month.map((v, h) => (h === editingHour ? value : v))
        : [...month]
    )
    setProfile(newProfile)
    setIsDirty(true)
    setEditingHour(null)

    // Track simulator adjustment
    trackSimulatorAdjusted(calculationId, selectedMonth, editingHour, oldValue, value)
  }

  // Handle recalculation
  const handleRecalculate = useCallback(async () => {
    setIsRecalculating(true)

    // Small delay to show loading state
    await new Promise(resolve => setTimeout(resolve, 100))

    try {
      // Use the actual calculation engine with proper inputs
      const { results: engineResults } = calculateBatteryROI({
        battery: {
          capacityKwh: battery.capacityKwh,
          maxDischargeKw: battery.maxDischargeKw,
          maxChargeKw: battery.maxChargeKw,
          chargeEfficiency: battery.chargeEfficiency / 100,
          dischargeEfficiency: battery.dischargeEfficiency / 100,
          costPrice: 0, // Not needed for public recalc
        },
        cyclesPerDay: DEFAULT_CYCLES_PER_DAY,
        avgDischargePercent: DEFAULT_AVG_DISCHARGE_PERCENT,
        dayPriceOre: quarterlyPrices.avgDayPriceOre,
        nightPriceOre: quarterlyPrices.avgNightPriceOre,
        effectTariffDayRate: natagare.dayRateSekKw,
        effectTariffNightRate: natagare.nightRateSekKw,
        gridServicesRatePerKwYear: DEFAULT_GRID_SERVICES_RATE,
        totalPriceExVat: battery.totalPriceExVat,
        installationCost: 0, // Not shown to prospect
        vatRate: VAT_RATE,
        gronTeknikRate: GRON_TEKNIK_RATE,
      })

      const publicResults: CalculationResultsPublic = {
        totalPriceExVat: battery.totalPriceExVat,
        totalPriceIncVat: battery.totalPriceIncVat,
        costAfterGronTeknik: battery.costAfterGronTeknik,
        effectiveCapacityKwh: engineResults.effectiveCapacityPerCycleKwh,
        annualEnergyKwh: engineResults.energyFromBatteryPerYearKwh,
        spotprisSavings: engineResults.spotprisSavingsSek,
        effectTariffSavings: engineResults.effectTariffSavingsSek,
        gridServicesIncome: engineResults.gridServicesIncomeSek,
        totalAnnualSavings: engineResults.totalAnnualSavingsSek,
        paybackYears: engineResults.paybackPeriodYears,
        roi10Year: engineResults.roi10YearPercent,
        roi15Year: engineResults.roi15YearPercent,
      }

      setResults(publicResults)
      setIsDirty(false)
      onResultsChange?.(publicResults, profile, annualKwh)
    } catch (error) {
      console.error('Recalculation failed:', error)
    }

    setIsRecalculating(false)
  }, [profile, annualKwh, battery, natagare, quarterlyPrices, onResultsChange])

  // Reset to original
  const handleReset = () => {
    setProfile(originalProfile.data.map(month => [...month]))
    setResults(originalResults)
    setIsDirty(false)
  }

  // Chart data for selected month
  const chartData = HOURS.map(hour => ({
    hour: hour.toString().padStart(2, '0'),
    value: profile[selectedMonth][hour],
    isChanged: changedHours.has(`${selectedMonth}-${hour}`),
    isNight: hour < natagare.dayStartHour || hour >= natagare.dayEndHour,
  }))

  return (
    <section className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Din förbrukning
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Klicka på en stapel för att justera din förbrukning och se hur det påverkar din besparing.
            </p>
          </div>
          {hasChanges && (
            <VariantIndicator
              changedCount={changedHours.size}
              onReset={handleReset}
            />
          )}
        </div>
      </div>

      {/* Month tabs - swipeable on mobile */}
      <div className="border-b overflow-x-auto scrollbar-hide">
        <div className="flex px-4 py-2 gap-1 min-w-max">
          {MONTHS.map((month, index) => (
            <button
              key={month}
              onClick={() => setSelectedMonth(index)}
              className={`px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                selectedMonth === index
                  ? 'text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              style={
                selectedMonth === index
                  ? { backgroundColor: primaryColor }
                  : undefined
              }
            >
              {month}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="p-4">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 10 }}
                interval={2}
              />
              <YAxis
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => `${v.toFixed(1)}`}
                label={{
                  value: 'kWh',
                  angle: -90,
                  position: 'insideLeft',
                  fontSize: 10,
                }}
              />
              <Tooltip
                formatter={(value) => [`${Number(value).toFixed(2)} kWh`, 'Förbrukning']}
                labelFormatter={(label) => `Kl ${label}:00`}
              />
              <Bar
                dataKey="value"
                onClick={(_, index) => handleHourClick(index)}
                cursor="pointer"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.isChanged
                        ? '#F59E0B' // Changed: orange
                        : entry.isNight
                        ? '#6366F1' // Night: indigo
                        : primaryColor // Day: brand color
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: primaryColor }} />
            <span>Dagförbrukning</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-indigo-500" />
            <span>Nattförbrukning</span>
          </div>
          {hasChanges && (
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-amber-500" />
              <span>Ändrad</span>
            </div>
          )}
        </div>
      </div>

      {/* Edit modal */}
      {editingHour !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h4 className="text-lg font-medium mb-4">
              Ändra förbrukning kl {editingHour.toString().padStart(2, '0')}:00
            </h4>
            <div className="flex gap-2">
              <input
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                step="0.1"
                min="0"
                className="flex-1 px-3 py-2 border rounded-md"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleEditSubmit()}
              />
              <span className="self-center text-gray-500">kWh</span>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setEditingHour(null)}
                className="flex-1 px-4 py-2 border rounded-md hover:bg-gray-50"
              >
                Avbryt
              </button>
              <button
                onClick={handleEditSubmit}
                className="flex-1 px-4 py-2 text-white rounded-md"
                style={{ backgroundColor: primaryColor }}
              >
                Spara
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update button */}
      <div className="p-4 bg-gray-50 border-t">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Årsförbrukning: <span className="font-medium">{Math.round(annualKwh).toLocaleString('sv-SE')} kWh</span>
            {annualKwh !== originalAnnualKwh && (
              <span className="text-amber-600 ml-2">
                ({annualKwh > originalAnnualKwh ? '+' : ''}
                {Math.round(annualKwh - originalAnnualKwh).toLocaleString('sv-SE')})
              </span>
            )}
          </div>
          <button
            onClick={handleRecalculate}
            disabled={!isDirty || isRecalculating}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              isDirty
                ? 'text-white hover:opacity-90'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
            style={isDirty ? { backgroundColor: primaryColor } : undefined}
          >
            {isRecalculating ? 'Räknar...' : 'Uppdatera'}
          </button>
        </div>
      </div>
    </section>
  )
}
