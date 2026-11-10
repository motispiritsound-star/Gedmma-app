# 05 — Prijs en verdienmodel

## Wat het nu is

| Product | Prijs | Technisch |
| --- | --- | --- |
| Maandabonnement | **€ 6,99** | `app.darijaforkids.monthly` |
| Jaarabonnement | **€ 59,99** (€ 5,00/mnd) | `app.darijaforkids.yearly` |
| E-boek in de app | **€ 14,99** | inbegrepen bij het jaar |
| Boekenreeks (Gumroad) | **€ 34,99** intro / € 49,99 | buiten de app |
| Proefperiode | **3 dagen** | |
| Gratis blijvend | **4 lessen** (7 woorden) | |

**BEWEZEN** — `src/engine/billing.ts:43-46`, `:65`, `:92`;
`src/site/shop.ts`; `src/engine/store.ts:35`.

Het jaar is 28% goedkoper dan twaalf maanden plus het e-boek
(`YEAR_SAVING`, `billing.ts:118`).

## Wat de markt doet

| App | Maand | Jaar | Eenmalig | Voor wie |
| --- | --- | --- | --- | --- |
| **Darijaforkids** | **€ 6,99** | **€ 59,99** | — | kinderen |
| Darijapp | € 9,99 | **€ 19,99** | € 27,99 | volwassenen |
| SayDarija | $ 9,99 | **$ 19,99** | — | volwassenen |
| Yalla Darija | $ 2,99 | $ 29,99 | — | volwassenen |
| Darija Translator | € 3,99 | € 39,99 | — | volwassenen |
| **Dinolingo** (kinderen, 50 talen) | $ 19 | **$ 199** | — | kinderen |
| Gus on the Go | — | — | ≈ $ 3,99 per taal | kinderen |

Prijzen uit winkelvermeldingen en aggregators, november 2026. **WAARSCHIJNLIJK
actueel**, per regio verschillend; bronnen onderaan.

### Hier zit de werkelijke prijsvraag

Het maandabonnement van € 6,99 is **goed geprijsd**: midden in het veld,
onder de twee Darija-apps die $9,99 vragen.

Het jaarabonnement zit tussen twee ankers in die ver uiteen liggen:

```
  Darija-apps voor volwassenen     € 20 – 40 per jaar
                                          ↓
  Darijaforkids                       € 59,99
                                          ↓
  Dinolingo (kinderen)                 $ 199 per jaar
```

**Of € 59,99 duur is, hangt volledig af van op welke plank de koper het legt.**
Naast Darijapp is het drie keer de markt. Naast Dinolingo is het een kwart van
de prijs voor iets dat Dinolingo niet eens heeft (Darija zit niet in hun 50
talen, en hun stemmen zijn geen diasporastemmen).

**Dat maakt dit geen prijsprobleem maar een positioneringsprobleem.** De knop
is niet het getal verlagen, het is zorgen dat de koper het naast een
kindercursus legt in plaats van naast een reis-woordenboek.

Praktisch: op de winkelpagina en de website hoort "17 units, 74 lessen, 303
woorden, diploma's, een herhaalmotor" eerder te staan dan "Darija leren".
Het eerste is een cursus, het tweede is een app.

### Wat er ontbreekt: een eenmalige prijs

Twee van de zes concurrenten verkopen een eenmalige ontgrendeling (€ 27,99 en
$ 3,99). Darijaforkids niet.

**HYPOTHESE, en het sterkste prijsexperiment in dit document:** dit publiek
koopt liever één keer dan elke maand. Drie redenen die eerlijk zijn als
hypothese en niet als feit:

1. Een abonnement voor een kind van zeven is een abonnement dat je over vier
   jaar nog betaalt. Ouders rekenen dat door.
2. Het alternatief waar dit product tegen concurreert — Arabische les op
   zaterdag, oma, de Koranschool — is geen abonnement.
3. De e-boekverkopen (Nederland eerder, Qatar op 9 november) zijn eenmalige
   aankopen, en het e-boek verkoopt zonder dat er één film over gaat.
   **BEWEZEN** dat er eenmalige aankopen plaatsvinden; **HYPOTHESE** dat die
   voorkeur breder is.

En er is één hard signaal dat de bereidheid om vooruit te betalen bestaat:
**4 van de 13 aankopen (31%) was het jaarabonnement.** **BEWEZEN** — ASC
In-App Purchases, 10 november. Dat corrigeert een eerdere conclusie in
`docs/STAND.md` dat het jaar niets opleverde.

## Gratis versus betaald

Dit is in `01-product-audit.md` en `03-conversion-audit.md` uitgewerkt; hier
wat het voor de prijs betekent.

Het gratis deel is 4 van 74 lessen: **7 woorden, 13 letters, 0 diploma's**.
De code legt uit waarom het zo streng is — anders is de hele cursus gratis —
en die zorg is terecht. Maar de huidige grens doet twee dingen die niemand
wilde:

- Een vreemde kan niet besluiten. Zeven woorden is geen beslisgrond voor
  € 59,99.
