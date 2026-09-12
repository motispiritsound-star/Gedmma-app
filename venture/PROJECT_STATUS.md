# Project status

Updated 2026-09-12.

## Where this stands

A business has been selected on evidence, its economics inverted to produce a
sourcing specification, and a storefront built and tested in code. **No Shopify
store exists, no supplier has been contacted, and nothing has been launched or
spent.** The venture is not launch-ready; it is **decision-ready**, pending four
verifications, two of which are free.

Start with `EXECUTIVE-SUMMARY.md`. Read `ACCESS-AND-LIMITS.md` before trusting
any number anywhere in this directory.

## Completed

**Foundations**
- Workspace isolated from Buurklus; nothing outside `venture/` touched (D-001)
- Research methodology, evidence ledger (12 entries), decision log (6 decisions)
- Engineering conventions in `CLAUDE.md`, including EU rules treated as
  engineering constraints

**Research** — four parallel workstreams, all in `research/`
- Category discovery: 48 candidates long-listed, 9 survived screening
- EU compliance: GPSR, EPR, VAT/OSS, customs, consumer law, Omnibus
- DTC success patterns: ~25 brands studied, plus weak comparators
- Business model and sourcing routes compared

**Selection**
- Padel accessories chosen: 80.0 on the scorecard, first under all five
  alternative weightings tested
- Business case written with the red-team argued properly, not as a formality
- Positioning and brand direction; POLDER as candidate name
- Markets sequenced NL → BE → DE, with Spain deliberately deferred

**Finance** — `finance/`, 45 tests, zero dependencies
- Provenance-aware unit-economics engine that refuses to certify unverified
  inputs
- Opportunity scorer that reports the 37.5% of the model it cannot fill
- Required-to-believe solver producing the €23.65 sourcing ceiling
- Twelve-month forecast, three scenarios, with the cash trough reported

**Storefront** — `shopify/`, 15 tests
- Online Store 2.0 theme, architecture derived from the benchmark research
- Omnibus-safe reference pricing, GPSR Art. 19 block, no fakeable social proof
- Budgets enforced by tests; all guardrails mutation-tested

**Plans**
- Measurement and consent architecture (`marketing/measurement-plan.md`)
- Launch checklist with blocked items marked BLOCKED (`qa/launch-checklist.md`)

## In progress

| Workstream | State |
|---|---|
| Launch plan, creative bank, lifecycle flows | Writing |
| GPSR runbook, fulfilment, returns, customer-service SOPs | Writing |

## Not done, and honestly so

- **Policies** — privacy, terms, shipping, returns, cookies are not drafted
- **SEO content map** — keyword research is impossible without a keyword tool;
  no search-volume figure appears anywhere in this project
- **Product content** — nothing to photograph and no store to publish to
- **Creator/UGC outreach, CRO experiment backlog** — both depend on a live store

## Blocked — needs a human

| # | What | Why |
|---|---|---|
| 1 | Confirm the entity is NL-based | Assumed (D-002); drives VAT, GPSR status, markets |
| 2 | Shopify account | No store can be created from here |
| 3 | Budget authorisation | Samples, domain, apps, ad spend |
| 4 | Supplier contact | All sourcing economics are placeholders |
| 5 | Legal and tax verification | **All compliance findings are secondary-source** |

## Risks being tracked

1. **Clubs may not engage an unknown brand** — the most dangerous unknown.
   Removes the cheapest channel and forces reliance on paid social.
2. **Supplier cost above €23.65** — €5.65 over swings year one by €11,409.
3. **Retail price band below €59** — kills the model outright.
4. **Subscription retention** — the difference between the downside and upside
   cases is almost entirely this, not advertising.
5. **Evidence quality** — page fetching was blocked for every domain, so no
   primary source, competitor page, supplier price or legal text was read.
   Nothing exceeds MEDIUM confidence.

## Next highest-value action

**Check real retail prices for padel bags and grips at Dutch retailers.** Free,
half an hour, and it determines whether the price ladder — and therefore the
whole economic model — holds. Then phone ten padel clubs.

Everything else should wait for those two answers.
