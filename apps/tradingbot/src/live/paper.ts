import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { sleep } from '../data/binance.js';
import { binanceDataSource } from '../data/binanceSource.js';
import type { DataSource } from '../data/source.js';
import { DEFAULT_LIMITS, RiskManager, type RiskLimits } from '../risk/risk.js';
import { volatilityScalar, type SizingConfig } from '../risk/sizing.js';
import { StopTracker, hasStops, type StopConfig } from '../risk/stops.js';
import type { Strategy } from '../strategy/types.js';
import {
  DEFAULT_COSTS,
  INTERVAL_MS,
  type Candle,
  type CostModel,
  type Interval,
} from '../types.js';
import { PaperExecution, type ExecutionAdapter } from './execution.js';
import { silentNotifier, type Notifier } from './notify.js';
import { STATE_VERSION, loadState, saveState } from './state.js';

export interface LiveRunOptions {
  /** A Binance symbol, or an IBKR contract ID. Whatever the data source speaks. */
  instrument: string;
  interval: Interval;
  strategy: Strategy;
  data: DataSource;
  execution: ExecutionAdapter;
  /** Only used by a simulated adapter; a live one asks the broker. */
  startingCash: number;
  warmupBars: number;
  limits?: RiskLimits;
  stops?: StopConfig;
  sizing?: SizingConfig;
  maxBars?: number;
  journalPath?: string;
  /** Persist the account here after every bar. Simulated adapters only. */
  statePath?: string;
  resume?: boolean;
  notifier?: Notifier;
  log?: (line: string) => void;
}

/**
 * Run a strategy against live prices, one closed bar at a time.
 *
 * The same function drives a simulated account and a real broker, which is the
 * point: the thing you forward-test for three months is the thing you later point
 * at an account, rather than a second implementation that agrees with the first
 * until it doesn't.
 *
 * Where the two genuinely differ, the differences are not papered over. A
 * simulated fill happens at this bar's close plus slippage and is known
 * immediately; a real order is submitted and its fill is discovered by reading
 * the position back from the broker on the next bar. The journal records both the
 * price the decision was made at and what came back, so the gap between them can
 * be measured rather than assumed away.
 */
