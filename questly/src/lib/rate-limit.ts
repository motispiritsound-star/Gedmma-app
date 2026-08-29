/**
 * Fixed-window rate limiter.
 *
 * The MVP keeps counters in process memory, which is correct for a single
 * instance and degrades to "per instance" when scaled horizontally. The
 * `RateLimitStore` interface exists so a Redis-backed store can be dropped in
 * without touching call sites. See SECURITY_AND_PRIVACY.md.
 */

export type RateLimitResult = {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
}

export interface RateLimitStore {
  hit(key: string, windowMs: number, limit: number): Promise<RateLimitResult>
  reset(key: string): Promise<void>
}

type Entry = { count: number; resetAt: number }

export class MemoryRateLimitStore implements RateLimitStore {
  private readonly entries = new Map<string, Entry>()

  async hit(key: string, windowMs: number, limit: number): Promise<RateLimitResult> {
    const now = Date.now()
    const existing = this.entries.get(key)
    if (!existing || existing.resetAt <= now) {
      this.entries.set(key, { count: 1, resetAt: now + windowMs })
      return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 }
    }
    existing.count += 1
    const allowed = existing.count <= limit
    return {
      allowed,
      remaining: Math.max(0, limit - existing.count),
      retryAfterSeconds: allowed ? 0 : Math.ceil((existing.resetAt - now) / 1000),
    }
  }

  async reset(key: string): Promise<void> {
    this.entries.delete(key)
  }

  /** Test helper. */
  clear(): void {
    this.entries.clear()
  }
}

const globalForLimiter = globalThis as unknown as { questlyRateLimiter?: MemoryRateLimitStore }
export const rateLimitStore: MemoryRateLimitStore =
  globalForLimiter.questlyRateLimiter ?? new MemoryRateLimitStore()
globalForLimiter.questlyRateLimiter = rateLimitStore

export const RATE_LIMITS = {
  signIn: { limit: 10, windowMs: 10 * 60 * 1000 },
  // Keyed on IP alone, so this has to tolerate a shared connection: a school,
  // a library or a household behind one NAT. Scripted abuse is stopped here;
  // e-mail verification is what stops the rest.
  register: { limit: 20, windowMs: 60 * 60 * 1000 },
  upload: { limit: 30, windowMs: 60 * 60 * 1000 },
  mutation: { limit: 240, windowMs: 60 * 1000 },
} as const

export async function enforceRateLimit(
  bucket: keyof typeof RATE_LIMITS,
  identifier: string,
  store: RateLimitStore = rateLimitStore,
): Promise<RateLimitResult> {
  const { limit, windowMs } = RATE_LIMITS[bucket]
  return store.hit(`${bucket}:${identifier}`, windowMs, limit)
}
