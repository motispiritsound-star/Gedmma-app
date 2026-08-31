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
| Rekenen | optellen, aftrekken, tafels, delen, klokkijken, geld, meten, breuken, procenten, verhaaltjessommen, getalbegrip, omtrek & oppervlakte, verhoudingen |
| Taal | spelling, werkwoordspelling, woordenschat, ontleden, leestekens, spreekwoorden |
| Begrijpend lezen | tien teksten met vragen, oplopend in moeilijkheid |
| Engels | woorden (beide richtingen), zinnen aanvullen, onregelmatige werkwoorden |
| Wereldoriëntatie | topografie NL, de wereld, geschiedenis, natuur & techniek, samenleven |
| Studievaardigheden | tabellen & grafieken, kaartlezen, informatie zoeken |

Samen 31 onderwerpen in 6 vakken.

Bij **elk** fout antwoord verschijnt meteen een uitleg in kindertaal — niet
alleen "fout", maar waaróm.

### Fouten komen terug

Een vraag die fout ging, verschijnt na een dag opnieuw — verspreid tussen de
gewone vragen, met het label "Herhaling". Gaat hij dan goed, dan komt hij na
drie dagen nog eens, daarna na een week, daarna na drie weken. Pas dan is hij
klaar. Gaat hij weer fout, dan begint de reeks opnieuw.

Dit is het verschil tussen "geoefend" en "geleerd": zonder herhaling ben je een
som die je fout had over drie dagen gewoon weer kwijt. Het kind hoeft er niets
voor te doen; de herhalingen zitten vanzelf in de volgende ronde. Het
ouderdashboard laat zien wat er klaarstaat.

### Voorlezen

Elke vraag heeft een luidsprekerknop die hem hardop leest, met de stem die al
op het toestel zit — dus offline en gratis. Rekentekens worden uitgesproken
in plaats van gespeld: "8 × 7 = ?" wordt "8 keer 7 is hoeveel?".

Voor groep 3 en voor kinderen met dyslexie is dit het verschil tussen wel of
niet mee kunnen doen: het rekenen is niet het probleem, het lezen van de vraag
is dat.

### Een herinnering per dag

De ouder kiest in het dashboard een tijdstip; de app plant één melding per dag
lokaal in. Er gaat niets naar een server en er wordt niemand gevolgd — dat is
precies waarom dit mag bij een app voor kinderen.

### Filmpjes

