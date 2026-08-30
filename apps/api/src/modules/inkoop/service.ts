/**
 * Inkoopfacturen en bonnen.
 *
 * De belangrijkste regel hier: het originele document blijft bewaard en een
 * leveranciersfactuurnummer kan maar een keer voorkomen per leverancier. Die
 * tweede regel wordt door een unieke index in de database afgedwongen, niet
 * alleen door deze code.
 */
import { Money, Quantity } from '@gedmma/money';
import { berekenFactuur, boekInkoopfactuur, type BerekendeRegel, type FactuurRegelInvoer } from '@gedmma/accounting';
import type { Db, TenantContext } from '../../db/pool.ts';
import { ApiFout, fout } from '../../http/fout.ts';
import { auditeer } from '../audit/service.ts';
import { btwCodeOpId } from '../grootboek/repo.ts';
import { boek, rekeningregister } from '../grootboek/service.ts';
import { leesAdministratie } from '../organisaties/service.ts';
import { leesContact } from '../relaties/service.ts';

export type InkoopRegelInvoer = {
  omschrijving: string;
  aantal?: string;
  prijs: string;
  korting?: string;
  btwCodeId: string;
  rekeningId: string;
  /** Is `prijs` inclusief btw? Bij bonnen meestal wel. */
  inclusiefBtw?: boolean;
};

export type InkoopfactuurInvoer = {
  contactId: string;
  soort?: 'factuur' | 'creditnota';
  leveranciersnummer?: string | null;
  factuurdatum: string;
  ontvangstdatum?: string | null;
  vervaldatum?: string | null;
  omschrijving?: string | null;
  valuta?: string;
  documentId?: string | null;
  regels: InkoopRegelInvoer[];
};

export type InkoopfactuurRij = {
  id: string;
  contact_id: string;
  contact_naam: string;
  soort: string;
  leveranciersnummer: string | null;
  documentnummer: string | null;
  status: string;
  factuurdatum: string;
  ontvangstdatum: string | null;
  vervaldatum: string | null;
  omschrijving: string | null;
  valuta: string;
  totaal_exclusief: string;
  totaal_btw: string;
  totaal_inclusief: string;
  betaald_bedrag: string;
  journal_entry_id: string | null;
  document_id: string | null;
  versie: number;
};

export type InkoopregelRij = {
  id: string;
  regelnummer: number;
  omschrijving: string;
  aantal: string;
  prijs: string;
  korting: string;
  tax_code_id: string;
  btw_code: string;
  ledger_account_id: string;
  rekening_code: string;
  bedrag_exclusief: string;
  bedrag_btw: string;
  bedrag_inclusief: string;
};

async function rekenDoor(
  client: Db,
  administratieId: string,
  valuta: string,
  regels: readonly InkoopRegelInvoer[],
): Promise<ReturnType<typeof berekenFactuur>> {
  if (regels.length === 0) {
    throw fout.validatie([{ veld: 'regels', probleem: 'Een inkoopfactuur heeft minimaal een regel.' }]);
  }
  const invoer: FactuurRegelInvoer[] = [];
  for (const regel of regels) {
    const btwCode = await btwCodeOpId(client, administratieId, regel.btwCodeId);
    const aantal = Quantity.vanTekst(regel.aantal ?? '1');
    invoer.push({
      omschrijving: regel.omschrijving,
      bedrag: aantal.maalPrijs(Money.vanTekst(regel.prijs, valuta)),
      korting: regel.korting ? Money.vanTekst(regel.korting, valuta) : null,
      btwCode,
      rekeningId: regel.rekeningId,
      inclusiefBtw: regel.inclusiefBtw ?? false,
    });
  }
  return berekenFactuur(invoer, valuta);
}

