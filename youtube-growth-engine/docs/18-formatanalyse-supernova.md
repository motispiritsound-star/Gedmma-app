# 18 — Formatanalyse: @moroccan.supernova, en wat "America Supernova" wel en niet kan zijn

Status: analyse, geen productiebesluit.
Datum: 2026-09-15.
Aanleiding: je vraag om dit kanaal "1 op 1 te kopiëren qua format en content",
omgezet naar America Supernova met afleveringen over Amerika.

## 1. Wat ik wel en niet kon zien

De egressregels van deze omgeving blokkeren youtube.com, dus ik kon het kanaal
niet zelf openen. Wat hieronder staat komt uit zoekresultaten en is daarmee
**bron B** in de systematiek van `docs/10`: bevestigd door secundaire bronnen,
niet door de primaire pagina zelf.

Wat daaruit blijkt:

- Het kanaal doet ruimtevaart, astronomie en natuurverschijnselen.
- De voertaal is Marokkaans Darija — dat is het kenmerk dat in vrijwel elke
  titel en omschrijving terugkomt ("بالدارجة المغربية").
- Het format is gemengd: lange documentaire-achtige video's naast live
  astronomiesessies, plus jaarlijkse compilaties.

Wat ik **niet** heb: abonneeaantal, weergaven per video, gemiddelde
kijkduur, RPM, of de werkelijke opbouw van een aflevering. Die cijfers zijn van
buitenaf sowieso niet zichtbaar behalve het abonneeaantal. Elke uitspraak over
"hoe goed dit loopt" zou ik moeten verzinnen, dus die doe ik niet.

## 2. Wat er niet gaat gebeuren

"1 op 1 kopiëren qua format en content" kan ik niet voor je bouwen, en dat is
niet mijn regel maar de jouwe. Uit je eigen opdracht:

> "Kopieer of parafraseer geen scripts, titels, thumbnails, muziek, stemmen of
> creatieve uitwerkingen."
> "Maak geen bijna-identieke versie van een succesvolle video."
> "Gebruik geen generieke template waarin alleen onderwerp, naam of enkele
> afbeeldingen worden vervangen."

Het systeem dwingt dat ook af en dat kan ik niet omzeilen zonder de poort te
slopen: `checkTitleDistance` meet bigram-, jaccard- en LCS-afstand tot elke
referentietitel, het model krijgt van referentietitels alleen de *vorm* te zien
via `extractTitlePattern` en nooit de tekst, en de originaliteitsdrempel staat
op 90. Een aflevering die de bron navolgt, haalt die drempel per definitie niet.

Daar komt het platformrisico bij, en dat is het echte argument. Een kanaal dat
het format, de naamstructuur en de inhoud van een bestaand kanaal overneemt, is
precies het profiel waar YouTube op handhaaft onder het beleid voor
niet-authentieke en hergebruikte content — zie `docs/03` §2 en `docs/14`. De
uitkomst daarvan is geen waarschuwing maar beëindiging, en dan ben je alles
kwijt wat je tot dat moment hebt opgebouwd. Ook de naam zelf is een probleem:
"America Supernova" naast "Moroccan Supernova" leest als dezelfde reeks, en dat
werkt tegen je zodra iemand een klacht indient.

Wat wel mag, en wat ik hieronder doe: het **abstracte patroon** analyseren.
Tempo, titelvorm, thumbnailprincipe, retentiestructuur, de keuze van taal. Dat
zijn geen auteursrechtelijk beschermde werken maar redactionele keuzes, en die
mag je overnemen. Dat is ook precies waar fase 2 van je opdracht voor bedoeld
is.

## 3. De vraag die ertoe doet

Niet: *waar gaat dit kanaal over?* Maar: *wat maakt het werkzaam?*

Ruimtevaart is een van de drukste hoeken van YouTube. In het Engels concurreer
je met kanalen die miljoenen abonnees en een echte redactie hebben, met exact
dezelfde gratis beelden als jij. Het onderwerp is dus niet de voorsprong.

Wat wél de voorsprong is: **ruimtevaart in Darija bestaat nauwelijks.** Er is
een publiek dat het Engelse aanbod niet volgt en dat door niemand anders
bediend wordt. Het overdraagbare bezit is het taalgat, niet het thema.

Dat is dezelfde structuur als `hoe-nederland-werkt`, de kandidaat die in jouw
lijst al bovenaan staat: openbare data die iedereen kan ophalen, in een taal
waarin bijna niemand het doet.

