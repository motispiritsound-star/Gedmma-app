#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
import { fetchCandles } from './data/binance.js';
import {
  bpsCommission,
  describeCommission,
  ibkrFixedShares,
  ibkrTieredShares,
  krakenSpot,
  type CommissionModel,
} from './costs/commission.js';
import { DEFAULT_IMPACT, type ImpactModel } from './costs/slippage.js';
import { assessGoal, liquidationExposure, minimumSharpeFor } from './engine/feasibility.js';
import { alignUniverse } from './data/align.js';
import {
  auditSeries,
  cachePath,
  cleanSeries,
  readCandles,
  readCandlesIfPresent,
  sliceByTime,
  writeCandles,
} from './data/store.js';
import {
  cryptoLikeUniverse,
  meanRevertingSeries,
  randomWalk,
  trendingSeries,
} from './data/synthetic.js';
import { analyseCorrelation } from './engine/correlation.js';
import { runBacktest, type BacktestResult } from './engine/backtest.js';
import { runNoiseTest, runPortfolioNoiseTest } from './engine/noise.js';
import {
  DEFAULT_PORTFOLIO_LIMITS,
  runPortfolioBacktest,
  type PortfolioLimits,
} from './engine/portfolio.js';
import { runPortfolioWalkForward } from './engine/portfolioWalkforward.js';
import { assessSignificance } from './engine/significance.js';
import { runWalkForward } from './engine/walkforward.js';
import { runLive, runPaper } from './live/paper.js';
import { IbkrClient } from './broker/ibkrClient.js';
import { IbkrExecution, isPaperAccount } from './broker/ibkrExecution.js';
import { KrakenClient, credentialsFromEnv } from './broker/krakenClient.js';
import { KrakenExecution } from './broker/krakenExecution.js';
import { ibkrDataSource } from './data/ibkrData.js';
import { fetchPair, krakenDataSource, MAX_OHLC_BARS } from './data/kraken.js';
import { DEFAULT_SIZING, type SizingConfig } from './risk/sizing.js';
import { hasStops, type StopConfig } from './risk/stops.js';
import { silentNotifier, webhookNotifier } from './live/notify.js';
import {
  formatDate,
  heading,
  renderGoal,
  renderBacktest,
  renderComparison,
  renderCorrelation,
  renderNoise,
  renderPortfolio,
  renderPortfolioNoise,
  renderPortfolioWalkForward,
  renderSignificance,
  renderWalkForward,
  rule,
  wrap,
} from './report.js';
import { DEFAULT_LIMITS, type RiskLimits } from './risk/risk.js';
import {
  buildPortfolioStrategy,
  buildStrategy,
  factoryByName,
  portfolioFactoryByName,
  portfolioStrategyNames,
  strategyNames,
} from './strategy/registry.js';
import {
  DEFAULT_COSTS,
  isInterval,
  type Candle,
  type CostModel,
  type Interval,
} from './types.js';

interface Args {
  command: string;
  flags: Map<string, string>;
  bools: Set<string>;
  /** Positional words after the command, for subcommands like `ibkr status`. */
  rest: string[];
}

function parseArgs(argv: readonly string[]): Args {
  const flags = new Map<string, string>();
  const bools = new Set<string>();
  const rest: string[] = [];
  const command = argv[0] ?? 'help';

  for (let i = 1; i < argv.length; i += 1) {
    const token = argv[i] as string;
    if (!token.startsWith('--')) {
      rest.push(token);
      continue;
    }
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) {
      bools.add(key);
    } else {
      flags.set(key, next);
      i += 1;
    }
  }

  return { command, flags, bools, rest };
}

function num(args: Args, key: string, fallback: number): number {
  const raw = args.flags.get(key);
  if (raw === undefined) return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value)) throw new Error(`--${key} must be a number, got "${raw}"`);
  return value;
}

function str(args: Args, key: string, fallback: string): string {
  return args.flags.get(key) ?? fallback;
}

function interval(args: Args): Interval {
  const raw = str(args, 'interval', '1d');
  if (!isInterval(raw)) {
    throw new Error(`--interval must be one of 1m, 5m, 15m, 1h, 4h, 1d (got "${raw}")`);
  }
  return raw;
}

/**
 * Build the cost model from the flags.
 *
 * `--commission` picks the shape. A crypto exchange charges basis points; a
 * broker charges per share with a floor, and the floor is what a small account
 * actually pays, so the two cannot share one number.
 */
/**
 * The market-impact model, off unless asked for.
 *
 * Off by default because it makes a result size-dependent, and a size-dependent
 * result that nobody asked for is confusing. On, because a result that is not
 * size-dependent is wrong.
 */
function impactFrom(args: Args): ImpactModel | undefined {
  if (!args.bools.has('impact') && !args.flags.has('impact-k')) return undefined;
  return {
    coefficient: num(args, 'impact-k', DEFAULT_IMPACT.coefficient),
    negligibleParticipation: num(
      args,
      'impact-floor',
      DEFAULT_IMPACT.negligibleParticipation,
    ),
    maxBps: num(args, 'max-impact-bps', DEFAULT_IMPACT.maxBps),
  };
}

function costsFrom(args: Args): CostModel {
  const scheme = str(args, 'commission', 'bps');
  let commission: CommissionModel;
  switch (scheme) {
    case 'bps':
      commission = bpsCommission(num(args, 'fee-bps', 10));
      break;
    case 'ibkr-tiered':
      commission = ibkrTieredShares();
      break;
    case 'ibkr-fixed':
      commission = ibkrFixedShares();
      break;
    case 'kraken':
      commission = krakenSpot({
        thirtyDayVolumeUsd: num(args, 'volume-30d', 0),
        role: str(args, 'role', 'taker') === 'maker' ? 'maker' : 'taker',
      });
      break;
    case 'per-unit':
      commission = {
        kind: 'per-unit',
        perUnit: num(args, 'per-unit', 0.0035),
        minimumPerOrder: num(args, 'min-commission', 0.35),
        maxFractionOfNotional: num(args, 'max-commission-pct', 0.01),
      };
      break;
    case 'per-order':
      commission = { kind: 'per-order', amount: num(args, 'per-order', 1) };
      break;
    default:
      throw new Error(
        `--commission must be bps, kraken, ibkr-tiered, ibkr-fixed, per-unit or ` +
          `per-order ` +
          `(got "${scheme}")`,
      );
  }
  return {
    commission,
    slippageBps: num(args, 'slippage-bps', DEFAULT_COSTS.slippageBps),
    borrowBpsPerDay: num(args, 'borrow-bps', DEFAULT_COSTS.borrowBpsPerDay),
    impact: impactFrom(args),
  };
}

