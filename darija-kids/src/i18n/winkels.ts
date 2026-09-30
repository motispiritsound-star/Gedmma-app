import { winkelVan, type Winkel } from '../engine/platform'
import type { Lang } from './languages'

/**
 * De naam van de winkel en van het bedrijf erachter — alleen die van het
 * platform waar de app op dat moment draait.
 *
 * Apple wees versie 1.0 (build 5) af op richtlijn 2.3.10:
 *
 *   "Make sure your app is focused on the experience of the Apple platforms it
 *    supports, and don't include names, icons, or imagery of other mobile
 *    platforms or alternative app marketplaces in your app or metadata, unless
 *    there is specific, approved interactive functionality."
 *
 * "in your app" is de helft die makkelijk over het hoofd wordt gezien. Ze
 * noemden de winkelbeschrijving, maar dezelfde namen stonden op het koopscherm,
 * het ouderscherm, in de privacyverklaring en in de voorwaarden. Op iOS mag
 * Google Play daar nergens staan, en op Android is de App Store net zo
 * misplaatst — niet vanwege een regel, maar omdat het niet waar is: wie op
 * Android betaalt, betaalt niet via Apple.
 *
 * Op het web is niet te weten waar iemand betaalt. Daar staan ze allebei, want
 * daar is één winkel noemen onvolledig in plaats van veilig.
 *
 * De vorm hoort bij de zin, niet bij de winkel. Duits heeft "über den App
 * Store" maar "im App Store oder bei Google Play", en Nederlands krijgt met
 * "App Store of Google Play-account" een koppelteken dat alleen de laatste
 * winkel pakt. Daarom staat het voorzetsel of het lidwoord hier in de naam en
 * niet in de zin.
 */
export interface Winkelnamen {
  /** De winkel als kanaal waar het geld door loopt: "loopt via …". */
  via: string
  /** De winkel om de app uit te halen: "download je de app uit …". */
  download: string
  /** Het winkelaccount van de koper: "afgeschreven via …". */
  account: string
  /** De winkel als kopje boven een stuk tekst, met een hoofdletter. */
  kop: string
  /** Het bedrijf, in een opsomming met "of": "niet tussen jou en …". */
  bedrijfOf: string
  /** Het bedrijf, in een opsomming met "en" — en als kopje boven een stuk. */
  bedrijfEn: string
  /**
   * Of Apple een van de winkels is. Schedule 2 van de Apple Developer Program
   * License Agreement eist een clausule die Apple bij naam noemt: Apple is geen
   * partij bij de overeenkomst, maar mag hem wel tegenover de koper inroepen.
   * Op Android hoort die clausule er niet — daar is Apple niets.
   */
  metApple: boolean
}

