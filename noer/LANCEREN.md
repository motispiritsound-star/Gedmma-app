# Lanceren als betaalde dienst

Dit gaat over de stap van "de app werkt" naar "mensen betalen ervoor". Geen
juridisch of fiscaal advies — wel de lijst waarmee je naar een boekhouder of
jurist stapt, en de rekensom die je vooraf wilt kennen.

---

## Waar dit bestand vandaan komt

Toen dit voor het eerst werd opgeschreven, stond er dat je er geen abonnement
op kón verkopen: de app draaide alleen in de browser, dus er was niets om
achter een slot te zetten. Dat is inmiddels gebouwd. Er staat een server bij,
er zijn accounts, en Mollie int elke maand. Hoe dat werkt en wat je moet
instellen staat in **`BETALEN.md`**; dit bestand gaat over de keuzes eromheen.

Twee dingen uit dat oorspronkelijke stuk zijn blijven staan, omdat ze nog
steeds waar zijn.

**Het slot is een slot, geen kluis.** De app moet offline blijven werken en een
kind hoort geen inlogscherm te zien, dus zit alle inhoud in de app zelf en is
het slot een `if` in JavaScript. Wie een ontwikkelaarsvenster kan openen, komt
erlangs. Dat is een afweging, geen vergissing — dezelfde die elke leer-app in
de browser maakt. Wat je verkoopt is niet een bestand maar het geheel: dat het
werkt, op elk apparaat, met updates en de opnamestudio erbij.

**De privacybelofte is aangepast.** "Niets verlaat dit apparaat" klopte niet
meer zodra er accounts zijn. In het colofon, in het ouderscherm en op
`privacy.html` staat nu de eerlijke versie: *het account van de ouder staat op
de server, wat je kind doet blijft op het apparaat.* Dat is nog steeds een
sterkere belofte dan wat vrijwel elke andere kinder-app kan zeggen — en hij
klopt.

---

## De rekensom

Zodat je weet waar je aan begint. Alle bedragen inclusief btw waar dat hoort.

| | |
|---|---|
| Prijs | € 7,99 per maand |
| Af: 21% btw | € 1,39 |
| Af: betaalkosten (SEPA-incasso, ± € 0,25) | € 0,25 |
| **Houd je over** | **± € 6,35 per maand per abonnee** |

Wat dat betekent in aantallen:

| Abonnees | Per maand netto | Per jaar |
|---:|---:|---:|
| 50 | € 318 | € 3.812 |
| 250 | € 1.588 | € 19.059 |
| 1.000 | € 6.353 | € 76.236 |

De eerste week is gratis, dus je eerste maand met een nieuwe abonnee levert
zeven dagen minder op. Bij een gelijkmatige instroom is dat ongeveer een kwart
van één maandbedrag per klant, eenmalig. De verificatiebetaling van één cent
kost je € 0,29 aan transactiekosten — reken die bij je wervingskosten, niet bij
je omzet.

Twee dingen die deze tabel te rooskleurig maken:

**Opzeggingen.** Bij maandelijks opzegbare abonnementen op kinder-educatie is
5 tot 10% per maand normaal. Bij 8% ben je na een jaar tweederde van je
abonnees kwijt. Je moet dus blijven werven om stil te staan. Een jaarabonnement
(€ 79 per jaar, ruim 17% korting op € 95,88) haalt die
maandelijkse lekkage weg en scheelt bovendien elf transactiekosten per klant.
Het staat er als € 79 per jaar tegenover € 95,88 aan maandbedragen.

**Ondersteuning.** Een betalende klant stelt vragen. Reken op enkele minuten
per klant per maand. Bij 250 abonnees is dat een dagdeel per week.

**Over de prijs.** € 7,99 is meer dan een losse app en minder dan een uur
bijles. Het vergelijkingspunt in het hoofd van een ouder is meestal niet een
andere app maar de Koranles op zaterdag — en daar zit je ruim onder. Wat je
daarvoor moet waarmaken is dat het kind er uit zichzelf naar teruggaat. Dat is
de enige rechtvaardiging voor een maandbedrag: het wordt elke maand opnieuw
gebruikt.

