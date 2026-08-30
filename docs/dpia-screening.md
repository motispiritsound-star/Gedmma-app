# DPIA-screening

## Waarom

Voordat je een DPIA doet, bepaal je of je er een nodig hebt. Deze screening loopt
de criteria langs die daarvoor gelden en komt tot een conclusie per verwerking.

**Deze screening is uitgevoerd door het ontwikkelteam vanuit het ontwerp en is
nog niet door een privacyjurist of FG getoetst.**

## Criteria

| # | Criterium | Van toepassing? | Toelichting |
| --- | --- | --- | --- |
| 1 | Systematische en uitgebreide beoordeling van persoonlijke aspecten (profilering) | **deels** | Boekingsvoorstellen en anomaliedetectie zijn geen beoordeling van personen, maar van transacties. Fraudedetectie (fase 5) komt er dichter bij. |
| 2 | Grootschalige verwerking van bijzondere gegevens of strafrechtelijke gegevens | nee | Het datamodel kent er geen velden voor; ze kunnen wel onbedoeld in een document staan (zie [data-classification-policy.md](data-classification-policy.md)). |
| 3 | Stelselmatige en grootschalige monitoring van openbaar toegankelijke ruimten | nee | — |
| 4 | Gegevens over kwetsbare betrokkenen | nee | Zakelijke gebruikers |
| 5 | Innovatieve technologie | **ja** | AI-boekingsvoorstellen en OCR (fase 2) |
| 6 | Koppeling van datasets | **ja** | Bank, facturen, documenten en relaties worden gecombineerd |
| 7 | Grootschalige verwerking | **ja** | Financiële gegevens van veel ondernemingen en hun relaties |
| 8 | Gegevens die tot financiële schade kunnen leiden | **ja** | Bankgegevens en volledige administraties |
| 9 | Verwerking die betrokkenen belemmert in het uitoefenen van een recht | nee | — |
| 10 | Systematische monitoring van werknemers | **mogelijk** | Alleen als een klant uren- of kilometerregistratie zo inzet; dan is de klant verantwoordelijk |

## Conclusie per verwerking

| Verwerking | DPIA nodig | Toelichting |
| --- | --- | --- |
| Gebruikersaccounts en sessies | nee | Beperkt, standaard, met gangbare maatregelen |
| Financiële administratie (kern) | **ja** | Grootschalig, gekoppelde datasets, risico op financiële schade |
| Documentopslag | **ja** | Onbedoelde bijzondere gegevens niet uit te sluiten; onderdeel van de DPIA hierboven |
| Bankkoppeling via PSD2 (fase 3) | **ja** | Betaalgegevens zijn per definitie gevoelig; aparte DPIA vóór ingebruikname |
| OCR (fase 2) | **ja** | Documentinhoud naar een derde partij |
| AI-boekingsvoorstellen (fase 2) | **ja** | Innovatieve technologie, gegevens naar een derde partij |
| Anomalie- en fraudedetectie (fase 5) | **ja** | Raakt aan profilering; aparte DPIA |
| Locatie bij kilometerregistratie (fase 3) | **ja** | Locatiegegevens; extra aandacht als een werkgever het inzet |
| Accountantsportaal (fase 4) | **ja** | Veel administraties bij één partij; concentratie van risico |
| Productanalyse | nee | Alleen geaggregeerde, niet-herleidbare tellingen |
| Marketing | nee | Standaard, met toestemming en een suppressielijst |

## Vervolg

1. Vóór productiegebruik: de DPIA voor de kernverwerking afronden. Het raamwerk
   staat in [dpia.md](dpia.md).
2. Vóór fase 2: aparte DPIA's voor OCR en AI, of een uitbreiding van de
   bestaande.
3. Vóór fase 3: DPIA voor PSD2 en locatie.
4. Vóór fase 4: DPIA voor het accountantsportaal.
5. Jaarlijks herbeoordelen, en bij elke ingrijpende wijziging.

Blijft er na de maatregelen een **hoog restrisico** bestaan, dan is voorafgaande
raadpleging van de Autoriteit Persoonsgegevens mogelijk verplicht. Dat wordt per
DPIA expliciet beoordeeld en vastgelegd.
