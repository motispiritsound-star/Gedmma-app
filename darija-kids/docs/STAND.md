# Waar staan we

Bijgewerkt op 25 september 2026. Dit bestand is het antwoord op "wat moet er
nog" zonder dat je drie andere bestanden hoeft te lezen.

## De app

| | |
| --- | --- |
| Inhoud | 17 units, 432 opnames, 304 woorden — af |
| Website | 8 pagina's × 6 talen, nagekeken op dode links en losse eindjes |
| Tests | 955, groen |
| Google Play | 2 (1.1) in review; 3 (1.2) is gebouwd en wacht op upload |
| App Store | 1.0 (build 5) **opnieuw ingediend** op 25 september, wacht op beoordeling |

Wat er in build 5 zit en niet in build 4: het antwoord op richtlijn 4.2
(microfoon, trillen, herinnering, breder op een iPad — zie `docs/APPLE-4.2.md`)
en de twee prijsreparaties (`$4.17` in plaats van `US$ 4,17`, en de prijzen
opnieuw ophalen zodra de app weer voor staat).

**Bouwen doe je met `npm run ios`**, niet met `npx cap sync ios`. Dat zet ook
de twee regels in `Info.plist` — waaronder die voor de microfoon, en zonder
die regel sluit iOS de app af zodra een kind op de opnameknop drukt.

Het antwoord aan App Review staat klaar in `store/appstore-4.2-antwoord.md`.

### De afwijzing van 25 september — afgehandeld

Apple wees build 5 af op richtlijn 2.3.8: de ondertitel *For the kids, quietly
for you* zei dat de app voor kinderen is, terwijl hij niet in de
Kinderen-categorie is ingediend. Dat ging niet over de app zelf — geen nieuwe
build, geen Xcode, geen Mac.

De ondertitel is in alle zes de talen aangepast (`store/listing.<taal>.md`; in
het Nederlands **Marokkaans-Arabisch leren**), het antwoord uit
`docs/APPLE-2.3.8.md` is via Reply to App Review verstuurd, en dezelfde build
is opnieuw ingediend. Er staat dus geen nieuw bestand bij Apple — alleen andere
tekst — en dat gaat doorgaans sneller dan een eerste beoordeling.

Twee dingen om te weten die in dat bestand staan. De **naam** draagt hetzelfde
woord, en Apple noemt de naam in dezelfde zin als de ondertitel; deze ronde
hebben ze hem niet aangestipt, maar een volgende reviewer kan dat wel doen.
Gebeurt dat, dan is hernoemen geen optie en is de Kinderen-categorie het
antwoord — en daarvóór moeten de mailto-links uit de app achter de ouderpoort,
want die mag een kind daar niet kunnen aantikken. Wat er dan precies moet
verhuizen staat in `docs/APPLE-2.3.8.md`, per bestand.

### Handelsverificatie — gedaan

Apple heeft de handelaarsverificatie voor de Digital Services Act op
**24 september goedgekeurd**; het KvK-uittreksel was genoeg. De
handelaarsgegevens staan nu live in de App Store in de hele Europese Unie.

Daarmee is het laatste papierwerk weg dat niet over de app zelf ging. Wat er
nog tussen jou en de winkel staat is de beoordeling van build 5, en verder
niets.

### De dollarprijs op het keuzescherm — afgehandeld

In TestFlight staat er `$49.99` en `$5.99` op het keuzescherm terwijl het
betaalvenster van Apple keurig euro's toont. Daar is niets aan kapot.

In App Store Connect staat **Netherlands (EUR) € 59,99**; dat is nagekeken in
de prijzenlijst zelf. Een koper in Nederland krijgt in de uitgebrachte app
dus € 59,99 te zien, precies wat de website en de vijf winkelschermafdrukken
beloven. TestFlight vraagt de productgegevens alleen bij een dollarwinkel op,
en dat verandert niet door in App Store Connect aan de prijzen te draaien —
een prijswijziging verandert hoogstens wélk dollarbedrag er staat.

Dus: niet meer aan sleutelen. De proef die telt is de app uit de App Store op
een Nederlands account. Wie het eerder zeker wil weten, zet onderaan de
ouderpagina het blok **Winkelgegevens** open: daar staat `EUR` of `USD`
letterlijk, en dat blok zit vanaf de volgende build in de app.

