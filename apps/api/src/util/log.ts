/**
 * Gestructureerd loggen: een JSON-regel per gebeurtenis. Persoonsgegevens
 * worden gemaskeerd; wachtwoorden, tokens en documentinhoud komen er nooit in.
 * Zie docs/privacy-role-matrix.md.
 */
import { config } from '../config.ts';

const NIVEAUS = { debug: 10, info: 20, warn: 30, error: 40 } as const;
export type Niveau = keyof typeof NIVEAUS;

/** Sleutels waarvan de waarde nooit in een logregel mag staan. */
const GEHEIM = new Set([
  'password',
  'wachtwoord',
  'token',
  'secret',
  'geheim',
  'authorization',
  'cookie',
  'mfa_secret',
  'totp',
  'recoveryCodes',
  'iban',
  'bsn',
  'apiKey',
  'sessieToken',
  'documentInhoud',
]);

/** E-mailadressen worden gemaskeerd: j***@voorbeeld.nl. */
function maskeerEmail(waarde: string): string {
  const [lokaal, domein] = waarde.split('@');
  if (!domein || !lokaal) return '***';
  return `${lokaal.slice(0, 1)}***@${domein}`;
}

export function maskeer(waarde: unknown, sleutel = ''): unknown {
  if (GEHEIM.has(sleutel)) return '[weggelaten]';
  if (typeof waarde === 'string') {
    if (waarde.includes('@') && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(waarde)) return maskeerEmail(waarde);
    return waarde.length > 500 ? `${waarde.slice(0, 500)}...[ingekort]` : waarde;
  }
  if (typeof waarde === 'bigint') return waarde.toString();
  if (Array.isArray(waarde)) return waarde.map((item) => maskeer(item));
  if (waarde && typeof waarde === 'object') {
    const uitkomst: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(waarde)) uitkomst[k] = maskeer(v, k);
    return uitkomst;
  }
  return waarde;
}

function schrijf(niveau: Niveau, bericht: string, velden: Record<string, unknown>): void {
  if (NIVEAUS[niveau] < NIVEAUS[config.logboek.niveau]) return;
  const regel = {
    at: new Date().toISOString(),
    niveau,
    bericht,
    ...(maskeer(velden) as Record<string, unknown>),
  };
  const uitvoer = niveau === 'error' || niveau === 'warn' ? process.stderr : process.stdout;
  uitvoer.write(`${JSON.stringify(regel)}\n`);
}

export const log = {
  debug: (bericht: string, velden: Record<string, unknown> = {}) => schrijf('debug', bericht, velden),
  info: (bericht: string, velden: Record<string, unknown> = {}) => schrijf('info', bericht, velden),
  warn: (bericht: string, velden: Record<string, unknown> = {}) => schrijf('warn', bericht, velden),
  error: (bericht: string, velden: Record<string, unknown> = {}) => schrijf('error', bericht, velden),
};
