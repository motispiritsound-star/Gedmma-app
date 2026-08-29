# NATIVE_CAPABILITIES

**Wat een telefoon ons wél en niet kan vertellen — What a phone can and cannot tell us**

> Dit document is expres precies over de grens tussen wat is gebouwd, wat is
> nagemaakt en wat een goedkeuring van Apple of Google nodig heeft. Wie hier
> vaag over is, verkoopt uiteindelijk een schatting als meting.

---

## Samenvatting / Summary

| Mogelijkheid / Capability | iOS | Android | In deze build / In this build |
| --- | --- | --- | --- |
| Dagtotalen per **grove categorie** | ✅ met entitlement | ✅ met special access | 🔶 mock |
| Aantal keer oppakken / ontgrendelen | ✅ met entitlement | ✅ (unlocks) | 🔶 mock |
| Apps pauzeren tijdens een focusmoment | ✅ ManagedSettings | ❌ geen ondersteunde weg | 🔶 mock (iOS-pad), ❌ Android |
| Gebruik **per app** naar onze server | ❌ we vragen het niet | ❌ we sturen het niet door | ❌ nooit |
| Berichten, browsergeschiedenis, toetsaanslagen, locatie | ❌ | ❌ | ❌ nooit, in geen enkel plan |

Legenda: ✅ mogelijk · 🔶 achter een interface, met een nagemaakte
implementatie · ❌ niet gebouwd en niet gepland.

---

## 🍎 iOS — FamilyControls, ManagedSettings, DeviceActivity

### Wat Apple aanbiedt

Sinds iOS 15 bestaat het Screen Time API-drieluik:

- **FamilyControls** vraagt toestemming en levert *ondoorzichtige* tokens voor
  apps en categorieën. Je krijgt geen bundle-id's; je krijgt een token dat je
  alleen kunt teruggeven aan het systeem.
- **ManagedSettings** kan een schild plaatsen: geselecteerde apps of categorieën
  tonen tijdelijk een tussenscherm.
- **DeviceActivity** rapporteert gebruik via een aparte app-extensie, die in een
  eigen proces draait en **geen netwerktoegang** heeft.

Die laatste beperking is de belangrijkste, en hij werkt in ons voordeel: Apple
heeft het zo ontworpen dat gedetailleerd gebruik niet naar een server kán. Wat
wij van de native laag krijgen is dus al een aggregaat.

### Wat je nodig hebt om het aan te zetten

1. **Het `com.apple.developer.family-controls` entitlement.** Dat vraag je aan
   bij Apple, met een beschrijving van je gebruik. Het wordt niet automatisch
   toegekend.
2. **Een development build of een TestFlight-build.** In Expo Go werkt het
   niet, en in de simulator ook niet: er is geen echte Screen Time-database.
3. **Een expliciete handeling van de gebruiker** op een scherm dat uitlegt wat
   er gemeten wordt. Wij roepen `requestAuthorization()` nooit bij het starten
   van de app.

### Hoe het in deze codebase zit

`packages/domain/src/adapters/ios.ts` definieert `NativeIosScreenTimeModule` en
`IOSScreenTimeAdapter`. De adapter krijgt de native module geïnjecteerd. Is die
er niet — CI, web, Expo Go, een build zonder entitlement — dan meldt
`authorizationState()` `entitlement_missing` en geeft `getDailyUsage()` **geen
waarde** terug. Geen nul, geen schatting, geen placeholder.

De native kant aggregeert per dag naar hele minuten per grove categorie vóórdat
er iets in JavaScript aankomt. Daarbovenop filtert `sanitiseCategories()` alles
weg wat geen bekende categorie is; een unittest voert er expres
`com.example.messenger` en `browsingHistory` in en verwacht dat die verdwijnen.

```ts
// wat de adapter maximaal teruggeeft / the most the adapter ever returns
{ dayKey: '2026-03-02', minutesByCategory: { social: 30, video: 45 },
  pickups: 40, source: 'os_verified', provider: 'ios.DeviceActivity' }
```

### Wat wij bewust níét doen

- Geen `FamilyActivityPicker` waarin een ouder in het geheim apps aanvinkt
  zonder dat het kind het scherm ziet.
- Geen schild dat op afstand wordt gezet. `FocusShieldRequest` heeft een veld
  `appliedLocally: true` dat letterlijk alleen die waarde kan hebben.
- Geen poging om via een MDM-profiel meer te krijgen dan de API geeft.

---

## 🤖 Android — UsageStatsManager en Digital Wellbeing

### Wat Android aanbiedt

`UsageStatsManager` geeft voorgrondtijd per pakket. Dat is *meer* detail dan we
willen, en dat brengt een verantwoordelijkheid mee: we brengen die lijst in
kaart naar grove categorieën **op het toestel** en sturen alleen het aggregaat
door. De pakketlijst verlaat het apparaat niet en wordt niet bewaard.

