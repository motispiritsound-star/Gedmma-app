# GPSR runbook — POLDER

Written 2026-09-12. Owner: whoever holds the compliance role (at launch: the founder).
This is the document `shopify/theme/snippets/regulatory-information.liquid` points at
when a product is missing its Article 19 data.

**Read `../ACCESS-AND-LIMITS.md` first.** No primary legal text was opened from this
environment and no supplier has been contacted. Everything here is built from secondary
summaries recorded in `../research/eu-compliance-constraints.md` §2. Article numbers,
deadlines and penalty levels are therefore **UNVERIFIED against primary source** and
every item marked ★ **REQUIRES PROFESSIONAL VERIFICATION** by a Dutch product-safety
lawyer before it is relied on commercially.

What this runbook *is* safe to use for: it is a work instruction. Following it produces
the artefacts a regulator would ask for. It does not tell you they are legally
sufficient — only counsel can.

---

## 0. The one-page version

| | |
|---|---|
| Regulation | General Product Safety Regulation (EU) 2023/988 — applies since 13 Dec 2024 (FACT) |
| Enforcer in NL | NVWA (FACT) |
| POLDER's role on own-brand goods | **Deemed manufacturer + importer + Art. 16 responsible person** |
| Per SKU, before publish | Technical file exists → metafields populated → checklist §8 signed |
| Retention | **10 years** from placing the last unit on the market (FACT) |
| Hard rule | **A product with no technical file does not go live. No exceptions, no "we'll do it after launch".** |

**The compliance unit is the SKU, not the order.** Every SKU added multiplies this
work. That is why the catalogue is deliberately small (`../strategy/business-case.md` §1).

---

## 1. Who POLDER is, per route, and why

GPSR assigns duties by what you *did* with the goods, not by what you call yourself.

| How the SKU reaches us | POLDER's role | Burden |
|---|---|---|
| Made in Asia (or any non-EU country), sold under the POLDER name/logo | **Deemed manufacturer** (own-brand trigger) **and importer** | Heaviest — full stack in §3 |
| Made in the EU to our spec, sold under the POLDER name/logo | **Deemed manufacturer** (not importer — no third-country placing) | Heavy, minus the importer-labelling duty |
| Bought from an EU distributor, sold under the *supplier's* brand, untouched | **Distributor** | Light — verify the other operator's data is present and legible, don't supply goods you know to be unsafe |
| Anything at all sold under the POLDER name | **Deemed manufacturer, always** | You cannot brand your way out of it |

**Why POLDER is the deemed manufacturer.** Placing a product on the EU market under your
own name or trademark makes you carry the manufacturer's obligations, regardless of who
physically produced it (`../research/eu-compliance-constraints.md` §2.2, FACT, HIGH
confidence across multiple secondary sources; article attribution Art. 9/Art. 13
UNVERIFIED). POLDER exists precisely to put its own brand on a bag and on overgrips.
There is no version of this business where POLDER is merely a distributor of its hero.

**Why POLDER is the importer.** If the bag is manufactured outside the EU, POLDER — an
NL-established entity — is the party placing third-country goods on the Union market.
The 3PL does not absorb this. Neither does the freight forwarder, the customs agent, or
Incoterms. A DDP quote from the factory changes who pays duty; it does not change who is
the importer under product-safety law.

**Why POLDER does not need to buy an "EU Responsible Person" service.** Art. 16 requires
an EU-established economic operator responsible for the product. POLDER, being an
EU-established manufacturer/importer, **is** that operator. RP subscriptions are sold to
*non-EU* sellers who have no EU operator. Vendors nonetheless market them to EU sellers.
★ **REQUIRES PROFESSIONAL VERIFICATION** — this is a live recurring-spend decision.
Until verified, the answer is "we are the responsible person", and the metafields
`compliance.responsible_person_*` stay **empty** for own-brand SKUs. They exist in the
schema only so the theme can lawfully render a third-party product if we ever list one.

**What this means in practice, said bluntly:** if a customer's child is hurt by a strap
that failed, the party that has to produce a documented risk analysis, a supplier chain,
a batch trace and a corrective-action plan is POLDER. Not the factory in Guangdong.

---

## 2. The Shopify metafield definitions — create these before any product exists

Namespace: **`compliance`** (all of them). Owner resource: **Product**.
The theme reads them in `snippets/regulatory-information.liquid`; the key names below are
the ones that snippet already expects. **Do not rename a key without changing the
snippet — a renamed key renders as "missing" and the product becomes unpublishable.**

