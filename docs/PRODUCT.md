# Khidma — the product

## The problem

Finding a reliable tradesperson in Morocco runs on word of mouth. You ask a
neighbour, a colleague, the caretaker of the building. It works when your
network happens to contain the right person and fails when it does not: you
end up with one quote you cannot compare, from someone you cannot check.

From the other side, a good artisan in Casablanca has the opposite problem.
Their calendar is full in March and empty in August, and they have no way to
reach the customer two streets away who is looking for exactly what they do.

Khidma is a marketplace for that gap: customers post jobs, professionals reply
with quotes, and both sides carry a public track record.

## The model, and why this one

Two-sided marketplaces for services settle into one of three revenue models.

**Commission on the job.** The platform takes a cut of the work. This is the
model that fits marketplaces where the payment happens on the platform. It does
not fit here: most home-repair work in Morocco is settled in cash, directly,
often in instalments as the work progresses. A commission the platform cannot
observe is a commission the platform cannot collect, and trying to force
payments on-platform would push both sides to complete the deal off it.

**Pay per lead.** The professional buys each customer contact. Predictable for
the platform, unpredictable for a small business that cannot forecast its
monthly cost — and every unanswered lead feels like money burnt.

**Subscription with an included quota.** The professional pays a fixed monthly
amount and receives a number of leads with it. The cost is a budget line they
can plan around, and the quota keeps the platform from being flooded with
low-effort quotes. This is what Khidma does.

A credit is spent when a professional **sends a quote**, not when they view a
job. Browsing is free, so nobody is charged for a job that turns out to be a
poor fit, and the professional decides when to spend. If the customer cancels
before awarding the job, the credit is refunded — the lead never had a chance.
If the professional simply loses, the credit is gone: they got what they paid
for, which was the opportunity.

## Adapted to Morocco

**Sign-in is a phone number.** Email is a work tool here, not an identity.
Everyone has a mobile number, so the account is the number, verified by SMS.
The API accepts every way a Moroccan number gets written — `0612345678`,
`+212 6 12 34 56 78`, `00212612345678` — and stores one canonical form, so the
same person never ends up with two accounts.

**Trust is anchored to the ICE.** Every registered Moroccan business has an
Identifiant Commun de l'Entreprise: fifteen digits, public, checkable. A
professional supplies theirs and it appears on their profile, so a customer can
verify the business exists rather than trusting a badge the platform invented.
Auto-entrepreneurs, who may not have one, identify with their CIN instead.

**Prices are quoted excluding tax.** Moroccan businesses quote B2B prices
"hors taxes" and add 20% TVA at invoicing. The subscription screen leads with
the tax-exclusive price, the way a professional expects to read it, with the
tax-inclusive figure beneath so there is no surprise on the invoice.

**Trades match the local building stock.** Zellige and tadelakt are their own
category, not a footnote under tiling. So are terrace waterproofing, which
matters every winter, and traditional carved gebs. Riads are a property type
alongside apartments and villas.

**Three languages, and Arabic is not an afterthought.** French is the language
of business and the default. Arabic is a full right-to-left layout, not
translated strings poured into a left-to-right frame. English serves
expatriates, tourists and the owners of holiday properties. The language
switcher is the first control on the welcome screen, before any text the user
might not read.

## How a job flows

1. **A customer posts.** Five steps: trade, description with photos, location,
   timing, budget. The wizard shows typical prices for that trade so a first-
   time customer has some sense of the going rate.
2. **The job reaches professionals.** Only those whose trades and cities match.
   The top tiers see it first — that head start is what the higher plans sell —
   but it is capped at thirty minutes so an entry-tier artisan still arrives
   before the customer has decided.
3. **Professionals quote.** Each spends one credit. A job stops accepting
   quotes at six, which keeps the customer's decision manageable and stops
   later professionals from paying to join a queue they cannot win.
4. **The customer awards one.** Only then does the winning professional receive
   the street address and the phone number. Before that, they see the district
   and the city. This is deliberate: the customer's address is not the product.
5. **The work happens off-platform**, paid however the two parties agree.
6. **The customer marks it complete and reviews it.** Only the customer who
   awarded a completed job can review it, and only once. That constraint is the
   whole reason the ratings are worth reading.

## What is deliberately not here yet

- **Payments between customer and professional.** The money stays off-platform.
  Escrow is a different product and a different licence.
- **Instant booking.** Home repair is quoted, not priced from a menu. A
  "book now" button would misrepresent how this work is actually agreed.
- **Reviews of customers.** One-sided for now: professionals rating customers
  reads as retaliation against anyone who left an honest review.
