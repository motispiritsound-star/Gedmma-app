# Future modules

Nine modules are planned. **None of them is implemented.** This document exists
so that adding them later does not require restructuring the application: it
records where each one attaches, what it would add to the database, and — just as
importantly — what it must not be allowed to change.

Two rules apply to all of them:

1. **A new module is a new directory under `src/modules/`** with its own
   `index.ts`. It may import `@/lib/*` and other modules' public surfaces. It
   may not reach into another module's internals or query another module's
   tables directly.
2. **No module may weaken the child-safety invariants.** No child accounts, no
   messaging between users, no public profiles, no precise location history, no
   advertising profiles. Where a module appears to need one of these (StoryWalk
   needs location; Creator Clubs needs local groups), the boundary is drawn so
   the sensitive part stays outside the child's record — see each section.

---

## 1. SkillPass

*A marketplace for local sports clubs, workshops and educational activities.*

**Boundary.** A separate `marketplace` module owning providers, offerings,
availability and bookings. Questly's quest content stays untouched: a SkillPass
offering is not a quest, and a quest never becomes bookable. The two meet only in
recommendations, where an offering may appear alongside quests as a clearly
labelled, separate card type.

**Database.** `Provider`, `ProviderMember`, `Offering`, `OfferingTranslation`,
`AvailabilitySlot`, `Booking`, `BookingParticipant`, `CommissionLedgerEntry`,
`Payout`.

**Integration points.**
- `PaymentProvider` already abstracts checkout, but it assumes one subscription
  per family. Marketplace payments need a second capability — split payments and
  payouts — which should be a *sibling* interface (`MarketplacePaymentProvider`),
  not an extension of the existing one.
- `Category` and `Skill` are reused so an offering can be matched to the same
  taxonomy as quests.
- `RecommendationEnhancer` is the wrong seam: it may only re-order quests.
  Mixing offerings in needs a `RecommendationSource` interface above the current
  engine.

**Constraints.** Providers are businesses, not families, and need their own
authentication realm and role set. A booking exposes a child's nickname and age
band to a provider — the minimum needed to run a session — and nothing else. No
provider ever sees a family's completions, notes or photos.

---

## 2. FocusFamily

*Voluntary family screen agreements and shared device-free moments.*

**Boundary.** A `focus` module owning agreements and device-free windows. It must
not become an enforcement mechanism: Questly's position is that the product
offers alternatives rather than punishment, and this module has to keep that
promise even though it is the one most tempted to break it.

**Database.** `ScreenAgreement`, `AgreementTerm`, `DeviceFreeWindow`,
`WindowParticipation`, and — only if native apps ship — `DeviceLink`,
`ScreenTimeSample`.

**Integration points.**
- `Family` gains an optional relation; no existing column changes.
- The dashboard's "estimated offline time" tile is the natural place for real
  measurements to appear — but only once a native integration actually provides
  them, and always labelled as measured rather than estimated.
- A `ScreenTimeProvider` interface belongs here, mirroring `WeatherProvider`:
  a null implementation by default, an iOS Screen Time / Android Digital
  Wellbeing implementation later.

**Constraints.** This is where the product's central honesty problem lives. Until
a native integration exists, nothing in this module may present a number as
measured screen time. Agreements are between family members and are never
enforced technically by the web app.

---

## 3. WonderBox

*Physical monthly learning kits, linked to quests by QR or NFC.*

**Boundary.** A `kits` module owning box definitions, subscriptions to boxes,
shipments and code redemption. Fulfilment is external; the module owns the link
between a physical code and digital content.

**Database.** `Kit`, `KitTranslation`, `KitQuest` (join to `Quest`),
`KitSubscription`, `Shipment`, `RedemptionCode`.

**Integration points.**
- `Quest` needs no change: `KitQuest` is a join table, and a kit quest is an
  ordinary quest that happens to be referenced by a kit.
- Redemption grants temporary access to specific quests. That is a second kind of
  entitlement, so `Entitlements` should gain an `unlockedQuestSlugs` set rather
  than a new plan — plans and unlocks are different concepts and conflating them
  will hurt later.
- A physical address is required for shipping. It belongs in a
  `ShippingAddress` table owned by this module, deliberately **not** on `Family`,
  so the core family record keeps its no-address property.

**Constraints.** Redemption codes are bearer credentials: single-use, rate
limited, and never guessable. A screen-free audio device would add a device
identity model, which needs its own privacy review.

---

## 4. Teen Venture

*Guided entrepreneurship programmes with supervised micro-projects.*

**Boundary.** A `programmes` module owning multi-week structured programmes.
Questly already has three entrepreneurship quests; this is the difference between
a single activity and a curriculum with state that persists across weeks.

**Database.** `Programme`, `ProgrammeTranslation`, `ProgrammeModule`,
`ProgrammeEnrolment`, `ProgrammeProgress`, `VentureProject`,
`VentureLedgerEntry`.

**Integration points.**
- Enrolment is per child profile, reusing `ChildProfile` and the existing age
  bands (12–15 only).
- Programme modules link to quests via a join table, so a programme can reuse
  library content rather than duplicating it.
- `financial-literacy` already exists as a `Skill`, so progress feeds the
  existing skill model.

**Constraints.** Real money handled by a minor is a legal question before it is a
technical one. The ledger should stay a record-keeping tool — the teenager's own
bookkeeping — rather than a payment system, unless a payments partner and legal
review say otherwise.

---

## 5. StoryWalk

*Location-aware audio adventures with routes and geofenced chapters.*

