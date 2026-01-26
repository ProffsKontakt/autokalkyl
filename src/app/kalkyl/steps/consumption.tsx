'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { BoltIcon, InformationCircleIcon } from '@heroicons/react/24/outline'
import { useLeadWizardStore } from '@/stores/lead-wizard-store'

const presets = [
  { value: 5000, label: '5 000 kWh', description: 'Liten lägenhet' },
  { value: 10000, label: '10 000 kWh', description: 'Lägenhet / litet hus' },
  { value: 15000, label: '15 000 kWh', description: 'Villa' },
  { value: 20000, label: '20 000 kWh', description: 'Större villa' },
  { value: 25000, label: '25 000 kWh', description: 'Stor villa / elbil' },
  { value: 30000, label: '30 000+', description: 'Mycket stor förbrukning' },
]

export function ConsumptionStep() {
  const { data, updateData, nextStep, isStepValid } = useLeadWizardStore()
  const [customValue, setCustomValue] = useState(
    presets.some((p) => p.value === data.annualKwh) ? '' : String(data.annualKwh)
  )

  const handlePresetSelect = (value: number) => {
    updateData({ annualKwh: value })
    setCustomValue('')
  }

  const handleCustomChange = (value: string) => {
    const num = parseInt(value.replace(/\D/g, ''), 10)
    setCustomValue(value)
    if (!isNaN(num) && num > 0) {
      updateData({ annualKwh: num })
    }
  }

  const handleContinue = () => {
    if (isStepValid(4)) {
      nextStep()
    }
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Hur mycket el använder du?
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Ange din årliga elförbrukning i kWh
        </p>
      </div>

      {/* Help text */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200">
        <InformationCircleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
        <p className="text-sm">
          Du hittar din årsförbrukning på elräkningen eller genom att logga in hos din elleverantör.
        </p>
      </div>

      {/* Presets */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {presets.map((preset, index) => (
          <motion.button
            key={preset.value}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => handlePresetSelect(preset.value)}
            className={`p-4 rounded-xl border-2 text-left transition-all hover:border-blue-500 ${
              data.annualKwh === preset.value && !customValue
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800'
            }`}
          >
            <div className="font-semibold text-gray-900 dark:text-white">
              {preset.label}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {preset.description}
            </div>
          </motion.button>
        ))}
      </div>

      {/* Custom input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Eller ange exakt förbrukning
        </label>
        <div className="relative">
          <BoltIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={customValue}
            onChange={(e) => handleCustomChange(e.target.value)}
            placeholder="T.ex. 12500"
            className="w-full pl-12 pr-16 py-4 rounded-xl border-2 border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-lg focus:border-blue-500 focus:ring-0 transition-colors"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
            kWh/år
          </span>
        </div>
      </div>

      {/* Display selected value */}
      {data.annualKwh > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-4"
        >
          <p className="text-gray-600 dark:text-gray-400">Din årsförbrukning:</p>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {data.annualKwh.toLocaleString('sv-SE')} kWh
          </p>
        </motion.div>
      )}

      {/* Continue button */}
      <button
        onClick={handleContinue}
        disabled={!isStepValid(4)}
        className="w-full py-4 px-6 text-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-xl transition-colors"
      >
        Fortsätt
      </button>
    </div>
  )
}
