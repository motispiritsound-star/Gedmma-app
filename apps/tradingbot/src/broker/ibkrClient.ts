import { request as httpsRequest, type RequestOptions } from 'node:https';
import { URL } from 'node:url';

/**
 * A minimal client for Interactive Brokers' Client Portal Web API.
 *
 * Two things about this API shape everything below.
 *
 * It runs against a gateway *you* start on your own machine — IBKR's Client
 * Portal Gateway, or TWS with the Web API enabled — and you log into that gateway
 * in a browser. So there are no API keys anywhere in this repository and none to
 * leak: the session lives in the gateway, and this client only talks to
 * localhost. That is a genuinely good property and it is worth not spoiling.
 *
 * The gateway presents a self-signed certificate, by design, and Node will refuse
 * it. Verification is therefore disabled — but only for loopback addresses, and
 * `assertLoopback` enforces that, because "the gateway needs it" is exactly the
 * reasoning that ends up disabling TLS verification against a remote host.
 */

/** IBKR's documented ceiling is 10 requests a second per username. */
const MIN_REQUEST_GAP_MS = 110;

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

export interface IbkrClientOptions {
  /** Gateway base URL. The default is where the Client Portal Gateway listens. */
  baseUrl?: string;
  timeoutMs?: number;
  log?: (line: string) => void;
}

export interface AuthStatus {
  authenticated: boolean;
  connected: boolean;
  /** True when another session has taken over, which silently breaks trading. */
  competing: boolean;
  message: string;
}

export interface IbkrContract {
  conid: number;
  symbol: string;
  description: string;
  exchange: string;
  currency: string;
  secType: string;
}

export interface IbkrPosition {
  conid: number;
  /** Signed: negative is short. */
  position: number;
  marketPrice: number;
  marketValue: number;
  currency: string;
  description: string;
}

export interface IbkrLedger {
  currency: string;
  cash: number;
  netLiquidation: number;
}

export interface PlacedOrder {
  orderId: string;
  status: string;
  /** Whatever the gateway said, kept verbatim for the journal. */
  raw: unknown;
}

/** Raised for anything the gateway refused, with its own words attached. */
export class IbkrError extends Error {
  readonly status: number;
  readonly body: string;

  constructor(message: string, status: number, body: string) {
    super(message);
    this.name = 'IbkrError';
    this.status = status;
    this.body = body;
  }
}

/**
 * Refuse to talk to anything that is not the loopback interface.
 *
 * This client disables certificate verification, which is only defensible for a
 * gateway on this machine presenting its own self-signed certificate. Pointed at
 * a remote host the same code would accept any certificate from anyone, so it
 * does not point at one.
 */
export function assertLoopback(baseUrl: string): URL {
  const url = new URL(baseUrl);
  if (!LOOPBACK_HOSTS.has(url.hostname)) {
    throw new Error(
      `The IBKR gateway URL must be on localhost, got "${url.hostname}". This client ` +
        `accepts the gateway's self-signed certificate, which is only safe over ` +
        `loopback. To reach a gateway on another machine, tunnel it to localhost ` +
        `(ssh -L 5000:localhost:5000 ...) rather than pointing this at it directly.`,
    );
  }
  return url;
}

export class IbkrClient {
  private readonly base: URL;
  private readonly timeoutMs: number;
  private readonly log: (line: string) => void;
  private lastRequestAt = 0;
  private accountsPrimed = false;

  constructor(options: IbkrClientOptions = {}) {
    this.base = assertLoopback(options.baseUrl ?? 'https://localhost:5000/v1/api');
    this.timeoutMs = options.timeoutMs ?? 15_000;
    this.log = options.log ?? (() => {});
  }

  get baseUrl(): string {
    return this.base.toString();
  }

