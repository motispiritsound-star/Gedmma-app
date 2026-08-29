# Architecture

Questly is a **modular monolith**: one Next.js application, one PostgreSQL
database, and a set of domain modules with explicit boundaries. There are no
microservices, no message bus and no service mesh — none of which an MVP for a
single market needs, and all of which would slow the first year down.

---

## 1. Shape of the system

```
┌──────────────────────────────────────────────────────────────────┐
│ Browser (PWA)                                                    │
│  · React Server Components render most screens                   │
│  · Client components only where interaction demands it:          │
│    Adventure Mode, the quest editor, forms, the planner          │
│  · Service worker caches the shell and visited pages             │
└───────────────┬──────────────────────────────────────────────────┘
                │ HTTPS · session cookie (httpOnly, SameSite=Lax)
┌───────────────▼──────────────────────────────────────────────────┐
│ Next.js App Router (Node runtime)                                │
│                                                                  │
│  Routes                    Server Actions           API routes   │
│  (public) (auth) (app)     auth · family ·          /api/media   │
│  /admin                    quest · completion ·     /api/family  │
│                            subscription · admin     /api/health  │
│                                                                  │
│  ── every entry point starts with a guard ──                     │
│     requireUser · requireFamily · requireAdmin · requirePlatform  │
│                                                                  │
│  ┌────────────────────── modules ─────────────────────────────┐  │
│  │ auth  families  quests  recommendations  progress  media   │  │
│  │ subscriptions  admin  audit  privacy  localisation  email  │  │
│  └────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────── lib ─────────────────────────────────┐  │
│  │ db (Prisma) · crypto · logger · errors · rate-limit · form │  │
│  └────────────────────────────────────────────────────────────┘  │
└───────────────┬───────────────────────────┬──────────────────────┘
                │                           │
        ┌───────▼────────┐        ┌─────────▼──────────┐
        │ PostgreSQL 16  │        │ MediaStorage       │
        │ (Prisma 7)     │        │ local disk │ S3*   │
        └────────────────┘        └────────────────────┘
                                   * interface only in the MVP
```

Everything is server-rendered on demand. There is no static generation: every
page depends on who is asking.

---

## 2. Modules

Each module owns its data and exposes functions, not tables. A module may read
another module's *service*; it does not reach into another module's rows.

| Module | Owns | Notable pieces |
| --- | --- | --- |
| `auth` | users, sessions, verification tokens | scrypt hashing, session issuing, guards |
| `families` | families, child profiles, interests | plan-limit enforcement, nickname policy |
| `quests` | quests and their translations | filtering, localisation into view models |
| `recommendations` | nothing | a pure engine plus a service that feeds it |
| `progress` | completions, participation, reflections, badges, favourites, planner | quest lifecycle, badge awarding, statistics |
| `media` | completion evidence | storage abstraction, signed URLs, validation |
| `subscriptions` | subscriptions | plan entitlements, payment provider abstraction |
| `admin` | quest authoring | create/update/publish, version snapshots |
| `audit` | audit log | one `recordAudit` used by every sensitive action |
| `privacy` | nothing | export, deletion request, retention purge |
| `localisation` | nothing | dictionaries, locale resolution, formatting |
| `email` | nothing | e-mail provider abstraction |

### Why the recommendation engine is split in two

`recommendations/engine.ts` is **pure**: no database, no clock, no randomness.
Every input is a parameter, so the same context always produces the same
ranking, and the whole thing is unit-testable without a database.
`recommendations/service.ts` gathers the inputs and localises the output.
`recommendations/ai.ts` defines an optional re-ranker that may only reorder a
list the deterministic engine already produced — it can never introduce a quest
that failed a hard filter, and it can never invent content.

---

## 3. Request flow

A representative example — a parent finishing an adventure:

1. `CompletionForm` (client) submits to the `submitCompletionAction` server
   action.
2. The action calls `requireFamily()`, which resolves the session cookie into a
   user, family, membership and subscription. React's `cache()` memoises this
   per request.
3. The payload is parsed with a Zod schema. Invalid input becomes a typed
   `FormState` the form renders next to the offending field.