Wat in App Store Connect wél nog open staat, gaat niet over jouw scherm maar
over de andere 174 landen — zie de drie open punten bij *De producten — Apple*
in `docs/LAUNCH.md`.

Dezelfde verbeteringen gaan als 1.2 naar Play. De bundel is gebouwd met
`npm run aab -- --versie 3 --naam 1.2`. **Upload hem pas als 1.1 is
goedgekeurd**: een nieuwe release vervangt de release die in review staat, en
dan begint de eerste beoordeling van voren af aan. De "wat is er nieuw"-tekst
voor beide winkels staat in zes talen in `store/wat-is-nieuw-1.2.md`.

### Nog na te kijken bij Google Play

Drie dingen die losstaan van de beoordeling en die je in een paar minuten
nakijkt. Ze staan hier omdat ze pas opvallen als het te laat is.

1. **App access.** Play Console → App content → App access. De app heeft geen
   inlog, maar dat moet je er wél neerzetten: *All functionality is available
   without special access*. Staat dat veld leeg, dan wijst een reviewer af
   omdat hij denkt dat hij ergens niet bij kan.
2. **Managed publishing aan.** Anders publiceert Play zichzelf zodra hij groen
   is, en bepaalt Google je lanceerdag in plaats van jij.
3. **Target audience and content.** Dat is Google's versie van de vraag waarop
   Apple afwees: voor welke leeftijden is de app. Geef je daar kinderen op, dan
   geldt het Families-beleid — geen advertenties van derden, geen trackers. De
   app voldoet daar al aan, maar het moet kloppen met wat er staat.

### Drie opdrachten die geen pad en geen waarde meer vragen

| | |
|---|---|
| `npm run inloggen` | één keer, wrangler bij Cloudflare |
| `npm run deploy` | de worker uitrollen |
| `npm run koopgeheim` | nieuw geheim, en het hele Gumroad-adres erbij |

Ze draaien alle drie vanuit `darija-kids` — geen `cd server` meer. Dat was
niet luxe: `cd C:\...\darija-kids\server` is een keer letterlijk geplakt,
met de puntjes erin, en `npm run deploy` in de thuismap klaagt dan over een
ontbrekende `package.json`.

Om dezelfde reden vraagt `npm run live -- --google` zelf om het Apple ID in
plaats van het in de opdracht open te laten. Er staat nergens in dit project
nog een blok om te plakken met iets tussen punthaken; `documentatie.test.ts`
valt als er weer een verschijnt.

### Wat alleen jij kunt doen

1. **Apple: prijsbasis op Nederland.** De prijzen staan goed — Nederland op
   € 59,99 en € 6,99 — maar ze zijn aangemaakt met de Verenigde Staten als
   uitgangspunt en de eurolanden zijn daarna met de hand bijgewerkt. Daardoor
   staat Montenegro nog op € 49,99 en Marokko op $ 59,99, meer dan een
   Amerikaan betaalt. Opnieuw instellen met *Recalculate prices* vanuit
   Nederland, en daarna alleen Marokko met de hand verlagen.
2. **Apple: naam en beschrijving van de abonnementen.** Daar staat nu de
   appnaam met een Nederlandse zin eronder, en dat is de vermelding voor de
   hele wereld buiten Nederland. De teksten staan klaar om te plakken in
   `store/abonnement-teksten.md`, in zes talen, nageteld tegen de grenzen van
   Apple (30 tekens voor de naam, 45 voor de beschrijving — hij kapt niet af,
   hij weigert). Doe je er maar één, doe dan Engels.

   **Kan pas als het slot eraf is.** Zolang 1.0 *Waiting for Review* of
   *In Review* staat, zijn de abonnementen alleen-lezen: Apple beoordeelt ze
   mee met de versie. Dat is geen fout in het scherm.
3. **Apple: royaltyvaluta.** Bij de bankrekening staat USD. Zet dat op EUR,
   anders wordt er twee keer gewisseld op elke uitbetaling.
4. **Apple: DAC7.** Moet ingevuld voordat er uitbetaald kan worden. Het
   antwoord op "persoonlijke diensten" is **nee** — dat gaat over werk van
   mensen per uur of per klus, en dit is een app.
5. **Google: bankrekening en belastinggegevens.** Zonder dat geen uitbetaling,
   ook niet als de app al verkoopt.

## De boeken

