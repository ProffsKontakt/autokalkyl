'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { useLeadWizardStore } from '@/stores/lead-wizard-store'
import { PropertyTypeStep } from './steps/property-type'
import { InterestStep } from './steps/interest'
import { LocationStep } from './steps/location'
import { ConsumptionStep } from './steps/consumption'
import { BudgetTimelineStep } from './steps/budget-timeline'
import { ContactStep } from './steps/contact'
import { ResultsStep } from './steps/results'

const TOTAL_STEPS = 7

function KalkylContent() {
  const searchParams = useSearchParams()
  const { currentStep, prevStep, updateData, reset } = useLeadWizardStore()

  // Handle URL params for pre-selecting interest type
  useEffect(() => {
    const type = searchParams.get('type')
    if (type === 'battery') {
      updateData({ interestType: 'BATTERY' })
    } else if (type === 'solar') {
      updateData({ interestType: 'SOLAR' })
    } else if (type === 'both') {
      updateData({ interestType: 'BOTH' })
    }
  }, [searchParams, updateData])

  // Reset wizard when leaving and coming back
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Don't reset if on results page
      if (currentStep < 7) {
        reset()
      }
    }

    return () => {
      // Cleanup
    }
  }, [currentStep, reset])

  const progress = (currentStep / TOTAL_STEPS) * 100

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            <span className="text-sm">Tillbaka</span>
          </Link>

          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Steg {currentStep} av {TOTAL_STEPS}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-100 dark:bg-slate-800">
          <motion.div
            className="h-full bg-blue-600"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-4 py-8">
        <div className="w-full max-w-xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {currentStep === 1 && <PropertyTypeStep />}
              {currentStep === 2 && <InterestStep />}
              {currentStep === 3 && <LocationStep />}
              {currentStep === 4 && <ConsumptionStep />}
              {currentStep === 5 && <BudgetTimelineStep />}
              {currentStep === 6 && <ContactStep />}
              {currentStep === 7 && <ResultsStep />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Back button for steps 2-6 */}
      {currentStep > 1 && currentStep < 7 && (
        <div className="fixed bottom-8 left-4 sm:left-8">
          <button
            onClick={prevStep}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Tillbaka
          </button>
        </div>
      )}
    </div>
  )
}

export default function KalkylPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    }>
      <KalkylContent />
    </Suspense>
  )
}
