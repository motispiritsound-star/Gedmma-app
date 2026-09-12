# Long-only, no shorts, technical analysis of company charts

This is the most sensible version of the plan that has appeared in this
repository, and it is worth saying why before saying anything else.

Removing leverage removes the failure mode that made the earlier targets
impossible. With no borrowed money there is no liquidation: the worst case becomes
a bad few years rather than zero, and zero is the only outcome that cannot be
recovered from. Removing shorts removes the other unbounded loss — a short that
goes against you has no ceiling. And equities are what a broker like Interactive
Brokers can actually serve a European retail client, which crypto at IBKR is not.

So this is the shape worth building. What follows is what it can and cannot do,
measured rather than asserted.

## What removing leverage costs, so the trade is explicit

The growth ceiling in [TRADING.md](TRADING.md) was `S²/2` at growth-optimal
leverage. Setting `L = 1` in the same expression gives

```
g = S·σ − ½σ²
```

which depends on the asset's volatility as well as the Sharpe ratio, and is a much
smaller number:

| Sharpe | log growth at 20% vol | compounded | years to 100x |
| ------ | -------------------- | ---------- | ------------- |
| 2.00   | 38.0%                | 46.2%      | 12.1          |
| 1.50   | 28.0%                | 32.3%      | 16.4          |
| 1.00   | 18.0%                | 19.7%      | 25.6          |
| 0.75   | 13.0%                | 13.9%      | 35.4          |
| 0.50   | 8.0%                 | 8.3%       | 57.6          |

Removing leverage does not merely make a plan safer. It lowers what the plan can
possibly return, and that is the trade being made rather than a footnote to it.
`bot target --capital 10000 --goal 1000000 --years 1` prints this table for your own
numbers.

## The test this approach most needs

"Buy and sell at the right moments" is a claim that can be checked, and almost
nobody checks it. A long-only system that is invested 60% of the time, in a market
that rose, will make money. The question is whether it made money *because* it
chose those moments.

`bot timing` constructs the comparison. It takes the strategy's own schedule — how
long it held, how long it stayed out, how many times it switched — and shuffles
only *when* those stretches happened. The null keeps exactly the same time in the
market, exactly the same number of trades and therefore identical commission, and
exactly the same distribution of holding periods. The only thing destroyed is which
bars the positions landed on: the information in the signal.

```bash
npm run bot -- timing --csv aapl.csv --interval 1d --strategy trend-filter \
  --commission ibkr-tiered --runs 500
```

The test has a positive control, because a null-hypothesis test that can never
reject the null is worthless. `test/timing.test.ts` runs a deliberately clairvoyant
strategy — one that holds whenever the next twenty bars rise — and the test detects
it at the 98th percentile. It also runs a trend filter over a random walk, which
has nothing to time by construction, and correctly finds nothing.

### What it found on a fixture built to favour trend following

`--synthetic equity` generates a series that switches between persistent bull and
bear regimes, because that persistence is the only thing a trend filter can
possibly be exploiting. A random walk has no such structure; a real index does.
Over 4,000 daily bars of it, with IBKR's share commission and the kill switch
raised so every row runs to the end:

| Strategy | Return | Sharpe | Max drawdown | Trades |
| --- | --- | --- | --- | --- |
| **buy-and-hold** | **+151.4%** | **0.61** | 37.5% | 1 |
| trend-filter (3 params) | +69.3% | 0.45 | **24.5%** | 25 |
| donchian | +42.0% | 0.36 | 30.7% | 88 |
| ema-cross | +29.1% | 0.26 | 35.0% | 105 |
| mean-reversion | +27.8% | 0.30 | 27.5% | 108 |
| ta-confluence (5 params) | +3.3% | 0.08 | 32.3% | 296 |

And then the timing test, on each of them:

| Strategy | Returned | Random timing, median | Shuffles that beat it | Verdict |
| --- | --- | --- | --- | --- |
| trend-filter | +69.3% | +59.9% | 175 of 400 | no better than random |
| ta-confluence | +3.3% | +4.1% | 203 of 400 | no better than random |
| ema-cross | +29.1% | +50.3% | 291 of 400 | no better than random |
| donchian | +42.0% | +27.8% | 134 of 400 | no better than random |
| mean-reversion | +27.8% | +13.4% | 119 of 400 | no better than random |

Not one of them beats random timing with the same exposure. Read that carefully,
because it is a narrower statement than it looks:

- It does **not** say technical analysis never works. It says these five rules, on
  this fixture, do not choose moments.
- It does say that what trend-filter achieved came from **how much time it was
  invested**, not from which periods it picked. Being out of the market 41% of the
  time cut the drawdown from 37.5% to 24.5%, and that is worth something real — but
  it is a much smaller claim than buying and selling at the right moments, and a
  far simpler rule would do it.
- It is a synthetic fixture. **Run it on your own charts.** That is what the
  command is for, and the answer may differ.

## More signals means less evidence

