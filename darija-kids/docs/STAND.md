# Waar staan we

Bijgewerkt op 1 oktober 2026, met de openingsactie op de boeken. Dit bestand
is het antwoord op "wat moet er nog" zonder dat je drie andere bestanden hoeft
te lezen.

## De app

| | |
| --- | --- |
| Inhoud | 17 units, 432 opnames, 304 woorden — af |
| Website | 8 pagina's × 6 talen, nagekeken op dode links en losse eindjes |
| Tests | 1289, groen — daar zitten de 77 van de worker al in |
| Google Play | 4 (1.2) op **Productie**, 177 landen — de winkelpagina is nog **niet publiek** |
| App Store | **1.0 (build 7) goedgekeurd, wacht op vrijgeven** — 1.1 (build 8) staat klaar voor de week erna |
| Uitbetalen | **rond bij allebei** — Google geverifieerd op 1 oktober |

### Goedgekeurd — 1 oktober, 16:46

*"We're pleased to let you know that your app, Darijaforkids, has been
approved for distribution."* Vierde ronde bij Apple, en de eerste die het
haalde. Build 7, versie 1.0.

**Niet vrijgegeven.** Bij het inzenden is *Manually release this version*
gekozen, dus de app staat klaar en wacht op jou. Dat is precies waarvoor die
keuze er was.

#### Waarom niet vandaag

De meeste mensen in het kanaal zitten op **Android**, en Play beoordeelt
inzending 4 nog — reken op 5 of 6 oktober. Vrijgeven bij Apple alleen betekent
dat je je aankondiging opmaakt voor de kleinste helft van je publiek en voor
de rest een tweede keer moet komen. Eén lancering is sterker dan twee halve.

Dat is geen wachten maar werken: het slot op de abonnementen gaat er door de
goedkeuring af, en dat was tot vandaag de reden dat een hoop niet kon.

#### Wat nu wél kan, en tot vandaag niet

| | |
|---|---|
| De proefperiode bij **Maand** nakijken | de kolom *Introductory Offers* in de prijzentabel; bij **Jaar** staat hij op 175 landen |
| De vier talen bij de drie aankopen | Frans, Duits, Spaans, Italiaans — de teksten staan klaar in `store/abonnement-teksten.md` |
| Nameten op een toestel | via TestFlight kopen en kijken wat het venster van Apple zélf zegt: staat er *3 dagen gratis, daarna € 59,99*? |
| Build 8 / versie 1.1 bouwen | de FAQ-reparatie, het geluidsadvies per toestel, edge-to-edge en het nieuwe keuzescherm zitten in de code en niet in build 7 |

### De afwijzing van 29 september, en wat eraan gedaan is

| Richtlijn | Wat Apple zag | Stand |
|---|---|---|
| **2.3.10** Accurate Metadata | de App Store-beschrijving noemde Google Play | **gerepareerd**, zes talen — plus vier schermen in de app zelf |
| **3.1.2(c)** Subscriptions | de omrekening naar een maand stond duidelijker dan het afgeschreven bedrag | **gerepareerd**, zes talen, nagemeten op de iPad waar Apple keek |
| **2.3.2** Accurate Metadata | bij alle drie de aankopen stond het app-icoon in het beeldveld | **gerepareerd** — `npm run iapbeeld` maakt er drie |

#### 2.3.10 zat op meer plekken dan Apple noemde

De regel luidt voluit: *"don't include names, icons, or imagery of other mobile
platforms or alternative app marketplaces **in your app or metadata**"*. Apple
noemde de beschrijving, maar dezelfde namen stonden op vier schermen ín de app:
het koopscherm, het ouderscherm, de privacyverklaring en de voorwaarden.

Alle winkelnamen komen nu uit één bestand, `src/i18n/winkels.ts`, dat per taal
en per platform de vorm geeft die de zin nodig heeft. Nagemeten in Chromium:
dertien routes met het platform op iOS, in zes talen — nul platformnamen.

Drie dingen die daarbij boven water kwamen en geen winkelnaam waren:

- De privacyverklaring waarschuwde dat de opname bij een spreekoefening naar
  de maker van de browser gaat, *"bij Chrome: Google"*. Die spraakherkenning
  is uit de code gehaald; wat er nu gebeurt is opnemen en jezelf terughoren,
  en de opname blijft op het toestel. Een onjuiste mededeling over de stem van
  een kind is erger dan een merknaam.
- De terugvaltekst *"een abonnement afsluiten kan in de app uit de App Store of
  Google Play"* stond achter een markering die niets verbergt. Die tekst
  verschijnt op een toestel zodra de winkel niet opstart.
- *"Apple en Google zijn de verkoper"* wordt met één winkel enkelvoud.

#### Wat er op 30 september is ingediend

Vijf items in één indiening, om 11:58:

| Item | Wat eraan veranderd is |
|---|---|
| `iOS App 1.0 (6)` | zeven beschrijvingen vervangen, build 6 gekozen |
| `Volledige toegang` | de groep, ongewijzigd maar verplicht mee |
| `app.darijaforkids.yearly` | Engelse en Nederlandse tekst, eigen beeld, nieuwe review-screenshot |
| `app.darijaforkids.monthly` | idem |
| `app.darijaforkids.ebook` | idem |

De beschrijving stond in **zeven** talen, niet zes: `French (Canada)` staat er
ook, en Nederlands is Primary. Een overgeslagen taal houdt zijn oude tekst,
dus die zeven moesten allemaal. De teller onder het veld is de controle: 427
is de oude tekst, 3850 tot 3970 de nieuwe.

#### Het werd build 7

Bij het kiezen van build 6 gaf App Store Connect een fout. In plaats van er
aan te trekken is er een nieuwe archivering gemaakt en als **build 7**
geüpload; dat is de bundel die nu in beoordeling ligt. Aan de app zelf is
tussen 6 en 7 niets veranderd — dezelfde code, een ander nummer.

Dat `npm run ios -- --build <n>` het nummer stil liet vallen als er geen
`ios/`-map was, is dezelfde dag gerepareerd: het script stopt nu met een
foutmelding in plaats van met exitcode 0. Een build archiveren met het oude
nummer is precies hoe je twee keer hetzelfde bij Apple aanbiedt.

**Wat niet in build 7 zit:** de platformnamen in de FAQ op de landingspagina.
Die reparatie stond klaar maar kwam na het uploaden, en opnieuw archiveren om
één tekst zou de beoordeling met dagen terugzetten.

**De reparatie is op 1 oktober nagemeten en staat klaar voor de volgende
bundel.** Niets meer te doen aan de code; alleen archiveren.

De regel is preciezer dan "geen winkelnamen": 2.3.10 verbiedt de **andere**
winkel. Je eigen winkel noemen mag, en dat moet ook — een koper die zijn
abonnement wil opzeggen heeft die naam nodig. Nagemeten over zes talen en
allebei de platforms, met de andere winkel als zoekpatroon: **nul treffers**.

Wat er wél staat, en dat is precies goed:

| Platform | De FAQ zegt |
|---|---|
| iOS | "…in de app via **de App Store** en je zegt daar ook op" |
| Android | "…in de app via **Google Play** en je zegt daar ook op" |
| website | "…via **de App Store of Google Play**" |

Let op het lidwoord: *de* App Store, maar Google Play zonder. Dat zit in
`winkels.ts` omdat het per taal verschilt — in het Duits is het "über den App
Store" naast "bei Google Play".

Een eerdere meting hiervan gaf veertien treffers en dat was vals alarm: hij
zocht ook de eigen winkel, en `ios` zit als lettergreep in Spaanse woorden als
*ejercicios*. Zoek dus op de andere winkel, met woordgrenzen.

#### Het slot, en hoe we eruit kwamen

De aankopen stonden op **Ready for Review** in de afgewezen indiening van
28 september en waren daardoor alleen-lezen. Vijf manieren geprobeerd, alle
vijf dicht:

| Geprobeerd | Wat er gebeurt |
|---|---|
| Localisatie openen | een kijkvenster zonder invulvelden, alleen een knop *Done* |
| `Add for Review` | grijs |
| `Edit` bij de abonnementenlijst | de selectievakjes zijn uitgeschakeld |
| De beeldtegel | krijgt een blauwe rand, maar er opent geen bestandskiezer |
| Een item uit de indiening halen | alleen de app-versie heeft een actie |

Wat het wél losmaakte: **Cancel Submission**, onderaan de indieningspagina.
Het bevestigingsvenster waarschuwt alleen dat geaccepteerde items opnieuw
moeten — en er was niets geaccepteerd. Daarna stonden alle vier de items op
*Developer Rejected* en waren ze bewerkbaar.

Twee dingen die daarbij misgingen en de volgende keer tijd schelen:

1. **De app-versie alleen indienen werkt niet.** Om 11:43 ging er een
   indiening weg met één item. Apple weigert een abonnementsgroep zonder
   abonnement, én de aankopen moeten mee met de versie — anders staat de app
   straks in de winkel waar niemand iets kan kopen. Die indiening moest dus
   weer ingetrokken worden.
2. **`Add for Review` opent een keuzemenu.** Daar staat de bestaande *Draft
   Submission* én *Create New Submission*. De tweede maakt een losse
   indiening; alles hoort in dezelfde.

De volgorde die werkt: eerst alles bewerken, dan per item `Add for Review` →
de bestaande draft kiezen, dan de app-versie erbij, en pas verzenden als het
paneel **5 items** toont en de gele waarschuwing weg is.

#### 3.1.2(c): nagemeten, niet aangenomen

Apple eist niet dat het jaarbedrag er staat — dat stond er — maar dat het
het duidelijkste element is. Op de iPad Pro 11-inch waarop zij keken, in alle
zes de talen: **24px/800 voor € 59,99, 12px/400 voor de omrekening**, en het
jaarbedrag staat erboven.

#### 2.3.2: drie eigen promotieafbeeldingen

Het veld heet in App Store Connect **Image (Optional)**, 1024×1024, boven
*App Store Promotion*. Daar stond bij alle drie de aankopen het app-icoon —
dus niet uniek, en precies het ene beeld dat Apple uitsluit. `npm run
iapbeeld` maakt er drie van 1024×1024, getekend, elk anders, zonder tekst en
met de hoek linksonder leeg — daar legt Apple zelf de prijs overheen. Ze staan
in `store/iap-beelden/` en heten naar hun product-id.

