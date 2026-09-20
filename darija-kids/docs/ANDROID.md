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

Android Studio → *Open* → de map **`darija-kids/android`**. Niet de map
erboven; dan ziet hij het Gradle-project niet.

**Build → Generate Signed App Bundle / APK → Android App Bundle**

Bij *Key store path* de eerste keer **Create new…**:

| Veld | Wat |
|---|---|
| Key store path | ergens **buiten** deze map — documenten, een kluis |
| Wachtwoord | een echt wachtwoord, en bewaar het bij de sleutel |
| Alias | `upload` |
| Validity | 25 jaar of meer |

Bouw de variant **release**. De bundel komt hier terecht:

```
android/app/build/outputs/bundle/release/app-release.aab
```

## Over die sleutel

Hij hoort niet in git — `*.jks`, `*.keystore` en `keystore.properties` staan in
`.gitignore`. Wie de repo kan lezen zou anders een update kunnen uitbrengen
onder jouw naam, en gepusht is gepusht.

Bewaar hem op twee plekken die niet dezelfde computer zijn. Raak je hem toch
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
