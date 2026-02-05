'use client'

import { useEffect, useState, useMemo } from 'react'
import { useCalculationWizardStore } from '@/stores/calculation-wizard-store'
import { estimatePeakFromAnnualConsumption } from '@/lib/calculations/peak-billing/estimation'
import { HEATING_TYPE_PROFILES } from '@/lib/calculations/consumption-profiles'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  CalculatorIcon,
  PencilIcon,
  ArrowPathIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'

interface PeakTargetInputProps {
  className?: string
}

/**
 * Peak target input component for the calculation wizard.
 *
 * Enables PEAK-05 (target average peak) and PEAK-06 (monthly ceiling) inputs.
 * Auto-estimates from consumption profile and heating type, with manual override.
 *
 * @see 11-02-PLAN.md for specifications
 */
export function PeakTargetInput({ className }: PeakTargetInputProps) {
  const annualConsumptionKwh = useCalculationWizardStore(
    (state) => state.annualConsumptionKwh
  )
  const heatingType = useCalculationWizardStore((state) => state.heatingType)
  const targetAveragePeakKw = useCalculationWizardStore(
    (state) => state.targetAveragePeakKw
  )
  const targetMonthlyCeilingKw = useCalculationWizardStore(
    (state) => state.targetMonthlyCeilingKw
  )
  const peakEstimateSource = useCalculationWizardStore(
    (state) => state.peakEstimateSource
  )
  const updateTargetAveragePeakKw = useCalculationWizardStore(
    (state) => state.updateTargetAveragePeakKw
  )
  const updateTargetMonthlyCeilingKw = useCalculationWizardStore(
    (state) => state.updateTargetMonthlyCeilingKw
  )
  const setPeakEstimateSource = useCalculationWizardStore(
    (state) => state.setPeakEstimateSource
  )

  // Local state for input values (allows editing without immediate store update)
  const [localAverage, setLocalAverage] = useState<string>('')
  const [localCeiling, setLocalCeiling] = useState<string>('')

  // Calculate auto-estimated peak from consumption and heating type
  const autoEstimate = useMemo(() => {
    if (!heatingType) return null
    const estimated = estimatePeakFromAnnualConsumption(
      annualConsumptionKwh,
      heatingType
    )
    return {
      averagePeakKw: Math.round(estimated * 10) / 10, // Round to 1 decimal
      ceilingKw: Math.round(estimated * 1.2 * 10) / 10, // 20% buffer for ceiling
    }
  }, [annualConsumptionKwh, heatingType])

  // Apply auto-estimate when in auto mode and heating type changes
  useEffect(() => {
    if (peakEstimateSource === 'auto' && autoEstimate) {
      updateTargetAveragePeakKw(autoEstimate.averagePeakKw)
      updateTargetMonthlyCeilingKw(autoEstimate.ceilingKw)
      setLocalAverage(autoEstimate.averagePeakKw.toString())
      setLocalCeiling(autoEstimate.ceilingKw.toString())
    }
  }, [
    autoEstimate,
    peakEstimateSource,
    updateTargetAveragePeakKw,
    updateTargetMonthlyCeilingKw,
  ])

  // Sync local state with store on mount
  useEffect(() => {
    if (targetAveragePeakKw !== null) {
      setLocalAverage(targetAveragePeakKw.toString())
    }
    if (targetMonthlyCeilingKw !== null) {
      setLocalCeiling(targetMonthlyCeilingKw.toString())
    }
  }, [targetAveragePeakKw, targetMonthlyCeilingKw])

  const handleAverageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLocalAverage(value)
    const numValue = parseFloat(value)
    if (!isNaN(numValue) && numValue >= 0) {
      updateTargetAveragePeakKw(numValue)
      if (peakEstimateSource === 'auto') {
        setPeakEstimateSource('manual')
      }
    }
  }

  const handleCeilingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLocalCeiling(value)
    const numValue = parseFloat(value)
    if (!isNaN(numValue) && numValue >= 0) {
      updateTargetMonthlyCeilingKw(numValue)
      if (peakEstimateSource === 'auto') {
        setPeakEstimateSource('manual')
      }
    }
  }

  const handleReEstimate = () => {
    if (autoEstimate) {
      setPeakEstimateSource('auto')
      updateTargetAveragePeakKw(autoEstimate.averagePeakKw)
      updateTargetMonthlyCeilingKw(autoEstimate.ceilingKw)
      setLocalAverage(autoEstimate.averagePeakKw.toString())
      setLocalCeiling(autoEstimate.ceilingKw.toString())
    }
  }

  const handleSwitchToManual = () => {
    setPeakEstimateSource('manual')
  }

  // If no heating type selected, show placeholder
  if (!heatingType) {
    return (
      <div className={cn('space-y-3', className)}>
        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Effekttoppar (kW)
        </Label>
        <div className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <InformationCircleIcon className="w-5 h-5" />
            <span className="text-sm">
              Valj uppvarmningstyp for att fa automatiskt uppskattat toppvarde
            </span>
          </div>
        </div>
      </div>
    )
  }

  const heatingTypeName = HEATING_TYPE_PROFILES[heatingType]?.name || heatingType

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header with source badge */}
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Effekttoppar (kW)
        </Label>
        <div className="flex items-center gap-2">
          {peakEstimateSource === 'auto' ? (
            <>
              <Badge variant="info" className="flex items-center gap-1">
                <CalculatorIcon className="w-3 h-3" />
                Uppskattat
              </Badge>
              <button
                type="button"
                onClick={handleSwitchToManual}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                title="Redigera manuellt"
                aria-label="Byt till manuell inmatning"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <Badge variant="warning" className="flex items-center gap-1">
                <PencilIcon className="w-3 h-3" />
                Manuellt
              </Badge>
              <button
                type="button"
                onClick={handleReEstimate}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                title="Ateruppsatta automatiskt"
                aria-label="Aterga till automatisk uppskattning"
              >
                <ArrowPathIcon className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Input fields grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* PEAK-05: Target average peak */}
        <div className="space-y-2">
          <Label
            htmlFor="targetAveragePeak"
            className="text-xs text-gray-500 dark:text-gray-400"
          >
            Mal genomsnittlig effekttopp
          </Label>
          <div className="relative">
            <Input
              id="targetAveragePeak"
              type="number"
              value={localAverage}
              onChange={handleAverageChange}
              placeholder="0.0"
              min="0"
              step="0.1"
              className="pr-10"
              aria-describedby="targetAveragePeakHelp"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
              kW
            </span>
          </div>
        </div>

        {/* PEAK-06: Monthly ceiling */}
        <div className="space-y-2">
          <Label
            htmlFor="targetMonthlyCeiling"
            className="text-xs text-gray-500 dark:text-gray-400"
          >
            Maximal manadstopp
          </Label>
          <div className="relative">
            <Input
              id="targetMonthlyCeiling"
              type="number"
              value={localCeiling}
              onChange={handleCeilingChange}
              placeholder="0.0"
              min="0"
              step="0.1"
              className="pr-10"
              aria-describedby="targetMonthlyCeilingHelp"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
              kW
            </span>
          </div>
        </div>
      </div>

      {/* Help text */}
      <p
        id="targetAveragePeakHelp"
        className="text-xs text-gray-500 dark:text-gray-400"
      >
        Dessa varden anvands for att berakna din effektavgiftsbesparing baserat
        pa din natagares effekttariff.
      </p>

      {/* Estimation source info */}
      {peakEstimateSource === 'auto' && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start gap-2">
            <InformationCircleIcon className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-700 dark:text-blue-300">
              <span className="font-medium">Uppskattat fran:</span>{' '}
              {annualConsumptionKwh.toLocaleString('sv-SE')} kWh/ar med{' '}
              {heatingTypeName.toLowerCase()}. Vardet ar baserat pa typiska
              svenska hushall med liknande forbrukningsprofil.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
