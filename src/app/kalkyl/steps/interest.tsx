'use client'

import { motion } from 'framer-motion'
import { SunIcon, BoltIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { useLeadWizardStore, type InterestType } from '@/stores/lead-wizard-store'

const interestTypes: Array<{
  value: InterestType
  label: string
  description: string
  icon: typeof SunIcon
}> = [
  {
    value: 'SOLAR',
    label: 'Solceller',
    description: 'Producera din egen el',
    icon: SunIcon,
  },
  {
    value: 'BATTERY',
    label: 'Batterilager',
    description: 'Lagra el och optimera kostnader',
    icon: BoltIcon,
  },
  {
    value: 'BOTH',
    label: 'Solceller + Batteri',
    description: 'Komplett lösning för maximal besparing',
    icon: SparklesIcon,
  },
]

export function InterestStep() {
  const { data, updateData, nextStep } = useLeadWizardStore()

  const handleSelect = (type: InterestType) => {
    updateData({ interestType: type })
    nextStep()
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Vad är du intresserad av?
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Välj det som passar dina behov bäst
        </p>
      </div>

      <div className="space-y-4">
        {interestTypes.map((type, index) => (
          <motion.button
            key={type.value}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => handleSelect(type.value)}
            className={`w-full p-6 rounded-2xl border-2 text-left transition-all hover:border-blue-500 hover:shadow-lg flex items-center gap-4 ${
              data.interestType === type.value
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800'
            }`}
          >
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
              type.value === 'SOLAR'
                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                : type.value === 'BATTERY'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
            }`}>
              <type.icon className="h-7 w-7" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {type.label}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {type.description}
              </p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
