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
