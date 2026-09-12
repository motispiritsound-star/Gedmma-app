# Executive summary

2026-09-12

## The one-line version

A Netherlands-established own-brand padel accessories business, selling a bag
engineered for wet Northern European play with an overgrip subscription
underneath it, launching in the Netherlands alone — **researched, designed, built
in code, and deliberately not launched, because four cheap verifications must
happen first and two of them cost nothing but an afternoon.**

## Before anything else: what was and was not done

**No Shopify store exists.** None could be created — this environment has no
Shopify account, no supplier contact, no ad account, no analytics, and no
payment provider. Worse for the research: **the network policy blocked page
fetching for every website tried**, including shopify.com, shopify.dev, EUR-Lex,
every supplier and every competitor. Web *search* worked; reading a specific page
did not.

So nothing here rests on a primary source, a supplier quote, a competitor
teardown, or a single measured metric. What it rests on is search-derived
evidence, consistently labelled, plus real code that was written and tested.

`ACCESS-AND-LIMITS.md` sets this out in full. Read it before trusting any number
in this project.

---

## A. The business

**What:** Padel accessories under one own brand. Hero product is a padel bag
built for outdoor play in wet weather — wet/dry separation, ventilated shoe
compartment, PFAS-free water repellency. Underneath it, an **overgrip
subscription**, which is the actual business model.

**To whom:** Recreational-to-club players in Northwest Europe who play outdoors
all year, carry kit to a club, and have already shown they spend on the sport.

**Why this and not something else:** it won a weighted scorecard at 80.0 against
69.6 for the runner-up, and **held first place under all five alternative
weightings tested** — including one built specifically to punish its weakest
dimension. The ranking is not an artefact of how I weighted it.

**Why it has a reason to exist:** Dutch padel is played outdoors in the wettest
part of Europe, and the category's established brands are Spanish and Latin
American, designing for dry climates. That is a genuine product gap, not a
positioning slogan.

→ `strategy/business-case.md`, `strategy/positioning.md`

## B. The evidence that mattered

Four research workstreams ran in parallel and converged independently on the
finding that reordered everything:

**Classic dropshipping into the EU is not viable — structurally, not
marginally.** GPSR has applied since December 2024 to all non-food consumer
goods with no SME exemption. A Dutch merchant importing from a Chinese supplier
*is* the importer; selling own-brand makes them the deemed manufacturer, owing a
technical file and documented risk analysis per SKU, kept ten years, plus
manufacturer details and local-language safety information **in the online offer
itself**. A commodity supplier cannot furnish any of it, and an "EU Responsible
Person" subscription does not fix it — a responsible person represents a
compliant file, it does not create one.

Three consequences followed, and they shaped the whole venture:

1. **Own stock, own brand, small catalogue.** Compliance cost is per SKU.
2. **The regulation is an asset.** Every non-EU competitor faces the same wall
   and cannot climb it. For an EU-established seller that is a moat.
3. **Low-ASP direct-ship is dead anyway.** The €150 de minimis ended 1 July 2026.

Supporting evidence: padel demand was the only candidate to triangulate cleanly
(876,000 Dutch players, 3,570 courts, +25% YoY, from a federation report and
Dutch specialist press independently). EU clothing returns centre on ~30%, the
worst in the world, which removed everything sized. EPR is a per-country fixed
cost with no threshold in Germany or France, which is why we launch in one
market.

→ `research/` (four documents), `research/evidence-ledger.md`

## C. Products

One hero, one consumable, sold primarily as a **set**. That is not a
merchandising preference — the arithmetic requires it (see E).

## D. Suppliers

**None. No supplier has been contacted and none could be.** A due-diligence
scorecard and an RFQ question list are ready to send. Every sourcing figure in
this project is a placeholder, marked `UNVERIFIED`.

→ `research/business-model-sourcing.md`, `operations/fulfilment.md`

## E. Unit economics

Rather than invent a supplier cost and compute a flattering margin, the model
**inverts the question and solves for the cost ceiling**:

> At a €79 starter set and a €27 cold CAC, the complete set must land at or below
> **€23.65** to break even — **€15.65** to clear €8 of profit per order.

That is an RFQ limit and a kill criterion in one number.

The price ladder is the single most decision-relevant output in the project:

| Retail price | Max landed cost |
|---:|---|
| €39 | **cannot fund acquisition at all** |
| €49 | **cannot fund acquisition at all** |
| €59 | €7.83 — implausible for a quality set |
| €79 | €23.65 |
| €99 | €39.47 |

**The premium position is not a brand preference. It is the only arithmetic that
works.** A commodity-priced padel set cannot pay for its own customer.

The economics engine returns `INDICATIVE ONLY` on all of this, by design: 37.5%
of the scoring model depends on a supplier quote, and it refuses to certify a
verdict built on numbers nobody has checked.

→ `strategy/unit-economics.md`, `finance/`

## F. Brand

**POLDER** (candidate name). A polder is land reclaimed from water and kept dry
by engineering — the Dutch are the acknowledged world experts at keeping water
out, which is precisely what the product does. The name makes nationality an
argument rather than decoration.

**No trademark, domain or handle check was possible.** "Polder" is a common noun
and may well be refused or conflict. Treat this as a candidate, not a decision.

→ `strategy/positioning.md`

## G. Markets

**Netherlands only at launch.** Belgium second. Germany a deliberate later
decision. Spain deferred despite being Europe's largest padel market — a
wet-weather proposition has no reason to exist in a dry climate.

This is narrower than the brief's international ambition, and deliberately so:
EPR is a per-country, per-waste-stream fixed cost with no threshold in Germany or
France. **Market count multiplies a fixed cost against a revenue base that does
not exist yet.**