**Sba de Atlasleeuw** — twaalf delen, dertig bladzijden per deel, af. De
vormgeving volgt de v2-proef: woordkaart op de plaat, het woord in kapitalen,
het Arabisch eronder, "Zeg het hardop!".

Elk deel heeft één geschilderd tafereel dat het hele boek draagt — de poort
van Fes, de souq van Marrakech, de bergen in de sneeuw — en dat staat al in
`store/prentenboek/platen/<deel>/achtergrond.jpg`. De tekeningen op de
bladzijden zelf zijn nog vectoren. Wil je er per bladzijde een geschilderde
plaat bij, zet die dan neer als `platen/<deel>/<nummer>.jpg`; de zetter pakt
hem dan boven de achtergrond. De 144 opdrachten daarvoor staan in
`store/prentenboek/platenlijst.md`, en dat is de enige post in dit project die
nog echt geld kost.

**De sleutels van Marokko** — vijftien delen. Bladzijden per deel:

| Deel | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Blz | 33 | 42 | 35 | 29 | 31 | 46 | 31 | 29 | 28 | 27 | 27 | 27 | 26 | 28 | 25 |

Alle vijftien delen zijn uitgeschreven, en alle vijftien staan in **zes
talen**: Nederlands, Frans, Duits, Spaans, Italiaans en Engels. Dat zijn
negentig boeken.

De vertaling ligt alinea voor alinea naast het Nederlands, en daar staat een
test op: een hoofdstuk dat wegvalt of een alinea die wordt samengevoegd laat
de build vallen. Dat is met opzet — een boek van dit soort leeft van de
stiltes tussen de alinea's, en wie die samenvoegt haalt het tempo eruit.

Historische foto's kunnen erin zodra ze in `store/sleutels/platen/<deel>/`
staan, met `bronnen.txt` ernaast. Welke opname waar hoort staat in
`store/sleutels/beeldenlijst.md`.

## De winkel

Open, voor één van de drie. Zie `docs/WINKEL-INRICHTEN.md`.

| Product | Prijs | Status |
| --- | --- | --- |
| De sleutels van Marokko | € 34,99 | **te koop** — `venshipper.gumroad.com/l/sleutels` |
| Sba de Atlasleeuw | € 34,99 | **te koop** — `venshipper.gumroad.com/l/sbadeleeuw` |
| Het e-boek | € 14,99 | bestanden klaar, product nog aanmaken |

Gumroad is de *merchant of record*: zij zijn juridisch de verkoper, innen de
btw in elk EU-land, leveren het bestand en doen de terugbetalingen. Op het
afschrift van een koper staat hun naam, en daarom staat dat ook op de
afrekenpagina. Het kost 10% + $0,50, plus 2,9% + $0,30 aan kaartkosten — bij
€ 34,99 houd je ongeveer € 29,70 over. Komt de koper binnen via hun eigen
etalage (*Discover*), dan is het 30% vlak.

`npm run winkel` zet alle tweeënnegentig boeken, maakt er drie zips van en
schrijft `store/winkel/producten.md`: per product de titel, de prijs, het
bestand en de tekst voor de productpagina. `node scripts/make-winkelplaat.mjs`
maakt de beelden erbij — per product een omslag, een duimnagel en een plaat
met alle titels erop.

Zolang een link in `src/site/shop.ts` leeg is, staat er op de website
"Binnenkort" en geen dode knop. De drie producten gaan dus los van elkaar
open.

**De handelaarsgegevens staan op de website**, en niet alleen een
KvK-nummer: Venship, het adres en het telefoonnummer staan op de
afrekenpagina, in de voorwaarden, in de privacyverklaring en op de
ouderpagina. Dat is wat de Digital Services Act van een verkoper aan
consumenten vraagt, en het is dezelfde informatie die Apple heeft
goedgekeurd — dus als er één ding verandert, verandert het op vier plekken
tegelijk (`traderTable` in `scripts/make-site.mjs`).

**Het begin van De sleutels staat gratis op darijaforkids.eu/leesboeken**, in
zes talen, zonder account en zonder e-mailadres: de eerste drie hoofdstukken
van *De olijvenbrand*, ruim elfhonderd woorden, en het houdt op vlak vóór er
iets misgaat.

