/**
 * Projecten en activiteiten.
 *
 * Een project is de plek waar uren op worden geschreven. Het draagt de
 * afspraken met de klant: hoe er wordt gefactureerd, tegen welk tarief, en op
 * welke grootboekrekening de omzet later terechtkomt.
 */
import type { Db, TenantContext } from '../../db/pool.ts';
import { fout } from '../../http/fout.ts';
import { auditeer } from '../audit/service.ts';
import { volgendNummer } from '../grootboek/repo.ts';

export type ProjectRij = {
  id: string;
  code: string | null;
  naam: string;
  omschrijving: string | null;
  contact_id: string | null;
  contact_naam: string | null;
  status: 'actief' | 'op_pauze' | 'afgerond' | 'gearchiveerd';
  facturatie: 'uurtarief' | 'vaste_prijs' | 'niet';
  uurtarief: string | null;
  vaste_prijs: string | null;
  budget_minuten: number | null;
  begint_op: string | null;
  eindigt_op: string | null;
  tax_code_id: string | null;
  ledger_account_id: string | null;
  valuta: string;
  versie: number;
};

export type ProjectInvoer = {
  naam: string;
  code?: string | null;
  omschrijving?: string | null;
  contactId?: string | null;
  status?: ProjectRij['status'];
  facturatie?: ProjectRij['facturatie'];
  uurtarief?: string | null;
  vastePrijs?: string | null;
  budgetMinuten?: number | null;
  begintOp?: string | null;
  eindigtOp?: string | null;
  btwCodeId?: string | null;
  rekeningId?: string | null;
};

const KOLOMMEN = `p.id, p.code, p.naam, p.omschrijving, p.contact_id::text AS contact_id,
       c.naam AS contact_naam, p.status, p.facturatie,
       p.uurtarief::text AS uurtarief, p.vaste_prijs::text AS vaste_prijs,
       p.budget_minuten, p.begint_op::text AS begint_op, p.eindigt_op::text AS eindigt_op,
       p.tax_code_id::text AS tax_code_id, p.ledger_account_id::text AS ledger_account_id,
       p.valuta, p.versie`;

export async function zoekProjecten(
  client: Db,
  administratieId: string,
  opdracht: { zoek?: string; status?: string; contactId?: string; limiet?: number } = {},
): Promise<ProjectRij[]> {
  const parameters: unknown[] = [administratieId];
  const voorwaarden: string[] = [];

  if (opdracht.zoek) {
    parameters.push(`%${opdracht.zoek}%`);
    voorwaarden.push(`(p.naam ILIKE $${parameters.length} OR p.code ILIKE $${parameters.length})`);
  }
  if (opdracht.status) {
    parameters.push(opdracht.status);
    voorwaarden.push(`p.status = $${parameters.length}`);
  }
  if (opdracht.contactId) {
    parameters.push(opdracht.contactId);
    voorwaarden.push(`p.contact_id = $${parameters.length}`);
  }
  parameters.push(Math.min(opdracht.limiet ?? 100, 200));

  const { rows } = await client.query<ProjectRij>(
    `SELECT ${KOLOMMEN}
       FROM project p LEFT JOIN contact c ON c.id = p.contact_id
      WHERE p.administration_id = $1 ${voorwaarden.length > 0 ? `AND ${voorwaarden.join(' AND ')}` : ''}
      ORDER BY p.status, p.naam
      LIMIT $${parameters.length}`,
    parameters,
  );
  return rows;
}

export async function leesProject(client: Db, administratieId: string, id: string): Promise<ProjectRij> {
  const { rows } = await client.query<ProjectRij>(
    `SELECT ${KOLOMMEN} FROM project p LEFT JOIN contact c ON c.id = p.contact_id
      WHERE p.administration_id = $1 AND p.id = $2`,
    [administratieId, id],
  );
  const project = rows[0];
  if (!project) throw fout.nietGevonden('Dit project bestaat niet.');
  return project;
}

/** Controleert de combinatie van facturatievorm en tarief voordat er iets wordt opgeslagen. */
function controleerFacturatie(invoer: ProjectInvoer): void {
  const vorm = invoer.facturatie ?? 'uurtarief';
  if (vorm === 'uurtarief' && !invoer.uurtarief) {
    throw fout.validatie(
      [{ veld: 'uurtarief', probleem: 'Vul het uurtarief in, of kies een andere manier van factureren.' }],
      'Bij factureren op uurtarief hoort een tarief.',
    );
  }
  if (vorm === 'vaste_prijs' && !invoer.vastePrijs) {
    throw fout.validatie(
      [{ veld: 'vastePrijs', probleem: 'Vul de vaste prijs in.' }],
      'Bij een vaste prijs hoort een bedrag.',
    );
  }
}

