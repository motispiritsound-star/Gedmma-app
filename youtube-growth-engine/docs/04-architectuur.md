# 04 — Voorgestelde architectuur

## Taalkeuze: TypeScript

**Motivatie, in volgorde van gewicht:**

1. **Deze repository is al een TypeScript-monorepo** met Fastify, Prisma,
   PostgreSQL, npm workspaces, een CI-workflow en een Docker-opstelling die
   werkt. Dat is ongeveer twee weken opzetwerk dat we niet opnieuw doen.
2. **Het zware rekenwerk zit nergens in onze code.** Taalmodellen, spraak, beeld
   en video draaien allemaal bij providers; wij doen HTTP-aanroepen, wachtrijen
   en bestandsbeheer. Precies waar Node in uitblinkt en waar het voordeel van
   Python — het ML-ecosysteem — niets toevoegt.
3. **Eén taal over API, worker en dashboard.** Het Zod-schema van een
   videoconcept is letterlijk hetzelfde object in de worker als in het
   goedkeuringsscherm. Bij een Python-backend met een TS-frontend onderhoud je
   dat contract twee keer.
4. **FFmpeg is een subprocess.** De taal van de aanroeper is irrelevant.

**Waar Python beter zou zijn geweest**, eerlijk benoemd: geforceerde
audio-uitlijning voor ondertiteling (`whisperx`, `aeneas`) en beeldnabewerking
(`opencv`, `Pillow`) hebben in Python volwassener bibliotheken. Oplossing: één
klein Python-hulpproces in de worker-container, aangeroepen als CLI. Dat is de
enige Python in het systeem, en het is vervangbaar.

Ook bewust: **dit project komt in `youtube-growth-engine/` als zelfstandige map
met een eigen `package.json`**, niet als workspace van Buurklus. Het deelt de
Docker- en CI-conventies, maar geen code en geen database. Als je het later wilt
afsplitsen is dat een `git subtree split`, geen ontvlechting.

---

## Systeemoverzicht

```
┌──────────────────────────────────────────────────────────────────┐
│  Dashboard (Fastify + server-rendered HTML, zelfde aanpak als    │
│  apps/web)                                                       │
│  Goedkeuren · afwijzen · hergenereren · scores · kosten · logs   │
└───────────────────────────┬──────────────────────────────────────┘
                            │ HTTP (sessie-auth)
┌───────────────────────────▼──────────────────────────────────────┐
│  API (Fastify + Zod)                                             │
│  /productions  /gates  /approvals  /providers  /costs  /reports  │
└───────┬───────────────────────────────────────┬──────────────────┘
        │                                       │
┌───────▼─────────────┐               ┌─────────▼──────────────────┐
│  PostgreSQL         │               │  Redis + BullMQ            │
│  (Prisma)           │               │  wachtrijen per stap       │
│  producties, scores │               │  retries, backoff, DLQ     │
│  bronnen, assets,   │               └─────────┬──────────────────┘
│  kosten, auditlog   │                         │
└─────────────────────┘               ┌─────────▼──────────────────┐
                                      │  Workers (Node)            │
                                      │  één proces per staptype   │
                                      │  + FFmpeg + py-helper      │
                                      └─────────┬──────────────────┘
                                                │
                    ┌───────────────────────────┼─────────────────────┐
                    │                           │                     │
         ┌──────────▼─────────┐   ┌─────────────▼──────┐  ┌───────────▼────────┐
         │ Provider-adapters  │   │  Asset-store       │  │  YouTube-adapter   │
         │ llm · tts · image  │   │  S3-compatibel,    │  │  Data API (upload) │
         │ video · music      │   │  content-addressed │  │  Analytics (lezen) │
         │ render · search    │   │  + license_proof   │  │  OAuth + refresh   │
         └────────────────────┘   └────────────────────┘  └────────────────────┘
```

---

## De vijf bouwstenen die het systeem bepalen

### 1. De production state machine

