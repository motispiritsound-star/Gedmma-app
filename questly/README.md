# Questly

**Open the app, choose an adventure, put the device away, and experience something in the real world.**

Questly is a progressive web app that gives families a library of educational
missions to do *off* the screen: nature, science, movement, creativity, cooking,
practical skills, technology, entrepreneurship, family connection, social
contribution, and history and culture. A parent creates a family account, adds
child profiles, and the app suggests adventures that fit the children's ages,
interests, the weather, the time available and what is already in the cupboard.

It is deliberately not a blocker or a punishment app. It competes with the
screen by being more interesting than it, and it is honest about what it can
measure — see [What Questly does not do](#what-questly-does-not-do).

---

## Contents

- [What you get](#what-you-get)
- [What Questly does not do](#what-questly-does-not-do)
- [Technology](#technology)
- [Getting started](#getting-started)
- [Development accounts](#development-accounts)
- [Commands](#commands)
- [Environment variables](#environment-variables)
- [Testing](#testing)
- [Project layout](#project-layout)
- [Production deployment](#production-deployment)
- [Assumptions](#assumptions)
- [Known limitations](#known-limitations)
- [Further documentation](#further-documentation)

---

## What you get

A working product, not a scaffold. Every flow below is implemented end to end
and covered by tests.

**For parents**

- Account creation with e-mail verification and a session-based sign-in.
- Family onboarding: family name, environment (city / suburb / countryside),
  child profiles, interests and adventure preferences.
- A personalised feed of suggested adventures, each with the reasons it was
  suggested ("Matches an interest in cooking", "Suitable for a rainy afternoon").
- A filterable library of 33 seeded adventures across 11 categories.
- **Adventure Mode**: a preparation checklist, a short countdown, one clear
  screen telling the family to put the device away, step-by-step instructions
  that can be read aloud by the browser, an optional timer, and offline
  resilience so an adventure survives a lost signal or a closed tab.
- Completion: who took part, how long it took (self-reported), one or two
  reflection questions, an optional private photograph, and parent approval.
- A family dashboard: completed adventures, skills practised, categories
  explored, per-child participation, badges, private memories and a printable
  certificate.
- A weekly planner.
- Data export (JSON) and a two-phase account deletion with a grace period.
- Dutch and English throughout, switchable at any time.

**For administrators**

- A quest editor with side-by-side Dutch and English translations, steps,
  materials, safety instructions, skills and age bands.
- Draft / publish / unpublish / archive / duplicate, with a version history of
  every material content change.
- A bilingual preview of exactly what a family will see.
- Aggregate, privacy-safe statistics; an audit log; a family and subscription
  overview. Administrators **cannot** open a family's photographs.

---

## What Questly does not do

This matters enough to say twice, and the app says it to users too:

- **It does not block apps and cannot measure device use.** A web application
  has no such capability, and Questly does not pretend otherwise. The only time
  it records is the number a family types in after an adventure, and the
  interface labels that as self-reported everywhere it appears.
- **It contains no addictive mechanics.** No infinite scroll, no daily streaks,
  no loot boxes, no leaderboards, no public popularity metrics, no artificial
  scarcity, no nagging notifications, and no reward for time spent in the app.
  Progress is earned by doing something real.
- **Children have no accounts.** A child profile is a nickname, an age band, an
  avatar and a few interests, owned by the parent. There is no child login, no
  messaging, no public profile and no precise location.

Interfaces are prepared for future native screen-time integrations
(see [FUTURE_MODULES.md](./FUTURE_MODULES.md)), but nothing claims a measurement
it cannot make.

---

## Technology

| Concern | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, React 19, Server Components and Server Actions) |
| Language | TypeScript 5.9 in strict mode, with `noUncheckedIndexedAccess` |
| Database | PostgreSQL 16 |
| ORM | Prisma 7 with the `@prisma/adapter-pg` driver adapter |
| Styling | Tailwind CSS 4 with a token-based design system |
| Validation | Zod 4, at every boundary |
| Auth | Session cookies, database-backed, scrypt password hashing (no native deps) |
| Testing | Vitest (unit + integration), Playwright + axe-core (end to end + accessibility) |
| PWA | Hand-written service worker and web app manifest |
| Payments | Provider abstraction: mock by default, Stripe test mode when configured |
| Media | Storage abstraction: local disk adapter, signed and access-checked URLs |

See [ARCHITECTURE.md](./ARCHITECTURE.md) for how the modules fit together and
[PRODUCT_DECISIONS.md](./PRODUCT_DECISIONS.md) for why these choices were made.

---

## Getting started

**Requirements:** Node.js 20.11+ (22 LTS recommended) and either Docker or a
local PostgreSQL 16.

```bash
cd questly
npm install
cp .env.example .env
```

**Start PostgreSQL** — with Docker:

```bash
docker compose up -d
```

…or point `DATABASE_URL` in `.env` at any PostgreSQL 16 you already run.
`docker-compose.yml` creates the user `questly`, password `questly`, database
`questly`, which matches the `DATABASE_URL` in `.env.example`.

**Create the schema and load the demo content:**

```bash
npm run db:migrate      # applies migrations (creates the schema)
npm run db:seed         # 33 quests, taxonomies, badges, demo family, admins
```

**Run it:**

```bash
npm run dev             # http://localhost:3000
```

Open <http://localhost:3000>, sign in with the parent account below, and the
whole journey is available. Nothing else needs configuring: with no Stripe key
and no AI credentials the app runs completely, using the mock payment provider
and the deterministic recommendation engine.

### Preparing to run the tests

The test suites use a second database whose name must end in `_test`:

```bash
createdb questly_test           # or: docker compose exec postgres createdb -U questly questly_test
cp .env.test.example .env.test  # adjust DATABASE_URL if your credentials differ
```

Both suites apply migrations and load the seed themselves; nothing else is
needed.

---

## Development accounts

Created by `npm run db:seed`. **They exist only for local development and are
rejected in production** — the seed refuses to run unless `ALLOW_SEED=true` and
`NODE_ENV` is not `production`.

| Role | E-mail | Password |
| --- | --- | --- |
| Parent (demo family, Premium) | `ouder@questly.test` | `AvontuurThuis2026` |
| Content administrator | `redactie@questly.test` | `RedactieQuestly2026` |
| Platform administrator | `admin@questly.test` | `BeheerQuestly2026` |

The demo family "Familie de Vries" has two child profiles in different age
bands (Noor, 6–8; Sem, 12–15), three completed adventures, one waiting for
approval, favourites and planned adventures.

---

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server on port 3000 |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint, zero warnings tolerated |
| `npm test` | Vitest: unit and integration suites |
| `npm run test:e2e` | Playwright: end-to-end and accessibility suites |
| `npm run verify` | typecheck → lint → unit/integration tests → build |
| `npm run db:migrate` | Create and apply a migration (development) |
| `npm run db:deploy` | Apply migrations (production) |
| `npm run db:seed` | Load taxonomies, 33 quests and the demo family |
| `npm run db:push` | Push the schema without a migration (prototyping only) |
| `npm run icons` | Regenerate the PWA icons from the Questly mark |
| `npm run retention:purge` | Purge expired deletions and old audit entries |

---

## Environment variables

Every variable is validated by `src/env.ts` at boot; the application refuses to
start with an invalid configuration rather than failing later. See
[`.env.example`](./.env.example) for the annotated list.

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `DATABASE_URL` | yes | — | PostgreSQL connection string |
| `SESSION_SECRET` | in production | dev fallback | Signs session and media tokens; ≥32 chars |
| `APP_URL` | no | `http://localhost:3000` | Absolute URLs in e-mails and redirects |
| `DEFAULT_LOCALE` | no | `nl` | Language when the visitor has no preference |
| `MEDIA_DRIVER` | no | `local` | `local` or `s3` (the S3 adapter is a stub) |
| `MEDIA_LOCAL_DIR` | no | `./.data/media` | Where the local adapter stores uploads |
| `MEDIA_URL_TTL_MINUTES` | no | `10` | Lifetime of a signed media URL |
| `MEDIA_MAX_UPLOAD_BYTES` | no | `8388608` | Upload size limit |
| `PAYMENT_DRIVER` | no | `mock` | `mock` or `stripe` |
| `STRIPE_SECRET_KEY` | with `stripe` | — | Stripe test-mode key |
| `STRIPE_WEBHOOK_SECRET` | with `stripe` | — | Webhook signature secret |
| `STRIPE_PREMIUM_PRICE_ID` | with `stripe` | — | Price for Family Premium |
| `EMAIL_DRIVER` | no | `console` | `console` writes e-mails to the log; `noop` for tests |
| `EMAIL_FROM` | no | `hello@questly.example` | Sender address |
| `AI_DRIVER` | no | `none` | `none` or `anthropic`; recommendations never require it |
| `ANTHROPIC_API_KEY` | with `anthropic` | — | Optional re-ranking provider |
| `RETENTION_DELETION_GRACE_DAYS` | no | `30` | Grace period before a deletion is executed |
| `RETENTION_AUDIT_LOG_DAYS` | no | `365` | How long audit entries are kept |
| `LOG_LEVEL` | no | `info` | `debug`, `info`, `warn`, `error`, `silent` |
| `ALLOW_SEED` | no | `false` | Must be `true` for the seed script to run |

Generate a session secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

---

## Testing

```bash
npm test          # unit + integration (Vitest, against questly_test)
npm run test:e2e  # end to end + accessibility (Playwright, production build)
```

Copy `.env.test.example` to `.env.test` first (see
[Preparing to run the tests](#preparing-to-run-the-tests)). Both suites prepare
their own database: migrations are applied with `prisma migrate deploy`, the
tables are truncated, and the seed is loaded. The
truncate **refuses to run unless the database name ends in `_test`**, so a
mis-set `DATABASE_URL` fails loudly instead of destroying data.

Playwright downloads its own browser on first run (`npx playwright install
chromium`). If your environment ships a Chromium build already, point
`PLAYWRIGHT_CHROMIUM_PATH` at it and Playwright will use that instead.

The suites map onto the acceptance criteria:

| Criterion | Where |
| --- | --- |
| A parent can register and create a family | `tests/integration/auth-and-family.test.ts`, `e2e/family-journey.spec.ts` |
| A parent can add a child profile | `tests/integration/auth-and-family.test.ts`, `e2e/family-journey.spec.ts` |
| Recommendations respect the age band | `tests/unit/recommendation-engine.test.ts`, `tests/integration/recommendations.test.ts` |
| A family can start and complete a quest | `tests/integration/quest-journey.test.ts`, `e2e/family-journey.spec.ts` |
| Completion requires parent approval where configured | `tests/integration/quest-journey.test.ts` |
| A badge is awarded only once | `tests/integration/quest-journey.test.ts` |
| Private evidence is unreachable by another family | `tests/integration/privacy-and-access.test.ts`, `e2e/private-media.spec.ts` |
| A non-admin cannot access admin routes | `tests/integration/privacy-and-access.test.ts`, `e2e/admin.spec.ts` |
| An admin can create and publish a quest | `tests/integration/admin-content.test.ts`, `e2e/admin.spec.ts` |
| Dutch and English render correctly | `tests/unit/localisation.test.ts`, `tests/integration/admin-content.test.ts`, `e2e/public-pages.spec.ts` |
| The app works without AI or Stripe credentials | `tests/unit/providers.test.ts`, `e2e/subscription-and-data.spec.ts` |
| Core pages meet basic accessibility checks | `e2e/accessibility.spec.ts` (axe-core, WCAG 2.2 AA rules) |

---

## Project layout

```
questly/
├── prisma/
│   ├── schema.prisma          # 30 models; see ARCHITECTURE.md
│   ├── migrations/            # SQL migrations, including a partial unique index
│   ├── seed.ts                # repeatable seed
│   └── seed-data/             # taxonomies and 33 bilingual quests
├── src/
│   ├── app/                   # routes: (public), (auth), (app), /admin, /api
│   ├── components/            # design system primitives and feature components
│   ├── modules/               # the modular monolith: one folder per domain
│   │   ├── admin/ audit/ auth/ email/ families/ localisation/
│   │   ├── media/ privacy/ progress/ quests/ recommendations/ subscriptions/
│   ├── lib/                   # crypto, db, logger, errors, rate limiting, forms
│   ├── styles/globals.css     # design tokens
│   └── env.ts                 # validated configuration
├── tests/                     # Vitest unit and integration suites
├── e2e/                       # Playwright specs
└── scripts/                   # icon generation, retention purge
```

---

## Production deployment

1. **Build and migrate.** `npm ci && npm run build`, then `npm run db:deploy`
   against the production database. Never run `db:seed` in production.
2. **Configuration.** Set `NODE_ENV=production`, a real `SESSION_SECRET` of at
   least 32 characters, `APP_URL`, and leave `ALLOW_SEED` unset. The app will
   refuse to boot without a valid session secret in production.
3. **Sessions and rate limits.** Sessions are stored in PostgreSQL and work
   across instances. The rate limiter is in-process: correct on a single
   instance, per-instance when scaled. Implement `RateLimitStore` against Redis
   before running more than one instance behind a shared login endpoint.
4. **Media.** The local disk adapter needs a persistent volume. For more than
   one instance, implement `MediaStorage` against S3 (the interface and a stub
   are in `src/modules/media/storage.ts`) and set `MEDIA_DRIVER=s3`.
5. **Payments.** Set `PAYMENT_DRIVER=stripe` with a test key first. A Stripe
   webhook endpoint still has to be added before real billing — see
   [Known limitations](#known-limitations).
6. **E-mail.** Replace the `console` driver with a transactional provider by
   implementing `EmailProvider`.
7. **Retention.** Schedule `npm run retention:purge` daily; it executes deletion
   requests whose grace period has expired and trims the audit log.
8. **TLS and headers.** Terminate TLS in front of the app. Security headers,
   including a strict Content-Security-Policy, are set in `next.config.ts`;
   session cookies become `Secure` automatically in production.
9. **Legal review.** Required before launch. See
   [SECURITY_AND_PRIVACY.md](./SECURITY_AND_PRIVACY.md).

---

## Assumptions

These were decided in the absence of a stakeholder to ask. Each is reversible.

1. **This app lives in `questly/`.** The repository already contained an
   unrelated project (Webscan NL) at its root; Questly was added alongside it
   rather than replacing anyone's work.
2. **Language is a cookie, not a URL prefix.** `/quests/leaf-detective` renders
   in the reader's language rather than `/nl/...` and `/en/...`. This keeps
   links shareable between a Dutch-speaking and an English-speaking parent in
   the same family. A URL prefix is the better choice once public SEO matters;
   the data model does not change. See PRODUCT_DECISIONS.md.
3. **Small taxonomies carry `nameNl`/`nameEn` columns** rather than separate
   translation tables. Adding a third language means a migration for these five
   tables; quests, which are the bulk of the content, need no change.
4. **Free plan = a rotating selection of eight free quests**, changing weekly on
   a deterministic ISO-week key, plus one child profile. Locked quests stay
   visible so the value of Premium is legible.
5. **Parent approval is on by default**, because the demographic starts at six
   years old. Families can switch it off in settings.
6. **Weather is an input, not an integration.** The recommendation engine takes
   "what is it like outside?" as a parameter; the MVP passes `ANY`. A weather
   API can be added without touching the engine.
7. **Quests ship without photography.** Each quest gets a generated landscape
   built from its category colour and a hash of its key: no stock photo
   licences, no network requests, and a library that still looks varied.
8. **Prices are illustrative** (€7.99/month for Family Premium).

---

## Known limitations

Honest list of what is not finished. None of it blocks the core journey.

- **No Stripe webhook handler.** The abstraction, the Stripe checkout call and
  the subscription mapping are implemented, but the webhook endpoint that makes
  Stripe authoritative is not. With `PAYMENT_DRIVER=mock` the confirmation page
  activates the plan directly, which is why the app is fully usable without
  Stripe. Do not take real payments until the webhook exists.
- **The S3 media adapter is a stub** that throws rather than pretending to work.
  The local adapter is complete.
- **Server-side validation messages are English-only.** Field-level messages
  from Zod are not translated; the messages users see most (sign-in failures,
  the deletion confirmation) are rendered in the user's language by the forms
  themselves.
- **The rate limiter is per-process.** See Production deployment, point 3.
- **E-mail verification is not enforced.** An unverified parent can use the app
  and is shown a persistent reminder. Gating features on verification is a
  product decision, not a technical gap.
- **No password reset flow.** The token type, the storage and the hashing all
  exist (`VerificationToken`, `TokenType.PASSWORD_RESET`); the UI does not.
- **Offline support is partial.** An adventure already opened stays readable and
  its progress is restored, and a service worker serves cached pages. Starting a
  *new* adventure requires a connection.
- **The AI provider is an interface, not a client.** `AnthropicAiProvider`
  implements the contract and logs that it is not wired up. The deterministic
  engine is the product; AI may only re-rank a valid result set, never invent
  content, and any future AI-generated content must pass human review before
  publication.
- **The school plan is a placeholder.** The plan exists in the data model and
  the pricing page says plainly that it is not available yet.
- **Accessibility is automatically verified, not manually audited.** Sixteen
  pages plus Adventure Mode pass axe-core against the WCAG 2.2 AA rule set with
  zero violations, and keyboard navigation is tested. Automated checks catch
  roughly a third of real barriers; a manual screen-reader audit is still owed.
- **No legal review.** See SECURITY_AND_PRIVACY.md.

---

## Further documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) — modules, data model, request flow
- [SECURITY_AND_PRIVACY.md](./SECURITY_AND_PRIVACY.md) — GDPR, children's
  privacy, consent, retention, content safety, incident response
- [PRODUCT_DECISIONS.md](./PRODUCT_DECISIONS.md) — decisions and their reasoning
- [FUTURE_MODULES.md](./FUTURE_MODULES.md) — the nine planned modules, their
  boundaries and integration points