`ta-confluence` stacks four conditions the way a chart reader does: only act in an
uptrend, only when confirmed by the asset's own return, enter on a pullback rather
than into strength, exit on a shorter average. It is what "technical analysis of a
company chart" usually means, and it is in here because it was asked for.

It is also the clearest demonstration of the cost. Five parameters against
trend-filter's three, ten times the trades, and `significance` deflates it much
harder:

| | trend-filter | ta-confluence |
| --- | --- | --- |
| Sharpe of the best configuration | 0.45 | 0.16 |
| Hurdle from the search alone | 0.0016 | **0.0224** |
| Deflated Sharpe probability | 0.920 | 0.187 |
| Verdict | inconclusive | **indistinguishable from selection** |

The hurdle is fourteen times higher for the same number of grid entries, because
the extra parameters make the configurations' results far more variable — and the
more variable the search, the more of the winner's Sharpe ratio is explained by
having searched. Confluence is not free. Every condition you add is a dial that can
be turned until the backtest looks good, and the deflation prices exactly that.

If a more complex rule does not clearly beat a simpler one **after** deflation, the
extra conditions are decoration.

## The one thing that genuinely gets easier

Fees. A long-only trend filter on daily bars traded 25 times in eleven years. At
IBKR's share schedule on €10,000 that is a cost drag of **0.02% a year** — against
the 19% a year that Kraken's taker fee takes from a daily crypto strategy, and the
202% a year from an hourly one.

That is the quiet advantage of this shape, and it is large. The entire commission
problem that makes high-frequency retail trading arithmetically hopeless simply does
not arise at this turnover. It also means the harness's cost realism, which kills
most strategies, has almost nothing to kill here — so whatever the result is, it is
about the signal rather than about the bill.

## Four data traps specific to company charts

**Unadjusted splits.** The quietest way an equity backtest goes wrong. A 2-for-1
split in a price series nobody adjusted looks exactly like a 50% overnight crash: a
trend filter sells into it, a dip-buyer buys it, and both results are fiction. `bot
data` now flags large overnight gaps that land almost exactly on a ratio a split
produces, and names the dates. It flags rather than fixes, because a genuine crash
near a round ratio would be flagged too and silently "correcting" a real price move
is worse than asking a human to look.

**Dividends.** A price series excludes them. For a dividend payer that understates
the total return by 2–4% a year — which is conservative for the strategy but also
understates the benchmark it is measured against, so it does not cancel cleanly.
Use a total-return series where you can, and know which one you have.

**Survivorship.** A universe of today's companies is a list of the ones that
survived. `portfolio` warns about this because no code can fix it: pick the universe
by a rule applied at the *start* of the test window, not by what looks reasonable
now.

**Market hours.** Equities gap overnight, over weekends and over holidays, and a
stop does not protect you across a close — the position is exposed from one bell to
the next and fills wherever the market reopens. The harness models this (a stop
fills at the worse of the trigger and the bar's open, and the report prints the
average and worst gap past the trigger) and it also refuses to pretend a daily loss
limit can be enforced from daily bars.

## What to actually expect

Stated plainly, because the numbers above have a shape and it is worth naming.

A long-only technical system on daily equity bars, done carefully, realistically
delivers **a lower return than simply holding, with a smaller worst drawdown.**
That is the trade trend following makes. Over the fixture above it gave up 82
percentage points of return to cut the drawdown by 13 points. Whether that is a good
trade depends entirely on whether you would have sat through the 37.5% version — and
most people find out that they would not, at the bottom, which is the one
circumstance in which the filter is worth more than it looks.

What it is not is a way to find tops and bottoms. No rule in this repository does
that, and the timing test is the reason I can say so with a number rather than an
opinion.

## The order to do this in

```bash
# 1. Get adjusted daily bars for a real company and audit them.
npm run bot -- ibkr search --symbol AAPL
npm run bot -- ibkr bars --conid 265598 --interval 1d --bars 2000 --out aapl.csv
npm run bot -- data --csv aapl.csv --interval 1d      # read the split warnings

# 2. Backtest against holding it, at your broker's real commission.
npm run bot -- backtest --csv aapl.csv --interval 1d --cash 10000 \
  --commission ibkr-tiered --strategy trend-filter --all

# 3. The question that matters: does the timing time anything?
npm run bot -- timing --csv aapl.csv --interval 1d --strategy trend-filter --runs 500

# 4. Price the parameter search, then measure out of sample.
npm run bot -- significance --csv aapl.csv --interval 1d --strategy trend-filter
npm run bot -- walkforward --csv aapl.csv --interval 1d --strategy trend-filter

# 5. Only if steps 3 and 4 both came back good: paper, for as long as the
#    minimum track record length in the backtest report says.
npm run bot -- paper --strategy trend-filter --interval 1d --state ./data/run.json

# 6. Then the IBKR paper account, dry run first.
npm run bot -- trade --conid 265598 --account DU1234567 --strategy trend-filter
```

Step 3 is the one that is new, and it is the one most likely to end the exercise.
That is a feature. [IBKR.md](IBKR.md) has the broker mechanics;
[TRADING.md](TRADING.md) has the arithmetic on what any of it is worth.
