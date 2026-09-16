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