function limitsFrom(args: Args): RiskLimits {
  return {
    maxWeight: num(args, 'max-weight', DEFAULT_LIMITS.maxWeight),
    maxDailyLossPct: num(args, 'max-daily-loss', DEFAULT_LIMITS.maxDailyLossPct),
    maxDrawdownPct: num(args, 'max-drawdown', DEFAULT_LIMITS.maxDrawdownPct),
    rebalanceThreshold: num(args, 'rebalance-threshold', DEFAULT_LIMITS.rebalanceThreshold),
    minOrderQuote: num(args, 'min-order', DEFAULT_LIMITS.minOrderQuote),
  };
}

/**
 * Protective exits from the flags. Absent, the strategy's own signal is the only
 * thing that ever closes a position.
 */
function stopsFrom(args: Args): StopConfig | undefined {
  const config: StopConfig = {
    initialPct: args.flags.has('stop-loss') ? num(args, 'stop-loss', 0) : undefined,
    trailingPct: args.flags.has('trailing-stop') ? num(args, 'trailing-stop', 0) : undefined,
    takeProfitPct: args.flags.has('take-profit') ? num(args, 'take-profit', 0) : undefined,
    cooldownBars: args.flags.has('cooldown') ? num(args, 'cooldown', 0) : undefined,
  };
  return hasStops(config) ? config : undefined;
}

function sizingFrom(args: Args): SizingConfig | undefined {
  if (!args.flags.has('target-vol')) return undefined;
  return {
    targetAnnualVol: num(args, 'target-vol', DEFAULT_SIZING.targetAnnualVol),
    lookback: num(args, 'vol-lookback', DEFAULT_SIZING.lookback),
    maxLeverage: num(args, 'max-weight', DEFAULT_SIZING.maxLeverage),
  };
}

function parseDate(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const ms = Date.parse(value);
  if (!Number.isFinite(ms)) throw new Error(`Could not read "${value}" as a date`);
  return ms;
}

/**
 * Get candles from wherever the flags point: a CSV, the synthetic generator, or
 * the cache (downloading what is missing). Downloading is last on purpose — a
 * research loop should hit the network once, not on every run.
 */
async function loadCandles(args: Args): Promise<{ candles: Candle[]; label: string }> {
  const iv = interval(args);
  const from = parseDate(args.flags.get('from'));
  const to = parseDate(args.flags.get('to'));

  const csv = args.flags.get('csv');
  if (csv) {
    return { candles: sliceByTime(cleanSeries(readCandles(csv)), from, to), label: csv };
  }

  const synthetic = args.flags.get('synthetic');
  if (synthetic) {
    const bars = num(args, 'bars', 1500);
    const seed = num(args, 'seed', 42);
    const makers: Record<string, (b: number, i: Interval, s: number) => Candle[]> = {
      random: randomWalk,
      trend: trendingSeries,
      revert: meanRevertingSeries,
    };
    const maker = makers[synthetic];
    if (!maker) {
      throw new Error(`--synthetic must be one of random, trend, revert (got "${synthetic}")`);
    }
    return { candles: maker(bars, iv, seed), label: `synthetic:${synthetic} seed ${seed}` };
  }

  const symbol = str(args, 'symbol', 'BTCUSDT').toUpperCase();
  const dataDir = str(args, 'data-dir', './data');
  const path = cachePath(dataDir, symbol, iv);
  const cached = readCandlesIfPresent(path);
  if (cached && cached.length > 0 && !args.bools.has('refresh')) {
    return { candles: sliceByTime(cleanSeries(cached), from, to), label: `${path} (cached)` };
  }

  const startTime = from ?? Date.UTC(2019, 0, 1);
  process.stderr.write(`Downloading ${symbol} ${iv} from ${formatDate(startTime)}...\n`);
  const fetched = await fetchCandles({
    symbol,
    interval: iv,
    startTime,
    endTime: to,
    onProgress: (count) => process.stderr.write(`\r  ${count} candles`),
  });
  process.stderr.write('\n');
  const cleaned = cleanSeries(fetched);
  writeCandles(path, cleaned);
  return { candles: sliceByTime(cleaned, from, to), label: `${path} (downloaded)` };
}

function portfolioLimitsFrom(args: Args): PortfolioLimits {
  return {
    ...limitsFrom(args),
    maxWeightPerSymbol: num(args, 'max-per-symbol', DEFAULT_PORTFOLIO_LIMITS.maxWeightPerSymbol),
    maxGrossExposure: num(args, 'max-gross', DEFAULT_PORTFOLIO_LIMITS.maxGrossExposure),
  };
}

/**
 * Load several symbols for a portfolio command.
 *
 * `--universe` names them explicitly; `--synthetic crypto` generates a
 * correlated basket instead, which is how the portfolio machinery can be
 * exercised with no network at all.
 */
