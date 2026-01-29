'use client'

import { motion } from 'framer-motion'
import { ResponsivePie } from '@nivo/pie'
import type { CalculationResults } from '@/lib/calculations/types'
import { useState } from 'react'

interface SavingsBreakdownProps {
  results: CalculationResults
}

const COLORS = {
  spotpris: { main: '#3B82F6', gradient: ['#60A5FA', '#2563EB'] },
  effekttariff: { main: '#10B981', gradient: ['#34D399', '#059669'] },
  stodtjanster: { main: '#8B5CF6', gradient: ['#A78BFA', '#7C3AED'] },
}

export function SavingsBreakdown({ results }: SavingsBreakdownProps) {
  const [activeId, setActiveId] = useState<string | null>(null)

  const rawData = [
    {
      id: 'spotpris',
      label: 'Spotprisoptimering',
      value: results.spotprisSavingsSek,
      description: 'Ladda billigt på natten, använd dagtid',
      color: COLORS.spotpris.main,
      icon: '⚡',
    },
    {
      id: 'effekttariff',
      label: 'Effekttariffbesparing',
      value: results.effectTariffSavingsSek,
      description: 'Minska toppeffekt, lägre nätavgift',
      color: COLORS.effekttariff.main,
      icon: '📊',
    },
    {
      id: 'stodtjanster',
      label: 'Stödtjänster',
      value: results.gridServicesIncomeSek,
      description: 'Intäkt från frekvensreglering m.m.',
      color: COLORS.stodtjanster.main,
      icon: '🔌',
    },
  ].filter(d => d.value > 0)

  const total = rawData.reduce((sum, d) => sum + d.value, 0)

  const formatSek = (n: number) =>
    Math.round(n).toLocaleString('sv-SE') + ' kr'

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
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }
    },
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="relative overflow-hidden bg-gradient-to-br from-white via-slate-50/50 to-indigo-50/30 dark:from-slate-800 dark:via-slate-800/80 dark:to-indigo-900/20 border border-slate-200/60 dark:border-slate-700/50 rounded-2xl shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50"
    >
      {/* Decorative gradient orbs */}
      <div className="absolute -top-16 -left-16 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-violet-400/10 rounded-full blur-2xl" />
      <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-gradient-to-br from-emerald-400/10 to-teal-400/10 rounded-full blur-xl" />

      <div className="relative p-6">
        <motion.div variants={itemVariants} className="mb-4">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            Besparingsfördelning
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Hur batteriet genererar värde
          </p>
        </motion.div>

        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Pie chart */}
          <motion.div
            variants={itemVariants}
            className="relative w-52 h-52"
          >
            <ResponsivePie
              data={rawData}
              margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
              innerRadius={0.6}
              padAngle={2}
              cornerRadius={4}
              activeOuterRadiusOffset={8}
              colors={{ datum: 'data.color' }}
              borderWidth={0}
              enableArcLinkLabels={false}
              enableArcLabels={false}
              onMouseEnter={(node) => setActiveId(node.id as string)}
              onMouseLeave={() => setActiveId(null)}
              motionConfig="wobbly"
              transitionMode="startAngle"
              tooltip={({ datum }) => (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md px-4 py-3 rounded-xl shadow-xl border border-slate-200/50 dark:border-slate-700/50"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: datum.color }}
                    />
                    <span className="font-medium text-slate-800 dark:text-slate-100">
                      {datum.label}
                    </span>
                  </div>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    {formatSek(datum.value)}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {((datum.value / total) * 100).toFixed(1)}% av total
                  </p>
                </motion.div>
              )}
            />
            {/* Center text */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <motion.p
                  key={activeId || 'total'}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-2xl font-bold text-slate-800 dark:text-slate-100"
                >
                  {formatSek(activeId
                    ? rawData.find(d => d.id === activeId)?.value || 0
                    : total
                  )}
                </motion.p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {activeId
                    ? rawData.find(d => d.id === activeId)?.label
                    : 'per år'
                  }
                </p>
              </div>
            </div>
          </motion.div>

          {/* Legend/breakdown */}
          <div className="flex-1 space-y-3 w-full">
            {rawData.map((item, index) => (
              <motion.div
                key={item.id}
                variants={itemVariants}
                onMouseEnter={() => setActiveId(item.id)}
                onMouseLeave={() => setActiveId(null)}
                className={`
                  relative p-4 rounded-xl border transition-all duration-300 cursor-pointer
                  ${activeId === item.id
                    ? 'bg-white dark:bg-slate-700/70 border-slate-300 dark:border-slate-600 shadow-md scale-[1.02]'
                    : 'bg-white/50 dark:bg-slate-700/30 border-slate-200/50 dark:border-slate-600/30 hover:bg-white dark:hover:bg-slate-700/50'
                  }
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className="mt-0.5 w-4 h-4 rounded-lg flex items-center justify-center text-[10px]"
                      style={{ backgroundColor: `${item.color}20` }}
                    >
                      <div
                        className="w-2.5 h-2.5 rounded"
                        style={{ backgroundColor: item.color }}
                      />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                        {item.label}
                      </span>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {formatSek(item.value)}
                    </span>
                    <div className="flex items-center justify-end gap-1 mt-0.5">
                      <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: item.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${(item.value / total) * 100}%` }}
                          transition={{ duration: 0.8, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] as const }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 w-8 text-right">
                        {((item.value / total) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Total */}
            <motion.div
              variants={itemVariants}
              className="pt-3 border-t border-slate-200/50 dark:border-slate-700/50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    Total årlig besparing
                  </span>
                </div>
                <motion.span
                  className="text-xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                >
                  {formatSek(total)}/år
                </motion.span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
