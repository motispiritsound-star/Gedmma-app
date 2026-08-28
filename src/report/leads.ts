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
  sort?: 'prioriteit' | 'score' | 'naam' | 'datum' | 'actie';
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
  contact: { emails: string[]; phones: string[] };
  topIssues: { id: string; title: string; severity: string }[];
  categories: { label: string; score: number; max: number }[];
};

type Row = Record<string, unknown>;

const RECHTSPERSONEN = RECHTSVORMEN.filter((vorm) => !vorm.natuurlijkPersoon).map((vorm) => vorm.id);

const getal = (waarde: unknown): number | null =>
  waarde === null || waarde === undefined ? null : Number(waarde);

function shape(row: Row): Lead {
  let report: { verdict?: Verdict; signals?: PageSignals | null } = {};
  try { report = JSON.parse(String(row.report ?? '{}')); } catch { /* corrupte json negeren */ }

  const signals = report.signals ?? null;
  const emails = signals?.contact.emails ?? [];
  const phones = signals?.contact.phones ?? [];

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
      emails: emails.length > 0 ? emails : [row.company_email].filter(Boolean).map(String),
      phones: phones.length > 0 ? phones : [row.company_phone].filter(Boolean).map(String),
    },
    topIssues: (report.verdict?.topIssues ?? []).map((entry) => ({
      id: entry.id, title: entry.title, severity: entry.severity,
    })),
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
  // Wie zich heeft afgemeld verdwijnt uit elke lijst, tenzij je er expliciet om vraagt.
  if (!filter.toonGeblokkeerd) delen.push('geblokkeerd = 0');
  if (filter.minLeven !== undefined) { delen.push('leven >= ?'); params.push(filter.minLeven); }
  if (filter.minPrioriteit !== undefined) { delen.push('prioriteit >= ?'); params.push(filter.minPrioriteit); }
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
};

export function queryLeads(filter: LeadFilter = {}): Lead[] {
  const { sql, params } = waar(filter);
  const order = SORTERING[filter.sort ?? 'prioriteit'] ?? SORTERING.prioriteit!;
  const rows = db().prepare(`SELECT * FROM leads WHERE ${sql} ORDER BY ${order} LIMIT ? OFFSET ?`)
    .all(...params, filter.limit ?? 200, filter.offset ?? 0) as unknown as Row[];

  const leads = rows.map(shape);
  return filter.metContact
    ? leads.filter((lead) => lead.contact.emails.length > 0 || lead.contact.phones.length > 0)
    : leads;
}

export function countLeads(filter: LeadFilter = {}): number {
  if (filter.metContact) return queryLeads({ ...filter, limit: 100_000, offset: 0 }).length;
  const { sql, params } = waar(filter);
  const rij = db().prepare(`SELECT COUNT(*) AS n FROM leads WHERE ${sql}`).get(...params) as { n: number };
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
    FROM leads WHERE ${sql} ORDER BY prioriteit DESC LIMIT ?
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
    FROM leads WHERE city IS NOT NULL AND score IS NOT NULL
    GROUP BY city ORDER BY aantal DESC
  `).all() as never;
}
