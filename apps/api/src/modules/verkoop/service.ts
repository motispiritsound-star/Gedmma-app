/**
 * Verkoopfacturen, offertes en creditnota's.
 *
 * Een concept mag alles; definitief maken is de grens. Op dat moment worden de
 * wettelijke factuurvereisten gecontroleerd, krijgt de factuur een nummer uit
 * een sluitende reeks en wordt hij geboekt. Daarna is er geen weg terug behalve
 * een creditnota.
 */
import { Money, Quantity, Rate } from '@gedmma/money';
import {
  berekenFactuur,
  boekVerkoopfactuur,
  eisFactuurvereisten,
  type BerekendeRegel,
  type FactuurRegelInvoer,
} from '@gedmma/accounting';
import type { Db, TenantContext } from '../../db/pool.ts';
import { ApiFout, fout } from '../../http/fout.ts';
import { auditeer } from '../audit/service.ts';
import { btwCodeOpId, volgendNummer } from '../grootboek/repo.ts';
import { boek, rekeningregister } from '../grootboek/service.ts';
import { leesAdministratie } from '../organisaties/service.ts';
import { factuuradres, leesContact } from '../relaties/service.ts';

export type FactuurSoort = 'offerte' | 'factuur' | 'creditnota' | 'proforma';

export type RegelInvoer = {
  omschrijving: string;
  aantal: string;
  eenheid?: string;
  prijs: string;
  korting?: string;
  btwCodeId: string;
  rekeningId: string;
  productId?: string | null;
  /** Is `prijs` inclusief btw? */
  inclusiefBtw?: boolean;
};

export type FactuurInvoer = {
  contactId: string;
  soort?: FactuurSoort;
  factuurdatum: string;
  leverdatum?: string | null;
  vervaldatum?: string | null;
  referentie?: string | null;
  notitie?: string | null;
  valuta?: string;
  wisselkoers?: string;
  regels: RegelInvoer[];
};

export type FactuurRij = {
  id: string;
  contact_id: string;
  contact_naam: string;
  soort: FactuurSoort;
  documentnummer: string | null;
  status: string;
  factuurdatum: string;
  leverdatum: string | null;
  vervaldatum: string | null;
  referentie: string | null;
  notitie: string | null;
  valuta: string;
  wisselkoers: string;
  totaal_exclusief: string;
  totaal_btw: string;
  totaal_inclusief: string;
  betaald_bedrag: string;
  journal_entry_id: string | null;
  pdf_document_id: string | null;
  verzonden_op: string | null;
  versie: number;
};

export type FactuurregelRij = {
  id: string;
  regelnummer: number;
  omschrijving: string;
  aantal: string;
  eenheid: string;
  prijs: string;
  korting: string;
  tax_code_id: string;
  btw_code: string;
  btw_tarief: string;
  ledger_account_id: string;
  rekening_code: string;
  bedrag_exclusief: string;
  bedrag_btw: string;
  bedrag_inclusief: string;
};

/** Rekent de regels door met de rekenkern. */
async function rekenRegelsDoor(
  client: Db,
  administratieId: string,
  valuta: string,
  factuurdatum: string,
  regels: readonly RegelInvoer[],
): Promise<{ berekend: BerekendeRegel[]; totalen: ReturnType<typeof berekenFactuur>; invoer: FactuurRegelInvoer[] }> {
  if (regels.length === 0) {
    throw fout.validatie([{ veld: 'regels', probleem: 'Een factuur heeft minimaal een regel.' }]);
  }

  const invoer: FactuurRegelInvoer[] = [];
  for (const regel of regels) {
    const btwCode = await btwCodeOpId(client, administratieId, regel.btwCodeId);
    if (factuurdatum < btwCode.geldigVanaf || (btwCode.geldigTot && factuurdatum > btwCode.geldigTot)) {
      throw fout.validatie(
        [{ veld: 'btwCodeId', probleem: `Btw-code ${btwCode.code} geldt niet op ${factuurdatum}.` }],
        `Btw-code ${btwCode.code} geldt niet op de factuurdatum.`,
      );
    }
    const bedrag = Quantity.vanTekst(regel.aantal).maalPrijs(Money.vanTekst(regel.prijs, valuta));
    invoer.push({
      omschrijving: regel.omschrijving,
      bedrag,
      korting: regel.korting ? Money.vanTekst(regel.korting, valuta) : null,
      btwCode,
      rekeningId: regel.rekeningId,
      inclusiefBtw: regel.inclusiefBtw ?? false,
    });
  }

  const totalen = berekenFactuur(invoer, valuta);
  return { berekend: totalen.regels, totalen, invoer };
}

