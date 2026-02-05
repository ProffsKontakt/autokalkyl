'use client'

import dynamic from 'next/dynamic'
import { SessionProvider } from 'next-auth/react'
import { Suspense, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
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
 * Includes React Query for data fetching with caching.
 */
export function DashboardProviders({ children }: { children: React.ReactNode }) {
  // Create QueryClient once per component mount (React 18 pattern)
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Default stale time: 30 seconds for fresh data
            staleTime: 30 * 1000,
            // Don't retry failed queries immediately
            retry: 1,
          },
        },
      })
  )

  return (
    <ThemeProvider>
      <SessionProvider>
        <QueryClientProvider client={queryClient}>
          <PHProvider>
            {children}
            <Suspense fallback={null}>
              <PostHogPageview />
            </Suspense>
            <IdentifyUser />
          </PHProvider>
        </QueryClientProvider>
      </SessionProvider>
    </ThemeProvider>
  )
}
