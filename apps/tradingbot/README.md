# tradingbot

A research harness for automated trading strategies. It downloads market data,
backtests single-asset and multi-asset strategies against the right benchmark,
measures how much of the result is luck or parameter-search selection, validates
out of sample, and forward-tests on live prices with simulated money across
restarts.

It can place real orders through **Interactive Brokers** or **Kraken**, behind
deliberate gates, and it never sends one without being told to twice.
[docs/IBKR.md](../../docs/IBKR.md) and [docs/KRAKEN.md](../../docs/KRAKEN.md) cover
the two connections; [docs/TRADING.md](../../docs/TRADING.md) covers what the
harness measures and the arithmetic on the "$68 into $750,000" posts.

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

# Interactive Brokers: find a contract, pull its bars, trade the paper account.
npm run bot -- ibkr status
npm run bot -- ibkr search --symbol AAPL
npm run bot -- ibkr bars --conid 265598 --interval 1d --out aapl.csv
npm run bot -- trade --conid 265598 --account DU1234567 --strategy ema-cross

# Kraken: the venue where EU retail spot crypto actually lives.
npm run bot -- kraken pairs --pair XBTEUR
npm run bot -- kraken bars --pair XBTEUR --interval 1d --out xbteur.csv
npm run bot -- backtest --csv xbteur.csv --commission kraken
npm run bot -- trade --broker kraken --pair XBTEUR --commission kraken
```

Neither `trade` sends anything. IBKR's is a dry run until `--send`; Kraken's hands
every order to the exchange's own `validate` endpoint, which checks it and executes
nothing, and needs `--send --i-accept-real-money` to do more — because Kraken has
no paper account for spot, so there is no harmless version of sending.

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
  costs/
    commission.ts       What a broker actually charges: bps, per-unit with a
                        floor and a cap, per-order, per-contract
    slippage.ts         The spread, plus what your own order does to the price
  broker/
    ibkrClient.ts       IBKR Client Portal Web API, loopback only, no keys
    ibkrExecution.ts    Live execution behind three gates, dry run by default
    krakenClient.ts     Kraken's signed REST API; key from the environment only
    krakenExecution.ts  Spot execution, validated by Kraken unless told to send
  data/
    binance.ts          Public klines, paged and rate-limit aware. Read-only.
    source.ts           The DataSource seam: Binance, IBKR or Kraken
    ibkrData.ts         Bars from the IBKR gateway, regular hours by default
    kraken.ts           Kraken public data, 720-bar ceiling and all
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
  risk/
    risk.ts             Weight cap, daily stop, drawdown kill switch, fee reserve
    stops.ts            Stop, trailing stop and take-profit, filled through gaps
    sizing.ts           Volatility targeting, which only ever scales down
  engine/
    broker.ts           Paper fills with fees, slippage and borrow cost
    backtest.ts         The single-asset event loop, and the no-lookahead guarantee
    portfolio.ts        One cash pool across many symbols, with exposure caps
    metrics.ts          Sharpe, Sortino, drawdown, turnover, t-statistic
    walkforward.ts      In-sample selection, out-of-sample measurement, with a
                        purge-and-embargo gap between the two
    robustness.ts       How long a track record must be, and the spread of
                        drawdowns the same trades produce in a different order
    portfolioWalkforward.ts  The same, for a universe
    noise.ts            The strategy on random walks and on edgeless universes
    stats.ts            Normal quantiles, skew, kurtosis, deflated Sharpe
    significance.ts     Search the grid, then price in the search
    correlation.ts      Average correlation and effective number of bets
  live/
    execution.ts        The adapter seam, and why a live fill is not synchronous
    paper.ts            One live loop, driving a simulator or a real broker
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

**Trading costs money by default**, in the shape the broker actually charges it.
A crypto exchange takes basis points; IBKR takes a rate per share with a floor per
order, and on a small account the floor is all you ever pay. The report prints
`Cost drag per year` from the fees the run actually paid at its actual trade
frequency, and warns above 5%. The weight cap is reduced by one entry's commission
so a fully-invested target cannot leave the account overdrawn.

**An edge is a property of a strategy at a size.** `--impact` charges what your own
order does to the price — roughly with the square root of your share of the bar's
volume — so the same strategy on the same bars is cheaper at €1,000 than at
€2,000,000, because it is. A result quoted without the size it was measured at does
not mean anything.

**Train and test get a gap between them.** Even with training strictly before
testing, a hundred-bar lookback evaluated on the first test bar reads ninety-nine
training bars. `walkforward` withholds the strategy's longest warm-up between the
two windows by default and prints how many bars it dropped.

**Every report says how long until you would know.** The minimum track record
length, from the same expression that deflates a Sharpe ratio, replacing the rule of
thumb this repo used to offer. And the drawdown distribution from reshuffling the
trades that actually happened, because the one the backtest dealt was a sample of
size one.

**A stop does not fill at the stop price.** It becomes a market order when
touched, so a market that gapped past it fills wherever it reopened. Stops here
fill at the worse of the trigger and the bar's open, and the report prints the
average and worst gap past the trigger — the two numbers a naive backtest reports
as zero while hiding exactly the losses a stop cannot protect you from. When one
bar contains both the stop and the take-profit, the stop is assumed, because OHLC
data cannot say which came first and guessing in your own favour is how a coin
flip becomes an edge.

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
- **A 5% stop that gaps fills 15.8% below its trigger**, turning a backtested
  €950 into €800 on the same bars. Run `backtest --stop-loss 0.05` on anything
  with overnight gaps and read the two slippage lines.
- **Ten symbols rebalanced weekly at a €0.35 order minimum costs €364 a year**,
  which on a €500 account is 73% before the strategy has predicted anything.
- **Kraken's 40 bps taker fee turns an hourly strategy with a Sharpe of 3.04 into
  one with a Sharpe of −2.78.** Same bars, same signals; only the fee schedule of
  the venue you can actually use. Every crypto backtest here was run at 10 bps
  until `--commission kraken` existed.
- **The same strategy goes from +231% to −37% purely by raising the account from
  €1,000 to €2,000,000**, once its own market impact is charged. Every strategy has
  a capacity limit; `--impact` finds yours.
- **A Sharpe of 0.95 on daily bars needs about three years of running** before it
  could be told apart from zero at 95% confidence — and moving to hourly bars does
  not shorten that by a single day, it just costs more in fees.
- **Reshuffling the same trades turns a 21.87% drawdown into 28.60% one run in
  twenty, and 47.65% at worst.** The backtest showed you one ordering.

## Tests

```bash
npm test --workspace @buurklus/tradingbot
```

294 tests, mostly invariants rather than examples: no lookahead in either engine,
fees charged on both legs and split across a partial exit, a commission floor that
bites before its percentage cap, an account that never borrows, stops that fill
through a gap and lose to a take-profit in the same bar, a cooldown that blocks
re-entry but never an exit, order quantities rounded toward zero, a live account
refused without an explicit flag, a gateway URL refused unless it is loopback, a
Kraken signature checked against Kraken's own published test vector, a still-forming
candle dropped, an HTTP 200 carrying an error array treated as the failure it is,
market impact that grows with the square root of participation rather than linearly,
an embargo that refuses to starve a training window, a track record requirement that
quadruples when the edge halves, a kill switch that stays tripped across a restart, a restored high-water mark, a
walk-forward test window that always starts after its training window, state files
that refuse to load into the wrong run, and the sanity checks that each strategy
makes money on the series built to suit it and loses on the one built against it.
