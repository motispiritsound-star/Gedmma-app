<!--
  Gemaakt op 14 oktober 2026. Vier onderzoekers verzamelden feiten over
  taalverlies tussen generaties, schermtijd en leertijd, de taal Darija zelf,
  en over wat maakt dat iemand een bericht doorstuurt. Daarna ging elk feit
  langs een feitencontroleur met de opdracht om weg te strepen, niet om goed
  te praten.

  Van de achtennegentig aangeleverde feiten zijn er drieëndertig gesneuveld.
  Die staan onderaan met de reden erbij -- dat hoofdstuk is waardevoller dan
  de voorraad zelf, want het voorkomt dat er over drie maanden alsnog een
  getal opduikt dat al een keer is afgekeurd.

  Wat hier niet staat en wel waar is: de onderzoekers konden de Nederlandse en
  Google-bronpagina's niet zelf openen -- die zijn vanuit deze omgeving
  onbereikbaar. De cijfers zijn bevestigd via zoekresultaten die de brontekst
  letterlijk citeren. Dat was genoeg om drieëndertig beweringen weg te
  strepen en het is niet genoeg voor de belofte "elk getal heeft een vindbare
  bron". Hoofdstuk 3 noemt de negen bronnen die één keer met eigen ogen open
  moeten voordat het eerste bericht met een getal de deur uitgaat.
-->

## De kanalen

| | Link |
|---|---|
| WhatsApp-kanaal Nederlands | https://whatsapp.com/channel/0029VbD7rT99Gv7NHDpzhm2S |
| WhatsApp-kanaal Frans | https://whatsapp.com/channel/0029VbDpt9XBA1exBp7PSb45 |
| App Store | https://apps.apple.com/app/id6813964474 |
| Google Play | https://play.google.com/store/apps/details?id=app.darijaforkids.learn |

Ze staan hier omdat ze onder elke post horen die buiten het kanaal zelf gaat —
een Facebookgroep weet niet wat een kanaalverwijzing is. Binnen het kanaal is
de regel een andere: doorsturen neemt de verwijzing al mee, dus daar kost een
link alleen regels. Zie §3 hieronder.


# Het kanaal, als systeem

Een voorraad en een vaste week, zodat er elke dag iets op kan zonder dat er iets bedacht of opgezocht hoeft te worden. Alles hieronder is Nederlands, gericht aan de ouder, en kort genoeg om in één oogopslag te lezen.

**Drie regels die boven alles staan.**

1. **Elk getal draagt zijn bron in het bericht.** Niet eronder in een draadje, niet in de kanaalbeschrijving: in het bericht, want zodra iemand doorstuurt valt de afzender weg en blijft alleen de tekst over. Daarom is elk bericht hieronder zo kort dat de bronregel nog zichtbaar is voordat iets inklapt.
2. **Geen namen van personen.** Niet van onderzoekers, niet van bewindspersonen, niet van familie. Een tijdschrift, een instituut, een titel en een jaartal zijn genoeg om iets terug te vinden; een naam in een doorgestuurd bericht gaat een eigen leven leiden. Daarom staat er in de voorraad nergens een naam, ook niet in de bronregels.
3. **Eén link per week, op woensdag.** De rest zonder link. Wie een post uit een kanaal doorstuurt, stuurt automatisch een verwijzing naar het kanaal mee, dus een link kost alleen regels en levert niets op. (Test dit één keer zelf: stuur een eigen post door naar een privéchat en kijk of de kanaalverwijzing meekomt.)

**Geen emoji in de voorraad hieronder.** Eén aan het begin van een bericht mag, maar kies die zelf — dan staat er niet overal dezelfde.

---

## 1. De week

De indeling uit `docs/LANCERING.md` §15 blijft zoals hij is. Dit is wat er per dag in gaat en waar het vandaan komt.

| Dag | Wat erop gaat | Waar het vandaan komt | Link |
|---|---|---|---|
| **maandag** | Eén geschiedeniskaart: de `wist`-regel, de zin die een kind aan tafel doorvertelt | `src/content/history.ts` — veertien kaarten. Plaat: `npm run weetje` | nee |
| **dinsdag** | Een kort voorleesfragment, audio met de plaat erbij | `npm run vertelstem -- --deel 1` (stemsleutel in de omgeving), plaat uit `npm run deelplaten -- --deel 1 --groot` | nee |
| **woensdag** | Iets uit de app: wat een unit is, hoe de uitspraak werkt, wat tien minuten oplevert | Schermopname of `npm run social`; woordfilmpjes uit `npm run woordjes` | **ja, één per week** |
| **donderdag** | Het weetje | De voorraad hieronder. Plaat: `npm run weetje` | nee |
| **vrijdag** | Een woord uit de keuken of van de tafel | `src/content/words.ts`, onderwerpen `eten` en `familie`; filmpje via `npm run woordjes -- --onderwerp eten` | nee |
| **zaterdag** | Eén plaat, geen woord verkoop | `npm run platenlijst`, `npm run deelplaten`, `npm run reeksplaten -- --wie sleutels` | nee |
| **zondag** | Het langere voorleesfragment | `npm run vertelstem -- --deel 1` voor een heel deel; vijftien delen beschikbaar | nee |

De plaat bij een weetje maak je met één regel, en die regel zoekt zelf de projectmap:

```powershell
if (-not $p) { $p = (Get-ChildItem $HOME -Recurse -Depth 5 -Filter darija-kids -Directory -ErrorAction SilentlyContinue | Select-Object -First 1).FullName }; npm --prefix $p run weetje -- --kop "Wist je dat" --groot "3" --regel "In 3afak en ma3lish staat de 3" --regel "voor de Arabische letter ayn" --voet "Darijaforkids" --naam "drie"
```

**Waarom donderdag de meeste voorraad krijgt.** Maandag, dinsdag, zaterdag en zondag maakt de app zelf: veertien kaarten, vijftien delen met verteller, honderdzestig platen. Die dagen raken niet leeg. Donderdag is de enige dag waarvoor niets klaarligt, en dus de enige dag waarop iets verzonnen zou worden. Daar zit hieronder vijf maanden in.

**En de woensdag is nu een reeks.** Zeven films van vijftien seconden, elk met
twee schermen uit de echte app -- geen montage van losse schermafdrukken maar
de app die bediend wordt, met zijn eigen geluiden eronder. Eén per week, in
deze volgorde. Na zeven weken is de hele app langsgekomen en begint hij opnieuw;
tegen die tijd zit er ander publiek in de groepen.

