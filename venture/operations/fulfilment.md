# Fulfilment — POLDER

Written 2026-09-12. Read `../ACCESS-AND-LIMITS.md` first.

**No 3PL has been contacted. No carrier has been contacted. No rate, fee, cut-off time
or lead time in this document is a quote.** Every such figure reads `REQUIRES QUOTE`
followed by exactly what to ask. If you find a number here that is not tagged, it is a
defect — report it (`../CLAUDE.md` non-negotiable 1).

---

## 1. What fulfilment has to deliver, in order of importance

1. **A delivery promise the storefront can publish without lying.** The theme's
   `delivery_estimate` setting (`sections/main-product.liquid`, block `buy`) carries the
   instruction "Use a date range, not a duration. Only promise what fulfilment has
   committed to." §4 is how that string is derived. It is not a marketing decision.
2. **Batch-level traceability** so a recall is possible at all (`gpsr-runbook.md` §5c).
3. **A cheap, predictable return leg** — EU returns are structural, not exceptional
   (`returns.md`).
4. **Cost per order low enough that a €50–90 basket survives it.** Unknowable until §2
   returns answers.
5. **Subscription picking** — small, frequent, low-value overgrip shipments have a cost
   profile that destroys subscriptions if the per-order fee is flat and high.

Point 5 is the one most likely to be missed in a 3PL conversation, because a 3PL will
quote on the hero product and you will discover the subscription economics afterwards.
Ask about it first, not last.

---

## 2. 3PL selection

### 2a. Hard requirements — no quote needed to rule someone out

A 3PL that fails any of these is off the list regardless of price.

| # | Requirement | Why |
|---|---|---|
| 1 | Warehouse physically in NL (or immediately adjacent BE/DE) | Next-day NL delivery is the only delivery advantage this business has; it dies with a warehouse in Poland |
| 2 | Native Shopify integration, order sync and tracking write-back | Without tracking write-back, "where is my order" becomes manual and eats the founder's week |
| 3 | **Lot / batch tracking on inbound and outbound**, or a written commitment to the one-batch-at-a-time fallback | GPSR recall capability. Non-negotiable |
| 4 | Will handle returns: receive, inspect, grade, and put back to stock on instruction | Otherwise returns come to a home address and grading never happens |
| 5 | Will apply POLDER-supplied inserts and use POLDER-supplied packaging | Brand signal and PPWR control |
| 6 | Contract term ≤ 12 months, with a defined exit and stock-release process | A 3PL that holds your stock hostage on exit is a single point of failure for the whole business |
| 7 | Will state a written daily cut-off time and a same-day-dispatch SLA | §4 cannot be written without it |
| 8 | Will confirm, in writing, that it is aware of PPWR gatekeeper duties and what it will ask POLDER to produce | `../research/business-model-sourcing.md` §5.5 — your 3PL will ask for your EPR registration; find out now, not on go-live day |

### 2b. Scoring criteria, weighted

Score 1–5 against each, multiply, sum. Apply only once real quotes exist.

| Weight | Criterion | "5" looks like |
|---|---|---|
| 18 | **All-in cost at realistic volume** — not the headline pick fee | Transparent: storage + pick + pack + materials + inbound + returns, modelled at your actual order mix |
| 15 | **Same-day dispatch SLA and cut-off** | Late cut-off, written SLA, measured and reported |
| 12 | **Batch/lot control** | Full lot tracking, queryable by order |
| 12 | **Small-parcel / subscription economics** | A distinct, low rate for a letterbox-format single-grip shipment |
| 10 | **Returns handling depth** | Receive, photograph, grade to our rubric, restock or quarantine on rule |
| 8 | **Minimum monthly commitment** | None, or low enough to survive month one |
| 8 | **Shopify integration quality and support responsiveness** | Named contact, <1 business day |
| 7 | **Carrier choice** — can we choose, or are we locked to their contract? | Multi-carrier, and we can add one |
| 5 | **Exit terms** | Stock released within a stated number of days at a stated cost |
| 5 | **Peak/seasonality handling** | Stated capacity, no surcharge surprises |

