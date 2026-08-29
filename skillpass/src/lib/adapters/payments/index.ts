import { env } from '../../env';
import { MockPaymentProvider } from './mock';
import { StripePaymentProvider } from './stripe';
import type { PaymentProvider } from './types';

let instance: PaymentProvider | null = null;

export function paymentProvider(): PaymentProvider {
  if (instance) return instance;
  const config = env();
  if (config.PAYMENT_PROVIDER === 'stripe') {
    if (!config.STRIPE_SECRET_KEY || !config.STRIPE_WEBHOOK_SECRET) {
      throw new Error('PAYMENT_PROVIDER=stripe requires STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET');
    }
    instance = new StripePaymentProvider(config.STRIPE_SECRET_KEY, config.STRIPE_WEBHOOK_SECRET);
  } else {
    instance = new MockPaymentProvider(config.PAYMENT_WEBHOOK_SECRET);
  }
  return instance;
}

export function resetPaymentProvider(): void {
  instance = null;
}

export * from './types';
export { MockPaymentProvider } from './mock';
export { StripePaymentProvider } from './stripe';
