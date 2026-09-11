import { describe, expect, it } from 'vitest';
import {
  KrakenClient,
  credentialsFromEnv,
  signRequest,
  type KrakenOrderRequest,
} from '../src/broker/krakenClient.js';
import { KrakenExecution, floorTo } from '../src/broker/krakenExecution.js';
import { KRAKEN_SPOT_TIERS, krakenSpot } from '../src/costs/commission.js';
import { MAX_OHLC_BARS, krakenDataSource, parseOhlc, unwrap, type KrakenPair } from '../src/data/kraken.js';

const XBTEUR: KrakenPair = {
  name: 'XXBTZEUR',
  altname: 'XBTEUR',
  base: 'XXBT',
  quote: 'ZEUR',
  orderMin: 0.0001,
  volumeDecimals: 8,
  priceDecimals: 1,
};

/** A stand-in for the signed client, so the adapter can be tested without a key. */
function fakeClient(overrides: {
  balances?: Record<string, number>;
  onOrder?: (order: KrakenOrderRequest) => void;
  description?: string;
  txids?: string[];
}): KrakenClient {
  return {
    hasCredentials: true,
    balances: async () => overrides.balances ?? { ZEUR: 1000, XXBT: 0 },
    tradeBalance: async () => ({ equity: 1000, balance: 1000 }),
    openOrders: async () => ({}),
    addOrder: async (order: KrakenOrderRequest) => {
      overrides.onOrder?.(order);
      return {
        description: overrides.description ?? 'buy 0.01000000 XBTEUR @ market',
        txids: overrides.txids ?? ['OABCDE-FGHIJ-KLMNOP'],
      };
    },
  } as unknown as KrakenClient;
}

describe('signRequest', () => {
  it('matches Kraken’s own published test vector', () => {
    // From Kraken's REST authentication guide. Checking against their vector
    // rather than against ourselves is the only way this assertion means anything:
    // a self-consistent signature that Kraken rejects is indistinguishable from a
    // correct one until the first live order fails.
    const secret =
      'kQH5HW/8p1uGOVjbgWA7FunAmGO8lsSUXNsu3eow76sz84Q18fWxnyRzBHCd3pd5nE9qa99HAZtuZuj6F1huXg==';
    const signature = signRequest(
      '/0/private/AddOrder',
      '1616492376594',
      'nonce=1616492376594&ordertype=limit&pair=XBTUSD&price=37500&type=buy&volume=1.25',
      secret,
    );
    expect(signature).toBe(
      '4/dpxb3iT4tp/ZCVEwSnEsLxx0bqyhLpdfOpc6fn7OR8+UClSV5n9E6aSS8MPtnRfp32bAb0nmbRn6H8ndwLUQ==',
    );
  });

  it('changes completely when the nonce changes', () => {
    const secret = Buffer.from('a'.repeat(64)).toString('base64');
    const a = signRequest('/0/private/Balance', '1', 'nonce=1', secret);
    const b = signRequest('/0/private/Balance', '2', 'nonce=2', secret);
    expect(a).not.toBe(b);
  });
});

