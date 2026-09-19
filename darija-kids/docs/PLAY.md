# Google Play, van account tot publicatie

Eén lijst, in de volgorde waarin de Play Console hem afdwingt. Elk blok zegt
waar je moet zijn, wat je invult en waarom het zo moet — zodat je niet hoeft te
gokken als een scherm er net iets anders uitziet.

De Play Console verandert regelmatig van menunamen. Waar hieronder een pad
staat als **Monetisatie → Producten → Abonnementen**, zoek dan op het laatste
woord als het middelste stuk anders heet.

---

## 0. Wat je bij de hand wilt hebben

| | |
|---|---|
| Account | Google Play Console, betaald (€ 22 eenmalig) |
| Bedrijf | Venship, KvK 77780868, btw NL003000506B28 |
| Contact | info@darijaforkids.eu · +31 6 29479436 |
| Adres | Torenlaan 5 B, 1402 AT Bussum |
| Privacy-URL | https://darijaforkids.eu/privacy |
| Voorwaarden | https://darijaforkids.eu/voorwaarden |
| Pakketnaam | `app.darijaforkids.learn` |
| Teksten en beelden | `store/play-pakket/` — per taal een map |
| Machine | Een laptop met Android Studio |

Het pakket met teksten en schermafbeeldingen maak je opnieuw met
`npm run playpakket`. Lees eerst `store/play-pakket/LEES-DIT-EERST.txt`.

---

## 1. Verificatie afronden

Zolang de verificatie loopt, blokkeert de console het aanmaken van een app
volledig. Niet de helft, alles. Wachten is hier dus de enige stap.

Kijk in **Instellingen → Ontwikkelaarsaccount → Accountgegevens** of er nog een
verzoek om aanvullende documenten openstaat. Google vraagt doorgaans een
KvK-uittreksel en een identiteitsbewijs, en beantwoordt dat binnen enkele
werkdagen.

**Eén ding om te controleren, want het scheelt weken:** staat je account
geregistreerd als **organisatie** en niet als particulier? Een particulier
account moet vóór publicatie een gesloten test draaien met **twaalf testers die
veertien dagen aaneengesloten meedoen**. Voor een organisatie geldt die eis
niet. Venship is een eenmanszaak met een KvK-nummer en een D-U-N-S-nummer, dus
je hoort in de organisatie-categorie. Staat er "particulier", regel dat dan nu
via de support van de Play Console — later omzetten kan niet zonder een nieuw
account.

---

## 2. De app aanmaken

**Alle apps → App maken.**

| Veld | Waarde |
|---|---|
| Naam van de app | `Darijaforkids` |
| Standaardtaal | Engels (Verenigde Staten) – en-US |
| App of game | App |
| Gratis of betaald | **Gratis** |

De app is gratis met aankopen in de app. Kies je "betaald", dan kun je dat
nooit meer terugdraaien en verlies je het gratis pad van zes units waar je hele
marketing op rust.

De standaardtaal is en-US omdat dat is wat iemand ziet in elk land waarvoor je
geen vertaling hebt. Nederlands voeg je straks toe als vertaling.

> De **pakketnaam** vul je hier níet in. Die ligt vast op het moment dat je je
> eerste bundel uploadt, en wordt dan `app.darijaforkids.learn`. Dat is
> onomkeerbaar, dus controleer bij die upload of het er precies zo staat.

---

## 3. De bundel bouwen

Dit doe je op je eigen laptop, niet in de console.

```bash
cd darija-kids
npm run build          # bouwt de web-app naar dist/
npx cap sync android   # kopieert dist/ in het Android-project
npx cap open android   # opent Android Studio
```

In Android Studio: **Build → Generate Signed App Bundle / APK → Android App
Bundle**.

De eerste keer maak je daar een **keystore** aan. Kies een pad buiten de
repository, bijvoorbeeld in je documentenmap, en gebruik een wachtwoord dat je
opslaat in je wachtwoordbeheerder.

> **Raak deze keystore nooit kwijt.** Zonder dat bestand kun je nooit meer een
> update van deze app publiceren — niet met een nieuwe sleutel, niet met een
> nieuw account. Zet er vandaag nog een kopie van op een tweede plek.

Wat al goed staat en waar je niets aan hoeft te doen: applicatie-id
`app.darijaforkids.learn`, minimaal Android 7 (API 24), doel-API 36, geen
cleartext-verkeer, versie 1.0 met versionCode 1. Voor elke volgende release
hoog je `versionCode` én `versionName` op in `android/app/build.gradle`.

Het resultaat is een `.aab`-bestand in
`android/app/build/outputs/bundle/release/`.

---

## 4. De bundel uploaden

