<!--
  Gemaakt op 13 oktober 2026 door vier onderzoekers elk een deel van de twee
  consoles te laten uitzoeken -- de productpagina bij Apple, in-app events en
  uitlichting bij Apple, de winkelvermelding bij Play, en Grow users bij Play
  -- en elk onderzoek daarna te laten toetsen op twee vragen: klopt het nog, en
  doet het iets bij vierentwintig paginabezoeken per week.

  Die tweede vraag is de reden dat dit stuk bestaat. Bijna al dit gereedschap
  vergroot wat er al is, en bij bijna nul verkeer vergroot het bijna niets. De
  rekensom onder "Niet doen" laat zien wat dat voor een A/B-test betekent: bij
  dit verkeer drieënhalf jaar voor het grofste verschil dat Play kan meten.

  Onderaan staat wat niet na te trekken was en hoe je het zelf doet. Dat is
  geen slordigheid: de Google-hulppagina's zijn vanuit deze omgeving
  onbereikbaar, en wat uit een zoekresultaat komt in plaats van uit de bron
  hoort als zodanig gemarkeerd te staan.
-->

# Promotie met wat de twee consoles zelf al geven

*Nagetrokken op 13 oktober 2026, bij Apple rechtstreeks op developer.apple.com, bij Google deels niet — zie "Wat ik niet heb kunnen natrekken" onderaan.*

De eerlijke kop boven dit stuk: **bijna al dit gereedschap vergroot wat er al is.** Een betere pagina, een scherpere tekst, een A/B-test — ze werken allemaal op bezoek dat jij moet aanleveren. Bij 24 paginabezoeken per week vergroten ze 24 paginabezoeken per week. Er zijn drie uitzonderingen en die staan hieronder apart, met de reden waarom ze anders zijn.

---

## Eerst: de cijfers rechtzetten, want alles hangt eraan

De opdracht zegt "sinds 13 oktober in allebei de winkels". Dat klopt niet, en het maakt uit:

| | |
|---|---|
| App Store | 1.4 live sinds **4 oktober** (1.0 stond er al sinds 2 oktober) |
| Google Play | versiecode 8 live sinds **13 oktober** — vandaag |

Die 38 productpaginabezoeken over 1 t/m 11 oktober zijn dus **Apple-cijfers**. Play heeft nul dagen data. En de "elf dagen" die in de brief rondzingt is in `docs/STAND.md` iets anders: dat is hoe lang de Google-beoordeling duurde, geen verkeersvenster.

Blijft over: **38 bezoeken in 11 dagen = 3,5 per dag = ongeveer 24 per week, bij Apple alleen.** Dat is de maat waartegen je elk voorstel hieronder moet houden. Elke keer dat iemand zegt "dit verhoogt je conversie", vraag: van hoeveel mensen?

Nog iets dat rechtgezet moet worden, want het verandert wat deze week nodig is: `docs/PROMOTIE-NL.md` meldt dat de vier ontbrekende knoppen uit `docs/STAND.md` **inmiddels in de code zitten** — het codeveld (`4f90c5f`), het beoordelingsverzoek na drie diploma's (`568a99f`), de deelkaart en "laat het aan oma zien" (`88ae991`). Je hoeft die dus niet meer te bouwen. Ze zitten in 1.5 en komen vrij op de dag dat 1.5 doorkomt.

---

## Deze week: drie dingen

### 1. Campagnelinks en UTM-links, vóór het kanaalbericht de deur uit gaat

**Waar het zit.** Apple: App Store Connect → je app → tabblad **Analytics** → in de zijbalk onder **Acquisition** → **Campaigns** → de **+** ernaast. Google: nergens in de console — je plakt de staart zelf achter je Play-link, en het resultaat verschijnt later in **Store performance → Store analysis** bij het UTM-kanaal.

**Wat je invult.** Bij Apple één veld: een campagnenaam. Die naam *is* je campagnecode. Tot 30 letters, cijfers en spaties, geen spatie vooraan of achteraan. De console bouwt er een link van in deze vorm:

```
https://apps.apple.com/app/apple-store/id6813964474?pt=<jouw providertoken>&ct=familie-whatsapp&mt=8
```

`pt` is je accountcode en blijft altijd hetzelfde; alleen `ct` verandert per kanaal. Bij Google maak je dezelfde vier of vijf links met de hand, URL-gecodeerd, maximaal 512 tekens:

