import { Suspense } from 'react'
import { AnalyticsDashboard } from '@/components/analytics/analytics-dashboard'

export const metadata = {
  title: 'Statistik | Kalkyla',
}

/**
 * Dedicated analytics page at /dashboard/analytics.
 * Shows full analytics dashboard with charts.
 */
export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Statistik</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Oversikt over kalkyler och kundengagemang
        </p>
      </div>

      <Suspense
        fallback={
          <div className="space-y-6">
            <div className="h-[400px] w-full animate-pulse bg-slate-100 dark:bg-slate-800 rounded-2xl" />
            <div className="h-[400px] w-full animate-pulse bg-slate-100 dark:bg-slate-800 rounded-2xl" />
          </div>
        }
      >
        <AnalyticsDashboard />
      </Suspense>
    </div>
  )
}
