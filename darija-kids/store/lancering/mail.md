# De mail aan de wachtlijst

Eén mail, in zes talen, want het formulier staat in zes talen en de taal gaat
met de aanmelding mee.

**Nagekeken op 23 november: de lanceringsdag waarvoor dit geschreven is, is
voorbij.** Hier stond *"op de dag dat 1.4 in allebei de winkels staat — App
Store build 10, Play versiecode 8"*. Dat nummer is achterhaald: volgens
`docs/STAND.md` (*24 oktober: build 11 ligt bij Apple*) staat **1.5 — bij Apple
build 11, bij Play versiecode 10 — sinds 24 oktober in allebei de winkels**,
100% uitgerold. Daarvóór stond 1.4 live: bij Apple build 10 sinds 4 oktober,
bij Play versiecode 8 sinds 13 oktober — in allebei de winkels staat de app
dus al sinds 13 oktober.

Dat raakte de teksten zelf: alle zes de talen openden met *"Hij is er.
Darijaforkids staat vanaf vandaag in allebei de winkels"*, en dat was niet waar
— hij staat er sinds oktober.

**Op 24 november is die keuze gemaakt, en anders dan de twee die hier
openstonden.** Deze mail gaat niet over de dag dat de app er kwam en niet over
een korting, maar over de zomer: *leer je kind Darija vóór de volgende
zomervakantie.* De tijdelijke actie van 50% — € 29,99 voor het eerste jaar,
€ 2,50 per maand — gaat niet door; `docs/STAND.md` legt dat vast onder
*24 november: geen korting, maar een aftelling naar de zomer*. Daarmee is
*vanaf vandaag* uit alle zes de talen weg, en de prijzen die er staan zijn de
staande prijzen. Wat er in de plaats kwam en hoe je het schrijft staat onder
*De zomer, en het getal dat je niet verzint*.

Deze mensen hebben op *Hou me op de hoogte* gedrukt en daarna de link in de
bevestigingsmail aangeklikt. Wanneer dat was staat per rij in `aangemeld_op`;
`npm run belangstelling` zet het per dag uit. Waar ze niet om hebben gevraagd
is een verslag van wat er gebouwd is: ze hebben om één bericht gevraagd,
namelijk dat hij er is. Dat is dus wat er in staat, en verder zo weinig
mogelijk: de zomerboodschap die er sinds 24 november bij staat is één alinea
en geen tweede vraag.

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

**En daar verandert de zomer niets aan.** De haak is nieuw, de mail is
dezelfde soort: één bericht, onder de honderdtwintig woorden, met de twee
adressen erin en de uitschrijflink eronder. Wat de zomer toevoegt is geen
tweede vraag maar een reden om hem vandaag te openen in plaats van ooit — en
wie dat niet wil, heeft nog steeds één klik nodig om eraf te komen. Een tweede
mail over dezelfde campagne valt hier níet onder: dat blijft een eigen vraag
met een eigen antwoord.

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

Er staat nog een derde markering in de teksten, en sinds 24 november is dat
`[WEKEN]` in plaats van `[EINDDATUM]`: het aantal weken tot de zomervakantie.
Die heeft **enkele** haken, en dat is geen slordigheid — `[[` is de controle
die zegt dat er niets uit mag, en deze markering is van een andere soort. Hij
is wel strenger dan zijn voorganger: `[EINDDATUM]` mocht wegvallen, want de
zin eromheen was zonder datum al waar, maar *in [WEKEN] weken wel* is zonder
getal geen zin. Waarom hij er staat en wat je ermee doet staat onder *De zomer,
en het getal dat je niet verzint*; dat hij nagekeken wordt staat in *Vóór je
verstuurt*.

**Android eerst, iPhone eronder.** Dezelfde volgorde als in
`store/lancering/kanaal.md`. De reden staat in `docs/STAND.md`: de meeste
mensen in het kanaal zitten op Android. Over deze lijst zegt dat niets: in de
tafel staat geen toestel, en waar iemand vandaan kwam staat er ook niet. Een
andere aanwijzing is er niet, en de eerste regel die iemand leest hoort over
zijn eigen toestel te gaan.

De regels krijgen een label dat het toestel noemt en niet de winkel:

| De regel | Wat erachter komt |
|---|---|
| `Android —` | de Play-pagina; versiecode 10 is sinds 24 oktober 100% uitgerold |
| `iPhone en iPad —` | de App Store-pagina; 1.5 staat sinds 24 oktober op *Ready for Distribution* |

