# SkillPass

**Eén abonnement voor lokale activiteiten voor kinderen (6–17).**
**One subscription for local activities for children (6–17).**

SkillPass is een marktplaats waarop ouders met maandelijkse credits activiteiten
boeken bij geverifieerde clubs en docenten in hun eigen stad. Deze repository
bevat een werkende MVP: database, applicatie, seed-data, tests en documentatie.

SkillPass is a marketplace where parents use monthly credits to book activities
with verified local clubs and instructors. This repository contains a working
MVP: database, application, seed data, tests and documentation.

> **Test-/mockmodus — test/mock mode.** Betalingen, e-mail, opslag en kaarten
> draaien standaard op ingebouwde mock-adapters. Er wordt geen echt geld
> verwerkt en er gaat geen enkel verzoek naar een derde partij.
> Payments, email, storage and maps run on built-in mock adapters by default.
> No real money is processed and no request leaves the machine.

---

## Nederlands

### Wat het doet

| Rol | Wat kan die? |
| --- | --- |
| Ouder/verzorger | Account aanmaken, kindprofielen (leeftijdsgroep, interesses, toegankelijkheid), zoeken, boeken met credits, annuleren, wachtlijst, beoordelen, gegevens exporteren of laten wissen |
| Kindprofiel | Bestaat alleen binnen het gezin. Geen login, geen openbare pagina, geen berichten |
| Aanbieder | Aanmelden met bedrijfsgegevens, verzekering en veiligheidsbeleid; locaties, activiteiten en sessies beheren; aanwezigheid aftekenen; bezetting en geschatte omzet zien |
| Medewerker aanbieder | Alleen binnen de eigen organisatie, met rolgebonden rechten (eigenaar / manager / begeleider) |
| Beheerder / safeguarding officer | Aanbieders verifiëren, incidenten en zorgdossiers behandelen, terugbetalingen, credits bijstellen, auditlog en platformstatistieken |

### Snel starten

```bash
cd skillpass
cp .env.example .env                  # werkt zoals hij is; vul echte secrets in voor productie
docker compose up -d                  # PostgreSQL 16 op poort 5432
npm install
npm run db:migrate                    # migraties toepassen
npm run db:seed                       # launchstad, 12 aanbieders, 32 activiteiten
npm run dev                           # http://localhost:3000
```

Geen Docker? Wijs `DATABASE_URL` naar een bestaande PostgreSQL 16-database.

### Demo-accounts

