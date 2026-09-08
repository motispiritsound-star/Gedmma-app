# Lanceren als betaalde dienst

Dit gaat over de stap van "de app werkt" naar "mensen betalen ervoor". Geen
juridisch of fiscaal advies — wel de lijst waarmee je naar een boekhouder of
jurist stapt, en de rekensom die je vooraf wilt kennen.

---

## Eerst het feit dat alles bepaalt

**Zoals de app nu gebouwd is, kun je er geen abonnement op verkopen.**

Alles draait in de browser van de bezoeker. Geen server, geen accounts, geen
database — dat was een bewuste keuze en het is de reden dat de app offline
werkt en dat er geen kindergegevens rondgaan. Maar het betekent ook dat er
niets is om achter een slot te zetten. Wie de pagina opent, heeft de hele app:
rechtermuisknop, opslaan, en hij werkt voor altijd. Voor een abonnement is er
iets nodig dat kan zeggen "deze persoon betaalt" — en dat kan alleen op een
server, want alles in de browser is zichtbaar en aanpasbaar.

Dat is geen fout in de app. Het is een keuze die je nu opnieuw maakt.

Wat je ook kiest, één ding verandert sowieso: **de privacybelofte klopt straks
niet meer.** In het colofon, in de README en in de app staat nu "niets verlaat
dit apparaat" en "geen account". Zodra er accounts zijn, is dat onwaar. Die
teksten moeten mee, en de eerlijke versie wordt: *het account van de ouder
staat op onze server, wat je kind doet blijft op het apparaat.* Dat is nog
steeds een sterke belofte — sterker dan wat de meeste apps kunnen zeggen —
maar hij moet kloppen.

---

## De rekensom

Zodat je weet waar je aan begint. Alle bedragen inclusief btw waar dat hoort.

| | |
|---|---|
| Prijs | € 4,99 per maand |
| Af: 21% btw | € 0,87 |
| Af: betaalkosten (SEPA-incasso, ± € 0,25) | € 0,25 |
| **Houd je over** | **± € 3,87 per maand per abonnee** |

Wat dat betekent in aantallen:

| Abonnees | Per maand netto | Per jaar |
|---:|---:|---:|
| 50 | € 194 | € 2.322 |
| 250 | € 968 | € 11.610 |
| 1.000 | € 3.870 | € 46.440 |

Twee dingen die deze tabel te rooskleurig maken:

**Opzeggingen.** Bij maandelijks opzegbare abonnementen op kinder-educatie is
5 tot 10% per maand normaal. Bij 8% ben je na een jaar tweederde van je
abonnees kwijt. Je moet dus blijven werven om stil te staan. Een jaarabonnement
(bijvoorbeeld € 39 per jaar, ruim 35% korting) haalt die maandelijkse lekkage
weg en scheelt bovendien elf transactiekosten per klant.

**Ondersteuning.** Een betalende klant stelt vragen. Reken op enkele minuten
per klant per maand. Bij 250 abonnees is dat een dagdeel per week.

---

## Drie wegen, met een aanbeveling

### 1. Eenmalig betalen — het snelst

Je verkoopt een licentiecode. De koper vult hem één keer in en de app werkt.
Geen maandelijkse administratie, geen opzeggingen, geen incasso's.

- **Nodig:** een betaalknop en iets dat codes uitgeeft en controleert. Een klein
  stukje server, of in het begin zelfs met de hand.
- **Nadeel:** geen terugkerende omzet. En een code die één keer werkt is te
  delen; je verkoopt in feite op vertrouwen.
- **Prijs:** eenmalig € 24,95 of € 29,95 voelt in deze hoek redelijk.

### 2. Abonnement — wat je vroeg

- **Nodig:** accounts, inloggen, wachtwoord vergeten, een betaalprovider met
  incasso, facturen, een opzegknop, en een server die dat allemaal draagt.
  Reken op een paar weken werk, en daarna doorlopend onderhoud en kosten.