4. `progress/service.submitCompletion` verifies that every selected child
   profile belongs to *this* family, then writes the completion, its
   participants and its reflections in one transaction.
5. If the family does not require approval, `progress/badges` evaluates every
   badge and awards the newly earned ones. Awarding is idempotent — see §5.
6. An optional photograph is stored afterwards, so a failed upload never loses
   the family's answers.
7. `recordAudit` writes an entry. Audit failures are logged, never propagated:
   an audit write must not break the action it describes.

Guards are the first statement of every entry point. There is no middleware
doing authorisation by URL pattern, because URL patterns drift away from the
data they are supposed to protect.

---

## 4. Data model

Thirty models. The full definition is `prisma/schema.prisma`; the shape:

```
User ─┬─ Session
      ├─ VerificationToken
      └─ FamilyMembership ── Family ─┬─ ChildProfile ── ChildInterest ── Interest
                                     ├─ Subscription
                                     ├─ FavouriteQuest ─┐
                                     ├─ PlannedQuest ───┤
                                     ├─ AwardedBadge ── Badge
                                     └─ QuestCompletion ─┬─ QuestParticipation ── ChildProfile
                                                         ├─ CompletionReflection
                                                         └─ CompletionEvidence
                                                        │
Quest ──────────────────────────────────────────────────┘
  ├─ QuestTranslation      (nl, en)
  ├─ QuestStep ── QuestStepTranslation (nl, en)
  ├─ QuestSkill ── Skill
  ├─ QuestMaterial ── Material
  ├─ SafetyInstruction
  └─ QuestVersion          (content history)

Category ── Quest, Interest, Badge
AuditLog  (actor optional; survives the actor's deletion)
```

Design notes:

- **Child profiles are deliberately thin.** A nickname, an avatar key and an age
  band. No e-mail, no legal name, no date of birth, no coordinates. The
  nickname schema rejects e-mail addresses and URLs, because those are what
  people paste in by accident.
- **Content is translation-first.** `Quest` holds the locale-independent facts;
  `QuestTranslation` and `QuestStepTranslation` hold the words. A quest cannot
  be published without both languages.
- **Small taxonomies carry `nameNl`/`nameEn` columns** instead of separate
  translation tables — five tables, a handful of rows each, and a join saved on
  every page. See PRODUCT_DECISIONS.md for the trade-off.
- **Soft deletion only where it is justified**: `User`, `Family` and
  `ChildProfile`. A deleted child profile keeps the family's completed
  adventures intact; a deletion request marks the account and the retention job
  removes it for good once the grace period passes. Everything else is deleted
  outright.
- **Cascades are declared in the schema**, so deleting a family really does
  remove its children, completions, reflections, evidence rows, favourites,
  planned quests, badges and subscription.

### Indexes worth knowing about

- `Quest(status, isPremium)` — the library query's shape.
- `QuestCompletion(familyId, status)` and `(familyId, finishedAt)` — the
  dashboard and the pending-approval list.
- `PlannedQuest(familyId, scheduledFor)` — the weekly planner.
- `AuditLog(createdAt)`, `(action)`, `(entityType, entityId)`, `(actorUserId)`.
- Two **partial unique indexes** on `AwardedBadge` (see §5).

---

## 5. Awarding a badge exactly once

`AwardedBadge` records either a family-level badge (`childProfileId IS NULL`) or
a per-child badge. PostgreSQL treats NULLs as distinct in a unique index, so a
plain `@@unique([badgeId, familyId, childProfileId])` would happily allow
duplicates of the family-level case. The migration
`20260829071500_badge_family_unique` adds two partial indexes:

```sql
CREATE UNIQUE INDEX "AwardedBadge_family_unique"
  ON "AwardedBadge" ("badgeId", "familyId") WHERE "childProfileId" IS NULL;

CREATE UNIQUE INDEX "AwardedBadge_child_unique"
  ON "AwardedBadge" ("badgeId", "childProfileId") WHERE "childProfileId" IS NOT NULL;
```

The application checks before inserting *and* catches the unique violation, so a
concurrent evaluation loses the race harmlessly rather than double-awarding.