**Testen → Interne tests → Nieuwe release maken.**

Begin bij de interne test en niet bij productie. Een interne test is binnen een
paar minuten beschikbaar voor jezelf, terwijl een productierelease dagen in
review ligt. Zo ontdek je een fout in je eigen app voordat Google hem ziet.

Bij de eerste upload vraagt Google of je **Play App Signing** wilt gebruiken.
Zeg ja. Google bewaart dan de sleutel waarmee de app naar telefoons gaat, en
jouw keystore is nog slechts de "upload-sleutel" — die kan Google desnoods voor
je vervangen. Zonder Play App Signing is een verloren keystore definitief.

Voeg jezelf toe als tester (**Testers → E-maillijst maken**, met je eigen
Google-adres) en installeer de app op je telefoon via de link die de console je
geeft.

**Test op een echt toestel voordat je verder gaat.** Dit is het enige moment
waarop je ziet of de aankopen werken, of het geluid speelt en of de app soepel
loopt op iets anders dan een laptop.

---

## 5. App-inhoud: de formulieren

**Beleid → App-inhoud.** Hier staat een lijst die helemaal groen moet zijn
voordat je kunt publiceren. Ze mogen in elke volgorde, maar dit is de handigste.

### Privacybeleid
```
https://darijaforkids.eu/privacy
```

### App-toegang
"Alle functionaliteit is beschikbaar zonder speciale toegang." De app heeft
geen inlog. De betaalde units zijn geen speciale toegang — Google bedoelt hier
afgeschermde delen die een reviewer niet kan bereiken.

### Advertenties
**Nee**, de app bevat geen advertenties.

### Inhoudsclassificatie
Een vragenlijst zoals die van Apple. Categorie: **Onderwijs**. Op alle vragen
over geweld, seks, grof taalgebruik, drugs, gokken en schrikwekkende inhoud:
**nee**. Bij de vragen die niet over inhoud gaan:

- Kunnen gebruikers met elkaar communiceren? **Nee**
- Kunnen gebruikers content delen of uploaden? **Nee**
- Deelt de app de locatie van de gebruiker? **Nee**
- Bevat de app een onbeperkte webbrowser? **Nee**
- Digitale aankopen? **Ja**

### Doelgroep en inhoud
Vink de leeftijdsgroepen onder de 13 aan. Daarmee valt de app onder het
**Families-beleid**. Dat verbiedt advertenties en analytics van derden — die
zitten er niet in — en staat aankopen in de app wél toe, mits prijs en
verlenging vóór de aankoop in beeld staan en er een ouderpoort voor zit. Zo is
het abonnementsscherm gebouwd.

Google vraagt daarna of de app "hoofdzakelijk voor kinderen" is. Antwoord
**ja**. De app moet dan een privacybeleid hebben dat kinderen noemt — dat heeft
hij.

### Gegevensbeveiliging (Data safety)
- Verzamelt of deelt je app gebruikersgegevens? → **Nee**

Dat is nagekeken en klopt: geen analytics, geen tracker, geen advertentie-SDK,
geen account. Alle voortgang staat in de opslag van het toestel. Het
aanmeldformulier voor de nieuwsbrief zit wel in de code, maar wordt alleen
getoond als er een server achter staat, en die is in de productiebuild leeg.
Aankopen lopen via Google zelf.

> Zet je ooit de nieuwsbrief aan, dan moet dit formulier mee veranderen naar
> *Persoonlijke informatie → E-mailadres*. Anders klopt je verklaring niet
> meer, en dat is bij Google een reden voor verwijdering.

### Overige
Gezondheidsapps, financiële functies, overheidsapps, COVID-apps: allemaal
**nee**/niet van toepassing.

---

## 6. De winkelvermelding

**Groeien → Winkelaanwezigheid → Hoofdvermelding in de winkel.**

Begin met **en-US**, want dat is je standaardtaal. Voeg daarna de andere vijf
toe onder **Vertalingen beheren**: nl-NL, fr-FR, de-DE, es-ES, it-IT.

Per taal, alles uit `store/play-pakket/<taal>/`:

| Veld in de console | Waar het vandaan komt |
|---|---|
| Naam van de app | `teksten.md`, kop **Google Play → Titel (max 30)** |
| Korte beschrijving | `teksten.md`, **Korte beschrijving (max 80)** |
| Volledige beschrijving | `teksten.md`, **Volledige beschrijving** |
| Telefoonschermen | alles uit `schermen/` |
| 7-inch tabletschermen | alles uit `schermen-tablet-7inch/` |
| 10-inch tabletschermen | alles uit `schermen-tablet-10inch/` |
| Uitgelichte afbeelding | `uitgelicht-1024x500.png` |

