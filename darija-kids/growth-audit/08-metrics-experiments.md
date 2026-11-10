# 08 — KPI's, meting en experimenten

## Wat er nu is, en wat niet

| KPI | Nu beschikbaar? | Waar |
| --- | --- | --- |
| Vertoningen, paginabezoeken, downloads | **ja** | ASC → Acquisition |
| Downloads per bron (Search / Browse / Referrer) | **ja, niet gebruikt** | ASC → Acquisition → Sources |
| Downloads per campagne | **nee** | vereist campagnelinks |
| Aankoopgebeurtenissen, actieve en betaalde plannen | **ja** | ASC → Subscriptions |
| **Proefconversie** | **ja, nooit bekeken** | ASC → Subscriptions → Trial conversion |
| Churn, verlengingen | **ja**, maar nog geen verlenging geweest | ASC → Subscriptions |
| Omzet, uitbetaling, terugbetalingen | **ja** | ASC → Sales and Trends, Payments |
| MRR, ARPU | afleidbaar | uit het bovenstaande |
| Bezoeker → registratie | **n.v.t.** | er is geen registratie |
| Openen → eerste les af | **nee** | vereist meting in de app |
| Eerste les → bij het slot (les 5) | **nee** | idem |
| Paywall gezien → aankoop gestart | **nee** | idem |
| Retentie dag 2 / 7 / 30 | **nee** in de app; ruw bij Play | idem / Play Console |
| Tijd tot eerste waardevolle resultaat | **nee** | idem |
| CAC | **nee** | er wordt niets betaald voor verkeer |
| LTV | **nee, en nog niet te schatten** | geen enkele verlenging |

**BEWEZEN** — de grep in `02-technical-audit.md` toont dat er geen meting in
de app zit; de consolecijfers staan in `docs/STAND.md`.

Twee dingen vallen hier op. **De proefconversie bestaat al en niemand heeft
ernaar gekeken.** Dat is het enige echte conversiecijfer dat vandaag te halen
is, en het beslist of de drie dagen proef werken. En **LTV is niet te
schatten**: er is nog geen enkele verlenging geweest, dus elke LTV in een
spreadsheet zou verzonnen zijn.

## De zes KPI's die voor dit product gelden

Niet de hele lijst uit de masterprompt. Deze zes, omdat ze bij dit product
iets beslissen:

1. **Downloads per dag.** Het stabielste getal en de echte beperking. Nu: 3,0.
2. **Bezoek per vertoning.** Zegt of de boodschap en de zoekwoorden kloppen.
   Nu: 7,6%, gezakt van 24%.
3. **Openen → eerste les af.** De activatie. Nu **ONBEKEND**.
4. **Betaalde conversie** (betaalde plannen / downloads). Nu: 3,4%.
5. **Proefconversie** (proef → betalend). Nu **ONBEKEND**, maar opvraagbaar.
6. **Dag-7-terugkeer.** De retentie die de tweede koopkans maakt. Nu
   **ONBEKEND**.

Drie van de zes zijn onbekend. Dat is de reden dat meting P0 is.

## Het ontwerp van de meting

Harde eis: de app staat in Apples **Kinderen-categorie**, waar analytics van
derden verboden zijn. Dus geen Firebase, geen PostHog, geen Sentry. Eerstelijns
en anoniem.

**Wat er over de lijn gaat, en niets anders:**

```
POST /tel
{
  "t":  "les_af:hruf-1",     de naam van de gebeurtenis
  "d":  "2026-11-18",        de dag, niet het tijdstip
  "l":  "nl",                de interfacetaal
  "p":  "ios",               ios | android
  "v":  "1.6"                de appversie
}
```

**Wat er niet in zit, en niet in mag komen:** geen gebruikers-id, geen
apparaat-id, geen sessie-id, geen IP-adres dat bewaard wordt, geen naam, geen
leeftijd, niets van het kind. De server telt op en bewaart alleen het totaal
per dag, per taal, per platform. Er valt dus niets te herleiden, ook niet door
ons.

