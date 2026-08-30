/**
 * Van geschreven uren naar een conceptfactuur.
 *
 * De uitgangspunten:
 *
 *  - Er ontstaat een **concept**factuur, nooit meteen een boeking. Definitief
 *    maken blijft een aparte, bewuste handeling met het recht dat daarbij hoort.
 *  - Uren worden gegroepeerd per project en per activiteit, zodat de klant
 *    leesbare regels krijgt in plaats van dertig losse regels van een half uur.
 *  - Uren met verschillende tarieven belanden in verschillende regels. Een
 *    gemiddeld tarief zou een bedrag opleveren dat niemand kan narekenen.
 *  - Het aantal op de regel is de som van de minuten, omgerekend naar uren met
 *    zes decimalen (de nauwkeurigheid van een factuurregel). Het bedrag volgt
 *    daaruit, zodat wat er op de factuur staat exact klopt met zichzelf.
 *  - Dezelfde uren kunnen nooit twee keer op een factuur komen: dat is een
 *    databasecontrole, geen belofte van de applicatie.
 */
import { Money, Quantity } from '@gedmma/money';
import type { Db, TenantContext } from '../../db/pool.ts';
import { fout } from '../../http/fout.ts';
import { auditeer } from '../audit/service.ts';
import { maakFactuur, type RegelInvoer } from '../verkoop/service.ts';
import { leesProject } from './projecten.ts';

export type FactureerInvoer = {
  projectId: string;
  /** Zonder deze lijst gaan alle goedgekeurde, factureerbare uren mee. */
  uurIds?: string[];
  vanaf?: string | null;
  tot?: string | null;
  factuurdatum?: string;
  /** Alleen goedgekeurde uren, of ook uren die nog in concept staan. */
  alleenGoedgekeurd?: boolean;
  btwCodeId?: string | null;
  rekeningId?: string | null;
  referentie?: string | null;
};

type TeFactureren = {
  id: string;
  minuten: number;
  uurtarief: string | null;
  activiteit: string | null;
  datum: string;
};

/** 90 minuten wordt "1,5 uur"; 100 minuten wordt "1,666667 uur". */
export function minutenAlsUren(minuten: number): Quantity {
  return Quantity.vanEenheden((BigInt(minuten) * 1_000_000n) / 60n);
}

/** "1 uur 40 minuten" - voor in de omschrijving, waar mensen het lezen. */
export function minutenAlsTekst(minuten: number): string {
  const uren = Math.floor(minuten / 60);
  const rest = minuten % 60;
  if (uren === 0) return `${rest} minuten`;
  if (rest === 0) return `${uren} uur`;
  return `${uren} uur ${rest} minuten`;
}

