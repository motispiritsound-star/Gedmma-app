# Dilimiz — productbrief

> **Status:** voorstel. De naam staat niet vast; `Dilimiz` is een
> plaatshouder. Zie `brand-brief.md` voor naamrichtingen.
> **Datum:** 20 oktober 2026.

## Waar dit over gaat

Een leerapp waarmee kinderen en jongeren uit de Turkse diaspora in Europa
Turks leren, en waarmee ouders de taal kunnen doorgeven zonder dat het een
tweede baan wordt.

Zelfstandig product. De technische machine komt uit Darijaforkids (zie
`architecture.md`); de inhoud, het merk en de didactiek zijn nieuw.

## Het probleem, zoals het zich echt voordoet

Niet "kinderen willen geen Turks leren". Het probleem is specifieker en
ongemakkelijker:

1. **Het kind begrijpt wel, maar spreekt niet.** Passieve tweetaligheid is de
   norm, niet de uitzondering. De ouder praat Turks, het kind antwoordt in het
   Nederlands of Duits. Dat is geen onwil maar een drempel: produceren kost
   meer dan begrijpen, en in een gesprek is de snelste route altijd de taal
   van de school.
2. **De zomer is de deadline.** Eén keer per jaar, drie weken in Turkije, en
   dan blijkt wat er niet gezegd kan worden tegen een oma die geen Duits
   spreekt. Dat is het moment waarop ouders zoeken, en het moment waarop een
   kind een reden heeft.
3. **Weekendschool is er niet voor iedereen.** Afstand, geld, tijd, of de
   lesvorm past niet bij het kind. En wat er wél is, is vaak gemaakt voor
   kinderen in Turkije: boeken die uitgaan van Turks als eerste taal.
4. **De ouder weet niet waar te beginnen.** "Praat gewoon Turks tegen hem" is
   advies zonder handvat. Wat ontbreekt is een concrete, korte, dagelijkse
   vorm.

## Voor wie

| | Wie | Wat die wil |
|---|---|---|
| **Primair** | Kind 6–12 in NL/DE/FR/BE/AT/CH | Iets kunnen zeggen tegen familie, vandaag nog |
| **Primair** | Ouder 30–50, tweede/derde generatie | Een haalbare manier om de taal door te geven; eigen Turks is soms zelf wankel |
| **Secundair** | Jongere 13–17 | Zelf verder kunnen, zonder dat het kinderachtig voelt |
| **Secundair** | Grootouder in Turkije | Niets. Maar die is wél de reden dat het kind leert. |

De **betaler is de ouder, de gebruiker is het kind.** Dat is de kern van het
ontwerp: de app moet in twee minuten aan een ouder uitleggen wat het kind
krijgt, en daarna uit de weg gaan.

## Wat de app belooft

> Over drie weken zegt je kind iets in het Turks waar oma van opkijkt.

Eén belofte, concreet en nakijkbaar. Niet "leer Turks" (te groot, niet te
meten) en niet "speel een taalspel" (klinkt als tijdverdrijf).

## Hoe dat werkt — de vijf dingen die het doen

1. **Korte lessen.** Vijf tot acht minuten. Een les is af voordat de aandacht
   op is, niet erna.
2. **Produceren vanaf les één.** Niet alleen aantikken wat je herkent, maar
   typen, inspreken en bouwen. Het kind dat begrijpt maar niet spreekt heeft
   geen herkenningsoefening nodig.
3. **Gespreide herhaling.** Woorden komen terug wanneer ze dreigen te
   verdwijnen, niet wanneer de les het zegt.
4. **Audio door moedertaalsprekers.** Zie `learning-curriculum.md` §Audio.
5. **Gezinsopdrachten.** Eén per unit: iets wat je samen met een ouder of een
   grootouder dóet. Dat is het deel dat weekendschool niet heeft en een app
   wel kan.

## Wat dit níet is

- Geen vervanging van weekendschool of van thuis Turks praten. De app is het
  dagelijkse kwartier ertussen.
