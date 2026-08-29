# Security and privacy

> **This document is not a legal opinion and Questly has not been certified
> against any standard.** It describes what the software actually does today.
> A qualified lawyer must review the product, its privacy statement, its
> retention schedule and its lawful basis for processing children's data before
> it launches. Several items below are flagged as unfinished.

Questly processes data about children. That makes privacy a functional
requirement, not a policy document, and it is implemented as one: the checks
described here are enforced in code and covered by tests.

---

## 1. Data minimisation

What Questly stores about a child, in full:

| Field | Why | Note |
| --- | --- | --- |
| Nickname | To address the child in the interface | Free text; the schema rejects e-mail addresses and URLs |
| Age band | To filter age-appropriate quests | `6-8`, `9-11`, `12-15` — **not** a date of birth |
| Avatar key | Visual identity | One of eight drawings; never a photograph of the child |
| Interests | To rank suggestions | A handful of slugs from a fixed list |
| Participation | To show progress | Which completions the child took part in |

What is **not** stored: e-mail address, legal name, date of birth, gender,
school, address, coordinates, device identifiers, IP address in the clear,
biometrics, or anything derived from an advertising identifier.

Families supply an *environment type* (city, suburb, countryside) rather than a
location, because that is all the recommendation engine actually needs.

## 2. No child accounts, no public surface

- A child profile is a record inside a family, not an account. There is no child
  login and no way to authenticate as a child.
- There is no directory, no search across families, and no public profile page.
- There is no messaging of any kind — no direct messages, no comments, no
  forums, no sharing between families.
- There is no user-generated content visible to anyone outside the family that
  created it.
- There is no leaderboard, no ranking and no public popularity metric.

## 3. Parental consent

- Only an adult can create an account; the registration form requires an
  explicit confirmation that the person is the parent or legal guardian of the
  children they will add, and that they consent to the processing described in
  the privacy overview.
- The consent checkbox is validated server-side (`z.literal(true)`), so
  registration fails without it regardless of what the browser sends.
- Every child profile is created by an authenticated parent, and the creation is
  recorded in the audit log.

**Unfinished:** the consent record is the account's existence plus the audit
entry. A production launch in the EU should store the consent version, the
timestamp and the text agreed to, and re-request consent when that text changes.

## 4. Private by default

Uploading a photograph is optional, and the interface says so plainly rather
than nudging: no progress bar counts it, no badge rewards it, no reminder asks
for it.

Every upload is private to the family that made it, enforced by two independent
checks that must **both** pass on every read:

1. **A signed, expiring URL.** `/api/media/{id}?expires=…&signature=…` where the
   signature is an HMAC-SHA256 over `evidenceId.familyId.expiry`. Default
   lifetime: ten minutes. This defeats link guessing and enumeration.
2. **A live ownership check.** The route resolves the caller's session and
   confirms the evidence belongs to their family.

Neither is sufficient alone: the signature stops guessing, the session check
stops a copied link. Both are covered by tests — including a Playwright test
that hands the exact signed URL to a second family (403) and to a signed-out
visitor (401), and tampers with the signature (403).

**Administrators have no access to family photographs.** This is not a policy;
there is no code path that would allow it. The admin family overview shows
counts and dates only.

## 5. Upload validation

- The content type is decided by the file's **magic bytes**, never by the
  browser's `Content-Type` header. JPEG, PNG and WebP only.
- Size is capped (`MEDIA_MAX_UPLOAD_BYTES`, 8 MB by default).
- Storage keys are generated server-side and re-validated against traversal
  (`..`, absolute paths, unexpected characters) before touching the filesystem.
- Files are written with mode `0600`.
- Uploads are rate limited per user.
- Media responses carry `Cache-Control: private, no-store` and
  `X-Content-Type-Options: nosniff`.

**Unfinished:** no malware scanning, and no EXIF stripping. EXIF from a phone
camera can contain GPS coordinates. Stripping metadata on upload should be added
before launch; the hook belongs in `modules/media/service.storeEvidence`.

## 6. Authentication

- Passwords are hashed with **scrypt** (N=16384, r=8, p=1, 64-byte key, 16-byte
  random salt) from Node's standard library. No plaintext or reversible form is
  ever stored, and the logger redacts password-shaped keys.
- Minimum length is twelve characters with a deny-list of the passwords
  attackers try first — length over composition rules, following current NIST
  guidance.