Het staat er nu ook **met stem**. Eén knop op de boekenpagina vouwt het begin
open, met dezelfde voorleesbalk als na het afrekenen. Dat is met opzet: een
pdf laat niet horen wat je koopt — die download je, opent in een ander
programma, en zwijgt. De pdf staat er nog wel naast voor wie liever
downloadt (`npm run sleutels -- --deel 1 --tot 3`).

Sba heeft met opzet geen gratis deel: dat is een twaalfde van de reeks en in
vijf minuten uit.

### Het portaal

De worker draait: `darijaforkids-post.motispiritsound.workers.dev`, met de
database erachter en alle zes de tafels erin. Op darijaforkids.eu/portaal meld
je je aan met je e-mailadres, krijg je een link, en zie je daarna je gekochte
reeksen. Geen wachtwoord — zie `server/src/portaal.ts` voor waarom niet.

Hij hangt aan zijn eigen adres: **post.darijaforkids.eu**, aangelegd door
`npm run deploy` zelf. Dat staat als route in `server/wrangler.toml`, en omdat
het domein op de nameservers van Cloudflare draait zet wrangler de DNS-regel
er zelf bij. Het adres op `workers.dev` staat voorlopig nog aan om op te
testen; zodra het eigen adres antwoordt mag `workers_dev = false`.

Twee dingen die nog moeten voordat het werkt voor een echte koper:

1. **Gumroad laten melden dat er verkocht is.** Eén veld invullen, onder
   Settings → Advanced → Ping. Het adres dat daarin hoort drukt deze opdracht
   compleet af — er valt niets in te vullen:

   ```bash
   npm run koopgeheim
   ```

   Hij verzint een nieuw geheim, stuurt het naar Cloudflare en geeft het hele
   adres. Draai je hem nog eens, dan werkt het oude adres niet meer.

   Zonder die melding blijft de bibliotheek van een koper leeg terwijl hij wél
   betaald heeft, en dat is de ergste soort bug: hij lijkt op diefstal.

   `/koop` neemt sinds kort ook de kale ping van Gumroad aan — een gewone
   formulierpost, met het geheim in het adres, want Gumroad kan geen eigen
   koppen sturen. Het vertaalt zelf het productadres naar de reeks, raadt de
   taal uit het land van de koper, en herkent de proefmelding uit het
   instellingenscherm. Hoe je het controleert staat in `server/LEES-MIJ.md`.
2. **Zelf een keer het hele rondje lopen**: kopen, mail, aanmelden, inloggen,
   en kijken of het boek er staat.

De mail die de koper dan krijgt is in zijn eigen taal. Die taal wordt geraden
uit het land dat Gumroad meestuurt, en de reekstitel in die mail is de titel
die ook op zijn boek staat — "The Keys of Morocco" en niet "De sleutels van
Marokko", want dat laatste staat nergens in zijn zip. Dat was tot 25 september
niet zo: elke koper kreeg een Nederlandse mail. Het zit nu in `MAILS` bij de
andere mails, met een test per taal.

### De omslagen en de titels

Naast elke reeks op de boekenpagina staat de omslag van deel 1. Die tekent de
zetter al mee in de pdf, en `--omslag` schrijft hem weg als plaatje — maar dat
was één keer gedaan, in het Nederlands, en die ene omslag stond naast alle zes
de taalversies. Een Franse bezoeker las "Les clés du Maroc" met daarnaast een
omslag waarop "DE SLEUTELS VAN MAROKKO · De olijvenbrand · DEEL 1 VAN
VIJFTIEN" stond.

`npm run omslagen` maakt ze alle twaalf: twee reeksen × zes talen. Er hoefde
niets getekend te worden. `make-site.mjs` pakt `site-assets/boeken/<taal>/` en
valt terug op `site-assets/boeken/` — daar blijft het Nederlands staan, zodat
een taal zonder eigen omslag er wel een houdt.

**De titels komen nu uit de boeken zelf.** Ze stonden dubbel: de verhalen
hadden hun vertaling en `src/site/delen.ts` had er nog een, met de hand
overgeschreven. Achtenvijftig van de honderdvijfendertig liepen uit elkaar —
en niet alleen in een woordje. Op de Spaanse pagina stond *Sba y el médico de
la medina* terwijl het boek *la doctora* heet: een ander personage. De winkel
beloofde boeken die onder die naam niet bestaan. `delen.ts` leest nu uit
`src/content/`, met het Nederlands als terugval, en er staat een test op die
valt zodra een deel in een taal onvertaald blijft.

