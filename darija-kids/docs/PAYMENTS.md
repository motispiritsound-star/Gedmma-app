# Het abonnement, en hoe het geld bij jou komt

De eerste **vijf units** zijn gratis en blijven gratis. De rest van de cursus
hoort bij **volledige toegang**: een paar dagen gratis proberen, daarna
**€ 6,45 per maand inclusief btw**, maandelijks opzegbaar. De betaling loopt
volledig via de App Store en Google Play — zij innen, zij rekenen de btw af,
zij houden de proefperiode bij, en zij storten maandelijks op jouw rekening.

> **Kort:** je maakt in beide winkels één abonnementsproduct aan met id
> `app.darijakids.monthly`, zet de prijs en de gratis periode, koppelt je
> bankrekening, en de winkels betalen uit wat er binnenkwam minus hun
> commissie.

## Twee dingen om te weten voor je begint

**1. De proefperiode is drie dagen.** Dat is ook het minimum van beide
winkels: Apple biedt als kortste gratis periode 3 dagen (daarna 1 week, 2
weken, 1 maand, …) en Google Play hanteert hetzelfde minimum, dus korter kan
sowieso niet. Het getal staat op één plek, `TRIAL_DAYS` in
`src/engine/billing.ts`, en moet gelijk zijn aan wat je in de winkels instelt.
Wil je later langer geven — een week doet het in dit soort apps vaak beter —
dan is dat één getal hier en één instelling daar. Helemaal geen proefperiode
kan ook: `TRIAL_DAYS` op 0, en de teksten passen zich aan.

**2. € 6,45 is bij Apple mogelijk niet exact instelbaar.** Apple werkt met
vaste prijspunten; ligt 6,45 er niet tussen, dan is **€ 6,49** de dichtstbijzijnde.
Google Play laat je wél een vrij bedrag per land invullen, dus daar kan 6,45
precies. Dit hoeft niets aan de app te veranderen: die toont altijd de prijs
die de winkel zelf teruggeeft, in de munt van de koper. Alleen de website valt
terug op `LIST_PRICE` in `src/engine/billing.ts` — pas dat aan als het 6,49
wordt.

## Wat er in de app al zit

- Het abonnementsproduct, de knop, de prijs uit de winkel, en de verplichte
  knoppen **Aankoop terugzetten** en **Abonnement beheren** (die laatste opent
  het opzegscherm van de winkel zelf).
- De **verplichte voorwaardentekst** vóór de aankoop, in vijf talen: hoe lang
  gratis, wat het daarna kost, dat het maandelijks doorloopt tot je opzegt, en
  dat opzeggen vóór het einde van de proefperiode niets kost.
- Een **ouderpoort**: een rekensom die een volwassene moet beantwoorden. Apple
  eist dat voor apps in de kindercategorie, en bij een doorlopend abonnement
  hoort het sowieso.
- Toegang die weer **dicht kan**: zegt de winkel dat het abonnement niet meer
  loopt, dan sluit de app de betaalde units weer af — maar nooit op een gok, en
  nooit zomaar omdat er even geen verbinding is.
- De grens tussen gratis en betaald staat op één plek: `FREE_UNITS` in
  `src/engine/store.ts`.