## Drie wegen, met een aanbeveling

### 1. Eenmalig betalen — het snelst

Je verkoopt een licentiecode. De koper vult hem één keer in en de app werkt.
Geen maandelijkse administratie, geen opzeggingen, geen incasso's.

- **Nodig:** een betaalknop en iets dat codes uitgeeft en controleert. Een klein
  stukje server, of in het begin zelfs met de hand.
- **Nadeel:** geen terugkerende omzet. En een code die één keer werkt is te
  delen; je verkoopt in feite op vertrouwen.
- **Prijs:** eenmalig € 34,95 voelt in deze hoek redelijk — ongeveer een
  half jaar abonnement, en de koper is er vanaf.

### 2. Abonnement — wat je vroeg, en wat er nu staat

- **Gebouwd.** Accounts, inloggen, een abonnement via Mollie met iDEAL en
  creditcard, een gratis week vooraf, maandelijkse incasso daarna, een
  opzegknop die ook tijdens die week werkt, een bevestigingsmail, en een gratis
  deel dat altijd open blijft. Zie `BETALEN.md`.
- **Voordeel:** terugkerende omzet, en je kunt inhoud blijven toevoegen.
- **Nog niet gebouwd:** wachtwoord vergeten (dat doe je met de hand),
  facturen met een nummer, en aanmaningen bij een mislukte incasso. Bij de
  eerste honderd klanten is dat te doen.
- **Let op:** het gratis deel is met opzet ruim. Het hele alfabet, twee
  leeslessen, drie soera's en een woordthema blijven open zonder account — ook
  offline. Dat kost je wat omzet en levert je de kans op dat een kind
  terugkomt, en dát is waar een ouder voor betaalt.

### 3. Moskeeën en weekendscholen — de onderschatte weg

Je verkoopt niet aan ouders maar aan de school. Eén contactpersoon, één
factuur, en zij zetten het bij de ouders neer.

- **Rekenvoorbeeld:** een weekendschool met 60 kinderen voor € 295 per jaar is
  € 4,92 per kind per jaar. Dat lijkt weinig, maar het is één relatie in plaats
  van zestig, nauwelijks opzeggingen, en de school doet je marketing.
- Twintig van zulke scholen is € 5.900 per jaar met een fractie van de
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

**Voor route 2 (abonnement) — dit staat er nu**
- ✅ Accounts: registreren en inloggen. ❌ Wachtwoord vergeten, met de hand.
- ✅ Abonnement aanmaken, opzeggen, hervatten. ❌ Aanmaningen bij een mislukte
  incasso; Mollie probeert het zelf een paar keer en daarna stopt de toegang.
- ✅ Een server zonder afhankelijkheden, met de gegevens in één JSON-bestand.
  Een VPS van vijf euro trekt dit.
- ✅ De app is gesplitst in een gratis deel en een deel achter het slot.
- ✅ Een accountscherm met de opzegknop, even makkelijk te vinden als de
  aanmeldknop — dat is een wettelijke eis, geen nette gewoonte.
- ❌ Facturen met een factuurnummer. Voor consumenten hoeft dat niet, voor een
  school wel; die stuur je voorlopig met de hand.

**In alle gevallen**
- ✅ Een site die uitlegt wat het is en wat het kost, met voorwaarden en een
  privacyverklaring.
- ✅ De privacyteksten in de app en het colofon kloppen weer.
- ❌ Een e-mailadres dat je leest. Overal staat nu nog `noer@voorbeeld.nl`.

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
5. **Als het loopt.** Abonnementen, met een gratis deel ervoor. Dat staat er
   inmiddels; wat er nog moet gebeuren voordat je hem aanzet staat in
   `GO-LIVE.md` en `BETALEN.md`.
