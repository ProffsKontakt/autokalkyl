'use client'

import { useState } from 'react'
import { PublicConsumptionSimulator } from './public-consumption-simulator'
import { PublicBatterySummary } from './public-battery-summary'
import { PublicResultsView } from './public-results-view'
import { StickyResultsBar } from './sticky-results-bar'
import { MobileBatteryCarousel } from './mobile-battery-carousel'
import { saveVariant } from '@/actions/share'
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