- Session tokens are 256 bits of CSPRNG output. Only the SHA-256 of the token is
  stored, so a database leak does not hand over live sessions.
- Cookies are `httpOnly`, `SameSite=Lax`, and `Secure` in production.
- Ten failed sign-ins lock an account for fifteen minutes. A sign-in for an
  unknown address still performs a hash comparison, so response time does not
  reveal whether an account exists.
- Changing a password invalidates every other session.

## 7. Role-based access control

Four roles, checked at every entry point rather than by URL pattern:

| Role | Can |
| --- | --- |
| Parent | Everything within their own family, and nothing outside it |
| Content admin | Create, edit, publish and archive quests; see aggregate statistics |
| Platform admin | The above, plus users, subscriptions and the audit log |
| (no session) | Public pages only |

Guards (`requireUser`, `requireFamily`, `requireAdmin`, `requirePlatformAdmin`)
are the first statement of every server action, API route and protected page.
Family-scoped queries always filter on `familyId` from the session — never from
a request parameter. Cross-family isolation is covered by integration tests for
completions, planned quests, evidence and approvals.

## 8. Rate limiting

| Endpoint | Limit |
| --- | --- |
| Sign in | 10 per 10 minutes, per IP + e-mail |
| Registration | 20 per hour, per IP |
| Upload | 30 per hour, per user |
| Mutations | 240 per minute |

**Known limitation:** the counters live in process memory. That is correct for a
single instance and degrades to per-instance when scaled horizontally. The
`RateLimitStore` interface exists so a Redis-backed implementation can be
dropped in without touching call sites — do that before running more than one
instance.

## 9. Audit logging

Sensitive actions are recorded: registration, sign-in (including failures),
sign-out, e-mail verification, child profile create/update/delete, evidence
upload/access/delete, every quest content action, subscription changes, data
export, deletion requests, and administrative access to the family overview.

Each entry holds the actor, their role, the action, the entity, a small metadata
object, a **hashed** IP address and a truncated user agent. Audit entries never
contain the contents of a family's private material. Writes that fail are logged
but never propagate: an audit failure must not break the action it describes.

Entries are retained for `RETENTION_AUDIT_LOG_DAYS` (365 by default) and trimmed
by the retention job.

## 10. Data subject rights

**Access and portability.** `/api/family/export` returns everything the platform
holds about the family as readable JSON: the family, its parents, child profiles
and their interests, subscription, favourites, planned adventures, badges, and
every completion with its reflections, notes and photograph metadata. Binary
files are listed by id, type and size rather than embedded.

**Erasure.** Deletion is two-phase:

1. The parent types `DELETE`, which marks the user and family as deleted and
   destroys every session immediately. Nothing is reachable from that moment.
2. After `RETENTION_DELETION_GRACE_DAYS` (30 by default), `npm run
   retention:purge` removes the stored media objects and hard-deletes the
   family. Cascades remove children, completions, reflections, evidence,
   favourites, planned quests, badges and the subscription.

The grace period exists so an accidental or coerced deletion can be undone —
signing in again during the window cancels it. Both phases are covered by tests,
including verification that the media objects are actually gone from storage.

**Rectification.** Parents can edit the family, every child profile and every
preference at any time.

## 11. Retention

| Data | Retention |
| --- | --- |
| Account and family | Until deletion is requested, then the grace period |
| Completions, reflections, notes | Life of the family account |
| Photographs | Life of the family account, or until deleted individually |
| Sessions | 30 days, pruned on sign-in and by expiry |
| Verification tokens | 24 hours, single use |
| Audit log | `RETENTION_AUDIT_LOG_DAYS` (365 by default) |

`npm run retention:purge` executes both schedules and is intended to run daily
from cron.

## 12. Content safety

- Quests are authored by content administrators and cannot be published without
  both a Dutch and an English translation and at least one step.
- Every quest carries structured safety instructions with a severity
  (`INFO`, `CAUTION`, `ADULT_REQUIRED`), rendered prominently on the quest page
  and again inside Adventure Mode before the family sets off.
- Quests that require an adult are flagged on the card, on the detail page and
  per step. A test asserts that every quest marked `requiresAdult` carries an
  `ADULT_REQUIRED` safety instruction.
- Seeded content avoids unsupervised risk: knives, heat, tools and taking
  appliances apart are all gated behind explicit adult supervision, and the
  neighbourhood activities require an adult present and restrict invitations to
  people the family already knows.
- No quest asks a child to contact a stranger, publish anything, or share
  personal details.
