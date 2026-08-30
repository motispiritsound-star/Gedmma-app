# API-ontwerp

## Grondslagen

* **REST over HTTPS**, JSON in en uit, `application/json; charset=utf-8`.
* **Versie in het pad**: `/api/v1/...`. Een nieuwe major-versie komt naast de
  oude te staan; de oude krijgt minimaal twaalf maanden ondersteuning.
* **Administratie in het pad**: `/api/v1/administrations/{administrationId}/...`
  voor alles wat tenantgebonden is. Nooit impliciet uit de sessie afgeleid, zodat
  een verkeerd geselecteerde administratie niet stil een verkeerde boeking maakt.
* **Engelse veldnamen** in de API (`invoiceDate`, `totalInclVat`), Nederlands in
  de gebruikersinterface. De vertaallaag zit in de webapp, niet in de API.
* **Bedragen als string**: `"1210.00"`. Nooit als getal, zodat er geen
  floating-pointconversie tussen zit. Valuta staat er los bij.
* **Datums** als `YYYY-MM-DD`, tijdstippen als RFC 3339 in UTC.

## Authenticatie

| Manier | Gebruik |
| --- | --- |
| Sessiecookie | Webapp; `HttpOnly`, `Secure`, `SameSite=Lax`; `Origin`-controle op elke onveilige methode |
| Bearer-token | Mobiele apps en desktop; kortlevend access token met refresh-rotatie |
| API-key | Server-naar-server integraties (fase 3); scopes per key, per tenant |
| OAuth2 | Integraties namens een gebruiker (fase 3) |

## Voorbeelden

```http
POST /api/v1/administrations/{id}/sales-invoices
Idempotency-Key: 8f3b1c1e-...
Content-Type: application/json

{
  "contactId": "…",
  "invoiceDate": "2026-03-31",
  "currency": "EUR",
  "lines": [
    { "description": "Advies maart", "quantity": "10", "unitPrice": "100.00", "taxCodeId": "…" }
  ]
}
```

```json
{
  "id": "…",
  "status": "draft",
  "documentNumber": null,
  "totalExclVat": "1000.00",
  "vatTotal": "210.00",
  "totalInclVat": "1210.00",
  "version": 1
}
```

Definitief maken is een aparte, expliciete actie — nooit een `PATCH` op een
statusveld:

```http
POST /api/v1/administrations/{id}/sales-invoices/{invoiceId}/finalize
If-Match: "1"
```

## Idempotentie

Elke `POST` die iets aanmaakt of boekt accepteert `Idempotency-Key`. De sleutel,
het verzoek-hash en het antwoord worden 24 uur bewaard per administratie. Een
herhaald verzoek met dezelfde sleutel levert het opgeslagen antwoord terug; een
herhaald verzoek met dezelfde sleutel maar een andere body levert
`409 idempotency_key_reused`.

## Optimistic locking

Wijzigbare bronnen dragen `version`. Een `PATCH`/`PUT` zonder `If-Match` of met
een verouderde versie levert `409 version_conflict` met de huidige versie erbij,
zodat de client kan tonen wat er intussen veranderd is.

## Paginering, filteren en sorteren

```
GET /api/v1/administrations/{id}/sales-invoices
    ?status=open&from=2026-01-01&to=2026-03-31
    &sort=-invoiceDate&limit=50&cursor=eyJ...
```

Cursor-gebaseerd, niet offset-gebaseerd: bij een groeiende dataset slaat offset
rijen over. Het antwoord bevat `items`, `nextCursor` en `totalEstimate`.
`limit` is standaard 50 en maximaal 200.

## Foutformaat

```json
{
  "error": {
    "code": "period_closed",
    "message": "De periode maart 2026 is gesloten; boeken kan niet.",
    "hint": "Vraag iemand met het recht 'periode heropenen' om de periode te openen, of boek in april.",
    "details": [{ "field": "entryDate", "issue": "in_closed_period" }],
    "requestId": "01J…"
  }
}
```

`message` en `hint` zijn voor de gebruiker bedoeld en worden vertaald op basis
van `Accept-Language`. `code` is stabiel en machineleesbaar.

### Foutcodes

| Code | HTTP | Betekenis |
| --- | --- | --- |
| `validation_failed` | 400 | Invoer voldoet niet aan het schema |
| `unauthenticated` | 401 | Geen of ongeldige sessie |
| `mfa_required` | 401 | Tweede factor nog niet voldaan |
| `forbidden` | 403 | Onvoldoende rechten |
| `not_found` | 404 | Bestaat niet, of niet binnen deze administratie |
| `version_conflict` | 409 | Optimistic lock |
| `idempotency_key_reused` | 409 | Sleutel hergebruikt met andere inhoud |
| `duplicate_document` | 409 | Leveranciersfactuurnummer bestaat al |
| `period_closed` | 422 | Periode is geblokkeerd of gesloten |
| `entry_not_balanced` | 422 | Debet en credit zijn niet gelijk |
| `entry_immutable` | 422 | Poging een definitieve post te wijzigen |
| `invoice_requirements_missing` | 422 | Wettelijke factuurvereisten niet compleet |
| `limit_reached` | 402 | Abonnementslimiet bereikt |
| `rate_limited` | 429 | Te veel verzoeken |
| `internal_error` | 500 | Onverwacht; `requestId` staat in het antwoord en in de logs |

Een `404` wordt bewust ook teruggegeven als de bron wél bestaat maar in een
andere administratie: bestaan van gegevens van een andere tenant mag niet
afleidbaar zijn.

## Rate limiting

| Groep | Limiet |
| --- | --- |
| Login en wachtwoordherstel | 10 per 15 minuten per IP, 5 per account |
| Schrijvende endpoints | 120 per minuut per gebruiker |
| Lezende endpoints | 600 per minuut per gebruiker |
| Export en documentdownload | 30 per minuut per gebruiker |
| Publieke API (fase 3) | per key instelbaar, standaard 1.000 per minuut |

Antwoorden dragen `RateLimit-Limit`, `RateLimit-Remaining` en `RateLimit-Reset`.

## Realtime

`GET /api/v1/administrations/{id}/stream` levert Server-Sent Events. Elke
gebeurtenis heeft `type`, `at` en `data`. Types in de MVP: `import.progress`,
`bank.transaction.created`, `invoice.status.changed`, `job.finished`.

## Webhooks (fase 3)

* Payload ondertekend met HMAC-SHA256 in `Gedmma-Signature`, met tijdstempel
  tegen replay.
* Minimaal vijf pogingen met exponentiële backoff, daarna dead-letter queue met
  handmatige herverzending.
* Levering minstens één keer; consumenten moeten idempotent zijn. De
  gebeurtenis-id staat in `Gedmma-Event-Id`.

## OpenAPI

`GET /api/v1/openapi.json` levert de specificatie, gegenereerd uit dezelfde
`zod`-schema's die de invoer valideren. Daardoor kan de documentatie niet uit de
pas lopen met het gedrag. Een contracttest controleert dat elke route in de
specificatie voorkomt en omgekeerd.

## Verplichte headers op elk verzoek

| Header | Toelichting |
| --- | --- |
| `Accept-Language` | Bepaalt de taal van `message` en `hint` |
| `Idempotency-Key` | Verplicht op aanmakende `POST` |
| `If-Match` | Verplicht op wijzigende `PATCH`/`PUT` van bronnen met `version` |
| `X-Request-Id` | Optioneel; wordt overgenomen in logs en in het antwoord |
