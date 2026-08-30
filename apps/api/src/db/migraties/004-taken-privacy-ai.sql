-- Achtergrondtaken, idempotentie, AI-voorstellen, privacyverzoeken, bewaarbeleid
-- en het incidentregister.

-- Taken staan in dezelfde database als de boekingen, zodat een taak in dezelfde
-- transactie als een boeking kan worden ingepland. Zie docs/decision-log.md ADR-005.
CREATE TABLE job (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  administration_id uuid REFERENCES administration(id) ON DELETE CASCADE,
  soort             text NOT NULL,
  payload           jsonb NOT NULL DEFAULT '{}'::jsonb,
  status            text NOT NULL DEFAULT 'wachtend'
                      CHECK (status IN ('wachtend', 'bezig', 'klaar', 'mislukt', 'dood')),
  pogingen          integer NOT NULL DEFAULT 0,
  max_pogingen      integer NOT NULL DEFAULT 5,
  draaien_na        timestamptz NOT NULL DEFAULT now(),
  begonnen_op       timestamptz,
  klaar_op          timestamptz,
  laatste_fout      text,
  aangemaakt_op     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_job_wachtrij ON job (status, draaien_na) WHERE status IN ('wachtend', 'mislukt');

-- Idempotency keys: dezelfde sleutel met dezelfde inhoud levert het bewaarde
-- antwoord terug in plaats van een tweede boeking.
CREATE TABLE idempotency_key (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  administration_id uuid REFERENCES administration(id) ON DELETE CASCADE,
  user_id           uuid REFERENCES app_user(id) ON DELETE CASCADE,
  sleutel           text NOT NULL,
  verzoek_hash      text NOT NULL,
  status_code       integer,
  antwoord          jsonb,
  aangemaakt_op     timestamptz NOT NULL DEFAULT now(),
  verloopt_op       timestamptz NOT NULL DEFAULT now() + interval '24 hours',
  UNIQUE (administration_id, sleutel)
);
CREATE INDEX idx_idem_verval ON idempotency_key (verloopt_op);

-- Elk AI-voorstel wordt volledig geregistreerd: wat erin ging, welk model,
-- welke motivatie, en wat de mens ermee deed. Zie docs/ai-governance.md.
CREATE TABLE ai_proposal (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  administration_id uuid NOT NULL REFERENCES administration(id) ON DELETE RESTRICT,
  onderwerp_soort   text NOT NULL,
  onderwerp_id      uuid,
  provider          text NOT NULL,
  model             text NOT NULL,
  modelversie       text,
  invoer_digest     text NOT NULL,
  invoer_velden     jsonb NOT NULL DEFAULT '{}'::jsonb,
  uitkomst          jsonb NOT NULL DEFAULT '{}'::jsonb,
  betrouwbaarheid   numeric(5,4) CHECK (betrouwbaarheid IS NULL OR (betrouwbaarheid >= 0 AND betrouwbaarheid <= 1)),
  motivatie         text NOT NULL DEFAULT '',
  status            text NOT NULL DEFAULT 'open'
                      CHECK (status IN ('open', 'geaccepteerd', 'afgewezen', 'gecorrigeerd')),
  besloten_door     uuid REFERENCES app_user(id) ON DELETE SET NULL,
  besloten_op       timestamptz,
  correctie         jsonb,
  aangemaakt_op     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ai_onderwerp ON ai_proposal (administration_id, onderwerp_soort, onderwerp_id);
CREATE INDEX idx_ai_status ON ai_proposal (administration_id, status, aangemaakt_op DESC);

-- Verzoeken van betrokkenen onder de AVG.
CREATE TABLE privacy_request (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid REFERENCES organization(id) ON DELETE RESTRICT,
  administration_id uuid REFERENCES administration(id) ON DELETE RESTRICT,
  soort             text NOT NULL CHECK (soort IN (
                      'inzage', 'rectificatie', 'wissing', 'beperking', 'overdraagbaarheid',
                      'bezwaar', 'intrekken_toestemming', 'geautomatiseerde_besluitvorming', 'klacht')),
  betrokkene_naam   text NOT NULL,
  betrokkene_contact text,
  omschrijving      text NOT NULL DEFAULT '',
  status            text NOT NULL DEFAULT 'ontvangen'
                      CHECK (status IN ('ontvangen', 'identiteit_controle', 'in_behandeling',
                                        'deels_afgewezen', 'afgewezen', 'uitgevoerd', 'afgesloten')),
  identiteit_vastgesteld_op timestamptz,
  wettelijke_termijn_tot date NOT NULL,
  motivering        text,
  toegewezen_aan    uuid REFERENCES app_user(id) ON DELETE SET NULL,
  aangemaakt_op     timestamptz NOT NULL DEFAULT now(),
  afgesloten_op     timestamptz
);
CREATE INDEX idx_privacy_status ON privacy_request (organization_id, status, wettelijke_termijn_tot);

-- Bewaartermijnen per soort gegeven; instelbaar per organisatie en administratie.
CREATE TABLE retention_policy (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid REFERENCES organization(id) ON DELETE CASCADE,
  administration_id uuid REFERENCES administration(id) ON DELETE CASCADE,
  categorie         text NOT NULL,
  bewaartermijn_maanden integer NOT NULL CHECK (bewaartermijn_maanden > 0),
  grondslag         text NOT NULL,
  bron              text,
  actie_na_afloop   text NOT NULL DEFAULT 'verwijderen'
                      CHECK (actie_na_afloop IN ('verwijderen', 'pseudonimiseren', 'archiveren')),
  aangemaakt_op     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_retention_scope ON retention_policy (organization_id, administration_id, categorie);

-- Incident- en datalekregister.
CREATE TABLE security_incident (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid REFERENCES organization(id) ON DELETE RESTRICT,
  ontdekt_op        timestamptz NOT NULL,
  ontdekt_door      text NOT NULL,
  aard              text NOT NULL,
  getroffen_systemen text,
  gegevenscategorieen text,
  aantal_betrokkenen integer,
  vermoedelijke_oorzaak text,
  genomen_maatregelen text,
  risico_inschatting text,
  eigenaar          uuid REFERENCES app_user(id) ON DELETE SET NULL,
  gemeld_aan_ap     boolean NOT NULL DEFAULT false,
  gemeld_aan_ap_op  timestamptz,
  betrokkenen_geinformeerd boolean NOT NULL DEFAULT false,
  status            text NOT NULL DEFAULT 'open'
                      CHECK (status IN ('open', 'onderzoek', 'beheerst', 'afgesloten')),
  geleerde_lessen   text,
  aangemaakt_op     timestamptz NOT NULL DEFAULT now(),
  afgesloten_op     timestamptz
);

-- Verwerkersovereenkomst per organisatie: welke versie is wanneer aanvaard.
CREATE TABLE processing_agreement (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  versie            text NOT NULL,
  aanvaard_op       timestamptz NOT NULL DEFAULT now(),
  aanvaard_door     uuid REFERENCES app_user(id) ON DELETE SET NULL,
  tekenbevoegde     text,
  datalocatie       text NOT NULL DEFAULT 'EER',
  aanvullende_instructies text,
  UNIQUE (organization_id, versie)
);

-- Toestemmingen: cookies, AI, marketing. Standaard staat alles uit.
CREATE TABLE consent (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES app_user(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES organization(id) ON DELETE CASCADE,
  doel            text NOT NULL,
  gegeven         boolean NOT NULL DEFAULT false,
  bron            text NOT NULL DEFAULT 'instellingen',
  gegeven_op      timestamptz,
  ingetrokken_op  timestamptz,
  bewijs          jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (user_id, organization_id, doel)
);

-- Beperking van het aantal pogingen, per sleutel (IP, account, endpoint).
CREATE TABLE rate_limit (
  sleutel     text PRIMARY KEY,
  teller      integer NOT NULL DEFAULT 0,
  venster_tot timestamptz NOT NULL
);

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO {{APP_ROLE}};
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO {{APP_ROLE}};
REVOKE UPDATE, DELETE ON audit_event FROM {{APP_ROLE}};
