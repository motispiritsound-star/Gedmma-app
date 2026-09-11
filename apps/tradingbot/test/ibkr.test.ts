import { describe, expect, it } from 'vitest';
import {
  IbkrClient,
  assertLoopback,
  firstQuestion,
  type IbkrLedger,
  type IbkrPosition,
} from '../src/broker/ibkrClient.js';
import { IbkrExecution, isPaperAccount } from '../src/broker/ibkrExecution.js';
import { ibkrDataSource, periodFor } from '../src/data/ibkrData.js';

/**
 * A stand-in for the gateway. The real client is a thin HTTP wrapper; what is
 * worth testing is everything the adapter does around it, and that needs a
 * gateway that answers predictably rather than one that has to be running.
 */
function fakeClient(overrides: {
  ledger?: IbkrLedger[];
  positions?: IbkrPosition[];
  history?: { openTime: number; open: number; high: number; low: number; close: number; volume: number }[];
  onPlace?: (order: unknown) => void;
}): IbkrClient {
  return {
    ledger: async () => overrides.ledger ?? [{ currency: 'BASE', cash: 10_000, netLiquidation: 10_000 }],
    positions: async () => overrides.positions ?? [],
    history: async () => overrides.history ?? [],
    placeOrder: async (_account: string, order: unknown) => {
      overrides.onPlace?.(order);
      return { orderId: 'o-1', status: 'Submitted', raw: {} };
    },
  } as unknown as IbkrClient;
}

describe('assertLoopback', () => {
  it('accepts the gateway addresses the gateway actually uses', () => {
    expect(() => assertLoopback('https://localhost:5000/v1/api')).not.toThrow();
    expect(() => assertLoopback('https://127.0.0.1:5000/v1/api')).not.toThrow();
  });

  it('refuses a remote host, because it would accept any certificate from it', () => {
    expect(() => assertLoopback('https://broker.example.com/v1/api')).toThrow(/must be on localhost/);
    expect(() => assertLoopback('https://10.0.0.5:5000/v1/api')).toThrow(/must be on localhost/);
  });

  it('suggests the tunnel rather than leaving the user stuck', () => {
    expect(() => assertLoopback('https://elsewhere:5000')).toThrow(/ssh -L/);
  });
});

describe('IbkrClient construction', () => {
  it('will not be pointed at a remote gateway', () => {
    expect(() => new IbkrClient({ baseUrl: 'https://example.com/v1/api' })).toThrow(/localhost/);
  });

  it('defaults to the address the gateway actually listens on', () => {
    expect(new IbkrClient().baseUrl).toMatch(/localhost:5000/);
  });
});

describe('firstQuestion', () => {
  it('finds the confirmation prompt IBKR interposes before an order', () => {
    const question = firstQuestion([
      { id: 'abc123', message: ['This order exceeds your size threshold.'], isSuppressed: false },
    ]);
    expect(question).toEqual({ id: 'abc123', message: 'This order exceeds your size threshold.' });
  });

  it('is null once the gateway answers with an order instead of a question', () => {
    expect(firstQuestion([{ order_id: '12345', order_status: 'Submitted' }])).toBeNull();
    expect(firstQuestion(null)).toBeNull();
    expect(firstQuestion([])).toBeNull();
  });
});

describe('periodFor', () => {
  it('asks for more calendar time than the bars alone would suggest', () => {
    // 250 daily bars is a year of trading days but well over a year of calendar.
    expect(periodFor('1d', 250)).toMatch(/y$/);
  });

  it('uses days for short windows and months in between', () => {
    expect(periodFor('1h', 24)).toMatch(/d$/);
    expect(periodFor('1d', 30)).toMatch(/m$/);
  });
});

describe('isPaperAccount', () => {
  it('recognises the DU prefix IBKR gives paper accounts', () => {
    expect(isPaperAccount('DU1234567')).toBe(true);
    expect(isPaperAccount(' du7654321 ')).toBe(true);
  });

  it('treats everything else as real money', () => {
    expect(isPaperAccount('U1234567')).toBe(false);
    expect(isPaperAccount('F1234567')).toBe(false);
    expect(isPaperAccount('')).toBe(false);
    expect(isPaperAccount('DUMMY')).toBe(false);
  });
});

