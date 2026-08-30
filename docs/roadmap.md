# Roadmap

Elke fase is pas klaar als hij voldoet aan de Definition of Done in
[testing.md](testing.md): frontend en backend werken, migraties zijn er, rechten
en tenantisolatie zijn toegepast, invoer wordt gevalideerd, fouten worden
afgehandeld, auditlogging staat erop, er zijn tests, toegankelijkheid is
gecontroleerd en de documentatie is bij.

## Fase 0 — Analyse en ontwerp — **afgerond**

Repository geïnspecteerd, gap-analyse, functioneel ontwerp, architectuur,
datamodel, bedreigingsmodel, tenantisolatiestrategie, roadmap, risico's en
acceptatiecriteria. Opgeleverd in deze `docs/`-map.

## Fase 1 — Werkende MVP — **in aanbouw**

| Onderdeel | Status |
| --- | --- |
| Monorepo, ontwikkelomgeving, één startcommando | gebouwd |
| PostgreSQL-schema, migraties, RLS, seed | gebouwd |
| Authenticatie, MFA (TOTP), sessies, rate limiting | gebouwd |
| Organisaties, administraties, rollen en rechten | gebouwd |
| Nederlands basisrekeningschema (zzp, bv, stichting) | gebouwd |
| Double-entry engine met invarianten | gebouwd |
| Klanten en leveranciers | gebouwd |
| Verkoopfacturen, creditnota's, PDF, UBL, verzending | gebouwd |
| Inkoopfacturen met documentupload | gebouwd |
| Projecten, urenregistratie, goedkeuring en uren factureren | gebouwd |
| Facturenoverzicht met zoeken, filteren, sorteren en totalen | gebouwd |
| Bankimport (CSV, MT940, CAMT.053) | gebouwd |
| Bankmatching en boekingsregels | gebouwd |
| Btw-overzicht met aansluiting | gebouwd |
| Balans, winst-en-verliesrekening, saldibalans, grootboek, journaal, ouderdomsanalyse | gebouwd |
| Audit trail met hash-ketting | gebouwd |
| Responsive webapp met eigen design system, dark mode, nl/en/de/fr | gebouwd |
| Testsuite: unit, property-based, integratie, isolatie, autorisatie, scenario | gebouwd |
| Docker Compose, Dockerfiles, CI-pipeline | gebouwd |

## Fase 2 — Automatisering (kwartaal 2)

* OCR voor bonnen en inkoopfacturen achter een provideradapter, met redactie
  van gevoelige velden voordat er iets naar buiten gaat.
* AI-boekingsvoorstellen met motivatie, betrouwbaarheidsscore en verplichte
  menselijke bevestiging; volledige registratie per voorstel.
* Automatische bankregels die zichzelf voorstellen op basis van eerder gedrag.
* Periodieke facturatie, abonnementen, termijn- en verzamelfacturen.
* Herinneringen en aanmaningen met instelbare schema's.
* Goedkeuringsworkflows voor inkoopfacturen en declaraties.
* UBL-inlezen en e-mailimport (eigen inbox per administratie).
* Uitgebreide rapportages, budgetten, kostenplaatsen en -dragers.
* Kilometers en declaraties langs dezelfde goedkeuringsweg als de uren.
* Urenstaat per week, een meelopende timer en resultaat per project.
* Importwizard met kolommapping, dry run, rollback en aansluitingsrapport.
* Vreemde valuta: herwaardering en koersverschillen op balansdatum.
* Passkeys (WebAuthn).

## Fase 3 — Mobiel en integraties (kwartaal 3)

* React Native-apps voor iOS en Android: biometrische login, bonnen
  fotograferen met automatisch bijsnijden, uren en kilometers, facturen maken en
  versturen, pushnotificaties, beperkt offline werken met synchronisatie.
* PSD2-adapters via een vergunninghoudende AISP; mockprovider voor ontwikkeling.
* Betaalproviders (Mollie, Stripe) achter één adapter; betaalverzoeken en QR.
* Peppol-verzending via een geaccrediteerd access point.
* Publieke, geversioneerde API met OpenAPI, scopes, API-keys/OAuth2, rate
  limiting, idempotency keys, webhooks met handtekening, retries en
  dead-letter queue, plus een sandboxomgeving.
* Webshop-, CRM- en kassakoppelingen als voorbeeldintegraties.
* Redis + BullMQ als taakdriver naast de Postgres-driver.

## Fase 4 — Accountants en grotere bedrijven (kwartaal 4)

* Accountantsportaal: klantoverzicht, status per administratie, ontbrekende
  documenten, deadlines, risico-indicatoren, reviewworkflow, correctievoorstellen,
  bulkacties, taaktoewijzing en dossierexport.
* Jaarafsluiting: checklist, afschrijvingen, vaste activa, winstbestemming,
  beginbalans, RGS-mapping, auditfile-export, SBR-koppelpunt.
* Consolidatie van holding en werkmaatschappijen.
* Voorraad met waardering, locaties, inventarisatie en samenstellingen.
* Btw-aangifte, suppletie, ICP-opgave, OSS.
* Enterprise SSO (OIDC/SAML), SCIM-gebruikersinrichting.
* Compliance-dashboard en periodiek controleprogramma.

## Fase 5 — Desktop en verdere innovatie (jaar 2)

* Tauri-desktopapp voor Windows en macOS met automatische updates.
* Geavanceerde AI-assistent: natuurlijke-taalzoeken, "waarom was mijn winst
  lager", scenarioplanning, voorspellende cashflow, anomalie- en fraudedetectie.
* Aanvullende landen en lokalisaties.

## Wat bewust op adapters blijft staan

Deze onderdelen worden niet nagebouwd omdat ze een vergunning, accreditatie of
certificaat vereisen. Ze krijgen een interface, een mockprovider voor
ontwikkeling en een duidelijke statusvermelding in de gebruikersinterface:

| Onderdeel | Vereist |
| --- | --- |
| PSD2-rekeninginformatie en betaalinitiatie | AISP/PISP-vergunning (DNB) |
| Peppol-verzending | Geaccrediteerd access point |
| SBR/Digipoort | PKIoverheid-certificaat en aansluiting |
| Kaartbetalingen | PCI-DSS-gecertificeerde PSP |
| Automatische incasso | Incassocontract met de bank |
| Gekwalificeerde elektronische handtekening | eIDAS-vertrouwensdienst |
