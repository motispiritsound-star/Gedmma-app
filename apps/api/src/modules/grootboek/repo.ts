/**
 * Alle SQL van het grootboek. Buiten dit bestand staan geen query's over
 * rekeningen, dagboeken, perioden of journaalposten.
 */
import { Money, Rate } from '@gedmma/money';
import type { BtwCode } from '@gedmma/accounting';
import type { Db } from '../../db/pool.ts';
import { fout } from '../../http/fout.ts';

export type RekeningRij = {
  id: string;
  code: string;
  naam: string;
  soort: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  rubriek: string;
  rol: string | null;
  btw_standaard: string | null;
  rgs_code: string | null;
  uitleg: string | null;
  geblokkeerd: boolean;
};

export async function alleRekeningen(client: Db, administratieId: string): Promise<RekeningRij[]> {
  const { rows } = await client.query<RekeningRij>(
    `SELECT id, code, naam, soort, rubriek, rol, btw_standaard, rgs_code, uitleg, geblokkeerd
       FROM ledger_account WHERE administration_id = $1 ORDER BY code`,
    [administratieId],
  );
  return rows;
}

export async function rekeningOpCode(client: Db, administratieId: string, code: string): Promise<RekeningRij | null> {
  const { rows } = await client.query<RekeningRij>(
    `SELECT id, code, naam, soort, rubriek, rol, btw_standaard, rgs_code, uitleg, geblokkeerd
       FROM ledger_account WHERE administration_id = $1 AND code = $2`,
    [administratieId, code],
  );
  return rows[0] ?? null;
}

export type BtwCodeRij = {
  id: string;
  code: string;
  naam: string;
  soort: 'verkoop' | 'inkoop' | 'beide';
  tarief: string;
  vak: string | null;
  verlegd: boolean;
  ic_levering: boolean;
  geldig_vanaf: string;
  geldig_tot: string | null;
  btw_rekening_id: string | null;
};

export async function alleBtwCodes(client: Db, administratieId: string): Promise<BtwCodeRij[]> {
  const { rows } = await client.query<BtwCodeRij>(
    `SELECT id, code, naam, soort, tarief::text AS tarief, vak, verlegd, ic_levering,
            geldig_vanaf::text AS geldig_vanaf, geldig_tot::text AS geldig_tot, btw_rekening_id
       FROM tax_code WHERE administration_id = $1 ORDER BY code, geldig_vanaf`,
    [administratieId],
  );
  return rows;
}

/** Zet een databaserij om naar het BtwCode-type van de rekenkern. */
export function naarBtwCode(rij: BtwCodeRij): BtwCode {
  return {
    id: rij.id,
    code: rij.code,
    naam: rij.naam,
    soort: rij.soort,
    tarief: Rate.tarief(rij.tarief),
    vak: rij.vak,
    verlegd: rij.verlegd,
    icLevering: rij.ic_levering,
    geldigVanaf: rij.geldig_vanaf,
    geldigTot: rij.geldig_tot,
    btwRekeningId: rij.btw_rekening_id,
  };
}

export async function btwCodeOpId(client: Db, administratieId: string, id: string): Promise<BtwCode> {
  const { rows } = await client.query<BtwCodeRij>(
    `SELECT id, code, naam, soort, tarief::text AS tarief, vak, verlegd, ic_levering,
            geldig_vanaf::text AS geldig_vanaf, geldig_tot::text AS geldig_tot, btw_rekening_id
       FROM tax_code WHERE administration_id = $1 AND id = $2`,
    [administratieId, id],
  );
  const rij = rows[0];
  if (!rij) throw fout.nietGevonden('Deze btw-code');
  return naarBtwCode(rij);
}

export type DagboekRij = {
  id: string;
  code: string;
  naam: string;
  soort: string;
  ledger_account_id: string | null;
};

export async function dagboekOpCode(client: Db, administratieId: string, code: string): Promise<DagboekRij> {
  const { rows } = await client.query<DagboekRij>(
    `SELECT id, code, naam, soort, ledger_account_id FROM journal
      WHERE administration_id = $1 AND code = $2`,
    [administratieId, code],
  );
  const rij = rows[0];
  if (!rij) throw fout.nietGevonden(`Dagboek ${code}`);
  return rij;
}

