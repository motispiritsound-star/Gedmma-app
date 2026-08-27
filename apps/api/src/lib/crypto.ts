import { createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';

/** Six-digit numeric code, the format Moroccan users expect from an SMS. */
export function generateOtpCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, '0');
}

export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

/** Constant-time comparison of two hex digests. */
export function hashesEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a, 'hex');
  const bufferB = Buffer.from(b, 'hex');
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}

export function generateOpaqueToken(bytes = 48): string {
  return randomBytes(bytes).toString('base64url');
}

const REFERENCE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

/**
 * Short job reference like `KH-7F2K9M`, avoiding characters that are easy to
 * misread aloud over the phone (0/O, 1/I).
 */
export function generateJobReference(): string {
  let suffix = '';
  for (let i = 0; i < 6; i += 1) {
    suffix += REFERENCE_ALPHABET.charAt(randomInt(0, REFERENCE_ALPHABET.length));
  }
  return `KH-${suffix}`;
}

/** Sequential-looking invoice reference, e.g. `KH-2026-000418`. */
export function invoiceReference(year: number, sequence: number): string {
  return `KH-${year}-${sequence.toString().padStart(6, '0')}`;
}