### De platen bij de delen

Op de boekenpagina staat in de uitklaplijst per deel een geschilderd tafereel
met de titel erop: 1200 × 675, linksboven een kaartje met de reeksnaam, de
titel en het deelnummer met de plaats erachter. Daarmee is die lijst een
etalage geworden in plaats van twaalf regels tekst.

| | |
| --- | --- |
| Sba de Atlasleeuw | twaalf delen × zes talen — staan erop, `npm run deelplaten -- --taal alles` |
| De sleutels van Marokko | vijf delen × zes talen — `npm run sleutelplaten` |

De tweeënzeventig platen voor Sba staan in `site-assets/sba/<taal>/` en gaan
mee met de site.

Voor Sba komt het tafereel uit `store/prentenboek/platen/<deel>/` en alleen de
tekst uit de inhoud; verandert er een titel, dan zet je ze opnieuw in plaats
van ze opnieuw te tekenen. `--groot` geeft 1600 × 900, om ergens te delen.

Bij De sleutels ligt dat anders dan bij Sba. Daar bestaan vijf platen, met de
hand gemaakt, en het tafereel *zonder* tekst is er niet meer — alleen het
eindresultaat met het kaartje er al op. Vertalen kon dus niet door opnieuw te
zetten.

`npm run sleutelplaten` legt daarom een nieuw kaartje over het oude: dezelfde
plek, één vaste maat die ruimer is dan de grootste van de vijf zodat er niets
van het Nederlands onderuit steekt, en de titel in de taal die je leest. De
accentkleur per deel — turkoois voor Fes, roest voor Marrakech, brons voor
Ceuta — wordt uit de plaat zelf gelezen, één pixel uit de balk links, want hij
staat nergens opgeschreven. Het Nederlands blijft het origineel en wordt niet
overgezet.

Op die platen staat *De sleutel tot de geschiedenis van Marokko* — enkelvoud,
terwijl de reeks De sleutels van Marokko heet. Dat is bekeken en zo gelaten:
het is een ondertitel en geen reekstitel, en zo gelezen klopt hij. Niet
"verbeteren". In de andere vijf talen staat de vertaling daarvan
(`plaatOndertitel` in `src/site/copy.ts`).

Ontbreekt een plaat, dan blijft er gewoon een regel tekst staan — dat is wat
er bij **deel 6 tot en met 15** van De sleutels gebeurt, in alle zes de talen.
Daar is geen tekening voor en die moet getekend worden; dat is de enige post
in dit project die nog echt geld kost. De opdrachten staan in
`store/sleutels/beeldenlijst.md`.

### De lezer op de website

Na het inloggen staat er per gekochte reeks een knop *Lezen en luisteren*.
Daarachter zit het boek als tekst, in zinnen geknipt, met een voorleesbalk
erboven: de stem van het toestel zelf leest voor en de zin die klinkt licht
op. Geen opnames — die kosten geld, en dit onderdeel mocht niets kosten tot
er iets verdiend wordt.

De stem staat op alle drie de plekken waar tekst staat:

| | |
| --- | --- |
| Het gratis begin op `/leesboeken` | drie hoofdstukken, zonder account |
| De sleutels van Marokko, na het inloggen | vijftien delen, zes talen |
| Sba de Atlasleeuw, na het inloggen | de voorleestekst onder elke plaat |

Bij Sba is de bladzijde een plaatje en de tekst komt er los bij (bladzijde nul
van hetzelfde deel). Zonder die tekst zou een prentenboek zwijgen, en dat is
juist het boek waar een ouder hardop voorleest aan een kind dat nog niet zelf
leest.

De bladzijde ziet eruit als een bladzijde uit een boek en niet als een
webpagina: crèmekleurig papier, een schreefletter, alinea's met een inspringing
in plaats van witregels, en niet breder dan achtendertig regels tekst. Het
tafereel van het deel staat erboven. De voorleesbalk blijft onder de sitekop
hangen, ook op een telefoon.

**De stem komt van het toestel, en dat is te horen.** Wij leveren geen opnames
mee — de browser spreekt met de spraakstem die er staat. Op Windows en Android
is dat meestal een nieuwe, natuurlijk klinkende stem; in Safari op een iPhone
of iPad mag een bladzijde alleen bij de oude compacte stem, en die klinkt
blikkerig. De stem van Siri is niet aan webpagina's beschikbaar, dus daar is
met code niet omheen te komen. Wat er wél gedaan is:

- de nieuwere stemmen komen vooraan in het keuzelijstje (`klank()` in
  `src/site/lezer.js` zet ze op volgorde);
- staat er alleen een oude bij, dan zegt de lezer zelf dat er in de
  instellingen van het toestel een betere te downloaden is (`leesStemTip`);
- en op de boekenpagina staat het er vóór het afrekenen bij, in zes talen
  (`boekLuisterStem`) — niet als waarschuwing bovenaan, maar onder de drie
  stappen.

De vertellers heten Amir en Yassine bij de mannenstemmen en Yousra en Sarah
bij de vrouwenstemmen — vier, twee om twee. Dat zijn onze namen op de stemmen
van het toestel; welke echte stem eronder zit verschilt per apparaat.

Welk geslacht een stem heeft staat nergens in de Web Speech API, dus het wordt
uit de naam geraden — twee lijsten met namen in `src/site/lezer.js`. Die gok
ging twee keer mis op dezelfde manier: een stukje tekst dat toevallig in een
langer woord zit. `man` zit in "German (Germany)", waardoor in het Duits élke
stem een man was en Katja de naam Amir kreeg; `male` zit in "female"; en
`paul` zit in "Paulina". Nu wordt eerst de taalnaam weggeknipt en moet elke
naam een heel woord zijn. Honderdachtendertig echte stemnamen uit Windows,
macOS, iOS en Android zijn erlangs gelegd: geen enkele meer verkeerd, en geen
enkele meer onbekend.

`npm run portaalcheck` loopt dat hele rondje na in een echte browser, met de
antwoorden van de worker erbij verzonnen. Geen database, geen mail, geen
internet nodig. `npm run sitecheck` doet hetzelfde voor de website: dode links,
ontbrekende ankers, en elk stukje javascript in de bladzijden wordt ontleed.
Die twee hangen aan `npm run site` en `npm run build`, dus een dode link laat
de bouw vallen in plaats van dat iemand hem later tegenkomt.

**De boeken in de bak — de helft staat erin.** De lezer haalt elk boek apart
op uit R2. Die bak bestaat, en de negentig leesboeken van De sleutels staan
erin: vijftien delen in zes talen, samen twee megabyte. Dat rondje is nagelopen
op het echte adres — inloggen, *De olijvenbrand* openen, en de stem leest voor.

Wat er nog in moet zijn de prentenboeken van Sba. Die zijn bladzijden als
plaatje en moeten eerst geschoten worden:

```bash
npm run boeken -- --platen
```

Twaalf delen × zes talen × eenendertig bladzijden, ruim tweehonderd megabyte,
**ruim een uur** — ongeveer de helft schieten, de helft versturen. De
voorleestekst gaat vanzelf mee. Tot die tijd opent Sba niet in de lezer; de
pdf uit de winkel werkt gewoon, en de lezer zegt dat er ook bij.

Elk deel gaat de deur uit zodra het geschoten is en komt dan in
`store/bladen/gedaan.json`. Valt hij om — en over ruim tweeduizend bestanden
valt er een keer iets om — draai dan gewoon dezelfde opdracht opnieuw: wat er
al in staat wordt overgeslagen. Met `--opnieuw` doet hij alles nog een keer.

`npm run boeken` is de opdracht die dit allemaal doet en zelf kijkt wat er
nodig is: zonder vlaggen doet hij de leesboeken én de platen, met `--lezen` of
`--platen` alleen dat ene. Hij zoekt eerst een browser (de al geïnstalleerde
Edge is ook Chromium en wordt gepakt), zodat het niet halverwege afbreekt op
een download van honderdvijftig megabyte.

Moet de bak ooit opnieuw worden aangemaakt — een nieuw Cloudflare-account, een
andere naam — dan doet `cd server` plus `npm run maak-bak` dat: bak aanmaken,
binding aanzetten, uitrollen. Staat R2 in dat account nog uit, dan zegt de
opdracht zelf waar je dat aanzet. Dat aanzetten is het enige in dit project dat
echt met de muis moet; het vraagt niet om een betaalmethode.

### Het ledenbestand

Wie zich aanmeldt komt in de tafel `lid`. Het vinkje voor de nieuwsbrief staat
daar los van de twee verplichte, want gebundelde toestemming is geen
toestemming.

