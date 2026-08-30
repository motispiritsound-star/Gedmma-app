-- Fundament: gebruikers, sessies, organisaties, administraties, rollen en audit.
--
-- Regel voor de hele monorepo: een migratie wordt nooit gewijzigd nadat hij is
-- gedraaid. Een correctie is een nieuwe migratie. Zo lopen databases in het veld
-- niet uit de pas.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

-- Hulpfuncties die de row-level security-policies gebruiken. Ze staan in het
-- schema `gedmma` zodat ze niet met tabelnamen kunnen botsen.
CREATE SCHEMA IF NOT EXISTS gedmma;

CREATE OR REPLACE FUNCTION gedmma.huidige_administratie() RETURNS uuid
  LANGUAGE sql STABLE AS $$
    SELECT NULLIF(current_setting('gedmma.administratie_id', true), '')::uuid
  $$;

CREATE OR REPLACE FUNCTION gedmma.huidige_organisatie() RETURNS uuid
  LANGUAGE sql STABLE AS $$
    SELECT NULLIF(current_setting('gedmma.organisatie_id', true), '')::uuid
  $$;

CREATE OR REPLACE FUNCTION gedmma.huidige_gebruiker() RETURNS uuid
  LANGUAGE sql STABLE AS $$
    SELECT NULLIF(current_setting('gedmma.gebruiker_id', true), '')::uuid
  $$;

-- ---------------------------------------------------------------------------
-- Gebruikers en aanmelden
-- ---------------------------------------------------------------------------

CREATE TABLE app_user (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email             citext NOT NULL UNIQUE,
  email_bevestigd   boolean NOT NULL DEFAULT false,
  naam              text NOT NULL,
  wachtwoord_hash   text NOT NULL,
  locale            text NOT NULL DEFAULT 'nl',
  status            text NOT NULL DEFAULT 'actief'
                      CHECK (status IN ('actief', 'geblokkeerd', 'verwijderd')),
  mfa_verplicht     boolean NOT NULL DEFAULT false,
  laatste_login_op  timestamptz,
  mislukte_pogingen integer NOT NULL DEFAULT 0,
  geblokkeerd_tot   timestamptz,
  aangemaakt_op     timestamptz NOT NULL DEFAULT now(),
  gewijzigd_op      timestamptz NOT NULL DEFAULT now(),
  verwijderd_op     timestamptz
);

-- Tweede factoren en toekomstige passkeys. Het geheim is versleuteld opgeslagen.
CREATE TABLE user_credential (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  soort           text NOT NULL CHECK (soort IN ('totp', 'herstelcode', 'passkey')),
  label           text,
  geheim          text NOT NULL,
  bevestigd_op    timestamptz,
  gebruikt_op     timestamptz,
  aangemaakt_op   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_credential_user ON user_credential (user_id, soort);

CREATE TABLE session (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  token_hash        text NOT NULL UNIQUE,
  mfa_voldaan       boolean NOT NULL DEFAULT false,
  ip_hash           text,
  user_agent        text,
  aangemaakt_op     timestamptz NOT NULL DEFAULT now(),
  laatst_gezien_op  timestamptz NOT NULL DEFAULT now(),
  verloopt_op       timestamptz NOT NULL,
  ingetrokken_op    timestamptz,
  vervangt_sessie   uuid REFERENCES session(id) ON DELETE SET NULL,
  -- Impersonatie door support: wie is de echte persoon achter deze sessie.
  support_user_id   uuid REFERENCES app_user(id) ON DELETE SET NULL,
  support_reden     text,
  support_tot       timestamptz
);
CREATE INDEX idx_session_user ON session (user_id, verloopt_op DESC);

-- ---------------------------------------------------------------------------
-- Organisaties en administraties
-- ---------------------------------------------------------------------------

CREATE TABLE organization (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  naam            text NOT NULL,
  kvk_nummer      text,
  land            text NOT NULL DEFAULT 'NL',
  abonnement      text NOT NULL DEFAULT 'starter'
                    CHECK (abonnement IN ('starter', 'zzp', 'mkb', 'professional', 'accountant', 'enterprise')),
  status          text NOT NULL DEFAULT 'actief'
                    CHECK (status IN ('proef', 'actief', 'opgezegd', 'alleen_lezen')),
  -- Grens van het abonnement; null betekent onbeperkt.
  max_administraties integer,
  max_gebruikers     integer,
  max_opslag_bytes   bigint,
  aangemaakt_op   timestamptz NOT NULL DEFAULT now(),
  gewijzigd_op    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE administration (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     uuid NOT NULL REFERENCES organization(id) ON DELETE RESTRICT,
  naam                text NOT NULL,
  rechtsvorm          text NOT NULL DEFAULT 'eenmanszaak',
  kvk_nummer          text,
  btw_nummer          text,
  adres               text,
  postcode_plaats     text,
  land                text NOT NULL DEFAULT 'NL',
  email               text,
  telefoon            text,
  iban                text,
  valuta              text NOT NULL DEFAULT 'EUR',
  schema_sjabloon     text NOT NULL DEFAULT 'zzp',
  locale              text NOT NULL DEFAULT 'nl',
  -- Alles tot en met deze datum is geblokkeerd voor boekingen.
  geblokkeerd_tot     date,
  betalingsverschil_tolerantie numeric(18,2) NOT NULL DEFAULT 0.02,
  logo_document_id    uuid,
  huisstijl_kleur     text,
  factuur_voettekst   text,
  ai_ingeschakeld     boolean NOT NULL DEFAULT false,
  status              text NOT NULL DEFAULT 'actief'
                        CHECK (status IN ('actief', 'alleen_lezen', 'gearchiveerd')),
  aangemaakt_op       timestamptz NOT NULL DEFAULT now(),
  gewijzigd_op        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, naam)
);
CREATE INDEX idx_administration_org ON administration (organization_id);

-- ---------------------------------------------------------------------------
-- Rollen en rechten
-- ---------------------------------------------------------------------------

CREATE TABLE permission (
  sleutel     text PRIMARY KEY,
  omschrijving text NOT NULL,
  -- Rechten die functiescheiding of extra logging vereisen.
  kritiek     boolean NOT NULL DEFAULT false
);

CREATE TABLE role (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sleutel         text NOT NULL,
  naam            text NOT NULL,
  omschrijving    text NOT NULL DEFAULT '',
  -- Ingebouwde rollen horen bij geen enkele organisatie en zijn onwijzigbaar.
  organization_id uuid REFERENCES organization(id) ON DELETE CASCADE,
  ingebouwd       boolean NOT NULL DEFAULT false,
  UNIQUE (organization_id, sleutel)
);
CREATE UNIQUE INDEX idx_role_ingebouwd ON role (sleutel) WHERE organization_id IS NULL;

CREATE TABLE role_permission (
  role_id           uuid NOT NULL REFERENCES role(id) ON DELETE CASCADE,
  permission_sleutel text NOT NULL REFERENCES permission(sleutel) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_sleutel)
);

