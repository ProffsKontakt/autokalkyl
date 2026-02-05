'use client'

import { ExpandableBreakdown } from './expandable-breakdown'
import type { CustomerType } from '@/lib/calculations/types'

interface FeesBreakdownProps {
  consumptionKwh: number
  energiskattSek: number
  energiskattRateOre: number
  overforingsavgiftSek: number
  overforingsavgiftRateOre: number
  customerType: CustomerType
}

export function FeesBreakdown({
  consumptionKwh,
  energiskattSek,
  energiskattRateOre,
  overforingsavgiftSek,
  overforingsavgiftRateOre,
  customerType,
}: FeesBreakdownProps) {
  const totalFees = energiskattSek + overforingsavgiftSek
  const momsLabel = customerType === 'PRIVATPERSON'
    ? ' (inkl. moms)'
    : ' (exkl. moms)'

  const formatSek = (n: number) =>
    Math.round(n).toLocaleString('sv-SE') + ' kr'

  return (
    <ExpandableBreakdown
      title="Avgifter & skatter"
      subtitle={formatSek(totalFees) + '/ar' + momsLabel}
      color="purple"
      icon={<span className="text-base">&#128176;</span>}
    >
      <div className="space-y-4 text-sm">
        {/* Explanation */}
        <p className="text-gray-600 dark:text-gray-400">
          Vid kop fran elnatet betalar du bade energiskatt och overforingsavgift
          utover elpriset.{' '}
          {customerType === 'PRIVATPERSON'
            ? 'Dessa avgifter inkluderar moms (25%).'
            : 'Dessa avgifter ar exklusive moms.'}
        </p>

        {/* Calculation breakdown */}
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900 dark:text-gray-100">Arlig elkostnad - avgifter</h4>

          <div className="bg-gray-50 dark:bg-slate-900/50 p-3 rounded-lg space-y-2 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Elforbrukning</span>
              <span className="font-medium">{consumptionKwh.toLocaleString('sv-SE')} kWh/ar</span>
            </div>

            <div className="border-t border-gray-200 dark:border-slate-700 pt-2 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Energiskatt ({energiskattRateOre} ore/kWh)
                </span>
                <span className="font-medium">{formatSek(energiskattSek)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Overforingsavgift ({overforingsavgiftRateOre.toFixed(2)} ore/kWh)
                </span>
                <span className="font-medium">{formatSek(overforingsavgiftSek)}</span>
              </div>
            </div>

            <div className="flex justify-between border-t border-gray-200 dark:border-slate-700 pt-2 text-purple-600 dark:text-purple-400">
              <span className="font-medium">Totalt{momsLabel}</span>
              <span className="font-bold">{formatSek(totalFees)}/ar</span>
            </div>
          </div>
        </div>

        {/* Solar self-consumption note */}
        <p className="text-xs text-gray-500 dark:text-gray-400 italic">
          Egenproducerad solel som anvands direkt undviker alla dessa avgifter.
        </p>
      </div>
    </ExpandableBreakdown>
  )
}
