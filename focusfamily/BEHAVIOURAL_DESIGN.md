# BEHAVIOURAL_DESIGN

**Hoe het product zich gedraagt, en waarom — How the product behaves, and why**

---

## De keuze onder alles / The choice underneath everything

De meeste apps in deze categorie werken zo: een ouder stelt een limiet in, het
kind loopt tegen die limiet aan, en er ontstaat ruzie over de app in plaats van
over het onderwerp. De app wordt de scheidsrechter, en de ouder wordt de
handhaver.

FocusFamily zet daar een ander model tegenover: **de app is de notulist, niet de
scheidsrechter.** Het gezin maakt de afspraak, iedereen ziet hem, en de app
helpt om hem vol te houden — door te herinneren, mee te tellen en op zondag een
gespreksagenda op tafel te leggen.

Most apps in this category work like this: a parent sets a limit, the child
hits it, and the row is about the app instead of about the subject. FocusFamily
takes a different line: **the app is the minute-taker, not the referee.**

---

## Ontwerpregels / Design rules

### 1. Volwassenen doen mee, en dat is afdwingbaar

Dit is de regel die het hele product draagt, dus hij zit in de code en niet in
de handleiding:

```ts
if (!rules.some(bindsAdults)) {
  issues.push({ code: 'adults_not_included', ... });
}
```

`validateAgreement()` markeert het, `POST /agreements/:id/activate` weigert met
`400 agreement.not_activatable`, en de knop in de webapp is uitgeschakeld. Ook
per context: een dagdeel dat alleen iets van de kinderen vraagt levert
`children_only_context` op.

Waarom zo streng? Omdat "wat ik van jou vraag, vraag ik ook van mezelf" het
enige is wat een afspraak op de lange duur overeind houdt. Een regel die alleen
voor de kinderen geldt is geen afspraak maar een maatregel, en daar is deze app
niet voor.

### 2. De eerste week gebeurt er niets

Zeven dagen lang meet FocusFamily wat het mag meten, en zegt het verder niets.
Geen aanbevelingen, geen herinneringen, geen "wist je dat".

```ts
const baseline = baselineState(family, now);
if (baseline.suppressNudges) return null;   // recommendOne()
```

Twee redenen. Ten eerste is een advies op basis van drie dagen ruis geen advies.
Ten tweede — en dat weegt zwaarder — een app die op dag één begint te sturen
leert het gezin dat de app de baas is. Een week niets doen leert dat het gezin
de baas is.

Overslaan mag, maar het is een aangevinkte keuze bij het aanmaken, geen
standaard.

### 3. Eén verandering per keer

`recommendOne()` geeft precies één voorstel terug. Niet drie, niet een lijst met
prioriteiten. De regels staan op volgorde van "kleinste, duidelijkste stap":

| Volgorde | Voorstel | Wanneer |
| --- | --- | --- |
| 1 | Voeg een regel toe voor de volwassenen | De geldende afspraak bindt geen enkele volwassene |
| 2 | Nodig de tweede volwassene uit | Er staat er maar één op het account |
| 3 | Probeer een korter moment | Minder dan de helft van de focusmomenten werd afgemaakt |
| 4 | Zet één maaltijd in de agenda | Er is nog geen gezamenlijk eetmoment |
| 5 | Zet de opladers uit de slaapkamers | Ingevulde slaap onder de acht uur én geen afspraak over opladen |
| 6 | Praat over wat werkte | Er is niets te repareren |

Punt 6 is er met opzet. Een app die altijd een probleem vindt, is een app die
problemen verzint.

### 4. Elk voorstel toont zijn bewijs

Een aanbeveling zonder reden is een gok met zelfvertrouwen. Elke `Recommendation`
draagt `reasonKey` en een lijst `evidence`, waarin elk feit zijn eigen
herkomstlabel heeft. Het scherm toont ze onder het voorstel:

> **Zet de opladers uit de slaapkamers**
> *Waarom je dit ziet:* De ingevulde slaapuren waren deze week gemiddeld korter
> dan acht, en er is nog geen afspraak over opladen.
> `fact.average_sleep_hours` **7,0** · Door onszelf ingevuld
> `fact.checkin_responses` **3** · Door onszelf ingevuld
> *Dit voorstel komt uit een vaste set regels* (`deterministic_rules_v1`).

