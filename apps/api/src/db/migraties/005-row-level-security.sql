-- Row-level security: de tweede grendel op tenantisolatie.
--
-- Elke tabel met een administration_id krijgt hier een policy. De applicatierol
-- heeft geen BYPASSRLS en is niet de eigenaar van de tabellen; FORCE ROW LEVEL
-- SECURITY zorgt dat ook de eigenaar aan de policy gebonden is.
--
-- Zonder tenantcontext levert elke query nul rijen op. De faalstand is dus
-- "niets zien", niet "alles zien". Zie docs/security.md.

DO $$
DECLARE
  tabel text;
BEGIN
  FOR tabel IN
    SELECT c.relname
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      JOIN pg_attribute a ON a.attrelid = c.oid
     WHERE n.nspname = 'public'
       AND c.relkind = 'r'
       AND a.attname = 'administration_id'
       AND NOT a.attisdropped
     ORDER BY c.relname
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tabel);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', tabel);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolatie ON public.%I', tabel);
    -- audit_event mag door de systeemcontext zonder administratie worden
    -- geschreven (bijvoorbeeld bij inloggen); daarom is NULL daar toegestaan.
    IF tabel = 'audit_event' THEN
      EXECUTE format($p$
        CREATE POLICY tenant_isolatie ON public.%I
          USING (administration_id IS NULL
                 OR administration_id = gedmma.huidige_administratie())
          WITH CHECK (administration_id IS NULL
                 OR administration_id = gedmma.huidige_administratie())
      $p$, tabel);
    ELSIF tabel = 'job' OR tabel = 'idempotency_key' THEN
      -- Taken en idempotentie kunnen ook buiten een administratie bestaan.
      EXECUTE format($p$
        CREATE POLICY tenant_isolatie ON public.%I
          USING (administration_id IS NULL
                 OR administration_id = gedmma.huidige_administratie())
          WITH CHECK (administration_id IS NULL
                 OR administration_id = gedmma.huidige_administratie())
      $p$, tabel);
    ELSIF tabel = 'privacy_request' OR tabel = 'retention_policy' THEN
      -- Privacyverzoeken hangen aan de organisatie; de administratie is optioneel.
      EXECUTE format($p$
        CREATE POLICY tenant_isolatie ON public.%I
          USING (organization_id = gedmma.huidige_organisatie())
          WITH CHECK (organization_id = gedmma.huidige_organisatie())
      $p$, tabel);
    ELSE
      EXECUTE format($p$
        CREATE POLICY tenant_isolatie ON public.%I
          USING (administration_id = gedmma.huidige_administratie())
          WITH CHECK (administration_id = gedmma.huidige_administratie())
      $p$, tabel);
    END IF;
  END LOOP;
END $$;

-- De administratie zelf is ook tenantgebonden: je ziet alleen de administratie
-- die actief is, of alle administraties van je organisatie.
ALTER TABLE administration ENABLE ROW LEVEL SECURITY;
ALTER TABLE administration FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolatie ON administration;
CREATE POLICY tenant_isolatie ON administration
  USING (
    organization_id = gedmma.huidige_organisatie()
    OR id = gedmma.huidige_administratie()
  )
  WITH CHECK (organization_id = gedmma.huidige_organisatie());

ALTER TABLE organization ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolatie ON organization;
CREATE POLICY tenant_isolatie ON organization
  USING (id = gedmma.huidige_organisatie())
  WITH CHECK (id = gedmma.huidige_organisatie());

-- Lidmaatschappen en toegangsregels horen bij een organisatie.
ALTER TABLE membership ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolatie ON membership;
CREATE POLICY tenant_isolatie ON membership
  USING (organization_id = gedmma.huidige_organisatie())
  WITH CHECK (organization_id = gedmma.huidige_organisatie());

ALTER TABLE processing_agreement ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_agreement FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolatie ON processing_agreement;
CREATE POLICY tenant_isolatie ON processing_agreement
  USING (organization_id = gedmma.huidige_organisatie())
  WITH CHECK (organization_id = gedmma.huidige_organisatie());

-- Tabellen die bewust niet tenantgebonden zijn en dus geen policy krijgen:
--   app_user, user_credential, session  -> horen bij een persoon, niet bij een tenant
--   role, permission, role_permission   -> rollen zijn deels ingebouwd
--   currency, exchange_rate             -> gedeelde referentiegegevens
--   rate_limit                          -> technisch
--   security_incident, consent          -> op organisatieniveau, apart afgeschermd
--   administration_access               -> afgeleid van membership
-- De metatest in apps/api/test/tenant-isolatie.test.ts controleert dat deze
-- lijst compleet is: elke nieuwe tabel met administration_id moet een policy
-- hebben, anders faalt de build.

COMMENT ON SCHEMA gedmma IS
  'Hulpfuncties voor row-level security. huidige_administratie() en huidige_organisatie() lezen de transactie-lokale sessiecontext die inTransactie() zet.';
