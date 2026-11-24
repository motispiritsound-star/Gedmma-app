# De lanceringsdag op het kanaal — alleen Apple

> **Niet versturen: dit bestand is achterhaald.** Het is het bericht voor de
> dagen dat 1.4 alleen bij Apple stond, en die situatie bestaat niet meer. Play
> gaf versiecode 8 (1.4) vrij op 13 oktober, en sinds 24 oktober staat 1.5 in
> allebei de winkels — App Store build 11, Play versiecode 10, allebei volledig
> uitgerold (`docs/STAND.md`, *24 oktober: build 11 ligt bij Apple*). Datzelfde
> bestand zegt het woordelijk: *"`kanaal-apple.md` is een noodvariant geweest
> voor een situatie die niet meer bestaat."*
>
> **Het bericht dat je wél stuurt is `store/lancering/kanaal.md`.**
>
> Twee regels hieronder zijn onwaar zodra je ze plakt: *"hij ligt bij Google ter
> beoordeling"* en *"Android volgt zodra Google klaar is"*. De rest is op
> 24 november wél bijgewerkt — de zomerboodschap, de staande prijzen en de
> versie die in de winkel moet staan — zodat dit bestand niemand op een oude
> prijs, op een gratis les of op een actie die er nooit komt zet als het nog
> eens open gaat.

Alles uit `kanaal.md` onder "Waarom het bericht zo is" en "Wat er niet in
staat" geldt hier onverkort. Wat hieronder staat is alleen wat er anders is.

**Wat hieronder over geld en over de zomer staat, is van 24 november.** Er
zijn geen gratis lessen meer en geen proefperiode: de app is gratis te
downloaden, de cursus is een abonnement, en dat wordt op het eerste scherm
gevraagd. Na het betalen gaat alles in één keer open. Er loopt géén tijdelijke
actie: de prijzen blijven staan zoals ze staan, en de haak van de campagne is
de zomervakantie — *leer je kind Darija vóór de volgende zomervakantie.* De
onderbouwing staat boven `magLeren` in `src/engine/store.ts`; het besluit over
de campagne in `docs/STAND.md`, onder *24 november: geen korting, maar een
aftelling naar de zomer*. Dezelfde regels gelden in
`store/lancering/mail.md` en `store/lancering/socials.md`, en elke regel over
geld in dit bestand is daarop nagekeken.

De aftelling staat als **`[WEKEN]`** in het bericht, precies zo geschreven, en
niet als cijfer: het getal komt uit `npm run aftellen` op de dag dat je plaatst.
Waarom dat zo is en welke datum je neemt, staat in `store/lancering/kanaal.md`
onder *Het weekgetal*.

## Wat er anders is, en waarom

**Nergens staat "in allebei de winkels".** Dat zou onwaar zijn. De eerste
regel is dezelfde als in `kanaal.md` — de belofte over komende zomer, en die
gaat niet over een winkel; het verschil zit in de regel waar de app in staat,
en in de regel over Android eronder.

**Android moet erin, juist nu.** `kanaal.md` zet Android bewust bovenaan omdat
de meeste mensen in het kanaal daarop zitten — zie `docs/STAND.md`. Precies
daarom kan een bericht dat alleen "download hem nu" zegt hier niet: de
meerderheid tikt, vindt niets, en de enige aankondiging die je hebt is op.

Dus staat het er eerlijk in, in één regel, **zonder datum**. Er is nog nooit
iets beloofd en vandaag is daar geen reden voor: niemand weet wanneer de
beoordeling klaar is. "Zodra Google klaar is, zeg ik het hier" is wat je waar
kunt maken.

**Eén link, geen twee.** De Play-link bestaat wel als adres — hij is niets dan
de pakketnaam in een URL — maar hij wijst vandaag naar een pagina die er niet
is. Een link die 404 geeft in het eerste bericht over je app is erger dan geen
link.

**De prijs staat in dit bericht, en kan er niet meer uit.** `kanaal.md` legt
onder "Waarom het bericht zo is" uit dat de prijsregel daar een beslissing was:
hoort ze op T-2, dan kan ze hier weg. Dat is sinds 23 november voorbij, en het
vervallen van de actie verandert daar niets aan: de prijs staat er niet omdat
er iets te koop is, maar omdat de app meteen om geld vraagt. Een aankondiging
zonder prijs stuurt iemand dus naar een betaalscherm waar hij niet op gerekend
had. En een aankondiging die "gratis" zegt terwijl de winkel bij het
afsluiten afschrijft, is bij Apple richtlijn **2.3.1** — die geldt woordelijk
*"whether within or outside of the App Store"*, dus ook voor een bericht in een
WhatsApp-kanaal.

