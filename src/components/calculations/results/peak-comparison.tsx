'use client'

import { ArrowDownIcon, BoltIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface PeakComparisonProps {
  beforePeakKw: number
  afterPeakKw: number
  beforeMonthlyCost: number
  afterMonthlyCost: number
  annualSavings: number
  methodName: string
  nightDiscountApplied: boolean
  isConstrained: boolean
  constraintMessage: string | null
}

export function PeakComparison({
  beforePeakKw,
  afterPeakKw,
  beforeMonthlyCost,
  afterMonthlyCost,
  annualSavings,
  methodName,
  nightDiscountApplied,
  isConstrained,
  constraintMessage,
}: PeakComparisonProps) {
  const formatSek = (n: number) =>
    Math.round(n).toLocaleString('sv-SE') + ' kr'

  const formatKw = (n: number) =>
    n.toLocaleString('sv-SE', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' kW'

  const reductionKw = beforePeakKw - afterPeakKw
  const reductionPercent = beforePeakKw > 0 ? (reductionKw / beforePeakKw) * 100 : 0

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
          <BoltIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Effektavgift - Fore/Efter
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Beraknad med {methodName}
          </p>
        </div>
      </div>

      {/* Night discount badge */}
      {nightDiscountApplied && (
        <div className="mb-4 inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 text-xs font-medium rounded-full">
          Nattrabatt tillampas (22:00-06:00)
        </div>
      )}

      {/* Two-column comparison */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Without battery */}
        <div className="bg-gray-50 dark:bg-slate-900/50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
            Utan batteri
          </h4>
          <div className="space-y-2">
            <div>
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatKw(beforePeakKw)}
              </span>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {formatSek(beforeMonthlyCost)}/man
            </div>
          </div>
        </div>

        {/* With battery */}
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <h4 className="text-sm font-medium text-green-700 dark:text-green-400 mb-3">
            Med batteri
          </h4>
          <div className="space-y-2">
            <div>
              <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatKw(afterPeakKw)}
              </span>
            </div>
            <div className="text-sm text-green-600 dark:text-green-400">
              {formatSek(afterMonthlyCost)}/man
            </div>
          </div>
        </div>
      </div>

      {/* Savings summary */}
      <div className="border-t border-gray-200 dark:border-slate-700 pt-4 space-y-3">
        {/* Reduction */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <ArrowDownIcon className="h-4 w-4 text-green-500" />
            <span>Reduktion</span>
          </div>
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {formatKw(reductionKw)} ({reductionPercent.toFixed(0)}%)
          </span>
        </div>

        {/* Annual savings */}
        <div className="flex items-center justify-between">
          <span className="text-gray-600 dark:text-gray-400">Arlig besparing</span>
          <span className="text-lg font-bold text-green-600 dark:text-green-400">
            {formatSek(annualSavings)}
          </span>
        </div>
      </div>

      {/* Constraint warning */}
      {isConstrained && constraintMessage && (
        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg flex items-start gap-2">
          <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700 dark:text-amber-300">
            {constraintMessage}
          </p>
        </div>
      )}
    </div>
  )
}
