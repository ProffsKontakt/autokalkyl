import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Session replay configuration
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],

  // Filter out common noise errors
  ignoreErrors: [
    'ResizeObserver loop',
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection',
    /Loading chunk \d+ failed/,
    'Failed to fetch',
    'NetworkError',
    'AbortError',
  ],

  // Only enable in production with DSN configured
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
})