Elke video is één `Production`-rij die precies één toestand heeft. Overgangen
zijn expliciet, gelogd en onomkeerbaar zonder nieuwe rij.

```
draft → angle_set → researched → scripted → fact_checked → originality_checked
  → retention_reviewed → voiced → storyboarded → assets_generated → assembled
  → captioned → packaged → trust_checked → awaiting_approval
  → approved → uploaded_private → scheduled → published → measured
                                  ↘ rejected      ↘ regenerating
```

Twee eigenschappen die alles makkelijker maken:

- **Elke stap is idempotent op `(production_id, step, input_hash)`.** Opnieuw
  draaien met dezelfde invoer levert het opgeslagen resultaat, niet een nieuwe
  API-aanroep. Dat is meteen de bescherming tegen dubbele uploads én de reden
  dat een crash midden in de pipeline geen geld kost.
- **`rejected` is een eindtoestand met een reden, geen fout.** De wekelijkse
  rapportage telt afwijzingen per poort; een poort die nooit afwijst staat te
  laag afgesteld en dat wordt zichtbaar.

### 2. De gate-engine

Poorten zijn data, geen code. Eén tabel, één evaluator:

```ts
type Gate = {
  key: 'editorial_quality' | 'retention_readiness' | 'originality'
     | 'source_confidence' | 'trust' | 'policy_risk'
  threshold: number          // configureerbaar
  blocking: boolean
  sensitiveTopicThreshold?: number   // strengere variant
}
```

Standaardwaarden uit je opdracht: Editorial ≥ 85, Retention ≥ 80, Originality
≥ 90, Source Confidence ≥ 90, Trust ≥ 90, Policy Risk = laag.

Drie regels in de engine zelf:

- **Drempels kunnen alleen omhoog door het systeem, nooit omlaag.** Er bestaat
  geen codepad dat een drempel verlaagt. Verlagen gaat via een
  configuratiewijziging door jou, die in het auditlog komt met wie, wanneer en
  waarom.
- **Elke score komt met een onderbouwing per deelcriterium**, niet als kaal
  getal. Een Retention Readiness van 72 zonder "de eerste inhoudelijke beloning
  komt pas op 1:40" is nutteloos voor verbetering.
- **Elke voorspelde score wordt na publicatie vergeleken met de werkelijkheid.**
  Die vergelijking is de kalibratiebron voor de eigen benchmark per niche,
  lengte en format — algemene retentiecijfers uit de markt gelden expliciet niet
  als waarheid.

### 3. Provider-adapters

Zeven contracten, elk met minstens twee implementaties plus een mock:

| Contract | Doet | Mock levert |
|---|---|---|
| `LlmProvider` | analyse, script, poorten | vaste voorbeeldteksten |
| `SearchProvider` | bronnenonderzoek | vaste bronnenset |
| `TtsProvider` | voice-over | stilte van de juiste lengte |
| `ImageProvider` | stills, thumbnails | gekleurde placeholders met tekst |
| `VideoClipProvider` | generatieve clips | bewegend testbeeld |
| `MusicProvider` | muziek en SFX | vrije toon van de juiste lengte |
| `RenderProvider` | montage | lokale FFmpeg |

Elke adapter rapporteert na elke aanroep verplicht `{ costCents, latencyMs,
providerRef }`. Kostenregistratie is daarmee geen aparte administratie maar een
bijproduct van elke aanroep — een provider aanroepen zonder kosten te loggen
is niet mogelijk zonder het contract te schenden.

**Alle mocks samen vormen de proof of concept van M1.** De hele pipeline draait
dan end-to-end zonder één externe credential en zonder één cent kosten.

### 4. De asset-store

Content-addressed (SHA-256 als sleutel), S3-compatibel, met per asset:

```
asset_id, sha256, kind, mime, bytes, duration_ms,
origin: 'generated' | 'licensed' | 'own',
provider, provider_ref, generated_at,
license_proof_id  ← NOT NULL voor alles wat in een render mag
prompt_used, model_version
```

