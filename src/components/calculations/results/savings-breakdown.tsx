'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import type { CalculationResults } from '@/lib/calculations/types'

interface SavingsBreakdownProps {
  results: CalculationResults
}

const COLORS = ['#3B82F6', '#10B981', '#8B5CF6']

export function SavingsBreakdown({ results }: SavingsBreakdownProps) {
  const data = [
    {
      name: 'Spotprisoptimering',
      value: results.spotprisSavingsSek,
      description: 'Ladda billigt pa natten, anvand dagtid',
    },
    {
      name: 'Effekttariffbesparing',
      value: results.effectTariffSavingsSek,
      description: 'Minska toppeffekt, lagre natnatsavgift',
    },
    {
      name: 'Stodtjanster',
      value: results.gridServicesIncomeSek,
      description: 'Intakt fran frekvensreglering m.m.',
    },
  ].filter(d => d.value > 0)

  const total = data.reduce((sum, d) => sum + d.value, 0)

  const formatSek = (n: number) =>
    Math.round(n).toLocaleString('sv-SE') + ' kr'

  return (
    <div className="bg-white border rounded-lg p-4">
      <h3 className="font-medium text-gray-900 mb-4">Besparingsfordelning</h3>

      <div className="flex items-center gap-6">
        <div className="w-48 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => formatSek(Number(value))}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-3">
          {data.map((item, index) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">{item.name}</span>
                  <p className="text-xs text-gray-500">{item.description}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-medium text-gray-900">
                  {formatSek(item.value)}
                </span>
                <p className="text-xs text-gray-500">
                  {((item.value / total) * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          ))}

          <div className="pt-3 border-t">
            <div className="flex justify-between">
              <span className="font-medium text-gray-900">Total</span>
              <span className="font-bold text-green-600">{formatSek(total)}/ar</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
