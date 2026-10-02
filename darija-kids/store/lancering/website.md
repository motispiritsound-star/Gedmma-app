# De website op de dag van de lancering

Wat er op darijaforkids.eu omgaat, wat er al om is, en in welke volgorde je het
doet.

Nagemeten en niet afgeleid: `scripts/live.mjs` en `scripts/make-site.mjs` zijn
in een kopie van de map gedraaid met drie standen van `src/site/links.ts` —
allebei de adressen leeg, alleen Apple, allebei gevuld — en de drie gezette
sites liggen naast elkaar. Wat hieronder staat is het verschil tussen die drie.

## De site staat al half om

In `src/site/links.ts` regel 15–18 staat dit:

```ts
export const STORE = {
  apple: 'https://apps.apple.com/app/id6813964474',
  google: '',
}
```

Eén vlag bedient het hele blok: `const LIVE = Boolean(STORE.apple ||
STORE.google)` in `scripts/make-site.mjs` regel 377. Eén adres is dus al genoeg,
en dat ene adres staat erin. De site staat daarmee nu al niet meer op
"binnenkort":

- de badge *Binnenkort beschikbaar* is weg
- de regel *De app ligt bij Apple en Google ter beoordeling* is weg
- het e-mailveld *Hou me op de hoogte* eronder is weg
- de balk onderaan zegt *Download de app*
- de App Store-knop is een echte link

Wat er nog op "binnenkort" staat is één ding: de Google Play-knop. Dat is een
`<span aria-disabled="true">` op achttien bladzijden, vierentwintig keer — de
startpagina draagt hem twee keer. In het Nederlands staat er *Binnenkort* in,
in de vijf andere talen *Bientôt*, *Demnächst*, *Muy pronto*, *Presto* en
*Coming soon*.

Nakijken zonder iets te wijzigen: `npm run live` zonder vlaggen drukt de twee
adressen af en zegt *De website is live*. Hij schrijft dan niets.

**`docs/GO-LIVE.md` regel 205–213 loopt hier een stap achter.** Daar staat dat
het commando zelf om het Apple ID vraagt en dat het blok "binnenkort" dan
verdwijnt. Dat vragen gebeurt niet meer: `scripts/live.mjs` regel 74 vraagt
alleen als `STORE.apple` leeg is, en dat is hij niet. En het blok is al weg.

## Wat er precies omgaat

### De twee knoppen — per winkel apart

`scripts/make-site.mjs` regel 379–381 en 387–388. Leeg adres geeft een `span`
met `aria-disabled="true"` en het woord *Binnenkort* erboven; een gevuld adres
geeft een `a` met `href` en `rel="noopener"`, en het bovenschrift wordt
*Download in de* bij Apple en *Ontdek het op* bij Google.

### De badge, de regel en het e-mailveld — allebei de winkels tegelijk

De badge hangt aan `LIVE` (regel 574). De regel *ter beoordeling* en het
aanmeldformulier eronder hangen er samen aan (regel 391–392). Ze kijken niet
naar welke winkel open is, alleen of er één open is. Daarom zijn ze alle
drie al verdwenen toen alleen Apple erin ging.

### De balk onderaan

`scripts/make-site.mjs` regel 699. Daar wisselt alléén het opschrift: *Hou me op
de hoogte* wordt *Download de app*. De link blijft `#download`, dus die balk
scrolt naar het downloadblok onderaan dezelfde bladzijde — hij downloadt niets.

Hij staat op de zes startpagina's en nergens anders, en `src/site/site.css`
regel 741–757 laat hem alleen zien onder 52rem. Op een laptop ziet niemand hem.

### Welke bladzijden het raakt

Het downloadblok staat op drie bladzijden: de startpagina (twee keer — in de
hero en in het blok *Begin vanavond nog*), `/ouders` en `/geschiedenis`. Dat is
drie × zes talen = achttien bestanden.

Gemeten van leeg naar allebei gevuld: precies die achttien veranderen, en geen
enkele andere van de zestig. `/leesboeken`, `/afrekenen`, `/portaal`,
`/privacy`, `/voorwaarden`, `/naam`, `/lezen` en de 404 blijven letter voor
letter hetzelfde.

### Wat er op de dag zelf nog verandert

