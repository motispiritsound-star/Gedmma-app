-- Betalingsherinneringen.
--
-- Elke verstuurde herinnering wordt vastgelegd, niet alleen de laatste. Dat is
-- geen boekhouding maar bewijsvoering: komt het ooit tot een incassotraject,
-- dan is de vraag "wanneer heb je aangemaand en waarheen" het eerste dat
-- gesteld wordt. Een teller die op 3 staat beantwoordt die vraag niet.
--
-- De regels zijn onveranderlijk, net als het auditspoor: een verstuurd bericht
-- kun je niet terughalen, dus kun je de vastlegging ervan ook niet bijstellen.

CREATE TABLE payment_reminder (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  administration_id uuid NOT NULL REFERENCES administration(id) ON DELETE RESTRICT,
  invoice_id        uuid NOT NULL REFERENCES sales_invoice(id) ON DELETE RESTRICT,

  -- Het hoeveelste bericht over deze factuur: 1 is de vriendelijke herinnering,
  -- 3 en verder zijn aanmaningen. Bepaalt de toon van de tekst.
  ronde             integer NOT NULL CHECK (ronde >= 1),

  -- Hoeveel dagen de factuur te laat was op het moment van versturen. Bewaard
  -- als getal en niet herleid uit de datums, omdat een latere wijziging van de
  -- vervaldatum niet met terugwerkende kracht mag veranderen wat er in het
  -- bericht stond.
  dagen_te_laat     integer NOT NULL,

  -- Het openstaande bedrag op dat moment, om dezelfde reden.
  openstaand_bedrag numeric(18,2) NOT NULL CHECK (openstaand_bedrag > 0),
  valuta            char(3) NOT NULL,

  verzonden_naar    text NOT NULL,
  onderwerp         text NOT NULL,
  tekst             text NOT NULL,

  verzonden_op      timestamptz NOT NULL DEFAULT now(),
  verzonden_door    uuid REFERENCES app_user(id) ON DELETE SET NULL,

  -- 'handmatig' als iemand op de knop drukte, 'automatisch' als een schema het
  -- deed. Dat schema bestaat nog niet, maar het onderscheid moet vanaf de
  -- eerste regel in de gegevens zitten: achteraf is niet meer te achterhalen
  -- wie wat verstuurde.
  aanleiding        text NOT NULL DEFAULT 'handmatig'
                      CHECK (aanleiding IN ('handmatig', 'automatisch'))
);

CREATE INDEX idx_herinnering_factuur ON payment_reminder (invoice_id, verzonden_op DESC);
CREATE INDEX idx_herinnering_administratie ON payment_reminder (administration_id, verzonden_op DESC);

-- Eén ronde per factuur: twee keer op de knop drukken levert geen twee
-- identieke berichten met hetzelfde nummer op.
CREATE UNIQUE INDEX idx_herinnering_ronde ON payment_reminder (invoice_id, ronde);

ALTER TABLE payment_reminder ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_reminder FORCE ROW LEVEL SECURITY;

CREATE POLICY herinnering_eigen_administratie ON payment_reminder
  USING (administration_id = mizen.huidige_administratie())
  WITH CHECK (administration_id = mizen.huidige_administratie());

GRANT SELECT, INSERT ON payment_reminder TO mizen_app;

-- Onveranderlijk, om dezelfde reden als het auditspoor.
REVOKE UPDATE, DELETE ON payment_reminder FROM mizen_app;

CREATE OR REPLACE FUNCTION mizen.herinnering_is_vast() RETURNS trigger
  LANGUAGE plpgsql AS $$
  BEGIN
    RAISE EXCEPTION 'Een verstuurde herinnering kan niet worden gewijzigd of verwijderd.';
  END;
  $$;

CREATE TRIGGER herinnering_onveranderlijk
  BEFORE UPDATE OR DELETE ON payment_reminder
  FOR EACH ROW EXECUTE FUNCTION mizen.herinnering_is_vast();
