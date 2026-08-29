# Product decisions

Decisions taken while building the MVP, with the reasoning and the cost of
changing them. Where a decision was a judgement call rather than an obvious
choice, the rejected alternative is recorded too.

---

## 1. Questly lives in `questly/`, alongside the existing project

**Decision.** The repository already contained an unrelated, working
application (Webscan NL — a Dutch lead-generation tool). Questly was added in
its own directory rather than replacing it.

**Why.** Deleting somebody's working software to make room is not a call to make
unasked, and nothing about Questly requires the repository root. The two
projects share no code and no dependencies.

**Cost of change.** Trivial: move the contents of `questly/` up one level.

---

## 2. Honesty about screen time is a product feature, not a disclaimer

**Decision.** Questly never claims to measure or reduce screen time. The
landing page has a section titled "What Questly does not do". Every figure
derived from `offlineMinutes` is labelled as self-reported at the point it is
shown — on the dashboard, on the certificate, and inside Adventure Mode.

**Why.** A web application cannot measure device use or block other apps.
Claiming otherwise would be the single fastest way to lose a sceptical parent,
and the sceptical parent is the buyer. The product's actual claim — "here is
something better to do" — is defensible and testable.

**Rejected.** A "screen time saved" counter. It would have been the most
shareable number in the product and it would have been fabricated.

---

## 3. Progress mechanics that reward action, not attention

**Decision.** No infinite scroll, no daily streaks, no loot boxes, no
leaderboards, no public popularity metrics, no artificial scarcity, no
engagement notifications, and no reward for time spent in the app. Badges are
earned only by approved completions, categories explored and skills practised.

**Why.** The product's premise is that attention-engineering is the problem. A
streak that punishes a family for a week away is exactly the pattern Questly
exists to replace. It also means the app is *supposed* to be closed most of the
time, which is a strange thing to optimise for and the right thing to do here.

**Consequence.** Engagement metrics will look bad by industry standards. The
metric that matters is adventures completed per family per month.

---

## 4. Adventure Mode is deliberately boring on screen

**Decision.** When an adventure starts, the app shows a preparation checklist, a
five-second countdown, and one screen that says to put the device away. Steps
are then available but demand nothing: no timer runs by default, no interaction
is required, nothing expires, and progress is restored if the tab is closed.

**Why.** The product fails if the family stays on the screen. Every design
choice here is subtractive.

**Consequence.** The most important screen in the app is the one with the least
on it.

---

## 5. Language is a cookie, not a URL prefix

**Decision.** `/quests/leaf-detective` renders in the reader's language, chosen
by cookie, falling back to `Accept-Language`, falling back to
`DEFAULT_LOCALE`. There is no `/nl/` or `/en/` prefix.

**Why.** Mixed-language households are the norm in the launch market. A parent
sending a link to a quest should not force their language on the recipient, and
a family should not accumulate two bookmark sets. It also halves the routing
surface in an MVP.

**Rejected.** `app/[locale]/…`. It is the better choice once public SEO matters,
because Google wants one URL per language with `hreflang`.

**Cost of change.** Moderate and mechanical: wrap the route groups in a
`[locale]` segment and prefix links through a helper. No data model change —
the content is already stored per locale.

---

## 6. Small taxonomies carry `nameNl`/`nameEn` columns

**Decision.** `Category`, `Skill`, `Interest`, `Material` and `Badge` hold their
Dutch and English names as columns. `Quest` and `QuestStep` use proper
translation tables.

**Why.** These five tables hold a few dozen rows that change roughly never, and
they are joined on almost every page. A translation table for each would add
five joins to the library query to serve eleven category names. Quests, which
are the bulk of the content and change constantly, get the normalised treatment.

**Cost of change.** A third language means a migration for these five tables.
Given the row counts, that migration is a morning's work, and it buys back
simplicity for however long the product ships two languages.

---

## 7. Free plan = a rotating selection, not a crippled one

**Decision.** Free families get eight free quests, rotating weekly on a
deterministic ISO-week key, plus one child profile. Locked quests remain visible
in the library, clearly marked.

**Why.** A free tier that shows nothing teaches nothing about the product's
value. Showing the whole library with eight of it open makes both the breadth
and the limit legible. Rotation means a family that returns next month finds
something new without paying.

**Detail worth noting.** The rotation is keyed on quest **slugs**, not database
ids. Keying it on generated cuids meant the free set silently reshuffled every
time the content was re-seeded or deployed to a new environment — which an
end-to-end test caught.

---

## 8. Parent approval is on by default

**Decision.** A completed adventure enters `PENDING_APPROVAL` and a parent
approves it. Badges are awarded on approval, not on submission. Families can
switch it off.

**Why.** The youngest users are six. Approval is the moment a parent hears what
happened, which is the conversation the product exists to create — not a
compliance step. For a fifteen-year-old it is friction, so it is a setting.

---

## 9. Recommendations are deterministic first, AI never required

**Decision.** A pure scoring function ranks quests from declared inputs. It has
no database access, no clock and no randomness. An `AiRecommendationProvider`
interface exists and may only **re-order** a list the deterministic engine
already produced.

**Why.** Three reasons. It is explainable — every suggestion carries the reasons
that produced it, which is what a parent asks first. It is testable — the same
context always produces the same ranking. And it means the product has no
dependency on a model provider's uptime, pricing or content behaviour.

