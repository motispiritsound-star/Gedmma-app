import { createServer as createHttpServer, type Server } from 'node:http';
import { createServer as createHttpsServer } from 'node:https';
import { gzipSync } from 'node:zlib';

type Site = {
  path: string;
  bedrijf: string;
  plaats: string;
  branche: string;
  domein: string;
  status?: number;
  headers?: Record<string, string>;
  /** Draait deze site op https? Oude sites in de praktijk vaak niet. */
  secure?: boolean;
  /** Levert de server gecomprimeerd en met cache-headers uit? */
  goedGeconfigureerd?: boolean;
  /** Kunstmatige vertraging, om trage hosting na te bootsen. */
  delayMs?: number;
  html: string;
};

const lorem = (zin: string, keer: number) => Array.from({ length: keer }, () => zin).join(' ');

/**
 * Vult een stylesheet met plausibele regels. Echte bedrijfssites slepen tientallen
 * kilobytes aan thema- en plugin-CSS mee; zonder die vulling meet de scan een
 * paginagewicht van een paar honderd bytes en klopt het snelheidsoordeel niet.
 */
const themaCss = (regels: number) => Array.from({ length: regels }, (_, i) =>
  `.blok-${i} .inner{margin:0 auto;padding:${i % 20}px;color:#33${(i % 9)}${(i % 7)}4;` +
  `background:#f${i % 9}f${i % 7}fa;border:1px solid #e${i % 8}e${i % 6}ee;font-size:${12 + (i % 6)}px;` +
  `line-height:1.${40 + (i % 20)};text-decoration:none;display:block}`).join('\n');

/** Ouderwetse tabel-site uit ongeveer 2006. */
const tabelSite = (naam: string, plaats: string, jaar: number, tekst: string, telefoon: string) => `<html>
<head><title></title>
<style>${themaCss(180)}</style>
</head>
<body bgcolor="#FFFFCC">
<table width="900" border="0"><tr><td>
<center><font face="Arial" size="6" color="#003366">${naam}</font></center>
<table width="880"><tr><td width="200" bgcolor="#003366">
<font color="#FFFFFF"><b>Menu</b></font><br>
<a href="/home">Home</a><br><a href="/diensten">Diensten</a><br><a href="/contact">Contact</a>
</td><td>
<img src="/images/foto1.jpg"><img src="/images/foto2.gif">
<p><font face="Arial" size="2">${tekst}</font></p>
<p><font face="Arial" size="2">Wij zijn gevestigd in ${plaats}. ${lorem('Onze monteurs werken in de hele regio en komen op afspraak vrijblijvend langs om de situatie te bekijken.', 4)}</font></p>
<p><font face="Arial" size="2">Telefoon: ${telefoon}</font></p>
<script src="/js/jquery-1.4.2.min.js"></script>
<script src="/js/swfobject.js"></script>
<object type="application/x-shockwave-flash" data="/banner.swf" width="468" height="60"></object>
</td></tr></table>
<hr><center><font size="1">&copy; ${jaar} ${naam} - Alle rechten voorbehouden</font></center>
</td></tr></table>
</body></html>`;

/** Verouderde WordPress-site: wel een titel, geen mobiele weergave. */
const oudeWordpress = (naam: string, plaats: string, wpVersie: string, jaar: number, tekst: string, telefoon: string) => `<html>
<head>
<meta name="generator" content="WordPress ${wpVersie}">
<title>${naam}</title>
<link rel="stylesheet" href="/wp-content/themes/twentyeleven/style.css">
<style>${themaCss(320)}</style>
<script src="/wp-includes/js/jquery/jquery-1.11.3.min.js"></script>
</head>
<body class="home">
<div id="wrapper" style="width:960px;margin:0 auto">
<h1>${naam}</h1>
<img src="/wp-content/uploads/2013/06/header.jpg">
<p>${tekst}</p>
<p>Bel ons op ${telefoon} of kom langs in ${plaats}. ${lorem('Wij werken zowel voor particulieren als voor bedrijven en zijn op werkdagen telefonisch bereikbaar tussen acht en vijf.', 4)}</p>
<img src="/wp-content/uploads/2013/06/werk1.jpg"><img src="/wp-content/uploads/2013/06/werk2.jpg">
<img src="/wp-content/uploads/2013/06/werk3.jpg"><img src="/wp-content/uploads/2013/06/werk4.jpg">
<img src="/wp-content/uploads/2013/06/werk5.jpg"><img src="/wp-content/uploads/2013/06/werk6.jpg">
<p>&copy; ${jaar} ${naam}</p>
</div>
</body></html>`;

