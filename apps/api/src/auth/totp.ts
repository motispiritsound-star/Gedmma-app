/**
 * TOTP volgens RFC 6238: SHA-1, zes cijfers, stap van 30 seconden.
 *
 * Bewust zelf geimplementeerd: het algoritme past in vijftig regels, en dit
 * scheelt een afhankelijkheid in de authenticatieketen — de plek waar een
 * gecompromitteerde dependency de meeste schade doet.
 */
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function nieuwGeheim(bytes = 20): string {
  return naarBase32(randomBytes(bytes));
}

export function naarBase32(buffer: Buffer): string {
  let bits = '';
  for (const byte of buffer) bits += byte.toString(2).padStart(8, '0');
  let uitkomst = '';
  for (let i = 0; i + 5 <= bits.length; i += 5) {
    uitkomst += BASE32[Number.parseInt(bits.slice(i, i + 5), 2)];
  }
  return uitkomst;
}

export function vanBase32(tekst: string): Buffer {
  const schoon = tekst.toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = '';
  for (const teken of schoon) {
    const index = BASE32.indexOf(teken);
    if (index < 0) throw new Error('Ongeldig base32-teken in het TOTP-geheim.');
    bits += index.toString(2).padStart(5, '0');
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(Number.parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

/** Berekent de code voor een tijdstip (standaard: nu). */
export function berekenCode(geheim: string, opTijdstip = Date.now(), stapSeconden = 30, cijfers = 6): string {
  const teller = Math.floor(opTijdstip / 1000 / stapSeconden);
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(teller));
  const hmac = createHmac('sha1', vanBase32(geheim)).update(buffer).digest();
  const offset = (hmac[hmac.length - 1] ?? 0) & 0x0f;
  const binair =
    (((hmac[offset] ?? 0) & 0x7f) << 24) |
    (((hmac[offset + 1] ?? 0) & 0xff) << 16) |
    (((hmac[offset + 2] ?? 0) & 0xff) << 8) |
    ((hmac[offset + 3] ?? 0) & 0xff);
  return (binair % 10 ** cijfers).toString().padStart(cijfers, '0');
}

/**
 * Controleert een code met een venster van een stap ervoor en erna, zodat een
 * klok die een halve minuut afwijkt geen probleem is.
 */
export function controleerCode(geheim: string, code: string, opTijdstip = Date.now(), venster = 1): boolean {
  const schoon = code.replace(/\s/g, '');
  if (!/^\d{6}$/.test(schoon)) return false;
  for (let stap = -venster; stap <= venster; stap++) {
    const verwacht = berekenCode(geheim, opTijdstip + stap * 30_000);
    if (verwacht.length === schoon.length && timingSafeEqual(Buffer.from(verwacht), Buffer.from(schoon))) {
      return true;
    }
  }
  return false;
}

/** De otpauth-URI voor de QR-code in een authenticator-app. */
export function otpauthUri(geheim: string, email: string, uitgever = 'Gedmma'): string {
  const label = encodeURIComponent(`${uitgever}:${email}`);
  const parameters = new URLSearchParams({
    secret: geheim,
    issuer: uitgever,
    algorithm: 'SHA1',
    digits: '6',
    period: '30',
  });
  return `otpauth://totp/${label}?${parameters.toString()}`;
}

/** Tien eenmalige herstelcodes in het formaat XXXX-XXXX. */
export function nieuweHerstelcodes(aantal = 10): string[] {
  const alfabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const codes: string[] = [];
  for (let i = 0; i < aantal; i++) {
    const bytes = randomBytes(8);
    let code = '';
    for (const [index, byte] of bytes.entries()) {
      if (index === 4) code += '-';
      code += alfabet[byte % alfabet.length];
    }
    codes.push(code);
  }
  return codes;
}
