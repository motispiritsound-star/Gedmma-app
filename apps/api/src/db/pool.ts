/**
 * Databaseverbinding en transacties.
 *
 * Twee dingen zijn hier belangrijk en mogen nooit worden omzeild:
 *  1. NUMERIC komt als string terug, nooit als number. Anders zou een bedrag
 *     stilzwijgend door een double gaan.
 *  2. Elke transactie zet de tenantcontext in de PostgreSQL-sessie. De
 *     row-level security-policies lezen die waarden; zonder context levert elke
 *     query nul rijen op. Zie docs/security.md.
 */
import pg from 'pg';
import { config } from '../config.ts';
import { log } from '../util/log.ts';

const { Pool, types } = pg;

// OID 1700 = NUMERIC, 20 = INT8. Allebei als string, zodat er geen precisie
// verloren gaat. INT8 gaat via BigInt waar we hem als getal nodig hebben.
types.setTypeParser(1700, (waarde: string) => waarde);
types.setTypeParser(20, (waarde: string) => waarde);

export type Rij = Record<string, unknown>;

/** De verbinding waarop een query draait: de pool of een transactie-client. */
export type Db = {
  query<T extends Rij = Rij>(sql: string, parameters?: readonly unknown[]): Promise<{ rows: T[]; rowCount: number }>;
};

let pool: pg.Pool | null = null;

export function db(): pg.Pool {
  if (pool) return pool;
  pool = new Pool({
    connectionString: config.database.url,
    max: config.database.maxVerbindingen,
    statement_timeout: config.database.statementTimeoutMs,
    application_name: 'gedmma-api',
  });
  pool.on('error', (fout) => log.error('Onverwachte fout op een inactieve databaseverbinding', { fout: fout.message }));
  return pool;
}

export async function sluitDb(): Promise<void> {
  await pool?.end();
  pool = null;
}

/**
 * De context waarbinnen een transactie draait. `administratieId` is null voor
 * handelingen die boven een administratie uitgaan (inloggen, organisatie
 * aanmaken); dan ziet de verbinding geen enkele tenantgebonden rij.
 */
export type TenantContext = {
  organisatieId: string | null;
  administratieId: string | null;
  gebruikerId: string | null;
  /** `support` markeert impersonatie; komt zo in de audit trail terecht. */
  actorSoort?: 'gebruiker' | 'support' | 'systeem' | 'api';
  requestId?: string;
};

export const SYSTEEM_CONTEXT: TenantContext = {
  organisatieId: null,
  administratieId: null,
  gebruikerId: null,
  actorSoort: 'systeem',
};

/**
 * Voert `werk` uit binnen één transactie met de tenantcontext gezet. Slaagt
 * alles, dan wordt gecommit; gooit iets, dan wordt alles teruggedraaid — ook
 * de auditregels, want een gebeurtenis die niet is gebeurd hoort niet in het log.
 */
export async function inTransactie<T>(
  context: TenantContext,
  werk: (client: Db) => Promise<T>,
): Promise<T> {
  const client = await db().connect();
  try {
    await client.query('BEGIN');
    // `true` maakt de instelling transactie-lokaal: hij verdwijnt bij COMMIT of
    // ROLLBACK, zodat een hergebruikte verbinding nooit een oude tenant meeneemt.
    await client.query(
      `SELECT set_config('gedmma.organisatie_id', $1, true),
              set_config('gedmma.administratie_id', $2, true),
              set_config('gedmma.gebruiker_id', $3, true),
              set_config('gedmma.actor_soort', $4, true)`,
      [
        context.organisatieId ?? '',
        context.administratieId ?? '',
        context.gebruikerId ?? '',
        context.actorSoort ?? 'gebruiker',
      ],
    );
    const uitkomst = await werk(client as unknown as Db);
    await client.query('COMMIT');
    return uitkomst;
  } catch (fout) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackFout) {
      log.error('Terugdraaien van de transactie is mislukt', {
        fout: rollbackFout instanceof Error ? rollbackFout.message : String(rollbackFout),
      });
    }
    throw fout;
  } finally {
    client.release();
  }
}

/**
 * Voert werk uit zonder tenantcontext, met een verbinding die RLS mag
 * omzeilen. Uitsluitend voor migraties, systeemtaken en de testopzet; nooit
 * bereikbaar vanuit een HTTP-route.
 */
export async function alsBeheerder<T>(werk: (client: Db) => Promise<T>): Promise<T> {
  const beheerPool = new Pool({ connectionString: config.database.migratieUrl, max: 2 });
  const client = await beheerPool.connect();
  try {
    return await werk(client as unknown as Db);
  } finally {
    client.release();
    await beheerPool.end();
  }
}

/** Eén rij of null. Gooit als er meer dan één rij terugkomt: dat is een bug. */
export async function eenRij<T extends Rij>(
  client: Db,
  sql: string,
  parameters: readonly unknown[] = [],
): Promise<T | null> {
  const { rows } = await client.query<T>(sql, parameters);
  if (rows.length > 1) {
    throw new Error(`Verwachtte hooguit een rij, kreeg er ${rows.length}. Query: ${sql.slice(0, 120)}`);
  }
  return rows[0] ?? null;
}

/** Eén rij; gooit als hij er niet is. */
export async function verplichteRij<T extends Rij>(
  client: Db,
  sql: string,
  parameters: readonly unknown[] = [],
  melding = 'Niet gevonden',
): Promise<T> {
  const rij = await eenRij<T>(client, sql, parameters);
  if (!rij) throw new Error(melding);
  return rij;
}
