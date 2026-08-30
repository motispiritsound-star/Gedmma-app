/**
 * Migratierunner.
 *
 * De regels, overgenomen uit het bestaande Webscan-product en aangescherpt voor
 * een financiele database:
 *  - migraties draaien op volgorde van bestandsnaam;
 *  - elke migratie draait precies een keer, in een eigen transactie;
 *  - een gedraaide migratie wordt nooit meer gewijzigd (de hash wordt bewaakt);
 *  - migraties draaien met de eigenaarsrol, de applicatie met een rol zonder DDL.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import pg from 'pg';
import { config } from '../config.ts';
import { log } from '../util/log.ts';

const MAP = fileURLToPath(new URL('migraties/', import.meta.url));

export type Migratie = { naam: string; sql: string; hash: string };

/** Naam van de databaserol waarmee de applicatie verbindt. */
export function appRol(): string {
  const uit = process.env.DATABASE_APP_ROLE;
  if (uit) return uit;
  const match = /^postgres(?:ql)?:\/\/([^:@/]+)/.exec(config.database.url);
  return match?.[1] ?? 'gedmma_app';
}

export function laadMigraties(): Migratie[] {
  return readdirSync(MAP)
    .filter((naam) => naam.endsWith('.sql'))
    .sort()
    .map((naam) => {
      const ruw = readFileSync(join(MAP, naam), 'utf8');
      const sql = ruw.replaceAll('{{APP_ROLE}}', appRol());
      return { naam, sql, hash: createHash('sha256').update(ruw).digest('hex') };
    });
}

/** Draait alle migraties die nog niet zijn uitgevoerd. */
export async function migreer(opties: { stil?: boolean } = {}): Promise<string[]> {
  const pool = new pg.Pool({ connectionString: config.database.migratieUrl, max: 1 });
  const gedraaid: string[] = [];
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migration (
        naam        text PRIMARY KEY,
        hash        text NOT NULL,
        gedraaid_op timestamptz NOT NULL DEFAULT now()
      )
    `);

    const bekend = new Map<string, string>();
    const { rows } = await pool.query<{ naam: string; hash: string }>(
      'SELECT naam, hash FROM schema_migration',
    );
    for (const rij of rows) bekend.set(rij.naam, rij.hash);

    for (const migratie of laadMigraties()) {
      const bestaandeHash = bekend.get(migratie.naam);
      if (bestaandeHash) {
        if (bestaandeHash !== migratie.hash) {
          throw new Error(
            `Migratie ${migratie.naam} is gewijzigd nadat hij is gedraaid. ` +
              'Wijzig nooit een bestaande migratie; voeg een nieuwe toe. ' +
              'Zie docs/deployment.md.',
          );
        }
        continue;
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(migratie.sql);
        await client.query('INSERT INTO schema_migration (naam, hash) VALUES ($1, $2)', [
          migratie.naam,
          migratie.hash,
        ]);
        await client.query('COMMIT');
        gedraaid.push(migratie.naam);
        if (!opties.stil) log.info('Migratie uitgevoerd', { migratie: migratie.naam });
      } catch (fout) {
        await client.query('ROLLBACK');
        throw new Error(
          `Migratie ${migratie.naam} is mislukt: ${fout instanceof Error ? fout.message : String(fout)}`,
          { cause: fout },
        );
      } finally {
        client.release();
      }
    }
  } finally {
    await pool.end();
  }
  return gedraaid;
}

/** Draait de database helemaal leeg. Alleen voor tests en lokale ontwikkeling. */
export async function leegDatabase(): Promise<void> {
  if (config.isProductie) {
    throw new Error('leegDatabase() mag nooit in productie draaien.');
  }
  const pool = new pg.Pool({ connectionString: config.database.migratieUrl, max: 1 });
  try {
    await pool.query('DROP SCHEMA IF EXISTS public CASCADE');
    await pool.query('DROP SCHEMA IF EXISTS gedmma CASCADE');
    await pool.query('CREATE SCHEMA public');
    await pool.query(`GRANT ALL ON SCHEMA public TO CURRENT_USER`);
    await pool.query(`GRANT USAGE ON SCHEMA public TO ${appRol()}`);
  } finally {
    await pool.end();
  }
}
