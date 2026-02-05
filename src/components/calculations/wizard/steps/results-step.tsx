'use client'

import { useMemo } from 'react'
import { useCalculationWizardStore } from '@/stores/calculation-wizard-store'
import { calculateBatteryROI } from '@/lib/calculations/engine'
import { VAT_RATE, GRON_TEKNIK_RATE, DEFAULT_GRID_SERVICES_RATE, DEFAULT_AVG_DISCHARGE_PERCENT, DEFAULT_CURRENT_PEAK_KW } from '@/lib/calculations/constants'
import { SummaryCards } from '@/components/calculations/results/summary-cards'
import { SavingsBreakdown } from '@/components/calculations/results/savings-breakdown'
import { ROITimelineChart } from '@/components/calculations/results/roi-timeline-chart'
import { ComparisonView } from '@/components/calculations/results/comparison-view'
import { PeakComparison } from '@/components/calculations/results/peak-comparison'
import { CyclesSlider } from '@/components/calculations/controls/cycles-slider'
import { PeakShavingSlider } from '@/components/calculations/controls/peak-shaving-slider'
import { StodtjansterInput } from '@/components/calculations/controls/stodtjanster-input'
import { ConsumptionDistributionSection } from '@/components/calculations/results/consumption-distribution-section'
import type { BatterySpec, CalculationResults } from '@/lib/calculations/types'

