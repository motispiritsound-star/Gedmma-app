-- Projecten en urenregistratie.
--
-- Uren zijn geen boekhouding: een geschreven uur raakt het grootboek niet. Pas
-- als een uur op een factuur belandt, ontstaat er een boeking, en dat gebeurt
-- via de gewone factuurweg. Daarom staat hier geen enkel bedrag dat los van een
-- factuur zou kunnen gaan zweven; een uur draagt zijn tarief mee, en de factuur
-- rekent daar exact mee.
--
-- Wat hier wel wordt afgedwongen:
--   * een uur hoort bij precies een administratie en bij precies een dag;
--   * een gefactureerd uur is niet meer te wijzigen of te verwijderen;
--   * dezelfde uren kunnen nooit twee keer op een factuur komen.

CREATE TABLE project (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  administration_id uuid NOT NULL REFERENCES administration(id) ON DELETE RESTRICT,
  contact_id        uuid REFERENCES contact(id) ON DELETE RESTRICT,
  code              text,
  naam              text NOT NULL,
  omschrijving      text,
  status            text NOT NULL DEFAULT 'actief'
                      CHECK (status IN ('actief', 'op_pauze', 'afgerond', 'gearchiveerd')),
  -- Hoe er wordt gefactureerd. 'niet' is bewust een keuze en geen leegte:
  -- intern werk hoort ook geschreven te kunnen worden.
  facturatie        text NOT NULL DEFAULT 'uurtarief'
                      CHECK (facturatie IN ('uurtarief', 'vaste_prijs', 'niet')),
  uurtarief         numeric(18,2),
  vaste_prijs       numeric(18,2),
  -- Urenbudget in minuten; minuten omdat een uur nooit in een float hoort.
  budget_minuten    integer CHECK (budget_minuten IS NULL OR budget_minuten >= 0),
  begint_op         date,
  eindigt_op        date,
  tax_code_id       uuid REFERENCES tax_code(id) ON DELETE RESTRICT,
  ledger_account_id uuid REFERENCES ledger_account(id) ON DELETE RESTRICT,
  valuta            text NOT NULL DEFAULT 'EUR',
  aangemaakt_op     timestamptz NOT NULL DEFAULT now(),
  aangemaakt_door   uuid REFERENCES app_user(id) ON DELETE SET NULL,
  gewijzigd_op      timestamptz NOT NULL DEFAULT now(),
  versie            integer NOT NULL DEFAULT 1,
  UNIQUE (administration_id, code)
);
CREATE INDEX idx_project_naam ON project (administration_id, naam);
CREATE INDEX idx_project_contact ON project (administration_id, contact_id);
CREATE INDEX idx_project_status ON project (administration_id, status);

-- Activiteiten binnen een project: ontwerp, overleg, reistijd. Optioneel; een
-- project zonder activiteiten werkt gewoon.
CREATE TABLE project_activity (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  administration_id uuid NOT NULL REFERENCES administration(id) ON DELETE RESTRICT,
  project_id        uuid NOT NULL REFERENCES project(id) ON DELETE CASCADE,
  naam              text NOT NULL,
  uurtarief         numeric(18,2),
  factureerbaar     boolean NOT NULL DEFAULT true,
  status            text NOT NULL DEFAULT 'actief' CHECK (status IN ('actief', 'gearchiveerd')),
  aangemaakt_op     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, naam)
);
CREATE INDEX idx_activity_project ON project_activity (administration_id, project_id);

