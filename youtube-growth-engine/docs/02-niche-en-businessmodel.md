# 02 — Fase 1: niche- en businessanalyse

> Alle bedragen zijn **bandbreedtes**, geen voorspellingen. Er staat nergens een
> gegarandeerde opbrengst, en dat kan ook niet. Zie
> [`10-bronnen-en-verificatiestatus.md`](10-bronnen-en-verificatiestatus.md)
> voor de herkomst en betrouwbaarheid van elk getal hieronder.

## 1. De harde randvoorwaarde die de hele businesscase bepaalt

Advertentie-inkomsten bestaan pas ná toelating tot het YouTube Partner Program.
Die drempel is **1.000 abonnees plus óf 4.000 geldige publieke kijkuren in 12
maanden, óf 10 miljoen geldige publieke Shorts-views in 90 dagen** — de twee
tellen nooit bij elkaar op. Voor nieuwe aanvragers zou die drempel per
**1 februari 2027** verdubbelen naar 8.000 kijkuren of 20 miljoen Shorts-views.
[bron: secundair, te verifiëren]

Reken die drempel om naar werk:

```
4.000 kijkuren = 240.000 kijkminuten
Bij 9 minuten video en 45% gemiddeld bekeken percentage
  → 4,05 kijkminuten per view
  → ~59.000 long-form views nodig, cumulatief
```

Bij het aanbevolen tempo (4,3 long-form per maand) is dat ongeveer **13.700
views per video over het eerste jaar**, of navenant minder per video als je er
meer maakt. Dat is haalbaar, maar het is geen formaliteit — en tot dat moment is
de advertentieomzet exact **nul**.

De Shorts-route is geen alternatief: 10 miljoen views in 90 dagen is bij 2
Shorts per week onbereikbaar.

**Gevolg voor het ontwerp:** het systeem mag niet op advertenties gebouwd zijn.
Affiliate-inkomsten en eigen product werken vanaf video één; advertenties zijn
een bonus die ergens in maand 8 tot 18 aankomt. De kostenregistratie in het
dashboard rekent daarom met *alle* inkomstenbronnen, niet met RPM alleen.

## 2. Het niche-scoremodel

Precies de weging uit je opdracht, met per criterium een concreet meetpunt zodat
de score reproduceerbaar is en niet op gevoel drijft.

| Criterium | Max | Waar ik op meet |
|---|---:|---|
| Publieksvraag | 15 | Zoekvolume, aantal actieve kanalen met >10k views per video, evergreen-aandeel |
| Originaliteitsruimte | 15 | Kan hier een stelling worden ingenomen die nog niet tien keer bestaat? Telt eigen expertise zwaar mee |
| Verwachte retentie | 15 | Leent het onderwerp zich voor concrete voorbeelden, cijfers en open loops? |
| Economische potentie | 15 | RPM-bandbreedte × realistische views × niet-advertentie-inkomsten |
| Concurrentiepositie | 10 | Hoeveel sterke spelers, en hoe verzadigd is het format? Lage score = zware concurrentie |
| Bronbeschikbaarheid | 10 | Zijn er gratis, primaire, citeerbare bronnen? |
| Productiekosten | 10 | Hoeveel generatieve video is nodig? Grafieken en stills zijn tien keer goedkoper |
| Beleids- en auteursrechtrisico | 10 | Gevoelig onderwerp, demonetisatie- of claimrisico. Lage score = hoog risico |

**Adviesdrempel: 75.** Onder de 75 raad ik de niche af, hoe groot het
zoekvolume ook is.

## 3. Zes gescoorde kandidaten

Voorlopig, want de belangrijkste variabele — jouw eigen kennis — ken ik nog niet
(vraag 2). Eigen expertise kan een niche zo tien punten laten stijgen.

