# Het abonnement, en hoe het geld bij jou komt

De app is **gratis te downloaden**; de cursus is een **abonnement**, en dat
wordt op het eerste scherm gevraagd. Er zijn geen gratis lessen en geen
proefperiode: na het betalen staat alles in één keer open. Wie de app vóór
23 november 2026 had en lessen afrondde, houdt precies die afgeronde lessen
open — zie de aantekening boven `magLeren` in `src/engine/store.ts`.

Het abonnement kost **€ 59,99 voor een jaar vooruit (€ 5,00 per maand) of
€ 6,99 per maand**, inclusief btw en altijd opzegbaar. Op het jaar komt een
tijdelijke actie van 50%: **€ 29,99 voor het eerste jaar** (€ 2,50 per maand),
voor de campagne op de Franse, Nederlandse en Duitse Facebook-pagina's.
Daarnaast staat er één ding los te koop: het **e-boek** voor **€ 14,99
eenmalig** — bij het jaarabonnement zit het erbij.

De betaling loopt volledig via de App Store en Google Play — zij innen, zij
rekenen de btw af, en zij storten maandelijks op jouw rekening.

> **Kort:** je maakt in beide winkels twee abonnementsproducten aan —
> `app.darijaforkids.yearly` en `app.darijaforkids.monthly` — in dezelfde
> abonnementsgroep, plus één eenmalig product `app.darijaforkids.ebook`, zet de
> prijzen, zet de proefaanbieding uit en de actie op het jaar aan, koppelt je
> bankrekening, en de winkels betalen uit wat er binnenkwam minus hun
> commissie.

## Twee dingen om te weten voor je begint

**1. Er is geen proefperiode.** De drie gratis dagen gaan op 23 november uit
het aanbod: wie het abonnement neemt, betaalt bij het afsluiten. Opzeggen kan
nog altijd en dan loopt de betaalde periode af — dat is de winkel en dat
verandert niet.

**Maar het staat nog niet in de consoles.** Het besluit is genomen en de app is
erop gebouwd; de twee aanbiedingen zijn nog niet uitgezet. Zolang ze aan staan
geeft de winkel die drie dagen nog wél, en leest de koper ze ook in het
aankoopvenster. De tabel hieronder is dus geen naslag maar werk dat nog gedaan
moet worden — `docs/GO-LIVE.md` zet het als stap 0, vóór de campagne, omdat de
€ 29,99 bij Apple de plek van de proef nodig heeft.

De app leest dat niet uit een getal in de code maar uit wat de winkel
teruggeeft (`heeftProef` in `src/engine/billing.ts`, per plan in
`billing.proef`): een abonnement zonder aanbieding heeft één prijsfase, een
abonnement mét proefperiode heeft er meer en de eerste kost niets. Onbekend
telt als géén proef — beloof niets wat je niet weet. De teksten hebben in alle
zes de talen een tak voor nul dagen, dus **de app klapt om op het moment dat
de aanbieding uit de console gaat; er hoeft geen nieuwe build naartoe.**
`TRIAL_DAYS` is daarmee geen belofte meer maar bewoording — zo staat het ook
bij die constante zelf. Het getal vult de tekst alleen in zodra de winkel
déze koper wél een proef aanbiedt, en het is de wachttijd voor het e-boek
(punt 1c). Biedt de winkel niets aan, dan komt het nergens op het scherm.

Wat er in de twee consoles voor moet gebeuren, en waarvoor geen commando
bestaat — Apple's API kent abonnementsaanbiedingen wel, maar daarvoor moet er
eerst een ASC-API-sleutel op de schijf staan, en dat is meer werk dan de twee
klikken:

| Waar | Wat |
|---|---|
| **App Store Connect** | het abonnement → **View all Subscription Pricing** → tabblad **Introductory Offers**: zet een einddatum op de regel *Free for the first 3 days*. Bij **beide** abonnementen: `app.darijaforkids.yearly` én `app.darijaforkids.monthly`. |
| **Play Console** | het abonnement → basisplan → de aanbieding: deactiveer `proef-jaar` bij `app.darijaforkids.yearly` en `proef-maand` bij `app.darijaforkids.monthly`. |

Bij Apple geldt **één introductieaanbieding per abonnement per land**, en een
nieuwe overschrijft de bestaande. Komt de actie van 50% op het jaar er als
*Pay Up Front* introductieaanbieding, dan vervangt die de proefperiode in één
handeling — dan hoeft er bij Jaar niets apart uit. Bij Maand wel.

Controleer het daarna op het aankoopvenster zelf, op een telefoon, in de app
uit de winkel. Dat venster is het enige echte bewijs: de console zegt wat er
ingesteld is, niet wat de koper leest.

