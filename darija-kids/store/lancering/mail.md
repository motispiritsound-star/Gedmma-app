# De mail aan de wachtlijst

Eén mail, op de dag dat 1.4 in allebei de winkels staat — App Store build 10,
Play versiecode 8. In zes talen, want het formulier staat in zes talen en de
taal gaat met de aanmelding mee.

Deze mensen hebben op *Hou me op de hoogte* gedrukt en daarna de link in de
bevestigingsmail aangeklikt. Wanneer dat was staat per rij in `aangemeld_op`;
`npm run belangstelling` zet het per dag uit. Waar ze niet om hebben gevraagd
is een verslag van wat er gebouwd is: ze hebben om één bericht gevraagd,
namelijk dat hij er is. Dat is dus wat er in staat, en verder zo weinig
mogelijk.

Daarom is de mail kort gehouden: hoogstens 120 woorden per taal, en alle zes
blijven daaronder — de telling staat onder elke taal. Wat er niet in past hoort
op de winkelpagina, en daar staan ze één tik later.

## Wie hem krijgt

De lijst staat in de tafel `aanmelding` (`server/migrations/0001_begin.sql`).
Twee voorwaarden, en ze zijn geen van de twee vrijblijvend:

| | |
|---|---|
| `status = 'bevestigd'` | adres aangeklikt in de bevestigingsmail |
| `nieuws = 1` | het nieuwsveld staat aan — op de site altijd, in de app alleen met het vinkje |

`status = 'wacht'` krijgt niets. Dat staat zo in `scripts/belangstelling.mjs`
en het is geen formaliteit: zonder die tweede klik is er geen aantoonbare
toestemming, en een lijst van honderd waarvan dertig bevestigd zijn is een
lijst van dertig. Tellen doe je met `npm run belangstelling`, dat de twee
aantallen apart afdrukt.

En de lijst is jong. Tot 1 oktober was *Hou me op de hoogte* op de website een
`mailto:`-link — `docs/STAND.md`, *"Hou me op de hoogte schrijft nu in de
database"*. Wie vóór die dag reageerde staat dus in een postvak en niet in deze
tafel: twaalf berichten van elf mensen, op 1 oktober nageteld en als csv
afgegeven. Die krijgen deze mail niet, want ze staan er niet in. Wie ze toch
wil bereiken antwoordt op hun eigen mail — dat is een antwoord en geen mailing.
De app gebruikte `POST /aanmelden` al wel, dus wat er in de tafel staat komt
van de app en van de site sinds 1 oktober.

Let op dat dit een andere lijst is dan `nieuwsbrieflijst()` in
`server/src/portaal.ts`. Die leest de tafel `lid`: wie zich in het ledenportaal
heeft aangemeld, het nieuwsvinkje aan heeft staan en op de link in zijn mail
heeft geklikt — `laatste_bezoek IS NOT NULL`. Een aankoop is daar geen
voorwaarde. Overlap is mogelijk, maar het zijn twee lijsten met twee
bewijzen. Deze mail gaat over de app en dus over `aanmelding`.

### Wat er beloofd is: één bericht

Onder het veld op de website staat `houNoot` uit `src/site/copy.ts`, in zes
talen:

> Eén bericht zodra de app er is. Geen advertenties, en uitschrijven kan met
> één klik.

Dat is geen bijschrift maar de toestemmingstekst. Het formulier op de site
stuurt `nieuws: true` mee zonder dat de bezoeker een vakje aanvinkt — zie
`scripts/make-site.mjs` — dus die ene regel is alles wat er is afgesproken.

**Deze mail is dat ene bericht.** Daar volgt de lengte uit, en ook de inhoud.
Wie één bericht toezegt en er een nieuwsbrief van maakt, heeft iets anders
gedaan dan wat er stond. Wat er hierna nog naar deze mensen gaat is dus een
eigen vraag met een eigen antwoord, en niet iets dat deze mail stilzwijgend
meebrengt.

