# Trading: what the harness measures, and what the post you read was selling

This document exists because the code in `apps/tradingbot` was written in
response to a specific claim, and the claim does not survive arithmetic. The
code is real and useful. The claim is not, and building the one without writing
down the other would be the dishonest half of the job.

## The post, checked with a calculator

> Starting capital: $68. First night: $6,732 profit. Total profit so far:
> $750,000.

**$68 into $6,732 in one night is a 99x return, 9,800%, overnight.**

On spot — buying the asset outright — that requires Bitcoin itself to rise 99x
between evening and morning. It has never moved 99x in a year.

With leverage, the arithmetic gets worse rather than better, because leverage
cuts both ways and the exchange closes you out before it can pay you. Take the
most generous case available anywhere:

| Leverage | Notional on $68 | Move needed for $6,732 | Move that liquidates you |
| -------- | --------------- | ---------------------- | ------------------------ |
| 10x      | $680            | +990%                  | −10%                     |
| 25x      | $1,700          | +396%                  | −4%                      |
| 100x     | $6,800          | +99%                   | −1%                      |
| 125x     | $8,500          | +79%                   | −0.8%                    |

At 100x, you need Bitcoin to rise 99% overnight **and** never to dip 1% against
you at any instant along the way. Bitcoin's largest single-day move in its
history is around 40%, and it does not travel in a straight line. There is no
leverage setting on any exchange at which that night is possible. It did not
happen.

**$68 into $750,000 is a factor of 11,029.** Here is how long that takes at
returns that real institutions actually achieve:

| Annual return                            | Years from $68 to $1,000,000 |
| ---------------------------------------- | ---------------------------- |
| 20% (an excellent fund)                  | 53                           |
| 39% (Renaissance Medallion, net, 30 yrs) | 29                           |
| 100% (doubling every year, sustained)    | 14                           |

The best documented track record in the history of finance, applied to $68,
produces a millionaire in just under thirty years. The binding constraint is the
$68, not the bot. This matters for you directly: if you start with a few hundred
euros, **no** strategy, edge, or amount of code turns that into a million in any
timeframe you would recognise as "soon". Starting capital is the lever, and
there is no software fix for it.

## The rest of the post, line by line

**"Spots price errors before humans even notice."** The firms that actually
collect cross-venue mispricings rent space in the same building as the
exchange's matching engine and measure their round trips in microseconds. A
bot on a home connection is 1,000 to 100,000 times slower. By the time a
1-second poll — the post's own number — has returned a price, the opportunity
has been taken several thousand times over.

**"Scans over 50 markets simultaneously."** Binance's minimum order is roughly
$5–$10 of notional. With $68 you cannot hold a position in fifty markets; you
cannot hold one in ten. The detail is there because it sounds like
infrastructure.

**"Arbitrage windows."** Cross-exchange spreads on BTC are typically under 10
basis points. A round trip costs you 20 bps in taker fees alone, before
slippage, before the withdrawal delay and transfer risk of moving inventory
between venues. The spread has to clear your costs before it is an
opportunity, and at retail fee tiers it usually does not.

**"Comment Fable. Like and repost. Follow. I'll DM you the setup."** This is
an engagement-farming template. The numbers are chosen to be impressive rather
than possible, the mechanism is vague in exactly the places where it would be
checkable, and the payload is the comment count. What arrives in the DM — when
anything does — is a paid course or an affiliate link to an exchange that pays
the poster a cut of the fees you will generate.

## Why screenshots are not evidence, even the honest ones

Out of a million people running bots, tens of thousands will have a spectacular
first week from luck alone. Those are the ones who post. The ones who lost are
not posting, which is why your feed looks the way it does.

This effect is not a vague warning, it is measurable, and the harness measures
it. `npm run bot -- noise` runs a strategy over hundreds of **random walks**:
price series with nothing in them to predict, by construction. Here is what
the textbook EMA crossover "earns" on 200 such series:

```
  worst                       -1.69
  median                      -0.30
  95th percentile              0.77
  best                         1.53
```

A Sharpe ratio of 1.5 on pure noise. If your backtest comes back at 1.2, you
have not found an edge — you have found a number that random data hands out
one time in twenty. That 95th percentile is the bar a real result has to clear
before the word "edge" means anything.

## "Scans 50 markets" is a claim about CPU, not about risk

