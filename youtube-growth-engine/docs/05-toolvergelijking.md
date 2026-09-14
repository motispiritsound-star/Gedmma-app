# 05 — Toolvergelijking

> **Verificatiestatus.** Deze sessie kon de officiële documentatie van Google,
> ElevenLabs, Shotstack, Creatomate en de videogeneratoren niet bereiken: de
> egress-policy blokkeert die domeinen (HTTP 403). Alle prijzen hieronder komen
> uit websearch-resultaten van september 2026 en zijn **secundair**. Ze zijn
> bruikbaar om een ordegrootte te kiezen, niet om een contract op te baseren.
> Vóór M3 moet elk getal tegen de officiële prijspagina worden gehouden. Zie
> [`10`](10-bronnen-en-verificatiestatus.md).

## Uitsluitingscriteria

Een provider valt af, ongeacht kwaliteit of prijs, als:

- de voorwaarden commercieel gebruik van de output niet expliciet toestaan;
- invoer standaard voor modeltraining wordt gebruikt zonder opt-out;
- er geen verwerkersovereenkomst beschikbaar is;
- er geen bruikbare API is (alleen een webinterface).

---

## 1. Taalmodel — analyse, script, redactie, poorten

| | Claude API (aanbevolen) | Alternatief |
|---|---|---|
| Modellen en prijs | Opus 5 $5/$25 per miljoen tokens in/uit; Sonnet 5 $2/$10; Haiku 4.5 $1/$5 | Vergelijkbare klasse bij andere aanbieders |
| Prompt caching | Ja — cache-reads ~10% van de inputprijs. Cruciaal: de onderzoeksbrief wordt door zes stappen heen hergebruikt | |
| Batch-korting | 50% voor niet-latencygevoelig werk. Poorten en analyses lenen zich hiervoor | |
| Contextvenster | 1M tokens — een volledige onderzoeksbrief plus tien referentie-analyses passen in één aanroep | |
| Gestructureerde output | Ja, met schema-validatie. Poortuitslagen komen als getypeerd object binnen, niet als tekst die geparsed moet worden | |

**Modeltoewijzing per stap** — dit is waar het kostenverschil tussen de
scenario's in [`02`](02-niche-en-businessmodel.md) vandaan komt:

| Stap | Model | Waarom |
|---|---|---|
| Referentie-analyse | Sonnet 5 | Patroonherkenning, veel invoer, weinig oordeel |
| Stelling en invalshoek | **Opus 5** | Dit is de stap die bepaalt of de video bestaansrecht heeft |
| Onderzoeksbrief | Opus 5 + websearch | Bronkwaliteit is een poort van 90%; hier niet bezuinigen |
| Script | **Opus 5** | De kernoutput |
| Factcheck | Opus 5 | Aparte aanroep, aparte context — een model dat zijn eigen werk nakijkt is geen factcheck |
| Originaliteit | Sonnet 5 + embeddings | Vergelijking, deels rekenwerk |
| Retention review | Opus 5 | Vraagt oordeel over ritme en spanning |
| Metadata, hoofdstukken, tags | Haiku 4.5 | Mechanisch |
| Trust- en policygate | Opus 5 | De laatste inhoudelijke stop vóór jou |

Twee ontwerpregels die belangrijker zijn dan de modelkeuze:

1. **Factcheck en originaliteit draaien in een schone context**, zonder het
   script-gesprek. Anders checkt het model zijn eigen redenering na.
2. **Elke poort geeft deelscores met onderbouwing.** Een kaal getal is niet
   controleerbaar en niet verbeterbaar.

## 2. YouTube Data API — upload en planning

Verplicht, geen alternatief. Officiële API, OAuth 2.0, scope `youtube.upload`.

Over de quota-kosten lopen de bronnen sterk uiteen: oudere documentatie noemt
1.600 eenheden per upload op een dagbudget van 10.000, terwijl bronnen uit 2026
melden dat uploads naar een aparte bucket zijn verplaatst met een veel lagere
kostprijs en een limiet van circa 100 uploads per dag [bron: secundair,
tegenstrijdig]. **Dit is een van de belangrijkste te verifiëren punten.**

Het maakt voor ons plan gelukkig weinig uit: bij maximaal één publicatie per dag
zitten we ruim onder elke variant van de limiet. De implementatie meet het
verbruik hoe dan ook zelf en alarmeert op 80%, in plaats van op een aangenomen
getal te vertrouwen.

