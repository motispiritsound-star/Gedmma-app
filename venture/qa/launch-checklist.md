# Launch readiness checklist

Updated 2026-09-12.

## How to read this

The commissioning brief (§51) set acceptance criteria including "checkout has
been tested", "test purchase completed", "events work" and "product feeds
tested". **Those require a Shopify store, and no store exists or can be created
from this environment** (`../ACCESS-AND-LIMITS.md`).

So this checklist uses four states and does not fudge them:

| State | Meaning |
|---|---|
| **DONE** | Actually completed and verifiable in this repository |
| **BLOCKED** | Cannot be done without access this environment does not have |
| **OPEN** | Could be done here, not yet done |
| **HUMAN** | Requires a decision, a signature, or money |

A checklist that marks blocked items as passed is worse than no checklist,
because it converts an unknown into a false assurance. The honest headline:

> **The venture is NOT launch-ready. It is decision-ready, pending four
> verifications that cost almost nothing and one that costs money.**

---

## Commercial

| | Item | State | Note |
|---|---|---|---|
| ☑ | Market opportunity evidence-supported | **DONE** | Only cleanly triangulated candidate in a 48-item long-list (E-006) |
| ☑ | Product selection passed a scorecard | **DONE** | 80.0, first under all five weightings tested |
| ☐ | Unit economics passed stress tests | **BLOCKED** | Engine returns `INDICATIVE ONLY` — 37.5% of inputs need a supplier quote |
| ☐ | Supplier has credible backup options | **BLOCKED** | **No supplier has been contacted.** Scorecard template ready |
| ☑ | Offer is economically rational | **DONE** | Set-as-entry-SKU is forced by the arithmetic, not chosen for merchandising |
| ☑ | Initial markets prioritised | **DONE** | NL only, then BE. EPR cost drives the sequence (D-006) |
| ☐ | Retail price band observed | **BLOCKED** | No retailer page could be opened. **Costs 30 minutes with a browser and unblocks the whole economic model** |

## Brand

| | Item | State | Note |
|---|---|---|---|
| ☑ | Distinct positioning exists | **DONE** | Climatic gap: incumbents are Spanish and design for dry weather |
| ☑ | Messaging and tone defined | **DONE** | Numbers over adjectives; exclusions published alongside promises |
| ☑ | No competitor copying | **DONE** | Principles extracted; no design, copy or asset reproduced |
| ☐ | Name cleared | **HUMAN** | POLDER is a **candidate only**. BOIP/EUIPO classes 18/25/28 unchecked — "polder" is a common noun and may be refused or conflict |
| ☐ | Domain and handles secured | **HUMAN** | No lookup possible. Nothing registered |
| ☐ | Visual identity produced | **OPEN** | Direction documented; assets not made |

## Shopify

| | Item | State | Note |
|---|---|---|---|
| ☑ | Theme built | **DONE** | OS 2.0, 15 automated checks passing |
| ☑ | Mobile-first architecture | **DONE** | Section order from Baymard-derived research |
| ☑ | Accessibility standards applied | **DONE** | WCAG 2.2 AA targeted; focus, contrast, target size, semantics enforced by tests |
| ☑ | Performance budget enforced | **DONE** | <50 KB JS, zero third-party scripts, tested |
| ☐ | Theme validated by `shopify theme check` | **BLOCKED** | CLI needs a store. **Shopify's docs were also unreachable — treat first deploy as validation** |
| ☐ | Store configured | **BLOCKED** | No store |
| ☐ | Metafield definitions created | **BLOCKED** | Specified in `../shopify/README.md`; several components render nothing without them |
| ☐ | Products created with original content | **BLOCKED** | No store, and no product exists to photograph |
| ☐ | Checkout tested | **BLOCKED** | |
| ☐ | Test order completed | **BLOCKED** | |
| ☐ | Shipping rates configured | **BLOCKED** | Needs real 3PL and carrier rates |
| ☐ | Markets configured | **BLOCKED** | |
| ☐ | Payments configured | **HUMAN** | iDEAL is effectively mandatory for NL conversion |
| ☐ | Shopify plan chosen | **BLOCKED** | **Pricing could not be verified — shopify.com is blocked. Do not rely on any plan cost quoted from memory** |