Shopify Admin → Settings → Custom data → Products → Add definition. Repeat 11 times.

| # | Key | Shopify type | Req. | Translate | Rendered as | Notes |
|---|---|---|---|---|---|---|
| 1 | `manufacturer_name` | Single line text | **YES** | No | Manufacturer name | The gate field. Empty ⇒ the whole Art. 19 block does not render. For own-brand: the POLDER legal entity name, exactly as registered at KVK |
| 2 | `manufacturer_address` | Multi-line text | **YES** | No | Postal address, line breaks preserved | Full postal address incl. country. A PO box is not a postal address for this purpose — ★ verify |
| 3 | `manufacturer_email` | Single line text | **YES** | No | `mailto:` link | A monitored address, e.g. `safety@` — not a personal inbox and not a no-reply |
| 4 | `responsible_person_name` | Single line text | No | No | Only shown if filled | **Leave empty for own-brand SKUs.** Fill only when listing a third-party product whose manufacturer is outside the EU |
| 5 | `responsible_person_address` | Multi-line text | No | No | " | " |
| 6 | `responsible_person_email` | Single line text | No | No | " | " |
| 7 | `product_identifier` | Single line text | **YES** | No | Type / model / batch identification | See §5 for the exact string format. This is the Art. 19 "type, batch or serial number" field |
| 8 | `country_of_origin` | Single line text | **YES** | **YES** | Origin | "Made in …". Translate because NL and BE-FR customers read different words |
| 9 | `materials` | Single line text | **YES** | **YES** | Materials | Composition, honest. Not marketing copy |
| 10 | `care_instructions` | Multi-line text | No | **YES** | Care | Optional legally, material commercially: a wet-weather bag that is washed wrong becomes a conformity claim |
| 11 | `warnings` | **Rich text** | **YES** for the bag | **YES** | Warnings block | **Rendered unescaped by the snippet** (`{{ m.warnings }}`). Rich text is therefore the correct type. Only trained staff may edit it |

**Translation.** Fields 8–11 must exist in the language of every market sold into
(FACT). NL at launch. Belgium means **Dutch *and* French** — Belgium is not one
language market, and the plan in `../strategy/business-case.md` §6 counts it as one
market. Budget the French safety copy as part of the BE launch, not after it.
Translate via Shopify's translation surface (Translate & Adapt or equivalent); exact
product name and capability **UNVERIFIED** — Shopify docs were unreachable.

### 2b. Internal-only metafields (not rendered — create them anyway)

These keep the audit trail inside Shopify instead of in someone's memory.

| Key | Type | Purpose |
|---|---|---|
| `technical_file_ref` | Single line text | The folder ID in §3, e.g. `TF-BAG-001` |
| `risk_assessment_date` | Date | Date the documented risk analysis was last reviewed |
| `signed_off_by` | Single line text | Who signed the §8 checklist |
| `signed_off_at` | Date | When |
| `supplier_declaration_on_file` | True/false | The §4 letter is signed and stored |

If `supplier_declaration_on_file` is false, the product does not publish. That is a
manual rule until someone automates it; Shopify has no native publish gate on a
metafield value (**UNVERIFIED** — could not check Shopify Flow capabilities).

### 2c. Two defects in the current theme you must work around

1. **The loud warning is not visible on the live storefront.** The `{% else %}` branch in
   `regulatory-information.liquid` renders only when `request.design_mode` is true or the
   preview bar is present. A product published with empty metafields shows customers
   *nothing at all* — no error, no block, silently non-compliant. **The §8 checklist is
   therefore the only real control.** Do not rely on seeing a red box.
2. **The starter set is one Shopify product but three physical products.** The snippet
   renders exactly one manufacturer block. A set containing a bag from factory A and
   overgrips from factory B cannot be described correctly by one set of these fields.
   Until the snippet is extended, the set's `manufacturer_name` etc. must describe
   POLDER (correct — POLDER is the deemed manufacturer of all of them), and
   `product_identifier`, `materials` and `warnings` must enumerate **each component
   separately** inside the field. Write it as a list. Verify it renders legibly.

---

## 3. The technical file — what must be in it, and where it lives

One folder per SKU. Ten years from the date the **last** unit of that SKU is placed on
the market (FACT). That is longer than most businesses last; store it somewhere that
outlives a laptop.

**Location:** cloud drive, folder `compliance/technical-files/TF-<SKU>/`, with a second
copy in a different provider. Not in this git repository — it will contain supplier
contracts and test reports.