Omdat Apple er al in staat, is de omslag van volgende week klein: twee regels
per startpagina en één regel per ouders- en geschiedenispagina. Steeds dezelfde
regel, van

```html
<span class="store" aria-disabled="true">…<span class="small">Binnenkort</span><span class="big">Google Play</span>…</span>
```

naar

```html
<a class="store" href="https://play.google.com/store/apps/details?id=app.darijaforkids.learn" rel="noopener">…<span class="small">Ontdek het op</span><span class="big">Google Play</span>…</a>
```

Dat Play-adres is niets anders dan het application id in een URL, dus het
script weet het zelf (`playStoreUrl()` in `src/site/links.ts` regel 41). Er valt
voor Google niets op te zoeken en niets over te typen.

## De opdrachten, in volgorde

Windows PowerShell 5.1. Elke regel zoekt zelf de projectmap op, dus je kunt ze
los van elkaar plakken en in willekeurige vensters.

**1. Kijken waar het op staat.** Schrijft niets.

```powershell
if (-not $p) { $p = (Get-ChildItem $HOME -Recurse -Depth 5 -Filter darija-kids -Directory -ErrorAction SilentlyContinue | Select-Object -First 1).FullName }; if ($p) { npm --prefix $p run live } else { "darija-kids niet gevonden onder $HOME" }
```

**2. Google erbij zetten.** Pas draaien als het Play-adres echt opengaat in een
browser waar je niet bent ingelogd.

```powershell
if (-not $p) { $p = (Get-ChildItem $HOME -Recurse -Depth 5 -Filter darija-kids -Directory -ErrorAction SilentlyContinue | Select-Object -First 1).FullName }; if ($p) { npm --prefix $p run live -- --google } else { "darija-kids niet gevonden onder $HOME" }
```

Hij schrijft het adres in `src/site/links.ts`, drukt af wat er nu staat, en zet
de site opnieuw. Hij vraagt niets. Draai je hem een tweede keer, dan zegt hij
*Er verandert niets; dit staat er al* en stopt.

**3. De gezette site nalopen.** `npm run live` draait `make-site.mjs` wel en
`sitecheck.mjs` niet, dus die hoort hier apart. Met `--extern` haalt hij de
externe adressen ook echt op — daar zitten de twee winkeladressen bij.

```powershell
if (-not $p) { $p = (Get-ChildItem $HOME -Recurse -Depth 5 -Filter darija-kids -Directory -ErrorAction SilentlyContinue | Select-Object -First 1).FullName }; if ($p) { npm --prefix $p run sitecheck -- --extern } else { "darija-kids niet gevonden onder $HOME" }
```

**4, 5 en 6. Vastleggen en pushen.** Drie regels, elk op zichzelf.

```powershell
if (-not $p) { $p = (Get-ChildItem $HOME -Recurse -Depth 5 -Filter darija-kids -Directory -ErrorAction SilentlyContinue | Select-Object -First 1).FullName }; if ($p) { git -C $p add -A } else { "darija-kids niet gevonden onder $HOME" }
```

```powershell
if (-not $p) { $p = (Get-ChildItem $HOME -Recurse -Depth 5 -Filter darija-kids -Directory -ErrorAction SilentlyContinue | Select-Object -First 1).FullName }; if ($p) { git -C $p commit -m "De app staat in de winkel" } else { "darija-kids niet gevonden onder $HOME" }
```

```powershell
if (-not $p) { $p = (Get-ChildItem $HOME -Recurse -Depth 5 -Filter darija-kids -Directory -ErrorAction SilentlyContinue | Select-Object -First 1).FullName }; if ($p) { git -C $p push } else { "darija-kids niet gevonden onder $HOME" }
```

**7. Zelf kijken**, op darijaforkids.eu, op allebei de knoppen, in een browser
waar je niet bent ingelogd. Pas daarna posten.

**Terug, als er iets niet klopt:**

```powershell
if (-not $p) { $p = (Get-ChildItem $HOME -Recurse -Depth 5 -Filter darija-kids -Directory -ErrorAction SilentlyContinue | Select-Object -First 1).FullName }; if ($p) { npm --prefix $p run live -- --uit } else { "darija-kids niet gevonden onder $HOME" }
```

Dat zet allebei de adressen leeg. Let op wat daar nog meer aan vastzit: de badge
en het aanmeldveld komen dan terug, en de App Store-knop gaat weer uit — ook de
knop die nu al werkt. `--uit` is één schakelaar voor allebei.

