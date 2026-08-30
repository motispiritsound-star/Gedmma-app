/**
 * Bankrekeningen, import, matching en boeken.
 *
 * Matching doet een voorstel; boeken doet een mens (of een regel die de
 * gebruiker expliciet op "automatisch" heeft gezet). Zie docs/product-vision.md,
 * principe 3.
 */
import { Money } from '@gedmma/money';
import { boekBanktransactie, type Aflettering, type DirecteBoeking } from '@gedmma/accounting';
import type { Db, TenantContext } from '../../db/pool.ts';
import { ApiFout, fout } from '../../http/fout.ts';
import { auditeer } from '../audit/service.ts';
import { boek, rekeningregister } from '../grootboek/service.ts';
import { btwCodeOpId } from '../grootboek/repo.ts';
import { leesAdministratie } from '../organisaties/service.ts';
import { herberekenBetaalstatus } from '../verkoop/service.ts';
import { herberekenInkoopBetaalstatus } from '../inkoop/service.ts';
import { dedupeHash, leesBankbestand, type RuweTransactie } from '../../import/banktransacties.ts';

export type BankrekeningRij = {
  id: string;
  naam: string;
  iban: string | null;
  valuta: string;
  ledger_account_id: string;
  journal_id: string | null;
  soort: string;
  status: string;
};

export type BanktransactieRij = {
  id: string;
  bank_account_id: string;
  boekdatum: string;
  valutadatum: string | null;
  bedrag: string;
  valuta: string;
  tegenrekening: string | null;
  tegenpartij: string | null;
  omschrijving: string;
  kenmerk: string | null;
  status: string;
  journal_entry_id: string | null;
  versie: number;
};

export async function bankrekeningen(client: Db, administratieId: string): Promise<BankrekeningRij[]> {
  const { rows } = await client.query<BankrekeningRij>(
    `SELECT id, naam, iban, valuta, ledger_account_id, journal_id, soort, status
       FROM bank_account WHERE administration_id = $1 AND status = 'actief' ORDER BY naam`,
    [administratieId],
  );
  return rows;
}

