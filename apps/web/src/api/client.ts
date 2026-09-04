/**
 * De enige plek waar de webapp met de server praat.
 *
 * Fouten van de server komen als `ApiFout` terug, met de code, de melding en de
 * hint uit docs/api.md. De schermen tonen die tekst rechtstreeks: de server
 * kent de context en formuleert daarom de duidelijkste uitleg.
 */

export type Foutlichaam = {
  error: {
    code: string;
    message: string;
    hint?: string;
    details?: unknown;
    requestId?: string;
  };
};

export class ApiFout extends Error {
  readonly code: string;
  readonly status: number;
  readonly hint: string;
  readonly details: unknown;
  readonly requestId: string | undefined;

  constructor(status: number, lichaam: Foutlichaam['error']) {
    super(lichaam.message);
    this.name = 'ApiFout';
    this.status = status;
    this.code = lichaam.code;
    this.hint = lichaam.hint ?? '';
    this.details = lichaam.details;
    this.requestId = lichaam.requestId;
  }
}

export class NetwerkFout extends Error {
  constructor() {
    super('netwerk');
    this.name = 'NetwerkFout';
  }
}

export type Verzoekopties = {
  methode?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  idempotencyKey?: string;
  versie?: number;
  taal?: string;
  /** Levert de ruwe Response op in plaats van JSON; voor pdf en xml. */
  ruw?: boolean;
  signaal?: AbortSignal;
};

let uitloggerCallback: (() => void) | null = null;

/** Wordt aangeroepen zodra de server zegt dat de sessie voorbij is. */
export function bijUitloggen(callback: () => void): void {
  uitloggerCallback = callback;
}

export async function verzoek<T = unknown>(pad: string, opties: Verzoekopties = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Accept-Language': opties.taal ?? 'nl',
  };
  if (opties.body !== undefined) headers['Content-Type'] = 'application/json';
  if (opties.idempotencyKey) headers['Idempotency-Key'] = opties.idempotencyKey;
  if (opties.versie !== undefined) headers['If-Match'] = String(opties.versie);

  let antwoord: Response;
  try {
    antwoord = await fetch(pad, {
      method: opties.methode ?? 'GET',
      headers,
      credentials: 'include',
      body: opties.body === undefined ? undefined : JSON.stringify(opties.body),
      signal: opties.signaal ?? null,
    });
  } catch {
    throw new NetwerkFout();
  }

  if (antwoord.status === 401 && !pad.includes('/auth/')) {
    uitloggerCallback?.();
  }

  if (opties.ruw) {
    if (!antwoord.ok) {
      const lichaam = (await antwoord.json().catch(() => null)) as Foutlichaam | null;
      throw new ApiFout(antwoord.status, lichaam?.error ?? { code: 'internal_error', message: 'Onbekende fout' });
    }
    return antwoord as unknown as T;
  }

  const tekst = await antwoord.text();
  const lichaam = tekst ? (JSON.parse(tekst) as unknown) : null;

  if (!antwoord.ok) {
    const fout = (lichaam as Foutlichaam | null)?.error;
    throw new ApiFout(antwoord.status, fout ?? { code: 'internal_error', message: 'Onbekende fout' });
  }

  return lichaam as T;
}

/** Genereert een sleutel zodat een dubbelklik niet twee boekingen oplevert. */
export function nieuweIdempotencyKey(): string {
  return crypto.randomUUID();
}

// --- Typen van de antwoorden ----------------------------------------------

export type Omgeving = {
  /** Leeg op een gewone omgeving; gevuld op een test- of acceptatieomgeving. */
  label: string;
  registratieOpen: boolean;
  versie: string;
};

export type Ik = {
  aangemeld: boolean;
  omgeving?: Omgeving;
  gebruiker?: {
    id: string;
    email: string;
    naam: string;
    locale: string;
    mfaIngeschakeld: boolean;
    mfaVoldaan: boolean;
    impersonatie: boolean;
  };
  organisaties?: {
    id: string;
    naam: string;
    abonnement: string;
    status: string;
    rol: string;
    administraties: { id: string; naam: string }[];
  }[];
};

export type Feedback = {
  id: string;
  naam: string | null;
  gebruiker_naam: string | null;
  administratie_naam: string | null;
  soort: 'opmerking' | 'fout' | 'wens' | 'vraag';
  bericht: string;
  scherm: string | null;
  versie_app: string | null;
  status: 'nieuw' | 'opgepakt' | 'verwerkt' | 'afgewezen';
  antwoord: string | null;
  behandeld_op: string | null;
  aangemaakt_op: string;
};

