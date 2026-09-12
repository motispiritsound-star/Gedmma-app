# Customer service SOP — POLDER

Written 2026-09-12. Launch market is the Netherlands; Belgium follows.
Everything legal in here derives from `returns.md` and `gpsr-runbook.md` — if a template
and a policy disagree, **the policy wins and the template is a defect**. Report it.

**No service-level figure here is a measurement.** Response-time targets are chosen
policy (ASSUMPTION), set at what one founder can actually hold. Revise them against
measured volume after 60 days, not against ambition.

---

## 1. Channels, hours and response targets

| Channel | Use | First response target | Resolution target |
|---|---|---|---|
| Email (`support@`) | Everything | **1 working day** | 3 working days |
| `safety@` | Safety, injury, product failure | **Same working day, always** | Per `gpsr-runbook.md` §6c |
| WhatsApp / chat | Pre-purchase questions only | 1 working day | — |
| Phone | **Not offered at launch** | — | — |

Working days: Mon–Fri. **Publish the hours and the target, then hold them.** A published
"we answer within one working day" that is met is worth more than an unpublished promise
of an hour that is missed twice a week.

Rules:
- A **holding reply is a reply**: acknowledge, state what you are doing, state when you
  will come back. Never let a ticket sit unacknowledged past the target.
- **Safety wording in an inbound message overrides everything.** "Hurt", "injury",
  "fell", "cut", "rash", "broke while I was carrying it" — stop, do not send a standard
  template, go to `gpsr-runbook.md` §6b.
- **One person answers; every answer is logged with a reason code** (`returns.md` §5a).
  Support is the only sensor this business has.

---

## 2. Tone

Dutch directness. Plain language. Numbers instead of adjectives.

*(The amounts in the table below are illustrative tone examples, not POLDER prices — no price has been set. See `../strategy/business-case.md` §5.)*

| Do | Don't |
|---|---|
| "Je pakket is vandaag om 09:14 verzonden. Bezorging morgen." | "Your order is on its way and should arrive soon!" |
| "Dat klopt niet. Ik stuur vandaag een nieuwe." | "We're so sorry for any inconvenience this may have caused." |
| "Ik weet het niet. Ik zoek het uit en mail je morgen vóór 17:00." | "Let me look into that for you!" |
| "Je krijgt €74,90 terug op je rekening. Binnen 2 werkdagen." | "A refund has been initiated." |

Specifics:
- **Give a number or a date in the first two lines.** Amount, date, order number,
  tracking number. Not a paragraph of feeling.
- **One apology, at most, and only when POLDER is at fault.** Repeated apology reads as
  evasion in Dutch.
- **Say what you will do and by when.** Then do it a day early.
- **No exclamation marks. No emoji.** Not a style preference — they read as insincere
  when someone is annoyed.
- **Never blame the carrier, the 3PL or the supplier to the customer.** They bought from
  POLDER. Internally, name the cause precisely.
- **Dutch by default for NL customers**, English on request or if they wrote in English.
  Never machine-translate a safety instruction.
- Address the customer as **"je"** unless they write formally first, then **"u"**.

---

## 3. Templates

Placeholders in `[BRACKETS]`. Never send one with a bracket still in it.
Every template is a starting point — delete anything that does not apply. A template that
answers a question the customer did not ask makes them feel processed.

### 3.1 Where is my order

**NL**
> Onderwerp: Je bestelling [ORDERNR]
>
> Hoi [NAAM],
>
> Je bestelling is verzonden op [DATUM] om [TIJD]. Track & trace: [LINK]
> Verwachte bezorging: [DATUM RANGE].
>
> Als het pakket er op [DATUM+1] nog niet is, mail me dan — dan zet ik er een onderzoek op
> bij [VERVOERDER] en hoor je binnen 2 werkdagen wat er gebeurt.
>
> [NAAM], POLDER

**EN**
> Subject: Your order [ORDERNR]
>
> Hi [NAME],
>
> Your order shipped on [DATE] at [TIME]. Tracking: [LINK]
> Expected delivery: [DATE RANGE].
>
> If it hasn't arrived by [DATE+1], email me and I'll open a trace with [CARRIER]. You'll
> hear back within 2 working days.
>
> [NAME], POLDER

*If it has not shipped yet, say so and give the actual dispatch date. Never send tracking
for a label that has been created but not handed over — that is the single largest source
of "where is my order" follow-ups.*

### 3.2 Delayed shipment

