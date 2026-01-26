/**
 * Security audit logging.
 *
 * Logs security-relevant events for monitoring and compliance.
 * In production, these can be sent to Sentry, a SIEM, or stored in database.
 */

export enum SecurityEventType {
  // Authentication
  LOGIN_SUCCESS = 'auth.login.success',
  LOGIN_FAILED = 'auth.login.failed',
  LOGIN_RATE_LIMITED = 'auth.login.rate_limited',
  LOGOUT = 'auth.logout',

  // Password
  PASSWORD_RESET_REQUESTED = 'auth.password_reset.requested',
  PASSWORD_RESET_SUCCESS = 'auth.password_reset.success',
  PASSWORD_RESET_FAILED = 'auth.password_reset.failed',
  PASSWORD_RESET_RATE_LIMITED = 'auth.password_reset.rate_limited',
  PASSWORD_CHANGED = 'auth.password.changed',

  // User management
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  USER_DEACTIVATED = 'user.deactivated',
  USER_ROLE_CHANGED = 'user.role_changed',

  // Organization
  ORG_CREATED = 'org.created',
  ORG_UPDATED = 'org.updated',

  // Share links
  SHARE_PASSWORD_FAILED = 'share.password.failed',
  SHARE_PASSWORD_RATE_LIMITED = 'share.password.rate_limited',

  // API
  API_RATE_LIMITED = 'api.rate_limited',
}

interface SecurityEvent {
  type: SecurityEventType
  userId?: string
  email?: string
  orgId?: string
  targetUserId?: string
  targetOrgId?: string
  ipHash?: string
  userAgent?: string
  metadata?: Record<string, unknown>
}

/**
 * Log a security event.
 *
 * In development, logs to console.
 * In production, sends to Sentry or external service.
 */
export async function logSecurityEvent(event: SecurityEvent): Promise<void> {
  const timestamp = new Date().toISOString()
  const logEntry = {
    timestamp,
    ...event,
  }

  // Always log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[SECURITY]', JSON.stringify(logEntry, null, 2))
    return
  }

  // In production, log to console (will be captured by Vercel/hosting logs)
  // and optionally send to Sentry
  console.log('[SECURITY]', JSON.stringify(logEntry))

  // Send to Sentry if available
  if (typeof window === 'undefined') {
    try {
      const Sentry = await import('@sentry/nextjs')
      Sentry.addBreadcrumb({
        category: 'security',
        message: event.type,
        level: event.type.includes('failed') || event.type.includes('rate_limited')
          ? 'warning'
          : 'info',
        data: {
          userId: event.userId,
          email: event.email,
          orgId: event.orgId,
          ...event.metadata,
        },
      })

      // For critical events, also capture as event
      if (
        event.type === SecurityEventType.LOGIN_RATE_LIMITED ||
        event.type === SecurityEventType.PASSWORD_RESET_RATE_LIMITED ||
        event.type === SecurityEventType.API_RATE_LIMITED
      ) {
        Sentry.captureMessage(`Security: ${event.type}`, {
          level: 'warning',
          extra: logEntry,
        })
      }
    } catch {
      // Sentry not available, ignore
    }
  }
}

/**
 * Log a user action for audit trail.
 */
export async function logUserAction(
  userId: string,
  action: string,
  details: Record<string, unknown>
): Promise<void> {
  await logSecurityEvent({
    type: action as SecurityEventType,
    userId,
    metadata: details,
  })
}