const TABEL: Record<Lang, Record<Winkel, Winkelnamen>> = {
  nl: {
    ios: {
      kop: 'De App Store',
      via: 'de App Store', download: 'de App Store', account: 'je App Store-account',
      metApple: true,
      bedrijfOf: 'Apple', bedrijfEn: 'Apple',
    },
    android: {
      kop: 'Google Play',
      via: 'Google Play', download: 'Google Play', account: 'je Google Play-account',
      metApple: false,
      bedrijfOf: 'Google', bedrijfEn: 'Google',
    },
    beide: {
      kop: 'De app-winkels',
      via: 'de App Store of Google Play', download: 'de App Store of Google Play',
      metApple: true,
      account: 'je account bij de App Store of bij Google Play',
      bedrijfOf: 'Apple of Google', bedrijfEn: 'Apple en Google',
    },
  },
  fr: {
    ios: {
      kop: 'L’App Store',
      via: 'l’App Store', download: 'l’App Store', account: 'ton compte App Store',
      metApple: true,
      bedrijfOf: 'Apple', bedrijfEn: 'Apple',
    },
    android: {
      kop: 'Google Play',
      via: 'Google Play', download: 'Google Play', account: 'ton compte Google Play',
      metApple: false,
      bedrijfOf: 'Google', bedrijfEn: 'Google',
    },
    beide: {
      kop: 'Les magasins d’applications',
      via: 'l’App Store ou Google Play', download: 'l’App Store ou Google Play',
      metApple: true,
      account: 'ton compte App Store ou Google Play',
      bedrijfOf: 'Apple ou Google', bedrijfEn: 'Apple et Google',
    },
  },
  de: {
    ios: {
      kop: 'Der App Store',
      via: 'den App Store', download: 'im App Store', account: 'dein App-Store-Konto',
      metApple: true,
      bedrijfOf: 'Apple', bedrijfEn: 'Apple',
    },
    android: {
      kop: 'Google Play',
      via: 'Google Play', download: 'bei Google Play', account: 'dein Google-Play-Konto',
      metApple: false,
      bedrijfOf: 'Google', bedrijfEn: 'Google',
    },
    beide: {
      kop: 'Die App-Stores',
      via: 'den App Store oder Google Play', download: 'im App Store oder bei Google Play',
      metApple: true,
      account: 'dein Konto im App Store oder bei Google Play',
      bedrijfOf: 'Apple oder Google', bedrijfEn: 'Apple und Google',
    },
  },
  es: {
    ios: {
      kop: 'La App Store',
      via: 'la App Store', download: 'la App Store', account: 'tu cuenta de la App Store',
      metApple: true,
      bedrijfOf: 'Apple', bedrijfEn: 'Apple',
    },
    android: {
      kop: 'Google Play',
      via: 'Google Play', download: 'Google Play', account: 'tu cuenta de Google Play',
      metApple: false,
      bedrijfOf: 'Google', bedrijfEn: 'Google',
    },
    beide: {
      kop: 'Las tiendas de aplicaciones',
      via: 'la App Store o Google Play', download: 'la App Store o en Google Play',
      metApple: true,
      account: 'tu cuenta de la App Store o de Google Play',
      bedrijfOf: 'Apple o Google', bedrijfEn: 'Apple y Google',
    },
  },
  it: {
    ios: {
      kop: 'L’App Store',
      via: 'dall’App Store', download: 'dall’App Store', account: 'il tuo account App Store',
      metApple: true,
      bedrijfOf: 'Apple', bedrijfEn: 'Apple',
    },
    android: {
      kop: 'Google Play',
      via: 'da Google Play', download: 'da Google Play', account: 'il tuo account Google Play',
      metApple: false,
      bedrijfOf: 'Google', bedrijfEn: 'Google',
    },
    beide: {
      kop: 'Gli store di app',
      via: 'dall’App Store o da Google Play', download: 'dall’App Store o da Google Play',
      metApple: true,
      account: 'il tuo account App Store o Google Play',
      bedrijfOf: 'Apple o Google', bedrijfEn: 'Apple e Google',
    },
  },
  en: {
    ios: {
      kop: 'The App Store',
      via: 'the App Store', download: 'the App Store', account: 'your App Store account',
      metApple: true,
      bedrijfOf: 'Apple', bedrijfEn: 'Apple',
    },
    android: {
      kop: 'Google Play',
      via: 'Google Play', download: 'Google Play', account: 'your Google Play account',
      metApple: false,
      bedrijfOf: 'Google', bedrijfEn: 'Google',
    },
    beide: {
      kop: 'The app stores',
      via: 'the App Store or Google Play', download: 'the App Store or Google Play',
      metApple: true,
      account: 'your App Store or Google Play account',
      bedrijfOf: 'Apple or Google', bedrijfEn: 'Apple and Google',
    },
  },
}

/** De namen zoals ze in deze taal en op dit platform in een zin horen. */
export const winkelnamen = (lang: Lang): Winkelnamen => TABEL[lang][winkelVan()]

/** Dezelfde tabel, voor een test die alle drie de platforms wil nalopen. */
export const winkelnamenVoor = (lang: Lang, winkel: Winkel): Winkelnamen => TABEL[lang][winkel]
