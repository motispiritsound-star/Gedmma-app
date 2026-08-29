# Product decisions

**Samenvatting (NL).** Dit document legt vast wát er is besloten, wélk
alternatief is afgewezen en waaróm — inclusief de aannames die zijn gedaan
zonder de opdrachtgever te kunnen raadplegen, en de vragen die nog open staan.

Each entry: the decision, the alternative it beat, and the reason.

---

## Where the code lives

**Decision.** SkillPass is built in `skillpass/`, a self-contained application
inside this repository.

**Alternative.** Build at the repository root.

**Why.** The repository already contained an unrelated Dutch project
(`webscan-nl`) with its own `package.json`, source tree and README. Building at
the root would have meant overwriting or entangling somebody else's work. A
nested application is completely self-contained — its own dependencies,
database, tests and documentation — and removing it later is deleting one
directory. **Assumption:** the existing project should be left untouched. If
SkillPass is meant to replace it, moving these files up one level is
mechanical.

## Stack

**Decision.** Next.js 15 App Router (pinned to the patched 15.5.24), strict
TypeScript, PostgreSQL 16, Prisma, Tailwind, Zod, Vitest, Playwright — as
specified for an empty repository.

**Note on the version.** Next 15.5.4 carries a published security advisory; the
build is pinned to 15.5.24, the patched release on the same minor, rather than
jumping to 16.x mid-MVP.

**Rejected: a service split.** A booking must reserve a seat and deduct credits
atomically. In a monolith that is one transaction; across services it is a
distributed-transaction problem. The modules are the seams if extraction is ever
needed.

**Rejected: a component library.** Accessible primitives were built directly —
semantic elements, real `<label>`s, visible focus rings, `role="alert"` on
errors, `aria-live` on result counts. Fewer dependencies, and nothing hidden
behind an abstraction on a product where accessibility matters.

## Age bands, not birth dates

**Decision.** `ChildProfile` stores an age band and a nickname.

**Alternative.** Store a date of birth and derive the age.

**Why.** A date of birth plus a name is an identity document's worth of data
about a child. An age band answers the only question the product actually asks —
*is this activity suitable?* — and makes the database far less attractive to an
attacker. The cost is that a child's band does not roll over automatically on
their birthday; a guardian updates it. That is the right trade.

## Credits as a ledger, not a counter

**Decision.** Append-only `CreditLedgerEntry` rows with a database trigger
blocking UPDATE and DELETE, a running `balanceAfter`, and a unique idempotency
key per family.

**Alternative.** An integer column on the family row.

**Why.** Credits behave like money: a parent will eventually ask "where did my
credits go?", and a counter cannot answer. The ledger gives a statement, makes
double-charging structurally impossible, and lets balance be re-derived and
reconciled. It also means a bug can be *found*, because history is intact.

## Seat reservation via a conditional UPDATE

**Decision.** One `UPDATE … WHERE seatsTaken < totalSeats`, backed by a CHECK
constraint.

**Alternatives.** Optimistic version columns with retries; `SELECT … FOR UPDATE`;
an application-level mutex.

**Why.** Under READ COMMITTED, the losing transaction re-evaluates its WHERE
clause against the updated row and matches nothing. It is one statement, needs
no retry loop, and holds across processes. The CHECK constraint means even a
future careless query cannot oversell.

## Settle payouts on attendance

**Decision.** Providers are paid for bookings marked `ATTENDED`.

**Alternative.** Pay on booking.

**Why.** It puts the incentive on delivering the session rather than filling a
register. **This is a policy choice with a real cost**: a provider who prepared
for a child who did not turn up earns nothing. Paying on booking would move that
cost to parents instead. **Open question for the business** — a no-show fee, or
a split (say 50% on booking, 50% on attendance), is probably the eventual
answer.

## Late cancellation keeps the credits but frees the seat

**Decision.** Cancelling inside the window forfeits the credits; the seat is
released regardless and the waitlist is promoted.

**Alternative.** Hold the seat for the cancelling family.

**Why.** Forfeiting credits is a cost to the person who cancelled late. Holding
the seat would be a cost to the next family, who did nothing wrong.

## Deterministic recommendations

**Decision.** Fixed, published weights: matching interest +4, age match +1,
trial available +1, accessibility match +1, rating ≥ 4.5 +1. Already-booked
activities are excluded. The reasons are shown in the interface.

**Alternative.** A learned ranking model.

**Why.** A parent is entitled to know why an activity was put in front of their
child. Fixed weights can be explained in a sentence, tested, and argued with. A
model on a children's platform, trained on the behaviour of children's
guardians, is an accountability problem the MVP does not need.