- Beide groeilussen vuren niet (25 woorden nodig voor delen, 1 diploma voor
  een beoordeling).

De oplossing die ik in de strategieën hieronder uitwerk, verruimt het gratis
deel **niet** naar "veel gratis" maar naar "precies één compleet stuk": de
alfabet-unit, 8 lessen. Dan haalt een gratis gebruiker één diploma, komt in
de buurt van 25 woorden, en heeft iets gezien wat af is.

## Drie monetisatiestrategieën

Meer dan drie heeft hij niet gevraagd en meer dan drie zijn er niet die hout
snijden.

---

### Strategie A — Gezinsontgrendeling voor eenmalig bedrag

**Wat:** naast de abonnementen een eenmalige aankoop, richtprijs **€ 89 tot
€ 99**, die alles permanent openzet voor het hele huishouden, inclusief het
e-boek.

**Welk probleem:** de weerstand tegen een abonnement dat jarenlang doorloopt
voor een kind dat opgroeit. En het verzilvert de ouder die nú overtuigd is
maar niet aan een abonnement wil.

**Onderbouwing:** 31% koos al het jaar (**BEWEZEN**). Twee concurrenten
verkopen eenmalig (**BEWEZEN**). Het e-boek verkoopt zonder marketing
(**BEWEZEN**). Dat dit publiek liever eenmalig koopt: **HYPOTHESE**.

**Voordelen:** direct kasgeld, geen churn, geen opzeggesprek, en het is in
Apple/Google een gewone non-consumable — geen nieuwe infrastructuur.
`src/engine/billing.ts` kent al een niet-verlopende aankoop (`ebook`,
`store.ts:229`), dus het patroon staat er.

**Risico's:** het kannibaliseert het jaarabonnement, en € 89 eenmalig is
minder waard dan vier jaar × € 59,99. Dat is alleen een echt risico als
klanten vier jaar blijven, en **ONBEKEND** is of ze dat doen — er is nog geen
enkele verlenging geweest. Tweede risico: twee prijzen naast elkaar maken de
keuze zwaarder.

**Hoe te testen met weinig middelen:** zet hem erbij op het abonnementsscherm
als derde optie, zonder enige promotie, en kijk acht weken naar de verdeling.
Benodigde steekproef voor een betrouwbare verdeling: ten minste 30 aankopen.
Bij het huidige tempo (6 betaalde plannen in 5 weken) is dat **te langzaam** —
dus dit experiment heeft eerst meer verkeer nodig, of het wordt een
richtinggevend signaal in plaats van een bewijs. Dat eerlijk benoemen is
belangrijker dan het experiment forceren.

---

### Strategie B — Eén complete unit gratis, in plaats van vier losse lessen

**Wat:** `GRATIS_LESSEN` van `{ hruf: 3, groeten: 1 }` naar
**`{ hruf: 8, groeten: 5 }`** — de hele alfabet-unit plus de hele
groeten-unit. Dertien van de 74 lessen.

Dat zijn er meer dan het op het eerste gezicht hoeft te zijn, en daar is een
gemeten reden voor:

| Gratis | Lessen | Woorden | Letters | Diploma's | 25-woordenmijlpaal |
| --- | --- | --- | --- | --- | --- |
| nu: `hruf:3, groeten:1` | 4 | **7** | 13 | 0 | **niet haalbaar** |
| `hruf:8` | 8 | **0** | 28 | 1 | **niet haalbaar** |
| **`hruf:8, groeten:5`** | **13** | **27** | **28** | **2** | **haalbaar** |

**BEWEZEN** — nagerekend tegen `src/content/curriculum.ts`.

De alfabet-unit alleen openzetten lijkt de nette keuze en werkt niet: `hruf`
bevat **nul woorden**, het zijn de 28 letters. Dat zet het
beoordelingsverzoek aan (één diploma) en de deelkaart nog steeds niet. Pas
mét `groeten` erbij komt het aantal woorden op 27 en gaan beide loops open.

**Welk probleem:** drie in één. De gratis gebruiker krijgt een afgerond
resultaat (een diploma), de deelkaart wordt bereikbaar, en het
beoordelingsverzoek wordt bereikbaar.

**Onderbouwing:** **BEWEZEN** dat beide lussen nu onbereikbaar zijn.
**BEWEZEN** dat de knik in de trechter (24% → 7,6%) samenvalt met de
verschuiving van warm naar koud publiek. **HYPOTHESE** dat een compleet gratis
stuk koud publiek wel overtuigt.

**Voordelen:** dit is de enige ingreep in dit document die tegelijk de
conversie, de retentie, de virale lus én de ASO raakt. En het is één regel
code met een bestaande test eromheen (`gratisop.test.ts`).

Een gratis gebruiker die het alfabet afmaakt, kan daarna iets wat de meeste
ouders zelf niet kunnen: Arabisch schrift lezen. Dat is een demonstreerbaar
resultaat waar een deelbericht over kan gaan.

