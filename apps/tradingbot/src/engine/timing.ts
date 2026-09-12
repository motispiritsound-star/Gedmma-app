import { makeRng } from '../data/synthetic.js';
import type { RiskLimits } from '../risk/risk.js';
import type { Strategy } from '../strategy/types.js';
import type { Candle, CostModel, Interval } from '../types.js';
import { runBacktest } from './backtest.js';
import { percentile } from './noise.js';

/**
 * Does the timing actually time anything?
 *
 * This is the test a chart-reading system most needs and almost never gets. A
 * long-only strategy that is in the market 60% of the time, in a market that rose,
 * will make money. The question is whether it made money *because* it chose those
 * moments, or merely because it was invested during some of them — and a backtest
 * cannot tell you, because there is nothing to compare against.
 *
 * So the comparison is constructed. Take the strategy's own schedule — how long it
 * held, how long it stayed out, how many times it switched — and shuffle *when*
 * those periods happened, leaving everything else identical. The null keeps:
 *
 *   - exactly the same time in the market,
 *   - exactly the same number of trades, so identical commission and slippage,
 *   - exactly the same distribution of holding periods.
 *
 * The only thing destroyed is which bars the positions landed on, which is to say:
 * the information content of the signal. If the real result does not stand clearly
 * above that distribution, then the indicators contributed nothing, and what looked
 * like an edge was the market's own drift collected during whatever time the
 * strategy happened to be exposed.
 *
 * In practice this is where most technical systems are revealed to be a trend
 * filter and nothing more. That is not a useless thing to be — being out of the
 * market during the worst stretches is worth something — but it is a much smaller
 * claim than "it buys and sells at the right moments", and it is worth knowing
 * which one you have.
 */

export interface TimingTestOptions {
  candles: readonly Candle[];
  strategy: Strategy;
  interval: Interval;
  startingCash: number;
  /** How many shuffled schedules to compare against. */
  runs?: number;
  seed?: number;
  costs?: CostModel;
  limits?: RiskLimits;
}

export interface TimingTestResult {
  /** The strategy's own result. */
  realReturn: number;
  realSharpe: number;
  timeInMarket: number;
  /** Number of in-market stretches the schedule contained. */
  episodes: number;
  runs: number;
  /** Returns from shuffled schedules, ascending. */
  shuffledReturns: number[];
  shuffledSharpes: number[];
  medianShuffledReturn: number;
  p95ShuffledReturn: number;
  bestShuffledReturn: number;
  /** How many shuffles beat the real schedule. */
  beatenBy: number;
  /**
   * Where the real result sits in the null distribution, from 0 to 1. This is a
   * one-sided p-value read backwards: 0.98 means only 2% of random schedules with
   * the same exposure did better.
   */
  percentileOfReal: number;
  verdict: 'the timing adds value' | 'inconclusive' | 'no better than random timing';
}

/** One in-market or out-of-market stretch. */
interface Block {
  inMarket: boolean;
  length: number;
}

/**
 * Run-length encode an in/out schedule.
 *
 * Exported because it is the whole mechanism: everything the null preserves is
 * visible in the block list, and everything it destroys is the order of it.
 */
export function encodeSchedule(inMarket: readonly boolean[]): Block[] {
  const blocks: Block[] = [];
  for (const flag of inMarket) {
    const last = blocks[blocks.length - 1];
    if (last && last.inMarket === flag) last.length += 1;
    else blocks.push({ inMarket: flag, length: 1 });
  }
  return blocks;
}

/**
 * Shuffle when the stretches happen, keeping what they are.
 *
 * The in-market blocks are permuted among themselves and the flat blocks among
 * themselves, and the alternating structure is rebuilt in the original order of
 * kinds. That keeps the total exposure, the trade count and the holding-period
 * distribution exactly, which is what makes the comparison fair rather than a
 * comparison against a different strategy.
 */