async function loadUniverse(
  args: Args,
): Promise<{ universe: Map<string, Candle[]>; label: string }> {
  const iv = interval(args);

  const synthetic = args.flags.get('synthetic');
  if (synthetic) {
    if (synthetic !== 'crypto') {
      throw new Error(
        `Portfolio commands take --synthetic crypto (a correlated basket), not "${synthetic}"`,
      );
    }
    const count = num(args, 'symbols', 8);
    const names = Array.from({ length: count }, (_, i) => `SYN${String(i + 1).padStart(2, '0')}`);
    const persistence = num(args, 'momentum', 0);
    const universe = cryptoLikeUniverse(
      names,
      num(args, 'bars', 1500),
      iv,
      num(args, 'seed', 42),
      persistence,
    );
    return {
      universe,
      label:
        `synthetic:crypto, ${count} symbols, momentum persistence ${persistence} ` +
        `(0 means there is nothing for a momentum strategy to find)`,
    };
  }

  const raw = args.flags.get('universe');
  if (!raw) {
    throw new Error(
      'Portfolio commands need --universe BTCUSDT,ETHUSDT,... or --synthetic crypto',
    );
  }
  const symbols = raw
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter((s) => s !== '');
  if (symbols.length < 2) throw new Error('A universe needs at least 2 symbols');

  const from = parseDate(args.flags.get('from'));
  const to = parseDate(args.flags.get('to'));
  const dataDir = str(args, 'data-dir', './data');
  const universe = new Map<string, Candle[]>();

  for (const symbol of symbols) {
    const path = cachePath(dataDir, symbol, iv);
    const cached = readCandlesIfPresent(path);
    if (cached && cached.length > 0 && !args.bools.has('refresh')) {
      universe.set(symbol, sliceByTime(cleanSeries(cached), from, to));
      continue;
    }
    const startTime = from ?? Date.UTC(2019, 0, 1);
    process.stderr.write(`Downloading ${symbol} ${iv}...\n`);
    const fetched = cleanSeries(
      await fetchCandles({ symbol, interval: iv, startTime, endTime: to }),
    );
    writeCandles(path, fetched);
    universe.set(symbol, sliceByTime(fetched, from, to));
  }

  return { universe, label: `${symbols.length} symbols from ${resolveDir(dataDir)}` };
}

function resolveDir(dir: string): string {
  return dir.endsWith('/') ? dir : `${dir}/`;
}

async function cmdData(args: Args): Promise<void> {
  const iv = interval(args);
  const { candles, label } = await loadCandles(args);
  const audit = auditSeries(candles, iv);

  console.log(heading(`Data: ${label}`));
  console.log(`  candles          ${audit.count}`);
  console.log(
    `  range            ${audit.firstTime ? formatDate(audit.firstTime) : '-'} to ` +
      `${audit.lastTime ? formatDate(audit.lastTime) : '-'}`,
  );
  console.log(`  missing bars     ${audit.missingBars}`);
  console.log(`  duplicates       ${audit.duplicates}`);
  console.log(`  out of order     ${audit.outOfOrder}`);
  console.log(`  invalid ranges   ${audit.invalidRanges}`);

  if (audit.missingBars > 0) {
    console.log('');
    console.log(
      `  ${wrap(
        `${audit.missingBars} bars are missing from the middle of this series. Exchange ` +
          `outages cluster around violent moves, so the bars a backtest is missing are ` +
          `rarely the calm ones. Treat results on this series with that in mind.`,
        70,
      )}`,
    );
  }
}

async function cmdBacktest(args: Args): Promise<void> {
  const iv = interval(args);
  const { candles, label } = await loadCandles(args);
  const cash = num(args, 'cash', 1000);
  const costs = costsFrom(args);
  const limits = limitsFrom(args);

  const names = args.bools.has('all')
    ? strategyNames()
    : [str(args, 'strategy', 'ema-cross'), 'buy-and-hold'];
  const gridIndex = num(args, 'grid', 0);

  const results: BacktestResult[] = [];
  for (const name of names) {
    const strategy = buildStrategy(name, name === 'buy-and-hold' ? 0 : gridIndex);
    results.push(
      runBacktest({
        candles,
        strategy,
        interval: iv,
        startingCash: cash,
        costs,
        limits,
        stops: stopsFrom(args),
        sizing: sizingFrom(args),
      }),
    );
  }

  console.log(heading('Source'));
  console.log(`  ${label}`);
  console.log(
    `  costs: ${describeCommission(costs.commission)}, ${costs.slippageBps} bps ` +
      `slippage, ${costs.borrowBpsPerDay} bps/day borrow`,
  );

  const primary = results[0] as BacktestResult;
  console.log(renderBacktest(primary));
  if (results.length > 1) console.log(renderComparison(results));

  const out = args.flags.get('out');
  if (out) {
    const lines = ['time,equity,benchmark,weight,price'];
    for (const p of primary.curve) {
      lines.push(`${p.time},${p.equity},${p.benchmark},${p.weight},${p.price}`);
    }
    writeFileSync(out, `${lines.join('\n')}\n`, 'utf8');
    console.log(`\n  Equity curve written to ${out}`);
  }
}

async function cmdWalkForward(args: Args): Promise<void> {
  const iv = interval(args);
  const { candles, label } = await loadCandles(args);
  const name = str(args, 'strategy', 'ema-cross');
  const factory = factoryByName(name);
  if (!factory) {
    throw new Error(
      `--strategy must name a strategy with a parameter grid: ` +
        `${strategyNames().filter((n) => n !== 'buy-and-hold').join(', ')}`,
    );
  }

  const result = runWalkForward({
    candles,
    factory,
    interval: iv,
    startingCash: num(args, 'cash', 1000),
    folds: num(args, 'folds', 5),
    trainFraction: num(args, 'train-fraction', 0.7),
    embargoBars: args.flags.has('embargo') ? num(args, 'embargo', 0) : undefined,
    costs: costsFrom(args),
    limits: limitsFrom(args),
  });

  console.log(heading('Source'));
  console.log(`  ${label}`);
  console.log(renderWalkForward(result));
}

