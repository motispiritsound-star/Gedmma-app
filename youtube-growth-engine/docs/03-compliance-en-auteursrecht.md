# 03 — Compliance- en auteursrechtanalyse

Vijf regimes gelden tegelijk. Ze overlappen niet netjes, dus het systeem
controleert ze als afzonderlijke poorten.

1. Auteursrecht en naburige rechten (NL/EU)
2. YouTube's eigen beleid en API-voorwaarden
3. AI-transparantie (YouTube-disclosure en de EU AI-verordening)
4. AVG voor persoonsgegevens in reacties, analytics en stemmen
5. Consumenten- en reclameregels voor affiliate en sponsoring

---

## 1. Auteursrecht: wat het systeem met referentiemateriaal doet

### De regel die ik in code heb vastgelegd

**Er komt geen bestand van een andere maker het systeem binnen.** Geen video,
geen audiospoor, geen thumbnail, geen framegrab. Niet in een cache, niet
tijdelijk, niet "alleen voor analyse".

Dat is strenger dan het auteursrecht strikt vereist, en dat is bewust: het
verschil tussen "wij analyseerden alleen" en "wij hadden hun bestanden op onze
schijf" is in elk conflict het enige dat telt, en het kost ons niets.

### Wat er wél binnenkomt

Uitsluitend via de officiële YouTube Data API, met OAuth:

| Gegeven | Gebruik |
|---|---|
| Titel, beschrijving, publicatiedatum, duur, tags | Patroonanalyse (structuur, lengte, formulering-*type*) |
| View-, like- en reactieaantallen | Vraagdetectie en tempo-inschatting |
| Kanaalmetadata, uploadfrequentie | Formatanalyse |
| Hoofdstukmarkeringen uit de beschrijving | Structuuranalyse |

### Wat er expliciet níét binnenkomt

- **Transcripties en ondertitels van andermans video's.** Ondertitelbestanden
  zijn zelfstandig auteursrechtelijk beschermd werk. Het systeem vraagt ze niet
  op, ook niet waar de API dat technisch toestaat.
- **Thumbnails als beeldbestand.** Alleen de *beschrijving* van het principe
  ("gezicht links, drie woorden rechts, hoog contrast") wordt afgeleid uit
  metadata en handmatige observatie — niet door het bestand te verwerken.
- **Reactieteksten in opslag.** Zie §4 hieronder; die vallen onder de AVG én
  onder een bewaartermijn in de API-voorwaarden.

### Waarom geen beroep op de TDM-uitzondering

De EU-uitzonderingen voor tekst- en datamining (DSM-richtlijn art. 3 en 4)
zouden analyse van openbaar materiaal deels kunnen dekken, maar art. 4 kent een
opt-out die rechthebbenden mogen uitoefenen, en de voorwaarden van YouTube
verbieden geautomatiseerd downloaden los van het auteursrecht. Het systeem
leunt daarom nergens op deze uitzondering. Dat scheelt een juridisch debat dat
we niet hoeven te voeren. [status: te verifiëren met een jurist als je
grootschalig gaat analyseren]

### De originaliteitspoort in de praktijk

Abstracte patronen mogen worden overgenomen; concrete uitwerkingen nooit. De
grens:

| Toegestaan (patroon) | Verboden (uitwerking) |
|---|---|
| "Deze video opent met een tegenintuïtieve claim" | Die claim zelf, of een geparafraseerde versie ervan |
| "De titel gebruikt een getal plus een negatie" | "7 fouten die je NOOIT moet maken" opnieuw gebruiken met een ander getal |
| "Rond 4:30 komt een wending" | Dezelfde wending op dezelfde plek |
| "Het publiek vraagt zich af of X de moeite waard is" | Het antwoord van de referentie overnemen |

De **originality brief** per video legt dit vast: welke publieksvraag blijft
relevant, welke stelling nemen wíj in, welk nieuw onderzoek voegen we toe, welke
eigen voorbeelden, waarom zou iemand onze video náást de referentie kijken. Komt
die brief niet rond, dan wordt het concept afgewezen vóór er één euro aan
generatie is uitgegeven.

De Originality Score van minimaal 90 wordt gemeten op vier assen: afstand tot de
referentiestelling, aandeel eigen bronnen, structuurafwijking, en — de
belangrijkste — **afstand tot onze eigen eerdere video's.** Dat laatste is de
sjabloondetectie: als video 12 structureel op video 7 lijkt, is dat precies wat
YouTube's inauthentic-content-beleid raakt, en het systeem zal dat vaker
signaleren dan een externe gelijkenis.

---

## 2. YouTube-beleid

### Inauthentic content — het bestaansrisico

