# De dag zelf

`docs/LANCERING.md` gaat over de negentig dagen eromheen: wie dit koopt, wat
de boodschap is, en hoe je aan je eerste duizend volgers komt. Dit bestand
gaat over één dag — de dag dat de goedkeuringen binnen zijn en de app naar
buiten gaat. Het is met opzet saai en in volgorde. Op die dag wil je niets
meer hoeven bedenken.

Alle teksten hieronder staan klaar om te plakken. Ze zijn niet bedoeld om
mooi te zijn maar om te versturen.

---

## Waar het nu staat — 1 oktober

| | |
|---|---|
| **Apple** | 1.0 **goedgekeurd** om 16:46, en vastgehouden. Eén knop van live |
| **Play** | inzending 4 nog in beoordeling. Reken op 5 of 6 oktober |

**Het besluit: allebei tegelijk, en Play bepaalt de dag.** De meeste mensen in
het kanaal zitten op Android. Apple alleen vrijgeven maakt de aankondiging op
voor de kleinste helft van je publiek, en dan moet je voor de rest een tweede
keer komen met een bericht dat dan oud nieuws is.

Dat kost je niets wat je terugkrijgt. Een goedgekeurde app die wacht, kost
geen dag levensduur; een lancering die je twee keer moet doen, kost je het
moment.

## Vóór de goedkeuring — twee schakelaars

Deze twee zijn het verschil tussen een lancering en een verrassing. Een
winkel die bij goedkeuring meteen publiceert, bepaalt zelf je lanceerdag, en
dan staat de app op zondagavond in de winkel terwijl je eerste bericht nog
moet.

**Allebei staan goed, en dat is bewezen en niet gehoopt.**

1. ~~**Play op handmatig.**~~ *Managed publishing on*, gezien op het
   Publishing overview. Dat is ook de verklaring voor de 404 op de
   winkelpagina terwijl de release op Productie staat.
2. ~~**Apple op handmatig.**~~ Bewezen door de goedkeuring zelf: Apple keurde
   1.0 goed om 16:46 en publiceerde hem niet. Bij *automatically* had de app
   er binnen een dag gestaan.

## De dag kiezen

**Dinsdag, woensdag of donderdag, 's ochtends.** Niet vrijdag — dan valt je
eerste dag in het weekend en is er niemand die iets doorstuurt op het moment
dat het telt. Niet maandag: wat er maandagochtend binnenkomt, verdrinkt.

**De dag dat Play groen wordt, is niet de dag van de lancering.** Dat is de
dag dat je hem kunt kiezen. Pak de eerstvolgende dinsdag, woensdag of
donderdag.

Er hoort geen aftelling bij — zie `LANCERING.md` §16 fase 2. Het kanaal gaat
gewoon door met wat het elke dag doet, en op de gekozen dag staat het bericht
ertussen. Dat scheelt je ook een belofte die je niet in de hand hebt.

Twee winkels hoeven niet op dezelfde minuut. Apple heeft na "vrijgeven" nog
een paar uur nodig, Play is binnen het uur zichtbaar. Dus: **Apple eerst,
Play erachteraan**, en pas posten als allebei de adressen echt opengaan in
een browser waar je niet bent ingelogd.

## Het hele werk op de dag zelf

Vier regels. Er gaat geen aftelling aan vooraf — het kanaal loopt gewoon door
zoals het elke dag loopt.

```bash
npm run live -- --google
```

```bash
git add -A
```

```bash
git commit -m "De app staat in de winkel"
```

```bash
git push
```

Die ene regel zet allebei de knoppen aan: hij **vraagt zelf om het Apple ID**
zodra hij merkt dat het er nog niet is. Niets vooraf in te vullen, en niets
tussen punthaken om te vergeten.

Het nummer staat in App Store Connect onder **App Information → Apple ID**,
negen of tien cijfers. Let op dat dat niet het nummer is dat bij een
abonnement staat: twee verschillende getallen op twee schermen die er
hetzelfde uitzien.

En dan de berichten hieronder, in de volgorde van §3. Reken op een uur voor
alles bij elkaar, waarvan vijftig minuten persoonlijke WhatsApp-berichten.

---

## De volgorde

### 0. Eerst de proefperiode, vóór je iets vrijgeeft

