import type { PageSignals } from '../scan/analyze.ts';

/**
 * Een verwaarloosde website is nog geen goede lead. Een bakker die er over een
 * jaar mee stopt heeft ook een site uit 2011, maar die gaat niets afnemen.
 * Deze module kijkt daarom apart naar de vraag: draait dit bedrijf nog?
 *
 * Alles komt uit dezelfde ene pagina die we toch al ophalen, plus de sitemap.
 * Het is een indicatie, geen zekerheid — vandaar dat elk oordeel zijn redenen
 * meelevert, zodat een agent zelf kan wegen wat hij ziet.
 */

export type Signaal = { punten: number; tekst: string };

export type Leven = {
  score: number;
  niveau: 'levend' | 'onduidelijk' | 'stil';
  label: string;
  tekens: Signaal[];
  twijfels: Signaal[];
};

export type SitemapInfo = { aanwezig: boolean; laatstGewijzigd: string | null; aantalUrls: number };

const maandenGeleden = (datum: string | null): number | null => {
  if (!datum) return null;
  const tijd = Date.parse(datum);
  if (!Number.isFinite(tijd)) return null;
  return (Date.now() - tijd) / (1000 * 60 * 60 * 24 * 30.44);
};

const NIVEAUS = {
  levend: 'Draait duidelijk nog',
  onduidelijk: 'Niet goed te zeggen',
  stil: 'Weinig teken van leven',
} as const;

/** Weegt de levenstekenen tot een score van 0 tot 100. */
export function beoordeelLeven(signals: PageSignals | null, sitemap?: SitemapInfo): Leven {
  const tekens: Signaal[] = [];
  const twijfels: Signaal[] = [];

  if (!signals) {
    return {
      score: 35, niveau: 'onduidelijk', label: NIVEAUS.onduidelijk,
      tekens: [],
      twijfels: [{ punten: 0, tekst: 'De site was niet op te halen, dus er valt niets aan af te lezen.' }],
    };
  }

  const nu = new Date().getFullYear();
  const leven = signals.leven;
  let score = 30; // niemand is bij voorbaat dood of levend

  const tel = (punten: number, tekst: string): void => {
    score += punten;
    (punten >= 0 ? tekens : twijfels).push({ punten, tekst });
  };

  // Het hardste signaal: wanneer is er voor het laatst iets aan de site gedaan?
  const sitemapMaanden = maandenGeleden(sitemap?.laatstGewijzigd ?? null);
  if (sitemapMaanden !== null) {
    if (sitemapMaanden < 3) tel(25, 'De site is de afgelopen maanden nog bijgewerkt.');
    else if (sitemapMaanden < 12) tel(15, 'De site is het afgelopen jaar bijgewerkt.');
    else if (sitemapMaanden < 30) tel(4, `De site is ongeveer ${Math.round(sitemapMaanden / 12)} jaar geleden voor het laatst bijgewerkt.`);
    else tel(-10, 'De site is al jaren niet meer aangeraakt.');
  }

  const headerMaanden = maandenGeleden(signals.freshness.lastModified);
  if (headerMaanden !== null && headerMaanden < 6) tel(8, 'De server meldt een recente wijziging.');

  // Tekst die meebeweegt met de tijd
  if (leven.jongsteJaar >= nu) tel(14, `Het huidige jaartal (${nu}) staat op de site.`);
  else if (leven.jongsteJaar === nu - 1) tel(7, `Het jaartal ${leven.jongsteJaar} staat op de site.`);
  else if (leven.jongsteJaar > 0 && leven.jongsteJaar <= nu - 3) {
    tel(-8, `Het jongste jaartal op de site is ${leven.jongsteJaar}.`);
  }

  if (leven.jongsteBerichtJaar >= nu - 1) tel(11, 'Er staat een nieuwsbericht van het afgelopen jaar op.');

  // Geld en moeite die het bedrijf ergens anders in steekt
  if (leven.vacature) tel(13, 'Het bedrijf zoekt personeel — daar wordt dus geïnvesteerd.');
  if (leven.onlineActie) tel(10, 'Klanten kunnen online bestellen, boeken of een afspraak maken.');
  if (leven.meetInstrument) tel(7, 'Er staat statistiek op de site, dus iemand kijkt mee.');
  if (leven.cookiebanner) tel(4, 'Er is ooit werk gemaakt van een cookiemelding.');
  if (leven.whatsapp) tel(5, 'Er staat een WhatsApp-nummer op.');
  if (leven.socials >= 2) tel(8, `Er wordt naar ${leven.socials} social-profielen gelinkt.`);
  else if (leven.socials === 1) tel(4, 'Er wordt naar één social-profiel gelinkt.');

  if (signals.freshness.copyrightYear === nu) tel(9, 'De copyright-vermelding staat op dit jaar.');
  else if ((signals.freshness.copyrightAgeYears ?? 0) >= 4) {
    tel(-10, `De copyright-vermelding staat nog op ${signals.freshness.copyrightYear}.`);
  }

  if (signals.contact.phones.length > 0 || signals.contact.emails.length > 0) {
    tel(5, 'Er staan contactgegevens op de site.');
  } else {
    tel(-6, 'Er staan geen contactgegevens op de site.');
  }

  // Harde tegensignalen
  if (leven.lijktGestopt) tel(-45, 'De tekst wijst erop dat het bedrijf gestopt is.');
  if (signals.content.parked) tel(-30, 'Er staat geen echte website, alleen een parkeerpagina.');
  if (signals.content.wordCount < 60) tel(-8, 'Er staat vrijwel geen tekst op de site.');

  const eindscore = Math.max(0, Math.min(100, Math.round(score)));
  const niveau = eindscore >= 60 ? 'levend' : eindscore >= 35 ? 'onduidelijk' : 'stil';

  return {
    score: eindscore,
    niveau,
    label: NIVEAUS[niveau],
    tekens: tekens.sort((a, b) => b.punten - a.punten),
    twijfels: twijfels.sort((a, b) => a.punten - b.punten),
  };
}

export type Prioriteit = {
  score: number;
  uitleg: string;
};

/**
 * Hoe interessant is dit bedrijf om te benaderen? Drie dingen moeten kloppen:
 * de site moet slecht genoeg zijn om iets te verkopen, het bedrijf moet nog
 * draaien, en je moet er contact mee kunnen krijgen. Ze werken op elkaar in —
 * een dode zaak met een dramatische site levert niets op, hoe slecht die site
 * ook is. Daarom vermenigvuldigen we in plaats van op te tellen.
 */
export function bepaalPrioriteit(input: {
  kwaliteit: number;
  leven: Leven;
  heeftTelefoon: boolean;
  heeftEmail: boolean;
}): Prioriteit {
  const teVerbeteren = (100 - input.kwaliteit) / 100;
  const levensfactor = 0.2 + 0.8 * (input.leven.score / 100);
  const bereikbaar = input.heeftTelefoon && input.heeftEmail ? 1
    : input.heeftTelefoon || input.heeftEmail ? 0.85 : 0.5;

  const score = Math.round(teVerbeteren * levensfactor * bereikbaar * 100);

  const zwakste = levensfactor < 0.55 ? 'het bedrijf lijkt weinig actief'
    : bereikbaar < 0.85 ? 'er zijn geen contactgegevens gevonden'
    : teVerbeteren < 0.4 ? 'de site is al redelijk in orde'
    : null;

  return {
    score,
    uitleg: zwakste
      ? `Er valt veel te verbeteren, maar ${zwakste}.`
      : 'Slechte site, bedrijf draait, en er is contact mogelijk.',
  };
}