---

## 6. Authentication and sessions

- Passwords are hashed with **scrypt** from Node's standard library: memory-hard,
  no native module to compile, part of the platform's supported surface. The
  stored format is `scrypt$N$r$p$salt$hash`.
- A session is a 256-bit random token in an `httpOnly`, `SameSite=Lax` cookie.
  Only the SHA-256 of the token is stored, so a database leak does not hand over
  live sessions.
- Sign-in failures increment a counter and lock the account for fifteen minutes
  after ten attempts; a successful sign-in clears it and cancels any pending
  deletion.
- A password change deletes every session for that user.
- Expired sessions are pruned opportunistically on sign-in.

---

## 7. Private media

Two independent checks guard every read, and both must pass:

1. **A signed URL.** `/api/media/{id}?expires=…&signature=…`, where the
   signature is an HMAC over `evidenceId.familyId.expiry` using the session
   secret. Short-lived (ten minutes by default). This stops link guessing.
2. **A live ownership check.** The route resolves the caller's session and
   confirms the evidence belongs to *their* family. This stops a leaked or
   copied link from working for anyone else.

There is deliberately **no administrator bypass**: no code path lets an
administrator read a family's photograph. Uploads are validated by magic bytes,
not by the browser's declared content type, and storage keys are generated by
the server and re-validated against traversal before touching the filesystem.

---

## 8. Localisation

- Dictionaries are plain typed objects; the Dutch one is typed as the English
  one, so a missing key is a compile error and a unit test asserts that the key
  sets, the placeholder sets and the array lengths match exactly.
- Locale resolution: explicit cookie → `Accept-Language` → configured default.
- `src/modules/localisation/index.ts` is safe for client components;
  `server.ts` holds the `next/headers` part. This split matters: importing
  `next/headers` into a client bundle is a build error.
- Quest content is translated in the database; interface copy is in the
  dictionaries; enum labels live in `modules/quests/labels.ts`.

---

## 9. Design system

`src/styles/globals.css` defines the tokens — colour, typography, spacing,
radius, shadow, easing — as Tailwind 4 `@theme` variables. Components in
`src/components/ui` are small and hand-written: `Button`, `Card`, `Badge`,
`Field`, `States` (empty / loading / error / callout / progress), `Avatar`,
`Icons`.

Two rules the tokens enforce:

- **Every text/background pair meets WCAG AA.** The ink tones were darkened
  after the axe-core suite caught two pairs sitting at 3.9:1 and 4.47:1.
- **Nothing is conveyed by colour alone.** Badge tone is decorative; the text
  always carries the meaning.

---

## 10. Extension points

The interfaces future work plugs into, all already used by a real implementation
so they are shaped by practice rather than speculation:

| Interface | Location | Default |
| --- | --- | --- |
| `PaymentProvider` | `modules/subscriptions/provider.ts` | `MockPaymentProvider` |
| `MediaStorage` | `modules/media/storage.ts` | `LocalDiskStorage` |
| `EmailProvider` | `modules/email/index.ts` | `ConsoleEmailProvider` |
| `AiRecommendationProvider` | `modules/recommendations/ai.ts` | `NullAiProvider` |
| `RateLimitStore` | `lib/rate-limit.ts` | `MemoryRateLimitStore` |

[FUTURE_MODULES.md](./FUTURE_MODULES.md) describes the nine planned modules and
the database additions each would need.

---

## 11. Testing strategy

- **Unit** — pure logic with no database: the recommendation engine, the
  dictionaries, plan entitlements and the free rotation, crypto, rate limiting,
  upload validation.
- **Integration** — the real services against a real PostgreSQL: registration,
  the quest lifecycle, approval, badge idempotency, cross-family isolation,
  role-based access, admin content management, export and deletion.
- **End to end** — Playwright against a production build: the complete family
  journey, the library filters, the admin authoring flow, plan gating, private
  media across three browser contexts, and axe-core accessibility checks on
  sixteen pages plus Adventure Mode.

Both test databases are prepared with `prisma migrate deploy` plus a guarded
TRUNCATE that refuses any database whose name does not end in `_test`.
