# Privacy, the AVG, and what is not a programming task

This is the internal companion to the published privacy statement. It holds the
processing register the law expects you to keep, and — more usefully — an honest
list of what the code cannot do for you.

**Nobody here is a lawyer.** Everything below is written from the text of the
GDPR, the Dutch UAVG and the guidance the Autoriteit Persoonsgegevens publishes.
Before Buurklus takes its first real user, a Dutch jurist has to read the
published documents and this register. Budget a few hundred euro for it; it is
the cheapest part of the whole undertaking and the only part that actually
covers you.

## Where things live

| What | Where |
|------|-------|
| Versions, retention periods, minimum age, operator details | `packages/shared/src/legal.ts` |
| Published documents, both languages | `apps/web/src/legal/nl.ts`, `apps/web/src/legal/en.ts` |
| Agreement records, export, erasure, retention sweep | `apps/api/src/services/privacy.service.ts` |
| The endpoints behind the rights | `apps/api/src/routes/privacy.routes.ts` |
| The nightly job | `apps/api/src/scripts/retention.ts`, `node --run retention` |

The retention table on the website is generated from `RETENTION` in
`legal.ts`, and the sweep reads the same list. That is deliberate: a privacy
statement promising a deletion nobody implemented is the most common way a
small platform ends up in trouble, and here it cannot happen without someone
editing one file and ignoring a failing test.

## Register of processing activities (Article 30)

Article 30(5) exempts organisations under 250 people — but only if the
processing is occasional, carries no risk, and includes no special categories.
A marketplace processes personal data continuously and structurally, so the
exemption does not apply. Keep this register, and keep it current.

### 1. Account and authentication

- **Purpose:** letting someone sign in and be recognised, without a password.
- **Data subjects:** household customers, tradespeople.
- **Categories:** mobile number, name, email address, language, avatar, sign-in
  codes (hashed), sessions (hashed), device tokens, last seen.
- **Lawful basis:** Article 6(1)(b), performance of the contract.
- **Recipients:** SMS provider (sign-in codes), Apple and Google (push tokens).
- **Retention:** account for as long as it exists, then erased on request or
  after three years of inactivity; codes 1 day; expired sessions 30 days.
- **Third country:** push notifications reach the United States, under the
  European Commission's standard contractual clauses.

### 2. Publishing and matching jobs

- **Purpose:** showing a job to tradespeople who cover that trade and that
  municipality, so they can quote.
- **Data subjects:** household customers.
- **Categories:** job description, photos, municipality, district, street
  address, coordinates, property type, budget, timing, contact phone.
- **Lawful basis:** Article 6(1)(b).
- **Recipients:** tradespeople whose trades and coverage match. The street
  address and phone number are withheld until the customer awards the job —
  enforced in the API, not by a convention.
- **Retention:** two years after the job closes, then stripped to category,
  municipality and dates.

### 3. Quotes, conversations and awarding

- **Purpose:** letting the two sides agree on the work.
- **Data subjects:** customers and tradespeople.
- **Categories:** quote amounts and text, messages, read state, timestamps.
- **Lawful basis:** Article 6(1)(b).
- **Recipients:** the other party to that conversation only.
- **Retention:** as the job, two years after it closes.

### 4. Professional profiles and verification

- **Purpose:** showing a customer who they are dealing with, and checking that
  the business is registered.
- **Data subjects:** tradespeople (a zzp'er's KvK number is personal data).
- **Categories:** business name, legal form, bio, KvK number, VAT id, IBAN,
  coverage, logo, portfolio, verification documents.
- **Lawful basis:** Article 6(1)(b), and Article 6(1)(c) for the identifiers
  needed on an invoice.
- **Recipients:** customers see the public part; verification documents are
  internal.
- **Retention:** as the account. Invoicing identifiers are frozen onto the
  invoice and follow the seven-year rule.

### 5. Reviews

- **Purpose:** letting customers judge a tradesperson on evidence.
- **Data subjects:** customers who write them, tradespeople they describe.
- **Categories:** rating, sub-ratings, comment, right of reply.
- **Lawful basis:** Article 6(1)(b), and legitimate interest under Article
  6(1)(f) for keeping the rating after the author's account is erased. That
  balancing test is written out under "The awkward parts" below.
- **Retention:** indefinite as an anonymised rating; the comment text is erased
  with the author's account.

### 6. Subscriptions, invoices and payments

- **Purpose:** billing for the service. **Currently dormant:** Buurklus is free
  and no invoice is raised.
- **Data subjects:** tradespeople.
- **Categories:** plan, credits ledger, invoice reference, amounts, VAT, method,
  gateway reference, billing snapshot.
- **Lawful basis:** Article 6(1)(b) for the subscription, Article 6(1)(c) for
  keeping the invoice.
- **Recipients:** payment provider, accountant, Belastingdienst on request.
- **Retention:** seven years (Article 52 AWR). Not erasable on request, which
  Article 17(3)(b) permits.

### 7. Agreement records

- **Purpose:** being able to demonstrate what someone agreed to and when.
- **Categories:** document, version, timestamp, IP address, user agent.
- **Lawful basis:** Article 7(1) obliges the controller to be able to
  demonstrate this; the IP address rests on legitimate interest, which is
  evidential value in a dispute about whether an agreement was made.
- **Retention:** seven years, matching the limitation period for a claim under
  the agreement.

### 8. The waiting list

- **Purpose:** telling someone when Buurklus opens in their municipality, and
  knowing beforehand whether both sides of the marketplace are there. A
  marketplace that opens with customers and no tradespeople fails on its first
  day, so this is not a mailing list dressed up as a product decision — it is
  the product decision.
