import { useStaat } from '../engine/opslag'
import { nl, type Teksten } from './nl'
import { de } from './de'
import { fr } from './fr'
import { en } from './en'
import type { Taal } from './talen'
import { MERK, merknaam } from '../merk/merk'

export type { Teksten } from './nl'
export * from './talen'

export const TEKSTEN: Record<Taal, Teksten> = { nl, de, fr, en }

/** De interfaceteksten in de taal die de leerling koos. */
export function useT(): Teksten {
  const taal = useStaat((s) => s.instellingen.taal)
  return TEKSTEN[taal]
}

export function useTaal(): Taal {
  return useStaat((s) => s.instellingen.taal)
}

/**
 * Plaatshouders in een tekst invullen.
 *
 * `vul(t.abonnement.proef, { dagen: 3, prijs: '€ 59,99' })`
 *
 * Teksten bevatten `{naam}` voor de merknaam, en soms `{dagen}`, `{prijs}`,
 * `{gratis}` of `{winkel}`. De merknaam gaat altijd mee, zodat geen enkele
 * vertaling hem letterlijk hoeft te bevatten.
 */
export function vul(tekst: string, waarden: Record<string, string | number> = {}): string {
  let uit = merknaam(tekst)
  for (const [sleutel, waarde] of Object.entries(waarden)) {
    uit = uit.replaceAll(`{${sleutel}}`, String(waarde))
  }
  return uit
}

/** De merknaam zelf, voor waar hij los staat. */
export const APPNAAM = MERK.naam
