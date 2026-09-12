# Project status

Updated 2026-09-12.

## Where this stands in one paragraph

The evidence machinery and the unit-economics engine are built and tested.
Broad research is running across four workstreams: category discovery, EU
regulatory constraints, DTC success patterns, and business-model/sourcing. No
product has been selected, and deliberately so — the brief's sequence puts
research before store building, and a store built before the commercial
hypothesis is settled is just an expensive opinion. **No Shopify store exists
and none can be created from this environment** (see `ACCESS-AND-LIMITS.md`).

## Completed

- `venture/` workspace isolated from Buurklus (D-001)
- Research methodology and evidence grading (`research/METHODOLOGY.md`)
- Evidence ledger opened (`research/evidence-ledger.md`)
- Decision log opened — 3 decisions recorded
- Access and limits documented honestly
- **Unit-economics engine built and tested** — 20 tests, zero dependencies.
  Provenance-aware: refuses to certify verdicts built on unverified inputs.

## In progress

| Workstream | State |
|---|---|
| Category & trend discovery (40–50 candidates, screened) | Running |
| EU compliance constraints (GPSR, EPR, VAT/OSS, consumer law) | Running |
| DTC success-pattern benchmark (18–25 brands + weak competitors) | Running |
| Business model & sourcing landscape | Running |

## Not started (gated on the above)

Product selection · supplier scorecard · positioning and brand · offer design ·
Shopify theme build · content · analytics plan · lifecycle flows · paid and
organic plans · QA · launch readiness.

## Blocked — needs a human

Nothing is blocked *yet* in a way that stops research. The following will block
implementation, and are listed now so they can be started in parallel:

| # | What | Why it needs you |
|---|---|---|
| 1 | Confirm the operating entity is Netherlands-based | Assumed (D-002). Drives VAT/OSS, GPSR importer status, supplier and market choice. The single most consequential assumption in the project. |
| 2 | Shopify account + Partner/dev store | No store can be created from here. Blocks all store configuration and every QA item requiring a live checkout. |
| 3 | Budget authorisation | Samples, domain, apps, ad spend. Nothing has been or can be spent from here. |
| 4 | Supplier contact | All sourcing economics are placeholders until real quotes exist. No supplier has been contacted. |

## Key risks being tracked

1. **EU product-safety and producer-responsibility law may invalidate the
   cheapest business models.** Under investigation now, before product selection,
   precisely so it cannot invalidate a decision already made (D-003).
2. **No keyword tool access** means no search-volume evidence anywhere in this
   project. Demand is assessed qualitatively and labelled accordingly.
3. **Search tooling is US-biased** while the venture targets the EU.
4. **Fabrication pressure.** A brief this large creates strong incentive to fill
   gaps with plausible numbers. The provenance system exists to make that
   visible rather than to rely on discipline.

## Next highest-value action

Reconcile the four research workstreams as they land — critically, not by
concatenation — and let the compliance findings screen the category long-list
before any product is shortlisted.
