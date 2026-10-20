# Voor wie hier meewerkt — Dilimiz

Turks leren voor kinderen en gezinnen uit de Turkse diaspora in Europa.
`Dilimiz` is Turks voor "onze taal".

De achtergrond staat in `docs/`. Dit bestand is wat je moet weten vóórdat je
iets aanraakt.

---

## 1. De drie dingen die je nooit doet

**Niets wijzigen in `../darija-kids/`.** Dat is een alleen-lezen kopie van
Darijaforkids, de app waar de techniek van komt. Hij staat er om naar te
kijken, niet om in te werken. Wie die app wil veranderen doet dat in zijn eigen
repository.

**Niets kopiëren van zijn merk.** Geen naam, geen logo, geen kleur, geen
lettertype, geen schermtekst, geen mascotte, geen lesmateriaal.
`src/merk/merk.test.ts` meet dat na — niet uit symboliek, maar omdat een
zoek-en-vervang die één hex-waarde laat staan precies is hoe twee apps op
elkaar gaan lijken.

**Geen `text-transform` op iets wat Turks bevat.** `text-transform: uppercase`
maakt van een `i` een `I` en niet een `İ` — precies de letter die deze app
onderwijst. Wil je hoofdletters: `naarHoofd()` uit `src/engine/turks.ts`.

## 2. De vorm van het project

```
src/
  merk/        Naam, kleuren, logo, winkel-ids.   Eén bestand verandert bij een naamkeuze
  i18n/        Interfaceteksten: nl, de, fr, en.  GEEN Turkse cursusinhoud
  content/     De Turkse cursus.                  GEEN interfaceteksten
  engine/      Herhaling, voortgang, oefeningen, toegang, opslag.  GEEN React
  ui/          Bouwstenen en de ouderpoort
  pages/       Schermen
  stijl.css    De ontwerptokens
```

**De regel die de lagen bij elkaar houdt:** `engine/` kent `content/` wel,
`content/` kent `engine/` niet, en geen van beide importeert uit `ui/` of
`pages/`. Zo blijft de leerinhoud data en de machine testbaar zonder browser.

## 3. Opdrachten

| | |
|---|---|
| `npm run dev` | Ontwikkelserver |
| `npm run build` | Typecontrole + bouw naar `dist/` |
| `npm run typecheck` | Alleen typecontrole |
| `npm test` | Vitest, één keer |
| `npm run bouw-en-rook` | **Bouwt en loopt de app door in een echte browser** |
| `npm run nakijklijst` | Schrijft alle Turkse inhoud als één bestand om te laten nakijken |
| `npm run opnamelijst` | Schrijft het opnamescript voor de stemacteurs |
| `npm run sleutel` | Maakt de upload-sleutel voor Google Play |
| `npm run beeld` | Pictogram, startscherm en winkelbeelden uit het merkteken |
| `npm run schermen` | Schermafdrukken voor de winkelvermelding |
| `npm run privacy -- --mail …` | De privacyverklaring als één html-bestand |
| `npm run aab` | Bouwt de bundle voor Google Play |
| `npm run ios` | Alleen op een Mac |

**Draai `npm run bouw-en-rook` voordat je iets oplevert.** De unittests gaven
alles groen terwijl het scherm iets anders liet zien, twee keer:

- een les die zowel op volgorde als op abonnement dichtzat zei "maak de les
  ervoor af", en dat opende hem niet;
- er stond "Klinkt als als dzj", omdat het label en de tekst allebei met "als"
  begonnen.

Voor allebei staat er nu ook een unittest. De rooktest vindt wat die niet
kunnen zien.

## 4. Turks is niet zomaar een andere taal

Twee dingen gaan in JavaScript stíl fout, en juist bij de letters waar deze
app over gaat:

```js
'i'.toUpperCase()   // → 'I'   en niet 'İ'
'İ'.toLowerCase()   // → 'i̇'   — een i met een lósse punt erachter
```

Alles wat met Turkse tekst rekent gaat daarom door `src/engine/turks.ts`:
hoofdletters, vergelijken, sorteren, klinkerharmonie. Schrijf die bewerkingen
niet zelf.

