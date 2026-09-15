# Betalen, en hoe het geld bij jou komt

De app is gratis te beginnen: de eerste **vijf units** zijn open voor iedereen.
De rest van de cursus is één aankoop — **Bladi Volledig**, eenmalig, geen
abonnement. De betaling loopt volledig via de App Store en Google Play, en dat
is precies wat je wilt: zij innen, zij rekenen de btw af, zij betalen jou uit.

> **Kort:** je maakt in beide winkels één product aan met id
> `app.bladi.learn.full`, koppelt je bankrekening, en de winkels storten wat
> er verkocht is minus hun commissie maandelijks op die rekening.

## Wat er in de app al zit

- Het product, de knop, de prijs (die komt uit de winkel, in de munt van de
  koper) en de knop **Aankoop terugzetten** — die tweede is bij beide winkels
  verplicht.
- Een **ouderpoort**: voordat er iets gekocht kan worden, staat er een
  rekensom. Apple eist dat voor apps in de kindercategorie, en het is sowieso
  netjes.
- De grens tussen gratis en betaald staat op één plek: `FREE_UNITS` in
  `src/engine/store.ts`. Wil je meer of minder gratis weggeven, dan is dat dat
  ene getal.
- Wissen van de voortgang raakt de aankoop niet. Een nieuw toestel haalt hem
  terug met dezelfde winkelaccount.

Wat er **niet** in zit: een eigen server die de bon van Apple of Google
narekent. Voor een eenmalige aankoop van een paar euro is dat een verdedigbare
keuze — wil je het later strakker, dan is
[RevenueCat](https://www.revenuecat.com) de gebruikelijke stap (gratis tot een
flink bedrag per maand), of je bouwt zelf serverzijdige validatie.

## Het product aanmaken

Gebruik in beide winkels **hetzelfde id**, anders werkt de code niet:

| | App Store Connect | Google Play Console |
|---|---|---|
| Waar | Jouw app → **In-App Purchases** | Jouw app → **Producten → In-app-producten** |
| Type | **Non-Consumable** (eenmalig, blijft van de koper) | **Eenmalige aankoop** |
| Product-id | `app.bladi.learn.full` | `app.bladi.learn.full` |
| Naam voor de koper | Bladi Volledig | Bladi Volledig |
| Prijs | kies een prijsniveau | kies een prijs |

Over de prijs: dit is jouw keuze, maar voor een leer-app voor kinderen zonder
abonnement zit een eenmalige aankoop van **€ 7 tot € 13** in de buurt van wat
vergelijkbare apps vragen. Je zet één prijs; beide winkels rekenen die zelf om
naar de munt en het prijsniveau van elk land. In de app hoef je niets aan te
passen: de knop toont wat de winkel zegt.

Vergeet niet te schrijven wat de koper krijgt (dat staat al in de app zelf) en
een schermafbeelding toe te voegen bij Apple — daar wordt elk in-app-product
apart beoordeeld.

## Dat het geld op jouw rekening komt

### Apple

1. **App Store Connect → Business** (vroeger *Agreements, Tax and Banking*).
2. Onderteken de **Paid Applications**-overeenkomst. Zolang die niet getekend
   is, kun je niets verkopen — dit is de stap die mensen het vaakst vergeten.
3. **Bankgegevens**: je IBAN, op naam van de accounthouder.
4. **Belastinggegevens**: voor Nederland vul je het Amerikaanse formulier
   **W-8BEN** (particulier) of **W-8BEN-E** (bedrijf) in, plus je lokale
   gegevens. Zonder dit houdt Apple belasting in.
5. Meld je aan voor het **App Store Small Business Program**: dan is de
   commissie **15%** in plaats van 30%, zolang je minder dan $1 miljoen per
   jaar verdient. Aanmelden moet je zelf doen, het gaat niet automatisch.
6. Apple betaalt **maandelijks** uit, ongeveer 33 dagen na het einde van de
   maand, zodra het bedrag boven de drempel voor jouw land uitkomt.

### Google

1. **Play Console → Instellingen → Betalingsprofiel**: maak een
   Google-betalingsprofiel aan (of koppel een bestaand).
2. **Bankrekening** toevoegen en laten verifiëren (Google maakt een klein bedrag
   over dat je moet bevestigen).
3. **Belastinggegevens** invullen.
4. De commissie is **15%** over de eerste $1 miljoen omzet per jaar, daarna 30%.
   Hier hoef je je niet apart voor aan te melden.
5. Google betaalt **maandelijks** uit, rond de 15e van de volgende maand, boven
   de drempel.

### Btw en belasting

In de EU zijn Apple en Google voor digitale producten zélf de verkoper richting
de klant. Zij rekenen de btw van het land van de koper en dragen die af — jij
stuurt geen facturen naar kopers en hoeft geen btw per land uit te rekenen. Wat
jij ontvangt is een uitbetaling ná commissie en ná btw.

Wat je wél zelf moet regelen: die inkomsten zijn voor jou belastbaar. En omdat
je met verkopen een **handelaar** bent, vragen beide winkels sinds 2025 om
handelaarsgegevens (naam, adres, telefoonnummer, e-mail, inschrijvingsnummer) —
dat is de Europese Digital Services Act, en die gegevens worden zichtbaar in de
winkel. In de praktijk betekent dat voor Nederland: **inschrijven bij de KvK**
vóór je een betaalde app publiceert. Vul daarna dezelfde gegevens in bij
`src/content/operator.ts`, zodat ze ook in de app en in de privacyverklaring
kloppen.

Dit is geen belastingadvies — leg het bedrag en de constructie voor aan je
boekhouder voordat de eerste uitbetaling binnenkomt.

## Testen zonder echt te betalen

- **Apple**: App Store Connect → Users and Access → **Sandbox Testers**. Log op
  een testtoestel in met zo'n sandbox-account; aankopen zijn dan gratis en
  herhaalbaar.
- **Google**: Play Console → Instellingen → **Licentietests**. Zet je eigen
  Google-account erin en gebruik een interne testrelease; aankopen worden dan
  niet afgeschreven.

Test in elk geval deze drie dingen, want daar gaat het in de praktijk mis:
kopen, de app verwijderen en opnieuw installeren met **Aankoop terugzetten**,
en een tweede toestel op dezelfde winkelaccount.

## Wat de winkels nog van je willen weten

- **Apple**: zet "Offers In-App Purchases" aan in de app-informatie. In de
  kindercategorie mag een aankoop, maar alleen achter een ouderpoort — die zit
  er al in.
- **Google**: in de Play Console-vragenlijst vink je **"Bevat in-app-aankopen:
  ja"** en **"Bevat advertenties: nee"** aan. Bij **Datavaststelling** verandert
  er niets: er worden nog steeds geen gegevens verzameld, want de betaling loopt
  bij Google zelf en niet via de app.

## En de website?

Op de website kan niet betaald worden — daar is geen winkel die dat afhandelt.
De eerste units blijven daar gewoon gratis en de pagina *Bladi Volledig* legt
uit dat kopen in de app gebeurt. Dat is ook precies wat Apple en Google willen:
zij zien liever geen betaalmuur buiten hun eigen kassa in een app die bij hen
in de winkel staat.
