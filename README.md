# Webscan NL

Scant geautomatiseerd de websites van Nederlandse bedrijven, geeft elke site een
cijfer van 0 tot 100 en zet ze als gekleurde bollen op de kaart: **rood** is een
slechte site, **oranje** matig, **groen** goed. De slechte sites zijn je leads.
Vanaf daar werkt je team ze uit — bellen, adviseren, gratis verbeteren, hosting
overnemen — tot ze maandelijks betalende klanten zijn.

```
bedrijven ophalen → scannen → kaart met rood/oranje/groen → bellen → klant → maandomzet
```

Het is een platform voor meer mensen dan jij alleen: je maakt accounts aan voor
de agents die je werft, wijst leads toe (of laat ze zelf oppakken), en ziet per
persoon hoeveel er gebeld is, hoeveel afspraken eruit komen en welke maandomzet
ze binnenbrengen.

## Snel starten

```bash
npm install
cp .env.example .env          # zet je eigen contactgegevens in WEBSCAN_USER_AGENT

# 1. Maak je eigen account aan
node src/cli.ts gebruiker toevoegen --naam "Jouw naam" --email jij@voorbeeld.nl --rol eigenaar

# 2. Bedrijven met een website ophalen (gratis, uit OpenStreetMap — mét positie)
node src/cli.ts import --source osm --area Utrecht --category all --limit 300

# 3. Hun websites scannen
node src/cli.ts scan --limit 300

# 4. Alles bekijken op de kaart
node src/cli.ts serve      # http://localhost:4321
```

Node 22.18 of nieuwer is vereist (het project draait TypeScript rechtstreeks,
zonder buildstap, en gebruikt de ingebouwde SQLite van Node).

## Waar de bedrijven vandaan komen

| Bron  | Wat je krijgt | Kosten |
| --- | --- | --- |
| `osm` | Bedrijven uit OpenStreetMap mét website, adres en vaak telefoon/e-mail | gratis (ODbL) |
| `csv` | Je eigen lijst — elke export uit een CRM, scraper of adressenbestand | – |
| `kvk` | Bedrijfsnaam, KVK-nummer en plaats uit de KVK Zoeken API | API-key nodig |

Belangrijk om te weten: **de KVK levert geen websites**. Die bron is dus bruikbaar
om te zien welke bedrijven er in een plaats gevestigd zijn of om je lijst te
verrijken, maar het adres van de website moet uit `osm` of je eigen `csv` komen.
Voor de praktijk is `osm` de bruikbaarste startbron: voor Nederland staan er
honderdduizenden bedrijven in mét `website`-tag.

```bash
node src/cli.ts import --source osm --area Amersfoort --category horeca
node src/cli.ts import --source csv --file examples/bedrijven-voorbeeld.csv
```

Categorieën voor `osm`: `shop`, `horeca`, `office`, `craft`, `zorg`, `toerisme`, `all`.

## Wat de scan meet

Elke site krijgt 100 punten en verliest punten per gevonden probleem. De weging:

| Onderdeel | Gewicht | Waar naar gekeken wordt |
| --- | --- | --- |
| Techniek & veiligheid | 25 | HTTPS, geldig certificaat, mixed content, verouderd CMS/PHP/jQuery, Flash, securityheaders |
| Mobiel & responsive | 20 | viewport, media queries, vaste breedtes, tabel-opmaak, `<font>`/`<center>`, zoom geblokkeerd |
| Snelheid | 20 | laadtijd, servertijd (TTFB), paginagrootte, compressie, blokkerende scripts, WebP, lazy loading |
| Vindbaarheid (SEO) | 20 | titel, meta-omschrijving, H1, taal, canonical, Open Graph, structured data, alt-teksten |
| Inhoud & conversie | 15 | parkeerpagina, hoeveelheid tekst, contactgegevens, contactformulier, privacyverklaring, actualiteit |

Cijfers: **A** 85+, **B** 70–84, **C** 55–69, **D** 40–54, **F** onder de 40.
Een site die helemaal niet laadt of een HTTP-fout geeft krijgt score 0 — dat zijn
vaak je beste leads.

Wil je de regels aanpassen (andere weging, eigen problemen toevoegen)? Alles zit
in één bestand: `src/score/rules.ts`. Elke regel is een functie die naar de
gemeten signalen kijkt en een probleem teruggeeft of `null`.

Met `--deep` wordt daarnaast een echte browser gestart om LCP en CLS te meten —
de cijfers waar Google zelf op stuurt. Dat vraagt `npm install playwright` en is
een stuk trager, dus gebruik het op je shortlist en niet op de hele lijst:

```bash
node src/cli.ts scan --deep --limit 25 --screenshots ./out/screenshots
```

## De kaart

