# Compliancematrix

## Waarvoor deze matrix dient

Het [juridisch bronnenregister](legal-source-register.md) beantwoordt de vraag
*welke regel geldt en waar staat die*. Deze matrix beantwoordt de vraag daarna:
*wat hebben we ervoor gebouwd, geregeld en afgesproken, waar is dat te zien, en
wat is er nog niet af*.

Elke verplichting heeft een eigen nummer (`C-…`). Omdat dertien kolommen in één
tabel onleesbaar worden, staat elke verplichting in twee tabellen met hetzelfde
nummer: **A. Toepasselijkheid** en **B. Maatregelen en bewijs**.

## Status van deze matrix

**Geen enkele regel in deze matrix is door een jurist of fiscalist
geverifieerd.** De kolom "Datum laatste controle" is daarom overal leeg en de
kolom "Juridische validatie" beschrijft wat er nog moet gebeuren, niet wat er
is gebeurd.

Deze matrix onderbouwt geen enkele algemene uitspraak dat Gedmma "volledig
AVG-proof", "100% compliant" of "volledig conform de Nederlandse wetgeving" is.
Wat er staat, is per regel wat er aantoonbaar is gebouwd en wat er ontbreekt.
Zie ook [compliance/README.md](compliance/README.md).

## Legenda

**Implementatiestatus**

| Waarde | Betekenis |
| --- | --- |
| gebouwd | Zit in de code van deze release en is met tests afgedekt |
| gedeeltelijk | Het model of een deel van de werking is er; het geheel is nog niet af |
| ontwerp | Beschreven en voorbereid in het datamodel, nog niet gebouwd |
| exploitant | Kan niet in software zitten; de exploitant moet dit inrichten |
| buiten scope | Niet van toepassing op deze release, met reden |

**Verantwoordelijke partij** volgt de rolverdeling uit
[privacy-role-matrix.md](privacy-role-matrix.md): *verwerker* is de exploitant
van Gedmma, *verwerkingsverantwoordelijke* is de klant (de organisatie die de
administratie voert), *leverancier* is het ontwikkelteam van het product.

---

## 1. Gegevensbescherming

### A. Toepasselijkheid

| # | Wet of norm | Artikel | Toepasselijk | Reden | Verantwoordelijke partij |
| --- | --- | --- | --- | --- | --- |
| C-01 | AVG (EU) 2016/679 | art. 5 | ja | Alle verwerkingen in het product | klant als verantwoordelijke, exploitant als verwerker |
| C-02 | AVG | art. 6 | ja | Klantgegevens, personeelsgegevens, relatiegegevens | klant |
| C-03 | AVG | art. 12–14 | ja | Betrokkenen moeten weten wat er gebeurt | klant, ondersteund door de exploitant |
| C-04 | AVG | art. 15–22 | ja | Rechten van betrokkenen | klant, technisch mogelijk gemaakt door de leverancier |
| C-05 | AVG | art. 22 | ja | Het product doet AI-voorstellen | leverancier (ontwerp), klant (gebruik) |
| C-06 | AVG | art. 25 | ja | Privacy by design en by default | leverancier |
| C-07 | AVG | art. 28 | ja | De exploitant verwerkt in opdracht | exploitant |
| C-08 | AVG | art. 28 lid 2 en 4 | ja | Subverwerkers (hosting, e-mail, opslag) | exploitant |
| C-09 | AVG | art. 30 | ja | Verwerkingsregister | klant en exploitant, ieder eigen register |
| C-10 | AVG | art. 32 | ja | Beveiliging van de verwerking | exploitant en leverancier |
| C-11 | AVG | art. 33–34 | ja | Meldplicht datalekken | exploitant meldt aan klant, klant aan de AP |
| C-12 | AVG | art. 35 | te toetsen | Grootschalige verwerking is niet uitgesloten | klant, met een screening van de leverancier |
| C-13 | AVG | hoofdstuk V | ja | Zodra een subverwerker buiten de EER zit | exploitant |
| C-14 | Uitvoeringswet AVG | div. | ja | Nationale invulling, o.a. BSN | klant |
| C-15 | Telecommunicatiewet art. 11.7a | — | ja | Opslag op het apparaat van de gebruiker | exploitant |

### B. Maatregelen en bewijs