- **Voordeel:** terugkerende omzet, en je kunt inhoud blijven toevoegen.
- **Let op:** de app moet dan grotendeels achter het slot. Dat betekent ook dat
  hij niet meer offline werkt voor wie niet is ingelogd, en dat de installatie
  op het beginscherm minder waard wordt.

### 3. Moskeeën en weekendscholen — de onderschatte weg

Je verkoopt niet aan ouders maar aan de school. Eén contactpersoon, één
factuur, en zij zetten het bij de ouders neer.

- **Rekenvoorbeeld:** een weekendschool met 60 kinderen voor € 250 per jaar is
  € 4,17 per kind per jaar. Dat lijkt weinig, maar het is één relatie in plaats
  van zestig, nauwelijks opzeggingen, en de school doet je marketing.
- Twintig van zulke scholen is € 5.000 per jaar met een fractie van de
  ondersteuning die 100 losse abonnees kosten.
- **Nodig:** in de eerste maanden helemaal niets technisch. Een gesprek, een
  factuur, en de app op hun apparaten.

### Wat ik zou doen

**Begin met 3, bouw daarna 1, en stap pas naar 2 als je weet dat mensen willen
betalen.**

De reden is niet techniek maar bewijs. Je weet nu niet of mensen hiervoor
betalen — dat weet niemand voor de eerste verkoop. Route 3 kost je geen regel
code en levert binnen een maand antwoord op de enige vraag die telt. Bouw je
eerst een abonnementssysteem, dan heb je weken werk gedaan voordat je weet of
er een markt is.

En als je toch abonnementen wilt: doe het **freemium**. Het alfabet, de eerste
drie lessen en drie soera's blijven gratis. Dat is genoeg om een kind een week
bezig te houden en een ouder te overtuigen. De rest achter het account. Zonder
gratis deel moet iemand betalen voor iets wat hij nog nooit gezien heeft, en
dat doet bijna niemand.

---

## Wat er juridisch en administratief bij komt

Loop dit door met een boekhouder. De bedragen en regels hieronder zijn de
punten om te controleren, geen advies.

**Voordat je de eerste euro ontvangt**
- [ ] Inschrijving bij de KvK (eenmanszaak volstaat om te beginnen).
- [ ] Btw-nummer. Digitale diensten aan consumenten zijn btw-plichtig.
- [ ] Verkoop je ook buiten Nederland, dan geldt de btw van het land van de
      klant. Boven de EU-drempel moet je je melden voor de éénloketregeling
      (OSS) bij de Belastingdienst — vraag je boekhouder waar die drempel nu
      ligt en of jij eroverheen gaat.
- [ ] Zakelijke rekening, gescheiden van privé.

**Op de site, voordat iemand kan afrekenen**
- [ ] Algemene voorwaarden.
- [ ] Privacyverklaring die klopt met wat je écht doet (zie hierboven).
- [ ] Duidelijke prijs inclusief btw, en wat er precies in zit.
- [ ] Bedenktijd. Bij digitale diensten heeft een consument in beginsel veertien
      dagen herroepingsrecht. Je kunt daarvan af als de klant uitdrukkelijk
      instemt met directe levering én verklaart het herroepingsrecht te
      verliezen — dat is een vinkje bij het afrekenen, geen zin in de kleine
      letters. Laat de formulering nakijken.
- [ ] Een opzegknop die net zo makkelijk te vinden is als de aanmeldknop.
      "Maandelijks opzegbaar" moet ook maandelijks opzegbaar zíjn, met één
      handeling, zonder mailtje of telefoontje.
- [ ] Contactgegevens: naam, adres, KvK-nummer, btw-nummer.

**Omdat het om kinderen gaat**
- [ ] Het account staat op naam van de ouder, niet van het kind. Onder de AVG
      kan een kind onder de zestien niet zelf toestemming geven; met de ouder
      als klant omzeil je die knoop, mits je het ook echt zo inricht.
- [ ] Houd kindgegevens lokaal. Wat je niet verzamelt, hoef je niet te
      beveiligen, niet te verantwoorden en niet te verwijderen. Dat is nu al zo
      — houd het zo, ook als er accounts komen.
