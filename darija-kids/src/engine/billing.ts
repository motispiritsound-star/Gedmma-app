import { useSyncExternalStore } from 'react'
import { FREE_LESSONS, getState, setState } from './store'

/**
 * The subscription, through the App Store and Google Play.
 *
 * The first units are free forever; everything past them needs a running
 * subscription. Apple and Google take the payment, charge the VAT, handle the
 * free trial and the monthly renewal, and pay out to the publisher — nothing
 * about a card ever reaches this app, which is why this file is short.
 *
 * The plugin (cordova-plugin-purchase) only exists inside the native shells.
 * On the web there is nothing to buy, so everything degrades to "not
 * available" rather than breaking.
 */

/**
 * The two ways to pay, as two products.
 *
 * A year up front is the offer: it works out at a third less per month, and it
 * is the plan that suits this app, because a language is not learned in six
 * weeks. The monthly plan stays for anyone who wants to try a season first.
 *
 * Create both ids exactly as written here, in App Store Connect and in the
 * Play Console — in the same subscription group, so a buyer can move between
 * them without paying twice.
 */
export type PlanId = 'jaar' | 'maand'

export interface Plan {
  id: PlanId
  /** The product id in both stores. */
  product: string
  /** The fallback price for the website, where no store can be asked. */
  list: string
  /** What it comes down to per month, for the line under the price. */
  perMonth: string
  /** Set on the plan the screen should lead with. */
  best?: boolean
}

export const PLANS: Plan[] = [
  { id: 'jaar', product: 'app.darijaforkids.yearly', list: '€ 59,99', perMonth: '€ 5,00', best: true },
  { id: 'maand', product: 'app.darijaforkids.monthly', list: '€ 6,99', perMonth: '€ 6,99' },
]

export const planOf = (id: PlanId): Plan => PLANS.find((p) => p.id === id) ?? PLANS[0]!

/** Every subscription the app knows how to sell. */
export const PRODUCTS = PLANS.map((p) => p.product)

/**
 * The e-book: the whole course on paper, bought once and kept.
 *
 * It comes with the year up front — a buyer who pays for a year does not pay
 * for it twice — and is sold on its own to anyone paying by the month. A
 * one-off, not a subscription, so it is a non-consumable in both stores.
 *
 * Create this id too, as a one-time purchase rather than a subscription.
 */
export const EBOOK = {
  product: 'app.darijaforkids.ebook',
  /** The fallback price for the website, where no store can be asked. */
  list: '€ 14,99',
}

/** Where the book itself lives, per language of the app. */
export const ebookFile = (lang: string): string => `ebook/darijaforkids-${lang}.pdf`

/**
 * The free trial, in days. Three is both the chosen length and the shortest
 * either store offers, so there is no reason to go lower.
 *
 * This number is only wording: the real trial lives in the store product, and
 * the two have to say the same thing.
 */
export const TRIAL_DAYS = 3

/**
 * What the app quotes when it cannot ask a store — the website, mostly. Inside
 * the app the price always comes from the store itself, in the buyer's own
 * currency and including their VAT.
 */
export const LIST_PRICE = planOf('maand').list

/** Het getal uit een opgemaakte prijs: "€ 59,99" wordt 59.99. */
const cijfer = (prijs: string): number => Number(prijs.replace(/[^\d,.]/g, '').replace(',', '.'))

/**
 * Wat hetzelfde langs de maandelijkse weg zou kosten.
 *
 * Twaalf maanden plus het e-boek, want dat zit bij het jaar inbegrepen. Wie
 * dat weglaat rekent zichzelf arm: dan lijkt het jaar 28% schelen terwijl het
 * er 39% zijn. De koper legt die vergelijking toch, en dan liever met het
 * volledige bedrag ernaast dan met een half bedrag.
 */
export const YEAR_FULL = Math.round((cijfer(planOf('maand').list) * 12 + cijfer(EBOOK.list)) * 100) / 100

/** Datzelfde bedrag zoals het op het scherm hoort: "€ 98,87". */
export const YEAR_FULL_PRICE = `€ ${YEAR_FULL.toFixed(2).replace('.', ',')}`

/** Hoeveel een jaar vooruit scheelt, in hele procenten. */
export const YEAR_SAVING = Math.round((1 - cijfer(planOf('jaar').list) / YEAR_FULL) * 100)

export { FREE_LESSONS }

/* ------------------------------------------ the sliver of the plugin we use */