```
https://play.google.com/store/apps/details?id=app.darijaforkids.learn&referrer=utm_source%3Dwhatsapp%26utm_medium%3Dfamilie%26utm_campaign%3Dstart-okt
```

Maak er vier of vijf, niet dertig: familie-WhatsApp, Instagram-bio, Instagram-post, het kanaal, en één voor de zaterdagschoolroute. Schrijf ze op in een bestand naast je kanaalteksten, met erbij waar je ze hebt gebruikt. Zonder dat lijstje weet je in maart niet meer wat `camp3` was.

**Tijd.** 30 minuten voor allebei de winkels samen, inclusief opschrijven. Geen beoordeling, geen wachttijd, geen afhankelijkheid van 1.5.

**Waarom dit het eerste is.** `docs/STAND.md` zegt dat het kanaalbericht nog openstaat — `store/lancering/kanaal.md` ligt klaar en is nog niet verstuurd. Dat is precies het moment waarop dit moet gebeuren, want **attributie is het enige op deze hele lijst dat je met terugwerkende kracht nooit meer kunt repareren.** Elke deling zonder staart is een vraag die je over vier maanden niet meer kunt beantwoorden: kwamen de mensen die bleven uit de familiegroep of van Instagram? Die vraag beslist waar je in juni je tijd stopt. Het is 30 minuten nu, of de rest van het jaar gokken.

**Waar het misgaat.** De cijfers komen laat en de drempels zijn hard. Apple: de **+**-knop verschijnt pas als je app analytics-data heeft; een campagne verschijnt pas 24 uur na de start; elke meetwaarde verschijnt pas bij minstens 5 binnen de gekozen periode; en data voor een campagne verschijnt pas na eerste-downloads van **minstens vijf verschillende personen**. Het toeschrijvingsvenster is 24 uur — wie je link dinsdag ziet en zaterdag downloadt, telt niet mee. Bij WhatsApp wordt de staart soms afgeknipt bij doorsturen, dus je meet een ondergrens, geen exact getal. Reken erop dat je wéken niets ziet. Dat is geen reden om te wachten; het is de reden om het nú aan te zetten en de cijfers later te lezen.

### 2. De Play-winkeltekst, nu — want dit raam sluit zodra 1.5 wordt ingestuurd

**Waar het zit.** Play Console → je app → **Grow users → Store presence → Store listings → Main store listing**, en daarnaast **Store settings** voor de categorie en de vijf tags.

**Wat je invult.** Drie velden, en de redenering per veld:

- **Titel (30 tekens).** Er staat nu `Darijaforkids`. Dat is 13 van 30 tekens. `store/keywords.md` heeft al `Darijaforkids: Marokkaans` liggen. Dat zijn 17 ongebruikte tekens in het zwaarst wegende veld dat je hebt.
- **Korte beschrijving (80 tekens).** Hier gaan de **zoekwoorden** in, niet de emotie. "Je kind verstaat oma wel. Maar het antwoordt in het Nederlands" is een sterke zin, maar er staat geen woord in waarop iemand zoekt — geen *Darija*, geen *Marokkaans*, geen *leren*. Die zin hoort op de eerste schermafdruk, en die gaat toch mee met 1.5. Zet de emotie op het beeld en de zoekwoorden in de tekst.
- **Volledige beschrijving.** En dit is de asymmetrie die het hele verhaal kantelt: **bij Google is je volledige beschrijving de zoekindex, en die pas je aan zonder nieuwe release.** Bij Apple kost datzelfde een versie. Dus alles wat `store/keywords.md` onder "Geschiedenis als tweede ingang" voorstelt — Ibn Battuta, Fatima al-Qarawiyyin, Tariq ibn Ziyad, Amazigh, Tifinagh — kan hier deze week in, zonder bouw, zonder Mac, zonder build.

Eerst nakijken wat er nu echt staat. `docs/PROMOTIE-NL.md` wijst erop dat `store/keywords.md` en `store/listing.nl.md` het oneens zijn over titel en korte beschrijving, en dat van buiten de console niet te zien is welke van de twee erin staat. Dat is dus stap nul: kijken.

**Tijd.** Ongeveer twee uur voor het Nederlands: kijken wat er staat, drie velden herschrijven, tags nalopen. De andere vijf talen laat je deze week staan.

