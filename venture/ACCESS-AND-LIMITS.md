# Access, limits and what "done" can mean in this environment

Written 2026-09-12. Read this before reading any other document in `venture/`.

This project was commissioned as "build a complete international Shopify
e-commerce business". A large part of that request is executable here. A
specific, enumerable part is not. This file draws that line honestly, because
every other document in this directory depends on the reader knowing which side
of the line they are standing on.

## What this session actually has

| Capability | Status | What it means |
|---|---|---|
| Web research (search + page fetch) | **Available** | Real sources, real URLs, verifiable |
| Local filesystem + Git | **Available** | Real code, committed and pushed |
| GitHub | **Available** | Branches, commits, PRs |
| Shopify Admin / Partner account | **NOT available** | No store exists, none can be created |
| Shopify CLI / theme push | **NOT available** | Theme code is written but never deployed |
| Supplier accounts / contact | **NOT available** | No quotes requested, none received |
| Google Ads / Merchant Center / GA4 | **NOT available** | No account, no feed, no tag |
| Meta / TikTok business accounts | **NOT available** | No pixel, no catalogue, no ads |
| Klaviyo or any ESP | **NOT available** | No flows deployed |
| Payment providers | **NOT available** | Nothing connected |
| Keyword tools (Semrush/Ahrefs/Keyword Planner) | **NOT available** | No search-volume figures |
| Domain registrar | **NOT available** | Nothing purchased |

There is no Shopify MCP server connected to this session and no credentials of
any kind were supplied. This was verified, not assumed.

## The consequence, stated plainly

**No Shopify store has been created, configured, or launched.** Nothing in this
repository has touched a live storefront, a live ad account, or a live supplier.

Anyone who reads these documents and pictures a running shop will be wrong. What
exists is the work that legitimately precedes a running shop, plus the code that
becomes one.

## What is therefore REAL in this repository

- **Research** with named sources, URLs and access dates. Verifiable by anyone.
- **Theme source code** — genuine Liquid/JSON that can be deployed by someone
  with store access. It is real software, and it is testable.
- **The unit-economics model** — real, executable code. It does not contain
  invented results; it computes results from inputs, and it refuses to return a
  verdict on inputs nobody has verified.
- **Runbooks** — exact, ordered configuration steps for the work that needs
  credentials, written so a human executes them without re-deriving decisions.

## What is explicitly NOT real, and is labelled as such throughout

- Supplier costs, MOQs and lead times. **No supplier was contacted.** Every
  figure of this kind is a placeholder awaiting a real quote.
- Search volumes, CPCs, CTRs, conversion rates, ROAS, CAC. **No advertising has
  run and no keyword tool was accessible.** Any such number here is an input
  assumption for a model, never a measurement.
- Competitor revenue and traffic.
- Any claim that tracking "works" — nothing was fired, so nothing was validated.

## The honest reading of the acceptance criteria

The commissioning brief (§51) lists acceptance criteria including "checkout has
been tested", "test purchase completed", "events work", "product feeds tested".

**None of those can be marked complete from here.** They require a store. This
project does not pretend otherwise, and `qa/launch-checklist.md` marks them
BLOCKED rather than passed. A checklist that lies about what was tested is worse
than no checklist.

## The evidence grading used everywhere in this directory

| Tag | Meaning |
|---|---|
| `FACT` | Sourced to a named, dated, linked source |
| `ESTIMATE` | Derived by stated reasoning from facts — reasoning always shown |
| `ASSUMPTION` | Chosen input, not derived. Recorded so it can be challenged |
| `UNVERIFIED` | Needed, not obtainable here. Names the access required |

If a statement in this directory carries a number and no tag, treat it as a
defect and report it.
