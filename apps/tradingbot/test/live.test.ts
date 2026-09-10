import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PaperBroker } from '../src/engine/broker.js';
import { PaperExecution } from '../src/live/execution.js';
import { silentNotifier, webhookNotifier } from '../src/live/notify.js';
import { STATE_VERSION, loadState, saveState, type PaperState } from '../src/live/state.js';
import { RiskManager } from '../src/risk/risk.js';
import { DEFAULT_COSTS, type CostModel } from '../src/types.js';

const FREE: CostModel = { feeBps: 0, slippageBps: 0, borrowBpsPerDay: 0 };

function tempPath(name: string): string {
  return join(mkdtempSync(join(tmpdir(), 'bot-live-')), name);
}

function stateFor(broker: PaperBroker, risk: RiskManager): PaperState {
  return {
    version: STATE_VERSION,
    symbol: 'BTCUSDT',
    interval: '1h',
    strategy: 'ema-cross(8,21)',
    lastBarTime: 1_700_000_000_000,
    startedAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
    broker: broker.state,
    risk: risk.state,
  };
}

describe('broker state', () => {
  it('restores an account that is fully invested and holds no cash', () => {
    const original = new PaperBroker(1000, FREE);
    original.rebalanceTo(1, 100, 0);
    expect(original.cash).toBeCloseTo(0, 10);

    const restored = PaperBroker.restore(original.state, FREE);
    expect(restored.cash).toBeCloseTo(0, 10);
    expect(restored.qty).toBeCloseTo(original.qty, 10);
    expect(restored.equity(100)).toBeCloseTo(1000, 8);
  });

  it('carries the fill log, fees and an open position across a restart', () => {
    const original = new PaperBroker(1000, DEFAULT_COSTS);
    original.rebalanceTo(1, 100, 0);
    original.rebalanceTo(0, 110, 1);
    original.rebalanceTo(0.5, 105, 2);

    const restored = PaperBroker.restore(original.state, DEFAULT_COSTS);
    expect(restored.fills).toHaveLength(3);
    expect(restored.trades).toHaveLength(1);
    expect(restored.fees).toBeCloseTo(original.fees, 10);
    expect(restored.turnover).toBeCloseTo(original.turnover, 10);

    // The still-open position closes into a second round trip, which only works
    // if the open leg survived the restore.
    restored.rebalanceTo(0, 120, 3);
    expect(restored.trades).toHaveLength(2);
  });
});

describe('risk state', () => {
  it('remembers the high-water mark, so a restart does not measure from the bottom', () => {
    const original = new RiskManager(1000, {
      maxWeight: 1,
      maxDailyLossPct: 1,
      maxDrawdownPct: 0.2,
      rebalanceThreshold: 0,
      minOrderQuote: 0,
    });
    original.mark(0, 1000);
    original.mark(86_400_000, 2000);
    original.mark(2 * 86_400_000, 1700);
    expect(original.isTripped).toBe(false);

    const restored = new RiskManager(1700, {
      maxWeight: 1,
      maxDailyLossPct: 1,
      maxDrawdownPct: 0.2,
      rebalanceThreshold: 0,
      minOrderQuote: 0,
    });
    restored.restoreFrom(original.state);
    // Without the restored high-water mark of 2000, a fall to 1599 would look
    // like a 6% drawdown from 1700 instead of the 20% it really is. The figure
    // sits just past the limit rather than exactly on it, because asserting on
    // an exact boundary would be testing floating-point rounding.
    restored.mark(3 * 86_400_000, 1599);
    expect(restored.isTripped).toBe(true);
  });

  it('stays tripped across a restart', () => {
    const original = new RiskManager(1000, {
      maxWeight: 1,
      maxDailyLossPct: 1,
      maxDrawdownPct: 0.1,
      rebalanceThreshold: 0,
      minOrderQuote: 0,
    });
    original.mark(0, 1000);
    original.mark(86_400_000, 800);
    expect(original.isTripped).toBe(true);

    const restored = new RiskManager(800);
    restored.restoreFrom(original.state);
    expect(restored.isTripped).toBe(true);
    expect(restored.trippedReason).toMatch(/kill switch/);
  });
});

