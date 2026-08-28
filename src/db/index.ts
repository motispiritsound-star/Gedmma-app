import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { config } from '../config.ts';
import { migreer } from './schema.ts';

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
  lat: number | null;
  lon: number | null;
  source: string;
  source_ref: string | null;
  created_at: string;
};

let handle: DatabaseSync | null = null;

export function db(): DatabaseSync {
  if (handle) return handle;
  mkdirSync(dirname(config.dbPath), { recursive: true });
  handle = new DatabaseSync(config.dbPath);
  handle.exec('PRAGMA journal_mode = WAL;');
  handle.exec('PRAGMA foreign_keys = ON;');
  migreer(handle);
  return handle;
}

/** Sluit de verbinding; alleen nodig in tests en scripts. */
export function sluitDb(): void {
  handle?.close();
  handle = null;
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
  lat?: number | null;
  lon?: number | null;
  source: string;
  sourceRef?: string | null;
};

/** Voegt bedrijven toe; bestaande domeinen worden aangevuld, niet overschreven. */
export function upsertCompanies(rows: CompanyInput[]): { inserted: number; updated: number } {
  const database = db();
  const bestaat = database.prepare('SELECT 1 FROM companies WHERE domain = ?');
  const insert = database.prepare(`
    INSERT INTO companies (name, website, domain, city, province, branch, kvk_number, phone, email, lat, lon, source, source_ref)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(domain) DO UPDATE SET
      name       = COALESCE(NULLIF(companies.name, ''), excluded.name),
      city       = COALESCE(companies.city, excluded.city),
      province   = COALESCE(companies.province, excluded.province),
      branch     = COALESCE(companies.branch, excluded.branch),
      kvk_number = COALESCE(companies.kvk_number, excluded.kvk_number),
      phone      = COALESCE(companies.phone, excluded.phone),
      email      = COALESCE(companies.email, excluded.email),
      lat        = COALESCE(companies.lat, excluded.lat),
      lon        = COALESCE(companies.lon, excluded.lon)
  `);

  let inserted = 0;
  let updated = 0;
  database.exec('BEGIN');
  try {
    for (const row of rows) {
      if (bestaat.get(row.domain)) updated++; else inserted++;
      insert.run(
        row.name, row.website, row.domain, row.city ?? null, row.province ?? null,
        row.branch ?? null, row.kvkNumber ?? null, row.phone ?? null, row.email ?? null,
        row.lat ?? null, row.lon ?? null, row.source, row.sourceRef ?? null,
      );
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

/** Bedrijven zonder coördinaten, voor de geocodeerstap. */
export function companiesZonderCoordinaten(limit = 200): CompanyRow[] {
  return db().prepare(
    'SELECT * FROM companies WHERE (lat IS NULL OR lon IS NULL) AND city IS NOT NULL ORDER BY id LIMIT ?',
  ).all(limit) as unknown as CompanyRow[];
}

export function bewaarCoordinaten(companyId: number, lat: number, lon: number): void {
  db().prepare('UPDATE companies SET lat = ?, lon = ? WHERE id = ?').run(lat, lon, companyId);
}

export function stats(): Record<string, number> {
  const one = (sql: string): number =>
    Number((db().prepare(sql).get() as Record<string, unknown>)?.n ?? 0);
  return {
    bedrijven: one('SELECT COUNT(*) n FROM companies'),
    gescand: one('SELECT COUNT(DISTINCT company_id) n FROM scans'),
    ongescand: one('SELECT COUNT(*) n FROM companies c WHERE NOT EXISTS (SELECT 1 FROM scans WHERE company_id = c.id)'),
    slecht: one('SELECT COUNT(*) n FROM leads WHERE score IS NOT NULL AND score < 50'),
    matig: one('SELECT COUNT(*) n FROM leads WHERE score >= 50 AND score < 70'),
    goed: one('SELECT COUNT(*) n FROM leads WHERE score >= 70'),
    onbereikbaar: one("SELECT COUNT(*) n FROM leads WHERE scan_status IN ('error','offline')"),
    opKaart: one('SELECT COUNT(*) n FROM companies WHERE lat IS NOT NULL'),
    klanten: one("SELECT COUNT(*) n FROM klanten WHERE status = 'actief'"),
  };
}
