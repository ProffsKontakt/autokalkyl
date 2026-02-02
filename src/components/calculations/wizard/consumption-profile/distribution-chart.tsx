'use client'

/**
 * Monthly consumption distribution chart using Recharts AreaChart.
 *
 * Displays 12 months of consumption data as an area chart
 * showing the seasonal pattern based on heating type.
 *
 * Features:
 * - Gradient fill (blue gradient like ROI chart)
 * - Swedish month names
 * - Tooltip with exact kWh values
 * - Total annual kWh in header
 * - Graceful handling when heatingType is null
 *
 * @see roi-timeline-chart.tsx for pattern reference
 */

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { HeatingType } from '@prisma/client'
import { distributeAnnualConsumption, HEATING_TYPE_PROFILES } from '@/lib/calculations/consumption-profiles'

interface DistributionChartProps {
  annualKwh: number
  heatingType: HeatingType | null
  /** Optional height - retained for backward compatibility but ignored (uses fixed h-52) */
  height?: number
}

/** Swedish month names shortened to 3 characters */
const MONTH_NAMES_SV = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec']

export function DistributionChart({
  annualKwh,
  heatingType,
}: DistributionChartProps) {
  // Format kWh for Y-axis (e.g., "2k")
  const formatKwh = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}k`
    }
    return Math.round(value).toString()
  }

  // Placeholder state when no heating type selected
  if (!heatingType) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Manatlig fordelning
          </h3>
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {annualKwh.toLocaleString('sv-SE')} kWh/ar
          </span>
        </div>

        <div className="h-52 flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center px-4">
            Valj uppvarmningstyp for att se fordelningen over aret
          </p>
        </div>
      </div>
    )
  }

  // Calculate monthly distribution
  const monthlyKwh = distributeAnnualConsumption(annualKwh, heatingType)

  // Build chart data
  const data = monthlyKwh.map((kwh, index) => ({
    month: MONTH_NAMES_SV[index],
    kWh: Math.round(kwh),
  }))

  const profile = HEATING_TYPE_PROFILES[heatingType]

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Manatlig fordelning
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {profile.name}
          </p>
        </div>
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {annualKwh.toLocaleString('sv-SE')} kWh/ar
        </span>
      </div>

      {/* Chart */}
      <div className="h-52 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="consumptionGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.05} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#e2e8f0"
              className="dark:opacity-20"
            />

            <XAxis
              dataKey="month"
              tick={{ fontSize: 10, fill: '#64748b' }}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              interval={0}
            />

            <YAxis
              tickFormatter={formatKwh}
              tick={{ fontSize: 10, fill: '#64748b' }}
              tickLine={false}
              axisLine={false}
              width={35}
            />

            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white dark:bg-slate-800 p-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-200">
                        {label}
                      </p>
                      <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                        {Number(payload[0].value).toLocaleString('sv-SE')} kWh
                      </p>
                    </div>
                  )
                }
                return null
              }}
            />

            <Area
              type="monotone"
              dataKey="kWh"
              stroke="#3B82F6"
              strokeWidth={2}
              fill="url(#consumptionGradient)"
              animationDuration={800}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
