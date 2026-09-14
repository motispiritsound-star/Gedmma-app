# 06 — Kosten per video

> Alle bedragen zijn schattingen op basis van **secundaire** prijsbronnen uit
> september 2026 (zie [`10`](10-bronnen-en-verificatiestatus.md)). Dollarprijzen
> zijn omgerekend tegen ongeveer €0,92 per dollar. Het systeem meet de
> werkelijke kosten per productie zelf; deze tabellen zijn het ontwerpbudget,
> niet de boekhouding.

## Long-form (8–12 minuten, Nederlands, ~1.350 woorden, ~8.000 tekens)

| Post | Conservatief | Realistisch | Optimistisch |
|---|---:|---:|---:|
| Taalmodel — analyse, stelling, onderzoek, script, poorten | € 7,50 | € 3,60 | € 2,40 |
| Voice-over | € 1,90 | € 0,95 | € 0,45 |
| Beeldgeneratie (stills + thumbnailvarianten) | € 4,30 | € 2,10 | € 0,55 |
| Generatieve videoclips | € 8,30 | € 3,90 | € 0,00 |
| Montage en render | € 2,30 | € 0,15 | € 0,10 |
| Ondertiteling | € 0,05 | € 0,02 | € 0,02 |
| Opslag en egress | € 0,20 | € 0,10 | € 0,05 |
| Afgeschreven afgewezen producties | € 3,45 | € 1,18 | € 2,43 |
| **Totaal per long-form** | **€ 28,00** | **€ 12,00** | **€ 6,00** |

### Waar het verschil vandaan komt

Twee posten verklaren bijna het hele verschil tussen €28 en €6, en het zijn
allebei **beeldkeuzes**, geen kwaliteitskeuzes op de inhoud:

- **Generatieve video: €8,30 tegen €0.** Een video van 9 minuten is 540
  seconden. Volledig generatief bij $0,10 per seconde zou **$54** kosten — meer
  dan alle andere posten samen, vier keer over. Zelfs de conservatieve variant
  gebruikt maar 75 seconden generatieve clip; de rest is stills, datagrafieken
  en motion graphics.
- **Render: €2,30 tegen €0,10.** Een gehoste renderdienst rekent rond $0,25 per
  minuut; FFcompileren op je eigen worker kost alleen rekentijd.

De redactionele kant — onderzoek, script, factcheck, poorten — kost in het
duurste scenario €7,50 en in het goedkoopste €2,40. **Dat is de post waarop je
niet moet bezuinigen**, en gelukkig is het niet de post die het verschil maakt.

### Opbouw van de taalmodelkosten (realistisch scenario)

| Stap | Model | Invoer | Uitvoer | Kosten |
|---|---|---:|---:|---:|
| Referentie-analyse | Sonnet 5 | 40k | 6k | $0,14 |
| Stelling en invalshoek | Opus 5 | 25k | 3k | $0,20 |
| Onderzoeksbrief (met websearch) | Opus 5 | 120k | 12k | $0,90 |
| Script | Opus 5 | 45k | 9k | $0,45 |
| Factcheck (schone context) | Opus 5 | 70k | 8k | $0,55 |
| Originaliteitscontrole | Sonnet 5 | 60k | 5k | $0,17 |
| Retention review | Opus 5 | 30k | 5k | $0,28 |
| Shotlist | Opus 5 | 30k | 7k | $0,33 |
| Metadata, hoofdstukken, tags | Haiku 4.5 | 25k | 6k | $0,06 |
| Trust- en policygate | Opus 5 | 30k | 4k | $0,25 |
| | | | **Subtotaal** | **$3,21** |
| Prompt caching op de hergebruikte onderzoeksbrief | | | | −$0,40 |
| Hergeneratie na een afgekeurde poort (factor 1,4) | | | | +$1,12 |
| | | | **Totaal** | **$3,93 ≈ € 3,60** |

Drie hefbomen die dit bedrag met een kwart tot de helft omlaag brengen zonder
kwaliteitsverlies: **prompt caching** op de onderzoeksbrief (die door vijf
stappen heen gaat), de **batch-API** met 50% korting voor poorten die geen
directe respons nodig hebben, en **poorten vroeg in de keten** — een concept dat
op de stelling sneuvelt, kost €0,20 in plaats van €12.

## Shorts (35–50 seconden, ~110 woorden, ~650 tekens)

