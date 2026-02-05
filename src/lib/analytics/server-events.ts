/**
 * Type-safe server-side event capture functions.
 *
 * These functions provide reliable tracking of business-critical events
 * that must not be blocked by ad blockers. They should be called from
 * server actions and API routes.
 *
 * Event naming convention: snake_case (e.g., calculation_created)
 * Property naming convention: snake_case (e.g., calculation_id, org_id)
 */

import { captureServerEvent } from './posthog-server'

/**
 * Track when a new calculation is created.
 * Called from saveDraft action when creating a new calculation.
 */
export async function trackCalculationCreated(
  userId: string,
  calculationId: string,
  orgId: string,
  customerName: string
): Promise<void> {
  await captureServerEvent(userId, 'calculation_created', {
    calculation_id: calculationId,
    org_id: orgId,
    closer_id: userId,
    customer_name: customerName,
    $set: {
      last_calculation_at: new Date().toISOString(),
    },
  })
}

/**
 * Track when a calculation is updated.
 * Called from saveDraft action when updating an existing calculation.
 */
export async function trackCalculationUpdated(
  userId: string,
  calculationId: string,
  orgId: string,
  status: string
): Promise<void> {
  await captureServerEvent(userId, 'calculation_updated', {
    calculation_id: calculationId,
    org_id: orgId,
    closer_id: userId,
    status,
  })
}

/**
 * Track when a calculation is deleted.
 * Called from deleteCalculation action.
 */
export async function trackCalculationDeleted(
  userId: string,
  calculationId: string,
  orgId: string
): Promise<void> {
  await captureServerEvent(userId, 'calculation_deleted', {
    calculation_id: calculationId,
    org_id: orgId,
    closer_id: userId,
  })
}

/**
 * Track when a calculation is viewed.
 *
 * For prospects (anonymous viewers), uses calc_{calculationId} as distinctId
 * to enable per-calculation engagement tracking.
 *
 * For authenticated users (closer, admin), uses their actual user ID.
 */
export async function trackCalculationViewed(
  calculationId: string,
  orgId: string,
  closerId: string,
  viewerType: 'prospect' | 'closer' | 'admin'
): Promise<void> {
  // Use calculation ID as distinct_id for prospect views (anonymous)
  // This allows correlating multiple prospect events on the same calculation
  const distinctId =
    viewerType === 'prospect' ? `calc_${calculationId}` : closerId

  await captureServerEvent(distinctId, 'calculation_viewed', {
    calculation_id: calculationId,
    org_id: orgId,
    closer_id: closerId,
    viewer_type: viewerType,
  })
}

/**
 * Track when a share link is generated for a calculation.
 * Called from generateShareLink action.
 */
export async function trackShareLinkGenerated(
  userId: string,
  calculationId: string,
  orgId: string,
  hasPassword: boolean,
  hasExpiration: boolean
): Promise<void> {
  await captureServerEvent(userId, 'share_link_generated', {
    calculation_id: calculationId,
    org_id: orgId,
    closer_id: userId,
    has_password: hasPassword,
    has_expiration: hasExpiration,
  })
}

/**
 * Track when the calculation wizard is completed.
 * Called at the final step of the wizard flow.
 */
export async function trackWizardCompleted(
  userId: string,
  calculationId: string,
  orgId: string,
  batteryCount: number
): Promise<void> {
  await captureServerEvent(userId, 'wizard_completed', {
    calculation_id: calculationId,
    org_id: orgId,
    closer_id: userId,
    battery_count: batteryCount,
  })
}
