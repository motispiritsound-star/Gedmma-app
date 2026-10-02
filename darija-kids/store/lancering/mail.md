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

## nl-NL

**Onderwerp**
`Darijaforkids staat in de winkel`

**Voorbeeldtekst**
`Voor iPhone en voor Android. De eerste vier lessen zijn gratis.`

**Kop**
`Hij staat er`

**Tekst**

```
Je hebt je adres achtergelaten om te horen wanneer de app er is.

Hij is er. Darijaforkids staat vanaf vandaag in allebei de winkels.

Android — [[ANDROID]]
iPhone en iPad — [[APPLE]]

De eerste vier lessen zijn gratis: geen account, niets in te vullen, geen
advertenties. Daarachter liggen 17 units, van de letters tot afdingen op de
souq — 304 woorden en 100 zinnen, ingesproken door een Marokkaanse stem en
niet door een computer.

Daarna € 6,99 per maand, of € 59,99 per jaar met het e-boek erbij. Drie dagen
om het te proberen, en opzeggen doe je in de winkel zelf.

Shukran voor het wachten.
```

95 woorden, de twee adresregels niet meegerekend.

## fr-FR

**Onderwerp**
`Darijaforkids est disponible`

**Voorbeeldtekst**
`Sur iPhone et sur Android. Les quatre premières leçons sont gratuites.`

**Kop**
`Elle est là`

**Tekst**

```
Vous avez laissé votre adresse pour savoir quand l’application serait prête.

Elle est là. Darijaforkids est disponible dès aujourd’hui dans les deux
boutiques.

Android — [[ANDROID]]
iPhone et iPad — [[APPLE]]

Les quatre premières leçons sont gratuites : pas de compte, rien à remplir,
pas de publicité. Derrière, il y a 17 unités, des lettres au marchandage au
souk — 304 mots et 100 phrases, enregistrés par une voix marocaine et non par
un ordinateur.

Ensuite 6,99 € par mois, ou 59,99 € par an avec le livre numérique. Trois
jours pour essayer, et la résiliation se fait dans la boutique elle-même.

Shukran pour votre patience.
```

94 woorden, de twee adresregels niet meegerekend.

## de-DE

**Onderwerp**
`Darijaforkids ist da`

**Voorbeeldtekst**
`Für iPhone und für Android. Die ersten vier Lektionen sind gratis.`

**Kop**
`Sie ist da`

**Tekst**

```
Du hast deine Adresse hinterlassen, um zu hören, wann die App da ist.

Sie ist da. Darijaforkids steht ab heute in beiden Stores.

Android — [[ANDROID]]
iPhone und iPad — [[APPLE]]

Die ersten vier Lektionen sind gratis: kein Konto, nichts auszufüllen, keine
Werbung. Dahinter liegen 17 Einheiten, von den Buchstaben bis zum Handeln im
Souk — 304 Wörter und 100 Sätze, eingesprochen von einer marokkanischen Stimme
und nicht von einem Computer.

Danach 6,99 € im Monat, oder 59,99 € im Jahr mit dem E-Book dazu. Drei Tage
zum Ausprobieren, und gekündigt wird im Store selbst.

Shukran fürs Warten.
```

87 woorden, de twee adresregels niet meegerekend.

## es-ES

**Onderwerp**
`Darijaforkids ya está en las tiendas`

**Voorbeeldtekst**
`Para iPhone y para Android. Las cuatro primeras lecciones son gratis.`

**Kop**
`Ya está`

**Tekst**

```
Dejaste tu dirección para saber cuándo estaría la aplicación.

Ya está. Darijaforkids se puede descargar desde hoy en las dos tiendas.

Android — [[ANDROID]]
iPhone y iPad — [[APPLE]]

Las cuatro primeras lecciones son gratis: sin cuenta, sin rellenar nada, sin
publicidad. Detrás hay 17 unidades, de las letras al regateo en el souk — 304
palabras y 100 frases, grabadas por una voz marroquí y no por un ordenador.

Después 6,99 € al mes, o 59,99 € al año con el libro digital incluido. Tres
días para probarlo, y la baja se da en la propia tienda.

Shukran por la espera.
```

91 woorden, de twee adresregels niet meegerekend.

## it-IT

**Onderwerp**
`Darijaforkids è negli store`

**Voorbeeldtekst**
`Per iPhone e per Android. Le prime quattro lezioni sono gratis.`

**Kop**
`È arrivata`

**Tekst**

```
Hai lasciato il tuo indirizzo per sapere quando sarebbe arrivata l’app.

È arrivata. Darijaforkids si scarica da oggi in entrambi gli store.

Android — [[ANDROID]]
iPhone e iPad — [[APPLE]]

Le prime quattro lezioni sono gratis: nessun account, niente da compilare,
nessuna pubblicità. Dietro ci sono 17 unità, dalle lettere alla contrattazione
al souk — 304 parole e 100 frasi, registrate da una voce marocchina e non da
un computer.

Poi 6,99 € al mese, o 59,99 € all’anno con l’ebook incluso. Tre giorni per
provare, e la disdetta si fa nello store stesso.

Shukran per l’attesa.
```

86 woorden, de twee adresregels niet meegerekend.

## en-US

**Onderwerp**
`Darijaforkids is in the stores`

**Voorbeeldtekst**
`For iPhone and for Android. The first four lessons are free.`

**Kop**
`It is here`

**Tekst**

```
You left your address to hear when the app was ready.

It is here. Darijaforkids is in both stores from today.

Android — [[ANDROID]]
iPhone and iPad — [[APPLE]]

The first four lessons are free: no account, nothing to fill in, no ads.
Behind them are 17 units, from the letters to haggling at the souk — 304 words
and 100 sentences, recorded by a Moroccan voice and not by a computer.

After that it is € 6.99 a month, or € 59.99 a year with the e-book included.
Three days to try it, and you cancel in the store itself.

Shukran for waiting.
```

93 woorden, de twee adresregels niet meegerekend.

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
- **Geen "€ 5,00 per maand".** Dat is € 59,99 gedeeld door twaalf. Apple wees
  1.0 af op richtlijn 3.1.2(c) omdat die omrekening duidelijker stond dan het
  bedrag dat van de rekening gaat. Wat hier staat zijn de twee bedragen die
  afgeschreven worden.
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
2. **Open de twee adressen op een toestel.** Allebei, en niet op de Mac en niet
   in een tabblad waar je al ingelogd bent.
3. **Kijk of wat er live staat 1.4 is** — bij Apple build 10, bij Play
   versiecode 8. Dit is de eerste keer dat het één nummer is voor allebei de
   winkels, en dat is ook de reden dat het nagekeken moet worden.
4. **Stuur hem eerst naar jezelf**, in minstens twee talen. Kijk of de voet
   eronder staat, of de uitschrijflink werkt, en of de twee adressen klikbaar
   zijn geworden of als kale tekst in beeld staan.
5. **Alleen `bevestigd`.** Niet `wacht`. `npm run belangstelling` drukt de twee
   aantallen apart af; het tweede aantal mag deze mail niet krijgen.