Het dashboard opent op de kaart van Nederland met elk gescand bedrijf als een
bolletje: rood onder de 40, oranje van 40 tot 70, groen daarboven. Bollen die op
elkaar liggen worden gebundeld tot één grotere bol met een aantal erin; klik erop
om in te zoomen. Klik een los bolletje aan en de lead opent rechts.

De kaart gebruikt geen externe kaartdienst en laadt geen tegels: de omtrek van
Nederland staat als 6 kB aan coördinaten in de repo (Natural Earth, publiek
domein). Dat scheelt een afhankelijkheid, kost geen verkeer, en er lekt geen
informatie over wie jij opzoekt naar een tegelserver.

Bedrijven uit OpenStreetMap hebben hun eigen positie al. Voor bedrijven uit een
CSV zoek je de plaats op met:

```bash
node src/cli.ts geocode --limit 500
```

Dat gebruikt Nominatim (één verzoek per seconde, zoals hun voorwaarden vragen) en
zet alle bedrijven uit dezelfde plaats rond het centrum, met wat spreiding zodat
ze niet op elkaar vallen. Een grove positie dus — goed genoeg om regio's te zien,
niet om een pand te vinden.

## Met een team werken

Iedereen logt in met een eigen account. Er zijn twee rollen:

- **eigenaar** — ziet alles, wijst leads toe, ziet de omzet en maakt accounts aan;
- **agent** — pakt vrije leads op, werkt zijn eigen lijst af.

Een lead die een agent oppakt is van hem: een collega kan er niet meer in werken.
Zo bellen twee mensen nooit hetzelfde bedrijf.

```bash
node src/cli.ts gebruiker toevoegen --naam "Sara de Wit" --email sara@voorbeeld.nl
node src/cli.ts gebruiker lijst
node src/cli.ts gebruiker blokkeren sara@voorbeeld.nl      # en --herstel om terug te draaien
```

### De weg van lead naar klant

| Fase | Betekenis |
| --- | --- |
| `nieuw` | Gescand, nog niemand mee bezig |
| `toegewezen` | Op de lijst van een agent |
| `gebeld` | Gesproken, nog geen besluit |
| `geen_gehoor` | Niet bereikt, later opnieuw |
| `afspraak` | Afspraak of terugbelmoment staat |
| `akkoord` | Zegt ja tegen de gratis verbetering |
| `in_aanbouw` | Nieuwe site wordt gebouwd |
| `live` | Site staat live op onze hosting |
| `klant` | Betaalt maandelijks voor hosting |
| `afgewezen` | Geen interesse |

Elk telefoontje, elke notitie en elke fasewissel komt in de geschiedenis van die
lead te staan, met wie het deed en wanneer. Zeggen ze ja, dan leg je het
maandbedrag vast en telt de lead mee in de maandomzet — van het bedrijf én van de
agent die hem binnenhaalde. Testimonials leg je bij dezelfde lead vast, met een
vinkje of je hem mag publiceren.

```bash
node src/cli.ts fase 42 afspraak --agent sara@voorbeeld.nl --notitie "dinsdag 14:00"
node src/cli.ts trechter        # hoeveel bedrijven in welke fase
node src/cli.ts team            # wie belt hoeveel en brengt hoeveel op
node src/cli.ts testimonials --publiceerbaar
```

## Leads eruit halen

```bash
# Slechtst scorende sites met een telefoonnummer of e-mailadres
node src/cli.ts leads --max-score 45 --city Utrecht --met-contact

# Naar CSV voor je CRM of mailmerge
node src/cli.ts export out/leads-utrecht.csv --max-score 45 --city Utrecht

# Concept-mail voor lead #12
node src/cli.ts pitch 12 --naam "Jouw naam" --bedrijf "Jouw bedrijf" \
  --telefoon "06-12345678" --email "jij@voorbeeld.nl" --rapport

# Bijhouden waar je staat
node src/cli.ts fase 12 gebeld --notitie "voicemail ingesproken"
```

Het dashboard (`node src/cli.ts serve`) doet hetzelfde met de kaart erbij: filters,
de scoreverdeling per onderdeel, de volledige probleemlijst, knoppen om een
telefoontje vast te leggen, en de concept-mail met een kopieerknop.

## Heel Nederland scannen

Doe het per gemeente in plaats van in één keer. Dat is vriendelijker voor de
Overpass-servers, het levert direct bruikbare regiolijsten op, en je kunt stoppen
en doorgaan wanneer je wilt — alles staat in SQLite en scans worden hervat.

```bash
for plaats in Utrecht Amersfoort Nieuwegein Zeist Veenendaal; do
  node src/cli.ts import --source osm --area "$plaats" --limit 2000
done
node src/cli.ts scan --limit 5000 --concurrency 8
```

