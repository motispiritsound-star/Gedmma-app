import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { config } from '../config.ts';

export type CompanyRow = {
  id: number;
  name: string;
  website: string;
  domain: string;
  city: string | null;
  province: string | null;
  branch: string | null;
  kvk_number: string | null;
  phone: string | null;
  email: string | null;
  source: string;
  source_ref: string | null;
  created_at: string;
};

export type ScanRow = {
  id: number;
  company_id: number;
  scanned_at: string;
  status: string;
  score: number | null;
  grade: string | null;
  final_url: string | null;
  http_status: number | null;
  error: string | null;
  report: string;
};

const SCHEMA = `
CREATE TABLE IF NOT EXISTS companies (
  id          INTEGER PRIMARY KEY,
  name        TEXT NOT NULL,
  website     TEXT NOT NULL,
  domain      TEXT NOT NULL UNIQUE,
  city        TEXT,
  province    TEXT,
  branch      TEXT,
  kvk_number  TEXT,
  phone       TEXT,
  email       TEXT,
  source      TEXT NOT NULL,
  source_ref  TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS scans (
  id          INTEGER PRIMARY KEY,
  company_id  INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  scanned_at  TEXT NOT NULL DEFAULT (datetime('now')),
  status      TEXT NOT NULL,
  score       INTEGER,
  grade       TEXT,
  final_url   TEXT,
  http_status INTEGER,
  error       TEXT,
  report      TEXT NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_scans_company ON scans(company_id, scanned_at DESC);
CREATE INDEX IF NOT EXISTS idx_scans_score   ON scans(score);

CREATE TABLE IF NOT EXISTS outreach (
  company_id  INTEGER PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'nieuw',
  note        TEXT,
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Laatste scan per bedrijf, verrijkt met leadstatus.
CREATE VIEW IF NOT EXISTS leads AS
SELECT
  c.id, c.name, c.website, c.domain, c.city, c.province, c.branch,
  c.phone AS company_phone, c.email AS company_email, c.source,
  s.id AS scan_id, s.scanned_at, s.status AS scan_status,
  s.score, s.grade, s.final_url, s.http_status, s.error, s.report,
  COALESCE(o.status, 'nieuw') AS outreach_status, o.note AS outreach_note
FROM companies c
LEFT JOIN scans s ON s.id = (
  SELECT id FROM scans WHERE company_id = c.id ORDER BY scanned_at DESC, id DESC LIMIT 1
)
LEFT JOIN outreach o ON o.company_id = c.id;
`;

let handle: DatabaseSync | null = null;

export function db(): DatabaseSync {
  if (handle) return handle;
  mkdirSync(dirname(config.dbPath), { recursive: true });
  handle = new DatabaseSync(config.dbPath);
  handle.exec('PRAGMA journal_mode = WAL;');
  handle.exec('PRAGMA foreign_keys = ON;');
  handle.exec(SCHEMA);
  return handle;
}

export type CompanyInput = {
  name: string;
  website: string;
  domain: string;
  city?: string | null;
  province?: string | null;
  branch?: string | null;
  kvkNumber?: string | null;
  phone?: string | null;
  email?: string | null;
  source: string;
  sourceRef?: string | null;
};

/** Voegt bedrijven toe; bestaande domeinen worden aangevuld, niet overschreven. */
export function upsertCompanies(rows: CompanyInput[]): { inserted: number; updated: number } {
  const database = db();
  const insert = database.prepare(`
    INSERT INTO companies (name, website, domain, city, province, branch, kvk_number, phone, email, source, source_ref)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(domain) DO UPDATE SET
      name       = COALESCE(NULLIF(companies.name, ''), excluded.name),
      city       = COALESCE(companies.city, excluded.city),
      province   = COALESCE(companies.province, excluded.province),
      branch     = COALESCE(companies.branch, excluded.branch),
      kvk_number = COALESCE(companies.kvk_number, excluded.kvk_number),
      phone      = COALESCE(companies.phone, excluded.phone),
      email      = COALESCE(companies.email, excluded.email)
  `);

  let inserted = 0;
  let updated = 0;
  database.exec('BEGIN');
  try {
    for (const row of rows) {
      const before = database.prepare('SELECT 1 FROM companies WHERE domain = ?').get(row.domain);
      insert.run(
        row.name, row.website, row.domain, row.city ?? null, row.province ?? null,
        row.branch ?? null, row.kvkNumber ?? null, row.phone ?? null, row.email ?? null,
        row.source, row.sourceRef ?? null,
      );
      if (before) updated++; else inserted++;
    }
    database.exec('COMMIT');
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  }
  return { inserted, updated };
}

export function saveScan(companyId: number, scan: {
  status: string; score: number | null; grade: string | null;
  finalUrl: string | null; httpStatus: number | null; error: string | null; report: unknown;
}): void {
  db().prepare(`
    INSERT INTO scans (company_id, status, score, grade, final_url, http_status, error, report)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    companyId, scan.status, scan.score, scan.grade,
    scan.finalUrl, scan.httpStatus, scan.error, JSON.stringify(scan.report ?? {}),
  );
}

/** Bedrijven die nog gescand moeten worden (of waarvan de scan verouderd is). */
export function companiesToScan(opts: { limit?: number; rescanAfterDays?: number; all?: boolean } = {}): CompanyRow[] {
  const limit = opts.limit ?? 500;
  if (opts.all) {
    return db().prepare('SELECT * FROM companies ORDER BY id LIMIT ?').all(limit) as unknown as CompanyRow[];
  }
  const days = opts.rescanAfterDays ?? 30;
  return db().prepare(`
    SELECT c.* FROM companies c
    LEFT JOIN scans s ON s.id = (
      SELECT id FROM scans WHERE company_id = c.id ORDER BY scanned_at DESC, id DESC LIMIT 1
    )
    WHERE s.id IS NULL OR s.scanned_at < datetime('now', ?)
    ORDER BY c.id
    LIMIT ?
  `).all(`-${days} days`, limit) as unknown as CompanyRow[];
}

export function setOutreach(companyId: number, status: string, note?: string): void {
  db().prepare(`
    INSERT INTO outreach (company_id, status, note, updated_at)
    VALUES (?, ?, ?, datetime('now'))
    ON CONFLICT(company_id) DO UPDATE SET
      status = excluded.status,
      note = COALESCE(excluded.note, outreach.note),
      updated_at = datetime('now')
  `).run(companyId, status, note ?? null);
}

export function stats(): Record<string, number> {
  const one = (sql: string): number =>
    Number((db().prepare(sql).get() as Record<string, unknown>)?.n ?? 0);
  return {
    bedrijven: one('SELECT COUNT(*) n FROM companies'),
    gescand: one('SELECT COUNT(DISTINCT company_id) n FROM scans'),
    ongescand: one(`SELECT COUNT(*) n FROM companies c WHERE NOT EXISTS (SELECT 1 FROM scans WHERE company_id = c.id)`),
    slecht: one(`SELECT COUNT(*) n FROM leads WHERE score IS NOT NULL AND score < 50`),
    matig: one(`SELECT COUNT(*) n FROM leads WHERE score >= 50 AND score < 70`),
    goed: one(`SELECT COUNT(*) n FROM leads WHERE score >= 70`),
    onbereikbaar: one(`SELECT COUNT(*) n FROM leads WHERE scan_status IN ('error','offline')`),
  };
}