| # | Niche | Taal | Vraag /15 | Orig. /15 | Ret. /15 | Econ. /15 | Conc. /10 | Bron /10 | Kosten /10 | Risico /10 | **Totaal** |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| **E** | **Bouwfysica en renovatie ontleed** | NL | 10 | 15 | 12 | 12 | 9 | 9 | 8 | 9 | **84** |
| **A** | **Wonen, verbouwen en de verborgen kosten** | NL | 13 | 13 | 12 | 13 | 8 | 9 | 8 | 7 | **83** |
| B | Consumentenrecht en verborgen kosten | NL | 12 | 12 | 13 | 11 | 8 | 9 | 8 | 5 | **78** |
| C | Hoe grote infrastructuur écht werkt | EN | 13 | 11 | 13 | 11 | 5 | 8 | 5 | 9 | **75** |
| F | Europese energiepolitiek uitgelegd | NL/EN | 11 | 12 | 11 | 9 | 7 | 10 | 7 | 4 | **71** |
| D | AI-automatisering voor kleine bedrijven | EN | 14 | 9 | 10 | 15 | 3 | 6 | 8 | 5 | **70** |

### Waarom D onderaan staat, ondanks de hoogste RPM

De AI-niche heeft de beste advertentiewaarde van de zes en is precies daarom de
slechtste keuze voor dít systeem. Het is de niche waar YouTube's handhaving op
massaal geproduceerde content het hardst aankomt — in januari 2026 werden in één
golf zestien kanalen beëindigd met samen 4,7 miljard lifetime views [bron:
secundair]. Een geautomatiseerd kanaal dat in die niche begint, opereert precies
in het zoeklicht. Daar komt bij dat de bronbasis zwak is: veel van wat er te
zeggen valt komt van sociale media, en jouw eigen opdracht zegt terecht dat die
als hypothese en niet als feit behandeld moeten worden. Een factcheckpoort van
90% haalt die niche structureel niet.

### Waarom E en A samen het sterkste voorstel zijn

Ze dekken elkaars zwakte af. **A** heeft de vraag (iedereen die een huis koopt
of verbouwt zoekt dit actief) maar weinig beschermbare originaliteit. **E** heeft
bijna geen concurrentie en met echte vakkennis een positie die niemand kan
kopiëren, maar een smaller publiek.

Het voorstel is daarom: **A als kanaalpositionering, E als handtekeningserie
daarbinnen.** De brede video's halen het publiek binnen, de diepe video's maken
dat het publiek terugkomt — en terugkerende kijkers zijn precies wat je opdracht
als doel stelt.

Beide leunen op openbare, primaire, gratis bronnen — CBS, Kadaster, RVO, Milieu
Centraal, NIBUD, ISSO, TU-publicaties — wat de Source Confidence-poort van 90%
realistisch haalbaar maakt. Bij een niche zonder zulke bronnen is die poort een
permanente blokkade.

## 4. RPM: wat de cijfers wel en niet zeggen

Openbare RPM-cijfers lopen ver uiteen. Voor "personal finance" vond ik in
dezelfde week bronnen die $10–25 noemen en bronnen die $25–50 noemen — een
factor twee tot vijf verschil [bron: secundair]. Dat verschil is zelf het
belangrijkste gegeven: **behandel elk extern RPM-cijfer als een hypothese.**

Werkbare bandbreedtes voor een **Nederlandstalig** kanaal, bewust aan de
voorzichtige kant:

| Type | RPM-bandbreedte (€ per 1.000 views) | Opmerking |
|---|---|---|
| Long-form, wonen/geld-adjacent, NL/BE | €3 – €9 | Tier-1-markt, maar niet VS-niveau |
| Long-form, algemeen/uitleg, NL/BE | €1,50 – €4 | |
| Long-form, zelfde onderwerp maar EN/VS-publiek | €6 – €25 | Grotere spreiding, veel hardere concurrentie |
| **Shorts, elk onderwerp** | **€0,03 – €0,15** | Ordegrootte lager. Shorts zijn distributie, geen verdienmodel |

**Variatie die je moet inplannen:**

- **Seizoen.** Q4 (november–december) ligt structureel het hoogst door
  kerstadvertentiebudgetten; januari is het diepste dal. Een factor 1,5 tot 2
  tussen piek en dal is normaal. Beoordeel een experiment daarom nooit tegen een
  maand uit een ander kwartaal.
- **Land.** Tier-1-markten (VS, VK, CA, AU) leveren een veelvoud van Tier-3
  [bron: secundair]. Een Nederlandstalig kanaal kiest impliciet voor een klein,
  redelijk betalend publiek.
- **Videotype.** Midrolls zijn alleen mogelijk vanaf 8 minuten — vandaar de
  aanbevolen lengte van 8–12 minuten in [`01`](01-vragen.md).

