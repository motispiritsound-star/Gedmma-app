import { createHash, createHmac, randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCb) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>;

const SCRYPT_KEYLEN = 64;

/**
 * Password hashing with scrypt (memory-hard, in the Node standard library, so
 * the project has no native build step). Format: scrypt$<saltHex>$<hashHex>.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, SCRYPT_KEYLEN);
  return `scrypt$${salt.toString('hex')}$${derived.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, saltHex, hashHex] = stored.split('$');
  if (scheme !== 'scrypt' || !saltHex || !hashHex) return false;
  const derived = await scrypt(password, Buffer.from(saltHex, 'hex'), SCRYPT_KEYLEN);
  const expected = Buffer.from(hashHex, 'hex');
  if (expected.length !== derived.length) return false;
  return timingSafeEqual(derived, expected);
}

/** Opaque, URL-safe secret. Returned once; only its digest is persisted. */
export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function hmac(secret: string, payload: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

export function safeEquals(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/** IP addresses are personal data; we only ever store a keyed digest. */
export function hashIp(ip: string | null | undefined, secret: string): string | null {
  if (!ip) return null;
  return hmac(secret, `ip:${ip}`).slice(0, 32);
}

/** Human-friendly, non-guessable reference such as BK-7HQ2M4XR. */
export function reference(prefix: string): string {
  const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const raw = randomBytes(8);
  let out = '';
  for (const byte of raw) out += alphabet[byte % alphabet.length];
  return `${prefix}-${out}`;
}
