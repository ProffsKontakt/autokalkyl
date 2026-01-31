'use client'

import { ExpandableBreakdown } from './expandable-breakdown'
import { EMALDO_CAMPAIGN_MONTHS } from '@/lib/calculations/constants'

interface StodtjansterBreakdownProps {
  elomrade: string
  isEmaldoBattery: boolean
  batteryCapacityKw: number
  guaranteedMonthlySek?: number
  guaranteedAnnualSek?: number
  postCampaignRatePerKwYear?: number
  postCampaignAnnualSek?: number
  displayedAnnualSek: number
}

export function StodtjansterBreakdown({
  elomrade,
  isEmaldoBattery,
  batteryCapacityKw,
  guaranteedMonthlySek,
  guaranteedAnnualSek,
  postCampaignRatePerKwYear,
  postCampaignAnnualSek,
  displayedAnnualSek,
}: StodtjansterBreakdownProps) {
  const formatSek = (n: number) =>
    Math.round(n).toLocaleString('sv-SE') + ' kr'

  return (
    <ExpandableBreakdown
      title="Hur beraknas stodtjanster?"
      color="purple"
      icon={<span>🔌</span>}
    >
      <div className="space-y-4 text-sm">
        {/* Explanation */}
        <p className="text-gray-600 dark:text-gray-400">
          Du kan tjana pengar pa att lata elnatet anvanda ditt batteri for frekvensreglering
          och andra balansieringstjanster.
        </p>

        {/* Formula breakdown */}
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900 dark:text-gray-100">Berakning</h4>

          <div className="bg-gray-50 dark:bg-slate-900/50 p-3 rounded-lg space-y-2 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Elomrade</span>
              <span className="font-medium">{elomrade}</span>
            </div>

            {isEmaldoBattery && guaranteedMonthlySek !== undefined ? (
              <>
                {/* Emaldo guaranteed income */}
                <div className="pt-2 border-t border-gray-200 dark:border-slate-700">
                  <div className="text-green-600 dark:text-green-400 font-medium mb-1">
                    Emaldo garanterad intakt ({EMALDO_CAMPAIGN_MONTHS} man)
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Manatlig intakt</span>
                  <span className="font-medium">{formatSek(guaranteedMonthlySek)}/man</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">x 12 manader</span>
                  <span className="font-medium">12</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 dark:border-slate-700 pt-2 text-purple-600 dark:text-purple-400">
                  <span className="font-medium">= Arlig intakt (ar 1-3)</span>
                  <span className="font-bold">{formatSek(guaranteedAnnualSek || 0)}</span>
                </div>

                {/* Post-campaign estimate */}
                {postCampaignRatePerKwYear !== undefined && postCampaignAnnualSek !== undefined && (
                  <div className="pt-2 border-t border-gray-200 dark:border-slate-700 space-y-2">
                    <div className="text-gray-500 dark:text-gray-500 font-medium">
                      Efter kampanjperiod (ar 4+)
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Batterikapacitet</span>
                      <span className="font-medium">{batteryCapacityKw.toFixed(1)} kW</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">x Uppskattad rate</span>
                      <span className="font-medium">{postCampaignRatePerKwYear} kr/kW/ar</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">= Arlig intakt (ar 4+)</span>
                      <span className="font-medium">{formatSek(postCampaignAnnualSek)}/ar</span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Non-Emaldo: Standard calculation */}
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Batterikapacitet</span>
                  <span className="font-medium">{batteryCapacityKw.toFixed(1)} kW</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">x Uppskattad rate</span>
                  <span className="font-medium">{postCampaignRatePerKwYear || 500} kr/kW/ar</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 dark:border-slate-700 pt-2 text-purple-600 dark:text-purple-400">
                  <span className="font-medium">= Arlig intakt</span>
                  <span className="font-bold">{formatSek(displayedAnnualSek)}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </ExpandableBreakdown>
  )
}
