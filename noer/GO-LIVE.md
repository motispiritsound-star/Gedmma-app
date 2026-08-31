# Klaar voor go-live?

Deze lijst is bedoeld om af te vinken. Wat er staat als **gedaan**, is
gecontroleerd en er zit een test op; wat er staat als **jouw beslissing**, kan
niemand anders voor je nemen.

## Beslissingen die nog van jou zijn

- [ ] **Laat de Koran-tekst nalezen.** De tekst is overgenomen uit een bron en
      wordt bewaakt door een vingerafdruk, maar of die bron deugt is een
      oordeel, geen berekening. Laat het nakijken door iemand met kennis van
      zaken. Zie `public/data/koran-bron.json` voor welke bron en welke datum.
- [ ] **Beslis over recitatie.** Er zit geen audio in de app. Wil je die
      meeleveren, dan is de licentie jouw afweging: een recitatie is een
      beschermde opname, en dat een opname wereldwijd gebruikt wordt is geen
      toestemming. Zie de sectie *Recitatie ophalen* in de README.
- [ ] **Vul `public/js/versie.js` in.** `houder` en `contact` staan nu leeg;
      die verschijnen in het colofon dat een ouder te zien krijgt.
- [ ] **Kies een licentie voor de code.** Er ligt bewust geen LICENSE-bestand:
      dat is jouw keuze. Zonder licentie mag niemand er iets mee, ook niet
      als de code openbaar staat.
- [ ] **Laat de promofilm nakijken.** Daar staan drie overleveringen en één
      aya in. Zie de laatste paragraaf van `promo/DRAAIBOEK.md`.

## Wat af is

**Werkt het?**
- [x] 26 controles op de leerinhoud en de server (`npm test`), zonder installatie.
- [x] 19 doorloopstappen in een echte browser (`npm run test:browser`): elk
      scherm, elk spel, opnemen met een microfoon, offline recitatie, licht en
      donker.
- [x] Elke test is nagelopen op of hij ook echt faalt zónder de fix.

**Kan het geïnstalleerd worden?**
- [x] Manifest met een `maskable` icoon voor Android en een
      `apple-touch-icon.png` voor iPhone — zonder dat laatste blijft het
      beginscherm daar leeg.
- [x] `start_url` en `scope` zijn relatief, dus hosting onder een submap
      (`example.nl/noer/`) werkt. Er is een test die dat echt uitprobeert.
- [x] Service worker: de app werkt offline, en gedownloade recitatie overleeft
      een nieuwe uitgave doordat die in een aparte cache staat.

**Wat ziet een bezoeker?**
- [x] Een deelbeeld (1200×630) en Open Graph-tags, dus een gedeelde link toont
      een nette voorvertoning.
- [x] Een colofon op `#/over`: wat er met gegevens gebeurt, waar de tekst
      vandaan komt, welke versie. Bereikbaar vanaf het startscherm en het
      ouderscherm.
- [x] Gaat er iets stuk, dan verschijnt er een scherm met een weg terug in
      plaats van een wit vlak.

**Privacy**
- [x] Alles blijft in de browser: voortgang in localStorage, opnames in
      IndexedDB. Geen server, geen account, geen meetsoftware, geen verzoeken
      naar buiten — tenzij je zelf een gestreamde reciteur aanzet.
- [x] De pincode in het ouderscherm staat in de app zelf omschreven als een
      drempel, niet als beveiliging.

## Neerzetten

De app is een map met statische bestanden. Elke host doet het: een eigen
server, GitHub Pages, Netlify, Cloudflare Pages, een map bij je provider.

```bash
cd noer
npm test                      # eerst de controles
node tools/koran-bron.js --controleer   # wijkt de tekst af van de bron?
```

Zet daarna de **inhoud van `public/`** neer als de map die je bezoekers zien.
Meer is er niet: geen buildstap, geen server-side code, geen database.

Drie dingen om op te letten bij de host:

1. **HTTPS is verplicht.** Zonder HTTPS werkt de service worker niet, en dan
   ook geen offline-gebruik en geen installatie op het beginscherm.
2. **Laat `.mp3`, `.webm` en `.m4a` als audio serveren.** Sommige hosts geven
   onbekende types terug als `application/octet-stream`; de app kijkt daar
   overheen, maar HTML terugkrijgen op een ontbrekend bestand breekt hem wel.
   Zorg dat een ontbrekend bestand een **404** geeft en niet je index-pagina.
3. **Cache-instellingen.** `sw.js` en `index.html` moeten kort of niet
   gecached worden door de host; de rest mag lang, want de service worker
   regelt het zelf.

## Een nieuwe versie uitbrengen

1. Werk `versie` en `datum` bij in `public/js/versie.js`.
2. Hoog `APP` op in `public/sw.js` (`noer-app-v5` → `v6`). Zonder dat blijven
   bezoekers de oude versie zien. De cache met geluid (`noer-media`) blijft
   staan; die wordt met opzet niet opgeruimd.
3. `npm test && npm run test:browser`.
4. Zet de nieuwe `public/` neer.

## Losse eindjes die geen blokkade zijn

- Er zit geen eigen lettertype in; de app gebruikt wat het apparaat heeft. Een
  meegeleverd Koran-lettertype (Amiri Quran) zou het Arabisch mooier maken,
  maar kost een paar honderd kilobyte.
- De app is Nederlandstalig. Er zit geen vertaallaag in.
- Zonder opnames of gedownloade recitatie blijft geluid beperkt tot de
  voorleesstem van het apparaat, en bij de Koran tot stilte. De opnamestudio
  in het ouderscherm is de snelste manier om dat op te lossen: 28 letters
  inspreken kost ongeveer tien minuten.