**Naming:** `TF-BAG-001`, `TF-GRIP-001`, `TF-SET-001`. Record the ref in
`compliance.technical_file_ref`.

**Contents.** ★ **REQUIRES PROFESSIONAL VERIFICATION** — for a non-harmonised product
(no CE directive applies to a padel bag) there is no publicly standardised minimum.
This list is the defensible best effort assembled from the sources in
`../research/eu-compliance-constraints.md` §2.3 and §11 item 2.

| # | Document | Who produces it |
|---|---|---|
| 1 | **Product description and intended use** — what it is, who it is for, what it is not for ("not a child carrier", "not protective equipment") | POLDER |
| 2 | **Technical drawings / specification sheet** — dimensions, materials, components, stitching, hardware, zips, coatings | Supplier, countersigned by POLDER |
| 3 | **Bill of materials** with each material identified, including any water-repellent coating by chemical name | Supplier |
| 4 | **Documented risk analysis** — see the template in §3b. This is the item most often missing and the one an inspector asks for first | POLDER |
| 5 | **Test reports** — for a bag, at minimum: strap and handle load, zip cycle, colourfastness/dye transfer when wet, and a chemical screen on any coating. For overgrips: skin-contact chemical screen, adhesive | Third-party lab. **Cost: REQUIRES QUOTE** — ask SGS, TÜV, Intertek and Eurofins for a quote for "GPSR technical-file support and testing for a non-harmonised textile sports bag, 1 SKU" |
| 6 | **Supplier declaration** (§4 letter, signed) | Supplier |
| 7 | **Photographs** of product, all labels, and packaging as sold | POLDER |
| 8 | **Label artwork proofs** — the exact artwork with manufacturer and importer details | POLDER |
| 9 | **Batch register** — every production run, with dates, quantities, factory, and which orders each batch went to | POLDER, fed by the 3PL |
| 10 | **Instructions and warnings** as supplied to the consumer, in every market language | POLDER |
| 11 | **Change log** — every specification change, dated, with who approved it. A changed spec is arguably a new product | POLDER |
| 12 | **Complaints and incident register** (§6), even when empty | POLDER |

### 3b. Risk analysis — the template to fill

One row per foreseeable hazard. Do this before the first production order, not before
the first sale — the point is to change the product, not to paper it.

| Hazard | How it could happen (incl. foreseeable misuse) | Who is affected | Severity (1–5) | Likelihood (1–5) | Control applied | Residual risk | Evidence |
|---|---|---|---|---|---|---|---|

Start this list for the bag, and finish it honestly:
- Shoulder strap or handle fails under load → fall, dropped weight on foot
- Strap hardware (clip, D-ring) opens under load
- Small parts detach — zip pulls, logo badges — ingestion risk if a child handles it
- Long strap or cord → strangulation risk for a child
- Sharp edges on hardware or exposed stitching
- Chemical migration from a water-repellent coating through skin contact, worse when wet
- Dye transfer onto clothing or onto a light-coloured court surface when wet
- Mould growth in a wet compartment that does not dry (a hazard our own positioning creates)
- Slip hazard from a bag that channels water onto a court floor
- Overgrip adhesive causing skin reaction; grip degrading into fragments

"Foreseeable misuse" is not optional and is where small merchants get caught: a bag will
be overloaded, sat on, left in a car in summer, and handled by children in a clubhouse.

---

## 4. What to demand from a supplier **in writing, before the first order**

No purchase order is issued until this is signed and in `TF-<SKU>/`. A supplier who will
not sign is not a cheaper supplier — they are a supplier who has moved the liability
onto you and priced it at zero.

Send this as a standalone document, not as a line in an email thread.

### 4a. Documents to demand

1. Full material specification and bill of materials, with chemical names for every
   coating, adhesive and dye.
2. Test reports from an accredited third-party laboratory for the tests in §3 item 5,
   issued in the last 24 months, **naming this product** — not a generic factory
   certificate and not a report for a different model.
3. A written statement of **which EU entity, if any, has previously imported this
   product**, and whether the supplier claims any economic-operator role. (Expected
   answer: none. Confirming that is the point.)
4. Written confirmation that the product contains **no PFAS / PFOA / PFOS** in any
   coating, membrane, thread or finish, and no restricted substance under REACH Annex
   XVII, with the analytical basis for the claim. See `fulfilment.md` §5 — the legal
   status of a PFAS restriction on this product class is **UNVERIFIED**; POLDER imposes
   it as a procurement requirement regardless, because a durable-water-repellent finish
   on a wet-weather bag is the classic PFAS vector and a retrofit is a product recall.