**Waar het misgaat, en dit is belangrijk.** Een wijziging aan de winkelvermelding gaat zelf door een beoordeling. En de supportmail van Google van 12 oktober zegt zwart op wit dat de beoordelingstermijn opnieuw begint vanaf élke wijziging. Dus de volgorde is: **nu wijzigen, nu er niets in beoordeling staat, en vervolgens niets meer aanraken tot 1.5 erdoor is.** Moet je er tijdens een lopende beoordeling toch iets aan doen, dan is er sinds januari 2026 **"Save for later"** op de Publishing overview: daarmee houd je een wijziging vast in "Changes not yet sent for review" zonder hem mee te sturen. Zonder dat is "pas gewoon je tekst aan" aan de Play-kant een valkuil die je de hele ronde kost.

En verander één veld per keer met de datum erbij opgeschreven. Niet omdat je het verschil kunt meten — dat kun je bij 24 bezoeken per week niet — maar omdat je anders over drie maanden niet meer weet wat je gedaan hebt.

### 3. De promotietekst bij Apple, het enige Apple-veld dat vandaag kan

**Waar het zit.** App Store Connect → je app → de versie in de zijbalk → het veld **Promotional Text**, direct boven de beschrijving, per taal.

**Wat je invult.** Maximaal 170 tekens. Apple schrijft het zelf, letterlijk: *"You can update promotional text at any time without having to submit a new version of your app."* Dat is het enige veld op de hele productpagina waarvoor dat geldt — ondertitel, zoekwoorden, beschrijving en schermafdrukken eisen allemaal een versie.

Er staat nu in `store/listing.nl.md`: *"Nieuw: na elke toets een kort filmpje uit de geschiedenis van Marokko, voorgelezen in jouw eigen taal."* Dat is een zin over een functie. Zet er een zin in over een datum die de ouder zelf voelt — en die datum is niet juli. **De kerstvakantie loopt 19 december tot 3 januari**, dat is het eerstvolgende moment waarop een gezin twee weken tijd heeft. Daarna 8 februari, het verwachte begin van de ramadan. Juli is negen maanden weg.

**Tijd.** 15 minuten Nederlands, een uur voor alle zes talen. Doe deze week alleen Nederlands.

**Waar het misgaat.** Wees eerlijk over het bereik: die regel staat bovenaan de beschrijving, en de beschrijving is op de telefoon ingeklapt. Van 24 bezoekers per week lezen er misschien een paar hem ooit. Hij staat op deze lijst om twee redenen, niet meer: het is het enige Apple-veld dat niet op 1.5 hoeft te wachten, en het is een knop die je elke maand kunt verzetten terwijl je aan de rest werkt. Hoe lang een wijziging erover doet om live te staan zegt Apple niet; test het één keer met een kleine wijziging en kijk wanneer je hem op je telefoon ziet.

---

## Daarna, met het getal erbij

**Eigen winkelpagina's per publiek — zodra één kanaal 50 kliks per maand levert.**
Apple heet dit *Custom Product Pages* (tot 70 per app, eigen schermafdrukken, promotietekst, app previews en een eigen URL), Google heet het *custom store listings* (tot 50). Hier zit een verschil dat je moet kennen voordat je uren investeert: **een Apple-pagina is alleen zichtbaar voor wie jouw link volgt.** Hij benut geen organisch verkeer — hij benut een kanaal dat je nog niet hebt. Play's custom store listings kunnen daarentegen richten op land en op installatiestatus *zonder* dat je een link hoeft te verspreiden, en dat is de ene plek waar Google hier nuttiger is dan Apple. Het getal: begin hieraan als één kanaal — een zaterdagschool, een familiegroep, een nieuwsbrief — aantoonbaar 50 kliks per maand oplevert. Eerder maak je een pagina voor een bericht dat nog niet bestaat, en tegen de tijd dat je het verstuurt is de tekst alweer anders. Apple laat bovendien geen cijfers per pagina zien tot die pagina **vijf eerste-downloads** heeft gehad, dus maak zo'n pagina voor de boodschap en meet met de campagnelink.

**Redactionele uitlichting — Apple zodra 1.5 een datum heeft, Google uiterlijk half januari.**
Dit is de eerste van de drie uitzonderingen op "alles vergroot alleen wat er al is", want dit maakt bereik uit niets. Twee routes, met heel verschillende drempels:

- **Apple, Featuring Nominations** (App Store Connect → je app → zijbalk **Featuring → Nominations** → **+** → *Create Nomination*; rol Account Holder, Admin, App Manager of Marketing). Apple noemt **géén minimale sterrenwaardering** — nul recensies is hier dus geen blokkade. Aanlooptijd: *"a minimum lead time of 3 weeks."* Je mag tot 10 apps uit hetzelfde account en 5 ondersteunende URL's meesturen. Je hebt wel iets nieuws nodig om aan te melden, en dat is 1.5. Zodra de releasedatum van 1.5 staat: schrijf de nominatie, type *App Enhancements* of *New Content*, 2 tot 4 uur. Apple belooft nergens dat je antwoord krijgt — reken op stilte en bouw je plan er niet op.
- **Google, het featuringformulier** (buiten de console: `support.google.com/googleplay/contact/featuring_review`). Hier staan harde eisen: **minimaal 3,0 sterren**, minimaal drie weken vooraf en **vier weken voor pas gelanceerde apps**, en de lancering moet binnen **vier maanden** van de gewenste uitlichtdatum vallen. Reken dat door: Play is live sinds 13 oktober 2026, dus de uitlichtdatum moet vóór ongeveer 13 februari 2027 liggen, en het formulier moet dan **uiterlijk half januari** binnen zijn. Mét 3,0 sterren. Je beoordelingsverzoek is gebouwd en komt vrij met 1.5 — dat is de reden om 1.5 niet tot de lente te laten liggen.

**In-App Events bij Apple — zodra er een echte gedateerde reeks in de app zit.**
Dit is de tweede uitzondering, want een event is niet alleen een conversiemiddel: het kaartje verschijnt op je productpagina, naast je app in de zoekresultaten, kan door de redactie in de Today-, Games- of Apps-tab worden opgepikt, en Apple zegt expliciet dat mensen **direct op events kunnen zoeken** — dan verschijnt het kaartje samen met je app. De regels: tot 10 gepubliceerd en 15 goedgekeurd tegelijk, maximaal 31 dagen, tot 14 dagen vooraf te publiceren, naam 30 tekens, korte beschrijving 50, lange 120, kaartbeeld 16:9 vanaf 1920×1080 en een 9:16 voor de detailpagina. Prijzen in de metadata noemen leidt tot afwijzing. De drempel: het moet een écht event in de app zijn met een begin en een eind, dus er zit ontwikkelwerk vóór de 4 tot 8 uur consolewerk. Het logische moment: een reeks rond de ramadan (verwacht vanaf 8 februari 2027), die je dan ook als *New Content* aan een Apple-nominatie kunt hangen.

**De cijfers zelf — één keer kijken, nu, en daarna maandelijks.**
Apple: Analytics → Acquisition → **Sources**. Play: Grow users → Store performance → **Store analysis**. Je zoekt één antwoord: kwamen die 38 uit zoeken, of uit links die je zelf hebt gedeeld? Dat verandert je hele plan — zoekverkeer betekent dat je pagina niet overtuigt, eigen links betekenen dat zoeken niets levert. 15 tot 30 minuten, gratis. Maar verwacht grotendeels lege regels en "Unavailable": Apple laat alleen gegevens zien van wie gegevensdeling heeft aangezet, en Google verbergt rijen onder een niet-gepubliceerde minimumdrempel of klapt ze in "Other". En laat dit halfuur het echte werk niet ophouden: `docs/MARKT.md` geeft het antwoord al in proza — *"deze app wordt niet gevonden, hij wordt doorgegeven."* Daarna maandelijks. Wie er wekelijks naar kijkt gaat ruis uitleggen.

**A/B-testen — zodra je ongeveer 1.000 paginabezoeken per week haalt.**
Zie de rekensom hieronder. Tot die grens is dit geen "later" maar "niet".

---

## Niet doen

**Een A/B-test, en hier is de rekensom.**
Twee armen, 90% betrouwbaarheid (het laagste dat Play toestaat), 80% kans om een echt verschil te zien, uitgangsconversie 20% paginabezoek → download:

n per arm = (1,645 + 0,842)² × 2 × 0,20 × 0,80 / d²

