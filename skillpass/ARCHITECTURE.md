# Architecture

**Samenvatting (NL).** SkillPass is een modulaire monoliet: één Next.js-applicatie
met scherp gescheiden domeinmodules boven PostgreSQL. Alle externe diensten
(betalingen, e-mail, opslag, kaarten) zitten achter poorten met een offline
implementatie, zodat de hele applicatie zonder externe accounts draait. Regels
die niet mogen breken — geen overboeking van plekken, een onveranderlijk
creditgrootboek, een append-only auditlog — zijn afgedwongen in de database,
niet alleen in code.

---

## 1. Shape of the system

A **modular monolith**. One deployable Next.js application, one PostgreSQL
database, and domain modules that only talk to each other through exported
functions. This is the right size for an MVP: it keeps a booking, its credit
deduction and its seat reservation inside a single database transaction, which
a service split would have made an distributed-transaction problem on day one.

```
            ┌──────────────────────────── browser ────────────────────────────┐
            │  /nl/… and /en/… pages (React Server Components + server actions) │
            └───────────────┬──────────────────────────────┬──────────────────┘
                            │                              │
                  server actions                     /api/… routes
                            │                              │
            ┌───────────────▼──────────────────────────────▼──────────────────┐
            │                         src/modules/*                            │
            │  auth · family · catalog · booking · billing · reviews ·         │
            │  notifications · safeguarding · admin                            │
            └───────────────┬──────────────────────────────┬──────────────────┘
                            │                              │
                ┌───────────▼──────────┐        ┌──────────▼───────────┐
                │  src/lib (db, auth,  │        │  src/lib/adapters    │
                │  rbac, audit, i18n,  │        │  payments · email ·  │
                │  crypto, rate limit) │        │  storage · geo       │
                └───────────┬──────────┘        └──────────┬───────────┘
                            │                              │
                     ┌──────▼──────┐              mock ◄───┴───► real
                     │ PostgreSQL  │
                     └─────────────┘
```

### Layering rules

| Layer | May import | Must never |
| --- | --- | --- |
| `app/` (pages, routes, actions) | `modules/`, `lib/`, `components/` | Query Prisma directly for domain logic |
| `modules/` | `lib/`, other modules' public functions | Import from `app/` |
| `lib/` | Node, Prisma, adapters | Import from `modules/` or `app/` |
| `lib/adapters/` | Node only | Know anything about SkillPass domain types |

