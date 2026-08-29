# Security and privacy

> **No legal review or certification has taken place.** This document describes
> what the software does. It is not a compliance statement, and a legal review is
> required before this product is used by real families.

Questly is used by children. That changes what is acceptable: the safe default is
to collect less, expose nothing, and make the parent the only account holder.

---

## What is collected, and what is not

| Subject | Collected | Deliberately not collected |
| --- | --- | --- |
| Parent | Email address, display name, password hash, locale, session metadata (hashed IP, truncated user agent) | Phone number, address, payment card details (Stripe holds those) |
| Family | A family name, language, country, a coarse environment (city / suburb / rural), preferences | Home address, postcode, coordinates, location history |
| Child | Nickname, avatar key, **age band**, interests | Email address, legal name, date of birth, photo of the child as profile picture, school, any contact detail |
| Activity | Which quests were started and completed, self-reported minutes, reflection answers, an optional private photo, a private family note | Anything about behaviour outside Questly; total device screen time |

Child profiles are **not accounts**. There is no child login, no public profile,
no discovery between families, no direct messages, no comments, no open
user-generated content and no advertising profile. Children's data is never sold.

An age band rather than a date of birth is enough to choose age-appropriate
content, and it is one of the few places where the privacy-preserving option is
also the better product decision: nobody has to update a birthday.

---

## Parental consent

Registration requires an explicit, unbundled confirmation that the person is a
parent or guardian, is 18 or older, and consents to creating child profiles
within the family account. The checkbox is required by the schema
(`registerSchema.consent`), not only by the browser, so the account cannot be
created by posting the form without it. The consent event is recorded in the
audit log as part of `user.registered`.

Children never interact with the account boundary: the parent adds, edits and
removes profiles.

---

## Authentication

- **Passwords** are hashed with scrypt (`N=2^15, r=8, p=1`, 64-byte key, random
  16-byte salt per password), encoded as `scrypt$N$r$p$salt$hash`. Verification
  is constant-time (`timingSafeEqual`). Minimum length is 12 characters, with no
  forced composition rules, following NIST SP 800-63B; obvious throwaway
  passwords are rejected.
- **Sign-in is timing-safe against enumeration.** An unknown email address is
  compared against a dummy hash so the response takes the same time as a wrong
  password, and the error message is identical in both cases.
- **Sessions** are 256-bit random tokens in an `httpOnly`, `SameSite=Lax` cookie,
  marked `Secure` in production. Only the SHA-256 hash is stored, so a database
  leak does not hand out live sessions. Sessions expire after
  `SESSION_TTL_HOURS` (14 days by default) and are deleted on sign-out and on a
  deletion request.
- **Email verification tokens** are 256-bit, stored hashed, single-use, and
  expire after 24 hours. Issuing a new one consumes every outstanding token.

## Authorisation

Role-based access control has three roles — `PARENT`, `CONTENT_ADMIN`,
`PLATFORM_ADMIN` — and one family role (`OWNER` / `GUARDIAN`).

Checks are layered rather than centralised in a single middleware:

- the admin layout refuses non-administrators;
- **every** admin server action calls `requireRole()` again, so a stale page
  cannot be used to act;
- every family-scoped service re-checks ownership against the database, not
  against the request. `submitCompletion` verifies each selected child profile
  belongs to the caller's family; `readEvidenceFor` compares the evidence's
  family to the session's family and logs the denial.

A platform administrator can see that a family exists, its plan and its counts.
The admin queries select those fields only: family notes, reflections and
evidence are not reachable from the admin interface. A support flow that could
reach private media would need to be a separate, individually audited feature.

## Private media

Evidence photos are private by default and never served from a public URL.

1. Uploads are validated by **magic bytes**, not by the browser's declared
   content type. Only JPEG, PNG and WebP are accepted, capped at
   `MEDIA_MAX_BYTES` (8 MB).
2. The storage key embeds the family and completion ids, so a stray object can
   always be traced back and purged. Local files are written `0600`, and the
   path is resolved and checked against the storage root so a crafted key cannot
   escape it.
3. Reading requires **two** independent checks: a session whose family owns the
   evidence, *and* an unexpired HMAC signature bound to
   `(evidenceId, familyId, expiry)`. Links expire after
   `MEDIA_URL_TTL_SECONDS` (5 minutes).
4. Responses carry `Cache-Control: private, no-store`,
   `X-Content-Type-Options: nosniff` and
   `Content-Security-Policy: default-src 'none'; sandbox`.