/**
 * Eén prijsfase van een aanbod.
 *
 * Een abonnement met een gratis proefperiode heeft er meer dan één: de eerste
 * is de proef en kost niets, de laatste is wat er elke maand of elk jaar
 * werkelijk afgaat.
 */
interface Fase { price?: string; priceMicros?: number; currency?: string }
interface Offer { pricingPhases?: Fase[]; order: () => Promise<unknown> }
interface Product {
  owned?: boolean
  /**
   * `price` is al opgemaakt voor het land van de koper — "€ 59,99", "$64.99".
   * `priceMicros` is datzelfde bedrag als getal, een miljoenste per eenheid,
   * en daar valt mee te rekenen. Dat is nodig om van een jaarprijs een
   * maandprijs te maken die klopt: het tekstje uit elkaar peuteren gaat mis
   * zodra een land een punt gebruikt waar wij een komma zetten.
   */
  pricing?: { price: string; priceMicros?: number; currency?: string } | null
  /** De aanbiedingen van dit product, elk met hun eigen prijsfasen. */
  offers?: Offer[]
  getOffer: () => Offer | undefined
}
interface Transaction { finish: () => void }
interface Purchase { productId: string }
interface CdvStore {
  register: (products: { id: string; type: string; platform?: string }[]) => void
  initialize: (platforms?: string[]) => Promise<unknown>
  when: () => {
    approved: (cb: (t: Transaction & { products: Purchase[] }) => void) => unknown
    productUpdated?: (cb: () => void) => unknown
    receiptsReady?: (cb: () => void) => unknown
  }
  get: (id: string) => Product | undefined
  /** Opnieuw bij de winkel langs voor de productgegevens. */
  update?: () => Promise<unknown>
  restorePurchases: () => Promise<unknown>
  manageSubscriptions: () => Promise<unknown> | void
  error: (cb: (e: { message?: string }) => void) => void
}
interface CdvPurchase {
  store: CdvStore
  ProductType: { PAID_SUBSCRIPTION: string; NON_CONSUMABLE: string }
  Platform: { GOOGLE_PLAY: string; APPLE_APPSTORE: string }
}

const plugin = (): CdvPurchase | null =>
  (window as unknown as { CdvPurchase?: CdvPurchase }).CdvPurchase ?? null

export const billingAvailable = (): boolean => plugin() !== null

/* --------------------------------------------------------- the entitlement */

export const isSubscribed = (): boolean => getState().unlocked

function grant(): void {
  if (getState().unlocked) return
  setState({ unlocked: true, unlockedAt: Date.now() })
}

export const hasEbook = (): boolean => getState().ebook

/**
 * The book is never taken back. It was paid for once — with the year or on its
 * own — and a book that disappears when a subscription lapses is not a book
 * anyone bought.
 */
function grantEbook(): void {
  if (getState().ebook) return
  setState({ ebook: true })
}

/**
 * A subscription can end, so access has to be able to end with it — but never
 * on a guess. Access is only withdrawn once the store has actually told us the
 * receipt says otherwise; a flight with no signal must not lock out a family
 * that pays.
 */
function syncFromStore(owned: boolean): void {
  if (owned) grant()
  else if (getState().unlocked) setState({ unlocked: false, unlockedAt: null })
}

/**
 * Een jaarprijs omgerekend naar wat hij per maand kost, in de munt van de
 * koper zelf.
 *
 * `Intl.NumberFormat` doet het afronden en het plaatsen van het muntteken,
 * zodat een Zweed "49,99 kr" ziet staan en geen euro's. Geeft de winkel geen
 * bedrag om mee te rekenen, dan komt er niets uit en valt het scherm terug op
 * het vaste getal uit PLANS.
 */
/**
 * Het bedrag uit een prijs van de winkel, of niets.
 *
 * Nul is hier geen bedrag maar een ontbrekend bedrag. Een winkel die een
 * product nog niet kent — of nog niet heeft goedgekeurd — geeft een
 * opgemaakte prijs terug van "$0.00", en die is als tekst nietszeggend en als
 * belofte gevaarlijk: dan staat er op het scherm dat een jaar niets kost.
 */
export const bedragVan = (pricing?: { price?: string; priceMicros?: number } | null): number | null => {
  if (!pricing) return null
  if (pricing.priceMicros !== undefined) return pricing.priceMicros > 0 ? pricing.priceMicros / 1e6 : null
  const uit = pricing.price ? cijfer(pricing.price) : 0
  return uit > 0 ? uit : null
}

