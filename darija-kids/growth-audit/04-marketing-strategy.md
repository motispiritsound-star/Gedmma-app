# 04 — Marketing en acquisitie

## De markt, met eerlijke marges

De doelgroep is de Marokkaanse diaspora in Europa. De cijfers lopen per bron
uiteen omdat de definities verschillen (nationaliteit, herkomst, geboorteland)
en de peiljaren niet gelijk zijn.

| Land | Mensen van Marokkaanse herkomst | Bron / zekerheid |
| --- | --- | --- |
| Frankrijk | ≈ 1.150.000 | meest genoemd; één bron zegt >1,9 mln incl. nakomelingen |
| Spanje | 766.000 – 1.026.000 | breed bereik tussen bronnen |
| **Nederland** | **433.337** (2,4% van de bevolking) | **CBS 2025 — het enige harde cijfer** |
| Italië | 412.000 – 525.000 | Istat 2023 als basis |
| België | 298.000 – 700.000 | de 700.000 lijkt een uitschieter |
| Duitsland | 127.000 – 140.000 | |
| **Europa totaal** | **≈ 3 miljoen** | veel gebruikte orde van grootte |

**WAARSCHIJNLIJK** (de ranges), **BEWEZEN** alleen voor Nederland. Bronnen
onderaan dit document. Voor een besluit dat op één land leunt: haal het bij
het nationale bureau (CBS, INSEE, INE, Istat).

### Hoe groot is dat werkelijk

Een schatting met de aannames erbij, zodat ze te betwisten zijn:

```
  3.000.000   mensen van Marokkaanse herkomst in Europa
  ×    15%    kinderen tussen 5 en 12            → 450.000 kinderen
  ÷     1,8   kinderen per gezin                 → 250.000 huishoudens
  ×      1%   die dit zouden kopen               →   2.500 abonnementen
  ×   € 60    per jaar                           → € 150.000 per jaar
```

**HYPOTHESE** — elke regel behalve de eerste is een aanname. Het punt is niet
het getal maar de orde: **de markt is ruim genoeg.** Bij één procent
penetratie van alleen de gezinnen met kinderen is dit een bedrijf. Bij de
huidige zes abonnementen zit hij op 0,002%.

De beperking is dus niet de markt. Het is de weg ernaartoe.

## Waar het nu op staat

De zes interfacetalen (`nl, fr, de, es, it, en`) dekken precies de zes
grootste diasporamarkten. Dat is goed gekozen — en vrijwel onbenut:

| Markt | Interface klaar? | Marketing gedaan? | Aankopen |
| --- | --- | --- | --- |
| Nederland | ja | ja, intensief | 9 |
| Frankrijk | ja | deels (Facebook, 3 nov) | 2 |
| Duitsland | ja | **nee** | **2** |
| Spanje | ja | **nee** | 0 |
| Italië | ja | **nee** | 0 |
| België | ja (nl + fr) | **nee** | 0 |
| Qatar / Golf | ja (en) | **nee** | 1 e-boek |

**BEWEZEN** — aankopen uit ASC per territorium (10 nov) en de Play-orders.

Twee dingen vallen op. Duitsland leverde twee aankopen **zonder enige
marketing**, en Qatar een e-boekverkoop van QAR 63 op 9 november, volledig
koud. Dat is bewijs dat de winkelteksten uit zichzelf werken.

En België is niet aangeraakt, terwijl het de goedkoopste markt is die hij
heeft: Nederlandstalig én Franstalig, dus **beide** bestaande berichten,
films en winkelteksten werken daar zonder één nieuwe regel te schrijven.
298.000 tot 700.000 mensen.

## Wat er al werkt, en wat dat zegt

- **De winkelpagina overtuigt.** Wie doorklikt, downloadt in **78,9%** van de
  gevallen. **BEWEZEN** — `docs/STAND.md`. Dat is hoog. Aan de teksten en de
  schermafdrukken hoeft niets.
- **De films.** Negen stuks uit één machine (`scripts/make-intro.mjs`), die de
  échte app fotografeert. Dat is een voorraad die concurrenten niet hebben, en
  de productiekosten per volgende film zijn bijna nul.
