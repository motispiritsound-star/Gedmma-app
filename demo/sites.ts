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
  /** Hoe levend het bedrijf oogt op de site. */
  leven?: Levensprofiel;
  /** Rechtsvorm; bepaalt of dit bedrijf gebeld mag worden. */
  rechtsvorm?: string | null;
  /** Positie op de kaart; in het echt komt die uit OpenStreetMap of de geocoder. */
  lat?: number;
  lon?: number;
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
/**
 * Tekenen dat er nog een bedrijf achter de site zit. Twee sites kunnen even
 * beroerd zijn terwijl de een volop draait en de ander op sterven na dood is;
 * daar moet de demo het verschil in laten zien.
 */
type Levensprofiel = 'actief' | 'sluimert' | 'stil';

const NU = new Date().getFullYear();

function levensblok(profiel: Levensprofiel, plaats: string): string {
  if (profiel === 'stil') return '';
  if (profiel === 'sluimert') {
    return `<p>Wij zijn er ook in ${NU - 1} weer voor u. Volg ons op <a href="https://www.facebook.com/voorbeeld">Facebook</a>.</p>`;
  }
  return `<p>Nieuws — 12 maart ${NU}: onze nieuwe bus is binnen, we werken nu ook in de omgeving van ${plaats}.</p>
    <p><a href="/vacature">Vacature: wij zoeken een collega</a> — solliciteer gerust.</p>
    <p><a href="/afspraak">Direct online een afspraak maken</a></p>
    <p>Volg ons op <a href="https://www.facebook.com/voorbeeld">Facebook</a> en
       <a href="https://www.instagram.com/voorbeeld">Instagram</a>.</p>
    <p>Of stuur een bericht via <a href="https://wa.me/31600000000">WhatsApp</a>.</p>
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-DEMO"></script>`;
}

const themaCss = (regels: number) => Array.from({ length: regels }, (_, i) =>
  `.blok-${i} .inner{margin:0 auto;padding:${i % 20}px;color:#33${(i % 9)}${(i % 7)}4;` +
  `background:#f${i % 9}f${i % 7}fa;border:1px solid #e${i % 8}e${i % 6}ee;font-size:${12 + (i % 6)}px;` +
  `line-height:1.${40 + (i % 20)};text-decoration:none;display:block}`).join('\n');

/** Ouderwetse tabel-site uit ongeveer 2006. */
const tabelSite = (naam: string, plaats: string, jaar: number, tekst: string, telefoon: string,
  leven: Levensprofiel = 'stil') => `<html>
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
${levensblok(leven, plaats)}
<script src="/js/jquery-1.4.2.min.js"></script>
<script src="/js/swfobject.js"></script>
<object type="application/x-shockwave-flash" data="/banner.swf" width="468" height="60"></object>
</td></tr></table>
<hr><center><font size="1">&copy; ${jaar} ${naam} - Alle rechten voorbehouden</font></center>
</td></tr></table>
</body></html>`;

/** Verouderde WordPress-site: wel een titel, geen mobiele weergave. */
const oudeWordpress = (naam: string, plaats: string, wpVersie: string, jaar: number, tekst: string,
  telefoon: string, leven: Levensprofiel = 'sluimert') => `<html>
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
${levensblok(leven, plaats)}
<p>&copy; ${jaar} ${naam}</p>
</div>
</body></html>`;

/** Redelijke site: mobiel in orde, maar SEO en snelheid laten steken vallen. */
const middenmoot = (naam: string, plaats: string, tekst: string, telefoon: string,
  opties: { titel?: string; leven?: Levensprofiel } = {}) => `<!doctype html>
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
${levensblok(opties.leven ?? 'actief', plaats)}
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
${levensblok('actief', plaats)}
<a href="/privacyverklaring">Privacyverklaring</a>
<a href="/algemene-voorwaarden">Algemene voorwaarden</a>
<p>&copy; ${new Date().getFullYear()} ${naam}, ${plaats}</p>
</body></html>`;

export type { Site };

