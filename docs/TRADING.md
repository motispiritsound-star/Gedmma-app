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

## What the Claude-built bots that exist actually show

Worth checking, since the whole premise of the post this started with is that
this has been done successfully. Several real open-source projects exist, and some
are decent pieces of engineering:

- **OpenTrade** — a harness for Claude Code / Codex agents to trade a Robinhood
  agentic-trading account, with guardrails, monitors and schedules.
- **cbt-framework** — an AI backtesting framework for Claude Code, 21 commands
  across four exchanges.
- **claude-trading-bot** — Claude Code driving TradingView and MetaTrader 5, with
  Telegram alerts and trailing stops.
- **Claude-Trading-Agent-Build** — the Claude API wired to live market data and an
  exchange, with a configurable pre-trade safety check.
- **claude-trading-skills** — Claude Code skills for market analysis, screeners and
  strategy development.

What they have in common is real plumbing, explicit disclaimers, and instructions
to validate in paper trading first. What none of them has is a **verified live
track record.** Not a backtest, not a screenshot: an audited record of money
actually made over a period long enough to mean anything.

The single most informative data point is a project that *corrected itself*. One
repository had claimed an "institutional-grade" rating and a +42.68% backtest, and
removed both on the grounds that neither was supported by evidence. That is to its
credit — it is exactly what should happen. It also tells you what such claims are
worth before somebody checks them, and every number in the viral posts is in the
un-checked category.

So the honest summary of the ecosystem is: **it has produced infrastructure, not
evidence of edge.** Which is consistent with everything else on this page, and it
is why this harness is built to disprove strategies rather than to showcase them.
If you find something here that survives `significance`, `noise` and
`walkforward`, you will have more than any of those repositories is claiming.

## An edge is a property of a strategy *at a size*

The execution-focused backtesters (NautilusTrader is the usual reference) exist
because the fast research tools are, in the field's own words, accurate about
signals and untruthful about microstructure. A fixed slippage figure says a €50
order and a €50,000 order in the same asset cost the same to execute. They do not.
Past a small share of the volume trading alongside you, your own order moves the
price, and the move grows roughly with the square root of your participation:

```
impact ≈ k · σ · √(Q / V)
```

The exponent being a half rather than a one is the whole problem: impact per unit
*falls* with size, so it is invisible while you are small and then suddenly is not.
`--impact` turns it on, and the consequence is that a backtest stops being
size-independent. Same strategy, same bars, only the account:

| Account | Total return | Sharpe | Average slippage | Largest share of a bar |
| ------- | ------------ | ------ | ---------------- | ---------------------- |
| €1,000 | +231.59% | 0.95 | 5.7 bps | 0.13% |
| €100,000 | +37.07% | 0.35 | 78.5 bps | 5.43% |
| €2,000,000 | −37.79% | −0.49 | 267.7 bps | 63.09% |

That is a capacity limit, and every strategy has one. Quote a result together with
the size it was measured at, or the result does not mean anything. And note the
direction of the good news: a small account is the one case where this cost is
genuinely negligible — which is the only structural advantage a small account has,
and it is worth not giving away by trading something thin.

## Train and test were never as separate as they looked

A walk-forward with training strictly before testing still leaks. A strategy with a
hundred-bar lookback, evaluated on the first test bar, is reading ninety-nine bars
that were in the training set, and serial correlation carries more. The field treats
the fix as standard — purging and embargoing, from López de Prado — and it is
simply a gap: drop the last *N* bars of each training window so neither side sees
them.

`walkforward` now does this by default, with *N* set to the longest warm-up in the
strategy's grid, and prints how many bars it withheld. It costs training data and
buys an out-of-sample number that is actually out of sample.

## How long until you would know

This document has been answering "how long should I paper trade?" with a rule of
thumb — thirty times the holding period — which is not wrong but is not derived
from anything. The minimum track record length is derived, and falls out of the
same expression that deflates a Sharpe ratio:

```
MinTRL = 1 + [1 − γ₃·SR + (γ₄−1)/4·SR²] · (Z_α / SR)²
```

Every backtest report now prints it. Two properties are worth internalising:

**Required length goes with the inverse square of the edge.** Half the Sharpe
ratio needs four times the evidence. A strategy that looks respectable at Sharpe
0.95 on daily bars needs about **three years** of running before that number could
be told apart from zero at 95% confidence.