| # | Technische maatregel | Organisatorische maatregel | Contractuele maatregel | Bewijsstuk | Status | Openstaand risico | Juridische validatie | Laatste controle |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| C-01 | Dataminimalisatie in het model: geen veld zonder doel; bewaartermijnen als data in `retention_policy` | Doelbinding per verwerking vastgelegd | Verwerkersovereenkomst beperkt gebruik tot de opdracht | [processing-register.md](processing-register.md), [data-retention-policy.md](data-retention-policy.md) | gebouwd (model), exploitant (uitvoering) | Automatisch opschonen draait nog niet als terugkerende taak | Toetsing van doelomschrijvingen | — |
| C-02 | Grondslag per verwerking vastgelegd naast de verwerking, niet in code verstopt | Beoordeling per nieuwe verwerking vóór oplevering | Instructiebevoegdheid bij de klant | [processing-register.md](processing-register.md), [legitimate-interest-assessments.md](legitimate-interest-assessments.md) | gedeeltelijk | Gerechtvaardigd-belangtoetsen zijn concepten | Volledige toets van elke grondslag | — |
| C-03 | Informatieteksten staan in de vertaalbestanden, niet hardcoded in schermen | Privacyverklaring als losstaand document, versiebeheer in git | Klant informeert zijn eigen betrokkenen | [privacy-policy.md](privacy-policy.md) | gedeeltelijk | Tekst is een concept zonder juridische toets | Volledige toets van de verklaring | — |
| C-04 | Export per administratie (JSON en CSV), inzage via de auditweergave, verwijderen met behoud van fiscale bewaarplicht | Procedure met termijnen en identiteitscontrole | Verwerker helpt de verantwoordelijke binnen afgesproken termijn | [data-subject-rights-procedure.md](data-subject-rights-procedure.md) | gedeeltelijk | Verzoekafhandeling is nog geen selfserviceproces in de app | Toets van de afweging recht op wissen versus bewaarplicht | — |
| C-05 | AI doet uitsluitend voorstellen; definitief boeken vereist een menselijke handeling of een expliciet geconfigureerde goedkeuringsregel | Register per voorstel: invoer, model, versie, zekerheid, motivatie, gebruiker, uitkomst | Geen training op klantgegevens zonder afzonderlijke grondslag | [ai-governance.md](ai-governance.md) | ontwerp | AI-functies zitten niet in deze release | Toets of de goedkeuringsregels buiten art. 22 blijven | — |
| C-06 | Standaard de smalste rol; tenantisolatie met row-level security die niet uit te zetten is; geen externe trackers | Ontwerpregels in de codebasis afgedwongen met lint | — | [security.md](security.md), [architecture.md](architecture.md) | gebouwd | — | — | — |
| C-07 | Scheiding van klantgegevens per organisatie en administratie | Instructies alleen schriftelijk, geen verwerking voor eigen doelen | Verwerkersovereenkomst met de maatregelenbijlage | [technical-and-organisational-measures.md](technical-and-organisational-measures.md) | exploitant | Er is nog geen ondertekende modelovereenkomst | Opstellen en toetsen van de verwerkersovereenkomst | — |
| C-08 | Subverwerkers staan als data in het register, niet in code | Meldtermijn en bezwaarrecht bij wijziging | Doorleggen van dezelfde verplichtingen | [subprocessor-register.md](subprocessor-register.md) | gedeeltelijk | Register is nog niet met echte leveranciers gevuld | Toets van de doorlegging | — |
| C-09 | Verwerkingen afleidbaar uit het datamodel | Register bijhouden bij elke functionele wijziging | Verwerker levert de gegevens voor het register van de klant | [processing-register.md](processing-register.md) | gedeeltelijk | Register beschrijft het ontwerp, nog niet een draaiende dienst | Toets op volledigheid | — |
| C-10 | Zie de volledige lijst: hashing, TLS, RLS, auditketen, snelheidsbegrenzing, sessiebeheer | Toegangsreview, patchbeleid, incidentoefening | Beveiligingsbijlage bij de overeenkomst | [technical-and-organisational-measures.md](technical-and-organisational-measures.md), [security.md](security.md) | gedeeltelijk | Versleuteling in rust en sleutelbeheer zijn taken van de exploitant | Toets of de maatregelen passend zijn bij het risico | — |
| C-11 | Auditlog met hashketen maakt aantoonbaar wat er is gebeurd en wanneer | Procedure met rollen, termijnen en een meldregister | Meldtermijn van de verwerker aan de klant | [data-breach-procedure.md](data-breach-procedure.md) | gedeeltelijk | Geen automatische melding aan een toezichthouder, en dat is bewust | Toets van de beoordelingscriteria en termijnen | — |
| C-12 | — | Screening ingevuld, DPIA als concept uitgewerkt | Klant blijft verantwoordelijk voor zijn eigen DPIA | [dpia-screening.md](dpia-screening.md), [dpia.md](dpia.md) | gedeeltelijk | Uitkomst van de screening is niet juridisch bevestigd | Vaststellen of een DPIA verplicht is | — |
| C-13 | Voorkeur voor hosting in Nederland of de EER; opslaglocatie is configuratie | Doorgiftetoets per subverwerker | Standaardcontractbepalingen | [international-transfers.md](international-transfers.md) | ontwerp | Zonder ingevulde leverancierskeuze is dit niet af | Toets per doorgifte, inclusief TIA | — |
| C-14 | Geen BSN-veld in het model van deze release | Beleid: BSN alleen waar de wet dat voorschrijft | — | [data-classification-policy.md](data-classification-policy.md) | gebouwd (door weglating) | Loonadministratie in een latere fase brengt BSN mee | Toets vóór de loonmodule | — |
| C-15 | Alleen functionele opslag: sessiecookie en voorkeuren; geen analytics of advertentiecookies | Cookiebeleid als document | — | [cookie-policy.md](cookie-policy.md) | gebouwd | — | Bevestiging dat er geen toestemming nodig is | — |