### De adressen dragen geen taal, en dat is goed zo

Nagekeken op 24 november, omdat de vraag opkwam of de Franse mail wel een
Franse winkelbladzijde opent. Allebei de adressen zijn taalloos, en allebei de
winkels kiezen de taal zelf:

| | |
|---|---|
| Apple | `apps.apple.com/app/id6813964474` — de korte vorm, zonder land en zonder slug. `src/site/links.ts` zegt waarom: apps.apple.com stuurt een bezoeker naar zijn eigen winkel, en deze app verkoopt in zes talen. |
| Play | `play.google.com/store/apps/details?id=app.darijaforkids.learn` — `playStoreUrl()` zet er geen `&hl=` achter, dus Play volgt de taal van het Google-account. |

Een `&hl=fr` of een `/fr/` in het adres zou het juist slechter maken: dan leest
een Franse lezer met een Belgische of Marokkaanse winkel een bladzijde van de
verkeerde winkel, of hij komt op een land uit waar hij niet kan kopen. Het
enige wat hier taal heeft zijn de labels ernaast, en in het Franse blok staan
die in het Frans: `Android —` (een merknaam, in elke taal hetzelfde) en
`iPhone et iPad —`. Hetzelfde in de vier andere talen: `iPhone und iPad`,
`iPhone y iPad`, `iPhone e iPad`, `iPhone and iPad`.

Wat de Franse lezer op die bladzijde aantreft is een andere vraag dan deze
mail, en het antwoord staat in `docs/STAND.md`: de Franse Play-vermelding heeft
nog geen eigen beelden, dus Play toont daar stilletjes de beelden van de
standaardvermelding — met Nederlandse tekst erop. `npm run playstand` leest per
taal wat er werkelijk staat; `npm run playpakket -- --lang fr` maakt de Franse
set en `npm run play` zet hem erin. Dat hoort vóór deze mail te gebeuren, want
het is de bladzijde waar de mail naartoe wijst.

### Wanneer ze ingevuld kunnen worden

**Pas als allebei de goedkeuringen binnen zijn, en niet eerder.** Dit is één
mail voor twee winkels; hij zegt dat de app in allebei staat, en dat moet waar
zijn op de minuut dat hij verstuurd wordt. Eén werkend adres en één 404 is
erger dan een dag later mailen.

**Nagekeken op 23 november: die voorwaarde is al vervuld.** Hier stond dat
`STORE.google` leeg was en dat de Play-pagina op 30 september **404 — Not found
on this server** gaf. Volgens `docs/STAND.md` staat 1.5 sinds 24 oktober in
allebei de winkels — bij Apple *Ready for Distribution*, bij Play 100%
uitgerold — dus allebei de pagina's gaan open.

- `STORE.apple` in `src/site/links.ts` staat gevuld —
  `https://apps.apple.com/app/id6813964474`.
- **En `STORE.google` ook, nagekeken op 24 november.** Hier stond dat hij nog
  leeg was en dat `playStoreUrl()` het adres uit het applicatie-id bouwde. In
  `links.ts` staat nu
  `https://play.google.com/store/apps/details?id=app.darijaforkids.learn`.

Een adres kennen is nog niet hetzelfde als een pagina die opengaat, dus de
controle blijft: allebei de adressen opengaan op een toestel, niet op de Mac en
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

## De zomer, en het getal dat je niet verzint

De haak is niet de prijs maar de zomervakantie: *leer je kind Darija vóór de
volgende zomervakantie.* De prijzen blijven staan — € 59,99 per jaar (dat is
€ 5,00 per maand) of € 6,99 per maand, inclusief btw, en het e-boek (los
€ 14,99) hoort bij het jaar.

**Waarom dat beter werkt dan de korting die hier stond.** Een korting zegt:
koop nu, want straks is het duurder. Dat is een reden om te betalen en geen
reden om te beginnen, en bij dit product zit de twijfel niet bij vijf euro per
maand — die zit bij de vraag of een kind het ooit echt gaat spreken. De zomer
draait dat om, en het is waar: een taal leer je niet in twee weken. Wie in juli
in Marokko staat en wil dat zijn kind met zijn oma praat, moet nu beginnen en
niet in juni. Dat is geen verkooptruc maar het argument van het product zelf,
en het is het enige dat van "ooit eens" een "deze week" maakt.