  /**
   * Whether the gateway is logged in and usable.
   *
   * `competing` is the field people miss. Logging into Client Portal or TWS
   * elsewhere with the same username takes the session over, and from then on
   * requests keep succeeding while orders quietly do not reach the exchange.
   */
  async authStatus(): Promise<AuthStatus> {
    const body = await this.call<Record<string, unknown>>('POST', '/iserver/auth/status');
    return {
      authenticated: body.authenticated === true,
      connected: body.connected === true,
      competing: body.competing === true,
      message: typeof body.message === 'string' ? body.message : '',
    };
  }

  /** Keeps the brokerage session from timing out. Call it every few minutes. */
  async tickle(): Promise<void> {
    await this.call('POST', '/tickle');
  }

  /** Account IDs this login can act for. Paper accounts are prefixed `DU`. */
  async accounts(): Promise<string[]> {
    const body = await this.call<unknown>('GET', '/portfolio/accounts');
    if (!Array.isArray(body)) return [];
    return body
      .map((entry) => {
        const record = entry as Record<string, unknown>;
        const id = record.accountId ?? record.id;
        return typeof id === 'string' ? id : null;
      })
      .filter((id): id is string => id !== null);
  }

  /**
   * Cash and net liquidation value for one account.
   *
   * Equity comes from the broker rather than being tracked locally. A bot that
   * keeps its own idea of the balance will disagree with the statement the moment
   * a dividend, a fee or a manual trade lands, and it will trade on its own
   * version.
   */
  async ledger(accountId: string): Promise<IbkrLedger[]> {
    const body = await this.call<Record<string, unknown>>(
      'GET',
      `/portfolio/${encodeURIComponent(accountId)}/ledger`,
    );
    const out: IbkrLedger[] = [];
    for (const [currency, value] of Object.entries(body)) {
      const record = value as Record<string, unknown>;
      const cash = Number(record.cashbalance);
      const net = Number(record.netliquidationvalue ?? record.netliquidation);
      if (!Number.isFinite(cash) && !Number.isFinite(net)) continue;
      out.push({
        currency,
        cash: Number.isFinite(cash) ? cash : 0,
        netLiquidation: Number.isFinite(net) ? net : 0,
      });
    }
    return out;
  }

  /** Open positions, paged until the gateway stops returning rows. */
  async positions(accountId: string, maxPages = 10): Promise<IbkrPosition[]> {
    const out: IbkrPosition[] = [];
    for (let page = 0; page < maxPages; page += 1) {
      const body = await this.call<unknown>(
        'GET',
        `/portfolio/${encodeURIComponent(accountId)}/positions/${page}`,
      );
      if (!Array.isArray(body) || body.length === 0) break;
      for (const entry of body) {
        const record = entry as Record<string, unknown>;
        out.push({
          conid: Number(record.conid),
          position: Number(record.position),
          marketPrice: Number(record.mktPrice),
          marketValue: Number(record.mktValue),
          currency: typeof record.currency === 'string' ? record.currency : '',
          description:
            typeof record.contractDesc === 'string'
              ? record.contractDesc
              : typeof record.ticker === 'string'
                ? record.ticker
                : '',
        });
      }
      if (body.length < 30) break;
    }
    return out.filter((p) => Number.isFinite(p.conid));
  }

  /** Resolve a ticker to the contract IDs the rest of the API speaks in. */
  async searchContracts(symbol: string): Promise<IbkrContract[]> {
    const body = await this.call<unknown>('POST', '/iserver/secdef/search', {
      symbol: symbol.toUpperCase(),
      name: false,
    });
    if (!Array.isArray(body)) return [];
    return body
      .map((entry) => {
        const record = entry as Record<string, unknown>;
        return {
          conid: Number(record.conid),
          symbol: typeof record.symbol === 'string' ? record.symbol : symbol.toUpperCase(),
          description:
            typeof record.companyHeader === 'string'
              ? record.companyHeader
              : typeof record.companyName === 'string'
                ? record.companyName
                : '',
          exchange: typeof record.description === 'string' ? record.description : '',
          currency: typeof record.currency === 'string' ? record.currency : '',
          secType: typeof record.secType === 'string' ? record.secType : '',
        };
      })
      .filter((c) => Number.isFinite(c.conid));
  }

