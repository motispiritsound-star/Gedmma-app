# Product decisions

Why Questly works the way it does. Each entry records the decision, the reasoning
and — where it matters — what was rejected.

---

## Scope and setting

### The repository already contained another product

`Gedmma-app` held **Webscan NL**, an unrelated Dutch lead-generation tool. Questly
was built in the `questly/` subdirectory rather than replacing it, because
deleting someone else's working application is not a call to make silently. The
existing project's conventions (plain Node, no framework, SQLite) were not a fit
for the requested stack, so they were noted and not followed.

*Reversible:* moving Questly to the repository root is a `git mv`.

### Dutch first, English fully supported, locale in a cookie

The launch market is the Netherlands, so Dutch is the source of truth: the
`TranslationKey` type is derived from the Dutch dictionary, which makes an
untranslated key a compile error rather than a runtime surprise.

Routes are language-neutral (`/quests/leaf-detective`, not `/nl/quests/...`) and
the locale lives in a cookie negotiated from `Accept-Language`. In a family
product, a Dutch-speaking parent and an English-speaking child share links; a
locale-prefixed URL would force one of them into the other's language.

*Cost:* no per-language URLs for search engines. For a product that lives behind
a login, that is a small price. Adding locale prefixes later is a routing change,
not a data change — the content tables already key on locale.

---

## Child safety and privacy as product decisions

### A child profile is not an account

No child login, no child password, no public profile, no messaging. Everything
happens in family mode under the parent's account.

This removes entire categories of risk rather than mitigating them: there is no
stranger-contact vector because there is no contact mechanism, and no account
takeover of a child because there is no child account.

*Cost:* an older teenager cannot use Questly independently. That is the right
trade at 6–15, and Teen Venture is where independence would be reconsidered.

### Age bands, not dates of birth

`ChildProfile` has no column for a date of birth. An age band is sufficient to
choose age-appropriate content, and the schema makes the minimising choice the
only available one for a future developer.

It is also the better product decision: nobody has to remember to update a
birthday, and the band is what parents actually think in.

### Private by default, and never public

Photos and notes are visible only inside the family that wrote them. There is no
sharing feature, no "share to social", no discovery between families.

The completion form says uploading is optional, and nothing in the interface
rewards uploading. A product for children should not train them to photograph
themselves for a system.

### Location is coarse, on purpose

The onboarding asks whether a family lives in a city, a village or the
countryside, and explicitly says no address is requested. That is enough to bias
outdoor quests sensibly, and it is the coarsest signal that is still useful.

This is also why StoryWalk's geofencing is specified as device-side in
[FUTURE_MODULES.md](./FUTURE_MODULES.md) — a location-aware feature must not turn
into a location history.

---

## The honesty constraint

### Questly does not claim to measure screen time

This is the decision the whole product hinges on. A web application cannot
measure total device screen time or control other apps, and a product whose
pitch is "reduce passive screen use" is under permanent pressure to imply that it
can.

So:

- the landing page has a section titled *What we do not promise*;
- the dashboard tile is *Estimated offline time*, with the explanation that it is
  what the family reported on completed quests;
- Adventure Mode says, on screen, that Questly only measures time inside the app
  and what the family completes;
- the privacy page repeats it.

`ScreenTimeProvider` is specified in FocusFamily as the seam where real
measurement would arrive. Until then, no number is presented as measured.

### Progress mechanics reward the world, not the app

Not implemented, deliberately: infinite scroll, loot boxes, public rankings,
punishing streaks, artificial scarcity, manipulative notifications, popularity
metrics, and any reward for time spent inside Questly.

Implemented instead: skill badges, completed-project counts, family milestones,
category exploration, a personal portfolio of memories, and a printable
certificate. Every one of them is earned by finishing something in the real
world.

Badges are awarded once, enforced by a unique database constraint rather than a
read-then-write, because a mechanic that can double-fire under load is a mechanic
that can be farmed.

### The free tier rotates deterministically

The free plan sees twelve quests, chosen by hashing the quest slug against the
ISO week number. The same family sees the same list all week, and refreshing
cannot produce a better roll.

Rejected: a random sample per visit. That is a slot machine, and this product
does not get to complain about attention-capture design while using it.

---

## Design of the core experience

### Adventure Mode drops the interface

Once a quest starts, the chrome goes away, type gets larger, and the screen shows
one message: put the device away. Nothing requires continuous interaction, no
timer runs down, and the device is free to lock.

The optional timer is opt-in and never blocks finishing. The countdown is ten
seconds of preparation, not a pressure device.

The whole quest is written to `localStorage` on entry, so the steps stay readable
when a family walks out of signal — which is exactly what should happen when a
quest works.

