# Aannames en openstaande beslissingen

Aannames zijn gemaakt waar een keuze nodig was en veilig kon worden afgeleid.
Openstaande beslissingen hebben grote gevolgen en horen bij de opdrachtgever.

## Aannames

| # | Aanname | Onderbouwing | Gevolg als hij niet klopt |
| --- | --- | --- | --- |
| A1 | Het gevraagde product is nieuw; het bestaande Webscan NL blijft naast het platform bestaan | De opdracht verbiedt weggooien van werkende onderdelen | Webscan verplaatsen naar een eigen repository is één `git filter-repo` |
| A2 | Nederland is het eerste land; andere landen volgen later | Alle fiscale eisen in de opdracht zijn Nederlands | Het `country`-veld op organisatie en de datagedreven btw-codes maken uitbreiding mogelijk |
| A3 | De administratievaluta is standaard EUR | Doelgroep | Per administratie instelbaar, dus geen blokkade |
| A4 | Eén organisatie kan meerdere administraties hebben; een gebruiker kan bij meerdere organisaties horen | Holdings en accountantskantoren | Model ondersteunt dit al |
| A5 | Boekhoudkundig jaar mag gebroken zijn | Stichtingen en verenigingen | Perioden zijn losse rijen, niet afgeleid van kalendermaanden |
| A6 | Facturen worden per e-mail verzonden vanuit het platform, met de klant als afzendernaam en een platformdomein als technische afzender | Deliverability zonder DNS-werk bij de klant | Eigen domein met SPF/DKIM is een fase 2-optie |
| A7 | Documenten worden opgeslagen in S3-compatible opslag; in ontwikkeling op de lokale schijf | Kosten en eenvoud | Adapter, dus vervangbaar |
| A8 | Btw-tarieven, aangiftevakken en periodes zijn data met geldigheidsdatum, geen code | Regels wijzigen vaker dan software | Een tariefwijziging is een migratie met nieuwe rijen |
| A9 | Bewaartermijn standaard 7 jaar, 10 jaar voor onroerende zaken | Algemene Nederlandse fiscale bewaarplicht; te bevestigen bij de Belastingdienst per boekjaar | Instelbaar per tenant, administratie, documentsoort en land |
| A10 | De exploitant is verwerker voor klantadministraties en verwerkingsverantwoordelijke voor eigen gebruikers- en facturatiegegevens | Standaard SaaS-rolverdeling | Juridische toets vereist vóór productie |
| A11 | AI-functies staan standaard uit en gebruiken nooit klantdata voor training | Privacy by default | Aanzetten is een expliciete tenantkeuze met eigen registratie |
| A12 | Bankkoppelingen lopen via een vergunninghoudende AISP; Gedmma is zelf geen betaaldienstverlener | PSD2 | Directe bankkoppeling zou een vergunning vereisen |
| A13 | De MVP draait op één applicatie-instantie met één database; horizontale schaling komt later | Fasering | De code is stateless op sessie na, dus schalen kan zonder herbouw |
| A14 | E-mailimport van bonnen krijgt per administratie een uniek, niet-raadbaar adres | Voorkomt dat vreemden documenten kunnen injecteren | Fase 2 |
| A15 | Nederlands is de taal van de code en documentatie; publieke API-velden zijn Engels | Aansluiting op wat er stond | Vastgelegd in ADR-009 |
| A16 | Docker is de productiestandaard, maar de ontwikkelomgeving moet ook zonder Docker werken | In deze omgeving draait geen Docker-daemon | Beide paden zijn beschreven in `deployment.md` |
| A17 | Rapportagetotalen worden altijd live berekend uit `journal_line`; caching komt pas als de performancebudgetten dat vragen | Aansluitingsgarantie boven snelheid | Cache met invalidatie per administratie is voorbereid in de taakverwerker |
| A18 | Een factuur is pas "verzonden" als de mailtransport-adapter bevestigt | Voorkomt valse statussen | Bij falen blijft de factuur `final` met een zichtbare foutmelding |

## Openstaande beslissingen

Deze vragen hebben grote gevolgen en zijn bewust niet eenzijdig ingevuld.

| # | Vraag | Waarom het uitmaakt | Voorlopige richting |
| --- | --- | --- | --- |
| O1 | Wie wordt de AISP voor PSD2-bankkoppelingen? | Bepaalt datamodel voor consent, kosten en contract | Adapter met mockprovider; keuze in fase 3 |
| O2 | Welke betaalprovider (Mollie, Stripe, Adyen)? | Bepaalt betaalverzoeken, incasso en abonnementsfacturatie | Adapter; keuze in fase 3 |
| O3 | Welk Peppol access point? | Bepaalt e-factureren naar de overheid | Adapter; keuze in fase 3 |
| O4 | Welke AI-provider en onder welke voorwaarden (retentie, training, doorgifte)? | Bepaalt privacybeoordeling en of de functie überhaupt aan mag | Provider-abstractie; per tenant uit tenzij aangezet |
| O5 | Welke hostingpartij en in welk land? | Bepaalt doorgiftebeoordeling, DPIA en continuïteit | Voorkeur NL/EER |
| O6 | Wordt Gedmma ook aan consumenten aangeboden? | Consumentenrecht, herroeping, andere voorwaarden | Voorlopig alleen zakelijk |
| O7 | Neemt de exploitant zelf accountancy- of complianceactiviteiten op zich? | Kan aanvullend toezicht en Wwft-verplichtingen meebrengen | Nee, tenzij apart juridisch beoordeeld |
| O8 | Definitieve abonnementsvormen en limieten | Bepaalt feature flags en usage limits | Voorstel in `functional-requirements.md`, nog niet commercieel vastgesteld |
| O9 | Wordt er een Functionaris Gegevensbescherming aangesteld? | Verplicht bij grootschalige verwerking; ook los daarvan verstandig | Aanbevolen |
| O10 | Welke certificering wordt nagestreefd (ISO 27001, SOC 2)? | Bepaalt investering en klantvertrouwen bij grotere afnemers | Aanbevolen vóór enterprise-verkoop |
| O11 | Bewaartermijn van auditlogs los van de administratie | Balans tussen bewijs en dataminimalisatie | Voorstel: 7 jaar financieel, 1 jaar technisch |
| O12 | Wordt het bestaande Webscan NL doorontwikkeld of bevroren? | Bepaalt of het onderhoudsbudget krijgt | Nu bevroren maar werkend gehouden |
