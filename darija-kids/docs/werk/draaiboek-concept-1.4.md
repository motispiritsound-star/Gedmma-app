# Het draaiboek voor de lancering

Dit bestand staat in `docs/werk/` en is een concept. Het draaiboek dat in
gebruik is, is `docs/GO-LIVE.md`; wat hier staat en daar nog niet, hoort daar
te worden ingenomen. Het is één keer naar `docs/LANCERING.md` geschreven en
daar weer weggehaald, want dat bestand is het plan voor de negentig dagen en
vijf andere documenten verwijzen ernaar met paragraafnummers: `WINKEL.md`,
`GO-LIVE.md`, `GESCHIEDENISREEKS.md`, `store/kanaal-socials.md` en
`store/kanaal-sleutels.md`.

Volgende week staat de app in beide winkels en gaat de aankondiging eruit. Dit
bestand is de volgorde waarin dat gebeurt: intrekken, bouwen, nakijken,
insturen, wachten, vrijgeven, communiceren. Zeven stappen, en ze zijn niet om
te wisselen.

Het is met opzet saai. Op de dag zelf hoef je niets te bedenken.

## Wat er live gaat

1.4, in allebei de winkels. Dat nummer is nieuw: Apple stond op 1.1 en Play op
1.3, en ze zijn gelijkgetrokken omdat twee nummers voor één bundel code hier al
een keer tot een fout heeft geleid.

| | |
|---|---|
| App Store | versie **1.4**, build **10** |
| Google Play | versienaam **1.4**, versiecode **8** |

Wat die versie meebrengt: 17 units van de letters tot afdingen op de souq,
304 woorden, 100 zinnen, 432 opnames ingesproken door een Marokkaanse stem, zes
interfacetalen. En nieuw in 1.4 een startscherm in vier stappen — een naam, een
dier, hoe je meeleest (Arabisch schrift, de klanken in ons alfabet, of allebei)
en een kleur, die daarna op je knoppen, je voortgang en je avatar staat.

## Waar het nu staat

| | |
|---|---|
| App Store, live | 1.0 (build 7) sinds 2 oktober, stil — nooit aangekondigd |
| App Store, in beoordeling | 1.1 (build 9), op *Automatically release* |
| Google Play, live | niets — Play heeft de app nooit uitgebracht |
| Google Play, in beoordeling | versiecode 7 (1.3), productie en gesloten test |

Voor vrijwel iedereen die het bericht krijgt is dit dus niet een update maar het
eerste wat hij van de app hoort.

## Wat waar staat

| | |
|---|---|
| de volgorde | dit bestand |
| de stand per winkel | `docs/STAND.md` |
| de Android-bouw | `docs/ANDROID.md` |
| de iOS-bouw en de Mac | `docs/MAC.md` |
| wat er nieuw is, in zes talen | `store/wat-is-nieuw-1.4.md` |
| de teksten voor de dag zelf | `store/lancering/kanaal.md`, `-/socials.md`, `-/mail.md` |
| de winkelteksten | `store/listing.nl.md` en de vijf andere talen |

`docs/GO-LIVE.md` beschrijft de dag zoals die op 2 oktober gepland was, met de
oudere berichten erin en met 1.0 en 1.1 als nummers. Het verwijst naar
`LANCERING.md` §4 en §16, en dat klopt: `docs/LANCERING.md` is het plan voor de
negentig dagen eromheen en niet dit draaiboek. Wat in GO-LIVE.md nog los van
dit bestand staat is de proefperiode (§0) en wat je op de dag zelf níét doet.

Andersom klopt het niet. `store/lancering/kanaal.md` en `store/lancering/socials.md`
wijzen voor het blok van 09:00 naar `docs/LANCERING.md` §7, en §7 daar gaat over
Facebook. Dat blok is §7 van dít bestand. Wie die verwijzing volgt komt ergens
anders uit.

## De volgorde

| | Stap | Wie en waar | Wanneer |
|---|---|---|---|
| 1 | Intrekken | Adil, in de browser | vandaag |
| 2 | Bouwen | Adil, op Windows en op de Mac | morgen |
| 3 | Nakijken | Adil, op Windows | morgen, direct na de bouw |
| 4 | Insturen | Adil, in de browser | morgen, allebei dezelfde dag |
| 5 | Wachten | de winkels | Apple een dag, Play tot zeven |
| 6 | Vrijgeven | Adil, in de browser en op Windows | volgende week, 's ochtends |
| 7 | Communiceren | Adil, op de telefoon | diezelfde dag, vanaf 09:00 |

