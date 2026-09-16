# Lanceren

Eén lijst, van "de app is af" tot "hij staat in de winkel". Alles wat de code
kan doen is gedaan; wat hier overblijft is wat een mens met een bankrekening
en een paspoort moet doen.

Reken op **vier tot zes weken** tussen je eerste account en je eerste
downloader. Niet omdat het werk zoveel is, maar omdat er één wachttijd van twee
tot vier weken in zit die je niet kunt inhalen — welke dat is, hangt af van de
keuze in §1. Begin dus met die keuze, en doe de rest van deze lijst ondertussen.

---

## 0. Vandaag nog: de twee dingen die alles blokkeren

**Vul `src/content/operator.ts` in.** Sinds de Digital Services Act is wie in
een appwinkel verkoopt een *handelaar*, en horen naam, adres, telefoonnummer,
e-mailadres en KvK-nummer zichtbaar te zijn voor de koper. Beide winkels vragen
ze in de console en zetten ze op je pagina in de winkel; dit bestand zet
dezelfde gegevens ook in de app, onderaan de privacy- en de
voorwaardenpagina. Zolang naam en e-mail leeg zijn staat er in plaats daarvan
een waarschuwing.

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

## 0b. De website is de app

Je hoeft geen aparte site te bouwen. Dezelfde build is een gewone statische
website, en die website levert precies de drie adressen op die de winkels van
je vragen voordat ze een app aannemen:

| Wat de winkel vraagt | Wat je invult |
|---|---|
| Privacy policy URL (beide) | `https://jouwdomein.nl/privacy` |
| EULA / voorwaarden (Apple, verplicht bij abonnementen) | `https://jouwdomein.nl/voorwaarden` |
| Support URL (Apple, verplicht) | `https://jouwdomein.nl/ouders` |
| Marketing URL (Apple, optioneel) | `https://jouwdomein.nl` |

Op alle drie die pagina's staat onderaan je handelaarsblok, zodra
`operator.ts` is ingevuld. De voorpagina is de landingspagina: wat het is, voor
wie, en een knop om het meteen te proberen — bezoekers kunnen de hele gratis
cursus in de browser doen zonder iets te installeren, wat de beste demo is die
er bestaat.

**Domein.** Kies er één en koop hem voordat je de winkelaccounts aanmaakt: de
naam komt in beide consoles te staan en is later lastig te wijzigen.
`darijakids.nl` en `darijakids.app` zijn de logische; een `.nl` is bij een
Nederlandse registrar rond de € 10 per jaar.

**Hosting.** Cloudflare Pages, Netlify of Vercel — gratis, en ze bouwen
rechtstreeks uit deze repo. De instellingen staan in [DEPLOY.md](DEPLOY.md).
Eén ding moet goed: onbekende paden moeten `index.html` terugkrijgen, anders
geeft `/privacy` een 404 en wordt je app afgekeurd op precies die link.

**E-mail.** `hallo@jouwdomein.nl` moet echt werken — beide winkels sturen er
post naartoe en kopers mogen er klagen. Een doorstuuradres naar je eigen inbox
is genoeg; dat kan gratis bij de meeste registrars.

---

## 1. De accounts, en de ene keuze die telt

| Wat | Waar | Kost | Duurt |
|---|---|---|---|
| KvK-inschrijving | kvk.nl | € 82,25 | een afspraak, daarna direct |
| Google Play Console | play.google.com/console | $ 25 eenmalig | 1–2 dagen verificatie |
| Apple Developer Program | developer.apple.com | € 99 per jaar | 1–2 dagen, soms langer |
| D-U-N-S-nummer (alleen voor de organisatieroute) | dnb.com | gratis | tot 30 dagen |

**Apple is simpel.** Een eenmanszaak is geen aparte rechtspersoon, dus schrijf
je in als *individual / sole proprietor*. Dat scheelt een D-U-N-S-nummer: die
eis geldt alleen voor organisaties met rechtspersoonlijkheid. Je eigen naam
wordt dan de verkopersnaam in de App Store.

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

Er zijn **twee** producten, in dezelfde abonnementsgroep:

| Product-id | Duur | Prijs | Naam voor de koper |
|---|---|---|---|
| `app.darijakids.yearly` | 1 jaar, verlengt automatisch | € 59,88 (Apple: € 59,99) | Een jaar volledige toegang |
| `app.darijakids.monthly` | 1 maand, verlengt automatisch | € 6,99 | Volledige toegang per maand |

Allebei met **3 dagen gratis**. De ids moeten exact zo, anders vindt de code ze
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

> Darija Kids leert kinderen Marokkaans-Arabisch. Er is geen account en geen
> login nodig — de app opent direct in de eerste les.
>
> Om het abonnement te testen: tik onderin op "Leren", scrol naar unit 7 en tik
> op "Bekijken". Op het abonnementsscherm staat een ouderpoort: een
> vermenigvuldiging die je moet beantwoorden voordat de aankoop opent. Elk
> juist antwoord werkt.
>
> De abonnementen zijn app.darijakids.yearly (€ 59,88 per jaar) en
> app.darijakids.monthly (€ 6,99 per maand), beide met 3 dagen gratis.
> De voorwaarden en het privacybeleid staan in de app onder het
> abonnementsscherm, en online op [je URL].

---

## 6. De gesloten test bij Google (alleen op de persoonlijke route)

Heb je in §1 voor een organisatieaccount gekozen, dan slaat deze paragraaf over
en mag je meteen productie aanvragen. Anders moet dit af vóór je mag
publiceren, en geldt het **per app**:

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

De eerste week bepaalt meer dan de rest van het jaar. `store/social.md` heeft
de berichten in zes talen; `store/press-kit.md` is wat je een journalist of
een nieuwsbrief stuurt.

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
