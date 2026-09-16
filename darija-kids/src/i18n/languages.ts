/** The interface languages: the Moroccan diaspora's everyday languages. */
export const LANGS = [
  { code: 'nl', name: 'Nederlands', badge: '🇳🇱', where: 'Nederland en België' },
  { code: 'fr', name: 'Français', badge: '🇫🇷', where: 'France, Belgique, Suisse' },
  { code: 'de', name: 'Deutsch', badge: '🇩🇪', where: 'Deutschland, Österreich, Schweiz' },
  { code: 'es', name: 'Español', badge: '🇪🇸', where: 'España' },
  { code: 'it', name: 'Italiano', badge: '🇮🇹', where: 'Italia' },
  // Not a flag: this row is for the United States, Canada, Australia and
  // everywhere else too, and the Union Jack told four fifths of them they were
  // in the wrong place.
  { code: 'en', name: 'English', badge: 'EN', where: 'everywhere else' },
] as const

export type Lang = (typeof LANGS)[number]['code']

export const LANG_CODES = LANGS.map((l) => l.code) as readonly Lang[]

export const isLang = (value: unknown): value is Lang =>
  typeof value === 'string' && (LANG_CODES as readonly string[]).includes(value)

/**
 * Which country speaks which of ours, for a device whose language we do not
 * support — an Arabic or Amazigh phone in Lyon, a Spanish one in Utrecht.
 * The device language is checked first and wins; this is the fallback.
 *
 * Belgium is the awkward one: a Dutch phone (nl-BE) resolves to Dutch a step
 * earlier, so what reaches this table is a Belgian device in some other
 * language — most Moroccan families in Belgium live in Brussels and Wallonia,
 * so French is the better guess there.
 */
const COUNTRY: Record<string, Lang> = {
  NL: 'nl', SR: 'nl',
  BE: 'fr', FR: 'fr', LU: 'fr', MC: 'fr', MA: 'fr', DZ: 'fr', TN: 'fr',
  DE: 'de', AT: 'de', CH: 'de', LI: 'de',
  ES: 'es', MX: 'es', AR: 'es', CO: 'es', CL: 'es', PE: 'es', VE: 'es', UY: 'es',
  IT: 'it', SM: 'it', VA: 'it',
  GB: 'en', IE: 'en', US: 'en', CA: 'en', AU: 'en', NZ: 'en', ZA: 'en',
}

/**
 * The language to start in, from the device.
 *
 * A phone in France is set to French, one in Flanders to Dutch and one in
 * Wallonia to French, so the device tells us almost everything: there is no
 * separate app per country, and none is needed. Only when the device speaks
 * something we do not does the country decide. Whatever comes out is a
 * proposal — the welcome screen shows it selected and lets a child change it.
 */
export function detectLang(tags: readonly string[] = deviceTags()): Lang {
  for (const tag of tags) {
    const code = tag.toLowerCase().split('-')[0]
    if (isLang(code)) return code
  }
  for (const tag of tags) {
    const region = tag.split('-')[1]?.toUpperCase()
    if (region && COUNTRY[region]) return COUNTRY[region]
  }
  return 'en'
}

function deviceTags(): readonly string[] {
  if (typeof navigator === 'undefined') return []
  return navigator.languages?.length ? navigator.languages : [navigator.language]
}

/**
 * BCP-47 tag for the interface, for <html lang>.
 *
 * English stays plain `en`: the app is as much for a reader in Detroit or
 * Melbourne as for one in Birmingham, and `en-GB` claims otherwise.
 */
export const localeOf = (lang: Lang): string =>
  ({ nl: 'nl-NL', fr: 'fr-FR', de: 'de-DE', es: 'es-ES', it: 'it-IT', en: 'en' })[lang]