async function cmdNoise(args: Args): Promise<void> {
  const iv = interval(args);

  if (args.bools.has('portfolio')) {
    const name = str(args, 'strategy', 'xs-momentum');
    const limits = portfolioLimitsFrom(args);
    const costs = costsFrom(args);
    const cash = num(args, 'cash', 1000);
    const noise = runPortfolioNoiseTest({
      makeStrategy: () => buildPortfolioStrategy(name, num(args, 'grid', 0)),
      interval: iv,
      symbolCount: num(args, 'symbols', 10),
      bars: num(args, 'bars', 1000),
      runs: num(args, 'runs', 25),
      startingCash: cash,
      seed: num(args, 'seed', 1),
      costs,
      limits,
    });

    let realExcess: number | null = null;
    if (args.flags.has('universe')) {
      const { universe } = await loadUniverse(args);
      realExcess = runPortfolioBacktest({
        universe,
        strategy: buildPortfolioStrategy(name, num(args, 'grid', 0)),
        interval: iv,
        startingCash: cash,
        costs,
        limits,
      }).metrics.excessReturn;
    }

    console.log(renderPortfolioNoise(noise, realExcess));
    return;
  }

  const name = str(args, 'strategy', 'ema-cross');
  const gridIndex = num(args, 'grid', 0);
  const cash = num(args, 'cash', 1000);
  const costs = costsFrom(args);
  const limits = limitsFrom(args);

  const noise = runNoiseTest({
    makeStrategy: () => buildStrategy(name, gridIndex),
    interval: iv,
    bars: num(args, 'bars', 1000),
    runs: num(args, 'runs', 200),
    startingCash: cash,
    seed: num(args, 'seed', 1),
    costs,
    limits,
  });

  let realSharpe: number | null = null;
  if (args.flags.has('csv') || args.flags.has('symbol')) {
    const { candles } = await loadCandles(args);
    const real = runBacktest({
      candles,
      strategy: buildStrategy(name, gridIndex),
      interval: iv,
      startingCash: cash,
      costs,
      limits,
    });
    realSharpe = real.metrics.sharpe;
  }

  console.log(renderNoise(noise, realSharpe));
}

async function cmdPortfolio(args: Args): Promise<void> {
  const iv = interval(args);
  const { universe, label } = await loadUniverse(args);
  const cash = num(args, 'cash', 1000);
  const costs = costsFrom(args);
  const limits = portfolioLimitsFrom(args);
  const name = str(args, 'strategy', 'xs-momentum');

  console.log(heading('Source'));
  console.log(`  ${label}`);
  console.log(
    `  costs: ${describeCommission(costs.commission)}, ${costs.slippageBps} bps ` +
      `slippage; caps: ${limits.maxWeightPerSymbol} per symbol, ` +
      `${limits.maxGrossExposure} gross`,
  );

  if (args.bools.has('validate')) {
    const factory = portfolioFactoryByName(name);
    if (!factory) {
      throw new Error(
        `--validate needs a strategy with a parameter grid: ` +
          `${portfolioStrategyNames().filter((n) => n !== 'equal-weight-hold').join(', ')}`,
      );
    }
    console.log(
      renderPortfolioWalkForward(
        runPortfolioWalkForward({
          universe,
          factory,
          interval: iv,
          startingCash: cash,
          folds: num(args, 'folds', 5),
          trainFraction: num(args, 'train-fraction', 0.7),
          embargoBars: args.flags.has('embargo') ? num(args, 'embargo', 0) : undefined,
          costs,
          limits,
        }),
      ),
    );
    return;
  }

  const result = runPortfolioBacktest({
    universe,
    strategy: buildPortfolioStrategy(name, num(args, 'grid', 0)),
    interval: iv,
    startingCash: cash,
    costs,
    limits,
  });
  console.log(renderPortfolio(result));

  const out = args.flags.get('out');
  if (out) {
    const lines = ['time,equity,benchmark,grossWeight'];
    for (const p of result.curve) lines.push(`${p.time},${p.equity},${p.benchmark},${p.weight}`);
    writeFileSync(out, `${lines.join('\n')}\n`, 'utf8');
    console.log(`\n  Equity curve written to ${out}`);
  }
}

async function cmdCorrelation(args: Args): Promise<void> {
  const iv = interval(args);
  const { universe, label } = await loadUniverse(args);
  const aligned = alignUniverse(universe, iv);
  console.log(heading('Source'));
  console.log(`  ${label}`);
  if (aligned.droppedBars > 0) {
    console.log(`  ${aligned.droppedBars} timestamps dropped for missing bars`);
  }
  console.log(renderCorrelation(analyseCorrelation(aligned.series)));
}

async function cmdSignificance(args: Args): Promise<void> {
  const iv = interval(args);
  const { candles, label } = await loadCandles(args);
  const name = str(args, 'strategy', 'ema-cross');
  const factory = factoryByName(name);
  if (!factory) {
    throw new Error(
      `--strategy must name a strategy with a parameter grid: ` +
        `${strategyNames().filter((n) => n !== 'buy-and-hold').join(', ')}`,
    );
  }

  console.log(heading('Source'));
  console.log(`  ${label}`);
  console.log(
    renderSignificance(
      assessSignificance({
        candles,
        factory,
        interval: iv,
        startingCash: num(args, 'cash', 1000),
        costs: costsFrom(args),
        limits: limitsFrom(args),
      }),
      iv,
    ),
  );
}

async function cmdPaper(args: Args): Promise<void> {
  const name = str(args, 'strategy', 'ema-cross');
  const strategy = buildStrategy(name, num(args, 'grid', 0));
  const webhook = args.flags.get('webhook');
  await runPaper({
    symbol: str(args, 'symbol', 'BTCUSDT').toUpperCase(),
    interval: interval(args),
    strategy,
    startingCash: num(args, 'cash', 1000),
    warmupBars: num(args, 'warmup', Math.max(250, strategy.warmupBars * 3)),
    costs: costsFrom(args),
    limits: limitsFrom(args),
    maxBars: args.flags.has('max-bars') ? num(args, 'max-bars', 0) : undefined,
    journalPath: args.flags.get('journal'),
    stops: stopsFrom(args),
    sizing: sizingFrom(args),
    statePath: args.flags.get('state'),
    resume: args.bools.has('resume'),
    notifier: webhook
      ? webhookNotifier(webhook, (line) => {
          console.log(line);
        })
      : silentNotifier,
  });
}