- [ ] Verwerkersovereenkomst met je betaalprovider en je hostingpartij.

**Voor het vertrouwen, niet omdat het moet**
- [ ] Laat de Koran-tekst nalezen en **noem de naam van wie dat deed** op de
      site. Voor dit publiek is dat waarschijnlijk het sterkste
      verkoopargument dat je hebt — sterker dan welke functie ook.
- [ ] Regel de recitatie netjes, met naamsvermelding en toestemming op papier.

---

## Betaalprovider

Voor Nederland met terugkerende betalingen is de gebruikelijke keuze **Mollie**
of **Stripe**.

- **Mollie** is Nederlands, kent iDEAL goed en doet SEPA-incasso. Het gebruikelijke
  patroon: eerste betaling met iDEAL, daarna automatische incasso. Dat is voor
  Nederlandse consumenten de vertrouwdste vorm en de goedkoopste per transactie.
- **Stripe** heeft betere hulpmiddelen voor abonnementen (facturen, mislukte
  betalingen, klantenportaal) maar rekent per transactie meer en leunt op
  kaartbetalingen, wat in Nederland minder vanzelfsprekend is.

Voor route 1 (eenmalig) is Mollie met iDEAL de snelste weg. Voor route 2
(abonnement) is Stripe minder bouwwerk, Mollie goedkoper per klant.

**Appwinkels.** Wil je in de App Store of Play Store, dan houdt Apple 15 tot 30%
in en verplicht het bovendien om digitale aankopen via hun eigen systeem te
laten lopen. De app is nu een webapp die je op je beginscherm zet; daarmee
ontloop je die afdracht en die goedkeuring volledig. Je verliest wel de
vindbaarheid van de winkel — maar dit publiek vindt dingen via de moskee, via
familie en via WhatsApp, niet via een zoekterm in de App Store.

---

## Wat er technisch bij moet

**Voor route 1 (eenmalige licentie)**
- Een betaalpagina met Mollie.
- Iets dat na betaling een code uitgeeft en per e-mail verstuurt.
- In de app een invoerveld dat de code controleert.
- Kan met een heel klein stukje server. Enkele dagen werk.

**Voor route 2 (abonnement)**
- Accounts: registreren, inloggen, wachtwoord vergeten, e-mail bevestigen.
- Abonnementbeheer: aanmaken, opzeggen, mislukte incasso, herstarten.
- Een server met een database, en het onderhoud dat daarbij hoort.
- De app splitsen in een gratis deel en een deel achter het slot.
- Een klantenportaal met de opzegknop.
- Facturen.
- Reken op enkele weken, plus doorlopende kosten en aandacht.

**In alle gevallen**
- Een landingspagina die uitlegt wat het is en wat het kost.
- De privacyteksten in de app, de README en het colofon herschrijven.
- Een e-mailadres dat je leest.

---

## De volgorde die ik zou aanhouden

1. **Deze week.** Zet de app online zoals hij nu is, gratis, op een eigen adres.
   Deel hem in je eigen kring. Kijk of kinderen hem gebruiken zonder dat iemand
   erbij zit. Dat is de test die alles bepaalt — een app waar niemand op
   terugkomt, verkoop je ook niet.
2. **Ondertussen.** Laat de Koran-tekst nalezen. Zonder dat kun je niet
   publiceren, en met de naam van de controleur erbij heb je meteen je sterkste
   argument.
3. **Deze maand.** Spreek drie weekendscholen. Niet om te verkopen — om te
   vragen wat ze nu gebruiken en wat er mis mee is. Als er twee zeggen "dit
   willen we hebben", heb je je antwoord.
4. **Daarna.** Bouw de manier van betalen die past bij wie er ja zei. Kwamen de
   ja's van scholen, dan heb je facturen nodig en geen abonnementssysteem.
   Kwamen ze van ouders, bouw dan eerst de eenmalige licentie.
5. **Pas als het loopt.** Abonnementen, met een gratis deel ervoor.
