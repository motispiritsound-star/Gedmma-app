# Webscan NL

Scant geautomatiseerd de websites van Nederlandse bedrijven, geeft elke site een
cijfer van 0 tot 100 en zet ze als gekleurde bollen op de kaart: **rood** is een
slechte site, **oranje** matig, **groen** goed. De slechte sites zijn je leads.
Vanaf daar werkt je team ze uit — bellen, adviseren, gratis verbeteren, hosting
overnemen — tot ze maandelijks betalende klanten zijn.

```
bedrijven ophalen → scannen → kaart met rood/oranje/groen
                 → prioriteit (slechte site + bedrijf dat draait + bereikbaar)
                 → mailen, dan bellen → opdracht → klant → maandomzet
```

Het is een platform voor meer mensen dan jij alleen: je maakt accounts aan voor
de agents die je werft, wijst leads toe (of laat ze zelf oppakken), en ziet per
persoon hoeveel er gebeld is, hoeveel afspraken eruit komen en welke maandomzet
ze binnenbrengen.

## Eerst even proberen

Wil je zien hoe het werkt zonder eerst bedrijven te verzamelen:

```bash
git clone https://github.com/motispiritsound-star/Gedmma-app.git
cd Gedmma-app
npm install
npm run proefrit
```

De eerste keer duurt dat ongeveer een minuut: er worden 125 nagemaakte
bedrijfswebsites opgezet en echt gescand. Daarna opent het dashboard op
**http://localhost:4321** en staan de inloggegevens op je scherm — een eigenaar
en twee agents, allemaal met wachtwoord `proefrit2026`.

Log eerst in als **eigenaar** voor de kaart, het teamoverzicht en de omzet.
Log daarna in als **Sara** of **Tom** om te voelen hoe het is om met een eigen
lijst te werken: je ziet wel wat je collega onder handen heeft, maar je komt er
niet in. Alles wat je aanklikt wordt echt opgeslagen. Opnieuw beginnen doe je
door `data/demo.db` te verwijderen.

Node 22.18 of nieuwer is vereist (het project draait TypeScript rechtstreeks,
zonder buildstap, en gebruikt de ingebouwde SQLite van Node). Draai je iets
ouders, dan zegt het opstartscript dat meteen.

## Aan de slag met echte bedrijven

```bash
cp .env.example .env          # zet je eigen contactgegevens in WEBSCAN_USER_AGENT

# 1. Maak je eigen account aan
node start.js gebruiker toevoegen --naam "Jouw naam" --email jij@voorbeeld.nl --rol eigenaar

# 2. Bedrijven met een website ophalen (gratis, uit OpenStreetMap — mét positie)
node start.js import --source osm --area Utrecht --category all --limit 300

# 3. Hun websites scannen
node start.js scan --limit 300

# 4. Leg vast wat je aanbiedt
node start.js aanbod --maandbedrag 49

# 5. Alles bekijken op de kaart
node start.js serve      # http://localhost:4321
```

Zet `WEBSCAN_DB` in je `.env` op een ander bestand dan `data/demo.db`, zodat je
echte werk niet tussen de proefgegevens komt te staan.

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
node start.js import --source osm --area Amersfoort --category horeca
node start.js import --source csv --file examples/bedrijven-voorbeeld.csv
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
node start.js scan --deep --limit 25 --screenshots ./out/screenshots
```

## Contactgegevens

Contactgegevens staan zelden op de homepage — ze staan op `/contact`. De scan
haalt daarom die ene extra pagina op als de site ernaar linkt, en haalt eruit
wat je nodig hebt om te bellen:

- alle telefoonnummers en e-mailadressen van beide pagina's samen;
- het bezoekadres (straat, huisnummer, postcode, plaats);
- openingstijden, KvK-nummer, btw-nummer en IBAN als ze er staan;
- WhatsApp en de social-profielen waar de site naar linkt.

In het dashboard staat dat bovenaan bij elke lead, met klikbare `tel:`- en
`mailto:`-knoppen. In de CSV-export staan ze als losse kolommen.

**Gaat een site offline, dan blijven de gegevens staan.** De scan valt terug op
de laatste keer dat er wél iets te vinden was, met de datum erbij. Juist dan wil
je hun nummer nog hebben — "uw website is uit de lucht" is een van de betere
redenen om te bellen.

## Draait dit bedrijf nog?

Een verwaarloosde website is nog geen goede lead. De bakker die er over een jaar
mee stopt heeft ook een site uit 2011, maar die gaat niets afnemen. Daarom wordt
naast de kwaliteit apart gekeken of het bedrijf nog draait — uit dezelfde pagina
die toch al opgehaald wordt, plus de sitemap:

| Teken van leven | Waarom het meetelt |
| --- | --- |
| Sitemap recent bijgewerkt | Het hardste signaal dat iemand nog aan de site werkt |
| Het huidige jaartal staat erop | Iemand houdt de teksten bij |
| Een nieuwsbericht van dit jaar | Er wordt nog geschreven |
| Een vacature | Er wordt geld uitgegeven aan personeel |
| Online bestellen of afspraak maken | Er is in conversie geïnvesteerd |
| Statistiek op de site | Iemand kijkt naar de cijfers |
| Meerdere social-profielen, WhatsApp | Er wordt naar buiten gecommuniceerd |
| Copyright van vier jaar terug | Telt juist tegen |
| Tekst als "wij zijn gestopt" | Telt zwaar tegen |

Daaruit komt een **prioriteit**: hoe interessant dit bedrijf is om te benaderen.
Die drie dingen moeten alle drie kloppen, dus ze werken op elkaar in in plaats
van dat ze bij elkaar opgeteld worden:

```
prioriteit = (hoeveel er aan de site te verbeteren valt)
           × (draait het bedrijf nog)
           × (kun je er contact mee krijgen)
