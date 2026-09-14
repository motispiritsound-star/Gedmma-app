# 09 — Risico's en beheersmaatregelen

Gesorteerd op verwachte schade × kans. De eerste drie zijn bestaansrisico's voor
het kanaal; de rest is hinder.

---

## 1. Het kanaal wordt gedemonetiseerd of beëindigd wegens inauthentic content

**Kans: reëel. Schade: totaal.** Dit is het enige risico dat alles in één klap
waardeloos maakt. In januari 2026 werden in één handhavingsgolf zestien kanalen
beëindigd met samen 4,7 miljard lifetime views [bron: secundair].

**Beheersing**

- Originaliteitspoort van 90, met **afstand tot onze eigen eerdere video's** als
  zwaarstwegende as. Sjabloondrift is de manier waarop een geautomatiseerd
  systeem hier vanzelf in loopt.
- Verplichte, invulbare stelling per video. Geen stelling, geen script — harde
  stop.
- Per video een originality brief die vastlegt *waarom* de video naast de
  referentie bestaansrecht heeft.
- Geen sjabloongestuurde montage; de shotlist bepaalt de structuur per video.
- Maximaal één publicatie per dag, volumeverhoging alleen bij aantoonbaar
  behouden kwaliteit.
- Menselijke eindgoedkeuring blijft standaard aan.

**Restrisico:** hoog en niet wegneembaar. Beleid kan strenger worden dan onze
poorten. Vroege waarschuwing: dalende impressions zonder dalende retentie.

---

## 2. Niemand kijkt

**Kans: hoog. Schade: alles wat je erin stopt.** Geen enkele automatisering
lost dit op. Tien goede video's kunnen stuk voor stuk 300 views halen.

**Beheersing**

- Pilot van tien video's vóór opschaling; stoppen is een uitkomst.
- Retention Readiness vóór publicatie, en na publicatie de vergelijking met de
  werkelijkheid — zodat je binnen tien video's weet of de voorspelling iets waard is.
- Eén variabele per experiment, zodat een resultaat interpreteerbaar is.
- Kostenplafond per maand: de schade is begrensd op wat je vooraf hebt ingesteld.

**Restrisico:** onverminderd hoog. Dit is geen technisch probleem en wordt er ook
geen.

---

## 3. Auteursrechtclaim of licentieprobleem

**Kans: laag bij naleving. Schade: strikes, verwijdering, in het ergste geval
beëindiging.**

**Beheersing**

- Geen enkel bestand van een andere maker komt het systeem binnen — geen video,
  geen thumbnail, geen ondertitel, geen framegrab.
- `license_proof_id` is `NOT NULL` op elke asset die in een render mag. Door de
  database afgedwongen, niet door een procedure.
- Alleen providers waarvan de voorwaarden commercieel gebruik expliciet
  toestaan; dit is een uitsluitingscriterium, geen weegfactor.
- Muziek uitsluitend met opgeslagen licentiebewijs.

**Restrisico:** laag, en vrijwel volledig herleidbaar tot menselijke fouten bij
het aanleveren van eigen materiaal.

---

## 4. Feitelijke fout in een gepubliceerde video

**Kans: middel. Schade: vertrouwen, en dat is het enige kapitaal van het kanaal.**

**Beheersing**

- Factcheck in een **schone context**, zonder het scriptgesprek — een model dat
  zijn eigen redenering nakijkt, checkt niets.
- Elke claim verplicht gekoppeld aan een geregistreerde bron; een claim zonder
  bron blokkeert de build.
- Source Confidence ≥ 90, bij gevoelige onderwerpen ≥ 95 met verplicht primaire
  bronnen.
- Menselijke goedkeuring, met bronnen zichtbaar naast het script.
- Correctieprocedure: gepinde reactie plus, bij een materiële fout, een
  bijgewerkte beschrijving — niet stilletjes de video vervangen.

**Restrisico:** middel. Taalmodellen produceren plausibele onwaarheden, en de
tweede controle is óók een taalmodel. De menselijke goedkeuring is hier de echte
poort, niet de automatische.

---

## 5. Providerprijs of -voorwaarden veranderen

**Kans: hoog over 12 maanden. Schade: kosten, of een gedwongen migratie.**

**Beheersing**

- Zeven provider-contracten met elk minstens twee implementaties plus een mock.
- Contracttests per adapter, zodat een vervanging aantoonbaar werkt vóór
  ingebruikname.