/** De prijs zoals de winkel hem opmaakt, maar alleen als er een bedrag in zit. */
export const prijsVan = (pricing?: { price?: string; priceMicros?: number } | null): string | null =>
  bedragVan(pricing) !== null && pricing?.price ? pricing.price : null

const munt = (waarde: number, valuta: string): string | null => {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: valuta }).format(waarde)
  } catch {
    return null
  }
}

/**
 * Een bedrag dat wij zelf uitrekenen, opgemaakt zoals de winkel zijn eigen
 * prijzen opmaakt.
 *
 * `Intl.NumberFormat` kijkt naar de taal van de telefoon en niet naar de
 * winkel. Staat de telefoon op Nederlands terwijl de winkel in dollars
 * rekent, dan komt er "US$ 4,17" uit: het muntteken uit de ene wereld en de
 * komma uit de andere. Dat stond op hetzelfde kaartje naast Apple's eigen
 * "$49.99", en dan lijkt het scherm kapot terwijl het bedrag klopt.
 *
 * Dus nemen we de opmaak over van een prijs die de winkel wél heeft gegeven:
 * wat ervoor staat, wat erachter staat, welk teken de decimalen scheidt, en
 * of er duizendtallen worden gegroepeerd. Een yenprijs zonder decimalen
 * houdt er zo ook geen twee.
 */
export const alsPrijs = (voorbeeld: string, waarde: number): string | null => {
  const m = /\d[\d.,\u00a0\u202f\u2009 ']*\d|\d/.exec(voorbeeld)
  if (!m) return null
  const getal = m[0]
  const staart = /[.,](\d{1,2})$/.exec(getal)
  const decimaalTeken = staart ? staart[0][0]! : '.'
  const heel = staart ? getal.slice(0, -staart[0].length) : getal
  const groepTeken = /[.,\u00a0\u202f\u2009 ']/.exec(heel)?.[0] ?? ''
  const [heelDeel, deel] = waarde.toFixed(staart ? staart[1]!.length : 0).split('.')
  const gegroepeerd = groepTeken
    ? heelDeel!.replace(/\B(?=(\d{3})+(?!\d))/g, groepTeken)
    : heelDeel!
  const uit = deel ? gegroepeerd + decimaalTeken + deel : gegroepeerd
  return voorbeeld.slice(0, m.index) + uit + voorbeeld.slice(m.index + getal.length)
}

/** Zoals de winkel het zou schrijven, en anders zoals de telefoon het zou doen. */
const bedragAls = (voorbeeld: string | undefined, valuta: string | undefined, waarde: number): string | null =>
  (voorbeeld ? alsPrijs(voorbeeld, waarde) : null) ?? (valuta ? munt(waarde, valuta) : null)

const perMaandVan = (pricing?: { price?: string; priceMicros?: number; currency?: string } | null): string | null => {
  const bedrag = bedragVan(pricing)
  if (bedrag === null) return null
  return bedragAls(pricing?.price, pricing?.currency, bedrag / 12)
}

/* ---------------------------------------------------------- a tiny live state */

export interface BillingState {
  /** True inside the App Store and Play Store builds. */
  available: boolean
  /** The monthly price as the store formats it, or null until known. */
  price: string | null
  /** Each product's price in the buyer's own currency, once the store has said. */
  prices: Partial<Record<PlanId | 'ebook', string>>
  /**
   * Wat het jaarplan per maand kost, uitgerekend uit de echte jaarprijs.
   *
   * Niet hetzelfde als `planOf('jaar').perMonth`: dat is een vast getal dat
   * hoort bij onze eigen prijs. Apple en Google hebben niet dezelfde
   * prijspunten — € 59,99 tegenover € 59,88 — en in Zweden staat er iets heel
   * anders. Dit is wat de koper werkelijk gaat betalen, gedeeld door twaalf.
   */
  yearPerMonth: string | null
  /**
   * Waar het jaarplan mee vergeleken wordt, in de munt van de koper.
   *
   * `YEAR_FULL_PRICE` en `YEAR_SAVING` zijn uitgerekend uit ónze europrijzen.
   * Zet je die naast een bedrag dat de winkel teruggaf, dan staat er "$12,99"
   * naast "in plaats van € 98,87" op hetzelfde scherm. Dit is diezelfde som,
   * maar gemaakt van de bedragen die de koper werkelijk te zien krijgt — en
   * niet ingevuld zolang die er niet allemaal zijn.
   */
  vergelijking: { totaal: string; korting: number } | null
  busy: boolean
  /** Set when a purchase failed, in the store's own words. */
  error: string | null
}

let state: BillingState = { available: false, price: null, prices: {}, yearPerMonth: null, vergelijking: null, busy: false, error: null }
const listeners = new Set<() => void>()

const publish = (patch: Partial<BillingState>) => {
  state = { ...state, ...patch }
  listeners.forEach((l) => l())
}

export function useBilling(): BillingState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => void listeners.delete(l)
    },
    () => state,
    () => state,
  )
}

