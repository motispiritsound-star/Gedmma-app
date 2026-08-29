# Security and privacy

**Samenvatting (NL).** We verzamelen zo min mogelijk over kinderen: een roepnaam
en een leeftijdsgroep, geen geboortedatum en geen achternaam. Sessies zijn
ondoorzichtige tokens waarvan alleen de hash wordt opgeslagen, wachtwoorden gaan
door scrypt, en elke aanbieder ziet uitsluitend zijn eigen gegevens. Ouders
kunnen hun gegevens downloaden of laten wissen; financiële regels blijven
gepseudonimiseerd bewaard voor de boekhoudplicht. Een juridische toets heeft nog
niet plaatsgevonden.

---

## 1. Data minimisation, starting with children

| We collect | We deliberately do **not** collect |
| --- | --- |
| Child nickname | Full name, surname |
| Age band (`AGE_6_8` … `AGE_15_17`) | Date of birth |
| Interests, preferred languages | Photographs of children |
| Accessibility needs | School, class, medical history |
| Optional medical notes (allergies, medication) | Precise location history |
| Pronouns (optional) | Anything a child typed themselves — children cannot log in |

There is no birth-date column in the schema. Age bands are enough to filter for
suitable activities, and the difference is the difference between a database
that would be attractive to an attacker and one that is much less so.

The nickname field rejects anything that parses as a full name (more than two
words), and the interface says why. The audit log records the *age band* of a
created child profile, never the nickname or the notes.

Attendance records what happened at a session that was booked; there is no
tracking of a child's movements, and no location history of any kind.

## 2. Authentication

* **Passwords**: scrypt (`node:crypto`, memory-hard), 16-byte random salt,
  64-byte key, stored as `scrypt$salt$hash`. No native dependency, no
  build-time toolchain. Minimum 12 characters, with a small block-list for the
  passwords that appear in every breach corpus — length beats composition rules.
* **Sessions**: a 32-byte random token in an `httpOnly`, `SameSite=Lax`,
  `Secure`-in-production cookie. Only the **SHA-256 digest** is stored, so a
  database leak does not hand out live sessions. 14-day expiry, revocable.
* **Enumeration**: a wrong password and an unknown account return the same
  message, and the same hashing work is done in both cases.
* **Brute force**: 8 failed attempts locks the account for 15 minutes; login is
  additionally rate-limited per IP + email.
* **Email verification**: single-use, 24-hour, hashed token. Re-use is refused.

## 3. Authorisation

Four platform roles — `GUARDIAN`, `PROVIDER_STAFF`, `ADMIN`,
`SAFEGUARDING_OFFICER` — plus per-provider roles with permission slugs:

| Provider role | Permissions |
| --- | --- |
| `OWNER` | everything, including staff management and finance |
| `MANAGER` | activities, sessions, publishing, bookings, check-in, finance, messages |
| `INSTRUCTOR` | bookings read, check-in, incident reporting — **cannot publish** |

Every provider-scoped call goes through `requireProviderAccess(user, providerId,
permission)`. Non-membership returns the same error as an unknown provider, so
tenancy cannot be probed. Every write re-checks that referenced rows (venue,
activity, session, booking) belong to the same provider, so a valid-looking
foreign id is refused rather than used.

Guardian access derives the family from the session, never from the request, and
`requireChildInFamily` re-checks every child id.

Safeguarding case notes are readable only by `SAFEGUARDING_OFFICER` — an
administrator is refused — and every read is audited.

## 4. Private media

Uploaded documents (insurance certificates, safeguarding policies) are stored
**outside** the public directory and are never statically served. Access needs
all three of:

1. a **short-lived HMAC signature** bound to the asset id, the viewer id and an
   expiry (default 5 minutes),
2. a live session belonging to **that same viewer**,
3. authorisation for the asset — the owning provider's staff, or platform staff.

Uploads are restricted to JPEG, PNG, WebP and PDF, 8 MB maximum, and served with
`Content-Type: nosniff`, `Cache-Control: private, no-store` and an explicit
`Content-Disposition`. Storage keys are checked against path traversal before
they reach the filesystem.

**Not implemented**: antivirus and content scanning, and image re-encoding.
Both are required before accepting uploads from the public.

## 5. Application security

* **Input validation**: every route, action and service boundary parses input
  with Zod. Nothing reaches Prisma unparsed.
* **SQL injection**: Prisma parameterises everything; the two raw statements
  (seat reservation and release) use tagged templates with bound parameters.
  The only `$executeRawUnsafe` calls are the test/seed truncations, which take
  no user input.
* **XSS**: React escapes by default and the code contains no
  `dangerouslySetInnerHTML`.
* **CSRF**: session cookies are `SameSite=Lax`, and Next.js server actions carry
  their own origin check.
