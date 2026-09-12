# SEO

Written 2026-09-12.

## The gap you need to know about first

**There are no search volumes in this document, and there are none anywhere in
this project.** No Keyword Planner, Semrush or Ahrefs access existed, and web
page fetching was blocked, so no SERP could be inspected either
(`../ACCESS-AND-LIMITS.md`).

That rules out the normal first step. What follows is therefore **architecture
and a research protocol**, not a keyword plan. Anyone who hands you a Dutch
padel keyword list with volumes attached, produced under these conditions, has
made it up.

The keyword research itself is a two-hour job with Keyword Planner access, and
it is listed as a human action.

## What SEO is and is not for here

A realistic expectation matters more than a tactic list.

SEO will not launch this business. Cold search demand for an unknown brand's
padel bag is small, and ranking takes months this business does not have before
it needs its first orders. Padel clubs, community and paid social carry the
launch.

What SEO does earn, over six to twelve months, is **the cheapest recurring
traffic available** — which matters enormously given rising CPMs and a
subscription model that depends on customers coming back without being paid for
twice.

So: build the technical foundation now because it is nearly free, publish a small
amount of genuinely useful content, and expect compounding rather than launch
traffic.

## Intent map

Pages are mapped to intent, with one page per intent to avoid cannibalisation.
**Terms below are hypotheses, not researched keywords.**

| Intent | Page | Why this page owns it |
|---|---|---|
| Transactional — product | Product page | The money page |
| Commercial — category | Collection | "padel tas", "padel accessoires" class of query |
| Comparison | Comparison content | Captures "X vs Y" before a competitor does |
| Problem-aware | Guide: wet kit | The distinctive angle — likely low competition |
| Informational — beginner | Guide: what a beginner needs | Top of funnel, high assist value, low direct conversion |
| Informational — care | Guide: grip replacement | **Directly feeds the subscription.** The highest-value informational page here |
| Local | Club/court content | Genuinely defensible against foreign competitors |
| Brand | Homepage, about | Cheap to hold, easy to lose to marketplace listings |

The grip-replacement guide deserves emphasis. Someone searching how often to
change an overgrip is stating the exact problem the subscription solves. That is
the rare informational page with a direct commercial line, and it should be
written first.

## Technical foundation — do this before content

Already built into the theme:

- Canonical URLs, semantic heading hierarchy, breadcrumbs
- `hreflang` emitted from Shopify's published locales rather than hand-maintained,
  so alternates stay correct as markets are added
- Organization, Product and Breadcrumb structured data
- **Review markup that fails closed** — emitted only behind a genuine non-zero
  rating count, because fake review markup is both a Google violation and an
  unfair commercial practice in the EU
- Image `alt` on every image, enforced by a test
- Core Web Vitals budget: <50 KB JS, zero third-party scripts, explicit image
  dimensions, one prioritised LCP image per template

Still to do, and requiring a store: XML sitemap submission, `robots.txt` review,
Search Console verification, and an indexation check after launch.

## Content plan — deliberately small

Roughly one substantial piece a month, not thirty thin ones.

Mass-produced AI content is a poor fit for this business specifically: the brand
differentiator is that we understand playing in wet Dutch weather better than a
Spanish incumbent does. That claim is destroyed by generic text, and it is proven
by specific text. **Ten pages that only we could have written beat two hundred
anyone could.**

| Month | Piece | Intent | Why |
|---|---|---|---|
| 1 | How often to change a padel overgrip | Care | Feeds the subscription directly |
| 2 | What to take to your first padel session | Beginner | Broad entry, strong internal-link hub |
| 3 | Keeping kit dry: playing padel in Dutch weather | Problem | The brand thesis, in article form |
| 4 | Padel bag buying guide | Commercial | Captures comparison intent |
| 5 | Outdoor vs indoor padel in the Netherlands | Local | Defensible; foreign sites cannot write it credibly |
| 6 | Grip types explained | Care | Supports the subscription and reduces support contact |

Every piece links to the hero product and to the subscription. Every piece is
written from a real understanding of the sport, or not published.

## The research protocol to run once tools exist

1. Seed from actual customer language — support emails, club conversations, and
   the questions asked at demo days. This beats a tool for a niche this size.
2. Pull volumes for Dutch terms; repeat separately for Belgian Dutch, which
   differs.
3. Check SERP composition before targeting anything: if bol.com and Amazon
   occupy the first page for a transactional term, an unknown brand will not
   displace them — target the comparison and problem queries instead.
4. Record everything in the evidence ledger with dates, so drift is visible.

## Measuring it

Impressions and average position in Search Console, organic sessions and
**organic-assisted orders** — not organic last-click, which systematically
undercounts SEO's contribution in a business where discovery and purchase are
separated by weeks.

Review quarterly. Monthly SEO reporting at this scale measures noise.
