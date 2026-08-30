# Internationale doorgifte

## Uitgangspunt

Opslag en verwerking bij voorkeur binnen Nederland of de Europese Economische
Ruimte. Dat is niet alleen juridisch eenvoudiger, het scheelt ook een hele
categorie discussies met klanten die zelf onder toezicht staan.

## Wanneer is er sprake van doorgifte

Vaker dan mensen denken. Ook:

* een supportmedewerker buiten de EER die meekijkt in een systeem;
* back-ups die in een ander land staan dan de productieomgeving;
* telemetrie en foutrapportage die naar het hoofdkantoor gaat;
* een subverwerker van je subverwerker;
* een AI- of OCR-dienst die de verwerking in een derde land doet.

Een EU-vestiging van een leverancier is geen bewijs dat gegevens in de EER
blijven. Er wordt gekeken naar de feitelijke plek van opslag, verwerking,
back-up, telemetrie en support.

## Wat er per doorgifte wordt vastgelegd

| Veld | Toelichting |
| --- | --- |
| Ontvanger en land | Wie, waar |
| Categorieën gegevens | Zo smal mogelijk |
| Doel | Waarom is dit nodig |
| Grondslag | Adequaatheidsbesluit, Standard Contractual Clauses, of een uitzondering |
| Transfer Impact Assessment | Beoordeling van het recht van het ontvangende land, met datum |
| Aanvullende maatregelen | Versleuteling, pseudonimisering, sleutelbeheer in de EER |
| Sleutelbeheer | Wie heeft de sleutels, en waar staan ze |
| Supporttoegang | Vanuit welke landen wordt er ondersteund |
| Overheidsvorderingen | Beleid van de leverancier bij een vordering; transparantierapportage |
| Doorgifte door subverwerkers | De hele keten |
| Verwijdering na beëindiging | Hoe, en hoe aantoonbaar |

## Huidige stand

**Er is nog geen enkele leverancier gekozen**, dus er is nog geen doorgifte. Bij
elke keuze wordt bovenstaande vastgelegd vóór ingebruikname. De keuzes staan als
openstaande beslissing in [assumptions.md](assumptions.md).

Het uitgangspunt bij de keuze:

1. Eerst zoeken naar een aanbieder die volledig in Nederland of de EER werkt.
2. Lukt dat niet, dan alleen met een geldige grondslag, een TIA en aanvullende
   technische maatregelen waardoor de ontvanger de gegevens niet in leesbare
   vorm heeft.
3. Voor AI- en OCR-diensten geldt bovendien: standaard uit, per tenant aan te
   zetten, met redactie vooraf en zonder bewaring bij de provider.

## Aanvullende technische maatregelen

Waar doorgifte onvermijdelijk is:

* versleuteling in transport én in opslag, met sleutelbeheer binnen de EER;
* pseudonimisering en dataminimalisatie vóór verzending;
* geen documentinhoud waar een geminimaliseerd kenmerk volstaat;
* een tenantinstelling waarmee de klant de functie helemaal uit kan zetten.

De juridische houdbaarheid van deze maatregelen moet per geval worden beoordeeld;
versleuteling alleen is niet in alle gevallen voldoende.
