# Dilimiz — architectuur

## Waar deze app staat

`/turks` in de repository `motispiritsound-star/Gedmma-app`.

De repository bevat drie dingen die niets met elkaar te maken hebben:

| Map | Wat | Status hier |
|---|---|---|
| `turks/` | **Deze app** | Wordt gebouwd |
| `darija-kids/` | Kopie van Darijaforkids | **Alleen-lezen referentie.** Niet wijzigen |
| `apps/`, `packages/`, `docs/` | Buurklus, een ouder project | Niet aanraken |

`darija-kids/` is in deze sessie niet gewijzigd en hoort dat ook niet te
worden. Wie de Darija-app wil veranderen doet dat in zijn eigen repository.

## De stack, en waarom die blijft

Overgenomen van de referentie-app: **Vite + React + TypeScript, in een
Capacitor-schil, zonder server.**

Dat is geen gemak maar de juiste keuze, om vier redenen:

1. **Offline is een eis, niet een extra.** Het kind in de doelgroep zit drie
   weken in een dorp in Anatolië met slecht bereik — precies wanneer het de app
   het hardst nodig heeft. Een gebundelde app zonder server werkt daar.
2. **Geen server betekent geen gegevens.** Zie `privacy-and-safety.md`: de
   eenvoudigste manier om niets over een kind te verzamelen, is geen plek
   hebben waar het heen kan.
3. **Eén codebase, drie doelen.** Dezelfde bouw wordt de iOS-app, de
   Android-app en de webdemo.
4. **De uitgeefketen bestaat al.** `darija-kids/scripts/` is maanden werk:
   bouwen, versies, ondertekenen, winkelkoppeling. Dat is generiek en het komt
   mee.

Afwijkingen van de referentie-app, met reden:

| | Referentie | Hier | Waarom |
|---|---|---|---|
| CSS | Tailwind 4 | Eigen tokens + gewone CSS | Het merk is nieuw; Tailwind-klassen uit de oude app overnemen zou het oude ontwerp meesmokkelen. Eén afhankelijkheid minder |
| Merknaam | In 267 bestanden | In `src/merk/merk.ts` | De naam staat nog niet vast. Hernoemen moet één bestand zijn |
| Letterrichting | RTL + bidi | Alleen LTR | Turks is Latijns schrift |

## Lagen

```
src/
  merk/        Naam, kleuren, logo, winkel-ids.  Het enige dat verandert bij een naamkeuze
  i18n/        Interfaceteksten: nl, de, fr, en.  Geen Turkse cursusinhoud
  content/     De Turkse cursus: letters, woorden, zinnen, units.  Geen interfaceteksten
  engine/      Herhaling, voortgang, oefeninggeneratie, toegang, opslag.  Geen React
  ui/          Bouwstenen: knop, kaart, voortgangsbalk, ouderpoort
  pages/       Schermen
```

**De regel die de lagen bij elkaar houdt:** `engine/` kent `content/` wel,
maar `content/` kent `engine/` niet, en geen van beide importeert uit `ui/` of
`pages/`. Zo blijft de leerinhoud een gegevensbestand en de machine testbaar
zonder browser.

### `merk/` — waarom dit een eigen laag is

De naam van de app staat nog niet vast. In de referentie-app staat de
merknaam in 267 bestanden, en de overdracht waarschuwt daar expliciet voor:
*"een zoek-en-vervang doe je één keer goed of drie keer half."*

Hier staat hij in één object:

```ts
export const MERK = {
  naam: 'Dilimiz',
  appId: 'app.dilimiz.turks',
  domein: 'dilimiz.example',
  abonnement: { jaar: 'app.dilimiz.turks.yearly', maand: '…' },
}
```

Interfaceteksten gebruiken `{naam}` als plaatshouder, nooit de naam zelf.
`src/merk/merk.test.ts` controleert dat er geen letterlijke merknaam in
`src/i18n/` of `src/content/` staat. Daarmee kost een naamkeuze later één
bestand en geen week.

### `content/` — data-gedreven

Alles wat een kind leert is data, niet code:

```
content/
  types.ts        De vormen.  Eén plek om te zien wat inhoud kan zijn
  letters.ts      29 letters, met klank, voorbeeldwoord en moeilijkheid
  klankparen.ts   De minimale paren (cam/çam, kıl/kil …)
  woorden.ts      Woordenschat, per onderwerp
  zinnen.ts       Zinnen, met tegels voor de bouwoefening
  achtervoegsels.ts  Klinkerharmonie: de regels als data, plus oefeningen
  curriculum.ts   Units en lessen, verwijzend naar bovenstaande ids
  bronnen.ts      Herkomst van elk cultureel gegeven
```

Een unit erbij is een object erbij. Een taal erbij is een veld erbij. Geen
codewijziging.

**Ids zijn voor altijd.** De herhalingsplanner en de voortgang bewaren
woord-ids op het toestel. Een id hernoemen wist iemands voortgang. Daarom:
ids zijn Latijns, kleine letters, zonder diakrieten (`tesekkur-ederim`), en
`content.test.ts` controleert dat ze uniek zijn en niet veranderen.

### `engine/` — wat is overgenomen en wat nieuw is

