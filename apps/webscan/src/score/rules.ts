import type { PageSignals } from '../scan/analyze.ts';

export type Category = 'veiligheid' | 'mobiel' | 'snelheid' | 'vindbaarheid' | 'inhoud';

/** Maximaal aantal punten dat een categorie kan kosten. Samen 100. */
export const CATEGORY_WEIGHTS: Record<Category, number> = {
  veiligheid: 25,
  mobiel: 20,
  snelheid: 20,
  vindbaarheid: 20,
  inhoud: 15,
};

export const CATEGORY_LABELS: Record<Category, string> = {
  veiligheid: 'Techniek & veiligheid',
  mobiel: 'Mobiel & responsive',
  snelheid: 'Snelheid',
  vindbaarheid: 'Vindbaarheid (SEO)',
  inhoud: 'Inhoud & conversie',
};

export type Severity = 'kritiek' | 'hoog' | 'middel' | 'laag';

export type Issue = {
  id: string;
  category: Category;
  severity: Severity;
  /** Strafpunten binnen de categorie. */
  points: number;
  title: string;
  advies: string;
  detail?: string;
};

type Rule = (s: PageSignals) => Issue | null;

const issue = (
  id: string, category: Category, severity: Severity, points: number,
  title: string, advies: string, detail?: string,
): Issue => ({ id, category, severity, points, title, advies, detail });

const worstTech = (s: PageSignals) =>
  s.tech.filter((t) => t.staleness > 0).sort((a, b) => b.staleness - a.staleness);

