# De Mac, stap voor stap

Voor wie nog nooit op een Mac heeft gewerkt. Niets overslaan, niets
vooruitlopen. Reken op een avond, waarvan het meeste wachten is.

Er zijn maar twee programma's die je nodig hebt: **Terminal** (een venster
waarin je opdrachten typt) en **Xcode** (waarmee Apple-apps gemaakt worden).

---

## Deel A — De Mac klaarmaken

Dit doe je één keer. Daarna nooit meer.

### A1. Xcode installeren — begin hier, het duurt het langst

Xcode is ruim tien gigabyte. Zet het nu aan en doe de rest terwijl het
binnenkomt.

1. Klik onderin op het blauwe **App Store**-icoon (een blauwe cirkel met een A).
2. Typ linksboven in het zoekvak: `Xcode`. Druk op Enter.
3. Klik bij *Xcode* op **Installeren** of op het wolkje met de pijl omlaag.
4. Het kan een uur duren, soms langer. Laat de Mac aan staan.

### A2. Terminal openen

Terminal is een venster waarin je opdrachten typt in plaats van klikt. Het
ziet er kaal uit en dat hoort zo.

1. Druk op **⌘ + spatie** (de Command-toets naast de spatiebalk).
   Er verschijnt een zoekvak in het midden van het scherm.
2. Typ: `Terminal`
3. Druk op **Enter**.

Er opent een wit of zwart venster met een regel tekst en een knipperend
blokje. Dat is waar je typt.

**Drie dingen die je moet weten:**

- Elke opdracht sluit je af met **Enter**. Dan pas gebeurt er iets.
- Kopiëren is **⌘ + C**, plakken is **⌘ + V**. Plakken mag: je hoeft niets
  over te typen.
- Als er om een **wachtwoord** wordt gevraagd, zie je tijdens het typen
  *niets* — geen sterretjes, geen puntjes. Dat is geen fout. Typ je
  Mac-wachtwoord en druk op Enter.

Als er iets misgaat, sluit het venster niet. De foutmelding is het antwoord.

### A3. De gereedschappen van Apple

Plak deze regel in Terminal en druk op Enter:

```bash
xcode-select --install
```

Er verschijnt een venster met de vraag of je de gereedschappen wilt
installeren. Klik **Installeer**, accepteer de voorwaarden, en wacht tot het
klaar is (vijf tot tien minuten).

Krijg je in plaats daarvan de melding `command line tools are already
installed`, dan staan ze er al. Ga door.

### A4. Homebrew

Homebrew is een programma dat andere programma's voor je installeert. Zonder
Homebrew moet je alles met de hand zoeken en dat wil je niet.

1. Ga in Safari naar **https://brew.sh**
2. Bovenaan staat een lange opdracht die begint met `/bin/bash -c`. Klik op
   het kopieerknopje ernaast.
3. Plak hem in Terminal (**⌘ + V**) en druk op Enter.
4. Hij vraagt om je Mac-wachtwoord. Typen, Enter. (Je ziet niets — normaal.)
5. Hij vraagt één keer om **RETURN** te drukken om door te gaan. Doen.
6. Wachten. Tien tot vijftien minuten.

Aan het eind zegt Homebrew vaak dat je nog twee regels moet uitvoeren, onder
het kopje **Next steps**. Dat moet je echt doen — plak die twee regels ook in
Terminal.

Controleer daarna:

```bash
brew --version
```

Staat er `Homebrew 4.x.x`, dan is het gelukt. Staat er `command not found`,
dan zijn die twee regels onder *Next steps* niet uitgevoerd. Scroll terug in
het venster, zoek ze op, en plak ze alsnog.

### A5. Node en CocoaPods

Twee opdrachten, elk een paar minuten:

```bash
brew install node
```

```bash
sudo gem install cocoapods
```

Bij de tweede vraagt hij je Mac-wachtwoord. `sudo` betekent: doe dit met
beheerdersrechten.

Controleer:

```bash
node -v
pod --version
```

Er hoort iets te staan als `v22.x.x` en `1.x.x`. Twee keer een getal is goed.

### A6. Xcode één keer openen

Dit wordt het vaakst vergeten en het kost je anders later een uur zoeken.

1. **⌘ + spatie**, typ `Xcode`, Enter.
2. Hij vraagt om de licentie te accepteren. Klik **Agree**, vul je
   Mac-wachtwoord in.
