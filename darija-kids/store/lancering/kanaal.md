# Het kanaalbericht van de zomercampagne

Eén bericht voor het WhatsApp-kanaal. Te plakken zoals het staat, op het
weekgetal na — zie het punt daarover hieronder. Daaronder een kortere versie
voor wie het wil doorsturen, en daaronder waarom het bericht zo is.

**"Vanaf vandaag" staat er niet meer in.** Play gaf 1.4 vrij op 13 oktober en
sinds 24 oktober staat 1.5 in allebei de winkels — App Store build 11, Play
versiecode 10 (`docs/STAND.md`). Dát de app er is, is dus geen nieuws, en dit
bericht doet ook niet alsof: het gaat over de zomervakantie, en de app staat
erin als het antwoord daarop. Wat er wél nieuw moet zijn vóór je plaatst, is de
versie met de betaalmuur — 1.6, en die staat er nog niet. Dat is het eerste
punt van de controlelijst onderaan.

**Wat hieronder over geld staat, is van 24 november.** Er zijn geen gratis
lessen meer en geen proefperiode: de app is gratis te downloaden, de cursus is
een abonnement, en dat wordt op het eerste scherm gevraagd. Na het betalen gaat
alles in één keer open — geen porties van acht lessen. En er loopt géén
tijdelijke actie: de prijzen blijven staan zoals ze staan. De onderbouwing
staat boven `magLeren` in `src/engine/store.ts`; het besluit over de campagne
in `docs/STAND.md`, onder *24 november: geen korting, maar een aftelling naar
de zomer*. Dezelfde regels gelden in `store/lancering/mail.md` en
`store/lancering/socials.md`, en elke regel over geld in dit bestand is daarop
nagekeken.

Het publiek is klein en nieuw. Het kanaal begon op woensdag 30 september en
stond op dag één op 43 volgers — `docs/STAND.md`. Er is nooit afgeteld naar een
dag waarop de app zou verschijnen: het kanaal doet elke dag wat het elke dag
doet, en op deze dag staat dit bericht ertussen. Voor vrijwel iedereen die het
leest is dit dus het eerste wat hij van de app hoort, en niet de laatste
aflevering van iets wat hij al volgde. Wat dit bericht te melden heeft is
daarom niet dat de app er is, maar waar hij voor is: komende zomer.

## Drie dingen die erin moeten

1. **De belofte: komende zomer praat je kind met zijn oma.** Dat is de eerste
   regel, en dat is waar dit bericht over gaat. Niet de app en niet de prijs —
   die komen erna.
2. **De reden om vandaag te beginnen en niet in juni.** Een taal leer je niet
   in twee weken, en dat is geen bezwaar maar het hele argument: met één korte
   les per dag kan een kind in juli groeten, bedanken en afdingen op de souq.
   Het aantal weken onderbouwt die belofte en staat er dus achter, nooit
   ervoor.
3. **Wat iemand krijgt als hij hem opent, en wat het kost.** Niet wat de app
   kan — wat er gebeurt. Vier stappen, dan de vraag om het abonnement, en na
   het betalen alles open. Downloaden is gratis, en geen account en niets in te
   vullen. Wie dat gelezen heeft, weet precies waar hij aan begint.

Al het andere is er bij. `store/kanaal-socials.md` zegt het: een bericht dat
drie dingen vraagt krijgt er nul. Dit bericht vraagt om één ding, en dat is
het doorsturen naar één familiegroep.

---

## Het bericht

