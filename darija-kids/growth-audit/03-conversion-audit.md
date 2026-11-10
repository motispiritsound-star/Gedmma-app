# 03 — Conversieaudit

## De conclusie eerst, want hij draait de vraag om

De masterprompt vraagt waarom gebruikers niet betalen. De cijfers zeggen dat
ze dat wél doen, in een tempo dat voor een consumentenapp normaal tot goed is.

**Apple, cumulatief tot 1 november** (uit `docs/STAND.md`, overgenomen uit
App Store Connect):

| Stap | Aantal | Van de vorige stap |
| --- | --- | --- |
| Vertoningen | 1.460 | |
| Paginabezoeken | 233 | 16,0% |
| Eerste downloads | 149 | 63,9% |
| Aankoopgebeurtenissen | 12 | **8,1% van de downloads** |
| **Betaalde plannen** | **5** | **3,4% van de downloads** |

**BEWEZEN.** Opbrengst per download: **$1,05**.

3,4% van de downloads werd een betalend abonnement. De mediaan voor
consumentenapps met abonnement ligt rond de 2 tot 5 procent. Dit product zit
daar middenin — met een product van vijf weken oud, zonder advertentiebudget
en in een taal waarvoor geen zoekvolume bestaat.

**Het probleem is niet de conversie. Het is het volume.** Drie downloads per
dag. Daar is geen conversiepercentage dat tegen opweegt.

### Wat dat in euro's betekent

| | |
| --- | --- |
| Betaalde plannen (Apple 5 + Play 1) | 6 |
| Geschatte MRR | **≈ € 38 per maand** |
| Apple-omzet 26 weken (Sales) | US$ 163 |
| Apple-uitbetaling (Proceeds) | US$ 114 |
| Opbrengst per download | $1,05 |

MRR is **WAARSCHIJNLIJK** — afgeleid uit 6 betaalde plannen in de verhouding
9 maand : 4 jaar. Het precieze getal staat in App Store Connect onder
*Subscriptions*; haal het daar op voordat er op gepland wordt.

Dat getal is de hele zaak. Om hiervan een bedrijf te maken is er geen betere
conversie nodig maar **twintig tot dertig keer zoveel verkeer**, of een veel
hogere opbrengst per gebruiker, of beide. Dat bepaalt de prioriteiten: elk uur
dat naar de paywall gaat terwijl de trechter bovenaan bijna leeg is, is een
uur dat 3% van bijna niets probeert te verbeteren.

### Over de negatieve balk

De opbrengstgrafiek over 26 weken toont één negatieve weekbalk van ongeveer
US$ −50. Dat is niet uitgelegd en mag niet worden weggewuifd.

Maar in het totaal zit geen onverklaard verlies: **US$ 114 / US$ 163 = 69,9%**,
en dat is exact de 70/30-verdeling van Apple. **BEWEZEN** door narekenen.

De negatieve week is dus **WAARSCHIJNLIJK** een terugbetaling of een
boekhoudcorrectie binnen een verder kloppend totaal, en geen gat in de
betaalketen. **ONBEKEND** blijft wát het was. Op te zoeken in App Store
Connect → *Payments and Financial Reports* → de week van 2–8 november, of
onder *Sales and Trends* met *Refunds* als maatstaf. Dat is vijf minuten werk
en het hoort gedaan voordat er een omzetcijfer in een plan wordt gezet.

## De werkelijke reis, uit de code

Dit is wat er gebeurt tussen het pictogram en het eerste Darija-woord.
Afgelezen uit `src/App.tsx`, `src/ui/Welcome.tsx`, `src/ui/Aanbod.tsx` en
`src/engine/store.ts`. **BEWEZEN.**

```
  winkelpagina
    ↓
  installeren
    ↓
  openen  →  Welkom 1/4   welke taal versta je?
             Welkom 2/4   naam en dier
             Welkom 3/4   Arabisch schrift, klanken of beide
             Welkom 4/4   kleur, licht/donker, herinnering, prijs
    ↓
  AANBODSCHERM            "wil je meteen de volledige versie?"   ← vóór les 1
    ↓
  /leren                  het pad
    ↓
  les 1   hruf-1          de eerste letters
  les 2   hruf-2
  les 3   hruf-3
  les 4   groeten-1       het eerste gesprek
    ↓
  gratisDeelOp = true     het scorescherm begint over geld
    ↓
  /volledig               achter de ouderpoort
    ↓
  3 dagen proef  →  afschrijving
```

Er is **geen registratie en geen inlog**. Dat is een pluspunt dat in een audit
zelden voorkomt: nul accountfrictie, nul wachtwoorden, nul e-mailverificatie.
De vraag uit de masterprompt over het registratieproces is daarmee niet van
toepassing.

