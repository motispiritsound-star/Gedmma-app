# Naar de App Store en Google Play

De app is verpakt met [Capacitor](https://capacitorjs.com): dezelfde build die
op het web draait, in een echte iOS- en Android-app. `npm run build` schrijft
`dist/`, `npx cap sync` kopieert dat in de native projecten. Er is geen server
bij betrokken — alles, lettertypen inbegrepen, zit in de app zelf.

Wat hier al staat, en wat alleen jij kunt doen:

| | |
|---|---|
| ✅ Klaar | Capacitor-config, het complete Android-project, alle app-iconen en splashschermen, winkelteksten in vier talen, een privacypagina in de app |
| 🧑‍💻 Jij | Een Apple Developer-account (€ 99/jaar) en een Mac, een Google Play-account (€ 22 eenmalig), de naam en het e-mailadres van de uitgever, screenshots, en het indienen zelf |

## Eerst invullen

`src/content/operator.ts` bevat de naam, het e-mailadres en het land van de
uitgever. Zolang die leeg zijn, zet de privacypagina er zichtbaar een
waarschuwing boven — en beide winkels weigeren een app zonder werkende
privacy-URL en contactgegevens. Vul ze in vóór je indient.

De privacyverklaring staat op `/privacy` in de app zelf en is dus ook je
privacy-URL zodra de site online staat (bijvoorbeeld
`https://jouwdomein.nl/privacy`).

## Android

Het project staat in `gedmma/android/` en is compleet. Je hebt Android Studio
nodig (dat draait op Windows, macOS en Linux) en een Google
Play Console-account.

```bash
npm run build          # web-build
npx cap sync android   # kopieert dist/ naar het Android-project
npx cap open android   # opent Android Studio
```

In Android Studio: **Build → Generate Signed App Bundle**. Bewaar de keystore
die je daar aanmaakt op een veilige plek — raak je hem kwijt, dan kun je nooit
meer een update van dezelfde app publiceren.

Instellingen die al goed staan: applicatie-id `app.gedmma.learn`, minimaal
Android 7 (API 24), doel-API 36, geen cleartext-verkeer, versie 1.0 (code 1).
Voor elke volgende release hoog je `versionCode` en `versionName` op in
`android/app/build.gradle`.

In de Play Console vul je verder in:

- **Datavaststelling (Data safety)**: geen gegevens verzameld, geen gegevens
  gedeeld. Dat is letterlijk waar; de enige uitzondering om te melden is dat
  spraakherkenning in de webweergave niet beschikbaar is op Android, dus de app
  vraagt geen microfoontoestemming.
- **Doelgroep**: vink de leeftijdsgroepen onder 13 aan. Daarmee valt de app
  onder het **Families-beleid**: geen advertenties, geen analytics van derden,
  geen aankopen — daar voldoet de app aan omdat die dingen er niet in zitten.
- **Inhoudsclassificatie**: de vragenlijst levert PEGI 3 / Iedereen op.
- **Handelaarsstatus (DSA)**: sinds 2025 verplicht voor de EU. Publiceer je als
  particulier, dan kies je "geen handelaar"; als bedrijf vul je je KvK-gegevens
  in.

## iOS

Voor iOS heb je een **Mac met Xcode** nodig — dat is een eis van Apple, niet
van dit project. Op die Mac:

```bash
npm install
npm run build
npx cap add ios        # maakt gedmma/ios/ aan (alleen de eerste keer)
npx cap sync ios
npx @capacitor/assets generate --ios   # iconen en splashschermen
npx cap open ios       # opent Xcode
```

In Xcode stel je je Team in (Signing & Capabilities), controleer je dat de
bundle-id `app.gedmma.learn` is, en archiveer je via **Product → Archive** naar
App Store Connect.

In App Store Connect vul je in:

- **App Privacy**: "Data Not Collected". De app verzamelt niets, en dat is
  precies wat je aanvinkt.
- **Leeftijdsclassificatie**: 4+.
- **Categorie**: Onderwijs. Zet je hem in de **Kids-categorie** (6-8 of 9-11),
  dan gelden strengere regels: geen advertenties, geen analytics van derden, en
  een ouderpoort vóór elke link naar buiten. De app heeft geen van die dingen —
  er staat geen enkele externe link in — dus daar voldoet hij aan.
- **Toestemmingsteksten**: de app vraagt geen camera, geen locatie en geen
  microfoon. Voeg dus ook geen `NSMicrophoneUsageDescription` toe zolang dat zo
  blijft; een toestemming die je niet gebruikt, is een afwijzing waard.

### Spreekoefeningen in de winkelversies

De spraakherkenning van de browser bestaat niet in WKWebView (iOS) en niet in
de Android-webweergave. De app merkt dat en laat de spreekoefening netjes
zonder microfoon zien ("zeg het toch hardop"). Wil je echt inspreken in de
winkelversies, dan is de volgende stap
[`@capacitor-community/speech-recognition`](https://github.com/capacitor-community/speech-recognition)
— dan komt er wél een microfoontoestemming bij, inclusief uitleg in beide
winkels en in de privacyverklaring.

## Screenshots

Beide winkels willen echte schermafbeeldingen per taal. De snelste manier:

```bash
npm run preview        # of npm run dev
```

en dan in de browser een telefoonformaat kiezen. Nodig:

- **App Store**: 6,7-inch (1290×2796) en 13-inch iPad (2064×2752) als je iPad
  ondersteunt.
- **Play Store**: minimaal twee telefoonschermafbeeldingen, plus een
  functiegrafiek van 1024×500.

Goede keuzes: het leerpad, een woordkaart met Arabisch schrift, een oefening,
het woordenboek en de letterpagina. Maak ze per taal — de teksten in beeld
horen bij de taal van de winkelvermelding.

## De winkelteksten

`store/listing.nl.md`, `.fr.md`, `.de.md` en `.en.md` bevatten de naam,
ondertitel, trefwoorden en volledige beschrijving, al binnen de tekenlimieten
van beide winkels. Plakken en klaar.

## En daarna

Elke volgende release is:

```bash
npm test && npm run build && npx cap sync
```

daarna in Android Studio een nieuw bundle en in Xcode een nieuw archief, met
een opgehoogd versienummer. De webversie blijft gewoon los werken: die update
je door `dist/` opnieuw te publiceren, zonder review en zonder wachttijd.
