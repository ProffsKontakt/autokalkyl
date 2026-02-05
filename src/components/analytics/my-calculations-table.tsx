'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Eye, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { sv } from 'date-fns/locale'

interface CalculationRow {
  calc_id: string
  customer: string
  last_activity: string
  views: number
}

export function MyCalculationsTable() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['analytics', 'my-calculations'],
    queryFn: async () => {
      const res = await fetch('/api/analytics?type=my-calculations&days=30')
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
    refetchInterval: 30000,
    staleTime: 15000,
  })

  const calculations: CalculationRow[] = data?.results?.map((row: unknown[]) => ({
    calc_id: row[0] as string,
    customer: row[1] as string,
    last_activity: row[2] as string,
    views: row[3] as number,
  })) ?? []

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mina kalkyler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] w-full animate-pulse bg-slate-200 dark:bg-slate-700 rounded" />
        </CardContent>
      </Card>
    )
  }

  if (error || calculations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mina kalkyler</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {error ? 'Kunde inte ladda data' : 'Inga kalkyler annu'}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mina kalkyler - Kundengagemang</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Kund
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Visningar
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Senast aktiv
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {calculations.slice(0, 10).map((calc) => (
                <tr key={calc.calc_id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                    {calc.customer || 'Namnlos'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Eye className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-900 dark:text-white">{calc.views}</span>
                      {calc.views > 3 && (
                        <Badge variant="warning" className="ml-1">
                          Het
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1 text-sm text-slate-500 dark:text-slate-400">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(calc.last_activity), {
                        addSuffix: true,
                        locale: sv,
                      })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
