import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Minimale .env-loader zodat we geen extra dependency nodig hebben.
function loadDotEnv(file = '.env'): void {
  const path = resolve(process.cwd(), file);
  if (!existsSync(path)) return;
  for (const raw of readFileSync(path, 'utf8').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadDotEnv();

const num = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const config = {
  dbPath: process.env.WEBSCAN_DB ?? './data/webscan.db',
  /** Aantal websites dat tegelijk gescand wordt (over verschillende hosts heen). */
  concurrency: num(process.env.WEBSCAN_CONCURRENCY, 6),
  /** Harde timeout per HTTP-request. */
  timeoutMs: num(process.env.WEBSCAN_TIMEOUT_MS, 15_000),
  /** Minimale pauze tussen twee requests naar dezelfde host (beleefdheid). */
  perHostDelayMs: num(process.env.WEBSCAN_HOST_DELAY_MS, 1_500),
  maxBytes: num(process.env.WEBSCAN_MAX_BYTES, 3_000_000),
  userAgent:
    process.env.WEBSCAN_USER_AGENT ??
    'WebscanNL/0.1 (+website-kwaliteitsscan; zet je contactgegevens in WEBSCAN_USER_AGENT)',
  kvkApiKey: process.env.KVK_API_KEY ?? '',
  serverPort: num(process.env.WEBSCAN_PORT, 4321),
};

export type Config = typeof config;
