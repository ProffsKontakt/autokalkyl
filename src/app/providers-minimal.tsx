'use client'

import { ThemeProvider } from '@/components/theme/theme-provider'

/**
 * Minimal providers for public/unauthenticated routes.
 * No analytics, no session provider - keeps bundle light and fast.
 */
export function MinimalProviders({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>
}
