import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type PropertyType = 'VILLA' | 'BOSTADSRATT' | 'LAGENHET' | 'FORETAG'
export type InterestType = 'BATTERY' | 'SOLAR' | 'BOTH'
export type BudgetRange = 'UNDER_100K' | 'RANGE_100K_200K' | 'OVER_200K' | 'UNKNOWN'
export type Timeline = 'ASAP' | 'WITHIN_3_MONTHS' | 'WITHIN_6_MONTHS' | 'JUST_RESEARCHING'
export type Elomrade = 'SE1' | 'SE2' | 'SE3' | 'SE4'

export interface LeadWizardData {
  // Step 1: Property Type
  propertyType: PropertyType | null

  // Step 2: Interest
  interestType: InterestType | null

  // Step 3: Location
  postalCode: string
  elomrade: Elomrade | null
  hasExistingSolar: boolean

  // Step 4: Consumption
  annualKwh: number

  // Step 5: Budget & Timeline
  budget: BudgetRange | null
  timeline: Timeline | null

  // Step 6: Contact Info
  name: string
  email: string
  phone: string
  gdprConsent: boolean

  // Calculated results (filled after calculation)
  calculationResults: CalculationResults | null
}

export interface CalculationResults {
  estimatedSavingsPerYear: number
  paybackYears: number
  roi10Year: number
  recommendedCapacityKwh: number
  estimatedCostBeforeDeduction: number
  estimatedCostAfterDeduction: number
}

interface LeadWizardStore {
  // Current step (1-7)
  currentStep: number
  setCurrentStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void

  // Form data
  data: LeadWizardData
  updateData: (updates: Partial<LeadWizardData>) => void

  // Validation
  isStepValid: (step: number) => boolean

  // Results
  setCalculationResults: (results: CalculationResults) => void

  // Lead ID after submission
  leadId: string | null
  setLeadId: (id: string) => void

  // Reset
  reset: () => void
}

const initialData: LeadWizardData = {
  propertyType: null,
  interestType: null,
  postalCode: '',
  elomrade: null,
  hasExistingSolar: false,
  annualKwh: 15000,
  budget: null,
  timeline: null,
  name: '',
  email: '',
  phone: '',
  gdprConsent: false,
  calculationResults: null,
}

export const useLeadWizardStore = create<LeadWizardStore>()(
  persist(
    (set, get) => ({
      currentStep: 1,
      setCurrentStep: (step) => set({ currentStep: step }),
      nextStep: () => set((state) => ({ currentStep: Math.min(state.currentStep + 1, 7) })),
      prevStep: () => set((state) => ({ currentStep: Math.max(state.currentStep - 1, 1) })),

      data: initialData,
      updateData: (updates) =>
        set((state) => ({
          data: { ...state.data, ...updates },
        })),

      isStepValid: (step) => {
        const { data } = get()
        switch (step) {
          case 1:
            return data.propertyType !== null
          case 2:
            return data.interestType !== null
          case 3:
            return data.postalCode.length >= 5 && data.elomrade !== null
          case 4:
            return data.annualKwh > 0
          case 5:
            return data.budget !== null && data.timeline !== null
          case 6:
            return (
              data.name.length >= 2 &&
              data.email.includes('@') &&
              data.gdprConsent
            )
          case 7:
            return true // Results page, always valid
          default:
            return false
        }
      },

      setCalculationResults: (results) =>
        set((state) => ({
          data: { ...state.data, calculationResults: results },
        })),

      leadId: null,
      setLeadId: (id) => set({ leadId: id }),

      reset: () =>
        set({
          currentStep: 1,
          data: initialData,
          leadId: null,
        }),
    }),
    {
      name: 'kalkyla-lead-wizard',
      partialize: (state) => ({
        currentStep: state.currentStep,
        data: state.data,
        leadId: state.leadId,
      }),
    }
  )
)