describe('IbkrExecution safety gates', () => {
  const base = { client: fakeClient({}), conid: 265598, maxOrderValue: 1000 };

  it('refuses a live account unless real money is explicitly accepted', () => {
    expect(() => new IbkrExecution({ ...base, accountId: 'U1234567' })).toThrow(
      /does not look like an IBKR paper account/,
    );
  });

  it('allows a live account once it is', () => {
    expect(
      () => new IbkrExecution({ ...base, accountId: 'U1234567', allowRealMoney: true }),
    ).not.toThrow();
  });

  it('accepts a paper account without ceremony', () => {
    const execution = new IbkrExecution({ ...base, accountId: 'DU1234567' });
    expect(execution.kind).toBe('live');
    expect(execution.label).toMatch(/DU1234567/);
  });

  it('says so in its label when it is only pretending', () => {
    expect(new IbkrExecution({ ...base, accountId: 'DU1' }).label).toMatch(/dry run/);
    expect(
      new IbkrExecution({ ...base, accountId: 'DU1', dryRun: false }).label,
    ).not.toMatch(/dry run/);
  });

  it('rejects settings that would let it trade nothing sensible', () => {
    expect(() => new IbkrExecution({ ...base, accountId: '' })).toThrow(/account ID is required/);
    expect(() => new IbkrExecution({ ...base, accountId: 'DU1', maxOrderValue: 0 })).toThrow(
      /maxOrderValue/,
    );
    expect(() => new IbkrExecution({ ...base, accountId: 'DU1', conid: 0 })).toThrow(/conid/);
  });
});

describe('IbkrExecution order sizing', () => {
  it('reads equity and position from the broker rather than tracking them', async () => {
    const execution = new IbkrExecution({
      client: fakeClient({
        ledger: [{ currency: 'BASE', cash: 500, netLiquidation: 2000 }],
        positions: [
          {
            conid: 265598,
            position: 10,
            marketPrice: 150,
            marketValue: 1500,
            currency: 'USD',
            description: 'AAPL',
          },
        ],
      }),
      accountId: 'DU1',
      conid: 265598,
      maxOrderValue: 10_000,
    });
    expect(await execution.equity()).toBe(2000);
    expect(await execution.position()).toBe(10);
    expect(await execution.weight(150)).toBeCloseTo(0.75, 10);
  });

  it('sends nothing on a dry run, and says what it would have sent', async () => {
    const placed: unknown[] = [];
    const execution = new IbkrExecution({
      client: fakeClient({ onPlace: (order) => placed.push(order) }),
      accountId: 'DU1',
      conid: 265598,
      maxOrderValue: 10_000,
    });
    const outcome = await execution.rebalanceTo(0.5, 100, 0);
    expect(outcome.kind).toBe('skipped');
    if (outcome.kind === 'skipped') expect(outcome.reason).toMatch(/dry run: would have sent BUY 50/);
    expect(placed).toHaveLength(0);
  });

  it('places a market order once the dry run is switched off', async () => {
    const placed: Record<string, unknown>[] = [];
    const execution = new IbkrExecution({
      client: fakeClient({ onPlace: (order) => placed.push(order as Record<string, unknown>) }),
      accountId: 'DU1',
      conid: 265598,
      maxOrderValue: 10_000,
      dryRun: false,
    });
    const outcome = await execution.rebalanceTo(0.5, 100, 1700);
    expect(outcome.kind).toBe('submitted');
    if (outcome.kind === 'submitted') {
      expect(outcome.orderId).toBe('o-1');
      expect(outcome.requestedQuantity).toBe(50);
    }
    expect(placed[0]).toMatchObject({ conid: 265598, side: 'BUY', quantity: 50, orderType: 'MKT' });
  });

  it('rounds toward zero, so rounding can never increase exposure', async () => {
    const placed: Record<string, unknown>[] = [];
    const execution = new IbkrExecution({
      client: fakeClient({
        ledger: [{ currency: 'BASE', cash: 0, netLiquidation: 1000 }],
        onPlace: (order) => placed.push(order as Record<string, unknown>),
      }),
      accountId: 'DU1',
      conid: 1,
      maxOrderValue: 10_000,
      dryRun: false,
    });
    // A full position at 301 is 3.32 shares; 3 is sent, not 4.
    await execution.rebalanceTo(1, 301, 0);
    expect(placed[0]?.quantity).toBe(3);
  });

  it('refuses an oversized order rather than quietly trimming it', async () => {
    const placed: unknown[] = [];
    const execution = new IbkrExecution({
      client: fakeClient({ onPlace: (order) => placed.push(order) }),
      accountId: 'DU1',
      conid: 1,
      maxOrderValue: 100,
      dryRun: false,
    });
    const outcome = await execution.rebalanceTo(1, 100, 0);
    expect(outcome.kind).toBe('skipped');
    if (outcome.kind === 'skipped') expect(outcome.reason).toMatch(/exceeds the 100.00 cap/);
    // Trimming would hide the bug that produced the order.
    expect(placed).toHaveLength(0);
  });

  it('skips an order below the venue minimum, but never skips an exit', async () => {
    const placed: Record<string, unknown>[] = [];
    const execution = new IbkrExecution({
      client: fakeClient({
        ledger: [{ currency: 'BASE', cash: 0, netLiquidation: 1000 }],
        positions: [
          { conid: 1, position: 1, marketPrice: 20, marketValue: 20, currency: 'USD', description: 'X' },
        ],
        onPlace: (order) => placed.push(order as Record<string, unknown>),
      }),
      accountId: 'DU1',
      conid: 1,
      maxOrderValue: 10_000,
      minOrderValue: 500,
      dryRun: false,
    });

    // Adding one more share is a 20 order, under the 500 minimum.
    const tooSmall = await execution.rebalanceTo(0.04, 20, 0);
    expect(tooSmall.kind).toBe('skipped');

    // Closing is always allowed, or a stop could strand the position.
    const exit = await execution.flatten(20, 0);
    expect(exit.kind).toBe('submitted');
    expect(placed[0]).toMatchObject({ side: 'SELL', quantity: 1 });
  });

  it('does nothing when it is already at the target to the nearest unit', async () => {
    const execution = new IbkrExecution({
      client: fakeClient({
        ledger: [{ currency: 'BASE', cash: 0, netLiquidation: 1000 }],
        positions: [
          { conid: 1, position: 10, marketPrice: 100, marketValue: 1000, currency: 'USD', description: 'X' },
        ],
      }),
      accountId: 'DU1',
      conid: 1,
      maxOrderValue: 10_000,
      dryRun: false,
    });
    const outcome = await execution.rebalanceTo(1, 100, 0);
    expect(outcome.kind).toBe('skipped');
    if (outcome.kind === 'skipped') expect(outcome.reason).toMatch(/already at target/);
  });

  it('reports no fills, because a live adapter does not know them yet', () => {
    const execution = new IbkrExecution({ client: fakeClient({}), accountId: 'DU1', conid: 1, maxOrderValue: 10 });
    expect(execution.fills).toHaveLength(0);
  });
});

