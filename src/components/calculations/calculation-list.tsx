'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { deleteCalculation } from '@/actions/calculations'
import { useState } from 'react'

interface Calculation {
  id: string
  customerName: string
  elomrade: string
  status: 'DRAFT' | 'COMPLETE' | 'ARCHIVED'
  createdAt: Date
  updatedAt: Date
  batteryName: string | null
  organizationName?: string
}

interface CalculationListProps {
  calculations: Calculation[]
  showOrg?: boolean
}

export function CalculationList({ calculations, showOrg = false }: CalculationListProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('Ar du saker pa att du vill ta bort denna kalkyl?')) return

    setDeletingId(id)
    const result = await deleteCalculation(id)
    if (result.error) {
      alert(result.error)
    } else {
      router.refresh()
    }
    setDeletingId(null)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
            Utkast
          </span>
        )
      case 'COMPLETE':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
            Klar
          </span>
        )
      case 'ARCHIVED':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">
            Arkiverad
          </span>
        )
      default:
        return null
    }
  }

  if (calculations.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="mt-4 text-sm font-medium text-gray-900">Inga kalkyler</h3>
        <p className="mt-1 text-sm text-gray-500">
          Skapa din forsta kalkyl for att komma igang.
        </p>
        <div className="mt-6">
          <Link
            href="/dashboard/calculations/new"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Ny kalkyl
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Kund
            </th>
            {showOrg && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Organisation
              </th>
            )}
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Batteri
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Elomrade
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Uppdaterad
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Atgarder
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {calculations.map((calc) => (
            <tr key={calc.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <Link
                  href={`/dashboard/calculations/${calc.id}`}
                  className="text-sm font-medium text-gray-900 hover:text-blue-600"
                >
                  {calc.customerName}
                </Link>
              </td>
              {showOrg && (
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {calc.organizationName || '-'}
                </td>
              )}
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {calc.batteryName || 'Inget valt'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {calc.elomrade}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {getStatusBadge(calc.status)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(calc.updatedAt).toLocaleDateString('sv-SE')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                <div className="flex justify-end gap-2">
                  <Link
                    href={`/dashboard/calculations/${calc.id}`}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Visa
                  </Link>
                  {calc.status !== 'ARCHIVED' && (
                    <button
                      onClick={() => handleDelete(calc.id)}
                      disabled={deletingId === calc.id}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50"
                    >
                      {deletingId === calc.id ? 'Tar bort...' : 'Ta bort'}
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
