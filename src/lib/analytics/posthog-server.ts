/**
 * Server-side PostHog client singleton for reliable event capture.
 *
 * This module provides server-side event tracking that bypasses ad blockers
 * and ensures business-critical events are captured reliably.
 *
 * CRITICAL for serverless (Vercel):
 * - flushAt: 1 - Flush after every event (no batching)
 * - flushInterval: 0 - No periodic flushing
 * - Always call shutdown() after capturing to ensure delivery
 */

import { PostHog } from 'posthog-node'

let posthogClient: PostHog | null = null

/**
 * Get the singleton PostHog server-side client.
 * Creates a new instance on first call, returns existing instance thereafter.
 */
export function getServerPostHog(): PostHog {
  if (!posthogClient) {
    const apiKey = process.env.POSTHOG_API_KEY

    if (!apiKey) {
      throw new Error(
        'POSTHOG_API_KEY environment variable is not set. ' +
          'Server-side analytics will not work without it.'
      )
    }

    posthogClient = new PostHog(apiKey, {
      host: process.env.POSTHOG_HOST || 'https://eu.i.posthog.com',
      // Critical for Next.js serverless: flush immediately, no batching
      flushAt: 1,
      flushInterval: 0,
    })
  }

  return posthogClient
}

/**
 * Capture a server-side event with automatic flush.
 *
 * @param distinctId - The user ID or anonymous identifier
 * @param event - The event name (e.g., 'calculation_created')
 * @param properties - Event properties including any $set operations
 *
 * @example
 * ```ts
 * await captureServerEvent(
 *   session.user.id,
 *   'calculation_created',
 *   { calculation_id: calcId, org_id: orgId }
 * )
 * ```
 */
export async function captureServerEvent(
  distinctId: string,
  event: string,
  properties: Record<string, unknown>
): Promise<void> {
  const client = getServerPostHog()

  client.capture({
    distinctId,
    event,
    properties,
  })

  // Critical: shutdown to flush in serverless environment
  // Without this, events will be lost when the function terminates
  await client.shutdown()
}