export const SITES: Site[] = [
  {
    path: '/de-kraan', rechtsvorm: 'vof', lat: 52.0907, lon: 5.1214, delayMs: 1900, bedrijf: 'Loodgietersbedrijf De Kraan', plaats: 'Utrecht',
    branche: 'loodgieter', domein: 'loodgieter-dekraan.nl',
    headers: { 'x-powered-by': 'PHP/5.4.45', server: 'Apache/2.2.15' },
    html: tabelSite('Loodgietersbedrijf De Kraan', 'Utrecht', 2009,
      'Voor al uw loodgieterswerk. Lekkage? Bel ons! Wij komen door heel de regio.', '030-2871934', 'actief'),
  },
  {
    path: '/schilders-vermeer', rechtsvorm: 'eenmanszaak', lat: 52.1561, lon: 5.3878, delayMs: 2400, bedrijf: 'Schildersbedrijf Vermeer', plaats: 'Amersfoort',
    branche: 'schilder', domein: 'schildersbedrijfvermeer.nl',
    headers: { 'x-powered-by': 'PHP/5.6.40' },
    html: oudeWordpress('Schildersbedrijf Vermeer', 'Amersfoort', '4.7.2', 2016,
      lorem('Wij verzorgen binnen- en buitenschilderwerk voor particulieren en bedrijven.', 3), '033-4612780', 'actief'),
  },
  {
    path: '/bakkerij-molentje', rechtsvorm: 'eenmanszaak', lat: 52.0907, lon: 5.2333, delayMs: 1400, bedrijf: 'Bakkerij Het Molentje', plaats: 'Zeist',
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
    path: '/autobedrijf-jansen', rechtsvorm: 'bv', lat: 52.0296, lon: 5.0803, delayMs: 3800, bedrijf: 'Autobedrijf Jansen', plaats: 'Nieuwegein',
    branche: 'autobedrijf', domein: 'autobedrijfjansen.nl',
    headers: { 'x-powered-by': 'PHP/7.2.34' },
    html: oudeWordpress('Autobedrijf Jansen', 'Nieuwegein', '5.4.2', 2019,
      lorem('APK, onderhoud en reparatie van alle merken. Ook occasions met garantie.', 4), '030-6039215', 'sluimert'),
  },
  {
    path: '/hovenier-groenrijk', rechtsvorm: 'eenmanszaak', lat: 52.0286, lon: 5.5586, delayMs: 2100, bedrijf: 'Hovenier Groenrijk', plaats: 'Veenendaal',
    branche: 'hovenier', domein: 'hoveniergroenrijk.nl',
    html: tabelSite('Hovenier Groenrijk', 'Veenendaal', 2011,
      'Tuinaanleg en onderhoud. Vraag vrijblijvend een offerte aan.', '0318-521470', 'stil'),
  },
  {
    path: '/kapsalon-lisa', rechtsvorm: 'eenmanszaak', lat: 52.093, lon: 5.11, delayMs: 1250, bedrijf: 'Kapsalon Lisa', plaats: 'Utrecht',
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
    path: '/restaurant-de-hoek', rechtsvorm: 'bv', lat: 52.1519, lon: 5.39, delayMs: 940, bedrijf: 'Restaurant De Hoek', plaats: 'Amersfoort',
    branche: 'restaurant', domein: 'restaurantdehoek.nl', secure: true, goedGeconfigureerd: true,
    html: middenmoot('Restaurant De Hoek', 'Amersfoort',
      lorem('Seizoensgebonden gerechten met producten uit de streek. Reserveren wordt aanbevolen. De kaart wisselt elke zes weken mee met wat de telers in de omgeving aanbieden.', 5),
      '033-4728190', { titel: 'Restaurant De Hoek' }),
  },
  {
    path: '/fysio-beweegt', rechtsvorm: 'maatschap', lat: 52.087, lon: 5.235, delayMs: 780, bedrijf: 'Fysiotherapie Beweegt', plaats: 'Zeist',
    branche: 'fysiotherapie', domein: 'fysiobeweegt.nl', secure: true, goedGeconfigureerd: true,
    html: middenmoot('Fysiotherapie Beweegt', 'Zeist',
      lorem('Fysiotherapie, manuele therapie en revalidatie. Aangesloten bij alle zorgverzekeraars. U kunt zonder verwijzing van de huisarts bij ons terecht.', 5),
      '030-6924415', { titel: 'Fysiotherapie Beweegt Zeist' }),
  },
  {
    path: '/drukkerij-vandenberg', rechtsvorm: 'bv', lat: 52.033, lon: 5.085, delayMs: 2600, bedrijf: 'Drukkerij Van den Berg', plaats: 'Nieuwegein',
    branche: 'drukkerij', domein: 'drukkerijvandenberg.nl',
    headers: { 'x-powered-by': 'PHP/5.3.29' },
    html: tabelSite('Drukkerij Van den Berg', 'Nieuwegein', 2008,
      'Drukwerk voor bedrijven: visitekaartjes, folders, briefpapier en meer.', '030-6041188', 'actief'),
  },
  {
    path: '/tandarts-smile', rechtsvorm: 'bv', lat: 52.098, lon: 5.13, delayMs: 320, bedrijf: 'Tandartspraktijk Smile', plaats: 'Utrecht',
    branche: 'tandarts', domein: 'tandartssmile.nl', secure: true, goedGeconfigureerd: true,
    html: modern('Tandartspraktijk Smile', 'Utrecht',
      'Tandarts in Utrecht — ook op zaterdag terecht | Smile',
      'Tandartspraktijk Smile in Utrecht neemt nieuwe patiënten aan. Avond- en zaterdagafspraken mogelijk, en een eigen mondhygiënist in huis.',
      lorem('Bij Smile bent u terecht voor controles, vullingen, kronen en implantaten. Onze mondhygienist kijkt bij elke halfjaarlijkse controle mee, zodat problemen vroeg aan het licht komen.', 8),
      '030-2345678', 'info@tandartssmile.nl'),
  },
  {
    path: '/installatie-vandijk', rechtsvorm: 'bv', lat: 52.16, lon: 5.37, delayMs: 410, bedrijf: 'Van Dijk Installatietechniek', plaats: 'Amersfoort',
    branche: 'installateur', domein: 'vandijkinstallatie.nl', secure: true, goedGeconfigureerd: true,
    html: modern('Van Dijk Installatietechniek', 'Amersfoort',
      'Installateur in Amersfoort — cv, warmtepompen en sanitair',
      'Van Dijk Installatietechniek installeert en onderhoudt cv-ketels, warmtepompen en badkamers in Amersfoort en omgeving. Binnen 24 uur bij spoed.',
      lorem('Wij werken voor particulieren, VvE\'s en aannemers in heel Midden-Nederland. Van het vervangen van een cv-ketel tot het compleet verduurzamen van een woning met een warmtepomp en vloerverwarming.', 8),
      '033-4567890', 'info@vandijkinstallatie.nl'),
  },
  {
    path: '/advocaat-mulder', rechtsvorm: 'bv', lat: 52.085, lon: 5.118, delayMs: 500, bedrijf: 'Advocatenkantoor Mulder', plaats: 'Utrecht',
    branche: 'advocaat', domein: 'advocatenkantoormulder.nl', secure: true, status: 500,
    html: '<h1>Er is een fout opgetreden</h1>',
  },
  {
    path: '/glaszetter-helder', rechtsvorm: null, lat: 52.025, lon: 5.55, delayMs: 620, bedrijf: 'Glaszetterij Helder', plaats: 'Veenendaal',
    branche: 'glaszetter', domein: 'glaszetterijhelder.nl',
    html: `<html><head><title>glaszetterijhelder.nl</title></head><body>
      <h1>Deze domeinnaam is te koop</h1>
      <p>Geïnteresseerd in glaszetterijhelder.nl? Neem contact op met de eigenaar.</p>
      </body></html>`,
  },
  {
    path: '/dierenarts-poot', rechtsvorm: 'maatschap', lat: 52.095, lon: 5.24, delayMs: 6800, bedrijf: 'Dierenartsenpraktijk De Poot', plaats: 'Zeist',
    branche: 'dierenarts', domein: 'dierenartsdepoot.nl', secure: true,
    headers: { 'x-powered-by': 'PHP/7.4.33' },
    html: oudeWordpress('Dierenartsenpraktijk De Poot', 'Zeist', '5.8.6', 2020,
      lorem('Wij behandelen honden, katten en kleine huisdieren. Ook spoedgevallen buiten kantooruren.', 5), '030-6951203', 'stil'),
  },
  {
    path: '/makelaar-huisenzo', rechtsvorm: 'vof', lat: 52.027, lon: 5.09, delayMs: 1150, bedrijf: 'Makelaardij Huis & Zo', plaats: 'Nieuwegein',
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

/** Plaatsen met hun positie, om de nagemaakte bedrijven over het land te verdelen. */
const PLAATSEN: [string, number, number][] = [
  ['Amsterdam', 52.372, 4.894], ['Rotterdam', 51.924, 4.478], ['Den Haag', 52.078, 4.288],
  ['Utrecht', 52.091, 5.122], ['Eindhoven', 51.441, 5.469], ['Groningen', 53.219, 6.567],
  ['Tilburg', 51.560, 5.091], ['Almere', 52.371, 5.215], ['Breda', 51.586, 4.776],
  ['Nijmegen', 51.842, 5.853], ['Enschede', 52.221, 6.894], ['Haarlem', 52.381, 4.637],
  ['Arnhem', 51.985, 5.899], ['Zaanstad', 52.457, 4.813], ['Amersfoort', 52.156, 5.388],
  ['Apeldoorn', 52.211, 5.970], ['Den Bosch', 51.697, 5.304], ['Hoofddorp', 52.303, 4.690],
  ['Maastricht', 50.851, 5.691], ['Leiden', 52.160, 4.497], ['Dordrecht', 51.813, 4.690],
  ['Zoetermeer', 52.057, 4.494], ['Zwolle', 52.516, 6.083], ['Deventer', 52.255, 6.164],
  ['Delft', 52.012, 4.357], ['Alkmaar', 52.632, 4.749], ['Leeuwarden', 53.201, 5.799],
  ['Venlo', 51.370, 6.172], ['Oss', 51.765, 5.518], ['Hengelo', 52.266, 6.793],
  ['Emmen', 52.785, 6.898], ['Roosendaal', 51.531, 4.466], ['Purmerend', 52.505, 4.960],
  ['Vlaardingen', 51.912, 4.341], ['Assen', 52.995, 6.563], ['Terneuzen', 51.335, 3.828],
  ['Middelburg', 51.499, 3.611], ['Heerlen', 50.888, 5.979], ['Lelystad', 52.518, 5.471],
  ['Hoorn', 52.642, 5.060],
];

const BRANCHES: [string, string[]][] = [
  ['loodgieter', ['Loodgietersbedrijf', 'Installatiebedrijf']],
  ['schilder', ['Schildersbedrijf', 'Schilderwerken']],
  ['bakkerij', ['Bakkerij', 'Banketbakkerij']],
  ['kapper', ['Kapsalon', 'Haarstudio']],
  ['autobedrijf', ['Autobedrijf', 'Garage']],
  ['hovenier', ['Hoveniersbedrijf', 'Tuinen']],
  ['restaurant', ['Restaurant', 'Eetcafé']],
  ['fysiotherapie', ['Fysiotherapie', 'Praktijk']],
  ['tandarts', ['Tandartspraktijk', 'Mondzorg']],
  ['makelaar', ['Makelaardij', 'Makelaars']],
  ['drukkerij', ['Drukkerij', 'Printservice']],
  ['dierenarts', ['Dierenartsenpraktijk', 'Dierenkliniek']],
  ['aannemer', ['Bouwbedrijf', 'Aannemersbedrijf']],
  ['elektricien', ['Elektrotechniek', 'Installatietechniek']],
];

const ACHTERNAMEN = [
  'de Vries', 'Jansen', 'van Dijk', 'Bakker', 'Visser', 'Smit', 'Meijer', 'de Boer',
  'Mulder', 'de Groot', 'Bos', 'Vos', 'Peters', 'Hendriks', 'van Leeuwen', 'Dekker',
  'Brouwer', 'de Wit', 'Dijkstra', 'Smits', 'de Graaf', 'van der Meer', 'van der Berg',
  'Kuipers', 'Veenstra', 'Kok', 'Willems', 'Prins', 'Blom', 'Huisman',
];

/** Vaste pseudo-willekeur, zodat de demo elke keer hetzelfde oplevert. */
function pseudo(zaad: number): () => number {
  let staat = zaad >>> 0;
  return () => {
    staat = (staat * 1664525 + 1013904223) >>> 0;
    return staat / 4294967296;
  };
}

const zonderAccenten = (tekst: string) => tekst
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * Bouwt een groter bestand nagemaakte bedrijven, verspreid over het land, met
 * dezelfde vijf sitetypes. Ze worden echt geserveerd en echt gescand — alleen
 * de bedrijfsnamen en plaatsen zijn samengesteld.
 */
export function genereerSites(aantal: number): Site[] {
  const random = pseudo(20260828);
  const sites: Site[] = [];
  const gebruikt = new Set(SITES.map((site) => site.domein));

  for (let i = 0; sites.length < aantal && i < aantal * 4; i++) {
    const [plaats, lat, lon] = PLAATSEN[Math.floor(random() * PLAATSEN.length)]!;
    const [branche, voorvoegsels] = BRANCHES[Math.floor(random() * BRANCHES.length)]!;
    const voorvoegsel = voorvoegsels[Math.floor(random() * voorvoegsels.length)]!;
    const achternaam = ACHTERNAMEN[Math.floor(random() * ACHTERNAMEN.length)]!;
    const bedrijf = `${voorvoegsel} ${achternaam}`;
    const domein = `${zonderAccenten(voorvoegsel).slice(0, 8)}${zonderAccenten(achternaam)}.nl`;
    if (gebruikt.has(domein)) continue;
    gebruikt.add(domein);

    const telefoon = `0${10 + Math.floor(random() * 79)}-${1000000 + Math.floor(random() * 8999999)}`;
    const pad = `/g/${sites.length}`;
    const jaar = 2006 + Math.floor(random() * 14);
    const soort = random();

    // De verdeling weerspiegelt wat je in het veld tegenkomt: veel achterstallig
    // onderhoud, een kleinere groep die het goed voor elkaar heeft.
    // In deze hoek van het mkb is de eenmanszaak of vof de regel en de bv de
    // uitzondering — precies de groep die je sinds 1 juli 2026 niet zomaar mag bellen.
    const trekking = random();
    const rechtsvorm = trekking < 0.5 ? 'eenmanszaak' : trekking < 0.66 ? 'vof'
      : trekking < 0.72 ? 'maatschap' : trekking < 0.94 ? 'bv' : null;

    // Ongeveer een derde van de verwaarloosde sites hoort bij een bedrijf dat
    // wel degelijk draait; dat zijn de leads waar je heen wilt.
    const levenTrekking = random();
    const leven: Levensprofiel = levenTrekking < 0.34 ? 'actief' : levenTrekking < 0.68 ? 'sluimert' : 'stil';

    const gemeen = {
      path: pad, bedrijf, plaats, branche, domein, rechtsvorm, leven,
      lat: lat + (random() - 0.5) * 0.05,
      lon: lon + (random() - 0.5) * 0.08,
    };

    if (soort < 0.28) {
      sites.push({ ...gemeen, delayMs: 900 + Math.floor(random() * 2200),
        headers: { 'x-powered-by': `PHP/5.${Math.floor(random() * 7)}.${Math.floor(random() * 40)}` },
        html: tabelSite(bedrijf, plaats, jaar, `Al ${NU - jaar} jaar actief in ${plaats} en omstreken.`, telefoon, leven) });
    } else if (soort < 0.55) {
      sites.push({ ...gemeen, delayMs: 800 + Math.floor(random() * 3400),
        headers: { 'x-powered-by': random() < 0.5 ? 'PHP/7.4.33' : 'PHP/8.1.27' },
        html: oudeWordpress(bedrijf, plaats, random() < 0.5 ? '5.4.2' : '4.9.8', jaar,
          lorem(`Wij werken door heel ${plaats} en de regio eromheen.`, 3), telefoon, leven) });
    } else if (soort < 0.68) {
      sites.push({ ...gemeen, secure: true, goedGeconfigureerd: true, delayMs: 400 + Math.floor(random() * 900),
        html: `<html><head><meta name="generator" content="Wix.com Website Builder"><style>${themaCss(180)}</style></head>
          <body><h1>${bedrijf}</h1><script src="https://static.wixstatic.com/services/main.js"></script>
          <p>${lorem(`${bedrijf} in ${plaats}. Bel voor een afspraak.`, 5)}</p>
          <p>Telefoon: ${telefoon}</p>${levensblok(leven, plaats)}<p>&copy; ${jaar} ${bedrijf}</p></body></html>` });
    } else if (soort < 0.88) {
      sites.push({ ...gemeen, secure: true, goedGeconfigureerd: true, delayMs: 500 + Math.floor(random() * 900),
        html: middenmoot(bedrijf, plaats, lorem(`Al jaren het vertrouwde adres in ${plaats} voor ${branche}werk.`, 4), telefoon, { leven }) });
    } else {
      sites.push({ ...gemeen, secure: true, goedGeconfigureerd: true, delayMs: 250 + Math.floor(random() * 400),
        html: modern(bedrijf, plaats, `${voorvoegsel} in ${plaats} — ${bedrijf}`,
          `${bedrijf} is het vertrouwde adres voor ${branche}werk in ${plaats} en omgeving. Vaste prijzen vooraf en snel ter plaatse.`,
          lorem(`Wij werken voor particulieren en bedrijven in heel ${plaats} en de regio.`, 8),
          telefoon, `info@${domein}`) });
    }
  }
  return sites;
}

export function startDemoServers(cert: { key: string; cert: string }, sites: Site[] = SITES): Promise<DemoServers> {
  const plain: Server = createHttpServer(handler(sites) as never);
  const secure: Server = createHttpsServer(cert, handler(sites) as never);

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
