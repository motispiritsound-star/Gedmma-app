# Questly

**Netflix for real-world adventures.** Questly gives families personalised
educational missions that are carried out *away* from the screen.

> Open the app, choose an adventure, put the device away and experience
> something in the real world.

The product does not block phones and does not punish children for using them.
It competes with passive screen time by offering something better: 32 seeded
quests across nature, science, movement, creativity, cooking, practical skills,
entrepreneurship, family connection, social contribution, and history and
culture — each written for a specific age band, with materials, safety notes,
step-by-step instructions and reflection questions, in Dutch and English.

---

## Contents

- [What is built](#what-is-built)
- [Technology](#technology)
- [Local installation](#local-installation)
- [Database setup](#database-setup)
- [Seeding demo data](#seeding-demo-data)
- [Development accounts](#development-accounts)
- [Running the tests](#running-the-tests)
- [Environment variables](#environment-variables)
- [Project layout](#project-layout)
- [Production deployment considerations](#production-deployment-considerations)
- [Assumptions](#assumptions)
- [Known limitations](#known-limitations)
- [Further documentation](#further-documentation)

---

## What is built

The complete core journey works end to end:

1. A parent registers, confirms their email address and creates a family.
2. They add child profiles — a nickname, an avatar, an age band (6–8, 9–11,
   12–15) and interests. No email address, no legal name, no date of birth.
3. They set practical preferences: available time, difficulty, indoor/outdoor,
   together or alone, and which materials they usually have at home.
4. The deterministic recommendation engine proposes quests and **explains each
   one in a sentence** ("Matches an interest in science", "Develops a skill not
   practised recently").
5. The family browses the library with filters for age band, duration,
   indoor/outdoor, weather, participants, category, skill, difficulty, required
   material and free/premium.
6. They open a quest, read the mission, the preparation checklist, the
   materials, the safety instructions and the steps.
7. **Adventure Mode** runs a short countdown, offers to read the instructions
   aloud, then shows one clear screen: *put the device away*. Nothing needs to
   be touched afterwards; the device is free to lock. The active quest is
   written to local storage so the steps stay readable without a connection.
8. The family finishes, records who took part and how long it took, answers the
   reflection questions, optionally adds a private photo and a private note.
9. A parent approves the completion (configurable per family).
10. Skills, badges, family milestones and a printable certificate follow. There
    are no leaderboards, no streaks and no infinite scroll.
11. Parents plan a week ahead in the weekly planner and review everything in the
    family dashboard.
12. Content administrators create, translate, preview, publish, duplicate and
    archive quests, with a full version history. Platform administrators see
    families, subscriptions and the audit log.

Everything runs with **no external services**: payments fall back to a local
mock provider, and the recommendation engine needs no AI.

---

## Technology

| Concern | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, React Server Components, Server Actions) |
| Language | TypeScript 5.9, `strict` plus `noUncheckedIndexedAccess` |
| Database | PostgreSQL 16 |
| ORM | Prisma 7 with the `@prisma/adapter-pg` driver adapter |
| Styling | Tailwind CSS 4 with a token-based design system |
| Validation | Zod 4 at every trust boundary |
| Authentication | Session cookies, tokens stored hashed, scrypt password hashing (no third-party auth dependency) |
| Unit and integration tests | Vitest 4 |
| End-to-end tests | Playwright 1.62 with `@axe-core/playwright` |
| PWA | Web app manifest, service worker, offline fallback |

The application is a **modular monolith**. See [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## Local installation

Requirements: Node.js 22+, and either Docker (for PostgreSQL) or a PostgreSQL 16
server you already run.

```bash
git clone <this-repository>
cd questly
npm install
cp .env.example .env
```

Generate the two secrets and paste them into `.env`:

```bash
node -e "console.log('SESSION_SECRET=' + require('crypto').randomBytes(32).toString('base64url'))"
node -e "console.log('MEDIA_SECRET='   + require('crypto').randomBytes(32).toString('base64url'))"
```

## Database setup

```bash
docker compose up -d          # PostgreSQL 16 on :5432, plus the two test databases
npm run db:migrate            # apply migrations (creates the schema)
```

Not using Docker? Create the databases yourself and point `DATABASE_URL` at
them:

```sql
CREATE ROLE questly LOGIN PASSWORD 'questly';
CREATE DATABASE questly      OWNER questly;
CREATE DATABASE questly_test OWNER questly;   -- unit and integration tests
CREATE DATABASE questly_e2e  OWNER questly;   -- end-to-end tests
```

## Seeding demo data

```bash
npm run db:seed
```

The seed is repeatable — run it as often as you like. It creates:

- 10 categories, 10 skills, 44 materials, 20 interests, 12 badges;
- **32 published quests**, at least 3 per category, each with Dutch and English
  translations, structured steps (also translated), materials, safety
  instructions and reflection questions;
- one demo family with two child profiles in different age bands, four approved
  completions, one completion awaiting approval, three favourites, three planned
  quests and the badges those earn;
- one platform administrator and one content administrator.

Then start the app:

```bash
npm run dev          # http://localhost:3000
```

## Development accounts

These are **development-only credentials**. They are printed by the seed and
must never appear in a production configuration.

| Role | Email | Password |
| --- | --- | --- |
| Parent (demo family) | `ouder@questly.test` | `QuestlyDemo!2026` |
| Platform administrator | `admin@questly.test` | `QuestlyAdmin!2026` |
| Content administrator | `redactie@questly.test` | `QuestlyRedactie!2026` |

The demo family is on Family Premium so the whole product is visible. To see the
free tier, open **Settings → Subscription** and choose *Back to Free*.

No email is sent in development: after registration the verification link is
shown on screen (`AUTH_SHOW_VERIFICATION_LINK`, off in production) and written to
the structured log.

## Running the tests

```bash
npm run typecheck      # tsc --noEmit
npm run lint           # eslint
npm test               # Vitest: unit + integration (uses questly_test)
npm run test:unit
npm run test:integration
npm run build          # production build
npm run test:e2e       # Playwright: builds, starts on :3100, uses questly_e2e
npm run verify         # typecheck + lint + vitest + build
npm run verify:all     # the above plus the end-to-end suite
```

The Vitest suite migrates and seeds `questly_test` once per run; the Playwright
suite does the same for `questly_e2e`. Neither touches your development
database.

### Running the end-to-end tests

Playwright downloads its own Chromium by default. In a sandbox that already has
one, point at it explicitly:

```bash
PLAYWRIGHT_CHROMIUM_PATH=/path/to/chrome npm run test:e2e
```

The end-to-end environment (`.env.e2e`) raises the authentication rate limit and
enables the on-screen verification link, because the suite drives one IP address
against a production build. The real limits are covered by unit tests.

## Environment variables

Every variable is validated at startup by `src/lib/env.ts`; the process refuses
to start with an invalid configuration. `.env.example` documents all of them.
The ones that matter most:

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `DATABASE_URL` | yes | — | PostgreSQL connection string |
| `SESSION_SECRET` | yes | — | Signs nothing directly; used to pseudonymise IPs in the audit log. Minimum 32 characters |
| `MEDIA_SECRET` | yes | — | Signs short-lived private media links. Minimum 32 characters |
| `APP_URL` | no | `http://localhost:3000` | Public base URL for links and payment redirects |
| `MEDIA_DRIVER` | no | `local` | `local` or `s3` (the S3 adapter is an interface only) |
| `MEDIA_MAX_BYTES` | no | `8388608` | Upload size cap |
| `MEDIA_URL_TTL_SECONDS` | no | `300` | Lifetime of a signed evidence link |
| `PAYMENT_PROVIDER` | no | `mock` | `mock` or `stripe`. Stripe additionally needs `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_FAMILY_PREMIUM` |
| `EMAIL_DRIVER` | no | `log` (dev) / `none` (prod) | No real provider is implemented |
| `AUTH_SHOW_VERIFICATION_LINK` | no | on outside production | Development convenience; never enable in production |
| `AI_PROVIDER` | no | `none` | Optional enhancement layer only; recommendations never depend on it |
| `RETENTION_*` | no | see `.env.example` | Deletion grace period, evidence and audit-log retention |
| `RATE_LIMIT_*` | no | see `.env.example` | Authentication and upload limits |

## Project layout

```
questly/
├── prisma/
│   ├── schema.prisma          # 33 models, indexes, constraints
│   ├── migrations/
│   ├── seed.ts                # repeatable seed
│   └── seed-data/             # taxonomy + 32 bilingual quests
├── src/
│   ├── app/                   # routes (marketing, auth, family, admin, api)
│   ├── components/            # design system and shared UI
│   ├── lib/                   # env, db, crypto, logging, rate limiting, errors
│   ├── modules/               # the modular monolith (see ARCHITECTURE.md)
│   └── server-actions/        # the write surface, one file per area
├── tests/                     # Vitest unit + integration
├── e2e/                       # Playwright
└── public/                    # manifest, icons, service worker
```

## Production deployment considerations

Before this goes anywhere near real families:

1. **Legal review is required.** Nothing here has been reviewed or certified.
   See [SECURITY_AND_PRIVACY.md](./SECURITY_AND_PRIVACY.md).
2. **Run behind TLS.** Session cookies are marked `Secure` when
   `NODE_ENV=production`; without HTTPS nobody can sign in.
3. **Set real secrets.** The app refuses to start in production with the
   build-time placeholders, but it cannot tell a weak secret from a strong one.
4. **Replace the in-process rate limiter** with a shared store (Redis) as soon as
   you run more than one instance. The `RateLimiter` interface is the only thing
   that needs a new implementation.
5. **Implement `S3MediaStorage`** (or another object store) and move
   `MEDIA_LOCAL_DIR` off the application filesystem. Keep the bucket private:
   bytes must keep flowing through the authenticated route.
6. **Implement an `EmailSender`.** Until then, email verification cannot be
   completed by a real user in production.
7. **Schedule `runDuePurges()`** (`src/modules/privacy`) so deletion requests are
   actually executed after the grace period, and add a job that trims audit logs
   to `RETENTION_AUDIT_LOG_DAYS`.
8. **Point Stripe at `/api/stripe/webhook`** and set the three Stripe variables.
   Without them the mock provider stays active and no money can move.
9. **Add a Content-Security-Policy** with a nonce. The baseline security headers
   are set in `next.config.ts`; a CSP needs per-deployment tuning.
10. **Back up PostgreSQL and the media store together.** They reference each
    other; a restore that mixes generations orphans evidence rows.

## Assumptions

These were decided without asking, and are all reversible. The reasoning is in
[PRODUCT_DECISIONS.md](./PRODUCT_DECISIONS.md).

- **The repository already contained an unrelated project** ("Webscan NL"), so
  Questly lives in the `questly/` subdirectory rather than replacing it.
- **Dutch is the default language**, English is fully supported, and the locale
  lives in a cookie rather than in the URL. Every UI string and all quest content
  exists in both languages.
- **A child profile is not an account.** There is no child login, and family mode
  is the only way a child uses the product.
- **Parent approval is on by default** and is a per-family setting.
- **The free plan sees a rotating selection of twelve quests per week**, derived
  deterministically from the ISO week number, plus one child profile. Premium
  quests are visible but locked, so the value is legible before you pay.
- **Weather is a signal, not a forecast.** A `WeatherProvider` interface exists;
  the shipped implementation derives a plausible condition from the season, so
  nothing depends on an external API.
- **Pricing** (€6.99/month for Family Premium) is a placeholder for the checkout
  flow, not a validated price point.
- **"Offline time" is what families report themselves.** It is labelled as an
  estimate everywhere it appears.

## Known limitations

Stated plainly, because pretending otherwise is the failure mode this product is
supposed to avoid.

- **Questly cannot measure total screen time** and does not block other
  applications. It measures sessions inside Questly and voluntary completions.
  Native iOS and Android screen-time integration is a future module.
- **No email is sent.** `EmailSender` has a logging implementation only.
- **The S3 media adapter is not implemented.** `MEDIA_DRIVER=local` is the only
  working driver; selecting `s3` throws a clear error rather than failing quietly.
- **Rate limiting is per process.** Correct for a single instance, insufficient
  behind a load balancer.
- **The school plan is a placeholder.** Entitlements exist; there is no school
  environment, no teacher dashboard and no class management.
- **Photo uploads are validated by magic bytes and size, not scanned.** There is
  no malware scanning and no image re-encoding.
- **Audit-log and evidence retention are configured but not enforced by a job.**
  `runDuePurges()` exists and is tested; nothing calls it on a schedule.
- **Accessibility is tested automatically, not manually.** Automated checks catch
  a minority of real problems; assistive-technology testing with real users is
  still needed.
- **Deletion is a scheduled purge, not an instant one.** During the grace period
  the data still exists so a mistaken request can be undone.

## Further documentation

| Document | What it covers |
| --- | --- |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Module boundaries, data model, request flow, extension points |
| [SECURITY_AND_PRIVACY.md](./SECURITY_AND_PRIVACY.md) | Threat model, child safety, GDPR considerations, retention, incident response |
| [PRODUCT_DECISIONS.md](./PRODUCT_DECISIONS.md) | Why the product works the way it does, including what was deliberately not built |
| [FUTURE_MODULES.md](./FUTURE_MODULES.md) | The nine planned modules, their boundaries and integration points |
