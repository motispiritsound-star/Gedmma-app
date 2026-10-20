# Dilimiz — privacy en veiligheid

> **Dit is geen juridisch advies.** Het is een ontwerpdocument: wat de app wel
> en niet doet, en wat een jurist of een privacyfunctionaris moet nakijken
> voordat er iets naar een winkel gaat. §Wat juridisch nagekeken moet worden
> staat onderaan en is niet optioneel.

## Het uitgangspunt

De app is voor kinderen. Dat verandert niet alleen wat er mag, maar wat er
verstandig is: **de goedkoopste manier om geen gegevens te lekken, is ze niet
hebben.**

Dus is het ontwerp: geen account, geen server, geen advertenties, geen
analytics, geen tracking. Voortgang staat op het toestel en gaat daar niet
weg.

## Wat de app verzamelt

**Niets dat het toestel verlaat.**

| Wat | Waar | Verlaat het toestel |
|---|---|---|
| Voornaam of bijnaam van het kind (optioneel, mag leeg) | `localStorage` | Nee |
| Gekozen avatar (emoji) | `localStorage` | Nee |
| Leeftijdsgroep `klein`/`midden`/`groot` | `localStorage` | Nee |
| Voortgang, oefenresultaten, herhalingsplanning | `localStorage` | Nee |
| Instellingen (taal, geluid, kleur) | `localStorage` | Nee |
| Of er betaald is | `localStorage` + de winkel | Alleen naar Apple/Google |

**Niet gevraagd en niet opgeslagen:** achternaam, geboortedatum, e-mailadres
van het kind, adres, school, telefoonnummer, contacten, locatie, foto's,
toestel-id, advertentie-id.

De voornaam is optioneel en wordt alleen gebruikt om het kind aan te spreken.
Bij overslaan heet het kind zoals de app het noemt. Het invulveld zegt
expliciet dat een bijnaam ook mag — en dat is niet vriendelijkheid maar
ontwerp: een app die om een echte naam vraagt, krijgt er een.

**Een geboortedatum wordt nooit gevraagd.** Alleen een leeftijdsgroep als
voorstel, door een ouder te wijzigen. Een geboortedatum is een
persoonsgegeven waar niets in deze app iets aan heeft.

## Geen advertenties, geen tracking

- Geen advertentienetwerk, in geen enkele vorm.
- Geen analytics-SDK. Geen Firebase, geen Google Analytics, geen Sentry, geen
  Facebook SDK, geen Plausible.
- Geen tracking-pixel.
- Geen derde partij die de app aanroept tijdens gebruik.

**Hoe we dat afdwingen in plaats van het te beloven:**
`src/engine/geennetwerk.test.ts` scant de gebouwde bundel op verzoeken naar
buiten en op bekende SDK-namen, en faalt als er een bij komt. Een belofte in
een document houdt zichzelf niet na; een test wel.

**Wat we dan missen:** we weten niet welke les mensen afbreken. Dat is een
echte prijs, en het alternatief — gedrag van kinderen meten — is er niet aan
de orde. De vraag "waar stoppen ze" wordt gesteld aan gezinnen die we
spreken, en aan de geaggregeerde cijfers die de winkels zelf geven.

## Stemopnames

De spreekoefening werkt **volledig op het toestel**.

- De microfoon gaat aan als het kind op de knop drukt, en uit als het
  antwoord klaar is.
- **Niets wordt opgeslagen.** Geen bestand, geen buffer die blijft staan.
- **Niets gaat naar een server.** Geen spraakherkenning in de cloud.
- Op iOS en Android staat in de toestemmingsvraag waarom de microfoon nodig
  is, in de taal van de interface.
- De spreekoefening is **uit te zetten** in de instellingen, en in de groep
  `klein` staat hij standaard uit.
- Er is géén score op de uitspraak. Zie `product-brief.md` §MVP-afbakening:
  onbetrouwbare herkenning van een kinderstem die "fout" zegt terwijl het goed
  was, is schadelijker dan geen score.

`src/engine/microfoon.test.ts` controleert dat de opnamestroom na gebruik
gestopt en vrijgegeven wordt.

## Ouderlijke toestemming en de ouderpoort

De app heeft **één ouderpoort** en die zit voor alles wat een kind niet alleen
mag doen:

- het abonnementsscherm en elke koop
- de instellingen die geld of privacy raken
- het ouderoverzicht
- gegevens verwijderen of exporteren
- elke link naar buiten (winkel, website, mail)

De poort is een rekenvraag die een kind van zeven niet zomaar doet
(`7 × 8`), niet een pincode — een pincode die een ouder vergeet is een ouder
die niet meer bij het ouderoverzicht komt. De poort is geen beveiliging tegen
een gemotiveerde twaalfjarige en doet ook niet alsof; hij voorkomt de
onbedoelde aankoop en de onbedoelde klik naar buiten.

Bij de eerste start staat een **ouderscherm** dat in gewone taal zegt: wat de
app opslaat (dit blijft op dit toestel), dat er geen advertenties zijn, dat
betalen via de winkel gaat en achter deze poort zit. Pas daarna begint het
kind.