/* ------------------------------------------------------------------- the flow */

/**
 * De prijs die de koper straks werkelijk betaalt.
 *
 * Dit was de fout achter "$0.00 per jaar". Een abonnement met een gratis
 * proefperiode heeft meer dan één prijs: fase één is de proef en kost niets,
 * de laatste fase is wat er elke maand of elk jaar afgaat. `product.pricing`
 * van de plugin geeft de éérste fase terug — en dat is dus precies die nul.
 *
 * Het venster van Apple zelf toonde ondertussen keurig € 6,99, want dat leest
 * de betaalfase. Dat verschil is hoe je erachter komt: als de winkel het goed
 * weet en jouw scherm niet, ligt het nooit aan de winkel.
 *
 * Dus: de laatste fase met een echt bedrag erin. Voor een boek — dat geen
 * fasen heeft — blijft `pricing` gewoon de prijs.
 */
export const betaalFase = (
  product?: { pricing?: Fase | null; offers?: { pricingPhases?: Fase[] }[] } | null,
): Fase | null => {
  const fasen = (product?.offers ?? []).flatMap((aanbod) => aanbod.pricingPhases ?? [])
  const betaald = fasen.filter((fase) => bedragVan(fase) !== null)
  if (betaald.length) return betaald[betaald.length - 1]!
  return bedragVan(product?.pricing) !== null ? product?.pricing ?? null : null
}

/**
 * Twaalf maanden plus het boek, uit de winkel, met de korting erbij.
 *
 * Alles of niets: ontbreekt één van de drie bedragen, dan komt er niets uit.
 * Half rekenen met een eigen europrijs ernaast levert een vergelijking op die
 * nergens op slaat, en dat is erger dan geen vergelijking.
 */
const vergelijkingVan = (store: CdvStore): { totaal: string; korting: number } | null => {
  const jaar = betaalFase(store.get(planOf('jaar').product))
  const maand = bedragVan(betaalFase(store.get(planOf('maand').product)))
  const boek = bedragVan(betaalFase(store.get(EBOOK.product)))
  const jaarBedrag = bedragVan(jaar)
  if (!jaarBedrag || !maand || !boek) return null
  const vol = maand * 12 + boek
  const totaal = bedragAls(jaar?.price, jaar?.currency, vol)
  return totaal ? { totaal, korting: Math.round((1 - jaarBedrag / vol) * 100) } : null
}

let started = false

