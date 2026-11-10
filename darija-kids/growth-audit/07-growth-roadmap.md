# 07 — Groeiplan, geprioriteerd

## De vijf die het verschil maken

Niet honderd ideeën. Deze vijf, in deze volgorde. Alles daaronder staat verder
in dit document.

| # | Wat | P | Impact | Werk | Meetbaar via |
| --- | --- | --- | --- | --- | --- |
| 1 | Eerstelijns trechtermeting | **P0** | hoog, indirect | 1–2 dagen | de meting zelf |
| 2 | Campagneparameters op elke winkellink | **P0** | hoog, indirect | 2 uur | ASC Campaigns, Play Acquisition |
| 3 | Eén complete unit gratis | **P1** | hoog, direct | 1 dag incl. tests | deelkaarten, beoordelingen, conversie |
| 4 | Dagelijkse herinnering standaard aan | **P1** | middel–hoog | 1 uur | dag-2-retentie |
| 5 | Positioneren als kindercursus | **P1** | middel–hoog | 1 dag, geen code | bezoek per vertoning |

De eerste twee leveren zelf geen omzet op. Ze zijn P0 omdat zonder hen elke
volgende beslissing een gok is en elke uitkomst onleesbaar. Nummer 3 is de
enige ingreep die tegelijk conversie, retentie, de virale lus en de ASO raakt.

---

## 1 — Eerstelijns trechtermeting (P0)

**Wat.** Anonieme, geaggregeerde tellers via de eigen Cloudflare Worker. Geen
gebruikersidentiteit, geen apparaat-id, geen kinddata. Een handvol namen
(`les_af:hruf-1`, `gratis_op`, `aanbod_zien`, `aanbod_later`, `paywall_zien`,
`koop_start`, `dag2`), een datum, een taal en een platform. Ontwerp in
`08-metrics-experiments.md`.

**Probleem.** Geen enkele meting van gebruikersgedrag bestaat. **BEWEZEN** —
een grep over `src/` en `server/` vindt alleen de privacyverklaring die zegt
dat er geen analytics is.

**Onderbouwing.** Vijf van de acht vragen in `03-conversion-audit.md` zijn
**ONBEKEND** en achteraf niet op te halen.

**Impact.** Op omzet: nul, direct. Op elke andere beslissing: bepalend.

**Werk.** Eén à twee dagen. De bouwstenen staan er: `server/` is een Worker
met migraties, `src/engine/post.ts` is een bestaande, gedocumenteerde weg naar
buiten.

**Risico en afhankelijkheden.** Eén echt risico: **de Kinderen-categorie
verbiedt analytics van derden.** Eerstelijns en anoniem mag, maar het ontwerp
moet dat kunnen aantonen — geen identificatie, geen profiel, niets dat aan een
kind te koppelen is. De privacyverklaring (`src/i18n/privacy.ts`) moet mee, in
zes talen. Dat is niet optioneel en het is het halve werk.

**Meetbaar.** Het bestaan van de cijfers is het resultaat.

## 2 — Campagneparameters (P0)

**Wat.** `?ct=<campagne>` op de Apple-link, `&referrer=utm_source%3D...` op de
Play-link, gegenereerd door één functie in `src/site/links.ts`. En een vaste
afspraak hoe campagnes heten.

**Probleem.** De campagne van 3 november in meer dan vijftien groepen is
**voorgoed onmeetbaar**. **BEWEZEN** — `src/site/links.ts:16-18` draagt geen
parameter.

**Impact.** Hoog en blijvend: dit herhaalt zich bij elke post, elke film en
straks bij de creator-code.

**Werk.** Twee uur, inclusief een test die vergeet-bescherming geeft.

**Risico.** Geen. Beide winkels ondersteunen dit gratis en het verandert niets
aan de app.

**Meetbaar.** ASC → Acquisition → Campaigns; Play Console → Acquisition
reports.

## 3 — Eén complete unit gratis (P1)

**Wat.** `GRATIS_LESSEN` van `{ hruf: 3, groeten: 1 }` naar
**`{ hruf: 8, groeten: 5 }`**: de alfabet-unit én de groeten-unit, 13 van de
74 lessen.

Nagerekend, want de nette keuze werkt niet: `hruf` alleen bevat **nul
woorden** — het zijn de 28 letters — en dan vuurt de deelkaart nog steeds
niet. Mét `groeten` erbij komt het op 27 woorden en 2 diploma's, en gaan
beide loops open. **BEWEZEN.**

**Probleem.** Drie tegelijk: 7 woorden is geen beslisgrond, de deelkaart is
onbereikbaar (25 woorden nodig), het beoordelingsverzoek is onbereikbaar
(1 diploma nodig, 0 haalbaar). **BEWEZEN** — zie `03-conversion-audit.md`.

**Onderbouwing.** De knik van 24% naar 7,6% bezoek per vertoning valt samen
met de verschuiving van warm naar koud publiek (**BEWEZEN**,
`docs/STAND.md`). Dat een compleet gratis stuk koud publiek wél overtuigt, is
**HYPOTHESE**.

