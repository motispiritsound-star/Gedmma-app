# Installatie en deployment

## Omgevingen

| Omgeving | Doel | Gegevens |
| --- | --- | --- |
| Ontwikkel | Lokaal werken | Eigen testgegevens |
| Test | Automatische tests, ook in CI | Wordt bij elke run leeggegooid |
| Acceptatie | Laatste controle voor een release | **Synthetische gegevens**, nooit productiedata |
| Productie | Klanten | Echte gegevens, alleen toegankelijk via het gebruikelijke toegangsproces |

Productiedata gaat nooit naar een andere omgeving. Dat is niet alleen een
AVG-eis, het voorkomt ook dat een testfout een echte klant raakt.

## Lokaal, met Docker

```bash
cp .env.example .env
docker compose up -d db
npm install
npm run dev
```

## Lokaal, zonder Docker

```bash
sudo -u postgres createuser --login --pwprompt gedmma_owner   # eigenaar, mag DDL
sudo -u postgres createuser --login --pwprompt gedmma_app     # applicatie, geen DDL
sudo -u postgres createdb -O gedmma_owner gedmma
sudo -u postgres psql -d gedmma -c 'GRANT USAGE ON SCHEMA public TO gedmma_app;'

cp .env.example .env
# Zet DATABASE_URL en DATABASE_MIGRATION_URL met de wachtwoorden die je koos.
npm install
npm run dev
```

De applicatierol mag geen `BYPASSRLS` en geen `SUPERUSER` hebben. Een test
controleert dat:

```
apps/api/test/tenant-isolatie.test.ts → "de applicatierol mag row-level security niet omzeilen"
```

## De volledige stack in containers

```bash
docker compose up --build
```

* webapp op <http://localhost:8080>
* API op <http://localhost:4000>

De API-container draait als gebruiker `node`, bevat geen ontwikkeltooling en
heeft een health check. De webcontainer serveert de statische bundel achter
nginx, met de beveiligingsheaders uit [security.md](security.md).

## Instellingen

Alles staat in `.env.example`. De belangrijkste:

| Variabele | Betekenis |
| --- | --- |
| `DATABASE_URL` | Verbinding van de applicatie (rol zonder DDL) |
| `DATABASE_MIGRATION_URL` | Verbinding voor migraties (eigenaarsrol) |
| `DATABASE_APP_ROLE` | Naam van de applicatierol; de migraties geven die rechten |
| `PASSWORD_PEPPER` | Server-side pepper bovenop de per-gebruiker salt |
| `DATA_ENCRYPTION_KEY` | 32 bytes voor het versleutelen van MFA-secrets en tokens |
| `SESSION_MAX_HOURS` / `SESSION_IDLE_MINUTES` | Sessieduur |
| `STORAGE_DRIVER` | `lokaal` of `s3` |
| `MAIL_DRIVER` | `logboek` (niets versturen) of `smtp` |
| `TRUST_PROXY` | Aanzetten achter een reverse proxy, zodat het IP klopt |
| `RATE_LIMIT_FACTOR` | Verruiming voor ontwikkelen en tests; in productie genegeerd |

In productie faalt de start als `PASSWORD_PEPPER` of `DATA_ENCRYPTION_KEY`
ontbreekt. Dat is met opzet: stil doordraaien met een standaardsleutel is
gevaarlijker dan niet starten.

Genereer sleutels met:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Geheimen komen uit de secrets manager van de hoster, nooit uit een
compose-bestand of een repository.

## Migraties

```bash
npm run db:migrate
```

Regels:

1. Migraties draaien op volgorde van bestandsnaam.
2. Elke migratie draait precies één keer, in een eigen transactie.
3. **Een gedraaide migratie wordt nooit gewijzigd.** De runner bewaart een hash
   en weigert te starten als een bestaand bestand is aangepast. Een correctie is
   altijd een nieuwe migratie.
4. Migraties draaien met de eigenaarsrol, de applicatie met een rol zonder DDL.

