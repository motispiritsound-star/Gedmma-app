# YouTube Growth Engine

Een grotendeels geautomatiseerd productiesysteem voor een YouTube-kanaal dat
**originele** video's maakt: referentievideo's dienen alleen als analytische
input, nooit als sjabloon.

> **Status: M1 — het skelet draait op mockproviders.**
> Fase 1 (analyse en ontwerp) is af, de keuzes staan in `config/defaults.yaml`,
> en `npm run demo` doorloopt de hele pipeline zonder één API-credential.

```bash
npm install
npm run demo      # hele pipeline, mockproviders, echte MP4 in out/
npm test          # 33 tests
npm run typecheck
```

De demo draait drie producties die samen de belangrijkste eigenschap van het
systeem laten zien — **het weigert vaker dan het publiceert, en het weigert
vroeg**:

| | Productie | Uitkomst | Kosten |
|---|---|---|---|
| 1 | Concept zonder invulbare stelling | afgewezen op `thesis` | € 0,03 |
| 2 | Script met een hadith zonder gradering | afgewezen op `religious_integrity` | € 1,60 |
| 3 | Volledig onderbouwd, NL + DE | `awaiting_reviewer`, twee echte MP4's | € 2,56 |

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
| [`docs/11-nichedossier-islamitische-gezinscontent.md`](docs/11-nichedossier-islamitische-gezinscontent.md) | Fase 1 op de gekozen niche: made-for-kids, de budgetsom, de taalhefboom, de referenties |
| [`docs/12-religieuze-integriteitspoort.md`](docs/12-religieuze-integriteitspoort.md) | Herkomstregels voor Koran, hadith en fiqh; het afbeeldingsverbod; Arabische tekst |
| [`config/defaults.yaml`](config/defaults.yaml) | Je vastgelegde keuzes, met per keuze wie hem maakte |

## Wat er nu werkt, wordt gesimuleerd of ontbreekt

| | Stand |
|---|---|
| **Werkt volledig** | De state machine, de poortenmotor, de religieuze integriteitspoort, de kostenregistratie met plafonds, de idempotente upload-claim, de ondertiteling uit TTS-timestamps, de technische QC (zwarte frames, stiltes) en de FFmpeg-montage. Die laatste is meteen de productierenderer. |
| **Gesimuleerd** | Taalmodel, zoeken, spraak, beeld, videoclips en muziek. Elke mock zit achter hetzelfde contract als de echte provider; vervangen is één regel in de registry. |
| **Ontbrekende credentials** | Anthropic, Google Cloud/OAuth (YouTube Data + Analytics), TTS, beeldgenerator, videogenerator, muzieklicentie, objectopslag. |
| **Betaalde diensten later nodig** | Zie [`docs/05-toolvergelijking.md`](docs/05-toolvergelijking.md). Ik maak geen accounts aan en sluit niets af. |
| **Menselijke handelingen die nooit verdwijnen** | Kanaal aanmaken en verifiëren, OAuth-toestemming geven, AdSense koppelen, stemtest, **de gekwalificeerde religieuze reviewer** (zie [`docs/12`](docs/12-religieuze-integriteitspoort.md) §5), eindgoedkeuring per video, elke sponsordeal. |

## Verificatie

Deze sessie kon `developers.google.com`, `support.google.com` en de meeste
leverancierssites **niet** bereiken: de egress-policy blokkeert ze (HTTP 403).
Alle externe feiten komen daarom uit websearch-resultaten en zijn in
[`docs/10-bronnen-en-verificatiestatus.md`](docs/10-bronnen-en-verificatiestatus.md)
gemarkeerd als **bevestigd**, **secundair** of **te verifiëren**. Prijzen,
quota's en beleidsregels moeten vóór de bouw van M3 tegen de officiële
documentatie aan worden gehouden.