```
Komende zomer praat je kind met zijn oma. Zelf, zonder jou ertussen als tolk.

Hij verstaat haar nu al. Antwoorden lukt alleen niet — en daar begint deze app.

Een taal leer je niet in twee weken. Dat is geen bezwaar, dat is de reden om
vandaag te beginnen: nog [WEKEN] weken tot de zomervakantie, en één korte les
per dag is genoeg. In juli kan je kind begroeten, bedanken, vragen hoe het
gaat, afdingen op de souq, en zeggen wie wie is in de familie.

Darijaforkids staat in allebei de winkels, op iPhone en op Android. De links
staan onder dit bericht.

Open je hem, dan begint hij met vier vragen. In welke taal je leert. Wie je
bent: je naam en een dier. Hoe je meeleest: het Arabische schrift, de klanken
in ons eigen alfabet, of allebei. En hoe het eruitziet: een kleur. Die kleur
zit daarna op je knoppen, op je voortgang en om je avatar.

Downloaden is gratis: geen account, niets in te vullen, geen advertenties. De
cursus zelf is een abonnement, en dat vraagt hij meteen daarna. Betaal je, dan
gaat alles in één keer open — geen porties.

En dan ligt de hele route voor je. 17 units, van de letters tot afdingen op de
souq. 304 woorden en 100 zinnen. 432 opnames, allemaal ingesproken door een
Marokkaanse stem — geen computerstem. De app werkt offline, en er gaat niets
naar een server.

De uitleg staat in zes talen: Nederlands, Frans, Duits, Spaans, Italiaans en
Engels. Dus ook voor de neefjes en nichtjes over de grens.

€ 59,99 per jaar (dat is € 5,00 per maand) met het e-boek erbij, of € 6,99 per
maand. Er loopt niets af en er wordt niets duurder; opzeggen doe je in de
winkel zelf.

Staat hij al op je toestel, haal dan de update op. Wat je al had afgerond,
blijft open staan.

Als het je iets lijkt: stuur het door naar één familiegroep. Daar help je me
het meest mee 🇲🇦
```

## Waar de twee links komen

Ze staan niet in de tekst, en dat is geen vergeetpost: een plakbaar blok met
een gat erin wordt geplakt mét het gat — zie `CLAUDE.md` over `<de waarde van
KOOP_GEHEIM>`, die zo in een veld bij Gumroad belandde. Daarom eindigt het
blok hierboven bij de laatste zin, en komen de links er bij het plaatsen als
twee losse regels ónder.

Dit zijn die twee regels, Android eerst. Het zijn dezelfde adressen die `STORE`
in `src/site/links.ts` gebruikt:

```
🤖 Android — https://play.google.com/store/apps/details?id=app.darijaforkids.learn
📱 iPhone en iPad — https://apps.apple.com/app/id6813964474
```

Het Apple-adres is het korte, met opzet zonder landcode: apps.apple.com stuurt
een bezoeker zelf naar zijn eigen winkel, en deze app verkoopt in zes talen.

Twee regels, in die volgorde, en er staat verder niets onder. Android eerst
omdat de meeste mensen in het kanaal op Android zitten — dat staat in
`docs/STAND.md`, en het is dezelfde reden dat er op 2 oktober niet
aangekondigd is. De eerste regel die iemand leest hoort over zijn eigen
toestel te gaan.

En geen derde link. `darijaforkids.eu` kan er makkelijk bij, en dan staan er
drie plekken om heen te gaan voor één app. De site is waar je mensen
naartoe stuurt zolang er nog niets in een winkel staat; vandaag is dat
voorbij.

## Korter, om door te sturen

Het bericht hierboven is voor het kanaal. Wie het doorstuurt naar een
familiegroep, stuurt een lap tekst zonder beeld — `store/kanaal-socials.md`
staat daar al bij stil. Dit blok is voor die groep, met dezelfde twee links
eronder. Het is ook het blok voor de persoonlijke berichten, een uur vóór het
kanaal: `docs/GO-LIVE.md` zet die om 09:00 en het kanaal om 10:00. Hier stond
`docs/LANCERING.md` §7, en dat is een verkeerde verwijzing — §7 daar gaat over
Facebook en de zestig mensen staan in §4. `docs/werk/draaiboek-concept-1.4.md`
wees die fout zelf al aan, voor dit bestand en voor `socials.md`:

```
Komende zomer praat je kind met zijn oma, zelf. Een taal leer je niet in twee
weken, dus dit is iets om vóór de zomervakantie te beginnen — één korte les per
dag. Darijaforkids staat in allebei de winkels, voor iPhone en voor Android:
gratis te downloaden, en de cursus is een abonnement. € 59,99 per jaar (dat is
€ 5,00 per maand) met het e-boek erbij, of € 6,99 per maand. 17 units
Marokkaans-Arabisch, van de letters tot afdingen op de souq, ingesproken door
een Marokkaanse stem — geen computerstem. Geen account, geen advertenties.
```

