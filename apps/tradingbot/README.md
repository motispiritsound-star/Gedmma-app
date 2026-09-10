# tradingbot

A research harness for automated trading strategies. It downloads market data,
backtests strategies against buy-and-hold, tells you how much of the result was
luck, validates out of sample, and forward-tests on live prices with simulated
money.

**It places no real orders and contains no exchange credentials.** That is a
design decision, not an unfinished feature — [docs/TRADING.md](../../docs/TRADING.md)
explains why, along with the arithmetic on the "$68 into $750,000" posts.

## Quick start

No API key is needed; Binance's market data is public.

```bash
npm install

# Inspect the data before trusting anything built on it.
npm run bot --workspace @buurklus/tradingbot -- data --symbol BTCUSDT --interval 1d

# Backtest every strategy against buy-and-hold.
npm run bot --workspace @buurklus/tradingbot -- backtest --symbol BTCUSDT --interval 1d --all

# Find out what this strategy "earns" on data with no edge in it.
npm run bot --workspace @buurklus/tradingbot -- noise --strategy ema-cross --runs 200

# The number that actually matters: parameters chosen in-sample, measured after.
npm run bot --workspace @buurklus/tradingbot -- walkforward --strategy ema-cross --folds 5

# Forward-test on live prices with simulated money.
npm run bot --workspace @buurklus/tradingbot -- paper --strategy ema-cross --interval 1h
```

From inside `apps/tradingbot` the prefix shortens to `npm run bot -- <command>`.
`npm run bot -- help` lists every flag.

If your network blocks exchange APIs, every command takes `--csv path.csv`
(columns `openTime,open,high,low,close,volume`) or `--synthetic trend|revert|random`
instead, and nothing touches the network.

## Layout

```
src/
  types.ts              Candles, fills, trades, the cost model
  data/
    binance.ts          Public klines, paged and rate-limit aware. Read-only.
    store.ts            CSV cache, plus an audit for gaps and bad bars
    synthetic.ts        Seeded series with known properties, for tests and noise
  indicators/           EMA, SMA, z-score, RSI, ATR — all backward-looking only
  strategy/
    buyAndHold.ts       The benchmark, as a first-class strategy
    emaCross.ts         Trend following
    meanReversion.ts    Dip buying, with hysteresis so it does not churn
    donchian.ts         Breakout
    registry.ts         Names and parameter grids the CLI can reach
  risk/risk.ts          Weight cap, daily stop, drawdown kill switch
  engine/
    broker.ts           Paper fills with fees, slippage and borrow cost
    backtest.ts         The event loop, and the no-lookahead guarantee
    metrics.ts          Sharpe, Sortino, drawdown, turnover, t-statistic
    walkforward.ts      In-sample selection, out-of-sample measurement
    noise.ts            The same strategy on random walks, for comparison
  live/
    execution.ts        The adapter seam. One implementation, simulated.
    paper.ts            Live-data forward test
  report.ts             Terminal reports, caveats included
  cli.ts                Commands and flags
```

## The three decisions that make the numbers trustworthy

**Orders fill at the next bar's open, never at the close that produced the
signal.** Filling at the signal bar's close hands the strategy a price it could
not have traded at, and it is worth more imaginary profit than any indicator
here. `test/backtest.test.ts` asserts it on a gapping series: a strategy that
goes long on a 100-close pays 200 when the next bar opens there.

**Strategies are handed history that is grown, not sliced.** The array passed to
`onBar` contains bars `0..i` because those are the only bars that have been
pushed into it yet. Future bars are not hidden from the strategy — they do not
exist in the data it holds.

**Trading costs money by default.** 10 bps fee, 5 bps slippage, 5 bps/day on
shorts. A strategy that turns its book over daily pays roughly 55% of capital a
year before it has predicted anything, and the report prints that bill next to
the profit.

## Reading a report

The caveats under the table are the point. They fire on too few trades, a
t-statistic under 2, fees larger than the whole profit, turnover that real fills
could not absorb, and — most often — the plain fact that buy-and-hold won.

`Excess over holding` is in percentage points against the asset itself. If it is
negative, the strategy lost to doing nothing, whatever its Sharpe ratio says.

## Tests

```bash
npm test --workspace @buurklus/tradingbot
```

The suite is mostly invariants rather than examples: no lookahead, fees charged
on both legs, the kill switch never resetting, a walk-forward test window always
starting after its training window, and the sanity check that a trend follower
makes money on a trending series and loses it on a mean-reverting one.