export async function maakFactuur(
  client: Db,
  context: TenantContext & { administratieId: string },
  invoer: FactuurInvoer,
): Promise<{ id: string }> {
  const administratie = await leesAdministratie(client, context.administratieId);
  const contact = await leesContact(client, context.administratieId, invoer.contactId);
  const valuta = (invoer.valuta ?? contact.valuta ?? administratie.valuta).toUpperCase();
  const soort = invoer.soort ?? 'factuur';

  const { totalen } = await rekenRegelsDoor(client, context.administratieId, valuta, invoer.factuurdatum, invoer.regels);

  const vervaldatum =
    invoer.vervaldatum ??
    new Date(Date.parse(`${invoer.factuurdatum}T00:00:00Z`) + contact.betalingstermijn_dagen * 86_400_000)
      .toISOString()
      .slice(0, 10);

  const { rows } = await client.query<{ id: string }>(
    `INSERT INTO sales_invoice
       (administration_id, contact_id, soort, factuurdatum, leverdatum, vervaldatum, referentie,
        notitie, valuta, wisselkoers, totaal_exclusief, totaal_btw, totaal_inclusief, aangemaakt_door)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING id`,
    [
      context.administratieId,
      invoer.contactId,
      soort,
      invoer.factuurdatum,
      invoer.leverdatum ?? invoer.factuurdatum,
      soort === 'offerte' ? null : vervaldatum,
      invoer.referentie ?? null,
      invoer.notitie ?? null,
      valuta,
      invoer.wisselkoers ?? '1',
      totalen.totaalExclusief.toString(),
      totalen.totaalBtw.toString(),
      totalen.totaalInclusief.toString(),
      context.gebruikerId,
    ],
  );
  const factuurId = rows[0]?.id;
  if (!factuurId) throw new Error('De factuur kon niet worden aangemaakt.');

  await schrijfRegels(client, context.administratieId, factuurId, invoer.regels, totalen.regels);

  await auditeer(client, context, {
    actie: 'verkoopfactuur.aangemaakt',
    onderwerpSoort: 'sales_invoice',
    onderwerpId: factuurId,
    gegevens: { soort, klant: contact.naam, totaal: totalen.totaalInclusief.toString(), valuta },
  });

  return { id: factuurId };
}