**Rejected: paid placement.** Provider Pro buys a lower commission, never a
better ranking. Selling position in a list parents use to choose care for their
children would corrupt the one thing the platform is for.

## Approximate location before booking

**Decision.** Coordinates rounded to a ~500 m grid before booking; the exact
address released only to a family with a confirmed booking.

**Why.** Independent instructors teach from home. A precise pin on a public page
is a published home address. 500 m is enough to answer "is this near me?" and
not enough to knock on a door.

**Related: the map is a server-rendered SVG.** No tile requests, so no
third-party map host receives the IP address of someone browsing children's
activities — and the app needs no map API key to run.

## Structured messages only

**Decision.** Providers contact guardians through four templates with variables.
No free text anywhere in the product.

**Alternative.** Moderated free-text messaging.

**Why.** Moderation at MVP scale means either nobody reads the messages or the
queue is a bottleneck. Templates make the abuse surface empty rather than
managed. The cost is real — a provider cannot answer a nuanced question in the
product and falls back to email or phone. Accepted for now; a moderated
guardian-initiated thread is the obvious next step.

## Bilingual by contract

**Decision.** An activity cannot be published without both a Dutch and an
English translation. Both dictionaries are asserted to have identical key sets.

**Alternative.** Dutch first, translate later.

**Why.** "Later" does not arrive, and a half-translated catalogue is worse than
a monolingual one — a parent filtering for English lessons finds them in Dutch.
Enforcing at publish time keeps the promise honest. The cost is more work for
providers at onboarding; the seed shows the standard expected.

## Mock adapters that behave like the real thing

**Decision.** The mock payment provider signs webhooks with HMAC and posts them
to the real endpoint; the mock checkout page can also simulate failure.

**Alternative.** Stub the payment call and mark the subscription paid.

**Why.** A stub would leave signature verification, idempotency and the failure
path untested — exactly the parts of a payment integration that break in
production. This way the payment code path in development and in CI is the code
path that runs live.

## Erase the person, keep the accounting

**Decision.** Erasure deletes child data outright, pseudonymises the account,
hides reviews while keeping their text, and retains ledger and payment rows
severed from any person.

**Why.** Article 17(3)(b) versus the Dutch seven-year bookkeeping obligation.
**This reading needs legal confirmation** — it is a documented assumption, not
settled advice.

## No engagement notifications

**Decision.** Only transactional categories can be emailed. There is no code
path for streaks, urgency nudges or re-engagement drips.

**Why.** The brief asked for it, and it is right: manufacturing urgency around a
parent's decisions about their child's week is a pattern worth refusing at the
level of the code, not the style guide.

---

## Assumptions made without being able to ask

1. **Utrecht** is the launch city (the brief said "one Dutch launch region").
   Changing it is `DEFAULT_CITY_SLUG` plus seed data; the schema is multi-city
   and multi-currency already.
2. **Pricing** (€29.95 / 8 credits, €49.95 / 18, 15% commission, 10% on
   Provider Pro) is illustrative and lives in the database, not in code.
3. **24 hours** is the default cancellation window; providers set their own.
4. **Age 6–17** maps to four bands. If the product later serves under-6s, add a
   band; nothing else changes.
5. **One provider per staff account** in the MVP. The schema (`ProviderStaff`)
   already supports many.
6. **Credits do not expire** yet, although `rolloverLimit` is stored — see open
   questions.
7. **Medical notes** are shared with the provider for a confirmed booking. This
   is a real privacy trade-off made in favour of a child's physical safety, and
   the guardian is told at the point of entry.

## Open questions

1. **No-show policy.** Does a provider earn anything for a child who does not
   turn up? (See "Settle payouts on attendance".)
2. **Credit expiry and rollover.** `rolloverLimit` is stored but the monthly
   expiry job is not implemented. What should actually happen to unused credits?
3. **Second guardian on a booking.** Both guardians see the family's bookings;
   only the creator is notified. Should both be?
4. **Teen self-service.** Should a 16–17-year-old ever get limited access of
   their own? The MVP says no. That is a defensible default and a real product
   question.
5. **Provider-initiated refunds.** Only administrators can issue money refunds
   today. Should a provider be able to?
6. **Multi-city rollout.** The schema is ready; the search UI has no city
   switcher and scheduling assumes one timezone.
7. **Accessibility audit.** Built to standard, not yet verified with assistive
   technology.

## Explicitly out of scope for this MVP

Recurring-series booking (each session is booked individually), sibling
discounts, gift cards, provider-to-provider referrals, a native mobile app,
push notifications, calendar sync, waiting-list auto-payment when credits are
short, and a public provider directory outside search.
