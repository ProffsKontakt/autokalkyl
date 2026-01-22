'use client'

/**
 * Auto-save hook for the calculation wizard.
 *
 * Watches wizard store state and automatically saves to the server
 * with a 2-second debounce. Deduplicates saves by comparing state hashes.
 */

import { useEffect, useRef, useCallback } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { useCalculationWizardStore } from '@/stores/calculation-wizard-store'
import { saveDraft } from '@/actions/calculations'

/**
 * Hook options for auto-save.
 */
interface UseAutoSaveOptions {
  /** Organization ID for Super Admin creating calculations for other orgs */
  orgId?: string
}

/**
 * Hook return type for auto-save functionality.
 */
interface UseAutoSaveReturn {
  /** Timestamp of last successful save */
  lastSavedAt: Date | null
  /** Whether a save is currently in progress */
  isSaving: boolean
  /** Force an immediate save (flushes debounce) */
  saveNow: () => Promise<void>
}

/**
 * Auto-save hook that monitors wizard state and saves to server.
 *
 * Features:
 * - 2-second debounce to batch rapid changes
 * - State hash comparison to avoid duplicate saves
 * - Skips save if required fields are missing
 * - Flushes pending save on unmount
 *
 * @example
 * ```tsx
 * function WizardForm() {
 *   const { lastSavedAt, isSaving } = useAutoSave()
 *
 *   return (
 *     <div>
 *       {isSaving && <span>Saving...</span>}
 *       {lastSavedAt && <span>Saved at {lastSavedAt.toLocaleTimeString()}</span>}
 *     </div>
 *   )
 * }
 * ```
 */
export function useAutoSave(options: UseAutoSaveOptions = {}): UseAutoSaveReturn {
  const { orgId } = options
  const {
    calculationId,
    customerName,
    postalCode,
    elomrade,
    natagareId,
    annualConsumptionKwh,
    consumptionProfile,
    batteries,
    lastSavedAt,
    markSaved,
    setSaving,
  } = useCalculationWizardStore()

  const isFirstRender = useRef(true)
  const lastSaveAttempt = useRef<string>('')

  const performSave = useCallback(async () => {
    // Don't save if missing required fields
    if (!customerName || !elomrade || !natagareId) {
      return
    }

    // Create a hash of current state to avoid duplicate saves
    const stateHash = JSON.stringify({
      calculationId,
      customerName,
      postalCode,
      elomrade,
      natagareId,
      annualConsumptionKwh,
      consumptionProfile,
      batteries,
      orgId,
    })

    // Skip if state hasn't changed since last save
    if (stateHash === lastSaveAttempt.current) {
      return
    }

    lastSaveAttempt.current = stateHash
    setSaving(true)

    try {
      const result = await saveDraft({
        calculationId,
        customerName,
        postalCode: postalCode || undefined,
        elomrade,
        natagareId,
        annualConsumptionKwh,
        consumptionProfile,
        batteries: batteries.map(b => ({
          configId: b.configId,
          totalPriceExVat: b.totalPriceExVat,
          installationCost: b.installationCost,
        })),
        // Include orgId for Super Admin (optional for regular users)
        orgId,
      })

      if (result.calculationId) {
        markSaved(result.calculationId)
      } else if (result.error) {
        console.error('Auto-save error:', result.error)
        setSaving(false)
      }
    } catch (error) {
      console.error('Auto-save failed:', error)
      setSaving(false)
    }
  }, [
    calculationId,
    customerName,
    postalCode,
    elomrade,
    natagareId,
    annualConsumptionKwh,
    consumptionProfile,
    batteries,
    orgId,
    markSaved,
    setSaving,
  ])

  const debouncedSave = useDebouncedCallback(performSave, 2000)

  // Watch for changes and trigger debounced save
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    debouncedSave()
  }, [
    customerName,
    postalCode,
    elomrade,
    natagareId,
    annualConsumptionKwh,
    consumptionProfile,
    batteries,
    debouncedSave,
  ])

  // Force save on unmount (flush debounce)
  useEffect(() => {
    return () => {
      debouncedSave.flush()
    }
  }, [debouncedSave])

  return {
    lastSavedAt,
    isSaving: useCalculationWizardStore(state => state.isSaving),
    saveNow: performSave,
  }
}
