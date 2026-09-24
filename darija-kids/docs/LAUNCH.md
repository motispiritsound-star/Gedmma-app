# Lanceren

> **Kort antwoord op "wat moet er nog": [docs/STAND.md](STAND.md).**

Eén lijst, van "de app is af" tot "hij staat in de winkel". Alles wat de code
kan doen is gedaan; wat hier overblijft is wat een mens met een bankrekening
en een paspoort moet doen.

De app zelf staat er klaar voor: 145 tests groen, elk scherm nagelopen in zes
talen op drie schermbreedtes, alle 34 klanken gemeten, en de winkelteksten,
schermafbeeldingen, films en het e-boek klaar in zes talen.

En de stem is af. Alle 28 letters, alle 304 woorden en alle 100 zinnen worden
gezegd door iemand die Darija spreekt — 432 opnames, geen enkele meer door een
computerstem. Dat was de grootste onbekende van dit project en die is weg.

**Op één ding na, en dat is geen kleinigheid.** Van de 126 woorden uit de
laatste opnamesessie staat een stuk onder de verkeerde naam: de doorlopende
spraakmemo is op de stiltes geknipt, er is één stuk misgegaan, en vanaf dat
punt hoort elke opname bij het woord ervoor. Twee zijn er met zekerheid
gemeld — bnin (#41) zegt msemmen, bab (#47) zegt hemmam — en de meting wijst
naar een stuk tussen #38 en #58. Dat hoort recht voordat de app de winkel in
gaat: §0c zegt wat er moet gebeuren en waarom het niet uit te rekenen valt.

Wat verder nog ontbreekt staat in de eerste blokken van de checklist hieronder,
en dat is geen code meer: accounts, formulieren en een Mac.

Reken op **vier tot zes weken** tussen je eerste account en je eerste
downloader. Niet omdat het werk zoveel is, maar omdat er één wachttijd van twee
tot vier weken in zit die je niet kunt inhalen — welke dat is, hangt af van de
keuze in §1. Begin dus met die keuze, en doe de rest van deze lijst ondertussen.

---

## De checklist

> Liever afvinken dan lezen? `npm run checklist` maakt hiervan
> `store/lanceer-checklist.html`: één bestand dat je dubbelklikt, met echte
> vakjes die onthouden wat je hebt gedaan.

Alles op één plek, in de volgorde waarin het moet. Wat de code kon doen staat
al aangevinkt; de rest heeft een mens met een bankrekening en een paspoort
nodig. De paragraafnummers verwijzen naar de uitleg hieronder.

### De opnames — het enige dat nog in de app zelf misgaat

- [x] De grenzen vastgesteld door ze na te luisteren: #4–#6 twee plaatsen, #42–#66 één (§0c)
- [x] De bestanden teruggezet — 25 opnames, met `npm run repareer-knip`
- [x] Khoya, jeddi en jmel opnieuw ingesproken; aila, baba en ldid ook
- [x] Vier voorbeeldwoorden bij de letters weggehaald uit het verdachte stuk
- [x] Bnin weg uit de proeverij op de voorpagina, kesksu ervoor in de plaats
- [x] Schermafbeeldingen opnieuw gemaakt na de letterwissel

### Vandaag — dit blokkeert alle andere stappen

- [x] `src/content/operator.ts` invullen: naam, e-mail, adres, land, telefoon, KvK, btw (§0)
- [x] KvK-inschrijving — Venship, 77780868
- [x] Domein kopen — `darijaforkids.eu`, met `darijaforkids.nl` als 301 erheen
- [x] De website online zetten op dat domein (§0b)
- [x] D-U-N-S-nummer — aangevraagd en binnen

### De accounts

- [x] Google Play Console aanmaken, $ 25 eenmalig (§1)
- [x] Apple Developer Program, € 99 per jaar (§1)
- [x] Apple: de **Paid Applications**-overeenkomst tekenen
- [x] Apple: aanmelden voor het **Small Business Program**, 15% in plaats van 30%
- [x] Apple: W-8BEN belastingformulier ingevuld
- [x] Apple: handelaarsverificatie (DSA) — **goedgekeurd op 24 september**. Het
      KvK-uittreksel was genoeg; de handelaarsgegevens staan nu live in de
      App Store in de hele Europese Unie. Hiermee is de laatste horde weg die
      niet over de app zelf ging
- [x] Apple: naamcorrectie van "Adi" naar "Adil" — doorgevoerd op 22 september
      (zaak **102968992781**), en meteen zichtbaar op de overeenkomsten. De al
      ingediende belastingformulieren blijven op de oude naam staan; dat hoort zo.
- [x] Apple: bankgegevens — **Active**, op naam van Adil Bekkali. De bank heet in
      Apples lijst *BAWAG PSK*: dat is de moeder van Knab, dus dat klopt.
- [ ] Apple: bij de bankrekening staat **USD** als royalty-valuta. Kijk of **EUR**
      er ook aan hangt — anders is er voor het grootste deel van de omzet geen
      rekening aangewezen (Business → Bank Accounts → See More)
- [ ] Apple: **DAC7** (Directive on Administrative Cooperation, 7e wijziging) staat
      op *Missing Info*. Dit is de EU-meldplicht voor verkopers op een platform;
      zonder die gegevens mag Apple de uitbetaling inhouden. Invullen via
      Business → Compliance → **Add Info**: naam, adres, geboortedatum, het
      fiscaal nummer (BSN bij een eenmanszaak) en het KvK-nummer van Venship
- [x] Google: identiteitsverificatie — goedgekeurd op 21 september
- [x] Google: het account staat als **organisatie** — de gesloten test met 12
      testers × 14 dagen vervalt daarmee (§6)
- [x] Google: website van de organisatie geverifieerd — via een **URL-prefix**-property
      in Search Console; een Domain-property alleen is niet genoeg (§PLAY 1)
- [x] Google: telefoonnummers geverifieerd
- [ ] Google: bankrekening en belastinggegevens invullen (§2)

### De producten — Apple

- [x] Abonnementsgroep `Volledige toegang`, met groepsnaam `Darijaforkids`
- [x] `app.darijaforkids.yearly` — `Een jaar`, 1 jaar, **€ 59,99**
- [x] `app.darijaforkids.monthly` — `Per maand`, 1 maand, **€ 6,99**
- [x] Beide: 3 dagen gratis als **Introductory Offer**, alle 175 landen
- [x] Beide: **Family Sharing** aan
- [x] Beide: naam en beschrijving in het Nederlands
- [ ] Beide: naam en beschrijving in het **Engels** — daar staat nu de appnaam
      met een Nederlandse zin eronder, en dat is de vermelding voor de hele
      wereld buiten Nederland. Moet worden: `One year` met
      `All 17 units, 304 words and 100 sentences.`, en `Monthly` bij de andere
      (naam maximaal 30 tekens, beschrijving maximaal 45)
- [x] Beide: review-screenshot van 1290 × 2796
- [ ] **Basisland op Nederland**. De prijs is aangemaakt met de Verenigde
      Staten als uitgangspunt ($ 49,99), en de zes eurolanden zijn daarna met
      de hand bijgewerkt. Dat houdt geen stand: elke prijswijziging later
      begint weer bij de dollar. Opnieuw instellen vanuit Nederland
      (€ 59,99 en € 6,99), Apple de overige 169 landen laten afleiden, en
      daarna alleen **Marokko** met de hand verlagen — een prijs die uit een
      europrijs rolt is daar het dubbele van wat een gezin uitgeeft
- [ ] **Levels**: staan nu allebei op 1, niet op 1 en 2 zoals hieronder stond.
      Daarmee gaat een overstap van maand naar jaar pas bij de volgende
      verlenging in. Er wordt niets dubbel betaald, dus dit mag wachten tot na
      de review — *Edit Level* raakt de indiening
- [x] `app.darijaforkids.ebook` aangemaakt — niet-verbruikbaar, Apple ID 6813986487,
      alle 175 landen, naam en beschrijving in het Nederlands, afbeelding erbij
- [x] E-boek: Family Sharing aan — net als bij Jaar en Maand
- [x] E-boek: prijs staat op **€ 14,99**
- [x] E-boek: review-screenshot vervangen — de versie met alleen het boek erop

### De producten — Google Play

Kan pas na de verificatie. Volledige uitleg in [docs/PLAY.md](PLAY.md).

- [x] Abonnement `app.darijaforkids.yearly`, basisabonnement `jaar`, **€ 59,99**
- [x] Abonnement `app.darijaforkids.monthly`, basisabonnement `maand`, € 6,99
- [x] Beide een aanbieding **gratis proefperiode, 3 dagen**
- [x] Eenmalig product `app.darijaforkids.ebook`, € 14,99, **Gezinsbibliotheek aan**
- [x] Google: merchant-account en de 15%-tarief-inschrijving (scheelt 15% van elke
      euro omzet onder het miljoen)
- [x] **De eurolanden met de hand op hetzelfde bedrag.** Google stelt per land
      zijn eigen prijspunt voor -- € 69,99 in Duitsland, € 74,99 in Griekenland --
      terwijl alle zes de winkelteksten € 59,99 noemen. Binnen de eurozone valt
      er niets om te rekenen, dus dat moet overal gelijk. Gedaan voor beide
      abonnementen en het e-boek; nakijken bij elke prijswijziging.

### Wat je uploadt

- [x] Schermafbeeldingen opnieuw gemaakt met de nieuwe prijsweergave (39% in
      plaats van 28%, € 98,87 doorgestreept, "maandelijks opzegbaar") en de
      nieuwe voorbeeldwoorden — 295 beelden in zes talen
- [x] Beide winkelpakketten en de zip opnieuw — 126 en 158 bestanden
- [x] De vijf campagneposts opnieuw — 60 beelden in zes talen
- [x] Apple: de review-screenshots staan op alle drie de producten
- [x] Een aanbodplaatje met vlag, prijs en gezinsregel — staat op plek drie
- [x] App preview 886×1920, onder de 30 seconden — `npm run intro`
- [x] Winkelteksten in zes talen — `store/play-pakket/<taal>/teksten.md`
- [x] Icoon en splashscherm — `npm run assets`
- [x] Het e-boek in zes talen — `npm run ebook`
- [x] Apple: naam, ondertitel, trefwoorden, promotietekst, beschrijving en de
      schermafbeeldingen voor iPhone en iPad, in alle zes de talen
- [x] Google: de winkelvermelding in zes talen — met `npm run play` in één keer verstuurd
- [x] Android: een **AAB** bouwen en ondertekenen — `npm run sleutel` en `npm run aab`, 22,8 MB
- [x] **Een Mac regelen** — zonder macOS geen iOS-build, en dus geen App Store (§3)
- [ ] iOS: `npx cap add ios`, archiveren in Xcode, naar TestFlight — stap voor stap in [docs/MAC.md](MAC.md)

### De formulieren

- [x] Apple **App Privacy** — gepubliceerd als **Data Not Collected**, net als de
      Google-verklaring. Er stond eerst e-mailadres en product interaction in; dat
      was onjuist. Nagekeken in de gebouwde app: het nieuwsbriefformulier is bij
      het bouwen platgeslagen tot `false` en wordt nooit getoond. **Zet je
      VITE_POST ooit aan, dan moeten beide verklaringen mee veranderen.** (§4)
- [x] Apple **Age Rating** — overal None ingevuld, staat op 4+ in 172 landen
- [x] Apple: categorie **Education**, geen Kids Category — die kan bij een latere versie
- [x] Google **Gegevensbeveiliging**: *geen gegevens verzameld*. Nagekeken in de
      gebouwde app — het nieuwsbriefformulier is bij het bouwen platgeslagen tot
      `false` en wordt nooit getoond. **Zet je VITE_POST ooit aan, dan moet deze
      verklaring mee veranderen naar E-mailadres.**
- [x] Google **Doelgroep en inhoud** — 6 t/m 18+, dus Families-beleid; Teacher Approved aangevraagd
- [x] Google **Inhoudsclassificatie**, **Advertenties: nee**, en de negen andere verklaringen
- [ ] Handelaarsgegevens in beide consoles — dezelfde als in `operator.ts`
- [x] Support-URL (`/ouders`) en marketing-URL ingevuld bij Apple
- [x] Privacy-URL ingevuld bij App Privacy
- [x] Voorwaarden: Apple's standaard-EULA blijft staan; de app linkt zelf naar
      `/voorwaarden` op het abonnementsscherm, en daarmee is aan de eis voldaan
- [x] De notitie aan de reviewer staat erin, in het Engels (§5)
- [x] Google: winkelvermelding in zes talen — met de warmere beschrijving die
      bij het kind begint, verstuurd met `npm run play -- --tekst`
- [x] Google: het veld **Video** gevuld met de film op YouTube
      (`youtube.com/watch?v=3iHXGpubnaI`), in alle zes de talen
- [x] De vier kanalen staan: YouTube, Instagram, TikTok en de Facebook-pagina,
      alle vier als `darijaforkidsapp` (docs/SOCIAL.md). Geen X.
- [x] Op de website staat **Binnenkort beschikbaar** boven de kop, in zes talen —
      er komt bezoek van de socials voordat de winkels open zijn

### Nog recht te zetten in de app

- [x] De gezinsregel per platform juist maken: Apple deelt abonnementen met het
      gezin, Google **niet** — op Android staat er nu iets anders
- [x] De prijs overal op € 59,99 en € 5,00 per maand — Apple kent € 59,88 niet
- [ ] `src/site/links.ts` vullen met de echte winkeladressen zodra je ze hebt —
      dan worden "Binnenkort" weer gewone downloadknoppen

### Voor je op verzenden drukt

- [x] `npm test` — 145 tests
- [x] `npm run typecheck`
- [x] `npm run sweep -- --breed` — elk scherm, zes talen, licht en donker, 320/390/820 px
- [x] `npm run soundcheck` — alle 34 klanken
- [x] `npm run lettercheck` — alle 432 opnames, geen enkele viel terug op de stem
- [x] `npm run bonuscheck`, `npm run historycheck`
- [x] `npm run feedbackcheck` — vierentwintig onderwerpregels, elke taal zijn eigen
- [ ] **iPhone**: gespeeld met geluid aan, via TestFlight zodra de Mac er is.
      Dat is de makkelijkste weg; `npm run telefoon` zet de app ook op je wifi,
      maar dan moet je netwerk meewerken en dat deed het niet.
- [ ] **Android**: gespeeld op de Galaxy Tab vóór de Play-release —
      `npm run apk` maakt het installatiebestand, dat via USB of de mail op het
      toestel komt. Het geluid en de aankopen zijn daar niet dezelfde code als
      op iOS, dus dit is de enige keer dat die kant echt gespeeld wordt.
      Een tablet is bovendien het formaat waar Play aparte schermen voor vraagt:
      let dus ook op de indeling op een breed scherm.

### De uitspraak

- [x] 28 van de 28 letters ingesproken door een mens
- [x] 304 van de 304 woorden ingesproken
- [x] 100 van de 100 zinnen ingesproken
- [x] Alle 432 gemeten op stilte, lengte en oversturing — geen enkele viel buiten de band
- [x] **Nagehoord op wát er gezegd wordt.** Dat is iets anders dan gemeten, en
      het is precies waar het misging. De verschoven knip is gevonden,
      rechtgezet en nagelopen: alle 432 opnames zeggen wat eronder staat (§0c)
- [x] Wie insprak — alle 432 door de uitgever zelf, dus geen toestemming te regelen (`store/press-kit.md`)

### Publiceren

- [ ] Google: de app op de Galaxy Tab spelen zodra hij in de Play Store staat.
      De interne test liep vast op "app not available"; er is voor gekozen
      rechtstreeks naar productie te gaan, omdat de app nog geen gebruikers
      heeft en een fout in versie 1 dus niemand raakt behalve jezelf.
- [x] Google: gesloten test met 12 testers × 14 dagen — **vervalt**, het account is een organisatie (§6)
- [ ] Apple: de app indienen, met de drie producten eraan gekoppeld
- [ ] Apple: wachten op review (1–3 dagen)
- [x] Google: productie aangevraagd op 21 september — 176 landen plus de rest
      van de wereld, volledige uitrol, **in review**
- [ ] Beide op **handmatig vrijgeven** zetten, zodat je zelf de dag kiest
- [ ] De eerste week uitvoeren (§7)

---

## 0-vooraf. Voelt dit als een app?

Dit stond hier niet, en dat heeft een afwijzing gekost. De lijst hieronder gaat
over papierwerk — handelaarsgegevens, privacy, voorwaarden — en dat was allemaal
in orde toen Apple versie 1.0 afwees op **richtlijn 4.2**: de app zou te weinig
verschillen van een website.

Loop dit langs vóór je indient:

- [ ] Gebruikt de app iets van het toestel dat een browser niet kan? Bij ons:
      trillen, de microfoon, een herinnering die afgaat als de app dicht is.
- [ ] Werkt élke functie die de winkeltekst belooft, ook op een iPhone en een
      iPad? Wij beloofden vijf bonusrondes en leverden er vier: de spreekronde
      leunde op een browserfunctie die in een WKWebView niet bestaat.
- [ ] Ziet het er op een iPad uit als een app of als een website in een kolom?
- [ ] Zou een beoordelaar die drie minuten heeft het bijzondere vinden? Zo nee,
      zet het in **App Review → Notes**.

Zie `docs/APPLE-4.2.md` voor wat er toen precies aan de hand was.

## 0. De handelaarsgegevens — gedaan

Dit stond hier als eerste blokkade en is inmiddels ingevuld. Wat erin staat en
waarom het moet, blijft hieronder staan: je typt dezelfde gegevens straks over
in twee winkelconsoles, en ze horen daar letterlijk hetzelfde te luiden.

| | |
|---|---|
| Handelaar | Darijaforkids |
| Bedrijf | Venship (eenmanszaak van Adil Bekkali) |
| Adres | Torenlaan 5 B, 1402 AT Bussum |
| Telefoon | +31 6 29479436 |
| E-mail | info@darijaforkids.eu |
| KvK | 77780868 |
| Btw | NL003000506B28 |

**Waarom het in `src/content/operator.ts` staat.** Sinds de Digital Services Act is wie in
een appwinkel verkoopt een *handelaar*, en horen naam, adres, telefoonnummer,
e-mailadres en KvK-nummer zichtbaar te zijn voor de koper. Beide winkels vragen
ze in de console en zetten ze op je pagina in de winkel; dit bestand zet
dezelfde gegevens ook in de app, onderaan de privacy- en de
voorwaardenpagina. Zolang naam en e-mail leeg zijn staat er in plaats daarvan
een waarschuwing.

Datzelfde e-mailadres is ook de feedbackknop. Die staat op de oudersspagina
(de support-URL die beide winkels vragen), in de instellingen, onderaan de
voorpagina en onder elk woord in het woordenboek — maar hij is onzichtbaar
zolang dit bestand leeg is, want een knop die nergens heen gaat is erger dan
geen knop. Het is `info@darijaforkids.eu` geworden: op het eigen domein, want
een winkel waarvan het contactadres bij een gratis provider staat, ziet eruit
als een winkel die er volgend jaar niet meer is.

```ts
export const OPERATOR = {
  name: 'Jouw naam of handelsnaam',
  email: 'hallo@jouwdomein.nl',
  address: 'Straat 1, 1234 AB Stad',
  country: 'Nederland',
  phone: '+31 6 12345678',
  registration: '12345678',   // je KvK-nummer
  vat: '',                    // leeg laten onder de KOR
}
```

Het adres moet een echt adres zijn — een postbus wordt niet geaccepteerd. Werk
je vanuit huis, dan wordt dat je zichtbare handelaarsadres; wie dat niet wil,
kan bij de KvK een **bezoekadres afschermen** of een zakelijk postadres huren,
maar regel dat vóór je de winkelaccounts aanmaakt.

**Zet de website online.** Dit blokkeert allebei de winkelaccounts, en het is
een kwartier werk.

---

## 0b. De website — de etalage, niet de winkel

De website staat online: **https://darijaforkids.eu**, met `www` erbij.
Cloudflare bouwt hem uit deze repo en levert het certificaat.

**De app staat er met opzet niet op.** Dat was eerst wel zo — dezelfde build
was ook de website — en dat is teruggedraaid, om één reden: wie de hele
cursus gratis in een browser kan doen, haalt hem niet uit de winkel. En de
winkel is waar de app verkocht wordt. Wat er nu staat is een etalage die naar
de App Store en Google Play wijst.

Die etalage levert nog steeds precies de drie adressen die de winkels vragen
voordat ze een app aannemen:

| Wat de winkel vraagt | Wat je invult |
|---|---|
| Privacy policy URL (beide) | `https://darijaforkids.eu/privacy` |
| EULA / voorwaarden (Apple, verplicht bij abonnementen) | `https://darijaforkids.eu/voorwaarden` |
| Support URL (Apple, verplicht) | `https://darijaforkids.eu/ouders` |
| Marketing URL (Apple, optioneel) | `https://darijaforkids.eu` |

Op alle drie die pagina's staat onderaan het handelaarsblok uit `operator.ts`.
Elke pagina bestaat in zes talen; de Nederlandse staat op de adressen
hierboven, de andere onder `/fr/`, `/de/`, `/es/`, `/it/` en `/en/` met hun
eigen woorden in het adres. Vul in de winkelconsoles per land de bijbehorende
taal in als daar ruimte voor is.

**Wat er op de voorpagina staat.** De film van een halve minuut, de zes
schermen, waarom het blijft hangen, het hele leerpad, de vragen, en twee keer
een downloadknop. Plus het stuk dat nergens anders staat: dat elk woord door
een mens is ingesproken en niet door een spraakcomputer — 432 opnames. Dat is
het enige wat geen enkele concurrent kan kopiëren zonder het opnieuw te doen.

**De downloadknoppen wachten nog.** Zolang `src/site/links.ts` leeg is, staat
er "Binnenkort" op en eronder een mailadres. Zodra App Store Connect en de
Play Console de echte adressen geven, zet je die daar neer en pushen — dan
worden het gewone knoppen. Vergeet daarbij de officiële badges van Apple en
Google niet; die schrijven voor hoe hun knop eruit hoort te zien.

**Domein.** `darijaforkids.eu` is vastgelegd bij MijnDomein en draait op de
nameservers van Cloudflare. Hij staat in de winkelconsoles, in de mailserver
en op het merkmateriaal, dus wijzig hem niet meer nadat de accounts zijn
aangemaakt. Die extensie is neutraal voor alle zes de markten, wat een
landextensie niet is — een Fransman die `.fr` ziet leest er een Frans product
in.

`darijaforkids.nl` is er ook en staat nog op de nameservers van MijnDomein.
Die wordt een doorverwijzing: één website, twee deuren. Een Nederlandse ouder
die de naam hoort typt `.nl`, en dan hoort daar niet een leeg scherm te staan.
Zet er een 301 naar `darijaforkids.eu` op en verder niets — twee vindbare
websites met dezelfde inhoud is slechter dan één.

**Hosting.** Cloudflare Workers, uit deze repo. De instellingen staan in
[DEPLOY.md](DEPLOY.md).

**E-mail.** `info@darijaforkids.eu` staat in `operator.ts` en op de website.
Dat adres moet nog worden aangemaakt: het eenvoudigst is Cloudflare Email
Routing — gratis, zet zelf de MX-regels klaar en stuurt de post door naar een
bestaande inbox. Beide winkels sturen post naar dit adres en kopers mogen er
klagen, dus het moet echt werken voordat de accounts worden aangemaakt.

**Wat er op de website staat, en wat niet.** De handelaarsgegevens hierboven
staan volledig in de app en in beide winkelconsoles — daar hoort het, want
daar wordt gekocht. Op darijaforkids.eu staan alleen de handelsnaam, het
e-mailadres, het KvK-nummer en het btw-nummer. Het huisadres en het
mobiele nummer staan er niet: de website verkoopt niets, en op het open
internet is een huisadres vooral een uitnodiging.

---

## 0c. De verschoven knip in de opnames

De 304 woordopnames komen uit twee golven. De eerste 178 zijn woord voor woord
nagehoord en waar nodig opnieuw geknipt — daar zitten twee commits over in de
geschiedenis, want ook daar was een memo een keer een regel opgeschoven. De
laatste 126 zijn wél gemeten maar niet nagehoord, en precies daar zit het.

**Wat er gebeurd is.** Die 126 woorden zijn in negen spraakmemo's achter
elkaar ingesproken en daarna door `scripts/knip-opname.mjs` op de stiltes uit
elkaar geknipt. Dat gaat goed zolang het aantal stukken klopt. Komt er ergens
één stuk te veel — een kuch, een woord dat twee keer is gezegd, een memo die
een regel eerder begon dan gedacht — dan schuift alles daarna één plaats op en
staat elke opname onder de naam van zijn buurman. `src/audio/LEES-MIJ.md`
waarschuwt daar zelf voor: *"vanaf dat punt staat alles onder de verkeerde
naam."*

**Wat vaststaat.** Twee plekken zijn gehoord en gemeld:

| plek | staat onder | zegt in werkelijkheid |
|---|---|---|
| #41 | bnin — lekker | msemmen |
| #47 | bab — de deur | hemmam |

Beide één plaats opgeschoven, dus het is één doorlopend stuk en het loopt van
minstens #41 tot minstens #47.

**Waarom de computer de grenzen niet vindt.** Geprobeerd is het wel, op twee
manieren. Een lengtemodel, geijkt op de 178 opnames die wél kloppen, wijst een
streek aan tussen #38 en #58 maar geen grens: losse woorden duren allemaal
ongeveer even lang, en de spreiding is groter dan het verschil tussen twee
buurwoorden. Een tweede model kijkt naar de eerste zestig milliseconden — of
een woord begint met een plof (b, t, k), een wrijving (s, sh, kh) of een klank
(m, n, a) — en wijst dezelfde streek aan, maar raadt op de 178 bekende opnames
maar de helft goed. Twee zwakke signalen die het eens zijn maken samen geen
grens.

Wat wel werkt is luisteren, en dan niet alles. Een grens vind je door steeds
middendoor te snijden: klopt dit woord, dan ligt de grens erachter; hoor je het
woord ervoor, dan ervoor. Zes keer per grens en je weet het op één plaats
nauwkeurig. De controlepagina doet dat rekenwerk en stelt telkens de ene vraag
die het meeste verraadt — dertien keer luisteren, en het staat vast.

**De reparatie daarna is mechanisch.** Elk bestand in het stuk krijgt de naam
van het woord ervoor. Eén ding is daarmee niet op te lossen: het laatste woord
van het stuk heeft geen opname meer, want die is bij het knippen nooit
weggeschreven. Dat ene woord moet opnieuw ingesproken worden — `/opname` in de
app zet het bovenaan zodra zijn bestand weg is.

**Wat er in de tussentijd is gedaan.** De plekken waar een verkeerde opname
het meeste kost zijn leeggehaald: de acht woorden van de proeverij op de
voorpagina en de voorbeelden bij de letters staan nu allemaal op een opname
uit de nagehoorde golf. Bab, tebla, dou en ktab zijn daar weggehaald, bnin uit
de proeverij. Die woorden staan gewoon nog in de app, in hun eigen les — waar
een fout een woord kost en niet het vertrouwen in de hele app.

---

## 1. De accounts, en de ene keuze die telt

| Wat | Waar | Kost | Duurt |
|---|---|---|---|
| KvK-inschrijving | [kvk.nl/starten](https://www.kvk.nl/starten/inschrijven-bij-de-kvk/) | € 82,25 | een afspraak, daarna direct |
| Google Play Console | [play.google.com/console/signup](https://play.google.com/console/signup) | $ 25 eenmalig | 1–2 dagen verificatie |
| Apple Developer Program | [developer.apple.com/programs/enroll](https://developer.apple.com/programs/enroll/) | € 99 per jaar | 1–2 dagen, soms langer |
| D-U-N-S-nummer (alleen voor de organisatieroute) | [developer.apple.com/enroll/duns-lookup](https://developer.apple.com/enroll/duns-lookup/) | gratis | tot 30 dagen |

**Apple is simpel, en dat is hier ook de route.** Venship is een eenmanszaak
en dus geen aparte rechtspersoon, dus de inschrijving gaat als *individual /
sole proprietor*. Dat scheelt het D-U-N-S-nummer bij Apple: die eis geldt
alleen voor organisaties met rechtspersoonlijkheid.

Eén gevolg om te weten: Apple zet bij een individuele inschrijving standaard
**je eigen naam** als verkoper in de App Store, niet "Darijaforkids". Dat is
achteraf te wijzigen naar de handelsnaam — dat loopt via Apple Support, met
het KvK-uittreksel als bewijs, en het is een gewoon verzoek en geen uitzondering.
Doe dat vóór de eerste publicatie: wat er bij de eerste release staat, is wat
kopers onthouden. Zodra Apple de verkopersnaam heeft vastgesteld, zet je
dezelfde naam in `src/content/operator.ts`, zodat de app, de website en de
winkel alle drie hetzelfde zeggen.

**Google is een keuze, en het is de belangrijkste van deze hele lijst.**

| | Persoonlijk account | Organisatieaccount |
|---|---|---|
| Nodig | alleen je identiteitsbewijs | D-U-N-S-nummer + KvK-uittreksel |
| Wachttijd vooraf | geen | tot 30 dagen op je D-U-N-S |
| Gesloten test vóór publiceren | **12 testers, 14 dagen aaneengesloten, per app** | **niet nodig** |
| Naam in de winkel | je eigen naam | je handelsnaam |

Beide routes kosten ongeveer evenveel tijd, maar niet dezelfde soort tijd:
wachten op een nummer doe je terwijl je doorwerkt, twaalf mensen twee weken
lang een testversie laten installeren is echt werk en het kan mislukken. Met
een KvK-nummer op zak is de organisatieroute daarom bijna altijd de betere —
vraag het D-U-N-S-nummer **vandaag** aan, want die klok loopt het langst.

Een KvK-nummer is nodig zodra je structureel verkoopt. Zonder inschrijving kun
je wel een gratis app publiceren, maar geen abonnement — beide winkels vragen
om belastinggegevens die je als particulier niet kunt geven.

Voor Apple heb je bovendien een **Mac** nodig. Die is niet te omzeilen: alleen
Xcode kan een iOS-app ondertekenen en inleveren. Heb je er geen, dan zijn de
opties: er een lenen, een Mac in de cloud huren (MacStadium, ± $ 60 per maand,
je hebt hem één dag nodig), of met Android beginnen en iOS later doen.

---

## 2. Het abonnement aanmaken

Volledig uitgeschreven in [PAYMENTS.md](PAYMENTS.md). In het kort, in beide
consoles hetzelfde:

Er zijn **twee abonnementen**, in dezelfde abonnementsgroep:

| Product-id | Duur | Prijs | Naam voor de koper |
|---|---|---|---|
| `app.darijaforkids.yearly` | 1 jaar, verlengt automatisch | € 59,99 | Een jaar volledige toegang |
| `app.darijaforkids.monthly` | 1 maand, verlengt automatisch | € 6,99 | Volledige toegang per maand |

En **één eenmalig product**, geen abonnement:

| Product-id | Soort | Prijs | Naam voor de koper |
|---|---|---|---|
| `app.darijaforkids.ebook` | eenmalig, niet verbruikbaar | € 14,99 | Het e-boek |

Bij het jaarabonnement zit het e-boek erbij; dat regelt de app, dus er is geen
apart bundelproduct nodig. De abonnementen allebei met **3 dagen gratis**. De ids moeten exact zo, anders vindt de code ze
niet. Zelfde groep, zodat overstappen van maand naar jaar geen dubbele
afschrijving oplevert.

Koppel in dezelfde consoles je bankrekening en vul je belastinggegevens in.
Zonder dat wordt er niets uitbetaald, ook al verkoop je.

---

## 3. Wat je uploadt

Alles staat klaar in `store/`. Genereer de beelden opnieuw als je iets aan de
app verandert:

```bash
npm run build && npm run preview   # in een tweede venster laten draaien
npm run screenshots                # store/screenshots/<taal>/<toestel>/
npm run reviewshot                 # store/review-screenshot/ — voor de drie producten
npm run applepakket                # store/appstore-pakket/ — per taal gesorteerd
npm run playpakket                 # store/play-pakket/ — per taal gesorteerd
npm run playzip                    # store/darijaforkids-play.zip — één upload
npm run social                     # brand/social/posts/ — vijf posts in zes talen
npm run marketing                  # store/marketing/<taal>/
npm run brand                      # brand/ — logo, socials, flyer
npm run intro                      # store/video/<taal>/ — duurt een kwartier
```

**`npm run preview` moet echt eerst.** `make-screenshots.mjs` start geen eigen
server — hij fotografeert wat er op poort 4173 staat, en zonder die server
stopt hij met `ERR_CONNECTION_REFUSED` voordat er één plaatje is. `npm run
intro` is de uitzondering: die regelt zijn eigen server.

Niets uit `store/screenshots/`, `store/*-pakket/`, `brand/` of de zip staat in
git. Dat is met opzet: het is allemaal bouwresultaat van de commando's
hierboven, en samen is het honderden megabytes. Verander je iets aan de app of
aan de prijzen, dan draai je ze opnieuw — dat is de bron, niet het bestand.

`npm run intro` start zijn eigen server, fotografeert de app en neemt de
introfilm op met geluid. Controleer een opname daarna met
`node scripts/checkvideo.mjs store/video/nl/intro-appstore.mp4`: die zegt hoe
lang hij is, hoe groot, en of er echt geluid op staat.

| Winkel | Wat | Vandaan |
|---|---|---|
| Beide | App-icoon 1024×1024 | `assets/icon.png` |
| Overal | Logo, profielfoto, omslagen, flyer | `brand/` (`npm run brand`) |
| Beide | Beschrijvingen in 6 talen | `store/listing.<taal>.md` |
| Beide | Titel, ondertitel, zoekwoorden | `store/keywords.md` |
| App Store | iPhone 6.9" (1290×2796) | `store/screenshots/<taal>/iphone/` |
| App Store | iPad 13" (2048×2732) | `store/screenshots/<taal>/ipad/` |
| App Store | App preview 886×1920, 15–30 s | `store/video/<taal>/intro-appstore.mp4` |
| App Store | Privacy-URL en voorwaarden-URL | je eigen site |
| Play | Telefoon (1080×1920) | `store/screenshots/<taal>/play/` |
| Play | Tablet 7" en 10" | `store/screenshots/<taal>/play-7/` en `play-10/` |
| Play | Feature graphic 1024×500 | `store/marketing/<taal>/feature-graphic.png` |
| Play | Promotievideo (YouTube-link) | zet `store/video/<taal>/intro-breed.mp4` op YouTube |
| Play | Privacy-URL | je eigen site |

De volgorde van de schermafbeeldingen is de volgorde van de bestandsnamen. De
eerste twee zijn de enige die de meeste mensen zien — daar staat niet voor
niets het leerpad en het alfabet.

De App Store wil een app preview van 15 tot 30 seconden; de onze duurt 27,5 en
staat in 886×1920, precies wat de 6.9"-sleuf vraagt. Google Play neemt geen
bestand aan maar een YouTube-link: zet `intro-breed.mp4` daar neer als niet-
vermelde video en plak de link in de Play Console. De vierkante en de verticale
versie zijn voor Instagram, Facebook, TikTok en advertenties — die horen niet
bij een winkel, maar wel bij een lancering.

---

## 4. De formulieren die niemand leuk vindt

**Wat de app werkelijk verzamelt.** Bijna niets, maar niet niets — en dat
verschil is precies waar een winkel op afkeurt.

Er is één formulier dat de app uit gaat: de aanmelding op het ouderscherm,
achter dezelfde rekensom als de aankoop. Dat stuurt een **e-mailadres**, de
taal van de app en twee vinkjes. Heeft de ouder om de weekmail gevraagd én het
adres in de inbox bevestigd, dan stuurt de app daarna hoogstens één keer per
dag **vijf getallen**: units, lessen, woorden, langste reeks en XP. Geen naam,
geen antwoorden, geen apparaat-id, niets dat zegt wélk kind. Het staat
uitgeschreven in [`server/LEES-MIJ.md`](../server/LEES-MIJ.md).

Verder gaat er niets weg. Geen SDK van een ander, geen advertentienetwerk,
geen analytics.

**Google Play → Data safety.** *Verzamelt: ja. Deelt: nee.* Twee typen:
e-mailadres (onder "Persoonlijke informatie") en app-activiteit (de vijf
getallen). Bij allebei: versleuteld onderweg, de gebruiker kan om verwijdering
vragen, en het is **optioneel** — de app werkt zonder. De enige vraag waar je
even bij nadenkt: spraakherkenning is in de Android-webweergave niet
beschikbaar, dus de app vraagt geen microfoontoestemming.

**Google Play → Doelgroep.** Vink de leeftijdsgroepen onder 13 aan. Daarmee val
je onder het **Families-beleid**: geen advertenties en geen analytics van
derden (die zitten er niet in), en in-app-aankopen mogen, mits de prijs vóór de
aankoop in beeld staat en er een ouderpoort voor zit. Dat is precies hoe het
abonnementsscherm gebouwd is.

**Google Play → Inhoudsclassificatie.** De vragenlijst levert PEGI 3 op. Vink
"bevat in-app-aankopen: ja" en "bevat advertenties: nee".

**Google Play → Handelaarsstatus (DSA).** Als bedrijf vul je je KvK-gegevens
in; als particulier kies je "geen handelaar" — maar dan mag je geen abonnement
verkopen.

**App Store → App Privacy.** Niet "Data Not Collected" — dat zou onwaar zijn.
Apple kent een uitzondering voor gegevens die iemand zelf, af en toe en
vrijwillig invult, maar die geldt níét zodra het voor marketing wordt
gebruikt, en de nieuwsbrief is dat. Dus: **ja**, en dan twee typen.

| Type | Waarvoor | Aan de persoon gekoppeld | Tracking |
|---|---|---|---|
| Contact Info → **Email Address** | Developer's Advertising or Marketing, plus App Functionality | Ja | Nee |
| Usage Data → **Product Interaction** | App Functionality | Ja | Nee |

"Aan de persoon gekoppeld" is ja omdat het adres zelf de persoon is, en de
vijf getallen onder het id van dat adres binnenkomen. "Tracking" is nee: er
gaat niets naar een ander, en er wordt niets gecombineerd met gegevens van
elders. Dat onderscheid is wat Apple echt controleert.

Op diezelfde pagina staat het veld voor het **privacybeleid**:
`https://darijaforkids.eu/privacy`.

**App Store → Age Rating.** De vragenlijst levert 4+ op.

**App Store → Kids Category.** Overweeg hem *niet* in de Kids-categorie te
zetten. Die categorie is strenger (onder andere over externe links) en je app
bereikt ouders die zoeken op "arabisch leren" beter in **Onderwijs**. De app
voldoet aan de regels van beide; het is een marketingkeuze, geen technische.

---

## 5. Aan de reviewer

Het veld heet **App Review Information** en staat *onderaan de versiepagina*,
voorbij Description, Keywords en de URL's — niet op de pagina "App Review" in
de linkerkolom, want dat is de wachtrij van wat al is ingediend. Zie je het
blok daar niet, dan verschijnt het als stap in de indienstroom nadat je op
*Add for Review* hebt gedrukt; je dient daarmee nog niets in.

Vink **Sign-In Required** uit — er is geen account — en vul je naam,
telefoonnummer en `info@darijaforkids.eu` in.

**In het Engels.** Het reviewteam werkt internationaal en Engels is wat daar
iedereen leest; een notitie die de reviewer niet meteen begrijpt kost een dag.
De Nederlandse knopnamen staan er met hun vertaling achter, want de reviewer
kiest bij de eerste start zelf een taal en die is niet per se Engels.

Apple leest dit veld echt. Zet er dit in:

> Darijaforkids teaches children Moroccan Arabic (Darija). No account and no
> login is needed — the app opens straight into the first lesson.
>
> To test the subscription: tap "Leren" (Learn) in the bottom bar and open the
> fourth lesson of the first unit (Lhruf). The first three alphabet lessons and
> the first lesson of unit 2 are free; everything after that asks for the
> subscription. Any word with a padlock in "Woorden" (Words) or "Alfabet"
> (Alphabet) does the same. The subscription screen has a parental gate: a
> multiplication you must answer before the purchase opens. Any correct answer
> works.
>
> The subscriptions are app.darijaforkids.yearly (EUR 59.99 per year) and
> app.darijaforkids.monthly (EUR 6.99 per month), both with a 3-day free trial.
> Separately there is app.darijaforkids.ebook (EUR 14.99, one-off): the e-book
> containing the whole course, which is included with the yearly plan.
>
> Terms of use and the privacy policy are reachable from the subscription
> screen inside the app, and online at https://darijaforkids.eu/voorwaarden and
> https://darijaforkids.eu/privacy.
>
> Under "Jij → Voor ouders" (You → For parents) a parent can leave an email
> address for news or a weekly progress note. This sits behind the same
> parental gate, both checkboxes start empty, and nothing is sent until the
> address is confirmed by email. A child cannot enter anything there. This is
> the only data the app collects, and it is declared in App Privacy.
>
> The interface is available in English, Dutch, French, German, Spanish and
> Italian, switchable at any time under Settings.

---

## 6. De gesloten test bij Google (alleen op de persoonlijke route)

Heb je in §1 voor een organisatieaccount gekozen, dan slaat deze paragraaf over
en mag je meteen productie aanvragen. Anders moet dit af vóór je mag
publiceren, en geldt het **per app**:

De regel zelf staat bij Google onder
[Testvereisten voor nieuwe accounts](https://support.google.com/googleplay/android-developer/answer/14151465).

1. Maak een **gesloten test** aan en upload je AAB.
2. Verzamel **12 testers** die het opt-in-adres gebruiken. Familie en vrienden
   mogen, maar ze moeten het écht installeren — Google meet dagelijkse
   activiteit.
3. Houd dat **14 dagen aaneengesloten** vol.
4. Pas daarna kun je "productie" aanvragen.

Zet dit als eerste in gang en doe de rest van deze lijst ondertussen. Testers
die de app installeren en meteen weer verwijderen tellen niet: Google kijkt
naar dagelijkse activiteit over die veertien dagen.

---

## 7. Lanceren

De eerste week bepaalt meer dan de rest van het jaar. Het materiaal ligt klaar:

| Wat | Waar | Waarmee gemaakt |
|---|---|---|
| Winkelteksten, zes talen | `store/listing.{nl,fr,de,es,it,en}.md` | met de hand |
| Berichten voor social, zes talen | `store/social.md` | met de hand |
| Perskit | `store/press-kit.md` | met de hand |
| Zoekwoorden per winkel | `store/keywords.md` | met de hand |
| Schermafbeeldingen | `store/screenshots/` | `npm run screenshots` |
| Beelden voor social en de site | `store/marketing/` | `npm run marketing` |
| Films, vier formaten per taal | `store/video/` | `npm run intro` |
| Het e-boek, zes talen | `public/ebook/` | `npm run ebook` |

De films, schermafbeeldingen en marketingbeelden staan niet in git — ze worden
uit de app zelf gemaakt, dus draai die drie commando's op de dag dat je ze
nodig hebt en ze kloppen met wat er in de winkel staat.

Wat werkt, op volgorde:

1. **Je eigen netwerk eerst.** Familie-WhatsApp, vrienden met kinderen. Vraag
   niet om een recensie, vraag om een reactie: *"Wat zegt jouw familie voor
   brood?"*
2. **Facebook-groepen voor Marokkaanse ouders**, per stad en per land. Die
   groepen hebben duizenden leden en precies dit probleem.
3. **Scholen en moskeeën** die weekendlessen Arabisch geven. Die zoeken al
   jaren materiaal voor Darija en vinden het niet.
4. **Instagram en TikTok.** Het sterkste filmpje is niet de app, maar je eigen
   kind dat iets tegen oma zegt. De app is het bijschrift.
5. **Ramadan en Eid.** De twee momenten waarop dit soort berichten het verst
   reist. Plan er één omheen.

Vraag de eerste twintig mensen om een recensie in de winkel. Daaronder komt een
app niet in de aanbevelingen terecht, en het is het makkelijkste wat je vrienden
voor je kunnen doen.

---

## 8. Na de lancering

- Kijk eens per week in beide consoles naar crashes. Er is geen crashmelder in
  de app, dus dit is je enige zicht erop.
- Lees elke recensie. Bij een taalapp zijn de nuttigste recensies de mensen die
  zeggen dat hun familie een woord anders zegt — dat is gratis redactiewerk.
  `docs/INHOUD.md` legt uit hoe je een woord of een zin aanpast.
- Bij elke update: `versionCode` en `versionName` omhoog in
  `android/app/build.gradle`, en het buildnummer in Xcode.
- Houd de zes talen gelijk. Een test faalt als er een vertaling ontbreekt, dus
  dat gaat vanzelf goed zolang je `npm test` draait.

---

## Alle links op één plek

De Apple-links heb ik gecontroleerd; die werken. De rest kon ik vanaf hier niet
bereiken — ze staan er op naam en zijn stabiel, maar loop ze even na.

### Aanmelden

| | |
|---|---|
| Apple Developer Program | https://developer.apple.com/programs/enroll/ ✓ |
| App Store Connect | https://appstoreconnect.apple.com |
| Google Play Console aanmelden | https://play.google.com/console/signup |
| Google Play Console | https://play.google.com/console |
| D-U-N-S-nummer aanvragen | https://developer.apple.com/enroll/duns-lookup/ |
| KvK inschrijven | https://www.kvk.nl/starten/inschrijven-bij-de-kvk/ |
| KvK: adres afschermen | https://www.kvk.nl/over-het-handelsregister/adresgegevens-afschermen/ |
| Belastingdienst, kleineondernemersregeling | https://www.belastingdienst.nl/kor |

### De regels waar je app aan wordt getoetst

| | |
|---|---|
| App Review Guidelines | https://developer.apple.com/app-store/review/guidelines/ ✓ |
| Apple, apps voor kinderen | https://developer.apple.com/app-store/kids-apps/ ✓ |
| Apple, privacylabels | https://developer.apple.com/app-store/app-privacy-details/ ✓ |
| Apple, Small Business Program | https://developer.apple.com/app-store/small-business-program/ ✓ |
| Apple, maten van schermafbeeldingen | https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications/ ✓ |
| Google, beleid voor ontwikkelaars | https://play.google.com/about/developer-content-policy/ |
| Google, Families-beleid | https://support.google.com/googleplay/android-developer/answer/9893335 |
| Google, Data safety-formulier | https://support.google.com/googleplay/android-developer/answer/10787469 |
| Google, gesloten test met 12 testers | https://support.google.com/googleplay/android-developer/answer/14151465 |

### Als je de postdienst aanzet

| | |
|---|---|
| Cloudflare (worker en database) | https://dash.cloudflare.com |
| Brevo (de mail) | https://www.brevo.com |
| Alles erover | [`server/LEES-MIJ.md`](../server/LEES-MIJ.md) |

### Hosting voor de website

| | |
|---|---|
| Netlify | https://app.netlify.com |
| Cloudflare Pages | https://pages.cloudflare.com |
| Uitgeschreven | [DEPLOY.md](DEPLOY.md) |

### De rest van deze map

| | |
|---|---|
| Het geld en de producten | [PAYMENTS.md](PAYMENTS.md) |
| De consoles, veld voor veld | [STORES.md](STORES.md) |
| Online zetten | [DEPLOY.md](DEPLOY.md) |
| Een woord of zin aanpassen | [INHOUD.md](INHOUD.md) |
| Wie dit koopt en waarom | [MARKT.md](MARKT.md) |
| De Android-build | [ANDROID.md](ANDROID.md) |
| Opnames maken en toevoegen | [`src/audio/LEES-MIJ.md`](../src/audio/LEES-MIJ.md) |