YouTube hernoemde op **15 juli 2025** het "repetitious content"-beleid naar
**"inauthentic content"** om te verduidelijken dat het gaat om repetitieve of
massaal geproduceerde content. Gedemonetiseerd wordt wat een sjabloon volgt met
weinig variatie, op schaal wordt gereproduceerd en geen echte inbreng van een
maker bevat. In januari 2026 volgde een handhavingsgolf waarbij zestien kanalen
werden beëindigd. [bron: secundair, te verifiëren]

Het onderscheid dat naar voren komt is niet *of* er AI is gebruikt, maar of er
**zichtbaar redactioneel oordeel** in zit. Dat is precies wat je opdracht al
eist, en het is ook wat de poorten meten. Concreet ontwerpgevolg:

- De Originality Score meet primair **intern**: gelijkenis met onze eigen
  eerdere video's. Sjabloondrift is de makkelijkste manier om hier in te lopen.
- Elke video moet één expliciete stelling hebben ("Deze video betoogt dat…").
  Zonder invulbare stelling geen script — dat is een harde stop in de pipeline,
  geen aanbeveling.
- Het systeem publiceert nooit om een schema te halen. Er is geen code die dat
  kan.

### AI-disclosure

YouTube's disclosureplicht geldt voor **realistische** gemanipuleerde of
synthetische content. De drie genoemde triggers: een echt persoon iets laten
zeggen of doen wat niet gebeurde, beelden van een echte gebeurtenis of plaats
wijzigen, of een realistische scène genereren die niet plaatsvond. Een
AI-voice-over op zichzelf is géén trigger — tenzij de stem gekloond is om als
een specifiek bestaand persoon te klinken. Duidelijk gestileerde illustraties en
animaties vallen er buiten. [bron: secundair, te verifiëren]

Ontwerpgevolg: de **Trust Gate** zet het disclosure-veld automatisch op *aan*
zodra de shotlist een fotorealistische generatieve clip bevat die een plaats of
gebeurtenis suggereert. Bij twijfel altijd melden — een onnodige melding kost
niets, een gemiste melding kost vertrouwen.

De aanbevolen presentatiestijl uit [`01`](01-vragen.md) (geen AI-gezicht, geen
gekloonde stem, gestileerde beelden) is mede zo gekozen dat de disclosurevraag
in de meeste video's helemaal niet speelt.

### API-voorwaarden

De YouTube API Services Terms stellen eisen die het datamodel raken, met name
een **bewaartermijn voor opgehaalde API-data** — die moet periodiek worden
ververst of verwijderd. Het systeem behandelt daarom alle YouTube-afkomstige
data als een cache met een TTL, nooit als eigen archief. Concreet: metadata van
referentievideo's verloopt na 30 dagen en wordt ververst of opgeruimd; alleen de
*afgeleide*, geanonimiseerde patroonanalyse blijft bewaard. [status: **te
verifiëren** — de exacte termijn en uitzonderingen staan in de officiële
voorwaarden, die deze sessie niet kon bereiken]

### Automatische engagement

Nergens in de architectuur bestaat een pad om views, likes, reacties, abonnees
of watch time te beïnvloeden. De OAuth-scopes zijn zo gekozen dat het technisch
onmogelijk is: `youtube.upload` en `yt-analytics.readonly`, meer niet. Geen
`youtube.force-ssl` met schrijfrechten op reacties, geen `youtubepartner`.

---

## 3. EU AI-verordening

Voor deze toepassing zijn twee dingen relevant:

- **Transparantieverplichting bij synthetische content** (art. 50). Wie
  audio-, beeld- of videomateriaal genereert of manipuleert dat op echt
  materiaal lijkt, moet dat machineleesbaar markeren en de kijker informeren.
  Dit loopt grotendeels parallel aan YouTube's disclosureplicht; het systeem
  behandelt ze als één poort met de striktste van de twee als norm.
- **Geen hoog-risico-classificatie.** Contentproductie voor entertainment en
  educatie valt niet in de hoog-risicocategorieën. Wel geldt: zodra een video
  medisch, financieel of juridisch advies benadert, wordt dat een inhoudelijk
  risico onder §5 hieronder, ongeacht de AI-verordening.

[status: **te verifiëren** — ingangsdata en exacte reikwijdte van art. 50 moeten
tegen de officiële verordeningstekst worden gehouden vóór de eerste publicatie.]

---

## 4. AVG

| Gegeven | Grondslag en behandeling |
|---|---|
| **Reactieteksten en auteursnamen** van referentievideo's | Persoonsgegevens. Het systeem slaat ze **niet** op. Als reactieanalyse later gewenst is: alleen geaggregeerde, geanonimiseerde themaclusters bewaren, ruwe tekst direct weggooien. Auteursnamen worden nooit opgeslagen. |
| **Eigen kanaalanalytics** | Van YouTube ontvangen, geaggregeerd, geen identificeerbare kijkers. Geen probleem. |
| **Eigen reacties op eigen video's** | Wel persoonsgegevens. Bewaartermijn en verwijderprocedure vastleggen; niet in de database dupliceren. |
| **De stemopname van de voice-over** | Als je ooit je eigen stem laat klonen: dat is een biometrisch-adjacent gegeven en vraagt uitdrukkelijke toestemming plus een verwerkersovereenkomst met de TTS-leverancier. Bij een generieke synthetische stem speelt dit niet. |
| **Verwerkers** | Elke AI-provider is een verwerker. Verwerkersovereenkomst nodig, plus vastleggen waar data staat en of die voor modeltraining wordt gebruikt — dat laatste is een selectiecriterium in [`05`](05-toolvergelijking.md). |

