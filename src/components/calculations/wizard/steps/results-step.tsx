'use client'

import { useMemo } from 'react'
import { useCalculationWizardStore } from '@/stores/calculation-wizard-store'
import { calculateBatteryROI } from '@/lib/calculations/engine'
import { VAT_RATE, GRON_TEKNIK_RATE, DEFAULT_GRID_SERVICES_RATE, DEFAULT_AVG_DISCHARGE_PERCENT } from '@/lib/calculations/constants'
import { SummaryCards } from '@/components/calculations/results/summary-cards'
import { SavingsBreakdown } from '@/components/calculations/results/savings-breakdown'
import { ROITimelineChart } from '@/components/calculations/results/roi-timeline-chart'
import { ComparisonView } from '@/components/calculations/results/comparison-view'
import { CyclesSlider } from '@/components/calculations/controls/cycles-slider'
import { PeakShavingSlider } from '@/components/calculations/controls/peak-shaving-slider'
import { StodtjansterInput } from '@/components/calculations/controls/stodtjanster-input'
import type { BatterySpec, CalculationResults } from '@/lib/calculations/types'

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

interface ResultsStepProps {
  quarterlyPrices: Record<string, { avgDayPriceOre: number; avgNightPriceOre: number }> | null
  orgSettings?: {
    isProffsKontaktAffiliated: boolean
    installerFixedCut: number | null
  }
  batteryList?: BatteryInfo[]
  natagareList?: NatagareInfo[]
}

