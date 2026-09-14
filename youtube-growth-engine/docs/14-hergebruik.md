# 14 — Bestaande content hergebruiken: waar de grens ligt

Je schreef dat je bestaande content gaat hergebruiken "in een nieuw jasje".
Dat kan vier dingen betekenen. Drie ervan zijn prima en één kost je het kanaal,
dus het is de moeite waard om ze uit elkaar te trekken.

---

## De vier soorten hergebruik

| | Wat het is | Oordeel |
|---|---|---|
| **A** | Het **klassieke bronmateriaal** opnieuw vertellen: Koran, hadith, sira, islamitische geschiedenis | **Prima — dit is de niche.** Iedereen vertelt deze verhalen; dat is het punt ervan |
| **B** | **Je eigen** eerdere video's, scripts of research opnieuw gebruiken | **Prima, binnen grenzen** — de originaliteitspoort meet de afstand tot je eigen catalogus |
| **C** | Een **succesvolle video van iemand anders** opnieuw maken met andere beelden en andere formuleringen | **Dit kost je het kanaal.** En het is wat je eigen opdracht uitdrukkelijk verbood |
| **D** | Het **script, de montage of de audio** van iemand anders opnieuw uitgeven | Auteursrechtinbreuk. Daar houdt het op |

**A is vrijwel zeker wat je bedoelt**, en dan is er niets aan de hand. Het
verhaal van de hijra is niet van een YouTuber. Dat jij het vertelt met jouw
invalshoek, jouw voorbeelden en jouw beelden is precies wat het systeem
ondersteunt.

Het onderscheid tussen A en C zit niet in het onderwerp maar in **wat je
hergebruikt**. Dezelfde gebeurtenis navertellen is A. Iemands *manier* van
navertellen overnemen is C — ook als je elk woord anders formuleert, ook als je
eigen beelden maakt. Het patroon mag, de uitwerking niet. Dat onderscheid staat
uitgewerkt in [`03`](03-compliance-en-auteursrecht.md) §1.

---

## De val die specifiek in jouw niche zit

Je schreef dat het met de religieuze controle "goed zal komen" omdat je bestaande
content hergebruikt. Die redenering klopt intuïtief en is precies verkeerd om.

**Bij islamitische content is wijdverbreide herhaling geen bewijs van
betrouwbaarheid — het correleert er eerder negatief mee.** Zwakke en verzonnen
overleveringen worden juist het meest doorgegeven, om een begrijpelijke reden:
ze zijn aansprekend, kort en goed te onthouden. Een authentieke overlevering met
een lange keten en een saaie strekking wordt minder gedeeld dan een verzonnen
uitspraak die precies zegt wat mensen willen horen.

Het gevolg voor jouw plan: **het materiaal dat het makkelijkst te hergebruiken
is, is gemiddeld het minst betrouwbaar.** Wat overal rondgaat, is vaak precies
wat je reviewer zal tegenhouden.

Dat is geen reden om het niet te doen. Het is een reden om het andersom te
doen: begin bij de vindplaats, niet bij het verhaal dat je kent.

### Wat het systeem daarmee doet

Een bron kan nu drie soorten hebben in plaats van twee:

```ts
kind: 'primary' | 'secondary' | 'circulated'
```

`circulated` betekent letterlijk "dit gaat overal rond, zonder vindplaats". Zo'n
bron kan **nooit** een centrale claim dragen — dat is een deterministische
controle, geen beoordeling:

```
checkCirculationNotEvidence()
  → centrale claims die alleen op herhaling steunen: BLOKKEREN
  → algemene claims (aantallen, context): toegestaan
```

Het staat ook als harde regel in de systeemprompt van het model, zodat het niet
eens probeert. Maar de poort is wat telt: prompts zijn een verzoek, poorten zijn
een controle.

---

## Wat dit voor je werkwijze betekent

Je kennis van welke verhalen aanslaan is echt waardevol — dat is jouw
publieksinzicht en het is niet te automatiseren. Gebruik het aan de **voorkant**,
als onderwerpkeuze, niet aan de achterkant als bronvervanging:

| In plaats van | Doe |
|---|---|
| "Deze video deed het goed, ik maak er mijn versie van" | "Deze video laat zien dát deze vraag leeft. Wat is het echte antwoord?" |
| "Dit verhaal ken ik, dat schrijf ik uit" | "Dit verhaal ken ik. Waar staat het, en klopt de versie die ik ken?" |
| "Dit citaat zie ik overal" | "Dit citaat zie ik overal — dus eerst opzoeken of het bestaat" |

De derde rij levert vaak een betere video op dan de video die je wilde maken.
"Deze uitspraak wordt overal aan de Profeet ﷺ toegeschreven en staat in geen
enkele collectie" is een sterkere video dan de uitspraak nog eens navertellen —
en het is precies het soort stelling waar [`docs/12`](12-religieuze-integriteitspoort.md)
en de originaliteitspoort voor gemaakt zijn.

---

## Wat ik van je nodig heb

**Zeg welke van de vier je bedoelt.** Bedoel je A of B, dan is alles wat hier
staat alleen bevestiging en hoef je niets te veranderen. Bedoel je C, dan bouw
ik het systeem niet zo — niet omdat ik het niet mag, maar omdat het regelrecht
ingaat tegen de uitgangspunten die je zelf als niet-onderhandelbaar hebt
opgeschreven, en omdat het handhavingsrisico het hele project waardeloos maakt.

Zeg je dat het toch C moet worden, dan is dat jouw beslissing en zeg ik het
één keer en niet vaker. Maar dan wil ik het expliciet horen, want dan bouw ik
iets anders dan wat er nu staat.
