/**
 * Wachtwoordhashing met scrypt uit node:crypto.
 *
 * De hash draagt zijn algoritme en parameters bij zich, zodat overstappen naar
 * Argon2id later kan zonder dat gebruikers hun wachtwoord opnieuw moeten zetten:
 * bij de eerstvolgende geslaagde login wordt herhasht. Zie ADR-008.
 */
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { config } from '../config.ts';

const scrypt = promisify(scryptCallback) as (
  wachtwoord: string | Buffer,
  salt: Buffer,
  lengte: number,
  opties: { N: number; r: number; p: number; maxmem?: number },
) => Promise<Buffer>;

/** Wachtwoorden die zo vaak voorkomen dat ze niets waard zijn. */
const VEELGEBRUIKT = new Set([
  'wachtwoord123', 'welkom123456', 'geheim123456', 'password1234', '123456789012',
  'qwertyuiop12', 'administrator', 'boekhouding1', 'gedmma123456',
]);

export type Wachtwoordoordeel = { goed: boolean; meldingen: string[] };

/**
 * Beoordeelt een wachtwoord. Bewust geen verplichte tekensoorten: lengte en het
 * ontbreken van veelgebruikte patronen doen meer dan een hoofdlettereis.
 */
export function beoordeelWachtwoord(wachtwoord: string, context: string[] = []): Wachtwoordoordeel {
  const meldingen: string[] = [];
  if (wachtwoord.length < 12) {
    meldingen.push('Gebruik minimaal 12 tekens. Een zin met een paar woorden werkt goed.');
  }
  if (wachtwoord.length > 200) {
    meldingen.push('Gebruik hooguit 200 tekens.');
  }
  if (VEELGEBRUIKT.has(wachtwoord.toLowerCase())) {
    meldingen.push('Dit wachtwoord komt te vaak voor en is daardoor makkelijk te raden.');
  }
  if (/^(.)\1+$/.test(wachtwoord)) {
    meldingen.push('Een wachtwoord van steeds hetzelfde teken is niet veilig.');
  }
  for (const deel of context) {
    if (deel && deel.length >= 4 && wachtwoord.toLowerCase().includes(deel.toLowerCase())) {
      meldingen.push('Gebruik je naam of e-mailadres niet in je wachtwoord.');
      break;
    }
  }
  return { goed: meldingen.length === 0, meldingen };
}

export type Hasher = {
  hash(wachtwoord: string): Promise<string>;
  controleer(wachtwoord: string, hash: string): Promise<boolean>;
  moetHerhashen(hash: string): boolean;
};

function peper(wachtwoord: string): string {
  return `${wachtwoord}${config.beveiliging.wachtwoordPeper}`;
}

export const scryptHasher: Hasher = {
  async hash(wachtwoord) {
    const { kosten, blok, parallel, lengte } = config.beveiliging.scrypt;
    const salt = randomBytes(16);
    const sleutel = await scrypt(peper(wachtwoord), salt, lengte, {
      N: kosten,
      r: blok,
      p: parallel,
      maxmem: 256 * 1024 * 1024,
    });
    return `scrypt$${kosten}$${blok}$${parallel}$${salt.toString('base64url')}$${sleutel.toString('base64url')}`;
  },

  async controleer(wachtwoord, hash) {
    const delen = hash.split('$');
    if (delen[0] !== 'scrypt' || delen.length !== 6) return false;
    const kosten = Number(delen[1]);
    const blok = Number(delen[2]);
    const parallel = Number(delen[3]);
    const salt = Buffer.from(delen[4] ?? '', 'base64url');
    const verwacht = Buffer.from(delen[5] ?? '', 'base64url');
    if (!Number.isInteger(kosten) || !Number.isInteger(blok) || !Number.isInteger(parallel)) return false;
    const berekend = await scrypt(peper(wachtwoord), salt, verwacht.length, {
      N: kosten,
      r: blok,
      p: parallel,
      maxmem: 256 * 1024 * 1024,
    });
    if (berekend.length !== verwacht.length) return false;
    return timingSafeEqual(berekend, verwacht);
  },

  moetHerhashen(hash) {
    const delen = hash.split('$');
    if (delen[0] !== 'scrypt') return true;
    return Number(delen[1]) < config.beveiliging.scrypt.kosten;
  },
};
