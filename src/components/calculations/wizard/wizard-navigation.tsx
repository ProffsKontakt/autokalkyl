'use client'

/**
 * Wizard navigation component with progress indicator and step controls.
 *
 * Displays a horizontal progress bar showing completed, current, and future steps.
 * Provides Back/Next navigation with validation gating.
 */

interface WizardNavigationProps {
  currentStep: number
  totalSteps: number
  onBack: () => void
  onNext: () => void
  onFinalize?: () => void
  canGoNext: boolean
  isLastStep: boolean
  isSaving?: boolean
  lastSavedAt?: Date | null
}

const STEP_LABELS = [
  'Kundinfo',
  'Forbrukning',
  'Batteri',
  'Resultat',
]

export function WizardNavigation({
  currentStep,
  totalSteps,
  onBack,
  onNext,
  onFinalize,
  canGoNext,
  isLastStep,
  isSaving,
  lastSavedAt,
}: WizardNavigationProps) {
  return (
    <div className="bg-white border-t px-6 py-4">
      {/* Progress indicator */}
      <div className="flex items-center justify-center mb-4">
        {STEP_LABELS.slice(0, totalSteps).map((label, index) => (
          <div key={index} className="flex items-center">
            <div className={`
              flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
              ${index < currentStep
                ? 'bg-blue-600 text-white'
                : index === currentStep
                  ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                  : 'bg-gray-200 text-gray-600'
              }
            `}>
              {index < currentStep ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                index + 1
              )}
            </div>
            <span className={`ml-2 text-sm ${index === currentStep ? 'font-medium text-gray-900' : 'text-gray-500'}`}>
              {label}
            </span>
            {index < totalSteps - 1 && (
              <div className={`w-12 h-0.5 mx-3 ${index < currentStep ? 'bg-blue-600' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Navigation buttons and save status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          {isSaving && (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Sparar...</span>
            </>
          )}
          {!isSaving && lastSavedAt && (
            <span>Sparad {lastSavedAt.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}</span>
          )}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onBack}
            disabled={currentStep === 0}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Tillbaka
          </button>
          {isLastStep ? (
            <button
              type="button"
              onClick={onFinalize}
              disabled={!canGoNext}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Slutfor kalkyl
            </button>
          ) : (
            <button
              type="button"
              onClick={onNext}
              disabled={!canGoNext}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Nasta
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