- Prompt, model en versie worden per gegenereerde asset opgeslagen — bij een
  providerwissel is dat het enige dat de stijlcontinuïteit redt.
- Kostenplafonds per dag en maand die de wachtrij pauzeren in plaats van stil
  door te belasten.

**Restrisico:** laag voor kosten, middel voor stijlcontinuïteit. Een nieuwe
beeldgenerator geeft het kanaal onvermijdelijk een ander gezicht.

---

## 6. Dubbele of mislukte uploads

**Kans: middel zonder maatregelen. Schade: rommelig kanaal, verspild quotum.**

**Beheersing:** idempotency-key uit `production_id` + `content_hash`; een tweede
upload van dezelfde inhoud geeft het bestaande `videoId` terug. Resumable
uploads. Quotameting met alarm op 80%. Dead-letter queue met alarm.

**Restrisico:** laag. Dit is een opgelost probleem zodra het goed gebouwd is —
en M4 is pas klaar als het bewezen is.

---

## 7. OAuth-token verloopt of wordt ingetrokken

**Kans: zeker, ooit. Schade: pipeline valt stil.**

**Beheersing:** versleutelde refresh-tokens, automatische vernieuwing, alarm bij
falen, en een handmatige herkoppelprocedure die in vijf minuten te doen is en in
de productiehandleiding staat.

**Restrisico:** laag, mits het alarm ergens aankomt waar je het ziet.

---

## 8. Kosten lopen uit de hand door hergeneratie

**Kans: middel. Schade: begrensd, mits de plafonds er zijn.**

Het scenario: een poort keurt structureel af door een fout in een prompt, en het
systeem probeert twintig keer opnieuw.

**Beheersing**

- Maximaal aantal hergeneraties per productie, daarna wachten op een mens.
- Plafonds per dag, per maand en **per productie**.
- Alarm wanneer een poort drie keer achtereen dezelfde reden afwijst — dat is
  een systematische fout in een prompt, geen drie slechte video's.
- De vier inhoudelijke poorten staan vóór de dure stappen; afwijzen op de
  stelling kost €0,20, afwijzen na de montage €12.

**Restrisico:** laag.

---

## 9. Synthetische stem klinkt onnatuurlijk in het Nederlands

**Kans: middel. Schade: kijkers haken in de eerste tien seconden af.**

**Beheersing:** verplichte menselijke stemtest vóór de providerkeuze. Geen enkele
specificatie voorspelt dit; het moet beluisterd worden. Uitspraakwoordenboek voor
vaktermen en eigennamen. Technische QC op onnatuurlijke uitspraak.

**Restrisico:** middel. Dit is een kwestie van smaak en het enige dat helpt is
luisteren.

---

## 10. AVG-tekortkoming

**Kans: laag bij het voorgestelde ontwerp. Schade: boete, reputatie.**

**Beheersing:** reactieteksten en auteursnamen worden niet opgeslagen; alleen
geaggregeerde, geanonimiseerde themaclusters. YouTube-data heeft een TTL van 30
dagen. Verwerkersovereenkomsten met elke AI-provider. Als het kanaal aan
Buurklus hangt, hoort dit als aparte verwerking in het bestaande register in
`docs/PRIVACY.md`.

**Restrisico:** laag.

---

## 11. Onjuiste of ontbrekende verificatie van de aannames in deze documenten

**Kans: zeker voor een deel. Schade: verkeerde ontwerpkeuzes.**

Deze sessie kon de officiële documentatie van Google, ElevenLabs en de
videoproviders niet bereiken (egress-policy, HTTP 403). Alle prijzen, quota's en
beleidsregels zijn secundair.

**Beheersing:** [`10`](10-bronnen-en-verificatiestatus.md) markeert elke claim
met een status. Verificatie van de prijzen is een **blokkerende voorwaarde voor
M3**, en verificatie van het YouTube-beleid voor M4.

**Restrisico:** middel tot het verificatiewerk is gedaan; daarna laag.

---

## Wat het risicoprofiel niet bevat

Geen enkel risico rond automatische engagement, gekochte views of
gemanipuleerde statistieken. Dat is geen belofte maar een gevolg van de
architectuur: met `youtube.upload` en `yt-analytics.readonly` als enige scopes
bestaat het codepad niet.
