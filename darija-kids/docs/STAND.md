# Waar staan we

Bijgewerkt op 3 oktober 2026, met de vijf verbouwde oppervlakken, de
diplomaplank en de drie sloten op de ouderschermen. Dit bestand
is het antwoord op "wat moet er nog" zonder dat je drie andere bestanden hoeft
te lezen.

## De lancering: volgende week, met aankondiging — besloten 2 oktober

Tot vandaag was het plan stil lanceren en later communiceren. Dat is nu een
datum geworden: **volgende week gaat het naar buiten, met aankondiging.** Dat
verandert de volgorde van alles wat eraan vooraf gaat.

**Eén beoordelingsronde, niet twee.** Bij Apple lag 1.1 (build 9) en bij Google
versiecode 7. Allebei worden ingetrokken. In plaats daarvan gaat er één versie
in: de versie die ook werkelijk gelanceerd wordt, met het nieuwe startscherm
erin. Twee rondes achter elkaar passen niet betrouwbaar in een week; één wel.

Wat je weggooit zijn een paar uur beoordeling, geen dagen — die inzendingen
liepen pas sinds vanavond.

**Intrekken gebeurt pas als de nieuwe bundels er zijn.** Niet eerder. Anders is
er een venster waarin er niets in de lucht is en nog niets klaar, en als er dan
iets tegenzit sta je met lege handen.

**Allebei de winkels gaan naar 1.4.** Apple stond op 1.1, Play op 1.3. Dat
verschil heeft op 1 oktober al tot een verkeerd advies geleid — er is toen
`--naam 1.1` geadviseerd terwijl 1.2 live stond. Apple mag van 1.1 naar 1.4
springen, dus vanaf nu is het één nummer voor één product.

| | Nu | Wat eruit gaat |
|---|---|---|
| App Store | 1.1 · build 9, in beoordeling | **1.4 · build 10** |
| Google Play | 1.3 · versiecode 7, in beoordeling | **1.4 · versiecode 8** |

Het draaiboek voor de dag zelf staat in `docs/GO-LIVE.md`, de teksten in
`store/lancering/`. `docs/LANCERING.md` is iets anders: het plan voor de negentig
dagen eromheen.

##### De winkelknop op de site werkt — 2 oktober

`npm run live -- --apple 6813964474`. De knoppen op darijaforkids.eu waren
uitgeschakelde spans met "Coming soon" erop, terwijl 1.0 sinds die ochtend in
de App Store stond: de voordeur van het product zei dat het product niet
bestond. Dat was het enige punt in de UX-audit waar bezoek verloren ging.

Nu is het een echte link naar `apps.apple.com/app/id6813964474`, en staan er 60
pagina's in 6 talen opnieuw. Geen dode links.

Google blijft op "binnenkort" tot versiecode 8 is goedgekeurd. De twee knoppen
staan los van elkaar in `make-site.mjs`, dus Apple aanzetten laat Google met
rust. Een knop naar een Play-pagina die nog niet bestaat is erger dan geen knop.

## Waar het op staat — 3 oktober, 13:40

Allebei de winkels hebben nu 1.4 liggen, en voor het eerst is dat in allebei
hetzelfde nummer.

| | |
|---|---|
| App Store | **1.4 (build 10) — Waiting for Review**, ingediend 3 oktober 13:33. 1.0 blijft live tot deze erdoor is |
| Google Play, productie | versiecode 7 (1.3) — nog in beoordeling. Blijft staan tot het rapport van 8 binnen is |
| Google Play, gesloten test | **versiecode 8 (1.4) — ingestuurd**, rapport vóór lancering loopt |
| Google Play, beleid | afwijzing van 2 oktober staat open; zie hieronder waarom dat geen nieuw probleem is |

### De afwijzing gaat alleen over versiecode 4 — nagekeken 3 oktober

Op *Policy status* staan twee rode regels. Dat zijn geen twee problemen: de
tweede ("Not adhering to Google Play Developer Program policies") is de
paraplu waaronder Google de handhaving hangt, zonder eigen oorzaak. De eerste
is de echte, en die noemt onder *Reviewed app bundles* precies één bundel:

    4 (1.2)   Inactive   Target SDK 36   First published Sep 29, 2026

Met als reden: *"Crashes: Your app crashes after opening."* Dat is de
MainActivity-crash die op 2 oktober gevonden, gerepareerd en op de Galaxy Tab
bevestigd is. Er is dus niets nieuwers kapot, en versiecode 7 en 8 dragen
allebei de reparatie.

**Niet in beroep gaan.** De pagina biedt het aan met vijf tot acht dagen
wachttijd, en een beroep zegt: jullie hadden het mis. Google had het niet mis.
De weg terug is een versie die niet meer crasht, en die ligt er. Google zegt
er zelf bij wat wel helpt: *"Make use of test tracks to thoroughly test your
app's quality"* — precies wat versiecode 8 nu doet.

### Twee fouten die vandaag gevangen zijn

**Een `.at(-1)` in het leerpad** (`37225ad`). `bundelcheck` sloeg alarm
halverwege de winkelbouw: die functie bestaat pas vanaf Chrome 92, en
`minSdkVersion` 24 laat een WebView van Chrome 51 toe. De app zou opengaan en
meteen omvallen — dezelfde categorie als de afwijzing die openstaat. De lijst
met te nieuwe functies staat nu in `scripts/lib/tenieuw.mjs`, met twee lezers:
`bundelcheck` op de gebouwde bundel en `oudewebview.test.ts` op de bron, in
elke testronde.

**De releasenotities gingen niet mee** (`0b729a7`). `naartrack` zocht ze op met
`bundel.versionName` — maar het antwoord van Google op een upload draagt alleen
`versionCode`, `sha1` en `sha256`. Dus zocht het script naar
`wat-is-nieuw-undefined.md` en meldde dat er geen notities waren. Versiecode 8
staat daarom zonder teksten op de testbaan; dat is cosmetisch, maar bij de
productierelease is het de tekst die elke bezoeker leest. De naam komt nu uit
`docs/versies.json`.

### Wat er nog te doen is

1. **Rapport vóór lancering** van versiecode 8 lezen (Test and release →
   Testing → Pre-launch report).
2. Is dat schoon: **versiecode 7 weggooien en versiecode 8 naar productie**,
   mét de zes teksten. Eén beoordelingsronde in plaats van twee, en de versie
   die de winkel weer in gaat is meteen 1.4.
3. Goedkeuring afwachten in allebei de winkels, dan vrijgeven.
4. `npm run live -- --google` voor de Play-knop op de site.
5. De communicatie uit `store/lancering/`.

**Niet meegegaan met de iOS-inzending:** de drie abonnementen met de Franse
teksten. Die stonden op *Prepare for Submission* en de inzending telt één item.
Geen probleem — de producten zelf zijn goedgekeurd en verkopen door, alleen hun
Franse vertaling ontbreekt, dus een Franse koper ziet de Engelse tekst. Gaan
mee in de volgende ronde.

## Waar het vanavond op staat — 2 oktober

Beide winkels hebben een inzending liggen, en voor het eerst is dat bij allebei
dezelfde, gerepareerde code.

| | |
|---|---|
| Google Play | versiecode 7 (1.3) — productie én gesloten test, in beoordeling |
| App Store | 1.1 (build 9) — ingediend, op *Automatically release* |
| App Store, live | 1.0 (build 7) sinds vanavond |

**Wat er in de lucht hangt tot 1.1 erdoor is.** Build 7 staat live met de knop
die het e-boek aan het toestel gaf in plaats van aan de app: op een iPhone
opent die lichess.org. Gerepareerd op 1 oktober 17:19 (`3946200`), en build 9
is daarná gebouwd, dus 1.1 lost het op. Tot die tijd raakt het alleen wie het
jaarabonnement of het boek koopt.

**Wat er klaarligt voor de volgende ronde** (build 10, versiecode 8), nog in
geen enkele winkel:

- **Een startscherm in vier stappen** (`b72d38f`, `cf8a9b2`): taal, dan wie je
  bent (naam en een dier uit tien), dan hoe je meeleest (Arabisch schrift, de
  klanken in ons alfabet, of allebei), dan hoe het eruitziet (een van vier
  kleuren, en licht of donker). Daarvoor was het één talenlijst, en daarna stond een kind in een
  app die er voor iedereen hetzelfde uitzag — met een uil die het niet gekozen
  had en "Leerling" waar zijn naam hoort. Elke keuze gaat meteen de staat in;
  alleen `langPicked` gaat aan het eind om.
- **Een kleur die van jou is.** Saffraan, zellige, terracotta of munt, op de
  knop waarmee je verder gaat, je voortgangsbalk en je avatar zelf. Níét
  op groen-is-goed en rood-is-fout: die betekenen iets, en een kind dat zijn
  eigen "goed" op oranje zet kan daarna niet meer zien of hij het goed had.
  Nagerekend op 2 oktober: de zwakste is terracotta met 5,55 op 1 tegen de
  knoptekst, waar 4,5 de norm is. `kleurkeuze.test.ts` rekent het na en legt de
  bolletjes in de app naast de tokens in `index.css`. Saffraan krijgt geen
  stempel op de wortel, dus een oude opslag ziet er precies zo uit als altijd.
  Nagekeken op schermafdrukken van 390 pixels in allebei de standen en
  goedgekeurd.
- **De diplomaplank** (`f84402f`). Een module afmaken gaf tot nu toe een vinkje
  op een pad dat alleen het kind ziet. Nu geeft het een diploma, en daar hoort
  een handtekening en een woordje van een ouder of leerkracht bij — dat is het
  enige in de app dat een ouder iets te doen geeft. De plank wordt bij elke
  start bijgewerkt en niet alleen aan het eind van een les, want anders begint
  de plank van iemand die de app al een jaar heeft bij de unit die hij hierna
  doet.
- **De les ziet er anders uit** (`5b67b7c`): wie het fout had, zag niet wat het
  dan wél was. Zes standen voor een antwoord in plaats van twee, en de rand om
  "dit was het juiste antwoord" haalde 2,28 op 1 — onder de norm, op precies
  het moment dat een kind iets moet leren.
- Na het betalen kom je op `/profiel?welkom=1` uit, waar naam en avatar bij
  elkaar staan (`621fb63`).
- **Drie sloten die er niet waren** (`1ebc487`). "Alles wissen" had geen
  ouderpoort: twee tikken en de voortgang van maanden was weg. De poort bleef
  open nadat de app van het scherm af was geweest — een app op een tablet gaat
  niet dicht maar weg, dus "één keer per sessie" was in de praktijk één keer en
  daarna nooit meer. En terugzetten nam de taal van het andere toestel mee, dus
  wie een bestand van een Frans neefje terugzette moest zijn eigen taal
  terugzoeken in een menu dat hij niet meer kon lezen.
- **"Voortgang opslaan" doet nu iets** (`b936d9c`). Die knop deed niets in
  allebei de winkelbuilds: Capacitor zet geen `WKDownloadDelegate` en geen
  `DownloadListener`, dus een webweergave laat een download stil vallen. Op het
  web nog steeds een bestand, in de app een venster met de tekst en een
  kopieerknop, en "Tekst plakken" om hem terug te zetten.
- **De drie gratis dagen staan in de vraag erover** (`b56ef7c`). Het plaatje
  zei "Start 3 dagen gratis", de vraag eronder "met de eerste dagen gratis" —
  zonder getal, op de ene plek waar iemand het nazoekt voordat hij betaalt.

### De vijf oppervlakken, verbouwd en nagekeken — 3 oktober