interface NatagareInfo {
  id: string
  name: string
  dayRateSekKw: number
  nightRateSekKw: number
  // Phase 11: Peak billing config
  peakCalculationMethod?: string | null
  nightDiscountPercent?: number | null
  peakNightStartHour?: number | null
  peakNightEndHour?: number | null
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
    // Phase 7: Calculation ID and overrides
    calculationId,
    overrides,
    // Phase 10: Consumption profile
    annualConsumptionKwh,
    heatingType,
    // Phase 11: Peak targets
    targetAveragePeakKw,
    // Phase 15: Customer type and electricity
    customerType,
    koptElKwh,
    electricityPriceOreKwh,
    hasSolar,
    solarProductionKwh,
    currentSelfConsumptionKwh,
    projectedSelfConsumptionKwh,
  } = useCalculationWizardStore()

  // Get prices for the selected elomrade
  const prices = elomrade && quarterlyPrices ? quarterlyPrices[elomrade] : null

  // Look up the selected natagare to get effect tariff rates and peak config
  const selectedNatagare = natagareList.find(n => n.id === natagareId)
  const natagareInfo = selectedNatagare ? {
    dayRateSekKw: selectedNatagare.dayRateSekKw,
    nightRateSekKw: selectedNatagare.nightRateSekKw,
    // Phase 11: Peak billing config
    peakCalculationMethod: selectedNatagare.peakCalculationMethod,
    nightDiscountPercent: selectedNatagare.nightDiscountPercent,
    peakNightStartHour: selectedNatagare.peakNightStartHour,
    peakNightEndHour: selectedNatagare.peakNightEndHour,
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
        currentPeakKw: targetAveragePeakKw ?? DEFAULT_CURRENT_PEAK_KW,
        postCampaignRatePerKwYear: postCampaignRate,
        elomrade: elomrade || undefined,
        isEmaldoBattery: batteryInfo.brandName.toLowerCase().includes('emaldo'),
        totalProjectionYears: 10,
        // Phase 11: Peak billing config
        natagareConfig: natagareInfo.peakCalculationMethod ? {
          peakCalculationMethod: natagareInfo.peakCalculationMethod,
          nightDiscountPercent: natagareInfo.nightDiscountPercent ?? null,
          peakNightStartHour: natagareInfo.peakNightStartHour ?? null,
          peakNightEndHour: natagareInfo.peakNightEndHour ?? null,
          dayRateSekKw: natagareInfo.dayRateSekKw,
        } : undefined,
      })

      return {
        batteryName: `${batteryInfo.brandName} ${batteryInfo.name}`,
        batteryInfo,
        results,
      }
    }).filter(Boolean) as { batteryName: string; batteryInfo: BatteryInfo; results: CalculationResults }[]
  }, [selectedBatteries, batteryList, prices, natagareInfo, orgSettings, cyclesPerDay, peakShavingPercent, postCampaignRate, elomrade, targetAveragePeakKw])

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
              currentPeakKw={targetAveragePeakKw ?? DEFAULT_CURRENT_PEAK_KW}
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

      {/* Peak billing comparison - Phase 11 */}
      {primaryResult.results.peakBillingBeforeKw !== undefined && primaryResult.results.peakBillingBeforeKw > 0 && (
        <PeakComparison
          beforePeakKw={primaryResult.results.peakBillingBeforeKw}
          afterPeakKw={primaryResult.results.peakBillingAfterKw ?? 0}
          beforeMonthlyCost={primaryResult.results.peakBillingBeforeKw * (natagareInfo?.dayRateSekKw ?? 0)}
          afterMonthlyCost={(primaryResult.results.peakBillingAfterKw ?? 0) * (natagareInfo?.dayRateSekKw ?? 0)}
          annualSavings={primaryResult.results.peakBillingAnnualSavingsSek ?? 0}
          methodName={primaryResult.results.peakMethodUsed ?? 'Enkel max'}
          nightDiscountApplied={primaryResult.results.peakNightDiscountApplied ?? false}
          isConstrained={primaryResult.results.peakWasConstrained ?? false}
          constraintMessage={primaryResult.results.peakConstraintReason ?? null}
        />
      )}

      {/* Comparison view if multiple batteries */}
      {calculatedResults.length > 1 && (
        <ComparisonView batteries={calculatedResults} />
      )}

      {/* Detailed breakdown for primary battery */}
      <div className="grid lg:grid-cols-2 gap-6">
        <SavingsBreakdown
          results={primaryResult.results}
          calculationId={calculationId ?? undefined}
          initialOverrides={overrides}
          isPublicView={false}
        />
        <ROITimelineChart results={primaryResult.results} batteryName={primaryResult.batteryName} />
      </div>

      {/* Consumption distribution section - Phase 10 */}
      <ConsumptionDistributionSection
        annualKwh={annualConsumptionKwh}
        heatingType={heatingType}
        defaultExpanded={false}
      />

      {/* Phase 15: Electricity Information Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Elinformation
        </h3>
        <dl className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div>
            <dt className="text-gray-500 dark:text-gray-400">Kundtyp</dt>
            <dd className="font-medium text-gray-900 dark:text-gray-100">
              {customerType === 'FORETAG' ? 'Foretag (exkl. moms)' : 'Privatperson'}
            </dd>
          </div>
          {koptElKwh > 0 && (
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Kopt el</dt>
              <dd className="font-medium text-gray-900 dark:text-gray-100">
                {koptElKwh.toLocaleString('sv-SE')} kWh/ar
              </dd>
            </div>
          )}
          {electricityPriceOreKwh > 0 && (
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Elpris</dt>
              <dd className="font-medium text-gray-900 dark:text-gray-100">
                {electricityPriceOreKwh.toFixed(0)} ore/kWh
              </dd>
            </div>
          )}
          {hasSolar && solarProductionKwh && solarProductionKwh > 0 && (
            <>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Solproduktion</dt>
                <dd className="font-medium text-gray-900 dark:text-gray-100">
                  {solarProductionKwh.toLocaleString('sv-SE')} kWh/ar
                </dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Egenanv. idag / med batteri</dt>
                <dd className="font-medium text-gray-900 dark:text-gray-100">
                  {currentSelfConsumptionKwh && solarProductionKwh > 0
                    ? `${((currentSelfConsumptionKwh / solarProductionKwh) * 100).toFixed(0)}%`
                    : '-'}
                  {' / '}
                  {projectedSelfConsumptionKwh && solarProductionKwh > 0
                    ? `${((projectedSelfConsumptionKwh / solarProductionKwh) * 100).toFixed(0)}%`
                    : '-'}
                </dd>
              </div>
            </>
          )}
        </dl>
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
