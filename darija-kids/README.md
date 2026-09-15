# Darija Kids · قدّام

**Marokkaans-Arabisch (Darija) leren, voor kinderen en jongeren — in het
Nederlands, Frans, Duits, Spaans en Engels.**

Darija Kids is één app die drie dingen tegelijk is: een website die uitlegt waar het
over gaat, een installeerbare leer-app die daarna offline werkt, en — via
Capacitor — dezelfde app voor de App Store en Google Play. Geen account, geen
advertenties, geen server: alle voortgang staat op het apparaat van het kind
zelf.

Bedoeld voor Marokkaanse gezinnen in Nederland, België, Frankrijk, Duitsland,
Oostenrijk, Zwitserland en Spanje — en voor iedereen daarbuiten die Darija wil
leren.

**Darija Kids** (بلادي) is wat Marokkanen in het buitenland Marokko noemen: *mijn
land*. De taal die erbij hoort, leer je hier.

```
bladi/
  src/content/       de leerstof: woorden, units, letters, verhalen
    lang/            dezelfde leerstof in het Frans, Duits, Spaans en Engels
  src/i18n/          de interface in vijf talen, en de privacyverklaring
  src/engine/        herhaalsysteem, oefeninggenerator, voortgang, geluid
  src/ui/            bouwstenen, de oefeningen en de ronde-loop
  src/pages/         de schermen, inclusief de publieke website
  scripts/           iconen, deelplaatje en winkelplaatjes renderen, browsertest
  public/            fonts, iconen, manifest, service worker
  android/           het Android-project (Capacitor)
  store/             winkelteksten per taal, klaar om te plakken
  docs/STORES.md     de route naar de App Store en Google Play
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
npm test           # 51 tests: leerstof, vertalingen, herhaalsysteem, oefeningen, betaalgrens
npm run typecheck
npm run smoke      # klikt de gebouwde app door in een echte browser (na `npm run preview`)
npm run icons      # tekent de iconen en het deelplaatje opnieuw
```

## Wat er in zit

| | |
|---|---|
| **5 interfacetalen** | Nederlands, Frans, Duits, Spaans en Engels — interface, betekenissen, uitleg, tips en verhalen |
| **Gratis beginnen** | de eerste vijf units zijn open; de rest is één aankoop via de App Store of Google Play |
| **16 units** | van *Salam!* tot afdingen op de souq, oplopend van A0 naar A2 |
| **304 woorden en zinnen** | elk met Arabisch schrift, Latijnse schrijfwijze en een betekenis in alle vijf de talen |
| **8 soorten oefeningen** | kiezen, luisteren, schrift herkennen, koppelen, zin bouwen, typen, inspreken, en een introkaart per nieuw woord |
| **31 letters** | het hele Arabische alfabet plus پ, ڤ en ݣ, met hun vorm aan begin, midden en eind |
| **4 verhalen** | gesprekken waarin je op elke zin kunt tikken voor de vertaling, met vragen erna |
| **3 spellen** | tijdrace, geheugenspel en letterspel — ze gebruiken de woorden die je al zag |

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
Frans, Duits, Spaans en Engels zijn **packs** (`src/content/lang/`) die de betekenissen,
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
- Staat er **helemaal geen Arabische stem** op het apparaat, dan leent Darija Kids een
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

De eerste vijf units zijn gratis en blijven gratis — genoeg om jezelf voor te
stellen, je familie te beschrijven en tot honderd te tellen. De rest van de
cursus hoort bij **volledige toegang**: een paar dagen gratis, daarna **€ 6,45
per maand inclusief btw**, maandelijks opzegbaar. De App Store en Google Play
regelen de proefperiode, de afschrijving en de btw; het product heet
`app.darijakids.monthly`. De grens tussen gratis en betaald staat op één plek:
`FREE_UNITS` in `src/engine/store.ts`, de proefperiode en de vangnetprijs in
`src/engine/billing.ts`.

De app zet zelf geen prijs: die komt uit de winkel, in de munt van de koper.
Vóór het afsluiten staan de voorwaarden in beeld — hoe lang gratis, wat het
daarna kost, dat het doorloopt tot je opzegt — en staat er een ouderpoort voor,
een rekensom die een volwassene moet beantwoorden. Opzeggen kan met één tik
vanuit de app, via het winkelaccount.

Twee dingen die de winkels bepalen en niet wij: de kortste gratis periode is
**drie dagen** (twee bestaat er niet), en Apple werkt met vaste prijspunten,
dus daar kan € 6,45 uitkomen op € 6,49. Beide staan uitgelegd in
[docs/PAYMENTS.md](docs/PAYMENTS.md), samen met de bank- en belastinginstellingen
waarmee het geld op je rekening komt.

## Privacy

Geen account, geen backend, geen analytics, geen cookies van derden. Alles —
voortgang, kaartjes, instellingen — staat onder één sleutel in `localStorage`.
Bij instellingen kun je die als bestand downloaden, terugzetten op een ander
apparaat, of alles wissen. De fonts staan op onze eigen domein, dus het openen
van een pagina belt niemand.

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
[docs/STORES.md](docs/STORES.md).

```bash
npm run build          # web-build in dist/
npx cap sync android   # diezelfde build in het Android-project
npm run android        # en openen in Android Studio
```

Vul vóór publicatie `src/content/operator.ts` in: zonder naam en e-mailadres van
de uitgever zet de privacypagina er zichtbaar een waarschuwing boven, en weigeren
beide winkels de app.
