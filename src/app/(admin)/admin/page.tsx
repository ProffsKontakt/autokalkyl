import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/auth'
import { getDashboardStats, getOrganizationsWithStats, getCalculationsForDashboard } from '@/actions/dashboard'
import { DashboardStatsView } from '@/components/dashboard/dashboard-stats'
import { OrgList } from '@/components/dashboard/org-list'
import { CalculationsTable } from '@/components/dashboard/calculations-table'
import type { Role } from '@/lib/auth/permissions'
import Link from 'next/link'

export const metadata = {
  title: 'Admin - Kalkyla.se',
}

export default async function AdminPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const role = session.user.role as Role
  if (role !== 'SUPER_ADMIN') {
    redirect('/dashboard')
  }

  const [statsResult, orgsResult, calcsResult] = await Promise.all([
    getDashboardStats(),
    getOrganizationsWithStats(),
    getCalculationsForDashboard(),
  ])

  if (statsResult.error || orgsResult.error || calcsResult.error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
        {statsResult.error || orgsResult.error || calcsResult.error}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Oversikt over alla organisationer och kalkyler
        </p>
      </div>

      {/* Stats overview */}
      <DashboardStatsView
        stats={statsResult.data!}
        showOrg={true}
      />

      {/* Organizations */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Organisationer</h2>
          <Link
            href="/admin/organizations/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Skapa organisation
          </Link>
        </div>
        <OrgList orgs={orgsResult.data!} />
      </div>

      {/* All calculations */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Alla kalkyler</h2>
        <CalculationsTable calculations={calcsResult.data!} />
      </div>
    </div>
  )
}