export async function maakProject(
  client: Db,
  context: TenantContext & { administratieId: string },
  invoer: ProjectInvoer,
): Promise<{ id: string; code: string }> {
  controleerFacturatie(invoer);

  const code =
    invoer.code ??
    (await volgendNummer(
      client,
      context.administratieId,
      'project',
      new Date().getUTCFullYear(),
      'P{nummer:4}',
    ));

  const { rows } = await client.query<{ id: string }>(
    `INSERT INTO project
       (administration_id, contact_id, code, naam, omschrijving, status, facturatie, uurtarief,
        vaste_prijs, budget_minuten, begint_op, eindigt_op, tax_code_id, ledger_account_id, aangemaakt_door)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
     RETURNING id`,
    [
      context.administratieId,
      invoer.contactId ?? null,
      code,
      invoer.naam,
      invoer.omschrijving ?? null,
      invoer.status ?? 'actief',
      invoer.facturatie ?? 'uurtarief',
      invoer.uurtarief ?? null,
      invoer.vastePrijs ?? null,
      invoer.budgetMinuten ?? null,
      invoer.begintOp ?? null,
      invoer.eindigtOp ?? null,
      invoer.btwCodeId ?? null,
      invoer.rekeningId ?? null,
      context.gebruikerId,
    ],
  );
  const id = rows[0]?.id;
  if (!id) throw new Error('Het project kon niet worden aangemaakt.');

  await auditeer(client, context, {
    actie: 'project.aangemaakt',
    onderwerpSoort: 'project',
    onderwerpId: id,
    gegevens: { naam: invoer.naam, code, facturatie: invoer.facturatie ?? 'uurtarief' },
  });

  return { id, code };
}

export async function wijzigProject(
  client: Db,
  context: TenantContext & { administratieId: string },
  id: string,
  invoer: ProjectInvoer,
  verwachteVersie?: number,
): Promise<{ id: string; versie: number }> {
  const huidig = await leesProject(client, context.administratieId, id);
  if (verwachteVersie !== undefined && huidig.versie !== verwachteVersie) {
    throw fout.versieConflict(huidig.versie);
  }
  controleerFacturatie({ ...invoer, facturatie: invoer.facturatie ?? huidig.facturatie });

  const { rows } = await client.query<{ versie: number }>(
    `UPDATE project
        SET contact_id = $3, code = $4, naam = $5, omschrijving = $6, status = $7, facturatie = $8,
            uurtarief = $9, vaste_prijs = $10, budget_minuten = $11, begint_op = $12, eindigt_op = $13,
            tax_code_id = $14, ledger_account_id = $15, gewijzigd_op = now(), versie = versie + 1
      WHERE administration_id = $1 AND id = $2
      RETURNING versie`,
    [
      context.administratieId,
      id,
      invoer.contactId ?? null,
      invoer.code ?? huidig.code,
      invoer.naam,
      invoer.omschrijving ?? null,
      invoer.status ?? huidig.status,
      invoer.facturatie ?? huidig.facturatie,
      invoer.uurtarief ?? null,
      invoer.vastePrijs ?? null,
      invoer.budgetMinuten ?? null,
      invoer.begintOp ?? null,
      invoer.eindigtOp ?? null,
      invoer.btwCodeId ?? null,
      invoer.rekeningId ?? null,
    ],
  );

  await auditeer(client, context, {
    actie: 'project.gewijzigd',
    onderwerpSoort: 'project',
    onderwerpId: id,
    gegevens: { naam: invoer.naam, status: invoer.status ?? huidig.status },
  });

  return { id, versie: rows[0]?.versie ?? huidig.versie + 1 };
}

export type ActiviteitRij = {
  id: string;
  project_id: string;
  naam: string;
  uurtarief: string | null;
  factureerbaar: boolean;
  status: string;
};

export async function activiteiten(
  client: Db,
  administratieId: string,
  projectId: string,
): Promise<ActiviteitRij[]> {
  const { rows } = await client.query<ActiviteitRij>(
    `SELECT id, project_id::text AS project_id, naam, uurtarief::text AS uurtarief, factureerbaar, status
       FROM project_activity
      WHERE administration_id = $1 AND project_id = $2
      ORDER BY status, naam`,
    [administratieId, projectId],
  );
  return rows;
}

export async function maakActiviteit(
  client: Db,
  context: TenantContext & { administratieId: string },
  projectId: string,
  invoer: { naam: string; uurtarief?: string | null; factureerbaar?: boolean },
): Promise<{ id: string }> {
  await leesProject(client, context.administratieId, projectId);

  const { rows } = await client.query<{ id: string }>(
    `INSERT INTO project_activity (administration_id, project_id, naam, uurtarief, factureerbaar)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (project_id, naam) DO UPDATE
       SET uurtarief = EXCLUDED.uurtarief, factureerbaar = EXCLUDED.factureerbaar, status = 'actief'
     RETURNING id`,
    [context.administratieId, projectId, invoer.naam, invoer.uurtarief ?? null, invoer.factureerbaar ?? true],
  );
  const id = rows[0]?.id;
  if (!id) throw new Error('De activiteit kon niet worden aangemaakt.');
  return { id };
}
