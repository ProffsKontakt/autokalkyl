'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, FileText, Eye, TrendingUp } from 'lucide-react'

export function OrgOverview() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics', 'org-summary'],
    queryFn: async () => {
      // Fetch multiple metrics in parallel
      const [trendRes, performanceRes] = await Promise.all([
        fetch('/api/analytics?type=calculations-trend&days=7'),
        fetch('/api/analytics?type=closer-performance&days=7'),
      ])

      if (!trendRes.ok || !performanceRes.ok) {
        throw new Error('Failed to fetch')
      }

      const trend = await trendRes.json()
      const performance = await performanceRes.json()

      return { trend, performance }
    },
    refetchInterval: 60000,
    staleTime: 30000,
  })

  // Calculate summary metrics
  const totalCalculations = data?.trend?.results?.reduce(
    (sum: number, row: unknown[]) => sum + (row[1] as number),
    0
  ) ?? 0

  const totalViews = data?.performance?.results?.reduce(
    (sum: number, row: unknown[]) => sum + (row[2] as number),
    0
  ) ?? 0

  const activeClosers = data?.performance?.results?.length ?? 0

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 w-24 animate-pulse bg-slate-200 dark:bg-slate-700 rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 animate-pulse bg-slate-200 dark:bg-slate-700 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Kalkyler (7 dagar)</CardTitle>
          <FileText className="h-4 w-4 text-slate-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{totalCalculations}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Kundvisningar</CardTitle>
          <Eye className="h-4 w-4 text-slate-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{totalViews}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Aktiva saljare</CardTitle>
          <Users className="h-4 w-4 text-slate-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{activeClosers}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Konvertering</CardTitle>
          <TrendingUp className="h-4 w-4 text-slate-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {totalCalculations > 0
              ? Math.round((totalViews / totalCalculations) * 100)
              : 0}%
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">visningar/kalkyl</p>
        </CardContent>
      </Card>
    </div>
  )
}