describe('the IBKR data source', () => {
  it('insists on a contract ID and says where to get one', async () => {
    const source = ibkrDataSource({ client: fakeClient({}) });
    await expect(source.recent('AAPL', '1d', 10)).rejects.toThrow(/ibkr search --symbol AAPL/);
  });

  it('drops the bar that is still forming and sorts what is left', async () => {
    const day = 86_400_000;
    const now = Date.now();
    const source = ibkrDataSource({
      client: fakeClient({
        history: [
          { openTime: now - day * 2, open: 2, high: 2, low: 2, close: 2, volume: 1 },
          { openTime: now - day * 3, open: 1, high: 1, low: 1, close: 1, volume: 1 },
          // Today's bar has not closed yet.
          { openTime: now, open: 3, high: 3, low: 3, close: 3, volume: 1 },
        ],
      }),
    });
    const candles = await source.recent('265598', '1d', 10);
    expect(candles.map((c) => c.close)).toEqual([1, 2]);
  });

  it('returns only bars after the cursor when polling', async () => {
    const day = 86_400_000;
    const now = Date.now();
    const source = ibkrDataSource({
      client: fakeClient({
        history: [
          { openTime: now - day * 3, open: 1, high: 1, low: 1, close: 1, volume: 1 },
          { openTime: now - day * 2, open: 2, high: 2, low: 2, close: 2, volume: 1 },
        ],
      }),
    });
    const fresh = await source.since('265598', '1d', now - day * 3);
    expect(fresh.map((c) => c.close)).toEqual([2]);
  });
});
