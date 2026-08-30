/**
 * Rapportages.
 *
 * Harde regel: elk rapport leest uitsluitend uit `journal_line`. Er is geen
 * tweede administratie van saldi, dus "het rapport klopt niet met het grootboek"
 * kan structureel niet voorkomen. Elke regel draagt de gegevens mee om door te
 * klikken naar de onderliggende boekingen.
 */
import { Money } from '@gedmma/money';
import type { Db } from '../../db/pool.ts';
import { leesAdministratie } from '../organisaties/service.ts';

export type Periode = { vanaf: string; tot: string };

export type BalansRegel = {
  rekeningId: string;
  code: string;
  naam: string;
  rubriek: string;
  soort: string;
  saldo: string;
  /** Filter waarmee de gebruiker naar de onderliggende boekingen kan doorklikken. */
  drilldown: { rekeningId: string; vanaf: string | null; tot: string };
};

export type Balans = {
  peildatum: string;
  valuta: string;
  activa: BalansRegel[];
  passiva: BalansRegel[];
  totaalActiva: string;
  totaalPassiva: string;
  resultaatBoekjaar: string;
  inBalans: boolean;
};

/**
 * De balans op een peildatum. Het resultaat van het lopende boekjaar wordt als
 * aparte post onder het eigen vermogen getoond; zonder die post zou de balans
 * niet sluiten zolang het jaar niet is afgesloten.
 */
export async function balans(client: Db, administratieId: string, peildatum: string): Promise<Balans> {
  const administratie = await leesAdministratie(client, administratieId);
  const valuta = administratie.valuta;

  const boekjaar = await boekjaarVoorDatum(client, administratieId, peildatum);

  const { rows } = await client.query<{
    id: string;
    code: string;
    naam: string;
    rubriek: string;
    soort: string;
    saldo: string;
  }>(
    `SELECT a.id, a.code, a.naam, a.rubriek, a.soort,
            COALESCE(SUM(l.debet - l.credit), 0)::text AS saldo
       FROM ledger_account a
       LEFT JOIN journal_line l ON l.ledger_account_id = a.id AND l.administration_id = a.administration_id
       LEFT JOIN journal_entry e ON e.id = l.entry_id AND e.status = 'definitief' AND e.boekdatum <= $2::date
      WHERE a.administration_id = $1
        AND a.soort IN ('asset', 'liability', 'equity')
        AND (e.id IS NOT NULL OR l.id IS NULL)
      GROUP BY a.id, a.code, a.naam, a.rubriek, a.soort
      ORDER BY a.code`,
    [administratieId, peildatum],
  );

  const resultaat = await resultaatOverPeriode(
    client,
    administratieId,
    boekjaar?.begint_op ?? null,
    peildatum,
    valuta,
  );

  const activa: BalansRegel[] = [];
  const passiva: BalansRegel[] = [];
  let totaalActiva = Money.nul(valuta);
  let totaalPassiva = Money.nul(valuta);

  for (const rij of rows) {
    const saldo = Money.vanTekst(rij.saldo, valuta);
    if (saldo.isNul()) continue;

    const regel: BalansRegel = {
      rekeningId: rij.id,
      code: rij.code,
      naam: rij.naam,
      rubriek: rij.rubriek,
      soort: rij.soort,
      // Passiva tonen we positief; intern is credit negatief.
      saldo: (rij.soort === 'asset' ? saldo : saldo.negatie()).toString(),
      drilldown: { rekeningId: rij.id, vanaf: null, tot: peildatum },
    };

    if (rij.soort === 'asset') {
      activa.push(regel);
      totaalActiva = totaalActiva.plus(saldo);
    } else {
      passiva.push(regel);
      totaalPassiva = totaalPassiva.plus(saldo.negatie());
    }
  }

  if (!resultaat.isNul()) {
    passiva.push({
      rekeningId: 'resultaat',
      code: '0599',
      naam: 'Resultaat lopend boekjaar',
      rubriek: 'Eigen vermogen',
      soort: 'equity',
      saldo: resultaat.toString(),
      drilldown: { rekeningId: 'resultaat', vanaf: boekjaar?.begint_op ?? null, tot: peildatum },
    });
    totaalPassiva = totaalPassiva.plus(resultaat);
  }

  return {
    peildatum,
    valuta,
    activa,
    passiva,
    totaalActiva: totaalActiva.toString(),
    totaalPassiva: totaalPassiva.toString(),
    resultaatBoekjaar: resultaat.toString(),
    inBalans: totaalActiva.gelijkAan(totaalPassiva),
  };
}

