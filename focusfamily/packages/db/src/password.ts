import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
) => Promise<Buffer>;

/**
 * Password hashing with scrypt from the Node standard library.
 *
 * scrypt is memory-hard and needs no native dependency, which keeps the build
 * portable. The parameters are stored in the hash string itself so they can be
 * raised later without invalidating existing accounts.
 */
const N = 16_384;
const KEY_LENGTH = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scrypt(password.normalize('NFKC'), salt, KEY_LENGTH);
  return ['scrypt', N, 8, 1, salt.toString('base64'), derived.toString('base64')].join('$');
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const salt = Buffer.from(parts[4] ?? '', 'base64');
  const expected = Buffer.from(parts[5] ?? '', 'base64');
  if (salt.length === 0 || expected.length === 0) return false;
  const derived = await scrypt(password.normalize('NFKC'), salt, expected.length);
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

/** Minimum we enforce on sign-up. Length beats punctuation gymnastics. */
export const MIN_PASSWORD_LENGTH = 12;

export function passwordIssues(password: string): string[] {
  const issues: string[] = [];
  if (password.length < MIN_PASSWORD_LENGTH) issues.push('password.too_short');
  if (/^\d+$/.test(password)) issues.push('password.only_digits');
  if (/^(.)\1+$/.test(password)) issues.push('password.repeated_character');
  return issues;
}
