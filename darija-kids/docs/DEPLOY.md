# Publiceren

Er zijn twee dingen die gebouwd worden, en ze gaan niet naar dezelfde plek.

| | Wat | Waarheen |
|---|---|---|
| `npm run build:app` | `dist/` — de app zelf | in de iOS- en Android-schil, via `npx cap sync` |
| `npm run site` | `site/` — de website | darijaforkids.eu |
| `npm run build` | allebei | de bouwmachine draait dit |

De app staat **niet** op het web. Dat is een keuze: wie de hele cursus gratis
in een browser kan openen, downloadt hem niet uit de winkel, en de winkels zijn
waar de app verkocht wordt. Op darijaforkids.eu staat een etalage — de film,
de schermen, het leerpad, de vragen, en de drie pagina's die Apple en Google
willen kunnen lezen voordat ze een app aannemen.

## De website

`npm run site` schrijft vierentwintig pagina's: vier in elk van de zes talen.

```
site/
  index.html            /            Nederlands
  privacy/              /privacy
  voorwaarden/          /voorwaarden
  ouders/               /ouders
  fr/ de/ es/ it/ en/   dezelfde vier, met eigen woorden in het adres
  404.html  sitemap.xml  robots.txt  sw.js
  site.css  shots/  film/  fonts/  icons/  og.png
```

Het zijn gewone HTML-bestanden zonder JavaScript. De teksten komen uit de
modules die de app zelf ook gebruikt — `src/i18n/`, `src/content/` — zodat een
belofte op de website niet los kan raken van wat de app doet. Alleen wat de
app niet kent (de download, de film, de contactgegevens) staat in
`src/site/copy.ts`.

De **adressen van de drie winkelpagina's staan vast**: `/privacy`,
`/voorwaarden` en `/ouders` zijn ingevuld in App Store Connect en in de Play
Console. `src/site/site.test.ts` bewaakt dat ze niet verschuiven.

### De beelden en de film

`site-assets/` staat in de repo en is bouwresultaat van `npm run siteassets`.
Dat script leest `store/screenshots/` en `store/video/` — mappen die git
negeert omdat er honderden megabytes in zitten — en perst ze samen tot iets
wat een telefoon op 4G wil afwachten: schermen als WebP van 430 pixels breed,
de film als H.264 van 1280 breed. Samen ruim acht megabyte voor zes talen.

Twee dingen die daar met opzet gebeuren. De film wordt omgezet van VP9 naar
H.264: Safari op een iPhone speelt de oorspronkelijke niet af, en een iPhone
is precies wie deze pagina moet overtuigen. En er wordt een poster uit seconde
twee gehaald, want het eerste beeld van de film is zwart.

Draai `npm run siteassets` opnieuw wanneer de schermen of de film veranderen,
en zet het resultaat in de commit. De bouwmachine heeft geen ffmpeg en geen
browser, en hoeft dat ook niet te hebben.

### Een winkel-link toevoegen

Zolang `STORE.apple` en `STORE.google` in `src/site/links.ts` leeg zijn, toont
de site knoppen met "Binnenkort" erop en een mailadres eronder. Zet de echte
adressen erin en het worden gewone downloadknoppen — dat is het enige dat
daarvoor hoeft te veranderen.

Let op: Apple en Google schrijven voor hoe hun eigen knop eruitziet. Zodra de
links er zijn, hoort daar de officiële badge bij. Die staat nu bewust niet op
de site: een nagemaakt Apple-logo onder een knop die nergens heen gaat, is
precies het soort merkgebruik waar zij bezwaar tegen maken.

## Uit de repo laten bouwen

Dat is de minste moeite op den duur: je zet het één keer op en daarna gaat
elke wijziging vanzelf live.

**Cloudflare Workers** — zo staat het nu. Het project heet `darijaforkids` en
leest `darija-kids/wrangler.toml`:

| Veld | Waarde |
|---|---|
| Root directory | `darija-kids` |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Omgevingsvariabele | `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD` = `1` |

Welke map de lucht in gaat staat niet in dat scherm maar in `wrangler.toml`:
`[assets] directory = "site"`. Daar staat ook `html_handling` (zodat
`/privacy` het bestand `/privacy/index.html` oplevert zonder omleiding) en
`not_found_handling = "404-page"`.

Die laatste variabele is nodig omdat de repo Playwright meebrengt voor de
controles, en die browsers hoeven niet mee in een bouw van de website —
zonder die variabele haalt npm er een paar honderd megabyte aan browsers bij
die niemand gebruikt.

**Netlify** leest `netlify.toml` in de wortel van de repo; daar staat alles al
in. Je kiest de repo, kiest de branch, en drukt op bouwen.

Op andere hosts is er weinig te regelen: het is een map met bestanden. Een
host die `/privacy` niet vanzelf naar `/privacy/index.html` vertaalt, is de
enige die aandacht vraagt — Nginx doet dat met `try_files $uri $uri/ =404;`.

## De service worker die er niet meer is

Toen de app hier nog stond, installeerde hij een service worker die de hele
app in de cache zette. Wie darijaforkids.eu toen heeft geopend, heeft die nog.
Zonder tegenmaatregel krijgt zo iemand de oude app te zien in plaats van de
site — voor onbepaalde tijd.

Daarom schrijft `make-site.mjs` een `sw.js` die zichzelf opruimt: hij leegt de
caches, schrijft zichzelf uit en herlaadt het venster. Elke pagina heeft
daarnaast een regeltje script dat hetzelfde doet, voor het geval de browser de
nieuwe `sw.js` nog niet heeft opgehaald. Dat is het enige JavaScript op de
hele site, en het mag pas weg als niemand meer een oude registratie heeft —
zeg over een jaar.

## Het domein

`darijaforkids.eu` staat bij MijnDomein geregistreerd en gebruikt de
nameservers van Cloudflare (`lennox` en `lilith`). De Worker is eraan
gekoppeld als *custom domain*, voor zowel `darijaforkids.eu` als
`www.darijaforkids.eu`; Cloudflare maakt die DNS-regels zelf en levert het
certificaat.

`darijaforkids.nl` is ook geregistreerd en wordt een omleiding naar `.eu`.
