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
  {
    naam: '009-benaderregels',
    sql: `
      -- Sinds 1 juli 2026 mag je zzp'ers, eenmanszaken, vof's, maatschappen en
      -- cv's alleen nog bellen met aantoonbare voorafgaande toestemming. De
      -- rechtsvorm bepaalt dus of bellen mag; die houden we per bedrijf bij.
      ALTER TABLE companies ADD COLUMN rechtsvorm TEXT;

      CREATE TABLE benaderregels (
        company_id           INTEGER PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
        -- Toestemming om te bellen. De bewijslast ligt bij ons, dus we leggen
        -- vast wanneer, hoe en met welke woorden die gegeven is.
        bel_toestemming      INTEGER NOT NULL DEFAULT 0,
        toestemming_op       TEXT,
        toestemming_via      TEXT,
        toestemming_bewijs   TEXT,
        toestemming_door     INTEGER REFERENCES gebruikers(id) ON DELETE SET NULL,
        -- Wie zegt "haal me van je lijst" wordt door niemand meer benaderd.
        geblokkeerd          INTEGER NOT NULL DEFAULT 0,
        geblokkeerd_op       TEXT,
        geblokkeerd_reden    TEXT,
        geblokkeerd_door     INTEGER REFERENCES gebruikers(id) ON DELETE SET NULL
      );
      CREATE INDEX idx_benaderregels_geblokkeerd ON benaderregels(geblokkeerd);
    `,
  },
  {
    naam: '010-benaderregels-in-view',
    sql: `
      DROP VIEW IF EXISTS leads;
      CREATE VIEW leads AS
      SELECT
        c.id, c.name, c.website, c.domain, c.city, c.province, c.branch, c.rechtsvorm,
        c.lat, c.lon, c.phone AS company_phone, c.email AS company_email, c.source,
        s.id AS scan_id, s.scanned_at, s.status AS scan_status,
        s.score, s.grade, s.final_url, s.http_status, s.error, s.report,
        COALESCE(o.fase, 'nieuw')  AS fase,
        o.toegewezen_aan, o.toegewezen_op, o.volgende_actie_op, o.notitie AS opvolging_notitie,
        o.bijgewerkt_op AS opvolging_bijgewerkt_op,
        g.naam AS agent_naam,
        COALESCE(b.bel_toestemming, 0) AS bel_toestemming,
        b.toestemming_op, b.toestemming_via,
        COALESCE(b.geblokkeerd, 0) AS geblokkeerd, b.geblokkeerd_reden,
        k.status AS klant_status, k.maandbedrag_cent, k.gestart_op AS klant_sinds,
        t.sterren AS testimonial_sterren, t.tekst AS testimonial_tekst,
        (SELECT COUNT(*) FROM activiteiten a WHERE a.company_id = c.id) AS activiteiten
      FROM companies c
      LEFT JOIN scans s ON s.id = (
        SELECT id FROM scans WHERE company_id = c.id ORDER BY scanned_at DESC, id DESC LIMIT 1
      )
      LEFT JOIN opvolging o     ON o.company_id = c.id
      LEFT JOIN gebruikers g    ON g.id = o.toegewezen_aan
      LEFT JOIN benaderregels b ON b.company_id = c.id
      LEFT JOIN klanten k       ON k.company_id = c.id
      LEFT JOIN testimonials t  ON t.company_id = c.id;
    `,
  },
  {
    naam: '011-levenstekenen',
    sql: `
      -- Hoe actief het bedrijf oogt, en hoe interessant het daarmee is om te
      -- benaderen. Losse kolommen zodat je erop kunt sorteren en filteren.
      ALTER TABLE scans ADD COLUMN leven INTEGER;
      ALTER TABLE scans ADD COLUMN prioriteit INTEGER;
      CREATE INDEX IF NOT EXISTS idx_scans_prioriteit ON scans(prioriteit DESC);

      DROP VIEW IF EXISTS leads;
      CREATE VIEW leads AS
      SELECT
        c.id, c.name, c.website, c.domain, c.city, c.province, c.branch, c.rechtsvorm,
        c.lat, c.lon, c.phone AS company_phone, c.email AS company_email, c.source,
        s.id AS scan_id, s.scanned_at, s.status AS scan_status,
        s.score, s.grade, s.leven, s.prioriteit, s.final_url, s.http_status, s.error, s.report,
        COALESCE(o.fase, 'nieuw')  AS fase,
        o.toegewezen_aan, o.toegewezen_op, o.volgende_actie_op, o.notitie AS opvolging_notitie,
        o.bijgewerkt_op AS opvolging_bijgewerkt_op,
        g.naam AS agent_naam,
        COALESCE(b.bel_toestemming, 0) AS bel_toestemming,
        b.toestemming_op, b.toestemming_via,
        COALESCE(b.geblokkeerd, 0) AS geblokkeerd, b.geblokkeerd_reden,
        k.status AS klant_status, k.maandbedrag_cent, k.gestart_op AS klant_sinds,
        t.sterren AS testimonial_sterren, t.tekst AS testimonial_tekst,
        (SELECT COUNT(*) FROM activiteiten a WHERE a.company_id = c.id) AS activiteiten
      FROM companies c
      LEFT JOIN scans s ON s.id = (
        SELECT id FROM scans WHERE company_id = c.id ORDER BY scanned_at DESC, id DESC LIMIT 1
      )
      LEFT JOIN opvolging o     ON o.company_id = c.id
      LEFT JOIN gebruikers g    ON g.id = o.toegewezen_aan
      LEFT JOIN benaderregels b ON b.company_id = c.id
      LEFT JOIN klanten k       ON k.company_id = c.id
      LEFT JOIN testimonials t  ON t.company_id = c.id;
    `,
  },
  {
    naam: '012-instellingen',
    sql: `
      -- Wat je precies aanbiedt staat niet vast in de code: het bepaalt je
      -- marge en je geloofwaardigheid, en dat wil je kunnen bijstellen zonder
      -- dertien mailteksten te herschrijven.
      CREATE TABLE instellingen (
        sleutel       TEXT PRIMARY KEY,
        waarde        TEXT NOT NULL,
        bijgewerkt_op TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `,
  },
  {
    naam: '013-vorige-scan-in-view',
    sql: `
      DROP VIEW IF EXISTS leads;
      CREATE VIEW leads AS
      SELECT
        c.id, c.name, c.website, c.domain, c.city, c.province, c.branch, c.rechtsvorm,
        c.lat, c.lon, c.phone AS company_phone, c.email AS company_email, c.source,
        s.id AS scan_id, s.scanned_at, s.status AS scan_status,
        s.score, s.grade, s.leven, s.prioriteit, s.final_url, s.http_status, s.error, s.report,
        -- De scan daarvoor, zodat je ziet wat er veranderd is.
        (SELECT v.score FROM scans v WHERE v.company_id = c.id
           ORDER BY v.scanned_at DESC, v.id DESC LIMIT 1 OFFSET 1) AS vorige_score,
        (SELECT v.scanned_at FROM scans v WHERE v.company_id = c.id
           ORDER BY v.scanned_at DESC, v.id DESC LIMIT 1 OFFSET 1) AS vorige_scan_op,
        COALESCE(o.fase, 'nieuw')  AS fase,
        o.toegewezen_aan, o.toegewezen_op, o.volgende_actie_op, o.notitie AS opvolging_notitie,
        o.bijgewerkt_op AS opvolging_bijgewerkt_op,
        g.naam AS agent_naam,
        COALESCE(b.bel_toestemming, 0) AS bel_toestemming,
        b.toestemming_op, b.toestemming_via,
        COALESCE(b.geblokkeerd, 0) AS geblokkeerd, b.geblokkeerd_reden,
        k.status AS klant_status, k.maandbedrag_cent, k.gestart_op AS klant_sinds,
        t.sterren AS testimonial_sterren, t.tekst AS testimonial_tekst,
        (SELECT COUNT(*) FROM activiteiten a WHERE a.company_id = c.id) AS activiteiten
      FROM companies c
      LEFT JOIN scans s ON s.id = (
        SELECT id FROM scans WHERE company_id = c.id ORDER BY scanned_at DESC, id DESC LIMIT 1
      )
      LEFT JOIN opvolging o     ON o.company_id = c.id
      LEFT JOIN gebruikers g    ON g.id = o.toegewezen_aan
      LEFT JOIN benaderregels b ON b.company_id = c.id
      LEFT JOIN klanten k       ON k.company_id = c.id
      LEFT JOIN testimonials t  ON t.company_id = c.id;
    `,
  },
  {
    naam: '014-huidige-stand-op-het-bedrijf',
    sql: `
      -- De view zocht per bedrijf met subquery's op welke scan de laatste was.
      -- Dat is prima bij honderden bedrijven en onwerkbaar bij tienduizenden:
      -- ook een LIMIT 100 moest dan eerst elke rij uitrekenen. De huidige stand
      -- staat nu als kolommen op het bedrijf zelf; scans blijven de volledige
      -- geschiedenis. saveScan houdt beide bij.
      ALTER TABLE companies ADD COLUMN laatste_scan_id INTEGER REFERENCES scans(id) ON DELETE SET NULL;
      ALTER TABLE companies ADD COLUMN score          INTEGER;
      ALTER TABLE companies ADD COLUMN grade          TEXT;
      ALTER TABLE companies ADD COLUMN leven          INTEGER;
      ALTER TABLE companies ADD COLUMN prioriteit     INTEGER;
      ALTER TABLE companies ADD COLUMN scan_status    TEXT;
      ALTER TABLE companies ADD COLUMN gescand_op     TEXT;
      ALTER TABLE companies ADD COLUMN vorige_score   INTEGER;
      ALTER TABLE companies ADD COLUMN vorige_scan_op TEXT;
      -- Of er contactgegevens gevonden zijn: anders moest voor het tellen elk
      -- rapport uit de database gelezen en ontleed worden.
      ALTER TABLE companies ADD COLUMN heeft_telefoon INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE companies ADD COLUMN heeft_email    INTEGER NOT NULL DEFAULT 0;

      -- Bestaande databases bijwerken met wat er al aan scans in staat.
      UPDATE companies SET laatste_scan_id = (
        SELECT id FROM scans WHERE company_id = companies.id ORDER BY scanned_at DESC, id DESC LIMIT 1
      );
      UPDATE companies SET
        score       = (SELECT score FROM scans WHERE id = companies.laatste_scan_id),
        grade       = (SELECT grade FROM scans WHERE id = companies.laatste_scan_id),
        leven       = (SELECT leven FROM scans WHERE id = companies.laatste_scan_id),
        prioriteit  = (SELECT prioriteit FROM scans WHERE id = companies.laatste_scan_id),
        scan_status = (SELECT status FROM scans WHERE id = companies.laatste_scan_id),
        gescand_op  = (SELECT scanned_at FROM scans WHERE id = companies.laatste_scan_id),
        vorige_score = (SELECT score FROM scans WHERE company_id = companies.id
                          ORDER BY scanned_at DESC, id DESC LIMIT 1 OFFSET 1),
        vorige_scan_op = (SELECT scanned_at FROM scans WHERE company_id = companies.id
                          ORDER BY scanned_at DESC, id DESC LIMIT 1 OFFSET 1)
      WHERE laatste_scan_id IS NOT NULL;

      UPDATE companies SET
        heeft_telefoon = CASE WHEN phone IS NOT NULL AND phone <> '' THEN 1 ELSE 0 END,
        heeft_email    = CASE WHEN email IS NOT NULL AND email <> '' THEN 1 ELSE 0 END;

      CREATE INDEX idx_companies_prioriteit ON companies(prioriteit DESC, score ASC);
      CREATE INDEX idx_companies_score      ON companies(score);
      CREATE INDEX idx_companies_plaats     ON companies(city);
      CREATE INDEX idx_companies_gescand    ON companies(gescand_op);
      CREATE INDEX idx_companies_contact    ON companies(heeft_telefoon, heeft_email);

      DROP VIEW IF EXISTS leads;
      CREATE VIEW leads AS
      SELECT
        c.id, c.name, c.website, c.domain, c.city, c.province, c.branch, c.rechtsvorm,
        c.lat, c.lon, c.phone AS company_phone, c.email AS company_email, c.source,
        c.laatste_scan_id AS scan_id, c.gescand_op AS scanned_at, c.scan_status,
        c.score, c.grade, c.leven, c.prioriteit,
        c.vorige_score, c.vorige_scan_op, c.heeft_telefoon, c.heeft_email,
        s.final_url, s.http_status, s.error, s.report,
        COALESCE(o.fase, 'nieuw')  AS fase,
        o.toegewezen_aan, o.toegewezen_op, o.volgende_actie_op, o.notitie AS opvolging_notitie,
        o.bijgewerkt_op AS opvolging_bijgewerkt_op,
        g.naam AS agent_naam,
        COALESCE(b.bel_toestemming, 0) AS bel_toestemming,
        b.toestemming_op, b.toestemming_via,
        COALESCE(b.geblokkeerd, 0) AS geblokkeerd, b.geblokkeerd_reden,
        k.status AS klant_status, k.maandbedrag_cent, k.gestart_op AS klant_sinds,
        t.sterren AS testimonial_sterren, t.tekst AS testimonial_tekst
      FROM companies c
      LEFT JOIN scans s         ON s.id = c.laatste_scan_id
      LEFT JOIN opvolging o     ON o.company_id = c.id
      LEFT JOIN gebruikers g    ON g.id = o.toegewezen_aan
      LEFT JOIN benaderregels b ON b.company_id = c.id
      LEFT JOIN klanten k       ON k.company_id = c.id
      LEFT JOIN testimonials t  ON t.company_id = c.id;

      /* Een lichte variant zonder het rapport: voor lijsten, tellingen en de
         kaart hoef je die kilobytes aan JSON niet uit de database te halen. */
      DROP VIEW IF EXISTS leads_kort;
      CREATE VIEW leads_kort AS
      SELECT
        c.id, c.name, c.domain, c.city, c.branch, c.rechtsvorm, c.lat, c.lon, c.source,
        c.gescand_op AS scanned_at, c.scan_status, c.score, c.grade, c.leven, c.prioriteit,
        c.vorige_score, c.vorige_scan_op, c.heeft_telefoon, c.heeft_email,
        COALESCE(o.fase, 'nieuw') AS fase, o.toegewezen_aan, o.volgende_actie_op,
        g.naam AS agent_naam,
        COALESCE(b.bel_toestemming, 0) AS bel_toestemming,
        COALESCE(b.geblokkeerd, 0) AS geblokkeerd,
        k.status AS klant_status
      FROM companies c
      LEFT JOIN opvolging o     ON o.company_id = c.id
      LEFT JOIN gebruikers g    ON g.id = o.toegewezen_aan
      LEFT JOIN benaderregels b ON b.company_id = c.id
      LEFT JOIN klanten k       ON k.company_id = c.id;
    `,
  },
  {
    naam: '015-lijstvelden-op-het-bedrijf',
    sql: `
      -- Wat de lijst en de export tonen komt uit het rapport, dat een paar
      -- kilobyte JSON per bedrijf is. Voor honderd regels betekende dat honderd
      -- keer JSON ontleden; voor een export over tienduizenden bedrijven werd
      -- het onwerkbaar. Deze drie afgeleide velden worden bij elke scan bijgewerkt.
      ALTER TABLE companies ADD COLUMN top_problemen    TEXT;
      ALTER TABLE companies ADD COLUMN contact_telefoon TEXT;
      ALTER TABLE companies ADD COLUMN contact_email    TEXT;

      DROP VIEW IF EXISTS leads_kort;
      CREATE VIEW leads_kort AS
      SELECT
        c.id, c.name, c.domain, c.city, c.branch, c.rechtsvorm, c.lat, c.lon, c.source,
        c.gescand_op AS scanned_at, c.scan_status, c.score, c.grade, c.leven, c.prioriteit,
        c.vorige_score, c.vorige_scan_op, c.heeft_telefoon, c.heeft_email,
        c.top_problemen, c.contact_telefoon, c.contact_email,
        c.phone AS company_phone, c.email AS company_email,
        COALESCE(o.fase, 'nieuw') AS fase, o.toegewezen_aan, o.toegewezen_op, o.volgende_actie_op,
        g.naam AS agent_naam,
        COALESCE(b.bel_toestemming, 0) AS bel_toestemming,
        COALESCE(b.geblokkeerd, 0) AS geblokkeerd,
        k.status AS klant_status, k.maandbedrag_cent
      FROM companies c
      LEFT JOIN opvolging o     ON o.company_id = c.id
      LEFT JOIN gebruikers g    ON g.id = o.toegewezen_aan
      LEFT JOIN benaderregels b ON b.company_id = c.id
      LEFT JOIN klanten k       ON k.company_id = c.id;
    `,
  },

  {
    naam: '016-nieuws-voor-het-team',
    sql: `
      -- Een prikbord voor het team: aankondigingen, wat er goed gaat en wat er
      -- verandert. De eigenaar plaatst, iedereen leest, en wie het gelezen heeft
      -- wordt onthouden zodat de teller alleen ongelezen berichten telt.
      CREATE TABLE nieuws (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        titel       TEXT NOT NULL,
        tekst       TEXT NOT NULL,
        soort       TEXT NOT NULL DEFAULT 'bericht',
        vastgezet   INTEGER NOT NULL DEFAULT 0,
        door_id     INTEGER REFERENCES gebruikers(id),
        gemaakt_op  TEXT NOT NULL DEFAULT (datetime('now')),
        verwijderd  INTEGER NOT NULL DEFAULT 0
      );
      CREATE INDEX idx_nieuws_datum ON nieuws (verwijderd, vastgezet DESC, gemaakt_op DESC);

      CREATE TABLE nieuws_gelezen (
        nieuws_id    INTEGER NOT NULL REFERENCES nieuws(id) ON DELETE CASCADE,
        gebruiker_id INTEGER NOT NULL REFERENCES gebruikers(id) ON DELETE CASCADE,
        gelezen_op   TEXT NOT NULL DEFAULT (datetime('now')),
        PRIMARY KEY (nieuws_id, gebruiker_id)
      );
    `,
  },

  {
    naam: '017-kvk-nummer-in-de-leadweergave',
    sql: `
      -- Het KVK-nummer stond al op het bedrijf, maar niet in de weergave die het
      -- dashboard leest. Sinds je de rechtsvorm bij de KVK kunt ophalen is het
      -- nummer zichtbaar bewijs dat dat gelukt is.
      DROP VIEW IF EXISTS leads;
      CREATE VIEW leads AS
      SELECT
        c.id, c.name, c.website, c.domain, c.city, c.province, c.branch, c.rechtsvorm,
        c.kvk_number,
        c.lat, c.lon, c.phone AS company_phone, c.email AS company_email, c.source,
        c.laatste_scan_id AS scan_id, c.gescand_op AS scanned_at, c.scan_status,
        c.score, c.grade, c.leven, c.prioriteit,
        c.vorige_score, c.vorige_scan_op, c.heeft_telefoon, c.heeft_email,
        s.final_url, s.http_status, s.error, s.report,
        COALESCE(o.fase, 'nieuw')  AS fase,
        o.toegewezen_aan, o.toegewezen_op, o.volgende_actie_op, o.notitie AS opvolging_notitie,
        o.bijgewerkt_op AS opvolging_bijgewerkt_op,
        g.naam AS agent_naam,
        COALESCE(b.bel_toestemming, 0) AS bel_toestemming,
        b.toestemming_op, b.toestemming_via,
        COALESCE(b.geblokkeerd, 0) AS geblokkeerd, b.geblokkeerd_reden,
        k.status AS klant_status, k.maandbedrag_cent, k.gestart_op AS klant_sinds,
        t.sterren AS testimonial_sterren, t.tekst AS testimonial_tekst
      FROM companies c
      LEFT JOIN scans s         ON s.id = c.laatste_scan_id
      LEFT JOIN opvolging o     ON o.company_id = c.id
      LEFT JOIN gebruikers g    ON g.id = o.toegewezen_aan
      LEFT JOIN benaderregels b ON b.company_id = c.id
      LEFT JOIN klanten k       ON k.company_id = c.id
      LEFT JOIN testimonials t  ON t.company_id = c.id;
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
