# Analytics validation report

Updated 2026-09-12.

## Result: NOT VALIDATED. Nothing has been tested.

No Shopify store, tag manager, analytics property, pixel or ad account is
reachable from this environment (`../ACCESS-AND-LIMITS.md`). No event has been
fired, so no event has been verified.

This report exists to record that honestly, and to be the checklist someone
works through on the day store access exists. **It must not be read as evidence
that tracking works.** The brief was explicit on this point and it is worth
repeating: seeing a pixel installed is not evidence that attribution works.

## Why an untested measurement setup is a financial risk, not a technical one

Three specific failures are common, silent, and expensive:

1. **Duplicate purchase events** inflate reported ROAS. The optimiser then bids
   into an illusion, and spend scales against revenue that does not exist. This
   is the single most damaging measurement defect and the easiest to miss,
   because everything looks *better* than reality.
2. **Wrong value basis.** If the pixel reports VAT-inclusive totals while targets
   were set on an ex-VAT break-even, every campaign runs 21% looser than
   intended — profitable on the dashboard, unprofitable in the bank.
3. **Tags firing before consent.** An EU compliance exposure, and it also
   corrupts the data by mixing consented and non-consented sessions.

## The validation protocol

Work top to bottom. Do not enable paid spend until items 1–8 pass.

### Consent

| # | Test | Method | Status |
|---:|---|---|---|
| 1 | No analytics or marketing tag fires before consent | Load in a clean private window, open the network panel, confirm no request to Google or Meta domains before interacting with the banner | **BLOCKED** |
| 2 | "Reject all" sets no marketing cookies | Reject, then inspect cookies and storage | **BLOCKED** |
| 3 | Rejecting is as easy as accepting | Visual check: equally prominent, same number of clicks | **BLOCKED** |
| 4 | Withdrawing consent stops collection | Accept, browse, withdraw, confirm requests cease | **BLOCKED** |
| 5 | Consent state is recorded and persists across pages | Check the Customer Privacy API state | **BLOCKED** |

### Events

| # | Test | Method | Status |
|---:|---|---|---|
| 6 | Each funnel event fires exactly once | Walk the funnel with the network panel open; count requests per step | **BLOCKED** |
| 7 | **`checkout_completed` fires once and only once** | Complete a test order; then refresh the thank-you page and confirm it does **not** fire again | **BLOCKED** |
| 8 | Purchase value and currency are correct | Compare the reported value against the Shopify order to the cent | **BLOCKED** |
| 9 | Value basis matches the ROAS target | Determine whether the reported value includes VAT and shipping; record the answer in the measurement plan | **BLOCKED** |
| 10 | Product IDs match the Merchant Center and Meta catalogue | Compare IDs across all three | **BLOCKED** |

Item 7 deserves the refresh test specifically: thank-you-page events that
re-fire on reload are a classic source of inflation and will not show up in a
single clean walkthrough.

### Attribution

| # | Test | Method | Status |
|---:|---|---|---|
| 11 | UTMs survive the journey to purchase | Enter with tagged URL, complete an order, confirm attribution landed | **BLOCKED** |
| 12 | Shopify order count reconciles with GA4 within tolerance | Compare a full day; agree an acceptable variance in advance and write it down | **BLOCKED** |
| 13 | Subscription renewals attribute to the original acquisition | Trigger a renewal and trace it | **BLOCKED** |
| 14 | Club and QR traffic appears under its own source | Scan a real code, confirm `utm_source=club` arrives | **BLOCKED** |

Item 13 matters more here than in most stores. Retention *is* the business model,
and if renewals cannot be traced back to the campaign that acquired the customer,
true CAC payback is unmeasurable and every acquisition decision is being made
blind.

### Feed

| # | Test | Method | Status |
|---:|---|---|---|
| 15 | Merchant Center reports no disapprovals | Check diagnostics after first crawl | **BLOCKED** |
| 16 | Feed price matches the landing page exactly | Spot-check every SKU | **BLOCKED** |
| 17 | Shipping and returns configured in Merchant Center | Settings review | **BLOCKED** |

Price mismatch between feed and page is the most common disapproval and is
entirely self-inflicted.

## Sign-off

No one can sign this off today, and no one should pretend to.

> Validated by: ____________________  Date: __________
>
> I confirm items 1–17 were tested against a live store, and that the value
> basis recorded in `../marketing/measurement-plan.md` matches what the pixel
> actually reports.

Until that signature exists, treat all platform-reported performance as
**unverified**, and use Shopify's own order data — which is first-party and
complete — as the source of truth for revenue.
