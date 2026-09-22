# Betalen op de website

Hoe iemand in Nederland, Frankrijk of Duitsland een boek van je koopt zonder
dat jij er werk aan hebt — en waarom de voor de hand liggende weg de duurste
is.

## 1. Eerst het misverstand

**Je kunt iDEAL niet rechtstreeks aan je Knab-rekening koppelen.** Zo werkt
iDEAL niet. iDEAL is geen dienst die een bank aan een webshop levert; het is
een afspraak tussen banken die je alleen kunt gebruiken via een
betaaldienstverlener — Mollie, Stripe, Adyen, Buckaroo. Je Knab-rekening is
alleen de plek waar het geld uiteindelijk binnenkomt.

Dat geldt net zo voor Apple Pay. Apple Pay is geen betaalmethode die jij
aanzet; het is een knop die bovenop de afrekening van je betaaldienst zit.

Dus de vraag is niet *"welke bank"* maar **"wie is de verkoper"**. En daar
zit het geld en het werk.

## 2. En dan het addertje: btw

Verkoop je een **PDF** aan een ouder in Frankrijk, dan moet daar **Franse btw**
over betaald worden. Niet Nederlandse. Datzelfde geldt voor Duitsland, Spanje,
Italië, België — elk land zijn eigen tarief, en jij draagt het af.

Dat kan via de **OSS-regeling** van de Belastingdienst: één aangifte per
kwartaal voor alle EU-landen samen. Het is te doen, maar het is elk kwartaal
werk, je moet je ervoor aanmelden, en je moet per verkoop bijhouden waar de
koper zat.

Fysieke boeken vallen hier trouwens buiten: die gaan onder de gewone regels,
en een drukker-op-bestelling regelt de verzending.

## 3. De twee wegen

### Weg A — je bent zelf de verkoper (Mollie of Stripe)

| | |
|---|---|
| Kosten | ± € 0,29 per iDEAL-transactie (Mollie), of ± 1,5 % + € 0,25 (kaart) |
| Betaalmethoden | iDEAL, kaart, Apple Pay, Bancontact, PayPal, SEPA |
| Uitbetaling | rechtstreeks naar je Knab-rekening |
| Jij regelt | btw in elk land (OSS), facturen, terugbetalingen, en het bezorgen van het bestand |
| Bouwwerk | een afrekenpagina en een downloadlink die niet door te sturen is |

Goedkoop per transactie, en duur in tijd. Bij tien boeken per maand ben je
meer kwijt aan administratie dan je verdient.

### Weg B — iemand anders is de verkoper (aanrader)

Bij een **merchant of record** — Paddle, Lemon Squeezy, Gumroad — verkoopt dát
bedrijf aan de klant, en ben jij hun leverancier.

| | |
|---|---|
| Kosten | ± 5 % + € 0,50 (Paddle, Lemon Squeezy) tot 10 % (Gumroad) |
| Betaalmethoden | iDEAL, kaart, Apple Pay, PayPal, Bancontact — in elk land wat daar gebruikt wordt |
| Uitbetaling | maandelijks naar je Knab-rekening |
| Zij regelen | **btw in alle landen**, de afrekenpagina, het bestand leveren, terugbetalingen, fraude |
| Jij regelt | het bestand uploaden en de link kopiëren |

Je betaalt dus een paar procent om nooit meer aan btw te hoeven denken. Bij
deze omvang is dat de goedkoopste boekhouder die er bestaat.

**Let op drie dingen bij het kiezen:**

1. **Staat iDEAL erbij?** In Nederland betaalt de meerderheid ermee. Een
   afrekenpagina zonder iDEAL kost je Nederlandse verkopen, hoe mooi hij ook is.
2. Op het bonnetje van de klant staat de naam van die partij, niet die van
   jou. Dat mag, maar weet het.
3. Ze doen **alleen digitale producten**. Gedrukte boeken gaan via een
   drukker-op-bestelling met zijn eigen afrekening.

## 4. Wat ik zou doen, en in welke volgorde

**Deze week — het e-boek dat al af is.**
`npm run ebook` maakt hem in zes talen en ze staan in `public/ebook/`. Dat is
een product dat vandaag verkocht kan worden:

1. Maak een account bij een merchant of record
2. Upload `darijaforkids-nl.pdf` en de vijf andere talen als één product
3. Prijs € 14,99, dezelfde als in de app
4. Zet iDEAL, kaart en Apple Pay aan
5. Kopieer de afrekenlink

**Daarna: de link in de site.** Zet hem in `src/site/shop.ts`:

```ts
ebook: { prijs: '€ 14,99', link: 'https://…' },
```

Meer is het niet. De boekenpagina laat vanzelf een koopknop zien in plaats van
"in de maak", in alle zes de talen. Zolang de link leeg is, verandert er
niets — dus je kunt hem alvast neerzetten.

**Later: de prentenboeken.** Zelfde weg. Los deel € 12,95, de vijf samen
€ 49,95. Die staan al in `shop.ts` klaar.

## 5. En de app dan?

Het e-boek staat óók in de app, als `app.darijaforkids.ebook` voor € 14,99.
Daar houden Apple en Google 15 % in en regelen zij alles — btw inbegrepen.

Dat is geen dubbelop maar een keuze voor de koper: wie de app al heeft, koopt
het daar in twee tikken. Wie van je website of van Instagram komt, koopt het
bij de afrekenpagina.

Eén regel om aan te houden: **link vanuit de app niet naar je eigen
afrekenpagina voor iets wat je in de app ook verkoopt.** Dat is precies waar
Apple en Google over vallen. Andersom — vanaf je website, je socials en je
WhatsApp-kanaal naar de afrekenpagina — mag altijd.
