import { createHash, createHmac } from 'node:crypto';
import { unwrap } from '../data/kraken.js';

/**
 * Kraken's private REST API.
 *
 * Unlike the IBKR gateway, this needs real credentials, and that changes what has
 * to be careful here. The key and secret are read **only from the environment** —
 * never from a command-line flag, because flags end up in shell history and in the
 * output of `ps` for every other user on the machine. Neither value is ever
 * logged, stored, or included in an error message, and the secret leaves this file
 * only as an HMAC key.
 *
 * Before creating a key: switch **off** "Withdraw Funds" and "Deposit Funds" on
 * it. A key that can only trade turns a compromise into an annoyance. A key that
 * can withdraw turns it into a total loss, and no amount of care in this file
 * substitutes for that checkbox.
 */
const PRIVATE_BASE = 'https://api.kraken.com';
const API_VERSION = '/0/private';

/** Kraken's counter-based limiter is tier-dependent; this is a safe floor. */
const MIN_REQUEST_GAP_MS = 350;

export interface KrakenCredentials {
  key: string;
  /** Base64, exactly as Kraken shows it. Used as an HMAC key and nothing else. */
  secret: string;
}

/**
 * Read credentials from the environment, or explain precisely what is missing.
 *
 * Returns null rather than throwing when nothing is set, so read-only commands
 * work without credentials at all.
 */
export function credentialsFromEnv(env: NodeJS.ProcessEnv = process.env): KrakenCredentials | null {
  const key = env.KRAKEN_API_KEY?.trim();
  const secret = env.KRAKEN_API_SECRET?.trim();
  if (!key && !secret) return null;
  if (!key || !secret) {
    throw new Error(
      'Both KRAKEN_API_KEY and KRAKEN_API_SECRET must be set, and only one is. ' +
        'Set them in the environment — never as command-line flags, which land in ' +
        'shell history and in `ps` output.',
    );
  }
  return { key, secret };
}

/**
 * Sign a Kraken private request.
 *
 * `HMAC-SHA512(base64decode(secret), path + SHA256(nonce + postData))`, base64
 * encoded. Exported so the test can check it against Kraken's own published
 * example rather than against itself.
 */
export function signRequest(
  path: string,
  nonce: string,
  postData: string,
  secretBase64: string,
): string {
  const hashed = createHash('sha256').update(nonce + postData).digest();
  return createHmac('sha512', Buffer.from(secretBase64, 'base64'))
    .update(path)
    .update(hashed)
    .digest('base64');
}

export interface KrakenOrderRequest {
  pair: string;
  type: 'buy' | 'sell';
  /** Market orders only; see `krakenSpot` for why the taker fee is the honest one. */
  ordertype: 'market';
  /** In base units, already rounded to the pair's allowed decimals. */
  volume: string;
  /**
   * Ask Kraken to check the order and not place it.
   *
   * This is better than a local dry run: the order is validated by the exchange,
   * so decimals, minimums, pair names and permissions are all checked for real,
   * and nothing is executed. Kraken has no paper-trading account for spot, so this
   * is the closest thing that exists.
   */
  validate?: boolean;
  /** Your own reference, echoed back. Kraken requires a 32-bit unsigned integer. */
  userref?: number;
}

export interface KrakenOrderResult {
  /** Kraken's description of what it understood. Present even when validating. */
  description: string;
  /** Transaction IDs. Empty when the order was only validated. */
  txids: string[];
}

export class KrakenClient {
  private readonly credentials: KrakenCredentials | null;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private lastRequestAt = 0;
  private lastNonce = 0;

  constructor(options: {
    credentials?: KrakenCredentials | null;
    baseUrl?: string;
    timeoutMs?: number;
  } = {}) {
    this.credentials = options.credentials ?? null;
    this.baseUrl = options.baseUrl ?? PRIVATE_BASE;
    this.timeoutMs = options.timeoutMs ?? 15_000;
  }

