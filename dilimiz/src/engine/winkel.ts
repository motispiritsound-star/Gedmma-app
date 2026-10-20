import { MERK } from '../merk/merk'
import { winkelNagebootst } from './omgeving'

/**
 * De koppeling met de App Store en Google Play.
 *
 * Eén laag om `cordova-plugin-purchase` heen, met twee uitvoeringen: de echte,
 * die alleen in een native schil bestaat, en een nagebootste voor ontwikkelen
 * en testen. De rest van de app praat alleen met deze interface en weet niet
 * welke van de twee eronder zit.
 *
 * Dat is geen architectuurnetheid. Het betekent dat de koopstroom te
 * doorlopen is zonder telefoon en zonder echte afschrijving, en dat de
 * schermen getest kunnen worden op precies de gevallen die in het echt
 * misgaan: de winkel die niet antwoordt, een koop die de gebruiker afbreekt,
 * een abonnement dat verlopen is.
 *
 * LET OP: de echte uitvoering is op geen enkel toestel gedraaid. Zie
 * docs/lanceren.md §Wat ik niet heb kunnen testen.
 */

export interface WinkelProduct {
  product: string
  /** De prijs in de munt van de koper, zoals de winkel hem geeft. */
  prijs: string | null
  /** Of de winkel bij DIT product een proefperiode meldt. */
  heeftProef: boolean
  /** Hoeveel dagen, als de winkel dat zegt. */
  proefDagen: number | null
  /** Of dit abonnement op dit account loopt. */
  inBezit: boolean
}

export type KoopUitkomst =
  | { stand: 'gekocht'; metProef: boolean }
  | { stand: 'afgebroken' }
  | { stand: 'mislukt'; reden: string }
  | { stand: 'nietBeschikbaar' }

export interface Winkel {
  /** Verbinden en de producten ophalen. Mag meermaals aangeroepen worden. */
  start(): Promise<void>
  product(id: string): WinkelProduct | null
  koop(id: string): Promise<KoopUitkomst>
  /** Een eerdere aankoop terughalen. True als er iets gevonden is. */
  herstel(): Promise<boolean>
  /** Of er een winkel is om mee te praten. */
  beschikbaar(): boolean
}

/* ----------------------------------------------- de echte winkel */

/**
 * Het stukje `cordova-plugin-purchase` dat we gebruiken, als type.
 *
 * Met de hand opgeschreven in plaats van de typen van het pakket te
 * importeren: het pakket bestaat alleen in de native schil, en een import die
 * op het web niet bestaat laat de bouw omvallen.
 */
interface CdvProduct {
  id: string
  owned?: boolean
  pricing?: { price?: string }
  offers?: {
    pricingPhases?: { price?: string; billingPeriod?: string; paymentMode?: string }[]
  }[]
  getOffer?: () => { order: () => Promise<unknown> } | undefined
}

interface CdvStore {
  register: (producten: { id: string; type: string; platform: string }[]) => void
  initialize: (platforms: string[]) => Promise<unknown>
  get: (id: string) => CdvProduct | undefined
  restorePurchases: () => Promise<unknown>
  when: () => {
    approved: (fn: (t: { verify: () => void }) => void) => { verified: (fn: (r: { finish: () => void }) => void) => void }
  }
}

interface Cdv {
  store: CdvStore
  ProductType: { PAID_SUBSCRIPTION: string }
  Platform: { GOOGLE_PLAY: string; APPLE_APPSTORE: string }
}

const cdv = (): Cdv | null =>
  (globalThis as unknown as { CdvPurchase?: Cdv }).CdvPurchase ?? null

/**
 * De proefperiode uit de productgegevens lezen.
 *
 * Een aanbiedingsfase met `paymentMode: 'FreeTrial'` is wat beide winkels
 * terugmelden als er een proefperiode op staat. Staat die er niet, dan is er
 * er geen -- en dan hoort het scherm er niets over te zeggen.
 *
 * Dit is de duurste les uit de overdracht van de vorige app: daar beloofde het
 * scherm drie gratis dagen aan iedereen terwijl ze op het jaarplan niet waren
 * ingesteld. De winkel is de enige bron die daar gelijk in heeft.
 */
function proefUit(p: CdvProduct): { heeft: boolean; dagen: number | null } {
  for (const aanbod of p.offers ?? []) {
    for (const fase of aanbod.pricingPhases ?? []) {
      if (fase.paymentMode === 'FreeTrial') {
        return { heeft: true, dagen: dagenUit(fase.billingPeriod) }
      }
    }
  }
  return { heeft: false, dagen: null }
}