| # | Opdracht | Wat erin zit | Waarom hij daar staat |
|---|---|---|---|
| 1 | `npm run weetjefilm` | Geschiedeniskaart na een toets, daarna het geheugenspel | Begint met wat niemand verwacht: er zit geschiedenis in |
| 2 | `npm run bonusfilm` | Schrijven met je vinger, jezelf opnemen | De twee dingen die je bij de concurrent niet vindt |
| 3 | `npm run speelfilm` | Geheugenspel en een verhaal | Voor wie na twee weken nog twijfelt: het is geen huiswerk |
| 4 | `npm run alfabetfilm` | Het alfabet, letter voor letter, en een woord | Haalt de drempel weg waar ouders over beginnen |
| 5 | `npm run routefilm` | De route van zeventien units, en een les van binnen | Het antwoord op "en wat krijg je er dan voor" |
| 6 | `npm run onthoudfilm` | Het herhaalscherm en de dagopdracht | De enige die aan de ouder uitlegt waar het geld heen gaat |
| 7 | `npm run verzamelfilm` | De kaartenplank met twaalf sloten, en het tijdspel | Sluit de kring: deel 1 liet één kaart zien, dit laat zien hoeveel er nog zijn |

**En er is er een achtste, die niet in de reeks hoort.** `npm run leerpadfilm`
loopt de hele route af: zeventien schermen, een per unit, met de ondertitel van
die unit en drie echte woorden eruit. Vijfendertig seconden, dus te lang voor
de winkel en te lang voor een terloopse post -- maar het is het antwoord op de
vraag die in elke groep terugkomt: *"en wat leert mijn kind er dan precies?"*
Bewaar hem daarvoor, en voor de dag dat iemand zegt dat het "maar een
woordjes-app" is.

De schermen en de teksten komen uit `curriculum.ts`, niet uit een lijst die
hier is overgetypt. Komt er een unit bij, dan groeit de film mee.

Elke opdracht zet zes talen klaar in twee vormen: `verhaal` (9:16, voor een
status en een kanaal) en `vierkant` (1:1, voor een tijdlijn). Ze staan in
`store/video/<taal>/<film>-<vorm>.mp4`, buiten de repository.

Eén film, in één regel, met de projectmap erbij gezocht:

```powershell
if (-not $p) { $p = (Get-ChildItem $HOME -Recurse -Depth 5 -Filter darija-kids -Directory -ErrorAction SilentlyContinue | Select-Object -First 1).FullName }; npm --prefix $p run alfabetfilm
```

**Kijk er één na voordat je hem deelt.** De films worden gemaakt door de app
echt te bedienen, en dat kan stilletjes misgaan: in oktober stonden er twaalf
dichte kaartjes onder het bijschrift "en ondertussen leer je woorden", omdat de
sluiter precies samenviel met het moment waarop het geheugenspel een fout paar
weer dichtklapt. De film kwam er gewoon uit. Dat is nu afgevangen met een
controle in `scripts/make-intro.mjs`, maar een blik op het beeld blijft
goedkoper dan een post terugtrekken.

---

## 2. De voorraad

Vierendertig berichten, om letterlijk te plakken.

### 1 · maandag · geen link

```
De naam van het land komt van één stad.

Maroc, Marruecos, Marokko — alle drie van Marrakech. Europa noemde
het hele land naar de stad waar de hoofdstad lag.

Geschiedeniskaart "Marrakech en de naam van het land", uit Darijaforkids.
```

### 2 · maandag · geen link

```
De letter die je overal in Marokko ziet staan, heeft een naam: yaz.

Hij komt uit het Tifinagh, het eigen alfabet van het Amazigh. En
Amazigh betekent: vrij mens.

Geschiedeniskaart "Tamazight, zwart op wit", uit Darijaforkids.
Bron bij het jaartal: grondwet van Marokko (2011), artikel 5.
```

### 3 · maandag · geen link

```
De ster in de vlag is één doorlopende lijn.

Je tilt je pen niet op. De lijn kruist zichzelf vijf keer en komt
weer uit waar hij begon. Hij heet de khatim: het zegel.

Geschiedeniskaart "Onafhankelijk", uit Darijaforkids.
```

### 4 · maandag · geen link

```
In de oude binnenstad van Fes mag geen auto komen.

Alles gaat te voet of met een ezel. Het is een van de grootste
autovrije gebieden ter wereld — en mensen wonen er gewoon.

Geschiedeniskaart "Fes wordt een stad", uit Darijaforkids.
```

### 5 · maandag · geen link

```
Het nationale elftal heet naar een leeuw die in de bergen leefde.

De Atlasleeuw was de enige leeuwensoort die niet op de savanne
woonde. In het wild is hij verdwenen; nakomelingen leven nog in de
dierentuin van Rabat.

Geschiedeniskaart "De leeuw van de Atlas", uit Darijaforkids.
```

### 6 · dinsdag · geen link

*Bij de audio van deel 1 en de plaat erbij.*

```
Twee minuten voorlezen, voor vanavond.

Dit is het begin van Sba. Je hoeft het niet zelf voor te lezen —
de stem doet het, jij zit ernaast.

Uit Darijaforkids. Vijftien delen, allemaal ingesproken.
```

### 7 · dinsdag · geen link

*Bij een fragment uit De sleutels.*

```
Hij hoeft het niet te begrijpen om het te horen.

Dit is een stukje uit De sleutels. Zet het op terwijl hij iets
anders doet. De klank komt binnen voordat de woorden dat doen.

Uit Darijaforkids.
```

### 8 · dinsdag · geen link

*Bij een fragment met de plaat van het deel erbij.*

```
Eén stem, van begin tot eind.

Alles in de app is ingesproken door een Marokkaanse stem — geen
computer die het probeert. Dat is waarom een kind de klank
onthoudt in plaats van alleen het woord.

Uit Darijaforkids: 432 opnames in totaal.
```

### 9 · woensdag · link mag

```
Tien minuten vandaag is meer dan twintig minuten vanavond.

Bij 39 Amerikaanse basisschoolkinderen werden woorden veel beter
onthouden als de tweede les ongeveer een week later kwam in plaats
van direct erna — vijf weken later nog.

Bron: Applied Cognitive Psychology, 2011. Engelse woorden, Engelstalige
kinderen. De app is daarop gebouwd: kort, en dan weer terug.
```

### 10 · woensdag · link mag

```
Tien minuten per dag, elke dag, is 3.650 minuten per jaar.
Ruim zestig uur.

Kinderen van nul tot zes zitten volgens hun ouders gemiddeld 102
minuten per dag achter een scherm. Tien minuten is daar een tiende
van. Geen oordeel over die 102 — dit is alleen de rekensom.

Bron van de 102: Iene Miene Media-onderzoek 2026, Netwerk Mediawijsheid,
1.017 ouders. De rest is vermenigvuldigen.
```

### 11 · woensdag · link mag

```
Waarom er drie seconden niets gebeurt.

Je hoort het woord. Dan blijft het stil. Pas daarna komt de
betekenis in beeld. Wie de betekenis meteen ziet, luistert niet
meer — en dan heb je een plaatje gezien in plaats van een woord
geleerd.

Zo zijn alle woordjes in Darijaforkids gemaakt.
```

### 12 · woensdag · link mag

