# 15 — Tools, connectors en de Higgsfield-afweging

## 1. De vondst die je scores direct verhoogt: vidIQ als connector

In het nichescoremodel worden nu twee categorieën **begrensd** omdat er geen
externe data is:

```
audience_demand   max 15  →  begrensd op 11   (publieksvraag is een hypothese)
competition       max 10  →  begrensd op  7   (concurrentiebeeld is een hypothese)
```

Dat kost je maximaal 7 punten die je niet met een beter verhaal kunt terugwinnen —
alleen met cijfers.

**vidIQ heeft een MCP-connector** met onder meer `vidiq_keyword_research`,
`vidiq_outliers`, `vidiq_similar_thumbnails`, `vidiq_channel_stats`,
`vidiq_trending_videos` en `vidiq_video_earnings_estimate`. Dat is precies de
data die stap 4 uit je opdracht vraagt: concurrenten, terugkerende formats,
recente titels, thumbnailpatronen, onbeantwoorde vragen.

Je hebt op dit moment **geen enkele connector aangesloten**. Deze is de moeite:
hij zet de twee plafonds eraf en maakt van de onderzoekschecklist echte data.

Zolang hij er niet is, levert het systeem de checklist uit
`src/studio/market.ts` op — zes stappen, elk met de score die ermee omhooggaat.
Dat is de eerlijke tussenvorm: geen verzonnen zoekvolumes.

## 2. Higgsfield: past het, en past het nú?

**Wat het is.** Een abonnement dat een stuk of twaalf modellen bundelt — Sora 2,
Veo 3.1, Kling 3.0, Seedance 2.x, Nano Banana — onder één dashboard, met eigen
gereedschap voor camerabeweging, karakterconsistentie en lipsync.
[bron: secundair]

**De aanbieding:** Plus, 1.200 credits per maand, €35 per maand bij jaarlijkse
betaling (van €59), circa 600 beeldgeneraties of ~53 videoclips.

### Past de capaciteit?

Ja, ruim. Bij 1 long-form per week heb je nodig:

```
4,3 video's × ~45 stills            ≈ 194
thumbnailvarianten                  ≈  26
hergeneratie (factor 1,4)           ≈  90
                                    ─────
                                    ≈ 310 beelden per maand
```

600 generaties dekt dat met ruimte over. En ~53 clips is veel meer dan de 20 tot
30 seconden accentbeeld per video die het ontwerp gebruikt.

### Past het in het budget?

```
nu:          vast €45  + variabel €51,60  = €96,60
met Plus:    vast €80  + variabel ~€25    = €105
```

Ongeveer gelijk, iets erover. Je ruilt variabele kosten in voor vaste, en je
koopt speelruimte die je bij 1 video per week niet opmaakt.

### Drie dingen die tegen deze aankoop pleiten

1. **Je hebt nog geen video gemaakt.** Het hele plan is een pilot van tien
   video's en daarna beslissen. Een jaarverplichting op de grootste
   vaste post van een budget van €100 is precies de omgekeerde volgorde.
2. **De API-vraag is onbeantwoord, en die beslist alles.** Wat ik kon vinden,
   loopt via derde partijen (MindCloud, Make, VideoGenAPI, Pixazo), niet via
   een duidelijk eigen, gedocumenteerde publieke API. Bij dit soort diensten
   geldt bovendien vaak dat **abonnementscredits niet voor de API gelden** —
   die worden apart gemeten. Als dat hier ook zo is, koop je een dashboard
   waar iemand met de hand in moet klikken, midden in een pipeline die juist
   geautomatiseerd hoort te zijn. [status: **te verifiëren**]
3. **De koppen van de aanbieding gaan over wat jij niet mag gebruiken.**
   Karakterconsistentie is het belangrijkste verkoopargument, en voor dit
   kanaal geldt het alleen voor hedendaagse gezinsscènes — nooit voor de
   historische verhalen, want daar wordt geen figuur afgebeeld.

### De keuze die ik heb gemaakt, en gebouwd