In de app staat een ruimer vinkje: `post.nieuws` in `src/i18n/<taal>.ts`,
*"Stuur me nieuws over nieuwe units, verhalen en aanbiedingen"*. Wie via de
ouderpagina binnenkwam valt daaronder. In de tafel is dat onderscheid niet te
zien, en dat is het volgende punt.

### Een deel van de lijst heeft om een boek gevraagd, niet om de app

Hetzelfde veld staat op de boekenbladzijde, met een eigen onderschrift —
`houNootBoeken`:

> Eén bericht zodra er een nieuw deel is. Geen advertenties, en uitschrijven
> kan met één klik.

Dat is een andere belofte: een nieuw deel van een boekenreeks, en niet een app.
En de twee zijn niet te scheiden. Beide formulieren sturen hetzelfde
`{ email, taal, nieuws: true, voortgang: false }`, er is geen kolom voor de
herkomst, en `docs/STAND.md` zegt het met zoveel woorden: *"De rest is gelijk,
want het is één lijst."*

Er valt dus niet te filteren. Dat is geen reden om te wachten, maar het is wel
de maat voor wat deze mail mag zijn. Iemand die zich voor een boekendeel heeft
aangemeld en een bericht van een kleine honderd woorden krijgt dat de app er
is, met een uitschrijflink eronder, is niet verrast op een manier die hem iets
kost.
Dezelfde persoon met een verkoopmail wel.

Wie dit ooit wil kunnen scheiden: een kolom `herkomst` op `aanmelding`, gezet
door het formulier dat de rij aanmaakt. Dat is werk voor na de lancering, en
het helpt alleen voor wie zich daarna aanmeldt — voor de mensen die er nu al
staan is het te laat.

## De twee adressen, en de twee gaten

De adressen staan niet in de teksten hieronder. Ze staan er als twee regels
met een naam ertussen dubbele haken:

```
[[ANDROID]]
[[APPLE]]
```

Die dubbele haken staan nergens anders in deze mail, in geen van de zes talen.
Dat is met opzet: zo is er één controle die het hele probleem afdekt. **Komt
`[[` nog voor in wat eruit gaat, dan gaat er niets uit.** Zoek erop in het
bericht vóór je verstuurt, en bij een verzending uit code op de samengestelde
tekst van alle zes de talen.

Dat is niet overdreven. `CLAUDE.md` beschrijft wat er gebeurt met een plakbaar
blok dat een gat heeft: `<de waarde van KOOP_GEHEIM>` is bij Gumroad in het
veld beland, punthaken en al. Een mail is erger dan een veld bij Gumroad, want
die is niet terug te nemen.

Er staat nog een derde markering in de teksten, `[EINDDATUM]`, en die heeft
**enkele** haken. Dat is geen slordigheid: die mag blijven ontbreken, want de
zin eromheen is zonder datum al waar. Hij hoort dus niet in een controle die
zegt dat er niets uit mag. Waarom hij er staat en wat je ermee doet staat onder
*De tijdelijke actie, en de einddatum die nog niet gekozen is*; dat hij
nagekeken wordt staat in *Vóór je verstuurt*.

**Android eerst, iPhone eronder.** Dezelfde volgorde als in
`store/lancering/kanaal.md`. De reden staat in `docs/STAND.md`: de meeste
mensen in het kanaal zitten op Android. Over deze lijst zegt dat niets: in de
tafel staat geen toestel, en waar iemand vandaan kwam staat er ook niet. Een
andere aanwijzing is er niet, en de eerste regel die iemand leest hoort over
zijn eigen toestel te gaan.

De regels krijgen een label dat het toestel noemt en niet de winkel:

| De regel | Wat erachter komt |
|---|---|
| `Android —` | de Play-pagina, zodra versiecode 8 is uitgerold |
| `iPhone en iPad —` | de App Store-pagina, zodra 1.4 op *Ready for Distribution* staat |