```
304 woorden, 100 zinnen, 28 letters. Allemaal ingesproken.

432 opnames van dezelfde Marokkaanse stem. Niet omdat het mooi
staat, maar omdat een kind een klank naleert die het hoort — en
een verkeerd ingesproken letter leer je verkeerd.

Uit Darijaforkids. Zelf te tellen in de app.
```

### 13 · woensdag · link mag

```
Wat het verschil maakt, is niet talent.

In onderzoek naar tweetalig opgroeien bleek de hoeveelheid taal
die een kind hoort de sterkste invloed op of het die taal gaat
leren. En kinderen van ouders die dagelijks iets in de taal
plánden, leerden hem.

Bron: Applied Psycholinguistics 28(3), 2007.
```

### 14 · donderdag · geen link

```
Darija staat niet in de grondwet.

Artikel 5 van de Marokkaanse grondwet noemt drie talen bij naam:
Arabisch en Amazigh als officiële talen, en Hassani als iets dat
bewaard moet worden. De taal die 91,9 procent van de Marokkanen
dagelijks gebruikt, staat er alleen als "de parlers die in
Marokko gesproken worden". Zonder naam.

Bronnen: grondwet van Marokko (2011), artikel 5; volkstelling 2024
(Haut-Commissariat au Plan).
```

### 15 · donderdag · geen link

```
Die 3 in 3afak is geen cijfer.

Het is de Arabische letter ayn, waar het Latijnse alfabet geen
teken voor heeft. Zo is de 7 de ha en de 9 de qaf. Jongeren
begonnen hiermee in de jaren negentig, toen telefoons geen
Arabisch schrift konden weergeven.

Bron: tijdschrift Design Issues 24(2), MIT Press, 2008.
```

### 16 · donderdag · geen link

```
Zes letters zitten nooit vast aan de volgende.

ا د ذ ر ز و — na een van deze zes begint het volgende stuk los.
Daarom kan een Arabisch woord in het midden afbreken zonder dat
het twee woorden zijn. Dit is meestal het moment waarop het gaat
klikken.

Uit het alfabet van Darijaforkids: achtentwintig letters, in de
volgorde waarin ze op elkaar lijken.
```

### 17 · donderdag · geen link

```
Je telefoon kan Tifinagh al twintig jaar weergeven.

Op 31 maart 2005 kreeg het Amazigh-schrift zijn plek in de
internationale tekenstandaard. En sinds 27 juni 2024 staat
Tamazight in Google Translate, in Latijns schrift én in Tifinagh.

Bronnen: Unicode 4.1.0 (31 maart 2005); aankondiging Google Translate,
27 juni 2024.
```

### 18 · donderdag · geen link

```
De taal van thuis is een taal die je hoort, niet een taal die je leest.

Van de Marokkanen vanaf tien jaar die kunnen lezen en schrijven,
kan 99,2 procent dat in het Arabisch, 57,7 procent in het Frans en
20,5 procent in het Engels. In het Amazigh, in Tifinagh-schrift:
1,5 procent.

Bron: volkstelling Marokko 2024 (Haut-Commissariat au Plan).
```

### 19 · donderdag · geen link

```
Marokko heeft niet één taal.

In de volkstelling van 2024 gebruikt 91,9 procent van de
Marokkanen Darija in het dagelijks leven, en 24,8 procent een
Amazigh-variant: Tachelhit 14,2, Tamazight 7,4, Tarifit 3,2.

De telling vraagt naar dagelijks gebruik, niet naar wie de taal
kan spreken. Amazigh-organisaties vinden dat daardoor te laag
geteld wordt.

Bron: volkstelling Marokko 2024 (Haut-Commissariat au Plan).
```

### 20 · donderdag · geen link

```
Er is een letter die het Arabisch niet heeft en Darija wel.

Voor de g van leenwoorden schrijven Marokkanen ݣ — zoals in
ݣناوة, Gnawa. Dezelfde truc bestaat voor de p en de v. Je vindt
ze op posters en in berichten, niet in het alfabet.

Uit het alfabet van Darijaforkids, dat de achtentwintig letters leert
waarmee je ze kunt lezen.
```

### 21 · donderdag · geen link

```
Darija schrijven is nieuwer dan je denkt.

Vooral sinds de jaren 2000 komt het in kranten, reclames,
liedteksten en romans. In september 2018 was er landelijke
opschudding toen er in schoolboeken drie woorden voor gebak
stonden: ghriyba, baghrir, briouat.

Bronnen: International Journal of Middle East Studies 45(4), 2013;
Marokkaanse pers, september 2018.
```

### 22 · donderdag · geen link

```
Het hoeft niet te kiezen.

De Onderwijsraad bracht op 4 september 2025 een advies uit over
meertaligheid op school. De kern: meer ruimte voor andere
thuistalen gaat niet ten koste van de Nederlandse taalvaardigheid,
en thuistalen kunnen leerlingen juist helpen. Nederlands blijft
de instructietaal.

Bron: Onderwijsraad, advies "Talige diversiteit benutten",
4 september 2025.
```

### 23 · donderdag · geen link

```
Alleen de taal om zich heen horen deed al bijna alles.

72 Amerikaanse kinderen van vier tot zes speelden een spel waarin
ze moesten raden wat een volwassene bedoelde. De eentalige groep
had het ongeveer de helft van de keren goed. De tweetalige groep
77 procent. De groep die de tweede taal alleen om zich heen
hoorde: 76 procent.

Bron: Psychological Science 26(7), 2015. Een communicatiespel, geen
taaltoets.
```

### 24 · donderdag · geen link

```
Daarom klinkt het Tamazight van school niet als thuis.

De standaardvorm die in Marokko op school wordt gegeven, is
samengesteld uit drie varianten: Tachelhit, Centraal-Atlas-
Tamazight en Tarifit. Het is een gebouwde standaard. Niemands
thuistaal is het precies.

Bron: taalbeleidsonderzoek naar de standaardisering van het Amazigh
in Marokko (Universiteit Leiden).
```

### 25 · donderdag · geen link

```
Er zit Amazigh in de botten van Darija.

Niet alleen losse woorden: Darija nam ook grammatica over. Het
Amazigh-patroon ta-...-t werd als één geheel overgenomen om
abstracte woorden en beroepsnamen te maken. Een klankregel delen
de twee talen.

Bron: International Journal of Arabic Linguistics, 2018.
```

### 26 · donderdag · geen link

```
Darija is niet half Frans.

Onderzoekers legden de Darija-woordenschat naast een
woordenbanknetwerk en vonden 42,0 procent overlap met het
Arabisch, 2,8 procent met het Frans en 2,2 procent met het
Spaans.

Bron: Global WordNet Conference 2018, "Putting Figures on Influences
on Moroccan Darija".
```

### 27 · donderdag · geen link

