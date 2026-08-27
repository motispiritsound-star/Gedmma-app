import { config } from '../config.ts';
import { sleep } from '../util/pool.ts';

const lastRequestAt = new Map<string, number>();

/** Houdt per host minimaal `perHostDelayMs` tussen requests aan. */
async function throttle(host: string, extraDelayMs = 0): Promise<void> {
  const wait = Math.max(config.perHostDelayMs, extraDelayMs);
  const previous = lastRequestAt.get(host) ?? 0;
  const elapsed = Date.now() - previous;
  if (elapsed < wait) await sleep(wait - elapsed);
  lastRequestAt.set(host, Date.now());
}

export type FetchResult = {
  ok: boolean;
  url: string;
  finalUrl: string;
  status: number | null;
  headers: Record<string, string>;
  body: string;
  bytes: number;
  truncated: boolean;
  ttfbMs: number | null;
  totalMs: number | null;
  redirects: string[];
  /** https werkte niet (certificaat, geen listener); we vielen terug op http. */
  httpsFailed: boolean;
  tlsError: string | null;
  error: string | null;
};

const EMPTY = {
  headers: {} as Record<string, string>,
  body: '', bytes: 0, truncated: false,
  ttfbMs: null, totalMs: null, redirects: [] as string[],
  httpsFailed: false, tlsError: null, error: null,
};

function headersToObject(headers: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  headers.forEach((value, key) => { out[key.toLowerCase()] = value; });
  return out;
}

async function readCapped(response: Response): Promise<{ text: string; bytes: number; truncated: boolean }> {
  if (!response.body) return { text: '', bytes: 0, truncated: false };
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  let truncated = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    bytes += value.byteLength;
    chunks.push(value);
    if (bytes >= config.maxBytes) {
      truncated = true;
      await reader.cancel().catch(() => {});
      break;
    }
  }

  const buffer = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));
  const charset = /charset=([\w-]+)/i.exec(response.headers.get('content-type') ?? '')?.[1]?.toLowerCase();
  const encoding = charset === 'iso-8859-1' || charset === 'windows-1252' ? 'latin1' : 'utf8';
  return { text: buffer.toString(encoding), bytes, truncated };
}

async function fetchOnce(target: string): Promise<FetchResult> {
  const startedAt = Date.now();
  const redirects: string[] = [];
  let current = target;

  for (let hop = 0; hop < 6; hop++) {
    const response = await fetch(current, {
      headers: {
        'user-agent': config.userAgent,
        accept: 'text/html,application/xhtml+xml,*/*;q=0.8',
        'accept-language': 'nl,en;q=0.8',
      },
      redirect: 'manual',
      signal: AbortSignal.timeout(config.timeoutMs),
    });

    const ttfbMs = Date.now() - startedAt;
    const location = response.headers.get('location');
    if (response.status >= 300 && response.status < 400 && location) {
      const next = new URL(location, current).toString();
      redirects.push(next);
      // Body van een redirect negeren we; verbinding netjes sluiten.
      await response.body?.cancel().catch(() => {});
      current = next;
      continue;
    }

    const { text, bytes, truncated } = await readCapped(response);
    return {
      ...EMPTY,
      ok: response.ok,
      url: target,
      finalUrl: current,
      status: response.status,
      headers: headersToObject(response.headers),
      body: text,
      bytes,
      truncated,
      ttfbMs,
      totalMs: Date.now() - startedAt,
      redirects,
    };
  }

  return { ...EMPTY, ok: false, url: target, finalUrl: current, status: null, redirects, error: 'te veel redirects' };
}

const describe = (error: unknown): string => {
  const message = error instanceof Error ? (error.cause instanceof Error ? error.cause.message : error.message) : String(error);
  if (/timeout|aborted/i.test(message)) return 'timeout';
  if (/ENOTFOUND|EAI_AGAIN|getaddrinfo/i.test(message)) return 'domein bestaat niet (DNS)';
  if (/ECONNREFUSED/i.test(message)) return 'verbinding geweigerd';
  if (/ECONNRESET/i.test(message)) return 'verbinding verbroken';
  if (/CERT|SSL|self.signed|ERR_TLS/i.test(message)) return `certificaatprobleem: ${message}`;
  return message;
};

const isTlsError = (message: string): boolean => /certificaat|CERT|SSL|TLS/i.test(message);

/**
 * Haalt een pagina op. Probeert eerst https; als dat faalt wordt http geprobeerd,
 * zodat we onderscheid kunnen maken tussen "site is offline" en "site heeft geen https".
 */
export async function fetchPage(target: string, opts: { crawlDelayMs?: number } = {}): Promise<FetchResult> {
  const url = new URL(target);
  await throttle(url.hostname, opts.crawlDelayMs);

  try {
    return await fetchOnce(url.toString());
  } catch (error) {
    const message = describe(error);
    const tlsError = isTlsError(message) ? message : null;

    if (url.protocol === 'https:') {
      const fallback = new URL(url.toString());
      fallback.protocol = 'http:';
      await throttle(url.hostname, opts.crawlDelayMs);
      try {
        const result = await fetchOnce(fallback.toString());
        return { ...result, url: target, httpsFailed: true, tlsError };
      } catch (secondError) {
        return { ...EMPTY, ok: false, url: target, finalUrl: target, status: null, httpsFailed: true, tlsError, error: describe(secondError) };
      }
    }
    return { ...EMPTY, ok: false, url: target, finalUrl: target, status: null, tlsError, error: message };
  }
}

/** Lichte HEAD/GET-check of een pad bestaat (voor sitemap.xml, favicon e.d.). */
export async function exists(target: string): Promise<boolean> {
  try {
    const response = await fetch(target, {
      method: 'GET',
      headers: { 'user-agent': config.userAgent, range: 'bytes=0-2048' },
      redirect: 'follow',
      signal: AbortSignal.timeout(Math.min(config.timeoutMs, 8_000)),
    });
    await response.body?.cancel().catch(() => {});
    return response.ok || response.status === 206;
  } catch {
    return false;
  }
}