Wat er **niet** in zit: een eigen server die de bon narekent. Bij een
abonnement is dat een grotere beperking dan bij een eenmalige aankoop, want
verlengingen, opzeggingen en terugbetalingen gebeuren buiten de app om. De app
vertrouwt op wat de winkelbibliotheek lokaal ziet. Wil je het strak hebben —
en dat wil je zodra er echt geld omgaat — dan is
[RevenueCat](https://www.revenuecat.com) de gebruikelijke stap: gratis tot een
flinke maandomzet, en het regelt serverzijdige validatie en de status van elk
abonnement.

## Het product aanmaken

Gebruik in beide winkels **hetzelfde id**, anders werkt de code niet:

| | App Store Connect | Google Play Console |
|---|---|---|
| Waar | Jouw app → **Subscriptions** | Jouw app → **Producten → Abonnementen** |
| Eerst | maak een **subscription group** (bijv. "Darija Kids") | maak een abonnement met een **basisplan** |
| Product-id | `app.darijakids.monthly` | `app.darijakids.monthly` |
| Duur | 1 maand, automatisch verlengend | maandelijks, automatisch verlengend |
| Prijs | € 6,45 (of het dichtstbijzijnde prijspunt) | € 6,45 |
| Gratis periode | **Introductory Offer → Free Trial → 3 dagen** | **Aanbieding → Gratis proefperiode → 3 dagen** |
| Naam voor de koper | Volledige toegang | Volledige toegang |

Bij Apple hoort bij elk abonnement een schermafbeelding en een beschrijving;
die worden apart beoordeeld.

## Dat het geld op jouw rekening komt

### Apple

1. **App Store Connect → Business**: onderteken de **Paid Applications**-overeenkomst.
   Zonder die handtekening kun je niets verkopen.
2. **Bankgegevens** (IBAN op naam van de accounthouder) en **belastinggegevens**
   (voor Nederland het formulier W-8BEN of W-8BEN-E, plus je lokale gegevens).
3. Meld je aan voor het **App Store Small Business Program**: commissie **15%**
   in plaats van 30% zolang je onder $1 miljoen per jaar blijft. Los daarvan
   zakt de commissie op een abonnement na één onafgebroken jaar sowieso naar
   15% — maar het programma is sneller en simpeler.
4. Uitbetaling **maandelijks**, ongeveer 33 dagen na het einde van de maand,
   boven de drempel voor jouw land.

### Google

1. **Play Console → Instellingen → Betalingsprofiel** aanmaken of koppelen.
2. **Bankrekening** toevoegen en verifiëren, **belastinggegevens** invullen.
3. Commissie op abonnementen is **15%** vanaf de eerste maand.
4. Uitbetaling **maandelijks**, rond de 15e van de volgende maand.

### Btw en belasting

In de EU zijn Apple en Google voor digitale producten zelf de verkoper richting
de klant: zij rekenen de btw van het land van de koper en dragen die af. De
€ 6,45 die de klant ziet is dus inclusief btw, en jij ontvangt het bedrag ná
commissie en ná btw. Jij stuurt geen facturen naar kopers.

Wat je zelf moet regelen: die inkomsten zijn belastbaar, en omdat je met een
doorlopend abonnement een **handelaar** bent, vragen beide winkels sinds 2025
om handelaarsgegevens (naam, adres, telefoon, e-mail, inschrijvingsnummer) die
zichtbaar worden in de winkel. Voor Nederland betekent dat: **inschrijven bij
de KvK** vóór je publiceert, en dezelfde gegevens invullen in
`src/content/operator.ts` zodat ze ook in de app en de privacyverklaring
kloppen. Dit is geen belastingadvies — leg het voor aan je boekhouder voordat
de eerste uitbetaling binnenkomt.

## Wat een abonnement extra van je vraagt

Een doorlopende afschrijving bij een **kinder-app** wordt strenger bekeken dan
een eenmalige aankoop. Zorg dat dit klopt, want hierop worden apps afgewezen:

- De **prijs, de looptijd en de verlenging** staan vóór de aankoop in beeld —
  dat doet de app al, in vijf talen.
- Er staat een **ouderpoort** voor. Ook geregeld.
- Je **privacyverklaring en gebruiksvoorwaarden** zijn bereikbaar vanuit de
  winkelvermelding én vanuit de app. De privacyverklaring staat op `/privacy`;
  een pagina met gebruiksvoorwaarden (abonnementsduur, opzegging, restitutie)
  moet je nog schrijven — Apple vraagt daar expliciet naar bij abonnementen.
- **Opzeggen** kan vanuit de app in één tik, via de knop *Abonnement beheren*.
- In de winkelvermelding staat wat het kost; dat staat al in `store/`.

## Testen zonder echt te betalen

- **Apple**: App Store Connect → Users and Access → **Sandbox Testers**. In
  sandbox is een maand verkort tot enkele minuten, dus je ziet een verlenging
  en een opzegging binnen één sessie.
- **Google**: Play Console → **Licentietests** met je eigen account, in een
  interne testrelease. Ook daar lopen abonnementen versneld.

Test in elk geval: afsluiten met proefperiode, opzeggen tijdens de proefperiode
(er mag dan niets worden afgeschreven), verlengen, en opnieuw installeren met
**Aankoop terugzetten**.

## En de website?

Op de website kan niet betaald worden. De eerste units blijven daar gratis en
de pagina *Volledige toegang* legt uit dat het abonnement in de app loopt — met
de prijs erbij, zodat niemand voor een verrassing komt te staan.
