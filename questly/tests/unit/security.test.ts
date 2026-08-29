import { describe, expect, it } from 'vitest'
import { hashPassword, verifyPassword, hashToken, randomToken, sign, verifySignature } from '@/lib/crypto'
import { MemoryRateLimitStore, RATE_LIMITS, enforceRateLimit } from '@/lib/rate-limit'
import { sniffImageType, validateImageUpload } from '@/modules/media/validation'
import { assertSafeKey } from '@/modules/media/storage'
import { passwordSchema } from '@/modules/auth/schemas'
import { nicknameSchema } from '@/modules/families/schemas'

describe('password hashing', () => {
  it('verifies a correct password and rejects a wrong one', async () => {
    const hash = await hashPassword('een heel lang wachtwoord')
    expect(await verifyPassword('een heel lang wachtwoord', hash)).toBe(true)
    expect(await verifyPassword('iets anders', hash)).toBe(false)
  })

  it('salts, so the same password hashes differently every time', async () => {
    expect(await hashPassword('zelfde wachtwoord')).not.toBe(await hashPassword('zelfde wachtwoord'))
  })

  it('rejects a malformed stored hash instead of throwing', async () => {
    expect(await verifyPassword('anything', 'not-a-hash')).toBe(false)
  })
})

describe('password policy', () => {
  it('requires at least twelve characters', () => {
    expect(passwordSchema.safeParse('kort').success).toBe(false)
    expect(passwordSchema.safeParse('ditiseenlangwachtwoord').success).toBe(true)
  })

  it('rejects the most common guesses', () => {
    expect(passwordSchema.safeParse('password1234').success).toBe(false)
  })
})

describe('tokens', () => {
  it('stores only a hash of a session token', () => {
    const token = randomToken()
    const hash = hashToken(token)
    expect(hash).not.toContain(token)
    expect(hashToken(token)).toBe(hash)
  })

  it('verifies its own signatures and rejects tampering', () => {
    const signature = sign('evidence-1.family-1.999', 'secret')
    expect(verifySignature('evidence-1.family-1.999', signature, 'secret')).toBe(true)
    expect(verifySignature('evidence-1.family-2.999', signature, 'secret')).toBe(false)
    expect(verifySignature('evidence-1.family-1.999', signature, 'other-secret')).toBe(false)
  })
})

describe('rate limiting', () => {
  it('blocks after the configured number of attempts', async () => {
    const store = new MemoryRateLimitStore()
    const { limit } = RATE_LIMITS.signIn
    const results = []
    for (let attempt = 0; attempt < limit + 2; attempt += 1) {
      results.push(await enforceRateLimit('signIn', 'tester', store))
    }
    expect(results.slice(0, limit).every((result) => result.allowed)).toBe(true)
    expect(results[limit]?.allowed).toBe(false)
    expect(results[limit + 1]?.retryAfterSeconds).toBeGreaterThan(0)
  })

  it('keeps separate counters per identifier', async () => {
    const store = new MemoryRateLimitStore()
    for (let attempt = 0; attempt < RATE_LIMITS.signIn.limit + 1; attempt += 1) {
      await enforceRateLimit('signIn', 'first', store)
    }
    expect((await enforceRateLimit('signIn', 'second', store)).allowed).toBe(true)
  })
})

describe('upload validation', () => {
  const jpeg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(64)])
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    Buffer.alloc(64),
  ])

  it('accepts real images by their magic bytes', () => {
    expect(sniffImageType(jpeg)).toBe('image/jpeg')
    expect(sniffImageType(png)).toBe('image/png')
    expect(validateImageUpload(jpeg).extension).toBe('jpg')
  })

  it('rejects a script that claims to be an image', () => {
    const hostile = Buffer.from('<script>alert(1)</script>'.padEnd(64, ' '))
    expect(sniffImageType(hostile)).toBeNull()
    expect(() => validateImageUpload(hostile)).toThrowError(/JPEG, PNG and WebP/)
  })

  it('rejects an empty file', () => {
    expect(() => validateImageUpload(Buffer.alloc(0))).toThrowError(/empty/)
  })
})

describe('storage keys', () => {
  it('rejects traversal attempts', () => {
    expect(() => assertSafeKey('../../etc/passwd')).toThrowError(/Unsafe/)
    expect(() => assertSafeKey('/absolute/path')).toThrowError(/Unsafe/)
    expect(() => assertSafeKey('families/abc/completions/def/photo.jpg')).not.toThrow()
  })
})

describe('child nickname policy', () => {
  it('keeps identifying details out of a nickname', () => {
    expect(nicknameSchema.safeParse('kind@example.com').success).toBe(false)
    expect(nicknameSchema.safeParse('https://example.com').success).toBe(false)
    expect(nicknameSchema.safeParse('Noor').success).toBe(true)
  })
})
