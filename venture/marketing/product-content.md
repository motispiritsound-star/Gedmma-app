# Product content pack

Written 2026-09-13. Ready to paste into Shopify once the placeholders are filled.

## The rule that governs every line below

**No claim ships until it can be substantiated.**

Under the Omnibus Directive an unsubstantiated product claim is an unfair
commercial practice, and under GPSR a safety-relevant claim you cannot evidence
is worse than that. Beyond the law, the brand's whole position is "numbers over
adjectives" — a brand built on specificity cannot afford a specific number that
turns out to be invented.

So this pack is written in two registers, and they are deliberately not mixed:

- **Written copy** — positioning, structure, benefit framing, objection
  handling. All of this is finished and paste-ready.
- **`[SUPPLIER CONFIRMS: …]`** — every measurable claim. **No number has been
  invented to fill these.** No supplier has been contacted
  (`../ACCESS-AND-LIMITS.md`), so no fabric spec, weight, capacity or
  hydrostatic-head figure exists yet.

A placeholder that reaches the storefront is a bug. The theme's GPSR gate will
block publication anyway if the compliance metafields are empty, but the
marketing placeholders have no such guard — they are a human responsibility.

---

## 1. Hero — the bag

### Product title
```
POLDER Weather Bag — padel bag with wet/dry separation
```
What it is first, differentiator second. Search behaviour rewards the noun.

### One-line promise (PDP subline)
```
Wet kit in one compartment. Dry kit in the other. Built for playing outdoors in
Dutch weather.
```

### Three benefits (PDP bullets)
```
• A sealed wet compartment, so soaked kit never touches dry clothes
• A ventilated shoe section that dries instead of souring
• Water-repellent outer, PFAS-free — [SUPPLIER CONFIRMS: DWR chemistry and mill declaration]
```

### Long description
```
Most padel bags are designed in Spain.

That is not a criticism — it is simply where the sport grew up, and it shows in
the bags. They assume a dry court, a dry walk to the car, and kit that goes home
in the same condition it arrived.

Dutch padel does not work like that. Most courts here are outdoors. The season
runs through eight months of rain. Kit comes off the court wet, goes into the
boot wet, and sits in a hallway until the next session.

The Weather Bag is built for that. The wet compartment is sealed and drains, so
a soaked towel and a wet grip never end up against a dry change of clothes. The
shoe section ventilates rather than trapping damp. The outer is water-repellent
without PFAS.

What it is not: a dry bag. It will keep out Dutch rain. It will not survive
submersion, and we would rather tell you that here than have you find out.

[SUPPLIER CONFIRMS: capacity in litres · dimensions · weight · outer fabric and
hydrostatic head · lining · zip type and rating · racket capacity]
```

The penultimate paragraph is doing real work. A published limitation makes the
surrounding claims more credible, and it prevents a return.

### Product-specific FAQ
```
Q: How many rackets does it hold?
A: [SUPPLIER CONFIRMS: racket capacity]

Q: Is it waterproof?
A: It is water-repellent, not waterproof. It is built to keep rain out during
   normal play and transport. It is not a dry bag and should not be submerged.

Q: Will the wet compartment leak into the rest of the bag?
A: No — it is sealed and drains separately. [SUPPLIER CONFIRMS: drainage
   construction]

Q: Does it contain PFAS?
A: No. [SUPPLIER CONFIRMS: supplier declaration on file]

Q: Can I put wet shoes straight in?
A: Yes, that is what the ventilated shoe section is for. Leave the bag open at
   home and it will dry faster than a sealed compartment would.

Q: How do I clean it?
A: [SUPPLIER CONFIRMS: care instructions — these also populate the GPSR
   compliance.care_instructions metafield]

Q: When will it arrive?
A: [FULFILMENT CONFIRMS: cut-off time and NL delivery window. Show a date range,
   never a duration, and never a date the 3PL has not committed to]
```

---

## 2. Consumable — overgrips

### Product title
```
POLDER Overgrips — tacky in the wet, 12-pack
```

### Promise
```
The grip that still grips when the ball is heavy and your hands are not dry.
```

### Description
```
An overgrip is the cheapest thing in your bag and the first thing that fails.
Three or four sessions in, it goes slick, and the racket starts moving in your
hand before you notice you are gripping harder to compensate.

Playing outdoors makes it faster. Humidity, rain and a damp towel between points
all shorten a grip's life.

So we did two things. We specified for wet-weather tack rather than dry-court
feel — [SUPPLIER CONFIRMS: material, thickness, surface treatment]. And we made
replacing them automatic, because the real problem is not that grips wear out.
It is that nobody replaces them on time.

[SUPPLIER CONFIRMS: length · thickness · material · pack contents]
```

The second paragraph is the whole subscription argument, made without mentioning
the subscription.

### Subscription copy (appears at the subscribe toggle)
```
Fresh grips, on your schedule

Choose every 4, 6 or 8 weeks — whatever matches how often you play.
Skip a delivery or cancel any time, from your account, without emailing us.

[CONFIRM: subscription discount %, once modelled in finance/]
```

Cadence is **chosen, not assumed**, and cancellation ease is stated **at the
point of subscribing** rather than buried. Both are deliberate: the recurring
complaint against subscription brands is difficulty leaving, and saying it
up-front is the direct antidote.

---

## 3. The starter set — the default purchase

### Title
```
POLDER Starter Set — Weather Bag + 12 overgrips + racket protector
```

### Promise
```
Everything you need for a wet season, for less than buying it separately.
```

