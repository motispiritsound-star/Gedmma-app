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

## Het draaiboek — veertig seconden, scène voor scène

Zeven scènes. Per scène staat hier de tijdcode, wat de stem zegt, wat er in
beeld geschreven staat, en de beeldprompt in het Engels — want daar genereert
Steve AI op, en een Nederlandse aanwijzing levert daar niets op.

**Over het tempo.** De Nederlandse stem zit op ongeveer 2,4 woorden per
seconde; sneller klinkt gehaast en bij een advertentie over taalverlies is
gehaast het verkeerde gevoel. Daarom staat bij elke scène hoeveel woorden erin
passen. Schrijf je iets om, tel dan opnieuw. Zevenenzeventig woorden in veertig seconden is de
hele begroting — minder dan in de eerste versie, omdat de app er nu zelf vijf
seconden lang voor zichzelf spreekt.

---

### Scène 1 — 0:00 tot 0:04 · 5 woorden

**Stem:** Je kind verstaat oma wel.

**In beeld:** *Je kind verstaat oma wel.*

**Beeldprompt:**
```
A Moroccan grandmother in her seventies sits at a kitchen table talking warmly
to her nine-year-old grandchild. She wears a simple house kaftan and a loosely
tied headscarf. The child listens closely and says nothing. Low warm afternoon
light, a glass of mint tea on the table. Northern Moroccan home interior with
plain plastered walls. Documentary feel, no studio lighting, no smiling at the
camera.
```

### Scène 2 — 0:04 tot 0:07 · 6 woorden

**Stem:** Antwoorden lukt alleen niet. Dus vertaal jij.

**In beeld:** *Antwoorden lukt alleen niet.*

**Beeldprompt:**
```
The same kitchen table, seconds later. The child turns away from the
grandmother and looks up at a parent standing beside the table, asking for
help with their eyes. The parent begins to speak. The grandmother waits. Same
warm light, same documentary feel.
```

### Scène 3 — 0:07 tot 0:16 · 25 woorden

**Stem:** De eerste generatie spreekt de taal. De tweede verstaat hem. De
derde kent er nog een woord of vier van. En die gaan over eten.

**In beeld:** pas bij het laatste portret: *Zo gaat een taal weg.*

**Beeldprompt:** drie korte shots achter elkaar, elk ongeveer drie seconden.
```
Three short portrait shots in sequence, same warm documentary style.
One: an elderly Moroccan woman with a small traditional chin tattoo, speaking,
mid-sentence, hands moving.
Two: a woman in her forties in everyday European clothing, listening, not
speaking.
Three: a boy of about twelve looking at a phone, earbuds in, not speaking at
all.
Each shot framed the same way, so they read as one family across three
generations.
```

De zin over de knal is uit de film gehaald als aparte scène met een lege stoel
erin. Hij staat nu in beeld onder het derde portret: dezelfde zin, vier
seconden minder, en die vier seconden gaan naar de app.

---

### Scène 4 — 0:16 tot 0:30 · de app · 24 woorden

**Veertien seconden, en geen enkele daarvan wordt gegenereerd.**

In de eerste versie kreeg de app acht van de veertig seconden — twintig
procent. De controlelijst van dit document zegt: laat de film zien aan iemand
die de app niet kent en vraag daarna wat de app doet. Met acht seconden zakt
hij voor zijn eigen toets.

Er is bovendien veel meer materiaal dan één blok. `intro-verhaal.mp4` bestaat
uit **zeven schermen van de echte app, elk 3,2 seconde**, met een vinger die
tikt: het pad, de letters, een les, de geschiedenisfilmpjes, schrijven, een
woord. Daar knip je drie verschillende beats uit.

**4a — 0:16 tot 0:20 · het scherm met de Arabische letters**

> Darijaforkids leert kinderen Darija — de taal die thuis gesproken wordt.

**In beeld:** *Alle 28 letters, met hun drie vormen.*

**4b — 0:20 tot 0:25 · een woord dat wordt uitgesproken**

> *(geen stem — laat het geluid van de app zelf staan)*

**In beeld:** *432 opnames. Geen computerstem.*

Dit is het belangrijkste stuk van de hele film, en het bestaat uit vijf
seconden waarin de verteller zijn mond houdt.

"Geen computerstem" is een bewering zolang je hem uitspreekt. Laat je in
plaats daarvan een echte stem een Darija-woord zeggen en een kind het
nazeggen, dan is het geen bewering meer maar iets wat de kijker zelf hoort.
Wie twijfelt of dit weer zo'n app met een robotstem is, heeft zijn antwoord
zonder dat jij het hoeft te geven.

**4c — 0:25 tot 0:30 · het pad met de units**

> Van de eerste letter tot de souq. De eerste vier lessen zijn gratis.

**In beeld:** *Geen account. Geen advertenties.*

---

### Scène 5 — 0:30 tot 0:36 · 11 woorden

**Stem:** En dan, een zomer later, hoor je het. Niet perfect. Maar zelf.

**In beeld:** niets.

