/**
 * Waar de app op draait, en wat dat betekent voor wat we beloven.
 *
 * De app is één build voor drie plekken: de App Store, Google Play en het
 * web. Meestal maakt dat niets uit — hij bundelt alles en praat met niemand —
 * maar bij het abonnement wel, want de twee winkels delen een aankoop niet op
 * dezelfde manier met een gezin.
 *
 * Capacitor zet zichzelf op `window`; we importeren `@capacitor/core` hier
 * niet, net als in `main.tsx`, zodat de webbuild niets van de native laag
 * meeneemt.
 */

type CapacitorGlobal = { getPlatform?: () => string }

export type Platform = 'ios' | 'android' | 'web'

export const platform = (): Platform => {
  // `make-site.mjs` bouwt de website met Node, en daar bestaat geen `window`.
  // Dat is geen uitzondering die weggewerkt wordt: de generator maakt
  // webpagina's, dus 'web' is precies het antwoord. Zonder deze regel valt de
  // sitebuild om met "window is not defined" zodra een tekst de winkelnaam
  // opvraagt — nagemeten toen privacy.ts die ging gebruiken.
  if (typeof window === 'undefined') return 'web'
  const naam = (window as { Capacitor?: CapacitorGlobal }).Capacitor?.getPlatform?.()
  return naam === 'ios' || naam === 'android' ? naam : 'web'
}

/**
 * Of één abonnement voor het hele gezin geldt.
 *
 * Apple heeft Family Sharing: de ouder koopt, en tot zes gezinsleden met een
 * eigen Apple-account komen erin. Google Play kent dat voor abonnementen niet
 * — de Gezinsbibliotheek werkt daar voor apps en eenmalige aankopen, maar niet
 * voor een abonnement. Op Android geldt het abonnement dus voor het
 * Google-account dat het afsluit, en een kind met een eigen account via Family
 * Link valt erbuiten.
 *
 * Dat is een verschil dat je niet mag gladstrijken: het staat op het scherm
 * waar iemand besluit te betalen.
 */
export const gezinsdeling = (): boolean => platform() === 'ios'

/**
 * Hoe de winkel heet waar deze app vandaan komt.
 *
 * Apple wees de App Store-beschrijving af op richtlijn 2.3.10 omdat er Google
 * Play in stond: *"information about third-party platforms that may not be
 * relevant for App Store users."* Dezelfde zin stond in de app, op het scherm
 * waar iemand besluit te betalen — *afgeschreven via je App Store- of Google
 * Play-account*. Dat is dezelfde regel, op de plek die een beoordelaar het
 * beste bekijkt.
 *
 * Op het web verkoopt de app niets, en daar weet je niet waar de lezer straks
 * koopt. Daar staan ze dus allebei, en de vertaling bepaalt hoe je die twee
 * aan elkaar plakt — "of", "or", "o", "oder".
 */
export type Winkel = 'ios' | 'android' | 'beide'

export const winkelVan = (): Winkel => {
  const p = platform()
  return p === 'ios' ? 'ios' : p === 'android' ? 'android' : 'beide'
}
