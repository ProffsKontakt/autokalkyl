'use client'

import { motion } from 'framer-motion'
import { HomeIcon, BuildingOfficeIcon, BuildingOffice2Icon } from '@heroicons/react/24/outline'
import { useLeadWizardStore, type PropertyType } from '@/stores/lead-wizard-store'

const propertyTypes: Array<{
  value: PropertyType
  label: string
  description: string
  icon: typeof HomeIcon
}> = [
  {
    value: 'VILLA',
    label: 'Villa',
    description: 'Fristående hus eller radhus',
    icon: HomeIcon,
  },
  {
    value: 'BOSTADSRATT',
    label: 'Bostadsrätt',
    description: 'Lägenhet i bostadsrättsförening',
    icon: BuildingOfficeIcon,
  },
  {
    value: 'LAGENHET',
    label: 'Hyresrätt',
    description: 'Hyreslägenhet',
    icon: BuildingOffice2Icon,
  },
  {
    value: 'FORETAG',
    label: 'Företag',
    description: 'Företagslokal eller fastighet',
    icon: BuildingOffice2Icon,
  },
]

export function PropertyTypeStep() {
  const { data, updateData, nextStep } = useLeadWizardStore()

  const handleSelect = (type: PropertyType) => {
    updateData({ propertyType: type })
    nextStep()
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Vad bor du i?
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Välj den bostadstyp som bäst beskriver din situation
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {propertyTypes.map((type, index) => (
          <motion.button
            key={type.value}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => handleSelect(type.value)}
            className={`p-6 rounded-2xl border-2 text-left transition-all hover:border-blue-500 hover:shadow-lg ${
              data.propertyType === type.value
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800'
            }`}
          >
            <type.icon className={`h-8 w-8 mb-4 ${
              data.propertyType === type.value
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-400 dark:text-gray-500'
            }`} />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {type.label}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {type.description}
            </p>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