**1b. De proef liep via de winkel, niet via de app.**

> **Achterhaald op 23 november.** Er is geen proefperiode meer — zie punt 1,
> en voor het gratis deel de aantekening boven `magLeren` in
> `src/engine/store.ts`. De afweging hieronder is die van toen, en ze blijft
> staan om twee redenen: ze verklaart waarom de app zelf nooit dagen telt (en
> dus waarom hij omklapt zodra de winkel iets anders zegt), en ze is het
> antwoord als er ooit weer een proefperiode in het aanbod komt.

Er zijn twee manieren om drie dagen gratis te geven, en het verschil is groter
dan het lijkt.

De ene is dat de **app** zelf drie dagen meetelt en daarna dichtgaat. Die weg
is hier afgevallen, om twee redenen. Hij is niet te handhaven: deze app heeft
geen server die bonnen narekent, dus "drie dagen" woont in de telefoon van de
gebruiker — wissen en opnieuw installeren geeft nieuwe drie dagen, en dat
kost je elke gebruiker die het één keer doorheeft. En hij converteert slecht:
na die drie dagen staat de koper voor een koude aankoopbeslissing, zonder dat
er ooit een pas is gekoppeld.

De andere is dat de **winkel** de proef bijhoudt: de koper sluit het
abonnement af, bevestigt met Face ID, en de eerste drie dagen zijn gratis.
Dat is wat hier gebouwd is. De winkel houdt de datum bij, stuurt zelf de
herinnering vóór de eerste afschrijving, int, rekent de btw af en doet de
terugbetalingen. De koper die niets doet, wordt op dag vier belast; wie
opzegt binnen drie dagen betaalt niets.

Het verschil in opbrengst zit in één woord: bij de app-weg moet de koper ná
de proef nog *ja* zeggen, bij de winkel-weg moet hij *nee* zeggen. Dat is
dezelfde proefperiode en een heel ander aantal betalende gebruikers.

En de drempel die hier eerder voor stond — acht lessen gratis, voorgoed,
zonder pas en zonder e-mailadres — staat er niet meer. Het waren er vier toen
deze afweging werd opgeschreven; op 12 november werden het acht, en op
23 november nul. Er is nu één drempel en die staat op het eerste scherm:
downloaden is gratis, de cursus is het abonnement. Twee stappen dus in plaats
van drie, en de tweede is de enige die een winkelproduct nodig heeft.

**1c. Het e-boek komt vrij zodra er betaald is.** Het boek zit bij het
jaarabonnement, en het is een pdf: wie hem één keer opent, houdt hem. Zonder
proefperiode is er bij het afsluiten ook echt afgeschreven, en geeft
`grantEbook()` het boek meteen vrij: het kijkt naar de aankoop zelf — een
bestelling waar geen proeffase bij zat — en niet naar een datum.

De grens die daar eerst voor stond blijft in de code, want de winkel kan nog
altijd een proefperiode meegeven: een aanbieding die terugkomt, of een oude
aankoop die wordt teruggezet en waarbij we niets weten. Zonder die grens kon
iemand het jaar afsluiten, het boek opslaan en op dag twee opzeggen — nul
betaald, een product van € 14,99 mee.

**Een datum alleen is niet genoeg**, en dat was de eerste reparatie wél. Wie
op dag twee opzegde en op dag vier terugkwam, had een datum die voorbij was en
kreeg het boek alsnog. Een datum zegt dat er tijd verstreken is, niet dat er
betaald is.

Daarom twee velden. `ebookVanaf` is de **toezegging**: de dag waarop het boek
mág opengaan. `ebook` is het **boek**, en dat komt er alleen als die dag
voorbij is én de winkel op dat moment nog zegt dat het abonnement loopt. Dat
keuren gebeurt in `keurEbook()`, dat draait zodra de winkel iets zegt — na
`syncFromStore`, zodat het kijkt naar het antwoord van nu en niet dat van
gisteren.

Eenmaal open blijft het open, ook als het abonnement later afloopt. Dat is wat
`boek.vanJou` op het scherm belooft, en het is het enige deel van deze regeling
dat nooit terug mag kunnen.

Los gekocht gaat er geen proef overheen, dus dat geeft meteen vrij. En wie al
langer dan de proefperiode betaalt en nú overstapt op het jaar, wacht ook
nergens op — zijn proef is allang geweest en de winkel geeft er geen tweede.

Staat er wél een wachttijd, dan staat de datum op het abonnementsscherm, want
een knop die er zonder uitleg niet is leest als een storing.