**ASSUMPTION:** these weights are a starting position, not a measurement. Re-weight once
two real quotes are in hand and the cost structure is visible.

### 2c. The RFQ — send this verbatim

Subject: *RFQ — NL fulfilment for a small own-brand sports accessories catalogue*

Context paragraph to include: NL-established own-brand merchant, Shopify, 3–6 SKUs at
launch, one bulky item (sports bag) and one small consumable (overgrips) sold both
singly and on subscription, NL-only at launch with Belgium added within 12 months,
own-imported stock arriving by sea/air freight in cartons.

**Commercials**
1. What is your **one-off setup/onboarding fee**, and what does it include?
2. What is your **minimum monthly charge or minimum order commitment**, and does it apply
   from month one?
3. What is your **storage charge**, and on what unit — pallet, shelf, bin, cubic metre —
   and is it charged monthly or per period?
4. What is your **pick-and-pack charge** for (a) a single bag, (b) a single overgrip
   sleeve, (c) a bag + 3 grips + 1 protector set?
5. Is there a **separate charge per additional line** in an order, and how much?
6. What do you charge for **packaging materials**, and what is the charge if we supply our
   own boxes and mailers?
7. What is your **inbound receiving charge** — per pallet, per carton, or per unit — and
   what happens to that charge if cartons are mixed-SKU?
8. What is your charge for **receiving and processing a return**, including inspection?
9. What is the charge for **relabelling, repacking, or kitting** a bundle?
10. Which charges are **indexed or subject to annual increase**, and with what notice?
11. Are your quoted prices **fixed, and for how long**?

**Operations**
12. What is your **daily cut-off time** for same-day dispatch, and does it differ by
    carrier or by day of week?
13. Do you dispatch on **Saturdays**? Which public holidays do you not dispatch on?
14. What **same-day-dispatch percentage** do you commit to contractually, and what do you
    actually achieve? Will you report it to us monthly?
15. How long after inbound arrival are goods **available to sell** (receipt-to-live time)?
16. What is your **order accuracy rate** and how is it measured?
17. What happens when an order is **picked incorrectly** — who bears the cost of the
    replacement, the return, and the shipping?
18. Do you provide **photographic evidence** of packed orders, and is it retained?
19. Can you handle a **letterbox-format** shipment for a single overgrip sleeve, and at
    what cost?
20. Can you support a **subscription order profile** — recurring, small, predictable —
    and do you price it differently?

**Compliance — ask these explicitly, they are not standard**
21. Do you offer **lot / batch tracking**? Can you tell us, for a given batch code, which
    order numbers received units from it? Is there an extra charge?
22. If not, will you commit in writing to **holding only one batch of a SKU in the pick
    face at a time**, with dated changeovers reported to us?
23. Can you **quarantine and hold** stock on our instruction within one business day
    (product recall scenario)?
24. What do you require from us regarding **EPR / packaging registration** under PPWR,
    and at what point in onboarding?
25. Will you apply **our packaging and our inserts**, and is there a charge?
26. Do you record **inbound goods condition and quantity discrepancies** in writing, with
    photographs, as standard?
27. Who is your **named contact** for a safety or recall enquiry, and what is their
    response commitment?

**Integration and exit**
28. Which **Shopify integration** do you use? Does it write tracking numbers back to the
    Shopify order, and does it sync inventory in both directions?
29. Which **carriers** do you offer for NL and for BE, and can we bring our own contract?
30. What is the **contract term**, notice period, and the process and cost for removing
    our stock at exit?
31. Do you hold **insurance** on stored goods, at what value and with what excess?

Send to at least three. Compare the whole stack, not the pick fee: a low pick fee with a
high per-line charge and a monthly minimum can be the most expensive option at
100 orders/month, and the cheapest at 2,000.

**Everything in the answers is REQUIRES QUOTE until it arrives in writing. Do not model
on a sales call.**