**Beeldprompt:**
```
A courtyard in Morocco in summer: whitewashed walls, zellige tilework on a low
bench, a pot of mint tea. The same grandmother from the opening, and the same
child, now a year older. This time the child is the one talking, and the
grandmother laughs and answers. Bright natural daylight, shade from a vine
overhead. Documentary feel, no posing.
```

De laatste woorden hoor je het kind zeggen, niet de verteller. Als Steve AI
dat niet kan, laat de stem dan stil vallen na "hoor je het" en zet *Niet
perfect. Maar zelf.* in beeld.

### Scène 6 — 0:36 tot 0:40 · 6 woorden

**Stem:** Darijaforkids. Begin vandaag, gratis. darijaforkids.eu

**In beeld:** het logo, de achtpuntige ster, en `darijaforkids.eu`

**Beeld:** gebruik `brand/social/profielfoto.png` of een schermafdruk uit
`store/screenshots/nl/`. Niet laten natekenen: een logo dat bijna klopt is
erger dan geen logo.

---

## Hetzelfde, in het Frans

Je op een na grootste taalgroep, en de introfilm staat al klaar als
`store/video/fr/intro-verhaal.mp4`. Dezelfde zeven scènes, dezelfde
beeldprompts, alleen de stem en de tekst in beeld veranderen.

| Scène | Stem | In beeld |
|---|---|---|
| 1 | Ton enfant comprend mamie. | *Ton enfant comprend mamie.* |
| 2 | C’est répondre qui ne vient pas. Alors c’est toi qui traduis. | *C’est répondre qui ne vient pas.* |
| 3 | La première génération parle la langue. La deuxième la comprend. La troisième en connaît encore quatre mots, et ils portent sur la nourriture. | — |
| 4 | C’est comme ça qu’une langue s’en va. Pas dans un fracas. | *C’est comme ça qu’une langue s’en va.* |
| 5 | Darijaforkids apprend le darija aux enfants — la langue qu’on parle à la maison. 432 enregistrements, aucune voix de synthèse. Les quatre premières leçons sont gratuites. | *432 enregistrements, aucune voix de synthèse.* |
| 6 | Et puis, un été plus tard, tu l’entends. Pas parfait. Mais tout seul. | — |
| 7 | Darijaforkids. Commence aujourd’hui, gratuitement. darijaforkids.eu | `darijaforkids.eu` |

De regels in de tabel zijn niet vertaald voor deze film: het zijn de koppen
van de campagneplaten uit `scripts/make-social.mjs`, zodat de advertentie en
de platen dezelfde zinnen gebruiken. Duits, Spaans en Italiaans staan daar
ook, dus de resterende drie talen zijn op dezelfde manier te maken zonder
nieuwe tekst te verzinnen.

## En in het Engels

`store/video/en/intro-verhaal.mp4` staat er ook — `npm run intro` maakt alle
zes de talen in één keer.

| Scène | Stem | In beeld |
|---|---|---|
| 1 | Your child understands grandma. | *Your child understands grandma.* |
| 2 | It's answering that doesn't come. So you translate. | *It's answering that doesn't come.* |
| 3 | The first generation speaks the language. The second understands it. The third still knows about four words of it, and they are about food. | — |
| 4 | That is how a language goes away. Not with a bang. | *That is how a language goes away.* |
| 5 | Darijaforkids teaches children Darija — the language spoken at home. 432 recordings, no computer voice. The first four lessons are free. | *432 recordings, no computer voice.* |
| 6 | And then, one summer later, you hear it. Not perfect. But on their own. | — |
| 7 | Darijaforkids. Start today, for free. darijaforkids.eu | `darijaforkids.eu` |

**Eén ding om te weten voor je dit inspreekt.** De campagnekop in
`make-social.mjs` luidt *"It is answering that does not come"*, en dat is een
letterlijke vertaling van het Nederlands die in het Engels houterig klinkt —
op een plaat lees je eroverheen, in een gesproken zin hoor je het meteen. In
de tabel hierboven staat daarom *"It's answering that doesn't come"*.

Dat is een verschil van twee samentrekkingen, dus de plaat en de film botsen
niet zichtbaar. Wil je ze letterlijk gelijk hebben, pas dan de Engelse regel
in `scripts/make-social.mjs` aan en zet de platen opnieuw. Doe dat dan wel in
één keer, want de kop staat ook op de winkelpagina's.


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

## De instellingen in Steve AI

Het scherm *Set Video Preferences* bepaalt meer dan het lijkt. Zo moeten ze
staan, met de reden erbij.

| | Zetten op | Waarom |
|---|---|---|
| Modus | **Generative AI** | je hebt per scène sturing nodig op wat Marokkaans beeld is; stockbeeld kies je niet, dat krijg je |
| Video Size | **Vertical** | hetzelfde formaat als `intro-verhaal.mp4`, en het formaat waarin ouders kijken. Staat hij op Horizontal, dan moet je later alles herkaderen |
| Video Type | Generative Clips | let op je tegoed, zie hieronder |
| Language | **Dutch** | |
| Voice Over | **een Nederlandse stem** | |
| BGM | **Disable** | |
| Category | Product Launch | |
| Subtitles | **Enable** | de meeste mensen kijken zonder geluid |