| Bestand | Herkomst | Toelichting |
|---|---|---|
| `srs.ts` | Patroon overgenomen | Vereenvoudigde SM-2. Een algoritme uit de literatuur, geen merkinhoud |
| `opslag.ts` | Nieuw, zelfde gedachte | localStorage onder eigen sleutel, met migratiepad |
| `oefeningen.ts` | **Nieuw** | Andere oefenvormen: `harmonie`, `plak`, `klankpaar` bestaan in de eerste app niet |
| `turks.ts` | **Nieuw** | Turkse tekstbewerking: hoofdletters, vergelijken, klinkerharmonie |
| `toegang.ts` | Patroon overgenomen | Welke les gratis is |
| `abonnement.ts` | Patroon overgenomen, nieuwe product-ids | Alleen via Apple/Google |

### `turks.ts` — de laag die er in de eerste app niet in zat

Turks heeft twee dingen die in JavaScript stilletjes fout gaan:

1. **`toUpperCase()` maakt van `i` een `I`, niet een `İ`.** En
   `'İSTANBUL'.toLowerCase()` geeft `i̇stanbul` met een losse punt erachter.
   Elke hoofdletterbewerking op Turkse tekst moet `toLocaleUpperCase('tr')`
   gebruiken — of beter: helemaal niet gebeuren. In de CSS staat daarom nergens
   `text-transform` op een element dat Turks bevat.
2. **Een kind typt `i` waar `ı` hoort.** De tikoefening moet dat onderscheid
   handhaven — het is juist het leerpunt — maar wel het verschil kennen tussen
   "andere letter" en "ontbrekend accentteken op een toetsenbord dat het niet
   heeft". Daarom een hulprij met `ç ğ ı i ö ş ü` onder het invoerveld, en een
   vergelijkfunctie die weet wat ze doet.

`turks.test.ts` legt dat vast, inclusief de `İ`-val.

## Opslag

Alles op het toestel, in `localStorage`, onder één sleutel.

```
<merk>.v1  →  { versie, kind, voortgang, kaarten, instellingen, … }
```

- **Eén versienummer, en een `migreer()`** die een oudere opslag bijwerkt.
  De referentie-app leerde dat op de harde manier: een veld dat later
  bijkwam was `undefined` bij iedereen die de app al had, en het eerste
  `Object.keys` erop liet het scherm omvallen.
- **Niets gaat naar een server.** Geen account, geen synchronisatie.
- **Wat dat kost:** nieuwe telefoon is nieuwe voortgang. Dat is een bewuste
  ruil en hij staat in `decisions.md` B-5, met een exportbestand als
  tussenweg.

## Abonnement

Alleen via de officiële betaalstromen van Apple en Google
(`cordova-plugin-purchase`). Geen eigen betaalpagina, geen creditcardgegevens
in de app, geen omweg.

- Twee abonnementen (jaar, maand) in één abonnementsgroep, zodat wisselen kan.
- **Proefperiode op bééde plannen.** Dit is de duurste les uit de overdracht:
  bij de eerste app stond de proef wekenlang alleen op het maandplan terwijl
  het scherm hem aan iedereen beloofde. `abonnement.test.ts` controleert nu
  dat het scherm niets belooft wat niet in de productgegevens van de winkel
  staat.
- Herstel van aankopen, geldigheid, verlopen en opgezegd: zie
  `src/engine/abonnement.ts`.
- **Prijs, proefduur, verlenging en opzeggen staan op het scherm vóór de
  koopknop.** Geen aftelklok, geen verborgen verlenging.

**Nieuwe identificatoren, niets hergebruikt:**

| | Referentie-app | Hier |
|---|---|---|
| App-id | `app.darijaforkids.learn` | `app.dilimiz.turks` (plaatshouder) |
| Jaar | `app.darijaforkids.yearly` | `app.dilimiz.turks.yearly` |
| Maand | `app.darijaforkids.monthly` | `app.dilimiz.turks.monthly` |
| Domein | `darijaforkids.eu` | nog te kiezen |
| Cloudflare | `darijaforkids`, D1 `efdc2224…` | **geen** — deze app heeft geen server |
| Ondertekensleutel | bestaand | nieuw aan te maken |

## Omgevingen

| | Hoe | Waar |
|---|---|---|
| Ontwikkeling | `npm run dev` | Vite, geen winkel, abonnement altijd "niet beschikbaar" |
| Test | `npm run build -- --mode test` | `VITE_OMGEVING=test`: alles open, winkel nagebootst |
| Productie | `npm run build` | Echte winkel-ids |

`src/engine/omgeving.ts` is de enige plek die `import.meta.env` leest. Zo is
in één bestand te zien wat per omgeving verschilt, en kan een test de
omgeving nabootsen zonder de bouw.

## Bouwen en testen

| Opdracht | Wat het doet |
|---|---|
| `npm run dev` | Ontwikkelserver |
| `npm run build` | Typecontrole + bouw naar `dist/` |
| `npm run typecheck` | Alleen typecontrole |
| `npm test` | Vitest, één keer |
| `npm run test:watch` | Vitest, blijvend |
| `npm run android` | Bouw + `cap sync android` |
| `npm run ios` | Bouw + `cap sync ios` — **alleen op de Mac** |

## Wat nog niet gebouwd is

| | Waarom nog niet |
|---|---|
| Native schillen (`android/`, `ios/`) | `npx cap add` schrijft mappen met de app-id erin. Doen ná de naamkeuze, in één keer goed |
| Echte audio | Opnames zijn mensenwerk. Zie `learning-curriculum.md` §Audio |
| Winkelvermeldingen | Volgt op naam en logo |
| `scripts/` uit de referentie-app | Overgenomen bij de eerste echte uitrol, niet eerder: ze dragen de oude merknaam |
