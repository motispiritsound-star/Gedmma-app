# Risico's

Score = kans x impact, op een schaal van 1 (laag) tot 5 (hoog).

## Technische risico's

| # | Risico | K | I | Score | Beheersing |
| --- | --- | --- | --- | --- | --- |
| T1 | Tenantlek via vergeten `WHERE`-clausule | 3 | 5 | 15 | RLS als tweede slot; metatest die elke tabel met `administration_id` op een policy controleert; isolatietests per tabel |
| T2 | Afrondingsfout in bedragen | 3 | 5 | 15 | Geen floats; `Money` met bigint minor units; `allocate` voor verdelingen; property-based tests op som-invarianten |
| T3 | Rapport sluit niet aan op grootboek | 2 | 5 | 10 | Rapportage leest alleen `journal_line`, geen tweede saldo-administratie; aansluitingstest per rapport |
| T4 | Dubbele boeking bij herhaalde request | 3 | 4 | 12 | Idempotency keys op schrijvende endpoints; `dedupe_hash` op banktransacties; unieke index op leveranciersfactuurnummer |
| T5 | Documentnummer met gaten of duplicaten | 3 | 4 | 12 | `number_sequence` met rijvergrendeling in dezelfde transactie als de boeking; unieke index |
| T6 | Prestatieval bij grote administraties | 3 | 3 | 9 | Performancebudgetten in CI op een geseede administratie van 100.000 regels; verplichte paginering; gerichte indexen |
| T7 | Migratie loopt vast op productiedata | 2 | 5 | 10 | Alleen voorwaartse, nooit gewijzigde migraties; migratie draait apart van de app; dry run op een kopie; rollbackplan per release |
| T8 | Afhankelijkheid met kwetsbaarheid of kwaadaardige update | 3 | 4 | 12 | Kleine dependencyset, vastgezette versies, `npm audit` en scanning in CI, `--ignore-scripts` in CI |
| T9 | Verlies van gegevens | 1 | 5 | 5 | PITR, kwartaalhersteltest met vastgelegde uitkomst, back-ups versleuteld en apart bewaard |
| T10 | Node native TypeScript-uitvoering verandert van gedrag | 2 | 3 | 6 | Node-versie vastgelegd in `engines` en in de container; typecheck met `tsc` los van de runtime |
| T11 | AI-provider levert onjuist boekingsvoorstel | 4 | 3 | 12 | Voorstel is nooit een boeking; menselijke bevestiging verplicht; betrouwbaarheidsdrempel; volledige registratie |
| T12 | Objectopslag onbereikbaar bij factuurverzending | 2 | 3 | 6 | PDF-generatie is een taak met retries; factuurstatus wordt pas `sent` na bevestigde verzending |

## Juridische en compliance-risico's

| # | Risico | K | I | Score | Beheersing |
| --- | --- | --- | --- | --- | --- |
| J1 | Btw-regels wijzigen en de software rekent verouderd | 4 | 4 | 16 | Tarieven en vakken zijn data met `valid_from`/`valid_to`; bronregister met herbeoordelingsdatum; nooit hardcoded |
| J2 | Verwijderverzoek botst met de fiscale bewaarplicht | 4 | 4 | 16 | Onderscheid tussen verwijderen, pseudonimiseren, beperken en afschermen; legal hold; gemotiveerde gedeeltelijke weigering |
| J3 | Persoonsgegevens naar een AI- of OCR-provider zonder grondslag | 3 | 5 | 15 | Standaard uit; redactie en dataminimalisatie; per tenant instelbaar; verwerkersovereenkomst en subverwerkersregister |
| J4 | Doorgifte buiten de EER via een subverwerker | 3 | 4 | 12 | Voorkeur voor NL/EER-hosting; Transfer Impact Assessment; SCC's; controle op back-ups, telemetrie en supporttoegang |
| J5 | Platform lijkt een betaaldienst aan te bieden | 2 | 5 | 10 | Geen betaalinitiatie zonder vergunninghoudende partij; duidelijke rolverdeling in de UI en de voorwaarden |
| J6 | Onterechte claim "volledig AVG-proof" | 3 | 3 | 9 | Verboden formulering; alleen aantoonbare bewoordingen; complianceclaims met bron, versie en datum |
| J7 | Factuur voldoet niet aan de wettelijke eisen | 2 | 4 | 8 | Factuurvereisten als validatieregels vóór definitief maken; bronverwijzing in het register |
| J8 | AI-verordening: onvoldoende transparantie of menselijk toezicht | 3 | 3 | 9 | Uitlegbaarheid, bezwaarmogelijkheid, geen zelfstandige besluiten met aanzienlijke gevolgen |
| J9 | Datalek zonder tijdige melding | 2 | 5 | 10 | Incidentregister, meldtermijnbewaking, verwerker informeert verantwoordelijke onverwijld; melding altijd na menselijke beoordeling |
| J10 | Klant verliest wettelijk verplichte administratie bij opzegging | 2 | 5 | 10 | Vooraf volledige export aanbieden; read-only-periode; verwijdering pas na bevestiging en termijn |
| J11 | Toegankelijkheid voldoet niet aan de wettelijke eis | 3 | 3 | 9 | WCAG 2.2 AA als bouwnorm, geautomatiseerde a11y-tests plus handmatige controle |

## Product- en organisatorische risico's

| # | Risico | K | I | Score | Beheersing |
| --- | --- | --- | --- | --- | --- |
| P1 | Scope te groot voor het team | 5 | 4 | 20 | Strikte fasering; fase 1 levert een aantoonbaar bruikbaar product; adapters in plaats van nabouwen |
| P2 | Migratie vanuit bestaande pakketten mislukt en houdt klanten tegen | 4 | 4 | 16 | Generiek migratieframework met dry run, deduplicatie en aansluitingsrapport; geen ongeautoriseerde toegang tot systemen van derden |
| P3 | Boekhouders vertrouwen automatische boekingen niet | 3 | 4 | 12 | Alles herleidbaar; voorstel-met-motivatie; correctie via tegenboeking altijd zichtbaar |
| P4 | Ondernemer begrijpt het alsnog niet | 3 | 4 | 12 | Gewone taal als bouwnorm; uitleg bij elke financiële term; gebruikerstests per fase |