---

## 2. Boekhouden en belastingen

### A. Toepasselijkheid

| # | Wet of norm | Artikel | Toepasselijk | Reden | Verantwoordelijke partij |
| --- | --- | --- | --- | --- | --- |
| C-16 | Burgerlijk Wetboek boek 2 titel 9 | art. 2:10 | ja | De klant voert een administratie | klant, ondersteund door de software |
| C-17 | Algemene wet inzake rijksbelastingen | art. 52 | ja | Fiscale bewaarplicht | klant |
| C-18 | Wet op de omzetbelasting 1968 | art. 35a | ja | Factuurvereisten | klant, gecontroleerd door de software |
| C-19 | Wet OB 1968 | art. 12 | ja | Verlegging | klant |
| C-20 | Btw-richtlijn 2006/112/EG | div. | ja | Intracommunautaire leveringen en ICP | klant |
| C-21 | Btw-tarieven en aangiftevakken | — | ja | Aangifte omzetbelasting | klant |
| C-22 | RGS | — | optioneel | Uitwisseling met accountantssoftware | leverancier |
| C-23 | SBR en Digipoort | — | buiten scope in deze release | Elektronisch indienen komt in een latere fase | leverancier |
| C-24 | Nederlandse Auditfile Financieel | — | buiten scope in deze release | Auditfile-export komt in een latere fase | leverancier |

### B. Maatregelen en bewijs

| # | Technische maatregel | Organisatorische maatregel | Contractuele maatregel | Bewijsstuk | Status | Openstaand risico | Juridische validatie | Laatste controle |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| C-16 | Dubbel boekhouden met invarianten in de code én in databasetriggers; definitieve boekingen zijn onwijzigbaar; correctie alleen met een tegenboeking; auditketen met hashes | Ontwerpregel: geen enkele weg omheen, ook niet voor beheerders | — | [accounting-engine.md](accounting-engine.md), tests in `packages/accounting` | gebouwd | — | Toets of de controlespoor-eisen volledig zijn afgedekt | — |
| C-17 | Bewaartermijnen als data (`retention_policy`), 7 en 10 jaar als startwaarde; verwijderen wordt geblokkeerd zolang de termijn loopt | Termijnen jaarlijks herzien | Exploitant bewaart zolang de klant afneemt; exit-regeling daarna | [data-retention-policy.md](data-retention-policy.md), [exit-and-portability-plan.md](exit-and-portability-plan.md) | gebouwd (model), gedeeltelijk (uitvoering) | Automatisch opschonen na afloop draait nog niet | Bevestiging van de termijnen per gegevenssoort | — |
| C-18 | `controleerFactuurvereisten()` blokkeert het definitief maken van een factuur die een verplicht gegeven mist; extra eisen bij verlegging en ICL | Foutmeldingen benoemen het ontbrekende gegeven in gewone taal | — | `packages/accounting`, tests | gebouwd | De eisenlijst is een aanname tot een fiscalist hem bevestigt | Toets van de volledige eisenlijst | — |
| C-19 | Btw-codes `VK-VERLEGD` en `IN-VERLEGD`; bij inkoop wordt de verlegde btw aan beide kanten geboekt zodat de aangifte klopt | — | — | `boekInkoopfactuur()`, tests | gebouwd | — | Bevestiging van de aangiftebehandeling | — |
| C-20 | Btw-code `VK-ICL`, ICP-overzicht per periode, controle op een ingevuld btw-identificatienummer | Waarschuwing als het nummer ontbreekt | — | `packages/accounting` | gedeeltelijk | Geen online validatie van het btw-nummer | Toets van de nultariefvoorwaarden | — |
| C-21 | Tarieven en vakken zijn rijen met een geldigheidsperiode; een wijziging is een migratie met een nieuwe rij, oude boekingen blijven verwijzen naar de code die gold | Jaarlijkse herbeoordeling met eigenaar | — | [legal-source-register.md](legal-source-register.md) rijen L3 en L4 | gebouwd | Tarieven zijn ingevuld als aanname | Bevestiging van tarieven en vakindeling | — |
| C-22 | `rgs_code` als optioneel veld op de grootboekrekening | Volledige mapping gepland in een latere fase | — | [data-model.md](data-model.md) | gedeeltelijk | Zonder volledige mapping is uitwisseling beperkt | — | — |
| C-23 | — | Gepland; vereist een PKIoverheid-certificaat en een aansluitprocedure | — | [roadmap.md](roadmap.md) | buiten scope | Aangifte gebeurt tot die tijd handmatig buiten Gedmma | Toets vóór aansluiting | — |
| C-24 | — | Gepland | — | [roadmap.md](roadmap.md) | buiten scope | Accountant kan nog niet in het standaardformaat overnemen; de generieke export vangt dit op | — | — |