export async function runLive(options: LiveRunOptions): Promise<void> {
  const {
    instrument,
    interval,
    strategy,
    data,
    execution,
    startingCash,
    warmupBars,
    maxBars,
    journalPath,
    statePath,
  } = options;
  const limits = options.limits ?? DEFAULT_LIMITS;
  const notifier = options.notifier ?? silentNotifier;
  const log = options.log ?? ((line: string) => console.log(line));
  const barMs = INTERVAL_MS[interval];

  const simulated = execution instanceof PaperExecution ? execution : null;
  if (statePath && !simulated) {
    throw new Error(
      'State files belong to a simulated account. A live broker already holds the ' +
        'position and the balance, and keeping a second copy here would let the two ' +
        'disagree — so the live loop reads them back from the broker each bar instead.',
    );
  }

  const saved =
    options.resume && statePath
      ? loadState(statePath, { symbol: instrument, interval, strategy: strategy.name })
      : null;

  const startingEquity = saved?.risk.highWater ?? (await Promise.resolve(execution.equity(0))) ?? startingCash;
  const risk = new RiskManager(
    startingEquity > 0 ? startingEquity : startingCash,
    limits,
    barMs < 86_400_000,
  );
  if (saved) {
    risk.restoreFrom(saved.risk);
    log(
      `Resuming the run started ${saved.startedAt}: ` +
        `last bar ${new Date(saved.lastBarTime).toISOString()}.`,
    );
    if (risk.isTripped) {
      log(`This run is already stopped: ${risk.trippedReason}. Nothing to do.`);
      return;
    }
  }

  const stopConfig = options.stops ?? {};
  const stopsOn = hasStops(stopConfig);
  const stopTracker = new StopTracker(stopConfig);
  let cooldownBarsLeft = 0;

  log(`Loading ${warmupBars} bars of warm-up history for ${instrument} ${interval}...`);
  const history = await data.recent(instrument, interval, warmupBars);
  if (history.length < strategy.warmupBars) {
    throw new Error(
      `${strategy.name} needs ${strategy.warmupBars} bars but ${data.name} returned ` +
        `only ${history.length}. Ask for more warm-up, or a coarser interval.`,
    );
  }

  const candles: Candle[] = [...history];
  const closes = candles.map((c) => c.close);
  let lastSeen = Math.max(saved?.lastBarTime ?? 0, candles[candles.length - 1]?.openTime ?? 0);
  let barsProcessed = 0;
  const startedAt = saved?.startedAt ?? new Date().toISOString();

  const persist = (): void => {
    if (!statePath || !simulated) return;
    saveState(statePath, {
      version: STATE_VERSION,
      symbol: instrument,
      interval,
      strategy: strategy.name,
      lastBarTime: lastSeen,
      startedAt,
      updatedAt: new Date().toISOString(),
      broker: simulated.state,
      risk: risk.state,
    });
  };

  log(
    `Running ${strategy.name} on ${instrument} ${interval} through ${execution.label}. ` +
      `Ctrl-C to stop.`,
  );
  persist();
  await notifier.send({
    event: 'started',
    symbol: instrument,
    strategy: strategy.name,
    message: `Run started on ${instrument} ${interval} via ${execution.label}`,
  });

  for (;;) {
    if (maxBars !== undefined && barsProcessed >= maxBars) {
      await notifier.send({
        event: 'stopped',
        symbol: instrument,
        strategy: strategy.name,
        message: `Run finished after ${barsProcessed} bars`,
      });
      return;
    }

    // Wait until a little past the moment the current bar should have closed. A
    // faster poll only burns rate limit: the bar does not exist until it closes.
    // On a market that shuts overnight this simply finds nothing and waits again,
    // which is the correct behaviour and why there is no separate calendar here.
    const waitMs = Math.max(2_000, lastSeen + 2 * barMs - Date.now() + 3_000);
    await sleep(waitMs);

    const fresh = await data.since(instrument, interval, lastSeen);
    if (fresh.length === 0) continue;

    for (const bar of fresh) {
      candles.push(bar);
      closes.push(bar.close);
      lastSeen = bar.openTime;
      barsProcessed += 1;

      const equity = await Promise.resolve(execution.equity(bar.close));
      const currentWeight = await Promise.resolve(execution.weight(bar.close));
      risk.mark(bar.openTime, equity);

      if (stopsOn && currentWeight !== 0 && !stopTracker.isOpen) {
        // A resumed or externally-opened position has no recorded entry, so this
        // bar's open stands in for it. Stated plainly because it makes the first
        // stop after a restart approximate.
        stopTracker.open(currentWeight > 0 ? 'long' : 'short', bar.open);
      }

      let protective = null;
      if (stopsOn && currentWeight !== 0) {
        protective = stopTracker.check(bar);
        if (!protective) stopTracker.observe(bar);
      }

      const strategyTarget = strategy.onBar({ candles, closes, currentWeight });
      const afterCooldown = cooldownBarsLeft > 0 ? Math.min(strategyTarget, currentWeight, 0) : strategyTarget;
      const target = options.sizing
        ? afterCooldown * volatilityScalar(closes, interval, options.sizing)
        : afterCooldown;
      if (cooldownBarsLeft > 0) cooldownBarsLeft -= 1;

      const verdict = risk.evaluate(target, currentWeight, equity, bar.close);

      let outcome = null;
      let action = verdict.action as string;
      if (protective) {
        action = protective.reason;
        log(
          `  ${protective.reason} at ${protective.price.toFixed(2)} ` +
            `(resting at ${protective.trigger.toFixed(2)})`,
        );
        // The exit is sent at this bar's close, not at `protective.price`. Live,
        // the bar is already over by the time the stop is noticed, so the market
        // order goes out at whatever is current — the backtest's intrabar fill is
        // not available to a loop that acts on closed bars. The journal records
        // both numbers so the difference can be measured rather than assumed. A
        // stop that has to fire intrabar belongs at the broker as a resting order,
        // which this adapter does not yet place.
        outcome = await execution.flatten(bar.close, bar.openTime);
        stopTracker.close();
        cooldownBarsLeft = stopConfig.cooldownBars ?? 0;
      } else if (verdict.action === 'flatten') {
        outcome = await execution.flatten(bar.close, bar.openTime);
        stopTracker.close();
      } else if (verdict.action === 'allow') {
        const before = currentWeight;
        outcome = await execution.rebalanceTo(verdict.weight, bar.close, bar.openTime);
        if (stopsOn && verdict.weight !== 0 && before === 0) {
          stopTracker.open(verdict.weight > 0 ? 'long' : 'short', bar.close);
        } else if (stopsOn && verdict.weight === 0) {
          stopTracker.close();
        }
      }

      const entry = {
        time: new Date(bar.openTime).toISOString(),
        instrument,
        venue: execution.label,
        close: bar.close,
        target,
        strategyTarget,
        action,
        reason: verdict.action === 'allow' ? null : verdict.reason,
        weightBefore: currentWeight,
        equity,
        levels: stopTracker.levels(),
        outcome,
      };

      log(
        `${entry.time}  close ${bar.close.toFixed(2)}  target ${target.toFixed(2)}  ` +
          `weight ${currentWeight.toFixed(2)}  equity ${equity.toFixed(2)}  ` +
          describeOutcome(outcome),
      );

      if (journalPath) {
        mkdirSync(dirname(journalPath), { recursive: true });
        appendFileSync(journalPath, `${JSON.stringify(entry)}\n`, 'utf8');
      }

      persist();

      if (outcome?.kind === 'filled' || outcome?.kind === 'submitted') {
        await notifier.send({
          event: 'fill',
          symbol: instrument,
          strategy: strategy.name,
          message: describeOutcome(outcome),
          equity,
          weight: currentWeight,
          price: bar.close,
        });
      }

      if (risk.isTripped) {
        log(`Kill switch: ${risk.trippedReason}. Stopping.`);
        await notifier.send({
          event: 'kill-switch',
          symbol: instrument,
          strategy: strategy.name,
          message: risk.trippedReason ?? 'kill switch',
          equity,
        });
        return;
      }
    }
  }
}

