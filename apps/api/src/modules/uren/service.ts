/**
 * Urenregistratie.
 *
 * Uren staan in minuten, als geheel getal. Dat is geen detail: een kwartier is
 * 15 en niet 0,25, want anders sluipt er via een decimale breuk toch weer een
 * afronding in iets dat later een bedrag wordt.
 *
 * Een uur doorloopt: concept -> ingediend -> goedgekeurd -> gefactureerd.
 * Wie mag goedkeuren, keurt niet zijn eigen uren goed; dat is functiescheiding
 * en het staat hieronder als expliciete controle.
 */
import type { Db, TenantContext } from '../../db/pool.ts';
import { fout } from '../../http/fout.ts';
import { auditeer } from '../audit/service.ts';
import { leesProject } from './projecten.ts';

export type UurStatus = 'concept' | 'ingediend' | 'goedgekeurd' | 'afgekeurd' | 'gefactureerd';

export type UurRij = {
  id: string;
  project_id: string;
  project_naam: string;
  project_code: string | null;
  activity_id: string | null;
  activiteit_naam: string | null;
  user_id: string;
  gebruiker_naam: string;
  datum: string;
  minuten: number;
  omschrijving: string;
  factureerbaar: boolean;
  uurtarief: string | null;
  status: UurStatus;
  sales_invoice_id: string | null;
  factuurnummer: string | null;
  versie: number;
};

export type UurInvoer = {
  projectId: string;
  activiteitId?: string | null;
  datum: string;
  minuten: number;
  omschrijving: string;
  factureerbaar?: boolean;
  uurtarief?: string | null;
  /** Alleen met het recht uren.allen.lezen: uren voor iemand anders schrijven. */
  gebruikerId?: string | null;
};

export type UurZoekopdracht = {
  projectId?: string;
  gebruikerId?: string;
  status?: UurStatus;
  vanaf?: string;
  tot?: string;
  factureerbaar?: boolean;
  alleenOngefactureerd?: boolean;
  limiet?: number;
};

const KOLOMMEN = `u.id, u.project_id::text AS project_id, p.naam AS project_naam, p.code AS project_code,
       u.activity_id::text AS activity_id, a.naam AS activiteit_naam,
       u.user_id::text AS user_id, g.naam AS gebruiker_naam,
       u.datum::text AS datum, u.minuten, u.omschrijving, u.factureerbaar,
       u.uurtarief::text AS uurtarief, u.status,
       u.sales_invoice_id::text AS sales_invoice_id, f.documentnummer AS factuurnummer, u.versie`;

const VAN = `FROM time_entry u
       JOIN project p ON p.id = u.project_id
       JOIN app_user g ON g.id = u.user_id
       LEFT JOIN project_activity a ON a.id = u.activity_id
       LEFT JOIN sales_invoice f ON f.id = u.sales_invoice_id`;

/**
 * Het tarief dat voor een uur geldt: wat de gebruiker zelf invult, anders het
 * tarief van de activiteit, anders dat van het project. Het wordt bij het
 * schrijven vastgelegd, zodat een latere tariefwijziging oude uren niet
 * met terugwerkende kracht verandert.
 */
async function tariefVoor(
  client: Db,
  administratieId: string,
  projectId: string,
  activiteitId: string | null | undefined,
  opgegeven: string | null | undefined,
): Promise<string | null> {
  if (opgegeven) return opgegeven;

  if (activiteitId) {
    const { rows } = await client.query<{ uurtarief: string | null }>(
      'SELECT uurtarief::text AS uurtarief FROM project_activity WHERE administration_id = $1 AND id = $2',
      [administratieId, activiteitId],
    );
    if (rows[0]?.uurtarief) return rows[0].uurtarief;
  }

  const project = await leesProject(client, administratieId, projectId);
  return project.uurtarief;
}

