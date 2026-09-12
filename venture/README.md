# Commerce venture

A research-led international e-commerce business, built to be judged as an
investment rather than as a website.

**This directory is self-contained.** It shares nothing with Buurklus, the Dutch
tradespeople marketplace that occupies the rest of this repository — no build, no
dependencies, no tests, no deploy. The two happen to share an owner and a repo.
Nothing outside `venture/` has been modified.

## Read these first, in order

| File | Why |
|---|---|
| [`ACCESS-AND-LIMITS.md`](ACCESS-AND-LIMITS.md) | **Start here.** What was actually executed versus prepared. No Shopify store exists. |
| [`PROJECT_STATUS.md`](PROJECT_STATUS.md) | Current state, blockers, next highest-value action |
| [`DECISION_LOG.md`](DECISION_LOG.md) | Every material decision, its alternatives and reversibility |
| [`research/METHODOLOGY.md`](research/METHODOLOGY.md) | The evidence standard everything else is held to |

## Layout

```
research/    Market, category, competitor, supplier and compliance evidence
strategy/    Business case, positioning, unit economics, market sequencing
finance/     The unit-economics engine — real, executable, tested code
shopify/     Theme source and configuration runbooks
marketing/   Acquisition, lifecycle, creative and content plans
operations/  Fulfilment, returns, supplier and support procedures
qa/          Launch checklists and validation status
```

## The one thing to understand

Every number in this project carries a provenance tag — `FACT`, `ESTIMATE`,
`ASSUMPTION` or `UNVERIFIED` — and the tag travels with it. The economics engine
in `finance/` enforces this in code: a candidate built on unverified supplier
costs returns `INDICATIVE ONLY` and cannot be certified, no matter how good its
margins look.

This exists because the expensive failure in e-commerce planning is not being
wrong. It is being confidently wrong on a number nobody checked.

## Running the economics engine

```bash
cd venture/finance
npm test        # 20 tests, zero dependencies, no install step
```