- **Any future AI-generated content must pass human review before publication.**
  The AI provider interface may only re-rank an already-valid result set; it
  cannot introduce content, and the publishing gate is a human action recorded
  in the audit log.

**Unfinished:** there is no in-product flagging flow for families to report a
quest they consider unsafe. The `Quest` status machine supports unpublishing
immediately; the reporting UI does not exist yet.

## 13. Transport and browser hardening

Set for every response in `next.config.ts`:

- `Content-Security-Policy` — `default-src 'self'`, no third-party origins,
  `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`.
  `'unsafe-eval'` is present in development only.
- `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` — camera, microphone, geolocation and interest cohorts
  all denied.
- The service worker never caches `/api/*`, so private media and exports are
  never written to a shared cache.

TLS termination is the deployment's responsibility. `Strict-Transport-Security`
should be added at the edge.

## 14. Secrets

- All configuration is validated at boot by `src/env.ts`; the application
  refuses to start with an invalid configuration rather than failing later.
- `SESSION_SECRET` is mandatory in production and must be at least 32
  characters. The development fallback is explicitly labelled as such and is
  rejected when `NODE_ENV=production`.
- The structured logger redacts values under keys named like `password`,
  `token`, `secret`, `authorization`, `cookie`, `apiKey` and `email`.
- No secret is committed. `.env` is git-ignored; `.env.example` documents the
  shape without values.
- Demo credentials exist only in the seed script, which refuses to run unless
  `ALLOW_SEED=true` and `NODE_ENV` is not `production`.

## 15. GDPR considerations

Aimed at a Dutch launch. Reviewed positions, not legal advice:

- **Lawful basis.** Consent given by the holder of parental responsibility. The
  Netherlands sets the digital consent age at 16, so a parent consents for every
  child in Questly's range.
- **Controller.** The operator of the service. Families are data subjects.
- **Special categories.** None are collected. There is no health, biometric or
  belief data, and free-text fields (family notes, reflections) are private to
  the family and never used for profiling.
- **Profiling.** Recommendations are a deterministic score over declared
  interests, age band and completion history. There is no automated decision
  with legal or similarly significant effect, and no advertising profile.
- **International transfers.** None by default: no third-party service receives
  personal data in the MVP configuration. Adding Stripe or a mail provider
  introduces processors that need agreements and a transfer assessment.
- **Data protection by design.** Minimisation, private-by-default media, no
  child accounts, coarse age bands, hashed IPs and a documented retention
  schedule are implemented in code, not policy.
- **DPIA.** A data protection impact assessment is very likely required, because
  the service processes children's data at scale. It has not been done.

## 16. Incident response

The MVP has the technical means; the organisational process must be written
before launch.

**Detection.** Structured JSON logs on stdout, an audit log of sensitive
actions, and `/api/health` for liveness and database readiness. There is no
alerting integration yet.

**Containment.**

| Situation | Action |
| --- | --- |
| A session is suspected compromised | Delete the row from `Session`; the user is signed out instantly |
| An account is compromised | Reset the password (invalidates every session), or set `deletedAt` |
| A signed media URL leaks | Rotate `SESSION_SECRET` — every outstanding signature becomes invalid |
| Unsafe content is published | Unpublish or archive the quest; it disappears from every family view |
| Credential stuffing | The per-IP and per-account limits apply automatically; block at the edge if sustained |

**Notification.** Under GDPR, a personal data breach must be reported to the
Autoriteit Persoonsgegevens within 72 hours, and to the data subjects when the
risk to their rights is high. Given that the subjects are children, assume the
threshold is met. Named responsibilities, a contact address and a decision log
must exist before launch.

**Recovery.** Restore PostgreSQL from backup (backups are the deployment's
responsibility) and re-run `npm run db:deploy`. Media lives outside the
database and needs its own backup.

## 17. Summary of known gaps

1. No Stripe webhook handler — do not process real payments yet.
2. No EXIF stripping on uploaded photographs.
3. No malware scanning of uploads.
4. Rate limiting is per-process; not safe for multi-instance deployment as is.
5. No password reset flow (the token type and storage exist; the UI does not).
6. E-mail verification is not enforced, only prompted.
7. No consent versioning record.
8. No in-product content reporting flow for families.
9. No DPIA, no legal review, no penetration test.
10. Accessibility is automatically verified against WCAG 2.2 AA rules on sixteen
    pages plus Adventure Mode, but has not been manually audited with a screen
    reader.
