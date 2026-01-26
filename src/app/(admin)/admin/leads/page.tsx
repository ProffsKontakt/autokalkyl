import { Suspense } from 'react'
import { getLeads } from '@/actions/leads'
import { LeadsTable } from './leads-table'

export const metadata = {
  title: 'Leads | Admin - Kalkyla.se',
}

export default async function LeadsPage() {
  const { leads, error } = await getLeads()

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Leads</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Hantera inkommande förfrågningar från kalkylen
          </p>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {leads?.length || 0} totalt
        </div>
      </div>

      <Suspense fallback={<div>Laddar...</div>}>
        <LeadsTable leads={leads || []} />
      </Suspense>
    </div>
  )
}
