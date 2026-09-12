# POLDER — 90-day launch plan (Netherlands)

Written 2026-09-12. Plan window: **Mon 14 Sep 2026 → Sun 13 Dec 2026** (13 weeks).
Market: **Netherlands only.** Belgium is out of scope for these 90 days.

---

## 0. Read this before the plan

**Nothing in this plan has been executed and nothing can be executed from this
environment.** Per `ACCESS-AND-LIMITS.md` there is no Shopify store, no Meta or
TikTok business account, no pixel, no Google Ads or Merchant Center account, no
GA4 property, no ESP, no domain and no supplier. This document is an execution
brief for a human with accounts, not a status report.

**No metric in this document is a measurement.** Every number is tagged. The only
performance figure carried forward from prior work is the cold-traffic CPA:

> **~€27.08 cold CPA — `ESTIMATE`.** Derived in `finance/` from published Dutch
> Meta CPM ranges with an assumed CTR and conversion rate. It is the single
> largest uncertainty in the model. It is not a benchmark, it is not a target,
> and it is not evidence that a €27 CPA is achievable. Treat it as the number
> the plan must *disprove or confirm*, not as an input to trust.

There are no industry CTR, CVR, ROAS, CPM, engagement-rate or creator-rate
figures in this plan, because no keyword tool, ad account or analytics property
was reachable and inventing them would be worse than omitting them. Where a
threshold is needed to make a decision, it is either (a) derived arithmetically
from the unit economics, or (b) stated as a `ASSUMPTION` decision rule with its
reasoning shown. Gates of type (b) are noise-control rules, not performance
predictions.

### The three hard dependencies

| # | Dependency | Status | If unmet |
|---|---|---|---|
| D1 | **Stock landed in the NL 3PL, with a picked test order shipped** | Not started. No supplier contacted | Phases 2–4 do not start. Phase 0–1 continue; they cost almost nothing and do not expire |
| D2 | **Retail price check done** (`business-case.md` §8 Q2 — 30 minutes on bol.com and two club webshops) | Not done. No page could be opened here | The €79 set price is `ASSUMPTION`. Every CPA gate below is computed from it, so all gates are provisional until this is done |
| D3 | **POLDER trademark + domain clearance** (BOIP/EUIPO classes 18/25/28) | Not done | Do not shoot photography, print packaging, buy handles or run a single ad. A rebrand after launch destroys the content bank |

D2 costs nothing and unblocks the whole gate structure. **Do it in week 1.**

### The economics this plan is bound by

From `unit-economics.md`, all `ESTIMATE`/`ASSUMPTION`:

- Entry order value **€79 incl. VAT**. A €39 order cannot fund cold acquisition
  at all; a €49 order leaves almost nothing. The starter set exists to lift the
  order above that floor — it is an economic necessity, not merchandising.
- At the sourcing ceiling (€22.90 landed) contribution is €27.08 and first-order
  profit is **exactly zero**. Every stress scenario fails at the ceiling.
- ~**49.8%** of modelled lifetime value comes from repeat purchase. The grip
  subscription is not an upsell; it is the half of the business that makes cold
  acquisition survivable.

**Therefore the operative gate formula for this entire plan is:**

```
Allowable CPA  =  contribution per order  −  required first-order profit
```

With the modelled €8.00 first-order profit target and a real supplier quote,
this resolves to a real euro figure. Until a quote exists, the plan runs on the
placeholder **allowable CPA = €19.08** (€27.08 contribution at the ceiling −
€8.00). `ESTIMATE, derived`. **Recompute this the day the quote lands and
rewrite every gate below with the real number.** Do not launch paid traffic
against a placeholder.

---

## 1. Channel strategy, and the reason for the order

The thesis is explicitly *not* "buy cold traffic profitably on day one". Dutch
online baskets are deflating (E-005, `FACT`: Q1 2026 online spend −6% YoY while
purchase count rose >2%) and Meta CPMs are directionally rising (E-011,
`ESTIMATE`, LOW-MEDIUM confidence, vendor-sourced). A plan that needs positive
first-order ROAS from cold paid social in week 1 is a plan built on the one
condition the whole business case was constructed to avoid.

