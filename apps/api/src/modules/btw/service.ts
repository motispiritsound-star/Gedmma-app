/**
 * Btw-overzicht en btw-aansluiting.
 *
 * Het overzicht wordt berekend uit dezelfde journaalregels als alle andere
 * rapportages: de grondslagen komen uit `btw_grondslag` en de btw-bedragen uit
 * de boekingen op de btw-rekeningen. De aansluiting vergelijkt beide en meldt
 * elk verschil — een btw-overzicht dat niet aansluit op het grootboek is
 * waardeloos.
 *
 * Dit is een berekening, geen belastingadvies. De uitkomst is bedoeld om te
 * controleren en aan te leveren, niet om blind in te dienen.
 */
import { Money } from '@gedmma/money';
import { vakOmschrijving } from '@gedmma/accounting';
import type { Db } from '../../db/pool.ts';
import { leesAdministratie } from '../organisaties/service.ts';
import type { Periode } from '../rapportage/service.ts';

export type BtwVak = {
  vak: string;
  omschrijving: string;
  grondslag: string;
  btw: string;
};

export type BtwWaarschuwing = {
  soort: 'aansluiting' | 'ontbrekend_btwnummer' | 'geen_btwcode' | 'code_verlopen';
  melding: string;
  hint: string;
  details?: Record<string, unknown>;
};

export type BtwOverzicht = {
  periode: Periode;
  valuta: string;
  vakken: BtwVak[];
  teBetalen: string;
  teVorderen: string;
  saldo: string;
  aansluiting: {
    btwVolgensBoekingen: string;
    btwVolgensGrootboekrekeningen: string;
    verschil: string;
    sluitAan: boolean;
  };
  waarschuwingen: BtwWaarschuwing[];
  /** Vaste tekst die de gebruiker moet zien voordat hij hier iets mee doet. */
  voorbehoud: string;
};

const VOORBEHOUD =
  'Dit overzicht is een berekening op basis van je administratie en geen belastingadvies. ' +
  'Controleer de uitkomst, of laat een accountant of fiscalist meekijken voordat je aangifte doet.';

export async function btwOverzicht(
  client: Db,
  administratieId: string,
  periode: Periode,
): Promise<BtwOverzicht> {
  const administratie = await leesAdministratie(client, administratieId);
  const valuta = administratie.valuta;

  // Grondslag en btw per aangiftevak, rechtstreeks uit de journaalregels.
  const { rows } = await client.query<{
    vak: string | null;
    verlegd: boolean;
    ic_levering: boolean;
    soort: string;
    grondslag: string;
    btw_debet: string;
    btw_credit: string;
  }>(
    `SELECT t.vak, t.verlegd, t.ic_levering, t.soort,
            COALESCE(SUM(CASE WHEN a.soort IN ('revenue', 'expense') THEN l.btw_grondslag ELSE 0 END), 0)::text AS grondslag,
            COALESCE(SUM(CASE WHEN a.rol LIKE 'btw%' THEN l.debet ELSE 0 END), 0)::text AS btw_debet,
            COALESCE(SUM(CASE WHEN a.rol LIKE 'btw%' THEN l.credit ELSE 0 END), 0)::text AS btw_credit
       FROM journal_line l
       JOIN journal_entry e ON e.id = l.entry_id
       JOIN tax_code t ON t.id = l.tax_code_id
       JOIN ledger_account a ON a.id = l.ledger_account_id
      WHERE l.administration_id = $1
        AND e.status = 'definitief'
        AND e.boekdatum BETWEEN $2::date AND $3::date
      GROUP BY t.vak, t.verlegd, t.ic_levering, t.soort
      ORDER BY t.vak`,
    [administratieId, periode.vanaf, periode.tot],
  );

  const perVak = new Map<string, { grondslag: Money; btw: Money }>();
  const voegToe = (vak: string, grondslag: Money, btw: Money) => {
    const bestaand = perVak.get(vak);
    if (bestaand) {
      bestaand.grondslag = bestaand.grondslag.plus(grondslag);
      bestaand.btw = bestaand.btw.plus(btw);
    } else {
      perVak.set(vak, { grondslag, btw });
    }
  };

  for (const rij of rows) {
    if (!rij.vak) continue;
    const grondslag = Money.vanTekst(rij.grondslag, valuta).absoluut();
    const btw = Money.vanTekst(rij.btw_credit, valuta).min(Money.vanTekst(rij.btw_debet, valuta)).absoluut();
    voegToe(rij.vak, grondslag, btw);
  }

  const vakken: BtwVak[] = [...perVak.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([vak, waarden]) => ({
      vak,
      omschrijving: vakOmschrijving(vak),
      grondslag: waarden.grondslag.toString(),
      btw: waarden.btw.toString(),
    }));

  const teBetalen = Money.som(
    vakken.filter((v) => v.vak.startsWith('1') || v.vak.startsWith('2') || v.vak.startsWith('4')).map((v) => Money.vanTekst(v.btw, valuta)),
    valuta,
  );
  const teVorderen = Money.som(
    vakken.filter((v) => v.vak === '5b').map((v) => Money.vanTekst(v.btw, valuta)),
    valuta,
  );

  const aansluiting = await btwAansluiting(client, administratieId, periode, valuta);
  const waarschuwingen = await zoekWaarschuwingen(client, administratieId, periode, aansluiting);

  return {
    periode,
    valuta,
    vakken,
    teBetalen: teBetalen.toString(),
    teVorderen: teVorderen.toString(),
    saldo: teBetalen.min(teVorderen).toString(),
    aansluiting,
    waarschuwingen,
    voorbehoud: VOORBEHOUD,
  };
}

