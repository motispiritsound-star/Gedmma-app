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
  apple: 'https://apps.apple.com/app/id6813964474',
  google: 'https://play.google.com/store/apps/details?id=app.darijaforkids.learn',
}

/** The application id, the same one android/app/build.gradle carries. */
export const APP_ID = 'app.darijaforkids.learn'

/**
 * Het Apple-nummer, uit `STORE.apple` gelezen in plaats van er nog een keer
 * neergezet.
 *
 * `scripts/live.mjs` herschrijft het STORE-blok hierboven machinaal met een
 * reguliere uitdrukking. Een tweede, met de hand getypt exemplaar van
 * hetzelfde nummer is dus een exemplaar dat stil achterloopt zodra dat script
 * draait.
 */
export const APPLE_ID = STORE.apple.match(/id(\d{8,})/)?.[1] ?? ''

/**
 * The App Store address, from whatever App Store Connect hands you.
 *
 * That can be the bare Apple ID, `id6751234567`, or the long share link with
 * a country and a slug in it. All three mean the same app, so all three are
 * accepted and the short form comes back: apps.apple.com redirects a visitor
 * to their own storefront, and this app sells in six languages.
 */
export const appleStoreUrl = (input: string): string => {
  const id = input.match(/\d{8,}/)?.[0]
  if (!id) throw new Error(`Geen Apple ID gevonden in "${input}"`)
  return `https://apps.apple.com/app/id${id}`
}

/**
 * The Play address. Known long before the app is approved, because it is
 * nothing but the application id in a URL.
 */
export const playStoreUrl = (id: string = APP_ID): string =>
  `https://play.google.com/store/apps/details?id=${id}`

/**
 * De providercode van App Store Connect. Leeg tot hij is opgehaald.
 *
 * Dit is de enige waarde in dit bestand die niet te bedenken is. Apple zegt
 * het zelf: *"You must generate a campaign link in App Store Connect first to
 * obtain your provider token. You can't create one manually."* Hij hoort bij
 * het account, blijft daarna altijd hetzelfde, en staat in de link die de
 * console je geeft zodra je onder Analytics -> Acquisition -> Campaigns één
 * campagne aanmaakt.
 *
 * Zolang hij leeg is geeft `appleKanaalUrl` het gewone winkeladres terug --
 * dezelfde afspraak als `STORE` hierboven en `SHOP` in shop.ts: leeg betekent
 * nog niet klaar, en dan liever een link die werkt zonder meting dan een link
 * die meet en niet werkt.
 *
 * Zetten gaat met `npm run kanaallinks -- --pt <de code uit de console>`;
 * dat script schrijft hem hier en drukt daarna alle links af.
 */
export const PROVIDER_TOKEN = ''

/**
 * De kanalen waarvan we willen weten of ze iets opleveren.
 *
 * **Waarom er geen datum in de naam staat.** Apple laat een campagne pas zien
 * zodra er eerste-downloads van minstens vijf verschillende personen zijn, en
 * Google rolt kleine waarden op in een "Other"-emmer. Bij drie downloads per
 * dag haalt een naam met een week of een dag erin die drempel nooit, en dan
 * lijkt een kanaal dat wél werkt leeg. De tijdas zit al in beide dashboards;
 * die is gratis. Dus: een vaste naam per kanaal, en de periode lees je op de
 * as.
 *
 * Dat heeft een tweede voordeel dat zwaarder weegt dan het lijkt: elke
 * Apple-campagne moet met de hand in de console worden aangemaakt en er is
 * geen publieke API voor. Een vaste naam maak je één keer aan, voor altijd.
 *
 * **De tekenset** is de doorsnede van beide winkels: a-z, 0-9 en een
 * streepje. Apple staat veel meer toe -- spaties, `&`, `%`, `#` -- maar elk
 * van die tekens moet aan de Google-kant door een coderingslaag heen en maakt
 * de link onleesbaar voor wie hem met het oog controleert. En Apple's regel
 * dat een spatie niet vooraan of achteraan mag staan, wordt zo irrelevant.
 *
 * `source` en `medium` zijn alleen voor Google; Apple heeft één veld.
 */
export const KANALEN = {
  'fb-nl': { source: 'facebook', medium: 'groep', waar: 'Nederlandstalige Facebook-groepen' },
  'fb-fr': { source: 'facebook', medium: 'groep', waar: 'Franstalige Facebook-groepen' },
  whatsapp: { source: 'whatsapp', medium: 'kanaal', waar: 'het WhatsApp-kanaal en familiegroepen' },
  instagram: { source: 'instagram', medium: 'bio', waar: 'het linkveld in de Instagram-bio' },
  tiktok: { source: 'tiktok', medium: 'bio', waar: 'het linkveld in de TikTok-bio' },
  youtube: { source: 'youtube', medium: 'film', waar: 'onder de films op YouTube' },
  creator: { source: 'creator', medium: 'code', waar: 'de samenwerking met de creator-code' },
  mail: { source: 'mail', medium: 'brief', waar: 'de mail aan aangemelde ouders' },
  web: { source: 'website', medium: 'knop', waar: 'de winkelknoppen op darijaforkids.eu zelf' },
} as const

export type Kanaal = keyof typeof KANALEN

/** Wat Apple in een campagnenaam toestaat waar wij ons aan houden. */
export const KANAAL_MAX = 30