Bij het vergelijken van een getypt antwoord geldt: **streng waar het de les
raakt, mild waar het het toetsenbord raakt.** `kil` is niet `kıl` — dat is het
leerpunt. Maar een hoofdletter `I` mag een `İ` zijn, want die toets bestaat op
een Nederlands of Duits toetsenbord niet.

## 5. Ids zijn voor altijd

Woord-, letter-, zin- en klankpaar-ids staan in de opslag op het toestel van
een gebruiker. **Een id hernoemen wist iemands voortgang**, en er is geen
server om het terug te halen.

Daarom: Latijns, kleine letters, geen diakrieten (`tesekkur-ederim`), en
letters krijgen een expliciete id (`c-cedilla`, `i-dotless`) omdat `naarId('ç')`
en `naarId('c')` allebei `c` zouden geven.

## 6. Inhoud is data

Alles wat een kind leert staat in `src/content/` als gegevens, niet als code.
Een unit erbij is een object erbij; een taal erbij is een veld erbij.

**Elke Turkse string moet nog nagekeken worden door een moedertaalspreker.**
`src/content/nakijken.ts` houdt bij wat wel en niet gezien is, met per bestand
de punten waar ik zelf twijfelde. `npm run nakijklijst` maakt er één leesbaar
bestand van. Dit is het grootste openstaande risico van het project — zie
`docs/decisions.md` B-1. Hier publiceert niets voordat dit klaar is.

Hetzelfde voor cultuur en geschiedenis: **geen feit zonder bron** in
`content/bronnen.ts`, en nooit "Turken doen X" maar "bij veel gezinnen". De
doelgroep is niet één groep.

## 7. Privacy is een meting, geen belofte

Geen account, geen server, geen advertenties, geen analytics, geen tracking.
Alle voortgang staat in `localStorage` en gaat daar niet weg.

`src/engine/privacy.test.ts` scant de broncode op SDK's, netwerkverzoeken,
cookies en opnames, en faalt als er één bij komt. `src/ui/ouderpoort.test.tsx`
controleert dat elke koop, elke wisactie en elke link naar buiten achter de
ouderpoort zit.

Verzamel niets erbij. Als je denkt dat je iets nodig hebt: lees eerst
`docs/privacy-and-safety.md`.

## 8. Het abonnement

Alleen via de officiële betaalstromen van Apple en Google. Geen eigen
betaalpagina.

**Eén plan: € 5,99 per maand, maandelijks opzegbaar, geen proefperiode.** Zie
`docs/decisions.md` B-6.

**En de duurste les uit de overdracht van de vorige app:** het scherm belooft
geen proefperiode tenzij de winkel er bij dát product ook een meldt. Daar stond
de proef wekenlang alleen op één plan terwijl het scherm hem aan iedereen
beloofde. `belooftNietsOnwaars()` in `src/engine/abonnement.ts` dwingt dat af.
Daardoor kost een proefperiode toevoegen later geen regel code: zet hem in de
Play Console aan en het scherm volgt.

Prijs, proefduur, verlenging en opzeggen staan vóór de koopknop. Altijd. Geen
aftelklok, geen kunstmatige haast; `abonnement.test.ts` scant de teksten erop.

## 9. Toon

- **Tegen het kind:** `sen`, kort, concreet, nooit sarcastisch. Een fout
  antwoord levert het goede antwoord op en geen "Fout!".
- **Tegen de ouder:** `siz`, volwassen, zonder verkooppraat.
- **Nooit:** schuldgevoel over een verbroken reeks, aftelklokken, of "andere
  kinderen hebben al…".
- **En nooit "echte Turken"** of iets wat daarop lijkt. "Onze taal" in de naam
  is een uitnodiging, geen toelatingseis — zie `docs/brand-brief.md` §De naam.

## 10. Waar wat staat

| Vraag | Bestand |
|---|---|
| Waarom is dit zo gebouwd? | `docs/decisions.md` |
| Wat moet er nog? | `docs/mvp-backlog.md` |
| Wat leert een kind, en in welke volgorde? | `docs/learning-curriculum.md` |
| Hoe zit het technisch in elkaar? | `docs/architecture.md` |
| Wat slaan we op en wat niet? | `docs/privacy-and-safety.md` |
| Voor wie is dit, en waarom? | `docs/product-brief.md` |
| Hoe ziet het eruit? | `docs/brand-brief.md` |
| Hoe komt dit live? | `docs/lanceren.md` |
