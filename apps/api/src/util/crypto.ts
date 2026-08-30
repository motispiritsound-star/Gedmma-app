/**
 * Versleuteling van velden die niet in leesbare vorm in de database mogen staan:
 * MFA-secrets, banktokens en API-geheimen. AES-256-GCM met een sleutelversie,
 * zodat rotatie mogelijk is zonder downtime.
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { config } from '../config.ts';

const HUIDIGE_VERSIE = 'v1';

function sleutel(): Buffer {
  const ruw = config.beveiliging.dataSleutel;
  const buffer = /^[0-9a-f]{64}$/i.test(ruw) ? Buffer.from(ruw, 'hex') : Buffer.from(ruw, 'base64');
  if (buffer.length !== 32) {
    throw new Error(
      'DATA_ENCRYPTION_KEY moet 32 bytes zijn (64 hex-tekens of base64). Zie .env.example.',
    );
  }
  return buffer;
}

/** Versleutelt tekst; het resultaat is zelfbeschrijvend: versie.iv.tag.data. */
export function versleutel(klaartekst: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', sleutel(), iv);
  const data = Buffer.concat([cipher.update(klaartekst, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [HUIDIGE_VERSIE, iv.toString('base64url'), tag.toString('base64url'), data.toString('base64url')].join('.');
}

export function ontsleutel(versleuteld: string): string {
  const [versie, ivB64, tagB64, dataB64] = versleuteld.split('.');
  if (versie !== HUIDIGE_VERSIE || !ivB64 || !tagB64 || !dataB64) {
    throw new Error('Versleutelde waarde heeft een onbekend formaat.');
  }
  const decipher = createDecipheriv('aes-256-gcm', sleutel(), Buffer.from(ivB64, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64url')), decipher.final()]).toString('utf8');
}

/** SHA-256 als hex; gebruikt voor tokenhashes en de audit-ketting. */
export function sha256(waarde: string | Buffer): string {
  return createHash('sha256').update(waarde).digest('hex');
}

/** Vergelijkt twee waarden in constante tijd. */
export function gelijkInConstanteTijd(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}

/** Een ondoorgrondelijk token van 32 bytes, url-veilig. */
export function nieuwToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

/** Hasht een IP-adres met de pepper; het adres zelf wordt nooit opgeslagen. */
export function hashIp(ip: string | undefined): string | null {
  if (!ip) return null;
  return sha256(`${config.beveiliging.wachtwoordPeper}:${ip}`).slice(0, 32);
}
