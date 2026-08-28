# Buurklus — the product

## The problem

Finding a reliable tradesperson runs on word of mouth. You ask a neighbour, a
colleague, the family WhatsApp group. It works when your network happens to
contain the right person and fails when it does not: you end up with one quote
you cannot compare, from someone you cannot check.

From the other side, a good painter in Utrecht has the opposite problem. Their
diary is full in March and empty in August, and they have no way to reach the
household two streets away who wants exactly what they do.

Buurklus is a marketplace for that gap: households post jobs, tradespeople reply
with quotes, and both sides carry a public track record.

## The model, and why this one

Two-sided marketplaces for services settle into one of three revenue models.

**Commission on the job.** The platform takes a cut. This fits marketplaces
where the payment happens on the platform. It does not fit here: home repair is
invoiced directly by the tradesperson, often in instalments as the work
progresses, and a commission the platform cannot observe is a commission it
cannot collect. Forcing payments on-platform would push both sides to complete
the deal off it.

**Pay per lead.** The tradesperson buys each customer contact. Predictable for
the platform, unpredictable for a one-person business that cannot forecast its
monthly cost — and every unanswered lead feels like money burnt.

**Subscription with an included quota.** A fixed monthly amount that includes a
number of leads. The cost is a budget line a business can plan around, and the
quota keeps the platform from being flooded with low-effort quotes. This is what
Buurklus does.

A credit is spent when a tradesperson **sends a quote**, not when they view a
job. Browsing is free, so nobody is charged for a job that turns out to be a
poor fit, and the tradesperson decides when to spend. If the household withdraws
the job before awarding it, the credit is refunded — the lead never had a
chance. If the tradesperson simply loses, the credit is gone: they got what they
paid for, which was the opportunity.

## Adapted to the Netherlands

**Sign-in is a mobile number.** Everyone has one, so the account is the number,
verified by SMS. The API accepts every way a Dutch number gets written —
`0612345678`, `+31 6 12345678`, `06-12345678` — and stores one canonical form,
so the same person never ends up with two accounts.

**Trust is anchored to the KvK number.** Every business registered in the
Netherlands has one, including a one-person zzp business, and the register is
public. A tradesperson supplies theirs and it appears on their profile, so a
household can look the business up rather than trusting a badge the platform
invented. Because every business has one, there is a single rule rather than a
branch: no KvK number, no professional account.

The VAT identification number is optional, deliberately. A business under the
small-business scheme (KOR) does not charge VAT and may not have one, and
demanding it would lock out exactly the small operators this market runs on.

**Prices are quoted excluding VAT.** Dutch businesses quote each other
"exclusief btw" and add 21% at invoicing. The subscription page leads with the
tax-exclusive price, the way a tradesperson expects to read it, with the
tax-inclusive figure beneath so there is no surprise on the invoice.

**Payment is iDEAL and direct debit.** That is how the country pays online and
how it pays for subscriptions. Card and bank transfer cover foreign-registered
businesses and companies that insist on invoicing.

**The trades match the housing stock and the moment.** Insulation, heat pumps,
solar panels and EV chargers are their own categories rather than footnotes,
because energy work has dominated Dutch home improvement since the gas price
shock. So are dormer windows and consumer-unit replacements. Property types are
the ones a Dutch listing uses — tussenwoning, hoekwoning, twee-onder-een-kap —
not a generic "house".

**Two languages.** Dutch is the default. English serves expats, international
students and the many tradespeople here who work in English before they work in
Dutch.

## How a job flows

1. **A household posts.** Five steps: trade, description with photos, location,
   timing, budget. The wizard shows typical prices for that trade so a
   first-time customer has some sense of the going rate.
2. **The job reaches tradespeople.** Only those whose trades and municipalities
   match. The top tiers see it first — that head start is what the higher plans
   sell — but it is capped at thirty minutes so a zzp'er still arrives before
   the household has decided.
3. **Tradespeople quote.** Each spends one credit. A job stops accepting quotes
   at six, which keeps the decision manageable and stops later arrivals from
   paying to join a queue they cannot win.
4. **The household awards one.** Only then does the winner receive the street
   address and the phone number. Before that, they see the municipality and the
   district. This is deliberate: the customer's address is not the product.
5. **The work happens off-platform**, paid however the two parties agree.
6. **The household marks it complete and reviews it.** Only the customer who
   awarded a completed job can review it, and only once. That constraint is the
   whole reason the ratings are worth reading.

## What is deliberately not here yet

- **Payments between household and tradesperson.** The money stays
  off-platform. Escrow is a different product and a different licence.
- **Instant booking.** Home repair is quoted, not priced from a menu. A "book
  now" button would misrepresent how this work is actually agreed.
- **Reviews of households.** One-sided for now: tradespeople rating customers
  reads as retaliation against anyone who left an honest review.

## Before this can trade

The code is a working foundation. Operating it as a business in the Netherlands
needs groundwork that is not a programming task, and is worth naming plainly:

- **A registered company.** An eenmanszaak or a BV, registered with the KvK,
  with a VAT number. Subscriptions are a B2B service subject to 21% btw, and
  invoices must carry the legally required fields.
- **A payment provider contract.** Mollie or an equivalent, which requires the
  company registration first. The adapter is written against Mollie's documented
  API but has never run against the live gateway.
- **GDPR paperwork.** A privacy statement, a lawful basis for processing, a
  retention schedule, and a processor agreement with every supplier that touches
  personal data — hosting, SMS, payments. This platform stores phone numbers,
  addresses and job descriptions, so it is squarely in scope.
- **Terms of use** setting out that Buurklus introduces the two parties and is
  not a party to the work itself. That distinction is what keeps the platform
  out of the contract between household and tradesperson.
- **A dispute route.** Not a legal requirement at this size, but the first
  serious complaint will arrive without one, and it is better decided in advance
  than in the moment.
