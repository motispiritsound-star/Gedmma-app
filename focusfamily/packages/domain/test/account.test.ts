import { describe, expect, it } from 'vitest';
import {
  BASELINE_DAYS,
  DELETION_GRACE_DAYS,
  FEATURES_BY_PLAN,
  MONETISATION_POLICY,
  MockBillingProvider,
  NEVER_GATED,
  NOT_COLLECTED,
  SPONSOR_VISIBLE_FIELDS,
  assertFeature,
  baselineState,
  defaultPreference,
  effectivePlan,
  hasFeature,
  isDeletionDue,
  isWithinWindow,
  parseClockTime,
  formatClockTime,
  scheduleDeletion,
  shouldDeliver,
  startOfWeek,
  localDateKey,
  type Subscription,
} from '../src/index.js';

const now = new Date(2026, 2, 17, 22, 30, 0);

function subscription(overrides: Partial<Subscription> = {}): Subscription {
  return {
    id: 'sub_1',
    familyId: 'fam_1',
    plan: 'family_premium',
    status: 'active',
    provider: 'mock',
    providerRef: null,
    sponsorName: null,
    currentPeriodEnd: new Date(2026, 5, 1),
    createdAt: new Date(2026, 0, 1),
    ...overrides,
  };
}

describe('the neutral first week', () => {
  it('holds back every nudge while it runs', () => {
    const state = baselineState({ baselineStartedAt: new Date(2026, 2, 15) }, now);
    expect(state.active).toBe(true);
    expect(state.suppressNudges).toBe(true);
    expect(state.dayNumber).toBe(3);
    expect(state.daysRemaining).toBe(5);
  });

  it('is exactly seven days long', () => {
    expect(BASELINE_DAYS).toBe(7);
    const done = baselineState({ baselineStartedAt: new Date(2026, 2, 10) }, now);
    expect(done.active).toBe(false);
    expect(done.messageKey).toBe('baseline.complete');
  });

  it('treats "not started" as still quiet', () => {
    const state = baselineState({ baselineStartedAt: null }, now);
    expect(state.started).toBe(false);
    expect(state.suppressNudges).toBe(true);
  });
});

describe('notifications and quiet hours', () => {
  const preference = defaultPreference({
    id: 'np_1',
    userId: 'u_teen',
    familyId: 'fam_1',
    isChild: true,
    now,
  });

  it('gives a child earlier quiet hours by default', () => {
    expect(preference.quietHoursStart).toBe('20:30');
    expect(preference.quietHoursEnabled).toBe(true);
  });

  it('holds a reminder back during quiet hours and says when it may go out', () => {
    const decision = shouldDeliver({ preference, category: 'focus_reminder', now });
    expect(decision.deliver).toBe(false);
    expect(decision.reasonKey).toBe('notification.quiet_hours');
    expect(decision.deferUntil).toBe('07:30');
  });

  it('lets an account-security message through even then', () => {
    expect(shouldDeliver({ preference, category: 'account_security', now }).deliver).toBe(true);
  });

  it('honours a switched-off category with no override', () => {
    expect(
      shouldDeliver({ preference, category: 'weekly_review_ready', now: new Date(2026, 2, 17, 12) })
        .deliver,
    ).toBe(false);
  });

  it('delivers outside quiet hours', () => {
    const decision = shouldDeliver({
      preference,
      category: 'focus_reminder',
      now: new Date(2026, 2, 17, 17, 45),
    });
    expect(decision.deliver).toBe(true);
  });

  it('handles a window that wraps past midnight', () => {
    expect(isWithinWindow(parseClockTime('23:00'), parseClockTime('21:00'), parseClockTime('07:00'))).toBe(true);
    expect(isWithinWindow(parseClockTime('06:59'), parseClockTime('21:00'), parseClockTime('07:00'))).toBe(true);
    expect(isWithinWindow(parseClockTime('07:00'), parseClockTime('21:00'), parseClockTime('07:00'))).toBe(false);
    expect(formatClockTime(parseClockTime('07:05'))).toBe('07:05');
  });
});

