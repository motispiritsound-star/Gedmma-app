import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import { DEFAULT_LOCALE, resolveLocale, type Locale } from '@buurklus/shared';
import nl from './locales/nl.json';
import en from './locales/en.json';

export const resources = {
  nl: { translation: nl },
  en: { translation: en },
} as const;

/**
 * Picks the language from the device on first launch. Dutch devices report
 * `nl-NL`; anything Buurklus does not speak falls back to Dutch.
 */
export function deviceLocale(): Locale {
  const tags = Localization.getLocales().map((entry) => entry.languageTag);
  return resolveLocale(tags);
}

export async function initI18n(initial?: Locale): Promise<Locale> {
  const locale = initial ?? deviceLocale();

  if (!i18n.isInitialized) {
    await i18n.use(initReactI18next).init({
      resources,
      lng: locale,
      fallbackLng: DEFAULT_LOCALE,
      // Missing keys fall through to Dutch rather than showing the raw key.
      returnEmptyString: false,
      interpolation: { escapeValue: false },
      compatibilityJSON: 'v4',
    });
  } else if (i18n.language !== locale) {
    await i18n.changeLanguage(locale);
  }

  return locale;
}

export default i18n;
