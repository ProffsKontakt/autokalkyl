// src/lib/webhooks/n8n.ts

/**
 * Generic N8N webhook trigger.
 *
 * Fire-and-forget pattern: logs errors but never throws.
 * Webhook failure should never block user actions.
 */
export async function triggerN8NWebhook(
  webhookType: string,
  payload: Record<string, unknown>
): Promise<void> {
  // Map webhook types to environment variable names
  const webhookUrlMap: Record<string, string | undefined> = {
    'margin-alert': process.env.N8N_MARGIN_ALERT_WEBHOOK_URL,
    'lead-notification': process.env.N8N_LEAD_NOTIFICATION_WEBHOOK_URL,
    'password-reset': process.env.N8N_PASSWORD_RESET_WEBHOOK_URL,
  }

  const webhookUrl = webhookUrlMap[webhookType]

  if (!webhookUrl) {
    // Dev mode: log to console instead
    console.log(`[N8N] ${webhookType} (webhook not configured):`, payload)
    return
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.N8N_WEBHOOK_SECRET && {
          'X-Webhook-Secret': process.env.N8N_WEBHOOK_SECRET,
        }),
      },
      body: JSON.stringify({
        ...payload,
        webhookType,
        timestamp: new Date().toISOString(),
        source: 'kalkyla',
        environment: process.env.NODE_ENV,
      }),
    })

    if (!response.ok) {
      console.error(`[N8N] ${webhookType} webhook failed: ${response.status} ${response.statusText}`)
    } else {
      console.log(`[N8N] ${webhookType} webhook sent successfully`)
    }
  } catch (error) {
    // Fire-and-forget: log but don't throw
    console.error(`[N8N] ${webhookType} webhook error:`, error)
  }
}

export interface MarginAlertPayload {
  eventType: 'calculation_saved'
  calculationId: string
  orgId: string
  orgName: string
  closerId: string
  closerName: string
  closerEmail: string
  customerName: string
  batteryName: string
  totalPriceExVat: number
  batteryCostPrice: number
  installerFixedCut: number
  marginSek: number
  threshold: number
  shareUrl: string | null
  createdAt: string
  viewCount: number
}

/**
 * Trigger margin alert webhook to N8N.
 *
 * Fire-and-forget pattern: logs errors but never throws.
 * Webhook failure should never block user actions.
 */
export async function triggerMarginAlert(payload: MarginAlertPayload): Promise<void> {
  const webhookUrl = process.env.N8N_MARGIN_ALERT_WEBHOOK_URL

  if (!webhookUrl) {
    // Dev mode: log to console instead
    console.log('[N8N] Margin alert (webhook not configured):', {
      org: payload.orgName,
      closer: payload.closerName,
      customer: payload.customerName,
      margin: payload.marginSek,
      threshold: payload.threshold,
    })
    return
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.N8N_WEBHOOK_SECRET && {
          'X-Webhook-Secret': process.env.N8N_WEBHOOK_SECRET,
        }),
      },
      body: JSON.stringify({
        ...payload,
        timestamp: new Date().toISOString(),
        source: 'kalkyla',
        environment: process.env.NODE_ENV,
      }),
    })

    if (!response.ok) {
      console.error(`[N8N] Webhook failed: ${response.status} ${response.statusText}`)
    } else {
      console.log(`[N8N] Margin alert sent for calculation ${payload.calculationId}`)
    }
  } catch (error) {
    // Fire-and-forget: log but don't throw
    console.error('[N8N] Webhook error:', error)
  }
}