---

## 1. Intrekken — vandaag

**Wie en waar:** Adil, in App Store Connect en in de Play Console. Geen
opdracht; dit kan alleen met de muis.

Er liggen twee inzendingen die niet de lanceringsversie zijn. Laat je ze lopen,
dan is er een beoordelingsronde voor 1.1 en 1.3 en daarna nog een voor 1.4.
Twee rondes voor één lancering, waarvan de eerste niets oplevert.

Trek ze allebei in. Dat kost niets: er is nog niets goedgekeurd, en 1.0 blijft
bij Apple onaangeroerd in de winkel staan.

### Apple

De indieningspagina van 1.1, en daar onderaan **Cancel Submission**. Dat is de
knop die op 28 september ook werkte; het bevestigingsvenster waarschuwt alleen
dat geaccepteerde items opnieuw moeten, en er is niets geaccepteerd. Daarna
staan de items op *Developer Rejected* en zijn ze weer bewerkbaar.

Doe dit vóór de goedkeuring binnenkomt. **1.1 staat op *Automatically
release*.** Komt de goedkeuring eerder dan jij, dan staat 1.1 ongevraagd in de
winkel, is je lanceerversie 1.1 in plaats van 1.4, en lopen de twee nummers
weer uiteen.

Wat er daarna met het versienummer kan, is niet nagemeten. `docs/STAND.md`
beschrijft van 28 september alleen dat de vier items op *Developer Rejected*
kwamen en bewerkbaar werden, en dat ging over de aankopen. Of het veld
*Version* zelf weer open staat, staat nergens. Kijk er dus naar in plaats van
het aan te nemen: is 1.1 te overschrijven met 1.4, dan is dat het. Kan dat
niet, dan maak je 1.4 als nieuwe versie aan en laat je 1.1 staan — één stap
meer, en niet de dag.

### Play

Play Console → **Publishing overview**. Typ dat in het zoekveld bovenin de
console, niet in het linkermenu — Google heeft dat menu de afgelopen jaren een
paar keer omgegooid. Daar staan de wijzigingen die in beoordeling zijn, en daar
trek je ze terug. Versiecode 7 staat op twee sporen, productie én gesloten
test, dus allebei.

Werkt dat niet, dan is er een tweede weg en die is zeker: een nieuwe upload
vervangt de lopende beoordeling. Versiecode 8 erover is dus hetzelfde resultaat
met één stap minder zichtbaarheid. Wat je daarmee verliest is het overzicht —
je ziet dan niet meer of 7 eruit is of alleen opzij geschoven.

### Het raam dat hiermee opengaat

Zolang er een indiening bij Apple ligt zijn de aankopen alleen-lezen. Nu niet.
Dit is dus het moment voor de vier talen uit `store/abonnement-teksten.md`
(Frans, Duits, Spaans, Italiaans) bij de drie aankopen. Een kwartier, en het
slot gaat er bij het insturen van 1.4 weer op.

Kijk in dat raam ook de proefperiode na. De app zegt in zes talen dat de eerste
drie dagen gratis zijn — `TRIAL_DAYS` in `src/engine/billing.ts` — en dat staat
er ongeacht wat de winkel weet.

Eén van de vier plannen is nagekeken. Bij Apple staat bij **Jaar** *Free for
the first 3 days* in 175 landen, aangetoond op 1 oktober. Bij **Maand** is het
niet nagekeken, en bij Play is het nergens vastgelegd. Dus drie dingen en niet
één:

- App Store Connect → Subscriptions → *Volledige toegang* → **Maand**, en
  kijken of de kolom *Introductory Offers* in de prijzentabel gevuld is
- Play Console → het abonnement → basisplan → Aanbieding → gratis proefperiode,
  3 dagen, bij allebei de plannen
- en daarna nameten op een toestel, want de console is niet het bewijs

Staat het er niet, dan leest de koper drie dagen gratis en schrijft de winkel
meteen af. `docs/GO-LIVE.md` §0 staat erbij stil, inclusief de eerlijke uitweg:
`TRIAL_DAYS` op 0, waarna de app niets meer belooft wat de winkel niet doet.

## 2. Bouwen — morgen