## Waar het lekt, stap voor stap

### Lek 1 — installeren → openen

**Play (3 november):** 39 toestelacquisities in 28 dagen, **17 eerste keren
openen**. Dat zou betekenen dat meer dan de helft de app nooit opent.

Maar diezelfde tabel zegt ook 38 maandelijks actieve toestellen op 38
installaties, en dat kan niet allebei waar zijn. **ONBEKEND**, en het is de
moeite om uit te zoeken: als de helft van de installaties nooit opent, is dat
het grootste lek in de hele trechter en ligt de oorzaak buiten de app (een
winkelpagina die iets anders belooft dan de app levert, of een trage
eerste start).

Op te zoeken in de Play Console onder *Statistieken* → *Gebruikersacquisitie*,
met "eerste keren openen" tegen "acquisities" in hetzelfde venster.

### Lek 2 — het aanbodscherm komt vóór de eerste les

```
src/ui/Aanbod.tsx — uit de eigen toelichting
  "wie de app krijgt van iemand die hij kent, heeft het verhaal al gehoord
   voordat hij hem opende. Die moest eerst vier lessen doorlopen voordat
   hij kón betalen."
```

Die redenering is juist — **voor warm publiek.** Iemand die de app via de
familiegroep kreeg, heeft het besluit al genomen en wordt door vier
verplichte lessen opgehouden.

Voor koud publiek uit App Store Search is het precies verkeerd: die krijgt een
abonnementsaanbod voordat hij één Darija-woord heeft gehoord. **HYPOTHESE:**
dat verlaagt het vertrouwen op het tweede scherm dat een vreemde ooit ziet.

Het scherm blokkeert niets en de tweede knop is even groot als de eerste —
dat is netjes gedaan en Apple-conform (richtlijn 3.1.2). Het probleem is de
timing, niet de vormgeving.

**Dit is het patroon dat de hele audit verklaart:** de app is van begin tot
eind gebouwd voor publiek dat de maker vertrouwt. Daarom converteert hij goed
(3,4%) en daarom kan hij niet groeien.

### Lek 3 — vier lessen, zeven woorden

Het gratis deel is 4 van 74 lessen: **7 woorden, 13 letters, 0 diploma's**.
**BEWEZEN** — zie `01-product-audit.md`.

**HYPOTHESE, en de belangrijkste:** zeven woorden is te weinig om een ouder te
laten besluiten over € 59,99 per jaar, tenzij hij de maker al vertrouwde.

Hier is een getal dat de hypothese steunt. Toen versie 1.5 uitkwam, verschoof
het publiek van warm naar koud, en één stap in de trechter brak:

| Week | Bezoek per vertoning |
| --- | --- |
| 1 | **24,0%** |
| 2 | 20,1% |
| 3 | 9,8% |
| 4 | **7,6%** |

**BEWEZEN** — `docs/STAND.md`. Het bereik hield stand (68 → 50 vertoningen per
dag) maar de downloads halveerden. De verklaring die daar staat, klopt nog:
de eerste golf was zijn eigen netwerk, waar een vertoning bijna een bezoeker
was. Wat erbij kwam is App Store Search — mensen die ons koud zien.

Het punt voor déze audit: er is nu dus koud publiek, in de duizenden
vertoningen, en de app heeft geen mechanisme om dat te overtuigen. Zeven
woorden is wat een vreemde te zien krijgt.

### Lek 4 — geen van de twee groeilussen kan vuren

| Lus | Drempel | Gratis plafond | Bereikbaar? |
| --- | --- | --- | --- |
| WhatsApp-deelkaart | 25 woorden vast | 7 woorden | **nee** |
| Verzoek om winkelbeoordeling | 3 diploma's | 0 diploma's | **nee** |

**BEWEZEN** — `src/engine/delen.ts` (`MIJLPALEN`), `src/engine/beoordeling.ts:42`
(`DIPLOMAS_VOOR_VRAAG = 3`), tegen de gratis afbakening in
`src/engine/store.ts:35`.

Dit is het ernstigste van de vier, omdat het compounding kost. De app heeft
precies twee manieren om uit zichzelf te groeien, en beide staan achter de
kassa. Winkelbeoordelingen zijn bovendien de enige ASO-knop die hij niet zelf
kan indrukken, en ze kunnen alleen van zes betalende klanten komen.

### Lek 5 — geen reden om morgen terug te komen

`src/engine/store.ts:512` → `herinnering: false`. De dagelijkse herinnering
staat standaard uit. **BEWEZEN.**

