# Architecture

Questly is a **modular monolith**: one deployable Next.js application, divided
into modules that own their data access and expose a narrow public surface. The
MVP has one database, one process and no message bus. That is a deliberate
choice — the product's hard problems are content quality, child safety and
recommendation quality, none of which are helped by a network hop.

---

## Layers

```
                    ┌──────────────────────────────────────────┐
  browser ─────────▶│  src/app         routes, pages, layouts   │
                    │                  React Server Components  │
                    └───────────────┬──────────────┬────────────┘
                                    │              │
              reads (direct import) │              │ writes
                                    ▼              ▼
                    ┌──────────────────────┐  ┌──────────────────────┐
                    │  src/modules/*       │◀─┤ src/server-actions/* │
                    │  domain logic        │  │ "use server"         │
                    │  authorisation       │  │ validate → authorise │
                    │  audit logging       │  │ → delegate → revalidate
                    └──────────┬───────────┘  └──────────────────────┘
                               │
                    ┌──────────▼───────────┐
                    │  src/lib             │  env, db, crypto, logger,
                    │  cross-cutting       │  rate limiting, errors
                    └──────────┬───────────┘
                               ▼
                          PostgreSQL (Prisma)
```

**Reads** happen in server components, which call module services directly.
**Writes** go through server actions, which are the only place that parses form
input. Every action follows the same shape:

1. `requireUser()` / `requireFamily()` / `requireRole()` — authenticate first;
2. Zod parse of the raw `FormData`;
3. delegate to a module service, which re-checks ownership against the database;
4. `revalidatePath` and/or `redirect`.

Authorisation is never done once. A server action checks the session, and the
module service it calls checks again that the row belongs to the caller's
family. A page that renders a stale form cannot be used to act on someone else's
data.

---

## Modules

| Module | Owns | Public surface |
| --- | --- | --- |
| `auth` | users, sessions, verification tokens, password hashing | `registerParent`, `authenticate`, `verifyEmail`, `requireUser`, `requireFamily`, `requireRole` |
| `families` | family record, membership, practical preferences | `getFamily`, `getPreference`, `updateFamilySettings`, `updatePreference`, `completeOnboarding` |
| `children` | child profiles and their interests | `listChildren`, `createChild`, `updateChild`, `deleteChild` |
| `quests` | published content, filtering, localisation into view models | `listQuests`, `getQuestBySlug`, `listCategories/Skills/Materials/Interests` |
| `recommendations` | the deterministic engine, weather and AI interfaces | `getRecommendations`, `scoreQuest`, `recommend`, `describeReason` |
| `progress` | completions, participation, reflections, badges, favourites, planner, dashboard | `startQuest`, `submitCompletion`, `decideCompletion`, `evaluateBadges`, `getDashboard` |
| `media` | private evidence: storage, validation, signed links | `storeEvidence`, `readEvidenceFor`, `grantUrls`, `deleteEvidence` |
| `subscriptions` | plans, entitlements, payment provider abstraction | `getEntitlements`, `startUpgrade`, `activatePremium`, `cancelPremium` |
| `admin` | quest authoring, versioning, platform overviews, statistics | `createQuest`, `updateQuest`, `setQuestStatus`, `duplicateQuest`, `listFamiliesForAdmin` |
| `audit` | the audit trail | `recordAudit`, `listAuditLogs` |
| `privacy` | export, deletion requests, purge | `exportFamilyData`, `requestAccountDeletion`, `runDuePurges` |
| `notifications` | outbound email abstraction | `emailSender` |
| `i18n` | locale negotiation, dictionaries, translation | `createTranslator`, `getTranslator`, `pickText` |

Rules that keep the boundaries real:

- a module may import `@/lib/*` and other modules' `index.ts`, never another
  module's internals;
- server-only modules carry `import "server-only"` so a client component that
  imports one fails at build time rather than leaking database access;
- `i18n` is the only module a client component may import, because it is pure.

