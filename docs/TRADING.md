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

## What this harness is for

It answers one question, in one order, and refuses to skip steps:

1. **`data`** — fetch candles and audit them. Gaps matter: exchange outages
   cluster around violent moves, so the bars you are missing are rarely the
   calm ones.
2. **`backtest`** — run a strategy over history, always against buy-and-hold.
   Most bots lose to simply holding the asset, and the report says so out loud
   when yours does.
3. **`noise`** — find out what the same strategy produces from randomness, so
   you know how much of your backtest was luck.
4. **`walkforward`** — choose parameters on one stretch of history and measure
   on the *next* one. This is the only number in the repository worth much.
   A plain backtest lets you tune until the curve is pretty and then reports
   the curve, which tells you nothing, because you chose the parameters after
   seeing the data.
5. **`paper`** — forward-test against live prices with simulated money, for
   months, not days.

There is no sixth step in this repository. That boundary is deliberate, and
the next section explains it.

## Why there is no live trading code here

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
