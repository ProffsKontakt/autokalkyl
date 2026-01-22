'use client'

/**
 * Main calculation wizard container component.
 *
 * Orchestrates the multi-step wizard flow:
 * 1. Customer Info - name, postal code, elomrade, natagare
 * 2. Consumption - 12x24 consumption profile editor
 * 3. Battery - select and configure batteries
 * 4. Results - calculated ROI and savings
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCalculationWizardStore } from '@/stores/calculation-wizard-store'
import { useAutoSave } from '@/hooks/use-auto-save'
import { WizardNavigation } from './wizard-navigation'
import { CustomerInfoStep } from './steps/customer-info-step'
import { ConsumptionStep } from './steps/consumption-step'
import { BatteryStep } from './steps/battery-step'
import { ResultsStep } from './steps/results-step'
import { finalizeCalculation } from '@/actions/calculations'
import type { Elomrade } from '@/lib/calculations/types'

interface NatagareInfo {
  id: string
  name: string
  dayRateSekKw: number
  nightRateSekKw: number
}

interface BatteryInfo {
  id: string
  name: string
  brandName: string
  capacityKwh: number
  maxDischargeKw: number
  maxChargeKw: number
  chargeEfficiency: number
  dischargeEfficiency: number
  costPrice: number
}

interface InitialData {
  calculationId: string
  customerName: string
  postalCode: string | null
  elomrade: Elomrade
  natagareId: string
  annualConsumptionKwh: number
  consumptionProfile: { data: number[][] }
  batteries: Array<{
    configId: string
    totalPriceExVat: number
    installationCost: number
  }>
}

interface CalculationWizardProps {
  natagareList: NatagareInfo[]
  batteryList: BatteryInfo[]
  quarterlyPrices: Record<string, { avgDayPriceOre: number; avgNightPriceOre: number }> | null
  orgSettings?: {
    isProffsKontaktAffiliated: boolean
    installerFixedCut: number | null
  }
  initialData?: InitialData
  /** Organization ID for Super Admin creating calculations for a specific org */
  orgId?: string
}

const TOTAL_STEPS = 4

export function CalculationWizard({
  natagareList,
  batteryList,
  quarterlyPrices,
  orgSettings,
  initialData,
  orgId,
}: CalculationWizardProps) {
  const router = useRouter()
  const [isHydrated, setIsHydrated] = useState(false)
  const [initialLoaded, setInitialLoaded] = useState(false)
  const store = useCalculationWizardStore()
  const { lastSavedAt, isSaving } = useAutoSave({ orgId })

  // Handle Zustand hydration
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Load initial data from server when editing existing calculation
  useEffect(() => {
    if (initialData && isHydrated && !initialLoaded) {
      // Only load if the store doesn't already have this calculation
      // or if it's a different calculation than currently in store
      if (store.calculationId !== initialData.calculationId) {
        store.loadFromServer(initialData)
      }
      setInitialLoaded(true)
    }
  }, [initialData, isHydrated, initialLoaded, store])

  const handleNext = () => {
    if (store.currentStep < TOTAL_STEPS - 1) {
      store.setStep(store.currentStep + 1)
    }
  }

  const handleBack = () => {
    if (store.currentStep > 0) {
      store.setStep(store.currentStep - 1)
    }
  }

  const handleFinalize = async () => {
    // TODO: Calculate final results and finalize
    if (store.calculationId) {
      const result = await finalizeCalculation(store.calculationId, {})
      if (result.success) {
        store.reset()
        router.push('/dashboard/calculations')
      }
    }
  }

  // Validation per step
  const canGoNext = (): boolean => {
    switch (store.currentStep) {
      case 0: // Customer Info
        return !!(
          store.customerName &&
          store.elomrade &&
          store.natagareId &&
          store.annualConsumptionKwh > 0
        )
      case 1: // Consumption
        // At least one non-zero value
        return store.consumptionProfile.data.some(month =>
          month.some(hour => hour > 0)
        )
      case 2: // Battery
        return store.batteries.length > 0
      case 3: // Results
        return true
      default:
        return false
    }
  }

  // Show loading state during hydration
  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Laddar...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Step content */}
      <div className="flex-1 overflow-auto p-6">
        {store.currentStep === 0 && (
          <CustomerInfoStep natagareList={natagareList} />
        )}
        {store.currentStep === 1 && (
          <ConsumptionStep />
        )}
        {store.currentStep === 2 && (
          <BatteryStep
            batteryList={batteryList}
            orgSettings={orgSettings}
          />
        )}
        {store.currentStep === 3 && (
          <ResultsStep
            quarterlyPrices={quarterlyPrices}
            orgSettings={orgSettings}
            batteryList={batteryList}
            natagareList={natagareList}
          />
        )}
      </div>

      {/* Navigation */}
      <WizardNavigation
        currentStep={store.currentStep}
        totalSteps={TOTAL_STEPS}
        onBack={handleBack}
        onNext={handleNext}
        onFinalize={handleFinalize}
        canGoNext={canGoNext()}
        isLastStep={store.currentStep === TOTAL_STEPS - 1}
        isSaving={isSaving}
        lastSavedAt={lastSavedAt}
      />
    </div>
  )
}