### Why `server-only` matters here

React Server Components make it easy to accidentally pull a database query into
a client bundle. The marker package turns that into a build error. It is why the
translator is passed to client components as a **locale string** rather than as a
function: functions cannot cross the boundary, and the dictionary is pure enough
to bind on the client.

---

## Data model

33 models. The shape follows three rules.

**Content is translated in rows, not columns, where it is long.** `Quest` has
`QuestTranslation` and `QuestStep` has `QuestStepTranslation`, keyed by
`(entity, locale)`. Short taxonomy labels (`Category.nameNl` / `nameEn`) use
column pairs, because a join per label would cost more than it is worth.

**Ownership is always one hop from the family.** Every private row —
`QuestCompletion`, `CompletionEvidence`, `PlannedQuest`, `AwardedBadge` —
reaches `Family` directly or through `QuestCompletion`. Access checks are
therefore cheap and hard to get wrong.

**Constraints encode the rules, not just the shapes.**

- `AwardedBadge` has `@@unique([familyId, badgeId, scopeKey])`, where `scopeKey`
  is `"FAMILY"` or the child profile id. "A badge is awarded once" is enforced by
  the database, not by a read-then-write that can race.
- `ChildProfile` has `@@unique([familyId, nickname])`.
- `PlannedQuest` has `@@unique([familyId, questId, scheduledFor])`.
- `Session.tokenHash` and `EmailVerificationToken.tokenHash` are unique; the raw
  tokens are never stored.
- `QuestVersion` has `@@unique([questId, version])`.

Soft deletion is used **only** where a record must survive for the family's own
history or for auditability: `User`, `Family`, `ChildProfile`, and
`CompletionEvidence`. A deleted child profile keeps its participation rows so the
family's record of what they did together is not silently rewritten, but its
nickname is scrambled immediately and its interests are removed. Everything else
cascades.

### Entity map

```
User ─┬─ Session
      ├─ EmailVerificationToken
      ├─ FamilyMembership ── Family ─┬─ FamilyPreference
      │                              ├─ ChildProfile ── ChildInterest ── Interest
      │                              ├─ Subscription
      │                              ├─ FavouriteQuest ─────────┐
      │                              ├─ PlannedQuest ───────────┤
      │                              ├─ AwardedBadge ── Badge   │
      │                              └─ QuestCompletion ────────┤
      │                                   ├─ QuestParticipation │
      │                                   ├─ CompletionReflection
      │                                   └─ CompletionEvidence │
      ├─ Quest (authored) ◀───────────────────────────────────── ┘
      └─ AuditLog (actor)

Quest ─┬─ QuestTranslation          Category ── Quest
       ├─ QuestStep ── QuestStepTranslation
       ├─ QuestSkill ── Skill
       ├─ QuestMaterial ── Material
       ├─ SafetyInstruction
       ├─ ReflectionQuestion
       └─ QuestVersion
```

---

## The recommendation engine

`src/modules/recommendations/engine.ts` is a pure function of
`(QuestSummary[], RecommendationContext) → ScoredQuest[]`. No database, no
clock, no randomness — which is what makes it testable and explainable.

Every signal is additive and bounded, so no single dimension can silently
dominate:

| Signal | Weight |
| --- | --- |
| Age band matches | +40 (mismatch: −1000, a hard exclusion) |
| Category matches a child's interest | +22 |
| Fits the preferred duration | +14 × closeness |
| Matches the preferred difficulty | +10 × (1 − gap/2) |
| Matches the indoor/outdoor preference | +10 |
| Suits the weather | +8 |
| Fits the season | +6 |
| Category not explored recently | +12 |
| Trains a skill not practised recently | +9 |
| Materials are probably at home | +7 |
| Fits the family size | +5 |
| Already completed | −60 |
| Not done yet | +4 |
| Locked by the plan | −25 |