Negen korte filmpjes van ongeveer een halve minuut: vier motiverende (waarom
fouten maken helpt, je brein is een spier, volhouden) en vijf met uitleg bij een
onderwerp ('t kofschip, tafels, breuken, procenten, begrijpend lezen).

Ze worden **in de app zelf getekend en geanimeerd** in plaats van als video
afgespeeld. Vos wisselt van uitdrukking, de tekst schuift in beeld en de
rekenstappen verschijnen één voor één. Daardoor wegen ze niets, werken ze
offline en kosten ze geen hosting. Zodra er echt getekende video's zijn, zet je
de URL in het filmpje en speelt de speler die af.

**Wat hier níet zit:** echte gefilmde of getekende animatievideo. Dat is
productiewerk (illustrator, stemacteur, montage) en geen code.

### Account en abonnement

Oefenen kan zonder account — dat blijft zo. Een ouderaccount heb je alleen
nodig voor een abonnement. Het oudergedeelte zit achter een rekenslotje, zodat
een kind niet zomaar bij de instellingen komt.

Het instapaanbod is **een week gratis, daarna €4,99 per maand**, automatisch
verlengd tot je opzegt. Opzeggen doe je in de abonnementeninstellingen van je
telefoon — de app linkt er rechtstreeks naartoe.

- [`PRIJZEN.md`](PRIJZEN.md) — het plan en waarom elk getal zo gekozen is
- [`BETALINGEN.md`](BETALINGEN.md) — hoe het geld automatisch op een zakelijke
  rekening komt, en wat je daarvoor moet instellen

### Waar de gegevens staan

Alles staat in de lokale opslag van het toestel (`AsyncStorage`). Er is geen
server, geen account, geen e-mailadres, geen tracking en geen advertentie. Dat
maakt de app bruikbaar zonder internet, houdt de kosten laag en beperkt de
AVG-verplichtingen tot een minimum — belangrijk, want de gebruikers zijn
kinderen.

## Vormgeving

De app leunt op de patronen die je kent uit de best draaiende leerapps, omdat
ze werken — niet omdat ze mooi zijn:

- **Tastbare knoppen.** Elke knop heeft een donkere rand eronder die verdwijnt
  als je hem indrukt. Je ziet de knop zakken; dat maakt tikken op een telefoon
  bevestigend.
- **Een leerpad in plaats van een lijst.** Binnen een vak staan de onderwerpen
  als route, met een ring die het niveau toont, sterren eronder, en een
  wippende bubbel bij het onderwerp dat de app nu aanraadt. Een lijst laat
  alles even belangrijk lijken; een pad laat zien waar je bent.
- **Een weekstrip.** Zeven bolletjes van maandag tot zondag, aangevinkt op de
  dagen dat er geoefend is. Dat leest sneller dan een getal naast een vlammetje.
- **Een afsluitscherm dat iets viert.** Drie tegels (goed, score, tijd),
  confetti bij een foutloze ronde, en een aparte melding als het niveau
  omhoog ging.
- **Getekende iconen en een eigen app-icoon**, gemaakt uit dezelfde mascotte —
  zie `tools/maak-iconen.mjs`, dat de PNG's uit één SVG rendert.
- **Rustig als dat gevraagd wordt.** Zet het toestel "verminder beweging" aan,
  dan stoppen de sier-animaties; alles blijft bedienbaar.

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
├── src/ui/                  thema, mascotte, iconen en componenten
├── tools/                   iconen genereren uit de mascotte-SVG
└── test/                    node:test over src/core
```

`src/core` importeert bewust niets uit React Native. Daardoor draait de hele
leerlogica in gewone Node en is die volledig te testen zonder simulator.

## Wat de app anders doet dan Squla

| | Squla (aug 2026) | Slimvos |
| --- | --- | --- |
| Goedkoopste prijs | €10,99 p/m bij een jaarabonnement (~€132 per jaar) | €39,99 per jaar (€3,33 p/m) |
| Maandprijs | €16,99 per kwartaalabonnement | €4,99, eerste week gratis |
| Opzeggen | een maand opzegtermijn | wanneer je wilt, in de winkelinstellingen |
| Gratis | 7 dagen proberen | rekenen blijft gratis, permanent |
| Account | verplicht om te beginnen | pas nodig om te betalen |
| Internet | nodig | volledig offline |
| Uitleg bij fout | beperkt | altijd, bij elke vraag |
| Niveau | grotendeels per leerjaar | adaptief per onderwerp |
| Gegevens van je kind | op een server | alleen op het toestel |

Squla-prijzen van augustus 2026; controleer ze voordat je ermee adverteert.
De volledige onderbouwing staat in [`PRIJZEN.md`](PRIJZEN.md).

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

- **Echt betalen.** De hele abonnementsstroom zit erin — proefweek, automatisch
  verlengen, opzeggen, toegangsregels, de datum van de eerste afschrijving —
  maar er wordt niets afgeschreven. De koppeling met de App Store en Google Play
  moet nog gemaakt worden; zie [`BETALINGEN.md`](BETALINGEN.md).
- **Een echte server achter het account.** Registreren, inloggen en wachtwoord
  vergeten werken, maar tegen lokale opslag. Alles loopt via één poort
  (`AuthPoort`), dus overstappen op Supabase of Firebase is één bestand.
- **Gefilmde video.** De filmpjes worden in de app getekend; echt
  animatiemateriaal is productiewerk.
- **Geluid.** Er is haptische feedback, maar geen audio.
- **Synchroniseren tussen toestellen.** Kan alleen mét een backend, en dat
  botst met de privacykeuze hierboven. Een export/import-bestand is een
  tussenoplossing.
- **Redactionele controle.** De vragen zijn zorgvuldig opgesteld maar niet
  door een leerkracht nagekeken. Doe dat vóór de lancering.

## Hoe dit getest is

- `npm test` — 89 tests: niveaustappen, streaks, XP, de sessiestroom, badges,
  de winkel, profielmigratie, de abonnementsregels (gratis limiet, proefperiode,
  opzeggen, verlopen), invoercontrole, de filmpjes, de weekstrip en het
  herhaalsysteem (intervallen, terugvallen na een nieuwe fout, de bak die niet
  volloopt, en dat herhalingen verspreid in de ronde staan). Daarnaast een contenttest
  die per onderwerp op elk van de vijf niveaus 60 vragen genereert en
  controleert dat het goede antwoord tussen de opties staat, dat er geen dubbele
  opties zijn en dat er geen `undefined` of `NaN` in de tekst sluipt.
- `npm run typecheck` — TypeScript in strict mode over de hele app.
- Een browsertest die de app echt doorloopt: profiel aanmaken, een ronde van
  tien vragen spelen, het scorescherm, de voortgang, een filmpje afspelen en
  doorspoelen, de beloningen, het ouderslot openen, een account aanmaken, een
  proefperiode starten, en of alles bewaard blijft na herladen.

De app is nog niet op een fysiek toestel getest — dat is stap 1 in
[`LANCEREN.md`](LANCEREN.md).
