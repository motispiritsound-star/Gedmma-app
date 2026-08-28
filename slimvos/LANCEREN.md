# Van deze code naar een app in de stores

Dit is het pad van "het draait op mijn telefoon" naar "het staat in de App Store
en Google Play". Reken op vier tot zes weken, waarvan het meeste wachten is.

## 1. Zelf testen (nu meteen, gratis)

```bash
cd slimvos
npm install
npm start
```

Installeer **Expo Go** op je telefoon en scan de QR-code. De app draait dan
echt op je toestel — niet in een simulator. Dit is genoeg om alles te
beoordelen: de vragen, het tempo, of het niveau meebeweegt, of je kind het
snapt.

Laat het een week door een echt kind gebruiken voordat je verder gaat. Let op:

- Zijn de vragen te makkelijk of te moeilijk voor de gekozen groep?
- Snapt het kind de uitleg bij een fout antwoord?
- Hoe lang blijft het leuk? (10 vragen per ronde is een aanname)
- Kloppen de antwoorden? Laat dit ook door een leerkracht nakijken.

## 2. Voorbereiden op de stores

| Wat | Kosten | Doorlooptijd |
| --- | --- | --- |
| Apple Developer Program | $99 per jaar | 1–2 dagen (soms langer bij verificatie) |
| Google Play Console | $25 eenmalig | 1–2 dagen |
| EAS Build (Expo) | gratis tier volstaat om te beginnen | – |

Voor een bedrijfsaccount vraagt Apple een D-U-N-S-nummer; op persoonlijke naam
publiceren kan ook en gaat sneller.

## 3. Bouwen met EAS

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android --profile preview   # APK om zelf te installeren
eas build --platform all --profile production    # voor de stores
```

`eas build:configure` maakt `eas.json` aan. De bundle identifiers staan al
goed in `app.json` (`nl.slimvos.app`); pas ze aan als je een andere naam
kiest. Verhoog bij elke store-upload `version` en `ios.buildNumber` /
`android.versionCode`.

## 4. Testen met anderen

- **iOS:** `eas submit --platform ios` en daarna TestFlight. Interne testers
  (tot 100) kunnen meteen; externe testgroepen wachten op een korte review.
- **Android:** `eas submit --platform android` en gebruik het **interne
  testkanaal**. Testers hebben binnen een uur toegang.

Dit is de fase waarin je de app aan een paar bevriende gezinnen geeft. Plan er
minstens twee weken voor.

## 5. Wat je nodig hebt voor de store-inzending

- **Icoon** 1024×1024 zonder transparantie, en de adaptive-icon-lagen voor
  Android. In `assets/` staan nu de placeholders van de Expo-template — die
  moeten vervangen door een echt Slimvos-icoon.
- **Screenshots**: iPhone 6.7" en 6.5", en voor Android telefoon + tablet.
  `npm run web` en een smalle browser zijn genoeg om ze te maken.
- **Beschrijving** in het Nederlands, plus een korte Engelse versie.
- **Privacybeleid op een openbare URL.** Verplicht voor beide stores. De tekst
  staat in `PRIVACY.md`; die moet ergens online komen te staan.
- **Leeftijdsclassificatie**: 4+ (Apple) / Iedereen (Google).
- **Apple: "Made for Kids"?** Zodra je de kinderencategorie kiest gelden er
  strengere regels (geen externe links, geen analytics zonder toestemming).
  Deze app voldoet daar nu al aan, omdat er niets naar buiten gaat.
- **Google Play Families-beleid**: vul de vragenlijst "app gericht op
  kinderen" in en verklaar dat er geen advertentie-SDK's in zitten.

## 6. Verdienmodel — wat er nog gebouwd moet worden

Er zit nu **geen betaalonderdeel** in de app. De keuze die het beste past bij
"goedkoper dan Squla":

- Gratis: één vak volledig, plus een paar rondes per dag in de andere vakken.
- Abonnement (voorstel €3,99 per maand of €34,99 per jaar) voor alle vakken,
  onbeperkt, voor alle kinderen in het gezin op dat toestel.

Technisch: `expo-in-app-purchases` of RevenueCat, plus een grens in
`src/core/engine/` die bepaalt wat gratis is. Houd er rekening mee dat Apple en
Google 15% (klein bedrijf) tot 30% inhouden — dat is de belangrijkste reden dat
€3,99 realistischer is dan €2,99.

Belangrijk: zolang de app geen server heeft, kan een abonnement niet tussen
toestellen gedeeld worden. Dat is een bewuste ruil (privacy en kosten tegen
gemak) die je in de storebeschrijving eerlijk moet benoemen.

## 7. Volgorde die ik zou aanhouden

1. Zelf testen met Expo Go — deze week nog.
2. Vragen laten nakijken door een leerkracht.
3. Icoon en screenshots laten maken.
4. Developer-accounts aanvragen (dit duurt het langst, begin er vroeg mee).
5. Interne test op Android + TestFlight op iOS.
6. Pas daarna het abonnement bouwen. Een app zonder betaalmuur die goed voelt,
   is meer waard dan een betaalmuur om een app die nog niet af is.
