'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { sv } from 'date-fns/locale'
import {
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  BoltIcon,
  SunIcon,
} from '@heroicons/react/24/outline'
import { toggleCompanyActive, deleteCompany } from '@/actions/companies'

interface Company {
  id: string
  name: string
  email: string
  phone: string | null
  webhookUrl: string | null
  isActive: boolean
  acceptsBattery: boolean
  acceptsSolar: boolean
  maxLeadsPerDay: number
  leadsToday: number
  matchedLeadsCount: number
  createdAt: Date
}

interface CompaniesTableProps {
  companies: Company[]
}

export function CompaniesTable({ companies: initialCompanies }: CompaniesTableProps) {
  const [companies, setCompanies] = useState(initialCompanies)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleToggleActive = async (companyId: string) => {
    const result = await toggleCompanyActive(companyId)
    if (result.success && result.isActive !== undefined) {
      setCompanies(companies.map((c) => (c.id === companyId ? { ...c, isActive: result.isActive! } : c)))
    }
  }

  const handleDelete = async (companyId: string) => {
    if (!confirm('Är du säker på att du vill ta bort detta företag? Detta kan inte ångras.')) {
      return
    }

    setDeletingId(companyId)
    const result = await deleteCompany(companyId)
    if (result.success) {
      setCompanies(companies.filter((c) => c.id !== companyId))
    }
    setDeletingId(null)
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-slate-700/50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
              Företag
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
              Kontakt
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
              Accepterar
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
              Leads idag
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
              Totalt
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
              Status
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
              Åtgärder
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
          {companies.map((company) => (
            <tr key={company.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
              <td className="px-4 py-4">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {company.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Skapad {format(new Date(company.createdAt), 'd MMM yyyy', { locale: sv })}
                  </div>
                </div>
              </td>
              <td className="px-4 py-4">
                <div className="text-sm">
                  <div className="text-gray-900 dark:text-white">{company.email}</div>
                  {company.phone && (
                    <div className="text-gray-500 dark:text-gray-400">{company.phone}</div>
                  )}
                </div>
              </td>
              <td className="px-4 py-4">
                <div className="flex items-center gap-2">
                  {company.acceptsBattery && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                      <BoltIcon className="h-3 w-3" />
                      Batteri
                    </span>
                  )}
                  {company.acceptsSolar && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                      <SunIcon className="h-3 w-3" />
                      Sol
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-4">
                <span className="text-sm text-gray-900 dark:text-white">
                  {company.leadsToday} / {company.maxLeadsPerDay}
                </span>
              </td>
              <td className="px-4 py-4">
                <span className="text-sm text-gray-900 dark:text-white">
                  {company.matchedLeadsCount}
                </span>
              </td>
              <td className="px-4 py-4">
                <button
                  onClick={() => handleToggleActive(company.id)}
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    company.isActive
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400 hover:bg-gray-200'
                  }`}
                >
                  {company.isActive ? (
                    <>
                      <CheckCircleIcon className="h-3 w-3" />
                      Aktiv
                    </>
                  ) : (
                    <>
                      <XCircleIcon className="h-3 w-3" />
                      Inaktiv
                    </>
                  )}
                </button>
              </td>
              <td className="px-4 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    title="Redigera"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(company.id)}
                    disabled={deletingId === company.id}
                    className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                    title="Ta bort"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {companies.length === 0 && (
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
          Inga företag registrerade ännu
        </div>
      )}
    </div>
  )
}
