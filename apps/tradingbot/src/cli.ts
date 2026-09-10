#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
import { fetchCandles } from './data/binance.js';
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
import { runPaper } from './live/paper.js';
import { silentNotifier, webhookNotifier } from './live/notify.js';
import {
  formatDate,
  heading,
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
}

function parseArgs(argv: readonly string[]): Args {
  const flags = new Map<string, string>();
  const bools = new Set<string>();
  const command = argv[0] ?? 'help';

  for (let i = 1; i < argv.length; i += 1) {
    const token = argv[i] as string;
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) {
      bools.add(key);
    } else {
      flags.set(key, next);
      i += 1;
    }
  }

  return { command, flags, bools };
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

function costsFrom(args: Args): CostModel {
  return {
    feeBps: num(args, 'fee-bps', DEFAULT_COSTS.feeBps),
    slippageBps: num(args, 'slippage-bps', DEFAULT_COSTS.slippageBps),
    borrowBpsPerDay: num(args, 'borrow-bps', DEFAULT_COSTS.borrowBpsPerDay),
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
      runBacktest({ candles, strategy, interval: iv, startingCash: cash, costs, limits }),
    );
  }

  console.log(heading('Source'));
  console.log(`  ${label}`);
  console.log(
    `  costs: ${costs.feeBps} bps fee, ${costs.slippageBps} bps slippage, ` +
      `${costs.borrowBpsPerDay} bps/day borrow`,
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
    `  costs: ${costs.feeBps} bps fee, ${costs.slippageBps} bps slippage; ` +
      `caps: ${limits.maxWeightPerSymbol} per symbol, ${limits.maxGrossExposure} gross`,
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
    statePath: args.flags.get('state'),
    resume: args.bools.has('resume'),
    notifier: webhook
      ? webhookNotifier(webhook, (line) => {
          console.log(line);
        })
      : silentNotifier,
  });
}

function usage(): void {
  console.log(`
Trading research harness — backtest first, paper second, and that is where it stops.

  npm run bot -- <command> [flags]

Commands
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
  --fee-bps 10          Commission per fill, basis points
  --slippage-bps 5      Slippage per fill, basis points
  --borrow-bps 5        Daily cost of a short, basis points

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
  --validate            On \`portfolio\`, run the walk-forward instead of a backtest

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
    default:
      usage();
      break;
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`\n${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