The one deliberate exception: pages read Prisma directly for simple *display*
queries (listing a provider's own activities, for instance). Anything that
writes, or that carries an authorisation decision, goes through a module.

## 2. Authorisation is a choke point, not a sprinkle

Every provider-scoped operation begins with `requireProviderAccess(user,
providerId, permission)` (`src/lib/auth/rbac.ts`). It resolves the caller's
`ProviderStaff` row, and refuses when there is none — with the *same* error as
an unknown provider, so tenant membership cannot be probed by guessing ids.

Two further rules make isolation hold even when a caller supplies valid-looking
foreign ids:

* Every write re-checks ownership of the referenced rows (an activity's venue
  must belong to the same provider; a session must belong to an activity of that
  provider). Passing another tenant's `venueId` is refused, not silently used.
* Reads are always filtered by the derived `providerId`, never by one taken
  from the request. `sessionRoster` queries `where: { id, activity: { providerId } }`.

Guardian-side access works the same way: `requireFamily(user)` derives the
family from the session, and `requireChildInFamily` re-checks every child id.

Tests: `tests/catalog.test.ts › provider tenant isolation`,
`e2e/provider.spec.ts › cannot open another provider's session roster`.

## 3. Data model

37 tables. The parts worth explaining:

**Age bands instead of birth dates.** `ChildProfile` stores `AgeBand`
(`AGE_6_8` … `AGE_15_17`) and a nickname. There is no date-of-birth column
anywhere — the smallest amount of data that still lets a parent filter for
suitable activities. Suitability is `min ≤ child ≤ max` over an ordered band
list (`src/lib/i18n/labels.ts`).

**Capacity is its own row.** `Session` holds the time; `Capacity` holds
`totalSeats` / `seatsTaken`, with a CHECK constraint
`0 ≤ seatsTaken ≤ totalSeats`. Splitting it makes seat reservation a single
row-level UPDATE (see §4).

**The credit ledger is append-only.** `CreditLedgerEntry` rows carry a signed
`delta` and the `balanceAfter`. A PL/pgSQL trigger raises on any UPDATE or
DELETE. Balance is read from the newest row and can always be re-derived by
summing deltas — a test asserts the two agree. A unique
`(familyId, idempotencyKey)` index makes a retried operation a no-op instead of
a double charge.

**Bilingual content is normalised.** `ActivityTranslation` is unique on
`(activityId, locale)`. Publication requires both `NL` and `EN`.

**Money is minor units.** Every amount is an `Int` of cents plus a 3-letter
currency code. No floats, ever. `Payout` carries a CHECK that
`netCents = grossCents − commissionCents`.

**The audit log is append-only too**, by the same trigger mechanism.

Invariants live in `prisma/migrations/20260829104400_domain_constraints/`.
Putting them in the database means a future admin script, a migration, or a
careless refactor cannot quietly violate them.

## 4. Concurrency: how a seat is reserved

The interesting race is two parents booking the last seat at the same moment.

```sql
UPDATE "Capacity"
   SET "seatsTaken" = "seatsTaken" + 1
 WHERE "sessionId" = $1
   AND "seatsTaken" < "totalSeats"
```

Under PostgreSQL's default READ COMMITTED isolation, the second transaction
blocks on the row lock, then **re-evaluates its WHERE clause against the
updated row**. It matches zero rows and the booking is rejected with
`SessionFullError`. No advisory locks, no `SELECT … FOR UPDATE`, no retry loop.

The whole booking runs in one interactive transaction: reserve seat → check and
deduct credits → create booking → create attendance → post ledger entry. Any
failure rolls back all of it, so a failed credit check cannot leave a phantom
reservation. `tests/booking.test.ts` fires five concurrent bookings at a
one-seat session and asserts exactly one succeeds and `seatsTaken = 1`.

Waitlist promotion reuses the same primitive: it walks the queue in order,
tries to reserve a seat for each candidate, and releases it again if that
family cannot afford the activity — so an under-funded family does not block
the queue but also does not lose its place.

## 5. Adapters

Four ports, each with an offline default (`src/lib/adapters/`):

```ts
interface PaymentProvider {
  createCheckout(request): Promise<CheckoutResult>;
  createRefund(request): Promise<RefundResult>;
  createPayout(request): Promise<PayoutResult>;
  parseWebhook(rawBody, signature): PaymentWebhookEvent;  // throws when invalid
}
```

The mock payment provider is not a stub: it issues external references, redirects
to a hosted-looking page, and posts **HMAC-signed** webhooks to the application's
own endpoint. The production code path — read raw body, verify signature, insert
into `WebhookEvent`, act once — is what actually runs in development and in
tests. The Stripe adapter implements the same port against Stripe's REST API
with `fetch`, including its documented `Stripe-Signature` scheme with a
five-minute replay tolerance, and carries no SDK dependency.

Swapping an adapter is an environment variable. Nothing in `modules/` mentions
Stripe, S3, SMTP or Mapbox.

## 6. Internationalisation

* Routing: `src/middleware.ts` negotiates `Accept-Language` and redirects to
  `/nl` or `/en`. Every page reads its locale from the route segment.
* Interface: a flat key/value dictionary per locale with a typed `MessageKey`,
  so a missing key is a type error rather than a blank label. `translate()`
  interpolates `{placeholders}` and leaves unknown ones visible instead of
  printing `undefined`.
* Content: per-row translations, with fallback to the first available locale on
  read and a hard requirement of both locales on publish.
* Formatting: `Intl.NumberFormat` / `Intl.DateTimeFormat` at the render edge
  only. Amounts are never formatted inside domain code.

## 7. Testing strategy

| Layer | Tool | What it proves |
| --- | --- | --- |
| Domain | Vitest against a **real** PostgreSQL | Business rules, constraints, triggers, concurrency. No mocked database — a mocked DB cannot prove a CHECK constraint holds |
| Seed | Vitest | The demo dataset really contains 12 providers, 32 bilingual activities, ≥10 categories and the documented accounts |
| Build | Vitest | `next build` succeeds — type errors and server/client boundary mistakes fail the suite, not the deploy |
| Journeys | Playwright against a production build | Register → verify → child → subscribe → book → check in → review; provider isolation; admin verification; safety guarantees |

Integration tests truncate every table before each test and run files serially,
so each test starts from an empty database and states its own fixture. The one
exception, `tests/seed.test.ts`, opts out of truncation and asserts against the
real seed.

## 8. What would change at scale

* **Rate limiting** moves from an in-process map to Redis behind the same
  `consumeRateLimit` signature.
* **Search** moves from Prisma filters + in-process distance sorting to
  PostGIS or a search index once the catalogue outgrows one page of results per
  city.
* **Notifications** move to a queue; the `notify()` signature already isolates
  callers from delivery.
* **Modules** are the natural seams if anything ever needs extraction —
  `billing` and `safeguarding` first, since they have the least chatty
  relationships with the rest.