describe('plans and entitlements', () => {
  it('never gates the essentials', () => {
    for (const capability of NEVER_GATED) {
      expect(Object.values(FEATURES_BY_PLAN).flat()).not.toContain(capability);
    }
  });

  it('falls back to free when a subscription lapses', () => {
    expect(effectivePlan(subscription({ status: 'past_due' }))).toBe('free');
    expect(effectivePlan(subscription({ status: 'canceled' }))).toBe('free');
    expect(effectivePlan(null)).toBe('free');
    expect(effectivePlan(subscription())).toBe('family_premium');
  });

  it('grants premium features on premium and sponsored plans', () => {
    expect(hasFeature({ subscription: subscription(), feature: 'insights.history_90d' })).toBe(true);
    expect(
      hasFeature({ subscription: subscription({ plan: 'sponsored' }), feature: 'programmes.guided' }),
    ).toBe(true);
    expect(hasFeature({ subscription: null, feature: 'programmes.guided' })).toBe(false);
  });

  it('honours a one-off entitlement until it expires', () => {
    const entitlement = {
      id: 'e1',
      familyId: 'fam_1',
      feature: 'programmes.guided' as const,
      source: 'trial' as const,
      expiresAt: new Date(2026, 3, 1),
    };
    expect(
      hasFeature({
        subscription: null,
        extraEntitlements: [entitlement],
        feature: 'programmes.guided',
        now,
      }),
    ).toBe(true);
    expect(
      hasFeature({
        subscription: null,
        extraEntitlements: [entitlement],
        feature: 'programmes.guided',
        now: new Date(2026, 6, 1),
      }),
    ).toBe(false);
  });

  it('throws a payment-required style error rather than silently hiding a feature', () => {
    expect(() => assertFeature({ subscription: null, feature: 'review.export_pdf' })).toThrowError(
      /billing.upgrade_needed/,
    );
  });

  it('shows a sponsor nothing but a seat count', () => {
    expect([...SPONSOR_VISIBLE_FIELDS]).toEqual([
      'seatsPurchased',
      'seatsRedeemed',
      'renewsAt',
    ]);
    expect(MONETISATION_POLICY.sponsorSeesFamilyContent).toBe(false);
  });

  it('states in code that we do not sell data or advertise to children', () => {
    expect(MONETISATION_POLICY.sellsChildData).toBe(false);
    expect(MONETISATION_POLICY.sellsPersonalData).toBe(false);
    expect(MONETISATION_POLICY.behaviouralAdvertising).toBe(false);
    expect(MONETISATION_POLICY.thirdPartyAdSdks).toEqual([]);
  });

  it('runs a full mock checkout without pretending money moved', async () => {
    const provider = new MockBillingProvider();
    const checkout = await provider.createCheckout({
      familyId: 'fam_1',
      plan: 'family_premium',
      successUrl: 'https://example.test/billing/done',
      cancelUrl: 'https://example.test/billing',
    });
    expect(checkout.provider).toBe('mock');
    expect(checkout.url).toContain('mock_session=');
    const confirmed = await provider.confirm(checkout.id);
    expect(confirmed.plan).toBe('family_premium');
    expect(confirmed.status).toBe('active');
    await expect(provider.confirm('nope')).rejects.toThrowError(/unknown_session/);
  });
});

describe('data rights', () => {
  it('schedules deletion after a grace period you can cancel', () => {
    const request = scheduleDeletion({
      id: 'dr_1',
      familyId: 'fam_1',
      requestedByUserId: 'u_parent',
      subjectUserId: 'u_parent',
      scope: 'self',
      now,
    });
    expect(request.status).toBe('scheduled');
    expect(isDeletionDue(request, now)).toBe(false);
    const later = new Date(now.getTime() + (DELETION_GRACE_DAYS + 1) * 86_400_000);
    expect(isDeletionDue(request, later)).toBe(true);
    expect(isDeletionDue({ ...request, status: 'cancelled' }, later)).toBe(false);
  });

  it('lists what was never collected, so an export says so out loud', () => {
    expect(NOT_COLLECTED).toContain('message_content');
    expect(NOT_COLLECTED).toContain('browsing_history');
    expect(NOT_COLLECTED).toContain('keystrokes');
    expect(NOT_COLLECTED).toContain('precise_location');
    expect(NOT_COLLECTED).toContain('per_app_usage_detail');
  });
});

describe('local time helpers', () => {
  it('starts the week on Monday', () => {
    expect(localDateKey(startOfWeek(new Date(2026, 2, 22)))).toBe('2026-03-16'); // Sunday
    expect(localDateKey(startOfWeek(new Date(2026, 2, 16)))).toBe('2026-03-16'); // Monday
  });

  it('rejects a nonsense clock time', () => {
    expect(() => parseClockTime('25:00')).toThrowError(/Invalid/);
    expect(() => parseClockTime('7:5')).toThrowError(/Invalid/);
  });
});