```

Een site van 6 op 100 van een bedrijf zonder teken van leven zakt daarmee onder
een site van 16 van een bedrijf dat personeel zoekt. De lijst staat standaard op
prioriteit gesorteerd; met **Slechtste site eerst** krijg je de oude volgorde
terug. Bij elke lead staat waarom hij hoog of laag scoort, zodat je het zelf kunt
wegen.

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
node start.js geocode --limit 500
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
node start.js gebruiker toevoegen --naam "Sara de Wit" --email sara@voorbeeld.nl
node start.js gebruiker lijst
node start.js gebruiker blokkeren sara@voorbeeld.nl      # en --herstel om terug te draaien
```

### De weg van lead naar klant

| Fase | Betekenis |
| --- | --- |
| `nieuw` | Gescand, nog niemand mee bezig |
| `toegewezen` | Op de lijst van een agent |
| `gebeld` | Gesproken, nog geen besluit |
| `geen_gehoor` | Niet bereikt, later opnieuw |
| `afspraak` | Afspraak of terugbelmoment staat |
| **`opdracht`** | **De mijlpaal: we mogen de site kosteloos herbouwen en hosten** |
| `in_aanbouw` | Nieuwe site wordt gebouwd |
| `live` | Site staat live op onze hosting |
| `klant` | Betaalt maandelijks voor hosting |
| `afgewezen` | Geen interesse |

**`opdracht` is waar het om draait.** Alles daarvoor is overtuigen; vanaf daar is
het werk binnen. Het dashboard telt die stap apart — als tegel op je eigen lijst,
als kolom in het teamoverzicht en gemarkeerd in de trechter — en het aantal van de
laatste dertig dagen staat er los bij, zodat je ziet of het loopt of stilstaat.

Elk telefoontje, elke notitie en elke fasewissel komt in de geschiedenis van die
lead te staan, met wie het deed en wanneer. Gaat de site later live en betaalt het
bedrijf voor de hosting, dan leg je het maandbedrag vast en telt het mee in de
maandomzet — van het bedrijf én van de agent die de opdracht binnenhaalde.
Testimonials leg je bij dezelfde lead vast, met een vinkje of je hem mag publiceren.

### Zien wie waarmee bezig is

Iedereen ziet alle bedrijven, maar nooit zonder te zien wie er al mee bezig is:

- op de **kaart** krijgt een bolletje een ring — in de accentkleur als hij van jou
  is, grijs als een collega hem heeft; de tooltip noemt de naam;
- in de **lijst** staat bij elke regel een rondje met initialen en de naam van de
  agent, met een streep langs de regel;
- in het **detailpaneel** staat bovenaan wie ermee bezig is en sinds wanneer, met
  de knoppen op slot voor iedereen behalve die agent en de eigenaar.

Filteren kan op *Van mij*, *Van collega's* of *Nog niet toegewezen*, zodat je in
één klik ziet wat er nog vrij ligt.

```bash
node start.js fase 42 afspraak --agent sara@voorbeeld.nl --notitie "dinsdag 14:00"
node start.js trechter        # hoeveel bedrijven in welke fase
node start.js team            # wie belt hoeveel en brengt hoeveel op
node start.js testimonials --publiceerbaar
```

## Wat je aanbiedt

