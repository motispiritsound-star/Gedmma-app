import { config } from 'dotenv'
import { beforeEach, vi } from 'vitest'
import { rateLimitStore } from '@/lib/rate-limit'

// `override` so an exported DATABASE_URL from the shell cannot point the
// suite at a development database.
config({ path: '.env.test', quiet: true, override: true })

/**
 * `next/headers` only exists inside a Next.js request. The services under test
 * use it for the session cookie and the client IP, so it is replaced here with a
 * small in-memory implementation that behaves the same way.
 */
export const testCookies = new Map<string, string>()
export const testHeaders = new Map<string, string>([
  ['x-forwarded-for', '203.0.113.10'],
  ['user-agent', 'vitest'],
  ['accept-language', 'nl-NL,nl;q=0.9'],
])

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => {
      const value = testCookies.get(name)
      return value === undefined ? undefined : { name, value }
    },
    set: (name: string | { name: string; value: string }, value?: string) => {
      if (typeof name === 'string') testCookies.set(name, value ?? '')
      else testCookies.set(name.name, name.value)
    },
    delete: (name: string) => {
      testCookies.delete(name)
    },
    has: (name: string) => testCookies.has(name),
  }),
  headers: async () => ({
    get: (name: string) => testHeaders.get(name.toLowerCase()) ?? null,
  }),
}))

vi.mock('next/cache', () => ({
  revalidatePath: () => undefined,
  revalidateTag: () => undefined,
}))

beforeEach(() => {
  testCookies.clear()
  // The limiter is per-process memory and every test shares one fake IP, so it
  // is reset between tests. Its behaviour is covered directly in the unit suite.
  rateLimitStore.clear()
})
