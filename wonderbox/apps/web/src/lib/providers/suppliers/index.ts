import type { SupplierChannel } from '@prisma/client';
import { MockSupplierChannel } from './mock.ts';
import type { SupplierChannelAdapter } from './types.ts';

export * from './types.ts';
export { MockSupplierChannel, renderPurchaseOrder } from './mock.ts';

const globalForSuppliers = globalThis as unknown as {
  wonderboxSupplierChannels?: Map<SupplierChannel, SupplierChannelAdapter>;
};

/**
 * Resolves the adapter for a supplier's channel.
 *
 * Only the mock ships. EMAIL wants a transactional-mail adapter, CSV wants a
 * drop location, API wants a per-distributor client — each one class with one
 * method, and nothing above this line changes.
 */
export function supplierChannel(channel: SupplierChannel): SupplierChannelAdapter {
  globalForSuppliers.wonderboxSupplierChannels ??= new Map();
  const cache = globalForSuppliers.wonderboxSupplierChannels;
  let adapter = cache.get(channel);
  if (!adapter) {
    adapter = new MockSupplierChannel();
    cache.set(channel, adapter);
  }
  return adapter;
}