---

## 3. Inbound goods receipt and QC

The factory sample you approved and the goods that arrive are two different products
until proven otherwise. This section is what prevents a 400-unit problem.

### 3a. Before the container leaves

- **Pre-shipment inspection.** For a first production run, arrange an inspection at the
  factory before shipment. Cost: **REQUIRES QUOTE** — ask SGS, Bureau Veritas, Intertek
  and QIMA for "pre-shipment inspection, one SKU, [country], [quantity]". A defect found
  in the factory is a supplier problem; the same defect found in NL is your problem.
- **Golden sample.** Two signed, sealed reference units: one to the factory, one retained
  by POLDER. Everything is measured against these. Photograph both.
- **Carton marking check** — batch code on every carton (`gpsr-runbook.md` §5b).

### 3b. On arrival at the 3PL

The 3PL counts and reports. POLDER inspects. Do not delegate the inspection judgement to
the 3PL on a first run.

1. **Carton count and condition** against the packing list. Photograph any damage before
   opening. Note discrepancies in writing the same day — most claim windows are short
   (**length UNVERIFIED** — confirm with the freight forwarder and insurer).
2. **Batch codes** on cartons recorded into the batch register.
3. **Sample pull and inspection** — §3c.
4. **Decision:** release to stock / quarantine / reject. Nothing becomes sellable until
   this is recorded. Receipt-to-live time is an RFQ question (2c q15) because a 3PL that
   auto-releases on receipt removes this control.

### 3c. Sampling plan

**ASSUMPTION — this is a chosen policy, not a standard.** It is deliberately heavier on
the first run of a SKU and lighter once a supplier has a track record. A formal AQL plan
(ISO 2859-1) is the professional alternative and is worth adopting once volumes justify
it; the inspection houses in §3a will run one.

| Run | Sample | Inspect for |
|---|---|---|
| **First run of a SKU** | 100% of cartons opened; the greater of 30 units or 10% inspected; every unit pulled from a different carton | Everything in §3d |
| **Repeat run, same factory, no prior defects** | 20% of cartons; the greater of 10 units or 2% | §3d, abbreviated |
| **Repeat run after any prior defect** | Back to first-run level for two consecutive clean runs | Everything |
| **Any run after a spec change** | First-run level | Everything, plus explicit check of what changed |

### 3d. What to actually check — bag

- Batch code present and correct on unit, hang tag and carton
- Sewn-in label present, legible, correct legal name/address/email, correct origin
- Warnings text on hang tag matches `compliance.warnings` **word for word** — a mismatch
  between the page and the product is the easiest thing for an inspector to find
- Stitching at every load-bearing point: strap anchors, handle, D-rings. Pull test by hand
- Zips run full travel, both directions, dry and wet
- Hardware: clips close and hold, no sharp edges, no detachable small parts
- Water test — the entire proposition. Fill the wet compartment, confirm the drainage or
  separation behaves as specified, confirm no dye transfer onto a white cloth when wet
- Shoe compartment ventilation present as specified
- Rain cover present, fits, and is the right one
- Colour against the golden sample, in daylight
- Odour — a strong chemical smell is a chemical-compliance signal, not a cosmetic one.
  **Quarantine and escalate, do not sell through it**

### 3e. What to check — overgrips

- Sleeve/packaging print: legal name, address, email, batch, materials
- Count per sleeve matches what the product page says
- Tack and thickness against the golden sample
- No adhesive migration or sleeve discolouration
- Skin-contact chemical test report on file for this batch (`gpsr-runbook.md` §3)

### 3f. Failure handling

| Finding | Action |
|---|---|
| Labelling or warning-text error | **Quarantine the whole batch.** Relabel (3PL charge — RFQ q9) or return. Do not sell one unit |
| Safety-relevant defect (stitching, hardware, chemical odour) | Quarantine, photograph, notify supplier in writing same day, do not publish. If any unit already shipped, `gpsr-runbook.md` §6 |
| Cosmetic defect above tolerance | Quarantine, agree a commercial remedy with the supplier. Do not sell as A-grade |
| Count short | Written claim to supplier and forwarder same day |

