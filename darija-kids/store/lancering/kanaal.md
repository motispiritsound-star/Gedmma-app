# De lanceringsdag op het kanaal

Eén bericht voor het WhatsApp-kanaal, op de dag dat 1.4 in allebei de winkels
staat — App Store build 10, Play versiecode 8. Te plakken zoals het staat.
Daaronder een kortere versie voor wie het wil doorsturen, en daaronder waarom
het bericht zo is.

**Wat hieronder over geld staat, is van 23 november.** Er zijn geen gratis
lessen meer en geen proefperiode: de app is gratis te downloaden, de cursus is
een abonnement, en dat wordt op het eerste scherm gevraagd. Na het betalen gaat
alles in één keer open — geen porties van acht lessen. Op het jaar loopt een
tijdelijke actie van 50%. De onderbouwing staat boven `magLeren` in
`src/engine/store.ts`; wat er in de consoles moet staat in `docs/STAND.md`.
Dezelfde regels gelden in `store/lancering/mail.md` en
`store/lancering/socials.md`, en elke regel over geld in dit bestand is daarop
nagekeken.

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
2. **Wat iemand krijgt als hij hem opent, en wat het kost.** Niet wat de app
   kan — wat er gebeurt. Vier stappen, dan de vraag om het abonnement, en na
   het betalen alles open. Downloaden is gratis, en geen account en niets in te
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

Downloaden is gratis: geen account, niets in te vullen, geen advertenties. De
cursus zelf is een abonnement, en dat vraagt hij meteen daarna. Betaal je, dan
gaat alles in één keer open — geen porties.

En dan ligt de hele route voor je. 17 units, van de letters tot afdingen op de
souq. 304 woorden en 100 zinnen. 432 opnames, allemaal ingesproken door een
Marokkaanse stem — geen computerstem. De app werkt offline, en er gaat niets
naar een server.

De uitleg staat in zes talen: Nederlands, Frans, Duits, Spaans, Italiaans en
Engels. Dus ook voor de neefjes en nichtjes over de grens.

€ 59,99 per jaar met het e-boek erbij, of € 6,99 per maand. En nu de helft van
de jaarprijs: € 29,99 voor het eerste jaar (€ 2,50 per maand) in plaats van
€ 59,99. Tijdelijk, tot [EINDDATUM]. Opzeggen doe je in de winkel zelf.

