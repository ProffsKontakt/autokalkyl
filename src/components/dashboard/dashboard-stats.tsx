import type { DashboardStats } from '@/actions/dashboard'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { sv } from 'date-fns/locale'
import { Calculator, Eye, ChevronRight, Clock, Share2 } from 'lucide-react'

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
        <div className="group relative overflow-hidden bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 transition-all duration-300 hover:shadow-xl hover:border-blue-200/50 dark:hover:border-blue-800/50">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-full -translate-y-1/2 translate-x-1/2 transition-transform duration-300 group-hover:scale-110" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
                <Calculator className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Totalt kalkyler</p>
            </div>
            <p className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              {stats.totalCalculations}
            </p>
          </div>
        </div>

        <div className="group relative overflow-hidden bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 transition-all duration-300 hover:shadow-xl hover:border-emerald-200/50 dark:hover:border-emerald-800/50">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full -translate-y-1/2 translate-x-1/2 transition-transform duration-300 group-hover:scale-110" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25">
                <Eye className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Totalt visningar</p>
            </div>
            <p className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              {stats.totalViews}
            </p>
          </div>
        </div>
      </div>

      {/* Recent calculations */}
      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Senaste kalkyler</h2>
          </div>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
          {stats.recentCalculations.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                <Calculator className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Inga kalkyler annu</p>
            </div>
          ) : (
            stats.recentCalculations.map((calc) => (
              <Link
                key={calc.id}
                href={`/dashboard/calculations/${calc.id}`}
                className="group flex items-center justify-between px-6 py-4 hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-all duration-200"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20 flex items-center justify-center">
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                      {calc.customerName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {calc.customerName}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {calc.batteryName || 'Inget batteri valt'}
                      {showOrg && calc.orgName && ` • ${calc.orgName}`}
                      {showCloser && calc.closerName && ` • ${calc.closerName}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    {calc.shareCode ? (
                      <div className="flex items-center gap-2 text-sm">
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/30">
                          <Share2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          <span className="font-medium text-blue-600 dark:text-blue-400">{calc.viewCount}</span>
                        </div>
                        {calc.lastViewedAt && (
                          <span className="text-xs text-slate-400">
                            {formatDistanceToNow(new Date(calc.lastViewedAt), { addSuffix: true, locale: sv })}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-400">Ej delad</span>
                    )}
                    <p className="text-xs text-slate-400 mt-1">
                      {formatDistanceToNow(new Date(calc.updatedAt), { addSuffix: true, locale: sv })}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
