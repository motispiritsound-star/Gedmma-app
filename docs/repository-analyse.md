# Aangetroffen repository

*Onderzocht op 2026-08-30, commit `d77ac00`.*

## Samenvatting

De repository `motispiritsound-star/Gedmma-app` bevatte **geen boekhoudsoftware**.
Er stond een compleet, werkend en zorgvuldig gebouwd ander product in: **Webscan NL**,
een leadgeneratietool die websites van Nederlandse bedrijven scant, per site een
cijfer geeft, ze op een kaart zet en de opvolging door een salesteam ondersteunt.

### Wat er stond

| Onderdeel | Inhoud |
| --- | --- |
| `src/cli.ts` | Commander-CLI: `import`, `scan`, `serve`, `verrijken`, `gebruiker`, `aanbod` |
| `src/sources/` | Bedrijfsbronnen: OpenStreetMap (Overpass), KVK Zoeken/Basisprofiel, CSV |
| `src/scan/` | HTTP-fetcher met robots.txt-respect, techniekdetectie, contactpagina-analyse, geocoding |
| `src/score/` | Scoreregels voor sitekwaliteit, "levenstekenen" van een bedrijf en leadprioriteit |
| `src/db/` | SQLite via `node:sqlite`, genummerde migraties, teams, pipeline, prognose, nieuws |
| `src/report/` | Leadrapport, mailsjablonen, pitch, export |
| `src/server/` | Express-dashboard met kaart (TopoJSON), sessie-login, rolgebaseerde toegang |
| `demo/` | Proefrit die 3.000 nagemaakte bedrijfssites opzet en echt scant |
| `test/` | Eigen testrunner met fixtureserver, ~40 controles |
| `tools/` | Kaartgenerator en benchmark |

Omvang: circa 8.800 regels TypeScript.

### Technische kenmerken van het bestaande werk

* Node 22 met **native TypeScript-uitvoering** (type stripping), dus geen buildstap.
* `tsconfig.json` met `strict`, `verbatimModuleSyntax` en `erasableSyntaxOnly`.
* **Nul runtime-frameworks** buiten Express, Commander en Cheerio.
* Handgeschreven, genummerde databasemigraties met `PRAGMA user_version`.
* Nederlandstalige code, commentaar en documentatie.
* Uitgebreide, leesbare README (35 kB) met echte gebruiksinstructies.
* Zorgvuldige omgang met regels: robots.txt, belregels per rechtsvorm,
  niet-benaderen-lijst, kostenwaarschuwing bij betaalde KVK-bevragingen.

## Oordeel over herbruikbaarheid

| Onderdeel | Herbruikbaar voor het boekhoudplatform? |
| --- | --- |
| Domeinlogica (scan, score, leads) | Nee — andere bedrijfstak |
| Datamodel | Nee — geen enkele overlap met een grootboek |
| Express-serverlaag | Als patroon, niet als code |
| Migratiepatroon (genummerd, nooit wijzigen) | **Ja, overgenomen** in de Postgres-migratierunner |
| Testaanpak (echte fixtureserver, geen mocks) | **Ja, overgenomen** in de API-integratietests |
| Codestijl: Nederlands, zonder framework-magie, uitlegbaar | **Ja, overgenomen** als huisstijl |
| Zorgvuldigheid rond juridische randvoorwaarden | **Ja, overgenomen** en uitgebreid |

## Wat er met het bestaande product is gebeurd

Niets is verwijderd of herschreven. Webscan NL is met `git mv` verplaatst naar
`apps/webscan/` en is daar een zelfstandig workspace-pakket (`@gedmma/webscan`).
Alle gedocumenteerde commando's blijven werken:

```bash
npm run proefrit                  # vanuit de root
npm run -w @gedmma/webscan test   # eigen testsuite, ongewijzigd groen
```

De enige inhoudelijke wijziging in de code is dat `apps/webscan/start.js` zijn
ingang nu naast zichzelf zoekt in plaats van in de werkmap, zodat het commando
ook vanuit de repository-root werkt.

## Ontwikkelomgeving

| Onderdeel | Bevinding |
| --- | --- |
| Node | v22.22.2 (voldoet aan de eis `>=22.18`) |
| npm | 10.9.7, registry bereikbaar |
| PostgreSQL | 16.13 lokaal beschikbaar (cluster `16/main`, poort 5432) |
| Docker | client aanwezig, daemon niet actief in deze omgeving |
| Chromium | aanwezig via `/opt/pw-browsers` (bruikbaar voor Playwright-e2e) |

Omdat de Docker-daemon hier niet draait, is de ontwikkelomgeving zo gebouwd dat
zij **zonder** Docker werkt op een lokale PostgreSQL, terwijl `docker-compose.yml`
wel wordt meegeleverd voor machines waar Docker wel beschikbaar is.