## H. Shopify

A complete Online Store 2.0 theme, written and tested. **Never deployed.**

Its distinguishing feature is that three EU rules are enforced in code rather
than left to whoever edits the store later:

- **It cannot display an unlawful reference price.** Shopify's `compare_at_price`
  is free text and is not the Omnibus-required "lowest price in 30 days", so the
  theme refuses to render it and reads a maintained metafield instead — showing
  nothing when absent. Failing closed is the point.
- **GPSR Art. 19 information renders in the offer**, not the footer, and a
  product missing it shows a loud staff-only warning rather than publishing
  quietly.
- **It cannot fake social proof.** Review markup is emitted only behind a genuine
  non-zero rating count.

15 automated checks run without a store — schema validity, template references,
Dutch translation coverage, a 50 KB JavaScript budget, alt text, focus outlines,
and the compliance guardrails. All were mutation-tested to confirm they fail when
the rule they protect is broken.

→ `shopify/`

## I–J. Marketing and creative

Channel strategy, a 90-day launch plan with explicit go/no-go gates, a creative
matrix and concept bank, and lifecycle flows — all built around the constraint
that **this business must not depend on first-order ROAS from cold paid social**,
because CPMs are rising and Dutch baskets are deflating. Padel clubs are treated
as a first-class acquisition channel, and the UTM standard includes physical/QR
sources so that channel does not become invisible and then get cut for looking
unproductive.

→ `marketing/`

## K. Analytics

Consent-first by necessity: in the EU tracking identifiers require consent
*before* they are set, so a material share of sessions will carry no client-side
tracking at all. Shopify's own order data is the source of truth; ad platforms
are directional.

One trap is worth repeating here because it silently destroys profitability:
break-even ROAS is `1 / contribution margin` on an **ex-VAT** basis, but most
pixels report the **VAT-inclusive** total. **A Dutch store targeting its ex-VAT
break-even is running 21% looser than it thinks** — 2.00x is really 2.42x.

**Nothing has been validated. Every analytics check is BLOCKED.**

→ `marketing/measurement-plan.md`

## L. Operations

Fulfilment, returns and support procedures, plus a GPSR runbook that the theme
itself points staff at when compliance data is missing.

→ `operations/`

## M. The ten risks that matter

| # | Risk | Impact | Likelihood | Mitigation / status |
|---:|---|---|---|---|
| 1 | **Clubs won't engage an unknown brand** | High | Medium | The cheapest acquisition channel disappears and economics fall back on paid social — the exact thing the strategy avoids. **Ten phone calls settles it.** Untested |
| 2 | **Supplier cost lands above the ceiling** | High | Medium | €5.65 over swings year one by €11,409. RFQ before ad account. Untested |
| 3 | **Retail price band sits below €59** | High | Unknown | Kills the model outright. **30 minutes of browsing settles it.** Untested |
| 4 | **Grip subscription doesn't retain** | High | Medium | The whole thesis. Downside vs upside is driven by this, not by ads |
| 5 | **Compliance research is secondary-source only** | High | Certain | No primary legal text could be opened. Professional verification required, not optional |
| 6 | Incumbents own club distribution | Medium | High | Compete on a proposition they don't make; clubs as later channel, not launch dependency |
| 7 | Overgrips are commodities Temu can undercut | Medium | High | Subscription is retention, not margin. The bag must carry the brand |
| 8 | POLDER unavailable or refused as a mark | Medium | Medium | Common noun. Alternatives documented. Check before any asset spend |
| 9 | Padel participation plateaus | Medium | Medium | Underwrite on the existing 876k base, never on continued court growth |
| 10 | Theme written without access to Shopify's docs | Low | Certain | Treat first deploy as validation; run `theme check` |

## N. What needs you

Everything below requires a person, money, or a credential. Nothing else does.

**Do these four first — two are free and they can kill or confirm the thesis
before a euro is spent:**

| # | Action | Cost | Why it's first |
|---|---|---|---|
| 1 | **Check real padel bag and grip prices** at bol.com and two club webshops | 30 min | Determines whether the entire price ladder holds. Nothing else should be acted on before this |
| 2 | **Phone ten Dutch padel clubs.** Would they stock or co-promote? | 2 hours | The most dangerous unknown in the business case |
| 3 | **Send the RFQ** to 3+ manufacturers against the €23.65 ceiling | Free | Fills 37.5% of the scoring model that is currently blank |
| 4 | **Trademark search** POLDER at BOIP and EUIPO, classes 18/25/28 | Low | Before any brand asset is produced |

**Then, if those survive:**

| # | Action | Note |
|---|---|---|
| 5 | Confirm the operating entity is NL-based | Assumed throughout (D-002). The most consequential assumption in the project |
| 6 | Open a Shopify account and push the theme to an **unpublished** theme | Then run `shopify theme check` |
| 7 | Engage a Dutch product-compliance lawyer and a VAT adviser | **All compliance findings are secondary-source.** Not optional |
| 8 | Order samples from shortlisted suppliers | Requires spend approval |
| 9 | Choose a 3PL and get real carrier rates | Delivery promises must not exceed what they commit to |
| 10 | Re-verify Shopify pricing and plan limits yourself | shopify.com was blocked; trust nothing quoted from memory |

---

## The honest bottom line

This is not a launched store, and it was never going to be one from here. What it
is: a business selected on evidence rather than on enthusiasm, with the economics
inverted so the unknown became a specification, the regulatory landscape treated
as a moat rather than a nuisance, a storefront built with the law enforced in
code, and a clear-eyed account of everything that remains unverified.

**Two free afternoons stand between this and a real decision.** That was the
point of sequencing the work this way.
