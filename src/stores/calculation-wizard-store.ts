'use client'

/**
 * Zustand store for calculation wizard state management.
 *
 * Provides state persistence across browser refresh via localStorage
 * and actions for managing all wizard steps.
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Elomrade, ConsumptionProfile } from '@/lib/calculations/types'
import {
  createEmptyProfile,
  applyPreset,
  SYSTEM_PRESETS,
  calculateProfileTotal,
  scaleProfileToTotal,
} from '@/lib/calculations/presets'
import {
  DEFAULT_ANNUAL_CONSUMPTION_KWH,
  DEFAULT_CYCLES_PER_DAY,
  DEFAULT_POST_CAMPAIGN_RATE,
} from '@/lib/calculations/constants'

/**
 * Battery selection in the wizard.
 * Each battery can have custom pricing.
 */
interface BatterySelection {
  configId: string
  totalPriceExVat: number
  installationCost: number
}

/**
 * Complete wizard state including form data and UI state.
 */
interface WizardState {
  // Step tracking
  currentStep: number
  calculationId: string | null
  isDraft: boolean
  lastSavedAt: Date | null
  isSaving: boolean

  // Step 1: Customer Info
  customerName: string
  postalCode: string
  elomrade: Elomrade | null
  natagareId: string | null
  annualConsumptionKwh: number

  // Step 2: Consumption Profile
  consumptionProfile: ConsumptionProfile

  // Step 3: Battery Selection (supports multiple for comparison)
  batteries: BatterySelection[]

  // Phase 6: Calculation controls
  cyclesPerDay: number
  peakShavingPercent: number
  postCampaignRate: number

  // Phase 7: Override state (OVRD-01, OVRD-02)
  overrides: {
    spotprisSavingsSek: number | null
    stodtjansterIncomeSek: number | null
    effectTariffSavingsSek: number | null
    cyclesPerDay: number | null
    peakShavingPercent: number | null
    postCampaignRate: number | null
    spreadOre: number | null
    tariffRateSekKw: number | null
  }

  // Actions
  setStep: (step: number) => void
  updateCustomerInfo: (data: Partial<{
    customerName: string
    postalCode: string
    elomrade: Elomrade | null
    natagareId: string | null
    annualConsumptionKwh: number
  }>) => void
  updateConsumptionHour: (month: number, hour: number, value: number) => void
  applyPresetToProfile: (presetId: string) => void
  copyMonthPattern: (fromMonth: number, toMonths: number[]) => void
  scaleProfileToAnnual: () => void
  addBattery: (battery: BatterySelection) => void
  removeBattery: (index: number) => void
  updateBatteryPricing: (index: number, data: Partial<{ totalPriceExVat: number; installationCost: number }>) => void
  updateCyclesPerDay: (cycles: number) => void
  updatePeakShavingPercent: (percent: number) => void
  updatePostCampaignRate: (rate: number) => void
  setOverride: (key: keyof typeof initialState.overrides, value: number | null) => void
  clearAllOverrides: () => void
  hasAnyOverride: () => boolean
  markSaved: (calculationId: string) => void
  setSaving: (isSaving: boolean) => void
  loadFromServer: (data: {
    calculationId: string
    customerName: string
    postalCode: string | null
    elomrade: Elomrade
    natagareId: string
    annualConsumptionKwh: number
    consumptionProfile: ConsumptionProfile
    batteries: BatterySelection[]
  }) => void
  reset: () => void
}

/**
 * Initial state values for the wizard.
 */
const initialState = {
  currentStep: 0,
  calculationId: null as string | null,
  isDraft: true,
  lastSavedAt: null as Date | null,
  isSaving: false,
  customerName: '',
  postalCode: '',
  elomrade: null as Elomrade | null,
  natagareId: null as string | null,
  annualConsumptionKwh: DEFAULT_ANNUAL_CONSUMPTION_KWH,
  consumptionProfile: { data: createEmptyProfile() } as ConsumptionProfile,
  batteries: [] as BatterySelection[],
  cyclesPerDay: DEFAULT_CYCLES_PER_DAY,
  peakShavingPercent: 50,
  postCampaignRate: DEFAULT_POST_CAMPAIGN_RATE,
  overrides: {
    spotprisSavingsSek: null,
    stodtjansterIncomeSek: null,
    effectTariffSavingsSek: null,
    cyclesPerDay: null,
    peakShavingPercent: null,
    postCampaignRate: null,
    spreadOre: null,
    tariffRateSekKw: null,
  },
}

/**
 * Zustand store with localStorage persistence.
 *
 * Persists form data but not UI state (isSaving, lastSavedAt persisted for display).
 */
