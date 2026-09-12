# Decision log

Append-only. Every material decision, its alternatives, the evidence behind it,
and how reversible it is. New decisions go at the bottom.

Reversibility scale: **FREE** (change anytime) / **CHEAP** (rework, no money) /
**COSTLY** (money or time already committed) / **ONE-WAY** (effectively permanent).

---

## D-001 — Build the venture in `venture/`, isolated from Buurklus
**Date** 2026-09-12
**Decision** The e-commerce venture lives entirely under `venture/`. No file
outside that directory is modified.
**Context** This repository already contains Buurklus, a Dutch marketplace
connecting households with tradespeople (Fastify/Prisma API, Expo app, website,
shared domain package, 111 tests). The commissioning brief is for an unrelated
Shopify e-commerce business, and the assigned branch is named for it.
**Alternatives** (a) Build at repo root — rejected, would collide with Buurklus
and risk breaking a working product. (b) New repository — rejected, the branch
assignment places the work here. (c) Isolated subdirectory — chosen.
**Rationale** The two businesses share nothing but an owner. Isolation keeps
Buurklus's build, tests and deploys untouched, and keeps the venture legible.
**Risk** Someone later assumes the two are related. Mitigated by this log and
`venture/README.md`.
**Reversibility** FREE

---

## D-002 — Assume a Netherlands-based merchant, selling into the EU first
**Date** 2026-09-12
**Decision** All research, tax, compliance and logistics work assumes the
operating entity is established in the **Netherlands**, and that the EU single
market is the natural first commercial territory.
**Context** No jurisdiction was stated in the brief, which asked for
"international". Jurisdiction is not a cosmetic detail — it determines VAT
treatment, OSS/IOSS registration, product-safety obligations, who counts as the
"importer", consumer-law regime, and which suppliers are viable.
**Evidence** The surrounding repository is unambiguously Dutch-operated: Buurklus
ships Dutch-first, implements AVG (Dutch GDPR) obligations, validates KvK
numbers and BSN-adjacent identifiers, prices in euro with 21% btw, and seeds 46
Dutch municipalities. The account holder's address is a `.nl` domain.
**Alternatives** Ask the user and block all work until answered — rejected under
the brief's explicit instruction (§53) to make reasonable reversible assumptions
and keep working rather than stopping for confirmation.
**Rationale** This is the overwhelmingly probable reading, and it is the one that
makes the compliance research useful rather than generic.
**Risk** If the entity is in fact elsewhere, the VAT/OSS and GPSR analysis needs
revisiting. The product and brand work survives unchanged.
**Reversibility** CHEAP — flagged for the user as the single most important
assumption to confirm.

---

## D-003 — Let compliance screen products *before* demand research selects them
**Date** 2026-09-12
**Decision** EU regulatory constraints (GPSR, EPR, sector rules) are researched
in parallel with demand and applied as a **hard gate** during screening, not as a
compliance review after a product is chosen.
**Context** The conventional sequence researches demand, picks a winner, then
discovers the regulatory burden. In the EU this ordering is expensive: recent
product-safety and producer-responsibility law can make an otherwise attractive
product unviable for a small seller, and can undermine an entire business model.
**Rationale** Screening early is nearly free. Discovering it after brand,
photography and inventory spend is not.
**Reversibility** FREE

---

## D-004 — Reject dropshipping; adopt own-brand, own-stock, EU-fulfilled
**Date** 2026-09-12
**Decision** The business holds its own stock under its own brand, fulfilled from
an NL/EU 3PL, with a deliberately small catalogue. No-inventory dropshipping is
rejected outright, including EU-warehoused dropshipping as a permanent model.
**Evidence** E-002 (GPSR importer/manufacturer obligations, technical file per
SKU, Art. 19 disclosure in the offer), E-003 (€150 de minimis abolished 1 July
2026, flat per-line customs charge borne by the seller).
**Alternatives** (a) China direct dropshipping — rejected, structurally
non-compliant and economically broken. (b) EU-warehoused dropshipping as the
business — rejected as a permanent model; gross margin will not fund paid
acquisition. Retained only as an optional short validation instrument. (c) Print
on demand — rejected, wrong for a durable technical product. (d) Private label on
own stock — chosen.
**Rationale** Compliance cost is per SKU, not per order, which forces a small
catalogue and rewards owning the product. Holding stock is also the only route
found that reaches first-order breakeven at a realistic Dutch CAC.
**Risk** Capital requirement and inventory risk rise materially; a wrong product
choice is now expensive rather than free. Mitigated by keeping the launch
catalogue to a single hero plus consumables.
**Reversibility** COSTLY once stock is purchased. FREE until then.

---

## D-005 — Padel accessories, with a wet-weather bag as hero and grips as the consumable
**Date** 2026-09-12
**Decision** Padel accessories is the selected category. The hero product is a
padel bag designed for outdoor play in Northern European weather; the retention
engine is an overgrip subscription; the default entry SKU is a set rather than a
single unit.
**Evidence** E-006 (only cleanly triangulated demand in the long-list: 876k NL
players, 3,570 courts, 6th globally, +25% courts YoY), E-009 (no sizing — avoids
the worst returns regime in the world), E-011 and E-005 (rising CPMs and basket
deflation make replenishment the decisive economic property), E-002 (low
regulatory burden, and GPSR favours an EU-established seller).
**Alternatives** Dutch utility-cycling accessories (69.6), problem-specific dog
gear (68.4), wet-weather protection (64.4) — all scored and retained.
**Rationale** Padel scored 80.0 and **held first place under all five alternative
weightings tested**, including a moat-heavy scheme built specifically to punish
its weakest dimension. The ranking is therefore not an artefact of the weights.
The climatic angle exists because the category's established brands are Spanish
and Latin American and design for dry climates, which is a genuine gap rather
than a positioning slogan.
**Risks** (1) Incumbents hold club distribution — the most dangerous unknown.
(2) Overgrips are commodities; the bag must carry the brand. (3) Court shortage
is capping participation growth, so the business must be underwritten on the
existing base, not on continued growth. (4) 37.5% of the scoring model is blank
for want of supplier data.
**Reversibility** CHEAP today — nothing has been bought and no brand assets are
committed. Becomes COSTLY at first stock purchase.

---

## D-006 — Launch in the Netherlands alone; add markets one at a time
**Date** 2026-09-12
**Decision** Launch NL-only. Belgium second, Germany a deliberate later decision.
Spain deferred despite being the largest European padel market.
**Evidence** E-004 — EPR is per-country and per-waste-stream with no volume
threshold in DE or FR; PPWR reportedly requires an authorised representative per
member state from 12 August 2026.
**Rationale** Market count is a fixed-cost multiplier independent of revenue.
Launching four markets at once multiplies a fixed cost across a revenue base that
does not exist yet. European benchmark brands sequence markets one or two at a
time for the same reason. Spain is deferred on strategy rather than cost: a
wet-weather proposition has no reason to exist in a dry climate.
**Risk** Slower international growth than the brief's ambition implies. Recorded
as a deliberate trade, not an oversight.
**Reversibility** FREE