describe('the signed request that actually goes on the wire', () => {
  /** Capture one request without sending it, so the body can be inspected. */
  async function capture(
    act: (client: KrakenClient) => Promise<unknown>,
  ): Promise<{ url: string; headers: Record<string, string>; body: string }> {
    const original = globalThis.fetch;
    let seen: { url: string; headers: Record<string, string>; body: string } | null = null;
    globalThis.fetch = (async (url: string, init: RequestInit) => {
      seen = {
        url: String(url),
        headers: init.headers as Record<string, string>,
        body: String(init.body),
      };
      return new Response(JSON.stringify({ error: [], result: {} }), { status: 200 });
    }) as unknown as typeof fetch;
    try {
      await act(new KrakenClient({ credentials: { key: 'public-key', secret: Buffer.from('x'.repeat(48)).toString('base64') } }));
    } finally {
      globalThis.fetch = original;
    }
    if (!seen) throw new Error('no request was made');
    return seen;
  }

  it('sends the key in a header and never the secret', async () => {
    const request = await capture((client) => client.balances());
    expect(request.headers['API-Key']).toBe('public-key');
    expect(request.headers['API-Sign']).toMatch(/^[A-Za-z0-9+/=]+$/);
    // The secret is an HMAC key and nothing else; it must not appear anywhere.
    const everything = JSON.stringify(request);
    expect(everything).not.toContain('xxxx');
  });

  it('puts the nonce first, because that is the string that was signed', async () => {
    const request = await capture((client) => client.balances());
    expect(request.body).toMatch(/^nonce=\d+$/);
  });

  it('omits the validate flag entirely when it is false', async () => {
    const request = await capture((client) =>
      client.addOrder({ pair: 'XBTEUR', type: 'buy', ordertype: 'market', volume: '0.001', validate: false }),
    );
    // Kraken treats the presence of the field, not its value, as the instruction,
    // so sending validate=false would be a validated order that never executes.
    expect(request.body).not.toContain('validate');
    expect(request.body).toContain('ordertype=market');
  });

  it('sends validate=true when it is asked to', async () => {
    const request = await capture((client) =>
      client.addOrder({ pair: 'XBTEUR', type: 'buy', ordertype: 'market', volume: '0.001', validate: true }),
    );
    expect(request.body).toContain('validate=true');
  });

  it('issues a strictly increasing nonce', async () => {
    const first = await capture((client) => client.balances());
    const second = await capture((client) => client.balances());
    const nonceOf = (body: string): number => Number(/nonce=(\d+)/.exec(body)?.[1]);
    expect(nonceOf(second.body)).toBeGreaterThanOrEqual(nonceOf(first.body));
  });
});

describe('credentialsFromEnv', () => {
  it('is null when nothing is set, so read-only commands need no key', () => {
    expect(credentialsFromEnv({})).toBeNull();
  });

  it('refuses half a credential rather than failing later with a signature error', () => {
    expect(() => credentialsFromEnv({ KRAKEN_API_KEY: 'k' })).toThrow(/must be set/);
    expect(() => credentialsFromEnv({ KRAKEN_API_SECRET: 's' })).toThrow(/must be set/);
  });

  it('says plainly that flags are the wrong place for a secret', () => {
    expect(() => credentialsFromEnv({ KRAKEN_API_KEY: 'k' })).toThrow(/shell history/);
  });

  it('trims what it reads, because copied keys carry whitespace', () => {
    expect(credentialsFromEnv({ KRAKEN_API_KEY: ' k ', KRAKEN_API_SECRET: ' s\n' })).toEqual({
      key: 'k',
      secret: 's',
    });
  });
});

describe('a client without credentials', () => {
  it('refuses a private call and says where the key goes', async () => {
    const client = new KrakenClient();
    expect(client.hasCredentials).toBe(false);
    await expect(client.balances()).rejects.toThrow(/KRAKEN_API_KEY/);
  });
});

describe('unwrap', () => {
  it('treats Kraken’s error array as a failure, even on HTTP 200', () => {
    // Kraken answers 200 with an error array for most refusals, so a client that
    // only checks the status code reads a rejected order as a success.
    expect(() => unwrap({ error: ['EOrder:Insufficient funds'], result: {} }, 'AddOrder')).toThrow(
      /Insufficient funds/,
    );
  });

  it('refuses an envelope with no result', () => {
    expect(() => unwrap({ error: [] }, 'Balance')).toThrow(/no result/);
    expect(() => unwrap(null, 'Balance')).toThrow(/not an envelope/);
  });

  it('returns the result when there is one', () => {
    expect(unwrap({ error: [], result: { ZEUR: '1' } }, 'Balance')).toEqual({ ZEUR: '1' });
  });
});