export async function zoekUren(
  client: Db,
  administratieId: string,
  opdracht: UurZoekopdracht = {},
): Promise<{ items: UurRij[]; totaalMinuten: number }> {
  const parameters: unknown[] = [administratieId];
  const voorwaarden: string[] = [];

  if (opdracht.projectId) {
    parameters.push(opdracht.projectId);
    voorwaarden.push(`u.project_id = $${parameters.length}`);
  }
  if (opdracht.gebruikerId) {
    parameters.push(opdracht.gebruikerId);
    voorwaarden.push(`u.user_id = $${parameters.length}`);
  }
  if (opdracht.status) {
    parameters.push(opdracht.status);
    voorwaarden.push(`u.status = $${parameters.length}`);
  }
  if (opdracht.vanaf) {
    parameters.push(opdracht.vanaf);
    voorwaarden.push(`u.datum >= $${parameters.length}::date`);
  }
  if (opdracht.tot) {
    parameters.push(opdracht.tot);
    voorwaarden.push(`u.datum <= $${parameters.length}::date`);
  }
  if (opdracht.factureerbaar !== undefined) {
    parameters.push(opdracht.factureerbaar);
    voorwaarden.push(`u.factureerbaar = $${parameters.length}`);
  }
  if (opdracht.alleenOngefactureerd) {
    voorwaarden.push(`u.sales_invoice_id IS NULL`);
  }
  parameters.push(Math.min(opdracht.limiet ?? 200, 500));

  const waar = voorwaarden.length > 0 ? `AND ${voorwaarden.join(' AND ')}` : '';

  const { rows } = await client.query<UurRij>(
    `SELECT ${KOLOMMEN} ${VAN}
      WHERE u.administration_id = $1 ${waar}
      ORDER BY u.datum DESC, u.aangemaakt_op DESC
      LIMIT $${parameters.length}`,
    parameters,
  );

  const totaal = await client.query<{ minuten: string }>(
    `SELECT COALESCE(SUM(u.minuten), 0)::text AS minuten ${VAN}
      WHERE u.administration_id = $1 ${waar}`,
    parameters.slice(0, -1),
  );

  return { items: rows, totaalMinuten: Number(totaal.rows[0]?.minuten ?? '0') };
}

export async function leesUur(client: Db, administratieId: string, id: string): Promise<UurRij> {
  const { rows } = await client.query<UurRij>(
    `SELECT ${KOLOMMEN} ${VAN} WHERE u.administration_id = $1 AND u.id = $2`,
    [administratieId, id],
  );
  const uur = rows[0];
  if (!uur) throw fout.nietGevonden('Dit uur');
  return uur;
}

function controleerMinuten(minuten: number): void {
  if (!Number.isInteger(minuten) || minuten <= 0 || minuten > 1440) {
    throw fout.validatie(
      [{ veld: 'minuten', probleem: 'Vul een aantal minuten in tussen 1 en 1440 (een etmaal).' }],
      'Het aantal minuten klopt niet.',
    );
  }
}

