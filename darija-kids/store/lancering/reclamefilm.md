# De reclamefilm

Een advertentie van veertig seconden voor ouders, gemaakt met Steve AI
(`app.steve.ai/prompt`). Dit bestand is het script en de werkwijze.

## Drie besluiten vooraf

**1. Niet het promptvak, maar "Use my script".**

Het promptvak laat Steve AI bedenken wát de film zegt. Dat is handig voor een
uitlegfilmpje en verkeerd voor een advertentie: hier moet elke seconde iets
doen, en de volgorde is de boodschap. Eerst herkenning, dan de inzet, dan pas
de app. Geef je een onderwerp, dan krijg je bijna altijd de omgekeerde
volgorde — eerst het product, dan een reden.

**2. Steve AI mag de app niet natekenen.**

De app staat al op film. `npm run intro` neemt dertig seconden van de échte
app op, met het echte geluid — dezelfde marimba en darbuka die een kind na een
les hoort. Dat staat klaar in drie verhoudingen en zes talen:

    store/video/nl/intro-verhaal.mp4     1080×1920, voor advertenties en TikTok
    store/video/nl/intro-vierkant.mp4    1080×1080
    store/video/nl/intro-breed.mp4       1920×1080

Een nagetekende telefoon met verzonnen knoppen is op dat punt een downgrade,
en het is bovendien onwaar: wie dan de app opent, ziet iets anders.

**3. Let op wat "Marokko" wordt bij een beeldgenerator.**

Dit is het risico dat deze film kan verpesten. Vraag je om "a Moroccan
family", dan is er een reële kans dat je beeld terugkrijgt uit de Golfstaten:
mannen in een witte thobe, een moskee met een koepel die daar niet staat, een
skyline van glas. Voor dit merk is dat dodelijk — de hele belofte is dat het
over dít land en déze taal gaat, en niet over "Arabisch" in het algemeen.

Schrijf Marokko dus elke keer concreet voor, en keur elke scène af die het
niet is:

| Wel | Niet |
|---|---|
| Atlasgebergte, dorp van aarde en steen | woestijn met duinen als enige beeld |
| de medina van Fes, zellige, een houten deur | een moderne glazen moskee |
| djellaba, kaftan, een hoofddoek losjes geknoopt | thobe en ghutra |
| muntthee uit een hoge pot, tajine | shisha, dadels op een zilveren schaal |
| een grootmoeder met tatoeage op de kin | een generieke "oosterse" oma |

## Het script — veertig seconden

Te plakken in **Use my script**. De regels tussen haakjes zijn
beeldaanwijzingen, niet om voor te lezen.

---

**1. (0–4s)** *Beeld: een keukentafel. Een oma praat, een kind van een jaar of
negen kijkt naar haar en zegt niets. Warm licht, Noord-Marokkaans interieur.*

> Je kind verstaat oma wel.

**2. (4–8s)** *Beeld: het kind kijkt opzij naar een ouder, hulpzoekend. De
ouder begint te vertalen.*

> Antwoorden lukt alleen niet. Dus vertaal jij.

**3. (8–16s)** *Beeld: drie korte shots achter elkaar — een grootmoeder, een
ouder, een kind met een telefoon.*

> De eerste generatie spreekt de taal.
> De tweede verstaat hem.
> De derde kent er nog een woord of vier van.
> En die gaan over eten.

**4. (16–20s)** *Beeld: stilte, zwart, alleen tekst.*

> Zo gaat een taal weg. Niet met een knal.

**5. (20–28s)** *Beeld: hier komt `intro-verhaal.mp4` — de echte app. Geen
natekening.*

> Darijaforkids leert kinderen Darija. Geen schooltaal: de taal die thuis
> gesproken wordt. Vierhonderdtweeëndertig opnames, allemaal ingesproken door
> iemand die de taal spreekt. De eerste vier lessen kosten niets.

**6. (28–36s)** *Beeld: dezelfde keukentafel, maar nu in Marokko — een
binnenplaats, muntthee. Hetzelfde kind, iets ouder. Nu praat het kind, en de
oma lacht en antwoordt.*

> En dan, een zomer later, hoor je het.
> Niet perfect. Maar zelf.

**7. (36–40s)** *Beeld: logo, de acht-puntige ster, het adres.*

> Darijaforkids. Begin vandaag, gratis.
> darijaforkids.eu

