# Measurement and consent

Written 2026-09-12.

**Nothing in this plan has been implemented or validated.** No analytics account,
tag manager, pixel or ad platform is reachable from this environment. Every
validation step below is BLOCKED, and `../qa/analytics-validation.md` records
that rather than pretending otherwise. Seeing a pixel installed is not evidence
that attribution works, and this document must never be read as though it were.

## The rule that shapes everything

In the EU, **tracking cookies and similar identifiers require consent before
they are set**, not after. This is ePrivacy, implemented in the Netherlands via
the Telecommunicatiewet and enforced alongside the AVG. Practically:

- No Meta pixel, no GA4 tag, no TikTok pixel fires before the visitor consents.
- Pre-ticked boxes are not consent. "Continue browsing" is not consent.
- Refusing must be as easy as accepting — an "Accept all" button with no
  equally prominent "Reject all" is the single most commonly cited failure.
- Consent must be recorded, and withdrawable as easily as it was given.

**Consequence for planning:** a material share of sessions will carry no
client-side tracking at all. Any forecast built on 100% measurement is wrong
before it starts. Plan for partial visibility and treat Shopify's own order data
— which is first-party and complete — as the source of truth for revenue, with
ad platforms as directional attribution only.

This is also why the theme carries **zero** third-party scripts and there is a
test enforcing it. Tags belong in Shopify's Customer Events, where consent state
gates them, rather than hardcoded into Liquid where they fire unconditionally.

## Architecture

```
Visitor
  │
  ├─ Shopify Consent banner ──────► Customer Privacy API holds consent state
  │                                        │
  │                                        ▼
  ├─ Customer Events (Web Pixels) ─► gated on marketing/analytics consent
  │     ├─ GA4
  │     ├─ Meta pixel
  │     └─ (TikTok — only if the channel is justified later)
  │
  └─ Server-side: Shopify order data ──► the source of truth for revenue
```

Deliberate decisions:

- **No Google Tag Manager.** It adds a script, a vendor, a consent surface and a
  place for someone to add an untracked tag later. Shopify's Customer Events
  does the job with consent gating built in. Revisit only if the tag count grows
  beyond what Customer Events handles comfortably.
- **One analytics platform.** Shopify Analytics plus GA4. Not Shopify + GA4 +
  a heatmap tool + a session recorder on day one. Each adds JavaScript, privacy
  exposure and a consent obligation, and at launch volumes session recording
  tells you almost nothing that ten customer emails would not.
- **Server-side conversions are deferred**, not rejected. The Conversions API
  improves signal but adds real complexity and its own consent considerations.
  It is worth doing once spend justifies it, and not before.

## The funnel, and what each step is for

| Step | Event | Why it is measured |
|---|---|---|
| Session | `page_viewed` | Denominator for everything |
| Product interest | `product_viewed` | Creative is working or not |
| Intent | `product_added_to_cart` | Offer and price are landing or not |
| Commitment | `checkout_started` | Friction appears here |
| Revenue | `checkout_completed` | The only number that pays wages |
| Retention | subscription renewal | **The business model.** More important than any acquisition metric |

The last row is the one most stores under-instrument and the one this business
depends on. If grip replenishment does not repeat, the thesis fails (see
`../strategy/unit-economics.md`), so renewal rate is a first-class metric from
day one, not a year-two concern.

## Diagnosis rules

Metrics are only useful if a reading maps to an action. These are the mappings
to apply, and they matter more than the dashboard:

| Reading | Most likely cause | Action |
|---|---|---|
| Low CTR | Creative or audience | Change the hook, not the landing page |
| Good CTR, low product-view rate | Slow page, or ad/landing mismatch | Check LCP and message match |
| Good product views, low add-to-cart | Price, offer, trust, or missing proof | Offer and PDP, not creative |
| High add-to-cart, low checkout start | Shipping cost or unexpected total | Shipping threshold and cart clarity |
| High checkout start, low completion | Payment methods, friction, or trust | Confirm iDEAL is present and default |
| Good ROAS, poor profit | An economics problem wearing a marketing costume | Revisit unit economics, not ad spend |

That last row is the trap. **Never scale on ROAS alone** — scale on contribution
profit and cash. A campaign can post 3x ROAS and lose money on every order if the
contribution stack is thin.

## Break-even ROAS, and the mistake that matters

The engine computes break-even ROAS on an **ex-VAT** basis as exactly
`1 / contribution margin`. But most pixel integrations report the **VAT-inclusive**
order total to the ad platform.

**A Dutch store that targets its ex-VAT break-even while its pixel reports
inclusive values is running 21% looser than it thinks.** A 2.00x target is
really 2.42x.

Decide which basis the pixel sends, write it down, and make every target
consistent with it. `finance/src/economics.js` takes `roasBasis` explicitly for
this reason, and there is a test asserting the 1.21 relationship.

## UTM standard

One standard, applied everywhere, lower-case, no spaces. Inconsistent UTMs are
unrecoverable after the fact.

```
utm_source   = meta | google | tiktok | klaviyo | club | creator
utm_medium   = cpc | paid_social | email | sms | organic_social | referral | qr
utm_campaign = {market}_{objective}_{yyyymm}      e.g. nl_prospecting_202610
utm_content  = {concept}_{format}_{variant}       e.g. wetbag_ugc_a
utm_term     = keyword, paid search only
```

`utm_source = club` with `utm_medium = qr` covers the physical channel — QR codes
on club noticeboards and demo-day cards. Padel clubs are a core acquisition
route for this business, and untracked physical channels become invisible and
then get cut for looking unproductive.

## Google Merchant Center feed quality

Shopping is sequenced **after** feed and tracking are correct, never before —
a disapproved feed or a mis-measured conversion at scale is expensive.

Before enabling: titles follow `Brand + product + key attribute + variant`;
GTINs present or explicitly absent with `identifier_exists=false`; `brand`
populated; price and availability match the landing page exactly; shipping and
returns configured in Merchant Center; images meet the minimum size and carry no
promotional overlay; and the landing page shows the same price the feed claims.
Feed-versus-page price mismatch is the most common disapproval and is entirely
self-inflicted.

## Validation — all BLOCKED

This is what would be verified with store access. **None of it has been done.**

| # | Check | Status |
|---|---|---|
| 1 | No tag fires before consent is granted | BLOCKED — no store |
| 2 | Rejecting sets no marketing cookies | BLOCKED |
| 3 | Withdrawing consent stops collection | BLOCKED |
| 4 | `checkout_completed` fires once, never twice | BLOCKED |
| 5 | Purchase value and currency are correct | BLOCKED |
| 6 | Value basis (incl./excl. VAT) matches the ROAS target | BLOCKED |
| 7 | Product IDs match the Merchant Center and Meta catalogue | BLOCKED |
| 8 | UTMs survive the checkout journey | BLOCKED |
| 9 | Shopify order count reconciles with GA4 within a stated tolerance | BLOCKED |
| 10 | Subscription renewals are attributed to the original acquisition | BLOCKED |

Check 4 deserves emphasis: duplicate purchase events are the most common
attribution defect, they inflate reported ROAS, and inflated ROAS causes
overspending. It is worth testing deliberately rather than assuming.

## Weekly review

Current / target / trend / action for each. Revenue, orders, AOV, conversion
rate, CAC, MER, gross margin, **contribution margin**, refund rate, chargebacks,
**subscription renewal rate**, email revenue share, top and fatiguing creatives,
and product-level returns.

Contribution margin and renewal rate are the two that decide whether this
business works. Everything else is diagnostics.
