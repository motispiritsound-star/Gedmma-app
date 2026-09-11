# Connecting to Interactive Brokers

This describes how `apps/tradingbot` talks to IBKR, what the connection can and
cannot do, and four things about IBKR that change what a strategy built on crypto
data is actually worth. Read the last section before the first one if you are
short of time.

## How the connection works

IBKR's Client Portal Web API runs against a gateway **on your own machine**. You
start it, you log into it in a browser, and the bot talks to `localhost`.

```bash
# 1. Download IBKR's Client Portal Gateway and start it (Java 8+ required).
#    It listens on https://localhost:5000 by default.
bin/run.sh root/conf.yaml

# 2. Open https://localhost:5000 in a browser and log in. Accept the
#    self-signed certificate warning — the certificate is the gateway's own.

# 3. Check the bot can see it.
npm run bot -- ibkr status
```

That design has one very good consequence: **there are no API keys anywhere in
this repository, and none to leak.** The session lives in the gateway. The bot
sends no credentials, stores none, and only ever connects to loopback —
`assertLoopback` in `src/broker/ibkrClient.ts` refuses any other host, because
the client accepts the gateway's self-signed certificate and that is only safe
over loopback. To reach a gateway on another machine, tunnel it
(`ssh -L 5000:localhost:5000 ...`) rather than pointing the bot at it.

It also has one bad consequence, and it is the one that matters for a bot:
**the session needs a browser login, and it expires.** `tickle` keeps a live
session from idling out, and the bot calls it, but a session still has to be
re-established by hand roughly daily. A strategy that must not miss a bar cannot
run unattended on this API for weeks. Plan around that, or do not claim the bot
runs 24/7.

## Finding what to trade, and getting bars

IBKR speaks in contract IDs, not tickers. "AAPL" is several contracts on several
venues in several currencies, and guessing is how an order lands on the wrong
exchange.

```bash
npm run bot -- ibkr search --symbol AAPL          # find the conid
npm run bot -- ibkr bars --conid 265598 --interval 1d --bars 500 --out aapl.csv
npm run bot -- backtest --csv aapl.csv --interval 1d --commission ibkr-tiered
```

Bars come back **regular trading hours only** unless you pass `--outside-rth`,
which is the right default: pre- and post-market prints are thin and wide, and
they are not where a market order at the open would go.

## Trading, in the order the gates come

```bash
# Dry run on the paper account. Logs every order, sends nothing.
npm run bot -- trade --conid 265598 --account DU1234567 \
  --strategy ema-cross --interval 1h --stop-loss 0.05 --cooldown 5 \
  --max-order-value 500 --journal ./data/ibkr.jsonl

# Same thing, actually sending orders to the paper account.
npm run bot -- trade --conid 265598 --account DU1234567 --send ...

# A live account additionally needs --i-accept-real-money.
```

Three gates, all deliberate:

- **`--send`.** Without it every order is logged and nothing leaves the machine.
  Read the log. Agree with what it was about to do. Then switch it on.
- **The account prefix.** IBKR paper accounts start with `DU`. Anything else is
  refused unless `--i-accept-real-money` is also passed.
- **`--max-order-value`.** A hard cap enforced in the execution layer, not the
  strategy, because a cap the strategy applies is a cap a broken strategy can
  skip. An order over the cap is **refused, not trimmed** — an order that size
  means something upstream is wrong, and quietly sending a smaller one hides it.

Two more things the adapter does on purpose. Quantities are rounded **toward
zero**, so a rounding error can never increase exposure. And equity and position
are read back from IBKR on every bar rather than tracked locally: a bot that keeps
its own idea of the balance will disagree with the statement the moment a
dividend, a fee or a manual trade lands, and it will then trade on its own
version.

## What the adapter does not do

Stated plainly, because each of these is a way a live run differs from the
backtest:

- **Market orders only.** A limit order that does not fill leaves the bot's idea
  of its position wrong until it is cancelled, and managing that properly is more
  than this adapter does.
- **No fill reconciliation.** A live order is reported as *submitted*; the actual
  position is discovered by reading it back next bar. Partial fills therefore look
  like a position that is smaller than requested, which is true but unexplained.
  IBKR's own statements are the record of what filled at what.
- **No currency conversion.** A euro account buying a dollar stock borrows
  dollars unless you convert first. The backtest knows nothing about that.
- **No corporate actions.** Splits, dividends and symbol changes are not adjusted
  for in the backtest, and a dividend arriving live will move equity in a way the
  strategy did not predict.
- **No futures or options multipliers.** The sizing maths assumes one unit is one
  unit of price.

