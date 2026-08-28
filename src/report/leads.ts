import { db } from '../db/index.ts';
import { RECHTSVORMEN } from '../db/contact.ts';
import type { Verdict } from '../score/score.ts';
import type { PageSignals } from '../scan/analyze.ts';

export type LeadFilter = {
  maxScore?: number;
  minScore?: number;
  grade?: string;
  city?: string;
  branch?: string;
  source?: string;
  /** Fase in de pijplijn, bv. 'nieuw' of 'afspraak'. */
  fase?: string;
  /** Alleen leads van deze agent. */
  agentId?: number;
  /** Alleen leads die nog van niemand zijn. */
  alleenVrij?: boolean;
  /** Alleen leads die bij een ander dan deze gebruiker liggen. */
  vanCollegas?: number;
  /** Alleen bedrijven die je mag bellen (rechtspersoon of toestemming). */
  alleenBelbaar?: boolean;
  /** Alleen bedrijven waar nog tekenen van leven zijn. */
  minLeven?: number;
  minPrioriteit?: number;
  /** Alleen bedrijven waarvan de site sinds de vorige scan slechter is geworden. */
  achteruit?: boolean;
  /** Alleen bedrijven binnen dit stuk kaart. */
  kader?: { noord: number; zuid: number; oost: number; west: number };
  /** Toon ook bedrijven die zich hebben afgemeld. Standaard blijven die verborgen. */
  toonGeblokkeerd?: boolean;
  /** Alleen leads met een telefoonnummer of e-mailadres. */
  metContact?: boolean;
  /** Alleen leads met coördinaten (voor de kaart). */
  metCoordinaten?: boolean;
  includeOffline?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
  sort?: 'prioriteit' | 'score' | 'naam' | 'datum' | 'actie' | 'verandering';
};

export type Lead = {
  id: number;
  name: string;
  website: string;
  domain: string;
  city: string | null;
  branch: string | null;
  rechtsvorm: string | null;
  bel_toestemming: number;
  toestemming_op: string | null;
  toestemming_via: string | null;
  geblokkeerd: number;
  geblokkeerd_reden: string | null;
  source: string;
  lat: number | null;
  lon: number | null;
  scanned_at: string | null;
  scan_status: string | null;
  score: number | null;
  grade: string | null;
  leven: number | null;
  prioriteit: number | null;
  /** De score van de scan daarvoor, om te zien of het beter of slechter wordt. */
  vorige_score: number | null;
  vorige_scan_op: string | null;
  error: string | null;
  fase: string;
  toegewezen_aan: number | null;
  toegewezen_op: string | null;
  agent_naam: string | null;
  volgende_actie_op: string | null;
  opvolging_notitie: string | null;
  activiteiten: number;
  klant_status: string | null;
  maandbedrag_cent: number | null;
  testimonial_sterren: number | null;
  contact: {
    emails: string[];
    phones: string[];
    adres: { adres: string; postcode: string; plaats: string } | null;
    kvk: string | null;
    btw: string | null;
    openingstijden: string | null;
    whatsapp: string | null;
    socials: Record<string, string>;
    heeftFormulier: boolean;
    bron: string | null;
    vanEerdereScan: string | null;
  };
  topIssues: { id: string; title: string; severity: string }[];
  categories: { label: string; score: number; max: number }[];
};

type Row = Record<string, unknown>;

const RECHTSPERSONEN = RECHTSVORMEN.filter((vorm) => !vorm.natuurlijkPersoon).map((vorm) => vorm.id);

const getal = (waarde: unknown): number | null =>
  waarde === null || waarde === undefined ? null : Number(waarde);

type Contactblok = {
  emails: string[]; phones: string[];
  adres: { adres: string; postcode: string; plaats: string } | null;
  kvk: string | null; btw: string | null; openingstijden: string | null;
  whatsapp: string | null; socials: Record<string, string>;
  heeftFormulier: boolean; bron: string | null; vanEerdereScan: string | null;
};

const LEEG_CONTACT: Contactblok = {
  emails: [], phones: [], adres: null, kvk: null, btw: null, openingstijden: null,
  whatsapp: null, socials: {}, heeftFormulier: false, bron: null, vanEerdereScan: null,
};