**Boundary.** A `storywalk` module owning routes, chapters and geofences. This is
the module that most directly tests the "no precise location history" rule, so
the boundary is drawn hard: **route geometry is content, not user data.**

**Database.** `Route`, `RouteTranslation`, `RouteChapter`, `ChapterAudioAsset`,
`Geofence`, `RouteCompletion`.

**Integration points.**
- `RouteCompletion` links to `QuestCompletion` so a walk counts as a completed
  quest and feeds skills and badges without a parallel progress system.
- Audio assets reuse `MediaStorage`, but as **public** content rather than
  private family media. That distinction must be explicit in the storage key
  namespace, because everything the media module handles today is private by
  default.

**Constraints.** Geofence evaluation happens **on the device**. The server stores
which chapters were unlocked, never a coordinate or a timestamped position. A
route is a published piece of content; a family's path through it is not
recorded. Anything else would break the privacy promise the product makes on its
own privacy page.

---

## 6. Digital Reset

*A structured six-week family programme, optionally with human coaching.*

**Boundary.** Shares the `programmes` module with Teen Venture — the underlying
model (a programme, modules, enrolment, progress) is the same. Coaching adds a
`coaching` module.

**Database.** Reuses the programme tables; adds `Coach`, `CoachingRelationship`,
`CoachingSession`, `SessionNote`.

**Integration points.**
- Enrolment is per family rather than per child.
- Weekly steps are planned through the existing `PlannedQuest` model, so the
  weekly planner needs no new concepts.

**Constraints.** A coach is an outsider with a view into a family. That needs a
distinct role, an explicit per-family grant, a scope limited to what the family
shares deliberately, an expiry, and an audit entry for every access. Coaches must
never inherit the platform administrator's view, and must never reach private
photos. Session notes are written by the coach about the family, which makes them
personal data with their own retention rule.

---

## 7. FocusSchool

*School licences, class challenges and teacher dashboards.*

**Boundary.** A `schools` module. The `SCHOOL` plan already exists in
`SubscriptionPlan` and `ENTITLEMENTS` as a deliberate placeholder — that is the
whole extent of the current implementation.

**Database.** `School`, `SchoolLicence`, `Classroom`, `Teacher`,
`ClassroomMembership`, `ClassChallenge`, `ChallengeParticipation`.

**Integration points.**
- `Entitlements` already carries the `SCHOOL` plan, so the plan-gating code needs
  no change.
- Class challenges aggregate `QuestCompletion` rows, which means the progress
  module needs an aggregate query that is scoped to a classroom rather than a
  family.

**Constraints.** This is the module most likely to damage the product if built
carelessly. A classroom is a group of other people's children, so:
a teacher sees aggregate class progress, never an individual child's reflections,
notes or photos; a class challenge must not become a public ranking of children;
and the lawful basis shifts from parental consent to the school's own basis,
which is a legal question, not a technical one. Consider a separate child record
owned by the school rather than reusing `ChildProfile`, so a family account and a
school record never merge.

---

## 8. GrandQuest

*Intergenerational quests and printed family books.*

**Boundary.** Mostly content plus a `publishing` module for print artefacts.
`interview-a-grandparent`, `family-time-capsule` and `then-and-now-photo` already
exist in the library, so the quest side needs no new model — only a category or
tag for intergenerational quests.

**Database.** `FamilyBook`, `BookChapter`, `BookAsset`, `PrintOrder`.

**Integration points.**
- Compiles existing `QuestCompletion`, `CompletionReflection` and
  `CompletionEvidence` into a book.
- A grandparent needs access without becoming an account holder: extend
  `FamilyMembership` with a `RELATIVE` role and a narrow scope, rather than
  inventing a second membership model.

**Constraints.** Printing exports private family photos to a third party. That
needs explicit per-book consent, a shipping address (owned by this module, as
with WonderBox), and a documented processor relationship.

---

## 9. Creator Clubs

*Supervised local creation clubs.*

**Boundary.** A `clubs` module, closest in shape to SkillPass and reusing its
provider model if both are built.

**Database.** `Club`, `ClubSession`, `ClubMembership`, `Supervisor`,
`SupervisorCheck`.

**Integration points.**
- Sessions can reference quests, so a club meeting runs library content.
- Attendance feeds `QuestParticipation` so club work counts towards skills.

**Constraints.** Adults supervising other people's children is the highest-risk
feature in this list. It requires background-check status as a first-class,
verified field; clubs invisible until a supervisor is verified; no direct channel
between a supervisor and a child; and an audit entry for every access to a
participant list. If any of that cannot be guaranteed, the module should not
ship.

---

## Summary of database additions

| Module | New tables | Changes to existing tables |
| --- | --- | --- |
| SkillPass | 9 | none (reuses `Category`, `Skill`) |
| FocusFamily | 4–6 | optional relation on `Family` |
| WonderBox | 6 | `Entitlements` gains per-quest unlocks (code, not schema) |
| Teen Venture | 7 | none |
| StoryWalk | 6 | `QuestCompletion` gains an optional back-reference |
| Digital Reset | 4 + shared programme tables | none |
| FocusSchool | 7 | none (`SCHOOL` plan already exists) |
| GrandQuest | 4 | `FamilyRole` gains `RELATIVE` |
| Creator Clubs | 5 | none |

No planned module requires changing the shape of `User`, `ChildProfile`, `Quest`
or `QuestCompletion`. That is the point of writing this down now: the core model
was designed so these can be added around it.
