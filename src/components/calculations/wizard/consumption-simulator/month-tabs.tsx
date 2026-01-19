'use client'

/**
 * Monthly tab selector for consumption profile editing.
 *
 * Shows all 12 months with intensity indicators based on
 * total consumption for each month.
 */

import { MONTHS } from '@/lib/calculations/constants'

interface MonthTabsProps {
  selectedMonth: number
  onSelectMonth: (month: number) => void
  monthTotals: number[] // Total kWh per month for indicator
}

export function MonthTabs({ selectedMonth, onSelectMonth, monthTotals }: MonthTabsProps) {
  const maxTotal = Math.max(...monthTotals, 1)

  return (
    <div className="flex flex-wrap gap-1">
      {MONTHS.map((month, index) => {
        const intensity = monthTotals[index] / maxTotal
        return (
          <button
            key={index}
            type="button"
            onClick={() => onSelectMonth(index)}
            className={`
              relative px-3 py-2 text-sm rounded-md transition-colors
              ${selectedMonth === index
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            {month}
            {/* Intensity indicator */}
            <div
              className={`absolute bottom-0 left-0 right-0 h-1 rounded-b ${
                selectedMonth === index ? 'bg-blue-400' : 'bg-blue-200'
              }`}
              style={{ opacity: intensity }}
            />
          </button>
        )
      })}
    </div>
  )
}