**Wie en waar:** Adil. Android op Windows, iOS op de Mac. Die tweede kan niet
op de pc.

Haal eerst de code op. De code staat op GitHub, niet op die twee machines, en
wie dat overslaat bouwt de oude app in een nieuw jasje — wat je pas ziet als de
bundel al bij de winkel ligt.

### Android, op Windows

Windows PowerShell 5.1. Drie regels, elk op zichzelf compleet, dus het maakt
niet uit uit welke map je komt en je kunt ze los plakken.

```powershell
if (-not $p) { $p = (Get-ChildItem $HOME -Recurse -Depth 5 -Filter darija-kids -Directory -ErrorAction SilentlyContinue | Select-Object -First 1).FullName }; if ($p) { git -C $p pull origin main } else { "darija-kids niet gevonden onder $HOME" }
```

```powershell
if (-not $p) { $p = (Get-ChildItem $HOME -Recurse -Depth 5 -Filter darija-kids -Directory -ErrorAction SilentlyContinue | Select-Object -First 1).FullName }; if ($p) { npm --prefix $p install } else { "darija-kids niet gevonden onder $HOME" }
```

```powershell
if (-not $p) { $p = (Get-ChildItem $HOME -Recurse -Depth 5 -Filter darija-kids -Directory -ErrorAction SilentlyContinue | Select-Object -First 1).FullName }; if ($p) { npm --prefix $p run aab -- --versie 8 --naam 1.4 } else { "darija-kids niet gevonden onder $HOME" }
```

`--versie` is het nummer dat Play telt, `--naam` het nummer dat de gebruiker
ziet. Sla die `npm install` niet over: slaat `cap sync` een plugin stil over
omdat `node_modules` achterloopt, dan start de app wel en trilt hij niet en
komt de herinnering nooit. Dat is op 2 oktober gebeurd — Windows vond één
plugin waar de Mac er drie vond.

De bundel komt hier te staan:

```text
android/app/build/outputs/bundle/release/app-release.aab
```

### iOS, op de Mac

zsh, geen PowerShell. De `$p`-truc hierboven werkt daar niet; die antwoordt
*command not found: -not*. Drie regels, elk compleet.

```bash
git -C ~/Gedmma-app pull origin main
```

```bash
npm --prefix ~/Gedmma-app/darija-kids install
```

```bash
npm --prefix ~/Gedmma-app/darija-kids run ios -- --build 10 --versie 1.4
```

Die laatste bouwt de app, kopieert hem in het iOS-project, zet de twee regels
in `Info.plist` en schrijft het buildnummer en het versienummer in het
Xcode-project. Zet die nummers daarna niet nog een keer met de hand in Xcode;
dan zijn er twee plekken waar ze kunnen verschillen.

Daarna in Xcode: **Product → Archive**, en in Organizer **Distribute App → App
Store Connect → Upload**. Archiveren duurt vijf tot tien minuten
(`docs/MAC.md` §C6), en daarna staat de build er pas na tien tot twintig
minuten — eerst op *Processing*, en zolang dat er staat is hij niet te kiezen.
Reken op een half uur, niet op tien minuten.

Eén ding om vooraf te controleren, want het kost anders een avond: **Build
Settings → Code Signing Identity → Release** moet op *Apple Distribution*
staan. Staat daar *Apple Development*, dan faalt Archive met een melding over
apparaten en over Apple, en die wijst naar de verkeerde plek. `docs/MAC.md`
§C4b en §C4c staan erbij stil.

## 3. Nakijken — vier vinkjes

**Wie en waar:** Adil, op Windows, direct na de Android-bouw.

```powershell
if (-not $p) { $p = (Get-ChildItem $HOME -Recurse -Depth 5 -Filter darija-kids -Directory -ErrorAction SilentlyContinue | Select-Object -First 1).FullName }; if ($p) { npm --prefix $p run watzitin } else { "darija-kids niet gevonden onder $HOME" }
```

Hij leest de bundel die er ligt en zegt wat erin zit. Er horen **vier vinkjes**
te staan:

```text
  ✓ de app zelf                    app.darijaforkids.learn.MainActivity
  ✓ @capacitor/app                 com.capacitorjs.plugins.app.AppPlugin
  ✓ @capacitor/haptics             com.capacitorjs.plugins.haptics.HapticsPlugin
  ✓ @capacitor/local-notifications com.capacitorjs.plugins.localnotifications.LocalNotificationsPlugin
```