Merk op dat het bewijs `self_reported` is en de zekerheid `low`. We zeggen niet
dat er te weinig geslapen is; we zeggen wat er is ingevuld en stellen een
routine voor.

### 5. Geen cijfer, geen ranglijst, geen reeks om te verliezen

`WeeklyReview` heeft geen `score`-veld. Dat is niet toevallig maar getest:

```ts
expect(JSON.stringify(review)).not.toMatch(/"score"|"grade"|"rank"|"streak"/i);
```

In plaats van een reeks (een "streak") houden we **momentum** bij:

```ts
momentum([2, 4, 3, 0])  // { currentWeek: 0, bestWeek: 4, lostAnything: false }
```

Een rustige week haalt niets weg. De beste week blijft staan, en er gaat geen
melding uit dat er iets "verloren" is. Reeksen werken — daarom zitten ze in
zoveel apps — maar ze werken door verliesaversie, en verliesaversie inzetten op
een kind van negen is precies het soort donker patroon waar dit product tegen
is.

### 6. Pauzeren mag, en we vragen waarom

Een focusmoment kun je altijd pauzeren. De app vraagt dan één vriendelijke
vraag — *"Geen probleem. Wat kwam ertussen?"* — met vijf antwoorden, waaronder
*"We zijn van gedachten veranderd"*.

Die redenen zijn geen bewijsmateriaal. Ze komen terug in het weekoverzicht als
gespreksstof ("wat kwam ertussen als het niet lukte?"), niet als verwijt. En
een moment telt als gelukt bij **zestig procent** van de geplande tijd, niet bij
honderd:

```ts
export const COMPLETION_RATIO = 0.6;
```

Perfectie is geen doel. Iets afmaken wel.

### 7. Herstel in plaats van straf

Elke regel in de afsprakenbouwer heeft een tweede veld: *"Als het niet lukt"*.
De sjablonen vullen dat met dingen als *"Vergeet iemand het, dan legt die hem
weg en eten we door. Verder gebeurt er niets."*

Er is nergens in het datamodel een consequentie, een strafpunt of een
ingetrokken privilege. Wat er wel is, is een zin die het gezin zelf heeft
geschreven over hoe je verdergaat.

### 8. De taal is gecontroleerd, niet aangenomen

Twee blokkeerlijsten — klinisch en beschamend, in beide talen — worden bij elke
testrun over de volledige tekstcatalogus gehaald: 374 strings in de app plus
alle bibliotheekinhoud.

```
✓ contains no clinical framing and no shaming, in either language
✓ does not trip over a blocked term inside an ordinary word
```

Geblokkeerd zijn onder meer *verslaving, stoornis, diagnose, depressie,
symptoom, behandeling, klinisch* en *gefaald, mislukt, lui, straf, betrapt*.
De controle kijkt naar woordgrenzen, zodat "luisteren" gewoon mag.

Diezelfde controle draait op wat gebruikers invoeren: `assertNonDiagnostic()`
weigert een afspraakregel of een check-in-notitie met dat soort woorden, met
`copy.clinical_or_shaming`. Dat is geen censuur van een gevoel maar een grens
aan wat het product als vaste tekst laat rondslingeren.

---

## Toon / Tone

| In plaats van | Schrijven we |
| --- | --- |
| "Je kind heeft de limiet overschreden" | "Kan het opladen in het weekend om half tien in plaats van negen uur?" |
| "3 van de 7 dagen mislukt" | "Wat kwam ertussen als het niet lukte?" |
| "Score: 62/100" | "Wat ging deze week vanzelf?" |
| "Je reeks van 12 dagen is verbroken" | "Deze week: 0. Jullie beste week tot nu toe: 4." |
| "Waarschuwing: veel schermtijd" | "Voorbeeldgegevens. Deze gaan over niemand in dit gezin." |

De sleutel `review.well.you_showed_up` — *"Jullie openden de app samen. Dat is
een begin."* — is wat een gezin ziet in een week waarin verder niets is gelukt.
Een leeg scherm zou eerlijk zijn geweest, maar niet behulpzaam.

---

## Meldingen / Notifications