| Kleinste verschil dat je wil zien | Per arm | Totaal | Bij 24 bezoeken per week |
|---|---|---|---|
| 3 procentpunt (grofste stand in Play) | ~2.200 | ~4.400 | **183 weken — 3,5 jaar** |
| 1 procentpunt | ~19.800 | ~39.600 | ruim 30 jaar |
| 0,5 procentpunt (scherpste stand) | ~79.000 | ~158.000 | ruim een eeuw |

Apple's *Product Page Optimization* stopt een test na **90 dagen**. In 90 dagen haal je bij dit verkeer ongeveer 310 bezoeken: zeven procent van wat de grófste test vraagt. Dat is dus geen langzame test, dat is geen test. Omgekeerd gerekend: een test die in een maand klaar is vraagt ~145 bezoeken per dag, 42 keer wat je nu hebt. Daarom is de bruikbare grens ongeveer **1.000 paginabezoeken per week** — dan is de grofste test in vier à vijf weken rond.

Twee eerlijkheden bij deze som. De 20% is mijn aanname; jouw echte conversie ken je bij nul downloads niet. En het goedkoopste harde bewijs komt uit Apples eigen console: maak een test aan tot de stap **"Estimate Your Test Duration"**, lees af hoeveel impressies Apple zegt nodig te hebben met jóuw cijfers, en loop weer weg zonder te starten. Dat getal is het antwoord uit Apples mond met jouw data. Let bij Apple ook op: wil je een ander app-icoon testen, dan moeten álle iconvarianten al in de binary van je gepubliceerde app zitten — dat is een release, geen consolewerk.

**Promotiecodes uitdelen als cadeau, zonder te zeggen dat het doorloopt.**
Je weet dit al — `docs/CODES.md` heeft het citaat erin staan — maar het is het enige op deze lijst dat actief schade doet, dus het staat hier nog een keer. Google: *"After the user redeems the code, they still need to purchase the subscription with the code applied. A valid form of payment is required for the subscription, and the subscription will auto-renew at the end of the promo code free trial period."* Twintig "cadeaucodes" van drie maanden in een moskeegemeenschap zijn twintig mensen die hun bankkaart invoeren en in januari € 6,99 afgeschreven krijgen. Bij vijf recensies kost één boze ouder je bijna een heel sterrenpunt — en duwt je onder de 3,0 die het Play-featuringformulier eist. Op het briefje hoort dus letterlijk: *drie maanden gratis, daarna € 6,99 per maand, opzeggen kan altijd.*

