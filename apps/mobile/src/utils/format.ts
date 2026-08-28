import { formatCents, type Locale } from '@buurklus/shared';

const DATE_TAGS: Record<Locale, string> = { nl: 'nl-NL', en: 'en-GB' };

export function formatMoney(centimes: number | null | undefined, locale: Locale): string {
  if (centimes == null) return '—';
  return formatCents(centimes, locale, { withDecimals: false });
}

export function formatDate(value: string | Date | null | undefined, locale: Locale): string {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat(DATE_TAGS[locale], {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/**
 * "il y a 3 h" style relative time. Uses Intl.RelativeTimeFormat, which knows
 * the plural rules of all three languages, Arabic's included.
 */
export function formatRelative(value: string | Date | null | undefined, locale: Locale): string {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat(DATE_TAGS[locale], { numeric: 'auto' });

  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31_536_000],
    ['month', 2_592_000],
    ['week', 604_800],
    ['day', 86_400],
    ['hour', 3_600],
    ['minute', 60],
  ];

  for (const [unit, seconds] of units) {
    if (Math.abs(diffSeconds) >= seconds) {
      return formatter.format(Math.round(diffSeconds / seconds), unit);
    }
  }
  return formatter.format(Math.round(diffSeconds), 'second');
}

/** Turns 42 minutes into "42 min" and 180 into "3 h", for response times. */
export function formatDuration(minutes: number | null | undefined, locale: Locale): string | null {
  if (minutes == null) return null;
  if (minutes < 60) return new Intl.NumberFormat(DATE_TAGS[locale]).format(minutes) + ' min';
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${new Intl.NumberFormat(DATE_TAGS[locale]).format(hours)} h`;
  const days = Math.round(hours / 24);
  return `${new Intl.NumberFormat(DATE_TAGS[locale]).format(days)} d`;
}

/** Reads the right language column off a row the API did not collapse. */
export function pickName(row: { nameNl: string; nameEn: string }, locale: Locale): string {
  return locale === 'en' ? row.nameEn : row.nameNl;
}
