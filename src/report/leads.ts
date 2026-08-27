import { db } from '../db/index.ts';
import type { Verdict } from '../score/score.ts';
import type { PageSignals } from '../scan/analyze.ts';

export type LeadFilter = {
  maxScore?: number;
  minScore?: number;
  grade?: string;
  city?: string;
  branch?: string;
  source?: string;
  outreachStatus?: string;
  /** Alleen leads met een telefoonnummer of e-mailadres. */
  metContact?: boolean;
  /** Neem onbereikbare sites mee (standaard: ja). */
  includeOffline?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
  sort?: 'score' | 'naam' | 'datum';
};

export type Lead = {
  id: number;
  name: string;
  website: string;
  domain: string;
  city: string | null;
  branch: string | null;
  source: string;
  scanned_at: string | null;
  scan_status: string | null;
  score: number | null;
  grade: string | null;
  error: string | null;
  outreach_status: string;
  outreach_note: string | null;
  contact: { emails: string[]; phones: string[] };
  topIssues: { id: string; title: string; severity: string }[];
  categories: { label: string; score: number; max: number }[];
};

type Row = Record<string, unknown>;

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
    source: String(row.source ?? ''),
    scanned_at: (row.scanned_at as string) ?? null,
    scan_status: (row.scan_status as string) ?? null,
    score: row.score === null || row.score === undefined ? null : Number(row.score),
    grade: (row.grade as string) ?? null,
    error: (row.error as string) ?? null,
    outreach_status: String(row.outreach_status ?? 'nieuw'),
    outreach_note: (row.outreach_note as string) ?? null,
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

export function queryLeads(filter: LeadFilter = {}): Lead[] {
  const where: string[] = ['score IS NOT NULL'];
  const params: (string | number)[] = [];

  if (filter.maxScore !== undefined) { where.push('score <= ?'); params.push(filter.maxScore); }
  if (filter.minScore !== undefined) { where.push('score >= ?'); params.push(filter.minScore); }
  if (filter.grade) { where.push('grade = ?'); params.push(filter.grade.toUpperCase()); }
  if (filter.city) { where.push('city LIKE ?'); params.push(`%${filter.city}%`); }
  if (filter.branch) { where.push('branch LIKE ?'); params.push(`%${filter.branch}%`); }
  if (filter.source) { where.push('source = ?'); params.push(filter.source); }
  if (filter.outreachStatus) { where.push('outreach_status = ?'); params.push(filter.outreachStatus); }
  if (filter.includeOffline === false) { where.push("scan_status = 'ok'"); }
  if (filter.search) {
    where.push('(name LIKE ? OR domain LIKE ?)');
    params.push(`%${filter.search}%`, `%${filter.search}%`);
  }

  const order = filter.sort === 'naam' ? 'name ASC'
    : filter.sort === 'datum' ? 'scanned_at DESC'
    : 'score ASC, name ASC';

  const sql = `SELECT * FROM leads WHERE ${where.join(' AND ')} ORDER BY ${order} LIMIT ? OFFSET ?`;
  params.push(filter.limit ?? 200, filter.offset ?? 0);

  const rows = db().prepare(sql).all(...params) as unknown as Row[];
  const leads = rows.map(shape);
  return filter.metContact
    ? leads.filter((lead) => lead.contact.emails.length > 0 || lead.contact.phones.length > 0)
    : leads;
}

export function countLeads(filter: LeadFilter = {}): number {
  return queryLeads({ ...filter, limit: 100_000, offset: 0 }).length;
}

export function getLead(id: number): (Lead & { report: unknown }) | null {
  const row = db().prepare('SELECT * FROM leads WHERE id = ?').get(id) as unknown as Row | undefined;
  if (!row) return null;
  let report: unknown = {};
  try { report = JSON.parse(String(row.report ?? '{}')); } catch { /* negeren */ }
  return { ...shape(row), report };
}
