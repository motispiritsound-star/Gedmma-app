# 02 — Technische audit

## De korte versie

**De techniek is niet de oorzaak van de achterblijvende omzet.** Dat is geen
compliment maar een conclusie met gevolgen: elke euro en elk uur dat naar
"eerst de bugs eruit" gaat, is verkeerd besteed. De lijst hieronder bevat één
P0, en die gaat over meten, niet over werkend krijgen.

| Controle | Uitkomst |
| --- | --- |
| `npm test` | 117 bestanden, 2098 tests, 2 overgeslagen — **alle groen**, 11,4 s |
| `npm run build` | schoon door `tsc -b`, `vite build`, bundelcontrole, sitegenerator, dode-linkcontrole |
| `npm audit --omit=dev` | **0 kwetsbaarheden** |
| Geheimen in de repository | geen. Alleen het prefix `xkeysib-` als formaatcontrole; geen sleutel, geen IBAN |
| `.gitignore` op de gevoelige bestanden | `server/.dev.vars`, `*.keystore`, `keystore.properties`, `play-api.json` — alle vier gedekt |

**BEWEZEN** — alles hierboven zelf uitgevoerd op 10 november 2026.

## Architectuur

```
src/pages     7.083 regels   31 bestanden   de schermen
src/ui       11.331 regels   60 bestanden   de bouwstenen
src/i18n      8.243 regels   18 bestanden   zes talen
src/content  37.163 regels   64 bestanden   curriculum, boeken, encyclopedie
src/engine                                  staat, aankopen, srs, audio, delen
src/site      6.645 regels   35 bestanden   de website (aparte bouw)
server        4.482 regels   19 bestanden   Cloudflare Worker: mail, portaal
scripts      26.002 regels  111 bestanden   bouw, winkels, films, controles
```

Eén repository, drie producten: de app, de website en de boekwinkel. De
scheiding is strak gehouden — `src/engine/beoordeling.ts:45-54` legt
bijvoorbeeld uit waarom de app *niets* uit `src/site` importeert, om te
voorkomen dat de hele sitelaag in de app-bundel wordt getrokken. Dat soort
discipline zie je zelden in een project van deze leeftijd.

De afhankelijkhedenlijst is kort en dat is met opzet: Capacitor (app, core,
haptics, local-notifications), React 19, react-router 7, framer-motion,
canvas-confetti en `cordova-plugin-purchase`. Geen advertentie-SDK, geen
analytics-SDK, geen crash-reporter. **BEWEZEN** — `package.json`.

Die keuze is geen smaak: in Apples Kinderen-categorie zijn analytics van
derden verboden, en de app staat daar in. Zie `docs/APPLE-2.3.8.md`.

## Performance

| | Ruw | Gezipt |
| --- | --- | --- |
| `kit` | 399 kB | 138 kB |
| `index` | 391 kB | 118 kB |
| `i18n` | 270 kB | 98 kB |
| stylesheet | 113 kB | 13 kB |
| **eerste lading samen** | | **≈ 367 kB** |

**BEWEZEN** — gemeten na `npm run build`.

367 kB gezipt is veel voor een webpagina en **weinig van belang voor deze
app**: in de Capacitor-bouw staat alles op de telefoon zelf. Er is geen
netwerk tussen de tik op het pictogram en het eerste scherm; alleen parsetijd,
en die is op een moderne telefoon honderd à tweehonderd milliseconde.

De website laadt de app-bundel **niet**. De landingspagina is 28 kB HTML
(8 kB gezipt) met één stylesheet en geen javascriptraamwerk. **BEWEZEN** —
`site/index.html`, en `grep -c "assets/index-" site/index.html` geeft 0.

Dat is voor de conversie goed nieuws dat eerst verteld moet worden, omdat het
een standaardadvies uitschakelt: "je landingspagina is te zwaar" geldt hier
niet.

**Eén optimalisatie, laag in de lijst (P3):** de `i18n`-brok van 98 kB bevat
alle zes de talen. Een Nederlandse gebruiker downloadt de Franse, Duitse,
Spaanse, Italiaanse en Engelse teksten mee. In de app kost dat alleen
schijfruimte. Niet urgent, wel ooit.

## De betaalketen

De hele keten loopt via `src/engine/billing.ts` (1 bestand, de aankoopplug-in
van de winkels) en wordt op het scherm gezet door `src/pages/Unlock.tsx` en
`src/ui/Aanbod.tsx`.

Wat er goed in zit, en wat de moeite waard is om te weten omdat het hier
*niet* fout kan gaan:

- **De prijs komt uit de winkel, niet uit de code.** `PLANS` in
  `billing.ts:43-46` draagt € 59,99 en € 6,99 als terugval, maar wat op het
  scherm staat is `billing.yearPerMonth` uit de winkel zelf — in de munt van
  de koper. De aantekening erboven legt uit waarom: wie dit scherm in Marokko
  of de VS opent, las anders euro's terwijl de winkel dirham of dollar
  afschrijft.
- **De proefperiode wordt niet belóófd als hij niet zeker is.**
  `heeftProef()` (`billing.ts:512`) laat onbekend gelden als nee. Dat is
  precies de goede kant om op te vallen: "drie dagen gratis" tonen aan iemand
  die er geen recht op heeft, is een terugbetaling en een slechte beoordeling.
- **Dubbele proefperiode is gedicht.** `billing.ts:249` kijkt of er al langer
  dan de proefperiode betaald wordt voordat er een tweede wordt aangeboden.
- **Elke geldhandeling zit achter de ouderpoort.** Inclusief het kopen van het
  e-boek, wat tot build 6 een gat was: een kind kon met één tik geld
  uitgeven. **BEWEZEN** — `docs/APPLE-2.3.8.md`, tabel bij build 6.