  /**
   * Historical bars.
   *
   * `outsideRth` defaults to false, so the bars are regular trading hours only.
   * Mixing extended-hours bars into a backtest of a strategy you would run at the
   * open is a quiet way to test a different strategy: the pre-market prints are
   * thin, wide, and not where your order would have gone.
   */
  async history(options: {
    conid: number;
    /** IBKR's own period grammar: 1d, 1w, 1m, 1y, and so on. */
    period: string;
    /** IBKR's own bar grammar: 1min, 5mins, 1h, 1d, 1w. */
    bar: string;
    outsideRth?: boolean;
  }): Promise<{ openTime: number; open: number; high: number; low: number; close: number; volume: number }[]> {
    await this.primeAccounts();
    const query = new URLSearchParams({
      conid: String(options.conid),
      period: options.period,
      bar: options.bar,
      outsideRth: String(options.outsideRth ?? false),
    });
    const body = await this.call<Record<string, unknown>>(
      'GET',
      `/iserver/marketdata/history?${query.toString()}`,
    );
    const rows = Array.isArray(body.data) ? body.data : [];
    return rows
      .map((row) => {
        const record = row as Record<string, unknown>;
        return {
          openTime: Number(record.t),
          open: Number(record.o),
          high: Number(record.h),
          low: Number(record.l),
          close: Number(record.c),
          volume: Number(record.v ?? 0),
        };
      })
      .filter(
        (candle) =>
          Number.isFinite(candle.openTime) &&
          Number.isFinite(candle.open) &&
          Number.isFinite(candle.close),
      );
  }

  /**
   * Submit one order, answering whatever the gateway asks before it accepts.
   *
   * IBKR interposes confirmation prompts — price caps, order size, market data
   * warnings — and an order is not placed until each is replied to. A client that
   * ignores the reply step looks like it is trading and is not, which is the worst
   * possible failure mode for a bot.
   */
  async placeOrder(
    accountId: string,
    order: {
      conid: number;
      side: 'BUY' | 'SELL';
      quantity: number;
      orderType: 'MKT' | 'LMT';
      tif: 'DAY' | 'GTC' | 'IOC';
      price?: number;
      /** Your own identifier, echoed back by IBKR. Useful for de-duplication. */
      clientOrderId?: string;
    },
    maxReplies = 5,
  ): Promise<PlacedOrder> {
    if (!Number.isFinite(order.quantity) || order.quantity <= 0) {
      throw new Error(`Order quantity must be positive, got ${order.quantity}`);
    }
    if (order.orderType === 'LMT' && !Number.isFinite(order.price ?? Number.NaN)) {
      throw new Error('A limit order needs a price');
    }

    const payload: Record<string, unknown> = {
      conid: order.conid,
      orderType: order.orderType,
      side: order.side,
      tif: order.tif,
      quantity: order.quantity,
    };
    if (order.price !== undefined) payload.price = order.price;
    if (order.clientOrderId !== undefined) payload.cOID = order.clientOrderId;

    let response = await this.call<unknown>(
      'POST',
      `/iserver/account/${encodeURIComponent(accountId)}/orders`,
      { orders: [payload] },
    );

    for (let reply = 0; reply < maxReplies; reply += 1) {
      const question = firstQuestion(response);
      if (!question) break;
      this.log(`  IBKR asks: ${question.message}`);
      response = await this.call<unknown>(
        'POST',
        `/iserver/reply/${encodeURIComponent(question.id)}`,
        { confirmed: true },
      );
    }

    if (firstQuestion(response)) {
      throw new IbkrError(
        `The gateway kept asking for confirmation after ${maxReplies} replies; ` +
          `the order was not placed.`,
        0,
        JSON.stringify(response).slice(0, 500),
      );
    }

    const first = Array.isArray(response) ? (response[0] as Record<string, unknown>) : {};
    const orderId = first.order_id ?? first.orderId ?? first.id;
    return {
      orderId: typeof orderId === 'string' ? orderId : String(orderId ?? ''),
      status: typeof first.order_status === 'string' ? first.order_status : 'unknown',
      raw: response,
    };
  }