5. Cross-family attempts are recorded in the audit log with
   `outcome: denied_cross_family`.

Uploading is never required to complete a quest, and the interface says so.

## Rate limiting

Fixed-window limiting on the sensitive endpoints:

- authentication: `RATE_LIMIT_AUTH_MAX` per `RATE_LIMIT_AUTH_WINDOW_SECONDS`
  (10 per 5 minutes), keyed **both** by IP and by email address, so one shared IP
  cannot be used to spray a single account and one client cannot spray many
  accounts;
- uploads: `RATE_LIMIT_UPLOAD_MAX` per family (20 per 10 minutes).

The limiter is in process memory. That is correct for a single instance and
insufficient behind a load balancer — see "Known limitations".

## Audit logging

`AuditLog` records the actor, their role, the action, the target, the family, a
pseudonymised IP (HMAC-SHA256, truncated) and a metadata payload. Sensitive
administrative actions are covered, including quest creation and publication,
subscription changes, approvals, evidence uploads and **denied** evidence
reads — plus reading the family overview and the audit log itself.

Writing an audit entry never throws: losing a line must not break the user's
action, but the failure is always logged so the gap is visible.

Log output is structured JSON with a redaction list covering passwords, tokens,
secrets, cookies, email addresses, reflection answers and family notes.

## Other application hardening

- Zod validation at every trust boundary; query parameters are parsed with
  `.catch(undefined)` so a hostile URL degrades to "no filter" rather than an
  error page.
- Prisma parameterises every query; there is no raw SQL outside the health check.
- Server Actions are POST-only and origin-checked by Next.js, which covers CSRF
  for the write surface. The mock upgrade confirmation is a form submission
  rather than a GET, so a stray link cannot change a plan.
- Security headers in `next.config.ts`: `X-Content-Type-Options`,
  `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`,
  and a `Permissions-Policy` denying camera, microphone and geolocation.
- Environment validation refuses to start in production with placeholder
  secrets, or with `PAYMENT_PROVIDER=stripe` and no key.
- The Stripe SDK is imported lazily, so it is never loaded without credentials.
- Secrets are read only through `src/lib/env.ts`; none appear in client bundles.

---

## GDPR considerations

Not legal advice. This is how the implementation maps onto the obligations that
matter most for a family product.

**Lawful basis.** Consent for the child data, given by the parent at
registration and recorded. Contract for the parent's own account data.

**Data minimisation (Art. 5(1)(c)).** Enforced in the schema, not in policy:
`ChildProfile` has no column for an email address or a date of birth, so the
minimising choice is the only one available to a future developer.

**Right of access and portability (Art. 15, 20).**
`GET /api/family/export` returns the whole family — parents, children,
preferences, subscription, completions, reflections, notes, evidence metadata,
favourites, planned quests and badges — as a structured JSON file. The export is
itself audited.

**Right to erasure (Art. 17).** A deletion request schedules a purge
`RETENTION_DELETION_GRACE_DAYS` ahead (30 days), signs every session out
immediately, and can be cancelled during the grace period. `purgeFamily()`
deletes stored media first (the only data outside the database) and then the
family row, with cascades handling everything below it. Audit entries survive
with the actor detached, so the record *that* a deletion happened is not itself
deleted.

**Storage limitation (Art. 5(1)(e)).** `RETENTION_DELETION_GRACE_DAYS`,
`RETENTION_EVIDENCE_DAYS` and `RETENTION_AUDIT_LOG_DAYS` are configuration.
`runDuePurges()` implements the deletion side and is tested; **no scheduler calls
it yet**, and evidence and audit trimming are not implemented.

**Security of processing (Art. 32).** See the sections above.

**Processors.** Stripe is the only third party, and only when configured. It
receives an email address and a family identifier. No analytics, advertising or
tracking SDK is present anywhere in the application.

**Transfers.** With `MEDIA_DRIVER=local` and `PAYMENT_PROVIDER=mock`, no personal
data leaves the deployment.

---

## Children's privacy

Beyond the GDPR baseline, the design rules that protect children specifically:

- no child account, no child login, no password for a child;
- nicknames only, validated to reject strings that look like addresses, URLs or
  long number sequences such as a year or postcode;
- no photo of a child is used as an avatar — avatars are a fixed set of animals;
- no public profile, no leaderboard, no visibility to other families;
- no messaging of any kind, so there is no channel for a stranger to reach a
  child;
