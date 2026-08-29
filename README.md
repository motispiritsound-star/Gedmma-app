# Buurklus

Buurklus connects households in the Netherlands with tradespeople and service
companies. Someone describes a job — a room to paint, a leak under the sink, a
full renovation — and verified businesses reply with quotes. Households use
Buurklus for free, and so, for now, do tradespeople: the platform launches
free on both sides while it fills up with work.

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
  PRIVACY.md       The processing register, and what the AVG needs that code
                   cannot provide
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

Tradespeople hold **lead credits**. Sending a quote spends one; if the customer
withdraws the job before awarding it, the credit comes back. Losing a job costs
nothing extra — Buurklus charges for the lead, not the win.

### Today: free

The only plan on sale is `gratis`: **€ 0**, 20 quotes a month, 5 trades, 3
municipalities, no card and no notice period. The quota is a brake on one
account replying to every job, not a paywall. It renews on its own each month,
lazily, the first time anyone looks at a lapsed subscription — no scheduler has
to be running for the platform to keep working.

The terms promise **30 days' notice** (`PRICING_NOTICE_DAYS`) before any account
starts costing money, and no account converts to paid without the holder
agreeing. The site, the app and the seed all read that from one place.

### Later: the paid tiers

Three paid plans are defined and switched off (`available: false`), so the
billing code has something real to run against and switching them on is a flag
rather than a rewrite:

| Plan | Price/month (excl. VAT) | Quotes | Trades | Municipalities | Head start |
|------|------------------------:|-------:|-------:|---------------:|-----------:|
| ZZP | € 39 | 15 | 2 | 1 | — |
| Vakman | € 89 | 50 | 5 | 3 | 15 min |
| Bedrijf | € 179 | 150 | 15 | all | 30 min |

A year costs ten months, a new tradesperson on a paid plan gets a 14-day trial,
and 21% btw is added at invoicing. Nothing outside `packages/shared/src/catalog/plans.ts`
may assume a paid plan exists — read `AVAILABLE_PLANS`, not `PLANS`.

The lead head start works the same way: it is derived from the plans on sale, so
while nothing buys an earlier look, no job is held back from anybody.

See [docs/PRODUCT.md](docs/PRODUCT.md) for why it is built this way.

## Privacy and the AVG

The rights side of the regulation is implemented rather than promised: an
explicit agreement at sign-up recorded with its version, a data export, an
erasure that anonymises instead of cascading a DELETE through seven years of
invoices, and a retention sweep that runs nightly.

One list drives all of it. `packages/shared/src/legal.ts` holds the document
versions, the retention periods with the reason for each, and the minimum age;
the published pages, the app and the sweep all read from it, so the privacy
statement cannot promise a deletion the code does not perform.

```bash
npm run retention -w @buurklus/api    # the nightly sweep
```

## The website

Eleven pages, generated from `@buurklus/shared`: a home page, a page for
professionals, a registration page and four legal documents, each in Dutch and
English. Everything a share needs is there — an Open Graph card per page and
language, a favicon, a manifest — and every asset comes from our own domain, so
opening a page contacts nobody.

```bash
npm run build -w @buurklus/web                # writes apps/web/dist
PUBLIC_API_URL=http://127.0.0.1:4000 \
  npm run build -w @buurklus/web              # point the form at a local API
node scripts/make-brand-assets.mjs            # redraw the share cards and icons
node scripts/make-explainer-video.mjs         # redraw the explainer video
```

### The explainer video

`scripts/explainer/` holds a scene that draws itself from one number — the time
in milliseconds. `make-explainer-video.mjs` walks that number forward a frame at
a time, screenshots each one and hands the sequence to ffmpeg, so nothing is
captured in real time: a slow machine produces the same file as a fast one and
no frame is ever dropped. The storyboard is the `SHOTS` array at the top of
`scene.js`, and the composition scales from a single `--u` unit, so the square
and vertical cuts are one design at two sizes rather than two layouts to keep
in step.

Output lands in `marketing/video/`, not in `apps/web/public/`: that directory is
copied wholesale into the built site, and no page links to the video, so it
would be seven megabytes shipped with every deploy for nothing.

| File | Size | Where it fits |
|------|------|---------------|
| `buurklus-square.mp4` | 1080×1080, 25s | LinkedIn, Facebook and Instagram feed |
| `buurklus-vertical.mp4` | 1080×1920, 25s | Stories, Reels, TikTok |
| `marketing/subtitles/buurklus-en.srt` | 9 cues | Upload beside the video where a platform takes one |
| `marketing/audio/buurklus-theme.wav` | 25s | The score on its own |

Both files carry the soundtrack and an English subtitle track that is **off
until a viewer switches it on** — the picture is Dutch, and captions burned on
by default would talk over it. ffmpeg's `-disposition` is accepted and then
ignored by its MP4 muxer, so the enabled bit on that track is cleared in the
file afterwards; `disableSubtitleByDefault` in the render script does it and
refuses to finish if it cannot find exactly one subtitle track.

The square cut is also copied into `apps/web/public/video/` with a poster frame
and a WebVTT track, for the section on the home page. That player is
`preload="none"`, so a visitor pays for one 60 kB frame and nothing else until
they press play.

### The music

`scripts/explainer/music.py` synthesises the score from scratch — a plucked
motif, a warm pad and a low pulse, following the same six shots as the picture.
Written rather than licensed: a stock track carries terms to re-check every time
the video is re-cut, and a piece thousands of other videos also use is a piece a
platform's content-ID will flag. This one belongs to the project.

The registration page is the one place the site asks for something: an email
address, a municipality, and for a business a KvK number and its trades. It
posts to `POST /v1/signups`, which is rate-limited, carries a honeypot, and
refuses anything without an explicit, unticked-by-default consent box. That is
the waiting list a marketplace needs before it opens: the first customer in a
municipality has to find somebody there.

Four documents are published in Dutch and English — terms of use, privacy
statement, disclaimer, cookie statement — generated from
`apps/web/src/legal/`. They are honest about what is not finished: there is no
registered company yet, so every page carries a visible box naming exactly which
details are missing. It disappears on its own once `OPERATOR` is filled in.

[docs/PRIVACY.md](docs/PRIVACY.md) holds the Article 30 processing register and
the list of things no amount of code will close — a company registration,
processing agreements, a breach procedure, and a jurist reading the documents.

## Before going live

This is a working foundation, not a launched business. The commercial and legal
groundwork a Dutch marketplace needs is listed at the end of
[docs/PRODUCT.md](docs/PRODUCT.md) and, for everything privacy-related, in
[docs/PRIVACY.md](docs/PRIVACY.md) — company registration, VAT, the processing
agreements, and the payment provider contract.
