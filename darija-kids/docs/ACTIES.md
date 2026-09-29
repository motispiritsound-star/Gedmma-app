# Wat jij nog moet doen

Eén lijst, zodat je hem in één zitting kunt afwerken. Alles wat ík kon doen
staat in de repository; dit is wat alleen jij kunt — omdat er een console,
een wachtwoord of een echte database aan te pas komt.

De volgorde is de volgorde. Hij loopt van "hier gaat een klant op stuk" naar
"dit kan ook volgende maand".

Alle opdrachten zijn voor PowerShell en werken vanuit elke map.

## Begin hier, in elk nieuw venster

Alles hieronder gebruikt `$p` voor de projectmap. Een variabele leeft maar in
het venster waarin je hem zet, dus **plak deze regel als eerste in elk nieuw
PowerShell-venster.** Hij zoekt de map zelf op:

```powershell
$p = (Get-ChildItem $HOME -Recurse -Depth 5 -Filter darija-kids -Directory -ErrorAction SilentlyContinue | Select-Object -First 1).FullName; $p
```

Hij drukt het gevonden pad af. Zie je niets, dan staat de map niet onder je
thuismap en klopt er iets anders niet.

**Zie je ergens "The variable '$p' cannot be retrieved because it has not been
set"?** Dan is dit venster nieuw en is bovenstaande regel nog niet gedraaid.
Dat is de enige oorzaak. Het is mij twee keer overkomen dat ik je opdrachten
met `$p` gaf zonder die regel erbij; vandaar dat hij nu bovenaan staat.

<details>
<summary>Liever één keer instellen en er nooit meer aan denken</summary>

Deze drie regels onthouden de map ook nadat je PowerShell afsluit. Elke regel
apart uitvoeren:

```powershell
$d = (Get-ChildItem $HOME -Recurse -Depth 5 -Filter darija-kids -Directory -ErrorAction SilentlyContinue | Select-Object -First 1).FullName
```

```powershell
if (-not (Test-Path $PROFILE)) { New-Item -ItemType File -Path $PROFILE -Force | Out-Null }
```

