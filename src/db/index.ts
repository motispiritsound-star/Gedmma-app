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
  rechtsvorm: string | null;
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
  /** bv, nv, eenmanszaak, vof, ... — bepaalt of je mag bellen. */
  rechtsvorm?: string | null;
  source: string;
  sourceRef?: string | null;
};

/** Voegt bedrijven toe; bestaande domeinen worden aangevuld, niet overschreven. */
export function upsertCompanies(rows: CompanyInput[]): { inserted: number; updated: number } {
  const database = db();
  const bestaat = database.prepare('SELECT 1 FROM companies WHERE domain = ?');
  const insert = database.prepare(`
    INSERT INTO companies (name, website, domain, city, province, branch, kvk_number, phone, email, lat, lon, rechtsvorm, source, source_ref)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(domain) DO UPDATE SET
      name       = COALESCE(NULLIF(companies.name, ''), excluded.name),
      city       = COALESCE(companies.city, excluded.city),
      province   = COALESCE(companies.province, excluded.province),
      branch     = COALESCE(companies.branch, excluded.branch),
      kvk_number = COALESCE(companies.kvk_number, excluded.kvk_number),
      phone      = COALESCE(companies.phone, excluded.phone),
      email      = COALESCE(companies.email, excluded.email),
      lat        = COALESCE(companies.lat, excluded.lat),
      lon        = COALESCE(companies.lon, excluded.lon),
      rechtsvorm = COALESCE(companies.rechtsvorm, excluded.rechtsvorm)
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
        row.lat ?? null, row.lon ?? null, row.rechtsvorm ?? null, row.source, row.sourceRef ?? null,
      );
    }
    database.exec('COMMIT');
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  }
  return { inserted, updated };
}

/**
 * Bewaart een scan en werkt de huidige stand op het bedrijf bij. Die twee horen
 * bij elkaar: scans is de geschiedenis, het bedrijf draagt wat je opvraagt.
 */
export function saveScan(companyId: number, scan: {
  status: string; score: number | null; grade: string | null;
  leven: number | null; prioriteit: number | null;
  finalUrl: string | null; httpStatus: number | null; error: string | null; report: unknown;
}): void {
  const database = db();
  const rapport = scan.report as {
    contact?: { phones?: string[]; emails?: string[] };
    verdict?: { topIssues?: { title: string }[] };
  } | null;
  const contact = rapport?.contact;
  const topProblemen = (rapport?.verdict?.topIssues ?? []).slice(0, 3).map((rij) => rij.title);

  const telefoon = contact?.phones?.[0] ?? null;
  const email = contact?.emails?.[0] ?? null;
  const bestaand = (database.prepare('SELECT phone, email FROM companies WHERE id = ?').get(companyId)
    ?? { phone: null, email: null }) as { phone: string | null; email: string | null };

  const resultaat = database.prepare(`
    INSERT INTO scans (company_id, status, score, grade, leven, prioriteit, final_url, http_status, error, report)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    companyId, scan.status, scan.score, scan.grade, scan.leven, scan.prioriteit,
    scan.finalUrl, scan.httpStatus, scan.error, JSON.stringify(scan.report ?? {}),
  );

  database.prepare(`
    UPDATE companies SET
      vorige_score   = score,
      vorige_scan_op = gescand_op,
      laatste_scan_id = ?,
      score = ?, grade = ?, leven = ?, prioriteit = ?, scan_status = ?,
      gescand_op = datetime('now'),
      heeft_telefoon = ?, heeft_email = ?,
      contact_telefoon = ?, contact_email = ?, top_problemen = ?
    WHERE id = ?
  `).run(
    Number(resultaat.lastInsertRowid), scan.score, scan.grade, scan.leven, scan.prioriteit, scan.status,
    telefoon || bestaand.phone ? 1 : 0,
    email || bestaand.email ? 1 : 0,
    telefoon ?? bestaand.phone ?? null,
    email ?? bestaand.email ?? null,
    JSON.stringify(topProblemen),
    companyId,
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
    SELECT * FROM companies
    WHERE gescand_op IS NULL OR gescand_op < datetime('now', ?)
    ORDER BY id
    LIMIT ?
  `).all(`-${days} days`, limit) as unknown as CompanyRow[];
}

/**
 * De contactgegevens uit de laatste scan die er wél vond. Als een site vandaag
 * offline is, wil je het nummer van vorige maand nog steeds kunnen bellen —
 * dat is juist dan een goede reden om contact op te nemen.
 */
export function laatsteContactgegevens(companyId: number): { contact: unknown; op: string } | null {
  const rijen = db().prepare(`
    SELECT report, scanned_at FROM scans
    WHERE company_id = ? AND status = 'ok'
    ORDER BY scanned_at DESC, id DESC LIMIT 5
  `).all(companyId) as unknown as { report: string; scanned_at: string }[];

  for (const rij of rijen) {
    try {
      const rapport = JSON.parse(rij.report) as { contact?: { emails: string[]; phones: string[] } };
      if ((rapport.contact?.emails.length ?? 0) > 0 || (rapport.contact?.phones.length ?? 0) > 0) {
        return { contact: rapport.contact, op: rij.scanned_at };
      }
    } catch { /* corrupte json overslaan */ }
  }
  return null;
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

/** Alle cijfers voor bovenin het dashboard, in één keer over de bedrijventabel. */
export function stats(): Record<string, number> {
  const rij = db().prepare(`
    SELECT
      COUNT(*)                                                              AS bedrijven,
      SUM(CASE WHEN laatste_scan_id IS NOT NULL THEN 1 ELSE 0 END)          AS gescand,
      SUM(CASE WHEN laatste_scan_id IS NULL THEN 1 ELSE 0 END)              AS ongescand,
      SUM(CASE WHEN score IS NOT NULL AND score < 50 THEN 1 ELSE 0 END)     AS slecht,
      SUM(CASE WHEN score >= 50 AND score < 70 THEN 1 ELSE 0 END)           AS matig,
      SUM(CASE WHEN score >= 70 THEN 1 ELSE 0 END)                          AS goed,
      SUM(CASE WHEN scan_status IN ('error','offline') THEN 1 ELSE 0 END)   AS onbereikbaar,
      SUM(CASE WHEN lat IS NOT NULL THEN 1 ELSE 0 END)                      AS opKaart
    FROM companies
  `).get() as Record<string, number | null>;

  const klanten = db().prepare("SELECT COUNT(*) n FROM klanten WHERE status = 'actief'")
    .get() as { n: number };

  return {
    bedrijven: Number(rij.bedrijven ?? 0),
    gescand: Number(rij.gescand ?? 0),
    ongescand: Number(rij.ongescand ?? 0),
    slecht: Number(rij.slecht ?? 0),
    matig: Number(rij.matig ?? 0),
    goed: Number(rij.goed ?? 0),
    onbereikbaar: Number(rij.onbereikbaar ?? 0),
    opKaart: Number(rij.opKaart ?? 0),
    klanten: Number(klanten?.n ?? 0),
  };
}
