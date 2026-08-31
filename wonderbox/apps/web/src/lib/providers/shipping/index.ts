import { env } from '../../env.ts';
import { MockShippingProvider } from './mock.ts';
import type { ShippingProvider } from './types.ts';

export * from './types.ts';
export { MockShippingProvider } from './mock.ts';

const globalForShipping = globalThis as unknown as { wonderboxShipping?: ShippingProvider };

export function shippingProvider(): ShippingProvider {
  // Only the mock ships in the MVP; a PostNL adapter implements the same port.
  globalForShipping.wonderboxShipping ??= new MockShippingProvider(
    env.SHIPPING_WEBHOOK_SECRET,
    env.SHIPPING_FLAT_RATE_CENTS,
    env.SHIPPING_ORIGIN_COUNTRY,
  );
  return globalForShipping.wonderboxShipping;
}