export async function maakBankrekening(
  client: Db,
  context: TenantContext & { administratieId: string },
  invoer: { naam: string; iban?: string | null; valuta?: string; ledgerAccountId: string; soort?: string },
): Promise<{ id: string }> {
  const dagboek = await client.query<{ id: string }>(
    `SELECT id FROM journal WHERE administration_id = $1 AND code = 'BNK'`,
    [context.administratieId],
  );
  const { rows } = await client.query<{ id: string }>(
    `INSERT INTO bank_account (administration_id, naam, iban, valuta, ledger_account_id, journal_id, soort)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
    [
      context.administratieId,
      invoer.naam,
      invoer.iban ? invoer.iban.replace(/\s/g, '').toUpperCase() : null,
      (invoer.valuta ?? 'EUR').toUpperCase(),
      invoer.ledgerAccountId,
      dagboek.rows[0]?.id ?? null,
      invoer.soort ?? 'bank',
    ],
  );
  const id = rows[0]?.id;
  if (!id) throw new Error('De bankrekening kon niet worden aangemaakt.');

  await auditeer(client, context, {
    actie: 'bank.rekening_gekoppeld',
    onderwerpSoort: 'bank_account',
    onderwerpId: id,
    gegevens: { naam: invoer.naam, soort: invoer.soort ?? 'bank' },
  });
  return { id };
}

export type ImportResultaat = {
  bron: 'csv' | 'mt940' | 'camt053';
  afschriftId: string;
  gelezen: number;
  toegevoegd: number;
  overgeslagen: number;
  eindsaldoAfschrift: string | null;
  saldoGrootboek: string;
  saldoSluitAan: boolean | null;
  waarschuwingen: string[];
};

/**
 * Importeert een bankbestand. Transacties die er al in staan worden
 * overgeslagen (niet als fout), zodat overlappende afschriften geen dubbele
 * boekingen opleveren.
 */
export async function importeerBestand(
  client: Db,
  context: TenantContext & { administratieId: string },
  invoer: { bankRekeningId: string; inhoud: string; bestandsnaam?: string },
): Promise<ImportResultaat> {
  const rekening = await bankrekeningOpId(client, context.administratieId, invoer.bankRekeningId);
  const { bron, afschrift } = leesBankbestand(invoer.inhoud, invoer.bestandsnaam ?? '');
  const waarschuwingen: string[] = [];

  if (afschrift.iban && rekening.iban && afschrift.iban !== rekening.iban) {
    throw new ApiFout(
      'validation_failed',
      `Dit afschrift hoort bij ${afschrift.iban}, maar je importeert het op ${rekening.iban}.`,
      'Kies de juiste bankrekening, of pas het IBAN van de rekening aan.',
      { afschriftIban: afschrift.iban, rekeningIban: rekening.iban },
    );
  }
  if (afschrift.valuta && afschrift.valuta !== rekening.valuta) {
    waarschuwingen.push(
      `Het afschrift staat in ${afschrift.valuta} en de rekening in ${rekening.valuta}. Controleer de bedragen.`,
    );
  }

  const { rows: afschriftRij } = await client.query<{ id: string }>(
    `INSERT INTO bank_statement
       (administration_id, bank_account_id, afschriftnummer, bron, van_datum, tot_datum,
        beginsaldo, eindsaldo, bestandsnaam, aangemaakt_door)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
    [
      context.administratieId,
      rekening.id,
      afschrift.afschriftnummer,
      bron,
      afschrift.vanDatum,
      afschrift.totDatum,
      afschrift.beginsaldo,
      afschrift.eindsaldo,
      invoer.bestandsnaam ?? null,
      context.gebruikerId,
    ],
  );
  const afschriftId = afschriftRij[0]?.id ?? '';

  let toegevoegd = 0;
  let overgeslagen = 0;
  for (const transactie of afschrift.transacties) {
    const hash = dedupeHash(transactie, rekening.iban ?? afschrift.iban);
    const { rowCount } = await client.query(
      `INSERT INTO bank_transaction
         (administration_id, bank_account_id, statement_id, boekdatum, valutadatum, bedrag, valuta,
          tegenrekening, tegenpartij, omschrijving, kenmerk, externe_id, dedupe_hash)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       ON CONFLICT (administration_id, bank_account_id, dedupe_hash) DO NOTHING`,
      [
        context.administratieId,
        rekening.id,
        afschriftId,
        transactie.boekdatum,
        transactie.valutadatum,
        transactie.bedrag,
        transactie.valuta,
        transactie.tegenrekening,
        transactie.tegenpartij,
        transactie.omschrijving,
        transactie.kenmerk,
        transactie.externeId,
        hash,
      ],
    );
    if (rowCount > 0) toegevoegd += 1;
    else overgeslagen += 1;
  }

  const saldoGrootboek = await grootboeksaldoBank(client, context.administratieId, rekening);
  const eindsaldo = afschrift.eindsaldo;
  const sluitAan = eindsaldo === null ? null : Money.vanTekst(eindsaldo, rekening.valuta).gelijkAan(saldoGrootboek);
  if (sluitAan === false) {
    waarschuwingen.push(
      `Het eindsaldo van het afschrift (${eindsaldo}) wijkt af van het grootboeksaldo (${saldoGrootboek}). ` +
        'Dat is normaal zolang er nog transacties open staan; controleer het na het boeken.',
    );
  }

  await auditeer(client, context, {
    actie: 'bank.import',
    onderwerpSoort: 'bank_statement',
    onderwerpId: afschriftId,
    gegevens: { bron, gelezen: afschrift.transacties.length, toegevoegd, overgeslagen },
  });

  return {
    bron,
    afschriftId,
    gelezen: afschrift.transacties.length,
    toegevoegd,
    overgeslagen,
    eindsaldoAfschrift: eindsaldo,
    saldoGrootboek: saldoGrootboek.toString(),
    saldoSluitAan: sluitAan,
    waarschuwingen,
  };
}

