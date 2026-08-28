# Khidma

Khidma (خدمة, "service") connects customers in Morocco with tradespeople and
service companies. A customer describes a job — a small painting job, a leak
under the sink, a full renovation — and verified professionals reply with
quotes. Customers use Khidma for free; professionals pay a monthly
subscription that includes a quota of leads.

The app ships in **French** first, **Arabic** second (right-to-left) and
**English** third.

## What is here

```
apps/
  api/        Fastify + Prisma + PostgreSQL
  mobile/     Expo (React Native) for iOS and Android
  web/        The public website, generated from the shared catalogs
packages/
  shared/     Domain rules used by all three: locales, money, Moroccan
              identifiers, catalogs, validation schemas
docs/
  PRODUCT.md       The marketplace model and how Morocco shaped it
  ARCHITECTURE.md  Data model, API surface, and the decisions behind them
```

## Running it

You need Node 20+ and PostgreSQL 16 (a `docker-compose.yml` is included if you
would rather not install it).

```bash
npm install

# Start PostgreSQL — skip if you already have one running
npm run db:up

cp apps/api/.env.example apps/api/.env
npm run db:migrate         # create the schema
npm run db:seed            # 57 trades, 34 cities, 3 plans, demo accounts

npm run dev:api            # http://localhost:4000
npm run dev:mobile         # Expo — press i, a, or scan the QR code
npm run dev:web            # the website on http://localhost:4300
```

The seeded demo accounts sign in with **0600000001** (customer) and
**0600000002** (professional). In development the API does not send a real SMS:
it logs the code and also returns it as `debugCode`, which the app prefills.

To point the app at an API that is not on localhost, edit `extra.apiUrl` in
`apps/mobile/app.json`.

## Tests

```bash
npm test          # 93 tests: 28 domain, 36 API integration, 16 app, 13 website
npm run typecheck
```

The API tests run against a real PostgreSQL database (`khidma_test`, created
automatically) rather than mocks, because most of what is worth testing here —
credit accounting, awarding a job, the uniqueness of a business identifier — is
enforced by the database.

## How the business works

Professionals subscribe to one of three plans and receive **lead credits**.
Sending a quote spends one credit; if the customer cancels before awarding the
job, the credit comes back. Losing a job does not cost anything extra — Khidma
charges for the lead, not the win.

| Plan | Price/month (excl. VAT) | Quotes | Trades | Cities | Head start |
|------|------------------------:|-------:|-------:|-------:|-----------:|
| Artisan | 249 MAD | 15 | 2 | 1 | — |
| Pro | 599 MAD | 50 | 5 | 3 | 15 min |
| Entreprise | 1 290 MAD | 150 | 15 | all | 30 min |

A year costs ten months. Every new professional gets a 14-day trial with 5
quotes and no card. 20% TVA is added at invoicing.

See [docs/PRODUCT.md](docs/PRODUCT.md) for why it is built this way.