async function resultaatOverPeriode(
  client: Db,
  administratieId: string,
  vanaf: string | null,
  tot: string,
  valuta: string,
): Promise<Money> {
  const { rows } = await client.query<{ saldo: string }>(
    `SELECT COALESCE(SUM(l.credit - l.debet), 0)::text AS saldo
       FROM journal_line l
       JOIN journal_entry e ON e.id = l.entry_id
       JOIN ledger_account a ON a.id = l.ledger_account_id
      WHERE l.administration_id = $1
        AND a.soort IN ('revenue', 'expense')
        AND e.status = 'definitief'
        AND ($2::date IS NULL OR e.boekdatum >= $2)
        AND e.boekdatum <= $3::date`,
    [administratieId, vanaf, tot],
  );
  return Money.vanTekst(rows[0]?.saldo ?? '0', valuta);
}

async function boekjaarVoorDatum(
  client: Db,
  administratieId: string,
  datum: string,
): Promise<{ id: string; begint_op: string; eindigt_op: string } | null> {
  const { rows } = await client.query<{ id: string; begint_op: string; eindigt_op: string }>(
    `SELECT id, begint_op::text AS begint_op, eindigt_op::text AS eindigt_op
       FROM fiscal_year
      WHERE administration_id = $1 AND $2::date BETWEEN begint_op AND eindigt_op`,
    [administratieId, datum],
  );
  return rows[0] ?? null;
}

export type ResultaatRegel = {
  rekeningId: string;
  code: string;
  naam: string;
  rubriek: string;
  soort: 'revenue' | 'expense';
  bedrag: string;
  bedragVorigePeriode: string | null;
  drilldown: { rekeningId: string; vanaf: string; tot: string };
};

export type WinstEnVerlies = {
  periode: Periode;
  vergelijkPeriode: Periode | null;
  valuta: string;
  opbrengsten: ResultaatRegel[];
  kosten: ResultaatRegel[];
  totaalOpbrengsten: string;
  totaalKosten: string;
  resultaat: string;
  resultaatVorigePeriode: string | null;
};

/** Winst-en-verliesrekening, met optioneel een vergelijkingsperiode. */
export async function winstEnVerlies(
  client: Db,
  administratieId: string,
  periode: Periode,
  vergelijk?: Periode,
): Promise<WinstEnVerlies> {
  const administratie = await leesAdministratie(client, administratieId);
  const valuta = administratie.valuta;

  const huidige = await resultaatrekeningen(client, administratieId, periode);
  const vorige = vergelijk
    ? await resultaatrekeningen(client, administratieId, vergelijk)
    : new Map<string, { saldo: string }>();

  const opbrengsten: ResultaatRegel[] = [];
  const kosten: ResultaatRegel[] = [];
  let totaalOpbrengsten = Money.nul(valuta);
  let totaalKosten = Money.nul(valuta);

  for (const rij of huidige.values()) {
    const bedrag = Money.vanTekst(rij.saldo, valuta);
    if (bedrag.isNul() && !vorige.has(rij.id)) continue;

    const regel: ResultaatRegel = {
      rekeningId: rij.id,
      code: rij.code,
      naam: rij.naam,
      rubriek: rij.rubriek,
      soort: rij.soort as 'revenue' | 'expense',
      bedrag: bedrag.absoluut().toString(),
      bedragVorigePeriode: vergelijk
        ? Money.vanTekst(vorige.get(rij.id)?.saldo ?? '0', valuta).absoluut().toString()
        : null,
      drilldown: { rekeningId: rij.id, vanaf: periode.vanaf, tot: periode.tot },
    };

    if (rij.soort === 'revenue') {
      opbrengsten.push(regel);
      totaalOpbrengsten = totaalOpbrengsten.plus(bedrag.absoluut());
    } else {
      kosten.push(regel);
      totaalKosten = totaalKosten.plus(bedrag.absoluut());
    }
  }

  const resultaatVorige = vergelijk
    ? await resultaatOverPeriode(client, administratieId, vergelijk.vanaf, vergelijk.tot, valuta)
    : null;

  return {
    periode,
    vergelijkPeriode: vergelijk ?? null,
    valuta,
    opbrengsten,
    kosten,
    totaalOpbrengsten: totaalOpbrengsten.toString(),
    totaalKosten: totaalKosten.toString(),
    resultaat: totaalOpbrengsten.min(totaalKosten).toString(),
    resultaatVorigePeriode: resultaatVorige?.toString() ?? null,
  };
}