Vijf dingen, in deze orde: de belofte, waarom vandaag en niet in juni, waar
hij staat, wat het kost, en wat het is. Wie hem doorstuurt hoeft niets uit te
leggen.

**En hier staat geen aantal weken, terwijl het bericht hierboven het wél
heeft.** Dat is een keuze per plek en geen vergeetpost. Het kanaalbericht wordt
op één dag geplaatst en daarna gelezen zoals het er staat; dit blok gaat van
familiegroep naar familiegroep en wordt in februari nog eens doorgestuurd, en
dan is "nog [WEKEN] weken" ingevuld met het getal van vandaag. *Vóór de
zomervakantie* veroudert niet, en het zegt hetzelfde.

## Waarom het bericht zo is

**Het opent met de belofte, niet met het nieuws.** "Komende zomer praat je
kind met zijn oma" is waar dit bericht om gaat; de rest is uitleg voor wie
doorleest. Hier stond dat het bericht opende met vier woorden — *"Hij staat
er"*, zoals in `docs/GO-LIVE.md` boven het YouTube-bericht en toen ook als
onderwerp van de mail. Dat was de aankondiging van een app die er nog niet
was. Hij staat er sinds oktober, dus is die opening niet meer dan een mededeling
over het verleden, en ze vraagt niemand om vandaag iets te doen. De zomer doet
dat wel. Dezelfde keuze staat in `store/lancering/mail.md`, waar de
onderwerpregel nu *Komende zomer praat je kind met zijn oma* is.

**De aftelling telt naar de zomer, en niet naar een afloop.** Een korting zegt:
koop nu, want straks is het duurder. Dat is een reden om te betalen en geen
reden om te beginnen — en bij dit product zit de twijfel niet bij vijf euro per
maand maar bij de vraag of een kind het ooit echt gaat spreken. De zomer draait
dat om, en het is waar: een taal leer je niet in twee weken. Wie in juli in
Marokko staat en wil dat zijn kind met zijn oma praat, moet nu beginnen en niet
in juni. Dat is het argument van het product zelf (`docs/STAND.md`, *24
november: geen korting, maar een aftelling naar de zomer*), en het is het enige
dat van "ooit eens" een "deze week" maakt.

Daarom staat het getal nooit vóór de belofte, en staat er nergens dat er iets
afloopt. Zie `[WEKEN]` hieronder, en de twee laatste punten onder *Wat er niet
in staat*.

### Het weekgetal: `[WEKEN]` en `npm run aftellen`

In het bericht staat één markering, **`[WEKEN]`**, precies zo geschreven —
dezelfde vorm als `[EINDDATUM]` in de versie die hier tot 24 november stond,
zodat één zoekopdracht hem vindt. Er staat met opzet geen cijfer: dit bericht
kan over een maand nog geplaatst worden, en wie er nu "nog 31 weken" in zet
plaatst in januari een bericht dat 31 zegt terwijl het er 24 zijn.

Het getal reken je uit op de dag dat je plaatst:

```powershell
if (-not $p) { $p = (Get-ChildItem $HOME -Recurse -Depth 5 -Filter darija-kids -Directory -ErrorAction SilentlyContinue | Select-Object -First 1).FullName }; if ($p) { npm --prefix $p run aftellen -- --tot 2027-07-10 } else { "darija-kids niet gevonden onder $HOME" }
```

Die 10 juli is een voorbeeld en geen besluit; zonder `--tot` rekent hij naar de
eerstvolgende 1 juli en drukt erbij af naar welke datum hij gerekend heeft. Hij
geeft ook de dagen en een grover getal ("een maand of 7"), voor als een tekst
daar beter mee leest.

**Welke datum je neemt, is geen detail.** Er is geen "de" zomervakantie:
Frankrijk begint begin juli in het hele land, Nederland in juli maar per regio
ruim twee weken uit elkaar, Duitsland per Bundesland van eind juni tot eind
juli. Het kanaal is Nederlandstalig, maar het bericht wordt doorgestuurd naar
familie over de grens — neem dus de vroegste datum van de landen waar het
terechtkomt. Dan klopt het getal overal, of het is er hooguit een paar te
weinig, en een aftelling die te vroeg afloopt is erger dan een die een week
overhoudt. Dezelfde afweging staat bovenaan `scripts/aftellen.mjs`.

