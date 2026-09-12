# Returns, withdrawal and conformity — POLDER

Written 2026-09-12. Read `../ACCESS-AND-LIMITS.md` first.

Every legal statement here comes from `../research/eu-compliance-constraints.md` §6,
which rests on secondary summaries — **no primary legal text could be opened**. Items
marked ★ **REQUIRE PROFESSIONAL VERIFICATION** by a Dutch consumer-law practitioner
before launch. The operational instructions are safe to follow; the legal conclusions
they rest on are not yet verified.

**Two different rights are described in this document and staff confuse them constantly:**

| | **Withdrawal** (Art. 9 CRD) | **Conformity** (Dir. 2019/771) |
|---|---|---|
| What it is | Change of mind, no reason needed | The product is faulty or not as described |
| Window | **14 days** from delivery | **2 years** minimum from delivery |
| Who pays return shipping | **Customer — only if told in advance** | **POLDER, always** |
| Remedy | Full refund incl. standard outbound shipping | Repair, replacement, price reduction, or refund |
| Can we refuse? | Only for the narrow legal exceptions | Only if we prove the goods conformed (first 12 months) |

Getting this wrong in one direction costs money; in the other it costs a
ConsuWijzer complaint. Train on the table above before the templates.

---

## 1. The rules, stated once

| Rule | Label |
|---|---|
| 14 days from delivery of the goods, no reason required | FACT, HIGH |
| Refund within **14 days** of being informed of the withdrawal, **including the standard outbound delivery cost** (not the premium, if the customer upgraded) | FACT, HIGH |
| The **consumer bears the direct cost of returning** the goods — **only if you informed them in advance**. Fail to inform and **you pay the return** | FACT, HIGH |
| Fail to inform of the withdrawal right at all and the window **extends, commonly to 12 months** | FACT, MEDIUM |
| A model withdrawal form must be made available | FACT, MEDIUM |
| From **19 June 2026**: a mandatory electronic **withdrawal function** on the online interface; withdrawing must not be more burdensome than buying | MEDIUM-HIGH ★ — scope under Dutch transposition unverified. **Build it anyway** |
| Legal conformity guarantee: **minimum 2 years**, EU-wide | FACT, HIGH |
| Burden of proof **reversed in the consumer's favour for the first 12 months** | FACT, HIGH |
| NL: conformity is framed around what the consumer may **reasonably expect** given price and nature, which for a durable item can exceed two years | ★ UNVERIFIED — requires verification |

---

## 2. The 14-day right of withdrawal, operationally

### 2a. What must be told to the customer, and where

**The consequence of not telling them is that POLDER pays every return leg, and the
window stretches to roughly a year.** This is the highest-value paragraph in the
document. The disclosure is not a legal formality; it is the thing that decides who pays.

The following must be published **before the order is placed**, reachable from the
product page, the cart and the checkout — not only in a terms page nobody opens:

1. That the right exists, and that it is 14 days from receipt of the goods.
2. That the customer bears the **direct cost of returning** the goods. If you do not say
   this, you pay it.
3. **A concrete indication of that cost**, for goods that cannot go by normal post. A
   padel bag is bulky. If POLDER cannot state the return cost, POLDER pays it. ★ Confirm
   the Dutch wording requirement; **the amount is REQUIRES QUOTE from the carrier** —
   ask for the consumer return-label price for the bag's parcel profile, NL→NL and BE→NL.
