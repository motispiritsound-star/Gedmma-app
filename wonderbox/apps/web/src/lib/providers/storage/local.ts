import { createHash, createHmac } from 'node:crypto';
import { mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join, normalize, resolve, sep } from 'node:path';
import { safeEqual } from '../../crypto.ts';
import type { ObjectStorage, SignedRef, StoredObject } from './types.ts';

/**
 * Filesystem-backed storage for local development and tests. Bytes land in
 * `.storage/` (git-ignored) and are still only reachable through a signed
 * application route, so the development experience matches production.
 */
export class LocalObjectStorage implements ObjectStorage {
  readonly name = 'local';
  private readonly root: string;

  constructor(
    root: string,
    private readonly signingSecret: string,
    private readonly defaultTtlSeconds: number,
    private readonly publicPathPrefix = '/api/storage',
  ) {
    this.root = resolve(process.cwd(), root);
  }

  private pathFor(key: string): string {
    // A key must never escape the storage root, whatever a caller passes in.
    const cleaned = normalize(key).replace(/^(\.\.(\/|\\|$))+/, '');
    const full = resolve(this.root, cleaned);
    if (full !== this.root && !full.startsWith(this.root + sep)) {
      throw new Error(`Refusing to access storage key outside the root: ${key}`);
    }
    return full;
  }

  async put(key: string, body: Uint8Array | string, contentType: string): Promise<StoredObject> {
    const path = this.pathFor(key);
    await mkdir(dirname(path), { recursive: true });
    const bytes = typeof body === 'string' ? Buffer.from(body, 'utf8') : Buffer.from(body);
    await writeFile(path, bytes);
    await writeFile(`${path}.meta.json`, JSON.stringify({ contentType }), 'utf8');
    return {
      key,
      size: bytes.byteLength,
      contentType,
      checksum: createHash('sha256').update(bytes).digest('hex'),
    };
  }

  async get(key: string): Promise<{ body: Uint8Array; contentType: string } | null> {
    const path = this.pathFor(key);
    try {
      const body = await readFile(path);
      let contentType = 'application/octet-stream';
      try {
        const meta = JSON.parse(await readFile(`${path}.meta.json`, 'utf8')) as {
          contentType?: string;
        };
        if (meta.contentType) contentType = meta.contentType;
      } catch {
        // No sidecar: fall back to the default content type.
      }
      return { body: new Uint8Array(body), contentType };
    } catch {
      return null;
    }
  }

  async head(key: string): Promise<StoredObject | null> {
    const object = await this.get(key);
    if (!object) return null;
    return {
      key,
      size: object.body.byteLength,
      contentType: object.contentType,
      checksum: createHash('sha256').update(object.body).digest('hex'),
    };
  }

  async delete(key: string): Promise<void> {
    const path = this.pathFor(key);
    await rm(path, { force: true });
    await rm(`${path}.meta.json`, { force: true });
  }

  async list(prefix: string): Promise<string[]> {
    const base = this.pathFor(prefix);
    try {
      const info = await stat(base);
      if (!info.isDirectory()) return [prefix];
    } catch {
      return [];
    }
    const entries = await readdir(base, { withFileTypes: true, recursive: true });
    return entries
      .filter((entry) => entry.isFile() && !entry.name.endsWith('.meta.json'))
      .map((entry) => join(prefix, entry.name).split(sep).join('/'));
  }

  async sign(key: string, ttlSeconds = this.defaultTtlSeconds): Promise<SignedRef> {
    const expires = Math.floor(Date.now() / 1000) + ttlSeconds;
    const signature = this.signature(key, String(expires));
    const params = new URLSearchParams({ key, expires: String(expires), sig: signature });
    return {
      url: `${this.publicPathPrefix}?${params.toString()}`,
      expiresAt: new Date(expires * 1000),
    };
  }

  verify(key: string, expires: string, signature: string): boolean {
    const deadline = Number(expires);
    if (!Number.isFinite(deadline) || deadline * 1000 < Date.now()) return false;
    return safeEqual(this.signature(key, expires), signature);
  }

  private signature(key: string, expires: string): string {
    return createHmac('sha256', this.signingSecret).update(`${key}:${expires}`).digest('hex');
  }
}
