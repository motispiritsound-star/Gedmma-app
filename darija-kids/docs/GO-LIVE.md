# De dag zelf

`docs/LANCERING.md` gaat over de negentig dagen eromheen: wie dit koopt, wat
de boodschap is, en hoe je aan je eerste duizend volgers komt. Dit bestand
gaat over één dag — de dag dat de goedkeuringen binnen zijn en de app naar
buiten gaat. Het is met opzet saai en in volgorde. Op die dag wil je niets
meer hoeven bedenken.

Alle teksten hieronder staan klaar om te plakken. Ze zijn niet bedoeld om
mooi te zijn maar om te versturen.

---

## Vóór de goedkeuring — twee schakelaars

Deze twee zijn het verschil tussen een lancering en een verrassing. Een
winkel die bij goedkeuring meteen publiceert, bepaalt zelf je lanceerdag, en
dan staat de app op zondagavond in de winkel terwijl je eerste bericht nog
moet.

1. **Play op handmatig.** Publishing overview → Manage → *Managed
   publishing* aan. Dan blijft een goedgekeurde release staan tot jij op
   publiceren drukt. Doe dit zolang de release nog in review is; erna is het
   te laat.
2. **Apple op handmatig.** Bij het inzenden van de versie: *Manually release
   this version*, niet "automatically".

Staat er één van de twee verkeerd, dan is dat geen ramp maar wel het einde
van de aftelling: dan is de dag van goedkeuring de dag van de lancering.

## De dag kiezen

**Dinsdag, woensdag of donderdag, 's ochtends.** Niet vrijdag — dan valt je
eerste dag in het weekend en is er niemand die iets doorstuurt op het moment
dat het telt. Niet maandag: wat er maandagochtend binnenkomt, verdrinkt.

Twee winkels hoeven niet op dezelfde minuut. Apple heeft na "vrijgeven" nog
een paar uur nodig, Play is binnen het uur zichtbaar. Dus: **Apple eerst,
Play erachteraan**, en pas posten als allebei de adressen echt opengaan in
een browser waar je niet bent ingelogd.

## Als je meteen live wilt

De aftelling van zeven dagen (LANCERING §16, fase 2) is de betere lancering:
je verzamelt er publiek mee voordat er iets te downloaden is. Maar ze kost
zeven dagen waarin de app klaar in de winkel staat te wachten, en dat is een
afweging die jij maakt, niet ik.

Wil je op de dag van goedkeuring naar buiten, dan is dit het hele werk:

```bash
npm run live -- --apple <het Apple ID> --google
git add -A && git commit -m "De app staat in de winkel" && git push
```

En dan de berichten hieronder, in de volgorde van §3. Reken op een uur voor
alles bij elkaar, waarvan vijftig minuten persoonlijke WhatsApp-berichten.

De zeven aftelposten zijn dan niet verloren: post ze in de week **ná** de
lancering, in dezelfde volgorde. Ze zijn geschreven om iets te geven, niet om
af te tellen — daarom werken ze allebei de kanten op.

---

## De volgorde

### 1. Vrijgeven

Apple: de versie → *Release this version*. Play: Publishing overview →
*Publish*. Daarna wachten tot je allebei de adressen kunt openen:

```
https://apps.apple.com/app/id<jouw Apple ID>
https://play.google.com/store/apps/details?id=app.darijaforkids.learn
```

Het Apple ID is een getal van negen of tien cijfers en staat in App Store
Connect onder de app, bij *App Information → Apple ID*. Het Play-adres is nu
al goed: dat is niets anders dan het application id in een URL.

**Wacht echt tot ze opengaan.** Een winkelpagina bestaat pas als de winkel
hem heeft rondgestuurd, en dat kan bij Apple een paar uur duren nadat het
scherm al "Ready for Sale" zegt.

### 2. De website omzetten

Eén commando, in `darija-kids`:

```bash
npm run live -- --apple 6751234567 --google
```

Dat zet de twee adressen in `src/site/links.ts` en bouwt de site opnieuw.
Daarmee verdwijnt het blok "binnenkort", wordt de balk onderaan een
downloadknop, en worden de twee winkelknoppen echt. Het nummer bij `--apple`
mag ook de hele deellink uit App Store Connect zijn; het script haalt het ID
eruit.

Dan de push, want de productiebranch publiceert zichzelf:

```bash
git add -A && git commit -m "De app staat in de winkel" && git push
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
| **de avond** | De mail aan wie geen WhatsApp gebruikt |

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

Vóór de lancering zijn dit de aftelposten (LANCERING §16, fase 2). Ga je
meteen live, dan zijn het de eerste zeven dagen daarna. Eén per dag, en elke
post geeft iets — een aftelbericht zonder inhoud kost je volgers.

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
