'use client'

import { useState } from 'react'
import { useCalculationWizardStore } from '@/stores/calculation-wizard-store'

interface BatteryOption {
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

interface BatteryStepProps {
  batteryList: BatteryOption[]
  orgSettings?: {
    isProffsKontaktAffiliated: boolean
    installerFixedCut: number | null
  }
}

export function BatteryStep({ batteryList, orgSettings }: BatteryStepProps) {
  const { batteries, addBattery, removeBattery, updateBatteryPricing } = useCalculationWizardStore()
  const [selectedBatteryId, setSelectedBatteryId] = useState<string>('')

  const handleAddBattery = () => {
    if (!selectedBatteryId) return
    const battery = batteryList.find(b => b.id === selectedBatteryId)
    if (!battery) return

    // Check if already added
    if (batteries.some(b => b.configId === selectedBatteryId)) {
      return
    }

    // Max 4 batteries for comparison
    if (batteries.length >= 4) {
      return
    }

    addBattery({
      configId: selectedBatteryId,
      totalPriceExVat: 0,
      installationCost: 0,
    })
    setSelectedBatteryId('')
  }

  const getBatteryInfo = (configId: string) => {
    return batteryList.find(b => b.id === configId)
  }

  const formatSek = (n: number) =>
    n.toLocaleString('sv-SE', { maximumFractionDigits: 0 }) + ' kr'

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Valj batteri</h2>
      <p className="text-sm text-gray-600 mb-6">
        Valj ett eller flera batterier for att jamfora (max 4).
      </p>

      {/* Battery selector */}
      <div className="flex gap-2 mb-6">
        <select
          value={selectedBatteryId}
          onChange={(e) => setSelectedBatteryId(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
          disabled={batteries.length >= 4}
        >
          <option value="">Valj batteri...</option>
          {batteryList
            .filter(b => !batteries.some(sel => sel.configId === b.id))
            .map((b) => (
              <option key={b.id} value={b.id}>
                {b.brandName} {b.name} - {b.capacityKwh} kWh
              </option>
            ))}
        </select>
        <button
          type="button"
          onClick={handleAddBattery}
          disabled={!selectedBatteryId || batteries.length >= 4}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Lagg till
        </button>
      </div>

      {/* Selected batteries */}
      {batteries.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Inga batterier valda.</p>
          <p className="text-sm text-gray-400 mt-1">
            Valj minst ett batteri for att fortsatta.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {batteries.map((selected, index) => {
            const info = getBatteryInfo(selected.configId)
            if (!info) return null

            return (
              <div
                key={selected.configId}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {info.brandName} {info.name}
                    </h3>
                    <div className="text-sm text-gray-500 mt-1 space-x-4">
                      <span>{info.capacityKwh} kWh</span>
                      <span>{info.maxDischargeKw} kW uteffekt</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeBattery(index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Ta bort
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Total price ex VAT */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Totalpris ex. moms (SEK) *
                    </label>
                    <input
                      type="number"
                      value={selected.totalPriceExVat || ''}
                      onChange={(e) =>
                        updateBatteryPricing(index, {
                          totalPriceExVat: Number(e.target.value),
                        })
                      }
                      placeholder="0"
                      min={0}
                      step={1000}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Inkl. batteri, vaxelriktare, installation
                    </p>
                  </div>

                  {/* Installation cost */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Installationskostnad (SEK)
                    </label>
                    <input
                      type="number"
                      value={selected.installationCost || ''}
                      onChange={(e) =>
                        updateBatteryPricing(index, {
                          installationCost: Number(e.target.value),
                        })
                      }
                      placeholder="0"
                      min={0}
                      step={1000}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Om separat fran totalpris
                    </p>
                  </div>
                </div>

                {/* Price summary */}
                {selected.totalPriceExVat > 0 && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-md">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Totalt ex. moms:</span>
                        <span className="font-medium">
                          {formatSek(selected.totalPriceExVat + selected.installationCost)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Totalt inkl. moms (25%):</span>
                        <span className="font-medium">
                          {formatSek((selected.totalPriceExVat + selected.installationCost) * 1.25)}
                        </span>
                      </div>
                      <div className="flex justify-between col-span-2 pt-2 border-t">
                        <span className="text-gray-600">Efter Gron Teknik (48.5%):</span>
                        <span className="font-medium text-green-600">
                          {formatSek(
                            (selected.totalPriceExVat + selected.installationCost) * 1.25 * (1 - 0.485)
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Margin info for ProffsKontakt affiliates */}
                    {orgSettings?.isProffsKontaktAffiliated && orgSettings.installerFixedCut && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Din provision (installatorsarvode):</span>
                          <span className="font-medium text-blue-600">
                            {formatSek(orgSettings.installerFixedCut)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Comparison hint */}
      {batteries.length > 1 && (
        <p className="text-sm text-blue-600 mt-4">
          {batteries.length} batterier valda - jamforelse visas i resultatsteget.
        </p>
      )}
    </div>
  )
}