**De belofte eerst, het getal erna.** In alle zes de talen staat de zomer in de
eerste zin van die alinea en het aantal weken in de tweede. Het getal
onderbouwt de belofte; het is niet zelf de belofte. Daarom draagt ook de
onderwerpregel de zomer en geen cijfer: een onderwerpregel met een getal of een
prijs erin wordt geopend door wie al wilde kopen, en dat is niet de groep die
deze mail nodig heeft.

**De aftelling is een reden om te beginnen, nooit een reden om te haasten met
betalen.** Er loopt niets af en er wordt niets duurder. Daarom staat er in geen
van de zes talen *laatste kans*, *nu of nooit* of *op = op*: dat zou een
urgentie zijn die er niet is, en het is precies het soort bewering waar een
winkel een campagne op afrekent. Wat er wél staat is wat er in die maanden
gebeurt: een korte les per dag, en in juli groeten, bedanken, afdingen op de
souq en de familie verstaan. Dat zijn de units `groeten` (*salam*, *shukran*),
`winkelen` (*shhal hada*, *ghali bezzaf*) en `familie` (*jedda*, oma) uit
`src/content/curriculum.ts` — wat de app werkelijk leert, en niet een lijstje
dat mooi klinkt.

### `[WEKEN]`, en waarom er geen cijfer staat

Op de plek van het aantal weken staat de markering **`[WEKEN]`**, precies zo
geschreven, één keer per taal. Daar stond `[EINDDATUM]`, en de reden is
dezelfde: een cijfer in een kant-en-klare tekst in zes talen veroudert stil.
Wie in januari verstuurt wat in november geschreven is, stuurt "nog 31 weken"
terwijl het er 24 zijn.

Het getal reken je uit op de dag dat je verstuurt:

| | |
|---|---|
| `npm run aftellen` | naar 1 juli van het eerstvolgende jaar |
| `npm run aftellen -- --tot 2027-07-10` | naar een datum die je zelf kiest |

Hij drukt het aantal weken, het aantal dagen en een grover getal af — op
24 november: *31 weken*, *219 dagen*, *een maand of 7* tot 1 juli 2027 — en
zegt er altijd bij naar welke datum hij gerekend heeft. Zoek daarna op
`[WEKEN]` en vul het in — zes keer, één per taal.

**Welke datum je neemt, is geen detail.** Er is geen "de" zomervakantie:
Frankrijk begint begin juli in het hele land, Nederland in juli maar per regio
ruim twee weken uit elkaar, Duitsland per Bundesland van eind juni tot eind
juli. Neem de vroegste van de landen waar deze mail naartoe gaat; dan klopt het
getal overal, of het is er hooguit een paar te weinig. Een aftelling die te
vroeg afloopt is erger dan een die een week overhoudt. Dezelfde afweging staat
in de aantekening bovenaan `scripts/aftellen.mjs`.

**Enkele haken, met opzet**, net als bij `[EINDDATUM]` hiervoor. De twee
adresgaten hebben dubbele haken omdat `[[` de controle is die zegt: dan gaat er
niets uit. Deze is van een andere soort, maar hij laat zich niet weglaten zoals
`[EINDDATUM]` dat mocht — *in [WEKEN] weken wel* is zonder getal geen zin.
Vul hem dus in, of herschrijf die ene zin naar het grove getal (*in een maand
of zeven wel*), wat niet stil veroudert. Hij blijft buiten de `[[`-controle en
staat als eigen stap in *Vóór je verstuurt*.

**Waarom de onderwerpregel en de voorbeeldtekst geen `[WEKEN]` dragen.** Daar
staat de zomer zonder getal, en dat is een keuze per plek. Een onderwerpregel
is het eerste dat iemand leest en het enige dat hij later citeert als hij
terugschrijft dat het niet klopt. En de voorbeeldtekst wordt in het postvak
afgekapt, dus een getal kan daar halverwege afbreken. Zes markeringen, zes
plekken om te vullen: dezelfde telling als `[EINDDATUM]` had, en dus dezelfde
controle.

## nl-NL

**Onderwerp**
`Komende zomer praat je kind met zijn oma`

**Voorbeeldtekst**
`Een taal leer je niet in twee weken. Begin nu, niet pas in juni.`

**Kop**
`Vóór de volgende zomer`

**Tekst**