- Geen cursus Osmaans, geen Arabisch schrift. De leertaal is modern Turks in
  het Turkse Latijnse alfabet.
- Geen sociaal netwerk. Geen profielen die andere kinderen zien, geen chat.
- Geen huiswerkmachine. Geen aftelklok die een kind onder druk zet.

## Positionering

| | Wat ze doen | Waar wij anders zijn |
|---|---|---|
| Duolingo (Turks) | Gratis, enorm, gamified | Hun Turks-cursus gaat van Engels uit en is voor volwassen beginners. Geen diaspora-aanname: ze leren je "the apple is red", niet "dit is mijn tante" |
| Weekendschool / TRT-materiaal | Echte docenten, echt curriculum | Plaats- en tijdgebonden; materiaal gaat uit van Turks als eerste taal |
| Algemene kinder-taalapps | Mooi, speels | Turks zit er niet in, of als afgeleide van een Engelse cursus |
| **Dilimiz** | | Gemaakt voor het kind dat Turks hóort maar niet spreekt, met familiewoordenschat en de zomer als doel |

## MVP-afbakening

**Zit erin.** Onboarding (ouder + kind), alfabet-unit met de zes lastige
letters, drie inhoudsunits (groeten, ik-en-jij, familie), acht oefenvormen,
gespreide herhaling, voortgang per leerling, ouderoverzicht achter een
ouderpoort, offline gebruik, vier interfacetalen (NL/DE/FR/EN), badges zonder
tijdsdruk, één gezinsopdracht per unit, abonnementsmachine met gratis
proefperiode.

**Zit er niet in, met reden.**

| Weggelaten | Waarom |
|---|---|
| Meerdere profielen per toestel | Eén kind eerst. Twee profielen verdubbelen elke voortgangsvraag en de meeste gezinnen beginnen met één |
| Spraakherkenning met beoordeling | Speekoefening wel, score erop niet: Turkse kinderstem-herkenning is onbetrouwbaar en een onterechte "fout" is erger dan geen score |
| Verhalenbibliotheek | Pas waardevol boven ±300 woorden |
| Geschiedenis- en cultuurreeks | Eigen project. Zie `learning-curriculum.md` §Cultuur: het risico op fouten is hier het grootst |
| Webversie als product | De app gaat naar de winkels; de site is etalage |

## Hoe we weten of het werkt

Niet op downloads. Op deze drie:

1. **Les 3 gehaald binnen 48 uur** — zegt of de onboarding en de eerste les
   deugen. Faalt dit, dan is de rest niet interessant.
2. **Dag 7 nog actief** — zegt of de herhaling en de reeks werken.
3. **Proef → betaald** — zegt of de belofte geloofd wordt.

Darijaforkids staat na een halfjaar op 119 downloads bij een bewezen
productkwaliteit. De conclusie daar was dat het knelpunt bereik is en niet
product. Die les geldt hier vooraf: **een beter product lost een
distributieprobleem niet op.** De marktomvang is het enige echte argument om
dit te bouwen, en marktomvang moet nog in bereik worden omgezet.

## Risico's

| Risico | Hoe erg | Wat we doen |
|---|---|---|
| Fout of onnatuurlijk Turks in de lessen | Fataal voor vertrouwen bij ouders die zelf Turks spreken | Elke string door een moedertaalspreker/docent vóór publicatie. Zie `decisions.md` B-1 |
| Bereik, net als bij de eerste app | Hoog, bekend | Niet oplosbaar met code. Hoort in het marketingplan, niet hier |
| Culturele of politieke misstap | Hoog | Zie `learning-curriculum.md` §Cultuur en `decisions.md` B-3 |
| Tijd die van de eerste app afgaat | Zeker | Besluit van de eigenaar, vastgelegd in `darija-kids/docs/TWEEDE-APP.md` |
| Audio ontbreekt bij lancering | Middel | Synthese als tijdelijke terugval, zichtbaar gemarkeerd; geen lancering zonder echte audio voor units 0–3 |
