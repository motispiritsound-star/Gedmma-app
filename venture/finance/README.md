# Unit-economics engine

Zero dependencies. No install step. `npm test` runs 20 tests on Node 20+.

## Why this is code and not a spreadsheet

A spreadsheet of unit economics is a picture of one opinion. It cannot tell you
which of its cells were measured and which were invented, and it silently keeps
producing confident answers as the inventions propagate. That is precisely the
failure this project was commissioned to avoid.

So the model is code, and it carries three properties a spreadsheet does not:

**1. Provenance travels with every number.** Each input is tagged `FACT`,
`ESTIMATE`, `ASSUMPTION` or `UNVERIFIED`, and every result inherits the weakest
tag among its ingredients. A verdict resting on an unverified supplier quote is
visibly an unverified verdict.

**2. The gate refuses to certify unknowns.** `evaluateGates()` returns
`INDICATIVE ONLY` when any input is `UNVERIFIED`, regardless of how attractive
the margins are. There is a test asserting exactly this on a candidate with
excellent numbers.

An `ASSUMPTION` is treated differently from an `UNVERIFIED`, deliberately. "We
will offer free shipping" is a recorded policy choice and work proceeds on it
(`CONDITIONAL`); "we think the supplier charges about EUR 15" is a hole
(`INDICATIVE`). Collapsing the two would either halt all progress or, worse,
reward relabelling holes as choices.

**3. The arithmetic that DTC models usually get wrong is tested.**

- **VAT is not revenue.** A Dutch B2C store shows VAT-inclusive prices. Net
  revenue is `gross / 1.21`. Computing margin against the inclusive price
  overstates it — 75.2% instead of the true 70.0% in the test case.
- **Processors charge on the inclusive total.** Payment fees apply to what the
  customer actually pays, VAT and shipping included.
- **Break-even ROAS depends on which value the pixel sends.** On an ex-VAT basis
  it is exactly `1 / contribution margin` — the identity the brief asks to be
  checked, and there is a test proving it holds. But most integrations send the
  VAT-inclusive order total, which raises the true break-even by the full VAT
  factor. A Dutch store targeting a 2.0x break-even computed ex-VAT actually
  needs 2.42x. Getting this backwards is the difference between scaling into
  profit and scaling into loss.
- **A conversion-rate fall is not a cost increase.** It raises CAC, because the
  same spend buys fewer orders: −20% conversion means CAC ×1.25.
- **Refunds cost more than the goods.** Carriage, pick-and-pack and the fixed
  payment fee are all sunk when an order is refunded.
- **Percentage margin is not enough.** A 90%-margin EUR 6 product leaves too
  little absolute contribution to buy traffic with. There is a gate and a test
  for this.
- **LTV is discounted and decayed**, so it cannot be used to disguise a first
  order that loses money. A test asserts a healthy LTV:CAC coexisting with a
  first-order loss, and that the model reports both.

## Use

```js
import { v, computeOrderEconomics } from './src/economics.js';
import { runStressSuite, evaluateGates, formatSuiteMarkdown } from './src/stress.js';

const spec = {
  pricePerUnitInclVat: v(79, 'ESTIMATE', 'observed competitor band'),
  unitsPerOrder:       v(1.3, 'ESTIMATE'),
  vatRate:             v(0.21, 'FACT', 'Dutch standard btw'),
  unitCost:            v(16, 'UNVERIFIED', 'awaiting supplier quote'),
  // ...the rest of the cost stack
};

const suite = runStressSuite(spec, { plannedCac: 22 });
console.log(formatSuiteMarkdown(suite));
console.log(evaluateGates(suite).verdict);
```

## The margin guard

`margin-guard.js` answers the brief's requirement (§34) that a supplier price
rise must not be allowed to quietly destroy margins. It exists as code because
the failure it prevents is silent: a supplier raises a price 8%, the store keeps
selling, the ad account keeps spending against a break-even ROAS that is no
longer true, and nothing looks wrong until a bank balance does.

Given the current landed cost and a baseline, it escalates through
`OK → WATCH → STOP_PROMOTION → REPRICE → WITHDRAW`, reports how much
contribution the change actually cost, and solves for the price that restores it.

It **advises and never acts**. Automatically hiding products or pausing campaigns
on a cost feed is exactly the automation that does serious financial damage when
the feed is wrong.

One result worth knowing: **the obvious reprice is not enough.** When a cost
rises EUR 6, adding EUR 6 to a VAT-inclusive price leaves you EUR 1.25 per order
short — about a fifth of the increase — because VAT and the percentage payment
fee scale with the price too. The correct price is EUR 86.59, not EUR 85.00.
There is a test asserting the shortcut under-recovers.

## Stress scenarios

Base, CAC +25%, supplier cost +10%, shipping +20%, conversion −20%, refunds +50%,
and a compound shock applying all of them at once. A candidate that only works in
the base case is a hope, not a business.
