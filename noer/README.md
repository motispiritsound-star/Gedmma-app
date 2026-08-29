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
binnen. De server noemt bij het starten ook het adres waarop je hem vanaf een
tablet of telefoon op hetzelfde wifi-netwerk kunt openen — handig om te testen,
en goed om te weten dat iedereen op dat netwerk er dan bij kan. Er is geen installatie nodig: de app zelf heeft geen afhankelijkheden
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
letters structureel fout gaan, zodat je die samen kunt oefenen. Plus de
opnamestudio, waarover hieronder meer.

## Geluid

De app zoekt geluid in vier lagen. De eerste die iets oplevert wint:

1. **Een eigen opname** uit de studio, op dit apparaat.
2. **Een bestand** in `public/audio/`.
3. **Een externe reciteur** — alleen voor de Koran, en alleen als je die zelf
   aanzet in `public/data/bronnen.js`.
4. **De stem van het apparaat**, voor letters en losse woorden.

Levert geen van vieren iets op, dan blijft het stil en zegt het scherm dat.
Laag 4 komt bij de Koran nooit aan bod: recitatie is geen voorleesstem.

### Zelf inspreken — de beste optie

In het ouderscherm zit een **opnamestudio**. Daar spreek je de letters, de
woorden en de aya's in met je eigen stem, rechtstreeks in de browser. Je kind
hoort daarna een stem die het kent, en dat is pedagogisch beter dan welke
computerstem ook. Voor de Koran is het bovendien de enige nette manier.

Begin bij **Letters — de klank**: 28 opnames, ongeveer tien minuten werk. Dat
alleen al maakt het alfabet, de qaida-lessen en de spellen hoorbaar.

De opnames staan in IndexedDB op het apparaat zelf; er gaat niets naar een
server. Met **Opnames opslaan** krijg je er een zip van met dezelfde mappen als
`public/audio/`, zodat je ze kunt bewaren, naar een ander apparaat brengen, of
in de app zelf zetten zodat iedereen ze heeft.

### De stem van het apparaat

Zonder opnames leest het apparaat losse letters en woorden voor — als er een
Arabische stem geïnstalleerd is. Op telefoons en tablets is dat meestal zo, op
een laptop vaak niet. In het ouderscherm zit een knop **Hoor hoe "ba" klinkt**
die meteen laat zien wat dit apparaat ervan maakt.

De letterkaart heeft twee knoppen: **de klank** (بَ, "ba" — wat je nodig hebt om
te lezen) en **de naam** (بَاء, "baa"). Zonder die fatha spelt een voorleesstem
de letternaam in plaats van de klank.

### Recitatie ophalen

```bash
node tools/haal-recitatie.js --lijst                  # wie er klaarstaat
node tools/haal-recitatie.js --bron alafasy --proef   # één aya proberen
node tools/haal-recitatie.js --bron alafasy           # alles ophalen
```

Klaarstaande reciteurs: **alafasy** (Mishary Rashid Alafasy), **sudais**
(Abdurrahman As-Sudais), **husary_muallim** (de leraar-opname van Al-Husary,
langzaam en met ruimte om na te zeggen — voor kinderen vaak de beste),
**husary** en **minshawi**. Of geef zelf een adres op met `{soera}` en `{aya}`.

De 58 aya's komen terecht in `public/audio/koran/<soera>/<aya>.mp3`, waar de app
ze vanzelf oppakt — ook offline. Draai eerst `--proef`: dat kost één seconde en
zegt meteen of het adres klopt. De mapnamen in `bronnen.js` zijn opgeschreven
uit hoe die bron zijn bestanden ordent, niet ter plekke nagelopen.

Het script legt naast de bestanden een `bron.json` neer met de naam van de
reciteur. Daar leest het soerascherm de naamsvermelding uit — anders zou de app
moeten gokken op basis van de streaminstelling, en die zegt niets over wat er
gedownload is. Staat er nog geen recitatie, dan zegt het scherm dat ook.

Wil je streamen in plaats van downloaden, zet dan in `public/data/bronnen.js`
`reciteur: { aan: true, keuze: 'alafasy' }`. Dan werkt de Koran wel alleen mét
internet; gedownloade bestanden gaan altijd vóór op streamen.

Gedownloade recitatie belandt in een aparte cache (`noer-media`) die bij een
nieuwe uitgave blijft staan. De app zelf zit in een cache die dan wél wordt
opgeruimd — anders zou elke update tientallen megabytes weggooien die iemand
met de hand heeft opgehaald.

**Over toestemming.** Een recitatie is een auteursrechtelijk beschermde opname
van een mens. Dat een opname wereldwijd gebruikt wordt, is geen licentie. Of je
hem mag downloaden, meeleveren of streamen hangt af van de reciteur en de
uitgever. Dit script haalt op wat jij aanwijst; de afweging of dat mag is van
degene die de app uitgeeft. Voor eigen gebruik in huis of klas is dat een ander
verhaal dan voor een app in een appwinkel — zoek het uit vóór dat laatste, en
vermeld altijd wie er reciteert.

### Effectgeluidjes

Goed, fout en klaar worden in de browser zelf opgewekt met een oscillator. Daar
zijn geen bestanden voor nodig, en ze klinken overal hetzelfde.

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
  tools/haal-recitatie.js  haalt aya-opnames op bij een bron die jij kiest
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
      opnames.js         eigen opnames in IndexedDB
      zip.js             kleine zip-schrijver voor de export
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

## De promofilm

In [`promo/`](promo/) staat een promofilm van 1 minuut en 22 seconden:
`promo.html` speelt hem af in de browser, `DRAAIBOEK.md` bevat het draaiboek,
de boodschap aan ouders, de nasheed-tekst en een muziekbriefing.

```bash
node tools/film-opnemen.js            # liggend, 1280x720
node tools/film-opnemen.js --staand   # staand, voor sociale media
```

Dat schrijft een videobestand door een browser zichzelf te laten filmen. Zet je
een `nasheed.mp3` naast `promo.html`, dan loopt de film mee met de muziek.

De film gebruikt drie religieuze teksten en één aya. Laat die nakijken voordat
je hem uitgeeft; zie de laatste paragraaf van het draaiboek.

## Waar het naartoe kan

- Opnames van een reciteur en van een leerkracht die de letters voorzegt.
- Meeschrijven: de letter natrekken met je vinger.
- Luisteren en de goede letter aanwijzen, als de opnames er zijn.
- Meer soera's, en de rest van Djoez ʿAmma.
- Tadjwied voor de oudste groep: ghoenna, idghaam, qalqala.
- Een klasmodus, zodat een leerkracht meerdere kinderen kan volgen.
