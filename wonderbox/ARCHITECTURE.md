# Architecture

## The shape of the problem

WonderBox has two users who never share a screen. A parent buys, sets up and
looks back; a child listens and does. Everything below follows from that split.

The parent side is an ordinary transactional web application and is built like
one: server-rendered pages, forms that work without JavaScript, a relational
database with real constraints.

The child side is a device that will one day be a box on a shelf with four
buttons and no display, which means it must assume it is offline, assume the
screen is face down, and never lose a child's place. Today that device is a
browser tab; the code does not know the difference, because both speak the same
protocol.

## Layers

```
  app/            routes: pages, server actions, API handlers
    │             — no business logic, no direct SQL
    ▼
  server/         domain services: orders, subscriptions, inventory,
    │             activation, content, progress, privacy, webhooks
    │             — the only place business rules live
    ▼
  lib/            env, db, money, i18n, auth, audit, provider ports
    │             — no knowledge of routes
    ▼
  prisma/         schema, seed, authored box content

  packages/hardware-protocol/
                  the companion contract; imported by server, PWA and emulator
```

Two rules keep this honest:

**Routes never contain rules.** A page or an action validates input with Zod,
resolves who is asking, calls exactly one service, and renders. If a route
starts to branch on business state, that branch belongs in `server/`.

**Services never know about HTTP.** They take plain arguments and throw typed
`DomainError`s. That is why the same `activateBox()` backs the parent form, the
emulator's `activateBox` command and the test suite — three callers, one rule.

### Where the important decisions actually live

| Decision | One place |
| --- | --- |
| May a child hear this? | `publishedChapterVersion()` in `server/content.ts` |
| Is there stock? | `reserveStock()` in `server/inventory.ts` |
| Is this code theirs? | `activateBox()` in `server/activation.ts` |
| Has this webhook been seen? | `claim()` in `server/webhooks.ts` |
| Which locale is served? | `tryResolve()` in `lib/i18n/localised.ts` |
| What may this role do? | `PERMISSIONS` in `lib/auth/roles.ts` |
| How much will we need? | `demandForecast()` in `server/purchasing.ts` |
| Has this job already run? | `runJob()` in `server/jobs.ts` |
| Where is this child now? | `CompanionSession` in the protocol package |

Each has a test file named after it. If a claim in this document is true, that
is where it is enforced.

## Data model

Thirty tables, grouped by what they are for.

**Identity and family.** `User`, `Session`, `Family`, `ChildProfile`. A family
is the ownership unit — boxes, orders and progress belong to a family, never to
one adult, because two parents share a household and a child has neither an
account nor a password. `ChildProfile` holds a birth *year*, not a date: the
product needs an age band, and more precision than that is data we would be
holding for no reason.

**Catalogue.** `Theme`, `BoxProduct`, `BoxTranslation`, `KitComponent`.
Marketing copy lives in an explicit `BoxTranslation` table because
merchandisers edit it per market and it wants a uniqueness constraint per
locale. Content copy — story text, hints, experiment steps — is a JSON locale
map instead, because it is edited as a whole in the studio and the number of
rows would otherwise explode.

**Inventory.** `InventoryItem`, `InventoryBatch`, `StockReservation`. Stock
arrives in batches so a recall can be scoped to a lot, and is spent FIFO.

**Commerce.** `SubscriptionPlan`, `Subscription`, `Order`, `OrderItem`,
`Address`, `Invoice`, `Shipment`, `WebhookEvent`.

**Activation.** `ActivationCode`, `ActivatedBox`. Only a peppered HMAC of a
code is stored, plus its last four characters for support conversations.

**Content.** `LearningJourney`, `Chapter`, `DialogueNode`, `DialogueChoice`,
`AudioAsset`, `Experiment`, `SafetyInstruction`, `ContentVersion`, `Approval`.

**Progress.** `ProgressEvent` (append-only, unique on `clientEventId`),
`ParentSummary`.

**Governance.** `SupportCase`, `ConsentRecord`, `AuditLog`.

### Content as a graph

A chapter is a directed graph of authored utterances:

```
  intro ──"ready"──▶ question ──"right"───▶ confirm ──▶ safety ──▶ build ──▶ …
                        │  ▲
              "unsure"  │  │ "again" (repeat)  ·  "slower" (repeat, slower)
                        ▼  │
                       hint ┘
```

Three properties make this workable for a screen-free device:

- **Every edge is authored.** There is no "generate a reply" node. A wrong
  answer routes to a hint that rejoins the main line — being wrong is a
  different path, never a failure state.
- **`isRepeat` and `isSlower` are edges, not UI.** The two buttons a child uses
  most are part of the graph, so the emulator, the PWA and future firmware all
  handle them identically.
- **A pause is data.** `pauseSeconds` on a node is dead air while a child ties a
  string to a chair. The session parks in `awaitingChoice` for the duration, so
  a child who is ready can press on and a child who is busy is carried through.

## Decisions worth arguing about

### Money in integer minor units

`Money` is `{ cents: number; currency }` and `money()` throws on a fraction.
Rounding happens in exactly one function, `applyPercentage`.

Dutch consumer prices are quoted *including* VAT, so tax is extracted from a
gross total (`gross × 21 / 121`) rather than added on top. Getting this backwards
is the single most common bug in EU commerce code, so it is stated once, in
`server/pricing.ts`, and tested.

