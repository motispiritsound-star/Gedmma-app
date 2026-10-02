# De lanceringsdag op het kanaal

Eén bericht voor het WhatsApp-kanaal, op de dag dat 1.4 in allebei de winkels
staat — App Store build 10, Play versiecode 8. Te plakken zoals het staat.
Daaronder een kortere versie voor wie het wil doorsturen, en daaronder waarom
het bericht zo is.

Het publiek is klein en nieuw. Het kanaal begon op woensdag 30 september en
stond op dag één op 43 volgers — `docs/STAND.md`. Er is niet afgeteld: het
kanaal doet elke dag wat het elke dag doet, en op deze dag staat dit bericht
ertussen. Voor vrijwel iedereen die het leest is dit dus het eerste wat hij
van de app hoort, en niet de laatste aflevering van iets wat hij al volgde.
Dat is ook het enige wat dit bericht te melden heeft: de app zelf.

## Twee dingen die erin moeten

1. **Dat hij er nu echt is, in allebei de winkels.** Niet "bijna", niet "in
   beoordeling". Er is nooit iets beloofd en er is met opzet niet afgeteld —
   `docs/GO-LIVE.md`, "De dag kiezen" — dus dit is het hele nieuws, en het
   is in één regel gezegd.
2. **Wat iemand krijgt als hij hem opent.** Niet wat de app kan — wat er
   gebeurt. Vier stappen, dan vier gratis lessen, geen account, niets in te
   vullen. Wie dat gelezen heeft, weet precies waar hij aan begint.

Al het andere is er bij. `store/kanaal-socials.md` zegt het: een bericht dat
drie dingen vraagt krijgt er nul. Dit bericht vraagt om één ding, en dat is
het doorsturen naar één familiegroep.

---

## Het bericht

```
Hij staat er 🎉

Darijaforkids is vanaf vandaag te downloaden, in allebei de winkels: op
iPhone en op Android. De links staan onder dit bericht.

Open je hem, dan begint hij met vier vragen. In welke taal je leert. Wie je
bent: je naam en een dier. Hoe je meeleest: het Arabische schrift, de klanken
in ons eigen alfabet, of allebei. En hoe het eruitziet: een kleur. Die kleur
zit daarna op je knoppen, op je voortgang en om je avatar.

Daarna beginnen de lessen. De eerste vier zijn gratis: drie stukken van het
Arabische alfabet en je eerste woorden Darija. Geen account, niets in te
vullen, geen advertenties.

Daarachter ligt de hele route. 17 units, van de letters tot afdingen op de
souq. 304 woorden en 100 zinnen. 432 opnames, allemaal ingesproken door een
Marokkaanse stem — geen computerstem. De app werkt offline, en er gaat niets
naar een server.

De uitleg staat in zes talen: Nederlands, Frans, Duits, Spaans, Italiaans en
Engels. Dus ook voor de neefjes en nichtjes over de grens.

Na die vier lessen kost de rest € 6,99 per maand, of € 59,99 per jaar met het
e-boek erbij. Drie dagen om het te proberen, en opzeggen doe je in de winkel
zelf.

Staat hij al op je toestel, haal dan de update op.

Als het je iets lijkt: stuur het door naar één familiegroep. Daar help je me
het meest mee 🇲🇦
```

## Waar de twee links komen

Ze staan niet in de tekst, en dat is geen vergeetpost. De adressen staan pas
vast als allebei de goedkeuringen binnen zijn, en een plakbaar blok met een
gat erin wordt geplakt mét het gat — zie `CLAUDE.md` over `<de waarde van
KOOP_GEHEIM>`, die zo in een veld bij Gumroad belandde. Daarom eindigt het
blok hierboven bij de laatste zin, en komen de links er bij het plaatsen als
twee losse regels ónder.

Dit is de vorm, Android eerst:

| De regel die je typt | Wat erachter komt |
|---|---|
| `🤖 Android —` | het adres van de Play-pagina, zodra versiecode 8 is uitgerold |
| `📱 iPhone en iPad —` | het adres van de App Store-pagina, zodra 1.4 op *Ready for Distribution* staat |

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
staat daar al bij stil. Deze drie zinnen zijn voor die groep, met dezelfde
twee links eronder. Dit is ook het blok dat `docs/LANCERING.md` §7 om 09:00
aanwijst voor de persoonlijke berichten, een uur vóór het kanaal:

```
Darijaforkids staat vanaf vandaag in allebei de winkels, voor iPhone en voor
Android. De eerste vier lessen zijn gratis: geen account, niets in te vullen,
geen advertenties. 17 units Marokkaans-Arabisch, van de letters tot afdingen
op de souq, ingesproken door een Marokkaanse stem — geen computerstem.
```

Drie zinnen, en in elke zin één ding: dat hij er is, wat het kost om te
beginnen, en wat het is. Wie hem doorstuurt hoeft niets uit te leggen.

## Waarom het bericht zo is

**Het opent met vier woorden.** "Hij staat er" is de hele aankondiging; de
rest van het bericht is uitleg voor wie doorleest. Zo staan ze ook in
`docs/GO-LIVE.md`, boven het YouTube-bericht en als onderwerp van de mail, en
daar is niets aan verbeterd.

**De vier stappen staan vóór de lessen, want zo komt een kind ze tegen.** De
volgorde is die van het scherm zelf: `src/ui/Welcome.tsx` begint met de taal,
dan wie je bent, dan hoe je meeleest, dan hoe het eruitziet. Het is het nieuwe
van 1.4, maar voor bijna iedereen die dit leest is het geen wijziging — het is
de eerste minuut. Zo staat het ook in `store/wat-is-nieuw-1.4.md`.