Age band is a hard exclusion rather than a weight. A quest for twelve-year-olds
must never surface for a six-year-old because it scored well elsewhere.

Each quest collects more reasons than fit on a card, so reasons are ranked by how
informative they are before being trimmed to three: an interest match beats
"suits the age band". The final list is diversified — at most two quests from one
category in the top results — so a family is never funnelled into a single theme.

### Extension points

- `RecommendationEnhancer` may re-order or annotate the deterministic ranking. It
  may **not** introduce a quest that was not in the candidate set, so it cannot
  bypass age-band or entitlement filtering. The default implementation is a
  no-op.
- `ContentDraftProvider` is declared and deliberately unimplemented. Any
  AI-generated quest would enter as a `DRAFT` and require a human content
  administrator to publish it.
- `WeatherProvider` has a seasonal implementation with no network calls.

---

## Abstractions that exist so the MVP can stay self-contained

| Interface | Shipped implementation | Production implementation |
| --- | --- | --- |
| `PaymentProvider` | `MockPaymentProvider` — simulated checkout, no network | `StripePaymentProvider`, lazily imported so the SDK is never loaded without credentials |
| `MediaStorage` | `LocalDiskStorage` | `S3MediaStorage` — declared, not implemented |
| `EmailSender` | `LogEmailSender` | not implemented |
| `RateLimiter` | in-process fixed window | Redis or equivalent |
| `RecommendationEnhancer` | `NoopEnhancer` | optional |
| `WeatherProvider` | `SeasonalWeatherProvider` | a real forecast API |

Each is selected by an environment variable and resolved through a single
factory function, so swapping one changes exactly one file.

---

## Request flows

**Starting a quest.** `startQuestAction` → `requireFamily()` → `startQuest()`
looks up the published quest, resolves entitlements, checks the quest is
accessible on this plan, reuses any in-progress run for the same quest, writes an
audit entry, and redirects to Adventure Mode.

**Completing one.** `submitCompletionAction` parses the form (participants,
minutes, reflections, note, optional photo), `submitCompletion()` verifies every
selected child profile belongs to the caller's family, replaces participation and
reflection rows in a transaction, and either approves immediately or parks the
run for a parent — depending on `Family.requireParentApproval`. Badges are
evaluated only on approval. The photo is stored afterwards, so a failed upload
never loses the completion.

**Reading a private photo.** `grantUrls()` mints an HMAC link bound to
`(evidenceId, familyId, expiry)`. `GET /api/media/[evidenceId]` then requires
**both** a session whose family owns the evidence **and** a valid unexpired
signature. Either check alone would cover the happy path; requiring both means a
leaked link is useless to a signed-out stranger and a signed-in member of another
family cannot enumerate ids. A cross-family attempt is recorded in the audit log.

---

## Internationalisation

Dutch is the source of truth: `TranslationKey` is derived from the Dutch
dictionary, so adding a key without an English counterpart is a type error, and a
test asserts key parity, non-empty values and matching placeholders in both
languages.

The locale lives in a cookie, negotiated from `Accept-Language` on the first
visit. Routes stay language-neutral, which keeps links shareable between a Dutch
and an English speaker in the same family. Adding a third language means adding a
dictionary and a `Locale` enum value; the content tables already key on locale.

---

## Testing strategy

| Layer | Tool | What it proves |
| --- | --- | --- |
| Pure logic | Vitest | Scoring, rotation, contrast of nothing but functions — no database |
| Module services | Vitest against `questly_test` | Ownership checks, transactions, constraints, badge idempotence |
| Whole journeys | Playwright against a production build on `questly_e2e` | Registration → onboarding → quest → Adventure Mode → completion → approval; admin authoring; route protection; both languages |
| Accessibility | `@axe-core/playwright` | WCAG 2.2 AA rule set on thirteen pages, plus keyboard and heading structure |

The integration tests call module services directly rather than server actions,
because server actions depend on `next/headers`. Route protection is therefore
covered end to end instead.
