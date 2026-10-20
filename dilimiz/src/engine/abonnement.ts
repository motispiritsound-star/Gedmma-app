import { MERK } from '../merk/merk'
import type { WinkelProduct } from './winkel'
import { haalStaat, useStaat, zetStaat } from './opslag'

/**
 * Het abonnement, via de App Store en Google Play.
 *
 * De eerste lessen zijn voor altijd gratis; alles daarna hoort bij een lopend
 * abonnement. Apple en Google innen de betaling, rekenen de btw, regelen de
 * proefperiode en de verlenging. Niets over een betaalmiddel komt ooit in deze
 * app, en dat is de reden dat dit bestand kort is.
 *
 * Er is GEEN eigen betaalpagina en er komt er geen. Dat is geen principe maar
 * een winkeleis, en bovendien de enige weg waarop herstel van aankopen en
 * opzeggen werken zoals een koper verwacht.
 *
 * LET OP -- de duurste les uit de overdracht van de vorige app: zet de
 * proefperiode in BEIDE consoles op BEIDE plannen. Daar stond hij wekenlang
 * alleen op het maandplan terwijl het scherm hem aan iedereen beloofde.
 * `belooftNietsOnwaars()` hieronder controleert dat het scherm niets zegt wat
 * niet in de productgegevens van de winkel staat -- maar geen test in deze app
 * kan zien wat er in de Play Console is ingevuld. Zie docs/decisions.md B-6.
 */

export type PlanId = 'maand'

export interface Plan {
  id: PlanId
  /** Het product-id in beide winkels. Nieuw aangemaakt, niets hergebruikt. */
  product: string
  /**
   * De prijs die de app noemt als de winkel niet te vragen is.
   *
   * In de app zelf komt de prijs altijd uit de winkel: in de munt van de
   * koper en inclusief zijn btw. Een Duitse koper ziet € 5,99 met 19% MwSt
   * erin verwerkt, en dat getal rekent Google uit, niet wij.
   */
  lijst: string
}

/**
 * Eén plan: maandelijks, € 5,99, maandelijks opzegbaar.
 *
 * Geen jaarplan bij de lancering. Dat is geen prijsstrategie maar een
 * lanceerkeuze: elk extra product is een product dat in beide consoles
 * aangemaakt, geprijsd en nagekeken moet worden, en de proefperiode-fout uit
 * de vorige app ontstond juist doordat twee plannen niet gelijk stonden.
 *
 * Een jaarplan erbij is later één regel hier, één id in merk.ts en één product
 * in de console.
 */
export const PLANNEN: Plan[] = [
  { id: 'maand', product: MERK.abonnement.maand, lijst: '€ 5,99' },
]

export const planVan = (_id: PlanId = 'maand'): Plan => PLANNEN[0]!

/** Het ene plan waarmee gelanceerd wordt. */
export const HET_PLAN: Plan = PLANNEN[0]!

/**
 * De proefperiode in dagen, als terugval.
 *
 * Bij de lancering staat er GEEN proefperiode op het product: de vier gratis
 * lessen zijn het proberen, en een proefperiode is een extra ding dat in de
 * console goed moet staan voordat er betaald verkeer op komt.
 *
 * Dit getal wordt alleen gebruikt als de winkel wél een proef meldt maar er
 * geen aantal dagen bij geeft. Zet er later een proefperiode op en de app
 * past zich vanzelf aan -- er hoeft geen regel code voor te veranderen, want
 * het scherm leest de winkel en niet dit bestand.
 */
export const PROEFDAGEN = 3

/* Wat de winkel terugmeldt, staat in winkel.ts. */
export type { WinkelProduct } from './winkel'

/**
 * Of het scherm mag zeggen dat er een proefperiode is.
 *
 * Alleen als de winkel dat bij dit product ook zegt. Dit is de controle die
 * bij de vorige app ontbrak: het scherm beloofde drie gratis dagen aan
 * iedereen, en op het jaarplan stonden ze niet.
 *
 * Geen winkelgegevens (het web, of de winkel antwoordt niet): dan belooft het
 * scherm niets. Zwijgen is beter dan een belofte die niet nagekomen wordt.
 */