export function ResultsStep({
  quarterlyPrices,
  orgSettings,
  batteryList = [],
  natagareList = [],
}: ResultsStepProps) {
  const {
    customerName,
    elomrade,
    natagareId,
    batteries: selectedBatteries,
    // Phase 6: Control values
    cyclesPerDay,
    peakShavingPercent,
    postCampaignRate,
  } = useCalculationWizardStore()

  // Get prices for the selected elomrade
  const prices = elomrade && quarterlyPrices ? quarterlyPrices[elomrade] : null

  // Look up the selected natagare to get effect tariff rates
  const selectedNatagare = natagareList.find(n => n.id === natagareId)
  const natagareInfo = selectedNatagare ? {
    dayRateSekKw: selectedNatagare.dayRateSekKw,
    nightRateSekKw: selectedNatagare.nightRateSekKw,
  } : null

  // Calculate results for each selected battery
  const calculatedResults = useMemo(() => {
    if (!prices || !natagareInfo) return []

    return selectedBatteries.map(selection => {
      const batteryInfo = batteryList.find(b => b.id === selection.configId)
      if (!batteryInfo) return null

      const batterySpec: BatterySpec = {
        capacityKwh: batteryInfo.capacityKwh,
        chargeEfficiency: batteryInfo.chargeEfficiency,
        dischargeEfficiency: batteryInfo.dischargeEfficiency,
        maxDischargeKw: batteryInfo.maxDischargeKw,
        maxChargeKw: batteryInfo.maxChargeKw,
        costPrice: batteryInfo.costPrice,
      }

      const { results } = calculateBatteryROI({
        battery: batterySpec,
        cyclesPerDay,
        avgDischargePercent: DEFAULT_AVG_DISCHARGE_PERCENT,
        dayPriceOre: prices.avgDayPriceOre,
        nightPriceOre: prices.avgNightPriceOre,
        effectTariffDayRate: natagareInfo.dayRateSekKw,
        effectTariffNightRate: natagareInfo.nightRateSekKw,
        gridServicesRatePerKwYear: DEFAULT_GRID_SERVICES_RATE,
        totalPriceExVat: selection.totalPriceExVat,
        installationCost: selection.installationCost,
        vatRate: VAT_RATE,
        gronTeknikRate: GRON_TEKNIK_RATE,
        installerCut: orgSettings?.installerFixedCut ?? undefined,
        batteryCostPrice: batteryInfo.costPrice,
        // Phase 6: New control parameters
        peakShavingPercent,
        currentPeakKw: 8, // TODO: Get from customer data or make configurable
        postCampaignRatePerKwYear: postCampaignRate,
        elomrade: elomrade || undefined,
        isEmaldoBattery: batteryInfo.brandName.toLowerCase().includes('emaldo'),
        totalProjectionYears: 10,
      })

      return {
        batteryName: `${batteryInfo.brandName} ${batteryInfo.name}`,
        batteryInfo,
        results,
      }
    }).filter(Boolean) as { batteryName: string; batteryInfo: BatteryInfo; results: CalculationResults }[]
  }, [selectedBatteries, batteryList, prices, natagareInfo, orgSettings, cyclesPerDay, peakShavingPercent, postCampaignRate, elomrade])

  if (!prices) {
    return (
      <div className="max-w-4xl mx-auto">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Resultat</h2>
        <div className="p-6 bg-yellow-50 rounded-lg text-yellow-800">
          <p className="font-medium">Elprisdata saknas</p>
          <p className="text-sm mt-1">
            Ingen kvartalsdata finns för {elomrade}. Kontakta administratören.
          </p>
        </div>
      </div>
    )
  }

  if (!natagareInfo) {
    return (
      <div className="max-w-4xl mx-auto">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Resultat</h2>
        <div className="p-6 bg-yellow-50 rounded-lg text-yellow-800">
          <p className="font-medium">Nätägare saknas</p>
          <p className="text-sm mt-1">
            Vald nätägare kunde inte hittas. Gå tillbaka och välj nätägare igen.
          </p>
        </div>
      </div>
    )
  }

  if (calculatedResults.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Resultat</h2>
        <div className="p-6 bg-gray-50 rounded-lg text-gray-600">
          <p>Välj minst ett batteri för att se resultat.</p>
        </div>
      </div>
    )
  }

  const primaryResult = calculatedResults[0]

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Resultat för {customerName}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Elområde {elomrade} - Elpris {prices.avgDayPriceOre.toFixed(0)}/{prices.avgNightPriceOre.toFixed(0)} öre/kWh (dag/natt)
            {selectedNatagare && ` - ${selectedNatagare.name}`}
          </p>
        </div>
      </div>

      {/* Calculation controls */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Beräkningsparametrar
        </h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <CyclesSlider />
          </div>
          <div>
            <PeakShavingSlider
              currentPeakKw={8}
              batteryMaxDischargeKw={primaryResult.batteryInfo.maxDischargeKw}
            />
          </div>
          <div>
            <StodtjansterInput
              elomrade={elomrade || 'SE3'}
              isEmaldoBattery={primaryResult.batteryInfo.brandName.toLowerCase().includes('emaldo')}
              batteryCapacityKw={primaryResult.batteryInfo.maxDischargeKw}
            />
          </div>
        </div>
      </div>

      {/* Summary cards for primary battery */}
      <SummaryCards
        results={primaryResult.results}
        batteryName={primaryResult.batteryName}
      />

      {/* Comparison view if multiple batteries */}
      {calculatedResults.length > 1 && (
        <ComparisonView batteries={calculatedResults} />
      )}

      {/* Detailed breakdown for primary battery */}
      <div className="grid lg:grid-cols-2 gap-6">
        <SavingsBreakdown results={primaryResult.results} />
        <ROITimelineChart results={primaryResult.results} batteryName={primaryResult.batteryName} />
      </div>

      {/* Margin display for ProffsKontakt affiliates */}
      {orgSettings?.isProffsKontaktAffiliated && primaryResult.results.marginSek !== undefined && (
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">Provisionsinfo</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-blue-700">Din provision (installatorsarvode):</span>
              <span className="ml-2 font-bold text-blue-900">
                {(orgSettings.installerFixedCut ?? 0).toLocaleString('sv-SE')} kr
              </span>
            </div>
          </div>
          <p className="text-xs text-blue-600 mt-2">
            Marginalinformation visas ej för kund.
          </p>
        </div>
      )}
    </div>
  )
}