- **Facebook-groepen bereiken mensen.** De campagne van 3 november hield het
  bereik op niveau. **ONBEKEND** wat ze opleverde — zie hieronder.
- **Een statische, snelle, zestalige website** met correcte canonicals,
  hreflang en sitemap, en nul dode links (`npm run build` controleert het).

## Wat er niet werkt

### 1. Niets is toe te rekenen

```
src/site/links.ts:16-18   — geen ?ct=, geen &referrer=
```

De campagne in meer dan vijftien groepen is **voorgoed onmeetbaar**. Welke
taal, welke groep, welk bericht: weg. **BEWEZEN.**

Dit is de duurste gewoonte in het hele dossier, want hij herhaalt zich. Elke
volgende post zonder parameter is weer een campagne waarvan niemand het
resultaat kent. Het kost één regel per link.

### 2. Facebook-groepen zijn geen kanaal, maar een eenmalige handeling

Posten in vijftien groepen is werk dat niet opschaalt en niet terugkomt. Het
bereik van 3 november is er één keer. **WAARSCHIJNLIJK** is dit ook waarom het
tempo daarna zakte (24% → 7,6% bezoek per vertoning): de warme golf was op.

Wat hier ontbreekt is een kanaal dat blijft draaien zonder dat hij elke week
in groepen post.

### 3. Er is geen SEO-inhoud, alleen SEO-techniek

De site is technisch in orde en heeft **niets te vinden**. Er zijn
productpagina's en juridische pagina's, geen pagina's die een zoekvraag
beantwoorden.

Een ouder zoekt niet op "Darija app". Hij zoekt op:

- *hoe leer ik mijn kind Marokkaans*
- *comment apprendre le darija à mon enfant*
- *mijn kind begrijpt oma niet meer*
- *Marokkaans Arabisch of standaard Arabisch voor kinderen*
- *wat betekent [woord] in het Marokkaans*

Dat laatste is de interessantste: hij heeft **303 woorden met opnames door een
Marokkaanse spreker** en **28 letters met uitleg**. Dat is 331 pagina's
waarop een zoeker kan landen, elk met iets wat geen concurrent heeft — audio
van een mens.

**HYPOTHESE:** een woordenboek-op-het-web, zes talen, met de opnames erbij, is
het enige acquisitiekanaal dat hij heeft dat blijft doorwerken zonder
maandelijkse inspanning. Het bouwt zich uit de bestaande inhoud, niet uit
nieuwe.

Risico dat eerlijk benoemd moet worden: woorden weggeven die in de app achter
het slot zitten. Dat is op te lossen — op het web het woord en de klank, in de
app het pad, de herhaling en het diploma. Dat is ook precies wat Duolingo en
Memrise doen met hun webwoordenlijsten.

### 4. Geen social proof

