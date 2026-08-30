# Continuïteit

## Waar het om gaat

Een boekhoudpakket dat een dag uit de lucht is, is vervelend. Een boekhoudpakket
dat gegevens kwijtraakt, is een bestaansprobleem voor de klant: hij mist dan
administratie die hij wettelijk moet kunnen tonen. De prioriteit is daarom
**gegevensintegriteit boven beschikbaarheid**.

## Doelstellingen

| Meting | Doel | Toelichting |
| --- | --- | --- |
| RPO (maximaal gegevensverlies) | 15 minuten | Continue WAL-archivering |
| RTO (maximale hersteltijd) | 4 uur | Voor een volledige uitval |
| Beschikbaarheid | 99,5% per maand | Exclusief aangekondigd onderhoud |
| Aangekondigd onderhoud | buiten kantooruren, minimaal 5 werkdagen vooraf gemeld | — |

Deze doelen zijn ambities van het ontwerp; ze moeten worden bevestigd in het
hostingcontract en in de serviceafspraken met klanten.

## Scenario's

| Scenario | Impact | Aanpak |
| --- | --- | --- |
| Applicatie-instantie valt uit | geen, bij meerdere instanties | Load balancer stuurt geen verkeer meer; nieuwe instantie start |
| Database valt uit | volledige uitval | Failover naar de standby; anders herstel uit back-up |
| Objectopslag onbereikbaar | documenten niet in te zien, boeken werkt wel | Taken met retries; pdf-generatie loopt door zodra de opslag terug is |
| Regio-uitval bij de hoster | volledige uitval | Herstel in een andere regio uit back-up; zie [disaster-recovery.md](disaster-recovery.md) |
| Verlies van gegevens door een fout | mogelijk ernstig | Point-in-time recovery naar het moment vóór de fout |
| Kwaadaardige versleuteling (ransomware) | ernstig | Onveranderlijke back-ups met eigen toegangspad, buiten het bereik van productiecredentials |
| Leverancier valt weg | ernstig op termijn | Exitplan per leverancier; geen onvervangbare afhankelijkheden zonder alternatief |
| Sleutelbeheerder niet beschikbaar | herstel kan stagneren | Sleutels in escrow met vierogenprincipe |
| Exploitant valt weg | zeer ernstig voor klanten | Klanten kunnen op elk moment een volledige export maken, zie [exit-and-portability-plan.md](exit-and-portability-plan.md) |

Dat laatste punt is bewust in het product opgelost en niet alleen in een
contract: de exportfunctie werkt altijd, en de klant heeft daarmee zijn
administratie in een leesbaar en machineleesbaar formaat in handen.

## Kritieke afhankelijkheden

| Afhankelijkheid | Zonder wat werkt er niet | Alternatief |
| --- | --- | --- |
| PostgreSQL | alles | Standaardsoftware, elke hoster |
| Objectopslag | documenten | S3-compatible, dus uitwisselbaar |
| E-mail | facturen versturen | Adapter, dus vervangbaar |
| Betaalprovider (fase 3) | abonnementen incasseren | Adapter, dus vervangbaar |
| PSD2-provider (fase 3) | automatische bankmutaties | Bestandsimport blijft altijd werken |

De ontwerpkeuze om alles achter adapters te zetten, is hier een
continuïteitsmaatregel: geen enkele externe partij zit zo diep in het product dat
vervangen een herbouw wordt.

## Oefenen

| Oefening | Frequentie |
| --- | --- |
| Herstel uit back-up naar een geïsoleerde omgeving | elk kwartaal |
| Failover van de database | halfjaarlijks |
| Volledige uitwijk naar een andere regio | jaarlijks |
| Datalekprocedure | jaarlijks |

Van elke oefening wordt vastgelegd: wat er is gedaan, hoe lang het duurde, wat er
misging en welke verbeteracties eruit volgden.