Onder **Team & omzet** stel je in wat je precies aanbiedt. Die tekst komt in alle
mailsjablonen terecht, dus je kunt je propositie bijstellen zonder dertien
teksten te herschrijven. Er zijn twee vormen:

- **Gratis herbouw, betalen per maand** — laagste drempel, maar je legt de hele
  kostprijs vooraf bij jezelf;
- **Startbedrag voor de bouw, daarna per maand** — je verdient de bouw meteen
  terug en filtert de mensen eruit die toch nooit gingen betalen.

Reken het door voordat je kiest. Een herbouw van zes uur bij € 24,50 per maand
verdien je pas na ongeveer tien maanden terug, en dan nog zonder provisie voor de
agent die hem binnenhaalde. Eén klant die na acht maanden opzegt kost je geld.
Het dashboard rekent die terugverdientijd voor je uit zodra je "gratis" kiest.

```bash
node start.js aanbod                                            # wat staat er nu
node start.js aanbod --soort startbedrag --startbedrag 295 --maandbedrag 59
```

## Mailsjablonen

Er zitten dertien kant-en-klare mails in, allemaal gevuld met wat de scan op die
specifieke site gevonden heeft. Je kiest er een, controleert de tekst en klikt op
**Open in mailprogramma** — onderwerp en tekst staan er al in.

| Sjabloon | Wanneer |
| --- | --- |
| `eerste-contact` | Koude benadering met de bevindingen |
| `eerste-contact-kort` | Vier zinnen, één vraag, voor wie weinig tijd heeft |
| `mobiel` | De site werkt niet op een telefoon |
| `vindbaarheid` | De site is slecht vindbaar in Google |
| `snelheid` | De site is traag of draait op verouderde techniek |
| `website-offline` | De site laadt helemaal niet |
| `geen-gehoor` | Gebeld, niemand bereikt |
| `na-gesprek` | Bevestiging van wat je telefonisch besprak |
| `rapport` | Het volledige rapport meesturen |
| `laatste-poging` | Beleefd afsluiten na een paar keer geen reactie |
| `opdracht-bevestigd` | Ze zeggen ja: afspraken op een rij en wat je nodig hebt |
| `site-live` | De nieuwe site staat online |
| `toestemming-vragen` | Toestemming vragen om te mogen bellen (verplicht bij eenmanszaken) |
| `testimonial` | Vragen om een testimonial |

Het dashboard kiest zelf het sjabloon dat bij de scan past: geen viewport gevonden
→ `mobiel`, site onbereikbaar → `website-offline`, veel SEO-punten kwijt →
`vindbaarheid`. Mag je het bedrijf niet bellen, dan wint `toestemming-vragen`:
dat is dan de enige route naar een gesprek. Je kunt altijd een ander kiezen.

De koude sjablonen sluiten af met een afmeldregel, omdat dat bij ongevraagde
zakelijke mail hoort. Lees elke mail na voordat je hem verstuurt — het blijft een
concept, geen automaat.

```bash
node start.js sjablonen                      # welke er zijn
node start.js mail 42                        # het passende sjabloon
node start.js mail 42 --sjabloon na-gesprek --naam "Jouw naam" --bedrijf "Jouw bedrijf"
```

## Actueel houden

Websites veranderen. Een site die vorige maand nog draaide kan nu uit de lucht
zijn, en een site die je drie maanden geleden afschreef kan intussen door iemand
anders zijn opgepakt. Draai daarom periodiek:

```bash
node start.js actualiseren --dagen 30 --limit 200
```

Dat scant alles wat langer dan dertig dagen geleden gemeten is, en laat zien wat
er veranderd is:

```
  Verandering  Bedrijf                            Wat er gebeurd is
  ─────────────────────────────────────────────────────────────────────────
  ▼  54 → 0    Dierenkliniek Smit                 site is nu onbereikbaar
  ▼  71 → 38   Installatiebedrijf Meijer          Geen HTTPS: bezoekers zien "Niet veilig"
  ▲  22 → 74   Kapsalon van der Berg              de site is verbeterd
```

Achteruitgegaan is een goede belreden: er is iets kapot of verwaarloosd sinds je
vorige contact. Vooruitgegaan is een waarschuwing: mogelijk heeft een ander het
werk al gedaan. In het dashboard zie je het verschil als een pijltje naast de
score, met een filter **achteruit** en een sortering op meeste achteruitgang.

Elke scan wordt bewaard, dus de geschiedenis van een bedrijf blijft compleet.

## Leads eruit halen