/** A client pointed at whatever gateway the flags name. */
function ibkrClientFrom(args: Args): IbkrClient {
  return new IbkrClient({
    baseUrl: str(args, 'gateway', 'https://localhost:5000/v1/api'),
    log: (line) => {
      console.log(line);
    },
  });
}

async function cmdIbkr(args: Args): Promise<void> {
  const sub = str(args, 'sub', '') || (args.rest[0] ?? 'status');
  const client = ibkrClientFrom(args);

  switch (sub) {
    case 'status': {
      console.log(heading(`IBKR gateway at ${client.baseUrl}`));
      const status = await client.authStatus();
      console.log(`  authenticated   ${status.authenticated}`);
      console.log(`  connected       ${status.connected}`);
      console.log(`  competing       ${status.competing}`);
      if (status.message !== '') console.log(`  message         ${status.message}`);

      if (status.competing) {
        console.log('');
        console.log(
          `  ${wrap(
            'Another session has taken this login over — Client Portal or TWS open ' +
              'somewhere else. Requests will keep succeeding while orders quietly do ' +
              'not reach the exchange. Log out there before trading here.',
            70,
          )}`,
        );
      }
      if (!status.authenticated) {
        console.log('');
        console.log(
          `  ${wrap(
            `Not logged in. Open ${new URL(client.baseUrl).origin} in a browser and ` +
              `sign in, then run this again. docs/IBKR.md has the setup.`,
            70,
          )}`,
        );
        return;
      }

      const accounts = await client.accounts();
      console.log('');
      console.log('  accounts:');
      for (const id of accounts) {
        const kind = isPaperAccount(id) ? 'paper' : 'REAL MONEY';
        console.log(`    ${id.padEnd(14)}${kind}`);
      }
      for (const id of accounts) {
        const ledger = await client.ledger(id);
        for (const entry of ledger) {
          console.log(
            `    ${id} ${entry.currency.padEnd(5)} cash ${entry.cash.toFixed(2)}  ` +
              `net liquidation ${entry.netLiquidation.toFixed(2)}`,
          );
        }
      }
      return;
    }

    case 'search': {
      const symbol = str(args, 'symbol', '');
      if (symbol === '') throw new Error('ibkr search needs --symbol AAPL');
      const matches = await client.searchContracts(symbol);
      console.log(heading(`Contracts matching ${symbol.toUpperCase()}`));
      if (matches.length === 0) {
        console.log('  nothing matched');
        return;
      }
      console.log(
        `  ${'conid'.padEnd(12)}${'symbol'.padEnd(10)}${'type'.padEnd(8)}${'ccy'.padEnd(5)}description`,
      );
      for (const match of matches.slice(0, 25)) {
        console.log(
          `  ${String(match.conid).padEnd(12)}${match.symbol.padEnd(10)}` +
            `${match.secType.padEnd(8)}${match.currency.padEnd(5)}` +
            `${match.description.slice(0, 40)}`,
        );
      }
      console.log('');
      console.log(
        `  ${wrap(
          'Use the conid, not the ticker, everywhere else. One symbol is several ' +
            'contracts on several venues in several currencies, and guessing which ' +
            'one is meant is how an order lands on the wrong exchange.',
          70,
        )}`,
      );
      return;
    }

    case 'bars': {
      const conid = num(args, 'conid', 0);
      if (conid <= 0) throw new Error('ibkr bars needs --conid, from "ibkr search"');
      const iv = interval(args);
      const bars = num(args, 'bars', 300);
      const source = ibkrDataSource({ client, outsideRth: args.bools.has('outside-rth') });
      const candles = await source.recent(String(conid), iv, bars);
      const audit = auditSeries(candles, iv);

      console.log(heading(`IBKR bars for conid ${conid}, ${iv}`));
      console.log(`  candles          ${audit.count}`);
      console.log(
        `  range            ${audit.firstTime ? formatDate(audit.firstTime) : '-'} to ` +
          `${audit.lastTime ? formatDate(audit.lastTime) : '-'}`,
      );
      console.log(`  invalid ranges   ${audit.invalidRanges}`);
      console.log('');
      console.log(
        `  ${wrap(
          'The missing-bar count is not reported here on purpose: these are regular ' +
            'trading hours only, so most timestamps in the range legitimately have no ' +
            'bar. That is also why a strategy written on 24/7 crypto bars is a ' +
            'different strategy on this data — it now has overnight gaps it never saw.',
          70,
        )}`,
      );

      const out = args.flags.get('out');
      if (out) {
        writeCandles(out, candles);
        console.log(`\n  Written to ${out}. Backtest it with --csv ${out}.`);
      }
      return;
    }

    default:
      throw new Error(`Unknown ibkr subcommand "${sub}". Try status, search or bars.`);
  }
}