Record every finding in the technical file (§3 item 11 change log / item 12 register).

---

## 4. Deriving the delivery promise

**Rule: the storefront may never promise anything the 3PL has not committed to in
writing.** The theme accepts a free-text date range in `delivery_estimate`; the theme
cannot check it. This section is the check.

### 4a. The formula

```
Promised delivery window
  = order timestamp
  + [0 if before 3PL cut-off on a dispatch day, else next dispatch day]
  + 3PL same-day-dispatch SLA slack
  + carrier transit time, P90 not median
  + a safety day
```

Every term is **REQUIRES QUOTE**:

| Term | Ask whom | Ask exactly |
|---|---|---|
| Cut-off time | 3PL | "Your contractual daily cut-off for same-day dispatch, by weekday, in writing" (RFQ q12) |
| Dispatch days | 3PL | "Which days and which public holidays do you not dispatch?" (q13) |
| SLA slack | 3PL | "What same-day-dispatch percentage do you commit to, and what do you achieve?" (q14) |
| Carrier transit | Carrier | "Transit time NL→NL and NL→BE, and the **90th percentile**, not the average" |
| Safety day | POLDER | A decision. **ASSUMPTION: add one working day** until 100 real orders have been measured |

Use the **P90, not the median.** Disputes and "where is my order" tickets come from the
tail. A median-based promise is wrong for one order in ten, and those are exactly the
customers who contact you and leave reviews.

### 4b. Writing the string

- **Date range, never a duration.** "Bezorgd tussen di 15 en do 17 sep" not "2–4
  werkdagen". A customer cannot convert "2–4 working days" into a date on a Friday
  afternoon, and the conversion errors all go against you.
- **State the cut-off on the page** if you claim next-day: "Vandaag besteld vóór [TIJD],
  morgen bezorgd" — with the real cut-off, minus buffer.
- **Never say "in stock, ships today" if inventory is not live and correct.** The Omnibus
  rules against false scarcity apply in the other direction too (`../CLAUDE.md`).
- **Weekends and holidays must be in the arithmetic**, not hand-waved.
- **Belgium gets its own string**, not the NL one. See §7.
- The same range must appear at cart, checkout and in the order confirmation. A range
  that only appears on the PDP is a promise the customer will quote back at you.

### 4c. When to change it

Review the promise monthly against measured performance. **If actual delivery falls
outside the promised window for more than a small share of orders, change the promise,
not the wording.** A widened promise costs conversion once; a broken promise costs a
refund, a ticket, a review and — under the 14-day withdrawal regime — possibly the
outbound shipping cost too (`returns.md` §2).

Record measured P50/P90 monthly. This is the only number in this whole operation you
will own from day one; it is worth a spreadsheet.

---

## 5. Packaging — decisions, and the regulatory consequences

### 5a. The rules that bind the decision

| Rule | Status |
|---|---|
| NL packaging EPR (Verpact): below **50,000 kg/yr** no declaration and no waste-management contribution | FACT, MEDIUM-HIGH (`../research/eu-compliance-constraints.md` §3.1) |
| **The single-use-plastics surcharge has no threshold** — any plastic mailer, any plastic film, creates an obligation regardless of volume | FACT, MEDIUM-HIGH. **This is the one that catches e-commerce merchants** |
| PPWR (EU) 2025/40 core obligations live since **12 Aug 2026**: empty space in an e-commerce parcel must not exceed **40%** | FACT of the date, MEDIUM on the 40% detail. ★ |
| PPWR declaration of conformity + technical documentation **per packaging type** | MEDIUM. ★ Whether it applies to a merchant buying generic cartons rather than designing packaging is **UNVERIFIED** — `../research/eu-compliance-constraints.md` §11 item 16 |
| PPWR Art. 45(3): a producer not established in a member state must appoint an **EPR authorised representative** there | MEDIUM, ★ highest-value item to verify. Drives the cost of adding Belgium |
| BE (Fost Plus): threshold **>300 kg/yr** | MEDIUM |