De `NOT NULL`-constraint op `license_proof_id` is de belangrijkste regel in het
datamodel: een asset zonder licentiebewijs kan de montagestap niet in, en dat is
door de database afgedwongen in plaats van door een procedure.

### 5. Veiligheid en kosten

| Maatregel | Uitwerking |
|---|---|
| Secrets | Alleen via omgevingsvariabelen of secret manager. `.env.example` zonder echte waarden. Secrets nooit in de database, nooit in logs |
| OAuth-scopes | `youtube.upload` en `yt-analytics.readonly`. Meer niet — automatische engagement is daarmee technisch onmogelijk |
| Tokens | Refresh-token versleuteld at rest, automatische vernieuwing, alarm bij intrekking |
| Idempotency | `Idempotency-Key` per upload, afgeleid van `production_id` + `content_hash`. Een tweede upload van dezelfde inhoud is een no-op die de bestaande `videoId` teruggeeft |
| Rate limits | Per provider een token bucket in Redis; exponentiële backoff met jitter; dead-letter queue met alarm |
| Kostenlimieten | Harde plafonds per dag en per maand, plus per productie. Bij overschrijding stopt de wachtvrij en komt er een melding — geen stille doorbelasting |
| Auditlog | Append-only. Elke poortuitslag, elke goedkeuring, elke drempelwijziging, elke upload, elke provideraanroep met kosten |
| Kill switch | Eén vlag die alle wachtrijen pauzeert en elke publicatie blokkeert. Bereikbaar via dashboard én CLI, zodat hij ook werkt als het dashboard stuk is |
| `APPROVAL_MODE` | Standaard `true`. Privé-upload, wachten op jouw oordeel. `false` vereist een expliciete wijziging én laat gevoelige onderwerpen alsnog altijd wachten |

---

## Datamodel in hoofdlijnen

```
Channel ──< Production ──< ProductionStep      (status, input_hash, kosten)
                       ──< GateResult          (score, deelscores, onderbouwing)
                       ──< Source              (url, type, opgehaald, betrouwbaarheid)
                       ──< Claim ──> Source    (elke claim wijst naar een bron)
                       ──< ScriptVersion       (met de stelling als apart veld)
                       ──< Asset ──> LicenseProof
                       ──< Upload              (videoId, idempotency_key, privacy)
                       ──< CostEntry           (provider, stap, centen)
                       ──< Metric              (uit Analytics, per dag)
                       ──< Experiment ──> Hypothesis

ReferenceVideo (metadata-cache, TTL 30 dagen) ──< PatternObservation (afgeleid, blijft)
AuditEvent (append-only)
```

Twee punten die later duur zijn als je ze nu overslaat:

- **`Claim ──> Source` is een verplichte relatie.** Een claim zonder bron kan
  niet bestaan; dat maakt de factcheckpoort een query in plaats van een
  beoordeling.
- **`ReferenceVideo` heeft een TTL, `PatternObservation` niet.** De ruwe
  YouTube-data verloopt (zie [`03`](03-compliance-en-auteursrecht.md) §2); de
  afgeleide, geanonimiseerde inzichten blijven. Dat is precies de scheiding die
  de API-voorwaarden vragen.

---

## Observability

- **Gestructureerde logs** (JSON) met `production_id` als correlatie-id door de
  hele keten.
- **Metrics**: doorlooptijd per stap, kosten per stap, slaagpercentage per
  poort, verhouding voorspelde/werkelijke retentie.
- **Alarmen** bij: mislukte upload, verlopen OAuth, kostenplafond bereikt,
  wachtrij boven drempel, poort die drie keer achtereen dezelfde reden afwijst
  (dat wijst op een systematische fout in een prompt, niet op drie slechte
  video's).
- **Back-up**: dagelijkse `pg_dump` naar objectopslag, wekelijkse
  hersteltest tegen een lege database. Een back-up zonder herstelbewijs telt
  niet.
