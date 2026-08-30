# Subverwerkersregister

## Status

**De onderstaande lijst is een sjabloon.** Er is nog geen enkele leverancier
gekozen of gecontracteerd; die keuzes staan als openstaande beslissing in
[assumptions.md](assumptions.md) (O1 tot en met O5). Deze pagina beschrijft welke
gegevens per subverwerker moeten worden vastgelegd en hoe klanten worden
geïnformeerd.

Voor productiegebruik moet dit register volledig zijn ingevuld, contractueel
onderbouwd en juridisch getoetst.

## Wat er per subverwerker wordt vastgelegd

| Veld | Toelichting |
| --- | --- |
| Bedrijfsnaam en vestiging | Volledige juridische naam |
| Dienst | Wat de partij precies doet |
| Verwerkingsdoel | Waarvoor gegevens worden gedeeld |
| Categorieën gegevens | Zo smal mogelijk omschreven |
| Verwerkingslocaties | Waar de servers staan |
| Landen van opslag én support | Support vanuit een derde land is óók doorgifte |
| Juridische doorgiftegrond | Adequaatheidsbesluit, SCC's, uitzondering |
| Certificeringen | ISO 27001, SOC 2, en de geldigheidsdatum |
| Contractstatus | Verwerkersovereenkomst getekend, datum, versie |
| Bewaartermijn bij de subverwerker | Wat bewaart de partij zelf, hoe lang |
| Verwijderingsmechanisme | Hoe je gegevens er weer uit krijgt |
| Incidentcontact | Naam en 24-uursbereikbaarheid |
| Datum laatste beoordeling | Minimaal halfjaarlijks |

## Voorziene subverwerkers

| Categorie | Waarvoor | Nodig vanaf | Status |
| --- | --- | --- | --- |
| Hosting en database | De applicatie en de database draaien | MVP | nog te kiezen |
| Objectopslag | Documenten en pdf's | MVP | nog te kiezen |
| E-mailbezorging | Facturen en systeemberichten versturen | MVP | nog te kiezen |
| Foutmonitoring | Storingen opsporen | MVP | nog te kiezen |
| Betaalprovider | Abonnementen incasseren | fase 3 | nog te kiezen |
| PSD2-provider (AISP) | Bankmutaties ophalen | fase 3 | nog te kiezen; vergunning vereist |
| Peppol access point | E-facturen versturen | fase 3 | nog te kiezen; accreditatie vereist |
| OCR-provider | Bonnen uitlezen | fase 2 | nog te kiezen; standaard uit |
| AI-provider | Boekingsvoorstellen | fase 2 | nog te kiezen; standaard uit |
| Supporttool | Vragen beantwoorden | MVP | nog te kiezen |

## Eisen aan een subverwerker

Voordat een partij wordt gecontracteerd:

1. Verwerkersovereenkomst die voldoet aan artikel 28 AVG.
2. Verwerking bij voorkeur binnen Nederland of de EER. Zo niet: een geldige
   doorgiftegrond, een Transfer Impact Assessment en aanvullende maatregelen
   (zie [international-transfers.md](international-transfers.md)).
3. Aantoonbare beveiliging: een actueel certificaat of een auditrapport.
4. Meldtermijn bij incidenten die past bij onze eigen verplichting.
5. Mogelijkheid om gegevens te laten verwijderen en dat aantoonbaar te maken.
6. Geen gebruik van onze gegevens voor eigen doeleinden, in het bijzonder niet
   voor het trainen van modellen.
7. Ketenbepaling: eigen subverwerkers moeten worden gemeld en aan dezelfde eisen
   voldoen.

Een leverancier met een verkoopkantoor in de EU is daarmee nog geen
EER-verwerking. Er wordt gekeken naar de plek van opslag, de back-ups, de
telemetrie, de supporttoegang en de verdere keten.

## Klanten informeren

1. Nieuwe of gewijzigde subverwerkers worden **vooraf** aangekondigd, met een
   redelijke termijn.
2. Klanten kunnen zich abonneren op die aankondigingen.
3. De contractueel afgesproken bezwaarmogelijkheid wordt gerespecteerd; bij een
   bezwaar dat niet is op te lossen, kan de klant de overeenkomst beëindigen met
   een volledige export.
4. Het actuele register is in de applicatie in te zien.
