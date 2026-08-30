# Documentatie Gedmma

Gedmma is een boekhoud- en bedrijfsplatform voor Nederlandse zzp'ers, mkb-bedrijven,
stichtingen, verenigingen en accountantskantoren. Deze map bevat het ontwerp, de
onderbouwing en de operationele documentatie.

## Fase 0 — analyse en ontwerp

| Document | Inhoud |
| --- | --- |
| [repository-analyse.md](repository-analyse.md) | Wat er in de repository stond en wat daarvan bruikbaar is |
| [gap-analyse.md](gap-analyse.md) | Verschil tussen de bestaande situatie en het gevraagde platform |
| [product-vision.md](product-vision.md) | Productvisie, doelgroepen, positionering |
| [functional-requirements.md](functional-requirements.md) | Functionele domeinen en eisen per module |
| [architecture.md](architecture.md) | Technische architectuur, Mermaid-diagram, modulaire opbouw |
| [data-model.md](data-model.md) | Entiteiten, ER-diagram, tenant-scoping |
| [accounting-engine.md](accounting-engine.md) | Opbouw en invarianten van de double-entry engine |
| [security.md](security.md) | Beveiligingsarchitectuur, tenantisolatie, bedreigingsmodel |
| [roadmap.md](roadmap.md) | Fasering 0 t/m 5 |
| [risks.md](risks.md) | Technische en juridische risico's |
| [mvp-acceptatiecriteria.md](mvp-acceptatiecriteria.md) | Meetbare acceptatiecriteria voor de MVP |
| [assumptions.md](assumptions.md) | Aannames en openstaande beslissingen |
| [decision-log.md](decision-log.md) | Vastgelegde architectuurbeslissingen met motivatie |

## Bouw en beheer

| Document | Inhoud |
| --- | --- |
| [api.md](api.md) | API-ontwerp, foutcodes, paginering, idempotentie |
| [deployment.md](deployment.md) | Lokale omgeving, containers, CI/CD, rollback |
| [testing.md](testing.md) | Teststrategie en testsoorten |
| [migration-strategy.md](migration-strategy.md) | Import- en migratieframework |
| [mobile-architecture.md](mobile-architecture.md) | Architectuur iOS/Android |
| [desktop-architecture.md](desktop-architecture.md) | Architectuur Windows/macOS |

## Privacy, compliance en juridisch

Zie [compliance/README.md](compliance/README.md) voor het volledige register.
Belangrijk: geen enkel document in deze map is juridisch of fiscaal advies. De
status per verplichting staat in [compliance-matrix.md](compliance-matrix.md).