---

## 3. Bank, betalen en facturen versturen

### A. Toepasselijkheid

| # | Wet of norm | Artikel | Toepasselijk | Reden | Verantwoordelijke partij |
| --- | --- | --- | --- | --- | --- |
| C-25 | PSD2 (EU) 2015/2366 | div. | pas bij directe bankkoppeling | Rekeninginformatie ophalen is een vergunningplichtige dienst | exploitant of een vergunninghoudende provider |
| C-26 | SEPA-rulebooks | — | pas bij betaalbestanden | Aanleveren van betaalopdrachten | exploitant |
| C-27 | PCI DSS | — | buiten scope | Er worden geen kaartgegevens opgeslagen | exploitant |
| C-28 | Peppol BIS en NLCIUS | — | gedeeltelijk | E-facturen genereren kan, versturen niet | leverancier |

### B. Maatregelen en bewijs

| # | Technische maatregel | Organisatorische maatregel | Contractuele maatregel | Bewijsstuk | Status | Openstaand risico | Juridische validatie | Laatste controle |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| C-25 | Bankgegevens komen uit bestanden die de gebruiker zelf aanlevert (MT940, CAMT.053, CSV); er is geen koppeling die zonder vergunning rekeninginformatie ophaalt | Bewuste keuze: geen ongedocumenteerde toegang tot banksystemen | Bij een koppeling: overeenkomst met een vergunninghoudende AISP | [architecture.md](architecture.md), `apps/api/src/import` | gebouwd (import), buiten scope (koppeling) | Handmatig importeren kost de gebruiker een handeling | Toets vóór een directe koppeling | — |
| C-26 | — | Gepland als exportbestand dat de gebruiker zelf bij zijn bank aanlevert | — | [roadmap.md](roadmap.md) | buiten scope | — | Toets van de bestandsspecificatie | — |
| C-27 | Geen enkel veld voor kaartnummers in het model; abonnementsbetalingen gaan via een gecertificeerde provider met tokens | Beleid: nooit volledige kaartgegevens opslaan | Provider is subverwerker | [data-classification-policy.md](data-classification-policy.md) | gebouwd (door weglating) | — | — | — |
| C-28 | UBL 2.1 volgens het EN 16931-profiel wordt gegenereerd en is te downloaden | Verzending via een geaccrediteerd access point is een latere fase | Overeenkomst met het access point | `apps/api/src/facturen` | gedeeltelijk | Zonder access point moet de gebruiker het bestand zelf aanleveren | Toets van de profielconformiteit | — |

---

## 4. Product, beveiliging en toegankelijkheid

### A. Toepasselijkheid

| # | Wet of norm | Artikel | Toepasselijk | Reden | Verantwoordelijke partij |
| --- | --- | --- | --- | --- | --- |
| C-29 | AI-verordening (EU) 2024/1689 | div. | pas bij AI-functies | Het product krijgt AI-assistentie | leverancier en exploitant |
| C-30 | Data Act (EU) 2023/2854 | hoofdstuk VI | ja | Overstappen tussen dienstverleners | exploitant |
| C-31 | NIS2 en Cyberbeveiligingswet | — | te toetsen | Toepasselijkheid hangt af van omvang en sector | exploitant |
| C-32 | DORA (EU) 2022/2554 | — | te toetsen | Alleen als een afnemer een financiële entiteit is | exploitant |
| C-33 | European Accessibility Act en EN 301 549 | — | te toetsen | Toepasselijkheid hangt af van de afzetmarkt | leverancier |
| C-34 | Wwft | — | buiten scope | Boekhoudsoftware is zelf geen instelling | exploitant |
| C-35 | Regels van Apple en Google | — | pas bij de mobiele apps | Distributie via de winkels | leverancier |
| C-36 | eIDAS (EU) 910/2014 | — | buiten scope | Elektronisch ondertekenen zit niet in het product | leverancier |

