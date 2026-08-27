import { createHash } from 'node:crypto';
import type { BillingPeriod, PaymentMethod } from '@khidma/shared';
import type { Env } from '../env.js';

export interface CheckoutRequest {
  reference: string;
  grossCentimes: number;
  method: PaymentMethod;
  period: BillingPeriod;
  planSlug: string;
  returnUrl?: string;
  customerPhone: string;
}

export interface CheckoutSession {
  /** Where the app should send the pro to pay, or null when none is needed. */
  redirectUrl: string | null;
  providerRef: string;
  /** True when the payment settled without a redirect (mock, cash, transfer). */
  settledImmediately: boolean;
}

export interface PaymentAdapter {
  createCheckout(request: CheckoutRequest): Promise<CheckoutSession>;
  /** Verifies a gateway callback really came from the gateway. */
  verifyCallbackSignature(payload: Record<string, string>, signature: string): boolean;
}

/**
 * Used in development and by the automated tests: no network call, and the
 * subscription activates as soon as checkout is requested.
 */
class MockPaymentAdapter implements PaymentAdapter {
  async createCheckout(request: CheckoutRequest): Promise<CheckoutSession> {
    return {
      redirectUrl: null,
      providerRef: `mock_${request.reference}`,
      settledImmediately: true,
    };
  }

  verifyCallbackSignature(): boolean {
    return true;
  }
}

/**
 * CMI — the Moroccan interbank card gateway. Checkout is a form POST to the
 * bank's 3-D Secure page, and the callback is signed with a shared store key
 * hashed over the alphabetically ordered parameters.
 *
 * Offline methods (bank transfer, cash) never reach the gateway: they create a
 * pending payment that the Khidma team marks as paid once the funds land.
 */
class CmiPaymentAdapter implements PaymentAdapter {
  constructor(private readonly env: Env) {}

  async createCheckout(request: CheckoutRequest): Promise<CheckoutSession> {
    if (request.method !== 'CMI_CARD') {
      return {
        redirectUrl: null,
        providerRef: `offline_${request.reference}`,
        settledImmediately: false,
      };
    }

    const params = new URLSearchParams({
      clientid: this.env.CMI_MERCHANT_ID ?? '',
      oid: request.reference,
      // CMI expects a decimal amount in dirhams, not centimes.
      amount: (request.grossCentimes / 100).toFixed(2),
      currency: '504', // ISO 4217 numeric code for the Moroccan dirham.
      storetype: '3D_PAY_HOSTING',
      trantype: 'PreAuth',
      rnd: request.reference,
      lang: 'fr',
      ...(request.returnUrl ? { okUrl: request.returnUrl, failUrl: request.returnUrl } : {}),
    });

    return {
      redirectUrl: `${this.env.CMI_GATEWAY_URL}?${params.toString()}`,
      providerRef: request.reference,
      settledImmediately: false,
    };
  }

  verifyCallbackSignature(payload: Record<string, string>, signature: string): boolean {
    const storeKey = this.env.CMI_STORE_KEY;
    if (!storeKey) return false;
    const plaintext = Object.keys(payload)
      .filter((key) => key.toLowerCase() !== 'hash' && key.toLowerCase() !== 'encoding')
      .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
      .map((key) => (payload[key] ?? '').replace(/\\/g, '\\\\').replace(/\|/g, '\\|'))
      .concat(storeKey)
      .join('|');
    const expected = createHash('sha512').update(plaintext, 'utf8').digest('base64');
    return expected === signature;
  }
}

export function createPaymentAdapter(env: Env): PaymentAdapter {
  return env.PAYMENT_PROVIDER === 'cmi' ? new CmiPaymentAdapter(env) : new MockPaymentAdapter();
}
