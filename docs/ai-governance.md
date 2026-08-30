# AI: beheersing, transparantie en toezicht

## Uitgangspunt

AI is in Gedmma een assistent, geen beslisser. Het verschil is niet retorisch: de
software kent geen pad waarlangs een model zelf een definitieve boeking maakt,
een betaling doet of iemand blokkeert.

Op dit moment (fase 1) is er **geen AI-functionaliteit actief**. Wat er wel is,
is het model, de registratie en de instellingen waarmee het straks verantwoord
kan worden aangezet. Dit document beschrijft de regels waaraan dat moet voldoen.

## Wat AI nooit zelfstandig doet

Zonder een expliciet geconfigureerde en door de klant aangezette regel leidt een
AI-voorstel nooit tot:

* een definitieve boeking;
* een betaling;
* het blokkeren van een gebruiker of relatie;
* een melding van vermoedelijke fraude;
* een kredietbeperking;
* een incassomaatregel;
* een fiscale aangifte;
* het verwijderen van gegevens.

Dit is een productregel én een architectuurregel: `boek(..., { definitief: true })`
wordt uitsluitend aangeroepen vanuit een handeling van een gebruiker of vanuit
een regel die een gebruiker met het recht `journaal.definitief` heeft ingesteld.

## Wat er per voorstel wordt vastgelegd

De tabel `ai_proposal` bewaart per voorstel:

| Veld | Waarom |
| --- | --- |
| Onderwerp (soort en id) | Waar ging het over |
| Provider en model | Wie deed de suggestie |
| Modelversie | Hetzelfde model kan zich anders gedragen na een update |
| Hash van de invoer | Reproduceerbaarheid, zonder de invoer zelf te bewaren |
| Gebruikte invoervelden | Welke gegevens zijn gedeeld |
| Uitkomst | Wat werd voorgesteld |
| Betrouwbaarheid (0 tot 1) | Hoe zeker was het |
| Motivatie | In gewone taal: waarom dit voorstel |
| Status | open, geaccepteerd, afgewezen, gecorrigeerd |
| Beslisser en tijdstip | Wie besloot wat, wanneer |
| Correctie | Wat de mens er uiteindelijk van maakte |

Die laatste twee zijn het belangrijkst: zonder de uiteindelijke correctie weet je
niet of het model goed werkt, en kun je niet aantonen dat er menselijk toezicht is.

## Instellingen

| Instelling | Standaard |
| --- | --- |
| AI-functies | **uit** |
| Klantdata gebruiken voor modeltraining | **uit, en niet aan te zetten** |
| Documenten naar een externe provider | alleen na expliciet aanzetten, en nooit voor als gevoelig geclassificeerde documenten |
| Automatisch boeken op basis van een voorstel | uit; alleen via een expliciete regel met een grens |
| Minimale betrouwbaarheid voor een voorstel | instelbaar; onder de drempel wordt niets getoond |

## Dataminimalisatie

Voordat er iets naar een provider gaat:

1. **Redactie**: velden die niet nodig zijn voor de vraag worden weggelaten. Voor
   een boekingsvoorstel is de leveranciersnaam, het bedrag en de omschrijving
   genoeg; het volledige document niet.
2. **Pseudonimisering** waar het kan: interne identificatoren in plaats van namen.
3. **Geen bulk**: er wordt nooit een hele administratie verstuurd om "context" te
   geven.
4. **Geen gevoelige documenten**: als een document is geclassificeerd als
   gevoelig, gaat het niet naar een externe provider.

## Eisen aan een AI-provider

Vóór contractering wordt vastgelegd:

* is de provider verwerker of zelfstandig verantwoordelijke;
* waar worden de gegevens verwerkt;
* worden prompts en output bewaard, en hoe lang;
* worden gegevens gebruikt voor training (dat moet nee zijn);
* welke subverwerkers zijn er;
* hoe werkt verwijdering;
* welke contractuele garanties er zijn;
* welke internationale doorgiften plaatsvinden;
* hoe lang logging wordt bewaard;
* welke beveiligingscertificeringen er zijn.

Zie [subprocessor-register.md](subprocessor-register.md) en
[international-transfers.md](international-transfers.md).

## Providerabstractie

De AI-provider zit achter een interface. Dat is niet alleen een technische
netheid: het maakt het mogelijk om een provider te vervangen als de voorwaarden
veranderen, en om de functie per tenant helemaal uit te zetten zonder dat er
elders iets breekt.

## Transparantie naar de gebruiker

* Elk voorstel toont **waarom** het er is, in gewone taal. Het bankvoorstel doet
  dat nu al: "Voorgesteld omdat het factuurnummer 2026-0001 in de omschrijving
  staat, en het bedrag precies overeenkomt met wat er nog openstaat."
* Bij een lage betrouwbaarheid staat dat erbij.
* De gebruiker kan altijd afwijken, en die afwijking wordt vastgelegd.
* In de privacyverklaring staat hoe AI, OCR en anomaliedetectie worden gebruikt.

## Toezicht en kwaliteit

| Controle | Frequentie |
| --- | --- |
| Percentage geaccepteerde voorstellen per soort | maandelijks |
| Analyse van correcties: waar zit het model er systematisch naast | maandelijks |
| Controle op bias: worden bepaalde relaties of soorten stelselmatig anders behandeld | halfjaarlijks |
| Herbeoordeling van model en provider | jaarlijks en bij een modelwijziging |
| Herbeoordeling van de DPIA | jaarlijks |

## Verhouding tot de AI-verordening

De toepassing is bedoeld als assistentie bij administratie, zonder besluiten met
juridische of vergelijkbare aanzienlijke gevolgen voor personen. De verwachting
is dat dit geen hoog risico oplevert in de zin van de verordening, maar dat is
een **juridische beoordeling die nog moet plaatsvinden** — zeker voor de
fraude- en anomaliedetectie uit fase 5. Zie
[legal-source-register.md](legal-source-register.md) regel L16.
