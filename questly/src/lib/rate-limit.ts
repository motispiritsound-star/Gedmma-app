import { logger } from "./logger";

type Bucket = { count: number; resetAt: number };

/**
 * Fixed-window rate limiter held in process memory.
 *
 * Deliberately simple: the MVP runs as a single Node process. The interface is
 * the piece that matters - swapping in Redis for a multi-instance deployment
 * means replacing `consume` only. See SECURITY_AND_PRIVACY.md.
 */
export interface RateLimiter {
  consume(key: string, limit: number, windowSeconds: number): RateLimitResult;
  reset(key?: string): void;
}

export type RateLimitResult = { allowed: boolean; remaining: number; retryAfterSeconds: number };

class MemoryRateLimiter implements RateLimiter {
  private readonly buckets = new Map<string, Bucket>();

  consume(key: string, limit: number, windowSeconds: number): RateLimitResult {
    const now = Date.now();
    this.sweep(now);

    const existing = this.buckets.get(key);
    if (!existing || existing.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
      return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
    }

    existing.count += 1;
    if (existing.count > limit) {
      const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
      logger.warn("rate_limit.blocked", { key: key.split(":")[0], retryAfterSeconds });
      return { allowed: false, remaining: 0, retryAfterSeconds };
    }
    return { allowed: true, remaining: limit - existing.count, retryAfterSeconds: 0 };
  }

  reset(key?: string): void {
    if (key) this.buckets.delete(key);
    else this.buckets.clear();
  }

  private sweep(now: number): void {
    if (this.buckets.size < 5000) return;
    for (const [k, b] of this.buckets) if (b.resetAt <= now) this.buckets.delete(k);
  }
}

const globalForLimiter = globalThis as unknown as { questlyRateLimiter?: RateLimiter };

export const rateLimiter: RateLimiter = (globalForLimiter.questlyRateLimiter ??= new MemoryRateLimiter());