**Dit is een blokkade, geen aanbeveling.** Op het koopscherm van de app staat
*start 3 dagen gratis*, in zes talen. Dat getal komt uit `TRIAL_DAYS` in
`src/engine/billing.ts` en staat er ongeacht wat de winkel weet. Bestaat de
aanbieding bij Apple niet, dan leest de eerste koper drie dagen gratis en
schrijft Apple meteen € 59,99 af — terugbetalingen, eensterbeoordelingen in de
eerste week, en een afwijzing op richtlijn 3.1.2 bij de eerstvolgende versie.

Bij `app.darijaforkids.yearly` is het op 1 oktober aangetoond: in de tabel
onder *Subscription Prices* staat de kolom **INTRODUCTORY OFFERS (175)** met
*Free for the first 3 days*. De andere drie zijn nog niet nagekeken. Dus vóór
het vrijgeven:

1. ~~App Store Connect → **Jaar**~~ — **staat er**, 175 landen.
2. Hetzelfde bij **Maand**: App Store Connect → Subscriptions → *Volledige
   toegang* → **Maand**, en kijken of de kolom *Introductory Offers* in de
   prijzentabel gevuld is. Is hij leeg: de blauwe ⊕ naast *Subscription
   Prices* → **Create Introductory Offer**, type *Free Trial*, **3 dagen**,
   alle landen, voor wie nog niet geabonneerd is.
3. Play Console → het abonnement → basisplan → **Aanbieding** → *Gratis
   proefperiode*, **3 dagen**. Ook hier twee keer.
4. **Nameten op een toestel**, want de console is niet het bewijs: koop in
   TestFlight en kijk naar het aankoopvenster van Apple zelf, dat over het
   scherm van de app heen komt. Staat er *3 dagen gratis, daarna € 59,99*,
   dan klopt het. Staat er alleen € 59,99, dan niet.

Lukt het aanmaken niet op tijd, dan is er één eerlijke uitweg en dat is níét
toch vrijgeven: zet `TRIAL_DAYS` op 0 in `src/engine/billing.ts`. De teksten
passen zich in alle zes talen aan en de app belooft dan niets meer wat de
winkel niet doet. Dat kost conversie — wie geen proef krijgt moet meteen
betalen — maar het kost je geen terugbetalingen en geen beoordeling.

### 1. Vrijgeven

Apple: de app → de versie *1.0* → **Release this version**. De versie staat
sinds 1 oktober op *Pending Developer Release*; die knop is het hele werk.
Play: Publishing overview → **Publish**. Daarna wachten tot je allebei de adressen kunt openen:

Het Play-adres kun je nu al plakken; dat is niets anders dan het application
id in een URL:

```
https://play.google.com/store/apps/details?id=app.darijaforkids.learn
```

Het Apple-adres hangt aan het Apple ID van de app, en dat getal krijg je niet
uit dit bestand. Je hoeft het ook nergens over te typen: zodra de versie op
**Ready for Sale** staat, zet App Store Connect er zelf een link *View on App
Store* bij. Die open je. En in stap 2 vraagt `npm run live` om het nummer en
drukt het volledige adres daarna nog een keer af, zodat je het kunt
vergelijken met wat je zojuist opende.

Wat je in elk geval **niet** doet is een adres met punthaken plakken. In
PowerShell leest `<` als een omleiding en krijg je een foutmelding die nergens
over gaat — op de dag van de lancering, met de app al in de winkel.

**Wacht echt tot ze opengaan.** Een winkelpagina bestaat pas als de winkel
hem heeft rondgestuurd, en dat kan bij Apple een paar uur duren nadat het
scherm al "Ready for Sale" zegt.

### 2. De website omzetten

Eén commando, in `darija-kids`:

```bash
npm run live -- --google
```

Hij vraagt zelf om het Apple ID — dat staat in App Store Connect, onder de app
bij *App Information → Apple ID*. Plak het nummer, of de hele deellink; het
script haalt het ID eruit. Er valt in die opdracht dus niets in te vullen, en
dat is met opzet: een regel met `<het Apple ID>` erin wordt op zo'n dag
letterlijk geplakt, en PowerShell leest die `<` als een omleiding.

