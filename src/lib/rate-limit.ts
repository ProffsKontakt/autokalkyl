import { prisma } from "@/lib/db/client";
import type { AuditAction } from "@/lib/audit";

/**
 * Small in-memory sliding-window rate limiter (fast first pass, per server instance).
 * For limits that must hold across serverless instances use `dbRateLimit`.
 */
const buckets = new Map<string, number[]>();
const MAX_KEYS = 5000;

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
  buckets.delete(key);
  buckets.set(key, hits);
  if (buckets.size > MAX_KEYS) {
    // Evict expired keys first, then the oldest inserted ones.
    for (const [k, v] of buckets) {
      if (v.every((t) => t <= windowStart)) buckets.delete(k);
    }
    while (buckets.size > MAX_KEYS) {
      const oldest = buckets.keys().next().value;
      if (oldest === undefined) break;
      buckets.delete(oldest);
    }
  }
  return { ok: true, retryAfterSeconds: 0 };
}

/**
 * Database-backed limit based on the audit log (works across instances). Counts events of
 * `action` for the user in the window; the caller writes the audit event after passing.
 */
export async function dbRateLimit(userId: string, action: AuditAction, limit: number, windowMs: number): Promise<{ ok: boolean; count: number }> {
  const count = await prisma.auditEvent.count({
    where: { userId, action, createdAt: { gte: new Date(Date.now() - windowMs) } },
  });
  return { ok: count < limit, count };
}
