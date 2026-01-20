'use client'

import { useEffect } from 'react'
import { trackCalculationViewed } from '@/lib/analytics/events'

interface PublicAnalyticsProps {
  calculationId: string
  orgSlug: string
}

export function PublicAnalytics({ calculationId, orgSlug }: PublicAnalyticsProps) {
  useEffect(() => {
    trackCalculationViewed(calculationId, orgSlug)
  }, [calculationId, orgSlug])

  return null
}
