import {
  createHash,
  createHmac,
  randomBytes,
  randomInt,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
) => Promise<Buffer>;

/** scrypt parameters. N=2^15 is comfortably above the 2024 OWASP floor. */
const KEY_LENGTH = 64;
const SALT_BYTES = 16;

export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const derived = await scrypt(plain.normalize('NFKC'), salt, KEY_LENGTH);
  return `scrypt$1$${salt.toString('base64')}$${derived.toString('base64')}`;
}

export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 4 || parts[0] !== 'scrypt') return false;
  const salt = Buffer.from(parts[2] ?? '', 'base64');
  const expected = Buffer.from(parts[3] ?? '', 'base64');
  if (salt.length === 0 || expected.length === 0) return false;
  const derived = await scrypt(plain.normalize('NFKC'), salt, expected.length);
  return safeEqual(derived, expected);
}

export function safeEqual(a: Buffer | string, b: Buffer | string): boolean {
  const left = Buffer.isBuffer(a) ? a : Buffer.from(a, 'utf8');
  const right = Buffer.isBuffer(b) ? b : Buffer.from(b, 'utf8');
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function hmac(secret: string, value: string): string {
  return createHmac('sha256', secret).update(value).digest('hex');
}

/** 256 bits of entropy, URL-safe. Used for session tokens. */
export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

/**
 * Crockford base32 without I, L, O and U — the characters a child is most
 * likely to misread when a code is being read aloud from a box lid.
 */
const CODE_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/**
 * Activation codes: WB-XXXX-XXXX-XXXX. Twelve characters of a 32-symbol
 * alphabet is 60 bits — far beyond guessable, and short enough to type.
 */
export function generateActivationCode(): string {
  let body = '';
  for (let i = 0; i < 12; i += 1) {
    body += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }
  return `WB-${body.slice(0, 4)}-${body.slice(4, 8)}-${body.slice(8, 12)}`;
}

/** Hashes an IP for rate limiting and audit without storing the address itself. */
export function hashIp(ip: string | null | undefined, pepper: string): string | null {
  if (!ip) return null;
  return hmac(pepper, ip).slice(0, 32);
}
