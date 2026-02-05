'use client'

import { CalculationMetrics } from './calculation-metrics'
import { EngagementChart } from './engagement-chart'
import { useSession } from 'next-auth/react'

/**
 * Full analytics dashboard combining all chart components.
 * Shows role-appropriate charts:
 * - All users: CalculationMetrics (line chart of calculations over time)
 * - Org Admin & Super Admin: EngagementChart (team performance bar chart)
 */
export function AnalyticsDashboard() {
  const { data: session } = useSession()
  const role = session?.user?.role

  return (
    <div className="space-y-6">
      {/* Main metrics chart - everyone sees this */}
      <CalculationMetrics days={30} />

      {/* Team performance - Org Admin and Super Admin only */}
      {(role === 'ORG_ADMIN' || role === 'SUPER_ADMIN') && (
        <EngagementChart days={7} />
      )}
    </div>
  )
}
