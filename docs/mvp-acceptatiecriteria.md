# Acceptatiecriteria MVP

Elk criterium is een testbare uitspraak. De kolom "Bewijs" verwijst naar de test
of het commando dat het aantoont. De MVP is pas gereed als alles op groen staat.

| # | Criterium | Bewijs |
| --- | --- | --- |
| 1 | Een gebruiker kan zich veilig aanmelden | `apps/api/test/auth.test.ts` |
| 2 | MFA (TOTP) kan worden ingesteld en is daarna vereist | `apps/api/test/auth.test.ts` (`mfa`) |
| 3 | Een organisatie en administratie kunnen worden aangemaakt | `apps/api/test/scenario.test.ts` stap 1 |
| 4 | Tenantdata is aantoonbaar geïsoleerd | `apps/api/test/tenant-isolatie.test.ts` |
| 5 | Elke tabel met `administration_id` heeft een RLS-policy | `apps/api/test/tenant-isolatie.test.ts` (metatest) |
| 6 | Een Nederlands basisrekeningschema is beschikbaar | `apps/api/test/scenario.test.ts` stap 1 |
| 7 | Klanten en leveranciers kunnen worden beheerd | `apps/api/test/scenario.test.ts` stap 2 |
| 8 | Een verkoopfactuur kan worden gemaakt, definitief gemaakt, als pdf gegenereerd en verzonden | `apps/api/test/scenario.test.ts` stap 3 |
| 9 | Een inkoopfactuur inclusief document kan worden geregistreerd | `apps/api/test/inkoop.test.ts` |
| 10 | Banktransacties kunnen worden geïmporteerd (CSV, MT940, CAMT.053) | `apps/api/test/bank-import.test.ts` |
| 11 | Betalingen kunnen aan facturen worden gekoppeld, ook gedeeltelijk | `apps/api/test/scenario.test.ts` stap 5-6 |
| 12 | Alle transacties veroorzaken correcte dubbele boekingen | `apps/api/test/scenario.test.ts` stap 7 + `packages/accounting` property-tests |
| 13 | Definitieve boekingen kunnen niet stilzwijgend worden aangepast | `apps/api/test/onveranderbaarheid.test.ts` |
| 14 | Balans en winst-en-verliesrekening worden correct berekend | `apps/api/test/rapportage.test.ts` |
| 15 | Een btw-overzicht is beschikbaar en sluit aan op het grootboek | `apps/api/test/btw.test.ts` |
| 16 | Elk rapport kan doorklikken naar transacties en documenten | `apps/api/test/rapportage.test.ts` (`drill-down`) |
| 17 | Rollen en rechten functioneren | `apps/api/test/autorisatie.test.ts` |
| 18 | Alle kritieke gebeurtenissen staan in de audit trail | `apps/api/test/audit.test.ts` |
| 19 | De belangrijkste processen zijn end-to-end getest | `apps/api/test/scenario.test.ts` + `apps/web` Playwright-suite |
| 20 | De applicatie start lokaal met één duidelijke opdracht | `npm run dev` (zie README) |
| 21 | Geen kritieke lint-, typecheck-, test- of securityfouten | `npm run lint && npm run typecheck && npm test` |
| 22 | Installatie- en gebruiksinstructies zijn gedocumenteerd | `README.md`, `docs/deployment.md` |

## Aanvullende criteria uit de opdracht

| # | Criterium | Bewijs |
| --- | --- | --- |
| 23 | Creditnota's, deelbetalingen, vreemde valuta, btw-verlegd, gesloten perioden, dubbele documenten en foutieve imports zijn getest | `apps/api/test/randgevallen.test.ts` |
| 24 | Bedragen gebruiken nergens floating point | `packages/money` property-tests + lint-regel |
| 25 | Documentnummers zijn uniek en opeenvolgend, ook onder gelijktijdigheid | `apps/api/test/nummerreeks.test.ts` |
| 26 | De webapp voldoet aan WCAG 2.2 AA op de kernschermen | `apps/web` a11y-tests + handmatige controle |
| 27 | De UI is beschikbaar in nl, en, de en fr zonder hardcoded teksten | `apps/web/test/i18n.test.ts` |
| 28 | Rapportages zijn exporteerbaar (CSV, PDF) | `apps/api/test/rapportage.test.ts` |
| 29 | Er is een volledige machineleesbare export van een administratie | `apps/api/test/export.test.ts` |
| 30 | Privacy: logging bevat geen wachtwoorden, tokens of documentinhoud | `apps/api/test/logging.test.ts` |

## Wat expliciet níet in de MVP zit

Om te voorkomen dat een tijdelijke oplossing als productiefunctionaliteit wordt
gepresenteerd, staat hier wat er nog niet is. De gebruikersinterface zegt dit
op de betreffende plek ook zelf.

* OCR van bonnen — fase 2.
* AI-boekingsvoorstellen — fase 2 (de datamodellering en registratie zijn er wel).
* PSD2-bankkoppelingen — fase 3 (import via bestand werkt volledig).
* Peppol-verzending — fase 3 (UBL-bestand wordt wel gegenereerd).
* Btw-aangifte indienen — fase 4 (het overzicht en de aansluiting zijn er wel).
* Mobiele apps — fase 3.
* Accountantsportaal — fase 4.
* Voorraad, vaste activa, jaarafsluiting, consolidatie — fase 4.
