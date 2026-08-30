# Gap-analyse

Vergelijking tussen wat de repository bood, wat de markt (benchmark: SnelStart)
biedt en wat het gevraagde platform moet kunnen. SnelStart wordt uitsluitend
gebruikt als **functionele maatstaf**: er is geen broncode, schermontwerp,
databaseontwerp, tekst, icoon of merk overgenomen.

Legenda: **A** = aanwezig, **N** = niet aanwezig, **M** = MVP (fase 1),
**F2..F5** = latere fase.

## 1. Fundament

| Onderwerp | Repository | Nodig | Gat | Plan |
| --- | --- | --- | --- | --- |
| Monorepo-structuur | N (enkele app) | Ja | Groot | M |
| Meertalige UI | N (alleen NL, hardcoded) | NL/EN/DE/FR | Groot | M (framework) / F2 (volledige vertalingen) |
| Multi-tenant | N (één installatie, één team) | Organisaties + administraties | Zeer groot | M |
| PostgreSQL | N (SQLite) | Ja | Groot | M |
| Rollen en rechten | Gedeeltelijk (eigenaar/agent) | Fijnmazig, per administratie | Groot | M |
| MFA | N | Ja | Groot | M |
| Auditlog | N | Append-only, wettelijk relevant | Groot | M |
| Achtergrondtaken | N | Ja | Groot | M (Postgres-queue) / F3 (Redis) |
| Objectopslag | N | S3-compatible | Groot | M (adapter + lokale driver) |

## 2. Boekhoudkundige kern

| Onderwerp | Repository | Gat | Plan |
| --- | --- | --- | --- |
| Double-entry engine | Ontbreekt volledig | Zeer groot | M |
| Rekeningschema NL | Ontbreekt | Zeer groot | M |
| Boekjaren en perioden | Ontbreekt | Zeer groot | M |
| Periodeafsluiting | Ontbreekt | Groot | M |
| Onveranderbare grootboekregels | Ontbreekt | Groot | M |
| Correctie- en tegenboekingen | Ontbreekt | Groot | M |
| Documentnummerreeksen | Ontbreekt | Groot | M |
| Vreemde valuta + koersverschillen | Ontbreekt | Groot | M (model) / F2 (herwaardering) |
| Kostenplaatsen/-dragers | Ontbreekt | Middel | F2 |
| Gebroken boekjaren | Ontbreekt | Middel | M |
| Accruals / transitorische posten | Ontbreekt | Middel | F2 |
| Vaste activa en afschrijving | Ontbreekt | Middel | F4 |

## 3. Functionele modules (benchmark SnelStart)

| Module | Benchmark biedt | Gedmma-plan |
| --- | --- | --- |
| Dashboard | Kerncijfers, openstaande posten | M basis, F2 widgets + AI-acties |
| Verkoopfacturen | Offerte → order → factuur, herinneringen, UBL | M (offerte/factuur/creditnota/PDF/UBL/e-mail), F2 (periodiek, aanmaningen), F3 (Peppol) |
| Inkoop en bonnen | Scan-en-herken, goedkeuring | M (upload + handmatig boeken), F2 (OCR + AI-voorstellen + workflow) |
| Bankieren | PSD2-koppeling, regels, reconciliatie | M (CSV/MT940/CAMT-import + matching + regels), F3 (PSD2-adapters) |
| Relatiebeheer | Klanten, leveranciers, condities | M |
| Voorraad | Artikelen, mutaties, waardering | F4 |
| Uren en projecten | Registratie, doorbelasting | M (projecten, uren, goedkeuring, factureren), F2 (weekstaat, timer, kilometers, declaraties) |
| Btw | Aangifte, ICP, suppletie | M (btw-overzicht + aansluiting), F2 (aangifteoverzicht + ICP), F4 (SBR-koppelpunt) |
| Rapportages | Balans, W&V, saldibalans, ouderdom | M (balans, W&V, saldibalans, grootboek, journaal, ouderdom), F2 (rest) |
| Jaarafsluiting | Checklist, beginbalans, auditfile | F4 |
| Accountantsportaal | Klantoverzicht, review | F4 |
| Import/migratie | Wizard, mapping | M (basis import), F2 (wizard met dry run/rollback) |
| Publieke API | Beperkt | M (intern) / F3 (publiek + webhooks) |
| Mobiel | App | F3 |
| Desktop | Windows-app | F5 |
| AI | Beperkt | F2 en verder, altijd met menselijke goedkeuring |

## 4. Waar Gedmma aantoonbaar beter moet worden

Deze punten zijn de reden van bestaan van het product en zijn daarom
meetbaar gemaakt in [mvp-acceptatiecriteria.md](mvp-acceptatiecriteria.md) en
[roadmap.md](roadmap.md):

1. **Taal.** Elk scherm legt in gewone taal uit wat er gebeurt; vakjargon is
   secundair en altijd van een uitleg voorzien.
2. **Herleidbaarheid.** Elk bedrag in elk rapport is doorklikbaar tot de
   journaalpost en het onderliggende document. Dat is in de MVP verplicht,
   niet later toegevoegd.
3. **Automatisering met controle.** AI en regels doen voorstellen; een mens
   bevestigt. Elk voorstel bewaart input, model, motivatie en uitkomst.
4. **Snelheid.** Performancebudgetten per scherm en per API, gemeten in CI.
5. **Openheid.** Volledige export in machineleesbaar formaat vanaf dag één,
   zodat overstappen nooit een technische drempel is.
6. **Privacy.** Privacy by default: geen tracking, geen modeltraining op
   klantdata, minimale logging.

## 5. Wat expliciet buiten de MVP valt

Deze onderdelen vragen een externe partij, certificering of vergunning en
worden daarom als adapter met duidelijke status opgeleverd, niet als
nagebouwde functionaliteit:

* PSD2-bankkoppelingen (vereist een vergunninghoudende AISP/PISP).
* Peppol-verzending (vereist een geaccrediteerde access point provider).
* SBR/Digipoort-aanlevering (vereist PKIoverheid-certificaat en aansluiting).
* Betaalverwerking (vereist een gecertificeerde PSP; geen kaartgegevens in Gedmma).
* Automatische incasso (vereist machtigingenbeheer en een bankcontract).