export async function alleDagboeken(client: Db, administratieId: string): Promise<DagboekRij[]> {
  const { rows } = await client.query<DagboekRij>(
    `SELECT id, code, naam, soort, ledger_account_id FROM journal
      WHERE administration_id = $1 ORDER BY code`,
    [administratieId],
  );
  return rows;
}

export type PeriodeRij = {
  id: string;
  fiscal_year_id: string;
  nummer: number;
  naam: string;
  begint_op: string;
  eindigt_op: string;
  status: 'open' | 'geblokkeerd' | 'gesloten';
};

/** Zoekt de periode waarin een boekdatum valt. */
export async function periodeVoorDatum(
  client: Db,
  administratieId: string,
  datum: string,
): Promise<PeriodeRij> {
  const { rows } = await client.query<PeriodeRij>(
    `SELECT id, fiscal_year_id, nummer, naam, begint_op::text AS begint_op,
            eindigt_op::text AS eindigt_op, status
       FROM accounting_period
      WHERE administration_id = $1 AND $2::date BETWEEN begint_op AND eindigt_op`,
    [administratieId, datum],
  );
  const rij = rows[0];
  if (!rij) {
    throw fout.validatie(
      [{ veld: 'boekdatum', probleem: `Er is geen boekjaar met een periode waarin ${datum} valt.` }],
      `Er bestaat geen periode voor ${datum}.`,
    );
  }
  return rij;
}

export async function allePeriodes(client: Db, administratieId: string, boekjaarId?: string): Promise<PeriodeRij[]> {
  const { rows } = await client.query<PeriodeRij>(
    `SELECT id, fiscal_year_id, nummer, naam, begint_op::text AS begint_op,
            eindigt_op::text AS eindigt_op, status
       FROM accounting_period
      WHERE administration_id = $1 AND ($2::uuid IS NULL OR fiscal_year_id = $2)
      ORDER BY begint_op`,
    [administratieId, boekjaarId ?? null],
  );
  return rows;
}

export type BoekjaarRij = {
  id: string;
  naam: string;
  begint_op: string;
  eindigt_op: string;
  status: string;
};

export async function alleBoekjaren(client: Db, administratieId: string): Promise<BoekjaarRij[]> {
  const { rows } = await client.query<BoekjaarRij>(
    `SELECT id, naam, begint_op::text AS begint_op, eindigt_op::text AS eindigt_op, status
       FROM fiscal_year WHERE administration_id = $1 ORDER BY begint_op`,
    [administratieId],
  );
  return rows;
}

/**
 * Geeft het volgende nummer uit een reeks. De rij wordt vergrendeld binnen de
 * lopende transactie, zodat twee gelijktijdige facturen nooit hetzelfde nummer
 * krijgen en er geen gaten ontstaan als de transactie terugdraait.
 */
export async function volgendNummer(
  client: Db,
  administratieId: string,
  sleutel: string,
  jaar: number,
  patroon = '{jaar}-{nummer:4}',
): Promise<string> {
  await client.query(
    `INSERT INTO number_sequence (administration_id, sleutel, jaar, patroon)
     VALUES ($1, $2, $3, $4) ON CONFLICT (administration_id, sleutel, jaar) DO NOTHING`,
    [administratieId, sleutel, jaar, patroon],
  );
  const { rows } = await client.query<{ volgende: string; patroon: string }>(
    `SELECT volgende::text AS volgende, patroon FROM number_sequence
      WHERE administration_id = $1 AND sleutel = $2 AND jaar = $3
      FOR UPDATE`,
    [administratieId, sleutel, jaar],
  );
  const rij = rows[0];
  if (!rij) throw new Error(`Nummerreeks ${sleutel} kon niet worden gelezen.`);
  const nummer = BigInt(rij.volgende);
  await client.query(
    `UPDATE number_sequence SET volgende = volgende + 1
      WHERE administration_id = $1 AND sleutel = $2 AND jaar = $3`,
    [administratieId, sleutel, jaar],
  );
  return formatteerNummer(rij.patroon, jaar, nummer);
}

export function formatteerNummer(patroon: string, jaar: number, nummer: bigint): string {
  return patroon
    .replace('{jaar}', String(jaar))
    .replace(/\{nummer:(\d+)\}/, (_, breedte: string) => nummer.toString().padStart(Number(breedte), '0'))
    .replace('{nummer}', nummer.toString());
}

