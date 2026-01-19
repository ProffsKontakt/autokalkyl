import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/auth'
import { hasPermission, PERMISSIONS, Role } from '@/lib/auth/permissions'
import { listCalculations } from '@/actions/calculations'
import { CalculationList } from '@/components/calculations/calculation-list'
import { NewCalculationButton } from '@/components/calculations/new-calculation-button'

export const metadata = {
  title: 'Kalkyler - Kalkyla.se',
}

export default async function CalculationsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const role = session.user.role as Role
  if (!hasPermission(role, PERMISSIONS.CALCULATION_VIEW)) {
    redirect('/dashboard')
  }

  const result = await listCalculations()

  if (result.error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
        {result.error}
      </div>
    )
  }

  const calculations = result.calculations || []
  const activeCalculations = calculations.filter(c => c.status !== 'ARCHIVED')

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kalkyler</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {activeCalculations.length} aktiva kalkyler
          </p>
        </div>
        <NewCalculationButton />
      </div>

      <CalculationList
        calculations={activeCalculations}
        showOrg={role === 'SUPER_ADMIN'}
      />
    </div>
  )
}
