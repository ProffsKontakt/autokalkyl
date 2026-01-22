'use client'

import { SessionProvider } from 'next-auth/react'
import { Suspense } from 'react'
import { PHProvider } from '@/components/analytics/posthog-provider'
import { PostHogPageview } from '@/components/analytics/posthog-pageview'
import { IdentifyUser } from '@/components/analytics/identify-user'
import { ThemeProvider } from '@/components/theme/theme-provider'

export function Providers({ children }: { children: React.ReactNode }) {
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
