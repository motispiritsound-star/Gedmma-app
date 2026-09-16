# Naar de markt

[LAUNCH.md](LAUNCH.md) gaat over de formulieren: accounts, abonnementen,
uploads. Dit gaat over de mensen: waar ze zitten, in welke volgorde je ze
opzoekt, en wat je in welke week doet.

Eén regel vooraf, want hij bepaalt alles hieronder: **deze app wordt niet
gevonden, hij wordt doorgegeven.** Dit is geen categorie waarin iemand
rondkijkt — bijna niemand zoekt 's avonds op "darija app". Wat wél gebeurt is
dat één ouder hem in een familiegroep zet en er veertig openen. Alles wat je
doet moet dat makkelijker maken.

---

## 1. Waar je publiek zit

Ongeveer 6,2 miljoen Marokkanen wonen buiten Marokko. Zo liggen ze verdeeld:

| Land | Marokkaanse gemeenschap | Taal in de app | Wat het betekent |
|---|---|---|---|
| **Frankrijk** | ± 1,55 miljoen | Frans ✅ | verreweg het grootst, en het moeilijkst: veel concurrentie om aandacht |
| **Spanje** | ± 920.000 | Spaans ✅ | groot, jong, en vrijwel geen app die hier iets voor doet |
| *Italië* | ± 680.000 | — ❌ | **groter dan België en Nederland samen. De app spreekt geen Italiaans.** |
| **België** | ± 410.000 | Nederlands + Frans ✅ | twee talen in één land; Brussel en Antwerpen zijn de kern |
| **Nederland** | ± 390.000 | Nederlands ✅ | jouw thuisbasis, jouw netwerk, jouw eerste honderd gebruikers |
| **Duitsland** | ± 127.000 | Duits ✅ | klein, maar niemand bedient het |
| Verenigde Staten | ± 160.000 | Engels ✅ | klein, maar de grootste appwinkel ter wereld en de taal staat er al in |
| Verenigd Koninkrijk | kleiner nog | Engels ✅ | idem — het kost je niets om het aan te zetten |

Twee dingen springen eruit.

**Engels kost je niets.** De app, de winkelteksten, de film en de beelden staan
al in het Engels klaar. Zet bij het publiceren gewoon *alle* landen aan en laat
de Engelse listing het werk doen in het VK, de VS, Canada, Ierland en
Australië. Je hoeft er niets extra's voor te doen en je marketing richt zich er
niet op — het is gratis bereik.

**Italiaans is het grootste gat.** Italië heeft meer Marokkanen dan België en
Nederland samen en de app spreekt er geen woord. Dat is de eerstvolgende taal
die je toevoegt — niet Engels, want dat heb je al. Het is een dag werk: één
bestand in `src/i18n/`, één winkeltekst, en de beelden rollen er vanzelf uit.

---

## 2. De volgorde: één land eerst

Niet alles tegelijk aanzetten. De eerste weken gebruik je om te ontdekken wat
er stuk is, en dat doe je liever waar het je niets kost.

```
Week 1–2   België + Nederland        zacht, klein, je eigen netwerk
Week 3–4   Frankrijk + Spanje        de twee grote markten
Week 5      Duitsland + Engelstalig  wat er dan bij komt kost geen werk meer
```

Waarom klein beginnen: de eerste recensies bepalen de rest. Een app met vier
recensies van 5 sterren wordt beter gevonden én vaker geïnstalleerd dan
dezelfde app met nul. Die eerste vijftien recensies haal je uit mensen die je
kent, en dat kan maar één keer. Doe het dus pas als de app af is, niet tijdens
het uitproberen.

---

## 3. Zes weken vooruit: de aanvragen die het langst duren

Deze drie hebben een wachttijd die je niet kunt inhalen. Zet ze **vandaag** in
gang en doe de rest ondertussen.

