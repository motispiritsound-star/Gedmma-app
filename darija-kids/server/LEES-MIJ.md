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

### En bij de betaalpartner

Zet een ping of webhook naar `https://post.darijaforkids.eu/koop`, met de kop
`x-darija-geheim` op de waarde van `KOOP_GEHEIM`. Zonder die melding weet het
portaal niet wie wat gekocht heeft, en blijft iemands bibliotheek leeg terwijl
hij wél betaald heeft.

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
