# Geld binnenkrijgen zonder administratie

Uitgangspunt: **jij wilt zo min mogelijk omkijken naar abonnementen.** Geen
incasso's najagen, geen opzeggingen met de hand verwerken, geen facturen maken.
Dit document beschrijft hoe dat werkt en wat je moet instellen.

## De korte versie

Laat **Apple en Google de verkoop doen**. Zij innen het geld, verlengen het
abonnement, sturen herinneringen, verwerken opzeggingen en terugbetalingen, en
storten wat overblijft periodiek op je zakelijke rekening. Jij kijkt naar een
dashboard.

Dat kost commissie (15% zolang je onder de grens van het kleinbedrijfprogramma
blijft). Die 15% is in feite de prijs van je hele debiteurenadministratie.

```
ouder tikt op "Begin met een week gratis"
        ↓
Apple / Google regelt betaalmethode, week gratis, en de eerste afschrijving
        ↓
RevenueCat vertelt de app: deze ouder is lid
        ↓
elke maand automatisch verlengd, tot de ouder zelf opzegt in de winkel
        ↓
maandelijkse uitbetaling naar jouw zakelijke rekening
```

## Wat de stores voor je doen

| | Regelt Apple/Google | Moet jij doen |
| --- | --- | --- |
| Betaalmethode van de klant | ja | – |
| Eerste week gratis | ja | product goed instellen |
| Automatisch verlengen | ja | – |
| Mislukte betaling opnieuw proberen | ja | – |
| Herinnering vóór verlenging | ja | – |
| Opzeggen | ja, in de telefooninstellingen | – |
| Terugbetalingen | ja | – |
| Btw voor EU-consumenten | in de meeste gevallen ja | verifiëren met je boekhouder |
| Uitbetaling naar je bank | ja | rekening en belastinggegevens invullen |
| Boekhouding en aangifte | nee | zelf of via een boekhouder |

Belangrijk: **een winkelabonnement kun je niet in de app opzeggen.** Dat is geen
gebrek, dat is precies de automatisering. De app verwijst daarom naar de
abonnementeninstellingen van de telefoon (zie `openBeheer()` in
`src/state/aankoop.ts`).

## Wat je nodig hebt voordat er geld binnenkomt

### 1. Een bedrijf
- Inschrijving bij de KvK (eenmanszaak volstaat om te beginnen)
- Een btw-identificatienummer
- Een **zakelijke bankrekening** op naam van dat bedrijf. Apple en Google
  betalen niet uit op een rekening met een andere tenaamstelling — dat is de
  meest voorkomende reden dat een eerste uitbetaling blijft hangen.

### 2. Apple: App Store Connect
Onder **Business → Agreements, Tax, and Banking**:
- Paid Apps-overeenkomst accepteren
- Bankgegevens invullen (IBAN, tenaamstelling exact gelijk aan de KvK-naam)
- Belastingformulieren invullen, waaronder een W-8BEN-E omdat je buiten de VS zit
- Meld je aan voor het **Small Business Program** (15% in plaats van 30%,
  zolang je onder de omzetgrens blijft). Dit moet je zelf aanvragen; het gaat
  niet vanzelf.

### 3. Google: Play Console
- Een **payments profile** aanmaken met dezelfde bedrijfsgegevens
- Bankrekening koppelen en verifiëren (Google maakt een klein testbedrag over)
- Belastinggegevens invullen

### 4. De producten aanmaken
Twee abonnementen in dezelfde abonnementsgroep, met de ids die al in de code
staan (`src/core/abonnement/plannen.ts`):

```
nl.slimvos.app.compleet.maand   €4,99 per maand
nl.slimvos.app.compleet.jaar    €39,99 per jaar
```

Bij allebei een **introductieaanbod van 7 dagen gratis**. Zet ze in dezelfde
groep, dan kan een klant maar één keer een proefperiode krijgen en kan hij
zonder gedoe wisselen tussen maand en jaar.