Dat maakt één analyse onmogelijk die gewone analytics wel kan: een trechter
per persoon volgen. We zien dat er 100 keer les 1 is afgemaakt en 40 keer het
slot is bereikt, maar niet of dat dezelfde mensen zijn. **Dat is de prijs, en
hij is in deze categorie niet te omzeilen.** Voor cohortretentie betekent het
dat we op dagtotalen moeten rekenen in plaats van op individuen — ruwer, en
genoeg om een verbetering van 10% te zien.

**De gebeurtenissen, compleet:**

| Naam | Wanneer |
| --- | --- |
| `start` | de app is geopend (één keer per dag per toestel, lokaal ontdubbeld) |
| `welkom_af` | het welkomstscherm is doorlopen |
| `aanbod_zien` | het aanbodscherm is getoond |
| `aanbod_later` | er is op "later" gedrukt |
| `les_af:<id>` | een les is afgerond |
| `gratis_op` | de laatste gratis les is af |
| `paywall_zien` | `/volledig` is geopend |
| `koop_start` | de aankoop is gestart |
| `deel_zien` / `deel_klik` | de deelkaart |
| `beoord_zien` | het beoordelingsverzoek |

Tien namen. Geen funnel-SDK, geen dashboardproduct — een tabel in de bestaande
D1-database van `server/` en een query. Dat is bewust karig: dit is een
meetinstrument, geen analyticsplatform.

**Wat er mee moet:** de privacyverklaring in `src/i18n/privacy.ts`, in alle
zes de talen, en de Apple-privacyvragen in App Store Connect. Dat is geen
formaliteit — de verklaring zegt nu dat er niets gemeten wordt, en dat zou
dan niet meer kloppen.

## Hoe het mis kan gaan, en wat dat betekent

Twee eerlijke beperkingen die vooraf genoemd horen te worden:

- **Een toestel zonder netwerk telt niet mee.** De app werkt offline. Een
  gebeurtenis die niet verstuurd kan worden is verloren, tenzij er een
  wachtrij bij komt — en dat is complexiteit die ik voor versie één niet
  aanraad. Gevolg: de absolute aantallen zijn een ondergrens, geen waarheid.
  Voor het vergelijken van weken is dat prima; voor "hoeveel mensen zijn er"
  niet.
- **Dagtotalen, geen personen.** Zie hierboven. De conversie tussen twee
  stappen is een verhouding tussen twee totalen, niet een gemeten overgang.

Die twee beperkingen zijn de reden dat de consolecijfers de baas blijven voor
omzet en downloads. De eigen meting is er voor wat de consoles niet zien: wat
er *binnen* de app gebeurt.

## De experimenten, met steekproef en onzekerheid

De moeilijkheid bij dit product is niet het bedenken van experimenten maar het
aantal. Zes betaalde plannen. Eén klant erbij verandert de conversie met 17%.

**Wat dat betekent, concreet:** om een conversieverbetering van 3,4% naar 5%
met redelijke zekerheid aan te tonen, zijn per variant honderden downloads
nodig. Bij 3 per dag is dat maanden. **Een A/B-test op conversie is bij dit
volume niet uitvoerbaar, en wie het toch doet leest ruis.**

Daarom zijn de experimenten hieronder op twee soorten gesorteerd.

### Soort 1 — eenrichtingsverbeteringen (geen test, wel meten)

Dingen die aantoonbaar kapot zijn. Daar test je niet op, die repareer je, en
daarna kijk je of het getal bestaat.

| Wat | Wat er daarna waar moet zijn |
| --- | --- |
| Eén complete unit gratis | `deel_zien` > 0 en `beoord_zien` > 0. Nu zijn ze bewijsbaar 0 |
| Herinnering standaard aan | aandeel dat uitzet < 50%; dag-7-terugkeer meetbaar |
| Campagneparameters | ASC Campaigns toont ten minste één benoemde bron |

Dat eerste is een scherp criterium: die twee tellers kunnen vandaag niet
boven nul komen, hoe goed het product ook is. Als ze dat na de wijziging wel
doen, is een kapot mechanisme gerepareerd. Dat is geen percentage dat
geïnterpreteerd moet worden.

### Soort 2 — echte experimenten (hoog in de trechter, waar de aantallen zijn)