  /** Today's orders, for reconciling what the bot thinks it did. */
  async liveOrders(): Promise<unknown[]> {
    const body = await this.call<Record<string, unknown>>('GET', '/iserver/account/orders');
    return Array.isArray(body.orders) ? body.orders : [];
  }

  async cancelOrder(accountId: string, orderId: string): Promise<unknown> {
    return this.call(
      'DELETE',
      `/iserver/account/${encodeURIComponent(accountId)}/order/${encodeURIComponent(orderId)}`,
    );
  }

  /**
   * `/iserver/accounts` has to be called once before market data works. Failing
   * to do so returns an error that says nothing about the real cause.
   */
  private async primeAccounts(): Promise<void> {
    if (this.accountsPrimed) return;
    await this.call('GET', '/iserver/accounts');
    this.accountsPrimed = true;
  }

  /** One request, rate-limited and with the gateway's own error text preserved. */
  private async call<T>(method: string, path: string, body?: unknown): Promise<T> {
    const gap = Date.now() - this.lastRequestAt;
    if (gap < MIN_REQUEST_GAP_MS) {
      await new Promise((resolve) => setTimeout(resolve, MIN_REQUEST_GAP_MS - gap));
    }
    this.lastRequestAt = Date.now();

    const url = new URL(`${this.base.pathname.replace(/\/$/, '')}${path}`, this.base);
    const payload = body === undefined ? undefined : JSON.stringify(body);

    const options: RequestOptions = {
      method,
      hostname: url.hostname,
      port: url.port === '' ? 443 : Number(url.port),
      path: `${url.pathname}${url.search}`,
      // Safe only because `assertLoopback` has already refused anything but
      // loopback; the gateway's certificate is self-signed by design.
      rejectUnauthorized: false,
      timeout: this.timeoutMs,
      headers: {
        accept: 'application/json',
        ...(payload === undefined
          ? {}
          : { 'content-type': 'application/json', 'content-length': Buffer.byteLength(payload) }),
      },
    };

    const { status, text } = await new Promise<{ status: number; text: string }>(
      (resolve, reject) => {
        const req = httpsRequest(options, (res) => {
          const chunks: Buffer[] = [];
          res.on('data', (chunk: Buffer) => chunks.push(chunk));
          res.on('end', () =>
            resolve({
              status: res.statusCode ?? 0,
              text: Buffer.concat(chunks).toString('utf8'),
            }),
          );
        });
        req.on('timeout', () => {
          req.destroy(new Error(`${method} ${path} timed out after ${this.timeoutMs}ms`));
        });
        req.on('error', (error: NodeJS.ErrnoException) => {
          if (error.code === 'ECONNREFUSED') {
            reject(
              new Error(
                `Nothing is listening on ${this.base.origin}. Start the IBKR Client ` +
                  `Portal Gateway and log in at ${this.base.origin} before running this. ` +
                  `See docs/IBKR.md.`,
              ),
            );
            return;
          }
          reject(error);
        });
        if (payload !== undefined) req.write(payload);
        req.end();
      },
    );

    if (status < 200 || status >= 300) {
      throw new IbkrError(`${method} ${path} returned ${status}`, status, text.slice(0, 500));
    }

    if (text.trim() === '') return undefined as T;
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new IbkrError(`${method} ${path} returned something that is not JSON`, status, text.slice(0, 300));
    }
  }
}

/** The first confirmation prompt in a place-order response, if there is one. */
export function firstQuestion(response: unknown): { id: string; message: string } | null {
  const entries = Array.isArray(response) ? response : [response];
  for (const entry of entries) {
    const record = entry as Record<string, unknown> | null;
    if (!record) continue;
    const id = record.id ?? record.messageId;
    const message = record.message;
    if (typeof id === 'string' && Array.isArray(message) && message.length > 0) {
      return { id, message: message.map((m) => String(m)).join(' ') };
    }
  }
  return null;
}
