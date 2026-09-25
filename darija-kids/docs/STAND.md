# Waar staan we

Bijgewerkt op 24 september 2026. Dit bestand is het antwoord op "wat moet er
nog" zonder dat je drie andere bestanden hoeft te lezen.

## De app

| | |
| --- | --- |
| Inhoud | 17 units, 432 opnames, 304 woorden — af |
| Website | 8 pagina's × 6 talen, nagekeken op dode links en losse eindjes |
| Tests | 682, groen |
| Google Play | 2 (1.1) in review; 3 (1.2) is gebouwd en wacht op upload |
| App Store | 1.0 (build 5) ingediend, Waiting for Review |

Wat er in build 5 zit en niet in build 4: het antwoord op richtlijn 4.2
(microfoon, trillen, herinnering, breder op een iPad — zie `docs/APPLE-4.2.md`)
en de twee prijsreparaties (`$4.17` in plaats van `US$ 4,17`, en de prijzen
opnieuw ophalen zodra de app weer voor staat).

**Bouwen doe je met `npm run ios`**, niet met `npx cap sync ios`. Dat zet ook
de twee regels in `Info.plist` — waaronder die voor de microfoon, en zonder
die regel sluit iOS de app af zodra een kind op de opnameknop drukt.

Het antwoord aan App Review staat klaar in `store/appstore-4.2-antwoord.md`.

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

### Wat alleen jij kunt doen

1. **Apple: prijsbasis op Nederland.** De prijzen staan goed — Nederland op
   € 59,99 en € 6,99 — maar ze zijn aangemaakt met de Verenigde Staten als
   uitgangspunt en de eurolanden zijn daarna met de hand bijgewerkt. Daardoor
   staat Montenegro nog op € 49,99 en Marokko op $ 59,99, meer dan een
   Amerikaan betaalt. Opnieuw instellen met *Recalculate prices* vanuit
   Nederland, en daarna alleen Marokko met de hand verlagen.
2. **Apple: Engelse naam en beschrijving van de abonnementen.** Daar staat nu
   de appnaam met een Nederlandse zin eronder, en dat is de vermelding voor de
   hele wereld buiten Nederland. Moet worden: `One year` met
   `All 17 units, 304 words and 100 sentences.`, en `Monthly` bij de andere.
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

**Het begin van De sleutels staat gratis op darijaforkids.eu/leesboeken**, in
zes talen, zonder account en zonder e-mailadres: de eerste drie hoofdstukken
van *De olijvenbrand*, ruim vier bladzijden verhaal, en het houdt op vlak
vóór er iets misgaat. Gemaakt met `npm run sleutels -- --deel 1 --tot 3`.

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
   Settings → Advanced → Ping:

   ```
   https://post.darijaforkids.eu/koop?s=<de waarde van KOOP_GEHEIM>
   ```

   Zonder die melding blijft de bibliotheek van een koper leeg terwijl hij wél
   betaald heeft, en dat is de ergste soort bug: hij lijkt op diefstal.

   `/koop` neemt sinds kort ook de kale ping van Gumroad aan — een gewone
   formulierpost, met het geheim in het adres, want Gumroad kan geen eigen
   koppen sturen. Het vertaalt zelf het productadres naar de reeks, raadt de
   taal uit het land van de koper, en herkent de proefmelding uit het
   instellingenscherm. Hoe je het controleert staat in `server/LEES-MIJ.md`.
2. **Zelf een keer het hele rondje lopen**: kopen, mail, aanmelden, inloggen,
   en kijken of het boek er staat.

### De lezer op de website

Na het inloggen staat er per gekochte reeks een knop *Lezen en luisteren*.
Daarachter zit het boek als tekst, in zinnen geknipt, met een voorleesbalk
erboven: de stem van het toestel zelf leest voor en de zin die klinkt licht
op. Geen opnames — die kosten geld, en dit onderdeel mocht niets kosten tot
er iets verdiend wordt.

`npm run portaalcheck` loopt dat hele rondje na in een echte browser, met de
antwoorden van de worker erbij verzonnen. Geen database, geen mail, geen
internet nodig.

**Wat er nog moet: de boeken in de bak.** De lezer haalt elk boek apart op uit
R2, en die bak staat nog uit. Zolang dat zo is, krijgt een koper die inlogt
"niet ingericht" te zien. Twee opdrachten, één keer:

```bash
cd server && npm run maak-bak && cd ..
npm run lezen -- --r2
```

De eerste maakt de bak, zet de binding aan en rolt uit; de tweede zet er de
negentig leesboeken in — vijftien delen in zes talen, samen twee megabyte.

De prentenboeken van Sba zijn bladzijden als plaatje en moeten eerst geschoten
worden (`npm run bladen -- --taal nl --uploaden`). Dat duurt lang en heeft een
browser nodig. Tot die tijd opent Sba niet in de lezer; de pdf uit de winkel
werkt gewoon.

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