Dat zet de twee adressen in `src/site/links.ts` en bouwt de site opnieuw.
Daarmee verdwijnt het blok "binnenkort", wordt de balk onderaan een
downloadknop, en worden de twee winkelknoppen echt.

Dan de push, want de productiebranch publiceert zichzelf:

```bash
git add -A
git commit -m "De app staat in de winkel"
git push
```

Binnen een paar minuten staat darijaforkids.eu goed. Open hem zelf en druk op
allebei de knoppen. Werkt er één niet, dan `npm run live -- --uit` en je bent
terug bij "binnenkort" tot het klopt.

### 3. Pas nu posten

In deze volgorde, en niet andersom. Een bericht met een dode link komt maar
één keer voorbij.

| | |
|---|---|
| **09:00** | De veertig tot zestig persoonlijke WhatsApp-berichten (§4 van LANCERING) |
| **10:00** | Het WhatsApp-kanaal |
| **11:00** | Instagram en TikTok |
| **13:00** | Facebook |
| **15:00** | YouTube — community-bericht, en de link in elke beschrijving |
| **de avond** | De mail aan wie geen WhatsApp gebruikt, en aan wie op *hou me op de hoogte* heeft gedrukt |

De persoonlijke berichten zijn het werk van de dag. De rest is twintig
minuten. Dat is geen vergissing in de planning: één zus die het doorstuurt
naar één familiegroep levert meer op dan een hele dag posten.

---

## De teksten

### WhatsApp — persoonlijk, en het kanaal

Die staat in `docs/LANCERING.md` §4, met de link erin. Eén kopie, zodat er
niet twee versies gaan rondzwerven.

### Instagram en TikTok

Bijschrift onder het filmpje van dertig seconden. Kort, want daar leest
niemand door.

```
Je kind verstaat oma wel. Maar het antwoordt in het Nederlands.

Daar is nu een app voor. Marokkaans-Arabisch — Darija, niet het Arabisch
uit het schoolboek. Twee minuten per dag.

De eerste vier lessen zijn gratis. Link in bio.

#darija #marokko #marokkaansearabisch #darijaforkids #tweetalig
```

### Facebook

Daar zitten de ouders en daar mag het langer. Dit is de enige plek waar je
het verhaal zelf vertelt.

```
Vijf jaar geleden belde mijn moeder en sprak Darija, en mijn kind antwoordde
in het Nederlands. Zij verstond hem. Hij verstond haar. En toch was er iets
weg.

Ik heb gezocht naar iets om dat mee te keren en vond alleen Standaardarabisch
— de taal van het nieuws en het schoolboek, niet de taal waarin mijn moeder
mij grootbracht. Dus heb ik het zelf gemaakt.

Darijaforkids: het Arabische alfabet, 304 woorden en 100 zinnen, allemaal
ingesproken door een Marokkaanse stem. Zeventien units, van de letters tot
afdingen op de souq. Twee minuten per dag, als een spelletje.

De eerste vier lessen zijn gratis. Geen account, geen advertenties, niets in
te vullen — ook niet door een kind.

👉 darijaforkids.eu

Als je iemand kent die dit gevoel herkent: stuur het door. Daar help je me
het meest mee.
```

### YouTube — community-bericht

```
Hij staat er 🎉 Darijaforkids is vanaf vandaag te downloaden, voor iPhone en
Android. De eerste vier lessen zijn gratis.

👉 darijaforkids.eu
```

En in de beschrijving van elke video dezelfde twee regels bovenaan. Een
kijker die een woordje-van-de-dag vindt, moet in die beschrijving de app
kunnen vinden zonder te zoeken.

### De mail aan wie erom gevraagd heeft

Dit is je beste lijst en hij is klein, dus hij verdient een eigen bericht.
Deze mensen hebben hun adres gegeven en de link in hun bevestigingsmail
aangeklikt; ze hebben letterlijk gevraagd om dit bericht. Hoeveel het er zijn:

```
npm run belangstelling
```

Dat telt **bevestigd** en **wacht** apart, en alleen de eerste groep mag je
mailen. Zonder die tweede klik heb je geen aantoonbare toestemming, en een
lijst van honderd waarvan er dertig bevestigd zijn is een lijst van dertig.
De adressen zelf komen er niet uit — die staan in de database en horen daar;
versturen doe je bij de mailpartner.

