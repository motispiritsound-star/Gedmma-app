/**
 * Configuratie uit de omgeving. Alles heeft een veilige standaardwaarde voor
 * ontwikkeling; in productie faalt de start als een geheim ontbreekt.
 */
import { readFileSync } from 'node:fs';

function laadDotEnv(): void {
  for (const bestand of ['.env', '../../.env']) {
    try {
      const inhoud = readFileSync(new URL(bestand, import.meta.url), 'utf8');
      for (const regel of inhoud.split('\n')) {
        const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(regel);
        if (!match) continue;
        const [, sleutel, ruweWaarde] = match;
        if (!sleutel || process.env[sleutel] !== undefined) continue;
        process.env[sleutel] = (ruweWaarde ?? '').replace(/^["']|["']$/g, '');
      }
    } catch {
      // Geen .env is prima; dan komt alles uit de echte omgeving.
    }
  }
}
laadDotEnv();

const omgeving = (process.env.NODE_ENV ?? 'development') as 'development' | 'test' | 'production';
const isProductie = omgeving === 'production';

function verplicht(sleutel: string, standaardBuitenProductie: string): string {
  const waarde = process.env[sleutel];
  if (waarde && waarde.length > 0) return waarde;
  if (isProductie) {
    throw new Error(
      `Omgevingsvariabele ${sleutel} ontbreekt. In productie moet die gezet zijn; zie .env.example en docs/deployment.md.`,
    );
  }
  return standaardBuitenProductie;
}

function getal(sleutel: string, standaard: number): number {
  const waarde = process.env[sleutel];
  if (!waarde) return standaard;
  const nummer = Number(waarde);
  if (!Number.isFinite(nummer)) throw new Error(`${sleutel} moet een getal zijn, kreeg ${waarde}`);
  return nummer;
}

function vlag(sleutel: string, standaard: boolean): boolean {
  const waarde = process.env[sleutel];
  if (waarde === undefined) return standaard;
  return waarde === '1' || waarde.toLowerCase() === 'true' || waarde.toLowerCase() === 'ja';
}

export const config = {
  omgeving,
  isProductie,
  isTest: omgeving === 'test',
  poort: getal('PORT', 4000),
  /** Basis-URL van de webapp; gebruikt in e-mails en voor CORS/Origin-controle. */
  webUrl: process.env.WEB_URL ?? 'http://localhost:5173',

  database: {
    url:
      process.env.DATABASE_URL ??
      'postgres://gedmma_app:gedmma_dev@127.0.0.1:5432/gedmma',
    /** Aparte verbinding voor migraties: die rol mag wel DDL uitvoeren. */
    migratieUrl:
      process.env.DATABASE_MIGRATION_URL ??
      'postgres://gedmma_owner:gedmma_dev@127.0.0.1:5432/gedmma',
    maxVerbindingen: getal('DATABASE_POOL_MAX', 10),
    statementTimeoutMs: getal('DATABASE_STATEMENT_TIMEOUT_MS', 15_000),
  },

  beveiliging: {
    /** Server-side pepper bovenop de per-gebruiker salt. */
    wachtwoordPeper: verplicht('PASSWORD_PEPPER', 'ontwikkel-peper-niet-voor-productie'),
    /** Sleutel voor het versleutelen van MFA-secrets en tokens (32 bytes, hex of base64). */
    dataSleutel: verplicht('DATA_ENCRYPTION_KEY', '0'.repeat(64)),
    sessieDuurUren: getal('SESSION_MAX_HOURS', 12),
    sessieInactiviteitMinuten: getal('SESSION_IDLE_MINUTES', 30),
    /** scrypt-parameters; mogen meegroeien met de hardware. */
    scrypt: {
      kosten: getal('SCRYPT_COST', 1 << 16),
      blok: getal('SCRYPT_BLOCK', 8),
      parallel: getal('SCRYPT_PARALLEL', 1),
      lengte: 32,
    },
    /** Achter een reverse proxy: vertrouw X-Forwarded-For. */
    achterProxy: vlag('TRUST_PROXY', false),
    /**
     * Verruimt de snelheidsbegrenzing tijdens ontwikkelen en end-to-end tests,
     * waar alle verzoeken van hetzelfde adres komen. In productie wordt de
     * factor genegeerd: daar gelden altijd de echte limieten.
     */
    limietFactor: isProductie ? 1 : Math.max(1, getal('RATE_LIMIT_FACTOR', 1)),
  },

  opslag: {
    driver: (process.env.STORAGE_DRIVER ?? 'lokaal') as 'lokaal' | 's3',
    lokaleMap: process.env.STORAGE_LOCAL_PATH ?? './data/opslag',
    maxBestandBytes: getal('STORAGE_MAX_BYTES', 25 * 1024 * 1024),
    s3: {
      endpoint: process.env.S3_ENDPOINT ?? '',
      bucket: process.env.S3_BUCKET ?? '',
      regio: process.env.S3_REGION ?? 'eu-west-1',
      sleutel: process.env.S3_ACCESS_KEY_ID ?? '',
      geheim: process.env.S3_SECRET_ACCESS_KEY ?? '',
    },
  },

  mail: {
    driver: (process.env.MAIL_DRIVER ?? 'logboek') as 'logboek' | 'smtp',
    afzender: process.env.MAIL_FROM ?? 'geen-antwoord@gedmma.example',
  },

  ai: {
    /** AI staat standaard uit; per tenant aanzetten is een expliciete keuze. */
    standaardAan: vlag('AI_DEFAULT_ENABLED', false),
    provider: process.env.AI_PROVIDER ?? '',
  },

  logboek: {
    niveau: (process.env.LOG_LEVEL ?? (omgeving === 'test' ? 'error' : 'info')) as
      | 'debug'
      | 'info'
      | 'warn'
      | 'error',
  },
} as const;
