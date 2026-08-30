/**
 * Idempotency keys: hetzelfde verzoek twee keer versturen mag nooit twee
 * boekingen opleveren. De sleutel, een hash van het verzoek en het antwoord
 * worden 24 uur bewaard. Zie docs/api.md.
 */
import type { Db } from '../db/pool.ts';
import { sha256 } from '../util/crypto.ts';
import { ApiFout } from './fout.ts';

export type BewaardAntwoord = { statusCode: number; antwoord: unknown };

/**
 * Zoekt een eerder antwoord bij deze sleutel.
 *  - niets gevonden -> null, ga door met het verzoek
 *  - zelfde inhoud  -> het bewaarde antwoord
 *  - andere inhoud  -> fout, want dat is bijna altijd een programmeerfout
 */
export async function zoekEerderAntwoord(
  client: Db,
  administratieId: string | null,
  sleutel: string,
  body: unknown,
): Promise<BewaardAntwoord | null> {
  const hash = sha256(JSON.stringify(body ?? null));
  const { rows } = await client.query<{
    verzoek_hash: string;
    status_code: number | null;
    antwoord: unknown;
  }>(
    `SELECT verzoek_hash, status_code, antwoord FROM idempotency_key
      WHERE administration_id IS NOT DISTINCT FROM $1 AND sleutel = $2 AND verloopt_op > now()`,
    [administratieId, sleutel],
  );
  const rij = rows[0];
  if (!rij) return null;
  if (rij.verzoek_hash !== hash) {
    throw new ApiFout(
      'idempotency_key_reused',
      'Deze Idempotency-Key is al gebruikt voor een ander verzoek.',
      'Gebruik per verzoek een nieuwe sleutel.',
    );
  }
  if (rij.status_code === null) {
    throw new ApiFout(
      'conflict',
      'Een verzoek met dezelfde sleutel wordt op dit moment verwerkt.',
      'Wacht even en probeer het opnieuw.',
    );
  }
  return { statusCode: rij.status_code, antwoord: rij.antwoord };
}

/** Legt de sleutel vast voordat het werk begint. */
export async function reserveer(
  client: Db,
  administratieId: string | null,
  gebruikerId: string | null,
  sleutel: string,
  body: unknown,
): Promise<void> {
  await client.query(
    `INSERT INTO idempotency_key (administration_id, user_id, sleutel, verzoek_hash)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (administration_id, sleutel) DO NOTHING`,
    [administratieId, gebruikerId, sleutel, sha256(JSON.stringify(body ?? null))],
  );
}

/** Bewaart het antwoord zodat een herhaling hetzelfde teruggeeft. */
export async function bewaarAntwoord(
  client: Db,
  administratieId: string | null,
  sleutel: string,
  statusCode: number,
  antwoord: unknown,
): Promise<void> {
  await client.query(
    `UPDATE idempotency_key SET status_code = $3, antwoord = $4
      WHERE administration_id IS NOT DISTINCT FROM $1 AND sleutel = $2`,
    [administratieId, sleutel, statusCode, JSON.stringify(antwoord ?? null)],
  );
}