Staat er een kruisje, dan stop je. Ontbreekt de app zelf, dan start hij niet:
logo even in beeld en weg, `ClassNotFoundException`. Daarop is inzending 4
afgewezen — *Your app crashes after opening*, 2 oktober — en Gradle klaagde er
niet over: een Android-project zonder activity is een geldig Android-project.
Ontbreekt een plugin, dan start hij wel en doet dat stuk niets, en dat merk je
aan een recensie.

Daaronder staan vier tellingen. `?.` en `??` horen op nul te staan, `async` op
nul en `function*` op iets boven nul. Dan is de bundel op es2015 gebouwd en
wordt hij ingelezen vanaf Chrome 51 — de WebView waarmee Android 7 is
uitgekomen, en dat is wat minSdkVersion 24 belooft. Staat er `?.` in, dan is
dit niet de app waarvan je denkt dat je hem hebt opgestuurd: op een oudere
WebView geeft dat een wit scherm zonder foutmelding. Google noemt dat *installs,
but doesn't load*, en daarop is inzending 3 afgewezen, op 23 september. Dat zijn
de twee afwijzingen bij Play, en dit zijn de twee controles die ze allebei
hadden tegengehouden.

En de laatste twee regels: `index.html` in de bundel en `index.html` in `dist/`
horen dezelfde hash te hebben. Staat er VERSCHILLEND, dan is de bundel ouder
dan de bouw.

`watzitin` sluit af met een foutcode als er iets niet klopt. Een stille afloop
met vier vinkjes is het groene licht.

### Voor iOS is er geen watzitin

Die opdracht leest een `.aab`, en dus niets over build 10. Voor iOS is de
controle een toestel: zet build 10 via TestFlight op de iPhone en loop het
startscherm in vier stappen door, de kleur die meekleurt, en het geluid met de
zijschakelaar op stil. `docs/MAC.md` §D zegt waar je op let.

Dat kost een half uur en het is de enige plek waar je ziet wat een kind ziet.

## 4. Insturen — morgen, allebei dezelfde dag

**Wie en waar:** Adil, in de browser. Geen opdracht.

Allebei dezelfde dag, anders staat de ene winkel klaar terwijl de andere nog
begint en bepaalt de langste van de twee alsnog je dag.

### Apple

| | |
|---|---|
| Versie | 1.4 |
| Build | 10 |
| Wat is er nieuw | uit `store/wat-is-nieuw-1.4.md`, alle zes de talen |
| Vrijgeven | **Manually release this version** |

Die laatste gaat terug naar handmatig. Bij 1.1 stond hij op *Automatically
release*, en dat was goed: toen hing er geen aankondiging aan en hoe eerder hij
live stond hoe beter. Nu hangt de dag er wél aan. Een winkel die bij
goedkeuring zelf publiceert, bepaalt je lanceerdag, en dan staat de app op
zondagavond in de winkel terwijl het eerste bericht nog moet.

Zet *Phased Release for Automatic Updates* aan. Dat raakt alleen toestellen die
de app al hebben en zichzelf bijwerken; wie hem nieuw downloadt krijgt gewoon
1.4.

### Play

| | |
|---|---|
| Spoor | Productie |
| Versiecode | 8 |
| Versienaam | 1.4 |
| Wat is er nieuw | uit `store/wat-is-nieuw-1.4.md`, alle zes de talen |
| Uitrol | **100 %** |
| Managed publishing | blijft aan |

Geen gefaseerde uitrol op een percentage. Er staat bij Play geen eerdere versie
live om op terug te vallen, dus een percentage betekent dat een deel van je
publiek op de winkelpagina niets vindt — op de dag dat het bericht eruit is.

Die zes talen zijn geen beleefdheid: Play weigert een release waarvan een taal
over de 500 tekens gaat, en dat merk je pas als de bundel er al ligt.
`winkelnieuws.test.ts` telt ze bij elke testronde na.

## 5. Wachten

**Wie:** de winkels. Jij doet niets, en dat is de hele stap.

| | |
|---|---|
| Apple | meestal binnen een dag, nu 1.0 goedgekeurd en live staat |
| Play | tot zeven dagen, want Play heeft nog nooit iets van deze app goedgekeurd |