**De stem is de valkuil.** Language kan op Dutch staan terwijl bij Voice Over
een Engelse stem geselecteerd is — die combinatie leest je Nederlandse script
met een Engelse mond. Kijk dus niet of er "Dutch" staat bij Language, maar of
er een Nederlandse naam onder de stem staat. En luister hem één keer af op de
naam: *Da-ri-ja-for-kids*.

**Muziek uit, en dat is geen vergissing.** `intro-verhaal.mp4` heeft zijn
eigen geluid: de marimba en darbuka van de app zelf. Zet je daar BGM
overheen, dan vechten twee muzieksporen in scène 4 — precies de scène waar de
kijker de echte stem moet horen die een Darija-woord zegt. Eén geluidswereld,
en die komt uit het product.

**Het tegoed is je echte beperking.** Bij Generative Clips staat hoeveel
seconden je nog hebt. Deze film heeft ongeveer 26 seconden gegenereerd beeld
nodig (scène 1, 2, 3 en 5); scène 4 en het eindkaartje komen van je eigen
bestanden. Elke keer dat je een scène opnieuw laat genereren, gaat dat van
hetzelfde tegoed af. Schrijf de beeldprompt dus goed vóór je op genereren
drukt, in plaats van te hopen dat de derde poging beter uitpakt.

## Het logo en de app: uploaden, nooit genereren

Dit is de belangrijkste regel van dit hele document, en hij heeft één zin
nodig: **een beeldgenerator maakt geen logo en geen app-scherm, hij maakt iets
wat erop lijkt.** Een logo dat bijna klopt is erger dan geen logo, en een
nagetekend app-scherm met verzonnen knoppen belooft iets anders dan wat de
kijker krijgt als hij downloadt.

Alles wat je nodig hebt staat al op je schijf. Upload deze bestanden in Steve
AI en zet ze op de plek van de scène, in plaats van er een prompt voor te
schrijven.

| Waarvoor | Bestand |
|---|---|
| Scène 4, de hele app (14 s) | `store/video/nl/intro-verhaal.mp4` |
| Scène 6, het eindkaartje | `brand/social/profielfoto.png` |
| Los app-beeld, als je een still wilt | `store/screenshots/nl/iphone-65/` — tien schermen |
| Een kant-en-klare plaat met kop erop | `brand/social/posts/nl/1-oma-verhaal.png` |

`brand/` staat in `.gitignore`, dus na een verse kloon zijn die twee er niet.
Dan eerst:

```
npm run social
```

```
npm run intro
```

**Hoe het uploaden gaat:** na *Generate Script* kom je in de editor, en daar
zit een paneel voor eigen media. Upload het bestand daar en sleep het op de
scène waar het gegenereerde beeld staat. Ziet dat er bij jou anders uit, stuur
dan een schermafbeelding — dan wijs ik het aan in plaats van te raden.

**En laat scène 4 niet eerst genereren om hem daarna te vervangen.** Dat kost
je tegoed voor beeld dat je weggooit.

## De controlelijst voor je exporteert

Loop deze langs. Elk punt is iets wat eerder is misgegaan bij iemand anders,
en ze kosten samen vijf minuten.

- [ ] **Scène 5 is de echte opname** en geen gegenereerde telefoon.
- [ ] **Elke scène is Marokkaans**, langs de tabel hierboven gelegd. Geen
      thobe, geen glazen koepel, geen duinen als enige beeld.
- [ ] **De oma in scène 1 en die in scène 5 zijn dezelfde persoon.** Een
      beeldgenerator houdt een gezicht niet vanzelf vast over scènes heen, en
      als de oma aan het eind iemand anders is, valt het hele verhaal om.
      Hetzelfde voor het kind.
- [ ] **De naam wordt goed uitgesproken:** *Da-ri-ja-for-kids*. Een stem die
      "Darídja" zegt kost je precies het publiek dat je zoekt.
- [ ] **Het adres onderaan is leesbaar op een telefoon**, niet alleen op je
      scherm van 27 inch.
- [ ] **Geen enkel cijfer dat niet in de tabel hierboven staat.**
- [ ] **Eén keer bekeken met het geluid uit.** Zo zien de meeste mensen hem.
      Werkt hij dan nog, dan werkt hij.
- [ ] **Eén keer bekeken door iemand die de app niet kent.** Vraag daarna wat
      de app doet. Komt daar iets anders uit dan "Darija leren", dan is scène
      5 te kort.

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

In alle drie de talen hierboven staat die regel **woord voor woord zoals hij
in het boek staat**, en dat is met opzet. Wie de advertentie ziet en later het
boek leest, komt dezelfde zin tegen. Verander hem hier niet zonder hem daar
ook te veranderen — de test op alineatellingen vangt dat niet, want dit gaat
over de bewoording.

Een ouder die dat hoort, telt zichzelf mee. Dat is het moment waarop hij
luistert naar wat daarna komt — en niet eerder.
