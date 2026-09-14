# 12 — De religieuze integriteitspoort

Een nieuwe, blokkerende poort die vóór de scriptpoort draait. Hij bestaat om één
reden die je zelf scherp formuleerde: **je bent geen islamitisch geleerde, en het
systeem is dat al helemaal niet.**

Taalmodellen produceren overtuigend klinkende hadith die niet bestaan, schrijven
uitspraken toe aan de verkeerde metgezel, en leveren Arabische tekst die er
correct uitziet en het niet is. Bij de meeste onderwerpen levert dat een fout op.
Bij dit onderwerp levert het iets op waar mensen naar handelen, en dat de kijker
doorstuurt naar zijn familie.

**Deze poort is daarom niet configureerbaar naar beneden.** De drempel staat
vast, en ook bij `APPROVAL_MODE=false` stopt elke video hier voor een mens.

---

## 1. Vijf klassen van religieuze claim

Elke zin in een script wordt geclassificeerd. Vier van de vijf klassen hebben
een harde herkomsteis.

### Klasse A — Koranverwijzing

Vereist: **soeranaam, soeranummer, ayahnummer**, en een vertaling uit een
**bij naam genoemde, gepubliceerde vertaling** die verbatim uit een
geverifieerde bronbibliotheek komt.

Het systeem genereert, parafraseert of "verbetert" nooit een vertaling. Een
Koranvertaling die door het model is geproduceerd is een harde blokkade, ook
als hij correct lijkt.

> **Auteursrechtpunt dat je gaat raken.** De meeste Nederlandse
> Koranvertalingen zijn auteursrechtelijk beschermd werk. "Het is de Koran" is
> geen vrijbrief voor de vertaling ervan. Vóór M2 moet één vertaling worden
> gekozen waarvan het gebruik aantoonbaar is toegestaan, en die keuze wordt
> per video in de bronvermelding genoemd. Hetzelfde geldt voor
> **recitatie-audio**: de opname van een reciteur is een beschermde uitvoering.

### Klasse B — Hadith

Vereist: **collectie, boek- en/of hadithnummer, en de gradering met de
beoordelaar erbij** (sahih, hasan, da'if — en bij mawdu': niet gebruiken).

Een hadith zonder volledige herkomst is een harde blokkade. Niet afzwakken, niet
markeren als onzeker, niet "volgens de overlevering" — blokkeren. Dit is het
punt waar taalmodellen het vaakst en het overtuigendst falen.

Da'if-overleveringen mogen alleen worden gebruikt als ze uitdrukkelijk als
zwak worden benoemd, en nooit als onderbouwing van een handeling of een claim
over wat verplicht of verboden is.

### Klasse C — Fiqh, oordelen en handelingen

Het systeem mag **nooit een oordeel als feit stellen**. Geen "dit mag" of "dit
moet". Toegestane vormen:

- toeschrijving aan een genoemde school of geleerde;
- expliciete vermelding dat geleerden verschillen, met de voornaamste posities;
- beschrijving van wat mensen in de praktijk doen, als praktijk benoemd.

**Voor een Nederlands publiek is dit geen formaliteit.** De twee grootste
islamitische gemeenschappen in Nederland volgen overwegend verschillende
scholen — Marokkaanse gezinnen doorgaans de malikitische, Turkse gezinnen
doorgaans de hanafitische. Een video die één positie als "de" regel presenteert,
vertelt een deel van je publiek dat hun gezin het verkeerd doet. Dat is
inhoudelijk onjuist en publicitair fataal.

Individueel religieus advies is geblokkeerd, in dezelfde klasse als medisch en
juridisch advies.

### Klasse D — Historische claim

Islamitische geschiedenis, sira, verhalen over profeten en metgezellen.
Vereist: een genoemde bron, en onderscheid tussen wat in de Koran of authentieke
hadith staat en wat uit latere historische werken of israiliyyat komt. Die twee
mogen in het script niet in dezelfde adem staan.

Data, aantallen en plaatsnamen vallen onder de gewone factcheckpoort **plus**
deze.

### Klasse E — Algemeen, niet-religieus

Gewone factcheck. Hier valt het meeste van je "herkenbare gezinssituaties" onder,
en dat is goed: dat is het deel waar je eigen inzicht de waarde levert en waar
het systeem vrij kan werken.

---

## 2. Het afbeeldingsverbod — een harde technische blokkade

Afbeelding van de Profeet Mohammed ﷺ, van de andere profeten en van de
metgezellen is in de gangbare islamitische praktijk niet toegestaan. Voor een
kanaal met AI-gegenereerde verhalende animatie is dit **de meest waarschijnlijke
manier om in één video alles kwijt te raken** — één gegenereerde scène met een
figuur die als een profeet leest, en het vertrouwen is weg bij precies het
publiek waarvoor je het maakt.

Een instructie in een prompt is hiervoor niet genoeg. De blokkade zit op drie
plaatsen:

1. **Prompt-niveau.** Een blokkeerlijst van namen en omschrijvingen, in het
   Nederlands, Engels en Arabisch, plus verplichte negatieve prompts op elke
   beeldaanvraag.
2. **Shotlist-niveau.** Elke scène die een verhaal met een profeet of metgezel
   vertelt, krijgt verplicht een `figure_free` shot-type. De toegestane
   beeldtaal: landschap, architectuur, objecten, kalligrafie, licht, silhouet
   van de omgeving, handen zonder gezicht, symbolische abstractie.