CREATE TABLE membership (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  role_id         uuid NOT NULL REFERENCES role(id) ON DELETE RESTRICT,
  status          text NOT NULL DEFAULT 'actief'
                    CHECK (status IN ('uitgenodigd', 'actief', 'geschorst')),
  uitgenodigd_door uuid REFERENCES app_user(id) ON DELETE SET NULL,
  uitnodiging_hash text,
  uitnodiging_tot  timestamptz,
  aangemaakt_op   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, organization_id)
);

-- Optionele beperking tot bepaalde administraties. Geen rij betekent: alle
-- administraties van de organisatie, met de rol van het lidmaatschap.
CREATE TABLE administration_access (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id     uuid NOT NULL REFERENCES membership(id) ON DELETE CASCADE,
  administration_id uuid NOT NULL REFERENCES administration(id) ON DELETE CASCADE,
  role_id           uuid REFERENCES role(id) ON DELETE RESTRICT,
  geldig_tot        timestamptz,
  aangemaakt_op     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (membership_id, administration_id)
);

-- ---------------------------------------------------------------------------
-- Audit trail met hash-ketting
-- ---------------------------------------------------------------------------

CREATE TABLE audit_event (
  id                bigserial PRIMARY KEY,
  administration_id uuid REFERENCES administration(id) ON DELETE RESTRICT,
  organization_id   uuid REFERENCES organization(id) ON DELETE RESTRICT,
  op                timestamptz NOT NULL DEFAULT now(),
  actor_user_id     uuid REFERENCES app_user(id) ON DELETE SET NULL,
  actor_soort       text NOT NULL DEFAULT 'gebruiker'
                      CHECK (actor_soort IN ('gebruiker', 'support', 'systeem', 'api')),
  actie             text NOT NULL,
  onderwerp_soort   text,
  onderwerp_id      text,
  gegevens          jsonb NOT NULL DEFAULT '{}'::jsonb,
  request_id        text,
  ip_hash           text,
  vorige_hash       text,
  hash              text NOT NULL
);
CREATE INDEX idx_audit_admin ON audit_event (administration_id, op DESC);
CREATE INDEX idx_audit_onderwerp ON audit_event (administration_id, onderwerp_soort, onderwerp_id);
CREATE INDEX idx_audit_actie ON audit_event (actie, op DESC);

-- Auditregels zijn append-only. De trigger is de tweede grendel naast het
-- ontbreken van UPDATE/DELETE-rechten voor de applicatierol.
CREATE OR REPLACE FUNCTION gedmma.audit_alleen_toevoegen() RETURNS trigger
  LANGUAGE plpgsql AS $$
  BEGIN
    RAISE EXCEPTION 'Auditregels kunnen niet worden gewijzigd of verwijderd (poging: %)', TG_OP
      USING ERRCODE = 'raise_exception';
  END;
  $$;

CREATE TRIGGER audit_event_onveranderbaar
  BEFORE UPDATE OR DELETE ON audit_event
  FOR EACH ROW EXECUTE FUNCTION gedmma.audit_alleen_toevoegen();

-- ---------------------------------------------------------------------------
-- Rechten voor de applicatierol
-- ---------------------------------------------------------------------------

GRANT USAGE ON SCHEMA public, gedmma TO {{APP_ROLE}};
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO {{APP_ROLE}};
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO {{APP_ROLE}};
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA gedmma TO {{APP_ROLE}};

-- De applicatie mag auditregels toevoegen en lezen, maar niet wijzigen.
REVOKE UPDATE, DELETE ON audit_event FROM {{APP_ROLE}};

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO {{APP_ROLE}};
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO {{APP_ROLE}};
