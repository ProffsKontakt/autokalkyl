'use client'

import { useEffect, useRef } from 'react'
import {
  trackCalculationViewed,
  trackScrollDepth,
  trackTimeOnPage,
} from '@/lib/analytics/events'

interface PublicAnalyticsProps {
  calculationId: string
  orgSlug: string
}

export function PublicAnalytics({ calculationId, orgSlug }: PublicAnalyticsProps) {
  const maxScrollDepth = useRef(0)
  const startTime = useRef(Date.now())

  // Track calculation viewed on mount
  useEffect(() => {
    trackCalculationViewed(calculationId, orgSlug)
  }, [calculationId, orgSlug])

  // Track scroll depth
  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
      if (scrollHeight <= 0) return

      const currentDepth = Math.round((window.scrollY / scrollHeight) * 100)
      if (currentDepth > maxScrollDepth.current) {
        maxScrollDepth.current = currentDepth
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Track time on page and max scroll depth when leaving
  useEffect(() => {
    const handleBeforeUnload = () => {
      const seconds = Math.round((Date.now() - startTime.current) / 1000)
      trackTimeOnPage(calculationId, seconds)
      trackScrollDepth(calculationId, maxScrollDepth.current)
    }

    // Also track on visibility change (mobile tab switching)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        const seconds = Math.round((Date.now() - startTime.current) / 1000)
        trackTimeOnPage(calculationId, seconds)
        trackScrollDepth(calculationId, maxScrollDepth.current)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [calculationId])

  return null
}