```
Je hebt je adres achtergelaten om te horen wanneer de app er is. Hij staat in
allebei de winkels.

Android — [[ANDROID]]
iPhone en iPad — [[APPLE]]

Komende zomer praat je kind met zijn oma. Een taal leer je niet in twee weken;
in [WEKEN] weken wel. Een korte les per dag, en in juli kan hij groeten,
bedanken, afdingen op de souq en de familie verstaan.

De app is gratis te downloaden: geen account, geen advertenties. De cursus is
een abonnement en gaat na het betalen in één keer open — 17 units, ingesproken
door een Marokkaanse stem.

€ 59,99 per jaar (dat is € 5,00 per maand) met het e-boek erbij, of € 6,99 per
maand. Opzeggen doe je in de winkel zelf.

Shukran voor het wachten.
```

117 woorden, de twee adresregels niet meegerekend.

## fr-FR

**Onderwerp**
`Cet été, votre enfant parlera à sa grand-mère`

**Voorbeeldtekst**
`Une langue ne s’apprend pas en deux semaines. Commencez maintenant, pas en juin.`

**Kop**
`Avant l’été`

**Tekst**

```
Vous avez laissé votre adresse pour savoir quand l’application serait prête.
Elle est dans les deux boutiques.

Android — [[ANDROID]]
iPhone et iPad — [[APPLE]]

Cet été, votre enfant parlera à sa grand-mère. Une langue ne s’apprend pas en
deux semaines ; en [WEKEN] semaines, oui. Une courte leçon par jour, et en
juillet il saura saluer, remercier, marchander au souk et comprendre la
famille.

L’application est gratuite à télécharger : pas de compte, pas de publicité. Le
cours est un abonnement et, une fois payé, tout s’ouvre d’un coup — 17 unités,
enregistrées par une voix marocaine.

59,99 € par an (soit 5,00 € par mois) avec le livre numérique, ou 6,99 € par
mois. La résiliation se fait dans la boutique elle-même.

Shukran pour votre patience.
```

114 woorden, de twee adresregels niet meegerekend.

## de-DE

**Onderwerp**
`Nächsten Sommer spricht dein Kind mit seiner Oma`

**Voorbeeldtekst**
`Eine Sprache lernt man nicht in zwei Wochen. Fang jetzt an, nicht erst im Juni.`

**Kop**
`Vor dem nächsten Sommer`

**Tekst**

```
Du hast deine Adresse hinterlassen, um zu hören, wann die App da ist. Sie steht
in beiden Stores.

Android — [[ANDROID]]
iPhone und iPad — [[APPLE]]

Nächsten Sommer spricht dein Kind mit seiner Oma. Eine Sprache lernt man nicht
in zwei Wochen; in [WEKEN] Wochen schon. Eine kurze Lektion pro Tag, und im
Juli kann es grüßen, danken, im Souk handeln und die Familie verstehen.

Die App lässt sich kostenlos herunterladen: kein Konto, keine Werbung. Der Kurs
läuft über ein Abo und steht nach dem Bezahlen auf einmal offen — 17 Einheiten,
eingesprochen von einer marokkanischen Stimme.

59,99 € im Jahr (das sind 5,00 € im Monat) mit dem E-Book dazu, oder 6,99 € im
Monat. Gekündigt wird im Store selbst.

Shukran fürs Warten.
```

112 woorden, de twee adresregels niet meegerekend.

## es-ES

**Onderwerp**
`El próximo verano tu hijo hablará con su abuela`

**Voorbeeldtekst**
`Un idioma no se aprende en dos semanas. Empieza ahora, no en junio.`

**Kop**
`Antes del próximo verano`

**Tekst**

```
Dejaste tu dirección para saber cuándo estaría la aplicación. Ya está en las
dos tiendas.

Android — [[ANDROID]]
iPhone y iPad — [[APPLE]]

El próximo verano tu hijo hablará con su abuela. Un idioma no se aprende en dos
semanas; en [WEKEN] semanas, sí. Una lección corta al día, y en julio sabrá
saludar, dar las gracias, regatear en el souk y entender a la familia.

La aplicación se descarga gratis: sin cuenta, sin publicidad. El curso es una
suscripción y, después de pagar, todo se abre de una vez — 17 unidades,
grabadas por una voz marroquí.

59,99 € al año (son 5,00 € al mes) con el libro digital incluido, o 6,99 € al
mes. La baja se da en la propia tienda.

Shukran por la espera.
```

117 woorden, de twee adresregels niet meegerekend.

## it-IT

**Onderwerp**
`L’estate prossima tuo figlio parlerà con la nonna`

