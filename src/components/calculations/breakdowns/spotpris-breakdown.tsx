'use client'

import { ExpandableBreakdown } from './expandable-breakdown'

interface SpotprisBreakdownProps {
  capacityKwh: number
  cyclesPerDay: number
  efficiency: number       // 0.8 for 80%
  spreadOre: number        // ~100 ore = 1 SEK
  annualSavingsSek: number
}

export function SpotprisBreakdown({
  capacityKwh,
  cyclesPerDay,
  efficiency,
  spreadOre,
  annualSavingsSek,
}: SpotprisBreakdownProps) {
  const dailyKwh = capacityKwh * efficiency * cyclesPerDay
  const spreadSek = spreadOre / 100
  const dailySavings = dailyKwh * spreadSek

  const formatSek = (n: number) =>
    Math.round(n).toLocaleString('sv-SE') + ' kr'

  return (
    <ExpandableBreakdown
      title="Hur beraknas spotprisoptimering?"
      color="green"
      icon={<span>⚡</span>}
    >
      <div className="space-y-4 text-sm">
        {/* Explanation */}
        <p className="text-gray-600 dark:text-gray-400">
          Batteriet laddar nar elpriset ar lagt (natt) och anvander energin nar priset ar hogt (dag).
          Skillnaden i pris ger besparingen.
        </p>

        {/* Formula breakdown */}
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900 dark:text-gray-100">Berakning</h4>

          <div className="bg-gray-50 dark:bg-slate-900/50 p-3 rounded-lg space-y-2 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Batterikapacitet</span>
              <span className="font-medium">{capacityKwh} kWh</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">x Verkningsgrad</span>
              <span className="font-medium">{(efficiency * 100).toFixed(0)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">x Cykler/dag</span>
              <span className="font-medium">{cyclesPerDay}</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 dark:border-slate-700 pt-2">
              <span className="text-gray-600 dark:text-gray-400">= Daglig energi</span>
              <span className="font-medium">{dailyKwh.toFixed(1)} kWh/dag</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">x Prisskillnad (dag-natt)</span>
              <span className="font-medium">~{spreadSek.toFixed(2)} kr/kWh</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">= Daglig besparing</span>
              <span className="font-medium">{dailySavings.toFixed(0)} kr/dag</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">x 365 dagar</span>
              <span className="font-medium">365</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 dark:border-slate-700 pt-2 text-green-600 dark:text-green-400">
              <span className="font-medium">= Arlig besparing</span>
              <span className="font-bold">{formatSek(annualSavingsSek)}</span>
            </div>
          </div>
        </div>
      </div>
    </ExpandableBreakdown>
  )
}