### Stock reservation by conditional UPDATE

```sql
UPDATE "InventoryBatch"
   SET "quantityReserved" = "quantityReserved" + $qty
 WHERE "id" = $id AND "quantityOnHand" - "quantityReserved" >= $qty
```

Postgres re-evaluates the `WHERE` clause after taking the row lock, so two
transactions racing for the last kit serialise on the row and exactly one wins.
No `SERIALIZABLE`, no advisory locks, no optimistic retry loop.

The alternative — read the level, decide, write — is wrong under concurrency in
a way that only shows up on the day a box goes viral. The test races twelve
checkouts against five units and asserts exactly five succeed.

**Trade-off:** the allocator re-reads a batch when another transaction beats it,
bounded at eight attempts per batch. Under pathological contention it moves on
to the next batch rather than spinning.

### Reserve at checkout, commit at despatch

Stock is reserved when the order is placed — before money moves — and only
decremented when a shipping label is created. A paid order that cannot be
fulfilled is worse than a lost sale.

### Two idempotency mechanisms, deliberately different

`Order.idempotencyKey` is unique, so a double-clicked checkout returns the same
order rather than charging twice. `WebhookEvent(provider, externalId)` is
unique, so a redelivered provider event is a no-op. `ProgressEvent.clientEventId`
is unique, so a device can replay a week of offline events as often as it likes.

Each is a database constraint rather than an application check, because an
application check has a race window and a unique index does not.

### Session tokens hashed, activation codes peppered

The session cookie carries 256 random bits; the database stores only its
SHA-256. A dump of the sessions table hands out nothing.

Activation codes are HMAC-ed with a server-side pepper, so an operator with
database access cannot read a live code off a screen and claim someone else's
box. The trade-off is real: rotating `ACTIVATION_CODE_PEPPER` invalidates every
printed code.

### Roles as a matrix, not a hierarchy

`PERMISSIONS` maps a permission to the roles that hold it. It is deliberately
flat: there is no "editor is a kind of admin" inheritance, because the one rule
that matters is a *negative* one — a content editor must have no permission
that touches a family, an address or an order — and inheritance makes negative
rules impossible to state.

### Provider ports with mocks that are actually used

Payments, shipping, storage and AI drafting are interfaces. The mock
implementations are what `npm run dev` and the whole test suite run against,
which is what stops the abstraction rotting: if the port stopped matching what
the application needs, the mocks would break first.

The mocks behave like real providers in the ways that matter — idempotency
keys, asynchronous confirmation, signed webhooks with a timestamped HMAC — and
not in the ways that do not (no network, no latency).

### One locale-resolution function

`tryResolve()` walks `nl → en` or `en → nl` and reports which locale it actually
served. `chapterLoaded` carries `servedLocale` per node, so the companion can
tell a child "this line isn't translated yet" instead of going silent. One
implementation, one test, no `?? 'en'` scattered through the codebase.

### Traversal shared between device and server

`CompanionSession` lives in the protocol package, not in the React component.
The PWA, the emulator and eventually the firmware compile the same file, which
is why offline play and online play agree about where a child ended up.

### App Router, server-first

Pages are server components; mutations are server actions or form posts that
work without JavaScript. The only client components are the two that genuinely
need the browser: the companion player (audio, offline queue, Cache API) and
the device emulator.

Guards come in two flavours on purpose. `requirePermission()` throws — right
for an API route, which wants a 401. `requirePermissionPage()` redirects — right
for a page, because someone following a bookmark while logged out should land on
a login form, not a stack trace.

## Offline

The companion assumes the network is a bonus.

1. Chapter payloads are cached in `localStorage` on load; a reload with no
   network serves the cached graph.
2. Narration is fetched through signed storage URLs, which the service worker
   caches cache-first. **Offline opslaan** puts a whole chapter's audio in the
   Cache API up front.
3. Every state change appends to a queue, persisted after each transition.
4. On reconnect the queue is posted whole. Only ids the server confirms are
   dropped, so a half-delivered batch is retried rather than lost.

Nothing that touches money, addresses or progress is ever cached. A stale order
page is worse than no order page.

## Testing

Integration tests run against a real PostgreSQL database. The interesting
claims here — a reservation that survives concurrency, a unique index that makes
replay idempotent — are claims *about the database*. Mocking Prisma would test
the mock.

```
packages/hardware-protocol/test/   protocol codec, branching, offline queue
apps/web/tests/                    services against a real database
apps/web/e2e/                      full journey + axe, in a real browser
```

## Deliberate limits

- **Single region, single database.** No read replicas, no sharding.
- **No queue, on purpose.** The scheduled work is a registry of idempotent
  async functions behind one authenticated endpoint, so any cron drives it.
  That is the right size for five jobs and a few hundred subscriptions. At ten
  thousand it wants a real runner with retries and backoff — the seam is
  `runJob()`, which already records every attempt.
- **No email.** Order confirmations are modelled, not sent.
- **No CDN for audio.** Signed application routes, which is correct for privacy
  and wrong for cost at scale. `ObjectStorage.sign()` is where a presigned CDN
  URL would go.
- **Content is edited as whole chapters.** Fine for four-chapter boxes; a
  hundred-node graph would want per-node versioning.
