'use client'

import { useRouter } from 'next/navigation'
import { useCalculationWizardStore } from '@/stores/calculation-wizard-store'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

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
    <Button onClick={handleClick} variant="gradient" className={className}>
      <Plus className="w-4 h-4" />
      Ny kalkyl
    </Button>
  )
}