| Wat | Waar | Duurt | Waarom nu |
|---|---|---|---|
| D-U-N-S-nummer | dnb.com, gratis | tot 30 dagen | zonder is je Play-account persoonlijk, en dan moet je eerst twaalf testers veertien dagen aan het werk houden (zie LAUNCH.md §1) |
| Domein + e-mail | je registrar | een uur | beide winkels willen werkende URL's vóór ze iets aannemen |
| **Featuring Nomination bij Apple** | App Store Connect → Featuring → Nominations | **6 à 8 weken vóór je releasedatum** | dit is het enige gratis kanaal dat je in één klap duizenden mensen kan opleveren |

Die laatste is onderbelicht en past precies bij deze app. Apple beoordeelt een
nominatie op zeven dingen: gebruikservaring, vormgeving, vernieuwing,
uniekheid, toegankelijkheid, **lokalisatie** en de kwaliteit van je
winkelpagina. Vijf talen, een eigen alfabetcursus, een dyslexiestand, geluid
zonder één audiobestand en een app die niets verzamelt — dat is precies het
soort verhaal waar redacteuren naar zoeken. Kies het type **App Launch**, en
schrijf in de beschrijving niet wat de app kan, maar waaróm hij bestaat: dat
tweede- en derdegeneratiekinderen hun oma wel verstaan maar niet terug kunnen
praten, en dat geen enkele taalapp Darija aanbiedt.

---

## 4. Wat er klaar moet staan vóór de eerste post

Dit staat allemaal al in de repo. Loop het na, vul aan wat mist:

| | Waar | Klaar? |
|---|---|---|
| Winkelteksten in 5 talen | `store/listing.<taal>.md` | ✅ |
| Titels, ondertitels, zoekwoorden | `store/keywords.md` | ✅ |
| Schermafbeeldingen, alle formaten | `npm run screenshots` | ✅ |
| Introfilm met geluid, 4 formaten | `npm run intro` | ✅ |
| Logo, profielfoto's, omslagen, flyer | `npm run brand` | ✅ |
| Feature graphic voor Play | `npm run marketing` | ✅ |
| Persbericht en citaten | `store/press-kit.md` | ✅ |
| Berichten per taal en per kanaal | `store/social.md` | ✅ |
| Handelaarsgegevens | `src/content/operator.ts` | ⬜ jij |
| Website online | [DEPLOY.md](DEPLOY.md) | ⬜ jij |

---

## 5. De socials: vier accounts, meer niet

Claim de namen nu, ook waar je voorlopig niets doet.

| Waar | Waarom | Wat erop komt |
|---|---|---|
| **Instagram** | waar de ouders zitten | reels, één letter per post, reacties beantwoorden |
| **TikTok** | waar het hardst gedeeld wordt | dezelfde reels, ander ritme |
| **YouTube** | alleen omdat Google Play een YouTube-link wil in plaats van een bestand | de introfilm, niet-vermeld, en verder niets |
| **Facebook** | niet voor de pagina, maar omdat je vanuit oudergroepen ergens naartoe moet linken | de introfilm en een vastgezette post |

Beelden staan klaar in `brand/social/`. Meer dan vier accounts is een belofte
die je niet waarmaakt: één dat leeft doet meer dan vier die stilstaan.

De volledige eerste week, dag voor dag, staat in [store/social.md](../store/social.md).

---

## 6. De lanceerweek

**Dag −3.** Zet de app op "vrijgeven op mijn datum", niet op automatisch. Dan
kun je de knop indrukken op een woensdag- of donderdagavond, wanneer mensen op
hun telefoon zitten, in plaats van op een dinsdagochtend om 4 uur.

**Dag 0 — je eigen mensen.** Familie-WhatsApp, vrienden met kinderen, je eigen
Instagram. Niet "download mijn app", maar: *"Ik heb dit voor mijn kinderen
gemaakt. Wat zegt jouw familie voor brood?"* Vraag geen recensie. Vraag een
reactie.

**Dag 1–2 — de groepen.** Facebook-groepen voor Marokkaanse ouders per stad.
Daar zitten duizenden mensen met exact dit probleem. Post in de taal van de
groep, met de vierkante versie van de film.