/** Redelijke site: mobiel in orde, maar SEO en snelheid laten steken vallen. */
const middenmoot = (naam: string, plaats: string, tekst: string, telefoon: string, opties: { titel?: string } = {}) => `<!doctype html>
<html lang="nl"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${opties.titel ?? naam}</title>
<style>@media(max-width:700px){.kolom{width:100%}}
${themaCss(260)}</style>
<script src="/js/jquery-3.6.0.min.js"></script>
<script src="/js/slider.js"></script>
<script src="/js/analytics.js"></script>
</head><body>
<h1>${naam}</h1>
<img src="/img/banner.jpg" alt="">
<p>${tekst}</p>
<img src="/img/team.jpg"><img src="/img/werkplaats.jpg"><img src="/img/detail.jpg">
<a href="/contact">Contact</a>
<p>Bereikbaar op <a href="tel:${telefoon.replace(/[^0-9+]/g, '')}">${telefoon}</a>.</p>
<p>${naam}, ${plaats}. &copy; ${new Date().getFullYear()}</p>
</body></html>`;

/** Moderne, goed verzorgde site. */
const modern = (naam: string, plaats: string, titel: string, omschrijving: string, tekst: string, telefoon: string, email: string) => `<!doctype html>
<html lang="nl"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titel}</title>
<meta name="description" content="${omschrijving}">
<link rel="canonical" href="https://example.nl/">
<link rel="icon" href="/favicon.svg">
<meta property="og:title" content="${titel}">
<meta property="og:image" content="/og.jpg">
<style>@media (max-width:768px){.grid{display:block}}
${themaCss(140)}</style>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"LocalBusiness","name":"${naam}","telephone":"${telefoon}","address":{"@type":"PostalAddress","addressLocality":"${plaats}"},"openingHours":"Mo-Fr 08:00-17:00"}</script>
</head><body>
<h1>${titel}</h1>
<p>${tekst}</p>
<img src="/img/team.webp" alt="Het team van ${naam}" width="1200" height="800" loading="lazy" srcset="/img/team.webp 1200w">
<img src="/img/werk.webp" alt="Een recent project in ${plaats}" width="1200" height="800" loading="lazy">
<form action="/offerte" method="post">
  <label for="naam">Uw naam</label><input id="naam" name="naam">
  <button type="submit">Offerte aanvragen</button>
</form>
<a href="tel:${telefoon.replace(/[^0-9+]/g, '')}">${telefoon}</a>
<a href="mailto:${email}">${email}</a>
<a href="https://www.linkedin.com/company/voorbeeld">LinkedIn</a>
<a href="https://www.instagram.com/voorbeeld">Instagram</a>
<a href="/privacyverklaring">Privacyverklaring</a>
<a href="/algemene-voorwaarden">Algemene voorwaarden</a>
<p>&copy; ${new Date().getFullYear()} ${naam}, ${plaats}</p>
</body></html>`;

export type { Site };