3. Hij installeert nog wat onderdelen. Wachten.
4. Als je het welkomstscherm ziet: klaar. Je mag Xcode weer sluiten.

### A7. Inloggen met je Apple Developer-account

1. Open Xcode.
2. Menubalk bovenin: **Xcode → Settings** (of *Preferences* op oudere versies).
3. Tabblad **Accounts**.
4. Klik linksonder op **+**, kies *Apple ID*, log in met het account waarmee je
   je Apple Developer Program hebt betaald.
5. Rechts hoort nu je team te staan, met *Apple Developer Program* erachter.

Staat daar niets, dan is de lidmaatschapsbetaling nog niet verwerkt. Daar kun
je niets aan doen behalve wachten.

---

## Deel B — De app bouwen

Vanaf hier is het tikwerk. Alles in Terminal, regel voor regel, steeds Enter.

### B1. Het project ophalen

```bash
cd ~
git clone https://github.com/motispiritsound-star/Gedmma-app.git
```

`cd ~` betekent: ga naar je persoonlijke map. `git clone` haalt het project op.

Bij de eerste `git`-opdracht kan de Mac vragen om gereedschappen te
installeren. Zeg ja en probeer het daarna opnieuw.

Ga dan de projectmap in:

```bash
cd ~/Gedmma-app/darija-kids
```

Vanaf nu moet je **altijd in deze map staan** als je een opdracht geeft.
Twijfel je? Typ `pwd` en druk op Enter: er hoort
`/Users/jouwnaam/Gedmma-app/darija-kids` te staan.

### B2. Installeren en controleren

```bash
npm install
```

Dit haalt alle onderdelen op. Drie tot vijf minuten. Er komen waarschuwingen
voorbij; dat is normaal.

```bash
npm run build
npm test
```

Onderaan hoort `Tests <getal> passed` te staan, en nergens het woord
`failed`. Het getal groeit met elk deel dat erbij komt, dus schrik niet als
het hoger is dan de vorige keer. **Staat er wél `failed`, ga dan niet verder**
— dan ligt het niet aan de Mac, en dan wil ik de foutmelding zien.

### B3. Het iOS-project aanmaken

Drie opdrachten, in deze volgorde:

```bash
npx cap add ios
```

```bash
npx cap sync ios
```

```bash
npx @capacitor/assets generate --ios
```

De eerste duurt het langst, want daar draait CocoaPods. Zie je regels
voorbijkomen met `Installing...`, dan gaat het goed.

Dan:

```bash
npx cap open ios
```

Xcode gaat open met het project erin. Dat kan een minuut duren.

---

## Deel C — In Xcode

Xcode is één groot venster. Links een lijst met bestanden, in het midden wat
je hebt aangeklikt.

### C1. Het project selecteren

Klik helemaal bovenaan in de linkerlijst op **App** (met een blauw icoontje).
In het midden verschijnen tabbladen: *General*, *Signing & Capabilities*,
*Resource Tags*, enzovoort.

### C2. Signing

1. Klik op het tabblad **Signing & Capabilities**.
2. Zet een vinkje bij **Automatically manage signing**.
3. Kies bij **Team** jouw naam of bedrijfsnaam uit de lijst.

Xcode maakt nu zelf het certificaat aan. Even wachten. Verdwijnt de rode tekst,
dan is het goed.

### C3. De bundle-id controleren

Op datzelfde tabblad staat **Bundle Identifier**. Daar moet letterlijk staan:

```
app.darijaforkids.learn
```

Staat er iets anders, verbeter het. Dit moet exact overeenkomen met wat in App
Store Connect staat, anders upload je naar het niets.

### C4. Versie en buildnummer

Tabblad **General**, kopje *Identity*:

- **Version**: `1.0.0` — dit ziet de klant.
- **Build**: `1` — dit ziet alleen Apple.

Bij elke volgende upload moet **Build** omhoog: 2, 3, 4. Apple weigert een
nummer dat al bestaat, en dat merk je pas na tien minuten uploaden.

### C4b. Code Signing Identity — de val van Capacitor

Dit kost je anders een avond, dus doe het meteen.

Het iOS-project dat `npx cap add ios` genereert zet **Code Signing Identity**
op *Apple Development*, en dat geldt ook voor de Release-stand. Archiveren
gaat dan een ontwikkelprofiel zoeken in plaats van een distributieprofiel,
vindt er geen, en faalt met:

```
No profiles for 'app.darijaforkids.learn' were found
Communication with Apple failed: Your team has no devices…
```

