'use client'

import { useState } from 'react'
import type { CalculationResultsPublicWithBreakdown } from '@/lib/share/types'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts'
import { SpotprisBreakdown } from '@/components/calculations/breakdowns/spotpris-breakdown'
import { EffektBreakdown } from '@/components/calculations/breakdowns/effekt-breakdown'
import { StodtjansterBreakdown } from '@/components/calculations/breakdowns/stodtjanster-breakdown'

interface PublicResultsViewProps {
  results: CalculationResultsPublicWithBreakdown
  primaryColor: string
}

function formatSek(value: number): string {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'SEK',
    maximumFractionDigits: 0,
  }).format(value)
}

export function PublicResultsView({ results, primaryColor }: PublicResultsViewProps) {
  // Savings breakdown data
  const savingsData = [
    { name: 'Spotprisoptimering', value: results.spotprisSavings, color: '#10B981' },
    { name: 'Effekttariffbesparing', value: results.effectTariffSavings, color: '#3B82F6' },
    { name: 'Stödtjänster', value: results.gridServicesIncome, color: '#8B5CF6' },
  ].filter(d => d.value > 0)

  // 15-year ROI timeline data
  const timelineData = Array.from({ length: 16 }, (_, year) => {
    const cumulativeSavings = results.totalAnnualSavings * year
    const investment = results.costAfterGronTeknik
    const netPosition = cumulativeSavings - investment

    return {
      year,
      savings: cumulativeSavings,
      investment,
      net: netPosition,
    }
  })

  const breakEvenYear = Math.ceil(results.paybackYears)

  return (
    <div className="space-y-6">
      {/* Savings breakdown */}
      <section className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Årlig besparing: {formatSek(results.totalAnnualSavings)}
        </h3>

        <div className="flex flex-col lg:flex-row items-center gap-6">
          <div className="w-48 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={savingsData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                >
                  {savingsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-3">
            {savingsData.map((item) => (
              <div key={item.name} className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="flex-1 text-gray-700 dark:text-gray-300">{item.name}</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{formatSek(item.value)}/år</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRANS-02: Expandable formula breakdowns */}
      {results.breakdown && (
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Så har vi räknat
          </h3>

          {/* SPOT-04: Spotpris breakdown */}
          {results.spotprisSavings > 0 && (
            <SpotprisBreakdown
              capacityKwh={results.breakdown.spotpris.capacityKwh}
              cyclesPerDay={results.breakdown.spotpris.cyclesPerDay}
              efficiency={results.breakdown.spotpris.efficiency}
              spreadOre={results.breakdown.spotpris.spreadOre}
              annualSavingsSek={results.breakdown.spotpris.annualSavingsSek}
            />
          )}

          {/* PEAK-04: Effektavgift breakdown */}
          {results.effectTariffSavings > 0 && (
            <EffektBreakdown
              currentPeakKw={results.breakdown.effekt.currentPeakKw}
              peakShavingPercent={results.breakdown.effekt.peakShavingPercent}
              actualPeakShavingKw={results.breakdown.effekt.actualPeakShavingKw}
              newPeakKw={results.breakdown.effekt.newPeakKw}
              tariffRateSekKw={results.breakdown.effekt.tariffRateSekKw}
              annualSavingsSek={results.breakdown.effekt.annualSavingsSek}
              isConstrained={results.breakdown.effekt.isConstrained}
            />
          )}

          {/* GRID-05: Stodtjanster breakdown */}
          {results.gridServicesIncome > 0 && (
            <StodtjansterBreakdown
              elomrade={results.breakdown.stodtjanster.elomrade}
              isEmaldoBattery={results.breakdown.stodtjanster.isEmaldoBattery}
              batteryCapacityKw={results.breakdown.stodtjanster.batteryCapacityKw}
              guaranteedMonthlySek={results.breakdown.stodtjanster.guaranteedMonthlySek}
              guaranteedAnnualSek={results.breakdown.stodtjanster.guaranteedAnnualSek}
              postCampaignRatePerKwYear={results.breakdown.stodtjanster.postCampaignRatePerKwYear}
              postCampaignAnnualSek={results.breakdown.stodtjanster.postCampaignAnnualSek}
              displayedAnnualSek={results.breakdown.stodtjanster.displayedAnnualSek}
            />
          )}
        </section>
      )}

      {/* ROI Timeline Chart */}
      <section className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Avkastning över tid
        </h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.2} />
              <XAxis
                dataKey="year"
                label={{ value: 'År', position: 'insideBottom', offset: -5 }}
                tick={{ fontSize: 12 }}
                stroke="#9CA3AF"
              />
              <YAxis
                tickFormatter={(value) => {
                  if (Math.abs(value) >= 1000000) {
                    return `${(value / 1000000).toFixed(1)}mkr`
                  }
                  if (Math.abs(value) >= 1000) {
                    return `${(value / 1000).toFixed(0)}tkr`
                  }
                  return value.toString()
                }}
                tick={{ fontSize: 12 }}
                stroke="#9CA3AF"
              />
              <Tooltip
                formatter={(value) => formatSek(Number(value))}
                labelFormatter={(label) => `År ${label}`}
                contentStyle={{
                  backgroundColor: 'rgba(30, 41, 59, 0.95)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#F3F4F6',
                }}
              />
              <Legend />
              <ReferenceLine
                x={breakEvenYear}
                stroke="#10B981"
                strokeDasharray="5 5"
                label={{
                  value: 'Break-even',
                  position: 'top',
                  fill: '#10B981',
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="savings"
                name="Kumulativ besparing"
                stroke="#10B981"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="investment"
                name="Investeringskostnad"
                stroke="#EF4444"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="net"
                name="Nettoposition"
                stroke={primaryColor}
                strokeWidth={3}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 text-center">
          Efter {results.paybackYears.toFixed(1)} år har du tjänat tillbaka din investering.
          På 15 år sparar du totalt {formatSek(results.totalAnnualSavings * 15 - results.costAfterGronTeknik)}.
        </p>
      </section>
    </div>
  )
}
