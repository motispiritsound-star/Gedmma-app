# Darijaforkids · قدّام

**Marokkaans-Arabisch (Darija) leren, voor kinderen en jongeren — in het
Nederlands, Frans, Duits, Spaans, Italiaans en Engels.**

Darijaforkids is één app die drie dingen tegelijk is: een website die uitlegt waar het
over gaat, een installeerbare leer-app die daarna offline werkt, en — via
Capacitor — dezelfde app voor de App Store en Google Play. Geen account, geen
advertenties: alle voortgang staat op het apparaat van het kind zelf. Het
enige dat het toestel ooit verlaat is een e-mailadres dat een ouder er zelf
achterlaat, achter de ouderpoort, met een vinkje dat leeg begint.

Bedoeld voor Marokkaanse gezinnen in Nederland, België, Frankrijk, Duitsland,
Oostenrijk, Zwitserland en Spanje — en voor iedereen daarbuiten die Darija wil
leren.

**Darijaforkids** (بلادي) is wat Marokkanen in het buitenland Marokko noemen: *mijn
land*. De taal die erbij hoort, leer je hier.

```
darija-kids/
  src/content/       de leerstof: woorden, units, letters, verhalen
    lang/            dezelfde leerstof in het Frans, Duits, Spaans, Italiaans en Engels
  src/i18n/          de interface in zes talen, en de privacyverklaring
  src/engine/        herhaalsysteem, oefeninggenerator, voortgang, geluid
  src/ui/            bouwstenen, de oefeningen en de ronde-loop
  src/pages/         de schermen, inclusief de publieke website
  scripts/           iconen, schermafbeeldingen en winkelbeelden renderen, tests
  public/            fonts, iconen, manifest, service worker
  android/           het Android-project (Capacitor)
  store/             winkelteksten, persmap, socialposts, zoekwoorden
  docs/LAUNCH.md     de lanceerlijst: van inschrijving tot eerste downloader
```

## Aan de praat

Node 20 of nieuwer.

```bash
npm install
npm run dev        # http://localhost:4310
npm run build      # statische site in dist/
npm run preview    # de gebouwde site op :4173
```

Tests en controles:

```bash
npm test           # 63 tests: leerstof, vertalingen, herhaalsysteem, oefeningen, betaalgrens
npm run typecheck
npm run smoke      # klikt de gebouwde app door in een echte browser (na `npm run preview`)
npm run soundcheck  # rendert elke klank en meet of hij écht geluid maakt (na `npm run dev`)
npm run screenshots # fotografeert de app in alle winkelformaten (na `npm run preview`)
npm run marketing   # tekent de feature graphic en de socialbeelden
npm run icons      # tekent de iconen en het deelplaatje opnieuw
```

## Wat er in zit

| | |
|---|---|
| **6 interfacetalen** | Nederlands, Frans, Duits, Spaans, Italiaans en Engels — interface, betekenissen, uitleg, tips en verhalen |
| **Gratis beginnen** | het alfabet en de eerste vijf units zijn open; de rest is één aankoop via de App Store of Google Play |
| **17 units** | van het Arabische alfabet en *Salam!* tot afdingen op de souq, oplopend van A0 naar A2 |
| **304 woorden** | elk met Arabisch schrift, Latijnse schrijfwijze en een betekenis in alle vijf de talen |
| **100 zinnen** | twee aan het eind van elke les, gemaakt van de woorden die die les net leerde — horen, bouwen, herkennen |
| **19 soorten oefeningen** | kiezen, luisteren, schrift herkennen, koppelen, zin bouwen, typen, dictee, natekenen, inspreken, vijf soorten lettervragen, vier soorten zinsvragen, en een introkaart per nieuw woord, letter en zin |
| **Dagmissies** | vijf missies per dag — lessen, goede antwoorden, herhalen, zinnen en een bonusronde — met edelstenen die je zelf ophaalt |
| **Filmpje na de les** | acht seconden Marokko, getekend in SVG: de souq, de Sahara, Chefchaouen, de kust en een feest, elk met een eigen deuntje in hijaz |
| **34 klanken** | elke knop, elk antwoord, elke beloning en de quiz — gesynthetiseerd, geen enkel geluidsbestand in de build |
| **28 letters** | het hele Arabische alfabet, met de vorm van elke letter aan begin, midden en eind — unit 1 van het pad, in groepjes van vier |
| **4 verhalen** | gesprekken waarin je op elke zin kunt tikken voor de vertaling, met vragen erna |
| **3 spellen** | tijdrace, geheugenspel en letterspel — ze gebruiken de woorden die je al zag |
| **5 bonusrondes** | schrijven, dictee, zinnensmid, marathon en spreekuur: ze worden gemaakt van wat je al kent, dus ze raken niet op |

