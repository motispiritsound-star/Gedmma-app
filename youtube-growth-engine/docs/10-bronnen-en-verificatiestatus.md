# 10 — Bronnen en verificatiestatus

## Wat deze sessie wel en niet kon controleren

De egress-policy van deze omgeving blokkeert de meeste officiële
documentatiedomeinen. Concreet geprobeerd en geweigerd met **HTTP 403**:

```
developers.google.com   support.google.com   www.youtube.com
elevenlabs.io           shotstack.io         creatomate.com
openai.com              replicate.com        fal.ai
```

Websearch werkte wel. Alles hieronder komt daarom uit zoekresultaten van
september 2026 — dat zijn samenvattingen van derden, geen primaire bron.

## Statuscodes

| Code | Betekenis |
|---|---|
| **A — bevestigd** | Uit de officiële documentatie of uit een bron binnen deze sessie die gezag heeft |
| **B — secundair** | Meerdere onafhankelijke derden zeggen hetzelfde; waarschijnlijk juist, niet geverifieerd |
| **C — tegenstrijdig** | Bronnen spreken elkaar tegen. Niet op bouwen |
| **D — te verifiëren** | Nodig voor het ontwerp, nog geen betrouwbare bron |

---

## Claims in deze oplevering

### YouTube-beleid

| Claim | Status | Waar gebruikt |
|---|---|---|
| YPP-drempel: 1.000 abonnees + 4.000 kijkuren/12 mnd óf 10M Shorts-views/90 dgn; tellen niet samen op | **B** | [`02`](02-niche-en-businessmodel.md) §1 |
| Per 1 februari 2027 naar 8.000 uur of 20M Shorts-views voor nieuwe aanvragers | **B** | [`02`](02-niche-en-businessmodel.md) §1, [`09`](09-risico-register.md) |
| "Repetitious content" hernoemd naar "inauthentic content" op 15 juli 2025 | **B** | [`03`](03-compliance-en-auteursrecht.md) §2 |
| Januari 2026: 16 kanalen beëindigd, samen 4,7 mld lifetime views | **B** | [`02`](02-niche-en-businessmodel.md) §3, [`09`](09-risico-register.md) |
| Disclosure vereist bij realistische synthetische content; AI-voice-over op zichzelf is geen trigger tenzij gekloond naar een bestaand persoon; gestileerde animatie uitgezonderd | **B** | [`03`](03-compliance-en-auteursrecht.md) §2 |
| Bewaartermijn voor API-data in de YouTube API Services Terms | **D** | [`03`](03-compliance-en-auteursrecht.md) §2, datamodel in [`04`](04-architectuur.md) |
| Midrolls vanaf 8 minuten | **D** | [`01`](01-vragen.md) vraag 5 |

### YouTube API

| Claim | Status | Opmerking |
|---|---|---|
| Standaard dagquotum 10.000 eenheden per project | **B** | |
| Quotakosten van `videos.insert` | **C** | Oudere bronnen: 1.600 eenheden. Bronnen uit 2026: aparte bucket, ~1 eenheid, limiet ~100 uploads/dag. **Niet op bouwen** — de implementatie meet zelf en alarmeert op 80%. Zie [`05`](05-toolvergelijking.md) §2 |
| Scopes `youtube.upload` en `yt-analytics.readonly` volstaan | **D** | Verifiëren vóór M4 |
| Vertraging en bijstelling van opbrengstmetrics | **D** | Reden voor `as_of` in het datamodel |

### Prijzen — taalmodel

| Claim | Status |
|---|---|
| Opus 5 $5/$25, Sonnet 5 $2/$10, Haiku 4.5 $1/$5 per miljoen tokens | **A** — uit de `claude-api`-referentie in deze sessie |
| Cache-reads ~10% van de inputprijs; batch-API 50% korting | **A** |
| Contextvenster 1M tokens (Haiku 4.5: 200K) | **A** |

### Prijzen — overige providers

| Claim | Status |
|---|---|
| ElevenLabs TTS $0,10 per 1.000 tekens (v3 / Multilingual v2), $0,05 (Flash/Turbo) | **B** |
| Commerciële licentie vanaf Starter ($6/mnd); gratis plan zonder commerciële licentie | **B** |
| Plannen: $0 / $6 / $22 / $99 / $299 / $990 | **B** |
| Generatieve video $0,05–0,75 per seconde | **B** |
| Shotstack vanaf $49/mnd voor 200 min 720p (~$0,25/min) | **B** |
| Creatomate vanaf $41/mnd voor 144 min | **B** |
| Beeldgeneratie $0,02–0,08 per beeld | **D** — eigen schatting |
| Muzieklicentie €10–25/mnd | **D** — eigen schatting |

### RPM en marktcijfers

| Claim | Status |
|---|---|
| Openbare RPM-cijfers voor personal finance lopen uiteen van $10–25 tot $25–50 | **C** — en die tegenstrijdigheid is zelf het bruikbare gegeven |
| Tier-1-markten leveren een veelvoud van Tier-3 | **B** |
| RPM-bandbreedtes voor Nederlandstalig, gebruikt in [`02`](02-niche-en-businessmodel.md) §4 | **D** — eigen conservatieve schatting |
| Shorts-RPM €0,03–0,15 | **D** — eigen schatting, ordegrootte lager dan long-form |
| Q4-piek 1,5–2× de januari-bodem | **D** — eigen schatting |
| Sponsor-CPM €15–30 voor middelgrote NL-kanalen | **D** — eigen schatting |

