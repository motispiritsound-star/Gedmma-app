# Wat er mis is, en wat er al goed is

Gemeten op 2 oktober 2026, op de code die er die dag stond. Dit is geen
wensenlijst maar een meting: elk punt hieronder is nagegaan op het scherm of in
de bron, en bij elk punt staat hoe.

Wat ik **niet** heb kunnen nakijken staat onderaan, apart. Dat is geen
slordigheid maar het eerlijke antwoord: deze omgeving komt niet op elk adres.

## P0 — de voordeur is dicht

**De winkelknoppen op darijaforkids.eu zijn geen knoppen.**

```html
<span class="store" aria-disabled="true">
  <span class="small">Coming soon</span><span class="big">App Store</span>
</span>
```

Geen `<a>`, geen adres, `aria-disabled="true"`, en het woord "Coming soon"
eronder. Dat was juist zolang er niets te downloaden viel. Sinds 2 oktober
staat 1.0 in de App Store, en nu zegt de voordeur van het product dat het
product nog niet bestaat.

Dit is het enige punt in de hele audit waar bezoek verloren gaat. Alles
hieronder gaat over beter maken; dit gaat over werken.

**Wat eraan te doen is.** `src/site/links.ts` is het enige bestand dat
verandert, en `scripts/live.mjs` doet het:

```
npm run live -- --apple <het Apple ID uit App Store Connect>
```

Het nummer staat in App Store Connect bij *App Information → Apple ID*, of in
de deellink van de app. Alles wat die geeft mag erin: het kale nummer,
`id6751234567`, of de lange link.

Google blijft tot de goedkeuring op "binnenkort" staan, en dat hoort: een knop
naar een Play-pagina die nog niet bestaat is erger dan geen knop. De twee
knoppen staan los van elkaar in `make-site.mjs`, dus Apple aanzetten laat
Google met rust.

## P1 — wat er deze ronde bij is gekomen

**Het startscherm vraagt nu hoe je meeleest.** `showScript` en `showTranslit`
bepalen wat er op elk woordkaartje en in elke oefening staat — Arabisch
schrift, de klanken in ons alfabet, of allebei. Dat is de keuze die het meest
uitmaakt voor een beginner, en hij stond in Instellingen, drie schermen diep.

Elke optie laat zien wat het wordt (`الدار`, `ddar`, of allebei) in plaats van
het uit te leggen. Een ouder weet meteen wat zijn kind kan lezen.

**Het dagdoel staat er met opzet niet bij.** Wat "30 XP per dag" betekent weet
je pas na een week. Dat vragen vóór de eerste les is een keuze zonder
informatie, en die hoort niet in een startscherm thuis.

## Wat al goed was, en waarom ik het meet in plaats van aanneem

| | Gemeten |
|---|---|
| Afbeeldingen op de site | 21 stuks, **alle** met een `alt`: tien met tekst, elf bewust leeg voor decoratie. Dat laatste is juist, geen omissie |
| Externe uitgangen in de app | **twee**, allebei `mailto:` naar het eigen adres, allebei achter de ouderpoort — de poort staat vóór het hele venster, niet voor de losse link |
| Ouderpoort op aankopen | staat er, op abonneren én op beheren |
| Meldingen | een lokale wekker, geen pushbericht. Geen server, geen token, standaard uit, één per dag op een tijd die de ouder kiest |
| Verkoopmelding | bestaat niet. Er is geen enkele melding die iets aanbiedt |
| Trackers | **nul**, in de app en op de site. Geen Analytics, geen pixel, geen Sentry, geen Firebase |
| Horizontale overloop | geen, op 390 en op 1440 |
| `lang` en titel | correct per taal |

Die laatste drie regels zijn de reden dat deze app in de kindercategorie kán
staan. Apple's eis is dat er niets identificeerbaars naar derden gaat "even in
sections intended for adults" — hier gaat er helemaal niets naar derden, omdat
er geen derden zijn.

## Kleinere punten, niet gerepareerd

**Raakvlakken van 42 pixels.** De pijlen van de carrousel en de vier
sociale-media-iconen op de site zijn 42×42. De app houdt 44 aan, en dat is ook
de norm. Twee pixels, op de website, buiten een leerscherm — genoteerd in de
achterstand, niet vanavond gedaan.

**De landingsbladzijde is 10.904 pixels hoog op een telefoon.** Dat is lang.
Of het te lang is weet ik niet zonder te kijken hoe ver bezoekers komen, en
die cijfers zijn er niet (geen analytics, met opzet). Niets aan doen op een
vermoeden.

## Wat ik niet heb kunnen nakijken

Eerlijk, want een audit die zwijgt over zijn blinde vlekken is erger dan geen
audit.

| | |
|---|---|
| `darijaforkids.eu` live | geblokkeerd door de uitgaande proxy. Ik heb de gegenereerde site in `site/` gemeten; dat is wat er uitgerold wordt, maar niet het bewijs dat het er zo staat |
| Google Play-beleid (`play.google`, `support.google.com`) | allebei geblokkeerd. Niet uit het geheugen geciteerd |
| Play Console → Android Vitals | geen toegang vanaf hier, en dat gaat ook niet met een sleutel: dat scherm heeft een ingelogde sessie nodig. Wel bereikbaar met `npm run crashes`, dat dezelfde cijfers via de Reporting API haalt |
| Apple | **wel** bereikbaar en gelezen: de App Review Guidelines en de pagina over de kindercategorie |
| Het e-boek in de Android-WebView | nog niet op een toestel gezien |
| De schrijfwijzer in de zon | niet te meten zonder zon |
