import { getEnv } from '@/env'
import { logger } from '@/lib/logger'
import type { SubscriptionPlan } from '@/generated/prisma/client'

/**
 * Payment provider abstraction.
 *
 * The application must run end to end with no Stripe credentials, so `mock` is
 * the default driver. The Stripe driver talks to Stripe in test mode and is
 * only constructed when `PAYMENT_DRIVER=stripe` and a key is present.
 */

export type CheckoutSession = {
  id: string
  url: string
  provider: string
}

export type ProviderSubscription = {
  providerCustomerId: string | null
  providerSubscriptionId: string | null
  plan: SubscriptionPlan
  status: 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELED'
  currentPeriodEnd: Date | null
  cancelAtPeriodEnd: boolean
}

export interface PaymentProvider {
  readonly name: string
  /** True when no real payment rails are involved (used to label the UI). */
  readonly isMock: boolean
  createCheckoutSession(params: {
    familyId: string
    email: string
    plan: Exclude<SubscriptionPlan, 'FREE'>
    successUrl: string
    cancelUrl: string
  }): Promise<CheckoutSession>
  cancelAtPeriodEnd(providerSubscriptionId: string): Promise<ProviderSubscription>
  resume(providerSubscriptionId: string): Promise<ProviderSubscription>
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

/**
 * In-process provider used for development, tests and any deployment without
 * Stripe credentials. Checkout "succeeds" by redirecting straight back to the
 * confirmation URL with a mock session id.
 */
export class MockPaymentProvider implements PaymentProvider {
  readonly name = 'mock'
  readonly isMock = true

  async createCheckoutSession(params: {
    familyId: string
    email: string
    plan: Exclude<SubscriptionPlan, 'FREE'>
    successUrl: string
    cancelUrl: string
  }): Promise<CheckoutSession> {
    const id = `mock_cs_${params.familyId}_${Date.now().toString(36)}`
    const url = `${params.successUrl}${params.successUrl.includes('?') ? '&' : '?'}session_id=${id}`
    logger.info('payments.mock_checkout_created', { familyId: params.familyId, plan: params.plan })
    return { id, url, provider: this.name }
  }

  async cancelAtPeriodEnd(providerSubscriptionId: string): Promise<ProviderSubscription> {
    return {
      providerCustomerId: null,
      providerSubscriptionId,
      plan: 'FAMILY_PREMIUM',
      status: 'ACTIVE',
      currentPeriodEnd: new Date(Date.now() + THIRTY_DAYS_MS),
      cancelAtPeriodEnd: true,
    }
  }

  async resume(providerSubscriptionId: string): Promise<ProviderSubscription> {
    return {
      providerCustomerId: null,
      providerSubscriptionId,
      plan: 'FAMILY_PREMIUM',
      status: 'ACTIVE',
      currentPeriodEnd: new Date(Date.now() + THIRTY_DAYS_MS),
      cancelAtPeriodEnd: false,
    }
  }
}

/**
 * Stripe driver. The SDK is imported lazily so that a deployment running the
 * mock provider never loads it, and so the test suite never needs the package
 * to be configured.
 */
export class StripePaymentProvider implements PaymentProvider {
  readonly name = 'stripe'
  readonly isMock = false

  private async client() {
    const { default: Stripe } = await import('stripe')
    const key = getEnv().STRIPE_SECRET_KEY
    if (!key) throw new Error('STRIPE_SECRET_KEY is not configured')
    return new Stripe(key)
  }

  async createCheckoutSession(params: {
    familyId: string
    email: string
    plan: Exclude<SubscriptionPlan, 'FREE'>
    successUrl: string
    cancelUrl: string
  }): Promise<CheckoutSession> {
    const stripe = await this.client()
    const priceId = getEnv().STRIPE_PREMIUM_PRICE_ID
    if (!priceId) throw new Error('STRIPE_PREMIUM_PRICE_ID is not configured')

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: params.email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      client_reference_id: params.familyId,
      metadata: { familyId: params.familyId, plan: params.plan },
    })

    return { id: session.id, url: session.url ?? params.cancelUrl, provider: this.name }
  }

  async cancelAtPeriodEnd(providerSubscriptionId: string): Promise<ProviderSubscription> {
    const stripe = await this.client()
    const updated = await stripe.subscriptions.update(providerSubscriptionId, {
      cancel_at_period_end: true,
    })
    return mapStripeSubscription(updated)
  }

  async resume(providerSubscriptionId: string): Promise<ProviderSubscription> {
    const stripe = await this.client()
    const updated = await stripe.subscriptions.update(providerSubscriptionId, {
      cancel_at_period_end: false,
    })
    return mapStripeSubscription(updated)
  }
}

type StripeLikeSubscription = {
  id: string
  customer: string | { id: string }
  status: string
  cancel_at_period_end: boolean
  items: { data: Array<{ current_period_end?: number }> }
}

export function mapStripeSubscription(subscription: unknown): ProviderSubscription {
  const value = subscription as StripeLikeSubscription
  const statusMap: Record<string, ProviderSubscription['status']> = {
    active: 'ACTIVE',
    trialing: 'TRIALING',
    past_due: 'PAST_DUE',
    unpaid: 'PAST_DUE',
    canceled: 'CANCELED',
    incomplete_expired: 'CANCELED',
  }
  const periodEnd = value.items?.data?.[0]?.current_period_end
  return {
    providerCustomerId: typeof value.customer === 'string' ? value.customer : (value.customer?.id ?? null),
    providerSubscriptionId: value.id,
    plan: 'FAMILY_PREMIUM',
    status: statusMap[value.status] ?? 'CANCELED',
    currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
    cancelAtPeriodEnd: Boolean(value.cancel_at_period_end),
  }
}

let cachedProvider: PaymentProvider | null = null

export function getPaymentProvider(): PaymentProvider {
  if (!cachedProvider) {
    cachedProvider =
      getEnv().PAYMENT_DRIVER === 'stripe' ? new StripePaymentProvider() : new MockPaymentProvider()
  }
  return cachedProvider
}