async function resultaatrekeningen(
  client: Db,
  administratieId: string,
  periode: Periode,
): Promise<Map<string, { id: string; code: string; naam: string; rubriek: string; soort: string; saldo: string }>> {
  const { rows } = await client.query<{
    id: string;
    code: string;
    naam: string;
    rubriek: string;
    soort: string;
    saldo: string;
  }>(
    `SELECT a.id, a.code, a.naam, a.rubriek, a.soort,
            COALESCE(SUM(l.credit - l.debet), 0)::text AS saldo
       FROM ledger_account a
       LEFT JOIN journal_line l ON l.ledger_account_id = a.id AND l.administration_id = a.administration_id
       LEFT JOIN journal_entry e ON e.id = l.entry_id AND e.status = 'definitief'
            AND e.boekdatum BETWEEN $2::date AND $3::date
      WHERE a.administration_id = $1 AND a.soort IN ('revenue', 'expense')
        AND (e.id IS NOT NULL OR l.id IS NULL)
      GROUP BY a.id, a.code, a.naam, a.rubriek, a.soort
      ORDER BY a.code`,
    [administratieId, periode.vanaf, periode.tot],
  );
  return new Map(rows.map((rij) => [rij.id, rij]));
}

export type SaldibalansRegel = {
  rekeningId: string;
  code: string;
  naam: string;
  soort: string;
  debet: string;
  credit: string;
  saldoDebet: string;
  saldoCredit: string;
};

/** Proef- en saldibalans: de klassieke controle dat alles sluit. */
export async function saldibalans(
  client: Db,
  administratieId: string,
  periode: Periode,
): Promise<{
  periode: Periode;
  valuta: string;
  regels: SaldibalansRegel[];
  totaalDebet: string;
  totaalCredit: string;
  totaalSaldoDebet: string;
  totaalSaldoCredit: string;
  sluit: boolean;
}> {
  const administratie = await leesAdministratie(client, administratieId);
  const valuta = administratie.valuta;

  const { rows } = await client.query<{
    id: string;
    code: string;
    naam: string;
    soort: string;
    debet: string;
    credit: string;
  }>(
    `SELECT a.id, a.code, a.naam, a.soort,
            COALESCE(SUM(l.debet), 0)::text AS debet,
            COALESCE(SUM(l.credit), 0)::text AS credit
       FROM ledger_account a
       JOIN journal_line l ON l.ledger_account_id = a.id AND l.administration_id = a.administration_id
       JOIN journal_entry e ON e.id = l.entry_id
      WHERE a.administration_id = $1 AND e.status = 'definitief'
        AND e.boekdatum BETWEEN $2::date AND $3::date
      GROUP BY a.id, a.code, a.naam, a.soort
      ORDER BY a.code`,
    [administratieId, periode.vanaf, periode.tot],
  );

  const regels: SaldibalansRegel[] = [];
  let totaalDebet = Money.nul(valuta);
  let totaalCredit = Money.nul(valuta);
  let totaalSaldoDebet = Money.nul(valuta);
  let totaalSaldoCredit = Money.nul(valuta);

  for (const rij of rows) {
    const debet = Money.vanTekst(rij.debet, valuta);
    const credit = Money.vanTekst(rij.credit, valuta);
    const saldo = debet.min(credit);
    const saldoDebet = saldo.isPositief() ? saldo : Money.nul(valuta);
    const saldoCredit = saldo.isNegatief() ? saldo.negatie() : Money.nul(valuta);

    regels.push({
      rekeningId: rij.id,
      code: rij.code,
      naam: rij.naam,
      soort: rij.soort,
      debet: debet.toString(),
      credit: credit.toString(),
      saldoDebet: saldoDebet.toString(),
      saldoCredit: saldoCredit.toString(),
    });

    totaalDebet = totaalDebet.plus(debet);
    totaalCredit = totaalCredit.plus(credit);
    totaalSaldoDebet = totaalSaldoDebet.plus(saldoDebet);
    totaalSaldoCredit = totaalSaldoCredit.plus(saldoCredit);
  }

  return {
    periode,
    valuta,
    regels,
    totaalDebet: totaalDebet.toString(),
    totaalCredit: totaalCredit.toString(),
    totaalSaldoDebet: totaalSaldoDebet.toString(),
    totaalSaldoCredit: totaalSaldoCredit.toString(),
    sluit: totaalDebet.gelijkAan(totaalCredit) && totaalSaldoDebet.gelijkAan(totaalSaldoCredit),
  };
}

export type GrootboekMutatie = {
  postId: string;
  postnummer: string | null;
  boekdatum: string;
  dagboek: string;
  omschrijving: string;
  regelOmschrijving: string | null;
  relatie: string | null;
  debet: string;
  credit: string;
  saldoNa: string;
  bronSoort: string | null;
  bronId: string | null;
  documentId: string | null;
};

