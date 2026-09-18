# Publiceren

De app is een statische site. `npm run build` schrijft alles naar `dist/`:
HTML, JavaScript, CSS, de fonts, de iconen, het manifest en de service worker.
Er is geen server, geen database en geen omgevingsvariabele nodig.

## Eén ding om goed te zetten

Het is een single-page app: `/leren`, `/les/groeten-1` en `/woorden` bestaan
niet als bestand. De host moet onbekende paden beantwoorden met `index.html`
(status 200, geen redirect). Elke host krijgt dat op zijn eigen manier, en die
staan alle drie al klaar:

| Host | Waar het staat |
|---|---|
| Cloudflare Workers | `not_found_handling` in `wrangler.toml` |
| Netlify | `[[redirects]]` in `netlify.toml` |
| Apache — mijndomein, Strato, een eigen VPS | `public/.htaccess`, komt mee in `dist/` |

Er stond ook een `public/_redirects`, want zo doen Pages en Netlify het van
huis uit. Dat bestand komt mee in `dist/`, en Cloudflare Workers leest het ook
— maar weigert de regel `/* /index.html 200` als een oneindige lus en laat de
hele publicatie stranden. Vandaar dat elke host zijn eigen bestand krijgt en
er geen gedeeld bestand meer is dat over de rest heen valt.

## Uit de repo laten bouwen

Dat is de minste moeite op den duur: je zet het één keer op en daarna gaat
elke wijziging vanzelf live.

**Netlify** leest `netlify.toml` in de wortel van de repo; daar staat alles al
in. Je kiest de repo, kiest de branch, en drukt op bouwen.

**Cloudflare Pages** vraagt dezelfde dingen in het scherm:

| Veld | Waarde |
|---|---|
| Framework preset | None |
| Root directory | `darija-kids` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Omgevingsvariabele | `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD` = `1` |

Die laatste is nodig omdat de repo Playwright meebrengt voor de controles, en
die browsers hoeven niet mee in een bouw van de website — zonder die variabele
haalt npm er een paar honderd megabyte aan browsers bij die niemand gebruikt.

Op andere hosts:

- **Vercel** — `vercel.json` met een rewrite van `/(.*)` naar `/index.html`.
- **GitHub Pages** — kopieer `dist/index.html` naar `dist/404.html`.
- **Nginx** — `try_files $uri $uri/ /index.html;`.
- **Caddy** — `try_files {path} /index.html`.

## Op je bestaande hosting zetten

Heb je al een hostingpakket (mijndomein en vergelijkbaar), dan kan de app daar
gewoon op:

1. `npm run build`
2. Zet de **inhoud** van `dist/` in de map van je domein — meestal `httpdocs`,
   `public_html` of `www`. Met FTP, of via de bestandsbeheerder in het
   klantenpaneel. Let op dat `.htaccess` meegaat: veel FTP-programma's
   verbergen bestanden die met een punt beginnen.
3. Open `https://jouwdomein.nl/privacy`. Krijg je de app te zien, dan staat het
   goed. Krijg je een 404, dan is `mod_rewrite` uit of is `.htaccess` niet
   meegekomen.

Het kan, maar het hoeft niet: Cloudflare Pages en Netlify zijn gratis, bouwen
zelf uit deze repo en zetten de site op servers over de hele wereld. Dan hoef
je bij een nieuwe versie niets te uploaden — je pusht, en de site is bij.

## Cloudflare Pages

| Instelling | Waarde |
|---|---|
| Build command | `npm ci && npm run build` |
| Build output directory | `dist` |
| Root directory | `darija-kids` |
| Node-versie | 20 of hoger |

## Na een nieuwe versie

De service worker (`public/sw.js`) pakt een nieuwe versie op zodra de pagina
opnieuw wordt geopend: hij installeert, gooit de oude cache weg en neemt het
direct over. Bij een grote wijziging in wat er in de cache moet staan, hoog je
`VERSION` bovenin dat bestand op.

## Als app installeren

Op Android en desktop biedt de browser "installeren" zelf aan; op iOS gaat het
via Deel → Zet op beginscherm. Daarna opent de app op `/leren`, zonder
browserbalk, en werkt hij zonder internet.