  get hasCredentials(): boolean {
    return this.credentials !== null;
  }

  /**
   * Balances per asset, as numbers.
   *
   * Kraken names assets its own way — `ZEUR` for euro, `XXBT` for bitcoin — and
   * the names differ from the pair names. `fetchPair` gives the `base` and `quote`
   * codes to look up here.
   */
  async balances(): Promise<Record<string, number>> {
    const result = await this.call<Record<string, string>>('/Balance', {});
    const out: Record<string, number> = {};
    for (const [asset, amount] of Object.entries(result)) {
      const value = Number(amount);
      if (Number.isFinite(value)) out[asset] = value;
    }
    return out;
  }

  /** Account equity in the account's own base currency, as Kraken computes it. */
  async tradeBalance(): Promise<{ equity: number; balance: number }> {
    const result = await this.call<Record<string, string>>('/TradeBalance', {});
    return {
      equity: Number(result.eb ?? result.e ?? 0),
      balance: Number(result.tb ?? 0),
    };
  }

  async openOrders(): Promise<Record<string, unknown>> {
    const result = await this.call<{ open?: Record<string, unknown> }>('/OpenOrders', {});
    return result.open ?? {};
  }

  async addOrder(order: KrakenOrderRequest): Promise<KrakenOrderResult> {
    const body: Record<string, string> = {
      pair: order.pair,
      type: order.type,
      ordertype: order.ordertype,
      volume: order.volume,
    };
    if (order.validate === true) body.validate = 'true';
    if (order.userref !== undefined) body.userref = String(order.userref);

    const result = await this.call<{ descr?: { order?: string }; txid?: string[] }>(
      '/AddOrder',
      body,
    );
    return {
      description: result.descr?.order ?? '',
      txids: Array.isArray(result.txid) ? result.txid : [],
    };
  }

  async cancelOrder(txid: string): Promise<void> {
    await this.call('/CancelOrder', { txid });
  }

  /**
   * One signed request.
   *
   * The nonce must strictly increase for a given key, forever. Microseconds from
   * the clock satisfy that on its own, and the guard below covers two calls
   * landing in the same microsecond — but nothing here can protect a key used by
   * two processes at once, which is why one key should drive one bot.
   */
  private async call<T>(endpoint: string, params: Record<string, string>): Promise<T> {
    if (!this.credentials) {
      throw new Error(
        `${endpoint} needs credentials. Set KRAKEN_API_KEY and KRAKEN_API_SECRET in the ` +
          `environment, from a key with withdrawals disabled.`,
      );
    }

    const gap = Date.now() - this.lastRequestAt;
    if (gap < MIN_REQUEST_GAP_MS) {
      await new Promise((resolve) => setTimeout(resolve, MIN_REQUEST_GAP_MS - gap));
    }
    this.lastRequestAt = Date.now();

    const micros = Date.now() * 1000;
    const nonce = String(micros > this.lastNonce ? micros : this.lastNonce + 1);
    this.lastNonce = Number(nonce);

    // The nonce has to be the first field, and the string that is signed has to be
    // byte-for-byte the string that is sent — so the body is built once and reused.
    const body = new URLSearchParams({ nonce, ...params }).toString();
    const path = `${API_VERSION}${endpoint}`;
    const signature = signRequest(path, nonce, body, this.credentials.secret);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'API-Key': this.credentials.key,
          'API-Sign': signature,
          'content-type': 'application/x-www-form-urlencoded',
          accept: 'application/json',
        },
        body,
      });

      const text = await response.text();
      if (!response.ok) {
        // Kraken's own error text is useful and contains no credentials.
        throw new Error(`Kraken ${endpoint} answered ${response.status}: ${text.slice(0, 300)}`);
      }
      return unwrap<T>(JSON.parse(text), endpoint);
    } finally {
      clearTimeout(timer);
    }
  }
}