- **Data subjects:** people who filled in the registration form on the website.
  Not account holders: there is no account.
- **Categories:** email address, optional phone number, name or business name,
  municipality, trades, KvK number, language, consent timestamp, IP address.
- **Lawful basis:** Article 6(1)(a) consent. An address collected in order to
  email it later is the textbook case, and the tick box is unticked, explicit
  and separate from everything else on the form.
- **Recipients:** nobody. This list is not shared, sold or exported.
- **Retention:** deleted two years after the person was told the platform is
  open to them, or 30 days after they unsubscribe. The clock starts at the
  invitation rather than at sign-up, because an address collected two years ago
  and never used is exactly what storage limitation is about.
- **Note:** the form carries a honeypot field. A request that fills it in is
  dropped and nothing is stored, so a bot leaves no personal data behind either.

### 9. Notifications

- **Purpose:** telling someone a quote arrived or a message is waiting.
- **Categories:** rendered title and body, deep link, read state.
- **Lawful basis:** Article 6(1)(b). Marketing messages, and only those, rest on
  Article 6(1)(a) consent.
- **Recipients:** Apple, Google.
- **Retention:** 90 days. The dormant-account warning is exempt, because it is
  the evidence that someone was told before their account was erased.

## The awkward parts, written out rather than hidden

**Keeping a rating after erasure.** When a customer erases their account, the
star rating survives and the words do not. This is a legitimate-interest
balancing test under Article 6(1)(f), and it goes like this. The interest: a
reputation system where a departing customer can retract their rating is a
reputation system a tradesperson can game by asking unhappy customers to leave.
Necessity: no less intrusive option achieves it — the rating is the minimum, and
the name and the text are dropped. Balance: what remains is a number attached to
nobody, and the person's own comment, which is the part that could identify
them, is gone. That reasoning is what an authority will ask for; keep it.

**The IP address on an agreement record.** Also legitimate interest. It exists
because "I never accepted those terms" is a real thing people say, and without
it there is nothing to answer with. It is not used for anything else, and it
follows the same seven-year clock as the agreement.

**Erasure is anonymisation.** The user row survives, emptied. Say so in the
privacy statement — it does — because a person who asks for deletion and later
discovers a row with their id still exists will reasonably feel misled, even
where the law permits it.

**Push notifications leave the EU.** Apple and Google are the only route to a
phone's notification centre; there is no European alternative. The transfer
rests on the standard contractual clauses. Someone who objects can turn push
off and keep using the app, which is why the statement says exactly that.

## What is not a programming task

Nothing below can be closed by writing code. Every one of them is real.

1. **Register a company.** An eenmanszaak or a BV with the KvK. Until then
   `OPERATOR` in `legal.ts` is null, and every legal page carries a visible
   "not finished yet" box naming what is missing. That box is doing its job:
   do not remove it, fill the fields in.

2. **Get a contact address that reaches you.** A privacy statement has to name
   somewhere a person can write. A PO box or a business address; a Gmail
   address on a published statement reads as an amateur operation, fairly.

3. **Sign a data processing agreement with every processor.** Article 28
   requires one per processor, and there is no processing without it. That is
   the hosting provider, the SMS provider, and the payment provider when
   subscriptions start. Apple and Google publish theirs; you accept them as
   part of the developer terms, and you should read what you accepted.

4. **Decide whether you need a DPIA.** Article 35. A marketplace at this scale
   probably does not: no special categories, no systematic monitoring, no
   scoring of people. Write down the reasoning and the date anyway. "We
   considered it and here is why not" is an answer; silence is not.

5. **Write a data breach procedure.** Article 33 gives you 72 hours to report a
   breach to the Autoriteit Persoonsgegevens. Three hours of thinking now — who
   decides, who writes the report, what you tell users — is worth more than
   three days of panic later. Keep a log of breaches, including the ones you
   decide not to report.

6. **Appoint someone who answers.** Not a formal DPO — a platform this size
   almost certainly needs none — but somebody whose job it is to answer a data
   request within the month Article 12(3) allows. Right now that is you.

7. **Have a jurist read the published documents.** Terms of use, privacy
   statement, disclaimer, cookie statement. The texts in `apps/web/src/legal/`
   are written to be honest and readable, and they are not a substitute for
   someone who does this for a living. Ask them specifically about: the
   liability cap, the platform's position as a non-party to the work, the
   review policy, and the free-now-paid-later clause.

8. **Sort out consumer law.** Customers on Buurklus are consumers. Distance
   selling rules, the right of withdrawal, the requirements for terms and
   conditions to be validly incorporated (Article 6:233 and 6:234 BW: the
   customer has to be able to save them before agreeing — which the sign-up
   screen does, by linking to them). Ask the same jurist.

9. **Set up the nightly retention job.** `node --run retention`, on a schedule,
   in the deployment. The code is written and tested; a cron entry that does not
   exist deletes nothing, and the privacy statement will be promising something
   that is not happening.

10. **Check the age question honestly.** The platform asks a person to confirm
    they are 16 and does not verify it. The privacy statement says so. If you
    ever start verifying, say that too — and think about what you would be
    collecting in order to do it.

## Before the first real user

A short list, in order:

- [ ] Company registered, `OPERATOR` filled in, the amber box gone from the pages
- [ ] Processing agreements signed with hosting and SMS
- [ ] Retention job scheduled and its first run checked
- [ ] Breach procedure written down, with names and phone numbers
- [ ] DPIA decision recorded, either way
- [ ] Jurist has read the four published documents
- [ ] A test run of a data request: export it, erase it, look at what is left
- [ ] A way for someone on the waiting list to get off it without emailing a
      person: the endpoint exists, a link in the mail does not yet
