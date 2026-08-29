import { revalidatePath } from 'next/cache';
import { FEATURES_BY_PLAN, translate } from '@focusfamily/domain';
import { api } from '@/lib/api';
import { getSiteText } from '@/lib/i18n';
import { requireFamilyMe } from '@/lib/session';

interface BillingResponse {
  subscription: {
    plan: string;
    status: string;
    provider: string;
    sponsorName: string | null;
    currentPeriodEnd: string | null;
  } | null;
  plan: 'free' | 'family_premium' | 'sponsored';
  entitlements: Array<{ feature: string; source: string; expiresAt: string | null }>;
  provider: string;
  testMode: boolean;
}

export default async function PlanPage({
  searchParams,
}: {
  searchParams: Promise<{ mock_session?: string }>;
}) {
  const { locale } = await getSiteText();
  await requireFamilyMe();
  const params = await searchParams;
  const nl = locale === 'nl';

  // Returning from the mock checkout: confirm once and drop the parameter.
  if (params.mock_session) {
    await api.post('/billing/confirm', { sessionId: params.mock_session });
  }

  const result = await api.get<BillingResponse>('/billing');
  const data = result.data;

  async function startCheckout(): Promise<void> {
    'use server';
    const checkout = await api.post<{ checkout: { url: string } }>('/billing/checkout', {
      plan: 'family_premium',
    });
    if (checkout.ok && checkout.data) {
      const url = new URL(checkout.data.checkout.url);
      await api.post('/billing/confirm', {
        sessionId: url.searchParams.get('mock_session') ?? '',
      });
    }
    revalidatePath('/app/plan');
  }

  async function redeem(formData: FormData): Promise<void> {
    'use server';
    await api.post('/billing/sponsor-code', { code: String(formData.get('code') ?? '') });
    revalidatePath('/app/plan');
  }

  return (
    <div className="stack-lg" style={{ maxWidth: '44rem' }}>
      <section className="stack">
        <h1>{nl ? 'Jullie abonnement' : 'Your plan'}</h1>
        <p className="badge">{translate(locale, `billing.plan.${data?.plan ?? 'free'}`)}</p>
        {data?.testMode ? (
          <p className="notice notice--warm">{translate(locale, 'billing.test_mode')}</p>
        ) : null}
        <p className="notice notice--good">{translate(locale, 'billing.free_forever')}</p>
        <p style={{ color: 'var(--ink-soft)' }}>{translate(locale, 'billing.no_ads')}</p>
      </section>

      <section className="stack">
        <h2>{nl ? 'Wat er nu aan staat' : 'What is unlocked now'}</h2>
        {FEATURES_BY_PLAN[data?.plan ?? 'free'].length === 0 ? (
          <p style={{ color: 'var(--ink-soft)' }}>
            {nl
              ? 'Alle basisonderdelen. Dat is genoeg om een afspraak te maken en vol te houden.'
              : 'All the essentials. That is enough to make an agreement and keep it.'}
          </p>
        ) : (
          <ul>
            {FEATURES_BY_PLAN[data?.plan ?? 'free'].map((feature) => (
              <li key={feature}>
                <code style={{ fontSize: '0.9rem' }}>{feature}</code>
              </li>
            ))}
          </ul>
        )}
        {data?.subscription?.sponsorName ? (
          <p className="notice">
            {nl ? 'Betaald door: ' : 'Paid for by: '}
            {data.subscription.sponsorName}.{' '}
            {nl
              ? 'De sponsor ziet alleen hoeveel plekken gebruikt zijn, nooit iets over jullie gezin.'
              : 'The sponsor sees only how many seats are used, never anything about your family.'}
          </p>
        ) : null}
      </section>

      <section className="grid">
        <form action={startCheckout} className="card stack">
          <h2 style={{ fontSize: '1.1rem' }}>{nl ? 'Family Premium proberen' : 'Try Family Premium'}</h2>
          <p style={{ color: 'var(--ink-soft)' }}>
            {nl
              ? 'In deze demo loopt de betaling via een nagemaakte provider. Er gaat geen geld heen en weer.'
              : 'In this demo the payment runs through a mock provider. No money moves.'}
          </p>
          <button className="btn" type="submit">
            {nl ? 'Overstappen (testmodus)' : 'Switch (test mode)'}
          </button>
        </form>

        <form action={redeem} className="card stack">
          <h2 style={{ fontSize: '1.1rem' }}>
            {nl ? 'Code van werkgever of school' : 'Employer or school code'}
          </h2>
          <div className="field">
            <label htmlFor="code">{nl ? 'Code' : 'Code'}</label>
            <input id="code" name="code" type="text" minLength={4} required placeholder="SCHOOL-…" />
          </div>
          <button className="btn btn--secondary" type="submit">
            {nl ? 'Code gebruiken' : 'Redeem code'}
          </button>
        </form>
      </section>
    </div>
  );
}