**Risico's:** omzetverlies van mensen die nu betalen voor wat straks gratis
is. Dat is reëel en groter dan bij `hruf` alleen: 13 van 74 lessen (17,6%) en
27 van 303 woorden (8,9%) gaan open. Wat het begrenst is dat de overige
vijftien units — familie, cijfers, eten, school, werkwoorden, winkelen — intact
blijven; wie Darija wil léren komt met letters en begroetingen niet ver.

Tweede risico: de muur verschuift van les 5 naar les 14. Of de ouder daar nog
dezelfde beslisbereidheid heeft is **ONBEKEND**, en het is precies wat meting
1 zou laten zien.

**Hoe te testen:** dit is geen A/B-test waard bij dit volume. Het is een
eenrichtingsverbetering van twee kapotte mechanismen. Meet erna: aantal
deelkaarten getoond, aantal beoordelingsverzoeken getoond, en het aantal
winkelbeoordelingen. Die laatste is zichtbaar in beide consoles.

---

### Strategie C — De boekenreeks als tweede inkomstenlijn

**Wat:** de 15-delige reeks "De sleutels van Marokko" en de encyclopedie staan
al in `src/content/` (37.163 regels, het grootste gebied van de repository) en
in de Gumroad-winkel (€ 34,99 intro / € 49,99). Dit is een bestaand product
dat geen marketing krijgt.

**Welk probleem:** de opbrengst per klant. Een boek van € 34,99 naast een
abonnement van € 59,99 verdubbelt bijna de waarde van dezelfde klant, zonder
nieuw publiek.

**Onderbouwing:** **BEWEZEN** dat het e-boek verkoopt zonder promotie, in
Nederland en op 9 november in Qatar. **BEWEZEN** dat het e-boek bij het
jaarabonnement is inbegrepen, dus de combinatie is al bedacht.
**HYPOTHESE** dat gerichte promotie aan bestaande klanten omzet oplevert.

**Voordelen:** geen acquisitiekosten — het zijn mensen die al klant zijn. En
een papieren boek in een Marokkaans-Nederlands gezin is een cadeau, een ding
dat op tafel ligt en dat bezoek ziet. Dat is marketing die een app niet kan.

**Risico's:** aandacht. Dit is een tweede product, en de masterprompt
waarschuwt zelf tegen feature creep. Het risico is dat de app blijft liggen
terwijl er boeken worden verkocht. Houd het klein: één mail aan bestaande
klanten, één blok op het ouderscherm.

**Hoe te testen:** één bericht via de bestaande mailvoorziening (`server/`,
Brevo) aan de ouders die zich hebben aangemeld, met een link naar de reeks.
Meet de doorklik en de verkoop in Gumroad. Kosten: nul.
**Let op:** het aantal aangemelde mailadressen is **ONBEKEND** — eerst
opzoeken, want onder de tien is dit geen experiment maar een anekdote.

---

## Wat ik níet aanraad

- **De prijs verlagen.** Er is geen bewijs dat de prijs de blokkade is: 3,4%
  van de downloads betaalt, 31% kiest het duurste plan. De blokkade zit bij
  het aantal mensen dat de app ooit ziet, en bij wat ze gratis te zien
  krijgen. Verlagen vernietigt marge om een probleem op te lossen dat niet
  is aangetoond.
- **De proefperiode verlengen.** Drie dagen is kort, en **HYPOTHESE** zou zijn
  dat zeven dagen beter converteert. Maar dit is niet te meten bij zes
  betaalde plannen, en Apple's eigen conversiecijfers staan in de console —
  **haal die eerst op** (ASC → Subscriptions → Trial conversion) voordat hier
  aan gedraaid wordt.
- **Een tweede valuta of regioprijzen handmatig zetten.** Apple en Google doen
  dit al, en `billing.ts` leest de prijs uit de winkel in de munt van de
  koper. Hier is niets te verbeteren.

## Gevraagd en niet gedaan

De masterprompt zegt: *"Pas geen live prijzen of betalingsinstellingen aan
zonder expliciete toestemming."* Er is in deze fase niets aangepast. Geen
prijs, geen plan, geen productdefinitie, geen consoleinstelling. Alle
bovenstaande voorstellen wachten op goedkeuring in Fase 2.

## Bronnen

- Darijapp, SayDarija, Yalla Darija, Darija Translator: App Store-vermeldingen
  via zoekresultaten, november 2026 — [Darijapp](https://apps.apple.com/cd/app/darijapp/id6752932934), [SayDarija](https://apps.apple.com/app/id6794927830), [Yalla Darija](https://apps.apple.com/us/app/-/id6498720351), [Darija Translator](https://apps.apple.com/md/app/id6748276015)
- [Dinolingo prijzen](https://dinolingo.com/pricing/) — $19/maand, $199/jaar
- [Morolingo](https://apps.apple.com/us/app/morolingo-darija-amazigh/id6464064822) — gratis met in-app aankopen; bedrag niet publiek te vinden, dus **ONBEKEND**
- Gus on the Go: ≈ $3,99 eenmalig per taal, via een derde partij — **WAARSCHIJNLIJK**, niet bij de bron geverifieerd