### Wanneer ze ingevuld kunnen worden

**Pas als allebei de goedkeuringen binnen zijn, en niet eerder.** Dit is één
mail voor twee winkels; hij zegt dat de app in allebei staat, en dat moet waar
zijn op de minuut dat hij verstuurd wordt. Eén werkend adres en één 404 is
erger dan een dag later mailen.

Wat er nu al is, en wat dat niet betekent:

- `STORE.apple` in `src/site/links.ts` staat gevuld —
  `https://apps.apple.com/app/id6813964474`. Dat adres werkt al, want 1.0 staat
  sinds 2 oktober live. Het wijst alleen nog niet naar 1.4.
- `STORE.google` is leeg. `playStoreUrl()` bouwt het Play-adres uit het
  applicatie-id, dus de vórm is al bekend — maar de pagina gaf op 30 september
  **404 — Not found on this server**, en dat blijft zo tot de release is
  uitgerold.

Een adres kennen is dus niet hetzelfde als een pagina die opengaat. De
controle is dat allebei de adressen opengaan op een toestel, niet op de Mac en
niet in een tabblad waar je al ingelogd bent. Pas daarna gaan de twee regels
erin.

---

# De teksten

Per taal vier dingen. **Onderwerp** is `onderwerp` in `Bericht`
(`server/src/mail.ts`). **Voorbeeldtekst** is de preheader — zie *De vorm*
hieronder, want daar is nog geen veld voor. **Kop** is `kop` en **Tekst** is
`body` in `briefHtml` (`server/src/sjabloon.ts`). De voet eronder schrijf je
niet: die komt per taal uit `server/src/mails.ts`.

De aanspreekvorm per taal is overgenomen uit `mails.ts` en niet opnieuw
gekozen: `je` in het Nederlands, `vous` in het Frans, `du` in het Duits, `tú`
in het Spaans, `tu` in het Italiaans. Deze mail komt in hetzelfde postvak als
de bevestigingsmail en moet van dezelfde persoon lijken te komen.

Het prijsformaat volgt per taal de winkeltekst in `store/listing.<taal>.md`:
€ ervoor in het Nederlands en het Engels, erachter in het Frans, Duits, Spaans
en Italiaans, en een punt als decimaalteken in het Engels.

## Wat er sinds 23 november niet meer in mag

**Geen gratis lessen, en geen proefperiode.** Tot 23 november stond hier in
alle zes de talen dat de eerste vier lessen gratis waren en dat je drie dagen
kon proberen. Allebei vervallen. Het getal was daarbij al langer fout: op
12 november werden het acht lessen, en nu zijn het er nul. Er is geen gratis
deel meer — de
onderbouwing staat in de aantekening boven `magLeren` in `src/engine/store.ts`,
en wat er in de winkels bij hoort staat in `docs/STAND.md`.

Wat er in plaats daarvan staat en net zo hard verkoopt: **de app is gratis te
downloaden**, de cursus is een abonnement, en na het betalen gaat alles in één
keer open — niet in porties. Geen account, niets in te vullen, geen
advertenties.

Dit is niet alleen netjes. Apple 2.3.1 noemt een misleidende prijsbelofte grond
om de app te verwijderen, **"whether within or outside of the App Store"**. Een
mail aan de hele lijst valt daar net zo goed onder als de winkelbladzijde zelf,
en een mail is het enige van de twee dat je niet kunt terugnemen.

## De tijdelijke actie, en de einddatum die nog niet gekozen is

Zolang de actie loopt is het jaarabonnement **€ 29,99 voor het eerste jaar** in
plaats van € 59,99. Dat is de haak van de campagne en die hoort hier te staan,
met drie voorwaarden.

