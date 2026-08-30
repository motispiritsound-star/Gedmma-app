# DPIA: financiële administratie als dienst

> **Status: concept, opgesteld door het ontwikkelteam.** Een DPIA is pas
> afgerond na toetsing door de privacyverantwoordelijke of FG, met betrokkenheid
> van de exploitant. De maatregelen die hieronder als "aanwezig" staan, zitten
> daadwerkelijk in de software; de beoordeling van het restrisico is dat nog niet.

## 1. Beschrijving van de verwerking

Gedmma verwerkt namens ondernemers hun financiële administratie: relaties,
facturen, inkoopdocumenten en banktransacties. De exploitant is verwerker; de
klant is verwerkingsverantwoordelijke.

| | |
| --- | --- |
| Aard | Opslaan, ordenen, berekenen, rapporteren, ter beschikking stellen |
| Doel | De klant in staat stellen zijn administratie te voeren en aan zijn wettelijke verplichtingen te voldoen |
| Betrokkenen | Gebruikers van de klant; klanten, leveranciers en contactpersonen van de klant |
| Gegevens | Naam, adres, e-mail, telefoon, IBAN, btw-nummer, KVK-nummer, bedragen, omschrijvingen, documentinhoud |
| Ontvangers | Hosting, objectopslag, e-mail; op verzoek van de klant zijn accountant |
| Bewaartermijn | Fiscale bewaarplicht, zie [data-retention-policy.md](data-retention-policy.md) |
| Doorgifte | Voorkeur EER, zie [international-transfers.md](international-transfers.md) |

## 2. Noodzaak en evenredigheid

De verwerking is noodzakelijk om de dienst te leveren; zonder deze gegevens is er
geen boekhouding. Evenredigheid is geborgd door dataminimalisatie: er zijn geen
velden voor BSN of bijzondere gegevens, banktokens worden opgeslagen in plaats
van inloggegevens, en er worden geen kaartgegevens opgeslagen.

## 3. Risico's en maatregelen

| # | Risico | Kans | Impact | Maatregelen | Rest |
| --- | --- | --- | --- | --- | --- |
| R1 | Onbevoegde toegang tot de administratie van een andere klant | laag | zeer hoog | Row-level security met `FORCE`, applicatierol zonder `BYPASSRLS`, tenantcontext per transactie, drie onafhankelijke lagen, geautomatiseerde isolatietests met metatest | laag |
| R2 | Gestolen wachtwoord leidt tot toegang | midden | hoog | scrypt met pepper, tweestapsverificatie, brute-forcebescherming, korte sessies, apparaatoverzicht en intrekken | laag/midden — hangt af van of de klant MFA aanzet |
| R3 | Datalek bij een subverwerker | laag | hoog | Leveranciersbeoordeling, verwerkersovereenkomst, versleuteling, EER-voorkeur, meldketen | midden — afhankelijk van de leverancierskeuze |
| R4 | Onbedoelde bijzondere gegevens in een geüpload document | midden | midden | Classificatie `gevoelig` met apart recht, registratie van elke inzage, waarschuwing bij uploaden, redactie vóór externe verwerking | laag/midden |
| R5 | Onterechte verwijdering of verlies van administratie | laag | hoog | Onveranderbare boekingen, back-ups met PITR, kwartaalhersteltest, verwijdering pas na export en bevestiging | laag |
| R6 | Onjuiste of onnavolgbare cijfers | midden | hoog | Rapportages uitsluitend uit het grootboek, doorklikken tot document, invarianten in code én database, property-based tests | laag |
| R7 | Interne medewerker kijkt zonder aanleiding mee | laag | hoog | Geen permanente supporttoegang, impersonatie alleen met toestemming en tijdslimiet, volledige logging, melding aan de klant | laag/midden |
| R8 | Gegevens komen bij een AI- of OCR-provider terecht zonder grondslag | laag | hoog | Standaard uit, per tenant aan te zetten, redactie en minimalisatie, contractuele zero-retention, geen modeltraining | laag, mits de leveranciersvoorwaarden dat waarmaken |
| R9 | Log bevat persoonsgegevens of geheimen | laag | midden | Automatische maskering, test die het bewaakt, classificatiebeleid | laag |
| R10 | Doorgifte buiten de EER zonder grondslag | laag | hoog | Register, TIA per doorgifte, aanvullende maatregelen, EER-voorkeur | te bepalen na leverancierskeuze |

## 4. Betrokkenen

De rechten van betrokkenen worden uitgeoefend bij de klant, die daarvoor de
functies in het product krijgt (inzage, export, beperking, afscherming). Zie
[data-subject-rights-procedure.md](data-subject-rights-procedure.md).

De klant informeert zijn eigen relaties over de verwerking; de exploitant levert
daarvoor de informatie over de verwerker en de subverwerkers.

## 5. Conclusie

Het restrisico is met de aanwezige maatregelen naar verwachting aanvaardbaar,
met twee voorbehouden:

1. **R3 en R10 zijn nog niet te beoordelen**, omdat er nog geen leveranciers zijn
   gekozen. Die beoordeling moet vóór productiegebruik af zijn.
2. **R2 hangt af van de klant.** MFA is beschikbaar maar niet afgedwongen.
   Aanbeveling: MFA verplicht stellen voor rollen met het recht
   `journaal.definitief`, `betaling.goedkeuren` of `rapport.exporteren`.

Zolang die punten open staan, kan niet worden geconcludeerd dat het restrisico
laag is. Voorafgaande raadpleging van de Autoriteit Persoonsgegevens lijkt niet
nodig, maar dat oordeel is aan de privacyverantwoordelijke.

## 6. Actiepunten

| # | Actie | Eigenaar | Termijn |
| --- | --- | --- | --- |
| A1 | Leveranciers kiezen en beoordelen (R3, R10) | exploitant | vóór productie |
| A2 | MFA verplicht stellen voor kritieke rechten (R2) | product | vóór productie |
| A3 | Penetratietest, bevindingen afhandelen | exploitant | vóór productie |
| A4 | DPIA laten toetsen door FG of privacyjurist | exploitant | vóór productie |
| A5 | Aparte DPIA's voor OCR, AI, PSD2, locatie en accountantsportaal | product | per fase |
| A6 | Herstelprocedure oefenen en vastleggen | exploitant | vóór productie |