**Impact.** De hoogste van alle vijf, en de enige die vier dingen tegelijk
raakt.

**Werk.** Eén dag. Eén constante, en dan de tests eromheen
(`gratisop.test.ts`, `pad.test.ts`, `delen.test.ts`, `beoordeling.test.ts`)
nalopen en bijwerken.

**Risico.** Omzetverlies van mensen die nu betalen voor wat straks gratis is:
13 van 74 lessen (17,6%) en 27 van 303 woorden (8,9%). Wat het begrenst is dat
de overige vijftien units intact blijven. Tweede risico: de muur verschuift
van les 5 naar les 14, en of de ouder daar nog dezelfde beslisbereidheid heeft
is **ONBEKEND** — precies wat meting 1 zou laten zien.

**Meetbaar.** Aantal getoonde deelkaarten, aantal getoonde
beoordelingsverzoeken, aantal winkelbeoordelingen (zichtbaar in beide
consoles), en de conversie uit meting 1.

## 4 — Herinnering standaard aan (P1)

**Wat.** In stap 4 van het welkomstscherm de schakelaar vóóraangevinkt, nog
steeds zichtbaar en uit te zetten. `src/engine/store.ts:512`.

**Probleem.** Een product met de belofte "twee minuten per dag" heeft zijn
dagelijkse herinnering standaard uit staan. **BEWEZEN.**

**Onderbouwing.** Dat retentie hieraan hangt is **HYPOTHESE** — en wel een
die na meting 1 te controleren is.

**Impact.** Middel tot hoog. Elke terugkeer is een nieuwe kans dat de ouder
bij het slot komt.

**Werk.** Eén uur.

**Risico.** Twee, en ze moeten eerlijk benoemd worden. Dit is een nudge, en
het grenst aan een donker patroon. Wat het acceptabel houdt: de schakelaar
blijft zichtbaar en uitzetbaar op hetzelfde scherm, en zowel iOS als Android
vragen daarna nóg een keer om toestemming op systeemniveau. De ouder zegt dus
twee keer ja. Tweede risico: wie de melding ongewenst vindt, geeft daar soms
een slechte beoordeling voor — en beoordelingen zijn hier schaars.

**Meetbaar.** Dag-2- en dag-7-terugkeer uit meting 1; het aandeel dat de
schakelaar uitzet.

## 5 — Positioneren als kindercursus (P1)

**Wat.** Winkelteksten, ondertitels, website en de volgende film verschuiven
van *"Marokkaans-Arabisch leren"* naar het probleem van de ouder, met de
cursusomvang als bewijs. Uitgewerkt in `06-competitor-analysis.md`.

**Probleem.** De huidige belofte zet het product naast Darija-apps voor
volwassenen van € 19,99 per jaar, waar € 59,99 duur lijkt. Naast Dinolingo
($ 199) is het goedkoop. **BEWEZEN** voor de prijzen; dat de plank het verschil
maakt is **HYPOTHESE**.

**Impact.** Middel tot hoog, en het kost geen code.

**Werk.** Eén dag tekst, in zes talen.

**Risico en afhankelijkheid.** Apple wees 1.0 twee keer af omdat de ondertitel
zei dat de app voor kinderen is terwijl hij niet in de Kinderen-categorie
stond. **Die reden is weg** — hij staat er nu in (*Made for Kids*, 6–8),
`docs/APPLE-2.3.8.md`. Maar het is een goedgekeurde regel die opnieuw ter
beoordeling gaat, dus dit hoort bij een release die om andere redenen toch
wordt ingediend. **Afhankelijk van 1.6.**

**Meetbaar.** Bezoek per vertoning (nu 7,6%) en download per bezoek (nu
78,9%), afgelezen in ASC.

---

## Fase A — eerste 7 dagen (t/m 17 november)

Focus: meetbaarheid en de twee vragen die vandaag al in de consoles staan.

| | Wat | Wie |
| --- | --- | --- |
| P0 | Campagneparameters bouwen en in gebruik nemen | ik |
| P0 | Trechtermeting bouwen, inclusief privacyverklaring in zes talen | ik |
| P0 | **Opzoeken: wat was de negatieve weekbalk van ≈ US$ −50?** ASC → Payments and Financial Reports, week 2–8 nov | Adil |
| P0 | **Opzoeken: proefconversie.** ASC → Subscriptions → Trial conversion. Dit is het enige echte conversiecijfer dat nú al bestaat | Adil |
| P0 | **Opzoeken: Play installaties → eerste keren openen.** 39 tegen 17 is inconsistent met 38 actieve toestellen; uitzoeken welk getal klopt | Adil |
| P1 | Herinnering standaard aan | ik |
| P1 | De Apple-ontwikkelaarsovereenkomst accepteren — **dit blokkeert elke inzending** | Adil |
| P1 | De nieuwe leeftijdsvragen over sociale media beantwoorden | Adil |

Die vier "opzoeken"-regels zijn samen een half uur werk en leveren cijfers op
die ik niet kan halen. De proefconversie is de belangrijkste: dat is het enige
getal dat vandaag al bestaat en dat niemand heeft bekeken.