**Eén: nooit "€ 2,50 per maand" alleen.** De omrekening mag erbij, maar het
bedrag dat werkelijk wordt afgeschreven staat ernaast en staat vooraan. Apple
heeft deze app één keer afgewezen op richtlijn **3.1.2(c)** omdat de omgerekende
maandprijs duidelijker stond dan het bedrag dat van de rekening gaat. Zie ook
het punt over € 5,00 onderaan: dat blijft er helemaal uit.

**Twee: de einddatum is nog niet gekozen.** Daarom staat er in alle zes de
talen `[EINDDATUM]` op de plek waar hij hoort, en is de zin eromheen zo
geschreven dat hij zonder die datum al waar is — *zolang de actie loopt*, en
niet een datum die niemand heeft vastgesteld. Eén zoekopdracht op `[EINDDATUM]`
vindt alle zes.

**Enkele haken, met opzet.** De twee adresgaten hierboven hebben
dubbele haken omdat `[[` de controle is die zegt: dan gaat er niets uit. Deze
is van een andere soort — vul de datum in zodra hij in beide consoles staat,
óf haal het stukje tussen haakjes weg, want de zin blijft dan staan en blijft
waar. Daarom valt hij buiten de `[[`-controle en staat hij als eigen stap in
*Vóór je verstuurt*.

**Drie: de actiezin gaat er pas in als de aanbieding werkelijk in beide
consoles staat.** Wat je waar zet staat in `docs/STAND.md` onder *de tijdelijke
actie van 50% op het jaar*. Staat ze er nog niet, dan haal je de actiezin uit
alle zes de talen en noem je alleen € 6,99 per maand of € 59,99 per jaar.
Controleer het op het aankoopvenster zelf, op een telefoon, in de app uit de
winkel: de console zegt wat er ingesteld is, niet wat de koper leest.

En € 29,99 bereikt alleen wie nooit eerder een abonnement in deze groep had.
Wie vóór 23 november de proef van drie dagen nam en opzegde, ziet de korting
dus niet. Dat is nu een klein aantal mensen, en het verklaart straks waarom
iemand terugschrijft dat hij € 59,99 ziet staan.

## nl-NL

**Onderwerp**
`Darijaforkids staat in de winkel`

**Voorbeeldtekst**
`Voor iPhone en voor Android. Gratis te downloaden; tijdelijk € 29,99 voor het eerste jaar.`

**Kop**
`Hij staat er`

**Tekst**

```
Je hebt je adres achtergelaten om te horen wanneer de app er is.

Hij is er. Darijaforkids staat vanaf vandaag in allebei de winkels.

Android — [[ANDROID]]
iPhone en iPad — [[APPLE]]

De app is gratis te downloaden: geen account, niets in te vullen, geen
advertenties. De cursus is een abonnement en gaat na het betalen in één keer
open: 17 units, van de letters tot afdingen op de souq — 304 woorden en 100
zinnen, ingesproken door een Marokkaanse stem en niet door een computer.

€ 6,99 per maand, of € 59,99 per jaar met het e-boek erbij. Zolang de actie
loopt (tot [EINDDATUM]) is het eerste jaar € 29,99, dat is € 2,50 per maand.
Opzeggen doe je in de winkel zelf.

Shukran voor het wachten.
```

115 woorden, de twee adresregels niet meegerekend.

## fr-FR

**Onderwerp**
`Darijaforkids est disponible`

**Voorbeeldtekst**
`Sur iPhone et sur Android. Téléchargement gratuit ; 29,99 € la première année, pour un temps limité.`

**Kop**
`Elle est là`

**Tekst**

```
Vous avez laissé votre adresse pour savoir quand l’application serait prête.

Elle est là. Darijaforkids est disponible dès aujourd’hui dans les deux
boutiques.

Android — [[ANDROID]]
iPhone et iPad — [[APPLE]]

L’application est gratuite à télécharger : pas de compte, rien à remplir, pas
de publicité. Le cours est un abonnement et, une fois payé, tout s’ouvre d’un
coup : 17 unités, des lettres au marchandage au souk — 304 mots et 100
phrases, enregistrés par une voix marocaine et non par un ordinateur.

6,99 € par mois, ou 59,99 € par an avec le livre numérique. Tant que l’offre
dure (jusqu’au [EINDDATUM]), la première année est à 29,99 €, soit 2,50 € par
mois. La résiliation se fait dans la boutique elle-même.

Shukran pour votre patience.
```

