import { getPostHog } from './posthog'

/**
 * Track when a customer views a shared calculation
 */
export function trackCalculationViewed(calculationId: string, orgSlug: string) {
  const posthog = getPostHog()
  if (!posthog) return

  posthog.capture('calculation_viewed', {
    calculationId,
    orgSlug,
  })
}

/**
 * Track when a customer adjusts the simulator (consumption profile)
 */
export function trackSimulatorAdjusted(
  calculationId: string,
  month: number,
  hour: number,
  oldValue: number,
  newValue: number
) {
  const posthog = getPostHog()
  if (!posthog) return

  posthog.capture('simulator_adjusted', {
    calculationId,
    month,
    hour,
    oldValue,
    newValue,
    delta: newValue - oldValue,
  })
}

/**
 * Track scroll depth on public calculation pages
 */
export function trackScrollDepth(calculationId: string, depth: number) {
  const posthog = getPostHog()
  if (!posthog) return

  posthog.capture('scroll_depth', {
    calculationId,
    depth, // 0-100 percentage
  })
}

/**
 * Track time spent on a public calculation page
 */
export function trackTimeOnPage(calculationId: string, seconds: number) {
  const posthog = getPostHog()
  if (!posthog) return

  posthog.capture('time_on_page', {
    calculationId,
    seconds,
  })
}
