# Pre-launch audit

Uitgevoerd op 28 september 2026, op commit `0cbdfbd`. Dit is een analyse:
er is voor dit rapport geen regel code gewijzigd.

**Basislijn.** Beide typechecks schoon (`npx tsc -b --force --noEmit` en
`npx tsc -p server --noEmit`), 1005 tests groen in 24 bestanden. Er staat
geen enkel geheim in de repository — geen IBAN, geen BSN, geen API-sleutel.
De enige treffer op `xkeysib-` is het voorbeeldvoorvoegsel in
`scripts/mailsleutel.mjs:32` en `docs/BREVO.md:109`.

Wat volgt zijn tien bevindingen, op risico gesorteerd.

**Stand op 28 september 2026.** Bevinding 1, 3 en 4 zijn opgelost en staan in
de repository; bij elk staat hieronder wat er precies is gedaan. De rest is
blijven staan, met per bevinding de reden. Na het oplossen: 1019 tests groen
(was 1005), beide typechecks schoon, de site bouwt zonder dode links.

---

## 1 · De CI draait een ander project dan dit

**Risico: kritiek** · Prioriteit 1 · `.github/workflows/ci.yml` (hele bestand),
in het bijzonder regel 5 (`branches: ['**']`) en 44–56.

**Probleem.** De enige workflow in deze repository bouwt en test *buurklus*:
hij start een Postgres 16-service, draait `npm run db:generate --workspace
@buurklus/api`, bouwt `@buurklus/shared` en `@buurklus/web`, en voert dan
`npm run typecheck` en `npm test` uit in de root. De root-`package.json`
definieert `test` als `npm run test --workspaces --if-present` (regel 16) en
zijn workspaces zijn `packages/*` en `apps/*`. `darija-kids/` valt in geen van
die twee globs.

**Waarom dit een probleem is.** De 1005 tests van Darijaforkids draaien
nergens automatisch. Geen push, geen merge en geen deploy raakt ze aan. De
vertaalslot-test die gelijke kapittel- en alinea-aantallen over vijf talen
bewaakt, de test die de prijzen in app, site, zes listings, EULA en docs
naast elkaar legt, de test die de tijdstempels in seconden bewaakt — die
hebben alleen waarde als iets ze afdwingt. Nu zijn ze afhankelijk van of
iemand eraan denkt ze te draaien. Dat is precies het soort stap waarover
`CLAUDE.md` zegt: een stap die je met de hand moet doen is een stap die je
vergeet.

Erger nog: de workflow is rood op elke push, want een Postgres-opzet voor een
project dat hier niet wordt aangeraakt kan alleen maar ruis opleveren. Een
altijd-rode CI is een uitgezette CI.

**Concrete oplossing.** Een tweede workflow die alleen `darija-kids/` raakt:

```yaml
name: darija-kids
on:
  push:
    paths: ['darija-kids/**']
  pull_request:
    paths: ['darija-kids/**']
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: darija-kids/package-lock.json
      - run: npm ci --prefix darija-kids
      - run: npm --prefix darija-kids run typecheck
      - run: npx --prefix darija-kids tsc -p darija-kids/server --noEmit
      - run: npm --prefix darija-kids test
```

En `paths: ['apps/**', 'packages/**']` toevoegen aan de bestaande `ci.yml`,
zodat die niet meer op elke Darijaforkids-commit afgaat.

**Verwachte impact.** Elke regressie in de zes talen, de prijzen, de
tijdstempels en de worker wordt gevonden voordat hij live staat, in plaats van
erna. Dit is de bevinding met de grootste verhouding tussen opbrengst en werk:
één bestand.

**Opgelost.** `.github/workflows/darija-kids.yml` draait nu de typecheck van de
app, de typecheck van de worker, de 1019 tests en de build — en die laatste
loopt met `sitecheck.mjs` ook de hele website na op dode links. Er is een script
`typecheck:server` bijgekomen, zodat CI en jij dezelfde opdracht gebruiken; de
worker werd namelijk door geen enkel npm-script getypecheckt, want
`tsconfig.json` heeft geen references en `tsc -b` komt daar niet langs.
`ci.yml` heeft een `paths`-filter gekregen op `apps/**` en `packages/**`, dus
die start geen Postgres meer voor een commit die alleen darija-kids raakt.
Nagelopen dat de build het met alleen getrackte bestanden redt: de zes films en
252 assets staan in `site-assets/`, en `make-site.mjs` leest niets uit de
genegeerde `store/`-mappen.