Vijf ontwerpers hebben elk één oppervlak van de app herbouwd, elk in een eigen
werkmap, en vijf critici hebben het daarna stukgeslagen tegen de harde grenzen.
Alle vijf kwamen uit op "nemen, met aanpassing", en die aanpassingen zijn
gedaan en nagemeten voordat er iets de boom in ging.

| Waar | Wat | Wat de criticus eruit haalde |
|---|---|---|
| Het leerpad (`d14db12`) | 26 stukken weg waar er nul waren; de titel naast de knoop in plaats van eronder, en daardoor kon de hele weg getekend worden. Bladzijde 9 tot 11 procent korter | De ring om "hier sta je" stond er in beweging helemaal niet vol (gemiddeld 0,336); groen beloofde twee keer een stuk weg dat niemand gelopen had; de tegelvloer verspringt een halve tegel bij elke bladzijdewissel |
| Het startscherm (`d9e1a49`) | Vier stappen met een strook zellige, een mascotte per stap en een voorbeeldkaart die meebeweegt | Het paneel kon niet scrollen — op 320 bij 568 stond de kop van drie van de vier stappen boven de rand en was er geen manier om erbij te komen |
| Het profiel (`ce7533f`) | Insignes om te willen in plaats van hangsloten; "wat je kent" in woorden | De weekgrafiek tekende nooit iets: alle zeven staven waren altijd nul pixels hoog |
| De les (`a07f9fd`) | Zat al in de boom sinds `5b67b7c` | Een weggezakt antwoord was niet meer te lezen (2,95 op 1); twee vakjes naast elkaar waren 18 pixels in hoogte gaan verschillen; de beloningspil lag over een antwoord |
| De tabbalk (`a1bbea5`) | Vijf emoji eruit, vijf lijntekeningen erin; waar je bent aan drie dingen te zien | De schuivende ruit wiste onderweg de tekens waar hij langs kwam (1,01 tot 2,26 op 1) |

Wat er onderweg nog bijkwam: er is weer **één warme schaduw** en **één vraag
of beweging uit moet**. Drie van de vijf hadden hun eigen bruin gekozen en twee
hun eigen halve lezing van "rustig" — logisch bij vijf werkmappen, en precies
wat je op het scherm ziet zonder het te kunnen aanwijzen.
`eensysteem.test.ts` valt om bij de volgende die een eigen bruin kiest, en hij
vond meteen een vierde geval dat er al stond.

**Geparkeerd tot na de lancering:** het hoogtestelsel uit het tabbalk-ontwerp
(vijf treden waar Tailwinds hele schaduwtrap naar wijst). Beter dan waar we nu
staan, en het zou de omhulsels rond `Card` overbodig maken — maar het verandert
elke kaart in de app in één keer, en dat is geen wijziging voor de dag voor een
winkelbouw.
- De plugincontrole vóór het bouwen en de klassencontrole erna.
- `docs/versies.json`, en de releasenotities die vanzelf meegaan.
- De Franse abonnementsteksten: die staan nog op *Prepare for Submission* en
  gingen niet mee met 1.1. Een Franse koper ziet tot dan de Engelse, en die
  klopt.

**Nog open, geparkeerd:** een leeftijd op het profiel. De vraag is niet of het
kan maar wat de app ermee doet; zonder antwoord daarop is het een veld waar een
beoordelaar naar vraagt en waar niets mee gebeurt.

## De app

| | |
| --- | --- |
| Inhoud | 17 units, 432 opnames, 304 woorden — af |
| Website | 8 pagina's × 6 talen, nagekeken op dode links en losse eindjes |
| Tests | 1898, groen — daar zitten de 77 van de worker al in |
| Google Play | **versiecode 7 ingestuurd op 2 oktober** — productie én gesloten test, in beoordeling. De crash is gevonden, gerepareerd en twee keer bevestigd: `watzitin` ziet de vier klassen in de dex, en de app opent op de Galaxy Tab |
| App Store | **1.0 (build 7) staat live** sinds 2 oktober, stil. **1.1 (build 9) ingediend op 2 oktober**, op *Automatically release* — met de Franse abonnementsteksten erbij |
| Uitbetalen | **rond bij allebei** — Google geverifieerd op 1 oktober |

### Goedgekeurd — 1 oktober, 16:46

*"We're pleased to let you know that your app, Darijaforkids, has been
approved for distribution."* Vierde ronde bij Apple, en de eerste die het
haalde. Build 7, versie 1.0.

**Niet vrijgegeven.** Bij het inzenden is *Manually release this version*
gekozen, dus de app staat klaar en wacht op jou. Dat is precies waarvoor die
keuze er was.

##### Vrijgegeven — 2 oktober

1.0 staat live. De status in App Store Connect is *Ready for Distribution*, en
dat is niet hetzelfde als het wachten waar hieronder over geschreven werd:
wachten heet bij Apple *Pending Developer Release*. Stil vrijgegeven, zonder
aankondiging — die komt pas als Android er ook is.

Daarmee gaat het slot van de abonnementen eraf, en dat is wat de volgende drie
stappen mogelijk maakt: de vier talen bij de drie aankopen, de proefperiode bij
Maand, en één echte aankoop. Die moeten alle drie in het gat vóór 1.1 wordt
ingestuurd — zodra een versie in beoordeling is, zijn die velden alleen-lezen.

De tekst hieronder is van 1 oktober en beschrijft waarom er toen gewacht werd.

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
| ~~De proefperiode bij **Maand** nakijken~~ | **gedaan 2 oktober** — staat er, 175 landen, 3 dagen, net als bij Jaar |
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

Build 8 is gebouwd, gearchiveerd en **om 18:43 geüpload** — in Xcode Organizer
staat `1.1 (8)` op *Uploaded to Apple*. Hij wordt **niet ingediend voor de
lancering**; hij staat er om op een echt toestel te kunnen meten.

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

**Indienen: zodra 1.0 live staat.** Dan kost een afwijzing niets meer. Sinds
het besluit van 2 oktober gaat 1.0 stil live en gaat 1.1 er meteen achteraan;
de aankondiging wacht op 1.1 en 1.3 — zie *Besloten op 2 oktober* onder
**Naar go-live**. Dat haalt bovendien dit lek zo snel mogelijk uit de lucht,
zonder dat er ooit veel mensen in dat raam hebben gezeten.

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

**De ouderpoort vraagt het nog één keer per keer dat de app open is.** Hij
kwam bij élke tik terug — drie mailknoppen, het aanmeldformulier, het beheren
van het abonnement, de twee aankopen — en wie de app aan het inrichten is doet
die som tien keer op een avond.

Weghalen was gevraagd en is niet gebeurd, want de app staat sinds 27 september
in de **Kinderen-categorie** en dat was Apple's voorwaarde om de naam
*Darijaforkids* te mogen houden. Richtlijn 1.3 vraagt daar een poort vóór een
aankoop en vóór een link naar buiten. Hij vraagt níét dat die poort bij elke
tik opnieuw komt — en een poort die zo vaak komt dat men blind doorklikt,
bewaakt helemaal niets.

Het vlaggetje staat in het geheugen van de module en nergens anders: geen
`localStorage`, dus bij elke nieuwe start van de app staat het weer op nul.
Nagemeten in Chromium: eerste keer de som, daarna gaat dezelfde knop meteen
door, en na herladen is de som terug. `poortsessie.test.ts` bewaakt die grens,
inclusief dat er niets op de schijf belandt.

**De veelgestelde vragen staan nu op de ouderpagina.** Ze stonden onderaan de
landingsbladzijde — het eerste scherm dat een kind ziet als het de app opent —
en dat zijn zeven uitklappers over prijzen, talen en welk Darija wij leren.
Die zijn geschreven voor de volwassene die betaalt, en die heeft al een eigen
bladzijde; hij staat in de voetnoot.

Op darijaforkids.eu blijven ze wél onderaan staan: daar is de bezoeker de
ouder en is het de laatste twijfel die weggenomen wordt vóór het downloaden.
`make-site.mjs` leest dezelfde `t.landing.faq`, dus de website verandert niet.
Nagemeten: nul uitklappers op het app-scherm, zeven op `/ouders`, en zeven op
`site/index.html`.

**En "Waarom je kind het onthoudt" is weg — niet verhuisd.** Ook uitleg voor
de volwassene, op het scherm waar een kind elke keer op uitkomt. Verplaatsen
naar de ouderpagina zou dubbelop zijn geweest: `t.parents.methode` behandelt
daar dezelfde vier dingen, uitgebreider. De teksten blijven in `i18n` want
darijaforkids.eu toont ze wél — nagemeten, de kop staat er nog.

**Wat daarmee overblijft, opgemeten op 390 pixels breed:**

| | |
|---|---|
| Leer Darija, de taal van thuis | 1386px — met de knop "ga verder" en het proefwoord |
| Van salam tot de souq | 2136px — de zeventien units; dit is ook voor een kind leuk |
| Gemaakt om aan een kind te geven | 970px — voor de ouder, maar dit is op een telefoon de enige zichtbare weg naar de ouderpagina |
| Yallah — beginnen? | 394px |
| voetnoot | 225px |

Samen 5111 pixels, was 6347. Van 7,5 schermen naar 6,1.

Die derde blijft dus met opzet staan: de link *voor ouders* bovenin is
`hidden sm:block` en op een telefoon dus onzichtbaar. Weghalen zou de
ouderpagina alleen nog via de voetnoot bereikbaar maken.

**En toen is die grotere vraag alsnog beantwoord: de app begint nu bij het
leerpad.** Op `/` staat de landingsbladzijde alleen nog op het web; in de app
stuurt hij meteen door naar `/leren`.

Dat is geen schrapwerk gebleken maar één voorwaarde, en het lost het hele
bezwaar in één keer op. Een verkooppagina is er om iemand over te halen de app
te nemen. Wie hem opent, hééft hem — en scrolde dan elke keer zes schermen
door iets waarvan het antwoord al ja was.

Nagemeten in Chromium met `Capacitor.getPlatform()` op ios en op android: `/`
komt uit op `/leren`, met het leerpad als eerste scherm. Zonder Capacitor komt
`/` uit op de landingsbladzijde, zoals darijaforkids.eu hem nodig heeft.
`startscherm.test.ts` bewaakt het, inclusief de `replace` — zonder die zet de
omleiding een stap in de geschiedenis en valt de terugknop van Android terug op
een bladzijde die hem meteen weer vooruit stuurt.

**Wat daarmee ook opgelost is:** het blok "Gemaakt om aan een kind te geven"
hoefde niet meer te verhuizen. Het staat op een bladzijde die in de app niet
meer vanzelf opengaat, en op de website hoort het er gewoon.

**Na het betalen verandert er nu ook iets zichtbaars.** Dat deed het niet:
sloten verdwenen, de knop in de kopbalk ging weg, en verder zag de app er
hetzelfde uit. Voor iemand die net zestig euro heeft uitgegeven is dat de
verkeerde eerste indruk — de vraag die dan opkomt is "is het wel gelukt?", en
die hoort de app zelf te beantwoorden en niet de bon in een mailbox.

De profielkaart krijgt bij een lopend abonnement een gouden rand, de avatar
een ring, en onder de naam staat **Volledige toegang** met de dag erbij. Geen
pop-up en geen felicitatie om weg te klikken: iets dat er gewoon staat, elke
keer dat je kijkt.

Er staat met opzet *lid sinds* en niet *betaald op*. De eerste dagen zijn
gratis, dus de dag waarop de toegang begon is niet de dag waarop er geld af
ging. `lidmaatschap.test.ts` bewaakt dat in alle zes de talen — dat verschil
omdraaien is een kleine onwaarheid op precies de plek waar iemand zijn aankoop
controleert.