Reken op ongeveer 1 tot 3 seconden per site. Met `--concurrency 8` is dat ruwweg
10.000 sites per uur; de rem zit bewust in de pauze per host (`WEBSCAN_HOST_DELAY_MS`),
niet in de doorvoer over alle hosts heen.

## Voordat je het op internet zet

Het dashboard is gebouwd voor een team dat je kent, op een server die je zelf
beheert. Inloggen gaat met scrypt-gehashte wachtwoorden en een HttpOnly-sessiecookie,
mislukte pogingen worden afgeremd, en agents kunnen alleen bij hun eigen leads.
Wat er nog niet in zit en wat je zelf moet regelen voordat het publiek bereikbaar is:

- **HTTPS ervoor** (nginx of Caddy als reverse proxy) en `WEBSCAN_HTTPS=1` in je
  `.env`, zodat de sessiecookie `Secure` meekrijgt;
- **wachtwoord vergeten** — er is geen herstelmail; als eigenaar zet je met
  `webscan gebruiker wachtwoord <email>` een nieuw wachtwoord;
- **back-ups** van `data/webscan.db` (één bestand, dus een kopie volstaat);
- **tweefactor** zit er niet in.

## Spelregels

De scan bezoekt alleen de openbaar toegankelijke homepage, en:

- **respecteert `robots.txt`** — sites die het verbieden worden overgeslagen
  (status `blocked`), inclusief `Crawl-delay`;
- houdt standaard **1,5 seconde tussen twee requests naar dezelfde host**;
- **identificeert zichzelf** in de User-Agent. Zet daar je eigen contactgegevens
  in via `WEBSCAN_USER_AGENT`, zodat een beheerder je kan bereiken;
- haalt maximaal 3 MB per pagina op en stopt daarna.

Voor de benadering zelf gelden gewoon de Nederlandse regels: e-mail naar
zakelijke adressen mag alleen met een geldige grondslag en altijd met een
afmeldmogelijkheid (die staat in de concept-mail), voor telefonisch benaderen
geldt het Bel-me-niet-register voor eenmanszaken en zzp'ers, en gegevens die je
verzamelt vallen onder de AVG. De gegenereerde mail is een **concept** — lees hem
na en pas hem aan voor je iets verstuurt.

## Projectstructuur

```
src/
  cli.ts              alle commando's
  config.ts           instellingen en .env
  db/
    schema.ts         migraties — de database werkt zichzelf bij
    index.ts          verbinding, bedrijven en scans
    team.ts           accounts, wachtwoorden en sessies
    pipeline.ts       fases, belgeschiedenis, klanten, testimonials
  sources/            waar bedrijven vandaan komen (osm, csv, kvk)
  scan/
    robots.ts         robots.txt lezen en naleven
    fetcher.ts        beleefd ophalen, https-fallback, timing
    analyze.ts        HTML omzetten in meetbare signalen
    tech.ts           CMS-, framework- en verouderde-techniekdetectie
    geocode.ts        plaatsnamen naar coördinaten (Nominatim)
    deep.ts           optionele browsermeting (LCP/CLS/screenshot)
    scanner.ts        alles aan elkaar knopen
  score/
    rules.ts          de probleemcatalogus — hier pas je het oordeel aan
    score.ts          punten naar score, cijfer en deelscores
  report/
    leads.ts          leads opvragen, filteren en kaartpunten
    export.ts         CSV/JSON-export
    pitch.ts          concept-mail en rapport
  server/
    index.ts          API met inloggen en rechten
    public/           dashboard: kaart (canvas), lijst en detailpaneel
tools/build-map.ts    maakt de omtrek van Nederland (eenmalig)
data/webscan.db       SQLite: bedrijven, scans, team, opvolging en klanten
```

## Demo

`npm run demo` start vijftien nagemaakte Nederlandse bedrijfswebsites op je eigen
machine — van een tabel-site uit 2009 met Flash tot een keurig verzorgde moderne
site — laat de echte scanner erover lopen en schrijft het resultaat weg als
`demo/out/demo.html`: een losse pagina die je zonder server kunt openen. Handig om
te zien hoe de scores uitpakken voordat je echte bedrijven gaat scannen, en om de
regels in `src/score/rules.ts` bij te stellen en het effect meteen terug te zien.

## Testen

```bash
npm test          # scanner + scoring tegen een lokale testsite
npm run test:api  # dashboard-API van begin tot eind
npm run typecheck
```

En in de projectstructuur hoort daar nog bij:

```
demo/
  sites.ts        vijftien nagemaakte bedrijfssites (http en https)
  build.ts        scant ze en schrijft demo/out/demo-data.json
  template.html   de losse demo-pagina
  page.ts         zet de scanresultaten in de pagina
test/             fixtures en controles
```