- Resumable uploads voor grote bestanden.
- `status.privacyStatus = 'private'` in `APPROVAL_MODE`, met
  `publishAt` voor inplannen na goedkeuring.
- `captions.insert` voor het SRT-bestand.
- `thumbnails.set` los van de upload, zodat een thumbnailwissel geen
  her-upload is.

## 3. YouTube Analytics API — prestaties

Scope `yt-analytics.readonly`. Dagelijkse ophaling, per video en per kanaal.
Retentiecurves per video zijn hier de kern: die voeden de vergelijking tussen
voorspelde en werkelijke retentie.

Let op: sommige metrics (met name opbrengsten) hebben een vertraging van
meerdere dagen en worden later bijgesteld. Het datamodel slaat metrics daarom op
met `as_of`-datum en overschrijft niet — anders vergelijk je later
voorlopige met definitieve cijfers.

## 4. Voice-over

| | ElevenLabs (aanbevolen) | Alternatieven |
|---|---|---|
| Prijs | TTS $0,10 per 1.000 tekens (v3 / Multilingual v2), $0,05 voor Flash/Turbo [secundair] | Google Cloud TTS, Azure Speech: goedkoper, doorgaans minder natuurlijk in het Nederlands |
| Commerciële rechten | Vanaf het Starter-plan ($6/maand); het gratis plan heeft géén commerciële licentie [secundair] | Wisselend — controleren |
| Nederlands | Sterk in Multilingual v2 | Google/Azure: bruikbaar, vlakker |
| API | Volwassen, streaming, timestamps per teken | |

Die timestamps per teken zijn het echte selectiecriterium: daarmee komt de
ondertiteling exact uit de TTS zelf, zonder aparte spraakherkenning. Dat scheelt
een stap, een provider en een foutbron.

**Voor Nederlandstalige productie is een stemtest verplicht vóór de keuze.**
Nederlands is de taal waarin synthetische stemmen het snelst ontmaskerd worden,
en geen enkele specificatie voorspelt dat. Dat is een menselijke handeling die
niet weg te automatiseren is.

## 5. Beeldgeneratie

Prijzen liggen rond $0,02–0,08 per beeld voor de bruikbare modellen. Selectie op
drie punten:

- **Commercieel gebruik expliciet toegestaan** — uitsluitingscriterium.
- **Stijlconsistentie over tientallen beelden heen.** Dit is het criterium waar
  de meeste generatoren op vallen en dat je pas merkt bij video vijf, als het
  kanaal er opeens uit ziet alsof drie makers eraan werkten.
- **Tekst in beeld.** Thumbnails met leesbare tekst; modellen verschillen hier
  enorm.

Het systeem bewaart per beeld de prompt, het model en de versie. Bij een
providerwissel is dat het enige wat de stijlcontinuïteit redt.

## 6. Generatieve video

Dit is de duurste en risicovolste post. Prijzen lopen van circa $0,05 tot $0,75
per seconde, met een tienvoudig verschil tussen de goedkoopste en de duurste
modellen [bron: secundair].

**Rekenvoorbeeld dat de architectuurkeuze bepaalt.** Een video van 9 minuten is
540 seconden. Volledig generatief, bij $0,10/seconde, kost dat **$54 per
video** — meer dan alle andere kosten samen, vier keer over.

**Daarom: stills en motion graphics als basis, generatieve clips als accent.**
30 tot 45 seconden per long-form video, ingezet waar beweging echt iets
toevoegt. Dat brengt de post terug naar $3–7 en is bovendien redactioneel beter:
een datagrafiek die opbouwt terwijl de voice-over het cijfer noemt houdt kijkers
langer vast dan een generieke sfeerclip.

De `VideoClipProvider`-adapter maakt de keuze omkeerbaar. Wordt generatieve
video volgend jaar tien keer goedkoper, dan is dat een configuratiewijziging.

## 7. Muziek en geluid

Abonnement bij een bron met expliciete commerciële licentie (Artlist, Epidemic
Sound of vergelijkbaar), €10–25 per maand, ongelimiteerd gebruik. Goedkoper per
video dan losse licenties zodra je meer dan twee video's per maand maakt.

Het licentiebewijs wordt als `LicenseProof`-record naast het bestand opgeslagen.
Bij een claim op YouTube is dat het enige dat telt, en dan wil je het niet in een
mailbox hoeven zoeken.

## 8. Montage

