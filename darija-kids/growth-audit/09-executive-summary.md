# 09 — Samenvatting en besluiten

## Het bericht in één alinea

De aanname onder de opdracht klopt niet. Darijaforkids converteert niet slecht:
**3,4% van de downloads werd een betalend abonnement** en 31% van de kopers
koos het duurste plan. Dat is voor een consumentenapp van vijf weken oud
normaal tot goed. Het probleem is dat er **drie downloads per dag** zijn. De
app verdient goed aan het verkeer dat hij krijgt en krijgt bijna geen verkeer —
en hij kan niet uit zichzelf groeien, want beide ingebouwde groeimechanismen
staan achter de betaalmuur. **MRR is ongeveer € 38.**

Dat verandert waar het werk heen moet: niet naar de paywall, maar naar de
bovenkant van de trechter en naar het weer aanzetten van wat al gebouwd is.

---

## De tien vragen

### 1. Wat zijn de drie meest waarschijnlijke oorzaken van het achterblijven van betalende gebruikers?

**a) Te weinig verkeer, niet te weinig conversie.** 1.460 vertoningen, 233
paginabezoeken, 149 downloads, 5 betaalde plannen — cumulatief, in vijf weken.
Drie downloads per dag.

**b) De gratis versie overtuigt alleen wie al overtuigd binnenkwam.** Het
gratis deel is 4 van 74 lessen: **7 woorden, 13 letters, nul diploma's.** Een
ouder die de maker niet kent, moet daarop € 59,99 per jaar beslissen.

**c) De app kan niet uit zichzelf groeien.** De WhatsApp-deelkaart vereist 25
onthouden woorden; het gratis plafond is 7. Het verzoek om een
winkelbeoordeling vereist 3 diploma's; een gratis gebruiker kan er 0 halen.
Beide loops zijn onbereikbaar zonder abonnement.

### 2. Welke daarvan kunnen we al bewijzen?

| | Status |
| --- | --- |
| Het verkeersprobleem | **BEWEZEN** — consolecijfers, `docs/STAND.md` |
| De conversie is normaal (3,4%) | **BEWEZEN** — 5 betaalde plannen op 149 downloads |
| Het gratis deel is 7 woorden | **BEWEZEN** — nagerekend uit `src/engine/store.ts:35` |
| Beide groeiloops zijn onbereikbaar | **BEWEZEN** — `delen.ts` en `beoordeling.ts:42` tegen het plafond |
| Dát die loops de groei remmen | **WAARSCHIJNLIJK** — het mechanisme is bewezen, het effect niet gemeten |
| Dat 7 woorden te weinig is om te beslissen | **HYPOTHESE** — gesteund door de knik van 24% naar 7,6% bezoek per vertoning toen het publiek van warm naar koud ging |

Verder **BEWEZEN**, en het sluit drie verdenkingen uit de opdracht uit:

- **De techniek is in orde.** 117 testbestanden, 2098 tests groen, 0
  kwetsbaarheden, schone bouw, geen dode links, geen externe SDK.
- **De betaalketen is in orde.** Zes testbestanden dekken aankoop, proef,
  herstel, codes en terugbetaling. Prijs en proefperiode komen uit de winkel.
- **De winkelpagina overtuigt.** Wie doorklikt, downloadt in 78,9% van de
  gevallen.

### 3. Wat is de grootste commerciële kans?

**Dat er geen Darija-app voor kinderen bestaat behalve deze.** Twee zoekrondes
in twee talen vinden er geen. Daar komt de slotgracht bij die niet met AI in
te halen is: er is geen Darija-stem in enige spraakmachine, dus elk van de 432
opnames is door een Marokkaanse spreker ingesproken.

De markt is ruim genoeg: ongeveer 3 miljoen mensen van Marokkaanse herkomst in
Europa, en de zes interfacetalen dekken precies de zes grootste markten. Bij
één procent van de gezinnen met kinderen is dit € 150.000 per jaar. Nu staat
het op zes abonnementen.

De goedkoopste kans daarbinnen: **België.** Nederlandstalig én Franstalig, dus
beide bestaande talen, films en winkelteksten werken er zonder één nieuwe
regel. 298.000 tot 700.000 mensen, en er is nog niets gedeeld.