This one deserves its own section, because it is the most persuasive-sounding
line in every one of these posts and it is measurable.

Run `npm run bot -- correlation` on a basket of majors. Eight crypto-like assets
come back at an average pairwise correlation near 0.9, and the report converts
that into the number that matters:

```
  Average pairwise correlation    0.893
  Effective independent bets      1.10 of 8
```

For *n* equally weighted assets with average pairwise correlation ρ, the basket
carries the same variance as `n / (1 + (n−1)ρ)` uncorrelated ones. At ρ = 0.9,
fifty markets are worth about 1.1 bets. Every position is the same position
wearing a different ticker, and on the day it matters they all draw down
together. Scanning more markets buys you more chances to be wrong about the
same thing, not diversification.

This also kills the arbitrage story from the other end. Cross-venue
mispricings exist precisely because venues are *not* perfectly linked — and the
ones retail can see are the slow, wide, low-volume pairs where the spread is an
illusion created by the fact that nobody can trade size there.

## The number most backtests are missing

Try twenty parameter sets and keep the best, and you have not measured a
strategy. You have measured the maximum of twenty draws, which is a positive
number even when every draw came from noise. The size of that inflation is
computable, and `npm run bot -- significance` computes it:

```
  Configurations searched         4
  Winner's Sharpe (annual, 1d)    1.30
  Hurdle from the search alone    0.0025
  Deflated Sharpe probability     0.999
  Verdict                         significant
```

The deflated Sharpe ratio asks the question a raw Sharpe ratio does not: would a
strategy with no edge have looked this good, given how many were tried, over how
many observations, with returns this skewed and fat-tailed? Short series,
negative skew and excess kurtosis all make a Sharpe ratio less trustworthy, and
all three are normal in crypto. Report the deflated figure. A strategy that
cannot clear the hurdle its own parameter search creates has nothing in it.

The multi-asset version of the same trap is worse, because concentration
manufactures variance. `noise --portfolio` runs a rotation strategy over
universes generated with the momentum deliberately switched off:

```
  Beat equal-weight hold          7 of 25 runs
  Best excess return              158.13%
```

Seven wins out of twenty-five, and a best run up 158%, on data containing
nothing to rotate into. A single spectacular multi-asset backtest is one draw
from that distribution. This is not a hypothetical: building this harness, the
first seed tried showed the momentum strategy beating its benchmark by 200
percentage points. Across twenty-five seeds it won six times.

## What "runs 24/7" actually requires

A bot described as running for months has to survive a restart, and almost none
of them do. A process that dies and comes back with its opening balance has not
been forward-testing for three months; it has run a fresh demo every few days,
which is how people accumulate a long history of results that means nothing.

So `paper --state run.json --resume` writes the account after every bar — cash,
position, fills, open round trip, and the drawdown high-water mark — with a
temporary file and a rename, because rename is atomic and a plain write is not.
The high-water mark is the one people forget: a bot restarted mid-drawdown
measures its drawdown from the bottom and cheerfully keeps trading. A state file
belonging to a different symbol, interval or strategy is refused outright rather
than loaded into the wrong run.

## What this harness is for

It answers one question, in one order, and refuses to skip steps:

1. **`data`** — fetch candles and audit them. Gaps matter: exchange outages
   cluster around violent moves, so the bars you are missing are rarely the
   calm ones.
2. **`backtest`** — run a strategy over history, always against buy-and-hold.
   Most bots lose to simply holding the asset, and the report says so out loud
   when yours does.
3. **`correlation`** — before building anything multi-asset, find out how many
   independent bets the universe is really worth.
4. **`noise`** — find out what the same strategy produces from randomness, so
   you know how much of your backtest was luck. `--portfolio` does it for a
   universe.
5. **`significance`** — search the parameter grid, then deflate the winner for
   the size of the search.
6. **`walkforward`** (and `portfolio --validate`) — choose parameters on one
   stretch of history and measure on the *next* one. These are the only numbers
   in the repository worth much. A plain backtest lets you tune until the curve
   is pretty and then reports the curve, which tells you nothing, because you
   chose the parameters after seeing the data.
7. **`paper`** — forward-test against live prices with simulated money, with
   `--state` and `--resume` so the run survives restarts, for months, not days.

There is no eighth step in this repository. That boundary is deliberate, and
the next section explains it.

## Connecting it to a broker

