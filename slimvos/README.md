# Slimvos 🦊

Oefenen voor groep 3 tot en met 8 — rekenen, taal, begrijpend lezen, Engels en
wereldoriëntatie — in een app voor iOS en Android. Gebouwd met Expo (React
Native), offline-first en zonder account.

> **Status:** werkende MVP. Alles in dit document dat de app doet, doet de app
> ook echt; onderdelen die er nog niet zijn staan onder [Wat er nog niet is](#wat-er-nog-niet-is).

## Snel starten

```bash
cd slimvos
npm install
npm start          # scan de QR-code met Expo Go op je telefoon
```

Andere commando's:

```bash
npm test           # 34 tests op de leerlogica en de vragen
npm run typecheck  # TypeScript over de hele app
npm run web        # in de browser, handig om snel te klikken
npm run demo       # bouwt demo/slimvos-demo.html: één bestand, geen server
```

## Op je computer proberen

Twee manieren, allebei zonder developer-account:

**1. De ontwikkelversie** — je ziet je wijzigingen meteen terug.

```bash
cd slimvos
npm install
npm run web
```

De browser opent vanzelf op `http://localhost:8081`. Maak het venster smal, of
zet in de ontwikkelaarstools een telefoonformaat aan, dan zie je de app zoals
hij op een toestel staat.

**2. Eén los bestand** — handig om aan iemand anders te geven.

```bash
npm run demo
```

Dat maakt `demo/slimvos-demo.html`: de hele app in één bestand van ongeveer
1,2 MB, inclusief alle JavaScript en plaatjes. Dubbelklik het en het draait —
geen server, geen internet, geen installatie. Op een breed scherm staat de app
in een nagebootst toestel; op een telefoon vult hij het scherm.

De voortgang wordt in beide gevallen in de browser bewaard (`localStorage`),
niet in de app-opslag van je telefoon. Het zijn dus losse profielen.

## Hoe de app werkt

```
kind kiest naam + groep
        ↓
startscherm: één grote "Ga verder"-knop met het onderwerp dat nu het nuttigst is
        ↓
ronde van 10 vragen  →  direct nakijken + uitleg bij elk antwoord
        ↓
niveau, XP, munten, streak en sterren worden bijgewerkt
        ↓
ouderdashboard laat zien wat goed gaat en wat aandacht vraagt
```

### Adaptief niveau

Elk onderwerp heeft vijf niveaus. Een kind start op het niveau dat bij zijn
groep hoort en schuift daarna vanzelf op:

| Gebeurtenis | Gevolg |
| --- | --- |
| 4 goede antwoorden op rij | niveau omhoog (max 5) |
| 2 foute antwoorden op rij | niveau omlaag (min 1) |
| één losse fout | geen gevolg |

Binnen een ronde staat ongeveer 70% van de vragen op het huidige niveau, 15%
eronder en 15% erboven. Zo blijft het haalbaar én wordt er steeds getest of het
volgende niveau al binnen bereik is.

Sterren (0–3) laten zien hoe goed een onderwerp beheerst wordt. Ze vragen zowel
een hoog niveau als genoeg goede antwoorden, en gaan nooit meer omlaag.

### Vragen

De vragen worden **gegenereerd**, niet uit een vaste lijst getrokken. Voor
rekenen levert dat praktisch oneindig veel sommen op; voor taal, Engels en
wereldoriëntatie worden vragen samengesteld uit woord- en feitenbanken, met
afleiders uit dezelfde bank (zodat gokken op "welk antwoord ziet er raar uit"
niet werkt).

| Vak | Onderwerpen |
| --- | --- |
| Rekenen | optellen, aftrekken, tafels, delen, klokkijken, geld, meten, breuken, procenten, verhaaltjessommen |
| Taal | spelling, werkwoordspelling, woordenschat, ontleden |
| Begrijpend lezen | teksten met vragen, oplopend in moeilijkheid |
| Engels | woorden (beide richtingen), zinnen aanvullen |
| Wereldoriëntatie | topografie, geschiedenis, natuur & techniek |

Bij **elk** fout antwoord verschijnt meteen een uitleg in kindertaal — niet
alleen "fout", maar waaróm.

### Waar de gegevens staan

Alles staat in de lokale opslag van het toestel (`AsyncStorage`). Er is geen
server, geen account, geen e-mailadres, geen tracking en geen advertentie. Dat
maakt de app bruikbaar zonder internet, houdt de kosten laag en beperkt de
AVG-verplichtingen tot een minimum — belangrijk, want de gebruikers zijn
kinderen.

## Structuur

```
slimvos/
├── app/                     schermen (expo-router, bestandspad = route)
│   ├── _layout.tsx          navigatie + AppProvider
│   ├── welkom.tsx           onboarding: naam, groep, maatje
│   ├── (tabs)/              oefenen · voortgang · beloningen · ouders
│   ├── vak/[vakId].tsx      onderwerpen binnen één vak
│   └── oefenen/[onderwerpId].tsx   de quiz zelf
├── src/core/                pure logica, geen React Native — hier zit de test op
│   ├── content/             curriculum + vraaggeneratoren per vak
│   └── engine/              niveau, punten, sessie, profiel, badges, winkel
├── src/state/               AsyncStorage + React context
├── src/ui/                  thema en gedeelde componenten
└── test/                    node:test over src/core
```

`src/core` importeert bewust niets uit React Native. Daardoor draait de hele
leerlogica in gewone Node en is die volledig te testen zonder simulator.

## Wat de app anders doet dan Squla

| | Squla | Slimvos |
| --- | --- | --- |
| Prijs | ~€11,95 per maand | doel: €3–4 per maand, één abonnement voor het hele gezin |
| Account | verplicht, met e-mailadres | geen account, direct beginnen |
| Internet | nodig | volledig offline |
| Uitleg bij fout | beperkt | altijd, bij elke vraag |
| Niveau | grotendeels per leerjaar | adaptief per onderwerp |
| Gegevens van je kind | op een server | alleen op het toestel |

Het prijspunt is een aanname, geen belofte: die keuze hangt af van wat de
kosten (stores, marketing, content) uiteindelijk blijken te zijn.

## Over de naam

**Slimvos** — een vos staat voor slim zijn, is als mascotte meteen duidelijk
voor kinderen, en "slim" is precies wat een ouder voor zijn kind wil. De naam
is één woord, kort genoeg voor een app-icoon en niet te verwarren met een
schoolmethode.

Afgevallen kandidaten en waarom:

| Naam | Waarom niet |
| --- | --- |
| Bolleboos | `bolleboos.be` is al een educatief oefenplatform voor de basisschool, en Bolleboos is ook een bestaande leesmethode-serie |
| Pienter | Pienter is een wiskundemethode van uitgeverij VAN IN, en `gopienter.nl` bestaat al |
| Slimleren | bestaat al (`slimleren.nl`) |

Dit is een snelle controle op zoekresultaten, **geen merkenonderzoek**. Doe
vóór de lancering een echte check in het Benelux-merkenregister (BOIP) en op
domeinnaambeschikbaarheid.

## Wat er nog niet is

Bewust buiten deze eerste versie gehouden:

- **Betalen.** Er zit geen abonnement of in-app-aankoop in. Zie `LANCEREN.md`
  voor hoe dat eruit zou kunnen zien.
- **Geluid en animaties.** Er is haptische feedback, maar geen audio.
- **Eigen illustraties.** De app gebruikt nu emoji; echte tekeningen en een
  getekende mascotte Vos zijn een ontwerpklus op zich.
- **Voorlezen van vragen.** Belangrijk voor groep 3 en voor kinderen met
  dyslexie; vraagt een text-to-speech-integratie.
- **Synchroniseren tussen toestellen.** Kan alleen mét een backend, en dat
  botst met de privacykeuze hierboven. Een export/import-bestand is een
  tussenoplossing.
- **Redactionele controle.** De vragen zijn zorgvuldig opgesteld maar niet
  door een leerkracht nagekeken. Doe dat vóór de lancering.

## Hoe dit getest is

- `npm test` — 34 tests op de leerlogica: niveaustappen, streaks, XP, de
  sessiestroom, badges, de winkel en de profielmigratie. Daarnaast een
  contenttest die per onderwerp op elk van de vijf niveaus 60 vragen genereert
  en controleert dat het goede antwoord tussen de opties staat, dat er geen
  dubbele opties zijn en dat er geen `undefined` of `NaN` in de tekst sluipt.
- `npm run typecheck` — TypeScript in strict mode over de hele app.
- Een browsertest die de app echt doorloopt: profiel aanmaken, een ronde van
  tien vragen spelen, het scorescherm, de voortgang, het ouderdashboard, de
  beloningen, en of alles bewaard blijft na herladen.

De app is nog niet op een fysiek toestel getest — dat is stap 1 in
[`LANCEREN.md`](LANCEREN.md).