async function grootboeksaldoBank(
  client: Db,
  administratieId: string,
  rekening: BankrekeningRij,
): Promise<Money> {
  const { rows } = await client.query<{ saldo: string }>(
    `SELECT COALESCE(SUM(l.debet - l.credit), 0)::text AS saldo
       FROM journal_line l JOIN journal_entry e ON e.id = l.entry_id
      WHERE l.administration_id = $1 AND l.ledger_account_id = $2 AND e.status = 'definitief'`,
    [administratieId, rekening.ledger_account_id],
  );
  return Money.vanTekst(rows[0]?.saldo ?? '0', rekening.valuta);
}

export async function bankrekeningOpId(
  client: Db,
  administratieId: string,
  id: string,
): Promise<BankrekeningRij> {
  const { rows } = await client.query<BankrekeningRij>(
    `SELECT id, naam, iban, valuta, ledger_account_id, journal_id, soort, status
       FROM bank_account WHERE administration_id = $1 AND id = $2`,
    [administratieId, id],
  );
  const rij = rows[0];
  if (!rij) throw fout.nietGevonden('Deze bankrekening');
  return rij;
}

export type Matchvoorstel = {
  soort: 'verkoopfactuur' | 'inkoopfactuur';
  factuurId: string;
  documentnummer: string | null;
  relatie: string;
  openstaand: string;
  bedrag: string;
  /** 0 tot 1; hoe zeker het voorstel is. */
  zekerheid: number;
  /** Uitleg in gewone taal waarom dit voorstel er is. */
  motivatie: string;
};

/**
 * Zoekt openstaande facturen die bij een banktransactie kunnen horen.
 *
 * De volgorde van de aanwijzingen bepaalt de zekerheid: een factuurnummer in de
 * omschrijving is sterker bewijs dan alleen een gelijk bedrag.
 */
