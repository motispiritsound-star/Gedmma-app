# Connecting to Kraken

Kraken matters for one reason: it is the venue where the crypto strategies in this
repository can actually be traded by a European retail client. IBKR cannot serve
EU retail spot crypto at all (see [IBKR.md](IBKR.md)), so everything built on
BTCUSDT bars had nowhere to go. Here it does.

That is the good news, and it arrives with a bill.

## The fee, which changes the answer

Kraken's spot schedule starts at roughly **0.25% maker / 0.40% taker** and falls
with 30-day volume. Every order this harness places is a market order, and a
market order is always a taker — so **40 basis points per fill, 80 per round
trip.** The harness defaulted to 10 bps, because that is roughly what Binance
charges, and that default quietly made every crypto backtest in here a measurement
of a cheaper world.

Here is the same strategy on the same bars, with nothing changed but the fee
schedule:

| | Binance-ish (10 bps) | Kraken (40 bps taker) |
| --- | --- | --- |
| **Daily bars**, 61 round trips | | |
| Total return | 380.65% | 233.32% |
| Sharpe | 1.20 | 0.95 |
| Cost drag per year | 5.97% | 19.12% |
| **Hourly bars** | | |
| Total return | +19.71% | **−17.48%** |
| Sharpe | **3.04** | **−2.78** |
| Cost drag per year | 60.86% | 202.12% |

Read the hourly row twice. A strategy with a Sharpe ratio of 3.04 — the kind of
number that would have you reaching for an API key — becomes a Sharpe of −2.78
purely because the venue you can actually use charges four times what the backtest
assumed. No signal changed. No bar changed. Only the bill.

So: rerun everything with `--commission kraken` before forming any opinion.

```bash
npm run bot -- backtest --csv xbteur.csv --interval 1d --commission kraken
npm run bot -- significance --csv xbteur.csv --commission kraken --strategy mean-reversion
npm run bot -- walkforward --csv xbteur.csv --commission kraken --strategy mean-reversion
```

`--volume-30d` picks a cheaper tier if you genuinely trade that much, and
`--role maker` prices a maker order — but do not use the maker fee unless you have
also solved what happens when a limit order does not fill, which this harness has
not. An unfilled order leaves the bot's idea of its position wrong, and that is a
worse problem than the 15 basis points it saves.

## There is no paper account

This is the important structural difference from IBKR. Kraken has **no
paper-trading account for spot.** An order that is sent is real. (There is a demo
environment for Kraken Futures, but futures are a different, leveraged instrument
and not what this harness targets.)

What exists instead is Kraken's `validate` flag, which has the exchange check an
order and place nothing — decimals, minimum size, pair name and your key's
permissions all verified for real, with no execution. So this adapter validates
server-side by default, and that is strictly better than a local dry run: it
catches the rejections you would otherwise meet at the worst moment.

The gates follow from that:

```bash
# Validated by Kraken, executed by nobody. This is the default.
npm run bot -- trade --broker kraken --pair XBTEUR --strategy mean-reversion \
  --interval 1h --commission kraken --max-order-value 50 --journal ./data/kraken.jsonl

# Real money on a real exchange. Both flags are required, deliberately.
npm run bot -- trade --broker kraken --pair XBTEUR --send --i-accept-real-money ...
```

`--send` alone is refused. On IBKR a `DU` paper account makes `--send` harmless,
so one flag is enough there. Here there is no harmless version, so it takes two.

Before that, forward-test with simulated money against live Kraken prices, which
costs nothing and is what `paper` is for:

```bash
npm run bot -- paper --strategy mean-reversion --interval 1h \
  --commission kraken --state ./data/run.json --resume
```

## The API key, and the one checkbox that matters

Create the key in Kraken's settings with **"Withdraw Funds" switched off.** That
single checkbox is worth more than everything else on this page: a key that can
only trade turns a compromise into an annoyance, and a key that can withdraw turns
it into a total loss.

The key and secret are read **only from the environment**:

```bash
export KRAKEN_API_KEY='...'
export KRAKEN_API_SECRET='...'
npm run bot -- kraken status
```

Never as command-line flags. Flags end up in shell history and in the output of
`ps` for every other user on the machine. The code refuses to read them from
anywhere else, the secret is used as an HMAC key and nothing more, and neither
value is logged or included in an error message.

