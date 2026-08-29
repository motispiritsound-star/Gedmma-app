import { RateLimitError } from './errors';
import { env } from './env';

interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * In-process fixed-window limiter. Deliberately behind a narrow interface: a
 * multi-instance deployment swaps this for Redis without touching call sites.
 */
const buckets = new Map<string, Bucket>();

export interface RateLimitRule {
  /** Requests allowed inside the window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

export const RATE_LIMITS = {
  login: { limit: 8, windowMs: 15 * 60_000 },
  register: { limit: 5, windowMs: 60 * 60_000 },
  passwordReset: { limit: 5, windowMs: 60 * 60_000 },
  booking: { limit: 30, windowMs: 60_000 },
  search: { limit: 120, windowMs: 60_000 },
  webhook: { limit: 300, windowMs: 60_000 },
  upload: { limit: 20, windowMs: 60 * 60_000 },
  review: { limit: 10, windowMs: 60 * 60_000 },
} as const satisfies Record<string, RateLimitRule>;

export type RateLimitName = keyof typeof RATE_LIMITS;

export function consumeRateLimit(name: RateLimitName, key: string): void {
  if (!env().RATE_LIMIT_ENABLED) return;
  const rule = RATE_LIMITS[name];
  const bucketKey = `${name}:${key}`;
  const now = Date.now();
  const existing = buckets.get(bucketKey);

  if (!existing || existing.resetAt <= now) {
    buckets.set(bucketKey, { count: 1, resetAt: now + rule.windowMs });
    return;
  }
  if (existing.count >= rule.limit) {
    throw new RateLimitError(Math.ceil((existing.resetAt - now) / 1000));
  }
  existing.count += 1;
}

/** Test helper. */
export function resetRateLimits(): void {
  buckets.clear();
}