**De vier stappen staan vóór de prijs, want zo komt een kind ze tegen.** De
volgorde is die van het scherm zelf: `src/ui/Welcome.tsx` begint met de taal,
dan wie je bent, dan hoe je meeleest, dan hoe het eruitziet — en op die
laatste stap staat ook wat het kost, want "een ouder hoort te weten wat de app
kost voordat het eerste lesje begint". Daarna komt het abonnementsscherm:
`Poort` in `src/App.tsx` stuurt iedereen zonder abonnement naar `/volledig`.
Dat scherm kwam met 1.4; dat het meteen komt en niet pas na een paar gratis
lessen is het nieuwe van 1.6 — `store/wat-is-nieuw-1.6.md`. Maar voor bijna
iedereen die dit leest is het geen wijziging: het is de eerste minuut.

**"Geen account, niets in te vullen" staat bij "downloaden is gratis" en niet
in een lijstje onderaan.** Daar wordt de vraag gesteld — wat moet ik hiervoor
geven — en daar hoort dus het antwoord. Tot 23 november stond die regel bij de
gratis lessen, want dáár werd de vraag toen gesteld; die lessen zijn er niet
meer, en de vraag verhuist mee naar de enige stap die nog zonder geld gaat.

**De prijs staat erin, en dat is geen beslissing meer.** Hier stond dat
`docs/GO-LIVE.md` onder "Wat je die dag niet doet" *"geen prijs in de eerste
boodschap"* vraagt en dat de regel te schrappen was als T-2 al geweest was.
Sinds 23 november kan dat niet meer: de cursus ís een abonnement en dat is het
eerste wat de app vraagt. Een bericht dat alleen "download hem" zegt, stuurt
iemand naar een betaalscherm waar hij niet op gerekend had — en dat is precies
het "beetgenomen" dat die passage wilde voorkomen. Wat er van die passage
overblijft is de toon: één regel met de bedragen, zonder uitleg eromheen.

**En de prijsregel is ook een winkelregel.** Een belofte over geld die de
winkel niet nakomt is bij Apple richtlijn **2.3.1**, en die geldt woordelijk
*"whether within or outside of the App Store"* — dus ook voor een bericht in
een WhatsApp-kanaal. Daarom staat in de controlelijst onderaan dat de bedragen
in dit bericht de bedragen in beide consoles moeten zijn, en dat er geen
aanbieding mag lopen die het bericht niet noemt. Tot 24 november stond daar dat
de tijdelijke actie werkelijk in de consoles moest staan; die komt er niet, dus
is het nu dezelfde controle de andere kant op.

**Eén regel voor wie hem al heeft, met één belofte erbij.** 1.0 staat sinds
2 oktober in de App Store, zonder dat het ergens aangekondigd is, en 1.5 sinds
24 oktober in allebei de winkels. Wie de app dus al heeft, leest een bericht
over komende zomer en denkt: dat heb ik al staan. Voor hem is er wél iets
veranderd, en het staat op zijn eigen toestel. "Haal de update op" zegt dat
zonder er een verhaal van te maken.

En de tweede helft van die regel is nieuw en kan niet weg. In 1.0 en 1.5 waren
er gratis lessen; wie daar iets heeft afgerond, houdt precies dat en niets erbij —
`magLeren` hangt aan `isDone` in plaats van aan een lijst, zodat een afgeronde
les open blijft en een nieuwe dichtgaat. Wie die zin niet leest, haalt een
update op en denkt dat hem iets is afgenomen. Dat is het soort misverstand dat
je terugleest in een beoordeling, op precies de winkelbladzijde waar dit
bericht naartoe wijst.

Wat die regel níét belooft is het nieuwe startscherm. `langPicked` blijft bij
een update staan — `hydrate()` in `src/engine/store.ts` neemt de opslag over,
en `Welcome.tsx` sluit zich zodra die vlag om is. Wie al eerder een taal koos,
slaat dus precies het scherm over dat het bericht hierboven beschrijft; zijn
naam, zijn dier en zijn kleur staan in Instellingen en op Profiel. Dat erbij schrijven
maakt van één regel een alinea, dus staat het er niet — maar beloven dat hij
het scherm te zien krijgt, kan ook niet.

