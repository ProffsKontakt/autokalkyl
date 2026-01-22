'use client'

import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { useEffect } from 'react'

export function PHProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com'

    // Only initialize if key is provided and not already loaded
    if (typeof window !== 'undefined' && key && !posthog.__loaded) {
      posthog.init(key, {
        api_host: host,
        // Manual pageview tracking for Next.js App Router (handled by PostHogPageview component)
        capture_pageview: false,
        // Track when users leave the page
        capture_pageleave: true,
        // Only create person profiles for identified users (logged in)
        person_profiles: 'identified_only',
        // Autocapture clicks, form submits, etc.
        autocapture: true,
        // Session recordings configuration
        disable_session_recording: false,
        session_recording: {
          // Mask all text inputs for privacy (passwords, etc.)
          maskAllInputs: true,
          // Don't mask text content by default
          maskTextSelector: '[data-posthog-mask]',
        },
        // Disable feature flags to prevent 401 errors (we don't use them yet)
        // Session recordings still work because they use a separate endpoint
        advanced_disable_feature_flags: true,
        advanced_disable_feature_flags_on_first_load: true,
        // Persistence settings
        persistence: 'localStorage+cookie',
        // Cross-subdomain tracking for kalkyla.se
        cross_subdomain_cookie: true,
        // Security settings
        secure_cookie: true,
        // Respect Do Not Track browser setting
        respect_dnt: true,
        // Loaded callback
        loaded: (posthog) => {
          // In development, enable debug mode
          if (process.env.NODE_ENV === 'development') {
            posthog.debug()
          }
        },
      })
    }
  }, [])

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}