Die zeven dagen zijn het enige in dit draaiboek dat niet vanzelf in een week
past. Play heeft inzending 4 — versiecode 4 — op 2 oktober afgewezen op
*Your app crashes after opening*, en in het dashboard heet de app nog
`app.darijaforkids.learn (unreviewed)`: nooit goedgekeurd. De tabel in
`docs/GO-LIVE.md` zet "uren tot een dag" dan ook in de kolom ná de lancering en
"tot zeven dagen zonder eerdere goedkeuring" ervoor. `docs/STAND.md` zegt erbij:
bij een nieuw ontwikkelaarsaccount soms langer.

Daarmee hangt de lanceerdag aan Play en niet aan Apple. Twee gevolgen. Stuur in
op de dag van de bouw en niet een dag later; zeven dagen vanaf morgen loopt tot
het eind van volgende week. En kies de dag pas als Play groen is — niet eerder,
want dan belooft het bericht een winkel die nog dicht is.

Er valt niets te versnellen. Geen van de twee winkels heeft een spoedknop die
je zelf indrukt.

Wat je in deze dagen niet aanraakt:

- **De aankopen bij Apple.** Die zijn weer alleen-lezen. Eraan willen zitten
  kost je het intrekken van de indiening, en dus de ronde.
- **App content bij Play.** Een wijziging daar is zelf een wijziging die
  beoordeeld moet worden en kan de lopende inzending verlengen of opnieuw laten
  beginnen. Kijken mag, wijzigen niet.
- **De website.** Die blijft op "binnenkort" tot stap 6.

Komt er een afwijzing: beantwoord hem dezelfde avond. Een ronde kost een tot
drie dagen, dus een nacht wachten met de reparatie kost er net zoveel als de
beoordeling zelf.

En als er opnieuw gebouwd moet worden: het nummer gaat nooit omlaag en nooit
opnieuw. Apple weigert een buildnummer dat al bestaat, Play weigert een
versiecode die al eens geüpload is — ook een ingetrokken upload. Dan is het
build 11 en versiecode 9, met dezelfde naam 1.4.

## 6. Vrijgeven — volgende week, 's ochtends

**Wie en waar:** Adil, in de browser, en één opdracht op Windows.

**Kies dinsdag, woensdag of donderdag.** Niet vrijdag, dan valt je eerste dag
in het weekend. Niet maandag, dan verdrinkt het. De dag dat de goedkeuringen
binnen zijn is niet de lanceerdag; dat is de dag dat je hem kunt kiezen.

Apple eerst, Play erachteraan. Apple heeft na "vrijgeven" nog een paar uur
nodig om de app langs al zijn winkels te sturen, Play is binnen het uur
zichtbaar.

1. **Apple**: de app → versie 1.4 → **Release this version**. De versie staat
   dan op *Pending Developer Release*; die knop is het hele werk.
2. **Play**: Publishing overview → **Publish**.
3. **Wachten tot de twee adressen echt opengaan.** Op een toestel, niet op de
   Mac en niet in een tabblad waar je al ingelogd bent.

```text
play.google.com/store/apps/details?id=app.darijaforkids.learn
apps.apple.com/app/id6813964474
```

Een 404 betekent niet dat het adres fout is. Het betekent dat de release op jou
wacht, of dat Apple nog aan het rondsturen is. Wacht het af en zet de website
nog niet om.

4. **De website**, één opdracht op Windows:

```powershell
if (-not $p) { $p = (Get-ChildItem $HOME -Recurse -Depth 5 -Filter darija-kids -Directory -ErrorAction SilentlyContinue | Select-Object -First 1).FullName }; if ($p) { npm --prefix $p run live -- --google } else { "darija-kids niet gevonden onder $HOME" }
```

Het Apple-adres staat al in `src/site/links.ts`, dus hij vraagt niets en vult
alleen Google aan. Daarmee verdwijnt het blok "binnenkort", wordt de balk
onderaan een downloadknop en worden de twee winkelknoppen echt.

5. **Pushen**, want de productiebranch publiceert zichzelf. Drie regels, elk op
   een eigen regel — PowerShell 5.1 leest `&&` niet als scheiding.

```powershell
if (-not $p) { $p = (Get-ChildItem $HOME -Recurse -Depth 5 -Filter darija-kids -Directory -ErrorAction SilentlyContinue | Select-Object -First 1).FullName }; if ($p) { git -C $p add -A } else { "darija-kids niet gevonden onder $HOME" }
```

