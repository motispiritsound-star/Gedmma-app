# Noer

Arabisch leren lezen en korte soera's uit je hoofd leren — spelenderwijs, voor
kinderen van 5 tot en met 13 jaar. Alles in het Nederlands, alles op het
apparaat zelf.

```
letters → vormen → harakat → lettergrepen → woorden → aya's → soera uit je hoofd
```

## Meteen proberen

```bash
cd noer
npm start
```

Open **http://localhost:5173**, vul een naam en een leeftijd in en je bent
binnen. Er is geen installatie nodig: de app zelf heeft geen afhankelijkheden
en geen buildstap, en er is geen account.

```bash
npm test          # controles op de leerinhoud — draait zonder installatie
npm run test:browser   # loopt de hele app door in een echte browser
```

De browsertest heeft Playwright nodig (`npm install`, en `npm start` in een
ander venster). Hij maakt een profiel aan, opent elk scherm, speelt elk spel,
en let op fouten in de console en op lege of kapotte schermen.

Op een tablet of telefoon kun je de app via het browsermenu op je beginscherm
zetten. Hij werkt daarna ook zonder internet.

## Delen zonder server

```bash
node tools/bundel.js --demo
```

Dat schrijft **noer-demo.html**: de hele app in één bestand van ongeveer 200 kB.
Alle modules, alle stijlen en het icoon zitten erin; je kunt het mailen, op een
USB-stick zetten of ergens neerleggen, en het opent gewoon door erop te
dubbelklikken. Zonder `--demo` krijg je hetzelfde bestand, maar leeg.

