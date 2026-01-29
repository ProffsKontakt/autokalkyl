'use client'

import { useCalculationWizardStore } from '@/stores/calculation-wizard-store'
import { motion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { HIGH_CYCLES_WARNING_THRESHOLD } from '@/lib/calculations/constants'

interface CyclesSliderProps {
  min?: number
  max?: number
  step?: number
}

export function CyclesSlider({
  min = 0.5,
  max = 3,
  step = 0.5,
}: CyclesSliderProps) {
  const cyclesPerDay = useCalculationWizardStore((state) => state.cyclesPerDay)
  const updateCyclesPerDay = useCalculationWizardStore((state) => state.updateCyclesPerDay)
  const hasShownWarning = useRef(false)

  // SPOT-03: Show warning toast when cycles exceed threshold
  useEffect(() => {
    if (cyclesPerDay > HIGH_CYCLES_WARNING_THRESHOLD && !hasShownWarning.current) {
      toast.warning('Höga cykler påverkar garantin', {
        description: 'Fler än 2 cykler per dag kan förkorta batteriets garantitid. Optimal livslängd uppnås vid 1-2 cykler/dag.',
        duration: 3000,
      })
      hasShownWarning.current = true
    } else if (cyclesPerDay <= HIGH_CYCLES_WARNING_THRESHOLD) {
      hasShownWarning.current = false
    }
  }, [cyclesPerDay])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    updateCyclesPerDay(value) // Immediate, no debounce per requirements
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Laddningscykler per dag
        </label>
        <motion.span
          key={cyclesPerDay}
          initial={{ scale: 1.3, color: '#3B82F6' }}
          animate={{ scale: 1, color: '#1F2937' }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="text-lg font-bold tabular-nums dark:text-gray-100"
        >
          {cyclesPerDay.toFixed(1)}
        </motion.span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={cyclesPerDay}
        onChange={handleChange}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-blue-600"
        aria-label="Antal laddningscykler per dag"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={cyclesPerDay}
        aria-valuetext={`${cyclesPerDay} cykler per dag`}
      />

      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>0.5</span>
        <span>1.5 (typisk)</span>
        <span>3.0</span>
      </div>

      {cyclesPerDay > HIGH_CYCLES_WARNING_THRESHOLD && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-700 dark:text-amber-400"
        >
          <div className="flex items-start gap-2">
            <span className="text-base">⚠️</span>
            <div>
              <strong>Påverkar garantitid:</strong> Höga cykler ger högre besparing men kan förkorta batteriets livslängd.
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
