'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  CheckCircleIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ChartBarIcon,
  BoltIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
import { useLeadWizardStore } from '@/stores/lead-wizard-store'
import confetti from 'canvas-confetti'

export function ResultsStep() {
  const { data, reset } = useLeadWizardStore()
  const results = data.calculationResults

  // Trigger confetti on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3B82F6', '#10B981', '#F59E0B'],
      })
    }
  }, [])

  if (!results) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Laddar resultat...</p>
      </div>
    )
  }

  const interestLabel =
    data.interestType === 'BATTERY'
      ? 'Batterilager'
      : data.interestType === 'SOLAR'
        ? 'Solceller'
        : 'Solceller + Batteri'

  return (
    <div className="space-y-8">
      {/* Success message */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
          <CheckCircleIcon className="h-10 w-10 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Din kalkyl är klar!
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Baserat på {data.annualKwh.toLocaleString('sv-SE')} kWh/år
        </p>
      </motion.div>

      {/* Results cards */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
        >
          <CurrencyDollarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 mb-2" />
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            {results.estimatedSavingsPerYear.toLocaleString('sv-SE')} kr
          </p>
          <p className="text-sm text-blue-700 dark:text-blue-300">Besparing per år</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800"
        >
          <ClockIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400 mb-2" />
          <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
            ~{results.paybackYears} år
          </p>
          <p className="text-sm text-emerald-700 dark:text-emerald-300">Återbetalningstid</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800"
        >
          <ChartBarIcon className="h-6 w-6 text-purple-600 dark:text-purple-400 mb-2" />
          <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
            {results.roi10Year}%
          </p>
          <p className="text-sm text-purple-700 dark:text-purple-300">ROI på 10 år</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
        >
          <BoltIcon className="h-6 w-6 text-amber-600 dark:text-amber-400 mb-2" />
          <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">
            {results.recommendedCapacityKwh} {data.interestType === 'SOLAR' ? 'kWp' : 'kWh'}
          </p>
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Rekommenderad {data.interestType === 'SOLAR' ? 'effekt' : 'kapacitet'}
          </p>
        </motion.div>
      </div>

      {/* Cost breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="p-6 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700"
      >
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
          Uppskattad kostnad för {interestLabel}
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Pris före avdrag</span>
            <span className="text-gray-400 dark:text-gray-500 line-through">
              {results.estimatedCostBeforeDeduction.toLocaleString('sv-SE')} kr
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Grön teknik-avdrag (50%)</span>
            <span className="text-green-600 dark:text-green-400">
              -{((results.estimatedCostBeforeDeduction - results.estimatedCostAfterDeduction)).toLocaleString('sv-SE')} kr
            </span>
          </div>
          <div className="pt-3 border-t border-gray-200 dark:border-slate-600 flex justify-between">
            <span className="font-semibold text-gray-900 dark:text-white">Din kostnad</span>
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {results.estimatedCostAfterDeduction.toLocaleString('sv-SE')} kr
            </span>
          </div>
        </div>
      </motion.div>

      {/* Next steps */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="p-6 rounded-xl bg-blue-600 text-white"
      >
        <h3 className="font-semibold mb-2">Vad händer nu?</h3>
        <p className="text-blue-100 mb-4">
          Vi har skickat din förfrågan till upp till 6 kvalitetsgranskade företag i ditt område.
          De kontaktar dig inom kort med personliga offerter.
        </p>
        <div className="flex items-center gap-2 text-blue-200 text-sm">
          <CheckCircleIcon className="h-5 w-5" />
          <span>Bekräftelse skickad till {data.email}</span>
        </div>
      </motion.div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href="/"
          className="flex-1 py-4 px-6 text-center font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
        >
          Tillbaka till startsidan
        </Link>
        <button
          onClick={reset}
          className="flex-1 py-4 px-6 font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors flex items-center justify-center gap-2"
        >
          <ArrowPathIcon className="h-5 w-5" />
          Gör en ny kalkyl
        </button>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
        * Uppskattade värden baserade på genomsnittliga elpriser och förutsättningar.
        Faktisk besparing kan variera beroende på dina specifika förhållanden.
      </p>
    </div>
  )
}
