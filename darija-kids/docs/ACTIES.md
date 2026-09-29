# Wat jij nog moet doen

Eén lijst, zodat je hem in één zitting kunt afwerken. Alles wat ík kon doen
staat in de repository; dit is wat alleen jij kunt — omdat er een console,
een wachtwoord of een echte database aan te pas komt.

De volgorde is de volgorde. Hij loopt van "hier gaat een klant op stuk" naar
"dit kan ook volgende maand".

Alle opdrachten zijn voor PowerShell en werken vanuit elke map.

## Over de opdrachten hieronder

Elke opdracht is één regel die je kunt plakken, uit welke map dan ook, in een
vers venster. Ze zoeken de projectmap zelf op en zeggen het als ze hem niet
vinden. Je hoeft vooraf niets in te stellen.

Dat is niet altijd zo geweest. Ze gebruikten `$p` voor de projectmap, met
bovenaan deze lijst één regel die je in elk nieuw venster moest plakken om hem
te zetten. Dat is drie keer misgegaan met

```
The variable '$p' cannot be retrieved because it has not been set.
```

en het was elke keer dezelfde oorzaak: een vers venster, en een opdracht die
uit een gesprek werd geplakt in plaats van uit deze lijst. Een opdracht die
alleen werkt na een andere opdracht is een opdracht die stukgaat, en dat is
niet jouw fout maar een fout in hoe ze hier stonden. Nu draagt elke regel zijn
eigen voorbereiding mee.

De regel is daardoor lang. Dat hoef je niet te lezen: het stuk vooraan zoekt de
map, het stuk achteraan is wat er gebeurt.

Het zoeken duurt de eerste keer een paar seconden. Daarna staat `$p` in dat
venster en slaat elke volgende regel het zoeken over.

---

## Nu eerst · Google Play

Op 29 september is versie 2 (1.1) afgewezen op de Broken Functionality-regel,
met één zin: *"Crashes: Your app crashes after opening."* In Play Console staat
erbij dat de wijziging niet is doorgevoerd en dat een oudere versie beschikbaar
blijft — versie 1 (1.0) van 21 september. Het is dus de update die is
geblokkeerd.

### De oorzaak is gevonden

De bundel bevatte `?.` en `??`: 223 en 167 keer. Dat is syntaxis van Chrome 80,
februari 2020. Met `minSdkVersion 24` beloof je dat de app op Android 7 mag
draaien, en daar kan een WebView staan van Chrome 51. Zo'n WebView leest dat
bestand niet in — geen foutmelding, geen halve app, een wit scherm. Precies wat
Google *"apps that install, but don't load"* noemt.

Dat het eerder niet gevonden werd, komt doordat de bouw hier koud is gestart in
een móderne browser, en die leest `?.` moeiteloos. Die proef kon het nooit
vinden.

Drie dingen zitten nu in versiecode 4 die er in versie 2 niet in zaten, en alle
drie in het opstartpad:

| | |
|---|---|
| bouwdoel es2015 | de bundel wordt ingelezen vanaf Chrome 51 |
| foutopvang (28 sept) | een fout bij opstarten geeft tekst, geen wit scherm |
| winkelkoppeling afgevangen | `store.initialize()` gooide eerder ongehinderd door |

Wat er in een bundel zit is na te kijken zonder te raden:

```powershell
if (-not $p) { $p = (Get-ChildItem $HOME -Recurse -Depth 5 -Filter darija-kids -Directory -ErrorAction SilentlyContinue | Select-Object -First 1).FullName }; if ($p) { npm --prefix $p run watzitin } else { "darija-kids niet gevonden onder $HOME" }
```

Die opent het AAB-bestand en telt de syntaxis. Er moet "gebouwd op es2015"
uitkomen.

### Ingediend op 29 september

Versiecode 4 ligt bij Google ter beoordeling, samen met negentien wijzigingen:
de zes winkelvermeldingen, de landenuitbreiding, Content Rating, doelgroep 6+,
de privacyverklaring, de advertentie- en gegevensveiligheidsverklaring, en
Education als categorie. Google's eigen snelle controle vooraf vond niets.

Zeven dagen, mogelijk langer. Bericht komt per mail.

**Er is geen rapport vóór lancering gelezen, en dat was niet uit
onzorgvuldigheid.** Een interne test levert er geen; een gesloten test wel,
maar die moet eerst langs een beoordeling. En zolang de afwijzing openstond wou
Play Console geen deel van de wijzigingen apart insturen — *"Save for later is
unavailable... there are issues that affect all of your changes."* De volgorde
"eerst het rapport, dan indienen" bestaat in die console dus niet. Wordt versie
4 goedgekeurd, dan komt dat rapport alsnog van de gesloten test.

### Als het goedgekeurd wordt

Managed publishing staat aan, dus de app gaat niet vanzelf live. Jij drukt op
de knop in **Publishing overview**. Lees eerst het rapport vóór lancering dat
er dan staat bij **Testing → Pre-launch report**.