3. **Assetcontrole.** Elk gegenereerd beeld gaat langs een visuele controle die
   op menselijke figuren in verhalende scènes controleert. Een figuur waar
   `figure_free` geldt = asset afgekeurd, opnieuw genereren, en na drie pogingen
   naar een mens.

De regel staat niet in een prompt maar in de shotlist-validatie, waar een
taalmodel er niet omheen kan praten.

---

## 3. Arabische tekst

Arabische tekst wordt **nooit door een model gegenereerd.** Niet op het scherm,
niet in een dua, niet in lesmateriaal.

De reden is praktisch: modellen leveren Arabisch met verkeerde tashkeel, met
losgekoppelde letters, met omgekeerde volgorde bij menging met Latijns schrift,
en met woorden die bestaan maar iets anders betekenen. Bij lesmateriaal voor
kinderen is dat niet een foutje maar aangeleerde fout.

Alle Arabische tekst komt uit een **geverifieerde assetbibliotheek**: per item
de tekst, de transliteratie, de vertaling, de bron en de naam van de mens die
hem heeft gecontroleerd. Die bibliotheek groeit per video en wordt hergebruikt —
na dertig video's is het merendeel van wat je nodig hebt al geverifieerd.

Hetzelfde geldt voor de **uitspraak** in de voice-over. De TTS-provider krijgt
een uitspraakwoordenboek voor Arabische termen en eigennamen; wat daar niet in
staat, wordt niet uitgesproken maar toegevoegd en gecontroleerd.

---

## 4. Muziek

`music_policy: vocals_and_duff_only` is de standaard: zang, en percussie
beperkt tot de duff. Geen instrumentale bedden, geen strijkers, geen synthesizer,
ook niet zacht onder de voice-over.

De reden is dat over instrumentale muziek onder geleerden verschil van mening
bestaat, en dat een aanzienlijk deel van je publiek dat verschil serieus neemt.
De standaard is daarom de terughoudende kant; jij kunt hem wijzigen, en die
wijziging komt in het auditlog.

Praktisch gevolg: de `MusicProvider` kan niet zomaar een abonnement op een
generieke muziekbibliotheek zijn. Dat vraagt óf een nasheed-bron met aantoonbare
commerciële licentie, óf eigen productie — en bestaande nasheeds zijn
auteursrechtelijk beschermd werk, dus "we gebruiken gewoon een bekende nasheed"
kan niet. Dit is een openstaand punt voor M3.

---

## 5. De menselijke reviewer

Dit is de enige plek in het hele systeem waar ik zeg: **dit is niet
automatiseerbaar, en de poging het toch te doen is het gevaar.**

Elke video met inhoud uit klasse A tot en met D moet vóór publicatie worden
gelezen door iemand met voldoende kennis. Niet noodzakelijk een moefti — iemand
met gedegen scholing die een verkeerd toegeschreven hadith of een te stellig
geformuleerd oordeel herkent.

**Regel dit vóór M2, niet vóór publicatie.** Als er geen reviewer is, heeft het
geen zin om de scriptpipeline te bouwen — dan produceert het systeem materiaal
dat niemand kan vrijgeven. Denk aan een docent van een islamitische school, een
imam die bereid is per video een half uur te lezen, of een student aan een
islamitische opleiding, tegen een vergoeding. Reken op €15–30 per video en
neem dat op in het budget; in optie D uit [`11`](11-nichedossier-islamitische-gezinscontent.md)
is daar bij 4,3 video's per maand geen ruimte voor binnen €100, dus dit is een
echte extra post waar je een keuze in moet maken.

Het dashboard krijgt hiervoor een aparte stap: **reviewer-goedkeuring vóór jouw
goedkeuring**, met per claim de bron ernaast en een veld voor opmerkingen die in
het auditlog belanden.

---

## 6. Wat deze poort uitdrukkelijk niet doet

- Hij **doet geen uitspraak over religieuze juistheid.** Hij controleert
  herkomst, volledigheid en formulering — of een claim een bron heeft en of hij
  als feit of als opvatting wordt gepresenteerd. Of iets waar is, is niet aan
  een taalmodel.
- Hij **kiest geen school of stroming.** Waar verschil bestaat, eist hij dat het
  verschil wordt benoemd.
- Hij **vervangt de reviewer niet.** Hij zorgt dat de reviewer een leesbaar
  dossier krijgt in plaats van een script van 1.400 woorden zonder verwijzingen.

---

## 7. Poortscore

| Onderdeel | Gewicht | Hard blokkerend |
|---|---:|---|
| Elke klasse-A-claim heeft soera + ayah + genoemde vertaling | 20 | **ja** |
| Elke klasse-B-claim heeft collectie + nummer + gradering | 25 | **ja** |
| Geen model-gegenereerde Arabische tekst of vertaling | 15 | **ja** |
| Geen figuratieve weergave waar `figure_free` geldt | 15 | **ja** |
| Klasse-C-claims zijn toegeschreven, niet gesteld | 10 | ja |
| Verschil tussen scholen benoemd waar relevant | 5 | nee |
| Onderscheid Koran/hadith versus latere bronnen | 5 | nee |
| Geen individueel religieus advies | 5 | **ja** |

Drempel: **100 op de blokkerende onderdelen, ≥ 90 totaal.** Er is geen
codepad dat deze waarden verlaagt.
