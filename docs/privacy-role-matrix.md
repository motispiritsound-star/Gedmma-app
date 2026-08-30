# Rolverdeling onder de AVG

## Uitgangspunt

Per gegevensstroom moet vaststaan wie verwerkingsverantwoordelijke is en wie
verwerker. Die verdeling bepaalt wie de betrokkene moet informeren, wie een
verzoek afhandelt en wie een datalek meldt.

**Deze matrix is een ontwerpuitgangspunt en nog niet juridisch getoetst.** Zie
[compliance/README.md](compliance/README.md).

## Hoofdlijn

| Gegevens | Verantwoordelijke | Verwerker |
| --- | --- | --- |
| Accounts, contracten, facturatie, support, beveiliging van het platform | de exploitant van Gedmma | — |
| Alles in een administratie van een klant (relaties, facturen, documenten, banktransacties) | de klant | de exploitant |
| Marketing aan prospects | de exploitant | — |

Dat betekent concreet: als een klant van een klant wil weten welke gegevens er
van hem zijn vastgelegd, is dat een vraag aan de klant, niet aan Gedmma. Gedmma
ondersteunt de klant daarbij met inzage- en exportfuncties.

## Per verwerking

| # | Verwerking | Doel | Categorie persoonsgegevens | Betrokkenen | Verantwoordelijke | Verwerker | Subverwerker | Rechtsgrond | Bewaartermijn | Ontvangers | Doorgifte | Niveau | Verwijderbaar |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| V1 | Gebruikersaccount | Toegang geven en beveiligen | Naam, e-mail, wachtwoordhash, MFA-secret | Gebruikers van klanten | exploitant | — | hosting | Overeenkomst | Duur van het account + 3 maanden | — | EER | ja |
| V2 | Sessies en apparaten | Beveiliging, misbruik herkennen | IP-hash, user agent, tijdstippen | Gebruikers | exploitant | — | hosting | Gerechtvaardigd belang (zie [LIA-1](legitimate-interest-assessments.md)) | 12 maanden | — | EER | ja |
| V3 | Auditlog van het platform | Controleerbaarheid, incidentonderzoek | Gebruiker-id, actie, tijdstip, IP-hash | Gebruikers | exploitant en klant, elk voor het eigen deel | — | hosting | Wettelijke verplichting en gerechtvaardigd belang | 7 jaar financieel, 1 jaar technisch | Klant (inzage) | EER | beperkt (bewijsfunctie) |
| V4 | Financiële administratie | De klant in staat stellen zijn boekhouding te voeren | NAW, e-mail, IBAN, btw-nummer van relaties van de klant | Klanten en leveranciers van de klant | **klant** | exploitant | hosting, objectopslag | Bepaald door de klant; doorgaans overeenkomst en wettelijke verplichting | Door de klant ingesteld, minimaal de fiscale bewaarplicht | Accountant van de klant | EER | beperkt door bewaarplicht |
| V5 | Documenten (bonnen, facturen) | Bewijsstuk bij de administratie | Wat er op het document staat | Wisselend | **klant** | exploitant | objectopslag | Wettelijke verplichting van de klant | Fiscale bewaarplicht | — | EER | na afloop bewaartermijn |
| V6 | Banktransacties | Boekhouding en aansluiting | Tegenrekening, tegenpartij, omschrijving | Tegenpartijen van de klant | **klant** | exploitant | hosting, later AISP | Overeenkomst en wettelijke verplichting | Fiscale bewaarplicht | — | EER | na afloop bewaartermijn |
| V7 | E-mail namens de klant (facturen versturen) | Factuur bezorgen | E-mailadres van de ontvanger | Klanten van de klant | **klant** | exploitant | e-mailprovider | Overeenkomst van de klant | 12 maanden verzendlog | E-mailprovider | te bepalen, zie [international-transfers.md](international-transfers.md) | ja |
| V8 | OCR van documenten (fase 2) | Invoer besparen | Wat er op het document staat, na redactie | Wisselend | **klant** | exploitant | OCR-provider | Overeenkomst; alleen na aanzetten door de klant | Geen bewaring bij de provider (contractueel) | OCR-provider | te bepalen | n.v.t. |
| V9 | AI-voorstellen (fase 2) | Boekingsvoorstellen | Geminimaliseerde kenmerken, geen volledige documenten | Wisselend | **klant** | exploitant | AI-provider | Overeenkomst; alleen na aanzetten door de klant | Voorstellen 7 jaar (audit), prompts niet bewaard | AI-provider | te bepalen | ja |
| V10 | Facturatie van het abonnement | Betaling innen | NAW, e-mail, betaalgegevens via de PSP | Contactpersonen van klanten | exploitant | — | betaalprovider | Overeenkomst en wettelijke verplichting | 7 jaar | Betaalprovider | EER | nee (bewaarplicht) |
| V11 | Support | Vragen beantwoorden | Naam, e-mail, inhoud van het gesprek | Gebruikers | exploitant | — | supporttool | Overeenkomst | 24 maanden, daarna pseudonimiseren | — | te bepalen | ja |
| V12 | Impersonatie door support | Probleem oplossen in de administratie | Alles waar de support-medewerker bij komt | Zie V4 | klant (verantwoordelijke), exploitant (verwerker) | exploitant | — | Instructie van de klant, per keer | Log 7 jaar | — | EER | n.v.t. |
| V13 | Productanalyse | Verbeteren van het product | **Geen persoonsgegevens**: alleen geaggregeerde, niet-herleidbare tellingen | — | exploitant | — | zelf gehost | Gerechtvaardigd belang (zie [LIA-2](legitimate-interest-assessments.md)) | 13 maanden | — | EER | n.v.t. |
| V14 | Marketing | Product onder de aandacht brengen | Naam, e-mail, bedrijf | Prospects | exploitant | — | e-mailprovider | Toestemming, of gerechtvaardigd belang bij bestaande klanten | Tot intrekking, daarna suppressielijst | — | te bepalen | ja |

## Wat er nadrukkelijk niet gebeurt

Klantgegevens worden niet gebruikt voor eigen marketing, profilering,
producttraining, benchmarking of het trainen van AI-modellen. Dat is niet alleen
beleid maar ook techniek: de AI-instelling staat standaard uit, de
analytics-verwerking krijgt alleen geaggregeerde tellingen, en er is geen pad
waarlangs administratiegegevens in een marketingsysteem terechtkomen.

Zou de exploitant klantgegevens ooit voor een eigen doel willen gebruiken, dan
ontstaat een andere rolverdeling (mogelijk zelfstandig verantwoordelijke) en moet
dat eerst juridisch worden beoordeeld en transparant gemaakt.