Met `--demo` staat er één ingevuld voorbeeldprofiel klaar (vijf lessen af, twee
soera's uit het hoofd, een week oefentijd en drie letters die nog misgaan),
zodat iemand die het opent meteen een app ziet die geleefd heeft. Heeft de
bezoeker al eens geoefend, dan blijft die voortgang met rust.

Andere vlaggen: `--fragment` laat `<html>` en `<head>` weg om de app ergens in
te bedden, `--titel` zet de titel, `--uit` het pad.

De bundelaar geeft elke module zijn eigen scope en haalt ze lazy op, dus de
importgraaf mag geen kringetje bevatten. Daarom staat `route.js` los van
`app.js`: schermen navigeren via `route.js` en hoeven niet terug te grijpen
naar de router die ze zelf tekent.

## Wat er in zit

**Het alfabet.** Alle 28 letters met hun vier vormen (los, begin, midden, eind),
de klank in Nederlandse woorden uitgelegd, een ezelsbruggetje per letter, een
voorbeeldwoord met plaatje, en de uitspraakplaats (keel, tong, lippen, holte).
De zes letters die niet naar links verbinden — ا د ذ ر ز و — worden apart
behandeld, want daar gaat het bij kinderen het vaakst mis.

**Leren lezen, in tien stappen.** De opbouw van de Qaida Noeraniyah:

| | Les | Wat je leert |
|---|---|---|
| 1 | De losse letters | alle 28, één voor één |
| 2 | Letters die op elkaar lijken | zelfde romp, andere stippen |
| 3 | Letters aan het begin van soera's | alif-laam-miem en de rest |
| 4 | De harakat | fatha, kasra, damma |
| 5 | Tanween | an, in, oen |
| 6 | Madd | de klank rekken met ا و ي |
| 7 | Leen | de zachte "au" en "ai" |
| 8 | Soekoen | een letter zonder klinker |
| 9 | Sjadda | één letter, twee keer |
| 10 | Alles door elkaar | lezen zoals in de Koran |

De tien lessen staan op een leerpad: een slingerend pad met een bol per les,
waarop je in één blik ziet waar je bent, wat af is en wat nog op slot zit. Elke
les heeft een oefenblad zoals in het boekje én een spel. Een les gaat pas open
als de vorige twee sterren heeft.

**De Koran.** Al-Faatiha en elf korte soera's uit Djoez ʿAmma. Per soera drie
manieren om ermee bezig te zijn: lezen, de betekenis woord voor woord, en uit
je hoofd leren in drie rondes waarin steeds meer woorden verdwijnen. Plus een
puzzel waarin je de woorden van een aya op volgorde zet.

**Woorden.** Tien thema's — groeten, kleuren, tellen, dieren, gezin, lichaam,
eten, moskee, school, natuur — met een geheugenspel en een betekenisquiz.

**Belonen.** Punten, tien niveaus, dertien badges, sterren per les en een
dagreeks. Het dagdoel is tien goede antwoorden: klein genoeg om elke dag te
halen. De ring om de avatar laat zien hoe ver het volgende niveau nog is.

**Feedback die blijft staan.** Na een antwoord schuift er onderin een strook
omhoog die zegt wat er goed of fout ging, en bij een fout staat het juiste
antwoord erbij. Het kind gaat pas verder als het zelf op "Doorgaan" tikt. Dat
is trager dan automatisch doorspoelen, en het is precies het moment waarop
iemand iets leert.

**Meegroeien met de leeftijd.** Bij 5 t/m 7 jaar zijn de letters en knoppen
groter en zie je alleen de kortste soera's en de eenvoudigste thema's. Bij 8
t/m 10 komt er meer bij, bij 11 t/m 13 alles. De leeftijd staat per kind in het
ouderscherm.

**Voor ouders.** Achter een pincode: per kind de oefentijd van de afgelopen
week, hoeveel goed en fout, welke lessen af zijn, en — het nuttigste — welke
letters structureel fout gaan, zodat je die samen kunt oefenen.

## Geluid

De app zoekt geluid in deze volgorde:

1. **Een eigen opname** uit `public/audio/`. Zie de `LEESMIJ.md` in elke map
   voor de namen die de app verwacht.
2. **De stem van het apparaat**, voor losse letters en woorden — als er een
   Arabische stem geïnstalleerd is.
3. **Stilte**, met een nette melding in beeld.

Voor de Koran wordt stap 2 nooit gebruikt. Een voorleesstem is geen recitatie;
zonder echte opname blijft het stil. Wil je een externe reciteur gebruiken, vul
die dan in bij `reciteur` in `public/data/bronnen.js` — en gebruik alleen een
bron die je mag gebruiken.

Effectgeluidjes (goed, fout, klaar) worden in de browser zelf opgewekt, dus
daar zijn geen bestanden voor nodig.

## Nog te doen vóór je dit uitgeeft

**De Koran-tekst moet nagekeken worden.** De Arabische tekst in
`public/data/koran.js` is met zorg overgenomen, maar niet geverifieerd tegen
een gecertificeerde bron. Vervang hem door een geverifieerde dataset
(bijvoorbeeld de Uthmani-tekst van Tanzil) en laat hem nakijken door iemand met
een idjaza. `npm test` controleert alleen de structuur — aantallen aya's,
volgorde, of elke aya een vertaling heeft — en zegt niets over de juistheid van
de tekst zelf.

Hetzelfde geldt voor de Nederlandse betekenissen: dat is uitleg van de
betekenis, geen vertaling van de Koran. Dat staat ook in de app.

## Privacy

Alles staat in de `localStorage` van de browser: profielen, punten, fouten,
oefentijd. Er is geen server, geen account, geen reclame en geen tracker. De
knop "Alle gegevens wissen" in het ouderscherm maakt het apparaat weer leeg.

De pincode in het ouderscherm is een drempel voor kleine handjes, geen
beveiliging — hij staat gewoon op het apparaat.

## Hoe het in elkaar zit

Losse ES-modules, geen framework, geen buildstap. Wat je in de bestanden ziet,
is wat de browser draait.

```
noer/
  server.js              kleine statische server, zonder afhankelijkheden
  tools/bundel.js        bouwt de hele app tot één HTML-bestand
  tools/demo-zaad.js     het voorbeeldprofiel voor de demo-bundel
  test/run.js            controles op de leerinhoud
  test/browser.js        doorloop van de hele app in een echte browser
  public/
    index.html           de hele schil
    sw.js                service worker: werkt offline
    data/                de leerinhoud, los van de code
      letters.js         28 letters, vormen, klanken, voorbeelden
      harakat.js         de tekens en wat ze doen met de klank
      qaida.js           de tien lessen (deels berekend uit letters + tekens)
      koran.js           soera's met uitspraak en betekenis
      woorden.js         woordenschat per thema
      badges.js          badges, elk met de test die hem verdient
      bronnen.js         waar geluid vandaan komt
    js/
      app.js             router en schil
      opslag.js          profielen en voortgang in localStorage
      geluid.js          opname → apparaatstem → stilte, plus effectgeluidjes
      punten.js          punten, niveaus, badges, zwakke punten
      ui.js              kleine DOM-hulpjes
      route.js           navigeren, los van app.js om een importkringetje te vermijden
      iconen.js          de icoonset: één raster, één lijndikte
      schermen/          één bestand per scherm
      spellen/           basis.js draagt de zes spellen
    stijl/               basis.css (schil) en leren.css (leren en spelen)
```

Over de vormgeving: het palet, de maten en de schaduwen staan als CSS-variabelen
boven in `basis.css`. Elke kleur staat er één keer, met `light-dark()` voor de
lichte en de donkere waarde, zodat de twee thema's niet uit elkaar kunnen lopen;
kiest iemand zelf een thema, dan zet dat `color-scheme` en volgt de rest. Het
achtpuntige stermotief is één SVG die als masker wordt gebruikt, zodat hij zijn
kleur uit die variabelen haalt en in beide modi klopt. Iconen zijn met de hand
getekend op één raster van 24 met dezelfde lijndikte; ze erven hun kleur van de
tekst eromheen. Emoji blijft waar het inhoud is — dieren, kleuren, badges — en
niet in knoppen en menu's.

De leerinhoud staat los van de code. Wil je een soera toevoegen, een thema
uitbreiden of de lessen anders opbouwen, dan hoef je alleen in `data/` te zijn —
`npm test` zegt daarna of het klopt.

## Waar het naartoe kan

- Opnames van een reciteur en van een leerkracht die de letters voorzegt.
- Meeschrijven: de letter natrekken met je vinger.
- Luisteren en de goede letter aanwijzen, als de opnames er zijn.
- Meer soera's, en de rest van Djoez ʿAmma.
- Tadjwied voor de oudste groep: ghoenna, idghaam, qalqala.
- Een klasmodus, zodat een leerkracht meerdere kinderen kan volgen.
