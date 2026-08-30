-- De boekhoudkundige kern: boekjaren, perioden, rekeningschema, dagboeken,
-- journaalposten en journaalregels, btw-codes, nummerreeksen en valuta.
--
-- Bedragen zijn NUMERIC; de applicatie leest ze als string en zet ze om naar
-- een exacte Money. Zie docs/decision-log.md ADR-006.

CREATE TABLE currency (
  code      text PRIMARY KEY,
  naam      text NOT NULL,
  decimalen integer NOT NULL DEFAULT 2
);

CREATE TABLE exchange_rate (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  van_valuta    text NOT NULL REFERENCES currency(code),
  naar_valuta   text NOT NULL REFERENCES currency(code),
  koersdatum    date NOT NULL,
  koers         numeric(18,8) NOT NULL CHECK (koers > 0),
  bron          text NOT NULL DEFAULT 'handmatig',
  UNIQUE (van_valuta, naar_valuta, koersdatum)
);

CREATE TABLE fiscal_year (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  administration_id uuid NOT NULL REFERENCES administration(id) ON DELETE RESTRICT,
  naam              text NOT NULL,
  begint_op         date NOT NULL,
  eindigt_op        date NOT NULL,
  status            text NOT NULL DEFAULT 'open'
                      CHECK (status IN ('open', 'afsluiten', 'gesloten')),
  aangemaakt_op     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (administration_id, naam),
  CHECK (eindigt_op > begint_op)
);
CREATE INDEX idx_fiscal_year_admin ON fiscal_year (administration_id, begint_op);

CREATE TABLE accounting_period (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  administration_id uuid NOT NULL REFERENCES administration(id) ON DELETE RESTRICT,
  fiscal_year_id    uuid NOT NULL REFERENCES fiscal_year(id) ON DELETE RESTRICT,
  nummer            integer NOT NULL CHECK (nummer BETWEEN 1 AND 24),
  naam              text NOT NULL,
  begint_op         date NOT NULL,
  eindigt_op        date NOT NULL,
  status            text NOT NULL DEFAULT 'open'
                      CHECK (status IN ('open', 'geblokkeerd', 'gesloten')),
  gesloten_op       timestamptz,
  gesloten_door     uuid REFERENCES app_user(id) ON DELETE SET NULL,
  heropen_reden     text,
  UNIQUE (fiscal_year_id, nummer),
  CHECK (eindigt_op >= begint_op)
);
CREATE INDEX idx_period_admin_datum ON accounting_period (administration_id, begint_op, eindigt_op);

