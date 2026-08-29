# Marketplace and payments

**Samenvatting (NL).** Ouders betalen één abonnement en krijgen maandelijkse
credits. Elke creditmutatie is een onveranderlijke boeking in een grootboek, niet
een teller die opgehoogd wordt. Het platform houdt een commissie in en betaalt
aanbieders uit op basis van **daadwerkelijk bijgewoonde** lessen. Alle geldstromen
draaien in test-/mockmodus; bedragen staan altijd in centen.

> **Nothing here moves real money.** `PAYMENT_PROVIDER=mock` is the default and
> the Stripe adapter is certified for **test mode only**. See
> [Before you can take real money](#before-you-can-take-real-money).

---

## 1. Plans

Configured as data in `SubscriptionPlan`, not in code, so pricing changes are a
row edit. Seeded plans:

| Slug | Audience | Price / month | Credits / month | Rollover | Commission |
| --- | --- | --- | --- | --- | --- |
| `free-discovery` | Guardian | € 0,00 | 0 | 0 | 15% |
| `family-monthly` | Guardian | € 29,95 | 8 | 4 | 15% |
| `family-monthly-plus` | Guardian | € 49,95 | 18 | 9 | 15% |
| `provider-pro` | Provider | € 19,00 | — | — | 10% |

*Free Discovery* exists so a parent can browse, compare and save favourites
without paying — discovery should not be behind a paywall. *Provider Pro* buys a
lower commission rather than better placement: paying for search ranking on a
children's platform would corrupt the thing parents rely on it for.

`rolloverLimit` is stored and is the intended cap on credits carried into the
next period. **The monthly expiry/rollover job is not implemented in the MVP** —
credits currently persist. This is deliberate scope, and is listed as an open
item in `PRODUCT_DECISIONS.md`.

## 2. The credit ledger

Credits are **not** a counter on the family row. Every movement is a row in
`CreditLedgerEntry`:

| Field | Meaning |
| --- | --- |
| `type` | `MONTHLY_GRANT`, `SIGNUP_BONUS`, `BOOKING_DEDUCTION`, `CANCELLATION_REFUND`, `ADMIN_ADJUSTMENT`, `EXPIRY` |
| `delta` | Signed, never zero (CHECK constraint) |
| `balanceAfter` | Running balance, never negative (CHECK constraint) |
| `idempotencyKey` | Unique per family — makes a retry a no-op |
| `bookingId` / `subscriptionId` | What caused the movement |

Three properties follow, and each is tested:

1. **Immutability.** A trigger raises on UPDATE and DELETE. History cannot be
   rewritten, so a dispute can always be reconstructed.
2. **Idempotency.** A booking charge uses key `booking:<id>:charge` and its
   refund `booking:<id>:refund`. A retried webhook, a double-clicked button or a
   re-run job posts nothing new.
3. **Reconcilability.** `creditBalance()` reads the newest `balanceAfter`;
   `recomputeBalance()` sums every `delta`. A test asserts they agree.

Credits are deducted **in the same transaction as the seat reservation**. There
is no window in which a family is charged for a seat they did not get.

## 3. Money flow

```
Guardian ──── subscription (€) ────► SkillPass
                                       │  keeps commission (default 15%)
                                       └── payout (€) ────► Provider
Guardian ──── credits ────► booking ────► attendance ────► provider earns
```

The MVP settles on **attended** bookings only (`Attendance.status = ATTENDED`).
A seat nobody turned up for produces no payout, which keeps the incentive on
delivery rather than on filling a register. The trade-off — a provider who
prepared for a no-show earns nothing — is a real one and is flagged in
`PRODUCT_DECISIONS.md` as needing a policy decision with providers.

Commission is basis points (`commissionBps`, 1500 = 15%) on the provider row, so
a Provider Pro subscription simply lowers it. Payout arithmetic:

```
grossCents      = Σ listPriceCents of attended bookings in the period
commissionCents = round(grossCents × commissionBps / 10 000)
netCents        = grossCents − commissionCents         -- enforced by a CHECK
```

`Payout` is unique on `(providerId, periodStart, periodEnd)`, so re-running a
payout run returns the existing row rather than paying twice
(`tests/billing.test.ts`).

## 4. Cancellations, refunds and fees

| Situation | Credits | Seat |
| --- | --- | --- |
| Guardian cancels **outside** the window (default 24h) | Fully refunded to the ledger | Freed, waitlist promoted |
| Guardian cancels **inside** the window | **Not** refunded; `lateCancellation = true` | Freed, waitlist promoted |
| Provider cancels | Always fully refunded | Freed |
| Administrator goodwill | `ADMIN_ADJUSTMENT` entry, audited | — |

The window is per activity (`cancellationHours`), shown on the activity page and
stored in the translated cancellation terms.

A late cancellation still frees the seat. Holding a seat hostage would punish
the next family for the first family's timing, which is the wrong person to
punish.

Money refunds (`Refund`) are separate from credit refunds, cannot exceed what
was actually paid, walk the payment through
`SUCCEEDED → PARTIALLY_REFUNDED → REFUNDED`, and are always attributed to the
administrator who issued them in the audit log.

## 5. Webhooks

The webhook endpoint is the only place money state changes, and it is written to
be safe under a provider that retries aggressively:

1. **Raw body first.** `request.text()`, never a re-serialised object — a
   re-serialised body would not match the signature.
2. **Signature before lookup.** An invalid signature is rejected with `400`
   before anything is queried. Stripe's scheme additionally rejects timestamps
   outside a five-minute window, which blocks replay.
3. **Insert-then-act.** The event id is inserted into `WebhookEvent`
   (unique on `provider, eventId`). A duplicate insert fails, the handler
   returns `{"status":"duplicate"}` with `200`, and **no side effect runs**.
4. **Grant once.** Even if step 3 were bypassed, `grantMonthlyCredits` is keyed
   `grant:<subscriptionId>:<periodStart>`, so the credits could still only be
   granted once.

Handled events: `checkout.completed` (activate subscription, grant credits,
notify), `checkout.failed` (mark `PAST_DUE`), `refund.succeeded`, `payout.paid`.
Anything else is recorded and ignored.

Tested in `tests/billing.test.ts` (three identical deliveries → one grant, one
`WebhookEvent` row) and `e2e/safety.spec.ts` (a forged signature gets `400`).

## 6. Testing the payment path without an account

`/checkout/mock` looks like a hosted PSP page. Pressing *Pay now (test)* calls
`/api/checkout/mock/complete`, which signs a webhook **server-side** (the browser
never holds the secret) and posts it to the real webhook endpoint. The
subscription activates, the credits appear in the ledger, and the guardian is
redirected back — through exactly the code that would run in production.

There is also a *Simulate a failed payment* button, because a payment system
that has only ever been exercised on its happy path is a payment system that has
not been exercised.

## 7. Before you can take real money

Blocking items, none of which are code-complete here:

* **Stripe Connect onboarding and KYC** per provider, with payouts held until
  onboarding completes. `payoutAccountRef` is currently a seeded placeholder.
* **VAT**: rate determination, invoices to guardians, self-billing to providers,
  and the marketplace's own VAT position. Not modelled at all.
* **Chargebacks and disputes**, including what happens to credits already spent
  on a payment that is later reversed.
* **Payout scheduling and reconciliation** against the PSP's own reports.
* **Consumer law**: the Dutch/EU right of withdrawal for a subscription, and how
  it interacts with credits already consumed.
* **Accounting export** and a retention policy that satisfies the Dutch seven-year
  bookkeeping obligation — this is why account erasure keeps pseudonymised
  financial rows (see `SECURITY_AND_PRIVACY.md`).

Until those exist, keep `PAYMENT_PROVIDER=mock` or a Stripe **test** key. The
Stripe adapter logs a warning when handed a live key; that warning is not a
substitute for the work above.