**Geen technische oorzaak van mislukte betalingen gevonden.** `billing.test.ts`,
`proef.test.ts`, `toegang.test.ts`, `nakoop.test.ts`, `codeinwisselen.test.ts`
en `terugbetaling.test.ts` dekken de paden en zijn groen. **BEWEZEN.**

Dat is belangrijk voor de diagnose: vraag 4 van de masterprompt ("zijn er
technische oorzaken van mislukte betalingen?") is hiermee **met redelijke
zekerheid nee**. Er is één uitzondering die ik niet kan uitsluiten zonder
cijfers — zie de negatieve balk in `03-conversion-audit.md`.

## De P0: er wordt niets gemeten

```
grep -ril "analytics|gtag|posthog|mixpanel|amplitude|firebase|sentry" src/ server/
→ src/i18n/privacy.ts
```

Die ene treffer is de privacyverklaring, die zegt dat er geen analytics is.
**BEWEZEN: er is geen enkele meting van gebruikersgedrag in de app.**

Daarmee is geen van deze vragen te beantwoorden:

- Hoeveel mensen die de app openen, maken les 1 af?
- Hoeveel komen aan bij les 5, waar de gratis lessen ophouden?
- Hoeveel zien het aanbodscherm, en hoeveel kiezen "later"?
- Hoeveel openen `/volledig` en haken daar af?
- Hoeveel komen op dag 2 terug?

Niet "we hebben die cijfers nog niet verzameld" — ze bestaan niet en kunnen
niet achteraf worden opgehaald. Elke uitspraak over waar de trechter lekt is
daarmee **HYPOTHESE**, inclusief de mijne.

**En het is op te lossen zonder de Kinderen-categorie te schenden.** Verboden
zijn analytics van *derden*. Eerstelijns, anoniem en geaggregeerd mag, en de
bouwstenen staan er al: `server/` is een Cloudflare Worker met migraties, en
`src/engine/post.ts` is een bestaande, gedocumenteerde weg naar buiten die
nu alleen voor mailaanmeldingen wordt gebruikt. Het ontwerp staat in
`08-metrics-experiments.md`.

## De tweede P0: de winkellinks dragen geen campagne

```
src/site/links.ts:16-18
export const STORE = {
  apple: 'https://apps.apple.com/app/id6813964474',
  google: 'https://play.google.com/store/apps/details?id=app.darijaforkids.learn',
}
```

Geen `?ct=`, geen `&referrer=`. **BEWEZEN.**

Gevolg: de campagne van 3 november in meer dan vijftien Nederlandse en Franse
Facebook-groepen is **niet toe te rekenen**. Niet aan een groep, niet aan een
taal, niet aan een bericht. Het geld en de tijd zijn besteed en de uitkomst is
onmeetbaar — en dat herhaalt zich bij elke volgende campagne tot dit erin zit.

Beide winkels bieden het gratis aan: Apple leest `?ct=` als campagnenaam in
App Analytics, Google leest `&referrer=utm_source%3D...` in de Play Console.
Het is één regel code per link en één keuze per bericht.

## Techniek: urgent, schuld, en later

### Urgent (blokkeert groei of omzet)

| | Wat | Waarom urgent |
| --- | --- | --- |
| P0 | Geen trechtermeting | Zonder dit is elke verbetering een gok en elke uitkomst onleesbaar |
| P0 | Geen campagneparameters op de winkellinks | Marketing is onmeetbaar; dit herhaalt zich bij elke post |

### Technische schuld (echt, niet urgent)

| | Wat | Bewijs |
| --- | --- | --- |
| P1 | De 28 klankbeschrijvingen van het alfabet zijn niet gelokaliseerd — in de Franse app staat Nederlands | `src/content/alphabet.ts`; `ContentPack` heeft geen `letters`-veld. Blokkeerde al twee keer een Franse film |
| P2 | De nieuwe zoekwoorden staan klaar maar kunnen niet live tot 1.6 | `store/keywords.md` |
| P3 | `i18n`-brok draagt alle zes talen (98 kB gezipt) | gemeten |

Dat eerste punt is tweemaal gemeld en nooit goedgekeurd. Het is 28 × 5 = 140
korte beschrijvingen. Het raakt de kwaliteit van het product in de vier
niet-Nederlandse markten — en Duitsland en Frankrijk hebben elk al twee
aankopen opgeleverd (zie `03-conversion-audit.md`). Dit is geen cosmetica meer.

### Later

- De `dist/`-map is 23 MB en `site/` 30 MB. Beide gegenereerd en genegeerd in
  git; geen probleem, wel goed om te weten bij de schijfruimte van een
  bouwomgeving.
- `scripts/` is met 26.002 regels het tweede grootste gebied. Dat is
  gereedschap, geen productcode, en het betaalt zichzelf terug — de
  filmmachine en de winkelscripts doen werk dat anders met de muis moet. Niet
  aanraken.

## Beveiliging en betrouwbaarheid

- **0 kwetsbaarheden** in de productieafhankelijkheden. **BEWEZEN.**
- Geen persoonsgegevens verlaten het toestel, behalve een mailadres dat een
  ouder zelf achter de poort heeft ingetypt (`src/engine/post.ts`).
- De staat in `localStorage` is te bewerken door wie dat wil — `store.ts:1244`
  noemt het scenario letterlijk: een kind van twaalf dat `"unlocked": true`
  intikt. De hydratatie leest de aankoopstatus daarom opnieuw bij de winkel.
  Dat is de juiste oplossing; een app die zijn rechten alleen uit zijn eigen
  opslag leest, is met Kladblok te kraken.
- Geen geheim in de repository. De vier gevoelige bestanden staan in
  `.gitignore`. **BEWEZEN.**

Hier is niets te doen.
