# Research methodology

Written 2026-09-12.

## Why this file exists

The dominant failure mode in e-commerce "research" is fluent confidence: a
document that reads like analysis but whose numbers came from nowhere. That
failure is expensive, because the numbers get used to justify spending money.
This methodology exists to make that failure detectable.

## The standard

### 1. Triangulation
No material commercial conclusion rests on one source. A trend asserted by a
single "top trending products" blog post is not evidence — those posts are SEO
inventory, frequently recycled year to year, and they are written by people with
an incentive for you to start a store. A trend is only accepted when independent
signals agree, ideally of different kinds: search behaviour, marketplace
behaviour, competitor investment, and consumer conversation.

### 2. Source hierarchy
Preferred, in descending order:

1. Primary data: official statistics (CBS, Eurostat), regulator publications,
   company filings, platform-published data
2. Primary observation: the actual supplier pricing page, the actual competitor
   product page, the actual marketplace bestseller list — fetched and read
3. Credible secondary: established trade press, research firms citing method
4. Community signal: Reddit, forums, Trustpilot — excellent for *complaints and
   objections*, weak for sizing
5. Rejected: dropshipping listicles and affiliate content farms, used only as a
   pointer to something worth verifying elsewhere

### 3. Every claim is tagged
`FACT` (sourced, linked, dated) / `ESTIMATE` (reasoning shown) / `ASSUMPTION`
(chosen, recorded) / `UNVERIFIED` (names the access required).

### 4. Fabrication is prohibited
No invented search volumes, sales figures, supplier terms, margins, conversion
rates, ROAS, review counts or competitor revenue. Where a number is genuinely
needed and genuinely unavailable, the correct output is `UNVERIFIED — requires
X`, not a plausible-looking placeholder presented as knowledge.

This is not pedantry. A fabricated supplier cost propagates directly into a
break-even ROAS, which propagates into an advertising budget, which is real
money lost.

### 5. Disconfirmation is mandatory
For each surviving candidate we actively search for the reason it is a bad idea:
the complaint threads, the failed competitors, the regulatory catch, the reason a
bigger player has not already taken it. Research that only finds supporting
evidence has not been done.

## Known limitations of this research environment

Recorded so conclusions can be discounted appropriately.

- **The web search tool is US-biased.** The venture targets EU markets. Results
  skew to US sources and US consumer behaviour. EU applicability is flagged
  wherever it is uncertain, and EU-specific sources are sought directly.
- **No keyword tool.** There is no Semrush, Ahrefs or Keyword Planner access, so
  there are **no search-volume figures anywhere in this project**. Search demand
  is assessed qualitatively (trend direction, SERP composition, ad presence) and
  every quantitative keyword claim is marked `UNVERIFIED`.
- **No Meta Ads Library / TikTok Creative Center scraping.** Competitor ad
  activity is assessed only where publicly documented.
- **No supplier contact.** All sourcing economics are placeholders until quoted.
- **Point-in-time.** Regulation in particular moves. Everything is dated;
  anything load-bearing is re-verified at implementation time.

## How the evidence ledger works

`research/evidence-ledger.md` is the append-only record. Every entry carries an
ID, and downstream documents cite the ID rather than restating the evidence. If a
strategy document makes a claim with no ledger ID behind it, the claim is
unsupported by construction and should be challenged.