export function belooftNietsOnwaars(product: WinkelProduct | null): boolean {
  return product?.heeftProef === true
}

/** Hoeveel proefdagen het scherm mag noemen: wat de winkel zegt, of niets. */
export function proefDagenOpScherm(product: WinkelProduct | null): number | null {
  if (!belooftNietsOnwaars(product)) return null
  return product!.proefDagen ?? PROEFDAGEN
}

export type Winkelstand = 'onbekend' | 'bezig' | 'gereed' | 'nietBeschikbaar' | 'mislukt'

/* --------------------------------------------------------- de levensloop */

/**
 * Een koop vastleggen.
 *
 * `proefGestart` wordt hier gezet en niet later uit de winkel afgeleid, want
 * zodra de koop rond is laat de winkel de aanbieding bij dat product weg.
 * Zonder dit zou het welkomstscherm ná het betalen tegen iedereen zeggen dat
 * de eerste dagen gratis waren -- ook tegen wie meteen is afgeschreven.
 */
export function legKoopVast(plan: PlanId, metProef: boolean, nu = Date.now()): void {
  zetStaat({
    abonnement: {
      actief: true,
      sinds: nu,
      proefGestart: metProef ? nu : 0,
      plan,
    },
  })
}

/** Een verlopen of opgezegd abonnement. De gratis lessen blijven open. */
export function legVerlopenVast(): void {
  zetStaat((s) => ({ abonnement: { ...s.abonnement, actief: false } }))
}

/** Of de proefperiode nog loopt, en hoeveel dagen er nog van over zijn. */
export function proefRest(nu = Date.now()): number {
  const { proefGestart } = haalStaat().abonnement
  if (!proefGestart) return 0
  const verstreken = (nu - proefGestart) / 86_400_000
  return Math.max(0, Math.ceil(PROEFDAGEN - verstreken))
}

export const inProef = (nu = Date.now()): boolean => proefRest(nu) > 0

export function useAbonnement() {
  return useStaat((s) => s.abonnement)
}

/**
 * Welke winkel dit is, voor de regel "de betaling loopt via …".
 *
 * Uit de omgeving en niet uit het toestelmerk: een iPad die in een browser
 * staat is geen App Store-aankoop.
 */
export function winkelNaam(platform: 'ios' | 'android' | 'web'): string {
  return { ios: 'App Store', android: 'Google Play', web: '' }[platform]
}

/**
 * Op welk platform de app draait.
 *
 * Uit de user agent en niet uit het toestelmerk: een iPad die de app in een
 * browser opent is geen App Store-aankoop, en dan hoort er "kopen kan alleen
 * in de app" te staan.
 */
export function platformNu(): 'ios' | 'android' | 'web' {
  if (typeof navigator === 'undefined') return 'web'
  const cap = (globalThis as unknown as { Capacitor?: { getPlatform?: () => string } }).Capacitor
  const p = cap?.getPlatform?.()
  return p === 'ios' || p === 'android' ? p : 'web'
}

/**
 * Wat het scherm vóór de koopknop moet zeggen.
 *
 * Alle vier de dingen, en in deze volgorde: prijs, proefduur, verlenging,
 * opzeggen. Dat is een winkeleis van beide partijen én het eerlijke minimum.
 * De functie bestaat zodat een test kan nameten dat er niets ontbreekt.
 */
export interface KoopRegels {
  prijs: string
  proefDagen: number | null
  verlengtAutomatisch: boolean
  opzeggenUitgelegd: boolean
}

export function koopRegels(plan: Plan, winkel: WinkelProduct | null): KoopRegels {
  return {
    // De prijs van de winkel gaat voor: die staat in de munt van de koper en
    // inclusief zijn btw. De lijstprijs is alleen de terugval.
    prijs: winkel?.prijs ?? plan.lijst,
    proefDagen: proefDagenOpScherm(winkel),
    verlengtAutomatisch: true,
    opzeggenUitgelegd: true,
  }
}