`PACKAGE_USAGE_STATS` is een *special access* permission. Die kun je niet met
een dialoogje aanvragen; de gebruiker moet naar Instellingen. Dat is een
bewuste drempel van Google en wij proberen er niet omheen te werken.

### Wat Android níét kan

Er is **geen ondersteunde manier** om apps van derden te pauzeren. De trucs die
daarvoor circuleren — een accessibility service die vensters wegdrukt, een
overlay over een andere app — misbruiken voorzieningen voor mensen met een
beperking en zijn in strijd met het Play-beleid. Wij bouwen ze niet.

`AndroidUsageAdapter.capabilities().canApplyFocusShield` staat daarom hard op
`false`, en `applyFocusShield()` geeft `adapter.android.shield_unsupported`
terug. In de app leest dat als: *"Android kan andere apps niet voor ons
pauzeren. Een focusmoment is hier een belofte die we samen houden."*

Dat is niet alleen eerlijk, het past ook bij het product. Een focusmoment dat
alleen werkt omdat de telefoon het afdwingt, leert een gezin niets.

### OEM-variatie

Sommige fabrikanten wijzigen of verwijderen Digital Wellbeing, en de cijfers
lopen dan uiteen. Merkt de adapter dat de gegevens ontbreken, dan tonen we
niets in plaats van een schatting (`native.android.oem_variation`).

---

## 🧪 De mock-adapter

`MockScreenTimeAdapter` is de standaard in ontwikkeling, in de tests, in de
demo en op elk toestel dat het niet ondersteunt. Twee eigenschappen maken hem
verantwoord:

1. **Hij is deterministisch.** Dezelfde seed geeft op elke machine dezelfde
   cijfers, dus de demo ziet er overal hetzelfde uit en snapshots zijn stabiel.
2. **Hij liegt niet over zichzelf.** `producesSource` is `'simulated'`, en
   `MAX_CONFIDENCE_BY_SOURCE.simulated` is `'low'`. Overal waar zo'n getal
   verschijnt staat "Voorbeeldgegevens / Example data" ernaast, met de uitleg
   dat het over niemand in dit gezin gaat.

Het demogezin in de seed bevat daarom **twaalf gesimuleerde rijen en nul
`os_verified`-rijen**. Dat is geen omissie maar de kern van de demonstratie:
het weekoverzicht moet er goed uitzien wanneer de telefoon níéts heeft gemeld,
en het zegt dat dan ook — *"Geen telefoon heeft iets gemeld."*

---

## 🚫 De onbekende-platform-adapter

`UnsupportedScreenTimeAdapter` is wat je krijgt in een browser, op een toestel
zonder entitlement of op een OEM-build zonder de cijfers. Hij geeft op elke
vraag `ok: false` met een reden, en zijn `limitationKeys` bevatten
`adapter.none.self_report_instead`: het scherm biedt aan dat je je eigen
getallen invult, gelabeld als `self_reported`.

---

## Een native module toevoegen / Adding a native module

De interfaces staan klaar. Wat er nog moet gebeuren:

1. **iOS**: een Expo-config-plugin die het entitlement en een DeviceActivity-
   rapportextensie toevoegt, plus een Swift-module die
   `NativeIosScreenTimeModule` invult. Exporteer hem als
   `apps/mobile/src/native/FocusFamilyScreenTime.ts`; `loadIosModule()` pikt
   hem dan automatisch op, en doet dat nog steeds veilig als hij ontbreekt.
2. **Android**: een Kotlin-module die `NativeAndroidUsageModule` invult,
   inclusief de pakket-naar-categorie-kaart op het toestel. Exporteer hem als
   `apps/mobile/src/native/FocusFamilyUsageStats.ts`.
3. **Beide**: een uitlegscherm vóór de aanvraag, en een audittrail-regel bij
   het aanzetten. De toestemmingslaag doet de rest — zonder een geldig
   `measurement.os_verified`-record weigert de API de meting alsnog, ook als de
   telefoon ja heeft gezegd.

Merk op wat stap 3 betekent: het besturingssysteem en FocusFamily moeten het
allebéí goedvinden, en bij een tiener hoort daar ook de tiener zelf bij. Een
ouder die het toestel in handen heeft, kan de instemming van het kind niet
omzeilen door in Instellingen op "toestaan" te tikken.

Note what step 3 means: the operating system *and* FocusFamily both have to
agree, and for a teenager that includes the teenager. A parent holding the
device cannot bypass their child's assent by tapping "allow" in Settings.

---

## Wat we nooit vragen / What we never request

Deze permissies staan niet in `app.json`, worden niet aangevraagd en staan op
de weigerlijst in `permissions.ts`:

```
camera · microphone · location (fijn of grof) · contacts · photo library
accessibility service · notification listener · SMS · call log
screen recording · device admin · MDM-profielen
```

`app.json` bevat een lege `permissions`-lijst voor Android en een lege
`NSUserActivityTypes` voor iOS. Dat is te controleren met
`npx expo config --type public`.