```powershell
if (-not $p) { $p = (Get-ChildItem $HOME -Recurse -Depth 5 -Filter darija-kids -Directory -ErrorAction SilentlyContinue | Select-Object -First 1).FullName }; if ($p) { git -C $p commit -m "De app staat in de winkel" } else { "darija-kids niet gevonden onder $HOME" }
```

```powershell
if (-not $p) { $p = (Get-ChildItem $HOME -Recurse -Depth 5 -Filter darija-kids -Directory -ErrorAction SilentlyContinue | Select-Object -First 1).FullName }; if ($p) { git -C $p push } else { "darija-kids niet gevonden onder $HOME" }
```

Binnen een paar minuten staat darijaforkids.eu goed. Open hem zelf en druk op
allebei de knoppen. Werkt er één niet, dan brengt `npm run live -- --uit` je
terug naar "binnenkort" tot het klopt.

## 7. De communicatie

**Wie en waar:** Adil, op de telefoon. Pas als allebei de winkeladressen
opengaan en de website om is.

De teksten staan klaar. Schrijf ze niet opnieuw, en houd één kopie.

| | | |
|---|---|---|
| 09:00 | de persoonlijke WhatsApp-berichten | `store/lancering/kanaal.md`, het korte blok |
| 10:00 | het WhatsApp-kanaal | `store/lancering/kanaal.md` |
| 11:00 | Instagram en TikTok | `store/lancering/socials.md` |
| 13:00 | Facebook | `store/lancering/socials.md` |
| 15:00 | YouTube, en de link in elke beschrijving | `store/lancering/socials.md` |
| de avond | de mail aan wie erom gevraagd heeft | `store/lancering/mail.md` |

De persoonlijke berichten zijn het werk van de dag. De rest is twintig minuten.
Dat is geen vergissing in de planning: één zus die het doorstuurt naar één
familiegroep levert meer op dan een hele dag posten.

Drie dingen die vóór 09:00 af moeten, en die in die bestanden ook met reden
genoemd staan:

- **De introfilm noemt een prijs die niet bestaat.** Op de slotkaart staat
  € 4,99 per maand. Nagekeken op 2 oktober: die regel staat er nog, in
  `dev/intro.ts` bij `price`, in alle zes de talen, en er is geen test die hem
  nakijkt. Het abonnement is € 6,99 per maand of € 59,99 per jaar. Dus
  `dev/intro.ts` aanpassen, `npm run intro` opnieuw, nieuwe opname, en de nieuwe
  link op twee plekken buiten YouTube: `FILM_YOUTUBE` in `src/site/links.ts` en
  Play Console → *Main store listing → Video*. Vergeet je de eerste, dan wijst
  de site nog naar de film met de oude prijskaart. Zolang dit niet gebeurd is,
  gaat de YouTube-video niet op openbaar.
- **De YouTube-handle en de Facebook-gebruikersnaam.** Zonder die twee wijst het
  bericht aan het kanaal naar een foutpagina en naar een adres met een
  getalreeks erin.
- **De twee adressen staan in geen enkel plakbaar blok.** Ze komen er bij het
  plaatsen als losse regels onder, Android eerst. Een blok met een gat erin
  wordt geplakt mét het gat.

De vijf posts van de dagen erna staan al klaar — de beelden in
`brand/social/posts/`, de bijschriften in `store/social.md`. Eén per keer, twee
per week.

---

## Als je de volgorde omdraait

Dit is de reden dat er een draaiboek is. Elke regel hieronder is een keer
misgegaan of staat één beslissing daarvandaan.

