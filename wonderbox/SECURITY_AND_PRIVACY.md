# Security and privacy

WonderBox holds data about children. This document states what is held, why,
for how long, and what is deliberately not held.

---

## What is not collected

Starting here, because it is the shortest list and the most load-bearing:

- **No voice recordings.** The microphone is off. There is no audio-upload
  endpoint and no table to store recordings in.
- **No advertising or analytics.** No third-party script loads on any page. The
  CSP-adjacent headers deny camera and geolocation outright.
- **No behavioural profiling.** Progress events resume a chapter and tell a
  parent what happened. They do not feed a recommender or a segment.
- **No public profiles, messaging or social features.** A child cannot be
  contacted through WonderBox — there is no mechanism and no identifier.
- **No child accounts.** A `ChildProfile` is a preference bundle: a name, a
  birth *year*, interests, accessibility settings. No credentials, no email.
- **No IP addresses in the clear.** Where an address is needed for rate
  limiting or audit, an HMAC of it is stored instead.

## Identity and sessions

Passwords are hashed with **scrypt** (`N = 2¹⁵`, 16-byte salt, 64-byte key),
from Node's standard library — no native module to compile, no supply-chain
surface. Verification is constant-time. A login for an unknown account still
performs a hash, so a missing account and a wrong password take the same time.

Sessions are server-side and opaque. The cookie carries 256 random bits; the
database stores only its SHA-256, so a dump of the sessions table hands out
nothing. Cookies are `httpOnly`, `sameSite=lax`, and `secure` in production.

Expired sessions are removed by `pruneExpiredSessions()`, and again by the
retention sweep.

## Roles

```
                family  address  order  content  approve  inventory  support  audit
PARENT            own     own     own      –        –         –         –       –
CONTENT_EDITOR     –       –       –      yes       –         –         –       –
CONTENT_APPROVER   –       –       –       –       yes        –         –       –
OPS                –      read    all      –        –        yes        –       –
SUPPORT           read    read    all      –        –         –        yes      –
ADMIN             yes     yes     yes     yes      yes       yes       yes     yes
```

The rule that matters: **a content editor has no permission that touches a
family, an address or an order.** Someone writing a story about a balloon rocket
cannot look up where a child lives. This is not a hidden navigation link — the
permission does not exist for the role, and `tests/roles.test.ts` enumerates the
whole matrix rather than spot-checking it, so adding a permission and forgetting
to think about content roles fails the suite.

Ops holds `address.read` because packing a parcel requires an address, and
holds nothing else about a family. Writing content and approving it are separate
roles, and an author cannot approve their own work even holding both.

Guards come in two flavours on purpose: `requirePermission()` throws (an API
route wants a 401), `requirePermissionPage()` redirects (a page wants a login
form). Mixing them up is how a bookmark becomes a stack trace.

## Authorisation of a child's data

Every read of progress or content re-derives the family from the session and
scopes the query to it. There is no endpoint that takes a family id from the
caller.

- `requireBoxOwnership(activatedBoxId, familyId)` gates every play route.
- `syncProgress()` refuses events for a box another family owns, and refuses
  events for a chapter that is not in that box.
- `buildSummary()` returns null rather than another family's summary.
- Audio is served only if the family owns a box whose journey contains the
  chapter, **and** that chapter has a published version.

## Activation codes

Twelve characters of Crockford base32 without `I`, `L`, `O` or `U` — 60 bits of
entropy, and no character a child can misread aloud.

Only `HMAC-SHA256(pepper, code)` is stored, plus the last four characters for
support conversations. An operator with database access cannot read a live code
off a screen and claim someone else's box.

The endpoint is not an oracle: a code that exists but has not shipped returns
`notOwned`, the same as a code belonging to another family. Ten wrong guesses
against a specific code lock it to `rateLimited`.

**Trade-off:** rotating `ACTIVATION_CODE_PEPPER` invalidates every printed code.
That is the cost of not storing them.

## Private object storage

Audio, invoices and shipping labels are never publicly addressable. Callers get
a short-lived signed reference — key plus expiry, HMAC-signed, five minutes by
default — that the application resolves.

The local driver refuses any key that resolves outside its root, so a crafted
key cannot walk up the filesystem. The S3 driver would return a presigned URL
from the same `sign()` method.

`/api/audio/*` is `private, no-store`. Signed storage links are
`private, max-age=240` — cacheable by the browser and the service worker for
less than the signature's life, never by a shared cache.

## Consent

`ConsentRecord` is per family, granted by a named adult, versioned against a
policy version, and revocable. Revoking does not erase: the old record is marked
`revokedAt` and a new one is written, so the history of what was agreed and when
survives an audit.

`TERMS` and `PRIVACY` are captured at sign-up. `MARKETING_EMAIL` and
`SPEECH_TO_TEXT` are opt-in and default to absent.

## Speech to text

Designed, documented, and **off**.

Two independent switches, both of which must be on:

