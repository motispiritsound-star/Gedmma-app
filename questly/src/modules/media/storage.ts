import "server-only";
import { createHash } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

export type StoredObject = { key: string; sizeBytes: number; checksum: string };

/**
 * The only storage surface the application uses. Private family media never
 * goes through a public bucket URL: bytes are read back through an
 * authenticated route, which is why `get` returns a buffer rather than a URL.
 */
export interface MediaStorage {
  readonly kind: "local" | "s3";
  put(key: string, body: Buffer, contentType: string): Promise<StoredObject>;
  get(key: string): Promise<Buffer | null>;
  delete(key: string): Promise<void>;
}

function assertSafeKey(key: string): void {
  if (!/^[a-zA-Z0-9/_-]+\.[a-z0-9]{2,5}$/.test(key) || key.includes("..")) {
    throw new Error("Unsafe storage key.");
  }
}

export class LocalDiskStorage implements MediaStorage {
  readonly kind = "local" as const;

  constructor(private readonly root: string) {}

  private resolve(key: string): string {
    assertSafeKey(key);
    const full = path.resolve(this.root, key);
    const root = path.resolve(this.root);
    // Defence in depth: even with a validated key, never escape the root.
    if (!full.startsWith(root + path.sep)) throw new Error("Unsafe storage key.");
    return full;
  }

  async put(key: string, body: Buffer): Promise<StoredObject> {
    const full = this.resolve(key);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, body, { mode: 0o600 });
    return { key, sizeBytes: body.byteLength, checksum: createHash("sha256").update(body).digest("hex") };
  }

  async get(key: string): Promise<Buffer | null> {
    try {
      return await readFile(this.resolve(key));
    } catch {
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    await rm(this.resolve(key), { force: true });
  }
}

/**
 * Placeholder for a production object store. Not implemented in the MVP - the
 * point of the abstraction is that implementing it changes nothing else.
 * See SECURITY_AND_PRIVACY.md ("Known limitations").
 */
export class S3MediaStorage implements MediaStorage {
  readonly kind = "s3" as const;

  private fail(): never {
    throw new Error(
      "MEDIA_DRIVER=s3 is not implemented in this MVP. Use MEDIA_DRIVER=local or implement S3MediaStorage.",
    );
  }

  async put(): Promise<StoredObject> {
    this.fail();
  }
  async get(): Promise<Buffer | null> {
    this.fail();
  }
  async delete(): Promise<void> {
    this.fail();
  }
}

let cached: MediaStorage | null = null;

export function mediaStorage(): MediaStorage {
  if (cached) return cached;
  const config = env();
  if (config.MEDIA_DRIVER === "s3") {
    logger.warn("media.s3_driver_selected_but_not_implemented");
    cached = new S3MediaStorage();
  } else {
    // The directory is configuration, not user input; the ignore comment keeps
    // Turbopack from tracing the whole project into the server bundle.
    cached = new LocalDiskStorage(path.resolve(/* turbopackIgnore: true */ process.cwd(), config.MEDIA_LOCAL_DIR));
  }
  return cached;
}

export function setMediaStorage(storage: MediaStorage | null): void {
  cached = storage;
}
