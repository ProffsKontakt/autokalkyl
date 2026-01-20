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
    { name: 'Stodtjanster', value: results.gridServicesIncome, color: '#8B5CF6' },
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
      <section className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Arlig besparing: {formatSek(results.totalAnnualSavings)}
          </h3>
          <button
            onClick={() => setShowDetailedBreakdown(!showDetailedBreakdown)}
            className="text-sm text-blue-600 hover:underline"
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
                  <span className="flex-1 text-gray-700">{item.name}</span>
                  <span className="font-medium">{formatSek(item.value)}/ar</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detailed breakdown (expanded) */}
        {showDetailedBreakdown && (
          <div className="space-y-4 text-sm">
            <div className="border rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Spotprisoptimering</h4>
              <p className="text-gray-600 mb-2">
                Batteriet laddar nar elpriset ar lagt (natt) och anvander energin nar priset ar hogt (dag).
              </p>
              <p className="text-lg font-bold text-green-600">
                {formatSek(results.spotprisSavings)}/ar
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Effekttariffbesparing</h4>
              <p className="text-gray-600 mb-2">
                Batteriet minskar dina effekttoppar och sanker din elnatavgift.
              </p>
              <p className="text-lg font-bold text-blue-600">
                {formatSek(results.effectTariffSavings)}/ar
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Stodtjanster</h4>
              <p className="text-gray-600 mb-2">
                Du kan tjana pengar pa att lata elnatet anvanda ditt batteri for frekvensreglering.
              </p>
              <p className="text-lg font-bold text-purple-600">
                {formatSek(results.gridServicesIncome)}/ar
              </p>
            </div>
          </div>
        )}
      </section>

      {/* ROI Timeline Chart */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Avkastning over tid
        </h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="year"
                label={{ value: 'Ar', position: 'insideBottom', offset: -5 }}
                tick={{ fontSize: 12 }}
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
              />
              <Tooltip
                formatter={(value) => formatSek(Number(value))}
                labelFormatter={(label) => `Ar ${label}`}
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
        <p className="text-sm text-gray-500 mt-4 text-center">
          Efter {results.paybackYears.toFixed(1)} ar har du tjanat tillbaka din investering.
          Pa 15 ar sparar du totalt {formatSek(results.totalAnnualSavings * 15 - results.costAfterGronTeknik)}.
        </p>
      </section>
    </div>
  )
}
