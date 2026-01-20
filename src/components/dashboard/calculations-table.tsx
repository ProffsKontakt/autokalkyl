'use client'

import type { CalculationForDashboard } from '@/actions/dashboard'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { sv } from 'date-fns/locale'

interface Props {
  calculations: CalculationForDashboard[]
}

export function CalculationsTable({ calculations }: Props) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Kund</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Organisation</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Saljare</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Batteri</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Visningar</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Senast visad</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Skapad</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {calculations.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  Inga kalkyler hittades
                </td>
              </tr>
            ) : (
              calculations.map((calc) => (
                <tr key={calc.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/calculations/${calc.id}`} className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
                      {calc.customerName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{calc.orgName}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{calc.closerName}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{calc.batteryName || '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      calc.status === 'COMPLETE'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}>
                      {calc.status === 'COMPLETE' ? 'Klar' : 'Utkast'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm">
                    {calc.shareCode ? (
                      <span className="text-blue-600 dark:text-blue-400">{calc.viewCount}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-500 dark:text-gray-400">
                    {calc.lastViewedAt
                      ? formatDistanceToNow(new Date(calc.lastViewedAt), { addSuffix: true, locale: sv })
                      : '-'}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-500 dark:text-gray-400">
                    {formatDistanceToNow(new Date(calc.createdAt), { addSuffix: true, locale: sv })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