```
Darija heeft geen officiële spelling. Maar wel een woordenboek.

Tussen 1993 en 1997 verscheen het Dictionnaire Colin d'arabe
dialectal marocain in meerdere delen, in Rabat en Parijs. Opgebouwd
uit een levenslange verzameling fiches van gesproken Marokkaans.

Bron: Dictionnaire Colin d'arabe dialectal marocain, Al Manahil,
Rabat, 1993-1997.
```

### 28 · donderdag · geen link · in januari

```
14 januari is in Marokko een vrije dag.

Yennayer, het Amazigh-nieuwjaar, is sinds 2024 een officiële
betaalde nationale feestdag — op dezelfde voet als 1 januari en
de eerste dag van het islamitische jaar.

Bron: Marokkaanse regeringsbesluiten van 2023; voor het eerst vrij
op 14 januari 2024.
```

### 29 · donderdag · geen link

```
Marokko wil Amazigh op elke basisschool.

Het plan loopt tot schooljaar 2029/2030: ongeveer 12.000 scholen
en 4 miljoen leerlingen. In januari 2024 gaf 31 procent van de
basisscholen het vak.

Bron: Marokkaans ministerie van Nationale Opvoeding, cijfers
januari 2024.
```

### 30 · donderdag · geen link

```
Het gaat niet in één generatie weg. Het gaat in één generatie weg.

Van de migranten die zelf naar Nederland kwamen spreekt 44 procent
thuis vooral een andere taal dan het Nederlands. Bij hun in
Nederland geboren kinderen is dat 16 procent. Bij mensen zonder
migratieachtergrond 1 procent.

Dit gaat over alle herkomstlanden samen, niet over Marokkaanse
gezinnen apart.

Bron: CBS, Statistische Trends "Talen en dialecten in Nederland"
(2021), op cijfers uit 2019.
```

### 31 · donderdag · geen link

```
Je bent niet de uitzondering. Je bent de meerderheid.

In Nederland leven ruim 420.000 mensen met een Marokkaanse
herkomst, en bijna zes op de tien van hen zijn hier geboren.
Hier geboren, en de taal van huis niet van de straat gekregen.

Bron: CBS, Rapportage Integratie en samenleven 2024.
```

### 32 · donderdag · geen link

```
Een paar woorden is niet hetzelfde als kunnen praten.

Bij 414 jongeren uit migrantengezinnen hing de bánd met hun
ouders samen met hoe goed ze de taal van thuis beheersten — niet
met of ze die taal af en toe gebruikten.

Bron: Social Development 19(1), 2010. Amerikaans onderzoek onder
jongeren met een Latijns-Amerikaanse en Aziatische achtergrond,
niet onder Marokkaanse gezinnen in Nederland.
```

### 33 · donderdag · geen link

```
De band maakt de taal, niet de taal de band.

In een onderzoek onder ruim 620 jongeren uit migrantengezinnen
spraken gezinnen met een hechtere band vaker dezelfde taal. Over
twee jaar gemeten bleek de band het latere taalgebruik te
voorspellen — niet omgekeerd.

Bron: Journal of Marriage and Family 62(2), 2000. Amerikaans
onderzoek, niet onder Marokkaanse gezinnen.
```

### 34 · donderdag · geen link

```
Het kind raakte de taal niet kwijt omdat er thuis te weinig was.

In 2012 bleek uit onderzoek van de universiteiten Antwerpen, Gent
en Leuven onder ruim 11.000 scholieren dat 65 procent van de
leerlingen met een andere thuistaal die taal nóóit op school
gebruikte. Bij leerlingen van Turkse en Marokkaanse afkomst was
dat 80 procent.

Bron: onderzoek van de universiteiten Antwerpen, Gent en Leuven,
2012. Vlaanderen, en het is veertien jaar oud: zo was het toen.
```

### 35 · vrijdag · geen link

```
كسكسو — kesksu — couscous

Op vrijdag, na het gebed. Als er één woord is dat een kind koppelt
aan een dag van de week, is het dit.

Uit de woordenlijst van Darijaforkids, ingesproken.
```

### 36 · vrijdag · geen link

```
أتاي — atay — muntthee

Niet "thee". Atay is wat er gebeurt als er iemand langskomt. Zeg
het vanavond één keer hardop aan tafel; hij zegt het terug zonder
dat je het vraagt.

Uit de woordenlijst van Darijaforkids, ingesproken.
```

### 37 · vrijdag · geen link

```
Het valkuilwoord van de week.

ليمون — limun — dat is de sinaasappel.
حامض — hamd — dat is de citroen.

Bijna iedereen die het terugleert, heeft ze een keer omgedraaid.

Uit de woordenlijst van Darijaforkids.
```

### 38 · vrijdag · geen link

```
خبز — khobz — brood

In Marokko eet je bijna alles met khobz. Het is geen bijgerecht,
het is het bestek.

Uit de woordenlijst van Darijaforkids, ingesproken.
```

### 39 · zaterdag · geen link

*Bij één plaat, zonder meer.*

```
Zaterdag. Verder niets.
```

### 40 · zaterdag · geen link

*Bij een plaat uit een van de delen.*

```
Uit deel 4.
```

### 41 · zondag · geen link

*Bij het lange fragment.*

```
Vijfentwintig minuten, als je ze hebt.

Kinderen van nul tot zes brengen per dag gemiddeld 25 minuten met
(voor)lezen door, en bij driekwart zit er een ouder naast. Dit
fragment duurt korter dan dat.

Bron: Leesmonitor, september 2026 (Stichting Lezen).
```

### 42 · zondag · geen link

```
Tien minuten is niet de ambitieuze variant.

Van de ouders van kinderen tot twaalf jaar leest 44 procent per
dag tussen nul en tien minuten voor. Langer dan een half uur:
ongeveer 4 procent. Tien minuten is dus niet iets nieuws dat je
erbij moet doen. Het is de maat die je al hebt.

Bron: Leesmonitor, september 2026 (Stichting Lezen).
```

### 43 · zondag · geen link

```
Je had een reden. Dat is het hele verhaal.

Van de opvoeders zet 72 procent digitale media in om hun kind een
moment voor zichzelf te geven, en 67 procent om zelf even iets te
kunnen doen. Dat is geen falen, dat is de meerderheid.

Bron: Iene Miene Media-onderzoek 2026, Netwerk Mediawijsheid,
1.017 ouders.
```

### 44 · zondag · geen link

```
Samen tv kijken doen we wel. Samen op de tablet niet.

Twee derde van de ouders kijkt regelmatig samen televisie met hun
kind; samen filmpjes kijken of gamen op telefoon of tablet gebeurt
veel minder vaak. Taal doorgeven lukt op de eerste manier.

Bron: Iene Miene Media-onderzoek, editie 2025, Netwerk Mediawijsheid.
```

---

## 3. Eerst natrekken, één keer per getal