5. Batch/lot marking commitment — see §5. Confirmation that the agreed batch code will be
   applied to every unit and to every carton.
6. Written commitment to **notify POLDER before any change** to materials, coating,
   hardware supplier, or factory. Unannounced substitution is the single most common way
   a compliant product becomes non-compliant.
7. Packaging specification, including whether any plastic is used (drives SUP obligations
   — `fulfilment.md` §5).
8. A named contact who will respond to a safety enquiry within 48 hours, with a
   commitment to retain their own production records for at least 10 years.

### 4b. Supplier declaration — signature block to send

> **Supplier product declaration — [PRODUCT], [SPEC REF], [DATE]**
>
> [Supplier legal name, registered address] declares that:
> (a) the product supplied conforms to the specification annexed hereto;
> (b) the materials listed in the annexed bill of materials are complete and accurate;
> (c) the product contains no PFAS, PFOA or PFOS in any component, and no substance
> restricted under REACH Annex XVII above its permitted limit;
> (d) the test reports annexed relate to this product as supplied;
> (e) no change will be made to materials, construction, coatings, hardware or
> manufacturing site without prior written notice to POLDER;
> (f) each unit and each carton will bear the batch code specified by POLDER;
> (g) production records will be retained for not less than ten years and made available
> to POLDER on request, including in response to a regulatory enquiry;
> (h) the supplier will bear the cost of replacement or corrective action for any
> non-conformity arising from (a)–(c).
>
> Signed, name, position, date, company stamp.

★ **REQUIRES PROFESSIONAL VERIFICATION** — have a Dutch lawyer review this before it is
sent, in particular clause (h), which is the only clause with money attached and the one
a supplier will try to delete. Whether it is enforceable against a non-EU supplier in
practice is a separate question; assume it is not, and treat it as evidence of diligence
rather than as a remedy.

### 4c. Hard disqualifiers

Reject the supplier outright, regardless of price, if any of these is true
(carried over from `../research/business-model-sourcing.md` §7.3):
- Will not put the EU economic-operator position in writing
- Will not provide product-specific test reports
- Will not commit to batch marking
- Will not commit to change notification

---

## 5. Traceability and batch marking

GPSR requires a type/batch/serial identifier on the product, plus the manufacturer's
name and postal and electronic address, plus — separately — the importer's details
(FACT, `../research/eu-compliance-constraints.md` §2.3). Since POLDER is both, one
address block covers both roles, but it must be **legible on the product or its
packaging**, not only on the website.

### 5a. Batch code format

```
PLD-<SKU>-<YYWW>-<FACTORY>-<RUN>
e.g.  PLD-BAG01-2612-A-01
```

- `PLD` — POLDER
- `<SKU>` — short SKU code, stable forever
- `<YYWW>` — ISO year and week production **completed**
- `<FACTORY>` — single letter per production site, assigned by us, recorded in the
  batch register. Never reused
- `<RUN>` — sequential run within that week

One batch = one production run from one factory of one specification. A specification
change starts a new batch even if the week is the same.

### 5b. What goes where

| Location | Content |
|---|---|
| **Sewn-in label (bag) / printed on sleeve (grips)** | POLDER legal name, full postal address, `safety@` address, batch code, country of origin, materials |
| **Hang tag** | Same, plus care instructions and warnings in the market language |
| **Retail packaging** | Same address block plus batch code, readable without opening |
| **Shipping carton (inbound from factory)** | Batch code, quantity, SKU, PO number — this is what the 3PL scans on receipt |

The sewn-in label is not optional and is the item suppliers most often try to omit for
MOQ reasons. Price it into the first quote (**REQUIRES QUOTE** — ask for label cost and
label MOQ separately from product MOQ).

### 5c. The traceability gap you must close with the 3PL

Shopify tracks products, not lots. `compliance.product_identifier` is a single
product-level string; it cannot say which customer received which batch. **If a batch has
to be recalled, the ability to contact exactly the affected customers lives entirely in
the 3PL's lot control.** Most small-merchant 3PL contracts do not include lot tracking
by default and it is not usually on the price list.

Therefore:
- It is an explicit RFQ question to every 3PL (`fulfilment.md` §2, question 21).
- If a 3PL cannot do lot-level pick tracking, the fallback is **one batch in the bin at a
  time**, with a dated changeover recorded in the batch register, so a recall maps to a
  date range of orders. Cruder, workable, and must be agreed in writing.
