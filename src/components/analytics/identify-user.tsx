'use client'

import { useSession } from 'next-auth/react'
import { usePostHog } from 'posthog-js/react'
import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

export function IdentifyUser() {
  const { data: session } = useSession()
  const posthog = usePostHog()

  useEffect(() => {
    if (session?.user && posthog) {
      // Check if already identified to avoid duplicate identify calls
      const distinctId = posthog.get_distinct_id()
      if (distinctId !== session.user.id) {
        posthog.identify(session.user.id, {
          email: session.user.email,
          name: session.user.name,
          role: session.user.role,
          orgId: session.user.orgId,
        })
      }

      // Set Sentry user context
      Sentry.setUser({
        id: session.user.id,
        email: session.user.email || undefined,
      })
    } else if (!session?.user) {
      // Clear user context on logout
      posthog?.reset()
      Sentry.setUser(null)
    }
  }, [session, posthog])

  return null
}