**De slotzin vraagt één keer, en vraagt klein.** Niet "deel het met iedereen"
maar één familiegroep. `store/kanaal-socials.md` legt uit waarom
toestemming beter werkt dan een oproep; hier is het geen toestemming maar een
verzoek, en dan is één groep het verschil tussen iets wat iemand doet en iets
wat hij zich voorneemt.

## Wat er niet in staat, en waarom

- **Geen aantal.** Geen downloads, geen recensies, geen sterren — die zijn er
  niet. En geen volgersaantal: 43 op dag één is een eerlijk getal, maar het
  zegt een lezer niets dat hem aangaat.
- **Geen citaat van een ouder, en geen kind dat iets tegen zijn oma zegt.** Dat
  is het sterkste dat dit kanaal kan posten en het is onmogelijk om vandaag
  echt te hebben. `docs/GO-LIVE.md` zet het onder "De dagen erna" op dag 7,
  met een ouder die het zelf opstuurt.
- **Geen gratis les en geen proefperiode.** Sinds 23 november zijn ze er niet
  — zie de aantekening boven `magLeren` in `src/engine/store.ts`. Wat ervoor in
  de plaats staat verkoopt net zo hard: gratis te downloaden, 432 opnames van
  een echte Marokkaanse stem, geen advertenties, er wordt niets van je kind
  verzameld, werkt offline, geen account, zeventien units, en een reden om
  vandaag te beginnen in plaats van in juni.
- **Geen omrekening per maand die alleen staat.** € 5,00 is € 59,99 gedeeld
  door twaalf, en Apple wees 1.0 af op richtlijn 3.1.2(c) omdat zo'n omrekening
  duidelijker stond dan het bedrag dat van de rekening gaat. In een winkeltekst
  is dat een afwijzing; in een bericht aan mensen die je vertrouwen is het
  erger. Daarom staat de omrekening hierboven nooit vooraan en nooit alleen,
  maar tussen haakjes achter het bedrag dat werkelijk wordt afgeschreven:
  "€ 59,99 per jaar (dat is € 5,00 per maand)". Die richtlijn geldt bij elke
  prijs en niet alleen bij een actieprijs — daarom staan ook de
  winkelafbeeldingen sinds 24 november weer in diezelfde orde, met de staande
  jaarprijs groot en de omrekening eronder (`src/pages/prijsweergave.test.ts`
  bewaakt het).
- **Geen gezinsdeling.** Bij Apple deelt het hele gezin één abonnement, bij
  Google niet. Dat is waar, en het is een goed argument — maar één bericht voor
  twee winkels kan het niet noemen zonder per winkel een voetnoot. Het hoort
  op het koopscherm, waar de app weet in welke winkel hij staat.
- **Niets over het e-boek, behalve dat het bij het jaar hoort.** Wanneer het
  precies vrijkomt staat in `store/wat-is-nieuw-1.1.md` en op het koopscherm.
  Dat is de plek waar een koper het leest op het moment dat het hem aangaat.
- **Geen boeken en geen verzoek om een beoordeling.** Allebei verdedigbaar, en
  allebei een tweede vraag. De beoordeling staat in `docs/GO-LIVE.md` op dag 3.

  **En geen openingsactie.** Hier stond op 23 november dat die de uitzondering
  was: de actie van 50% op het jaar ís de prijs van vandaag, zei dit punt, dus
  vraagt ze niets extra. Die actie komt er niet (`docs/STAND.md`, *24 november:
  geen korting, maar een aftelling naar de zomer*), dus is de uitzondering weg
  en staat de regel er weer onverkort: één vraag per bericht. De haak van de
  campagne is geen prijs maar de zomer, en die vraagt ook niets extra — ze
  staat in de eerste regel en ze is de reden dat de rest er staat.
- **Geen "eindelijk" en geen terugblik op twee jaar werk.** Er is met opzet
  niet afgeteld naar een dag waarop de app zou verschijnen — `docs/GO-LIVE.md`,
  "De dag kiezen" — en een bericht dat begint met hoe lang het duurde, gaat over
  de maker en niet over de app. **De aftelling die er sinds 24 november wél in
  staat, telt naar iets anders:** naar de zomervakantie, en niet naar een moment
  waarop de app verschijnt, de prijs verandert of een aanbieding afloopt. Dat is
  een reden om te beginnen en geen reden om te haasten.