*Rejected:* a "stay on this screen to prove you were offline" mechanic. It would
be trivially defeated, it would make the app demand attention it just asked you
to withdraw, and it would be a claim the product cannot back up.

### Recommendations explain themselves

The engine is deterministic and every recommendation carries up to three reasons
in plain language. A parent deciding what to do on a Saturday morning needs to
know *why* something is being suggested, and a black box would make the product
feel like a feed.

Reasons are ranked by how informative they are before being trimmed, so "Matches
an interest in science" beats "Suits your child's age band" for the last slot.
The first version trimmed by insertion order and buried the interesting reasons —
the ranking exists because a test caught that.

Age band is a hard exclusion rather than a heavy weight. A quest for
twelve-year-olds must never surface for a six-year-old because it scored well on
every other axis.

The list is diversified: at most two quests from one category in the top results,
so a family that likes cooking is not fed only cooking.

### Parent approval is on by default, and configurable

Approval is a per-family setting, on by default. For a six-year-old it is the
moment a parent looks at what was made; for a fifteen-year-old it is friction.
Families differ more than age bands do, so it is a setting rather than a rule
derived from the age band.

### Quest cards never rely on colour alone

Category is colour *and* an emoji *and* a text label. Difficulty, setting, safety
level and premium status are all text. Illustrations are generated per quest from
its slug, so the library looks varied without shipping — or hotlinking — a single
bitmap, and every one is marked decorative for assistive technology.

---

## Technical decisions

### Session-based authentication, written here

No third-party auth library. Sessions are opaque random tokens, stored hashed, in
an `httpOnly` cookie; passwords use Node's built-in scrypt. The requirement was
"secure session-based authentication", and this is roughly 150 lines with no
dependency to track, no upgrade treadmill, and no surprises about where data is
stored.

*Cost:* no OAuth providers, no magic links, no 2FA out of the box. Those are
additive.

### Server Actions as the only write surface

Every mutation is a server action; there is no REST API for the application's own
writes. Actions are POST-only and origin-checked by the framework, which covers
CSRF, and forms work without JavaScript.

The API routes that exist are the ones that genuinely need to be routes: private
media, the data export, the health check and the Stripe webhook.

### Authorisation is layered, not centralised

There is no auth middleware. Instead: the layout checks, the action checks, and
the service checks ownership against the database.

Middleware alone would be a single point where a mistake is silent. The service
check is the one that matters, because it is the one that cannot be bypassed by
reaching the code from a different direction — which is exactly what the
cross-family evidence tests verify.

### Two independent checks on private media

A signed URL alone would leak if a link leaked. A session check alone would let a
signed-in member of another family enumerate ids. Requiring both, plus an audit
entry on denial, means neither failure is sufficient on its own.

### Every external service is optional

Stripe, S3, email and AI all sit behind interfaces with working local
implementations or explicit, loud failures. `npm install && npm run dev` needs a
database and nothing else.

This is not only about developer convenience: a product that cannot run without
four third-party accounts cannot be reviewed, tested or self-hosted, and every
one of those services is another processor in a privacy assessment.

### Prisma 7 with a driver adapter

Prisma 7 removed `url` from the schema's datasource block in favour of driver
adapters and `prisma.config.ts`. Rather than pinning to Prisma 6 to avoid the
change, the project uses the current stable release the way it is meant to be
used.

### Content validation lives in the service, not only the form

`createQuest` and `updateQuest` re-validate their input with the same Zod schema
the server action uses. The action is not the only caller — the seed and the
tests are too — and a malformed slug must never reach the database regardless of
who asked. An integration test that expected a rejection and got a successful
insert is what surfaced this.

---

## Deliberate non-goals for the MVP

| Not built | Why |
| --- | --- |
| School environment | The `SCHOOL` plan exists as a placeholder; a real one needs a different lawful basis and a separate child record model. See FocusSchool in FUTURE_MODULES.md. |
| Native mobile apps | A PWA covers the MVP journey. Native matters only when screen-time integration does. |
| Real screen-time measurement | Impossible from the web. Claiming it would undermine the product's central promise. |
| Email delivery | An interface with a logging implementation; wiring a provider is a deployment decision, not a product one. |
| Malware scanning and EXIF stripping | Uploads are validated by magic bytes and size. Stripping metadata is a small, high-value addition and is listed as a limitation rather than quietly omitted. |
| AI-generated quests | The interface exists and is unimplemented. Any generated content would have to enter as a draft and be published by a human, which is the same gate human authors pass. |
| Public sharing of family content | There is no version of this that is safe by default for children. |