export function shuffleSchedule(blocks: readonly Block[], rng: () => number): boolean[] {
  const held = blocks.filter((b) => b.inMarket).map((b) => b.length);
  const flat = blocks.filter((b) => !b.inMarket).map((b) => b.length);
  shuffleInPlace(held, rng);
  shuffleInPlace(flat, rng);

  const out: boolean[] = [];
  let heldAt = 0;
  let flatAt = 0;
  for (const block of blocks) {
    const length = block.inMarket ? (held[heldAt++] as number) : (flat[flatAt++] as number);
    for (let i = 0; i < length; i += 1) out.push(block.inMarket);
  }
  return out;
}

function shuffleInPlace(values: number[], rng: () => number): void {
  for (let i = values.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const a = values[i] as number;
    values[i] = values[j] as number;
    values[j] = a;
  }
}

/**
 * A strategy that follows a fixed schedule by bar index.
 *
 * It reads the index from how much history it has been handed, which is the only
 * thing it is allowed to see — so the scripted null is under exactly the same
 * no-lookahead constraint as a real strategy, and pays fills at the next bar's
 * open like everything else.
 */
export function scriptedStrategy(schedule: readonly boolean[], name = 'scripted'): Strategy {
  return {
    name,
    describe: 'Follows a fixed in/out schedule, for use as a null hypothesis',
    warmupBars: 0,
    onBar: (ctx) => {
      const index = ctx.candles.length - 1;
      return schedule[index] === true ? 1 : 0;
    },
  };
}

export function runTimingTest(options: TimingTestOptions): TimingTestResult {
  const { candles, strategy, interval, startingCash } = options;
  const runs = options.runs ?? 500;
  const rng = makeRng(options.seed ?? 11);

  const real = runBacktest({
    candles,
    strategy,
    interval,
    startingCash,
    costs: options.costs,
    limits: options.limits,
  });

  // The schedule comes from what the strategy actually held, not from what it asked
  // for: the risk layer and the rebalance threshold are part of the system, and the
  // null has to match the system rather than the intention.
  const inMarket = real.curve.map((point) => Math.abs(point.weight) > 1e-9);
  const blocks = encodeSchedule(inMarket);
  const episodes = blocks.filter((b) => b.inMarket).length;

  const shuffledReturns: number[] = [];
  const shuffledSharpes: number[] = [];

  if (episodes >= 2 && blocks.filter((b) => !b.inMarket).length >= 2) {
    for (let run = 0; run < runs; run += 1) {
      const schedule = shuffleSchedule(blocks, rng);
      const result = runBacktest({
        candles,
        strategy: scriptedStrategy(schedule, `scripted-${run}`),
        interval,
        startingCash,
        costs: options.costs,
        limits: options.limits,
      });
      shuffledReturns.push(result.metrics.totalReturn);
      shuffledSharpes.push(result.metrics.sharpe);
    }
  }

  shuffledReturns.sort((a, b) => a - b);
  shuffledSharpes.sort((a, b) => a - b);

  const beatenBy = shuffledReturns.filter((r) => r > real.metrics.totalReturn).length;
  const percentileOfReal =
    shuffledReturns.length === 0 ? 0 : 1 - beatenBy / shuffledReturns.length;

  return {
    realReturn: real.metrics.totalReturn,
    realSharpe: real.metrics.sharpe,
    timeInMarket: real.metrics.timeInMarket,
    episodes,
    runs: shuffledReturns.length,
    shuffledReturns,
    shuffledSharpes,
    medianShuffledReturn: percentile(shuffledReturns, 0.5),
    p95ShuffledReturn: percentile(shuffledReturns, 0.95),
    bestShuffledReturn: shuffledReturns[shuffledReturns.length - 1] ?? 0,
    beatenBy,
    percentileOfReal,
    verdict:
      shuffledReturns.length === 0
        ? 'inconclusive'
        : percentileOfReal >= 0.95
          ? 'the timing adds value'
          : percentileOfReal >= 0.8
            ? 'inconclusive'
            : 'no better than random timing',
  };
}