- no precise location, ever. The coarsest useful signal (city / suburb / rural)
  is what the recommendation engine gets;
- no behavioural profiling for advertising, and no advertising.

---

## Content safety

- Every seeded quest carries structured safety instructions at three severities
  (`INFO`, `WARNING`, `CRITICAL`) and an explicit
  `requiresAdultSupervision` flag, both shown before the quest starts and again
  on the relevant step.
- Quests that involve tools, heat, sharp objects or contact with people outside
  the family are marked as requiring an adult, and the step that needs one is
  flagged individually.
- Content administration is role-gated and versioned: every content change writes
  an immutable `QuestVersion` snapshot with an author and a change note.
- New quests are created as `DRAFT` and are invisible to families until a human
  publishes them. This is the review gate that any future AI-assisted authoring
  must also pass through — the `ContentDraftProvider` interface exists precisely
  so that generated content lands in the same drafting queue.
- There is no user-generated public content, so there is nothing to moderate
  between families. Family notes, reflections and photos are visible only inside
  the family that wrote them.

## Anti-addiction design

Treated as a safety property rather than a style preference. Not implemented, on
purpose: infinite scroll, loot boxes, public rankings, punishing daily streaks,
artificial scarcity, manipulative notifications, popularity metrics, pressure to
upload photos, and rewards for time spent inside the app.

The free plan's rotating selection is deterministic per ISO week: the same family
sees a stable list all week, and refreshing cannot produce a better roll. It is a
fairness device, not a slot machine.

Every progress mechanic rewards a completed real-world activity, and "offline
time" is labelled as a family's own estimate everywhere it appears.

---

## Incident response

A minimal but real plan for a small team.

1. **Detect.** Structured JSON logs carry `rate_limit.blocked`,
   `user.sign_in_failed`, `audit.write_failed`, `evidence.viewed` with
   `denied_cross_family`, and `media.read_failed`. Alert on a rise in denied
   cross-family reads or in failed sign-ins for one account.
2. **Contain.** Revoke sessions with
   `DELETE FROM "Session"` (all) or `destroyAllSessionsFor(userId)` (one
   account). Rotating `SESSION_SECRET` does not invalidate sessions — tokens are
   hashed, not signed — so deleting rows is the containment step. Rotating
   `MEDIA_SECRET` invalidates every outstanding media link immediately.
3. **Assess.** Query `AuditLog` by `familyId`, `actorUserId` or `action` to
   establish what was reached and by whom. Evidence reads and denials are both
   recorded.
4. **Notify.** A personal-data breach involving children is high risk by
   default: assume notification to the Dutch DPA within 72 hours and to affected
   parents without undue delay, and take legal advice on the specific facts.
5. **Recover.** Restore PostgreSQL and the media store from the same generation;
   a mixed restore orphans evidence rows.
6. **Learn.** Add a regression test. Every security fix in this codebase should
   arrive with one, as the cross-family media tests do.

**Reporting a vulnerability.** There is no public disclosure address yet. Add a
`SECURITY.md` with a monitored contact before launch.

---

## Known limitations

Ordered by how much they would matter in production.

1. **Email is never delivered.** `EmailSender` has only a logging
   implementation, so a real user cannot complete verification in production.
2. **Rate limiting is per process.** Behind a load balancer the effective limit
   multiplies by the number of instances.
3. **The S3 media adapter is not implemented.** Local disk is the only working
   driver, which does not survive a container restart.
4. **Retention is configured but not enforced.** `runDuePurges()` exists and is
   tested; nothing schedules it. Evidence and audit-log trimming are not
   implemented at all.
5. **No Content-Security-Policy.** The other baseline headers are set; a CSP
   needs a nonce and per-deployment tuning.
6. **Uploads are validated, not scanned.** No malware scanning, no image
   re-encoding to strip metadata. EXIF data — including any GPS coordinates a
   camera wrote — is stored as uploaded. Stripping it is a small, high-value
   addition.
7. **No two-factor authentication** and no account-recovery flow beyond
   verification.
8. **Sessions are not bound to a device or IP**, and there is no "sign out
   everywhere" in the interface.
9. **No brute-force lockout** beyond rate limiting, and no notification to the
   account holder on a suspicious sign-in.
10. **Accessibility is tested automatically only.** Automated rules catch a
    minority of real barriers.
11. **No penetration test, no dependency-scanning pipeline, no legal review.**