Onderwerp: **Hij staat er**.

```
Hoi,

Je hebt een tijdje geleden gevraagd om een bericht zodra Darijaforkids er
zou zijn. Vanaf vandaag kun je hem downloaden, op iPhone en op Android.

De eerste vier lessen zijn gratis en blijven gratis — geen account, niets
in te vullen. Wil je verder, dan kun je het eerst drie dagen gratis
proberen.

darijaforkids.eu

Dank dat je het wilde weten. Dat was in de maanden dat er nog niets was
meer waard dan je denkt.

Groet,
Adil
```

Eén bericht, en daarna niets meer tenzij er echt iets is. Wie zich meldt voor
een aankondiging heeft zich niet gemeld voor een nieuwsbrief.

### De mail

Voor grootouders, oud-collega's, de mensen die geen WhatsApp-kanaal volgen.
Onderwerp: **Het is af**.

```
Hoi,

Een tijd geleden vertelde ik dat ik iets aan het maken was voor kinderen die
Marokkaans-Arabisch wel verstaan maar niet spreken. Vanaf vandaag staat het
in de App Store en in Google Play.

Darijaforkids — het Arabische alfabet, 304 woorden en 100 zinnen, ingesproken
door een Marokkaanse stem. Twee minuten per dag. De eerste vier lessen zijn
gratis, zonder account.

darijaforkids.eu

Als het je iets lijkt voor iemand in je omgeving: doorsturen mag altijd.

Groet,
Adil
```

### Voor wie geen Nederlands leest

De app en de website staan in zes talen, en er wonen Marokkaanse gezinnen in
Frankrijk, België, Duitsland, Spanje en Italië. Het korte bericht, voor de
kanalen waar dat past:

**Frans**

```
Votre enfant comprend sa grand-mère. Mais il répond en français.

Darijaforkids : l'arabe marocain — le darija, pas l'arabe des manuels.
Deux minutes par jour. Les quatre premières leçons sont gratuites.

👉 darijaforkids.eu
```

**Engels**

```
Your child understands their grandmother. But answers in English.

Darijaforkids: Moroccan Arabic — Darija, not the Arabic from the textbook.
Two minutes a day. The first four lessons are free.

👉 darijaforkids.eu
```

---

## De zeven posten eromheen

Geen aftelling, dus dit zijn de **eerste zeven dagen ná** de lancering — zie
`LANCERING.md` §16 fase 2. Eén per dag, en elke post geeft iets. Dat is ook
waarom ze allebei de kanten op werken: ze zijn geschreven om iets te geven en
niet om af te tellen.

Wil je er eentje vóór de lancering gebruiken, dan kan dat gewoon tussen je
dagelijkse posten door. Het is geen reeks die in volgorde moet.

**1 — het filmpje.** Dertig seconden, geen bijschrift dat het uitlegt.

```
Dit duurde twee jaar.
```

**2 — het woordje van de dag.** Gewoon, zoals altijd, zonder iets over de
lancering. Wie elke dag hetzelfde geeft, wordt geloofd op de dag dat hij iets
vraagt.

**3 — waarom Darija.**

```
"Waarom leer je ze geen Arabisch?"

Dat doe ik. Alleen niet het Arabisch van het journaal en het schoolboek —
dat spreekt thuis niemand.

Darija is wat je oma zegt als ze de telefoon opneemt. Het is wat er op de
markt in Marrakech wordt geroepen. Het is de taal waarin er om je gelachen
wordt en waarin je getroost wordt.

Een kind dat Standaardarabisch leert, kan de krant lezen. Een kind dat
Darija leert, kan met zijn familie praten.
```

**4 — het leerpad.** Een schermafbeelding, en daaronder:

```
Zeventien units. Van het alfabet tot afdingen op de souq.

Elke les duurt twee minuten. Dat is met opzet: een kind dat elke dag twee
minuten doet, komt verder dan een kind dat één keer per maand een uur moet.
```

**5 — jouw verhaal.** Vier zinnen, geen verkooppraat. Dit is de post die het
verst komt, en de enige die niemand anders kan schrijven.

