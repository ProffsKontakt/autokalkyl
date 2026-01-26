'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MapPinIcon, CheckCircleIcon, SunIcon } from '@heroicons/react/24/outline'
import { useLeadWizardStore, type Elomrade } from '@/stores/lead-wizard-store'
import { lookupElomrade } from '@/lib/calculations/elomrade-lookup'

const elomradeInfo: Record<Elomrade, { name: string; region: string }> = {
  SE1: { name: 'SE1', region: 'Norra Sverige (Luleå)' },
  SE2: { name: 'SE2', region: 'Mellersta norra Sverige (Sundsvall)' },
  SE3: { name: 'SE3', region: 'Mellersta södra Sverige (Stockholm)' },
  SE4: { name: 'SE4', region: 'Södra Sverige (Malmö)' },
}

export function LocationStep() {
  const { data, updateData, nextStep, isStepValid } = useLeadWizardStore()
  const [postalCodeInput, setPostalCodeInput] = useState(data.postalCode)
  const [isLookingUp, setIsLookingUp] = useState(false)

  // Auto-detect elomrade when postal code changes
  useEffect(() => {
    if (postalCodeInput.length >= 5) {
      setIsLookingUp(true)
      const cleanedCode = postalCodeInput.replace(/\s/g, '').slice(0, 5)
      const elomrade = lookupElomrade(cleanedCode)
      updateData({
        postalCode: cleanedCode,
        elomrade: elomrade as Elomrade | null,
      })
      setIsLookingUp(false)
    }
  }, [postalCodeInput, updateData])

  const handleContinue = () => {
    if (isStepValid(3)) {
      nextStep()
    }
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Var bor du?
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Vi använder din plats för att beräkna elpriser och hitta lokala företag
        </p>
      </div>

      <div className="space-y-6">
        {/* Postal code input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Postnummer
          </label>
          <div className="relative">
            <MapPinIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={postalCodeInput}
              onChange={(e) => setPostalCodeInput(e.target.value.replace(/[^0-9\s]/g, ''))}
              placeholder="123 45"
              maxLength={6}
              className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-lg focus:border-blue-500 focus:ring-0 transition-colors"
            />
          </div>
        </div>

        {/* Elomrade display */}
        {data.elomrade && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
          >
            <div className="flex items-center gap-3">
              <CheckCircleIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  Elområde: {elomradeInfo[data.elomrade].name}
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {elomradeInfo[data.elomrade].region}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Existing solar question */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Har du solceller idag?
          </label>
          <div className="flex gap-4">
            <button
              onClick={() => updateData({ hasExistingSolar: false })}
              className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                !data.hasExistingSolar
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800'
              }`}
            >
              <span className="font-medium text-gray-900 dark:text-white">Nej</span>
            </button>
            <button
              onClick={() => updateData({ hasExistingSolar: true })}
              className={`flex-1 p-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${
                data.hasExistingSolar
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800'
              }`}
            >
              <SunIcon className="h-5 w-5 text-yellow-500" />
              <span className="font-medium text-gray-900 dark:text-white">Ja</span>
            </button>
          </div>
        </div>
      </div>

      {/* Continue button */}
      <button
        onClick={handleContinue}
        disabled={!isStepValid(3)}
        className="w-full py-4 px-6 text-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-xl transition-colors"
      >
        Fortsätt
      </button>
    </div>
  )
}