## 5. De drie scenario's

Uitgangspunt: 1 long-form + 2 Shorts per week = **4,3 long-form en 8,7 Shorts
per maand**. Kostenopbouw per stuk staat in [`06`](06-kosten-per-video.md).

| | Conservatief | Realistisch | Optimistisch |
|---|---:|---:|---:|
| **Kosten per Short** | € 4,50 | € 2,40 | € 1,40 |
| **Kosten per long-form** | € 28 | € 12 | € 6 |
| Variabele kosten per maand | € 159 | € 73 | € 38 |
| **Vaste kosten per maand** | € 210 | € 105 | € 75 |
| **Totale kosten per maand** | **€ 369** | **€ 178** | **€ 113** |
| Aangenomen long-form-RPM | € 2,00 | € 4,00 | € 7,00 |
| **Break-even op advertenties alleen** | 184.500 views/mnd | 44.500 views/mnd | 16.100 views/mnd |
| ...dat is per video | ~43.000 | ~10.400 | ~3.700 |
| **Break-even met eigen product** (1 conversie per 1.000 views, € 50 marge) | 7.400 views/mnd | 3.600 views/mnd | 2.300 views/mnd |

De scenario's verschillen in **kostenkeuzes**, niet in geluk:

- **Conservatief** — generatieve video als hoofdbeeldmiddel (60–90 seconden per
  video), alle Claude-stappen op het duurste model, veel hergeneratie na
  afgekeurde poorten, gehoste renderdienst, groot TTS-abonnement.
- **Realistisch** — stills, datagrafieken en motion graphics als basis, 30–45
  seconden generatieve clip als accent, kwaliteitspoorten op een goedkoper
  model, zelf gehoste FFmpeg-render.
- **Optimistisch** — geen generatieve video, agressieve prompt-caching, batch-API
  waar latency niet uitmaakt, kleine eigen VPS.

### Geschatte nettomarge

Marge is pas zinvol ná de YPP-drempel. Een realistisch beeld voor maand 12–18 in
het realistische scenario, bij ~60.000 long-form views per maand:

| Bron | Bandbreedte per maand |
|---|---|
| Advertenties (RPM € 3–6) | € 180 – € 360 |
| Affiliate (effectief € 1–4 per 1.000 views) | € 60 – € 240 |
| Eén gesponsorde video (CPM € 15–30 op geleverde views) | € 0 – € 300 |
| **Bruto** | **€ 240 – € 900** |
| Kosten | € 178 |
| **Netto** | **€ 62 – € 722** (marge 26% – 80%) |

Dat is een eerlijke marge op een klein absoluut bedrag. Het punt van dit model
is niet dat de marge hoog is, maar dat de **kostenkant volledig beheersbaar en
vooraf bekend** is. De opbrengstkant is dat niet en wordt dat ook niet.

### De grootste onzekerheden, in volgorde

1. **Of iemand kijkt.** De hele kostenkant is met twee cijfers achter de komma
   te plannen; of een video 500 of 50.000 views haalt niet. Dit is verreweg de
   grootste onzekerheid en geen enkele automatisering verkleint hem.
2. **Of het systeem originaliteit haalt die YouTube én kijkers overtuigt.** De
   inauthentic-content-handhaving is de bestaansrisicofactor, niet de kosten.
3. **De RPM-bandbreedte zelf.** Een factor twee tot vijf onzekerheid, en die
   werkt direct door in break-even.
4. **Providerprijzen.** Generatieve video kost nu $0,05–0,75 per seconde [bron:
   secundair]. Een verschuiving daarin verandert de kosten per video met een
   factor drie.
5. **Beleidswijzigingen.** De aangekondigde verhoging van de YPP-drempel per
   februari 2027 is precies het type verandering dat een plan van 12 maanden
   ongeldig maakt.

## 6. Advies

**Bouw voor niche A met E als handtekeningserie, in het Nederlands, met de
"realistisch"-kosteninstelling — en reken de businesscase door op eigen product
en affiliate, niet op advertenties.**

Definitief pas na je antwoord op vraag 2 en 10. Als je in een heel ander
onderwerp thuis bent, weegt dat zwaarder dan alles in deze tabel: eigen
expertise is het enige onderdeel van de score dat concurrenten niet kunnen
inhalen.
