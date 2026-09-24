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

1. **Apple: handelaarsverificatie — document opsturen.** Developer Support
   vraagt om een stuk waarop je naam staat zoals die in App Store Connect is
   ingevuld, plus het adres. Een KvK-uittreksel dekt allebei. Let op dat het
   adres op het uittreksel letterlijk gelijk is aan wat er in App Store
   Connect staat: per 1 januari 2026 is dat Bussum en niet meer Veenendaal.
   Uploaden gaat via de link in de aparte mail van AppleSupport, daarna
   antwoorden op de mail van Developer Support.
2. **Apple: abonnementsprijzen per land.** Nakijken voor NL, BE, FR, DE, ES,
   IT en MA. Apple vult de rest af uit de prijs die je voor één land zet, en
   dat valt niet altijd goed uit.
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

De tekeningen erin zijn vectortekeningen. Zodra er geschilderde platen in
`store/prentenboek/platen/<deel>/` staan, gebruikt de zetter die. De 144
opdrachten daarvoor staan in `store/prentenboek/platenlijst.md`.

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

Klaar om gevuld te worden. Zie `docs/WINKEL-INRICHTEN.md`.

| Stap | Status |
| --- | --- |
| Alle 27 boeken als PDF | `npm run winkel`, staat in `store/winkel/` |
| Uploadlijst met prijs, bestand en producttekst | `store/winkel/producten.md` |
| Plek in de code voor de betaallinks | `src/site/shop.ts`, blok `LINKS` |
| Afrekenpagina op de site | staat er, in zes talen |
| Account bij een merchant of record | **jij** |
| Eerste product aanmaken en zelf kopen | **jij** |

Zolang een link leeg is, staat er "Binnenkort" en geen dode knop. Je kunt dus
per deel opengaan.

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

De volgorde die een aankondiging mogelijk maakt: eerst laten goedkeuren, dan
vasthouden, dan pas vrijgeven. Een winkel die bij goedkeuring meteen
publiceert, bepaalt zelf je lanceerdag — en dan staat de app al in de winkel
terwijl de eerste teaser nog moet komen.

1. **Play op handmatig.** Publishing overview → Manage → *Managed publishing*
   aan. Dan blijft een goedgekeurde release staan tot jij op publiceren drukt.
   Doe dit zolang submission 3 nog in review is; erna is het te laat.
2. **Apple op handmatig.** Bij het inzenden van de versie: *Manually release
   this version*. Niet "automatically".
3. De winkeladressen in `src/site/links.ts` (`STORE.apple`, `STORE.google`)
   zodra beide winkels een adres hebben. Nu leeg, en dan tonen de knoppen
   niets in plaats van een link naar niets.
4. De app zelf spelen: op een iPhone via TestFlight, op de Galaxy Tab via Play.
   De punten om op te letten staan in `docs/MAC.md` §D.
5. Vrijgeven: eerst Apple (de goedkeuring is er dan al, publiceren duurt een
   paar uur), Play erachteraan. Play is binnen het uur zichtbaar.

## Waar het van afhangt

Er is één ding dat alles vertraagt en dat is de iOS-build. Play kan live
zonder Apple; Apple kan niet live zonder de Mac. Alles wat hierboven nog
openstaat kan naast elkaar, behalve dat.

En één ding dat een lancering in Europa tegenhoudt zonder dat het op een
bouwfout lijkt: **de handelaarsverificatie bij Apple**. Zolang die loopt, mag
een betaalde app in de EU niet verkocht worden. Controleer die status vóór je
een datum vastlegt.
