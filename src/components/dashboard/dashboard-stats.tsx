import type { DashboardStats } from '@/actions/dashboard'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { sv } from 'date-fns/locale'

interface Props {
  stats: DashboardStats
  showOrg?: boolean
  showCloser?: boolean
}

export function DashboardStatsView({ stats, showOrg, showCloser }: Props) {
  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Totalt kalkyler</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalCalculations}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Totalt visningar</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalViews}</p>
        </div>
      </div>

      {/* Recent calculations */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Senaste kalkyler</h2>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {stats.recentCalculations.length === 0 ? (
            <p className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">Inga kalkyler annu</p>
          ) : (
            stats.recentCalculations.map((calc) => (
              <Link
                key={calc.id}
                href={`/dashboard/calculations/${calc.id}`}
                className="block px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{calc.customerName}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {calc.batteryName || 'Inget batteri valt'}
                      {showOrg && calc.orgName && ` - ${calc.orgName}`}
                      {showCloser && calc.closerName && ` - ${calc.closerName}`}
                    </p>
                  </div>
                  <div className="text-right">
                    {calc.shareCode ? (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-blue-600 dark:text-blue-400">{calc.viewCount} visningar</span>
                        {calc.lastViewedAt && (
                          <span className="text-gray-400">
                            {formatDistanceToNow(new Date(calc.lastViewedAt), { addSuffix: true, locale: sv })}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">Ej delad</span>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDistanceToNow(new Date(calc.updatedAt), { addSuffix: true, locale: sv })}
                    </p>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
