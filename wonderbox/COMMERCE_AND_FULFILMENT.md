# Commerce and fulfilment

How money, stock and parcels move, and why each mechanism is the one it is.

---

## Money

**Every amount is an integer number of minor units.** `Money` is
`{ cents: number; currency: 'EUR' }` and `money()` throws a `TypeError` on a
fraction. No float touches a price, a total, a refund or an invoice.

```ts
money(3495)                    // €34.95
add(money(1000), money(2000))  // €30.00 — not 29.999999999999996
multiply(money(3495), 3)       // quantities must be whole numbers
```

### VAT is extracted, not added

Dutch consumer prices are quoted **including** VAT. `BoxProduct.priceCents` is
the gross price a parent pays, so the tax shown on an invoice is the portion
*inside* that total:

```
tax = round(gross × 21 / 121)
```

€39.90 gross → €6.92 VAT, not €8.38. Adding 21% on top of a gross price is the
most common bug in EU commerce code, so it lives in exactly one function,
`priceOrder()` in `src/server/pricing.ts`, and has a test that names the
arithmetic.

All rounding goes through `applyPercentage()`, half-up, in one place.

---

## Stock

### The model

```
InventoryItem ──1:n──▶ InventoryBatch   (quantityOnHand, quantityReserved)
      ▲
      └── KitComponent ──▶ BoxProduct   (how many of this part per box)

available = Σ(quantityOnHand − quantityReserved)
sellable(box) = min over components of ⌊available / perBox⌋
```

Batches exist so a recall can be scoped to a lot and so stock leaves FIFO.

### Reserve at checkout, commit at despatch

```
  place order ──▶ RESERVED ──create label──▶ COMMITTED ──▶ (parcel gone)
                     │                          │
                cancel/refund              parcel returned
                     ▼                          ▼
                  RELEASED                   on hand + n
```

Stock is held from the moment an order is placed — **before** money moves — and
only decremented when a shipping label is created. A paid order that cannot be
fulfilled is worse than a lost sale.

### The concurrency guarantee

`available` never goes negative, however many checkouts land at once. That
comes from a conditional UPDATE, not from a read-then-write:

```sql
UPDATE "InventoryBatch"
   SET "quantityReserved" = "quantityReserved" + $qty
 WHERE "id" = $id
   AND "quantityOnHand" - "quantityReserved" >= $qty
```

Postgres re-evaluates the `WHERE` clause *after* taking the row lock, so two
transactions racing for the last kit serialise on the row and exactly one
matches. The loser matches zero rows, re-reads and tries the next batch.

Why not the alternatives:

- **Read, decide, write** has a race window between the read and the write. It
  is correct in development and wrong on the day a box goes viral.
- **`SERIALIZABLE`** works but turns contention into serialisation failures the
  application must retry, which is more machinery for the same guarantee.
- **Advisory locks** serialise the whole SKU rather than the batch, and are easy
  to leak.

Reservation is all-or-nothing across every line of an order. A short line throws
`OutOfStockError`, which rolls the caller's transaction back and releases
everything reserved so far.

`tests/inventory-concurrency.test.ts` races twelve simultaneous checkouts
against five units of stock and asserts exactly five succeed, seven fail with
`OutOfStockError`, and `available` lands on zero — against a real PostgreSQL
instance, because that is where the guarantee actually lives.

---

## Unit economics

The question that decides whether a box gets made: at the catalogue price, what
is left after everything it actually costs to put in a child's hands?

`/ops/costing` answers it. `src/server/costing.ts` does the arithmetic, and it
is written around three traps.

**VAT.** The catalogue price is gross. Revenue is `gross × 100 / 121`, because
the VAT belongs to the tax office and was never yours. Comparing a gross price
to a net cost overstates margin by about a fifth — enough to make a bad box look
fine.

**Purchase cost is net too.** Input VAT is reclaimed, so counting it as a cost
punishes the same money twice.

**One-off costs are real costs.** EN 71 testing, the technical file and the card
artwork are spent before the first box ships. Spread over a run they are often
larger than the cheap electronics inside, and a parts-only calculation cannot
see them at all. `BoxProduct` carries `certificationCostCents`,
`artworkCostCents` and `amortiseOverUnits` for exactly this.

The seeded boxes, at the prices on the catalogue page:

| Box | Retail incl. VAT | Net | Parts | Pack | Cert + artwork | Margin |
| --- | --- | --- | --- | --- | --- | --- |
| Bouw een Alarm | €39.95 | €33.02 | €5.71 | €1.50 | €5.07 | €20.74 · 63% |
| Junior Ruimteverkenner | €34.95 | €28.88 | €7.45 | €1.50 | €2.35 | €17.58 · 61% |
| Natuurdetective | €29.95 | €24.75 | €6.03 | €1.50 | €2.95 | €14.27 · 58% |

The alarm box is the most profitable despite the most expensive certification,
because small electronics are cheap. The nature box is the thinnest: plaster and
optics are not, and it carries the lowest retail price. A test asserts the case
that matters — a box whose parts look fine and whose certification, spread over
a short run, puts the whole thing under water.

### Purchase planning

`purchasePlan()` turns a production run into a shopping list: what each box
needs, minus what is free on the shelf, rounded up to each supplier's minimum
order quantity. Reserved stock is excluded — it is spoken for by orders that
have not shipped, and counting it would have you pack a box twice.

It reports three numbers an operator acts on: the purchase value, the slowest
lead time (which is the date you can start packing), and how much you are
spending on units you did not need because of minimum order quantities.

Sourcing data lives in `prisma/content/procurement.ts`, keyed by SKU and kept
apart from the box content: a mailer box is shared between products, suppliers
change without the story changing, and an editor writing a chapter has no
business editing purchase prices.

---

## Orders

```
PENDING_PAYMENT ──paid──▶ PAID ──label──▶ FULFILLING ──in transit──▶ SHIPPED ──▶ DELIVERED
       │                    │                                                       │
    cancel                cancel                                                  refund
       ▼                    ▼                                                       ▼
   CANCELLED            CANCELLED                                                REFUNDED
```

Placing an order prices it, reserves the stock, and asks the payment provider
for an intent — in that order.

### Double-click protection

`Order.idempotencyKey` is unique. Submitting the same checkout form twice
returns the *same* order with `reused: true`, and reserves stock once. The key
is also passed to the payment provider, so the provider does not create a second
intent either.

Subscription renewals use a period-scoped key,
`renewal:<subscriptionId>:<periodEnd>`, so a job that crashes after placing an
order and is retried against the same period reuses it rather than shipping two
boxes. Tested.

### Cancellation and refunds

- **Cancel** (before despatch) releases the reservation and returns the
  activation code to the unassigned pool.
- **Refund** calls the provider first, then records it. A *full* refund releases
  any outstanding reservation, restocks anything already committed, revokes the
  activation code and marks the invoice `REFUNDED`. A partial refund leaves the
  order status alone.
- A refund larger than what remains refundable is refused, as is a refund of
  zero or less.
- A shipped order cannot be cancelled, only refunded.

---

## Subscriptions

A subscription is a promise to ship one box per period. Three controls sit on
top of it, and they are deliberately different things:

| Control | Effect |
| --- | --- |
| **Skip** | Drops exactly one shipment. The period still advances, nothing is billed for it, the next box is unchanged, and the flag consumes itself. |
| **Pause** | A hard stop until a date. No renewals run. Resuming starts a fresh period *today* rather than back-billing the paused months. |
| **Cancel** | Stops at the end of the paid period. Nothing is clawed back. |

`previewRenewal()` answers "what happens next and how much" without changing
anything: the date, the amount, the next box, the period after that, and a
reason (`ok`, `skipped`, `paused`, `cancelled`, `pastDue`). It is a pure read —
tested to make sure it stays one.

`runRenewal()` is the unit of work. It is safe to run twice because it advances
the period: a second call finds the subscription no longer due. `dueSubscriptions()`
is the work list; the ops console can drive it by hand during an incident.

Renewal dates clamp: a subscription started on 31 January renews on 28 February,
then 31 March, then 30 April.

---

## Payments

Nothing in the application imports Stripe. It imports `PaymentProvider`:

```ts
interface PaymentProvider {
  createCustomer(input): Promise<PaymentCustomer>;
  createIntent(input): Promise<PaymentIntent>;   // honours idempotencyKey
  getIntent(ref): Promise<PaymentIntent | null>;
  confirmIntent(ref, outcome?): Promise<PaymentIntent>;
  refund(input): Promise<RefundResult>;
  parseWebhook(rawBody, signature): Promise<PaymentWebhookEvent | null>;
}
```

**`MockPaymentProvider`** (default) keeps intents in memory and behaves like a
real provider in the ways that matter: idempotency keys return the same intent,
confirmation is a separate step, and webhooks are signed with a timestamped
HMAC in Stripe's `t=…,v1=…` format. `/checkout/mock/<intent>` is its hosted
page, so the whole "customer leaves the site and comes back" flow can be walked
without an account.