### Wat de push wél en niet doet

`site/` staat in `.gitignore` (regel 29). Wat je pusht is dus `src/site/links.ts`
en verder niets; de gezette bladzijden gaan niet mee. Netlify bouwt ze zelf uit
de bron — `netlify.toml` in de bovenliggende map: `base = "darija-kids"`,
`command = "npm run build"`, `publish = "site"`. En `npm run build` eindigt op
`sitecheck.mjs`, dus een dode link laat de uitrol vallen in plaats van hem te
publiceren.

Daarom publiceert stap 1 tot 3 hierboven niets. Wat die stappen in `site/`
zetten staat er om zelf na te kijken en gaat niet mee met de push; het enige
wat stap 2 vastlegt is `src/site/links.ts`. Iets in `site/` repareren heeft dus
geen zin.

### Twee dingen die mis kunnen gaan

**`make-site.mjs` valt om na het schrijven.** `live.mjs` schrijft `links.ts` op
regel 128 en zet de site pas op regel 145. Breekt het zetten, dan staat het
adres er al in en krijg je *De site is niet gezet. Draai `npm run site` en kijk
wat hij zegt.* Je hoeft dan niet opnieuw `--google` te geven; het bestand klopt
al.

**Het `STORE`-blok is met de hand uit zijn vorm gehaald.** Dan vindt de regexp
op regel 122 hem niet, schrijft het script niets en zegt het dat. Zet het blok
terug in de vorm van vier regels hierboven.

## Wat er verder nog aan de site moet

Vijf dingen, met het bestand en de regel erbij. De eerste twee staan op de
bladzijde waar je volgende week iedereen naartoe stuurt.

### 1. "Muy pronto" en "Presto" staan nog in de omschrijving — es en it

`src/site/copy.ts` regel 752 (Spaans) en regel 981 (Italiaans). Die
`metaDescription` eindigt op *Muy pronto en la App Store y en Google Play* en
*Presto su App Store e Google Play*. Dat is de tekst die Google in een
zoekresultaat zet en die een linkvoorbeeld in WhatsApp laat zien.

Dezelfde zin staat ook op regel 25 (nl), 294 (fr), 523 (de) en 1210 (en), maar
daar komt hij niet op de bladzijde: `kort()` in `scripts/make-site.mjs` regel
269–276 kapt de omschrijving af op 155 tekens, op een zinseinde. Die vier zijn
186, 164, 166 en 161 tekens lang, dus de laatste zin valt eraf. Spaans is er
147 en Italiaans 153 — net binnen de grens, dus die blijft staan.

Weghalen in alle zes, niet in twee. De zin staat er nu bij vier talen door een
toevalligheid niet, en wie morgen één woord uit een eerdere zin schrapt zet hem
er bij die taal weer op.

### 2. De tweede foto op de startpagina is het abonnementsscherm

De fotostrook *Zo ziet het eruit* leest `site-assets/shots/<taal>/` en sorteert
die met een kale `.sort()` — `scripts/make-site.mjs` regel 1940. Daardoor komt
`10.webp` tussen `1.webp` en `2.webp` te staan.

`10.webp` is het aanbodscherm: twee prijsblokken, *€ 5,00 p/m* en *€ 6,99 p/m*,
met de voetregel *3 dagen gratis · één abonnement voor het hele gezin*. Dat
staat nu op plek twee, met de alt-tekst van een ander scherm eraan. Een
zichtbaar bijschrift heeft de strook niet.

Drie dingen zitten hier aan vast:

- **De alt-teksten lopen een plaats uit de pas.** `src/site/copy.ts` regel 257
  (en 489, 718, 947, 1176, 1406) heeft negen omschrijvingen voor tien foto's.
  Het aanbodscherm heet nu *Het Arabische alfabet*, en de laatste foto in de
  strook (`9.webp`) valt terug op *Zo ziet het eruit*. Negen van de tien
  omschrijvingen horen bij een andere foto. Een numerieke sortering op regel
  1940 zet er negen terug op hun eigen foto; het aanbodscherm staat dan
  achteraan en valt op de terugval, en daarvoor is een tiende regel in
  `beeldAlt` nodig. Die tiende regel alléén helpt niets: dan krijgt `9.webp` de
  omschrijving van het aanbodscherm.
