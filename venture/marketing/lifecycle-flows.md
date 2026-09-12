# POLDER — lifecycle flows (email / SMS)

Written 2026-09-12. Market: Netherlands. Language: **Dutch**. Subject lines below
are written in Dutch as they would send, with an English gloss in brackets for
review.

---

## 0. Status, and the legal frame

### Nothing here is deployed

**No ESP is connected.** Per `ACCESS-AND-LIMITS.md` there is no Klaviyo, no
Shopify store, no customer list, no consent records and no sending domain. No
flow in this document has been built, tested or sent. This is a specification for
someone with an ESP account, not a description of a live programme.

**No performance figure appears in this document.** No open rate, click rate,
placed-order rate, revenue-per-recipient or churn benchmark, because none was
measurable and none was obtainable. Where a KPI is named, it names *the metric to
watch and what it would tell you*, and the baseline is the flow's own first four
weeks. Industry benchmarks quoted from memory would be fabrications.

### Prerequisites, in order

| # | Prerequisite | Why it blocks everything |
|---|---|---|
| P1 | ESP selected and connected to Shopify | No flows without it |
| P2 | Sending domain authenticated: SPF, DKIM, **DMARC** | Without DMARC, mail to Gmail/Yahoo bulk senders is rejected or junked. This is not optional |
| P3 | **Consent capture with a stored record**: timestamp, source, IP, and the exact wording shown | Under GDPR the controller must be able to *demonstrate* consent. An email address with no provenance is unusable and a liability |
| P4 | Consent Management Platform live, with no marketing or analytics identifier set before consent | Browse-abandonment and on-site identification depend on it |
| P5 | Transactional and marketing streams separated, on separate subdomains | So a marketing reputation problem never stops an order confirmation |
| P6 | Suppression list imported and honoured globally | An unsubscribe that only applies to one flow is an unsubscribe that failed |

### The consent rules that actually apply

**ePrivacy (Dutch implementation: Telecommunicatiewet art. 11.7) governs the
*send*. GDPR governs the *data*. You need both.**

`FACT` (DDMA, VDB Advocaten, Considerati, Holla — search summaries 2026-09-12;
**verify with Dutch counsel before sending, no primary text could be opened**):

- **Soft opt-in remains available for email and SMS in the Netherlands.** Its
  four conditions are cumulative:
  1. the contact details were obtained **in the context of a sale** of a similar
     product or service;
  2. the customer was **informed at the point of collection** that the details
     may be used for marketing;
  3. a **right to object was offered at that moment**;
  4. an **opt-out is offered in every single message**.
- **Soft opt-in for telemarketing was abolished on 1 July 2026.** Do not phone
  customers on a soft opt-in basis. Club outreach is B2B and a different matter,
  but consumer calling is out.
- **Everyone else requires prior, specific, unambiguous opt-in.** Waitlist
  signups, popup signups, competition entrants, people who left an email at
  checkout but never bought.

**Three consequences that change the design of these flows:**

1. **A cart or checkout abandoner who has never bought has no soft opt-in basis**
   — there was no sale. Unless they separately ticked a marketing consent box,
   emailing them is a marketing message without a lawful basis. Legitimate
   interest is contested for direct email marketing in NL and is not a defence
   to be relied on by a startup. **So abandonment flows below are gated on
   consent, and the checkout must ask for it explicitly, unbundled, unticked.**
   This reduces recoverable revenue. It is a deliberate trade, and it is not
   optional.
2. **Soft opt-in is limited to "similar products".** A bag buyer receiving grip
   marketing is squarely similar. A bag buyer receiving marketing for a future
   unrelated category is not.
3. **Transactional messages are contract performance** (GDPR Art. 6(1)(b)) and
   need no marketing consent — **but inserting promotional content into a
   transactional email converts it into a marketing message.** Order
   confirmations therefore carry product information and service content, not
   offers. This is why the post-purchase sequence is built the way it is below.

