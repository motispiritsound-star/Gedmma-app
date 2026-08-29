import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * Session handling.
 *
 * The cookie carries a random 32-byte token; only its SHA-256 hash reaches the
 * database, so a database dump cannot be replayed as a login. A second random
 * value is issued as a CSRF token and must be echoed in a header on every
 * state-changing request (double submit, with the cookie half httpOnly).
 */
export const SESSION_COOKIE = 'ff_session';
export const CSRF_COOKIE = 'ff_csrf';
export const CSRF_HEADER = 'x-focusfamily-csrf';
export const SESSION_TTL_DAYS = 30;

export function createToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('base64url');
}

export function safeEquals(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export interface CookieOptions {
  readonly secure: boolean;
  readonly domain?: string | undefined;
}

export function sessionCookieOptions(options: CookieOptions) {
  return {
    path: '/',
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: options.secure,
    domain: options.domain,
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
  };
}

export function csrfCookieOptions(options: CookieOptions) {
  return {
    path: '/',
    // Readable by the client so it can echo the value back in the header.
    httpOnly: false,
    sameSite: 'lax' as const,
    secure: options.secure,
    domain: options.domain,
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
  };
}

export function serializeCookie(
  name: string,
  value: string,
  options: {
    path: string;
    httpOnly: boolean;
    sameSite: 'lax' | 'strict' | 'none';
    secure: boolean;
    domain?: string | undefined;
    maxAge: number;
  },
): string {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    `Path=${options.path}`,
    `Max-Age=${options.maxAge}`,
    `SameSite=${options.sameSite[0]?.toUpperCase()}${options.sameSite.slice(1)}`,
  ];
  if (options.httpOnly) parts.push('HttpOnly');
  if (options.secure) parts.push('Secure');
  if (options.domain) parts.push(`Domain=${options.domain}`);
  return parts.join('; ');
}

export function clearCookie(name: string, secure: boolean): string {
  return `${name}=; Path=/; Max-Age=0; SameSite=Lax${secure ? '; Secure' : ''}`;
}

export function parseCookies(header: string | undefined): Record<string, string> {
  if (!header) return {};
  const out: Record<string, string> = {};
  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index === -1) continue;
    const key = part.slice(0, index).trim();
    if (!key) continue;
    out[key] = decodeURIComponent(part.slice(index + 1).trim());
  }
  return out;
}

/**
 * A small fixed-window limiter. Enough to blunt credential stuffing on a single
 * instance; a real deployment puts a shared limiter in front as well.
 */
export class RateLimiter {
  private readonly hits = new Map<string, { count: number; resetAt: number }>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
  ) {}

  check(key: string, now = Date.now()): { allowed: boolean; retryAfterSeconds: number } {
    const entry = this.hits.get(key);
    if (!entry || entry.resetAt <= now) {
      this.hits.set(key, { count: 1, resetAt: now + this.windowMs });
      return { allowed: true, retryAfterSeconds: 0 };
    }
    entry.count += 1;
    if (entry.count > this.limit) {
      return {
        allowed: false,
        retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000),
      };
    }
    return { allowed: true, retryAfterSeconds: 0 };
  }

  reset(): void {
    this.hits.clear();
  }
}

/** Security headers applied to every response. */
export const SECURITY_HEADERS: Readonly<Record<string, string>> = Object.freeze({
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'referrer-policy': 'no-referrer',
  'cross-origin-opener-policy': 'same-origin',
  'cross-origin-resource-policy': 'same-site',
  'permissions-policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  'cache-control': 'no-store',
});