- **De gezinsregel staat er zonder voorbehoud.** `scripts/make-siteassets.mjs`
  regel 80 haalt de foto's uit `store/screenshots/<taal>/iphone/`, dus uit de
  Apple-set, en `scripts/make-screenshots.mjs` regel 202 geeft die set de
  Apple-voetregel. Op een website die allebei de winkels bedient klopt dat maar
  voor de helft: bij Google deelt het gezin niet. De FAQ op diezelfde bladzijde
  zegt het wel goed (`src/i18n/nl.ts` regel 712: *Op iPhone en iPad … Op Android
  …*), dus de foto spreekt de tekst eronder tegen.
- **Engels heeft die foto niet, en dat is goed.** `scripts/make-screenshots.mjs`
  regel 182 laat `10-aanbod` bij Engels weg, omdat de Engelse vermelding
  wereldwijd de terugval is en er euro's op zouden staan. De Engelse strook
  telt dus negen en zegt ook negen. Dat is geen gat om te vullen.

### 3. De foto's en de film zijn van 22 september

`site-assets/shots/` en `site-assets/film/` dateren van 22 september. Het
startscherm uit 1.4 — naam, dier, meeleesvorm, kleur — staat er dus niet op, en
de kleur die je kiest ook niet. Precies het stuk waar de aankondiging mee opent.

Opnieuw schieten is geen klein klusje: `npm run preview` moet draaien, dan
`npm run screenshots`, dan `npm run siteassets`, en die laatste hercodeert ook
de film. `store/screenshots/` staat in `.gitignore` (regel 6), dus de tussenstap
staat niet in de repo.

Het is te verdedigen om dit ná de lancering te doen. Wat ontbreekt is het
nieuwe begin. De negen andere schermen zijn niet één voor één nagelopen;
`6.webp` draagt in elk geval al een naam en een dier.

### 4. Het aanmeldveld staat niet meer op de startpagina

Dat ging vanzelf goed, maar het heeft een gevolg dat niet vanzelf goed gaat.

Het veld hing aan `LIVE`, dus het is al weg — sinds het Apple-adres erin ging,
niet pas volgende week. Van de zestig bladzijden houden er nog zes een
e-mailveld, en dat zijn de zes van `/leesboeken`: `scripts/make-site.mjs` regel
1115, met een eigen onderschrift *Eén bericht zodra er een nieuw deel is*
(`src/site/copy.ts` regel 235). Dat veld staat er onvoorwaardelijk en kijkt niet
naar de winkeladressen, dus daar verandert niets aan, en die tekst gaat over een
volgend deel en klopt na de lancering nog steeds.

De vraag die overblijft: de startpagina heeft geen enkele manier meer om een
adres op te halen. Dat is een keuze, geen fout — maar maak hem bewust.

Wie er nu op de lijst staat, staat in de tafel `lid` en wordt gemaild via
`nieuwsbrieflijst()` in `server/src/portaal.ts`. Dat vinkje alleen is geen
grond; de bevestigde klik is dat wel. Zie `docs/STAND.md`, *Het ledenbestand*.

### 5. Klein: de FAQ noemt de drie dagen niet

`src/i18n/nl.ts` regel 712 zegt *met de eerste dagen gratis*, en de vijf andere
talen zeggen hetzelfde op regel 698. Het aanbodscherm in de app zegt het wel:
*Na 3 gratis dagen* (`src/i18n/nl.ts` regel 758). De aankondiging zegt drie
dagen, en `10.webp` draagt *3 dagen gratis* in zijn voetregel — op de
startpagina van vijf van de zes talen. Daaronder staat dan de FAQ die het niet
zegt.

De zes winkelvermeldingen zeggen het trouwens net zo vaag als de FAQ:
*de eerste dagen gratis*, `store/listing.nl.md` regel 64 en zijn vijf buren.
Die vallen buiten dit stuk; het is dezelfde zin en hetzelfde werk.

En het e-boek bij het jaarabonnement staat er in de FAQ helemaal niet, terwijl
het aanbodscherm op diezelfde bladzijde *incl. e-boek* laat zien.

In de FAQ is het twee woorden werk, zes talen. Het houdt de lancering niet
tegen.
