# Privacy notice — OUTLINE ONLY

> **This is deliberately an outline, not a draft.** A privacy notice must
> describe the processing that actually happens: the real processors, the real
> retention periods, the real transfers. None of that exists yet, because no
> store, ESP, 3PL or analytics account has been set up. Writing confident prose
> about processing that has not been configured would produce a document that is
> wrong in specifics while looking authoritative — the worst combination.

Fill this in **after** the stack is chosen, not before.

## Sections required

1. **Who we are.** `[LEGAL ENTITY]`, `[REGISTERED ADDRESS]`, `[KVK]`, contact.
   Whether a Data Protection Officer is required (likely not at this scale —
   confirm).

2. **What we collect, and why.** Split by activity, each with a lawful basis:

   | Activity | Data | Lawful basis |
   |---|---|---|
   | Fulfilling an order | Name, address, email, phone, order contents | Contract |
   | Payment | Handled by the provider; we do not store card data | Contract |
   | Sending order updates | Email, phone | Contract |
   | Marketing email | Email, engagement | Consent, or soft opt-in for existing customers — **confirm which, they differ** |
   | Analytics | Usage data | Consent |
   | Advertising measurement | Identifiers | Consent |
   | Fraud prevention | Order and device signals | Legitimate interests — **document the balancing test** |
   | Product safety and recalls | Order and batch records | Legal obligation (GPSR) |
   | Accounting | Invoices | Legal obligation |

3. **Who we share it with.** Every processor named, with country and safeguard:
   Shopify, the payment provider, the 3PL, the carrier, the ESP, analytics.
   **`[LIST CANNOT BE WRITTEN UNTIL THE STACK EXISTS]`**

4. **International transfers.** Which processors are outside the EEA and on what
   basis. Several likely will be — this section cannot be hand-waved.

5. **Retention.** A period *and a reason* for each category. Dutch tax law drives
   the invoice period; GPSR traceability drives batch records; marketing consent
   records have their own logic.

6. **Rights.** Access, rectification, erasure, restriction, portability,
   objection, withdrawing consent. How to exercise them and the response time.
   The right to complain to the Autoriteit Persoonsgegevens.

7. **Children.** The store is not directed at children.

8. **Changes.** How changes are notified and versioned.

## A note worth acting on

The other business in this repository already implements the difficult half of
this properly — recorded agreement with a version, a data export, an erasure
that anonymises rather than cascading deletes through years of invoices, and a
retention sweep driven by one list of periods-with-reasons.

That is the right pattern and it is worth copying: **the notice should be
generated from the same list the code enforces**, so a privacy statement cannot
promise a deletion the system does not perform.