### De bonus: wat er is als er niets meer is

Zeventien units houden een keer op. Een taal niet, en een app die op de dag van
de laatste les klaar is, is de dag daarna weg. Daarom staat naast het pad een
tweede stapel: vijf bonusrondes die uit je eigen voortgang worden gemaakt, elke
keer anders, en die dezelfde kaarten beoordelen als een gewone les. De vijfde
dagmissie is er één doen.

| | |
|---|---|
| ✍️ **Schrijven** | Trek de letter over een grijze voorbeeldletter heen, met je vinger. Ook de vorm aan het begin, in het midden en aan het eind — de vorm die je in een woord echt nodig hebt. Geen handschriftherkenning: er wordt geteld hoeveel van de letter je raakte en hoeveel van je lijn ernaast lag. Uit te zetten bij Instellingen, want tekenen op glas is niet ieders hand. |
| 👂 **Dictee** | Je hoort een woord en ziet niets. Schrijf op wat je hoort. |
| 🧩 **Zinnensmid** | Bouw zinnen uit losse woorden en herken ze terug aan hun klank. |
| ⚡ **Marathon** | Dertig vragen door alles heen, met de drums van een checkpoint eronder. Wat blijft staan is je langste reeks goede antwoorden. |
| 🎤 **Spreekuur** | Zes woorden hardop, als het toestel kan luisteren. |

Bovenaan staat de enige eerlijke voortgangsbalk in de app: **meesterschap** telt
wat nú stevig staat *en* nog niet terug moet. Hij zakt vanzelf als je een tijd
wegblijft. Dat is geen straf — het is hoe een taal werkt, en het is de reden dat
dit scherm nooit af is.

## Hoe het leert

**Spaced repetition.** Elk woord is een kaartje met een eigen ritme
(`src/engine/srs.ts`, een vereenvoudigde SM-2). Goed beantwoord schuift het
verder weg; fout gaat het meteen terug naar voren, zonder alles kwijt te raken
wat je er al van wist. Het herhaalscherm pakt telkens de zwakste kaartjes die
aan de beurt zijn.

**Een ronde is gemengd.** `buildRound()` maakt van een les een reeks van
maximaal veertien oefeningen: eerst een introkaart voor elk nieuw woord, dan
herkennen, dan een koppelraster om het ritme te breken, en tot slot produceren —
typen, een zin bouwen of hardop zeggen. Hetzelfde woord komt op twee manieren
langs. De opbouw is deterministisch (één seed per les), zodat hij te testen is.

**Eerst het schrift.** Unit 1 is het alfabet, in groepjes van vier of vijf
letters die hetzelfde skelet delen — ب ت ث zijn hetzelfde streepje met andere
puntjes. Elke letter komt langs met zijn klank en zijn drie vormen, en wordt
daarna teruggevraagd: welke letter hoor je, hoe heet deze, en welke vorm hoort
bij het midden van een woord. Wie daarna aan de woorden begint, leest ze in
plaats van ze te herkennen als plaatje.

**En dan een zin.** Elke les eindigt met twee zinnen die van diezelfde woorden
gemaakt zijn (`src/content/sentences.ts`). Je hoort de zin eerst in zijn geheel,
bouwt hem daarna terug uit een woordenbankje, en kiest tot slot welke zin erbij
hoort. Woordvolgorde en de kleine plakwoordjes van het Darija leer je niet van
losse woorden.

