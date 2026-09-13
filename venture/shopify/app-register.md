# App decision register

Written 2026-09-13.

Every app is a standing cost, a script, a privacy exposure, a maintenance
obligation and a vendor dependency. The default answer is **no**, and this
register exists to make each **yes** argued rather than accumulated.

> **Pricing is UNVERIFIED throughout.** Shopify's own site and app store were
> blocked by the network policy (`../ACCESS-AND-LIMITS.md`), so no plan cost
> below has been read from source. Every figure must be checked before
> committing. Where no figure could be obtained at all, the cell says so rather
> than carrying a guess.

## The rule this register enforces

**Two apps may not do the same job.** The most common cause of a slow, expensive,
hard-to-debug Shopify store is not one bad decision but six reasonable ones made
six weeks apart, each solving a problem the previous app already half-solved.

## Decided: install at launch

| App | Purpose | Monthly cost | Performance impact | Data access | Alternatives considered | Why required |
|---|---|---|---|---|---|---|
| **Reviews** *(platform TBC)* | Collect and display verified-purchase reviews | **UNVERIFIED** | One script on PDP; must load after content | Customer name, email, order | Shopify Product Reviews; building our own | Social proof is a top-ranked conversion lever and the theme deliberately renders **nothing** without real review data. Choose one with a verified-purchase badge and an API, so reviews are ours if we leave |
| **Subscriptions** *(platform TBC)* | Grip replenishment | **UNVERIFIED** | Checkout + PDP widget | Customer, payment token, order | Manual reorder emails; Shopify Subscriptions | **This is the business model, not a feature.** Without it there is no retention engine. Must support customer-chosen cadence, and skip/cancel without contacting support |
| **Email/SMS (one platform)** | Lifecycle flows | **UNVERIFIED** | No storefront script if events come via Customer Events | Customer, email, behaviour | Shopify Email; two-tool split | One platform, not several. See `../marketing/lifecycle-flows.md` |

Three apps. That is the launch stack.

## Decided: do NOT install

Recording the refusals matters as much as the approvals, because the arguments
for these recur every few weeks.

| App class | Why not |
|---|---|
| **Cookie-consent app** | Shopify's own consent tooling plus the Customer Privacy API covers this. A third-party banner adds a script to every page to do what the platform does, and becomes a second place where consent state can disagree with itself |
| **Page builder** | The theme is the page builder. A drag-and-drop layer adds weight, fights the performance budget, and produces pages no test can validate |
| **Currency converter** | Shopify Markets handles presentment currency natively. A converter that shows a price the checkout does not honour is a trust failure and a price-indication problem |
| **Countdown timer / scarcity / "X people viewing"** | **Unlawful as normally implemented.** Resetting timers and invented stock counts are unfair commercial practices under the Omnibus Directive. Prohibited by `../CLAUDE.md` |
| **Upsell/cross-sell app** | The theme already renders bundles, tiers and "completes the set". Revisit only if a measured gap appears, not on principle |
| **Session recording / heatmaps** | At launch volumes it produces little that ten customer emails would not, while adding a script and a substantial privacy exposure. Revisit at scale |
| **SEO app** | The theme emits canonicals, hreflang from published locales, and structured data that fails closed on reviews. An SEO app would mostly duplicate that and occasionally contradict it |
| **Loyalty/points** | A retention mechanism competing with the subscription, which is the real one. Adding both at launch splits the incentive and confuses the offer |
| **Product-review importer** | Importing supplier reviews and showing them as ours is unlawful and prohibited. There is no acceptable configuration |

## Deferred, with a trigger

Not "no" — "not yet, and here is what would change it".

| App | Trigger to revisit |
|---|---|
| Helpdesk (e.g. Gorgias) | Support volume exceeds what a shared inbox handles — roughly when tickets pass ~20/day. Until then a mailbox is cheaper and faster |
| Returns portal | When return volume makes manual handling the bottleneck, or when Belgium adds a second return flow |
| Server-side conversions API | When ad spend is large enough that signal loss costs more than the integration. Not a launch concern |
| Affiliate/creator platform | When seeding relationships outgrow a spreadsheet. Strategy is seeding, not paid placement (`../marketing/launch-plan.md`) |
| Bundling app | Only if Shopify's native variant/bundle handling proves insufficient for the starter set |

## Before installing anything, answer these

1. What exactly does it do that the platform or theme does not?
2. Which existing app does it overlap with, and is one of them then removed?
3. What customer data does it receive, and is that in the privacy notice?
4. What does it add to the page, and does the performance budget still hold?
5. If we stop paying, what do we lose — and can the data come with us?
6. Who reviews it in six months?

An app that cannot survive question 1 or 2 does not get installed.

## Review cadence

Quarterly. Any app that has not earned its cost since the last review is removed;
an unused app is not free, because it still carries data access and a script.
