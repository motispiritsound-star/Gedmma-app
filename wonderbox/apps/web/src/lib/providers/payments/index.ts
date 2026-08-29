import { env } from '../../env.ts';
import { MockPaymentProvider } from './mock.ts';
import { StripePaymentProvider } from './stripe.ts';
import type { PaymentProvider } from './types.ts';

export * from './types.ts';
export { MockPaymentProvider } from './mock.ts';
export { StripePaymentProvider } from './stripe.ts';

/**
 * The mock provider keeps state in memory, so it must be a singleton across hot
 * reloads — otherwise an intent created before an edit disappears after it.
 */
const globalForPayments = globalThis as unknown as { wonderboxPayments?: PaymentProvider };

function build(): PaymentProvider {
  if (env.PAYMENT_PROVIDER === 'stripe') {
    return new StripePaymentProvider(
      env.STRIPE_SECRET_KEY ?? '',
      env.STRIPE_WEBHOOK_SECRET ?? '',
      env.APP_URL,
    );
  }
  return new MockPaymentProvider(env.MOCK_PAYMENT_WEBHOOK_SECRET);
}

export function paymentProvider(): PaymentProvider {
  globalForPayments.wonderboxPayments ??= build();
  return globalForPayments.wonderboxPayments;
}
