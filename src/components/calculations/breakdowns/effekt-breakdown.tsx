'use client'

import { ExpandableBreakdown } from './expandable-breakdown'

interface EffektBreakdownProps {
  currentPeakKw: number
  peakShavingPercent: number
  actualPeakShavingKw: number  // After battery constraint
  newPeakKw: number
  tariffRateSekKw: number      // Day rate from natagare
  annualSavingsSek: number
  isConstrained: boolean       // True if battery limited the shaving
}

export function EffektBreakdown({
  currentPeakKw,
  peakShavingPercent,
  actualPeakShavingKw,
  newPeakKw,
  tariffRateSekKw,
  annualSavingsSek,
  isConstrained,
}: EffektBreakdownProps) {
  const targetKw = currentPeakKw * (peakShavingPercent / 100)
  const monthlySavings = actualPeakShavingKw * tariffRateSekKw

  const formatSek = (n: number) =>
    Math.round(n).toLocaleString('sv-SE') + ' kr'

  return (
    <ExpandableBreakdown
      title="Hur beraknas effektavgiftbesparing?"
      color="blue"
      icon={<span>📊</span>}
    >
      <div className="space-y-4 text-sm">
        {/* Explanation */}
        <p className="text-gray-600 dark:text-gray-400">
          Genom att minska dina effekttoppar med batteriet sanker du din manatliga effektavgift
          fran elnatagaren.
        </p>

        {/* Formula breakdown */}
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900 dark:text-gray-100">Berakning</h4>

          <div className="bg-gray-50 dark:bg-slate-900/50 p-3 rounded-lg space-y-2 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Nuvarande toppeffekt</span>
              <span className="font-medium">{currentPeakKw.toFixed(1)} kW</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">x Reduktion</span>
              <span className="font-medium">{peakShavingPercent}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">= Malreduktion</span>
              <span className="font-medium">{targetKw.toFixed(1)} kW</span>
            </div>

            {isConstrained && (
              <div className="flex justify-between text-amber-600 dark:text-amber-400">
                <span>Begransad av batterikapacitet</span>
                <span className="font-medium">{actualPeakShavingKw.toFixed(1)} kW</span>
              </div>
            )}

            <div className="flex justify-between border-t border-gray-200 dark:border-slate-700 pt-2">
              <span className="text-gray-600 dark:text-gray-400">Faktisk reduktion</span>
              <span className="font-medium">{actualPeakShavingKw.toFixed(1)} kW</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Ny toppeffekt</span>
              <span className="font-medium">{newPeakKw.toFixed(1)} kW</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 dark:border-slate-700 pt-2">
              <span className="text-gray-600 dark:text-gray-400">x Effekttariff</span>
              <span className="font-medium">{tariffRateSekKw.toFixed(0)} kr/kW/man</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">= Manatlig besparing</span>
              <span className="font-medium">{formatSek(monthlySavings)}/man</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">x 12 manader</span>
              <span className="font-medium">12</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 dark:border-slate-700 pt-2 text-blue-600 dark:text-blue-400">
              <span className="font-medium">= Arlig besparing</span>
              <span className="font-bold">{formatSek(annualSavingsSek)}</span>
            </div>
          </div>
        </div>
      </div>
    </ExpandableBreakdown>
  )
}
