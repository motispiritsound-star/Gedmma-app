import { en, type Dictionary } from './dictionaries/en'
import { nl } from './dictionaries/nl'

export type Locale = 'nl' | 'en'
export const LOCALES: readonly Locale[] = ['nl', 'en']
export const LOCALE_COOKIE = 'questly_locale'

const DICTIONARIES: Record<Locale, Dictionary> = { en, nl }

export type { Dictionary }

export function isLocale(value: unknown): value is Locale {
  return value === 'nl' || value === 'en'
}

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale]
}

/**
 * Replaces `{placeholder}` tokens in a translated string.
 * `fill(d.home.greeting, { name: 'Sam' })` -> "Hello Sam".
 */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  )
}