/**
 * Vergelijkt de btw die uit de btw-codes volgt met wat er daadwerkelijk op de
 * btw-grootboekrekeningen staat. Een verschil betekent altijd dat er iets
 * handmatig is geboekt zonder btw-code, of andersom.
 */
async function btwAansluiting(
  client: Db,
  administratieId: string,
  periode: Periode,
  valuta: string,
): Promise<BtwOverzicht['aansluiting']> {
  const { rows: viaCodes } = await client.query<{ saldo: string }>(
    `SELECT COALESCE(SUM(l.credit - l.debet), 0)::text AS saldo
       FROM journal_line l
       JOIN journal_entry e ON e.id = l.entry_id
       JOIN ledger_account a ON a.id = l.ledger_account_id
      WHERE l.administration_id = $1 AND e.status = 'definitief'
        AND e.boekdatum BETWEEN $2::date AND $3::date
        AND a.rol IN ('btw_af_te_dragen_hoog', 'btw_af_te_dragen_laag', 'btw_af_te_dragen_overig',
                      'btw_verlegd_af_te_dragen', 'btw_te_vorderen')
        AND l.tax_code_id IS NOT NULL`,
    [administratieId, periode.vanaf, periode.tot],
  );

  const { rows: viaRekeningen } = await client.query<{ saldo: string }>(
    `SELECT COALESCE(SUM(l.credit - l.debet), 0)::text AS saldo
       FROM journal_line l
       JOIN journal_entry e ON e.id = l.entry_id
       JOIN ledger_account a ON a.id = l.ledger_account_id
      WHERE l.administration_id = $1 AND e.status = 'definitief'
        AND e.boekdatum BETWEEN $2::date AND $3::date
        AND a.rol IN ('btw_af_te_dragen_hoog', 'btw_af_te_dragen_laag', 'btw_af_te_dragen_overig',
                      'btw_verlegd_af_te_dragen', 'btw_te_vorderen')`,
    [administratieId, periode.vanaf, periode.tot],
  );

  const metCode = Money.vanTekst(viaCodes[0]?.saldo ?? '0', valuta);
  const opRekening = Money.vanTekst(viaRekeningen[0]?.saldo ?? '0', valuta);
  const verschil = opRekening.min(metCode);

  return {
    btwVolgensBoekingen: metCode.toString(),
    btwVolgensGrootboekrekeningen: opRekening.toString(),
    verschil: verschil.toString(),
    sluitAan: verschil.isNul(),
  };
}