### 4. Wat is de belangrijkste ontbrekende informatie?

**Dat er in de app niets gemeten wordt.** Er is geen enkele meting van
gebruikersgedrag — een grep over de hele broncode vindt alleen de
privacyverklaring die zegt dat er geen analytics is. Niet te repareren met
terugwerkende kracht.

Daardoor is onbekend: hoeveel openers les 1 afmaken, hoeveel bij het slot
komen, hoeveel "later" kiezen op het aanbodscherm, hoeveel de paywall openen
en niet kopen, en hoeveel op dag 2 terugkomen.

En één die vandaag al bestaat en nooit is bekeken: **de proefconversie** in
ASC → Subscriptions. Dat is het enige echte conversiecijfer dat er nu is.

### 5. Wat zouden we per direct moeten stoppen?

- **Nieuwe films maken.** Er zijn er negen. Onbekend of ze iets opleveren,
  want de links dragen geen campagneparameter. Film tien verandert dat niet.
- **In meer Facebook-groepen posten zonder campagnelink.** De campagne van 3
  november in meer dan vijftien groepen is voorgoed onmeetbaar. Dat herhaalt
  zich bij elke volgende post.
- **Nadenken over prijsverlaging.** 3,4% betaalt, 31% kiest het duurste plan.
  Geen enkele aanwijzing dat de prijs de blokkade is.
- **Betaalde advertenties overwegen.** De opbrengst per download is $1,05 en
  dat is cumulatief over de hele levensduur tot nu. In deze categorie kost een
  installatie in West-Europa doorgaans meer. Verzekering op de eigen merknaam
  is de enige uitzondering.

### 6. Waar moeten we juist meer op inzetten?

- **Meetbaarheid**, als voorwaarde voor al het andere.
- **Het weer aanzetten van wat al gebouwd is**: de deelkaart en het
  beoordelingsverzoek. Dat is marketing die in de code zit en uit staat.
- **De creator-samenwerking.** Het publiek is exact de doelgroep, de
  aanbeveling komt van iemand die ze vertrouwen — wat dit product aantoonbaar
  nodig heeft — en er wordt pas betaald bij omzet. Nog te doen: de twee
  aanbiedingscodes aanmaken, mét campagneparameter.
- **De markten die al kopen zonder hulp.** Duitsland leverde twee aankopen
  zonder enige marketing, Qatar een e-boekverkoop op 9 november. Dat corrigeert
  de eerdere aanname dat dit een Nederlands product is: **31% van de aankopen
  komt van buiten Nederland.**

### 7. Wat zijn de vijf hoogste prioriteiten?

| # | Wat | P | Werk |
| --- | --- | --- | --- |
| 1 | Eerstelijns trechtermeting (Kinderen-categorie-proof, anoniem) | **P0** | 1–2 dagen |
| 2 | Campagneparameters op elke winkellink | **P0** | 2 uur |
| 3 | Eén complete unit gratis — zet beide groeiloops aan | **P1** | 1 dag |
| 4 | Dagelijkse herinnering standaard aan | **P1** | 1 uur |
| 5 | Positioneren als kindercursus in plaats van als Darija-app | **P1** | 1 dag, geen code |

Nummer 3 is de enige ingreep die tegelijk conversie, retentie, de virale lus
en de vindbaarheid raakt — en het is één constante in `src/engine/store.ts:35`:
van `{ hruf: 3, groeten: 1 }` naar `{ hruf: 8, groeten: 5 }`. Nagerekend, want
alleen de alfabet-unit openzetten werkt niet: die bevat nul woorden, en dan
blijft de deelkaart onbereikbaar.

Nummer 5 kan nu voor het eerst: Apple wees versie 1.0 twee keer af omdat de
ondertitel zei dat de app voor kinderen is terwijl hij niet in de
Kinderen-categorie stond. Hij staat er nu in. Die beperking is weg en de
vrijheid is niet opgepakt.

### 8. Welke eerste actie zou jij zelf uitvoeren als je medeoprichter was?

**De campagneparameters, vandaag.** Twee uur werk, één regel per link.