| | FFmpeg zelf gehost (aanbevolen) | Shotstack | Creatomate |
|---|---|---|---|
| Prijs | Alleen rekenkracht, ~€0,05–0,20 per video | Vanaf $49/maand voor 200 minuten 720p, ≈$0,25 per minuut [secundair] | Vanaf $41/maand voor 144 minuten [secundair] |
| Controle | Volledig | Via JSON-sjabloon | Via JSON-sjabloon |
| Sjabloonrisico | Geen | **Reëel** | **Reëel** |
| Complexiteit | Hoogste | Laag | Laag |

De gehoste diensten zijn sneller op te zetten, maar sjabloongestuurde montage is
precies wat het inauthentic-content-beleid beschrijft: "video's die een sjabloon
volgen met weinig variatie". Een systeem dat per video een eigen montagestructuur
kiest op basis van de shotlist, en dat ook per video kan verantwoorden, staat
juridisch én redactioneel sterker.

**Aanbeveling: FFmpeg als primaire renderer, Shotstack als adapter achter de
hand** voor als de eigen renderer een bottleneck wordt.

## 9. Orkestratie

| | BullMQ + eigen worker (aanbevolen) | n8n | Temporal |
|---|---|---|---|
| Past bij de stack | Ja — Node, Redis, al aanwezig | Aparte dienst | Aparte dienst, eigen SDK |
| Langlopende taken | Goed, met heartbeat | Matig | Uitstekend |
| Menselijke goedkeuring | Zelf bouwen (is toch maatwerk) | Ingebouwd, maar rigide | Signals, elegant |
| Versiebeheer van de flow | Gewoon code in git | Visueel, lastig te reviewen | Code |
| Complexiteit | Laag | Laag | Hoog |

n8n valt af omdat de goedkeuringsstap en de gate-engine het hart van het systeem
zijn en daar maatwerk vragen; die in een visuele flow proppen levert iets op dat
niet te reviewen en niet te testen is. Temporal is technisch de mooiste keuze
voor lange workflows, maar de bedrijfslast weegt niet op tegen het voordeel bij
ongeveer vijf producties per week. **BullMQ, met de state machine in Postgres
als bron van waarheid** — de wachtrij mag alles kwijtraken zonder dat een
productie verdwijnt.

---

## De twee stacks

### Aanbevolen stack — kwaliteit en schaalbaarheid

| Rol | Keuze |
|---|---|
| Taalmodel | Claude Opus 5 op oordeelsstappen, Sonnet 5 op analyse, Haiku 4.5 op mechanisch werk |
| Zoeken | Websearch via de Claude API, aangevuld met directe bevraging van primaire bronnen (CBS, RVO, Eurostat) |
| Voice-over | ElevenLabs Multilingual v2 of v3, Creator-plan |
| Beeld | Beeldgenerator met commerciële rechten en sterke stijlconsistentie — keuze ná een eigen vergelijkingstest |
| Video | Generatieve clips als accent, 30–45 s per long-form |
| Muziek | Abonnement met commerciële licentie |
| Montage | FFmpeg zelf gehost |
| Orkestratie | BullMQ + Redis |
| Database | PostgreSQL + Prisma |
| Opslag | S3-compatibel (Cloudflare R2 of Backblaze B2 — geen egress-kosten) |
| Hosting | Docker op Fly.io of Hetzner |

Kosten: zie het "realistisch"-scenario — circa **€178 per maand** bij 4,3
long-form en 8,7 Shorts.

### Pilotstack — goedkoop, om te leren of het werkt

| Rol | Keuze |
|---|---|
| Taalmodel | Sonnet 5 overal behalve stelling en script (Opus 5); batch-API waar mogelijk |
| Voice-over | ElevenLabs Flash/Turbo of Google Cloud TTS |
| Beeld | Goedkoopste generator met commerciële rechten |
| Video | **Geen generatieve video.** Stills, Ken Burns, datagrafieken, motion graphics |
| Muziek | Eén abonnement, maandelijks opzegbaar |
| Montage | FFmpeg lokaal |
| Orkestratie | BullMQ op één machine |
| Hosting | Eén VPS van €10–15 |

Kosten: het "optimistisch"-scenario, circa **€113 per maand**.

**Het verschil tussen de twee stacks is bijna volledig beeld.** De redactionele
kwaliteit — de stelling, het onderzoek, het script, de poorten — is in beide
stacks vrijwel gelijk. Dat is precies de goede volgorde: begin met de goedkope
beeldstrategie, en investeer pas in generatieve video als de analytics laten
zien dat retentie op beeld vastloopt en niet op inhoud.