### Juridisch

| Claim | Status |
|---|---|
| DSM-richtlijn art. 3–4 (TDM) met opt-out in art. 4 | **D** — en het ontwerp leunt er bewust niet op |
| EU AI-verordening art. 50 transparantieplicht bij synthetische content | **D** — ingangsdata en reikwijdte verifiëren vóór eerste publicatie |
| Reclamecode Social Media & Influencer Marketing, toezicht ACM | **D** |
| Ondertitelbestanden zijn zelfstandig auteursrechtelijk beschermd | **D** — het ontwerp gaat hier van uit, wat de veilige aanname is |

---

## Wat vóór welke milestone moet worden geverifieerd

**Blokkerend voor M3** (eerste echte uitgaven):

- ElevenLabs: prijs per teken, commerciële licentie per plan, credits per model
- Beeldgenerator: prijs per beeld, voorwaarden commercieel gebruik, opt-out op
  modeltraining
- Videogenerator: prijs per seconde, voorwaarden commercieel gebruik
- Muziekbron: licentievoorwaarden, en of het licentiebewijs opslaanbaar is

**Blokkerend voor M4** (eerste upload):

- YouTube Data API: quotakosten van `videos.insert` en het actuele limietmodel
  (status **C** — dit moet naar A)
- Minimale scopes voor upload, captions en thumbnails
- Bewaartermijn voor API-data in de API Services Terms (status **D**)
- Disclosure-vereisten, exacte formulering en waar de toggle zit
- YPP-drempel en de aangekondigde wijziging per februari 2027

**Blokkerend voor de eerste publicatie:**

- EU AI-verordening art. 50: ingangsdatum en reikwijdte voor deze toepassing
- Nederlandse reclameregels voor affiliate en sponsoring
- Verwerkersovereenkomsten met elke gekozen provider

---

## Geraadpleegde zoekresultaten

YouTube-beleid en -programma:
[TechCrunch over YouTube's AI-beleidsverduidelijking](https://techcrunch.com/2026/07/20/youtube-clarifies-policies-around-ai-slop-and-upsetting-videos/) ·
[AIR Media-Tech, tijdlijn monetisatiewijzigingen 2026](https://air.io/en/monetization/youtube-monetization-policy-changes-2026-a-complete-dated-timeline) ·
[auditsocials, inauthentic content policy](https://www.auditsocials.com/blog/youtube-inauthentic-content-policy-2026-mass-produced-ai-generated-monetization-creators-brands) ·
[ScaleLab, AI-crackdown 2026](https://scalelab.com/en/why-youtube-is-cracking-down-on-ai-generated-content-in-2026) ·
[AIR Media-Tech, YPP-vereisten 2026](https://air.io/en/monetization/youtube-partner-program-requirements-2026-the-complete-guide) ·
[vidIQ, YPP-gids](https://vidiq.com/blog/post/youtube-partner-program-guide/) ·
[minimatters, disclosurebeleid](https://minimatters.com/youtube-altered-or-synthetic-content-disclosure/) ·
[Influencer Marketing Hub, AI-disclosureregels per platform](https://influencermarketinghub.com/ai-disclosure-rules/)

YouTube API:
[Phyllo, quotalimieten](https://www.getphyllo.com/post/youtube-api-limits-how-to-calculate-api-usage-cost-and-fix-exceeded-api-quota) ·
[SocialCrawl, Data API 2026](https://www.socialcrawl.dev/blog/youtube-data-api-2026) ·
[Elfsight, Data API v3 limieten](https://elfsight.com/blog/youtube-data-api-v3-limits-operations-resources-methods-etc/)

Prijzen:
[BIGVU, ElevenLabs-prijzen 2026](https://bigvu.tv/blog/elevenlabs-pricing-2026-plans-credits-commercial-rights-api-costs/) ·
[Flexprice, ElevenLabs-plannen en overages](https://flexprice.io/blog/elevenlabs-pricing-breakdown) ·
[buildmvpfast, videogeneratie-API-kosten](https://www.buildmvpfast.com/api-costs/ai-video) ·
[Apiframe, AI-video-API-prijzen 2026](https://apiframe.ai/blog/ai-video-api-pricing-2026) ·
[Wireflow, Creatomate versus Shotstack](https://www.wireflow.ai/blog/creatomate-vs-shotstack) ·
[Renderly, video-API's vergeleken](https://renderly.video/blog/best-video-apis-for-developers-compared)

RPM en niches:
[OutlierKit, RPM-data per niche](https://outlierkit.com/blog/most-profitable-youtube-niches) ·
[vidIQ, CPM en RPM per categorie](https://vidiq.com/blog/post/most-profitable-youtube-niches/) ·
[fluxnote, RPM per niche VS 2026](https://fluxnote.io/guides/youtube-rpm-by-niche-usa-2026)

Claude API: de `claude-api`-skillreferentie in deze sessie (status **A**).
