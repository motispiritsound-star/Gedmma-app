# Waar staan we

Bijgewerkt op 22 september 2026. Dit bestand is het antwoord op "wat moet er
nog" zonder dat je drie andere bestanden hoeft te lezen.

## De app

| | |
| --- | --- |
| Inhoud | 17 units, 432 opnames, 304 woorden — af |
| Website | 8 pagina's × 6 talen, nagekeken op dode links en losse eindjes |
| Tests | 158, groen |
| Google Play | ingediend, wacht op beoordeling |
| App Store | **wacht op de iOS-build** — zie `docs/MAC.md` |

### Wat alleen jij kunt doen

1. **De Mac.** macOS bijwerken naar 26.6 of nieuwer, dan Xcode, dan de stappen
   in `docs/MAC.md`. Dit is de enige weg naar de App Store.
2. **Apple: handelaarsverificatie (DSA).** In behandeling sinds 19 september.
   Niets aan te doen behalve wachten.
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
| Blz | 33 | 42 | 35 | 29 | 31 | 46 | 31 | 29 | 15 | 16 | 15 | 15 | 15 | 16 | 19 |

De delen 1 tot en met 8 zijn uitgeschreven. **De delen 9 tot en met 15 niet** —
die staan nog op de opzet van zes hoofdstukken. Verkoop die pas als ze er
staan, of zet erbij dat er gratis bijgewerkte versies komen; dat laatste staat
al op de afrekenpagina.

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

## Wat er als laatste moet

1. De winkeladressen in `src/site/links.ts` (`STORE.apple`, `STORE.google`)
   zodra de app in beide winkels staat. Nu leeg, en dan tonen de knoppen niets
   in plaats van een link naar niets.
2. Beide winkels op **handmatig vrijgeven**, zodat jij de dag kiest.
3. De app zelf spelen: op een iPhone via TestFlight, op de Galaxy Tab via Play.
   De punten om op te letten staan in `docs/MAC.md` §D.

## Waar het van afhangt

Er is één ding dat alles vertraagt en dat is de iOS-build. Play kan live
zonder Apple; Apple kan niet live zonder de Mac. Alles wat hierboven nog
openstaat kan naast elkaar, behalve dat.
