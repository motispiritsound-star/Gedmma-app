-- Aanscherping van de policies voor toegang.
--
-- Een gebruiker moet twee dingen kunnen zonder dat er al een organisatie of
-- administratie is gekozen:
--   1. zien bij welke organisaties hij hoort (om te kunnen kiezen);
--   2. een nieuwe organisatie aanmaken.
--
-- Punt 1 lossen we op met een policy die ook de eigen lidmaatschappen toont.
-- Punt 2 vraagt geen uitzondering: de applicatie genereert het id van de nieuwe
-- organisatie zelf, zet dat als tenantcontext en voegt daarna pas in. Daardoor
-- klopt de policy ook bij het aanmaken, en blijft er geen gat open staan.

DROP POLICY IF EXISTS tenant_isolatie ON membership;
CREATE POLICY tenant_isolatie ON membership
  USING (
    organization_id = gedmma.huidige_organisatie()
    OR user_id = gedmma.huidige_gebruiker()
  )
  WITH CHECK (organization_id = gedmma.huidige_organisatie());

DROP POLICY IF EXISTS tenant_isolatie ON organization;
CREATE POLICY tenant_isolatie ON organization
  USING (
    id = gedmma.huidige_organisatie()
    OR EXISTS (
      SELECT 1 FROM membership m
       WHERE m.organization_id = organization.id
         AND m.user_id = gedmma.huidige_gebruiker()
         AND m.status = 'actief'
    )
  )
  WITH CHECK (id = gedmma.huidige_organisatie());

DROP POLICY IF EXISTS tenant_isolatie ON administration;
CREATE POLICY tenant_isolatie ON administration
  USING (
    organization_id = gedmma.huidige_organisatie()
    OR id = gedmma.huidige_administratie()
    OR EXISTS (
      SELECT 1 FROM membership m
       WHERE m.organization_id = administration.organization_id
         AND m.user_id = gedmma.huidige_gebruiker()
         AND m.status = 'actief'
    )
  )
  WITH CHECK (organization_id = gedmma.huidige_organisatie());

-- administration_access hangt aan een lidmaatschap; je mag je eigen toegang zien.
DROP POLICY IF EXISTS tenant_isolatie ON administration_access;
CREATE POLICY tenant_isolatie ON administration_access
  USING (
    administration_id = gedmma.huidige_administratie()
    OR EXISTS (
      SELECT 1 FROM membership m
       WHERE m.id = administration_access.membership_id
         AND (m.organization_id = gedmma.huidige_organisatie()
              OR m.user_id = gedmma.huidige_gebruiker())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM membership m
       WHERE m.id = administration_access.membership_id
         AND m.organization_id = gedmma.huidige_organisatie()
    )
  );