```
Mijn moeder belde. Ze sprak Darija, zoals altijd.
Mijn zoon verstond haar prima en antwoordde in het Nederlands.
Ze hebben allebei niets gemerkt.
Ik wel.
```

**6 — wat het kost.** Eerlijk en compleet, één keer, en daarna nooit meer.

```
Voor wie het zich afvraagt: de eerste vier lessen zijn gratis. Geen account,
geen advertenties, niets in te vullen — ook niet door een kind.

Wil je verder, dan kost het € 6,99 per maand of € 59,99 per jaar, voor het
hele gezin.

Ik zeg het liever nu dan dat je er straks achter komt.
```

**7 — morgen.** Eén zin, één plaatje. Ga je meteen live, sla deze dan over.

```
Morgen.
```

## De boeken zijn een aparte lancering

Niet op dezelfde dag. Twee dingen tegelijk aankondigen betekent dat er geen
van beide binnenkomt, en de boeken verkopen aan een andere kant van dezelfde
ouder: de app is voor het kind, de boeken zijn iets wat je samen doet.

Houd er **een week tot tien dagen** tussen, en begin met wat gratis is: de
eerste drie hoofdstukken van *De olijvenbrand* staan op
darijaforkids.eu/leesboeken, in zes talen, zonder account en zonder
e-mailadres. Dat is de aankondiging. De reeks van vijftien verkoopt zichzelf
aan wie die vier bladzijden uit heeft.

```
Er is ook iets om samen te lezen.

De sleutels van Marokko — vijftien verhalen over de geschiedenis van het land,
van Walili tot nu. Geen schoolboek: verhalen, met kinderen erin die er
toevallig bij stonden.

Het eerste deel begint met een brand in een olijfgaard. De eerste drie
hoofdstukken staan gratis online, voorgelezen inbegrepen:

👉 darijaforkids.eu/leesboeken
```

## Wat je die dag niet doet

- **Geen prijs in de eerste boodschap.** Dat hoort op T-2, eerlijk en
  compleet, en daarna nooit meer. Wie het op de dag zelf ontdekt, voelt zich
  beetgenomen — dus verstop het ook niet.
- **Geen winkellink in de app.** De app verwijst nergens naar de boeken. Dat
  is met opzet: een betaalde app die naar een andere winkel wijst, is voor
  Apple een reden om te weigeren, en voor een ouder een reden om te
  wantrouwen.
- **Geen tweede post op dezelfde dag** op hetzelfde kanaal. Eén bericht, en
  dan de hele dag antwoorden op wie reageert. Dat laatste is belangrijker dan
  het bericht.
- **Niets stilzetten daarna.** Het woordje van de dag gaat gewoon door. Een
  kanaal dat na de lancering stilvalt, verliest in een week wat je in drie
  maanden hebt gebouwd.

## De dagen erna

| | |
|---|---|
| **dag 1** | Het woordje van de dag gaat door. Antwoord op alles wat binnenkomt. |
| **dag 3** | Vraag wie het heeft doorgestuurd. Ongemakkelijk, en het verschil tussen tweehonderd en tweeduizend installaties. |
| **dag 3** | Vraag om een beoordeling in de winkel. Eén zin: *als de app je bevalt, helpt een beoordeling meer dan je denkt.* |
| **dag 7** | Het eerste filmpje van een kind dat iets in het Darija tegen zijn oma zegt. Vraag ouders erom; er is er altijd één die het stuurt. |
| **dag 7–10** | De boeken. |

## Als er iets misgaat

**De app is goedgekeurd maar het adres doet het niet.** Wachten. Apple stuurt
een nieuwe app langs al zijn winkels en dat duurt soms uren na "Ready for
Sale". Zet de website nog niet om.

**Er staat een fout in de app en er zijn al downloads.** Play kan binnen een
dag een nieuwe versie uitbrengen; Apple duurt een dag of twee en moet via de
Mac en Xcode — reken op een uur werk, niet op tien minuten. Zet in de
tussentijd niets stil: een app uit de winkel halen kost je de beoordelingen
die je al hebt.

**Niemand stuurt iets door.** Dan is het bericht te veel een advertentie.
Vraag het één keer expliciet, persoonlijk, aan tien mensen. Niet nog een post.