En één keer, niet per taal:

| App-icoon | `store/play-pakket/icoon-512.png` |
|---|---|
| Video | een YouTube-link; het bestand staat in `store/video/<taal>/intro-breed.mp4` en moet eerst naar YouTube (mag op "verborgen" staan) |

Let op bij de teksten: in `teksten.md` staat bovenaan een blok voor de **App
Store** en onderaan een blok voor **Google Play**. Je hebt het tweede nodig. De
teksten zijn geteld op de limieten die Play hanteert; een titel van 31 tekens
wordt geweigerd.

De tabletschermen zijn geen bijzaak. Zonder die twee mappen zet Play bij je app
op een tablet een waarschuwing dat hij daar mogelijk niet goed werkt, en dat
leest een ouder als "niet voor mijn toestel".

---

## 7. De producten

**Monetisatie → Producten.** Google's model verschilt van dat van Apple: een
abonnement heeft een **basisabonnement** (de looptijd en de prijs) en daaronder
eventueel **aanbiedingen** (de gratis proefperiode). Twee lagen dus, waar Apple
er één heeft.

### Abonnementen

**Abonnementen → Abonnement maken.**

**Jaar**
- Product-ID: `app.darijaforkids.yearly`
- Naam: `Een jaar`
- Basisabonnement: ID `jaar`, type **Automatisch verlengend**, factureringsperiode **1 jaar**
- Prijs: **€ 59,99** in Nederland, de rest door Google laten omrekenen
- Aanbieding: type **Gratis proefperiode**, duur **3 dagen**, voor iedereen die nog niet geabonneerd is, alle regio's

**Maand**
- Product-ID: `app.darijaforkids.monthly`
- Naam: `Per maand`
- Basisabonnement: ID `maand`, **Automatisch verlengend**, factureringsperiode **1 maand**
- Prijs: **€ 6,99**
- Aanbieding: **Gratis proefperiode**, **3 dagen**, alle regio's

> **€ 59,99 en niet € 59,88.** Apple werkt met vaste prijspunten en daar bestaat
> € 59,88 niet. Zet je Play op hetzelfde bedrag, dan toont de app in beide
> winkels € 5,00 per maand en klopt je marketing overal. De app leest de prijs
> live uit de winkel en rekent het maandbedrag zelf uit.

### Het e-boek

**In-app-producten → Product maken.**
- Product-ID: `app.darijaforkids.ebook`
- Naam: `Het e-boek`
- Beschrijving: `Alle woorden, letters en grammatica.`
- Prijs: **€ 14,99**
- **Gezinsbibliotheek: aanzetten.** Bij een eenmalig product kan dat, en dan kan
  het hele gezin het e-boek openen.

### Een verschil met Apple dat je moet weten

Apple heeft **Family Sharing** voor abonnementen: één aankoop, tot zes
gezinsleden, ieder met een eigen Apple-account. **Google Play kent dat voor
abonnementen niet.** De Gezinsbibliotheek van Google werkt voor apps en voor
eenmalige aankopen zoals het e-boek, maar niet voor abonnementen.

Op Android geldt een abonnement dus voor het Google-account dat het afsluit, op
alle toestellen waarop dat account is ingelogd. Een kind met een eigen
Google-account (via Family Link) valt daarbuiten.

Dat betekent dat de regel "één abonnement voor het hele gezin" op Android niet
waar is. Zie de opmerking in `src/i18n/` — dit moet per platform verschillend
komen te staan vóór de Android-release.

---

## 8. Landen en prijzen

**Groeien → Beschikbaarheid in landen.** Alle landen, tenzij je een reden hebt
om ergens niet te verkopen.

Google rekent de prijs per land om op basis van je Nederlandse bedrag,
inclusief lokale btw. Je hoeft daar niets aan te doen.

---

## 9. Publiceren

De volgorde die het minste risico geeft:

1. **Interne test** — jij en een paar mensen om je heen. Direct beschikbaar.
2. **Gesloten test** — verplicht als je account particulier is (twaalf testers,
   veertien aaneengesloten dagen). Voor een organisatie mag je dit overslaan.
3. **Productie** — **Productie → Nieuwe release maken**, dezelfde bundel,
   release-notities in zes talen, en dan **Beoordeling starten**.

Reken op een paar dagen tot een week voor de eerste review. Volgende updates
gaan meestal binnen een dag.

---

## Wat daarna nog moet

- Beide punten hieronder zijn inmiddels gedaan: de prijs staat overal op
  € 59,99 (€ 5,00 per maand), en de gezinsregel verschijnt alleen op iOS.
- Schriftelijke toestemming voor de stemopnames — zie `store/press-kit.md`.