**NL**
> Onderwerp: Je bestelling [ORDERNR] is vertraagd
>
> Hoi [NAAM],
>
> Je bestelling is niet op tijd verzonden. Dat had ik je moeten laten weten vóórdat je het
> zelf merkte.
>
> Wat er aan de hand is: [REDEN, feitelijk, één zin].
> Nieuwe verzenddatum: [DATUM]. Verwachte bezorging: [DATUM RANGE].
>
> Je hebt twee opties:
> 1. Wachten — ik vergoed de verzendkosten van €[BEDRAG].
> 2. Annuleren — je krijgt het volledige bedrag van €[BEDRAG] terug op je rekening,
>    binnen 2 werkdagen.
>
> Laat weten wat je wilt. Doe je niets, dan stuur ik hem op [DATUM].
>
> [NAAM], POLDER

**EN**
> Subject: Your order [ORDERNR] is delayed
>
> Hi [NAME],
>
> Your order didn't ship on time, and I should have told you before you noticed it
> yourself.
>
> What happened: [REASON, factual, one sentence].
> New dispatch date: [DATE]. Expected delivery: [DATE RANGE].
>
> Two options:
> 1. Wait — I'll refund the €[AMOUNT] shipping.
> 2. Cancel — full €[AMOUNT] back to your account within 2 working days.
>
> Tell me which. If I don't hear from you, I'll ship it on [DATE].
>
> [NAME], POLDER

### 3.3 Damaged item

**NL**
> Onderwerp: Beschadigd ontvangen — [ORDERNR]
>
> Hoi [NAAM],
>
> Vervelend. Dat lossen we op, en het kost je niets.
>
> Stuur me twee foto's: één van de schade en één van de verzenddoos zoals je hem
> ontvangen hebt. Daarna:
> - Nieuwe sturen: gaat vandaag of morgen de deur uit, verwachte bezorging [DATUM RANGE].
> - Of geld terug: €[BEDRAG] op je rekening binnen 2 werkdagen.
>
> Wat je liever wilt. Het beschadigde exemplaar hoef je [WEL/NIET] terug te sturen; als
> wel, stuur ik een gratis retourlabel.
>
> [NAAM], POLDER