/**
 * Het Apple-adres met de campagnecode erachter.
 *
 * In Apple's eigen gedocumenteerde vorm, en dat is met opzet niet de korte
 * `/app/id<id>` die `appleStoreUrl` bouwt. Apple documenteert `ct` uitsluitend
 * op `/app/apple-store/id<id>`; of de parameter op de korte vorm meereist
 * staat nergens zwart op wit. `apple-store` is daarin een vaste tekst en niet
 * de naam van onze app, dus we leveren er niets voor in: nog steeds geen
 * landcode, nog steeds geen slug die kan verouderen.
 *
 * `mt=8` staat in elk voorbeeld van Apple en wordt door Apple nergens
 * uitgelegd. Hij gaat mee omdat alle officiële voorbeelden hem hebben, niet
 * omdat we weten wat hij doet.
 */
export const appleKanaalUrl = (kanaal: Kanaal, pt: string = PROVIDER_TOKEN, id: string = APPLE_ID): string => {
  if (!pt) return STORE.apple
  return `https://apps.apple.com/app/apple-store/id${id}?pt=${pt}&ct=${kanaal}&mt=8`
}

/**
 * Het Play-adres met de campagnecode erachter. Heeft geen code uit een console
 * nodig, dus deze werken vanaf vandaag.
 *
 * De utm-tekst gaat gecodeerd als *waarde* van `referrer`, en dat is geen
 * opsmuk: laat je de `&` ertussen onverpakt staan, dan ziet Play losse
 * queryparameters en breekt de verwijzing af bij de eerste. Dan krijgt de app
 * `utm_source=google-play&utm_medium=organic` terug in plaats van wat wij
 * erin zetten.
 */
export const playKanaalUrl = (kanaal: Kanaal, id: string = APP_ID): string => {
  const { source, medium } = KANALEN[kanaal]
  const referrer = `utm_source=${source}&utm_medium=${medium}&utm_campaign=${kanaal}`
  return `${playStoreUrl(id)}&referrer=${encodeURIComponent(referrer)}`
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
/**
 * Waar de worker antwoordt.
 *
 * De lezer praat hiermee: de sleutel gaat in de body van een verzoek en nooit
 * in een adres, want een adres komt in logboeken terecht.
 */
export const POST_URL = 'https://post.darijaforkids.eu'

/** De film zelf op YouTube, voor wie hem daar wil delen of liken. */
export const FILM_YOUTUBE = 'https://www.youtube.com/watch?v=3iHXGpubnaI'

export const SOCIAL: { naam: string; label: string; url: string }[] = [
  { naam: 'youtube', label: 'YouTube', url: 'https://www.youtube.com/@darijaforkidsapp' },
  { naam: 'instagram', label: 'Instagram', url: 'https://www.instagram.com/darijaforkidsapp/' },
  { naam: 'facebook', label: 'Facebook', url: 'https://www.facebook.com/profile.php?id=61594495868221' },
  { naam: 'tiktok', label: 'TikTok', url: 'https://www.tiktok.com/@darijaforkidsapp' },
]

export const PATHS: Record<Lang, { home: string; privacy: string; terms: string; parents: string; name: string; history: string; books: string; checkout: string; read: string; portal: string }> = {
  nl: { home: '/', privacy: '/privacy', terms: '/voorwaarden', parents: '/ouders', name: '/naam', history: '/geschiedenis', books: '/leesboeken', checkout: '/afrekenen', read: '/lezen', portal: '/portaal' },
  fr: { home: '/fr/', privacy: '/fr/confidentialite', terms: '/fr/conditions', parents: '/fr/parents', name: '/fr/prenom', history: '/fr/histoire', books: '/fr/livres', checkout: '/fr/paiement', read: '/fr/lire', portal: '/fr/portail' },
  de: { home: '/de/', privacy: '/de/datenschutz', terms: '/de/bedingungen', parents: '/de/eltern', name: '/de/name', history: '/de/geschichte', books: '/de/buecher', checkout: '/de/bezahlen', read: '/de/lesen', portal: '/de/portal' },
  es: { home: '/es/', privacy: '/es/privacidad', terms: '/es/condiciones', parents: '/es/padres', name: '/es/nombre', history: '/es/historia', books: '/es/libros', checkout: '/es/pago', read: '/es/leer', portal: '/es/portal' },
  it: { home: '/it/', privacy: '/it/privacy', terms: '/it/condizioni', parents: '/it/genitori', name: '/it/nome', history: '/it/storia', books: '/it/libri', checkout: '/it/pagamento', read: '/it/leggere', portal: '/it/portale' },
  en: { home: '/en/', privacy: '/en/privacy', terms: '/en/terms', parents: '/en/parents', name: '/en/name', history: '/en/history', books: '/en/books', checkout: '/en/checkout', read: '/en/read', portal: '/en/portal' },
}

/**
 * Waar de bladzijde van één reeks staat.
 *
 * Onder de boekenpagina, want dat is waar hij hoort: de kast staat op
 * `/leesboeken` en de reeks is een plank daarin. Dat maakt het adres ook
 * zelfverklarend — `/fr/livres/sleutels` zegt in welke taal en in welke kast
 * je staat, en een bezoeker die het laatste stuk weghaalt komt bij de kast
 * uit in plaats van bij een lege bladzijde.
 */
export const reeksPad = (lang: Lang, slug: string): string => `${PATHS[lang].books}/${slug}`