112 woorden, de twee adresregels niet meegerekend.

## de-DE

**Onderwerp**
`Darijaforkids ist da`

**Voorbeeldtekst**
`Für iPhone und für Android. Download kostenlos; vorübergehend 29,99 € im ersten Jahr.`

**Kop**
`Sie ist da`

**Tekst**

```
Du hast deine Adresse hinterlassen, um zu hören, wann die App da ist.

Sie ist da. Darijaforkids steht ab heute in beiden Stores.

Android — [[ANDROID]]
iPhone und iPad — [[APPLE]]

Die App lässt sich kostenlos herunterladen: kein Konto, nichts auszufüllen,
keine Werbung. Der Kurs läuft über ein Abo und steht nach dem Bezahlen auf
einmal offen: 17 Einheiten, von den Buchstaben bis zum Handeln im Souk — 304
Wörter und 100 Sätze, eingesprochen von einer marokkanischen Stimme und nicht
von einem Computer.

6,99 € im Monat, oder 59,99 € im Jahr mit dem E-Book dazu. Solange die Aktion
läuft (bis [EINDDATUM]), kostet das erste Jahr 29,99 €, das sind 2,50 € im
Monat. Gekündigt wird im Store selbst.

Shukran fürs Warten.
```

109 woorden, de twee adresregels niet meegerekend.

## es-ES

**Onderwerp**
`Darijaforkids ya está en las tiendas`

**Voorbeeldtekst**
`Para iPhone y para Android. Descarga gratuita; por tiempo limitado, 29,99 € el primer año.`

**Kop**
`Ya está`

**Tekst**

```
Dejaste tu dirección para saber cuándo estaría la aplicación.

Ya está. Darijaforkids se puede descargar desde hoy en las dos tiendas.

Android — [[ANDROID]]
iPhone y iPad — [[APPLE]]

La aplicación se descarga gratis: sin cuenta, sin rellenar nada, sin
publicidad. El curso es una suscripción y, después de pagar, todo se abre de
una vez: 17 unidades, de las letras al regateo en el souk — 304 palabras y 100
frases, grabadas por una voz marroquí y no por un ordenador.

6,99 € al mes, o 59,99 € al año con el libro digital incluido. Mientras dure
la oferta (hasta el [EINDDATUM]), el primer año cuesta 29,99 €, son 2,50 € al
mes. La baja se da en la propia tienda.

Shukran por la espera.
```

113 woorden, de twee adresregels niet meegerekend.

## it-IT

**Onderwerp**
`Darijaforkids è negli store`

**Voorbeeldtekst**
`Per iPhone e per Android. Download gratuito; per un periodo limitato, 29,99 € il primo anno.`

**Kop**
`È arrivata`

**Tekst**

```
Hai lasciato il tuo indirizzo per sapere quando sarebbe arrivata l’app.

È arrivata. Darijaforkids si scarica da oggi in entrambi gli store.

Android — [[ANDROID]]
iPhone e iPad — [[APPLE]]

L’app si scarica gratis: nessun account, niente da compilare, nessuna
pubblicità. Il corso è un abbonamento e, dopo il pagamento, si apre tutto in
una volta sola: 17 unità, dalle lettere alla contrattazione al souk — 304
parole e 100 frasi, registrate da una voce marocchina e non da un computer.

6,99 € al mese, o 59,99 € all’anno con l’ebook incluso. Finché l’offerta dura
(fino al [EINDDATUM]), il primo anno costa 29,99 €, sono 2,50 € al mese. La
disdetta si fa nello store stesso.

Shukran per l’attesa.
```