En daarmee wordt `unlockedAt` eindelijk gelezen. Dat veld lag er sinds het
begin en werd nergens gebruikt.

**"Open het e-boek" opende lichess.org.** Niet grappig bedoeld: op de iPhone
in TestFlight ging die knop naar een schaaksite.

Wat er gebeurde: de knop deed `window.open(…, '_blank')`, en dat geeft de link
door aan het toestel in plaats van aan de app. Capacitor serveert de app vanaf
`capacitor://localhost`, dus Safari kreeg
`capacitor://localhost/ebook/darijaforkids-nl.pdf` voorgeschoteld, kon daar
niets mee, en liet het tabblad zien dat er al open stond. Een bestand uit de
app-bundel kan het toestel nooit bereiken — het zit ín de app.

**Dit zit ook in build 7**, de build waarmee gelanceerd wordt. Het raakt alleen
wie het jaarabonnement of het e-boek heeft gekocht, en dat zijn er op dag één
nul, maar het is wel het eerste wat zo iemand aanklikt.

Het boek opent nu op `/boek`, binnen de app, met een knop terug. Nagemeten in
Chromium: geen enkel nieuw venster meer, en de pdf laadt vanaf `/boek` —
583 kB, beginnend met `%PDF-`.

**Nog niet nagemeten, en het moet:** of een WKWebView (iOS) en een
Android-WebView die pdf ook werkelijk tónen in een `<iframe>`. iOS doet dat
doorgaans wel, Android heeft geen ingebouwde pdf-weergave en laat dan een leeg
vlak zien. Dat is minder erg dan een schaaksite maar nog steeds stuk, en op
Android zit de grootste helft van het publiek. Lukt het daar niet, dan is de
echte weg het boek van de worker laten komen in plaats van uit de bundel —
zoals `server/src/lezer.ts` de leesboeken al doet, en dat lost ook de twee
punten in `docs/PAYMENTS.md` op.

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

#### De ronde van 1 oktober, avond — gemeten, niet aangenomen

Een laatste doorloop vóór de lancering, met de meetlat erbij in plaats van een
lijstje aanbevelingen. Wat eruit kwam zit allemaal in 1.1 / 1.3.

**Een afgebroken betaling gold als een gelukte.** De zwaarste van de avond, en
niet te zien door naar de app te kijken — alleen door de plugin te lezen.
`offer.order()` wijst niet af als een betaling misgaat: de belofte lost op,
met een foutvoorwerp erin in plaats van niets. In `store.d.ts` van
`cordova-plugin-purchase` staat het letterlijk: `Promise<IError | undefined>`.
De `try/catch` eromheen ving dus niets behalve onze eigen `throw`.

Gevolg: elke afgebroken of mislukte betaling gold als gelukt en `busy` bleef
aan staan. De knop waarmee je het opnieuw probeert bleef "Bezig…" tot de app
opnieuw startte — de enige knop in de app waar geld achter zit.

Nu wordt teruggelezen wat de bestelling teruggaf. Afbreken (code 6777006,
`PAYMENT_CANCELLED`) zet de knop stil weer aan zonder rode regel: wie zich
bedenkt heeft niets fout gedaan en hoort geen storingsmelding te zien. Al het
andere toont wat de winkel zelf zei. En `busy` gaat hoe dan ook uit, ook bij
een gelukte bestelling — dat redt *Vraag om te kopen*, waarbij een ouder op
een ander toestel goedkeurt en de betaling pas uren later volgt. Juist in een
kinderapp niet denkbeeldig. `afgebroken.test.ts` bewaakt de regel én het
nummer, tegen de plugin zelf.

**Vier toegankelijkheidsfouten, alle vier nagemeten.** De kopbalk liep bij een
wortellettergrootte van 24px op elk scherm 62px buiten beeld; met `flex-wrap`
is dat op 16, 20 én 24px nul, en bij normale grootte blijft de balk 77px.
Er was geen zichtbare focusring: nu 3px, gemeten `rgb(13,148,136)` licht en
`rgb(74,222,128)` donker. De mascotte deed acht verschillende bewegingen in
twee seconden, ook voor wie minder beweging heeft ingesteld; met
`<MotionConfig reducedMotion="user">` is dat er één. En het naamveld in de
instellingen had geen naam — de titel ernaast is een `div`, geen `label`, dus
een schermlezer las alleen de plaatshouder voor, en die verdwijnt zodra je
typt. Over tien schermen gemeten: bedienbare dingen zonder naam van 1 naar 0.

**Een foutmelding die loog.** Zonder verbinding zei het aanmeldveld op de
ouderpagina dat het aan ons lag. `aanmelden()` kent nu `'offline'` naast
`'mis'`, in zes talen, met `role="status"` zodat een schermlezer het ook
hoort.

**Drie `lazy()`-regels die niets lazy maakten.** De bouw zei het zelf:
*INEFFECTIVE_DYNAMIC_IMPORT*. `Learn` en `LessonPlayer` staan vast in het
eerste stuk — het leerpad is het eerste scherm — en halen `Bonus`, `Film` en
`HistoryCard` zelf al binnen. Nu staan ze zoals ze werken: eerste stuk van
421,0 naar 417,2 kB, drie waarschuwingen weg.

**In het woordenboek verdwijnt de slotkaart bij nul treffers.** Die gaat over
woorden die je wél ziet staan, en stond tussen de vraag en het antwoord in.

**Zonder `--versie` zegt de Android-bouw nu welk nummer erin komt.** Play
weigert een versiecode die al eens geüpload is, ook een ingetrokken upload, en
dat merkte je pas ná het bouwen en ondertekenen. De waarschuwing komt nu
ervoor, met de opdracht voor het volgende nummer erbij.

**Wat bewust níét is aangeraakt.** De 16 MB `.wav` in de bundel — 432 mono-
opnamen, 16 bit, 16 kHz. Comprimeren scheelt ruwweg zes keer, maar 432
menselijke opnamen hercoderen een paar dagen voor de lancering is precies het
soort wijziging waarvoor we build 7 boven build 8 hebben gekozen. Na de
lancering, als eigen ronde, met luistercontrole.

**Wat schoon bleek.** Geen TODO, FIXME of plaatshouder in de app-code. Twee
`console.error`, allebei terecht (de foutgrens en een winkel die niet start).
De lege schermen van `/herhalen`, `/verhalen`, `/profiel` en het woordenboek
zeggen alle vier wat er aan de hand is en wat je eraan kunt doen. De
koopknoppen stonden al uit tijdens `busy`.

Stand na de ronde: **1339 tests groen in 56 bestanden**, `tsc -b --force
--noEmit` schoon, productiebouw schoon.

#### Wat er van de grote taalapps geleend is — 1 oktober, avond

De vraag was: neem inspiratie van Duolingo. Het antwoord bleek niet "er
ontbreken mechanieken" maar "er staan er drie aan die nooit afgaan".

De app had het hele arsenaal al: XP, niveaus, edelstenen, hartjes die
teruggroeien, een reeks, een dagdoel, vijf dagmissies, insignes, een
herhaalalgoritme en een dagelijkse herinnering. Drie daarvan waren dode code.

**Edelstenen gingen nergens heen.** Vijf missies leveren er eenentwintig per
dag op, plus één per reeks van vijf goede antwoorden. Ze stapelden zich op tot
een getal in de kopbalk dat niets deed. En er lagen twee bestemmingen klaar die
allebei nooit bereikt werden: `refillHearts(kosten)` werd door niemand
aangeroepen, en `addXp` kende de vriesdag wel maar nergens ging dat aantal
omhoog — die tak was onbereikbaar.

Nu kosten een volle rij hartjes 15 edelstenen en een vriesdag er 25, met
hoogstens twee op zak. **Nooit met geld**: edelstenen komen alleen binnen door
te spelen. In de kinderafdeling van Apple ligt dat gevoelig, en terecht — een
kind hoort niet tegen een muur te lopen die alleen met de portemonnee van zijn
ouder weggaat. Om dezelfde reden krijgen abonnees géén onbeperkte hartjes,
hoe goed dat ook voor de omzet zou zijn: dan is de gratis versie expres
vervelend gemaakt, en dat is precies het patroon waar een beoordelaar naar
kijkt.

**Het scherm "je hartjes zijn op" was een doodlopende weg.** Een mascotte, een
zin en één knop terug — precies het moment waarop een kind de app wegklikt.
Er staan nu drie wegen: aanvullen, herhalen (dat met `useHearts={false}`
draait en dus echt nooit een hartje kost — het stond al in de uitleg, er was
alleen geen knop) en terug. Plus de tijd tot het volgende hartje, die alleen
in een `title` op de kopbalk zat; een tooltip bestaat op een telefoon niet.

**Het dagdoel werd nooit "gehaald" genoemd.** `goalMet` stond in de engine en
werd door geen enkel scherm gelezen. Mijlpalen voor de reeks bestonden niet.
Het scorescherm van een les toont nu een eigen kader met wat déze les afsloot:
het dagdoel, de reeks op 3/7/14/30/50/100/200/365 dagen, en een vriesdag die
de reeks heel hield. Een mijlpaal krijgt het gejuich, als laatste in de rij —
hij gaat niet over deze les maar over alle dagen ervoor. En de balk in de
kopbalk wordt groen met een vinkje zodra het doel binnen is.

Twee fouten die bij het nameten bovenkwamen en meteen mee zijn: de lestip kwam
over het hartjesscherm heen, en de eerste versie van het vieren vergeleek met
de staat van vlak vóór het afronden. Dat is te laat — een goed antwoord betaalt
meteen uit, dus `addXp` loopt tijdens de les al mee, en tegen de tijd dat
`finish` draait is de reeks allang opgehoogd. Nagemeten op een echte les: reeks
op 3, een mijlpaal, en er kwam niets in beeld. Nu wordt de staat van vóór de
rónde vastgehouden, en `mijlpaal.test.ts` leest de bron.

Alles nagelopen in de browser op 390px, met een uitgespeelde les.

Stand: **1361 tests groen in 58 bestanden**, `tsc -b --force --noEmit` schoon.

#### De tweede doorloop — 1 oktober, laat

Een ronde langs de dingen die de eerste doorloop niet had gemeten: de
platformgewoontes, het krapste scherm, de formulieren en de schil om de app
heen.

**Het paneel had geen voor- en geen achterdeur.** Het was een `role="dialog"`
met `aria-modal="true"` erop, en verder niets wat daarbij hoort. Het raakt
zeven panelen tegelijk — de taalkeuze bij de eerste start, de ouderpoort, de
lestip, het keuzescherm, stoppen-met-een-les, de terugkoppeling en het wissen
van alle voortgang. De focus bleef erbuiten (een schermlezer las de bladzijde
erachter voor, die niemand meer kon bedienen), Escape deed niets, de bladzijde
eronder schoof mee met een veeg, en **de terugknop van Android ging een
bladzijde terug in plaats van het paneel te sluiten** — op Android precies
verkeerd om, want dat is de knop waarmee je álles wegklikt. Alle vier
gerepareerd in `kit.tsx`, met `src/engine/terug.ts` voor de terugknop.

Let op het detail dat er bijna in bleef zitten: `onClose` is bij elke
gebruiker een pijlfunctie in de JSX, dus een ander ding bij elke tekening.
Stond hij in de afhankelijkheden van het effect, dan werd alles continu
opnieuw opgehangen en sprong de focus telkens terug naar het begin van het
paneel — middenin het typen van de rekensom.

