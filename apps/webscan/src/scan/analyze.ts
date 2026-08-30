import * as cheerio from 'cheerio';
import { detectTech, readGenerator, type TechFinding } from './tech.ts';
import { sameHost } from '../util/url.ts';
import type { FetchResult } from './fetcher.ts';

export type PageSignals = ReturnType<typeof analyzePage>;

const PARKED_PATTERNS = [
  /deze domeinnaam is te koop/i, /domain (?:is )?for sale/i, /under construction/i,
  /in aanbouw/i, /coming soon/i, /binnenkort online/i, /website in ontwikkeling/i,
  /apache2? (?:ubuntu |debian )?default page/i, /iis windows server/i,
  /welcome to nginx/i, /index of \//i, /this site can.t be reached/i,
  /parkeerpagina/i, /geregistreerd via/i,
];

const COOKIE_LIBS = /cookiebot|cookieconsent|complianz|borlabs|usercentrics|iubenda|klaro|osano|onetrust|cookie-script|didomi/i;
const FORM_KEYWORDS = /contact|offerte|afspraak|aanvraag|reserve|boek/i;

// --- tekenen dat er nog een bedrijf achter zit ------------------------------
const VACATURE = /vacature|werken bij|we zoeken|kom ons team|solliciteer/i;
const ONLINE_ACTIE = /online (?:bestellen|reserveren|boeken|afspraak)|afspraak maken|bestel(?:len)? online|reserveer|winkelwagen|webshop|in winkelwagen/i;
const GESTOPT = /(?:zijn|is) gestopt|opgeheven|bedrijfsbeëindiging|failliet|uit bedrijf|wij zijn per \d|laatste dag/i;
const BLOG_DATUM = /(\d{1,2}\s+(?:januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december)\s+(20\d{2}))/gi;

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]{2,}/g;
const PHONE_RE = /(?:\+31|0031|0)[\s.-]?(?:\d[\s.-]?){8,9}\d/g;
const KVK_RE = /k\.?v\.?k\.?(?:[\s-]*nummer)?[\s.:#-]*(\d{8})\b/i;
const BTW_RE = /\bNL\s?\d{9}\s?B\s?\d{2}\b/i;
const IBAN_RE = /\bNL\d{2}\s?[A-Z]{4}(?:\s?\d{4}){2}\s?\d{2}\b/;
const YEAR_RE = /(?:©|&copy;|copyright)[^\d]{0,20}((?:19|20)\d{2})(?:\s*[–-]\s*((?:19|20)\d{2}))?/i;

/** Nederlandse postcode, het beste anker om een adres uit lopende tekst te vissen. */
const POSTCODE_RE = /\b([1-9][0-9]{3})\s?([A-Z]{2})\b/;

// Straatnamen eindigen in het Nederlands bijna altijd op een van deze woorden.
// Daarop zoeken is veel betrouwbaarder dan "een woord met een hoofdletter",
// want anders sleep je de bedrijfsnaam en de kop van de pagina mee het adres in.
// Bij een straatnaam van twee woorden krijgt het tweede woord een hoofdletter
// ("Nieuwe Gracht"), dus beide schrijfwijzen moeten kunnen.
const STRAATSOORT = ['straat', 'weg', 'laan', 'plein', 'kade', 'gracht', 'dijk', 'pad', 'hof',
  'park', 'singel', 'baan', 'dreef', 'steeg', 'markt', 'plantsoen', 'boulevard', 'erf', 'wal',
  'akker', 'veld', 'ring']
  .map((woord) => `[${woord[0]!.toUpperCase()}${woord[0]}]${woord.slice(1)}`)
  .join('|');
/** Woorden die wél bij de straatnaam horen: "Nieuwe Gracht", "Van Speijkstraat". */
const STRAAT_VOORVOEGSEL = 'Nieuwe|Oude|Grote|Kleine|Korte|Lange|Hoge|Lage|Sint|Van|Ter|Ten|Der|Onze';
/** Woorden die bij een plaatsnaam horen: "Alphen aan den Rijn", "Den Bosch". */
const PLAATS_KOPPEL = new Set(['aan', 'den', 'de', 'der', 'op', 'het', 'ter', 'te', 'bij', 'aan-de']);

const STRAAT_RE = new RegExp(
  '(' +
    // "Nieuwe Gracht", "Van Speijkstraat" — het tweede woord draagt de uitgang
    `(?:${STRAAT_VOORVOEGSEL})\\s[A-Z]?[\\w'.-]*(?:${STRAATSOORT})` +
    '|' +
    // "Dorpsstraat", "Industrieweg"
    `[A-Z][\\w'.-]*(?:${STRAATSOORT})` +
  ')' +
  '\\s+(\\d+\\s?[a-zA-Z]?(?:\\s?-\\s?\\d+)?)', 'g');
/** Terugval voor straatnamen zonder herkenbare uitgang, zoals "De Hoef 12". */
const STRAAT_LOS_RE = new RegExp(
  `(?:^|[\\s,:])((?:(?:De|Den|Het|'t|${STRAAT_VOORVOEGSEL})\\s)?[A-Z][\\wéëèïöüáà'.-]{2,})\\s(\\d+\\s?[a-zA-Z]?)`, 'g');

const laatsteTreffer = (tekst: string, patroon: RegExp): RegExpExecArray | null => {
  const treffers = [...tekst.matchAll(patroon)];
  return (treffers[treffers.length - 1] ?? null) as RegExpExecArray | null;
};

/** Leest de plaatsnaam die achter de postcode staat, inclusief "aan den Rijn". */
function leesPlaats(na: string): string {
  const woorden = na.replace(/^[\s,.-]+/, '').split(/[\s]+/);
  const gekozen: string[] = [];
  for (const ruw of woorden.slice(0, 5)) {
    // Een woord met een dubbele punt hoort bij het volgende veld ("Telefoon:").
    if (/[:|]$/.test(ruw)) break;
    const woord = ruw.replace(/[.,;)(]+$/, '');
    if (!woord) break;
    const isNaam = /^[A-Z][\wéëèïöüáà'.-]*$/.test(woord);
    const isKoppel = PLAATS_KOPPEL.has(woord.toLowerCase());
    if (gekozen.length === 0 && !isNaam) break;
    if (!isNaam && !isKoppel) break;
    gekozen.push(woord);
  }
  // Een losse koppeling aan het eind ("Alphen aan") hoort er niet bij.
  while (gekozen.length > 0 && PLAATS_KOPPEL.has(gekozen[gekozen.length - 1]!.toLowerCase())) gekozen.pop();
  return gekozen.join(' ');
}

/** Zoekt een Nederlands adres: straat + huisnummer, postcode en plaats. */
export function zoekAdres(tekst: string): { adres: string; postcode: string; plaats: string } | null {
  const postcode = POSTCODE_RE.exec(tekst);
  if (!postcode) return null;

  // Alleen het stukje vlak voor de postcode; verder terug staat de rest van de pagina.
  const voor = tekst.slice(Math.max(0, postcode.index - 60), postcode.index).trimEnd();
  const straat = laatsteTreffer(voor, STRAAT_RE) ?? laatsteTreffer(voor, STRAAT_LOS_RE);

  return {
    adres: straat ? `${straat[1]} ${straat[2]}`.replace(/\s+/g, ' ').trim() : '',
    postcode: `${postcode[1]} ${postcode[2]}`,
    plaats: leesPlaats(tekst.slice(postcode.index + postcode[0].length, postcode.index + postcode[0].length + 50)),
  };
}

const SOCIAL_HOSTS: Record<string, RegExp> = {
  facebook: /facebook\.com/i, instagram: /instagram\.com/i, linkedin: /linkedin\.com/i,
  youtube: /youtube\.com|youtu\.be/i, x: /twitter\.com|(?:^|\/\/)x\.com/i, tiktok: /tiktok\.com/i,
};

const unique = <T,>(values: T[]): T[] => [...new Set(values)];

/**
 * Haalt de leesbare tekst uit een pagina. Cheerio's .text() plakt regels aan
 * elkaar omdat <br> en blokelementen geen witruimte opleveren — dan wordt
 * "Gracht 45<br>3512 LP" ineens "453512 LP" en vindt geen enkele regex nog een
 * adres of KvK-nummer. Adressen staan op vrijwel elke site met <br>'s, dus dit
 * is geen randgeval.
 */
export function zichtbareTekst($: cheerio.CheerioAPI): string {
  $('br').replaceWith(' ');
  $('p, div, li, td, th, tr, h1, h2, h3, h4, h5, section, article, header, footer, address')
    .each((_, knoop) => { $(knoop).append(' '); });
  return $('body').text().replace(/\s+/g, ' ').trim();
}

function countMatches(text: string, pattern: RegExp): number {
  return (text.match(pattern) ?? []).length;
}

/** Zet een opgehaalde pagina om in meetbare signalen. Doet geen oordeel — dat doet de scoring. */
export function analyzePage(result: FetchResult) {
  const html = result.body;
  const $ = cheerio.load(html);
  const finalUrl = result.finalUrl || result.url;
  const isHttps = finalUrl.startsWith('https://');

  $('script, style, noscript, template').remove();
  const visibleText = zichtbareTekst($);
  const $full = cheerio.load(html); // ongewijzigde kopie voor script/style-analyse

  // --- Meta & SEO -----------------------------------------------------------
  const title = $full('title').first().text().trim();
  const description = ($full('meta[name="description"]').attr('content') ?? '').trim();
  const viewport = ($full('meta[name="viewport"]').attr('content') ?? '').trim();
  const canonical = $full('link[rel="canonical"]').attr('href') ?? null;
  const lang = ($full('html').attr('lang') ?? '').trim();
  const robotsMeta = ($full('meta[name="robots"]').attr('content') ?? '').toLowerCase();

  const jsonLdTypes = unique(
    $full('script[type="application/ld+json"]')
      .toArray()
      .flatMap((node) => {
        try {
          const parsed = JSON.parse($full(node).text());
          const entries = Array.isArray(parsed) ? parsed : [parsed];
          return entries.map((entry) => String(entry?.['@type'] ?? '')).filter(Boolean);
        } catch {
          return [];
        }
      }),
  );

  // --- Afbeeldingen ---------------------------------------------------------
  const images = $full('img').toArray();
  const imageStats = {
    total: images.length,
    missingAlt: images.filter((node) => {
      const alt = $full(node).attr('alt');
      return alt === undefined || alt.trim() === '';
    }).length,
    withoutDimensions: images.filter((node) => !$full(node).attr('width') || !$full(node).attr('height')).length,
    lazyLoaded: images.filter((node) => ($full(node).attr('loading') ?? '') === 'lazy').length,
    modernFormat: images.filter((node) => /\.(?:webp|avif)(?:\?|$)/i.test($full(node).attr('src') ?? '')).length,
    responsive: images.filter((node) => Boolean($full(node).attr('srcset'))).length,
  };

  // --- Links ----------------------------------------------------------------
  const hrefs = $full('a[href]').toArray().map((node) => ($full(node).attr('href') ?? '').trim());
  const absolute = hrefs
    .filter((href) => href && !href.startsWith('#') && !href.startsWith('javascript:'))
    .map((href) => { try { return new URL(href, finalUrl).toString(); } catch { return null; } })
    .filter((href): href is string => href !== null);

  const internalLinks = absolute.filter((href) => /^https?:/.test(href) && sameHost(href, finalUrl));
  const externalLinks = absolute.filter((href) => /^https?:/.test(href) && !sameHost(href, finalUrl));

  const socials = Object.entries(SOCIAL_HOSTS)
    .filter(([, pattern]) => externalLinks.some((href) => pattern.test(href)))
    .map(([name]) => name);

  // --- Performance-indicatoren (statisch, zonder browser) -------------------
  const head = $full('head').html() ?? '';
  const scripts = $full('script[src]').toArray();
  const stylesheets = $full('link[rel="stylesheet"]').toArray();
  const inlineJsBytes = $full('script:not([src])').toArray()
    .reduce((sum, node) => sum + Buffer.byteLength($full(node).text()), 0);
  const inlineCssBytes = $full('style').toArray()
    .reduce((sum, node) => sum + Buffer.byteLength($full(node).text()), 0);
  const renderBlockingScripts = cheerio.load(head)('script[src]')
    .toArray()
    .filter((node) => {
      const attribs = (node as { attribs?: Record<string, string> }).attribs ?? {};
      return !('async' in attribs) && !('defer' in attribs) && (attribs.type ?? '') !== 'module';
    }).length;

  // --- Mobiel & verouderde opmaak ------------------------------------------
  const legacyMarkup =
    countMatches(html, /<font\b/gi) +
    countMatches(html, /<center\b/gi) +
    countMatches(html, /\bbgcolor=/gi) +
    countMatches(html, /<marquee\b/gi) +
    countMatches(html, /<frameset\b/gi);
  const tableCount = $full('table').length;
  const nestedTables = $full('table table').length;
  const fixedWidthHints =
    countMatches(html, /width\s*[:=]\s*["']?\s*\d{3,4}\s*(?:px)?["']?/gi) +
    countMatches(html, /min-width\s*:\s*\d{3,4}px/gi);
  const hasMediaQueries = /@media[^{]*\((?:max|min)-width/i.test(html);

  // --- Contact & juridisch --------------------------------------------------
  const mailtos = hrefs.filter((href) => href.toLowerCase().startsWith('mailto:'))
    .map((href) => href.slice(7).split('?')[0]!.trim());
  const emails = unique([...mailtos, ...(visibleText.match(EMAIL_RE) ?? [])])
    .filter((email) => !/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(email))
    .slice(0, 5);
  const phones = unique([
    ...hrefs.filter((href) => href.toLowerCase().startsWith('tel:')).map((href) => href.slice(4).trim()),
    ...(visibleText.match(PHONE_RE) ?? []).map((phone) => phone.replace(/[\s.-]/g, '')),
  ]).slice(0, 3);

  const linkText = $full('a').toArray().map((node) => $full(node).text().toLowerCase()).join(' | ');
  const forms = $full('form').toArray();

  // --- Actualiteit ----------------------------------------------------------
  const yearMatch = YEAR_RE.exec(visibleText);
  const copyrightYear = yearMatch ? Number(yearMatch[2] ?? yearMatch[1]) : null;
  const currentYear = new Date().getFullYear();

  const tech: TechFinding[] = detectTech(html, result.headers);
  const parked = PARKED_PATTERNS.some((pattern) => pattern.test(title) || pattern.test(visibleText.slice(0, 600)));

  const mixedContent = isHttps
    ? countMatches(html, /(?:src|href)\s*=\s*["']http:\/\//gi)
    : 0;

  return {
    url: result.url,
    finalUrl,
    httpStatus: result.status,
    bytes: result.bytes,
    ttfbMs: result.ttfbMs,
    totalMs: result.totalMs,
    truncated: result.truncated,

    https: {
      enabled: isHttps,
      redirectedToHttps: result.redirects.some((hop) => hop.startsWith('https://')) && isHttps,
      httpsFailed: result.httpsFailed,
      tlsError: result.tlsError,
      hsts: Boolean(result.headers['strict-transport-security']),
      mixedContent,
    },

    meta: {
      title,
      titleLength: title.length,
      description,
      descriptionLength: description.length,
      lang,
      canonical,
      viewport,
      noindex: /noindex/.test(robotsMeta),
    },

    content: {
      textLength: visibleText.length,
      wordCount: visibleText ? visibleText.split(/\s+/).length : 0,
      h1Count: $full('h1').length,
      h2Count: $full('h2').length,
      parked,
    },

    images: imageStats,

    links: {
      internal: internalLinks.length,
      external: externalLinks.length,
      internalSample: unique(internalLinks).slice(0, 12),
      socials,
    },

    performance: {
      htmlBytes: Buffer.byteLength(html),
      scriptCount: scripts.length,
      stylesheetCount: stylesheets.length,
      inlineJsBytes,
      inlineCssBytes,
      renderBlockingScripts,
      compressed: /gzip|br|deflate|zstd/i.test(result.headers['content-encoding'] ?? ''),
      cacheControl: result.headers['cache-control'] ?? null,
    },

    mobile: {
      hasViewport: viewport !== '',
      viewportScalable: viewport === '' || !/user-scalable\s*=\s*(?:no|0)|maximum-scale\s*=\s*1(?:\.0)?\b/i.test(viewport),
      viewportDeviceWidth: /width\s*=\s*device-width/i.test(viewport),
      hasMediaQueries,
      fixedWidthHints,
      tableCount,
      nestedTables,
      legacyMarkup,
    },

    contact: {
      emails,
      phones,
      kvk: KVK_RE.exec(visibleText)?.[1] ?? null,
      btw: BTW_RE.exec(visibleText)?.[0] ?? null,
      iban: IBAN_RE.exec(visibleText)?.[0] ?? null,
      adres: zoekAdres(visibleText),
      hasForm: forms.length > 0,
      hasContactForm: forms.length > 0 || FORM_KEYWORDS.test(linkText),
      hasWhatsApp: /wa\.me\/|api\.whatsapp\.com/i.test(html),
      whatsappNummer: /wa\.me\/(\d{8,15})/i.exec(html)?.[1] ?? null,
      socialLinks: Object.fromEntries(Object.entries(SOCIAL_HOSTS)
        .map(([naam, patroon]) => [naam, externalLinks.find((href) => patroon.test(href)) ?? null])
        .filter(([, href]) => href !== null)) as Record<string, string>,
      /** De pagina waar de contactgegevens waarschijnlijk staan. */
      contactpaginaUrl: absolute.find((href) =>
        /\/(?:contact|contactgegevens|over-?ons|about)(?:\/|\.html?|$)/i.test(href)
        && sameHost(href, finalUrl)) ?? null,
    },

    legal: {
      cookieBanner: COOKIE_LIBS.test(html) || /cookie(?:beleid|melding|instellingen)|accepteer cookies/i.test(visibleText.slice(0, 3000)),
      privacyLink: /privacy/i.test(linkText),
      termsLink: /algemene voorwaarden|voorwaarden|terms/i.test(linkText),
    },

    freshness: {
      copyrightYear,
      copyrightAgeYears: copyrightYear ? currentYear - copyrightYear : null,
      lastModified: result.headers['last-modified'] ?? null,
    },

    /**
     * Signalen dat het bedrijf nog actief is. Een verwaarloosde site van een
     * bedrijf dat op omvallen staat is geen lead; een verwaarloosde site van
     * een bedrijf dat volop draait wel.
     */
    leven: {
      /** Het jongste jaartal dat ergens in de tekst voorkomt. */
      jongsteJaar: Math.max(0, ...[...visibleText.matchAll(/\b(20[12]\d)\b/g)]
        .map((treffer) => Number(treffer[1]))
        .filter((jaar) => jaar <= currentYear)),
      /** De jongste datum in een blog- of nieuwsoverzicht. */
      jongsteBerichtJaar: Math.max(0, ...[...visibleText.matchAll(BLOG_DATUM)]
        .map((treffer) => Number(treffer[2]))
        .filter((jaar) => jaar <= currentYear)),
      vacature: VACATURE.test(visibleText),
      onlineActie: ONLINE_ACTIE.test(visibleText) || ONLINE_ACTIE.test(linkText),
      lijktGestopt: GESTOPT.test(visibleText.slice(0, 2000)),
      meetInstrument: /gtag|googletagmanager|analytics|matomo|plausible|hotjar|clarity/i.test(html),
      socials: socials.length,
      whatsapp: /wa\.me\/|api\.whatsapp\.com/i.test(html),
      cookiebanner: COOKIE_LIBS.test(html),
    },

    security: {
      hsts: Boolean(result.headers['strict-transport-security']),
      csp: Boolean(result.headers['content-security-policy']),
      xFrameOptions: Boolean(result.headers['x-frame-options']),
      server: result.headers['server'] ?? null,
      poweredBy: result.headers['x-powered-by'] ?? null,
    },

    seo: {
      hasOg: $full('meta[property^="og:"]').length > 0,
      hasTwitterCard: $full('meta[name^="twitter:"]').length > 0,
      jsonLdTypes,
      hasFavicon: $full('link[rel~="icon"]').length > 0,
      hasCanonical: canonical !== null,
    },

    generator: readGenerator(html),
    tech,
  };
}