**`StripePaymentProvider`** talks to the REST API directly — the surface needed
is four endpoints, and the SDK would be the largest dependency in the tree. Set
`PAYMENT_PROVIDER=stripe` with a test key.

Because the mock is what development and the entire test suite run against, the
seam cannot rot: if the port stopped matching what the application needs, the
mocks would break first.

---

## Fulfilment

```ts
interface ShippingProvider {
  quote(input): Promise<ShippingRate>;
  createLabel(input): Promise<ShippingLabel>;   // honours idempotencyKey
  cancelLabel(providerRef): Promise<void>;
  parseWebhook(rawBody, signature): Promise<ShipmentUpdate | null>;
}
```

Only the mock ships in the MVP. Labels are deterministic per idempotency key
(`label:<orderId>`), so a retried fulfilment run does not mint a second parcel.
Label PDFs go to private object storage, never a public URL.

In mock mode an operator advances shipment status by hand at `/ops/shipments`;
in production the carrier's webhooks do it. Both go through
`applyShipmentStatus()`, so the paths cannot diverge.

A `returned` parcel restocks whatever was committed for that order.

---

## Webhook idempotency

Providers retry — on timeouts, on 500s, and sometimes for no reason at all.
Two mechanisms, both deliberate:

1. **`WebhookEvent(provider, externalId)` is unique.** The insert *is* the lock.
   A second delivery fails to insert and is answered `200 { outcome: "duplicate" }`
   without touching an order.
2. **The handlers are individually idempotent**, in case the same event arrives
   under two ids. `markOrderPaid()` returns early if the order is not
   `PENDING_PAYMENT`; the invoice is created only if one does not exist.

A duplicate answers **200**, not 409. Replying with an error to a replay of an
event that was already handled correctly guarantees an infinite retry loop.

An unsigned or wrongly signed body is rejected with 400 before anything is
written. An unknown event type is recorded as `ignored` and answered 200 —
providers add event types, and that must not page anyone.

`tests/webhooks.test.ts` fires the same signed body three times and asserts one
order transition, one invoice, one row.

---

## Activation codes as inventory

Codes are minted into an unassigned pool per box product, bound to a family when
their order is **paid**, and claimed by the parent from the printed lid.

```
UNASSIGNED ──order paid──▶ ASSIGNED ──parent enters code──▶ ACTIVATED
     ▲                        │
     └──── order cancelled ───┘                    full refund ──▶ REVOKED
```

Assignment uses a conditional update, so two concurrent fulfilment runs cannot
hand the same physical code to two families. Only a peppered HMAC of a code is
stored, plus its last four characters for support conversations — `/ops/codes`
shows counts by state and never a code.

The e2e suite asserts that no full code pattern appears anywhere on that page.

---

## Operations console

| Page | What it does |
| --- | --- |
| `/ops/inventory` | Levels per SKU, boxes buildable, receive a batch |
| `/ops/costing` | Margin per box, and the purchase plan for a run |
| `/ops/orders` | Fulfilment queue: create a label, cancel, refund |
| `/ops/shipments` | Advance carrier status (mock mode) |
| `/ops/codes` | Counts by state; mint a print run |
| `/ops/renewals` | Subscriptions past their period; run one by hand |
| `/ops/support` | Cases, safety first |

Ops holds `address.read` because packing a parcel requires an address — and
`address.write`, `family.read` and every content permission are withheld. See
`SECURITY_AND_PRIVACY.md`.

---

## Known limits

- **No tax engine.** One rate, one country. Cross-border VAT (OSS thresholds,
  reverse charge) is not modelled.
- **No dunning.** A failed payment marks the subscription `PAST_DUE` and stops.
  No retry ladder, no email.
- **No partial shipment.** One order, one parcel.
- **No proration.** Plan changes are not implemented; a parent cancels and
  resubscribes.
- **No real carrier.** The port exists; the adapter does not.
- **Sourcing figures are placeholders.** Realistic Dutch wholesale for a run in
  the hundreds, but they are not quotes. Replace them before ordering anything.
- **No CE conformity work.** The cost of certification is modelled; the
  certification is not done. Nothing here substitutes for a testing lab.
- **Renewals are not scheduled.** `runRenewal()` and `dueSubscriptions()` are
  the seam a cron or job runner would call.
