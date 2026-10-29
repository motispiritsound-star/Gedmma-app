# 24 — Welke videotool, en wat er nog meer in de keten hoort

Status: advies.
Datum: 2026-10-29.

## Eerst: MCP is niet hetzelfde als automatisering

De Kling-server die we gisteren hebben ingesteld, **verbindt niet** — het
netwerkbeleid van deze omgeving weigert kling.ai (`403` op `CONNECT`). Dat is
een omgevingsinstelling, geen configuratiefout.

Maar belangrijker is het verschil eronder, want dat bepaalt wat je moet kiezen:

| | MCP-server | API in de pijplijn |
|---|---|---|
| Wie roept hem aan | ik, in een gesprek | de wachtrij, op een tijdstip |
| Wanneer | als jij iets vraagt | zondagavond 20:00, zonder mij |
| Waarvoor | uitproberen, één clip maken | wekelijks produceren |

Een MCP-server geeft **mij** gereedschap. Jouw wekelijkse taak draait zonder
mij. Voor *geautomatiseerd* produceren heb je dus de API nodig, niet de
MCP-server. Kling via MCP is handig om te experimenteren; het maakt je
productielijn niet draaiend.

## De rekensom die de vraag beslist

Vijftien minuten is **900 seconden**. Generatieve video kost grofweg $0,05 tot
$0,50 per seconde.

| Prijs per seconde | Per video | Per maand (1 per week) |
|---|---|---|
| $0,05 | $45 | **$180** |
| $0,10 | $90 | **$360** |
| $0,20 | $180 | **$720** |

Je budget is € 100 per maand. De goedkoopste variant is bijna het dubbele, en
dat is dan je hele budget aan beeld alleen.

En er is een tweede probleem dat geen prijsverlaging oplost: **deze modellen
maken clips van vijf tot tien seconden.** Vijftien minuten is dus 90 tot 180
losse clips, elk met een eigen prompt en zonder enige samenhang met de vorige.
Dat is geen video van een kwartier; dat zijn honderdvijftig losse shots achter
elkaar. Niemand maakt zo een samenhangende uitlegvideo.

**Conclusie: generatieve video is een accent, geen hoofdbeeld.** Twintig tot
dertig seconden per video, op de momenten waar een tekening het niet kan. De
rest is wat je gisteren hebt gezien: eigen beeld, bewogen door FFmpeg. Dat kost
nul.

## Welke tool dan wel

**Geen nieuwe. Gebruik fal.ai, die al in het project zit.**

Dat is geen gemakzucht maar de architectuur. fal.ai is een verzamelpunt: Kling,
Veo, WAN, LTX en Seedance draaien er allemaal achter één API en één sleutel.
Een ander model kiezen is dan één regel in `.env` — `FAL_VIDEO_MODEL` — en niet
een nieuwe adapter, een nieuw account en een nieuwe factuur.

Dat is precies waar de provider-opzet uit `docs/04` voor bedoeld is: een
leverancier vervangen is een regel in een tabel.

Wil je Kling specifiek: dat kan via fal.ai, zonder apart Kling-account.

Twee dingen om na te lopen voordat je een model kiest, en ze zijn allebei
belangrijker dan de beeldkwaliteit:

1. **Staat commercieel gebruik in de voorwaarden van dát model?** Dit verschilt
   per model op hetzelfde platform. Zie `docs/23` — de poort controleert dit nu.
2. **Wat is de prijs per seconde bij de resolutie die jij nodig hebt?** De
   genoemde prijs is vaak die van de laagste stand.

## Wat er in je lijstje ontbrak

Je lijst was: script, thumbnail, beschrijving, video, uploaden. Dat is de
zichtbare helft. Dit stond er niet in, en elk punt hieronder is een reden
waarom een kanaal niet loopt.

### Vóór het script

- **Onderzoek met bronnen.** Zonder dit klopt de inhoud niet, en bij dit kanaal
  zijn de cijfers het product. *Staat er.*
- **Onderwerpkeuze uit een wachtrij** in plaats van per video verzinnen.
  *Staat er.*

### In het script

- **Hook binnen vijf seconden en haken om de 45 seconden.** Een video van
  vijftien minuten zonder haken is na dertig seconden leeg. *Staat er, als poort.*
- **Hoofdstukindeling.** Bij een kwartier verwachten kijkers hoofdstukken, en
  ze helpen de vindbaarheid. *Ontbreekt nog.*

### Het grootste gat: geluid

- **Voice-over.** Je noemde hem niet, en het is de grootste kwaliteitsknop die
  je hebt bij faceless video. *Staat er — Google Chirp 3.*
- **Ondertiteling.** Veel mensen kijken zonder geluid, en YouTube leest het mee.
  *Staat er, uit de gemeten zinsduur.*
- **Muziek, en de rechten erop.** Muziek is de nummer één bron van
  auteursrechtclaims op YouTube. *Adapter staat er, bron nog niet gekozen.*
- **Geluidsnormalisatie naar ongeveer −14 LUFS.** Anders klinkt jouw video
  zachter dan alle andere. *Ontbreekt nog.*

### Vóór publicatie

- **Technische controle van de render:** zwarte frames, stiltes, lengte.
  *Staat er.*
- **AI-disclosure.** YouTube wil dat je synthetisch of bewerkt materiaal meldt.
  Dit vergeet bijna iedereen. *Staat er.*
- **Made for Kids.** Verplicht veld, en de verkeerde keuze kost je reacties,
  eindschermen én advertentie-inkomsten.
- **Eindscherm en kaarten.**
- **Publicatietijdstip** in plaats van publiceren wanneer de render klaar is.
  *Staat er, als uitgestelde publicatie.*

### Ná publicatie — en dit is het punt dat het meeste verschil maakt

- **De retentiecurve terugvoeren naar het volgende script.** Waar haken kijkers
  af? Dat is het enige signaal dat je video's beter maakt. Zonder deze stap
  herhaal je elke week dezelfde fout. *Ontbreekt nog.*
- **Kosten per video bijhouden.** *Staat er.*

## Over die vijftien minuten

`npm run lengte` rekent het voor:

```
 lengte  bekeken  min/view   views voor 4.000 u
  6 min    45%      2,70            88.889
 15 min    32%      4,80            50.000
 15 min    22%      3,30            72.728
```

Vijftien minuten is beter — **als het bekeken percentage meevalt.** Onder de
18% levert een kwartier minder kijktijd per view op dan zes minuten op 45%. En
vullen om aan de lengte te komen, verlaagt precies dat percentage.

Een nieuw kanaal houdt geen kwartier vast. Mijn advies: begin op acht à tien
minuten, waar de midrolls al mogen, en groei naar vijftien zodra je eigen
retentiecijfers laten zien dat het onderwerp de lengte draagt.

## Wat ik zou bouwen, in deze volgorde

1. **Hoofdstukken** uit de segmenten van het script. Half uur werk.
2. **Geluidsnormalisatie** in de montage. Een regel FFmpeg.
3. **Analytics terugvoeren**: retentiecurve ophalen en naast het script leggen.
   Dit is het grootste gat en het meeste werk.
4. **Muziekbron kiezen** met aantoonbare rechten.

Generatieve video staat bewust niet in die lijst. Hij staat klaar via fal.ai
voor het moment dat een tekening iets niet kan laten zien.