Eén ding om te onthouden voor de dag dat je die eerste nieuwsbrief stuurt:
**het vinkje alleen is geen grond om te mailen.** Iedereen kan bij het
aanmelden het adres van een ander invullen. De bevestiging is de klik op de
link in de mail — die kan alleen wie bij die mailbox kan. In de code zit daar
één functie voor, `nieuwsbrieflijst()` in `server/src/portaal.ts`, en die zet
die twee voorwaarden bij elkaar. Gebruik die, en geen zelfgeschreven query.

### Wat hier nog moet

1. **Je eigen boek kopen.** Met je eigen kaart, voor de volle prijs. De zes
   dingen om op te letten staan in `docs/WINKEL-INRICHTEN.md` onder *Zelf
   bestellen*. Het telt bovendien mee: voor Gumroad Discover heb je minstens
   één verkoop nodig.
2. **Het e-boek aanmaken**, en zijn adres in `LINKS` zetten. De twee reeksen
   staan er al.
3. **Een sectie op je Gumroad-profiel**, anders is `venshipper.gumroad.com`
   een lege pagina.

## De socials

Alle vier staan er en staan met hun logo op de startpagina.

| | |
| --- | --- |
| YouTube | youtube.com/@darijaforkidsapp |
| Instagram | instagram.com/darijaforkidsapp |
| Facebook | de pagina op nummer 61594495868221 |
| TikTok | tiktok.com/@darijaforkidsapp |

Zodra de Facebook-pagina genoeg volgers heeft mag er een gebruikersnaam op.
Dat is één regel in `src/site/links.ts`.

## Naar go-live

De hele dag staat uitgeschreven in **`docs/GO-LIVE.md`**: de volgorde, de
commando's, en alle berichten klaar om te plakken. Wat je daarvóór nog moet
doen, staat hier.

De volgorde die een aankondiging mogelijk maakt: eerst laten goedkeuren, dan
vasthouden, dan pas vrijgeven. Een winkel die bij goedkeuring meteen
publiceert, bepaalt zelf je lanceerdag — en dan staat de app al in de winkel
terwijl de eerste teaser nog moet komen.

1. **Play op handmatig.** Publishing overview → Manage → *Managed publishing*
   aan. Dan blijft een goedgekeurde release staan tot jij op publiceren drukt.
   Doe dit zolang submission 3 nog in review is; erna is het te laat.
2. **Apple op handmatig.** Bij het inzenden van de versie: *Manually release
   this version*. Niet "automatically".
3. De app zelf spelen: op een iPhone via TestFlight, op de Galaxy Tab via Play.
   De punten om op te letten staan in `docs/MAC.md` §D.
4. Vrijgeven: eerst Apple (de goedkeuring is er dan al, publiceren duurt een
   paar uur), Play erachteraan. Play is binnen het uur zichtbaar.
5. De website omzetten met één commando, als allebei de winkeladressen echt
   opengaan:

   ```bash
   npm run live -- --apple 6751234567 --google
   ```

   Dat vult `STORE` in `src/site/links.ts` en zet de site opnieuw: het blok
   "binnenkort" verdwijnt, de balk onderaan wordt een downloadknop, en de twee
   winkelknoppen worden echt. Het Apple ID staat in App Store Connect bij
   *App Information*; het Play-adres weet het script zelf. Klopt er iets niet,
   dan brengt `npm run live -- --uit` je terug.

## Waar het van afhangt

Niets meer aan papierwerk. De handelaarsverificatie voor de Digital Services
Act is op 24 september goedgekeurd en je handelaarsgegevens staan live in de
App Store in de hele Europese Unie. Dat was het enige dat een betaalde app in
de EU kon tegenhouden zonder dat het op een bouwfout leek.

Wat overblijft zijn twee beoordelingen die allebei al lopen: build 5 bij Apple
en 1.1 bij Play. Apple doet er doorgaans één tot drie dagen over, Play iets
langer bij een eerste release. Alles wat hierboven nog openstaat kan daarnaast
en houdt die datum niet tegen.

Realistisch voor allebei: **maandag 29 september tot vrijdag 3 oktober**.

Eén ding om te onthouden voor later: de iOS-build loopt via de Mac en Xcode.
Play kan zonder, Apple niet. Wie een spoedreparatie moet uitbrengen heeft die
machine nodig — reken op een uur, niet op tien minuten.
