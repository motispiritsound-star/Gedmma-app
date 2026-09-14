# 08 — Implementatieplan

Acht milestones. Elke milestone levert iets dat **draait en getest is**, niet
iets dat "af" is. De volgorde is gekozen zodat je zo vroeg mogelijk kunt zien of
het systeem redactioneel deugt — ruim voordat er een euro naar een provider gaat.

---

## M0 — Beslissingen (jij, ~30 minuten)

Antwoord op de tien vragen in [`01`](01-vragen.md), of bevestiging dat ik de
standaardopties gebruik. Blokkerend: vraag 1, 2 en 10.

**Klaar als:** `config/defaults.yaml` bestaat, met per keuze de bron
(`user` of `default`).

---

## M1 — Skelet en mockpipeline (geen credentials, geen kosten)

De volledige pipeline end-to-end met alleen mockproviders.

- Monorepo-opzet in `youtube-growth-engine/`, eigen `package.json`
- PostgreSQL + Prisma-schema, eerste migratie
- BullMQ + Redis, één worker per staptype
- De production state machine met idempotency op `(production_id, step, input_hash)`
- Alle zeven provider-contracten met mock-implementaties
- Gate-engine met configureerbare drempels en het auditlog
- Docker Compose voor lokaal draaien

**Klaar als:** `npm run demo` één productie van `draft` tot `awaiting_approval`
brengt, met een echte MP4 van placeholderbeeld en stilte, en een kostenoverzicht
van €0,00. Volledig offline.

> **Dit is de proof of concept uit je opdracht.** Alles werkt, alles is
> gesimuleerd, geen enkele credential nodig.

---

## M2 — Redactionele kern op echte modellen

De eerste stap waar geld naartoe gaat, en bewust de eerste die echt wordt: als
het systeem hier geen goede video's *bedenkt*, hoeft de rest niet gebouwd.

- `LlmProvider` op de Claude API, met prompt caching en batch waar zinnig
- Referentieanalyse op echte metadata (M4 levert de API; tot dan handmatige invoer)
- Stelling, onderzoeksbrief, originality brief, script
- Factcheck in schone context, `Claim ──> Source` als verplichte relatie
- Originaliteit, retention review, editorial quality
- Kostenregistratie per aanroep

**Klaar als:** je drie scripts hebt gelezen die je zelf zou willen publiceren,
mét bronnen, factcheckrapport en originaliteitsrapport — en minstens één script
is door een poort tegengehouden om een reden waar je het mee eens bent.

*Dat laatste is de echte test.* Een poortsysteem dat nooit afwijst, werkt niet.

---

## M3 — Productie: stem, beeld, montage

- `TtsProvider` met timestamps per teken; ondertiteling en SRT daaruit
- `ImageProvider` met stijlprofiel en `license_proof` per asset
- `VideoClipProvider` als accent (30–45 s per long-form)
- Shotlist naar FFmpeg-montage: 16:9 en 9:16
- Muziek en sound design, audiomix
- Thumbnailgeneratie, drie concepten
- Technische QC: zwarte frames, stiltes, sync, aspectratio, spelfouten,
  watermerken, misvormde beelden

**Klaar als:** een complete video van 9 minuten uit de pipeline komt waarvan de
werkelijke kosten binnen 20% van de begroting in [`06`](06-kosten-per-video.md)
liggen — en je de begroting bijstelt als dat niet zo is.

**Vóór M3:** alle prijzen en voorwaarden uit [`05`](05-toolvergelijking.md)
verifiëren tegen de officiële documentatie. Deze sessie kon dat niet.

---

## M4 — YouTube-koppeling en goedkeuring

- OAuth 2.0 met minimale scopes (`youtube.upload`, `yt-analytics.readonly`)
- Versleutelde refresh-tokens, automatische vernieuwing, alarm bij intrekking
- Resumable upload, privé, met idempotency-key
- `captions.insert`, `thumbnails.set`, `publishAt`
- Quotameting met alarm op 80%
- **Het goedkeuringsdashboard**: voorvertoning, drie titels, drie thumbnails,
  script, bronnen, factcheckrapport, originaliteitsrapport, alle vijf scores,
  policy risk, productiekosten, geschatte break-even views
