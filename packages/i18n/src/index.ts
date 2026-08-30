/**
 * @gedmma/i18n - vertalingen en opmaak.
 *
 * Regel: er staat geen gebruikersgerichte tekst in componenten. Alles loopt via
 * `t()`. De sleutels zijn beschrijvend (`facturen.leeg.titel`), zodat een
 * ontbrekende vertaling in de interface direct opvalt.
 */
import { Money, type ValutaCode } from '@gedmma/money';
import { nl } from './vertalingen/nl.ts';
import { en } from './vertalingen/en.ts';
import { de } from './vertalingen/de.ts';
import { fr } from './vertalingen/fr.ts';

export type Taal = 'nl' | 'en' | 'de' | 'fr';

export const TALEN: { code: Taal; naam: string; locale: string }[] = [
  { code: 'nl', naam: 'Nederlands', locale: 'nl-NL' },
  { code: 'en', naam: 'English', locale: 'en-GB' },
  { code: 'de', naam: 'Deutsch', locale: 'de-DE' },
  { code: 'fr', naam: 'Français', locale: 'fr-FR' },
];

/**
 * De sleutels komen uit het Nederlandse woordenboek; de waarden zijn gewoon
 * `string`. Zonder deze afvlakking zou TypeScript de letterlijke Nederlandse
 * tekst als type nemen en elke vertaling afkeuren.
 */
export type Woordenboek = { [Sleutel in keyof typeof nl]: string };
export type Sleutel = keyof Woordenboek;

const WOORDENBOEKEN: Record<Taal, Partial<Woordenboek>> = { nl, en, de, fr };

export function localeVan(taal: Taal): string {
  return TALEN.find((item) => item.code === taal)?.locale ?? 'nl-NL';
}

/** Kiest de beste taal uit een Accept-Language-achtige lijst. */
export function kiesTaal(voorkeuren: readonly string[], standaard: Taal = 'nl'): Taal {
  for (const voorkeur of voorkeuren) {
    const kort = voorkeur.toLowerCase().split('-')[0];
    if (kort && kort in WOORDENBOEKEN) return kort as Taal;
  }
  return standaard;
}

/**
 * Vertaalt een sleutel. Ontbreekt de vertaling in de gekozen taal, dan valt hij
 * terug op het Nederlands; ontbreekt hij daar ook, dan komt de sleutel zelf in
 * beeld. Dat is met opzet lelijk: een ontbrekende tekst hoort op te vallen.
 */
export function vertaal(
  taal: Taal,
  sleutel: Sleutel,
  variabelen: Record<string, string | number> = {},
): string {
  const tekst = WOORDENBOEKEN[taal]?.[sleutel] ?? nl[sleutel] ?? String(sleutel);
  return tekst.replace(/\{(\w+)\}/g, (heel, naam: string) =>
    naam in variabelen ? String(variabelen[naam]) : heel,
  );
}

/** Maakt een vertaalfunctie voor een vaste taal. */
export function maakVertaler(taal: Taal) {
  return (sleutel: Sleutel, variabelen?: Record<string, string | number>) =>
    vertaal(taal, sleutel, variabelen);
}

// --- Opmaak ---------------------------------------------------------------

/** Bedrag in de taal van de gebruiker; de waarde blijft exact. */
export function toonBedrag(bedrag: string, valuta: ValutaCode, taal: Taal): string {
  return Money.vanTekst(bedrag, valuta).formatteer(localeVan(taal));
}

/** Bedrag zonder valutateken, bijvoorbeeld in een tabelkolom met een kop. */
export function toonGetal(bedrag: string, taal: Taal, decimalen = 2): string {
  return new Intl.NumberFormat(localeVan(taal), {
    minimumFractionDigits: decimalen,
    maximumFractionDigits: decimalen,
  }).format(bedrag as unknown as number);
}

export function toonDatum(datum: string, taal: Taal, stijl: 'kort' | 'lang' = 'kort'): string {
  if (!datum) return '';
  const opties: Intl.DateTimeFormatOptions =
    stijl === 'lang'
      ? { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }
      : { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' };
  return new Intl.DateTimeFormat(localeVan(taal), opties).format(new Date(`${datum.slice(0, 10)}T00:00:00Z`));
}

export function toonTijdstip(tijdstip: string, taal: Taal): string {
  return new Intl.DateTimeFormat(localeVan(taal), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(tijdstip));
}

/** "3 dagen geleden", "over 2 weken". */
export function toonRelatief(datum: string, taal: Taal, vandaag = new Date()): string {
  const doel = new Date(`${datum.slice(0, 10)}T00:00:00Z`);
  const dagen = Math.round((doel.getTime() - Date.UTC(vandaag.getUTCFullYear(), vandaag.getUTCMonth(), vandaag.getUTCDate())) / 86_400_000);
  const formatter = new Intl.RelativeTimeFormat(localeVan(taal), { numeric: 'auto' });
  if (Math.abs(dagen) < 31) return formatter.format(dagen, 'day');
  if (Math.abs(dagen) < 365) return formatter.format(Math.round(dagen / 30), 'month');
  return formatter.format(Math.round(dagen / 365), 'year');
}

export { nl, en, de, fr };
