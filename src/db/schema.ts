import type { DatabaseSync } from 'node:sqlite';

/**
 * Migraties, op volgorde. Elke stap draait precies één keer; `PRAGMA user_version`
 * houdt bij hoe ver een database is. Nooit een bestaande stap wijzigen — voeg
 * een nieuwe toe, anders lopen databases in het veld uit de pas.
 */
const MIGRATIES: { naam: string; sql: string }[] = [
  {
    naam: '001-bedrijven-en-scans',
    sql: `
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

      -- De eerste versie hield de opvolging hier bij; migratie 004 neemt hem over.
      CREATE TABLE IF NOT EXISTS outreach (
        company_id INTEGER PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
        status     TEXT NOT NULL DEFAULT 'nieuw',
        note       TEXT,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `,
  },
  {
    naam: '002-coordinaten',
    sql: `
      ALTER TABLE companies ADD COLUMN lat REAL;
      ALTER TABLE companies ADD COLUMN lon REAL;
      CREATE INDEX IF NOT EXISTS idx_companies_geo ON companies(lat, lon);
    `,
  },
  {
    naam: '003-team',
    sql: `
      CREATE TABLE gebruikers (
        id            INTEGER PRIMARY KEY,
        naam          TEXT NOT NULL,
        email         TEXT NOT NULL UNIQUE,
        wachtwoord    TEXT NOT NULL,
        rol           TEXT NOT NULL DEFAULT 'agent',
        actief        INTEGER NOT NULL DEFAULT 1,
        aangemaakt_op TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE sessies (
        token         TEXT PRIMARY KEY,
        gebruiker_id  INTEGER NOT NULL REFERENCES gebruikers(id) ON DELETE CASCADE,
        verloopt_op   TEXT NOT NULL,
        aangemaakt_op TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX idx_sessies_gebruiker ON sessies(gebruiker_id);
    `,
  },
  {
    naam: '004-opvolging',
    sql: `
      CREATE TABLE opvolging (
        company_id        INTEGER PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
        fase              TEXT NOT NULL DEFAULT 'nieuw',
        toegewezen_aan    INTEGER REFERENCES gebruikers(id) ON DELETE SET NULL,
        toegewezen_op     TEXT,
        volgende_actie_op TEXT,
        notitie           TEXT,
        bijgewerkt_op     TEXT NOT NULL DEFAULT (datetime('now')),
        bijgewerkt_door   INTEGER REFERENCES gebruikers(id) ON DELETE SET NULL
      );
      CREATE INDEX idx_opvolging_agent ON opvolging(toegewezen_aan, fase);

      CREATE TABLE activiteiten (
        id           INTEGER PRIMARY KEY,
        company_id   INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        gebruiker_id INTEGER REFERENCES gebruikers(id) ON DELETE SET NULL,
        soort        TEXT NOT NULL,
        uitkomst     TEXT,
        notitie      TEXT,
        op           TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX idx_activiteiten_bedrijf ON activiteiten(company_id, op DESC);

      -- Bestaande opvolgstatussen overnemen uit de oude tabel, als die er is.
      INSERT INTO opvolging (company_id, fase, notitie)
      SELECT company_id,
             CASE status WHEN 'benaderd' THEN 'gebeld' WHEN 'gereageerd' THEN 'afspraak'
                         WHEN 'klant' THEN 'klant' WHEN 'afgewezen' THEN 'afgewezen' ELSE 'nieuw' END,
             note
      FROM outreach;
      DROP TABLE outreach;
    `,
  },
  {
    naam: '005-klanten-en-testimonials',
    sql: `
      CREATE TABLE klanten (
        company_id         INTEGER PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
        binnengehaald_door INTEGER REFERENCES gebruikers(id) ON DELETE SET NULL,
        pakket             TEXT NOT NULL DEFAULT 'hosting',
        maandbedrag_cent   INTEGER NOT NULL DEFAULT 0,
        gestart_op         TEXT NOT NULL DEFAULT (date('now')),
        opgezegd_op        TEXT,
        status             TEXT NOT NULL DEFAULT 'actief'
      );

      CREATE TABLE testimonials (
        company_id     INTEGER PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
        tekst          TEXT NOT NULL,
        sterren        INTEGER,
        contactpersoon TEXT,
        publiceerbaar  INTEGER NOT NULL DEFAULT 0,
        ontvangen_op   TEXT NOT NULL DEFAULT (date('now')),
        gebruiker_id   INTEGER REFERENCES gebruikers(id) ON DELETE SET NULL
      );
    `,
  },
  {
    naam: '006-leads-view',
    sql: `
      DROP VIEW IF EXISTS leads;
      CREATE VIEW leads AS
      SELECT
        c.id, c.name, c.website, c.domain, c.city, c.province, c.branch,
        c.lat, c.lon, c.phone AS company_phone, c.email AS company_email, c.source,
        s.id AS scan_id, s.scanned_at, s.status AS scan_status,
        s.score, s.grade, s.final_url, s.http_status, s.error, s.report,
        COALESCE(o.fase, 'nieuw')  AS fase,
        o.toegewezen_aan, o.volgende_actie_op, o.notitie AS opvolging_notitie,
        o.bijgewerkt_op AS opvolging_bijgewerkt_op,
        g.naam AS agent_naam,
        k.status AS klant_status, k.maandbedrag_cent, k.gestart_op AS klant_sinds,
        t.sterren AS testimonial_sterren, t.tekst AS testimonial_tekst,
        (SELECT COUNT(*) FROM activiteiten a WHERE a.company_id = c.id) AS activiteiten
      FROM companies c
      LEFT JOIN scans s ON s.id = (
        SELECT id FROM scans WHERE company_id = c.id ORDER BY scanned_at DESC, id DESC LIMIT 1
      )
      LEFT JOIN opvolging o   ON o.company_id = c.id
      LEFT JOIN gebruikers g  ON g.id = o.toegewezen_aan
      LEFT JOIN klanten k     ON k.company_id = c.id
      LEFT JOIN testimonials t ON t.company_id = c.id;
    `,
  },
  {
    naam: '007-opdracht-als-mijlpaal',
    sql: `
      -- "akkoord" heette de fase waarin een bedrijf ja zegt tegen de kosteloze
      -- herbouw. Die stap is de mijlpaal waar alles op stuurt, dus hij heet nu
      -- "opdracht": we hebben de opdracht om te bouwen en te hosten.
      UPDATE opvolging   SET fase = 'opdracht'     WHERE fase = 'akkoord';
      UPDATE activiteiten SET uitkomst = 'opdracht' WHERE soort = 'fase' AND uitkomst = 'akkoord';
    `,
  },
  {
    naam: '008-toewijsdatum-in-view',
    sql: `
      DROP VIEW IF EXISTS leads;
      CREATE VIEW leads AS
      SELECT
        c.id, c.name, c.website, c.domain, c.city, c.province, c.branch,
        c.lat, c.lon, c.phone AS company_phone, c.email AS company_email, c.source,
        s.id AS scan_id, s.scanned_at, s.status AS scan_status,
        s.score, s.grade, s.final_url, s.http_status, s.error, s.report,
        COALESCE(o.fase, 'nieuw')  AS fase,
        o.toegewezen_aan, o.toegewezen_op, o.volgende_actie_op, o.notitie AS opvolging_notitie,
        o.bijgewerkt_op AS opvolging_bijgewerkt_op,
        g.naam AS agent_naam,
        k.status AS klant_status, k.maandbedrag_cent, k.gestart_op AS klant_sinds,
        t.sterren AS testimonial_sterren, t.tekst AS testimonial_tekst,
        (SELECT COUNT(*) FROM activiteiten a WHERE a.company_id = c.id) AS activiteiten
      FROM companies c
      LEFT JOIN scans s ON s.id = (
        SELECT id FROM scans WHERE company_id = c.id ORDER BY scanned_at DESC, id DESC LIMIT 1
      )
      LEFT JOIN opvolging o   ON o.company_id = c.id
      LEFT JOIN gebruikers g  ON g.id = o.toegewezen_aan
      LEFT JOIN klanten k     ON k.company_id = c.id
      LEFT JOIN testimonials t ON t.company_id = c.id;
    `,
  },
];

/** Brengt de database bij naar de nieuwste versie. Veilig om vaak aan te roepen. */
export function migreer(database: DatabaseSync): { uitgevoerd: string[] } {
  const huidig = Number((database.prepare('PRAGMA user_version').get() as { user_version: number }).user_version);
  const uitgevoerd: string[] = [];

  for (let i = huidig; i < MIGRATIES.length; i++) {
    const migratie = MIGRATIES[i]!;
    database.exec('BEGIN');
    try {
      database.exec(migratie.sql);
      database.exec(`PRAGMA user_version = ${i + 1}`);
      database.exec('COMMIT');
      uitgevoerd.push(migratie.naam);
    } catch (fout) {
      database.exec('ROLLBACK');
      throw new Error(`Migratie ${migratie.naam} mislukt: ${(fout as Error).message}`);
    }
  }
  return { uitgevoerd };
}

export const SCHEMA_VERSIE = MIGRATIES.length;
