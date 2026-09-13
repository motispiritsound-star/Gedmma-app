# CRO experiment backlog

Written 2026-09-13.

## Do not A/B test at launch

The most valuable thing in this document is the instruction not to use most of it
yet.

Splitting traffic requires enough conversions per arm to distinguish a real
effect from noise. At launch volumes a test will run for weeks and still return
nothing conclusive, while costing half the traffic to the worse variant the whole
time. Teams that test too early do not learn slowly — they learn *wrongly*,
because they read noise as signal and then build on it.

**Below roughly 200 orders a month, use qualitative evidence instead**, and treat
the ranked list as a build order rather than a test queue.

### What to do instead, in order of value

1. **Ask ten customers why they bought, in their words.** Reply to the first ten
   orders personally. The phrasing they use is better copy than anything written
   here, and it is free.
2. **Ask five people who didn't buy.** Post-browse email, or the padel club. One
   sentence: "What stopped you?"
3. **Watch three people use the site on their own phone.** Hand it over, say
   nothing. Every serious usability defect surfaces in the first two minutes.
4. **Read every support email as a CRO document.** A question asked twice is a
   page that failed twice.
5. **Check the funnel drop-offs** against the diagnosis table in
   `measurement-plan.md`. A structural break beats any test.

Qualitative evidence at this stage is not the poor relation of testing. It is
higher-resolution and faster, and it is the only method that tells you *why*.

## Scoring

`(Impact × Confidence) ÷ Effort`, each 1–5. Confidence means confidence in the
*direction*, drawn from the benchmark research, not a guess at the magnitude.

**No expected uplift percentages appear here.** Published uplift figures are
context-specific and quoting them would manufacture precision this project does
not have.

## Build now — do these before launch, untested

High confidence from the benchmark study, and cheap. Testing whether to have a
guarantee is not a good use of the first month.

| # | Change | I | C | E | Score | Why it is not a test |
|---|---|:-:|:-:|:-:|--:|---|
| 1 | Named, numbered guarantee with published exclusions, on the PDP | 5 | 5 | 2 | 12.5 | The single most consistent pattern across the brands studied. Exclusions raise credibility rather than lowering it |
| 2 | Set as the default entry SKU, tiers above the buy button | 5 | 5 | 2 | 12.5 | The economics require it. A €39–49 order cannot fund acquisition at all |
| 3 | Delivery shown as a date range, not a duration | 4 | 4 | 1 | 16.0 | Cheapest item here. Must come from real 3PL cut-offs |
| 4 | iDEAL present and prominent at checkout | 5 | 5 | 1 | 25.0 | Dutch conversion depends on it. Not a preference |
| 5 | Trust row directly beneath add-to-cart | 4 | 4 | 1 | 16.0 | The reassurance-at-commitment slot most stores waste |
| 6 | "What's in the box" and a scale-reference photo in the gallery | 4 | 4 | 2 | 8.0 | Pre-empts the two commonest post-purchase disappointments |
| 7 | Sticky add-to-cart on mobile | 3 | 4 | 1 | 12.0 | 70–80% of mobile sessions scroll past the real button |
| 8 | Subscription cancellation wording *at the point of subscribing* | 4 | 5 | 1 | 20.0 | Directly answers the recurring complaint against subscription brands |

Items 4 and 8 top the list on score, and both are close to free.

## Test later — once volume supports it

Ordered by score. Run one at a time; concurrent tests on one funnel interfere.

| # | Hypothesis | I | C | E | Score | Primary metric | Guardrail |
|---|---|:-:|:-:|:-:|--:|---|---|
| 9 | Free-shipping threshold set above AOV, with progress shown, lifts AOV more than it costs in margin | 4 | 3 | 2 | 6.0 | Contribution per session | Contribution margin must not fall |
| 10 | Leading the PDP with the wet-compartment demo video beats leading with the product-on-white shot | 4 | 3 | 2 | 6.0 | Add-to-cart rate | Page weight, LCP |
| 11 | A comparison table against the category default lifts conversion | 3 | 3 | 2 | 4.5 | PDP conversion | — |
| 12 | Subscription presented at checkout rather than on the PDP raises take-up without hurting conversion | 5 | 2 | 3 | 3.3 | Subscription take rate | Overall conversion rate |
| 13 | Three tiers convert better than two | 3 | 2 | 2 | 3.0 | AOV and contribution | Conversion rate |
| 14 | Homepage leading with the hero product beats leading with the brand story | 3 | 2 | 2 | 3.0 | Homepage → PDP rate | — |
| 15 | Longer-form PDP copy beats short for a considered purchase | 3 | 2 | 3 | 2.0 | PDP conversion | Bounce |
| 16 | A cart drawer beats a cart page | 2 | 2 | 3 | 1.3 | Checkout start rate | — |

Item 12 is worth noticing: highest impact, lowest confidence. **That combination
is precisely what testing is for** — unlike items 1–8, where the direction is
already known and testing would only delay the benefit.

## Experiments this project will not run

| Not doing | Why |
|---|---|
| Anything with fake urgency, countdowns or invented stock | Unlawful under the Omnibus Directive. Not a testing question |
| Testing whether to show reviews we do not have | The theme fails closed, correctly |
| Price testing across simultaneous visitors | Price-indication and fairness exposure; also poisons the 30-day reference-price history |
| Dark-pattern checkout (pre-ticked add-ons, hidden costs) | Prohibited in `../CLAUDE.md`, and an EU consumer-law risk |
| Testing the guarantee away | A published guarantee is a contractual commitment; withdrawing it mid-test is not a clean experiment |

## Running one properly

- **Write the hypothesis before the variant.** "We believe X because Y, measured
  by Z." A test without a prior is data-mining.
- **Choose the metric and the guardrail up front**, and the stopping rule.
- **Do not stop early on a good result.** Early peeking is the commonest way to
  ship a change that does nothing.
- **Measure contribution, not conversion,** wherever an offer changes. A variant
  that lifts conversion and cuts margin is a loss dressed as a win.
- **Log every result, including the null ones**, in the decision log. An
  unrecorded failed test gets re-run in eight months.

## Review

Monthly at launch scale, alongside the qualitative evidence above. Re-score the
backlog each time — effort estimates in particular drift once the theme is live.
