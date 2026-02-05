import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/auth'
import { getDashboardStats } from '@/actions/dashboard'
import { DashboardStatsView } from '@/components/dashboard/dashboard-stats'
import { NewCalculationButton } from '@/components/calculations/new-calculation-button'
import { MyCalculationsTable } from '@/components/analytics/my-calculations-table'
import { OrgOverview } from '@/components/analytics/org-overview'
import type { Role } from '@/lib/auth/permissions'

export const metadata = {
  title: 'Dashboard - Kalkyla.se',
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  // Super Admin goes to admin panel
  const role = session.user.role as Role
  if (role === 'SUPER_ADMIN') {
    redirect('/admin')
  }

  const result = await getDashboardStats()

  if (result.error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
        {result.error}
      </div>
    )
  }

  const stats = result.data!

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Valkommen tillbaka, {session.user.name}
          </p>
        </div>
        <NewCalculationButton />
      </div>

      <DashboardStatsView
        stats={stats}
        showCloser={role === 'ORG_ADMIN'}
      />

      {/* Analytics section - role-specific views */}
      <div className="mt-8 space-y-6">
        {/* Org Admin sees OrgOverview metrics */}
        {role === 'ORG_ADMIN' && (
          <Suspense fallback={<div className="h-32 w-full animate-pulse bg-slate-200 dark:bg-slate-700 rounded-lg" />}>
            <OrgOverview />
          </Suspense>
        )}

        {/* Closer sees their calculation engagement table */}
        {role === 'CLOSER' && (
          <Suspense fallback={<div className="h-64 w-full animate-pulse bg-slate-200 dark:bg-slate-700 rounded-lg" />}>
            <MyCalculationsTable />
          </Suspense>
        )}
      </div>
    </div>
  )
}