async function zoekWaarschuwingen(
  client: Db,
  administratieId: string,
  periode: Periode,
  aansluiting: BtwOverzicht['aansluiting'],
): Promise<BtwWaarschuwing[]> {
  const waarschuwingen: BtwWaarschuwing[] = [];

  if (!aansluiting.sluitAan) {
    waarschuwingen.push({
      soort: 'aansluiting',
      melding: `Er staat ${aansluiting.verschil} btw op de btw-rekeningen die niet uit een btw-code volgt.`,
      hint: 'Dat komt meestal door een handmatige boeking op een btw-rekening zonder btw-code. Zoek de post op in het journaal en vul de btw-code aan.',
      details: aansluiting,
    });
  }

  // Omzet of kosten zonder btw-code.
  const { rows: zonderCode } = await client.query<{ aantal: string; totaal: string }>(
    `SELECT count(*)::text AS aantal, COALESCE(SUM(l.debet + l.credit), 0)::text AS totaal
       FROM journal_line l
       JOIN journal_entry e ON e.id = l.entry_id
       JOIN ledger_account a ON a.id = l.ledger_account_id
      WHERE l.administration_id = $1 AND e.status = 'definitief'
        AND e.boekdatum BETWEEN $2::date AND $3::date
        AND a.soort IN ('revenue', 'expense')
        AND l.tax_code_id IS NULL`,
    [administratieId, periode.vanaf, periode.tot],
  );
  const aantalZonderCode = Number(zonderCode[0]?.aantal ?? '0');
  if (aantalZonderCode > 0) {
    waarschuwingen.push({
      soort: 'geen_btwcode',
      melding: `${aantalZonderCode} boeking(en) op omzet- of kostenrekeningen hebben geen btw-code.`,
      hint: 'Dat kan kloppen (bijvoorbeeld bij loon of afschrijving), maar controleer of er niets vergeten is.',
      details: { aantal: aantalZonderCode, totaal: zonderCode[0]?.totaal ?? '0' },
    });
  }

  // IC-leveringen zonder btw-nummer van de klant: dan klopt de ICP-opgave niet.
  const { rows: zonderNummer } = await client.query<{ aantal: string; namen: string[] }>(
    `SELECT count(DISTINCT c.id)::text AS aantal, array_agg(DISTINCT c.naam) AS namen
       FROM sales_invoice f
       JOIN sales_invoice_line l ON l.invoice_id = f.id
       JOIN tax_code t ON t.id = l.tax_code_id
       JOIN contact c ON c.id = f.contact_id
      WHERE f.administration_id = $1
        AND f.status <> 'concept'
        AND f.factuurdatum BETWEEN $2::date AND $3::date
        AND t.ic_levering = true
        AND (c.btw_nummer IS NULL OR c.btw_nummer = '')`,
    [administratieId, periode.vanaf, periode.tot],
  );
  if (Number(zonderNummer[0]?.aantal ?? '0') > 0) {
    waarschuwingen.push({
      soort: 'ontbrekend_btwnummer',
      melding: `Er zijn leveringen binnen de EU aan klanten zonder btw-identificatienummer: ${(zonderNummer[0]?.namen ?? []).join(', ')}.`,
      hint: 'Voor het nultarief bij een EU-levering moet je het btw-nummer van je klant vastleggen en controleren.',
    });
  }

  // Boekingen met een btw-code die op de boekdatum niet gold.
  const { rows: verlopen } = await client.query<{ aantal: string }>(
    `SELECT count(*)::text AS aantal
       FROM journal_line l
       JOIN journal_entry e ON e.id = l.entry_id
       JOIN tax_code t ON t.id = l.tax_code_id
      WHERE l.administration_id = $1 AND e.status = 'definitief'
        AND e.boekdatum BETWEEN $2::date AND $3::date
        AND (e.boekdatum < t.geldig_vanaf OR (t.geldig_tot IS NOT NULL AND e.boekdatum > t.geldig_tot))`,
    [administratieId, periode.vanaf, periode.tot],
  );
  if (Number(verlopen[0]?.aantal ?? '0') > 0) {
    waarschuwingen.push({
      soort: 'code_verlopen',
      melding: `${verlopen[0]?.aantal} boeking(en) gebruiken een btw-code die op de boekdatum niet gold.`,
      hint: 'Corrigeer die boekingen met een tegenboeking en boek ze opnieuw met de juiste code.',
    });
  }

  return waarschuwingen;
}

/**
 * ICP-opgave: leveringen binnen de EU per btw-identificatienummer.
 * (Fase 2 levert de aanlevering; hier staat het overzicht dat je kunt
 * controleren en exporteren.)
 */
export async function icpOverzicht(
  client: Db,
  administratieId: string,
  periode: Periode,
): Promise<{ periode: Periode; regels: { btwNummer: string; land: string; relatie: string; bedrag: string }[]; totaal: string; voorbehoud: string }> {
  const administratie = await leesAdministratie(client, administratieId);
  const valuta = administratie.valuta;

  const { rows } = await client.query<{ btw_nummer: string | null; land: string; naam: string; bedrag: string }>(
    `SELECT c.btw_nummer, c.land, c.naam, SUM(l.bedrag_exclusief)::text AS bedrag
       FROM sales_invoice f
       JOIN sales_invoice_line l ON l.invoice_id = f.id
       JOIN tax_code t ON t.id = l.tax_code_id
       JOIN contact c ON c.id = f.contact_id
      WHERE f.administration_id = $1
        AND f.status <> 'concept' AND f.status <> 'geannuleerd'
        AND f.factuurdatum BETWEEN $2::date AND $3::date
        AND t.ic_levering = true
      GROUP BY c.btw_nummer, c.land, c.naam
      ORDER BY c.naam`,
    [administratieId, periode.vanaf, periode.tot],
  );

  const regels = rows.map((rij) => ({
    btwNummer: rij.btw_nummer ?? '(ontbreekt)',
    land: rij.land,
    relatie: rij.naam,
    bedrag: rij.bedrag,
  }));

  return {
    periode,
    regels,
    totaal: Money.som(regels.map((r) => Money.vanTekst(r.bedrag, valuta)), valuta).toString(),
    voorbehoud: VOORBEHOUD,
  };
}
