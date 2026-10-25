import { cookies, headers } from 'next/headers';
import { env } from '../env.ts';
import { isLocale, negotiateLocale, type Locale } from '../i18n/locale.ts';
import { translator, type Translate } from '../i18n/dictionary.ts';

export const LOCALE_COOKIE = 'wb_locale';

/**
 * Resolves the locale for a request: an explicit choice wins, then the
 * browser's Accept-Language, then the configured default.
 */
export async function requestLocale(): Promise<Locale> {
  const jar = await cookies();
  const chosen = jar.get(LOCALE_COOKIE)?.value;
  if (isLocale(chosen)) return chosen;
  const headerBag = await headers();
  return negotiateLocale(headerBag.get('accept-language'), env.DEFAULT_LOCALE);
}

export async function requestTranslator(): Promise<{ locale: Locale; t: Translate }> {
  const locale = await requestLocale();
  return { locale, t: translator(locale) };
}
