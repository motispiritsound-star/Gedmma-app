import type { Locale } from '@buurklus/shared';

interface LocalizedColumns {
  nameNl: string;
  nameEn: string;
}

/** Reads the column matching the caller's language off a catalog row. */
export function pickName(row: LocalizedColumns, locale: Locale): string {
  return locale === 'en' ? row.nameEn : row.nameNl;
}

/**
 * Adds a `name` field, collapsed to the caller's language, to the category and
 * city attached to a row. The catalog endpoints already serve one language;
 * this keeps everything that embeds a category or a city consistent with them,
 * so the app never has to know which of the three columns to read.
 *
 * The raw columns are left in place: some screens render a second language
 * beside the first, and dropping them would be a breaking change for no gain.
 */
export function withLocalizedNames<
  T extends { category?: LocalizedColumns | null; city?: LocalizedColumns | null },
>(row: T, locale: Locale): T {
  return {
    ...row,
    ...(row.category ? { category: { ...row.category, name: pickName(row.category, locale) } } : {}),
    ...(row.city ? { city: { ...row.city, name: pickName(row.city, locale) } } : {}),
  };
}

/** Applies `withLocalizedNames` across a page of rows. */
export function localizeAll<
  T extends { category?: LocalizedColumns | null; city?: LocalizedColumns | null },
>(rows: T[], locale: Locale): T[] {
  return rows.map((row) => withLocalizedNames(row, locale));
}