* **Headers**: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`, a restrictive
  `Permissions-Policy`, and `X-Powered-By` removed. Asserted in `e2e/safety.spec.ts`.
* **Rate limits**: login 8/15 min, registration 5/h, bookings 30/min, search
  120/min, reviews 10/h, uploads 20/h, webhooks 300/min. In-process today;
  Redis before running more than one instance.
* **Secrets**: read through a Zod-validated config module. Production start-up
  **fails** if `SESSION_SECRET` still holds the development placeholder, or if
  Stripe is selected without a key.
* **Webhooks**: signature verified against the raw body before any lookup;
  replays absorbed by a unique event id. Stripe's scheme adds a five-minute
  timestamp tolerance.
* **Logging**: IP addresses are stored only as a keyed HMAC digest, never in
  clear. Errors are logged server-side; clients get a stable error code and a
  message, never a stack trace.

## 6. Audit logging

Every sensitive action writes an `AuditLog` row: actor, role, action, entity,
metadata, hashed IP, user agent, timestamp. A PL/pgSQL trigger raises on any
UPDATE or DELETE, so the trail cannot be rewritten — including by an
administrator.

Audited: registration, login and failed login, email verification, child profile
create/update/archive, bookings and cancellations, waitlist promotion,
attendance, publication, provider applications and every verification decision,
approval, rejection and suspension, refunds and credit adjustments, review
creation and moderation, incident reports and escalations, **every safeguarding
case read and update**, blocked child-contact attempts, media views, data export
and account erasure.

The audit log is deliberately free of personal content: it records that a child
profile was created and its age band, not the nickname or the medical notes.

## 7. Consent

`Consent` rows record type, granted/withdrawn, the **policy version** in force,
a hashed IP and a timestamp. Registration records terms, privacy policy and
parental consent for processing a child's data. Marketing email is a separate,
default-**off** consent — and the notification code will not email an
engagement-style message at all (see §9).

## 8. GDPR rights

**Access and portability (art. 15 & 20).** `GET /api/account/export` returns
machine-readable JSON: account, consents, families, child profiles, bookings
with sessions and attendance, the full credit ledger, payments, reviews,
favourites and notifications. Available from the family page.

**Erasure (art. 17).** `deleteAccount()`:

| Data | Treatment | Why |
| --- | --- | --- |
| Child profiles | **Deleted** | Nothing about a child outlives the account |
| Favourites, notifications, sessions, tokens | **Deleted** | No further purpose |
| Reviews | Hidden, authorship link severed | Other parents relied on them; the author is no longer identifiable |
| User row | Pseudonymised: email replaced, name removed, password destroyed, status `DELETED`, `anonymisedAt` set | The account can never be signed into again |
| Credit ledger, payments, payouts | **Retained**, no longer linked to a person | Dutch bookkeeping obligation (7 years) |

This split — erase the person, keep the accounting — is the standard reading of
art. 17(3)(b). **It needs legal confirmation for this specific product.**

**Rectification (art. 16).** Guardians edit their family data directly.

**Retention.** `DATA_RETENTION_DAYS` (default 365) is the configured retention
for closed accounts. **The scheduled hard-erasure job is not implemented** —
erasure today is on request. This is an open item.

## 9. Notifications we refuse to send

`notify()` only emails **transactional** categories: account, booking confirmed
or cancelled, waitlist promotion, session reminder, provider verification,
provider announcement, incident, safeguarding.

There is no category for streaks, "you haven't booked this week", "3 parents are
looking at this activity", or re-engagement drips — and no code path that could
send one. Manufacturing urgency around a parent's decisions about their child is
a pattern this product declines to build.

## 10. Threat model — what we defend, and what we don't

**Defended:** credential stuffing and brute force; session theft from a database
leak; a provider reading another provider's families; a stranger finding a
child's home neighbourhood or a provider's home address; a forged or replayed
payment webhook; oversold sessions and double-charged credits; tampering with
financial or audit history; enumeration of accounts and tenants; a guardian
reviewing a session they never attended; an adult opening a direct channel to a
child.

**Not defended, and honestly so:** malware in an uploaded document; a hostile
administrator (they can do damage — but every action is in an immutable audit
log); a compromised host; denial of service beyond in-process rate limits; a
provider lying on their application (only a human document review stands in the
way); anything requiring the legal and operational work listed in
`SAFEGUARDING.md` §7.

## 11. Open items before production

1. Legal review of privacy policy, terms, processor agreements, and the lawful
   basis for processing children's data.
2. A DPIA — mandatory in practice for a platform processing children's data at
   scale.
3. Antivirus/content scanning for uploads.
4. Distributed rate limiting and a WAF.
5. The scheduled retention/erasure job.
6. Centralised logging, alerting on `auth.login_failed` spikes and on
   safeguarding events, and a tested breach-notification runbook.
7. A penetration test and a WCAG 2.2 AA accessibility audit.
8. Backups with tested restores, and encryption at rest for the database and the
   media store.
