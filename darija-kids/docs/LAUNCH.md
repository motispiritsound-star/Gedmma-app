# Lanceren

Eén lijst, van "de app is af" tot "hij staat in de winkel". Alles wat de code
kan doen is gedaan; wat hier overblijft is wat een mens met een bankrekening
en een paspoort moet doen.

De app zelf staat er klaar voor: 118 tests groen, elk scherm nagelopen in zes
talen op drie schermbreedtes, alle 34 klanken gemeten, en de winkelteksten,
schermafbeeldingen, films en het e-boek klaar in zes talen.

En de stem is af. Alle 28 letters, alle 304 woorden en alle 100 zinnen worden
gezegd door iemand die Darija spreekt — 432 opnames, geen enkele meer door een
computerstem. Dat was de grootste onbekende van dit project en die is weg.

Wat nu nog ontbreekt staat in de eerste blokken van de checklist hieronder, en
dat is geen code meer: accounts, formulieren en een Mac.

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
- [ ] Apple: handelaarsverificatie (DSA) — **in review**, niets te doen dan wachten
- [ ] Apple: naamcorrectie van "Adi" naar "Adil" — zaak **102968992781** loopt
- [ ] Apple: bankgegevens — ingediend, wordt verwerkt
- [ ] Google: identiteitsverificatie — documenten aangeleverd, **wachten**
- [ ] Google: nakijken of het account als **organisatie** staat, niet als particulier — scheelt twee weken (§6)
- [ ] Google: bankrekening en belastinggegevens invullen (§2)

### De producten — Apple

- [x] Abonnementsgroep `Volledige toegang`, met groepsnaam `Darijaforkids`
- [x] `app.darijaforkids.yearly` — `Een jaar`, 1 jaar, **€ 59,99**
- [x] `app.darijaforkids.monthly` — `Per maand`, 1 maand, **€ 6,99**
- [x] Beide: 3 dagen gratis als **Introductory Offer**, alle 175 landen
- [x] Beide: **Family Sharing** aan
- [x] Beide: naam en beschrijving in het Nederlands
- [x] Beide: review-screenshot van 1290 × 2796
- [x] **Levels**: Jaar op 1, Maand op 2 — zodat overstappen een upgrade is
- [ ] `app.darijaforkids.ebook` — **niet-verbruikbaar**, € 14,99, Family Sharing aan

### De producten — Google Play

Kan pas na de verificatie. Volledige uitleg in [docs/PLAY.md](PLAY.md).

- [ ] Abonnement `app.darijaforkids.yearly`, basisabonnement 1 jaar, **€ 59,99**
- [ ] Abonnement `app.darijaforkids.monthly`, basisabonnement 1 maand, € 6,99
- [ ] Beide een aanbieding **gratis proefperiode, 3 dagen**
- [ ] Eenmalig product `app.darijaforkids.ebook`, € 14,99, **Gezinsbibliotheek aan**

### Wat je uploadt

- [x] Schermafbeeldingen in zes talen, tien per taal — `npm run screenshots`
- [x] Een aanbodplaatje met vlag, prijs en gezinsregel — staat op plek drie
- [x] App preview 886×1920, onder de 30 seconden — `npm run intro`
- [x] Winkelteksten in zes talen — `store/play-pakket/<taal>/teksten.md`
- [x] Icoon en splashscherm — `npm run assets`
- [x] Het e-boek in zes talen — `npm run ebook`
- [ ] Apple: naam, ondertitel, trefwoorden, beschrijving en screenshots per taal
- [ ] Google: de winkelvermelding per taal, begin bij en-US (§PLAY 6)
- [ ] Android: een **AAB** bouwen en ondertekenen, keystore op twee plekken bewaren (§3)
- [ ] **Een Mac regelen** — zonder macOS geen iOS-build, en dus geen App Store (§3)
- [ ] iOS: `npx cap add ios`, archiveren in Xcode, naar TestFlight

### De formulieren

- [ ] Apple **App Privacy** — *No, we do not collect data from this app* (§4)
- [ ] Apple **Age Rating** — overal None, wordt 4+
- [ ] Apple: categorie **Education**; de Kids Category pas bij een latere versie
- [ ] Google **Gegevensbeveiliging** — verzamelt en deelt niets (§4)
- [ ] Google **Doelgroep en inhoud** — onder 13, dus Families-beleid
- [ ] Google **Inhoudsclassificatie** en **Advertenties: nee**
- [ ] Handelaarsgegevens in beide consoles — dezelfde als in `operator.ts`
- [ ] Privacy-URL en support-URL invullen (`/privacy` en `/ouders` op je domein)
- [ ] De notitie aan de reviewer overnemen (§5)

### Nog recht te zetten in de app