export async function maakInkoopfactuur(
  client: Db,
  context: TenantContext & { administratieId: string },
  invoer: InkoopfactuurInvoer,
): Promise<{ id: string }> {
  const administratie = await leesAdministratie(client, context.administratieId);
  const leverancier = await leesContact(client, context.administratieId, invoer.contactId);
  const valuta = (invoer.valuta ?? administratie.valuta).toUpperCase();
  const totalen = await rekenDoor(client, context.administratieId, valuta, invoer.regels);

  const vervaldatum =
    invoer.vervaldatum ??
    new Date(Date.parse(`${invoer.factuurdatum}T00:00:00Z`) + leverancier.betalingstermijn_dagen * 86_400_000)
      .toISOString()
      .slice(0, 10);

  const { rows } = await client.query<{ id: string }>(
    `INSERT INTO purchase_invoice
       (administration_id, contact_id, soort, leveranciersnummer, factuurdatum, ontvangstdatum,
        vervaldatum, omschrijving, valuta, totaal_exclusief, totaal_btw, totaal_inclusief,
        document_id, aangemaakt_door)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING id`,
    [
      context.administratieId,
      invoer.contactId,
      invoer.soort ?? 'factuur',
      invoer.leveranciersnummer ?? null,
      invoer.factuurdatum,
      invoer.ontvangstdatum ?? invoer.factuurdatum,
      vervaldatum,
      invoer.omschrijving ?? null,
      valuta,
      totalen.totaalExclusief.toString(),
      totalen.totaalBtw.toString(),
      totalen.totaalInclusief.toString(),
      invoer.documentId ?? null,
      context.gebruikerId,
    ],
  );
  const id = rows[0]?.id;
  if (!id) throw new Error('De inkoopfactuur kon niet worden vastgelegd.');

  for (const [index, regel] of invoer.regels.entries()) {
    const uitkomst = totalen.regels[index];
    if (!uitkomst) continue;
    await client.query(
      `INSERT INTO purchase_invoice_line
         (administration_id, invoice_id, regelnummer, omschrijving, aantal, prijs, korting,
          tax_code_id, ledger_account_id, bedrag_exclusief, bedrag_btw, bedrag_inclusief)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [
        context.administratieId,
        id,
        index + 1,
        regel.omschrijving,
        regel.aantal ?? '1',
        regel.prijs,
        regel.korting ?? '0',
        regel.btwCodeId,
        regel.rekeningId,
        uitkomst.exclusief.toString(),
        uitkomst.btw.toString(),
        uitkomst.inclusief.toString(),
      ],
    );
  }

  if (invoer.documentId) {
    await client.query(
      `INSERT INTO document_event (administration_id, document_id, actie, user_id, details)
       VALUES ($1,$2,'gekoppeld',$3,$4)`,
      [context.administratieId, invoer.documentId, context.gebruikerId, JSON.stringify({ inkoopfactuur: id })],
    );
  }

  await auditeer(client, context, {
    actie: 'inkoopfactuur.aangemaakt',
    onderwerpSoort: 'purchase_invoice',
    onderwerpId: id,
    gegevens: {
      leverancier: leverancier.naam,
      leveranciersnummer: invoer.leveranciersnummer ?? null,
      totaal: totalen.totaalInclusief.toString(),
      document: invoer.documentId ?? null,
    },
  });

  return { id };
}

export async function maakInkoopDefinitief(
  client: Db,
  context: TenantContext & { administratieId: string },
  factuurId: string,
): Promise<{ postId: string }> {
  const { factuur, regels } = await leesInkoopfactuur(client, context.administratieId, factuurId);
  if (factuur.status !== 'concept' && factuur.status !== 'ter_goedkeuring') {
    throw new ApiFout('entry_immutable', 'Deze inkoopfactuur is al definitief.', '');
  }

  const leverancier = await leesContact(client, context.administratieId, factuur.contact_id);
  const register = await rekeningregister(client, context.administratieId);

  const berekend: BerekendeRegel[] = [];
  for (const regel of regels) {
    berekend.push({
      omschrijving: regel.omschrijving,
      rekeningId: regel.ledger_account_id,
      btwCode: await btwCodeOpId(client, context.administratieId, regel.tax_code_id),
      exclusief: Money.vanTekst(regel.bedrag_exclusief, factuur.valuta),
      btw: Money.vanTekst(regel.bedrag_btw, factuur.valuta),
      inclusief: Money.vanTekst(regel.bedrag_inclusief, factuur.valuta),
    });
  }

  const post = boekInkoopfactuur(
    {
      dagboekCode: 'INK',
      boekdatum: factuur.factuurdatum,
      omschrijving: `Inkoop ${factuur.leveranciersnummer ?? ''} ${leverancier.naam}`.trim(),
      valuta: factuur.valuta,
      relatieId: factuur.contact_id,
      regels: berekend,
      totaalInclusief: Money.vanTekst(factuur.totaal_inclusief, factuur.valuta),
      factuurId,
      creditnota: factuur.soort === 'creditnota',
    },
    register,
  );

  const geboekt = await boek(client, context, post, { definitief: true, nummerSleutel: 'INK' });

  await client.query(
    `UPDATE purchase_invoice SET status = 'definitief', journal_entry_id = $3, gewijzigd_op = now(),
            versie = versie + 1
      WHERE administration_id = $1 AND id = $2`,
    [context.administratieId, factuurId, geboekt.postId],
  );

  await auditeer(client, context, {
    actie: 'inkoopfactuur.definitief',
    onderwerpSoort: 'purchase_invoice',
    onderwerpId: factuurId,
    gegevens: { boeking: geboekt.postId, totaal: factuur.totaal_inclusief },
  });

  return { postId: geboekt.postId };
}

export async function leesInkoopfactuur(
  client: Db,
  administratieId: string,
  factuurId: string,
): Promise<{ factuur: InkoopfactuurRij; regels: InkoopregelRij[] }> {
  const { rows } = await client.query<InkoopfactuurRij>(
    `SELECT f.id, f.contact_id, c.naam AS contact_naam, f.soort, f.leveranciersnummer, f.documentnummer,
            f.status, f.factuurdatum::text AS factuurdatum, f.ontvangstdatum::text AS ontvangstdatum,
            f.vervaldatum::text AS vervaldatum, f.omschrijving, f.valuta,
            f.totaal_exclusief::text AS totaal_exclusief, f.totaal_btw::text AS totaal_btw,
            f.totaal_inclusief::text AS totaal_inclusief, f.betaald_bedrag::text AS betaald_bedrag,
            f.journal_entry_id::text AS journal_entry_id, f.document_id::text AS document_id, f.versie
       FROM purchase_invoice f JOIN contact c ON c.id = f.contact_id
      WHERE f.administration_id = $1 AND f.id = $2`,
    [administratieId, factuurId],
  );
  const factuur = rows[0];
  if (!factuur) throw fout.nietGevonden('Deze inkoopfactuur');

  const regels = await client.query<InkoopregelRij>(
    `SELECT l.id, l.regelnummer, l.omschrijving, l.aantal::text AS aantal, l.prijs::text AS prijs,
            l.korting::text AS korting, l.tax_code_id, t.code AS btw_code,
            l.ledger_account_id, a.code AS rekening_code,
            l.bedrag_exclusief::text AS bedrag_exclusief, l.bedrag_btw::text AS bedrag_btw,
            l.bedrag_inclusief::text AS bedrag_inclusief
       FROM purchase_invoice_line l
       JOIN tax_code t ON t.id = l.tax_code_id
       JOIN ledger_account a ON a.id = l.ledger_account_id
      WHERE l.administration_id = $1 AND l.invoice_id = $2
      ORDER BY l.regelnummer`,
    [administratieId, factuurId],
  );

  return { factuur, regels: regels.rows };
}

export async function zoekInkoopfacturen(
  client: Db,
  administratieId: string,
  opties: { status?: string; contactId?: string; openstaand?: boolean; limiet?: number } = {},
): Promise<InkoopfactuurRij[]> {
  const parameters: unknown[] = [administratieId];
  const voorwaarden: string[] = [];
  if (opties.status) {
    parameters.push(opties.status);
    voorwaarden.push(`f.status = $${parameters.length}`);
  }
  if (opties.contactId) {
    parameters.push(opties.contactId);
    voorwaarden.push(`f.contact_id = $${parameters.length}`);
  }
  if (opties.openstaand) {
    voorwaarden.push(`f.status IN ('definitief', 'deels_betaald')`);
    voorwaarden.push('f.totaal_inclusief <> f.betaald_bedrag');
  }
  parameters.push(Math.min(opties.limiet ?? 50, 200));

  const { rows } = await client.query<InkoopfactuurRij>(
    `SELECT f.id, f.contact_id, c.naam AS contact_naam, f.soort, f.leveranciersnummer, f.documentnummer,
            f.status, f.factuurdatum::text AS factuurdatum, f.ontvangstdatum::text AS ontvangstdatum,
            f.vervaldatum::text AS vervaldatum, f.omschrijving, f.valuta,
            f.totaal_exclusief::text AS totaal_exclusief, f.totaal_btw::text AS totaal_btw,
            f.totaal_inclusief::text AS totaal_inclusief, f.betaald_bedrag::text AS betaald_bedrag,
            f.journal_entry_id::text AS journal_entry_id, f.document_id::text AS document_id, f.versie
       FROM purchase_invoice f JOIN contact c ON c.id = f.contact_id
      WHERE f.administration_id = $1 ${voorwaarden.length > 0 ? `AND ${voorwaarden.join(' AND ')}` : ''}
      ORDER BY f.factuurdatum DESC, f.id DESC
      LIMIT $${parameters.length}`,
    parameters,
  );
  return rows;
}

export async function herberekenInkoopBetaalstatus(
  client: Db,
  administratieId: string,
  factuurId: string,
): Promise<void> {
  const { rows } = await client.query<{ totaal: string; betaald: string; valuta: string; status: string }>(
    `SELECT f.totaal_inclusief::text AS totaal, f.valuta, f.status,
            COALESCE((SELECT SUM(p.bedrag) FROM payment_allocation p
                       WHERE p.administration_id = f.administration_id AND p.purchase_invoice_id = f.id), 0)::text AS betaald
       FROM purchase_invoice f WHERE f.administration_id = $1 AND f.id = $2`,
    [administratieId, factuurId],
  );
  const rij = rows[0];
  if (!rij || rij.status === 'concept') return;

  const totaal = Money.vanTekst(rij.totaal, rij.valuta);
  const betaald = Money.vanTekst(rij.betaald, rij.valuta);
  const status = betaald.absoluut().gelijkAan(totaal.absoluut())
    ? 'betaald'
    : betaald.isNul()
      ? 'definitief'
      : 'deels_betaald';

  await client.query(
    'UPDATE purchase_invoice SET betaald_bedrag = $3, status = $4, gewijzigd_op = now() WHERE administration_id = $1 AND id = $2',
    [administratieId, factuurId, betaald.toString(), status],
  );
}

/**
 * Banktransacties zonder bewijsstuk: de basis voor "ontbrekende bonnen" op het
 * dashboard.
 */
export async function ontbrekendeBonnen(
  client: Db,
  administratieId: string,
  limiet = 25,
): Promise<{ id: string; boekdatum: string; bedrag: string; tegenpartij: string | null; omschrijving: string }[]> {
  const { rows } = await client.query<{
    id: string;
    boekdatum: string;
    bedrag: string;
    tegenpartij: string | null;
    omschrijving: string;
  }>(
    `SELECT t.id, t.boekdatum::text AS boekdatum, t.bedrag::text AS bedrag, t.tegenpartij, t.omschrijving
       FROM bank_transaction t
      WHERE t.administration_id = $1
        AND t.bedrag < 0
        AND t.status = 'geboekt'
        AND NOT EXISTS (
          SELECT 1 FROM payment_allocation p
            JOIN purchase_invoice i ON i.id = p.purchase_invoice_id
           WHERE p.administration_id = t.administration_id
             AND p.bank_transaction_id = t.id
             AND i.document_id IS NOT NULL
        )
      ORDER BY t.boekdatum DESC
      LIMIT $2`,
    [administratieId, limiet],
  );
  return rows;
}