export const useCalculationWizardStore = create<WizardState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setStep: (step) => set({ currentStep: step }),

      updateCustomerInfo: (data) => set((state) => ({ ...state, ...data })),

      updateConsumptionHour: (month, hour, value) => set((state) => {
        const newData = state.consumptionProfile.data.map((m, mi) =>
          mi === month ? m.map((h, hi) => (hi === hour ? value : h)) : [...m]
        )
        return { consumptionProfile: { data: newData } }
      }),

      applyPresetToProfile: (presetId) => set((state) => {
        const preset = SYSTEM_PRESETS.find(p => p.id === presetId)
        if (!preset) return state
        const newProfile = applyPreset(preset, state.annualConsumptionKwh)
        return { consumptionProfile: { data: newProfile } }
      }),

      copyMonthPattern: (fromMonth, toMonths) => set((state) => {
        const sourcePattern = state.consumptionProfile.data[fromMonth]
        const newData = state.consumptionProfile.data.map((month, index) =>
          toMonths.includes(index) ? [...sourcePattern] : [...month]
        )
        return { consumptionProfile: { data: newData } }
      }),

      scaleProfileToAnnual: () => set((state) => {
        const currentTotal = calculateProfileTotal(state.consumptionProfile.data)
        if (currentTotal === 0) return state
        const scaledData = scaleProfileToTotal(
          state.consumptionProfile.data,
          state.annualConsumptionKwh
        )
        return { consumptionProfile: { data: scaledData } }
      }),

      addBattery: (battery) => set((state) => ({
        batteries: [...state.batteries, battery]
      })),

      removeBattery: (index) => set((state) => ({
        batteries: state.batteries.filter((_, i) => i !== index)
      })),

      updateBatteryPricing: (index, data) => set((state) => ({
        batteries: state.batteries.map((b, i) =>
          i === index ? { ...b, ...data } : b
        )
      })),

      updateCyclesPerDay: (cycles) => set({ cyclesPerDay: cycles }),
      updatePeakShavingPercent: (percent) => set({ peakShavingPercent: percent }),
      updatePostCampaignRate: (rate) => set({ postCampaignRate: rate }),

      setOverride: (key, value) => set((state) => ({
        overrides: { ...state.overrides, [key]: value }
      })),

      clearAllOverrides: () => set({
        overrides: {
          spotprisSavingsSek: null,
          stodtjansterIncomeSek: null,
          effectTariffSavingsSek: null,
          cyclesPerDay: null,
          peakShavingPercent: null,
          postCampaignRate: null,
          spreadOre: null,
          tariffRateSekKw: null,
        }
      }),

      hasAnyOverride: () => {
        const state = get()
        return Object.values(state.overrides).some(v => v !== null)
      },

      markSaved: (calculationId) => set({
        calculationId,
        lastSavedAt: new Date(),
        isSaving: false,
      }),

      setSaving: (isSaving) => set({ isSaving }),

      loadFromServer: (data) => set({
        calculationId: data.calculationId,
        customerName: data.customerName,
        postalCode: data.postalCode || '',
        elomrade: data.elomrade,
        natagareId: data.natagareId,
        annualConsumptionKwh: data.annualConsumptionKwh,
        consumptionProfile: data.consumptionProfile,
        batteries: data.batteries,
        isDraft: true,
        lastSavedAt: new Date(),
      }),

      reset: () => set({
        ...initialState,
        consumptionProfile: { data: createEmptyProfile() },
        cyclesPerDay: 1.5, // Standard daily cycling
        peakShavingPercent: 50,
        postCampaignRate: DEFAULT_POST_CAMPAIGN_RATE,
        overrides: {
          spotprisSavingsSek: null,
          stodtjansterIncomeSek: null,
          effectTariffSavingsSek: null,
          cyclesPerDay: null,
          peakShavingPercent: null,
          postCampaignRate: null,
          spreadOre: null,
          tariffRateSekKw: null,
        },
      }),
    }),
    {
      name: 'kalkyla-wizard-draft-v2', // Bumped version to reset cached values
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist form data, not transient UI state
        calculationId: state.calculationId,
        customerName: state.customerName,
        postalCode: state.postalCode,
        elomrade: state.elomrade,
        natagareId: state.natagareId,
        annualConsumptionKwh: state.annualConsumptionKwh,
        consumptionProfile: state.consumptionProfile,
        batteries: state.batteries,
        currentStep: state.currentStep,
        cyclesPerDay: state.cyclesPerDay,
        peakShavingPercent: state.peakShavingPercent,
        postCampaignRate: state.postCampaignRate,
        overrides: state.overrides,
      }),
    }
  )
)
