# Technische en organisatorische maatregelen

Deze lijst hoort als bijlage bij de verwerkersovereenkomst. Per maatregel staat
of hij **in de software zit** (en waar), of dat hij **door de exploitant moet
worden ingericht**.

## Toegangsbeveiliging

| Maatregel | Status | Waar |
| --- | --- | --- |
| Wachtwoorden gehasht met scrypt, per gebruiker salt en een server-side pepper | in de software | `apps/api/src/auth/wachtwoord.ts` |
| Wachtwoordbeleid: minimaal 12 tekens, controle op veelgebruikte wachtwoorden | in de software | idem |
| Tweestapsverificatie (TOTP) met herstelcodes | in de software | `apps/api/src/auth/totp.ts` |
| Passkeys (WebAuthn) | fase 2 | credentialmodel is er al |
| Sessies alleen als hash opgeslagen, serverzijdig intrekbaar | in de software | `session.token_hash` |
| Sessieduur en inactiviteitstermijn instelbaar | in de software | `SESSION_MAX_HOURS`, `SESSION_IDLE_MINUTES` |
| Rotatie van sessies bij een rechtenwijziging | in de software | `wijzigRol()` trekt sessies in |
| Apparaatoverzicht en op afstand afmelden | in de software | `/auth/sessions` |
| Brute-forcebescherming per account en per IP | in de software | `apps/api/src/http/ratelimit.ts` |
| Rollen en fijnmazige rechten | in de software | `permission`, `role_permission` |
| Functiescheiding bij betalingen | in de software (rechtenmodel) | `betaling.voorbereiden` en `betaling.goedkeuren` gescheiden |
| Toegang met einddatum voor externe adviseurs | in de software | `administration_access.geldig_tot` |
| Impersonatie alleen met toestemming, tijdslimiet en logging | ontwerp aanwezig, fase 2 | `session.support_user_id`, `support_tot` |
| Toegangsreview elk kwartaal | door de exploitant | procedure |

## Tenantisolatie

| Maatregel | Status | Waar |
| --- | --- | --- |
| Row-level security op elke tabel met een administratie-scope | in de software | migratie 005 |
| `FORCE ROW LEVEL SECURITY`, dus ook de eigenaar is gebonden | in de software | idem |
| Applicatierol zonder `BYPASSRLS` en zonder `SUPERUSER` | in de software, te bewaken bij inrichting | test in `tenant-isolatie.test.ts` |
| Tenantcontext transactie-lokaal, dus geen lekkage via een hergebruikte verbinding | in de software | `inTransactie()` |
| Faalstand is "niets zien" in plaats van "alles zien" | in de software | policy zonder context levert nul rijen |
| Geautomatiseerde isolatietests, inclusief metatest op nieuwe tabellen | in de software | `apps/api/test/tenant-isolatie.test.ts` |

## Versleuteling

| Maatregel | Status |
| --- | --- |
| TLS voor alle verbindingen, HSTS in productie | door de exploitant (reverse proxy), header in de software |
| Versleuteling van de opslag | door de exploitant (hoster) |
| Kolomversleuteling (AES-256-GCM) voor MFA-secrets en tokens | in de software (`apps/api/src/util/crypto.ts`) |
| Sleutelversie in elk versleuteld veld, zodat rotatie kan zonder downtime | in de software |
| Sleutels in een secrets manager, niet in de repository | door de exploitant |
| Rotatie van sleutels en secrets | door de exploitant, procedure |

## Onveranderbaarheid en controleerbaarheid

| Maatregel | Status | Waar |
| --- | --- | --- |
| Definitieve boekingen onveranderbaar, afgedwongen door de database | in de software | trigger `journal_entry_onveranderbaar` |
| Regels van een definitieve boeking onveranderbaar | in de software | trigger `journal_line_onveranderbaar` |
| Boeking altijd in balans, minimaal twee regels, binnen een open periode | in de software | trigger `journal_entry_controleer` |
| Append-only audit trail, geen UPDATE/DELETE-recht voor de applicatie | in de software | migratie 001 en `REVOKE` |
| Hash-ketting over de audit trail, met controlefunctie | in de software | `controleerKetting()` |
| Documentnummers uniek en opeenvolgend, ook bij gelijktijdigheid | in de software | `number_sequence` met rijvergrendeling |

## Invoer en uitvoer

| Maatregel | Status |
| --- | --- |
| Schemavalidatie op elke request, onbekende velden geweigerd | in de software (`zod`) |
| Uitsluitend geparametriseerde query's | in de software, lint-regel op de routelaag |
| Bestandsvalidatie op type én magic bytes, met maximale grootte | in de software |
| Opslagsleutels zijn gegenereerde UUID's; geen path traversal mogelijk | in de software |
| Virusscan van uploads | door de exploitant (adapter voorzien) |
| Content Security Policy zonder `unsafe-inline` voor scripts | in de software en nginx |
| CSRF-bescherming via `SameSite` en Origin-controle | in de software |
| SSRF-bescherming op uitgaande verzoeken | fase 3, bij webhooks en adapters |
| Rate limiting per IP, gebruiker en endpoint | in de software |
| Idempotency keys op schrijvende endpoints | in de software |
| Optimistic locking op wijzigbare bronnen | in de software |

## Logging en monitoring

| Maatregel | Status |
| --- | --- |
| Gestructureerde logging met automatische maskering van gevoelige velden | in de software |
| Geen wachtwoorden, tokens of documentinhoud in logs | in de software, met test |
| Auditlogging van aanmeldingen, rechten, exports, downloads, bankkoppelingen, privacyinstellingen en AI-verwerkingen | in de software |
| Metrics en health checks | in de software |
| Alarmering op foutratio, wachtrijachterstand en mislukte aanmeldingen | door de exploitant |
| Monitoring op verdachte exports en inlogpogingen | deels in de software (audit), alarmering door de exploitant |

## Continuïteit

| Maatregel | Status |
| --- | --- |
| Back-ups met point-in-time recovery | door de exploitant, zie [disaster-recovery.md](disaster-recovery.md) |
| Kwartaalhersteltest met vastgelegde uitkomst | door de exploitant |
| Verwijderings- en beperkingsregels opnieuw uitvoeren na herstel | procedure, ondersteund door de software |
| Zero-downtime uitrollen | in de opzet, zie [deployment.md](deployment.md) |

## Ontwikkelproces

| Maatregel | Status |
| --- | --- |
| Gescheiden ontwikkel-, test-, acceptatie- en productieomgeving | door de exploitant |
| Geen productiedata buiten productie | procedure, en synthetische data in de tests |
| Code review op elke wijziging | door de exploitant |
| Automatische tests, linting en typecheck in CI | in de repository |
| Dependency-scanning, secret scanning en statische analyse in CI | in de repository |
| Containerscan op kwetsbaarheden | in de repository |
| Vastgezette versies en `--ignore-scripts` in CI | in de repository |
| Penetratietest vóór productie en daarna jaarlijks | door de exploitant |
| Responsible disclosure met `security.txt` | door de exploitant |

## Organisatorisch

| Maatregel | Status |
| --- | --- |
| Geheimhoudingsverklaring voor iedereen met toegang | door de exploitant |
| Bewustwordingstraining, jaarlijks | door de exploitant |
| Least privilege bij interne toegang | door de exploitant |
| Onboarding- en offboardingprocedure | door de exploitant |
| Leveranciersbeoordeling vóór contractering | door de exploitant |
| Incident- en datalekprocedure, jaarlijks geoefend | procedure aanwezig, oefening door de exploitant |
| Verwerkersovereenkomsten met alle subverwerkers | door de exploitant |