**Dag 3 — de plek waar niemand kijkt.** Scholen, moskeeën en buurthuizen die
weekendlessen Arabisch geven. Die zoeken al jaren materiaal voor Darija. Mail
ze de flyer uit `brand/print/` als PDF, met één zin: gratis te gebruiken in de
klas, geen account nodig. Dit levert langzaam op, maar het levert de meest
loyale gebruikers op die je krijgt.

**Dag 4 — de pers.** `store/press-kit.md` naar lokale en Marokkaans-Europese
media. Niet naar TechCrunch: naar de nieuwsbrieven en podcasts die deze
gemeenschap zelf leest.

**Dag 5–7 — recensies.** Nu pas. Stuur de vijftien mensen die je het beste
kent een persoonlijk bericht met de directe link naar de recensiepagina. Vijftien
recensies is het verschil tussen onzichtbaar en vindbaar.

---

## 7. De eerste dertig dagen

- **Lees elke recensie en beantwoord hem.** Beide winkels laten dat toe en
  beide wegen het mee. Bij een taalapp is de nuttigste recensie iemand die
  zegt dat zijn familie een woord anders zegt — dat is gratis redactiewerk.
  Verwerk het, en zeg dat je het verwerkt hebt.
- **Twee posts per week.** Niet meer. Wat werkt: één letter, één woord dat
  grappig anders is dan het Standaardarabisch, en één filmpje van een
  kinderhand die een letter overtrekt.
- **Kijk in de console waar mensen afhaken.** Niet in de app — die verzamelt
  niets, en dat houden we zo. Maar de winkels laten wel zien hoeveel mensen
  de pagina zien en hoeveel er installeren. Blijft dat percentage onder de
  20%, dan ligt het aan je eerste twee schermafbeeldingen, niet aan de app.
- **Verander niets in de eerste twee weken.** De verleiding is groot, maar je
  weet pas iets als er genoeg mensen langs zijn geweest.

---

## 8. Wat per land anders is

**Nederland.** Je thuisbasis. Hier haal je je eerste honderd gebruikers en je
eerste recensies uit je eigen netwerk. Gebruik dat, het kan maar één keer.

**België.** Eén land, twee talen. Vlaanderen is Nederlands, Brussel en Wallonië
Frans, en de gemeenschappen overlappen nauwelijks. Post in Antwerpen en Gent in
het Nederlands en in Brussel in het Frans — dezelfde app, twee gesprekken.

**Frankrijk.** Het grootste publiek en de scherpste toon. Twee dingen: reclame
gericht op Franse consumenten moet in het Frans (dat regelt de app al), en het
woord dat mensen daar zelf gebruiken is vaker *darija* dan *marocain* — die
volgorde staat al goed in `store/keywords.md`.

**Spanje.** Groot, jong, en er is bijna niets. De gemeenschap zit geconcentreerd
in Catalonië, Andalusië en Madrid. Let op de spelling: in het Spaans schrijft
men vaker *dariya* dan *darija*, en beide staan in de zoekwoorden.

**Duitsland.** Klein publiek, maar niemand doet er iets. Duitsers zijn
gevoeliger voor privacy dan wie ook — en "geen account, geen advertenties,
niets verlaat het toestel" is hier geen bijzin maar je eerste zin. Zet het
bovenaan de Duitse winkeltekst.

**Engelstalig (VK, VS, Canada).** Aanzetten en verder niets doen. Als het
aanslaat, zie je dat vanzelf in de cijfers, en dan pas ga je er moeite in
steken.

---

## 9. Wat je niet moet doen

- **Adverteren in de eerste maand.** Je weet nog niet wat werkt, dus je koopt
  ruis. Als je later toch adverteert: Apple Search Ads op je eigen naam kost
  bijna niets en houdt concurrenten van je pagina af. Dat is de enige
  advertentie die vanaf dag één verdedigbaar is.
- **Alle landen tegelijk aanzetten met een half afgemaakte pagina.** Je
  verbrandt de enige kans op eerste recensies.
- **Beloven dat een kind vloeiend wordt.** Dat is niet waar en het valt op.
- **Wachten tot het perfect is.** De app is af. Wat er nog bij komt, komt bij
  mensen die hem al gebruiken.
