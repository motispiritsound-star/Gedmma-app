# Architecture

## Shape

An npm workspaces monorepo with three packages.

```
packages/shared ──> apps/api
                └─> apps/mobile
```

`@buurklus/shared` holds the rules that the API and the app must agree on: what
counts as a valid Dutch mobile number, how a price splits into net, VAT and
gross, the trade and municipality catalogs, the subscription plans, and the zod
schemas for every request body. When the app validates a form it runs the same schema the
API will run, so the two cannot drift apart.

## Backend

**Fastify + Prisma + PostgreSQL.** Fastify for its plugin scoping and speed;
Prisma because the schema is the documentation and its migrations are
reviewable SQL.

### Layers

```
routes/     HTTP: parse with a shared zod schema, call a service, shape a reply
services/   The business rules. No Fastify types reach in here.
adapters/   SMS and payments, behind interfaces with a mock implementation
lib/        Prisma client, error catalog, crypto, pagination
```

Routes never touch Prisma directly except for trivial lookups. Services never
import Fastify. That split is what lets the same credit-consuming logic be
called from an HTTP route today and from a scheduled renewal job later.

### Money

Every amount is an integer number of cents. Never a float — a rounding error in
a bill destroys trust faster than a bug in a list view. Prices are stored
excluding tax and `applyVat` produces the three lines a Dutch invoice needs.

### Lead credits are a ledger, not a counter

`subscriptions.creditsRemaining` is a running total, but it is never written
without a matching row in `credit_ledger_entries` recording the delta, the
reason, the resulting balance and the quote responsible. When a professional
disputes their usage, the answer is a query rather than a guess.

Spending a credit is a conditional update:

```sql
UPDATE subscriptions SET credits_remaining = credits_remaining - 1
WHERE id = $1 AND credits_remaining > 0
```

If it matches no rows, the transaction aborts and the quote is not created. Two
quotes racing for the last credit cannot both win.

### Quoting is one transaction

Sending a quote checks the job is still open, increments its quote count,
creates the quote, spends the credit and opens the conversation — all inside a
single transaction, with the job guarded by its own conditional update. A job
cannot end up with seven quotes because two professionals pressed send at once.

### Staged lead release

Higher plans see new jobs first. A job published at `T` becomes visible to a
plan with head start `H` at `T + (30 − H)` minutes, so Bedrijf sees it
immediately, Vakman after 15 minutes and ZZP after 30. The ceiling is
deliberately half an hour: long enough that the head start is worth paying for,
short enough that the entry tier is not locked out of a market it anchors.

The rule is enforced on the quote endpoint as well as the feed, so passing a
job id directly does not bypass it.

### What a professional may see

A job carries a street address and, sometimes, a contact number different from
the account's. Neither leaves the API until the customer awards that
professional the job. `JobService.getForPro` strips them and returns a reduced
customer object; `LEAD_SAFE_JOB_SELECT` is the whitelist everything else is
built from. This is enforced at the query layer rather than in the app, because
an app-side filter is a suggestion.

### Errors carry a code and a translated message

```json
{ "error": { "code": "no_credits_remaining", "message": "Vous avez utilisé…" } }
```

The code is stable and the message is already in the caller's language, chosen
from `X-Buurklus-Locale` or `Accept-Language`. An app that meets a code it does
not recognise still shows the user something useful, and a new error does not
require an app release to be legible.

### Authentication

Dutch mobile number plus a six-digit SMS code. Codes are stored as SHA-256 hashes with an
expiry and an attempt counter, and consumed with a conditional update so the
same code cannot be redeemed twice. Sign-in returns a short-lived JWT and an
opaque refresh token; only the refresh token's hash is stored, and presenting
one rotates it and revokes the old.

Abuse controls sit in the service, not only in the rate-limit plugin: a
sixty-second resend cooldown and a cap of five codes per number per hour. SMS
costs money, and the number being pumped belongs to a real person.

## Mobile

**Expo Router** for file-based navigation, **TanStack Query** for server state,
**Zustand** for the two pieces of client state that outlive a screen (the
session and the posting draft), **i18next** for translation.

### Two languages, one bundle each

Dutch and English ship as separate translation bundles with identical keys,
checked by a test — a missing key would otherwise strand one screen in Dutch.
Neither language is right-to-left, so the app carries no direction-switching
machinery. The website's stylesheet still uses CSS logical properties
(`margin-inline-start` rather than `margin-left`), which costs nothing and means
a right-to-left language could be added later without redoing the layout.

### Tokens

Access and refresh tokens live in `expo-secure-store`, which is the Keychain on
iOS and the Keystore on Android. `useApi` retries once through a refresh on a
401, so an expired token is invisible to every screen.

## Testing

77 tests.

- **43 unit tests** over the domain rules in `packages/shared`: phone
  normalisation, VAT arithmetic, KvK and IBAN validation, catalog integrity,
  the validation schemas.
- **36 integration tests** over the API, against a real PostgreSQL database.
  They drive the HTTP surface with `app.inject` and assert on the database
  afterwards. They cover the whole flow — post, quote, award, complete, review
  — and the rules that cost money: credits spent and refunded, the quote cap,
  staged release, address hiding, plan limits, and callback idempotency.
- **16 unit tests** over the app's plain-TypeScript parts: translation parity,
  the posting draft, the formatters.
- **16 tests** over the rendered website: one `h1` per page, `hreflang` for
  every language, no unresolved placeholders, and prices that match what
  `@buurklus/shared` defines.

Mocks are avoided where the database is the thing being tested. That a business
cannot register two accounts under one KvK number is a unique index; asserting
it against a mock would assert nothing.

## Deliberate gaps

- **Photo upload.** The wizard collects local file URIs. An upload step to S3
  or Cloudflare R2, returning hosted URLs, goes in front of job creation.
- **Push delivery.** Notifications are written to the database and the app
  reads them; `NotificationService.push` is where Expo Push attaches.
- **Scheduled jobs.** Expiring old jobs, renewing subscriptions and sweeping
  used OTP challenges need a scheduler. The service methods they will call
  already exist.
- **Admin tooling.** Verifying a professional's documents is a status column
  today with no interface behind it.
- **Mollie payments.** The adapter implements checkout and callback
  authentication against Mollie's documented API but has never run against the
  live gateway; `PAYMENT_PROVIDER=mock` is the default until it has. Note that
  Mollie does not sign its webhook body — it sends a payment id and expects the
  server to fetch the authoritative status — so the adapter authenticates the
  callback with a secret carried in the webhook URL, and a production
  deployment should also re-read the payment from the API before granting
  credits.
