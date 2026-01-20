import posthog from 'posthog-js'

/**
 * Get the PostHog client instance.
 * Safe to call on server (returns undefined) or client.
 */
export function getPostHog() {
  if (typeof window === 'undefined') {
    return undefined
  }
  return posthog
}

/**
 * Check if PostHog is initialized and ready
 */
export function isPostHogReady(): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  return posthog.__loaded === true
}
