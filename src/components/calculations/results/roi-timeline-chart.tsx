'use client'

import { motion } from 'framer-motion'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
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
  const maxSavings = Math.max(...data.map(d => d.savings))
  const minNet = Math.min(...data.map(d => d.net))

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1] as const,
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }
    },
  }

  const legendItemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3 }
    },
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="relative overflow-hidden bg-gradient-to-br from-white via-slate-50/50 to-blue-50/30 dark:from-slate-800 dark:via-slate-800/80 dark:to-blue-900/20 border border-slate-200/60 dark:border-slate-700/50 rounded-2xl shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50"
    >
      {/* Decorative gradient orbs */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-gradient-to-br from-emerald-400/10 to-teal-400/10 rounded-full blur-2xl" />

      <div className="relative p-6">
        <motion.div variants={itemVariants} className="mb-6">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            ROI-utveckling över 15 år
          </h3>
          {batteryName && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{batteryName}</p>
          )}
        </motion.div>

        {/* Key metrics cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white/70 dark:bg-slate-700/50 backdrop-blur-sm rounded-xl p-3 border border-slate-200/50 dark:border-slate-600/50">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Break-even</p>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {breakEvenYear} år
            </p>
          </div>
          <div className="bg-white/70 dark:bg-slate-700/50 backdrop-blur-sm rounded-xl p-3 border border-slate-200/50 dark:border-slate-600/50">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Besparing 15 år</p>
            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
              {formatSek(maxSavings)}
            </p>
          </div>
          <div className="bg-white/70 dark:bg-slate-700/50 backdrop-blur-sm rounded-xl p-3 border border-slate-200/50 dark:border-slate-600/50">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Netto år 15</p>
            <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
              {formatSek(data[15]?.net || 0)}
            </p>
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
              <defs>
                <linearGradient id="netGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e2e8f0"
                className="dark:opacity-20"
              />

              <XAxis
                dataKey="year"
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                label={{
                  value: 'År',
                  position: 'bottom',
                  offset: 5,
                  style: { fontSize: 11, fill: '#94a3b8' }
                }}
              />

              <YAxis
                tickFormatter={formatSek}
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
                axisLine={false}
                width={70}
              />

              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md p-4 rounded-xl shadow-xl border border-slate-200/50 dark:border-slate-700/50"
                      >
                        <p className="font-semibold text-slate-700 dark:text-slate-200 mb-2">
                          År {label}
                        </p>
                        {payload.map((entry, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm py-1">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-slate-600 dark:text-slate-300">
                              {entry.name === 'savings' ? 'Besparing' :
                               entry.name === 'net' ? 'Netto' : 'Kostnad'}:
                            </span>
                            <span className="font-medium text-slate-800 dark:text-slate-100">
                              {formatSek(Number(entry.value))}
                            </span>
                          </div>
                        ))}
                      </motion.div>
                    )
                  }
                  return null
                }}
              />

              <ReferenceLine
                y={0}
                stroke="#94a3b8"
                strokeDasharray="4 4"
                strokeOpacity={0.5}
              />

              {/* Area fill for positive net */}
              <Area
                type="monotone"
                dataKey="net"
                fill="url(#netGradient)"
                stroke="none"
              />

              {/* Cost line (flat) */}
              <Line
                type="monotone"
                dataKey="cost"
                stroke="#EF4444"
                strokeWidth={2}
                strokeDasharray="8 4"
                dot={false}
                name="cost"
                animationDuration={1500}
                animationEasing="ease-out"
              />

              {/* Cumulative savings */}
              <Line
                type="monotone"
                dataKey="savings"
                stroke="#10B981"
                strokeWidth={2.5}
                dot={false}
                name="savings"
                animationDuration={1500}
                animationEasing="ease-out"
              />

              {/* Net position */}
              <Line
                type="monotone"
                dataKey="net"
                stroke="#3B82F6"
                strokeWidth={3}
                dot={(props) => {
                  const { cx, cy, index, payload } = props
                  if (index === breakEvenYear) {
                    return (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={6}
                        fill="#22C55E"
                        stroke="#fff"
                        strokeWidth={2}
                        className="drop-shadow-lg"
                      />
                    )
                  }
                  return null
                }}
                activeDot={{
                  r: 6,
                  fill: '#3B82F6',
                  stroke: '#fff',
                  strokeWidth: 2,
                  className: 'drop-shadow-md'
                }}
                name="net"
                animationDuration={1500}
                animationEasing="ease-out"
              />

              {/* Break-even marker */}
              <ReferenceLine
                x={breakEvenYear}
                stroke="#22C55E"
                strokeWidth={2}
                strokeDasharray="4 4"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Legend */}
        <motion.div
          variants={itemVariants}
          className="flex flex-wrap justify-center gap-4 md:gap-6 mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-700/50"
        >
          <motion.div variants={legendItemVariants} className="flex items-center gap-2">
            <div className="w-5 h-0.5 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full" />
            <span className="text-xs text-slate-600 dark:text-slate-400">Kumulativ besparing</span>
          </motion.div>
          <motion.div variants={legendItemVariants} className="flex items-center gap-2">
            <div className="w-5 h-0.5 bg-red-500 rounded-full" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #EF4444 0, #EF4444 3px, transparent 3px, transparent 6px)' }} />
            <span className="text-xs text-slate-600 dark:text-slate-400">Investeringskostnad</span>
          </motion.div>
          <motion.div variants={legendItemVariants} className="flex items-center gap-2">
            <div className="w-5 h-1 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full" />
            <span className="text-xs text-slate-600 dark:text-slate-400">Nettoresultat</span>
          </motion.div>
          <motion.div variants={legendItemVariants} className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-800 shadow-md" />
            <span className="text-xs text-slate-600 dark:text-slate-400">Break-even (år {breakEvenYear})</span>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  )
}