Staat hij al op je toestel, haal dan de update op. Wat je al had afgerond,
blijft open staan.

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
Android. Gratis te downloaden; de cursus is een abonnement, en het eerste jaar
is nu de helft: € 29,99 (€ 2,50 per maand) in plaats van € 59,99. 17 units
Marokkaans-Arabisch, van de letters tot afdingen op de souq, ingesproken door
een Marokkaanse stem — geen computerstem. Geen account, geen advertenties.
```

Drie zinnen, en in elke zin één ding: dat hij er is, wat het kost, en wat het
is. Wie hem doorstuurt hoeft niets uit te leggen.

## Waarom het bericht zo is

**Het opent met vier woorden.** "Hij staat er" is de hele aankondiging; de
rest van het bericht is uitleg voor wie doorleest. Zo staan ze ook in
`docs/GO-LIVE.md`, boven het YouTube-bericht en als onderwerp van de mail, en
daar is niets aan verbeterd.

**De vier stappen staan vóór de prijs, want zo komt een kind ze tegen.** De
volgorde is die van het scherm zelf: `src/ui/Welcome.tsx` begint met de taal,
dan wie je bent, dan hoe je meeleest, dan hoe het eruitziet — en op die
laatste stap staat ook wat het kost, want "een ouder hoort te weten wat de app
kost voordat het eerste lesje begint". Daarna komt het abonnementsscherm:
`Poort` in `src/App.tsx` stuurt iedereen zonder abonnement naar `/volledig`.
Het is het nieuwe van 1.4, maar voor bijna iedereen die dit leest is het geen
wijziging — het is de eerste minuut. Zo staat het ook in
`store/wat-is-nieuw-1.4.md`.

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
een WhatsApp-kanaal. Daarom staat in de controlelijst onderaan als eerste punt
dat de actie werkelijk in beide consoles staat.

**Eén regel voor wie hem al heeft, met één belofte erbij.** 1.0 staat sinds
2 oktober in de App Store, zonder dat het ergens aangekondigd is. Wie hem daar
toch gevonden heeft en vandaag niets anders leest dan "hij staat er", laat het
nieuws aan zich voorbijgaan terwijl het juist over zijn eigen toestel gaat.
"Haal de update op" doet dat zonder er een verhaal van te maken.

En de tweede helft van die regel is nieuw en kan niet weg. In 1.0 waren er
gratis lessen; wie daar iets heeft afgerond, houdt precies dat en niets erbij —
`magLeren` hangt aan `isDone` in plaats van aan een lijst, zodat een afgeronde
les open blijft en een nieuwe dichtgaat. Wie die zin niet leest, haalt een
update op en denkt dat hem iets is afgenomen. Dat is het soort misverstand dat
je terugleest in een beoordeling, op precies de winkelbladzijde waar dit
bericht naartoe wijst.

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
- **Geen gratis les en geen proefperiode.** Sinds 23 november zijn ze er niet
  — zie de aantekening boven `magLeren` in `src/engine/store.ts`. Wat ervoor in
  de plaats staat verkoopt net zo hard: gratis te downloaden, 432 opnames van
  een echte Marokkaanse stem, geen advertenties, er wordt niets van je kind
  verzameld, werkt offline, geen account, zeventien units, en nu tijdelijk de
  helft van de jaarprijs.
- **Geen omrekening per maand die alleen staat.** € 5,00 is € 59,99 gedeeld
  door twaalf en € 2,50 is € 29,99 gedeeld door twaalf, en Apple wees 1.0 af op
  richtlijn 3.1.2(c) omdat zo'n omrekening duidelijker stond dan het bedrag dat
  van de rekening gaat. In een winkeltekst is dat een afwijzing; in een bericht
  aan mensen die je vertrouwen is het erger. Daarom staat de omrekening
  hierboven nooit vooraan en nooit alleen, maar tussen haakjes achter het
  bedrag dat werkelijk wordt afgeschreven: "€ 29,99 voor het eerste jaar
  (€ 2,50 per maand)".
- **Geen gezinsdeling.** Bij Apple deelt het hele gezin één abonnement, bij
  Google niet. Dat is waar, en het is een goed argument — maar één bericht voor
  twee winkels kan het niet noemen zonder per winkel een voetnoot. Het hoort
  op het koopscherm, waar de app weet in welke winkel hij staat.
- **Niets over het e-boek, behalve dat het bij het jaar hoort.** Wanneer het
  precies vrijkomt staat in `store/wat-is-nieuw-1.1.md` en op het koopscherm.
  Dat is de plek waar een koper het leest op het moment dat het hem aangaat.
- **Geen boeken en geen verzoek om een beoordeling.** Allebei verdedigbaar, en
  allebei een tweede vraag. De beoordeling staat in `docs/GO-LIVE.md` op dag 3.

  **De openingsactie is de uitzondering**, en dat is sinds 23 november zo. Hier
  stond dat ook die een tweede vraag was. Dat gold voor een actie náást de
  prijs; de actie van 50% op het jaar ís de prijs van vandaag, hij staat in
  dezelfde regel als de twee bedragen en hij vraagt niets extra. Hij is de haak
  van de campagne op de drie Facebook-pagina's — `docs/STAND.md` — en hij hoort
  dus ook hier te staan.
- **Geen "eindelijk", geen aftelling, geen terugblik op twee jaar werk.** Er is
  met opzet niet afgeteld — `docs/GO-LIVE.md`, "De dag kiezen" — en een bericht
  dat begint met hoe lang het duurde, gaat over de maker en niet over de app.
- **Geen datum en geen "deze week nog".** Als dit bericht de deur uit gaat,
  staat hij er. Anders gaat het niet de deur uit. De enige datum die er wél in
  hoort is de einddatum van de actie, en die staat als `[EINDDATUM]` in het
  blok tot ze gekozen is.
- **Geen enkel getal dat niet nagerekend is.** 17 units, 304 woorden, 100
  zinnen, 432 opnames, 6 talen, 2 winkels, en de drie bedragen: € 6,99,
  € 59,99 en € 29,99. De eerste vier komen uit `src/content/` en
  `src/site/site.test.ts` rekent ze bij elke testronde na — 432 is het aantal
  opnames en niet het aantal woorden: dat zijn 304 woorden plus 100 zinnen plus
  28 letters. De talen staan in `src/i18n/languages.ts`. € 6,99 en € 59,99
  staan in `PLANS` in `src/engine/billing.ts`. **€ 29,99 is daar geen prijs**:
  `PLANS` kent alleen die twee, en de actieprijs leest de app uit wat de winkel
  teruggeeft — `nuFase` in hetzelfde bestand. Wat de repository erover zegt
  (`docs/STAND.md`, en de aantekeningen bij `nuFase`) beschrijft de aanbieding
  maar maakt haar niet. Schrijf dat bedrag dus niet uit het geheugen over en
  niet uit een document, maar kijk in het aankoopvenster op een telefoon.

  *Teruggedraaid op 23 november.* Hier stonden ook "8 gratis lessen" en
  "3 dagen", met `GRATIS_LESSEN` en `TRIAL_DAYS` in `src/engine/` als bron, en
  de aantekening dat het er vier waren tot 12 november en dat deze regel zelf
  een tijd met het verkeerde getal naar de bron wees die hem weerlegde.
  `GRATIS_LESSEN` bestaat niet meer en de proefperiode is uit het aanbod — zie
  de aantekening boven `magLeren` in `src/engine/store.ts`. `TRIAL_DAYS` staat
  er nog wel, maar is bewoording en geen belofte: de app leest de proef uit
  `billing.proef.jaar`, dus dat getal zegt niets over wat de winkel geeft.

## Vijf dingen om na te kijken vóór je het stuurt

1. **De actie van € 29,99 staat werkelijk in beide consoles.** Dit is het
   eerste punt omdat het bericht die prijs noemt, en omdat een bericht dat een
   prijs belooft die de winkel niet rekent bij Apple richtlijn 2.3.1 is —
   woordelijk ook buiten de App Store. Wat je waar zet staat in `docs/STAND.md`
   onder *23 november: de tijdelijke actie van 50% op het jaar*. Staat ze er
   nog niet, dan gaat de hele actieregel eruit en noem je alleen € 59,99 per
   jaar of € 6,99 per maand. Controleer het op het aankoopvenster zelf, op een
   telefoon, in de app uit de winkel: de console zegt wat er ingesteld is, niet
   wat de koper leest.

   En controleer in diezelfde beweging dat **de proefperiode van drie dagen
   uit staat** — bij Apple bij beide abonnementen, bij Google `proef-jaar` en
   `proef-maand`. Dit bericht noemt geen gratis dagen, dus zolang de winkel ze
   wél geeft, zegt het bericht iets anders dan het aankoopvenster.
2. **`[EINDDATUM]` is vervangen.** Eén treffer, in de prijsregel van het
   bericht. In het korte blok staat hij niet: daar staat "nu de helft", en dat
   is een uitspraak over vandaag die zonder datum al waar is — dezelfde keuze
   als in de voorbeeldtekst van `store/lancering/mail.md`. Vul dezelfde datum
   in als de einddatum in de twee consoles: een actie zonder einddatum is bij
   Apple gewoon de nieuwe prijs, en in een aankondiging een bewering die je
   niet kunt onderbouwen. Is ze nog niet gekozen, haal dan "Tijdelijk, tot
   [EINDDATUM]." weg en laat de rest staan; de zin blijft dan waar. Blokhaken
   worden meegeplakt.
3. **Staan ze er allebei echt.** Niet goedgekeurd — zichtbaar. Play houdt een
   goedgekeurde release vast tot jij op de knop drukt (*Publishing overview →
   Publish*), en bij Apple doet *Manually release this version* hetzelfde. Een
   404 op een winkelpagina terwijl de release op Productie staat betekent dat
   hij op jou wacht, en niet dat er iets stuk is. Dit bericht zegt "in allebei
   de winkels"; dat moet waar zijn op de minuut dat het verstuurd wordt.
4. **Open de twee adressen zelf, op een toestel.** Niet op de Mac en niet in
   een tabblad waar je al ingelogd bent. Een verkeerd adres is niet terug te
   nemen, en een bericht met een dode link komt maar één keer voorbij —
   `docs/LANCERING.md`. Kijk daar ook of de versie die live staat 1.4 is: bij
   Apple build 10, bij Play versiecode 8. De nummers zijn gelijkgetrokken omdat
   twee nummers voor één product al een keer tot een fout heeft geleid; dit is
   het eerste bericht waarin dat uitmaakt, want er staat één app in twee
   winkels.
5. **Stuur het eerst naar jezelf.** Plak de tekst en de twee regels eronder in
   een gesprek met jezelf en kijk wat WhatsApp ermee doet: of er een
   voorbeeldkaartje onder komt, bij welke van de twee links, en of de regels
   niet midden in een adres afbreken. Wat je daar ziet, zien zij ook.