| Wat je omdraait | Wat er gebeurt |
|---|---|
| **Bouwen vóór intrekken** | 1.1 staat op *Automatically release*. Komt de goedkeuring eerder dan jij, dan staat 1.1 in de winkel, is je lanceerversie 1.1, en lopen de nummers weer uiteen. De aankondiging gaat dan over een versie die niemand kan downloaden. |
| **Insturen vóór intrekken** | Apple neemt geen tweede versie in beoordeling zolang de eerste er ligt. Bij Play vervangt een nieuwe upload de lopende beoordeling zonder iets te vragen: je denkt dat je 8 hebt ingestuurd en je bent aan ronde twee begonnen. |
| **Insturen vóór nakijken** | Dan hangt de lancering aan een bundel die niemand heeft gelezen. De bouw is op Windows een week stuk geweest zonder dat het opviel, en de vorige bundel bleef gewoon op de uitvoerplek liggen. Een bundel zonder `MainActivity` wordt door Play goedgekeurd en opent niet. |
| **Nakijken vóór bouwen** | `watzitin` leest de bundel die er ligt, niet de bundel die je bedoelde. Valt de bouw om, dan staat de oude er nog, en vier vinkjes op de oude bundel zeggen niets over de nieuwe. Kijk naar de datum die hij bovenaan afdrukt. |
| **Eén winkel insturen en de andere later** | Dan bepaalt de langste van de twee je dag alsnog, en heb je de wachttijd twee keer in plaats van één keer. |
| **Vrijgeven voordat allebei goedgekeurd zijn** | Dan staat de app in één winkel en zegt het bericht "in allebei de winkels". De meeste mensen in het kanaal zitten op Android; Apple alleen aankondigen maakt het moment op voor de kleinste helft, en voor de rest moet je een tweede keer komen met oud nieuws. |
| **Posten vóór vrijgeven** | Een bericht met een dode link komt maar één keer voorbij. Een link in een kanaal wordt door honderd mensen tegelijk getikt. |
| **De website omzetten vóór de adressen opengaan** | Dan staat er een downloadknop die naar een 404 wijst, en dat is erger dan "binnenkort". Apple is na *Ready for Distribution* soms nog uren aan het rondsturen. |
| **Play op een percentage uitrollen** | Er is bij Play geen eerdere versie om op terug te vallen, dus een deel van je publiek vindt niets. |
| **Bij Apple op automatisch vrijgeven laten staan** | Dan bepaalt de goedkeuring je lanceerdag. Bij 1.0 was dat de reden om handmatig te kiezen, en daarom kon 1.0 op een gekozen moment stil live. |
| **De aankopen aanraken terwijl er een versie ligt** | Ze zijn alleen-lezen, en losmaken gaat alleen door de indiening in te trekken. Dat kost de ronde. Doe het in stap 1, waar het raam openstaat. |
| **Het nummer verlagen** | Kan niet. Apple weigert een buildnummer dat al bestaat, Play een versiecode die al eens geüpload is, ook een ingetrokken upload. Omhoog, altijd. |

## De afvinklijst voor de dag zelf

Vrijgeven en aankondigen, in deze volgorde. Niets hiervan is te doen zonder dat
het vorige af is.

**Vooraf**

- [ ] Allebei de winkels hebben 1.4 goedgekeurd — Apple build 10, Play
      versiecode 8
- [ ] Het is dinsdag, woensdag of donderdag, en het is ochtend
- [ ] De proefperiode van drie dagen staat in beide winkels bij beide plannen
- [ ] De introfilm zonder de prijs van € 4,99 staat op YouTube, op openbaar, en
      de nieuwe link staat in `src/site/links.ts` én in Play Console
- [ ] De YouTube-handle is gezet en de Facebook-pagina heeft een
      gebruikersnaam
- [ ] De profielen staan niet leeg

**Vrijgeven**

- [ ] Apple: versie 1.4 → Release this version
- [ ] Play: Publishing overview → Publish
- [ ] Het Play-adres opent op een toestel, niet ingelogd
- [ ] Het App Store-adres opent op een toestel, niet ingelogd
- [ ] `npm run live -- --google` gedraaid
- [ ] Toegevoegd, vastgelegd en gepusht — drie losse regels
- [ ] darijaforkids.eu is om, en allebei de knoppen werken

**Aankondigen**

- [ ] 09:00 de persoonlijke WhatsApp-berichten
- [ ] 10:00 het kanaal, met de twee adressen als losse regels eronder, Android
      eerst
- [ ] Eerst naar jezelf gestuurd, en gekeken wat WhatsApp met de links doet
- [ ] 11:00 Instagram en TikTok
- [ ] 13:00 Facebook
- [ ] 15:00 YouTube, en de twee regels bovenaan elke videobeschrijving
- [ ] 's avonds de mail, alleen naar wie bevestigd is — `npm run belangstelling`
      telt die twee apart
- [ ] Gezocht op dubbele haken in alle zes de mailtalen; één treffer betekent
      niet versturen

**Daarna**

- [ ] Niets stilgezet. Het woordje van de dag gaat gewoon door
- [ ] De rest van de dag antwoorden op wie reageert. Dat is belangrijker dan het
      bericht
- [ ] Geen tweede post op hetzelfde kanaal vandaag
