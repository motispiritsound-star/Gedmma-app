# De Android-build

Eén ding vooraf, en het is het enige waar deze bladzijde echt over gaat:

> **`android/app/src/main/assets/public` staat niet in git.**

Daar hoort de hele app in — alle schermen, alle 432 opnames, 22 MB. Capacitor
zet hem daar neer bij het synchroniseren, en git laat hem er met opzet buiten:
het is bouwresultaat, en het zou de repo verdubbelen.

Gevolg: wie het project uit git haalt en meteen in Android Studio op *Build*
drukt, krijgt een app die keurig bouwt, keurig installeert en een **leeg
scherm** laat zien. Geen foutmelding, geen waarschuwing. Dat is de val.

## Dus eerst dit

```bash
npm install
npm run android        # bouwt de app én zet hem in het Android-project
```

`npm run android` is `npm run build && npx cap sync android`. Draai hem opnieuw
na elke wijziging aan de app — Android Studio kijkt niet naar `src/`, alleen
naar wat er in die assets-map ligt.

Dat het gelukt is, zie je zo:

```bash
ls -la android/app/src/main/assets/public/index.html   # datum van vandaag
find android/app/src/main/assets/public -name '*.wav' | wc -l   # 432
```

## Dan de bundel

Twee commando's, allebei vanuit `darija-kids`:

```bash
npm run sleutel    # eenmalig: maakt de upload-sleutel aan
npm run aab        # bouwt, synct en ondertekent
```

`npm run sleutel` doet wat de wizard *Create new key store…* doet, maar dan
zonder de acht velden waar het altijd misgaat. Hij zet de sleutel in
`Documents/Darijaforkids-sleutel/`, dus **buiten** het project, verzint er een
wachtwoord van dertig tekens bij dat ernaast in `wachtwoord.txt` komt te staan,
en wijst `android/keystore.properties` naar allebei. Draai je hem nog een keer,
dan gebeurt er niets: één app heeft één upload-sleutel.

`npm run aab` is `npm run android` plus `gradlew bundleRelease`. Gradle leest de
sleutel uit dat properties-bestand en ondertekent zelf. Resultaat:

```
android/app/build/outputs/bundle/release/app-release.aab
```

Java hoeft niet ingesteld te zijn: beide scripts zoeken zelf een JDK op, en
installeren er anders een. Let op de versie — **Capacitor 8 compileert tegen
Java 21**, en een oudere javac weigert dat met `invalid source release: 21`.
Dat is een melding die niet zegt dat je Java te oud is, dus de scripts kijken
er voor je naar: staan er meerdere JDK's, dan wint de nieuwste.

Heb je Android Studio niet, of is het onder een ander account geïnstalleerd?
Dan haal je de SDK los op, zonder editor:

```bash
npm run sdk
```

Bij een volgende upload moet het versienummer omhoog — Play weigert twee
bundels met hetzelfde `versionCode`, ook als je de eerste hebt ingetrokken:

```bash
node scripts/maak-aab.mjs --versie 2
```

### Of met de hand, in Android Studio

Android Studio → *Open* → de map **`darija-kids/android`**. Niet de map
erboven; dan ziet hij het Gradle-project niet. Dan **Build → Generate Signed
App Bundle / APK → Android App Bundle**, variant **release**. Heb je
`npm run sleutel` gedraaid, dan is ondertekenen al geregeld en kun je gewoon
**Build → Build Bundle(s)** nemen.

## Over die sleutel

Hij hoort niet in git — `*.jks`, `*.keystore` en `keystore.properties` staan in
`.gitignore`, en het script zet hem daarom sowieso buiten de projectmap. Wie de
repo kan lezen zou anders een update kunnen uitbrengen onder jouw naam, en
gepusht is gepusht.

Bewaar die map op twee plekken die niet dezelfde computer zijn. Raak je hem toch
kwijt, dan is dat sinds **Play App Signing** geen ramp meer: Google bewaart de
échte handtekensleutel en die van jou is alleen de *upload*-sleutel, waarvoor
je een nieuwe kunt aanvragen. Reken wel op een week wachten.

## Wat erin zit

| | |
|---|---|
| Pakketnaam | `app.darijaforkids.learn` |
| versionCode | 1 |
| versionName | 1.0 |
| minSdk | 24 (Android 7) |
| targetSdk | 36 |
| Gradle | 8.14.3, Android Gradle Plugin 8.13.0 |

`targetSdk 36` is wat Google Play voor nieuwe apps eist. Bij een volgende
versie hoogt `versionCode` met één op — Play weigert twee bundels met hetzelfde
nummer, ook als je de eerste hebt ingetrokken.