- `compliance.product_identifier` carries the model identifier plus the batch codes
  currently in circulation, e.g.
  `Model PLD-BAG01 · Batch PLD-BAG01-2612-A-01`. Update it at every changeover.

---

## 6. Accidents, incidents and the Safety Business Gateway

### 6a. The duty

If POLDER knows or has reason to believe a product it placed on the market is dangerous,
it must notify the authorities through the **Safety Business Gateway** and take
corrective action; there is also a duty to notify the Gateway of **accidents caused by a
product** (FACT that the duty exists; **exact notification deadlines UNVERIFIED** —
sources referenced "without undue delay" and specific hour counts that could not be
confirmed). ★ **REQUIRES PROFESSIONAL VERIFICATION of the deadline.** Until verified,
**treat the deadline as "the same working day you learn of it"** and act accordingly —
being early is free.

Consumer-facing remedies on a recall are repair, replacement or refund, and consumers
must be notified directly (FACT). Direct notification means email, which means the
customer list is a compliance asset, not only a marketing one.

### 6b. Trigger — when does a complaint become an incident

Ask two questions of every complaint that mentions a person or property:

1. Did someone suffer, or nearly suffer, **physical harm** — cut, fall, burn, skin
   reaction, choking, allergic response?
2. Could the same thing happen to another customer with the same product?

| Answers | Action |
|---|---|
| Yes / Yes | **Incident.** Start §6c now. Notify the Gateway. |
| Yes / No (clear one-off misuse, e.g. deliberately cut) | Log in the incident register, document the reasoning, do not notify. Get a second opinion before deciding "no". |
| No / Yes (near-miss, e.g. strap stitching failed but the bag was empty) | **Treat as an incident.** A near-miss with a repeatable cause is a recall in waiting. |
| No / No | Ordinary complaint. `customer-service-sop.md`. Still log it. |

Never let the person answering email make the "No / No" call alone on anything involving
a strap, a clip, a coating or a child.

### 6c. First 24 hours — do these in order

1. **Stop the bleeding.** Unpublish the SKU in Shopify and set inventory to zero at the
   3PL. Reversible in five minutes; a day of extra shipments is not.
2. **Preserve evidence.** Ask the customer for photographs and to keep the item. Do not
   ask them to return it until you have photographs. Never tell them to destroy it.
3. **Care for the customer first, commercially.** Full refund without argument, no
   conditions, no NDA, no "as a gesture of goodwill" phrasing. Do not admit or deny
   liability — state facts.
4. **Identify the batch** from the order and the batch register. Quantify: how many units
   of that batch shipped, to how many customers, and how many are still in the 3PL.
5. **Open an incident record** — `compliance/incidents/INC-YYYY-NN/` containing: date and
   time learned, customer contact, order number, batch, description, photographs, what we
   did, what we decided and why, who decided.
6. **Notify.** Safety Business Gateway submission. Notify the supplier in writing the
   same day.
7. **Decide on recall scope** — the whole SKU, one batch, or one date range. Write down
   the reasoning. If in doubt, wider.
8. **Call a lawyer.** ★ Before any public statement, and before any communication to
   more than one customer.

### 6d. Who has to know before it happens

Pre-write, and keep in the incident folder: the Gateway login and who has it; the
lawyer's name and number; the supplier's escalation contact; the 3PL's contact for an
emergency stock hold; the customer-notification email draft with blanks. Doing this on
the day is how a recall becomes a fiasco.

---

## 7. The standing compliance calendar

| When | Task |
|---|---|
| Before every first order of a SKU | §4 documents, §8 checklist |
| Every new batch | Update batch register; update `product_identifier`; confirm supplier has not changed spec |
| Monthly | Review the complaints register for a pattern that crosses the §6b threshold |
| Annually | Re-read the risk analysis; update `risk_assessment_date`; confirm technical files are still readable in both storage locations |
| On any spec change | New batch code, technical-file change-log entry, re-check warnings copy |
| On adding a market | Translate fields 8–11; re-check whether a market-specific safety wording applies. **BE needs NL *and* FR** |
| Never | Delete a technical file — 10 years from last unit sold |

---

## 8. Per-SKU pre-publication checklist

**A product goes live only when every line is ticked and signed.** Print it, or keep it
as a Shopify metafield-backed record. Sign with a name and a date, not a checkbox.