Alles hierboven is nagelopen door twee rondes, maar beide rondes zaten achter een netwerkblokkade: de bronnen zijn geverifieerd via zoekresultaten die de brontekst letterlijk citeren, niet door de pagina zelf te openen. Dat is genoeg om twaalf andere beweringen weg te strepen, en niet genoeg voor de belofte "elk getal heeft een vindbare bron".

Dus: **open deze negen bronnen één keer, voordat het bericht de eerste keer de deur uitgaat.** Daarna nooit meer.

| Getal | Waar je het natrekt |
|---|---|
| 102 minuten, 72 en 67 procent | netwerkmediawijsheid.nl → onderzoek → Iene Miene Media 2026 |
| 25 minuten, 44 procent | lezen.nl → onderzoek (Leesmonitor, september 2026) |
| 44 / 16 / 1 procent | cbs.nl → Statistische Trends, "Talen en dialecten in Nederland" (2021). Let op: er is nieuwer werk op dezelfde cijfers; kijk of het is bijgesteld |
| ruim 420.000 | longreads.cbs.nl → Integratie en samenleven 2024 |
| advies van 4 september 2025 | onderwijsraad.nl → "Talige diversiteit benutten" |
| 91,9 / 24,8 / 14,2 / 7,4 / 3,2 | hcp.ma → RGPH 2024 (en de persnota van december 2024) |
| 99,2 / 57,7 / 20,5 / 1,5 | zelfde volkstellingsnota |
| artikel 5 | de grondwettekst zelf (Bulletin Officiel, of constituteproject.org) |
| 50 / 76 / 77 procent | Psychological Science 26(7), 2015, "The Exposure Advantage" |

En de drie dingen die je in de app zelf meet in plaats van gelooft: waar WhatsApp een bericht inklapt, of een doorgestuurde post de kanaalverwijzing meeneemt, en of jij als eigenaar individuele poll-stemmen kunt zien. Maak een testkanaal, volg het met een tweede telefoon, en je weet het in een half uur. Dat is beter dan welk cijfer van een blog ook.

---

## 4. Tarifit

Een flink deel van de ouders in dit publiek spreekt thuis geen Darija maar Tarifit, of een andere Amazigh-taal. Dat is geen randgeval en geen voetnoot: het is precies het deel van de lezers dat zich al nergens in terugziet, en dat afhaakt bij het eerste bericht dat doet alsof "de Marokkaanse taal" bestaat.

**Vier regels.**

1. **Nooit "de Marokkaanse taal", nooit "Marokkaans".** Schrijf Darija als je Darija bedoelt, en "de taal van thuis" als je het over de taal van de lezer hebt. Die tweede formulering is de enige die voor iedereen in het publiek klopt.
2. **Zeg wat de app is.** Darijaforkids leert Darija. Dat staat in de naam en dat is eerlijk. Als iemand vraagt waarom er geen Tarifit in zit, is het antwoord niet "dat komt later ook" maar: *Deze app leert Darija. Tarifit is een andere taal, met een eigen schrift en een eigen klank — dat verdient een eigen app, geen hoekje in deze.* Dat is een antwoord waar een Riffijnse ouder niets aan hoeft te slikken.
3. **Zet Amazigh náást Darija met officiële cijfers, niet met een gevoel.** De Marokkaanse volkstelling van 2024 splitst de varianten wél uit, en dat is het enige harde materiaal dat er is (bericht 19 en 24). Twee dingen moeten er altijd bij: dat de telling naar *dagelijks gebruik* vraagt en niet naar wie de taal kan spreken, en dat Amazigh-organisaties in Marokko vinden dat die methode te laag telt. Dat kost één regel en het voorkomt dat je een betwist cijfer als waarheid verkoopt aan juist de lezers die het aangaat.
4. **Geef het Amazigh zijn eigen goede berichten.** Niet als compensatie, maar omdat ze de sterkste van de voorraad zijn: de grondwet die Amazigh "gemeenschappelijk erfgoed van alle Marokkanen zonder uitzondering" noemt, Tifinagh dat al twintig jaar in elke telefoon zit, Yennayer als vrije dag, de yaz-letter, en de uitleg waarom het Tamazight van school niet klinkt als thuis. Berichten 2, 17, 19, 24, 28 en 29.

**En wat er niet mag.** Er bestaat geen betrouwbaar cijfer voor hoeveel Marokkaanse Nederlanders uit het Rifgebied komen of thuis Tarifit spreken. De schattingen die rondgaan lopen van 50 tot 86 procent, geen daarvan heeft een vindbare bron, en een taalkundige van de Universiteit Leiden zegt zelf dat het niet te achterhalen is. Dat getal is dus verboden terrein, hoe graag je het ook zou willen hebben — en je wilt het graag, want het is precies het cijfer waarmee je je publiek zou kunnen laten zien dat je ze gezien hebt. Doe het met taal in plaats van met een percentage.

---

## 5. Nooit posten

**Een getal over hoeveel Marokkaans-Nederlandse kinderen geen Darija spreken.** Dat getal bestaat niet. Niet bij het CBS, niet bij het SCP, niet bij een universiteit; het CBS zet "Marokkaans Arabisch/Berbers" in één categorie en splitst die niet naar taal, leeftijd of generatie. Elk getal dat je hierover post, is verzonnen — ook als het ergens op internet staat. Dit is het ene bericht dat de geloofwaardigheid van het kanaal in één keer opmaakt, en het is het bericht dat je het liefst zou willen posten. Het eerlijke alternatief is bericht 30, met de verplichte regel dat het over alle herkomstlanden samen gaat.

**Moraliseren over schermtijd.** Dus: de 102 minuten niet brengen als "te veel" — het Trimbos-instituut noemt het zelf een ondergrens, want opvang, school en familie zijn niet meegeteld, en een verwijt over een cijfer dat zijn eigen bron onzeker noemt is dubbel kwetsbaar. En **de officiële leeftijdsladder van de Richtlijn Gezond Schermgebruik hoort hier niet op** (geen schermtijd onder de 2, 30 minuten voor 2-4, en zo verder). Het is een echt en bruikbaar advies, maar als dagelijks bericht aan een ouder is het een meetlat, en een ouder met een meetlat tegen zijn hoofd deelt niets — hij legt zijn telefoon weg. Schermtijd komt hier alleen voor als noemer van een rekensom (bericht 10) of als ontlasting (bericht 43).

**Een slachtofferverhaal over taalverlies.** Niet uit smaak, maar omdat het aantoonbaar niet werkt: in het onderzoek naar wat mensen doorsturen wordt inhoud die verdriet oproept juist mínder gedeeld, en positieve inhoud vaker (Journal of Marketing Research, 2012). "Kijk wat deze taal kan" wordt doorgestuurd, "kijk wat we kwijtraken" blijft staan. En de ouder weet het al.

**Deze cijfers, die allemaal nagetrokken zijn en allemaal zijn afgevallen.** Ze circuleren, dus iemand zal ze aandragen:

- "Een kind heeft 20 tot 25 procent van zijn taalaanbod in een taal nodig." Staat in geen enkele primaire bron. Wordt op internet toegeschreven aan een onderzoek uit 2007 dat het niet zegt.
- "Tien minuten per dag is genoeg om Darija te behouden." Niet onderzocht. Er bestaat geen wetenschappelijke ondergrens voor taalbehoud. Je mag zeggen dat tien minuten meer is dan nul en dat gespreid beter blijft zitten dan geblokt. Niet meer.
- "De eerste duizend woorden dekken 81 tot 84 procent van de taal." Verkeerde getallen (de bron geeft 80,88 procent voor een roman en 7,21 procent voor de tweede duizend), en het gaat over Engels.
- "34 uur op een app is een eerste semester Spaans." Betaald door de app-aanbieder, niet peer-reviewed, en dezelfde onderzoekers komen voor een andere app op heel andere getallen.
- "Darija bestaat voor 77,63 procent uit Standaardarabisch en 11,72 procent uit Frans." De auteurs die het doorgeven nemen er zelf afstand van. Gebruik bericht 26.
- "Ongeveer 70 procent van de Marokkanen in West-Europa spreekt Tarifit" / "31,1 procent in de regio Oriental". Niet te tellen, zie hierboven.
- "Tifinagh wordt door 20 miljoen mensen gebruikt." Staat niet in de Unicode-stukken en botst met de volkstelling.
- "80,6 procent heeft Arabisch als moedertaal, 18,9 procent Tamazight." Een tweede stel percentages op een ándere maat dan bericht 19. Twee maten naast elkaar in een kanaal waar berichten los worden doorgestuurd, wordt één keer verkeerd samengevat — en dan is de fout van jou.
- Exacte CBS-aantallen met honderdtallen (429.200, 157.200) en exacte decimalen (44,2 / 15,8). Post de afgeronde vorm.
- Een decreetnummer, een zaalnummer, een paginanummer dat je niet zelf hebt gezien.

**Verder niet posten:**

- **Woede of schok als motor.** Woede deelt van alles het hardst (+34 procent in hetzelfde onderzoek uit 2012). Het werkt, en het verbrandt het vertrouwen van een gemeenschap die elkaar kent. Dat is geen ruil die je één keer kunt maken.
- **Namen van personen.** Geen bewindspersonen, geen onderzoekers, geen citaten uit de mond van iemand die bestaat. Een doorgestuurd bericht met een naam erin wordt een bericht óver die persoon.
- **Foto's van schoolboekpagina's** bij bericht 21. In diezelfde rel circuleerden nepfoto's. Houd het bij de woorden.
- **Een getal in een spraakbericht.** Een stem die Darija spreekt is het mooiste wat dit kanaal kan; een cijfer in een spraakbericht is niet na te trekken en niet terug te scrollen. Stem voor klank, tekst voor feiten.
- **Een link in een weetje.** Doorsturen neemt de kanaalverwijzing al mee, dus de link kost regels en levert niets.
- **"Officiële cijfers" zeggen over schermtijd.** Dat is het niet: het is een enquête onder ouders. Zeg "volgens hun ouders".
- **Waar is, maar hier niet op zijn plaats:** het onderzoek dat zegt dat een immigrantentaal bij de derde generatie verdwijnt (Population and Development Review, 2006). Het klopt, het is Mexicaans-Amerikaans, en het is een doodsbericht. Zijn kind ís de derde generatie. Dat weet hij.

---

## 6. Een nieuwe maken

Als de voorraad op is, is dit het recept. Zeven stappen, en de laatste is de belangrijkste.

**1. Kijk welke dag het is.** De dag bepaalt de vorm, dus je zoekt niet naar "een leuk feit" maar naar één ding voor één dag.

**2. Haal het uit een van drie potten, en nergens anders.**

- **De app zelf.** Altijd veilig, want je kunt het natrekken in je eigen bestanden: `src/content/history.ts` (veertien kaarten), `src/content/words.ts` (304 woorden met schrift, klank en betekenis), `src/content/alphabet.ts` (achtentwintig letters, de zes die niet verbinden, de leesvolgorde), `src/content/sleutels-deel1.ts` tot `-deel15.ts`, `src/content/prentenboek.ts`, `src/audio/` (304 + 100 + 28 opnames). Hier hoeft nooit iets verzonnen te worden en hier kan nooit iets fout zijn.
- **Officiële statistiek.** cbs.nl en longreads.cbs.nl, onderwijsraad.nl, hcp.ma (de Marokkaanse volkstelling), vlaanderen.be/statistiek-vlaanderen, unicode.org/versions, de grondwettekst in het Bulletin Officiel.
- **Onderzoek dat is nagekeken door vakgenoten.** aclanthology.org (taaltechnologie, Darija), Cambridge Core, journals.sagepub.com, Psychological Science, Applied Psycholinguistics. En voor onderzoek dat elke dag in de app zit: netwerkmediawijsheid.nl/onderzoek, lezen.nl/onderzoek, trimbos.nl.

Voor Marokkaans nieuws: telquel.ma, hespress.com, aujourdhui.ma, yabiladi.com, moroccoworldnews.com. Eén nieuwsbron is niet genoeg; twee onafhankelijke die hetzelfde getal met dezelfde bron noemen wel.

**3. Open de pagina.** Een zoekresultaat dat de bron citeert is een aanwijzing, geen bron. Zie hoofdstuk 3: dat onderscheid heeft in de controle twaalf beweringen gekost.

**4. Loop deze vijf vragen af.** Dit is waar bijna alles op sneuvelt — niet op het getal, maar op de zin eromheen.

- *Waar gaat het precies over?* Nederland, België, Marokko, de Verenigde Staten of "migranten in Europa" zijn vijf verschillende dingen. Zeg welke je hebt. Bij Amerikaans onderzoek staat er altijd bij dat het niet over Marokkaanse gezinnen in Nederland gaat.
- *Wat is er gemeten?* Dagelijks gebruik is niet hetzelfde als kunnen spreken. Moedertaal is niet hetzelfde als thuistaal. Nationaliteit is niet hetzelfde als herkomst. Een band is niet hetzelfde als een oorzaak.
- *Wat is de noemer?* "1,5 procent van de bevolking" bleek "1,5 procent van de mensen vanaf tien jaar die kunnen lezen en schrijven". "12 procent" bleek 12 procent van de inwoners met een buitenlandse eerste nationaliteit, niet van België. Een percentage zonder noemer is een halve bewering.
- *Welk jaar?* Zet het in de tekst, en in de verleden tijd als het oud is. Twee cijfers uit twee jaren naast elkaar zetten is geen vergelijking.
- *Is dit de aanwerving van één jaar, de stand, of het doel?* "Slechts 400 leraren" bleek de aanwerving van één jaar uit een stijgende reeks. Dat is hoe een feit in zijn tegendeel verandert zonder dat er een cijfer verkeerd staat.

