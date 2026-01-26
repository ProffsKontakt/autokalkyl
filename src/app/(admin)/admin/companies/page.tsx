import { Suspense } from 'react'
import { getCompanies } from '@/actions/companies'
import { CompaniesTable } from './companies-table'
import { AddCompanyButton } from './add-company-button'

export const metadata = {
  title: 'Företag | Admin - Kalkyla.se',
}

export default async function CompaniesPage() {
  const { companies, error } = await getCompanies()

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Företag</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Hantera anslutna installationsföretag
          </p>
        </div>
        <AddCompanyButton />
      </div>

      <Suspense fallback={<div>Laddar...</div>}>
        <CompaniesTable companies={companies || []} />
      </Suspense>
    </div>
  )
}
