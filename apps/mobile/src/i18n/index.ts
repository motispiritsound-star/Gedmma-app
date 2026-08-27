import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager } from 'react-native';
import * as Localization from 'expo-localization';
import { DEFAULT_LOCALE, isRtl, resolveLocale, type Locale } from '@khidma/shared';
import fr from './locales/fr.json';
import ar from './locales/ar.json';
import en from './locales/en.json';

export const resources = {
  fr: { translation: fr },
  ar: { translation: ar },
  en: { translation: en },
} as const;

/**
 * Picks the language from the device on first launch. Morocco commonly reports
 * `fr-MA` or `ar-MA`, and French is the fallback for anything else.
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
      // Missing keys fall through to French rather than showing the raw key.
      returnEmptyString: false,
      interpolation: { escapeValue: false },
      compatibilityJSON: 'v4',
    });
  } else if (i18n.language !== locale) {
    await i18n.changeLanguage(locale);
  }

  applyDirection(locale);
  return locale;
}

/**
 * Arabic lays the whole interface out right-to-left. React Native applies the
 * change to native views only after a reload, so the caller is responsible for
 * restarting the app when this returns true.
 */
export function applyDirection(locale: Locale): boolean {
  const shouldBeRtl = isRtl(locale);
  if (I18nManager.isRTL === shouldBeRtl) return false;

  I18nManager.allowRTL(shouldBeRtl);
  I18nManager.forceRTL(shouldBeRtl);
  return true;
}

export default i18n;
