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

- **Icoon** — staat er al. `assets/` bevat een echt Slimvos-icoon plus de
  adaptive-icon-lagen en het monochrome thema-icoon voor Android, allemaal
  gerenderd uit dezelfde mascotte-SVG. Verander je de mascotte, draai dan
  `node tools/maak-iconen.mjs` opnieuw (vereist Playwright).
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

## 6. Verdienmodel

Het plan staat uitgewerkt in [`PRIJZEN.md`](PRIJZEN.md): gratis laag waarin
rekenen onbeperkt blijft, daarna **een week gratis en dan €4,99 per maand**, of
€39,99 per jaar.

Hoe het geld automatisch op je zakelijke rekening komt en wat je daarvoor moet
instellen — KvK, btw-nummer, bankgegevens in beide consoles, het
Small Business Program — staat in [`BETALINGEN.md`](BETALINGEN.md). Begin daar
vroeg mee: bankverificatie en belastingformulieren duren langer dan de app.

In de app zit de hele stroom al: proefweek, automatisch verlengen, opzeggen,
hervatten, toegangsregels en de datum van de eerste afschrijving. Wat nog moet
gebeuren:

1. **Producten aanmaken** in App Store Connect en de Play Console met de
   product-ids uit `src/core/abonnement/plannen.ts`, allebei met een
   introductieaanbod van 7 dagen gratis, in dezelfde abonnementsgroep.
2. **RevenueCat aansluiten** in `src/state/aankoop.ts`. Dat bestand heeft nu een
   implementatie die niets afschrijft; de schermen veranderen niet mee.
3. **Een server voor het account** kiezen (Supabase of Firebase) en achter
   `src/state/auth.ts` hangen, zodat een abonnement op meerdere toestellen
   werkt. Zonder server blijft het lidmaatschap aan één toestel gebonden.

## 7. Volgorde die ik zou aanhouden

1. Zelf testen met Expo Go — deze week nog.
2. Vragen laten nakijken door een leerkracht.
3. Icoon en screenshots laten maken.
4. Developer-accounts aanvragen (dit duurt het langst, begin er vroeg mee).
5. Interne test op Android + TestFlight op iOS.
6. Pas daarna het abonnement bouwen. Een app zonder betaalmuur die goed voelt,
   is meer waard dan een betaalmuur om een app die nog niet af is.