/** ISO-8601-duur naar dagen: `P3D` -> 3, `P1W` -> 7, `P1M` -> 30. */
export function dagenUit(duur: string | undefined): number | null {
  if (!duur) return null
  const m = /^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)W)?(?:(\d+)D)?$/.exec(duur)
  if (!m) return null
  const [, jaar, maand, week, dag] = m
  const totaal =
    Number(jaar ?? 0) * 365 + Number(maand ?? 0) * 30 + Number(week ?? 0) * 7 + Number(dag ?? 0)
  return totaal > 0 ? totaal : null
}

function echteWinkel(): Winkel {
  let gestart = false

  const lees = (id: string): WinkelProduct | null => {
    const p = cdv()?.store.get(id)
    if (!p) return null
    const proef = proefUit(p)
    return {
      product: id,
      prijs: p.pricing?.price ?? p.offers?.[0]?.pricingPhases?.at(-1)?.price ?? null,
      heeftProef: proef.heeft,
      proefDagen: proef.dagen,
      inBezit: p.owned === true,
    }
  }

  return {
    beschikbaar: () => cdv() !== null,

    async start() {
      const c = cdv()
      if (!c || gestart) return
      gestart = true
      c.store.register([{
        id: MERK.abonnement.maand,
        type: c.ProductType.PAID_SUBSCRIPTION,
        platform: c.Platform.GOOGLE_PLAY,
      }])
      // Een goedgekeurde koop moet bevestigd worden, anders draait de winkel
      // hem na drie dagen terug. Dit is de hele verificatieketen: er is geen
      // server, dus wordt er lokaal afgehandeld.
      c.store.when().approved((t) => t.verify()).verified((r) => r.finish())
      await c.store.initialize([c.Platform.GOOGLE_PLAY])
    },

    product: lees,

    async koop(id) {
      const c = cdv()
      if (!c) return { stand: 'nietBeschikbaar' }
      const p = c.store.get(id)
      const aanbod = p?.getOffer?.()
      if (!aanbod) return { stand: 'nietBeschikbaar' }
      // Vóór het bestellen vastleggen of er een proefperiode bij zat: zodra de
      // koop rond is, laat de winkel de aanbieding bij dat product weg.
      const metProef = proefUit(p!).heeft
      try {
        await aanbod.order()
        return { stand: 'gekocht', metProef }
      } catch (fout) {
        const tekst = fout instanceof Error ? fout.message : String(fout)
        if (/cancel/i.test(tekst)) return { stand: 'afgebroken' }
        return { stand: 'mislukt', reden: tekst }
      }
    },

    async herstel() {
      const c = cdv()
      if (!c) return false
      await c.store.restorePurchases()
      return c.store.get(MERK.abonnement.maand)?.owned === true
    },
  }
}

/* ------------------------------------------- de nagebootste winkel */

/**
 * Voor ontwikkelen en testen.
 *
 * Met opzet géén proefperiode: zo is de stand waarmee gelanceerd wordt ook de
 * stand waarin ontwikkeld wordt. Wie een proef wil toetsen, zet hem hier aan
 * en ziet meteen of het scherm hem goed meldt.
 */
export function nagebootsteWinkel(keuzes: {
  prijs?: string
  heeftProef?: boolean
  proefDagen?: number | null
  beschikbaar?: boolean
  faalt?: boolean
} = {}): Winkel {
  const {
    prijs = '€ 5,99',
    heeftProef = false,
    proefDagen = null,
    beschikbaar = true,
    faalt = false,
  } = keuzes
  let bezit = false

  return {
    beschikbaar: () => beschikbaar,
    async start() { /* niets te verbinden */ },
    product: (id) => (beschikbaar && id === MERK.abonnement.maand
      ? { product: id, prijs, heeftProef, proefDagen, inBezit: bezit }
      : null),
    async koop(id) {
      if (!beschikbaar || id !== MERK.abonnement.maand) return { stand: 'nietBeschikbaar' }
      if (faalt) return { stand: 'mislukt', reden: 'nagebootste fout' }
      bezit = true
      return { stand: 'gekocht', metProef: heeftProef }
    },
    async herstel() { return bezit },
  }
}

/* ------------------------------------------------------- de keuze */

let huidig: Winkel | null = null

/** De winkel voor deze omgeving. Echt in productie, nagebootst daarbuiten. */
export function winkel(): Winkel {
  if (!huidig) huidig = winkelNagebootst() ? nagebootsteWinkel() : echteWinkel()
  return huidig
}

/** Alleen voor tests: zet er een andere winkel onder. */
export function _zetWinkelVoorTest(w: Winkel | null): void {
  huidig = w
}
