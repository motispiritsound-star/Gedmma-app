-- Een uitnodiging accepteren gebeurt door iemand die nog geen lid is van de
-- organisatie. Zonder aanpassing zou row-level security dat lidmaatschap voor
-- hem verbergen, waardoor de uitnodiging niet te accepteren is.
--
-- De oplossing is bewust smal: je ziet een lidmaatschap alleen als je de hash
-- van het uitnodigingstoken al hebt. Dat token staat alleen in de e-mail aan de
-- genodigde. Er ontstaat dus geen bredere toegang; wie het token niet heeft,
-- ziet niets.

DROP POLICY IF EXISTS tenant_isolatie ON membership;
CREATE POLICY tenant_isolatie ON membership
  USING (
    organization_id = gedmma.huidige_organisatie()
    OR user_id = gedmma.huidige_gebruiker()
    OR (
      uitnodiging_hash IS NOT NULL
      AND uitnodiging_hash = NULLIF(current_setting('gedmma.uitnodiging_hash', true), '')
    )
  )
  WITH CHECK (
    organization_id = gedmma.huidige_organisatie()
    OR (
      uitnodiging_hash IS NOT NULL
      AND uitnodiging_hash = NULLIF(current_setting('gedmma.uitnodiging_hash', true), '')
    )
  );
