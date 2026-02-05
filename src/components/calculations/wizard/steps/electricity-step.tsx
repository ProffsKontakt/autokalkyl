'use client'

/**
 * Electricity input step (Step 2) of the calculation wizard.
 *
 * Collects:
 * - Customer type (Privatperson / Foretag)
 * - Kopt el (purchased electricity) in kWh/year
 * - Electricity price in ore/kWh
 * - Solar production and self-consumption (optional)
 *
 * Phase 15: Customer Type & Electricity Inputs
 */

import { useState } from 'react'
import { useCalculationWizardStore } from '@/stores/calculation-wizard-store'
import { suggestSelfConsumption, validateSolarInputs } from '@/lib/calculations/solar-consumption'
import { oreToSek, sekToOre } from '@/lib/calculations/unit-conversions'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec']

export function ElectricityStep() {
  const {
    customerType,
    koptElKwh,
    koptElInputMode,
    koptElMonthly,
    electricityPriceOreKwh,
    electricityPriceInputMode,
    electricityPriceMonthly,
    hasSolar,
    solarProductionKwh,
    solarProductionInputMode,
    solarProductionMonthly,
    currentSelfConsumptionKwh,
    projectedSelfConsumptionKwh,
    selfConsumptionInputMode,
    updateCustomerType,
    updateKoptEl,
    toggleKoptElInputMode,
    updateKoptElMonthly,
    updateElectricityPrice,
    toggleElectricityPriceInputMode,
    updateElectricityPriceMonthly,
    toggleHasSolar,
    updateSolarProduction,
    toggleSolarProductionInputMode,
    updateSolarProductionMonthly,
    updateCurrentSelfConsumption,
    updateProjectedSelfConsumption,
    toggleSelfConsumptionInputMode,
  } = useCalculationWizardStore()

  // Local UI state for unit display
  const [priceUnit, setPriceUnit] = useState<'ore' | 'sek'>('ore')

  // Handle price unit toggle - convert displayed value
  const handlePriceUnitToggle = (newUnit: 'ore' | 'sek') => {
    setPriceUnit(newUnit)
    // Note: Store always holds ore/kWh - this just affects display
  }

  // Get displayed price value based on current unit
  const getDisplayPrice = (oreValue: number): string => {
    if (oreValue === 0) return ''
    if (priceUnit === 'sek') {
      return oreToSek(oreValue).toFixed(2)
    }
    return oreValue.toString()
  }

  // Handle price input change
  const handlePriceChange = (value: string) => {
    const numValue = parseFloat(value) || 0
    if (priceUnit === 'sek') {
      // Convert SEK to ore for storage
      updateElectricityPrice(sekToOre(numValue).toNumber())
    } else {
      updateElectricityPrice(numValue)
    }
  }

  // Suggest self-consumption when solar production changes
  const handleSolarProductionChange = (kwh: number) => {
    updateSolarProduction(kwh)
    // Auto-suggest self-consumption values if not already set
    if (kwh > 0 && currentSelfConsumptionKwh === null) {
      const suggested = suggestSelfConsumption(kwh)
      updateCurrentSelfConsumption(suggested.currentKwh)
      updateProjectedSelfConsumption(suggested.projectedKwh)
    }
  }

  // Validate solar inputs for warnings
  const solarValidation = hasSolar && solarProductionKwh && currentSelfConsumptionKwh !== null && projectedSelfConsumptionKwh !== null
    ? validateSolarInputs({
        totalProductionKwh: solarProductionKwh,
        currentSelfConsumptionKwh: currentSelfConsumptionKwh,
        projectedSelfConsumptionKwh: projectedSelfConsumptionKwh,
      })
    : null

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        Elforbrukning & Elpris
      </h2>

      <div className="space-y-8">
        {/* Customer Type */}
        <div>
          <label htmlFor="customerType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Kundtyp *
          </label>
          <select
            id="customerType"
            value={customerType}
            onChange={(e) => updateCustomerType(e.target.value as 'PRIVATPERSON' | 'FORETAG')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          >
            <option value="PRIVATPERSON">Privatperson</option>
            <option value="FORETAG">Foretag</option>
          </select>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {customerType === 'FORETAG'
              ? 'Foretag: Priser visas utan moms (25%)'
              : 'Privatperson: Priser visas inklusive moms (25%)'}
          </p>
        </div>

        {/* Kopt el */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label htmlFor="koptEl" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Kopt el (kWh/ar) *
            </label>
            <button
              type="button"
              onClick={toggleKoptElInputMode}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              {koptElInputMode === 'annual' ? 'Visa manadsfordelning' : 'Visa arsvardet'}
            </button>
          </div>

          {koptElInputMode === 'annual' ? (
            <input
              id="koptEl"
              type="number"
              value={koptElKwh || ''}
              onChange={(e) => updateKoptEl(parseFloat(e.target.value) || 0)}
              placeholder="t.ex. 20000"
              min={0}
              max={100000}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            />
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {MONTHS.map((month, i) => (
                <div key={month}>
                  <label className="text-xs text-gray-500 dark:text-gray-400">{month}</label>
                  <input
                    type="number"
                    value={koptElMonthly[i] || ''}
                    onChange={(e) => updateKoptElMonthly(i, parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md text-gray-900 bg-white focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  />
                </div>
              ))}
            </div>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total forbrukning fran elnavet (hittas pa elfaktura eller hos elbolaget)
          </p>
        </div>

        {/* Electricity Price */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label htmlFor="electricityPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Elpris *
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handlePriceUnitToggle('ore')}
                className={`px-2 py-1 text-xs rounded ${priceUnit === 'ore' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400'}`}
              >
                ore/kWh
              </button>
              <button
                type="button"
                onClick={() => handlePriceUnitToggle('sek')}
                className={`px-2 py-1 text-xs rounded ${priceUnit === 'sek' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400'}`}
              >
                kr/kWh
              </button>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <button
                type="button"
                onClick={toggleElectricityPriceInputMode}
                className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                {electricityPriceInputMode === 'annual' ? 'Manadsvis' : 'Arssnitt'}
              </button>
            </div>
          </div>

          {electricityPriceInputMode === 'annual' ? (
            <input
              id="electricityPrice"
              type="number"
              value={getDisplayPrice(electricityPriceOreKwh)}
              onChange={(e) => handlePriceChange(e.target.value)}
              placeholder={priceUnit === 'ore' ? 't.ex. 150' : 't.ex. 1.50'}
              step={priceUnit === 'sek' ? '0.01' : '1'}
              min={0}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            />
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {MONTHS.map((month, i) => (
                <div key={month}>
                  <label className="text-xs text-gray-500 dark:text-gray-400">{month}</label>
                  <input
                    type="number"
                    value={electricityPriceMonthly[i] || ''}
                    onChange={(e) => updateElectricityPriceMonthly(i, parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md text-gray-900 bg-white focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  />
                </div>
              ))}
            </div>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Totalpris per kWh inklusive alla avgifter. Typiskt intervall: 50-200 ore/kWh
          </p>
        </div>

        {/* Solar Toggle */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={hasSolar}
              onChange={toggleHasSolar}
              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
            />
            <span className="font-medium text-gray-900 dark:text-white">
              Har solceller?
            </span>
          </label>
        </div>

        {/* Solar Section - Conditional */}
        {hasSolar && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg space-y-6 border border-yellow-200 dark:border-yellow-800">
            <h3 className="font-medium text-yellow-900 dark:text-yellow-100">
              Solcellsproduktion
            </h3>

            {/* Total Solar Production */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Total solproduktion (kWh/ar) *
                </label>
                <button
                  type="button"
                  onClick={toggleSolarProductionInputMode}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  {solarProductionInputMode === 'annual' ? 'Manadsvis' : 'Arsvardet'}
                </button>
              </div>

              {solarProductionInputMode === 'annual' ? (
                <input
                  type="number"
                  value={solarProductionKwh ?? ''}
                  onChange={(e) => handleSolarProductionChange(parseFloat(e.target.value) || 0)}
                  placeholder="t.ex. 10000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {MONTHS.map((month, i) => (
                    <div key={month}>
                      <label className="text-xs text-gray-500 dark:text-gray-400">{month}</label>
                      <input
                        type="number"
                        value={solarProductionMonthly?.[i] ?? ''}
                        onChange={(e) => updateSolarProductionMonthly(i, parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md text-gray-900 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Self-Consumption Mode Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Ange egenanvandning i:</span>
              <button
                type="button"
                onClick={toggleSelfConsumptionInputMode}
                className={`px-2 py-1 text-xs rounded ${selfConsumptionInputMode === 'kwh' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400'}`}
              >
                kWh
              </button>
              <button
                type="button"
                onClick={toggleSelfConsumptionInputMode}
                className={`px-2 py-1 text-xs rounded ${selfConsumptionInputMode === 'percent' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400'}`}
              >
                %
              </button>
            </div>

            {/* Current Self-Consumption */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Nuvarande egenanvandning {selfConsumptionInputMode === 'kwh' ? '(kWh/ar)' : '(%)'} *
              </label>
              <input
                type="number"
                value={currentSelfConsumptionKwh ?? ''}
                onChange={(e) => updateCurrentSelfConsumption(parseFloat(e.target.value) || 0)}
                placeholder={selfConsumptionInputMode === 'kwh' ? 't.ex. 3000' : 't.ex. 30'}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Hur mycket av solelen som anvands direkt i huset (utan batteri, typiskt 25-40%)
              </p>
            </div>

            {/* Projected Self-Consumption */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Beraknad egenanvandning med batteri {selfConsumptionInputMode === 'kwh' ? '(kWh/ar)' : '(%)'} *
              </label>
              <input
                type="number"
                value={projectedSelfConsumptionKwh ?? ''}
                onChange={(e) => updateProjectedSelfConsumption(parseFloat(e.target.value) || 0)}
                placeholder={selfConsumptionInputMode === 'kwh' ? 't.ex. 7500' : 't.ex. 75'}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Hur mycket solel som kan anvandas med batteri (typiskt 60-90%)
              </p>
            </div>

            {/* Validation Warnings */}
            {solarValidation && solarValidation.warnings.length > 0 && (
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/40 rounded-lg">
                <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
                  {solarValidation.warnings.map((warning, i) => (
                    <li key={i}>* {warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {solarValidation && solarValidation.errors.length > 0 && (
              <div className="p-3 bg-red-100 dark:bg-red-900/40 rounded-lg">
                <ul className="text-sm text-red-800 dark:text-red-200 space-y-1">
                  {solarValidation.errors.map((error, i) => (
                    <li key={i}>x {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Summary Card */}
        {koptElKwh > 0 && (
          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">Sammanfattning</h3>
            <dl className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <div className="flex justify-between">
                <dt>Kundtyp:</dt>
                <dd className="font-medium">{customerType === 'PRIVATPERSON' ? 'Privatperson' : 'Foretag'}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Kopt el:</dt>
                <dd className="font-medium">{koptElKwh.toLocaleString('sv-SE')} kWh/ar</dd>
              </div>
              {electricityPriceOreKwh > 0 && (
                <div className="flex justify-between">
                  <dt>Elpris:</dt>
                  <dd className="font-medium">{electricityPriceOreKwh.toFixed(0)} ore/kWh</dd>
                </div>
              )}
              {hasSolar && solarProductionKwh && (
                <>
                  <div className="flex justify-between">
                    <dt>Solproduktion:</dt>
                    <dd className="font-medium">{solarProductionKwh.toLocaleString('sv-SE')} kWh/ar</dd>
                  </div>
                  {currentSelfConsumptionKwh !== null && solarProductionKwh > 0 && (
                    <div className="flex justify-between">
                      <dt>Nuvarande egenanv.:</dt>
                      <dd className="font-medium">
                        {currentSelfConsumptionKwh.toLocaleString('sv-SE')} kWh ({((currentSelfConsumptionKwh / solarProductionKwh) * 100).toFixed(0)}%)
                      </dd>
                    </div>
                  )}
                </>
              )}
            </dl>
          </div>
        )}
      </div>
    </div>
  )
}
