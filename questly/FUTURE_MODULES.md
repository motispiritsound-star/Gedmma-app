# Future modules

Nine modules are planned beyond the MVP. **None of them is implemented.** This
document records where each one attaches, what it would add to the database, and
what already exists to make that possible — so the first commit of each is an
addition rather than a restructuring.

The MVP is a modular monolith (see [ARCHITECTURE.md](./ARCHITECTURE.md)). Each
module below is a new folder under `src/modules/`, its own tables, and its own
routes. None of them requires changing the existing schema in a breaking way;
where an existing table needs a column, that is called out.

---

## What already exists for them

| Extension point | Location | Who will use it |
| --- | --- | --- |
| `PaymentProvider` | `modules/subscriptions/provider.ts` | SkillPass, WonderBox, FocusSchool |
| `MediaStorage` | `modules/media/storage.ts` | StoryWalk, GrandQuest, Creator Clubs |
| `EmailProvider` | `modules/email/index.ts` | all of them |
| `AiRecommendationProvider` | `modules/recommendations/ai.ts` | Digital Reset, StoryWalk |
| `RateLimitStore` | `lib/rate-limit.ts` | anything with a public endpoint |
| Deterministic engine inputs | `modules/recommendations/engine.ts` | SkillPass, StoryWalk, WonderBox |
| Audit logging | `modules/audit/index.ts` | every module touching money or minors |
| Quest status machine | `Quest.status` + `QuestVersion` | WonderBox, StoryWalk, Teen Venture |

Two conventions every module must keep:

1. **Nothing weakens the child-safety rules.** No child accounts, no messaging
   between families, no public profiles, no precise location history, no
   advertising profile. A module that cannot be built inside those rules should
   not be built.
2. **Nothing claims a measurement it cannot make.** FocusFamily in particular
   must not present an estimate as a measurement.

---

## 1. SkillPass — marketplace for local activities

A directory and booking flow for local sports clubs, workshops and courses,
earning a commission per booking.

**Boundary.** Providers are a new actor class, adjacent to families rather than
inside them. A provider must never see a child profile; a booking carries a
family, a count and an age band, nothing more.

**New tables.** `Provider`, `ProviderMembership` (links a `User` with a new
`PROVIDER` role), `Activity`, `ActivitySchedule`, `ActivityAvailability`,
`Booking`, `BookingParticipant` (age band only, never a profile id), `Payout`,
`CommissionLedger`.

**Existing tables touched.** `UserRole` gains `PROVIDER`. `Category` and `Skill`
are reused, so an activity is comparable with a quest.

**Integration points.** `PaymentProvider` gains `createConnectedAccount` and
`transfer` for provider payouts (Stripe Connect). The recommendation engine
gains activities as a second candidate type — its scoring inputs (age band,
interests, duration, setting) already describe an activity as well as a quest.

**Hard parts.** Provider vetting, cancellation and refund policy, VAT, and the
fact that a marketplace introduces a second set of terms and a second data
controller relationship.

---

## 2. FocusFamily — voluntary family screen agreements

Shared, voluntary agreements about device-free moments, and — on native
platforms — actual screen-time integration.

**Boundary.** Voluntary and mutual. Questly does not enforce, block, or
surveil. Agreements are made by the family, and honouring them is self-reported
until a native integration exists.

**New tables.** `ScreenAgreement` (family, title, rule text, active period),
`AgreementParticipant`, `DeviceFreeWindow` (recurring weekday/time ranges),
`AgreementCheckIn` (self-reported, per window).

**Existing tables touched.** None.

**Integration points.** A native iOS/Android shell would report *aggregate*
device-free minutes through a new `ScreenTimeProvider` interface —
`getDeviceFreeMinutes(range)` returning totals, never app-level detail.
`QuestCompletion.offlineMinutes` stays what it is: a self-reported number. Any
measured figure must be a separate field with a separate label, and the UI must
keep them visually distinct.

**Hard parts.** iOS Screen Time APIs are heavily restricted and Android's usage
stats permission is sensitive. Expect aggregates only, and expect the honest
answer to remain "we cannot see your other apps".

---

## 3. WonderBox — physical monthly learning kits

A subscription box of materials, each kit linked to quests by QR or NFC.

**Boundary.** Fulfilment is external. Questly stores the kit definition, the
subscription and the link to content — not stock, not shipping labels.

**New tables.** `Kit`, `KitTranslation`, `KitItem`, `KitQuest` (join to
`Quest`), `KitSubscription`, `KitShipment`, `KitCode` (the printed QR/NFC token,
single-use per family).

**Existing tables touched.** `Quest` gains an optional `kitId` so a quest can
declare "this needs the March kit". `SubscriptionPlan` gains `WONDERBOX`, or —
better — a separate `KitSubscription` row so a family can hold both.

**Integration points.** A scan endpoint (`/api/kit/{code}`) resolves a code to
its quests and unlocks them for that family regardless of plan. The
recommendation engine gains "materials the family has been sent" as a positive
signal — `needsSpecialMaterials` already exists as the inverse.

**Hard parts.** Physical logistics, address data (which the MVP deliberately does
not collect and which WonderBox necessarily must), and returns.

---

## 4. Teen Venture — guided entrepreneurship

A structured programme for 12–15s: micro-projects, financial literacy, and
supervised trading.

**Boundary.** No real money moves through Questly for a minor. Budgets are
recorded, not held. Anything involving actual payment stays with the parent.

**New tables.** `Programme`, `ProgrammeModule`, `ProgrammeEnrolment`,
`VentureProject`, `VentureLedgerEntry` (recorded amounts, no settlement),
`VentureMilestone`, `MentorNote`.

**Existing tables touched.** `Quest` already carries an `entrepreneurship`
category and a `financial-literacy` skill; the three seeded quests there are the
starting content.