**EN**
> Subject: Damaged on arrival — [ORDERNR]
>
> Hi [NAME],
>
> Not good. We'll fix it, and it costs you nothing.
>
> Send me two photos: one of the damage, one of the shipping box as it arrived. Then:
> - Replacement: ships today or tomorrow, expected [DATE RANGE].
> - Or refund: €[AMOUNT] back to your account within 2 working days.
>
> Your choice. You [do / don't] need to send the damaged one back; if you do, I'll email
> a free return label.
>
> [NAME], POLDER

*Photos are for the carrier claim and the technical file, not for deciding whether to
believe the customer. Never make the remedy conditional on receiving them.*
*If the damage is a component failure rather than transit damage → `gpsr-runbook.md` §6b
before replying.*

### 3.4 Wrong item

**NL**
> Onderwerp: Verkeerd artikel geleverd — [ORDERNR]
>
> Hoi [NAAM],
>
> Mijn fout. Je hebt [ONTVANGEN ARTIKEL] gekregen in plaats van [BESTELD ARTIKEL].
>
> De juiste [ARTIKEL] gaat vandaag de deur uit, verwachte bezorging [DATUM RANGE].
> In de bijlage een gratis retourlabel voor het verkeerde artikel. Geen haast — binnen
> 14 dagen is prima.
>
> Je hoeft niet te wachten met het openen van het nieuwe pakket tot je het oude hebt
> teruggestuurd.
>
> [NAAM], POLDER

**EN**
> Subject: Wrong item sent — [ORDERNR]
>
> Hi [NAME],
>
> My mistake. You received [ITEM RECEIVED] instead of [ITEM ORDERED].
>
> The correct [ITEM] ships today, expected [DATE RANGE]. Attached is a free return label
> for the wrong one — no rush, within 14 days is fine.
>
> You don't need to wait for the return to be processed.
>
> [NAME], POLDER

*Log as `R08` and take pick-accuracy to the 3PL monthly with a count (`fulfilment.md` §8).*

### 3.5 Return request (withdrawal)

**NL**
> Onderwerp: Retour [ORDERNR] — [RET-NUMMER]
>
> Hoi [NAAM],
>
> Prima, geen uitleg nodig. Je retournummer is [RET-NUMMER].
>
> Stuur terug naar:
> POLDER retouren, t.a.v. [RET-NUMMER]
> [3PL RETOURADRES]
>
> Verzendkosten retour zijn voor jou: ongeveer €[BEDRAG] bij [VERVOERDER].
> Zodra het pakket binnen is — of zodra je me een verzendbewijs stuurt — krijg je
> €[BEDRAG] terug op je rekening. Binnen 2 werkdagen, wettelijk uiterlijk 14 dagen.
>
> Dat bedrag is de productprijs plus de standaard verzendkosten die je bij de bestelling
> betaald hebt.
>
> [NAAM], POLDER

**EN**
> Subject: Return [ORDERNR] — [RET-NUMBER]
>
> Hi [NAME],
>
> Fine, no explanation needed. Your return number is [RET-NUMBER].
>
> Send it to:
> POLDER returns, ref [RET-NUMBER]
> [3PL RETURNS ADDRESS]
>
> Return postage is yours to pay: roughly €[AMOUNT] with [CARRIER].
> Once it arrives — or once you send me proof of postage — you'll get €[AMOUNT] back to
> your account. Within 2 working days; 14 days at the legal outside.
>
> That amount is the product price plus the standard delivery charge you paid.
>
> [NAME], POLDER

*The return-cost line is only lawful to charge if it was disclosed before purchase
(`returns.md` §2a). If it was not, delete the line and pay it. Do not improvise here.*
*Faulty item → this is not a withdrawal. Use §3.3 or a conformity reply; POLDER pays.*

### 3.6 Refund confirmation

**NL**
> Onderwerp: €[BEDRAG] terugbetaald — [ORDERNR]
>
> Hoi [NAAM],
>
> Je retour is binnen en verwerkt op [DATUM].
> Terugbetaald: €[BEDRAG] ([PRODUCT €X] + [VERZENDKOSTEN €Y]).
> Terug op: [BETAALMETHODE]. Meestal binnen 2 werkdagen zichtbaar, afhankelijk van je bank.
>
> Referentie: [REFUND ID].
>
> [NAAM], POLDER

**EN**
> Subject: €[AMOUNT] refunded — [ORDERNR]
>
> Hi [NAME],
>
> Your return arrived and was processed on [DATE].
> Refunded: €[AMOUNT] ([PRODUCT €X] + [SHIPPING €Y]).
> Back to: [PAYMENT METHOD]. Usually visible within 2 working days, depending on your bank.
>
> Reference: [REFUND ID].
>
> [NAME], POLDER

*If there is a diminished-value deduction, it must have been agreed **before** this email,
with a photograph (`returns.md` §2e). Never let a deduction first appear in the refund
confirmation.*

### 3.7 Cancellation (before dispatch)

**NL**
> Onderwerp: Bestelling [ORDERNR] geannuleerd
>
> Hoi [NAAM],
>
> Geannuleerd. De bestelling was nog niet verzonden, dus je hoeft niets te doen.
> €[BEDRAG] gaat terug naar [BETAALMETHODE], binnen 2 werkdagen.
>
> [NAAM], POLDER

**EN**
> Subject: Order [ORDERNR] cancelled
>
> Hi [NAME],
>
> Cancelled. It hadn't shipped, so there's nothing for you to do.
> €[AMOUNT] goes back to [PAYMENT METHOD] within 2 working days.
>
> [NAME], POLDER

*If it has already shipped, do not say "cancelled". Say it has shipped, and treat it as a
withdrawal (§3.5). Telling a customer something is cancelled when a parcel is in transit
creates a refused delivery and a dispute.*

### 3.8 Subscription pause / cancel

**NL**
> Onderwerp: Je grip-abonnement
>
> Hoi [NAAM],
>
> Gepauzeerd / Opgezegd per [DATUM]. Er wordt niets meer afgeschreven.
> Laatste levering: [DATUM]. Al betaald en nog niet verzonden: [JA/NEE].
>
> Pauzeren kan ook zelf, in je account: [LINK]. Je kunt elk moment weer starten; je oude
> interval van [X] weken staat bewaard.
>
> Als het te veel grips waren in plaats van te weinig: je kunt het interval verlengen naar
> [Y] weken in plaats van opzeggen. Aan jou.
>
> [NAAM], POLDER

**EN**
> Subject: Your grip subscription
>
> Hi [NAME],
>
> Paused / cancelled as of [DATE]. Nothing further will be charged.
> Last delivery: [DATE]. Already paid and not yet shipped: [YES/NO].
>
> You can also pause it yourself in your account: [LINK]. Restart any time — your
> [X]-week interval is saved.
>
> If it was too many grips rather than too few, you can stretch the interval to [Y] weeks
> instead of cancelling. Your call.
>
> [NAME], POLDER

*Confirm the cancellation **first**, then mention the alternative. Never withhold the
cancellation pending a reply, never ask "may I ask why" before confirming, and never make
the customer answer anything to cancel (`returns.md` §6).*

### 3.9 Product question (pre-purchase)

**NL**
> Onderwerp: Re: [VRAAG]
>
> Hoi [NAAM],
>
> [DIRECT ANTWOORD, één zin, met een getal of een maat erin.]
>
> [Eventueel: afmetingen binnenvak [X × Y × Z] cm, past een racket tot [N] cm.]
>
> Staat dat niet duidelijk op de pagina? Dan pas ik de pagina aan — dank voor de vraag.
>
> [NAAM], POLDER

**EN**
> Subject: Re: [QUESTION]
>
> Hi [NAME],
>
> [DIRECT ANSWER, one sentence, containing a number or a measurement.]
>
> [If relevant: inner compartment [X × Y × Z] cm, fits a racket up to [N] cm.]
>
> If that wasn't clear on the page, I'll fix the page — thanks for asking.
>
> [NAME], POLDER

*Two rules. **Answer with a measurement, not an adjective.** And **if you had to answer
it, the page is wrong** — fix the page the same week. This is the cheapest conversion work
available and it also cuts `R02`/`R05` returns.*
*Never answer a question about injury prevention, health, or performance. See §6.*

### 3.10 Complaint escalation

**NL**
> Onderwerp: Je klacht over [ORDERNR]
>
> Hoi [NAAM],
>
> Je hebt gelijk dat dit langer duurt dan het zou moeten. Ik pak het zelf op.
>
> Wat er is misgegaan: [FEITEN, geen excuses, maximaal drie zinnen].
> Wat ik nu doe: [ACTIE].
> Wanneer je van me hoort: [DATUM, vóór TIJD].
>
> Kom ik er niet uit, dan krijg je het volledige bedrag van €[BEDRAG] terug — daar hoef je
> niet om te vragen.
>
> Als je er met mij niet uitkomt, kun je terecht bij ConsuWijzer (ACM) of een
> geschillencommissie. Ik hoop dat het niet nodig is, maar je hoort het liever van mij dan
> dat je het moet opzoeken.
>
> [NAAM], POLDER

**EN**
> Subject: Your complaint about [ORDERNR]
>
> Hi [NAME],
>
> You're right that this is taking longer than it should. I'm handling it myself.
>
> What went wrong: [FACTS, no excuses, three sentences maximum].
> What I'm doing now: [ACTION].
> When you'll hear from me: [DATE, before TIME].
>
> If I can't resolve it, you get the full €[AMOUNT] back — you won't have to ask.
>
> If we can't reach agreement, you can go to ConsuWijzer (ACM) or a Dutch disputes
> committee. I'd rather you heard that from me than had to look it up.
>
> [NAME], POLDER

*★ REQUIRES PROFESSIONAL VERIFICATION: whether POLDER must join a specific Dutch
disputes scheme (e.g. via Thuiswinkel), and which body to name, is not verified here. The
correct body must be named on the site before this template is used. Confirm before
launch.*

### 3.11 Chargeback prevention — the proactive message

Send **before** the customer gets angry enough to call their bank. Triggers: any order
past its promised delivery window, any refund not completed within 5 working days of the
return arriving, any unanswered ticket over 3 days, any failed subscription charge.

**NL**
> Onderwerp: Even een update over [ORDERNR] — je hoeft niets te doen
>
> Hoi [NAAM],
>
> Ik zie dat je bestelling van [DATUM] nog niet is waar hij zou moeten zijn, en dat je nog
> niets van me gehoord hebt. Dat is niet goed.
>
> Stand van zaken: [FEIT].
> Wat ik doe: [ACTIE].
> Uiterlijk [DATUM] heb je óf je pakket, óf je geld terug (€[BEDRAG]). Geen voorwaarden.
>
> Je hoeft hier niets voor te doen en je hoeft je bank niet te bellen — ik regel het.
>
> [NAAM], POLDER

**EN**
> Subject: Update on [ORDERNR] — nothing needed from you
>
> Hi [NAME],
>
> Your order from [DATE] isn't where it should be, and you haven't heard from me. That's
> not good enough.
>
> Where it stands: [FACT].
> What I'm doing: [ACTION].
> By [DATE] you'll have either the parcel or your money back (€[AMOUNT]). No conditions.
>
> You don't need to do anything, and you don't need to call your bank — I'll sort it.
>
> [NAME], POLDER

---

## 4. Escalation

| Trigger | Goes to | Within |
|---|---|---|
| Any mention of injury, harm, rash, burn, fall, or a component breaking under load | Compliance role → `gpsr-runbook.md` §6 | **Immediately.** Do not reply with a template first |
| Two or more customers reporting the same failure on the same product | Compliance role | Same day |
| Customer names a regulator, ConsuWijzer, a lawyer, or the press | Founder, then counsel | Same day, before replying |
| Chargeback notified by the acquirer | Founder | Same day — evidence windows are short |
| Request exceeding published policy by more than €[LIMIT — set it, write it down] | Founder | 1 working day |
| Media, influencer or club-official enquiry | Founder | 1 working day |

**A person answering email never decides alone that a safety report is "nothing".**
(`gpsr-runbook.md` §6b.)

---

## 5. Chargeback prevention — the operational version

Chargebacks are almost never fraud at this scale; they are silence. The controls:

1. **Recognisable descriptor.** The statement text must read as POLDER, not as a payment
   processor or a legal entity name nobody recognises. Check it in the payment provider
   before the first live order.
2. **Answer within the published target.** An unanswered email is the leading indicator.
3. **Confirm every state change by email**: order placed, dispatched, delivered, return
   received, refunded, subscription renewing, subscription charged.
4. **Announce every subscription charge before it happens**, with date and amount and a
   one-click skip (`returns.md` §6).
5. **Refund fast.** The legal deadline is 14 days; POLDER's target is 2 working days. Most
   chargebacks happen in the gap between "I returned it" and "I got my money".
6. **Never let a promise slip silently.** Use §3.11 the moment a window is missed. A
   proactive, specific, no-conditions message converts a dispute into a wait.
7. **Keep the evidence**: tracking with proof of delivery, the order confirmation, the
   published policy as it stood on the order date, and the full email thread. Store per
   order so a dispute response takes ten minutes, not an afternoon.
8. **Never argue a chargeback you would have refunded anyway.** Refund, keep the customer,
   log the reason code.

---

## 6. What must never be said

These are not tone preferences. Each one creates a legal or compliance exposure.

**No health, injury or medical claim.** Not "prevents blisters", "protects your wrist",
"reduces injury", "better for your elbow", "antibacterial", "hygienic". Any such claim
widens the GPSR risk analysis, may pull the product toward a different regulatory regime,
and cannot be substantiated from the technical file.

**No performance claim.** Not "improves your grip/control/game", "play better", "more
power". There is no test behind it.

**No claim the technical file does not support.** If the file does not evidence it,
neither does the email. "Waterproof" and "water-resistant" are different words with
different consequences — use whichever the specification and test report actually say,
and use the same word the product page uses.

**No promise that contradicts published policy.** Not a longer return window than
published, not free return shipping when the policy says the customer pays, not a
guarantee period longer than published. If the policy is wrong, change the policy, then
answer. One improvised exception becomes the standard a future customer quotes back.

**No number that has not been verified.** Not delivery times, not stock counts, not
"most customers", not a percentage of anything. `../CLAUDE.md` non-negotiable 1 applies to
customer emails as much as to documents.

**No fabricated urgency or scarcity.** Not "last few left" unless inventory says so, not a
deadline that does not exist. Prohibited by the Omnibus rules and by `../CLAUDE.md`.

**No blaming a third party by name.** Not "DHL lost it", not "our warehouse messed up".
The customer's contract is with POLDER.

**No admission or denial of legal liability** in a safety matter. State facts, provide the
remedy, escalate. Counsel writes anything beyond that.

**No comparative claim about a named competitor** you cannot evidence.

**Nothing about another customer.** No order details, no "someone else had this too".

**No request to remove or change a review in exchange for anything.** Unlawful under the
Omnibus rules and unnecessary.

---

## 7. Weekly discipline — 30 minutes, Friday

1. Every ticket has a reason code (`returns.md` §5a). No blanks.
2. Any ticket open past target: why, and what changes so it does not recur.
3. Any question asked twice this week → fix the product page, the FAQ section, or the
   delivery promise. **Support volume that repeats is a content defect, not a staffing
   problem.**
4. Any safety-adjacent message this week, even one dismissed: re-read it cold. Second look
   at your own "No / No" decisions from `gpsr-runbook.md` §6b.
5. Update the template that was hardest to use this week.
