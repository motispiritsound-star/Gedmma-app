/**
 * De drie reeksen in de boekenkast, en waar ze op de site staan.
 *
 * De boekenpagina was één lange bladzijde met beide reeksen eronder elkaar:
 * de plaat, de tekst, de opsomming, de prijs, en daaronder een dichtgeklapte
 * lijst met de delen. Dat werkt voor wie al weet wat hij zoekt, en voor
 * niemand anders — de titels van de delen stonden achter een klik, en wat een
 * deel is zag je nergens.
 *
 * Dus: de boekenpagina is de kast, en elke reeks heeft zijn eigen bladzijde.
 * Daar staat waar de reeks over gaat en wat er in elk deel gebeurt, met de
 * omslag erbij waar er een is.
 *
 * Het laatste stuk van het adres is in elke taal hetzelfde woord. Dat is geen
 * luiheid maar een keuze: `sba` en `sleutels` zijn namen uit de boeken en geen
 * Nederlands, en het pad ervóór is al vertaald (`/leesboeken`, `/fr/livres`,
 * `/de/buecher`). Een vertaalde slug zou alleen de adressen uit elkaar laten
 * lopen zonder dat een lezer er iets aan heeft.
 */

export type ReeksId = 'sba' | 'sleutels' | 'marokko360'

/** Welke sleutel in `shop.ts` bij deze reeks hoort. `null` = niets te koop. */
export type Koopsleutel = 'sbaReeks' | 'sleutelsReeks' | null

export interface Reeksplek {
  id: ReeksId
  /** Het laatste stuk van het adres, in elke taal hetzelfde. */
  slug: string
  koop: Koopsleutel
  /**
   * De map onder `site-assets/reeks/` met de omslagen per deel, of `null`
   * zolang er geen omslagen zijn. De encyclopedie heeft er geen: daar is nog
   * geen deel geschreven, en een omslag bij een leeg boek is een belofte.
   */
  platen: string | null
}

export const REEKSEN: Reeksplek[] = [
  { id: 'sba', slug: 'sba', koop: 'sbaReeks', platen: 'sba' },
  { id: 'sleutels', slug: 'sleutels', koop: 'sleutelsReeks', platen: 'sleutels' },
  { id: 'marokko360', slug: 'marokko-360', koop: null, platen: null },
]

export const reeksVan = (id: string): Reeksplek | undefined =>
  REEKSEN.find((r) => r.id === id)