SKU: ____________  Technical file ref: ____________  Date: ____________

**Product and file**
- [ ] 1. Technical file folder exists, with items 1–12 from §3 present or explicitly marked N/A with a reason
- [ ] 2. Documented risk analysis completed, dated, and every residual risk either controlled or accepted in writing
- [ ] 3. Third-party test reports on file, product-specific, less than 24 months old
- [ ] 4. Supplier declaration §4b signed and stored; `supplier_declaration_on_file` = true
- [ ] 5. PFAS-free written confirmation on file
- [ ] 6. Batch code assigned, format per §5a, recorded in the batch register

**Physical goods**
- [ ] 7. A physical sample has been inspected by a POLDER person, not only photographed
- [ ] 8. Sewn-in / printed label present and legible, with legal name, postal address, electronic address, batch code, origin, materials
- [ ] 9. Hang tag present with warnings and care instructions in the market language
- [ ] 10. Retail packaging carries the address block and batch code
- [ ] 11. 3PL has confirmed in writing it can identify this batch on outbound orders (or the one-batch-at-a-time fallback in §5c is agreed in writing)

**Storefront**
- [ ] 12. `compliance.manufacturer_name` populated — exact KVK-registered legal name
- [ ] 13. `compliance.manufacturer_address` populated — full postal address
- [ ] 14. `compliance.manufacturer_email` populated — monitored mailbox
- [ ] 15. `compliance.product_identifier` populated — model + batch(es) in circulation
- [ ] 16. `compliance.country_of_origin` populated
- [ ] 17. `compliance.materials` populated and matches the bill of materials
- [ ] 18. `compliance.warnings` populated, rich text, matches the hang tag **word for word**
- [ ] 19. `compliance.care_instructions` populated (or deliberately N/A)
- [ ] 20. `responsible_person_*` fields **empty** (own-brand) or fully populated (third-party)
- [ ] 21. Fields 8–11 translated into every language of every market this product is published to (NL at launch; NL **and** FR for BE)
- [ ] 22. Product page previewed in each market's locale and the Article 19 block **visually confirmed to render** — do not trust the admin
- [ ] 23. For a bundle/set: every component enumerated in `product_identifier`, `materials` and `warnings` (§2c defect 2)
- [ ] 24. Product copy checked against the "never claim" list in `customer-service-sop.md` §6 — no injury-prevention, health, or performance claim anywhere on the page
- [ ] 25. Delivery promise on the page matches what the 3PL has committed to in writing (`fulfilment.md` §4)

**Sign-off**
- [ ] 26. `technical_file_ref`, `risk_assessment_date`, `signed_off_by`, `signed_off_at` metafields written
- [ ] 27. Name: ______________  Signature: ______________  Date: ____________

If line 2, 4 or 12–18 cannot be ticked, the product does not publish. There is no
"publish and fix it this week" path; that week is when the NVWA complaint arrives.

---

## 9. Items requiring professional verification — the list to hand your lawyer

1. ★ Whether POLDER, as NL-established importer/own-brand seller, is automatically the
   Art. 16 responsible person and needs no third-party RP service.
2. ★ What a defensible technical file and risk analysis must contain for a
   **non-harmonised** consumer product with no applicable CE directive.
3. ★ Exactly when own-brand labelling flips importer → deemed manufacturer, and what it
   adds. Does a supplier-branded overgrip re-sleeved by us count?
4. ★ The Dutch penalty regime for GPSR breaches under the Warenwet / NVWA.
5. ★ The Safety Business Gateway notification deadline, in hours, and what triggers it.
6. ★ Whether a padel bag falls under any harmonised standard or PPE rule we have missed.
7. ★ PFAS: the current legal position on fluorinated water-repellents in a consumer
   textile article sold in NL/BE.
8. ★ Product liability insurance, and the revised Product Liability Directive (EU)
   2024/2853 — **not researched at all** in this project and a known gap
   (`../research/eu-compliance-constraints.md` §12 item 9).
9. ★ Whether a multi-component "starter set" is one product or three under GPSR.

## 10. Things that must never happen

- A SKU published with empty compliance metafields (the theme will not stop you — §2c).
- Copying a supplier's test report for a *different* model into our technical file.
- Marketing copy that makes a safety, health, injury-prevention or performance claim the
  technical file does not support. Every such claim widens the risk analysis.
- Telling a customer with a safety complaint that it is "normal wear".
- A specification change accepted verbally.
- Any figure in this document treated as verified. There are none.