- **Geen datum, ook niet voor de zomervakantie.** Als dit bericht de deur uit
  gaat, staat de app er. Anders gaat het niet de deur uit. En er staat nergens
  een dag waarop de zomervakantie begint: die is per land en per regio anders —
  in Nederland al ruim twee weken verschil tussen noord en zuid — dus zou elke
  datum voor een deel van de lezers onwaar zijn. Er staat één getal, het aantal
  weken, als `[WEKEN]` tot je het invult.
- **Geen "op = op", geen "laatste kans", geen "nog maar even".** Er loopt niets
  af en er wordt niets duurder, dus zou het onwaar zijn — en een onware
  urgentie is bij Apple dezelfde richtlijn **2.3.1**, die woordelijk ook buiten
  de App Store geldt. Daarom zegt het bericht het zelf met zoveel woorden: *er
  loopt niets af en er wordt niets duurder.* Dat is geen kleine letter maar het
  verschil tussen een aftelling die je vertrouwt en een die je wegklikt.
- **Geen enkel getal dat niet nagerekend is.** 17 units, 304 woorden, 100
  zinnen, 432 opnames, 6 talen, 2 winkels, en de drie bedragen: € 6,99,
  € 59,99 en € 5,00. De eerste vier komen uit `src/content/` en
  `src/site/site.test.ts` rekent ze bij elke testronde na — 432 is het aantal
  opnames en niet het aantal woorden: dat zijn 304 woorden plus 100 zinnen plus
  28 letters. De talen staan in `src/i18n/languages.ts`. € 6,99 en € 59,99
  staan in `PLANS` in `src/engine/billing.ts`, en € 5,00 staat daar als
  `perMonth` bij het jaar: € 59,99 gedeeld door twaalf, op de cent afgerond.
  Het e-boek van € 14,99 staat in `EBOOK` in hetzelfde bestand; dit bericht
  noemt dat bedrag niet, alleen dat het bij het jaar hoort.

  **En `[WEKEN]` is geen getal maar een markering.** Het komt uit
  `npm run aftellen` op de dag dat je plaatst, en niet uit dit document — zie
  *Het weekgetal* hierboven.

  *Teruggedraaid op 24 november.* Hier stond € 29,99 als derde bedrag, met de
  waarschuwing erbij dat het in `PLANS` geen prijs ís: de actieprijs las de app
  uit wat de winkel teruggaf (`nuFase` in hetzelfde bestand), dus moest je dat
  bedrag in het aankoopvenster op een telefoon nakijken in plaats van het uit
  een document over te schrijven. Die actie komt er niet, dus staan er nu alleen
  bedragen die wél in `src/engine/billing.ts` staan — en blijft die
  waarschuwing gelden voor elk bedrag dat er ooit weer bij komt.

  *Teruggedraaid op 23 november.* Hier stonden ook "8 gratis lessen" en
  "3 dagen", met `GRATIS_LESSEN` en `TRIAL_DAYS` in `src/engine/` als bron, en
  de aantekening dat het er vier waren tot 12 november en dat deze regel zelf
  een tijd met het verkeerde getal naar de bron wees die hem weerlegde.
  `GRATIS_LESSEN` bestaat niet meer en de proefperiode is uit het aanbod — zie
  de aantekening boven `magLeren` in `src/engine/store.ts`. `TRIAL_DAYS` staat
  er nog wel, maar is bewoording en geen belofte: de app leest de proef uit
  `billing.proef.jaar`, dus dat getal zegt niets over wat de winkel geeft.

## Zes dingen om na te kijken vóór je het stuurt

1. **De versie met de betaalmuur staat werkelijk in de winkel.** Dat is 1.6 —
   bij Apple build 12, bij Play versiecode 11 (`docs/STAND.md`), en op
   24 november staat er nog 1.5. Dit punt staat vooraan omdat het bericht
   beschrijft wat er gebeurt als je de app opent: vier vragen, dan de vraag om
   het abonnement, en na het betalen alles open. Staat die versie er niet, dan
   wijst het bericht naar een download die iets anders doet dan het belooft, en
   dat is niet terug te nemen — het komt één keer voorbij. Niet goedgekeurd dus,
   en niet ingestuurd: uitgerold, en op te halen op een telefoon.
