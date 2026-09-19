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
