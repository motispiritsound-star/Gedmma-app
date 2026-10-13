<!--
  Dit plan is op 13 oktober 2026 gemaakt door zes marketeers er elk een eigen
  route in te laten uitwerken -- de zaterdagscholen, korte video, WhatsApp,
  winkelvindbaarheid, pers, en de zomerreis als kalender -- en elk van die zes
  plannen daarna door een tweede marketeer te laten afbranden op twee vragen:
  kan dit net zo goed over een willekeurige app gaan, en gaat een persoon naast
  ander werk dit echt doen. Wat overbleef staat hieronder.

  Drie dingen heb ik daarna zelf nagekeken voordat dit bestand er kwam:

  - De tegenstrijdigheid tussen `store/keywords.md` en `store/listing.nl.md`
    bestaat echt. keywords.md stelt voor Google Play de titel
    `Darijaforkids: Marokkaans` voor met de korte beschrijving "Leer Darija:
    Marokkaans-Arabisch voor kinderen, met uitspraak"; listing.nl.md zet daar
    `Darijaforkids` neer met "Marokkaans-Arabisch, spelenderwijs -- zodat je
    kind met opa en oma kan praten." Twee bestanden, twee waarden, een veld.
    Welke van de twee in de console staat is van hieruit niet te zien.
  - De vakantiedata kloppen: herfst Noord 10 t/m 18 oktober, Midden en Zuid
    17 t/m 25 oktober, kerst 19 december t/m 3 januari voor alle regio's.
    Zaterdag 17 oktober is dus overal vakantie.
  - `npm run woordjes` bestaat, `docs/MARKT.md` bestaat, en de zes punten van
    1.5 zitten inderdaad allemaal in de code.

  Wat ik niet heb nagekeken staat in het plan zelf als schatting benoemd. De
  aantallen onder "Wat dit realistisch oplevert" zijn ervaring en geen meting;
  ze horen na dertig dagen vervangen te worden door eigen cijfers.
-->

# Darijaforkids — één plan voor negentig dagen

*Geschreven 13 oktober 2026. Nagekeken in de repo, niet uit het hoofd.*

---

## Eerst je vraag over 1.5

**Alle zes dingen zitten in de code. Er is niets meer te repareren — er is nog iets in te sturen.**

`docs/STAND.md` §"Wat er in 1.5 hoort" noemt zes punten. Die staan er nu allemaal:

| | Wat | Commit |
|---|---|---|
| 1 | Alfabetscherm: 31 letters belooft, 28 toont | `92dcc42` |
| 2 | Beloningspil sneed de kop "Missies van vandaag" | `a55daa3` |
| 3 | "Ik heb een code" op het abonnementsscherm | `4f90c5f` |
| 4 | Vraag om een beoordeling, na drie diploma's, één keer | `568a99f` |
| 5+6 | Deelkaart bij een mijlpaal en "Laat het aan oma zien" | `88ae991` |

Wat er nog **wél** moet gebeuren voordat 1.5 iets kan opleveren, staat onderaan in **"Wat er in de app moet"**. Kort: de inzending zelf (en die gaat in één keer, compleet — de supportmail van 12 oktober zegt dat de termijn bij Google opnieuw begint zodra je iets instuurt), de release-notitie die nog niet bestaat, en de winkelvelden die alleen mét een versie meegaan.

---

## De keuze: twee routes, en waarom juist deze twee

Zes routes zijn uitgewerkt. Eén persoon kan er twee. Dit zijn ze:

### Route 1 — De zaterdagroute: binnenkomen waar de Arabische les al gegeven wordt

Op zaterdag staan in Nederland honderden lokalen vol met ouders die **nu al** iets doen aan de taal van hun kind. En wat daar geleerd wordt is Standaardarabisch en Koran. In die taal belt oma niet. Je hoeft daar niets te verkopen: je benoemt een gat dat die ouders zelf elke week voelen, op de enige plek in het land waar ze op hetzelfde moment in dezelfde gang staan te wachten.

Twee dingen maken dit nu uitvoerbaar waar het dat vorige week niet was:

- **De codelink werkt vandaag al, zonder 1.5.** `docs/CODES.md` heeft het uitgezocht: een stapel unieke codes is bij allebei de winkels via een gewone link in te wisselen (`apps.apple.com/redeem?ctx=offercodes&id=6813964474&code=…` en `play.google.com/redeem?code=…`). De knop in de app maakt het makkelijker, maar hij is geen voorwaarde.
- **Daarmee is dit de enige route die je kunt méten.** Je ziet niet alleen dát een plek ja zei, maar hoeveel van de vijftig briefjes zijn gebruikt.

### Route 2 — Doorgeven: de deelkaart in de app, de familie-WhatsApp, en één woord per dag

`docs/MARKT.md` opent met de regel die alles bepaalt: deze app wordt niet gevonden, hij wordt doorgegeven. Twee dingen die al gebouwd zijn doen dat werk:

- **De deelkaart** (`src/engine/delen.ts`): bij 25, 50, 100, 200 en 304 woorden die echt vastzitten komt er een kaart — *"Nour kent al 100 woorden Darija"* — met een knop naar WhatsApp. Dat is een bericht over het kínd, verstuurd door de ouder zelf, in de familiegroep. Jij kunt zo'n bericht niet maken en geen advertentie kan het kopen.
- **`npm run woordjes`**: één commando maakt van elk woord een filmpje van acht seconden met jouw eigen stem erin. `--aantal 90` is een kwartaal inhoud in één avond. Dat is de reden dat route 2 bijna geen tijd kost.

### Waarom route 1 eerst, en route 2 eronder