2. **In beide consoles staan de staande prijzen, en er loopt geen aanbieding.**
   € 59,99 per jaar (dat is € 5,00 per maand) of € 6,99 per maand, met het
   e-boek bij het jaar: dat zijn de bedragen in het bericht. Een bericht dat
   een prijs belooft die de winkel niet rekent is bij Apple richtlijn 2.3.1 —
   woordelijk ook buiten de App Store. Hier stond dat je de actie van € 29,99
   moest nakijken; die komt er niet (`docs/STAND.md`, *24 november: geen
   korting, maar een aftelling naar de zomer*), dus kijk nu het omgekeerde na:
   dat er géén aanbieding loopt die dit bericht niet noemt. Controleer het op
   het aankoopvenster zelf, op een telefoon, in de app uit de winkel: de console
   zegt wat er ingesteld is, niet wat de koper leest.

   En controleer in diezelfde beweging dat **de proefperiode van drie dagen
   uit staat** — bij Apple bij beide abonnementen, bij Google `proef-jaar` en
   `proef-maand`. Dit bericht noemt geen gratis dagen, dus zolang de winkel ze
   wél geeft, zegt het bericht iets anders dan het aankoopvenster. Bij Apple
   kost dat sinds 24 november één handeling meer: de *Pay Up Front* van € 29,99
   zou de proef bij Jaar in één keer hebben vervangen, en die komt er niet — dus
   moet die aanbieding bij `app.darijaforkids.yearly` er echt met de hand af.
3. **`[WEKEN]` is vervangen.** Eén treffer in plakbare tekst: de derde alinea
   van het bericht; in het korte blok staat hij met opzet niet — zie het punt
   daaronder. De andere treffers van een zoekopdracht staan in de uitleg
   hierboven en blijven staan — die wordt niet geplakt. Het getal komt uit
   `npm run aftellen`, gedraaid op de dag dat je plaatst: de opdracht en de
   keuze van de datum staan onder *Het weekgetal* hierboven. Plaats je het
   bericht later alsnog, draai hem dan opnieuw, want het getal loopt mee.
   Blokhaken worden meegeplakt. Hier stond `[EINDDATUM]`, en die mocht ook
   helemaal weg: de zin eromheen bleef zonder datum waar. Deze niet — *nog
   [WEKEN] weken* is zonder getal geen zin. Vul hem dus in, of herschrijf die
   ene zin naar het grovere getal uit hetzelfde commando ("nog een maand of
   zeven"), wat niet stil veroudert.
4. **Staan ze er allebei echt.** Niet goedgekeurd — zichtbaar. Play houdt een
   goedgekeurde release vast tot jij op de knop drukt (*Publishing overview →
   Publish*), en bij Apple doet *Manually release this version* hetzelfde. Een
   404 op een winkelpagina terwijl de release op Productie staat betekent dat
   hij op jou wacht, en niet dat er iets stuk is. Dit bericht zegt "in allebei
   de winkels"; dat moet waar zijn op de minuut dat het verstuurd wordt.
5. **Open de twee adressen zelf, op een toestel.** Niet op de Mac en niet in
   een tabblad waar je al ingelogd bent. Een verkeerd adres is niet terug te
   nemen, en een bericht met een dode link komt maar één keer voorbij —
   `docs/LANCERING.md`. Kijk op die twee pagina's ook wat er onder *Versie*
   staat: dat moet 1.6 zijn — bij Apple build 12, bij Play versiecode 11
   (`docs/STAND.md`). Dat is dezelfde controle als punt 1, nu op de bladzijde
   waar dit bericht naartoe wijst. De nummers zijn gelijkgetrokken omdat
   twee nummers voor één product al een keer tot een fout heeft geleid; dit is
   het eerste bericht waarin dat uitmaakt, want er staat één app in twee
   winkels.
6. **Stuur het eerst naar jezelf.** Plak de tekst en de twee regels eronder in
   een gesprek met jezelf en kijk wat WhatsApp ermee doet: of er een
   voorbeeldkaartje onder komt, bij welke van de twee links, en of de regels
   niet midden in een adres afbreken. Wat je daar ziet, zien zij ook.