## Fase B — dag 8 t/m 14 (18 t/m 24 november)

Focus: de gratis ervaring en de release die het naar buiten brengt.

| | Wat |
| --- | --- |
| P1 | Eén complete unit gratis, met de tests eromheen |
| P1 | De 28 klankbeschrijvingen van het alfabet lokaliseren (28 × 5 = 140 regels). Duitsland en Frankrijk hebben elk twee aankopen; die klanten lezen nu Nederlands |
| P1 | Nieuwe winkelteksten en ondertitels, zes talen |
| P1 | De nieuwe zoekwoorden uit `store/keywords.md` |
| P1 | **1.6 bouwen en indienen** — dit draagt alles hierboven |
| P2 | De twee aanbiedingscodes in de consoles aanmaken voor de creator-samenwerking |

1.6 is de spil van deze week. De zoekwoorden, de teksten en de nieuwe gratis
grens kunnen alle drie niet live zonder.

## Fase C — dag 15 t/m 30 (25 november t/m 10 december)

Focus: herhaalbare acquisitie, met leesbare uitkomst.

| | Wat |
| --- | --- |
| P1 | België: dezelfde films en teksten, Nederlands én Frans, **met campagnelinks** |
| P1 | De creator-code live, met eigen campagneparameter |
| P2 | Frankrijk: tweede ronde groepen, per groep een eigen campagnenaam |
| P2 | Eén deadline-bericht testen ("deze zomer naar Marokko") tegen het huidige bericht |
| P2 | Eén mail aan bestaande aangemelde ouders over de boekenreeks — **eerst nagaan hoeveel adressen er zijn**; onder de tien is dit geen experiment |
| P3 | Apple Search Ads op de eigen merknaam, paar euro per dag, als verzekering |

Aan het eind van deze fase moet de trechter voor het eerst volledig leesbaar
zijn voor minstens één cohort.

## Fase D — dag 31 t/m 90 (december t/m februari)

Nu pas is er iets te besluiten.

**Opschalen wat werkte.** Welke markt, welk bericht, welk kanaal — dat staat
dan in de campagnecijfers. Meer van dat, in de volgende markt (Frankrijk of
Spanje, de twee grootste).

**Dan de twee experimenten die nu te vroeg zijn:**

| | Wat | Waarom nu wel |
| --- | --- | --- |
| P2 | Gezinsontgrendeling voor eenmalig bedrag (€ 89–99) | Vereist ≈ 30 aankopen voor een leesbare verdeling; bij het huidige tempo duurt dat te lang |
| P2 | Het web-woordenboek: 331 pagina's uit bestaande inhoud, zes talen | Het enige kanaal dat doorwerkt zonder maandelijkse inspanning, en het duurt maanden voordat het rankt — dus eerder beginnen dan nodig lijkt |
| P3 | De volwassen diaspora als tweede doelgroep testen | Eén winkeltekst en één film; pas zinvol als de eerste doelgroep leesbaar is |

**Niet vergeten, met een deadline van buiten:**

| | Wat | Wanneer |
| --- | --- | --- |
| P1 | Handelaarsstatus (DSA) bij Google verklaren | **vóór februari** |
| P1 | De Ierse belastinggegevens bij Google aanvullen | zo snel mogelijk |

## Wat hij per direct moet stoppen

- **Nieuwe films maken.** Er zijn er negen en **ONBEKEND** of ze iets
  opleveren, want de links dragen geen parameter. Film tien verandert dat
  niet. Hervatten zodra meting 2 staat.
- **In meer groepen posten zonder campagnelink.** Dat is tijd inruilen voor
  bereik en de bon weggooien.
- **Nadenken over de prijs verlagen.** 3,4% van de downloads betaalt en 31%
  kiest het duurste plan. Er is geen enkele aanwijzing dat de prijs de
  blokkade is.

## Beslismoment: doorgroeien, bijsturen of pivoten

Op **10 februari 2027**, met drie maanden meetbare cijfers. Niet eerder, en
met deze drempels vooraf vastgelegd zodat ze niet achteraf worden
goedgepraat:

| Uitkomst | Besluit |
| --- | --- |
| Downloads **> 20 per dag** uit een herhaalbaar kanaal, en betaalde conversie ≥ 3% | **Doorgroeien.** Budget naar het kanaal dat werkte, en pas dan betaalde advertenties. |
| Downloads 8–20 per dag, of conversie 1,5–3% | **Bijsturen.** Het kanaal werkt deels; de boodschap of de gratis grens is nog niet goed. Nog één ronde van 90 dagen. |
| Downloads **< 8 per dag** na drie maanden met werkende meting en drie geteste kanalen | **Pivoten.** Dan is de hypothese dat ouders dit kopen niet houdbaar. De richting is dan de volwassen diaspora en/of de boekenreeks als hoofdproduct — niet een nieuwe app. |

Eén waarschuwing bij die tabel: bij deze aantallen is elk percentage
onbetrouwbaar. Zes betaalde plannen betekent dat één extra klant de conversie
met 17% verandert. De downloads per dag zijn het stabielste getal en horen
daarom het zwaarst te wegen in het besluit.