**5. Schrijf vier regels.** Eerste regel het punt of het getal. Dan twee regels uitleg. Dan de bronregel: instituut of tijdschrift, titel, jaartal. Geen aanloop, geen "wist je dat er iets interessants is", geen naam van een persoon. Als het niet in vier regels past, is het geen weetje maar een artikel.

**6. De natrek-test.** Stel je voor dat een neef in de familiegroep de bron opent terwijl het bericht nog rondgaat. Vindt hij hetzelfde getal, met dezelfde noemer, over hetzelfde land? Zo niet: weg. Niet afzwakken, weg. Dit kanaal wordt gelezen door mensen die elkaar kennen, en één cijfer dat niet klopt kost meer dan honderd goede berichten opleveren.

**7. Maak de plaat** met `npm run weetje` (de regel staat in hoofdstuk 1) en zet het bericht in de voorraad met een dag erboven. Een weetje dat je op donderdag moet bedenken, wordt een weetje dat je op donderdag opzoekt — en dat is precies hoe een verzonnen getal in een kanaal komt.

**Nog open, als je ooit een ronde met open internet doet.** Diglossie: waarom Standaardarabisch leren je kind nog steeds geen gesprek met oma geeft. Dat is inhoudelijk het beste weetje dat dit kanaal kan hebben en er is nog geen citeerbare bron voor gevonden. Begin bij het handboek over de Arabische taal van Versteegh of bij het oorspronkelijke artikel over diglossie uit 1959. En: concrete etymologieën van woorden die iedereen herkent (mika, sarout, tomobil). Dat is het meest doorgestuurde materiaal dat er bestaat, en de enige bronnen die opdoken waren lijstjes op nieuwssites zonder verantwoording. De plek om te beginnen is het Dictionnaire Colin.

---

## 7. Wat is afgekeurd, en waarom

Zodat het hier blijft liggen en niet over drie maanden alsnog ergens vandaan komt. Van de 98 feiten die vier rondes aanleverden, zijn deze gesneuveld.

### Over taal en generaties

| Afgekeurd | Waarom |
|---|---|
| 157.200 van de 164.200 Marokkaans-Nederlandse jongeren is hier geboren, "ruim 96 procent" | Het cijfer is nergens terug te vinden, én de rekensom is mis: 157.200 van 164.200 is 95,7 procent. Een onvindbaar getal met een verkeerd afgeleid percentage erbovenop. |
| "Ongeveer 9 procent van de Nederlanders spreekt thuis een andere taal, en het CBS noemt Arabisch en Berbers apart" | De getallen niet te bevestigen, en de strekking is onjuist: het CBS gebruikt juist één samengevoegde categorie "Marokkaans Arabisch/Berbers". Als erkenning voor de Tarifit-lezer gepost, beloof je iets wat de bron niet doet. |
| Volkstelling 2024: 80,6 procent Arabisch en 18,9 procent Tamazight als moedertaal | Niet te vinden, de bronverwijzing was een afgebroken deelknop, en de volkstelling meet geen moedertaal maar dagelijks gebruik. |
| 31,1 procent Tarifit in de regio Oriental | Een Engelstalige nieuwssite die de volkstelling navertelt, met een verkeerd jaartal. Vervangen door het bevestigde landelijke cijfer in bericht 19. |
| 5 procent van de vierde generatie Mexicaanse Amerikanen spreekt nog goed Spaans | Een universiteitspersbericht dat een tijdschriftartikel navertelt dat onderzoek uit 2006 navertelt. Een gerucht met een getal erin. |
| CBS 2024 over netwerk en leesvaardigheid | De bevinding niet te bevestigen, en tweesnijdend: de eerste helft landt als verwijt. Een cijfer waarvan je de helft moet weglaten om niemand te beschadigen, hoort niet in een ouderkanaal. |
| 140.000 leerlingen, 30 procent andere thuistaal, in Den Haag de helft | Gegevens uit 2003. Het pakkendste deel (Den Haag) nergens terug te vinden. Als uitspraak over school nú niet oud maar onjuist. |
| "Berbertalige kinderen leren het Berbers niet lezen; vanaf de basisschool wordt Nederlands dominant" | Uit een boekrecensie uit 2004, zonder getal. Het kantelmoment van groep 1 mag je gewoon als ervaring benoemen, zonder bron die het niet kan dragen. |
| 70 procent van de Marokkanen in West-Europa spreekt Tarifit; 150.000 in Nederland | Jaartal, methode en steekproef niet vast te stellen. Het gevaarlijkste item van allemaal, want het is precies wat je wilt hebben. |
| Meer Marokkaanse kinderen kregen in 2000-2001 Arabisch dan Berbers op school | Waar en scherp, maar niet te onderbouwen, en het onderwijs in eigen taal is in 2004 afgeschaft. |
| Turks redelijk goed, Arabisch uitzonderlijk laag bij Nederlandse leerlingen | Onderzoek uit 1991, over wekelijks Arabischonderwijs dat in 2004 is gestopt. De gedachte eronder mag je kwalitatief gebruiken, zonder getal en zonder bronclaim. |
| CBS 2008: 10 procent van de Marokkanen vindt Nederlands moeilijk | Niet te bevestigen, achttien jaar oud, en het ondergraaft je eigen punt: deze generatie heeft het Nederlands al binnen. |
| Myria: 359.491 Marokkaanse eerste nationaliteit in België, 12 procent | Niet afgekeurd, maar laat hem liggen: het is nationaliteit bij registratie en het Nederlandse cijfer is herkomst. Naast elkaar gezet is het appels met peren, en de meeste mensen in die groep hebben inmiddels de Belgische nationaliteit. |

### Over schermtijd en leren

| Afgekeurd | Waarom |
|---|---|
| De eerste 1.000 woordfamilies dekken 81-84 procent van gesproken taal | Niet de getallen van de bron (80,88 procent voor een roman; de tweede duizend doet 7,21 procent erbij). Een herberekening van een derde partij, en het gaat over Engels. |
| 34 uur op Duolingo is een eerste semester Spaans | Betaald door de aanbieder, niet peer-reviewed, marge onbevestigd. Hiermee valt ook de regel "tien minuten per dag is meer dan een heel semester" weg: niet posten. |
| 126 minuten schermtijd (in plaats van 102) | Een andere meting met een bredere definitie. Niet fout, maar hoort bij een andere reeks. Houd één reeks aan en noem de bron. |
| "Schermtijd stijgt elk jaar" | Wordt weerspoken door de eigen bron: 102 (2026), 81 (2025), 99 (2024), 100 (2023). |
| "Onder de 2 jaar 60 minuten, 2-6 jaar 90 minuten" | Verkeerde leeftijdsgrenzen: de bron zegt tot en met 2 jaar ongeveer een uur, en 3 tot 6 jaar ongeveer anderhalf uur — en alleen over televisie en video's, niet alle schermtijd. Een ouder van een tweejarige plaatst zich zo in de verkeerde groep. |
| "Boekentijd is lager dan de jaren daarvoor" | De reeks 23-22-25 is bevestigd, de daling niet: die leunt op een oudere, andere meting. |
| 49 procent gebruikt media alleen | De primaire bron zegt 47, nieuwsberichten 49, een eerder bericht 60 op een andere vraag. Post het gevoel ("ongeveer de helft"), niet de komma. |
| Bijna 20 procent van de 10-12-jarigen tegenover 5 procent van de 7-9-jarigen | Twee leeftijdsgroepen met twee verschillende jaarlabels naast elkaar. Geen vergelijking. |
| 3.000 nieuwe woorden per jaar | Betwist. Schattingen lopen van 800 tot 5.000 per jaar, afhankelijk van hoe je woorden telt. |
| Een optimaal aantal nieuwe woorden per dag | Bestaat niet in gecontroleerde vorm. Alleen blogs en app-aanbieders. |