**A finer interval does not get you there faster.** For a given annualised Sharpe,
the calendar time required is the same on hourly bars as on daily ones: twenty-four
times as many observations, each covering a twenty-fourth of the time. An
annualised Sharpe is a claim about a year, and sampling the same year more often
does not produce more independent evidence about it. Anyone who switches to a
shorter timeframe hoping to validate faster is paying more in fees for the same
wait.

## Does the timing time anything?

The sharpest test for any chart-reading system, and the one it is least likely to
have had. A long-only strategy invested 60% of the time, in a market that rose, will
make money. Whether it made money *because* it chose those moments is a separate
question, and a backtest cannot answer it because there is nothing to compare
against.

`bot timing` builds the comparison. It keeps the strategy's own schedule — how long
it held, how long it stood aside, how often it switched — and shuffles only *when*
those stretches happened. Same exposure, same trade count, same commission, same
distribution of holding periods. The only thing destroyed is the signal.

It has a positive control, because a null test that can never reject the null is
worthless: a deliberately clairvoyant strategy is detected at the 98th percentile,
and a trend filter over a random walk correctly is not.

Run over a fixture built *specifically* to contain persistent bull and bear regimes
— the structure trend following exists to exploit — not one of the five strategies
in this repository beat random timing with the same exposure:

```
  strategy          returned   random median   beaten by   verdict
  trend-filter       +69.3%        +59.9%      175 of 400  no better than random
  donchian           +42.0%        +27.8%      134 of 400  no better than random
  ema-cross          +29.1%        +50.3%      291 of 400  no better than random
  mean-reversion     +27.8%        +13.4%      119 of 400  no better than random
  ta-confluence       +3.3%         +4.1%      203 of 400  no better than random
```

That is not a claim that technical analysis never works. It is a claim about these
five rules on this fixture, and it says what trend-filter's advantage over the
others actually was: **how much time it spent invested, not which periods it
chose.** Being out of the market 41% of the time cut the worst drawdown from 37.5%
to 24.5%, which is worth something real and is a far smaller claim than timing.

[EQUITIES.md](EQUITIES.md) works the whole thing through for long-only equities,
which is the shape this test matters most for.

## The drawdown you got was one sample

A backtest reports the one drawdown history happened to deal, which is a sample of
size one from the thing that actually decides whether you can run the strategy.
Three losses in a row instead of spread out is the difference between a bad month
and switching the bot off at the bottom.

So the report reshuffles the trades that actually happened, a thousand times, and
gives the distribution:

```
  Drawdown history dealt         21.87%
  Reshuffled: median             15.25%
  Reshuffled: 1 in 4 beyond      20.25%
  Reshuffled: 1 in 20 beyond     28.60%
  Reshuffled: worst of 1000      47.65%
```

This says nothing about whether the edge is real — `noise` and `significance` are
for that. It says: *given* these trades, plan for the 1-in-4 figure rather than the
one you were shown, and decide in advance whether you would sit through the
1-in-20. Most people find out that they would not, at the worst possible moment.

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

## Measuring a goal instead of a strategy

`bot target` is the only command here that measures what you *want* rather than
what you have. It is the cheapest thing in the repository to run and the most
likely to change what you do next, so it is worth running first.

```bash
npm run bot -- target --capital 10000 --goal 1000000 --years 1 \
  --symbol BTCUSDT --interval 1d --monthly 500
```

### The rate, spelled out

€10,000 to €1,000,000 in a year is 100x. That is:

| Per | Rate, net of all costs, sustained |
| --- | --- |
| trading day | **1.84%**, 252 times |
| week | 9.26%, 52 times |
| month | **46.78%**, twelve times |

Not on average — every period, including the bad ones, because a month at −20%
has to be made back before the run resumes.

### The ceiling on compounding, which no leverage gets past

This is the part that settles it, and it is three lines of algebra. Leverage does
not improve a strategy; it scales the return and the volatility together. For a
strategy with annualised Sharpe `S` and volatility `σ`, leverage `L` gives an
arithmetic drift of `L·S·σ` and a variance of `L²σ²`, so the growth rate that
actually compounds — the logarithmic one — is

```
g(L) = L·S·σ − ½·L²·σ²
```

A downward parabola in `L`. It peaks at `L* = S/σ` (the Kelly fraction), and the
peak value is

```
g(L*) = S²/2
```

**The fastest any strategy can compound, at any leverage, is S²/2 per year.** Past
the optimum, more leverage makes you poorer: variance grows quadratically while
return grows linearly. No setting, no amount of work and no cleverness gets around
it, because it is not a fact about strategies — it is a fact about compounding.