**En de eerste run was meteen rood**, op iets dat hier niet te zien was:
`error TS2688: Cannot find type definition file for '@cloudflare/workers-types'`.

`server/` is een eigen npm-project met een eigen `package.json` en eigen
`node_modules`, en de workflow deed daar geen `npm ci`. Op deze machine stond
die map er al, dus viel het niet op; een verse checkout heeft hem niet. Eén
regel erbij, `npm ci --prefix server`, en beide lockfiles in de cache.

Nagelopen met een verse install vanaf een gewiste `server/node_modules`:
typecheck schoon.

Dit is precies waar bevinding 1 over ging: niet dat de tests fout stonden, maar
dat niemand ze ergens anders dan op deze ene machine draaide.

---

## 2 · Twee projecten in één repository, met een deploybaar root-doelwit

**Risico: hoog** · Prioriteit 2 · `package.json:2`, root `wrangler.toml`,
`fly.toml`, `docker-compose.yml`, `Dockerfile`, `apps/` (6,8 MB),
`packages/` (160 kB).

**Probleem.** De root van deze repository is buurklus: een marktplaats die
huishoudens in Nederland aan vakmensen koppelt. Darijaforkids woont in
`darija-kids/`. Naast de CI uit bevinding 1 staan er in de root een
`wrangler.toml` die een Worker met de naam `buurklus` publiceert uit
`apps/web/dist`, een `fly.toml` voor een API in Amsterdam, en een
`docker-compose.yml`.

**Waarom dit een probleem is.** Twee dingen. Ten eerste: een `npx wrangler
deploy` in de verkeerde map publiceert het verkeerde project. De gewoonte in
dit project is `npm --prefix <map>` juist om die fout onmogelijk te maken,
maar `wrangler` leest de `wrangler.toml` van de map waarin je staat, en die
bestaat in de root. Ten tweede: de commentaren in `fly.toml` beschrijven een
database met namen, adressen en telefoonnummers van mensen in Nederland. Dat
is een heel andere gegevensverzameling dan die van Darijaforkids, waarvan
`server/schema.sql` in zijn eigen kop zegt dat wat een kindertelefoon verlaat
op één hand te tellen moet zijn. Die twee horen niet in één repository met één
set sleutels en één toegangslijst.

`netlify.toml` is wél goed ingesteld (`base = "darija-kids"`), dus de website
draait van de juiste map. Dit gaat om de overige doelwitten.

**Concrete oplossing.** Vóór de lancering het kleine deel: de root
`wrangler.toml` verplaatsen naar `apps/web/wrangler.toml`, waar hij hoort, zodat
er in de root geen deploybaar doelwit meer staat. Ná de lancering het grote
deel: buurklus naar zijn eigen repository, en `darija-kids/` naar de root van
deze.

**Verwachte impact.** Een verkeerde deploy wordt onmogelijk in plaats van
onwaarschijnlijk. Op termijn halveert het de oppervlakte die je bij elke
volgende audit moet nalopen.

---

## 3 · De koopmail kan blijven hangen zonder ooit te falen

**Risico: hoog** · Prioriteit 3 · `server/src/mail.ts:44`.

**Probleem.** De `fetch` naar Brevo heeft geen `AbortSignal` en dus geen
tijdslimiet:

```ts
const antwoord = await fetch(endpoint ?? BREVO, {
  method: 'POST',
  headers: { 'api-key': sleutel, 'content-type': 'application/json' },
```

**Waarom dit een probleem is.** `naDeVerkoop()` vangt fouten op en laat de
verkoop staan als de mail omvalt — dat is goed en het is er met opzet. Maar
een hangende verbinding is geen fout. Hij gooit niets; hij wacht. De
Gumroad-ping die de koop aanmeldt wacht dan mee, Gumroad geeft het op en
probeert het opnieuw. En bij deze producten *is* die mail de levering: er
gaat geen PDF de deur uit, de koper krijgt een sleutel. Een levering die
blijft hangen zonder een fout te melden, is een levering waarvan niemand weet
dat hij mislukt is — ook het logboek niet.

Hetzelfde geldt voor `/portaal/aanmelden`: de bezoeker wacht op een
inloglink en ziet een draaiend wieltje in plaats van een melding.

**Concrete oplossing.** Een limiet van tien seconden, waarmee een hang een
gewone fout wordt die `naDeVerkoop()` al opvangt:

```ts
const antwoord = await fetch(endpoint ?? BREVO, {
  method: 'POST',
  signal: AbortSignal.timeout(10_000),
  headers: { 'api-key': sleutel, 'content-type': 'application/json' },
```

Met een test erbij in `server/src/mail.test.ts` die een endpoint aanbiedt dat
nooit antwoordt, en vaststelt dat de aanroep afbreekt in plaats van te blijven
staan.

**Verwachte impact.** Een storing bij Brevo levert een regel in het logboek en
een koop die blijft staan, in plaats van een ping die Gumroad blijft
herhalen. De koper is daarna met `npm run logboek` te vinden.

**Opgelost.** `signal: AbortSignal.timeout(TIJDSLIMIET)` met `TIJDSLIMIET` op
tien seconden. Een afbreking heet bij de een `TimeoutError` en bij de ander
`AbortError`, en de melding erbij zegt niets over post; die wordt nu hertaald
naar één regel die in het logboek te begrijpen is. Een echte fout van de
postdienst houdt zijn eigen tekst — de 401 zei "Key not found", en dat was
precies de aanwijzing. Drie tests erbij in `server/src/mail.test.ts`.

---

## 4 · Eén render-fout geeft een kind een wit scherm

**Risico: hoog** · Prioriteit 4 · `src/main.tsx:6`; nergens in `src/` staat een
`componentDidCatch`, `ErrorBoundary` of `errorElement`.

**Probleem.** De app hangt `<App/>` rechtstreeks in de root zonder
foutopvang. React 19 ontkoppelt bij een onafgevangen fout in een render de hele
boom.

**Waarom dit een probleem is.** Bij een gewone webapp is een wit scherm
hinderlijk; hier is de gebruiker een kind van vier tot tien dat niet kan
herladen, niet kan uitleggen wat er gebeurde, en het ook niet aan een ouder
kan doorgeven op een manier waarmee die iets kan. En de app leest uit
`localStorage`, spreekt met de Web Speech API en met een betaalplug-in — drie
bronnen die op het toestel van een ander anders kunnen antwoorden dan hier.
Een `undefined` uit een oude opgeslagen staat is genoeg.

