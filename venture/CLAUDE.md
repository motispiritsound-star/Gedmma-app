# Engineering conventions — commerce venture

Scope: everything under `venture/`. Nothing here applies to Buurklus, and no
change in this directory may touch files outside it.

## Non-negotiables

**1. Never fabricate a number.** Not a supplier cost, search volume, conversion
rate, ROAS, review count or competitor figure. Where a number is needed and
unavailable, write `UNVERIFIED — requires X`. This is the project's primary
quality rule; everything else is secondary to it.

**2. Tag every number.** `FACT` (sourced, linked, dated) / `ESTIMATE` (reasoning
shown) / `ASSUMPTION` (recorded choice) / `UNVERIFIED` (names the access needed).

**3. Never claim something was tested that was not tested.** No Shopify store,
ad account, supplier or payment provider is reachable from this environment. QA
items requiring them are marked BLOCKED, never passed. A checklist that lies is
worse than no checklist.

**4. No secrets in the repository.** No API keys, tokens, passwords or store
credentials, ever. Provide `.env.example` with empty placeholders and document
the minimum scope each credential needs.

**5. Record decisions in `DECISION_LOG.md`** with alternatives, evidence and
reversibility — before implementing them, not after.

## Shopify theme standards

### Architecture
Online Store 2.0. JSON templates, sections everywhere, section groups for header
and footer. No headless/Hydrogen unless a quantified reason is recorded in the
decision log — headless buys flexibility this business does not yet need and
costs velocity it does.

Every section ships with a `{% schema %}` exposing its content as settings.
Hardcoded copy inside a section is a defect: the merchant must be able to edit it
in the theme editor without a developer.

### Liquid
- `{% liquid %}` blocks for multi-line logic; keep markup and logic separated
- Snippets take explicit parameters — never rely on ambient scope
- Guard every optional setting: `{% if section.settings.heading != blank %}`
- No inline `style` attributes except for genuinely dynamic values, and then via
  CSS custom properties
- Translate every user-facing string through locale files. No bare English or
  Dutch in markup.

### Performance budget
This is commercial infrastructure, not a vanity metric. Mobile-first.

| Budget | Limit |
|---|---|
| Theme JavaScript, compressed | ≤ 50 KB |
| Render-blocking requests | 0 beyond the theme stylesheet |
| Third-party scripts in the theme | 0 — apps and tags load via Customer Events |
| LCP image | one per template, `fetchpriority="high"`, never lazy |
| CLS | Explicit `width`/`height` or `aspect-ratio` on every image and embed |

Rules: no jQuery, no CSS or component framework, no web fonts beyond two weights
with `font-display: swap`. JavaScript is progressive enhancement — every page
must be navigable and purchasable without it where the platform allows.

### Accessibility — WCAG 2.2 AA as the target
Semantic HTML first; ARIA only when semantics genuinely cannot express it.
Visible focus states on every interactive element (never `outline: none` without
a replacement). Text contrast ≥ 4.5:1, UI components ≥ 3:1. Every control
reachable and operable by keyboard, including menus, drawers and dialogs. Labels
on every form field. Errors announced, not merely coloured. Images carry
meaningful `alt`, decorative images carry `alt=""`.

### CSS
Design tokens as custom properties on `:root`, set from theme settings so the
merchant controls the palette. Mobile-first media queries. BEM-ish naming
(`.product-card__title--featured`). No `!important`.

## Legal and marketing constraints that are engineering constraints

The EU Omnibus Directive and Dutch consumer law make several common conversion
patterns unlawful, so they are prohibited in this codebase:

- No countdown timer that resets, no "only 3 left" unless it reads real
  inventory, no fabricated recent-purchase popups
- No "was" price that was never genuinely charged — reference prices must be the
  lowest price applied in the preceding 30 days
- No review that did not come from a verified purchaser of this store. Supplier
  reviews are research material and must never be displayed as ours.

Scarcity and urgency are permitted only when true and derived from real data.

## Testing

The economics engine has real tests and they must stay green:

```bash
cd venture/finance && npm test
```

Theme code cannot be integration-tested without a store. What *can* be tested is
tested: schema validity, token consistency, and any pure logic is extracted into
testable modules rather than buried in Liquid.

## Commits

Explain why, not what — the diff shows what. Keep `venture/` changes in their own
commits, never mixed with Buurklus.
