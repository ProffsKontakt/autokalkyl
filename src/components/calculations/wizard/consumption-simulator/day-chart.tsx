'use client'

/**
 * 24-hour bar chart for consumption profile editing.
 *
 * Features:
 * - Interactive bars with click-to-edit
 * - Day/night coloring based on time windows
 * - Animated bars with Motion
 * - Tooltip with consumption details
 * - Expandable grid for precise manual input
 */

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ResponsiveBar, BarDatum } from '@nivo/bar'

interface DayChartProps {
  data: number[] // 24 values
  onUpdate: (hour: number, value: number) => void
  dayHourStart?: number
  dayHourEnd?: number
}

interface ChartDataItem extends BarDatum {
  hour: string
  hourNum: number
  value: number
  isDayTime: number // 1 for day, 0 for night (using number to satisfy BarDatum)
}

export function DayChart({ data, onUpdate, dayHourStart = 6, dayHourEnd = 22 }: DayChartProps) {
  const [editingHour, setEditingHour] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')
  const [hoveredHour, setHoveredHour] = useState<number | null>(null)

  const chartData: ChartDataItem[] = useMemo(() => data.map((value, hour) => ({
    hour: hour.toString().padStart(2, '0'),
    hourNum: hour,
    value: value || 0,
    isDayTime: hour >= dayHourStart && hour < dayHourEnd ? 1 : 0,
  })), [data, dayHourStart, dayHourEnd])

  const maxValue = Math.max(...chartData.map(d => d.value), 0.1)

  const handleBarClick = (bar: { data: ChartDataItem }) => {
    setEditingHour(bar.data.hourNum)
    setEditValue(bar.data.value.toFixed(2))
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

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3,
        staggerChildren: 0.02,
      },
    },
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      {/* Chart container */}
      <div className="relative bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-700/50 p-4">
        <div className="h-64">
          <ResponsiveBar
            data={chartData}
            keys={['value']}
            indexBy="hour"
            margin={{ top: 20, right: 20, bottom: 40, left: 50 }}
            padding={0.2}
            valueScale={{ type: 'linear', max: maxValue * 1.1 }}
            indexScale={{ type: 'band', round: true }}
            colors={(bar) => {
              const isDay = (bar.data as ChartDataItem).isDayTime === 1
              const isEditing = (bar.data as ChartDataItem).hourNum === editingHour
              const isHovered = (bar.data as ChartDataItem).hourNum === hoveredHour

              if (isEditing) return '#F59E0B'
              if (isHovered) return isDay ? '#60A5FA' : '#3B82F6'
              return isDay ? '#3B82F6' : '#1E40AF'
            }}
            borderRadius={4}
            borderWidth={0}
            enableLabel={false}
            enableGridY={true}
            gridYValues={5}
            axisTop={null}
            axisRight={null}
            axisBottom={{
              tickSize: 0,
              tickPadding: 8,
              tickRotation: 0,
              legend: '',
              legendPosition: 'middle',
              legendOffset: 32,
              format: (v) => (parseInt(v) % 3 === 0 ? v : ''),
            }}
            axisLeft={{
              tickSize: 0,
              tickPadding: 8,
              tickRotation: 0,
              legend: 'kWh',
              legendPosition: 'middle',
              legendOffset: -40,
              format: (v) => (typeof v === 'number' ? v.toFixed(1) : v),
            }}
            theme={{
              axis: {
                ticks: {
                  text: {
                    fill: '#64748b',
                    fontSize: 11,
                  },
                },
                legend: {
                  text: {
                    fill: '#94a3b8',
                    fontSize: 11,
                  },
                },
              },
              grid: {
                line: {
                  stroke: '#e2e8f0',
                  strokeDasharray: '4 4',
                },
              },
            }}
            motionConfig="gentle"
            onClick={handleBarClick}
            onMouseEnter={(bar) => setHoveredHour((bar.data as ChartDataItem).hourNum)}
            onMouseLeave={() => setHoveredHour(null)}
            tooltip={({ data: d }) => {
              const item = d as ChartDataItem
              return (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md px-4 py-3 rounded-xl shadow-xl border border-slate-200/50 dark:border-slate-700/50"
                >
                  <p className="font-semibold text-slate-700 dark:text-slate-200">
                    {item.hour}:00
                  </p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    {item.value.toFixed(2)} kWh
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {item.isDayTime === 1 ? 'Dagtid (högre pris)' : 'Nattetid (lägre pris)'}
                  </p>
                  <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                    Klicka för att redigera
                  </p>
                </motion.div>
              )
            }}
          />
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded" />
            <span className="text-xs text-slate-600 dark:text-slate-400">
              Dagtid ({dayHourStart}:00-{dayHourEnd}:00)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-900 rounded" />
            <span className="text-xs text-slate-600 dark:text-slate-400">Nattetid</span>
          </div>
        </div>
      </div>

      {/* Inline edit modal */}
      <AnimatePresence>
        {editingHour !== null && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-3 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-700/50 rounded-xl shadow-lg"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {editingHour.toString().padStart(2, '0')}
                </span>
              </div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">:00</span>
            </div>
            <div className="flex-1 flex items-center gap-2">
              <input
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleEditSubmit()}
                className="w-24 px-3 py-2 text-sm font-medium border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                step="0.01"
                min="0"
                autoFocus
              />
              <span className="text-sm text-slate-500 dark:text-slate-400">kWh</span>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={handleEditSubmit}
                className="px-4 py-2 text-sm font-medium bg-amber-500 hover:bg-amber-600 text-white rounded-lg shadow-md transition-colors"
              >
                Spara
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => setEditingHour(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Avbryt
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual input grid */}
      <details className="group cursor-pointer">
        <summary className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors">
          <svg
            className="w-4 h-4 transition-transform group-open:rotate-90"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          Visa alla timvärden
        </summary>
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/50 dark:border-slate-700/50"
        >
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {data.map((value, hour) => (
              <motion.div
                key={hour}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: hour * 0.02 }}
                className="flex flex-col"
              >
                <span className="text-xs text-slate-500 dark:text-slate-400 mb-1 text-center">
                  {hour.toString().padStart(2, '0')}:00
                </span>
                <input
                  type="number"
                  value={(value || 0).toFixed(2)}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value)
                    if (!isNaN(v) && v >= 0) onUpdate(hour, v)
                  }}
                  className={`
                    w-full px-2 py-1.5 text-xs text-center border rounded-lg transition-colors
                    ${hour >= dayHourStart && hour < dayHourEnd
                      ? 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                    }
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  `}
                  step="0.01"
                  min="0"
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </details>
    </motion.div>
  )
}
