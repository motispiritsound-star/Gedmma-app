# Kortingscodes: wat kan er, en wat niet

Nagezocht op 13 oktober 2026 bij Apple en Google zelf. De regels verschillen
per winkel en op één punt zo hard dat het plan eromheen anders moet.

Alles hieronder gaat over de twee abonnementen: `app.darijaforkids.yearly` en
`app.darijaforkids.monthly`.

## De regel die het plan verandert

`docs/LANCERING.md` §8 gaat uit van **"een eigen kortingscode per school"** —
één woord, op een flyer, dat elk gezin van die school kan intypen.

**Dat kan bij Apple wel en bij Google niet.**

> "You can create only one promo code per subscription product. That is, you
> can create a promo code only for a single base plan or offer."
> — Google, *Promo codes*

Eén genoemde code per abonnement. Niet één per school: één, voor alles, voor
altijd. En er komt nog een beperking overheen:

> "Custom codes can be redeemed only from within your app, while one-time
> codes can be redeemed through both your app and the Play store."

Dus zelfs die ene genoemde code is op Android alleen ín de app in te wisselen,
en niet via een link op een flyer.

**De uitweg is niet één woord maar een stapel unieke codes.** Eén stapel per
school, elk gezin een eigen briefje. Dat werkt bij allebei de winkels
hetzelfde, het is via een link in te wisselen, en het meet beter: je ziet niet
alleen dát een school iets opleverde maar hoeveel van de vijftig briefjes
gebruikt zijn.

## Wat elke winkel geeft

| | Apple | Google |
|---|---|---|
| Hoe het heet | *offer codes* | *promo codes* |
| Unieke codes per kwartaal | 1 miljoen per app, over alle abonnementen | 10.000 per kwartaal **per abonnement** |
| Stapelgrootte | 500 tot 25.000 per keer | zelf te kiezen |
| Genoemde code ("MOSKEE…") | meerdere, 64 tekens | **één per abonnement**, en alleen ín de app |
| Geldig tot | unieke codes maximaal zes maanden | promotie maximaal een jaar |
| Actieve aanbiedingen | **maximaal 10 per abonnement tegelijk** | — |
| Restanten | vervallen | vervallen, gaan niet mee naar het volgende kwartaal |

Met 10.000 unieke codes per kwartaal per abonnement bij Google en een miljoen
bij Apple is de hoeveelheid nergens het probleem. **De tien actieve
aanbiedingen bij Apple wel**, als je per school een eigen aanbieding maakt:
dan kun je er tien tegelijk hebben per abonnement.

## Wat een code niet is

**Geen gratis abonnement.** Bij Google staat het er met zoveel woorden:

> "promotions offer free trials to subscriptions and not free subscriptions"

En:

> "After the user redeems the code, they still need to purchase the
> subscription with the code applied. A valid form of payment is required for
> the subscription, and the subscription will auto-renew at the end of the
> promo code free trial period."

Een code is dus **een langere gratis periode**, en daarna loopt het door
tenzij er opgezegd wordt. Dat moet je tegen een school eerlijk zeggen, en het
hoort op het briefje te staan: *drie maanden gratis, daarna € 6,99 per maand,
opzeggen kan altijd.* Doe je dat niet, dan is de eerste afschrijving een
verrassing — en dat is precies het soort verrassing waar een gemeenschap over
praat.

Het raakt ook `LANCERING.md` §8, "de app gratis voor de leraar". Dat kan bij
Google niet met een promotiecode; dat is een gratis periode en meer niet.

## En dit hoeft níét op 1.5 te wachten

De knop "Ik heb een code" komt in 1.5. Maar **unieke codes zijn ook zonder
die knop in te wisselen**, via een gewone link:

| | |
|---|---|
| Apple | `https://apps.apple.com/redeem?ctx=offercodes&id=6813964474&code=DECODE` |
| Google | `https://play.google.com/redeem?code=DECODE` |

Die link zet je op het briefje, of je stuurt hem door. De knop in de app maakt
het makkelijker en meetbaarder, maar hij is geen voorwaarde. **Een
schoolactie kan dus deze week beginnen.**

## Voordat je iets aanmaakt

Allebei de winkels laten je een aanmaakte aanbieding niet meer wijzigen:

> "Once you create an offer, you won't be able to edit it. If changes to
> customer eligibility are needed, create a new offer." — Apple

> "Once you create a promotion, you can't change the number of promo codes in
> that promotion, and you can't switch those promo codes to a different type."
> — Google

Dus staan hier de vier keuzes die je vooraf maakt, en niet halverwege het
scherm:

1. **Hoe lang gratis.** Drie maanden is lang genoeg om door de eerste twee
   units te komen en kort genoeg om in hetzelfde schooljaar te beslissen.
2. **Welk abonnement.** Zet de code op het **jaar**. Wie na drie maanden
   doorgaat voor € 59,99 is een betere klant dan wie per maand twijfelt, en
   het scheelt je de helft van het werk — een code per abonnement is een code
   per aanbieding.
3. **Wie hem mag gebruiken.** Alleen nieuwe abonnees. Bestaande abonnees een
   gratis periode geven is weggegeven geld, en bij Google kan het sowieso niet
   ("can be redeemed only by users who have not previously subscribed").
4. **Hoeveel per school.** Het aantal gezinnen plus een kwart. Codes die
   overblijven vervallen toch, en te weinig is een ouder die misgrijpt.

## De naamgeving, en waarom dat ertoe doet