**Op een kleine telefoon met grote letters liep de app buiten beeld.** 320px
breed (een iPhone SE) met een wortellettergrootte van 24px (de grootste
stand). Nagemeten over dertien bladzijden: op élke bladzijde liep er iets
buiten beeld, tot 78px toe, en dan schuift de hele app opzij met de kopbalk en
de knoppen erin. Vijf oorzaken, allemaal "iets wat niet mocht krimpen of niet
mocht afbreken": een Duits woord van negentien letters dat niet afbrak
(`overflow-wrap: break-word` staat nu op `body`), `shrink-0` op de tellers in
de kopbalk, het niveaupilletje naast een unittitel, vier plekken zonder
`min-w-0` in een flex-rij, en `max-w-56` — veertien rem, wat bij 24px
wortelgrootte 336px is en dus op een scherm van 320 geen boven- maar een
ondergrens. Na afloop: 13 bladzijden × 9 combinaties van breedte, lettergrootte
en taal, alles binnen beeld.

**Twee foutmeldingen waren alleen te zien, niet te horen.** De rekensom vóór
een abonnement en de melding dat een betaling misging — achter allebei zit
geld. Nu `role="alert"`, met `aria-invalid` en `aria-describedby` op het veld.

**De rand van het scherm paste niet bij de app.** `theme-color` stond op één
waarde, de donkere, dus op een toestel in de lichte stand tekende Android een
nachtblauwe balk boven een crèmekleurige app. Nu twee waarden, vastgehouden aan
`--surface` door een test. En de instellingen voor `SplashScreen` in
`capacitor.config.ts` zijn weg: `@capacitor/splash-screen` staat niet in
`package.json`, dus ze deden niets. Het startscherm komt van de kant van het
toestel en bestaat daar al in een dag- en een nachtversie.

**Gemeten en in orde, dus niets aan gedaan.** Het opstarten: met alleen de
processor afgeremd — wat klopt voor een winkel-app, want daar staan alle
bestanden in de app zelf — is het leerpad bij 4× trager klaar in 223ms (lcp
660ms) en bij 6× trager in 424ms (lcp 1520ms). Geen knelpunt dat iemand voelt.
De toestemming voor meldingen wordt pas gevraagd nadat iemand de herinnering
zelf aanzet, niet bij het opstarten. De ontwikkelschermen `/uitspraak` en
`/opname` staan niet in de productiebouw (`"/uitspraak"`: nul treffers). Het
nep-Apple-ID `6751234567` staat alleen in een test en een commentaarregel,
nergens in de app. Twee missies tegelijk aanklikken kan niet dubbel uitbetalen,
want `setState` is synchroon. En in de productiebouw staat geen enkele
`console.log`.

**Niet te controleren vanuit hier.** De uitgaande verbindingen van deze
omgeving zijn dicht (de poort geeft 403 op CONNECT), dus de negen externe
links in de app — de vier socials, de twee Gumroad-bladzijden, de EULA van
Apple, darijaforkids.eu en de YouTube-video — zijn niet nagelopen. Dat is een
handmatig vinkje.

Stand: **1383 tests groen in 61 bestanden**, `tsc -b --force --noEmit` schoon,
productiebouw schoon.

#### De derde doorloop — 1 oktober, avond laat

Vijf vondsten, waarvan twee die alleen op Android te zien zijn en één die een
hele categorie fouten afdekt.

**Zeven kleurklassen deden niets.** Tailwind 4 maakt `text-zellige-200` alleen
aan als er een `--color-zellige-200` bestaat. Bestaat hij niet, dan is dat geen
fout en geen waarschuwing: de regel verdwijnt en het element houdt de kleur die
het al had. Zeven van zulke klassen stonden in de app — `zellige-200`,
`zellige-400`, `mint-200`, `mint-300`, `mint-700`, `saffron-700`, `khatim-300`
— en op één na allemaal `dark:`-varianten, dus precies de regels die je in de
lichte stand niet ziet missen. Het badje "incl. e-boek" viel daardoor in de
donkere stand terug op zijn lichte kleur: **2,06 op 1**.

**En negen groepen tekst waren te licht.** Gemeten over twaalf bladzijden in
allebei de standen. De grootste was `text-zellige-600`, de kleur van de
transcriptie — "salam" onder het Arabisch — op 3,74, en alleen in het
woordenboek al driehonderdvier keer. `zellige-600` en `-700` zijn daarom
allebei een trede donkerder; verder kregen de plus-en-min bij de veelgestelde
vragen, de wisknop, het sterrengetal op de profielpagina en het e-boekbadje een
eigen reparatie. **Na afloop: twaalf bladzijden, allebei de standen, alles
haalt de norm.**

`kleuren.test.ts` leest voortaan alle kleurklassen uit de bron en legt ze naast
de tokens, en controleert dat elke reeks van licht naar donker loopt. Dat is de
test die de hele categorie afdekt.

**Acht knoppen waren te klein om te raken.** De veelgestelde vragen staan sinds
deze ochtend op de ouderpagina: zeven uitklappers van 24 pixels hoog onder
elkaar. De stemkeuze in de instellingen kwam uit op 41. Van elf te kleine
raakvlakken naar drie, en die drie staan er met reden — het pijltje op
`/woorden` (36, want de strook eronder is zelf 36 en een grotere pijl verbergt
precies de knop die je wilde zien) en twee links middenin een zin, waar WCAG
2.2 zelf de uitzondering voor maakt.

**De terugknop van Android sloot het keuzescherm de app af.** Dat paneel heeft
geen `onClose` — het heeft zijn eigen twee knoppen — dus stond er geen
luisteraar op de terugknop en deed Android zijn standaardding. Op een verse
installatie is er geen bladzijde om naar terug te gaan, dus dat is de app
verlaten, bij het tweede scherm dat een nieuwe gebruiker ooit ziet. Het paneel
kent nu `onTerug` naast `onClose`: Escape en de terugknop sluiten het, een tik
náást het paneel niet. Dat verschil is er niet voor de sier — dit scherm komt
één keer voorbij, en een kinderduim die ernaast landt zou het voorgoed
wegnemen.

**En de terugknop liep zomaar een les uit.** Het kruisje vraagt "stoppen met
deze les?", de terugknop deed dat niet. Nu wel.

**Het foutscherm had een onleesbare knop.** Dat scherm is met de hand
ingetypt — geen klassen, geen variabelen, niets wat zelf nog kan omvallen — en
dat is precies waarom de kleuren er achterbleven toen de tokens donkerder
werden. Wit op `#14b8a6`: 2,49, op de enige knop van het scherm.

**Gemeten en in orde, dus niets aan gedaan.** Het wegschrijven van de
voortgang: `emit()` zet bij elke wijziging de hele staat in de opslag. Met een
jaar voortgang erin (66 kB, 504 kaarten) kost dat 3,05 ms per keer bij 6×
afgeremde processor, en er gaan 1,3 schrijfacties per beantwoorde vraag
overheen. Dat is vier milliseconde per antwoord — een kwart beeldje, niet te
voelen. Geen reden om er iets aan te forceren. En afgezien van de zeven
kleurklassen staat er geen enkele klasse in de app die de gebouwde css niet
haalt.

Stand: **1399 tests groen in 62 bestanden**, `tsc -b --force --noEmit` schoon,
productiebouw schoon.

#### De vierde doorloop — de dingen die niemand ziet tot het misgaat

Deze ronde ging over veiligheid, kapotte gegevens en wat er gebeurt als iemand
de app te hard aanpakt. Vier vondsten.

**Twee gaten waar een sleutel door kon.** `play-api.json` — de dienstrekening
van Google Play, waarmee je een update kunt uitbrengen onder iemands naam —
stond niet in `.gitignore`. De scripts vragen er met `--sleutel <pad>` naar en
dat pad wijst juist naar buiten de map, maar hem er "even bij zetten" is
precies wat je op een drukke dag doet, en `git add -A` is één toetsaanslag.
Hetzelfde voor `.env.production`: de hoofdmap negeert `.env`, `.env.local` en
`.env.*.local`, maar niet die. Allebei dicht, plus de ondertekensleutels van
Apple en de twee Google-bestanden die er zouden komen als er ooit Firebase bij
komt.

De rest van de controle was schoon: geen privésleutel en geen dienstrekening
in enig gevolgd bestand, niets van dien aard in de productiebouw, en precies
vier `import.meta.env`-waarden in de app — `DEV`, `PROD`, `VITE_DEMO` en
`VITE_POST`. Die laatste is een adres dat toch in elk netwerkverzoek staat.
`KOOP_GEHEIM` en `MAIL_SLEUTEL` blijven op de server. `sleutels.test.ts` vraagt
het voortaan aan git zelf.

**Vier van de veertien kapotte opslagen lieten de app omvallen.** `daily`,
`cards`, `lessons` of `extraCards` op `null` is genoeg: `Object.keys(null)`
werpt, en dat gebeurt in de eerste tekening van het leerpad. Het foutscherm
ving het op, dus niemand zat voorgoed vast — maar de uitweg die het biedt is
"wis alles", en dan is er een jaar voortgang weg om één kapot veld. `hydrate`
neemt een bewaarde waarde nu alleen over als hij de vorm heeft die deze versie
verwacht; alles wat nog wél klopt blijft staan. Na afloop starten alle veertien
op.

**Twee keer drukken betaalt nooit twee keer** — nagemeten in plaats van
aangenomen. Een missieknop twintig keer achter elkaar ingedrukt levert
eenentwintig edelstenen op, precies de som van alle vijf de missies. Het werkt
om één reden die nergens stond: `setState` zet de nieuwe staat er synchroon in,
dus de tweede druk leest al de uitkomst van de eerste. `dubbeltik.test.ts`
houdt dat vast. De rest van de stoeitest gaf hetzelfde beeld: vierentwintig
keer snel springen tussen bladzijden, twintig keer een paneel openen en
sluiten, twintig keer terug — geen enkele uitzondering.

**De inkt waarmee een kind een letter natekent haalde 2,99 op 1.** Die stond
met de hand ingetypt op de oude waarde van `--color-zellige-600` en bleef
achter toen die donkerder werd. De norm voor iets wat geen tekst is maar je
wél moet kunnen zien is 3, en natekenen is een van de twee dingen die deze app
met het Arabische schrift doet. Er is nu een `--inkt-tekenen` per thema;
nagemeten door de lagen echt over elkaar te tekenen en de pixel terug te
lezen: 4,11 licht en 8,00 donker. Die tweede is het bewijs dat één vaste kleur
niet kon kloppen.

**De afhankelijkheden: nul kwetsbaarheden in alles wat meegaat in de app.**
Tien pakketten, allemaal met een reden. Geen analytics-SDK, geen
crashrapportage, geen advertenties, geen volgsoftware — wat de
privacyverklaringen bij allebei de winkels eenvoudig en eerlijk houdt.

`npm audit` meldt wél drie keer "moderate", en die zijn met opzet blijven
staan. Ze komen alle drie uit één plek: `uuid` onder `xcode` onder
`@capacitor/cli`. Dat is een **ontwikkelgereedschap** dat niet in de app
terechtkomt, de fout gaat over een controle op een buffer die alleen misgaat
als je zelf een buffer meegeeft, en `npm audit fix --force` lost het op door
`@capacitor/cli` te **verlagen** naar 8.4.3 — een brekende wijziging in het
gereedschap dat allebei de winkelbouwen maakt, dagen voor de lancering. De
reparatie is hier riskanter dan de fout.

Stand: **1449 tests groen in 66 bestanden**, `tsc -b --force --noEmit` schoon,
productiebouw schoon.

#### De vijfde doorloop — zelfstandig, langs alles wat nog niet gemeten was