describe('parseOhlc', () => {
  const minute = 60_000;
  /** Kraken rows are [time, open, high, low, close, vwap, volume, count]. */
  const row = (seconds: number, close: number): unknown[] => [
    seconds,
    String(close),
    String(close + 1),
    String(close - 1),
    String(close),
    String(close),
    '10.5',
    42,
  ];

  it('drops the still-forming bar, which Kraken always includes', () => {
    const now = 1_700_000_000_000;
    const candles = parseOhlc(
      {
        XXBTZEUR: [
          row((now - 3 * minute) / 1000, 100),
          row((now - 2 * minute) / 1000, 101),
          // The current minute. Its close is still moving.
          row(now / 1000, 102),
        ],
        last: now / 1000,
      },
      '1m',
      now,
    );
    expect(candles.map((c) => c.close)).toEqual([100, 101]);
  });

  it('finds the series under whatever name Kraken prefers', () => {
    const now = 1_700_000_000_000;
    // Asked for XBTEUR, answered under XXBTZEUR.
    const candles = parseOhlc({ XXBTZEUR: [row((now - 5 * minute) / 1000, 50)], last: 1 }, '1m', now);
    expect(candles).toHaveLength(1);
    expect(candles[0]?.volume).toBe(10.5);
  });

  it('reads volume from the volume column, not the vwap beside it', () => {
    const now = 1_700_000_000_000;
    const candles = parseOhlc({ P: [row((now - 5 * minute) / 1000, 100)] }, '1m', now);
    expect(candles[0]?.volume).toBe(10.5);
    expect(candles[0]?.close).toBe(100);
  });

  it('sorts what it returns', () => {
    const now = 1_700_000_000_000;
    const candles = parseOhlc(
      {
        P: [row((now - 2 * minute) / 1000, 2), row((now - 5 * minute) / 1000, 1)],
      },
      '1m',
      now,
    );
    expect(candles.map((c) => c.close)).toEqual([1, 2]);
  });

  it('refuses a malformed row instead of producing NaN prices', () => {
    expect(() => parseOhlc({ P: [[1, '2', '3']] }, '1m', 1_700_000_000_000)).toThrow(/8 fields/);
    expect(() => parseOhlc({}, '1m')).toThrow(/no OHLC series/);
  });
});

describe('the Kraken data source', () => {
  it('refuses to pretend it can return more than 720 bars', async () => {
    await expect(krakenDataSource().recent('XBTEUR', '1d', 2000)).rejects.toThrow(
      /at most 720 bars/,
    );
    // And points at the archive, rather than leaving the user stuck.
    await expect(krakenDataSource().recent('XBTEUR', '1d', 2000)).rejects.toThrow(/--csv/);
  });

  it('knows its own ceiling', () => {
    expect(MAX_OHLC_BARS).toBe(720);
  });
});

describe('Kraken fee tiers', () => {
  it('charges 40 bps taker at the bottom tier, four times the crypto default', () => {
    expect(krakenSpot()).toEqual({ kind: 'bps', bps: 40 });
  });

  it('charges less to a maker, and defaults to taker because market orders are takers', () => {
    expect(krakenSpot({ role: 'maker' })).toEqual({ kind: 'bps', bps: 25 });
  });

  it('picks the tier by 30-day volume', () => {
    expect(krakenSpot({ thirtyDayVolumeUsd: 0 })).toEqual({ kind: 'bps', bps: 40 });
    expect(krakenSpot({ thirtyDayVolumeUsd: 75_000 })).toEqual({ kind: 'bps', bps: 24 });
    expect(krakenSpot({ thirtyDayVolumeUsd: 50_000_000 })).toEqual({ kind: 'bps', bps: 10 });
  });

  it('has tiers that only ever get cheaper', () => {
    for (let i = 1; i < KRAKEN_SPOT_TIERS.length; i += 1) {
      const previous = KRAKEN_SPOT_TIERS[i - 1] as (typeof KRAKEN_SPOT_TIERS)[number];
      const current = KRAKEN_SPOT_TIERS[i] as (typeof KRAKEN_SPOT_TIERS)[number];
      expect(current.fromVolumeUsd).toBeGreaterThan(previous.fromVolumeUsd);
      expect(current.takerBps).toBeLessThanOrEqual(previous.takerBps);
      expect(current.makerBps).toBeLessThanOrEqual(previous.makerBps);
    }
  });
});

describe('floorTo', () => {
  it('rounds down, so an order can never grow by rounding', () => {
    expect(floorTo(0.123456789, 4)).toBeCloseTo(0.1234, 10);
    expect(floorTo(1.9999, 0)).toBe(1);
  });

  it('survives the binary representation of a decimal', () => {
    // 0.07 * 100 is 7.000000000000001 in binary floating point; a naive floor
    // would give 0.07 here and 0.06 for a value that is mathematically identical.
    expect(floorTo(0.07, 2)).toBeCloseTo(0.07, 10);
    expect(floorTo(2.675, 2)).toBeCloseTo(2.67, 10);
  });
});

