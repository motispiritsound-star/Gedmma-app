# Wat jij nog moet doen

Eén lijst, zodat je hem in één zitting kunt afwerken. Alles wat ík kon doen
staat in de repository; dit is wat alleen jij kunt — omdat er een console,
een wachtwoord of een echte database aan te pas komt.

De volgorde is de volgorde. Hij loopt van "hier gaat een klant op stuk" naar
"dit kan ook volgende maand".

Alle opdrachten zijn voor PowerShell en werken vanuit elke map.

**Begin met deze regel, één keer per venster.** Hij zoekt de projectmap op en
onthoudt hem als `$p`; alle opdrachten hieronder gebruiken dat. Je hoeft dus
zelf nergens een pad in te typen.

```powershell
$p = (Get-ChildItem $HOME -Recurse -Depth 5 -Filter darija-kids -Directory -ErrorAction SilentlyContinue | Select-Object -First 1).FullName; if ($p) { "gevonden: $p" } else { "niet gevonden onder $HOME" }
```

Sluit je het venster, dan is `$p` weg en begin je opnieuw met deze regel.

---

## 0 · Apple wacht op antwoord — doe dit eerst

App Review heeft de inzending stilgelegd met vier vragen over richtlijn 1.3
(Kinderen-categorie). Zolang die openstaan gebeurt er niets met versie 1.0.

De antwoorden staan klaar in **`docs/APPLE-1.3.md`**, uit de code gecontroleerd
en niet uit het hoofd geschreven. Lees ze één keer door — jij bent de uitgever
— en plak ze als antwoord op het bericht zelf in App Store Connect, niet via een
nieuw formulier.

Kort samengevat is het antwoord vier keer hetzelfde: geen analytics, geen
advertenties, geen verkoop of deling van gegevens, en van een kind wordt niets
verzameld. Wat er wél de deur uit gaat, gaat pas nadat een ouder door de
rekenpoort is gegaan en het zelf aanvinkt.

---

## A · Vóór de eerste betalende klant

Zonder deze drie krijgt iemand die vandaag koopt niet wat hij betaalt.

### A1 · De prenten maken — ongeveer een uur

```powershell
npm --prefix $p run boeken -- --platen
```

Zonder dit ziet een Sba-koper "nog niet" in plaats van een prentenboek. Dit is
het enige punt in deze hele lijst dat een betalende klant meteen raakt.

Laat het draaien en doe ondertussen A2 niet — die schrijft in dezelfde mappen.

### A2 · De winkelbestanden verversen

```powershell
npm --prefix $p run winkel
```

```powershell
npm --prefix $p run lezen -- --r2
```

De delen 4, 5, 6, 9, 10 en 13 zijn redactioneel gewijzigd; de bestanden in de
winkel zijn nog de oude. Gemeten: alle 27 PDF's waren ouder dan de tekst.

### A3 · De proefbestellingen opruimen

Er staan ongeveer tien PROEF-bestellingen in de database van eerdere tests.

```powershell
npm --prefix $p run bestellingen
```

Dat laat zien wat er staat. Trek daarna elke PROEF-regel in:

```powershell
npm --prefix $p run intrekken
```

---

## B · Uitrollen wat ik heb gewijzigd

Deze week is er veel aan de worker en de site veranderd. Dit zet het live.

### B1 · De database bijwerken

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

**Wat je hoort te zien:** een tabelletje met `0001_begin.sql ✅` en verder
niets. Staat er dat er rijen zijn gewijzigd of verwijderd, stop dan en laat het
me zien — dat hoort niet.

Voortaan is een wijziging aan de database een nieuw bestand:
`npm run schema -- --nieuw <naam>`.

### B2 · De worker uitrollen

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

### B3 · De site opnieuw bouwen en uitrollen

```powershell
npm --prefix $p run build
```

Hierin zit: de twee letters die nu vooraf worden opgehaald (de kop springt niet
meer), het cachebeleid voor 90% van de site, en de nieuwe tekst bij Sba
("prentenboeken voor de kleintjes").

---

## C · Zelf natesten — ik kon dit niet

Vijf dingen die alleen op een echt toestel of in een echte mailbox te zien zijn.

### C1 · Een echte mail, met de nieuwe knoppen

De drie links in een mail doen nu niets meer bij het aanklikken door een
scanner: ze tonen een bladzijde met één knop, en pas die knop voert het uit.