Twee dingen die dit **niet** oplost, en die je moet weten voordat je het voor
beveiliging aanziet:

- **De pdf's zitten in de app zelf**, in `public/ebook/`. Ze gaan dus mee in
  elke installatie, en wie een app-bestand kan uitpakken heeft ze zonder ooit
  iets te kopen. Dit slot is wrijving tegen de makkelijke weg, geen slot. Wil
  je het echt dichthebben, dan moet het boek van de worker komen en niet uit
  de bundel — net zoals `server/src/lezer.ts` de leesboeken al doet.
- **Bij opnieuw installeren begint de teller opnieuw.** De staat staat in de
  telefoon, dus een abonnee die zijn toestel wisselt wacht nog een keer drie
  dagen op het boek. Dat is het eerlijke nadeel van een grens zonder server
  die bonnen narekent; RevenueCat of eigen bonvalidatie lost allebei de punten
  tegelijk op.

**2. Beide bedragen zijn Apple-prijspunten.** Apple werkt met vaste
prijspunten; € 6,99 en € 59,99 zijn er twee van, en € 29,99 — de actieprijs op
het jaar — is er een derde. Let op: Apple heeft géén
59,88, en twaalf maal € 4,99 bestaat daar dus niet. Google Play laat per land
wel een vrij bedrag toe, maar we houden er € 59,99 aan: één bedrag in beide
winkels scheelt een uitzondering in elke tekst, en het komt neer op € 5,00 per
maand. De app toont sowieso altijd de prijs die de winkel zelf teruggeeft, in
de munt van de koper; alleen de website valt terug op wat er in `PLANS` in
`src/engine/billing.ts` staat.

**3. Zet beide producten in dezelfde abonnementsgroep.** Dan kan iemand die
maandelijks betaalt overstappen op een jaar zonder dubbel te betalen, en regelt
de winkel de verrekening. Staan ze in aparte groepen, dan kan iemand per
ongeluk twee abonnementen hebben.

## Wat er in de app al zit

- Het abonnementsproduct, de knop, de prijs uit de winkel, en de verplichte
  knoppen **Aankoop terugzetten** en **Abonnement beheren** (die laatste opent
  het opzegscherm van de winkel zelf).
- De **verplichte voorwaardentekst** vóór de aankoop, in zes talen: wat er nu
  wordt afgeschreven, en dat het jaarlijks of maandelijks doorloopt tot je
  opzegt. Biedt de winkel déze koper wél een proefperiode aan, dan staat er de
  tak bij die zegt hoe lang die duurt en dat opzeggen vóór het einde niets
  kost.
- Een **ouderpoort**: een rekensom die een volwassene moet beantwoorden. Apple
  eist dat voor apps in de kindercategorie, en bij een doorlopend abonnement
  hoort het sowieso.
- Toegang die weer **dicht kan**: zegt de winkel dat het abonnement niet meer
  loopt, dan sluit de app de betaalde units weer af — maar nooit op een gok, en
  nooit zomaar omdat er even geen verbinding is.
- De grens staat op één plek: `magLeren` en `lessonBehindPaywall` in
  `src/engine/store.ts` — zonder abonnement staat alleen open wat deze
  leerling al had afgerond, en na het betalen staat alles open, in één keer.
  `Poort` in `src/App.tsx` stuurt wie niets open heeft naar het
  abonnementsscherm, maar nooit weg van de instellingen, de voorwaarden of de
  knop om een eerdere aankoop terug te zetten.

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
| Eerst | maak een **subscription group** (bijv. "Darijaforkids") | maak een abonnement met een **basisplan** |
| Product-id | `app.darijaforkids.yearly` en `app.darijaforkids.monthly` | dezelfde twee |
| Duur | 1 jaar en 1 maand, beide automatisch verlengend | idem |
| Prijs | € 59,99 en € 6,99 | € 59,99 en € 6,99 |
| Gratis periode | **geen** — staat er nog een *Free Trial*, zet er een einddatum op | **geen** — deactiveer `proef-jaar` en `proef-maand` |
| Actie op het jaar | Introductory Offer → *Pay Up Front* → **€ 29,99**, met einddatum | Aanbieding → **Korting**, één fase van 1 jaar op **€ 29,99**, met einddatum |
| Naam voor de koper | Volledige toegang | Volledige toegang |

Bij Apple hoort bij elk abonnement een schermafbeelding en een beschrijving;
die worden apart beoordeeld.

### En het e-boek, als derde product

Het e-boek is **geen abonnement** maar een eenmalige aankoop, en dat is in beide
winkels een ander soort product:

| | App Store Connect | Google Play Console |
|---|---|---|
| Waar | Jouw app → **In-App Purchases** | Jouw app → **Producten → Eenmalige producten** |
| Soort | **Non-Consumable** | **Eenmalig product**, niet verbruikbaar |
| Product-id | `app.darijaforkids.ebook` | hetzelfde id |
| Prijs | € 14,99 | € 14,99 |
| Naam voor de koper | Het e-boek | Het e-boek |

#### Het e-boek aanmaken in App Store Connect, stap voor stap

Let op waar je begint: een eenmalig product staat **niet** bij Subscriptions.
Het staat in de linkerkolom van de app onder **Monetization → In-App
Purchases**, een lijst hoger.

1. **In-App Purchases → de plusknop.** Als type kies je **Non-Consumable**.
2. **Reference Name** `Het e-boek`. Die naam ziet alleen jij, in de
   verkooprapporten.
3. **Product ID** `app.darijaforkids.ebook`. Tik hem over en kijk er twee keer
   naar: een product-id is definitief, ook als je het product weggooit.
4. **Create.** Daarna open je het product en vul je de rest in.
5. **Availability** — alle landen aan, net als bij de abonnementen.
6. **Price** — kies het prijspunt **€ 14,99**. Apple rekent de andere
   valuta's zelf om.
7. **App Store Localization → Dutch (Netherlands)**, met de tekenlimieten die
   Apple hanteert:

   | Veld | Wat erin komt | Tekens |
   |---|---|---|
   | Display Name | `Het e-boek` | 10 |
   | Description | `Het hele pad op papier. Printen of lezen.` | 41 |

8. **Family Sharing → Turn On.** Bij een niet-verbruikbaar product mag dat, en
   het past bij de rest: de abonnementen staan ook aan.
9. **Review Information** — het screenshot van 1290 × 2796 uit
   `store/review-screenshot/`, hetzelfde als bij Jaar en Maand. Daar staat het
   e-boekblok met de prijs op, dus het toont wat de reviewer moet zien.
10. **Save.** De status wordt *Ready to Submit*.

**Het gaat mee met de app, niet apart.** Een eerste in-app aankoop wordt
beoordeeld samen met een app-versie: je koppelt hem in App Store Connect aan de
versie die je indient. Los indienen kan pas als de app al een keer is
goedgekeurd.

Niet-verbruikbaar betekent: één keer betalen, voor altijd, en terug te zetten op
een nieuw toestel met **Aankoop terugzetten**. Zo staat het ook in de app —
`grantEbook()` in `src/engine/billing.ts` neemt het nooit meer terug, ook niet
als het abonnement stopt.

**Wie een jaar vooruit betaalt krijgt het boek erbij.** Dat regelt de app zelf:
zodra de winkel zegt dat `app.darijaforkids.yearly` van deze koper is, staat het
boek open. Er is dus geen bundelproduct nodig, en iemand die per maand betaalt
kan het boek los kopen.

Het boek zelf zit **in de app**, als `public/ebook/darija-kids-<taal>.pdf`, in
alle zes talen. Geen downloadlink die verloopt, geen account: wie het gekocht
heeft opent het offline. Zet het opnieuw met `npm run ebook` zodra er woorden
bij de cursus komen — het boek wordt uit dezelfde bestanden gezet als de lessen,
dus het kan niet uit de pas gaan lopen.

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
€ 59,99 per jaar, € 6,99 per maand of € 14,99 voor het boek die de klant ziet is dus inclusief btw, en jij
ontvangt het bedrag ná commissie en ná btw. Jij stuurt geen facturen naar kopers.

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
  dat doet de app al, in zes talen.
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

Test in elk geval: afsluiten zonder proefperiode (er wordt meteen
afgeschreven), verlengen, opzeggen, en opnieuw installeren met **Aankoop
terugzetten**. En lees het aankoopvenster zelf na: daar mag nergens meer een
gratis periode staan.

## En de website?

Op de website kan niet betaald worden, en daarom staat de poort daar niet:
`Poort` in `src/App.tsx` slaat zichzelf over als `platform() === 'web'`. Er is
op het web niets te koop — `billingAvailable()` is onwaar — en een poort zou
een bezoeker wegsturen van het enige wat de website te bieden heeft:
rondkijken. Dat geldt voor darijaforkids.eu en voor de webversie van de app.

De lessen zelf zitten daar wél achter hun eigen slot: zonder abonnement gaat
er ook op het web geen les open. De pagina *Volledige toegang* legt uit dat het
abonnement in de app loopt — met de prijs erbij, zodat niemand voor een
verrassing komt te staan. Die prijs komt daar uit `PLANS` in
`src/engine/billing.ts`, want er is geen winkel om hem aan te vragen.
