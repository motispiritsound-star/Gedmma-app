/**
 * Inlezen van bankbestanden.
 *
 * Drie formaten, een uitkomst: een lijst genormaliseerde transacties. Elke
 * parser is puur (tekst in, transacties uit) en dus los te testen zonder
 * database.
 */
import { XMLParser } from 'fast-xml-parser';
import { createHash } from 'node:crypto';

export type RuweTransactie = {
  boekdatum: string;
  valutadatum: string | null;
  /** Bedrag als decimale tekst; negatief bij een afschrijving. */
  bedrag: string;
  valuta: string;
  tegenrekening: string | null;
  tegenpartij: string | null;
  omschrijving: string;
  kenmerk: string | null;
  externeId: string | null;
};

export type Afschrift = {
  afschriftnummer: string | null;
  vanDatum: string | null;
  totDatum: string | null;
  beginsaldo: string | null;
  eindsaldo: string | null;
  iban: string | null;
  valuta: string;
  transacties: RuweTransactie[];
};

export class ImportFout extends Error {
  readonly hint: string;
  constructor(message: string, hint = '') {
    super(message);
    this.name = 'ImportFout';
    this.hint = hint;
  }
}

/**
 * Sleutel om dubbele transacties te herkennen bij overlappende imports.
 * Bewust gebaseerd op de inhoud en niet op een volgnummer: banken hergebruiken
 * volgnummers per afschrift.
 */
export function dedupeHash(transactie: RuweTransactie, iban: string | null): string {
  const kern = [
    iban ?? '',
    transactie.boekdatum,
    transactie.bedrag,
    transactie.tegenrekening ?? '',
    transactie.omschrijving.replace(/\s+/g, ' ').trim().slice(0, 140),
    transactie.externeId ?? '',
  ].join('|');
  return createHash('sha256').update(kern).digest('hex');
}

// --- CSV -------------------------------------------------------------------

/** Splitst een CSV-regel; ondersteunt aanhalingstekens met verdubbeling. */
export function splitsCsvRegel(regel: string, scheider: string): string[] {
  const velden: string[] = [];
  let huidig = '';
  let inAanhaling = false;
  for (let i = 0; i < regel.length; i++) {
    const teken = regel[i];
    if (inAanhaling) {
      if (teken === '"') {
        if (regel[i + 1] === '"') {
          huidig += '"';
          i++;
        } else {
          inAanhaling = false;
        }
      } else {
        huidig += teken;
      }
    } else if (teken === '"') {
      inAanhaling = true;
    } else if (teken === scheider) {
      velden.push(huidig);
      huidig = '';
    } else {
      huidig += teken;
    }
  }
  velden.push(huidig);
  return velden.map((veld) => veld.trim());
}

function raadScheider(kop: string): string {
  const kandidaten = [';', ',', '\t'];
  let beste = ';';
  let meeste = 0;
  for (const kandidaat of kandidaten) {
    const aantal = kop.split(kandidaat).length;
    if (aantal > meeste) {
      meeste = aantal;
      beste = kandidaat;
    }
  }
  return beste;
}

/** Namen die banken voor dezelfde kolom gebruiken, genormaliseerd. */
const KOLOMNAMEN: Record<string, string[]> = {
  boekdatum: ['datum', 'date', 'boekingsdatum', 'transactiedatum', 'bookingdate', 'boekdatum'],
  valutadatum: ['rentedatum', 'valutadatum', 'valuedate'],
  bedrag: ['bedrag', 'amount', 'bedrag (eur)', 'transactiebedrag', 'bedrag eur'],
  afbij: ['af bij', 'af/bij', 'debit/credit', 'debitcredit', 'bij/af', 'af_bij'],
  tegenrekening: ['tegenrekening', 'iban tegenpartij', 'tegenrekening iban', 'counterparty', 'tegenrekening_iban'],
  tegenpartij: ['naam tegenpartij', 'naam', 'tegenpartij', 'naam_tegenpartij', 'counterpartyname'],
  omschrijving: ['omschrijving', 'mededelingen', 'description', 'omschrijving-1', 'mededeling'],
  kenmerk: ['kenmerk', 'betalingskenmerk', 'reference', 'machtigingskenmerk'],
  iban: ['rekening', 'iban', 'eigen rekening', 'rekeningnummer'],
  valuta: ['valuta', 'currency', 'munt'],
};