**"Geen account, niets in te vullen" staat bij de gratis lessen en niet in een
lijstje onderaan.** Daar wordt de vraag gesteld — wat moet ik hiervoor geven —
en daar hoort dus het antwoord.

**De prijs staat erin, en dat is de ene beslissing in dit bericht.**
`docs/GO-LIVE.md` is er onder "Wat je die dag niet doet" duidelijk over:
*"Geen prijs in de eerste boodschap. Dat hoort op T-2, eerlijk en compleet, en
daarna nooit meer. Wie het op de dag zelf ontdekt, voelt zich beetgenomen —
dus verstop het ook niet."* Twee dagen vooraf blijft dus het juiste moment. Is
die boodschap er geweest, dan is deze regel in één keer te schrappen zonder
dat de rest verandert. Is hij er niet, dan is vandaag de eerste keer dat
iemand het leest, en dan hoort hij er wél te staan. Eén regel met de twee
bedragen en de drie dagen, zonder uitleg eromheen.

**Eén regel voor wie hem al heeft.** 1.0 staat sinds 2 oktober in de App
Store, zonder dat het ergens aangekondigd is. Wie hem daar toch gevonden heeft
en vandaag niets anders leest dan "hij staat er", laat het nieuws aan zich
voorbijgaan terwijl het juist over zijn eigen toestel gaat. "Haal de update
op" doet dat zonder er een verhaal van te maken.

Wat die regel níét belooft is het nieuwe startscherm. `langPicked` blijft bij
een update staan — `hydrate()` in `src/engine/store.ts` neemt de opslag over,
en `Welcome.tsx` sluit zich zodra die vlag om is. Wie op 1.0 al een taal koos,
slaat dus precies het scherm over dat vandaag het nieuws is; zijn naam, zijn
dier en zijn kleur staan in Instellingen en op Profiel. Dat erbij schrijven
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
- **Geen "€ 5,00 per maand".** Dat is € 59,99 gedeeld door twaalf, en Apple
  wees 1.0 af op richtlijn 3.1.2(c) omdat die omrekening duidelijker stond dan
  het bedrag dat van de rekening gaat. In een winkeltekst is dat een
  afwijzing; in een bericht aan mensen die je vertrouwen is het erger.
- **Geen gezinsdeling.** Bij Apple deelt het hele gezin één abonnement, bij
  Google niet. Dat is waar, en het is een goed argument — maar één bericht voor
  twee winkels kan het niet noemen zonder per winkel een voetnoot. Het hoort
  op het koopscherm, waar de app weet in welke winkel hij staat.
- **Niets over het e-boek, behalve dat het bij het jaar hoort.** Wanneer het
  precies vrijkomt staat in `store/wat-is-nieuw-1.1.md` en op het koopscherm.
  Dat is de plek waar een koper het leest op het moment dat het hem aangaat.
- **Geen boeken, geen openingsactie, geen verzoek om een beoordeling.** Alle
  drie verdedigbaar, en alle drie een tweede vraag. De beoordeling staat in
  `docs/GO-LIVE.md` op dag 3.
- **Geen "eindelijk", geen aftelling, geen terugblik op twee jaar werk.** Er is
  met opzet niet afgeteld — `docs/GO-LIVE.md`, "De dag kiezen" — en een bericht
  dat begint met hoe lang het duurde, gaat over de maker en niet over de app.
- **Geen datum en geen "deze week nog".** Als dit bericht de deur uit gaat,
  staat hij er. Anders gaat het niet de deur uit.
- **Geen enkel getal dat niet nagerekend is.** 17 units, 304 woorden, 100
  zinnen, 432 opnames, 6 talen, 4 gratis lessen, 3 dagen, 2 winkels. De eerste
  vier staan in `docs/STAND.md`, de inhoud zelf in `src/content/`, de talen in
  `src/i18n/languages.ts`, de vier lessen in `GRATIS_LESSEN` en de drie dagen in
  `TRIAL_DAYS` — die laatste twee in `src/engine/`.

## Vier dingen om na te kijken vóór je het stuurt

1. **Staan ze er allebei echt.** Niet goedgekeurd — zichtbaar. Play houdt een
   goedgekeurde release vast tot jij op de knop drukt (*Publishing overview →
   Publish*), en bij Apple doet *Manually release this version* hetzelfde. Een
   404 op een winkelpagina terwijl de release op Productie staat betekent dat
   hij op jou wacht, en niet dat er iets stuk is. Dit bericht zegt "in allebei
   de winkels"; dat moet waar zijn op de minuut dat het verstuurd wordt.
2. **Open de twee adressen zelf, op een toestel.** Niet op de Mac en niet in
   een tabblad waar je al ingelogd bent. Een verkeerd adres is niet terug te
   nemen, en een bericht met een dode link komt maar één keer voorbij —
   `docs/LANCERING.md`.
3. **Kijk of de versie die live staat 1.4 is.** Bij Apple build 10, bij Play
   versiecode 8. De nummers zijn gelijkgetrokken omdat twee nummers voor één
   product al een keer tot een fout heeft geleid; dit is het eerste bericht
   waarin dat uitmaakt, want er staat één app in twee winkels.
4. **Stuur het eerst naar jezelf.** Plak de tekst en de twee regels eronder in
   een gesprek met jezelf en kijk wat WhatsApp ermee doet: of er een
   voorbeeldkaartje onder komt, bij welke van de twee links, en of de regels
   niet midden in een adres afbreken. Wat je daar ziet, zien zij ook.