## International

| | Item | State | Note |
|---|---|---|---|
| ☑ | Market sequence decided | **DONE** | Launching NL-only is deliberate: EPR is a fixed cost per market |
| ☑ | Dutch localisation complete in theme | **DONE** | Test asserts 100% key coverage against the default locale |
| ☐ | Currency and price display verified | **BLOCKED** | |
| ☑ | Duties/customs strategy exists | **DONE** | Bulk import under an Article 23 licence; DDP to the customer |
| ☐ | Returns route operable | **BLOCKED** | Needs a 3PL |
| ☐ | Delivery promises realistic | **BLOCKED** | Theme shows a date range; it must never promise what the 3PL has not committed to |

## Legal and privacy

| | Item | State | Note |
|---|---|---|---|
| ☑ | Compliance constraints researched | **DONE** | GPSR, EPR, VAT/OSS, consumer law, Omnibus |
| ☑ | Unlawful conversion tactics prohibited in code | **DONE** | Reference pricing, fake reviews and fake scarcity blocked by theme + tests |
| ☑ | GPSR Art. 19 disclosure built | **DONE** | Renders in the offer; loud staff warning when data is missing |
| ☐ | Policies drafted | **OPEN** | Privacy, terms, shipping, returns, cookies not yet written |
| ☐ | Cookie consent implemented | **BLOCKED** | Design documented; no store to implement on |
| ☐ | Withdrawal button implemented | **BLOCKED** | Reported mandatory from 19 June 2026 — **verify scope, it is the most commonly misread item in the research** |
| ☐ | VAT/OSS registration | **HUMAN** | Requires professional advice |
| ☐ | EPR registrations | **HUMAN** | NL packaging likely under threshold at launch; confirm SUP surcharge |
| ☐ | Legal review | **HUMAN** | **All compliance findings rest on secondary summaries — no primary legal text could be opened.** Professional verification is required, not optional |

## Marketing and analytics

| | Item | State | Note |
|---|---|---|---|
| ☑ | Measurement plan written | **DONE** | Consent-first; Shopify order data as source of truth |
| ☑ | UTM standard defined | **DONE** | Includes the physical club/QR channel so it does not become invisible |
| ☑ | Diagnosis rules defined | **DONE** | Reading → cause → action |
| ☐ | Consent verified to gate tags | **BLOCKED** | |
| ☐ | Purchase event fires once with correct value | **BLOCKED** | Duplicate purchase events inflate ROAS and cause overspending |
| ☐ | Merchant Center feed validated | **BLOCKED** | |
| ☐ | Ad accounts created | **HUMAN** | |
| ☐ | ESP connected, flows live | **BLOCKED** | |

## QA

| | Item | State | Note |
|---|---|---|---|
| ☑ | Automated theme checks | **DONE** | 15 checks, mutation-tested to confirm they fail when the rule they protect is broken |
| ☑ | Economics engine tests | **DONE** | 37 tests |
| ☐ | Cross-browser testing | **BLOCKED** | Nothing rendered |
| ☐ | Real-device mobile testing | **BLOCKED** | |
| ☐ | Broken-link and redirect check | **BLOCKED** | |
| ☐ | Transactional email testing | **BLOCKED** | |
| ☐ | Real Core Web Vitals | **BLOCKED** | Budgets enforced statically; field data needs traffic |

---

## The four things worth doing first

In order of value per unit of effort.

1. **Observe real retail prices** for padel bags and grips at Dutch retailers.
   Free, half an hour, and it determines whether the entire price ladder holds.
   Nothing else should be acted on first.
2. **Send an RFQ** against the cost ceiling in `../strategy/unit-economics.md`.
   Three suppliers minimum.
3. **Phone ten Dutch padel clubs.** The most dangerous unknown in the whole
   business case is whether clubs will engage. If they uniformly will not, the
   cheapest acquisition channel disappears and the economics rest entirely on
   paid social — the exact condition the strategy was built to avoid.
4. **Trademark search** on POLDER before any asset is produced.

Items 1 and 3 cost nothing but time, and between them they can kill or confirm
the thesis before a euro is spent. That is the whole point of having sequenced
the work this way.
