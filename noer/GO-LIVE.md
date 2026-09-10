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
- [ ] **Vul de site in.** In `landing/` staat overal `noer@voorbeeld.nl`, en in
      `voorwaarden.html` en `privacy.html` licht geel op wat er nog in moet:
      bedrijfsnaam, KvK-nummer, btw-nummer, adres, hostingpartij, datums. Zie
      `landing/LEESMIJ.md`.
- [ ] **Laat de voorwaarden en de privacyverklaring nalezen.** Ze zijn
      geschreven door de bouwer van de app, niet door een jurist. Eén blik van
      iemand die dit vaker doet is genoeg.
- [ ] **Regel Mollie, een domein en een maildienst.** Zonder die drie kan er
      geen geld binnenkomen. De volgorde en de instellingen staan in
      `BETALEN.md`.

## Wat af is

**Werkt het?**
- [x] 49 controles op de leerinhoud, de server en de betaalkant (`npm test`),
      zonder installatie.
- [x] 21 doorloopstappen in een echte browser (`npm run test:browser`): elk
      scherm, elk spel, opnemen met een microfoon, offline recitatie, licht en
      donker, en de app één keer zonder en één keer mét abonnement.
- [x] 12 stappen over de koopweg (`node test/koopweg.js`): aanmelden,
      afrekenen, terugkomen, opzeggen, hervatten, uitloggen.
- [x] Elke test is nagelopen op of hij ook echt faalt zónder de fix.

**Kan er geld binnenkomen?**
- [x] Accounts met scrypt-wachtwoorden, ondertekende sessiekoekjes, een teller
      tegen het gokken van wachtwoorden.
- [x] Mollie: eerste betaling met machtiging, daarna een doorlopend
      abonnement. De stand komt altijd bij Mollie vandaan, dus een verzonnen
      webhook levert niets op, en dezelfde webhook twee keer geeft geen maand
      cadeau.
- [x] Opzeggen met één knop, zonder termijn, met behoud van de betaalde
      periode. Hervatten binnen die periode kost niets.
- [x] Een bevestigingsmail na de eerste betaling, met bedrag, termijn en hoe je
      opzegt. Ligt de maildienst eruit, dan gaat de betaling gewoon door en
      komt het in de log.
- [x] Een proefstand (`NOER_PROEF=1`) met een nepbank op de site zelf, om de
      hele weg te oefenen zonder geld.

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
- [x] Van het kind blijft alles in de browser: voortgang in localStorage,
      opnames in IndexedDB. Geen meetsoftware, geen verzoeken naar buiten —
      tenzij je zelf een gestreamde reciteur aanzet.
- [x] Op de server staat alleen wat een abonnement nodig heeft: een
      e-mailadres, een versleuteld wachtwoord, de betaalstand. Het colofon in
      de app en `privacy.html` zeggen allebei precies dat, en niet meer.
- [x] De pincode in het ouderscherm staat in de app zelf omschreven als een
      drempel, niet als beveiliging.

## Vandaag al online, gratis

De hele lijst hierboven gaat over de betaalde uitgave. Wil je alleen online
zijn, dan kan dat vandaag en zonder kosten:

```bash
node tools/statisch.js      # -> uit/, alles open, geen server
```

Sleep die map naar netlify.com/drop. Wat je dan nog moet invullen — je naam op
de privacypagina, een e-mailadres dat je leest, en het colofon — staat in
`ONLINE.md`, samen met wat erbij komt kijken als je later abonnementen aanzet.

## Neerzetten

Zolang je niets verkoopt, is de app een map met statische bestanden en doet
elke host het. Zodra er abonnementen zijn, moet er een server draaien — die
zit erbij, en heeft nog steeds geen enkele afhankelijkheid.

```bash
cd noer
npm test                                # eerst de controles
node tools/koran-bron.js --controleer   # wijkt de tekst af van de bron?
node server.js                          # de site op /, de app op /app/
```

De volledige handleiding — Mollie, het domein, systemd, Caddy, back-ups —
staat in `BETALEN.md`. Drie dingen om hier alvast op te letten:

1. **HTTPS is verplicht.** Zonder HTTPS werkt de service worker niet, weigert
   Mollie je webhook, en is een sessiekoekje niet veilig.
2. **Laat `.mp3`, `.webm` en `.m4a` als audio serveren.** Zet je een andere
   server ervoor, zorg dan dat een ontbrekend bestand een **404** geeft en niet
   je index-pagina — anders denkt de app dat er geluid is waar niets is.
3. **Zet een back-up op `gegevens/noer.json`.** Dat is je klantenbestand.

## Een nieuwe versie uitbrengen

1. Werk `versie` en `datum` bij in `public/js/versie.js`.
2. Hoog `APP` op in `public/sw.js` (`noer-app-v7` → `v8`). Zonder dat blijven
   bezoekers de oude versie zien. De cache met geluid (`noer-media`) blijft
   staan; die wordt met opzet niet opgeruimd.
3. `npm test && npm run test:browser`.
4. `node test/koopweg.js` met `NOER_PROEF=1`, als je aan de betaalkant zat.
5. Zet de nieuwe bestanden neer en herstart de server.

## Losse eindjes die geen blokkade zijn

- Er zit geen eigen lettertype in; de app gebruikt wat het apparaat heeft. Een
  meegeleverd Koran-lettertype (Amiri Quran) zou het Arabisch mooier maken,
  maar kost een paar honderd kilobyte.
- De app is Nederlandstalig. Er zit geen vertaallaag in.
- Zonder opnames of gedownloade recitatie blijft geluid beperkt tot de
  voorleesstem van het apparaat, en bij de Koran tot stilte. De opnamestudio
  in het ouderscherm is de snelste manier om dat op te lossen: 28 letters
  inspreken kost ongeveer tien minuten.