/** Connects to the store. Safe to call anywhere; does nothing on the web. */
export async function initBilling(): Promise<void> {
  const api = plugin()
  if (started || !api) return
  started = true
  publish({ available: true })

  const { store, ProductType, Platform } = api

  store.register([
    ...PRODUCTS.flatMap((id) => [
      { id, type: ProductType.PAID_SUBSCRIPTION, platform: Platform.GOOGLE_PLAY },
      { id, type: ProductType.PAID_SUBSCRIPTION, platform: Platform.APPLE_APPSTORE },
    ]),
    { id: EBOOK.product, type: ProductType.NON_CONSUMABLE, platform: Platform.GOOGLE_PLAY },
    { id: EBOOK.product, type: ProductType.NON_CONSUMABLE, platform: Platform.APPLE_APPSTORE },
  ])

  // A purchase the store approves is the purchase: there is no server behind
  // this app to check a receipt against, and a family that paid should not
  // wait on one.
  store.when().approved((transaction) => {
    const bought = transaction.products.map((p) => p.productId)
    if (bought.some((id) => PRODUCTS.includes(id))) grant()
    // The year has the book in it; by the month it is bought separately.
    if (bought.includes(EBOOK.product) || bought.includes(planOf('jaar').product)) grantEbook()
    transaction.finish()
    publish({ busy: false, error: null })
  })

  const refresh = () => {
    const prices: Partial<Record<PlanId | 'ebook', string>> = {}
    let owned: boolean | undefined
    let yearPerMonth: string | null = null
    for (const plan of PLANS) {
      const product = store.get(plan.product)
      const fase = betaalFase(product)
      const prijs = prijsVan(fase)
      if (prijs) prices[plan.id] = prijs
      if (plan.id === 'jaar') yearPerMonth = perMaandVan(fase)
      // Either plan being owned opens the whole course.
      if (product?.owned !== undefined) owned = (owned ?? false) || product.owned
    }
    const book = store.get(EBOOK.product)
    const boekPrijs = prijsVan(betaalFase(book))
    if (boekPrijs) prices.ebook = boekPrijs
    if (book?.owned || store.get(planOf('jaar').product)?.owned) grantEbook()
    publish({ prices, yearPerMonth, vergelijking: vergelijkingVan(store), price: prices.maand ?? null })
    if (owned !== undefined) syncFromStore(owned)
  }

  store.when().productUpdated?.(refresh)
  store.when().receiptsReady?.(refresh)
  store.error((e) => publish({ busy: false, error: e.message ?? null }))

  await store.initialize([Platform.GOOGLE_PLAY, Platform.APPLE_APPSTORE])
  refresh()

  /**
   * Opnieuw vragen zodra de app weer voor staat.
   *
   * De plugin vraagt de winkel één keer bij het starten en bewaart dat
   * antwoord. Staat er dan nog geen winkelland vast, of wisselt iemand er
   * later van, dan blijft een bedrag in de verkeerde munt op het scherm staan
   * tot de app helemaal opnieuw wordt gestart.
   *
   * In TestFlight komt dat er nog eens bovenop: de productgegevens komen daar
   * uit het gewone winkelaccount van het toestel en het betaalvenster uit het
   * proefaccount. Dat kunnen twee verschillende landen zijn, en dan staat er
   * op ons scherm een prijs die het venster van Apple daarna tegenspreekt.
   *
   * Hier is niets aan te repareren aan onze kant — de winkel zegt het zo —
   * behalve het opnieuw vragen. Eén keer per keer dat het scherm terugkomt is
   * genoeg, en het kost niets als er niets veranderd is.
   */
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return
    void Promise.resolve(store.update?.()).then(refresh, refresh)
  })
}

/** Opens the store's own payment sheet for one of the two plans, trial and all. */
export async function subscribe(plan: PlanId = 'jaar'): Promise<void> {
  const api = plugin()
  if (!api) return
  publish({ busy: true, error: null })
  try {
    const offer = api.store.get(planOf(plan).product)?.getOffer()
    if (!offer) throw new Error('product-onbekend')
    await offer.order()
  } catch (e) {
    publish({ busy: false, error: e instanceof Error ? e.message : String(e) })
  }
}

/** Opens the store's own payment sheet for the e-book on its own. */
export async function buyEbook(): Promise<void> {
  const api = plugin()
  if (!api) return
  publish({ busy: true, error: null })
  try {
    const offer = api.store.get(EBOOK.product)?.getOffer()
    if (!offer) throw new Error('product-onbekend')
    await offer.order()
  } catch (e) {
    publish({ busy: false, error: e instanceof Error ? e.message : String(e) })
  }
}

/**
 * Brings back a subscription bought earlier — a new phone, a reinstall, a
 * second device on the same account. Both stores require this to exist.
 */
export async function restorePurchases(): Promise<void> {
  const api = plugin()
  if (!api) return
  publish({ busy: true, error: null })
  try {
    await api.store.restorePurchases()
    let owned: boolean | undefined
    for (const plan of PLANS) {
      const product = api.store.get(plan.product)
      if (product?.owned !== undefined) owned = (owned ?? false) || product.owned
    }
    if (owned !== undefined) syncFromStore(owned)
    if (api.store.get(EBOOK.product)?.owned || api.store.get(planOf('jaar').product)?.owned) grantEbook()
  } catch (e) {
    publish({ error: e instanceof Error ? e.message : String(e) })
  } finally {
    publish({ busy: false })
  }
}

/**
 * Opens the subscription screen of the store, where cancelling happens. Both
 * stores require a way to reach it from inside the app, and cancelling is
 * theirs to handle — this app cannot do it on anyone's behalf.
 */
export function manageSubscription(): void {
  void plugin()?.store.manageSubscriptions()
}