export async function zoekMatches(
  client: Db,
  administratieId: string,
  transactie: BanktransactieRij,
): Promise<Matchvoorstel[]> {
  const bedrag = Money.vanTekst(transactie.bedrag, transactie.valuta);
  const ontvangst = bedrag.isPositief();
  const zoektekst = `${transactie.omschrijving} ${transactie.kenmerk ?? ''}`.toLowerCase();

  const voorstellen: Matchvoorstel[] = [];

  if (ontvangst) {
    const { rows } = await client.query<{
      id: string;
      documentnummer: string | null;
      naam: string;
      iban: string | null;
      openstaand: string;
      valuta: string;
    }>(
      `SELECT f.id, f.documentnummer, c.naam, c.iban,
              (f.totaal_inclusief - f.betaald_bedrag)::text AS openstaand, f.valuta
         FROM sales_invoice f JOIN contact c ON c.id = f.contact_id
        WHERE f.administration_id = $1
          AND f.soort IN ('factuur', 'creditnota')
          AND f.status IN ('definitief', 'verzonden', 'deels_betaald', 'vervallen')
          AND f.totaal_inclusief <> f.betaald_bedrag
        ORDER BY f.factuurdatum DESC
        LIMIT 200`,
      [administratieId],
    );
    for (const rij of rows) {
      const open = Money.vanTekst(rij.openstaand, rij.valuta);
      const score = scoor({ zoektekst, documentnummer: rij.documentnummer, naam: rij.naam, iban: rij.iban, tegenrekening: transactie.tegenrekening, tegenpartij: transactie.tegenpartij, bedragGelijk: open.gelijkAan(bedrag) });
      if (score.zekerheid > 0) {
        voorstellen.push({
          soort: 'verkoopfactuur',
          factuurId: rij.id,
          documentnummer: rij.documentnummer,
          relatie: rij.naam,
          openstaand: open.toString(),
          bedrag: open.kleinerDan(bedrag) ? open.toString() : bedrag.toString(),
          zekerheid: score.zekerheid,
          motivatie: score.motivatie,
        });
      }
    }
  } else {
    const { rows } = await client.query<{
      id: string;
      leveranciersnummer: string | null;
      naam: string;
      iban: string | null;
      openstaand: string;
      valuta: string;
    }>(
      `SELECT f.id, f.leveranciersnummer, c.naam, c.iban,
              (f.totaal_inclusief - f.betaald_bedrag)::text AS openstaand, f.valuta
         FROM purchase_invoice f JOIN contact c ON c.id = f.contact_id
        WHERE f.administration_id = $1
          AND f.status IN ('definitief', 'deels_betaald')
          AND f.totaal_inclusief <> f.betaald_bedrag
        ORDER BY f.factuurdatum DESC
        LIMIT 200`,
      [administratieId],
    );
    const teBetalen = bedrag.absoluut();
    for (const rij of rows) {
      const open = Money.vanTekst(rij.openstaand, rij.valuta);
      const score = scoor({ zoektekst, documentnummer: rij.leveranciersnummer, naam: rij.naam, iban: rij.iban, tegenrekening: transactie.tegenrekening, tegenpartij: transactie.tegenpartij, bedragGelijk: open.gelijkAan(teBetalen) });
      if (score.zekerheid > 0) {
        voorstellen.push({
          soort: 'inkoopfactuur',
          factuurId: rij.id,
          documentnummer: rij.leveranciersnummer,
          relatie: rij.naam,
          openstaand: open.toString(),
          bedrag: open.kleinerDan(teBetalen) ? open.toString() : teBetalen.toString(),
          zekerheid: score.zekerheid,
          motivatie: score.motivatie,
        });
      }
    }
  }

  return voorstellen.sort((a, b) => b.zekerheid - a.zekerheid).slice(0, 5);
}

function scoor(invoer: {
  zoektekst: string;
  documentnummer: string | null;
  naam: string;
  iban: string | null;
  tegenrekening: string | null;
  tegenpartij: string | null;
  bedragGelijk: boolean;
}): { zekerheid: number; motivatie: string } {
  const redenen: string[] = [];
  let score = 0;

  if (invoer.documentnummer && invoer.zoektekst.includes(invoer.documentnummer.toLowerCase())) {
    score += 0.6;
    redenen.push(`het factuurnummer ${invoer.documentnummer} staat in de omschrijving`);
  }
  if (invoer.bedragGelijk) {
    score += 0.3;
    redenen.push('het bedrag komt precies overeen met wat er nog openstaat');
  }
  if (invoer.iban && invoer.tegenrekening && invoer.iban.replace(/\s/g, '').toUpperCase() === invoer.tegenrekening) {
    score += 0.2;
    redenen.push('de tegenrekening is die van deze relatie');
  }
  const naamDelen = invoer.naam.toLowerCase().split(/\s+/).filter((deel) => deel.length >= 4);
  const tegenpartij = (invoer.tegenpartij ?? '').toLowerCase();
  if (naamDelen.some((deel) => tegenpartij.includes(deel) || invoer.zoektekst.includes(deel))) {
    score += 0.15;
    redenen.push('de naam van de relatie komt voor in de transactie');
  }

  return {
    zekerheid: Math.min(1, Number(score.toFixed(2))),
    motivatie: redenen.length > 0 ? `Voorgesteld omdat ${redenen.join(', en ')}.` : '',
  };
}

export type BoekTransactieInvoer = {
  transactieId: string;
  afletteringen?: { factuurSoort: 'verkoopfactuur' | 'inkoopfactuur'; factuurId: string; bedrag: string }[];
  directeBoekingen?: { rekeningId: string; bedrag: string; omschrijving?: string; btwCodeId?: string | null }[];
};