- [ ] De gezinsregel per platform juist maken: Apple deelt abonnementen met het
      gezin, Google **niet** — op Android klopt "voor het hele gezin" niet
- [ ] De prijs overal gelijktrekken als je € 59,99 aanhoudt; teksten en website
      noemen nu nog € 59,88
- [ ] `src/site/links.ts` vullen met de echte winkeladressen zodra je ze hebt —
      dan worden "Binnenkort" weer gewone downloadknoppen

### Voor je op verzenden drukt

- [x] `npm test` — 144 tests
- [x] `npm run typecheck`
- [x] `npm run sweep -- --breed` — elk scherm, zes talen, licht en donker, 320/390/820 px
- [x] `npm run soundcheck` — alle 34 klanken
- [x] `npm run lettercheck` — alle 432 opnames, geen enkele viel terug op de stem
- [x] `npm run bonuscheck`, `npm run historycheck`
- [x] `npm run feedbackcheck` — vierentwintig onderwerpregels, elke taal zijn eigen
- [ ] Op een écht toestel gespeeld, met geluid aan

### De uitspraak

- [x] 28 van de 28 letters ingesproken door een mens
- [x] 304 van de 304 woorden ingesproken
- [x] 100 van de 100 zinnen ingesproken
- [x] Alle 432 opnames nagehoord en goedgekeurd — `npm run sheet`
- [x] Alle 432 gemeten op stilte, lengte en oversturing
- [ ] Wie insprak, en schriftelijk dat het commercieel gebruikt mag worden — de tabel staat klaar in `store/press-kit.md`

### Publiceren

- [ ] Google: interne test — jezelf toevoegen en de app op je eigen telefoon zetten
- [ ] Google: gesloten test met 12 testers, 14 dagen — **alleen op de persoonlijke route** (§6)
- [ ] Apple: de app indienen, met de drie producten eraan gekoppeld
- [ ] Apple: wachten op review (1–3 dagen)
- [ ] Google: productie aanvragen
- [ ] Beide op **handmatig vrijgeven** zetten, zodat je zelf de dag kiest
- [ ] De eerste week uitvoeren (§7)

---

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
| `app.darijaforkids.yearly` | 1 jaar, verlengt automatisch | € 59,88 (Apple: € 59,99) | Een jaar volledige toegang |
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
npm run marketing                  # store/marketing/<taal>/
npm run brand                      # brand/ — logo, socials, flyer
npm run intro                      # store/video/<taal>/ — duurt een kwartier
```

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

**Google Play → Data safety.** Geen gegevens verzameld, geen gegevens gedeeld.
Dat is letterlijk waar. De enige vraag waar je even bij nadenkt: spraakherkenning
is in de Android-webweergave niet beschikbaar, dus de app vraagt geen
microfoontoestemming.

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

**App Store → App Privacy.** Kies "Data Not Collected". Er is geen SDK in deze
app die iets verzamelt.

**App Store → Age Rating.** De vragenlijst levert 4+ op.

**App Store → Kids Category.** Overweeg hem *niet* in de Kids-categorie te
zetten. Die categorie is strenger (onder andere over externe links) en je app
bereikt ouders die zoeken op "arabisch leren" beter in **Onderwijs**. De app
voldoet aan de regels van beide; het is een marketingkeuze, geen technische.

---

## 5. Aan de reviewer

Apple leest dit veld echt. Zet er dit in:

> Darijaforkids leert kinderen Marokkaans-Arabisch. Er is geen account en geen
> login nodig — de app opent direct in de eerste les.
>
> Om het abonnement te testen: tik onderin op "Leren", scrol naar unit 7 en tik
> op "Bekijken". Op het abonnementsscherm staat een ouderpoort: een
> vermenigvuldiging die je moet beantwoorden voordat de aankoop opent. Elk
> juist antwoord werkt.
>
> De abonnementen zijn app.darijaforkids.yearly (€ 59,88 per jaar) en
> app.darijaforkids.monthly (€ 6,99 per maand), beide met 3 dagen gratis. Los
> daarvan staat app.darijaforkids.ebook (€ 14,99 eenmalig): het e-boek met de hele
> cursus, dat bij het jaarabonnement is inbegrepen.
> De voorwaarden en het privacybeleid staan in de app onder het
> abonnementsscherm, en online op [je URL].
>
> Onder "Jij → Voor ouders" kan een ouder een e-mailadres achterlaten voor
> nieuws of een wekelijkse voortgangsmail. Dat staat achter dezelfde
> ouderpoort, beide vinkjes beginnen leeg, en er wordt niets gestuurd voordat
> het adres per mail is bevestigd. Een kind kan daar niets invullen.

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
| Opnames maken en toevoegen | [`src/audio/LEES-MIJ.md`](../src/audio/LEES-MIJ.md) |