Deze repository bevat al een verwerkingsregister voor Buurklus
(`docs/PRIVACY.md`). Als het kanaal aan Buurklus hangt, hoort dit systeem daar
als aparte verwerking in, niet als bijlage.

---

## 5. Gevoelige onderwerpen

Voor gezondheid, financiën, recht, politiek en veiligheid gelden extra regels
die in de pipeline zijn ingebouwd:

- **`AUTO_PUBLISH` is voor deze categorieën permanent uit**, ook als je globaal
  `APPROVAL_MODE=false` zet. Dat is geen instelling maar een harde
  codebeperking.
- **Geen gesimuleerde deskundigheid.** De voice-over presenteert zich nooit als
  arts, adviseur of advocaat. Geen "ik heb dit zelf meegemaakt", geen "in mijn
  praktijk zie ik".
- **Geen individueel advies.** Alleen algemene uitleg, met een disclaimer die
  per categorie verschilt en automatisch aan beschrijving én script wordt
  toegevoegd.
- **Primaire bronnen verplicht.** Voor deze categorieën wordt de Source
  Confidence-drempel verhoogd van 90 naar 95, en secundaire bronnen tellen niet
  mee voor het bewijs van een centrale claim.
- **Verzonnen bewijs is een harde stop.** Elk cijfer, citaat of onderzoek in het
  script moet naar een geregistreerde bron verwijzen. Een claim zonder bron
  blokkeert de build; hij wordt niet gemarkeerd of afgezwakt, hij blokkeert.

Niche A ("wonen en verborgen kosten") raakt aan financiën en valt dus onder dit
regime. Dat is meegewogen in de score in [`02`](02-niche-en-businessmodel.md) en
het is de voornaamste reden dat A één punt lager scoort op risico dan E.

---

## 6. Muziek, geluid en beeld

- **Muziek** uitsluitend uit een bron met aantoonbare commerciële licentie, met
  het licentiebewijs opgeslagen naast het bestand in de asset-store. Geen
  YouTube Audio Library-tracks zonder de licentietekst erbij te bewaren, geen
  "royaltyvrij" van onduidelijke herkomst.
- **Beeld** is origineel gegenereerd of komt uit een bron met expliciete
  commerciële rechten. Elke asset krijgt een `license_proof`-record; een asset
  zonder dat record kan de montagestap niet in. Dat is een
  databaseconstraint, geen procedure.
- **Generatieve modellen** worden geselecteerd op een voorwaardentekst die
  commercieel gebruik van de output expliciet toestaat. Dit is een
  uitsluitingscriterium in [`05`](05-toolvergelijking.md), geen weegfactor.

---

## 7. Affiliate en sponsoring

- Betaalde promotie wordt gemeld via YouTube's eigen veld **en** zichtbaar in de
  video zelf, niet alleen in de beschrijving.
- Affiliate-links krijgen een vermelding in beschrijving én gesproken tekst.
- Nederlandse reclameregels (Reclamecode Social Media & Influencer Marketing,
  toezicht ACM) gelden naast YouTube's regels en zijn op onderdelen strenger.
- De Trust Gate heeft hiervoor een expliciete toets: *"is de video ook nuttig
  als de kijker niets koopt?"* Is het antwoord nee, dan is het geen video maar
  een advertentie, en gaat hij niet door de poort.

---

## Samenvatting: wat blokkeert publicatie

| Bevinding | Gevolg |
|---|---|
| Claim zonder geregistreerde bron | **Blokkeert** |
| Asset zonder `license_proof` | **Blokkeert** |
| Originality Score < 90 | **Blokkeert** |
| Te hoge gelijkenis met onze eigen eerdere video | **Blokkeert** |
| Titel of thumbnail toont iets dat niet in de video zit | **Blokkeert** |
| Gevoelig onderwerp zonder menselijke goedkeuring | **Blokkeert** |
| Fotorealistische generatieve scène zonder disclosure | **Blokkeert** |
| Gesimuleerde deskundigheid of persoonlijke ervaring | **Blokkeert** |
| Policy Risk middel of hoog | **Blokkeert** ook bij `APPROVAL_MODE=false` |

Geen van deze drempels kan door het systeem zelf worden verlaagd. Ze staan in
configuratie die alleen jij wijzigt, en elke wijziging komt in het auditlog.
