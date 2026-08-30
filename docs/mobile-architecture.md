# Mobiele architectuur (fase 3)

## Uitgangspunt

De mobiele app is geen verpakte website. Hij doet de dingen die je op een
telefoon wél en op een laptop níet doet: een bon fotograferen zodra je hem
krijgt, kilometers vastleggen na een rit, uren wegschrijven tussen twee klussen
door, en snel zien of er is betaald.

Tot de app er is, werkt de webapp volledig op een telefoon: de navigatie wordt
een tabbalk, tabellen worden kaarten, en de e2e-suite draait op telefoonformaat
met controles op horizontale scroll en aanraakbare knoppen.

## Techniek

| Onderdeel | Keuze | Reden |
| --- | --- | --- |
| Framework | React Native met Expo | Eén codebase voor iOS en Android; het team kent React al |
| Navigatie | React Navigation | Standaard, goed toegankelijk |
| Gedeelde code | `packages/i18n`, `packages/money`, `packages/contracts` | Bedragen en vertalingen rekenen op mobiel exact hetzelfde |
| Netwerk | Dezelfde REST-API, met bearer-token | Geen aparte backend, dus geen tweede waarheid |
| Opslag van tokens | iOS Keychain, Android Keystore | Nooit in gewone app-opslag |
| Lokale gegevens | SQLite via Expo, alleen wat nodig is voor offline | Geen volledige administratie op het toestel |

## Wat de app doet

| Functie | Toelichting |
| --- | --- |
| Biometrisch aanmelden | Via de systeemfuncties (Face ID, vingerafdruk). Er wordt nooit een biometrische template opgeslagen; het toestel geeft alleen "ja" of "nee" en ontgrendelt daarmee het token in de Keychain. |
| Bon fotograferen | Automatisch bijsnijden, rechtzetten en comprimeren op het toestel, zodat er minder data de deur uit gaat |
| Kilometers | Handmatige invoer én, met expliciete toestemming, een rit vastleggen met de locatie |
| Uren | Timer of handmatig, gekoppeld aan een project |
| Facturen | Maken, bekijken, versturen en de betaalstatus volgen |
| Dashboard | Dezelfde kerncijfers als op het web |
| Goedkeuren | Documenten en declaraties goedkeuren |
| Vragen van de accountant | Beantwoorden vanuit de app |
| Pushnotificaties | Betaling ontvangen, factuur vervallen, vraag van de accountant |

## Offline werken

Beperkt en expliciet: je kunt offline een bon fotograferen, uren en kilometers
vastleggen en een concept maken. Boeken gebeurt niet offline — dat vereist
nummerreeksen en controles die de server doet.

* Wachtrij op het toestel met idempotency keys; dezelfde bon twee keer
  versturen levert één document op.
* Bij conflict wint de server; de gebruiker ziet wat er is gebeurd en waarom.
* De wachtrij wordt versleuteld opgeslagen en bij uitloggen gewist.

## Privacy op het toestel

Zie ook [privacy-policy.md](privacy-policy.md) en
[data-classification-policy.md](data-classification-policy.md).

* Machtigingen worden pas gevraagd op het moment dat de functie wordt gebruikt,
  met uitleg vooraf waarom ze nodig zijn.
* Wie een niet-essentiële machtiging weigert, houdt een bruikbaar alternatief:
  geen camera betekent bestand kiezen, geen locatie betekent kilometers
  handmatig invoeren.
* Pushnotificaties bevatten geen bedragen of klantnamen op een vergrendeld
  scherm.
* In de app-switcher wordt de inhoud afgedekt.
* Bij uitloggen worden lokale gegevens veilig gewist.
* Sessies zijn op afstand in te trekken vanuit de webapp.
* Accountverwijdering kan vanuit de app, zoals de platformregels vereisen.
* De Apple Privacy Nutrition Labels en het Google Play Data Safety-formulier
  worden naar waarheid ingevuld op basis van
  [processing-register.md](processing-register.md).

## Locatie

Locatie is optioneel en staat standaard uit. Bij aanzetten:

* expliciete opt-in met uitleg;
* geen continue achtergrondtracking; een rit wordt bewust gestart en gestopt;
* instelbare nauwkeurigheid;
* ruwe locatiepunten worden kort bewaard; alleen de afgeleide rit blijft;
* nooit inzetbaar als middel om medewerkers te volgen zonder een aparte
  juridische beoordeling en DPIA.

## Uitrollen

* Expo EAS voor builds; over-the-air updates alleen voor JavaScript, nooit voor
  wijzigingen die een nieuwe machtiging vragen.
* Testflight en Play Internal Testing voor acceptatie.
* Minimale ondersteunde versies: iOS 16 en Android 10, zodat de beveiligde
  opslag en de moderne netwerkstack beschikbaar zijn.
