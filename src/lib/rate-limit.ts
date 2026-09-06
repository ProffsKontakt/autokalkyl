/**
 * Small in-memory sliding-window rate limiter.
 *
 * Good enough for login/registration/waitlist abuse protection on a single serverless
 * instance. For strict global limits, put a WAF rule or Upstash in front.
 */
const buckets = new Map<string, number[]>();

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const windowStart = now - windowMs;
  const hits = (buckets.get(key) ?? []).filter((t) => t > windowStart);
  if (hits.length >= limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((hits[0] + windowMs - now) / 1000));
    buckets.set(key, hits);
    return { ok: false, retryAfterSeconds };
  }
  hits.push(now);
  buckets.set(key, hits);
  // Opportunistic cleanup
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (v.every((t) => t <= windowStart)) buckets.delete(k);
    }
  }
  return { ok: true, retryAfterSeconds: 0 };
}