**Beloningen die je ziet.** XP en edelstenen worden uitbetaald op het moment
zelf: bij elk goed antwoord vliegt er een `+2 XP` omhoog, de vlam in de hoek
telt je reeks mee, en elke vijfde op rij levert een edelsteen op. Daarboven
staan vier dagmissies (`src/ui/Quests.tsx`) waarvan er één altijd over herhalen
gaat — het deel van taalleren dat nooit dringend voelt en het altijd is.

**En een filmpje.** Wie een les afrondt krijgt acht seconden Marokko
(`src/ui/Film.tsx`): thee inschenken op de souq, de duinen door, de blauwe
straten van Chefchaouen, een bal aan de kust, of een feest met de darbuka. Het
is getekend in SVG en niet gefilmd — geen bestand om te downloaden, werkt in
het vliegtuig — met per scène een eigen deuntje in hijaz en een Darija-woord
dat Fnek aan het eind uitspreekt. Overslaan kan met één tik, en helemaal uit
kan bij instellingen.

**Na een toets iets anders: een kort fragment uit de geschiedenis.** Elk
checkpoint levert er een op (`src/content/history.ts`, `src/ui/HistoryCard.tsx`,
`src/ui/HistoryScene.tsx`): veertien kaarten in chronologische volgorde, van
Walili — het Romeinse Volubilis — tot het Tifinagh dat in 2011 officieel werd,
met Fatima al-Fihri, Tariq ibn Ziyad, al-Idrisi, Ibn Battuta en de leeuw van
de Atlas ertussen.

Het is een filmpje en geen pagina. Een bewegend tafereel — zes decors dragen
veertien kaarten, want een kust die terugkomt voor Tariq, al-Idrisi, al-Wazzan
én de Amerikaanse schepen gaat op een plek lijken — met de tekening die zichzelf
lijn voor lijn maakt, en een verteller die het voorleest in de taal waarin de
app staat (`narrate` in `src/engine/audio.ts`). Drie beats: waar en wanneer, dan
het verhaal, dan *wist je dat?* — de regel die aan tafel wordt naverteld. Een
beat eindigt wanneer de verteller klaar is, dus het tempo is het tempo van het
vertellen; een toestel zonder stem voor die taal leest niets voor en valt terug
op ongeveer de snelheid waarop je het leest. De tekst staat er sowieso, en het
fragment wacht nooit op een stem die niet komt. Voorlezen kan uit bij
instellingen, en in de verzameling zit onder elke kaart een knop om hem opnieuw
te laten voorlezen.

De kaart blijft: `/geschiedenis` bewaart de hele verzameling, ook de sloten die
nog dicht zitten. Alle teksten staan in zes talen en houden zich aan één regel —
alleen wat vaststaat, geen politiek van vandaag, en waar een verhaal een verhaal
is staat dat erbij. Tijdens het bouwen is elk fragment los te bekijken op
`/kaart/:id`, net zoals `/film/:scene` al bestond.

**En de vlag zit in de vormtaal.** De khatim — de vijfpuntige ster uit de
Marokkaanse vlag, één doorlopende lijn die zichzelf vijf keer kruist — is de
ster geworden waarmee een les wordt beoordeeld (`src/ui/Khatim.tsx`). Het rood
en groen van de vlag staan als `alam` en `khatim` in de tokens en dragen het
geschiedenisscherm. `npm run historycheck` speelt een echte toets uit, kijkt het
fragment beat voor beat uit, leest de verzameling in alle zes talen na en zet
er een neptoestel met stemmen naast om te controleren dat de verteller de
juiste taal pakt.

## Hoe het klinkt

Alle 34 klanken worden gesynthetiseerd (`src/engine/instruments.ts`): een
getokkelde snaar, een darbuka, een marimba, een bel, applaus. Er zit geen enkel
geluidsbestand in de build, en toch klinkt elke knop anders dan de volgende —
vooruit gaat omhoog, terug gaat omlaag, "snap ik" zijn twee tonen die bij
elkaar horen.