## Wanneer staat het geld op je rekening

| | Ritme | Ongeveer |
| --- | --- | --- |
| Apple | maandelijks | ongeveer 30 tot 45 dagen na afloop van de maand |
| Google | maandelijks | rond de 15e van de maand erna |

Beide hanteren een minimumbedrag voordat ze uitbetalen. Controleer de actuele
termijnen zelf in de consoles — ze veranderen, en ik heb ze hier uit het hoofd
opgeschreven.

Reken erop dat je eerste omzet **ongeveer twee maanden** onderweg is. Dat is
geen probleem, maar wel iets om te weten voordat je marketinggeld uitgeeft.

## Wat je hierna nog moet bouwen

De app kent de hele stroom al: proefweek, automatisch verlengen, opzeggen,
hervatten, toegang. Wat ontbreekt is de koppeling.

1. **RevenueCat aansluiten** in `src/state/aankoop.ts`. Dat is het enige
   bestand dat verandert; de schermen niet. RevenueCat is gratis tot ongeveer
   $2.500 aan gevolgde maandomzet en neemt het bonnetjes-controleren,
   het bijhouden van wie lid is en de webhooks van je over. Zelf koppelen aan
   `expo-in-app-purchases` kan ook, maar dan doe je die controle zelf — dat is
   precies het werk dat je niet wilde.
2. **Een server voor het account** (Supabase of Firebase) achter
   `src/state/auth.ts`. Nodig zodra een abonnement op meer dan één toestel moet
   werken. Zonder server hangt het lidmaatschap aan het toestel.
3. **Webhook naar je backend** vanuit RevenueCat, zodat een opzegging of een
   mislukte betaling automatisch doorkomt zonder dat de app open hoeft.

## Wat je vooral níet moet doen

**Bouw geen eigen betaling met iDEAL, Mollie of Stripe voor toegang binnen de
app.** Voor digitale content eisen Apple en Google hun eigen betaalsysteem, en
je app wordt geweigerd. Belangrijker voor jou: dan word jij de partij die
facturen stuurt, btw afdraagt per land, mislukte incasso's najaagt en
terugbetalingen doet. Dat is precies de administratie die je wilde vermijden.

Een uitzondering is een **website** waar mensen los een abonnement kopen. Dan
ben jij wél de verkopende partij, met alle btw- en incassoverplichtingen die
erbij horen. Alleen doen als je omzet groot genoeg is dat 15% commissie meer
kost dan een boekhouder.

## Let op: EU-regels veranderen

Apple heeft de voorwaarden voor de EU aangepast; nieuwe voorwaarden gaan in per
**1 oktober 2026**, met onder meer de mogelijkheid van alternatieve
betaalmethoden naast de gewone in-app-aankoop, en aangepaste commissies.
Controleer vlak vóór je lancering hoe dat er dan precies uitziet — het kan
gunstiger uitpakken dan de 15% hierboven, maar het kan ook betekenen dat je een
keuze moet maken die je nu nog niet hoeft te maken.

Zie [Changes for apps in the European Union](https://developer.apple.com/support/apps-in-the-eu/)
en [Payment options on the App Store in the EU](https://developer.apple.com/support/payment-options-on-the-app-store-in-the-eu).

## Een eerlijke waarschuwing over de proefweek

Zeven dagen gratis en daarna automatisch betalen werkt goed, maar het is ook de
grootste bron van boze mails in deze categorie apps: "ik wist niet dat het
doorliep". Drie dingen die dat voorkomen, en die alle drie al in de app zitten:

1. De paywall noemt letterlijk de datum van de eerste afschrijving.
2. Het ouderdashboard laat elke keer zien wanneer er weer wordt afgeschreven.
3. Er is een knop die rechtstreeks naar de abonnementeninstellingen gaat.

Dat scheelt je supportwerk, en het is gewoon netjes.