Weinig, en nooit beschamend. Zes categorieën, allemaal apart uit te zetten, en
stille uren die alles behalve een beveiligingsbericht tegenhouden. Kinderen
krijgen standaard vroegere stille uren (20:30 vanaf 11 jaar, 19:30 daaronder) en
een kleinere set categorieën.

Het instellingenscherm toont een **live voorbeeld**: voor elke categorie staat
er nu of hij zou aankomen, en zo niet, waarom. Een instelling die je niet kunt
controleren is geen instelling.

Wat er niet is: geen melding dat een afspraak niet is nagekomen, geen
herinnering dat een reeks in gevaar is, geen wekelijkse samenvatting van hoeveel
iemand op zijn telefoon zat.

---

## Vieren / Celebrating

Een vieringskaart is **van het gezin**, niet van een kind. `celebrationForGoal()`
kijkt of de volwassenen meededen en kiest dan een andere tekst
(`everyone_joined_in`). De kaart heeft één zichtbaarheid, en dat is een
letterlijke TypeScript-literal:

```ts
readonly visibility: 'family_private';
```

Er is geen deelknop, geen openbaar profiel, geen vergelijking met andere
gezinnen. Op elke kaart staat: *"Niemand buiten jullie gezin ziet dit."*

---

## Leeftijdsvarianten / Age-appropriate variation

Vier banden — 8–10, 11–13, 14–17 en volwassen — sturen **toon en zeggenschap**,
nooit de hoeveelheid toezicht.

| Leeftijd | Wat verandert |
| --- | --- |
| 8–10 | Kortere zinnen, ouder geeft toestemming, standaard geen bewerkrechten op afspraken, vroegste stille uren |
| 11–13 | Eigen instemming vereist voor elke meting |
| 14–17 | Als 11–13, plus het recht om de tekst van de afspraak mee te bewerken (`agreement.update`) |
| Volwassen | Beslist over zichzelf, kan niemand anders' instemming overrulen |

Wat níét verandert: elke leeftijd ziet dezelfde afspraken, dezelfde metingen,
dezelfde toestemmingsgeschiedenis en dezelfde weigerlijst.

---

## Toegankelijkheid als gedrag / Accessibility as behaviour

Toegankelijkheid staat hier omdat het over gedrag gaat, niet alleen over
markup.

- **Focusmomenten zijn groot.** De timer is `clamp(3.5rem, 2rem + 12vw, 7rem)`,
  de knoppen minstens 64 px hoog op het web en 72 op mobiel. Dit scherm wordt
  aan tafel gebruikt, vanaf een meter afstand, soms door een kind van acht.
- **Beweging is versiering.** `prefers-reduced-motion` zet alles op 0,01 ms; er
  is geen animatie die informatie draagt.
- **Focus is altijd zichtbaar**, met één ring van drie pixels door de hele app.
- **De timer is een live region.** `role="timer"` met `aria-live="polite"`, en
  een `aria-label` die de gefocuste tijd uitspreekt in plaats van alleen de
  cijfers te tonen.
- **Formulieren zijn echte formulieren.** Elk veld heeft een `<label>`, elke
  groep radio's een `<fieldset>` met `<legend>`, en alles werkt met Server
  Actions — dus ook wanneer JavaScript nog niet geladen is.
- **Permissies worden uitgelegd vóór ze gevraagd worden**, en er is geen tweede
  poging als iemand nee zegt. Eén heldere uitleg, één keer vragen.

---

## Wat we bewust niet doen / Deliberate omissions

| Patroon | Waarom niet |
| --- | --- |
| Reeksen met verliesaversie | Werkt via angst; werkt vooral goed bij kinderen; dat is precies het probleem |
| Ranglijsten tussen broers en zussen | Maakt van een gezin een competitie |
| Meldingen bij overtreding | Verplaatst de ruzie naar het moment zelf, waar hij het slechtst gevoerd wordt |
| Doelen die de app kiest | Een doel dat je niet zelf koos is een opdracht |
| Standaard aan staande metingen | Toestemming die je moet uitzetten is geen toestemming |
| "Nog even" bij een permissieweigering | Een tweede prompt is een donker patroon |
| Ouderdashboard dat het kind niet ziet | Het hele punt van dit product |
