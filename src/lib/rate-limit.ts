/**
 * In-memory rate limiter for security-critical operations.
 *
 * Rate limits:
 * - Login: 5 attempts per email per 15 min
 * - Password reset: 3 requests per email per hour
 * - Share link password: 5 attempts per IP per 15 min
 * - API routes: 100 requests per IP per minute
 *
 * For production with multiple instances, upgrade to Redis-based rate limiting
 * using @upstash/ratelimit + @upstash/redis.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

// In-memory stores (cleared on server restart)
const stores: Map<string, Map<string, RateLimitEntry>> = new Map()

function getStore(namespace: string): Map<string, RateLimitEntry> {
  if (!stores.has(namespace)) {
    stores.set(namespace, new Map())
  }
  return stores.get(namespace)!
}

// Clean up expired entries periodically
function cleanupStore(store: Map<string, RateLimitEntry>) {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) {
      store.delete(key)
    }
  }
}

// Schedule cleanup every minute
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    for (const store of stores.values()) {
      cleanupStore(store)
    }
  }, 60000)
}

interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  limit: number
  /** Time window in milliseconds */
  windowMs: number
}

interface RateLimitResult {
  success: boolean
  remaining: number
  resetAt: number
}

/**
 * Check if a request is rate limited.
 * @param namespace - Category of rate limit (e.g., 'login', 'password-reset')
 * @param identifier - Unique identifier (e.g., email, IP hash)
 * @param config - Rate limit configuration
 * @returns Whether the request is allowed
 */
export function checkRateLimit(
  namespace: string,
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const store = getStore(namespace)
  const key = identifier.toLowerCase()
  const now = Date.now()

  const entry = store.get(key)

  // No existing entry or window expired - allow and start new window
  if (!entry || entry.resetAt < now) {
    store.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    })
    return {
      success: true,
      remaining: config.limit - 1,
      resetAt: now + config.windowMs,
    }
  }

  // Window still active - check limit
  if (entry.count >= config.limit) {
    return {
      success: false,
      remaining: 0,
      resetAt: entry.resetAt,
    }
  }

  // Increment count
  entry.count++
  return {
    success: true,
    remaining: config.limit - entry.count,
    resetAt: entry.resetAt,
  }
}

/**
 * Reset rate limit for an identifier (e.g., after successful login).
 */
export function resetRateLimit(namespace: string, identifier: string): void {
  const store = getStore(namespace)
  store.delete(identifier.toLowerCase())
}

// Pre-configured rate limiters

const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE

export const RATE_LIMITS = {
  LOGIN: { limit: 5, windowMs: 15 * MINUTE },
  PASSWORD_RESET: { limit: 3, windowMs: HOUR },
  SHARE_PASSWORD: { limit: 5, windowMs: 15 * MINUTE },
  API: { limit: 100, windowMs: MINUTE },
} as const

/**
 * Check login rate limit (5 attempts per email per 15 minutes).
 */
export function checkLoginRateLimit(email: string): RateLimitResult {
  return checkRateLimit('login', email, RATE_LIMITS.LOGIN)
}

/**
 * Reset login rate limit after successful login.
 */
export function resetLoginRateLimit(email: string): void {
  resetRateLimit('login', email)
}

/**
 * Check password reset rate limit (3 requests per email per hour).
 */
export function checkPasswordResetRateLimit(email: string): RateLimitResult {
  return checkRateLimit('password-reset', email, RATE_LIMITS.PASSWORD_RESET)
}

/**
 * Check share link password rate limit (5 attempts per IP per 15 minutes).
 */
export function checkSharePasswordRateLimit(ipHash: string): RateLimitResult {
  return checkRateLimit('share-password', ipHash, RATE_LIMITS.SHARE_PASSWORD)
}

/**
 * Check API rate limit (100 requests per IP per minute).
 */
export function checkApiRateLimit(ipHash: string): RateLimitResult {
  return checkRateLimit('api', ipHash, RATE_LIMITS.API)
}

/**
 * Hash an IP address for storage (privacy-preserving).
 */
export function hashIp(ip: string): string {
  // Simple hash for rate limiting - not cryptographically secure but sufficient
  // for rate limiting purposes and doesn't store raw IPs
  let hash = 0
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return hash.toString(16)
}