/**
 * Zet een rij om in een lead. Rijen uit de lichte view hebben geen rapport; dan
 * komen de contactgegevens en het grootste probleem uit de afgeleide kolommen.
 */
function shape(row: Row): Lead {
  let report: { verdict?: Verdict; signals?: PageSignals | null; contact?: Contactblok } = {};
  if (row.report) {
    try { report = JSON.parse(String(row.report)); } catch { /* corrupte json negeren */ }
  }

  const signals = report.signals ?? null;
  const uitKolommen: Contactblok = {
    ...LEEG_CONTACT,
    phones: [row.contact_telefoon, row.company_phone].filter(Boolean).slice(0, 1).map(String),
    emails: [row.contact_email, row.company_email].filter(Boolean).slice(0, 1).map(String),
  };
  // Sinds de contactpagina wordt meegescand staan de samengevoegde gegevens in
  // het rapport; oudere scans hebben alleen wat er op de homepage stond.
  const gevonden = report.contact ?? (signals
    ? {
        ...LEEG_CONTACT,
        emails: signals.contact.emails, phones: signals.contact.phones,
        kvk: signals.contact.kvk, btw: signals.contact.btw,
        heeftFormulier: Boolean(signals.contact.hasContactForm),
      }
    : uitKolommen);
  const emails = gevonden.emails;
  const phones = gevonden.phones;

  let topProblemen: string[] = [];
  if (report.verdict) topProblemen = report.verdict.topIssues.map((rij) => rij.title);
  else if (row.top_problemen) {
    try { topProblemen = JSON.parse(String(row.top_problemen)) as string[]; } catch { topProblemen = []; }
  }

  return {
    id: Number(row.id),
    name: String(row.name ?? ''),
    website: String(row.website ?? ''),
    domain: String(row.domain ?? ''),
    city: (row.city as string) ?? null,
    branch: (row.branch as string) ?? null,
    rechtsvorm: (row.rechtsvorm as string) ?? null,
    bel_toestemming: Number(row.bel_toestemming ?? 0),
    toestemming_op: (row.toestemming_op as string) ?? null,
    toestemming_via: (row.toestemming_via as string) ?? null,
    geblokkeerd: Number(row.geblokkeerd ?? 0),
    geblokkeerd_reden: (row.geblokkeerd_reden as string) ?? null,
    source: String(row.source ?? ''),
    lat: getal(row.lat),
    lon: getal(row.lon),
    scanned_at: (row.scanned_at as string) ?? null,
    scan_status: (row.scan_status as string) ?? null,
    score: getal(row.score),
    grade: (row.grade as string) ?? null,
    leven: getal(row.leven),
    prioriteit: getal(row.prioriteit),
    vorige_score: getal(row.vorige_score),
    vorige_scan_op: (row.vorige_scan_op as string) ?? null,
    error: (row.error as string) ?? null,
    fase: String(row.fase ?? 'nieuw'),
    toegewezen_aan: getal(row.toegewezen_aan),
    toegewezen_op: (row.toegewezen_op as string) ?? null,
    agent_naam: (row.agent_naam as string) ?? null,
    volgende_actie_op: (row.volgende_actie_op as string) ?? null,
    opvolging_notitie: (row.opvolging_notitie as string) ?? null,
    activiteiten: Number(row.activiteiten ?? 0),
    klant_status: (row.klant_status as string) ?? null,
    maandbedrag_cent: getal(row.maandbedrag_cent),
    testimonial_sterren: getal(row.testimonial_sterren),
    contact: {
      ...gevonden,
      // Wat de bron meegaf telt mee als de site zelf niets prijsgeeft.
      emails: emails.length > 0 ? emails : [row.company_email].filter(Boolean).map(String),
      phones: phones.length > 0 ? phones : [row.company_phone].filter(Boolean).map(String),
    },
    topIssues: report.verdict
      ? report.verdict.topIssues.map((entry) => ({ id: entry.id, title: entry.title, severity: entry.severity }))
      : topProblemen.map((titel) => ({ id: '', title: titel, severity: 'onbekend' })),
    categories: (report.verdict?.categories ?? []).map((entry) => ({
      label: entry.label, score: entry.score, max: entry.max,
    })),
  };
}