Apples kortste uitweg — de promotieafbeelding gewoon verwijderen — hoeft dus
niet meer. Verwijderen mag nog steeds, als je de aankopen niet wilt promoten.

Wat er in build 5 zit en niet in build 4: het antwoord op richtlijn 4.2
(microfoon, trillen, herinnering, breder op een iPad — zie `docs/APPLE-4.2.md`)
en de twee prijsreparaties (`$4.17` in plaats van `US$ 4,17`, en de prijzen
opnieuw ophalen zodra de app weer voor staat).

**Bouwen doe je met `npm run ios`**, niet met `npx cap sync ios`. Dat zet ook
de twee regels in `Info.plist` — waaronder die voor de microfoon, en zonder
die regel sluit iOS de app af zodra een kind op de opnameknop drukt.

Het antwoord aan App Review staat klaar in `store/appstore-4.2-antwoord.md`.

### Google Play staat klaar, niet in concept — 30 september

Op het overzicht van alle apps staat bij *App status* het woord **Draft** met
*Internal testing* eronder. Dat leest als "er staat niets op productie", en
dat is het niet. Het dashboard van de app zelf zegt:

```
Production      Active · 0 active devices · 177 countries / regions
Update status   In review
```

Build 4 (1.2) staat dus op Productie in 177 landen en wacht op de review. Die
"Draft" slaat erop dat de app nog nooit is goedgekeurd, en daarom staat er
ook nog een tijdelijke naam: `app.darijaforkids.learn (unreviewed)`.

#### De twee aanbevelingen op het release-dashboard

Allebei *recommended*, geen van beide blokkeert iets.

**Edge-to-edge may not display for all users.** Google's tekst: *"Apps
targeting SDK 35 should handle insets to make sure that their app displays
correctly on Android 15 and later. [...] Alternatively, call
`enableEdgeToEdge()` [...] for backward compatibility."*

Het eerste doen we: `viewport-fit=cover` staat in de meta-viewport, en
`--rand-boven` en `--rand-onder` komen uit `env(safe-area-inset-*)` en gaan
naar de bovenbalk, de landingspagina, het oefenscherm, het paneel en de
tabbalk. `randen.test.ts` bewaakt de voorwaarde: zonder die viewport-meta
blijven die waarden altijd nul.

Het tweede — `enableEdgeToEdge()` — is hun alternatief en is cosmetisch: het
zorgt dat het er op Android 14 en lager óók zo uitziet. **Niet gedaan, en
bewust.** Op die toestellen tekenen de systeembalken nu hun eigen achtergrond
en overlapt er niets. Zet je edge-to-edge daar wel aan, dan moeten de insets
er ook kloppen, en doen ze dat niet dan schuift de bovenbalk van de app onder
de statusbalk. Dat test je met een toestel in je hand, niet blind.

**R8 optimization.** Een advies over geheugen en bestandsgrootte. Ook niet
gedaan; het raakt niets dat kapot is.

### Richtlijn 2.3.8, twee rondes — de app wordt een kinderapp

Op 25 september viel Apple over de **ondertitel**. Die is in alle zes de talen
vervangen en dezelfde build is opnieuw ingediend. Op 27 september viel hij over
de **naam** zelf: `Darijaforkids` bevat *for kids*, terwijl de app niet in de
Kinderen-categorie was ingediend. Dat risico stond al als open punt genoteerd.

Hernoemen is geen optie — dat is het merk, het domein, de socials en de
titelpagina van tweeënnegentig boeken. Dus gaat de app de Kinderen-categorie
in, en dat is ook eerlijker: bij Google Play staat hij al aangemeld als
hoofdzakelijk voor kinderen.

Het dure deel was al af (geen advertenties, geen analytics, geen externe SDK's,
en de ouderpoort bestond al). Wat ontbrak zat in de app en is nu gemaakt: acht
plekken waar een kind zich met één tik de app uit kon werken staan achter de
poort, en het handelsblok is afgedrukt in plaats van gelinkt. Eén daarvan was
geen categoriekwestie maar een echt gat: **het e-boek kopen stond achter niets**.

`src/ui/kinderslot.test.ts` bewaakt het. Het volledige verhaal, het antwoord
aan App Review en wat jij in App Store Connect aanzet, staat in
`docs/APPLE-2.3.8.md`.

**Gedaan op 27 september.** *Made for Kids* staat aan met leeftijdsband 6–8,
het korte antwoord uit `docs/APPLE-2.3.8.md` is via Reply to App Review
verstuurd, en build 5 is ongewijzigd opnieuw ingediend. Er ligt dus geen nieuw
bestand bij Apple — alleen een andere classificatie.

Apple zegt er zelf bij: *once your Made for Kids app is approved by App Review,
all subsequent updates will need to follow the Kids category guidelines*. Vanaf
de goedkeuring is build 6 dus geen keuze meer maar een voorwaarde voor 1.1.

**Build 6 is van ons, niet van Apple.** De reparaties hierboven staan klaar op
de branch. Komt build 5 erdoor, dan worden ze versie 1.1; wijst een reviewer
alsnog af op richtlijn 1.3, dan ligt het antwoord er al. Op de Mac:
`npm run ios -- --build 6`, dan archiveren.

### Handelsverificatie — gedaan

Apple heeft de handelaarsverificatie voor de Digital Services Act op
**24 september goedgekeurd**; het KvK-uittreksel was genoeg. De
handelaarsgegevens staan nu live in de App Store in de hele Europese Unie.

Daarmee is het laatste papierwerk weg dat niet over de app zelf ging. Wat er
nog tussen jou en de winkel staat is de beoordeling van build 5, en verder
niets.

### De dollarprijs op het keuzescherm — afgehandeld

In TestFlight staat er `$49.99` en `$5.99` op het keuzescherm terwijl het
betaalvenster van Apple keurig euro's toont. Daar is niets aan kapot.

In App Store Connect staat **Netherlands (EUR) € 59,99**; dat is nagekeken in
de prijzenlijst zelf. Een koper in Nederland krijgt in de uitgebrachte app
dus € 59,99 te zien, precies wat de website en de vijf winkelschermafdrukken
beloven. TestFlight vraagt de productgegevens alleen bij een dollarwinkel op,
en dat verandert niet door in App Store Connect aan de prijzen te draaien —
een prijswijziging verandert hoogstens wélk dollarbedrag er staat.

Dus: niet meer aan sleutelen. De proef die telt is de app uit de App Store op
een Nederlands account. Wie het eerder zeker wil weten, zet onderaan de
ouderpagina het blok **Winkelgegevens** open: daar staat `EUR` of `USD`
letterlijk, en dat blok zit vanaf de volgende build in de app.

Wat in App Store Connect wél nog open staat, gaat niet over jouw scherm maar
over de andere 174 landen — zie de drie open punten bij *De producten — Apple*
in `docs/LAUNCH.md`.

Dezelfde verbeteringen gaan als 1.2 naar Play, en daar is de oorzaak van de
afwijzing inmiddels gevonden. De bundel van versie 2 bevatte `?.` en `??` --
223 en 167 keer -- en dat is syntaxis van Chrome 80. Met minSdkVersion 24
beloof je Android 7, waar een WebView van Chrome 51 kan staan, en die leest
zo'n bestand niet eens in: wit scherm, geen melding. Het bouwdoel staat nu op
es2015, gelijk aan die belofte.

Versiecode 4 is op 29 september ingediend bij Google, samen met negentien
wijzigingen aan de vermelding en de verklaringen. Zeven dagen, mogelijk langer.
Managed publishing staat aan, dus na goedkeuring gaat de app pas live als Adil
erop drukt. Wat er dan moet gebeuren, en wat al is uitgesloten mocht het weer
misgaan, staat in `docs/ACTIES.md`.

De "wat is er nieuw"-tekst voor beide winkels staat in zes talen in
`store/wat-is-nieuw-1.2.md`.

### De eerste belangstelling, geteld

Op 1 oktober in het postvak nageteld, uit de berichten met onderwerp "Hou me
op de hoogte":

| | |
|---|---|
| Berichten | 12 |
| Verschillende mensen | 11 — iemand stuurde twee keer, drie minuten na elkaar |
| Wanneer | elf op woensdag 30 september, tussen 15:21 en 22:03; één de ochtend erna |
| Kanaal | 43 volgers op dag één |

Woensdag is de dag dat het WhatsApp-kanaal begon. De belangstelling kwam dus
binnen uren, en dat is het eerste harde bewijs dat dat kanaal werkt.

**Alle twaalf kwamen van een telefoon.** De handtekeningen zeggen "Outlook voor
Android" of "Verstuurd vanaf mijn iPhone"; geen enkele van een computer. Dat is
geen toeval maar het gebrek van de mailto-knop: die opent alleen iets als er een
mailprogramma is ingesteld, en op een laptop is dat vaak niet zo. Hoeveel mensen
daar klikten en niets zagen gebeuren weet niemand — daar bestaat geen spoor van.

**De namen staan hier niet.** Die horen niet in een repository: die gaat naar
GitHub, komt in elke checkout terecht en blijft in de geschiedenis staan ook als
je het bestand later weghaalt. Ze zijn als csv aan Adil gegeven voor zijn eigen
administratie.

### "Hou me op de hoogte" schrijft nu in de database

Tot 1 oktober was die knop een `mailto:`-link. Dat kost op twee manieren.

Een mailto doet niets als er geen mailprogramma is ingesteld — op een laptop
eerder regel dan uitzondering. De bezoeker klikt, ziet niets gebeuren, en is
weg; wij merkten er niets van. En als het wél werkte kwam er een mail in een
postvak: dat is geen lijst. Op de lanceerdag moet iemand die adressen met de
hand overtikken, zonder te weten welke taal ze spraken en zonder bewijs van
toestemming.

`POST /aanmelden` op de worker deed dit allemaal al — taal opslaan,
bevestigingsmail sturen, de rij pas op `bevestigd` zetten als de link is
aangeklikt. De app gebruikte die route al; de website niet. Nu wel.

Nagemeten in een echte browser op de gezette site: een geldig adres levert één
verzoek op met `{email, taal, nieuws: true, voortgang: false}`, het formulier
verdwijnt en de bevestiging verschijnt. Een adres met een typefout levert nul
verzoeken op en een foutmelding in de taal van de bladzijde.

