# Teststrategie

## Uitgangspunt

Tests draaien tegen echte onderdelen: een echte PostgreSQL, een echte
HTTP-server, een echte browser. Er wordt niets gemockt wat je ook echt kunt
draaien. Voor financiële software is dat het enige dat iets bewijst — een test
tegen een mock bewijst dat de mock werkt.

Deze aanpak is overgenomen uit het product dat al in deze repository stond: dat
draaide zijn scans tegen een echte fixtureserver in plaats van tegen nagemaakte
antwoorden.

## Wat er draait

```bash
npm test              # alles
npm run test:unit     # rekenkern; seconden
npm run test:api      # API tegen PostgreSQL
npm run test:e2e      # browser, desktop en telefoonformaat
```

| Soort | Waar | Aantal | Wat het bewijst |
| --- | --- | --- | --- |
| Unit | `packages/money` | 23 | Bedragen zijn exact; verdelen verliest geen cent |
| Property-based | `packages/money`, `packages/accounting` | in de bovenstaande | Invarianten gelden voor willekeurige invoer, niet alleen voor gekozen voorbeelden |
| Unit | `packages/accounting` | 57 | Journaalpost-invarianten, btw per regel, boekingspatronen, factuurvereisten |
| Unit | `packages/i18n` | 12 | Alle vier de talen compleet, opmaak per taal |
| Integratie | `apps/api/test` | 114 | Alles hierboven, maar dan door de echte API en database |
| Component | `apps/web/test` | 17 | Toegankelijkheid van het design system, geen vaste teksten |
| End-to-end | `apps/web/e2e` | 13 | Het echte scherm in een echte browser, ook op telefoonformaat |

## De testsoorten uit de opdracht

| Gevraagd | Waar |
| --- | --- |
| Unit tests | `packages/*/test`, `apps/api/test` |
| Integratietests | `apps/api/test/*.test.ts` (echte database) |
| API-contracttests | `apps/api/test/scenario.test.ts` controleert statuscodes, foutcodes en velden |
| Database-integriteitstests | `apps/api/test/randgevallen.test.ts` (triggers, constraints) |
| Accounting invariant tests | `packages/accounting/test/journaalpost.test.ts` |
| Property-based tests | `packages/money/test`, `packages/accounting/test` |
| Tenantisolatietests | `apps/api/test/tenant-isolatie.test.ts`, inclusief metatest |
| Autorisatietests | `apps/api/test/autorisatie.test.ts` |
| Securitytests | Onderdeel van de bovenstaande twee, plus `npm audit` en CodeQL in CI |
| End-to-end | `apps/web/e2e` |
| Regressietests | Elke gevonden fout krijgt een test; zie de commitgeschiedenis |
| Snapshots van rapporten | Expliciete verwachtingen in `apps/api/test/rapportage-achtige` tests; bewust geen automatische snapshots, die verbergen wijzigingen |
| Import- en exporttests | `apps/api/test/importers.test.ts`, `randgevallen.test.ts` |
| Toegankelijkheidstests | `apps/web/test/ontwerp.test.tsx` en de e2e-toetsenbordtest |
| Performance- en loadtests | Budgetten in `docs/architecture.md`; meting in CI staat op de roadmap voor fase 2 |

## Het scenario uit de opdracht

`apps/api/test/scenario.test.ts` loopt de tien stappen na, in volgorde, tegen een
verse database:

1. een nieuwe onderneming aanmaken (met rekeningschema, btw-codes, perioden);
2. een klant toevoegen (inclusief dubbeldetectie);
3. een factuur met btw maken, definitief maken, als pdf genereren en versturen;
4. een bankbetaling importeren;
5. de betaling automatisch laten voorstellen;
6. de betaling koppelen en de factuur als betaald zien;
7. de dubbele boekingen controleren, regel voor regel;
8. het btw-overzicht controleren, inclusief aansluiting op het grootboek;
9. de winst-en-verliesrekening en de balans controleren;
10. de audit trail bekijken en de hash-ketting verifiëren.

`apps/api/test/randgevallen.test.ts` doet de gevallen waar het in de praktijk
misgaat: creditnota's, deelbetalingen, betalingsverschillen, btw-verlegd,
intracommunautaire leveringen, gesloten perioden, dubbele leveranciersfacturen,
onleesbare bankbestanden, nummerreeksen onder gelijktijdigheid en vreemde valuta.

## Property-based testen

De rekenkern wordt niet alleen op voorbeelden getest maar op willekeurige
invoer, met `fast-check`. De invarianten die zo worden bewaakt:

* optellen en aftrekken zijn elkaars omgekeerde;
* een bedrag verdelen over willekeurige verhoudingen verliest nooit een cent;
* elke journaalpost die door `bouwPost()` komt, is in balans;
* elke willekeurige verstoring van een post wordt geweigerd;
* omkeren van een post behoudt de balans;
* btw per regel telt exact op tot het factuurtotaal;
* de som van de btw-groepen is altijd het btw-totaal.

## Tenantisolatie

Twee onafhankelijke organisaties, en de vraag: kan de een bij de gegevens van de
ander? Via de API (elke lijst, elk detail, elke schrijfactie) én rechtstreeks op
de databaseverbinding met de context van de andere tenant.

De belangrijkste test is de metatest: die leest uit `pg_class` welke tabellen een
`administration_id` hebben en faalt als er ook maar één zonder row-level
security-policy is. Een nieuwe tabel zonder policy laat dus de build vallen.

## Definition of Done

Een functie is pas klaar als:

* frontend en backend werken;
* databasewijzigingen zijn gemigreerd;
* rechten en tenantisolatie zijn toegepast;
* invoer wordt gevalideerd;
* fouten worden afgehandeld met een begrijpelijke melding;
* auditlogging is toegevoegd waar het telt;
* er tests zijn geschreven;
* toegankelijkheid is gecontroleerd;
* de documentatie is bijgewerkt;
* lint, typecheck en tests slagen;
* er geen tijdelijke oplossing als werkende functionaliteit wordt gepresenteerd.

## Wat de tests onderweg hebben gevonden

Ter illustratie dat de suite werkt en niet alleen groen kleurt:

| Fout | Gevonden door |
| --- | --- |
| `ORDER BY` sorteerde op de tekst-alias, waardoor de hash-ketting bij tien of meer regels leek te breken | audit trail-test in het scenario |
| `jsonb` herordent sleutels, waardoor de hash na een rondje door de database niet meer klopte | dezelfde test |
| Een tegenboeking probeerde zichzelf achteraf bij te werken, terwijl definitieve posten onveranderbaar zijn | randgevallen-test |
| Een lege bedragkolom in een CSV werd stilzwijgend nul | importer-test |
| De valutacode zat vastgeplakt aan het IBAN in een MT940-regel | importer-test |
| Het openstaande bedrag in de facturenlijst werd met floating point berekend | lint-regel op bedragen |
| De kop paste niet op een telefoon, waardoor de pagina horizontaal schoof | mobiele e2e-test |
| De tabbalk lag achter de inhoud en was niet aanklikbaar | mobiele e2e-test |