**Een koper kreeg te lezen dat hij moest kopen wat hij al had.** Op `/boek`
stond één tak voor "je hebt het boek nog niet", met de tekst van een lés achter
het slot erin: *"Deze unit hoort bij de volledige toegang."* Het boek gaat pas
open ná de gratis dagen — een pdf houd je zodra je hem één keer opent — dus die
drie dagen lang las een betalende klant dat hij moest kopen wat hij een uur
eerder gekocht had. De tekst voor het wachten bestond al en stond op
`/volledig`; nu staat dezelfde hier, met dezelfde datumopmaak.

**Het e-boek was liggend een strook van 48 pixels.** De leeskolom had een vaste
hoogte van `100vh - 10rem`. Op een staande telefoon klopt dat; leg hem plat en
het venster is nog 390 pixels hoog. Nagemeten hield de pdf er 48 van over, en
omdat de hoogte vastzat kon de bladzijde ook niet scrollen: een product van
€ 14,99 zonder weg eruit. Niets houdt de stand van het scherm tegen — Android
draait vrij mee en een iPad staat standaard liggend. Met
`max(37rem, calc(100vh - 10rem))` gaat 844×390 van 48 naar 410 pixels en
blijft 390×844 ongewijzigd.

**Drie bladzijden hadden geen enkele kop**: deze, "deze les bestaat niet" en
"dit verhaal bestaat niet". Op zo'n bladzijde staat verder niets, dus een
schermlezer landt op niets.

**Het ruwe prijsgetal is van de ouderpagina af.** Daar stond achter een knop
wat de winkel over de prijzen zei — met opzet, want staat daar een andere munt
dan op het keuzescherm, dan zit de fout bij ons. Maar er stond ook een kolom
met `59990000` in. Die hielp niemand en maakte van een hulpmiddel voor de ouder
een stuk ontwikkelaarsuitvoer, op precies het scherm dat allebei de winkels als
ondersteuningsadres opvragen.

**Nieuwe bewakers.** De zes e-boeken (bestaat het, begint het met `%PDF-`, is
het niet verdacht klein), de vier lettertypen, elk pad dat `index.html` en de
manifest noemen, en of er ergens nog Nederlands in een andere taal staat.

Die laatste was het nakijken waard: het typesysteem bewaakt dat elke sleutel
*bestaat*, maar niet dat de waarde iets anders is dan het Nederlands —
`titel: 'Woordenboek'` haalt de controle in alle zes de talen. Uitkomst: **684
teksten per taal, en nul die nog gelijk zijn aan het Nederlands.**

**Wat er nagemeten is en in orde bleek**, en waar dus niets aan gedaan is:

- **Offline.** Er is een service worker. Met het netwerk uit laden alle routes
  door, ook na een harde herlaad.
- **Alle eenentwintig instellingen** worden ergens gelezen en doen iets.
- **Het laadbericht** van een bladzijde is bij 1× én 6× afgeremde processor
  nooit in beeld: de stukken komen van schijf en React tekent het nooit.
- **Negentien rommelroutes** — lege parameters, vierhonderd tekens lang,
  vreemde tekens — allemaal netjes opgevangen.
- **Een naam van vierentwintig tekens** en tellers van zeven cijfers lopen
  nergens buiten beeld.
- **Liggend**: geen enkele bladzijde buiten beeld bij 844, 667 of 1024 breed,
  ook niet met de grootste letters.
- **Naar de achtergrond en terug**, vier keer middenin een les: voortgang
  bewaard, nog op dezelfde bladzijde, geen uitzondering.
- **Alle 304 woorden, 100 zinnen en 28 letters** hebben een menselijke opname.
  De spraakmachine is een vangnet dat in de praktijk nooit nodig is.
- **Wat er over de lijn gaat**: aanmelden stuurt adres, taal en twee vinkjes;
  de weekmelding zes getallen en een id. Geen woorden, geen antwoorden, geen
  naam, geen toestelgegevens — en alleen na een bevestigd adres met een
  expliciet vinkje, hoogstens één keer per dag.
- **Vensterhoogtes**: afgezien van `/boek` gebruikt niets een vaste hoogte op
  vensterbasis.

**Eén ding bewust blijven staan, voor ná de lancering.** De service worker
gebruikt één vaste cachenaam (`darija-kids-v1`). Voor alles met een hash in de
naam klopt dat — een nieuwe bouw heeft een ander adres en wordt gewoon
opgehaald. Maar de bestanden uit `public/` houden hun adres: wordt er ooit een
e-boek bijgewerkt, dan krijgt een terugkerende **webbezoeker** de oude. Dat
raakt alleen darijaforkids.eu — in de winkel-app staat de service worker uit
(`!native` in `main.tsx`) — en elke oplossing kost óf een bouwstap óf 3,4 MB
heen en weer. Dat is geen afweging voor de week van de lancering.

**En de spelletjes, met profielen van nul tot alles.** Daar kwamen vier van de
vijf spellen op het foutscherm — maar de oorzaak lag niet waar ik hem zocht:
mijn eigen proefopslag schreef kaarten zonder `id`, en dat is niet wat de app
schrijft. Met goede kaarten werkt alles, van nul tot acht geleerde woorden.
Het legde wel twee echte gaten bloot.

`poolFrom` las het woord-id uit de kaart zelf. Mist dat veld — een oudere of
beschadigde opslag — dan staat er een lijst vol `undefined` in de poel en werpt
`word(undefined)`. De sleutel van de verzameling ís het woord-id en kan dat
niet overkomen, dus die wordt nu gelezen.

En de bewaking in `Bonus.tsx` stond ná de `useMemo` die `build` aanroept.
Een `useMemo` draait tijdens het tekenen, dus `build` werd altijd eerst
aangeroepen, ook voor een opdracht waar nog te weinig voor geleerd was. Vandaag
valt dat niet om, maar de regel las alsof ze beschermde en dat deed ze niet.

**Een kaart waar niet meer mee te rekenen valt, begint nu opnieuw.** `review`
telt bij elk veld iets op; mist er één getal dan is alles erna NaN, en NaN komt
nooit meer terug. Die ene kaart blijft dan voor altijd stuk: hij komt nooit
meer terug om te herhalen. Dat is geen crash en daarom juist vervelend — het
woord verdwijnt stilletjes uit het herhaalschema van een kind. `heelOfNiets`
kijkt bij het ophalen of de zes getallen eindig zijn en laat `newCard` hem
anders opnieuw beginnen: de geschiedenis van één woord kwijt, al het andere
gered. Bij het ophalen en niet in `review` zelf, want dat is het rekenhart van
het schema.

Stand: **1496 tests groen in 69 bestanden**, `tsc -b --force --noEmit` schoon,
productiebouw schoon. Alle meetharnassen opnieuw gedraaid: contrast schoon in
beide standen, drie raakvlakken over met reden, veertien kapotte opslagen
overleefd, negentien rommelroutes opgevangen, vierendertig bladzijdeladingen
zonder fout, negen combinaties van breedte en lettergrootte binnen beeld, vier
liggende formaten binnen beeld, offline alle routes door, en de stoeitest
zonder enige uitzondering.

#### Play heeft inzending 4 afgewezen — 2 oktober

> **Crashes**: Your app crashes after opening.
> Version code 4: In-app experience