### Als het weer wordt afgewezen

Dan staat er in Play Console bij **Policy status** op welke regel, en met welke
versiecode erbij. Dat is meer dan we de vorige keer hadden: nu is bekend wat er
in de bundel zit.

Wat al is uitgesloten, zodat je niet opnieuw begint: R8 staat uit
(`minifyEnabled false`), de splash-bron bestaat, de bundel is es2015 en wordt
ingelezen vanaf Chrome 51, er is een foutopvang die een wit scherm onmogelijk
maakt, `store.initialize()` is afgevangen, en de app houdt afstand van de
statusbalk. De bouw is koud gestart in Chromium met vier nagebootste
Capacitor-lagen zonder fouten.

### Managed publishing staat aan

Daardoor gaat er niets live zonder dat jij erop drukt. Laat dat zo.

Het verklaart ook de foutmelding die `npm run track` gaf — *"Changes cannot be
sent for review automatically"*. Geen handhavingstoestand, gewoon deze
instelling.

### `npm run track` werkt nog niet

De upload en de trackwijziging lukken, maar het vastleggen geeft 403. Google
toetst releaserechten pas bij die laatste stap. Er gaat niets half: een edit
die niet is vastgelegd bestaat niet, en de versiecode blijft vrij.

```powershell
if (-not $p) { $p = (Get-ChildItem $HOME -Recurse -Depth 5 -Filter darija-kids -Directory -ErrorAction SilentlyContinue | Select-Object -First 1).FullName }; if ($p) { npm --prefix $p run rechten } else { "darija-kids niet gevonden onder $HOME" }
```

Dat serviceaccount mag de gebruikerslijst niet lezen — aangetoond — en kan dus
ook zijn eigen rechten niet zetten. In Play Console bij **Gebruikers en
rechten** `play-publisher@darijaforkids.iam.gserviceaccount.com` opzoeken,
App-rechten openen, en het recht voor testtracks aanzetten. Daarna werkt
`track` vanzelf.

Tot die tijd kan het ook met de hand: **Testen en publiceren → Testen →
Interne test**, en dan het AAB-bestand slepen dat in de foutmelding staat.

---

## 0 · Haal eerst op wat er klaarstaat

Alles van deze week staat op GitHub en niet op jouw schijf: de wisknop in het
portaal, de tijdslimiet op de post, de migraties, de lettertypen, het
cachebeleid, de foutopvang in de app. **Zonder ophalen rollen `deploy` en
`build` de oude code uit.**

```powershell
if (-not $p) { $p = (Get-ChildItem $HOME -Recurse -Depth 5 -Filter darija-kids -Directory -ErrorAction SilentlyContinue | Select-Object -First 1).FullName }; if ($p) { git -C $p pull } else { "darija-kids niet gevonden onder $HOME" }
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
if (-not $p) { $p = (Get-ChildItem $HOME -Recurse -Depth 5 -Filter darija-kids -Directory -ErrorAction SilentlyContinue | Select-Object -First 1).FullName }; if ($p) { npm --prefix $p run ios -- --build 2 --versie 1.0 } else { "darija-kids niet gevonden onder $HOME" }
```

Daarna archiveren op de Mac; zie `docs/MAC.md`.

---

## 2 · Vóór de eerste betalende klant

Zonder deze drie krijgt iemand die vandaag koopt niet wat hij betaalt.

### 2a · De prenten maken — ongeveer een uur

```powershell
if (-not $p) { $p = (Get-ChildItem $HOME -Recurse -Depth 5 -Filter darija-kids -Directory -ErrorAction SilentlyContinue | Select-Object -First 1).FullName }; if ($p) { npm --prefix $p run boeken -- --platen } else { "darija-kids niet gevonden onder $HOME" }
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
if (-not $p) { $p = (Get-ChildItem $HOME -Recurse -Depth 5 -Filter darija-kids -Directory -ErrorAction SilentlyContinue | Select-Object -First 1).FullName }; if ($p) { npm --prefix $p run platencheck } else { "darija-kids niet gevonden onder $HOME" }
```

Dat doet een steekproef op het eerste deel, het laatste, en een paar talen. Wil
je alles nalopen:

```powershell
if (-not $p) { $p = (Get-ChildItem $HOME -Recurse -Depth 5 -Filter darija-kids -Directory -ErrorAction SilentlyContinue | Select-Object -First 1).FullName }; if ($p) { npm --prefix $p run platencheck -- --alles } else { "darija-kids niet gevonden onder $HOME" }
```

Ontbreekt er iets, dan draai je de prenten opnieuw met `--opnieuw`. Die vlag
laat de aantekeningen leeg beginnen, dus je hoeft geen bestand weg te gooien:

```powershell
if (-not $p) { $p = (Get-ChildItem $HOME -Recurse -Depth 5 -Filter darija-kids -Directory -ErrorAction SilentlyContinue | Select-Object -First 1).FullName }; if ($p) { npm --prefix $p run boeken -- --platen --opnieuw } else { "darija-kids niet gevonden onder $HOME" }
```

Laat het draaien en doe ondertussen 2b niet — die schrijft in dezelfde mappen.

### 2b · De winkelbestanden verversen

```powershell
if (-not $p) { $p = (Get-ChildItem $HOME -Recurse -Depth 5 -Filter darija-kids -Directory -ErrorAction SilentlyContinue | Select-Object -First 1).FullName }; if ($p) { npm --prefix $p run winkel } else { "darija-kids niet gevonden onder $HOME" }
```

```powershell
if (-not $p) { $p = (Get-ChildItem $HOME -Recurse -Depth 5 -Filter darija-kids -Directory -ErrorAction SilentlyContinue | Select-Object -First 1).FullName }; if ($p) { npm --prefix $p run lezen -- --r2 } else { "darija-kids niet gevonden onder $HOME" }
```

De delen 4, 5, 6, 9, 10 en 13 zijn redactioneel gewijzigd; de bestanden in de
winkel zijn nog de oude. Gemeten: alle 27 PDF's waren ouder dan de tekst.

### 2c · De proefbestellingen opruimen

Er staan ongeveer tien PROEF-bestellingen in de database van eerdere tests.

```powershell
if (-not $p) { $p = (Get-ChildItem $HOME -Recurse -Depth 5 -Filter darija-kids -Directory -ErrorAction SilentlyContinue | Select-Object -First 1).FullName }; if ($p) { npm --prefix $p run bestellingen } else { "darija-kids niet gevonden onder $HOME" }
```

Dat laat zien wat er staat. Trek daarna elke PROEF-regel in:

```powershell
if (-not $p) { $p = (Get-ChildItem $HOME -Recurse -Depth 5 -Filter darija-kids -Directory -ErrorAction SilentlyContinue | Select-Object -First 1).FullName }; if ($p) { npm --prefix $p run intrekken } else { "darija-kids niet gevonden onder $HOME" }
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
if (-not $p) { $p = (Get-ChildItem $HOME -Recurse -Depth 5 -Filter darija-kids -Directory -ErrorAction SilentlyContinue | Select-Object -First 1).FullName }; if ($p) { npm --prefix $p run schema -- --hier } else { "darija-kids niet gevonden onder $HOME" }
```

En dan op de echte:

```powershell
if (-not $p) { $p = (Get-ChildItem $HOME -Recurse -Depth 5 -Filter darija-kids -Directory -ErrorAction SilentlyContinue | Select-Object -First 1).FullName }; if ($p) { npm --prefix $p run schema } else { "darija-kids niet gevonden onder $HOME" }
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
if (-not $p) { $p = (Get-ChildItem $HOME -Recurse -Depth 5 -Filter darija-kids -Directory -ErrorAction SilentlyContinue | Select-Object -First 1).FullName }; if ($p) { npm --prefix $p run deploy } else { "darija-kids niet gevonden onder $HOME" }
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
if (-not $p) { $p = (Get-ChildItem $HOME -Recurse -Depth 5 -Filter darija-kids -Directory -ErrorAction SilentlyContinue | Select-Object -First 1).FullName }; if ($p) { npm --prefix $p run build } else { "darija-kids niet gevonden onder $HOME" }
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
if (-not $p) { $p = (Get-ChildItem $HOME -Recurse -Depth 5 -Filter darija-kids -Directory -ErrorAction SilentlyContinue | Select-Object -First 1).FullName }; if ($p) { npm --prefix $p run proefkoop } else { "darija-kids niet gevonden onder $HOME" }
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
if (-not $p) { $p = (Get-ChildItem $HOME -Recurse -Depth 5 -Filter darija-kids -Directory -ErrorAction SilentlyContinue | Select-Object -First 1).FullName }; if ($p) { npm --prefix $p run mailsleutel } else { "darija-kids niet gevonden onder $HOME" }
```

Dat script controleert de sleutel én het afzenderadres vóór het hem opslaat,
dus je merkt het meteen als je de verkeerde plakt.

### 6b · Het koopgeheim behandelen als iets dat in logs staat

Gumroad kan geen koppen zetten, dus het geheim reist door de URL en komt
daarmee in de logs van Cloudflare terecht. Dat is niet weg te nemen. Wat wel
kan: vervang het zodra iemand anders bij die logs kan, en gebruik het nergens
anders voor.

```powershell
if (-not $p) { $p = (Get-ChildItem $HOME -Recurse -Depth 5 -Filter darija-kids -Directory -ErrorAction SilentlyContinue | Select-Object -First 1).FullName }; if ($p) { npm --prefix $p run koopgeheim } else { "darija-kids niet gevonden onder $HOME" }
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