export async function schrijfUur(
  client: Db,
  context: TenantContext & { administratieId: string },
  invoer: UurInvoer,
  opties: { magVoorAnderen?: boolean } = {},
): Promise<{ id: string }> {
  controleerMinuten(invoer.minuten);

  const project = await leesProject(client, context.administratieId, invoer.projectId);
  if (project.status === 'afgerond' || project.status === 'gearchiveerd') {
    throw fout.validatie(
      [
        {
          veld: 'projectId',
          probleem: `Project ${project.naam} is ${project.status}; er kan niet meer op worden geschreven.`,
        },
      ],
      'Op dit project kan niet meer worden geschreven.',
    );
  }

  const voorGebruiker = invoer.gebruikerId ?? context.gebruikerId;
  if (invoer.gebruikerId && invoer.gebruikerId !== context.gebruikerId && !opties.magVoorAnderen) {
    throw fout.geenRecht('uren.allen.lezen');
  }
  if (!voorGebruiker) throw fout.nietAangemeld();

  const tarief = await tariefVoor(
    client,
    context.administratieId,
    invoer.projectId,
    invoer.activiteitId,
    invoer.uurtarief,
  );

  const { rows } = await client.query<{ id: string }>(
    `INSERT INTO time_entry
       (administration_id, project_id, activity_id, user_id, datum, minuten, omschrijving,
        factureerbaar, uurtarief)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
    [
      context.administratieId,
      invoer.projectId,
      invoer.activiteitId ?? null,
      voorGebruiker,
      invoer.datum,
      invoer.minuten,
      invoer.omschrijving,
      invoer.factureerbaar ?? project.facturatie !== 'niet',
      tarief,
    ],
  );
  const id = rows[0]?.id;
  if (!id) throw new Error('Het uur kon niet worden vastgelegd.');

  await auditeer(client, context, {
    actie: 'uur.geschreven',
    onderwerpSoort: 'time_entry',
    onderwerpId: id,
    gegevens: { project: project.naam, datum: invoer.datum, minuten: invoer.minuten },
  });

  return { id };
}

export async function wijzigUur(
  client: Db,
  context: TenantContext & { administratieId: string },
  id: string,
  invoer: UurInvoer,
  opties: { magVoorAnderen?: boolean; verwachteVersie?: number } = {},
): Promise<{ id: string; versie: number }> {
  controleerMinuten(invoer.minuten);
  const huidig = await leesUur(client, context.administratieId, id);

  if (opties.verwachteVersie !== undefined && huidig.versie !== opties.verwachteVersie) {
    throw fout.versieConflict(huidig.versie);
  }
  if (huidig.status === 'gefactureerd') {
    throw fout.validatie(
      [{ veld: 'status', probleem: 'Dit uur staat op een factuur.' }],
      'Een gefactureerd uur kan niet meer worden gewijzigd. Crediteer de factuur.',
    );
  }
  if (huidig.user_id !== context.gebruikerId && !opties.magVoorAnderen) {
    throw fout.geenRecht('uren.allen.lezen');
  }

  const tarief = await tariefVoor(
    client,
    context.administratieId,
    invoer.projectId,
    invoer.activiteitId,
    invoer.uurtarief,
  );

  const { rows } = await client.query<{ versie: number }>(
    `UPDATE time_entry
        SET project_id = $3, activity_id = $4, datum = $5, minuten = $6, omschrijving = $7,
            factureerbaar = $8, uurtarief = $9,
            -- Een gewijzigd uur gaat terug naar concept: een eerdere goedkeuring
            -- ging over andere gegevens.
            status = CASE WHEN status IN ('goedgekeurd', 'afgekeurd') THEN 'concept' ELSE status END,
            goedgekeurd_door = NULL, goedgekeurd_op = NULL, afkeurreden = NULL,
            gewijzigd_op = now(), versie = versie + 1
      WHERE administration_id = $1 AND id = $2
      RETURNING versie`,
    [
      context.administratieId,
      id,
      invoer.projectId,
      invoer.activiteitId ?? null,
      invoer.datum,
      invoer.minuten,
      invoer.omschrijving,
      invoer.factureerbaar ?? huidig.factureerbaar,
      tarief,
    ],
  );

  await auditeer(client, context, {
    actie: 'uur.gewijzigd',
    onderwerpSoort: 'time_entry',
    onderwerpId: id,
    gegevens: {
      van: { minuten: huidig.minuten, datum: huidig.datum },
      naar: { minuten: invoer.minuten, datum: invoer.datum },
    },
  });

  return { id, versie: rows[0]?.versie ?? huidig.versie + 1 };
}

export async function verwijderUur(
  client: Db,
  context: TenantContext & { administratieId: string },
  id: string,
  opties: { magVoorAnderen?: boolean } = {},
): Promise<void> {
  const huidig = await leesUur(client, context.administratieId, id);
  if (huidig.status === 'gefactureerd') {
    throw fout.validatie(
      [{ veld: 'status', probleem: 'Dit uur staat op een factuur.' }],
      'Een gefactureerd uur kan niet worden verwijderd. Crediteer de factuur.',
    );
  }
  if (huidig.user_id !== context.gebruikerId && !opties.magVoorAnderen) {
    throw fout.geenRecht('uren.allen.lezen');
  }

  await client.query('DELETE FROM time_entry WHERE administration_id = $1 AND id = $2', [
    context.administratieId,
    id,
  ]);

  await auditeer(client, context, {
    actie: 'uur.verwijderd',
    onderwerpSoort: 'time_entry',
    onderwerpId: id,
    gegevens: { project: huidig.project_naam, datum: huidig.datum, minuten: huidig.minuten },
  });
}

/** Zet uren van concept naar ingediend, zodat iemand ernaar kan kijken. */
export async function dienIn(
  client: Db,
  context: TenantContext & { administratieId: string },
  ids: readonly string[],
  opties: { magVoorAnderen?: boolean } = {},
): Promise<{ ingediend: number }> {
  let ingediend = 0;
  for (const id of ids) {
    const uur = await leesUur(client, context.administratieId, id);
    if (uur.user_id !== context.gebruikerId && !opties.magVoorAnderen) {
      throw fout.geenRecht('uren.allen.lezen');
    }
    if (uur.status !== 'concept' && uur.status !== 'afgekeurd') continue;

    await client.query(
      `UPDATE time_entry SET status = 'ingediend', gewijzigd_op = now(), versie = versie + 1
        WHERE administration_id = $1 AND id = $2`,
      [context.administratieId, id],
    );
    ingediend += 1;
  }

  if (ingediend > 0) {
    await auditeer(client, context, {
      actie: 'uur.ingediend',
      onderwerpSoort: 'time_entry',
      gegevens: { aantal: ingediend },
    });
  }
  return { ingediend };
}

/**
 * Goedkeuren of afkeuren. Wie goedkeurt, keurt niet zijn eigen uren goed:
 * dat is dezelfde functiescheiding als bij betalingen.
 */
export async function beoordeel(
  client: Db,
  context: TenantContext & { administratieId: string },
  ids: readonly string[],
  besluit: { goedgekeurd: boolean; reden?: string | null },
): Promise<{ verwerkt: number }> {
  let verwerkt = 0;

  for (const id of ids) {
    const uur = await leesUur(client, context.administratieId, id);
    if (uur.status === 'gefactureerd') continue;

    if (uur.user_id === context.gebruikerId) {
      throw fout.validatie(
        [{ veld: 'ids', probleem: 'Je kunt je eigen uren niet goedkeuren.' }],
        'Je eigen uren laat je door iemand anders beoordelen.',
      );
    }

    await client.query(
      `UPDATE time_entry
          SET status = $3, goedgekeurd_door = $4, goedgekeurd_op = now(), afkeurreden = $5,
              gewijzigd_op = now(), versie = versie + 1
        WHERE administration_id = $1 AND id = $2`,
      [
        context.administratieId,
        id,
        besluit.goedgekeurd ? 'goedgekeurd' : 'afgekeurd',
        context.gebruikerId,
        besluit.goedgekeurd ? null : (besluit.reden ?? null),
      ],
    );
    verwerkt += 1;
  }

  if (verwerkt > 0) {
    await auditeer(client, context, {
      actie: besluit.goedgekeurd ? 'uur.goedgekeurd' : 'uur.afgekeurd',
      onderwerpSoort: 'time_entry',
      gegevens: { aantal: verwerkt, reden: besluit.reden ?? null },
    });
  }
  return { verwerkt };
}

export type ProjectSamenvatting = {
  project_id: string;
  project_naam: string;
  project_code: string | null;
  contact_naam: string | null;
  status: string;
  budget_minuten: number | null;
  geschreven_minuten: number;
  factureerbare_minuten: number;
  ongefactureerde_minuten: number;
  /** Goedgekeurd en nog niet gefactureerd: dit kan nu op een factuur. */
  factureerbaar_nu_minuten: number;
  gefactureerde_minuten: number;
};

/** Per project: wat er is geschreven, wat er nog te factureren staat, en hoe het budget erbij staat. */
export async function projectoverzicht(
  client: Db,
  administratieId: string,
  opdracht: { vanaf?: string; tot?: string } = {},
): Promise<ProjectSamenvatting[]> {
  const parameters: unknown[] = [administratieId, opdracht.vanaf ?? null, opdracht.tot ?? null];

  const { rows } = await client.query<ProjectSamenvatting>(
    `SELECT p.id::text AS project_id, p.naam AS project_naam, p.code AS project_code,
            c.naam AS contact_naam, p.status, p.budget_minuten,
            COALESCE(SUM(u.minuten), 0)::int AS geschreven_minuten,
            COALESCE(SUM(u.minuten) FILTER (WHERE u.factureerbaar), 0)::int AS factureerbare_minuten,
            COALESCE(SUM(u.minuten) FILTER (WHERE u.factureerbaar AND u.sales_invoice_id IS NULL), 0)::int
              AS ongefactureerde_minuten,
            COALESCE(SUM(u.minuten) FILTER (WHERE u.factureerbaar
                                              AND u.sales_invoice_id IS NULL
                                              AND u.status = 'goedgekeurd'), 0)::int
              AS factureerbaar_nu_minuten,
            COALESCE(SUM(u.minuten) FILTER (WHERE u.sales_invoice_id IS NOT NULL), 0)::int
              AS gefactureerde_minuten
       FROM project p
       LEFT JOIN contact c ON c.id = p.contact_id
       LEFT JOIN time_entry u
              ON u.project_id = p.id
             AND u.administration_id = p.administration_id
             AND ($2::date IS NULL OR u.datum >= $2::date)
             AND ($3::date IS NULL OR u.datum <= $3::date)
      WHERE p.administration_id = $1
      GROUP BY p.id, p.naam, p.code, c.naam, p.status, p.budget_minuten
      ORDER BY p.status, p.naam`,
    parameters,
  );
  return rows;
}