Ze staan los van de speler, want er zijn twee manieren naar buiten. Normaal
speelt `src/engine/audio.ts` ze live. Maar Web Audio is op een telefoon
kwetsbaar: iOS geeft de geluidssessie na elk uitgesproken woord geschorst
terug, en een iPhone met het schuifje op stil speelt wél de uitspraak (die gaat
via de spraakmotor) en géén enkel effect. Daarom kan dezelfde klankenbank ook
vooraf gerenderd worden — offline, wat geen browser blokkeert — naar kleine
WAV'jes die via gewone `<audio>`-elementen naar buiten gaan, over het
mediakanaal, langs het schuifje heen. Dat staat als schakelaar bij
instellingen, en springt vanzelf aan als de mixer weigert te starten.

Of een klank écht geluid maakt is niet iets om aan te nemen:
`npm run soundcheck` rendert ze allemaal en meet piek en gemiddelde. Een klank
die naar stilte rendert is een kapotte klank, wat de code ook beweert.

**Antwoorden mogen slordig zijn.** Er is geen officiële spelling voor Darija in
Latijnse letters, dus `checkTyped()` is streng op het woord en soepel op de
schrijfwijze: `3afak` en `afak` zijn allebei goed, `sh7al` en `shhal` ook, en
één typefout heet *bijna* in plaats van fout. Het Arabische schrift intypen mag
net zo goed.

**Fouten kosten niets als jij dat wilt.** Hartjes kunnen uit (aanrader voor
jonge kinderen), en herhalen kost sowieso nooit een hartje.

## Vijf talen

Het Darija zelf verandert nooit: het Arabische schrift en de Latijnse
schrijfwijze zijn overal hetzelfde. Wat meewisselt is alles wat een kind in
zijn eigen taal leest.

Nederlands is de bron (`src/content/words.ts`, `curriculum.ts`, `stories.ts`);
Frans, Duits, Spaans, Italiaans en Engels zijn **packs** (`src/content/lang/`) die de betekenissen,
de weetjes, de titels op het pad en de verhalen overschrijven. De interface
staat apart in `src/i18n/`, waar `Strings` is afgeleid van het Nederlandse
bestand: een vergeten sleutel in het Frans is een compileerfout, geen Nederlands
woord op het scherm van een Frans kind.

De taal wordt bij de eerste start voorgesteld op basis van het apparaat — een
telefoon in Frankrijk staat op Frans, een in Vlaanderen op Nederlands, een in
Wallonië op Frans — in een welkomstscherm waarin je hem meteen kunt wijzigen.
Spreekt het toestel een taal die wij niet hebben, dan beslist het land: Marokko,
Algerije en Tunesië krijgen Frans, Oostenrijk en Zwitserland Duits. Daarna staat
de keuze bij Instellingen en op de website in de bovenbalk. Er is dus één app
voor alle landen; alleen de winkelvermelding zet je per taal klaar. De tests bewaken dat elke taal
compleet is: gelijke sleutels, een betekenis en een weetje per woord, elke unit,
les, tip en verhaalregel vertaald.

## Geluid zonder audiobestanden

Er zit geen enkele mp3 in deze app, en toch klinkt hij. De effecten worden ter
plekke gemaakt met de Web Audio API (`src/engine/audio.ts`): een getokkelde
snaar van vier boventonen, een handtrom met een diepe *dum* en een droge *tek*,
en een klok via frequentiemodulatie. De melodietjes staan in **hijaz op D**, de
toonladder achter een groot deel van de Marokkaanse muziek — daardoor klinkt
een afgeronde les als iets dat bij deze app hoort. Een fout krijgt een lage,
zachte trom in plaats van een zoemer: een fout is geen alarm.

