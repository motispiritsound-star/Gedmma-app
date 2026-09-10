# Publiceren

De app is een statische site. `npm run build` schrijft alles naar `dist/`:
HTML, JavaScript, CSS, de fonts, de iconen, het manifest en de service worker.
Er is geen server, geen database en geen omgevingsvariabele nodig.

## Eén ding om goed te zetten

Het is een single-page app: `/leren`, `/les/groeten-1` en `/woorden` bestaan
niet als bestand. De host moet onbekende paden beantwoorden met `index.html`
(status 200, geen redirect). Voor Cloudflare Pages en Netlify staat dat al in
`public/_redirects`:

```
/*    /index.html   200
```

Op andere hosts:

- **Vercel** — `vercel.json` met een rewrite van `/(.*)` naar `/index.html`.
- **GitHub Pages** — kopieer `dist/index.html` naar `dist/404.html`.
- **Nginx** — `try_files $uri $uri/ /index.html;`.
- **Caddy** — `try_files {path} /index.html`.

## Cloudflare Pages

| Instelling | Waarde |
|---|---|
| Build command | `npm ci && npm run build` |
| Build output directory | `dist` |
| Root directory | `gedmma` |
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