### Description opening
```
The bag, a season of grips, and a protector for the frame — the three things
that decide whether your kit survives a Dutch winter.

Bought together, [CONFIRM: saving vs buying separately, once prices are set].
```

**This is the SKU the economics depend on.** A €39–49 order cannot fund cold
acquisition at all (`../strategy/unit-economics.md`), so the set is not a
merchandising choice — it is the only configuration that pays for its own
customer. The saving must be real and calculable from the published single
prices.

---

## 4. Metafield values the theme expects

The theme renders nothing without these, and blocks purchase without the
compliance ones. Full definitions in `../shopify/README.md`.

| Metafield | Value |
|---|---|
| `compliance.manufacturer_name` | [SUPPLIER CONFIRMS] — or POLDER's legal entity, since own-brand makes us the deemed manufacturer |
| `compliance.manufacturer_address` | [LEGAL ENTITY ADDRESS] |
| `compliance.manufacturer_email` | [SUPPORT EMAIL] |
| `compliance.product_identifier` | [BATCH/SKU scheme — see `../operations/gpsr-runbook.md`] |
| `compliance.country_of_origin` | [SUPPLIER CONFIRMS] |
| `compliance.materials` | [SUPPLIER CONFIRMS] |
| `compliance.care_instructions` | [SUPPLIER CONFIRMS] |
| `compliance.warnings` | [SUPPLIER CONFIRMS — in Dutch for NL] |
| `compliance.component_details` | **Starter set only.** Per-component manufacturer details: the set is one product but three physical products, each owing its own Article 19 data |
| `custom.specifications` | The `[SUPPLIER CONFIRMS]` spec block, once filled |
| `custom.whats_included` | Contents list — pre-empts the commonest post-purchase disappointment |
| `custom.units` *(variant)* | 1 / 12 / 24 for per-unit pricing on tiers |
| `custom.most_popular` *(variant)* | True on the middle tier |
| `pricing.lowest_price_30d` | **Leave empty.** Only populate from real price history; the theme renders no reference price without it |

---

## 5. SEO and feed content

Titles differ by surface on purpose: a page title reads to a human, a feed title
is parsed by a matching algorithm.

| Field | Value |
|---|---|
| SEO title — bag | `Padel bag with wet/dry separation \| POLDER` |
| SEO description — bag | `A padel bag built for outdoor play in Dutch weather. Sealed wet compartment, ventilated shoe section, PFAS-free water-repellent outer. Ships from the Netherlands.` |
| SEO title — grips | `Padel overgrips for wet conditions \| POLDER` |
| SEO description — grips | `Overgrips specified for humid and wet play, in packs of 12. Subscribe every 4, 6 or 8 weeks and skip or cancel any time.` |
| Feed title — bag | `POLDER Weather Bag — Padel Bag, Wet/Dry Separation, [COLOUR]` |
| Feed description — bag | First two paragraphs of the long description, placeholders resolved. **No promotional language, no "sale", no all-caps** — these cause disapprovals |
| Google product category | `Sporting Goods > Athletics > Racquet Sports` — [CONFIRM against the current taxonomy] |
| GTIN | [SUPPLIER CONFIRMS. If genuinely none exists, set `identifier_exists=false` rather than omitting it] |

**Feed price must match the landing page exactly.** Mismatch is the most common
disapproval and is entirely self-inflicted.

---

## 6. Image alt text

Alt text is an accessibility requirement, not an SEO field. Describe what is in
the image for someone who cannot see it; do not stuff keywords.

| Shot | Alt text |
|---|---|
| Product on clean background | `POLDER Weather Bag, [COLOUR], side view` |
| In use, wet court | `The bag on a wet outdoor padel court, rain beading on the outer fabric` |
| Scale reference | `The bag beside two padel rackets, showing its size` |
| Wet compartment open | `The sealed wet compartment open, separate from the main section` |
| Shoe section | `The ventilated shoe section with a pair of court shoes inside` |
| What's in the box | `Everything included: bag, twelve overgrips, racket protector` |
| Detail macro | `Close-up of the water-repellent outer fabric and zip` |

**Every image must be original.** Supplier images carry unclear commercial
rights and, in this category, would show the wrong weather — which is the entire
proposition. The photography plan is in `creative-bank.md`.

---

## 7. Claims that may never appear

Enforced in copy review, not just in product choice.

| Banned | Why |
|---|---|
| Any claim about the player's performance, game or results | Unsubstantiable, and invites a comparison we cannot evidence |
| Any health, injury-prevention or ergonomic claim | Strays toward medical-device and health-claim regimes |
| "Waterproof" | The product is water-repellent. The distinction is the credibility |
| "Best", "the only", "professional-grade" | Unsubstantiated superlatives are unfair commercial practices |
| A "was" price not drawn from real 30-day history | Omnibus. The theme blocks it, but copy must not smuggle it back in |
| Any review or testimonial not from a verified purchaser | Unlawful, and prohibited in `../CLAUDE.md` |
| Stock scarcity not read from real inventory | Same |
| Sustainability claims beyond PFAS-free | Green claims need evidence. PFAS-free is defensible with a supplier declaration; "eco-friendly" is not |

---

## 8. Before any of this publishes

1. Every `[SUPPLIER CONFIRMS]` replaced with a figure from a written supplier
   statement — not a sales email, a specification.
2. Every `[CONFIRM]` resolved against the finance model.
3. Dutch translations of all customer-facing copy, including the GPSR warnings.
   Dutch is the launch market; English is the second locale.
4. A copy review against section 7.
5. Original photography shot. Nothing publishes on supplier images.