## Four things that change what your strategy is worth

### 1. You probably cannot trade crypto at IBKR

This is the big one, because every strategy in this repository was built on
BTCUSDT. IBKR's spot crypto offering runs through Paxos and is, at writing,
**US-only**. A Dutch retail client gets equities, ETFs, futures, options, bonds
and FX — and for crypto exposure, at best an exchange-traded product, which is a
different instrument with different hours, a different spread and a holder fee.

So a strategy validated on 24/7 Bitcoin bars is not a strategy you can run at
IBKR. Re-run the whole pipeline — `backtest`, `significance`, `noise`,
`walkforward` — on bars of the instrument you will actually trade, fetched with
`ibkr bars`. Check your own account's permissions before assuming anything here.

### 2. Markets close, and that is not a detail

Crypto trades continuously. Equities gap overnight, over weekends and over
holidays, and a stop does not protect you across a close: the position is exposed
from one bell to the next, and the fill is wherever the market reopens.

The harness models that honestly — a stop fills at the worse of the stop price and
the bar's open, and the report prints the average and worst gap past the trigger.
Expect those numbers to be zero on crypto and distinctly non-zero here. That
difference is a real cost that a 24/7 backtest never showed you.

Relatedly, `--max-daily-loss` cannot be enforced from daily bars and the harness
says so rather than pretending. On equities that limit needs intraday bars or it
is decoration.

### 3. The commission floor, not the rate, is what you pay

IBKR charges per share with a **minimum per order**. On a tiered US share
schedule that is roughly $0.0035 per share, a $0.35 floor, capped at 1% of the
trade's value — check your own statement, because it varies by region, venue and
volume and it changes.

The rate is irrelevant to a small account. The floor is everything:

| Order size | Commission | One way | Round trip |
| ---------- | ---------- | ------- | ---------- |
| €35        | €0.35      | 1.00%   | 2.00%      |
| €100       | €0.35      | 0.35%   | 0.70%      |
| €1,000     | €0.35      | 0.035%  | 0.07%      |
| €10,000    | €0.35–35   | ≤0.35%  | ≤0.07%     |

And because the floor is **per order**, it multiplies with everything that makes a
strategy look sophisticated. Ten symbols rebalanced weekly is 20 orders a week:
€364 a year in minimums alone, which on a €500 account is **73% before the
strategy has predicted anything.**

`backtest` prints `Cost drag per year` for exactly this, computed from the fees
the run actually paid at its actual trade frequency, and warns above 5%. Run it
with `--commission ibkr-tiered --cash <your real balance>` before anything else.
If the drag is large the fix is not a better strategy; it is fewer, larger orders,
or a bigger account.

### 4. Delayed data is history

Real-time IBKR market data requires paid subscriptions per exchange. Without them
you get delayed quotes — typically fifteen minutes. A bot acting on a
fifteen-minute-old price is not trading, it is reminiscing, and on an hourly
strategy it will look like it works right up to the fills.

Check in Client Portal which subscriptions your account actually has before
running anything with `--send`. On daily bars this matters much less; on anything
intraday it decides the result.

## Also worth knowing

**IBKR's paper account fills are optimistic.** The paper engine fills at the
posted quote without modelling queue position or market impact. Paper results are
therefore *better* than live results for the same strategy, and systematically so
for anything that trades often or in size. Use paper to prove the plumbing works
and to watch yourself sit through a drawdown. Do not use it to estimate returns.

**Check `competing` in `ibkr status`.** Logging into Client Portal or TWS
elsewhere with the same username takes the session over. Requests keep succeeding
while orders quietly stop reaching the exchange, which is the worst failure mode a
bot has. The bot refuses to start a live run when that flag is set.

**Taxes, in the Netherlands.** Securities holdings are generally box 3
(vermogen), but systematic, labour-intensive trading can be treated as income
instead and taxed very differently. Ask an adviser before your first profitable
year, not after.

## The order to do this in

1. `ibkr search` and `ibkr bars` to get real bars for a real instrument.
2. `backtest --csv ... --commission ibkr-tiered --cash <your balance>` and read
   the cost drag line before anything else.
3. `significance` and `noise` to find out how much of the result is the parameter
   search and how much is luck.
4. `walkforward`. If this is flat, stop here. You have saved the money.
5. `trade --account DU... ` as a dry run, and read the journal.
6. `trade --account DU... --send` for months, not days.
7. Only then, and only if steps 3–6 all came back good, is there a conversation
   to have about real money. [docs/TRADING.md](TRADING.md) has the arithmetic on
   what that conversation is realistically worth.