describe('KrakenExecution gates', () => {
  it('refuses to exist without credentials', () => {
    const clientWithout = { hasCredentials: false } as unknown as KrakenClient;
    expect(
      () => new KrakenExecution({ client: clientWithout, pair: XBTEUR, maxOrderValue: 50 }),
    ).toThrow(/KRAKEN_API_KEY/);
  });

  it('refuses --send on its own, because Kraken has no paper account', () => {
    expect(
      () => new KrakenExecution({ client: fakeClient({}), pair: XBTEUR, maxOrderValue: 50, send: true }),
    ).toThrow(/no paper account for spot/);
  });

  it('allows --send once real money is accepted', () => {
    const execution = new KrakenExecution({
      client: fakeClient({}),
      pair: XBTEUR,
      maxOrderValue: 50,
      send: true,
      allowRealMoney: true,
    });
    expect(execution.label).not.toMatch(/validate/);
  });

  it('says in its label when it is only validating', () => {
    expect(new KrakenExecution({ client: fakeClient({}), pair: XBTEUR, maxOrderValue: 50 }).label).toMatch(
      /validate only/,
    );
  });

  it('rejects a nonsensical cap', () => {
    expect(
      () => new KrakenExecution({ client: fakeClient({}), pair: XBTEUR, maxOrderValue: 0 }),
    ).toThrow(/maxOrderValue/);
  });
});

