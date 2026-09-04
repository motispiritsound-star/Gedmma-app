# Gedmma

Boekhouden in gewone taal, voor Nederlandse zzp'ers, mkb-bedrijven, stichtingen,
verenigingen en accountantskantoren.

Onder de begrijpelijke buitenkant zit een strikte dubbele boekhouding: elke
transactie wordt dubbel geboekt, definitieve boekingen zijn onveranderbaar, en
elk bedrag in elk rapport is doorklikbaar tot de journaalpost en het
onderliggende document.

> Deze repository bevat naast Gedmma ook **Webscan NL**, een bestaand product
> dat hier al stond. Dat draait ongewijzigd verder in [`apps/webscan`](apps/webscan/README.md).

## In een minuut aan de slag

Je hebt Node 22.18 of nieuwer nodig, en PostgreSQL 16 (lokaal of via Docker).

```bash
git clone https://github.com/motispiritsound-star/Gedmma-app.git
cd Gedmma-app
npm install

docker compose up -d db     # of gebruik een PostgreSQL die je al hebt draaien
npm run dev
```

Dat ene commando controleert de database, draait de migraties, zet de
basisgegevens klaar en start de API en de webapp:

* webapp: <http://localhost:5173>
* API: <http://localhost:4000/health/ready>

Maak in de webapp een account aan, geef je onderneming een naam en je hebt een
volledig Nederlands rekeningschema, btw-codes, dagboeken, een boekjaar met
twaalf perioden en een bankrekening klaarstaan.

### Zonder Docker

```bash
sudo -u postgres createuser --login --pwprompt gedmma_owner
sudo -u postgres createuser --login --pwprompt gedmma_app
sudo -u postgres createdb -O gedmma_owner gedmma
sudo -u postgres psql -d gedmma -c 'GRANT USAGE ON SCHEMA public TO gedmma_app;'
cp .env.example .env      # zet de wachtwoorden erin
npm run dev
```

Uitgebreide instructies staan in [docs/deployment.md](docs/deployment.md).

Wil je hem online zetten zodat iemand anders kan meekijken — een accountant, een
eerste klant — dan staat de route van niets naar een werkende omgeving op je
eigen domein in [docs/testomgeving.md](docs/testomgeving.md). Het testscript dat
je zo iemand meegeeft, staat in
[docs/testscript-accountant.md](docs/testscript-accountant.md).

## Wat werkt er nu

| Onderdeel | Status |
| --- | --- |
| Aanmelden, tweestapsverificatie (TOTP), herstelcodes, sessiebeheer | werkend |
| Organisaties, administraties, rollen, rechten, uitnodigingen | werkend |
| Nederlands rekeningschema voor zzp, bv, stichting en vereniging | werkend |
| Double-entry engine met onveranderbare boekingen en tegenboekingen | werkend |
| Klanten en leveranciers, met dubbeldetectie | werkend |
| Offertes, facturen, creditnota's, pdf, UBL, e-mailverzending | werkend |
| Inkoopfacturen en bonnen met documentarchief | werkend |
| Bankimport (CSV, MT940, CAMT.053), matching met motivatie, reconciliatie | werkend |
| Btw-overzicht met aansluitcontrole en ICP-overzicht | werkend |
| Balans, winst-en-verlies, saldibalans, grootboek, journaal, ouderdomsanalyse | werkend |
| Audit trail met hash-ketting en controlefunctie | werkend |
| Webapp in nl/en/de/fr, donkere modus, mobiel bruikbaar | werkend |
| OCR, AI-boekingsvoorstellen | fase 2, zie [roadmap](docs/roadmap.md) |
| PSD2-bankkoppeling, Peppol, betaalproviders | fase 3, vereist een vergunninghoudende partij |
| Mobiele apps, accountantsportaal, jaarafsluiting, voorraad | fase 3 en 4 |

Wat er nog niet is, staat ook zo in de interface. Een tijdelijke oplossing wordt
nergens als werkende functionaliteit gepresenteerd.

## Structuur