De deelkaart vuurt pas bij 25 woorden die *vastzitten* (`strength ≥ 0.85`). Dat is weken echt gebruik. De beoordelingsvraag komt pas na drie diploma's. **Route 2 kan de eerste dertig dagen dus niets opleveren, want er zijn nog geen gebruikers om hem aan te zetten.** Route 1 levert die gebruikers. Daarna versterken ze elkaar: elk gezin dat via een school binnenkomt, wordt over een maand of twee een deelkaart in een familiegroep waar jij nooit komt.

### Wat eruit gaat, en waarom

- **Pers** (regionale kranten, opiniestuk, radio, bibliotheekavond). De lezer van een regionaal dagblad is niet je doelgroep. Pers koopt legitimiteit, geen gebruikers — en het is het werk met de langzaamste terugkoppeling en de meeste nee's. Eén uitzondering voor later: als er in februari of mei iemand belt, zeg je ja. Zelf achteraan rennen: niet.
- **Winkelvindbaarheid als route.** Op "darija" wordt in Nederland weinig gezocht; dat is geen tekortkoming maar een feit over deze markt. De winkelpagina is er niet om gevonden te worden, hij is er om de mensen die jíj er heen stuurt niet te laten afhaken. Dus: één keer goed zetten, meeliften op de 1.5-inzending, en daarna een jaar niet aanraken.
- **Flyers neerleggen bij winkels.** Negen uur rijden voor iets dat je niet kunt meten. Een stapel briefjes mét code bij één plek die ja zei, is meer waard dan vijftig kaartjes in tien zaken.
- **De zomer als route.** De zomerreis is geen route, het is je kalender. Hij zit in dit plan als deadline, niet als los spoor.

---

## De eerste zeven dagen

Dit is de drukste week van de negentig: ongeveer **tien uur**, waarvan zeven eenmalig werk dat nooit terugkomt. Daarna is het vijf uur per week.