106 woorden, de twee adresregels niet meegerekend.

## en-US

**Onderwerp**
`Darijaforkids is in the stores`

**Voorbeeldtekst**
`For iPhone and for Android. Free to download; € 29.99 for the first year, for a limited time.`

**Kop**
`It is here`

**Tekst**

```
You left your address to hear when the app was ready.

It is here. Darijaforkids is in both stores from today.

Android — [[ANDROID]]
iPhone and iPad — [[APPLE]]

The app is free to download: no account, nothing to fill in, no ads. The
course is a subscription, and once you pay it all opens in one go: 17 units,
from the letters to haggling at the souk — 304 words and 100 sentences,
recorded by a Moroccan voice and not by a computer.

€ 6.99 a month, or € 59.99 a year with the e-book included. While the offer
runs (until [EINDDATUM]) the first year is € 29.99, that is € 2.50 a month.
You cancel in the store itself.

Shukran for waiting.
```

111 woorden, de twee adresregels niet meegerekend.

---

# De vorm

Deze mail is de vierde soort. `server/src/mails.ts` opent met *"Three kinds,
and no more"* — de bevestiging, het welkom en de weekmail — en dat is tot nu
toe waar geweest. Er komt er dus één bij, of deze gaat één keer met de hand de
deur uit. Wat hieronder staat geldt voor allebei de wegen.

## Wat de voet doet, en wat je er niet aan verandert

De voet schrijf je niet zelf. Per taal staan er in `server/src/mails.ts` drie
velden klaar, en die horen onder deze mail precies zoals ze zijn:

| | |
|---|---|
| `voet` | *"Je krijgt deze mail omdat je je in Darijaforkids hebt aangemeld."* |
| `afmelden` | de uitschrijflink |
| `wissen` | de link om de gegevens te laten wissen |

Die twee links moeten eronder staan, in alle zes de talen. `briefTekst` laat ze
weg als hun tekst leeg is — dat is er voor de koopmail, die geen mailing is —
en deze mail ís een mailing.

En `afmeldUrl` moet gevuld mee in `Bericht`. Dat is wat in `server/src/mail.ts`
de koppen `List-Unsubscribe` en `List-Unsubscribe-Post` aanzet, en die zijn het
verschil tussen iemand die zich uitschrijft en iemand die op *dit is spam*
drukt. Bij een mail die in één keer naar de hele lijst gaat is dat niet
cosmetisch: dat is of het afzenderadres de volgende mail nog bezorgd krijgt.

## De preheader heeft nog geen veld

De voorbeeldtekst per taal staat hierboven, maar er is nog geen plek om hem te
zetten. `briefHtml` kent `kop`, `body`, `knop`, `regels`, `staart` en de voet,
en `Bericht` in `mail.ts` kent `aan`, `onderwerp`, `html`, `tekst` en
`afmeldUrl`. Een preheader zit daar niet bij.

Wat er gebeurt als hij er niet komt: Gmail en Apple Mail zetten dan de eerste
woorden van `body` achter de onderwerpregel. Dat is de reden dat de eerste
regel in alle zes de talen een hele zin is die op zichzelf te lezen is, en niet
een aanhef.

Komt hij er wel, dan is het één verborgen element direct achter `<body>` in
`briefHtml`, vóór de buitenste tabel. `briefTekst` heeft niets nodig: in een
kale tekstmail is de eerste regel de voorbeeldtekst.

## Twee adressen en één knop

`briefHtml` heeft plaats voor één `knop`, en dat is het enige echte anker in de
mail. Er zijn hier twee adressen, dus een van de drie:

1. **Allebei als gewone regels in `body`**, zoals de teksten hierboven staan.
   Let op dat `alineas()` de tekst eerst door `esc()` haalt en daarna alleen
   regeleindes omzet — er wordt dus géén link van gemaakt. De meeste
   mailprogramma's maken zelf een link van een kaal adres, maar niet allemaal.