```
apps/
  api/       modulaire monoliet: HTTP, domeinmodules, migraties, taken
  web/       webapp (Vite + React) met eigen design system
  webscan/   bestaand product Webscan NL, ongewijzigd
packages/
  money/       exacte bedragen; geen floating point
  accounting/  double-entry rekenkern, btw, rekeningschema's; geen I/O
  i18n/        vertalingen (nl/en/de/fr) en locale-bewuste opmaak
docs/        ontwerp, security, privacy en compliance
docker/      Dockerfiles en nginx-configuratie
scripts/     dev, test, typecheck en lint over de hele monorepo
```

## Commando's

| Commando | Wat het doet |
| --- | --- |
| `npm run dev` | Database controleren, migreren, seeden en API + webapp starten |
| `npm test` | Alle tests van alle pakketten |
| `npm run test:unit` | Alleen de rekenkern (snel) |
| `npm run test:api` | API-tests tegen een echte PostgreSQL |
| `npm run test:e2e` | End-to-end in een echte browser |
| `npm run typecheck` | TypeScript strict over de hele monorepo |
| `npm run lint` | ESLint, inclusief de huisregels |
| `npm run db:migrate` | Openstaande migraties uitvoeren |
| `npm run db:seed` | Rechten, rollen en valuta klaarzetten |
| `npm run build` | Productiebundel van de webapp |
| `npm run proefrit` | De proefrit van Webscan NL (het andere product) |

## Hoe het in elkaar zit

* **Bedragen zijn exact.** Een bedrag is nooit een `number`. In de database staat
  `NUMERIC`, in de applicatie een `Money` met een `bigint` in centen. Een
  lint-regel weigert elke floating-pointberekening op een bedrag.
* **Boekingen zijn onveranderbaar.** Definitief is definitief; corrigeren gaat
  met een tegenboeking die naar het origineel verwijst. De database bewaakt dat
  met triggers, niet alleen de applicatiecode.
* **Tenantisolatie zit op drie lagen.** De HTTP-laag controleert het
  lidmaatschap, de servicelaag zet de tenantcontext in de databasesessie, en
  PostgreSQL row-level security weigert alles daarbuiten. Zonder context levert
  elke query nul rijen op.
* **Rapportages lezen alleen uit het grootboek.** Er is geen tweede administratie
  van saldi, dus "het rapport klopt niet met de boekhouding" kan structureel niet.
* **AI beslist niet.** Voorstellen krijgen een motivatie en een
  betrouwbaarheidsscore; een mens bevestigt. Elk voorstel wordt volledig
  geregistreerd.

Meer: [architectuur](docs/architecture.md) · [boekhoudkern](docs/accounting-engine.md) ·
[datamodel](docs/data-model.md) · [beveiliging](docs/security.md) ·
[beslissingen](docs/decision-log.md)

## Testen

```bash
npm test          # alles
npm run test:e2e  # in een echte browser, op desktop en telefoonformaat
```

De tests draaien tegen een echte PostgreSQL en een echte browser; er wordt niets
gemockt. Naast de gewone unit- en integratietests zitten er property-based
tests op de rekenkern, tenantisolatietests die actief proberen bij een andere
tenant te komen, en het volledige scenario uit de opdracht van onderneming tot
audit trail. Zie [docs/testing.md](docs/testing.md).

## Privacy en compliance

Financiële gegevens zijn zowel bedrijfsinformatie als persoonsgegevens. Het
product is ontworpen volgens privacy by design en privacy by default: geen
tracking, geen modeltraining op klantdata, minimale logging, en bewaartermijnen
die de fiscale bewaarplicht respecteren.

**Belangrijk:** nergens in dit project staat de claim dat het product "volledig
AVG-proof" of "100% compliant" is. Wat er technisch is geïmplementeerd, wat de
exploitant organisatorisch moet doen en wat juridisch nog moet worden getoetst,
staat per verplichting uit elkaar getrokken in
[docs/compliance-matrix.md](docs/compliance-matrix.md).

## Licentie en herkomst

SnelStart is uitsluitend als functionele maatstaf gebruikt. Er is geen broncode,
databaseontwerp, schermontwerp, tekst, icoon, vormgeving of merk overgenomen;
product, merk, interface en architectuur zijn volledig eigen werk.
