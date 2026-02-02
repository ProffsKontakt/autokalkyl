'use client'

/**
 * Estimation helper component for calculating annual kWh.
 *
 * Inline expandable section that allows users to estimate consumption based on:
 * - House size in square meters
 * - Number of residents
 * - Heating type (passed from parent)
 *
 * Uses estimateAnnualConsumption formula from consumption-profiles.ts.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, Calculator } from 'lucide-react'
import type { HeatingType } from '@prisma/client'
import { estimateAnnualConsumption } from '@/lib/calculations/consumption-profiles'

interface EstimationHelperProps {
  heatingType: HeatingType | null
  onEstimate: (kWh: number) => void
}

export function EstimationHelper({ heatingType, onEstimate }: EstimationHelperProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [houseSizeM2, setHouseSizeM2] = useState<number>(140)
  const [residents, setResidents] = useState<number>(3)

  const handleCalculate = () => {
    if (!heatingType) return

    const estimated = estimateAnnualConsumption({
      houseSizeM2,
      residents,
      heatingType,
    })

    onEstimate(estimated)
  }

  const isDisabled = !heatingType

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        aria-expanded={isOpen}
        aria-controls="estimation-helper-content"
      >
        <span className="flex items-center gap-2">
          <Calculator className="w-4 h-4" />
          Berakna fran bostadsyta
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4" />
        </motion.span>
      </button>

      {/* Expandable content with smooth animation */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id="estimation-helper-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 pt-3">
                Uppskatta arlig elforbrukning baserat pa bostadens storlek och antal boende.
              </p>

              {/* House size input */}
              <div>
                <label
                  htmlFor="houseSizeM2"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Bostadsyta (m2)
                </label>
                <input
                  id="houseSizeM2"
                  type="number"
                  min={20}
                  max={500}
                  step={10}
                  value={houseSizeM2}
                  onChange={(e) => setHouseSizeM2(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-900 bg-white focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
              </div>

              {/* Residents input */}
              <div>
                <label
                  htmlFor="residents"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Antal boende
                </label>
                <input
                  id="residents"
                  type="number"
                  min={1}
                  max={10}
                  step={1}
                  value={residents}
                  onChange={(e) => setResidents(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-900 bg-white focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
              </div>

              {/* Calculate button */}
              <button
                type="button"
                onClick={handleCalculate}
                disabled={isDisabled}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isDisabled ? 'Valj uppvarmningstyp forst' : 'Berakna'}
              </button>

              {/* Warning if heating type not selected */}
              {isDisabled && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Valj uppvarmningstyp ovan for att kunna berakna forbrukningen.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