2. **De knop voor Android, de regel voor iPhone.** Werkt, en het is scheef:
   wie op een iPhone zit krijgt dan het slechtere van de twee. Welk deel van de
   lijst dat is, staat nergens.
3. **Een tweede knop in `briefHtml`.** Het nette antwoord, en het raakt een
   bestand waar alle mails door gaan. Dan is het een eigen wijziging met een
   eigen testronde, en niet iets voor de lanceringsdag.

Zolang 3 er niet is, is 1 de keuze. Daarom staan de twee adressen in de tekst
en niet in een knop.

## Wat er nog niet is: de verzending

Er is geen opdracht die deze mail verstuurt. `scripts/` heeft
`npm run belangstelling` om de lijst te tellen en `npm run mailsleutel` om de
sleutel te zetten, maar niets dat een mailing de deur uit doet.
`nieuwsbrieflijst()` staat er met de opmerking *"Wie hier ooit een nieuwsbrief
mee gaat versturen: dit is de lijst"*, en zo ver is het nooit gekomen.

Dat is dus een keuze die vóór de lanceringsdag gemaakt moet worden, en niet op
die dag zelf:

- **Met de hand, bij de mailpartner.** Zes berichten in Brevo, één per taal,
  elk naar de adressen van die taal. Hoe lang dat kost hangt af van de lijst;
  `npm run belangstelling` zegt hoe groot hij is. De uitschrijflink moet je dan
  zelf regelen — die hangt per persoon aan zijn `token`, en dat is precies het
  stuk dat met de hand misgaat.
- **Met een script, via de worker.** Dan komt de tekst in `mails.ts` naast de
  andere drie, bouwt `briefHtml` hem met de goede voet en de goede twee links,
  en zet `verstuur()` hem weg. Meer werk, en het is het enige van de twee dat
  de voet per persoon goed krijgt.

De tweede is de juiste. De eerste is de juiste als het morgen moet.

Een rem om bij stil te staan: `verstuur()` stuurt één mail per aanroep, en
`TIJDSLIMIET` is tien seconden. Een lijst aflopen in één verzoek van een worker
loopt dus tegen de tijdslimiet van die worker aan. Dat is geen probleem bij
tientallen adressen en wel bij duizenden.

# Wat er niet in staat, en waarom

- **Niets over 1.4.** Wie zich via de site aanmeldde heeft de app nog nooit
  geopend, dus het startscherm in vier stappen is voor hem geen nieuws maar
  gewoon hoe de app begint. Wie via de ouderpagina binnenkwam heeft hem wél
  geopend, maar in de tafel is dat niet te zien en één mail kan niet twee
  kanten op. Wie het wil lezen vindt het in de winkel onder *wat is er nieuw*.
  Hetzelfde geldt voor "haal de update op" — die regel staat in
  `store/lancering/kanaal.md` omdat daar mensen zitten die hem al hebben.
- **Geen aantal.** Geen gebruikers, geen downloads, geen recensies, geen
  sterren. Die zijn er niet.
- **Geen citaat van een ouder.** Er is er geen, en op dag één kan er geen zijn.
- **Geen gezinsdeling.** Bij Apple deelt het hele gezin één abonnement, tot zes
  personen; bij Google niet. Dat is waar en het is een goed argument, maar één
  mail voor twee winkels kan het niet noemen zonder per winkel een voetnoot.
  Het hoort op het koopscherm, waar de app weet in welke winkel hij staat.
- **Geen gratis lessen en geen proefperiode.** Die bestaan niet meer — zie
  *Wat er sinds 23 november niet meer in mag*. Tot die dag stond hier in alle
  zes de talen dat de eerste vier lessen gratis waren en dat je drie dagen kon
  proberen; het eerste getal was al sinds 12 november fout en is nu nul. Er is
  niets voor in de plaats gekomen dat erop líjkt: *gratis te downloaden* gaat
  over de app en niet over de cursus, en dat onderscheid moet in elke taal in
  één zin te zien blijven.
