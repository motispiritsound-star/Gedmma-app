# De eerste avond op de Mac

Dit is de enige stap in het hele project waarvoor macOS nodig is. Apple laat
een iOS-app alleen ondertekenen en inleveren vanaf een Mac met Xcode; dat is
hun eis en er is geen omweg omheen die stand houdt.

Reken op twee tot drie uur, waarvan het meeste wachten is.

## 0. Wat er op de Mac moet staan

```bash
# Xcode uit de App Store (groot, doe dit als eerste — het duurt het langst)
xcode-select --install          # de opdrachtregelgereedschappen
sudo xcodebuild -license accept # de licentie, één keer

# Node. De versie staat in .node-version
brew install node
node -v                         # moet overeenkomen met .node-version

# CocoaPods. Capacitor gebruikt dit voor de iOS-afhankelijkheden
sudo gem install cocoapods
pod --version
```

Open Xcode één keer met de hand voordat je verdergaat. Hij installeert bij de
eerste start nog componenten, en als je dat overslaat faalt `cap open ios` met
een foutmelding die nergens op slaat.

## 1. De repo ophalen

```bash
git clone https://github.com/motispiritsound-star/Gedmma-app.git
cd Gedmma-app/darija-kids
npm install
```

Controleer of het bouwt voordat je aan iOS begint. Bouwt dit niet, dan ligt
het niet aan Xcode:

```bash
npm run build
npm test
```

## 2. Het iOS-project aanmaken

`ios/` staat niet in de repo — het is bouwresultaat en het wordt hier
aangemaakt. Dit doe je één keer:

```bash
npx cap add ios
npx cap sync ios
npx @capacitor/assets generate --ios
npx cap open ios
```

De laatste opdracht opent Xcode. Daarna hoef je voor elke volgende versie
alleen nog:

```bash
npm run ios      # dit is: npm run build && npx cap sync ios
npx cap open ios
```

## 3. In Xcode

Drie dingen, in deze volgorde.

**Signing.** Klik links op het project → *Signing & Capabilities*. Vink
*Automatically manage signing* aan en kies je Team (je Apple Developer-account).
Xcode maakt het certificaat en het provisioning profile zelf aan.

**Bundle-id.** Moet letterlijk `app.darijaforkids.learn` zijn — precies wat er
in `capacitor.config.ts` staat en wat je in App Store Connect hebt aangemaakt.
Wijkt het af, dan kun je uploaden en komt het nergens aan.

**Versie en buildnummer.** Onder *General*. De versie is wat de klant ziet
(1.0.0). Het buildnummer moet bij elke upload omhoog, ook als je dezelfde
versie opnieuw inlevert. Apple weigert een buildnummer dat al bestaat, en dat
merk je pas na tien minuten uploaden.

Kies daarna bovenin als doel **Any iOS Device (arm64)** — niet een simulator,
want van een simulatorbuild kun je niet archiveren.

Dan: **Product → Archive**. Dat duurt een paar minuten. Als het klaar is opent
de Organizer: *Distribute App → App Store Connect → Upload*.

## 4. TestFlight

De build staat na tien tot twintig minuten in App Store Connect onder
*TestFlight*, met de status *Processing*. Daarna vraagt Apple één keer of de
app versleuteling gebruikt — het antwoord is **nee** (er zit geen eigen
cryptografie in; HTTPS telt niet mee).

Zet jezelf als interne tester en installeer de TestFlight-app op je iPhone.

## 5. Waar je op let bij het spelen

Dit is de eerste keer dat de app op een echte iPhone draait, en iOS is precies
de plek waar het geluid anders werkt dan overal:

- **Geluid aan, met de zijschakelaar op stil.** De app moet dan nog steeds
  geluid geven. Geeft hij niets, dan staat de audiosessie in de verkeerde
  categorie.
- **Zet hem weg en pak hem terug op.** iOS schorst de audiosessie na elk
  uitgesproken woord; het vangnet daarvoor zit in `src/engine/audio.ts` en dit
  is de enige manier om te zien of het werkt.
- **Vliegtuigstand.** Alles hoort te werken: de app is volledig ingepakt,
  fonts en opnames incluis.
- **Een gesprek of een timer tijdens een les.** Daarna moet het geluid
  terugkomen zonder de app opnieuw te starten.

## 6. Daarna

Pas als het op de telefoon goed speelt: in App Store Connect de app indienen,
met de drie producten eraan gekoppeld (zie `docs/PAYMENTS.md`). Zet hem op
**handmatig vrijgeven**, zodat jij de dag kiest en niet de reviewer.

## Wat er misgaat, en wat het dan is

| Foutmelding | Wat het is |
| --- | --- |
| `pod: command not found` | CocoaPods staat er niet; `sudo gem install cocoapods` |
| `Signing for "App" requires a development team` | Team niet gekozen in *Signing & Capabilities* |
| `No profiles for 'app.darijaforkids.learn' were found` | De bundle-id bestaat nog niet in App Store Connect, of wijkt af |
| `The bundle version must be higher than…` | Buildnummer omhoog en opnieuw archiveren |
| `Archive` staat grijs | Doel staat op een simulator; zet het op *Any iOS Device* |
| Xcode vraagt om een nieuwere macOS | Xcode uit de App Store past bij de macOS die erop staat; werk macOS bij |
