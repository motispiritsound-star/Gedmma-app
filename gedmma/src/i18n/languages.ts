/** The four interface languages: the Moroccan diaspora's everyday languages. */
export const LANGS = [
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱', where: 'Nederland en België' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', where: 'France, Belgique, Suisse' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', where: 'Deutschland, Österreich, Schweiz' },
  { code: 'en', name: 'English', flag: '🇬🇧', where: 'everywhere else' },
] as const

export type Lang = (typeof LANGS)[number]['code']

export const LANG_CODES = LANGS.map((l) => l.code) as readonly Lang[]

export const isLang = (value: unknown): value is Lang =>
  typeof value === 'string' && (LANG_CODES as readonly string[]).includes(value)

/** The language the browser is set to, when we have it; Dutch otherwise. */
export function detectLang(): Lang {
  if (typeof navigator === 'undefined') return 'nl'
  const wanted = [navigator.language, ...(navigator.languages ?? [])]
  for (const tag of wanted) {
    const code = tag.toLowerCase().split('-')[0]
    if (isLang(code)) return code
  }
  return 'nl'
}

/** BCP-47 tag for the interface, used for <html lang> and date formatting. */
export const localeOf = (lang: Lang): string =>
  ({ nl: 'nl-NL', fr: 'fr-FR', de: 'de-DE', en: 'en-GB' })[lang]
