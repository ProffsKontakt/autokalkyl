'use client'

import { useState } from 'react'
import type { PublicBatteryInfo, CalculationResultsPublic } from '@/lib/share/types'

interface PublicBatterySummaryProps {
  battery: PublicBatteryInfo
  allBatteries: PublicBatteryInfo[]
  results: CalculationResultsPublic
}

function formatSek(value: number): string {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'SEK',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

export function PublicBatterySummary({
  battery,
  allBatteries,
  results,
}: PublicBatterySummaryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const currentBattery = allBatteries[selectedIndex] || battery
  const hasMultipleBatteries = allBatteries.length > 1

  return (
    <section className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Battery selector (if multiple) */}
      {hasMultipleBatteries && (
        <div className="border-b bg-gray-50 px-6 py-3">
          <div className="flex gap-2 overflow-x-auto">
            {allBatteries.map((b, index) => (
              <button
                key={index}
                onClick={() => setSelectedIndex(index)}
                className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap ${
                  selectedIndex === index
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border text-gray-700 hover:bg-gray-50'
                }`}
              >
                {b.brandName} {b.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Battery header */}
      <div className="p-6 border-b">
        <div className="flex items-center gap-4">
          {currentBattery.brandLogoUrl && (
            <img
              src={currentBattery.brandLogoUrl}
              alt={currentBattery.brandName}
              className="h-12 w-auto object-contain"
            />
          )}
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {currentBattery.brandName} {currentBattery.name}
            </h2>
            <p className="text-gray-500">
              {currentBattery.capacityKwh} kWh batterisystem
            </p>
          </div>
        </div>
      </div>

      {/* Key metrics - payback first per CONTEXT.md */}
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0">
        <div className="p-4 text-center">
          <p className="text-sm text-gray-500">Återbetalningstid</p>
          <p className="text-2xl font-bold text-green-600">
            {results.paybackYears.toFixed(1)} år
          </p>
        </div>
        <div className="p-4 text-center">
          <p className="text-sm text-gray-500">Årlig besparing</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatSek(results.totalAnnualSavings)}
          </p>
        </div>
        <div className="p-4 text-center">
          <p className="text-sm text-gray-500">Avkastning 10 år</p>
          <p className="text-2xl font-bold text-blue-600">
            {formatPercent(results.roi10Year)}
          </p>
        </div>
        <div className="p-4 text-center">
          <p className="text-sm text-gray-500">Avkastning 15 år</p>
          <p className="text-2xl font-bold text-blue-600">
            {formatPercent(results.roi15Year)}
          </p>
        </div>
      </div>

      {/* Battery specs (expandable) */}
      <details className="border-t">
        <summary className="px-6 py-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between">
          <span className="font-medium text-gray-700">Batteridetaljer</span>
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </summary>
        <div className="px-6 pb-6 grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Kapacitet</p>
            <p className="font-medium">{currentBattery.capacityKwh} kWh</p>
          </div>
          <div>
            <p className="text-gray-500">Max urladdning</p>
            <p className="font-medium">{currentBattery.maxDischargeKw} kW</p>
          </div>
          <div>
            <p className="text-gray-500">Max laddning</p>
            <p className="font-medium">{currentBattery.maxChargeKw} kW</p>
          </div>
          <div>
            <p className="text-gray-500">Laddningseffektivitet</p>
            <p className="font-medium">{formatPercent(currentBattery.chargeEfficiency)}</p>
          </div>
          <div>
            <p className="text-gray-500">Urladdningseffektivitet</p>
            <p className="font-medium">{formatPercent(currentBattery.dischargeEfficiency)}</p>
          </div>
          <div>
            <p className="text-gray-500">Garanti</p>
            <p className="font-medium">{currentBattery.warrantyYears} år</p>
          </div>
          <div>
            <p className="text-gray-500">Garanterade cykler</p>
            <p className="font-medium">{currentBattery.guaranteedCycles.toLocaleString('sv-SE')}</p>
          </div>
          <div>
            <p className="text-gray-500">Degradering/år</p>
            <p className="font-medium">{formatPercent(currentBattery.degradationPerYear)}</p>
          </div>
        </div>
      </details>

      {/* Pricing (product cost only, NO margin per CONTEXT.md) */}
      <div className="border-t p-6 bg-gray-50">
        <h3 className="font-medium text-gray-900 mb-3">Kostnad</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Pris exkl. moms</span>
            <span className="font-medium">{formatSek(currentBattery.totalPriceExVat)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Pris inkl. moms</span>
            <span className="font-medium">{formatSek(currentBattery.totalPriceIncVat)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t">
            <span className="text-gray-900 font-medium">Efter Grön Teknik-avdrag (48.5%)</span>
            <span className="text-lg font-bold text-green-600">
              {formatSek(currentBattery.costAfterGronTeknik)}
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
