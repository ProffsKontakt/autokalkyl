'use client'

import { useRouter } from 'next/navigation'
import { useCalculationWizardStore } from '@/stores/calculation-wizard-store'
import { Button } from '@/components/ui/button'

interface NewCalculationButtonProps {
  className?: string
}

/**
 * Button that resets the wizard store before navigating to new calculation.
 * Ensures users always start with a fresh form.
 */
export function NewCalculationButton({ className }: NewCalculationButtonProps) {
  const router = useRouter()
  const reset = useCalculationWizardStore(state => state.reset)

  const handleClick = () => {
    reset()
    router.push('/dashboard/calculations/new')
  }

  return (
    <Button onClick={handleClick} className={className}>
      Ny kalkyl
    </Button>
  )
}