1. `SPEECH_TO_TEXT_ENABLED` — an operator-level kill switch, `false` by default.
   A family consent cannot override it.
2. A `SPEECH_TO_TEXT` consent record for that family, granted by an adult.

`speechToTextAllowed()` checks both and is the only way the feature can turn on.
`hasMicrophone` on a device defaults to `false` in the protocol schema.

If it is ever implemented, the contract stated here is: audio is transcribed and
**discarded immediately** — `SPEECH_TO_TEXT_RETENTION_MINUTES` defaults to `0` —
the recording never leaves the server, only the recognised choice key is stored,
and a parent can revoke at any time from `/account/privacy`.

No transcription provider is wired up. The consent machinery exists so the
feature cannot be added later without it.

## Retention

| Data | Kept | Why |
| --- | --- | --- |
| Progress events | 400 days (`PROGRESS_EVENT_RETENTION_DAYS`) | Resume a chapter; a year of summaries |
| Parent summaries | Indefinitely | Snapshotted monthly, so they survive the events they came from |
| Audit log | 730 days (`AUDIT_LOG_RETENTION_DAYS`) | Incident reconstruction |
| Sessions | Until expiry, then swept | — |
| Invoices | 7 years | Dutch bookkeeping law |
| Voice recordings | Never stored | — |

`runRetentionSweep()` is the job. Summaries are snapshotted monthly precisely so
raw events can age out without a parent losing their history.

## Export and deletion

**Export** (`/api/privacy/export`) returns every record held about a family as
one JSON document — users, children, addresses, subscriptions, orders,
shipments, invoices, activated boxes, progress events, summaries, consents,
support cases. It notes explicitly that voice recordings are absent because none
are ever stored. Taking a copy is itself audited.

**Deletion** (`/account/privacy`, confirmed by typing `DELETE`):

- **Removed:** child profiles, progress events, parent summaries, activated
  boxes, consent records, sessions. Support cases are detached from the family
  and their bodies replaced.
- **Revoked:** every activation code, so the boxes cannot be re-claimed.
- **Retained:** invoices, because seven years of bookkeeping is not optional,
  and the audit log.
- **Anonymised, not dropped:** the user row becomes
  `deleted+<id>@wonderbox.invalid` / "Deleted account", with `deletedAt` set and
  the family link cleared. The row survives so retained financial records still
  point somewhere.

`tests/privacy.test.ts` asserts each half of that, including that a bystander
family is untouched and that the audit metadata contains counts rather than the
content that was removed.

## Audit

Anything an operator does to someone else's data writes an `AuditLog` line:
actor, role, action, entity, and metadata that is **ids and enums only** —
never personal data. Account creation, orders, refunds, cancellations, box
activation, content submission, approval, publication, consent changes, exports
and deletions are all covered.

Reading the audit log is `ADMIN` only.

## Input validation

Zod at every boundary: environment (parsed once, at boot, or the process
refuses to start), server actions, API bodies, and every protocol frame.

Server actions re-derive the family from the session and never trust an id in a
form. Scoped deletes carry the family in the `where` clause, so the
authorisation *is* the query.

The production build refuses the development session secret, and refuses
`PAYMENT_PROVIDER=stripe` without a key. It skips those checks during
`next build`, which serves no traffic, so a developer can still build from a
fresh checkout.

## Transport and headers

`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
`Referrer-Policy: strict-origin-when-cross-origin`, and a `Permissions-Policy`
that denies camera, geolocation and interest cohorts outright while allowing the
microphone only same-origin — for the opt-in path above.

`poweredByHeader` is off. TLS is the deployment's responsibility.

## Threat model

| Threat | Mitigation |
| --- | --- |
| Guessing an activation code | 60 bits of entropy; per-code attempt limit; non-revealing errors |
| Claiming someone else's box | Code bound to a family at payment; ownership checked on activation |
| Reading another family's progress | Family scoped into every query from the session |
| Downloading unapproved content | Publication gate on the API, the page **and** the audio route |
| Session theft from a database dump | Only SHA-256 of the token is stored |
| Operator reading live codes | Only a peppered HMAC is stored |
| Content editor browsing families | Permission does not exist for the role |
| Webhook forgery | Timestamped HMAC verified before anything is written |
| Duplicate charges | Unique idempotency key on orders and at the provider |
| Overselling under load | Conditional UPDATE under a row lock |
| Storage path traversal | Keys resolved and rejected outside the storage root |
| Stale cached order or address | Never cached; service worker excludes those paths |

## Not covered by this MVP

- **No 2FA, no password reset, no email verification flow.** `emailVerified`
  exists on the model; nothing sets it.
- **No rate limiting on login.** Activation attempts are limited; sign-in is
  not. A production deployment needs one at the edge.
- **No CSP header.** The application loads no third-party script, so one would
  be straightforward — it is simply not written.
- **No encryption at rest beyond the database's own.** Addresses and names are
  stored in plain columns.
- **No penetration test.** Nothing here has been reviewed by anyone but its
  author.
