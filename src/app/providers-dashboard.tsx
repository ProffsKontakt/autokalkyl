'use client'

import dynamic from 'next/dynamic'
import { SessionProvider } from 'next-auth/react'
import { Suspense } from 'react'
import { ThemeProvider } from '@/components/theme/theme-provider'

// Lazy load analytics components - they're not needed for initial render
const PHProvider = dynamic(
  () => import('@/components/analytics/posthog-provider').then((mod) => mod.PHProvider),
  { ssr: false }
)
const PostHogPageview = dynamic(
  () => import('@/components/analytics/posthog-pageview').then((mod) => mod.PostHogPageview),
  { ssr: false }
)
const IdentifyUser = dynamic(
  () => import('@/components/analytics/identify-user').then((mod) => mod.IdentifyUser),
  { ssr: false }
)

/**
 * Full providers for dashboard/authenticated routes.
 * Includes analytics (PostHog, Sentry) which are lazy-loaded.
 */
export function DashboardProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <SessionProvider>
        <PHProvider>
          {children}
          <Suspense fallback={null}>
            <PostHogPageview />
          </Suspense>
          <IdentifyUser />
        </PHProvider>
      </SessionProvider>
    </ThemeProvider>
  )
}
