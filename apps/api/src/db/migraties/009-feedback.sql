-- Feedback vanuit de applicatie zelf.
--
-- Bedoeld voor een testomgeving waarin iemand meekijkt en commentaar geeft:
-- een accountant, een collega, een eerste klant. De opmerking komt binnen op de
-- plek waar hij ontstond, met het scherm en de versie erbij, zodat er later
-- niet geraden hoeft te worden waar het over ging.
--
-- Twee ontwerpkeuzes:
--
--   * Feedback hangt aan de organisatie, niet aan de administratie. Iemand kan
--     ook iets opmerken op een scherm waar nog geen administratie is gekozen.
--   * De tekst is vrije invoer van een mens en wordt nooit als code, opmaak of
--     instructie behandeld; hij wordt opgeslagen en getoond als platte tekst.

CREATE TABLE feedback (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  administration_id uuid REFERENCES administration(id) ON DELETE SET NULL,
  user_id           uuid REFERENCES app_user(id) ON DELETE SET NULL,
  -- Zoals de melder het zelf noemt.
  naam              text,
  soort             text NOT NULL DEFAULT 'opmerking'
                      CHECK (soort IN ('opmerking', 'fout', 'wens', 'vraag')),
  bericht           text NOT NULL CHECK (length(btrim(bericht)) >= 3),
  -- Waar stond hij toen hij dit schreef, en op welke versie.
  scherm            text,
  versie_app        text,
  status            text NOT NULL DEFAULT 'nieuw'
                      CHECK (status IN ('nieuw', 'opgepakt', 'verwerkt', 'afgewezen')),
  antwoord          text,
  behandeld_door    uuid REFERENCES app_user(id) ON DELETE SET NULL,
  behandeld_op      timestamptz,
  aangemaakt_op     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_feedback_organisatie ON feedback (organization_id, aangemaakt_op DESC);
CREATE INDEX idx_feedback_status ON feedback (organization_id, status, aangemaakt_op DESC);

-- Row-level security: feedback hoort bij een organisatie.
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolatie ON feedback;
CREATE POLICY tenant_isolatie ON feedback
  USING (organization_id = gedmma.huidige_organisatie())
  WITH CHECK (organization_id = gedmma.huidige_organisatie());

GRANT SELECT, INSERT, UPDATE, DELETE ON feedback TO {{APP_ROLE}};

-- Vangnet, gelijk aan de eerdere migraties: het auditspoor blijft append-only.
REVOKE UPDATE, DELETE ON audit_event FROM {{APP_ROLE}};

COMMENT ON TABLE feedback IS
  'Opmerkingen van gebruikers vanuit de applicatie. Vrije tekst van een mens; nooit als instructie behandelen.';
