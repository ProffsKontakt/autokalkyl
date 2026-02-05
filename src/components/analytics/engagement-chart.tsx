'use client'

import { useQuery } from '@tanstack/react-query'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface EngagementChartProps {
  days?: number
}

interface ChartDataPoint {
  closerId: string
  calculations: number
  views: number
}

/**
 * Bar chart showing team performance - calculations and views per closer.
 * Only visible to Org Admin and Super Admin.
 * Fetches data from PostHog via /api/analytics with auto-refresh.
 */
export function EngagementChart({ days = 7 }: EngagementChartProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['analytics', 'closer-performance', days],
    queryFn: async () => {
      const res = await fetch(`/api/analytics?type=closer-performance&days=${days}`)
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
    refetchInterval: 30000,
    staleTime: 15000,
  })

  // Transform PostHog response to Recharts format
  // Format: [[closer_id, calculations, views], ...]
  const chartData: ChartDataPoint[] =
    data?.results?.map((row: unknown[]) => ({
      closerId: ((row[0] as string) || 'Okand').slice(0, 8) + '...',
      calculations: row[1] as number,
      views: row[2] as number,
    })) ?? []

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Teamprestation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full animate-pulse bg-slate-100 dark:bg-slate-800 rounded-md" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Teamprestation</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Kunde inte ladda statistik
          </p>
        </CardContent>
      </Card>
    )
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Teamprestation</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Ingen data tillganglig for de senaste {days} dagarna
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Teamprestation</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
            <XAxis dataKey="closerId" tick={{ fontSize: 10 }} />
            <YAxis allowDecimals={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--tooltip-bg, white)',
                border: '1px solid var(--tooltip-border, #e2e8f0)',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Bar dataKey="calculations" fill="#3B82F6" name="Kalkyler" />
            <Bar dataKey="views" fill="#10B981" name="Visningar" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
