'use client'

/**
 * Consumption distribution section for results page.
 *
 * Displays the monthly consumption distribution chart and heating type info
 * as a collapsible section matching other results sections.
 *
 * @see DistributionChart for the underlying chart component
 */

import { useState } from 'react'
import { ChevronDown, ChevronUp, Zap } from 'lucide-react'
import { DistributionChart } from '../wizard/consumption-profile/distribution-chart'
import { HEATING_TYPE_PROFILES } from '@/lib/calculations/consumption-profiles'
import type { HeatingType } from '@prisma/client'

interface ConsumptionDistributionSectionProps {
  annualKwh: number
  heatingType: HeatingType | null
  /** Whether to start expanded (default: true) */
  defaultExpanded?: boolean
}

export function ConsumptionDistributionSection({
  annualKwh,
  heatingType,
  defaultExpanded = true,
}: ConsumptionDistributionSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  // Get heating type profile info if available
  const profile = heatingType ? HEATING_TYPE_PROFILES[heatingType] : null

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      {/* Header (clickable to toggle) */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        aria-expanded={isExpanded}
        aria-controls="consumption-distribution-content"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Forbrukningsprofil
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {profile ? profile.name : 'Ingen uppvarmningstyp vald'}
              {' - '}
              {annualKwh.toLocaleString('sv-SE')} kWh/ar
            </p>
          </div>
        </div>

        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {/* Collapsible content */}
      {isExpanded && (
        <div
          id="consumption-distribution-content"
          className="px-5 pb-5 space-y-4 border-t border-gray-100 dark:border-gray-700"
        >
          {/* Fallback if no heating type */}
          {!heatingType ? (
            <div className="py-8 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Ingen uppvarmningstyp vald for denna kalkyl.
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Forbrukningsprofilen baseras pa uppvarmningstyp och paverkar hur
                elforbrukningen fordelas over aret.
              </p>
            </div>
          ) : (
            <>
              {/* Distribution chart */}
              <div className="pt-4">
                <DistributionChart
                  annualKwh={annualKwh}
                  heatingType={heatingType}
                />
              </div>

              {/* Heating type info */}
              <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {profile?.name}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {profile?.description}
                </p>

                {/* Seasonal pattern summary */}
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Profil:</span>
                      <span className="ml-2 font-medium text-gray-700 dark:text-gray-300">
                        {heatingType === 'FJARRVARME'
                          ? 'Jamn over aret'
                          : heatingType === 'DIREKTVERKANDE'
                          ? 'Stark sasongsvariation'
                          : 'Mattlig sasongsvariation'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Arlig total:</span>
                      <span className="ml-2 font-medium text-gray-700 dark:text-gray-300">
                        {annualKwh.toLocaleString('sv-SE')} kWh
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
