# tradingbot

A research harness for automated trading strategies. It downloads market data,
backtests single-asset and multi-asset strategies against the right benchmark,
measures how much of the result is luck or parameter-search selection, validates
out of sample, and forward-tests on live prices with simulated money across
restarts.

**It places no real orders and contains no exchange credentials.** That is a
design decision, not an unfinished feature — [docs/TRADING.md](../../docs/TRADING.md)
explains why, along with the arithmetic on the "$68 into $750,000" posts.

## Quick start

No API key is needed; Binance's market data is public.

```bash
npm install

# Inspect the data before trusting anything built on it.
npm run bot -- data --symbol BTCUSDT --interval 1d

# Backtest every single-asset strategy against buy-and-hold.
npm run bot -- backtest --symbol BTCUSDT --interval 1d --all

# Search the grid, then deflate the winner's Sharpe for the fact it was chosen.
npm run bot -- significance --symbol BTCUSDT --strategy mean-reversion

# What does this strategy "earn" on data with no edge in it?
npm run bot -- noise --strategy ema-cross --runs 200

# How many independent bets is a basket of majors actually worth?
npm run bot -- correlation --universe BTCUSDT,ETHUSDT,SOLUSDT,BNBUSDT,XRPUSDT

# Multi-asset: hold the strongest few, rebalanced on a clock.
npm run bot -- portfolio --universe BTCUSDT,ETHUSDT,SOLUSDT,BNBUSDT,XRPUSDT

# The numbers that actually matter: parameters chosen in-sample, measured after.
npm run bot -- walkforward --strategy ema-cross --folds 5
npm run bot -- portfolio --universe BTCUSDT,ETHUSDT,SOLUSDT --validate

# Forward-test on live prices with simulated money, surviving restarts.
npm run bot -- paper --strategy ema-cross --interval 1h \
  --state ./data/run.json --resume --journal ./data/run.jsonl
```

From inside `apps/tradingbot` the prefix shortens to `npm run bot -- <command>`.
`npm run bot -- help` lists every flag.

If your network blocks exchange APIs, nothing here needs it: every single-asset
command takes `--csv path.csv` (columns `openTime,open,high,low,close,volume`)
or `--synthetic trend|revert|random`, and the portfolio and correlation commands
take `--synthetic crypto --symbols 10`, which generates a basket correlated the
way crypto majors really are.

## Layout

```
src/
  types.ts              Candles, fills, trades, the cost model
  data/
    binance.ts          Public klines, paged and rate-limit aware. Read-only.
    store.ts            CSV cache, plus an audit for gaps and bad bars
    align.ts            Several symbols onto one timeline, and what that costs
    synthetic.ts        Seeded series and correlated universes with known properties
  indicators/           EMA, SMA, z-score, RSI, ATR — all backward-looking only
  strategy/
    buyAndHold.ts       The single-asset benchmark, as a first-class strategy
    emaCross.ts         Trend following
    meanReversion.ts    Dip buying, with hysteresis so it does not churn
    donchian.ts         Breakout
    crossSectionalMomentum.ts
                        Hold the strongest few of a universe, plus the
                        equal-weight benchmark it has to beat
    registry.ts         Names and parameter grids the CLI can reach
  risk/risk.ts          Weight cap, daily stop, drawdown kill switch, fee reserve
  engine/
    broker.ts           Paper fills with fees, slippage and borrow cost
    backtest.ts         The single-asset event loop, and the no-lookahead guarantee
    portfolio.ts        One cash pool across many symbols, with exposure caps
    metrics.ts          Sharpe, Sortino, drawdown, turnover, t-statistic
    walkforward.ts      In-sample selection, out-of-sample measurement
    portfolioWalkforward.ts  The same, for a universe
    noise.ts            The strategy on random walks and on edgeless universes
    stats.ts            Normal quantiles, skew, kurtosis, deflated Sharpe
    significance.ts     Search the grid, then price in the search
    correlation.ts      Average correlation and effective number of bets
  live/
    execution.ts        The adapter seam. One implementation, simulated.
    paper.ts            Live-data forward test
    state.ts            Crash-safe account state, written atomically each bar
    notify.ts           Optional https webhook for fills and the kill switch
  report.ts             Terminal reports, caveats included
  cli.ts                Commands and flags
```

## The decisions that make the numbers trustworthy

**Orders fill at the next bar's open, never at the close that produced the
signal.** Filling at the signal bar's close hands the strategy a price it could
not have traded at, and it is worth more imaginary profit than any indicator
here. Both engines are tested on a gapping series: a strategy that goes long on
a 100-close pays 200 when the next bar opens there.

**Strategies are handed history that is grown, not sliced.** The arrays passed to
`onBar` contain bars `0..i` because those are the only bars pushed into them yet.
Future bars are not hidden from the strategy — they do not exist in the data it
holds.

**Trading costs money by default**: 10 bps fee, 5 bps slippage, 5 bps/day on
shorts, and the weight cap is reduced by one entry's commission so a
fully-invested target cannot leave the account a few cents overdrawn.

**The benchmark is the right one.** A single-asset strategy is scored against
holding that asset; a portfolio strategy against holding the whole universe in
equal weight. Beating one coin by picking a different one is not a strategy.

**Every result is scored against what luck produces.** `noise` runs the strategy
on random walks; `noise --portfolio` runs it on universes built with the momentum
switched off; `significance` deflates the Sharpe ratio for the size of the
parameter search that produced it.

## What the reports will tell you that you would rather not hear

The caveats under each table are the point. They fire on too few trades, a
t-statistic under 2, fees larger than the whole profit, turnover real fills could
not absorb, a universe picked with hindsight, and — most often — the plain fact
that holding won.

Three findings worth knowing before you start, all reproducible from this repo:

- **The textbook EMA crossover reaches Sharpe 1.53 on pure noise.** Five percent
  of random walks give it better than 0.77. A backtest Sharpe of 1.2 is not an
  edge; it is a number randomness hands out one run in twenty.
- **Ten crypto-like majors are worth about 1.1 independent bets.** At an average
  pairwise correlation near 0.9, "scans 50 markets simultaneously" is a claim
  about CPU, not about risk.
- **A rotation strategy beats equal-weight hold in well under half of universes
  built with no momentum in them — and its best run is up 158%.** One good
  multi-asset backtest is a draw from that distribution.

## Tests

```bash
npm test --workspace @buurklus/tradingbot
```

150 tests, mostly invariants rather than examples: no lookahead in either
engine, fees charged on both legs and split across a partial exit, an account
that never borrows, a kill switch that stays tripped across a restart, a
restored high-water mark, a walk-forward test window that always starts after
its training window, state files that refuse to load into the wrong run, and the
sanity checks that each strategy makes money on the series built to suit it and
loses on the one built against it.