**Concrete oplossing.** Een `Grens`-component rond `<App/>` die bij een fout
een vriendelijk scherm in de gekozen taal toont met één knop ("opnieuw
beginnen") die de pagina herlaadt.

*Correctie op een eerdere versie van dit rapport:* daar stond dat de fout in
`localStorage` gezet zou worden zodat `npm run telefoon` hem kan laten zien.
Dat kan niet: `telefoon.mjs` is een dev-server die een adres afdrukt, en het
heeft geen enkele greep op de browser. De fout hoort dan ook niet in de opslag
maar op het scherm zelf, in kleine letters achter "voor de grote mensen" — daar
kan een ouder hem lezen en doorgeven.

**Verwachte impact.** Het verschil tussen "de app is stuk" en "de app zei sorry
en ging verder". Voor een app die op beoordeling in twee winkels staat, is dat
het verschil tussen één sterretje en geen bericht.

**Opgelost.** `src/ui/Grens.tsx`, om `<App/>` heen in `src/main.tsx`.

Het bestand importeert met opzet niets: geen store, geen `useT()`, geen `kit`.
Dat is geen netheid maar de hele werking — valt de store om, dan valt `useT()`
er achteraan en staat het kind alsnog voor een wit scherm, nu met twee fouten in
plaats van één. Om dezelfde reden staan de stijlen erin en niet in de
stylesheet: laadde die niet, dan is dit scherm ongestyled in plaats van
onleesbaar. De taal komt rechtstreeks uit `localStorage`, en bij alles wat niet
klopt wordt het Nederlands.

Er zit één ding bij dat niet in de oorspronkelijke bevinding stond. Herladen
helpt niet als de opgeslagen staat zélf de fout is: dan valt hij meteen weer om
en blijft het kind op dezelfde knop drukken. Vandaar een teller per tabblad, en
bij de tweede keer op rij krijgt de ouder achter "voor de grote mensen" de
mogelijkheid de opgeslagen gegevens te wissen — achter een som, zoals
`OuderPoort` dat doet, want het wist de voortgang op dat toestel. Gekochte
boeken en het abonnement staan niet daar en blijven.

Tien tests in `src/ui/grens.test.ts`. Drie ervan bewaken aannames die niet uit
het bestand zelf af te lezen zijn: dat de grens nog om `App` hangt, dat hij
niets uit de store of de i18n importeert, en dat zijn opslagsleutels nog gelijk
zijn aan die van de store — die staan met opzet twee keer opgeschreven, en die
test is wat de dubbeling veilig maakt. Alle drie zijn nagelopen door het
bewaakte stuk te breken en te zien dat ze omvallen.

Er draait geen jsdom in dit project, dus de tests dekken de losse functies en
niet het scherm. Dat is apart in een echte browser nagelopen, op telefoonformaat
en in drie talen: geen wit scherm, `role="alert"` aanwezig, de juiste taal uit
de opslag, de technische regel dicht tot de ouder erop tikt, de uitweg pas bij
de tweede keer, een fout antwoord wist niets en een goed antwoord wist wel.

---

## 5 · Het schema kan alleen tabellen maken, niet wijzigen

**Risico: gemiddeld nu, hoog vanaf de eerste koper** · Prioriteit 5 ·
`server/schema.sql` (elke `CREATE TABLE`), `server/package.json:9`,
`scripts/schema.mjs:4`.

**Probleem.** `schema.sql` bestaat volledig uit `CREATE TABLE IF NOT EXISTS`
en `CREATE INDEX IF NOT EXISTS`, en `npm run schema` voert dat bestand in zijn
geheel uit. Er is geen `migrations/`-map en er is nergens vastgelegd welke
versie van het schema er op de productiedatabase staat.

**Waarom dit een probleem is.** Nu is dit precies goed: opnieuw uitvoeren is
onschadelijk. Maar zodra er één echte bestelling in staat, is een
schemawijziging niet meer weg te gooien en opnieuw te maken. Een kolom
toevoegen aan `bestelling` doet met `IF NOT EXISTS` helemaal niets — de tabel
bestaat immers al — en dat mislukt stil. De worker verwacht dan een kolom die
er niet is, en dat merk je bij de eerste koper na de wijziging.

**Waarom dit nú op de lijst staat en niet later:** na de lancering is de
goedkope oplossing weg.

**Concrete oplossing.** Vóór de eerste echte koop een
`server/migrations/`-map met genummerde bestanden en `0001-begin.sql` als de
huidige inhoud van `schema.sql`, uitgevoerd met `npx wrangler d1 migrations
apply darijaforkids --remote`. Wrangler houdt dan zelf bij wat er al is
gedraaid. `npm run schema` blijft bestaan voor een lege database.

**Verwachte impact.** Elke volgende schemawijziging is een bestand erbij in
plaats van een handmatige `ALTER` waarvan niemand weet of hij gedraaid is.

---

## 6 · Een e-mailadres in het Cloudflare-logboek

**Risico: gemiddeld** · Prioriteit 6 · `server/src/index.ts:547`.

**Probleem.**

```ts
console.error('terugbetaling zonder bestelnummer', email)
```

**Waarom dit een probleem is.** `schema.sql` zegt in zijn eigen kop dat hier
alleen het adres van een volwassene staat, wat hij heeft afgesproken en
wanneer — en dat bij `opening` en `mailteller` niet het IP-adres staat maar
zijn hash. Die zorgvuldigheid wordt op deze ene regel omzeild: het adres gaat
naar de Cloudflare-logs, een plek met een eigen bewaartermijn, een eigen
toegangslijst en geen verwijderknop per regel. Voor de AVG maakt het niet uit
dat het in een log staat en niet in een tabel.

**Concrete oplossing.** Het bestelnummer ontbreekt nu juist, dus log
waaraan je de regel wél kunt terugvinden zonder het adres te noemen — de
hash die al elders wordt gebruikt:

```ts
console.error('terugbetaling zonder bestelnummer', (await hashVan(email)).slice(0, 12))
```

**Verwachte impact.** Het logboek blijft even bruikbaar voor het terugvinden
van één geval, en bevat geen persoonsgegevens meer. Een test in
`server/src/terugbetaling.test.ts` die de bron aftast op `console.error` met
een adres erin houdt het zo.

---

## 7 · De app is minder streng ingesteld dan de worker

**Risico: gemiddeld** · Prioriteit 7 · `darija-kids/tsconfig.json:13` tegenover
`server/tsconfig.json`.

**Probleem.** De worker heeft `noUncheckedIndexedAccess: true`, de app heeft
hem expliciet op `false` staan.

**Waarom dit een probleem is.** In de app is `lijst[i]` van het type `T` in
plaats van `T | undefined`, terwijl het op een lege of kortere lijst wel
degelijk `undefined` oplevert. Dat is precies de fout uit bevinding 4: een
`undefined` die de typechecker niet ziet en die op het toestel van een ander
kind een wit scherm geeft. En het is de twee helften van dezelfde codebase
verschillend streng maken, wat betekent dat code die je van de worker naar de
app verplaatst stiller wordt in plaats van luider.

**Concrete oplossing.** Niet vóór de lancering: aanzetten levert vermoedelijk
tientallen meldingen op, en dat is geen werk voor de week waarin je live gaat.
Ná de lancering aanzetten en in één keer doorwerken, met bevinding 4 als
vangnet in de tussentijd.

**Verwachte impact.** De hele klasse "index die niets opleverde" wordt een
compileerfout in plaats van een storing bij de gebruiker.

---

## 8 · Geen rem op `/lezen` en `/blad`

**Risico: laag** · Prioriteit 8 · `server/src/index.ts` (`lezen`, `blad`);
de rem die er wél is staat in `server/src/portaal.ts:192–201`.

**Probleem.** `mailteller` remt het versturen van inloglinks per IP per uur.
Op `/lezen` en `/blad` zit geen enkele rem.

**Waarom dit een laag risico is en geen hoog.** De sleutel is zestien bytes
uit `crypto.getRandomValues` — 128 bits. Die valt niet te raden, ook niet met
onbeperkt veel pogingen, dus een rem zou daar niets toevoegen. En wie een
geldige sleutel heeft, heeft het boek gekocht; dat hij het snel achter elkaar
opvraagt is geen misbruik. De `opening`-tabel telt al vanaf hoeveel
verschillende plekken een sleutel wordt gebruikt, wat precies de vraag is die
hier toe doet.

**Wat er wel aan mankeert.** Er is geen bovengrens op de kosten. Iemand die
`/blad` in een lus zet met een geldige sleutel, haalt R2-verkeer op jouw
rekening.

**Concrete oplossing.** Niet vóór de lancering. Wel: `npm run logboek`
uitbreiden met de tien hoogste rijen uit `opening`, zodat een sleutel die
rondgaat opvalt voordat de rekening het vertelt.

**Verwachte impact.** Vooral rust: dit is nagelopen en het is in orde, en dat
staat nu opgeschreven.

---

## 9 · De koper krijgt een zip met PDF's én een portaal

**Risico: hoog, maar het is een productbesluit en geen fout in de code** ·
Prioriteit: vóór de eerste advertentie · de Gumroad-producten
(`sleutels-alle-delen.zip`, `sba-alle-delen.zip`) en de LEES MIJ daarin.

**Probleem.** Je beschreef het product als alleen-portaal: *"ze krijgen geen
pdf opgestuurd want dan is verder verspreiding eenvoudig"*. De
Gumroad-producten leveren op dit moment zips met PDF's, en de LEES MIJ erin
zegt letterlijk *"Er zit geen beveiliging op … het zijn jouw bestanden."*

**Waarom dit een probleem is.** De twee kanalen spreken elkaar tegen. Het
portaal met zijn intrekbare sleutel, zijn merk op elke bladzijde en zijn
`opening`-teller is gebouwd om verspreiding te kunnen zien en stoppen. Zolang
dezelfde koop ook een onbeveiligde zip oplevert, is dat allemaal
decoratie — één koper die de zip doorstuurt, en het portaal doet niet meer mee.
Andersom geldt ook iets: een koper die de zip verwacht en alleen een link
krijgt, vraagt zijn geld terug.

**Concrete oplossing.** Dit is jouw keuze en niet de mijne, dus twee wegen:

- *Alleen portaal:* de zip-bestanden van de Gumroad-producten halen, de
  beschrijving aanpassen naar "lees op elk apparaat, met voorlezen", en de
  LEES MIJ laten vervallen. De koper krijgt de sleutelmail die er al is.
- *Beide, eerlijk:* de zip laten staan en de beschrijving eerlijk maken
  ("je krijgt de bestanden én een leeslink"), en accepteren dat de sleutel
  dan vooral gemak is en geen bescherming.

Ik heb dit niet gewijzigd omdat het een besluit over je product is.

**Verwachte impact.** In beide gevallen: één belofte in plaats van twee die
elkaar tegenspreken, vóórdat er advertentiegeld naar toe gaat.

---

## 10 · Wat er nog op jouw machine moet gebeuren

**Risico: kritiek voor de lancering, maar geen codewijziging** ·
Prioriteit: deze week.

Dit hoort in een audit omdat een lancering hier op stuk gaat, niet op de code.

1. **`npm run boeken -- --platen`** — ongeveer een uur. Zonder dit ziet een
   Sba-koper "nog niet" in plaats van een prentenboek. Dit is de enige
   bevinding in dit rapport die een betalende klant meteen raakt.
2. **`npm run winkel`** en **`npm run lezen -- --r2`** — de delen 4, 5, 6, 9,
   10 en 13 zijn redactioneel gewijzigd en de bestanden in de winkel zijn nog
   de oude.
3. **De Brevo-sleutel nog één keer vervangen.** Hij heeft in dit gesprek
   gestaan en op twee schermafdrukken. `npm run mailsleutel` controleert de
   nieuwe voordat hij hem opslaat.
4. **Ongeveer tien PROEF-bestellingen opruimen** met `npm run intrekken`.
5. **Play Console:** App access, Managed publishing, Target audience, en de
   bank- en belastinggegevens.
6. **Apple:** prijsbasis Nederland, royaltyvaluta USD naar EUR, DAC7, en de
   abonnementsteksten uit `store/abonnement-teksten.md` zodra het slot van de
   beoordeling eraf is.
7. **Het e-boek als Gumroad-product aanmaken** — `ebook`, `eboek` en `e-boek`
   worden alle drie herkend.

---

## Nagelopen en in orde

Dit stond ook op de lijst en er is niets mis mee. Het staat er zodat het niet
nog een keer hoeft.

- **Geen geheimen in de repository.** Geen IBAN, geen BSN, geen sleutel. De
  enige `.env`-bestanden zijn `darija-kids/.env.demo` en
  `apps/api/.env.example`, beide met voorbeeldwaarden.
- **Het koekje.** `dfk_sessie` met `HttpOnly`, `Secure`, `SameSite=Lax`,
  `Path=/` en `Domain=.darijaforkids.eu`.
- **CORS.** `portaalCors` geeft het exacte adres van de site terug met
  `access-control-allow-credentials` en `vary: origin`, nooit `*`. En omdat
  `/lezen` en `/blad` in `index.ts:858–859` meegenomen zijn in de
  `portaal`-voorwaarde, herschrijft `metAdres` daar het adres met
  `welkAdres()` — dus een bezoeker op `www.` wordt niet geweigerd. Dit was
  mijn eerste vermoeden van een lek en het is er geen.
- **Geen IDOR op `/blad`.** `toegang()` geeft `reeksen` terug als `string[]`,
  dus `mag.reeksen.includes(reeks)` is een exacte vergelijking en geen
  deelreeks-truc. Had het een string geweest, dan was `reeks: "s"` erdoor
  geglipt.
- **Geen padtruc op `/blad`.** `taal` wordt gestript met
  `replace(/[^a-z]/g, '')`, `deel` en `nr` gaan door `Number.isInteger`, en
  `reeks` is al vergeleken met wat er gekocht is.
- **Alle SQL is geparameteriseerd.** Geen enkele aaneenschakeling met `+` of
  een template string in een query.
- **Sleutels en tokens staan nooit in de database**, alleen hun SHA-256. Dat
  geldt voor `bestelling.sleutel_hash` en voor `sessie.token_hash`.
- **Het schema heeft indexen en foreign keys** met `ON DELETE CASCADE` op
  `voortgang`, `opening` en `sessie`.
- **Verlopen sessies en oude mailtellers worden opgeruimd** —
  `portaal.ts:330` en `:336`, aangeroepen bij elke inlog én door de
  cron-trigger `0 7 * * 1` met de `scheduled`-handler op `index.ts:902`.
- **SEO.** `robots.txt` met sitemapverwijzing, een `sitemap.xml` met
  48 adressen, en Open Graph, canonical en hreflang op de pagina's.
- **Snelheid van de site.** 30 MB in totaal, maar elke taal laadt alleen zijn
  eigen film, en die staat op `preload="none"` met een poster en vaste
  `width`/`height`. Negen van de veertien afbeeldingen zijn `loading="lazy"`;
  de vijf die dat niet zijn, staan boven de vouw, waar dat juist is.
