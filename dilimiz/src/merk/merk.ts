/**
 * Het merk, op één plek.
 *
 * De naam van de app staat nog niet vast — zie docs/brand-brief.md voor de
 * richtingen en docs/decisions.md B-2 voor wat er nog beslist moet worden.
 * Tot die tijd is `naam` een plaatshouder.
 *
 * Dit bestand bestaat omdat in de referentie-app de merknaam in 267 bestanden
 * staat, en de overdracht daar expliciet voor waarschuwt: "een zoek-en-vervang
 * doe je één keer goed of drie keer half." Hier is hernoemen één bestand.
 *
 * Interfaceteksten gebruiken daarom `{naam}` als plaatshouder en nooit de naam
 * zelf. `merk.test.ts` faalt als er een letterlijke merknaam in src/i18n/ of
 * src/content/ opduikt.
 */

/** De plaatshouder zoals die in documentatie staat. Verdwijnt bij de naamkeuze. */
export const Dilimiz = 'Dilimiz'

export interface Merk {
  /** Wat op het scherm staat. Nu een plaatshouder. */
  naam: string
  /** De regel eronder, in de winkel en op het welkomstscherm. Per taal in i18n. */
  sleutelwoord: string
  /** De app-id in beide winkels. Moet gelijk zijn aan capacitor.config.ts. */
  appId: string
  /** De naam van de native app, gelijk aan capacitor.config.ts. */
  appNaam: string
  /** Nog te kiezen. Leeg betekent: er is nog geen website. */
  domein: string
  /** De winkelproducten. Nieuw aangemaakt, niets hergebruikt. */
  abonnement: { jaar: string; maand: string }
  /** Het Apple-id van de app, zodra die bestaat. Leeg tot dan. */
  appleId: string
  /** De sleutel waaronder de voortgang op het toestel staat. */
  opslagSleutel: string
}

export const MERK: Merk = {
  naam: 'Dilimiz',
  sleutelwoord: 'turks-voor-kinderen',
  appId: 'app.dilimiz.learn',
  appNaam: 'Dilimiz',
  // Nog niet vastgelegd. Leeg en niet een gok: een link naar een domein dat
  // niet bestaat is erger dan geen link, en de winkels controleren erop.
  domein: '',
  abonnement: {
    jaar: 'app.dilimiz.yearly',
    maand: 'app.dilimiz.monthly',
  },
  appleId: '',
  opslagSleutel: 'dilimiz.v1',
}

/**
 * Wat de naam betekent, voor het welkomstscherm en de winkelvermelding.
 *
 * `Dilimiz` is Turks voor "onze taal". Dat is iets om uit te leggen en niet om
 * te laten raden: een Nederlandse of Duitse ouder leest het woord niet, en de
 * uitleg is precies de belofte van de app.
 *
 * Het staat hier en niet in i18n/, omdat het over de naam gaat en niet over de
 * interface — maar de vertalingen ervan staan wél in i18n/, bij `merk.uitleg`.
 */
export const NAAM_BETEKENIS_TR = 'dilimiz'

/**
 * De merknaam in een interfacetekst zetten.
 *
 * Teksten schrijven `{naam}`; dit vult hem in. Zo staat de naam ook na de
 * naamkeuze nergens in een vertaling, en hoeven de vier taalbestanden niet
 * opnieuw langs een vertaler.
 */
export const merknaam = (tekst: string): string => tekst.replaceAll('{naam}', MERK.naam)

/**
 * De merknamen die hier níet mogen voorkomen.
 *
 * Deze app is gebouwd op de techniek van Darijaforkids maar is een eigen
 * product: geen naam, geen logo, geen tekst en geen kleur komt mee. Dit is de
 * lijst waar `merk.test.ts` en `kleuren.test.ts` op controleren, zodat het
 * een meting is en geen belofte.
 */
export const VERBODEN_NAMEN = ['darijaforkids', 'darija', 'gedmma', 'sba', 'khatim', 'zellige'] as const

/**
 * Of een tekst een van die namen bevat, op woordgrenzen.
 *
 * Woordgrenzen en niet "komt er in voor", en dat is geen netheid maar
 * noodzaak: `sba` zit in het Duitse `lesbare`, en een controle die daarop
 * afgaat meldt een merkinbreuk in de regel "leichter lesbare Schrift". Een
 * test die onterecht faalt wordt uitgezet, en dan bewaakt hij niets meer.
 *
 * Geeft de naam terug die gevonden is, of null.
 */
export function noemtVerbodenNaam(tekst: string): string | null {
  const klein = tekst.toLowerCase()
  for (const naam of VERBODEN_NAMEN) {
    if (new RegExp(`\\b${naam}\\b`).test(klein)) return naam
  }
  return null
}