Per aanroep betalen in plaats van abonneren, met het werk verdeeld over twee
modellen die elk ergens het beste in zijn:

| Rol | Keuze | Prijs | Waarom |
|---|---|---|---|
| Scenestills | **fal.ai** (Seedream V4 of FLUX) | ~$0,03 per beeld | vier keer goedkoper dan de rest, echte API |
| Thumbnails | **Gemini 3 Pro Image** | ~$0,134 per beeld ($0,067 in batch) | aantoonbaar beter in leesbare tekst in beeld, en dat is precies waar een thumbnail op staat of valt |
| Videoclips | **fal.ai** (Kling 3.0) | ~$0,029 per seconde | laagste prijs per seconde die ik vond |

Het duurdere model gaat alleen naar de ~26 thumbnails per maand, niet naar de
~194 stills. Dat onderscheid scheelt op jaarbasis ruim honderd euro en het zit
in `SplitImageProvider`: het pad van het bestand bepaalt welk model wordt
aangeroepen.

**Eén ding om zelf te controleren:** commerciële rechten volgen het **model**,
niet het platform. fal.ai geeft de licentie van het onderliggende model door.
Kijk dus naar de voorwaarden van het model dat in `FAL_IMAGE_MODEL` staat, en
leg het bewijs vast als `LicenseProof` — de database weigert anders de asset.

### De gemeten uitkomst

De adapters staan er nu, en de raming die `npm run produce` afdrukt bij 1
long-form per week:

```
194 stills + 26 thumbnails + 108 seconden clip  =  EUR 12,70 per maand
```

Tegenover **EUR 35 per maand, een jaar vast**. Met hergeneratie erbij (factor
1,4) kom je op ongeveer EUR 18. Dat is de helft, en je kunt elke maand stoppen.

| | per aanroep | Higgsfield Plus |
|---|---:|---:|
| Beeld en clips per maand | **EUR 12,70 – 18** | EUR 35 |
| Verplichting | geen | 12 maanden |
| Een maand niets maken | EUR 0 | EUR 35 |
| API | ja, dat is het product | te verifieren |
| Twaalf maanden | EUR 150 – 216 | EUR 420 |

### Advies

**Niet vandaag tekenen.** Niet omdat het een slecht product is — de capaciteit
past en de korting is echt — maar omdat de volgorde niet klopt en één vraag
nog open staat. Een half uur bedenktijd is een verkoopmechanisme, geen
marktomstandigheid; deze aanbiedingen komen terug.

Wil je Higgsfield toch proberen: neem een **maandplan**, controleer binnen die
maand of de credits ook voor de API gelden, en maak er twee video's mee. Werkt
het, dan is het jaarplan er nog. Werkt het niet, dan heb je €15 tot €59
verloren in plaats van €420.

## 3. De rest van de stack, in volgorde van belang

| Rol | Aanbeveling | Waarom |
|---|---|---|
| Redactie | Claude API | staat al klaar in `src/providers/claude/` |
| Marktdata | **vidIQ-connector** | haalt de twee scoreplafonds eraf |
| Stem | los TTS-abonnement met tekentimestamps | daaruit komt de ondertiteling, zonder aparte spraakherkenning |
| Beeld | per-aanroep API met commerciële rechten | past op de adapter, schaalt mee omlaag |
| Videoclips | per-aanroep, 20–30 s per video | 11 minuten volledig generatief kost meer dan je hele budget |
| Montage | FFmpeg, zelf gehost | is al gebouwd en is meteen de productierenderer |
| Uploaden | YouTube Data API | is al gebouwd, minimale scopes |
| Werkboeken | Chromium naar PDF | is al gebouwd, €0,04 per hoofdstuk |

Wat hier níét in staat: de kant-en-klare faceless-pakketten (Pictory, InVideo,
AutoShorts en dergelijke). Ze zijn sneller op te zetten en ze zijn
sjabloongestuurd — precies het profiel dat het inauthentic-content-beleid
beschrijft. Voor een kanaal dat het van redactionele eigenheid moet hebben, is
dat de verkeerde gereedschapskist.
