# Storefront theme

An Online Store 2.0 theme for the venture. Source only — **it has never been
deployed, because no Shopify store exists and none can be created from this
environment.** See `../ACCESS-AND-LIMITS.md`.

```bash
cd venture/shopify && npm test    # 15 checks, zero dependencies, no store needed
```

## An honest caveat about this code

**Shopify's developer documentation was unreachable from the build environment.**
`shopify.dev`, `help.shopify.com` and `shopify.com` are all blocked by the
network egress policy, so this theme was written from working knowledge of the
Online Store 2.0 architecture rather than against current reference docs.

The architecture it relies on — JSON templates, sections with `{% schema %}`,
section groups, snippets, locale files, metafields, the `localization` object —
has been stable for years, so the risk is low but not zero. Before deploying:

1. Run `shopify theme check` and fix anything it reports.
2. Push to an **unpublished** theme and preview it.
3. Confirm the metafield definitions exist (see `../operations/gpsr-runbook.md`)
   — several components render nothing without them, by design.

Treat the first deploy as a validation step, not a formality.

## What the theme does that a stock theme does not

Three EU rules are enforced in code, because leaving them to whoever edits the
store on a Thursday is how a store ends up making an unlawful claim.

**It cannot display an unlawful reference price.** The Omnibus Directive requires
any "was" price to be the lowest price applied in the preceding 30 days.
Shopify's `compare_at_price` is a free-text field nobody validates and is *not*
that number. So `snippets/price-compare.liquid` does not read it. It reads a
`pricing.lowest_price_30d` metafield that operations maintains from real price
history, and renders nothing when that is absent. There is a test asserting
`compare_at_price` is never rendered as a price anywhere in the theme.

**It puts GPSR information where the regulation requires it.** Article 19 wants
manufacturer identity, contact details, product identification and safety
warnings in the online offer itself — footer placement does not satisfy it. So
`snippets/regulatory-information.liquid` renders inline on the product page. When
the compliance metafields are missing it shows a loud warning **to staff only**,
because a product without that data cannot lawfully be offered and a silent
empty block is exactly how that gets missed.

**It cannot fake social proof.** Review structured data is emitted only behind a
genuine non-zero rating count, and the on-page rating renders only when a real
rating metafield exists. Supplier reviews are research material and must never be
presented as ours.

## Page architecture, and why it is ordered this way

From `../research/success-patterns.md` §3–4, which derives the ordering from
Baymard's published PDP research. The decisions that are deliberate rather than
conventional:

- **The quantity-tier selector sits above add-to-cart.** It is the primary AOV
  lever, and `../strategy/unit-economics.md` shows a €39–49 order cannot fund
  cold acquisition at all. Below the button it would be decoration.
- **Depth content uses collapsed accordions, never horizontal tabs.** Baymard
  identifies tabs as the worst-performing layout for content discovery.
- **The trust row sits directly beneath the buy button** — the
  reassurance-at-commitment slot most stores waste.
- **The announcement bar carries one message and does not rotate.** A rotating
  bar shows each message to about a third of visitors while costing the
  attention of all of them.
- **The hero is static with a single CTA.** Sliders underperform and rotation
  creates hesitation at the highest-attention point on the site.
- **The market selector prompts and never auto-redirects.** IP redirection
  strands travellers, breaks shared links and confuses crawlers.

## Budgets, enforced by tests

| Budget | Limit | Enforced by |
|---|---|---|
| Theme JavaScript | < 50 KB | `theme.test.js` |
| Third-party scripts in the theme | zero | `theme.test.js` |
| `<img>` without `alt` | zero | `theme.test.js` |
| Focus outline removed without replacement | zero | `theme.test.js` |
| Hardcoded colours in markup | zero | `theme.test.js` |
| Dutch translation coverage | 100% of default locale | `theme.test.js` |

Tags and pixels are **not** in the theme. They belong in Customer Events, where
consent can gate them — see `../marketing/measurement-plan.md`.

## Layout

```
theme/
  layout/theme.liquid          Document shell, design tokens from settings
  sections/
    main-product.liquid        The PDP. Blocks are reorderable by the merchant
    header.liquid, footer.liquid, announcement-bar.liquid
    hero.liquid, trust-strip.liquid, comparison.liquid, faq.liquid
    header-group.json, footer-group.json
  snippets/
    regulatory-information.liquid   GPSR Art. 19 block
    price-compare.liquid            Omnibus-safe reference pricing
    structured-data.liquid          Fails closed on reviews
    market-selector.liquid          Prompt, never redirect
    meta-tags.liquid, breadcrumbs.liquid, product-details-accordion.liquid
  templates/index.json, product.json
  config/settings_schema.json
  locales/en.default.json, nl.json
  assets/theme.css, theme.js
```

## Deploy runbook

**Nothing below has been executed.** It is written so a human with store access
can follow it without re-deriving the decisions.

### Prerequisites
- A Shopify store (Partner development store is fine to begin)
- Shopify CLI installed and authenticated
- Metafield definitions created first — several components render nothing
  without them

### Metafield definitions to create

| Namespace.key | Type | Used by |
|---|---|---|
| `compliance.manufacturer_name` | Single line text | GPSR block |
| `compliance.manufacturer_address` | Multi-line text | GPSR block |
| `compliance.manufacturer_email` | Single line text | GPSR block |
| `compliance.responsible_person_name` | Single line text | GPSR block (non-EU manufacturers only) |
| `compliance.responsible_person_address` | Multi-line text | GPSR block |
| `compliance.responsible_person_email` | Single line text | GPSR block |
| `compliance.product_identifier` | Single line text | GPSR block |
| `compliance.country_of_origin` | Single line text | GPSR block |
| `compliance.materials` | Single line text | GPSR block |
| `compliance.care_instructions` | Single line text | GPSR block |
| `compliance.warnings` | Rich text | GPSR block |
| `pricing.lowest_price_30d` | Money | Omnibus reference price |
| `custom.specifications` | Rich text | PDP accordion |
| `custom.whats_included` | Rich text | PDP accordion |
| `custom.units` *(variant)* | Integer | Per-unit pricing on tiers |
| `custom.most_popular` *(variant)* | Boolean | "Most popular" badge |

Mark the `compliance.*` and `custom.specifications`/`whats_included` definitions
**translatable** — GPSR requires safety information in a language the consumer
easily understands, which means Dutch for NL and German for DE.

### Steps

```bash
shopify theme check                      # fix everything it reports first
shopify theme push --unpublished         # never push straight to live
shopify theme dev                        # local preview against the store
```

Then, in the admin, before publishing:

1. Set company details in theme settings — **KvK and btw numbers are required**
   by EU distance-selling information duties, and the footer renders them.
2. Write the guarantee: name it, give it a number, and publish its exclusions.
3. Set shipping and returns summaries. State who pays return postage — if the
   customer is not told in advance, the merchant pays it.
4. Populate `compliance.*` metafields for every product. The staff-only warning
   block will show you which are missing.
5. Verify the Dutch locale is published and complete.

### What cannot be verified until a store exists

Checkout, payment methods, tax display, shipping rates, Markets behaviour, real
performance figures, and every analytics event. These are marked BLOCKED in
`../qa/launch-checklist.md` rather than assumed to pass.
