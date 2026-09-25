# De post

De enige server die Darijaforkids heeft. Hij bestaat voor één ding: een
volwassene die iets van ons wil horen.

Wat erin staat is een e-mailadres, waar dat adres ja tegen heeft gezegd, en —
als daarom is gevraagd — vijf getallen over hoe het leren gaat. Geen naam, geen
antwoorden, geen apparaat-id, niets dat zegt wélk kind.

## Waarom het zo weinig is

De app wordt gebruikt door kinderen, en daar gelden andere regels dan bij een
gewone app:

- **Apple (richtlijn 1.3 en 5.1.4)** verbiedt in de Kids-categorie het
  doorgeven van persoonsgegevens aan derden en eist een ouderpoort vóór alles
  wat de app uit gaat. **Google Play (Families)** doet hetzelfde.
- **De AVG** legt de leeftijd van geldige toestemming in Nederland op 16 jaar.
  Een kind van acht kan dus niets weggeven; alleen de ouder kan dat.
- **Marketingmail** mag in de EU alleen na een uitdrukkelijk, apart, vooraf
  níét aangevinkt ja — en dat ja moet aantoonbaar zijn.

Daar volgt de hele opzet uit. Het formulier staat in de app achter dezelfde
ouderpoort als de aankoop. Er staan twee vinkjes in plaats van één, allebei
leeg, omdat nieuws en voortgang twee verschillende vragen zijn. En een adres
staat pas op de lijst nadat er in de inbox op is geklikt: iedereen kan andermans
adres in een formulier typen, en pas die klik maakt er toestemming van.

## Wat erin staat

`schema.sql` is de hele database. Twee tabellen:

- **aanmelding** — het adres, de taal, de twee vinkjes, de status, en het bewijs:
  wanneer, vanaf welk gehasht IP, en onder welke versie van de tekst
  (`tekst_versie`). Verander je de tekst van het vinkje, verhoog dan
  `TEKST_VERSIE` in `src/mails.ts` — dat is het verschil tussen "ze zeiden ja"
  en "ze zeiden ja hierop".
- **voortgang** — vijf getallen per aanmelding, elke keer overschreven. Units,
  lessen, woorden, reeks, xp. Meer niet.

## De eerste keer inrichten

In deze map, in deze volgorde. Elke stap hangt van de vorige af, en een stap
overslaan levert een foutmelding op die iets anders lijkt te zeggen.

```bash
npm install                 # anders bestaat wrangler hier niet
npm run maak-db             # maakt de database en drukt een database_id af
npm run schema              # zet alle tafels neer; veilig om te herhalen
npm run deploy
```

Het `database_id` staat al in `wrangler.toml`. Drukt `npm run maak-db` een
ander id af, zet dat er dan in: je hebt een tweede database gemaakt, en de
worker praat met degene die in het bestand staat.

`npm run deploy` legt meteen ook `post.darijaforkids.eu` aan — dat staat als
route in `wrangler.toml`, en omdat het domein op de nameservers van Cloudflare
draait zet wrangler de DNS-regel er zelf bij. Klaagt hij dat hij de zone niet
vindt, dan kijkt hij in het verkeerde account: `npx wrangler whoami` zegt in
welk.

### De drie geheimen

Ze staan nooit in een bestand en nooit in git. `npx wrangler secret put <naam>`
vraagt om de waarde en stuurt hem rechtstreeks door.

| | |
|---|---|
| `MAIL_SLEUTEL` | de API-sleutel van Brevo; zonder deze verstuurt niets |
| `ZOUT` | willekeurige tekens, om een IP te hashen. Verzin er veertig |
| `KOOP_GEHEIM` | gedeeld met de betaalpartner, zodat alleen die een verkoop kan melden |

Voor de laatste twee wil je iets wat niemand raadt. Laat je machine het
verzinnen in plaats van zelf te typen — in PowerShell:

```powershell
$geheim = -join (1..48 | ForEach-Object { '{0:x}' -f (Get-Random -Maximum 16) })
$geheim | npx wrangler secret put KOOP_GEHEIM
$geheim                      # dit is wat je bij de betaalpartner invult
```

Controleer achteraf met `npm run geheimen` of alle drie er staan.

### De boeken in de bak

Het portaal, het inloggen en de ledenlijst werken zonder. De lezer niet: die
haalt elk boek apart op uit een R2-bak, en zolang die er niet is zegt hij
"niet ingericht" — bij een koper die wél betaald heeft.

Twee opdrachten, één keer:

```bash
cd server
npm run maak-bak          # maakt de bak, zet de binding aan, rolt uit
cd ..
npm run lezen -- --r2     # 90 boeken erin: 15 delen × 6 talen
```

De eerste regel doet drie dingen achter elkaar, en dat is met opzet: de
binding naar de bak stond uitgezet omdat `wrangler deploy` omvalt op een bak
die niet bestaat, en "vergeet niet de hekjes weg te halen" is precies de stap
die je vergeet.

De prentenboeken van Sba staan er dan nog niet in. Die zijn bladzijden als
plaatje en moeten eerst geschoten worden, taal voor taal:

```bash
npm run bladen -- --taal nl --uploaden
```

Dat duurt lang en heeft een browser nodig. Zolang het niet gebeurd is, opent
Sba niet in de lezer — de pdf uit de winkel werkt wel gewoon.

### En bij de betaalpartner

Eén veld invullen, bij Gumroad onder **Settings → Advanced → Ping**:

```
https://post.darijaforkids.eu/koop?s=<de waarde van KOOP_GEHEIM>
```

Zonder die melding weet het portaal niet wie wat gekocht heeft, en blijft
iemands bibliotheek leeg terwijl hij wél betaald heeft. Dat is de ergste soort
fout in een winkel: hij lijkt op diefstal.

Het geheim staat hier in het adres en niet in een kop, omdat Gumroad geen
koppen kan meesturen — één invulveld, en verder niets. Dat heeft een prijs:
een adres komt in logboeken terecht en een kop niet. Daarom beschermt dit
geheim ook niets anders. Wie het in handen krijgt kan zichzelf een boek
sturen, en verder niets: er zit geen geld achter en geen gegevens van anderen.

Kan de betaalpartner wél eigen koppen sturen, gebruik dan `x-darija-geheim`
met dezelfde waarde en laat het `?s=` weg. `/koop` neemt allebei aan.

**Controleren.** Gumroad heeft een knop om een proefmelding te sturen. Die
komt hier binnen met `test=true`, wordt gewoon verwerkt, en de bestelling
krijgt het woord *proefmelding* in zijn merkregel — zo zie je achteraf welke
rij echt was. Zonder die knop kan het ook met de hand:

```bash
curl -sS -X POST "https://post.darijaforkids.eu/koop?s=<geheim>" \
  -d "email=jij@example.com&permalink=sleutels&ip_country=Netherlands&test=true"
```

Er hoort `{"goed":true}` terug te komen, en een mail met een sleutel erin.
Komt er `{"fout":"nee"}`, dan klopt het geheim niet. Komt er
`{"fout":"onvolledig"}`, dan herkende hij het product niet — kijk dan of het
laatste stuk van het productadres `sleutels`, `sbadeleeuw` of `eboek` is.

Het e-boek is met opzet een geval apart: die pdf levert Gumroad zelf af, dus
daar geeft het portaal niets voor. De melding komt wel aan en antwoordt
`{"goed":true,"genegeerd":["eboek"]}` — geen foutcode, want op een foutcode
probeert een betaalpartner het morgen gewoon opnieuw.

## De wegen

| | |
|---|---|
| `POST /aanmelden` | `{ email, taal, nieuws, voortgang }` → zet de rij op *wacht* en mailt een bevestiging |
| `GET /bevestig?t=` | maakt er *bevestigd* van en stuurt de welkomstmail |
| `GET /uitschrijven?t=` | zet beide vinkjes uit en gooit de voortgang weg |
| `GET /wissen?t=` | verwijdert de rij zelf — het recht om vergeten te worden |
| `POST /voortgang` | de vijf getallen, alleen van een bevestigde aanmelding die erom vroeg |
| cron, maandagochtend | één mail per week naar wie dat wilde |

Elke mail draagt onderaan zowel *uitschrijven* als *mijn gegevens wissen*, en
allebei werken zonder in te loggen — een account zou een tweede ding zijn om te
beschermen.

## Neerzetten

```bash
cd server
npm install

npx wrangler d1 create darijaforkids        # het id in wrangler.toml plakken
npm run schema                            # de tabellen aanmaken

npx wrangler secret put MAIL_SLEUTEL      # de sleutel van de mailprovider
npx wrangler secret put ZOUT              # een willekeurige lange tekst

npm run deploy
```

Zet daarna in `wrangler.toml` `BASIS` op het adres dat de worker kreeg, en in
de app `VITE_POST` op datzelfde adres — zonder dat staat het formulier er niet
eens.

## De mailprovider

`src/mail.ts` is het enige bestand dat weet wie de post bezorgt, en is
opzettelijk één bestand: een andere provider is dit bestand en verder niets.

Standaard is **Brevo**, omdat het Frans is — de adressen blijven in de EU en de
verwerkersovereenkomst is er een die je als Europese uitgever ook echt kunt
tekenen. MailerLite werkt net zo goed. Postmark en Resend zijn Amerikaans; dan
heb je een doorgifte buiten de EU te verantwoorden.

Wat je bij de provider zelf nog moet doen, want zonder dit komt de post in de
spammap: **SPF, DKIM en DMARC** instellen op het domein waar vanaf je stuurt.
De provider legt precies uit welke drie regels in de DNS moeten.

## Wat hier bewust níét in zit

- Geen inloggen, geen wachtwoorden, geen sessies.
- Geen analytics, geen pixel in de mail, geen klikregistratie.
- Geen naam van een kind, geen geboortedatum, geen antwoord op een oefening.
- Geen adressenkoppeling met de winkel: **Apple en Google geven het e-mailadres
  van een koper niet, aan niemand.** Wie beweert dat je kopers automatisch op een
  lijst kunt zetten, verkoopt iets. Het enige dat werkt is het vragen.
