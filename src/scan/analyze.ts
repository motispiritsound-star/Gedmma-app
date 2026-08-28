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
const YEAR_RE = /(?:©|&copy;|copyright)[^\d]{0,20}((?:19|20)\d{2})(?:\s*[–-]\s*((?:19|20)\d{2}))?/i;

const SOCIAL_HOSTS: Record<string, RegExp> = {
  facebook: /facebook\.com/i, instagram: /instagram\.com/i, linkedin: /linkedin\.com/i,
  youtube: /youtube\.com|youtu\.be/i, x: /twitter\.com|(?:^|\/\/)x\.com/i, tiktok: /tiktok\.com/i,
};

const unique = <T,>(values: T[]): T[] => [...new Set(values)];

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
  const visibleText = $('body').text().replace(/\s+/g, ' ').trim();
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
      hasForm: forms.length > 0,
      hasContactForm: forms.length > 0 || FORM_KEYWORDS.test(linkText),
      hasWhatsApp: /wa\.me\/|api\.whatsapp\.com/i.test(html),
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