**Voorbeeldtekst**
`Una lingua non si impara in due settimane. Comincia adesso, non a giugno.`

**Kop**
`Prima della prossima estate`

**Tekst**

```
Hai lasciato il tuo indirizzo per sapere quando sarebbe arrivata l’app. È in
entrambi gli store.

Android — [[ANDROID]]
iPhone e iPad — [[APPLE]]

L’estate prossima tuo figlio parlerà con la nonna. Una lingua non si impara in
due settimane; in [WEKEN] settimane, sì. Una lezione breve al giorno, e a
luglio saprà salutare, ringraziare, contrattare al souk e capire la famiglia.

L’app si scarica gratis: nessun account, nessuna pubblicità. Il corso è un
abbonamento e, dopo il pagamento, si apre tutto in una volta — 17 unità,
registrate da una voce marocchina.

59,99 € all’anno (sono 5,00 € al mese) con l’ebook incluso, o 6,99 € al mese.
La disdetta si fa nello store stesso.

Shukran per l’attesa.
```

107 woorden, de twee adresregels niet meegerekend.

## en-US

**Onderwerp**
`Next summer your child talks to their grandmother`

**Voorbeeldtekst**
`You do not learn a language in two weeks. Start now, not in June.`

**Kop**
`Before next summer`

**Tekst**

```
You left your address to hear when the app was ready. It is in both stores.

Android — [[ANDROID]]
iPhone and iPad — [[APPLE]]

Next summer your child talks to their grandmother. You do not learn a language
in two weeks; in [WEKEN] weeks you do. One short lesson a day, and by July they
can greet, say thank you, haggle at the souk and understand the family.

The app is free to download: no account, no ads. The course is a subscription,
and once you pay it all opens in one go — 17 units, recorded by a Moroccan
voice.

€ 59.99 a year (that is € 5.00 a month) with the e-book included, or € 6.99 a
month. You cancel in the store itself.

Shukran for waiting.
```

117 woorden, de twee adresregels niet meegerekend.

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

**Er staat dus geen knoptekst in deze mail**, en daarmee ook niets aan een knop
dat over de vervallen actie ging — nagekeken op 24 november, `knop` blijft
leeg. Komt die tweede knop er wel, dan is de tekst *Begin vandaag* en niet
*Profiteer nu*: een knop hoort hetzelfde te beloven als de onderwerpregel, en
haast beloven mag hij niet, want er loopt niets af.

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

- **Niets over welke versie het is.** Wie zich via de site aanmeldde heeft de
  app nog nooit geopend, dus het startscherm in vier stappen is voor hem geen nieuws maar
  gewoon hoe de app begint. Wie via de ouderpagina binnenkwam heeft hem wél
  geopend, maar in de tafel is dat niet te zien en één mail kan niet twee
  kanten op. Wie het wil lezen vindt het in de winkel onder *wat is er nieuw*.
  Hetzelfde geldt voor "haal de update op" — die regel staat in
  `store/lancering/kanaal.md` omdat daar mensen zitten die hem al hebben.
- **Geen aantal.** Geen gebruikers, geen downloads, geen recensies, geen
  sterren. Hier stond dat die er niet zijn; dat is sinds oktober niet meer waar
  — `docs/STAND.md` telt bij Apple 149 downloads en vijf betaalde plannen en bij
  Play 38 installaties. Het zijn alleen geen getallen waarmee je iemand
  overhaalt, en recensies en sterren zijn er inderdaad niet.
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
- **Geen omrekening zonder het bedrag dat afgeschreven wordt.** Hier stond dat
  "€ 5,00 per maand" er helemaal uit bleef. Dat was de voorzichtige vorm van de
  regel, in een mail die toen twee jaarprijzen en twee omrekeningen droeg; de
  regel zelf is de órde. Apple wees 1.0 af op richtlijn **3.1.2(c)** omdat de
  omrekening duidelijker stond dan het bedrag dat van de rekening gaat. In die
  orde staat hij nu in alle zes de talen: *€ 59,99 per jaar (dat is € 5,00 per
  maand)* — het afgeschreven bedrag eerst, de omrekening tussen haakjes
  erachter, nooit los. Dat is woord voor woord de zin die het antwoord over de
  prijs in `faq` (`src/i18n/<taal>.ts`) ook gebruikt, en dezelfde orde als op
  de winkelafbeelding (`pil1` in `scripts/make-screenshots.mjs`, bewaakt door
  `src/pages/prijsweergave.test.ts`). De bedragen die hier vooraan staan zijn
  de bedragen die afgeschreven worden: € 59,99 en € 6,99.
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
- **Geen datum, en geen "deze week nog".** De aftelling staat in weken en niet
  in een datum: welke dag de zomervakantie begint hangt van het land en van de
  regio af, en die keuze ligt bij wie verstuurt. *Laatste kans* en *op = op*
  staan er evenmin, want er loopt niets af en er wordt niets duurder. Wat de
  aftelling zegt is niet dat de prijs verandert maar dat de tijd verstrijkt, en
  dat is waar.