| Post | Conservatief | Realistisch | Optimistisch |
|---|---:|---:|---:|
| Taalmodel | € 1,60 | € 0,90 | € 0,70 |
| Voice-over | € 0,15 | € 0,08 | € 0,04 |
| Beeldgeneratie | € 1,00 | € 0,52 | € 0,14 |
| Generatieve videoclip | € 1,40 | € 0,74 | € 0,00 |
| Montage en render | € 0,25 | € 0,05 | € 0,03 |
| Opslag | € 0,05 | € 0,03 | € 0,02 |
| Afgeschreven afwijzingen | € 0,05 | € 0,08 | € 0,47 |
| **Totaal per Short** | **€ 4,50** | **€ 2,40** | **€ 1,40** |

Shorts zijn goedkoper dan long-form omdat ze de **onderzoeksbrief van een
long-form hergebruiken**. Een Short die vanaf nul onderzoek moet doen kost bijna
evenveel als een long-form en levert een fractie op. Ontwerpgevolg: het systeem
maakt Shorts bij voorkeur ná een long-form, uit dezelfde brief, met een eigen
stelling en eigen beelden — niet als knipsel uit de long-form, want dat is
precies het sjabloongedrag dat de originaliteitspoort moet afvangen.

## Vaste maandkosten

| Post | Conservatief | Realistisch | Optimistisch |
|---|---:|---:|---:|
| TTS-abonnement | € 92 | € 20 | € 20 |
| Hosting (app, worker, database) | € 55 | € 45 | € 12 |
| Objectopslag en egress | € 20 | € 12 | € 8 |
| Muzieklicentie | € 25 | € 15 | € 15 |
| Monitoring en back-up | € 15 | € 10 | € 5 |
| Domein en overig | € 3 | € 3 | € 3 |
| Marge voor prijsverschuiving | € 0 | € 0 | € 12 |
| **Totaal per maand** | **€ 210** | **€ 105** | **€ 75** |

**Let op de omvang van het TTS-abonnement.** Bij 4,3 long-form × 8.000 tekens
plus 8,7 Shorts × 650 tekens verbruik je circa **40.000 tekens per maand**. Een
instapplan van 30.000 credits is daarmee te klein — reken op het niveau
daarboven. Dit is het soort detail dat pas in maand twee pijn doet, als een
productie halverwege stilvalt.

## Totaalbeeld per maand

Bij 4,3 long-form en 8,7 Shorts per maand:

| | Conservatief | Realistisch | Optimistisch |
|---|---:|---:|---:|
| Long-form (4,3 ×) | € 120 | € 52 | € 26 |
| Shorts (8,7 ×) | € 39 | € 21 | € 12 |
| Variabel | € 159 | € 73 | € 38 |
| Vast | € 210 | € 105 | € 75 |
| **Totaal** | **€ 369** | **€ 178** | **€ 113** |

## Break-even per video

Het dashboard toont dit bij elke productie, vóór goedkeuring. De formule:

```
break-even views = (kosten van deze video + vaste kosten ÷ aantal video's deze maand)
                   ÷ verwachte RPM × 1.000
```

In het realistische scenario is dat per long-form:

```
(€12 + €105 ÷ 13) ÷ €4,00 × 1.000 = (12 + 8,08) ÷ 4 × 1.000 ≈ 5.020 views
```

Bij een RPM van €2,00 wordt dat ruim 10.000 views; bij €7,00 ongeveer 2.900. Die
spreiding is het eerlijke beeld: **de kostenkant is tot op de cent te plannen,
de opbrengstkant niet.** En tot de YPP-drempel is gehaald, is het antwoord op
"hoeveel views heb ik nodig om break-even te draaien op advertenties" gewoon:
oneindig. Zie [`02`](02-niche-en-businessmodel.md) §1.

## Wat het systeem zelf bijhoudt

Elke provider-adapter rapporteert verplicht `{ costCents, latencyMs,
providerRef }`. Daaruit volgt zonder extra administratie:

- werkelijke kosten per productie, uitgesplitst per stap en per provider;
- kosten van **afgewezen** producties, apart geteld — dat is de prijs van
  kwaliteit, en die hoor je te kennen;
- kosten per gepubliceerde minuut en per 1.000 views;
- afwijking tussen begroot en werkelijk, per stap, zodat deze tabellen na tien
  video's door meetgegevens worden vervangen in plaats van door schattingen.