★ **REQUIRES PROFESSIONAL VERIFICATION** on every row. Get **two competing quotes** from
EPR agents before modelling — retainers quoted in the market vary widely and the sources
are vendors selling the service. **REQUIRES QUOTE: "NL packaging EPR + BE Fost Plus
registration and authorised representation, annual all-in, for a merchant shipping
[N] parcels/month."**

### 5b. The decisions that follow

1. **No plastic mailers. Paper or board only.** The SUP surcharge has no threshold, so a
   poly mailer converts a zero-admin position into a registered one for the sake of a few
   cents per parcel. This is the single cheapest compliance decision available.
   Confirm there is no plastic in tape, void fill, or the bag's own dust cover.
2. **Right-size the carton.** The 40% empty-space rule is a design constraint on
   fulfilment, not a filing obligation. A padel bag is bulky and awkward; specify at
   least two carton sizes (bag-and-set, and small) plus a letterbox format for a single
   grip sleeve. Give the 3PL the decision rule in writing so picking is deterministic.
3. **Letterbox format for the subscription.** A single overgrip shipment that fits a
   Dutch letterbox avoids a delivery attempt, avoids a "where is my order" ticket, and is
   cheaper. Confirm the maximum letterbox dimensions with the carrier — **REQUIRES
   QUOTE / confirmation**, do not assume.
4. **Track packaging weight from order one.** You need a running kilogram total to know
   when you approach the NL 50,000 kg threshold and the BE 300 kg one. Belgium's
   threshold is low enough that it will be crossed quickly. Ask the 3PL to report
   packaging weight shipped per month (add to the RFQ if not offered).
5. **PFAS-free is a procurement requirement, applied to packaging as well as product.**
   Grease-resistant coatings and some water-resistant board treatments are PFAS vectors.
   Demand the same written declaration from the packaging supplier as from the product
   supplier (`gpsr-runbook.md` §4a item 4). The legal position is **UNVERIFIED** and ★
   requires verification; the commercial position is not — a wet-weather brand that has
   to recall for fluorochemicals has no proposition left.
6. **Inserts.** Keep them paper, and keep them useful: a card explaining how to dry the
   bag, the withdrawal-right notice and the model withdrawal form (`returns.md` §2c),
   and the batch code. Nothing that makes a performance or health claim
   (`customer-service-sop.md` §6).

---

## 6. Carriers — what to weigh for NL and BE

No carrier has been contacted. **All rates, transit times and service levels are
REQUIRES QUOTE.** What follows is the decision structure, not the answer.

### 6a. What to ask every carrier

1. Rate card for the two parcel profiles: bulky-light (the bag) and letterbox (grips).
   **Dimensional weight matters more than actual weight for a padel bag — ask how it is
   calculated.**
2. Transit time NL→NL and NL→BE, **P90 as well as median**.
3. Delivery-attempt policy, pickup-point network density, and what happens on a failed
   attempt. In NL, pickup points are a conversion feature, not a fallback.
4. **Return service**: is there a prepaid return label product, what does it cost, and is
   it charged on issue or on use? Charged-on-use changes returns economics materially
   (`returns.md` §4).
5. Saturday delivery: available, and at what premium?
6. Claims process for loss and damage: window, evidence required, payout time, cap.
7. Address-correction and undeliverable-parcel handling and charges.
8. Tracking data quality and whether it writes back through the 3PL to Shopify.
9. Surcharges: fuel, peak, remote area, oversize. Ask for the full surcharge schedule,
   not the headline rate.

### 6b. Selection considerations specific to this business

- **The bag is bulky and light.** Volumetric pricing will dominate. A carton 10 cm larger
  than necessary can move the parcel into a higher band on every order forever.
