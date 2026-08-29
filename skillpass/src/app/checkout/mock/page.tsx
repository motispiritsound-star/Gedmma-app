import { MockCheckoutForm } from './form';

/**
 * Stand-in for a hosted payment page. It posts a correctly signed webhook to
 * the application's own endpoint, so the entire payment path — including
 * signature verification and idempotency — is exercised without a PSP account.
 */
export default async function MockCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; amount?: string; currency?: string; next?: string }>;
}) {
  const { ref, amount, currency, next } = await searchParams;

  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', background: '#f8fafc', margin: 0 }}>
        <main style={{ maxWidth: 460, margin: '4rem auto', background: '#fff', padding: '2rem', borderRadius: 12, border: '1px solid #e2e8f0' }}>
          <p style={{ margin: 0, fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', color: '#64748b' }}>
            Mock payment provider
          </p>
          <h1 style={{ margin: '.5rem 0 1rem', fontSize: 24 }}>Confirm your payment</h1>
          <p style={{ color: '#475569' }}>
            This is SkillPass&apos;s built-in test checkout. No card details are collected and no money moves.
          </p>
          <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '.25rem 1rem', fontSize: 14, margin: '1.5rem 0' }}>
            <dt style={{ color: '#64748b' }}>Amount</dt>
            <dd style={{ margin: 0, fontWeight: 600 }}>
              {((Number(amount ?? 0) || 0) / 100).toFixed(2)} {currency ?? 'EUR'}
            </dd>
            <dt style={{ color: '#64748b' }}>Reference</dt>
            <dd style={{ margin: 0, fontFamily: 'ui-monospace, monospace' }}>{ref}</dd>
          </dl>
          <MockCheckoutForm externalRef={ref ?? ''} amountCents={Number(amount ?? 0) || 0} currency={currency ?? 'EUR'} next={next ?? '/'} />
        </main>
      </body>
    </html>
  );
}
