/**
 * Wat de betaalpartner ons stuurt als er iets verkocht is.
 *
 * Gumroad heeft één veld voor een adres en verder niets: geen koppen om zelf
 * te vullen, geen handtekening, geen keuze in de opmaak. Wat er binnenkomt is
 * een gewone HTML-formulierpost met vijfentwintig velden, en het geheim moet
 * dus in het adres staan.
 *
 * Daarom staat dit los van `index.ts`: dit is het stuk waar een vergissing
 * eruitziet als diefstal. Iemand betaalt, er komt een melding binnen die we
 * niet begrijpen, en zijn bibliotheek blijft leeg. Zo'n stuk hoort een test
 * te hebben, en een test wil een functie zonder Worker eromheen.
 */

import { netjes } from './portaal'

/** Wat wij eruit halen. Alles wat Gumroad verder stuurt, laten we liggen. */
export type Koopbericht = {
  email: string
  reeksen: string[]
  taal: string
  naam?: string
  bestelnummer?: string
  /** Een proefmelding uit het instellingenscherm van de betaalpartner. */
  proef: boolean
  /** Verkocht, maar niets wat het portaal uitdeelt — het e-boek bijvoorbeeld. */
  genegeerd: string[]
}

/**
 * Welk product welke reeks opent.
 *
 * De sleutel is het laatste stuk van het adres van de productpagina:
 * `venshipper.gumroad.com/l/sleutels` wordt `sleutels`. Staat er `null`, dan
 * kennen we het product wél maar heeft het portaal er niets voor — het e-boek
 * is één pdf die Gumroad zelf aflevert, en daar hoort geen leeskamer bij.
 */
export const REEKS_VAN: Record<string, string | null> = {
  sleutels: 'sleutels',
  sbadeleeuw: 'sba',
  eboek: null,
}

/**
 * In welke taal de mail moet.
 *
 * Gumroad vraagt geen taal maar stuurt wel het land van de koper mee. Dat is
 * niet hetzelfde, en voor België is het ronduit een gok — maar een Fransman
 * die zijn sleutel in het Nederlands krijgt, denkt dat hij de verkeerde mail
 * heeft. Een gok die meestal klopt is beter dan Nederlands voor iedereen.
 */
const TAAL_VAN_LAND: Record<string, string> = {
  netherlands: 'nl', nederland: 'nl', belgium: 'nl', belgië: 'nl', belgique: 'nl',
  france: 'fr', frankrijk: 'fr', morocco: 'fr', maroc: 'fr', marokko: 'fr',
  luxembourg: 'fr', senegal: 'fr', algeria: 'fr', tunisia: 'fr',
  germany: 'de', deutschland: 'de', austria: 'de', switzerland: 'de',
  spain: 'es', españa: 'es', spanje: 'es', mexico: 'es', argentina: 'es',
  italy: 'it', italia: 'it', italië: 'it',
}

const TALEN = new Set(['nl', 'fr', 'de', 'es', 'it', 'en'])

export const taalVanLand = (land: string | undefined): string =>
  TAAL_VAN_LAND[(land ?? '').trim().toLowerCase()] ?? 'en'

/**
 * Het laatste stuk van een productadres.
 *
 * Gumroad stuurt zowel `permalink` (`sleutels`) als `product_permalink`
 * (`https://venshipper.gumroad.com/l/sleutels`), en welke van de twee er is
 * hangt af van hoe het product is aangemaakt. Beide leveren hier hetzelfde op.
 */
export const slugVan = (waarde: string): string => {
  const schoon = (waarde.trim().split(/[?#]/)[0] ?? '').replace(/\/+$/, '')
  const laatste = schoon.slice(schoon.lastIndexOf('/') + 1)
  return laatste.toLowerCase()
}

/**
 * De velden uit de body, wat voor soort body het ook is.
 *
 * Gumroad stuurt `application/x-www-form-urlencoded`. Onze eigen proeven met
 * `curl` sturen JSON. Allebei moeten werken, want anders is de enige manier om
 * dit te controleren: iets echt kopen.
 */
export const veldenVan = (contentType: string | null, ruw: string): Record<string, string> => {
  const soort = (contentType ?? '').toLowerCase()
  if (soort.includes('json')) {
    try {
      const o = JSON.parse(ruw)
      if (!o || typeof o !== 'object') return {}
      const uit: Record<string, string> = {}
      for (const [k, v] of Object.entries(o as Record<string, unknown>)) {
        uit[k] = Array.isArray(v) ? v.join(',') : String(v ?? '')
      }
      return uit
    } catch {
      return {}
    }
  }
  const uit: Record<string, string> = {}
  for (const [k, v] of new URLSearchParams(ruw)) uit[k] = v
  return uit
}

const ja = (waarde: string | undefined): boolean =>
  waarde !== undefined && waarde !== '' && waarde !== 'false' && waarde !== '0'

/**
 * Van vijfentwintig velden naar de vier die wij nodig hebben.
 *
 * Onze eigen opmaak (`{ email, reeksen: ['sba'] }`) blijft werken: daarmee is
 * de hele keten te beproeven zonder de betaalpartner erbij te halen.
 */
export const koopbericht = (velden: Record<string, string>): Koopbericht => {
  const email = netjes(velden.email ?? velden.purchaser_email ?? '')

  const genoemd = velden.reeksen
    ? velden.reeksen.split(',').map((r) => r.trim()).filter(Boolean)
    : [velden.product_permalink, velden.permalink, velden.short_product_id]
        .filter((v): v is string => Boolean(v))
        .map(slugVan)

  const reeksen: string[] = []
  const genegeerd: string[] = []
  for (const naam of genoemd) {
    // Onze eigen namen mogen er rechtstreeks in; die komen uit onze eigen post.
    if (naam === 'sba' || naam === 'sleutels') {
      if (!reeksen.includes(naam)) reeksen.push(naam)
      continue
    }
    if (!(naam in REEKS_VAN)) continue
    const reeks = REEKS_VAN[naam] ?? null
    if (reeks === null) genegeerd.push(naam)
    else if (!reeksen.includes(reeks)) reeksen.push(reeks)
  }

  const gevraagd = (velden.taal ?? '').trim().toLowerCase()
  const taal = TALEN.has(gevraagd) ? gevraagd : taalVanLand(velden.ip_country)

  const naam = (velden.naam ?? velden.full_name ?? '').trim()
  const bestelnummer = (velden.bestelnummer ?? velden.order_number ?? velden.sale_id ?? '').trim()

  return {
    email,
    reeksen,
    taal,
    naam: naam || undefined,
    bestelnummer: bestelnummer || undefined,
    proef: ja(velden.test),
    genegeerd,
  }
}

/**
 * Klopt het gedeelde geheim?
 *
 * Even lang vergelijken, ongeacht waar het misgaat. Een vergelijking die bij
 * het eerste verkeerde teken stopt, verraadt met zijn duur hoeveel er goed
 * was — en dit geheim beschermt een winkel.
 */
export const geheimKlopt = (gegeven: string | null | undefined, verwacht: string): boolean => {
  if (!verwacht || !gegeven) return false
  const a = new TextEncoder().encode(gegeven)
  const b = new TextEncoder().encode(verwacht)
  let verschil = a.length ^ b.length
  for (let i = 0; i < Math.max(a.length, b.length); i++) verschil |= (a[i] ?? 0) ^ (b[i] ?? 0)
  return verschil === 0
}