- **Geen "€ 5,00 per maand".** Dat is € 59,99 gedeeld door twaalf. Apple wees
  1.0 af op richtlijn 3.1.2(c) omdat die omrekening duidelijker stond dan het
  bedrag dat van de rekening gaat. De bedragen die hier vooraan staan zijn de
  bedragen die afgeschreven worden: € 6,99, € 59,99 en € 29,99. De enige
  omrekening die er wél staat is € 2,50 per maand, en die staat in geen van de
  zes talen zonder € 29,99 voor het eerste jaar ernaast.
- **Niet dat het abonnement op het eerste scherm gevraagd wordt.** Dat de
  cursus een abonnement is staat er wel, en in dezelfde zin als wat er na het
  betalen opengaat; dat is de verwachting die een nieuwe download nodig heeft.
  Waar precies de kassa staat, past niet meer binnen de 120 woorden en staat op
  de winkelbladzijde, één tik later.
- **Niet dat de app offline werkt, en niet dat er niets naar een server gaat.**
  Allebei waar, allebei sterk, en allebei een reden om de mail langer te maken
  dan hij hoeft te zijn. Ze staan in de winkeltekst, één tik verder, bij iemand
  die dan al aan het lezen is.
- **Geen boeken en geen tweede vraag.** `store/kanaal-socials.md` zegt het: een
  bericht dat drie dingen vraagt krijgt er nul. Deze mail vraagt niets — hij
  wijst twee adressen aan.
- **Geen "eindelijk" en geen terugblik.** Iemand die zijn adres heeft gegeven,
  wil weten waar hij de app haalt. Hoe lang het geduurd heeft gaat over de
  maker.
- **Geen datum en geen "deze week nog".** Gaat deze mail de deur uit, dan staat
  hij er. Anders gaat hij niet de deur uit.

# Vóór je verstuurt

1. **Zoek op `[[`.** In alle zes de talen, in de samengestelde tekst, en ook in
   de HTML-versie. Eén treffer betekent: niet versturen.
2. **Staat de actie werkelijk in beide consoles?** Zo niet, dan gaat de
   actiezin — de zin met € 29,99 erin — uit alle zes de talen, en blijven
   alleen € 6,99 per maand en € 59,99 per jaar staan. Kijk niet in de console
   maar op het aankoopvenster zelf, op een telefoon, in de app uit de winkel:
   de console zegt wat er ingesteld is, niet wat de koper leest. Een mail die
   een prijs belooft die de winkel niet rekent is Apple 2.3.1, en die geldt
   ook buiten de App Store.
3. **Zoek op `[EINDDATUM]`.** Zes treffers, één per taal. Vul per taal de datum
   in die je in de consoles hebt gezet, of haal het stukje tussen haakjes weg
   — de zin blijft dan staan en blijft waar. Wat niet mag is hem laten staan:
   dan gaat `[EINDDATUM]` als woord de deur uit.
4. **Open de twee adressen op een toestel.** Allebei, en niet op de Mac en niet
   in een tabblad waar je al ingelogd bent.
5. **Kijk of wat er live staat 1.4 is** — bij Apple build 10, bij Play
   versiecode 8. Dit is de eerste keer dat het één nummer is voor allebei de
   winkels, en dat is ook de reden dat het nagekeken moet worden.
6. **Stuur hem eerst naar jezelf**, in minstens twee talen. Kijk of de voet
   eronder staat, of de uitschrijflink werkt, en of de twee adressen klikbaar
   zijn geworden of als kale tekst in beeld staan.
7. **Alleen `bevestigd`.** Niet `wacht`. `npm run belangstelling` drukt de twee
   aantallen apart af; het tweede aantal mag deze mail niet krijgen.