```powershell
Add-Content $PROFILE "`$p = '$d'"
```

Sluit PowerShell daarna en open hem opnieuw. Vanaf dan is `$p` er altijd, ook
in een vers venster, en kun je de regel hierboven overslaan.

</details>

---

## Nu eerst · Google Play heeft de app eruit gehaald

Op 29 september is versie 2 (1.1) afgewezen op de Broken Functionality-regel,
met één zin: *"Crashes: Your app crashes after opening."* De app staat niet meer
in de winkel. Dat gaat vóór alles hieronder.

Die ene zin is te weinig om iets te repareren; wat nodig is, is de
uitzondering en de regels eronder. Die zijn op te vragen met de sleutel die je
al hebt:

```powershell
npm --prefix $p run crashes -- --versie 2
```

Komt daar "Google kent hier geen crashes" uit, dan zegt dat niets: die cijfers
komen van toestellen van gebruikers die gegevens delen, en een app die vóór de
uitrol is afgewezen heeft die niet. Kijk dan in Play Console bij **Testen en
publiceren → Testen → Rapport vóór lancering**. Daar staat wat de beoordelaar
zelf zag, meestal met een filmpje en de uitzondering erbij. Dat is de ene plek
waar een muis niet te vermijden is.

**Dien nog geen beroep in en bouw nog geen versie 3.** Eén verkeerde inzending
kost weer een ronde van zeven dagen.

Wat we al weten: versie 1.1 is gebouwd op 23 september, vóór de foutopvang.
In die versie geeft elke fout bij het opstarten een wit scherm — geen tekst,
geen knop. Een beoordelaar die dat ziet schrijft "crashes after opening" op.
De bouw is hier koud gestart in een browser, ook met een nagebootste
Capacitor-laag in vier varianten, en hij rendert zonder fouten; R8 staat uit
en de splash-bron bestaat. Wat overblijft is native, en daarvoor is die
stacktrace nodig.

---

## 0 · Haal eerst op wat er klaarstaat

Alles van deze week staat op GitHub en niet op jouw schijf: de wisknop in het
portaal, de tijdslimiet op de post, de migraties, de lettertypen, het
cachebeleid, de foutopvang in de app. **Zonder ophalen rollen `deploy` en
`build` de oude code uit.**

```powershell
git -C $p pull
```

Zie je "Missing script" bij een opdracht uit deze lijst, dan is dit de reden.

---

## 1 · Apple: opnieuw indienen

De vier vragen over richtlijn 1.3 zijn beantwoord en Apple heeft ze
geaccepteerd: *"We appreciate your efforts to comply with the App Review
Guidelines. Please resubmit the app for review."* In App Store Connect staat
1.0 weer op **Ready for Review**.

Er is dus nog één handeling: **opnieuw indienen**. De build die er al ligt mag
je gebruiken — wat je hebt geantwoord klopt met dat binaire bestand.

De verstuurde tekst staat in `docs/APPLE-1.3.md`.

**Eén ding voor de volgende keer, niet om nu te heropenen.** In het verstuurde
antwoord staat dat de ouderpoort *op de website* zit. Dat klopt niet helemaal:
de app heeft zijn eigen poort en zijn eigen aanmelding — `src/engine/post.ts`
stuurt het adres vanuit de app. Apple is er niet over gevallen en de draad is
gesloten; laat het zo, maar weet het als het later terugkomt.

**Wil je de verbeteringen van deze week meenemen?** Dan is er een nieuwe build
nodig. Verplicht is het niet, maar er zit in: de foutopvang die voorkomt dat
een kind op een wit scherm belandt, de emoji die het antwoord van de
betekenis-oefening weggaf, en de raakvlakken die onder de 4d pixels zaten.

```powershell
npm --prefix $p run ios -- --build 2 --versie 1.0
```

Daarna archiveren op de Mac; zie `docs/MAC.md`.

---

## 2 · Vóór de eerste betalende klant

Zonder deze drie krijgt iemand die vandaag koopt niet wat hij betaalt.

### 2a · De prenten maken — ongeveer een uur

```powershell
npm --prefix $p run boeken -- --platen
```

Zonder dit ziet een Sba-koper "nog niet" in plaats van een prentenboek.

**Meldt hij per deel "staat er al, overgeslagen"? Geloof dat niet meteen.**
Dat komt uit `store/bladen/gedaan.json`, een notitiebestand op je eigen schijf.
Het zegt *mijn aantekeningen zeggen dat ik dit al deed* — niet dat de
bladzijden in R2 staan. Viel een upload ooit halverwege om, dan kloppen de
aantekeningen niet meer met de bak, en dan koopt iemand Sba en krijgt "nog
niet".

Vraag het daarom aan de bak zelf:

```powershell
npm --prefix $p run platencheck
```

Dat doet een steekproef op het eerste deel, het laatste, en een paar talen. Wil
je alles nalopen:

```powershell
npm --prefix $p run platencheck -- --alles
```

Ontbreekt er iets, dan draai je de prenten opnieuw met `--opnieuw`. Die vlag
laat de aantekeningen leeg beginnen, dus je hoeft geen bestand weg te gooien:

```powershell
npm --prefix $p run boeken -- --platen --opnieuw
```

Laat het draaien en doe ondertussen 2b niet — die schrijft in dezelfde mappen.

### 2b · De winkelbestanden verversen

```powershell
npm --prefix $p run winkel
```

```powershell
npm --prefix $p run lezen -- --r2
```

De delen 4, 5, 6, 9, 10 en 13 zijn redactioneel gewijzigd; de bestanden in de
winkel zijn nog de oude. Gemeten: alle 27 PDF's waren ouder dan de tekst.

### 2c · De proefbestellingen opruimen

Er staan ongeveer tien PROEF-bestellingen in de database van eerdere tests.

```powershell
npm --prefix $p run bestellingen
```

Dat laat zien wat er staat. Trek daarna elke PROEF-regel in:

```powershell
npm --prefix $p run intrekken
```

---

## 3 · Uitrollen wat ik heb gewijzigd

Deze week is er veel aan de worker en de site veranderd. Dit zet het live.

**Stap 3c is niet meer optioneel.** Mijn raakvlakregel van deze week sloopte de
kopbalk van de etalage op elke telefoon en tablet: acht menulinks in plaats van
één, merknaam nul pixels breed, taalkiezer buiten beeld, bladzijde zijwaarts te
schuiven. Dat is gerepareerd en gemeten, maar het staat pas live ná `build`.
Zolang je dat niet draait, staat de kapotte kop er nog.

### 3a · De database bijwerken

Dit is nieuw: het schema wordt niet meer in één klap opnieuw uitgevoerd, maar
in genummerde migraties. De eerste is met opzet een lege handeling op een
database die de tafels al heeft.

Probeer hem eerst op de lokale kopie:

```powershell
npm --prefix $p run schema -- --hier
```

En dan op de echte:

```powershell
npm --prefix $p run schema
```

**Wat je hoort te zien:** eerst een regel met wat er te wachten staat, dan een
tabelletje met `0001_begin.sql ✅` en verder niets. Staat er dat er rijen zijn
gewijzigd of verwijderd, stop dan en laat het me zien — dat hoort niet.

Er komt vandaag géén vraag tussen, en dat is met opzet: 0001 bestaat volledig
uit `CREATE TABLE IF NOT EXISTS` en `CREATE INDEX IF NOT EXISTS`, twaalf
opdrachten die op een database met de tafels erin niets doen. Nageteld, en dat
is precies waarom deze stap veilig is.

Bij een volgende migratie die wél iets aan bestaande gegevens verandert, stopt
het script en vraagt het eerst. Zit je in een venster waar dat niet kan, dan
zegt hij welke opdracht je moet draaien.

Voortaan is een wijziging aan de database een nieuw bestand:
`npm run schema -- --nieuw <naam>`. Schrijf er eerst iets in — een migratie die
alleen uit commentaar bestaat wordt door wrangler afgetekend als gedraaid, en
dan is dat nummer op terwijl er niets gebeurd is. Het script weigert hem nu,
maar weet waarom die regel er staat.

### 3b · De worker uitrollen

```powershell
npm --prefix $p run deploy
```

Hierin zit: de tijdslimiet op de post, de drie bladzijden die eerst vragen, het
e-mailadres dat niet meer in het logboek komt, en `workers_dev = false`.

**Controleer daarna dit ene ding**, want ik kon er vanaf mijn kant niet bij —
het netwerkbeleid van mijn omgeving blokkeert dat adres:

```powershell
curl.exe -s -o NUL -w "%{http_code}`n" https://post.darijaforkids.eu/portaal/mij
```

Dat hoort een getal te geven (401 of 200, niet 000 en geen foutmelding). Krijg
je niets, dan is het eigen adres niet meer bereikbaar en moet `workers_dev`
terug aan — zeg het dan, dan draai ik het terug.

### 3c · De site opnieuw bouwen en uitrollen

```powershell
npm --prefix $p run build
```

Hierin zit: de twee letters die nu vooraf worden opgehaald (de kop springt niet
meer), het cachebeleid voor 90% van de site, en de nieuwe tekst bij Sba
("prentenboeken voor de kleintjes").

---

## 4 · Zelf natesten — ik kon dit niet

Vijf dingen die alleen op een echt toestel of in een echte mailbox te zien zijn.

### 4a · Een echte mail, met de nieuwe knoppen

De drie links in een mail doen nu niets meer bij het aanklikken door een
scanner: ze tonen een bladzijde met één knop, en pas die knop voert het uit.

```powershell
npm --prefix $p run proefkoop
```

Open de mail die binnenkomt, en klik onderaan op **Uitschrijven**. Je hoort een
bladzijde te zien met de vraag en één knop — niet een melding dat je al
uitgeschreven bent. Druk op de knop; dán pas ben je uitgeschreven.

### 4b · De afmeldknop van de mailclient zelf

In Gmail en Apple Mail staat bovenin bij een nieuwsbrief een eigen
afmeldknopje. Dat doet een POST, en die hoort meteen uit te schrijven zonder
tussenbladzijde. Probeer het één keer.

### 4c · Een echte les op een echt toestel

In de oefening "Wat betekent dit?" stond dezelfde emoji op de vraag als op het
juiste antwoord — je kon hem oplossen zonder een letter Arabisch te lezen. Die
emoji is weg bij de vraag en staat nog wel bij de antwoorden.

Speel één les uit en kijk of dat klopt en of het niet te moeilijk is geworden
voor de jongste groep.

### 4d · Het herhaalscherm op een smalle telefoon

Als je nog een oud toestel hebt (iPhone SE of iets van 320 pixels breed):
daar stonden drie tegels naast elkaar en brak "VASTGEZET" midden in het woord.
Nu vallen ze onder de 360 pixels terug op twee kolommen.

### 4e · Het portaal op de apparaten die je klanten gebruiken

Computer, laptop, telefoon, tablet. Het voorlezen werkt per toestel anders,
want de stem komt van het toestel zelf.

---

## 5 · De winkels

### 5a · Play Console

- App access
- Managed publishing
- Target audience
- Bank- en belastinggegevens

### 5b · App Store Connect

- Prijsbasis op Nederland
- Royaltyvaluta van USD naar EUR
- DAC7
- De abonnementsteksten uit `store/abonnement-teksten.md`, zodra het slot van
  de beoordeling eraf is

### 5c · Het e-boek als Gumroad-product

De worker herkent `ebook`, `eboek` en `e-boek` alle drie, dus de slug mag je
zelf kiezen.

---

## 6 · Beveiliging

### 6a · De Brevo-sleutel nog één keer vervangen

Hij heeft in ons gesprek gestaan en op twee schermafdrukken. Maak een nieuwe
bij Brevo, verwijder de oude, en dan:

```powershell
npm --prefix $p run mailsleutel
```

Dat script controleert de sleutel én het afzenderadres vóór het hem opslaat,
dus je merkt het meteen als je de verkeerde plakt.

### 6b · Het koopgeheim behandelen als iets dat in logs staat

Gumroad kan geen koppen zetten, dus het geheim reist door de URL en komt
daarmee in de logs van Cloudflare terecht. Dat is niet weg te nemen. Wat wel
kan: vervang het zodra iemand anders bij die logs kan, en gebruik het nergens
anders voor.

```powershell
npm --prefix $p run koopgeheim
```

Dat zet het hele Gumroad-adres op je klembord in plaats van op het scherm.

---

## 7 · Open besluiten — hier heb ik jouw antwoord voor nodig

### 7a · Spraakherkenning op de website

In de app gebeurt het nooit: een WKWebView kent `SpeechRecognition` niet, dus
daar draait altijd de opnemen-en-terugluisteren-oefening. Maar op de website in
Chrome bestaat die API wél, en dan gaat het geluidsfragment van een kind naar de
servers van Google.

De privacytekst zegt "geen trackers, geen analytics, geen cookies van derden".
Dat blijft kloppen — herkenning is geen tracker — maar het is ook niet niets.

Mijn voorstel: dat pad weghalen en overal de opnemen-oefening gebruiken. De
code zegt er zelf al over dat herkenning voor Darija niet kán werken, want elke
motor is getraind op Standaardarabisch. Dan is het een functie die niet doet wat
ze belooft én een gegevensstroom die je niet nodig hebt.

Zeg of ik hem weghaal.

### 7b · De zips met PDF's naast het portaal

Je zei dat kopers géén PDF krijgen, juist omdat verspreiding dan eenvoudig is.
Maar de Gumroad-producten leveren op dit moment `sleutels-alle-delen.zip` en
`sba-alle-delen.zip`, en de LEES MIJ daarin zegt letterlijk *"Er zit geen
beveiliging op … het zijn jouw bestanden."*

Die twee spreken elkaar tegen. Het portaal met zijn intrekbare sleutel, zijn
merk op elke bladzijde en zijn openingsteller is gebouwd om verspreiding te
kunnen zien en stoppen — zolang dezelfde koop ook een onbeveiligde zip
oplevert, is dat allemaal decoratie.

Twee wegen:

- **Alleen portaal.** De zips van de producten halen, de beschrijving
  aanpassen naar "lees op elk apparaat, met voorlezen", de LEES MIJ laten
  vervallen. De koper krijgt de sleutelmail die er al is.
- **Beide, eerlijk.** De zip laten staan, de beschrijving eerlijk maken ("je
  krijgt de bestanden én een leeslink"), en accepteren dat de sleutel dan
  vooral gemak is en geen bescherming.

Zeg welke, dan voer ik hem uit.

---

## 8 · Edge-to-edge op Android — zodra de beoordelingen klaar zijn

Google meldt bij release 2 (1.1) twee **aanbevelingen**, geen blokkades. De
tweede (R8-optimalisatie) kan wachten. De eerste is echt:

> Edge-to-edge may not display for all users

`android/variables.gradle` zet `targetSdkVersion = 36`, en vanaf API 3e dwingt
Android edge-to-edge af: het stelsel tekent achter de statusbalk en de app moet
zelf ruimte vrijhouden. De app doet dat alleen onderaan —
`src/App.tsx:148` heeft `paddingBottom: env(safe-area-inset-bottom)` — en
nergens bovenaan. De kopbalk staat op `sticky top-0` (`src/ui/TopBar.tsx:29`),
dus op een toestel met Android 15 of 16 schuift hij onder de klok en het
batterijpictogram.

`viewport-fit=cover` staat al in `index.html`, dus `env()` geeft daar de echte
waarde terug. De wijziging is één regel op die kopbalk:

    style={{ paddingTop: 'env(safe-area-inset-top)' }}

**Waarom dit niet alvast gedaan is.** Op iOS staat `contentInset: 'always'` in
`capacitor.config.ts`. Of `env(safe-area-inset-top)` daar nul teruggeeft, of
de inkeping er een tweede keer bovenop zet, is niet vast te stellen zonder een
echt toestel — en een dubbele marge bovenaan is precies zo zichtbaar als het
probleem dat je oplost. Bovendien ligt deze build nu bij allebei de winkels.

**Hoe je het natest, als de beoordelingen klaar zijn.** Zet de regel erin,
bouw, en kijk op twee toestellen naar de bovenkant van het leerpad:

- Een Android met 15 of 16: staat de rij met hartjes en XP nu onder de klok,
  of eronder?
- Een iPhone met inkeping: is de ruimte boven de kopbalk gelijk gebleven?

Is het op iOS dubbel, dan hoort de regel achter een platformcontrole in plaats
van er kaal in.

---

---

## 9 · Na de lancering

Geen haast, maar wel opschrijven.

| | Wat | Waarom het kan wachten |
|---|---|---|
| G1 | Buurklus naar een eigen repository | Het deploybare doelwit in de root is al weg; de rest is opruimen |
| G2 | `noUncheckedIndexedAccess` aanzetten in de app | Geeft vermoedelijk tientallen meldingen — geen werk voor een lanceerweek |
| G3 | De expo-keten bijwerken | 3e npm-waarschuwingen, alle in bouwgereedschap; `--omit=dev` zegt nul. `npm audit fix --force` wil expo@57 installeren, een brekende wijziging |
| G4 | Elk van de drie maillinks een eigen token, met houdbaarheid | De prefetch-schade is weg; dit is verdediging in de diepte en kost een schemawijziging |
| G5 | `vergeetLink` haalt bij een geweigerde mail de rem per lid weg | Er gaat dan geen post uit, dus dit is belasting en geen spuit |
| G6 | Een migratie die halverwege omvalt, blijft halverwege staan | Zit in wrangler zelf; opgevangen door het sjabloon van `--nieuw`, dat vraagt om migraties die twee keer mogen draaien |

---

## Waar de rest staat

- `docs/AUDIT.md` — de pre-launch audit, tien bevindingen met de stand erbij
- `docs/SECURITY.md` — de security-audit als buitenstaander
- `docs/STAND.md` — wat er nog moet, zonder drie andere bestanden te lezen

---
