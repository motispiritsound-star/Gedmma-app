/**
 * Private object storage. Audio, invoices and shipping labels are never
 * publicly addressable: callers get a short-lived signed reference that the
 * application itself resolves, so revoking access is immediate.
 */
export interface StoredObject {
  readonly key: string;
  readonly size: number;
  readonly contentType: string;
  readonly checksum: string;
}

export interface SignedRef {
  /** An application URL, not a provider URL. */
  readonly url: string;
  readonly expiresAt: Date;
}

export interface ObjectStorage {
  readonly name: string;
  put(key: string, body: Uint8Array | string, contentType: string): Promise<StoredObject>;
  get(key: string): Promise<{ body: Uint8Array; contentType: string } | null>;
  head(key: string): Promise<StoredObject | null>;
  delete(key: string): Promise<void>;
  list(prefix: string): Promise<string[]>;
  /** Signs a reference valid for `ttlSeconds`. */
  sign(key: string, ttlSeconds?: number): Promise<SignedRef>;
  /** Verifies a signature produced by `sign`. Returns the key or null. */
  verify(key: string, expires: string, signature: string): boolean;
}