4. The address the goods go back to (the 3PL's returns address, not a home address).
5. The conditions and time limits, and the model withdrawal form.
6. That the customer may be liable for **diminished value** if they handled the goods
   beyond what is necessary to establish nature, characteristics and functioning.
7. Which, if any, exceptions apply. **ASSUMPTION: none of POLDER's launch SKUs fall
   within a withdrawal exception.** Hygiene/sealed-goods arguments for overgrips are
   tempting and weak — ★ verify before relying on one; until verified, accept returns of
   unopened grip sleeves without argument.

Put the same information in the parcel as a printed card (`fulfilment.md` §5b item 6).
Belt and braces, and it costs a cent.

### 2b. The electronic withdrawal function

Must be implemented before launch. Treat it as a hard launch blocker.

Requirements, as understood:
- A **function on the online interface** — a button or form — not only an email address.
- Reachable without logging in (a guest checkout customer has no account).
- **Not more burdensome than buying.** If checkout is three clicks, withdrawal cannot be
  a PDF the customer must print, sign and post.
- Must acknowledge receipt on a **durable medium** — i.e. send a confirmation email
  immediately, automatically, with a timestamp.
- Must record: order number, which items, date and time received by POLDER. **The
  timestamp starts the 14-day refund clock**, so it must be captured automatically and
  not depend on someone reading an inbox.

**Implementation status: NOT BUILT.** The theme (`shopify/theme/`) contains no withdrawal
form or route. `snippets/` has no such file and the locales have no such strings. The
footer carries only a "Retourneren" / "Returns" link. **This is a launch blocker and it
is not currently on the theme's to-do list.** Build as a page template plus a form that
writes to something durable, with an automatic confirmation email. ★ Verify the Dutch
transposition and the exact acknowledgement requirement with counsel.

### 2c. Who pays what — the decision table

| Situation | Outbound shipping | Return shipping | Refund |
|---|---|---|---|
| Withdrawal within 14 days, standard delivery | **Refund it** | Customer, if informed per §2a | Full |
| Withdrawal, customer paid for express upgrade | **Refund only the standard rate** | Customer, if informed | Full product price |
| Withdrawal, but §2a disclosure was missing or unclear | Refund it | **POLDER** | Full |
| Withdrawal, goods used beyond testing | Refund it | Customer, if informed | Full **minus a documented diminished-value deduction** — §2e |
| Faulty on arrival / not as described | Refund it | **POLDER** — send a prepaid label | Full, or replacement at customer's choice |
| Wrong item sent | Refund it | **POLDER** | Full, or correct item shipped free |
| Damaged in transit | Refund it | **POLDER** | Full, or replacement |
| Fault appearing within 12 months | n/a | **POLDER** | Repair/replace/reduce/refund — burden of proof is on POLDER |
| Fault appearing months 13–24 | n/a | **POLDER** if the claim succeeds | Same remedies; customer must show the fault existed at delivery |

**Never charge a restocking fee on a withdrawal.** It is not lawful under the CRD as
understood here and it generates complaints out of proportion to the amount.

### 2d. Refund timing and mechanics

- **Deadline: 14 days from being informed of the withdrawal** (not from receiving the
  goods). FACT.
- POLDER may **withhold the refund until the goods are received back, or until the
  customer supplies proof of dispatch, whichever is earlier** (FACT, MEDIUM — ★ verify).
  Use it, but do not weaponise it: if proof of dispatch arrives, refund.
- **Refund to the original payment method.** iDEAL refunds back to the originating
  account. Never offer store credit as the default and never as the only option.
- **No conditions on the refund.** Not a survey, not a review, not "once we've inspected
  it" beyond the inspection needed to assess diminished value.
- **Practical target: refund within 2 working days of the return being scanned in at the
  3PL.** The legal deadline is 14 days; using all 14 buys nothing and costs goodwill and
  chargebacks (`customer-service-sop.md` §5).
- Log the refund date against the withdrawal timestamp. If that gap ever exceeds 14 days,
  it is an incident, not an oversight.

### 2e. Diminished value

Permitted, but it is the single most complaint-generating deduction in EU e-commerce.
Rules for POLDER:

- The customer may **inspect** the goods as they would in a shop. For a bag that means:
  open it, look inside, try the straps, check the compartments. It does **not** mean
  taking it to a wet court for a month.
- A deduction requires **evidence**: dated photographs taken at the 3PL before any
  restocking action, and a written reason. No photograph, no deduction.
- **ASSUMPTION — POLDER policy:** deduct only where the item cannot be sold as new, and
  cap the deduction at the difference between the sale price and the realisable B-grade
  price. Never deduct for packaging alone. Below a threshold of a few euros, don't
  deduct — the ticket costs more than the money.
- Tell the customer the amount and the reason **before** refunding, with the photograph
  attached. A surprise deduction becomes a chargeback.

---

## 3. The 2-year conformity guarantee

### 3a. What it means day to day

A product must be as described and fit for purpose. If it is not, for **two years** from
delivery, the customer is entitled to a remedy at POLDER's cost. For the **first 12
months the burden of proof is reversed**: POLDER must prove the goods conformed at
delivery, not the customer prove they did not.

**In practice, inside 12 months, "the customer must have misused it" is not a defence
unless POLDER can evidence it.** Assume you will lose the argument and price the reserve
accordingly. Within 12 months, default to remedy; only contest where there is
photographic evidence of clear abuse.

### 3b. Remedy order

1. **Repair or replacement**, at the customer's choice, unless that choice is
   disproportionate. For a €50–90 bag, repair is rarely proportionate; **replace**.
2. If repair/replacement is impossible, disproportionate, or fails, or would cause
   significant inconvenience: **price reduction or refund**.

For a bag with a failed strap, the practical answer is: replace, no argument, and — this
matters — **treat it as a possible safety incident, not only a warranty claim**
(`gpsr-runbook.md` §6b). A strap failure inside 12 months on more than one unit of the
same batch is a recall conversation.

### 3c. What must be recorded on every conformity claim

Order number, batch code, date of delivery, date of failure, what failed, photographs,
what remedy was given, and — critically — **whether the same failure mode has been seen
before**. The register lives in the technical file (`gpsr-runbook.md` §3 item 12) because
it is evidence of the risk analysis being maintained.

### 3d. Returned-product warranty is not "no quibble forever"

Publish exactly what the legal guarantee is; do not publish a commercial guarantee you
have not costed. A "lifetime guarantee" on a wet-weather bag sold to Dutch club players
is a liability with no reserve behind it. ★ Any commercial guarantee beyond the legal
minimum must be reviewed by counsel and must state clearly that it is **in addition to**
and does not limit the statutory rights.

---

## 4. Physical handling: receiving, grading, restocking

### 4a. The flow

1. Customer triggers withdrawal (electronic function) or reports a fault (support).
2. Support issues a return authorisation number `RET-YYYY-NNNN` and, where POLDER pays,
   a prepaid label. Where the customer pays, give the address and the cost indication.
3. 3PL receives, scans against the RA number, **photographs the item and its packaging**,
   grades per §4b, and records the batch code from the label.
4. Support refunds per §2d.
5. Item is restocked, discounted, repaired or written off per §4c.
6. Reason code is recorded per §5.

Steps 3 and 6 are the ones a 3PL will not do unless contracted to
(`fulfilment.md` §2c q8, q26). If they will not, they arrive in a box at somebody's
house and none of this happens.

### 4b. Grading rubric

**ASSUMPTION — a chosen policy.** Calibrate after the first 50 returns.

| Grade | Definition | Disposition |
|---|---|---|
| **A** | Unused, all tags and packaging intact, indistinguishable from new | Restock as new |
| **B** | Used only for inspection. Tags may be detached, packaging opened or damaged, item unmarked | Repack in new packaging, restock as new if and only if genuinely indistinguishable. Otherwise B-stock |
| **C** | Visible use — marks, dirt, odour, wear. Fully functional | B-stock / outlet, clearly described as such. **Never sold as new** |
| **D** | Damaged, incomplete, or a safety-relevant defect | Quarantine. Do not resell. If the defect is safety-relevant, `gpsr-runbook.md` §6 |
| **Q** | Hygiene-sensitive and opened (grips) | Quarantine, do not resell. Refund the customer regardless |

**Grade D is where the compliance signal hides.** A D-grade return whose cause is a
component failure is a technical-file event, not a write-off. Route every D to the person
holding the compliance role before it is binned — and keep the item until they have seen
it.

### 4c. Restocking rules

- Restock only A and qualifying B. If there is a doubt, it is not A.
- **A returned unit re-enters stock with its original batch code.** If the 3PL cannot
  preserve that on restock, the traceability chain breaks at exactly the point where it
  is most likely to matter. Add it to the 3PL conversation explicitly.
- B-stock and C-stock sold at a lower price must be **described as used or ex-display**.
  Selling a returned item as new is both a conformity risk and, if the price is anchored
  against a "was" price, an Omnibus problem (`../CLAUDE.md`).
- Hold C and D out of the main inventory count so the storefront never shows them as
  available.

---

## 5. Returns data → product and copy decisions

Returns are the cheapest product research this business will ever have. They are only
useful if the reason is captured structurally rather than as free text.

### 5a. Reason codes — capture exactly these, on every return

| Code | Meaning | What it indicts |
|---|---|---|
| `R01` | Changed mind / no longer needed | Nothing. Noise floor |
| `R02` | Smaller/larger than expected | **Product page** — dimensions, scale photograph |
| `R03` | Looks different from the photos | **Photography and colour accuracy** |
| `R04` | Quality below expectation | **Product, or over-claiming copy** |
| `R05` | Doesn't fit my kit (racket, shoes, bottle) | **Spec copy** — publish internal dimensions and what fits |
| `R06` | Wet-weather features don't work as described | **The proposition itself.** Highest-severity code |
| `R07` | Arrived damaged | **Packaging or carrier** (`fulfilment.md` §8) |
| `R08` | Wrong item received | **3PL pick accuracy** |
| `R09` | Arrived too late | **The delivery promise** (`fulfilment.md` §4c) |
| `R10` | Faulty — component failure | **Technical file and possible incident** |
| `R11` | Ordered multiple to choose | Nothing, but it inflates the rate — track separately |
| `R12` | Subscription — too much product | **Cadence options** |

Free text is captured **in addition**, never instead. Quote the customer's own words back
into the product page; they write better spec copy than you do.

### 5b. The monthly review — 45 minutes, first Tuesday

1. Return rate overall, and per SKU. Trend, not a single month.
2. Rate by reason code. **R02/R03/R05 are copy defects and are free to fix.** Fix them the
   same week — they are the highest-ROI work available.
3. **R06 is the alarm.** The entire business case rests on the wet-weather claim
   (`../strategy/business-case.md` §5). Even a handful of R06 returns means either the
   product does not do what is claimed, or the copy claims more than the product does.
   Both are urgent and only one is cheap to fix.
4. **R10 crosses into `gpsr-runbook.md` §6b** — check whether any two R10s share a batch
   or a failure mode.
5. R08 and R09 are 3PL and carrier performance. Take them to the monthly 3PL review with
   numbers, not adjectives.
6. Record the actions taken. A review that produces no change was not a review.

### 5c. What returns data must never be used for

- To make the withdrawal process harder, slower or less visible. Suppressing the button
  to suppress the rate is unlawful and will be obvious to a regulator.
- To refuse a repeat returner without a documented, consistently applied policy that has
  been reviewed by counsel. ★
- To publish a "X% keep their bag" style statistic. It is not a verified figure and it
  is not our claim to make.

---

## 6. Subscriptions and returns

The overgrip subscription is the retention engine and it has its own failure modes.

- **Cancellation must be as easy as signing up.** Self-service, in the account, no email
  required, no retention gauntlet. ★ Verify against the Dutch transposition of the
  withdrawal-function rules, but the commercially correct answer is the same as the
  legally safe one.
- A **renewal is a new contract** — ★ verify whether each shipment carries a fresh 14-day
  withdrawal right. **ASSUMPTION until verified: treat every shipment as carrying one.**
  It is cheap; a grip sleeve is a low-value item and arguing about it is not.
- **Notify before every charge**, with a date and an amount, and a one-click skip and
  pause. Unannounced charges are the largest single source of chargebacks in subscription
  commerce (ASSUMPTION — no measured figure available here).
- **A pause is worth more than a save offer.** Padel in NL is seasonal; a player who stops
  in December is not a churned customer, they are a paused one. Offer pause first,
  cancel second, and make both visible.
- `R12` (too much product) is a cadence problem, not a churn problem. Offer a longer
  interval before offering a discount.

---

## 7. Launch blockers in this document

1. **The electronic withdrawal function does not exist in the theme.** §2b. Hard blocker.
2. **The §2a disclosure, including a concrete return-cost indication for the bag, is not
   written and the cost is not known.** Without it POLDER pays every return leg.
   REQUIRES QUOTE from the carrier.
3. **No 3PL has agreed to grade, photograph or reason-code returns.** Without that, §4
   and §5 are fiction.
4. **The two-year conformity tail is not in the economics model.**
   `../finance/src/economics.js` carries `refundRate`, `returnRate`, `returnShipCost`
   and `restockingLoss` — all first-order, in-window costs. It has **no separate
   provision for warranty replacements arriving in months 2–24**, which for a durable
   hero product with a 12-month reversed burden of proof is a real and recurring cost.
   ★ Add an input and model it before launch.
