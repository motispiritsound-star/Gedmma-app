import type { nl } from "./dictionaries/nl";

/** The Dutch dictionary is the source of truth for the key set. */
export type TranslationKey = keyof typeof nl;
export type Dictionary = Record<TranslationKey, string>;

export const LOCALES = ["nl", "en"] as const;
export type AppLocale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: AppLocale = "nl";
export const LOCALE_COOKIE = "questly_locale";

export type Translate = (key: TranslationKey, params?: Record<string, string | number>) => string;
