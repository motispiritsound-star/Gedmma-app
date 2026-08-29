# WonderBox

Monthly physical learning kits for children aged 5–12, guided by a screen-free
audio companion.

Each box holds materials, experiment cards and a themed story. A child
activates it with a short code printed inside the lid, and from that moment the
companion does the talking: it narrates, asks questions, offers hints, and — the
part that matters most — **stops and waits** while a child actually does the
thing. The parent sets up on a screen. The child never needs one.

This repository is the commerce and content platform plus a **software
simulator** for the audio companion. No hardware is manufactured here. What is
here is the contract the hardware will have to speak
([`HARDWARE_PROTOCOL.md`](HARDWARE_PROTOCOL.md)), a browser emulator that speaks
it today, and a PWA companion that a family can use on a phone or tablet in the
meantime.

```
   parent                          child                       operations
   ──────                          ─────                       ──────────
   browse → subscribe → pay        code / QR / (NFC)           stock → label
        ↓                               ↓                           ↓
   box ships ─────────────────────→ activate ──→ listen, answer, do
        ↑                               ↓
   "what we did" summary ←──────── progress (offline-safe)
```

---

## Getting it running

```bash
git clone <this repository>
cd wonderbox

# 1. A PostgreSQL 14+ database. Either use your own, or:
docker compose up -d db

# 2. Environment. Every value has a working local default.
cp .env.example apps/web/.env      # or: node scripts/env-init.mjs

# 3. Install, create the schema, and seed three complete boxes.
npm install
npm run db:generate
npm run db:push
npm run db:seed

# 4. Go.
npm run dev                        # http://localhost:3000
```

Everything runs against **mocks by default** — payment, shipping, object
storage and AI drafting all have in-process implementations. You need no
external account, no API key and no network to run, seed, test or demo this.

### Sign in

Every seeded account uses the password **`wonderbox-demo`**.

| Account | Role | What they can reach |
| --- | --- | --- |
| `ouder@wonderbox.test` | Parent | Storefront, subscription, orders, activation, `/play`, summaries |
| `ouder2@wonderbox.test` | Parent | The same family, second adult |
| `editor@wonderbox.test` | Content editor | `/studio` — writes and submits. **No** access to families, addresses or orders |
| `approver@wonderbox.test` | Content approver | `/studio` — approves and publishes. Cannot approve their own work |
| `ops@wonderbox.test` | Fulfilment | `/ops` — stock, labels, activation codes. **No** access to content |
| `support@wonderbox.test` | Support | `/ops/support` — cases, including safety reports |
| `admin@wonderbox.test` | Admin | Everything |

The seed prints one activation code bound to the demo family. Enter it at
**Mijn WonderBox → Doos activeren** and the box appears under **Luisteren**.

### The five-minute tour

1. `/boxes` — the catalogue. Safety warnings are on the sales page, before you buy.
2. Order **Natuurdetective**; the mock checkout confirms without charging anything.
3. `/account/activate` — enter the code the seed printed.
4. `/play` — pick the box, pick a chapter, press play. Try **Nog een keer** and
   **Langzamer**; take a wrong branch and notice you get a hint, not a buzzer.
5. `/account/summary` — what your child did. No score, no level, no percentile.
6. `/studio` (as the editor) — edit a line, submit it; as the approver, approve
   and publish it. Try to publish your own draft and watch it refuse.
7. `/emulator` — the same journey as raw protocol frames.

---

## What is in the box

| Module | Where | Notes |
| --- | --- | --- |
| Parent storefront | `src/app/(boxes\|account)` | Catalogue, children, addresses, orders |
| Subscription engine | `src/server/subscriptions.ts` | Skip, pause, resume, cancel, renewal preview |
| Inventory & fulfilment | `src/server/inventory.ts`, `orders.ts` | Batches, reservation, labels, shipment states |
| Activation | `src/server/activation.ts` | Non-guessable codes, hashed at rest, bound to a family |
| Audio companion | `src/components/companion-player.tsx` | Offline queue, resume, slower narration, PWA caching |
| Content studio | `src/app/studio` | Dialogue graphs, versions, approval workflow, AI drafts |
| Parent summary | `src/server/progress.ts` | Descriptive only — see [`CONTENT_SAFETY.md`](CONTENT_SAFETY.md) |
| Support & safety | `src/server/support.ts` | Safety reports are triaged ahead of everything else |
| Unit economics | `src/server/costing.ts` | Margin per box and the purchase plan for a run |
| Automated purchasing | `src/server/purchasing.ts` | Forecast from the subscription book, purchase orders, goods receipt |
| Scheduled jobs | `src/server/jobs.ts` | Renewals, replenishment, fulfilment, summaries, retention |
| Hardware protocol | `packages/hardware-protocol` | Shared by server, PWA and emulator |

### Seeded content

Three complete boxes, each with four chapters, two experiments, branching
dialogue, safety instructions and full Dutch and English text:

- **Junior Ruimteverkenner** / *Junior Space Explorer* (7–10) — balloon rocket, craters, gravity, navigating home
- **Bouw een Alarm** / *Build an Electric Alarm* (9–12) — circuits, switches, a working door alarm, then improving it
- **Natuurdetective** / *Nature Detective* (5–8) — tracks, leaves, soil creatures, your own nature map

Narration is synthesised placeholder audio (a two-tone chime whose length
matches the line) so there is something to press play on. Real recordings are
uploaded through the studio.

---

## Commands