Browsers houden een pagina stil tot iemand hem heeft aangeraakt, en een
ingebed venster is nog strenger. De eerste tik of toetsaanslag opent daarom de
mixer en warmt de spraakmotor op, zodat het eerste woord dat een kind
tegenkomt ook echt te horen is.

De **uitspraak** komt van de spraaksynthese die al op het apparaat staat, met
voorkeur voor een Marokkaanse stem en dan de rest van de Arabische stemmen. Bij
instellingen kies je zelf een stem uit de lijst en test je hem.

Twee eerlijke beperkingen, die de app zelf ook benoemt:

- Op de meeste apparaten spreekt de Arabische stem **Modern Standaard Arabisch**,
  geen Marokkaans. Goed genoeg om een woord te herkennen, geen vervanging voor
  familie horen praten.
- Staat er **helemaal geen Arabische stem** op het apparaat, dan leent Darijaforkids een
  Europese stem en herschrijft hij de Latijnse schrijfwijze zodat díe stem hem
  ongeveer goed leest. Elke taal spelt dezelfde klank anders, dus de herschrijving
  hangt af van de gevonden stem: een Franse stem krijgt `choukran`, een Duitse
  `schukran`, een Nederlandse `sjoekran`. Frans staat vooraan in de voorkeurslijst
  omdat het van de Europese talen het dichtst bij Darija komt. Het leerpad zegt
  eenmalig dat dit gebeurt en hoe je een echte Arabische stem installeert, en je
  kunt het uitzetten.

Spreekoefeningen gebruiken de spraakherkenning van de browser. In Chrome gaat de
opname daarvoor naar Google; wie dat niet wil, zet spreekoefeningen uit. Dat
staat ook zo op de ouderpagina.

## Wat het kost

Het alfabet en de eerste vijf units zijn gratis en blijven gratis — genoeg om jezelf voor te
stellen, je familie te beschrijven en tot honderd te tellen. De rest van de
cursus hoort bij **volledige toegang**: een paar dagen gratis, daarna
**€ 59,99 voor een heel jaar** — € 5,00 per maand — of **€ 6,99 per maand**,
beide inclusief btw en opzegbaar. De App Store en Google Play regelen de
proefperiode, de afschrijving en de btw; de producten heten
`app.darijaforkids.yearly` en `app.darijaforkids.monthly`.

Los daarvan is er één ding te koop dat geen abonnement is: **het e-boek**, de
hele cursus op papier — alle 28 letters met hun drie vormen, alle 17 units met
de grammatica-uitleg, alle woorden en alle zinnen. **€ 14,99, één keer**, en bij
het jaarabonnement zit het erbij. Het boek wordt met `npm run ebook` uit
dezelfde bestanden gezet als de lessen, staat als PDF in `public/ebook/` in alle
zes talen, en blijft van wie het kocht — ook als het abonnement stopt.

De grens tussen gratis en betaald staat op één plek:
`FREE_UNITS` in `src/engine/store.ts`, de proefperiode en de vangnetprijs in
`src/engine/billing.ts`.

De app zet zelf geen prijs: die komt uit de winkel, in de munt van de koper.
Vóór het afsluiten staan de voorwaarden in beeld — hoe lang gratis, wat het
daarna kost, dat het doorloopt tot je opzegt — en staat er een ouderpoort voor,
een rekensom die een volwassene moet beantwoorden. Opzeggen kan met één tik
vanuit de app, via het winkelaccount.

Eén ding bepalen de winkels en niet wij: de kortste gratis periode is **drie
dagen** — twee bestaat er niet. Apple kent geen € 59,88 — twaalf maal € 4,99 bestaat daar niet als
prijspunt — dus staat het jaar in beide winkels op € 59,99, oftewel
€ 5,00 per maand. Beide staan uitgelegd in
[docs/PAYMENTS.md](docs/PAYMENTS.md), samen met de bank- en belastinginstellingen
waarmee het geld op je rekening komt.

## Privacy

Geen account, geen analytics, geen cookies van derden. Alles — voortgang,
kaartjes, instellingen — staat onder één sleutel in `localStorage`. Bij
instellingen kun je die als bestand downloaden, terugzetten op een ander
apparaat, of alles wissen. De fonts staan op ons eigen domein, dus het openen
van een pagina belt niemand.