Alleen bovenaan de trechter zijn er genoeg mensen om iets te meten.
Vertoningen gaan in de duizenden.

**Experiment 1 — de boodschap**

- **Hypothese:** een belofte over het probleem van de ouder ("zodat je kind
  oma begrijpt") levert meer paginabezoeken per vertoning dan een belofte over
  de functie ("Marokkaans-Arabisch leren").
- **Meting:** bezoek per vertoning. Nu 7,6%.
- **Steekproef:** bij ≈ 50 vertoningen per dag is 7,6% ongeveer 4 bezoeken per
  dag. Om een stijging naar 11% aan te tonen zijn ruim **1.400 vertoningen per
  variant** nodig — ongeveer vier weken per variant.
- **Hoe:** niet gelijktijdig A/B (de App Store laat dat niet per ondertitel
  toe zonder Product Page Optimization, en dat vereist voldoende verkeer). Dus
  sequentieel: vier weken oud, vier weken nieuw, en het seizoenseffect
  eerlijk als onzekerheid benoemen.
- **Eerlijke waarschuwing:** sequentieel testen in december en januari zet een
  kerstvakantie tegen een gewone maand. De uitkomst is richtinggevend, niet
  bewijzend.

**Experiment 2 — de deadline**

- **Hypothese:** een bericht met een aanleiding in de tijd ("deze zomer naar
  Marokko", "oma wordt 80") levert meer doorklikken dan een bericht zonder.
- **Meting:** downloads per campagneparameter. Dit kan pas ná P0 nummer 2.
- **Steekproef:** twee groepen van vergelijkbare omvang, zelfde dag, twee
  campagnenamen. Dit is het best meetbare experiment in het hele document,
  omdat Facebook-groepen gelijktijdig te bespelen zijn.
- **Waarom dit de interessantste is:** `06-competitor-analysis.md` beargumenteert
  dat de pijn reëel maar niet urgent is. Als een deadline dat verandert, is dat
  de goedkoopste omzetstijging die er is.

**Experiment 3 — de markt**

- **Hypothese:** België levert per gedeelde post meer downloads dan Nederland,
  omdat het publiek er onaangeroerd is en beide talen werken.
- **Meting:** downloads per campagneparameter per land.
- **Steekproef:** vergelijkbaar aantal groepen, zelfde week, zelfde film.

## Het meetbare doel voor 30 dagen

Niet "meer omzet". Dat is bij zes klanten geen doel maar een wens.

> **Op 10 december 2026 is de volledige trechter van installatie tot aankoop
> leesbaar voor minstens 150 nieuwe installaties, en is van elke link die
> sinds 17 november is gedeeld bekend uit welke campagne hij kwam.**

Dat is te halen, het is eenduidig vast te stellen, en het is de voorwaarde
voor elk omzetdoel daarna.

Een omzetdoel erbij, met de onzekerheid erbij genoemd: **12 betaalde plannen
op 10 december** (nu 6). Dat is een verdubbeling, en bij deze aantallen is het
evengoed geluk als resultaat. Het staat er omdat een richtpunt helpt, niet
omdat het iets bewijst.

## Wat er vandaag al op te zoeken is

Deze vier kosten samen een half uur en ik kan er niet bij. Ze staan ook in
`07-growth-roadmap.md`, Fase A.

1. **Proefconversie.** ASC → Subscriptions → Trial conversion rate. Het enige
   echte conversiecijfer dat nu bestaat.
2. **De negatieve weekbalk** van ≈ US$ −50. ASC → Payments and Financial
   Reports, week 2–8 november. In het totaal zit geen gat (114/163 = 69,9%,
   exact Apple's 70/30), dus dit is waarschijnlijk één terugbetaling — maar
   dat moet vastgesteld worden, niet aangenomen.
3. **Play: installaties tegen eerste keren openen.** 39 acquisities, 17 eerste
   keren openen, 38 maandelijks actieve toestellen. Die drie kunnen niet
   allemaal waar zijn. Als de helft werkelijk nooit opent, is dat het grootste
   lek in het hele dossier.
4. **Hoeveel mailadressen** er via het ouderscherm zijn aangemeld. Bepaalt of
   het boekenexperiment een experiment is of een anekdote.