### Over Darija en Marokko

| Afgekeurd | Waarom |
|---|---|
| "Darija staat niet in artikel 5" (de oorspronkelijke versie) | Half waar, en daarmee onwaar: hetzelfde artikel verplicht de staat tot bescherming van "de parlers die in Marokko gesproken worden". Bericht 14 is de versie die standhoudt als iemand het artikel opent. |
| Drie dialectgroepen met scherp verschillende klinkerstelsels | De gangbare indeling is tweeledig, en het Hassaniya is geen derde groep. Het beweerde scherpe verschil was niet te onderbouwen. |
| Academici schatten 40 tot 45 procent Amazigh-sprekers | Nergens te vinden, en toegeschreven aan drie onderzoekers bij wie het niet terug te vinden is. De betwisting zelf is goed gedocumenteerd; dit tegencijfer is dat niet. Juist het bericht dat als verzekering tegen gevoeligheid was bedoeld, zou zelf het conflict zijn geworden. |
| Het woordenboek heeft acht delen, 60.000 fiches, twintig jaar werk | Geen van de drie getallen te vinden, en "bijna twintig jaar" ging over hoe lang de uitgave duurde, niet over het verzamelen. Bericht 27 staat zonder die getallen. |
| Het woordenboek is gebaseerd op vier steden: Fes, Marrakech, Rabat, Tanger | De vier stadsnamen komen in geen enkele bron voor. Vier concrete namen zijn bij uitstek natrekbaar. |
| Tifinagh wordt door 20 miljoen mensen gebruikt | Staat niet in de Unicode-stukken, en botst met je eigen volkstellingsbericht. Twee eigen berichten die elkaar tegenspreken is precies de schade die één fout cijfer aanricht. |
| 1.660 scholen, 330.000 leerlingen, 400 leraren; 50 procent dekking in 2026 | De aantallen worden door een latere ministeriële opgave tegengesproken, de 400 leraren is de aanwerving van één jaar uit een stijgende reeks, en het jaar 2026 is nu geen doel meer maar een vraag. Bericht 29 houdt alleen wat staat. |
| fabor, bocadillo en tarifa als Spaanse leenwoorden | Eén lijstje op een nieuwssite, zonder taalkundige verantwoording, met een precieze datering die niemand kan controleren. Een leuk woordfeit is wat het verst wordt doorgestuurd, dus ook de fout. Dit is wel de moeite waard om goed te doen: zie hoofdstuk 6. |
| De oude stadsdialecten van acht genoemde steden; het Jebli tegenover Tétouan | De onderliggende indeling is wetenschappelijk, de stedenlijsten komen van Wikipedia — en juist die lijst zou gepost worden, aan lezers die de streek kennen. |
| 5,1 miljoen Marokkanen in het buitenland, 89 procent in Europa, 15 procent van de bevolking | Eén zwakke bron, een rekenfout (het is 13,8 procent) en een verschoven strekking: de 89 procent gaat over mensen die bij consulaten staan ingeschreven. Het punt eronder — je bent niet de enige — heeft dit cijfer niet nodig; zie bericht 31. |

### Over de vorm

| Afgekeurd | Waarom |
|---|---|
| Mensen die hadden gejogd stuurden 42 procent vaker iets door | Twee replicaties uit 2024 (111 en 160 deelnemers) vonden geen effect. Het origineel had 40 deelnemers en de 42 procent kwam uit een samenvatting. Omgevallen. |
| Angst verhoogt delen met 30 procent | Dat getal hoort bij ontzag. Voor angst geeft de bron 21 procent, en alleen in een figuurlabel. |
| Een "doorgestuurd"-label verlaagt de geloofwaardigheid (266 deelnemers) | Niet te openen, en de twee methodes in hetzelfde onderzoek geven tegengestelde uitkomsten. De vormregel — zet de bron ín het bericht — heeft dit onderzoek niet nodig: hij volgt uit het simpele gegeven dat de afzender wegvalt bij doorsturen. |
| WhatsApp klapt in na ongeveer vijf regels | Een changelog van een externe leverancier over zakelijke marketingberichten, niet over kanalen. "Kort, en de bron bovenaan" blijft als ontwerpkeuze; het getal vijf niet als feit. Meet het met een testkanaal. |
| Kanalen staan standaard gedempt | Alleen derdepartijpagina's. Even te testen met een tweede telefoon, en belangrijk genoeg voor je planning om het niet op een gerucht te baseren. |
| 13,7 miljoen WhatsApp-gebruikers in Nederland; 65 berichten per dag; een kwart deelt nieuws in besloten apps | Een enquêteschatting, een panelcijfer van elf jaar oud, en een wereldwijd cijfer uit 2017 dat gebruikt werd om iets over een Marokkaans-Nederlandse ouder te zeggen. Alle drie ondersteunen ze iets wat niemand bestrijdt. Zeg het gewoon zonder cijfer. |
| Eén herkenbaar persoon werkt sterker dan een statistiek | De klassieke studie en de replicatie uit 2024 niet te controleren. Bouw het kanaal niet op de marketingregel "één verhaal verslaat een cijfer" — maar presenteer dat als een keuze, niet als een bevinding. |
| Mensen delen vooral positief nieuws over hun eigen groep | Geen controleerbare verwijzing. Juist de bevinding die strategisch het beste uitkwam, dus juist die hard wegstrepen. De conclusie blijft overeind via het onderzoek uit 2012 dat wél staat: verdriet deelt minder, positieve inhoud meer. |

**De huisregel die hieruit volgt.** Van 126.000 verhaalkettingen op Twitter reisde onjuiste informatie verder en sneller dan juiste, en de onderzoekers noemen nieuwheid als verklaring (Science, 2018). "Wist je dat" is letterlijk een nieuwheidsclaim. Het bericht dat het hardst reist, is dus het bericht dat je het strengst moet nakijken — en dat is precies het bericht dat je het liefst wilt posten.