**Je abonnement op de productpagina promoten (Apple's *Promote In-App Purchases*).**
Het werkt, het is gratis, en het is nu verkeerd: je zet € 59,99 vooraan op een pagina met nul sterren. Dat verlaagt je conversie eerder dan dat het hem verhoogt. Plus 3 tot 6 uur StoreKit-werk. Na de eerste recensies, niet ervoor.

**Promotiemateriaal maken voor een uitlichting die nog niet is aangevraagd.**
Apple vraagt pas promotiemateriaal op als een nominatie belangstelling wekt. Er is nog geen nominatie. Eén à twee dagen ontwerpwerk vooruitbetalen op een mail die nog niet gestuurd kan worden. Zet het klaar in de week dat de nominatie de deur uit gaat.

**Zoekwoorden hangen aan een eigen Apple-productpagina.**
Apple is er duidelijk over: zo'n pagina *"appear in search results for those selected keywords, rather than your default product page"* — hij vervángt je standaardpagina voor die woorden. Er komt geen bezoeker bij, je verschuift ze. En je mag alleen kiezen uit de 100 tekens die al in je goedgekeurde zoekwoordveld staan. Bij dit zoekvolume verschuif je nul tot één bezoek per week.

**Vijf dingen die simpelweg dicht zitten**, zodat je er geen avond aan verliest: Play's **Promotional content** (ex-LiveOps) is voor nieuwe app-titels niet beschikbaar; **Apps Innovation Corner** eist 4,0 sterren én een vestiging in de Verenigde Staten; **Play Shorts** rolt uit "to users in the US and select developers"; **Engage SDK** eist 100.000 dagelijks actieve gebruikers over 28 dagen of deelname aan een partnerprogramma; **Play Pass** gaat op uitnodiging en wil een eenmalig product, geen abonnement. Open ze één keer om te zien dat er "niet in aanmerking" staat, en vergeet ze dit jaar.

**Apple's *Promo Codes* (gratis exemplaren van de app).**
Downloaden is al gratis — wat geld kost is het abonnement, en daar gaan deze codes niet over. Bovendien: wie een promotiecode inwisselt kán de app niet beoordelen. Voor het abonnement zijn *Offer Codes* het juiste gereedschap.

**Alles meteen in zes talen doen.** Nederlands eerst. De andere vijf talen kosten per stuk net zoveel nalezen als het origineel, en je weet nog niet of de Nederlandse formulering de goede is.

---

## Alles in één tabel

| Gereedschap | Winkel | Gratis | Wanneer zinvol |
|---|---|---|---|
| Campagnelinks (Analytics → Acquisition → Campaigns) | Apple | ja | **deze week**, vóór het kanaalbericht |
| UTM-links (`&referrer=utm_source%3D…`) | Play | ja | **deze week**, zelfde zitting |
| Titel, korte beschrijving, volledige beschrijving, tags | Play | ja | **deze week**, vóór 1.5 wordt ingestuurd |
| Promotietekst (170 tekens, geen versie nodig) | Apple | ja | **deze week**, daarna maandelijks verzetten |
| E-mailmelding bij nieuwe recensies aanzetten | beide | ja | deze week, 2 minuten |
| Ondertitel, zoekwoorden, schermafdrukken | Apple | ja | met 1.5 mee — kan niet los |
| "Save for later" op Publishing overview | Play | ja | zodra je iets wil wijzigen terwijl er een beoordeling loopt |
| Sources / Store analysis bekijken | beide | ja | één keer nu (15–30 min), daarna maandelijks |
| Featuring Nominations (geen sterreneis) | Apple | ja | zodra 1.5 een datum heeft; 3 weken vooraf |
| Featuringformulier (3,0 sterren, 4 mnd-venster) | Play | ja | uiterlijk half januari 2027, mét sterren |
| In-App Events | Apple | ja | zodra er een echt gedateerd event in de app zit (ramadan, ~8 feb) |
| Custom Product Pages (alleen via jouw link) | Apple | ja | zodra één kanaal 50 kliks/maand levert |
| Custom store listings (ook op land/installatiestatus) | Play | ja | idem, maar werkt ook zonder link |
| Offer Codes / promo codes | beide | ja | zodra de schoolroute loopt — mét de opzegregel op het briefje |
| Langere proefperiode (introductieaanbieding) | beide | ja | 20 min, geen release nodig; drie dagen is één weekend |
| Product Page Optimization / Store listing experiments | beide | ja | **vanaf ~1.000 paginabezoeken per week** |
| Promote In-App Purchases | Apple | ja | na de eerste recensies |
| Promotiemateriaal voor uitlichting | Apple | ja | in de week dat de nominatie verstuurd is |
| Promotional content (LiveOps) | Play | ja | niet beschikbaar voor nieuwe app-titels |
| Play Shorts, Engage SDK, Apps Innovation Corner, Play Pass | Play | ja | dicht: VS, uitnodiging, of 100.000 dagelijkse gebruikers |
| Apple Promo Codes (gratis app-exemplaren) | Apple | ja | niet van toepassing: downloaden is al gratis |

---

## Wat dit oplevert, eerlijk

Van de ruim twintig dingen in die tabel vergroot het overgrote deel alleen het rendement van bezoek dat jij zelf moet aanleveren. Bij 24 paginabezoeken per week is het plafond van elk van die dingen 24 mensen per week. Een pagina die twee keer zo goed converteert levert dan twee downloads in plaats van één. Dat is niet nul, en het is ook niet waar je probleem zit.

**Drie dingen zijn daar een uitzondering op, en elk om een andere reden.**

De eerste is **redactionele uitlichting** — bij Apple de Featuring Nominations, bij Google het featuringformulier. Dat is het enige gratis gereedschap in beide consoles dat bereik uit niets maakt: één plek in een rubriek levert meer bezoek dan jij in een jaar met de hand haalt. En hier staat Apple's deur verder open dan Google's: Apple noemt geen minimale sterrenwaardering, Google eist 3,0. Met nul recensies is Google dus dicht en Apple niet. Daar hoort wel bij dat Apple nergens belooft dat je antwoord krijgt.

De tweede is **Apple's In-App Events**, omdat een eventkaartje in de zoekresultaten verschijnt en mensen er direct op kunnen zoeken. Dat is vindbaarheid, geen conversie. Het is duur in voorbereiding, want er moet een echt event in de app zitten — maar het is wel een route naar mensen die je nu niet kent.

De derde is **de Play-beschrijving**, en die is makkelijk te missen. Bij Google ís je volledige beschrijving de zoekindex, en je verandert hem zonder release. Bij Apple kost datzelfde een versie. Dat betekent dat je deze week aan de Play-kant nieuwe zoekwoorden kunt toevoegen — Ibn Battuta, Amazigh, Tifinagh, het hele tweede publiek uit `store/keywords.md` — en dat is het enige in dit hele stuk waarmee je vandaag verkeer kunt máken in plaats van bestaand verkeer beter benutten.

**En de campagnelinks staan bovenaan ondanks dat ze niets maken.** Niet omdat ze bereik opleveren — ze leveren niets op — maar omdat hun waarde elke dag dat je wacht onherstelbaar wegloopt. Alles anders op deze lijst kun je in maart ook nog doen. Dit niet.

---

## Wat ik niet heb kunnen natrekken, en hoe je het zelf doet

1. **Alle Google-hulppagina's.** `support.google.com` en `play.google.com` zijn vanuit deze omgeving onbereikbaar (DNS-fout). Alles over custom store listings (de 50, de richtmanieren, de regel dat een land maar aan één vermelding mag hangen), de store listing experiments (de 0,5–3% instelling, de 90–99% betrouwbaarheid, het aantal varianten) en het featuringformulier (3,0 sterren, 3 of 4 weken, 4 maanden) komt uit zoekresultaten die Googles eigen hulptekst citeren, **niet uit de pagina's zelf**. Wat ik wél rechtstreeks heb gelezen: `developer.android.com` (promotiecodes, in-app-beoordelingen) en `android-developers.googleblog.com` ("Save for later"). Natrekken: open die vier pagina's ingelogd in je eigen console, en gebruik de zoekbalk bovenin de console in plaats van te klikken.
2. **Elk Nederlands menulabel.** De paden hierboven staan in het Engels, zoals de hulppagina's ze schrijven. Jouw console staat vermoedelijk in het Nederlands. Zet hem even op Engels (`hl=en` achter de URL) als je de paden wil volgen.
3. **Welke titel en korte beschrijving nu echt in de Play Console staan.** `store/keywords.md` en `store/listing.nl.md` zijn het oneens, en van buiten de console is het niet te zien. Dat is letterlijk stap nul van punt 2 hierboven.
4. **Hoe lang een gewijzigde promotietekst erover doet om live te staan.** Apple noemt geen termijn. Test het één keer met een kleine wijziging.
5. **Hoe lang Google doet over een beoordeling van alleen een winkelvermelding.** Niet gevonden, en voor kinderapps circuleren getallen van 1 tot 3 dagen tot weken. Meet het zelf: noteer wanneer je het wijzigt en wanneer het live staat. Dat getal gebruik je de rest van het jaar.
6. **De ramadandatum.** 8 februari 2027 is een astronomische verwachting, geen vastgestelde datum — die hangt van de maansobservatie af. Voor planning met drie weken aanlooptijd is dat genoeg; zet er geen harde belofte op.
7. **Apple's 2,5 procentpunt extra conversie bij eigen productpagina's.** Dat cijfer is echt van Apple, maar het beschrijft **doorverwezen verkeer**, in de praktijk grotendeels Apple Ads, vergeleken met een gemiddelde van 1,6% op standaardpagina's. Als maatstaf voor een familie-WhatsApp is het waardeloos.
8. **Mijn rekensom over de A/B-test is mijn rekensom.** Apple en Google publiceren geen minimum aantal impressies. Wat ik van hen heb is: Apple noemt een uitkomst pas betrouwbaar bij 90% confidence en stopt na 90 dagen, Google laat je 90–99% kiezen. De rest is de standaardformule met een aangenomen conversie van 20%. De console rekent het met jouw echte cijfers voor je — doe dat.

---

## Bronnen

**Apple, rechtstreeks gelezen**

- [App Store product page](https://developer.apple.com/app-store/product-page/) — promotietekst 170 tekens en "update at any time without having to submit a new version"; ondertitel 30; zoekwoorden 100; 10 schermafdrukken; 3 previews van 30 seconden; "the first one to three images will appear in search results"
- [Custom product pages](https://developer.apple.com/app-store/custom-product-pages/) — 70 pagina's per app, eigen URL, zoekwoorden die je standaardpagina vervangen, deep links vanaf iOS 18, de 2,5-procentpunt en de 1,6% waar die tegen afgezet is
- [Product page optimization](https://developer.apple.com/app-store/product-page-optimization/) — 3 treatments, 90 dagen, één test tegelijk, 90% confidence, alle iconvarianten in de binary, "Estimate Your Test Duration"
- [In-app events](https://developer.apple.com/app-store/in-app-events/) — 10 gepubliceerd / 15 goedgekeurd, 31 dagen, 14 dagen vooraf, 30/50/120 tekens, beeldformaten, direct zoeken op events, prijzen in metadata = afwijzing
- [Nominate your app for featuring](https://developer.apple.com/help/app-store-connect/manage-featuring-nominations/nominate-your-app-for-featuring) — pad Featuring → Nominations, drie types, 3 weken aanlooptijd, 10 apps, 5 URL's, geen sterreneis, rollen, geen belofte over antwoord
- [Campaign links](https://developer.apple.com/help/app-store-connect-analytics/acquisition/campaign-links) — pad, linkvorm, 30 tekens, de +-knop pas na analytics-data, 24 uur, drempel 5 per meetwaarde, 5 individuele personen, toeschrijvingsvenster 24 uur
- [Analytics → Product Pages](https://developer.apple.com/help/app-store-connect-analytics/acquisition/custom-product-pages) — het label in de zijbalk is **Product Pages**, en "at least five first-time downloads"

**Google, rechtstreeks gelezen**

- [Promo codes](https://developer.android.com/google/play/billing/promo) — proefperiode, betaalmethode verplicht, automatische verlenging, 10.000 eenmalige codes per kwartaal per abonnement, custom codes alleen in de app, inwissellimiet 2.000–99.999
- [In-app reviews](https://developer.android.com/guide/playcore/in-app-review) — quota "less than a month", geen knop, geen voorvraag, kaart niet aanpassen
- [Save for later op de Publishing overview](https://android-developers.googleblog.com/2026/01/ready-to-review-some-changes-but-not.html) — januari 2026
- [What's new in Google Play, I/O 2026](https://developer.android.com/blog/posts/i-o-2026-what-s-new-in-google-play) — CSV/Gemini-vertalingen, zoekwoordsuggesties die een custom store listing maken, Play Shorts "US and select developers", reach-metric en verkeersbronuitsplitsing
- [Play Games user acquisition](https://developer.android.com/games/playgames/user-acquisition) — de referrer-parameter, URL-gecodeerd, 512 tekens

**Google, niet rechtstreeks te openen — geciteerd via zoekresultaten, zelf na te kijken**

- [Featuring nomination form](https://support.google.com/googleplay/contact/featuring_review?hl=en) — 3,0 sterren, 3 weken / 4 voor pas gelanceerde apps, lancering binnen 4 maanden, Material Design, multiplatformpariteit
- [Custom store listings](https://support.google.com/googleplay/android-developer/answer/9867158) — tot 50, richtmanieren, één land per vermelding
- [Store listing experiments](https://support.google.com/googleplay/android-developer/answer/12053285) — varianten, betrouwbaarheid, MDE, "not yet available to all developers"
- [Acquisition reports](https://support.google.com/googleplay/android-developer/answer/6263332) — gegevensdrempels en "Other"

**Uit het project zelf**

- `docs/STAND.md` — Apple live 4 oktober, Play live 13 oktober, 177 landen, de supportmail van 12 oktober over de herstartende beoordelingstermijn, het kanaalbericht dat nog openstaat
- `docs/PROMOTIE-NL.md` — de zes punten van 1.5 zitten in de code (commits `4f90c5f`, `568a99f`, `88ae991`), de tegenstrijdigheid tussen `keywords.md` en `listing.nl.md`, de vakantiedata
- `docs/CODES.md` — de promotiecodeval, de twee inwissellinks, "een schoolactie kan deze week beginnen"
- `store/keywords.md` — `Darijaforkids: Marokkaans`, de zoekwoordregels, de geschiedenis als tweede ingang, en de afwijzing op richtlijn 2.3.8 die bepaalt wat er níét in naam en ondertitel mag
- `store/listing.nl.md` — de huidige promotietekst en korte beschrijving
- `docs/MARKT.md` — "deze app wordt niet gevonden, hij wordt doorgegeven"
