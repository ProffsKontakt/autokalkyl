'use client'

import { useState } from 'react'
import type { CalculationResultsPublic } from '@/lib/share/types'
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

interface PublicResultsViewProps {
  results: CalculationResultsPublic
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
  const [showDetailedBreakdown, setShowDetailedBreakdown] = useState(false)

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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Årlig besparing: {formatSek(results.totalAnnualSavings)}
          </h3>
          <button
            onClick={() => setShowDetailedBreakdown(!showDetailedBreakdown)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            {showDetailedBreakdown ? 'Visa mindre' : 'Visa detaljer'}
          </button>
        </div>

        {/* Grouped view (default) */}
        {!showDetailedBreakdown && (
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
        )}

        {/* Detailed breakdown (expanded) */}
        {showDetailedBreakdown && (
          <div className="space-y-4 text-sm">
            <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Spotprisoptimering</h4>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                Batteriet laddar när elpriset är lågt (natt) och använder energin när priset är högt (dag).
              </p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                {formatSek(results.spotprisSavings)}/år
              </p>
            </div>
            <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Effekttariffbesparing</h4>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                Batteriet minskar dina effekttoppar och sänker din elnätavgift.
              </p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {formatSek(results.effectTariffSavings)}/år
              </p>
            </div>
            <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Stödtjänster</h4>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                Du kan tjäna pengar på att låta elnätet använda ditt batteri för frekvensreglering.
              </p>
              <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {formatSek(results.gridServicesIncome)}/år
              </p>
            </div>
          </div>
        )}
      </section>

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
