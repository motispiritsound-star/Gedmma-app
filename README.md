# Buurklus

Buurklus connects households in the Netherlands with tradespeople and service
companies. Someone describes a job — a room to paint, a leak under the sink, a
full renovation — and verified businesses reply with quotes. Households use
Buurklus for free; tradespeople pay a monthly subscription that includes a
quota of leads.

It ships in **Dutch** first and **English** second.

## What is here

```
apps/
  api/        Fastify + Prisma + PostgreSQL
  mobile/     Expo (React Native) for iOS and Android
  web/        The public website, generated from the shared catalogs
packages/
  shared/     Domain rules used by all three: locales, money, Dutch business
              identifiers, catalogs, validation schemas
docs/
  PRODUCT.md       The marketplace model and how the Dutch market shaped it
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
npm run db:seed            # 55 trades, 46 municipalities, 3 plans, demo accounts

npm run dev:api            # http://localhost:4000
npm run dev:mobile         # Expo — press i, a, or w for the browser
npm run dev:web            # the website on http://localhost:4300
```

The seeded demo accounts sign in with **0600000001** (household) and
**0600000002** (tradesperson). In development the API does not send a real SMS:
it logs the code and also returns it as `debugCode`, which the app prefills.

To point the app at an API that is not on localhost, edit `extra.apiUrl` in
`apps/mobile/app.json`.

## Tests

```bash
npm test          # 111 tests: 43 domain, 36 API integration, 16 app, 16 website
npm run typecheck
```

The API tests run against a real PostgreSQL database (`buurklus_test`, created
automatically) rather than mocks, because most of what is worth testing here —
credit accounting, awarding a job, the uniqueness of a KvK number — is enforced
by the database.

## How the business works

Tradespeople subscribe to one of three plans and receive **lead credits**.
Sending a quote spends one credit; if the customer withdraws the job before
awarding it, the credit comes back. Losing a job does not cost anything extra —
Buurklus charges for the lead, not the win.

| Plan | Price/month (excl. VAT) | Quotes | Trades | Municipalities | Head start |
|------|------------------------:|-------:|-------:|---------------:|-----------:|
| ZZP | € 39 | 15 | 2 | 1 | — |
| Vakman | € 89 | 50 | 5 | 3 | 15 min |
| Bedrijf | € 179 | 150 | 15 | all | 30 min |

A year costs ten months. Every new tradesperson gets a 14-day trial with 5
quotes and no payment details. 21% btw is added at invoicing.

See [docs/PRODUCT.md](docs/PRODUCT.md) for why it is built this way.

## Before going live

This is a working foundation, not a launched business. The commercial and legal
groundwork a Dutch marketplace needs is listed at the end of
[docs/PRODUCT.md](docs/PRODUCT.md) — company registration, VAT, the GDPR
paperwork, and the payment provider contract.