- **Two carriers, not one.** A single carrier is a single point of failure for the entire
  customer promise, and carrier incidents cluster exactly when volume is highest.
  Confirm the 3PL supports multi-carrier (RFQ q29).
- **Pickup-point delivery as the default option** for NL reduces failed attempts, which
  are the largest avoidable source of "where is my order" tickets.
- **Consumer trust in NL is carrier-specific.** Do not choose on price alone; a carrier
  the customer distrusts costs conversion at checkout. This is a real effect and it is
  **UNVERIFIED** here — no source could be opened. Ask ten Dutch padel players which
  carrier they prefer before signing. It costs an afternoon.
- **Do not offer a service level the 3PL cut-off cannot support.** Express at checkout
  with a cut-off that misses the 3PL's is a manufactured complaint.

---

## 7. Adding Belgium — what actually changes

Belgium is treated in the business case as "market two" with "short logistics and Dutch
language reuse" (`../strategy/business-case.md` §6). Operationally it is more than that.

| Area | Change | Status |
|---|---|---|
| **Language** | Belgium is **two language markets**. Flanders reads Dutch, Wallonia reads French. GPSR safety information must be in the language of the market. **French safety copy, warnings, hang tags and care instructions are a Belgian launch cost** | FACT of the requirement; scope of "the language of the market" for bilingual BE ★ REQUIRES PROFESSIONAL VERIFICATION |
| **Packaging EPR** | Fost Plus threshold is **>300 kg/yr** — far lower than the NL 50,000 kg, and reachable | MEDIUM |
| **Authorised representative** | PPWR Art. 45(3) reportedly requires an EPR authorised representative in each member state where the producer is not established. POLDER is not established in BE | MEDIUM, ★ verify. **REQUIRES QUOTE** from two EPR agents |
| **Hang tags and labels** | A bilingual tag must be designed and produced **at the factory**, which means the BE decision has to be made before the production run, not after. Retagging 400 bags in an NL warehouse is a 3PL charge and a delay | ASSUMPTION — get the relabelling charge from the 3PL (RFQ q9) before assuming otherwise |
| **Delivery promise** | Separate, longer string. Cross-border transit, different carrier network, different holidays. **Do not reuse the NL range** | — |
| **Carrier** | Confirm the NL carrier's BE lane P90 separately; a domestic champion is not automatically a good cross-border option | REQUIRES QUOTE |
| **Returns** | A BE customer returning to an NL address is a cross-border return. Confirm the return-label product covers BE→NL and at what cost | REQUIRES QUOTE |
| **VAT** | Distance sales into BE count toward the EU-wide €10,000 threshold; above it, destination VAT and OSS registration | FACT, MEDIUM-HIGH. ★ VAT adviser |
| **Customer service** | French-language support. Either resource it or do not sell to Wallonia — a French-language customer receiving Dutch-only support is a complaint generator and, for safety information, a compliance problem | Decision required |

**The honest read:** Belgium is not a free adjacent market. The language duplication and
the low Fost Plus threshold mean the fixed cost lands early. The decision point is
whether to launch Flanders-only first. That is a defensible option and it should be
taken deliberately, in the decision log, rather than drifted into.

---

## 8. What must be measured from order one

Nothing here is knowable in advance; all of it is knowable by week four.

| Metric | Why |
|---|---|
| Same-day dispatch % vs 3PL SLA | The 3PL will not volunteer a miss |
| Delivery time P50 and **P90**, NL and BE separately | Feeds §4 directly |
| Failed first delivery attempts % | Drives ticket volume |
| Inbound defect rate per batch | Feeds supplier scorecard and the technical file |
| Pick accuracy / wrong-item rate | `customer-service-sop.md` template 4 |
| Damage-in-transit rate by carrier | Packaging or carrier problem — distinguish them |
| Packaging weight shipped per month, NL and BE | EPR threshold tracking (§5b item 4) |
| Cost per order, all-in, at actual mix | The only figure that tells you whether this works |