```bash
# Slechtst scorende sites met een telefoonnummer of e-mailadres
node start.js leads --max-score 45 --city Utrecht --met-contact

# Naar CSV voor je CRM of mailmerge
node start.js export out/leads-utrecht.csv --max-score 45 --city Utrecht

# Concept-mail voor lead #12
node start.js mail 12 --naam "Jouw naam" --bedrijf "Jouw bedrijf" \
  --telefoon "06-12345678" --email "jij@voorbeeld.nl" --rapport

# Bijhouden waar je staat
node start.js fase 12 gebeld --notitie "voicemail ingesproken"
```

Het dashboard (`node start.js serve`) doet hetzelfde met de kaart erbij: filters,
de scoreverdeling per onderdeel, de volledige probleemlijst, knoppen om een
telefoontje vast te leggen, en de mailsjablonen met een knop om ze in je
mailprogramma te openen.

## Heel Nederland scannen

Doe het per gemeente in plaats van in één keer. Dat is vriendelijker voor de
Overpass-servers, het levert direct bruikbare regiolijsten op, en je kunt stoppen
en doorgaan wanneer je wilt — alles staat in SQLite en scans worden hervat.

```bash
for plaats in Utrecht Amersfoort Nieuwegein Zeist Veenendaal; do
  node start.js import --source osm --area "$plaats" --limit 2000
done
node start.js scan --limit 5000 --concurrency 8
```

Reken op ongeveer 1 tot 3 seconden per site. Met `--concurrency 8` is dat ruwweg
10.000 sites per uur; de rem zit bewust in de pauze per host (`WEBSCAN_HOST_DELAY_MS`),
niet in de doorvoer over alle hosts heen.

## Op een server zetten

Zodra je met agents gaat werken, moet het dashboard ergens draaien waar zij bij
kunnen. Een kleine VPS is genoeg — het is één Node-proces en één databasebestand.

```bash
# op de server, als een eigen gebruiker (dus niet als root)
git clone https://github.com/motispiritsound-star/Gedmma-app.git /srv/webscan
cd /srv/webscan && npm install --omit=dev
node start.js gebruiker toevoegen --naam "Jouw naam" --email jij@voorbeeld.nl --rol eigenaar
```

Draaiend houden met systemd (`/etc/systemd/system/webscan.service`):

```ini
[Unit]
Description=Webscan NL
After=network.target

[Service]
User=webscan
WorkingDirectory=/srv/webscan
Environment=WEBSCAN_HTTPS=1
Environment=WEBSCAN_DB=/srv/webscan/data/webscan.db
ExecStart=/usr/bin/node start.js serve --port 4321
Restart=always

[Install]
WantedBy=multi-user.target
```

En ervoor een reverse proxy die het certificaat regelt. Met Caddy is dat twee
regels in je `Caddyfile`:

```
webscan.jouwdomein.nl {
    reverse_proxy localhost:4321
}
```

Caddy haalt en vernieuwt het certificaat zelf. Laat poort 4321 dicht in je
firewall; alleen 80 en 443 hoeven open. Zet `WEBSCAN_HTTPS=1` zoals hierboven,
anders krijgt de sessiecookie geen `Secure`-vlag.

Back-up is één bestand: zet `data/webscan.db` (plus de `-wal`) elke nacht ergens
anders neer. Dat is je hele administratie.

## Voordat je het op internet zet

Het dashboard is gebouwd voor een team dat je kent, op een server die je zelf
beheert. Inloggen gaat met scrypt-gehashte wachtwoorden en een HttpOnly-sessiecookie,
mislukte pogingen worden afgeremd, en agents kunnen alleen bij hun eigen leads.
Wat er nog niet in zit en wat je zelf moet regelen voordat het publiek bereikbaar is:

- **HTTPS ervoor** — zie hierboven; zonder `WEBSCAN_HTTPS=1` reist de
  sessiecookie onbeschermd mee;
- **wachtwoord vergeten** — er is geen herstelmail; als eigenaar zet je met
  `webscan gebruiker wachtwoord <email>` een nieuw wachtwoord;
- **back-ups** van `data/webscan.db` (één bestand, dus een kopie volstaat);
- **tweefactor** zit er niet in.

## Wie mag je bellen, en wie niet

**Dit is het belangrijkste stuk van de README.** Sinds **1 juli 2026** geldt in
Nederland een opt-in voor telemarketing: bellen mag alleen nog met vooraf gegeven,
aantoonbare toestemming. Dat geldt voor natuurlijke personen — en daar vallen
**eenmanszaken, vof's, maatschappen en cv's** onder. De uitzondering voor
bestaande klanten is per diezelfde datum vervallen. De ACM handhaaft en kan
boetes opleggen tot € 900.000 of 1% van de jaaromzet, en de bewijslast dat er
toestemming was ligt bij degene die belt.

