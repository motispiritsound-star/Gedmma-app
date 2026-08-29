import { prisma } from '@/lib/db'
import { getEnv } from '@/env'
import { notFound } from '@/lib/errors'
import { AUDIT_ACTIONS, recordAudit } from '@/modules/audit'
import { getPaymentProvider } from './provider'
import { entitlementsFor, type PlanEntitlements } from './plans'
import type { Subscription, SubscriptionPlan } from '@/generated/prisma/client'

export async function getSubscription(familyId: string): Promise<Subscription> {
  const existing = await prisma.subscription.findUnique({ where: { familyId } })
  if (existing) return existing
  return prisma.subscription.create({
    data: { familyId, plan: 'FREE', status: 'ACTIVE', provider: getEnv().PAYMENT_DRIVER },
  })
}

export async function getEntitlements(familyId: string): Promise<PlanEntitlements> {
  const subscription = await getSubscription(familyId)
  return entitlementsFor(subscription.plan)
}

export async function startCheckout(params: {
  familyId: string
  email: string
  plan: Exclude<SubscriptionPlan, 'FREE'>
}): Promise<{ url: string; isMock: boolean }> {
  const provider = getPaymentProvider()
  const appUrl = getEnv().APP_URL
  const session = await provider.createCheckoutSession({
    familyId: params.familyId,
    email: params.email,
    plan: params.plan,
    successUrl: `${appUrl}/settings/subscription/confirm`,
    cancelUrl: `${appUrl}/settings/subscription`,
  })
  await prisma.subscription.update({
    where: { familyId: params.familyId },
    data: { provider: provider.name },
  })
  return { url: session.url, isMock: provider.isMock }
}

/**
 * Activates a plan after a successful checkout. With the mock provider this is
 * called straight from the confirmation page; with Stripe it is called from the
 * webhook handler.
 */
export async function activatePlan(params: {
  familyId: string
  plan: SubscriptionPlan
  actorUserId?: string | null
  providerCustomerId?: string | null
  providerSubscriptionId?: string | null
  currentPeriodEnd?: Date | null
}): Promise<Subscription> {
  const family = await prisma.family.findUnique({ where: { id: params.familyId } })
  if (!family) throw notFound('Family not found.')

  const provider = getPaymentProvider()
  const subscription = await prisma.subscription.upsert({
    where: { familyId: params.familyId },
    create: {
      familyId: params.familyId,
      plan: params.plan,
      status: 'ACTIVE',
      provider: provider.name,
      providerCustomerId: params.providerCustomerId ?? null,
      providerSubscriptionId: params.providerSubscriptionId ?? `${provider.name}_sub_${params.familyId}`,
      currentPeriodEnd: params.currentPeriodEnd ?? defaultPeriodEnd(),
      cancelAtPeriodEnd: false,
    },
    update: {
      plan: params.plan,
      status: 'ACTIVE',
      provider: provider.name,
      providerCustomerId: params.providerCustomerId ?? undefined,
      providerSubscriptionId:
        params.providerSubscriptionId ?? `${provider.name}_sub_${params.familyId}`,
      currentPeriodEnd: params.currentPeriodEnd ?? defaultPeriodEnd(),
      cancelAtPeriodEnd: false,
    },
  })

  await recordAudit({
    action: AUDIT_ACTIONS.subscriptionChanged,
    entityType: 'subscription',
    entityId: subscription.id,
    actorUserId: params.actorUserId ?? null,
    metadata: { plan: params.plan, provider: provider.name },
  })

  return subscription
}

export async function cancelPlan(familyId: string, actorUserId?: string | null): Promise<Subscription> {
  const current = await getSubscription(familyId)
  const provider = getPaymentProvider()

  let cancelAtPeriodEnd = true
  let currentPeriodEnd = current.currentPeriodEnd ?? defaultPeriodEnd()
  if (current.providerSubscriptionId && !provider.isMock) {
    const remote = await provider.cancelAtPeriodEnd(current.providerSubscriptionId)
    cancelAtPeriodEnd = remote.cancelAtPeriodEnd
    currentPeriodEnd = remote.currentPeriodEnd ?? currentPeriodEnd
  }

  const updated = await prisma.subscription.update({
    where: { familyId },
    data: { cancelAtPeriodEnd, currentPeriodEnd },
  })

  await recordAudit({
    action: AUDIT_ACTIONS.subscriptionChanged,
    entityType: 'subscription',
    entityId: updated.id,
    actorUserId: actorUserId ?? null,
    metadata: { change: 'cancel_at_period_end' },
  })

  return updated
}

export async function resumePlan(familyId: string, actorUserId?: string | null): Promise<Subscription> {
  const current = await getSubscription(familyId)
  const provider = getPaymentProvider()
  if (current.providerSubscriptionId && !provider.isMock) {
    await provider.resume(current.providerSubscriptionId)
  }
  const updated = await prisma.subscription.update({
    where: { familyId },
    data: { cancelAtPeriodEnd: false },
  })
  await recordAudit({
    action: AUDIT_ACTIONS.subscriptionChanged,
    entityType: 'subscription',
    entityId: updated.id,
    actorUserId: actorUserId ?? null,
    metadata: { change: 'resume' },
  })
  return updated
}

/**
 * Downgrades a family to the free plan. Called by the (future) billing webhook
 * when a subscription actually lapses.
 */
export async function downgradeToFree(familyId: string): Promise<Subscription> {
  return prisma.subscription.update({
    where: { familyId },
    data: { plan: 'FREE', status: 'CANCELED', cancelAtPeriodEnd: false, currentPeriodEnd: null },
  })
}

function defaultPeriodEnd(): Date {
  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
}
