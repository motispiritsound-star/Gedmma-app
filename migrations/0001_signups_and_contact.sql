-- The two things the website itself has to remember before the marketplace
-- exists: who wants to be told when it opens, and who wrote in.
--
-- Applied with:  npx wrangler d1 migrations apply buurklus --remote

CREATE TABLE IF NOT EXISTS signups (
  id              TEXT PRIMARY KEY,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL,
  role            TEXT NOT NULL,
  email           TEXT NOT NULL,
  name            TEXT,
  phone           TEXT,
  city_slug       TEXT,
  category_slugs  TEXT,
  kvk             TEXT,
  locale          TEXT,
  -- Article 7(1) asks you to be able to show that consent was given. These
  -- three columns are that proof: when, from where, and to which wording.
  consent_at      TEXT NOT NULL,
  consent_ip      TEXT,
  consent_version TEXT NOT NULL,
  unsubscribed_at TEXT
);

-- One row per address. A second sign-up updates the first rather than
-- creating a duplicate somebody would later have to unsubscribe twice.
CREATE UNIQUE INDEX IF NOT EXISTS signups_email_idx ON signups (email);
CREATE INDEX IF NOT EXISTS signups_created_idx ON signups (created_at);

CREATE TABLE IF NOT EXISTS contact_messages (
  id         TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  message    TEXT NOT NULL,
  locale     TEXT,
  ip         TEXT,
  -- Set when the message has been answered. The retention clock in
  -- packages/shared/src/legal.ts runs from this moment, not from arrival.
  handled_at TEXT
);

CREATE INDEX IF NOT EXISTS contact_created_idx ON contact_messages (created_at);