Voor **rechtspersonen** (bv, nv, stichting, vereniging, coöperatie) verandert er
niets: die mag je zakelijk bellen.

Dat raakt dit product in het hart, want de doelgroep — loodgieters, kappers,
bakkers, hoveniers — is grotendeels eenmanszaak of vof. In de demo van 125
bedrijven mag je er **26 bellen en 91 alleen mailen**.

Daarom werkt de tool zo:

- elk bedrijf heeft een **rechtsvorm**; die wordt afgeleid uit de bedrijfsnaam
  ("... B.V.") of uit een `rechtsvorm`-kolom in je CSV, en is anders `onbekend`;
- **onbekend telt als "niet bellen"** — bij twijfel geen risico;
- de **belknoppen staan uit** als bellen niet mag, met de reden erbij, en de
  server weigert het telefoontje ook als je het toch probeert vast te leggen;
- het voorgestelde mailsjabloon is dan `toestemming-vragen`, dat expliciet om
  toestemming vraagt om te mogen bellen;
- komt die toestemming binnen, dan leg je vast **hoe** en **waar het uit blijkt** —
  zonder die onderbouwing weigert de tool de toestemming op te slaan;
- filter **"mag gebeld worden"** geeft je in één klik de belijst die wél mag.

```bash
node start.js mag-bellen 42                     # mag ik dit bedrijf bellen?
node start.js rechtsvorm 42 eenmanszaak
node start.js toestemming 42 --via mailreactie --bewijs "Mailde terug: prima, u mag bellen"
```

Zoek de rechtsvorm op in het KVK-register voordat je belt. Dit is geen juridisch
advies: laat je opzet toetsen voordat je begint.

## Niet meer benaderen

Zegt iemand "haal me van je lijst", dan zet je hem op de niet-benaderen-lijst.
Dat werkt voor het hele platform en voor iedereen: het bedrijf verdwijnt uit alle
lijsten, van de kaart en uit de export, en de server weigert elk telefoontje en
elke mail. Alleen de eigenaar kan het terugdraaien.

```bash
node start.js niet-benaderen 42 --reden "wil geen berichten meer"
```

## Spelregels bij het scannen

De scan bezoekt alleen de openbaar toegankelijke homepage, en:

- **respecteert `robots.txt`** — sites die het verbieden worden overgeslagen
  (status `blocked`), inclusief `Crawl-delay`;
- houdt standaard **1,5 seconde tussen twee requests naar dezelfde host**;
- **identificeert zichzelf** in de User-Agent. Zet daar je eigen contactgegevens
  in via `WEBSCAN_USER_AGENT`, zodat een beheerder je kan bereiken;
- haalt maximaal 3 MB per pagina op en stopt daarna.

Zakelijke e-mail mag ruimer dan bellen, maar niet vrijblijvend: elk bericht heeft
een afmeldmogelijkheid nodig (die staat in de sjablonen) en de gegevens die je
verzamelt vallen onder de AVG — met een bewaartermijn, een verwerkingsregister en
het recht om verwijderd te worden. De gegenereerde mail is een **concept**: lees
hem na voordat je iets verstuurt.

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
    contact.ts        rechtsvorm, belregels, toestemming en de niet-benaderen-lijst
    instellingen.ts   wat je aanbiedt, in één plek
  sources/            waar bedrijven vandaan komen (osm, csv, kvk)
  scan/
    robots.ts         robots.txt lezen en naleven
    fetcher.ts        beleefd ophalen, https-fallback, timing
    analyze.ts        HTML omzetten in meetbare signalen
    tech.ts           CMS-, framework- en verouderde-techniekdetectie
    contactpagina.ts  haalt /contact op voor telefoon, adres, KvK en openingstijden
    geocode.ts        plaatsnamen naar coördinaten (Nominatim)
    deep.ts           optionele browsermeting (LCP/CLS/screenshot)
    scanner.ts        alles aan elkaar knopen
  score/
    rules.ts          de probleemcatalogus — hier pas je het oordeel aan
    score.ts          punten naar score, cijfer en deelscores
  report/
    leads.ts          leads opvragen, filteren en kaartpunten
    export.ts         CSV/JSON-export
    templates.ts      de dertien mailsjablonen — hier pas je de teksten aan
    pitch.ts          het uitgebreide rapport
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

## Ook in deze repository

**[`noer/`](noer/)** — Noer: Arabisch leren lezen en korte soera's uit je hoofd
leren, voor kinderen van 5 tot en met 13 jaar. Een losstaande app met een eigen
`package.json`; `cd noer && npm start`.