function normaliseerKop(kop: string): string {
  return kop.toLowerCase().replace(/["']/g, '').replace(/\s+/g, ' ').trim();
}

function zoekKolom(koppen: string[], soort: keyof typeof KOLOMNAMEN): number {
  const namen = KOLOMNAMEN[soort] ?? [];
  for (const [index, kop] of koppen.entries()) {
    if (namen.includes(kop)) return index;
  }
  return -1;
}

/** Leest een bedrag zoals banken het schrijven: "1.234,56", "-1234.56", "1234,56". */
export function leesBedrag(ruw: string): string {
  // \u00a0 is de harde spatie die banken als duizendtalscheiding gebruiken;
  // die moet er net zo goed uit als een gewone spatie.
  let tekst = ruw.trim().replace(/[\s\u00a0]/g, '');
  if (tekst === '') {
    throw new ImportFout(
      'Er staat een lege bedragkolom in het bestand.',
      'Elke regel moet een bedrag hebben; controleer of je de juiste kolom hebt gekozen.',
    );
  }
  const negatief = tekst.startsWith('-') || (tekst.startsWith('(') && tekst.endsWith(')'));
  tekst = tekst.replace(/[()+-]/g, '');

  const laatstePunt = tekst.lastIndexOf('.');
  const laatsteKomma = tekst.lastIndexOf(',');
  if (laatstePunt >= 0 && laatsteKomma >= 0) {
    // De laatste van de twee is het decimaalteken.
    if (laatsteKomma > laatstePunt) tekst = tekst.replace(/\./g, '').replace(',', '.');
    else tekst = tekst.replace(/,/g, '');
  } else if (laatsteKomma >= 0) {
    // Komma is decimaalteken als er precies twee cijfers achter staan.
    tekst = tekst.length - laatsteKomma <= 3 ? tekst.replace(',', '.') : tekst.replace(/,/g, '');
  }

  if (!/^\d+(\.\d+)?$/.test(tekst)) {
    throw new ImportFout(`"${ruw}" is geen bedrag dat ik kan lezen.`, 'Controleer de bedragkolom van het bestand.');
  }
  const [heel = '0', fractie = ''] = tekst.split('.');
  const centen = `${fractie}00`.slice(0, 2);
  return `${negatief ? '-' : ''}${heel}.${centen}`;
}

/** Leest een datum in de formaten die banken gebruiken. */
export function leesDatum(ruw: string): string {
  const tekst = ruw.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(tekst)) return tekst.slice(0, 10);
  if (/^\d{8}$/.test(tekst)) return `${tekst.slice(0, 4)}-${tekst.slice(4, 6)}-${tekst.slice(6, 8)}`;
  const dmy = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.exec(tekst);
  if (dmy) return `${dmy[3]}-${dmy[2]?.padStart(2, '0')}-${dmy[1]?.padStart(2, '0')}`;
  throw new ImportFout(`"${ruw}" is geen datum die ik kan lezen.`, 'Gebruik jjjj-mm-dd of dd-mm-jjjj.');
}

export function leesCsv(inhoud: string): Afschrift {
  const regels = inhoud.split(/\r?\n/).filter((regel) => regel.trim() !== '');
  if (regels.length < 2) {
    throw new ImportFout('Het bestand bevat geen transacties.', 'Controleer of je het juiste bestand hebt gekozen.');
  }
  const scheider = raadScheider(regels[0] ?? '');
  const koppen = splitsCsvRegel(regels[0] ?? '', scheider).map(normaliseerKop);

  const kolommen = {
    boekdatum: zoekKolom(koppen, 'boekdatum'),
    valutadatum: zoekKolom(koppen, 'valutadatum'),
    bedrag: zoekKolom(koppen, 'bedrag'),
    afbij: zoekKolom(koppen, 'afbij'),
    tegenrekening: zoekKolom(koppen, 'tegenrekening'),
    tegenpartij: zoekKolom(koppen, 'tegenpartij'),
    omschrijving: zoekKolom(koppen, 'omschrijving'),
    kenmerk: zoekKolom(koppen, 'kenmerk'),
    iban: zoekKolom(koppen, 'iban'),
    valuta: zoekKolom(koppen, 'valuta'),
  };

  if (kolommen.boekdatum < 0 || kolommen.bedrag < 0) {
    throw new ImportFout(
      'In dit bestand kan ik geen datum- en bedragkolom vinden.',
      `Gevonden kolommen: ${koppen.join(', ')}. Zorg dat er een kolom "datum" en een kolom "bedrag" is.`,
    );
  }

  const transacties: RuweTransactie[] = [];
  let iban: string | null = null;
  let valuta = 'EUR';

  for (const regel of regels.slice(1)) {
    const velden = splitsCsvRegel(regel, scheider);
    const haal = (index: number): string => (index >= 0 ? (velden[index] ?? '') : '');

    let bedrag = leesBedrag(haal(kolommen.bedrag));
    const afbij = haal(kolommen.afbij).toLowerCase();
    if (afbij) {
      const isAf = afbij.startsWith('af') || afbij.startsWith('d') || afbij === '-';
      const absoluut = bedrag.replace('-', '');
      bedrag = isAf ? `-${absoluut}` : absoluut;
    }

    if (kolommen.iban >= 0 && !iban) iban = haal(kolommen.iban).replace(/\s/g, '').toUpperCase() || null;
    if (kolommen.valuta >= 0) valuta = (haal(kolommen.valuta) || valuta).toUpperCase();

    transacties.push({
      boekdatum: leesDatum(haal(kolommen.boekdatum)),
      valutadatum: kolommen.valutadatum >= 0 && haal(kolommen.valutadatum) ? leesDatum(haal(kolommen.valutadatum)) : null,
      bedrag,
      valuta,
      tegenrekening: haal(kolommen.tegenrekening).replace(/\s/g, '').toUpperCase() || null,
      tegenpartij: haal(kolommen.tegenpartij) || null,
      omschrijving: haal(kolommen.omschrijving),
      kenmerk: haal(kolommen.kenmerk) || null,
      externeId: null,
    });
  }

  const datums = transacties.map((t) => t.boekdatum).sort();
  return {
    afschriftnummer: null,
    vanDatum: datums[0] ?? null,
    totDatum: datums[datums.length - 1] ?? null,
    beginsaldo: null,
    eindsaldo: null,
    iban,
    valuta,
    transacties,
  };
}

// --- MT940 -----------------------------------------------------------------

/**
 * MT940 (SWIFT). De velden die ertoe doen:
 *   :25:  rekening
 *   :28C: afschriftnummer
 *   :60F: beginsaldo
 *   :61:  transactie
 *   :86:  toelichting bij de vorige :61:
 *   :62F: eindsaldo
 */
export function leesMt940(inhoud: string): Afschrift {
  const regels = inhoud.split(/\r?\n/);
  const transacties: RuweTransactie[] = [];
  let iban: string | null = null;
  let afschriftnummer: string | null = null;
  let beginsaldo: string | null = null;
  let eindsaldo: string | null = null;
  let valuta = 'EUR';
  let huidige: RuweTransactie | null = null;
  let toelichting = '';

  const rondAf = () => {
    if (!huidige) return;
    const details = ontleedMt940Toelichting(toelichting);
    huidige.omschrijving = details.omschrijving || huidige.omschrijving;
    huidige.tegenrekening = details.iban ?? huidige.tegenrekening;
    huidige.tegenpartij = details.naam ?? huidige.tegenpartij;
    huidige.kenmerk = details.kenmerk ?? huidige.kenmerk;
    transacties.push(huidige);
    huidige = null;
    toelichting = '';
  };

  for (const ruweRegel of regels) {
    const regel = ruweRegel.trimEnd();
    if (regel.startsWith(':25:')) {
      // Het veld bevat de rekening en soms de valuta erachter geplakt,
      // bijvoorbeeld "NL91ABNA0417164300EUR". Die valutacode hoort er niet bij.
      iban = regel.slice(4).trim().replace(/\s/g, '').toUpperCase();
      const metValuta = /^([A-Z]{2}\d{2}[A-Z0-9]{6,26}?)(EUR|USD|GBP|CHF|SEK|NOK|DKK|PLN)$/.exec(iban);
      if (metValuta) {
        iban = metValuta[1] ?? iban;
        valuta = metValuta[2] ?? valuta;
      }
    } else if (regel.startsWith(':28C:')) {
      afschriftnummer = regel.slice(5).trim();
    } else if (regel.startsWith(':60F:') || regel.startsWith(':62F:')) {
      const waarde = regel.slice(5).trim();
      const match = /^([CD])(\d{6})([A-Z]{3})([\d,]+)$/.exec(waarde);
      if (match) {
        valuta = match[3] ?? valuta;
        const bedrag = leesBedrag(match[4] ?? '0');
        const saldo = match[1] === 'D' ? `-${bedrag}` : bedrag;
        if (regel.startsWith(':60F:')) beginsaldo = saldo;
        else eindsaldo = saldo;
      }
    } else if (regel.startsWith(':61:')) {
      rondAf();
      huidige = ontleedMt940Transactie(regel.slice(4), valuta);
    } else if (regel.startsWith(':86:')) {
      toelichting = regel.slice(4);
    } else if (huidige && toelichting !== '' && !regel.startsWith(':')) {
      toelichting += regel;
    }
  }
  rondAf();

  if (transacties.length === 0) {
    throw new ImportFout(
      'Dit MT940-bestand bevat geen transacties.',
      'Controleer of het bestand compleet is; er moeten regels met :61: in staan.',
    );
  }

  const datums = transacties.map((t) => t.boekdatum).sort();
  return {
    afschriftnummer,
    vanDatum: datums[0] ?? null,
    totDatum: datums[datums.length - 1] ?? null,
    beginsaldo,
    eindsaldo,
    iban,
    valuta,
    transacties,
  };
}

function ontleedMt940Transactie(waarde: string, valuta: string): RuweTransactie {
  // Formaat: JJMMDD[MMDD]{C|D|RC|RD}[munt]bedrag,NNNsoort//referentie
  const match = /^(\d{6})(\d{4})?(R?[CD])([A-Z])?([\d,]+)/.exec(waarde.trim());
  if (!match) {
    throw new ImportFout(`Deze MT940-regel begrijp ik niet: ${waarde.slice(0, 40)}`, '');
  }
  const jjmmdd = match[1] ?? '';
  const jaar = Number(jjmmdd.slice(0, 2));
  const eeuw = jaar > 79 ? 1900 : 2000;
  const boekdatum = `${eeuw + jaar}-${jjmmdd.slice(2, 4)}-${jjmmdd.slice(4, 6)}`;

  let valutadatum: string | null = null;
  if (match[2]) {
    valutadatum = `${boekdatum.slice(0, 4)}-${match[2].slice(0, 2)}-${match[2].slice(2, 4)}`;
  }

  const teken = (match[3] ?? 'C').includes('D') ? '-' : '';
  const bedrag = `${teken}${leesBedrag(match[5] ?? '0')}`;
  const referentie = waarde.includes('//') ? (waarde.split('//')[1] ?? '').trim() : null;

  return {
    boekdatum,
    valutadatum,
    bedrag,
    valuta,
    tegenrekening: null,
    tegenpartij: null,
    omschrijving: '',
    kenmerk: null,
    externeId: referentie,
  };
}

/** Leest de gestructureerde subvelden uit een :86:-regel. */
export function ontleedMt940Toelichting(tekst: string): {
  omschrijving: string;
  iban: string | null;
  naam: string | null;
  kenmerk: string | null;
} {
  const velden = new Map<string, string>();
  const patroon = /\/([A-Z]{4})\/([^/]*)/g;
  let match: RegExpExecArray | null;
  while ((match = patroon.exec(tekst)) !== null) {
    velden.set(match[1] ?? '', (match[2] ?? '').trim());
  }

  if (velden.size > 0) {
    return {
      omschrijving: [velden.get('REMI'), velden.get('EREF')].filter(Boolean).join(' ').trim() || tekst.trim(),
      iban: velden.get('IBAN') ?? velden.get('CNTP')?.split('/')[0] ?? null,
      naam: velden.get('NAME') ?? null,
      kenmerk: velden.get('EREF') ?? null,
    };
  }

  // Sommige banken gebruiken genummerde subvelden (?20 t/m ?29 omschrijving,
  // ?31 iban, ?32 naam).
  const genummerd = /\?(\d{2})([^?]*)/g;
  const stukken: string[] = [];
  let iban: string | null = null;
  let naam: string | null = null;
  while ((match = genummerd.exec(tekst)) !== null) {
    const code = match[1] ?? '';
    const waarde = (match[2] ?? '').trim();
    if (code >= '20' && code <= '29') stukken.push(waarde);
    else if (code === '31') iban = waarde;
    else if (code === '32' || code === '33') naam = `${naam ?? ''}${waarde}`;
  }

  return {
    omschrijving: stukken.join(' ').trim() || tekst.trim(),
    iban,
    naam,
    kenmerk: null,
  };
}

// --- CAMT.053 --------------------------------------------------------------

/** CAMT.053 (ISO 20022 bankafschrift in XML). */
export function leesCamt053(inhoud: string): Afschrift {
  const parser = new XMLParser({
    ignoreAttributes: false,
    parseTagValue: false,
    trimValues: true,
    removeNSPrefix: true,
  });
  const boom = parser.parse(inhoud) as Record<string, unknown>;
  const document = (boom.Document ?? boom) as Record<string, unknown>;
  const bkToCstmrStmt = document.BkToCstmrStmt as Record<string, unknown> | undefined;
  if (!bkToCstmrStmt) {
    throw new ImportFout(
      'Dit is geen CAMT.053-bestand.',
      'Een CAMT.053 begint met <Document><BkToCstmrStmt>. Controleer het bestand bij je bank.',
    );
  }

  const statements = alsLijst(bkToCstmrStmt.Stmt);
  const transacties: RuweTransactie[] = [];
  let iban: string | null = null;
  let valuta = 'EUR';
  let beginsaldo: string | null = null;
  let eindsaldo: string | null = null;
  let afschriftnummer: string | null = null;
  let vanDatum: string | null = null;
  let totDatum: string | null = null;

  for (const statement of statements) {
    const stmt = statement as Record<string, unknown>;
    afschriftnummer = tekstVan(stmt.LglSeqNb) ?? tekstVan(stmt.ElctrncSeqNb) ?? afschriftnummer;
    const acct = stmt.Acct as Record<string, unknown> | undefined;
    const id = acct?.Id as Record<string, unknown> | undefined;
    iban = tekstVan(id?.IBAN) ?? iban;
    valuta = tekstVan(acct?.Ccy) ?? valuta;

    const periode = stmt.FrToDt as Record<string, unknown> | undefined;
    vanDatum = tekstVan(periode?.FrDtTm)?.slice(0, 10) ?? vanDatum;
    totDatum = tekstVan(periode?.ToDtTm)?.slice(0, 10) ?? totDatum;

    for (const balans of alsLijst(stmt.Bal)) {
      const bal = balans as Record<string, unknown>;
      const soort = tekstVan(((bal.Tp as Record<string, unknown>)?.CdOrPrtry as Record<string, unknown>)?.Cd);
      const bedragKnoop = bal.Amt as Record<string, unknown> | string | undefined;
      const bedrag = leesBedrag(tekstVan(bedragKnoop) ?? '0');
      const teken = tekstVan(bal.CdtDbtInd) === 'DBIT' ? '-' : '';
      valuta = attribuut(bedragKnoop, 'Ccy') ?? valuta;
      if (soort === 'OPBD' || soort === 'PRCD') beginsaldo = `${teken}${bedrag}`;
      if (soort === 'CLBD') eindsaldo = `${teken}${bedrag}`;
    }

    for (const entry of alsLijst(stmt.Ntry)) {
      const ntry = entry as Record<string, unknown>;
      const bedragKnoop = ntry.Amt as Record<string, unknown> | string | undefined;
      const bedrag = leesBedrag(tekstVan(bedragKnoop) ?? '0');
      const teken = tekstVan(ntry.CdtDbtInd) === 'DBIT' ? '-' : '';
      const boekdatum = tekstVan((ntry.BookgDt as Record<string, unknown>)?.Dt)
        ?? tekstVan((ntry.BookgDt as Record<string, unknown>)?.DtTm)?.slice(0, 10)
        ?? '';
      const valutadatum = tekstVan((ntry.ValDt as Record<string, unknown>)?.Dt)
        ?? tekstVan((ntry.ValDt as Record<string, unknown>)?.DtTm)?.slice(0, 10)
        ?? null;

      const details = eersteDetail(ntry);
      const partij = details?.tegenpartij ?? null;

      transacties.push({
        boekdatum: boekdatum ? leesDatum(boekdatum) : '',
        valutadatum: valutadatum ? leesDatum(valutadatum) : null,
        bedrag: `${teken}${bedrag}`,
        valuta: attribuut(bedragKnoop, 'Ccy') ?? valuta,
        tegenrekening: details?.iban ?? null,
        tegenpartij: partij,
        omschrijving: details?.omschrijving ?? tekstVan(ntry.AddtlNtryInf) ?? '',
        kenmerk: details?.kenmerk ?? null,
        externeId: tekstVan(ntry.NtryRef) ?? tekstVan(ntry.AcctSvcrRef) ?? null,
      });
    }
  }

  if (transacties.length === 0) {
    throw new ImportFout('Dit CAMT.053-bestand bevat geen transacties.', 'Controleer de gekozen periode bij je bank.');
  }

  const datums = transacties.map((t) => t.boekdatum).filter(Boolean).sort();
  return {
    afschriftnummer,
    vanDatum: vanDatum ?? datums[0] ?? null,
    totDatum: totDatum ?? datums[datums.length - 1] ?? null,
    beginsaldo,
    eindsaldo,
    iban,
    valuta,
    transacties,
  };
}

function eersteDetail(ntry: Record<string, unknown>): {
  iban: string | null;
  tegenpartij: string | null;
  omschrijving: string;
  kenmerk: string | null;
} | null {
  const dtls = alsLijst(ntry.NtryDtls)[0] as Record<string, unknown> | undefined;
  const txDtls = alsLijst(dtls?.TxDtls)[0] as Record<string, unknown> | undefined;
  if (!txDtls) return null;

  const partijen = txDtls.RltdPties as Record<string, unknown> | undefined;
  const rekeningen = txDtls.RltdAgts as Record<string, unknown> | undefined;
  void rekeningen;

  const isAf = tekstVan(ntry.CdtDbtInd) === 'DBIT';
  const tegenpartijKnoop = (isAf ? partijen?.Cdtr : partijen?.Dbtr) as Record<string, unknown> | undefined;
  const tegenrekeningKnoop = (isAf ? partijen?.CdtrAcct : partijen?.DbtrAcct) as Record<string, unknown> | undefined;

  const remittance = txDtls.RmtInf as Record<string, unknown> | undefined;
  const ongestructureerd = alsLijst(remittance?.Ustrd).map((v) => tekstVan(v) ?? '').join(' ');
  const gestructureerd = (remittance?.Strd as Record<string, unknown> | undefined);
  const kenmerk = tekstVan(
    ((gestructureerd?.CdtrRefInf as Record<string, unknown>)?.Ref) ??
      ((txDtls.Refs as Record<string, unknown>)?.EndToEndId),
  );

  return {
    iban: tekstVan((tegenrekeningKnoop?.Id as Record<string, unknown>)?.IBAN) ?? null,
    tegenpartij: tekstVan(tegenpartijKnoop?.Nm) ?? null,
    omschrijving: ongestructureerd.trim(),
    kenmerk: kenmerk ?? null,
  };
}

function alsLijst(waarde: unknown): unknown[] {
  if (waarde === undefined || waarde === null) return [];
  return Array.isArray(waarde) ? waarde : [waarde];
}

function tekstVan(waarde: unknown): string | null {
  if (waarde === undefined || waarde === null) return null;
  if (typeof waarde === 'string') return waarde;
  if (typeof waarde === 'number') return String(waarde);
  if (typeof waarde === 'object') {
    const tekst = (waarde as Record<string, unknown>)['#text'];
    if (typeof tekst === 'string') return tekst;
  }
  return null;
}

function attribuut(waarde: unknown, naam: string): string | null {
  if (typeof waarde === 'object' && waarde !== null) {
    const attr = (waarde as Record<string, unknown>)[`@_${naam}`];
    if (typeof attr === 'string') return attr;
  }
  return null;
}

/** Kiest de juiste parser op basis van de inhoud. */
export function leesBankbestand(inhoud: string, bestandsnaam = ''): { bron: 'csv' | 'mt940' | 'camt053'; afschrift: Afschrift } {
  const begin = inhoud.slice(0, 400);
  if (begin.trimStart().startsWith('<')) {
    return { bron: 'camt053', afschrift: leesCamt053(inhoud) };
  }
  if (/:2[05][A-Z]?:/.test(begin) || begin.includes(':61:')) {
    return { bron: 'mt940', afschrift: leesMt940(inhoud) };
  }
  if (bestandsnaam.toLowerCase().endsWith('.sta') || bestandsnaam.toLowerCase().endsWith('.940')) {
    return { bron: 'mt940', afschrift: leesMt940(inhoud) };
  }
  return { bron: 'csv', afschrift: leesCsv(inhoud) };
}
