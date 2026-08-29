import { en, type MessageKey } from './en.js';
import { nl } from './nl.js';
import type { Locale } from '../people.js';

export { en } from './en.js';
export { nl } from './nl.js';
export type { MessageKey } from './en.js';

export const catalogues: Readonly<Record<Locale, Record<MessageKey, string>>> = Object.freeze({
  en: en as unknown as Record<MessageKey, string>,
  nl,
});

export const DEFAULT_LOCALE: Locale = 'nl';

export function isMessageKey(value: string): value is MessageKey {
  return Object.prototype.hasOwnProperty.call(en, value);
}

/**
 * Translate a key. Unknown keys return the key itself rather than throwing:
 * a missing string must never take a family's screen down. `missingKeys()`
 * exists so the test suite can fail on it instead.
 */
export function translate(
  locale: Locale,
  key: string,
  params: Readonly<Record<string, string | number>> = {},
): string {
  const catalogue = catalogues[locale] ?? catalogues[DEFAULT_LOCALE];
  const template = isMessageKey(key) ? catalogue[key] : key;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match,
  );
}

export function createTranslator(locale: Locale) {
  return (key: string, params?: Readonly<Record<string, string | number>>): string =>
    translate(locale, key, params);
}

/** Keys present in English but missing from another locale. */
export function missingKeys(locale: Locale): string[] {
  const target = catalogues[locale];
  return Object.keys(en).filter((key) => !(key in target));
}

/** Every shipped string in every locale - used by the copy audit test. */
export function allCopy(): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [locale, catalogue] of Object.entries(catalogues)) {
    for (const [key, value] of Object.entries(catalogue)) {
      result[`${locale}:${key}`] = value;
    }
  }
  return result;
}