Eén echt punt. De tweede regel in Policy status ("Not adhering to Google Play
Developer Program policies") heeft geen eigen inhoud; dat is de koepelregel die
Google ernaast zet.

**Wat dit niet is.** Niet de knoppen onder de balk van Android 15 — dat was de
eerste gok en die klopte niet. Niet een afgewezen winkeltekst. Niet iets wat de
doorloop van 2 oktober al gerepareerd heeft: die raakt de opstartcode nergens,
dus **versiecode 5 heeft dit vrijwel zeker ook**.

**Wat er in de code is nagekeken, zonder resultaat:**

| | |
|---|---|
| `AndroidManifest.xml` | `android:exported` staat er, rechten zijn minimaal, niets bijzonders |
| Native bibliotheken | geen enkele — de 16 KB-paginaregel van Play raakt deze app niet |
| `minifyEnabled` | staat uit, dus ProGuard heeft niets weggesnoeid |
| Versies | Capacitor 8.5.2, AGP 8.13.0, Gradle 8.14.3, target en compile 36 — dat hoort bij elkaar |
| De opstartcode in JS | `platform()` kan niet werpen, `Grens` staat buiten `App`, de eerste start is uitgebreid nagemeten |

Eén echte vondst, maar geen crash: `res/xml/locales_config.xml` noemt nl, fr,
de, es en en — **Italiaans ontbreekt**, terwijl de app zes talen heeft. Daardoor
kan een Italiaans gezin de app niet op Italiaans zetten in de taalinstelling
van Android 13+. Dat staat los van de afwijzing en is met opzet nog niet
aangeraakt, zodat de volgende bundel met de vorige te vergelijken blijft.

**Waar het antwoord wél ligt: het Pre-launch report.** Play draait elke
geüploade bundel automatisch op echte toestellen. Crasht hij bij het openen,
dan staat de stacktrace daar, met video en toestelnaam. Play Console → *Test
and release* → *Testing* → **Pre-launch report**, en dan versiecode 4 kiezen.

**En reproduceren met een bundel, niet met een apk.** `npm run apk` maakt niet
wat Play installeert: Play bouwt gesplitste APK's uit de `.aab`. Upload
versiecode 5 naar **Internal testing** — die baan gaat niet langs de
beoordeling en raakt de afwijzing niet — en installeer hem via de uitnodiging
op de Galaxy Tab.

**Niet opnieuw indienen voordat dit begrepen is.** Een herhaalde afwijzing op
hetzelfde punt telt bij Google mee voor je accountstatus.

##### De oorzaak: `MainActivity.java` stond niet in de repository — 2 oktober

Nagespeeld op de Galaxy Tab A (SM-T510, Android 11) via de interne testbaan,
en de stacktrace laat niets te raden over:

```
java.lang.ClassNotFoundException: Didn't find class
"app.darijaforkids.learn.MainActivity" on path: DexPathList[[zip file ".../base.apk", ...]]
```

De hoofd-`.gitignore` van de map erboven gooit `android/` weg, met een
uitzondering voor `bladi/android/` — de naam die deze map vroeger had. Bij de
hernoeming naar `darija-kids` is die uitzondering niet meegegaan. Een deel van
de bestanden stond er toch in, ooit met `git add -f` erin gezet, maar de enige
Java-klasse van de app niet.

En die wordt door niets teruggemaakt. `npx cap sync` schrijft
`capacitor.config.json`, `capacitor.plugins.json` en `res/xml/config.xml`
opnieuw — dat waren de drie andere ongevolgde bestanden — maar
`MainActivity.java` komt alleen uit `npx cap add android`, en dat doe je één
keer.

**Waarom niemand het zag.** Gradle heeft niets te compileren, dus de bouw
slaagt zonder één waarschuwing. De bundel is te ondertekenen, te uploaden, en
Play neemt hem aan. Pas bij het starten zoekt Android de klasse waar het
manifest naar wijst, vindt hem niet, en sluit de app af. Het startscherm uit
het thema komt nog wel in beeld — vandaar "de logo is eventjes zichtbaar en
verdwijnt weer".

Dat verklaart ook waarom het bij versie 2 al een keer gebeurde, met exact
dezelfde zin van Google, en waarom het toen met een nieuwe bundel vanzelf weg
leek: die werd gebouwd op een machine waar het bestand lokaal nog stond.

**Wat er gerepareerd is.** De uitzondering staat nu op `darija-kids/android/`
en `darija-kids/ios/`, en `MainActivity.java` zit in de repository.
`androidbron.test.ts` bewaakt het: hij kijkt niet of het bestand bestáát — dat
deed het, op de machine waar het ooit is aangemaakt — maar of `git ls-files`
hem meeneemt, of geen negeerregel hem raakt, en of `namespace` plus
`android:name` precies uitkomen op de klasse in het bestand. Nagemeten door het
bestand uit de index te halen: dan valt de test om.

**Wat er nu moet gebeuren.** Versiecode 5 is op, want die bundel staat al op de
gesloten en de interne baan. De reparatie gaat dus in **versiecode 6**, naam
1.3.

**Bevestigd op het toestel — 2 oktober.** Versiecode 6 is lokaal als `.apk`
gebouwd en op de Galaxy Tab A (SM-T510, Android 11) gezet. Hij opent. Daarmee
is de diagnose niet langer een vermoeden: dezelfde code, hetzelfde toestel,
alleen `MainActivity.java` erbij, en de crash is weg.

Dat ging niet in één keer. `adb install` gaf eerst
`INSTALL_FAILED_UPDATE_INCOMPATIBLE` — de app die er stond kwam van Play en is
door Google ondertekend, de lokale `.apk` met onze eigen sleutel, en Android
weigert dan de vervanging. Er is dus een `adb uninstall
app.darijaforkids.learn` nodig vóór de installatie, en wat je daarna opent is
echt de nieuwe bundel. Zonder die stap test je de oude app en lijkt de
reparatie niet te werken.

##### Het tweede gat van hetzelfde soort — 2 oktober

Bij het opruimen van de eerste bleek er een tweede, met precies dezelfde vorm:
iets ontbreekt, niets klaagt, de bundel slaagt.

`npx cap sync android` vond op Windows **één** plugin waar dezelfde opdracht op
de Mac er **drie** vond. `@capacitor/haptics` en
`@capacitor/local-notifications` staan wel in `package.json`, maar stonden daar
niet in `node_modules` — `npm install` was na een `git pull` niet gedraaid.
`cap sync` slaat zo'n pakket stil over en schrijft hem niet in
`android/app/src/main/assets/capacitor.plugins.json`. Gradle leest daarna
alleen dat bestand.

Het gevolg is geen crash maar iets wat je nog moeilijker vindt: de app start,
doet alles behalve trillen, en zet nooit een herinnering klaar. Dat merk je
niet bij het bouwen, meestal niet bij het testen, en wel aan een recensie.

**Twee controles, op twee momenten.** `scripts/lib/plugins.mjs` draagt ze
allebei.

*Vóór het bouwen.* `npm run aab` vergelijkt wat er in `package.json` staat met
wat er is ingeschreven, en breekt af als er iets mist — vóór Gradle begint, dus
je wacht niet eerst een paar minuten voor niets. Het onderscheid tussen een
plugin en een gewoon pakket komt niet uit de naam (`@capacitor/core` heet ook
zo en is er geen) maar uit het veld `capacitor` in de `package.json` van het
pakket zelf: hetzelfde veld waar `cap sync` op afgaat.

*Ná het bouwen.* `npm run watzitin` kijkt nu ook in de `classes.dex` van de
bundel. Een java-klasse staat daar letterlijk als
`Lapp/darijaforkids/learn/MainActivity;`, dus er hoeft niets voor ontleed te
worden. Het script zet elke verwachte klasse ernaast — de app zelf uit
`namespace` plus `android:name`, en elke ingeschreven plugin — en weigert de
bundel als er één ontbreekt.

**Dit is de controle die de afwijzing had tegengehouden.** `watzitin` bestond
al en woog alleen het javascript. Dat was niet genoeg: het javascript in
versiecode 4 en 5 was in orde, de java was er niet. Nagemeten op twee
nagemaakte bundels, één met alle vier de klassen en één met alleen
`AppPlugin`: de eerste komt erdoor, de tweede valt af met de juiste namen
erbij.

##### En de versienummers staan nu ergens — 2 oktober

`android/app/build.gradle` wordt bij elke bouw overschreven en gaat niet
terug de repository in. Daar staat dus nog `versionCode 1`, terwijl Play er al
vijf heeft gezien. Wie uit een verse kloon bouwt leest die 1 en krijgt na het
bouwen, het ondertekenen en het wachten te horen dat het nummer al gebruikt is.

Dat is hier misgegaan: op 1 oktober is `--naam 1.1` geadviseerd terwijl 1.2 al
live stond.

`docs/versies.json` gaat wel mee. `npm run aab` schrijft er na elke geslaagde
bundel in bij, en zegt erbij dat het bestand gecommit moet worden. Beide
scripts stellen voortaan het hoogste van de twee plus één voor — en met een
echt nummer erin, niet met punthaken.

| | |
|---|---|
| versiecode 4 · 1.2 | Play productie, live |
| versiecode 5 · 1.3 | gesloten en interne test |
| versiecode 6 · 1.3 | lokaal gebouwd, opent op de Tab, niet geüpload — twee plugins ontbraken |
| versiecode 7 · 1.3 | gebouwd uit `c5eb94c`, 22,8 MB, vier klassen nagekeken |

##### Versiecode 7 is de bundel die eruit moet — 2 oktober

Gebouwd uit `c5eb94c`, nadat `npm install` de twee ontbrekende plugins had
binnengehaald. `npm run watzitin` zet er vier vinkjes neer:

```
  ✓ de app zelf                    app.darijaforkids.learn.MainActivity
  ✓ @capacitor/app                 com.capacitorjs.plugins.app.AppPlugin
  ✓ @capacitor/haptics             com.capacitorjs.plugins.haptics.HapticsPlugin
  ✓ @capacitor/local-notifications com.capacitorjs.plugins.localnotifications.LocalNotificationsPlugin
```

De dex is 8311 kB. Dat getal is het hele verhaal: in de bundels die Play
afwees zat die klasse er niet in, en niets in de bouw zei daar iets over.

**Geüpload en bevestigd — 2 oktober.** `npm run track` heeft hem op de gesloten
test gezet (edit 02257643510154281970, versiecode 7), nadrukkelijk zonder hem
ter beoordeling te sturen: de bundel stáát er, en daar gaat het om, want
daarmee begint Google vanzelf aan het rapport vóór lancering.

Dezelfde bundel is als `.apk` op de Galaxy Tab gezet en opent. Twee
bevestigingen dus, los van elkaar: de klassen zitten er aantoonbaar in, en het
toestel start hem.

##### Waarom er nooit een rapport vóór lancering kwam — 2 oktober

Het rapport bleef leeg: *"Upload artifacts to generate pre-launch reports."*
Net als bij versiecode 5. In de console staat waarom, bij de release zelf:

> **1.3** — *Not yet sent for review.* 1 version code → 7

`npm run track` legde de wijziging vast met `changesNotSentForReview=true`, en
daar stond een redenering onder die geloofwaardig was en niet klopte: het
rapport zou van de geüploade bundel komen en geen beoordeling nodig hebben, dus
niet insturen was juist de bedoeling — eerst lezen, dan insturen.

Een release die niet is ingestuurd staat stil. Google doet er niets mee, de
testers krijgen hem niet, en er valt niets te rapporteren. Twee bundels lang is
er gewacht op een rapport dat niet kon komen.

**Wat er gerepareerd is.** `npm run track -- --insturen` stuurt hem meteen in.
De vlag blijft met opzet uit als standaard — insturen is een handeling naar
buiten en die hoort gevraagd te worden — maar wie hem weglaat leest nu dat de
release stilstaat, met de opdracht erbij, in plaats van de belofte van een
rapport. `track.test.ts` bewaakt dat: de stilstaande tak mag het woord "rapport"
niet beloven.

Insturen op een testbaan is licht. Het raakt de winkelvermelding niet en
productie blijft staan waar hij staat.

En nog een oude val uit de weg: `naartrack.mjs` stelde `--versie 3 --naam 1.2`
voor, een nummer dat Play allang gezien heeft. Net als `watzitin.mjs` leest hij
nu `docs/versies.json`.

##### De weg vooruit bij Play, concreet — 2 oktober

De Publishing overview liet zien waarom er niets bewoog, en het was erger dan
een stilstaande release. **Managed publishing** staat aan, en er stonden
**negentien** wijzigingen te wachten — waaronder:

> **Production** → `4 (1.2)` → *Start full rollout*

Dat is de afgewezen bundel. Insturen zou hem ongewijzigd opnieuw ter
beoordeling sturen én uitrollen naar productie, en onder managed publishing
sleept één afwijzing de andere achttien mee onderuit.

Splitsen kan niet: *Save for later* is uitgeschakeld, omdat de
winkelvermeldingen en App content de hele app raken.

**Wat de releasepagina van `4 (1.2)` toevoegde.** Geen *Edit*, alleen *Discard
release* — en: *Percentage of install base on this release: **0.00%***. Samen
met zes winkelvermeldingen die nog als "Add language" in de wachtrij staan,
betekent dat: **de app is op Google Play nooit uitgekomen.** Er staat niets
live. Weggooien kost dus niemand iets.

**De volgorde is daarmee:**

1. `4 (1.2)` weggooien met *Discard release*.
2. Production → *Create new release* → *Add from library* → **versiecode 7**,
   naam 1.3, met de notities uit `store/wat-is-nieuw-1.3.md`.
3. Publishing overview nakijken: onder Production hoort `7 (1.3)` te staan.
4. *Submit changes for review* — alles in één keer: productie, de gesloten
   test, zes vermeldingen, leeftijdsclassificatie, Data safety, privacybeleid.

Goedkeuring betekent dan meteen live.

**Gedaan op 2 oktober, 17:1x.** Alle vier de stappen. De afgewezen release is
weggegooid, versiecode 7 staat als productierelease klaar met de notities uit
`store/wat-is-nieuw-1.3.md`, en de negentien wijzigingen zijn ingestuurd. De
balk *"Some recent changes were rejected"* is weg; er staat nu *Changes in
review*.

Eén waarschuwing bij het aanmaken, en die is onschuldig: *"There is no
deobfuscation file associated with this App Bundle."* In
`android/app/build.gradle` staat `minifyEnabled false`, dus er wórdt niets
verhuld en er valt niets te ontsleutelen. Google zegt alleen dat het aan kán.
Dat is hier ook de verstandige keuze: R8 herschrijft klassenamen, en deze dag
is verloren gegaan aan een klasse die niet gevonden werd.

##### De notities gaan voortaan vanzelf mee — 2 oktober

`store/wat-is-nieuw-1.1.md` en `-1.2.md` stonden er al, netjes per taal. Ze
werden nergens gelezen: zes talen met de hand overtikken in de console is zes
kansen om er een te vergeten, en niemand die het nakijkt. Erger nog, Play kapt
een te lange tekst niet af maar weigert hem — ná de upload.

`npm run track` leest nu `store/wat-is-nieuw-<versienaam>.md`, pakt het bestand
dat bij de bundel hoort, en stuurt de notities mee. Is er een taal langer dan
500 tekens, dan breekt hij af vóór de upload en zegt welke. `nieuws.test.ts`
bewaakt dat alle drie de bestanden dezelfde zes talen hebben en binnen de grens
blijven.

**Wat er nog moet.** `npm run track -- --insturen` draaien, en dan wachten op
het rapport. Dat lezen is het enige punt in deze hele weg waar klikken
onvermijdelijk is; er is geen API voor de inhoud ervan. In Play Console: *Test
and release* → *Testing* → **Pre-launch report**. Eén vraag: opent de app daar.

`npm run crashes -- --versie 7` kan ertussendoor, maar zegt voorlopig niets:
die cijfers komen van toestellen van gebruikers, en die zijn er nog niet. Het
script zegt dat zelf ook als het niets vindt.

##### Versiecode 5 staat op de gesloten test — 2 oktober

Precies wat er bij versie 2 ook al had gemoeten. `npm run track` zet de bundel
op de alpha-baan: geen beoordeling, geen risico voor de winkelvermelding, en
Google begint er vanzelf een rapport vóór lancering van te maken — hij
installeert de app op een rij echte toestellen en klikt erdoorheen.

Dat liep eerst op een 403 bij het vastleggen. Het serviceaccount
`play-publisher@…` mocht klaarzetten maar niet uitbrengen. In Play Console bij
*Gebruikers en rechten* → *App-rechten* → **Releases** staan nu twee rechten
aan: *Release apps to testing tracks* en *Manage testing tracks and edit tester
lists*. *Release to production* blijft met opzet uit — publiceren naar
productie hoort een bewuste handeling in de console te zijn.

##### Wat er wél gerepareerd is, 2 oktober

Twee echte defecten, allebei in het Android-manifest, allebei gevonden bij het
uitpluizen van deze afwijzing. Geen van tweeën verklaart de crash — dat zeg ik
er met opzet bij — maar allebei zijn ze een reden waarop Play afwijst.

**`SCHEDULE_EXACT_ALARM` zat in de app zonder dat wij erom vroegen.**
`@capacitor/local-notifications` zet dat recht in zijn eigen manifest, en bij
het samenvoegen komt het in de onze terecht. Google beperkt het tot wekkers,
timers en agenda-afspraken; wie het aanvraagt zonder zo'n reden moet het in
Play Console verantwoorden of wordt afgewezen. Een app die één keer per dag
een herinnering stuurt komt er niet voor in aanmerking. Dat is precies het
soort punt dat onder de koepelregel *"Not adhering to Google Play Developer
Program policies"* valt.

Het staat er nu met `tools:node="remove"` uit. Dat kan zonder iets te breken:
de plugin vraagt op Android 12 en later eerst `canScheduleExactAlarms()` en
valt bij nee terug op `setAndAllowWhileIdle`. De herinnering komt dan rond de
gekozen tijd in plaats van op de seconde, en dat is wat er bedoeld werd.
Nagelezen in `LocalNotificationManager.kt` 357-378, en vastgelegd in
`manifest.test.ts` — inclusief een test die omvalt zodra de plugin het recht
niet meer aanvraagt, zodat de verwijdering er dan weer uit kan.

**Italiaans ontbrak in `locales_config.xml`.** Vijf talen stonden er, de app
heeft er zes. Daardoor kon een Italiaans gezin de app niet op Italiaans zetten
in de taalinstelling van Android 13+.

**Wat hier niet te verifiëren is.** Deze omgeving heeft geen Android-SDK
(`ANDROID_HOME` is leeg), dus het samengevoegde manifest is hier niet te
bouwen. Na de volgende `npm run aab` staat het resultaat op de Windows-machine
in `android/app/build/intermediates/merged_manifests/release/AndroidManifest.xml`;
daar hoort `SCHEDULE_EXACT_ALARM` niet meer in te staan.

Dit raakt Apple niet: daar is build 7 goedgekeurd, dus de app opende bij die
beoordelaar gewoon. Dat maakt het waarschijnlijk iets aan de Android-kant of
aan één toestel, en niet een JS-fout die overal zou optreden.

#### Build 9 staat bij Apple — 2 oktober 08:34

In Xcode Organizer staat `1.1 (9)` op *Uploaded to Apple*, gearchiveerd uit
`842351d`. Daar zitten allebei de doorlopen van 1 en 2 oktober in. Build 8 is
daarmee definitief van tafel.

Hij is **niet ingediend**, en dat moet ook niet voordat 1.0 (build 7) is
vrijgegeven: een nieuwe inzending nu zet die goedkeuring opnieuw op de rol.

Van `842351d` naar de stand van dat moment scheelt één commit, en daar zit
geen app-code in — alleen het bouwscript dat zijn eigen commit meldt, een test
daarbij en dit document. Build 9 hoeft dus niet opnieuw.

**En bij Play ligt de bundel klaar.** Daar zijn op 2 oktober eerst drie
bundels gebouwd van code van 1 oktober 08:16 — die machine liep 94 commits
achter en dat is bij het bouwen nergens aan te zien. Na `f39adb0..842351d` en
een laatste ronde staat er nu:

```
  app-release.aab
  22.8 MB
  uit 462d03d  02-10 08:46  De commit staat nu ook onderaan, naast de bundel die eruit kwam
  versionCode 5 · versionName 1.3
```

Daarmee is allebei de kant klaar om in te dienen zodra dat mag. Dat laatste
blok drukt `maak-aab.mjs` voortaan zelf af, juist omdat die regel bovenaan
achter Gradle wegscrolt.

#### Build 8 is achterhaald — gebruik build 9 en versiecode 5

Build 8 is op 1 oktober om 18:43 geüpload en staat in Xcode Organizer op
*Uploaded to Apple*. Hij is nooit ingediend, en dat moet ook niet meer: hij is
gebouwd vóór de doorlopen van 1 en 2 oktober en mist alles wat daarin is
gerepareerd.

**Niets van wat na 1 oktober 18:43 in de code is gekomen zit in een bundel bij
een winkel.** Niet in build 7 (die lanceert), niet in build 8, en niet in
versiecode 4. Het zit alleen in de tak en in `main`.

Voor de volgende ronde dus:

```bash
npm run ios -- --build 9 --versie 1.1
```

```powershell
if (-not $p) { $p = (Get-ChildItem $HOME -Recurse -Depth 5 -Filter darija-kids -Directory -ErrorAction SilentlyContinue | Select-Object -First 1).FullName }; if ($p) { npm --prefix $p run aab -- --versie 5 --naam 1.3 } else { "darija-kids niet gevonden onder $HOME" }
```

Build 9 en niet 8, want Apple weigert een buildnummer dat al geüpload is — ook
als die build nooit is ingediend. Versiecode 5 om dezelfde reden bij Play: 4
ligt er al.

**En bij Play `--naam 1.3`, niet 1.1.** De twee winkels tellen apart: bij Apple
is dit 1.1, want 1.0 is daar net goedgekeurd; bij Play is het 1.3, want 1.2
staat er al op Productie. Dezelfde 1.3 staat in de kop van
`store/wat-is-nieuw-1.1.md`. Play weigert een lagere naam niet — alleen de
versiecode moet omhoog — dus dit gaat nergens piepen. Het staat dan gewoon
verkeerd in de winkel, bij iemand die net 1.2 had.

Hier is op 2 oktober een bundel mee gebouwd met `--naam 1.1`. Die is dus goed
op versiecode maar verkeerd op naam, en moet opnieuw. Opnieuw bouwen kost
negenentwintig seconden; het versienummer in de winkel terugdraaien kost een
release.

**Trek eerst binnen, en zet `build.gradle` daarbij terug.** Op 2 oktober zijn er
drie bundels gebouwd van code van de dag ervoor: Windows stond 94 commits
achter en de Mac 65. Een bundel met het goede versienummer en de oude code ziet
er bij het bouwen precies hetzelfde uit — zelfde aantal MB, zelfde "BUILD
SUCCESSFUL" — dus dat merk je nergens aan.

En een `git pull` valt daar om, want `maak-aab.mjs` schrijft `versionCode` en
`versionName` in `android/app/build.gradle`, en dat bestand wordt gevolgd. Git
weigert dan binnen te halen omdat je wijzigingen zouden verdwijnen. Zet dat ene
bestand dus terug voordat je trekt; het bouwscript schrijft het er meteen weer
in uit `--versie` en `--naam`.

```powershell
if (-not $p) { $p = (Get-ChildItem $HOME -Recurse -Depth 5 -Filter darija-kids -Directory -ErrorAction SilentlyContinue | Select-Object -First 1).FullName }; if ($p) { git -C $p checkout -- android/app/build.gradle; git -C $p pull origin main } else { "darija-kids niet gevonden onder $HOME" }
```

Op de Mac speelt dat terugzetten niet: `ios/` staat niet in de repository, dus
`ios-plist.mjs` raakt geen gevolgd bestand.

**En je hoeft het niet meer te onthouden.** `npm run aab` en `npm run ios`
beginnen nu allebei met de commit waaruit ze bouwen, en kijken na bij `origin`:

```
Gebouwd uit: 842351d  02-10 05:58  STAND: trek eerst binnen, en zet build.gradle daarbij terug
Bij met origin/main.
```

Sta je achter, dan staat er in plaats daarvan hoeveel commits, wat dat betekent
en wat je eraan doet. Het breekt het bouwen niet af — soms bouw je met
voordacht een oudere stand — maar dan heb je het zelf gekozen.

Dat nakijken gaat met een echte `git fetch`, en dat is het hele punt: de
lokale `origin/main` is net zo oud als de laatste keer dat er getrokken is.
Op de machine waar dit misging stond die op dezelfde commit als `HEAD`, dus
een vergelijking zonder ophalen had gezegd dat alles bij was.

De "wat is er nieuw"-tekst in `store/wat-is-nieuw-1.1.md` is op 2 oktober
bijgeschreven en dekt nu allebei de rondes: de reparaties van vóór 1 oktober
én wat een gebruiker merkt van de doorloop daarna. Zes talen, alle zes onder de
500 tekens van Play (de langste is 500, Spaans).

#### De zesde doorloop — wat er in de weg zat, niet wat er lelijk uitzag — 2 oktober

De opdracht was deze keer nadrukkelijk niet "maak het mooier" maar "maak het
beter te gebruiken". Alles hieronder is gemeten voordat er iets veranderde, en
opnieuw gemeten daarna.

**Het leerpad was tien schermen lang geworden.** Nagemeten met een profiel van
veertig afgeronde lessen — twee derde van de cursus, de stand waarin de meeste
gebruikers het grootste deel van hun tijd doorbrengen: 10 560px hoog, de
volgende les op y=8285, dus 7 885px scrollen om te zien waar je bent. Elke
sessie opnieuw. Afgeronde units klappen nu dicht (kop, balk, percentage en het
aantal lessen blijven staan; één tik opent weer), units die bezig of nog dicht
zijn blijven open. Na afloop: 5 096px, volgende les op y=2821, 2 421px
scrollen. Daarbovenop noemt de kaart "Ga verder" nu de les waar hij heen gaat,
met de unit erachter — dat beantwoordt "waar ben ik" zonder te scrollen.

**Het woordenboek liep achter je vingers aan.** Met de processor zes keer
vertraagd — ongeveer een goedkope Android: 29 341px pagina, 3 161 knopen, het
eerste woord na 2 572ms, en elke aanslag in het zoekveld 200 tot 564ms, want
bij elke letter mochten 304 kaarten weer weg. Nu bouwt de lijst zich op in
stukken van veertig: 4 490px, 522 knopen, eerste woord na 1 388ms, eerste
aanslag 279ms. Alle 304 woorden blijven bereikbaar door te scrollen. Het
zoekveld plakt bovendien onder de kopbalk, want wie doorscrolde was twintig
schermen van het veld vandaan. Daarvoor meet `TopBar` zichzelf: 77px op een
gewone telefoon, 163px op een kleine met de grootste letterinstelling.

**Herhalen zei "kom later terug".** Een lege wachtrij is precies het moment
waarop iemand die wil oefenen die tab opent. Nu valt hij terug op de twaalf
woorden die het minst vastzitten. En de dubbele knop onderaan is weg: twee
knoppen naar dezelfde plek op één scherm is geen keuze maar twijfel.

**Met het geluid uit kreeg je onbeantwoordbare vragen.** `say()` doet niets als
de schakelaar uitstaat, en dan staat er "wat hoor je?" met een zwijgende knop
en vier antwoorden: alleen gokken, en gokken kost een hartje en zet het woord
verkeerd in de planning. Vier oefensoorten zaten zo in elkaar. Ze wisselen nu
om naar de leesvariant met dezelfde antwoorden; het dictee als los spel valt
weg, zoals de spreekronde dat al deed. Nagemeten over 64 schermen: met geluid
aan vier luisterschermen, met geluid uit nul.

**Een les kon eindeloos doorgaan.** Elke fout hing een kopie van die vraag
achteraan de rij — ook de fout op de kopie. Met hartjes loopt dat dood, maar
`hearts` is juist de schakelaar die een ouder voor een jonger kind uitzet, en
dan is de enige uitgang het kruisje dat de les weggooit. Eén herkansing per
vraag: een ronde van twaalf wordt er hoogstens vierentwintig.

**Het scorescherm bracht je naar het pad in plaats van naar de volgende les.**
Dat is het vaakst gelopen stukje van de app. De bovenste knop begint nu die
les en zegt welke; "verder op pad" staat eronder.

**Drie dingen in de opslag die stilletjes schade doen.** Een kaart voor een
woord-id dat wij hernoemen of weghalen laat `word(id)` werpen, en dat gebeurt
in de lijst op /herhalen — één zo'n kaart haalde de hele bladzijde onderuit.
Hetzelfde geldt voor een zin-id, maar dan pas ná de tik op "Start herhaling".
Allebei vallen ze er nu bij het inlezen uit. En `bestStreak` kan lager staan
dan `streak` als dat ene veld kwijtraakt; dan staat er "41 / 0" op /profiel en
is iemand met eenenveertig dagen ook zijn drie vlambeloningen kwijt.

**Elke bladzijde begint nu met één `h1`.** Nagelopen over vijftien bladzijden:
op elf stond er geen. VoiceOver en TalkBack beginnen allebei bij die kop. En
de achttien onderwerpknoppen in het woordenboek stonden op zesendertig pixels;
die halen nu de vierenveertig van Apple en Google.

**Arabische lestitels werden afgesneden.** Zeven lessen van de alfabet-unit
heten naar hun letters ("ا ب ت ث"). Die stonden in het lettertype van de
koppen, dat geen Arabische vormen heeft, met een regelafstand die niet klopte.

**Eén ding gemeten en niet gedaan.** Alle zes de talen zitten in één brok van
229 kB (86 kB ingepakt), terwijl iemand er één gebruikt. Ze los inladen scheelt
ongeveer 72 kB ingepakt. Nagemeten wat dat in tijd doet: met de processor zes
keer vertraagd start de app met één taal in 1 435ms en met zes in 1 532ms,
mediaan over zes metingen — ongeveer 100ms, en op een gewoon toestel een
zesde daarvan. In de app staan die bestanden bovendien op het toestel zelf,
dus de 72 kB kost daar niets. Daar staat tegenover dat `useT()` overal
synchroon is: los inladen vraagt een wachtscherm vóór de eerste tekening, en
offline moeten alle zes gewoon in de servicewerker blijven zitten. Voor 100ms
op de traagste telefoon is dat de verkeerde ruil. Opgeschreven zodat de
volgende die ernaar kijkt niet opnieuw hoeft te meten.

**Vijf kaarten knepen hun tekst plat naast de knop.** `flex-1` in een rij met
`flex-wrap` is `flex: 1 1 0%`: de tekstkolom vraagt nul breedte, dus alles
"past" naast elkaar en de rij breekt nooit af. Nagemeten op 390px: 91 pixels
voor de bonuskaart, 158 voor de slotkaarten, en 64 voor de afsluiter van
/profiel — veertien woorden over elf regels. Geen van alle liep buiten beeld,
dus het krapte-harnas zag er niets van. Met een basis: 275 tot 287 pixels.

**En een val in `index.css` die daaronder lag.** `.ar` en `.btn3d` staan buiten
elke laag, en Tailwind zet zijn klassen in `@layer utilities` — een regel
zonder laag wint altijd van een regel in een laag. Daardoor deed de `hidden
sm:block` op de Arabische unitnaam niets (die naam at op een Duits scherm van
320px 70 van de 248 pixels op), deden drie `leading-*` niets, en vloeiden de
randkleuren van vijf antwoordknoppen niet over hoewel ze `transition` dragen.
De displayklasse staat nu op een omhulsel, de dode klassen zijn weg, en
`.btn3d` noemt de kleuren. `.ar` is met opzet niet alsnog in een laag gezet:
dan zou `leading-tight` ineens gaan werken, en dat snijdt Arabisch af.

**De kopbalk loog tegen wie terugkwam.** `streak` wordt alleen in `addXp`
bijgewerkt, dus na veertig dagen weg stond er nog steeds 🔥 12 — tot je het
eerste antwoord gaf en hij zonder een woord naar 1 sprong. `reeksNu` toont hem
zoals hij vandaag is: vandaag of gisteren geoefend telt, eergisteren met een
vriesdag ook, en anders staat er 0. Nagemeten met vijf profielen, voor en na.

Stand na deze doorloop: **1612 tests groen in 80 bestanden**, `tsc -b --force
--noEmit` schoon, productiebouw schoon. Alle meetharnassen opnieuw gedraaid na
afloop: contrast schoon in beide standen, negen combinaties van breedte en
lettergrootte binnen beeld, veertien kapotte opslagen overleefd, de
rommelroutes opgevangen, offline alle routes door, de stoeitest zonder
uitzondering, en de tekstsweep over zes talen en drie schermmaten schoon.

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

Waar je het vindt: bij het abonnement → **View all Subscription Pricing** →
tabblad **Introductory Offers**. Hier stond eerder dat die kop niet bestond en
dat het een kolom in de prijzentabel was. Dat was op 1 oktober de enige plek
waar het te zien was; op 2 oktober is het een eigen tabblad, naast *Win-Back
Offers*, *Offer Codes* en *Promotional Offers*. Aanmaken gaat met de blauwe ⊕
daar.

**Op 2 oktober nagekeken bij `app.darijaforkids.monthly`: staat er ook.** Sep
19, 2026 tot *No End Date*, 175 landen, *Free for the first 3 days* — dezelfde
regel als bij Jaar. Beide abonnementen beloven dus wat de app belooft, en
`TRIAL_DAYS` in de code zegt hetzelfde.

**En op 2 oktober gezien op het aankoopvenster zelf**, wat het enige echte
bewijs is. Op een iPhone, in de app uit de App Store, op *Per maand*:

| Op Apple's venster | |
|---|---|
| Gratis proefperiode van 3 dagen — vanaf vandaag | de aanbieding bestaat |
| € 6,99 per maand — vanaf 05-10-2026 | 2 oktober plus drie dagen |
| Gezinsabonnement | Family Sharing staat aan, zoals het koopscherm belooft |
| Nederlands, 4+ | de juiste vertaling en leeftijd |

Daarmee is het niet langer een aanname dat de app en de winkel hetzelfde
zeggen. Het staat er, in Apple's eigen venster, dat Apple uit het product
maakt.

**Nog niet nagekeken:** de gratis proefperiode bij de twee abonnementen in Play
Console. Drie van de vier zijn aangetoond.

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

### Besloten op 2 oktober: stil live, daarna pas aankondigen

De aankondiging wacht niet op de goedkeuring van 1.0 maar op de versie die je
ook echt wilt laten zien. Concreet: 1.0 gaat zonder een woord de App Store in,
1.1 gaat er meteen achteraan, en pas als allebei de winkels op de nieuwe versie
staan gaat de communicatie los.

Drie redenen, in volgorde van gewicht.

**Het e-boek lekt in build 7.** Daar komt het boek bij het jaarabonnement
meteen vrij, ook tijdens de proef van drie dagen: afsluiten, boek opslaan,
opzeggen. Stil live gaan betekent dat vrijwel niemand in dat raam zit. Met een
aankondiging zet je juist een deur open op het moment dat hij nog openstaat.

**Een afwijzing op 1.1 kost dan niets.** En 1.1 is geen stempeltje: build 7
heeft met opzet géén keuzescherm na de taalkeuze, géén kaartje na de laatste
gratis les en géén knop in de kopbalk. Die drie voegt 1.1 toe, en dat is
precies richtlijn 3.1.2 — degene waarop 1.0 al een keer omviel. Met 1.0 live
blijft de app staan terwijl die discussie loopt; nu zou een afwijzing betekenen
dat er niets in de winkel staat.

**Een echte aankoop test je pas in productie.** Sandbox is niet productie. Het
abonnement, het herstellen, de proefperiode en het moment waarop het e-boek
vrijkomt: één keer goed doorlopen met een eigen Apple ID voordat er iemand
meekijkt.

Wat ertegen pleit, voor de eerlijkheid: Apple geeft een nieuwe app een kort
zetje in de vindbaarheid, en dat besteed je dan in een week zonder verkeer.
Klein en moeilijk hard te maken voor een nichetitel. En stil is niet
onzichtbaar — hij is vindbaar in zoeken, dus er komen een paar installaties op
build 7.

De volgorde:

1. **Winkelpagina nalopen.** Hij wordt openbaar op het moment dat je vrijgeeft.
2. **1.0 vrijgeven.** Geen aankondiging, geen socials, geen mail.
3. **De abonnementen afmaken, vóór je 1.1 indient.** Zolang er een versie in
   beoordeling ligt zijn de aankopen alleen-lezen; nu 1.0 is goedgekeurd staat
   dat slot open, en indienen van 1.1 zet het er weer op. Dit is dus het enige
   raam voor de vier talen uit `store/abonnement-teksten.md` en voor de
   proefperiode bij **Maand**. Allebei staan ze al maanden op de lijst, en
   allebei kosten ze een kwartier.
4. **Downloaden uit de App Store** op een eigen iPhone, en één echte aankoop
   doen: abonnement, opzeggen, herstellen, en kijken wanneer het e-boek
   vrijkomt.
5. **1.1 (build 9) indienen** — op *Automatically release*, niet handmatig.
   De regel "altijd handmatig" bestond om te voorkomen dat een winkel je
   lanceerdag bepaalt; die dag hangt nu niet meer aan het vrijgeven, en hoe
   eerder 1.1 live staat hoe korter het e-boeklek openstaat.
6. **Play met rust laten** tot inzending 4 erdoor is. Versiecode 5 nu uploaden
   zet die beoordeling opnieuw, en dat is de enige manier waarop dit plan
   misgaat.
7. Zodra 4 erdoor is: **versiecode 5 (1.3) uploaden.**
8. Pas als allebei de winkels op de nieuwe versie staan: **Play-pagina openbaar
   maken, de website omzetten, en dan communiceren.**

Google is sowieso de trage van de twee, dus dit kost geen dag extra — het
gebruikt de wachttijd die er toch al was.

De hele dag staat uitgeschreven in **`docs/GO-LIVE.md`**: de volgorde, de
commando's, en alle berichten klaar om te plakken. Die berichten horen bij
stap 7, niet bij stap 2. Wat je daarvóór nog moet doen, staat hier.

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
   paar uur), Play erachteraan. Play is binnen het uur zichtbaar. Let op dat
   dit sinds 2 oktober stap 2 én stap 7 is geworden: Apple gaat stil live met
   1.0, en Play pas als 1.3 erdoor is — zie het besluit hierboven.
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