So channels are sequenced by **cost of being wrong**, cheapest first.

### 1.1 Padel clubs — the first channel, not the third

`FACT` (KNLTB / EY *Padel in Cijfers*, 2nd edition, via search summary
2026-09-12, knltb.nl): end-2025 the Netherlands had **3,523 courts across 780
locations**, courts +25% YoY, locations +15%; **876,000 players**; commercial
venues average 5.7 courts vs 4.5 at member clubs; **426 further courts at 110
locations planned for 2026, 237 of them indoor**. Players are growing faster than
courts, so courts-per-player is tightening.

Why this is the lead channel:

1. **780 locations is a countable, finite, addressable universe.** Meta's
   audience is not countable. A list of 780 venues with a phone number is the
   only acquisition asset in this plan that can be built to completion.
2. **It is the only layer of the moat that a foreign competitor cannot buy**
   (`business-case.md` §7 ranks it as potentially the most durable and the
   slowest to build). Starting it in week 13 wastes the whole quarter.
3. **It is the answer to the single most dangerous unknown.** §9 of the business
   case names it: if clubs uniformly refuse to engage, the cheapest acquisition
   route is gone and everything rests on paid social. **Ten phone calls settle
   that question, and they cost nothing.** They belong in week 1, before a euro
   of ad spend.
4. **Timing is unusually good.** `FACT` (nlpadel.nl / allespadel.com, search
   summary 2026-09-12): the KNLTB **Najaarscompetitie padel 2026 runs five
   playing days between Fri 11 Sep and Sun 11 Oct**, with catch-up weekends
   through 1 Nov, and the **Wintercompetitie 2026/27** schedule is already
   published. Competition weekends are the moment teams travel to away clubs in
   autumn weather with wet kit. That is the product demonstration happening by
   itself, 780 times over.

What clubs are used for, in order of value:

- **Distribution of proof, not of product.** A demo bag at the bar that members
  can pick up and pour a bottle of water over beats any ad impression. Cost: one
  bag and a laminated card.
- **Access to a consented audience.** Clubs have member newsletters and team
  WhatsApp groups. A club forwarding an offer to its own members is the club's
  own consented channel — the club is the sender, POLDER is the content. This is
  lawful where POLDER emailing those members directly would not be. See
  `lifecycle-flows.md` §12.
- **Competition-team packs.** A padel competition team is 4–8 people who all
  need grips on the same weekend and who are visibly identical on court. This is
  the natural unit of sale, not the individual.
- **Content location.** Rain, floodlights, a wet court and a real clubhouse.
  Unbuyable as a studio set.
- **Later: stocking.** Do not lead with a wholesale ask. A club that has never
  heard of the brand will not take stock; a club that has seen its members carry
  the bag might.

What clubs are **not**: a revenue forecast. Nobody has said yes. Conversion of
outreach to partnership is **UNVERIFIED — requires the ten calls in week 1.**

### 1.2 Meta (Instagram + Facebook) — first paid channel

**Why first among paid:** the proposition is visual and demonstrable. Water
beading on a DWR-treated panel, a wet towel in one compartment and a dry shirt in
the other, steam off a ventilated shoe pocket — these are *shown*, not argued.
Feed and Reels reward demonstration. The stated customer is 28–50
(`positioning.md`), which is the core of Instagram and Facebook usage in NL
(directional judgement, `ASSUMPTION` — no NL platform-demographic figure was
obtainable here).

**Why not first overall:** cold Meta traffic is exactly the cost structure the
thesis distrusts. Meta enters at **week 8**, after the pixel has real conversion
events from soft-launch orders, after the landing page has been corrected by
observing real buyers, and after there is a creative bank to test rather than one
guess.