### Content rules, inherited and binding

Everything in `creative-bank.md` §2 applies to email and SMS without exception:

- No "was" price that was never charged (Omnibus Art. 6a — reference price must
  be the lowest applied in the preceding 30 days).
- **No countdown timer that resets, and no live countdown image in email at
  all.** An email is opened at an unpredictable time; a timer that reads "2 hours
  left" on an email opened three days later is a fabricated urgency claim.
- No fabricated scarcity. "Nog X op voorraad" only if it reads live inventory.
- **No review from anyone other than a verified purchaser of this store.**
- No health, injury or performance claims.
- No "waterdicht" unqualified. State the figure and the limit.
- Every message: physical address of the seller, a working one-click
  unsubscribe, identifiable sender.

---

## 1. Pre-launch waitlist (F-00)

| | |
|---|---|
| **Trigger** | Waitlist form submitted (`/pages/wachtlijst`, live from week 2 of `launch-plan.md`) |
| **Audience** | Non-customers. Zero prior relationship |
| **Consent basis** | **Explicit opt-in required.** Unticked, unbundled checkbox with its own wording. No pre-ticked boxes, no "by signing up you agree". Store timestamp + wording version. Double opt-in recommended — not legally required in NL for email, but it produces a defensible record and a cleaner list |
| **Suppression** | Anyone who purchases exits immediately to F-03 |