export type JournaalpostRij = {
  id: string;
  journal_id: string;
  journal_code: string;
  period_id: string;
  postnummer: string | null;
  boekdatum: string;
  omschrijving: string;
  valuta: string;
  status: string;
  totaal_debet: string;
  totaal_credit: string;
  bron_soort: string | null;
  bron_id: string | null;
  storneert_id: string | null;
  gestorneerd_door_id: string | null;
  aangemaakt_op: string;
};

export type JournaalregelRij = {
  id: string;
  regelnummer: number;
  ledger_account_id: string;
  rekening_code: string;
  rekening_naam: string;
  debet: string;
  credit: string;
  omschrijving: string | null;
  tax_code_id: string | null;
  btw_code: string | null;
  btw_grondslag: string | null;
  contact_id: string | null;
  contact_naam: string | null;
  bedrag_valuta: string | null;
  valuta: string | null;
  wisselkoers: string | null;
};

export async function leesPost(
  client: Db,
  administratieId: string,
  postId: string,
): Promise<{ post: JournaalpostRij; regels: JournaalregelRij[] } | null> {
  const { rows } = await client.query<JournaalpostRij>(
    `SELECT e.id, e.journal_id, j.code AS journal_code, e.period_id, e.postnummer,
            e.boekdatum::text AS boekdatum, e.omschrijving, e.valuta, e.status,
            e.totaal_debet::text AS totaal_debet, e.totaal_credit::text AS totaal_credit,
            e.bron_soort, e.bron_id::text AS bron_id, e.storneert_id::text AS storneert_id,
            e.gestorneerd_door_id::text AS gestorneerd_door_id, e.aangemaakt_op::text AS aangemaakt_op
       FROM journal_entry e JOIN journal j ON j.id = e.journal_id
      WHERE e.administration_id = $1 AND e.id = $2`,
    [administratieId, postId],
  );
  const post = rows[0];
  if (!post) return null;
  return { post, regels: await leesRegels(client, administratieId, postId) };
}

export async function leesRegels(
  client: Db,
  administratieId: string,
  postId: string,
): Promise<JournaalregelRij[]> {
  const { rows } = await client.query<JournaalregelRij>(
    `SELECT l.id, l.regelnummer, l.ledger_account_id, a.code AS rekening_code, a.naam AS rekening_naam,
            l.debet::text AS debet, l.credit::text AS credit, l.omschrijving,
            l.tax_code_id, t.code AS btw_code, l.btw_grondslag::text AS btw_grondslag,
            l.contact_id, c.naam AS contact_naam,
            l.bedrag_valuta::text AS bedrag_valuta, l.valuta, l.wisselkoers::text AS wisselkoers
       FROM journal_line l
       JOIN ledger_account a ON a.id = l.ledger_account_id
       LEFT JOIN tax_code t ON t.id = l.tax_code_id
       LEFT JOIN contact c ON c.id = l.contact_id
      WHERE l.administration_id = $1 AND l.entry_id = $2
      ORDER BY l.regelnummer`,
    [administratieId, postId],
  );
  return rows;
}

/** Saldo van een rekening over een periode, als debet minus credit. */
export async function saldoVan(
  client: Db,
  administratieId: string,
  rekeningId: string,
  vanaf: string | null,
  totEnMet: string,
): Promise<Money> {
  const { rows } = await client.query<{ saldo: string }>(
    `SELECT COALESCE(SUM(l.debet - l.credit), 0)::text AS saldo
       FROM journal_line l JOIN journal_entry e ON e.id = l.entry_id
      WHERE l.administration_id = $1 AND l.ledger_account_id = $2
        AND e.status = 'definitief'
        AND ($3::date IS NULL OR e.boekdatum >= $3)
        AND e.boekdatum <= $4::date`,
    [administratieId, rekeningId, vanaf, totEnMet],
  );
  const { rows: valutaRij } = await client.query<{ valuta: string }>(
    'SELECT valuta FROM administration WHERE id = $1',
    [administratieId],
  );
  return Money.vanTekst(rows[0]?.saldo ?? '0', valutaRij[0]?.valuta ?? 'EUR');
}