## Inzage en verwijdering

Op het ouderoverzicht, achter de poort, drie knoppen:

| | Wat het doet |
|---|---|
| **Bekijken** | Toont letterlijk alles wat is opgeslagen, als leesbare tekst. Geen samenvatting — de hele inhoud |
| **Meenemen** | Schrijft hetzelfde als een JSON-bestand weg, zodat het naar een nieuw toestel kan |
| **Verwijderen** | Wist alles, na een bevestiging die zegt dat het niet terug te halen is |

"Verwijderen" wist de opslag écht en volledig, inclusief de instellingen.
Alleen de aankoop blijft, want die staat bij Apple of Google en niet bij ons;
het scherm zegt dat ook.

Omdat er geen server is, is er geen verzoek om inzage dat iemand moet
behandelen: de ouder ziet alles zelf, nu, zonder tussenkomst. Dat is de reden
dat deze opzet gekozen is.

## Offline en netwerk

De app werkt volledig offline. Ze doet tijdens gebruik **geen enkel
netwerkverzoek**, behalve:

| Wanneer | Waarnaartoe | Waarom |
|---|---|---|
| Koop of herstel | Apple / Google | Onvermijdelijk, en de enige juiste weg |
| Ouder tikt op een link | De browser van het toestel | Alleen na de ouderpoort |

## Veiligheid voor het kind, niet alleen privacy

- **Geen sociale laag.** Geen chat, geen profielen van andere kinderen, geen
  ranglijst waarop een naam van iemand anders staat.
- **Geen links in het deel van het kind.** Alles naar buiten zit achter de
  poort.
- **Geen druk.** Geen aftelklok, geen "je reeks is verbroken"-schuldgevoel,
  geen melding die zegt dat anderen beter zijn. Een reeks die afbreekt zegt
  "morgen weer", en niets meer.
- **Meldingen staan uit** tot een ouder er zelf om vraagt, achter de poort,
  met een tijd die de ouder kiest. Maximaal één per dag.
- **Inhoud passend bij de leeftijd.** Zie `learning-curriculum.md` §Cultuur.

## Wat juridisch nagekeken moet worden

**Dit lijstje is niet afgevinkt en hoort niet afgevinkt te worden door mij.**

1. **AVG/GDPR.** Zelfs met uitsluitend lokale opslag is een privacyverklaring
   nodig, en de beide winkels eisen er een op een werkend webadres. Nakijken:
   of lokale opslag van een voornaam door een kind in dit ontwerp "verwerking"
   is, en zo ja op welke grondslag. De gangbare lezing is dat er zonder
   doorgifte geen verwerkingsverantwoordelijkheid ontstaat, maar dat is een
   lezing en geen zekerheid.
2. **Apple: Kids Category.** Als de app in die categorie komt, gelden extra
   eisen (geen externe links zonder ouderpoort, geen analytics, en tot
   recent een verbod op bepaalde SDK's). Nakijken welke eisen op dit moment
   gelden, in de actuele App Review Guidelines (§1.3 en §5.1.4).
3. **Google Play: Families-beleid en Data safety-formulier.** Het formulier
   moet kloppen met wat de app doet. "Geen gegevens verzameld" is een
   verklaring waar Google op controleert.
4. **COPPA** als de app in de Verenigde Staten verschijnt. De Engelse
   interface maakt dat waarschijnlijk.
5. **DSA / leeftijdsverificatie.** De Europese regels hierover bewegen.
   Nakijken wat er op het moment van publiceren geldt.
6. **Abonnementsregels.** Prijs, proefduur, automatische verlenging en
   opzeggen moeten vóór de koop zichtbaar zijn, in de taal van de gebruiker,
   en de winkelvermelding moet hetzelfde zeggen als het scherm. Zie
   `architecture.md` §Abonnement.
7. **Mascotte en beeldmateriaal.** Rechten op lettertype, illustraties en
   eventuele foto's.
8. **Opnamecontracten** met de stemacteurs: gebruiksrecht voor de app, in
   alle landen, voor onbepaalde tijd.

**Controleer de actuele officiële documentatie van Apple en Google vóór
implementatie van winkel- of abonnementsregels.** Die regels veranderen, en
wat hier staat is de stand van het ontwerp en niet de stand van het beleid.

## Hoe dit gehandhaafd wordt

| Test | Wat hij bewaakt |
|---|---|
| `engine/geennetwerk.test.ts` | Geen tracking-SDK, geen verzoek naar buiten in de bundel |
| `engine/opslag.test.ts` | Verwijderen wist alles; export bevat niets onverwachts |
| `engine/microfoon.test.ts` | De opnamestroom wordt gestopt en vrijgegeven |
| `ui/ouderpoort.test.ts` | Elke koop- en buitenlink zit achter de poort |
| `content/leeftijd.test.ts` | Geen inhoud buiten de leeftijdsgroep waar hij voor staat |
