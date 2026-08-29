import {
  createHash,
  createHmac,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'node:crypto'
import { promisify } from 'node:util'

const scrypt = promisify(scryptCallback) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
) => Promise<Buffer>

/**
 * Password hashing uses Node's built-in scrypt: memory-hard, no native
 * dependency to compile, and part of the platform's supported surface.
 * Format: `scrypt$N$r$p$<salt-b64>$<hash-b64>`.
 */
const SCRYPT_N = 16384
const SCRYPT_R = 8
const SCRYPT_P = 1
const KEY_LENGTH = 64

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  const derived = await scrypt(password.normalize('NFKC'), salt, KEY_LENGTH)
  return ['scrypt', SCRYPT_N, SCRYPT_R, SCRYPT_P, salt.toString('base64'), derived.toString('base64')].join('$')
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$')
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false
  const salt = Buffer.from(parts[4] ?? '', 'base64')
  const expected = Buffer.from(parts[5] ?? '', 'base64')
  if (salt.length === 0 || expected.length === 0) return false
  const derived = await scrypt(password.normalize('NFKC'), salt, expected.length)
  return timingSafeEqual(derived, expected)
}

/** URL-safe random token, used for session and verification tokens. */
export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url')
}

/** Tokens are stored hashed so a database leak does not hand over sessions. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function sha256(input: string | Buffer): string {
  return createHash('sha256').update(input).digest('hex')
}

/** One-way, salted hash of an IP address for rate limiting and audit trails. */
export function hashIp(ip: string | null | undefined, secret: string): string | null {
  if (!ip) return null
  return createHmac('sha256', secret).update(ip).digest('hex').slice(0, 32)
}

export function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url')
}

export function verifySignature(payload: string, signature: string, secret: string): boolean {
  const expected = Buffer.from(sign(payload, secret))
  const actual = Buffer.from(signature)
  if (expected.length !== actual.length) return false
  return timingSafeEqual(expected, actual)
}

export function constantTimeEquals(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}
