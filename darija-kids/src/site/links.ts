import type { Lang } from '../i18n/languages'

/**
 * Where the website sends somebody who wants the app.
 *
 * Empty until the stores hand out the real addresses. The site reads that
 * emptiness and shows "coming soon" instead of a button that leads nowhere —
 * so the day App Store Connect and the Play Console give out the links, this
 * file is the only thing that changes.
 *
 * The App Store address appears once the app is approved; Google Play's is
 * known earlier and is always play.google.com/store/apps/details?id= plus the
 * application id from capacitor.config.ts.
 */
export const STORE = {
  apple: '',
  google: '',
}

/** The website's own address, for canonical links and the sitemap. */
export const SITE_URL = 'https://darijaforkids.eu'

/**
 * The path each page has in each language.
 *
 * Dutch sits at the root because the store listings already point there:
 * darijaforkids.eu/privacy is printed in App Store Connect and in the Play
 * Console, and those are read by a reviewer rather than resolved by a
 * redirect. Every other language gets a prefix and its own words, because a
 * German parent should not have to read "voorwaarden" to find the terms.
 */
export const PATHS: Record<Lang, { home: string; privacy: string; terms: string; parents: string; name: string; history: string }> = {
  nl: { home: '/', privacy: '/privacy', terms: '/voorwaarden', parents: '/ouders', name: '/naam', history: '/geschiedenis' },
  fr: { home: '/fr/', privacy: '/fr/confidentialite', terms: '/fr/conditions', parents: '/fr/parents', name: '/fr/prenom', history: '/fr/histoire' },
  de: { home: '/de/', privacy: '/de/datenschutz', terms: '/de/bedingungen', parents: '/de/eltern', name: '/de/name', history: '/de/geschichte' },
  es: { home: '/es/', privacy: '/es/privacidad', terms: '/es/condiciones', parents: '/es/padres', name: '/es/nombre', history: '/es/historia' },
  it: { home: '/it/', privacy: '/it/privacy', terms: '/it/condizioni', parents: '/it/genitori', name: '/it/nome', history: '/it/storia' },
  en: { home: '/en/', privacy: '/en/privacy', terms: '/en/terms', parents: '/en/parents', name: '/en/name', history: '/en/history' },
}
