import { useSyncExternalStore } from 'react'
import { FREE_UNITS, getState, setState } from './store'

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
  { id: 'jaar', product: 'app.darijakids.yearly', list: '€ 59,88', perMonth: '€ 4,99', best: true },
  { id: 'maand', product: 'app.darijakids.monthly', list: '€ 6,99', perMonth: '€ 6,99' },
]

export const planOf = (id: PlanId): Plan => PLANS.find((p) => p.id === id) ?? PLANS[0]!

/** Every product the app knows how to sell. */
export const PRODUCTS = PLANS.map((p) => p.product)

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

/** How much a year up front saves, as a whole percent. */
export const YEAR_SAVING = Math.round(
  (1 - Number(planOf('jaar').list.replace(/[^\d,]/g, '').replace(',', '.')) /
    (Number(planOf('maand').list.replace(/[^\d,]/g, '').replace(',', '.')) * 12)) * 100,
)

export { FREE_UNITS }

/* ------------------------------------------ the sliver of the plugin we use */

interface Offer { order: () => Promise<unknown> }
interface Product {
  owned?: boolean
  pricing?: { price: string } | null
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
  restorePurchases: () => Promise<unknown>
  manageSubscriptions: () => Promise<unknown> | void
  error: (cb: (e: { message?: string }) => void) => void
}
interface CdvPurchase {
  store: CdvStore
  ProductType: { PAID_SUBSCRIPTION: string }
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

/* ---------------------------------------------------------- a tiny live state */

export interface BillingState {
  /** True inside the App Store and Play Store builds. */
  available: boolean
  /** The monthly price as the store formats it, or null until known. */
  price: string | null
  /** Each plan's price in the buyer's own currency, once the store has said. */
  prices: Partial<Record<PlanId, string>>
  busy: boolean
  /** Set when a purchase failed, in the store's own words. */
  error: string | null
}

let state: BillingState = { available: false, price: null, prices: {}, busy: false, error: null }
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

let started = false

/** Connects to the store. Safe to call anywhere; does nothing on the web. */
export async function initBilling(): Promise<void> {
  const api = plugin()
  if (started || !api) return
  started = true
  publish({ available: true })

  const { store, ProductType, Platform } = api

  store.register(
    PRODUCTS.flatMap((id) => [
      { id, type: ProductType.PAID_SUBSCRIPTION, platform: Platform.GOOGLE_PLAY },
      { id, type: ProductType.PAID_SUBSCRIPTION, platform: Platform.APPLE_APPSTORE },
    ]),
  )

  // A purchase the store approves is the purchase: there is no server behind
  // this app to check a receipt against, and a family that paid should not
  // wait on one.
  store.when().approved((transaction) => {
    if (transaction.products.some((p) => PRODUCTS.includes(p.productId))) grant()
    transaction.finish()
    publish({ busy: false, error: null })
  })

  const refresh = () => {
    const prices: Partial<Record<PlanId, string>> = {}
    let owned: boolean | undefined
    for (const plan of PLANS) {
      const product = store.get(plan.product)
      if (product?.pricing?.price) prices[plan.id] = product.pricing.price
      // Either plan being owned opens the whole course.
      if (product?.owned !== undefined) owned = (owned ?? false) || product.owned
    }
    publish({ prices, price: prices.maand ?? null })
    if (owned !== undefined) syncFromStore(owned)
  }

  store.when().productUpdated?.(refresh)
  store.when().receiptsReady?.(refresh)
  store.error((e) => publish({ busy: false, error: e.message ?? null }))

  await store.initialize([Platform.GOOGLE_PLAY, Platform.APPLE_APPSTORE])
  refresh()
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