async function schrijfRegels(
  client: Db,
  administratieId: string,
  factuurId: string,
  invoer: readonly RegelInvoer[],
  berekend: readonly BerekendeRegel[],
): Promise<void> {
  await client.query('DELETE FROM sales_invoice_line WHERE administration_id = $1 AND invoice_id = $2', [
    administratieId,
    factuurId,
  ]);
  for (const [index, regel] of invoer.entries()) {
    const uitkomst = berekend[index];
    if (!uitkomst) continue;
    await client.query(
      `INSERT INTO sales_invoice_line
         (administration_id, invoice_id, regelnummer, product_id, omschrijving, aantal, eenheid,
          prijs, korting, tax_code_id, ledger_account_id, bedrag_exclusief, bedrag_btw, bedrag_inclusief)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
      [
        administratieId,
        factuurId,
        index + 1,
        regel.productId ?? null,
        regel.omschrijving,
        regel.aantal,
        regel.eenheid ?? 'stuk',
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
}

export async function wijzigFactuur(
  client: Db,
  context: TenantContext & { administratieId: string },
  factuurId: string,
  invoer: FactuurInvoer,
  verwachteVersie?: number,
): Promise<void> {
  const bestaand = await leesFactuur(client, context.administratieId, factuurId);
  if (bestaand.factuur.status !== 'concept') {
    throw new ApiFout(
      'entry_immutable',
      'Deze factuur is definitief en kan niet meer worden gewijzigd.',
      'Maak een creditnota als er iets niet klopt; dan blijft de administratie kloppen.',
    );
  }
  if (verwachteVersie !== undefined && bestaand.factuur.versie !== verwachteVersie) {
    throw fout.versieConflict(bestaand.factuur.versie);
  }

  const administratie = await leesAdministratie(client, context.administratieId);
  const valuta = (invoer.valuta ?? bestaand.factuur.valuta ?? administratie.valuta).toUpperCase();
  const { totalen } = await rekenRegelsDoor(client, context.administratieId, valuta, invoer.factuurdatum, invoer.regels);

  await client.query(
    `UPDATE sales_invoice SET
       contact_id = $3, factuurdatum = $4, leverdatum = $5, vervaldatum = $6, referentie = $7,
       notitie = $8, valuta = $9, totaal_exclusief = $10, totaal_btw = $11, totaal_inclusief = $12,
       gewijzigd_op = now(), versie = versie + 1
     WHERE administration_id = $1 AND id = $2`,
    [
      context.administratieId,
      factuurId,
      invoer.contactId,
      invoer.factuurdatum,
      invoer.leverdatum ?? invoer.factuurdatum,
      invoer.vervaldatum ?? bestaand.factuur.vervaldatum,
      invoer.referentie ?? null,
      invoer.notitie ?? null,
      valuta,
      totalen.totaalExclusief.toString(),
      totalen.totaalBtw.toString(),
      totalen.totaalInclusief.toString(),
    ],
  );

  await schrijfRegels(client, context.administratieId, factuurId, invoer.regels, totalen.regels);
}

/**
 * Maakt de factuur definitief: controleert de wettelijke vereisten, kent een
 * nummer toe uit een sluitende reeks en boekt hem.
 */
export async function maakDefinitief(
  client: Db,
  context: TenantContext & { administratieId: string },
  factuurId: string,
): Promise<{ documentnummer: string; postId: string }> {
  const { factuur, regels } = await leesFactuur(client, context.administratieId, factuurId);
  if (factuur.status !== 'concept') {
    throw new ApiFout('entry_immutable', 'Deze factuur is al definitief.', 'Ververs de pagina om de actuele status te zien.');
  }
  if (factuur.soort === 'offerte') {
    throw new ApiFout(
      'validation_failed',
      'Een offerte wordt niet definitief gemaakt maar omgezet naar een factuur.',
      'Gebruik "Omzetten naar factuur".',
    );
  }

  const administratie = await leesAdministratie(client, context.administratieId);
  const contact = await leesContact(client, context.administratieId, factuur.contact_id);
  const adres = await factuuradres(client, context.administratieId, factuur.contact_id);
  const register = await rekeningregister(client, context.administratieId);

  const btwCodes = new Map<string, Awaited<ReturnType<typeof btwCodeOpId>>>();
  for (const regel of regels) {
    if (!btwCodes.has(regel.tax_code_id)) {
      btwCodes.set(regel.tax_code_id, await btwCodeOpId(client, context.administratieId, regel.tax_code_id));
    }
  }

  // Wettelijke factuurvereisten; blokkeert als er iets verplichts ontbreekt.
  eisFactuurvereisten({
    factuurdatum: factuur.factuurdatum,
    factuurnummer: 'wordt-toegekend',
    leverdatum: factuur.leverdatum,
    verkoper: {
      naam: administratie.naam,
      adres: administratie.adres,
      postcodePlaats: administratie.postcode_plaats,
      btwNummer: administratie.btw_nummer,
      kvkNummer: administratie.kvk_nummer,
    },
    afnemer: {
      naam: contact.naam,
      adres: adres?.adres ?? null,
      postcodePlaats: adres ? `${adres.postcode ?? ''} ${adres.plaats ?? ''}`.trim() : null,
      btwNummer: contact.btw_nummer,
      land: contact.land,
    },
    regels: regels.map((regel) => ({
      omschrijving: regel.omschrijving,
      aantal: regel.aantal,
      btwCode: btwCodes.get(regel.tax_code_id)!,
    })),
  });

  const jaar = Number(factuur.factuurdatum.slice(0, 4));
  const reeks = factuur.soort === 'creditnota' ? 'creditnota' : 'verkoopfactuur';
  const patroon = factuur.soort === 'creditnota' ? 'C{jaar}-{nummer:4}' : '{jaar}-{nummer:4}';
  const documentnummer = await volgendNummer(client, context.administratieId, reeks, jaar, patroon);

  const berekend: BerekendeRegel[] = regels.map((regel) => ({
    omschrijving: regel.omschrijving,
    rekeningId: regel.ledger_account_id,
    btwCode: btwCodes.get(regel.tax_code_id)!,
    exclusief: Money.vanTekst(regel.bedrag_exclusief, factuur.valuta),
    btw: Money.vanTekst(regel.bedrag_btw, factuur.valuta),
    inclusief: Money.vanTekst(regel.bedrag_inclusief, factuur.valuta),
  }));

  const post = boekVerkoopfactuur(
    {
      dagboekCode: 'VRK',
      boekdatum: factuur.factuurdatum,
      omschrijving: `${factuur.soort === 'creditnota' ? 'Creditnota' : 'Factuur'} ${documentnummer} - ${contact.naam}`,
      valuta: factuur.valuta,
      relatieId: factuur.contact_id,
      regels: berekend,
      totaalInclusief: Money.vanTekst(factuur.totaal_inclusief, factuur.valuta),
      factuurId,
      creditnota: factuur.soort === 'creditnota',
    },
    register,
  );

  const geboekt = await boek(client, context, post, { definitief: true, nummerSleutel: 'VRK' });

  await client.query(
    `UPDATE sales_invoice
        SET status = 'definitief', documentnummer = $3, journal_entry_id = $4,
            gewijzigd_op = now(), versie = versie + 1
      WHERE administration_id = $1 AND id = $2`,
    [context.administratieId, factuurId, documentnummer, geboekt.postId],
  );

  await auditeer(client, context, {
    actie: 'verkoopfactuur.definitief',
    onderwerpSoort: 'sales_invoice',
    onderwerpId: factuurId,
    gegevens: { documentnummer, totaal: factuur.totaal_inclusief, boeking: geboekt.postId },
  });

  return { documentnummer, postId: geboekt.postId };
}

/** Maakt een creditnota op basis van een bestaande factuur. */
export async function crediteer(
  client: Db,
  context: TenantContext & { administratieId: string },
  factuurId: string,
  opties: { datum?: string; reden?: string } = {},
): Promise<{ id: string }> {
  const { factuur, regels } = await leesFactuur(client, context.administratieId, factuurId);
  if (factuur.soort !== 'factuur') {
    throw new ApiFout('validation_failed', 'Alleen een factuur kan worden gecrediteerd.', '');
  }
  if (factuur.status === 'concept') {
    throw new ApiFout(
      'validation_failed',
      'Deze factuur is nog een concept.',
      'Pas het concept aan of verwijder het; crediteren is alleen nodig bij een definitieve factuur.',
    );
  }

  const nieuw = await maakFactuur(client, context, {
    contactId: factuur.contact_id,
    soort: 'creditnota',
    factuurdatum: opties.datum ?? new Date().toISOString().slice(0, 10),
    referentie: `Creditnota bij ${factuur.documentnummer}`,
    notitie: opties.reden ?? null,
    valuta: factuur.valuta,
    regels: regels.map((regel) => ({
      omschrijving: regel.omschrijving,
      aantal: regel.aantal,
      eenheid: regel.eenheid,
      prijs: regel.prijs,
      korting: regel.korting,
      btwCodeId: regel.tax_code_id,
      rekeningId: regel.ledger_account_id,
    })),
  });

  await client.query('UPDATE sales_invoice SET credits_invoice_id = $3 WHERE administration_id = $1 AND id = $2', [
    context.administratieId,
    nieuw.id,
    factuurId,
  ]);

  await auditeer(client, context, {
    actie: 'verkoopfactuur.gecrediteerd',
    onderwerpSoort: 'sales_invoice',
    onderwerpId: factuurId,
    gegevens: { creditnota: nieuw.id, reden: opties.reden ?? null },
  });

  return nieuw;
}

/** Zet een offerte om naar een factuur. */
export async function offerteNaarFactuur(
  client: Db,
  context: TenantContext & { administratieId: string },
  offerteId: string,
): Promise<{ id: string }> {
  const { factuur, regels } = await leesFactuur(client, context.administratieId, offerteId);
  if (factuur.soort !== 'offerte') {
    throw new ApiFout('validation_failed', 'Dit is geen offerte.', '');
  }
  const nieuw = await maakFactuur(client, context, {
    contactId: factuur.contact_id,
    soort: 'factuur',
    factuurdatum: new Date().toISOString().slice(0, 10),
    referentie: factuur.referentie,
    notitie: factuur.notitie,
    valuta: factuur.valuta,
    regels: regels.map((regel) => ({
      omschrijving: regel.omschrijving,
      aantal: regel.aantal,
      eenheid: regel.eenheid,
      prijs: regel.prijs,
      korting: regel.korting,
      btwCodeId: regel.tax_code_id,
      rekeningId: regel.ledger_account_id,
    })),
  });
  await client.query(
    `UPDATE sales_invoice SET status = 'geannuleerd', gewijzigd_op = now() WHERE administration_id = $1 AND id = $2`,
    [context.administratieId, offerteId],
  );
  return nieuw;
}

export async function leesFactuur(
  client: Db,
  administratieId: string,
  factuurId: string,
): Promise<{ factuur: FactuurRij; regels: FactuurregelRij[] }> {
  const { rows } = await client.query<FactuurRij>(
    `SELECT f.id, f.contact_id, c.naam AS contact_naam, f.soort, f.documentnummer, f.status,
            f.factuurdatum::text AS factuurdatum, f.leverdatum::text AS leverdatum,
            f.vervaldatum::text AS vervaldatum, f.referentie, f.notitie, f.valuta,
            f.wisselkoers::text AS wisselkoers, f.totaal_exclusief::text AS totaal_exclusief,
            f.totaal_btw::text AS totaal_btw, f.totaal_inclusief::text AS totaal_inclusief,
            f.betaald_bedrag::text AS betaald_bedrag, f.journal_entry_id::text AS journal_entry_id,
            f.pdf_document_id::text AS pdf_document_id, f.verzonden_op::text AS verzonden_op, f.versie
       FROM sales_invoice f JOIN contact c ON c.id = f.contact_id
      WHERE f.administration_id = $1 AND f.id = $2`,
    [administratieId, factuurId],
  );
  const factuur = rows[0];
  if (!factuur) throw fout.nietGevonden('Deze factuur');

  const regels = await client.query<FactuurregelRij>(
    `SELECT l.id, l.regelnummer, l.omschrijving, l.aantal::text AS aantal, l.eenheid,
            l.prijs::text AS prijs, l.korting::text AS korting, l.tax_code_id,
            t.code AS btw_code, t.tarief::text AS btw_tarief,
            l.ledger_account_id, a.code AS rekening_code,
            l.bedrag_exclusief::text AS bedrag_exclusief, l.bedrag_btw::text AS bedrag_btw,
            l.bedrag_inclusief::text AS bedrag_inclusief
       FROM sales_invoice_line l
       JOIN tax_code t ON t.id = l.tax_code_id
       JOIN ledger_account a ON a.id = l.ledger_account_id
      WHERE l.administration_id = $1 AND l.invoice_id = $2
      ORDER BY l.regelnummer`,
    [administratieId, factuurId],
  );

  return { factuur, regels: regels.rows };
}

export type FactuurZoekopdracht = {
  /** Vrij zoeken op nummer, klantnaam of referentie. */
  zoek?: string;
  status?: string;
  soort?: FactuurSoort;
  contactId?: string;
  vanaf?: string;
  tot?: string;
  openstaand?: boolean;
  /** Alleen facturen waarvan de vervaldatum voorbij is en die nog niet betaald zijn. */
  vervallen?: boolean;
  sorteer?: 'datum' | 'nummer' | 'klant' | 'bedrag' | 'vervaldatum' | 'openstaand';
  richting?: 'op' | 'af';
  limiet?: number;
  offset?: number;
};

export type FactuurTotalen = {
  aantal: number;
  totaal: string;
  openstaand: string;
  vervallen: string;
};

/**
 * Sorteervolgordes, als vaste tabel.
 *
 * Een sorteerkolom uit de invoer mag nooit rechtstreeks in de query belanden;
 * daarom is dit een afbeelding van toegestane waarden naar vaste SQL en geen
 * samengestelde tekst.
 */
const SORTERING: Record<NonNullable<FactuurZoekopdracht['sorteer']>, string> = {
  datum: 'f.factuurdatum',
  nummer: 'f.documentnummer',
  klant: 'c.naam',
  bedrag: 'f.totaal_inclusief',
  vervaldatum: 'f.vervaldatum',
  openstaand: '(f.totaal_inclusief - f.betaald_bedrag)',
};

/** Bouwt de WHERE-voorwaarden die zowel de lijst als de totalen gebruiken. */
function bouwFilter(
  administratieId: string,
  opdracht: FactuurZoekopdracht,
): { waar: string; parameters: unknown[] } {
  const parameters: unknown[] = [administratieId];
  const voorwaarden: string[] = ['f.administration_id = $1'];

  if (opdracht.zoek) {
    parameters.push(`%${opdracht.zoek}%`);
    voorwaarden.push(
      `(f.documentnummer ILIKE $${parameters.length}
        OR c.naam ILIKE $${parameters.length}
        OR f.referentie ILIKE $${parameters.length})`,
    );
  }
  if (opdracht.status) {
    parameters.push(opdracht.status);
    voorwaarden.push(`f.status = $${parameters.length}`);
  }
  if (opdracht.soort) {
    parameters.push(opdracht.soort);
    voorwaarden.push(`f.soort = $${parameters.length}`);
  }
  if (opdracht.contactId) {
    parameters.push(opdracht.contactId);
    voorwaarden.push(`f.contact_id = $${parameters.length}`);
  }
  if (opdracht.vanaf) {
    parameters.push(opdracht.vanaf);
    voorwaarden.push(`f.factuurdatum >= $${parameters.length}::date`);
  }
  if (opdracht.tot) {
    parameters.push(opdracht.tot);
    voorwaarden.push(`f.factuurdatum <= $${parameters.length}::date`);
  }
  if (opdracht.openstaand || opdracht.vervallen) {
    voorwaarden.push(`f.status IN ('definitief', 'verzonden', 'deels_betaald', 'vervallen')`);
    voorwaarden.push('f.totaal_inclusief <> f.betaald_bedrag');
  }
  if (opdracht.vervallen) {
    voorwaarden.push('f.vervaldatum < CURRENT_DATE');
  }

  return { waar: voorwaarden.join(' AND '), parameters };
}

export async function zoekFacturen(
  client: Db,
  administratieId: string,
  opdracht: FactuurZoekopdracht = {},
): Promise<{ items: FactuurRij[]; totaalAantal: number; totalen: FactuurTotalen; meer: boolean }> {
  const limiet = Math.min(opdracht.limiet ?? 50, 200);
  const offset = Math.max(opdracht.offset ?? 0, 0);
  const { waar, parameters } = bouwFilter(administratieId, opdracht);

  const kolom = SORTERING[opdracht.sorteer ?? 'datum'];
  const richting = opdracht.richting === 'op' ? 'ASC' : 'DESC';

  const lijstParameters = [...parameters, limiet + 1, offset];

  const { rows } = await client.query<FactuurRij>(
    `SELECT f.id, f.contact_id, c.naam AS contact_naam, f.soort, f.documentnummer, f.status,
            f.factuurdatum::text AS factuurdatum, f.leverdatum::text AS leverdatum,
            f.vervaldatum::text AS vervaldatum, f.referentie, f.notitie, f.valuta,
            f.wisselkoers::text AS wisselkoers, f.totaal_exclusief::text AS totaal_exclusief,
            f.totaal_btw::text AS totaal_btw, f.totaal_inclusief::text AS totaal_inclusief,
            f.betaald_bedrag::text AS betaald_bedrag, f.journal_entry_id::text AS journal_entry_id,
            f.pdf_document_id::text AS pdf_document_id, f.verzonden_op::text AS verzonden_op, f.versie
       FROM sales_invoice f JOIN contact c ON c.id = f.contact_id
      WHERE ${waar}
      ORDER BY ${kolom} ${richting} NULLS LAST, f.id DESC
      LIMIT $${lijstParameters.length - 1} OFFSET $${lijstParameters.length}`,
    lijstParameters,
  );

  // De totalen gaan over het hele filter, niet over de zichtbare pagina; anders
  // verandert "nog te ontvangen" zodra je doorbladert.
  const samenvatting = await client.query<FactuurTotalen>(
    `SELECT count(*)::int AS aantal,
            COALESCE(SUM(f.totaal_inclusief), 0)::text AS totaal,
            COALESCE(SUM(f.totaal_inclusief - f.betaald_bedrag)
                     FILTER (WHERE f.status IN ('definitief', 'verzonden', 'deels_betaald', 'vervallen')), 0)::text
              AS openstaand,
            COALESCE(SUM(f.totaal_inclusief - f.betaald_bedrag)
                     FILTER (WHERE f.status IN ('definitief', 'verzonden', 'deels_betaald', 'vervallen')
                                   AND f.vervaldatum < CURRENT_DATE), 0)::text AS vervallen
       FROM sales_invoice f JOIN contact c ON c.id = f.contact_id
      WHERE ${waar}`,
    parameters,
  );

  const totalen = samenvatting.rows[0] ?? { aantal: 0, totaal: '0.00', openstaand: '0.00', vervallen: '0.00' };

  return {
    items: rows.slice(0, limiet),
    totaalAantal: totalen.aantal,
    totalen,
    meer: rows.length > limiet,
  };
}

/** Werkt de betaalstatus bij op basis van de gekoppelde betalingen. */
export async function herberekenBetaalstatus(
  client: Db,
  administratieId: string,
  factuurId: string,
): Promise<void> {
  const { rows } = await client.query<{ totaal: string; betaald: string; vervaldatum: string | null; status: string }>(
    `SELECT f.totaal_inclusief::text AS totaal,
            COALESCE((SELECT SUM(p.bedrag) FROM payment_allocation p
                       WHERE p.administration_id = f.administration_id AND p.sales_invoice_id = f.id), 0)::text AS betaald,
            f.vervaldatum::text AS vervaldatum, f.status
       FROM sales_invoice f WHERE f.administration_id = $1 AND f.id = $2`,
    [administratieId, factuurId],
  );
  const rij = rows[0];
  if (!rij) return;
  if (rij.status === 'concept' || rij.status === 'geannuleerd') return;

  const valutaRij = await client.query<{ valuta: string }>(
    'SELECT valuta FROM sales_invoice WHERE administration_id = $1 AND id = $2',
    [administratieId, factuurId],
  );
  const valuta = valutaRij.rows[0]?.valuta ?? 'EUR';
  const totaal = Money.vanTekst(rij.totaal, valuta);
  const betaald = Money.vanTekst(rij.betaald, valuta);

  let status: string;
  if (betaald.absoluut().gelijkAan(totaal.absoluut()) || (!totaal.isNul() && !betaald.absoluut().kleinerDan(totaal.absoluut()))) {
    status = 'betaald';
  } else if (!betaald.isNul()) {
    status = 'deels_betaald';
  } else if (rij.vervaldatum && rij.vervaldatum < new Date().toISOString().slice(0, 10)) {
    status = 'vervallen';
  } else {
    status = rij.status === 'verzonden' ? 'verzonden' : 'definitief';
  }

  await client.query(
    'UPDATE sales_invoice SET betaald_bedrag = $3, status = $4, gewijzigd_op = now() WHERE administration_id = $1 AND id = $2',
    [administratieId, factuurId, betaald.toString(), status],
  );
}

/** Het openstaande bedrag van een factuur. */
export function openstaand(factuur: FactuurRij): Money {
  const totaal = Money.vanTekst(factuur.totaal_inclusief, factuur.valuta);
  const betaald = Money.vanTekst(factuur.betaald_bedrag, factuur.valuta);
  return totaal.min(betaald);
}

/** Wisselkoers als Rate; handig bij vreemde valuta. */
export function koersVan(factuur: FactuurRij): Rate {
  return Rate.koers(factuur.wisselkoers);
}