CREATE TABLE time_entry (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  administration_id uuid NOT NULL REFERENCES administration(id) ON DELETE RESTRICT,
  project_id        uuid NOT NULL REFERENCES project(id) ON DELETE RESTRICT,
  activity_id       uuid REFERENCES project_activity(id) ON DELETE SET NULL,
  user_id           uuid NOT NULL REFERENCES app_user(id) ON DELETE RESTRICT,
  datum             date NOT NULL,
  -- Minuten, geheel. Een kwartier is 15, geen 0,25 dat later een cent scheelt.
  minuten           integer NOT NULL CHECK (minuten > 0 AND minuten <= 1440),
  omschrijving      text NOT NULL,
  factureerbaar     boolean NOT NULL DEFAULT true,
  -- Het tarief zoals het gold toen het uur werd geschreven. Een latere
  -- tariefwijziging verandert oude uren dus niet met terugwerkende kracht.
  uurtarief         numeric(18,2),
  status            text NOT NULL DEFAULT 'concept'
                      CHECK (status IN ('concept', 'ingediend', 'goedgekeurd', 'afgekeurd', 'gefactureerd')),
  goedgekeurd_door  uuid REFERENCES app_user(id) ON DELETE SET NULL,
  goedgekeurd_op    timestamptz,
  afkeurreden       text,
  sales_invoice_id  uuid REFERENCES sales_invoice(id) ON DELETE RESTRICT,
  sales_invoice_line_id uuid REFERENCES sales_invoice_line(id) ON DELETE SET NULL,
  gefactureerd_op   timestamptz,
  aangemaakt_op     timestamptz NOT NULL DEFAULT now(),
  gewijzigd_op      timestamptz NOT NULL DEFAULT now(),
  versie            integer NOT NULL DEFAULT 1,
  -- Een gefactureerd uur wijst altijd naar zijn factuur, en andersom hoort een
  -- uur met een factuur ook de status gefactureerd te hebben.
  CONSTRAINT gefactureerd_heeft_factuur
    CHECK ((status = 'gefactureerd') = (sales_invoice_id IS NOT NULL))
);
CREATE INDEX idx_time_project ON time_entry (administration_id, project_id, datum DESC);
CREATE INDEX idx_time_gebruiker ON time_entry (administration_id, user_id, datum DESC);
CREATE INDEX idx_time_status ON time_entry (administration_id, status, datum DESC);
CREATE INDEX idx_time_factuur ON time_entry (administration_id, sales_invoice_id)
  WHERE sales_invoice_id IS NOT NULL;

-- Een gefactureerd uur is vastgelegd bewijs onder een factuur; wijzigen of
-- weggooien mag daarna niet meer. Wie zich vergist, crediteert de factuur.
CREATE OR REPLACE FUNCTION gedmma.uur_is_vast() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.status = 'gefactureerd' THEN
      RAISE EXCEPTION 'Een gefactureerd uur kan niet worden verwijderd. Crediteer de factuur.'
        USING ERRCODE = 'restrict_violation';
    END IF;
    RETURN OLD;
  END IF;

  IF OLD.status = 'gefactureerd'
     AND (NEW.minuten IS DISTINCT FROM OLD.minuten
          OR NEW.datum IS DISTINCT FROM OLD.datum
          OR NEW.project_id IS DISTINCT FROM OLD.project_id
          OR NEW.uurtarief IS DISTINCT FROM OLD.uurtarief
          OR NEW.omschrijving IS DISTINCT FROM OLD.omschrijving) THEN
    RAISE EXCEPTION 'Een gefactureerd uur kan niet meer worden gewijzigd. Crediteer de factuur.'
      USING ERRCODE = 'restrict_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER uur_is_vast
  BEFORE UPDATE OR DELETE ON time_entry
  FOR EACH ROW EXECUTE FUNCTION gedmma.uur_is_vast();

-- Row-level security. Migratie 005 liep over de tabellen die er toen waren;
-- nieuwe tabellen zetten hun eigen grendel. De metatest in
-- test/tenant-isolatie.test.ts controleert dat dit niet wordt vergeten.
DO $$
DECLARE
  tabel text;
BEGIN
  FOREACH tabel IN ARRAY ARRAY['project', 'project_activity', 'time_entry'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tabel);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', tabel);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolatie ON public.%I', tabel);
    EXECUTE format($p$
      CREATE POLICY tenant_isolatie ON public.%I
        USING (administration_id = gedmma.huidige_administratie())
        WITH CHECK (administration_id = gedmma.huidige_administratie())
    $p$, tabel);
  END LOOP;
END $$;

-- Alleen de nieuwe tabellen krijgen rechten. Een brede GRANT op ALL TABLES zou
-- de applicatierol ook weer UPDATE en DELETE op audit_event geven, en dat is nu
-- juist wat een auditspoor waardeloos maakt. De metatest in
-- test/tenant-isolatie.test.ts vangt die fout, maar hij hoort hier niet gemaakt
-- te worden.
GRANT SELECT, INSERT, UPDATE, DELETE ON project, project_activity, time_entry TO {{APP_ROLE}};
GRANT EXECUTE ON FUNCTION gedmma.uur_is_vast() TO {{APP_ROLE}};

-- Vangnet, gelijk aan de eerdere migraties: het auditspoor blijft append-only.
REVOKE UPDATE, DELETE ON audit_event FROM {{APP_ROLE}};

COMMENT ON TABLE time_entry IS
  'Geschreven uren. Minuten als geheel getal; het uurtarief wordt vastgelegd zoals het gold op het moment van schrijven.';