Die melding wijst naar apparaten en naar Apple, en daardoor ga je op de
verkeerde plek zoeken. Het ligt aan deze instelling.

1. Tabblad **Build Settings**.
2. Klik op **All**; typ in het zoekvakje rechts: `code signing identity`.
3. Klap de regel **Code Signing Identity** open met het driehoekje ervoor.
4. Zet **Release** op **Apple Distribution**. *Debug* laat je op *Apple
   Development* staan.

Controleer op **Signing & Capabilities → Release** dat er nu
`Apple Distribution` staat. Dan pas archiveren.

### C4c. Als automatisch ondertekenen blijft hangen

Symptoom: bij *Signing & Capabilities* blijft staan

```
Communication with Apple failed
Your team has no devices from which to generate a provisioning profile.
No profiles for 'app.darijaforkids.learn' were found
```

en Archive faalt, ongeacht wat je bij *Code Signing Identity* invult.

Wat er gebeurt: automatisch ondertekenen wil eerst een **ontwikkel**profiel
maken. Dat kan alleen als je team minstens één apparaat kent. Kent het er
geen — en een telefoon aan de kabel registreert niet altijd — dan loopt het
vast vóórdat Xcode aan distributie toekomt.

Een App Store-profiel kent geen apparaten. Maak dat dus met de hand, en zet
automatisch ondertekenen uit voor Release. Dan is het probleem weg.

**Bij Apple, in de browser:**

1. Ga naar **developer.apple.com/account** → **Certificates, Identifiers &
   Profiles**.
2. Klik links op **Identifiers**. Staat `app.darijaforkids.learn` er niet bij,
   maak hem aan met **+** → *App IDs* → *App* → beschrijving `Darijaforkids`,
   Bundle ID **explicit** `app.darijaforkids.learn`.
3. Klik links op **Profiles** → **+**.
4. Kies onder *Distribution* de optie **App Store Connect** → **Continue**.
5. Kies bij *App ID* `app.darijaforkids.learn` → **Continue**.
6. Kies het certificaat **Apple Distribution** → **Continue**.
7. Geef het profiel een naam, bijvoorbeeld `Darijaforkids App Store`, en klik
   **Generate** → **Download**. Het bestand komt in je map *Downloads* te
   staan en eindigt op `.mobileprovision`.
8. Dubbelklik het gedownloade bestand. Xcode neemt het op.

**In Xcode:**

9. Tabblad **Signing & Capabilities** → klik op **Release**.
10. Haal het vinkje weg bij **Automatically manage signing**.
11. Kies bij **Provisioning Profile** het zojuist gemaakte
    `Darijaforkids App Store`.
12. **Code Signing Identity** mag nu wél op **Apple Distribution** — bij
    handmatig ondertekenen is dat geen conflict meer.

Laat *Debug* met rust: die mag automatisch blijven. Je archiveert met Release.

Daarna: **Product → Archive**.

### C5. Het doel instellen

Bovenin het venster, naast de naam *App*, staat een keuzemenu — daar staat nu
waarschijnlijk een iPhone-simulator.

Klik erop en kies **Any iOS Device (arm64)**.

Doe je dit niet, dan blijft *Archive* grijs.

### C6. Archiveren en uploaden

1. Menubalk: **Product → Archive**.
2. Wachten. Vijf tot tien minuten. Rechtsboven draait een balkje.
3. Als het klaar is opent het venster **Organizer** met jouw archief erin.
4. Klik rechts op **Distribute App**.
5. Kies **App Store Connect** → **Upload** → steeds **Next** → **Upload**.
6. Wachten tot er *Upload Successful* staat.

Gefeliciteerd. De app is bij Apple.

---

### C7. De twee regels in Info.plist — met één commando

Er horen twee regels in `Info.plist` te staan, en allebei zijn ze het soort
regel dat je vergeet:

| Regel | Waarom |
|---|---|
| `ITSAppUsesNonExemptEncryption` = NO | Zonder deze blijft elke upload op *Missing Compliance* staan en gaat hij niet naar je testers. Elke keer opnieuw. |
| `NSMicrophoneUsageDescription` | Zonder deze **sluit iOS de app af** zodra een kind in de spreekronde op de opnameknop drukt. Geen foutmelding, weg. |

Je hoeft ze niet aan te klikken. Dit zet ze allebei:

```bash
npm run ios
```

