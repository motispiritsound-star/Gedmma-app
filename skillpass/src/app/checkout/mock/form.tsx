'use client';

import { useState } from 'react';

export function MockCheckoutForm({
  externalRef,
  amountCents,
  currency,
  next,
}: {
  externalRef: string;
  amountCents: number;
  currency: string;
  next: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function complete(outcome: 'checkout.completed' | 'checkout.failed') {
    setPending(true);
    setError(null);
    try {
      // The server signs and delivers the webhook to itself; the browser never
      // holds the webhook secret.
      const response = await fetch('/api/checkout/mock/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ externalRef, amountCents, currency, outcome }),
      });
      if (!response.ok) throw new Error((await response.json()).error ?? 'Payment simulation failed');
      window.location.assign(next);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Payment simulation failed');
      setPending(false);
    }
  }

  const button = {
    display: 'block',
    width: '100%',
    padding: '.7rem 1rem',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    cursor: pending ? 'not-allowed' : 'pointer',
  } as const;

  return (
    <div style={{ display: 'grid', gap: '.6rem' }}>
      {error ? <p role="alert" style={{ color: '#b91c1c', fontSize: 14 }}>{error}</p> : null}
      <button
        type="button"
        onClick={() => complete('checkout.completed')}
        disabled={pending}
        style={{ ...button, background: '#1f56c4', color: '#fff', border: 'none' }}
        data-testid="mock-pay"
      >
        {pending ? 'Processing…' : 'Pay now (test)'}
      </button>
      <button
        type="button"
        onClick={() => complete('checkout.failed')}
        disabled={pending}
        style={{ ...button, background: '#fff', color: '#334155', border: '1px solid #cbd5e1' }}
      >
        Simulate a failed payment
      </button>
    </div>
  );
}
