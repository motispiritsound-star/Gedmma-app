import { useSyncExternalStore } from 'react'
import { FREE_UNITS, getState, setState } from './store'

/**
 * Paying for the full app, through the App Store and Google Play.
 *
 * One product, bought once: the first units are free, the rest unlock for a
 * single payment. No subscription — a child's app should not carry a monthly
 * bill, and a family that pays once should keep it forever, offline included.
 *
 * The purchase itself is handled entirely by Apple and Google: they take the
 * payment, they charge the VAT, and they pay out to the publisher's bank
 * account. Nothing about a card ever reaches this app, which is also why this
 * file is so short.
 *
 * The plugin (cordova-plugin-purchase) only exists inside the native shells.
 * On the web there is nothing to buy here, so everything below degrades to
 * "not available" rather than breaking.
 */

/** Create this exact id in App Store Connect and in the Play Console. */
export const FULL_ACCESS = 'app.gedmma.learn.full'

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
  }
  get: (id: string) => Product | undefined
  restorePurchases: () => Promise<unknown>
  error: (cb: (e: { message?: string }) => void) => void
}
interface CdvPurchase {
  store: CdvStore
  ProductType: { NON_CONSUMABLE: string }
  Platform: { GOOGLE_PLAY: string; APPLE_APPSTORE: string }
}

const plugin = (): CdvPurchase | null =>
  (window as unknown as { CdvPurchase?: CdvPurchase }).CdvPurchase ?? null

export const billingAvailable = (): boolean => plugin() !== null

/* ------------------------------------------------------------ the entitlement */

export const isUnlocked = (): boolean => getState().unlocked

export function grantUnlock(): void {
  if (getState().unlocked) return
  setState({ unlocked: true, unlockedAt: Date.now() })
}

/* ---------------------------------------------------------- a tiny live state */

export interface BillingState {
  /** True inside the App Store and Play Store builds. */
  available: boolean
  /** The price as the store formats it for this country, or null until known. */
  price: string | null
  busy: boolean
  /** Set when a purchase failed, in the store's own words. */
  error: string | null
}

let state: BillingState = { available: false, price: null, busy: false, error: null }
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

  store.register([
    { id: FULL_ACCESS, type: ProductType.NON_CONSUMABLE, platform: Platform.GOOGLE_PLAY },
    { id: FULL_ACCESS, type: ProductType.NON_CONSUMABLE, platform: Platform.APPLE_APPSTORE },
  ])

  // A purchase that the store approves is the purchase: there is no server
  // behind this app to check a receipt against, and a family that paid should
  // not wait on one.
  store.when().approved((transaction) => {
    if (transaction.products.some((p) => p.productId === FULL_ACCESS)) grantUnlock()
    transaction.finish()
    publish({ busy: false, error: null })
  })

  store.when().productUpdated?.(() => {
    const product = store.get(FULL_ACCESS)
    if (product?.owned) grantUnlock()
    publish({ price: product?.pricing?.price ?? null })
  })

  store.error((e) => publish({ busy: false, error: e.message ?? null }))

  await store.initialize([Platform.GOOGLE_PLAY, Platform.APPLE_APPSTORE])
  publish({ price: store.get(FULL_ACCESS)?.pricing?.price ?? null })
}

/** Opens the store's own payment sheet. */
export async function buyFullAccess(): Promise<void> {
  const api = plugin()
  if (!api) return
  publish({ busy: true, error: null })
  try {
    const offer = api.store.get(FULL_ACCESS)?.getOffer()
    if (!offer) throw new Error('product-onbekend')
    await offer.order()
  } catch (e) {
    publish({ busy: false, error: e instanceof Error ? e.message : String(e) })
  }
}

/**
 * Brings back a purchase made earlier — a new phone, a reinstall, a second
 * device on the same account. Both stores require this to exist.
 */
export async function restorePurchases(): Promise<void> {
  const api = plugin()
  if (!api) return
  publish({ busy: true, error: null })
  try {
    await api.store.restorePurchases()
    if (api.store.get(FULL_ACCESS)?.owned) grantUnlock()
  } catch (e) {
    publish({ error: e instanceof Error ? e.message : String(e) })
  } finally {
    publish({ busy: false })
  }
}