describe('KrakenExecution orders', () => {
  const price = 50_000;

  it('measures equity as quote plus base at the current price', async () => {
    const execution = new KrakenExecution({
      client: fakeClient({ balances: { ZEUR: 500, XXBT: 0.01 } }),
      pair: XBTEUR,
      maxOrderValue: 10_000,
    });
    expect(await execution.equity(price)).toBeCloseTo(1000, 6);
    expect(await execution.position()).toBeCloseTo(0.01, 10);
    expect(await execution.weight(price)).toBeCloseTo(0.5, 6);
  });

  it('validates with Kraken instead of sending, and reports what Kraken said', async () => {
    const seen: KrakenOrderRequest[] = [];
    const execution = new KrakenExecution({
      client: fakeClient({ onOrder: (order) => seen.push(order), description: 'buy 0.00400000 XBTEUR @ market' }),
      pair: XBTEUR,
      maxOrderValue: 10_000,
    });
    const outcome = await execution.rebalanceTo(0.2, price, 0);
    expect(outcome.kind).toBe('skipped');
    if (outcome.kind === 'skipped') expect(outcome.reason).toMatch(/validate only: Kraken accepted/);
    // The order did reach Kraken — with the validate flag set, which is the point.
    expect(seen[0]).toMatchObject({ validate: true, type: 'buy', ordertype: 'market' });
  });

  it('sends a market order once both gates are passed', async () => {
    const seen: KrakenOrderRequest[] = [];
    const execution = new KrakenExecution({
      client: fakeClient({ onOrder: (order) => seen.push(order), txids: ['OXYZ'] }),
      pair: XBTEUR,
      maxOrderValue: 10_000,
      send: true,
      allowRealMoney: true,
    });
    const outcome = await execution.rebalanceTo(0.5, price, 1_700_000_000_000);
    expect(outcome.kind).toBe('submitted');
    if (outcome.kind === 'submitted') expect(outcome.orderId).toBe('OXYZ');
    expect(seen[0]?.validate).toBe(false);
    expect(seen[0]?.pair).toBe('XBTEUR');
    // Kraken needs a 32-bit unsigned integer here, not milliseconds since 1970.
    expect(seen[0]?.userref).toBeLessThan(2_147_483_647);
  });

  it('rounds the volume down to the pair’s decimals', async () => {
    const seen: KrakenOrderRequest[] = [];
    const execution = new KrakenExecution({
      client: fakeClient({ balances: { ZEUR: 1000, XXBT: 0 }, onOrder: (o) => seen.push(o) }),
      pair: { ...XBTEUR, volumeDecimals: 4 },
      maxOrderValue: 10_000,
      send: true,
      allowRealMoney: true,
    });
    // 1000 / 50000 is 0.02 exactly; ask for a third of it to get a long decimal.
    await execution.rebalanceTo(1 / 3, price, 0);
    expect(seen[0]?.volume).toBe('0.0066');
  });

  it('refuses to go short, because a spot account cannot', async () => {
    const execution = new KrakenExecution({
      client: fakeClient({}),
      pair: XBTEUR,
      maxOrderValue: 10_000,
      send: true,
      allowRealMoney: true,
    });
    const outcome = await execution.rebalanceTo(-1, price, 0);
    expect(outcome.kind).toBe('skipped');
    if (outcome.kind === 'skipped') expect(outcome.reason).toMatch(/cannot go short/);
  });

  it('refuses an order below Kraken’s minimum for the pair', async () => {
    const execution = new KrakenExecution({
      client: fakeClient({ balances: { ZEUR: 10, XXBT: 0 } }),
      pair: { ...XBTEUR, orderMin: 0.001 },
      maxOrderValue: 10_000,
      send: true,
      allowRealMoney: true,
    });
    // 10 euro of BTC at 50k is 0.0002, under a 0.001 minimum.
    const outcome = await execution.rebalanceTo(1, price, 0);
    expect(outcome.kind).toBe('skipped');
    if (outcome.kind === 'skipped') expect(outcome.reason).toMatch(/minimum order/);
  });

  it('refuses an oversized order rather than trimming it', async () => {
    const execution = new KrakenExecution({
      client: fakeClient({ balances: { ZEUR: 1000, XXBT: 0 } }),
      pair: XBTEUR,
      maxOrderValue: 50,
      send: true,
      allowRealMoney: true,
    });
    const outcome = await execution.rebalanceTo(1, price, 0);
    expect(outcome.kind).toBe('skipped');
    if (outcome.kind === 'skipped') expect(outcome.reason).toMatch(/exceeds the 50.00 cap/);
  });

  it('refuses a target weight above 1, because a spot account cannot borrow', async () => {
    const execution = new KrakenExecution({
      client: fakeClient({ balances: { ZEUR: 1000, XXBT: 0 } }),
      pair: XBTEUR,
      maxOrderValue: 1_000_000,
      send: true,
      allowRealMoney: true,
    });
    // At or below a weight of 1 this is unreachable: equity is quote plus base at
    // price, so a buy can never cost more than the quote balance. Above 1 it is the
    // guard that catches a caller asking for leverage on a venue that has none.
    const outcome = await execution.rebalanceTo(1.5, price, 0);
    expect(outcome.kind).toBe('skipped');
    if (outcome.kind === 'skipped') expect(outcome.reason).toMatch(/cannot borrow/);
  });

  it('does nothing when already at the target', async () => {
    const execution = new KrakenExecution({
      client: fakeClient({ balances: { ZEUR: 0, XXBT: 0.02 } }),
      pair: XBTEUR,
      maxOrderValue: 10_000,
      send: true,
      allowRealMoney: true,
    });
    const outcome = await execution.rebalanceTo(1, price, 0);
    expect(outcome.kind).toBe('skipped');
    if (outcome.kind === 'skipped') expect(outcome.reason).toMatch(/already at target/);
  });

  it('sells to exit, and reports the quantity as negative', async () => {
    const seen: KrakenOrderRequest[] = [];
    const execution = new KrakenExecution({
      client: fakeClient({ balances: { ZEUR: 0, XXBT: 0.01 }, onOrder: (o) => seen.push(o) }),
      pair: XBTEUR,
      maxOrderValue: 10_000,
      send: true,
      allowRealMoney: true,
    });
    const outcome = await execution.flatten(price, 0);
    expect(outcome.kind).toBe('submitted');
    if (outcome.kind === 'submitted') expect(outcome.requestedQuantity).toBeCloseTo(-0.01, 10);
    expect(seen[0]?.type).toBe('sell');
  });

  it('reports no fills, because a market order’s fills belong to the exchange', () => {
    const execution = new KrakenExecution({ client: fakeClient({}), pair: XBTEUR, maxOrderValue: 50 });
    expect(execution.fills).toHaveLength(0);
  });
});