CREATE TABLE ledger_account (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  administration_id uuid NOT NULL REFERENCES administration(id) ON DELETE RESTRICT,
  code              text NOT NULL,
  naam              text NOT NULL,
  soort             text NOT NULL CHECK (soort IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
  rubriek           text NOT NULL DEFAULT '',
  -- Systeemrol zoals 'debiteuren' of 'btw_te_vorderen'; hooguit een per administratie.
  rol               text,
  btw_standaard     text,
  rgs_code          text,
  uitleg            text,
  geblokkeerd       boolean NOT NULL DEFAULT false,
  aangemaakt_op     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (administration_id, code)
);
CREATE UNIQUE INDEX idx_ledger_rol ON ledger_account (administration_id, rol) WHERE rol IS NOT NULL;
CREATE INDEX idx_ledger_soort ON ledger_account (administration_id, soort, code);

CREATE TABLE tax_code (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  administration_id uuid NOT NULL REFERENCES administration(id) ON DELETE RESTRICT,
  code              text NOT NULL,
  naam              text NOT NULL,
  soort             text NOT NULL CHECK (soort IN ('verkoop', 'inkoop', 'beide')),
  tarief            numeric(9,6) NOT NULL DEFAULT 0 CHECK (tarief >= 0 AND tarief < 1),
  vak               text,
  verlegd           boolean NOT NULL DEFAULT false,
  ic_levering       boolean NOT NULL DEFAULT false,
  geldig_vanaf      date NOT NULL,
  geldig_tot        date,
  btw_rekening_id   uuid REFERENCES ledger_account(id) ON DELETE RESTRICT,
  UNIQUE (administration_id, code, geldig_vanaf),
  CHECK (geldig_tot IS NULL OR geldig_tot >= geldig_vanaf)
);
CREATE INDEX idx_tax_code_admin ON tax_code (administration_id, code);

CREATE TABLE journal (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  administration_id uuid NOT NULL REFERENCES administration(id) ON DELETE RESTRICT,
  code              text NOT NULL,
  naam              text NOT NULL,
  soort             text NOT NULL CHECK (soort IN ('verkoop', 'inkoop', 'bank', 'kas', 'memoriaal', 'opening')),
  -- Voor bankdagboeken: de gekoppelde grootboekrekening.
  ledger_account_id uuid REFERENCES ledger_account(id) ON DELETE RESTRICT,
  UNIQUE (administration_id, code)
);

-- Nummerreeksen. Uitgifte gebeurt met SELECT ... FOR UPDATE binnen dezelfde
-- transactie als de boeking, zodat er geen gaten of duplicaten ontstaan.
CREATE TABLE number_sequence (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  administration_id uuid NOT NULL REFERENCES administration(id) ON DELETE RESTRICT,
  sleutel           text NOT NULL,
  jaar              integer NOT NULL,
  volgende          bigint NOT NULL DEFAULT 1 CHECK (volgende >= 1),
  patroon           text NOT NULL DEFAULT '{jaar}-{nummer:4}',
  UNIQUE (administration_id, sleutel, jaar)
);

CREATE TABLE journal_entry (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  administration_id uuid NOT NULL REFERENCES administration(id) ON DELETE RESTRICT,
  journal_id        uuid NOT NULL REFERENCES journal(id) ON DELETE RESTRICT,
  period_id         uuid NOT NULL REFERENCES accounting_period(id) ON DELETE RESTRICT,
  postnummer        text,
  boekdatum         date NOT NULL,
  omschrijving      text NOT NULL,
  valuta            text NOT NULL DEFAULT 'EUR',
  status            text NOT NULL DEFAULT 'concept'
                      CHECK (status IN ('concept', 'definitief', 'gestorneerd')),
  totaal_debet      numeric(18,2) NOT NULL DEFAULT 0 CHECK (totaal_debet >= 0),
  totaal_credit     numeric(18,2) NOT NULL DEFAULT 0 CHECK (totaal_credit >= 0),
  bron_soort        text,
  bron_id           uuid,
  storneert_id      uuid REFERENCES journal_entry(id) ON DELETE RESTRICT,
  gestorneerd_door_id uuid REFERENCES journal_entry(id) ON DELETE RESTRICT,
  aangemaakt_op     timestamptz NOT NULL DEFAULT now(),
  aangemaakt_door   uuid REFERENCES app_user(id) ON DELETE SET NULL,
  definitief_op     timestamptz,
  definitief_door   uuid REFERENCES app_user(id) ON DELETE SET NULL,
  versie            integer NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX idx_entry_nummer ON journal_entry (administration_id, journal_id, postnummer)
  WHERE postnummer IS NOT NULL;
CREATE INDEX idx_entry_datum ON journal_entry (administration_id, boekdatum);
CREATE INDEX idx_entry_periode ON journal_entry (administration_id, period_id, status);
CREATE INDEX idx_entry_bron ON journal_entry (administration_id, bron_soort, bron_id);

CREATE TABLE journal_line (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  administration_id uuid NOT NULL REFERENCES administration(id) ON DELETE RESTRICT,
  entry_id          uuid NOT NULL REFERENCES journal_entry(id) ON DELETE CASCADE,
  regelnummer       integer NOT NULL,
  ledger_account_id uuid NOT NULL REFERENCES ledger_account(id) ON DELETE RESTRICT,
  debet             numeric(18,2) NOT NULL DEFAULT 0 CHECK (debet >= 0),
  credit            numeric(18,2) NOT NULL DEFAULT 0 CHECK (credit >= 0),
  omschrijving      text,
  tax_code_id       uuid REFERENCES tax_code(id) ON DELETE RESTRICT,
  btw_grondslag     numeric(18,2),
  contact_id        uuid,
  cost_center_id    uuid,
  -- Vreemde valuta: het origineel blijft bewaard, debet/credit staan altijd in
  -- de valuta van de administratie.
  bedrag_valuta     numeric(18,2),
  valuta            text,
  wisselkoers       numeric(18,8),
  UNIQUE (entry_id, regelnummer),
  -- Invariant I2: precies een van beide kanten heeft een bedrag.
  CONSTRAINT regel_een_kant CHECK ((debet = 0) <> (credit = 0)),
  -- Een btw-code zonder grondslag zou de aangifte laten scheef lopen.
  CONSTRAINT btw_grondslag_verplicht CHECK (tax_code_id IS NULL OR btw_grondslag IS NOT NULL)
);
CREATE INDEX idx_line_rekening ON journal_line (administration_id, ledger_account_id, entry_id);
CREATE INDEX idx_line_entry ON journal_line (entry_id, regelnummer);
CREATE INDEX idx_line_btw ON journal_line (administration_id, tax_code_id) WHERE tax_code_id IS NOT NULL;
CREATE INDEX idx_line_contact ON journal_line (administration_id, contact_id) WHERE contact_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Triggers: de invarianten uit docs/accounting-engine.md, in de database zelf
-- ---------------------------------------------------------------------------

-- I5: een definitieve post is onveranderbaar. De enige toegestane wijziging is
-- de overgang naar 'gestorneerd' met een verwijzing naar de tegenboeking.
CREATE OR REPLACE FUNCTION gedmma.entry_onveranderbaar() RETURNS trigger
  LANGUAGE plpgsql AS $$
  BEGIN
    IF TG_OP = 'DELETE' THEN
      IF OLD.status <> 'concept' THEN
        RAISE EXCEPTION 'Een definitieve boeking kan niet worden verwijderd; maak een tegenboeking.'
          USING ERRCODE = 'raise_exception';
      END IF;
      RETURN OLD;
    END IF;

    IF OLD.status = 'concept' THEN
      RETURN NEW;
    END IF;

    IF OLD.status = 'definitief' AND NEW.status = 'gestorneerd'
       AND NEW.gestorneerd_door_id IS NOT NULL
       AND NEW.administration_id = OLD.administration_id
       AND NEW.journal_id        = OLD.journal_id
       AND NEW.period_id         = OLD.period_id
       AND NEW.boekdatum         = OLD.boekdatum
       AND NEW.totaal_debet      = OLD.totaal_debet
       AND NEW.totaal_credit     = OLD.totaal_credit
       AND NEW.postnummer IS NOT DISTINCT FROM OLD.postnummer THEN
      RETURN NEW;
    END IF;

    RAISE EXCEPTION 'Boeking % is definitief en kan niet worden gewijzigd; corrigeer met een tegenboeking.', OLD.id
      USING ERRCODE = 'raise_exception';
  END;
  $$;

CREATE TRIGGER journal_entry_onveranderbaar
  BEFORE UPDATE OR DELETE ON journal_entry
  FOR EACH ROW EXECUTE FUNCTION gedmma.entry_onveranderbaar();

-- I6: regels van een definitieve post zijn onveranderbaar.
CREATE OR REPLACE FUNCTION gedmma.line_onveranderbaar() RETURNS trigger
  LANGUAGE plpgsql AS $$
  DECLARE
    huidige_status text;
  BEGIN
    SELECT status INTO huidige_status FROM journal_entry
      WHERE id = COALESCE(NEW.entry_id, OLD.entry_id);
    IF huidige_status IS NOT NULL AND huidige_status <> 'concept' THEN
      RAISE EXCEPTION 'De regels van een definitieve boeking kunnen niet worden gewijzigd.'
        USING ERRCODE = 'raise_exception';
    END IF;
    RETURN COALESCE(NEW, OLD);
  END;
  $$;

CREATE TRIGGER journal_line_onveranderbaar
  BEFORE INSERT OR UPDATE OR DELETE ON journal_line
  FOR EACH ROW EXECUTE FUNCTION gedmma.line_onveranderbaar();

-- I1, I3, I7 en I9: bij het definitief maken moet de post kloppen, in balans
-- zijn, minimaal twee regels hebben en in een open periode vallen.
CREATE OR REPLACE FUNCTION gedmma.entry_controleer_definitief() RETURNS trigger
  LANGUAGE plpgsql AS $$
  DECLARE
    som_debet   numeric(18,2);
    som_credit  numeric(18,2);
    aantal      integer;
    periode     record;
  BEGIN
    IF NEW.status <> 'definitief' OR (TG_OP = 'UPDATE' AND OLD.status = 'definitief') THEN
      RETURN NEW;
    END IF;

    SELECT COALESCE(SUM(debet), 0), COALESCE(SUM(credit), 0), COUNT(*)
      INTO som_debet, som_credit, aantal
      FROM journal_line WHERE entry_id = NEW.id;

    IF aantal < 2 THEN
      RAISE EXCEPTION 'Een journaalpost heeft minimaal twee regels (post %).', NEW.id
        USING ERRCODE = 'raise_exception';
    END IF;

    IF som_debet <> som_credit THEN
      RAISE EXCEPTION 'Boeking % is niet in balans: debet % tegenover credit %.', NEW.id, som_debet, som_credit
        USING ERRCODE = 'raise_exception';
    END IF;

    IF som_debet <> NEW.totaal_debet OR som_credit <> NEW.totaal_credit THEN
      RAISE EXCEPTION 'De totalen van boeking % kloppen niet met de regels.', NEW.id
        USING ERRCODE = 'raise_exception';
    END IF;

    SELECT * INTO periode FROM accounting_period WHERE id = NEW.period_id;
    IF periode.status <> 'open' THEN
      RAISE EXCEPTION 'Periode % is % en kan niet worden geboekt.', periode.naam, periode.status
        USING ERRCODE = 'raise_exception';
    END IF;

    IF NEW.boekdatum < periode.begint_op OR NEW.boekdatum > periode.eindigt_op THEN
      RAISE EXCEPTION 'Boekdatum % valt niet in periode % (% t/m %).',
        NEW.boekdatum, periode.naam, periode.begint_op, periode.eindigt_op
        USING ERRCODE = 'raise_exception';
    END IF;

    RETURN NEW;
  END;
  $$;

CREATE TRIGGER journal_entry_controleer
  BEFORE INSERT OR UPDATE ON journal_entry
  FOR EACH ROW EXECUTE FUNCTION gedmma.entry_controleer_definitief();

-- Een regel hoort bij dezelfde administratie als zijn post en zijn rekening (I4).
CREATE OR REPLACE FUNCTION gedmma.line_zelfde_administratie() RETURNS trigger
  LANGUAGE plpgsql AS $$
  DECLARE
    entry_admin   uuid;
    account_admin uuid;
  BEGIN
    SELECT administration_id INTO entry_admin FROM journal_entry WHERE id = NEW.entry_id;
    SELECT administration_id INTO account_admin FROM ledger_account WHERE id = NEW.ledger_account_id;
    IF entry_admin IS DISTINCT FROM NEW.administration_id
       OR account_admin IS DISTINCT FROM NEW.administration_id THEN
      RAISE EXCEPTION 'Een journaalregel mag niet over administraties heen wijzen.'
        USING ERRCODE = 'raise_exception';
    END IF;
    RETURN NEW;
  END;
  $$;

CREATE TRIGGER journal_line_zelfde_administratie
  BEFORE INSERT OR UPDATE ON journal_line
  FOR EACH ROW EXECUTE FUNCTION gedmma.line_zelfde_administratie();

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO {{APP_ROLE}};
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO {{APP_ROLE}};
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA gedmma TO {{APP_ROLE}};
REVOKE UPDATE, DELETE ON audit_event FROM {{APP_ROLE}};