function waar(filter: LeadFilter): { sql: string; params: (string | number)[] } {
  const delen: string[] = ['score IS NOT NULL'];
  const params: (string | number)[] = [];

  if (filter.maxScore !== undefined) { delen.push('score <= ?'); params.push(filter.maxScore); }
  if (filter.minScore !== undefined) { delen.push('score >= ?'); params.push(filter.minScore); }
  if (filter.grade) { delen.push('grade = ?'); params.push(filter.grade.toUpperCase()); }
  if (filter.city) { delen.push('city LIKE ?'); params.push(`%${filter.city}%`); }
  if (filter.branch) { delen.push('branch LIKE ?'); params.push(`%${filter.branch}%`); }
  if (filter.source) { delen.push('source = ?'); params.push(filter.source); }
  if (filter.fase) { delen.push('fase = ?'); params.push(filter.fase); }
  if (filter.agentId !== undefined) { delen.push('toegewezen_aan = ?'); params.push(filter.agentId); }
  if (filter.alleenVrij) delen.push('toegewezen_aan IS NULL');
  if (filter.vanCollegas !== undefined) {
    delen.push('toegewezen_aan IS NOT NULL AND toegewezen_aan != ?');
    params.push(filter.vanCollegas);
  }
  if (filter.metCoordinaten) delen.push('lat IS NOT NULL AND lon IS NOT NULL');
  if (filter.metContact) delen.push('(heeft_telefoon = 1 OR heeft_email = 1)');
  // Wie zich heeft afgemeld verdwijnt uit elke lijst, tenzij je er expliciet om vraagt.
  if (!filter.toonGeblokkeerd) delen.push('geblokkeerd = 0');
  if (filter.minLeven !== undefined) { delen.push('leven >= ?'); params.push(filter.minLeven); }
  if (filter.minPrioriteit !== undefined) { delen.push('prioriteit >= ?'); params.push(filter.minPrioriteit); }
  if (filter.achteruit) delen.push('vorige_score IS NOT NULL AND score < vorige_score - 4');
  if (filter.kader) {
    delen.push('lat BETWEEN ? AND ? AND lon BETWEEN ? AND ?');
    params.push(filter.kader.zuid, filter.kader.noord, filter.kader.west, filter.kader.oost);
  }
  if (filter.alleenBelbaar) {
    delen.push(`(bel_toestemming = 1 OR rechtsvorm IN (${
      RECHTSPERSONEN.map((vorm) => `'${vorm}'`).join(',')}))`);
  }
  if (filter.includeOffline === false) delen.push("scan_status = 'ok'");
  if (filter.search) {
    delen.push('(name LIKE ? OR domain LIKE ? OR city LIKE ?)');
    params.push(`%${filter.search}%`, `%${filter.search}%`, `%${filter.search}%`);
  }
  return { sql: delen.join(' AND '), params };
}

const SORTERING: Record<string, string> = {
  // Standaard: de bedrijven waar het meeste te halen valt bovenaan.
  prioriteit: 'prioriteit DESC, score ASC, name ASC',
  score: 'score ASC, name ASC',
  naam: 'name ASC',
  datum: 'scanned_at DESC',
  actie: 'volgende_actie_op IS NULL, volgende_actie_op ASC, score ASC',
  verandering: 'COALESCE(score - vorige_score, 0) ASC, prioriteit DESC',
};

/**
 * Haalt een pagina met leads op. Gebruikt de lichte view: alles wat een lijst
 * toont staat als kolom op het bedrijf, dus het rapport van een paar kilobyte
 * hoeft er niet bij. Dat scheelt bij tienduizenden bedrijven het verschil
 * tussen een halve seconde en een paar milliseconden.
 */
export function queryLeads(filter: LeadFilter = {}): Lead[] {
  const { sql, params } = waar(filter);
  const order = SORTERING[filter.sort ?? 'prioriteit'] ?? SORTERING.prioriteit!;
  const rows = db().prepare(`SELECT * FROM leads_kort WHERE ${sql} ORDER BY ${order} LIMIT ? OFFSET ?`)
    .all(...params, filter.limit ?? 200, filter.offset ?? 0) as unknown as Row[];
  return rows.map(shape);
}

