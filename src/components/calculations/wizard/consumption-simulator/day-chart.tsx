'use client'

/**
 * 24-hour bar chart for consumption profile editing.
 *
 * Features:
 * - Interactive bars with click-to-edit
 * - Day/night coloring based on time windows
 * - Tooltip with consumption details
 * - Expandable grid for precise manual input
 */

import { useState } from 'react'
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

interface DayChartProps {
  data: number[] // 24 values
  onUpdate: (hour: number, value: number) => void
  dayHourStart?: number
  dayHourEnd?: number
}

export function DayChart({ data, onUpdate, dayHourStart = 6, dayHourEnd = 22 }: DayChartProps) {
  const [editingHour, setEditingHour] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')

  const chartData = data.map((value, hour) => ({
    hour,
    label: `${hour.toString().padStart(2, '0')}`,
    value: value || 0,
    isDay: hour >= dayHourStart && hour < dayHourEnd,
  }))

  const handleBarClick = (_: unknown, index: number) => {
    const entry = chartData[index]
    setEditingHour(entry.hour)
    setEditValue(entry.value.toFixed(2))
  }

  const handleEditSubmit = () => {
    if (editingHour !== null) {
      const newValue = parseFloat(editValue)
      if (!isNaN(newValue) && newValue >= 0) {
        onUpdate(editingHour, newValue)
      }
      setEditingHour(null)
    }
  }

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10 }}
            interval={2}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            label={{ value: 'kWh', angle: -90, position: 'insideLeft', fontSize: 11, dx: 10 }}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload?.[0]) {
                const d = payload[0].payload as typeof chartData[number]
                return (
                  <div className="bg-white p-2 border rounded shadow-lg text-sm">
                    <p className="font-medium">{d.label}:00</p>
                    <p>{d.value.toFixed(2)} kWh</p>
                    <p className="text-xs text-gray-500">
                      {d.isDay ? 'Dagtid (hogre pris)' : 'Nattetid (lagre pris)'}
                    </p>
                  </div>
                )
              }
              return null
            }}
          />
          <Bar dataKey="value" onClick={handleBarClick} cursor="pointer">
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.isDay ? '#3B82F6' : '#1E40AF'}
                stroke={editingHour === entry.hour ? '#F59E0B' : undefined}
                strokeWidth={editingHour === entry.hour ? 2 : 0}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex justify-center gap-6 text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-500 rounded" />
          <span>Dagtid ({dayHourStart}:00-{dayHourEnd}:00)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-900 rounded" />
          <span>Nattetid</span>
        </div>
      </div>

      {/* Inline edit */}
      {editingHour !== null && (
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
          <span className="font-medium text-sm">
            {editingHour.toString().padStart(2, '0')}:00
          </span>
          <input
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleEditSubmit()}
            className="w-20 px-2 py-1 text-sm border rounded"
            step="0.01"
            min="0"
            autoFocus
          />
          <span className="text-sm text-gray-500">kWh</span>
          <button
            type="button"
            onClick={handleEditSubmit}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded"
          >
            OK
          </button>
          <button
            type="button"
            onClick={() => setEditingHour(null)}
            className="px-3 py-1 text-sm text-gray-600"
          >
            Avbryt
          </button>
        </div>
      )}

      {/* Manual input grid */}
      <details className="cursor-pointer">
        <summary className="text-sm text-gray-600 hover:text-gray-900">
          Visa alla timvarden
        </summary>
        <div className="mt-2 grid grid-cols-6 gap-2 text-sm">
          {data.map((value, hour) => (
            <div key={hour} className="flex items-center gap-1">
              <span className="w-8 text-gray-500 text-xs">
                {hour.toString().padStart(2, '0')}:
              </span>
              <input
                type="number"
                value={(value || 0).toFixed(2)}
                onChange={(e) => {
                  const v = parseFloat(e.target.value)
                  if (!isNaN(v) && v >= 0) onUpdate(hour, v)
                }}
                className="w-16 px-1 py-0.5 text-xs border rounded text-right"
                step="0.01"
                min="0"
              />
            </div>
          ))}
        </div>
      </details>
    </div>
  )
}
