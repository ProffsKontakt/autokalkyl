'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'
import Link from 'next/link'

/**
 * Quick glance analytics widget for the main dashboard.
 * Shows total calculations over the last 7 days.
 * Links to the full analytics page.
 */
export function AnalyticsDashboardWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics', 'calculations-trend', 7],
    queryFn: async () => {
      const res = await fetch('/api/analytics?type=calculations-trend&days=7')
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
    refetchInterval: 60000, // Refresh every minute for widget
    staleTime: 30000,
  })

  // Calculate totals from the trend data
  // Format: [[date, count], [date, count], ...]
  const totalCalculations =
    data?.results?.reduce(
      (sum: number, row: unknown[]) => sum + (row[1] as number),
      0
    ) ?? 0

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Senaste 7 dagarna</CardTitle>
          <TrendingUp className="h-4 w-4 text-slate-500 dark:text-slate-400" />
        </CardHeader>
        <CardContent>
          <div className="h-8 w-20 animate-pulse bg-slate-100 dark:bg-slate-800 rounded" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Link href="/dashboard/analytics">
      <Card className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Senaste 7 dagarna</CardTitle>
          <TrendingUp className="h-4 w-4 text-slate-500 dark:text-slate-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalCalculations}</div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            kalkyler skapade
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}
