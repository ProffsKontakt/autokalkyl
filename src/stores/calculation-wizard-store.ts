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
import type { HeatingType } from '@prisma/client'
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
  heatingType: HeatingType | null

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

  // Phase 11: Peak targets (PEAK-05, PEAK-06)
  targetAveragePeakKw: number | null // User's goal for avg billing peak
  targetMonthlyCeilingKw: number | null // Max peak user wants to maintain
  peakEstimateSource: 'auto' | 'manual' // Track if user overrode auto-estimate

  // Phase 15: Customer Type & Electricity Inputs
  customerType: 'PRIVATPERSON' | 'FORETAG'
  koptElKwh: number
  koptElInputMode: 'annual' | 'monthly'
  koptElMonthly: number[] // 12 months
  electricityPriceOreKwh: number
  electricityPriceInputMode: 'annual' | 'monthly'
  electricityPriceMonthly: number[] // 12 months
  hasSolar: boolean
  solarProductionKwh: number | null
  solarProductionInputMode: 'annual' | 'monthly'
  solarProductionMonthly: number[] | null // 12 months
  currentSelfConsumptionKwh: number | null
  projectedSelfConsumptionKwh: number | null
  selfConsumptionInputMode: 'kwh' | 'percent'

  // Actions
  setStep: (step: number) => void
  updateCustomerInfo: (data: Partial<{
    customerName: string
    postalCode: string
    elomrade: Elomrade | null
    natagareId: string | null
    annualConsumptionKwh: number
    heatingType: HeatingType | null
  }>) => void
  updateHeatingType: (type: HeatingType | null) => void
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
    heatingType?: HeatingType | null
    consumptionProfile: ConsumptionProfile
    batteries: BatterySelection[]
    // Phase 15: Optional electricity inputs (backward compatible)
    customerType?: 'PRIVATPERSON' | 'FORETAG'
    koptElKwh?: number
    electricityPriceOreKwh?: number
    hasSolar?: boolean
    solarProductionKwh?: number | null
    currentSelfConsumptionKwh?: number | null
    projectedSelfConsumptionKwh?: number | null
  }) => void
  reset: () => void

  // Phase 11: Peak target actions
  updateTargetAveragePeakKw: (kw: number | null) => void
  updateTargetMonthlyCeilingKw: (kw: number | null) => void
  setPeakEstimateSource: (source: 'auto' | 'manual') => void

  // Phase 15: Customer Type & Electricity Actions
  updateCustomerType: (type: 'PRIVATPERSON' | 'FORETAG') => void
  updateKoptEl: (kwh: number) => void
  toggleKoptElInputMode: () => void
  updateKoptElMonthly: (month: number, kwh: number) => void
  updateElectricityPrice: (oreKwh: number) => void
  toggleElectricityPriceInputMode: () => void
  updateElectricityPriceMonthly: (month: number, oreKwh: number) => void
  toggleHasSolar: () => void
  updateSolarProduction: (kwh: number | null) => void
  toggleSolarProductionInputMode: () => void
  updateSolarProductionMonthly: (month: number, kwh: number) => void
  updateCurrentSelfConsumption: (kwh: number | null) => void
  updateProjectedSelfConsumption: (kwh: number | null) => void
  toggleSelfConsumptionInputMode: () => void
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
  heatingType: null as HeatingType | null,
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
  // Phase 11: Peak targets
  targetAveragePeakKw: null as number | null,
  targetMonthlyCeilingKw: null as number | null,
  peakEstimateSource: 'auto' as 'auto' | 'manual',

  // Phase 15: Customer Type & Electricity Inputs
  customerType: 'PRIVATPERSON' as const,
  koptElKwh: 0,
  koptElInputMode: 'annual' as const,
  koptElMonthly: Array(12).fill(0) as number[],
  electricityPriceOreKwh: 0, // No default - user must enter
  electricityPriceInputMode: 'annual' as const,
  electricityPriceMonthly: Array(12).fill(0) as number[],
  hasSolar: false,
  solarProductionKwh: null as number | null,
  solarProductionInputMode: 'annual' as const,
  solarProductionMonthly: null as number[] | null,
  currentSelfConsumptionKwh: null as number | null,
  projectedSelfConsumptionKwh: null as number | null,
  selfConsumptionInputMode: 'kwh' as const,
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
      updateHeatingType: (type) => set({ heatingType: type }),

      // Phase 11: Peak target actions
      updateTargetAveragePeakKw: (kw) => set({ targetAveragePeakKw: kw }),
      updateTargetMonthlyCeilingKw: (kw) => set({ targetMonthlyCeilingKw: kw }),
      setPeakEstimateSource: (source) => set({ peakEstimateSource: source }),

      // Phase 15: Customer Type & Electricity Actions
      updateCustomerType: (type) => set({ customerType: type }),

      updateKoptEl: (kwh) => set({ koptElKwh: kwh }),

      toggleKoptElInputMode: () => set((state) => {
        const newMode = state.koptElInputMode === 'annual' ? 'monthly' : 'annual'
        if (newMode === 'monthly' && state.koptElMonthly.every(v => v === 0)) {
          // Distribute annual value evenly across months
          const monthlyValue = state.koptElKwh / 12
          return {
            koptElInputMode: newMode,
            koptElMonthly: Array(12).fill(monthlyValue),
          }
        }
        if (newMode === 'annual') {
          // Sum monthly values
          const annualSum = state.koptElMonthly.reduce((sum, v) => sum + v, 0)
          return {
            koptElInputMode: newMode,
            koptElKwh: annualSum,
          }
        }
        return { koptElInputMode: newMode }
      }),

      updateKoptElMonthly: (month, kwh) => set((state) => ({
        koptElMonthly: state.koptElMonthly.map((v, i) => i === month ? kwh : v),
      })),

      updateElectricityPrice: (oreKwh) => set({ electricityPriceOreKwh: oreKwh }),

      toggleElectricityPriceInputMode: () => set((state) => {
        const newMode = state.electricityPriceInputMode === 'annual' ? 'monthly' : 'annual'
        if (newMode === 'monthly' && state.electricityPriceMonthly.every(v => v === 0)) {
          // Fill monthly with annual value
          return {
            electricityPriceInputMode: newMode,
            electricityPriceMonthly: Array(12).fill(state.electricityPriceOreKwh),
          }
        }
        if (newMode === 'annual') {
          // Average of monthly values
          const avg = state.electricityPriceMonthly.reduce((sum, v) => sum + v, 0) / 12
          return {
            electricityPriceInputMode: newMode,
            electricityPriceOreKwh: avg,
          }
        }
        return { electricityPriceInputMode: newMode }
      }),

      updateElectricityPriceMonthly: (month, oreKwh) => set((state) => ({
        electricityPriceMonthly: state.electricityPriceMonthly.map((v, i) => i === month ? oreKwh : v),
      })),

      toggleHasSolar: () => set((state) => ({
        hasSolar: !state.hasSolar,
        // Clear solar fields when toggling off
        ...(state.hasSolar ? {
          solarProductionKwh: null,
          solarProductionMonthly: null,
          currentSelfConsumptionKwh: null,
          projectedSelfConsumptionKwh: null,
        } : {}),
      })),

      updateSolarProduction: (kwh) => set({ solarProductionKwh: kwh }),

      toggleSolarProductionInputMode: () => set((state) => {
        const newMode = state.solarProductionInputMode === 'annual' ? 'monthly' : 'annual'
        if (newMode === 'monthly' && !state.solarProductionMonthly) {
          // Create monthly array from annual value
          const monthlyValue = (state.solarProductionKwh || 0) / 12
          return {
            solarProductionInputMode: newMode,
            solarProductionMonthly: Array(12).fill(monthlyValue),
          }
        }
        if (newMode === 'annual' && state.solarProductionMonthly) {
          // Sum monthly to annual
          const annualSum = state.solarProductionMonthly.reduce((sum, v) => sum + v, 0)
          return {
            solarProductionInputMode: newMode,
            solarProductionKwh: annualSum,
          }
        }
        return { solarProductionInputMode: newMode }
      }),

      updateSolarProductionMonthly: (month, kwh) => set((state) => ({
        solarProductionMonthly: state.solarProductionMonthly
          ? state.solarProductionMonthly.map((v, i) => i === month ? kwh : v)
          : null,
      })),

      updateCurrentSelfConsumption: (kwh) => set({ currentSelfConsumptionKwh: kwh }),

      updateProjectedSelfConsumption: (kwh) => set({ projectedSelfConsumptionKwh: kwh }),

      toggleSelfConsumptionInputMode: () => set((state) => ({
        selfConsumptionInputMode: state.selfConsumptionInputMode === 'kwh' ? 'percent' : 'kwh',
      })),

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
        heatingType: data.heatingType ?? null,
        consumptionProfile: data.consumptionProfile,
        batteries: data.batteries,
        isDraft: true,
        lastSavedAt: new Date(),
        // Clear peak values when loading - they may need recalculation
        targetAveragePeakKw: null,
        targetMonthlyCeilingKw: null,
        peakEstimateSource: 'auto',
        // Phase 15: Load electricity inputs (with defaults for backward compatibility)
        customerType: data.customerType ?? 'PRIVATPERSON',
        koptElKwh: data.koptElKwh ?? 0,
        electricityPriceOreKwh: data.electricityPriceOreKwh ?? 0,
        hasSolar: data.hasSolar ?? false,
        solarProductionKwh: data.solarProductionKwh ?? null,
        currentSelfConsumptionKwh: data.currentSelfConsumptionKwh ?? null,
        projectedSelfConsumptionKwh: data.projectedSelfConsumptionKwh ?? null,
      }),

      reset: () => set({
        ...initialState,
        consumptionProfile: { data: createEmptyProfile() },
        heatingType: null,
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
        // Clear peak targets
        targetAveragePeakKw: null,
        targetMonthlyCeilingKw: null,
        peakEstimateSource: 'auto',
        // Phase 15: Reset electricity inputs
        customerType: 'PRIVATPERSON',
        koptElKwh: 0,
        koptElInputMode: 'annual',
        koptElMonthly: Array(12).fill(0),
        electricityPriceOreKwh: 0,
        electricityPriceInputMode: 'annual',
        electricityPriceMonthly: Array(12).fill(0),
        hasSolar: false,
        solarProductionKwh: null,
        solarProductionInputMode: 'annual',
        solarProductionMonthly: null,
        currentSelfConsumptionKwh: null,
        projectedSelfConsumptionKwh: null,
        selfConsumptionInputMode: 'kwh',
      }),
    }),
    {
      name: 'kalkyla-wizard-draft-v3', // Phase 15: Bumped version to reset cached values
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist form data, not transient UI state
        calculationId: state.calculationId,
        customerName: state.customerName,
        postalCode: state.postalCode,
        elomrade: state.elomrade,
        natagareId: state.natagareId,
        annualConsumptionKwh: state.annualConsumptionKwh,
        heatingType: state.heatingType,
        consumptionProfile: state.consumptionProfile,
        batteries: state.batteries,
        currentStep: state.currentStep,
        cyclesPerDay: state.cyclesPerDay,
        peakShavingPercent: state.peakShavingPercent,
        postCampaignRate: state.postCampaignRate,
        overrides: state.overrides,
        // Phase 11: Peak targets
        targetAveragePeakKw: state.targetAveragePeakKw,
        targetMonthlyCeilingKw: state.targetMonthlyCeilingKw,
        peakEstimateSource: state.peakEstimateSource,
        // Phase 15: Electricity inputs
        customerType: state.customerType,
        koptElKwh: state.koptElKwh,
        koptElInputMode: state.koptElInputMode,
        koptElMonthly: state.koptElMonthly,
        electricityPriceOreKwh: state.electricityPriceOreKwh,
        electricityPriceInputMode: state.electricityPriceInputMode,
        electricityPriceMonthly: state.electricityPriceMonthly,
        hasSolar: state.hasSolar,
        solarProductionKwh: state.solarProductionKwh,
        solarProductionInputMode: state.solarProductionInputMode,
        solarProductionMonthly: state.solarProductionMonthly,
        currentSelfConsumptionKwh: state.currentSelfConsumptionKwh,
        projectedSelfConsumptionKwh: state.projectedSelfConsumptionKwh,
        selfConsumptionInputMode: state.selfConsumptionInputMode,
      }),
    }
  )
)
