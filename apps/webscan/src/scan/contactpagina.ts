import * as cheerio from 'cheerio';
import { fetchPage } from './fetcher.ts';
import { checkRobots } from './robots.ts';
import { zichtbareTekst, zoekAdres } from './analyze.ts';
import type { PageSignals } from './analyze.ts';

/**
 * Contactgegevens staan zelden op de homepage — ze staan op /contact. Voor een
 * belijst is dat precies wat je nodig hebt, dus halen we die ene extra pagina op
 * als de homepage ernaar linkt. Eén verzoek per bedrijf, met dezelfde
 * beleefdheidsregels als de rest van de scan.
 */
export type Contactpagina = {
  url: string;
  emails: string[];
  phones: string[];
  kvk: string | null;
  btw: string | null;
  iban: string | null;
  adres: { adres: string; postcode: string; plaats: string } | null;
  openingstijden: string | null;
};

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]{2,}/g;
const PHONE_RE = /(?:\+31|0031|0)[\s.-]?(?:\d[\s.-]?){8,9}\d/g;
const KVK_RE = /k\.?v\.?k\.?(?:[\s-]*nummer)?[\s.:#-]*(\d{8})\b/i;
const BTW_RE = /\bNL\s?\d{9}\s?B\s?\d{2}\b/i;
const IBAN_RE = /\bNL\d{2}\s?[A-Z]{4}(?:\s?\d{4}){2}\s?\d{2}\b/;
const DAGEN = /(?:maandag|dinsdag|woensdag|donderdag|vrijdag|zaterdag|zondag)\b[^.]{0,50}?\d{1,2}[.:]\d{2}(?:\s*(?:-|tot|t\/m)\s*\d{1,2}[.:]\d{2})?(?:\s*uur)?/i;

const uniek = <T,>(waarden: T[]): T[] => [...new Set(waarden)];

export async function leesContactpagina(
  signals: PageSignals,
  opties: { crawlDelayMs?: number } = {},
): Promise<Contactpagina | null> {
  const url = signals.contact.contactpaginaUrl;
  if (!url) return null;

  const toestemming = await checkRobots(url).catch(() => ({ allowed: true, crawlDelayMs: 0 }));
  if (!toestemming.allowed) return null;

  const opgehaald = await fetchPage(url, { crawlDelayMs: opties.crawlDelayMs ?? toestemming.crawlDelayMs });
  if (opgehaald.error || !opgehaald.ok) return null;

  const $ = cheerio.load(opgehaald.body);
  const hrefs = $('a[href]').toArray().map((knoop) => ($(knoop).attr('href') ?? '').trim());
  $('script, style, noscript, template').remove();
  const tekst = zichtbareTekst($);

  const emails = uniek([
    ...hrefs.filter((href) => href.toLowerCase().startsWith('mailto:'))
      .map((href) => href.slice(7).split('?')[0]!.trim()),
    ...(tekst.match(EMAIL_RE) ?? []),
  ]).filter((adres) => !/\.(png|jpe?g|gif|webp|svg)$/i.test(adres)).slice(0, 5);

  const phones = uniek([
    ...hrefs.filter((href) => href.toLowerCase().startsWith('tel:')).map((href) => href.slice(4).trim()),
    ...(tekst.match(PHONE_RE) ?? []).map((nummer) => nummer.replace(/[\s.-]/g, '')),
  ]).slice(0, 4);

  return {
    url: opgehaald.finalUrl,
    emails,
    phones,
    kvk: KVK_RE.exec(tekst)?.[1] ?? null,
    btw: BTW_RE.exec(tekst)?.[0] ?? null,
    iban: IBAN_RE.exec(tekst)?.[0] ?? null,
    adres: zoekAdres(tekst),
    openingstijden: DAGEN.exec(tekst)?.[0]?.slice(0, 80) ?? null,
  };
}

/** Voegt homepage en contactpagina samen tot één set contactgegevens. */
export function samenvoegen(signals: PageSignals | null, pagina: Contactpagina | null) {
  const uitHome = signals?.contact;
  return {
    emails: uniek([...(uitHome?.emails ?? []), ...(pagina?.emails ?? [])]).slice(0, 5),
    phones: uniek([...(uitHome?.phones ?? []), ...(pagina?.phones ?? [])]).slice(0, 4),
    kvk: uitHome?.kvk ?? pagina?.kvk ?? null,
    btw: uitHome?.btw ?? pagina?.btw ?? null,
    iban: uitHome?.iban ?? pagina?.iban ?? null,
    adres: pagina?.adres ?? uitHome?.adres ?? null,
    openingstijden: pagina?.openingstijden ?? null,
    whatsapp: uitHome?.whatsappNummer ?? null,
    socials: uitHome?.socialLinks ?? {},
    heeftFormulier: Boolean(uitHome?.hasContactForm),
    bron: pagina ? pagina.url : null,
    /** Gezet als deze gegevens van een eerdere scan komen omdat de site nu niets prijsgeeft. */
    vanEerdereScan: null as string | null,
  };
}

/**
 * Valt terug op de contactgegevens van een eerdere scan. Bij een site die nu
 * offline is, is dat precies wat een agent nodig heeft om te bellen.
 */
export function vulAanUitVerleden(
  huidig: Contactgegevens,
  eerder: { contact: unknown; op: string } | null,
): Contactgegevens {
  if (huidig.phones.length > 0 || huidig.emails.length > 0 || !eerder) return huidig;
  const oud = eerder.contact as Partial<Contactgegevens> | null;
  if (!oud) return huidig;
  return {
    ...huidig,
    emails: oud.emails ?? [],
    phones: oud.phones ?? [],
    adres: oud.adres ?? huidig.adres,
    kvk: oud.kvk ?? huidig.kvk,
    btw: oud.btw ?? huidig.btw,
    openingstijden: oud.openingstijden ?? huidig.openingstijden,
    whatsapp: oud.whatsapp ?? huidig.whatsapp,
    socials: Object.keys(oud.socials ?? {}).length > 0 ? oud.socials! : huidig.socials,
    vanEerdereScan: eerder.op,
  };
}

export type Contactgegevens = ReturnType<typeof samenvoegen>;