/**
 * Grootboekkaart: alle mutaties op een rekening met een doorlopend saldo, en per
 * regel de verwijzing naar het brondocument. Dit is het doorklikscherm achter
 * elk rapportbedrag.
 */
export async function grootboekkaart(
  client: Db,
  administratieId: string,
  rekeningId: string,
  periode: Periode,
): Promise<{
  rekening: { id: string; code: string; naam: string; soort: string };
  periode: Periode;
  valuta: string;
  beginsaldo: string;
  eindsaldo: string;
  mutaties: GrootboekMutatie[];
}> {
  const administratie = await leesAdministratie(client, administratieId);
  const valuta = administratie.valuta;

  const { rows: rekeningRijen } = await client.query<{ id: string; code: string; naam: string; soort: string }>(
    'SELECT id, code, naam, soort FROM ledger_account WHERE administration_id = $1 AND id = $2',
    [administratieId, rekeningId],
  );
  const rekening = rekeningRijen[0];
  if (!rekening) throw new Error('Onbekende grootboekrekening.');

  const { rows: beginRijen } = await client.query<{ saldo: string }>(
    `SELECT COALESCE(SUM(l.debet - l.credit), 0)::text AS saldo
       FROM journal_line l JOIN journal_entry e ON e.id = l.entry_id
      WHERE l.administration_id = $1 AND l.ledger_account_id = $2
        AND e.status = 'definitief' AND e.boekdatum < $3::date`,
    [administratieId, rekeningId, periode.vanaf],
  );
  let saldo = Money.vanTekst(beginRijen[0]?.saldo ?? '0', valuta);
  const beginsaldo = saldo;

  const { rows } = await client.query<{
    post_id: string;
    postnummer: string | null;
    boekdatum: string;
    dagboek: string;
    omschrijving: string;
    regel_omschrijving: string | null;
    relatie: string | null;
    debet: string;
    credit: string;
    bron_soort: string | null;
    bron_id: string | null;
    document_id: string | null;
  }>(
    `SELECT e.id AS post_id, e.postnummer, e.boekdatum::text AS boekdatum, j.code AS dagboek,
            e.omschrijving, l.omschrijving AS regel_omschrijving, c.naam AS relatie,
            l.debet::text AS debet, l.credit::text AS credit,
            e.bron_soort, e.bron_id::text AS bron_id,
            pi.document_id::text AS document_id
       FROM journal_line l
       JOIN journal_entry e ON e.id = l.entry_id
       JOIN journal j ON j.id = e.journal_id
       LEFT JOIN contact c ON c.id = l.contact_id
       LEFT JOIN purchase_invoice pi ON pi.id = e.bron_id AND e.bron_soort = 'purchase_invoice'
      WHERE l.administration_id = $1 AND l.ledger_account_id = $2
        AND e.status IN ('definitief', 'gestorneerd')
        AND e.boekdatum BETWEEN $3::date AND $4::date
      ORDER BY e.boekdatum, e.postnummer NULLS LAST, l.regelnummer`,
    [administratieId, rekeningId, periode.vanaf, periode.tot],
  );

  const mutaties: GrootboekMutatie[] = rows.map((rij) => {
    saldo = saldo.plus(Money.vanTekst(rij.debet, valuta)).min(Money.vanTekst(rij.credit, valuta));
    return {
      postId: rij.post_id,
      postnummer: rij.postnummer,
      boekdatum: rij.boekdatum,
      dagboek: rij.dagboek,
      omschrijving: rij.omschrijving,
      regelOmschrijving: rij.regel_omschrijving,
      relatie: rij.relatie,
      debet: rij.debet,
      credit: rij.credit,
      saldoNa: saldo.toString(),
      bronSoort: rij.bron_soort,
      bronId: rij.bron_id,
      documentId: rij.document_id,
    };
  });

  return {
    rekening,
    periode,
    valuta,
    beginsaldo: beginsaldo.toString(),
    eindsaldo: saldo.toString(),
    mutaties,
  };
}

export type JournaalRegel = {
  postId: string;
  postnummer: string | null;
  boekdatum: string;
  dagboek: string;
  omschrijving: string;
  status: string;
  totaal: string;
  bronSoort: string | null;
  bronId: string | null;
};