export const SITES: Site[] = [
  {
    path: '/de-kraan', delayMs: 1900, bedrijf: 'Loodgietersbedrijf De Kraan', plaats: 'Utrecht',
    branche: 'loodgieter', domein: 'loodgieter-dekraan.nl',
    headers: { 'x-powered-by': 'PHP/5.4.45', server: 'Apache/2.2.15' },
    html: tabelSite('Loodgietersbedrijf De Kraan', 'Utrecht', 2009,
      'Voor al uw loodgieterswerk. Lekkage? Bel ons! Wij komen door heel de regio.', '030-2871934'),
  },
  {
    path: '/schilders-vermeer', delayMs: 2400, bedrijf: 'Schildersbedrijf Vermeer', plaats: 'Amersfoort',
    branche: 'schilder', domein: 'schildersbedrijfvermeer.nl',
    headers: { 'x-powered-by': 'PHP/5.6.40' },
    html: oudeWordpress('Schildersbedrijf Vermeer', 'Amersfoort', '4.7.2', 2016,
      lorem('Wij verzorgen binnen- en buitenschilderwerk voor particulieren en bedrijven.', 3), '033-4612780'),
  },
  {
    path: '/bakkerij-molentje', delayMs: 1400, bedrijf: 'Bakkerij Het Molentje', plaats: 'Zeist',
    branche: 'bakkerij', domein: 'bakkerijhetmolentje.nl',
    html: `<html><head><title>Welkom</title><style>${themaCss(90)}</style></head><body>
      <center><h1>Bakkerij Het Molentje</h1>
      <img src="/brood.jpg"><img src="/taart.jpg"><img src="/winkel.jpg">
      <p>Ambachtelijk brood en banket. ${lorem('Elke ochtend bakken wij vers in onze eigen bakkerij aan de Slotlaan, met desem dat we al dertig jaar in huis houden.', 4)}</p>
      <p>Openingstijden: di t/m za 07.00 - 17.00</p>
      <p>Telefoon: 030-6915522</p>
      <p>&copy; 2014</p></center></body></html>`,
  },
  {
    path: '/autobedrijf-jansen', delayMs: 3800, bedrijf: 'Autobedrijf Jansen', plaats: 'Nieuwegein',
    branche: 'autobedrijf', domein: 'autobedrijfjansen.nl',
    headers: { 'x-powered-by': 'PHP/7.2.34' },
    html: oudeWordpress('Autobedrijf Jansen', 'Nieuwegein', '5.4.2', 2019,
      lorem('APK, onderhoud en reparatie van alle merken. Ook occasions met garantie.', 4), '030-6039215'),
  },
  {
    path: '/hovenier-groenrijk', delayMs: 2100, bedrijf: 'Hovenier Groenrijk', plaats: 'Veenendaal',
    branche: 'hovenier', domein: 'hoveniergroenrijk.nl',
    html: tabelSite('Hovenier Groenrijk', 'Veenendaal', 2011,
      'Tuinaanleg en onderhoud. Vraag vrijblijvend een offerte aan.', '0318-521470'),
  },
  {
    path: '/kapsalon-lisa', delayMs: 1250, bedrijf: 'Kapsalon Lisa', plaats: 'Utrecht',
    branche: 'kapper', domein: 'kapsalonlisa.nl', secure: true, goedGeconfigureerd: true,
    html: `<html><head><meta name="generator" content="Wix.com Website Builder">
      <style>${themaCss(200)}</style></head>
      <body><div id="SITE_CONTAINER"><h1>Kapsalon Lisa</h1>
      <script src="https://static.wixstatic.com/services/main.js"></script>
      <p>Knippen, kleuren en stylen in hartje Utrecht. Bel voor een afspraak. ${lorem('Wij werken met en zonder afspraak en nemen ruim de tijd voor een kleurbehandeling.', 5)}</p>
      <img src="https://static.wixstatic.com/media/salon.jpg">
      <img src="https://static.wixstatic.com/media/kleuren.jpg">
      <p>Bel <a href="tel:0302410088">030-2410088</a> of loop binnen aan de Voorstraat.</p>
      <p>&copy; 2021 Kapsalon Lisa</p></div></body></html>`,
  },
  {
    path: '/restaurant-de-hoek', delayMs: 940, bedrijf: 'Restaurant De Hoek', plaats: 'Amersfoort',
    branche: 'restaurant', domein: 'restaurantdehoek.nl', secure: true, goedGeconfigureerd: true,
    html: middenmoot('Restaurant De Hoek', 'Amersfoort',
      lorem('Seizoensgebonden gerechten met producten uit de streek. Reserveren wordt aanbevolen. De kaart wisselt elke zes weken mee met wat de telers in de omgeving aanbieden.', 5),
      '033-4728190', { titel: 'Restaurant De Hoek' }),
  },
  {
    path: '/fysio-beweegt', delayMs: 780, bedrijf: 'Fysiotherapie Beweegt', plaats: 'Zeist',
    branche: 'fysiotherapie', domein: 'fysiobeweegt.nl', secure: true, goedGeconfigureerd: true,
    html: middenmoot('Fysiotherapie Beweegt', 'Zeist',
      lorem('Fysiotherapie, manuele therapie en revalidatie. Aangesloten bij alle zorgverzekeraars. U kunt zonder verwijzing van de huisarts bij ons terecht.', 5),
      '030-6924415', { titel: 'Fysiotherapie Beweegt Zeist' }),
  },
  {
    path: '/drukkerij-vandenberg', delayMs: 2600, bedrijf: 'Drukkerij Van den Berg', plaats: 'Nieuwegein',
    branche: 'drukkerij', domein: 'drukkerijvandenberg.nl',
    headers: { 'x-powered-by': 'PHP/5.3.29' },
    html: tabelSite('Drukkerij Van den Berg', 'Nieuwegein', 2008,
      'Drukwerk voor bedrijven: visitekaartjes, folders, briefpapier en meer.', '030-6041188'),
  },
  {
    path: '/tandarts-smile', delayMs: 320, bedrijf: 'Tandartspraktijk Smile', plaats: 'Utrecht',
    branche: 'tandarts', domein: 'tandartssmile.nl', secure: true, goedGeconfigureerd: true,
    html: modern('Tandartspraktijk Smile', 'Utrecht',
      'Tandarts in Utrecht — ook op zaterdag terecht | Smile',
      'Tandartspraktijk Smile in Utrecht neemt nieuwe patiënten aan. Avond- en zaterdagafspraken mogelijk, en een eigen mondhygiënist in huis.',
      lorem('Bij Smile bent u terecht voor controles, vullingen, kronen en implantaten. Onze mondhygienist kijkt bij elke halfjaarlijkse controle mee, zodat problemen vroeg aan het licht komen.', 8),
      '030-2345678', 'info@tandartssmile.nl'),
  },
  {
    path: '/installatie-vandijk', delayMs: 410, bedrijf: 'Van Dijk Installatietechniek', plaats: 'Amersfoort',
    branche: 'installateur', domein: 'vandijkinstallatie.nl', secure: true, goedGeconfigureerd: true,
    html: modern('Van Dijk Installatietechniek', 'Amersfoort',
      'Installateur in Amersfoort — cv, warmtepompen en sanitair',
      'Van Dijk Installatietechniek installeert en onderhoudt cv-ketels, warmtepompen en badkamers in Amersfoort en omgeving. Binnen 24 uur bij spoed.',
      lorem('Wij werken voor particulieren, VvE\'s en aannemers in heel Midden-Nederland. Van het vervangen van een cv-ketel tot het compleet verduurzamen van een woning met een warmtepomp en vloerverwarming.', 8),
      '033-4567890', 'info@vandijkinstallatie.nl'),
  },
  {
    path: '/advocaat-mulder', delayMs: 500, bedrijf: 'Advocatenkantoor Mulder', plaats: 'Utrecht',
    branche: 'advocaat', domein: 'advocatenkantoormulder.nl', secure: true, status: 500,
    html: '<h1>Er is een fout opgetreden</h1>',
  },
  {
    path: '/glaszetter-helder', delayMs: 620, bedrijf: 'Glaszetterij Helder', plaats: 'Veenendaal',
    branche: 'glaszetter', domein: 'glaszetterijhelder.nl',
    html: `<html><head><title>glaszetterijhelder.nl</title></head><body>
      <h1>Deze domeinnaam is te koop</h1>
      <p>Geïnteresseerd in glaszetterijhelder.nl? Neem contact op met de eigenaar.</p>
      </body></html>`,
  },
  {
    path: '/dierenarts-poot', delayMs: 6800, bedrijf: 'Dierenartsenpraktijk De Poot', plaats: 'Zeist',
    branche: 'dierenarts', domein: 'dierenartsdepoot.nl', secure: true,
    headers: { 'x-powered-by': 'PHP/7.4.33' },
    html: oudeWordpress('Dierenartsenpraktijk De Poot', 'Zeist', '5.8.6', 2020,
      lorem('Wij behandelen honden, katten en kleine huisdieren. Ook spoedgevallen buiten kantooruren.', 5), '030-6951203'),
  },
  {
    path: '/makelaar-huisenzo', delayMs: 1150, bedrijf: 'Makelaardij Huis & Zo', plaats: 'Nieuwegein',
    branche: 'makelaar', domein: 'makelaardijhuisenzo.nl', secure: true,
    html: middenmoot('Makelaardij Huis & Zo', 'Nieuwegein',
      lorem('Aan- en verkoopbegeleiding, taxaties en woningpresentatie in de regio Utrecht. Wij kennen elke wijk en weten wat een woning hier werkelijk waard is.', 5), '030-6077340'),
  },
];