Wachtwoord voor **alle** onderstaande accounts: `SkillPass!2026`
(alleen voor ontwikkeling; zie [Bekende beperkingen](#bekende-beperkingen-en-productierisicos)).

| E-mail | Rol |
| --- | --- |
| `guardian@skillpass.local` | Ouder, twee kinderen (Nour 9–11, Sami 12–14), actief abonnement met credits |
| `guardian2@skillpass.local` | Mede-verzorger in hetzelfde gezin |
| `provider@skillpass.local` | Manager bij Sportclub De Vechtstroom |
| `instructor@skillpass.local` | Begeleider — mag alleen aanwezigheid aftekenen |
| `owner.<slug>@skillpass.local` | Eigenaar van elke aanbieder, bijv. `owner.makerslab-utrecht@skillpass.local` |
| `admin@skillpass.local` | Platformbeheerder |
| `safeguarding@skillpass.local` | Safeguarding officer (enige die zorgdossiers mag lezen) |

### Demonstratieroute

1. Log in als `guardian@skillpass.local` → **Ontdekken** → zoek `Turnen`.
2. Open *Turnen voor beginners*: je ziet de locatie **bij benadering**.
3. Kies Nour en boek. Credits worden afgeboekt; het exacte adres verschijnt nu.
4. Log uit, log in als `provider@skillpass.local` → **Aanbieder** → **Aanwezigheid** → *Aanwezig*.
5. Log weer in als de ouder → **Boekingen** → schrijf een beoordeling.
6. Log in als `admin@skillpass.local` → **Beheer** → verificatiewachtrij, incidenten, auditlog.

---

## English

### Getting started

```bash
cd skillpass
cp .env.example .env
docker compose up -d
npm install
npm run db:migrate
npm run db:seed
npm run dev            # http://localhost:3000
```

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server on port 3000 |
| `npm run build` / `npm start` | Production build and server |
| `npm run typecheck` | `tsc --noEmit` over the whole project |
| `npm run db:migrate` | Apply migrations (`prisma migrate deploy`) |
| `npm run db:seed` | Rebuild the demo dataset (destructive) |
| `npm run db:reset` | Drop, re-migrate and re-seed |
| `npm test` | Vitest: 97 integration tests **including the production build** |
| `SKIP_BUILD_TEST=1 npm test` | Same, skipping the slow build test |
| `npm run test:e2e` | Playwright: 28 browser journeys (seeds the database first) |

`npm test` needs `TEST_DATABASE_URL` to point at a **separate** database — the
suite truncates it between tests. `.env.example` ships with
`skillpass_test` configured; create it once with
`createdb skillpass_test` (or `docker compose exec postgres createdb -U skillpass skillpass_test`).

### Mock providers — running without any credentials

Every external dependency sits behind a port with an offline implementation.
`GET /api/health` reports which one is active.

| Adapter | Default | What the mock does | Real alternative |
| --- | --- | --- | --- |
| Payments | `mock` | Hosted checkout page at `/checkout/mock` that posts an **HMAC-signed webhook** to the real webhook endpoint — signature verification and idempotency run exactly as in production | `stripe` (test mode) |
| Email | `mock` | Writes messages to `./storage/outbox/*.txt` and mirrors them into the in-app notification centre | ESP of your choice |
| Storage | `local` | Files under `./storage/media`, never publicly served, reachable only through short-lived signed URLs | S3-compatible |
| Maps / geocoding | `mock` | Offline gazetteer for the launch region plus a haversine distance; the map is a server-rendered SVG so no tile request carries a visitor's IP | OpenStreetMap / Mapbox |

Because the mock payment provider signs its webhooks the same way a PSP does,
the payment path is genuinely exercised in tests, not stubbed out.

### Project layout

```
skillpass/
├── prisma/                 schema, migrations, seed (seed-data.ts holds the catalogue)
├── src/
│   ├── app/                Next.js App Router: /[locale]/… pages, /api/… routes, server actions
│   ├── components/         shared UI primitives, navigation, offline map
│   ├── lib/                env, database, crypto, sessions, RBAC, audit, rate limiting, i18n
│   │   └── adapters/       payments · email · storage · geo (ports + mock/real drivers)
│   └── modules/            domain: auth · family · catalog · booking · billing · reviews ·
│                           notifications · safeguarding · admin
├── tests/                  Vitest integration tests against a real PostgreSQL
└── e2e/                    Playwright journeys against a production build
```

### Languages

Dutch and English are equal citizens:

* Every page lives under `/nl/…` or `/en/…`; `/` negotiates from `Accept-Language`.
* Interface strings live in `src/lib/i18n/dictionaries.ts`; a test asserts both
  dictionaries have identical key sets.
* Activity content is translated per row in `ActivityTranslation`. **An activity
  cannot be published without both a Dutch and an English version.**
* All 32 seeded activities carry both languages.

### Documentation

| File | Contents |
| --- | --- |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Module boundaries, data model, concurrency, i18n, testing strategy |
| [MARKETPLACE_AND_PAYMENTS.md](MARKETPLACE_AND_PAYMENTS.md) | Plans, credit ledger, commissions, refunds, payouts, webhooks |
| [SAFEGUARDING.md](SAFEGUARDING.md) | Verification, the no-contact rule, incident and safeguarding workflow |
| [SECURITY_AND_PRIVACY.md](SECURITY_AND_PRIVACY.md) | Authentication, RBAC, tenancy, data minimisation, retention, GDPR rights |
| [PRODUCT_DECISIONS.md](PRODUCT_DECISIONS.md) | Decisions taken, alternatives rejected, assumptions, open questions |
| [.env.example](.env.example) | Every configuration option with a working default |

---

## Bekende beperkingen en productierisico's
## Known limitations and production risks

These are real gaps, not polish items. **SkillPass is not ready to take real
families, real children or real money without addressing them.**

1. **Legal review is outstanding.** Terms, privacy policy, the processor
   agreements with providers, and the age at which a child may hold any data at
   all under the Dutch UAVG/GDPR have not been reviewed by a lawyer.
2. **Verification is manual and not conclusive.** A KVK number is
   format-checked, never looked up against the Chamber of Commerce register. An
   insurance policy number is a string. A **VOG** (Dutch certificate of conduct)
   is a *self-declaration*: nothing in this system proves anyone holds one.
   Screening obligations for people working with minors are the provider's legal
   responsibility and must be verified out of band before launch.
3. **Payments are test mode only.** Stripe Connect onboarding, KYC, payout
   scheduling, VAT treatment and chargeback handling are modelled, not
   implemented. The Stripe adapter warns when handed a live key.
4. **Email is not delivered.** `EMAIL_PROVIDER=smtp` intentionally throws;
   wire an ESP and handle bounces, unsubscribes and deliverability.
5. **File uploads are validated but not scanned.** Add antivirus/content
   scanning and image re-encoding before accepting provider documents.
6. **Rate limiting is in-process.** It protects a single instance only; move it
   to Redis before running more than one.
7. **Single-region assumptions.** Times are handled in the city's timezone
   (`Europe/Amsterdam`) and money in EUR; the schema supports more but the
   scheduling UI does not yet.
8. **Demo credentials are public.** `SkillPass!2026`, the seeded accounts and
   the placeholder secrets in `.env.example` are for development only. Generate
   real values (`openssl rand -hex 32`) before any deployment; the app refuses
   to start in production with the placeholder `SESSION_SECRET`.
9. **No moderation queue for review text.** Reviews are checked for a child's
   name and for embedded images, and can be hidden by an administrator, but
   there is no proactive moderation pipeline.
10. **Accessibility is designed for, not audited.** Semantic markup, labels,
    focus styles and colour contrast were built in; a WCAG 2.2 AA audit with
    assistive technology has not been done.