describe('saveState and loadState', () => {
  const expected = { symbol: 'BTCUSDT', interval: '1h' as const, strategy: 'ema-cross(8,21)' };

  it('survives a round trip through the filesystem', () => {
    const path = tempPath('run.json');
    const broker = new PaperBroker(1000, DEFAULT_COSTS);
    broker.rebalanceTo(1, 100, 0);
    const risk = new RiskManager(1000);
    risk.mark(0, 1000);

    saveState(path, stateFor(broker, risk));
    const loaded = loadState(path, expected);
    expect(loaded?.broker.qty).toBeCloseTo(broker.qty, 10);
    expect(loaded?.lastBarTime).toBe(1_700_000_000_000);
    expect(loaded?.startedAt).toBe('2026-01-01T00:00:00.000Z');
  });

  it('returns null when there is nothing to resume', () => {
    expect(loadState(tempPath('absent.json'), expected)).toBeNull();
  });

  it('refuses a state file written for a different strategy', () => {
    const path = tempPath('run.json');
    saveState(path, stateFor(new PaperBroker(1000, FREE), new RiskManager(1000)));
    expect(() => loadState(path, { ...expected, strategy: 'donchian(20,10)' })).toThrow(
      /different run/,
    );
  });

  it('refuses a state file written for a different symbol or interval', () => {
    const path = tempPath('run.json');
    saveState(path, stateFor(new PaperBroker(1000, FREE), new RiskManager(1000)));
    expect(() => loadState(path, { ...expected, symbol: 'ETHUSDT' })).toThrow(/different run/);
    expect(() => loadState(path, { ...expected, interval: '1d' })).toThrow(/different run/);
  });

  it('refuses a state file from another version rather than misreading it', () => {
    const path = tempPath('run.json');
    const state = stateFor(new PaperBroker(1000, FREE), new RiskManager(1000));
    writeFileSync(path, JSON.stringify({ ...state, version: 999 }), 'utf8');
    expect(() => loadState(path, expected)).toThrow(/version 999/);
  });

  it('refuses a truncated state file', () => {
    const path = tempPath('run.json');
    writeFileSync(
      path,
      JSON.stringify({ version: STATE_VERSION, ...expected, startedAt: 'x' }),
      'utf8',
    );
    expect(() => loadState(path, expected)).toThrow(/missing the broker or risk state/);
  });

  it('leaves no temporary file behind', () => {
    const path = tempPath('run.json');
    saveState(path, stateFor(new PaperBroker(1000, FREE), new RiskManager(1000)));
    expect(() => readFileSync(`${path}.tmp`, 'utf8')).toThrow();
  });
});

describe('PaperExecution', () => {
  it('resumes from a saved broker state instead of restarting at opening cash', async () => {
    const first = new PaperExecution(1000, FREE);
    await first.rebalanceTo(1, 100, 0);

    const second = new PaperExecution(1000, FREE, first.state);
    expect(second.equity(100)).toBeCloseTo(1000, 8);
    expect(second.weight(100)).toBeCloseTo(1, 8);
    expect(second.fills).toHaveLength(1);
  });
});

describe('the webhook notifier', () => {
  it('refuses plain HTTP, which would leak the payload', () => {
    expect(() => webhookNotifier('http://example.com/hook', () => {})).toThrow(/must be https/);
  });

  it('refuses something that is not a URL at all', () => {
    expect(() => webhookNotifier('not-a-url', () => {})).toThrow(/not a valid URL/);
  });

  it('accepts an https endpoint', () => {
    expect(() => webhookNotifier('https://example.com/hook', () => {})).not.toThrow();
  });

  it('has a no-op default so callers need no null checks', async () => {
    await expect(
      silentNotifier.send({ event: 'started', symbol: 'BTCUSDT', strategy: 'x', message: 'y' }),
    ).resolves.toBeUndefined();
  });
});
