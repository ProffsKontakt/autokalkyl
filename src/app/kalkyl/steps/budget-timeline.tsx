'use client'

import { motion } from 'framer-motion'
import { CurrencyDollarIcon, CalendarIcon } from '@heroicons/react/24/outline'
import { useLeadWizardStore, type BudgetRange, type Timeline } from '@/stores/lead-wizard-store'

const budgets: Array<{ value: BudgetRange; label: string; description: string }> = [
  { value: 'UNDER_100K', label: 'Under 100 000 kr', description: 'Enklare system' },
  { value: 'RANGE_100K_200K', label: '100 000 - 200 000 kr', description: 'Mellanklass' },
  { value: 'OVER_200K', label: 'Över 200 000 kr', description: 'Premium' },
  { value: 'UNKNOWN', label: 'Vet inte än', description: 'Behöver vägledning' },
]

const timelines: Array<{ value: Timeline; label: string }> = [
  { value: 'ASAP', label: 'Så snart som möjligt' },
  { value: 'WITHIN_3_MONTHS', label: 'Inom 3 månader' },
  { value: 'WITHIN_6_MONTHS', label: 'Inom 6 månader' },
  { value: 'JUST_RESEARCHING', label: 'Bara kollar runt' },
]

export function BudgetTimelineStep() {
  const { data, updateData, nextStep, isStepValid } = useLeadWizardStore()

  const handleContinue = () => {
    if (isStepValid(5)) {
      nextStep()
    }
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Budget och tidsplan
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Hjälper oss matcha dig med rätt företag
        </p>
      </div>

      {/* Budget */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <CurrencyDollarIcon className="h-5 w-5 text-gray-500" />
          <label className="font-medium text-gray-900 dark:text-white">
            Ungefärlig budget
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {budgets.map((budget, index) => (
            <motion.button
              key={budget.value}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => updateData({ budget: budget.value })}
              className={`p-4 rounded-xl border-2 text-left transition-all hover:border-blue-500 ${
                data.budget === budget.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800'
              }`}
            >
              <div className="font-medium text-gray-900 dark:text-white text-sm">
                {budget.label}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {budget.description}
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <CalendarIcon className="h-5 w-5 text-gray-500" />
          <label className="font-medium text-gray-900 dark:text-white">
            När vill du installera?
          </label>
        </div>
        <div className="space-y-3">
          {timelines.map((timeline, index) => (
            <motion.button
              key={timeline.value}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + index * 0.05 }}
              onClick={() => updateData({ timeline: timeline.value })}
              className={`w-full p-4 rounded-xl border-2 text-left transition-all hover:border-blue-500 ${
                data.timeline === timeline.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800'
              }`}
            >
              <span className="font-medium text-gray-900 dark:text-white">
                {timeline.label}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Continue button */}
      <button
        onClick={handleContinue}
        disabled={!isStepValid(5)}
        className="w-full py-4 px-6 text-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-xl transition-colors"
      >
        Fortsätt
      </button>
    </div>
  )
}