Two more things about the credentials:

- **One key per bot.** Kraken requires the nonce to increase strictly and forever
  for a given key. Two processes sharing a key will interleave nonces and start
  getting `EAPI:Invalid nonce`, intermittently, which is an unpleasant bug to
  diagnose at three in the morning.
- **The signature is verified against Kraken's own published test vector** in
  `test/kraken.test.ts`, not against our own output. A self-consistent signature
  that Kraken rejects looks exactly like a correct one until the first live order
  fails.

## Three API details that corrupt a backtest if you miss them

**The OHLC endpoint returns at most 720 bars**, whatever you ask for. That is under
two years of daily history, and twelve hours of minute history. It is not enough to
walk-forward anything. For a real backtest, download Kraken's historical OHLCVT
archive and use `--csv`; the `kraken bars` command says so rather than quietly
handing you a short series.

**The last bar in the response is the current, still-forming candle, and Kraken
always includes it** regardless of the `since` you passed. Its close keeps moving.
A strategy tested against it is reacting to a price that had not settled — and it
will look prescient, because it is. The parser drops it and a test pins that
behaviour.

**Kraken answers HTTP 200 with an error array** for most refusals, including a
rejected order. A client that only checks the status code reads a failed order as a
success and carries on believing it holds a position it does not. `unwrap` treats
the error array as the failure it is.

## What the adapter does not do

- **Market orders only**, for the reason above: the maker fee is not available to
  code that cannot manage an unfilled order.
- **No shorting.** Spot cannot short, and the adapter refuses a negative target
  weight rather than silently treating it as flat — which would make a
  short-enabled strategy look as though it had been tested here.
- **No leverage.** A target weight above 1 is refused; a spot account cannot
  borrow.
- **It reads the balance rather than tracking its own fills.** That is deliberate —
  a bot with its own idea of the balance will disagree with the exchange the
  moment anything unexpected happens, and then trade on its own version. But the
  flip side is real: **coins of the base asset you bought by hand are not ignored,
  and the bot will manage them as its own position.** Trade from a dedicated
  account or subaccount if that is not what you want, and clear any open orders
  the bot did not place — `kraken status` counts them and warns.
- **No currency conversion.** Pick a pair quoted in the currency you actually hold.
  `XBTEUR` if your account is in euros; trading `XBTUSD` from a euro balance
  involves an FX leg the harness knows nothing about.

## Also worth knowing

**Kraken names assets its own way.** Euro is `ZEUR`, bitcoin is `XXBT`, and the
pair `XBTEUR` is canonically `XXBTZEUR`. `kraken pairs --pair XBTEUR` prints the
names, the minimum order and the allowed decimals. An order with one decimal too
many is rejected outright, and a bot that discovers that when it wants to *exit*
has a position it cannot close.

**Minimum order sizes are per pair and not small.** Check them before assuming a
€50 account can trade at all.

**Regulation and tax.** Kraken serves EU clients through its European entity, and
the regulatory picture for crypto exchanges in the EU has changed recently — verify
what applies to you rather than taking this page's word for it. In the
Netherlands, crypto holdings are generally box 3 (vermogen), but systematic,
labour-intensive trading can be treated as income and taxed very differently. Ask
an adviser before your first profitable year.

## The order to do this in

1. `kraken pairs --pair XBTEUR` — minimum order and decimals.
2. `kraken bars --pair XBTEUR --interval 1d --out xbteur.csv` — and read the note
   about the 720-bar ceiling. For anything serious, get the archive instead.
3. `backtest --csv xbteur.csv --commission kraken` — **with the Kraken fee, not
   the default.** If the result dies here, it died because the venue is expensive,
   and that is a real finding rather than a bug.
4. `significance` and `noise`, both with `--commission kraken`.
5. `walkforward`. If this is flat, stop. You have saved the money.
6. `paper --commission kraken` with `--state` and `--resume`, for months.
7. `trade --broker kraken` without `--send`, and read what Kraken says about each
   order it validated.
8. Only then is there a conversation to have about `--send`.
   [TRADING.md](TRADING.md) has the arithmetic on what that conversation is
   realistically worth.
