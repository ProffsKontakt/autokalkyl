'use client'

import { useQuery } from '@tanstack/react-query'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface CalculationMetricsProps {
  days?: number
}

interface ChartDataPoint {
  date: string
  calculations: number
}

/**
 * Line chart showing calculations over time.
 * Fetches data from PostHog via /api/analytics with auto-refresh.
 */
export function CalculationMetrics({ days = 30 }: CalculationMetricsProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['analytics', 'calculations-trend', days],
    queryFn: async () => {
      const res = await fetch(`/api/analytics?type=calculations-trend&days=${days}`)
      if (!res.ok) throw new Error('Failed to fetch analytics')
      return res.json()
    },
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    staleTime: 15000,
  })

  // Transform PostHog response to Recharts format
  // PostHog returns results as array of arrays: [[date, count], [date, count], ...]
  const chartData: ChartDataPoint[] =
    data?.results?.map((row: unknown[]) => ({
      date: row[0] as string,
      calculations: row[1] as number,
    })) ?? []

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Kalkyler over tid</CardTitle>
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
          <CardTitle>Kalkyler over tid</CardTitle>
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
          <CardTitle>Kalkyler over tid</CardTitle>
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
        <CardTitle>Kalkyler over tid</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                const date = new Date(value)
                return `${date.getDate()}/${date.getMonth() + 1}`
              }}
              className="text-slate-600 dark:text-slate-400"
            />
            <YAxis
              allowDecimals={false}
              className="text-slate-600 dark:text-slate-400"
            />
            <Tooltip
              labelFormatter={(value) => {
                const date = new Date(value as string)
                return date.toLocaleDateString('sv-SE')
              }}
              contentStyle={{
                backgroundColor: 'var(--tooltip-bg, white)',
                border: '1px solid var(--tooltip-border, #e2e8f0)',
                borderRadius: '8px',
              }}
            />
            <Line
              type="monotone"
              dataKey="calculations"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={false}
              name="Kalkyler"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