function describeOutcome(outcome: Awaited<ReturnType<ExecutionAdapter['rebalanceTo']>> | null): string {
  if (!outcome) return '';
  switch (outcome.kind) {
    case 'filled':
      return `filled ${outcome.fill.qty.toFixed(6)} @ ${outcome.fill.price.toFixed(2)}`;
    case 'submitted':
      return `submitted ${outcome.requestedQuantity} (order ${outcome.orderId}) — ${outcome.note}`;
    case 'skipped':
      return `[${outcome.reason}]`;
  }
}

export interface PaperRunOptions {
  symbol: string;
  interval: Interval;
  strategy: Strategy;
  startingCash: number;
  warmupBars: number;
  costs?: CostModel;
  limits?: RiskLimits;
  stops?: StopConfig;
  sizing?: SizingConfig;
  maxBars?: number;
  journalPath?: string;
  statePath?: string;
  resume?: boolean;
  notifier?: Notifier;
  log?: (line: string) => void;
}

/**
 * Forward-test against Binance prices with simulated money.
 *
 * The step between a backtest and a broker, and skipping it is how people
 * discover, with real money, that their backtest had a bug. Run it for at least
 * thirty times the strategy's average holding period. Anything shorter is a demo.
 */
export async function runPaper(options: PaperRunOptions): Promise<void> {
  const costs = options.costs ?? DEFAULT_COSTS;
  const saved =
    options.resume && options.statePath
      ? loadState(options.statePath, {
          symbol: options.symbol,
          interval: options.interval,
          strategy: options.strategy.name,
        })
      : null;

  await runLive({
    instrument: options.symbol,
    interval: options.interval,
    strategy: options.strategy,
    data: binanceDataSource(),
    execution: new PaperExecution(options.startingCash, costs, saved?.broker),
    startingCash: options.startingCash,
    warmupBars: options.warmupBars,
    limits: options.limits,
    stops: options.stops,
    sizing: options.sizing,
    maxBars: options.maxBars,
    journalPath: options.journalPath,
    statePath: options.statePath,
    resume: options.resume,
    notifier: options.notifier,
    log: options.log,
  });
}