async function cmdKraken(args: Args): Promise<void> {
  const sub = args.rest[0] ?? 'pairs';

  switch (sub) {
    case 'status': {
      console.log(heading('Kraken'));
      const credentials = credentialsFromEnv();
      if (!credentials) {
        console.log('  credentials     not set (KRAKEN_API_KEY / KRAKEN_API_SECRET)');
        console.log('');
        console.log(
          `  ${wrap(
            'Public data works without credentials, so `kraken pairs` and `kraken bars` ' +
              'are available either way. Only trading needs a key, and that key should ' +
              'have withdrawals switched off.',
            70,
          )}`,
        );
        return;
      }
      const client = new KrakenClient({ credentials });
      const balances = await client.balances();
      const trade = await client.tradeBalance();
      console.log('  credentials     set');
      console.log(`  account equity  ${trade.equity.toFixed(2)} (Kraken's own figure)`);
      console.log('');
      console.log('  balances:');
      for (const [asset, amount] of Object.entries(balances)) {
        if (amount !== 0) console.log(`    ${asset.padEnd(10)}${amount}`);
      }
      const open = await client.openOrders();
      const count = Object.keys(open).length;
      console.log('');
      console.log(`  open orders     ${count}`);
      if (count > 0) {
        console.log(
          `  ${wrap(
            'Open orders the bot did not place will confuse its idea of the position, ' +
              'because it reads the balance rather than tracking its own fills. Clear ' +
              'them, or trade from a dedicated account.',
            70,
          )}`,
        );
      }
      return;
    }

    case 'pairs': {
      const name = str(args, 'pair', 'XBTEUR');
      const pair = await fetchPair(name);
      console.log(heading(`Kraken pair ${pair.altname}`));
      console.log(`  canonical name  ${pair.name}`);
      console.log(`  base / quote    ${pair.base} / ${pair.quote}`);
      console.log(`  minimum order   ${pair.orderMin} ${pair.base}`);
      console.log(`  volume decimals ${pair.volumeDecimals}`);
      console.log(`  price decimals  ${pair.priceDecimals}`);
      console.log('');
      console.log(
        `  ${wrap(
          'Use the short name for orders and for --pair. An order with one decimal ' +
            'too many, or below the minimum, is rejected outright — and a bot that ' +
            'discovers that when it wants to exit has a position it cannot close.',
          70,
        )}`,
      );
      return;
    }

    case 'bars': {
      const name = str(args, 'pair', 'XBTEUR');
      const iv = interval(args);
      const bars = Math.min(MAX_OHLC_BARS, num(args, 'bars', MAX_OHLC_BARS));
      const candles = await krakenDataSource().recent(name, iv, bars);
      const audit = auditSeries(candles, iv);

      console.log(heading(`Kraken bars for ${name}, ${iv}`));
      console.log(`  candles          ${audit.count}`);
      console.log(
        `  range            ${audit.firstTime ? formatDate(audit.firstTime) : '-'} to ` +
          `${audit.lastTime ? formatDate(audit.lastTime) : '-'}`,
      );
      console.log(`  missing bars     ${audit.missingBars}`);
      console.log(`  invalid ranges   ${audit.invalidRanges}`);
      console.log('');
      console.log(
        `  ${wrap(
          `Kraken returns at most ${MAX_OHLC_BARS} bars from this endpoint, whatever ` +
            `you ask for. That is under two years of daily history and twelve hours of ` +
            `minute history — not enough to walk-forward anything. For a real backtest, ` +
            `download Kraken's historical OHLCVT archive and use --csv.`,
          70,
        )}`,
      );

      const out = args.flags.get('out');
      if (out) {
        writeCandles(out, candles);
        console.log(`\n  Written to ${out}. Backtest it with --csv ${out} --commission kraken.`);
      }
      return;
    }

    default:
      throw new Error(`Unknown kraken subcommand "${sub}". Try status, pairs or bars.`);
  }
}

/**
 * Run a strategy against a real IBKR account.
 *
 * Dry run unless `--send` is passed, and a non-paper account needs
 * `--i-accept-real-money` on top of that. Both gates exist because everything
 * upstream of this command is about finding out whether a strategy is worth money,
 * and the honest answer is usually no.
 */
async function cmdTrade(args: Args): Promise<void> {
  const broker = str(args, 'broker', 'ibkr');
  switch (broker) {
    case 'ibkr':
      await cmdTradeIbkr(args);
      return;
    case 'kraken':
      await cmdTradeKraken(args);
      return;
    default:
      throw new Error(`--broker must be ibkr or kraken (got "${broker}")`);
  }
}

/**
 * Run a strategy against a Kraken spot account.
 *
 * The gates differ from IBKR's on purpose, because the venues differ. IBKR has a
 * paper account, so a full rehearsal with fake money is possible and `--send`
 * against a DU account is harmless. Kraken has no paper account for spot: an order
 * that is sent is real. So without `--send` every order goes to Kraken's own
 * `validate` endpoint — the exchange checks the decimals, the minimum, the pair and
 * the key's permissions, and executes nothing — and `--send` additionally requires
 * `--i-accept-real-money`.
 */
async function cmdTradeKraken(args: Args): Promise<void> {
  const pairName = str(args, 'pair', '');
  if (pairName === '') throw new Error('trade --broker kraken needs --pair, e.g. --pair XBTEUR');

  const credentials = credentialsFromEnv();
  if (!credentials) {
    throw new Error(
      'Set KRAKEN_API_KEY and KRAKEN_API_SECRET in the environment. Create the key ' +
        'with "Withdraw Funds" switched OFF — a key that can only trade turns a ' +
        'compromise into an annoyance. See docs/KRAKEN.md.',
    );
  }

  const client = new KrakenClient({ credentials });
  const pair = await fetchPair(pairName);
  const strategy = buildStrategy(str(args, 'strategy', 'ema-cross'), num(args, 'grid', 0));
  const send = args.bools.has('send');

  const execution = new KrakenExecution({
    client,
    pair,
    send,
    allowRealMoney: args.bools.has('i-accept-real-money'),
    maxOrderValue: num(args, 'max-order-value', 50),
    log: (line) => {
      console.log(line);
    },
  });

  console.log(heading('Live run'));
  console.log(`  strategy        ${strategy.name}`);
  console.log(`  pair            ${pair.altname} (${pair.name})`);
  console.log(`  minimum order   ${pair.orderMin} ${pair.base}`);
  console.log(`  execution       ${execution.label}`);
  console.log(`  max order value ${num(args, 'max-order-value', 50)} ${pair.quote}`);
  if (!send) {
    console.log('');
    console.log(
      `  ${wrap(
        'Every order will be handed to Kraken for validation and executed by ' +
          'nobody. Read what comes back before adding --send, and remember that ' +
          'Kraken has no paper account: --send is real money.',
        70,
      )}`,
    );
  }

  await runLive({
    instrument: pair.altname,
    interval: interval(args),
    strategy,
    data: krakenDataSource(),
    execution,
    startingCash: num(args, 'cash', 0),
    warmupBars: Math.min(
      MAX_OHLC_BARS,
      num(args, 'warmup', Math.max(250, strategy.warmupBars * 3)),
    ),
    limits: limitsFrom(args),
    stops: stopsFrom(args),
    sizing: sizingFrom(args),
    maxBars: args.flags.has('max-bars') ? num(args, 'max-bars', 0) : undefined,
    journalPath: args.flags.get('journal'),
  });
}

async function cmdTradeIbkr(args: Args): Promise<void> {
  const conid = num(args, 'conid', 0);
  if (conid <= 0) throw new Error('trade needs --conid, from "ibkr search"');
  const account = str(args, 'account', '');
  if (account === '') throw new Error('trade needs --account (a DU... paper account to start with)');

  const client = ibkrClientFrom(args);
  const strategy = buildStrategy(str(args, 'strategy', 'ema-cross'), num(args, 'grid', 0));
  const send = args.bools.has('send');

  // The adapter validates the account and the caps without touching the network,
  // so a typo in an account number is caught before anyone starts a gateway.
  const execution = new IbkrExecution({
    client,
    accountId: account,
    conid,
    allowRealMoney: args.bools.has('i-accept-real-money'),
    maxOrderValue: num(args, 'max-order-value', 1000),
    minOrderValue: num(args, 'min-order', 0),
    wholeUnitsOnly: !args.bools.has('fractional'),
    dryRun: !send,
    log: (line) => {
      console.log(line);
    },
  });

  const status = await client.authStatus();
  if (!status.authenticated) {
    throw new Error(
      `The gateway at ${client.baseUrl} is not logged in. Sign in at ` +
        `${new URL(client.baseUrl).origin} first.`,
    );
  }
  if (status.competing) {
    throw new Error(
      'Another session holds this login, so orders placed here would not reach the ' +
        'exchange. Log out of Client Portal or TWS elsewhere, then retry.',
    );
  }

  console.log(heading('Live run'));
  console.log(`  strategy        ${strategy.name}`);
  console.log(`  contract        ${conid}`);
  console.log(`  account         ${account} (${isPaperAccount(account) ? 'paper' : 'REAL MONEY'})`);
  console.log(`  execution       ${execution.label}`);
  console.log(`  max order value ${num(args, 'max-order-value', 1000)}`);
  if (!send) {
    console.log('');
    console.log(
      `  ${wrap(
        'Dry run: every order is logged and nothing is sent. Add --send once you ' +
          'have read the log and agree with what it was about to do.',
        70,
      )}`,
    );
  }

  await runLive({
    instrument: String(conid),
    interval: interval(args),
    strategy,
    data: ibkrDataSource({ client, outsideRth: args.bools.has('outside-rth') }),
    execution,
    startingCash: num(args, 'cash', 0),
    warmupBars: num(args, 'warmup', Math.max(250, strategy.warmupBars * 3)),
    limits: limitsFrom(args),
    stops: stopsFrom(args),
    sizing: sizingFrom(args),
    maxBars: args.flags.has('max-bars') ? num(args, 'max-bars', 0) : undefined,
    journalPath: args.flags.get('journal'),
  });
}

/**
 * Measure a return target rather than a strategy.
 *
 * Put here, as a first-class command, because it is the cheapest thing in the
 * repository to run and the most likely to change what someone does next.
 */
async function cmdTarget(args: Args): Promise<void> {
  // Deliberately not --from / --to: those already mean the start and end of a data
  // window on every other command, and reusing them here had the loader parsing a
  // euro amount as a date.
  const goal = {
    startingCapital: num(args, 'capital', 10_000),
    targetCapital: num(args, 'goal', 100_000),
    horizonYears: num(args, 'years', 1),
  };
  const volatility = num(args, 'vol', 0.3);

  // When bars are available, the abstract leverage figure gets measured against the
  // market it would actually be used in.
  let exposure;
  if (args.flags.has('csv') || args.flags.has('symbol') || args.flags.has('synthetic')) {
    const { candles, label } = await loadCandles(args);
    const odds = assessGoal(goal, {
      sharpe: minimumSharpeFor(goal),
      volatility,
      kellyFraction: 1,
    });
    exposure = {
      label,
      exposure: liquidationExposure({
        candles,
        interval: interval(args),
        leverage: odds.leverage,
      }),
    };
  }

  console.log(
    renderGoal(goal, {
      volatility,
      monthlyContribution: args.flags.has('monthly') ? num(args, 'monthly', 0) : undefined,
      exposure,
    }),
  );
}

function usage(): void {
  console.log(`
Trading research harness — backtest first, paper second, and that is where it stops.

  npm run bot -- <command> [flags]

Commands
  target        Measure a return goal: the rate it needs, the Sharpe ratio that
                implies, and the odds and drawdowns of chasing it
  data          Download or inspect candles, and audit them for gaps
  backtest      Run a strategy over history, against buy-and-hold
  significance  Search a strategy's grid, then deflate the winner's Sharpe for
                the fact that it was chosen. Report this, not the raw Sharpe.
  noise         Run the strategy on random walks to see what luck alone produces
                (--portfolio for the multi-asset version: many edgeless universes)
  walkforward   Choose parameters in-sample, measure out-of-sample. Trust this one.
  correlation   How many independent bets a universe is really worth
  portfolio     Multi-asset backtest across a universe (--validate for walk-forward)
  paper         Forward-test on live prices with simulated money
  ibkr          Talk to a local IBKR gateway: status, search, bars
  kraken        Kraken spot: status, pairs, bars. Public data needs no key.
  trade         Run a strategy against a broker. --broker ibkr | kraken.
                Never sends an order without --send.

Data (single-symbol commands)
  --symbol BTCUSDT      Binance symbol, downloaded and cached on first use
  --interval 1d         1m, 5m, 15m, 1h, 4h, 1d
  --from 2021-01-01     Start of the window
  --to 2024-01-01       End of the window
  --csv path.csv        Use a CSV instead of the network
  --synthetic trend     Generated data: random, trend, revert
  --bars 1500           How many synthetic bars
  --seed 42             Synthetic seed
  --data-dir ./data     Where the cache lives
  --refresh             Re-download even if cached

Data (portfolio and correlation)
  --universe BTCUSDT,ETHUSDT,SOLUSDT
  --synthetic crypto    A generated correlated basket instead of real symbols
  --symbols 8           How many synthetic symbols
  --momentum 0.3        Relative-strength persistence in the synthetic universe.
                        0 means there is no momentum in it to find.

Strategy
  --strategy name       single: ${strategyNames().join(', ')}
                        portfolio: ${portfolioStrategyNames().join(', ')}
  --grid 0              Which parameter set from the strategy's grid
  --all                 Backtest every single-asset strategy and compare

Money and costs
  --cash 1000           Starting equity, in quote currency
  --commission bps      bps | kraken | ibkr-tiered | ibkr-fixed | per-unit |
                        per-order.
                        A broker charges a floor per order, not a percentage, and
                        on small orders the floor is all you pay. Use the shape
                        that matches your statement.
  --fee-bps 10          Rate for --commission bps
  --volume-30d 0        Your 30-day volume, which sets the Kraken tier
  --role taker          taker | maker for --commission kraken. Taker is the
                        honest default: every order here is a market order.
  --per-unit 0.0035     Rate per share/contract for --commission per-unit
  --min-commission 0.35 Floor per order for --commission per-unit
  --max-commission-pct 0.01
  --per-order 1         Flat amount for --commission per-order
  --slippage-bps 5      Spread cost per fill, basis points — what a small order
                        pays. Size costs extra; see --impact.
  --impact              Charge market impact on top of the spread: your own order
                        moves the price, roughly with the square root of your
                        share of the bar's volume. Makes the result
                        size-dependent, which is the truth.
  --impact-k 1          Impact coefficient. Calibrate against your own fills.
  --max-impact-bps 500  Ceiling, so one thin bar cannot dominate a run
  --borrow-bps 5        Daily cost of a short, basis points

Protective exits (omit them and only the strategy ever closes a position)
  --stop-loss 0.05      Exit 5% against the entry. Fills at the worse of the
                        stop and the bar's open, so gaps cost what they cost.
  --trailing-stop 0.08  Exit 8% below the best price since entry
  --take-profit 0.15    Exit 15% in your favour
  --cooldown 5          Bars to stay flat after a stop. Without it a trend
                        strategy buys straight back in and the stop only
                        bought you two commissions.

Position sizing
  --target-vol 0.2      Scale the weight so realised volatility lands near 20%
                        a year. Only ever scales down past --max-weight.
  --vol-lookback 30     Bars used to estimate current volatility

Risk
  --max-weight 1        1 means no leverage. Raising this is how accounts die.
  --max-daily-loss 0.1  Stop trading for the day after this loss
  --max-drawdown 0.35   Kill switch, measured from the equity high
  --rebalance-threshold 0.05
  --min-order 10        Exchange minimum order, in quote currency
  --max-per-symbol 0.34 Portfolio: largest weight in any one symbol
  --max-gross 1         Portfolio: largest total exposure

Walk-forward
  --folds 5             Train/test pairs
  --train-fraction 0.7  Share of each fold used to choose parameters
  --embargo N           Bars dropped between each train and test window, so the
                        two do not overlap through the strategy's own lookback.
                        Defaults to the longest warm-up in the grid.
  --validate            On \`portfolio\`, run the walk-forward instead of a backtest

Kraken (public data needs no key; trading reads KRAKEN_API_KEY and
        KRAKEN_API_SECRET from the environment, never from a flag)
  --pair XBTEUR         Kraken's short pair name
  --send                Actually place orders. Without it, Kraken validates the
                        order server-side and executes nothing.
  --i-accept-real-money Required alongside --send: Kraken has no paper account
                        for spot, so there is no harmless version of sending.
  --max-order-value 50  Hard cap per order, in quote currency

IBKR (everything runs against a gateway on your own machine — no API keys)
  --gateway https://localhost:5000/v1/api
  --symbol AAPL         For: ibkr search
  --conid 265598        For: ibkr bars, trade. Get it from ibkr search.
  --account DU1234567   For: trade. Paper accounts start with DU.
  --outside-rth         Include pre- and post-market bars. Off by default.
  --send                Actually place orders. Without it, trade is a dry run.
  --i-accept-real-money Required on top of --send for a non-DU account.
  --max-order-value 1000
                        Hard cap per order, enforced in the execution layer
  --fractional          Allow fractional units. Off: whole units, rounded toward
                        zero so rounding can never increase exposure.

Goal (for: target)
  --capital 10000       Starting capital
  --goal 100000         Target capital
  --years 1             Horizon
  --vol 0.3             Assumed strategy volatility, annualised
  --monthly 500         Also show what adding this much a month does
                        Pass --csv / --symbol / --synthetic as well and the
                        leverage is measured against those actual bars.

Output and 24/7 operation
  --out curve.csv       Write the equity curve
  --journal log.jsonl   Paper trading: append every decision
  --state run.json      Paper trading: persist the account after every bar
  --resume              Paper trading: continue the run in --state
  --webhook https://... Paper trading: POST fills and kill-switch events

${rule()}
This harness does not place real orders and contains no exchange credentials.
Read docs/TRADING.md before you put money anywhere near it.
`);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  switch (args.command) {
    case 'data':
      await cmdData(args);
      break;
    case 'backtest':
      await cmdBacktest(args);
      break;
    case 'walkforward':
      await cmdWalkForward(args);
      break;
    case 'noise':
      await cmdNoise(args);
      break;
    case 'paper':
      await cmdPaper(args);
      break;
    case 'portfolio':
      await cmdPortfolio(args);
      break;
    case 'correlation':
      await cmdCorrelation(args);
      break;
    case 'significance':
      await cmdSignificance(args);
      break;
    case 'target':
      await cmdTarget(args);
      break;
    case 'ibkr':
      await cmdIbkr(args);
      break;
    case 'kraken':
      await cmdKraken(args);
      break;
    case 'trade':
      await cmdTrade(args);
      break;
    default:
      usage();
      break;
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`\n${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
