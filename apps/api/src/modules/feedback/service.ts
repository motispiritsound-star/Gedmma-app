/**
 * Feedback vanuit de applicatie.
 *
 * De tekst komt van een mens die iets opmerkt terwijl hij aan het werk is.
 * Twee dingen die daaruit volgen:
 *
 *  - Elke aangemelde gebruiker mag feedback geven, ook een meekijker. Iets
 *    melden is geen bevoorrechte handeling; het lezen en afhandelen ervan wel.
 *  - De tekst wordt opgeslagen en teruggegeven als platte tekst. Hij wordt
 *    nooit uitgevoerd, gerenderd als opmaak, of gelezen als instructie.
 */
import type { Db, TenantContext } from '../../db/pool.ts';
import { fout } from '../../http/fout.ts';
import { auditeer } from '../audit/service.ts';

export type FeedbackSoort = 'opmerking' | 'fout' | 'wens' | 'vraag';
export type FeedbackStatus = 'nieuw' | 'opgepakt' | 'verwerkt' | 'afgewezen';

export type FeedbackRij = {
  id: string;
  naam: string | null;
  gebruiker_naam: string | null;
  administratie_naam: string | null;
  soort: FeedbackSoort;
  bericht: string;
  scherm: string | null;
  versie_app: string | null;
  status: FeedbackStatus;
  antwoord: string | null;
  behandeld_op: string | null;
  aangemaakt_op: string;
};

export type FeedbackInvoer = {
  soort?: FeedbackSoort;
  bericht: string;
  naam?: string | null;
  scherm?: string | null;
  versieApp?: string | null;
};

export async function meldFeedback(
  client: Db,
  context: TenantContext & { organisatieId: string },
  invoer: FeedbackInvoer,
): Promise<{ id: string }> {
  const bericht = invoer.bericht.trim();
  if (bericht.length < 3) {
    throw fout.validatie(
      [{ veld: 'bericht', probleem: 'Schrijf kort op wat je opvalt.' }],
      'Er staat nog geen opmerking in.',
    );
  }

  const { rows } = await client.query<{ id: string }>(
    `INSERT INTO feedback
       (organization_id, administration_id, user_id, naam, soort, bericht, scherm, versie_app)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
    [
      context.organisatieId,
      context.administratieId,
      context.gebruikerId,
      invoer.naam?.trim() || null,
      invoer.soort ?? 'opmerking',
      bericht,
      invoer.scherm ?? null,
      invoer.versieApp ?? null,
    ],
  );
  const id = rows[0]?.id;
  if (!id) throw new Error('De opmerking kon niet worden opgeslagen.');

  // In het auditspoor komt dat er feedback is gegeven en waarover, niet de
  // tekst zelf: die kan van alles bevatten en hoort in een tabel, niet in een
  // onwijzigbare keten.
  await auditeer(client, context, {
    actie: 'feedback.gegeven',
    onderwerpSoort: 'feedback',
    onderwerpId: id,
    gegevens: { soort: invoer.soort ?? 'opmerking', scherm: invoer.scherm ?? null },
  });

  return { id };
}

export async function zoekFeedback(
  client: Db,
  organisatieId: string,
  opdracht: { status?: FeedbackStatus; limiet?: number } = {},
): Promise<{ items: FeedbackRij[]; aantalNieuw: number }> {
  const parameters: unknown[] = [organisatieId];
  let waar = 'f.organization_id = $1';

  if (opdracht.status) {
    parameters.push(opdracht.status);
    waar += ` AND f.status = $${parameters.length}`;
  }
  parameters.push(Math.min(opdracht.limiet ?? 100, 500));

  const { rows } = await client.query<FeedbackRij>(
    `SELECT f.id, f.naam, g.naam AS gebruiker_naam, a.naam AS administratie_naam,
            f.soort, f.bericht, f.scherm, f.versie_app, f.status, f.antwoord,
            f.behandeld_op::text AS behandeld_op, f.aangemaakt_op::text AS aangemaakt_op
       FROM feedback f
       LEFT JOIN app_user g ON g.id = f.user_id
       LEFT JOIN administration a ON a.id = f.administration_id
      WHERE ${waar}
      ORDER BY f.aangemaakt_op DESC
      LIMIT $${parameters.length}`,
    parameters,
  );

  const nieuw = await client.query<{ aantal: string }>(
    `SELECT count(*)::text AS aantal FROM feedback
      WHERE organization_id = $1 AND status = 'nieuw'`,
    [organisatieId],
  );

  return { items: rows, aantalNieuw: Number(nieuw.rows[0]?.aantal ?? '0') };
}

export async function behandelFeedback(
  client: Db,
  context: TenantContext & { organisatieId: string },
  id: string,
  besluit: { status: FeedbackStatus; antwoord?: string | null },
): Promise<{ id: string; status: FeedbackStatus }> {
  const { rows } = await client.query<{ id: string }>(
    `UPDATE feedback
        SET status = $3, antwoord = $4, behandeld_door = $5, behandeld_op = now()
      WHERE organization_id = $1 AND id = $2
      RETURNING id`,
    [context.organisatieId, id, besluit.status, besluit.antwoord?.trim() || null, context.gebruikerId],
  );
  if (!rows[0]) throw fout.nietGevonden('Deze opmerking');

  await auditeer(client, context, {
    actie: 'feedback.behandeld',
    onderwerpSoort: 'feedback',
    onderwerpId: id,
    gegevens: { status: besluit.status },
  });

  return { id, status: besluit.status };
}