export type AdministratieAntwoord = {
  administratie: {
    id: string;
    naam: string;
    valuta: string;
    locale: string;
    kvk_nummer: string | null;
    btw_nummer: string | null;
    adres: string | null;
    postcode_plaats: string | null;
    email: string | null;
    telefoon: string | null;
    iban: string | null;
    status: string;
    factuur_voettekst: string | null;
    huisstijl_kleur: string | null;
  };
  rechten: string[];
  rol: string;
};

export type Rekening = {
  id: string;
  code: string;
  naam: string;
  soort: string;
  rubriek: string;
  rol: string | null;
  btw_standaard: string | null;
  uitleg: string | null;
  geblokkeerd: boolean;
};

export type BtwCode = {
  id: string;
  code: string;
  naam: string;
  soort: string;
  tarief: string;
  vak: string | null;
  verlegd: boolean;
  ic_levering: boolean;
  geldig_vanaf: string;
  geldig_tot: string | null;
  uitleg: string | null;
};

export type Relatie = {
  id: string;
  nummer: string | null;
  naam: string;
  soort: 'klant' | 'leverancier' | 'beide';
  email: string | null;
  telefoon: string | null;
  btw_nummer: string | null;
  kvk_nummer: string | null;
  iban: string | null;
  land: string;
  betalingstermijn_dagen: number;
  valuta: string;
  versie: number;
};

export type Factuur = {
  id: string;
  contact_id: string;
  contact_naam: string;
  soort: 'offerte' | 'factuur' | 'creditnota' | 'proforma';
  documentnummer: string | null;
  status: string;
  factuurdatum: string;
  vervaldatum: string | null;
  valuta: string;
  totaal_exclusief: string;
  totaal_btw: string;
  totaal_inclusief: string;
  betaald_bedrag: string;
  journal_entry_id: string | null;
  versie: number;
  referentie: string | null;
  notitie: string | null;
  leverdatum: string | null;
};

export type Factuurregel = {
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

export type Factuurtotalen = {
  aantal: number;
  totaal: string;
  openstaand: string;
  vervallen: string;
};

export type Factuurlijst = {
  items: Factuur[];
  totaalAantal: number;
  totalen: Factuurtotalen;
  meer: boolean;
};

export type Project = {
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

export type Projectactiviteit = {
  id: string;
  project_id: string;
  naam: string;
  uurtarief: string | null;
  factureerbaar: boolean;
  status: string;
};

export type Projectsamenvatting = {
  project_id: string;
  project_naam: string;
  project_code: string | null;
  contact_naam: string | null;
  status: string;
  budget_minuten: number | null;
  geschreven_minuten: number;
  factureerbare_minuten: number;
  ongefactureerde_minuten: number;
  factureerbaar_nu_minuten: number;
  gefactureerde_minuten: number;
};

export type Uur = {
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
  status: 'concept' | 'ingediend' | 'goedgekeurd' | 'afgekeurd' | 'gefactureerd';
  sales_invoice_id: string | null;
  factuurnummer: string | null;
  versie: number;
};

export type Urenlijst = {
  items: Uur[];
  totaalMinuten: number;
  alleenEigenUren: boolean;
};

export type Banktransactie = {
  id: string;
  bank_account_id: string;
  boekdatum: string;
  bedrag: string;
  valuta: string;
  tegenrekening: string | null;
  tegenpartij: string | null;
  omschrijving: string;
  status: string;
  journal_entry_id: string | null;
};

export type Matchvoorstel = {
  soort: 'verkoopfactuur' | 'inkoopfactuur';
  factuurId: string;
  documentnummer: string | null;
  relatie: string;
  openstaand: string;
  bedrag: string;
  zekerheid: number;
  motivatie: string;
};

export type Dashboardgegevens = {
  periode: { vanaf: string; tot: string };
  valuta: string;
  omzet: string;
  kosten: string;
  winst: string;
  banksaldo: string;
  openstaandeDebiteuren: string;
  openstaandeCrediteuren: string;
  verwachteBtw: string;
  btwWaarschuwingen: number;
  teBoekenTransacties: number;
  ontbrekendeBonnen: number;
  facturenDieAandachtVragen: {
    id: string;
    documentnummer: string | null;
    relatie: string;
    vervaldatum: string | null;
    openstaand: string;
    status: string;
  }[];
};
