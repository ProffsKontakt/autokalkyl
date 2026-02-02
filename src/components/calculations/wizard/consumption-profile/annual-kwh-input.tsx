'use client'

/**
 * Annual kWh consumption input with slider and text synchronization.
 *
 * Features:
 * - Slider range: 5000-75000 kWh with 500 step
 * - Text input synced bidirectionally with slider
 * - Input clamped to valid range on blur
 * - Animated value display (framer-motion)
 */

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

interface AnnualKwhInputProps {
  value: number
  onChange: (value: number) => void
}

const MIN_KWH = 5000
const MAX_KWH = 75000
const STEP = 500

export function AnnualKwhInput({ value, onChange }: AnnualKwhInputProps) {
  // Local state for text input to allow typing invalid intermediate values
  const [textValue, setTextValue] = useState(value.toString())

  // Sync text input when slider changes or external value changes
  useEffect(() => {
    setTextValue(value.toString())
  }, [value])

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10)
    onChange(newValue)
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTextValue(e.target.value)
    const parsed = parseInt(e.target.value, 10)
    if (!isNaN(parsed)) {
      // Update immediately but don't clamp until blur
      onChange(parsed)
    }
  }

  const handleTextBlur = () => {
    const parsed = parseInt(textValue, 10)
    if (isNaN(parsed)) {
      // Reset to current value if invalid
      setTextValue(value.toString())
    } else {
      // Clamp to valid range
      const clamped = Math.max(MIN_KWH, Math.min(MAX_KWH, parsed))
      // Round to nearest step
      const rounded = Math.round(clamped / STEP) * STEP
      onChange(rounded)
      setTextValue(rounded.toString())
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Arlig forbrukning *
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={textValue}
            onChange={handleTextChange}
            onBlur={handleTextBlur}
            min={MIN_KWH}
            max={MAX_KWH}
            step={STEP}
            className="w-24 px-2 py-1 text-right text-lg font-bold tabular-nums border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            aria-label="Arlig forbrukning i kWh"
          />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            kWh/ar
          </span>
        </div>
      </div>

      <input
        type="range"
        min={MIN_KWH}
        max={MAX_KWH}
        step={STEP}
        value={value}
        onChange={handleSliderChange}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-blue-600"
        aria-label="Justera arlig forbrukning"
        aria-valuemin={MIN_KWH}
        aria-valuemax={MAX_KWH}
        aria-valuenow={value}
        aria-valuetext={`${value.toLocaleString('sv-SE')} kWh per ar`}
      />

      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>{MIN_KWH.toLocaleString('sv-SE')}</span>
        <span>{((MIN_KWH + MAX_KWH) / 2).toLocaleString('sv-SE')} (typiskt hus)</span>
        <span>{MAX_KWH.toLocaleString('sv-SE')}</span>
      </div>

      {/* Animated value display */}
      <div className="text-center">
        <motion.span
          key={value}
          initial={{ scale: 1.3, color: '#3B82F6' }}
          animate={{ scale: 1, color: '#1F2937' }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="text-2xl font-bold tabular-nums dark:text-gray-100"
        >
          {value.toLocaleString('sv-SE')}
        </motion.span>
        <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">kWh/ar</span>
      </div>
    </div>
  )
}