**Integration points.** Reuses the completion and reflection flow — a programme
module is a sequence of quests plus a milestone. Reuses badges via a new
`BadgeCriteria.PROGRAMME_COMPLETED`.

**Hard parts.** Anything resembling a minor trading commercially attracts
consumer and labour law. Keep it a learning record.

---

## 5. StoryWalk — location-aware audio adventures

Routes with audio chapters that unlock as a family walks them.

**Boundary.** Location is used **transiently, on the device, to unlock a
chapter**. No location history is stored — that rule is not negotiable and is
the reason the MVP has no coordinates anywhere.

**New tables.** `Walk`, `WalkTranslation`, `WalkChapter` (audio asset key,
transcript), `Geofence` (centre, radius — of the *route*, not of a user),
`WalkProgress` (family, chapter, unlocked-at — a timestamp, not a place).

**Existing tables touched.** None. A walk is a sibling of a quest, not a
subtype: it has chapters instead of steps.

**Integration points.** `MediaStorage` serves the audio; the existing signed-URL
mechanism applies unchanged. `QuestCompletion` gains a nullable `walkId`, or a
parallel `WalkCompletion` reuses the same reflection shape.

**Hard parts.** Offline audio caching, accessibility for families who cannot
walk the route (every walk needs an at-home alternative), and resisting the
temptation to keep the location trail.

---

## 6. Digital Reset — a six-week family programme

A structured six-week programme with weekly themes, reflection, and optional
human coaching.

**Boundary.** Coaching is human. If AI assists a coach, the coach publishes; the
model never speaks to a family directly.

**New tables.** `ResetProgramme`, `ResetWeek`, `ResetEnrolment`,
`ResetWeekProgress`, `CoachAssignment`, `CoachSession`, `CoachNote`.

**Existing tables touched.** `UserRole` gains `COACH`. A coach sees the family's
progress and their notes — never their photographs.

**Integration points.** The weekly planner is the natural surface: a reset week
pre-fills the planner with its theme's quests. `AiRecommendationProvider` could
suggest a week's quests to the coach, who then confirms them.

**Hard parts.** Coaching is a service business with its own duty of care. Note
that a coach reading a family's reflections is a meaningful expansion of who can
see private text, and needs its own consent step.

---

## 7. FocusSchool — school licences

Class licences, group challenges and teacher dashboards.

**Boundary.** A school is not a family. Pupils are not child profiles owned by a
teacher; a class is an aggregate, and the school never sees a family's private
material.

**New tables.** `School`, `SchoolLicence`, `Classroom`, `TeacherMembership`,
`ClassChallenge`, `ClassChallengeProgress` (counts per class, never per child),
`SchoolInvite`.

**Existing tables touched.** `SubscriptionPlan.SCHOOL` already exists and is
already entitled in `PLAN_ENTITLEMENTS` — that placeholder is there precisely so
this module does not need a schema migration to start. `UserRole` gains
`TEACHER`.

**Integration points.** Quest content is shared with families unchanged. A class
challenge aggregates completions by classroom rather than by family.

**Hard parts.** Procurement, per-pupil data agreements, and the fact that a
school's lawful basis for processing differs from a parent's consent.

---

## 8. GrandQuest — intergenerational quests and printed books

Quests designed for a grandparent and a grandchild, and a printed family book
made from what the family recorded.

**Boundary.** A grandparent gets a limited, invited role inside one family, not
an account that spans families.

**New tables.** `FamilyInvite` (already useful on its own), `Keepsake`
(a compiled book), `KeepsakePage`, `PrintOrder`.

**Existing tables touched.** `FamilyRole` gains `GUEST` — an invited adult who
can take part in and record adventures, but cannot manage the family,
subscription or child profiles. `Quest` gains an `intergenerational` flag or a
new `Category`.

**Integration points.** Reuses `CompletionReflection` and `CompletionEvidence`
directly: a keepsake is a selection of memories the family already made. The
`grandparent-interview` and `rescue-a-family-recipe` quests in the seed are the
seed of this module.

**Hard parts.** Print fulfilment, and the consent question of a grandparent
appearing in material the parent controls.

---

## 9. Creator Clubs — supervised local creation clubs

Small, supervised, local groups that meet to build things together.

**Boundary.** Supervised and local. Adults are vetted, groups are small, and
there is still no open messaging.

**New tables.** `Club`, `ClubMembership`, `ClubSession`, `ClubSessionAttendance`,
`OrganiserVerification` (background-check status, never the check's contents).

**Existing tables touched.** `UserRole` gains `ORGANISER`.

**Integration points.** Reuses quests as session material. Reuses the
`neighbourhood-sports-hour` safety model: an adult present, invitations only to
people the family knows.

**Hard parts.** This is the highest-risk module in the list. Vetting adults who
meet children is a safeguarding problem, not a software problem, and it should
not ship without a safeguarding policy, an external advisor and an incident
process that predates the first club.

---

## Sequencing

A defensible order, cheapest and safest first:

1. **WonderBox** — mostly commerce, reuses the content model, low risk.
2. **FocusFamily** — no new actors, honest about its limits, strengthens the
   core proposition.
3. **Teen Venture** — reuses the completion flow; content-heavy rather than
   architecture-heavy.
4. **GrandQuest** — introduces the invited-adult role, which several later
   modules need.
5. **StoryWalk** — first module with real technical novelty (audio, geofencing).
6. **FocusSchool** — first module with a different lawful basis and a
   procurement cycle.
7. **Digital Reset** — introduces coaches, a service business.
8. **SkillPass** — introduces a marketplace, payouts and third-party providers.
9. **Creator Clubs** — last, and only with safeguarding in place.