# Vóór je verstuurt

**Het besluit dat hier openstond, is op 24 november genomen:** deze mail gaat
over de zomer, niet over de dag dat de app er kwam en niet over een korting.
Daarmee is *"Hij is er. Darijaforkids staat vanaf vandaag in allebei de
winkels"* uit alle zes de talen weg — die zin stond er en was sinds 24 oktober
niet meer waar (`docs/STAND.md`). Wat er nu staat noemt geen dag: *hij staat in
allebei de winkels*, en dat blijft waar zolang hij daar staat. Lees de eerste
regel van elke taal nog één keer na met die vraag in je hoofd, want een onjuiste
openingszin naar de hele lijst is niet terug te nemen.

1. **Zoek op `[[`.** In alle zes de talen, in de samengestelde tekst, en ook in
   de HTML-versie. Eén treffer betekent: niet versturen.
2. **Zoek op `[WEKEN]`.** Zes treffers in de plakbare blokken, één per taal;
   de overige treffers staan in het proza hierboven, waar de markering
   besproken wordt. Draai
   `npm run aftellen -- --tot <de datum die je kiest>`, vul dat ene getal zes
   keer in, en lees daarna één taal hardop: *in 31 weken wel* leest anders dan
   *in 3 weken wel*, en bij een laag getal is dat de zin niet meer die je
   bedoelde. Wat niet mag is de markering laten staan — dan gaat `[WEKEN]` als
   woord de deur uit — en wegstrepen mag ook niet, want anders dan
   `[EINDDATUM]` laat deze een zin achter die niet meer loopt. Wil je hem kwijt,
   herschrijf de zin dan naar het grove getal uit datzelfde commando (*in een
   maand of zeven wel*).
3. **Rekent de winkel de prijs die in de mail staat?** € 59,99 per jaar en
   € 6,99 per maand, de staande prijs; de actie van 50% gaat niet door
   (`docs/STAND.md`, *24 november*). Staat er in een van de consoles tóch nog
   een introductieaanbieding aan, dan is dat wat de koper leest en niet wat hier
   staat. Kijk niet in de console maar op het aankoopvenster zelf, op een
   telefoon, in de app uit de winkel: de console zegt wat er ingesteld is, niet
   wat de koper ziet. Een mail die een prijs noemt die de winkel niet rekent is
   Apple 2.3.1, en die geldt ook buiten de App Store.
4. **Open de twee adressen op een toestel.** Allebei, en niet op de Mac en niet
   in een tabblad waar je al ingelogd bent.
5. **Kijk welke versie er live staat.** Volgens `docs/STAND.md` is dat sinds
   24 oktober 1.5 — bij Apple build 11, bij Play versiecode 10. Hier stond
   *"1.4, bij Apple build 10, bij Play versiecode 8"*, en dat is 1.4 — bij Apple
   live sinds 4 oktober, bij Play sinds 13 oktober. Let op het tweede deel
   hiervan: de app met de betaalmuur bij de
   download is commit `123a8c1` en die is **nog niet ingediend** — in
   `docs/STAND.md` blokkeert het accepteren van de Apple Developer Program
   License Agreement al het andere. Zolang dat zo is geeft de app uit de winkel
   nog acht gratis lessen, terwijl deze mail zegt dat de cursus een abonnement
   is. Dat is niet de kant die Apple 2.3.1 bestraft, maar het is wél een
   verschil tussen de mail en wat de lezer aantreft.
6. **Stuur hem eerst naar jezelf**, in minstens twee talen. Kijk of de voet
   eronder staat, of de uitschrijflink werkt, en of de twee adressen klikbaar
   zijn geworden of als kale tekst in beeld staan.
7. **Alleen `bevestigd`.** Niet `wacht`. `npm run belangstelling` drukt de twee
   aantallen apart af; het tweede aantal mag deze mail niet krijgen.