```bash
npm run dev            # development server
npm run video          # re-record the demo films (needs a running dev server)
npm run build          # production build
npm run start          # serve the production build
npm run typecheck      # strict TypeScript, both packages
npm run test           # unit + integration (needs TEST_DATABASE_URL)
npm run test:e2e       # Playwright: full journey + accessibility
npm run db:push        # sync the schema without a migration
npm run db:migrate     # create a migration
npm run db:seed        # wipe and re-seed
npm run db:reset       # drop, recreate, seed
```

`npm run test` uses `TEST_DATABASE_URL` and truncates it between files — point
it at a scratch database, never at development data. `npm run test:e2e` drives
the seeded database through a real browser; re-run `npm run db:seed` first if a
previous run left it in an odd state.

---

## How it is put together

Next.js App Router, strict TypeScript, PostgreSQL via Prisma, Tailwind,
Zod at every boundary. Two workspaces:

```
wonderbox/
├── packages/hardware-protocol/   # HardwareCompanionProtocol: commands, events,
│                                 # envelope codec, transports, session machine
└── apps/web/                     # the application
    ├── prisma/                   # schema, seed, authored box content
    └── src/
        ├── lib/                  # env, db, money, i18n, auth, provider ports
        ├── server/               # domain services (the business logic)
        ├── app/                  # routes
        └── components/           # UI, companion player, device emulator
```

Provider ports — payments, shipping, storage, AI — are interfaces with a mock
implementation that development and the test suite actually run against, which
is what keeps the seam honest. Details in
[`ARCHITECTURE.md`](ARCHITECTURE.md).

---

## The rules this codebase is built around

These are not aspirations; each one is enforced somewhere and tested.

**No unrestricted generative chat with a child.** Every word a child hears is
authored, versioned and approved by a second human. `publishVersion()` is the
only route to playable content and it refuses anything without a real approval
from someone other than the author. AI is available to adult editors and
produces drafts that go through exactly the same gate.
→ [`CONTENT_SAFETY.md`](CONTENT_SAFETY.md)

**No voice recordings by default.** The microphone is off. If a deployment
enables speech-to-text at all, a family must still opt in explicitly per child,
audio is discarded immediately after transcription, and consent is revocable.
→ [`SECURITY_AND_PRIVACY.md`](SECURITY_AND_PRIVACY.md)

**No ads, no public profiles, no messaging, no behavioural profiling.** There is
nowhere in the schema to put them.

**It runs without anybody clicking.** Five jobs behind one authenticated
endpoint — renewals, replenishment, fulfilment, summaries, retention — each safe
to call twice, each recorded so you can see the machinery is alive. Demand is
not estimated: every live subscription is one box in a period and the curriculum
says which, so `replenish-stock` expands the subscription book into components,
nets it against the shelf and what is already on order, and raises purchase
orders per supplier. The one step deliberately left to a person is the moment
money is committed — `autoApproveUnderCents` is zero by default, so an order
waits for someone until you decide otherwise.

**A box has to be deliverable, not just listable.** `/ops/costing` prices every
box against what it actually costs — parts at net purchase price, pick and pack,
and this box's share of certification and artwork — and turns a production run
into a purchase list that respects minimum order quantities and tells you the
lead time you are really waiting on.

**Money is integer minor units, everywhere.** No floating point touches a price.
Webhooks are idempotent by unique index. Stock reservation survives concurrency
because it is a conditional UPDATE under a row lock, and there is a test that
races twelve checkouts at five units of stock.
→ [`COMMERCE_AND_FULFILMENT.md`](COMMERCE_AND_FULFILMENT.md)

**Roles are separated, not merely labelled.** A content editor has no permission
that touches a family, an address or an order — not a hidden link, an actual
absence of permission, with a test that enumerates the whole matrix.

---

## Documentation

| File | What it covers |
| --- | --- |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Layers, data model, the decisions and their trade-offs |
| [`HARDWARE_PROTOCOL.md`](HARDWARE_PROTOCOL.md) | The companion contract, frame by frame |
| [`CONTENT_SAFETY.md`](CONTENT_SAFETY.md) | The dialogue-graph model, review workflow, what we refuse to claim |
| [`COMMERCE_AND_FULFILMENT.md`](COMMERCE_AND_FULFILMENT.md) | Money, stock, orders, refunds, idempotency, unit economics |
| [`apps/web/marketing/VIDEO.md`](apps/web/marketing/VIDEO.md) | The demo films, their voice-over, and a shoot brief |
| [`SECURITY_AND_PRIVACY.md`](SECURITY_AND_PRIVACY.md) | Sessions, consent, retention, deletion, threat model |
| [`.env.example`](.env.example) | Every setting, annotated |

---

## Status

This is an MVP. It is honest about what it is not:

- **No real hardware.** The protocol and the emulator are real; the device is not.
- **Mock payment and shipping by default.** A Stripe adapter is included and
  works with a test key; the shipping adapter is mock-only, with a documented
  port for a carrier.
- **Placeholder narration.** Chimes, not voice actors.
- **No email delivery.** Order confirmations are modelled, not sent.
- **Speech-to-text is a designed, documented, disabled path** — the consent
  machinery and retention controls exist; the transcription provider does not.
- **The supplier names are invented.** Placeholders shaped like real Dutch trade
  names, so the screens have something to show. None has been contacted or
  quoted, and the prices are researched estimates, not offers. See the sourcing
  section of `COMMERCE_AND_FULFILMENT.md` for how to run that round properly.
- **No CE conformity work has been done.** Selling these to children in the EU
  requires EN 71 testing, a technical file and a Declaration of Conformity. The
  cost of that is modelled so it shows up in the margin; the certification
  itself needs a testing lab, and nothing in this repository substitutes for
  one.
- **No footage of a physical product.** The demo films are real screen captures
  and an animation. There is no video of a child with a box, because there is
  no box.