- Vier knoppen: goedkeuren, aanpassen, hergenereren, afwijzen
- Kill switch in dashboard én CLI

**Klaar als:** een video privé op je kanaal staat, jij hem goedkeurt, hij wordt
ingepland — en een tweede upload van dezelfde inhoud aantoonbaar een no-op is
die hetzelfde `videoId` teruggeeft.

---

## M5 — Analytics en de leerlus

- Dagelijkse ophaling via de Analytics API, met `as_of`-datum en zonder
  overschrijven
- Impressions, CTR, views, retentie na 30 seconden, gemiddelde kijktijd,
  gemiddeld bekeken percentage, terugkerende kijkers, abonneegroei,
  verkeersbronnen, likes, opbrengsten waar beschikbaar
- Werkelijke kosten en nettoresultaat per video
- **Voorspelde tegen werkelijke retentie**, per poortcriterium
- Experimentregister met onveranderlijke vooraf vastgelegde verwachting
- Wekelijks rapport: beste en slechtste video's, waarschijnlijke oorzaken,
  opbrengst en kosten per video, nieuwe hypotheses, wat doorgaat, wat stopt,
  concrete verbeteringen

**Klaar als:** het wekelijkse rapport een aanbeveling doet die je niet zelf al
had bedacht.

---

## M6 — Productieklaar maken

- Unit- en integratietests op alle kritieke paden: state machine, idempotency,
  gate-engine, kostenregistratie, OAuth-vernieuwing, upload
- Contracttests per provider-adapter, zodat een vervanging aantoonbaar werkt
- Gestructureerde logging met `production_id` als correlatie-id
- Monitoring en alarmen
- Dagelijkse back-up **plus wekelijkse hersteltest** — een back-up zonder
  herstelbewijs telt niet
- Harde kostenplafonds per dag, maand en productie
- `.env.example` zonder echte secrets
- Vier documenten: installatie, productie-handleiding, providers vervangen,
  back-up en herstel

**Klaar als:** de Definition of Done uit je opdracht punt voor punt is af te
vinken (tabel onderaan).

---

## M7 — Pilot van tien video's

Geen bouwwerk maar een meetperiode. Tien long-form video's, 2 Shorts per week,
maximaal één publicatie per dag.

- Eigen benchmark per niche, lengte en format opbouwen — algemene
  retentiecijfers uit de markt gelden expliciet niet als waarheid
- Poortdrempels kalibreren op werkelijke uitkomsten
- Kostenbegroting vervangen door meetgegevens
- Pas daarna een besluit over volumeverhoging, en alleen als kwaliteit,
  retentie en originaliteit aantoonbaar op peil zijn gebleven

---

## Definition of Done — waar elk punt landt

| Eis uit de opdracht | Milestone |
|---|---|
| Referentie-URL kan veilig worden verwerkt | M2 (analyse) + M4 (API) |
| Originele invalshoek wordt gegenereerd | M2 |
| Bronnen worden geregistreerd | M2 |
| Script doorloopt alle kwaliteitscontroles | M2 |
| Voice-over en beelden worden geproduceerd | M3 |
| Video wordt automatisch gemonteerd | M3 |
| Ondertiteling en metadata worden gemaakt | M3 |
| Kosten per video zichtbaar | M1 (structuur) → M3 (echt) → M4 (dashboard) |
| Privé YouTube-upload werkt | M4 |
| Menselijke goedkeuring werkt | M4 |
| Dubbele uploads worden voorkomen | M1 (idempotency) → M4 (bewijs) |
| Analytics worden opgehaald | M5 |
| Optimalisatielus maakt aanbevelingen | M5 |
| Kritieke functies getest en gedocumenteerd | M6 |

## Wat ik niet doe zonder jouw uitdrukkelijke toestemming

- Betaalde accounts aanmaken of abonnementen afsluiten
- Een YouTube-kanaal aanmaken of koppelen
- Iets publiceren, ook niet privé, vóór M4 is goedgekeurd
- `APPROVAL_MODE` op `false` zetten
- Een poortdrempel verlagen