export async function factureerUren(
  client: Db,
  context: TenantContext & { administratieId: string },
  invoer: FactureerInvoer,
): Promise<{ factuurId: string; regels: number; uren: number; minuten: number }> {
  const project = await leesProject(client, context.administratieId, invoer.projectId);

  if (!project.contact_id) {
    throw fout.validatie(
      [{ veld: 'projectId', probleem: 'Aan dit project hangt geen klant.' }],
      'Koppel eerst een klant aan het project; anders is er niemand om aan te factureren.',
    );
  }
  if (project.facturatie === 'niet') {
    throw fout.validatie(
      [{ veld: 'projectId', probleem: 'Dit project staat op "niet factureren".' }],
      'Dit project is niet bedoeld om te factureren.',
    );
  }

  const alleenGoedgekeurd = invoer.alleenGoedgekeurd ?? true;
  const parameters: unknown[] = [context.administratieId, invoer.projectId];
  const voorwaarden = [
    'u.administration_id = $1',
    'u.project_id = $2',
    'u.factureerbaar = true',
    'u.sales_invoice_id IS NULL',
  ];

  if (invoer.uurIds && invoer.uurIds.length > 0) {
    parameters.push(invoer.uurIds);
    voorwaarden.push(`u.id = ANY($${parameters.length}::uuid[])`);
  }
  if (invoer.vanaf) {
    parameters.push(invoer.vanaf);
    voorwaarden.push(`u.datum >= $${parameters.length}::date`);
  }
  if (invoer.tot) {
    parameters.push(invoer.tot);
    voorwaarden.push(`u.datum <= $${parameters.length}::date`);
  }
  if (alleenGoedgekeurd) {
    voorwaarden.push(`u.status = 'goedgekeurd'`);
  } else {
    voorwaarden.push(`u.status <> 'afgekeurd'`);
  }

  // FOR UPDATE: tussen kiezen en factureren mag niemand anders dezelfde uren
  // meenemen.
  const { rows } = await client.query<TeFactureren>(
    `SELECT u.id, u.minuten, u.uurtarief::text AS uurtarief, a.naam AS activiteit, u.datum::text AS datum
       FROM time_entry u LEFT JOIN project_activity a ON a.id = u.activity_id
      WHERE ${voorwaarden.join(' AND ')}
      ORDER BY u.datum, u.aangemaakt_op
        FOR UPDATE OF u`,
    parameters,
  );

  if (rows.length === 0) {
    throw fout.validatie(
      [{ veld: 'uurIds', probleem: 'Er zijn geen uren die aan deze voorwaarden voldoen.' }],
      alleenGoedgekeurd
        ? 'Er staan geen goedgekeurde, nog niet gefactureerde uren klaar voor dit project.'
        : 'Er staan geen nog niet gefactureerde uren klaar voor dit project.',
    );
  }

  const btwCodeId = invoer.btwCodeId ?? project.tax_code_id;
  const rekeningId = invoer.rekeningId ?? project.ledger_account_id;
  if (!btwCodeId || !rekeningId) {
    throw fout.validatie(
      [{ veld: 'btwCodeId', probleem: 'Kies een btw-code en een omzetrekening.' }],
      'Zonder btw-code en omzetrekening kan er geen factuurregel worden gemaakt. Zet ze vast op het project, of geef ze mee.',
    );
  }

  // Groeperen op activiteit én tarief: twee tarieven horen nooit in een regel.
  const groepen = new Map<
    string,
    { activiteit: string | null; tarief: string; minuten: number; ids: string[] }
  >();
  for (const uur of rows) {
    const tarief = uur.uurtarief ?? project.uurtarief;
    if (!tarief) {
      throw fout.validatie(
        [{ veld: 'uurtarief', probleem: `Het uur van ${uur.datum} heeft geen tarief.` }],
        'Er staat een uur zonder tarief tussen. Vul het tarief in op het project of op het uur zelf.',
      );
    }
    const sleutel = `${uur.activiteit ?? ''}|${tarief}`;
    const groep = groepen.get(sleutel) ?? { activiteit: uur.activiteit, tarief, minuten: 0, ids: [] };
    groep.minuten += uur.minuten;
    groep.ids.push(uur.id);
    groepen.set(sleutel, groep);
  }

  const factuurdatum = invoer.factuurdatum ?? new Date().toISOString().slice(0, 10);
  const regels: RegelInvoer[] = [];
  const groepenOpVolgorde = [...groepen.values()];

  for (const groep of groepenOpVolgorde) {
    const aantal = minutenAlsUren(groep.minuten);
    regels.push({
      omschrijving: groep.activiteit
        ? `${project.naam} - ${groep.activiteit} (${minutenAlsTekst(groep.minuten)})`
        : `${project.naam} (${minutenAlsTekst(groep.minuten)})`,
      aantal: aantal.toString(),
      eenheid: 'uur',
      prijs: Money.vanTekst(groep.tarief, project.valuta).toString(),
      btwCodeId,
      rekeningId,
    });
  }

  const factuur = await maakFactuur(client, context, {
    contactId: project.contact_id,
    soort: 'factuur',
    factuurdatum,
    referentie: invoer.referentie ?? project.code ?? null,
    notitie: `Uren ${project.naam}${invoer.vanaf ? ` vanaf ${invoer.vanaf}` : ''}${invoer.tot ? ` tot en met ${invoer.tot}` : ''}`,
    valuta: project.valuta,
    regels,
  });

  // De regels staan er nu; koppel elke groep uren aan zijn eigen factuurregel,
  // zodat later te zien is welk uur waar terecht is gekomen.
  const regelrijen = await client.query<{ id: string; regelnummer: number }>(
    `SELECT id, regelnummer FROM sales_invoice_line
      WHERE administration_id = $1 AND invoice_id = $2 ORDER BY regelnummer`,
    [context.administratieId, factuur.id],
  );

  for (const [index, groep] of groepenOpVolgorde.entries()) {
    const regelId = regelrijen.rows[index]?.id ?? null;
    await client.query(
      `UPDATE time_entry
          SET status = 'gefactureerd', sales_invoice_id = $3, sales_invoice_line_id = $4,
              gefactureerd_op = now(), gewijzigd_op = now(), versie = versie + 1
        WHERE administration_id = $1 AND id = ANY($2::uuid[])`,
      [context.administratieId, groep.ids, factuur.id, regelId],
    );
  }

  const minuten = rows.reduce((totaal, uur) => totaal + uur.minuten, 0);

  await auditeer(client, context, {
    actie: 'uur.gefactureerd',
    onderwerpSoort: 'sales_invoice',
    onderwerpId: factuur.id,
    gegevens: {
      project: project.naam,
      uren: rows.length,
      minuten,
      regels: regels.length,
    },
  });

  return { factuurId: factuur.id, regels: regels.length, uren: rows.length, minuten };
}

/**
 * Maakt de koppeling ongedaan als een conceptfactuur met uren wordt verwijderd
 * of gecrediteerd: de uren staan dan weer klaar om opnieuw te factureren.
 */
export async function maakUrenWeerFactureerbaar(
  client: Db,
  administratieId: string,
  factuurId: string,
): Promise<number> {
  const { rowCount } = await client.query(
    `UPDATE time_entry
        SET status = 'goedgekeurd', sales_invoice_id = NULL, sales_invoice_line_id = NULL,
            gefactureerd_op = NULL, gewijzigd_op = now(), versie = versie + 1
      WHERE administration_id = $1 AND sales_invoice_id = $2`,
    [administratieId, factuurId],
  );
  return rowCount ?? 0;
}
