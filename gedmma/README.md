# Gedmma · قدّام

**Marokkaans-Arabisch (Darija) leren, voor kinderen en jongeren.**

Gedmma is één app die twee dingen tegelijk is: een website die uitlegt waar het
over gaat, en een installeerbare leer-app die daarna offline werkt. Geen
account, geen advertenties, geen server — alle voortgang staat in de browser
van het kind zelf.

*Gedmma* komt van **qeddam** (قدّام): vooruit.

```
gedmma/
  src/content/     de leerstof: woorden, units, letters, verhalen
  src/engine/      herhaalsysteem, oefeninggenerator, voortgang, geluid
  src/ui/          bouwstenen, de oefeningen en de ronde-loop
  src/pages/       de schermen, inclusief de publieke website
  scripts/         icoontjes en deelplaatje renderen, browsertest
  public/          fonts, iconen, manifest, service worker
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
npm test           # 28 tests: leerstof, herhaalsysteem, oefeningen, antwoordcontrole
npm run typecheck
npm run smoke      # klikt de gebouwde app door in een echte browser (na `npm run preview`)
npm run icons      # tekent de iconen en het deelplaatje opnieuw
```

## Wat er in zit

| | |
|---|---|
| **16 units** | van *Salam!* tot afdingen op de souq, oplopend van A0 naar A2 |
| **303 woorden en zinnen** | elk met Arabisch schrift, Latijnse schrijfwijze, Nederlands én Engels |
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
- Staat er **helemaal geen Arabische stem** op het apparaat, dan leest Gedmma de
  Latijnse schrijfwijze voor met een **Franse** stem: `sh` wordt `ch`, `u` en `w`
  worden `ou`, `kh` en `gh` worden een Franse `r`, en de ع vervalt — Frans komt
  van de Europese talen het dichtst bij Darija in de buurt. Het leerpad zegt
  eenmalig dat dit gebeurt en hoe je een Arabische stem installeert, en je kunt
  het uitzetten.

Spreekoefeningen gebruiken de spraakherkenning van de browser. In Chrome gaat de
opname daarvoor naar Google; wie dat niet wil, zet spreekoefeningen uit. Dat
staat ook zo op de ouderpagina.

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

`npm run build` maakt een map met statische bestanden; elke statische host doet
het. Zorg alleen dat onbekende paden `index.html` terugkrijgen — voor Cloudflare
Pages en Netlify regelt `public/_redirects` dat al. Zie
[docs/DEPLOY.md](docs/DEPLOY.md).