/** Het journaal: alle posten chronologisch. */
export async function journaal(
  client: Db,
  administratieId: string,
  periode: Periode,
  opties: { limiet?: number; dagboek?: string } = {},
): Promise<JournaalRegel[]> {
  const { rows } = await client.query<{
    post_id: string;
    postnummer: string | null;
    boekdatum: string;
    dagboek: string;
    omschrijving: string;
    status: string;
    totaal: string;
    bron_soort: string | null;
    bron_id: string | null;
  }>(
    `SELECT e.id AS post_id, e.postnummer, e.boekdatum::text AS boekdatum, j.code AS dagboek,
            e.omschrijving, e.status, e.totaal_debet::text AS totaal, e.bron_soort, e.bron_id::text AS bron_id
       FROM journal_entry e JOIN journal j ON j.id = e.journal_id
      WHERE e.administration_id = $1
        AND e.boekdatum BETWEEN $2::date AND $3::date
        AND ($4::text IS NULL OR j.code = $4)
      ORDER BY e.boekdatum DESC, e.postnummer DESC NULLS LAST
      LIMIT $5`,
    [administratieId, periode.vanaf, periode.tot, opties.dagboek ?? null, Math.min(opties.limiet ?? 100, 500)],
  );

  return rows.map((rij) => ({
    postId: rij.post_id,
    postnummer: rij.postnummer,
    boekdatum: rij.boekdatum,
    dagboek: rij.dagboek,
    omschrijving: rij.omschrijving,
    status: rij.status,
    totaal: rij.totaal,
    bronSoort: rij.bron_soort,
    bronId: rij.bron_id,
  }));
}

export type OuderdomsRegel = {
  contactId: string;
  relatie: string;
  totaal: string;
  nietVervallen: string;
  tot30: string;
  tot60: string;
  tot90: string;
  ouder: string;
};

/** Ouderdomsanalyse van debiteuren of crediteuren. */
export async function ouderdomsanalyse(
  client: Db,
  administratieId: string,
  soort: 'debiteuren' | 'crediteuren',
  peildatum: string,
): Promise<{ peildatum: string; valuta: string; regels: OuderdomsRegel[]; totaal: string }> {
  const administratie = await leesAdministratie(client, administratieId);
  const valuta = administratie.valuta;
  const tabel = soort === 'debiteuren' ? 'sales_invoice' : 'purchase_invoice';
  const statussen =
    soort === 'debiteuren'
      ? `('definitief', 'verzonden', 'deels_betaald', 'vervallen')`
      : `('definitief', 'deels_betaald')`;

  const { rows } = await client.query<{
    contact_id: string;
    relatie: string;
    totaal: string;
    niet_vervallen: string;
    tot30: string;
    tot60: string;
    tot90: string;
    ouder: string;
  }>(
    `SELECT f.contact_id, c.naam AS relatie,
            SUM(f.totaal_inclusief - f.betaald_bedrag)::text AS totaal,
            SUM(CASE WHEN f.vervaldatum >= $2::date THEN f.totaal_inclusief - f.betaald_bedrag ELSE 0 END)::text AS niet_vervallen,
            SUM(CASE WHEN $2::date - f.vervaldatum BETWEEN 1 AND 30 THEN f.totaal_inclusief - f.betaald_bedrag ELSE 0 END)::text AS tot30,
            SUM(CASE WHEN $2::date - f.vervaldatum BETWEEN 31 AND 60 THEN f.totaal_inclusief - f.betaald_bedrag ELSE 0 END)::text AS tot60,
            SUM(CASE WHEN $2::date - f.vervaldatum BETWEEN 61 AND 90 THEN f.totaal_inclusief - f.betaald_bedrag ELSE 0 END)::text AS tot90,
            SUM(CASE WHEN $2::date - f.vervaldatum > 90 THEN f.totaal_inclusief - f.betaald_bedrag ELSE 0 END)::text AS ouder
       FROM ${tabel} f JOIN contact c ON c.id = f.contact_id
      WHERE f.administration_id = $1
        AND f.status IN ${statussen}
        AND f.totaal_inclusief <> f.betaald_bedrag
        AND f.factuurdatum <= $2::date
      GROUP BY f.contact_id, c.naam
      ORDER BY 3 DESC`,
    [administratieId, peildatum],
  );

  let totaal = Money.nul(valuta);
  const regels: OuderdomsRegel[] = rows.map((rij) => {
    totaal = totaal.plus(Money.vanTekst(rij.totaal, valuta));
    return {
      contactId: rij.contact_id,
      relatie: rij.relatie,
      totaal: rij.totaal,
      nietVervallen: rij.niet_vervallen,
      tot30: rij.tot30,
      tot60: rij.tot60,
      tot90: rij.tot90,
      ouder: rij.ouder,
    };
  });

  return { peildatum, valuta, regels, totaal: totaal.toString() };
}