export type DemoServers = {
  /** Bouwt de URL waarop een site bereikbaar is. */
  urlFor(site: Site): string;
  close(): void;
};

function handler(sites: Site[]) {
  const bySite = new Map(sites.map((site) => [site.path, site]));
  return async (req: { url?: string }, res: any): Promise<void> => {
    const path = (req.url ?? '/').split('?')[0]!;
    if (path === '/robots.txt') {
      res.writeHead(200, { 'content-type': 'text/plain' });
      res.end('User-agent: *\nDisallow: /wp-admin/\n');
      return;
    }
    const site = bySite.get(path);
    if (!site) { res.writeHead(404); res.end('niet gevonden'); return; }
    if (site.delayMs) await new Promise((done) => setTimeout(done, site.delayMs));

    const headers: Record<string, string> = {
      'content-type': 'text/html; charset=utf-8',
      ...(site.headers ?? {}),
    };
    let body: Buffer | string = site.html;
    if (site.goedGeconfigureerd) {
      headers['content-encoding'] = 'gzip';
      headers['cache-control'] = 'public, max-age=3600';
      if (site.secure) headers['strict-transport-security'] = 'max-age=31536000';
      body = gzipSync(Buffer.from(site.html));
    }
    res.writeHead(site.status ?? 200, headers);
    res.end(body);
  };
}

/**
 * Start twee servers: een gewone http-server voor de verouderde sites (die in
 * de praktijk vaak geen SSL hebben) en een https-server voor de rest. Het
 * certificaat is zelfondertekend; de scan vertrouwt het via NODE_EXTRA_CA_CERTS.
 */
export function startDemoServers(cert: { key: string; cert: string }): Promise<DemoServers> {
  const plain: Server = createHttpServer(handler(SITES) as never);
  const secure: Server = createHttpsServer(cert, handler(SITES) as never);

  return new Promise((resolve) => {
    plain.listen(0, '127.0.0.1', () => {
      secure.listen(0, '127.0.0.1', () => {
        const plainPort = (plain.address() as { port: number }).port;
        const securePort = (secure.address() as { port: number }).port;
        resolve({
          urlFor: (site) => site.secure
            ? `https://localhost:${securePort}${site.path}`
            : `http://localhost:${plainPort}${site.path}`,
          close: () => { plain.close(); secure.close(); },
        });
      });
    });
  });
}