**Eén ding dat je week verandert en dat je moet weten:** het is nu herfstvakantie. Regio Noord 10 t/m 18 oktober, Midden en Zuid 17 t/m 25 oktober ([rijksoverheid.nl](https://www.rijksoverheid.nl/themas/onderwijs/schoolvakanties/overzicht-schoolvakanties-per-schooljaar/overzicht-schoolvakanties-2026-2027)). Veel zaterdagscholen volgen die vakantie. **Zaterdag 17 oktober is in het hele land vakantie — ga dan niet rijden.** Je eerste echte zaterdagronde is 24 oktober als je stad in Noord zit, en 31 oktober als hij in Midden of Zuid zit. Zuid-Holland is gesplitst, dus kijk na in welke regio jouw stad zit. Deze week bel je, deze week stuur je 1.5 in.

### Dag 1 — woensdag 14 oktober · 1,5 uur

**1. Kijk in beide consoles wat er écht staat. (20 min)**
`store/keywords.md` en `store/listing.nl.md` spreken elkaar tegen op drie Nederlandse velden: de Play-titel (`Darijaforkids: Marokkaans` tegenover `Darijaforkids`), de korte beschrijving, en de Apple-trefwoorden. Eén van de twee bestanden is niet wat er in de console staat. Open ze, schrijf op wat er staat, en maak één nieuw bestand `store/wijzigingen.md` met per regel: datum, veld, oude waarde, nieuwe waarde. Eerst weten wat er staat, dan veranderen.

**2. Zet de Apple-promotietekst om. (10 min)**
Dit is het enige tekstveld dat je kunt wijzigen zonder nieuwe versie en zonder op een beoordeling te wachten. Nu staat er iets over de geschiedenisfilmpjes. De tekst staat verderop, kant en klaar, en is 125 van de 170 tekens.

**3. Maak de codes aan, en wissel er zelf één in. (45 min)**
Bij Apple heet het *offer codes*, bij Google *promo codes*. Maak één kleine stapel van 25, naam `NL-test-okt26`, en wissel er zelf één in via de link op een toestel waar nog geen abonnement op staat. **Nooit een code uitdelen die je niet zelf hebt geprobeerd.**

Vier keuzes die je vooraf maakt, want een aangemaakte aanbieding is niet meer te wijzigen (`docs/CODES.md`):
- **Drie maanden gratis.** Lang genoeg om door twee units te komen, kort genoeg om in hetzelfde schooljaar te beslissen.
- **Op het jaarabonnement.** Wie na drie maanden doorgaat is een betere klant dan wie per maand twijfelt.
- **Alleen nieuwe abonnees.** Bij Google kan het niet anders.
- **Eén aanbieding per plek**, zodat de rapportage je per plek vertelt wat het opleverde. Apple staat maximaal tien actieve aanbiedingen per abonnement toe; met drie tot zes ja's in negentig dagen is dat ruim genoeg.

### Dag 2 — donderdag 15 oktober · 1,5 uur

**1. Bouw één werklijst van vijftien plekken in drie steden. (45 min)**
Niet zestig in acht steden. Vijftien, in de drie steden waar je binnen een uur bent — reistijd is je echte budget. Kolommen: plek, stad, wijk, soort (moskee / zelfstandige lesclub / stichting), lesdag en tijd, 06-nummer (gaat vóór een mailadres), naam van je contact, warme ingang ja/nee, status, datum laatste poging, **waar zei hij nee om**, en **Darija of Tarifit**.

Zoektermen: *"Arabische les kinderen [stad]"*, *"koranles kinderen zaterdag [stad]"*, *"madrassa kinderen [stad]"*, *"Arabisch onderwijs stichting [wijk]"*. **Gebruik het woord weekendschool niet als zoekterm** — dat is in Nederland bezet door een organisatie die iets volstrekt anders doet en het vervuilt je hele lijst. Loop daarnaast Google Maps op "moskee" per wijk af: bij veel Marokkaanse moskeeën staat de zaterdagles nergens online, die vind je alleen door te bellen.

**Begin bij de zelfstandige lesclubs en stichtingen, niet bij de grote moskeeën.** Daar is de docent de eigenaar en kan die in één gesprek ja zeggen. Bij een moskee moet het langs een bestuursvergadering.

**2. Vijf warme ingangen. (20 min)**
De moskee waar je zelf komt, de les waar je kind zit, de vader van het voetbalveld, je zus in een ouder-WhatsApp-groep, de oom die iemand in een bestuur kent. Stuur geen uitleg over de app. Vraag twee dingen: *"wie gaat daar over de Arabische lessen?"* en *"mag ik jouw naam noemen als ik hem app?"*

**3. Zet in je lijst wat je gaat vragen over Tarifit. (5 min)**
Zie de verantwoording onder *"Wat je niet moet doen"*, punt 12. Dit is het enige getal dat je prioriteiten echt kan omgooien, en het kost je nul extra tijd.

### Dag 3 — vrijdag 16 oktober · 1 uur

Geen telefoontjes vandaag — vrijdagmiddag is gebed.

**1. `npm run brand` (10 min).** Dat maakt onder andere `brand/print/flyer-a5-nl.png`: A5 op 300 dpi, op ware grootte, in zes talen. Je hoeft geen flyer te ontwerpen, hij ligt er na één commando.

**2. Het briefje per gezin, en de A4 voor de deur. (50 min)**
Tekst staat verderop. Het briefje krijgt per gezin een eigen code, en dat betekent: **niet naar een drukker.** Een drukker die honderdvijftig briefjes met elk een ander woord erop zet, is duur en duurt een week. Acht per A4 op je eigen printer, de code met pen erbij, is lelijker en morgen klaar. Kies morgen klaar.

### Dag 4 — zaterdag 17 oktober · 2 tot 3 uur

**Stuur 1.5 in. In één keer, compleet.** Dit is het blok waarvoor je de Mac nodig hebt, en het is de belangrijkste dag van de week — niet omdat de app stuk is, maar omdat de vier knoppen in 1.5 de enige dingen zijn die een doorgegeven app meetbaar maken.

Wat er in dezelfde inzending mee moet en wat er daarna een jaar niet meer bij kan:
1. De zes punten die al gebouwd zijn.
2. `store/wat-is-nieuw-1.5.md` — die bestaat nog niet (1.1 t/m 1.4 wel), in zes talen.
3. De nieuwe Apple-**ondertitel** en de nieuwe **trefwoorden**. Die gaan alleen mee met een versie; vergeet je ze, dan wacht je op de volgende ronde.
4. De Play-titel en de korte beschrijving, zodra je weet wat er in de console stond.

En daarna: **niets meer aanraken tot het erdoor is.** Vorige ronde kostte bij Play elf dagen, zeven inzendingen en een supportticket.

### Dag 5 — zondag 18 oktober · 1,5 uur

**1. `npm run woordjes -- --aantal 30` (loopt zelf; 20 min kijken).** Dertig dagen inhoud, met jouw eigen stem erin. Bekijk er drie met het geluid uit: snap je ze zonder stem, dan snapt iedereen ze.

**2. Eén eigen opname. (45 min)**
Het enige dat geen commando kan maken. Twee goede, in deze volgorde:
- **Jouw moeder die de app hoort.** Vraag of je het mag filmen, film haar handen en de telefoon, laat haar reactie staan. Dat is je sterkste beeld van het hele jaar.
- **Jouw eigen bekentenis**, aan de keukentafel: *"Ik heb mijn kinderen mijn eigen taal niet geleerd. Niet omdat ik het niet wilde. Omdat het elke dag makkelijker was om Nederlands te praten."*

**Film niet je kind dat het niet kan.** Dat is niet mijn moraal maar je eigen rekening: dat beeld blijft staan in een gemeenschap waar de neefjes meekijken, en het is niet aan jou om dat over hem te besluiten. Je eigen schaamte mag je weggeven. Die van hem niet.

**3. Zet de eerste post in je kanaal. (10 min)** Eén woord. Geen aankondiging, geen link naar de winkel.

### Dag 6 — maandag 19 oktober · 1 uur

**Tien berichten, 's avonds tussen 19.00 en 21.00.** WhatsApp vóór mail — bel of app het 06-nummer dat op de site, de poster of de Facebook-pagina staat. Mail alleen als er geen nummer is. Nooit een bijlage in het eerste bericht; dat leest als reclame. Eén bericht per plek, en meteen de datum in je lijst.

De opening is een echte vraag over de vakantie, geen pitch. Dat is deze week je voordeel: je hebt een reden om te bellen die niet over jou gaat.

### Dag 7 — dinsdag 20 oktober · 45 minuten

**Vraag vijf mensen om een beoordeling. Vijf, niet dertig.**
De app staat sinds 4 oktober bij Apple en sinds gisteren bij Google. Er zijn geen dertig mensen die hem echt met hun kind gebruikt hebben — er zijn er misschien vijf. Vraag die vijf, persoonlijk, met in elk bericht iets dat alleen over hén gaat. Vraag nooit om sterren en geef er nooit iets voor terug; dat is bij beide winkels grond om je app te verwijderen, en je ziet het aan de tekst.

Daarna: schrijf in je lijst op wat de tien plekken van gisteren hebben geantwoord, en waar de nee's over gingen.

---

## Dag 8 tot 90

### Week 2 tot 4 — de eerste ja's (ongeveer 5 uur per week)

- **Tien berichten per week**, in één avond. Na vier dagen één keer nabellen — niet een tweede appje, bellen. Woensdag- of donderdagavond, niet vrijdagmiddag, niet zaterdagochtend. *"Ik stuurde u maandag een bericht over Darija, heeft u het gezien? Eén vraag en dan laat ik u."* De meeste ja's komen bij dat telefoontje; zonder nabellen is de hele lijst weggegooid werk. Na twee keer niets: op "later" en stoppen.
- **Eén zaterdagronde per maand**, niet elke week. Op zaterdagochtend zit je eigen kind op les — dat kind is je geloofsbrief, dus plan je niet in een andere stad. Vier tot zes plekken op fietsafstand, één stad, het halve uur vóór en ná de les. Je gaat niet flyeren: je vraagt naar de coördinator, je laat één opname horen, je laat één A4 achter en je vraagt precies één ding — *"mag ik over twee weken tien minuten als de ouders er zijn?"* Eén keer vragen, bedanken, weggaan. Eén keer overkomen als verkoper gaat in deze gemeenschap sneller rond dan welke flyer ook.
- **Bij een ja: drie dingen, in deze volgorde.** (1) Je maakt een eigen codestapel aan met de naam van de plek erin. (2) Je vraagt om tien minuten op een moment dat de ouders er toch zijn. (3) Je geeft de docent het doorstuurbericht en zegt: *"stuur het in jouw eigen woorden."* Jij komt niet in de ouder-WhatsApp-groep, en dat moet je ook niet willen. Een bericht van een onbekende wordt genegeerd; hetzelfde bericht van de juf niet. **Dit is de stap die van één ja naar dertig gezinnen gaat.**
- **Route 2 kost je drie kwartier per week:** één woordje per dag in het kanaal, en hetzelfde bestand naar Instagram, TikTok en YouTube. Altijd het originele bestand uploaden, nooit iets dat je uit TikTok hebt gedownload. Geen plaatstijden testen, geen proefreels, geen uur reacties beantwoorden: bij tientallen weergaven meet je ruis.

### Week 5 tot 8 — van actie naar kanaal (november)

- **Na veertig benaderingen: één uur terugkijken.** Je krijgt grofweg vijf soorten nee: *"wij doen al Arabisch"*, *"geen tijd"*, *"het bestuur moet beslissen"*, *"in de moskee doen we geen commercie"*, *"wij spreken Tarifit"*. Welke bovenaan staat, hoort daarna in je eerste zin — vóórdat iemand hem kan uitspreken.
- **De Tarifit-uitkomst.** Na tien gesprekken weet je of deze route over je hele doelgroep gaat of over de helft. Zegt de helft Tarifit, dan verandert je eerste zin (niet het telefoongesprek met oma, maar de souq, de douane, de neefjes uit Casablanca) en dan is dat het belangrijkste wat je in negentig dagen leert.
- **Maak van je ja's vaste plekken.** Vraag niet om nog een avond. Vraag om een vast moment: jouw stapel briefjes in het inschrijfmapje bij elke nieuwe ronde (na de zomer en rond januari), en één keer per kwartaal een appje dat jij in je agenda zet, want hij gaat er niet aan denken. Dat is het verschil tussen een actie en een kanaal.
- **Vraag nú je plek in het Ramadan- en Eidprogramma.** Ramadan 2027 begint naar verwachting rond begin februari en het Suikerfeest rond begin maart, maar dat hangt van de maanwaarneming af — vraag het bij je eigen moskee, en zet geen datum op papier voordat je het daar gehoord hebt. In die weken zitten moskeeën vol en hebben besturen géén tijd om iets nieuws te bespreken. Vraag het dus in november. Vraag specifiek om het kinderprogramma rond Eid: daar zitten ouders én grootouders in dezelfde zaal.
- **Eén tweede stad** erbij, als de eerste werkt. Niet eerder.

### Week 9 tot 13 — de kerstvakantie (19 december t/m 3 januari)

De twee weken waarin families aan tafel zitten en met Marokko bellen. Drie berichten in die periode, allemaal over hetzelfde beeld: de telefoon gaat naar Marokko en het kind zwijgt.

Dit is ook je moment voor het **jaarabonnement**, en dan reken je in plaats van af te prijzen: € 59,99 per jaar is € 5,00 per maand, met een leesboek van € 14,99 erbij; per maand is het € 6,99. Wie nu begint heeft de hele zomer nog voor zich. Verkoop in deze maanden bewust geen maandabonnement.

**De grootouder.** Hij is je tweede koper, maar er bestaat geen cadeaubon: er zijn geen accounts, en een code is een proefperiode waarvoor een betaalmiddel nodig is. In de praktijk betaalt oma en zet de ouder hem op de telefoon. Zeg dat zo, en verzin er niets bij.

### Daarna, in één alinea

Vanaf 1 april sta je op ongeveer honderd dagen. Dán zet je de aftelling aan, niet eerder — achtendertig weken aftellen is geen campagne, dat is zeuren. En reken niet met één datum: de zomervakantie 2027 begint in Noord op 10 juli, in Midden op 17 juli en in Zuid op 24 juli ([rijksoverheid.nl](https://www.rijksoverheid.nl/themas/onderwijs/schoolvakanties/zomervakantie/zomervakantie-2027)), dus "honderd dagen" klopt voor een derde van je publiek. Zeg "begin juli" en laat de precieze datum weg. En vanaf half mei verandert de belofte: niet meer "meepraten" maar "niet stom staan kijken" — oma begroeten, zich voorstellen, iets kopen, afdingen, antwoorden als een neef iets vraagt. Wie in mei begint leert geen gesprek meer, wel twintig zinnen, en dat is precies wat je dan aanbiedt. Zie de laatste alinea van "Wat er in de app moet" voor het ene ding dat daarvoor nog gebouwd moet worden.

---

## De teksten — plakbaar

### 1. Eerste WhatsApp aan de docent of coördinator

> Assalaamoe alaikoem, mijn naam is [naam], ik ben vader uit [stad]. Twee vragen, en dan laat ik u.
>
> Geeft u in de herfstvakantie les, en wanneer begint het weer? En spreken de ouders bij u thuis Darija, of is het hier vooral Tarifit?
>
> Ik vraag dat omdat ik iets gemaakt heb waar u misschien iets aan heeft. Bij ons thuis gebeurde dit: mijn moeder belt en praat Darija, en mijn kind antwoordt in het Nederlands. Ze verstaat haar wel. Maar ze praat niet terug.
>
> Daarom heb ik een app gemaakt waarmee kinderen Darija leren praten. Niet in plaats van wat u geeft — uw les gaat over lezen, schrijven en Koran, deze gaat over het telefoongesprek met oma. Alle 432 opnames heb ik zelf ingesproken, aan mijn eigen keukentafel. Geen computerstem.
>
> Mag ik u een keer vijf minuten laten horen hoe het klinkt, voor of na de les?
>
> Als het niet past, zegt u dat gewoon — dan val ik u niet nog een keer lastig.
>
> [naam] — darijaforkids.eu

### 2. Het doorstuurbericht dat de docent zelf verstuurt

> Assalaamoe alaikoem ouders,
>
> Een vader uit [stad] heeft een app gemaakt waarmee kinderen Darija leren práten — het Marokkaans van thuis, niet het Standaardarabisch van de les. Hij heeft alle opnames zelf ingesproken, dus het is een echte stem en geen computer. Hij werkt zonder internet, er zitten geen advertenties in en er is geen account nodig.
>
> De eerste vier lessen zijn gratis, dus je kunt het eerst gewoon proberen; daarna is het een abonnement. darijaforkids.eu
>
> Hij zei het zelf zo, en ik moest er wel om lachen omdat het bij ons precies zo is: je kind verstaat oma wel, maar het antwoordt in het Nederlands.

### 3. De eerste twee minuten van de tien minuten — uit je hoofd leren

> Assalaamoe alaikoem. Mijn naam is [naam], ik woon in [stad] en ik ben vader van twee kinderen. Net als u breng ik ze hier.
>
> Vorig jaar belde mijn moeder. Ze praatte met mijn dochter zoals ze altijd met mij heeft gepraat, in Darija. En mijn dochter antwoordde in het Nederlands. Ze verstond alles. Maar ze gaf geen antwoord in de taal van haar oma.
>
> Ik heb opgehangen en daar een week over nagedacht. Want wat ik van mijn moeder heb gekregen, heb ik niet doorgegeven.
>
> Wie van u kent dat? *[wacht, kijk de zaal rond, zeg niets]*
>
> Dan sta ik hier goed.
>
> Uw kind leert hier lezen en Koran. Dat is belangrijk en daar kom ik niets aan veranderen; mijn eigen kind zit hier ook. Maar oma belt niet in Standaardarabisch. Oma belt in Darija. En dat is wat ik gemaakt heb.
>
> Luister even. *[telefoon op de luidspreker, één opname uit de app]* Dat ben ik. Vierhonderdtweeëndertig keer, aan mijn eigen keukentafel, want ik vond nergens iets wat niet als een schoolboek klonk. En dit *[dezelfde zin in een gratis vertaalapp]* is wat uw kind krijgt als het het op internet opzoekt. Het verschil hoef ik u niet uit te leggen, dat hoort u zelf.

Daarna, in zeven minuten: het verschil met hun les (zonder die les af te vallen), de zomer als reden om nu te beginnen, wat het kost — in één keer en eerlijk — en dan: *"pak je telefoon, scan dit, zet vanavond de eerste les aan bij het tandenpoetsen."* Blijf daarna twintig minuten staan. Daar komen de vragen en de grootouders.

### 4. Het briefje per gezin

**Voorkant**
> Je kind verstaat oma wel.
> Maar het antwoordt in het Nederlands.
>
> *[grote QR]*
> darijaforkids.eu

**Achterkant**
> **Darijaforkids** — Marokkaans-Arabisch voor kinderen.
> 17 units, van het alfabet tot afdingen op de souq. 304 woorden, 100 zinnen. Lesjes van twee minuten.
> 432 opnames, allemaal door de maker zelf ingesproken. Geen computerstem.
> Werkt zonder internet. Geen account, geen advertenties.
>
> **Drie maanden gratis met deze code: ………………**
> Inwisselen: iPhone → `apps.apple.com/redeem` · Android → `play.google.com/redeem`
>
> Om de code in te wisselen heb je een betaalmiddel nodig, en daarna loopt het door: € 6,99 per maand, of € 59,99 per jaar (dat is € 5,00 per maand, met een leesboek erbij). Opzeggen kan altijd, in je eigen App Store- of Play-account.

Die laatste alinea is lelijk en hij moet er staan. Een belofte van "gratis" die eindigt in een afschrijving is het enige gerucht dat je je in deze gemeenschap niet kunt veroorloven.

### 5. Drie antwoorden die je gaat nodig hebben

**"Wij leren hier Standaardarabisch, Darija is maar een dialect."**
> U heeft gelijk dat Darija geen schrijftaal is, en ik kom niet beweren dat het uw les vervangt. Wat u geeft kan ik niet geven: lezen, schrijven, Koran. En wat ik geef kunt u in uw uur niet geven — dat een kind dúrft te praten met zijn oma. Het werkt trouwens de andere kant op ook: een kind dat thuis al praat, hoort uw letters in woorden die het al kent.

**"Jullie verdienen er geld aan" / "in de moskee doen we geen commercie."**
> Ik verdien hier geld aan, ja. Ik zeg het liever zelf dan dat u het straks zelf ontdekt. De eerste vier lessen zijn gratis en er zitten geen advertenties in. Daarna kost het € 6,99 per maand, of € 59,99 voor een jaar met een boek erbij. Ik verkoop hier vandaag niets en ik neem geen geld aan in dit gebouw; wie het wil zoekt het thuis op. En voor deze plek heb ik briefjes met drie maanden gratis, één per gezin — met er eerlijk op wat het daarna kost.

**"Mijn moeder spreekt Tarifit, geen Darija."**
> Dan moet ik eerlijk zijn: de app leert Darija, niet Tarifit. Als uw moeder alleen Riffijns praat, doet dit niet wat u hoopt, en dat ga ik niet mooier maken dan het is. Wat het wél doet: Darija is de taal waarin uw kind in Marokko boodschappen doet, afdingt op de souq, met zijn neven en nichten praat, en op straat terechtkomt. Voor het gesprek met uw moeder heb ik niets. Voor de rest van die zes weken wel.

### 6. De winkelvelden — nageteld

| Veld | Tekst | Tekens |
|---|---|---|
| Apple ondertitel (max 30) | `Darija leren, praten met oma` | 28 |
| Apple trefwoorden (max 100) | `marokkaans,arabisch,marokko,taal,kinderen,school,woorden,uitspraak,alfabet,gezin,thuistaal,dialect` | 98 |
| Apple promotietekst (max 170) | `Je kind verstaat oma wel. Maar het antwoordt in het Nederlands. Twee minuten per dag, en deze zomer praat het mee in Marokko.` | 125 |
| Play titel (max 30) | `Darijaforkids: Darija leren` | 27 |
| Play korte beschrijving (max 80) | `Marokkaans-Arabisch leren: je kind praat straks mee met oma in Marokko.` | 71 |

Twee dingen waarom dit zo staat. **"Darija" staat nu in de ondertitel als los woord met een spatie erachter** — niet in `Marokkaans-Arabisch` met een koppelteken, want of Apple op een koppelteken een woordgrens ziet weet ik niet, en dat risico neem je niet met je belangrijkste zoekterm. Daarom gaan `darija` en `leren` uit het trefwoordveld: herhalen wat in naam of ondertitel staat is weggegooide ruimte. En **`gratis` gaat eruit** — je hebt een abonnement, het leest als spam en het haalt teleurgestelde recensies binnen.

Eén ding dat nu wél mag en waar de oude documentatie nog van uitgaat dat het verboden is: *voor kinderen* in de ondertitel. De app zit sinds 27 september in de Kinderen-categorie met leeftijdsband 6–8, en `docs/APPLE-2.3.8.md` zegt het letterlijk: in die categorie mag het weer. Ik gebruik het niet, want "praten met oma" is sterker dan een leeftijdslabel — maar het slot dat de oude documentatie erop legt, bestaat niet meer.

En de alinea die je in de **Play-beschrijving** zet (niet in het Apple-trefwoordveld, daar beloof je dan iets wat de app niet doet):

> **IS DIT WAT JE ZOEKT?**
> Zocht je Darija — het Marokkaans-Arabisch van thuis, van de straat en van de telefoon? Dan ja, dit is het.
> Zocht je Standaardarabisch of Koranarabisch, de taal van het nieuws en van de les op zaterdag? Dan niet. Dat is een andere taal, en deze app leert hem niet. Veel kinderen doen uiteindelijk beide, en ze bijten elkaar niet.
> Zocht je Riffijns of Tamazight, de taal van de Rif? De taal niet — dat zeggen we liever nu dan dat je het na drie lessen zelf merkt. Maar ook kinderen van Riffijnse ouders hebben Darija nodig zodra ze in Marokko buiten de familie komen: op de markt, bij de buren, bij de dokter.

### 7. Het persoonlijke recensieverzoek

> Hey, je zei vorige week dat ze de kleuren nu kent. Daar werd ik echt blij van.
>
> Mag ik je iets vragen? De app staat in de winkel met nul beoordelingen, en zonder beoordelingen vindt niemand hem — hoe goed hij ook is. Een paar regels van jou helpen meer dan alles wat ik zelf kan doen.
>
> Ik vraag niet om vijf sterren. Schrijf wat je er echt van vindt, ook als er iets niet werkt. En als je het doet: zet er iets concreets in. Niet "mooie app", maar waar je hem voor gebruikt en wat ze nu kan. Dat is wat de volgende ouder leest voordat hij hem binnenhaalt.

De eerste zin móét over die persoon gaan. Zonder die zin is het een rondschrijven en werkt het niet.

### 8. Het dagelijkse kanaalbericht

> 🇲🇦 Woord van vandaag: **bnin** — lekker
>
> Zeg het vanavond tegen oma als ze gekookt heeft: *"hadi bnina!"* — dit is lekker.
> Als ze lacht, heb je je les van vandaag gehad.
>
> 🎧 *[het filmpje uit `npm run woordjes`]*

Eén keer per week in plaats van een woord: **de oma-opdracht.**

> Opdracht van deze week.
>
> Laat je kind één spraakbericht naar oma sturen met het woord van vandaag erin. Niet perfect. Gewoon doen. Twee seconden is genoeg.
>
> En als oma antwoordt: zet dat antwoord in je familiegroep. Niet voor mij — omdat de helft van je familie precies hetzelfde probleem heeft en niet weet dat het ook anders kan.

Dat is het enige bericht in het hele plan waarin niet jij de verspreider bent en niet de ouder het werk doet, maar de grootmoeder. Geen advertentie kan dat.

---

## Wat je niet moet doen

1. **Niet "Marokkaanse stemmen" zeggen.** Het is één stem: de jouwe. `store/press-kit.md:141` zegt het letterlijk — alle 432 opnames zijn door de uitgever zelf ingesproken. "Stemmen" suggereert een cast en de eerste vraag na een demo is altijd wie het dan was. *"Dit ben ik, 432 keer, aan mijn eigen keukentafel"* is het sterkere verhaal én het ware. Zeg het zelf, voordat iemand het vraagt.
2. **Nooit "een gratis jaar" of "gratis voor de leraar" beloven.** Google zegt het met zoveel woorden in `docs/CODES.md`: promoties geven gratis proefperiodes, geen gratis abonnementen, er is een betaalmiddel nodig en het verlengt automatisch. Voor Apple heb ik die zin niet woordelijk; ga ervan uit dat het hetzelfde werkt. Wat je kunt geven is drie maanden, met de prijs erop.
3. **Niet "verzamelt niets" als absolute bewering.** Het is bijna waar en net niet: achter de ouderpoort kan een ouder zelf een e-mailadres achterlaten (`src/engine/post.ts`), en dat is het enige dat het toestel ooit verlaat. Zeg: *"geen account, geen advertenties, en het enige dat het toestel verlaat is een e-mailadres dat u er zelf achterlaat."* Op een kaartje is "verzamelt niets" waar genoeg; tegen een bestuur dat je privacypagina naleest is het een asterisk die je zelf had moeten noemen. *(En één claim die je wél hard mag maken en die anderen verkeerd hebben: de spreekoefening gebruikt géén spraakherkenning. `src/engine/microfoon.ts` neemt op en laat terughoren, en herkent niets — er bestaat geen motor die Darija kent.)*
4. **Geen dagelijkse herinnering in de app bouwen.** Het is Made for Kids 6–8; een melding naar een kind die iets aanprijst mag daar niet, en je eigen test houdt het al tegen (`src/ui/plank.test.ts`: *"raakt de wekker niet aan"*). Wie dit voorstelt, stelt een afwijzing voor.
5. **Niet in stukjes inzenden.** Google's beoordelingstermijn begint opnieuw bij elke wijziging. 1.5 gaat in één keer de deur uit of niet.
6. **Niet twintig recensies in één week willen.** Je hebt geen twintig gebruikers, en twintig recensies op dag twee bij nul downloads ziet er voor de winkel én voor de lezer verkeerd uit. Vijf echte, over drie weken verspreid.
7. **Niets achter een beoordeling wegzetten en nooit om sterren vragen.** Bij beide winkels grond om je app te verwijderen, en het verpest precies het vertrouwen dat jouw app als enige heeft.
8. **De andere winkel niet noemen.** Versie 1.0 is afgewezen op richtlijn 2.3.10 omdat de Apple-beschrijving Google Play noemde. Dat geldt ook voor je antwoorden op recensies, waar geen test meekijkt.
9. **Niet zelf in twintig familie-, buurt- en moskeegroepen plaatsen.** Dat kan één keer, en daarna ben je in een gemeenschap waar iedereen elkaar kent "die van die app". Laat anderen in hun eigen groep plaatsen, met hun eigen woorden.
10. **Niet wachten op het bestuur.** *"We nemen het mee in de vergadering"* is een nee met vertraging. De echte poort is de docent en de ouder-WhatsApp-groep: één docent die jouw bericht doorstuurt doet meer dan drie bestuursvergaderingen.
11. **Geen betaalde advertenties voor week vijf**, en niet voordat één video zonder geld al beweegt. Geld versterkt alleen wat al loopt.
12. **Niet zeggen dat de app Tarifit leert.** Een flink deel van de Marokkaanse Nederlanders komt uit het Rifgebied, en bij die ouder sprak oma thuis Tarifit. Hoe groot dat deel is weet niemand precies: het CBS registreert land van herkomst, niet taal of streek, dus elk percentage dat je ergens leest is verzonnen. Stel de vraag in elk eerste telefoontje en tel je eigen antwoorden. Liegen in een stad waar iedereen elkaar kent is hier geen moraal maar strategie.
13. **Na deze inzending niet meer dan één winkelveld per maand veranderen**, met de datum in `store/wijzigingen.md`. Anders heb je over zes maanden tien wijzigingen gedaan en nul kennis.

---

## Wat er in de app moet voordat marketing kan werken

**Alles wat 1.5 nodig heeft is gebouwd. Wat ontbreekt is de inzending en drie kleine dingen eromheen.**

| Wat | Waarom het niet kan wachten |
|---|---|
| **1.5 insturen, in één keer** — iOS via de Mac, Android met `npm run aab` | De vier knoppen zijn de enige dingen die een doorgegeven app meetbaar maken. Zolang ze in de code staan en niet in de winkel, bestaan ze niet. |
| **`store/wat-is-nieuw-1.5.md`, zes talen** | 1.1 t/m 1.4 hebben er een, 1.5 niet. Het veld moet gevuld worden bij het insturen, en dan is het het verkeerde moment om het te gaan schrijven. |
| **Ondertitel en trefwoorden mee in dezelfde inzending** | Bij Apple gaan die velden alleen mee met een versie. Vergeet je ze nu, dan wacht je op de volgende ronde. |
| **De codes aanmaken in beide consoles, en er zelf één inwisselen** | Dit kan vandaag, zonder 1.5 (`docs/CODES.md`). Het is de enige meting die de zaterdagroute van gevoel naar cijfer brengt. Een aangemaakte aanbieding is niet meer te wijzigen, dus de vier keuzes maak je vooraf. |
| **Uitzoeken wat er echt in de twee consoles staat** | `store/keywords.md` en `store/listing.nl.md` geven voor Nederland een andere Play-titel, een andere korte beschrijving en andere trefwoorden. Je kunt niet veranderen wat je niet weet. |

**Twee dingen die níét in 1.5 horen, en waarom.** De kanaallink in de app: dat is een hele beoordelingsronde voor één knop en hij kan net zo goed in 1.6. En de twee open punten uit `docs/STAND.md` (het kanaalbericht, en het nakijken van *"Target age is 6 – 2147483647"*) zijn geen code — doe die als er rust is.

**Eén ding voor 1.6, en het is de belofte van je mei-campagne.** De twintig zinnen die een kind in Marokko echt nodig heeft — afdingen, de weg vragen, waar is de wc — zitten in unit 14 tot 16 van de 17, achter de betaalgrens én achter het unitpad: elke unit gaat pas open na de toets van de vorige. Wie in mei begint, komt daar in zes weken van twee minuten per dag niet. Dus belooft je mei-campagne iets wat de app structureel niet kan leveren, en dat levert in augustus eensterrenrecensies op van precies de mensen die je als eerste geloofden. Repareer dat niet met tekst: zet die twintig zinnen in een vrij toegankelijk reisrijtje buiten het unitpad, en maak er één gratis PDF van. Beslis dat in maart, niet nu — maar weet nu al dat het er aan komt.

---

## Wat je wekelijks meet — vier getallen, een kwartier

| Getal | Waar | Waarom dit, en niet iets anders |
|---|---|---|
| **Installaties deze week** | App Store Connect → App Analytics; Play Console → Acquisitie | Het enige getal dat alles samenvat. Let vooral op de dagen waarop je *niets* hebt gedaan: lopen die op, dan wordt hij doorgegeven, en dat is het hele doel. |
| **Ingewisselde codes, per plek** | De rapportage bij je aanbiedingen in beide consoles | De zuiverste meting die je hebt en de enige die per plek vertelt wat een ja waard was. "Vijf plekken zeiden ja" is geen cijfer; "plek drie leverde elf gezinnen" wel. |
| **Betalende abonnees** | Abonnementen per product in beide consoles | Proeven van drie dagen zeggen weinig; wie na de proef betaalt, zegt alles. Codegezinnen verschijnen hier pas in maand vier. |
| **Beoordelingen: aantal en gemiddelde** | Beide consoles | Nul sterren is nu je grootste rem in de winkel, en het is het enige getal waar je direct iets aan kunt doen: vragen. |

Wat je **niet** wekelijks meet: volgers, weergaven, likes, plaatstijden. Bij tientallen weergaven vergelijk je ruis met ruis, en je gooit goede openingszinnen weg op grond van niets. En vanaf week vijf, één keer per maand: schrap het ene ding dat het minst heeft opgeleverd, ook als je er het meeste werk in hebt gestopt.

---

## Wat dit realistisch oplevert

Het eerst het eerlijke deel. **`docs/LANCERING.md` heet "10.000 betalende abonnees in 90 dagen". Dat gaat niet gebeuren**, niet met één persoon, naast ander werk, zonder advertentiebudget, vanaf nul recensies. Dat getal hoort bij een plan met vier mensen en geld. Je hebt noch het een noch het ander, en je plan hoort dat niet te verzwijgen.

Wat er wél in zit, in orden van grootte en niet als voorspelling — **dit zijn mijn schattingen uit ervaring, niet metingen van deze markt, en je vervangt ze na dertig dagen door je eigen cijfers:**

- **Veertig benaderingen voor drie tot vijf echte ja's**, waarvan twee of drie een moment vóór ouders worden. De rest: een kwart reageert nooit, een kwart zegt vriendelijk nee, een kwart zegt "later" of "het bestuur", en bij een paar blijf je in de lucht hangen. Je zult dus vijftien tot twintig keer nee horen voordat er iets gebeurt waar je blij van wordt. Dat is normaal. Wat het echt niet-werkend maakt is stoppen bij nummer twaalf.
- **Installaties in de honderden, niet in de duizenden**, en betalende abonnees in de tientallen. Dat voelt klein. Het is ook het enige eerlijke beginpunt, en het is genoeg om te weten of de route werkt.
- **Vijf tot twintig recensies** in negentig dagen, als je het blijft vragen aan mensen die hem echt gebruiken.
- **Het echte doel van deze negentig dagen is niet omzet.** Het is drie plekken die elk jaar opnieuw gezinnen aanleveren zonder dat jij er bent, één antwoord op de Tarifit-vraag, en in augustus een opname van een kind dat iets tegen zijn oma zei. In oktober 2026 moet je mensen vragen je te geloven. Met die opname hoef je dat in oktober 2027 niet meer.

Twee dingen die je in je achterhoofd houdt en nu niet doet. De Nederlandse winkelvermelding dekt ook **België**, en Antwerpen en Brussel liggen per gereisde kilometer dichter dan Veenendaal — dat is de logische vierde stad, niet de tiende Nederlandse. En de **sleutelsreeks staat al bij Gumroad te koop**, hangt aan geen enkele winkelbeoordeling en is volgens `store/kanaal-sleutels.md` het enige in dit hele plan dat vandaag geld kan opleveren. Dat is geen route voor deze negentig dagen, maar als je op een avond geen energie hebt om te bellen, is het de beste plek om die avond in te stoppen.

Een laatste ding, en het is het belangrijkste. Deze week doe je tien uur. Daarna is het **vijf uur per week**: één avond bellen, één zaterdagochtend per maand, drie kwartier posten, een kwartier meten. Elk plan dat meer vraagt is een plan dat je in week drie laat vallen, en dan ligt het niet aan de route.

**Bronnen voor de data in dit plan:** [overzicht schoolvakanties 2026-2027](https://www.rijksoverheid.nl/themas/onderwijs/schoolvakanties/overzicht-schoolvakanties-per-schooljaar/overzicht-schoolvakanties-2026-2027) · [herfstvakantie 2026](https://www.rijksoverheid.nl/themas/onderwijs/schoolvakanties/herfstvakantie/herfstvakantie-2026) · [zomervakantie 2027](https://www.rijksoverheid.nl/themas/onderwijs/schoolvakanties/zomervakantie/zomervakantie-2027) · [regio's schoolvakantie](https://rijksoverheid.nl/onderwerpen/schoolvakanties/regios-schoolvakantie). De Ramadan- en Eiddata staan er met opzet niet in: die hangen van de maanwaarneming af, en die vraag je bij je eigen moskee.