Je maakt per school één aanbieding (Apple) of één promotie (Google), en de
naam daarvan is het enige wat je later terugziet in de rapportage. Kies dus
een naam waar de plaats in zit en de datum, niet "school1":

    DFK-2026Q4-<plaats>-<korte naam>

Geen namen van personen erin — dit staat straks in twee consoles en in je
eigen administratie.

## Waar het staat in de consoles

Eén aanwijzing per winkel, want de menu's veranderen vaker dan deze tekst.

**Apple** — App Store Connect → je app → **Subscriptions** → de
abonnementsgroep → het abonnement (`app.darijaforkids.yearly`) → tabblad
**Offer Codes**. Daar maak je een aanbieding en daarna een stapel codes. Op
2 oktober stond dat tabblad naast *Introductory Offers*, *Win-Back Offers* en
*Promotional Offers*; zie `docs/STAND.md`.

**Google** — Play Console → je app → **Monetize with Play** → **Promotions**
→ *Create promotion*. Kies **one-time use codes**, niet *custom code*: die
laatste kan er maar één zijn per abonnement en is alleen ín de app in te
wisselen.

Je krijgt in allebei de gevallen een lijst codes om te downloaden. Die lijst
is wat je naar de school stuurt, en hij hoort **niet in deze repository** —
het is een stapel waardebonnen.

## Een code voor een maker, met een percentage erop

Een andere vorm dan de schoolactie: iemand met bereik krijgt een eigen code op
zijn naam, en jij betaalt hem een deel van wat die code oplevert. Vier dingen
zitten daar anders in dan hierboven, en ze gaan allemaal mis als je ze niet
vooraf afspreekt.

**Een genoemde code kan bij Apple wel en bij Google maar één keer.** Apple
laat meerdere genoemde codes toe, in te wisselen via de redeem-link hierboven
— dus in een bio, onder een filmpje, overal. Google geeft er **één per
abonnement**, en die is alleen ín de app in te wisselen. Sinds 1.5 staat de
knop *"Ik heb een code"* bij het abonnement, dus die weg bestaat nu, maar het
blijft: installeren, openen, knop zoeken, typen. Reken erop dat de Android-kant
een fractie oplevert van de iOS-kant, en dat dat niets zegt over de maker.

En let op wat je uitgeeft: je hébt er maar twee, één op het jaar en één op de
maand. Geef je ze allebei weg, dan is er voor de volgende nooit meer een
genoemde code op Android.

**Een inwisseling is nog geen betaling.** Een code is een gratis periode; de
winkel schrijft pas af als die afloopt. Wie op dag één inwisselt met een maand
gratis, is pas over een maand een betalende klant — en een deel haakt
daarvoor af. Je kunt dus niet uitbetalen op inwisselingen, alleen op
omzettingen, en die lopen weken achter. Spreek af dat er per kwartaal wordt
afgerekend over wat er in dat kwartaal werkelijk betaald is.

**Tien procent waarvan.** Dit is het punt waar de meeste afspraken scheef
lopen. Van € 59,99 blijft na btw en de commissie van de winkel ongeveer
€ 42,14 over.

| | Jaar € 59,99 | Maand € 6,99 |
|---|---|---|
| Netto voor jou | € 42,14 | € 4,91 |
| 10% van de winkelprijs | € 6,00 — dat is **14,2%** van je netto | € 0,70 |
| 10% van je netto | € 4,21 | € 0,49 |

Zet in de afspraak dus **tien procent van wat de winkel uitbetaalt**, niet van
de prijs op de schap. En zet erbij of het de eerste betaalde periode geldt of
ook de verlengingen; laat je dat open, dan is het stilzwijgend voor altijd.

**Uitbetalen gaat op factuur.** Je betaalt een persoon voor een prestatie. Met
een factuur van zijn onderneming is het een gewone inkoopfactuur; zonder die
factuur is het in Nederland rommelig en kan het als loon of als resultaat uit
overige werkzaamheden worden gezien. Vraag de factuur dus vooraf, en zet de
afspraak op één A4: de code, het percentage, waarvan, hoe lang, per wanneer
afgerekend, en wie de cijfers aanlevert (jij, uit de twee consoles).

**Wat je kunt meten.** Allebei de consoles rapporteren hoe vaak een code is
ingewisseld, per aanbieding. Maak voor deze maker daarom een **eigen
aanbieding** aan en hang de code daar alleen aan, anders loopt hij door je
schoolacties heen en is er niets meer uit elkaar te halen. Hoe fijnmazig de
koppeling van inwisseling naar bétaalde omzetting is, verschilt per console en
is hier niet nagemeten — kijk dat na zodra er een eerste inwisseling in staat,
vóórdat je het eerste bedrag overmaakt.

**En het alternatief, als je niets weg wilt geven.** Allebei de winkels kennen
campagnelinks (Apple: App Analytics-campagnes, Google: de URL-bouwer). Die
meten wie er via wie binnenkomt zonder dat er een gratis periode tegenover
staat. Het mist wat een code wél heeft — een naam, iets om te noemen, een
reden om er nú op te klikken — maar het kost je niets.

**Geen namen van personen in dit bestand.** Dezelfde reden als bij de
schoolacties: dit staat in twee consoles en in je administratie. In je eigen
boekhouding hoort de naam wel.

## Bronnen

- [Apple, *Set up subscription offer codes*](https://developer.apple.com/help/app-store-connect/manage-subscriptions/set-up-subscription-offer-codes)
- [Google, *Promo codes*](https://developer.android.com/google/play/billing/promo)
- [Google, *Create promotions*](https://support.google.com/googleplay/android-developer/answer/6321495)