export function countLeads(filter: LeadFilter = {}): number {
  const { sql, params } = waar(filter);
  const rij = db().prepare(`SELECT COUNT(*) AS n FROM leads_kort WHERE ${sql}`).get(...params) as { n: number };
  return Number(rij?.n ?? 0);
}

export type KaartPunt = {
  id: number; naam: string; plaats: string | null;
  lat: number; lon: number; score: number; grade: string; fase: string;
  leven: number | null; prioriteit: number | null;
  agentId: number | null; agent: string | null; klant: boolean; belbaar: boolean;
};

/**
 * Lichte variant voor de kaart: alleen wat een bolletje nodig heeft. Duizenden
 * bedrijven passen zo in één antwoord zonder de rapporten mee te sturen.
 */
export function kaartPunten(filter: LeadFilter = {}): KaartPunt[] {
  const { sql, params } = waar({ ...filter, metCoordinaten: true });
  const rows = db().prepare(`
    SELECT id, name, city, lat, lon, score, grade, leven, prioriteit, fase,
           toegewezen_aan, agent_naam, klant_status, rechtsvorm, bel_toestemming
    FROM leads_kort WHERE ${sql} ORDER BY prioriteit DESC LIMIT ?
  `).all(...params, filter.limit ?? 5000) as unknown as Row[];

  return rows.map((row) => ({
    id: Number(row.id),
    naam: String(row.name ?? ''),
    plaats: (row.city as string) ?? null,
    lat: Number(row.lat),
    lon: Number(row.lon),
    score: Number(row.score),
    grade: String(row.grade ?? 'F'),
    fase: String(row.fase ?? 'nieuw'),
    leven: getal(row.leven),
    prioriteit: getal(row.prioriteit),
    agentId: getal(row.toegewezen_aan),
    agent: (row.agent_naam as string) ?? null,
    klant: row.klant_status === 'actief',
    belbaar: Number(row.bel_toestemming ?? 0) === 1
      || RECHTSPERSONEN.includes(String(row.rechtsvorm ?? '') as never),
  }));
}

export type KaartVakje = {
  lat: number; lon: number; aantal: number; gemiddelde: number; slechtste: number;
};

/**
 * Groepeert de bedrijven per stukje kaart. Bij tienduizenden bedrijven heeft
 * het geen zin om elk bolletje apart naar de browser te sturen: op deze schaal
 * vallen ze toch op elkaar. Zodra je inzoomt vraagt de kaart de losse punten op.
 */
export function kaartVakjes(filter: LeadFilter = {}, celGrootte = 0.06): KaartVakje[] {
  const { sql, params } = waar({ ...filter, metCoordinaten: true });
  const cel = Math.max(0.005, celGrootte);
  const rows = db().prepare(`
    SELECT ROUND(lat / ?) * ? AS vlat, ROUND(lon / ?) * ? AS vlon,
           COUNT(*) AS aantal, AVG(score) AS gemiddelde, MIN(score) AS slechtste
    FROM leads_kort WHERE ${sql}
    GROUP BY vlat, vlon
  `).all(cel, cel, cel, cel, ...params) as unknown as Row[];

  return rows.map((row) => ({
    lat: Number(row.vlat),
    lon: Number(row.vlon),
    aantal: Number(row.aantal),
    gemiddelde: Math.round(Number(row.gemiddelde)),
    slechtste: Number(row.slechtste),
  }));
}

export function getLead(id: number): (Lead & { report: unknown }) | null {
  const row = db().prepare('SELECT * FROM leads WHERE id = ?').get(id) as unknown as Row | undefined;
  if (!row) return null;
  let report: unknown = {};
  try { report = JSON.parse(String(row.report ?? '{}')); } catch { /* negeren */ }
  return { ...shape(row), report };
}

/** Plaatsen met hun aantallen, voor de filterlijst en de kaartlegenda. */
export function plaatsen(): { plaats: string; aantal: number; gemiddelde: number }[] {
  return db().prepare(`
    SELECT city AS plaats, COUNT(*) AS aantal, ROUND(AVG(score)) AS gemiddelde
    FROM companies WHERE city IS NOT NULL AND score IS NOT NULL
    GROUP BY city ORDER BY aantal DESC LIMIT 200
  `).all() as never;
}
