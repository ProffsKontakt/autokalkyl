'use client'

import { useCalculationWizardStore } from '@/stores/calculation-wizard-store'
import { EMALDO_STODTJANSTER_RATES, EMALDO_CAMPAIGN_MONTHS } from '@/lib/calculations/constants'
import type { Elomrade } from '@/lib/calculations/types'
import { motion } from 'framer-motion'
import { useState } from 'react'

interface StodtjansterInputProps {
  elomrade: Elomrade
  isEmaldoBattery: boolean
  batteryCapacityKw: number
  totalYears?: number // For projection calculation, default 10
}

export function StodtjansterInput({
  elomrade,
  isEmaldoBattery,
  batteryCapacityKw,
  totalYears = 10,
}: StodtjansterInputProps) {
  const postCampaignRate = useCalculationWizardStore((state) => state.postCampaignRate)
  const updatePostCampaignRate = useCalculationWizardStore((state) => state.updatePostCampaignRate)
  const [showDetails, setShowDetails] = useState(false)

  // Non-Emaldo: Manual entry only
  if (!isEmaldoBattery) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Stödtjänster intäkt (SEK/år)
        </label>
        <input
          type="number"
          value={postCampaignRate * batteryCapacityKw}
          onChange={(e) => {
            const annualValue = parseFloat(e.target.value) || 0
            updatePostCampaignRate(annualValue / batteryCapacityKw)
          }}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          placeholder="Ange årlig intäkt"
          min="0"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Manuell uppskattning av grid services intäkt
        </p>
      </div>
    )
  }

  // Emaldo: Zone-based guaranteed income + configurable post-campaign
  const guaranteedMonthly = EMALDO_STODTJANSTER_RATES[elomrade]
  const guaranteedAnnual = guaranteedMonthly * 12
  const guaranteedTotal = guaranteedMonthly * EMALDO_CAMPAIGN_MONTHS

  // Post-campaign calculation
  const campaignYears = EMALDO_CAMPAIGN_MONTHS / 12 // 3 years
  const postCampaignYears = Math.max(0, totalYears - campaignYears)
  const postCampaignAnnual = postCampaignRate * batteryCapacityKw
  const postCampaignTotal = postCampaignAnnual * postCampaignYears

  // Combined totals
  const totalIncome = guaranteedTotal + postCampaignTotal
  const averageAnnual = totalIncome / totalYears

  return (
    <div className="space-y-4">
      {/* Guaranteed income (read-only) */}
      <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
        <div className="text-sm text-green-700 dark:text-green-400 font-medium mb-1">
          Emaldo garanterad intäkt ({EMALDO_CAMPAIGN_MONTHS} månader)
        </div>
        <motion.div
          key={guaranteedMonthly}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          className="text-2xl font-bold text-green-900 dark:text-green-300"
        >
          {guaranteedMonthly.toLocaleString('sv-SE')} kr/mån
        </motion.div>
        <div className="text-xs text-green-600 dark:text-green-500 mt-1 space-y-0.5">
          <div>= {guaranteedAnnual.toLocaleString('sv-SE')} kr/år</div>
          <div>= {guaranteedTotal.toLocaleString('sv-SE')} kr totalt ({campaignYears} år)</div>
        </div>
        <div className="mt-2 px-2 py-1 bg-green-100 dark:bg-green-800/30 rounded text-xs text-green-700 dark:text-green-400">
          Elområde {elomrade}
        </div>
      </div>

      {/* Post-campaign rate (configurable) */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Efter kampanjperiod (SEK/kW/år)
        </label>
        <input
          type="number"
          value={postCampaignRate}
          onChange={(e) => updatePostCampaignRate(parseFloat(e.target.value) || 0)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          step="50"
          min="0"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Uppskattad intäkt per kW batterikapacitet efter {EMALDO_CAMPAIGN_MONTHS} månader
        </p>
        {postCampaignYears > 0 && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            = {postCampaignAnnual.toLocaleString('sv-SE')} kr/år ({batteryCapacityKw.toFixed(1)} kW × {postCampaignRate} kr)
          </div>
        )}
      </div>

      {/* Expandable details */}
      <button
        type="button"
        onClick={() => setShowDetails(!showDetails)}
        className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
      >
        <span>{showDetails ? '▼' : '▶'}</span>
        Mer detaljer
      </button>

      {showDetails && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm space-y-2"
        >
          <div className="font-medium text-gray-900 dark:text-gray-100">
            Beräkning över {totalYears} år
          </div>
          <div className="grid grid-cols-2 gap-2 text-gray-600 dark:text-gray-400">
            <div>Garanterad (år 1-3):</div>
            <div className="text-right font-medium">{guaranteedTotal.toLocaleString('sv-SE')} kr</div>
            <div>Efter kampanj (år {campaignYears + 1}-{totalYears}):</div>
            <div className="text-right font-medium">{postCampaignTotal.toLocaleString('sv-SE')} kr</div>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-1 font-medium text-gray-900 dark:text-gray-100">
              Total intäkt:
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-1 text-right font-bold text-green-600">
              {totalIncome.toLocaleString('sv-SE')} kr
            </div>
            <div className="text-gray-500">Snitt per år:</div>
            <div className="text-right">{Math.round(averageAnnual).toLocaleString('sv-SE')} kr/år</div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