| # | Delay | Subject (NL) | Point |
|---|---|---|---|
| 1 | Immediate | **Je staat op de lijst** *(You're on the list)* | Confirm, set expectation of what and how often. Ask **one** question with one-click answers: *hoe vaak speel je? 1× / 2× / 3+ per week*. This single field drives the entire replenishment cadence in F-08 — collecting it now, before there is any purchase pressure, is the cheapest it will ever be |
| 2 | +4 days | **Waarom padeltassen niet voor dit weer gemaakt zijn** *(Why padel bags aren't built for this weather)* | The origin argument (`positioning.md`). Content, not product. Establishes why the brand exists before it asks for anything |
| 3 | +9 days | **5.000 mm, en wat dat niet betekent** *(…and what it doesn't mean)* | The spec and the honest limit. This is the trust move; it also pre-answers the biggest objection |
| 4 | +14 days | **Zo ziet hij eruit** *(This is what it looks like)* | Product reveal, photography, what's in the set, price. Still no ask |
| 5 | Launch day | **Vanaf nu te bestellen** *(Available from now)* | The only commercial email in the flow. Real delivery date range |

**Offer:** none before launch day. On launch day, early access — a genuine time
window, not a fake discount. A window is lawful; an invented "was" price is not.

**KPI:** proportion of the list that answers the play-frequency question (this is
the flow's real product); launch-day conversion of the list; unsubscribe rate
across messages 2–4, which tells you whether the content earns its place.

---

## 2. Welcome — subscribed, not purchased (F-01)

| | |
|---|---|
| **Trigger** | Marketing consent given without a purchase (footer signup, popup, post-launch waitlist) |
| **Audience** | Consented non-buyers |
| **Consent** | **Explicit opt-in.** Same standard as F-00 |
| **Delay** | Message 1 immediate; then as below |
| **Suppression** | Exits on purchase → F-03. Suppressed while in F-02/F-04/F-05 (abandonment outranks nurture — they are further down the funnel) |

| # | Delay | Subject (NL) | Point |
|---|---|---|---|
| 1 | 0h | **Welkom. Eén vraag.** | Deliver whatever was promised at signup. Ask the play-frequency question. Set frequency expectation honestly ("ongeveer twee mails per maand") and keep to it |
| 2 | +2d | **Nat vak, droog vak** | The single strongest product argument, with the photograph. Links to `/pages/regen` |
| 3 | +5d | **Wat de garantie niet dekt** | Exclusions first. Differentiating, disarming, and it pre-empts the return-risk objection that stops first purchases from unknown brands |
| 4 | +9d | **Wat er in de starterset zit** | The set as the default, with the real arithmetic. First clear commercial ask |
| 5 | +16d | **Hoe vaak vervang jij je grip?** | Introduces the consumable and the subscription. Also a second chance to capture play frequency from anyone who skipped it |

**Offer:** free NL shipping on the first order (threshold TBD) — a real,
permanent-for-the-recipient benefit rather than a discount. Protects the €79
price the economics require (`unit-economics.md`: a €49 order leaves almost
nothing, a €39 order cannot fund acquisition at all). **Discounting the hero to
win a first order breaks the model that the first order is supposed to fund.**

**KPI:** first-purchase rate within 30 days of signup; play-frequency capture
rate; unsubscribe rate per message (identifies which message is unwelcome, not
just that some are).

---

## 3. Browse abandonment (F-02)

| | |
|---|---|
| **Trigger** | Viewed a product page ≥2 times, or one page >60s, no add-to-cart in 24h |
| **Audience** | **Identified AND marketing-consented AND cookie-consented only** |
| **Consent** | Three-way gate: (a) ePrivacy cookie consent for the tracking identifier, (b) email marketing consent or existing-customer soft opt-in, (c) an identity link. **Missing any one → no send.** Fire a retargeting audience instead |
| **Delay** | 4h |
| **Suppression** | Cart or checkout started → exits to F-04/F-05. Purchased in 24h → suppress. Max once per 14 days per person |

| # | Delay | Subject (NL) | Point |
|---|---|---|---|
| 1 | +4h | **Je keek naar de starterset** | Plain, non-creepy, names the product. Repeats the two facts most likely to be the sticking point: what's in it, and the delivery date range. No offer |
| 2 | +2d, only if no purchase and message 1 was opened | **De drie vragen die we het vaakst krijgen** | Objection handling from real support tickets (available from week 6 of the soft launch — **do not write this email before the tickets exist**, or you are guessing at objections) |

**Offer:** none. Browsing is not hesitation about price; it is usually hesitation
about fit or trust, and a discount answers a question nobody asked while training
the list to wait.

**KPI:** return-to-site rate; purchase rate within 72h; complaint/unsubscribe
rate (browse emails have the highest creepiness risk in the programme — watch it
directly, and kill message 2 first if complaints rise).

---

## 4. Cart abandonment (F-04)

| | |
|---|---|
| **Trigger** | Add-to-cart, no checkout started, 1h elapsed |
| **Audience** | Consented contacts and existing customers only |
| **Consent** | Existing customer → **soft opt-in** (similar product, informed at collection, objection offered, opt-out in the message). Never purchased and never consented → **no send.** Retarget on paid instead |
| **Delay** | 1h / 20h / 44h |
| **Suppression** | Purchase at any point; active F-05; out of stock on the cart item (never drive traffic to an unbuyable page) |

| # | Delay | Subject (NL) | Point |
|---|---|---|---|
| 1 | +1h | **Je tas ligt nog in je winkelwagen** | Plain reminder, cart contents, one button. No offer, no urgency. Most carts are interruptions, not objections |
| 2 | +20h | **Verzonden uit Nederland, prijs incl. btw** | Removes the risk objection: delivery date range, shipping cost stated, 14-day withdrawal, the guarantee with its exclusions linked |
| 3 | +44h | **Twijfel je over de maat van je racket erin?** | The single most common practical objection, answered specifically. Final message. Exit |

**Offer:** none in messages 1–2. **No discount in message 3 either** — see the
policy note below.

**KPI:** cart recovery rate; revenue per recipient; unsubscribe rate.

### The discount decision, stated explicitly

The standard tactic is a discount code in the third message. **This programme
does not use one, for three reasons:**

1. **Economics.** At €79 with a modelled contribution of €27.08 at the sourcing
   ceiling, a 10% discount removes ~€7.90 — roughly 29% of contribution, and at
   the ceiling that is the entire first-order profit target and more. The order
   stops paying for its own acquisition.
2. **Law.** A discount that appears in a lifecycle email and then reappears every
   time anyone abandons a cart is effectively the real price, and continuing to
   display the higher price as the normal price becomes a false reference price
   under Omnibus Art. 6a.
3. **Model.** A subscription business that trains its list to abandon-then-wait
   has taught its best customers to cost more.

**If recovery proves weak, the lever is trust and clarity — delivery date,
returns, sizing — not price.** That is a testable position, and the test is a
content change, not a margin change.

---

## 5. Checkout abandonment (F-05)

| | |
|---|---|
| **Trigger** | Checkout started (email captured), not completed, 30 min elapsed |
| **Audience** | As F-04. **Consent gate identical — an email typed into a checkout field is not consent to marketing** |
| **Delay** | 30 min / 12h / 36h |
| **Suppression** | Purchase; payment currently processing; a failed payment (→ a *service* message instead, which is transactional and needs no consent) |

| # | Delay | Subject (NL) | Point |
|---|---|---|---|
| 1 | +30m | **Je bestelling is niet afgerond** | Highest-intent moment in the programme. Resume link. Often a genuine technical failure — offer a route to support in the first line |
| 2 | +12h | **iDEAL, creditcard of achteraf betalen** | Payment friction is the most common checkout-stage cause in NL. Name the methods explicitly. If iDEAL was missing or buried, the email will not fix it — fix the checkout |
| 3 | +36h | **Alles wat je moet weten voordat je bestelt** | Consolidated: delivery date range, cost, returns, guarantee + exclusions, contact. Exit |

**Offer:** none. Checkout abandonment is disproportionately mechanical.

**KPI:** checkout recovery rate; **and the diagnostic that matters more** — if
message 2 consistently outperforms, the checkout has a payment problem and the
email is compensating for a defect that should be fixed at source.

---

## 6. Post-purchase / transactional (F-03)

| | |
|---|---|
| **Trigger** | Order placed |
| **Audience** | All buyers |
| **Consent** | **Contract performance, GDPR Art. 6(1)(b). No marketing consent required — and therefore no marketing content.** No offers, no cross-sell blocks, no discount codes. This keeps the messages lawfully transactional and keeps them out of the promotions tab |
| **Suppression** | None. These always send |

| # | Delay | Subject (NL) | Point |
|---|---|---|---|
| 1 | Immediate | **Bestelling bevestigd — bezorgd rond [datum]** | The date range in the subject line. It is the positioning pillar and the most-asked question; putting it in the subject removes a support contact |
| 2 | On dispatch | **Onderweg — track & trace** | Carrier, tracking link, expected date. **And the marketing consent ask**, framed honestly and separately: "wil je bericht als je grips toe zijn aan vervanging?" — a specific, useful, unbundled opt-in, asked at the moment goodwill is highest |
| 3 | On delivery | **Bezorgd** | Confirms, links to care and setup, gives the support route. Closes the delivery-certainty loop |

**Note on message 2:** the consent ask is a *request*, not marketing content —
permitted. The line is: asking permission is not the same as advertising. Keep
the ask to one sentence and one control; do not attach product promotion to it.

**KPI:** support contacts per order (the real measure of whether these messages
work); consent opt-in rate from message 2 — this single rate determines how much
of the rest of the programme is lawfully reachable.

---

## 7. Onboarding and first-use (F-06)

| | |
|---|---|
| **Trigger** | Delivery confirmed |
| **Audience** | Buyers **with marketing consent or valid soft opt-in** |
| **Consent** | Soft opt-in applies — same seller, similar products, opt-out in every message |
| **Delay** | +2d / +7d / +21d |
| **Suppression** | Return or refund initiated → suppress the entire flow immediately and move to a service conversation. Nothing is worse than a "hoe bevalt hij?" email to someone who is sending it back |

| # | Delay | Subject (NL) | Point |
|---|---|---|---|
| 1 | +2d | **Vier dingen die je tas kan die je nog niet weet** | Feature adoption. The wet/dry divider, the shoe vents, the rain cover, the drainage. Adoption of the differentiating features is what makes the product worth recommending |
| 2 | +7d | **Zo blijft de waterafstoting werken** | DWR care: how it degrades, how to restore it. **The most important retention email in the first month** — a DWR that stops beading feels like the product failed, and the complaint arrives as a refund rather than a question |
| 3 | +21d | **Hoe vaak speel jij?** | Capture or confirm play frequency if still unknown. **This is the input to F-08.** One tap: 1× / 2× / 3+ per week |

**Offer:** none. This flow protects the purchase; it doesn't sell.

**KPI:** feature-adoption (proxy: click-through on message 1); 30-day refund rate
among recipients vs non-recipients; play-frequency capture rate.

---

## 8. Review request (F-07)

| | |
|---|---|
| **Trigger** | Delivery + 21 days (long enough that the product has been rained on at least once — a review of an unused bag is worthless) |
| **Audience** | Buyers, no open return, no unresolved support ticket |
| **Consent** | Soft opt-in. Note: a review request is arguably service rather than marketing, but treat it as marketing and honour opt-outs — the cautious reading costs nothing |
| **Delay** | +21d, one follow-up at +31d |
| **Suppression** | Refunded, returned, open ticket, already reviewed, opted out |

| # | Delay | Subject (NL) | Point |
|---|---|---|---|
| 1 | +21d | **Heeft hij al in de regen gelegen?** | Specific question, not "leave a review". Invites the review the product is actually for |
| 2 | +31d | **Eén vraag: zou je hem aanraden?** | Single follow-up. Then stop |

**Offer: none, ever.** Incentivising reviews is high-risk under Omnibus, and a
review programme that pays for reviews is not usable as social proof. **Only
verified purchasers of this store may be displayed, and negative reviews may not
be suppressed or filtered** (`CLAUDE.md`).

**KPI:** review submission rate; **and the content of the reviews**, which is
input to `creative-bank.md`. Reviews that independently use the wet/dry language
confirm the positioning; reviews that talk about something else mean the
positioning is the brand's idea rather than the customer's.

---

## 9. Grip replenishment (F-08) — **the business model**

`unit-economics.md`: ~**49.8%** of modelled lifetime contribution comes from
repeat purchase, and the first order at the sourcing ceiling makes **zero**
profit. **If this flow does not work, the business is a one-shot bag seller
buying expensive traffic — which is the exact failure `business-case.md` §9
names.** Every other flow is supporting infrastructure for this one.

### The cadence problem, stated honestly

Overgrips degrade within a few sessions (`business-case.md` §4). The replacement
interval is therefore a function of **play frequency**, which varies by a factor
of three across the customer base. A single fixed reminder cadence will be too
early for the recreational player (feels like pressure, drives unsubscribes) and
too late for the competition player (they already bought grips elsewhere, and
the habit is lost).

**Therefore cadence is declared by the customer, not assumed by us.** This is why
play frequency is asked in F-00, F-01, F-06 and at checkout — four chances at the
one input that makes this flow work.

**Provisional mapping — `ASSUMPTION`, reasoning shown, to be replaced with real
data:**

| Declared play frequency | Grips consumed | First reminder at |
|---|---|---|
| 1× per week | ~4 sessions/month | Day 75 |
| 2× per week | ~8 sessions/month | Day 50 |
| 3+ per week | ~12+ sessions/month | Day 35 |
| Not declared | — | Day 55, and the email leads by asking |

*Reasoning:* a 3-pack at roughly one grip per four sessions gives ~12 sessions of
supply, converted to weeks at each frequency, then set slightly early so the
delivery arrives before the last grip is used. **Every one of those steps is an
assumption.**

**The data that would replace it: the median interval between first and second
grip purchase among the first ~200 non-subscription grip reorders.** That is a
real measurement, it is available from the store's own order data by roughly
month 4, and it makes this table obsolete. **Recalibrate then, and again at
1,000 orders.** Do not treat the table above as anything other than a starting
guess that exists so the flow can launch.

### 9a. Non-subscribers — reminder → conversion

| | |
|---|---|
| **Trigger** | Days since last grip purchase ≥ the mapped threshold |
| **Audience** | Buyers who are not subscribers |
| **Consent** | Soft opt-in — grips are a similar product to the set that contained them. Squarely within scope |
| **Suppression** | Active subscriber; grip purchase in the last 21 days; open return; in F-10 win-back |

| # | Delay | Subject (NL) | Point |
|---|---|---|---|
| 1 | At threshold | **Tijd voor nieuwe grips?** | A question, not an instruction — it makes a wrong cadence harmless. One-tap reorder of the exact same item. Second link: *"nog niet — herinner me later"*, which both defers and **teaches the system the customer's real interval.** That correction signal is worth more than the order |
| 2 | +10d if no action | **Versleten grip vs nieuwe** | The C15 comparison visual. Grip wear is invisible until contrasted. No claim about play quality, slipping or injury |
| 3 | +20d if no action | **Of laat het automatisch komen** | Convert to subscription. Cadence choice, cancel-anytime stated plainly, price and renewal terms disclosed before consent |

**Offer:** free letterbox shipping on grip reorders if the basket is too small to
carry a parcel cost — **an operational solution, not a discount.** Grips must
post through a letterbox; if they don't, this flow's economics need rechecking
before it launches.

**KPI:** reorder rate within 30 days of the reminder; **the "remind me later"
rate, which is the cadence-calibration signal**; conversion from reminder to
subscription; unsubscribe rate (rising unsubscribes = cadence too aggressive,
and that is a fixable setting, not a reason to abandon the flow).

### 9b. Subscribers — retention

| | |
|---|---|
| **Trigger** | Subscription events |
| **Audience** | Active subscribers |
| **Consent** | Pre-renewal notices are **contractual, not marketing** — they send regardless of marketing consent, and a renewing subscription in the EU needs a genuine, easy cancellation route |

| # | Trigger | Subject (NL) | Point |
|---|---|---|---|
| 1 | 5d before charge | **Je grips komen eraan — wijzigen kan tot [datum]** | Legally sound and commercially right: a customer who can skip does not cancel. Skip, change cadence, change item, pause, cancel — all one tap |
| 2 | On dispatch | **Onderweg** | Transactional |
| 3 | After 3rd delivery | **Klopt het interval nog?** | The single most valuable subscription email. Mis-set cadence is the largest cause of subscription cancellation (`ASSUMPTION`, reasoning: excess stock is a visible, recurring reminder to cancel). Offer slower as prominently as faster |
| 4 | Payment failure, day 1 / 3 / 7 | **Betaling niet gelukt** | Dunning. Involuntary churn is churn nobody chose. Three attempts, then pause rather than cancel — a paused subscription is recoverable, a cancelled one is a new acquisition |
| 5 | On cancel request | **Voordat je stopt: pauzeren kan ook** | Offer pause with a date, and cadence change, **before** the cancel button — but the cancel button must be present on the same screen and must work. A cancellation flow that hides the exit is a prohibited dark pattern and an enforcement target |
| 6 | 30d after cancel | **Grips nodig?** | One message. One-off purchase, no subscription ask |

**KPI:** subscription retention by cohort month; **involuntary vs voluntary churn
split** (different problems, different fixes); pause-vs-cancel ratio;
cadence-change rate.

---

## 10. Win-back (F-09)

| | |
|---|---|
| **Trigger** | 120 days since last order, not a subscriber, no engagement in 60 days |
| **Audience** | Lapsed buyers |
| **Consent** | Soft opt-in persists for existing customers, but **check whether the ESP or your own policy sunsets it** — and note the practical point: a contact who has not opened anything in 6 months is a deliverability liability regardless of legality |
| **Delay** | 120d / +14d / +30d |
| **Suppression** | Any purchase; any subscription; unsubscribed; hard-bounced |

| # | Delay | Subject (NL) | Point |
|---|---|---|---|
| 1 | 120d | **Nog steeds droog?** | Product check-in framed as service. Links to DWR restoration — the most likely reason a lapsed customer has quietly stopped liking the product |
| 2 | +14d | **Wat we sinds jouw bestelling hebben toegevoegd** | New products, honestly. No manufactured news |
| 3 | +30d | **Wil je deze mails nog ontvangen?** | Explicit re-permission. Two buttons: stay / stop. **Anyone who does not click is suppressed from marketing.** Deliberately shrinking the list protects the inbox placement of the flows that actually make money |

**Offer:** none in 1–2. In message 3 a genuine returning-customer benefit is
defensible, but **never a "was/now" construction** — the reference price rule
makes that a trap for a brand with a short price history.

**KPI:** reactivation rate; **and list-health improvement after the sunset**,
which is the real point of message 3.

---

## 11. VIP (F-11)

| | |
|---|---|
| **Trigger** | Entry on any of: ≥3 orders; ≥6 months' continuous subscription; lifetime value above a threshold set from real data (not set here — no order data exists) |
| **Audience** | Best customers |
| **Consent** | Soft opt-in |
| **Suppression** | Exits on subscription cancellation + 90 days lapsed |

| # | Trigger | Subject (NL) | Point |
|---|---|---|---|
| 1 | On entry | **Je hoort bij de eerste honderd** | Recognition, specific and true. Name the benefits, which are **access and input, not discount**: early access to new products, a direct reply address, a say in colourways |
| 2 | Before each launch | **Eerst voor jou: [product]** | Genuine early access window. Lawful, costs no margin |
| 3 | Quarterly | **Wat zou je veranderen?** | Product development input. Converts the best customers into the product team, which is the cheapest research this business will ever get |
| 4 | Ad hoc | **Wil je hem testen in de winter?** | Product testing. Produces (a) real durability data for the substantiation file and (b) genuine UGC from verified purchasers, which is the only social proof that may lawfully be displayed |

**Offer:** access, not price. Discounting the most loyal cohort is the most
expensive discount available and the least necessary.

**KPI:** repeat rate and LTV of the VIP cohort vs matched non-VIP; referral
rate; usable UGC produced.

---

## 12. Club / B2B (F-12) — a different legal regime

| | |
|---|---|
| **Trigger** | Club form submitted, or a call logged from the `launch-plan.md` §7 outreach |
| **Audience** | Club managers, trainers, competition-team captains |
| **Consent** | **B2B email marketing to a business contact does not require prior consent under art. 11.7 Tw, but an opt-out must be offered in every message and honoured.** Verify with counsel — the natural-person/legal-person distinction matters and sole traders sit awkwardly in it |
| **Delay** | Manual-first, automated follow-up |

| # | Delay | Subject (NL) | Point |
|---|---|---|---|
| 1 | +0 | **Demotas voor [clubnaam]** | Tier 0 ask only (`launch-plan.md` §7): leave a bag at the bar for two weeks. Smallest possible yes |
| 2 | +7d | **Teamtassen voor de wintercompetitie** | Seasonal, specific, tied to the published KNLTB winter schedule |
| 3 | +21d | **Wat andere clubs ermee doen** | Only once there is a real example. **Do not write this email before a club has actually done something** |

### The rule that must not be broken

**Member email addresses belong to the club, not to POLDER.** A club may send to
its own members — the club is the sender and POLDER supplies the content.
**Uploading a club's member list into POLDER's ESP, or emailing members directly
off the back of a club relationship, has no lawful basis and would be a
straightforward GDPR breach.** It is also the fastest possible way to lose the
channel that `business-case.md` §7 identifies as the most durable layer of the
moat.

**KPI:** club contacts → demo placements → member sends → attributable orders,
tracked as a four-stage funnel with a per-club UTM.

---

## 13. SMS

**Not in the first 90 days.** Reasoning:

1. SMS requires the same consent standard as email under art. 11.7 Tw, and a
   separate collection point — so it cannot piggyback on the email list.
2. It costs per message where email does not, so it only pays on high-intent
   moments.
3. There is no volume yet to justify a second channel's setup and compliance
   overhead.

**When it does launch, three use cases only:** dispatch/delivery notification
(transactional), pre-renewal notice for subscribers (contractual, and genuinely
useful because it is actionable in one tap), and checkout abandonment for
consented contacts. **Never** promotional broadcast.

---

## 14. Global suppression and frequency rules

| Rule | Reason |
|---|---|
| One marketing email per person per 48h, hard cap | Frequency is the main driver of unsubscribes and spam complaints |
| Transactional messages ignore the cap | They are not marketing |
| Flow priority when several qualify: **F-05 > F-04 > F-08 > F-02 > F-01/F-09** | Higher intent wins. Nurture never pre-empts an abandoned checkout |
| Anyone with an open support ticket or return is suppressed from all marketing | Obvious, and routinely got wrong |
| Anyone who has ordered in the last 3 days is suppressed from promotional campaigns | Nothing is worse than receiving an offer the day after paying full price |
| Unsubscribe is **global and immediate** across all flows and campaigns | A per-flow opt-out is not an opt-out |
| Engagement sunset: no marketing to anyone with zero opens in 180 days, after one re-permission attempt | Deliverability, and it is the legally safer reading of "ongoing consent" |
| Hard bounces suppressed permanently; soft bounces after 3 | Deliverability |

---

## 15. What cannot be specified without data that does not exist

Stated plainly rather than filled with plausible-looking numbers:

| Unknown | Data needed | Available when |
|---|---|---|
| **The real grip replacement interval** — the single most important number in the programme | Median interval between 1st and 2nd grip purchase, ~200 non-subscription reorders | ~Month 4 of trading |
| Which flows produce revenue | Attributed revenue per flow from the ESP | 60 days after deployment |
| Subject-line performance | The flows' own first 4 weeks. **No open or click benchmark is quoted here because none was obtainable and inventing one would be worse than having none** | 4 weeks after deployment |
| The VIP entry threshold | Real LTV distribution | ~Month 6 |
| Whether SMS pays | Email programme baseline to compare against | Month 4+ |
| Subscription churn curve | Cohort data | ~Month 6 |
| Whether soft opt-in survives a regulator's reading of "similar product" for a bag→grip relationship | **Dutch counsel.** The bag→grip case looks strong. Bag→any future category does not | Before the first soft opt-in send |

## 16. Deployment order

Build in the order in which each flow can actually earn, not in the order they
appear above:

1. **F-03 post-purchase** — required to trade at all, and it captures the
   marketing consent everything else depends on.
2. **F-05 checkout + F-04 cart** — highest intent, immediate return.
3. **F-08 grip replenishment** — build it before it is needed. The first cohort
   hits the day-35 threshold five weeks after the soft launch, and a flow built
   in week 6 is a flow that missed its first cohort.
4. **F-01 welcome** — matters once traffic is running.
5. **F-06 onboarding + F-07 reviews** — reviews gate the paid-launch checklist
   (`launch-plan.md` Gate 2→3 requires 10 verified reviews), so this is not
   optional and it is not late.
6. **F-02 browse, F-09 win-back, F-11 VIP** — none of these have a population
   large enough to matter in the first 90 days.

**F-00 waitlist is built first of all**, in week 2, because it is the only flow
that must exist before there is a product to sell.