Twee dingen die onderweg stilletjes mis hadden kunnen gaan:

- Het blok staat **twee keer** op een bladzijde en droeg zijn script twee keer
  mee, dus bond het tweede script ook het eerste formulier: één klik, twee
  verzoeken. Er zit nu een rem op.
- `display: flex` wint van de `display: none` van het hidden-kenmerk, dus het
  formulier bleef staan ná het versturen, onder "kijk in je mail".

**De boekenbladzijde heeft hetzelfde gekregen**, met een eigen onderschrift:
daar gaat het over een nieuw deel en niet over de app. De rest is gelijk, want
het is één lijst. Nagemeten in het Nederlands en het Duits: één verzoek, met de
taal van de bladzijde erin.

Wat er aan `mailto:` overblijft op de site zijn zes contactknoppen ("hoe werkt
het afrekenen") en zes kale mailadressen. Dat zijn vragen en geen aanmeldingen,
en die horen een mailto te zijn.

### De Play-winkelpagina is nog dicht

Op 30 september nagekeken in een venster zonder inlog:
`play.google.com/store/apps/details?id=app.darijaforkids.learn` geeft
**404 — Not found on this server**. De vermelding staat in de console op
Productie in 177 landen, maar buiten de console is er niets te zien.

Het adres is nagelopen en klopt: `applicationId "app.darijaforkids.learn"` in
`android/app/build.gradle`, gelijk aan `appId` in `capacitor.config.ts` en aan
wat `playStoreUrl()` bouwt.

Een 404 zegt bovendien méér dan een lege pagina. Was de app ooit gepubliceerd
en daarna beperkt, dan geeft Play een pagina met "niet beschikbaar in jouw
land". *Not found* betekent: deze vermelding is nooit naar buiten gegaan. Wat
in de console op Productie staat is de inrichting van de track, niet een
release die het publiek kan zien.

Dat is geen storing — het is managed publishing die zijn werk doet. En het is
consistent met de website, want `npm run live` meldt voor allebei de winkels
"leeg, de website zegt binnenkort". Er is dus geen bezoeker die naar een dode
knop loopt.

**Nagekeken op Publishing overview: *In review*.** *Changes ready to publish*
is leeg, er ligt dus niets op ons te wachten. Google is bezig.

Het Dashboard verklaart de rest: de tijdelijke naam is
`app.darijaforkids.learn (unreviewed)`. Dat betekent niet "nog nooit bekeken"
maar **nog nooit goedgekeurd** — inzending 3 is op 23 september wel degelijk
beoordeeld en afgewezen. Zolang er geen goedkeuring ligt draagt de app bij
Google zijn eigen naam niet, staat de winkelpagina op 404 en telt hij nul
actieve apparaten. Drie dingen die los alarmerend lijken en samen precies
kloppen.

Submission activity, voor wie de reeks wil narekenen:

| # | Ingediend | Uitkomst |
|---|---|---|
| 4 | 29 sep | **In review** — met Closed testing erbij, dat had 3 niet |
| 3 | 23 sep | afgewezen — het witte scherm, `?.` en `??` in de bundel |
| 2 | 22 sep | zelf ingetrokken |
| 1 | 21 sep | zelf ingetrokken |

Google rekent voor een app zonder goedkeuring tot zeven dagen, bij een nieuw
ontwikkelaarsaccount soms langer; reken op 5 of 6 oktober en schrik niet van
later.

Zodra het groen is verschuift het blok naar *Changes ready to publish* en
verschijnt er een knop **Publish**. Managed publishing staat aan, dus ook dan
kiezen wij de dag.

Voor de volgende keer, want dit is de stille van de drie: staat er ooit
*Changes ready to send for review*, dan is er nooit iets verstuurd. Dat blijft
eindeloos staan zonder dat er ergens iets rood kleurt.

### Klaar voor de volgende ronde — 1.1 bij Apple, 1.3 bij Play

De nummers lopen uiteen omdat de winkels niet gelijk op gaan: bij Apple is 1.0
de eerste die de beoordeling haalt, bij Play staat 1.2 al live. Het is dezelfde
bundel code, en de "wat is er nieuw"-tekst staat in zes talen in
`store/wat-is-nieuw-1.1.md`. `winkelnieuws.test.ts` bewaakt dat elk bestand
alle zes de talen heeft en dat geen taal over de 500 tekens van Play gaat —
Play kapt niet af maar weigert de release, en dat merk je pas als de bundel er
al ligt.

Deze zitten in de code maar **niet in versiecode 4 en niet in build 7**, want
die lagen al bij de winkel toen ze werden gemaakt. Ze gaan mee in de volgende
bundel.

#### De lancering gaat met build 7, niet met build 8 — besloten 1 oktober

Build 8 is gebouwd en gearchiveerd (`1.1 (8)`, arm64) en gaat naar TestFlight.
Hij wordt **niet ingediend voor de lancering.**

Een goedgekeurde versie zit vast aan zijn build: build 8 onder 1.0 schuiven
kan niet zonder een nieuwe beoordeling. De keuze was dus tussen lanceren met
wat goedgekeurd is, of een goedkeuring terugleggen op tafel voor een nieuwe
ronde van één tot drie dagen — met een beoordelaar die dan voor het eerst het
keuzescherm na de taalkeuze ziet, precies het soort scherm dat onder richtlijn
3.1.2 valt. Dat is de richtlijn waarop 1.0 al eens omviel.

Vier rondes gekost om hier te komen. Die winst geef je niet terug voor een
FAQ-regel waar de beoordelaar zelf overheen las.

Hetzelfde geldt bij Play, en om dezelfde reden: inzending 4 (versiecode 4,
1.2) ligt in beoordeling, en een nieuwe bundel uploaden zet die beoordeling
opnieuw. Allebei de winkels lanceren dus met wat er ligt.

**Wat de lancering daarmee draagt** en wat er in 1.1 / 1.3 gerepareerd wordt:

| In build 7 en versiecode 4 | |
|---|---|
| De FAQ op de landingsbladzijde noemt beide winkels | Apple is er deze ronde zelf overheen gegaan |
| Het geluidsadvies wijst op Android naar een schuifje dat daar niet zit | |
| Knoppen kunnen onder de balk van Android 15 liggen | de taalkeuze en de volgende-vraagknop |
| Geen keuzescherm na de taalkeuze, geen kaartje na de laatste gratis les, geen knop in de kopbalk | de weg naar het abonnement loopt alleen via een slotje |
| Het e-boek komt bij het jaarabonnement meteen vrij, ook tijdens de proef | |

Die laatste is de enige die geld kost. Drie dagen lang kan een koper het jaar
afsluiten, het boek opslaan en opzeggen. Bij een lancering met enkele tientallen
kopers is dat te overzien, en 1.1 volgt binnen een week — maar het is de reden
om 1.1 niet te laten liggen.

**Indienen: de week ná de lancering.** Dan staat de app in de winkel en kost
een afwijzing niets.

**Het geluidsadvies per toestel.** De uitleg bij "er komt geen geluid uit"
wees naar het stilteschuifje aan de zijkant van een iPhone. Op Android bestaat
dat niet, en een kind dat die raad opvolgt zoekt naar een knop die er niet is.
`geluidUitUitleg`, `mixerStil` en `checkGoed` nemen nu een `stilte`-vlag en
geven per toestel het advies dat klopt: op Android het mediavolume, dat losstaat
van het belvolume. `geluidsadvies.test.ts` bewaakt de 24 combinaties.

**De schakelaar die niets deed.** *Geluid via het mediakanaal* stuurt het geluid
langs `<audio>`-elementen in plaats van door de mixer, en dat heeft één nut: het
stilteschuifje van een iPhone omzeilen. Op Android en op de website stond er dus
een knop die alleen traagheid toevoegde. `heeftStilteschakelaar()` verbergt hem
nu, tenzij hij al aan stond — anders kan niemand hem meer uitzetten.

**De platformnamen in de veelgestelde vragen.** De FAQ op de landingspagina
noemde nog beide winkels. Dat viel bij de eerste meting niet op omdat
`innerText` de inhoud van een dichtgeklapte `<details>` overslaat; met alles
opengeklapt stonden er drie platformnamen. De meting én de bewaking zijn
gerepareerd.

**De weg naar het abonnement, op elk scherm.** Er was er één: ergens tegen een
slotje aanlopen. Wie na vier gratis lessen nog eens wilde kijken wat het kost,
moest eerst een gesloten deur zoeken. Nu staat er een knop in de kopbalk —
overal waar die balk staat, dus niet in een les en niet op de
landingsbladzijde. Weg zodra er betaald is. `raakvlak.test.ts` bewaakt het
raakvlak van 44, het verdwijnen bij betaald, en dat het woord op geen enkele
breedte wegvalt.

**Het kaartje als de gratis lessen op zijn.** Wie de vierde gratis les
afmaakte kreeg zijn sterren, een knop "verder op pad", en liep daarna tegen een
slotje aan waar niemand hem voor gewaarschuwd had. Nu staat de mededeling op
het scorescherm, onder de beloningen, en wisselen de twee knoppen van plek —
"verder op pad" is op dat moment immers een knop naar een slot.

**Het e-boek pas na de proefperiode.** Het boek zit bij het jaarabonnement en
het is een pdf: wie hem één keer opent, houdt hem. Iemand kon het jaar
afsluiten, het boek opslaan en op dag twee opzeggen — nul betaald, een product
van € 14,99 mee. Nu is er een toezegging (`ebookVanaf`) en een boek (`ebook`),
en het tweede komt er alleen als de dag voorbij is én de winkel dan nog zegt
dat het abonnement loopt. Zie `docs/PAYMENTS.md` voor de twee dingen die dit
niet oplost.

**Het keuzescherm na de taalkeuze.** Nieuw, en het hoort **in 1.1 en niet in
een reparatiebuild**: een productwijziging meesturen met een afwijzingsherstel
geeft de beoordelaar een nieuwe reden om te kijken.

Het pad had één plek waar het abonnement ter sprake kwam — les vijf, waar de
gratis lessen ophouden. Dat is de goede plek voor wie aan het uitproberen is
en de verkeerde voor wie al overtuigd binnenkomt, en dat tweede is hier geen
bedenksel: wie de app krijgt van iemand die hij kent, heeft het verhaal al
gehoord voordat hij hem opende. Die moest eerst vier lessen doorlopen voordat
hij kón betalen.

Nu staat de vraag er één keer, direct na de taalkeuze, en hij blokkeert niets:
de knop *eerst de gratis lessen* is even breed als de koopknop. Kopen gebeurt
er niet — de knop gaat naar `/volledig`, waar de ouderpoort staat, de
verplichte voorwaardentekst, de prijs uit de winkel zelf en de knoppen om
terug te zetten en op te zeggen. `aanbod.test.ts` bewaakt dat het paneel zelf
niets koopt, dat het achter alle vier de voorwaarden blijft en dat allebei de
knoppen onthouden dat er geantwoord is.

Nagemeten in Chromium op 390 bij 844, in zes talen en in licht en donker:
afslaan bewaart `aanbodGezien`, het paneel blijft na herladen weg, de koopknop
landt op `/volledig`, en zonder winkelbibliotheek — de website — verschijnt het
helemaal niet.

**De zin op het welkomscherm.** Daar stond *"Je begint gratis. Na 3 dagen is
de volledige cursus vanaf € 5,00 per maand"*, in zes talen. Dat leest als een
proefperiode die bij de installatie begint en waarna de app stopt. Dat is niet
wat er gebeurt: de vier gratis lessen verlopen nooit, en de drie dagen horen
bij het abonnement en beginnen pas als iemand dat afsluit. Die zin heeft die
verwarring aantoonbaar veroorzaakt — hij kwam zo terug in een vraag — en zegt
nu wat er werkelijk is: *"De hele cursus is een abonnement: de eerste 3 dagen
gratis, daarna vanaf € 5,00 per maand. Opzeggen kan altijd."*

**Edge-to-edge.** Play Console meldde het bij versiecode 4: vanaf Android 15
tekent een app die SDK 35 of hoger target standaard tot in de hoeken, en dan
ligt er inhoud onder de statusbalk en de gebarenbalk. Vijf plekken hadden dat
nodig, en twee ervan waren meer dan een schoonheidsfoutje: de knop in het paneel
dat van onderen opkomt (de taalkeuze bij de eerste start) en de knop naar de
volgende vraag in een les. Ligt zo'n knop onder de gebarenbalk, dan komt een
kind niet verder.

Alle vijf nagemeten in Chromium met de inset op 48px tegen dezelfde bouw met
0px; `randen.test.ts` bewaakt ze.

**R8 blijft uit.** Play Console raadt het aan, maar `minifyEnabled false` was
een bewuste keuze om R8 als oorzaak van de afwijzing uit te sluiten. Aanzetten
terwijl er een reparatie in beoordeling ligt voegt een onbekende toe. Pas als
versie 4 door is, en dan als een eigen wijziging.

### Nog na te kijken bij Google Play — kijken, niet wijzigen

Drie dingen die pas opvallen als het te laat is. **Zolang inzending 4 in
beoordeling ligt zijn het alle drie leesopdrachten.** Dat is niet
voorzichtigheid om de voorzichtigheid: een wijziging onder *App content* is
zelf een wijziging die beoordeeld moet worden, en die kan de lopende
inzending verlengen of opnieuw laten beginnen. Staat er iets echt verkeerd,
dan is dat die dagen waard. Staat het goed, dan kost eraan zitten je precies
die dagen voor niets.

**Ze staan waarschijnlijk al ingevuld.** Play laat een release niet naar
Productie zolang een verplicht onderdeel van *App content* onbeantwoord is, en
inzending 4 staat op Productie. De vraag is dus niet óf er een antwoord staat
maar of het het goede is.

1. **App access.** Play Console → App content → App access. De app heeft geen
   inlog, en dan is het antwoord *All functionality is available without
   special access*. Zou het leeg staan, dan wijst een reviewer af omdat hij
   denkt dat hij ergens niet bij kan.
2. **Managed publishing.** Publishing overview → Manage. **Staat aan**,
   nagekeken op 30 september — dat is ook de verklaring voor de 404 op de
   winkelpagina.
3. **Target audience and content.** Play Console → App content → Target
   audience and content. Dit is Google's versie van de vraag waarop Apple
   afwees: voor welke leeftijden is de app. Staan er kinderleeftijden, dan
   geldt het Families-beleid — geen advertenties van derden, geen trackers.
   De app voldoet daaraan; het moet alleen kloppen met wat er staat.

#### Waar je het vindt

Begin hier, en log in met het account waar de app onder staat:

```
https://play.google.com/console
```

Klik Darijaforkids aan. Dan **het zoekveld bovenin de console** — niet het
linkermenu. Typ er het woord in en hij springt naar de bladzijde:

| Typ dit | Waar je uitkomt |
|---|---|
| `App access` | het veld met *All functionality is available without special access* |
| `Target audience` | de leeftijden, en of het Families-beleid geldt |
| `Publishing overview` | daar staat *Managed publishing* onder **Manage** |

Het zoekveld boven het menu, omdat Google dat linkermenu de afgelopen jaren
een paar keer heeft omgegooid. Werkt het zoeken niet, dan staan de eerste twee
in het linkermenu onder **Policy and programs → App content** — maar kijk dan
eerst of de kop bij jou anders heet voordat je gaat zoeken.

#### Waarom hier geen commando bij staat

Nagemeten op 1 oktober, in het discovery-document van de Android Publisher
API (`androidpublisher.googleapis.com/$discovery/rest?version=v3`):
**honderdvijfenveertig methodes, en geen enkele raakt App access, Target
audience, de leeftijdsclassificatie of managed publishing.** Gezocht op
`access`, `audience`, `rating`, `content` en `declar`; het enige onderdeel van
*App content* dat de API kent is Data safety, en dat alleen als POST — er is
niet eens een GET om terug te lezen wat er staat.

`play-vermelding.mjs` kan dus de hele winkelvermelding in zes talen
versturen, en deze drie velden niet. Dat is geen gat in het script maar een
gat in de API. Het staat hier opgeschreven zodat niemand het nog eens
uitzoekt.

### De proefperiode: in de app beloofd, in de winkels nog niet aangetoond

De app zegt in zes talen dat de eerste **drie dagen gratis** zijn, en dat
opzeggen binnen die drie dagen niets kost. Dat getal staat op één plek in de
code — `TRIAL_DAYS` in `src/engine/billing.ts` — maar de **echte**
proefperiode zit niet in de code. Die zit in het winkelproduct:

| | Waar het aan moet staan |
|---|---|
| App Store Connect | het abonnement → **Introductory Offer** → *Free Trial*, 3 dagen |
| Play Console | het abonnement → basisplan → **Aanbieding** → *Gratis proefperiode*, 3 dagen |

**Nergens in dit bestand staat dat die twee aanbiedingen daadwerkelijk zijn
aangemaakt.** `docs/PAYMENTS.md` en `docs/PLAY.md` beschrijven hoe het moet;
of het gebeurd is, is niet vastgelegd. Dat is de ene openstaande vraag die
geld kost zodra de app live is.

Wat er misgaat als het er niet staat: de koper leest "drie dagen gratis",
drukt op kopen, en de winkel schrijft meteen € 59,99 af. Dat levert
terugbetalingen op, eenster-beoordelingen in de eerste week, en bij Apple een
afwijzing op **3.1.2** — dezelfde richtlijn waarop 1.0 al eens is afgewezen,
toen om de omrekening naar een maand.

Omgekeerd kan het ook: staat de proefperiode er wél en zou je hem niet willen,
dan zet je `TRIAL_DAYS` op 0 en passen de teksten zich aan. Maar de twee
moeten hetzelfde zeggen.

**Op 1 oktober vastgesteld bij `app.darijaforkids.yearly`: de proefperiode
staat er, voor alle 175 landen.** In de tabel onder *Subscription Prices*
staat een kolom **INTRODUCTORY OFFERS (175)** met op elke regel *Free for the
first 3 days*. De app en de winkel zeggen dus hetzelfde, en wat hier eerder
stond — dat het blok ontbrak — was een leesfout van twee schermafdrukken met
een gat ertussen.

Waar je het vindt, want het staat niet waar de naam doet vermoeden: er is geen
kop "Introductory Offers". Het is een **kolom in de prijzentabel**, en
aanmaken gaat via de blauwe ⊕ naast *Subscription Prices* → *Create
Introductory Offer*.

**Nog niet nagekeken:** hetzelfde bij `app.darijaforkids.monthly`, en de
gratis proefperiode bij de twee abonnementen in Play Console. Eén van de vier
is dus aangetoond.

**Het scherm van de app is geen bewijs.** `Unlock.tsx` en `Welcome.tsx` tonen
`TRIAL_DAYS`, en dat is een vast getal in de code; de app leest de prijsfasen
van het aanbod niet uit. Er staat dus "3 dagen gratis" op het koopscherm of de
winkel die proef nu kent of niet. Wat je wél kunt geloven is het
**aankoopvenster van Apple zelf**, dat over het scherm van de app heen komt:
dat venster maakt Apple uit het product. Staat er *3 dagen gratis, daarna
€ 59,99* in, dan bestaat de aanbieding. Staat er alleen € 59,99, dan niet.

Dat is meteen de test die `docs/PAYMENTS.md` al voorschreef — afsluiten met
proefperiode, opzeggen tijdens de proefperiode — en hij kan via TestFlight op
een echte iPhone, ook nu de versie in beoordeling ligt.

**De volgorde voor de lanceerdag blijft staan**, want hij geldt voor de drie
die nog niet zijn nagekeken: eerst aantonen dat de proef bestaat, dan pas
vrijgeven. Hij staat nu als stap 0 in `docs/GO-LIVE.md`.

#### En wat het trechtermodel nu is

Het is geen betaalmuur vóór de download, en dat is met opzet:

1. **Downloaden is gratis.** Beide winkels, geen bedrag vooraf.
2. **Vier lessen zijn gratis en blijven gratis** — `GRATIS_LESSEN` in
   `src/engine/store.ts`: drie stukken alfabet en de eerste les groeten,
   samen een minuut of twaalf. Geen account, geen e-mailadres, geen kaart.
3. **Daarna de abonnementskeuze**, met drie dagen gratis. Die drie dagen
   starten is wél een betaalhandeling: de winkel vraagt om de pas en om Face
   ID of een wachtwoord. Wie niet binnen drie dagen opzegt, betaalt € 59,99
   per jaar of € 6,99 per maand.

Een betalende gebruiker is dus: downloaden → vier lessen → proef starten →
niet opzeggen. Wie een harde betaalmuur bij de download wil, moet van een
gratis app met aankopen naar een **betaalde app** — een ander product in beide
winkels, een nieuwe beoordeling, en het einde van "de eerste vier lessen zijn
gratis" als uitnodiging. Dat is een productkeuze, geen instelling.

### Negen opdrachten die geen pad en geen waarde meer vragen

| | |
|---|---|
| `npm run inloggen` | één keer, wrangler bij Cloudflare |
| `npm run deploy` | de worker uitrollen |
| `npm run schema` | de migraties toepassen (mag altijd opnieuw) |
| `npm run koopgeheim` | nieuw geheim, en het hele Gumroad-adres op je klembord |
| `npm run mailsleutel` | de sleutel van de mailpartner, nagekeken vóór hij wordt opgeslagen |

Brevo nog niet ingericht? `docs/BREVO.md` loopt het in vijf stappen door —
inclusief waarom dit niet vanuit Cloudflare kan, en welke drie DNS-regels er
wél in het Cloudflare-dashboard horen.
| `npm run bestellingen` | wie wat kocht, en of een sleutel rondgaat |
| `npm run intrekken` | een sleutel intrekken, en met `-- --terug` weer teruggeven |
| `npm run proefkoop` | een aankoop naspelen, om het portaal na te lopen |
| `npm run logboek` | welke geheimen er staan, en meekijken met de worker |

Ze draaien alle negen vanuit de projectmap. Wil je er niet eerst heen, gebruik
dan `npm --prefix <de projectmap> run <naam>` — dat werkt vanuit elke map en
kan dus niet op de verkeerde plek terechtkomen.

`npm run schema` past de migraties toe die nog niet gedraaid hebben. Wrangler
houdt in de tafel `d1_migrations` bij welke dat zijn, dus een tweede keer doet
niets. Een wijziging aan de database is voortaan een nieuw genummerd bestand:
`npm run schema -- --nieuw <naam>` maakt hem, en `--hier` probeert hem eerst op
de lokale kopie.

Ze draaien allemaal vanuit `darija-kids` — geen `cd server` meer. Dat was
niet luxe: `cd C:\...\darija-kids\server` is een keer letterlijk geplakt,
met de puntjes erin, en `npm run deploy` in de thuismap klaagt dan over een
ontbrekende `package.json`.

Om dezelfde reden vraagt `npm run live -- --google` zelf om het Apple ID in
plaats van het in de opdracht open te laten. Er staat nergens in dit project
nog een blok om te plakken met iets tussen punthaken; `documentatie.test.ts`
valt als er weer een verschijnt.

### Wat alleen jij kunt doen

1. ~~**Apple: prijsbasis op Nederland.**~~ **Zo gelaten, met opzet.** De
   prijzen zijn aangemaakt met de Verenigde Staten als uitgangspunt en de
   eurolanden zijn daarna met de hand bijgewerkt. Nederland staat goed op
   € 59,99 en € 6,99. Wat scheef bleef: Montenegro op € 49,99 en Marokko op
   $ 59,99, meer dan een Amerikaan betaalt.

   Marokko is op 30 september bewust zo gelaten. Wie er iets aan wil doen
   gebruikt *Recalculate prices* vanuit Nederland en zet Marokko daarna met
   de hand lager.
2. ~~**Apple: naam en beschrijving van de abonnementen.**~~ **Gedaan op
   30 september**, in het Engels en het Nederlands, voor alle drie de
   aankopen. Frans, Duits, Spaans en Italiaans staan klaar in
   `store/abonnement-teksten.md` en zijn winst, geen voorwaarde — Engels is
   wat de 174 landen buiten Nederland zien.

   Wat hier stond klopte trouwens niet helemaal: het slot zit niet aan de
   versie maar aan de **indiening**. Staan de aankopen daarin op *Ready for
   Review*, dan zijn ze alleen-lezen, en dat gaat er alleen af door de
   indiening in te trekken. Zie hierboven.
3. **Apple: royaltyvaluta.** De bankrekening staat goed — *Bank Currency*
   is EUR — maar *Royalty Currencies* staat op **USD**. Apple rekent de
   opbrengst dus eerst om naar dollars en stort die op een eurorekening: twee
   keer wisselen, twee keer marge.

   **Dat is niet te wijzigen.** Onder de drie puntjes bij de rekening staat
   één optie: *Replace with New Account*. De royaltyvaluta van een bestaande
   rekening ligt vast. Dezelfde rekening opnieuw invoeren en dan EUR kiezen is
   de enige weg, en dat kost een nieuwe verificatie.

   **Geprobeerd op 30 september, afgebroken.** De stappen zijn: bankland en
   valuta (stonden al op Netherlands en EUR), dan IBAN en BIC, dan meteen het
   scherm *Certification* met de machtiging. **Nergens een keuze voor de
   royaltyvaluta.** Bij *Account Number* hoort trouwens niet de hele IBAN maar
   alleen het binnenlandse deel, anders komt er "This value is too long".

   Bij Cancel gebeurt er niets: de oude rekening blijft staan.

   Wat het kost om het zo te laten: Apple rekent de opbrengst om naar dollars
   en de bank rekent terug naar euro's. Twee keer een wisselmarge van grofweg
   een tot twee procent. Op een omzet van tienduizend euro is dat honderd tot
   tweehonderd euro per jaar — vervelend, geen ramp.

   **Bericht verstuurd op 30 september** via *Contact Us* onderaan App Store
   Connect, met de vraag of zij de royaltyvaluta aan de bestaande rekening
   kunnen wijzigen zonder de rekening te vervangen. Antwoord afwachten.

   Komt er nee, dan is het bij de eerstvolgende keer dat de rekening tóch
   vervangen moet worden het moment om het opnieuw te proberen — niet eerder,
   want een vervanging kost een nieuwe verificatie en die legt de uitbetaling
   stil.

4. ~~**Apple: DAC7.**~~ **Al gedaan op 22 september.** Het staat niet bij
   *Tax Forms* maar onder **Compliance**, en niet onder die naam: de regel
   heet *Directive on Administrative Cooperation – 7th Amendment*. Dat ís
   DAC7 — status Active, 27 landen. Bij Tax Forms zoeken levert niets op,
   want daar staan alleen de Amerikaanse, Braziliaanse en Mexicaanse
   formulieren.

5. ~~**Google: bankrekening en belastinggegevens.**~~ **Allebei klaar.** Dit
   was het laatste wat tussen een verkoop en een uitbetaling in stond.

   **Bankrekening geverifieerd op 1 oktober**, één dag na het toevoegen.
   Google bevestigde het per mail: *"Your bank account is verified — you can
   now start making and receiving payments from your bank account."* De
   rekening staat dus niet meer op *Verification pending*.

   Het is sneller gegaan dan de drie werkdagen waar hierboven op werd
   gerekend; er is geen testbedragje nodig geweest. Dat scheelde waarschijnlijk
   dat de tenaamstelling klopte — `Venship` bij Google en `Venship` bij de
   bank, vooraf nagevraagd. Bij een naam die niet matcht loopt het mis, en dat
   hoor je pas dagen later.

   Het betaalprofiel staat niet onder *Developer account* maar onder
   **Settings → Payments profile**, binnen de Play Console zelf. De
   verdiensten staan er al in euro's, dus de dollarwissel die bij Apple
   speelt is hier geen punt.

   **Belastinggegevens: gedaan op 30 september.** Het Amerikaanse formulier
   staat op *Approved*, een W-8BEN op naam van de eigenaar, geldig tot
   31 december 2029. Alle drie de regels onder *Tax forms and withholding
   rates* staan op **0% · Claimed**: other copyright, services en motion
   picture. Taiwan is leeg gelaten; dat geldt alleen voor verkopers met een
   vestiging daar. *Tax reporting* staat op paperless.

   Vier dingen die in dat formulier misgaan als je niet oplet:

   - **Individual**, niet *non-individual / entity*. De vraag luidt "What type
     of account is Venship?" en verleidt tot entity, maar hij gaat over
     fiscale status. Een eenmanszaak is geen aparte rechtspersoon. Entity
     leidt naar een W-8BEN-E die om een ondernemingsnummer vraagt dat er niet
     is.
   - Het veld *Name of individual who is the beneficial owner* wordt door
     Google voorgevuld met `Venship`. Dat moet de **persoonsnaam** zijn;
     `Venship` hoort in het veld eronder, *DBA (doing business as)*.
   - **Verdrag geclaimd**: *Yes, I am eligible for a reduced withholding rate*,
     land Nederland, en dan bij *Special rates and conditions* zowel **Other
     copyright royalties** als **Services or other business income** aanvinken,
     elk op **0%** met het bijbehorende verklaringsvinkje eronder. Royalty's
     zitten in het Nederlands-Amerikaanse verdrag in **artikel 13**, niet in
     artikel 12 (dat is het OESO-modelnummer). Zonder deze claim houdt de IRS
     30% in op de Amerikaanse omzet.
   - *Activities and services performed in US* → **No**, met het vinkje dat het
     werk volledig buiten de VS gebeurt. Verkopen áán Amerikanen is geen
     activiteit ín de VS; *Yes* haalt het verdragsvoordeel meteen weer weg.

   De *unchanged status affidavit* is overgeslagen. Die laat het formulier
   terugwerken op eerdere uitbetalingen, en die zijn er niet — het jaarveld
   stond voorgevuld op 2020, toen het account nog niet bestond.

## De boeken

**Sba de Atlasleeuw** — twaalf delen, dertig bladzijden per deel, af. De
vormgeving volgt de v2-proef: woordkaart op de plaat, het woord in kapitalen,
het Arabisch eronder, "Zeg het hardop!".

Elk deel heeft één geschilderd tafereel dat het hele boek draagt — de poort
van Fes, de souq van Marrakech, de bergen in de sneeuw — en dat staat al in
`store/prentenboek/platen/<deel>/achtergrond.jpg`. De tekeningen op de
bladzijden zelf zijn nog vectoren. Wil je er per bladzijde een geschilderde
plaat bij, zet die dan neer als `platen/<deel>/<nummer>.jpg`; de zetter pakt
hem dan boven de achtergrond. De 144 opdrachten daarvoor staan in
`store/prentenboek/platenlijst.md`, en dat is de enige post in dit project die
nog echt geld kost.

### De redactie van de verhalen

Op 25 september is er een eerste redactieslag gedaan op de tekst zelf, en die
begon met kijken in plaats van schrijven. De diagnose, met cijfers:

| | |
|---|---|
| Hoofdstukken | 202 |
| Woorden per hoofdstuk, deel 1 t/m 6 | 260 – 390 |
| Woorden per hoofdstuk, deel 7 t/m 15 | ~200 |
| Slotzinnen langer dan 28 woorden | 24 |
| Alinea's waarin het boek over zichzelf praat | 34 |

De latere delen zijn dunner en hun hoofdstukken eindigen anders. Deel 1 sluit
af op een klap — *"Nee," zei ze.* · *De mantel was rood.* · *Alleen de sleutel
niet.* Deel 13 sluit af op een samenvatting in de voltooide tijd: *"Nadia heeft
daar haar hele leven les over gegeven…"* De verteller staat dan niet meer in de
scène maar kijkt er dertig jaar later op terug, en dat is waarom het vlakker
leest.

**Wat níét is aangeraakt: de verteller die zegt wat hij niet weet.** Van die
vierendertig alinea's zijn de meeste geen fout maar het handelsmerk van deze
reeks — *"Aziz is die dag doodgegaan en dit hoofdstuk is kort, want Driss heeft
er kort over gedaan."* · *"Dat respecteert dit boek."* · *"Dit hoofdstuk is er
voor hen en het is het kortste van dit deel, omdat er over hen het minste
bekend is, en dat is zelf het punt."* Die weghalen zou het boek zijn stem
kosten.

Wat wél weg moest is de verteller die zegt wat je moet vóélen. Vijf alinea's,
steeds dezelfde vorm: een rake zin, en daarachter een zin die je vertelt dát
hij raak is. *"Het ging twee kanten op. Dat is het enige wat dit hoofdstuk wil
zeggen."* Die tweede zin is eraf; de eerste stond er al.

**De 24 lange slotzinnen zijn nagelezen; er zijn er vier veranderd.** Lengte
bleek niet het probleem. *"Tala stond op het plein met haar handen langs haar
lichaam en haar oren gloeiend, en om haar heen begon iedereen weer te praten
over een muur en een buurman"* is dertig woorden en precies goed: de wereld
gaat door terwijl zij staat te branden. Twintig van de vierentwintig zijn zo,
en die zijn met rust gelaten.

De vier die wel moesten, hadden dezelfde kwaal als hierboven: een etiket voor
de zin. *"Sanaa heeft daar de rest van haar leven aan teruggedacht als aan de
belangrijkste les die ze ooit heeft gekregen, en ze heeft hem zo doorverteld:
geloof de man die er is geweest…"* De spreuk is prachtig; het etiket
"belangrijkste les" ervoor vertelt de lezer wat hij moet vinden. Dat is eraf.

**En er zat een echte fout tussen.** Deel 13 eindigde met *"…een adres van een
neef in Utrecht, en dat is het volgende en laatste deel van dit boek"*. Maar
deel 14 is *Zwart op wit*, 2011, Anir en zijn oma; Utrecht is deel 15. Die zin
sloeg deel 14 over én noemde het verkeerde deel het laatste, in alle zes de
talen. Nu: *"Daar begint het laatste deel van dit boek."*

Wat er nog ligt: de compressie in deel 7 t/m 15, waar scènes tot samenvatting
zijn ingedikt — deel 1 heeft 390 woorden per hoofdstuk, deel 13 nog 197. Dat is
echt schrijfwerk en geen redactie, en het is de enige post in de tekst die
uren per deel kost.

**Let op bij elke tekstwijziging:** elke Nederlandse alinea is vastgeklonken
aan vijf vertalingen, met een test op het aantal alinea's per hoofdstuk. Eén
zin aanscherpen is dus zes keer werk. En de boeken zijn al te koop, dus na een
wijziging moeten de zips en pdf's opnieuw (`npm run winkel`) en de leesuitgaven
opnieuw de bak in (`npm run lezen -- --r2`).

**De sleutels van Marokko** — vijftien delen. Bladzijden per deel:

| Deel | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Blz | 33 | 42 | 35 | 29 | 31 | 46 | 31 | 29 | 28 | 27 | 27 | 27 | 26 | 28 | 25 |

Alle vijftien delen zijn uitgeschreven, en alle vijftien staan in **zes
talen**: Nederlands, Frans, Duits, Spaans, Italiaans en Engels. Dat zijn
negentig boeken.

De vertaling ligt alinea voor alinea naast het Nederlands, en daar staat een
test op: een hoofdstuk dat wegvalt of een alinea die wordt samengevoegd laat
de build vallen. Dat is met opzet — een boek van dit soort leeft van de
stiltes tussen de alinea's, en wie die samenvoegt haalt het tempo eruit.

Historische foto's kunnen erin zodra ze in `store/sleutels/platen/<deel>/`
staan, met `bronnen.txt` ernaast. Welke opname waar hoort staat in
`store/sleutels/beeldenlijst.md`.

## De winkel

Open, voor één van de drie. Zie `docs/WINKEL-INRICHTEN.md`.

| Product | Prijs | Status |
| --- | --- | --- |
| De sleutels van Marokko | € 34,99 | **te koop** — `venshipper.gumroad.com/l/sleutels` |
| Sba de Atlasleeuw | € 34,99 | **te koop** — `venshipper.gumroad.com/l/sbadeleeuw` |
| Het e-boek | € 14,99 | bestanden klaar, product nog aanmaken |

### De openingsactie — en wat je op 30 november moet doen

Op de website staat sinds 1 oktober een doorgehaalde **€ 49,99** naast de
€ 34,99, met een insigne "Openingsactie" en de regel *"Introductieprijs tot en
met 30 november 2026. Daarna € 49,99."* in alle zes talen.

Die doorhaling mag, maar alleen in deze vorm. Een doorgehaald bedrag dat leest
als "dit was duurder" moet volgens artikel 6a van de prijsindicatierichtlijn —
in Nederland het Besluit prijsaanduiding producten — de laagste prijs van de
dertig dagen ervoor zijn. De reeksen hebben nooit € 49,99 gekost. Daarom staat
er bij de doorgehaalde prijs *prijs na de actie* en niet *normale prijs*, en
daarom staat de einddatum eronder: het is een introductieprijs, geen
afprijzing.

**Daar hangt wel een afspraak aan.** Op 30 november moet de prijs bij Gumroad
ook echt naar € 49,99, anders is de aankondiging alsnog onwaar en handhaaft de
ACM daarop. Wil je dat niet, zet de actie dan vóór die dag van de website af:

```
npm run site
```

na één wijziging in `src/site/shop.ts` — `na` leeg bij beide reeksen in
`NA_ACTIE`. Dat haalt het insigne, de doorhaling en de datumregel alle drie
tegelijk weg; de prijs zelf blijft staan.

Gumroad is de *merchant of record*: zij zijn juridisch de verkoper, innen de
btw in elk EU-land, leveren het bestand en doen de terugbetalingen. Op het
afschrift van een koper staat hun naam, en daarom staat dat ook op de
afrekenpagina. Het kost 10% + $0,50, plus 2,9% + $0,30 aan kaartkosten — bij
€ 34,99 houd je ongeveer € 29,70 over. Komt de koper binnen via hun eigen
etalage (*Discover*), dan is het 30% vlak.

`npm run winkel` zet alle tweeënnegentig boeken, maakt er drie zips van en
schrijft `store/winkel/producten.md`: per product de titel, de prijs, het
bestand en de tekst voor de productpagina. `node scripts/make-winkelplaat.mjs`
maakt de beelden erbij — per product een omslag, een duimnagel en een plaat
met alle titels erop.

Zolang een link in `src/site/shop.ts` leeg is, staat er op de website
"Binnenkort" en geen dode knop. De drie producten gaan dus los van elkaar
open.

**De handelaarsgegevens staan op de website**, en niet alleen een
KvK-nummer: Venship, het adres en het e-mailadres staan op de afrekenpagina,
in de voorwaarden, in de privacyverklaring en op de ouderpagina.

**Het telefoonnummer staat er met opzet niet bij** — wel in de app en in de
consoles van Apple en Google, waar de handelaarsverificatie van de Digital
Services Act aan hangt. Op een openbare bladzijde leest een 06-nummer naast
een bedrijfsnaam als een eenmanszaak die je op zijn fiets kunt bellen, en de
mailbox op het eigen domein doet daar hetzelfde werk. Het mag ook: de
e-commercebepaling vraagt gegevens voor snel, rechtstreeks en effectief
contact "met inbegrip van het e-mailadres", en een telefoonnummer staat daar
niet bij. Bij verkoop op afstand geldt "indien beschikbaar", en de verkoper is
daar Gumroad respectievelijk de winkel — niet Venship. Er staat een test op,
zodat niemand het als omissie "repareert". Dat is wat de Digital Services Act van een verkoper aan
consumenten vraagt, en het is dezelfde informatie die Apple heeft
goedgekeurd — dus als er één ding verandert, verandert het op vier plekken
tegelijk (`traderTable` in `scripts/make-site.mjs`).

**Het begin van De sleutels staat gratis op darijaforkids.eu/leesboeken**, in
zes talen, zonder account en zonder e-mailadres: de eerste drie hoofdstukken
van *De olijvenbrand*, ruim elfhonderd woorden, en het houdt op vlak vóór er
iets misgaat.

Het staat er nu ook **met stem**. Eén knop op de boekenpagina vouwt het begin
open, met dezelfde voorleesbalk als na het afrekenen. Dat is met opzet: een
pdf laat niet horen wat je koopt — die download je, opent in een ander
programma, en zwijgt. De pdf staat er nog wel naast voor wie liever
downloadt (`npm run sleutels -- --deel 1 --tot 3`).

Sba heeft met opzet geen gratis deel: dat is een twaalfde van de reeks en in
vijf minuten uit.

### Het portaal

De worker draait: `darijaforkids-post.motispiritsound.workers.dev`, met de
database erachter en alle zes de tafels erin. Op darijaforkids.eu/portaal meld
je je aan met je e-mailadres, krijg je een link, en zie je daarna je gekochte
reeksen. Geen wachtwoord — zie `server/src/portaal.ts` voor waarom niet.

Hij hangt aan zijn eigen adres: **post.darijaforkids.eu**, aangelegd door
`npm run deploy` zelf. Dat staat als route in `server/wrangler.toml`, en omdat
het domein op de nameservers van Cloudflare draait zet wrangler de DNS-regel
er zelf bij. Het adres op `workers.dev` staat voorlopig nog aan om op te
testen; zodra het eigen adres antwoordt mag `workers_dev = false`.

**De rem op het versturen van mail.** Het portaal stuurt een inloglink naar
elk adres dat iemand invult. De rem daarop stond per lid — zestig seconden
tussen twee links — en die stapt een vreemde zo voorbij: vul elke keer een
ánder adres in, dan is het elke keer een nieuw lid en mag het meteen weer. Zo
kon de worker gebruikt worden om onbeperkt post te versturen onder onze naam.

Wat dat kost is niet de mail zelf maar de afzender: de ontvangers melden hem
aan als spam, `info@darijaforkids.eu` raakt geblokkeerd, en daarna komt de
inloglink van iemand die wél betaald heeft ook niet meer aan. En de dagelijkse
ruimte bij Brevo is in minuten op.

Er is nu een teller per plek en per uur (tafel `mailteller`, twaalf mails),
vóór álle paden die mail versturen. Het antwoord aan de bezoeker verandert er
niet door — anders is dit een manier om te vragen welke adressen bestaan.

**Draai daarom `npm run schema` vóór de volgende `npm run deploy`**, anders
zoekt de worker een tafel die er niet is.

Twee dingen die nog moeten voordat het werkt voor een echte koper:

1. **Gumroad laten melden dat er verkocht is.** Eén veld invullen, onder
   Settings → Advanced → Ping. Het adres dat daarin hoort drukt deze opdracht
   compleet af — er valt niets in te vullen:

   ```bash
   npm run koopgeheim
   ```

   Hij verzint een nieuw geheim, stuurt het naar Cloudflare en geeft het hele
   adres. Draai je hem nog eens, dan werkt het oude adres niet meer.

   Zonder die melding blijft de bibliotheek van een koper leeg terwijl hij wél
   betaald heeft, en dat is de ergste soort bug: hij lijkt op diefstal.

   `/koop` neemt sinds kort ook de kale ping van Gumroad aan — een gewone
   formulierpost, met het geheim in het adres, want Gumroad kan geen eigen
   koppen sturen. Het vertaalt zelf het productadres naar de reeks, raadt de
   taal uit het land van de koper, en herkent de proefmelding uit het
   instellingenscherm. Hoe je het controleert staat in `server/LEES-MIJ.md`.
2. **Zelf een keer het hele rondje lopen**: kopen, mail, aanmelden, inloggen,
   en kijken of het boek er staat.

De mail die de koper dan krijgt is in zijn eigen taal. Die taal wordt geraden
uit het land dat Gumroad meestuurt, en de reekstitel in die mail is de titel
die ook op zijn boek staat — "The Keys of Morocco" en niet "De sleutels van
Marokko", want dat laatste staat nergens in zijn zip. Dat was tot 25 september
niet zo: elke koper kreeg een Nederlandse mail. Het zit nu in `MAILS` bij de
andere mails, met een test per taal.

### De omslagen en de titels

Naast elke reeks op de boekenpagina staat de omslag van deel 1. Die tekent de
zetter al mee in de pdf, en `--omslag` schrijft hem weg als plaatje — maar dat
was één keer gedaan, in het Nederlands, en die ene omslag stond naast alle zes
de taalversies. Een Franse bezoeker las "Les clés du Maroc" met daarnaast een
omslag waarop "DE SLEUTELS VAN MAROKKO · De olijvenbrand · DEEL 1 VAN
VIJFTIEN" stond.

`npm run omslagen` maakt ze alle twaalf: twee reeksen × zes talen. Er hoefde
niets getekend te worden. `make-site.mjs` pakt `site-assets/boeken/<taal>/` en
valt terug op `site-assets/boeken/` — daar blijft het Nederlands staan, zodat
een taal zonder eigen omslag er wel een houdt.

**De titels komen nu uit de boeken zelf.** Ze stonden dubbel: de verhalen
hadden hun vertaling en `src/site/delen.ts` had er nog een, met de hand
overgeschreven. Achtenvijftig van de honderdvijfendertig liepen uit elkaar —
en niet alleen in een woordje. Op de Spaanse pagina stond *Sba y el médico de
la medina* terwijl het boek *la doctora* heet: een ander personage. De winkel
beloofde boeken die onder die naam niet bestaan. `delen.ts` leest nu uit
`src/content/`, met het Nederlands als terugval, en er staat een test op die
valt zodra een deel in een taal onvertaald blijft.

### De platen bij de delen

Op de boekenpagina staat in de uitklaplijst per deel een geschilderd tafereel
met de titel erop: 1200 × 675, linksboven een kaartje met de reeksnaam, de
titel en het deelnummer met de plaats erachter. Daarmee is die lijst een
etalage geworden in plaats van twaalf regels tekst.

| | |
| --- | --- |
| Sba de Atlasleeuw | twaalf delen × zes talen — staan erop, `npm run deelplaten -- --taal alles` |
| De sleutels van Marokko | vijftien delen × zes talen — `npm run sleutelplaten` |

De tweeënzeventig platen voor Sba staan in `site-assets/sba/<taal>/` en gaan
mee met de site.

Voor Sba komt het tafereel uit `store/prentenboek/platen/<deel>/` en alleen de
tekst uit de inhoud; verandert er een titel, dan zet je ze opnieuw in plaats
van ze opnieuw te tekenen. `--groot` geeft 1600 × 900, om ergens te delen.

Bij De sleutels ligt dat anders dan bij Sba. Daar bestaan vijf platen, met de
hand gemaakt, en het tafereel *zonder* tekst is er niet meer — alleen het
eindresultaat met het kaartje er al op. Vertalen kon dus niet door opnieuw te
zetten.

`npm run sleutelplaten` legt daarom een nieuw kaartje over het oude: dezelfde
plek, één vaste maat die ruimer is dan de grootste van de vijf zodat er niets
van het Nederlands onderuit steekt, en de titel in de taal die je leest. De
accentkleur per deel — turkoois voor Fes, roest voor Marrakech, brons voor
Ceuta — wordt uit de plaat zelf gelezen, één pixel uit de balk links, want hij
staat nergens opgeschreven. Het Nederlands blijft het origineel en wordt niet
overgezet.

Op die platen staat *De sleutel tot de geschiedenis van Marokko* — enkelvoud,
terwijl de reeks De sleutels van Marokko heet. Dat is bekeken en zo gelaten:
het is een ondertitel en geen reekstitel, en zo gelezen klopt hij. Niet
"verbeteren". In de andere vijf talen staat de vertaling daarvan
(`plaatOndertitel` in `src/site/copy.ts`).

**Deel 6 tot en met 15 hebben geen geschilderd tafereel, en toch een plaat.**
Daar staat nu een getekende banner in de stijl van de reeks: het nachtblauw van
de omslagen, de zellige-band boven en onder, en rechts de kaart van Marokko met
de plek van dít deel erop — Essaouira, het Rif, de Hoge Atlas. Alles uit
`scripts/lib/historie.mjs`, dezelfde bibliotheek die de omslagen en de kaarten
in de boeken tekent, dus het is geen los ontwerp maar hetzelfde boek uitgeklapt
naar zestien bij negen. De accentkleur is het rood van de omslagpil.

Dat is géén illustratie van het verhaal. Wil je die, dan is dat de opdracht in
`store/sleutels/beeldenlijst.md`, en dat is de enige post in dit project die
nog echt geld kost. Komt er een geschilderd tafereel bij, zet het dan als
`site-assets/sleutels/nl/deel-NN.webp` neer en voeg het nummer toe aan
`GESCHILDERD` in `scripts/make-sleutelplaat.mjs`.

Dat lijstje is er met reden en niet uit gemak: de Nederlandse map is tegelijk
bron en bestemming. Zou het script afleiden "ligt er een bestand", dan leest de
volgende ronde zijn eigen banner als een tafereel en zet er nóg een kaartje op.
Dat is precies één keer gebeurd.

### De lezer op de website

Na het inloggen staat er per gekochte reeks een knop *Lezen en luisteren*.
Daarachter zit het boek als tekst, in zinnen geknipt, met een voorleesbalk
erboven: de stem van het toestel zelf leest voor en de zin die klinkt licht
op. Geen opnames — die kosten geld, en dit onderdeel mocht niets kosten tot
er iets verdiend wordt.

De stem staat op alle drie de plekken waar tekst staat:

| | |
| --- | --- |
| Het gratis begin op `/leesboeken` | drie hoofdstukken, zonder account |
| De sleutels van Marokko, na het inloggen | vijftien delen, zes talen |
| Sba de Atlasleeuw, na het inloggen | de voorleestekst onder elke plaat |

Bij Sba is de bladzijde een plaatje en de tekst komt er los bij (bladzijde nul
van hetzelfde deel). Zonder die tekst zou een prentenboek zwijgen, en dat is
juist het boek waar een ouder hardop voorleest aan een kind dat nog niet zelf
leest.

De bladzijde ziet eruit als een bladzijde uit een boek en niet als een
webpagina: crèmekleurig papier, een schreefletter, alinea's met een inspringing
in plaats van witregels, en niet breder dan achtendertig regels tekst. Het
tafereel van het deel staat erboven. De voorleesbalk blijft onder de sitekop
hangen, ook op een telefoon.

**De stem komt van het toestel, en dat is te horen.** Wij leveren geen opnames
mee — de browser spreekt met de spraakstem die er staat. Op Windows en Android
is dat meestal een nieuwe, natuurlijk klinkende stem; in Safari op een iPhone
of iPad mag een bladzijde alleen bij de oude compacte stem, en die klinkt
blikkerig. De stem van Siri is niet aan webpagina's beschikbaar, dus daar is
met code niet omheen te komen. Wat er wél gedaan is:

- de nieuwere stemmen komen vooraan in het keuzelijstje (`klank()` in
  `src/site/lezer.js` zet ze op volgorde);
- staat er alleen een oude bij, dan zegt de lezer zelf dat er in de
  instellingen van het toestel een betere te downloaden is (`leesStemTip`);
- en op de boekenpagina staat het er vóór het afrekenen bij, in zes talen
  (`boekLuisterStem`) — niet als waarschuwing bovenaan, maar onder de drie
  stappen.

De vertellers heten Amir en Yassine bij de mannenstemmen en Yousra en Sarah
bij de vrouwenstemmen — vier, twee om twee. Dat zijn onze namen op de stemmen
van het toestel; welke echte stem eronder zit verschilt per apparaat.

Welk geslacht een stem heeft staat nergens in de Web Speech API, dus het wordt
uit de naam geraden — twee lijsten met namen in `src/site/lezer.js`. Die gok
ging twee keer mis op dezelfde manier: een stukje tekst dat toevallig in een
langer woord zit. `man` zit in "German (Germany)", waardoor in het Duits élke
stem een man was en Katja de naam Amir kreeg; `male` zit in "female"; en
`paul` zit in "Paulina". Nu wordt eerst de taalnaam weggeknipt en moet elke
naam een heel woord zijn. Honderdachtendertig echte stemnamen uit Windows,
macOS, iOS en Android zijn erlangs gelegd: geen enkele meer verkeerd, en geen
enkele meer onbekend.

`npm run portaalcheck` loopt dat hele rondje na in een echte browser, met de
antwoorden van de worker erbij verzonnen. Geen database, geen mail, geen
internet nodig. `npm run sitecheck` doet hetzelfde voor de website: dode links,
ontbrekende ankers, en elk stukje javascript in de bladzijden wordt ontleed.
Die twee hangen aan `npm run site` en `npm run build`, dus een dode link laat
de bouw vallen in plaats van dat iemand hem later tegenkomt.

**De boeken in de bak — de helft staat erin.** De lezer haalt elk boek apart
op uit R2. Die bak bestaat, en de negentig leesboeken van De sleutels staan
erin: vijftien delen in zes talen, samen twee megabyte. Dat rondje is nagelopen
op het echte adres — inloggen, *De olijvenbrand* openen, en de stem leest voor.

Wat er nog in moet zijn de prentenboeken van Sba. Die zijn bladzijden als
plaatje en moeten eerst geschoten worden:

```bash
npm run boeken -- --platen
```

Twaalf delen × zes talen × eenendertig bladzijden, ruim tweehonderd megabyte,
**ruim een uur** — ongeveer de helft schieten, de helft versturen. De
voorleestekst gaat vanzelf mee. Tot die tijd opent Sba niet in de lezer; de
pdf uit de winkel werkt gewoon, en de lezer zegt dat er ook bij.

Elk deel gaat de deur uit zodra het geschoten is en komt dan in
`store/bladen/gedaan.json`. Valt hij om — en over ruim tweeduizend bestanden
valt er een keer iets om — draai dan gewoon dezelfde opdracht opnieuw: wat er
al in staat wordt overgeslagen. Met `--opnieuw` doet hij alles nog een keer.

`npm run boeken` is de opdracht die dit allemaal doet en zelf kijkt wat er
nodig is: zonder vlaggen doet hij de leesboeken én de platen, met `--lezen` of
`--platen` alleen dat ene. Hij zoekt eerst een browser (de al geïnstalleerde
Edge is ook Chromium en wordt gepakt), zodat het niet halverwege afbreekt op
een download van honderdvijftig megabyte.

Moet de bak ooit opnieuw worden aangemaakt — een nieuw Cloudflare-account, een
andere naam — dan doet `cd server` plus `npm run maak-bak` dat: bak aanmaken,
binding aanzetten, uitrollen. Staat R2 in dat account nog uit, dan zegt de
opdracht zelf waar je dat aanzet. Dat aanzetten is het enige in dit project dat
echt met de muis moet; het vraagt niet om een betaalmethode.

### Het ledenbestand

Wie zich aanmeldt komt in de tafel `lid`. Het vinkje voor de nieuwsbrief staat
daar los van de twee verplichte, want gebundelde toestemming is geen
toestemming.

Eén ding om te onthouden voor de dag dat je die eerste nieuwsbrief stuurt:
**het vinkje alleen is geen grond om te mailen.** Iedereen kan bij het
aanmelden het adres van een ander invullen. De bevestiging is de klik op de
link in de mail — die kan alleen wie bij die mailbox kan. In de code zit daar
één functie voor, `nieuwsbrieflijst()` in `server/src/portaal.ts`, en die zet
die twee voorwaarden bij elkaar. Gebruik die, en geen zelfgeschreven query.

### Wat hier nog moet

1. **Je eigen boek kopen.** Met je eigen kaart, voor de volle prijs. De zes
   dingen om op te letten staan in `docs/WINKEL-INRICHTEN.md` onder *Zelf
   bestellen*. Het telt bovendien mee: voor Gumroad Discover heb je minstens
   één verkoop nodig.
2. **Het e-boek aanmaken**, en zijn adres in `LINKS` zetten. De twee reeksen
   staan er al.
3. **Een sectie op je Gumroad-profiel**, anders is `venshipper.gumroad.com`
   een lege pagina.

## De socials

Alle vier staan er en staan met hun logo op de startpagina.

| | |
| --- | --- |
| YouTube | youtube.com/@darijaforkidsapp |
| Instagram | instagram.com/darijaforkidsapp |
| Facebook | de pagina op nummer 61594495868221 |
| TikTok | tiktok.com/@darijaforkidsapp |

Zodra de Facebook-pagina genoeg volgers heeft mag er een gebruikersnaam op.
Dat is één regel in `src/site/links.ts`.

## Naar go-live

De hele dag staat uitgeschreven in **`docs/GO-LIVE.md`**: de volgorde, de
commando's, en alle berichten klaar om te plakken. Wat je daarvóór nog moet
doen, staat hier.

De volgorde die een aankondiging mogelijk maakt: eerst laten goedkeuren, dan
vasthouden, dan pas vrijgeven. Een winkel die bij goedkeuring meteen
publiceert, bepaalt zelf je lanceerdag — en dan staat de app al in de winkel
terwijl de eerste teaser nog moet komen.

1. ~~**Play op handmatig.**~~ **Staat aan** — nagekeken op 30 september. Dat is
   ook meteen de verklaring waarom de winkelpagina 404 geeft terwijl de
   release op Productie staat: een goedgekeurde release blijft staan tot jij
   op publiceren drukt.
2. **Apple op handmatig.** Bij het inzenden van de versie: *Manually release
   this version*. Niet "automatically".
3. De app zelf spelen: op een iPhone via TestFlight, op de Galaxy Tab via Play.
   De punten om op te letten staan in `docs/MAC.md` §D.
4. Vrijgeven: eerst Apple (de goedkeuring is er dan al, publiceren duurt een
   paar uur), Play erachteraan. Play is binnen het uur zichtbaar.
5. De website omzetten met één commando, als allebei de winkeladressen echt
   opengaan:

   ```bash
   npm run live -- --apple 6751234567 --google
   ```

   Dat vult `STORE` in `src/site/links.ts` en zet de site opnieuw: het blok
   "binnenkort" verdwijnt, de balk onderaan wordt een downloadknop, en de twee
   winkelknoppen worden echt. Het Apple ID staat in App Store Connect bij
   *App Information*; het Play-adres weet het script zelf. Klopt er iets niet,
   dan brengt `npm run live -- --uit` je terug.

## Waar het van afhangt

Niets meer aan papierwerk. De handelaarsverificatie voor de Digital Services
Act is op 24 september goedgekeurd en je handelaarsgegevens staan live in de
App Store in de hele Europese Unie. Dat was het enige dat een betaalde app in
de EU kon tegenhouden zonder dat het op een bouwfout leek.

Wat overblijft zijn twee beoordelingen die allebei al lopen: **1.0 (build 7)**
bij Apple, ingediend 30 september, en **inzending 4** bij Play, ingediend
29 september. Apple doet er doorgaans één tot drie dagen over, Play tot zeven
bij een app zonder eerdere goedkeuring. Alles wat hierboven nog openstaat kan
daarnaast en houdt die datum niet tegen.

Realistisch voor allebei: **1 tot 7 oktober**, met Play als de late van de
twee.

**En daar valt niets aan te versnellen.** Geen van de twee winkels kent een
spoedknop die je zelf kunt indrukken; Apple's *Expedited Review* is voor een
kapotte app in de winkel, niet voor een eerste versie, en vragen zonder reden
kost later goodwill. Wat je wél kunt sturen is het verschil tussen één ronde
en twee:

- **Een afwijzing dezelfde avond beantwoorden.** Een ronde bij Apple kost een
  tot drie dagen; een avond wachten met de reparatie kost er dus net zoveel
  als de beoordeling zelf. Build 8 staat klaar — de FAQ-reparatie is gemeten
  en zit in de code, niet in build 7.
- **De drie velden bij Play nakijken** (hierboven, *Nog na te kijken bij Google
  Play*). Een leeg *App access* is een afwijzing om niets. Let op dat het
  nakijken is en niet wijzigen: zolang inzending 4 loopt kost een wijziging
  onder *App content* je de doorlooptijd opnieuw.

Alles daarbuiten — de royaltyvaluta bij Apple, de vier talen bij de aankopen —
houdt de lancering niet tegen. Dat is werk dat naast de beoordeling door kan
en erna net zo goed af is.

Het testbedragje van Google stond hier ook, en is er op 1 oktober af: de
rekening is geverifieerd. Daarmee is er aan beide kanten een werkende weg van
een verkoop naar je bankrekening, en dat was het enige openstaande punt dat
een verkochte app alsnog waardeloos had kunnen maken.

Eén ding om te onthouden voor later: de iOS-build loopt via de Mac en Xcode.
Play kan zonder, Apple niet. Wie een spoedreparatie moet uitbrengen heeft die
machine nodig — reken op een uur, niet op tien minuten.