Dat bouwt de app, kopieert hem in het iOS-project, en zet daarna die twee
regels. Draai je het twee keer, dan staan ze er niet twee keer in.

Wil je het los draaien — bijvoorbeeld omdat je net `npx cap add ios` hebt
gedaan:

```bash
node scripts/ios-plist.mjs
```

Controleren of het gelukt is, zonder Xcode:

```bash
/usr/libexec/PlistBuddy -c "Print :NSMicrophoneUsageDescription" ios/App/App/Info.plist
```

Komt daar de zin over opnemen uit, dan staat het goed.

Let op: `ios/` staat niet in het repository, hij leeft alleen op je Mac.
`npx cap sync ios` laat die regels met rust. Draai je ooit opnieuw
`npx cap add ios`, dan zijn ze weg — en zet `npm run ios` ze er weer in.

### C8. Elke volgende build — de vaste volgorde

De code staat op GitHub, niet op je Mac. Sla je de eerste twee regels over,
dan bouw je de oude app in een nieuw jasje — en dat zie je pas als de build
al bij Apple staat.

```bash
cd ~/Gedmma-app
git pull origin main
cd ~/Gedmma-app/darija-kids
npm install
npm run build
npx cap sync ios
```

`npx cap sync ios` is degene die het vaakst wordt vergeten: die kopieert de
nieuwe app-bestanden naar het iOS-project. Zonder die stap verandert er niets
aan wat je archiveert.

Daarna in Xcode: **General → Build** ophogen (Apple weigert een nummer dat al
bestaat), dan **Product → Archive** en **Distribute App**.

## Deel D — TestFlight

1. Ga in Safari naar **appstoreconnect.apple.com** en log in.
2. Klik op je app, dan op het tabblad **TestFlight**.
3. De build staat er na tien tot twintig minuten, eerst met de status
   *Processing*.
4. Apple vraagt één keer of de app versleuteling gebruikt. Het antwoord is
   **nee** — er zit geen eigen cryptografie in; HTTPS telt niet mee.
5. Voeg jezelf toe als **interne tester** (onder *Internal Testing*).
6. Installeer de app **TestFlight** op je iPhone uit de App Store en log in met
   hetzelfde Apple ID. De app staat erin.

### Waar je op let als hij op je telefoon staat

Dit is de eerste keer dat de app op echte iOS-hardware draait, en dat is
precies waar geluid anders werkt dan overal:

- **Geluid met de zijschakelaar op stil.** Moet gewoon werken.
- **App wegzetten en terugpakken.** iOS schorst de geluidssessie na élk
  uitgesproken woord; het vangnet daarvoor zit in `src/engine/audio.ts` en dit
  is de enige manier om te zien of het klopt.
- **Vliegtuigstand.** Alles hoort te werken — de app is volledig ingepakt,
  opnames en lettertypen incluis.
- **Een telefoontje midden in een les**, en daarna verder spelen. Het geluid
  moet terugkomen zonder de app opnieuw te starten.

---

## Als er iets misgaat

| Wat er staat | Wat het is |
| --- | --- |
| `command not found: brew` | De twee regels onder *Next steps* bij Homebrew zijn niet uitgevoerd |
| `command not found: node` | `brew install node` is niet gelukt; probeer het opnieuw |
| `pod: command not found` | `sudo gem install cocoapods` is niet gelukt |
| `no such file or directory` | Je staat in de verkeerde map. `cd ~/Gedmma-app/darija-kids` |
| `Signing for "App" requires a development team` | Geen Team gekozen bij *Signing & Capabilities* |
| `No profiles for 'app.darijaforkids.learn' were found` | De bundle-id klopt niet, of bestaat nog niet in App Store Connect |
| `The bundle version must be higher than…` | Buildnummer omhoog en opnieuw archiveren |
| *Archive* is grijs | Het doel staat nog op een simulator; zet het op *Any iOS Device* |
| Xcode wil een nieuwere macOS | Werk macOS bij via **Systeeminstellingen → Algemeen → Software-update** |

Loopt het ergens vast: kopieer de hele foutmelding en stuur hem door. De
melding is bijna altijd het antwoord.

## Voor de volgende keer

Heb je dit één keer gedaan, dan is een nieuwe versie uitbrengen kort:

```bash
cd ~/Gedmma-app/darija-kids
git pull
npm install
npm run ios
npx cap open ios
```

Dan in Xcode het buildnummer omhoog en **Product → Archive**.