Bij een release: eerst migreren, dan de nieuwe applicatieversie uitrollen.
Migraties moeten daarom **voorwaarts compatibel** zijn — de oude versie moet nog
even blijven werken. Een kolom verwijderen gaat in twee releases: eerst niet meer
gebruiken, in de volgende release weghalen.

## Zero-downtime uitrollen

1. Migratie draaien (voorwaarts compatibel).
2. Nieuwe containers erbij zetten; de load balancer stuurt pas verkeer als
   `/health/ready` groen is.
3. Oude containers krijgen `SIGTERM`; de API sluit de HTTP-server, stopt de
   taakverwerker en sluit de databaseverbindingen af.
4. Na een geslaagde uitrol: de opruimmigratie in de volgende release.

## Terugdraaien

| Situatie | Aanpak |
| --- | --- |
| Applicatiefout, schema ongewijzigd | Vorige image opnieuw uitrollen |
| Applicatiefout na een voorwaarts compatibele migratie | Vorige image opnieuw uitrollen; het schema blijft staan |
| Migratie zelf is fout | Nieuwe migratie die het herstelt; nooit een migratie terugdraaien op productie |
| Gegevensverlies | Point-in-time recovery, zie [disaster-recovery.md](disaster-recovery.md) |

Een migratie die niet voorwaarts compatibel is, hoort niet in een release.

## Health checks

| Endpoint | Betekenis |
| --- | --- |
| `/health/live` | Het proces leeft. Bij falen: herstarten. |
| `/health/ready` | Database bereikbaar en migraties geteld. Bij falen: geen verkeer sturen. |

## Observability

* **Logging**: JSON op stdout, één regel per gebeurtenis, met `requestId`,
  gebruiker en administratie. Persoonsgegevens worden gemaskeerd; wachtwoorden,
  tokens en documentinhoud komen er nooit in.
* **Metrics**: request-duur per route, boekingen per minuut, wachtrijlengte en
  foutratio.
* **Alarmering**: foutratio boven 1% gedurende vijf minuten, `/health/ready`
  rood, taken in de dead-letter-status, en achterstand in de taakwachtrij.

## CI/CD

`.github/workflows/ci.yml` draait bij elke push:

| Job | Inhoud |
| --- | --- |
| kwaliteit | Lint en typecheck |
| tests | Rekenkern, i18n, API tegen een echte PostgreSQL, webapp, Webscan |
| e2e | Playwright in een echte browser, desktop en telefoonformaat |
| beveiliging | `npm audit`, secret scanning, CodeQL |
| containers | Images bouwen en scannen op kwetsbaarheden |

`.github/workflows/release.yml` publiceert bij een tag `v*` de images naar de
container registry en stelt release-notities op.

### Versiebeheer

Semantische versies (`v1.4.2`) op de monorepo als geheel. De publieke API heeft
een eigen versie in het pad (`/api/v1`), los van de release-versie: een nieuwe
API-versie komt naast de oude te staan met minimaal twaalf maanden overlap.

## Back-ups

Zie [disaster-recovery.md](disaster-recovery.md) voor frequentie, retentie,
herstelprocedure en de kwartaalhersteltest.

## Productiechecklist

Doorlopen voordat er echte klantgegevens in gaan:

- [ ] `PASSWORD_PEPPER` en `DATA_ENCRYPTION_KEY` uit de secrets manager
- [ ] Applicatierol zonder `BYPASSRLS` en zonder `SUPERUSER`
- [ ] TLS afgedwongen, HSTS aan
- [ ] `TRUST_PROXY` correct gezet achter de load balancer
- [ ] Back-ups aan, hersteltest gedaan en vastgelegd
- [ ] Logging zonder persoonsgegevens gecontroleerd
- [ ] Alarmering ingesteld en getest
- [ ] Penetratietest uitgevoerd, bevindingen afgehandeld
- [ ] Verwerkersovereenkomst en subverwerkersregister gereed
- [ ] DPIA-screening afgerond, zie [dpia-screening.md](dpia-screening.md)
- [ ] Complianceregister bijgewerkt, zie [compliance-matrix.md](compliance-matrix.md)
