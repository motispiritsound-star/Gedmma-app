-- The list, and nothing more than the list.
--
-- One row per e-mail address. No child's name, no answers, no device id: the
-- app is used by children and what leaves a child's phone should be countable
-- on one hand. What is here is a grown-up's address, what they agreed to, and
-- when — because under the GDPR "they said yes" is something you have to be
-- able to show, not just claim.

CREATE TABLE IF NOT EXISTS aanmelding (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  taal          TEXT NOT NULL,

  -- Two separate yesses. Bundling them would make neither of them consent.
  nieuws        INTEGER NOT NULL DEFAULT 0,
  voortgang     INTEGER NOT NULL DEFAULT 0,

  -- 'wacht' until the address is confirmed by clicking the link we mail.
  status        TEXT NOT NULL DEFAULT 'wacht',
  token         TEXT NOT NULL,

  -- The proof: when, from roughly where, and under which wording.
  aangemeld_op      INTEGER NOT NULL,
  bevestigd_op      INTEGER,
  uitgeschreven_op  INTEGER,
  ip_hash           TEXT,
  tekst_versie      TEXT NOT NULL,

  laatste_mail  INTEGER
);

CREATE INDEX IF NOT EXISTS aanmelding_token ON aanmelding (token);
CREATE INDEX IF NOT EXISTS aanmelding_status ON aanmelding (status, nieuws, voortgang);

-- The newest snapshot per subscriber, overwritten each time. Counts only:
-- enough to write "twelve days in a row" and nothing that says who.
CREATE TABLE IF NOT EXISTS voortgang (
  id          TEXT PRIMARY KEY REFERENCES aanmelding(id) ON DELETE CASCADE,
  bijgewerkt  INTEGER NOT NULL,
  units       INTEGER NOT NULL DEFAULT 0,
  lessen      INTEGER NOT NULL DEFAULT 0,
  woorden     INTEGER NOT NULL DEFAULT 0,
  reeks       INTEGER NOT NULL DEFAULT 0,
  xp          INTEGER NOT NULL DEFAULT 0,
  -- What the last weekly mail reported, so the next one can say what changed
  -- instead of repeating itself.
  vorige_xp   INTEGER NOT NULL DEFAULT 0
);

-- ---------------------------------------------------------------- de lezer
--
-- Wie een reeks koopt, krijgt een persoonlijke sleutel en leest de boeken op
-- de website. Geen account en geen wachtwoord: de sleutel ís de toegang.
--
-- Dat is met opzet. Een wachtwoord is iets wat je kwijtraakt, iets wat je
-- opnieuw moet kunnen instellen, en iets wat wij dan moeten bewaren en
-- beschermen. Een link in je mail is er altijd nog, en als hij toch
-- rondzwerft kun je hem intrekken en een nieuwe geven — dat kan met een
-- wachtwoord niet zonder de klant lastig te vallen.
--
-- De sleutel zelf staat hier niet in. Alleen zijn hash, net als bij een
-- wachtwoord: als deze tabel ooit uitlekt, lekken de boeken niet mee.

CREATE TABLE IF NOT EXISTS bestelling (
  id            TEXT PRIMARY KEY,
  -- SHA-256 van de sleutel uit de link. Hier staat nooit de sleutel zelf.
  sleutel_hash  TEXT NOT NULL UNIQUE,
  email         TEXT NOT NULL,
  -- 'sba', 'sleutels', of allebei met een komma ertussen.
  reeksen       TEXT NOT NULL,
  taal          TEXT NOT NULL DEFAULT 'nl',
  -- Wat de koper op elke bladzijde ziet staan: zijn eigen naam en bestelnummer.
  merk          TEXT NOT NULL DEFAULT '',
  -- Het ordernummer bij de betaalpartner, om een klacht te kunnen terugvinden.
  bestelnummer  TEXT,

  gekocht_op    INTEGER NOT NULL,
  -- Gezet als de sleutel is ingetrokken; dan werkt hij niet meer.
  ingetrokken   INTEGER,
  reden         TEXT
);

CREATE INDEX IF NOT EXISTS bestelling_email ON bestelling (email);

-- Hoe vaak en vanaf hoeveel verschillende plekken een sleutel wordt gebruikt.
--
-- Niet om te controleren wie wat leest: er staat geen ip in, alleen een hash
-- ervan, en geen bladzijde. Het is er voor één vraag: gaat deze sleutel rond?
-- Eén gezin leest vanaf twee of drie plekken. Veertig is iets anders.
CREATE TABLE IF NOT EXISTS opening (
  bestelling_id TEXT NOT NULL REFERENCES bestelling(id) ON DELETE CASCADE,
  dag           TEXT NOT NULL,
  ip_hash       TEXT NOT NULL,
  aantal        INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (bestelling_id, dag, ip_hash)
);

-- ------------------------------------------------------------- het portaal
--
-- Eén adres, en alles wat daarbij hoort. De nieuwsbrieflijst en de
-- bestellingen stonden los van elkaar: twee tabellen die toevallig hetzelfde
-- e-mailadres bevatten. Dit is de derde tafel waar ze beide aan zitten.
--
-- Bij elk vinkje staat wanneer het is gezet en onder welke versie van de
-- tekst. "Ze hebben ja gezegd" is onder de AVG iets wat je moet kunnen laten
-- zien en niet alleen beweren.

CREATE TABLE IF NOT EXISTS lid (
  id              TEXT PRIMARY KEY,
  email           TEXT NOT NULL UNIQUE,
  taal            TEXT NOT NULL DEFAULT 'nl',

  -- De twee verplichte vinkjes bij het aanmaken, met het moment erbij.
  voorwaarden_op  INTEGER NOT NULL,
  leeftijd_op     INTEGER NOT NULL,

  -- En de vrijwillige. Los van de rest, anders is het geen toestemming.
  nieuws          INTEGER NOT NULL DEFAULT 0,
  nieuws_op       INTEGER,

  tekst_versie    TEXT NOT NULL,
  ip_hash         TEXT,
  aangemaakt_op   INTEGER NOT NULL,
  laatste_bezoek  INTEGER,
  -- Gezet als iemand vergeten wil worden; dan komt hij nergens meer binnen.
  gewist_op       INTEGER
);

CREATE INDEX IF NOT EXISTS lid_nieuws ON lid (nieuws, gewist_op);

-- Inloglinks en sessies in één tabel: allebei een sleutel met een houdbaarheid.
-- De sleutel zelf staat er nooit in, alleen zijn hash — lekt deze tabel, dan
-- lekt er geen toegang mee.
CREATE TABLE IF NOT EXISTS sessie (
  token_hash   TEXT PRIMARY KEY,
  lid_id       TEXT NOT NULL REFERENCES lid(id) ON DELETE CASCADE,
  -- 'link' is eenmalig en een half uur geldig; 'sessie' is negentig dagen.
  soort        TEXT NOT NULL,
  gemaakt_op   INTEGER NOT NULL,
  verloopt_op  INTEGER NOT NULL,
  gebruikt_op  INTEGER
);

CREATE INDEX IF NOT EXISTS sessie_lid ON sessie (lid_id, soort, gemaakt_op);