Niet omdat het de grootste impact heeft, maar omdat het de enige fout in dit
dossier is die zich **blijft herhalen en onherstelbaar is**. Elke dag zonder
die parameters is een dag waarvan we later niet kunnen zeggen wat werkte. De
vijftien groepen van 3 november zijn al weg; de volgende vijftien hoeven dat
niet te zijn.

En daarna, dezelfde week, de meting — want ik wil geen van de vijf
verbeteringen doorvoeren zonder te kunnen zien wat hij deed.

### 9. Wat is het meetbare doel van de komende 30 dagen?

> **Op 10 december 2026 is de volledige trechter van installatie tot aankoop
> leesbaar voor minstens 150 nieuwe installaties, en is van elke sinds 17
> november gedeelde link bekend uit welke campagne hij kwam.**

Omzetdoel erbij, met de onzekerheid erbij: **12 betaalde plannen** (nu 6). Bij
deze aantallen is dat evengoed geluk als resultaat — het staat er als
richtpunt, niet als bewijs.

### 10. Wanneer besluiten we om door te groeien, bij te sturen of te pivoten?

**10 februari 2027**, met drie maanden meetbare cijfers. Drempels nu
vastgelegd, zodat ze niet achteraf worden goedgepraat:

| Uitkomst | Besluit |
| --- | --- |
| **> 20 downloads/dag** uit een herhaalbaar kanaal én conversie ≥ 3% | **Doorgroeien** — budget naar het kanaal dat werkte |
| 8–20 downloads/dag, of conversie 1,5–3% | **Bijsturen** — nog één ronde van 90 dagen |
| **< 8 downloads/dag** na drie maanden met werkende meting en drie geteste kanalen | **Pivoten** — richting de volwassen diaspora en/of de boekenreeks als hoofdproduct, niet een nieuwe app |

De downloads per dag wegen het zwaarst. Bij zes betaalde plannen verandert één
extra klant de conversie met 17%; dat getal is te onrustig om een besluit op
te bouwen.

---

## Wat ik tegen de eigen keuzes in breng

De opdracht vroeg om kritisch te zijn. Drie dingen:

**De streng afgeknepen gratis versie is de duurste keuze in het product.**
De code verdedigt hem goed — anders is de hele cursus gratis — maar de
uitvoering is doorgeschoten tot er niets meer te ervaren valt, en hij heeft
onbedoeld twee groeimechanismen uitgeschakeld. Bij `DIPLOMAS_VOOR_VRAAG = 3`
staat zelfs de overweging dat vier te veel zou zijn omdat je dan "voorbij de
gratis lessen" bent. Bij nul ben je dat al.

**Er is uitzonderlijk veel zorg aan de app besteed en bijna geen aan het
meten ervan.** 2098 tests, acht uitgangen achter een ouderpoort, kleurcontrast
tot op twee decimalen nagemeten, en nul tellers. Dat is geen slordigheid maar
een gevolg van dezelfde instelling: privacy en zorgvuldigheid hebben altijd
gewonnen. De prijs is dat er nu geen enkel cijfer is om op te sturen.

**Negen films en vijftien groepen zonder één meetpunt is de kostbaarste
gewoonte.** Dat is weken werk waarvan de uitkomst niet meer te achterhalen is.
Niet omdat het mislukt is — misschien werkte het uitstekend — maar omdat het
onkenbaar is.

---

## Fase 2

Dit document is diagnose. Er is geen app-code gewijzigd, geen prijs aangepast,
geen winkelinstelling aangeraakt.

Voor Fase 2 stel ik voor om met de twee P0's te beginnen, in deze volgorde:

1. **Campagneparameters** — 2 uur, geen risico, en het stopt de enige
   onherstelbare fout.
2. **De trechtermeting** — 1 à 2 dagen, inclusief de privacyverklaring in zes
   talen en de Apple-privacyvragen.

Daarna 3, 4 en 5 in één release (1.6), met de nieuwe zoekwoorden en de
lokalisatie van de 28 klankbeschrijvingen erbij.

Zeg welke je wilt en ik begin. En als je het niet met de diagnose eens bent,
zeg dat vooral — het hele plan hangt aan de stelling dat dit een
verkeersprobleem is en geen conversieprobleem, en die stelling is te
weerleggen met de proefconversie uit App Store Connect.