**Rule.** An AI provider can never introduce a quest that failed a hard filter,
and never invents content. Any future AI-generated *content* passes human review
before publication.

---

## 10. Suggestions explain themselves

**Decision.** Every recommendation shows two or three human-readable reasons:
"Matches an interest in cooking", "Explores nature, which you have not done
recently", "Suitable for a rainy afternoon".

**Why.** A black-box feed for children invites exactly the suspicion the product
is trying to avoid. Reasons are generated as machine keys plus parameters and
rendered per locale, so they stay translatable and testable.

---

## 11. Two independent checks on every private photograph

**Decision.** A signed, expiring URL **and** a live session ownership check.
Neither alone is sufficient. There is no administrator bypass.

**Why.** The signature stops link guessing; the session check stops a leaked
link. A single mechanism would fail open in one of those two scenarios. "No
administrator can open a family's photograph" is a claim worth being able to
make truthfully, so it is enforced by the absence of a code path rather than by
policy.

---

## 12. Weather is a parameter, not an integration

**Decision.** The recommendation engine takes "what is it like outside?" as an
input. The MVP passes `ANY`.

**Why.** A weather API needs a location, and Questly deliberately collects none.
Solving that properly — a coarse region, or a device-side lookup — is a real
design task, and stubbing it as a parameter keeps the engine complete and
testable in the meantime. The reason strings ("Suitable for a rainy afternoon")
already exist and are covered by tests.

---

## 13. Quests ship without photography

**Decision.** Each quest renders a generated landscape built from its category
colour and a deterministic hash of its key.

**Why.** Thirty-three stock photographs is a licensing bill and a research task,
and photographs of children raise their own consent problem. Generated
illustrations are free, load with no network request, look deliberate, and give
the library visual variety. An `imageKey` field is already there for when real
illustrations are commissioned.

---

## 14. scrypt, not argon2 or bcrypt

**Decision.** Passwords are hashed with `crypto.scrypt` from Node's standard
library.

**Why.** It is memory-hard, it is part of the platform's supported surface, and
it needs no native module to compile — which matters for a project meant to be
installable from a README on any machine. Argon2id is marginally preferable
academically; a failed native build during `npm install` is worse in practice.

---

## 15. Prisma 7 with a driver adapter

**Decision.** Prisma 7, which requires a driver adapter (`@prisma/adapter-pg`)
and a `prisma.config.ts` rather than a `url` in the schema.

**Why.** It is the current stable major. The adapter requirement was new work
but it is where the ecosystem is going, and pinning to Prisma 6 to avoid one
configuration file would have shipped a deliberately outdated dependency.

**Note.** `prisma migrate reset` is not used anywhere. Test databases are
prepared with the additive `migrate deploy` plus a TRUNCATE that refuses any
database whose name does not end in `_test`.

---

## 16. ESLint wired up directly, without `eslint-config-next`

**Decision.** ESLint 10 with `typescript-eslint`, `eslint-plugin-react-hooks`
and `@next/eslint-plugin-next` configured explicitly.

**Why.** `eslint-config-next@16` still bundles an `eslint-plugin-react` build
that crashes on ESLint 10, and the alternative was pinning ESLint to a version
npm marks as unsupported. The rules that actually matter here — the Rules of
Hooks and Next's own correctness rules — are included directly. The React
plugin's remaining rules are largely propTypes-era.

**Consequence, and a good one.** The React Hooks 7 rules flagged four real
issues, which were fixed rather than suppressed: `useSyncExternalStore` for
capability detection, a countdown driven by timers instead of by an effect
setting state, and a form calling its server action from the submit handler
instead of reacting to the result in an effect.

---

## 17. Tests prepare their own database, and refuse the wrong one

**Decision.** Both suites apply migrations and truncate before seeding. The
truncate throws unless the database name ends in `_test`.

**Why.** A test suite that silently points at a development database and empties
it is a rite of passage nobody should have to go through. The guard makes the
failure loud and immediate.

---

## 18. Accessibility is enforced in CI, not asserted in a document

**Decision.** axe-core runs against sixteen pages plus Adventure Mode with the
WCAG 2.2 AA rule set and the suite fails on any violation. Keyboard navigation
and landmark structure are separately tested.

**Why.** Accessibility claims decay. A test does not.

**What it found.** Two colour pairs below 4.5:1 (`ink-muted` at 3.9:1 on the
sunken surface, `sun-600` at 4.47:1 in a badge) and a redundant accessible name
on the step buttons in Adventure Mode. All three were fixed in the tokens and
the markup rather than by relaxing the rule set.

**Limit.** Automated checks catch roughly a third of real barriers. A manual
screen-reader audit is still owed and is listed as a known limitation.

---

## 19. Deletion is two-phase

**Decision.** A deletion request marks the account and destroys every session
immediately; a scheduled purge removes the data after a 30-day grace period.

**Why.** Immediate irreversible deletion is hostile in exactly the situations
where it matters most — an accidental click, a family argument, a coerced
request. Signing in again during the window cancels it. From the family's
perspective the account is gone the moment they ask.

---

## 20. Pricing

**Decision.** Free, Family Premium at €7.99/month, School as a placeholder.

**Why.** Illustrative, not researched. Premium sits below a streaming
subscription, which is the comparison a parent will make. The school plan exists
in the data model and in `PLAN_ENTITLEMENTS` so that FocusSchool needs no schema
migration to begin, and the pricing page says plainly that it is not available
yet.
