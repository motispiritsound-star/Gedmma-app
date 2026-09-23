# Waar staan we

Bijgewerkt op 23 september 2026 (avond). Dit bestand is het antwoord op "wat moet er
nog" zonder dat je drie andere bestanden hoeft te lezen.

## De app

| | |
| --- | --- |
| Inhoud | 17 units, 432 opnames, 304 woorden — af |
| Website | 8 pagina's × 6 talen, nagekeken op dode links en losse eindjes |
| Tests | 512, groen |
| Google Play | versie 1.1 ingediend (submission 3), wacht op beoordeling |
| App Store | 1.0 (build 4) opnieuw ingediend met de EULA-link, wacht op beoordeling |

### Wat alleen jij kunt doen

1. **Apple: abonnementsprijzen per land.** Nakijken voor NL, BE, FR, DE, ES,
   IT en MA. Apple vult de rest af uit de prijs die je voor één land zet, en
   dat valt niet altijd goed uit.
2. **Apple: royaltyvaluta.** Bij de bankrekening staat USD. Zet dat op EUR,
   anders wordt er twee keer gewisseld op elke uitbetaling.
3. **Apple: DAC7.** Moet ingevuld voordat er uitbetaald kan worden. Het
   antwoord op "persoonlijke diensten" is **nee** — dat gaat over werk van
   mensen per uur of per klus, en dit is een app.
4. **Google: bankrekening en belastinggegevens.** Zonder dat geen uitbetaling,
   ook niet als de app al verkoopt.

### Nog uit te zoeken

De winkelteksten in App Store Connect lopen niet gelijk met
`store/listing.*.md`. Bij **French (Canada)** staat de Engelse tekst, en het
tekenaantal klopt niet met wat hier in de map zit — daar stond 528 over waar
het bestand er 131 voorspelde. Een van beide is verouderd. Uitzoeken welke,
en dan de winkel of de map bijtrekken.

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

Alle vijftien delen zijn uitgeschreven, en alle vijftien staan ook in het
**Frans** en in het **Duits**. Spaans, Italiaans en Engels moeten nog.

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