Voor een product met de belofte "twee minuten per dag" is dat de verkeerde
stand. En retentie is hier niet alleen retentie: elke terugkeer is een nieuwe
kans dat de ouder bij het slot komt en over het abonnement nadenkt. Eén sessie
is één kans.

## Wat níet lek is

- **Registratie en inlog.** Bestaan niet. Geen frictie.
- **De betaalketen zelf.** Zes testbestanden dekken aankoop, proef, herstel,
  codes en terugbetaling; alle groen. Prijs en proefperiode komen uit de
  winkel, niet uit de code. **BEWEZEN** — zie `02-technical-audit.md`.
- **De snelheid.** App laadt van schijf; website is 8 kB gezipt.
- **Het vertrouwen op de winkelpagina.** Wie doorklikt naar de pagina,
  downloadt in **78,9%** van de gevallen. **BEWEZEN** — `docs/STAND.md`. Dat
  is een hoog cijfer: de pagina zelf overtuigt. Het probleem zit vóór de
  pagina (vertoning → bezoek: 7,6%) en erna (in de app).

Dat laatste contrast is diagnostisch. De winkelpagina doet zijn werk. De
*vindbaarheid* en de *gratis ervaring* doen het niet.

## Waar de app niet buiten Nederland is, en toch verkocht

| Markt | Aankopen | Gericht op gemarket? |
| --- | --- | --- |
| Nederland | 9 | ja |
| Duitsland | 2 | **nee** |
| Frankrijk | 2 | deels (Franse Facebook-groepen, 3 nov) |
| Qatar | 1 e-boek (QAR 63) + 1 proef | **nee** |

**BEWEZEN** — ASC In-App Purchases per territorium (10 nov) en de Play-orders.

Dit corrigeert een eerdere conclusie in `docs/STAND.md` dat dit een
Nederlands product is: **31% van de aankopen komt van buiten Nederland, zonder
enige marketing daar.** De Qatarese e-boekverkoop op 9 november is helemaal
koud: niemand heeft daar iets gedeeld.

**WAARSCHIJNLIJK** betekent dit dat de winkelteksten in vier talen al werk
doen dat niemand ondersteunt. Dat is een kans, en in
`04-marketing-strategy.md` staat wat ermee te doen.

En het maakt de onvertaalde klankbeschrijvingen (28 letters × 5 talen,
`src/content/alphabet.ts`) duurder dan ze leken: Duitse en Franse klanten
bestaan en krijgen Nederlandse uitleg te lezen.

## Wat we niet weten, en wat de meting zou zijn

Dit is de eerlijke lijst. Geen van deze cijfers bestaat, en geen ervan is
achteraf op te halen.

| Vraag | Status | Meting |
| --- | --- | --- |
| Hoeveel openers maken les 1 af? | **ONBEKEND** | teller `les_af:hruf-1` |
| Hoeveel komen bij het slot (na les 4)? | **ONBEKEND** | teller `gratis_op` |
| Hoeveel zien het aanbodscherm en kiezen "later"? | **ONBEKEND** | tellers `aanbod_zien` / `aanbod_later` |
| Hoeveel openen `/volledig` en kopen niet? | **ONBEKEND** | tellers `paywall_zien` / `koop_start` |
| Hoeveel komen op dag 2, 7, 30 terug? | **ONBEKEND** | dagcohort-teller |
| Hoeveel proeven worden betalend? | **ONBEKEND** | ASC → *Subscriptions* → Trial conversion |
| Welke Facebook-groep leverde wat? | **ONBEKEND, voorgoed** | campagneparameters op de links |
| Wat was de negatieve weekbalk? | **ONBEKEND** | ASC → Payments and Financial Reports |

De eerste zes vragen de meetlaag uit `08-metrics-experiments.md`. De laatste
twee zijn op te zoeken in de consoles, vandaag.

## De drie meest waarschijnlijke oorzaken

1. **Te weinig verkeer, niet te weinig conversie.** 3 downloads per dag bij
   3,4% betaalde conversie. **BEWEZEN** aan beide kanten.
2. **De gratis ervaring overtuigt alleen wie al overtuigd was.** Zeven woorden,
   nul diploma's, en een abonnementsaanbod vóór de eerste les.
   **WAARSCHIJNLIJK** — gesteund door de knik van 24% naar 7,6% toen het
   publiek van warm naar koud ging.
3. **De app kan niet uit zichzelf groeien.** Beide groeilussen zitten achter
   de betaalmuur. **BEWEZEN.**

Alle drie zijn te adresseren zonder één nieuwe functie te bouwen.