**"Haal de update op" blijft staan, nu met één zin erbij.** 1.0 staat sinds
2 oktober stil in de App Store; wie hem daar gevonden heeft, krijgt 1.6 via de
gewone update. In 1.0 waren er nog gratis lessen, dus die lezer heeft er
mogelijk een paar afgerond — en die houdt hij, precies die en niets erbij,
omdat `magLeren` aan `isDone` hangt in plaats van aan een lijst. Eén zin
daarover hoort erbij: wie hem niet leest, denkt dat de update hem iets heeft
afgenomen, en dat is het soort misverstand dat je terugleest in een
beoordeling.

---

## Het bericht

```
Komende zomer praat je kind met zijn oma. Zelf, zonder jou ertussen als tolk.

Hij verstaat haar nu al. Antwoorden lukt alleen niet — en daar begint deze app.

Een taal leer je niet in twee weken. Dat is geen bezwaar, dat is de reden om
vandaag te beginnen: nog [WEKEN] weken tot de zomervakantie, en één korte les
per dag is genoeg. In juli kan je kind begroeten, bedanken, vragen hoe het
gaat, afdingen op de souq, en zeggen wie wie is in de familie.

Darijaforkids staat in de App Store, voor iPhone en iPad. De link staat onder
dit bericht.

Zit je op Android: hij ligt bij Google ter beoordeling. Zodra hij daar
doorheen is, zeg ik het hier. Een datum heb ik niet — dat bepalen zij.

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

## De link eronder

Eén losse regel, onder het blok. Niet erin — zie `CLAUDE.md` over een plakbaar
blok met een gat erin.

```
📱 iPhone en iPad — https://apps.apple.com/app/id6813964474
```

Dat is het korte adres, met opzet zonder landcode: apps.apple.com stuurt een
bezoeker zelf naar zijn eigen winkel, en deze app verkoopt in zes talen.
Hetzelfde adres dat `STORE.apple` in `src/site/links.ts` gebruikt.

## Korter, om door te sturen

```
Komende zomer praat je kind met zijn oma, zelf. Een taal leer je niet in twee
weken, dus dit is iets om vóór de zomervakantie te beginnen — één korte les per
dag. Darijaforkids staat in de App Store, voor iPhone en iPad: gratis te
downloaden, en de cursus is een abonnement. € 59,99 per jaar (dat is € 5,00 per
maand) met het e-boek erbij, of € 6,99 per maand. 17 units Marokkaans-Arabisch,
van de letters tot afdingen op de souq, ingesproken door een Marokkaanse stem —
geen computerstem. Geen account, geen advertenties. Android volgt zodra Google
klaar is.
```

Het bedrag dat werkelijk wordt afgeschreven staat vooraan en de omrekening
tussen haakjes erachter. Nooit andersom en nooit alleen: Apple wees 1.0 af op
richtlijn **3.1.2(c)** omdat de omgerekende maandprijs duidelijker stond dan
het bedrag dat van de rekening gaat. Die richtlijn geldt bij elke prijs, niet
alleen bij een actieprijs.

En hier staat geen aantal weken, terwijl het bericht hierboven het wél heeft —
dezelfde keuze als in `kanaal.md`. Dit blok wordt doorgestuurd en weken later
nog eens doorgestuurd, en dan is "nog [WEKEN] weken" ingevuld met het getal van
toen. *Vóór de zomervakantie* veroudert niet, en het zegt hetzelfde.

## Nakijken vóór je het stuurt

1. **De versie met de betaalmuur staat werkelijk in de App Store.** Dat is
   1.6, build 12 (`docs/STAND.md`). Dit is de eerste regel omdat het bericht
   beschrijft wat er gebeurt als je de app opent: vier vragen, dan de vraag om
   het abonnement, en na het betalen alles open. Staat er nog een oudere
   versie, dan wijst het bericht naar een download die iets anders doet dan het
   belooft — en een aankondiging komt één keer voorbij.
2. **In de console staan de staande prijzen, en er loopt geen aanbieding.**
   € 59,99 per jaar (dat is € 5,00 per maand) of € 6,99 per maand, met het
   e-boek bij het jaar: dat zijn de bedragen in het bericht. Hier stond dat de
   actie van € 29,99 werkelijk in App Store Connect moest staan; die komt er
   niet (`docs/STAND.md`, *24 november: geen korting, maar een aftelling naar
   de zomer*), dus kijk nu het omgekeerde na: dat er géén aanbieding loopt die
   dit bericht niet noemt. Controleer het op het aankoopvenster zelf, op een
   telefoon, in de app uit de winkel: de console zegt wat er ingesteld is, niet
   wat de koper leest.
3. **`[WEKEN]` is vervangen.** Eén treffer in plakbare tekst: de derde alinea
   van het bericht; in het korte blok staat hij met opzet niet. De andere
   treffers van een zoekopdracht staan in de uitleg hierboven en blijven
   staan, en die wordt niet geplakt. Het getal komt uit `npm run aftellen`,
   gedraaid op de dag dat je plaatst — de opdracht en de keuze van de datum
   staan in `store/lancering/kanaal.md` onder *Het weekgetal*. Hier stond
   `[EINDDATUM]`, en die mocht ook helemaal weg; deze niet, want *nog [WEKEN]
   weken* is zonder getal geen zin. Vul hem in of herschrijf die zin naar een
   grover getal. Blokhaken worden meegeplakt.
4. **De proefperiode van drie dagen staat uit**, bij beide abonnementen. In
   App Store Connect is dat de regel *Free for the first 3 days* onder
   **Introductory Offers**. Hier stond dat de actie uit stap 1 dat bij
   `app.darijaforkids.yearly` in één handeling deed, want er geldt één
   introductieaanbieding per abonnement per land en een nieuwe overschrijft de
   bestaande. Die actie komt er niet, dus **moet die aanbieding bij het jaar
   er nu echt met de hand af** — er komt niets overheen (`docs/STAND.md`). Bij
   `app.darijaforkids.monthly` moest hij toch al apart uit. Dit bericht noemt
   geen gratis dagen, dus zolang de winkel ze wél geeft, zegt het bericht iets
   anders dan het aankoopvenster.
5. **Open het adres zelf, op een iPhone.** Niet op de Mac en niet in een
   browser op een laptop: je wilt zien wat de lezer ziet, inclusief de knop
   *Download*. Dit is hier niet na te kijken — het netwerk van de werkomgeving
   laat apps.apple.com niet door, dus deze regel is de enige controle die er
   is.
6. **Kijk of er 1.6 staat**, op de pagina zelf onder *Versie*. Dat is dezelfde
   controle als punt 1, nu op de bladzijde waar dit bericht naartoe wijst.
7. **En stuur de Play-regel niet mee.** Die komt in een eigen bericht, op de
   dag dat Google klaar is. Twee aankondigingen uit één goedkeuring is geen
   verlies maar winst: het kanaal hoort twee keer iets.

## Wat hierna komt

Als Play doorkomt, is het bericht kort — het publiek kent de app dan al:

```
En nu ook op Android 🤖

Darijaforkids staat vanaf vandaag ook in de Play Store. Alles wat in het
bericht hiervoor stond geldt daar net zo, de prijs inbegrepen.
```

Met daaronder de Play-regel:

```
🤖 Android — https://play.google.com/store/apps/details?id=app.darijaforkids.learn
```

Twee voorwaarden aan die laatste vier woorden. De prijzen moeten op dat moment
in **Play Console** dezelfde zijn als bij Apple — bij
`app.darijaforkids.yearly` het basisplan `jaar` op € 59,99, de maand op
€ 6,99 — want anders belooft dit bericht een prijs die de Play Store niet
rekent. En er mag in geen van beide winkels een aanbieding lopen die het eerste
bericht niet noemde: een lezer die hierop afkomt en iets anders aantreft, leest
dat eerste bericht als een belofte die niet is nagekomen.

Hier stond dat de actie van € 29,99 óók in Play moest staan, en dat "de prijs
inbegrepen" eruit moest zodra ze afliep. Die actie komt er niet — `docs/STAND.md`,
*24 november: geen korting, maar een aftelling naar de zomer*. En het weekgetal
staat niet in dit tweede bericht: het is een paar regels lang en het verwijst
naar het bericht hiervoor, waar de aftelling al staat.