## 4. Twee vertalingen, gescoord onder dezelfde regels

Beide staan nu in `knowledge/niches.yaml`. `npm run niches` geeft:

| Kandidaat | Score | Oordeel |
|---|---|---|
| `ruimtevaart-nl` — ruimtevaart in het Nederlands, uit het NASA/ESA-archief | **78/100** | Kansrijk, positionering aanscherpen |
| `america-supernova` — Engelstalig, over het Amerikaanse ruimtevaartprogramma | **65/100** | Zwakke differentiatie of uitvoeringsrisico |

Dezelfde video's, dezelfde kosten, dertien punten verschil. Het zit in twee
categorieën:

- **Concurrentiekans: 7 tegen 2.** In het Engels sta je tegenover de grootste
  kanalen van het platform met hetzelfde bronmateriaal.
- **Originele positionering: 10 tegen 4.** In het Nederlands is de invalshoek
  het onderscheid; in het Engels is er geen.

De voorsprongcategorie valt in de Engelse variant volledig weg (begrensd op 5
van 15), omdat geen van je drie voorsprongen daar iets doet. In de Nederlandse
variant draagt er één over — de taal — en heb ik daarom 8 gescoord, niet 11.

Kort gezegd: **America Supernova gooit precies weg wat het Marokkaanse kanaal
laat werken.** Het kopieert het zichtbare deel en laat het werkzame deel liggen.

## 5. De vondst die dit wél interessant maakt

Eén ding uit deze analyse is los van de naamkwestie waardevol, en het is de
sterkste productiescore van de hele kandidatenlijst: **5 van 5.**

NASA-materiaal — beeld, video, audio — valt in de Verenigde Staten buiten het
auteursrecht en mag redactioneel worden gebruikt, ook commercieel. De
voorwaarden zijn hard maar werkbaar:

- Het NASA-insigne, het logotype en de merkidentiteit zijn **niet** vrij.
- Gebruik mag geen goedkeuring of samenwerking suggereren.
- Herkenbare personen brengen een eigen portretrechtvraag mee.
- Materiaal van derden op NASA-sites is niet vrij; NASA markeert dat.
- NASA wordt als bron vermeld.

Dat raakt de post die dit hele project duur maakt. Uit `docs/06`: generatieve
video is de kostenmoordenaar. Een niche waar het beeld al bestaat, in
bioscoopkwaliteit, rechtenvrij, verandert die rekening fundamenteel. Voor ESA
geldt een eigen licentie (CC BY-SA in veel gevallen) — die moet apart worden
nagelopen voordat er één beeld in een video gaat.

**Maar** — en dit is de keerzijde die de concurrentiescore verklaart —
"archiefbeeld met een voice-over eroverheen" is letterlijk het schoolvoorbeeld
in YouTube's beleid voor hergebruikte content. Gratis beeld is hier dus geen
vrijbrief maar een verplichting: eigen diagrammen, een eigen verhaallijn en
eigen analyse zijn de voorwaarde om te mogen bestaan, niet een stijlkeuze.

## 6. Wat ik je aanraad

1. **Maak America Supernova niet.** Niet omdat het onfatsoenlijk is, maar omdat
   het model zegt dat het je slechtste optie na `ai-op-je-werk` is, en omdat de
   naam een klacht uitnodigt die je kanaal kan kosten.
2. **Blijf bij video 1.** Die staat op acht blokkades van publicatie
   (`npm run release`) en is het enige wat je op korte termijn geld oplevert.
   Een tweede kanaal beginnen voordat het eerste één video heeft uitgebracht,
   is de fout die de meeste kanalen om zeep helpt.
3. **Houd `ruimtevaart-nl` warm als kanaal twee.** 78 punten, de laagste
   productiekosten van alle kandidaten, volledig evergreen en oneindig
   schaalbaar. Als je ooit een tweede kanaal begint, is dit de sterkste
   kandidaat die niet in het gevoelige regime valt.

## 7. Bronnen

- NASA Images and Media Usage Guidelines — https://www.nasa.gov/nasa-brand-center/images-and-media/ (A)
- Wikilegal/NASA images, Wikimedia — https://meta.wikimedia.org/wiki/Wikilegal/NASA_images (B)
- Plagiarism Today, NASA: Copyright and Trademark in Space — https://www.plagiarismtoday.com/2024/11/04/nasa-copyright-and-trademark-in-space/ (B)
- Kanaalkenmerken @moroccan.supernova — via zoekresultaten, kanaalpagina zelf geblokkeerd (B)