Zes betalende klanten kunnen zes beoordelingen schrijven. En het verzoek om
een beoordeling kan een gratis gebruiker niet eens bereiken
(`DIPLOMAS_VOOR_VRAAG = 3` tegen nul haalbare diploma's). **BEWEZEN.**

Op de winkelpagina en op de website staat daarmee niets dat een vreemde
vertrouwen geeft behalve de woorden van de maker zelf. Voor een product van
€ 59,99 per jaar dat over de taalopvoeding van een kind gaat, is dat de
zwaarste ontbrekende schakel na de meetbaarheid.

## De strategie

Niet meer bezoekers. **Geschikter** bezoek, dat zich vermenigvuldigt.

### Prioriteit 1 — zet de groeilussen aan (P0/P1)

Dit is marketing die in de code zit en nu uit staat:

1. ~~Maak de deelkaart bereikbaar voor niet-betalende gebruikers.~~
   **Gedaan, 12 november:** gratis deel naar acht lessen (27 woorden), eerste
   mijlpaal van 25 naar 20. De kaart vuurt nu zonder abonnement.
2. ~~Maak het beoordelingsverzoek bereikbaar.~~ **Niet gedaan, en bewust.**
   Dat vuurt na drie diploma's en een gratis gebruiker haalt er één. De
   drempel verlagen zou die vraag laten samenvallen met het moment waarop het
   slot dichtgaat; dat is erger dan de lus dicht laten.
3. ~~Zet campagneparameters op elke winkellink.~~ **Gedaan, 12 november:**
   `npm run kanaallinks`. De Apple-helft wacht nog op de providercode uit de
   console.

Kosten: dit bleek geen paar regels te zijn. Het aantal gratis lessen staat
ook in winkelteksten in zes talen bij twee winkels, in de
licentieovereenkomst, op de review-schermafdrukken, in socialkaarten waar het
in de PNG zit, en in de ingesproken tekst van de reclamefilms. Die laatste
zijn niet te repareren zonder opnieuw op te nemen. Dit zijn de drie goedkoopste dingen in dit hele
document en ze gaan allemaal over mechanismen die al gebouwd zijn.

### Prioriteit 2 — België, dan Frankrijk (P1)

België eerst, omdat beide bestaande talen er werken. Daarna Frankrijk, de
grootste markt, waar al twee aankopen uit kwamen.

Dezelfde films, dezelfde teksten, andere groepen — maar nu **met
campagnelinks**, zodat de uitkomst per markt leesbaar is.

### Prioriteit 3 — het web-woordenboek (P2)

331 pagina's uit bestaande inhoud, zes talen. Het enige kanaal dat
doorwerkt als hij een maand niets doet. Geen nieuwe inhoud nodig, wel
bouwwerk in `src/site/`.

### Wat hij moet stoppen

- **Nieuwe films maken tot de meting staat.** Er zijn er negen. **ONBEKEND**
  of ze iets opleveren, want de links dragen geen parameter. Film tien
  verandert dat niet.
- **In meer groepen posten zonder campagnelink.** Dat is bereik inkopen met
  tijd en de bon weggooien.

### Betaalde advertenties

**Nog niet.** De reden is rekenkundig: de opbrengst per download is $1,05, en
dat is cumulatief over de hele levensduur tot nu. Apple Search Ads en Meta
kosten in deze categorie in West-Europa doorgaans meer per installatie dan
dat. **WAARSCHIJNLIJK** verliest hij dus geld per advertentie-euro.

Dat kan kloppen zodra (a) de opbrengst per gebruiker hoger is — zie
`05-pricing-monetization.md` — of (b) hij weet welke boodschap werkt, wat de
meting vereist. Tot dan is advertentiegeld een gok met een onleesbare
uitkomst.

Eén uitzondering die wél te verdedigen is: **Apple Search Ads op de eigen
merknaam**, een paar euro per dag, om te voorkomen dat een concurrent op
"darijaforkids" biedt. Dat is verzekering, geen acquisitie.

### De creator-code

Er staat een afspraak klaar met een bekende Nederlands-Marokkaanse creator:
drie maanden gratis op het jaarabonnement, 10% van het netto bedrag ex btw
(`docs/CODES.md`). Dat is het beste acquisitiekanaal in dit dossier, om drie
redenen: het publiek is precies de doelgroep, de aanbeveling komt van iemand
die ze vertrouwen — wat dit product aantoonbaar nodig heeft — en er wordt pas
betaald als er omzet is.

**Wat er nog niet is:** de twee aanbiedingscodes in de consoles. Die moeten
worden aangemaakt voordat er iets te delen valt. Dat staat op de lijst van
openstaande punten in `07-growth-roadmap.md`.

**Belangrijk:** de code moet een campagneparameter krijgen, anders is ook deze
samenwerking straks niet toe te rekenen.

## Bronnen

- [Moroccan diaspora — Wikipedia](https://en.wikipedia.org/wiki/Moroccan_diaspora) — de landencijfers en de ranges hierboven; mirrors geven afwijkende jaren
- Nederland: CBS 2025, 433.337 personen van Marokkaanse herkomst (via bovenstaande)
- De aankoop- en trechtercijfers: App Store Connect en Play Console, overgenomen in `docs/STAND.md`
