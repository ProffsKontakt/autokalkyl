'use client'

import { useState, useEffect } from 'react'
import { PublicConsumptionSimulator } from './public-consumption-simulator'
import { PublicBatterySummary } from './public-battery-summary'
import { PublicResultsView } from './public-results-view'
import { StickyResultsBar } from './sticky-results-bar'
import { MobileBatteryCarousel } from './mobile-battery-carousel'
import { saveVariant } from '@/actions/share'
import { calculateBatteryROI } from '@/lib/calculations/engine'
import {
  VAT_RATE,
  GRON_TEKNIK_RATE,
  DEFAULT_GRID_SERVICES_RATE,
  DEFAULT_AVG_DISCHARGE_PERCENT,
  DEFAULT_POST_CAMPAIGN_RATE,
} from '@/lib/calculations/constants'
import type {
  PublicBatteryInfo,
  CalculationResultsPublic,
} from '@/lib/share/types'
import type { Elomrade } from '@prisma/client'

interface InteractivePublicViewProps {
  calculationId: string
  batteries: PublicBatteryInfo[]
  results: CalculationResultsPublic
  consumptionProfile: { data: number[][] }
  annualConsumptionKwh: number
  natagare: {
    dayRateSekKw: number
    nightRateSekKw: number
    dayStartHour: number
    dayEndHour: number
  }
  elomrade: Elomrade
  quarterlyPrices: {
    avgDayPriceOre: number
    avgNightPriceOre: number
  } | null
  primaryColor: string
}

// Phase 6: Calculation parameters for public view
const CYCLES_PER_DAY = 1.5
const PEAK_SHAVING_PERCENT = 50

export function InteractivePublicView({
  calculationId,
  batteries,
  results,
  consumptionProfile,
  annualConsumptionKwh,
  natagare,
  elomrade,
  quarterlyPrices,
  primaryColor,
}: InteractivePublicViewProps) {
  const [currentResults, setCurrentResults] = useState(results)
  const [selectedBatteryIndex, setSelectedBatteryIndex] = useState(0)

  // Recalculate on mount to use correct Phase 6 formulas
  useEffect(() => {
    if (!quarterlyPrices) return

    const battery = batteries[selectedBatteryIndex]
    if (!battery) return

    const isEmaldo = battery.brandName.toLowerCase().includes('emaldo')
    const { results: engineResults } = calculateBatteryROI({
      battery: {
        capacityKwh: battery.capacityKwh,
        maxDischargeKw: battery.maxDischargeKw,
        maxChargeKw: battery.maxChargeKw,
        chargeEfficiency: battery.chargeEfficiency / 100,
        dischargeEfficiency: battery.dischargeEfficiency / 100,
        costPrice: 0,
      },
      cyclesPerDay: CYCLES_PER_DAY,
      peakShavingPercent: PEAK_SHAVING_PERCENT,
      currentPeakKw: 8,
      postCampaignRatePerKwYear: DEFAULT_POST_CAMPAIGN_RATE,
      elomrade,
      isEmaldoBattery: isEmaldo,
      totalProjectionYears: 10,
      avgDischargePercent: DEFAULT_AVG_DISCHARGE_PERCENT,
      dayPriceOre: quarterlyPrices.avgDayPriceOre,
      nightPriceOre: quarterlyPrices.avgNightPriceOre,
      effectTariffDayRate: natagare.dayRateSekKw,
      effectTariffNightRate: natagare.nightRateSekKw,
      gridServicesRatePerKwYear: DEFAULT_GRID_SERVICES_RATE,
      totalPriceExVat: battery.totalPriceExVat,
      installationCost: 0,
      vatRate: VAT_RATE,
      gronTeknikRate: GRON_TEKNIK_RATE,
    })

    const newResults: CalculationResultsPublic = {
      totalPriceExVat: battery.totalPriceExVat,
      totalPriceIncVat: battery.totalPriceIncVat,
      costAfterGronTeknik: battery.costAfterGronTeknik,
      effectiveCapacityKwh: engineResults.effectiveCapacityPerCycleKwh,
      annualEnergyKwh: engineResults.energyFromBatteryPerYearKwh,
      spotprisSavings: engineResults.spotprisSavingsSek,
      effectTariffSavings: engineResults.effectTariffSavingsSek,
      gridServicesIncome: engineResults.gridServicesIncomeSek,
      totalAnnualSavings: engineResults.totalAnnualSavingsSek,
      paybackYears: engineResults.paybackPeriodYears,
      roi10Year: engineResults.roi10YearPercent,
      roi15Year: engineResults.roi15YearPercent,
    }

    setCurrentResults(newResults)
  }, [batteries, selectedBatteryIndex, elomrade, natagare, quarterlyPrices])

  const handleResultsChange = async (
    newResults: CalculationResultsPublic,
    newProfile: number[][],
    newAnnualKwh: number
  ) => {
    setCurrentResults(newResults)
    // Save variant to database (fire-and-forget)
    saveVariant(calculationId, newProfile, newAnnualKwh, newResults)
  }

  // Default quarterly prices if not available (fallback)
  const prices = quarterlyPrices || {
    avgDayPriceOre: 80, // Reasonable default
    avgNightPriceOre: 40,
  }

  return (
    <>
      {/* Mobile battery carousel (hidden on desktop) */}
      {batteries.length > 1 && (
        <MobileBatteryCarousel
          batteries={batteries}
          results={currentResults}
          selectedIndex={selectedBatteryIndex}
          onSelect={setSelectedBatteryIndex}
          primaryColor={primaryColor}
        />
      )}

      {/* Consumption simulator */}
      <PublicConsumptionSimulator
        calculationId={calculationId}
        originalProfile={consumptionProfile}
        originalAnnualKwh={annualConsumptionKwh}
        originalResults={results}
        battery={batteries[selectedBatteryIndex]}
        natagare={natagare}
        elomrade={elomrade}
        quarterlyPrices={prices}
        onResultsChange={handleResultsChange}
        primaryColor={primaryColor}
      />

      {/* Battery summary with current results */}
      <PublicBatterySummary
        battery={batteries[selectedBatteryIndex]}
        allBatteries={batteries}
        results={currentResults}
      />

      {/* Results view with current results */}
      <PublicResultsView
        results={currentResults}
        primaryColor={primaryColor}
      />

      {/* Sticky bar */}
      <StickyResultsBar
        results={currentResults}
        primaryColor={primaryColor}
      />
    </>
  )
}
