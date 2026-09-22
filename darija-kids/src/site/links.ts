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
/**
 * De sociale kanalen.
 *
 * Een leeg adres betekent: laat het logo weg. Dat is met opzet — een logo dat
 * naar een pagina wijst die er niet is, kost meer vertrouwen dan het oplevert,
 * en die afweging hoort niet in de opmaak thuis maar hier.
 *
 * De Facebook-pagina staat op een nummer en niet op een naam: zodra de pagina
 * genoeg volgers heeft mag er een gebruikersnaam op, en dan verandert hier
 * één regel.
 */
export const SOCIAL: { naam: string; label: string; url: string }[] = [
  { naam: 'youtube', label: 'YouTube', url: 'https://www.youtube.com/@darijaforkidsapp' },
  { naam: 'instagram', label: 'Instagram', url: 'https://www.instagram.com/darijaforkidsapp/' },
  { naam: 'facebook', label: 'Facebook', url: 'https://www.facebook.com/profile.php?id=61594495868221' },
  { naam: 'tiktok', label: 'TikTok', url: 'https://www.tiktok.com/@darijaforkidsapp' },
]

export const PATHS: Record<Lang, { home: string; privacy: string; terms: string; parents: string; name: string; history: string; books: string; checkout: string }> = {
  nl: { home: '/', privacy: '/privacy', terms: '/voorwaarden', parents: '/ouders', name: '/naam', history: '/geschiedenis', books: '/leesboeken', checkout: '/afrekenen' },
  fr: { home: '/fr/', privacy: '/fr/confidentialite', terms: '/fr/conditions', parents: '/fr/parents', name: '/fr/prenom', history: '/fr/histoire', books: '/fr/livres', checkout: '/fr/paiement' },
  de: { home: '/de/', privacy: '/de/datenschutz', terms: '/de/bedingungen', parents: '/de/eltern', name: '/de/name', history: '/de/geschichte', books: '/de/buecher', checkout: '/de/bezahlen' },
  es: { home: '/es/', privacy: '/es/privacidad', terms: '/es/condiciones', parents: '/es/padres', name: '/es/nombre', history: '/es/historia', books: '/es/libros', checkout: '/es/pago' },
  it: { home: '/it/', privacy: '/it/privacy', terms: '/it/condizioni', parents: '/it/genitori', name: '/it/nome', history: '/it/storia', books: '/it/libri', checkout: '/it/pagamento' },
  en: { home: '/en/', privacy: '/en/privacy', terms: '/en/terms', parents: '/en/parents', name: '/en/name', history: '/en/history', books: '/en/books', checkout: '/en/checkout' },
}
