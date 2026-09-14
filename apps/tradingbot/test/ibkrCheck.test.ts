import { describe, expect, it } from 'vitest';
import { runConnectionCheck } from '../src/broker/ibkrCheck.js';
import { IbkrError, type IbkrClient } from '../src/broker/ibkrClient.js';

/** Responses a healthy gateway would give, keyed by the path the client asks for. */
const HEALTHY: Record<string, unknown> = {
  '/iserver/auth/status': { authenticated: true, connected: true, competing: false },
  '/portfolio/accounts': [{ accountId: 'DU1234567' }],
  '/iserver/accounts': { accounts: ['DU1234567'], selectedAccount: 'DU1234567' },
  '/portfolio/DU1234567/ledger': {
    BASE: { cashbalance: 100000, netliquidationvalue: 100000, currency: 'BASE' },
  },
  '/portfolio/DU1234567/positions/0': [],
  '/iserver/secdef/search': [{ conid: 265598, symbol: 'AAPL', companyHeader: 'APPLE INC' }],
};

function fakeGateway(overrides: Record<string, unknown> = {}): {
  client: IbkrClient;
  calls: string[];
} {
  const calls: string[] = [];
  const table = { ...HEALTHY, ...overrides };
  const client = {
    baseUrl: 'https://localhost:5000/v1/api',
    raw: async (_method: string, path: string) => {
      calls.push(path);
      // The history endpoint carries a query string, so it is matched by prefix.
      if (path.startsWith('/iserver/marketdata/history')) {
        if ('history' in table) {
          const value = table.history;
          if (value instanceof Error) throw value;
          return value;
        }
        return {
          data: Array.from({ length: 21 }, (_, i) => ({
            t: 1_700_000_000_000 + i * 86_400_000,
            o: 100,
            h: 101,
            l: 99,
            c: 100.5,
            v: 1000,
          })),
        };
      }
      const value = table[path];
      if (value instanceof Error) throw value;
      if (value === undefined) throw new IbkrError(`GET ${path} returned 404`, 404, 'not found');
      return value;
    },
  } as unknown as IbkrClient;
  return { client, calls };
}

describe('the connection check on a healthy gateway', () => {
  it('passes every step and finds what the next command needs', async () => {
    const { client } = fakeGateway();
    const report = await runConnectionCheck({ client });

    expect(report.ok).toBe(true);
    expect(report.accounts).toEqual(['DU1234567']);
    expect(report.sampleConid).toBe(265598);
    expect(report.steps.every((s) => s.status === 'pass')).toBe(true);
  });

  it('walks the endpoints in the order the bot actually needs them', async () => {
    const { client, calls } = fakeGateway();
    await runConnectionCheck({ client });
    // The priming call has to come before market data, or the history request
    // fails with an error that says nothing about the real cause.
    expect(calls.indexOf('/iserver/accounts')).toBeLessThan(
      calls.findIndex((p) => p.startsWith('/iserver/marketdata/history')),
    );
  });
});

describe('the failure the check exists to catch', () => {
  it('fails loudly when the equity field has a different name', async () => {
    // This is the dangerous one. A renamed field does not raise: Number(undefined)
    // is NaN, the guard turns it into 0, and the bot reads an empty account while
    // looking perfectly healthy. So the check asks whether the field is there.
    const { client } = fakeGateway({
      '/portfolio/DU1234567/ledger': {
        BASE: { cash: 100000, netLiquidation: 100000 },
      },
    });
    const report = await runConnectionCheck({ client });

    expect(report.ok).toBe(false);
    const step = report.steps.find((s) => s.name === 'Account equity readable');
    expect(step?.status).toBe('fail');
    expect(step?.fields?.find((f) => f.name === 'cashbalance')?.found).toBe(false);
    // And it hands back the body, so the real field names can be read off it.
    expect(step?.raw).toContain('netLiquidation');
  });

  it('names the field it found when the field is there', async () => {
    const { client } = fakeGateway();
    const report = await runConnectionCheck({ client });
    const step = report.steps.find((s) => s.name === 'Account equity readable');
    expect(step?.fields?.find((f) => f.name === 'cashbalance')?.value).toContain('100000');
  });
});