Van een kind gaat er niets weg. Er is één ding dat het toestel wél kan
verlaten, en dat is van de ouder: op het ouderscherm kan een ouder een
e-mailadres achterlaten voor nieuws of voor de wekelijkse mail. Dat staat
achter dezelfde rekensom als de aankoop, met twee vinkjes die allebei leeg
beginnen, en er wordt pas iets gestuurd nadat er in de mailbox op is geklikt.
Wat er met die mail meegaat zijn vijf getallen — units, lessen, woorden, reeks,
punten — en nooit een antwoord of een naam. Zonder `VITE_POST` in de omgeving
staat het formulier er niet eens. De hele dienst staat in
[`server/`](server/LEES-MIJ.md) en past in vier bestanden.

## De taal zelf

Darija verschilt per stad, per familie en per generatie, en er is geen officiële
spelling. Wij kiezen de vorm die je in Casablanca en Rabat het meest hoort, in
het Arabische schrift zoals mensen het in berichten typen, met daarnaast de
Latijnse schrijfwijze inclusief cijfers: **3 = ع, 7 = ح, 9 = ق**. Zegt iemands
oma het anders, dan heeft oma gelijk — dat staat ook met zoveel woorden in de
app.

Leerstof toevoegen of corrigeren: zie [docs/INHOUD.md](docs/INHOUD.md). De
tests bewaken dat elke les naar bestaande woorden wijst, dat elk woord Arabisch
schrift heeft en dat elke toets precies dekt wat de unit leerde.

## Publiceren

**Als website.** `npm run build` maakt een map met statische bestanden; elke
statische host doet het. Zorg alleen dat onbekende paden `index.html`
terugkrijgen — voor Cloudflare Pages en Netlify regelt `public/_redirects` dat
al. Zie [docs/DEPLOY.md](docs/DEPLOY.md).

**Als app in de winkels.** Dezelfde build zit via Capacitor in een echte iOS- en
Android-app. Het Android-project staat compleet in `android/`, inclusief alle
iconen; voor iOS is een Mac met Xcode nodig (een eis van Apple). De teksten voor
beide winkels staan kant-en-klaar in `store/`, per taal. De hele route — accounts,
kosten, kindercategorie, privacyantwoorden, screenshots — staat in
[docs/STORES.md](docs/STORES.md), de volledige lanceerlijst — van KvK tot
de eerste twintig recensies — in [docs/LAUNCH.md](docs/LAUNCH.md), en het plan
per land — waar het publiek zit, in welke volgorde en wat je welke week doet —
in [docs/MARKT.md](docs/MARKT.md).

```bash
npm run build          # web-build in dist/
npx cap sync android   # diezelfde build in het Android-project
npm run android        # en openen in Android Studio
```

De beelden voor beide winkels maakt de repo zelf: `npm run screenshots` voor de
schermafbeeldingen, `npm run marketing` voor de feature graphic en de
socialbeelden, `npm run brand` voor het merkpakket — logo, profielfoto's,
omslagen en een flyer op A5 — en `npm run intro` voor de introfilm — bijna een halve minuut
echte app met geluid, in vier formaten en zes talen. Die film is geen montage
van mock-ups: `scripts/make-intro.mjs` start een server, fotografeert de app en
laat `dev/intro.ts` het geheel tekenen en opnemen, met een soundtrack die door
dezelfde instrumenten wordt gespeeld als de app zelf gebruikt.

Vul vóór publicatie `src/content/operator.ts` in: zonder naam en e-mailadres van
de uitgever zet de privacypagina er zichtbaar een waarschuwing boven, en weigeren
beide winkels de app. Datzelfde adres is de feedbackknop — `npm run feedbackcheck`
loopt hem in alle zes talen na, van de oudersspagina tot de correctie onder een
woord, en leest de opgebouwde `mailto:` terug uit de echte pagina.
