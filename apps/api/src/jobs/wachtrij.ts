/**
 * Taakwachtrij op PostgreSQL.
 *
 * De reden voor Postgres in plaats van Redis staat in ADR-005: een taak kan zo
 * in dezelfde transactie als een boeking worden ingepland. "Factuur definitief,
 * maar e-mail nooit ingepland" kan daardoor niet voorkomen.
 */
import type { Db } from '../db/pool.ts';

export type TaakSoort =
  | 'factuur.pdf'
  | 'factuur.verstuur'
  | 'bank.verwerk-bestand'
  | 'retentie.opruimen'
  | 'webhook.aflevering';

/** Plant een taak in, binnen de lopende transactie. */
export async function planTaak(
  client: Db,
  administratieId: string | null,
  soort: TaakSoort,
  payload: Record<string, unknown>,
  opties: { draaienNa?: Date; maxPogingen?: number } = {},
): Promise<string> {
  const { rows } = await client.query<{ id: string }>(
    `INSERT INTO job (administration_id, soort, payload, draaien_na, max_pogingen)
     VALUES ($1, $2, $3, COALESCE($4, now()), $5) RETURNING id`,
    [administratieId, soort, JSON.stringify(payload), opties.draaienNa ?? null, opties.maxPogingen ?? 5],
  );
  return rows[0]?.id ?? '';
}

export type Taak = {
  id: string;
  administration_id: string | null;
  soort: TaakSoort;
  payload: Record<string, unknown>;
  pogingen: number;
  max_pogingen: number;
};

/**
 * Pakt de volgende taak op. `FOR UPDATE SKIP LOCKED` zorgt dat meerdere
 * verwerkers naast elkaar kunnen draaien zonder dezelfde taak te pakken.
 */
export async function pakTaak(client: Db): Promise<Taak | null> {
  const { rows } = await client.query<Taak>(
    `UPDATE job SET status = 'bezig', begonnen_op = now(), pogingen = pogingen + 1
      WHERE id = (
        SELECT id FROM job
         WHERE status IN ('wachtend', 'mislukt') AND draaien_na <= now() AND pogingen < max_pogingen
         ORDER BY draaien_na
         FOR UPDATE SKIP LOCKED
         LIMIT 1
      )
      RETURNING id, administration_id, soort, payload, pogingen, max_pogingen`,
  );
  return rows[0] ?? null;
}

export async function meldKlaar(client: Db, taakId: string): Promise<void> {
  await client.query(`UPDATE job SET status = 'klaar', klaar_op = now() WHERE id = $1`, [taakId]);
}

/**
 * Meldt een mislukking. Na de laatste poging gaat de taak naar 'dood' — de
 * dead-letter-status waar een beheerder naar kan kijken.
 */
export async function meldMislukt(client: Db, taak: Taak, fout: string): Promise<void> {
  const wachtSeconden = Math.min(3600, 2 ** taak.pogingen * 30);
  const dood = taak.pogingen >= taak.max_pogingen;
  await client.query(
    `UPDATE job SET status = $2, laatste_fout = $3,
            draaien_na = now() + make_interval(secs => $4)
      WHERE id = $1`,
    [taak.id, dood ? 'dood' : 'mislukt', fout.slice(0, 1000), wachtSeconden],
  );
}
