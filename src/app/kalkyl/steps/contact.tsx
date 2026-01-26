'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { UserIcon, EnvelopeIcon, PhoneIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'
import { useLeadWizardStore } from '@/stores/lead-wizard-store'
import { createLead, type CreateLeadInput } from '@/actions/leads'

export function ContactStep() {
  const { data, updateData, nextStep, setLeadId, setCalculationResults } = useLeadWizardStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isValid =
    data.name.length >= 2 &&
    data.email.includes('@') &&
    data.email.includes('.') &&
    data.gdprConsent

  const handleSubmit = async () => {
    if (!isValid || isSubmitting) return

    setIsSubmitting(true)
    setError(null)

    try {
      // Calculate simple results for display
      const estimatedSavings = calculateEstimatedSavings()
      setCalculationResults(estimatedSavings)

      // Create lead
      const leadData: CreateLeadInput = {
        name: data.name,
        email: data.email,
        phone: data.phone || undefined,
        propertyType: data.propertyType!,
        postalCode: data.postalCode,
        elomrade: data.elomrade!,
        annualKwh: data.annualKwh,
        hasExistingSolar: data.hasExistingSolar,
        interestType: data.interestType!,
        budget: data.budget || undefined,
        timeline: data.timeline || undefined,
        calculationSnapshot: estimatedSavings,
        source: typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('utm_source') || undefined : undefined,
      }

      const result = await createLead(leadData)

      if (result.error) {
        setError(result.error)
        return
      }

      if (result.leadId) {
        setLeadId(result.leadId)
        nextStep()
      }
    } catch (err) {
      console.error('Failed to submit lead:', err)
      setError('Något gick fel. Vänligen försök igen.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Simple estimation based on consumption and interest type
  const calculateEstimatedSavings = () => {
    const kwhPerYear = data.annualKwh
    const avgPricePerKwh = 1.5 // SEK/kWh average
    const batteryCapacity = Math.ceil(kwhPerYear / 5000) * 5 // Scale with consumption
    const batteryCost = batteryCapacity * 12000 // ~12000 SEK per kWh capacity
    const solarCost = kwhPerYear * 10 // Rough estimate
    const gronTeknikDeduction = 0.5

    let estimatedCost = 0
    let annualSavings = 0
    let recommendedCapacity = batteryCapacity

    if (data.interestType === 'BATTERY') {
      estimatedCost = batteryCost
      annualSavings = kwhPerYear * 0.3 * avgPricePerKwh // 30% savings estimate
    } else if (data.interestType === 'SOLAR') {
      estimatedCost = solarCost
      annualSavings = kwhPerYear * 0.5 * avgPricePerKwh // 50% of consumption self-produced
      recommendedCapacity = Math.ceil(kwhPerYear / 1000) // kWp
    } else {
      estimatedCost = batteryCost + solarCost * 0.8
      annualSavings = kwhPerYear * 0.6 * avgPricePerKwh // 60% combined savings
    }

    const costAfterDeduction = estimatedCost * (1 - gronTeknikDeduction)
    const paybackYears = costAfterDeduction / annualSavings

    return {
      estimatedSavingsPerYear: Math.round(annualSavings),
      paybackYears: Math.round(paybackYears * 10) / 10,
      roi10Year: Math.round(((annualSavings * 10 - costAfterDeduction) / costAfterDeduction) * 100),
      recommendedCapacityKwh: recommendedCapacity,
      estimatedCostBeforeDeduction: Math.round(estimatedCost),
      estimatedCostAfterDeduction: Math.round(costAfterDeduction),
    }
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Nästan klart!
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Fyll i dina kontaktuppgifter för att se din kalkyl
        </p>
      </div>

      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Namn *
          </label>
          <div className="relative">
            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={data.name}
              onChange={(e) => updateData({ name: e.target.value })}
              placeholder="Förnamn Efternamn"
              className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-0 transition-colors"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            E-post *
          </label>
          <div className="relative">
            <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="email"
              value={data.email}
              onChange={(e) => updateData({ email: e.target.value })}
              placeholder="din@email.se"
              className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-0 transition-colors"
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Telefon (valfritt)
          </label>
          <div className="relative">
            <PhoneIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="tel"
              value={data.phone}
              onChange={(e) => updateData({ phone: e.target.value })}
              placeholder="070-123 45 67"
              className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-0 transition-colors"
            />
          </div>
        </div>

        {/* GDPR consent */}
        <motion.label
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 dark:bg-slate-800/50 cursor-pointer"
        >
          <input
            type="checkbox"
            checked={data.gdprConsent}
            onChange={(e) => updateData({ gdprConsent: e.target.checked })}
            className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <div className="flex-1">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Jag godkänner att mina uppgifter behandlas enligt{' '}
              <a href="/integritetspolicy" className="text-blue-600 hover:underline" target="_blank">
                integritetspolicyn
              </a>{' '}
              och att upp till 6 företag kan kontakta mig med offerter. *
            </p>
          </div>
        </motion.label>
      </div>

      {/* Trust signals */}
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <ShieldCheckIcon className="h-5 w-5 text-green-500" />
        <span>Dina uppgifter är skyddade och delas endast med matchade företag</span>
      </div>

      {/* Error message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
        >
          {error}
        </motion.div>
      )}

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={!isValid || isSubmitting}
        className="w-full py-4 px-6 text-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Beräknar...
          </>
        ) : (
          'Visa min kalkyl'
        )}
      </button>
    </div>
  )
}