describe('the connection check on a gateway that is not ready', () => {
  it('stops at the first step when nothing is listening', async () => {
    const { client } = fakeGateway({
      '/iserver/auth/status': new Error('Nothing is listening on https://localhost:5000'),
    });
    const report = await runConnectionCheck({ client });
    expect(report.ok).toBe(false);
    // No point asking about accounts when the gateway is not there.
    expect(report.steps).toHaveLength(1);
    expect(report.steps[0]?.detail).toMatch(/Nothing is listening/);
  });

  it('stops when the gateway is up but not logged in', async () => {
    const { client } = fakeGateway({
      '/iserver/auth/status': { authenticated: false, connected: true, competing: false },
    });
    const report = await runConnectionCheck({ client });
    expect(report.ok).toBe(false);
    expect(report.steps[0]?.detail).toMatch(/not logged in/);
    expect(report.steps).toHaveLength(1);
  });

  it('warns rather than fails when another session holds the login', async () => {
    const { client } = fakeGateway({
      '/iserver/auth/status': { authenticated: true, connected: true, competing: true },
    });
    const report = await runConnectionCheck({ client });
    // Requests keep succeeding while orders quietly stop reaching the exchange,
    // which is the worst failure mode a bot has — so it is surfaced, and the run
    // continues so the rest can still be checked.
    expect(report.steps[0]?.status).toBe('warn');
    expect(report.steps.length).toBeGreaterThan(1);
    expect(report.ok).toBe(false);
  });

  it('reports no bars as a permissions problem rather than a code one', async () => {
    const { client } = fakeGateway({ history: { data: [] } });
    const report = await runConnectionCheck({ client });
    const step = report.steps.find((s) => s.name === 'Historical bars readable');
    expect(step?.status).toBe('fail');
    expect(step?.detail).toMatch(/market-data permission/);
  });

  it('catches bars that arrive under different field names', async () => {
    const { client } = fakeGateway({
      history: { data: [{ time: 1, open: 1, high: 2, low: 0, close: 1 }] },
    });
    const report = await runConnectionCheck({ client });
    const step = report.steps.find((s) => s.name === 'Historical bars readable');
    expect(step?.status).toBe('fail');
    expect(step?.detail).toMatch(/not with the field names/);
  });

  it('skips the steps it cannot reach instead of inventing a result', async () => {
    const { client } = fakeGateway({ '/iserver/secdef/search': [] });
    const report = await runConnectionCheck({ client });
    expect(report.sampleConid).toBeNull();
    const bars = report.steps.find((s) => s.name === 'Historical bars readable');
    expect(bars?.status).toBe('skipped');
  });

  it('carries on past a broken step to report everything else', async () => {
    const { client } = fakeGateway({
      '/portfolio/DU1234567/positions/0': new IbkrError('500', 500, 'server error'),
    });
    const report = await runConnectionCheck({ client });
    expect(report.ok).toBe(false);
    // One broken endpoint should not hide the state of the others.
    expect(report.sampleConid).toBe(265598);
    expect(report.steps.filter((s) => s.status === 'pass').length).toBeGreaterThan(3);
  });

  it('flags a real-money account so it is noticed before it is typed', async () => {
    const { client } = fakeGateway({
      '/portfolio/accounts': [{ accountId: 'U7654321' }],
      '/portfolio/U7654321/ledger': {
        BASE: { cashbalance: 1, netliquidationvalue: 1 },
      },
      '/portfolio/U7654321/positions/0': [],
    });
    const report = await runConnectionCheck({ client });
    const step = report.steps.find((s) => s.name === 'Accounts listed');
    expect(step?.detail).toContain('REAL MONEY');
  });
});
