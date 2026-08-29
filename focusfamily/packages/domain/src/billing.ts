import { z } from 'zod';
import { DomainError } from './errors.js';

/**
 * Three ways to pay, one of which is not the family paying at all: an employer
 * or a school can sponsor a licence. Sponsors receive no family data, only a
 * seat count - enforced by `SPONSOR_VISIBLE_FIELDS` below.
 */
export const plans = ['free', 'family_premium', 'sponsored'] as const;
export type Plan = (typeof plans)[number];

export const features = [
  'agreements.multiple',
  'insights.history_90d',
  'programmes.guided',
  'activities.extra_packs',
  'review.export_pdf',
  'focus.custom_schedules',
] as const;
export type Feature = (typeof features)[number];

/**
 * Everything essential stays free forever: one agreement, focus moments,
 * check-ins, the weekly review, data export and deletion. Premium buys depth,
 * never safety and never privacy.
 */
export const FEATURES_BY_PLAN: Readonly<Record<Plan, readonly Feature[]>> = Object.freeze({
  free: Object.freeze([] as readonly Feature[]),
  family_premium: Object.freeze([
    'agreements.multiple',
    'insights.history_90d',
    'programmes.guided',
    'activities.extra_packs',
    'review.export_pdf',
    'focus.custom_schedules',
  ] as readonly Feature[]),
  sponsored: Object.freeze([
    'agreements.multiple',
    'insights.history_90d',
    'programmes.guided',
    'activities.extra_packs',
    'focus.custom_schedules',
  ] as readonly Feature[]),
});

/** Capabilities that are free for everyone and can never be gated. */
export const NEVER_GATED = Object.freeze([
  'agreement.read',
  'focus.session.start',
  'checkin.create_self',
  'export.request',
  'deletion.request',
  'consent.withdraw',
  'education.read',
] as const);

/** The only fields a sponsoring employer or school may ever see. */
export const SPONSOR_VISIBLE_FIELDS = Object.freeze([
  'seatsPurchased',
  'seatsRedeemed',
  'renewsAt',
] as const);

export const subscriptionStatuses = [
  'active',
  'trialing',
  'past_due',
  'canceled',
  'none',
] as const;
export type SubscriptionStatus = (typeof subscriptionStatuses)[number];

export const subscriptionSchema = z
  .object({
    id: z.string(),
    familyId: z.string(),
    plan: z.enum(plans),
    status: z.enum(subscriptionStatuses),
    provider: z.enum(['mock', 'stripe_test', 'sponsor_code']),
    providerRef: z.string().max(120).nullable().default(null),
    /** Set for sponsored plans; identifies the sponsor, not the family. */
    sponsorName: z.string().max(80).nullable().default(null),
    currentPeriodEnd: z.coerce.date().nullable().default(null),
    createdAt: z.coerce.date(),
  })
  .strict();
export type Subscription = z.infer<typeof subscriptionSchema>;

export const entitlementSchema = z
  .object({
    id: z.string(),
    familyId: z.string(),
    feature: z.enum(features),
    source: z.enum(['plan', 'sponsor', 'grandfathered', 'trial']),
    expiresAt: z.coerce.date().nullable().default(null),
  })
  .strict();
export type Entitlement = z.infer<typeof entitlementSchema>;

const activeStatuses: ReadonlySet<SubscriptionStatus> = new Set<SubscriptionStatus>([
  'active',
  'trialing',
]);

export function effectivePlan(subscription: Subscription | null): Plan {
  if (!subscription) return 'free';
  return activeStatuses.has(subscription.status) ? subscription.plan : 'free';
}

export function hasFeature(args: {
  subscription: Subscription | null;
  extraEntitlements?: readonly Entitlement[];
  feature: Feature;
  now?: Date;
}): boolean {
  const now = args.now ?? new Date();
  const plan = effectivePlan(args.subscription);
  if (FEATURES_BY_PLAN[plan].includes(args.feature)) return true;
  return (args.extraEntitlements ?? []).some(
    (entitlement) =>
      entitlement.feature === args.feature &&
      (entitlement.expiresAt === null || entitlement.expiresAt.getTime() > now.getTime()),
  );
}

export function assertFeature(args: {
  subscription: Subscription | null;
  extraEntitlements?: readonly Entitlement[];
  feature: Feature;
  now?: Date;
}): void {
  if (!hasFeature(args)) {
    throw new DomainError('entitlement_required', 'billing.upgrade_needed', {
      feature: args.feature,
    });
  }
}

/* ------------------------------ providers ------------------------------- */

export interface CheckoutSession {
  readonly id: string;
  readonly url: string;
  readonly provider: 'mock' | 'stripe_test';
  readonly plan: Plan;
}

export interface BillingProvider {
  readonly name: 'mock' | 'stripe_test';
  createCheckout(args: {
    familyId: string;
    plan: Exclude<Plan, 'free'>;
    successUrl: string;
    cancelUrl: string;
  }): Promise<CheckoutSession>;
  /** Confirm a checkout. Returns the subscription fields to persist. */
  confirm(sessionId: string): Promise<{
    plan: Plan;
    status: SubscriptionStatus;
    providerRef: string;
    currentPeriodEnd: Date | null;
  }>;
  cancel(providerRef: string): Promise<void>;
}

/**
 * Deterministic provider used by the demo, the tests and any environment
 * without Stripe keys. It never pretends to have taken a payment: the returned
 * url points at an in-app confirmation page that says "test mode".
 */
export class MockBillingProvider implements BillingProvider {
  readonly name = 'mock' as const;
  private readonly sessions = new Map<string, { familyId: string; plan: Plan }>();
  private counter = 0;

  async createCheckout(args: {
    familyId: string;
    plan: Exclude<Plan, 'free'>;
    successUrl: string;
    cancelUrl: string;
  }): Promise<CheckoutSession> {
    this.counter += 1;
    const id = `mock_cs_${this.counter}`;
    this.sessions.set(id, { familyId: args.familyId, plan: args.plan });
    const separator = args.successUrl.includes('?') ? '&' : '?';
    return {
      id,
      url: `${args.successUrl}${separator}mock_session=${id}`,
      provider: 'mock',
      plan: args.plan,
    };
  }

  async confirm(sessionId: string): Promise<{
    plan: Plan;
    status: SubscriptionStatus;
    providerRef: string;
    currentPeriodEnd: Date | null;
  }> {
    const session = this.sessions.get(sessionId);
    if (!session) throw DomainError.invalid('billing.unknown_session', { sessionId });
    const end = new Date();
    end.setMonth(end.getMonth() + 1);
    return {
      plan: session.plan,
      status: 'active',
      providerRef: sessionId,
      currentPeriodEnd: end,
    };
  }

  async cancel(providerRef: string): Promise<void> {
    this.sessions.delete(providerRef);
  }
}

/**
 * Policy constants, referenced by the privacy documentation and asserted in
 * tests so a future contributor cannot quietly change the business model.
 */
export const MONETISATION_POLICY = Object.freeze({
  sellsPersonalData: false,
  sellsChildData: false,
  behaviouralAdvertising: false,
  thirdPartyAdSdks: Object.freeze([] as readonly string[]),
  sponsorSeesFamilyContent: false,
});