So 100x in a year requires `S ≥ √(2·ln 100) = 3.03`, and that only puts the
*median* outcome on target. For context: Renaissance Medallion, the best documented
record in the history of finance, ran at about 39% a year net. Good systematic
retail strategies that genuinely work land at a Sharpe between 0.5 and 1.0. The
textbook EMA crossover in this repository reaches **1.53 on pure noise**, which is
why a measured Sharpe above 1 is evidence of very little.

### What chasing it costs

```
  sharpe   leverage    median  P(target)   P(−50%)  P(−90%)  wiped by
  3.03        10.1x    100.0x     50.00%    49.11%    8.90%     9.89%
  2.00         6.7x      7.4x      9.64%    46.07%    5.97%    15.00%
  1.50         5.0x      3.1x      1.02%    41.94%    3.28%    20.00%
  1.00         3.3x      1.6x    0.0020%    32.81%    0.61%    30.00%
  0.50         1.7x      1.1x   1.6e-17%    11.48% 0.00013%    60.00%
```

At a Sharpe of 0.5 — a real, respectable, achievable number — the probability of
100x in a year is 1.6 × 10⁻¹⁷ percent. That is not "unlikely". At a Sharpe of 3,
which nobody has, it is a coin flip, with a 49% chance of being down half along the
way and a 9% chance of being down ninety percent.

### And then the part the mathematics leaves out

Everything above treats a drawdown as recoverable. With leverage it is not. At
10.1x, a single adverse move of 9.89% takes the account to zero, and zero does not
recover. So the command measures that against the market itself:

```
  leverage examined             10.1x
  wiped out by a move of        9.89%
  bars examined                 2000
  bars that would have done it  9
  worst adverse move in them    12.72%
  chance of one in a year       80.72%
```

Measured open-to-low, because the exchange liquidates on the low and not on the
close. On a series at 60% annualised volatility — *less* volatile than Bitcoin has
been — nine bars in two thousand would have ended it, which is a **81% chance of
liquidation within the year.**

So the honest summary of the plan is: you need a Sharpe ratio nobody has, and if
you had it, the leverage it requires would most likely liquidate you before you
arrived.

### Full automation does not change any of this

It is worth being explicit, because automation is usually offered as the thing
that makes the difference. It changes execution, not expected return. A bot removes
hesitation, emotion and the missed entry; it does not raise `S`, and `S²/2` is the
only thing standing between you and the target.

Where automation does change the picture, it is for the worse:

- **A kill switch cannot outrun a gap.** The drawdown stop in this harness acts at
  a bar close. At 10x leverage a 10% gap is a liquidation, and it completes before
  any bar closes. The protection arrives after the event it was meant to prevent.
- **Nobody is watching.** The whole point of running unattended is that you are
  asleep. That is fine when the worst case is a bad day and fatal when the worst
  case is an absorbing barrier.
- **It scales a mistake perfectly.** A sign error, a stale price, a symbol mapped
  to the wrong contract: a human notices after one trade. A bot executes it two
  hundred times before breakfast, with perfect discipline.

Automation is genuinely worth having — on a strategy that is unlevered, validated
out of sample, and whose worst case you have decided you can live with. It is the
last step, not the one that makes an impossible target possible.

### What the same money does at returns that exist

```
  annual return               years to 100x
  39% (the record)                     14.0
  25%                                  20.6
  20%                                  25.3
  15%                                  33.0
  10%                                  48.3
```

And the comparison nobody makes: €10,000 plus €500 a month at 7% is about
**€105,000 after ten years** and **€292,000 after twenty** — achieved by adding
money rather than by multiplying it, with no leverage, no liquidation risk and no
edge required. Over a decade the amount you add usually matters more than the rate
you earn, and it is the one input you control exactly.

It is a worse story and a better plan.

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
6. **`timing`** — shuffle when the positions happened, keeping the exposure and the
   costs, and find out whether the signal chose moments or only chose how long to
   be invested.
7. **`walkforward`** (and `portfolio --validate`) — choose parameters on one
   stretch of history and measure on the *next* one. These are the only numbers
   in the repository worth much. A plain backtest lets you tune until the curve
   is pretty and then reports the curve, which tells you nothing, because you
   chose the parameters after seeing the data.
8. **`paper`** — forward-test against live prices with simulated money, with
   `--state` and `--resume` so the run survives restarts. For as long as the
   minimum track record length says, which the backtest report now prints.

There is no ninth step in this repository. That boundary is deliberate, and
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