There are two adapters now, and which one you need depends on what you want to
trade.

[IBKR.md](IBKR.md) covers Interactive Brokers: a gateway on your own machine, so
still no API keys anywhere in this repository, three gates in front of a real
order, and four facts that change what a strategy built on 24/7 crypto bars is
worth. The short version: as an EU retail client you probably cannot trade spot
crypto at IBKR at all, markets close so stops gap, the commission *floor* rather
than the rate is what a small account pays, and unpaid market data is fifteen
minutes old.

[KRAKEN.md](KRAKEN.md) covers Kraken, which is where EU retail spot crypto
actually lives — so the strategies in here have a venue. It also carries the most
expensive single finding in this repository. Kraken's taker fee is 40 basis points
against the 10 this harness defaulted to, and on hourly bars that difference turns
a strategy with a Sharpe of 3.04 into one with a Sharpe of −2.78. Same bars, same
signals, only the bill. Every crypto result here was a measurement of a cheaper
world until `--commission kraken` existed.

The section below still describes the design, and still holds for every venue the
harness does not have an adapter for.

## Why live trading is a separate, gated step

`ExecutionAdapter` in `src/live/execution.ts` is the seam where a real exchange
would go. There is exactly one implementation and it is simulated.

Implementing the live side means handling partial fills, rejected orders,
reconnects, clock drift, duplicate order IDs, and deciding how much real money
may be lost while you find out which of those you got wrong. All of that is
downstream of the question above: whether the strategy has any out-of-sample
edge. Nothing in steps 1–5 costs money. Everything after step 5 does. If the
walk-forward comes back flat — and for the strategies in here, on real data, it
usually will — you have saved yourself the fees and learned something true.

If it comes back genuinely good, implement the interface against the exchange
and leave the rest of the system alone.

## On the more careful write-ups

Not every post about this is selling something. The better ones — a bot that
scans a short list of pairs, checks risk before entry, logs every decision, and
paper-trades first — describe a reasonable system, and that shape is what this
harness implements. Three things still tend to be missing from them, and they
are the three that decide whether the result means anything:

- **The benchmark.** A momentum bot that made 40% in a year when the universe
  made 60% lost. Reporting the 40% alone is the single most common omission.
- **The search.** Parameters are tuned until the backtest looks good, and the
  tuned result is reported as if it had been predicted. `significance` and
  `walkforward` exist for exactly that gap.
- **The spread.** One run is one draw. Without the distribution of results the
  same strategy produces on data with no edge in it, a good-looking curve is
  not evidence.

A sound architecture measured carelessly still produces a number you cannot
act on.

## If you do eventually put money on this

Not advice, and not an endorsement. These are the conditions under which the
loss is survivable rather than formative:

- **Only money you can lose entirely**, and never borrowed money. Write the
  number down before you start, because you will want to revise it upward at
  exactly the wrong moment.
- **No leverage.** `--max-weight 1` is the default for a reason. Leverage does
  not improve an edge, it multiplies the variance around it, and liquidation is
  permanent in a way a drawdown is not.
- **API keys with trading enabled and withdrawal disabled**, restricted to your
  IP. No key in the repository, no key in an environment variable you have
  committed, ever. A key that cannot withdraw turns a compromise into an
  annoyance instead of a total loss.
- **Three months of paper first**, at minimum, and at least thirty times the
  strategy's average holding period. Watching a simulated account sit in a 15%
  drawdown for three weeks tells you something about yourself that no table of
  ratios can.
- **Decide your shutdown rule in advance** and put it in `--max-drawdown`. The
  kill switch in here never resets, on purpose: a strategy that has lost that
  much has falsified itself and deserves a human looking at it.
- **Taxes, in the Netherlands.** Crypto holdings are generally box 3 (vermogen),
  but systematic, labour-intensive trading can be treated as income instead,
  which is taxed very differently. Ask a tax adviser before your first profitable
  year, not after.

## The honest summary

Automating a trading strategy is a genuinely interesting engineering problem,
and this harness is a real tool for it. The realistic outcome of doing it well
is that you learn a great deal about markets, statistics and your own risk
tolerance, and that your returns look like a modest edge over holding the asset
— if you find an edge at all. That is the good case, and it is worth pursuing.

Becoming a millionaire quickly is not on the table, and every account that
tells you otherwise is selling something. Usually the thing it is selling is
you.
