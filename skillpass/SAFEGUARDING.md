# Safeguarding

**Samenvatting (NL).** Kinderen hebben op SkillPass geen eigen account, geen
openbaar profiel en geen kanaal waarlangs een volwassene hen rechtstreeks kan
bereiken. Alle communicatie loopt via de ouder of verzorger en is
gestructureerd. Aanbieders worden handmatig door een mens beoordeeld; niets in
dit systeem is een juridisch sluitend bewijs van identiteit of van een geldige
VOG. Meldingen met een zorgsignaal gaan automatisch naar een safeguarding
officer en worden vastgelegd in een apart, afgeschermd dossier.

> This document describes what the software does. It is **not** a safeguarding
> policy and does not discharge any legal duty. A real launch needs a written
> policy, trained staff, and legal advice — see
> [What this system does not do](#7-what-this-system-does-not-do).

---

## 1. The design rule

> **No adult reaches a child directly on SkillPass. Ever.**

This is not a setting. It is the shape of the data model.

* A `ChildProfile` has **no credentials** — no email, no password, no session.
  There is no login path a child could take, and none a stranger could take on a
  child's behalf.
* There is **no public child page** and no route that renders one.
  `e2e/safety.spec.ts` asserts that the plausible URLs return 404.
* There are **no social features**: no followers, no friends, no leaderboards, no
  activity feed, no "children who booked this also booked".
* There is **no free-text messaging** anywhere in the product.

## 2. The only communication channel

Providers can send guardians a **structured, templated** message
(`sendProviderMessage`). The sender chooses a template key and supplies
variables; they never compose prose.

```
session_reminder   Herinnering: {activity} begint op {when} bij {venue}.
bring_equipment    Voor {activity} graag meenemen: {items}.
session_cancelled  {activity} van {when} gaat niet door. Reden: {reason}.
location_change    {activity} vindt op {when} plaats op een andere locatie: {venue}.
```

Four checks run on every send:

1. The sender must hold `messages:send` at that provider.
2. The template key must exist — an unknown key is rejected, so there is no
   free-text escape hatch.
3. The recipient must be a `User` with role `GUARDIAN`. A `ChildProfile` id can
   never resolve to a `User`; if one is passed, the attempt is **refused with
   `ChildContactBlockedError` and written to the audit log** as
   `safeguarding.child_contact_blocked`.
4. The recipient must actually hold a booking with that provider. A provider
   cannot message families who have never come.

Tested in `tests/safety.test.ts › no direct adult-to-child contact`.

## 3. What a provider can see about a child

The session roster (`sessionRoster`) returns exactly:

| Shown | Not shown |
| --- | --- |
| Nickname | Full name (never collected) |
| Age band | Date of birth (never collected) |
| Accessibility needs | Home address |
| Medical notes, for a confirmed booking | Guardian's phone number |
| Booking reference | Any other family's data |
| Guardian's display name, labelled "contact via the guardian" | Other activities the child attends |

Medical notes exist because an instructor who does not know about a peanut
allergy is a safety problem. They are visible only for a confirmed booking with
that provider, and the guardian is told so at the point of entry.

## 4. Location disclosure

Before booking, only an **approximate** position is published: coordinates
rounded to a ~500 m grid (`approximate()` in the geo adapter), plus the venue
name and city. The exact street address is released only to a family holding a
confirmed booking (`familyMaySeeExactLocation`).

This matters because independent instructors often teach from home. Publishing
a precise pin would publish a home address to anyone browsing.

The map is a **server-rendered SVG** over those coarse coordinates. No tile
request leaves the browser, so no third-party map host receives the IP address
of someone browsing children's activities.

## 5. Provider verification

Applying puts a provider in `PENDING_REVIEW` and creates a four-item checklist:

| Item | What we collect | What it proves |
| --- | --- | --- |
| `CHAMBER_OF_COMMERCE` | KVK number, 8 digits | **Format only.** Not looked up in the KVK register |
| `LIABILITY_INSURANCE` | Insurer, policy number, expiry | Nothing until a human reads the policy document |
| `VOG_DECLARATION` | A checkbox self-declaration | **A statement by the applicant. Nothing more** |
| `SAFEGUARDING_POLICY` | A URL | Nothing until a human reads it |

An administrator decides each item individually. `approveProvider` **refuses**
while any item is not `APPROVED` — the checklist cannot be skipped
(`tests/catalog.test.ts`). Only after provider approval can any activity be
published (`publishActivity` re-checks provider status at publish time, so a
later suspension takes effect immediately).

Suspending a provider moves its published activities back to `PENDING_REVIEW`;
rejecting archives them. Both are audited.

> **Say this plainly to providers and to parents:** SkillPass performs a manual
> document review. It does not, and cannot, automatically verify identity,
> insurance cover, or that anyone holds a valid VOG. The Dutch legal
> requirements for screening people who work with minors remain the provider's
> own responsibility. The onboarding form says this in both languages.

## 6. Incidents and safeguarding cases

Anyone with an account can file an incident (`reportIncident`) with a category,
a severity, what happened and when.

**Automatic escalation.** Category `SAFEGUARDING`, or severity `HIGH` or
`CRITICAL`, immediately:

1. opens a `SafeguardingCase` with its own reference,
2. moves the incident to `ESCALATED`,
3. notifies **every safeguarding officer**, not the general admin queue,
4. writes `safeguarding.case_opened` to the audit log.

A concern is never left sitting in a queue waiting for someone to notice its
severity.

**Restricted access.** Case notes are readable **only** by
`SAFEGUARDING_OFFICER`. A platform administrator is refused
(`getSafeguardingCase` calls `requireSafeguardingOfficer`), and **every read is
audited** as `safeguarding.case_viewed`. The interface does not offer case
controls to an administrator at all. Tested in `tests/safety.test.ts` and
`e2e/admin.spec.ts`.

Case statuses: `OPEN → INVESTIGATING → REFERRED_TO_AUTHORITY → CLOSED`, with an
`authorityReference` field for the reference given by the receiving authority.

### The human workflow this software supports

The software is the record; these are the steps around it.

1. **Immediate safety first.** Anyone with a concern about a child's immediate
   safety calls 112, or **Veilig Thuis on 0800-2000**, *before* filing anything
   here.
2. **File the incident** the same day, with facts rather than conclusions.
3. **The safeguarding officer triages** within one working day: is a child at
   risk, is a provider implicated, does this need an external report?
4. **Interim measures** where warranted: suspend the provider (unpublishes
   everything), cancel upcoming sessions with full refunds, contact affected
   guardians through the structured channel.
5. **Refer out** where the concern meets the threshold — Veilig Thuis, the
   police, or the provider's own governing body — and record the authority's
   reference.
6. **Close with a written outcome**, and tell the reporting family what
   happened, within the limits of what may be shared.
7. **Review quarterly**: patterns across incidents, verification expiries,
   repeat providers.

## 7. What this system does not do

Be honest about the boundary:

* It does **not** verify anyone's identity or criminal record. A VOG
  self-declaration is a claim, not a check.
* It does **not** replace a call to Veilig Thuis or the police, and it is not a
  case-management system for statutory child protection.
* It does **not** supervise sessions. The two-adult rule, changing-room
  supervision and ratios are the provider's operational responsibility; the
  onboarding declaration records their commitment to them, nothing more.
* It has **no proactive moderation** of review text beyond blocking a child's
  name and embedded images.
* It has **not** been reviewed by a lawyer or a safeguarding professional.

Before launch, at minimum: a written safeguarding policy with a named lead;
trained and named safeguarding officers; a signed processor agreement per
provider covering the child data they receive; a documented VOG verification
process performed out of band; legal advice on Dutch/EU obligations for a
platform serving minors; and a tested incident-response and breach-notification
runbook.