/**
 * Boekt een banktransactie: bank aan de ene kant, afletteringen en directe
 * boekingen aan de andere. Alles in een transactie, inclusief het bijwerken van
 * de betaalstatus van de facturen.
 */
export async function boekTransactie(
  client: Db,
  context: TenantContext & { administratieId: string },
  invoer: BoekTransactieInvoer,
): Promise<{ postId: string }> {
  const transactie = await leesTransactie(client, context.administratieId, invoer.transactieId);
  if (transactie.status === 'geboekt') {
    throw new ApiFout(
      'conflict',
      'Deze banktransactie is al geboekt.',
      'Wil je iets wijzigen, maak dan een tegenboeking van de bijbehorende journaalpost.',
    );
  }

  const administratie = await leesAdministratie(client, context.administratieId);
  const rekening = await bankrekeningOpId(client, context.administratieId, transactie.bank_account_id);
  const register = await rekeningregister(client, context.administratieId);
  const valuta = transactie.valuta;

  const afletteringen: Aflettering[] = [];
  const gekoppeld: { soort: 'verkoopfactuur' | 'inkoopfactuur'; id: string; bedrag: string }[] = [];

  for (const koppeling of invoer.afletteringen ?? []) {
    const bedrag = Money.vanTekst(koppeling.bedrag, valuta);
    if (!bedrag.isPositief()) {
      throw fout.validatie([{ veld: 'bedrag', probleem: 'Koppel een bedrag groter dan nul.' }]);
    }
    if (koppeling.factuurSoort === 'verkoopfactuur') {
      const { rows } = await client.query<{ contact_id: string; documentnummer: string | null; openstaand: string }>(
        `SELECT contact_id, documentnummer, (totaal_inclusief - betaald_bedrag)::text AS openstaand
           FROM sales_invoice WHERE administration_id = $1 AND id = $2`,
        [context.administratieId, koppeling.factuurId],
      );
      const factuur = rows[0];
      if (!factuur) throw fout.nietGevonden('Deze factuur');
      const open = Money.vanTekst(factuur.openstaand, valuta);
      if (bedrag.groterDan(open.absoluut())) {
        throw fout.validatie(
          [{ veld: 'bedrag', probleem: `Er staat nog maar ${open} open op deze factuur.` }],
          'Je koppelt meer dan er openstaat.',
        );
      }
      afletteringen.push({
        rol: 'debiteuren',
        bedrag,
        relatieId: factuur.contact_id,
        omschrijving: `Factuur ${factuur.documentnummer ?? ''}`.trim(),
      });
    } else {
      const { rows } = await client.query<{ contact_id: string; leveranciersnummer: string | null; openstaand: string }>(
        `SELECT contact_id, leveranciersnummer, (totaal_inclusief - betaald_bedrag)::text AS openstaand
           FROM purchase_invoice WHERE administration_id = $1 AND id = $2`,
        [context.administratieId, koppeling.factuurId],
      );
      const factuur = rows[0];
      if (!factuur) throw fout.nietGevonden('Deze inkoopfactuur');
      const open = Money.vanTekst(factuur.openstaand, valuta);
      if (bedrag.groterDan(open.absoluut())) {
        throw fout.validatie(
          [{ veld: 'bedrag', probleem: `Er staat nog maar ${open} open op deze inkoopfactuur.` }],
          'Je koppelt meer dan er openstaat.',
        );
      }
      afletteringen.push({
        rol: 'crediteuren',
        bedrag,
        relatieId: factuur.contact_id,
        omschrijving: `Inkoopfactuur ${factuur.leveranciersnummer ?? ''}`.trim(),
      });
    }
    gekoppeld.push({ soort: koppeling.factuurSoort, id: koppeling.factuurId, bedrag: koppeling.bedrag });
  }

  const directeBoekingen: DirecteBoeking[] = [];
  for (const direct of invoer.directeBoekingen ?? []) {
    directeBoekingen.push({
      rekeningId: direct.rekeningId,
      bedrag: Money.vanTekst(direct.bedrag, valuta),
      omschrijving: direct.omschrijving ?? transactie.omschrijving,
      btwCode: direct.btwCodeId ? await btwCodeOpId(client, context.administratieId, direct.btwCodeId) : null,
    });
  }

  const post = boekBanktransactie(
    {
      dagboekCode: 'BNK',
      boekdatum: transactie.boekdatum,
      omschrijving: transactie.omschrijving || `Banktransactie ${transactie.boekdatum}`,
      valuta,
      bankRekeningId: rekening.ledger_account_id,
      bedrag: Money.vanTekst(transactie.bedrag, valuta),
      transactieId: transactie.id,
      afletteringen,
      directeBoekingen,
      verschilTolerantie: Money.vanTekst(administratie.betalingsverschil_tolerantie, valuta),
    },
    register,
  );

  const geboekt = await boek(client, context, post, { definitief: true, nummerSleutel: 'BNK' });

  await client.query(
    `UPDATE bank_transaction SET status = 'geboekt', journal_entry_id = $3, versie = versie + 1
      WHERE administration_id = $1 AND id = $2`,
    [context.administratieId, transactie.id, geboekt.postId],
  );

  for (const koppeling of gekoppeld) {
    await client.query(
      `INSERT INTO payment_allocation
         (administration_id, bank_transaction_id, sales_invoice_id, purchase_invoice_id,
          journal_entry_id, bedrag, aangemaakt_door)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        context.administratieId,
        transactie.id,
        koppeling.soort === 'verkoopfactuur' ? koppeling.id : null,
        koppeling.soort === 'inkoopfactuur' ? koppeling.id : null,
        geboekt.postId,
        koppeling.bedrag,
        context.gebruikerId,
      ],
    );
    if (koppeling.soort === 'verkoopfactuur') {
      await herberekenBetaalstatus(client, context.administratieId, koppeling.id);
    } else {
      await herberekenInkoopBetaalstatus(client, context.administratieId, koppeling.id);
    }
  }

  await auditeer(client, context, {
    actie: 'bank.transactie_geboekt',
    onderwerpSoort: 'bank_transaction',
    onderwerpId: transactie.id,
    gegevens: {
      bedrag: transactie.bedrag,
      boeking: geboekt.postId,
      koppelingen: gekoppeld.length,
      directeBoekingen: directeBoekingen.length,
    },
  });

  return { postId: geboekt.postId };
}

export async function leesTransactie(
  client: Db,
  administratieId: string,
  id: string,
): Promise<BanktransactieRij> {
  const { rows } = await client.query<BanktransactieRij>(
    `SELECT id, bank_account_id, boekdatum::text AS boekdatum, valutadatum::text AS valutadatum,
            bedrag::text AS bedrag, valuta, tegenrekening, tegenpartij, omschrijving, kenmerk,
            status, journal_entry_id::text AS journal_entry_id, versie
       FROM bank_transaction WHERE administration_id = $1 AND id = $2`,
    [administratieId, id],
  );
  const rij = rows[0];
  if (!rij) throw fout.nietGevonden('Deze banktransactie');
  return rij;
}

export async function zoekTransacties(
  client: Db,
  administratieId: string,
  opties: { status?: string; bankRekeningId?: string; vanaf?: string; tot?: string; limiet?: number } = {},
): Promise<BanktransactieRij[]> {
  const parameters: unknown[] = [administratieId];
  const voorwaarden: string[] = [];
  if (opties.status) {
    parameters.push(opties.status);
    voorwaarden.push(`status = $${parameters.length}`);
  }
  if (opties.bankRekeningId) {
    parameters.push(opties.bankRekeningId);
    voorwaarden.push(`bank_account_id = $${parameters.length}`);
  }
  if (opties.vanaf) {
    parameters.push(opties.vanaf);
    voorwaarden.push(`boekdatum >= $${parameters.length}::date`);
  }
  if (opties.tot) {
    parameters.push(opties.tot);
    voorwaarden.push(`boekdatum <= $${parameters.length}::date`);
  }
  parameters.push(Math.min(opties.limiet ?? 50, 200));

  const { rows } = await client.query<BanktransactieRij>(
    `SELECT id, bank_account_id, boekdatum::text AS boekdatum, valutadatum::text AS valutadatum,
            bedrag::text AS bedrag, valuta, tegenrekening, tegenpartij, omschrijving, kenmerk,
            status, journal_entry_id::text AS journal_entry_id, versie
       FROM bank_transaction
      WHERE administration_id = $1 ${voorwaarden.length > 0 ? `AND ${voorwaarden.join(' AND ')}` : ''}
      ORDER BY boekdatum DESC, id DESC
      LIMIT $${parameters.length}`,
    parameters,
  );
  return rows;
}

/**
 * Bankreconciliatie: vergelijkt het eindsaldo van het laatste afschrift met het
 * grootboeksaldo en geeft aan wat er nog open staat.
 */
export async function reconciliatie(
  client: Db,
  administratieId: string,
  bankRekeningId: string,
): Promise<{
  saldoGrootboek: string;
  eindsaldoAfschrift: string | null;
  verschil: string | null;
  ongeboekteTransacties: number;
  ongeboekteSom: string;
  sluitAan: boolean;
}> {
  const rekening = await bankrekeningOpId(client, administratieId, bankRekeningId);
  const saldo = await grootboeksaldoBank(client, administratieId, rekening);

  const { rows: afschrift } = await client.query<{ eindsaldo: string | null }>(
    `SELECT eindsaldo::text AS eindsaldo FROM bank_statement
      WHERE administration_id = $1 AND bank_account_id = $2 AND eindsaldo IS NOT NULL
      ORDER BY tot_datum DESC NULLS LAST, aangemaakt_op DESC LIMIT 1`,
    [administratieId, bankRekeningId],
  );
  const eindsaldo = afschrift[0]?.eindsaldo ?? null;

  const { rows: open } = await client.query<{ aantal: string; som: string }>(
    `SELECT count(*)::text AS aantal, COALESCE(SUM(bedrag), 0)::text AS som
       FROM bank_transaction
      WHERE administration_id = $1 AND bank_account_id = $2 AND status <> 'geboekt' AND status <> 'genegeerd'`,
    [administratieId, bankRekeningId],
  );

  const ongeboekteSom = Money.vanTekst(open[0]?.som ?? '0', rekening.valuta);
  const verschil = eindsaldo ? Money.vanTekst(eindsaldo, rekening.valuta).min(saldo).min(ongeboekteSom) : null;

  return {
    saldoGrootboek: saldo.toString(),
    eindsaldoAfschrift: eindsaldo,
    verschil: verschil?.toString() ?? null,
    ongeboekteTransacties: Number(open[0]?.aantal ?? '0'),
    ongeboekteSom: ongeboekteSom.toString(),
    sluitAan: verschil ? verschil.isNul() : false,
  };
}

/** Past de boekingsregels toe en levert een voorstel per transactie. */
export async function pasRegelsToe(
  client: Db,
  administratieId: string,
  transactie: BanktransactieRij,
): Promise<{ rekeningId: string; btwCodeId: string | null; regelNaam: string; automatisch: boolean } | null> {
  const { rows } = await client.query<{
    id: string;
    naam: string;
    voorwaarden: Record<string, unknown>;
    ledger_account_id: string | null;
    tax_code_id: string | null;
    automatisch_boeken: boolean;
  }>(
    `SELECT id, naam, voorwaarden, ledger_account_id, tax_code_id, automatisch_boeken
       FROM bank_rule WHERE administration_id = $1 AND actief = true ORDER BY volgorde, naam`,
    [administratieId],
  );

  for (const regel of rows) {
    if (!regel.ledger_account_id) continue;
    if (voldoetAanVoorwaarden(transactie, regel.voorwaarden)) {
      return {
        rekeningId: regel.ledger_account_id,
        btwCodeId: regel.tax_code_id,
        regelNaam: regel.naam,
        automatisch: regel.automatisch_boeken,
      };
    }
  }
  return null;
}

export function voldoetAanVoorwaarden(
  transactie: BanktransactieRij,
  voorwaarden: Record<string, unknown>,
): boolean {
  const tekst = `${transactie.omschrijving} ${transactie.tegenpartij ?? ''} ${transactie.kenmerk ?? ''}`.toLowerCase();

  if (typeof voorwaarden.bevat === 'string' && !tekst.includes(voorwaarden.bevat.toLowerCase())) return false;
  if (typeof voorwaarden.tegenrekening === 'string') {
    const iban = (transactie.tegenrekening ?? '').replace(/\s/g, '').toUpperCase();
    if (iban !== voorwaarden.tegenrekening.replace(/\s/g, '').toUpperCase()) return false;
  }
  if (voorwaarden.richting === 'af' && !transactie.bedrag.startsWith('-')) return false;
  if (voorwaarden.richting === 'bij' && transactie.bedrag.startsWith('-')) return false;
  if (typeof voorwaarden.bedragVan === 'string') {
    if (Money.vanTekst(transactie.bedrag, transactie.valuta).absoluut().kleinerDan(Money.vanTekst(voorwaarden.bedragVan, transactie.valuta))) return false;
  }
  if (typeof voorwaarden.bedragTot === 'string') {
    if (Money.vanTekst(transactie.bedrag, transactie.valuta).absoluut().groterDan(Money.vanTekst(voorwaarden.bedragTot, transactie.valuta))) return false;
  }
  return Object.keys(voorwaarden).length > 0;
}

/** Herkent overboekingen tussen eigen rekeningen. */
export async function isInterneOverboeking(
  client: Db,
  administratieId: string,
  transactie: BanktransactieRij,
): Promise<boolean> {
  if (!transactie.tegenrekening) return false;
  const { rowCount } = await client.query(
    `SELECT 1 FROM bank_account
      WHERE administration_id = $1 AND replace(upper(iban), ' ', '') = $2 AND id <> $3`,
    [administratieId, transactie.tegenrekening.replace(/\s/g, '').toUpperCase(), transactie.bank_account_id],
  );
  return rowCount > 0;
}

/** Ruwe transacties handmatig toevoegen, bijvoorbeeld bij een kasboek. */
export async function voegTransactieToe(
  client: Db,
  context: TenantContext & { administratieId: string },
  bankRekeningId: string,
  transactie: RuweTransactie,
): Promise<{ id: string | null }> {
  const rekening = await bankrekeningOpId(client, context.administratieId, bankRekeningId);
  const { rows } = await client.query<{ id: string }>(
    `INSERT INTO bank_transaction
       (administration_id, bank_account_id, boekdatum, valutadatum, bedrag, valuta,
        tegenrekening, tegenpartij, omschrijving, kenmerk, externe_id, dedupe_hash)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     ON CONFLICT (administration_id, bank_account_id, dedupe_hash) DO NOTHING
     RETURNING id`,
    [
      context.administratieId,
      bankRekeningId,
      transactie.boekdatum,
      transactie.valutadatum,
      transactie.bedrag,
      transactie.valuta || rekening.valuta,
      transactie.tegenrekening,
      transactie.tegenpartij,
      transactie.omschrijving,
      transactie.kenmerk,
      transactie.externeId,
      dedupeHash(transactie, rekening.iban),
    ],
  );
  return { id: rows[0]?.id ?? null };
}