export const RULES: Rule[] = [
  // --- Veiligheid -----------------------------------------------------------
  (s) => !s.https.enabled
    ? issue('geen-https', 'veiligheid', 'kritiek', 12,
        'Geen HTTPS: bezoekers zien "Niet veilig" in de adresbalk',
        'Gratis SSL-certificaat via Let\'s Encrypt installeren en al het verkeer naar https doorsturen.')
    : null,

  (s) => s.https.tlsError
    ? issue('tls-fout', 'veiligheid', 'kritiek', 12,
        'Het SSL-certificaat is ongeldig of verlopen',
        'Certificaat vernieuwen en automatische verlenging instellen.', s.https.tlsError)
    : null,

  (s) => s.https.enabled && s.https.mixedContent > 0
    ? issue('mixed-content', 'veiligheid', 'hoog', 5,
        `${s.https.mixedContent} onderdelen worden nog via onveilig http geladen`,
        'Alle afbeeldingen, scripts en stylesheets via https laden.')
    : null,

  (s) => {
    const [worst] = worstTech(s);
    if (!worst || worst.staleness < 3) return null;
    return issue('verouderde-tech', 'veiligheid', 'kritiek', 10,
      worst.note ?? `${worst.name} ${worst.version ?? ''} is sterk verouderd`,
      'Overzetten naar een actueel en onderhouden platform.',
      worstTech(s).map((t) => `${t.name} ${t.version ?? ''}`.trim()).join(', '));
  },

  (s) => {
    const stale = worstTech(s).filter((t) => t.staleness === 2);
    if (stale.length === 0) return null;
    return issue('achterstallig-onderhoud', 'veiligheid', 'middel', 4,
      stale[0]!.note ?? `${stale[0]!.name} loopt achter op updates`,
      'Updates uitvoeren of overstappen naar een onderhouden versie.',
      stale.map((t) => `${t.name} ${t.version ?? ''}`.trim()).join(', '));
  },

  (s) => s.https.enabled && !s.security.hsts
    ? issue('geen-hsts', 'veiligheid', 'laag', 2,
        'HSTS-header ontbreekt', 'Strict-Transport-Security-header aanzetten.')
    : null,

  (s) => s.security.poweredBy
    ? issue('server-lekt-versie', 'veiligheid', 'laag', 2,
        'De server verraadt zijn softwareversie aan aanvallers',
        'X-Powered-By- en Server-headers verbergen.', s.security.poweredBy)
    : null,

  // --- Mobiel ---------------------------------------------------------------
  (s) => !s.mobile.hasViewport
    ? issue('geen-viewport', 'mobiel', 'kritiek', 12,
        'Website is niet gemaakt voor mobiel: bezoekers moeten in- en uitzoomen',
        'Responsive ontwerp met een viewport-meta en flexibele opmaak.')
    : null,

  (s) => s.mobile.hasViewport && !s.mobile.viewportDeviceWidth
    ? issue('viewport-fout', 'mobiel', 'hoog', 6,
        'De mobiele weergave is verkeerd ingesteld',
        'Viewport instellen op width=device-width, initial-scale=1.')
    : null,

  (s) => s.mobile.hasViewport && !s.mobile.hasMediaQueries && s.mobile.fixedWidthHints > 3
    ? issue('niet-responsive', 'mobiel', 'hoog', 7,
        'De opmaak heeft vaste breedtes en past zich niet aan het scherm aan',
        'Opmaak omzetten naar flexibele CSS met breekpunten.')
    : null,

  (s) => !s.mobile.viewportScalable
    ? issue('zoom-geblokkeerd', 'mobiel', 'middel', 3,
        'Inzoomen is uitgeschakeld — een toegankelijkheidsprobleem',
        'user-scalable=no en maximum-scale=1 verwijderen.')
    : null,

  (s) => s.mobile.nestedTables > 0 || s.mobile.legacyMarkup > 3
    ? issue('verouderde-opmaak', 'mobiel', 'hoog', 6,
        'De site is opgebouwd met verouderde HTML (tabellen, <font>, <center>)',
        'Herbouwen met moderne, semantische HTML en CSS.',
        `${s.mobile.nestedTables} geneste tabellen, ${s.mobile.legacyMarkup} verouderde tags`)
    : null,

  // --- Snelheid -------------------------------------------------------------
  (s) => {
    const ms = s.totalMs ?? 0;
    if (ms > 6000) return issue('zeer-traag', 'snelheid', 'kritiek', 10,
      `De pagina doet er ${(ms / 1000).toFixed(1)} seconden over om te laden`,
      'Hosting, caching en afbeeldingen optimaliseren.');
    if (ms > 3000) return issue('traag', 'snelheid', 'hoog', 6,
      `Laadtijd van ${(ms / 1000).toFixed(1)} seconden — bezoekers haken af`,
      'Caching inschakelen en zware onderdelen uitstellen.');
    if (ms > 1800) return issue('matig-traag', 'snelheid', 'middel', 3,
      `Laadtijd van ${(ms / 1000).toFixed(1)} seconden kan een stuk sneller`,
      'Afbeeldingen comprimeren en caching aanscherpen.');
    return null;
  },

  (s) => (s.ttfbMs ?? 0) > 1200
    ? issue('trage-server', 'snelheid', 'hoog', 5,
        `De server reageert pas na ${s.ttfbMs} ms`,
        'Snellere hosting of server-side caching.')
    : null,

  (s) => s.bytes > 2_000_000
    ? issue('zware-pagina', 'snelheid', 'hoog', 5,
        `De pagina is ${(s.bytes / 1_000_000).toFixed(1)} MB groot`,
        'Afbeeldingen comprimeren naar WebP en ongebruikte code verwijderen.')
    : s.bytes > 1_000_000
    ? issue('vrij-zware-pagina', 'snelheid', 'middel', 3,
        `De pagina is ${Math.round(s.bytes / 1000)} kB groot`,
        'Afbeeldingen comprimeren en scripts opschonen.')
    : null,

  (s) => !s.performance.compressed
    ? issue('geen-compressie', 'snelheid', 'middel', 4,
        'De server verstuurt niet-gecomprimeerde pagina\'s',
        'Gzip of Brotli inschakelen op de webserver.')
    : null,

  (s) => s.performance.renderBlockingScripts > 2
    ? issue('blokkerende-scripts', 'snelheid', 'middel', 3,
        `${s.performance.renderBlockingScripts} scripts blokkeren het tonen van de pagina`,
        'Scripts met defer/async laden of onderaan plaatsen.')
    : null,

  (s) => s.images.total > 4 && s.images.modernFormat === 0
    ? issue('geen-moderne-afbeeldingen', 'snelheid', 'laag', 3,
        'Afbeeldingen gebruiken geen moderne formaten (WebP/AVIF)',
        'Afbeeldingen converteren naar WebP; scheelt vaak 30-60% laadtijd.')
    : null,

  (s) => s.images.total > 6 && s.images.lazyLoaded === 0
    ? issue('geen-lazy-loading', 'snelheid', 'laag', 2,
        'Alle afbeeldingen worden direct geladen, ook die onderaan de pagina',
        'loading="lazy" toevoegen aan afbeeldingen onder de vouw.')
    : null,

  (s) => !s.performance.cacheControl
    ? issue('geen-caching', 'snelheid', 'laag', 2,
        'Er zijn geen cache-instellingen ingesteld',
        'Cache-Control-headers instellen voor statische bestanden.')
    : null,

  // --- Vindbaarheid ---------------------------------------------------------
  (s) => s.meta.title === ''
    ? issue('geen-titel', 'vindbaarheid', 'kritiek', 8,
        'De pagina heeft geen titel — Google toont dan de domeinnaam',
        'Een beschrijvende paginatitel van 40-60 tekens toevoegen.')
    : s.meta.titleLength < 15 || s.meta.titleLength > 65
    ? issue('titel-lengte', 'vindbaarheid', 'middel', 3,
        `De paginatitel is ${s.meta.titleLength} tekens (ideaal 40-60)`,
        'Titel herschrijven met de dienst en de plaats erin.', s.meta.title)
    : null,

  (s) => s.meta.description === ''
    ? issue('geen-omschrijving', 'vindbaarheid', 'hoog', 6,
        'Geen meta-omschrijving: Google verzint zelf de tekst onder je zoekresultaat',
        'Een wervende omschrijving van 120-155 tekens toevoegen.')
    : s.meta.descriptionLength < 60 || s.meta.descriptionLength > 165
    ? issue('omschrijving-lengte', 'vindbaarheid', 'laag', 2,
        `De meta-omschrijving is ${s.meta.descriptionLength} tekens (ideaal 120-155)`,
        'Omschrijving herschrijven met een duidelijke call-to-action.')
    : null,

  (s) => s.content.h1Count === 0
    ? issue('geen-h1', 'vindbaarheid', 'middel', 4,
        'Er staat geen hoofdkop (H1) op de pagina',
        'Eén duidelijke H1 met de belangrijkste zoekterm toevoegen.')
    : s.content.h1Count > 1
    ? issue('meerdere-h1', 'vindbaarheid', 'laag', 2,
        `Er staan ${s.content.h1Count} H1-koppen op één pagina`,
        'Terugbrengen naar één H1 per pagina.')
    : null,

  (s) => s.meta.noindex
    ? issue('noindex', 'vindbaarheid', 'kritiek', 8,
        'De pagina staat op "noindex": Google mag hem niet tonen',
        'De noindex-instructie verwijderen.')
    : null,

  (s) => s.seo.jsonLdTypes.length === 0
    ? issue('geen-structured-data', 'vindbaarheid', 'middel', 3,
        'Geen structured data: geen openingstijden of reviews in Google',
        'Schema.org LocalBusiness toevoegen met adres, telefoon en openingstijden.')
    : null,

  (s) => !s.seo.hasOg
    ? issue('geen-og-tags', 'vindbaarheid', 'laag', 2,
        'Gedeelde links op social media tonen geen nette voorvertoning',
        'Open Graph-tags toevoegen (titel, omschrijving, afbeelding).')
    : null,

  (s) => s.meta.lang === ''
    ? issue('geen-taal', 'vindbaarheid', 'laag', 2,
        'De taal van de pagina is niet ingesteld',
        'lang="nl" op het html-element zetten.')
    : null,

  (s) => s.images.total > 0 && s.images.missingAlt / s.images.total > 0.4
    ? issue('alt-teksten', 'vindbaarheid', 'middel', 3,
        `${s.images.missingAlt} van de ${s.images.total} afbeeldingen mist een alt-tekst`,
        'Alt-teksten toevoegen — beter voor Google én voor slechtzienden.')
    : null,

  (s) => !s.seo.hasCanonical
    ? issue('geen-canonical', 'vindbaarheid', 'laag', 1,
        'Geen canonical-tag', 'Canonical-tag toevoegen om dubbele content te voorkomen.')
    : null,

  // --- Inhoud & conversie ---------------------------------------------------
  (s) => s.content.parked
    ? issue('parkeerpagina', 'inhoud', 'kritiek', 15,
        'Er staat geen echte website: alleen een standaard- of parkeerpagina',
        'Een volwaardige website bouwen.')
    : null,

  (s) => s.content.wordCount < 120
    ? issue('weinig-inhoud', 'inhoud', 'hoog', 6,
        `De homepage bevat maar ${s.content.wordCount} woorden`,
        'Uitleg over diensten, werkgebied en aanbod toevoegen.')
    : null,

  (s) => s.contact.phones.length === 0 && s.contact.emails.length === 0
    ? issue('geen-contactgegevens', 'inhoud', 'hoog', 5,
        'Op de homepage staan geen telefoonnummer of e-mailadres',
        'Contactgegevens duidelijk bovenaan en in de footer zetten.')
    : null,

  (s) => !s.contact.hasContactForm
    ? issue('geen-contactformulier', 'inhoud', 'middel', 3,
        'Er is geen contact- of offerteformulier',
        'Een kort formulier toevoegen; verhoogt het aantal aanvragen merkbaar.')
    : null,

  (s) => (s.freshness.copyrightAgeYears ?? 0) >= 3
    ? issue('verouderde-inhoud', 'inhoud', 'middel', 4,
        `De copyright-vermelding staat nog op ${s.freshness.copyrightYear}`,
        'Inhoud actualiseren; bezoekers twijfelen of het bedrijf nog bestaat.')
    : null,

  (s) => !s.legal.privacyLink
    ? issue('geen-privacyverklaring', 'inhoud', 'middel', 3,
        'Geen privacyverklaring gevonden — verplicht onder de AVG',
        'Privacyverklaring toevoegen en in de footer linken.')
    : null,

  (s) => !s.seo.hasFavicon
    ? issue('geen-favicon', 'inhoud', 'laag', 1,
        'Geen favicon: het tabblad toont een leeg icoon',
        'Favicon toevoegen in meerdere formaten.')
    : null,

  (s) => s.links.socials.length === 0
    ? issue('geen-social', 'inhoud', 'laag', 1,
        'Geen links naar social media',
        'Social-profielen koppelen voor meer vertrouwen en bereik.')
    : null,
];

export function evaluate(signals: PageSignals): Issue[] {
  return RULES.map((rule) => {
    try { return rule(signals); } catch { return null; }
  }).filter((found): found is Issue => found !== null);
}
