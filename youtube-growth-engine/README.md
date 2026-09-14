# YouTube Growth Engine

Een grotendeels geautomatiseerd productiesysteem voor een YouTube-kanaal dat
**originele** video's maakt: referentievideo's dienen alleen als analytische
input, nooit als sjabloon.

> **Status: Fase 1 — analyse en ontwerp. Er is nog geen code gebouwd.**
> Dit is de oplevering die volgens de opdracht vóór de bouw komt: interpretatie,
> vragen, businessmodel, compliance, architectuur, toolvergelijking, kosten,
> workflow, implementatieplan en risico's.

## Leeswijzer

| Document | Inhoud |
|---|---|
| [`docs/00-interpretatie.md`](docs/00-interpretatie.md) | Wat ik denk dat je wilt bouwen, en wat het systeem expliciet níét is |
| [`docs/01-vragen.md`](docs/01-vragen.md) | De tien vragen, elk met een aanbevolen standaardoptie |
| [`docs/02-niche-en-businessmodel.md`](docs/02-niche-en-businessmodel.md) | Fase 1: niche-scoremodel, zes gescoorde kandidaten, drie scenario's, break-even |
| [`docs/03-compliance-en-auteursrecht.md`](docs/03-compliance-en-auteursrecht.md) | Auteursrecht, YouTube-beleid, AI-disclosure, AVG, licenties |
| [`docs/04-architectuur.md`](docs/04-architectuur.md) | Systeemopbouw, datamodel, gate-engine, taalkeuze |
| [`docs/05-toolvergelijking.md`](docs/05-toolvergelijking.md) | Providervergelijking, aanbevolen stack en pilot-stack |
| [`docs/06-kosten-per-video.md`](docs/06-kosten-per-video.md) | Kostenopbouw per Short en per long-form, per scenario |
| [`docs/07-workflow.md`](docs/07-workflow.md) | Het pipelinediagram en elke gate |
| [`docs/08-implementatieplan.md`](docs/08-implementatieplan.md) | M0–M7, met de Definition of Done erop gemapt |
| [`docs/09-risico-register.md`](docs/09-risico-register.md) | Risico's en beheersmaatregelen |
| [`docs/10-bronnen-en-verificatiestatus.md`](docs/10-bronnen-en-verificatiestatus.md) | Elke feitelijke claim met bron en verificatiestatus |

## Wat er nu werkt, wordt gesimuleerd of ontbreekt

| | Stand |
|---|---|
| **Werkt volledig** | Niets in code — dit is een ontwerp-oplevering. |
| **Gesimuleerd** | Niets nog. De proof of concept (M1) draait straks volledig op mockproviders. |
| **Ontbrekende credentials** | Alles: Google Cloud/OAuth (YouTube Data + Analytics), Anthropic, een TTS-provider, een beeldgenerator, een videogenerator, een muzieklicentie, objectopslag. |
| **Betaalde diensten later nodig** | Zie [`docs/05-toolvergelijking.md`](docs/05-toolvergelijking.md). Ik maak geen accounts aan en sluit niets af. |
| **Menselijke handelingen die nooit verdwijnen** | Kanaal aanmaken en verifiëren, OAuth-toestemming geven, AdSense koppelen, merk- en stemkeuze, eindgoedkeuring per video, elk gevoelig onderwerp, elke sponsordeal. |

## Verificatie

Deze sessie kon `developers.google.com`, `support.google.com` en de meeste
leverancierssites **niet** bereiken: de egress-policy blokkeert ze (HTTP 403).
Alle externe feiten komen daarom uit websearch-resultaten en zijn in
[`docs/10-bronnen-en-verificatiestatus.md`](docs/10-bronnen-en-verificatiestatus.md)
gemarkeerd als **bevestigd**, **secundair** of **te verifiëren**. Prijzen,
quota's en beleidsregels moeten vóór de bouw van M3 tegen de officiële
documentatie aan worden gehouden.