---

## De korte versie — vijftien seconden

Voor TikTok en voor een advertentie waar je per seconde betaalt. Scène 1, 2,
5 en 7, en verder niets.

> Je kind verstaat oma wel. Antwoorden lukt alleen niet.
> *(de echte app, vier seconden)*
> Darijaforkids. De eerste vier lessen zijn gratis.
> darijaforkids.eu

## Wat er in de film mag staan, en wat niet

Alles hieronder is nagemeten en staat zo in de winkel. Verzin er niets bij —
een advertentie met een getal dat niet klopt is een probleem bij twee winkels
tegelijk, en bij de ACM.

| Mag | Waarom |
|---|---|
| 432 opnames, geen computerstem | geteld; het enige cijfer dat niemand kan naschrijven |
| de eerste vier lessen gratis | zo staat het in de app |
| geen account, geen advertenties | waar, en het is een echt verschil |
| 304 woorden en 100 zinnen | staat op de winkelpagina |
| alle 28 Arabische letters, met hun drie vormen | staat in de app |
| veertien filmpjes uit de geschiedenis van Marokko | staat in de app |

**Niet zeggen:** dat een kind "vloeiend" wordt, dat het "in X weken" lukt, of
iets over hoeveel kinderen het gebruiken. Het eerste is niet waar, het tweede
weten we niet, en het derde weten we nog niet.

## De werkwijze, stap voor stap

1. **Zorg dat de introfilm er is.** Hij staat in `.gitignore`, dus na een
   verse kloon moet hij opnieuw:

   ```
   npm run intro
   ```

2. **Open `app.steve.ai/prompt` en kies "Use my script"** — niet het
   promptvak.

3. **Plak het script hierboven**, zonder de beeldaanwijzingen tussen
   sterretjes als het veld die niet aankan. Die geef je dan per scène op.

4. **Kies een verticale verhouding (9:16).** Dat is waar ouders kijken, en het
   is dezelfde verhouding als `intro-verhaal.mp4`.

5. **Laat de scènes genereren en loop ze één voor één langs** met de tabel
   "Wel / Niet" hierboven ernaast. Reken erop dat je er een paar vervangt.

6. **Vervang scène 5 door de echte opname.** Upload `intro-verhaal.mp4` en zet
   die op de plek van het gegenereerde app-beeld. Dit is de stap die het
   verschil maakt tussen een advertentie die eruitziet als duizend andere, en
   een die het echte product laat zien.

7. **Zet de stem op Nederlands** en luister of de naam goed wordt
   uitgesproken: *Da-ri-ja-for-kids*. Een stem die "Darídja" zegt kost je het
   vertrouwen van precies het publiek dat je zoekt.

8. **Exporteer, en kijk hem één keer met het geluid uit.** Als de film dan nog
   werkt, werkt hij. De meeste mensen zien hem zo.

## Als je toch het promptvak wilt proberen

Dan is dit de tekst. Maar lees eerst besluit 1 hierboven.

```
A 40-second vertical video ad (9:16) for a children's app that teaches
Moroccan Darija, aimed at Moroccan-European parents.

Emotional arc, in this order: a child at a kitchen table understands their
grandmother but cannot answer her, so the parent translates. Then the stakes:
the first generation speaks the language, the second understands it, the third
knows four words and they are about food. Then the app. Then, one summer
later, the same child in Morocco answering the grandmother by themselves.

Setting must be specifically Moroccan, not generically Arab or Gulf: the Atlas
mountains, a village of earth and stone, the medina of Fes, zellige tilework,
a djellaba, mint tea poured from a high pot, a tagine. No desert dunes as the
only image, no glass-domed mosque, no thobe and ghutra.

Warm, quiet, unhurried. No upbeat corporate music. No stock-footage smiling.
The last line is spoken by the child, not the narrator.
```

## Waarom dit script zo loopt

De urgentie voor een ouder zit niet in wat de app kan. Die zit in de drie
regels van scène 3, en die zijn niet voor deze film bedacht: ze staan in deel
15 van *De sleutels van Marokko*, waar een jongen van dertien met
vierentwintig woorden drie weken bij zijn oma is.

Een ouder die dat hoort, telt zichzelf mee. Dat is het moment waarop hij
luistert naar wat daarna komt — en niet eerder.