```powershell
npm --prefix $p run proefkoop
```

Open de mail die binnenkomt, en klik onderaan op **Uitschrijven**. Je hoort een
bladzijde te zien met de vraag en één knop — niet een melding dat je al
uitgeschreven bent. Druk op de knop; dán pas ben je uitgeschreven.

### C2 · De afmeldknop van de mailclient zelf

In Gmail en Apple Mail staat bovenin bij een nieuwsbrief een eigen
afmeldknopje. Dat doet een POST, en die hoort meteen uit te schrijven zonder
tussenbladzijde. Probeer het één keer.

### C3 · Een echte les op een echt toestel

In de oefening "Wat betekent dit?" stond dezelfde emoji op de vraag als op het
juiste antwoord — je kon hem oplossen zonder een letter Arabisch te lezen. Die
emoji is weg bij de vraag en staat nog wel bij de antwoorden.

Speel één les uit en kijk of dat klopt en of het niet te moeilijk is geworden
voor de jongste groep.

### C4 · Het herhaalscherm op een smalle telefoon

Als je nog een oud toestel hebt (iPhone SE of iets van 320 pixels breed):
daar stonden drie tegels naast elkaar en brak "VASTGEZET" midden in het woord.
Nu vallen ze onder de 360 pixels terug op twee kolommen.

### C5 · Het portaal op de apparaten die je klanten gebruiken

Computer, laptop, telefoon, tablet. Het voorlezen werkt per toestel anders,
want de stem komt van het toestel zelf.

---

## D · De winkels

### D1 · Play Console

- App access
- Managed publishing
- Target audience
- Bank- en belastinggegevens

### D2 · App Store Connect

- Prijsbasis op Nederland
- Royaltyvaluta van USD naar EUR
- DAC7
- De abonnementsteksten uit `store/abonnement-teksten.md`, zodra het slot van
  de beoordeling eraf is

### D3 · Het e-boek als Gumroad-product

De worker herkent `ebook`, `eboek` en `e-boek` alle drie, dus de slug mag je
zelf kiezen.

---

## E · Beveiliging

### E1 · De Brevo-sleutel nog één keer vervangen

Hij heeft in ons gesprek gestaan en op twee schermafdrukken. Maak een nieuwe
bij Brevo, verwijder de oude, en dan:

```powershell
npm --prefix $p run mailsleutel
```

Dat script controleert de sleutel én het afzenderadres vóór het hem opslaat,
dus je merkt het meteen als je de verkeerde plakt.

### E2 · Het koopgeheim behandelen als iets dat in logs staat

Gumroad kan geen koppen zetten, dus het geheim reist door de URL en komt
daarmee in de logs van Cloudflare terecht. Dat is niet weg te nemen. Wat wel
kan: vervang het zodra iemand anders bij die logs kan, en gebruik het nergens
anders voor.

```powershell
npm --prefix $p run koopgeheim
```

Dat zet het hele Gumroad-adres op je klembord in plaats van op het scherm.

---

## F · Open besluiten — hier heb ik jouw antwoord voor nodig

### F1 · Spraakherkenning op de website

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

### F2 · De zips met PDF's naast het portaal

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

## G · Na de lancering

Geen haast, maar wel opschrijven.

| | Wat | Waarom het kan wachten |
|---|---|---|
| G1 | Buurklus naar een eigen repository | Het deploybare doelwit in de root is al weg; de rest is opruimen |
| G2 | `noUncheckedIndexedAccess` aanzetten in de app | Geeft vermoedelijk tientallen meldingen — geen werk voor een lanceerweek |
| G3 | De expo-keten bijwerken | 35 npm-waarschuwingen, alle in bouwgereedschap; `--omit=dev` zegt nul. `npm audit fix --force` wil expo@57 installeren, een brekende wijziging |
| G4 | Elk van de drie maillinks een eigen token, met houdbaarheid | De prefetch-schade is weg; dit is verdediging in de diepte en kost een schemawijziging |
| G5 | `npm run logboek` uitbreiden met de tien hoogste rijen uit `opening` | Dan zie je een sleutel die rondgaat vóórdat de R2-rekening het vertelt |

---

## Waar de rest staat

- `docs/AUDIT.md` — de pre-launch audit, tien bevindingen met de stand erbij
- `docs/SECURITY.md` — de security-audit als buitenstaander
- `docs/STAND.md` — wat er nog moet, zonder drie andere bestanden te lezen
