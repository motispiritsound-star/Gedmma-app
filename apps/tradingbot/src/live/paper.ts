import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fetchCandles, sleep } from '../data/binance.js';
import { DEFAULT_LIMITS, RiskManager, type RiskLimits } from '../risk/risk.js';
import type { Strategy } from '../strategy/types.js';
import {
  DEFAULT_COSTS,
  INTERVAL_MS,
  type Candle,
  type CostModel,
  type Interval,
} from '../types.js';
import { PaperExecution } from './execution.js';

export interface PaperRunOptions {
  symbol: string;
  interval: Interval;
  strategy: Strategy;
  startingCash: number;
  /** How many historical bars to load before the first decision. */
  warmupBars: number;
  costs?: CostModel;
  limits?: RiskLimits;
  /** Stop after this many new bars. Runs until interrupted when undefined. */
  maxBars?: number;
  /** Append every decision here as JSON lines, for later inspection. */
  journalPath?: string;
  log?: (line: string) => void;
}

/**
 * Forward-test against live prices without any money at risk.
 *
 * This is the step between a backtest and an exchange, and skipping it is how
 * people discover, with real money, that their backtest had a bug. It is also
 * the only way to find out what the strategy does to you: watching a simulated
 * account sit in a 15% drawdown for three weeks tells you something about
 * yourself that a table of ratios cannot.
 *
 * Run it for at least as long as the strategy's average holding period times
 * thirty. Anything shorter is a demo, not a test.
 */
export async function runPaper(options: PaperRunOptions): Promise<void> {
  const {
    symbol,
    interval,
    strategy,
    startingCash,
    warmupBars,
    maxBars,
    journalPath,
  } = options;
  const costs = options.costs ?? DEFAULT_COSTS;
  const limits = options.limits ?? DEFAULT_LIMITS;
  const log = options.log ?? ((line: string) => console.log(line));

  const barMs = INTERVAL_MS[interval];
  const execution = new PaperExecution(startingCash, costs);
  const risk = new RiskManager(startingCash, limits);

  log(`Loading ${warmupBars} bars of warm-up history for ${symbol} ${interval}...`);
  const history = await fetchCandles({
    symbol,
    interval,
    startTime: Date.now() - (warmupBars + 5) * barMs,
  });
  if (history.length < strategy.warmupBars) {
    throw new Error(
      `${strategy.name} needs ${strategy.warmupBars} bars but only ${history.length} loaded`,
    );
  }

  const candles: Candle[] = [...history];
  const closes = candles.map((c) => c.close);
  let lastSeen = candles[candles.length - 1]?.openTime ?? 0;
  let barsProcessed = 0;

  log(
    `Paper trading ${strategy.name} on ${symbol} ${interval}. ` +
      `No keys, no orders, no money at risk. Ctrl-C to stop.`,
  );

  for (;;) {
    if (maxBars !== undefined && barsProcessed >= maxBars) return;

    // Wait until a little past the moment the current bar should have closed,
    // then ask for it. Polling faster only burns rate limit: the bar does not
    // exist until it closes.
    const nextClose = lastSeen + 2 * barMs;
    const waitMs = Math.max(2_000, nextClose - Date.now() + 3_000);
    await sleep(waitMs);

    const fresh = await fetchCandles({ symbol, interval, startTime: lastSeen + 1 });
    const closed = fresh.filter((c) => c.openTime > lastSeen);
    if (closed.length === 0) continue;

    for (const bar of closed) {
      candles.push(bar);
      closes.push(bar.close);
      lastSeen = bar.openTime;
      barsProcessed += 1;

      const equity = execution.equity(bar.close);
      risk.mark(bar.openTime, equity);
      const currentWeight = execution.weight(bar.close);
      const target = strategy.onBar({ candles, closes, currentWeight });
      const verdict = risk.evaluate(target, currentWeight, equity, bar.close);

      // A backtest fills at the next bar's open, which it can see. Live, the
      // next open has not happened yet, so the fill is at this close plus
      // slippage. The difference is real and the journal records both prices so
      // the two can be compared afterwards.
      let fill = null;
      if (verdict.action === 'flatten') {
        fill = await execution.flatten(bar.close, bar.openTime);
      } else if (verdict.action === 'allow') {
        fill = await execution.rebalanceTo(verdict.weight, bar.close, bar.openTime);
      }

      const entry = {
        time: new Date(bar.openTime).toISOString(),
        close: bar.close,
        target,
        verdict: verdict.action,
        reason: verdict.action === 'allow' ? null : verdict.reason,
        weight: execution.weight(bar.close),
        equity: execution.equity(bar.close),
        fill: fill ? { qty: fill.qty, price: fill.price, fee: fill.fee } : null,
      };

      log(
        `${entry.time}  close ${bar.close.toFixed(2)}  target ${target.toFixed(2)}  ` +
          `weight ${entry.weight.toFixed(2)}  equity ${entry.equity.toFixed(2)}` +
          (fill ? `  filled ${fill.qty.toFixed(6)} @ ${fill.price.toFixed(2)}` : '') +
          (verdict.action === 'allow' ? '' : `  [${verdict.reason}]`),
      );

      if (journalPath) {
        mkdirSync(dirname(journalPath), { recursive: true });
        appendFileSync(journalPath, `${JSON.stringify(entry)}\n`, 'utf8');
      }

      if (risk.isTripped) {
        log(`Kill switch: ${risk.trippedReason}. Stopping.`);
        return;
      }
    }
  }
}
