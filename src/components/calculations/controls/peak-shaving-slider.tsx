'use client'

import { useCalculationWizardStore } from '@/stores/calculation-wizard-store'
import { calculateActualPeakShaving } from '@/lib/calculations/constraints'
import { motion } from 'framer-motion'

interface PeakShavingSliderProps {
  currentPeakKw: number
  batteryMaxDischargeKw: number
}

export function PeakShavingSlider({
  currentPeakKw,
  batteryMaxDischargeKw,
}: PeakShavingSliderProps) {
  const peakShavingPercent = useCalculationWizardStore((state) => state.peakShavingPercent)
  const updatePeakShavingPercent = useCalculationWizardStore((state) => state.updatePeakShavingPercent)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10)
    updatePeakShavingPercent(value) // Immediate, no debounce
  }

  // PEAK-02: Apply capacity constraint
  const { targetKw, actualKw, newPeakKw, isConstrained, constraintMessage } = calculateActualPeakShaving(
    currentPeakKw,
    peakShavingPercent,
    batteryMaxDischargeKw
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Effektavgift reduktion
        </label>
        <motion.span
          key={peakShavingPercent}
          initial={{ scale: 1.3, color: '#10B981' }}
          animate={{ scale: 1, color: '#1F2937' }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="text-lg font-bold tabular-nums dark:text-gray-100"
        >
          {peakShavingPercent}%
        </motion.span>
      </div>

      <input
        type="range"
        min={0}
        max={100}
        step={10}
        value={peakShavingPercent}
        onChange={handleChange}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-green-600"
        aria-label="Procentuell reduktion av toppeffekt"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={peakShavingPercent}
        aria-valuetext={`${peakShavingPercent} procent reduktion`}
      />

      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>0%</span>
        <span>50%</span>
        <span>100%</span>
      </div>

      <div className="space-y-1 text-sm bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <span className="text-gray-600 dark:text-gray-400">Nuvarande topp:</span>
          <span className="font-medium">{currentPeakKw.toFixed(1)} kW</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600 dark:text-gray-400">Målreduktion:</span>
          <span className="font-medium">{targetKw.toFixed(1)} kW</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600 dark:text-gray-400">Faktisk reduktion:</span>
          <span className={`font-semibold ${isConstrained ? 'text-amber-600' : 'text-green-600'}`}>
            {actualKw.toFixed(1)} kW
          </span>
        </div>
        <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-1 mt-1">
          <span className="text-gray-600 dark:text-gray-400">Ny toppeffekt:</span>
          <span className="font-bold text-green-600">{newPeakKw.toFixed(1)} kW</span>
        </div>
      </div>

      {isConstrained && constraintMessage && (
        <div className="p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded text-xs text-amber-700 dark:text-amber-400">
          ℹ️ {constraintMessage}
        </div>
      )}
    </div>
  )
}