### B. Maatregelen en bewijs

| # | Technische maatregel | Organisatorische maatregel | Contractuele maatregel | Bewijsstuk | Status | Openstaand risico | Juridische validatie | Laatste controle |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| C-29 | AI is uitsluitend assistent; elk voorstel is herleidbaar en afwijsbaar; geen automatische definitieve boeking zonder een expliciet geconfigureerde regel; verstrekking aan een externe aanbieder is beperkt en te redigeren | Aanbieder is verwisselbaar en per tenant instelbaar | Geen training op klantgegevens | [ai-governance.md](ai-governance.md) | ontwerp | AI zit niet in deze release; de eisen kunnen nog wijzigen | Classificatie van het systeem onder de verordening | — |
| C-30 | Volledige export per administratie in open formaten, zonder extra kosten of vertraging, ook na opzegging | Exitprocedure met termijnen en een verwijderbewijs | Exitbepaling in de overeenkomst | [exit-and-portability-plan.md](exit-and-portability-plan.md) | gedeeltelijk | Export is er; de exitprocedure als dienst moet de exploitant inrichten | Toets van de bepalingen tegen hoofdstuk VI | — |
| C-31 | Logging, monitoring, kwetsbaarhedenbeheer, herstelprocedures | Incidentproces met ernstniveaus en termijnen | — | [security-incident-response.md](security-incident-response.md), [business-continuity.md](business-continuity.md) | gedeeltelijk | Zonder toets weet de exploitant niet of meldplichten gelden | Vaststellen of de exploitant onder NIS2 valt | — |
| C-32 | Uitwijk, herstel en oefeningen zijn beschreven | Register van kritieke afhankelijkheden | Bij financiële afnemers: aanvullende afspraken | [disaster-recovery.md](disaster-recovery.md) | ontwerp | Onbekend tot de afnemersgroep vaststaat | Toets bij de eerste financiële afnemer | — |
| C-33 | WCAG 2.2 AA als bouwnorm: toetsenbedienbaar, zichtbare focus, contrast, labels, foutmeldingen in gewone taal, donkere en lichte modus | Toegankelijkheid als onderdeel van de definition of done | — | [functional-requirements.md](functional-requirements.md), e2e-tests | gedeeltelijk | Er is geen onafhankelijke toegankelijkheidsaudit uitgevoerd | Toets van de toepasselijkheid en een externe audit | — |
| C-34 | — | Beleid: geen diensten die onder de Wwft vallen | — | [legal-source-register.md](legal-source-register.md) rij L20 | buiten scope | Herbeoordelen bij nieuwe diensten | Bevestiging van de scope | — |
| C-35 | Ontwerp houdt rekening met accountverwijdering, machtigingen en privacylabels | Winkelvereisten in de opleverchecklist van de apps | — | [mobile-architecture.md](mobile-architecture.md) | ontwerp | Apps zijn nog niet ingediend | — | — |
| C-36 | — | — | — | [legal-source-register.md](legal-source-register.md) rij L25 | buiten scope | — | Toets bij invoering | — |

---

## Wat deze matrix nog niet is

1. **Geen bewijs van naleving.** Een ingevulde cel zegt dat een maatregel is
   gebouwd of beschreven, niet dat een toezichthouder of auditor die maatregel
   voldoende vindt.
2. **Geen juridisch advies.** De kolom "Reden" is de redenering van het
   ontwikkelteam. Elke rij wacht op de toets die in de kolom "Juridische
   validatie" staat.
3. **Niet af zolang de kolom "Laatste controle" leeg is.** Die kolom is de
   enige die aantoont dat er daadwerkelijk iemand naar heeft gekeken.

## Onderhoud

| Wanneer | Wat |
| --- | --- |
| Bij elke functionele wijziging | Raakt de wijziging een rij, dan wordt die rij bijgewerkt in dezelfde pull request |
| Bij elke nieuwe subverwerker | C-08 en C-13 bijwerken, register en doorgiftetoets aanvullen |
| Elk kwartaal | Rijen met status *gedeeltelijk* of *ontwerp* opnieuw langs |
| Jaarlijks | Volledige controle samen met het [bronnenregister](legal-source-register.md) |
| Vóór productie | Elke rij een datum in "Laatste controle", of een expliciet geaccepteerd risico |