**Structure** (`ASSUMPTION`, standard practice, stated so it can be challenged):
one broad NL prospecting campaign optimising for purchase; one retargeting
campaign (site visitors, video viewers, IG engagers, club-page visitors) held
separate so retargeting's cheap conversions never flatter the cold number; a
Advantage+ / broad-targeting test run against the interest-targeted set rather
than instead of it. Exclude existing customers from prospecting from day one —
paying to reacquire your own subscribers is the classic way a blended CAC lies.

### 1.3 TikTok — organic yes, paid later and conditionally

**Organic from week 1.** It is free, the demo content is natively suited to it,
and the same vertical assets serve Reels. There is no reason to wait.

**Paid: not in these 90 days unless a specific gate opens.** The reasoning:

- A €79 considered purchase with a trust component (a new brand, a technical
  claim, a guarantee) is a harder ask on TikTok than a €25 impulse item.
  `ASSUMPTION`, reasoning stated, not measured.
- The audience skew is younger than the stated 28–50 persona. `ASSUMPTION`.
- Running two paid platforms at once with one small budget guarantees neither
  gets enough conversion events to learn from. This is the real reason.

**The gate that would open TikTok paid:** an organic TikTok post reaching
materially beyond the follower base *and* driving measurable site sessions
(measurable = UTM'd link in bio, not vibes). At that point the creative has
proven it travels, and paying to amplify a proven asset is a different bet from
paying to find out. If that has not happened by week 11, do not start.

**TikTok Shop NL availability: UNVERIFIED — requires checking TikTok's seller
centre for the Netherlands.** If it is live it changes this recommendation,
because it collapses the trust and checkout friction that is the main argument
against the channel.

### 1.4 Google Search — week 11, and why it is not earlier

Search is intent-harvesting, not demand-creation. Three reasons it is sequenced
late and one reason it is not sequenced *last*:

1. **There may be very little intent to harvest.** "Padeltas waterdicht" as a
   query volume is **UNVERIFIED — no keyword tool was reachable** (Keyword
   Planner, Semrush and Ahrefs are all unavailable per `ACCESS-AND-LIMITS.md`).
   `business-case.md` §8 Q3 lists this as an open question that can kill part of
   the thesis. Spending on Search before knowing whether the category is searched
   or purely social/impulse is spending to find out something Keyword Planner
   gives away free once an account exists. **Open a Google Ads account in week 1
   purely to read Keyword Planner.** That is a week-1 task, not a week-11 one.
2. **Brand search does not exist yet.** The cheapest and highest-converting
   search campaign a DTC brand runs is its own brand name. In week 1 nobody is
   searching "POLDER padeltas". Meta and club activity in weeks 6–10 *create* the
   brand search that week 11 harvests. Running brand search before the brand has
   demand is buying clicks from nobody.
3. **Shopping and Performance Max cannot run without infrastructure that does not
   exist**: a Merchant Center account, a product feed with GTINs, NL shipping and
   returns policies configured, and verified conversion tracking. A feed with bad
   GTINs or missing shipping config gets disapproved, and fixing disapprovals
   burns a week. Build the feed in weeks 6–8, submit it in week 9, and let it sit
   in review before it matters.
4. **But not last:** high-intent branded and competitor-adjacent search is the
   cheapest revenue in the plan once brand demand exists, and the gift season
   (Sinterklaas 5 Dec, Christmas) is a genuine intent spike. Missing it wastes
   the one moment in the 90-day window when non-players search for padel gear.

**Sequence:** brand exact-match + high-intent non-brand (week 11) → Shopping with
a reviewed feed (week 12) → Performance Max **not at all in these 90 days**. PMax
needs conversion volume to allocate sensibly; giving it to an account with a
handful of daily conversions means paying Google to explore.

### 1.5 What is deliberately excluded

- **Marketplaces (bol.com).** `business-case.md` §9 names bol as the realistic
  competitive threat. Listing there in the first 90 days converts a brand into a
  price-compared commodity line before the brand has any equity to defend with,
  and gives away the customer relationship the subscription depends on. Revisit
  at month 6.
- **Influencer paid placements at rate card.** No creator rate in this category
  is known — **UNVERIFIED**, and inventing one would be a fabrication. Weeks 3–7
  use *seeding* (product given, no fee, no obligation to post, disclosure
  required if they do) precisely because it has a known cost: one bag.
- **Belgium.** Out of scope. Adding a second market multiplies fixed compliance
  cost across a revenue base that does not exist (`business-case.md` §6).
- **Any discount-led Black Friday.** See §5, week 11 — this is a legal
  constraint, not a brand preference.

---

## 2. Phase 0 — Foundations (W1–W2: 14–27 Sep)

No advertising spend. Everything here is a prerequisite for being allowed to
spend later.

### Week 1 (14–20 Sep)

| # | Task | Owner | Done when |
|---|---|---|---|
| 1.1 | **Retail price check (D2).** bol.com padel bags and overgrips, two club webshops, two specialist NL retailers. Record observed price, brand, and what is in the box | Founder | A table of ≥20 observed prices exists in `research/`. **If quality bags cluster below ~€45, stop and re-read `business-case.md` §10** |
| 1.2 | **Ten club calls (D-answer).** Ten venues from the 780. Script in §7 | Founder | Ten outcomes recorded: yes / maybe / no / no-answer. **If ten no's, escalate to the §10 stop condition** |
| 1.3 | Trademark + domain clearance started (D3): BOIP, EUIPO classes 18/25/28; `.nl`, `.com`, `.eu`; IG/TikTok/YouTube handles | Founder | Attorney engaged or self-search documented with dates |
| 1.4 | Open Google Ads account **for Keyword Planner only**, no campaigns, no billing risk | Founder | Volume data for a seed list of ~40 NL queries exported to `research/` |
| 1.5 | Meta Business Manager, Instagram and TikTok accounts created; pixel/CAPI *specced*, not yet installed (no store) | Founder | Accounts exist, 2FA on, roles assigned |
| 1.6 | Consent architecture decided **before** any tag exists: CMP choice, the fact that no marketing or analytics tag fires pre-consent, and that Meta CAPI inherits consent state | Founder | Written into `operations/` as a spec the theme must satisfy |

### Week 2 (21–27 Sep)

| # | Task | Done when |
|---|---|---|
| 2.1 | **Content bank shoot 1 — the water tests.** See `creative-bank.md` §5. Requires a physical sample. If no sample exists, this slips and everything downstream slips with it | 5 hero demos shot, ≥40 usable clips |
| 2.2 | Club list built to completion: all reachable NL venues, with name, town, courts, indoor/outdoor, contact, competition teams | A CSV of the addressable universe, ordered by priority (§7) |
| 2.3 | Landing pages specced: `/products/starterset`, `/pages/regen` (the wet-weather explainer), `/pages/garantie`, `/pages/clubs`. The theme currently ships only `index.json` and `product.json` — the rest need building | Specs written; build ticketed |
| 2.4 | Waitlist page live with **explicit, unbundled opt-in** (see `lifecycle-flows.md` §2). No pre-ticked box, no "by entering your email you agree" | Page live, consent record captured with timestamp and wording version |
| 2.5 | Guarantee drafted: named, numbered, **with published exclusions**. Exclusions are the credibility mechanism, not a legal afterthought | Copy approved |
| 2.6 | Claim substantiation file opened: hydrostatic-head figure from the mill, PFAS-free DWR supplier declaration, GPSR technical file reference | Every claim in `creative-bank.md` either has a document behind it or is struck |

**Gate 0 → 1.** Proceed only if: D3 clear (no trademark blocker), price check
done and the band supports ≥€79, and at least one club said something other than
no. If the price band is below €45, **stop the launch and re-open the category
decision.** That is not a delay, it is the kill criterion working.

---

## 3. Phase 1 — Pre-launch (W3–W5: 28 Sep – 18 Oct)

Goal: arrive at soft launch with (a) a warm list, (b) named club partners, (c)
a creative bank of tested organic hooks, and (d) zero paid spend burned on
learning things organic could have taught free.

### Week 3 (28 Sep – 4 Oct) — organic begins
- Publish daily on Instagram and TikTok from the week-2 bank. One format per day,
  rotating the five angles (`creative-bank.md` §1). Every post UTM'd via link in
  bio so "did it drive anything" is answerable.
- **Club outreach wave 1:** 60 venues, prioritised (§7). Email + follow-up call.
- Seed 6–10 demo bags to: 2 club managers, 2 trainers, 4 competition-team
  captains, 2 local creators. **No fee, no posting obligation, disclosure
  required if they do post** (§4 of `creative-bank.md`).
- Najaarscompetitie is live through 11 Oct — be physically at two competition
  weekends with a bag and a camera.

### Week 4 (5–11 Oct)
- Waitlist push: club partners forward the waitlist to their members **as the
  club's own send**. Target: the list exists and is consented, not a number
  invented here.
- Club outreach wave 2: next 80 venues. Convert wave-1 "maybes" with a visit.
- Shoot 2: club environment, competition weekend, real players, real rain.
- Build the Merchant Center feed structure in parallel (it will sit unsubmitted).

### Week 5 (12–18 Oct)
- Landing pages built and reviewed against the claim-substantiation file. Any
  claim without a document comes off the page.
- Tracking end-to-end test: consent denied → no tags fire; consent granted →
  pageview, view_item, add_to_cart, begin_checkout, purchase all arrive in Meta
  Events Manager and GA4 with matching values. **Nothing has been validated until
  a real test purchase fires them.** Until then tracking status is BLOCKED, not
  working — per `CLAUDE.md` rule 3.
- Retargeting audiences built and populating (video viewers, IG engagers, site
  visitors, waitlist upload with a documented lawful basis).

**Gate 1 → 2 (soft launch):** all of —
1. Stock physically in the 3PL and one test order picked, shipped and received.
2. Test purchase completed end-to-end, all events verified firing with correct
   values and consent gating.
3. Landing pages live, every claim substantiated, guarantee and exclusions
   published, 14-day withdrawal right and delivery date range stated.
4. ≥3 club partners named and agreed (even informally).
5. iDEAL live and tested. In NL this is not optional.

Any one missing → **do not soft launch.** A soft launch that can't take money or
can't measure itself teaches nothing and burns the warm list.

---

## 4. Phase 2 — Soft launch (W6–W7: 19 Oct – 1 Nov)

**Purpose is not revenue. It is to discover what is broken while the audience is
forgiving and the traffic is free.** Warm buyers tolerate a bad checkout; cold
paid traffic does not, and you pay per person to find out.

- **Audience:** waitlist, club partners and their members, seeded contacts,
  personal network. No cold paid spend.
- **Paid allowed:** retargeting only, and only to keep the pixel fed with real
  purchase events so the week-8 prospecting campaigns are not starting blind.
- **Target: the first 50 orders.** Not chosen for revenue — chosen because it is
  roughly the smallest number from which return rate, support-contact rate and
  fulfilment failure modes become visible. `ASSUMPTION`, reasoning stated: below
  ~50 orders one unhappy customer is 4% of the sample.

What is being measured, and why each matters more than CPA right now:

| Signal | Why it decides something |
|---|---|
| Fulfilment: order → dispatch → delivered, per order | The delivery-certainty promise is a positioning pillar. If the 3PL misses, the positioning is a lie and must come off the site |
| Support contacts per order, and their content | Every recurring question is a missing section on the product page |
| Return/refund rate and stated reason | Feeds directly into the economics model's refund input |
| **Subscription attach rate at/after checkout** | This is the business model. Measured, never assumed |
| Which size/colour/variant actually sells | Determines reorder before a stockout, which arrives faster than expected |
| Time on `/pages/regen`, and whether buyers read it | Decides whether the wet-weather story is the argument or just decoration |

**Do not compute a CAC in this phase and do not report one.** The traffic is
warm and free; any CAC computed here will be flatteringly low and will be quoted
back later as if it meant something.

**Gate 2 → 3 (permission to spend on cold traffic):** all of —
1. ≥50 orders shipped, or the warm audience exhausted with the failure modes
   understood.
2. Zero unresolved fulfilment defects. Dispatch SLA met on ≥95% of orders
   (`ASSUMPTION` — an operational standard, not a measurement).
3. Refund rate at or below the rate assumed in `unit-economics.md`.
4. A **real supplier quote** in hand, and the allowable-CPA formula in §0
   recomputed with the real contribution figure. **Launching cold paid against a
   placeholder allowable CPA is launching without a stop condition.**
5. Purchase events verified in Meta and GA4 with correct revenue values.
6. Stock cover ≥6 weeks at soft-launch run rate.
7. ≥10 verified-purchaser reviews collected and displayed. Only real buyers of
   this store — supplier or marketplace reviews may never be displayed as ours
   (`CLAUDE.md`; Omnibus prohibits it).

---

## 5. Phase 3 — Cold paid, capped (W8–W10: 2–22 Nov)

Entry budget: an amount the business can lose entirely without changing any
other decision. Expressed as a rule rather than a figure, because the figure
depends on a quote that does not exist: **week-8 total spend ≤ the cash value of
10 allowable CPAs.** If the allowable CPA proves to be €19.08, that is ~€191 for
the week. `ESTIMATE, derived`.

### Week 8 (2–8 Nov) — learn
- Meta prospecting, NL, purchase-optimised. Five creatives — the five shot first
  in `creative-bank.md` §5 — in one ad set, so the auction does the ranking
  rather than a split test that will never reach significance at this budget.
- Retargeting runs separately and is **reported separately, always.**
- TikTok organic continues daily. No TikTok paid.

### Week 9 (9–15 Nov) — diagnose, then either fix or scale
- Apply the diagnostic matrix (§6). Do not change more than one variable per
  decision; at this volume you cannot attribute two changes at once.
- Kill rule: an ad that spends **3× allowable CPA with zero purchases** is off.
  `ASSUMPTION` — a noise-control rule. At one-third the conversion rate needed to
  break even, waiting for it to recover costs more than the information is worth.
- Judgement rule: do not draw a conclusion about a creative below ~50 link clicks
  or about an ad set below ~10 purchases. `ASSUMPTION`, reasoning: below that,
  one order moves the CPA by more than any plausible creative effect.

### Week 10 (16–22 Nov) — Merchant Center feed submitted for review
Feed submitted now so disapprovals surface before week 12, not during it.

### Week 11 (23–29 Nov) — Black Friday, and the legal trap in it

**A brand that launched in October cannot lawfully run a "was/now" Black Friday
discount.** Under Art. 6a of Directive 2019/2161 (Omnibus), the reference price
in an announced reduction must be the **lowest price applied in the preceding 30
days** (`FACT` — Omnibus/Art 6a, secondary sources, 2026-09-12; verify with
counsel per `ACCESS-AND-LIMITS.md`). A brand with a six-week price history has
almost no headroom, and a "was €99" that was never charged is a straightforward
infringement with penalties up to 4% of annual turnover. Additionally: no
countdown timer that resets, no "only 3 left" unless it reads live inventory, no
fabricated recent-purchase popups (`CLAUDE.md`).

**So the Black Friday mechanic is value-added, not price-cut:**
- Extra grips included in the starter set for a genuinely time-bounded period,
  with a real end date that is honoured and never extended.
- First subscription delivery included.
- Free returns window extended, genuinely.

This is lawful, it protects the €79 price point the economics require, and it
does not train the list to wait for discounts — which for a subscription
business is the more expensive mistake anyway.

### Weeks 12–13 (30 Nov – 13 Dec) — Search, Shopping, gift season
- Google Search live: brand exact, plus the highest-intent non-brand terms that
  Keyword Planner (week 1) actually showed volume for. If it showed none, **do
  not run non-brand search** — that is the honest reading of a negative result.
- Shopping live on the reviewed feed.
- Gift angle: Sinterklaas 5 Dec, then Christmas. The buyer is not the player.
  This needs its own creative and its own landing treatment (`creative-bank.md`
  concepts 23–25), plus a published order-by date for Christmas delivery that is
  achievable. A missed Christmas delivery date on a brand whose positioning is
  delivery certainty is the worst possible first impression.
- **No Performance Max.** Not enough conversion volume for it to do anything but
  explore with your money.

---

## 6. GO/NO-GO: the diagnostic matrix

The point of a gate is to know *which* thing to change. Reading CPA alone tells
you that something is wrong and nothing about what.

| Observed pattern | Most likely cause | Action | What it is NOT |
|---|---|---|---|
| Good CTR, low add-to-cart | Landing page, offer or trust. The ad promised something the page doesn't deliver in the first screen | Fix the page, not the ad: hero image = the demo from the ad, price and delivery date above the fold, guarantee visible, reviews visible | Not a creative problem. Changing creative here destroys your only working asset |
| Good CTR, good ATC, low checkout completion | Cost/payment friction: shipping revealed late, iDEAL missing or buried, no delivery date, forced account creation | Show shipping cost and delivery date on the product page; iDEAL first; guest checkout | Not an audience problem |
| Low CTR, normal CPM | Hook. The first 1–3 seconds | New hooks against the same angle before abandoning the angle | Not a targeting problem |
| Low CTR, high CPM | Audience too narrow, or creative rejected by the auction as low-quality | Broaden; check ad quality ranking; check for policy flags | Not necessarily the creative |
| High CPM, everything else fine | Auction seasonality (Nov is the worst month for this) | Accept it or pause into December. Do not respond by cutting price | Not a signal that the product failed |
| Good CVR, CPA still above allowable | AOV too low — people are buying the cheap thing | Fix merchandising: make the set the default, not an option | Not a paid-media problem |
| Cold CPA fine but blended CAC rising | Retargeting and existing customers are being counted as acquisition | Separate reporting; exclude customers from prospecting | Not growth |
| Everything fine, subscription attach near zero | **The business model is not working.** Repeat purchase is ~half of modelled LTV | Stop scaling spend. Fix attach before buying more customers you cannot monetise twice | Not a minor optimisation |

### What must be true to increase spend

All five, simultaneously, on a rolling 7-day window:

1. Cost per purchase **at or below allowable CPA**, over ≥20 purchases.
   (`ASSUMPTION`: below ~20 events a 7-day CPA swings on single orders.)
2. Refund rate at or below the modelled rate.
3. Stock cover ≥4 weeks at the *proposed new* spend level, not the current one.
4. Dispatch SLA held.
5. Subscription attach rate measured and not falling.

Then: increase budget by **≤25% per step, at most twice per week**
(`ASSUMPTION` — an operational rule to avoid resetting the learning phase, not a
performance claim). Any step that breaks condition 1 reverts to the last
budget that held it.

### What triggers a stop

Any one of these halts spend the same day:

- 7-day cost per purchase **>25% above allowable CPA** with ≥20 purchases.
- Any ad spends 3× allowable CPA with zero purchases (that ad only).
- Stock cover <2 weeks.
- Refund rate above model, or a return reason indicating a product defect. A
  product defect is a GPSR matter before it is a marketing matter.
- Any consumer-authority contact, ACM notice or substantiated complaint about a
  claim. Pull the claim first, argue later.
- Dispatch SLA breached two weeks running.
- Tracking discrepancy that cannot be explained. Spending against numbers you
  cannot reconcile is spending blind.

### What cannot be decided from here

- **Any absolute CTR, CVR, CPM or ROAS target.** No account, no benchmark,
  nothing observed. The first four weeks of real spend *are* the benchmark.
- **Whether €27.08 CPA is achievable.** `ESTIMATE` only, built from assumed CTR
  and CVR.
- **Search volume for the category.** UNVERIFIED — Keyword Planner, week 1.
- **Creator rates in NL padel.** UNVERIFIED. Hence seeding, not paid placement.
- **Whether clubs will co-promote.** UNVERIFIED — ten calls, week 1.

---

## 7. Club outreach: the actual method

**Prioritisation** of the ~780 locations:
1. Venues with **outdoor courts** in the Randstad and the wetter north/west —
   the problem is most acute where the product's reason to exist is most visible.
2. Venues **running Najaars- and Wintercompetitie teams** — they have organised,
   contactable groups with a shared purchase moment.
3. **Commercial venues** (5.7 courts avg) before member clubs (4.5) for footfall;
   member clubs before commercial venues for community depth. Do both, in that
   order of effort.
4. Clubs with an active social account — they are already publishing and will
   have a reason to publish your content.

**The ask, in escalating order.** Never open with the biggest one.

| Tier | Ask | What they give | What they get |
|---|---|---|---|
| 0 | "Can we leave a demo bag at the bar for two weeks?" | Visibility, zero risk | A bag |
| 1 | "Can we run a wet-weather kit session after competition Sunday?" | Access to members, content | Content for their channels, an activity |
| 2 | "Would you send this to your members?" — club is the sender | Consented reach POLDER cannot lawfully buy | A member-only offer that is a real price for a defined group (lawful) and a revenue share |
| 3 | "Competition team pack" — a team of 4–8 kitted | A visible, uniformed reference on court | A genuine team price, documented |
| 4 | "Would you stock it?" | Distribution | Margin, sale-or-return in the first season |

**Rules.** Track every contact in the CSV — a club channel is only an asset if it
is a list, not a memory. Never ask a club to send to its members on POLDER's
behalf while pretending POLDER is the sender. Never harvest member emails from a
club; that is the club's data and processing it is unlawful without a basis
(`lifecycle-flows.md` §12). A member-only code is lawful; a "was €99, club price
€79" where €99 was never charged is not.

---

## 8. Weekly rhythm

**Monday, 30 minutes.** Last week: orders, blended CAC, cold CPA, AOV, refund
rate, subscription attach, club contacts made/converted, content published,
dispatch SLA. One decision per open gate. Recorded, so the reasoning survives.

**Reporting rule:** cold prospecting, retargeting and organic/club orders are
reported in three columns, never one. A blended number that hides a failing cold
channel behind club orders is how a business scales itself into a loss.

---

## 9. What this plan does not contain, deliberately

- **A revenue forecast.** Forecasting revenue from an unvalidated CPA, an
  unvalidated price band and an unverified supplier cost would produce a number
  with no information in it.
- **A media budget by channel.** Budget is defined as a multiple of allowable
  CPA, which resolves once a quote exists.
- **A target CAC, CTR or conversion rate.** See §6.
- **Belgium, Germany, marketplaces, retail.** Out of the 90-day window.

## 10. The conditions under which this plan should be abandoned

Carried forward from `business-case.md` §10, restated as marketing-observable
events:

1. Price check shows quality bags clustering below ~€45 → the €79 set has no
   room and cold acquisition cannot be funded. **Stop in week 1.**
2. Supplier quote above €22.90 landed → the order cannot pay for its own
   acquisition. **Stop before Phase 3.**
3. Ten clubs, ten refusals → the cheapest channel is gone and everything rests on
   paid social, which is the environment the thesis was built to avoid. **Not an
   automatic stop, but it forces a re-underwrite before any paid spend.**
4. Soft launch reaches 50 orders with subscription attach near zero → ~half the
   modelled LTV is absent. **Stop scaling; fix or re-underwrite.**

Each of these is cheaper to discover early than late, which is the entire reason
the phases are ordered this way.
