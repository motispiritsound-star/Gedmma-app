import { INTERVAL_MS, type Candle, type Interval } from '../types.js';

export interface AlignedUniverse {
  /** The shared timeline, in epoch milliseconds, strictly increasing. */
  times: number[];
  /** One aligned series per symbol, each the same length as `times`. */
  series: Map<string, Candle[]>;
  /** Timestamps dropped because at least one symbol had no bar there. */
  droppedBars: number;
  /** Symbols that start later than the universe does, and when they start. */
  lateListings: { symbol: string; firstTime: number }[];
}

/**
 * Put several symbols on one timeline so a portfolio can be simulated across
 * them.
 *
 * The choice made here is to *drop* any timestamp where some symbol has no bar,
 * rather than forward-fill it. Forward-filling invents a price that was never
 * quoted, and a strategy will happily trade against invented prices — in size,
 * because an asset whose price never moves looks risk-free. Dropping loses
 * bars and says how many.
 *
 * A symbol that listed later than the rest is kept, but only from its own first
 * bar: the universe starts when every symbol has one. This is also where
 * survivorship bias enters, and no code can remove it — see `surviorshipWarning`.
 */
export function alignUniverse(
  raw: ReadonlyMap<string, readonly Candle[]>,
  interval: Interval,
): AlignedUniverse {
  const barMs = INTERVAL_MS[interval];
  const symbols = [...raw.keys()];
  if (symbols.length === 0) {
    return { times: [], series: new Map(), droppedBars: 0, lateListings: [] };
  }

  const byTime = new Map<string, Map<number, Candle>>();
  const lateListings: { symbol: string; firstTime: number }[] = [];
  let start = -Infinity;
  let end = Infinity;

  for (const symbol of symbols) {
    const candles = raw.get(symbol) ?? [];
    const index = new Map<number, Candle>();
    for (const candle of candles) index.set(candle.openTime, candle);
    byTime.set(symbol, index);

    const first = candles[0]?.openTime;
    const last = candles[candles.length - 1]?.openTime;
    if (first === undefined || last === undefined) {
      throw new Error(`${symbol} has no candles, so the universe cannot be aligned`);
    }
    if (first > start) start = first;
    if (last < end) end = last;
  }

  if (!Number.isFinite(start) || !Number.isFinite(end) || start > end) {
    throw new Error('The symbols in this universe do not overlap in time at all');
  }

  // Anything that started after the earliest symbol did is a late listing. The
  // universe can only begin once all of them have a bar, so these symbols are
  // what determines the start date, and they are worth naming: a universe whose
  // start was dragged forward two years by one recent listing is testing a much
  // shorter history than its ticker list suggests.
  const earliestFirst = Math.min(
    ...symbols.map((symbol) => raw.get(symbol)?.[0]?.openTime ?? Infinity),
  );
  for (const symbol of symbols) {
    const first = raw.get(symbol)?.[0]?.openTime ?? Infinity;
    if (first > earliestFirst) lateListings.push({ symbol, firstTime: first });
  }
  lateListings.sort((a, b) => b.firstTime - a.firstTime);

  const times: number[] = [];
  const series = new Map<string, Candle[]>(symbols.map((s) => [s, []]));
  let droppedBars = 0;

  for (let t = start; t <= end; t += barMs) {
    const row = symbols.map((symbol) => byTime.get(symbol)?.get(t));
    if (row.some((candle) => candle === undefined)) {
      droppedBars += 1;
      continue;
    }
    times.push(t);
    for (const [i, symbol] of symbols.entries()) {
      (series.get(symbol) as Candle[]).push(row[i] as Candle);
    }
  }

  return { times, series, droppedBars, lateListings };
}

/**
 * The warning that belongs on every multi-asset crypto backtest, because it
 * cannot be fixed in code.
 *
 * A universe chosen today is a list of coins that survived. The ones that went
 * to zero, got delisted, or turned out to be frauds are not in it, and they are
 * exactly the ones a momentum strategy would have bought on the way up. Any
 * backtest over a hand-picked universe of current majors is therefore measuring
 * a world where catastrophic losers did not exist.
 */
export function survivorshipWarning(symbols: readonly string[]): string {
  return (
    `This universe of ${symbols.length} symbols was chosen with hindsight. Coins that ` +
    `were delisted, collapsed or turned out to be frauds are missing from it, and a ` +
    `momentum strategy would have bought several of them on the way up. The result ` +
    `below is therefore optimistic by an amount no code here can measure. To shrink ` +
    `it, pick the universe by a rule applied at the start of the test window — the ` +
    `top N by volume as of that date — not by what looks reasonable now.`
  );
}
