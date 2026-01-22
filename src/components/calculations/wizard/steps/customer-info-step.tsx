'use client'

/**
 * Customer info step (Step 1) of the calculation wizard.
 *
 * Collects:
 * - Customer name
 * - Postal code (optional, used for elomrade auto-detection)
 * - Elomrade (SE1-SE4)
 * - Natagare (grid operator)
 * - Annual consumption in kWh
 */

import Link from 'next/link'
import { Plus } from 'lucide-react'
import { useCalculationWizardStore } from '@/stores/calculation-wizard-store'
import { lookupElomrade, isValidSwedishPostalCode } from '@/lib/calculations/elomrade-lookup'
import type { Elomrade } from '@/lib/calculations/types'

interface CustomerInfoStepProps {
  natagareList: Array<{ id: string; name: string; dayRateSekKw: number; nightRateSekKw: number }>
}

const ELOMRADE_OPTIONS: { value: Elomrade; label: string }[] = [
  { value: 'SE1', label: 'SE1 - Norra Sverige (Lulea)' },
  { value: 'SE2', label: 'SE2 - Norra mellansverige (Sundsvall)' },
  { value: 'SE3', label: 'SE3 - Södra mellansverige (Stockholm)' },
  { value: 'SE4', label: 'SE4 - Södra Sverige (Malmö)' },
]

export function CustomerInfoStep({ natagareList }: CustomerInfoStepProps) {
  const {
    customerName,
    postalCode,
    elomrade,
    natagareId,
    annualConsumptionKwh,
    updateCustomerInfo,
  } = useCalculationWizardStore()

  const handlePostalCodeChange = (value: string) => {
    updateCustomerInfo({ postalCode: value })

    // Auto-detect elomrade from postal code
    if (isValidSwedishPostalCode(value)) {
      const detected = lookupElomrade(value)
      if (detected && !elomrade) {
        updateCustomerInfo({ elomrade: detected })
      }
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Kunduppgifter</h2>

      <div className="space-y-6">
        {/* Customer name */}
        <div>
          <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Kundnamn *
          </label>
          <input
            id="customerName"
            type="text"
            value={customerName}
            onChange={(e) => updateCustomerInfo({ customerName: e.target.value })}
            placeholder="t.ex. Anna Andersson"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
          />
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Visas i kalkylen som &quot;Hej [namn], här är din batterikalkyl&quot;
          </p>
        </div>

        {/* Postal code */}
        <div>
          <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Postnummer
          </label>
          <input
            id="postalCode"
            type="text"
            value={postalCode}
            onChange={(e) => handlePostalCodeChange(e.target.value)}
            placeholder="12345"
            maxLength={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
          />
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Elområde detekteras automatiskt från postnummer
          </p>
        </div>

        {/* Elomrade */}
        <div>
          <label htmlFor="elomrade" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Elområde *
          </label>
          <select
            id="elomrade"
            value={elomrade || ''}
            onChange={(e) => updateCustomerInfo({ elomrade: e.target.value as Elomrade })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
          >
            <option value="">Välj elområde...</option>
            {ELOMRADE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Natagare */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="natagare" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Nätägare *
            </label>
            <Link
              href="/dashboard/natagare/new"
              target="_blank"
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Lägg till nätägare
            </Link>
          </div>
          <select
            id="natagare"
            value={natagareId || ''}
            onChange={(e) => updateCustomerInfo({ natagareId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
          >
            <option value="">Välj nätägare...</option>
            {natagareList.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Påverkar effekttariffberäkning
          </p>
        </div>

        {/* Annual consumption */}
        <div>
          <label htmlFor="annualConsumption" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Årlig förbrukning (kWh) *
          </label>
          <input
            id="annualConsumption"
            type="number"
            value={annualConsumptionKwh}
            onChange={(e) => updateCustomerInfo({ annualConsumptionKwh: Number(e.target.value) })}
            min={1}
            step={100}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
          />
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Typiskt villahushåll: 15 000-25 000 kWh/år
          </p>
        </div>

        {/* Summary card */}
        {customerName && elomrade && (
          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">Sammanfattning</h3>
            <dl className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <div className="flex justify-between">
                <dt>Kund:</dt>
                <dd className="font-medium">{customerName}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Elområde:</dt>
                <dd className="font-medium">{elomrade}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Årlig förbrukning:</dt>
                <dd className="font-medium">{annualConsumptionKwh.toLocaleString('sv-SE')} kWh</dd>
              </div>
            </dl>
          </div>
        )}
      </div>
    </div>
  )
}
