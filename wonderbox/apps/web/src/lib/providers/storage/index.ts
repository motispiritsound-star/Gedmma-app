import { env } from '../../env.ts';
import { LocalObjectStorage } from './local.ts';
import type { ObjectStorage } from './types.ts';

export * from './types.ts';
export { LocalObjectStorage } from './local.ts';

const globalForStorage = globalThis as unknown as { wonderboxStorage?: ObjectStorage };

/**
 * Only the local driver ships in the MVP. An S3 driver implements the same
 * five methods; `sign()` would return a presigned URL instead of an app route.
 */
export function objectStorage(): ObjectStorage {
  globalForStorage.wonderboxStorage ??= new LocalObjectStorage(
    env.STORAGE_LOCAL_ROOT,
    env.STORAGE_SIGNING_SECRET,
    env.STORAGE_URL_TTL_SECONDS,
  );
  return globalForStorage.wonderboxStorage;
}
