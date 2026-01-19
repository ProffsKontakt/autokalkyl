'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import type { CalculationResults } from '@/lib/calculations/types'

interface ROITimelineChartProps {
  results: CalculationResults
  batteryName?: string
}

export function ROITimelineChart({ results, batteryName }: ROITimelineChartProps) {
  // Generate 15-year timeline data
  const data = Array.from({ length: 16 }, (_, year) => {
    const cumulativeSavings = results.totalAnnualSavingsSek * year
    const netPosition = cumulativeSavings - results.costAfterGronTeknikSek

    return {
      year,
      savings: Math.round(cumulativeSavings),
      net: Math.round(netPosition),
      cost: Math.round(results.costAfterGronTeknikSek),
    }
  })

  const formatSek = (n: number) => {
    if (Math.abs(n) >= 1000000) {
      return (n / 1000000).toFixed(1) + ' mkr'
    }
    if (Math.abs(n) >= 1000) {
      return (n / 1000).toFixed(0) + ' tkr'
    }
    return n.toFixed(0) + ' kr'
  }

  // Find break-even year
  const breakEvenYear = data.find(d => d.net >= 0)?.year || 15

  return (
    <div className="bg-white border rounded-lg p-4">
      <h3 className="font-medium text-gray-900 mb-4">ROI-utveckling over 15 ar</h3>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="year"
            label={{ value: 'Ar', position: 'bottom', offset: -5 }}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            tickFormatter={formatSek}
            tick={{ fontSize: 11 }}
            width={70}
          />
          <Tooltip
            formatter={(value, name) => [
              formatSek(Number(value)),
              name === 'savings' ? 'Kumulativ besparing' :
              name === 'net' ? 'Nettoresultat' : 'Investeringskostnad'
            ]}
            labelFormatter={(year) => `Ar ${year}`}
          />
          <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />

          {/* Cost line (flat) */}
          <Line
            type="monotone"
            dataKey="cost"
            stroke="#EF4444"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            name="Kostnad"
          />

          {/* Cumulative savings */}
          <Line
            type="monotone"
            dataKey="savings"
            stroke="#10B981"
            strokeWidth={2}
            dot={false}
            name="Besparing"
          />

          {/* Net position */}
          <Line
            type="monotone"
            dataKey="net"
            stroke="#3B82F6"
            strokeWidth={3}
            dot={{ fill: '#3B82F6', r: 3 }}
            activeDot={{ r: 6 }}
            name="Netto"
          />

          {/* Break-even marker */}
          <ReferenceLine
            x={breakEvenYear}
            stroke="#22C55E"
            strokeWidth={2}
            label={{
              value: `Break-even ar ${breakEvenYear}`,
              position: 'top',
              fill: '#22C55E',
              fontSize: 11,
            }}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="flex justify-center gap-6 mt-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-4 h-0.5 bg-green-500" />
          <span className="text-gray-600">Kumulativ besparing</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-0.5 bg-red-500 border-dashed" style={{ borderWidth: 1, borderStyle: 'dashed' }} />
          <span className="text-gray-600">Investeringskostnad</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-1 bg-blue-500 rounded" />
          <span className="text-gray-600">Nettoresultat</span>
        </div>
      </div>
    </div>
  )
}
